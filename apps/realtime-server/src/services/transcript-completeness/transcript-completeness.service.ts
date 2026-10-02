import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import type { SyncState } from '@app/edge-sync';
import { isUuid } from '../utility/safe-path';

/*
 * D16 completeness gate (spec rev 3, sections 4.4 and 6.3 RC-4; plan R-T4; build defaults O-3, O-4).
 *
 * A session is GATED when it ever had a venue box (bEverEdge) or runs in cloud-direct cut mode
 * (cApply = 'C'). Keying on bEverEdge, not the current cFeedSource, means a split cannot bypass the gate.
 * A session is LINKED when it is a later part of a split hearing (nPrevPartSesid set, D7): its own feed is
 * cloud-direct, but its hearing is published only when every part passes (O-4), so a publish of it is
 * gated too. Every hearing today is neither: for those the gate costs exactly one plain read
 * (SESSION_PROVENANCE_SQL) and never consults the completeness SP (RC-4).
 *
 * Gated sessions are decided by et_rt_transcript_completeness (2026-10-01_rt_edge_07_sp_seal_gate.sql):
 *   publish needs every part of the hearing, in nPartNo order, to be K, or W acknowledged, or F (O-4),
 *   with no pending held stream; an export needs the same of the part it reads, and may also read a live
 *   ('L') part, stamped "Live - as of HH:MM:SS". 'S' (end requested, waiting for the venue box) blocks
 *   both. 'F' passes with an INCOMPLETE watermark.
 *   A part of a split hearing that is not gated (a cloud-direct legacy Part 2, cApply 'L': it never gets
 *   a cSyncState, so the SP calls it NOT_GATED) counts for a publish only once it has ended: cStatus 'C',
 *   or published (cStatus 'P', or isTranscript with isUploaded: the app's own dual detection,
 *   session.service.ts getFilesCount), read by PARTS_STATUS_SQL; a part still recording blocks the
 *   hearing's publish as LIVE.
 *   'W' needs the incidents acknowledged. A refusal lists the incidents of the part that blocks (for a part
 *   other than the requested one they are read with one more SP call, cPurpose 'X'), and every part's
 *   incidents ride in `parts`. The acknowledgement flag records et_rtedge_warn_ack only when the 'W' parts
 *   are the only thing in the way, so a request that is refused anyway leaves nothing behind.
 *
 * The only DB access is through DbService: rowQuery for the provenance, part-status and seal-state reads,
 * executeRef for the SPs rt_transcript_completeness, rtedge_warn_ack and rtedge_session_end.
 */

/**
 * The provenance read. Plain SQL like SESSION_ACCESS_SQL, deliberately not the completeness SP, so a
 * non-venue session never consults the gate SP (RC-4). The three columns arrive with the 2026-10-01
 * rt_edge migration (file 02).
 */
export const SESSION_PROVENANCE_SQL =
  'SELECT "bEverEdge", "cApply", "nPrevPartSesid" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1';

/** The same read for several sessions at once (the legacy venue sync ends a list of sessions). */
export const SESSIONS_PROVENANCE_SQL =
  'SELECT "nSesid", "bEverEdge", "cApply", "nPrevPartSesid" FROM "RSessionMaster" WHERE "nSesid" = ANY($1::uuid[])';

/**
 * O-4 for the parts of a split hearing that are not gated (a cloud-direct legacy Part 2: cApply 'L',
 * bEverEdge false, so no cSyncState ever). r2 of et_rt_transcript_completeness carries no cStatus, so a
 * publish of a split hearing reads it here, once, for those parts only, with the publish flags: a
 * published part (et_transcript_publish, et_realtime_transcript_upload_status 'P') is 'P', not 'C'. Only
 * gated or linked publishes get this far; a non-venue session never runs it.
 */
export const PARTS_STATUS_SQL =
  'SELECT "nSesid", "cStatus", "isTranscript", "isUploaded" FROM "RSessionMaster" WHERE "nSesid" = ANY($1::uuid[])';

/**
 * isSealed: the seal state of one RSessionMaster row, soft-deleted or not. A deleted venue session still seals
 * (et_rtedge_session_seal accepts a dDelDt row: its box got op 'end' for it), and its deferred end body must then
 * run; the completeness SP answers NOT_FOUND for a deleted row, so it cannot be asked this.
 */
export const SESSION_SYNC_STATE_SQL = 'SELECT "cSyncState" FROM "RSessionMaster" WHERE "nSesid" = $1 LIMIT 1';

/** How long "the provenance columns do not exist yet" is remembered: reads in that time answer without a query. */
export const PRE_MIGRATION_RECHECK_MS = 60_000;
/**
 * uploadPending's remembered provenance (session/realtimedatabysesid asks on every fetch of an unpublished
 * transcript). A gated session keeps its verdict longer: bEverEdge is never cleared once venue data exists.
 */
export const READER_GATED_TTL_MS = 10 * 60_000;
export const READER_UNGATED_TTL_MS = 60_000;
const READER_CACHE_MAX = 2_000;

/** RSessionMaster.cStatus of an ended session (legacy SP 'C', et_rtedge_session_end, the venue sync). */
const ENDED_STATUS = 'C';
/** RSessionMaster.cStatus of a published session (et_transcript_publish, the upload-publish SP). */
const PUBLISHED_STATUS = 'P';

