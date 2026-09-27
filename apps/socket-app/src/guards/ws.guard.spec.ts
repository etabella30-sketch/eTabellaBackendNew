import * as jwt from 'jsonwebtoken';
import { WsException } from '@nestjs/websockets';
import { WsJwtGuard } from './ws.guard';

const SECRET = 'unit-test-secret';
const USER = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const BROWSER = 'browser-1';

const sign = (claims: object = {}) => jwt.sign({ userId: USER, broweserId: BROWSER, ...claims }, SECRET);

const ctx = (client: any) => ({ switchToWs: () => ({ getClient: () => client }) }) as any;

describe('WsJwtGuard', () => {
  let getValue: jest.Mock;
  let guard: WsJwtGuard;

  beforeEach(() => {
    getValue = jest.fn().mockResolvedValue(JSON.stringify({ id: BROWSER, a: false }));
    guard = new WsJwtGuard({ getValue } as any, { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } as any);
  });

  it('lets a verified user socket through and keeps its connection identity', async () => {
    const data = { kind: 'user', userId: USER, isAdmin: false, socketAcl: new Set(['P:x:host']) };
    const client = { data, handshake: { auth: { token: sign() }, query: {}, headers: {} } };
    await expect(guard.canActivate(ctx(client))).resolves.toBe(true);
    expect(client.data).toBe(data);
    expect(client.data.socketAcl.has('P:x:host')).toBe(true);
    expect(getValue).toHaveBeenCalledWith(`user/${USER}`);
  });

  it('refuses a user socket whose session was replaced or signed out since it connected', async () => {
    const client = { data: { kind: 'user', userId: USER }, handshake: { auth: { token: sign() } } };
    getValue.mockResolvedValueOnce(JSON.stringify({ id: 'another-browser' }));
    await expect(guard.canActivate(ctx(client))).rejects.toBeInstanceOf(WsException);
    getValue.mockResolvedValueOnce(null);
    await expect(guard.canActivate(ctx(client))).rejects.toBeInstanceOf(WsException);
  });

  it('refuses when the token user is not the socket user', async () => {
    const client = { data: { kind: 'user', userId: OTHER }, handshake: { auth: { token: sign() } } };
    await expect(guard.canActivate(ctx(client))).rejects.toBeInstanceOf(WsException);
  });

  it('refuses service sockets and anonymous (token-less) sockets, as before', async () => {
    const service = { data: { kind: 'service' }, handshake: { auth: { token: sign() } } };
    await expect(guard.canActivate(ctx(service))).rejects.toBeInstanceOf(WsException);
    const anonymous = { data: { kind: 'anonymous' }, handshake: { query: { nUserid: USER } } };
    await expect(guard.canActivate(ctx(anonymous))).rejects.toBeInstanceOf(WsException);
  });

  it('reads the legacy Authorization header and the access_token cookie', async () => {
    const legacy = { data: { kind: 'user', userId: USER }, handshake: { headers: { authorization: `Bearer ${sign()}` } } };
    await expect(guard.canActivate(ctx(legacy))).resolves.toBe(true);
    const cookie = { data: { kind: 'user', userId: USER }, handshake: { headers: { cookie: `access_token=${sign()}` } } };
    await expect(guard.canActivate(ctx(cookie))).resolves.toBe(true);
  });

  it('without the adapter, sets the identity from the token and keeps other socket data', async () => {
    const client: any = { data: { keep: 1 }, handshake: { auth: { token: sign() } } };
    getValue.mockResolvedValueOnce(JSON.stringify({ id: BROWSER, a: true }));
    await expect(guard.canActivate(ctx(client))).resolves.toBe(true);
    expect(client.data).toEqual({ keep: 1, kind: 'user', userId: USER, isAdmin: true });
  });

  it('refuses a forged token', async () => {
    const forged = jwt.sign({ userId: USER, broweserId: BROWSER }, 'other-secret');
    const client = { data: { kind: 'user', userId: USER }, handshake: { auth: { token: forged } } };
    await expect(guard.canActivate(ctx(client))).rejects.toBeInstanceOf(WsException);
  });
});
