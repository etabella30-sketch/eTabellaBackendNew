import {
    EDGE_REVOCATION_OVERLAP_MS, EDGE_REVOCATION_REDIS_KEYS, EDGE_REVOKED_KEEP_MS, edgeRevocationsReply, EdgeRevocationList,
    parseEdgeRevokedIndex,
} from './revocation';

const H = 3600;
const T0 = Date.UTC(2026, 9, 1, 9, 0, 0);
const T0S = Math.floor(T0 / 1000);
const USER = '11111111-1111-4111-8111-111111111111';
const USER2 = '22222222-2222-4222-8222-222222222222';

describe('the cloud side: Redis keys and the revocations reply', () => {
    it('one definition of the keys authapi writes and realtime-server reads', () => {
        expect(EDGE_REVOCATION_REDIS_KEYS.jti('abc')).toBe('edge:revoked:abc');
        expect(EDGE_REVOCATION_REDIS_KEYS.index).toBe('edge:revoked');
        expect(EDGE_REVOKED_KEEP_MS).toBe(25 * H * 1000);
        expect(EDGE_REVOCATION_OVERLAP_MS).toBe(60_000);
    });

    it('parseEdgeRevokedIndex reads a ZRANGEBYSCORE WITHSCORES reply', () => {
        expect(parseEdgeRevokedIndex(['a', '100', 'b', 200])).toEqual([{ jti: 'a', at: 100 }, { jti: 'b', at: 200 }]);
        expect(parseEdgeRevokedIndex(['a', '100', 'dangling'])).toEqual([{ jti: 'a', at: 100 }]);
        expect(parseEdgeRevokedIndex([])).toEqual([]);
        expect(parseEdgeRevokedIndex(null)).toEqual([]);
    });

    it('edgeRevocationsReply lists each id once and hands back a cursor that overlaps the read', () => {
        expect(edgeRevocationsReply([{ jti: 'a', at: 1 }, { jti: 'b', at: 2 }, { jti: 'a', at: 3 }], T0)).toEqual({ jtis: ['a', 'b'], since: T0 - 60_000 });
        expect(edgeRevocationsReply([], 10_000)).toEqual({ jtis: [], since: 0 });
    });
});