/**
 * Has this RSessionMaster row stopped recording? Ended ('C'), or published: cStatus 'P', or both publish
 * flags set (the dual detection of session.service.ts getFilesCount, for rows published before the SPs
 * set 'P'). A recording ('R'), scheduled or unknown status is not ended: fail closed.
 */
export function isEndedRow(row: { cStatus?: unknown; isTranscript?: unknown; isUploaded?: unknown } | null | undefined): boolean {
  if (!row) return false;
  const status = String(row.cStatus ?? '').trim().toUpperCase();
  if (status === ENDED_STATUS || status === PUBLISHED_STATUS) return true;
  return isTrue(row.isTranscript) && isTrue(row.isUploaded);
}

/**
 * The migration that adds the provenance columns has not run here: no session can be gated yet.
 * Postgres says `column "bEverEdge" does not exist` (unqualified, as both reads are written).
 */
const PRE_MIGRATION_RE = /column "(bEverEdge|cApply|nPrevPartSesid)" does not exist/i;

export type CompletenessPurpose = 'publish' | 'export';

/** rtedge_gate_reason (file 04): the verdict for one part. */
export type GateReason =
  | 'NOT_GATED' | 'COMPLETE' | 'ACKED' | 'FORCED'
  | 'LIVE' | 'AWAITING_SEAL' | 'PENDING_ORPHANS' | 'NEEDS_ACK' | 'NO_STATE';

/** Why a gate refused: a gate reason, or the session is unknown, or the check itself failed. */
export type GateCode = GateReason | 'NOT_FOUND' | 'UNVERIFIED';

export interface SessionProvenance {
  nSesid: string;
  /** bEverEdge OR cApply = 'C': the gate applies to every artefact, and its end is a request. */
  gated: boolean;
  /** A later part of a split hearing (nPrevPartSesid set): its publish waits for the earlier parts. */
  linked: boolean;
  /** The read failed. Callers fail closed: never treat this as "not gated". */
  error?: string;
  /** The provenance columns do not exist (migration not applied), so nothing can be gated. */
  preMigration?: boolean;
}

/** r1 of et_rt_transcript_completeness. */
export interface CompletenessRow {
  msg: number;
  value?: string;
  cCode?: string;
  nSesid?: string;
  bOk?: boolean;
  bComplete?: boolean;
  cReason?: GateReason;
  bGated?: boolean;
  cSyncState?: SyncState | null;
  nPendingOrphans?: number;
  nWarnings?: number;
  jIncidents?: any;
  dWarnAckAt?: any;
  nWarnAckBy?: string | null;
  bWatermark?: boolean;
  cSealNote?: string | null;
  bLiveStamp?: boolean;
  bUploadPending?: boolean;
  cFeedSource?: string | null;
  cApply?: string | null;
  bEverEdge?: boolean;
  nEdgeid?: string | null;
  nFinalLines?: number | null;
  dSealedAt?: any;
  nPartNo?: number | null;
  nPrevPartSesid?: string | null;
  nNextPartSesid?: string | null;
}

/** r2 of et_rt_transcript_completeness: the parts of a split hearing in chain order. */
export interface CompletenessPartRow {
  nOrder: number;
  nSesid: string;
  nPartNo?: number | null;
  cName?: string | null;
  dStartDt?: any;
  cFeedSource?: string | null;
  cSyncState?: SyncState | null;
  bGated?: boolean;
  bComplete?: boolean;
  cReason?: GateReason;
  nPendingOrphans?: number;
  bCurrent?: boolean;
}

export interface CompletenessPart {
  nOrder: number;
  nSesid: string;
  nPartNo: number | null;
  cName: string | null;
  dStartDt: any;
  cFeedSource: string | null;
  cSyncState: SyncState | null;
  /** The part's verdict after any acknowledgement this call recorded ('NEEDS_ACK' becomes 'ACKED'). */
  cReason: GateReason;
  /** The part is K, W acknowledged, or F. */
  bComplete: boolean;
  /** A 'W' part acknowledged, before or by this call. */
  bAcknowledged: boolean;
  /** The part lets this purpose through. */
  bPasses: boolean;
  nPendingOrphans: number;
  bCurrent: boolean;
  /** The part's seal incidents (jIncidents): what an acknowledgement of a 'W' part acknowledges. */
  incidents: any[];
  /** The part's seal note ('F': the interval the venue data is missing for). */
  cSealNote: string | null;
}

/** r1 fields of a part other than the requested one, read for the parts whose incidents or note matter. */
export interface PartDetail {
  jIncidents?: any;
  cSealNote?: string | null;
  nWarnings?: number;
}

export interface CompletenessVerdict {
  ok: boolean;
  /** The gate applied (bEverEdge, cApply 'C', or a linked part's publish). A failed provenance read says true. */
  gated: boolean;
  purpose: CompletenessPurpose;
  nSesid: string;
  /** Blocked: a stable machine code. */
  cCode?: GateCode;
  /** Blocked: what to show the user. */
  message?: string;
  /** Blocked by a part of a split hearing: its nPartNo (null for an unsplit session). */
  blockingPartNo?: number | null;
  cSyncState?: SyncState | null;
  cReason?: GateReason;
  /** 'F' (forced incomplete) part let through: the watermark every output must carry. */
  watermark?: string | null;
  /** Export of a live ('L') session: the stamp the output must carry. */
  liveStamp?: string | null;
  /** 'W' parts whose acknowledgement this call recorded. */
  acknowledged?: string[];
  /** Blocked: the incidents of the part that blocks; passing: the requested part's. Each part's are in `parts`. */
  incidents?: any[];
  /** The hearing's parts, in nPartNo order (O-4). One entry for an unsplit session. */
  parts?: CompletenessPart[];
}

