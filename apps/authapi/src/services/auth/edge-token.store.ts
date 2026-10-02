import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import type { Redis } from 'ioredis';
import { EDGE_REVOCATION_REDIS_KEYS, EDGE_REVOKED_KEEP_MS, parseEdgeRevokedIndex } from '@app/edge-token';
import { EdgeCodeGrant, EdgeCodeTake, EdgeIssuedClaims, EdgeRevokedJti, EdgeTokenStore } from './edge-token.types';

/**
 * Edge sign-in state: one-time codes, the one active token per (user, box), renewal successors, and revoked token ids.
 *
 * `RedisEdgeTokenStore` is the deployed one: every authapi instance shares it, and realtime-server reads the
 * revocation keys below to build `revocations{jtis, since}` for `e.hello` and the 60 s pull (spec §8.4).
 * `MemoryEdgeTokenStore` is for tests and single-process tools only.
 *
 * Redis keys (all with a TTL):
 *   edge:code:<sha256(code)>          grant JSON, until the code is taken (retain ≤ 10 min, logical life 60 s)
 *   edge:code:used:<sha256(code)>     tombstone {grant, jti?, issued?} after the first take (`issued` = the claims the
 *                                     code was redeemed for, so a lost response can be retried)
 *   edge:active:<nUserid>:<nEdgeid>   the active jti (TTL = that token's remaining life)
 *   edge:succ:<jti>                   {claims, at} of the token that renewed `jti`, for the retry grace (EDGE_RETRY_GRACE_SEC)
 *   edge:revoked:<jti>                "1" until the revoked token would have expired
 *   edge:revoked                      sorted set: member jti, score = revoked-at ms (pruned past 25 h)
 * No signed token is ever stored: a retry is answered by signing the recorded claims again.
 *
 * The two revocation keys and their retention are `@app/edge-token`'s (`EDGE_REVOCATION_REDIS_KEYS`,
 * `EDGE_REVOKED_KEEP_MS`), the one definition realtime-server reads them by.
 */

/** Revocation entries older than this are pruned: no edge token outlives auth_time + 24 h. */
export { EDGE_REVOKED_KEEP_MS } from '@app/edge-token';

export const edgeStoreKeys = {
    code: (codeHash: string) => `edge:code:${codeHash}`,
    usedCode: (codeHash: string) => `edge:code:used:${codeHash}`,
    active: (nUserid: string, nEdgeid: string) => `edge:active:${nUserid.toLowerCase()}:${nEdgeid.toLowerCase()}`,
    successor: (jti: string) => `edge:succ:${jti}`,
    revoked: EDGE_REVOCATION_REDIS_KEYS.jti,
    revokedIndex: EDGE_REVOCATION_REDIS_KEYS.index,
};

interface Tombstone {
    grant: EdgeCodeGrant;
    jti?: string;
    issued?: EdgeIssuedClaims;
}

const ttl = (sec: number) => Math.max(1, Math.ceil(sec));
/** A deep copy through JSON, as a Redis round trip makes one. */
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

/**
 * KEYS[1] active key. ARGV[1] expected jti ('' = unconditional), ARGV[2] next jti, ARGV[3] ttl seconds.
 * Returns {1|0, previous or ''}.
 */
export const SWAP_ACTIVE_LUA = `local cur = redis.call('GET', KEYS[1])
if ARGV[1] ~= '' and cur ~= ARGV[1] then return {0, cur or ''} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return {1, cur or ''}`;

/**
 * A renewal. KEYS[1] active key, KEYS[2] successor key of ARGV[1]. ARGV[1] expected jti, ARGV[2] next jti, ARGV[3] its
 * ttl seconds, ARGV[4] successor JSON, ARGV[5] grace seconds. The compare-and-set and the successor record are one
 * atomic step, so a concurrent renewal that loses the swap always finds the winner's successor. Returns {1|0, previous or ''}.
 */
export const ROTATE_ACTIVE_LUA = `local cur = redis.call('GET', KEYS[1])
if cur ~= ARGV[1] then return {0, cur or ''} end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
redis.call('SET', KEYS[2], ARGV[4], 'EX', tonumber(ARGV[5]))
return {1, cur}`;

/** KEYS[1] active key. ARGV[1] jti. Deletes the key only while it still holds that jti. */
export const CLEAR_ACTIVE_LUA = `if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end
return 0`;

@Injectable()
export class RedisEdgeTokenStore implements EdgeTokenStore {
    constructor(@InjectRedis() private readonly redis: Redis) { }

