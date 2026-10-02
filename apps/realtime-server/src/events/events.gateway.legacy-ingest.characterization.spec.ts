import { EventsGateway } from './events.gateway';
import { UsersService } from '../services/users/users.service';

/**
 * Characterization of today's socket ingest (RT edge plan R-T2 / D14, preserved behaviour (2) and the
 * live half of (3)): legacy 'H' and unknown-provenance (NULL cFeedSource) sessions keep feeding
 * TCP-DATA, feed-refresh-data and lost-data exactly as now.
 *
 * Today `allowIngest` (events.gateway.ts) looks at two things only: the socket kind and whether the
 * session id is a UUID. It reads no session row, no cFeedSource and no Eclipse route. The legacy venue
 * app (com-realtime-local_api) connects with no credential, so on a server in transition mode its
 * socket is 'anonymous'; feed-replay and keyed venues are 'service'.
 *
 * The payload fixtures are the shapes the legacy venue app emits (apps/realtime bridge-parse
 * emitToLocalUser / SendRefreshDataToUser, libs/global stream-data sendFailedSessions).
 *
 * Already pinned elsewhere, not repeated: events.gateway.spec.ts ('ingest events') covers a user or
 * identity-less socket refused, path-like / numeric session ids refused, a path-like lost-data page
 * refused, the generic broadcast of each ingest event, and the socket-free ingest* entry points.
 *
 * Every test runs against a legacy 'H' session unless it says otherwise, so a later provenance lookup
 * sees a preserved case. The one exception is 'a session with no row at all', which the ledger does
 * not cover: it pins today's acceptance and awaits a decision on the R-T2 gate.
 *
 * Edit a test here only where it encodes an intended change from the ledger (cut-mode and 'E'
 * sessions refusing legacy ingest with an admin alert); those get their own new specs.
 */

const SES = '33333333-3333-4333-8333-333333333333';
const SES_B = '66666666-6666-4666-8666-666666666666';
const SES_C = '77777777-7777-4777-8777-777777777777';

type Kind = 'user' | 'service' | 'anonymous' | 'none';
type IngestName = 'TCP-DATA' | 'feed-refresh-data' | 'lost-data';
/** A session's provenance as a lookup would see it: cFeedSource 'H' or NULL, or no session row at all. */
type Provenance = 'H' | null | 'no row';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function fakeSocket(kind: Kind, id = `sock-${Math.random().toString(36).slice(2, 10)}`) {
  const data =
    kind === 'user' ? { kind, userId: '11111111-1111-4111-8111-111111111111', isAdmin: false }
      : kind === 'none' ? {}
        : { kind };
  return {
    id,
    data,
    rooms: new Set<string>([id]),
    handshake: { query: {}, auth: {}, headers: {} },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  } as any;
}

/**
 * Same stubbing as events.gateway.spec.ts. Ingest reads no session row today; the db stub answers as a
 * provenance lookup would, for the session id among the query parameters (or for every session this
 * spec uses when the query names none), with every session having `provenance`.
 */
function makeGateway(provenance: Provenance = 'H') {
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const order: string[] = [];
  const server = {
    to: jest.fn((room: string) => ({
      emit: (event: string, payload: any) => {
        order.push(`emit:${event}`);
        emitted.push({ room, event, payload });
      },
    })),
    in: jest.fn(),
  };
  const feed = {
    sanitizeLineCodes: jest.fn((codes: any) => codes),
    feedReceive: jest.fn((msg: any) => { order.push('feedReceive'); return msg; }),
    refreshReceive: jest.fn((msg: any) => { order.push('refreshReceive'); return msg; }),
    checkSessionExists: jest.fn().mockReturnValue(false),
    streamSessionData: jest.fn(),
  };
  const savedata = { saveLostData: jest.fn().mockResolvedValue(undefined) };
  const db = {
    rowQuery: jest.fn(async (_sql: string, params: unknown[] = []) => {
      if (provenance === 'no row') return { success: true, data: [] };
      const named = params.find((param): param is string => typeof param === 'string' && UUID.test(param));
      return { success: true, data: (named ? [named] : [SES, SES_B, SES_C]).map(nSesid => ({ nSesid, cFeedSource: provenance })) };
    }),
  };
  const gateway = new EventsGateway(
    { stopDemoStream: jest.fn(), streamData: jest.fn(), streamDataByPage: jest.fn(), streamDemoData: jest.fn() } as any,
    savedata as any,
    { joiningLog: jest.fn().mockResolvedValue({}), getSessiondata: jest.fn().mockResolvedValue([]) } as any,
    new UsersService(),
    { getAnnotationOfPages: jest.fn().mockResolvedValue([[], []]) } as any,
    {} as any,
    feed as any,
    {} as any,
    db as any,
  );
  gateway.server = server as any;
  (gateway as any).logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn(), verbose: jest.fn() };
  return { gateway, server, emitted, order, feed, savedata, db };
}

