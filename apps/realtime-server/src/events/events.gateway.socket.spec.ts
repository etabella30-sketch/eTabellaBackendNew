import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as jwt from 'jsonwebtoken';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

import { DbService } from '@app/global/db/pg/db.service';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { WsAuthIoAdapter } from '@app/global/utility/ws-auth/ws-auth';
import { AnnotTransferService } from '../services/annot-transfer/annot-transfer.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { IssueService } from '../services/issue/issue.service';
import { SessionService } from '../services/session/session.service';
import { SyncService } from '../services/sync/sync.service';
import { UsersService } from '../services/users/users.service';
import { EventsGateway } from './events.gateway';

/**
 * End-to-end over a real socket.io server on an ephemeral localhost port: WsAuthIoAdapter (as
 * wired in main.ts) + EventsGateway with stubbed services. Proves the connection middleware runs
 * before handleConnection and that rooms behave as the unit specs assume.
 */

const SECRET = 'socket-spec-secret';
const SERVICE_KEY = 'socket-spec-service-key';
const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const DENIED_SES = '55555555-5555-4555-8555-555555555555';

const token = (userId = ME) => jwt.sign({ userId, broweserId: `browser-${userId}` }, SECRET);

async function until(cond: () => boolean | Promise<boolean>, ms = 3000): Promise<void> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (await cond()) return;
    await new Promise(r => setTimeout(r, 15));
  }
  throw new Error('condition not met in time');
}

