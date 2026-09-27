import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { WsAuthIoAdapter } from '@app/global/utility/ws-auth/ws-auth';
import { WsJwtGuard } from '../guards/ws.guard';
import { BatchfileService } from '../services/batchfile/batchfile.service';
import { ExportService } from '../services/export/export.service';
import { IndexService } from '../services/index/index.service';
import { NotificationService } from '../services/notification/notification.service';
import { PaginationService } from '../services/pagination/pagination.service';
import { PresentService } from '../services/present/present.service';
import { RealtimeService } from '../services/realtime/realtime.service';
import { UploadService } from '../services/upload/upload.service';
import { UsersService } from '../services/users/users.service';
import { EventsGateway } from './events.gateway';
import { PRESENT_ROLE_SQL } from './socket-room-access';

/**
 * End-to-end over a real socket.io server on an ephemeral localhost port: WsAuthIoAdapter (as
 * wired in main.ts) + WsJwtGuard + EventsGateway on /socketservice/socket.io with stubbed
 * services. Proves the connection middleware runs before handleConnection, that the guard keeps
 * the connection identity, and that rooms behave as the unit specs assume.
 */

const SECRET = 'socket-app-spec-secret';
const SERVICE_KEY = 'socket-app-spec-service-key';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const PRES = '33333333-3333-4333-8333-333333333333';
const PATH = '/socketservice/socket.io';

const token = (userId = ME) => jwt.sign({ userId, broweserId: `browser-${userId}` }, SECRET);

async function until(cond: () => boolean | Promise<boolean>, ms = 3000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await cond()) return;
    await new Promise(r => setTimeout(r, 15));
  }
  throw new Error('condition not met in time');
}