// --- legacy venue payloads -------------------------------------------------------------------

/** bridge-parse emitToLocalUser: the last two lines, [2] = absolute line index, p from the last one. */
const legacyTcpData = (date: string = SES) => ({
  i: 25,
  d: [
    ['10:31:04:12', [84, 72, 69, 32, 67, 79, 85, 82, 84, 58], 24, 'FL', 1, 25, 9101, [], 0],
    ['10:31:05:00', [65, 110, 100, 32, 116, 104, 101, 110, 46], 25, 'FL', 2, 1, 9102, [], 0],
  ],
  date,
  l: 25,
  p: 2,
});

/** bridge-parse SendRefreshDataToUser. */
const legacyRefresh = (nSesid: string = SES) => ({
  nSesid,
  startInd: 3,
  refreshType: 'no-first-last',
  endInd: 5,
  newLines: [['10:31:05:00', [77, 82, 32, 83, 84, 69, 80, 72, 69, 78, 58], 4, 'QES', 1, 5, 9105, [], 0]],
  start: '10:31:05:00',
  end: '10:31:15:00',
  startPage: 1,
  current_refresh: 2,
});

/** stream-data sendFailedSessions: one page file the venue could not deliver while offline. */
const legacyLostData = (nSesid: string = SES) => ({
  msg: 1,
  page: 3,
  data: [
    ['10:40:00:00', [81, 46], 50, 'QES', 3, 1, 9150, [], 0],
    ['10:40:02:00', [65, 46], 51, 'ANS', 3, 2, 9151, [], 0],
  ],
  totalPages: 3,
  nSesid,
  a: [],
  h: [],
});

/** Sends one ingest event the way the venue would, naming the session where that event names it. */
async function send(gateway: EventsGateway, event: IngestName, client: any, sesid: unknown) {
  if (event === 'TCP-DATA') return gateway.handleTcpData({ ...legacyTcpData(), date: sesid }, client);
  if (event === 'feed-refresh-data') return gateway.feedRefreshData({ ...legacyRefresh(), nSesid: sesid }, client);
  return gateway.fetchLostData({ ...legacyLostData(), nSesid: sesid }, client);
}

