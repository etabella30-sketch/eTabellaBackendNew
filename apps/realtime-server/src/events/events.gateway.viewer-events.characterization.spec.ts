import * as fs from 'fs';
import * as path from 'path';

import { EventsGateway } from './events.gateway';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { UsersService } from '../services/users/users.service';
import { UtilityService } from '../services/utility/utility.service';

/**
 * Characterization of what a transcript viewer receives today (RT edge plan R-T2 / D14, preserved
 * behaviour (3): viewer events unchanged except the D12 page order). The gateway runs with the real
 * FeedDataService, so `fetch-data` is pinned end to end: the event names, who they go to, and every
 * field of `previous-data` / `previous-data-end`.
 *
 * The page ORDER of the live snapshot has its own test below, because D12 changes it on purpose.
 *
 * Already pinned elsewhere, not repeated: events.gateway.spec.ts covers the annotation read as the
 * token user, `previous-data-end` after the pages and for a session with no line yet, and refusals;
 * feed-data.stream-session.spec.ts covers per-page counts, no timer between pages and yielding the loop.
 * The live `message` / `feed-refresh-data` / lost-data `previous-data` broadcasts are pinned in
 * events.gateway.legacy-ingest.characterization.spec.ts.
 */

const ME = '11111111-1111-4111-8111-111111111111';
const SES = '33333333-3333-4333-8333-333333333333';
const CASE = '44444444-4444-4444-8444-444444444444';

const codes = (text: string) => Array.from(text, ch => ch.charCodeAt(0));
const line = (index: number, text = `line ${index}`) =>
  [`10:00:${String(index % 60).padStart(2, '0')}:00`, codes(text), index, 'FL', Math.floor(index / 25) + 1, (index % 25) + 1, 7000 + index, [], 0];
const lines = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => line(from + i));

function fakeSocket(kind: 'user' | 'anonymous', id = `sock-${Math.random().toString(36).slice(2, 10)}`) {
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

function makeRig(annotations: [any[], any[]] = [[], []]) {
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const server = {
    to: jest.fn((room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) })),
    in: jest.fn(),
  };
  const redis = {
    scanKeys: jest.fn().mockResolvedValue([]),
    getValue: jest.fn().mockResolvedValue(null),
    setValue: jest.fn().mockResolvedValue(undefined),
    getAllValues: jest.fn().mockResolvedValue(null),
    deleteSessionPages: jest.fn().mockResolvedValue(undefined),
  };
  const feed = new FeedDataService({ server } as any, redis as any, { error: jest.fn() } as any, new UtilityService({} as any));
  clearInterval((feed as any).flushTimer); // no live flush into data/ from a spec
  (feed as any).restoredSessions.add(SES); // disk restore already checked: no data/ read
  (feed as any).logger = { verbose: jest.fn(), error: jest.fn(), warn: jest.fn(), log: jest.fn() };
  const queue = (feed as any).queue;
  const settle = (): Promise<void> => (queue.idle() ? Promise.resolve() : queue.drain());

  const streamData = { stopDemoStream: jest.fn(), streamData: jest.fn().mockResolvedValue(undefined), streamDataByPage: jest.fn(), streamDemoData: jest.fn() };
  const issue = { getAnnotationOfPages: jest.fn().mockResolvedValue(annotations) };
  const gateway = new EventsGateway(
    streamData as any,
    { saveLostData: jest.fn().mockResolvedValue(undefined) } as any,
    { joiningLog: jest.fn().mockResolvedValue({}), getSessiondata: jest.fn().mockResolvedValue([]) } as any,
    new UsersService(),
    issue as any,
    {} as any,
    feed,
    {} as any,
    { rowQuery: jest.fn().mockResolvedValue({ success: true, data: [{ '?column?': 1 }] }) } as any,
  );
  gateway.server = server as any;
  (gateway as any).logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn(), fatal: jest.fn(), verbose: jest.fn() };
  return { gateway, feed, emitted, streamData, settle };
}

const previousData = (emitted: Array<{ event: string; payload: any }>) => emitted.filter(e => e.event === 'previous-data');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