describe('EdgeRevocationList (the box)', () => {
    it('refuses cloud-listed token ids, and only those', () => {
        const list = new EdgeRevocationList();
        expect(list.applyCloud({ users: [], jtis: ['j1', 'j2'], since: T0 - 60_000 }, T0)).toEqual({ jtis: ['j1', 'j2'], users: [] });
        expect(list.isRevoked('j1', USER, T0S)).toBe(true);
        expect(list.isRevoked('j2', USER2, 0)).toBe(true);
        expect(list.isRevoked('j3', USER, T0S)).toBe(false);
        expect(list.cursor).toBe(T0 - 60_000);
        // The next pull overlaps: already-listed ids are not reported again.
        expect(list.applyCloud({ jtis: ['j2', 'j3'], since: T0 }, T0 + 60_000)).toEqual({ jtis: ['j3'], users: [] });
        expect(list.cursor).toBe(T0);
        expect(list.size).toEqual({ jtis: 3, users: 0 });
    });

    it('cuts a listed user off for every token issued up to arrival + 5 min (clock skew), not after', () => {
        const list = new EdgeRevocationList();
        expect(list.applyCloud({ users: [USER.toUpperCase()] }, T0)).toEqual({ jtis: [], users: [USER] });
        expect(list.isRevoked('any', USER, T0S - 12 * H)).toBe(true);
        expect(list.isRevoked('any', USER.toUpperCase(), T0S + 300)).toBe(true);
        expect(list.isRevoked('any', USER, T0S + 301)).toBe(false);
        expect(list.isRevoked('any', USER2, T0S)).toBe(false);
        expect(list.isRevoked('any', 'operator:2026-10-01', T0S)).toBe(false);
        // Listed again by a later pull: the cut-off moves forward, never back.
        list.applyCloud({ users: [USER] }, T0 + 60_000);
        expect(list.isRevoked('any', USER, T0S + 360)).toBe(true);
        list.revokeUser(USER, T0S - 10 * H);
        expect(list.isRevoked('any', USER, T0S + 360)).toBe(true);
    });

    it('skips malformed entries and keeps the old cursor when the payload has none', () => {
        const list = new EdgeRevocationList();
        list.applyCloud({ since: 5 }, T0);
        expect(list.applyCloud({ users: ['nope', 7, null, ''], jtis: ['', 'j'.repeat(65), 9, null, 'ok'] } as any, T0)).toEqual({ jtis: ['ok'], users: [] });
        expect(list.cursor).toBe(5);
        expect(list.applyCloud(null, T0)).toEqual({ jtis: [], users: [] });
        expect(list.applyCloud({ jtis: 'j1' as any, users: {} as any, since: Number.NaN }, T0)).toEqual({ jtis: [], users: [] });
        expect(list.cursor).toBe(5);
        expect(() => list.applyCloud({ jtis: ['x'] }, Number.NaN)).toThrow(/receivedAtMs/);
    });

    it('the box\'s own denylist: revoke(jti) until the token\'s expiry, never shortened', () => {
        const list = new EdgeRevocationList();
        list.revoke('signed-out', T0S + 2 * H);
        list.revoke('signed-out', T0S + H);
        expect(list.isRevoked('signed-out', USER, T0S)).toBe(true);
        expect(list.toJSON().jtis).toEqual([['signed-out', T0S + 2 * H]]);
        expect(() => list.revoke('', T0S)).toThrow();
        expect(() => list.revoke('x', Number.NaN)).toThrow();
        expect(() => list.revokeUser('', T0S)).toThrow();
    });

    it('prunes entries once no token they match can still be valid', () => {
        const list = new EdgeRevocationList({ retainSec: H });
        list.applyCloud({ users: [USER], jtis: ['cloud'] }, T0);
        list.revoke('local', T0S + 3 * H);
        expect(list.prune(T0 + 30 * 60_000)).toBe(0);
        expect(list.prune(T0 + H * 1000 + 1000)).toBe(1); // the cloud jti (kept 1 h after arrival)
        expect(list.isRevoked('cloud', USER2, T0S)).toBe(false);
        expect(list.isRevoked('any', USER, T0S)).toBe(true); // user cut-off kept until cutoff (+5 min) + 1 h
        expect(list.prune(T0 + (H + 301) * 1000)).toBe(1);
        expect(list.isRevoked('any', USER, T0S)).toBe(false);
        expect(list.prune(T0 + 3 * H * 1000 + 1000)).toBe(1);
        expect(list.size).toEqual({ jtis: 0, users: 0 });
        expect(list.prune(Number.NaN)).toBe(0);
    });

    it('defaults keep cloud entries 24 h + 5 min (the longest token a revocation can match)', () => {
        const list = new EdgeRevocationList();
        list.applyCloud({ jtis: ['j'] }, T0);
        expect(list.prune(T0 + (24 * H + 300) * 1000)).toBe(0);
        expect(list.prune(T0 + (24 * H + 301) * 1000)).toBe(1);
    });

    it('survives a restart through toJSON / fromJSON; garbage restores empty', () => {
        const list = new EdgeRevocationList();
        list.applyCloud({ users: [USER], jtis: ['j1'], since: 1234 }, T0);
        list.revoke('local', T0S + H);
        const restored = EdgeRevocationList.fromJSON(JSON.parse(JSON.stringify(list.toJSON())));
        expect(restored.toJSON()).toEqual(list.toJSON());
        expect(restored.isRevoked('j1', USER2, 0)).toBe(true);
        expect(restored.isRevoked('x', USER, T0S)).toBe(true);
        expect(restored.cursor).toBe(1234);

        for (const junk of [null, 'x', { v: 2, jtis: [['j', 1]] }, { v: 1, jtis: 'x', users: 7 }]) {
            const empty = EdgeRevocationList.fromJSON(junk);
            expect(empty.size).toEqual({ jtis: 0, users: 0 });
            expect(empty.cursor).toBeNull();
        }
        const partial = EdgeRevocationList.fromJSON({ v: 1, jtis: [['ok', 5], ['', 5], ['bad', 'x'], 'row'], users: [[USER, 1, 2], ['', 1, 2], [USER2, 'x', 2]], cursor: -1 });
        expect(partial.toJSON()).toEqual({ v: 1, jtis: [['ok', 5]], users: [[USER, 1, 2]], cursor: null });
    });
});
