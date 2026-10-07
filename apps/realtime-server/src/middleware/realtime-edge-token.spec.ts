import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { JWK, importJWK, SignJWT } from 'jose';
import {
  EDGE_TOKEN_ISSUER,
  EDGE_TOKEN_TYP,
  edgeAudience,
  edgeRoomTokenClaims,
  generateEdgeSigningKey,
  signEdgeBoxToken,
} from '@app/edge-token';

import { manifestRelayRows } from '@app/api-contracts';
import { IssueListParam } from '../interfaces/issue.interface';
import {
  RealtimeAuthBase,
  RealtimeAuthInjectMiddleware,
  RealtimeAuthMiddleware,
  RealtimeServiceOrAdminMiddleware,
  RealtimeTargetUserMiddleware,
  RealtimeVenueAuthMiddleware,
} from './realtime-auth.middleware';
import {
  absentId,
  EDGE_BOX_CASES_SQL,
  EDGE_SCOPE_ENTITY_SQL,
  EDGE_SCOPE_SESSIONS_SQL,
  EDGE_TOKEN_CASELESS_ROUTES,
  EDGE_TOKEN_ROUTES,
  EDGE_USER_ACTIVE_CACHE_MS,
  EDGE_USER_ACTIVE_SQL,
  EdgeTokenAuthenticator,
  isCaselessEdgeRoute,
  isEdgeTokenRoute,
  JWKS_REFRESH_MS,
  requestCases,
  uuidsIn,
} from './realtime-edge-token';

/*
 * D22 (spec §7 "Edge-token branch", §8.4): realtime-server accepts a venue box's edge token on the RT allowlist only,
 * for that box's cases only, as a non-admin; box-signed tokens never; everything else keeps the cookie JWT path.
 */

const ME = '11111111-1111-4111-8111-111111111111';
const BOX = 'b0c5b0c5-0000-4000-8000-0000000000b1';
const OTHER_BOX = 'b0c5b0c5-0000-4000-8000-0000000000b2';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';
const OTHER_CASE = 'ca5e0000-0000-4000-8000-0000000000c2';
const SES = '5e550000-0000-4000-8000-0000000000a1';
const OTHER_SES = '5e550000-0000-4000-8000-0000000000a2';
const FACT = 'fac70000-0000-4000-8000-0000000000f1';
const NOW_MS = Date.UTC(2026, 9, 5, 10, 0, 0);
const NOW = Math.floor(NOW_MS / 1000);
const SECRET = 'cloud-jwt-secret';

let signingKey: JWK;
let otherKey: JWK;
let jwks: string;

beforeAll(async () => {
  signingKey = await generateEdgeSigningKey('kid-active');
  otherKey = await generateEdgeSigningKey('kid-active');
  const { d: _d, ...pub } = signingKey as any;
  jwks = JSON.stringify({ keys: [pub] });
});

/** An edge token as authapi signs it (ES256, typ edge+jwt), claims overridable. */
async function edgeToken(claims: Record<string, any> = {}, opts: { key?: JWK; header?: Record<string, any> } = {}): Promise<string> {
  const payload = {
    iss: EDGE_TOKEN_ISSUER, sub: ME, userId: ME, aud: edgeAudience(BOX), edge: BOX, cases: [CASE], scope: 'rt',
    jti: randomUUID(), iat: NOW - 60, exp: NOW + 3600, auth_time: NOW - 120, ...claims,
  };
  const key = await importJWK(opts.key ?? signingKey, 'ES256');
  return new SignJWT(payload).setProtectedHeader({ alg: 'ES256', typ: EDGE_TOKEN_TYP, kid: 'kid-active', ...(opts.header ?? {}) }).sign(key);
}

interface DbAnswers {
  sessions?: Record<string, string | null>;
  facts?: Record<string, string | null>;
  boxCases?: string[];
  /** UserMaster: user id -> cStatus = 'A' (absent: no such user) */
  users?: Record<string, boolean>;
  fail?: 'sessions' | 'entity' | 'box' | 'user';
}

