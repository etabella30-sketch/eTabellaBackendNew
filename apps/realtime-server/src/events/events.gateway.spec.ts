import { EventsGateway } from './events.gateway';
import { UsersService } from '../services/users/users.service';
import { SESSION_ACCESS_SQL } from './realtime-socket-access';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';

type Kind = 'user' | 'service' | 'anonymous' | 'none';

function fakeSocket(kind: Kind, opts: { id?: string; userId?: string; isAdmin?: boolean; query?: Record<string, any> } = {}) {
  const id = opts.id ?? `sock-${Math.random().toString(36).slice(2, 10)}`;
  const rooms = new Set<string>([id]);
  const data =
    kind === 'user' ? { kind, userId: opts.userId ?? ME, isAdmin: !!opts.isAdmin }
      : kind === 'none' ? {}
        : { kind };
  return {
    id,
    data,
    rooms,
    handshake: { query: opts.query ?? {}, auth: {}, headers: {} },
    join: jest.fn((room: string) => { rooms.add(room); }),
    leave: jest.fn((room: string) => { rooms.delete(room); }),
    emit: jest.fn(),
  } as any;
}

function makeGateway(overrides: { rowQuery?: jest.Mock } = {}) {
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const server = {
    to: jest.fn((room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) })),
    in: jest.fn(),
  };
  const deps = {
    streamData: {
      stopDemoStream: jest.fn(),
      streamData: jest.fn().mockResolvedValue(undefined),
      streamDataByPage: jest.fn(),
      streamDemoData: jest.fn(),
    },
    savedata: { saveLostData: jest.fn().mockResolvedValue(undefined) },
    session: {
      joiningLog: jest.fn().mockResolvedValue({}),
      getSessiondata: jest.fn().mockResolvedValue([{ nSesid: SES }]),
    },
    users: new UsersService(),
    issue: { getAnnotationOfPages: jest.fn().mockResolvedValue([[{ nIDid: 'a1' }], [{ nHid: 'h1' }]]) },
    sync: {} as any,
    feed: {
      sanitizeLineCodes: jest.fn((codes: any) => codes),
      feedReceive: jest.fn(),
      refreshReceive: jest.fn(),
      checkSessionExists: jest.fn().mockReturnValue(true),
      streamSessionData: jest.fn(),
    },
    annot: {} as any,
    db: { rowQuery: overrides.rowQuery ?? jest.fn().mockResolvedValue({ success: true, data: [{ '?column?': 1 }] }) },
  };
  const gateway = new EventsGateway(
    deps.streamData as any, deps.savedata as any, deps.session as any, deps.users, deps.issue as any,
    deps.sync, deps.feed as any, deps.annot, deps.db as any,
  );
  gateway.server = server as any;
  (gateway as any).logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn(), verbose: jest.fn() };
  return { gateway, server, emitted, ...deps };
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

describe('EventsGateway — handleConnection', () => {
  it('joins the verified user room and ignores a spoofed query nUserid', async () => {
    const { gateway, users, emitted } = makeGateway();
    const client = fakeSocket('user', { query: { nUserid: OTHER } });
    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith(`U${ME}`);
    expect(client.join).not.toHaveBeenCalledWith(`U${OTHER}`);
    expect(await users.getUserSocket(ME)).toBe(client.id);
    expect(await users.getUserSocket(OTHER)).toBeNull();
    expect(emitted).toEqual([{ room: client.id, event: 'upload-messages', payload: 'Welcome to the chat of socket' }]);
  });

  it('keeps the query nUserid for an anonymous (transition) socket', async () => {
    const { gateway, users } = makeGateway();
    const client = fakeSocket('anonymous', { query: { nUserid: OTHER } });
    await gateway.handleConnection(client);

    expect(client.join).toHaveBeenCalledWith(`U${OTHER}`);
    expect(await users.getUserSocket(OTHER)).toBe(client.id);
  });

  it('joins nothing for a service socket or a socket without identity', async () => {
    const { gateway, users, emitted } = makeGateway();
    for (const kind of ['service', 'none'] as Kind[]) {
      const client = fakeSocket(kind, { query: { nUserid: OTHER } });
      await gateway.handleConnection(client);
      expect(client.join).not.toHaveBeenCalled();
    }
    expect(await users.getUserSocket(OTHER)).toBeNull();
    expect(emitted).toEqual([]);
  });
});

