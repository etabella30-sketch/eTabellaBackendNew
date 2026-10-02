import {
    CLEAR_ACTIVE_LUA, EDGE_REVOKED_KEEP_MS, edgeStoreKeys, MemoryEdgeTokenStore, RedisEdgeTokenStore, ROTATE_ACTIVE_LUA, SWAP_ACTIVE_LUA,
} from './edge-token.store';
import { EdgeCodeGrant, EdgeIssuedClaims, EdgeTokenStore } from './edge-token.types';

// RedisEdgeTokenStore runs against an in-memory fake of the ioredis calls it makes (no Redis server). The fake runs
// the three Lua scripts as their JavaScript equivalent, so these specs pin the store's wiring and semantics, not Lua.

const USER = '11111111-1111-4111-8111-111111111111';
const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
let nowMs: number;

class FakeRedis {
    readonly kv = new Map<string, { v: string; until: number }>();
    readonly z = new Map<string, Map<string, number>>();
    readonly calls: Array<[string, ...any[]]> = [];
    failExec = false;

    private live(k: string) {
        const rec = this.kv.get(k);
        if (rec && rec.until <= nowMs) this.kv.delete(k);
        return this.kv.get(k);
    }
    async get(k: string) { this.calls.push(['get', k]); return this.live(k)?.v ?? null; }
    async set(k: string, v: string, ex: string, sec: number) {
        this.calls.push(['set', k, v, ex, sec]);
        if (ex !== 'EX' || !(sec > 0)) throw new Error('every key needs a TTL');
        this.kv.set(k, { v, until: nowMs + sec * 1000 });
        return 'OK';
    }
    async del(...keys: string[]) { let n = 0; for (const k of keys) if (this.live(k) && this.kv.delete(k)) n++; return n; }
    async exists(k: string) { return this.live(k) ? 1 : 0; }
    async zadd(k: string, score: number, member: string) {
        if (!this.z.has(k)) this.z.set(k, new Map());
        this.z.get(k).set(member, Number(score));
        return 1;
    }
    async zremrangebyscore(k: string, min: string | number, max: string | number) {
        const lo = min === '-inf' ? -Infinity : Number(min);
        const hi = max === '+inf' ? Infinity : Number(max);
        let n = 0;
        for (const [m, s] of this.z.get(k) ?? []) if (s >= lo && s <= hi) { this.z.get(k).delete(m); n++; }
        return n;
    }
    async zrangebyscore(k: string, min: number, max: string, withScores: string) {
        expect(max).toBe('+inf');
        expect(withScores).toBe('WITHSCORES');
        return [...(this.z.get(k) ?? [])].filter(([, s]) => s >= min).sort((a, b) => a[1] - b[1]).flatMap(([m, s]) => [m, String(s)]);
    }
    multi() {
        const ops: Array<() => Promise<any>> = [];
        const chain: any = {
            get: (k: string) => (ops.push(() => this.get(k)), chain),
            del: (k: string) => (ops.push(() => this.del(k)), chain),
            set: (k: string, v: string, ex: string, sec: number) => (ops.push(() => this.set(k, v, ex, sec)), chain),
            zadd: (k: string, s: number, m: string) => (ops.push(() => this.zadd(k, s, m)), chain),
            zremrangebyscore: (k: string, a: any, b: any) => (ops.push(() => this.zremrangebyscore(k, a, b)), chain),
            exec: async () => {
                if (this.failExec) return ops.map(() => [new Error('EXECABORT'), null]);
                const out: any[] = [];
                for (const op of ops) out.push([null, await op()]); // MULTI/EXEC: no other command interleaves
                return out;
            },
        };
        return chain;
    }
    async eval(script: string, numKeys: number, ...rest: string[]) {
        const name = script === SWAP_ACTIVE_LUA ? 'swap' : script === ROTATE_ACTIVE_LUA ? 'rotate' : script === CLEAR_ACTIVE_LUA ? 'clear' : '?';
        this.calls.push(['eval', name, ...rest]);
        expect(numKeys).toBe(name === 'rotate' ? 2 : 1);
        const [key, ...args] = rest;
        const cur = this.live(key)?.v ?? null;
        if (name === 'swap') {
            const [expected, next, ttl] = args;
            if (expected !== '' && cur !== expected) return [0, cur ?? ''];
            this.kv.set(key, { v: next, until: nowMs + Number(ttl) * 1000 });
            return [1, cur ?? ''];
        }
        if (name === 'rotate') {
            const [succKey, expected, next, ttl, successor, grace] = args;
            if (cur !== expected) return [0, cur ?? ''];
            this.kv.set(key, { v: next, until: nowMs + Number(ttl) * 1000 });
            this.kv.set(succKey, { v: successor, until: nowMs + Number(grace) * 1000 });
            return [1, cur];
        }
        if (name === 'clear') return cur === args[0] ? this.del(key) : 0;
        throw new Error('unknown script');
    }
}

