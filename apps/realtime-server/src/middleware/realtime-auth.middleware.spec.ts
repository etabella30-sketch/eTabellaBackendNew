import { Logger } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  CASE_ADMIN_ROLE_ID,
  overwriteIdentity,
  RealtimeAdminMiddleware,
  RealtimeAuthBase,
  RealtimeAuthInjectMiddleware,
  RealtimeAuthMiddleware,
  RealtimeServiceOrAdminMiddleware,
  RealtimeTargetUserMiddleware,
  RealtimeVenueAuthMiddleware,
  routeKeyOf,
  safeEqual,
  SERVICE_KEY_HEADER,
} from './realtime-auth.middleware';

const SECRET = 'unit-test-secret';
const SERVICE_KEY = 'unit-test-service-key';
const ME = '11111111-1111-4111-8111-111111111111';
const VICTIM = '22222222-2222-4222-8222-222222222222';
const CASE = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';

function makeEnv(extra: Record<string, string | undefined> = {}) {
  const env: Record<string, string | undefined> = { JWT_SECRET: SECRET, REALTIME_SERVICE_KEY: SERVICE_KEY, ...extra };
  return { env, config: { get: (k: string) => env[k] } as any };
}

function makeRds(session: { id: string; a?: boolean } | null = { id: 'browser-1', a: false }) {
  return {
    getValue: jest.fn().mockResolvedValue(session === null ? null : JSON.stringify(session)),
    deleteValue: jest.fn().mockResolvedValue(undefined),
  } as any;
}

function makeDb() {
  return {
    executeRef: jest.fn().mockResolvedValue({ success: true, data: [] }),
    rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }),
  } as any;
}

function sign(payload: Record<string, any> = { userId: ME, broweserId: 'browser-1' }, secret = SECRET) {
  return jwt.sign(payload, secret);
}

function makeReq(opts: { method?: string; body?: any; query?: any; headers?: Record<string, any>; cookies?: any; url?: string } = {}) {
  return {
    method: opts.method ?? 'GET',
    body: opts.body,
    query: opts.query ?? {},
    headers: opts.headers ?? {},
    cookies: opts.cookies,
    originalUrl: opts.url ?? '/session/synssessions?x=1',
    ip: '10.0.0.9',
  } as any;
}

function makeRes() {
  const res: any = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
}

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

beforeEach(() => {
  (RealtimeAuthBase as any).lastWarn.clear();
  jest.restoreAllMocks();
});

describe('overwriteIdentity', () => {
  it('replaces present top-level identity keys and never adds one', () => {
    const body: any = { nUserid: VICTIM, nMasterid: VICTIM, jUsers: [{ nUserid: VICTIM }] };
    overwriteIdentity(body, ME);
    expect(body).toEqual({ nUserid: ME, nMasterid: ME, jUsers: [{ nUserid: VICTIM }] });

    const plain: any = { note: 'x' };
    overwriteIdentity(plain, ME);
    expect(plain).toEqual({ note: 'x' });
    expect('nUserid' in plain).toBe(false);
  });

  it('ignores non-objects and arrays', () => {
    expect(() => overwriteIdentity(undefined, ME)).not.toThrow();
    const arr: any = [{ nUserid: VICTIM }];
    overwriteIdentity(arr, ME);
    expect(arr[0].nUserid).toBe(VICTIM);
  });
});

describe('routeKeyOf', () => {
  it('prefers the matched Express route pattern, else the lower-cased path without trailing slashes', () => {
    expect(routeKeyOf({ ...makeReq({ url: '/SYNC/PushIssue/' }), route: { path: '/sync/pushissue' } } as any)).toBe('/sync/pushissue');
    expect(routeKeyOf(makeReq({ url: '/SYNC/PushIssue/?x=1' }))).toBe('/sync/pushissue');
    expect(routeKeyOf(makeReq({ url: '/' }))).toBe('/');
  });
});