describe('EventsGateway — handleDisconnect', () => {
  it('never logs the handshake query (ws-auth accepts query.token as a credential)', async () => {
    const { gateway } = makeGateway();
    const log = console.log as unknown as jest.Mock;
    log.mockClear();
    await gateway.handleDisconnect(fakeSocket('anonymous', { query: { nUserid: OTHER, token: 'secret.jwt.value' } }));
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain('secret.jwt.value');
    expect(logged).toContain(OTHER);
  });

  it('writes the leave log for the token user and drops the user entry', async () => {
    const { gateway, users, session } = makeGateway();
    const client = fakeSocket('user', { query: { nUserid: OTHER } });
    await gateway.handleConnection(client);
    await gateway.handleJoinRoom({ room: 'S' + SES, nSesid: SES, nUserid: OTHER }, client);
    session.joiningLog.mockClear();

    await gateway.handleDisconnect(client);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: ME, cStatus: 'L', cSource: 'L' });
    expect(await users.getUserSocket(ME)).toBeNull();
  });
});

describe('EventsGateway — ingest events', () => {
  const tcp = () => ({ date: SES, p: 3, l: 25, d: [[0, [65, 66], 0]] });

  it('accepts TCP-DATA from a service socket and from an anonymous socket in transition', async () => {
    for (const kind of ['service', 'anonymous'] as Kind[]) {
      const { gateway, feed, emitted } = makeGateway();
      await gateway.handleTcpData(tcp(), fakeSocket(kind));
      expect(feed.feedReceive).toHaveBeenCalledTimes(1);
      expect(emitted).toEqual([{ room: `S${SES}`, event: 'message', payload: tcp() }]);
    }
  });

  it('accepts every ingest event from an anonymous socket in transition (legacy venue without the key)', async () => {
    const { gateway, feed, savedata, emitted } = makeGateway();
    const anon = fakeSocket('anonymous');
    await gateway.handleAnnotTransferData({ nSesid: SES }, anon);
    await gateway.feedRefreshData({ nSesid: SES }, anon);
    await gateway.fetchLostData({ nSesid: SES, page: '7', data: [1] }, anon);
    expect(feed.refreshReceive).toHaveBeenCalledTimes(1);
    expect(savedata.saveLostData).toHaveBeenCalledWith([1], '7', SES);
    expect(emitted.map(e => e.event)).toEqual(['annot-refresh-transfer', 'feed-refresh-data', 'previous-data']);
  });

  it('refuses every ingest event from a browser user socket', async () => {
    const { gateway, feed, savedata, emitted } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleTcpData(tcp(), client);
    await gateway.handleAnnotTransferData({ nSesid: SES }, client);
    await gateway.feedRefreshData({ nSesid: SES }, client);
    await gateway.fetchLostData({ nSesid: SES, page: 1, data: [] }, client);

    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(feed.refreshReceive).not.toHaveBeenCalled();
    expect(savedata.saveLostData).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('refuses ingest from a socket without identity', async () => {
    const { gateway, feed, emitted } = makeGateway();
    await gateway.handleTcpData(tcp(), fakeSocket('none'));
    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('refuses a session id that is not a UUID (it names a data/ folder), even from a service socket', async () => {
    const { gateway, feed, savedata, emitted } = makeGateway();
    const svc = fakeSocket('service');
    await gateway.handleTcpData({ ...tcp(), date: `${SES}/../../etc` }, svc);
    await gateway.feedRefreshData({ nSesid: '../x' }, svc);
    await gateway.handleAnnotTransferData({ nSesid: 12 }, svc);
    await gateway.fetchLostData({ nSesid: '../x', page: 1, data: [] }, svc);
    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(feed.refreshReceive).not.toHaveBeenCalled();
    expect(savedata.saveLostData).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });

  it('broadcasts annot-refresh-transfer and feed-refresh-data from a service socket', async () => {
    const { gateway, feed, emitted } = makeGateway();
    const svc = fakeSocket('service');
    await gateway.handleAnnotTransferData({ nSesid: SES, x: 1 }, svc);
    await gateway.feedRefreshData({ nSesid: SES, y: 2 }, svc);
    expect(feed.refreshReceive).toHaveBeenCalledWith({ nSesid: SES, y: 2 });
    expect(emitted).toEqual([
      { room: `S${SES}`, event: 'annot-refresh-transfer', payload: { nSesid: SES, x: 1 } },
      { room: `S${SES}`, event: 'feed-refresh-data', payload: { nSesid: SES, y: 2 } },
    ]);
  });

  it('saves lost-data for a numeric page and refuses a path-like page', async () => {
    const { gateway, savedata, emitted } = makeGateway();
    const svc = fakeSocket('service');
    await gateway.fetchLostData({ nSesid: SES, page: '../../evil', data: [1] }, svc);
    expect(savedata.saveLostData).not.toHaveBeenCalled();

    await gateway.fetchLostData({ msg: 1, nSesid: SES, page: 4, data: [1] }, svc);
    expect(savedata.saveLostData).toHaveBeenCalledWith([1], 4, SES);
    expect(emitted).toEqual([{ room: `S${SES}`, event: 'previous-data', payload: { msg: 1, nSesid: SES, page: 4, data: '[1]' } }]);
  });

  it('exposes socket-free ingest methods for the embedded Eclipse ingest', async () => {
    const { gateway, feed, emitted } = makeGateway();
    await gateway.ingestTcpData(tcp());
    await gateway.ingestFeedRefresh({ nSesid: SES });
    await gateway.ingestAnnotRefresh({ nSesid: SES });
    expect(feed.feedReceive).toHaveBeenCalledTimes(1);
    expect(feed.refreshReceive).toHaveBeenCalledTimes(1);
    expect(emitted.map(e => e.event)).toEqual(['message', 'feed-refresh-data', 'annot-refresh-transfer']);
  });
});

describe('EventsGateway — join-room', () => {
  it('lets a user join a session room they can see, logging the token user', async () => {
    const { gateway, db, session } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES, nUserid: OTHER, isCreator: false }, client);

    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(client.join).toHaveBeenCalledWith(`S${SES}`);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: ME, cStatus: 'J', cSource: 'L' });
    expect(client.userroom).toEqual({ nSesid: SES, nUserid: ME });
  });

  it('checks membership once per socket and session', async () => {
    const { gateway, db } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
    await gateway.fetchData(client, { nSesid: SES, nCaseid: CASE, tab: 1 });
    expect(db.rowQuery).toHaveBeenCalledTimes(1);
  });

  it('ignores a session room the user cannot see', async () => {
    const { gateway, session } = makeGateway({ rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) });
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES, nUserid: ME }, client);
    expect(client.join).not.toHaveBeenCalled();
    expect(session.joiningLog).not.toHaveBeenCalled();
  });

  it('fails closed when the membership lookup errors', async () => {
    const { gateway } = makeGateway({ rowQuery: jest.fn().mockResolvedValue({ success: false, error: 'db down' }) });
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
    expect(client.join).not.toHaveBeenCalled();
  });

  it('lets a global admin join any session without a lookup', async () => {
    const { gateway, db } = makeGateway();
    const client = fakeSocket('user', { isAdmin: true });
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith(`S${SES}`);
  });

  it('accepts the legacy payload (room only, no nSesid) after the check, without a join log', async () => {
    const { gateway, db, session } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, userid: SES, nUserid: OTHER, isCreator: false }, client);
    expect(db.rowQuery).toHaveBeenCalledWith(SESSION_ACCESS_SQL, [SES, ME]);
    expect(client.join).toHaveBeenCalledWith(`S${SES}`);
    expect(session.joiningLog).not.toHaveBeenCalled();
  });

  it('refuses a payload whose nSesid does not match its room', async () => {
    const { gateway, db } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: CASE }, client);
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(client.join).not.toHaveBeenCalled();
  });

  it('lets a user (re)join only their own U room', async () => {
    const { gateway } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `U${OTHER}`, nUserid: OTHER }, client);
    expect(client.join).not.toHaveBeenCalled();
    await gateway.handleJoinRoom({ room: `U${ME.toUpperCase()}`, nUserid: ME }, client);
    expect(client.join).toHaveBeenCalledWith(`U${ME}`);
  });

  it('allows the legacy demo rooms and ignores unknown rooms (e.g. another socket id)', async () => {
    const { gateway } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: '1', userid: 1 }, client);
    await gateway.handleJoinRoom({ room: 'D1', userid: 1 }, client);
    await gateway.handleJoinRoom({ room: 'Kx3m9Qp2Lw8Zr5Tn0YbAAAB' }, client);
    await gateway.handleJoinRoom({ room: `P${SES}` }, client);
    await gateway.handleJoinRoom({ room: ['a', 'b'] }, client);
    await gateway.handleJoinRoom(null, client);
    expect(client.join.mock.calls.map(c => c[0])).toEqual(['1', 'D1']);
  });

  it('keeps today\'s behaviour for an anonymous socket (transition), logging the claimed user', async () => {
    const { gateway, db, session } = makeGateway();
    const client = fakeSocket('anonymous');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES, nUserid: OTHER }, client);
    expect(db.rowQuery).not.toHaveBeenCalled();
    expect(client.join).toHaveBeenCalledWith(`S${SES}`);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: OTHER, cStatus: 'J', cSource: 'L' });
  });

  it('refuses join-room from a service socket or a socket without identity', async () => {
    const { gateway } = makeGateway();
    for (const kind of ['service', 'none'] as Kind[]) {
      const client = fakeSocket(kind);
      await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
      expect(client.join).not.toHaveBeenCalled();
    }
  });
});

