import * as fs from 'fs';

import { sanitizeLineCodes as canonicalSanitizeLineCodes } from '@app/edge-sync';

import { FeedDataApplyAdapter } from '../../edge/edge-apply.port';
import { UtilityService } from '../utility/utility.service';
import { FEED_PAGE_TTL_SEC, FeedDataService } from './feed-data.service';

/**
 * The venue / cut-mode side of the feed store (RT edge spec 5.5 step 5, 5.8, 7; ledger D11, D12, D17,
 * D20, D21): applyPagesAtomic, runBarrier, the one pipelined Redis batch per round (also when the edge
 * module's FeedDataApplyAdapter drives the store through setPage / deleteExtraPages), the whole-round
 * retry after a failed batch, and the rev tag on fetch-data snapshots.
 *
 * Nothing touches Redis or the disk: the real service runs against an in-memory Redis stand-in whose
 * pipelines are recorded, its live flush timer is stopped and the disk restore is marked done.
 */

const SES = '5c1d2e3f-4a5b-4c6d-8e7f-0a1b2c3d4e5f';
const OTHER = '6d2e3f4a-5b6c-4d7e-9f8a-1b2c3d4e5f6a';

const codes = (text: string) => Array.from(text, ch => ch.charCodeAt(0));
const line = (index: number, text = `line ${index}`) => ['10:00:00:00', codes(text), index, 'FL', Math.floor(index / 25) + 1, (index % 25) + 1, 9000 + index, [], 0];
const page = (p: number, count = 25, text?: string) => Array.from({ length: count }, (_, k) => line((p - 1) * 25 + k, text));
const key = (p: number, ses = SES) => `session:${ses}:${p}`;

function fakeRedis() {
  const store = new Map<string, string>();
  /** Every pipeline that was executed: its commands in order. */
  const batches: any[][][] = [];
  let failure: Error | null = null;
  const client = {
    pipeline: () => {
      const commands: any[][] = [];
      const pipeline = {
        set: (...args: any[]) => { commands.push(['set', ...args]); return pipeline; },
        del: (...keys: any[]) => { commands.push(['del', ...keys]); return pipeline; },
        exec: async () => {
          batches.push(commands);
          if (failure) throw failure;
          for (const c of commands) {
            if (c[0] === 'set') store.set(c[1], c[2]);
            else for (const k of c.slice(1)) store.delete(k);
          }
          return commands.map(() => [null, 'OK']);
        },
      };
      return pipeline;
    },
  };
  return { client, store, batches, failWith: (error: Error | null) => { failure = error; } };
}

function makeService(opts: { redis?: ReturnType<typeof fakeRedis> | null } = {}) {
  const redis = opts.redis === undefined ? fakeRedis() : opts.redis;
  const db = {
    scanKeys: jest.fn().mockResolvedValue([]),
    getValue: jest.fn().mockResolvedValue(null),
    setValue: jest.fn().mockResolvedValue(undefined),
    deleteValue: jest.fn().mockResolvedValue(undefined),
    getAllValues: jest.fn().mockResolvedValue(null),
    deleteSessionPages: jest.fn().mockResolvedValue(true),
  };
  const log = { error: jest.fn(), info: jest.fn() };
  const emitted: Array<{ room: string; event: string; payload: any }> = [];
  const io = { server: { to: (room: string) => ({ emit: (event: string, payload: any) => emitted.push({ room, event, payload }) }) } };
  const service = new FeedDataService(io as any, db as any, log as any, new UtilityService({} as any), (redis?.client ?? undefined) as any);
  clearInterval((service as any).flushTimer); // no live flush into data/ from a spec
  (service as any).restoredSessions.add(SES); // disk restore already checked: no data/ read
  (service as any).restoredSessions.add(OTHER);
  (service as any).logger = { verbose: jest.fn(), error: jest.fn(), warn: jest.fn(), log: jest.fn() };
  const queue = (service as any).queue;
  const settle = (): Promise<void> => (queue.idle() ? Promise.resolve() : queue.drain());
  const held = (ses = SES) => [...service.pageSnapshot(ses).keys()].sort((a, b) => a - b);
  return { service, db, log, redis, emitted, settle, held };
}

const sets = (batch: any[][]) => batch.filter(c => c[0] === 'set').map(c => c[1]);
const dels = (batch: any[][]) => batch.filter(c => c[0] === 'del').flatMap(c => c.slice(1));

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

