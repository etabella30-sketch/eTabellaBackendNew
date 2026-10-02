import * as fs from 'fs';

import { FeedDataService } from './feed-data.service';
import { UtilityService } from '../utility/utility.service';

/**
 * Characterization of where today's feed store puts lines (RT edge plan R-T2 / D14, preserved
 * behaviour (4)): a 25-line session must place lines identically after the ingest changes. The
 * intended change ("nLines honoured for non-25 sessions") is about other page sizes only, so nothing
 * here uses one.
 *
 * Today `updateFeedData` places by the line's absolute index alone (page = floor(index / 25) + 1,
 * slot = index % 25) and `saveRefreshData` re-pages the whole session 25 to a page. What a viewer
 * receives is the page JSON (`streamSessionData` sends `JSON.stringify(page)`), so the pages are
 * compared as JSON here, the same way Redis stores them.
 *
 * Nothing touches Redis or the disk: the real service runs against an in-memory Redis stand-in, its
 * live flush timer is stopped, the disk restore is marked done, and the refresh log writers are stubbed.
 * Not pinned elsewhere: feed-data.stream-session.spec.ts covers only the snapshot send.
 */

const SES = '8d0f3c2e-5b7a-4c1d-9e6f-0a1b2c3d4e5f';

const pad = (n: number) => String(n).padStart(2, '0');
/** One second per line from 10:00:00, so timecode order is line order. */
const tc = (index: number) => `10:${pad(Math.floor(index / 60))}:${pad(index % 60)}:00`;
const codes = (text: string) => Array.from(text, ch => ch.charCodeAt(0));
/** A line as the parsers send it: [timecode, codes, index, format, CAT page, CAT line, id, tabs, frame]. */
const line = (index: number, text = `line ${index}`) =>
  [tc(index), codes(text), index, 'FL', Math.floor(index / 25) + 1, (index % 25) + 1, 5000 + index, [], 0];
const lines = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => line(from + i));
/** TCP-DATA as the venue app and the Eclipse ingest send it. */
const tcp = (d: any[], extra: Record<string, unknown> = {}) => ({ i: d[d.length - 1]?.[2], d, date: SES, l: 25, p: 1, ...extra });
/** A page as JSON sees it: holes become null. */
const json = (value: unknown) => JSON.parse(JSON.stringify(value));
const withHoles = (length: number, at: Record<number, unknown>) => Array.from({ length }, (_, i) => at[i] ?? null);

function makeService(redisSeed: Record<string, unknown[]> = {}) {
  const redis = new Map<string, string>(Object.entries(redisSeed).map(([page, rows]) => [`session:${SES}:${page}`, JSON.stringify(rows)]));
  const db = {
    scanKeys: jest.fn().mockResolvedValue([]),
    getValue: jest.fn(async (key: string) => redis.get(key) ?? null),
    setValue: jest.fn(async (key: string, value: string) => { redis.set(key, value); }),
    getAllValues: jest.fn().mockResolvedValue(null),
    deleteSessionPages: jest.fn().mockResolvedValue(undefined),
  };
  const log = { error: jest.fn(), info: jest.fn() };
  const io = { server: { to: jest.fn(() => ({ emit: jest.fn() })) } };
  const service = new FeedDataService(io as any, db as any, log as any, new UtilityService({} as any));
  clearInterval((service as any).flushTimer); // no live flush into data/ from a spec
  (service as any).restoredSessions.add(SES); // disk restore already checked: no data/ read
  jest.spyOn(service, 'logOfData').mockResolvedValue(true);
  jest.spyOn(service, 'printRecRefresh').mockResolvedValue(undefined);

  const queue = (service as any).queue;
  /** Waits for every queued feed/refresh task, the way the gateway's calls are applied. */
  const settle = (): Promise<void> => (queue.idle() ? Promise.resolve() : queue.drain());
  /** The page a viewer's snapshot sends, and the page Redis holds. */
  const sent = (page: number) => json(service.manager.getPageData(SES, page));
  const stored = (page: number) => JSON.parse(redis.get(`session:${SES}:${page}`) ?? 'null');
  return { service, db, redis, settle, sent, stored };
}

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => { });
  jest.spyOn(console, 'error').mockImplementation(() => { });
});
afterAll(() => jest.restoreAllMocks());

beforeEach(() => {
  // deleteExtraPages looks for data/dt_<id>; answer "not there" instead of reading the disk.
  const realExists = fs.existsSync;
  jest.spyOn(fs, 'existsSync').mockImplementation((p: fs.PathLike) => (String(p).includes(`dt_${SES}`) ? false : realExists(p)));
});
afterEach(() => (fs.existsSync as unknown as jest.Mock).mockRestore());

