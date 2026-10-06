/**
 * Gate G2 of the transcript shaping: the same tuples must shape to the same pages on every host that executes this
 * code. `SESSION_MAP` is what realtime-server holds (pages 1 and 2 with a hole, a null tuple, a padded line and a
 * line of 20,000 codes), `SESSION_PAGES` the same pages as the box's list; `EXPECTED_PAGES` is the one answer.
 * Test code only: never imported by a source file.
 */
import type { RtTranscriptPage } from '@app/api-contracts';

const codes = (text: string): number[] => Array.from(text, (c) => c.charCodeAt(0));
const tuple = (time: string, text: string, i: number, formate = 'Q', unicid = `u${i}`): unknown[] => [time, codes(text), i, formate, 1, i, unicid, []];

/** A line longer than one String.fromCharCode spread could take on some engines: 20,000 characters. */
export const LONG_LINE = 'x'.repeat(20_000);

const PAGE_1: unknown[] = [
  tuple('10:00:01', '  THE COURT:  Good morning.  ', 1),
  null, // a hole: the parser landed a later line first
  tuple('10:00:03', 'MR. SHAH:  Good morning, my Lady.', 3, 'A'),
  [], // an empty tuple
  tuple('10:00:05', LONG_LINE, 5),
];
const PAGE_2: unknown[] = [tuple('10:01:00', 'Page two, line one.', 1)];

/** The cloud's in-memory map (a non-numeric key is ignored, pages sort numerically: 2 before 10). */
export const SESSION_MAP: Readonly<Record<string, unknown[]>> = Object.freeze({ '2': PAGE_2, '1': PAGE_1, meta: [], '10': [tuple('10:09:00', 'Page ten.', 1)] });

/** The box's list for the same two first pages (index p-1 = page p). */
export const SESSION_PAGES: ReadonlyArray<readonly unknown[]> = Object.freeze([PAGE_1, PAGE_2]);

const line = (time: unknown, lineIndex: number, text: string, formate?: unknown, unicid?: unknown) => ({ time, lineIndex, lines: [text], formate, unicid });

/** What every host must answer for pages 1 and 2. */
export const EXPECTED_PAGES: readonly RtTranscriptPage[] = Object.freeze([
  {
    msg: 1,
    page: 1,
    data: [
      line('10:00:01', 1, 'THE COURT:  Good morning.', 'Q', 'u1'),
      line(null, 2, '', undefined, undefined),
      line('10:00:03', 3, 'MR. SHAH:  Good morning, my Lady.', 'A', 'u3'),
      line(null, 4, '', undefined, undefined),
      line('10:00:05', 5, LONG_LINE, 'Q', 'u5'),
    ],
  },
  { msg: 2, page: 2, data: [line('10:01:00', 1, 'Page two, line one.', 'Q', 'u1')] },
]);

/** The cloud's answer for SESSION_MAP: the two pages above, then page 10 as msg 3. */
export const EXPECTED_MAP_PAGES: readonly RtTranscriptPage[] = Object.freeze([
  ...EXPECTED_PAGES,
  { msg: 3, page: 10, data: [line('10:09:00', 1, 'Page ten.', 'Q', 'u1')] },
]);

/** Throws with the difference when a shaping is not the conformant one. */
export function expectConformantPages(answer: unknown, expected: readonly RtTranscriptPage[] = EXPECTED_PAGES): void {
  const got = JSON.stringify(answer);
  const want = JSON.stringify(expected);
  if (got !== want) throw new Error(`transcript-shape conformance: expected ${want.slice(0, 400)}…\n   got ${got.slice(0, 400)}…`);
}
