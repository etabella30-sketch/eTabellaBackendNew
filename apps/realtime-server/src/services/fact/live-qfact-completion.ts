import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';
import { Subscription } from 'rxjs';
import { DbService } from '@app/global/db/pg/db.service';
import { FeedDataService } from '../feed-data/feed-data.service';
import { MARK_EVENTS_SINK } from '../marks/mark-events.port';
import type { MarkEventsService } from '../marks/mark-events.service';
import { CaptureSession, sourceLine } from './live-qfact-capture';
import { liveCoordinates, LiveQfactCoordinate } from './live-qfact-rules';

/**
 * Completes instant QFACTs whose line was still being written when they were captured (RT QA 2026-10-29, F-30): Space
 * on the live line stored "assumptions" while the line went on to "assumptions on depending on, you know, if they
 * would". Only an untouched (pristine) capture is refreshed, and only by the streaming append the capture already
 * trusts when it joins a neighbour: same identity, place and hearing clock, and the new text starts with the stored
 * text. A correction, an edited QFACT or a finished session is never rewritten.
 */

export const LIVE_QFACT_COMPLETION_SESSION_SQL = `SELECT "nSesid", "cStatus", "isUploaded", "dDelDt", "dEntryEndedAt", "nLines",
  "nEntryEventid"::text AS "nEntryEventid" FROM "RSessionMaster" WHERE "nSesid"=$1::uuid`;
/** Pristine instant QFACTs of the session that touch a page from $2 on. */
export const LIVE_QFACT_COMPLETION_FIND_SQL = `SELECT m."nFSid"::text AS "nFSid", m."nUserid"::text AS "nUserid", d."jCordinates"
  FROM "FactMaster" m JOIN "FactDetail" d ON d."nFSid"=m."nFSid"
  WHERE m."nSesid"=$1::uuid AND m."cFType"='QF' AND d."bLiveCapturePristine"
    AND d."jCordinates" @> '[{"capture":"live-instant"}]'::jsonb
    AND EXISTS (SELECT 1 FROM jsonb_array_elements(d."jCordinates") c WHERE (c->>'p')::int >= $2)`;
export const LIVE_QFACT_COMPLETION_UPDATE_SQL = `UPDATE "FactDetail" SET "jOT"=$2::jsonb, "jCordinates"=$3::jsonb
  WHERE "nFSid"=$1::uuid AND "bLiveCapturePristine"`;

/** How long a session's page changes collect before one completion pass. */
export const LIVE_QFACT_COMPLETION_DELAY_MS = 5_000;

type Row = { nFSid: string; nUserid: string; jCordinates: unknown };

/** The coordinates with their text grown to the current line, or null when nothing grew (or a line changed otherwise). */
export async function grownCoordinates(feed: FeedDataService, record: CaptureSession, lines: readonly LiveQfactCoordinate[]): Promise<LiveQfactCoordinate[] | null> {
  let grew = false;
  const next: LiveQfactCoordinate[] = [];
  for (const line of lines) {
    const current = await sourceLine(feed, record, line.p, line.l);
    if (!current || current.identity !== line.identity || current.order !== line.order
      || current.hearing?.frames !== line.hearing?.frames || !current.text.startsWith(line.text)) return null;
    if (current.text.length > line.text.length) grew = true;
    next.push({ ...line, text: current.text });
  }
  return grew ? next : null;
}

/** One completion pass for a session. Returns the owners of the QFACTs it completed. */
export async function completeLiveQfacts(db: DbService, feed: FeedDataService, nSesid: string, fromPage: number): Promise<string[]> {
  const sessions = await db.rowQuery(LIVE_QFACT_COMPLETION_SESSION_SQL, [nSesid]);
  const record = sessions.success ? sessions.data?.[0] as CaptureSession | undefined : undefined;
  if (!record || record.cStatus !== 'R' || record.isUploaded || record.dDelDt || record.dEntryEndedAt) return [];
  const found = await db.rowQuery(LIVE_QFACT_COMPLETION_FIND_SQL, [nSesid, Math.max(1, fromPage)]);
  if (!found.success) return [];
  const owners = new Set<string>();
  for (const row of (found.data ?? []) as Row[]) {
    const lines = liveCoordinates(row.jCordinates);
    if (!lines.length || lines.length !== (Array.isArray(row.jCordinates) ? row.jCordinates.length : 0)) continue;
    const grown = await grownCoordinates(feed, record, lines);
    if (!grown) continue;
    const saved = await db.saveAtomically(async () => {
      // The capture's own transaction-local bypass: this IS the capture finishing, so the QFACT stays pristine.
      await db.rowQuery("SELECT set_config('etabella.live_qfact_write','on',true)", []);
      try {
        const res = await db.rowQuery(LIVE_QFACT_COMPLETION_UPDATE_SQL,
          [row.nFSid, JSON.stringify([grown.map(line => line.text).join('\n')]), JSON.stringify(grown)]);
        return !!res.success;
      } finally { await db.rowQuery("SELECT set_config('etabella.live_qfact_write','off',true)", []); }
    });
    if (saved) owners.add(row.nUserid);
  }
  return [...owners];
}

@Injectable()
export class LiveQfactCompletionService implements OnModuleDestroy {
  private readonly logger = new Logger('LiveQfactCompletion');
  private readonly pending = new Map<string, { fromPage: number; timer: ReturnType<typeof setTimeout> }>();
  private readonly subscription: Subscription;

  constructor(
    private readonly db: DbService,
    private readonly feed: FeedDataService,
    @Optional() @Inject(MARK_EVENTS_SINK) private readonly markEvents?: MarkEventsService,
  ) {
    this.subscription = this.feed.pagesChanged$.subscribe(({ nSesid, page }) => this.schedule(nSesid, page));
  }

  /** A page changed: one pass per session after the delay, from the lowest page that changed (and the one before it). */
  schedule(nSesid: string, page: number): void {
    const from = Math.max(1, page - 1);
    const waiting = this.pending.get(nSesid);
    if (waiting) { waiting.fromPage = Math.min(waiting.fromPage, from); return; }
    const timer = setTimeout(() => void this.run(nSesid), LIVE_QFACT_COMPLETION_DELAY_MS);
    timer.unref?.();
    this.pending.set(nSesid, { fromPage: from, timer });
  }

  private async run(nSesid: string): Promise<void> {
    const job = this.pending.get(nSesid);
    this.pending.delete(nSesid);
    if (!job) return;
    try {
      const owners = await completeLiveQfacts(this.db, this.feed, nSesid, job.fromPage);
      for (const owner of owners) this.markEvents?.changed({ nSesid, users: [owner], kind: 'F', by: owner });
    } catch (error) {
      this.logger.warn(`completion pass failed for ${nSesid}: ${(error as Error)?.message}`);
    }
  }

  onModuleDestroy(): void {
    this.subscription.unsubscribe();
    for (const job of this.pending.values()) clearTimeout(job.timer);
    this.pending.clear();
  }
}
