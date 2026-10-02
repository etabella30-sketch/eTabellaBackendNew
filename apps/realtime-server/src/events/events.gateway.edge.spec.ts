import { Test } from '@nestjs/testing';
import { BroadcastCut } from '@app/edge-sync';

import { FeedDataApplyAdapter } from '../edge/edge-apply.port';
import { EdgeRegistryService } from '../edge/edge-registry.service';
import { EdgeSyncService } from '../edge/edge-sync.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { UsersService } from '../services/users/users.service';
import { UtilityService } from '../services/utility/utility.service';
import { cloudEdgeStatus, EDGE_VIEWER_PORT, EdgeViewerAdapter, EdgeViewerPort, EdgeViewerStatus, venueOf } from './edge-viewer.port';
import { EDGE_VIEWER_PROVIDER } from './edge-viewer.provider';
import { EventsGateway, INGEST_PROVENANCE_SQL } from './events.gateway';

/**
 * EventsGateway's venue-box / cut-mode side (RT edge spec 5.8, 7, 12; ledger D12, D14, D20):
 * - legacy socket ingest refused for sessions positively known to be cut-mode or venue-fed, with an admin
 *   alert (RC-2 intended change; the preserved 'H' / NULL / no-row cases are pinned in
 *   events.gateway.legacy-ingest.characterization.spec.ts);
 * - broadcastCut: the shared rev-tagged plan executed on room S<nSesid>;
 * - edge-status: the banner payload with the cloud-viewer names, on fetch-data and on change;
 * - fetch-data of a venue session tagged with the applied rev; a legacy session's untouched.
 */

const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';
const ME = '11111111-1111-4111-8111-111111111111';
const T0 = Date.UTC(2026, 9, 2, 10, 0, 0);

const codes = (text: string) => Array.from(text, ch => ch.charCodeAt(0));
const line = (index: number, text = `line ${index}`) => ['10:00:00:00', codes(text), index, 'FL', Math.floor(index / 25) + 1, (index % 25) + 1, 7000 + index, [], 0];
const pageOf = (p: number, count = 25, text?: string) => Array.from({ length: count }, (_, k) => line((p - 1) * 25 + k, text));

function fakeSocket(kind: 'user' | 'service' | 'anonymous', id = `sock-${Math.random().toString(36).slice(2, 10)}`) {
  return {
    id,
    data: kind === 'user' ? { kind, userId: ME, isAdmin: false } : { kind },
    rooms: new Set<string>([id]),
    handshake: { query: {}, auth: {}, headers: {} },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
  } as any;
}

type Provenance = { cFeedSource: string | null; cApply: string | null } | 'no row' | { error: string };

function fakeEdge(statuses: Record<string, EdgeViewerStatus | null> = {}, revs: Record<string, number> = {}) {
  const alerts: any[] = [];
  const port: EdgeViewerPort & { alerts: any[]; statuses: typeof statuses } = {
    alerts,
    statuses,
    appliedRev: (id: string) => revs[String(id).toLowerCase()],
    status: (id: string) => statuses[String(id).toLowerCase()] ?? null,
    alert: (a: any) => { alerts.push(a); },
  };
  return port;
}

