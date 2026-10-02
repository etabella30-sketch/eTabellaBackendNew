import {
  DEFAULT_LINES_PER_PAGE,
  FILLER_TIMECODE,
  assertLinesPerPage,
  canonicalLine,
  canonicalPage,
  canonicalPages,
  canonicalValue,
  deepFreeze,
  fillerLine,
  isFillerEntry,
  pageCount,
  pageOfIndex,
  sanitizeLineCodes,
} from './canonical';

const codes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const roundTrips = (v: unknown) => JSON.stringify(JSON.parse(JSON.stringify(v))) === JSON.stringify(v);

describe('canonical line form (spec §6.2)', () => {
  it('copies a bridge tuple: [1] sanitized, [2] = position, other slots kept, undefined → null', () => {
    const raw = ['10:00:01', codes('Q.\x0F26JAN240 Yes'), 7, 'FL', 3, 12, 4000000, undefined, undefined, null];
    const line = canonicalLine(raw, 41);
    expect(line).toEqual(['10:00:01', codes('Q. Yes'), 41, 'FL', 3, 12, 4000000, null, null, null]);
    expect(roundTrips(line)).toBe(true);
  });

  it('never aliases or freezes the parser tuple', () => {
    const text = codes('hello');
    const raw = ['t', text, 0, 'FL', 1, 1, 9, [{ tab: 1 }]];
    const line = canonicalLine(raw, 0) as any[];
    expect(line[1]).not.toBe(text);
    expect(line[7]).not.toBe(raw[7]);
    expect(Object.isFrozen(raw)).toBe(false);
    expect(Object.isFrozen(text)).toBe(false);
    expect(Object.isFrozen(line)).toBe(true);
    expect(Object.isFrozen(line[1])).toBe(true);
    expect(Object.isFrozen(line[7][0])).toBe(true);
    text.push(33);
    expect(line[1]).toEqual(codes('hello'));
  });

  it('turns holes, non-arrays and [] into the filler updateFeedData writes', () => {
    const buf: unknown[] = [];
    buf[2] = ['t', codes('x'), 2];
    for (const entry of [undefined, null, [], 'text', 5, { a: 1 }]) {
      expect(canonicalLine(entry, 9)).toEqual([FILLER_TIMECODE, [], 9]);
    }
    expect(canonicalPage(buf, 1, 3)).toEqual([
      ['00:00:00:00', [], 0],
      ['00:00:00:00', [], 1],
      ['t', codes('x'), 2],
    ]);
    expect(fillerLine(4)).toEqual(['00:00:00:00', [], 4]);
    expect(isFillerEntry([])).toBe(true);
    expect(isFillerEntry(['t'])).toBe(false);
  });

  it('extends a short tuple so [1] and [2] exist', () => {
    expect(canonicalLine(['10:00'], 3)).toEqual(['10:00', [], 3]);
    expect(canonicalLine(['10:00', codes('a')], 3)).toEqual(['10:00', codes('a'), 3]);
  });

  it('keeps a non-array [1] the way sanitizeLineCodes returns it', () => {
    expect(canonicalLine(['t', 'plain', 0], 0)).toEqual(['t', 'plain', 0]);
    expect(canonicalLine(['t', null, 0], 0)).toEqual(['t', [], 0]);
    expect(canonicalLine(['t', 0, 0], 0)).toEqual(['t', [], 0]);
  });

  it('applies JSON semantics to every other slot', () => {
    const sparse: unknown[] = [1];
    sparse[3] = 2;
    const date = new Date('2026-10-01T10:00:00Z');
    const raw = ['t', [], 0, NaN, -0, Infinity, sparse, { keep: 1, drop: undefined, fn: () => 1 }, date, new Number(4), BigInt(5)];
    expect(canonicalLine(raw, 0)).toEqual([
      't', [], 0, null, 0, null, [1, null, null, 2], { keep: 1 }, '2026-10-01T10:00:00.000Z', 4, null,
    ]);
    expect(Object.is((canonicalLine(raw, 0) as unknown[])[4], 0)).toBe(true);
  });

  it('passes the slot index to toJSON, as JSON.stringify does', () => {
    const keyed = { toJSON: (key: string) => `slot-${key}` };
    expect(canonicalLine(['t', [], 0, keyed], 0)[3]).toBe('slot-3');
    expect(JSON.parse(JSON.stringify(['t', [], 0, keyed]))[3]).toBe('slot-3');
  });

  it('turns a cycle into null instead of throwing in the lane', () => {
    const loop: any[] = ['x'];
    loop.push(loop);
    expect(canonicalValue(loop)).toEqual(['x', null]);
    const obj: any = { a: 1 };
    obj.self = obj;
    expect(canonicalValue(obj)).toEqual({ a: 1, self: null });
    const shared = [1];
    expect(canonicalValue([shared, shared])).toEqual([[1], [1]]);
  });

  it('is idempotent: canonicalising a canonical line changes nothing', () => {
    const once = canonicalLine(['t', codes('\x0C0001ab\x0F'), 99, 'FL', undefined], 5);
    expect(canonicalLine(once, 5)).toEqual(once);
  });

  it('builds unpadded pages for any lines-per-page', () => {
    const buf = Array.from({ length: 23 }, (_, i) => ['t', codes(`L${i}`), i]);
    expect(canonicalPage(buf, 1, 23, 10)).toHaveLength(10);
    expect(canonicalPage(buf, 3, 23, 10)).toHaveLength(3);
    expect(canonicalPage(buf, 3, 23, 10)[0][2]).toBe(20);
    expect(canonicalPage(buf, 4, 23, 10)).toEqual([]);
    expect(canonicalPages(buf, 10).map(p => p.length)).toEqual([10, 10, 3]);
    expect(canonicalPages(buf).map(p => p.length)).toEqual([23]);
    expect(Object.isFrozen(canonicalPage(buf, 1, 23, 10))).toBe(true);
  });

  it('counts pages and places indices like updateFeedData (index / nLines)', () => {
    expect(DEFAULT_LINES_PER_PAGE).toBe(25);
    expect([0, 1, 25, 26, 50, 51].map(n => pageCount(n))).toEqual([0, 1, 1, 2, 2, 3]);
    expect([0, 24, 25, 49, 50].map(i => pageOfIndex(i))).toEqual([1, 1, 2, 2, 3]);
    expect([0, 9, 10, 29].map(i => pageOfIndex(i, 10))).toEqual([1, 1, 2, 3]);
    expect(pageCount(31, 30)).toBe(2);
  });

  it('refuses a nonsense lines-per-page', () => {
    for (const bad of [0, -1, 2.5, NaN, Infinity]) expect(() => assertLinesPerPage(bad)).toThrow(RangeError);
    expect(assertLinesPerPage(30)).toBe(30);
  });

  it('sanitizes page-frame atoms, then lone controls', () => {
    expect(sanitizeLineCodes(codes('A\x0F12345678B'))).toEqual(codes('AB'));
    expect(sanitizeLineCodes(codes('A\x0C0042B'))).toEqual(codes('AB'));
    expect(sanitizeLineCodes(codes('A\x0C\x0FB'))).toEqual(codes('AB'));
    expect(sanitizeLineCodes(codes('A\x0F1234B'))).toEqual(codes('A1234B'));
    const clean = codes('clean');
    expect(sanitizeLineCodes(clean)).toBe(clean);
    expect(sanitizeLineCodes(undefined as any)).toEqual([]);
  });

  it('deepFreeze freezes nested values and returns its argument', () => {
    const v = { a: [1, { b: [2] }] };
    expect(deepFreeze(v)).toBe(v);
    expect(Object.isFrozen((v.a[1] as any).b)).toBe(true);
    expect(deepFreeze(3)).toBe(3);
  });
});