    async saveCode(codeHash: string, grant: EdgeCodeGrant, retainSec: number): Promise<void> {
        await this.redis.set(edgeStoreKeys.code(codeHash), JSON.stringify(grant), 'EX', ttl(retainSec));
    }

    async takeCode(codeHash: string, retainSec: number): Promise<EdgeCodeTake> {
        // GET + DEL in one MULTI: transactions run one after another, so exactly one caller sees DEL = 1.
        const replies = await this.redis.multi().get(edgeStoreKeys.code(codeHash)).del(edgeStoreKeys.code(codeHash)).exec();
        const [getReply, delReply] = replies ?? [];
        if (getReply?.[0] || delReply?.[0]) throw getReply?.[0] || delReply?.[0];
        const raw = getReply?.[1] as string | null;
        if (raw && delReply?.[1] === 1) {
            const grant = JSON.parse(raw) as EdgeCodeGrant;
            await this.redis.set(edgeStoreKeys.usedCode(codeHash), JSON.stringify({ grant } as Tombstone), 'EX', ttl(retainSec));
            return { status: 'ok', grant };
        }
        const used = await this.redis.get(edgeStoreKeys.usedCode(codeHash));
        if (!used) return { status: 'unknown' };
        const tomb = JSON.parse(used) as Tombstone;
        return { status: 'used', grant: tomb.grant, jti: tomb.jti, issued: tomb.issued };
    }

    async markCodeRedeemed(codeHash: string, grant: EdgeCodeGrant, issued: EdgeIssuedClaims, retainSec: number): Promise<void> {
        const tomb: Tombstone = { grant, jti: issued.claims.jti, issued };
        await this.redis.set(edgeStoreKeys.usedCode(codeHash), JSON.stringify(tomb), 'EX', ttl(retainSec));
    }

    async getActiveJti(nUserid: string, nEdgeid: string): Promise<string | null> {
        return (await this.redis.get(edgeStoreKeys.active(nUserid, nEdgeid))) || null;
    }

    async swapActiveJti(nUserid: string, nEdgeid: string, expected: string | null, next: string, ttlSec: number): Promise<{ ok: boolean; previous: string | null }> {
        const [ok, previous] = await this.redis.eval(SWAP_ACTIVE_LUA, 1, edgeStoreKeys.active(nUserid, nEdgeid), expected ?? '', next, String(ttl(ttlSec))) as [number, string];
        return { ok: Number(ok) === 1, previous: previous || null };
    }

    async rotateActiveJti(
        nUserid: string, nEdgeid: string, expected: string, next: string, ttlSec: number, successor: EdgeIssuedClaims, graceSec: number,
    ): Promise<{ ok: boolean; previous: string | null }> {
        const [ok, previous] = await this.redis.eval(
            ROTATE_ACTIVE_LUA, 2, edgeStoreKeys.active(nUserid, nEdgeid), edgeStoreKeys.successor(expected),
            expected, next, String(ttl(ttlSec)), JSON.stringify(successor), String(ttl(graceSec)),
        ) as [number, string];
        return { ok: Number(ok) === 1, previous: previous || null };
    }

    async getSuccessor(jti: string): Promise<EdgeIssuedClaims | null> {
        const raw = await this.redis.get(edgeStoreKeys.successor(jti));
        return raw ? JSON.parse(raw) as EdgeIssuedClaims : null;
    }

    async clearActiveJti(nUserid: string, nEdgeid: string, jti: string): Promise<void> {
        await this.redis.eval(CLEAR_ACTIVE_LUA, 1, edgeStoreKeys.active(nUserid, nEdgeid), jti);
    }

    async revokeJti(jti: string, ttlSec: number, atMs: number): Promise<void> {
        await this.redis.multi()
            .set(edgeStoreKeys.revoked(jti), '1', 'EX', ttl(ttlSec))
            .zadd(edgeStoreKeys.revokedIndex, atMs, jti)
            .zremrangebyscore(edgeStoreKeys.revokedIndex, '-inf', atMs - EDGE_REVOKED_KEEP_MS)
            .exec();
    }

    async isRevoked(jti: string): Promise<boolean> {
        return (await this.redis.exists(edgeStoreKeys.revoked(jti))) > 0;
    }

    async revokedSince(sinceMs: number): Promise<EdgeRevokedJti[]> {
        const flat = await this.redis.zrangebyscore(edgeStoreKeys.revokedIndex, Math.max(0, sinceMs), '+inf', 'WITHSCORES');
        return parseEdgeRevokedIndex(flat);
    }
}