/** True when the event reached the feed store / disk and was broadcast. */
function wasAccepted(ctx: ReturnType<typeof makeGateway>, event: IngestName): boolean {
  const stored =
    event === 'TCP-DATA' ? ctx.feed.feedReceive.mock.calls.length
      : event === 'feed-refresh-data' ? ctx.feed.refreshReceive.mock.calls.length
        : ctx.savedata.saveLostData.mock.calls.length;
  return stored === 1 && ctx.emitted.length === 1;
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

describe('EventsGateway legacy ingest (characterization): who is accepted', () => {
  const EVENTS: IngestName[] = ['TCP-DATA', 'feed-refresh-data', 'lost-data'];

  it.each(EVENTS)('%s: accepted from service and anonymous sockets, refused from user and identity-less ones', async (event) => {
    const outcome: Record<string, boolean> = {};
    for (const kind of ['service', 'anonymous', 'user', 'none'] as Kind[]) {
      const ctx = makeGateway();
      await send(ctx.gateway, event, fakeSocket(kind), SES);
      outcome[kind] = wasAccepted(ctx, event);
    }
    expect(outcome).toEqual({ service: true, anonymous: true, user: false, none: false });
  });

  it.each(EVENTS)('%s: the session id must be a UUID in any letter case, and nothing else', async (event) => {
    const accepted = async (id: unknown) => {
      const ctx = makeGateway();
      await send(ctx.gateway, event, fakeSocket('anonymous'), id);
      return wasAccepted(ctx, event);
    };
    expect(await accepted(SES)).toBe(true);
    expect(await accepted(SES.toUpperCase())).toBe(true);
    for (const bad of ['', undefined, null, 33, `S${SES}`, `${SES} `, `{${SES}}`, SES.replace(/-/g, ''), [SES]]) {
      expect(await accepted(bad)).toBe(false);
    }
  });

  /** Sends all three legacy events from service and anonymous venues; each must be stored and broadcast. */
  async function expectEveryEventAccepted(provenance: Provenance) {
    for (const kind of ['anonymous', 'service'] as Kind[]) {
      const ctx = makeGateway(provenance);
      const venue = fakeSocket(kind);
      await ctx.gateway.handleTcpData(legacyTcpData(), venue);
      await ctx.gateway.feedRefreshData(legacyRefresh(), venue);
      await ctx.gateway.fetchLostData(legacyLostData(), venue);

      expect(ctx.feed.feedReceive).toHaveBeenCalledTimes(1);
      expect(ctx.feed.refreshReceive).toHaveBeenCalledTimes(1);
      expect(ctx.savedata.saveLostData).toHaveBeenCalledTimes(1);
      expect(ctx.emitted.map(e => [e.room, e.event])).toEqual([
        [`S${SES}`, 'message'],
        [`S${SES}`, 'feed-refresh-data'],
        [`S${SES}`, 'previous-data'],
      ]);
    }
  }

  // The ledger's preserved cases (R-T2 / D14 (2)). Today nothing about the session is looked up, so a
  // legacy 'H' session and one whose cFeedSource is NULL are accepted on socket kind + UUID alone.
  it.each([
    ["a legacy 'H' session", 'H'],
    ['a session with NULL cFeedSource', null],
  ] as Array<[string, Provenance]>)('%s: every legacy ingest event is accepted and broadcast', async (_label, provenance) => {
    await expectEveryEventAccepted(provenance);
  });

  // OPEN QUESTION, not a ledger-preserved case: the ledger names only 'H' and NULL cFeedSource. A
  // session with no row is accepted today only because nothing is looked up. If the R-T2 gate decides
  // to refuse it, rewrite this test (and only this one) to the decided behaviour.
  it('a session with no row at all: accepted today (awaits a decision on the R-T2 gate)', async () => {
    await expectEveryEventAccepted('no row');
  });

  it('TCP-DATA names its session in `date`; an `nSesid` field is not read', async () => {
    const ctx = makeGateway();
    const { date, ...withoutDate } = legacyTcpData();
    await ctx.gateway.handleTcpData({ ...withoutDate, nSesid: SES }, fakeSocket('anonymous'));
    expect(ctx.feed.feedReceive).not.toHaveBeenCalled();
    expect(ctx.emitted).toEqual([]);

    await ctx.gateway.handleTcpData({ ...legacyTcpData(SES), nSesid: SES_B }, fakeSocket('anonymous'));
    expect(ctx.emitted.map(e => e.room)).toEqual([`S${SES}`]);
  });
});

describe('EventsGateway legacy ingest (characterization): what is forwarded where', () => {
  it('TCP-DATA goes to the feed store, then to room S<date> as `message`, payload unchanged', async () => {
    const ctx = makeGateway();
    await ctx.gateway.handleTcpData(legacyTcpData(), fakeSocket('anonymous'));

    expect(ctx.feed.feedReceive).toHaveBeenCalledWith(legacyTcpData());
    expect(ctx.emitted).toEqual([{ room: `S${SES}`, event: 'message', payload: legacyTcpData() }]);
    expect(Object.keys(ctx.emitted[0].payload)).toEqual(['i', 'd', 'date', 'l', 'p']);
    expect(ctx.order).toEqual(['feedReceive', 'emit:message']);
  });

  it('TCP-DATA line codes are scrubbed once per line, before both the store and the broadcast', async () => {
    const ctx = makeGateway();
    ctx.feed.sanitizeLineCodes.mockImplementation((codes: number[]) => codes.filter(code => code !== 0x0c));
    // What each side saw at the moment it was called (the gateway scrubs the venue's object in place).
    let storedCodes: any[] = [];
    let sentCodes: any[] = [];
    ctx.feed.feedReceive.mockImplementation((m: any) => { storedCodes = JSON.parse(JSON.stringify(m.d.map((line: any[]) => line[1]))); });
    ctx.server.to.mockImplementation((room: string) => ({
      emit: (event: string, payload: any) => {
        sentCodes = JSON.parse(JSON.stringify(payload.d.map((line: any[]) => line[1])));
        ctx.emitted.push({ room, event, payload });
      },
    }));
    const msg = legacyTcpData();
    msg.d[0][1] = [0x0c, 65, 66];
    (msg.d as any[]).push(['10:31:06:00', 'not-an-array', 26, 'FL', 2, 2, 9103, [], 0]);

    await ctx.gateway.handleTcpData(msg, fakeSocket('service'));

    expect(ctx.feed.sanitizeLineCodes).toHaveBeenCalledTimes(2);
    expect(storedCodes).toEqual([[65, 66], legacyTcpData().d[1][1], 'not-an-array']);
    expect(sentCodes).toEqual([[65, 66], legacyTcpData().d[1][1], 'not-an-array']);
  });

  it('a scrub failure does not hold the line back', async () => {
    const ctx = makeGateway();
    ctx.feed.sanitizeLineCodes.mockImplementation(() => { throw new Error('scrub failed'); });
    await ctx.gateway.handleTcpData(legacyTcpData(), fakeSocket('anonymous'));

    expect(ctx.feed.feedReceive).toHaveBeenCalledWith(legacyTcpData());
    expect(ctx.emitted).toEqual([{ room: `S${SES}`, event: 'message', payload: legacyTcpData() }]);
  });

  it('feed-refresh-data goes to the feed store, then to room S<nSesid> unchanged', async () => {
    const ctx = makeGateway();
    await ctx.gateway.feedRefreshData(legacyRefresh(), fakeSocket('anonymous'));

    expect(ctx.feed.refreshReceive).toHaveBeenCalledWith(legacyRefresh());
    expect(ctx.emitted).toEqual([{ room: `S${SES}`, event: 'feed-refresh-data', payload: legacyRefresh() }]);
    expect(ctx.order).toEqual(['refreshReceive', 'emit:feed-refresh-data']);
  });

  it('lost-data is written to disk as sent and replayed to room S<nSesid> as previous-data with `data` JSON-encoded', async () => {
    const ctx = makeGateway();
    const msg = legacyLostData();
    await ctx.gateway.fetchLostData(msg, fakeSocket('anonymous'));

    expect(ctx.savedata.saveLostData).toHaveBeenCalledWith(legacyLostData().data, 3, SES);
    expect(ctx.emitted).toEqual([{
      room: `S${SES}`,
      event: 'previous-data',
      payload: { ...legacyLostData(), data: JSON.stringify(legacyLostData().data) },
    }]);
    expect(Object.keys(ctx.emitted[0].payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h']);
    // The venue's own object is left as it was.
    expect(msg.data).toEqual(legacyLostData().data);
  });

  it('lost-data never enters the live in-memory feed store', async () => {
    const ctx = makeGateway();
    await ctx.gateway.fetchLostData(legacyLostData(), fakeSocket('service'));
    expect(ctx.feed.feedReceive).not.toHaveBeenCalled();
    expect(ctx.feed.refreshReceive).not.toHaveBeenCalled();
  });

  it('lost-data takes a page of 1-6 digits, as a number or a string, and nothing else', async () => {
    const accepted = async (page: unknown) => {
      const ctx = makeGateway();
      await ctx.gateway.fetchLostData({ ...legacyLostData(), page }, fakeSocket('anonymous'));
      return ctx.savedata.saveLostData.mock.calls.length === 1 && ctx.emitted.length === 1;
    };
    for (const ok of [0, '0', 3, '3', '000007', 999999, '999999']) {
      expect(await accepted(ok)).toBe(true);
    }
    for (const bad of ['1234567', 1234567, '1.5', 1.5, '-1', -1, '', ' 1', '1 ', '1\n', '0x1', null, undefined]) {
      expect(await accepted(bad)).toBe(false);
    }
  });

  it('lost-data whose disk write fails is not broadcast, and the handler does not throw', async () => {
    const ctx = makeGateway();
    ctx.savedata.saveLostData.mockRejectedValue(new Error('disk full'));
    await expect(ctx.gateway.fetchLostData(legacyLostData(), fakeSocket('anonymous'))).resolves.toBeUndefined();
    expect(ctx.emitted).toEqual([]);
  });

  it('three venues feeding at once: each session\'s lines reach only its own room', async () => {
    const ctx = makeGateway();
    const venues = [SES, SES_B, SES_C].map(sesid => ({ sesid, socket: fakeSocket('anonymous') }));
    for (let round = 0; round < 2; round++) {
      for (const { sesid, socket } of venues) {
        await ctx.gateway.handleTcpData({ ...legacyTcpData(sesid), i: round }, socket);
      }
    }
    await ctx.gateway.feedRefreshData(legacyRefresh(SES_B), venues[1].socket);
    await ctx.gateway.fetchLostData(legacyLostData(SES_C), venues[2].socket);

    for (const e of ctx.emitted) {
      const named = e.event === 'message' ? e.payload.date : e.payload.nSesid;
      expect(e.room).toBe(`S${named}`);
    }
    expect(ctx.emitted.map(e => [e.room, e.event])).toEqual([
      [`S${SES}`, 'message'], [`S${SES_B}`, 'message'], [`S${SES_C}`, 'message'],
      [`S${SES}`, 'message'], [`S${SES_B}`, 'message'], [`S${SES_C}`, 'message'],
      [`S${SES_B}`, 'feed-refresh-data'],
      [`S${SES_C}`, 'previous-data'],
    ]);
  });
});
