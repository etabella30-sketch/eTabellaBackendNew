import { FeedDataService } from './feed-data.service';

const SES = '31ae9a74-7d69-4996-a78b-9c29b7af9653';

/** The service with only what streamSessionData touches. */
function makeService(pages: Record<string, unknown[]>) {
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const service = Object.create(FeedDataService.prototype) as FeedDataService;
  const delay = jest.fn().mockResolvedValue(undefined);
  Object.assign(service, {
    readSessionData: jest.fn().mockResolvedValue(pages),
    io: { server: { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) }) } },
    util: { delay },
    log: { error: jest.fn() },
    logger: { verbose: jest.fn(), error: jest.fn() },
  });
  return { service, emitted, delay };
}

const pagesOf = (count: number): Record<string, unknown[]> =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [String(i + 1), [[`10:00:${i}`, `line on page ${i + 1}`, i * 25]]]));

describe('FeedDataService.streamSessionData', () => {
  afterEach(() => jest.useRealTimers());

  // D12 (RT edge ledger): the memory path sends NEWEST PAGE FIRST, [3, 2, 1], through the shared
  // snapshot builder (libs/edge-sync snapshot.ts). Only the order changed: room, event, totalPages,
  // tab, nSesid, each page's own a / h and its data JSON are as before (the two lines below read
  // the same pages at their new positions).
  it('sends every page to the asking socket with its count, the fetch tab and its own marks', async () => {
    const { service, emitted } = makeService(pagesOf(3));
    await service.streamSessionData('sock-1', { nSesid: SES, tab: 4 },
      [{ nIDid: 'a2', pageIndex: 2 }], [{ nHid: 'h3', cPageno: '3' }]);

    expect(emitted.map(e => [e.room, e.event, e.payload.page, e.payload.totalPages, e.payload.tab, e.payload.nSesid]))
      .toEqual([3, 2, 1].map(page => ['sock-1', 'previous-data', page, 3, 4, SES]));
    expect(emitted.map(e => [e.payload.a.length, e.payload.h.length])).toEqual([[0, 1], [1, 0], [0, 0]]);
    expect(JSON.parse(emitted[2].payload.data)).toEqual([['10:00:0', 'line on page 1', 0]]);
  });

  // Measured on etabella.net 2026-09-30: 128 pages took 1.35s to leave the
  // server (a 10ms wait after each), all of it spent by the viewer on a skeleton.
  it('waits on no timer between pages', async () => {
    jest.useFakeTimers({ doNotFake: ['setImmediate', 'nextTick'] });
    const { service, emitted, delay } = makeService(pagesOf(128));

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 1 }, [], []);   // would never resolve on a faked timer

    expect(emitted).toHaveLength(128);
    expect(delay).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });

  it('still hands the loop back between pages, so other work is not held up by a long transcript', async () => {
    const { service, emitted } = makeService(pagesOf(5));
    let sentWhenOtherWorkRan = -1;
    setImmediate(() => { sentWhenOtherWorkRan = emitted.length; });

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 1 }, [], []);

    expect(emitted).toHaveLength(5);
    expect(sentWhenOtherWorkRan).toBeGreaterThanOrEqual(0);
    expect(sentWhenOtherWorkRan).toBeLessThan(5);
  });

  it('sends nothing for a session with no page yet', async () => {
    const { service, emitted } = makeService({});
    await service.streamSessionData('sock-1', { nSesid: SES, tab: 1 }, [], []);
    expect(emitted).toEqual([]);
  });
});