describe('EventsGateway viewer events (characterization): fetch-data on a live session', () => {
  it('sends one previous-data per page to the asking socket only, then previous-data-end', async () => {
    const facts = [{ nIDid: 'f1', pageIndex: 1 }, { nIDid: 'f2', pageIndex: '2' }, { nIDid: 'f9', pageIndex: 9 }];
    const marks = [{ nHid: 'h2', cPageno: '2' }, { nHid: 'h2b', cPageno: 2 }];
    const { gateway, feed, emitted } = makeRig([facts, marks]);
    feed.manager.setPageData(SES, 1, lines(0, 24));
    feed.manager.setPageData(SES, 2, lines(25, 26));
    const viewer = fakeSocket('user');

    await gateway.fetchData(viewer, { nSesid: SES, nCaseid: CASE, tab: 5 });

    expect(emitted.every(e => e.room === viewer.id)).toBe(true);
    expect(emitted.map(e => e.event)).toEqual(['previous-data', 'previous-data', 'previous-data-end']);
    const byPage = previousData(emitted).map(e => e.payload).sort((x, y) => x.page - y.page);
    expect(byPage).toEqual([
      { msg: 1, page: 1, data: JSON.stringify(lines(0, 24)), totalPages: 2, nSesid: SES, a: [facts[0]], h: [], tab: 5 },
      { msg: 1, page: 2, data: JSON.stringify(lines(25, 26)), totalPages: 2, nSesid: SES, a: [facts[1]], h: marks, tab: 5 },
    ]);
    // The wire order of the fields as well: D12 keeps every field of the payload as it is.
    expect(Object.keys(byPage[0])).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']);
    expect(emitted[2].payload).toEqual({ nSesid: SES, tab: 5 });
  });

  it('totalPages is the number of pages held, not the highest page number', async () => {
    const { gateway, feed, emitted } = makeRig();
    for (const page of [1, 2, 10]) feed.manager.setPageData(SES, page, [line((page - 1) * 25)]);

    await gateway.fetchData(fakeSocket('user'), { nSesid: SES, nCaseid: CASE, tab: 1 });

    expect(previousData(emitted).map(e => [e.payload.page, e.payload.totalPages]).sort((x, y) => x[0] - y[0]))
      .toEqual([[1, 3], [2, 3], [10, 3]]);
  });

  // D12 (answered 2026-10-01, the user chose newest-first over the recommendation) INTENTIONALLY
  // changed this pin: before, the memory path sent [1, 2, 10] (its sort compared [key, value] pairs,
  // Number(pair) = NaN, a no-op that left the store's ascending key order). The live snapshot now
  // comes from the shared builder (libs/edge-sync/snapshot.ts), highest page number first, the
  // order the disk path (libs/global stream-data.service.ts) and the venue box already send. Only
  // the order changed: every payload field and `previous-data-end` after the last page are pinned
  // unchanged by the other tests in this file (they sort by page before comparing). The FE renders
  // nothing until the snapshot completes (realtime-live-feed.store.ts keys pages by number and waits
  // for previous-data-end), so the order changes only which page arrives first.
  it('D12 page order: the live snapshot sends pages newest first (highest page number first)', async () => {
    const { gateway, feed, emitted } = makeRig();
    for (const page of [10, 2, 1]) feed.manager.setPageData(SES, page, [line((page - 1) * 25)]);

    await gateway.fetchData(fakeSocket('user'), { nSesid: SES, nCaseid: CASE, tab: 1 });

    expect(previousData(emitted).map(e => e.payload.page)).toEqual([10, 2, 1]);
    expect(emitted[emitted.length - 1].event).toBe('previous-data-end');
  });

  it('lines a legacy venue sent are exactly what a later viewer fetch returns', async () => {
    const { gateway, emitted, settle } = makeRig();
    const venue = fakeSocket('anonymous');
    // The venue's page sync on connect, then its live two-line emit across the page boundary.
    await gateway.handleTcpData({ i: 25, d: lines(0, 24), date: SES, l: 25, p: 1 }, venue);
    const line24Final = line(24, 'line 24, finished');
    await gateway.handleTcpData({ i: 25, d: [line24Final, line(25)], date: SES, l: 25, p: 2 }, venue);
    await settle();
    emitted.length = 0;

    const viewer = fakeSocket('user');
    await gateway.fetchData(viewer, { nSesid: SES, nCaseid: CASE, tab: 2 });

    const byPage = previousData(emitted).map(e => e.payload).sort((x, y) => x.page - y.page);
    expect(byPage.map(p => [p.page, p.totalPages, JSON.parse(p.data)])).toEqual([
      [1, 2, [...lines(0, 23), line24Final]],
      [2, 2, [line(25)]],
    ]);
    expect(emitted[emitted.length - 1]).toEqual({ room: viewer.id, event: 'previous-data-end', payload: { nSesid: SES, tab: 2 } });
  });
});

describe('EventsGateway viewer events (characterization): fetch-data source choice', () => {
  const folder = path.join('data', `dt_${SES}`);
  let exists: jest.SpyInstance;

  beforeEach(() => {
    const realExists = fs.existsSync;
    exists = jest.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => (String(p) === folder ? true : realExists(p)));
  });
  afterEach(() => exists.mockRestore());

  it('an ended session (nothing in memory, data/dt_<id> on disk) is streamed from disk, then previous-data-end', async () => {
    const facts = [{ nIDid: 'f1', pageIndex: 1 }];
    const marks = [{ nHid: 'h1', cPageno: 1 }];
    const { gateway, emitted, streamData } = makeRig([facts, marks]);
    const order: string[] = [];
    streamData.streamData.mockImplementation(async () => { order.push('disk pages'); });
    const viewer = fakeSocket('user');

    await gateway.fetchData(viewer, { nSesid: SES, nCaseid: CASE, tab: 4 });

    expect(exists).toHaveBeenCalledWith(folder);
    expect(streamData.streamData).toHaveBeenCalledWith('data', viewer.id, { nSesid: SES, nCaseid: CASE, tab: 4, nUserid: ME }, expect.any(Function), facts, marks);
    order.push(...emitted.map(e => e.event));
    expect(order).toEqual(['disk pages', 'previous-data-end']);
    expect(emitted).toEqual([{ room: viewer.id, event: 'previous-data-end', payload: { nSesid: SES, tab: 4 } }]);
  });

  it('a live session is served from memory even when its disk folder exists', async () => {
    const { gateway, feed, emitted, streamData } = makeRig();
    feed.manager.setPageData(SES, 1, lines(0, 1));

    await gateway.fetchData(fakeSocket('user'), { nSesid: SES, nCaseid: CASE, tab: 1 });

    expect(streamData.streamData).not.toHaveBeenCalled();
    expect(emitted.map(e => e.event)).toEqual(['previous-data', 'previous-data-end']);
  });
});