beforeEach(() => {
  // pruneDiskPagesAbove looks for data/dt_<id>; answer "not there" instead of reading the disk.
  const realExists = fs.existsSync;
  jest.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => (/dt_(5c1d2e3f|6d2e3f4a)/.test(String(p)) ? false : realExists(p)));
});
afterEach(() => (fs.existsSync as unknown as jest.Mock).mockRestore());

describe('FeedDataService.applyPagesAtomic (D17, D21)', () => {
  it('swaps memory before its first await: every page of the round is in place, dropped pages are gone', async () => {
    const { service, held, settle } = makeService();
    await settle();
    for (const p of [1, 2, 3, 4]) service.manager.setPageData(SES, p, page(p));

    const pending = service.applyPagesAtomic(SES, {
      nLines: 25, totalLines: 30, deletePagesAbove: 2, rev: 7,
      pages: [{ p: 1, lines: page(1, 25, 'rewritten') }, { p: 2, lines: page(2, 5, 'rewritten') }],
    });
    // Nothing was awaited yet: a fetch-data that runs now sees the whole round and nothing of the old tail.
    expect(held()).toEqual([1, 2]);
    expect(service.manager.getPageData(SES, 2)).toHaveLength(5);
    expect(service.sessionRev(SES)).toBe(7);

    await expect(pending).resolves.toEqual({ redisOk: true, appliedPages: 2, deletedPages: [3, 4] });
  });

  it('writes the round to Redis in ONE pipeline: a SET with the 48 h TTL per page, never page by page', async () => {
    const { service, db, redis, settle } = makeService();
    await settle();
    const pages = [1, 2, 3].map(p => ({ p, lines: page(p) }));

    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 75, deletePagesAbove: 3, pages }));

    expect(res.redisOk).toBe(true);
    expect(redis!.batches).toHaveLength(1);
    expect(redis!.batches[0]).toEqual(pages.map(pg => ['set', key(pg.p), JSON.stringify(pg.lines), 'EX', FEED_PAGE_TTL_SEC]));
    expect(FEED_PAGE_TTL_SEC).toBe(172800);
    expect(db.setValue).not.toHaveBeenCalled();
    expect(db.deleteSessionPages).not.toHaveBeenCalled();
  });

  it('a shrink deletes the dropped Redis pages in the same pipeline', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 100, deletePagesAbove: 4, pages: [1, 2, 3, 4].map(p => ({ p, lines: page(p) })) }));
    redis!.batches.length = 0;

    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 30, deletePagesAbove: 2, pages: [{ p: 2, lines: page(2, 5) }] }));

    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0])).toEqual([key(2)]);
    expect(dels(redis!.batches[0])).toEqual([key(3), key(4)]);
    expect([...redis!.store.keys()].sort()).toEqual([key(1), key(2)]);
  });

  // Regression (step 8): the barrier used to send the batch applyPagesAtomic had already sent a second time.
  it('a round inside a barrier leaves exactly once, also after the barrier ends', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 50, deletePagesAbove: 2, pages: [1, 2].map(p => ({ p, lines: page(p) })) }));
    await settle();
    expect(redis!.batches).toHaveLength(1);
  });

  it('pages set earlier in the same barrier ride in the round\'s pipeline; later ones in one more at the end', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, async () => {
      await service.setPage(SES, 1, page(1));
      await service.applyPagesAtomic(SES, { nLines: 25, totalLines: 50, deletePagesAbove: 2, pages: [{ p: 2, lines: page(2) }] });
      await service.setPage(SES, 2, page(2, 25, 'after the round'));
    });
    expect(redis!.batches.map(b => sets(b).sort())).toEqual([[key(1), key(2)], [key(2)]]);
    expect(JSON.parse(redis!.store.get(key(2))!)).toEqual(page(2, 25, 'after the round'));
  });

  it('refuses a malformed round before touching the store', async () => {
    const { service, redis, held, settle } = makeService();
    await settle();
    service.manager.setPageData(SES, 1, page(1));
    service.manager.setPageData(SES, 2, page(2));
    for (const input of [
      { nLines: 25, totalLines: 25, deletePagesAbove: -1, pages: [{ p: 1, lines: page(1) }] },
      { nLines: 25, totalLines: 25, deletePagesAbove: Number.NaN, pages: [{ p: 1, lines: page(1) }] },
      { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: page(1) }, { p: 0, lines: [] }] },
      { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: 'x' as any }] },
      { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: page(1) }, { p: 2, lines: page(2) }] },
    ]) {
      await expect(service.runBarrier(SES, () => service.applyPagesAtomic(SES, input as any))).rejects.toThrow(RangeError);
    }
    expect(held()).toEqual([1, 2]);
    expect(redis!.batches).toHaveLength(0);
  });

  it('stores the lines as given: no re-canonicalising, no sanitizing, any page size', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    const withFrameBytes = [['10:00:00:00', [0x0c, 0x31, 0x32, 0x33, 0x34, 65], 0, 'FL', 1, 1, 1, [], 0]];
    const thirty = Array.from({ length: 30 }, (_, k) => line(k));

    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 30, totalLines: 31, deletePagesAbove: 2, pages: [{ p: 1, lines: thirty }, { p: 2, lines: withFrameBytes }] }));

    expect(service.manager.getPageData(SES, 1)).toBe(thirty);
    expect(service.manager.getPageData(SES, 2)).toBe(withFrameBytes);
    expect(JSON.parse(redis!.store.get(key(2))!)).toEqual(withFrameBytes);
  });

  it('marks the pages dirty for the 1 s disk flush', async () => {
    const { service, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 50, deletePagesAbove: 2, pages: [{ p: 1, lines: page(1) }, { p: 2, lines: page(2) }] }));
    expect([...(service as any).dirtyPages.get(SES)]).toEqual([1, 2]);
  });

  it('keeps the page digests and the rev of the round in memory only', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 25, deletePagesAbove: 1, rev: 12, digests: ['d1'], pages: [{ p: 1, d: 'd1', lines: page(1) }] }));
    expect(service.pageDigests(SES)).toEqual(['d1']);
    expect(service.sessionRev(SES)).toBe(12);
    // Redis holds only the page keys: no digest, no meta beside them.
    expect([...redis!.store.keys()]).toEqual([key(1)]);
  });
});