describe('safeEqual', () => {
  it('compares by value, including different lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('RealtimeAuthMiddleware', () => {
  function build(session: any = { id: 'browser-1', a: false }) {
    const { config } = makeEnv();
    const rds = makeRds(session);
    const db = makeDb();
    return { mw: new RealtimeAuthMiddleware(rds, config, db), rds, db };
  }

  it('rejects a request without a token with 403', async () => {
    const { mw } = build();
    const res = makeRes();
    const next = jest.fn();
    await mw.use(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a forged token with 401 without touching the named user session', async () => {
    const { mw, rds, db } = build();
    const res = makeRes();
    const next = jest.fn();
    await mw.use(makeReq({ headers: bearer(sign({ userId: VICTIM, broweserId: 'b' }, 'wrong-secret')) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
    expect(rds.deleteValue).not.toHaveBeenCalled();
    expect(db.executeRef).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an expired token with 401 and clears that user session', async () => {
    const { mw, rds, db } = build();
    const expired = sign({ userId: ME, broweserId: 'browser-1', exp: Math.floor(Date.now() / 1000) - 60 });
    const res = makeRes();
    await mw.use(makeReq({ headers: bearer(expired) }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(rds.deleteValue).toHaveBeenCalledWith(`user/${ME}`);
    expect(db.executeRef).toHaveBeenCalledWith('log_insert', expect.objectContaining({ nMasterid: ME, nLCatid: 4 }));
  });

  describe('a correctly signed token that fails verification ends the session only while Redis binds its browser', () => {
    const past = () => Math.floor(Date.now() / 1000) - 60;

    it('keeps the live session when the expired token comes from a replaced browser', async () => {
      // Signed in on browser-old, then on browser-1: Redis now binds ME to browser-1.
      const { mw, rds, db } = build({ id: 'browser-1', a: false });
      const stale = sign({ userId: ME, broweserId: 'browser-old', exp: past() });
      const res = makeRes();
      const next = jest.fn();
      await mw.use(makeReq({ headers: bearer(stale) }), res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
      expect(next).not.toHaveBeenCalled();
      expect(db.executeRef).toHaveBeenCalledWith('log_insert', expect.objectContaining({ nMasterid: ME, nLCatid: 4 }));
      expect(rds.getValue).toHaveBeenCalledWith(`user/${ME}`);
      expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('deletes nothing when no session is stored', async () => {
      const { mw, rds } = build(null);
      const res = makeRes();
      await mw.use(makeReq({ headers: bearer(sign({ userId: ME, broweserId: 'browser-1', exp: past() })) }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('deletes nothing for a token that carries no browser id', async () => {
      const { mw, rds } = build({ a: false } as any);
      const res = makeRes();
      await mw.use(makeReq({ headers: bearer(sign({ userId: ME, exp: past() })) }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('applies the same rule on a venue route (token branch)', async () => {
      const { config } = makeEnv();
      const rds = makeRds({ id: 'browser-1', a: true });
      const mw = new RealtimeVenueAuthMiddleware(rds, config, makeDb());
      const res = makeRes();
      await mw.use(makeReq({ method: 'POST', body: {}, headers: bearer(sign({ userId: ME, broweserId: 'browser-old', exp: past() })) }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('answers 401 and logs when the Redis delete fails, instead of an unhandled rejection', async () => {
      const { mw, rds } = build({ id: 'browser-1', a: false });
      rds.deleteValue.mockRejectedValue(new Error('redis down'));
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      const res = makeRes();
      await mw.use(makeReq({ headers: bearer(sign({ userId: ME, broweserId: 'browser-1', exp: past() })) }), res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(401);
      expect(rds.deleteValue).toHaveBeenCalledWith(`user/${ME}`);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('redis down'));
    });
  });

  it('rejects a token whose browser id no longer matches Redis', async () => {
    const { mw } = build({ id: 'another-browser', a: false });
    const res = makeRes();
    const next = jest.fn();
    await mw.use(makeReq({ headers: bearer(sign()) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Old Token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a token whose Redis session is gone', async () => {
    const { mw } = build(null);
    const res = makeRes();
    await mw.use(makeReq({ headers: bearer(sign()) }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('sets req.user / req.isAdmin and overwrites identity in body and query', async () => {
    const { mw } = build({ id: 'browser-1', a: true });
    const req = makeReq({
      method: 'DELETE',
      headers: bearer(sign()),
      body: { nUserid: VICTIM, nMasterid: VICTIM, jUsers: [{ nUserid: VICTIM }] },
      query: { nUserid: VICTIM },
    });
    const next = jest.fn();
    await mw.use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: ME, isAdmin: true });
    expect(req.isAdmin).toBe(true);
    expect(req.body.nUserid).toBe(ME);
    expect(req.body.nMasterid).toBe(ME);
    expect(req.body.jUsers[0].nUserid).toBe(VICTIM);
    expect(req.query.nUserid).toBe(ME);
  });

  it('does not inject identity fields the client did not send', async () => {
    const { mw } = build();
    const req = makeReq({ method: 'POST', headers: bearer(sign()), body: { note: 'x' }, query: {} });
    await mw.use(req, makeRes(), jest.fn());
    expect(req.body).toEqual({ note: 'x' });
    expect(req.query).toEqual({});
  });

  it('accepts the access_token cookie', async () => {
    const { mw } = build();
    const next = jest.fn();
    await mw.use(makeReq({ cookies: { access_token: sign() } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('RealtimeAuthInjectMiddleware', () => {
  it('keeps the JwtMiddleware contract: nMasterid always set (body on writes, query on reads)', async () => {
    const { config } = makeEnv();
    const mw = new RealtimeAuthInjectMiddleware(makeRds(), config, makeDb());

    const post = makeReq({ method: 'POST', headers: bearer(sign()), body: { nUserid: VICTIM } });
    await mw.use(post, makeRes(), jest.fn());
    expect(post.body).toEqual({ nUserid: ME, nMasterid: ME });

    const get = makeReq({ method: 'GET', headers: bearer(sign()), query: { nFSid: 'f' } });
    await mw.use(get, makeRes(), jest.fn());
    expect(get.query).toEqual({ nFSid: 'f', nMasterid: ME });
  });
});

describe('RealtimeVenueAuthMiddleware', () => {
  function build(extra: Record<string, string | undefined> = {}, session: { id: string; a?: boolean } = { id: 'browser-1', a: false }) {
    const { config } = makeEnv(extra);
    return new RealtimeVenueAuthMiddleware(makeRds(session), config, makeDb());
  }

  it('accepts a valid service key and leaves the venue payload untouched', async () => {
    const req = makeReq({ method: 'POST', headers: { [SERVICE_KEY_HEADER]: SERVICE_KEY }, body: { nUserid: VICTIM } });
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: 'true' }).use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.isService).toBe(true);
    expect(req.body.nUserid).toBe(VICTIM);
  });

  it('transition mode: allows a call with no key and logs it without secrets', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const next = jest.fn();
    const res = makeRes();
    await build().use(makeReq({ method: 'POST' }), res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    const logged = String(warn.mock.calls[0][0]);
    expect(logged).toContain('/session/synssessions');
    expect(logged).not.toContain('x=1');
    expect(logged).not.toContain(SERVICE_KEY);
  });

  it('transition mode: allows a wrong key, logs it, and never echoes the presented value', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: 'false' }).use(
      makeReq({ method: 'POST', headers: { [SERVICE_KEY_HEADER]: 'guess-123' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(String(warn.mock.calls[0][0])).not.toContain('guess-123');
  });

  it('throttles the transition warning per route', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const mw = build();
    await mw.use(makeReq({ method: 'POST' }), makeRes(), jest.fn());
    await mw.use(makeReq({ method: 'POST' }), makeRes(), jest.fn());
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['missing', {}],
    ['invalid', { [SERVICE_KEY_HEADER]: 'guess-123' }],
  ])('enforce mode: rejects a %s key with 401', async (_label, headers) => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const res = makeRes();
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: 'true' }).use(makeReq({ method: 'POST', headers }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('enforce mode: rejects any key when the server has none configured', async () => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const res = makeRes();
    await build({ REALTIME_SERVICE_KEY: undefined, REALTIME_SERVICE_KEY_ENFORCE: 'true' })
      .use(makeReq({ method: 'POST', headers: { [SERVICE_KEY_HEADER]: 'anything' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it.each([
    ['enforce', 'true'],
    ['transition', undefined],
  ])('%s mode: refuses a valid but non-admin JWT with 403 (a login is not a venue credential)', async (_mode, enforce) => {
    const req = makeReq({ method: 'POST', headers: bearer(sign()), body: { nUserid: VICTIM } });
    const res = makeRes();
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: enforce }).use(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin rights required' });
    expect(next).not.toHaveBeenCalled();
    expect(req.user).toBeUndefined();
    expect(req.body.nUserid).toBe(VICTIM);
  });

  it('accepts a global admin JWT instead of a key and overwrites identity', async () => {
    const req = makeReq({ method: 'POST', headers: bearer(sign()), body: { nUserid: VICTIM } });
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: 'true' }, { id: 'browser-1', a: true }).use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ userId: ME, isAdmin: true });
    expect(req.body.nUserid).toBe(ME);
  });

  it('refuses a non-admin access_token cookie the same way', async () => {
    const res = makeRes();
    const next = jest.fn();
    await build({ REALTIME_SERVICE_KEY_ENFORCE: 'true' }).use(makeReq({ method: 'POST', cookies: { access_token: sign() } }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    ['transition', undefined],
    ['enforce', 'true'],
  ])('%s mode: casing and trailing-slash variants of a path share one throttle entry', async (_mode, enforce) => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const mw = build({ REALTIME_SERVICE_KEY_ENFORCE: enforce });
    for (const url of ['/session/synssessions', '/Session/SynsSessions', '/SESSION/SYNSSESSIONS/', '/session/synssessions//?a=1']) {
      await mw.use(makeReq({ method: 'POST', url }), makeRes(), jest.fn());
    }
    expect(warn).toHaveBeenCalledTimes(1);
    expect((RealtimeAuthBase as any).lastWarn.size).toBe(1);
    expect(String(warn.mock.calls[0][0])).toContain('POST /session/synssessions ');
  });

  it('caps the throttle map and evicts the least recently warned key', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const mw = build();
    const max = RealtimeAuthBase.WARN_KEYS_MAX;
    for (let i = 0; i < max + 100; i++) {
      await mw.use(makeReq({ method: 'POST', url: `/sync/probe${i}` }), makeRes(), jest.fn());
    }
    const map: Map<string, number> = (RealtimeAuthBase as any).lastWarn;
    expect(map.size).toBe(max);
    expect(warn).toHaveBeenCalledTimes(max + 100);
    expect([...map.keys()].some(k => k.endsWith('/sync/probe0'))).toBe(false);
    expect([...map.keys()].some(k => k.endsWith(`/sync/probe${max + 99}`))).toBe(true);
  });

  it('rejects a presented but invalid JWT even in transition mode', async () => {
    const res = makeRes();
    const next = jest.fn();
    await build().use(makeReq({ method: 'POST', headers: bearer(sign(undefined, 'wrong-secret')) }), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RealtimeServiceOrAdminMiddleware', () => {
  function build(session = { id: 'browser-1', a: false }) {
    const { config } = makeEnv();
    return new RealtimeServiceOrAdminMiddleware(makeRds(session), config, makeDb());
  }

  it('accepts the service key', async () => {
    const next = jest.fn();
    await build().use(makeReq({ method: 'POST', headers: { [SERVICE_KEY_HEADER]: SERVICE_KEY } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('accepts a global admin', async () => {
    const next = jest.fn();
    await build({ id: 'browser-1', a: true }).use(makeReq({ method: 'POST', headers: bearer(sign()) }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('refuses a non-admin user and an anonymous caller, with no transition window', async () => {
    const res1 = makeRes();
    await build().use(makeReq({ method: 'POST', headers: bearer(sign()) }), res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(403);

    const res2 = makeRes();
    const next = jest.fn();
    await build().use(makeReq({ method: 'POST' }), res2, next);
    expect(res2.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RealtimeTargetUserMiddleware', () => {
  function build(session = { id: 'browser-1', a: false }, db = makeDb()) {
    const { config } = makeEnv();
    return { mw: new RealtimeTargetUserMiddleware(makeRds(session), config, db), db };
  }

  it('lets an admin through and keeps the target nUserid as sent', async () => {
    const { mw } = build({ id: 'browser-1', a: true });
    const req = makeReq({ headers: bearer(sign()), query: { nSesid: SES, nUserid: VICTIM } });
    const next = jest.fn();
    await mw.use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(req.query.nUserid).toBe(VICTIM);
  });

  it('lets a user read their own entries', async () => {
    const { mw } = build();
    const next = jest.fn();
    await mw.use(makeReq({ headers: bearer(sign()), query: { nUserid: ME, nPage: '1' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('lets a case admin of nCaseid through', async () => {
    const db = makeDb();
    db.rowQuery.mockResolvedValue({ success: true, data: [{ '?column?': 1 }] });
    const { mw } = build(undefined, db);
    const next = jest.fn();
    await mw.use(makeReq({ method: 'POST', headers: bearer(sign()), body: { nCaseid: CASE, dStartDt: 'a', dEndDt: 'b' } }), makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(db.rowQuery).toHaveBeenCalledWith(expect.stringContaining('"TeamRelation"'), [CASE, ME, CASE_ADMIN_ROLE_ID]);
  });

  it('resolves the case from nSesid for a case admin', async () => {
    const db = makeDb();
    db.rowQuery
      .mockResolvedValueOnce({ success: true, data: [{ nCaseid: CASE }] })
      .mockResolvedValueOnce({ success: true, data: [{ '?column?': 1 }] });
    const { mw } = build(undefined, db);
    const req = makeReq({ headers: bearer(sign()), query: { nSesid: SES, nUserid: VICTIM } });
    const next = jest.fn();
    await mw.use(req, makeRes(), next);
    expect(next).toHaveBeenCalled();
    expect(db.rowQuery).toHaveBeenNthCalledWith(1, expect.stringContaining('"RSessionMaster"'), [SES]);
    expect(req.query.nUserid).toBe(VICTIM);
  });

  it('refuses a plain user looking at someone else', async () => {
    const { mw } = build();
    const res = makeRes();
    const next = jest.fn();
    await mw.use(makeReq({ headers: bearer(sign()), query: { nSesid: SES, nUserid: VICTIM } }), res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('RealtimeAdminMiddleware', () => {
  it('fails closed without an authenticated user, refuses non-admins, admits admins', () => {
    const mw = new RealtimeAdminMiddleware();
    const res1 = makeRes();
    mw.use(makeReq(), res1, jest.fn());
    expect(res1.status).toHaveBeenCalledWith(403);

    const res2 = makeRes();
    mw.use({ ...makeReq(), user: { userId: ME, isAdmin: false } }, res2, jest.fn());
    expect(res2.status).toHaveBeenCalledWith(403);

    const next = jest.fn();
    mw.use({ ...makeReq(), user: { userId: ME, isAdmin: true } }, makeRes(), next);
    expect(next).toHaveBeenCalled();
  });

  it('after RealtimeAuthMiddleware, blocks a non-admin token', async () => {
    const { config } = makeEnv();
    const auth = new RealtimeAuthMiddleware(makeRds({ id: 'browser-1', a: false }), config, makeDb());
    const req = makeReq({ method: 'POST', headers: bearer(sign()), body: {} });
    const res = makeRes();
    const next = jest.fn();
    await auth.use(req, res, () => new RealtimeAdminMiddleware().use(req, res, next));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: 'Admin rights required' });
    expect(next).not.toHaveBeenCalled();
  });
});