describe('EventsGateway — leave-room', () => {
  it('leaves the named room, not the payload object', async () => {
    const { gateway, session } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleJoinRoom({ room: `S${SES}`, nSesid: SES }, client);
    session.joiningLog.mockClear();

    await gateway.handleLeaveRoom({ room: `S${SES}`, nSesid: SES, nUserid: OTHER, isCreator: false }, client);
    expect(client.leave).toHaveBeenCalledWith(`S${SES}`);
    expect(client.rooms.has(`S${SES}`)).toBe(false);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: ME, cStatus: 'L', cSource: 'L' });
  });

  it('does not write a leave log for a session room the user socket is not in', async () => {
    const { gateway, session } = makeGateway();
    const client = fakeSocket('user');
    await gateway.handleLeaveRoom({ room: `S${SES}`, nSesid: SES }, client);
    expect(session.joiningLog).not.toHaveBeenCalled();
  });

  it('logs the claimed user for an anonymous socket and still leaves the room string', async () => {
    const { gateway, session } = makeGateway();
    const client = fakeSocket('anonymous');
    await gateway.handleLeaveRoom({ room: `S${SES}`, userid: SES, nSesid: SES, nUserid: OTHER }, client);
    expect(client.leave).toHaveBeenCalledWith(`S${SES}`);
    expect(session.joiningLog).toHaveBeenCalledWith({ nSesid: SES, nUserid: OTHER, cStatus: 'L', cSource: 'L' });
  });

  it('accepts a bare room string', async () => {
    const { gateway } = makeGateway();
    const client = fakeSocket('anonymous');
    await gateway.handleLeaveRoom(`S${SES}`, client);
    expect(client.leave).toHaveBeenCalledWith(`S${SES}`);
  });
});