export interface GateOptions {
  /**
   * Acknowledge the incidents of the 'W' parts (et_rtedge_warn_ack) so the request can pass. Recorded only
   * when those parts are the only thing blocking the request, after the rest has been checked, so a
   * request refused for another reason leaves nothing behind. Needs nMasterid; the SP allows a global
   * admin, a case admin of the case or the hearing operator.
   */
  acknowledgeWarnings?: boolean;
  /** The acting (token) user. */
  nMasterid?: string | null;
  /** Clock for the live stamp. */
  now?: () => Date;
}

/** One row of et_rtedge_session_end. */
export interface SessionEndRequestRow {
  msg: number;
  value?: string;
  cCode?: string;
  bGated?: boolean;
  bPending?: boolean;
  bSealed?: boolean;
  bChanged?: boolean;
  nSesid?: string;
  cSyncState?: SyncState | null;
  cFeedSource?: string | null;
  cApply?: string | null;
  nEdgeid?: string | null;
}

const PASSING: ReadonlySet<string> = new Set(['NOT_GATED', 'COMPLETE', 'ACKED', 'FORCED']);
const COMPLETE: ReadonlySet<string> = new Set(['COMPLETE', 'ACKED', 'FORCED']);
const SEALED: ReadonlySet<string> = new Set(['K', 'W', 'F']);

function errorText(error: unknown): string {
  if (error === undefined || error === null || error === '') return 'unknown error';
  if (typeof error === 'string') return error;
  return (error as any)?.message ? String((error as any).message) : String(error);
}

function isTrue(value: unknown): boolean {
  return value === true || value === 't' || value === 'true' || value === 1;
}

/** bEverEdge OR cApply = 'C' for one RSessionMaster row (missing row: not gated). */
export function isGatedRow(row: { bEverEdge?: unknown; cApply?: unknown } | null | undefined): boolean {
  if (!row) return false;
  return isTrue(row.bEverEdge) || String(row.cApply ?? '').trim().toUpperCase() === 'C';
}

/** A later part of a split hearing (missing row: not linked). */
export function isLinkedRow(row: { nPrevPartSesid?: unknown } | null | undefined): boolean {
  return !!row && row.nPrevPartSesid !== null && row.nPrevPartSesid !== undefined && String(row.nPrevPartSesid).trim() !== '';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** "Live - as of HH:MM:SS" (spec 4.4), server clock. */
export function liveStampText(now: Date): string {
  return `Live — as of ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

/** The interval text after "INCOMPLETE - " (S-D8, S-D15). Dismissal notes already start "venue data missing". */
function missingText(note?: string | null): string {
  const n = String(note ?? '').trim();
  if (!n) return 'venue data missing';
  return /^venue data missing/i.test(n) ? n : `venue data missing ${n}`;
}

/** "INCOMPLETE - venue data missing <interval>" for one part, or a per-part list for a split hearing. */
export function watermarkText(forced: Array<{ nPartNo: number | null; nOrder: number; note?: string | null }>, split: boolean): string {
  if (!split || forced.length === 0) return `INCOMPLETE — ${missingText(forced[0]?.note)}`;
  return `INCOMPLETE — ${forced.map((p) => `Part ${p.nPartNo ?? p.nOrder}: ${missingText(p.note)}`).join('; ')}`;
}

/** The message for a refusal. "Waiting for the venue box to upload" is the 'S' case (spec 4.4). */
export function blockMessage(code: GateCode, purpose: CompletenessPurpose, opts: { partNo?: number | null; venue?: boolean } = {}): string {
  const doing = purpose === 'publish' ? 'Publishing' : 'Exporting';
  const before = purpose === 'publish' ? 'before publishing' : 'before exporting';
  const prefix = opts.partNo !== undefined && opts.partNo !== null ? `Part ${opts.partNo}: ` : '';
  switch (code) {
    case 'AWAITING_SEAL':
      return prefix + (opts.venue === false
        ? `Waiting for the transcript to be sealed. ${doing} is blocked until it is complete.`
        : `Waiting for the venue box to upload. ${doing} is blocked until the transcript is complete.`);
    case 'LIVE':
      return prefix + (opts.venue === false
        ? `The session is still live. End it ${before}.`
        : `The session is still live. End it and wait for the venue box to upload ${before}.`);
    case 'PENDING_ORPHANS':
      return prefix + `Venue data held outside the transcript is waiting for review. Dismiss it or record an addendum ${before}.`;
    case 'NEEDS_ACK':
      return prefix + `The venue upload finished with warnings. Acknowledge the listed incidents ${before}.`;
    case 'NO_STATE':
      return prefix + `The session has no completeness state yet. ${doing} is blocked.`;
    case 'NOT_FOUND':
      return prefix + `Session not found. ${doing} is blocked.`;
    case 'UNVERIFIED':
    default:
      return prefix + `The transcript's completeness could not be checked. ${doing} is blocked; try again.`;
  }
}

