import { codesToText, pagesFromList, pagesFromSessionMap, shapeTranscriptLines } from './transcript-shape';
import { EXPECTED_MAP_PAGES, EXPECTED_PAGES, expectConformantPages, LONG_LINE, SESSION_MAP, SESSION_PAGES } from './testing/conformance';

/*
 * The one shaper behind the cloud's map and the box's list: the conformance fixture on both entry points, the
 * details each host relied on (holes, trimming, numeric page keys), and the long line that must never throw.
 */

describe('transcript-shape', () => {
  it('shapes the cloud map and the box list to the same pages (G2)', () => {
    expectConformantPages(pagesFromList(SESSION_PAGES));
    expectConformantPages(pagesFromSessionMap(SESSION_MAP), EXPECTED_MAP_PAGES);
    expect(pagesFromSessionMap(SESSION_MAP).slice(0, 2)).toEqual(EXPECTED_PAGES);
  });

  it('the cloud map answers real page numbers sorted numerically and ignores non-numeric keys; the list numbers by position', () => {
    expect(pagesFromSessionMap(SESSION_MAP).map((p) => [p.msg, p.page])).toEqual([[1, 1], [2, 2], [3, 10]]);
    expect(pagesFromSessionMap({ '3': [], '1': [] }).map((p) => [p.msg, p.page])).toEqual([[1, 1], [2, 3]]);
    expect(pagesFromSessionMap(null)).toEqual([]);
    expect(pagesFromSessionMap({})).toEqual([]);
    expect(pagesFromList([[], []]).map((p) => [p.msg, p.page, p.data])).toEqual([[1, 1, []], [2, 2, []]]);
    expect(pagesFromList([])).toEqual([]);
  });

  it('a hole, a null or an empty tuple is a line with no time and empty text that keeps its number', () => {
    expect(shapeTranscriptLines([null, [], undefined, ['t', [65, 66], 4, 'Q', 1, 4, 'u', []]])).toEqual([
      { time: null, lineIndex: 1, lines: [''], formate: undefined, unicid: undefined },
      { time: null, lineIndex: 2, lines: [''], formate: undefined, unicid: undefined },
      { time: null, lineIndex: 3, lines: [''], formate: undefined, unicid: undefined },
      { time: 't', lineIndex: 4, lines: ['AB'], formate: 'Q', unicid: 'u' },
    ]);
    expect(shapeTranscriptLines(null)).toEqual([]);
  });

  it('codesToText trims, reads any length without throwing, and answers "" for anything but a non-empty list', () => {
    expect(codesToText([32, 72, 105, 32])).toBe('Hi');
    expect(codesToText(Array.from(LONG_LINE, (c) => c.charCodeAt(0)))).toBe(LONG_LINE);
    expect(codesToText(new Array(200_000).fill(65)).length).toBe(200_000);
    expect([codesToText([]), codesToText(null), codesToText('AB'), codesToText(undefined)]).toEqual(['', '', '', '']);
  });
});
