/**
 * Viewer broadcast plan for one cut (spec §5.8). The same plan runs on the
 * box's LAN gateway (from each Cut) and in the cloud (EventsGateway.broadcastCut,
 * from each applied round via broadcastCutFromRound); every emit carries the
 * cut's `rev`.
 *
 * | Cut                                                        | Emitted                                             |
 * |------------------------------------------------------------|-----------------------------------------------------|
 * | pure append (all changed indices ≥ prevTotal−1, no shrink), | message{i, d, date, l, p, rev}                      |
 * | ≤ 200 lines                                                |                                                     |
 * | any rewrite of earlier indices, or a larger append,         | untagged previous-data{…, rev, totalLines} per      |
 * | ≤ 400 pages                                                | changed page, paced ≤ 20 pages / 100 ms             |
 * | shrink (totalLines < prevTotal)                             | the pages above + realtime-events{feed-shrink}      |
 * | > 400 changed pages                                         | one realtime-events{feed-resync}                    |
 *
 * The plan is data: it returns the pacing schedule and sets no timer.
 *
 * Payload shapes mirror today's emits so pre-rev readers keep working
 * (regression contract RC-3): `message` has the parser's TCP-DATA fields
 * (libs/feed-parse bridge-parser emitToLocalUser: i, d, date, l, p) plus rev;
 * `previous-data` has the fetch-data snapshot fields without `tab`/`a`/`h`
 * (an untagged page, like today's lost-data broadcast), plus rev and
 * totalLines. Readers place `message` rows by [2], idempotently.
 *
 * Version-aware merge (D20) is the reader's job: overlay rows keep the rev of
 * their `message`; a page snapshot R re-applies only overlay rows with
 * rev > R; a snapshot older than the page's rev is ignored.
 *
 * D21: "atomic" means the cloud store, not the reader's screen. A multi-page
 * rewrite reaches readers paced, so for under ~350 ms (a 70-page catch-up) a
 * line moved across a page boundary can show twice or not at all; no text is
 * lost and every page converges when its snapshot arrives. Accepted; there is
 * no reader-side round buffering.
 *
 * Pages go out newest-first (highest page first), the order of the fetch-data
 * snapshots (D12), so the page a live reader is looking at settles first.
 *
 * PURITY: no I/O, no timers.
 */
import { CanonicalLine, CanonicalPage, pageCount } from './canonical';
import type { Cut } from './cutter';
import { RoundPage, RoundShrink, ViewerEventType } from './protocol';

export interface BroadcastLimits {
  /** largest append sent as one `message` */
  maxAppendLines: number;
  /** more changed pages than this → one feed-resync */
  maxPagedPages: number;
  /** pages per pacing tick */
  pagesPerTick: number;
  /** pacing tick */
  tickMs: number;
}

export const BROADCAST_LIMITS: Readonly<BroadcastLimits> = Object.freeze({
  maxAppendLines: 200,
  maxPagedPages: 400,
  pagesPerTick: 20,
  tickMs: 100,
});

/** `message` (live rows), rev-tagged. */
export interface CutMessagePayload {
  i: number;
  d: CanonicalLine[];
  date: string;
  l: number;
  p: number;
  rev: number;
}

/** Untagged `previous-data` for one changed page, rev-tagged. */
export interface CutPreviousDataPayload {
  msg: 1;
  page: number;
  data: string;
  totalPages: number;
  nSesid: string;
  rev: number;
  totalLines: number;
}

export interface FeedShrinkEvent {
  type: 'feed-shrink';
  nSesid: string;
  totalLines: number;
  rev: number;
}

export interface FeedResyncEvent {
  type: 'feed-resync';
  nSesid: string;
  rev: number;
}

export type BroadcastEmit =
  | { room: string; event: 'message'; payload: CutMessagePayload }
  | { room: string; event: 'previous-data'; payload: CutPreviousDataPayload }
  | { room: string; event: 'realtime-events'; payload: FeedShrinkEvent | FeedResyncEvent };

/** Emits due `atMs` after the cut is published. */
export interface BroadcastStep {
  atMs: number;
  emits: BroadcastEmit[];
}

export type BroadcastKind = 'none' | 'append' | 'pages' | 'resync';

export interface BroadcastPlan {
  kind: BroadcastKind;
  nSesid: string;
  rev: number;
  /** ascending atMs; step 0 is due immediately */
  steps: BroadcastStep[];
  /** emits across all steps */
  emitCount: number;
  /** pages sent as previous-data, in send order */
  pages: number[];
}

/**
 * The parts of a cut the plan reads. A box Cut satisfies it; the cloud builds
 * one per applied round with broadcastCutFromRound. Every changed index lies
 * in one of `pages`, which is where the plan reads its rows.
 */
export type BroadcastCut = Pick<Cut, 'nSesid' | 'nLines' | 'rev' | 'prevTotal' | 'totalLines' | 'changed' | 'pages' | 'shrink'>;