function makeRig(opts: { provenance?: Provenance; edge?: EdgeViewerPort | null; realFeed?: boolean } = {}) {
  const provenance = opts.provenance ?? { cFeedSource: 'H', cApply: 'L' };
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const server = { to: jest.fn((room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) })), in: jest.fn() };
  const db = {
    rowQuery: jest.fn(async (sql: string) => {
      if (sql === INGEST_PROVENANCE_SQL) {
        if (provenance === 'no row') return { success: true, data: [] };
        if ('error' in provenance) return { success: false, error: provenance.error };
        return { success: true, data: [provenance] };
      }
      return { success: true, data: [{ '?column?': 1 }] }; // session access: allowed
    }),
  };
  let feed: any;
  if (opts.realFeed) {
    const redis = { scanKeys: jest.fn().mockResolvedValue([]), getValue: jest.fn().mockResolvedValue(null), setValue: jest.fn().mockResolvedValue(undefined), getAllValues: jest.fn().mockResolvedValue(null), deleteSessionPages: jest.fn().mockResolvedValue(true) };
    feed = new FeedDataService({ server } as any, redis as any, { error: jest.fn() } as any, new UtilityService({} as any));
    clearInterval(feed.flushTimer);
    feed.restoredSessions.add(SES);
    feed.logger = { verbose: jest.fn(), error: jest.fn(), warn: jest.fn(), log: jest.fn() };
  } else {
    feed = {
      sanitizeLineCodes: jest.fn((c: any) => c),
      feedReceive: jest.fn(),
      refreshReceive: jest.fn(),
      checkSessionExists: jest.fn().mockReturnValue(false),
      streamSessionData: jest.fn(),
    };
  }
  const savedata = { saveLostData: jest.fn().mockResolvedValue(undefined) };
  const gateway = new EventsGateway(
    { stopDemoStream: jest.fn(), streamData: jest.fn().mockResolvedValue(undefined), streamDataByPage: jest.fn(), streamDemoData: jest.fn() } as any,
    savedata as any,
    { joiningLog: jest.fn().mockResolvedValue({}), getSessiondata: jest.fn().mockResolvedValue([]) } as any,
    new UsersService(),
    { getAnnotationOfPages: jest.fn().mockResolvedValue([[], []]) } as any,
    {} as any,
    feed,
    {} as any,
    db as any,
    (opts.edge ?? undefined) as any,
  );
  gateway.server = server as any;
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn(), verbose: jest.fn() };
  (gateway as any).logger = logger;
  return { gateway, emitted, db, feed, savedata, logger };
}

const tcpData = (date = SES) => ({ i: 26, d: [line(24), line(25)], date, l: 25, p: 2 });
const refresh = (nSesid = SES) => ({ nSesid, startInd: 3, endInd: 5, newLines: [], start: '10:31:05:00', end: '10:31:15:00', startPage: 1, current_refresh: 2 });
const lostData = (nSesid = SES) => ({ msg: 1, page: 3, data: [line(50)], totalPages: 3, nSesid, a: [], h: [] });

