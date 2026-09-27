import * as jwt from 'jsonwebtoken';
import {
  authenticateHandshake,
  handshakeToken,
  wsActingUserId,
  wsAuthEnforced,
  wsVerifiedUserId,
  WsAuthDeps,
  WsAuthIoAdapter,
} from './ws-auth';

const SECRET = 'unit-test-secret';
const KEY = 'venue-service-key';
const USER = '44444444-4444-4444-8444-444444444444';
const BROWSER = 'browser-1';

const sign = (claims: object = {}, secret = SECRET) => jwt.sign({ userId: USER, broweserId: BROWSER, ...claims }, secret);

describe('ws-auth handshake', () => {
  let getValue: jest.Mock;
  let deps: WsAuthDeps;

  beforeEach(() => {
    getValue = jest.fn().mockResolvedValue(JSON.stringify({ id: BROWSER, a: true }));
    deps = { jwtSecret: SECRET, serviceKey: KEY, getValue };
  });

  it('reads the token from auth, query, bearer header, then cookie', () => {
    expect(handshakeToken({ auth: { token: 'a' }, query: { token: 'q' } })).toBe('a');
    expect(handshakeToken({ query: { token: 'q' }, headers: { authorization: 'Bearer h' } })).toBe('q');
    expect(handshakeToken({ headers: { authorization: 'Bearer h', cookie: 'access_token=c' } })).toBe('h');
    expect(handshakeToken({ headers: { cookie: 'x=1; access_token=c%2E1' } })).toBe('c.1');
    expect(handshakeToken({})).toBeUndefined();
  });

  it('accepts a bound token as a user, with the id from the token', async () => {
    const res = await authenticateHandshake({ auth: { token: sign() }, query: { nUserid: 'someone-else' } }, deps, true);
    expect(res).toEqual({ ok: true, identity: { kind: 'user', userId: USER, isAdmin: true } });
    expect(getValue).toHaveBeenCalledWith(`user/${USER}`);
  });

  const badTokens = () => [
    { h: { auth: { token: sign({}, 'other') } }, reason: 'invalid token' },
    { h: { auth: { token: sign({ exp: Math.floor(Date.now() / 1000) - 60 }) } }, reason: 'invalid token' },
    { h: { auth: { token: sign() } }, bound: JSON.stringify({ id: 'another-browser' }), reason: 'old token' },
    { h: { auth: { token: sign() } }, bound: null, reason: 'old token' },
  ];

  it('enforcing: refuses forged, expired and signed-out tokens', async () => {
    for (const c of badTokens()) {
      if ('bound' in c) getValue.mockResolvedValueOnce(c.bound);
      expect(await authenticateHandshake(c.h, deps, true)).toEqual({ ok: false, reason: c.reason });
    }
  });

  it('transition: a token that no longer verifies is never trusted, the socket connects as anonymous', async () => {
    for (const c of badTokens()) {
      if ('bound' in c) getValue.mockResolvedValueOnce(c.bound);
      expect(await authenticateHandshake(c.h, deps, false)).toEqual({ ok: true, identity: { kind: 'anonymous' }, degraded: c.reason });
    }
  });

  it('accepts the service key; a wrong or unconfigured one is refused when enforcing and anonymous in transition', async () => {
    expect(await authenticateHandshake({ auth: { serviceKey: KEY } }, deps, true)).toEqual({ ok: true, identity: { kind: 'service' } });
    expect(await authenticateHandshake({ auth: { serviceKey: 'nope' } }, deps, true)).toEqual({ ok: false, reason: 'invalid service key' });
    expect((await authenticateHandshake({ auth: { serviceKey: KEY } }, { ...deps, serviceKey: undefined }, true)).ok).toBe(false);
    expect(await authenticateHandshake({ auth: { serviceKey: 'nope' } }, deps, false)).toEqual({ ok: true, identity: { kind: 'anonymous' }, degraded: 'invalid service key' });
  });

  it('lets a socket with no credential in only during transition', async () => {
    expect(await authenticateHandshake({ query: { nUserid: USER } }, deps, false)).toEqual({ ok: true, identity: { kind: 'anonymous' } });
    expect(await authenticateHandshake({ query: { nUserid: USER } }, deps, true)).toEqual({ ok: false, reason: 'unauthorized' });
  });

  it('acting user: verified id wins; claimed id only for anonymous sockets', () => {
    expect(wsActingUserId({ data: { kind: 'user', userId: USER } }, 'other')).toBe(USER);
    expect(wsActingUserId({ data: { kind: 'anonymous' } }, 'claimed')).toBe('claimed');
    expect(wsActingUserId({ data: { kind: 'service' } }, 'claimed')).toBeNull();
    expect(wsActingUserId({ data: {} }, 'claimed')).toBeNull();
    expect(wsVerifiedUserId({ data: { kind: 'anonymous', userId: USER } })).toBeNull();
  });

  it('reads WS_AUTH_ENFORCE from a ConfigService or env', () => {
    expect(wsAuthEnforced({ get: () => 'true' })).toBe(true);
    expect(wsAuthEnforced({ get: () => undefined })).toBe(false);
    expect(wsAuthEnforced({ WS_AUTH_ENFORCE: 'TRUE' } as any)).toBe(true);
  });
});

describe('WsAuthIoAdapter', () => {
  const makeServer = () => {
    const mws: any[] = [];
    return { use: jest.fn((fn) => mws.push(fn)), mws };
  };

  const run = (mw: any, handshake: any) =>
    new Promise<{ err?: Error; socket: any }>((resolve) => {
      const socket: any = { handshake, data: {} };
      mw(socket, (err?: Error) => resolve({ err, socket }));
    });

  it('installs the middleware once per server and sets socket.data', async () => {
    const server = makeServer();
    const getValue = jest.fn().mockResolvedValue(JSON.stringify({ id: BROWSER, a: false }));
    const adapter = new WsAuthIoAdapter({} as any, () => ({ jwtSecret: SECRET, serviceKey: KEY, getValue }), () => true);
    jest.spyOn(Object.getPrototypeOf(WsAuthIoAdapter.prototype), 'create').mockReturnValue(server);

    expect(adapter.create(0, {})).toBe(server);
    adapter.create(0, {});
    expect(server.use).toHaveBeenCalledTimes(1);

    const ok = await run(server.mws[0], { auth: { token: sign() } });
    expect(ok.err).toBeUndefined();
    expect(ok.socket.data).toEqual({ kind: 'user', userId: USER, isAdmin: false });

    const refused = await run(server.mws[0], { query: { nUserid: USER } });
    expect(refused.err?.message).toBe('unauthorized');
  });
});