describe('FeedDataService Redis batch failure (D17 error path)', () => {
  it('never throws: the round stays in memory, redisOk is false and the failure is logged', async () => {
    const { service, redis, log, held, settle } = makeService();
    await settle();
    redis!.failWith(new Error('READONLY replica'));

    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 50, deletePagesAbove: 2, pages: [{ p: 1, lines: page(1) }, { p: 2, lines: page(2) }] }));

    expect(res).toEqual({ redisOk: false, appliedPages: 2, deletedPages: [] });
    expect(held()).toEqual([1, 2]);
    expect(redis!.store.size).toBe(0);
    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('READONLY replica'), `feed/${SES}`);
    // The disk flush is unaffected.
    expect([...(service as any).dirtyPages.get(SES)]).toEqual([1, 2]);
  });

  it('retries the WHOLE failed round as one batch with the session\'s next round', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 100, deletePagesAbove: 4, pages: [1, 2, 3, 4].map(p => ({ p, lines: page(p) })) }));
    redis!.failWith(new Error('connection lost'));
    // Round 2 rewrites page 1, shrinks to 3 pages, and fails.
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 75, deletePagesAbove: 3, pages: [{ p: 1, lines: page(1, 25, 'round 2') }] }));
    redis!.failWith(null);
    redis!.batches.length = 0;

    // Round 3 touches page 3 only; Redis also gets round 2's page 1 and its DEL of page 4.
    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 75, deletePagesAbove: 3, pages: [{ p: 3, lines: page(3, 25, 'round 3') }] }));

    expect(res.redisOk).toBe(true);
    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0]).sort()).toEqual([key(1), key(3)]);
    expect(dels(redis!.batches[0])).toEqual([key(4)]);
    expect(JSON.parse(redis!.store.get(key(1))!)).toEqual(page(1, 25, 'round 2'));
    expect(redis!.store.has(key(4))).toBe(false);
  });

  // Regression (step 8): the retried DEL of a shrink must not take pages a later round grew back.
  it('a retried shrink keeps the pages a later round grew back: they are SET, not deleted', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 100, deletePagesAbove: 4, pages: [1, 2, 3, 4].map(p => ({ p, lines: page(p) })) }));
    redis!.failWith(new Error('connection lost'));
    // Shrinks to 3 pages; its DEL of page 4 fails and is kept.
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 75, deletePagesAbove: 3, pages: [{ p: 3, lines: page(3) }] }));
    redis!.failWith(null);
    redis!.batches.length = 0;

    // Grows to 5 pages again.
    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 125, deletePagesAbove: 5, pages: [4, 5].map(p => ({ p, lines: page(p, 25, 'grown') })) }));

    expect(res.redisOk).toBe(true);
    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0]).sort()).toEqual([key(3), key(4), key(5)]);
    expect(dels(redis!.batches[0])).toEqual([]);
    expect(JSON.parse(redis!.store.get(key(5))!)).toEqual(page(5, 25, 'grown'));
    expect([...redis!.store.keys()].sort()).toEqual([1, 2, 3, 4, 5].map(p => key(p)));
  });

  it('a failed round of one session is not resent with another session\'s round', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    redis!.failWith(new Error('down'));
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: page(1) }] }));
    redis!.failWith(null);
    redis!.batches.length = 0;

    await service.runBarrier(OTHER, () => service.applyPagesAtomic(OTHER, { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: page(1) }] }));

    expect(sets(redis!.batches[0])).toEqual([key(1, OTHER)]);
  });

  it('a pipeline whose reply carries an error counts as failed', async () => {
    const redis = fakeRedis();
    const { service, settle } = makeService({ redis });
    await settle();
    const realPipeline = redis.client.pipeline;
    redis.client.pipeline = () => {
      const p: any = realPipeline();
      p.exec = async () => [[new Error('OOM command not allowed'), null]];
      return p;
    };
    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 25, deletePagesAbove: 1, pages: [{ p: 1, lines: page(1) }] }));
    expect(res.redisOk).toBe(false);
  });

  it('without a raw Redis connection the batch goes through RedisDbService, still after the memory swap', async () => {
    const { service, db, settle } = makeService({ redis: null });
    await settle();
    const res = await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 50, deletePagesAbove: 2, pages: [{ p: 1, lines: page(1) }, { p: 2, lines: page(2) }] }));
    expect(res.redisOk).toBe(true);
    expect(db.setValue.mock.calls.map(c => [c[0], c[2]])).toEqual([[key(1), FEED_PAGE_TTL_SEC], [key(2), FEED_PAGE_TTL_SEC]]);
  });
});

