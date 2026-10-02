import { buildSnapshot, pagesFromList, snapshotEnd } from './snapshot';

const SES = '31ae9a74-7d69-4996-a78b-9c29b7af9653';

// The fixture of apps/realtime-server/.../feed-data.stream-session.spec.ts.
const pagesOf = (count: number): Record<string, unknown[]> =>
  Object.fromEntries(Array.from({ length: count }, (_, i) => [String(i + 1), [[`10:00:${i}`, `line on page ${i + 1}`, i * 25]]]));

describe('buildSnapshot — the shared previous-data builder (D11, D12)', () => {
  it('matches today\'s payload for the stream-session fixture, newest page first', () => {
    const out = buildSnapshot(pagesOf(3), { nSesid: SES, tab: 4, qFacts: [{ nIDid: 'a2', pageIndex: 2 }], qMarks: [{ nHid: 'h3', cPageno: '3' }] });
    expect(out.map(p => [p.page, p.totalPages, p.tab, p.nSesid])).toEqual([3, 2, 1].map(page => [page, 3, 4, SES]));
    expect(out.map(p => [p.a.length, p.h.length])).toEqual([[0, 1], [1, 0], [0, 0]]);
    expect(JSON.parse(out[2].data)).toEqual([['10:00:0', 'line on page 1', 0]]);
    expect(out[2]).toEqual({ msg: 1, page: 1, data: JSON.stringify([['10:00:0', 'line on page 1', 0]]), totalPages: 3, nSesid: SES, a: [], h: [], tab: 4 });
  });

  it('keeps today\'s field order', () => {
    const [first] = buildSnapshot(pagesOf(1), { nSesid: SES, tab: 1, qFacts: [], qMarks: [] });
    expect(Object.keys(first)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab']);
  });

  it('sorts numerically (10 before 9), not as strings, and puts non-numeric keys last', () => {
    const pages = { '9': [['a']], '10': [['b']], '2': [['c']], x: [['d']] } as Record<string, unknown[]>;
    expect(buildSnapshot(pages, { nSesid: SES }).map(p => p.page)).toEqual([10, 9, 2, NaN]);
  });

  it('totalPages is the number of pages held, not the highest page number', () => {
    const out = buildSnapshot({ '1': [['a']], '5': [['b']] }, { nSesid: SES });
    expect(out.map(p => [p.page, p.totalPages])).toEqual([[5, 2], [1, 2]]);
  });

  it('a missing page body is sent as "[]"', () => {
    expect(buildSnapshot({ '1': null, '2': undefined }, { nSesid: SES }).map(p => p.data)).toEqual(['[]', '[]']);
  });

  it('filters facts by pageIndex and marks by cPageno, numerically', () => {
    const qFacts = [{ id: 1, pageIndex: '2' }, { id: 2, pageIndex: 1 }, { id: 3 }, { id: 4, pageIndex: 2 }];
    const qMarks = [{ id: 5, cPageno: '01' }, { id: 6, cPageno: 2 }];
    const out = buildSnapshot(pagesOf(2), { nSesid: SES, qFacts, qMarks });
    expect(out.map(p => [p.page, p.a.map((x: any) => x.id), p.h.map((x: any) => x.id)])).toEqual([
      [2, [1, 4], [6]],
      [1, [2], [5]],
    ]);
  });

  it('keeps today\'s error behaviour: a bad fact list empties a and h; a bad mark list empties only h', () => {
    const badFacts = buildSnapshot(pagesOf(1), { nSesid: SES, qFacts: {} as any, qMarks: [{ cPageno: 1 }] });
    expect([badFacts[0].a, badFacts[0].h]).toEqual([[], []]);
    const nullFact = buildSnapshot(pagesOf(1), { nSesid: SES, qFacts: [null] as any, qMarks: [{ cPageno: 1 }] });
    expect([nullFact[0].a, nullFact[0].h]).toEqual([[], []]);
    const badMarks = buildSnapshot(pagesOf(1), { nSesid: SES, qFacts: [{ pageIndex: 1 }], qMarks: [null] as any });
    expect([badMarks[0].a.length, badMarks[0].h]).toEqual([1, []]);
    const none = buildSnapshot(pagesOf(1), { nSesid: SES, qFacts: null, qMarks: undefined });
    expect([none[0].a, none[0].h]).toEqual([[], []]);
  });

  it('sends nothing for a session with no page yet', () => {
    expect(buildSnapshot({}, { nSesid: SES, tab: 1 })).toEqual([]);
    expect(buildSnapshot(new Map(), { nSesid: SES })).toEqual([]);
  });

  it('echoes an absent tab as undefined (JSON drops it, as today)', () => {
    const [p] = buildSnapshot(pagesOf(1), { nSesid: SES });
    expect('tab' in p).toBe(true);
    expect(JSON.parse(JSON.stringify(p)).tab).toBeUndefined();
  });

  it('takes the box\'s page list (index p-1 = page p) through pagesFromList', () => {
    const list = [[['a', [], 0]], [['b', [], 25]]];
    const map = pagesFromList(list);
    expect([...map.keys()]).toEqual([1, 2]);
    expect(buildSnapshot(map, { nSesid: SES, tab: 2 }).map(p => [p.page, JSON.parse(p.data)])).toEqual([
      [2, [['b', [], 25]]],
      [1, [['a', [], 0]]],
    ]);
  });

  it('adds rev only when asked (D20), last, leaving every other field as today', () => {
    const plain = buildSnapshot(pagesOf(2), { nSesid: SES, tab: 3 });
    const tagged = buildSnapshot(pagesOf(2), { nSesid: SES, tab: 3, rev: 41 });
    expect(plain.every(p => !('rev' in p))).toBe(true);
    expect(Object.keys(tagged[0])).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'a', 'h', 'tab', 'rev']);
    expect(tagged.map(({ rev, ...rest }) => [rev, rest])).toEqual(plain.map(p => [41, p]));
  });

  it('ends a fetch with previous-data-end {nSesid, tab}', () => {
    expect(snapshotEnd(SES, 7)).toEqual({ nSesid: SES, tab: 7 });
  });
});
