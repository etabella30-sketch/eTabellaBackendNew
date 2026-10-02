import * as jwt from 'jsonwebtoken';
import {
    DbEdgeBoxRegistry, DbEdgeUserDirectory, EDGE_BOX_SQL, EDGE_MEMBER_CASES_SQL, EDGE_USER_SQL, edgeBoxFromDb, edgeMemberCasesFromDb,
    edgeUserFromDb, JwtCloudSession, resolveCloudSession,
} from './edge-token.directory';

// The database and Redis are jest.fn() fakes; the SQL is asserted, never executed.

const BOX = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER = '11111111-1111-4111-8111-111111111111';
const CASE_A = 'ca000000-0000-4000-8000-00000000000a';
const CASE_B = 'cb000000-0000-4000-8000-00000000000b';
const SECRET = 'unit-test-secret';

const ok = (data: any[]) => ({ success: true, data });
const failed = { success: false, error: 'relation "RtEdgeNode" does not exist' };

describe('edge box / user SQL', () => {
    it('finds only live boxes, with their status, slug and assigned cases', () => {
        expect(EDGE_BOX_SQL).toContain('FROM "RtEdgeNode" n');
        expect(EDGE_BOX_SQL).toContain('LEFT JOIN "RtEdgeCase" c ON c."nEdgeid" = n."nEdgeid"');
        expect(EDGE_BOX_SQL).toContain('n."dDelDt" IS NULL');
        expect(EDGE_BOX_SQL).toContain('n."nEdgeid" = $1::uuid');
    });

    it('membership = active case-team rows or an assignment to a live session of the case, limited to the candidates', () => {
        expect(EDGE_MEMBER_CASES_SQL).toContain(`"TeamRelation" t`);
        expect(EDGE_MEMBER_CASES_SQL).toContain(`t."cStatus" = 'A'`);
        expect(EDGE_MEMBER_CASES_SQL).toContain('t."nCaseid" = ANY($2::uuid[])');
        expect(EDGE_MEMBER_CASES_SQL).toContain('JOIN "RSessionMaster" r ON r."nSesid" = d."nSesid" AND r."dDelDt" IS NULL');
        expect(EDGE_MEMBER_CASES_SQL).toContain('r."nCaseid" = ANY($2::uuid[])');
    });

    it('a user is active by the et_signin rule', () => {
        expect(EDGE_USER_SQL).toContain(`(u."cStatus" = 'A') AS "bActive"`);
    });
});

describe('edgeBoxFromDb', () => {
    it('maps the row: lower-case ids, trimmed slug and status, cases as a de-duplicated uuid list', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([{ nEdgeid: BOX.toUpperCase(), cSlug: ' k7q2m9x4 ', cStatus: 'A ', caseIds: [CASE_A.toUpperCase(), CASE_A, 'junk', null] }])) };
        await expect(edgeBoxFromDb(db, BOX)).resolves.toEqual({ nEdgeid: BOX, cSlug: 'k7q2m9x4', cStatus: 'A', caseIds: [CASE_A] });
        expect(db.rowQuery).toHaveBeenCalledWith(EDGE_BOX_SQL, [BOX]);
    });

    it('reads a Postgres array literal too', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([{ nEdgeid: BOX, cSlug: 's', cStatus: 'A', caseIds: `{${CASE_A},${CASE_B}}` }])) };
        await expect(edgeBoxFromDb(db, BOX)).resolves.toMatchObject({ caseIds: [CASE_A, CASE_B] });
    });

    it('null for no row or a non-uuid id (no query); throws on a failed query without echoing the SQL', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([])) };
        await expect(edgeBoxFromDb(db, BOX)).resolves.toBeNull();
        await expect(edgeBoxFromDb(db, "x' OR 1=1 --")).resolves.toBeNull();
        expect(db.rowQuery).toHaveBeenCalledTimes(1);
        db.rowQuery.mockResolvedValue(failed);
        const err = await edgeBoxFromDb(db, BOX).then(() => null, (e: Error) => e);
        expect(err?.message).toBe('box lookup failed');
        expect(err?.message).not.toContain('RtEdgeNode');
    });

    it('DbEdgeBoxRegistry delegates to the database service', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([])) };
        await expect(new DbEdgeBoxRegistry(db as any).getBox(BOX)).resolves.toBeNull();
        expect(db.rowQuery).toHaveBeenCalledWith(EDGE_BOX_SQL, [BOX]);
    });
});

describe('edgeUserFromDb', () => {
    it('maps active and inactive users; null for none; throws on failure', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([{ nUserid: USER, cEmail: 'a@b.c', bActive: true }])) };
        await expect(edgeUserFromDb(db, USER)).resolves.toEqual({ nUserid: USER, cEmail: 'a@b.c', bActive: true });
        db.rowQuery.mockResolvedValue(ok([{ nUserid: USER, cEmail: null, bActive: 't' }]));
        await expect(edgeUserFromDb(db, USER)).resolves.toEqual({ nUserid: USER, cEmail: null, bActive: false });
        db.rowQuery.mockResolvedValue(ok([]));
        await expect(edgeUserFromDb(db, USER)).resolves.toBeNull();
        await expect(edgeUserFromDb(db, 'nope')).resolves.toBeNull();
        db.rowQuery.mockResolvedValue(failed);
        await expect(edgeUserFromDb(db, USER)).rejects.toThrow('user lookup failed');
    });
});