function incidentsOf(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

const isVenue = (cFeedSource?: string | null, bEverEdge?: unknown) => cFeedSource === 'E' || isTrue(bEverEdge);
const sameId = (a: unknown, b: unknown) => String(a ?? '').toLowerCase() === String(b ?? '').toLowerCase();

/** The per-part reason evaluateCompleteness uses: the requested part's comes from r1, the others' from r2. */
function reasonOfRow(row: CompletenessPartRow, current: CompletenessRow | undefined): GateReason | undefined {
  const isCurrent = row.bCurrent === true || sameId(row.nSesid, current?.nSesid);
  return (isCurrent ? current?.cReason : row.cReason) ?? row.cReason;
}

/**
 * The parts of a split hearing whose publish verdict needs their cStatus (O-4): the parts that are not
 * gated (a cloud-direct legacy part has no cSyncState, so the SP says NOT_GATED whatever its state). An
 * unsplit session, and any export, needs none.
 */
export function ungatedPartIds(purpose: CompletenessPurpose, current: CompletenessRow, parts: CompletenessPartRow[] | undefined): string[] {
  if (purpose !== 'publish' || !parts || parts.length < 2) return [];
  return parts.filter((row) => reasonOfRow(row, current) === 'NOT_GATED').map((row) => String(row.nSesid));
}

/**
 * The parts of a split hearing, other than the requested one, whose r1 a publish needs: a 'W' part's
 * incidents (what a refusal lists and an acknowledgement acknowledges) and an 'F' part's seal note (the
 * interval its watermark names). r2 carries neither. An unsplit session, and any export, needs none.
 */
export function detailPartIds(purpose: CompletenessPurpose, current: CompletenessRow, parts: CompletenessPartRow[] | undefined): string[] {
  if (purpose !== 'publish' || !parts || parts.length < 2) return [];
  return parts
    .filter((row) => !(row.bCurrent === true || sameId(row.nSesid, current?.nSesid)))
    .filter((row) => ['NEEDS_ACK', 'FORCED'].includes(String(reasonOfRow(row, current))))
    .map((row) => String(row.nSesid));
}

/**
 * The gate rule for a gated session, from the rows of et_rt_transcript_completeness (pure).
 *  - publish: every part, in nPartNo order, must be K, W acknowledged (before or by this call) or F (O-4);
 *    a part that is not gated (a cloud-direct legacy part of a split hearing, which never gets a
 *    cSyncState) passes only once it has ended or been published (listed in `endedParts`); otherwise it
 *    blocks as LIVE. A not-gated part missing from `endedParts` counts as not ended (fail closed);
 *  - export: the requested part must be K, W acknowledged, F, or live ('L', stamped).
 * The refusal names the first part, in order, that blocks, and lists that part's incidents. With
 * `deferAck`, a 'W' part still waiting for its acknowledgement is named only when nothing else blocks (the
 * caller is about to record the acknowledgement, and wants to know whether that is all that is needed).
 * 'F' anywhere in what passes adds the INCOMPLETE watermark, naming each forced part's missing interval.
 */
export function evaluateCompleteness(input: {
  nSesid: string;
  purpose: CompletenessPurpose;
  current: CompletenessRow;
  parts?: CompletenessPartRow[];
  acknowledged?: string[];
  /** Lower-case ids of the not-gated parts of a split hearing that have ended or been published. */
  endedParts?: Set<string>;
  /** r1 fields of the parts other than the requested one (lower-case id), where they matter. */
  details?: Record<string, PartDetail>;
  /** Name a NEEDS_ACK part as the blocker only when no other part blocks. */
  deferAck?: boolean;
  now?: Date;
}): CompletenessVerdict {
  const { nSesid, purpose, current } = input;
  const acked = new Set((input.acknowledged ?? []).map((id) => String(id).toLowerCase()));
  const ended = input.endedParts ?? new Set<string>();
  const details = input.details ?? {};

  if (!current || Number(current.msg) !== 1) {
    const cCode: GateCode = !current || current.cCode === 'NOT_FOUND' ? 'NOT_FOUND' : 'UNVERIFIED';
    return { ok: false, gated: true, purpose, nSesid, cCode, message: blockMessage(cCode, purpose) };
  }

  const currentId = current.nSesid ?? nSesid;
  const rows: CompletenessPartRow[] = input.parts?.length
    ? input.parts
    : [{
      nOrder: 1, nSesid: currentId, nPartNo: current.nPartNo ?? null, cName: null, dStartDt: null,
      cFeedSource: current.cFeedSource ?? null, cSyncState: current.cSyncState ?? null, bGated: current.bGated,
      bComplete: current.bComplete, cReason: current.cReason, nPendingOrphans: current.nPendingOrphans, bCurrent: true,
    }];

  const split = rows.length > 1;
  const parts: CompletenessPart[] = rows
    .map((row) => {
      const isCurrent = row.bCurrent === true || sameId(row.nSesid, currentId);
      const reported: GateReason = (isCurrent ? current.cReason : row.cReason) ?? row.cReason ?? 'NO_STATE';
      const ackedNow = reported === 'NEEDS_ACK' && acked.has(String(row.nSesid).toLowerCase());
      let cReason: GateReason = ackedNow ? 'ACKED' : reported;
      // O-4: a not-gated part of a split hearing publishes only once it has ended.
      if (purpose === 'publish' && split && cReason === 'NOT_GATED' && !ended.has(String(row.nSesid).toLowerCase())) {
        cReason = 'LIVE';
      }
      const passes = PASSING.has(cReason) || (purpose === 'export' && isCurrent && cReason === 'LIVE');
      const detail: PartDetail | undefined = isCurrent ? current : details[String(row.nSesid).toLowerCase()];
      return {
        nOrder: Number(row.nOrder) || 1,
        nSesid: row.nSesid,
        nPartNo: row.nPartNo ?? null,
        cName: row.cName ?? null,
        dStartDt: row.dStartDt ?? null,
        cFeedSource: row.cFeedSource ?? null,
        cSyncState: (isCurrent ? current.cSyncState : row.cSyncState) ?? null,
        cReason,
        bComplete: COMPLETE.has(cReason),
        bAcknowledged: cReason === 'ACKED',
        bPasses: passes,
        nPendingOrphans: Number(row.nPendingOrphans) || 0,
        bCurrent: isCurrent,
        incidents: incidentsOf(detail?.jIncidents),
        cSealNote: detail?.cSealNote ?? null,
      };
    })
    .sort((a, b) => (a.nPartNo ?? a.nOrder) - (b.nPartNo ?? b.nOrder) || a.nOrder - b.nOrder);

  const considered = purpose === 'publish' ? parts : parts.filter((p) => p.bCurrent);
  const blockers = considered.filter((p) => !p.bPasses);
  const blocking = (input.deferAck ? blockers.find((p) => p.cReason !== 'NEEDS_ACK') : undefined) ?? blockers[0];
  const currentPart = parts.find((p) => p.bCurrent);
  const verdict: CompletenessVerdict = {
    ok: !blocking,
    gated: true,
    purpose,
    nSesid,
    cSyncState: current.cSyncState ?? null,
    cReason: currentPart?.cReason ?? current.cReason,
    acknowledged: parts.filter((p) => p.cReason === 'ACKED' && acked.has(String(p.nSesid).toLowerCase())).map((p) => p.nSesid),
    incidents: (blocking ?? currentPart)?.incidents ?? incidentsOf(current.jIncidents),
    parts,
    watermark: null,
    liveStamp: null,
  };

  if (blocking) {
    verdict.cCode = blocking.cReason;
    verdict.blockingPartNo = split ? blocking.nPartNo ?? blocking.nOrder : null;
    verdict.message = blockMessage(blocking.cReason, purpose, {
      partNo: verdict.blockingPartNo,
      venue: blocking.bCurrent ? isVenue(current.cFeedSource, current.bEverEdge) : isVenue(blocking.cFeedSource),
    });
    return verdict;
  }

  const forced = considered.filter((p) => p.cReason === 'FORCED');
  if (forced.length) {
    verdict.watermark = watermarkText(
      forced.map((p) => ({ nPartNo: p.nPartNo, nOrder: p.nOrder, note: p.cSealNote })),
      split,
    );
  }
  if (purpose === 'export' && currentPart?.cReason === 'LIVE') {
    verdict.liveStamp = liveStampText(input.now ?? new Date());
  }
  return verdict;
}

/** A refusal as the HTTP answer of publish / export: today's {msg:-1, value, error} plus the gate's detail. */
export function toBlockedResponse(verdict: CompletenessVerdict): any {
  const message = verdict.message ?? blockMessage(verdict.cCode ?? 'UNVERIFIED', verdict.purpose);
  return {
    msg: -1,
    value: message,
    error: message,
    cCode: verdict.cCode ?? 'UNVERIFIED',
    bGated: verdict.gated,
    cSyncState: verdict.cSyncState ?? null,
    nBlockingPartNo: verdict.blockingPartNo ?? null,
    incidents: verdict.incidents ?? [],
    parts: verdict.parts ?? [],
  };
}

/** What a passing gated output reports back (the parts in order, the watermark flag, the live stamp). */
export function completenessSummary(verdict: CompletenessVerdict): any {
  return {
    bGated: verdict.gated,
    cSyncState: verdict.cSyncState ?? null,
    bIncomplete: !!verdict.watermark,
    cWatermark: verdict.watermark ?? null,
    cLiveStamp: verdict.liveStamp ?? null,
    acknowledged: verdict.acknowledged ?? [],
    parts: verdict.parts ?? [],
  };
}

/**
 * The acknowledgement flag a publish / export request may carry ("I have read the listed incidents").
 * Over HTTP it arrives as bAckWarnings on the four gated routes' DTOs (TranscriptPublishReq, both
 * getAnnotHighlightEEP classes, updateTransStatusMDL), declared with AckWarningsFlag (ack-warnings.ts) so the
 * global ValidationPipe (whitelist + forbidNonWhitelisted) lets it through as a boolean. The gate records the
 * acknowledgement for the token user through et_rtedge_warn_ack (completeness-ack-http.spec.ts runs each
 * route end to end). The string 'true' is still accepted here for service callers that pass a raw body.
 */
export function acknowledgementRequested(body: unknown): boolean {
  const flag = (body as any)?.bAckWarnings;
  return flag === true || flag === 'true';
}

@Injectable()
export class TranscriptCompletenessService {
  private readonly logger = new Logger('TranscriptCompleteness');
  private preMigrationLogged = false;
  /**
   * Until then the provenance columns are known to be missing (the rt_edge migration has not run here), so
   * provenance reads answer preMigration without a query: no failing SELECT and no DB error line per call.
   */
  private preMigrationUntil = 0;
  /** uploadPending's settled provenance per session (lower-case id). */
  private readonly readerVerdicts = new Map<string, { gated: boolean; linked: boolean; until: number }>();
  /** uploadPending's provenance reads in flight: concurrent fetches of one session share one read. */
  private readonly readerReads = new Map<string, Promise<SessionProvenance>>();

  constructor(private readonly db: DbService) { }

  private preMigration(error: string): boolean {
    if (!PRE_MIGRATION_RE.test(error)) return false;
    this.preMigrationUntil = Date.now() + PRE_MIGRATION_RECHECK_MS;
    if (!this.preMigrationLogged) {
      this.preMigrationLogged = true;
      this.logger.warn(`RSessionMaster has no bEverEdge / cApply / nPrevPartSesid yet (rt_edge migration not applied): no session is gated (checked again every ${PRE_MIGRATION_RECHECK_MS / 1000} s)`);
    }
    return true;
  }

  /** The provenance columns were found missing less than PRE_MIGRATION_RECHECK_MS ago. */
  private knownPreMigration(): boolean {
    return Date.now() < this.preMigrationUntil;
  }

  /**
   * Is nSesid gated or linked? One plain read. A value that is not a UUID cannot name a session row and
   * is not read. A failed read comes back with `error`, never as "not gated", except when the provenance
   * columns do not exist yet (the migration has not run, so no session can be gated); that state is
   * remembered for PRE_MIGRATION_RECHECK_MS, and reads in that time answer it without a query.
   */
  async provenance(nSesid: string): Promise<SessionProvenance> {
    if (!isUuid(nSesid)) return { nSesid, gated: false, linked: false };
    if (this.knownPreMigration()) return { nSesid, gated: false, linked: false, preMigration: true };
    let res: any;
    try {
      res = await this.db.rowQuery(SESSION_PROVENANCE_SQL, [nSesid]);
    } catch (error) {
      return { nSesid, gated: false, linked: false, error: errorText(error) };
    }
    if (!res?.success) {
      const error = errorText(res?.error);
      if (this.preMigration(error)) return { nSesid, gated: false, linked: false, preMigration: true };
      return { nSesid, gated: false, linked: false, error };
    }
    const row = Array.isArray(res.data) ? res.data[0] : undefined;
    return { nSesid, gated: isGatedRow(row), linked: isLinkedRow(row) };
  }

  /**
   * Which of these sessions are gated (bEverEdge OR cApply 'C')? One plain read for the whole list; ids
   * that are not UUIDs are not read and never gated. Same failure rules as provenance().
   */
  async gatedAmong(ids: string[]): Promise<{ gated: Set<string>; error?: string; preMigration?: boolean }> {
    const wanted = [...new Set((ids ?? []).filter((id) => isUuid(id)).map((id) => id.toLowerCase()))];
    if (!wanted.length) return { gated: new Set() };
    if (this.knownPreMigration()) return { gated: new Set(), preMigration: true };
    let res: any;
    try {
      res = await this.db.rowQuery(SESSIONS_PROVENANCE_SQL, [wanted]);
    } catch (error) {
      return { gated: new Set(), error: errorText(error) };
    }
    if (!res?.success) {
      const error = errorText(res?.error);
      if (this.preMigration(error)) return { gated: new Set(), preMigration: true };
      return { gated: new Set(), error };
    }
    const rows: any[] = Array.isArray(res.data) ? res.data : [];
    return { gated: new Set(rows.filter((row) => isGatedRow(row)).map((row) => String(row.nSesid).toLowerCase())) };
  }

  /**
   * assertTranscriptComplete(nSesid, purpose) of spec 4.4. Not gated: { ok: true, gated: false } after the
   * provenance read alone. Gated (or the publish of a linked part): the completeness SP decides
   * (evaluateCompleteness). Never throws.
   */
  async assertTranscriptComplete(nSesid: string, purpose: CompletenessPurpose, opts: GateOptions = {}): Promise<CompletenessVerdict> {
    const provenance = await this.provenance(nSesid);
    if (provenance.error) {
      this.logger.error(`Completeness provenance read failed for ${nSesid}: ${provenance.error}`);
      return { ok: false, gated: true, purpose, nSesid, cCode: 'UNVERIFIED', message: blockMessage('UNVERIFIED', purpose) };
    }
    const applies = provenance.gated || (purpose === 'publish' && provenance.linked);
    if (!applies) return { ok: true, gated: false, purpose, nSesid };

    const read = await this.readCompleteness(nSesid, purpose);
    if ('error' in read) {
      this.logger.error(`Completeness check failed for ${nSesid}: ${read.error}`);
      return { ok: false, gated: true, purpose, nSesid, cCode: 'UNVERIFIED', message: blockMessage('UNVERIFIED', purpose) };
    }

    const unverified = (what: string, error: string): CompletenessVerdict => {
      this.logger.error(`${what} failed for ${nSesid}: ${error}`);
      return { ok: false, gated: true, purpose, nSesid, cCode: 'UNVERIFIED', message: blockMessage('UNVERIFIED', purpose) };
    };
    const found = Number(read.current?.msg) === 1;

    // O-4: the not-gated parts of a split hearing count only once ended; r2 has no cStatus, so read it.
    let endedParts: Set<string> | undefined;
    const ungated = found ? ungatedPartIds(purpose, read.current, read.parts) : [];
    if (ungated.length) {
      const statuses = await this.endedAmong(ungated);
      if ('error' in statuses) return unverified('Part status read', statuses.error);
      endedParts = statuses.ended;
    }

    // The incidents of another part's 'W' (what a refusal must list) and the note of another part's 'F'
    // (its watermark interval): r2 carries neither, so read those parts' r1.
    let details: Record<string, PartDetail> | undefined;
    const detailed = found ? detailPartIds(purpose, read.current, read.parts) : [];
    if (detailed.length) {
      const read2 = await this.partDetails(detailed);
      if ('error' in read2) return unverified('Part detail read', read2.error);
      details = read2.details;
    }

    const now = (opts.now ?? (() => new Date()))();
    const base = { nSesid, purpose, current: read.current, parts: read.parts, endedParts, details, now };
    const ackOffered = !!(opts.acknowledgeWarnings && opts.nMasterid && found);

    // Decide first. With an acknowledgement on offer, a 'W' part is named as the blocker only when it is
    // the only kind of thing in the way; then, and only then, the acknowledgement is recorded and the
    // request decided again. A request refused for anything else leaves no acknowledgement behind.
    const verdict = evaluateCompleteness({ ...base, acknowledged: [], deferAck: ackOffered });
    if (verdict.ok || !ackOffered || verdict.cCode !== 'NEEDS_ACK') return verdict;

    const acknowledged: string[] = [];
    const waiting = (verdict.parts ?? []).filter((p) => (purpose === 'publish' || p.bCurrent) && p.cReason === 'NEEDS_ACK');
    for (const p of waiting) {
      if (await this.acknowledge(p.nSesid, opts.nMasterid)) acknowledged.push(p.nSesid);
    }
    return evaluateCompleteness({ ...base, acknowledged });
  }

  /**
   * Which of these (not-gated) parts have ended or been published (isEndedRow)? One plain read
   * (PARTS_STATUS_SQL). A failed read, a non-UUID id or an id with no row is an error: the caller fails
   * closed.
   */
  async endedAmong(ids: string[]): Promise<{ ended: Set<string> } | { error: string }> {
    const wanted = [...new Set((ids ?? []).map((id) => String(id ?? '').toLowerCase()))];
    if (wanted.some((id) => !isUuid(id))) return { error: 'a part id is not a UUID' };
    let res: any;
    try {
      res = await this.db.rowQuery(PARTS_STATUS_SQL, [wanted]);
    } catch (error) {
      return { error: errorText(error) };
    }
    if (!res?.success) return { error: errorText(res?.error) };
    const rows: any[] = Array.isArray(res.data) ? res.data : [];
    const seen = new Set(rows.map((row) => String(row?.nSesid ?? '').toLowerCase()));
    const missing = wanted.filter((id) => !seen.has(id));
    if (missing.length) return { error: `no session row for part ${missing.join(', ')}` };
    return { ended: new Set(rows.filter((row) => isEndedRow(row)).map((row) => String(row.nSesid).toLowerCase())) };
  }

  /**
   * r1 of each of these parts (one completeness read each, cPurpose 'X': only its incidents, warnings and
   * seal note are used). A failed read or a part the SP cannot find is an error: the caller fails closed.
   */
  async partDetails(ids: string[]): Promise<{ details: Record<string, PartDetail> } | { error: string }> {
    const details: Record<string, PartDetail> = {};
    for (const id of [...new Set((ids ?? []).map((v) => String(v ?? '')))]) {
      if (!isUuid(id)) return { error: 'a part id is not a UUID' };
      const read = await this.readCompleteness(id, 'export');
      if ('error' in read) return { error: read.error };
      if (Number(read.current?.msg) !== 1) return { error: `no completeness row for part ${id} (${read.current?.cCode ?? read.current?.value ?? 'unknown'})` };
      details[id.toLowerCase()] = { jIncidents: read.current.jIncidents, cSealNote: read.current.cSealNote ?? null, nWarnings: read.current.nWarnings };
    }
    return { details };
  }

  /**
   * Spec 4.4: session/realtimedatabysesid says uploadPending while a gated session is 'L' or 'S' (the
   * cloud copy may still be behind the venue box). Ungated sessions (every hearing today) answer
   * { gated: false } after the provenance read alone, and the caller adds nothing to its answer.
   * uploadPending comes from bUploadPending of et_rt_transcript_completeness. A failed provenance read
   * answers { gated: false, error } (the caller cannot tell, and leaves its answer as today); a gated
   * session whose state cannot be read says uploadPending true (fail closed: the reader warns).
   * The provenance is remembered per session (readerProvenance), so repeated fetches of one transcript cost
   * one read a minute, and nothing while the migration is known not to have run.
   */
  async uploadPending(nSesid: string): Promise<{ gated: boolean; uploadPending?: boolean; error?: string }> {
    const provenance = await this.readerProvenance(nSesid);
    if (provenance.error) return { gated: false, error: provenance.error };
    if (!provenance.gated) return { gated: false };
    const read = await this.readCompleteness(nSesid, 'export');
    if ('error' in read) return { gated: true, uploadPending: true, error: read.error };
    if (Number(read.current?.msg) !== 1) {
      return { gated: true, uploadPending: true, error: String(read.current?.cCode || read.current?.value || 'NOT_FOUND') };
    }
    return { gated: true, uploadPending: isTrue(read.current.bUploadPending) };
  }

  /**
   * provenance() for uploadPending, remembered per session: a gated verdict for READER_GATED_TTL_MS, an
   * ungated one for READER_UNGATED_TTL_MS. A failed read is not remembered (the next fetch asks again), and
   * the pre-migration state is remembered by provenance() itself. It never looks at EDGE_ENABLED: a venue or
   * cut-mode session stays gated after the edge is switched off. Only the reader's warning uses it; the
   * publish and export gates (assertTranscriptComplete) and the end paths always read afresh.
   */
  private async readerProvenance(nSesid: string): Promise<SessionProvenance> {
    if (!isUuid(nSesid)) return this.provenance(nSesid);
    const id = nSesid.toLowerCase();
    const known = this.readerVerdicts.get(id);
    if (known && known.until > Date.now()) return { nSesid, gated: known.gated, linked: known.linked };
    const inFlight = this.readerReads.get(id);
    if (inFlight) return inFlight;
    const reading = this.provenance(nSesid)
      .then((provenance) => {
        if (!provenance.error && !provenance.preMigration) this.rememberReaderVerdict(id, provenance);
        return provenance;
      })
      .finally(() => this.readerReads.delete(id));
    this.readerReads.set(id, reading);
    return reading;
  }

  private rememberReaderVerdict(id: string, provenance: SessionProvenance): void {
    const now = Date.now();
    if (this.readerVerdicts.size >= READER_CACHE_MAX && !this.readerVerdicts.has(id)) {
      for (const [key, value] of this.readerVerdicts) if (value.until <= now) this.readerVerdicts.delete(key);
      if (this.readerVerdicts.size >= READER_CACHE_MAX) this.readerVerdicts.clear();
    }
    this.readerVerdicts.set(id, {
      gated: provenance.gated,
      linked: provenance.linked,
      until: now + (provenance.gated ? READER_GATED_TTL_MS : READER_UNGATED_TTL_MS),
    });
  }

  /** The SP rows for a gated session (cPurpose 'P' publish, 'X' export). */
  async readCompleteness(nSesid: string, purpose: CompletenessPurpose): Promise<{ current: CompletenessRow; parts: CompletenessPartRow[] } | { error: string }> {
    let res: any;
    try {
      res = await this.db.executeRef('rt_transcript_completeness', { nSesid, cPurpose: purpose === 'publish' ? 'P' : 'X', ref: 2 });
    } catch (error) {
      return { error: errorText(error) };
    }
    if (!res?.success) return { error: errorText(res?.error) };
    const current = res.data?.[0]?.[0];
    if (!current) return { error: 'et_rt_transcript_completeness returned no row' };
    return { current, parts: Array.isArray(res.data?.[1]) ? res.data[1] : [] };
  }

  /** et_rtedge_warn_ack for one 'W' part; true when the acknowledgement is recorded. */
  async acknowledge(nSesid: string, nMasterid: string, cNote?: string): Promise<boolean> {
    try {
      const res = await this.db.executeRef('rtedge_warn_ack', { nSesid, nMasterid, ...(cNote ? { cNote } : {}) });
      const row = res?.success ? res.data?.[0]?.[0] : null;
      if (row && Number(row.msg) === 1) return true;
      this.logger.warn(`Warning acknowledgement refused for ${nSesid}: ${row?.cCode ?? errorText(res?.error)}`);
    } catch (error) {
      this.logger.warn(`Warning acknowledgement failed for ${nSesid}: ${errorText(error)}`);
    }
    return false;
  }

  /**
   * et_rtedge_session_end: the end REQUEST of a gated session (L -> S, cStatus 'C'). For an ungated
   * session it changes nothing and answers bGated false.
   */
  async requestEnd(nSesid: string, nMasterid?: string | null): Promise<{ row: SessionEndRequestRow } | { error: string }> {
    try {
      const res = await this.db.executeRef('rtedge_session_end', { nSesid, ...(nMasterid ? { nMasterid } : {}) });
      if (!res?.success) return { error: errorText(res?.error) };
      const row = res.data?.[0]?.[0];
      if (!row) return { error: 'et_rtedge_session_end returned no row' };
      return { row };
    } catch (error) {
      return { error: errorText(error) };
    }
  }

  /**
   * True when the gated session is sealed or force-closed (K, W or F): its deferred end body may run. One
   * plain read of the row's cSyncState (SESSION_SYNC_STATE_SQL), soft-deleted rows included: a deleted venue
   * session seals too (et_rtedge_session_seal accepts it, and forceseal L -> F of a deleted session), and its
   * end body must then run. The completeness SP is not asked: it answers NOT_FOUND for a deleted row.
   * A value that is not a UUID, or a session with no row, is not sealed.
   */
  async isSealed(nSesid: string): Promise<{ sealed: boolean; cSyncState?: SyncState | null; error?: string }> {
    if (!isUuid(nSesid)) return { sealed: false, cSyncState: null };
    let res: any;
    try {
      res = await this.db.rowQuery(SESSION_SYNC_STATE_SQL, [nSesid]);
    } catch (error) {
      return { sealed: false, error: errorText(error) };
    }
    if (!res?.success) return { sealed: false, error: errorText(res?.error) };
    const row = Array.isArray(res.data) ? res.data[0] : undefined;
    const raw = row?.cSyncState;
    const state = raw === null || raw === undefined || String(raw).trim() === '' ? null : (String(raw).trim().toUpperCase() as SyncState);
    return { sealed: state !== null && SEALED.has(state), cSyncState: state };
  }
}