describe('EventsGateway — fetch-data / fetch-missing-page', () => {
  it('reads annotations as the token user and streams the session', async () => {
    const { gateway, issue, feed } = makeGateway();
    const client = fakeSocket('user');
    await gateway.fetchData(client, { nSesid: SES, nUserid: OTHER, nCaseid: CASE, tab: 2 });

    expect(issue.getAnnotationOfPages).toHaveBeenCalledWith({ nSessionid: SES, nUserid: ME, nCaseid: CASE, cTranscript: 'N' });
    expect(feed.streamSessionData).toHaveBeenCalledWith(client.id, { nSesid: SES, nUserid: ME, nCaseid: CASE, tab: 2 }, [{ nIDid: 'a1' }], [{ nHid: 'h1' }]);
  });

  // A viewer that opens a live session cannot tell "no line yet" from "pages on
  // their way" unless the fetch says when it is done.
  it('tells the asking socket when the fetch has sent all it had, after the pages', async () => {
    const order: string[] = [];
    const { gateway, feed, server, emitted } = makeGateway();
    feed.streamSessionData.mockImplementation(async () => { await Promise.resolve(); order.push('pages'); });
    server.to.mockImplementation((room: string) => ({
      emit: (event: string, payload: any) => { order.push(event); return emitted.push({ room, event, payload }); },
    }));
    const client = fakeSocket('user');
    await gateway.fetchData(client, { nSesid: SES, nUserid: ME, nCaseid: CASE, tab: 7 });

    expect(emitted).toEqual([{ room: client.id, event: 'previous-data-end', payload: { nSesid: SES, tab: 7 } }]);
    expect(order).toEqual(['pages', 'previous-data-end']);
  });

  it('says so as well for a session with no line yet (nothing in memory, no folder)', async () => {
    const { gateway, feed, streamData, emitted } = makeGateway();
    feed.checkSessionExists.mockReturnValue(false);
    const client = fakeSocket('user');
    await gateway.fetchData(client, { nSesid: SES, nUserid: ME, nCaseid: CASE, tab: 3 });

    expect(feed.streamSessionData).not.toHaveBeenCalled();
    expect(streamData.streamData).not.toHaveBeenCalled();
    expect(emitted).toEqual([{ room: client.id, event: 'previous-data-end', payload: { nSesid: SES, tab: 3 } }]);
  });

  it('refuses a user who cannot see the session', async () => {
    const { gateway, issue, feed, streamData } = makeGateway({ rowQuery: jest.fn().mockResolvedValue({ success: true, data: [] }) });
    const client = fakeSocket('user');
    await gateway.fetchData(client, { nSesid: SES, nUserid: ME, nCaseid: CASE });
    await gateway.fetchMissingPage(client, { nSesid: SES, nUserid: ME, nCaseid: CASE, pages: 3 });
    expect(issue.getAnnotationOfPages).not.toHaveBeenCalled();
    expect(feed.streamSessionData).not.toHaveBeenCalled();
    expect(streamData.streamDataByPage).not.toHaveBeenCalled();
    expect(client.emit).not.toHaveBeenCalled();
  });

  it('keeps the client-sent nUserid for an anonymous socket (transition)', async () => {
    const { gateway, issue } = makeGateway();
    await gateway.fetchData(fakeSocket('anonymous'), { nSesid: SES, nUserid: OTHER, nCaseid: CASE });
    expect(issue.getAnnotationOfPages).toHaveBeenCalledWith({ nSessionid: SES, nUserid: OTHER, nCaseid: CASE, cTranscript: 'N' });
  });

  it('refuses a service socket and a non-UUID session id (path under data/)', async () => {
    const { gateway, issue } = makeGateway();
    await gateway.fetchData(fakeSocket('service'), { nSesid: SES, nUserid: OTHER });
    await gateway.fetchData(fakeSocket('anonymous'), { nSesid: '../../etc', nUserid: OTHER });
    await gateway.fetchMissingPage(fakeSocket('anonymous'), { nSesid: `${SES}/..`, nUserid: OTHER, pages: 1 });
    expect(issue.getAnnotationOfPages).not.toHaveBeenCalled();
  });

  it('fetch-missing-page streams as the token user and sends session-detail to the socket', async () => {
    const { gateway, issue, streamData, emitted } = makeGateway();
    const client = fakeSocket('user');
    await gateway.fetchMissingPage(client, { nSesid: SES, nUserid: 341, nCaseid: CASE, tab: 1, pages: 5 });

    expect(issue.getAnnotationOfPages).toHaveBeenCalledWith({ nSessionid: SES, nUserid: ME, nCaseid: CASE, cTranscript: 'N' });
    expect(streamData.streamDataByPage).toHaveBeenCalledWith('data', client.id, expect.objectContaining({ nSesid: SES, nUserid: ME, pages: 5 }), expect.any(Function), [{ nIDid: 'a1' }], [{ nHid: 'h1' }], 5);
    expect(emitted).toEqual([{ room: client.id, event: 'session-detail', payload: [{ nSesid: SES }] }]);
  });
});