function makeDeps(opts: { env?: Record<string, any>; revoked?: string[]; revocationThrows?: boolean; db?: DbAnswers; fetchJson?: jest.Mock } = {}) {
  const env: Record<string, any> = { EDGE_ENABLED: '1', EDGE_TOKEN_JWKS: jwks, JWT_SECRET: SECRET, ...(opts.env ?? {}) };
  const answers: DbAnswers = { sessions: { [SES]: CASE, [OTHER_SES]: OTHER_CASE }, facts: { [FACT]: CASE }, boxCases: [CASE], users: { [ME]: true }, ...(opts.db ?? {}) };
  const db = {
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      if (sql === EDGE_USER_ACTIVE_SQL) {
        if (answers.fail === 'user') return { success: false, error: 'db down' };
        const active = answers.users![params[0]];
        return { success: true, data: active === undefined ? [] : [{ bActive: active }] };
      }
      if (sql === EDGE_SCOPE_SESSIONS_SQL) {
        if (answers.fail === 'sessions') return { success: false, error: 'db down' };
        return { success: true, data: params[0].filter((id: string) => answers.sessions![id] !== undefined).map((id: string) => ({ nSesid: id, nCaseid: answers.sessions![id] })) };
      }
      if (sql === EDGE_SCOPE_ENTITY_SQL.fact) {
        if (answers.fail === 'entity') return { success: false, error: 'db down' };
        return { success: true, data: params[0].filter((id: string) => answers.facts![id] !== undefined).map((id: string) => ({ nCaseid: answers.facts![id] })) };
      }
      if (sql === EDGE_BOX_CASES_SQL) {
        if (answers.fail === 'box') return { success: false, error: 'relation "RtEdgeCase" does not exist' };
        const [box, cases] = params;
        return { success: true, data: box === BOX ? cases.filter((c: string) => answers.boxCases!.includes(c)).map((c: string) => ({ nCaseid: c })) : [] };
      }
      if (Object.values(EDGE_SCOPE_ENTITY_SQL).includes(sql)) return { success: true, data: [] };
      throw new Error(`unexpected query ${sql}`);
    }),
    executeRef: jest.fn(),
  };
  const redis = {
    keyExists: jest.fn(async (key: string) => {
      if (opts.revocationThrows) throw new Error('redis down');
      return (opts.revoked ?? []).some((jti) => key === `edge:revoked:${jti}`) ? 1 : 0;
    }),
    getValue: jest.fn(async () => JSON.stringify({ id: 'browser-1', a: false })),
    deleteValue: jest.fn(),
  };
  const config = { get: (k: string) => env[k] };
  return { env, db, redis, config, fetchJson: opts.fetchJson };
}

function authenticator(deps: ReturnType<typeof makeDeps>, now = NOW_MS) {
  return new EdgeTokenAuthenticator({ config: deps.config, redis: deps.redis, db: deps.db, now: () => now, ...(deps.fetchJson ? { fetchJson: deps.fetchJson } : {}) });
}

