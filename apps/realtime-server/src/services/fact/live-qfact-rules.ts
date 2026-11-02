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

/** Option B (2026-11-02): a click joins a group up to this many unclicked lines away; the lines between are filled. */
export const LIVE_QFACT_MAX_SKIPPED_LINES = 2;
/** Option B: the click must arrive within this long of the group's last capture (server receipt time). */
export const LIVE_QFACT_CAPTURE_WINDOW_MS = 30_000;

/** Consecutive transcript lines of one formal run (a page break counts as consecutive). */
export function consecutiveLiveQfactLines(left: LiveQfactCoordinate, right: LiveQfactCoordinate): boolean {
  return left.run === right.run && left.order + 1 === right.order;
}

/**
 * Whether a click at `now` may join `group`: within the capture window of the group's last capture, or, for a group
 * stored before capture times existed, within the hearing gap between the group's facing edge line and the clicked line.
 */
export function withinLiveQfactCaptureWindow(group: readonly LiveQfactCoordinate[], edge: LiveQfactCoordinate,
  clicked: LiveQfactCoordinate, now: number): boolean {
  const stamps = group.map(line => line.at).filter((at): at is number => Number.isFinite(at));
  if (stamps.length) return now - Math.max(...stamps) <= LIVE_QFACT_CAPTURE_WINDOW_MS;
  const [left, right] = edge.order < clicked.order ? [edge, clicked] : [clicked, edge];
  return withinLiveQfactGap(hearingTimecode(left.hearing), hearingTimecode(right.hearing));
}

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