describe('FeedDataService.runBarrier', () => {
  it('runs as one task of the feed queue: after the lines already received, before the ones that follow', async () => {
    const { service, settle } = makeService();
    await settle();
    const order: string[] = [];
    const real = service.addLiveFeedData.bind(service);
    jest.spyOn(service, 'addLiveFeedData').mockImplementation(async (msg: any) => { order.push(`feed ${msg.i}`); return real(msg); });

    service.feedReceive({ i: 1, d: [line(0)], date: SES, l: 25, p: 1 });
    const barrier = service.runBarrier(SES, async () => {
      order.push('barrier start');
      await new Promise(resolve => setTimeout(resolve, 5));
      order.push('barrier end');
      return 'done';
    });
    service.feedReceive({ i: 2, d: [line(1)], date: SES, l: 25, p: 1 });

    await expect(barrier).resolves.toBe('done');
    await settle();
    expect(order).toEqual(['feed 1', 'barrier start', 'barrier end', 'feed 2']);
  });

  it('passes a rejection through and keeps the queue running', async () => {
    const { service, settle } = makeService();
    await settle();
    await expect(service.runBarrier(SES, async () => { throw new Error('refused'); })).rejects.toThrow('refused');
    await expect(service.runBarrier(SES, async () => 2)).resolves.toBe(2);
  });

  it('resolves only once the barrier\'s Redis batch was sent', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, async () => {
      await service.setPage(SES, 1, page(1));
    });
    expect(redis!.batches).toHaveLength(1);
  });

  it('pages a barrier sets one by one (a disk restore) still leave in one pipeline when it ends', async () => {
    const { service, db, redis, settle } = makeService();
    await settle();
    await service.runBarrier(SES, async () => {
      for (const p of [1, 2, 3]) await service.setPage(SES, p, page(p));
      expect(redis!.batches).toHaveLength(0); // nothing sent while the barrier runs
    });
    await settle();
    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0])).toEqual([key(1), key(2), key(3)]);
    expect(db.setValue).not.toHaveBeenCalled();
  });
});