function makeReq(opts: { method?: string; url: string; query?: any; body?: any; token?: string }) {
  return {
    method: opts.method ?? 'GET',
    originalUrl: opts.url,
    url: opts.url,
    query: opts.query ?? {},
    body: opts.body,
    headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
    ip: '198.51.100.4',
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

/** Runs a middleware class over a request; reports whether next() ran and what was answered. */
async function run(Mw: any, deps: ReturnType<typeof makeDeps>, req: any) {
  const mw = new Mw(deps.redis, deps.config, deps.db);
  if (mw instanceof RealtimeAuthMiddleware) (mw as any).edgeTokenAuth = authenticator(deps);
  const res = makeRes();
  const next = jest.fn();
  await mw.use(req, res, next);
  return { next, res, status: res.status.mock.calls[0]?.[0], body: res.json.mock.calls[0]?.[0] };
}

beforeEach(() => {
  (RealtimeAuthBase as any).lastWarn.clear();
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});
afterEach(() => jest.restoreAllMocks());

describe('the RT allowlist', () => {
  it('is exactly the cloud paths of the rows the venue box relays (ROUTE_MANIFEST, the same rows rt-routes.ts derives its table from)', () => {
    const relayed = manifestRelayRows().map((r) => `${r.method} ${r.cloudPath!.toLowerCase()}`).sort();
    const accepted = EDGE_TOKEN_ROUTES.map((r) => `${r.method} ${r.path.toLowerCase()}`).sort();
    expect(accepted).toEqual(relayed);
    expect(Object.isFrozen(EDGE_TOKEN_ROUTES)).toBe(true);
  });

  it.each([
    ['GET', '/session/realtimedatabysesid?nSesid=x', true],
    ['GET', '/Session/RealtimeDataBySesid/', true],
    ['GET', '/factsheet/teamusers?nCaseid=x', true],
    ['POST', '/factsheet/teamusers', false],
    ['POST', '/fact/inserthighlights', true],
    ['PUT', '/issue/updateIssue', true],
    ['DELETE', '/issue/delete/multi/issue', true],
    ['POST', '/session/realtimedatabysesid', false],
    ['GET', '/session/eclipse/credential', false],
    ['POST', '/session/eclipse', false],
    ['POST', '/session/sessionend', false],
    ['POST', '/session/edge/split', false],
    ['POST', '/transcript/publish', false],
    ['POST', '/upload', false],
    ['GET', '/session/realtimedatabysesi%64', false],
    ['GET', '/session/../session/realtimedatabysesid', false],
    ['GET', '//session/realtimedatabysesid', false],
    ['GET', 'session/realtimedatabysesid', false],
  ])('%s %s -> %s', (method, url, ok) => {
    expect(isEdgeTokenRoute(method, url)).toBe(ok);
  });
});

describe('requestCases: every case a request names', () => {
  it('reads nCaseid, sessions and rows from body and query; refuses unknown sessions and bad ids', async () => {
    const { db } = makeDeps();
    await expect(requestCases(db, { query: { nSesid: SES }, body: undefined } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
    await expect(requestCases(db, { query: {}, body: { nCaseid: CASE, nFSid: FACT } } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
    await expect(requestCases(db, { query: { nSessionid: OTHER_SES }, body: { nCaseid: CASE } } as any)).resolves.toEqual({ ok: true, cases: [CASE, OTHER_CASE].sort() });
    await expect(requestCases(db, { query: { nSesid: '5e550000-0000-4000-8000-0000000000ff' } } as any)).resolves.toMatchObject({ ok: false, reason: 'UNKNOWN_SESSION' });
    await expect(requestCases(db, { query: { nCaseid: 'not-an-id' } } as any)).resolves.toMatchObject({ ok: false, reason: 'BAD_ID' });
    await expect(requestCases(db, { query: { note: 'x' } } as any)).resolves.toMatchObject({ ok: false, reason: 'NO_CASE' });
    // a row that does not exist names no case (an insert), but then something else must
    await expect(requestCases(db, { body: { nFSid: 'fac70000-0000-4000-8000-0000000000ff' } } as any)).resolves.toMatchObject({ ok: false, reason: 'NO_CASE' });
  });

  it('a failed lookup is reported, never read as "no case"', async () => {
    await expect(requestCases(makeDeps({ db: { fail: 'sessions' } }).db, { query: { nSesid: SES } } as any)).resolves.toMatchObject({ ok: false, reason: 'LOOKUP_FAILED' });
  });

  it('uuidsIn reads JSON lists and nested values', () => {
    expect(uuidsIn(`["${FACT.toUpperCase()}"]`)).toEqual([FACT]);
    expect(uuidsIn([{ nIid: CASE }, SES])).toEqual([CASE, SES]);
    expect(uuidsIn(42)).toEqual([]);
  });

  it(`"no id" values the RT page sends ('null', 0) name nothing; they never refuse (issue 03)`, async () => {
    const { db } = makeDeps();
    // GET issue/issuelist_V2 with no session picked, as IssueApiService.getIssueList sends it
    await expect(requestCases(db, { query: { nCaseid: CASE, nSessionid: 'null', nIDid: 'null' } } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
    // POST issue/insertIssue: nIid 0 = a new issue
    await expect(requestCases(db, { body: { nIid: 0, nCaseid: CASE } } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
    for (const none of ['', '0', 0, 'null', 'undefined', null, undefined, false]) {
      for (const key of ['nSesid', 'nSessionid', 'nIDid', 'nIid', 'nICid', 'nFSid']) {
        await expect(requestCases(db, { query: { nCaseid: CASE, [key]: none } } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
      }
    }
    // ...but they never stand in for a case: the request must still name one
    await expect(requestCases(db, { query: { nCaseid: 'null', nSessionid: 'null', nIDid: 'null' } } as any)).resolves.toMatchObject({ ok: false, reason: 'NO_CASE' });
    // anything else that is not an id still refuses
    for (const bad of ['not-an-id', 'NULL', '00', '1', 1]) {
      await expect(requestCases(db, { query: { nCaseid: CASE, nIDid: bad } } as any)).resolves.toMatchObject({ ok: false, reason: 'BAD_ID' });
      await expect(requestCases(db, { body: { nCaseid: CASE, nIid: bad } } as any)).resolves.toMatchObject({ ok: false, reason: 'BAD_ID' });
    }
  });

  it('Phase 10c: a section or a folder names its case (the document reads behind the DocLink picker and the dock)', async () => {
    const SEC = '5ec70000-0000-4000-8000-000000000001';
    const BUN = 'b0d10000-0000-4000-8000-000000000001';
    const db = {
      rowQuery: jest.fn(async (sql: string, params: any[]) => {
        if (sql === EDGE_SCOPE_ENTITY_SQL.section) return { success: true, data: params[0].includes(SEC) ? [{ nCaseid: CASE }] : [] };
        if (sql === EDGE_SCOPE_ENTITY_SQL.bundle) return { success: true, data: params[0].includes(BUN) ? [{ nCaseid: OTHER_CASE }] : [] };
        return { success: true, data: [] };
      }),
    };
    await expect(requestCases(db, { query: { nSectionid: SEC, pageNumber: '1' } } as any)).resolves.toEqual({ ok: true, cases: [CASE] });
    await expect(requestCases(db, { body: { nSectionid: SEC, nBundleid: BUN, pageNumber: 1 } } as any)).resolves.toEqual({ ok: true, cases: [CASE, OTHER_CASE].sort() });
    await expect(requestCases(db, { query: { nBundleid: 'nope' } } as any)).resolves.toMatchObject({ ok: false, reason: 'BAD_ID' });
    await expect(requestCases(db, { query: { nSectionid: '5ec70000-0000-4000-8000-0000000000ff' } } as any)).resolves.toMatchObject({ ok: false, reason: 'NO_CASE' });
    expect(db.rowQuery).toHaveBeenCalledWith(EDGE_SCOPE_ENTITY_SQL.section, [[SEC]]);
    expect(db.rowQuery).toHaveBeenCalledWith(EDGE_SCOPE_ENTITY_SQL.bundle, [[BUN]]);
  });

  it(`"no id" is exactly what the DTOs' IsItUUID turns into null, so the procedure never sees a row the check skipped`, () => {
    for (const value of [undefined, null, '', 0, '0', 'null', 'undefined', false, 'NULL', '00', ' 0', 'not-an-id', 1, CASE]) {
      const dto = plainToInstance(IssueListParam, { nIDid: value });
      expect([value, dto.nIDid === null || dto.nIDid === undefined]).toEqual([value, absentId(value)]);
    }
  });
});

describe('EDGE_TOKEN_CASELESS_ROUTES (Phase 10, the code tables)', () => {
  it("is exactly the manifest's caseless relay rows, matched as the allowlist is (case-insensitively, one optional trailing slash)", () => {
    expect(EDGE_TOKEN_CASELESS_ROUTES).toEqual([{ method: 'GET', path: 'issue/dynamiccombo' }]);
    expect([
      isCaselessEdgeRoute('GET', '/issue/dynamiccombo?nCategoryid=22'),
      isCaselessEdgeRoute('get', '/Issue/DynamicCombo/'),
      isCaselessEdgeRoute('GET', '/marknav/all'),
      isCaselessEdgeRoute('POST', '/issue/dynamiccombo'),
      isCaselessEdgeRoute('GET', '/issue/%64ynamiccombo'),
    ]).toEqual([true, true, false, false, false]);
    // every case-less row is on the allowlist too
    for (const r of EDGE_TOKEN_CASELESS_ROUTES) expect(isEdgeTokenRoute(r.method, `/${r.path}`)).toBe(true);
  });
});

describe('RealtimeAuthMiddleware with an edge token', () => {
  const realtimeData = (token: string, query: Record<string, any> = { nSesid: SES, nCaseid: CASE, nUserid: 'someone-else' }) =>
    makeReq({ url: `/session/realtimedatabysesid?nSesid=${SES}`, query, token });

  it('an allowlisted route in the box\'s case passes as the token user, never an admin', async () => {
    const deps = makeDeps();
    const token = await edgeToken();
    const req = realtimeData(token);
    const { next, status } = await run(RealtimeAuthMiddleware, deps, req);
    expect(status).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({ userId: ME, isAdmin: false });
    expect(req.isAdmin).toBe(false);
    expect(req.edge).toEqual({ nEdgeid: BOX, jti: expect.any(String), cases: [CASE] });
    // identity keys the client sent are overwritten with the token user, as for a cookie JWT
    expect(req.query.nUserid).toBe(ME);
    // the browser binding (user/<id> in Redis) is not consulted
    expect(deps.redis.getValue).not.toHaveBeenCalled();
    expect(deps.db.rowQuery).toHaveBeenCalledWith(EDGE_BOX_CASES_SQL, [BOX, [CASE]]);
  });

  it(`claims and issues from the RT page pass with their "no id" values, for the box's case only (issue 03)`, async () => {
    const token = await edgeToken();
    const list = (nCaseid: string) => makeReq({ url: `/issue/issuelist_V2?nCaseid=${nCaseid}&nSessionid=null&nIDid=null`, query: { nCaseid, nSessionid: 'null', nIDid: 'null' }, token });
    const insert = (nCaseid: string) => makeReq({ method: 'POST', url: '/issue/insertIssue', body: { nIid: 0, nICid: randomUUID(), nCaseid, cIName: 'Issue' }, token });

    const deps = makeDeps();
    const listed = list(CASE);
    const ok = await run(RealtimeAuthMiddleware, deps, listed);
    expect(ok.status).toBeUndefined();
    expect(ok.next).toHaveBeenCalledTimes(1);
    expect(listed.edge.cases).toEqual([CASE]);
    const created = await run(RealtimeAuthMiddleware, deps, insert(CASE));
    expect(created.status).toBeUndefined();
    expect(created.next).toHaveBeenCalledTimes(1);

    for (const req of [list(OTHER_CASE), insert(OTHER_CASE)]) {
      const refused = await run(RealtimeAuthMiddleware, makeDeps(), req);
      expect(refused.next).not.toHaveBeenCalled();
      expect(refused.status).toBe(403);
      expect(refused.body).toMatchObject({ cCode: 'case_not_allowed' });
    }
  });

  it("a code-table read names no case (Phase 10, `caseless`): admitted on the box's standing alone with no case in req.edge; refused when the active box holds none of the token's cases; every other route still needs a case", async () => {
    const token = await edgeToken();
    const codes = () => makeReq({ url: '/issue/dynamiccombo?nCategoryid=22', query: { nCategoryid: '22' }, token });
    const deps = makeDeps();
    const req = codes();
    const ok = await run(RealtimeAuthMiddleware, deps, req);
    expect([ok.status, ok.next.mock.calls.length]).toEqual([undefined, 1]);
    expect(req.edge).toEqual({ nEdgeid: BOX, jti: expect.any(String), cases: [] });
    expect(req.user).toEqual({ userId: ME, isAdmin: false });
    expect(deps.db.rowQuery).toHaveBeenCalledWith(EDGE_BOX_CASES_SQL, [BOX, [CASE]]);
    // the box lost its cases (or was unlinked): nothing, even a code table
    const refused = await run(RealtimeAuthMiddleware, makeDeps({ db: { boxCases: [] } }), codes());
    expect([refused.status, refused.body?.cCode, refused.next.mock.calls.length]).toEqual([403, 'case_not_allowed', 0]);
    // the assignment lookup failing is still 503, fail closed
    const failed = await run(RealtimeAuthMiddleware, makeDeps({ db: { fail: 'box' } }), codes());
    expect([failed.status, failed.body?.cCode]).toEqual([503, 'check_unavailable']);
    // any other allowlisted route without a case is refused as before
    const other = await run(RealtimeAuthMiddleware, makeDeps(), makeReq({ url: '/marknav/all', query: {}, token }));
    expect([other.status, other.body?.cCode]).toEqual([403, 'case_not_allowed']);
  });

  it('a write on the allowlist gets nMasterid from the token (RealtimeAuthInjectMiddleware)', async () => {
    const deps = makeDeps();
    const req = makeReq({ method: 'POST', url: '/factsheet/save', body: { nFSid: FACT, nSesid: SES, nMasterid: 'forged' }, token: await edgeToken() });
    const { next } = await run(RealtimeAuthInjectMiddleware, deps, req);
    expect(next).toHaveBeenCalled();
    expect(req.body.nMasterid).toBe(ME);
  });

  it.each([
    ['POST', '/session/eclipse'],
    ['GET', '/session/eclipse/credential'],
    ['POST', '/session/updatetranscriptstatus'],
    ['POST', '/transcript/publish'],
    ['GET', '/session/getsessionsbycaseid'],
  ])('a route off the allowlist refuses it: %s %s -> 403', async (method, url) => {
    const deps = makeDeps();
    const { next, status, body } = await run(RealtimeAuthMiddleware, deps, makeReq({ method, url, query: { nCaseid: CASE }, body: { nCaseid: CASE }, token: await edgeToken() }));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(403);
    expect(body).toMatchObject({ cCode: 'route_not_allowed' });
    expect(deps.redis.keyExists).not.toHaveBeenCalled();
  });

  it('a box-signed (room-code) token is always refused (401)', async () => {
    const deps = makeDeps();
    const claims = edgeRoomTokenClaims({ nEdgeid: BOX, nUserid: ME, nSesid: SES, mintedBy: ME, nowMs: NOW_MS });
    const token = await signEdgeBoxToken(claims, new Uint8Array(32).fill(7));
    const { next, status, body } = await run(RealtimeAuthMiddleware, deps, realtimeData(token));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(401);
    expect(body).toMatchObject({ cCode: 'box_token_refused' });
  });

  it.each([
    ['a wrong issuer', { iss: `box:${BOX}` }, 'token_invalid'],
    ['an issuer that is not authapi', { iss: 'evil' }, 'token_invalid'],
    ['an audience for another box', { aud: edgeAudience(OTHER_BOX) }, 'token_invalid'],
    ['a scope other than rt', { scope: 'admin' }, 'token_invalid'],
    ['an expired token', { iat: NOW - 7200, exp: NOW - 1, auth_time: NOW - 7300 }, 'token_expired'],
    ['a life over 12 h (D28)', { iat: NOW - 60, exp: NOW + 13 * 3600 }, 'token_invalid'],
    ['a token past auth_time + 24 h (D24)', { iat: NOW - 60, exp: NOW + 3600, auth_time: NOW - 24 * 3600 }, 'token_invalid'],
  ])('%s is refused with 401', async (_why, claims, code) => {
    const { next, status, body } = await run(RealtimeAuthMiddleware, makeDeps(), realtimeData(await edgeToken(claims)));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(401);
    expect(body).toMatchObject({ cCode: code });
  });

  it('a revoked token is refused (authapi edge:revoked:<jti>)', async () => {
    const jti = randomUUID();
    const { status, body } = await run(RealtimeAuthMiddleware, makeDeps({ revoked: [jti] }), realtimeData(await edgeToken({ jti })));
    expect(status).toBe(401);
    expect(body).toMatchObject({ cCode: 'token_revoked' });
  });

  it('a revocation list that cannot be read refuses (fail closed, 503)', async () => {
    const { next, status } = await run(RealtimeAuthMiddleware, makeDeps({ revocationThrows: true }), realtimeData(await edgeToken()));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(503);
  });

  it('a tampered token is refused: changed payload, another key with the same kid, an unknown kid, alg none', async () => {
    const good = await edgeToken();
    const [h, p, s] = good.split('.');
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    payload.cases = [OTHER_CASE];
    const changed = [h, Buffer.from(JSON.stringify(payload)).toString('base64url'), s].join('.');
    const otherSigner = await edgeToken({}, { key: otherKey });
    const unknownKid = await edgeToken({}, { header: { kid: 'kid-unknown' } });
    const none = [Buffer.from(JSON.stringify({ alg: 'none', typ: EDGE_TOKEN_TYP })).toString('base64url'), p, ''].join('.');
    for (const token of [changed, otherSigner, unknownKid, none]) {
      const { next, status, body } = await run(RealtimeAuthMiddleware, makeDeps(), realtimeData(token));
      expect(next).not.toHaveBeenCalled();
      expect(status).toBe(401);
      expect(body).toMatchObject({ cCode: 'token_invalid' });
    }
  });

  it.each([
    ['a case outside the token', { nCaseid: OTHER_CASE }],
    ['a session of another case', { nSesid: OTHER_SES }],
    ['an in-scope case paired with another case\'s session', { nCaseid: CASE, nSesid: OTHER_SES }],
    ['a session that does not exist', { nSesid: '5e550000-0000-4000-8000-0000000000ff' }],
    ['no case or session at all', {}],
  ])('scope: %s -> 403', async (_why, query) => {
    const { next, status, body } = await run(RealtimeAuthMiddleware, makeDeps(), makeReq({ url: '/session/realtimedatabysesid', query, token: await edgeToken() }));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(403);
    expect(body).toMatchObject({ cCode: 'case_not_allowed' });
  });

  it('scope: a row of another case named by a write (nFSid) -> 403, even with an in-scope nSesid', async () => {
    const deps = makeDeps({ db: { facts: { [FACT]: OTHER_CASE } } });
    const req = makeReq({ method: 'POST', url: '/factsheet/save', body: { nFSid: FACT, nSesid: SES }, token: await edgeToken() });
    const { next, status } = await run(RealtimeAuthInjectMiddleware, deps, req);
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(403);
  });

  it('scope: a case in the token but no longer assigned to the box (or the box not active) -> 403', async () => {
    const { next, status } = await run(RealtimeAuthMiddleware, makeDeps({ db: { boxCases: [] } }), realtimeData(await edgeToken()));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(403);
  });

  it('a scope or assignment lookup that fails refuses (503), never passes', async () => {
    for (const fail of ['sessions', 'box'] as const) {
      const { next, status } = await run(RealtimeAuthMiddleware, makeDeps({ db: { fail } }), realtimeData(await edgeToken()));
      expect(next).not.toHaveBeenCalled();
      expect(status).toBe(503);
    }
  });

  it('a deactivated account, or one that no longer exists, loses the RT allowlist at once, its token still valid (review #10)', async () => {
    for (const users of [{ [ME]: false }, {}]) {
      const deps = makeDeps({ db: { users } });
      const { next, status, body } = await run(RealtimeAuthMiddleware, deps, realtimeData(await edgeToken()));
      expect(next).not.toHaveBeenCalled();
      expect(status).toBe(401);
      expect(body).toMatchObject({ cCode: 'user_inactive' });
      expect(deps.db.rowQuery).toHaveBeenCalledWith(EDGE_USER_ACTIVE_SQL, [ME]);
      // Refused before any case lookup.
      expect(deps.db.rowQuery).not.toHaveBeenCalledWith(EDGE_BOX_CASES_SQL, expect.anything());
    }
  });

  it('checks the account once a minute per user: a deactivation is seen within EDGE_USER_ACTIVE_CACHE_MS (review #10)', async () => {
    const deps = makeDeps();
    let now = NOW_MS;
    const auth = new EdgeTokenAuthenticator({ config: deps.config, redis: deps.redis, db: deps.db, now: () => now });
    const token = await edgeToken();
    const req = () => makeReq({ url: '/session/realtimedatabysesid', query: { nSesid: SES }, token });
    const userReads = () => deps.db.rowQuery.mock.calls.filter((c) => c[0] === EDGE_USER_ACTIVE_SQL).length;
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: true });
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: true });
    expect(userReads()).toBe(1);
    // An admin deactivates the account; within the cache window the answer stands, after it the token stops working.
    deps.db.rowQuery.mockImplementation(async (sql: string, params: any[]) => {
      if (sql === EDGE_USER_ACTIVE_SQL) return { success: true, data: [{ bActive: false }] };
      if (sql === EDGE_SCOPE_SESSIONS_SQL) return { success: true, data: [{ nSesid: SES, nCaseid: CASE }] };
      if (sql === EDGE_BOX_CASES_SQL) return { success: true, data: params[1].map((c: string) => ({ nCaseid: c })) };
      return { success: true, data: [] };
    });
    now += EDGE_USER_ACTIVE_CACHE_MS - 1;
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: true });
    now += 1;
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: false, status: 401, cCode: 'user_inactive' });
    expect(userReads()).toBe(2);
  });

  it('an account lookup that fails refuses (503) unless a fresh answer is cached (review #10)', async () => {
    const { next, status, body } = await run(RealtimeAuthMiddleware, makeDeps({ db: { fail: 'user' } }), realtimeData(await edgeToken()));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(503);
    expect(body).toMatchObject({ cCode: 'check_unavailable' });
    const deps = makeDeps();
    const auth = authenticator(deps);
    const token = await edgeToken();
    const req = () => makeReq({ url: '/session/realtimedatabysesid', query: { nSesid: SES }, token });
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: true });
    const real = deps.db.rowQuery.getMockImplementation()!;
    deps.db.rowQuery.mockImplementation(async (sql: string, params: any[]) => (sql === EDGE_USER_ACTIVE_SQL ? { success: false, error: 'down' } : real(sql, params)));
    await expect(auth.authenticate(req(), token)).resolves.toMatchObject({ ok: true });
  });

  it('with the venue edge switched off every edge token is refused (503)', async () => {
    const { next, status, body } = await run(RealtimeAuthMiddleware, makeDeps({ env: { EDGE_ENABLED: '0' } }), realtimeData(await edgeToken()));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(503);
    expect(body).toMatchObject({ cCode: 'edge_disabled' });
  });

  it('with no verification keys configured every edge token is refused (503)', async () => {
    const { status, body } = await run(RealtimeAuthMiddleware, makeDeps({ env: { EDGE_TOKEN_JWKS: undefined } }), realtimeData(await edgeToken()));
    expect(status).toBe(503);
    expect(body).toMatchObject({ cCode: 'keys_unavailable' });
  });

  it("today's cookie JWT on the same route is untouched (no edge lookups)", async () => {
    const deps = makeDeps();
    const token = jwt.sign({ userId: ME, broweserId: 'browser-1' }, SECRET);
    const req = makeReq({ url: '/session/realtimedatabysesid', query: { nSesid: SES }, token });
    const { next } = await run(RealtimeAuthMiddleware, deps, req);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: ME, isAdmin: false });
    expect(req.edge).toBeUndefined();
    expect(deps.redis.getValue).toHaveBeenCalledWith(`user/${ME}`);
    expect(deps.redis.keyExists).not.toHaveBeenCalled();
    expect(deps.db.rowQuery).not.toHaveBeenCalled();
  });
});