async function sendAll(gateway: EventsGateway, venue = fakeSocket('anonymous')) {
  await gateway.handleTcpData(tcpData(), venue);
  await gateway.feedRefreshData(refresh(), venue);
  await gateway.fetchLostData(lostData(), venue);
  await gateway.handleAnnotTransferData({ nSesid: SES, date: SES, p: 1 }, venue);
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

/** Lets the background provenance read settle (it is never awaited by the ingest handlers). */
const flush = () => new Promise<void>(resolve => setImmediate(resolve));

/** Sends one TCP-DATA so the session's provenance read starts, then lets it settle; clears what that event did. */
async function learnLane(rig: ReturnType<typeof makeRig>, venue = fakeSocket('anonymous')) {
  await rig.gateway.handleTcpData(tcpData(), venue);
  await flush();
  rig.emitted.length = 0;
  rig.feed.feedReceive.mockClear();
}

describe('EventsGateway legacy ingest vs the cut / venue lanes (RC-2 intended change, D14)', () => {
  it.each([
    ["a venue session (cFeedSource 'E')", { cFeedSource: 'E', cApply: 'L' }, 'edge'],
    ["a cut-mode session (cApply 'C')", { cFeedSource: 'D', cApply: 'C' }, 'cut'],
  ] as Array<[string, Provenance, string]>)('%s, once its provenance is known, refuses TCP-DATA, feed-refresh-data and lost-data, with one admin alert each', async (_label, provenance, lane) => {
    const edge = fakeEdge();
    const rig = makeRig({ provenance, edge });
    await learnLane(rig);
    const { gateway, emitted, feed, savedata } = rig;
    await sendAll(gateway);

    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(feed.refreshReceive).not.toHaveBeenCalled();
    expect(savedata.saveLostData).not.toHaveBeenCalled();
    // annot-refresh-transfer writes no page: never refused.
    expect(emitted.map(e => e.event)).toEqual(['annot-refresh-transfer']);
    expect(edge.alerts.map(a => [a.kind, a.tier, a.nSesid, a.data.event, a.data.lane])).toEqual([
      ['LEGACY_INGEST_REFUSED', 'P2', SES, 'TCP-DATA', lane],
      ['LEGACY_INGEST_REFUSED', 'P2', SES, 'feed-refresh-data', lane],
      ['LEGACY_INGEST_REFUSED', 'P2', SES, 'lost-data', lane],
    ]);
  });

  it('an event never waits for the provenance read: while it is unanswered the session is unknown and accepted; the settled verdict decides what follows', async () => {
    const edge = fakeEdge();
    const { gateway, emitted, feed, db } = makeRig({ provenance: { cFeedSource: 'E', cApply: 'L' }, edge });
    let answer!: (value: any) => void;
    db.rowQuery.mockImplementationOnce(() => new Promise(resolve => { answer = resolve; }));
    const venue = fakeSocket('service');

    // Stored and broadcast synchronously, before the handler's own promise is even awaited.
    void gateway.handleTcpData({ ...tcpData(), i: 1 }, venue);
    expect(emitted.map(e => e.payload.i)).toEqual([1]);
    void gateway.handleTcpData({ ...tcpData(), i: 2 }, venue);
    expect(emitted.map(e => e.payload.i)).toEqual([1, 2]);
    expect(feed.feedReceive).toHaveBeenCalledTimes(2);
    expect(edge.alerts).toEqual([]);

    answer({ success: true, data: [{ cFeedSource: 'E', cApply: 'L' }] });
    await flush();
    await gateway.handleTcpData({ ...tcpData(), i: 3 }, venue);
    expect(emitted.map(e => e.payload.i)).toEqual([1, 2]);
    expect(edge.alerts.map(a => a.kind)).toEqual(['LEGACY_INGEST_REFUSED']);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(1);
  });

  it('a provenance read that never answers does not hold the live feed: one read in flight, every event stored and broadcast in order', async () => {
    const { gateway, emitted, feed, db } = makeRig();
    db.rowQuery.mockImplementation(() => new Promise(() => { }));
    const venue = fakeSocket('service');
    for (const i of [1, 2, 3, 4]) await gateway.handleTcpData({ ...tcpData(), i }, venue);
    await gateway.feedRefreshData(refresh(), venue);
    expect(emitted.map(e => e.event === 'message' ? e.payload.i : e.event)).toEqual([1, 2, 3, 4, 'feed-refresh-data']);
    expect(feed.feedReceive).toHaveBeenCalledTimes(4);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(1);
  });

  it('after a minute the verdict is read again in the background: a stuck re-read neither holds a legacy feed nor drops a known venue verdict', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    try {
      for (const [provenance, refused] of [[{ cFeedSource: 'H', cApply: 'L' }, false], [{ cFeedSource: 'E', cApply: 'L' }, true]] as Array<[Provenance, boolean]>) {
        nowSpy.mockReturnValue(T0);
        const edge = fakeEdge();
        const rig = makeRig({ provenance, edge });
        await learnLane(rig);
        const reads = () => rig.db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL).length;
        expect(reads()).toBe(1);

        nowSpy.mockReturnValue(T0 + 60_001);
        rig.db.rowQuery.mockImplementation(() => new Promise(() => { }));
        void rig.gateway.handleTcpData(tcpData(), fakeSocket('service'));
        // decided synchronously from the stale verdict, while its re-read hangs
        expect(rig.feed.feedReceive).toHaveBeenCalledTimes(refused ? 0 : 1);
        expect(rig.emitted.map(e => e.event)).toEqual(refused ? [] : ['message']);
        expect(edge.alerts.length).toBe(refused ? 1 : 0);
        await rig.gateway.handleTcpData(tcpData(), fakeSocket('service'));
        expect(reads()).toBe(2);
      }
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('a failed re-read keeps a known venue session refused; a failed first read leaves the session accepted', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    try {
      nowSpy.mockReturnValue(T0);
      const edge = fakeEdge();
      const rig = makeRig({ provenance: { cFeedSource: 'E', cApply: 'L' }, edge });
      await learnLane(rig);
      nowSpy.mockReturnValue(T0 + 60_001);
      rig.db.rowQuery.mockResolvedValue({ success: false, error: 'db down' });
      await rig.gateway.handleTcpData(tcpData(), fakeSocket('service'));
      await flush();
      await rig.gateway.handleTcpData(tcpData(), fakeSocket('service'));
      expect(rig.feed.feedReceive).not.toHaveBeenCalled();
      expect(edge.alerts.map(a => a.kind)).toEqual(['LEGACY_INGEST_REFUSED', 'LEGACY_INGEST_REFUSED']);

      const fresh = makeRig({ provenance: { error: 'db down' }, edge: fakeEdge() });
      await learnLane(fresh);
      await fresh.gateway.handleTcpData(tcpData(), fakeSocket('service'));
      expect(fresh.feed.feedReceive).toHaveBeenCalledTimes(1);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it('a read that has not answered in a minute frees its slot; whatever it answers later is ignored', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    jest.setSystemTime(T0);
    try {
      const edge = fakeEdge();
      const { gateway, db, feed } = makeRig({ edge });
      const answers: Array<(value: any) => void> = [];
      db.rowQuery.mockImplementation(() => new Promise(resolve => { answers.push(resolve); }));
      const venue = fakeSocket('service');
      await gateway.handleTcpData(tcpData(), venue);
      await gateway.handleTcpData(tcpData(), venue);
      expect(answers).toHaveLength(1);

      jest.advanceTimersByTime(60_001);
      await gateway.handleTcpData(tcpData(), venue);
      expect(answers).toHaveLength(2);

      // The abandoned read answers 'E' late: ignored. The current one answers 'E': it counts.
      answers[0]({ success: true, data: [{ cFeedSource: 'E', cApply: 'L' }] });
      await flush();
      await gateway.handleTcpData(tcpData(), venue);
      expect(feed.feedReceive).toHaveBeenCalledTimes(4);
      answers[1]({ success: true, data: [{ cFeedSource: 'E', cApply: 'L' }] });
      await flush();
      await gateway.handleTcpData(tcpData(), venue);
      expect(feed.feedReceive).toHaveBeenCalledTimes(4);
      expect(edge.alerts.map(a => a.kind)).toEqual(['LEGACY_INGEST_REFUSED']);
    } finally {
      jest.useRealTimers();
    }
  });

  it('at most 64 reads are in flight; past that an unknown session is accepted without a read', async () => {
    const { gateway, db, feed } = makeRig();
    db.rowQuery.mockImplementation(() => new Promise(() => { }));
    const venue = fakeSocket('service');
    const ids = Array.from({ length: 65 }, (_, k) => `33333333-3333-4333-8333-${String(k).padStart(12, '0')}`);
    for (const id of ids) await gateway.handleTcpData(tcpData(id), venue);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(64);
    expect(feed.feedReceive).toHaveBeenCalledTimes(65);
  });

  it('forgetIngestLane: an answer of a read started before the feed path changed is ignored', async () => {
    const edge = fakeEdge();
    const { gateway, db, feed } = makeRig({ edge });
    let answer!: (value: any) => void;
    db.rowQuery.mockImplementationOnce(() => new Promise(resolve => { answer = resolve; }));
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    gateway.forgetIngestLane(SES);
    answer({ success: true, data: [{ cFeedSource: 'E', cApply: 'L' }] });
    await flush();
    // The next event asks again (the default rig answers 'H') and is accepted meanwhile.
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    await flush();
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    expect(feed.feedReceive).toHaveBeenCalledTimes(3);
    expect(edge.alerts).toEqual([]);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(2);
  });

  it.each([
    ["legacy 'H'", { cFeedSource: 'H', cApply: 'L' }],
    ["'D' in legacy mode", { cFeedSource: 'D', cApply: 'L' }],
    ['NULL provenance', { cFeedSource: null, cApply: null }],
    ['no session row', 'no row'],
    ['a failed provenance read', { error: 'db down' }],
  ] as Array<[string, Provenance]>)('%s: every legacy ingest event is accepted as today, no alert', async (_label, provenance) => {
    const edge = fakeEdge();
    const { gateway, emitted, feed, savedata } = makeRig({ provenance, edge });
    await sendAll(gateway);
    expect(feed.feedReceive).toHaveBeenCalledTimes(1);
    expect(feed.refreshReceive).toHaveBeenCalledTimes(1);
    expect(savedata.saveLostData).toHaveBeenCalledTimes(1);
    expect(emitted.map(e => e.event)).toEqual(['message', 'feed-refresh-data', 'previous-data', 'annot-refresh-transfer']);
    expect(edge.alerts).toEqual([]);
  });

  it('reads a session\'s provenance once a minute, and keeps the order of events that arrive during the read', async () => {
    const { gateway, emitted, db } = makeRig();
    const venue = fakeSocket('service');
    await Promise.all([1, 2, 3].map(i => gateway.handleTcpData({ ...tcpData(), i }, venue)));
    await flush();
    await gateway.handleTcpData({ ...tcpData(), i: 4 }, venue);
    expect(emitted.map(e => e.payload.i)).toEqual([1, 2, 3, 4]);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(1);
  });

  it('a failed read is asked again after 5 s; a database without the rt_edge columns only after a minute', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    try {
      for (const [error, again] of [['db down', 5_001], ['column "cFeedSource" does not exist', 60_001]] as Array<[string, number]>) {
        nowSpy.mockReturnValue(T0);
        const { gateway, db, feed } = makeRig({ provenance: { error } });
        const reads = () => db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL).length;
        await gateway.handleTcpData(tcpData(), fakeSocket('service'));
        await flush();
        nowSpy.mockReturnValue(T0 + 5_001);
        await gateway.handleTcpData(tcpData(), fakeSocket('service'));
        await flush();
        expect(reads()).toBe(again === 5_001 ? 2 : 1);
        nowSpy.mockReturnValue(T0 + 60_001);
        await gateway.handleTcpData(tcpData(), fakeSocket('service'));
        await flush();
        expect(reads()).toBe(again === 5_001 ? 3 : 2);
        expect(feed.feedReceive).toHaveBeenCalledTimes(3);
      }
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("C5: the edge module's feed-path change (apply port -> this gateway's forgetIngestLane) lets a session re-bound to direct cloud feed at once", async () => {
    const edge = fakeEdge();
    const rig = makeRig({ provenance: { cFeedSource: 'E', cApply: null }, edge });
    await learnLane(rig);
    const { gateway, db, feed } = rig;
    // "Use direct cloud instead" committed: the row says 'D' now, but the cached venue verdict is fresh for a minute.
    db.rowQuery.mockImplementation(async (sql: string) => (sql === INGEST_PROVENANCE_SQL ? { success: true, data: [{ cFeedSource: 'D', cApply: 'L' }] } : { success: true, data: [{ '?column?': 1 }] }));
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    expect(feed.feedReceive).not.toHaveBeenCalled();

    // The edge module's apply port reaches the gateway as `viewers` (resolveLiveFeedTargets).
    const port = new FeedDataApplyAdapter(() => ({ feed: null, io: null, viewers: gateway }));
    port.feedPathChanged(SES);
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    await flush();
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    expect(feed.feedReceive).toHaveBeenCalledTimes(2);
    expect(db.rowQuery.mock.calls.filter(c => c[0] === INGEST_PROVENANCE_SQL)).toHaveLength(2);
  });

  it('the embedded ingest\'s routes answer first (no read), and forgetIngestLane makes the next event ask again', async () => {
    const edge = fakeEdge();
    const { gateway, db, feed } = makeRig({ edge });
    gateway.setIngestLaneLookup(id => (id === SES ? 'cut' : null));
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(db.rowQuery).not.toHaveBeenCalled();

    gateway.setIngestLaneLookup(null);
    gateway.forgetIngestLane(SES.toUpperCase());
    await gateway.handleTcpData(tcpData(), fakeSocket('service'));
    expect(feed.feedReceive).toHaveBeenCalledTimes(1);
    expect(db.rowQuery).toHaveBeenCalledWith(INGEST_PROVENANCE_SQL, [SES]);
  });

  it('without the edge module the refusal is logged as an alert line and nothing throws', async () => {
    const rig = makeRig({ provenance: { cFeedSource: 'E', cApply: null } });
    await learnLane(rig);
    const { gateway, feed, logger } = rig;
    await expect(gateway.handleTcpData(tcpData(), fakeSocket('service'))).resolves.toBeUndefined();
    expect(feed.feedReceive).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('[rt-edge alert P2] LEGACY_INGEST_REFUSED'));
  });

  it('adminAlert goes to the edge module when it is loaded, else to one throttled error line; it never throws', () => {
    const edge = fakeEdge();
    const withEdge = makeRig({ edge });
    withEdge.gateway.adminAlert({ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES, message: 'm' });
    expect(edge.alerts).toEqual([{ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES, message: 'm' }]);
    expect(withEdge.logger.error).not.toHaveBeenCalled();

    const without = makeRig();
    without.gateway.adminAlert({ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES, message: 'm' });
    without.gateway.adminAlert({ kind: 'PROTOCOL_FALLBACK', tier: 'P2', nSesid: SES, message: 'm' });
    expect(without.logger.error).toHaveBeenCalledTimes(1);
    expect(without.logger.error).toHaveBeenCalledWith('[rt-edge alert P2] PROTOCOL_FALLBACK: m');

    const throwing = makeRig({ edge: { ...fakeEdge(), alert: () => { throw new Error('sink down'); } } as any });
    expect(() => throwing.gateway.adminAlert({ kind: 'X', tier: 'P1', message: 'm' })).not.toThrow();
  });
});

describe('EventsGateway.broadcastCut (spec 5.8, rev-tagged)', () => {
  const pages = (list: number[], text?: string) => list.map(p => ({ p, d: `d${p}`, lines: pageOf(p, 25, text) }));
  const cut = (over: Partial<BroadcastCut>): BroadcastCut => ({ nSesid: SES, nLines: 25, rev: 9, prevTotal: 50, totalLines: 50, changed: [], pages: [], ...over } as BroadcastCut);

  afterEach(() => jest.useRealTimers());

  it('a small append goes to room S<nSesid> as one `message` with today\'s fields plus rev', () => {
    const { gateway, emitted } = makeRig();
    const plan = gateway.broadcastCut(SES, cut({ prevTotal: 50, totalLines: 52, changed: [50, 51], pages: [{ p: 3, d: 'd3', lines: [line(50), line(51)] }] }));
    expect(plan.kind).toBe('append');
    expect(emitted).toEqual([{ room: `S${SES}`, event: 'message', payload: { i: 52, d: [line(50), line(51)], date: SES, l: 25, p: 3, rev: 9 } }]);
  });

  it('a rewrite goes out as untagged previous-data per page, newest first, paced 20 pages per 100 ms; a shrink says so first', () => {
    jest.useFakeTimers();
    const { gateway, emitted } = makeRig();
    const list = Array.from({ length: 25 }, (_, k) => k + 1);
    gateway.broadcastCut(SES, cut({ prevTotal: 700, totalLines: 625, changed: [0], pages: pages(list), shrink: { lines: 75 } } as any));

    expect(emitted[0]).toEqual({ room: `S${SES}`, event: 'realtime-events', payload: { type: 'feed-shrink', nSesid: SES, totalLines: 625, rev: 9 } });
    const firstTick = emitted.slice(1).map(e => e.payload.page);
    expect(firstTick).toEqual(list.slice().reverse().slice(0, 20));
    expect(Object.keys(emitted[1].payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'rev', 'totalLines']);
    expect(emitted[1].payload).toMatchObject({ rev: 9, totalLines: 625, totalPages: 25 });

    jest.advanceTimersByTime(100);
    expect(emitted.slice(21).map(e => e.payload.page)).toEqual([5, 4, 3, 2, 1]);
  });

  it('more than 400 changed pages become one feed-resync', () => {
    const { gateway, emitted } = makeRig();
    const list = Array.from({ length: 401 }, (_, k) => k + 1);
    gateway.broadcastCut(SES, cut({ prevTotal: 0, totalLines: 401 * 25, changed: [0], pages: list.map(p => ({ p, d: 'd', lines: [line((p - 1) * 25)] })) }));
    expect(emitted).toEqual([{ room: `S${SES}`, event: 'realtime-events', payload: { type: 'feed-resync', nSesid: SES, rev: 9 } }]);
  });

  it('never throws: a cut the plan cannot read becomes a feed-resync (the round is already stored)', () => {
    const { gateway, emitted, logger } = makeRig();
    const plan = gateway.broadcastCut(SES, cut({ prevTotal: 50, totalLines: 51, changed: [50], pages: [] }));
    expect(plan.kind).toBe('resync');
    expect(emitted).toEqual([{ room: `S${SES}`, event: 'realtime-events', payload: { type: 'feed-resync', nSesid: SES, rev: 9 } }]);
    expect(logger.error).toHaveBeenCalled();
  });

  it('broadcastRound finds the changed lines against the pages the round replaced', () => {
    const { gateway, emitted } = makeRig();
    const before = { totalLines: 50, page: (p: number) => (p <= 2 ? pageOf(p) : null) };
    const rewritten = pageOf(2);
    rewritten[3] = line(28, 'corrected');
    gateway.broadcastRound({ nSesid: SES, rev: 12, totalLines: 50, pages: [{ p: 2, d: 'd2', lines: rewritten }] }, before, 25);
    expect(emitted.map(e => [e.event, e.payload.page, e.payload.rev])).toEqual([['previous-data', 2, 12]]);
  });
});

describe('edge-status for cloud viewers (spec 9 / 12; CONTRACTS.md 9.1 cloud-compatible names)', () => {
  const status = (over: Partial<EdgeViewerStatus> = {}): EdgeViewerStatus => ({
    nSesid: SES, state: 'live', atMs: T0, appliedRev: 41, totalLines: 1200, lastSyncedAtMs: T0 - 2_000, ...over,
  });

  afterEach(() => jest.useRealTimers());

  it('cloudEdgeStatus keeps every field and adds venue, since, lastSyncAt, lagLines, lagSec and catConnected', () => {
    expect(cloudEdgeStatus(status({ lagSec: 3, lagLines: 7, pendingPages: 1, catConnected: true }), T0 - 60_000)).toEqual({
      nSesid: SES, state: 'live', atMs: T0, appliedRev: 41, totalLines: 1200, lastSyncedAtMs: T0 - 2_000, lagSec: 3, lagLines: 7, pendingPages: 1, catConnected: true,
      venue: 'online', since: T0 - 60_000, lastSyncAt: T0 - 2_000,
    });
    // Silent box: at least now - lastSeen of lag; unknown CAT link reads false.
    expect(cloudEdgeStatus(status({ state: 'offline', reportedAtMs: T0 - 40_000, lastSyncedAtMs: T0 - 90_000 }), T0 - 40_000)).toMatchObject({ venue: 'offline', lagSec: 40, lagLines: 0, catConnected: false });
    expect(cloudEdgeStatus(status({ state: 'sealed', lagSec: 9 }), T0)).toMatchObject({ venue: 'online', lagSec: 0 });
    expect(['live', 'catching-up', 'offline', 'sealed'].map(s => venueOf(s as any))).toEqual(['online', 'catching-up', 'offline', 'online']);
  });

  it('fetch-data of a venue session: its status to the asking socket first, the snapshot tagged with the applied rev, then previous-data-end', async () => {
    const edge = fakeEdge({ [SES]: status({ state: 'offline', reportedAtMs: T0 - 30_000, lastSyncedAtMs: T0 - 45_000 }) }, { [SES]: 41 });
    const { gateway, emitted, feed } = makeRig({ edge, realFeed: true });
    feed.manager.setPageData(SES, 1, pageOf(1));
    feed.manager.setPageData(SES, 2, pageOf(2, 3));
    const viewer = fakeSocket('user');

    await gateway.fetchData(viewer, { nSesid: SES, nCaseid: CASE, tab: 7 });

    expect(emitted.map(e => [e.room, e.event, e.payload.page ?? null])).toEqual([
      [viewer.id, 'edge-status', null],
      [viewer.id, 'previous-data', 2],
      [viewer.id, 'previous-data', 1],
      [viewer.id, 'previous-data-end', null],
    ]);
    // "Venue box offline since <last contact> — transcript up to <last sync>".
    expect(emitted[0].payload).toMatchObject({ nSesid: SES, state: 'offline', venue: 'offline', since: T0 - 30_000, lastSyncAt: T0 - 45_000, lagSec: 30 });
    expect(emitted.slice(1, 3).map(e => e.payload.rev)).toEqual([41, 41]);
    (gateway as any).onModuleDestroy();
  });

  it('fetch-data of a legacy session with the edge module present: no edge-status and today\'s exact payload', async () => {
    const edge = fakeEdge();
    const { gateway, emitted, feed } = makeRig({ edge, realFeed: true });
    feed.manager.setPageData(SES, 1, pageOf(1, 2));

    await gateway.fetchData(fakeSocket('user'), { nSesid: SES, nCaseid: CASE, tab: 3 });

    expect(emitted.map(e => e.event)).toEqual(['previous-data', 'previous-data-end']);
    expect(Object.keys(emitted[0].payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']);
  });

  it('emitEdgeStatus sends the cloud payload to the room; since stays until the venue value changes', () => {
    const edge = fakeEdge();
    const { gateway, emitted } = makeRig({ edge });
    gateway.emitEdgeStatus(SES, status({ state: 'live', atMs: T0 }));
    gateway.emitEdgeStatus(SES, status({ state: 'live', atMs: T0 + 5_000, lagSec: 1 }));
    gateway.emitEdgeStatus(SES, status({ state: 'offline', atMs: T0 + 30_000, reportedAtMs: T0 + 12_000 }));

    expect(emitted.map(e => [e.room, e.event, e.payload.venue, e.payload.since])).toEqual([
      [`S${SES}`, 'edge-status', 'online', T0],
      [`S${SES}`, 'edge-status', 'online', T0],
      [`S${SES}`, 'edge-status', 'offline', T0 + 12_000],
    ]);
    expect(emitted[2].payload.lagSec).toBe(18);
    (gateway as any).onModuleDestroy();
  });

  it('the 5 s refresh re-sends only what changed, repairs a state change the edge module announced, and stops for sealed or unknown sessions', () => {
    jest.useFakeTimers();
    jest.setSystemTime(T0);
    const edge = fakeEdge({ [SES]: status() });
    const { gateway, emitted } = makeRig({ edge });
    gateway.emitEdgeStatus(SES, status());
    emitted.length = 0;

    gateway.refreshEdgeStatuses();
    expect(emitted).toEqual([]); // nothing changed

    edge.statuses[SES] = status({ state: 'catching-up', pendingPages: 12, atMs: T0 + 5_000 });
    jest.advanceTimersByTime(5_000);
    expect(emitted.map(e => [e.event, e.payload.venue, e.payload.pendingPages])).toEqual([['edge-status', 'catching-up', 12]]);

    edge.statuses[SES] = status({ state: 'sealed', atMs: T0 + 10_000 });
    jest.advanceTimersByTime(5_000);
    expect(emitted.map(e => e.payload.venue)).toEqual(['catching-up', 'online']);
    expect((gateway as any).edgeWatch.size).toBe(0);
    expect((gateway as any).edgeStatusTimer).toBeNull();
  });

  it('announceEdgeStatus sends the full payload of a venue session and answers false for anything else', () => {
    const edge = fakeEdge({ [SES]: status({ state: 'offline', reportedAtMs: T0 - 20_000 }) });
    const { gateway, emitted } = makeRig({ edge });
    expect(gateway.announceEdgeStatus(SES)).toBe(true);
    expect(emitted.map(e => [e.room, e.event, e.payload.venue])).toEqual([[`S${SES}`, 'edge-status', 'offline']]);
    expect(emitted[0].payload).toMatchObject({ nSesid: SES, state: 'offline', since: expect.any(Number), lagSec: expect.any(Number) });
    expect((gateway as any).edgeWatch.has(SES.toLowerCase())).toBe(true);
    expect(gateway.announceEdgeStatus('not-a-venue-session')).toBe(false);
    expect(emitted).toHaveLength(1);
    (gateway as any).onModuleDestroy();
    expect(makeRig({}).gateway.announceEdgeStatus(SES)).toBe(false);
  });

  it('without the edge module nothing about edge-status runs', async () => {
    const { gateway, emitted } = makeRig({ realFeed: true });
    gateway.refreshEdgeStatuses();
    await gateway.fetchData(fakeSocket('user'), { nSesid: SES, nCaseid: CASE, tab: 1 });
    expect(emitted.map(e => e.event)).toEqual(['previous-data-end']);
  });
});

describe('EdgeViewerAdapter and its provider', () => {
  const meta = { nSesid: SES, nEdgeid: 'edge-1', appliedRev: 41, totalLines: 1200, updatedAtMs: T0 - 2_000, sealed: null };

  it('reports the box\'s CAT link and when its last report arrived', () => {
    const adapter = new EdgeViewerAdapter(
      { peekMeta: () => meta as any, viewerState: () => 'live' as any },
      { sessionStatus: () => ({ reported: true, session: { lagSec: 2, lagLines: 4, dirtyPages: 1, catConnected: true }, receivedAtMs: T0 - 1_000 }), alert: jest.fn(), gateway: null } as any,
      () => T0,
    );
    expect(adapter.status(SES)).toEqual({
      nSesid: SES, state: 'live', atMs: T0, appliedRev: 41, totalLines: 1200, lastSyncedAtMs: T0 - 2_000,
      lagSec: 2, lagLines: 4, pendingPages: 1, catConnected: true, reportedAtMs: T0 - 1_000,
    });
    expect(adapter.appliedRev(SES)).toBe(41);
  });

  it('EDGE_VIEWER_PROVIDER builds the port from the two services EdgeModule exports', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EDGE_VIEWER_PROVIDER,
        { provide: EdgeSyncService, useValue: { peekMeta: () => null, viewerState: () => null } },
        { provide: EdgeRegistryService, useValue: { sessionStatus: () => null, alert: jest.fn(), gateway: null } },
      ],
    }).compile();
    const port = moduleRef.get<EdgeViewerPort>(EDGE_VIEWER_PORT);
    expect(port).toBeInstanceOf(EdgeViewerAdapter);
    expect(port.status(SES)).toBeNull();
    expect(port.appliedRev(SES)).toBeUndefined();
  });
});
