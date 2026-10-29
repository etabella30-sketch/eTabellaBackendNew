import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

/**
 * Content checks for Mark writes (QFact / Fact / DocLink) that a DTO cannot express. Day 3 live load QA
 * (2026-10-29) stored Marks at page 999,999 line -5, with no coordinates, with made-up issue ids, and
 * DocLinks to pages 0–99,999. All of that answered "inserted successfully".
 */

export const MAX_MARK_PAGE = 100_000;
export const MAX_MARK_LINE = 1_000;
/** A live feed keeps growing while a Mark is in flight; allow this many pages past the known total. */
export const LIVE_PAGE_SLACK = 2;

interface RowQuery { rowQuery(text: string, params?: unknown[]): Promise<{ success?: boolean; data?: unknown[] }>; }
/** The live feed's page count, when the session is streaming in this process. */
export interface LivePages { checkSessionExists(nSesid: string): boolean; sessionTotalPages(nSesid: string): number; }

type Coordinate = { p?: unknown; l?: unknown; type?: unknown };

const bad = (message: string) => new BadRequestException(message);
const isWhole = (n: unknown, min: number, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A transcript Mark (nSesid set) needs at least one coordinate. Every page is a whole number from 1 to
 * {@link MAX_MARK_PAGE} and every line from 1 to {@link MAX_MARK_LINE}. While the session is live in this
 * process, its pages must exist in the feed (plus {@link LIVE_PAGE_SLACK}).
 *
 * Published and ended days are bounds-checked only: their Reader Marks use the published page numbers,
 * which can run past the live feed's file count (Day 2: 292 published, 281 live).
 */
export function assertTranscriptPosition(body: { nSesid?: string | null; jCordinates?: Coordinate[] | null }, live?: LivePages): void {
  if (!body?.nSesid) return;
  const coords = Array.isArray(body.jCordinates) ? body.jCordinates : [];
  if (!coords.length) throw bad('A transcript Mark needs the line(s) it covers (jCordinates is empty).');
  for (const c of coords) {
    if (c.p !== undefined && c.p !== null && !isWhole(c.p, 1, MAX_MARK_PAGE)) throw bad(`Page ${String(c.p)} is not a transcript page.`);
    if (c.l !== undefined && c.l !== null && !isWhole(c.l, 1, MAX_MARK_LINE)) throw bad(`Line ${String(c.l)} is not a transcript line.`);
  }
  if (live?.checkSessionExists(body.nSesid)) {
    const total = Number(live.sessionTotalPages(body.nSesid)) || 0;
    const highest = Math.max(...coords.map(c => (typeof c.p === 'number' ? c.p : 0)));
    if (total > 0 && highest > total + LIVE_PAGE_SLACK) throw bad(`Page ${highest} does not exist yet in this session (it has ${total} pages).`);
  }
}

/** DocLink targets (jDl = [[docId, { start, end, pages }, …], …]): pages are whole numbers 1..MAX_MARK_PAGE, start ≤ end. */
export function assertDocLinkTargets(jDl: string | null | undefined): void {
  if (!jDl) return;
  let list: unknown;
  try { list = JSON.parse(jDl); } catch { throw bad('jDl must be a JSON array.'); }
  if (!Array.isArray(list)) throw bad('jDl must be a JSON array.');
  for (const entry of list) {
    const target = Array.isArray(entry) ? entry[1] as { start?: unknown; end?: unknown; pages?: unknown } | null : null;
    if (!target || typeof target !== 'object') continue;
    const { start, end, pages } = target;
    if (start !== undefined && !isWhole(start, 1, MAX_MARK_PAGE)) throw bad(`DocLink start page ${String(start)} is not a page.`);
    if (end !== undefined && !isWhole(end, 1, MAX_MARK_PAGE)) throw bad(`DocLink end page ${String(end)} is not a page.`);
    if (typeof start === 'number' && typeof end === 'number' && start > end) throw bad('DocLink start page is after its end page.');
    if (Array.isArray(pages) && pages.some(p => !isWhole(p, 1, MAX_MARK_PAGE))) throw bad('DocLink pages must be whole page numbers from 1.');
  }
}

/** The issue ids a Mark names: jIssues (["id", relevance, impact] tuples or bare ids) plus nColorid. */
export function markIssueIds(body: { jIssues?: string | null; jIssue?: string | null; nColorid?: string | null }): string[] {
  const ids = new Set<string>();
  for (const raw of [body.jIssues, body.jIssue]) {
    if (!raw) continue;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) for (const x of list) { const id = Array.isArray(x) ? x[0] : x; if (typeof id === 'string' && UUID.test(id)) ids.add(id.toLowerCase()); }
    } catch { /* the DTO already refused malformed JSON */ }
  }
  if (body.nColorid && UUID.test(body.nColorid)) ids.add(body.nColorid.toLowerCase());
  return [...ids];
}

/** $1 issue ids, $2 the case: the ids that are issues of that case (or case-less shared issues). */
export const ISSUES_IN_CASE_SQL =
  `SELECT "nIid"::text AS id FROM public."RIssueMaster" WHERE "nIid" = ANY($1::uuid[]) AND ("nCaseid" = $2::uuid OR "nCaseid" IS NULL)`;

/** Every issue a Mark names must be an issue of its case (or a case-less shared issue). Unknown ids → 400. */
export async function assertIssuesInCase(db: RowQuery, body: { nCaseid?: string; jIssues?: string | null; jIssue?: string | null; nColorid?: string | null }): Promise<void> {
  const ids = markIssueIds(body);
  if (!ids.length || !body.nCaseid) return;
  const res = await db.rowQuery(ISSUES_IN_CASE_SQL, [ids, body.nCaseid]);
  if (!res?.success) throw new InternalServerErrorException('The Mark\'s issues could not be checked. Please retry.');
  const found = new Set((res.data as { id: string }[] | undefined ?? []).map(r => String(r.id).toLowerCase()));
  const missing = ids.filter(id => !found.has(id));
  if (missing.length) throw bad(`Unknown issue for this case: ${missing.join(', ')}.`);
}

/** The share list without its creator (a Mark is always visible to its owner; a self-share row is noise). */
export function withoutSelfShare(jUsers: string | null | undefined, ownerId: string | undefined | null): string | null | undefined {
  if (!jUsers || !ownerId) return jUsers;
  try {
    const list = JSON.parse(jUsers);
    if (!Array.isArray(list)) return jUsers;
    const kept = list.filter(u => String((u && typeof u === 'object' ? (u as { nUserid?: unknown }).nUserid : u) ?? '').toLowerCase() !== ownerId.toLowerCase());
    return kept.length === list.length ? jUsers : JSON.stringify(kept);
  } catch { return jUsers; }
}