describe('the other realtime gates refuse edge tokens outright', () => {
  it.each([
    ['RealtimeVenueAuthMiddleware', RealtimeVenueAuthMiddleware, '/session/sessionend'],
    ['RealtimeServiceOrAdminMiddleware', RealtimeServiceOrAdminMiddleware, '/session/getallusers'],
    ['RealtimeTargetUserMiddleware', RealtimeTargetUserMiddleware, '/session/rt/logs'],
  ])('%s -> 401, and never treats it as a cookie JWT', async (_name, Mw, url) => {
    const deps = makeDeps();
    const verify = jest.spyOn(jwt, 'verify');
    const { next, status } = await run(Mw, deps, makeReq({ method: 'POST', url, body: { nSesid: SES }, token: await edgeToken() }));
    expect(next).not.toHaveBeenCalled();
    expect(status).toBe(401);
    expect(verify).not.toHaveBeenCalled();
    expect(deps.db.executeRef).not.toHaveBeenCalled();
  });
});

describe('verification keys: authapi\'s JWKS', () => {
  it('fetched from EDGE_TOKEN_JWKS_URL when set (the configured JWKS is the fallback), refreshed every 10 minutes', async () => {
    const fetchJson = jest.fn(async () => JSON.parse(jwks));
    const deps = makeDeps({ env: { EDGE_TOKEN_JWKS: undefined, EDGE_TOKEN_JWKS_URL: 'https://etabella.test/authapi/edge/jwks' }, fetchJson });
    let now = NOW_MS;
    const auth = new EdgeTokenAuthenticator({ config: deps.config, redis: deps.redis, db: deps.db, now: () => now, fetchJson });
    const token = await edgeToken();
    await expect(auth.authenticate(realtimeDataReq(token), token)).resolves.toMatchObject({ ok: true });
    await expect(auth.authenticate(realtimeDataReq(token), token)).resolves.toMatchObject({ ok: true });
    expect(fetchJson).toHaveBeenCalledTimes(1);
    expect(fetchJson).toHaveBeenCalledWith('https://etabella.test/authapi/edge/jwks');
    now += JWKS_REFRESH_MS;
    await auth.authenticate(realtimeDataReq(token), token);
    expect(fetchJson).toHaveBeenCalledTimes(2);
  });

  it('a failed fetch falls back to the configured JWKS', async () => {
    const fetchJson = jest.fn(async () => { throw new Error('ECONNREFUSED'); });
    const deps = makeDeps({ env: { EDGE_TOKEN_JWKS_URL: 'https://etabella.test/authapi/edge/jwks' }, fetchJson });
    const token = await edgeToken();
    await expect(authenticator(deps).authenticate(realtimeDataReq(token), token)).resolves.toMatchObject({ ok: true });
  });

  function realtimeDataReq(token: string) {
    return makeReq({ url: '/session/realtimedatabysesid', query: { nSesid: SES }, token });
  }
});