const grant = (over: Partial<EdgeCodeGrant> = {}): EdgeCodeGrant => ({
    nUserid: USER, nEdgeid: BOX, cc: 'c'.repeat(43), state: 's'.repeat(20), redirectUri: 'https://k7.etabella-edge.net/auth/callback',
    redirectUriGiven: false, authTime: 1_790_000_000, issuedAt: 1, expiresAt: 60_001, ...over,
});

const issued = (jti: string, at = 1_790_000_100_000): EdgeIssuedClaims => ({
    claims: {
        iss: 'etabella-authapi', sub: USER, userId: USER, aud: `edge:${BOX}`, edge: BOX, cases: ['ca000000-0000-4000-8000-00000000000a'],
        scope: 'rt', jti, iat: 1_790_000_100, exp: 1_790_043_300, auth_time: 1_790_000_000,
    },
    at,
});

const stores: Array<[string, () => { store: EdgeTokenStore; redis?: FakeRedis }]> = [
    ['MemoryEdgeTokenStore', () => ({ store: new MemoryEdgeTokenStore(() => nowMs) })],
    ['RedisEdgeTokenStore', () => { const redis = new FakeRedis(); return { store: new RedisEdgeTokenStore(redis as any), redis }; }],
];

describe.each(stores)('%s', (_name, make) => {
    let store: EdgeTokenStore;

    beforeEach(() => {
        nowMs = Date.UTC(2026, 9, 1, 8);
        store = make().store;
    });

    it('a code is taken once; later takes see the tombstone, then nothing once it lapses', async () => {
        await store.saveCode('h1', grant(), 600);
        await expect(store.takeCode('h1', 600)).resolves.toEqual({ status: 'ok', grant: grant() });
        await expect(store.takeCode('h1', 600)).resolves.toEqual({ status: 'used', grant: grant(), jti: undefined });
        await store.markCodeRedeemed('h1', grant(), issued('jti-1'), 600);
        await expect(store.takeCode('h1', 600)).resolves.toEqual({ status: 'used', grant: grant(), jti: 'jti-1', issued: issued('jti-1') });
        nowMs += 601_000;
        await expect(store.takeCode('h1', 600)).resolves.toEqual({ status: 'unknown' });
        await expect(store.takeCode('never-saved', 600)).resolves.toEqual({ status: 'unknown' });
    });

    it('an unredeemed code lapses after its retain time', async () => {
        await store.saveCode('h2', grant(), 600);
        nowMs += 600_000;
        await expect(store.takeCode('h2', 600)).resolves.toEqual({ status: 'unknown' });
    });

    it('swaps the active token unconditionally or as a compare-and-set, and clears only the named one', async () => {
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        await expect(store.swapActiveJti(USER, BOX, null, 'j1', 3600)).resolves.toEqual({ ok: true, previous: null });
        await expect(store.swapActiveJti(USER, BOX, null, 'j2', 3600)).resolves.toEqual({ ok: true, previous: 'j1' });
        await expect(store.swapActiveJti(USER, BOX, 'j1', 'j3', 3600)).resolves.toEqual({ ok: false, previous: 'j2' });
        await expect(store.swapActiveJti(USER, BOX, 'j2', 'j3', 3600)).resolves.toEqual({ ok: true, previous: 'j2' });
        await expect(store.getActiveJti(USER.toUpperCase(), BOX.toUpperCase())).resolves.toBe('j3');
        await store.clearActiveJti(USER, BOX, 'j2');
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe('j3');
        await store.clearActiveJti(USER, BOX, 'j3');
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
    });

    it('a renewal is a compare-and-set that records the successor under the replaced jti, together or not at all', async () => {
        await store.swapActiveJti(USER, BOX, null, 'j1', 3600);
        await expect(store.rotateActiveJti(USER, BOX, 'j0', 'j2', 3600, issued('j2'), 120)).resolves.toEqual({ ok: false, previous: 'j1' });
        await expect(store.getSuccessor('j0')).resolves.toBeNull();
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe('j1');

        await expect(store.rotateActiveJti(USER, BOX, 'j1', 'j2', 3600, issued('j2'), 120)).resolves.toEqual({ ok: true, previous: 'j1' });
        await expect(store.getActiveJti(USER.toUpperCase(), BOX)).resolves.toBe('j2');
        await expect(store.getSuccessor('j1')).resolves.toEqual(issued('j2'));
        // The loser of a concurrent renewal of j1 finds the winner's successor.
        await expect(store.rotateActiveJti(USER, BOX, 'j1', 'j2b', 3600, issued('j2b'), 120)).resolves.toEqual({ ok: false, previous: 'j2' });
        await expect(store.getSuccessor('j1')).resolves.toEqual(issued('j2'));
        await expect(store.getSuccessor('j2')).resolves.toBeNull();
    });

    it('a renewal never starts from an empty slot, and its successor record lapses with the grace', async () => {
        await expect(store.rotateActiveJti(USER, BOX, 'j1', 'j2', 3600, issued('j2'), 120)).resolves.toEqual({ ok: false, previous: null });
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        await store.swapActiveJti(USER, BOX, null, 'j1', 3600);
        await store.rotateActiveJti(USER, BOX, 'j1', 'j2', 3600, issued('j2'), 120);
        nowMs += 119_999;
        await expect(store.getSuccessor('j1')).resolves.toEqual(issued('j2'));
        nowMs += 1;
        await expect(store.getSuccessor('j1')).resolves.toBeNull();
        await expect(store.getActiveJti(USER, BOX)).resolves.toBe('j2');
    });

    it('the active token lapses with its TTL', async () => {
        await store.swapActiveJti(USER, BOX, null, 'j1', 10);
        nowMs += 10_000;
        await expect(store.getActiveJti(USER, BOX)).resolves.toBeNull();
        await expect(store.swapActiveJti(USER, BOX, 'j1', 'j2', 10)).resolves.toEqual({ ok: false, previous: null });
    });

    it('revocations: listed oldest first from a time, lapse with their TTL, pruned past 25 h', async () => {
        const t0 = nowMs;
        await store.revokeJti('r1', 3600, t0);
        nowMs += 1000;
        await store.revokeJti('r2', 7200, t0 + 1000);
        await expect(store.isRevoked('r1')).resolves.toBe(true);
        await expect(store.isRevoked('r3')).resolves.toBe(false);
        await expect(store.revokedSince(0)).resolves.toEqual([{ jti: 'r1', at: t0 }, { jti: 'r2', at: t0 + 1000 }]);
        await expect(store.revokedSince(t0 + 1)).resolves.toEqual([{ jti: 'r2', at: t0 + 1000 }]);
        nowMs = t0 + 3600_000;
        await expect(store.isRevoked('r1')).resolves.toBe(false);
        await expect(store.isRevoked('r2')).resolves.toBe(true);
        const later = t0 + EDGE_REVOKED_KEEP_MS + 2000;
        nowMs = later;
        await store.revokeJti('r9', 60, later);
        await expect(store.revokedSince(0)).resolves.toEqual([{ jti: 'r9', at: later }]);
    });
});