describe('socket-app EventsGateway over socket.io with WsAuthIoAdapter', () => {
  let app: INestApplication;
  let gateway: EventsGateway;
  let users: UsersService;
  let url: string;
  let enforce = false;
  const clients: ClientSocket[] = [];
  const redisStore: Record<string, string> = {};
  const redis = {
    getValue: jest.fn(async (key: string) => redisStore[key] ?? JSON.stringify({ id: `browser-${key.replace('user/', '')}`, a: false })),
    addUser: jest.fn().mockResolvedValue(undefined),
    removeUser: jest.fn().mockResolvedValue(undefined),
  };
  const db = {
    executeRef: jest.fn().mockResolvedValue({ success: true }),
    rowQuery: jest.fn(async (sql: string, params: any[]) => {
      if (sql === PRESENT_ROLE_SQL && params[0] === PRES) {
        if (params[1] === ME) return { success: true, data: [{ isHost: true, isMember: false }] };
        if (params[1] === OTHER) return { success: true, data: [{ isHost: false, isMember: true }] };
      }
      return { success: true, data: [] };
    }),
  };
  const present = { setServer: jest.fn(), savePosition: jest.fn(), saveCompare: jest.fn(), saveCompareData: jest.fn(), saveCurrentTab: jest.fn(), setupScreenSharing: jest.fn() };

  const connect = (opts: Record<string, any>): Promise<ClientSocket> => new Promise((resolve, reject) => {
    const socket = ioClient(url, { path: PATH, transports: ['websocket'], reconnection: false, forceNew: true, ...opts });
    clients.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });

  const roomSize = async (room: string) => (await gateway.server.in(room).fetchSockets()).length;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    const stub = () => ({ setServer: jest.fn() });
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsGateway,
        WsJwtGuard,
        UsersService,
        { provide: LogService, useValue: { info: jest.fn(), error: jest.fn() } },
        { provide: UploadService, useValue: stub() },
        { provide: IndexService, useValue: stub() },
        { provide: PaginationService, useValue: stub() },
        { provide: BatchfileService, useValue: stub() },
        { provide: ExportService, useValue: stub() },
        { provide: NotificationService, useValue: stub() },
        { provide: RealtimeService, useValue: stub() },
        { provide: PresentService, useValue: present },
        { provide: DbService, useValue: db },
        { provide: RedisDbService, useValue: redis },
        { provide: ConfigService, useValue: { get: (k: string) => (k === 'JWT_SECRET' ? SECRET : undefined) } },
      ],
    }).compile();
    moduleRef.useLogger(false);
    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new WsAuthIoAdapter(
      app,
      () => ({ jwtSecret: SECRET, serviceKey: SERVICE_KEY, getValue: (key: string) => redis.getValue(key) }),
      () => enforce,
    ));
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address();
    url = `http://127.0.0.1:${port}`;
    gateway = app.get(EventsGateway);
    users = app.get(UsersService);
  });

  afterEach(async () => {
    while (clients.length) clients.pop()!.disconnect();
    enforce = false;
    for (const k of Object.keys(redisStore)) delete redisStore[k];
    await until(async () => (await gateway.server.fetchSockets()).length === 0);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it('puts a token user in their own U room at connect, whatever query.nUserid says', async () => {
    await connect({ auth: { token: token() }, query: { nUserid: OTHER } });
    await until(async () => (await roomSize(`U${ME}`)) === 1);
    expect(await roomSize(`U${OTHER}`)).toBe(0);
    expect(db.executeRef).toHaveBeenCalledWith('user_sync_update', { nMasterid: ME });
  });

  it('two sockets of one user both get LOGIN-VERIFY; closing one keeps the other registered', async () => {
    const a = await connect({ auth: { token: token() } });
    const b = await connect({ extraHeaders: { authorization: `Bearer ${token()}` }, transports: ['polling'] });
    await until(async () => (await roomSize(`U${ME}`)) === 2);
    const got: string[] = [];
    a.on('LOGIN-VERIFY', () => got.push('a'));
    b.on('LOGIN-VERIFY', () => got.push('b'));
    await users.emitMsg({ data: { nMasterid: ME, cBroweserid: 'new-browser' } });
    await until(() => got.length === 2);

    const bId = b.id;
    a.disconnect();
    await until(async () => (await roomSize(`U${ME}`)) === 1);
    expect(users.hasConnection(ME, bId)).toBe(true);
    expect(redis.removeUser).not.toHaveBeenCalledWith(ME);
  });

  it('the guard keeps the connection identity and still honours join-room for the own room only', async () => {
    const socket = await connect({ auth: { token: token() } });
    await until(async () => (await roomSize(`U${ME}`)) === 1);
    socket.emit('join-room', { room: `U${OTHER}`, nUserid: OTHER });
    socket.emit('join-room', { room: `U${ME}`, nUserid: ME });
    await until(() => redis.getValue.mock.calls.length >= 3); // connect + one guard check per message
    await new Promise(r => setTimeout(r, 50));
    expect(await roomSize(`U${OTHER}`)).toBe(0);
    const [server] = await gateway.server.in(`U${ME}`).fetchSockets();
    expect(server.data).toMatchObject({ kind: 'user', userId: ME });
  });

  it('transition lets bad-token and credential-less sockets in as anonymous; enforcing refuses both', async () => {
    const bad = await connect({ auth: { token: jwt.sign({ userId: ME, broweserId: `browser-${ME}` }, 'wrong') } });
    expect(bad.connected).toBe(true);
    const errors: any[] = [];
    bad.on('exception', (e) => errors.push(e));
    bad.emit('join-room', { room: `U${ME}` });
    await until(() => errors.length === 1); // the per-message guard still refuses it, as before
    expect(await roomSize(`U${ME}`)).toBe(0);
    bad.disconnect();
    const anon = await connect({ query: { nUserid: ME } });
    expect(anon.connected).toBe(true);
    anon.disconnect();
    enforce = true;
    await expect(connect({ query: { nUserid: ME } })).rejects.toThrow('unauthorized');
    await expect(connect({ auth: { token: jwt.sign({ userId: ME, broweserId: `browser-${ME}` }, 'wrong') } })).rejects.toThrow('unauthorized');
  });

  it('an anonymous (transition) socket connects but, as before, cannot use any message handler', async () => {
    const anon = await connect({ query: { nUserid: ME } });
    const errors: any[] = [];
    anon.on('exception', (e) => errors.push(e));
    anon.emit('join-room', { room: `U${ME}` });
    await until(() => errors.length === 1);
    expect(await roomSize(`U${ME}`)).toBe(0);
  });

  it('a signed-out session stops working per message without a reconnect', async () => {
    const socket = await connect({ auth: { token: token() } });
    await until(async () => (await roomSize(`U${ME}`)) === 1);
    redisStore[`user/${ME}`] = JSON.stringify({ id: 'some-newer-browser' });
    const errors: any[] = [];
    socket.on('exception', (e) => errors.push(e));
    socket.emit('join-present-room', { room: `P${PRES}`, nPresentid: PRES, nUserid: ME, isHost: true });
    await until(() => errors.length === 1);
    expect(await roomSize(`P${PRES}`)).toBe(0);
  });

  it('presentation: host and member join, screen-share signalling relays only inside the room', async () => {
    const host = await connect({ auth: { token: token(ME) } });
    const viewer = await connect({ auth: { token: token(OTHER) } });
    host.emit('join-present-room', { room: `P${PRES}`, nPresentid: PRES, nUserid: ME, isHost: true });
    viewer.emit('join-present-room', { room: `P${PRES}`, nPresentid: PRES, nUserid: OTHER, isHost: false });
    await until(async () => (await roomSize(`P${PRES}`)) === 2);
    expect(redis.addUser).toHaveBeenCalledWith(`P${PRES}`, OTHER, viewer.id);

    const toHost: any[] = [];
    host.on('webrtc', (m) => { if (m?.event === 'CHECK-HAVE-SCREEN-SHARE') toHost.push(m); });
    viewer.emit('web-rtc', { event: 'CHECK-HAVE-SCREEN-SHARE', data: { nUserid: OTHER, nPresentid: PRES }, nToUserId: ME });
    await until(() => toHost.length === 1);
    expect(toHost[0]).toEqual({ event: 'CHECK-HAVE-SCREEN-SHARE', data: { nUserid: OTHER, nPresentid: PRES }, nToUserId: ME });

    viewer.emit('present-position', { nPresentid: PRES, nBundledetailid: 'b', x: 1 });
    host.emit('present-position', { nPresentid: PRES, nBundledetailid: 'b', x: 2 });
    await until(() => present.savePosition.mock.calls.length === 1);
    await new Promise(r => setTimeout(r, 50));
    expect(present.savePosition).toHaveBeenCalledTimes(1);
    expect(present.savePosition.mock.calls[0][0]).toMatchObject({ x: 2 });
  });
});