describe('the edge module\'s FeedDataApplyAdapter over this store (D17 through the adapter\'s own calls)', () => {
  const plan = (pages: Array<{ p: number; lines: unknown[] }>, deletePagesAbove: number, droppedPages: number[] = []) =>
    ({ nSesid: SES, rev: 3, totalLines: 0, root: '', pages: pages.map(pg => ({ ...pg, d: `d${pg.p}` })), digests: [], deletePagesAbove, droppedPages }) as any;

  it('one round = one pipelined Redis batch, sent inside the round\'s queue task', async () => {
    const { service, db, redis, settle } = makeService();
    await settle();
    const adapter = new FeedDataApplyAdapter(() => ({ feed: service as any, io: null }));

    const outcome = await adapter.runBarrier(SES, () => adapter.applyRoundAtomic(SES, plan([1, 2, 3, 4, 5].map(p => ({ p, lines: page(p) })), 5)));
    await settle();

    expect(outcome.appliedPages).toBe(5);
    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0])).toEqual([1, 2, 3, 4, 5].map(p => key(p)));
    expect(db.setValue).not.toHaveBeenCalled();
  });

  it('a shrinking round: memory is swapped at once, and the SETs and the DEL share the one batch', async () => {
    const { service, db, redis, held, settle } = makeService();
    await settle();
    const adapter = new FeedDataApplyAdapter(() => ({ feed: service as any, io: null }));
    await adapter.runBarrier(SES, () => adapter.applyRoundAtomic(SES, plan([1, 2, 3].map(p => ({ p, lines: page(p) })), 3)));
    await settle();
    redis!.batches.length = 0;

    await adapter.runBarrier(SES, () => adapter.applyRoundAtomic(SES, plan([{ p: 1, lines: page(1, 10, 'short') }], 1, [2, 3])));
    await settle();

    expect(held()).toEqual([1]);
    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0])).toEqual([key(1)]);
    expect(dels(redis!.batches[0])).toEqual([key(2), key(3)]);
    expect(db.deleteSessionPages).not.toHaveBeenCalled();
    expect([...redis!.store.keys()]).toEqual([key(1)]);
  });

  it('a failed batch is retried whole with the session\'s next round', async () => {
    const { service, redis, settle } = makeService();
    await settle();
    const adapter = new FeedDataApplyAdapter(() => ({ feed: service as any, io: null }));
    redis!.failWith(new Error('down'));
    await adapter.runBarrier(SES, () => adapter.applyRoundAtomic(SES, plan([1, 2].map(p => ({ p, lines: page(p) })), 2)));
    await settle();
    redis!.failWith(null);
    redis!.batches.length = 0;

    await adapter.runBarrier(SES, () => adapter.applyRoundAtomic(SES, plan([{ p: 3, lines: page(3) }], 3)));
    await settle();

    expect(redis!.batches).toHaveLength(1);
    expect(sets(redis!.batches[0]).sort()).toEqual([key(1), key(2), key(3)]);
  });
});

describe('FeedDataService legacy path next to the batch (RC-2: unchanged)', () => {
  it('a legacy TCP-DATA still writes each placed page to Redis as it is set, with no pipeline', async () => {
    const { service, db, redis, settle } = makeService();
    await settle();
    service.feedReceive({ i: 26, d: [line(24), line(25)], date: SES, l: 25, p: 2 });
    await settle();

    expect(db.setValue.mock.calls.map(c => c[0])).toEqual([key(1), key(2)]);
    expect(redis!.batches).toHaveLength(0);
  });

  it('a legacy refresh still deletes extra pages through RedisDbService', async () => {
    const { service, db, redis, settle } = makeService();
    await settle();
    jest.spyOn(service, 'logOfData').mockResolvedValue(true);
    jest.spyOn(service, 'printRecRefresh').mockResolvedValue(undefined);
    service.feedReceive({ i: 26, d: Array.from({ length: 26 }, (_, k) => line(k)), date: SES, l: 25, p: 2 });
    service.refreshReceive({ nSesid: SES, startInd: 0, endInd: 0, newLines: [], start: '09:00:00:00', end: '09:00:01:00', startPage: 1, current_refresh: 1 });
    await settle();

    expect(db.deleteSessionPages).toHaveBeenCalledWith(SES, 2);
    expect(redis!.batches).toHaveLength(0);
  });
});