describe('EventsGateway — issue-annot-added', () => {
  const msg = { nIDid: 'a1a1a1a1-1111-4111-8111-111111111111', nCaseid: CASE, nUserid: OTHER, nSessionid: SES };

  it('reads and emits only for the token user, whatever nUserid the payload names', async () => {
    const { gateway, issue, emitted } = makeGateway();
    await gateway.issueDetailAdded({ ...msg }, fakeSocket('user'));
    expect(issue.getAnnotationOfPages).toHaveBeenCalledWith({ nIDid: msg.nIDid, nCaseid: CASE, nUserid: ME, nSessionid: SES });
    expect(emitted).toEqual([{ room: `U${ME}`, event: 'realtime-events', payload: { type: 'issue-annot-added', data: { nIDid: 'a1' } } }]);
  });

  it('keeps the claimed user for an anonymous socket and the named user for a service socket', async () => {
    for (const kind of ['anonymous', 'service'] as Kind[]) {
      const { gateway, emitted } = makeGateway();
      await gateway.issueDetailAdded({ ...msg }, fakeSocket(kind));
      expect(emitted.map(e => e.room)).toEqual([`U${OTHER}`]);
    }
  });

  it('does nothing for a service socket naming a non-UUID user, or a socket without identity', async () => {
    const { gateway, issue, emitted } = makeGateway();
    await gateway.issueDetailAdded({ ...msg, nUserid: '366' }, fakeSocket('service'));
    await gateway.issueDetailAdded({ ...msg }, fakeSocket('none'));
    expect(issue.getAnnotationOfPages).not.toHaveBeenCalled();
    expect(emitted).toEqual([]);
  });
});

describe('EventsGateway — afterInit', () => {
  // Live mark sync (user decision 2026-10-05): MarkEventsService emits marks-changed to U rooms on this server,
  // handed over the same way as SyncService and AnnotTransferService.
  it('hands the root server to SyncService, AnnotTransferService and MarkEventsService', () => {
    const { streamData, savedata, session, users, issue, sync, feed, annot, db, server } = makeGateway();
    const markEvents: any = { server: null };
    const gateway = new EventsGateway(
      streamData as any, savedata as any, session as any, users, issue as any, sync, feed as any, annot, db as any, undefined, markEvents,
    );
    gateway.server = server as any;
    gateway.afterInit(server as any);
    expect(sync.server).toBe(server);
    expect(annot.server).toBe(server);
    expect(markEvents.server).toBe(server);
  });

  it('still starts without MarkEventsService (a container without MarkEventsModule)', () => {
    const { gateway, server, sync } = makeGateway();
    expect(() => gateway.afterInit(server as any)).not.toThrow();
    expect(sync.server).toBe(server);
  });
});