describe('RedisEdgeTokenStore wiring', () => {
    beforeEach(() => { nowMs = Date.UTC(2026, 9, 1, 8); });

    it('stores codes under the hash with a TTL and never under the code itself', async () => {
        const redis = new FakeRedis();
        const store = new RedisEdgeTokenStore(redis as any);
        await store.saveCode('abc123', grant(), 600.2);
        expect(redis.calls[0]).toEqual(['set', 'edge:code:abc123', JSON.stringify(grant()), 'EX', 601]);
        await store.takeCode('abc123', 600);
        expect(redis.calls.find(c => c[0] === 'set' && c[1] === 'edge:code:used:abc123')).toBeDefined();
    });

    it('keys are lower case and named as documented for realtime-server', () => {
        expect(edgeStoreKeys.active(USER.toUpperCase(), BOX.toUpperCase())).toBe(`edge:active:${USER}:${BOX}`);
        expect(edgeStoreKeys.revoked('j')).toBe('edge:revoked:j');
        expect(edgeStoreKeys.revokedIndex).toBe('edge:revoked');
        expect(edgeStoreKeys.code('h')).toBe('edge:code:h');
        expect(edgeStoreKeys.usedCode('h')).toBe('edge:code:used:h');
        expect(edgeStoreKeys.successor('j')).toBe('edge:succ:j');
    });

    it('a renewal is one script over the active key and the successor key, with whole-second TTLs', async () => {
        const redis = new FakeRedis();
        const store = new RedisEdgeTokenStore(redis as any);
        await store.swapActiveJti(USER, BOX, null, 'j1', 3600);
        await store.rotateActiveJti(USER, BOX, 'j1', 'j2', 99.5, issued('j2'), 120);
        expect(redis.calls.filter(c => c[0] === 'eval')[1]).toEqual(
            ['eval', 'rotate', `edge:active:${USER}:${BOX}`, 'edge:succ:j1', 'j1', 'j2', '100', JSON.stringify(issued('j2')), '120'],
        );
        expect(redis.kv.get('edge:succ:j1')).toEqual({ v: JSON.stringify(issued('j2')), until: nowMs + 120_000 });
    });

    it('a redeemed code\'s tombstone carries the issued claims, never a token', async () => {
        const redis = new FakeRedis();
        const store = new RedisEdgeTokenStore(redis as any);
        await store.markCodeRedeemed('h', grant(), issued('j9'), 600);
        expect(redis.calls[0]).toEqual(['set', 'edge:code:used:h', JSON.stringify({ grant: grant(), jti: 'j9', issued: issued('j9') }), 'EX', 600]);
    });

    it('passes the compare-and-set arguments to the script ("" = unconditional) with a whole-second TTL', async () => {
        const redis = new FakeRedis();
        const store = new RedisEdgeTokenStore(redis as any);
        await store.swapActiveJti(USER, BOX, null, 'j1', 99.5);
        await store.swapActiveJti(USER, BOX, 'j1', 'j2', 0);
        await store.clearActiveJti(USER, BOX, 'j2');
        expect(redis.calls.filter(c => c[0] === 'eval')).toEqual([
            ['eval', 'swap', `edge:active:${USER}:${BOX}`, '', 'j1', '100'],
            ['eval', 'swap', `edge:active:${USER}:${BOX}`, 'j1', 'j2', '1'],
            ['eval', 'clear', `edge:active:${USER}:${BOX}`, 'j2'],
        ]);
    });

    it('a failed MULTI surfaces as an error, never as "unknown code"', async () => {
        const redis = new FakeRedis();
        const store = new RedisEdgeTokenStore(redis as any);
        await store.saveCode('h', grant(), 600);
        redis.failExec = true;
        await expect(store.takeCode('h', 600)).rejects.toThrow('EXECABORT');
    });

    it('the scripts compare before they write and delete only their own value', () => {
        expect(SWAP_ACTIVE_LUA).toContain(`if ARGV[1] ~= '' and cur ~= ARGV[1] then return {0, cur or ''} end`);
        expect(SWAP_ACTIVE_LUA).toContain(`redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))`);
        expect(CLEAR_ACTIVE_LUA).toContain(`if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end`);
        const lines = ROTATE_ACTIVE_LUA.split('\n');
        expect(lines[1]).toBe(`if cur ~= ARGV[1] then return {0, cur or ''} end`);
        expect(lines.slice(2, 4)).toEqual([
            `redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))`,
            `redis.call('SET', KEYS[2], ARGV[4], 'EX', tonumber(ARGV[5]))`,
        ]);
    });
});