describe('EventsGateway over socket.io with WsAuthIoAdapter', () => {
  let app: INestApplication;
  let gateway: EventsGateway;
  let url: string;
  let enforce = false;
  const clients: ClientSocket[] = [];
  const feed = {
    sanitizeLineCodes: jest.fn((c: any) => c),
    feedReceive: jest.fn(),
    refreshReceive: jest.fn(),
    checkSessionExists: jest.fn().mockReturnValue(false),
    streamSessionData: jest.fn(),
  };
  const session = { joiningLog: jest.fn().mockResolvedValue({}), getSessiondata: jest.fn().mockResolvedValue([]) };
  const db = {
    rowQuery: jest.fn(async (_sql: string, params: any[]) => ({ success: true, data: params[0] === SES ? [{ ok: 1 }] : [] })),
  };

  const connect = (opts: Record<string, any>): Promise<ClientSocket> => new Promise((resolve, reject) => {
    const socket = ioClient(url, { transports: ['websocket'], reconnection: false, forceNew: true, ...opts });
    clients.push(socket);
    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });

  const roomSize = async (room: string) => (await gateway.server.in(room).fetchSockets()).length;

  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsGateway,
        { provide: StreamDataService, useValue: { stopDemoStream: jest.fn(), streamData: jest.fn(), streamDataByPage: jest.fn(), streamDemoData: jest.fn() } },
        { provide: SavedataService, useValue: { saveLostData: jest.fn() } },
        { provide: SessionService, useValue: session },
        UsersService,
        { provide: IssueService, useValue: { getAnnotationOfPages: jest.fn().mockResolvedValue([[], []]) } },
        { provide: SyncService, useValue: {} },
        { provide: FeedDataService, useValue: feed },
        { provide: AnnotTransferService, useValue: {} },
        { provide: DbService, useValue: db },
      ],
    }).compile();
    moduleRef.useLogger(false);
    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new WsAuthIoAdapter(
      app,
      () => ({
        jwtSecret: SECRET,
        serviceKey: SERVICE_KEY,
        getValue: async (key: string) => JSON.stringify({ id: `browser-${key.replace('user/', '')}`, a: false }),
      }),
      () => enforce,
    ));
    await app.listen(0, '127.0.0.1');
    const { port } = app.getHttpServer().address();
    url = `http://127.0.0.1:${port}`;
    gateway = app.get(EventsGateway);
  });

  afterEach(() => {
    while (clients.length) clients.pop()!.disconnect();
    enforce = false;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app?.close();
    jest.restoreAllMocks();
  });

  it('puts a token user in their own U room, whatever query.nUserid says', async () => {
    const socket = await connect({ auth: { token: token() }, query: { nUserid: OTHER } });
    await until(async () => (await roomSize(`U${ME}`)) === 1);
    expect(await roomSize(`U${OTHER}`)).toBe(0);
    socket.disconnect();
  });

  it('delivers service-socket ingest to a user who joined a session they can see, and ignores ingest from users', async () => {
    const viewer = await connect({ auth: { token: token() } });
    const received: any[] = [];
    viewer.on('message', (m) => received.push(m));

    viewer.emit('join-room', { room: `S${SES}`, nSesid: SES, nUserid: OTHER, isCreator: false });
    await until(async () => (await roomSize(`S${SES}`)) === 1);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: ME, cStatus: 'J', cSource: 'L' });

    viewer.emit('TCP-DATA', { date: SES, p: 1, d: [] });
    const venue = await connect({ auth: { serviceKey: SERVICE_KEY } });
    venue.emit('TCP-DATA', { date: SES, p: 2, d: [] });

    await until(() => received.length === 1);
    expect(received[0]).toMatchObject({ date: SES, p: 2 });
    expect(feed.feedReceive).toHaveBeenCalledTimes(1);
  });

  it('does not let a user into a session they cannot see', async () => {
    const socket = await connect({ auth: { token: token() } });
    socket.emit('join-room', { room: `S${DENIED_SES}`, nSesid: DENIED_SES });
    await until(() => db.rowQuery.mock.calls.length === 1);
    await new Promise(r => setTimeout(r, 50));
    expect(await roomSize(`S${DENIED_SES}`)).toBe(0);
  });

  it('leave-room removes the socket from the named room', async () => {
    const socket = await connect({ auth: { token: token() } });
    socket.emit('join-room', { room: `S${SES}`, nSesid: SES });
    await until(async () => (await roomSize(`S${SES}`)) === 1);
    socket.emit('leave-room', { room: `S${SES}`, nSesid: SES, nUserid: ME, isCreator: false });
    await until(async () => (await roomSize(`S${SES}`)) === 0);
  });

  it('keeps an anonymous socket working in transition mode (legacy client without a token)', async () => {
    await connect({ query: { nUserid: OTHER } });
    await until(async () => (await roomSize(`U${OTHER}`)) === 1);
  });

  it('enforcing: refuses anonymous sockets and bad tokens or keys', async () => {
    enforce = true;
    await expect(connect({ query: { nUserid: OTHER } })).rejects.toThrow('unauthorized');
    await expect(connect({ auth: { token: jwt.sign({ userId: ME, broweserId: 'x' }, 'wrong-secret') } })).rejects.toThrow('unauthorized');
    await expect(connect({ auth: { serviceKey: 'wrong' } })).rejects.toThrow('unauthorized');
    enforce = false;
  });

  it('transition: a bad token or key connects as anonymous, exactly as a credential-less client did before', async () => {
    const stale = await connect({ auth: { token: jwt.sign({ userId: ME, broweserId: 'x' }, 'wrong-secret') }, query: { nUserid: OTHER } });
    expect(stale.connected).toBe(true);
    await until(async () => (await roomSize(`U${OTHER}`)) === 1);
    const [server] = await gateway.server.in(`U${OTHER}`).fetchSockets();
    expect(server.data).toMatchObject({ kind: 'anonymous' });
    stale.disconnect();
    const badKey = await connect({ auth: { serviceKey: 'wrong' } });
    expect(badKey.connected).toBe(true);
    badKey.disconnect();
  });

  it('a service socket joins no room', async () => {
    const venue = await connect({ auth: { serviceKey: SERVICE_KEY }, query: { nUserid: OTHER } });
    venue.emit('join-room', { room: `S${SES}`, nSesid: SES });
    await new Promise(r => setTimeout(r, 80));
    expect(await roomSize(`U${OTHER}`)).toBe(0);
    expect(await roomSize(`S${SES}`)).toBe(0);
  });
});