/**
 * Cloud side (§5.5 step 7): the broadcast cut of an applied round. A round
 * coalesces any number of box cuts, so the changed lines are found by
 * comparing the round's pages with the pages they replace (read `before`
 * BEFORE the apply). A line at or past the old total is always changed.
 * A RoundApplyPlan (round.ts) can be passed as `round` directly.
 */
export function broadcastCutFromRound(
  round: { nSesid: string; rev: number; totalLines: number; pages: readonly RoundPage[]; shrinkCause?: string },
  before: { totalLines: number; page: (p: number) => readonly unknown[] | null | undefined },
  nLines: number,
): BroadcastCut {
  const pages = [...round.pages].sort((a, b) => a.p - b.p);
  const changed: number[] = [];
  for (const pg of pages) {
    const old = before.page(pg.p) || [];
    for (let k = 0; k < pg.lines.length; k++) {
      const i = (pg.p - 1) * nLines + k;
      if (i >= before.totalLines || k >= old.length || JSON.stringify(pg.lines[k]) !== JSON.stringify(old[k])) changed.push(i);
    }
  }
  const shrink: RoundShrink | undefined =
    round.totalLines < before.totalLines
      ? round.shrinkCause
        ? { lines: before.totalLines - round.totalLines, cause: round.shrinkCause }
        : { lines: before.totalLines - round.totalLines }
      : undefined;
  return {
    nSesid: round.nSesid,
    nLines,
    rev: round.rev,
    prevTotal: before.totalLines,
    totalLines: round.totalLines,
    changed,
    pages,
    ...(shrink ? { shrink } : {}),
  };
}

/** The Socket.IO room viewers of a session join (`S{nSesid}`). */
export function sessionRoom(nSesid: string): string {
  return `S${nSesid}`;
}

/** Plan the viewer emits for one cut. */
export function planBroadcast(cut: BroadcastCut, limits: Partial<BroadcastLimits> = {}): BroadcastPlan {
  const lim = { ...BROADCAST_LIMITS, ...limits };
  const room = sessionRoom(cut.nSesid);
  const shrinking = cut.totalLines < cut.prevTotal;
  const changed = cut.changed;
  const plan = (kind: BroadcastKind, steps: BroadcastStep[], pages: number[] = []): BroadcastPlan => ({
    kind,
    nSesid: cut.nSesid,
    rev: cut.rev,
    steps,
    emitCount: steps.reduce((n, s) => n + s.emits.length, 0),
    pages,
  });

  if (!changed.length && !cut.pages.length && !shrinking) return plan('none', []);

  if (cut.pages.length > lim.maxPagedPages) {
    const payload: FeedResyncEvent = { type: ViewerEventType.feedResync, nSesid: cut.nSesid, rev: cut.rev };
    return plan('resync', [{ atMs: 0, emits: [{ room, event: 'realtime-events', payload }] }]);
  }

  const pureAppend =
    !shrinking && changed.length > 0 && changed.length <= lim.maxAppendLines && changed[0] >= cut.prevTotal - 1;
  if (pureAppend) {
    const byPage = new Map(cut.pages.map(pg => [pg.p, pg.lines] as const));
    const rows = changed.map(i => rowAt(byPage, i, cut.nLines));
    const last = changed[changed.length - 1];
    const payload: CutMessagePayload = {
      i: cut.totalLines,
      d: rows,
      date: cut.nSesid,
      l: cut.nLines,
      p: Math.floor(last / cut.nLines) + 1,
      rev: cut.rev,
    };
    return plan('append', [{ atMs: 0, emits: [{ room, event: 'message', payload }] }]);
  }

  const totalPages = pageCount(cut.totalLines, cut.nLines);
  const ordered = [...cut.pages].sort((a, b) => b.p - a.p);
  const steps: BroadcastStep[] = [];
  if (shrinking) {
    const payload: FeedShrinkEvent = { type: ViewerEventType.feedShrink, nSesid: cut.nSesid, totalLines: cut.totalLines, rev: cut.rev };
    steps.push({ atMs: 0, emits: [{ room, event: 'realtime-events', payload }] });
  }
  for (let k = 0; k < ordered.length; k += lim.pagesPerTick) {
    const atMs = (k / lim.pagesPerTick) * lim.tickMs;
    const emits: BroadcastEmit[] = ordered.slice(k, k + lim.pagesPerTick).map(pg => ({
      room,
      event: 'previous-data' as const,
      payload: {
        msg: 1 as const,
        page: pg.p,
        data: JSON.stringify(pg.lines),
        totalPages,
        nSesid: cut.nSesid,
        rev: cut.rev,
        totalLines: cut.totalLines,
      },
    }));
    if (atMs === 0 && steps.length) steps[0].emits.push(...emits);
    else steps.push({ atMs, emits });
  }
  return plan('pages', steps, ordered.map(pg => pg.p));
}

function rowAt(pages: ReadonlyMap<number, CanonicalPage>, i: number, nLines: number): CanonicalLine {
  const page = pages.get(Math.floor(i / nLines) + 1);
  if (!page || page[i % nLines] === undefined) {
    throw new RangeError(`edge-sync: changed line ${i} is not in the cut's pages`);
  }
  return page[i % nLines];
}