/** In-process store with the same semantics, for specs and single-process tools. `now` is injectable. */
export class MemoryEdgeTokenStore implements EdgeTokenStore {
    private readonly codes = new Map<string, { grant: EdgeCodeGrant; until: number }>();
    private readonly used = new Map<string, { tomb: Tombstone; until: number }>();
    private readonly active = new Map<string, { jti: string; until: number }>();
    private readonly successors = new Map<string, { issued: EdgeIssuedClaims; until: number }>();
    private readonly revoked = new Map<string, { at: number; until: number }>();

    constructor(private readonly now: () => number = () => Date.now()) { }

    private live<T extends { until: number }>(map: Map<string, T>, key: string): T | undefined {
        const v = map.get(key);
        if (v && v.until <= this.now()) {
            map.delete(key);
            return undefined;
        }
        return v;
    }

    async saveCode(codeHash: string, grant: EdgeCodeGrant, retainSec: number): Promise<void> {
        this.codes.set(codeHash, { grant: { ...grant }, until: this.now() + ttl(retainSec) * 1000 });
    }

    async takeCode(codeHash: string, retainSec: number): Promise<EdgeCodeTake> {
        const rec = this.live(this.codes, codeHash);
        if (rec) {
            this.codes.delete(codeHash);
            this.used.set(codeHash, { tomb: { grant: rec.grant }, until: this.now() + ttl(retainSec) * 1000 });
            return { status: 'ok', grant: { ...rec.grant } };
        }
        const tomb = this.live(this.used, codeHash);
        if (!tomb) return { status: 'unknown' };
        const { grant, jti, issued } = clone(tomb.tomb);
        return { status: 'used', grant, jti, issued };
    }

    async markCodeRedeemed(codeHash: string, grant: EdgeCodeGrant, issued: EdgeIssuedClaims, retainSec: number): Promise<void> {
        this.used.set(codeHash, { tomb: clone({ grant, jti: issued.claims.jti, issued }), until: this.now() + ttl(retainSec) * 1000 });
    }

    async getActiveJti(nUserid: string, nEdgeid: string): Promise<string | null> {
        return this.live(this.active, edgeStoreKeys.active(nUserid, nEdgeid))?.jti ?? null;
    }

    async swapActiveJti(nUserid: string, nEdgeid: string, expected: string | null, next: string, ttlSec: number): Promise<{ ok: boolean; previous: string | null }> {
        const key = edgeStoreKeys.active(nUserid, nEdgeid);
        const previous = this.live(this.active, key)?.jti ?? null;
        if (expected !== null && previous !== expected) return { ok: false, previous };
        this.active.set(key, { jti: next, until: this.now() + ttl(ttlSec) * 1000 });
        return { ok: true, previous };
    }

    async rotateActiveJti(
        nUserid: string, nEdgeid: string, expected: string, next: string, ttlSec: number, successor: EdgeIssuedClaims, graceSec: number,
    ): Promise<{ ok: boolean; previous: string | null }> {
        // No await between the compare and the two writes: atomic, like the Lua script.
        const key = edgeStoreKeys.active(nUserid, nEdgeid);
        const previous = this.live(this.active, key)?.jti ?? null;
        if (previous !== expected) return { ok: false, previous };
        this.active.set(key, { jti: next, until: this.now() + ttl(ttlSec) * 1000 });
        this.successors.set(expected, { issued: clone(successor), until: this.now() + ttl(graceSec) * 1000 });
        return { ok: true, previous };
    }

    async getSuccessor(jti: string): Promise<EdgeIssuedClaims | null> {
        const rec = this.live(this.successors, jti);
        return rec ? clone(rec.issued) : null;
    }

    async clearActiveJti(nUserid: string, nEdgeid: string, jti: string): Promise<void> {
        const key = edgeStoreKeys.active(nUserid, nEdgeid);
        if (this.live(this.active, key)?.jti === jti) this.active.delete(key);
    }

    async revokeJti(jti: string, ttlSec: number, atMs: number): Promise<void> {
        this.revoked.set(jti, { at: atMs, until: this.now() + ttl(ttlSec) * 1000 });
        for (const [k, v] of this.revoked) if (v.at < atMs - EDGE_REVOKED_KEEP_MS) this.revoked.delete(k);
    }

    async isRevoked(jti: string): Promise<boolean> {
        return !!this.live(this.revoked, jti);
    }

    async revokedSince(sinceMs: number): Promise<EdgeRevokedJti[]> {
        return [...this.revoked.entries()]
            .filter(([, v]) => v.at >= sinceMs)
            .map(([jti, v]) => ({ jti, at: v.at }))
            .sort((a, b) => a.at - b.at);
    }
}
