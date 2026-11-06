import { HearingTimecode, hearingTimecode, withinLiveQfactGap } from '@app/api-contracts';

/** Ordinary transcript coordinates plus internal capture provenance. */
export interface LiveQfactCoordinate {
  readonly identity: string;
  readonly p: number;
  readonly l: number;
  readonly oP: number;
  readonly oL: number;
  readonly text: string;
  readonly otext: string;
  readonly t: string;
  readonly capture: 'live-instant';
  readonly run: string;
  readonly order: number;
  readonly hearing: HearingTimecode | null;
  /** Server receipt time (epoch ms) of the click that stored this line; absent on lines stored before Option B. */
  readonly at?: number;
  /** A skipped line the server added so the passage stays continuous (Option B), not one the user clicked. */
  readonly filled?: boolean;
}

/** Unclicked lines a click may reach past to join a group (the lines between were filled in): none (user 2026-11-04 —
 *  "if there is any break, it is a second QFact", even within 30 s; Option B of 2026-11-02 allowed two). A click joins
 *  only the group whose last line is the line directly above it. */
export const LIVE_QFACT_MAX_SKIPPED_LINES = 0;
/** The click must arrive within this long of the group's last capture (server receipt time). */
export const LIVE_QFACT_CAPTURE_WINDOW_MS = 30_000;

/** Consecutive transcript lines of one formal run (a page break counts as consecutive). */
export function consecutiveLiveQfactLines(left: LiveQfactCoordinate, right: LiveQfactCoordinate): boolean {
  return left.run === right.run && left.order + 1 === right.order;
}

/**
 * Whether a click at `now` may join `group` through its facing edge line (user 2026-11-04): the click comes within 30 s of
 * the group's last capture (quick clicks join even across a pause in the testimony — Option B of 11-02), OR the two lines'
 * transcript (hearing) times are within 30 s, however much later the click comes — so a gap filled minutes later still
 * merges the passage. Either is enough.
 */
export function withinLiveQfactCaptureWindow(group: readonly LiveQfactCoordinate[], edge: LiveQfactCoordinate,
  clicked: LiveQfactCoordinate, now: number): boolean {
  const stamps = group.map(line => line.at).filter((at): at is number => Number.isFinite(at));
  if (stamps.length && now - Math.max(...stamps) <= LIVE_QFACT_CAPTURE_WINDOW_MS) return true;
  const [left, right] = edge.order < clicked.order ? [edge, clicked] : [clicked, edge];
  return withinLiveQfactGap(hearingTimecode(left.hearing), hearingTimecode(right.hearing));
}

/**
 * A QFact's issue identity for joining (user 2026-11-04: only lines with the same issues join). The issue ids, sorted
 * and unique; the case's Unassigned issue counts only when nothing else is picked ("A + Unassigned" is "A"), and no
 * issue at all is Unassigned (a QFact stored before issues were saved on Express rows).
 */
export function liveQfactIssueKey(issueIds: readonly unknown[], unassignedId: string | null): string {
  const unassigned = unassignedId?.toLowerCase() ?? null;
  const ids = [...new Set(issueIds.map(id => String(id ?? '').trim().toLowerCase()).filter(Boolean))];
  const real = ids.filter(id => id !== unassigned);
  return (real.length ? real : unassigned ? [unassigned] : []).sort().join(',');
}

/** Why a click started its own QFact although a QFact of the user's sits on the line next to it. */
export type LiveQfactNotJoined = 'issues' | 'time' | 'edited';

export function liveCoordinates(value: unknown): LiveQfactCoordinate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is LiveQfactCoordinate => !!item && item.capture === 'live-instant'
    && typeof item.identity === 'string' && !!item.identity && typeof item.run === 'string'
    && Number.isInteger(item.order) && Number.isInteger(item.p) && Number.isInteger(item.l))
    .sort((a,b) => a.order-b.order);
}

export function splitLiveQfactLines(lines: readonly LiveQfactCoordinate[]): LiveQfactCoordinate[][] {
  const groups: LiveQfactCoordinate[][] = [];
  for (const line of [...lines].sort((a,b)=>a.order-b.order)) {
    const last = groups[groups.length-1];
    // Contiguity only: the time rule decides joining at capture, so a stored group never splits on a hearing pause.
    if (last && consecutiveLiveQfactLines(last[last.length-1],line)) last.push(line);
    else groups.push([line]);
  }
  return groups;
}