describe('FeedDataService placement, 25-line session (characterization): live lines', () => {
  it('line index n lands on page floor(n / 25) + 1 at slot n % 25', async () => {
    const { service, settle, sent, stored } = makeService();
    service.feedReceive(tcp([line(0), line(1), line(24), line(25), line(49), line(50)]));
    await settle();

    const page1 = withHoles(25, { 0: line(0), 1: line(1), 24: line(24) });
    const page2 = withHoles(25, { 0: line(25), 24: line(49) });
    expect(sent(1)).toEqual(page1);
    expect(sent(2)).toEqual(page2);
    expect(sent(3)).toEqual([line(50)]);
    expect([stored(1), stored(2), stored(3)]).toEqual([page1, page2, [line(50)]]);
    expect(service.sessionTotalPages(SES)).toBe(3);
  });

  it('page boundary: the venue\'s two-line emit for lines 24 and 25 (p: 2) splits across pages 1 and 2', async () => {
    const { service, settle, sent } = makeService();
    // The venue's page sync on connect: page 1 whole.
    service.feedReceive(tcp(lines(0, 24), { i: 25, p: 1 }));
    // Its next live emit: the last two lines of its buffer, p computed from the last one.
    const line24Final = line(24, 'line 24, finished');
    service.feedReceive(tcp([line24Final, line(25)], { i: 25, p: 2 }));
    await settle();

    expect(sent(1)).toEqual([...lines(0, 23), line24Final]);
    expect(sent(2)).toEqual([line(25)]);
  });

  it('a line index sent again replaces its slot; nothing is appended', async () => {
    const { service, settle, sent } = makeService();
    service.feedReceive(tcp([line(25)]));
    service.feedReceive(tcp([line(25, 'second take')]));
    service.feedReceive(tcp([line(25, 'third take')]));
    await settle();

    expect(sent(2)).toEqual([line(25, 'third take')]);
  });

  it('a gap before a line stays a hole (null in the snapshot and in Redis)', async () => {
    const { service, settle, sent, stored } = makeService();
    service.feedReceive(tcp([line(28)]));
    await settle();

    expect(sent(2)).toEqual([null, null, null, line(28)]);
    expect(stored(2)).toEqual([null, null, null, line(28)]);
  });

  it('a page reloaded from Redis gets its null slots filled with blank lines numbered by slot', async () => {
    const { service, settle, sent } = makeService({ 2: [line(25), null, null] });
    service.feedReceive(tcp([line(28)]));
    await settle();

    expect(sent(2)).toEqual([line(25), ['00:00:00:00', [], 1], ['00:00:00:00', [], 2], line(28)]);
  });

  it('a page only Redis still holds is the base for new lines, and every placed page goes back to Redis for 48 h', async () => {
    const { service, db, settle, sent } = makeService({ 1: lines(0, 2) });
    service.feedReceive(tcp([line(3)]));
    await settle();

    expect(sent(1)).toEqual(lines(0, 3));
    expect(db.setValue).toHaveBeenCalledWith(`session:${SES}:1`, JSON.stringify(lines(0, 3)), 48 * 3600);
  });

  it('lines are normalised to nine fields; lines without an index, or index -1, are dropped', async () => {
    const { service, settle, sent } = makeService();
    service.feedReceive(tcp([
      ['', [65], 0],
      ['10:00:01:00', undefined, 1, 'QES', 1, 2, 7],
      ['10:00:02:00', [66], 2, 'ANS', 1, 3, 8, [4], 12, 'extra field'],
      ['10:00:03:00', [67], -1, 'FL', 1, 4, 9, [], 0],
      ['10:00:04:00', [68], undefined, 'FL', 1, 5, 10, [], 0],
    ]));
    await settle();

    expect(sent(1)).toEqual([
      ['00:00:00:00', [65], 0, null, null, null, null, [], 0],
      ['10:00:01:00', [], 1, 'QES', 1, 2, 7, [], 0],
      ['10:00:02:00', [66], 2, 'ANS', 1, 3, 8, [4], 12],
    ]);
  });

  it('the message\'s line count (l) and page (p) do not move a line', async () => {
    const pagesFor = async (extra: Record<string, unknown>) => {
      const { service, settle, sent } = makeService();
      service.feedReceive(tcp([line(23), line(24), line(25), line(26)], extra));
      await settle();
      return [sent(1), sent(2)];
    };
    const byIndex = await pagesFor({ l: 25, p: 2 });
    expect(await pagesFor({ l: 25, p: 7 })).toEqual(byIndex);
    expect(await pagesFor({ l: undefined, p: undefined })).toEqual(byIndex);
    expect(byIndex).toEqual([withHoles(25, { 23: line(23), 24: line(24) }), [line(25), line(26)]]);
  });
});

describe('FeedDataService placement, 25-line session (characterization): refresh', () => {
  /** feed-refresh-data as the venue app and the parsers send it. */
  const refresh = (start: string, end: string, newLines: any[] = []) =>
    ({ nSesid: SES, startInd: 0, endInd: 0, newLines, start, end, startPage: 1, current_refresh: 1 });

  it('re-pages the whole session from page 1, 25 lines to a page, each line keeping its own index', async () => {
    const { service, db, settle, sent, stored } = makeService();
    service.feedReceive(tcp(lines(0, 29)));
    await settle();

    // Replaces lines 10 and 11 (timecodes strictly inside the range) with one corrected line.
    const corrected = [tc(10), codes('line 10, corrected'), 10, 'FL', 1, 11, 6010, [], 0];
    service.refreshReceive(refresh('10:00:09:15', '10:00:11:15', [corrected]));
    await settle();

    const expected1 = [...lines(0, 9), corrected, ...lines(12, 25)];
    const expected2 = lines(26, 29);
    expect(sent(1)).toEqual(expected1);
    expect(sent(2)).toEqual(expected2);
    expect([stored(1), stored(2)]).toEqual([expected1, expected2]);
    expect(db.deleteSessionPages).toHaveBeenCalledWith(SES, 2);
  });

  it('a refresh that leaves fewer pages drops the pages past the end; the boundary line moves up', async () => {
    const { service, db, settle, sent } = makeService();
    service.feedReceive(tcp(lines(0, 25)));
    await settle();
    expect(service.sessionTotalPages(SES)).toBe(2);

    // Removes line 5 only, adds nothing: 25 lines remain.
    service.refreshReceive(refresh('10:00:04:15', '10:00:05:15'));
    await settle();

    expect(sent(1)).toEqual([...lines(0, 4), ...lines(6, 25)]);
    expect(sent(1)[24]).toEqual(line(25));
    expect(service.manager.hasPage(SES, 2)).toBe(false);
    expect(service.sessionTotalPages(SES)).toBe(1);
    expect(db.deleteSessionPages).toHaveBeenCalledWith(SES, 1);
  });
});