describe('FeedDataService.sanitizeLineCodes', () => {
  it('is the canonical implementation of libs/edge-sync', () => {
    const service = Object.create(FeedDataService.prototype) as FeedDataService;
    const leaked = [0x0f, ...codes('RT240901'), ...codes('THE COURT'), 0x0c, ...codes('0012'), 0x0c];
    expect(service.sanitizeLineCodes(leaked)).toEqual(codes('THE COURT'));
    expect(service.sanitizeLineCodes(leaked)).toEqual(canonicalSanitizeLineCodes(leaked));
    const clean = codes('no frame bytes');
    expect(service.sanitizeLineCodes(clean)).toBe(clean);
    expect(service.sanitizeLineCodes(undefined as any)).toEqual([]);
    expect(service.sanitizeLineCodes('text' as any)).toBe('text');
  });
});

describe('FeedDataService.streamSessionData (D11, D12, D20)', () => {
  it('sends the pages newest first by page number, whatever order the store holds them in', async () => {
    const { service, emitted, settle } = makeService();
    await settle();
    for (const p of [10, 2, 1, 9]) service.manager.setPageData(SES, p, [line((p - 1) * 25)]);

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 3 }, [], []);

    expect(emitted.map(e => e.payload.page)).toEqual([10, 9, 2, 1]);
    expect(emitted.every(e => e.room === 'sock-1' && e.event === 'previous-data' && e.payload.totalPages === 4)).toBe(true);
  });

  it('a legacy session carries no rev: the payload has exactly today\'s fields', async () => {
    const { service, emitted, settle } = makeService();
    await settle();
    service.feedReceive({ i: 1, d: [line(0)], date: SES, l: 25, p: 1 });
    await settle();

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 3 }, [], []);

    expect(Object.keys(emitted[0].payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']);
  });

  it('a session written by rounds or cuts is tagged with the rev the store holds', async () => {
    const { service, emitted, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 26, deletePagesAbove: 2, rev: 19, pages: [{ p: 1, lines: page(1) }, { p: 2, lines: page(2, 1) }] }));

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 3 }, [], []);

    expect(emitted.map(e => [e.payload.page, e.payload.rev])).toEqual([[2, 19], [1, 19]]);
  });

  it('the caller\'s rev (a venue session, kept by the edge module) wins', async () => {
    const { service, emitted, settle } = makeService();
    await settle();
    service.manager.setPageData(SES, 1, page(1));
    await service.streamSessionData('sock-1', { nSesid: SES, tab: 3 }, [], [], { rev: 41 });
    expect(emitted[0].payload.rev).toBe(41);
  });

  it('the rev is read before the pages, so a snapshot is never labelled newer than its content', async () => {
    const { service, emitted, settle } = makeService();
    await settle();
    await service.runBarrier(SES, () => service.applyPagesAtomic(SES, { nLines: 25, totalLines: 1, deletePagesAbove: 1, rev: 5, pages: [{ p: 1, lines: page(1, 1, 'rev 5') }] }));
    const realRead = service.readSessionData.bind(service);
    jest.spyOn(service, 'readSessionData').mockImplementation(async (id: string) => {
      // A cut lands while the snapshot is being read.
      await service.applyPagesAtomic(SES, { nLines: 25, totalLines: 1, deletePagesAbove: 1, rev: 6, pages: [{ p: 1, lines: page(1, 1, 'rev 6') }] });
      return realRead(id);
    });

    await service.streamSessionData('sock-1', { nSesid: SES, tab: 3 }, [], []);

    // Content of rev 6 under the older tag 5: the live rows of rev 6 still apply over it (D20).
    expect(emitted[0].payload.rev).toBe(5);
    expect(JSON.parse(emitted[0].payload.data)).toEqual(page(1, 1, 'rev 6'));
  });
});

describe('FeedDataService.pageSnapshot', () => {
  it('returns the pages held in memory by page number, and an empty map for an unknown session', async () => {
    const { service, settle } = makeService();
    await settle();
    service.manager.setPageData(SES, 2, page(2, 3));
    service.manager.setPageData(SES, 1, page(1));
    expect([...service.pageSnapshot(SES).entries()].map(([p, rows]) => [p, rows.length]).sort()).toEqual([[1, 25], [2, 3]]);
    expect(service.pageSnapshot(OTHER).size).toBe(0);
  });
});
