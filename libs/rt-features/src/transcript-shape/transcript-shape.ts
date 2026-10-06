/**
 * Transcript shaping, the code both the cloud and the venue box EXECUTE on the same data (shared-libraries plan
 * Phase 6, "shared code the box runs itself"): the parser's line tuples `[time, codes, i, formate, oPage, oLine,
 * unicid, links]` become the `{msg, page, data:[{time, lineIndex, lines, formate, unicid}]}` pages of
 * `session/realtimedatabysesid` and of the published `s_*.json` contract.
 *
 * Two entry points, one shaper, because the hosts hold their pages differently:
 * - realtime-server keeps an in-memory map `{ page: tuples[] }` and answers the REAL page numbers, sorted
 *   numerically (`pagesFromSessionMap`, the former ConversionJsService method, numeric keys only);
 * - the box keeps the kernel's committed pages as a list where index p-1 is page p (`pagesFromList`).
 * A hole in a page (a tuple that is null, or not a tuple) is a line with no time and empty text, as both hosts
 * answered it; `codesToText` reads the codes in 4096-byte chunks, so a very long line cannot throw (the box's
 * rule; the cloud's spread of the whole array could throw RangeError). Pure: no I/O, no clock, no host.
 */
import type { RtTranscriptLine, RtTranscriptPage } from '@app/api-contracts';

/** The character codes of one line as text, trimmed; anything but a non-empty list is ''. */
export function codesToText(codes: unknown): string {
  if (!Array.isArray(codes) || !codes.length) return '';
  let text = '';
  for (let i = 0; i < codes.length; i += 4096) text += String.fromCharCode(...(codes.slice(i, i + 4096) as number[]));
  return text.trim();
}

/** The lines of one page: tuple index 0 = time, 1 = codes, 3 = formate, 6 = unicid; a hole keeps its line number. */
export function shapeTranscriptLines(rows: readonly unknown[] | null | undefined): RtTranscriptLine[] {
  return (rows || []).map((item, index) => {
    const tuple = item as readonly unknown[] | null;
    return {
      time: tuple?.length ? tuple[0] : null,
      lineIndex: index + 1,
      lines: [codesToText(tuple?.length ? tuple[1] : [])],
      formate: tuple?.[3],
      unicid: tuple?.[6],
    };
  });
}

/** The cloud's shape: every numeric key of the map, ascending, as its real page number; `msg` counts from 1. */
export function pagesFromSessionMap(sessionData: Readonly<Record<number | string, readonly unknown[]>> | null | undefined): RtTranscriptPage[] {
  const pages = Object.keys(sessionData || {}).map(Number).filter((p) => !isNaN(p)).sort((a, b) => a - b);
  return pages.map((page, idx) => ({ msg: idx + 1, page, data: shapeTranscriptLines((sessionData as Record<number, readonly unknown[]>)[page]) }));
}

/** The box's shape: a list of pages where index p-1 is page p (the kernel's committed pages). */
export function pagesFromList(pages: ReadonlyArray<readonly unknown[] | null | undefined>): RtTranscriptPage[] {
  return pages.map((page, idx) => ({ msg: idx + 1, page: idx + 1, data: shapeTranscriptLines(page) }));
}