describe('edgeMemberCasesFromDb', () => {
    it('asks only about the candidates and returns only candidates', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([{ nCaseid: CASE_A.toUpperCase() }, { nCaseid: 'cf000000-0000-4000-8000-00000000000f' }])) };
        await expect(edgeMemberCasesFromDb(db, USER, [CASE_A, CASE_B.toUpperCase(), 'junk'])).resolves.toEqual([CASE_A]);
        expect(db.rowQuery).toHaveBeenCalledWith(EDGE_MEMBER_CASES_SQL, [USER, [CASE_A, CASE_B]]);
    });

    it('no candidates or a bad user id: no query; a failed query throws (never "no cases")', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(failed) };
        await expect(edgeMemberCasesFromDb(db, USER, [])).resolves.toEqual([]);
        await expect(edgeMemberCasesFromDb(db, 'nope', [CASE_A])).resolves.toEqual([]);
        expect(db.rowQuery).not.toHaveBeenCalled();
        await expect(edgeMemberCasesFromDb(db, USER, [CASE_A])).rejects.toThrow('membership lookup failed');
    });

    it('DbEdgeUserDirectory delegates both lookups', async () => {
        const db = { rowQuery: jest.fn().mockResolvedValue(ok([])) };
        const dir = new DbEdgeUserDirectory(db as any);
        await dir.getUser(USER);
        await dir.memberCaseIds(USER, [CASE_A]);
        expect(db.rowQuery.mock.calls.map(c => c[0])).toEqual([EDGE_USER_SQL, EDGE_MEMBER_CASES_SQL]);
    });
});

describe('resolveCloudSession (the etabella.net sign-in behind edge/authorize)', () => {
    const iat = 1_790_000_000;
    const token = (claims: object = {}, secret = SECRET, opts: jwt.SignOptions = {}) =>
        jwt.sign({ userId: USER, broweserId: 'browser-1', iat: Math.floor(Date.now() / 1000) - 60, ...claims }, secret, opts);
    const bound = jest.fn(async (_key: string) => JSON.stringify({ id: 'browser-1', a: false }));

    beforeEach(() => bound.mockClear());

    it('returns the user and the sign-in time for a signed, unexpired, still-bound token', async () => {
        // One clock read: the token's iat and the expected authTime must be the same second.
        const signedInAt = Math.floor(Date.now() / 1000) - 3600;
        const t = token({ iat: signedInAt });
        await expect(resolveCloudSession(t, SECRET, bound)).resolves.toEqual({ nUserid: USER, authTime: signedInAt });
        expect(bound).toHaveBeenCalledWith(`user/${USER}`);
    });

    it('null for a missing token or secret, a wrong secret, an expired token, HS512 or alg=none', async () => {
        await expect(resolveCloudSession(undefined, SECRET, bound)).resolves.toBeNull();
        await expect(resolveCloudSession(token(), '', bound)).resolves.toBeNull();
        await expect(resolveCloudSession(token({}, 'other-secret'), SECRET, bound)).resolves.toBeNull();
        await expect(resolveCloudSession(token({ exp: iat + 1, iat }), SECRET, bound)).resolves.toBeNull();
        await expect(resolveCloudSession(token({}, SECRET, { algorithm: 'HS512' }), SECRET, bound)).resolves.toBeNull();
        const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({ userId: USER, broweserId: 'browser-1', iat })).toString('base64url')}.`;
        await expect(resolveCloudSession(none, SECRET, bound)).resolves.toBeNull();
        expect(bound).not.toHaveBeenCalled();
    });

    it('null after sign-out or a sign-in elsewhere (binding gone or replaced), or when Redis fails', async () => {
        await expect(resolveCloudSession(token(), SECRET, async () => null)).resolves.toBeNull();
        await expect(resolveCloudSession(token(), SECRET, async () => JSON.stringify({ id: 'browser-2' }))).resolves.toBeNull();
        await expect(resolveCloudSession(token(), SECRET, async () => '{broken')).resolves.toBeNull();
        await expect(resolveCloudSession(token(), SECRET, async () => { throw new Error('redis down'); })).resolves.toBeNull();
    });

    it('null without a uuid user, a browser id or an iat', async () => {
        await expect(resolveCloudSession(token({ userId: 'admin' }), SECRET, bound)).resolves.toBeNull();
        await expect(resolveCloudSession(token({ broweserId: undefined }), SECRET, bound)).resolves.toBeNull();
        await expect(resolveCloudSession(jwt.sign({ userId: USER, broweserId: 'browser-1' }, SECRET, { noTimestamp: true }), SECRET, bound)).resolves.toBeNull();
    });

    it('JwtCloudSession reads JWT_SECRET from config and the binding from Redis', async () => {
        const rds = { getValue: bound };
        const config = { get: jest.fn((k: string) => (k === 'JWT_SECRET' ? SECRET : undefined)) };
        const session = new JwtCloudSession(config as any, rds as any);
        await expect(session.resolve(token())).resolves.toMatchObject({ nUserid: USER });
        expect(config.get).toHaveBeenCalledWith('JWT_SECRET');
    });
});
