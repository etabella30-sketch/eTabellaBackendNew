/**
 * Rounds: the box's upload unit, and the cloud's checks on it
 * (spec §5.2 "The round", §5.4, §5.5, §5.7; ledger D17, D19).
 *
 * Box side
 *  - dirtyPages / buildRound: every page whose digest differs from the box's
 *    record of the CLOUD's digest, read at one rev, plus the lineage
 *    {epoch, rebaseSeq, rawSeqThrough, rawHashThrough, lineage:{appliedRawSeq,
 *    appliedRawHash}}, split into parts of ≤ 256 KB. One round in flight per
 *    session; newer cuts coalesce into the next round's dirty set.
 *  - boxCheckHelloReply / resumeFromHello / classifyRoundReply: resume with no
 *    persisted ack state (§5.5), the box's half of the D19 last-applied check
 *    (for 'continue', 'end' and 'recover'); the round lineage hash always
 *    comes from the box's own journal.
 *
 * Cloud side
 *  - RoundAssembler: stages multi-part rounds keyed (nSesid, rev), out of
 *    order, 60 s TTL (clock injected; no timers).
 *  - validateRound: binding, rev, lineage (MR-1 + D19), pages, root over
 *    (stored ⊕ round), shrink guard (MR-2), in the order of §5.5 "Round apply".
 *    Its output is a PLAN for one batched apply (D17); nothing is written here.
 *  - helloVerdict: the cloud's half of resume (MR-3, D19).
 *  - planRawAppend: raw-lane sequencing at the header level (§5.5 "Raw lane").
 *  - recomputeRoot / checkSeal / sealSigningPayload: the completeness proof
 *    (§5.7), with the root recomputed from STORED pages, not cached digests;
 *    sealClaims builds the box's seal fields.
 *  - bootDigests: D18, digests recomputed from the pages restored at boot.
 *
 * PURITY: no I/O, no clock, no randomness. Callers inject store lookups.
 */
import { CanonicalPage, DEFAULT_LINES_PER_PAGE, pageCount } from './canonical';
import { assertFmt, pageDigest, rootDigest } from './digest';
import {
  AlertTier,
  CATCH_UP_ROUND_PAGES,
  EDGE_FMT,
  EdgeHelloReplySession,
  EdgeHelloSession,
  EdgeIncident,
  EdgeRound,
  EdgeSeal,
  HelloVerdict,
  MAX_PART_BYTES,
  MAX_SOCKET_BUFFER_BYTES,
  RawAck,
  RawNack,
  RawPosition,
  ROUND_STAGE_TTL_MS,
  RoundLineage,
  RoundPage,
  RoundReplyOk,
  RoundReplyPartial,
  RoundReplyRefusal,
  RoundReply,
  RoundShrink,
  SealReply,
  Sha256Hex,
  SHRINK_GUARD,
  SyncState,
  isWarningIncident,
} from './protocol';

// ===========================================================================
// Box side: dirty set, round building, splitting
// ===========================================================================

/**
 * What the box believes the cloud holds. `totalLines` is null when unknown
 * (after a ROOT reply, which carries only digests): a round is then always sent.
 */
export interface CloudView {
  digests: readonly Sha256Hex[];
  totalLines: number | null;
  root?: Sha256Hex | null;
}

/** The box state a round is read from (a CutterView satisfies it). */
export interface RoundSource {
  nSesid: string;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  digests: readonly Sha256Hex[];
  pages: readonly CanonicalPage[];
  rawSeqThrough: number;
  rawHashThrough: Sha256Hex;
  lastShrinkCause?: string;
}

/** Pages (1-based, ascending) whose local digest differs from the cloud's. */
export function dirtyPages(localDigests: readonly Sha256Hex[], cloudDigests: readonly Sha256Hex[]): number[] {
  const dirty: number[] = [];
  for (let k = 0; k < localDigests.length; k++) {
    if (localDigests[k] !== cloudDigests[k]) dirty.push(k + 1);
  }
  return dirty;
}

/** True when the box must send a round to bring the cloud to `local`. */
export function needsRound(local: Pick<RoundSource, 'digests' | 'totalLines' | 'root'>, cloud: CloudView): boolean {
  if (cloud.totalLines === null || cloud.totalLines !== local.totalLines) return true;
  if (cloud.root != null && cloud.root !== local.root) return true;
  if (cloud.digests.length !== local.digests.length) return true;
  return dirtyPages(local.digests, cloud.digests).length > 0;
}

export interface BuildRoundInput {
  source: RoundSource;
  epoch: number;
  rebaseSeq: number | null;
  /** the cloud's last applied seq and the box's OWN chain hash there (D19) */
  lineage: RoundLineage;
  cloud: CloudView;
  /** default MAX_PART_BYTES (the hello reply's limits.maxPart) */
  maxPartBytes?: number;
  /** a single page larger than this cannot be sent at all (default: socket buffer) */
  hardMaxPartBytes?: number;
}

export interface BuiltRound {
  rev: number;
  /** dirty pages, ascending */
  dirty: number[];
  parts: EdgeRound[];
  /** UTF-8 JSON size of each part */
  partBytes: number[];
  /** pages that alone exceed maxPartBytes and travel in a part of their own */
  oversizePages: number[];
  /** what the box records once the round is acked ok */
  afterAck: { appliedRev: number; cloud: CloudView; lineage: RoundLineage };
}

/** Thrown when one page cannot fit even the hard part ceiling. */
export class PageTooLargeError extends Error {
  constructor(readonly p: number, readonly bytes: number, readonly limit: number) {
    super(`edge-sync: page ${p} needs ${bytes} bytes, over the ${limit}-byte part ceiling`);
    this.name = 'PageTooLargeError';
  }
}

/**
 * Build the next round, or null when the cloud already matches the box.
 * Pages are packed greedily in ascending order; every part carries the full
 * header so the cloud can stage parts in any order (§5.5).
 */
export function buildRound(input: BuildRoundInput): BuiltRound | null {
  const { source, cloud } = input;
  if (!needsRound(source, cloud)) return null;
  const maxPart = input.maxPartBytes ?? MAX_PART_BYTES;
  const hardMax = Math.max(input.hardMaxPartBytes ?? MAX_SOCKET_BUFFER_BYTES, maxPart);
  const dirty = dirtyPages(source.digests, cloud.digests);
  const shrink: RoundShrink | undefined =
    cloud.totalLines !== null && cloud.totalLines > source.totalLines
      ? source.lastShrinkCause
        ? { lines: cloud.totalLines - source.totalLines, cause: source.lastShrinkCause }
        : { lines: cloud.totalLines - source.totalLines }
      : undefined;

  const header = (part: number, parts: number, pages: RoundPage[]): EdgeRound => ({
    nSesid: source.nSesid,
    epoch: input.epoch,
    rebaseSeq: input.rebaseSeq,
    lineage: { appliedRawSeq: input.lineage.appliedRawSeq, appliedRawHash: input.lineage.appliedRawHash },
    rev: source.rev,
    totalLines: source.totalLines,
    root: source.root,
    rawSeqThrough: source.rawSeqThrough,
    rawHashThrough: source.rawHashThrough,
    ...(shrink ? { shrink } : {}),
    part,
    parts,
    pages,
  });

  // Upper bound of the envelope: part/parts written with more digits than any real count.
  const envelope = utf8ByteLength(JSON.stringify(header(9_999_999, 9_999_999, [])));
  const groups: RoundPage[][] = [];
  const oversizePages: number[] = [];
  let current: RoundPage[] = [];
  let currentBytes = envelope;
  for (const p of dirty) {
    const page: RoundPage = { p, d: source.digests[p - 1], lines: source.pages[p - 1] };
    const bytes = utf8ByteLength(JSON.stringify(page));
    if (envelope + bytes > maxPart) {
      if (envelope + bytes > hardMax) throw new PageTooLargeError(p, envelope + bytes, hardMax);
      if (current.length) groups.push(current);
      groups.push([page]);
      oversizePages.push(p);
      current = [];
      currentBytes = envelope;
      continue;
    }
    const cost = bytes + (current.length ? 1 : 0);
    if (currentBytes + cost > maxPart) {
      groups.push(current);
      current = [];
      currentBytes = envelope;
    }
    currentBytes += bytes + (current.length ? 1 : 0);
    current.push(page);
  }
  if (current.length || !groups.length) groups.push(current);

  const parts = groups.map((pages, k) => header(k + 1, groups.length, pages));
  const partBytes = parts.map(part => utf8ByteLength(JSON.stringify(part)));
  return {
    rev: source.rev,
    dirty,
    parts,
    partBytes,
    oversizePages,
    afterAck: {
      appliedRev: source.rev,
      cloud: { digests: source.digests, totalLines: source.totalLines, root: source.root },
      lineage: { appliedRawSeq: source.rawSeqThrough, appliedRawHash: source.rawHashThrough },
    },
  };
}

/** What the box does with the reply to a round part (§5.4, §5.5). */
export type BoxRoundAction =
  | { kind: 'acked'; appliedRev: number; root: Sha256Hex }
  | { kind: 'partial' }
  /** STALE, LINEAGE, BAD_PAGE: run hello again; the digest diff resolves it */
  | { kind: 'rehello'; code: 'STALE' | 'LINEAGE' | 'BAD_PAGE'; alert?: AlertTier }
  /** ROOT: adopt the cloud's digests and rebuild the dirty set */
  | { kind: 'rebuild'; cloud: CloudView }
  | { kind: 'retry'; retryMs: number }
  /** REGRESS: enter RECOVER (MR-3) */
  | { kind: 'recover'; appliedRawSeq: number }
  /** FORK: uplink frozen for this session; an admin splits (D19, D7) */
  | { kind: 'freeze' }
  /** HELD_SHRINK: wait for the admin's decision */
  | { kind: 'hold'; heldId: string }
  /** FENCED, NOT_BOUND: stop pushing this session */
  | { kind: 'stop'; code: 'FENCED' | 'NOT_BOUND' };

export function classifyRoundReply(reply: RoundReply): BoxRoundAction {
  if (reply.ok === true) {
    if ((reply as RoundReplyPartial).partial) return { kind: 'partial' };
    const ok = reply as RoundReplyOk;
    return { kind: 'acked', appliedRev: ok.appliedRev, root: ok.root };
  }
  return classifyRefusal(reply as RoundReplyRefusal);
}

function classifyRefusal(reply: RoundReplyRefusal): BoxRoundAction {
  switch (reply.code) {
    case 'STALE':
    case 'LINEAGE':
      return { kind: 'rehello', code: reply.code };
    case 'BAD_PAGE':
      return { kind: 'rehello', code: 'BAD_PAGE', alert: 'P2' };
    case 'ROOT':
      return { kind: 'rebuild', cloud: { digests: reply.cloudDigests, totalLines: null, root: null } };
    case 'BUSY':
      return { kind: 'retry', retryMs: reply.retryMs };
    case 'REGRESS':
      return { kind: 'recover', appliedRawSeq: reply.appliedRawSeq };
    case 'FORK':
      return { kind: 'freeze' };
    case 'HELD_SHRINK':
      return { kind: 'hold', heldId: reply.heldId };
    case 'FENCED':
    case 'NOT_BOUND':
      return { kind: 'stop', code: reply.code };
  }
}

/** The box's journal, as the hello check needs it. */
export interface BoxJournalView {
  headSeq: number;
  /** the box's own chain hash after record `seq` (seq 0 = h0); undefined if not held */
  hashAt(seq: number): Sha256Hex | undefined;
}

export interface BoxHelloDecision {
  verdict: HelloVerdict;
  recoverFrom?: number;
  reason?: string;
}

/**
 * The box's half of the hello checks (§5.5): the cloud cannot see the box's
 * hash at an arbitrary seq, so the box verifies, before trusting the reply:
 *  - D19: its own chain hash at appliedRawSeq equals appliedRawHash, else
 *    'frozen' (it pushes nothing; an admin splits). A box that no longer holds
 *    that record (lost journal, old image) is frozen too. This runs for
 *    'recover' as well: RECOVER by raw pull-back is only for a box whose
 *    journal still holds appliedRawHash at appliedRawSeq (rev 3 MR-3). The
 *    cloud answers 'recover' from the box's head alone, and when its raw lane
 *    is ahead of the applied rounds (records that change no line advance raw
 *    without a round) a box forked before appliedRawSeq gets 'recover' too;
 *  - MR-3: its head reaches rawAcked.seq and its hash there matches, else
 *    'recover' (pull back raw from recoverFrom).
 * A 'recover' that passes D19 keeps the cloud's recoverFrom (default
 * appliedRawSeq+1), capped at the journal head + 1 so the pull leaves no gap.
 * Other verdicts ('frozen', 'unknown', 'sealed', Phase-4 ones) pass through.
 */
export function boxCheckHelloReply(reply: EdgeHelloReplySession, journal: BoxJournalView): BoxHelloDecision {
  if (reply.verdict !== 'continue' && reply.verdict !== 'end' && reply.verdict !== 'recover') {
    return reply.recoverFrom !== undefined ? { verdict: reply.verdict, recoverFrom: reply.recoverFrom } : { verdict: reply.verdict };
  }
  if (reply.appliedRawSeq != null) {
    const own = reply.appliedRawSeq <= journal.headSeq ? journal.hashAt(reply.appliedRawSeq) : undefined;
    if (own === undefined) return { verdict: 'frozen', reason: 'journal does not hold the last applied record' };
    if (reply.appliedRawHash != null && own !== reply.appliedRawHash) {
      return { verdict: 'frozen', reason: 'chain hash at appliedRawSeq differs from the last applied round' };
    }
  }
  const afterApplied = (reply.appliedRawSeq ?? 0) + 1;
  if (reply.verdict === 'recover') {
    const recoverFrom = Math.min(reply.recoverFrom ?? afterApplied, journal.headSeq + 1);
    return { verdict: 'recover', recoverFrom, reason: 'the cloud raw store is ahead of or diverges from the journal' };
  }
  const acked = reply.rawAcked;
  if (acked && acked.seq > 0) {
    if (journal.headSeq < acked.seq) return { verdict: 'recover', recoverFrom: journal.headSeq + 1, reason: 'journal head below the cloud raw head' };
    if (journal.hashAt(acked.seq) !== acked.hash) {
      return { verdict: 'recover', recoverFrom: afterApplied, reason: 'journal diverges from the cloud raw store' };
    }
  }
  return { verdict: reply.verdict };
}

/** The resume state the box adopts after a passing hello check (§5.5). */
export interface BoxResume {
  appliedRev: number;
  cloud: CloudView;
  /** appliedRawSeq from the cloud, appliedRawHash from the box's OWN journal (D19) */
  lineage: RoundLineage;
  /** next raw seq to upload */
  rawCursor: number;
}

/** Thrown by resumeFromHello when the box must not push pages for the session. */
export class ResumeRefusedError extends Error {
  constructor(readonly nSesid: string, readonly decision: BoxHelloDecision) {
    super(`edge-sync: session ${nSesid} cannot resume (${decision.verdict}${decision.reason ? `: ${decision.reason}` : ''})`);
    this.name = 'ResumeRefusedError';
  }
}

/**
 * The state the box adopts after hello (§5.5: "only after the lineage checks
 * pass"). It re-runs boxCheckHelloReply and throws ResumeRefusedError unless
 * the decision is 'continue' or 'end', so no round lineage is ever built from
 * a reply the box has not verified. The lineage hash is the box's own chain
 * hash at the cloud's appliedRawSeq, never the cloud's appliedRawHash echoed
 * back: every round then carries a real D19 proof (§5.4 e.round), and a box
 * whose history differs gets FORK on its first round even if its hello check
 * was skipped. After a cloud state loss with no hash (O-7) the box's own hash
 * is sent and the cloud checks the seq only.
 */
export function resumeFromHello(reply: EdgeHelloReplySession, journal: BoxJournalView): BoxResume {
  const decision = boxCheckHelloReply(reply, journal);
  if (decision.verdict !== 'continue' && decision.verdict !== 'end') throw new ResumeRefusedError(reply.nSesid, decision);
  const appliedRawSeq = reply.appliedRawSeq ?? null;
  const appliedRawHash = appliedRawSeq === null ? null : journal.hashAt(appliedRawSeq);
  if (appliedRawHash === undefined) {
    throw new ResumeRefusedError(reply.nSesid, { verdict: 'frozen', reason: 'journal does not hold the last applied record' });
  }
  return {
    appliedRev: reply.appliedRev || 0,
    cloud: { digests: reply.pageDigests || [], totalLines: reply.totalLines, root: reply.root },
    lineage: { appliedRawSeq, appliedRawHash },
    rawCursor: (reply.rawAcked?.seq ?? 0) + 1,
  };
}

// ===========================================================================
// Cloud side: staging multi-part rounds
// ===========================================================================

export type AssembleResult =
  | { status: 'complete'; round: EdgeRound }
  | { status: 'partial'; reply: RoundReplyPartial }
  /** a part of an older rev than the one staged: reply STALE */
  | { status: 'stale' }
  | { status: 'invalid'; reply: RoundReplyRefusal; reason: string };

interface Staging {
  rev: number;
  key: string;
  parts: number;
  received: Map<number, EdgeRound>;
  expiresAt: number;
}

/**
 * Stages the parts of each session's in-flight round (one per session: the
 * box keeps one round in flight). Parts may arrive in any order; a part whose
 * header differs from the staged one (same rev, other content) restarts the
 * staging; a newer rev replaces it. Expired stagings are dropped by sweep();
 * a cloud restart loses them and the box's hello diff resends (§5.5).
 */
export class RoundAssembler {
  private readonly staged = new Map<string, Staging>();
  private readonly ttlMs: number;

  constructor(opts: { ttlMs?: number } = {}) {
    this.ttlMs = opts.ttlMs ?? ROUND_STAGE_TTL_MS;
  }

  add(part: EdgeRound, nowMs: number): AssembleResult {
    const malformed = roundShapeProblem(part);
    if (malformed) return { status: 'invalid', reply: { ok: false, code: 'BAD_PAGE', p: 0 }, reason: malformed };
    let st = this.staged.get(part.nSesid);
    if (st && st.expiresAt <= nowMs) {
      this.staged.delete(part.nSesid);
      st = undefined;
    }
    if (st && part.rev < st.rev) return { status: 'stale' };
    if (part.parts === 1) {
      this.staged.delete(part.nSesid);
      const dup = duplicatePage(part.pages);
      if (dup !== null) return { status: 'invalid', reply: { ok: false, code: 'BAD_PAGE', p: dup }, reason: `page ${dup} sent twice` };
      return { status: 'complete', round: { ...part, pages: sortPages(part.pages) } };
    }
    const key = headerKey(part);
    if (!st || part.rev > st.rev || st.key !== key) {
      st = { rev: part.rev, key, parts: part.parts, received: new Map(), expiresAt: nowMs + this.ttlMs };
      this.staged.set(part.nSesid, st);
    }
    st.received.set(part.part, part);
    if (st.received.size < st.parts) {
      return { status: 'partial', reply: { ok: true, partial: true, have: st.received.size, parts: st.parts } };
    }
    this.staged.delete(part.nSesid);
    const pages: RoundPage[] = [];
    for (let k = 1; k <= st.parts; k++) pages.push(...st.received.get(k)!.pages);
    const dup = duplicatePage(pages);
    if (dup !== null) return { status: 'invalid', reply: { ok: false, code: 'BAD_PAGE', p: dup }, reason: `page ${dup} sent twice` };
    const first = st.received.get(1)!;
    return { status: 'complete', round: { ...first, part: 1, parts: 1, pages: sortPages(pages) } };
  }

  /** Drop stagings older than the TTL; returns how many were dropped. */
  sweep(nowMs: number): number {
    let dropped = 0;
    for (const [nSesid, st] of this.staged) {
      if (st.expiresAt <= nowMs) {
        this.staged.delete(nSesid);
        dropped += 1;
      }
    }
    return dropped;
  }

  /** Forget a session's staging (bind/revoke barrier, §5.5 step 0). */
  drop(nSesid: string): void {
    this.staged.delete(nSesid);
  }

  /** Sessions with a staged round. */
  get size(): number {
    return this.staged.size;
  }
}

function headerKey(r: EdgeRound): string {
  return JSON.stringify([
    r.nSesid,
    r.epoch,
    r.rebaseSeq,
    r.lineage?.appliedRawSeq ?? null,
    r.lineage?.appliedRawHash ?? null,
    r.rev,
    r.totalLines,
    r.root,
    r.rawSeqThrough,
    r.rawHashThrough,
    r.shrink ?? null,
    r.parts,
  ]);
}

function sortPages(pages: RoundPage[]): RoundPage[] {
  return [...pages].sort((a, b) => a.p - b.p);
}

function duplicatePage(pages: RoundPage[]): number | null {
  const seen = new Set<number>();
  for (const pg of pages) {
    if (seen.has(pg.p)) return pg.p;
    seen.add(pg.p);
  }
  return null;
}

const isNonNegInt = (v: unknown): v is number => Number.isSafeInteger(v) && (v as number) >= 0;

/** A structural problem with a round part, or null when its shape is sound. */
export function roundShapeProblem(r: EdgeRound): string | null {
  if (!r || typeof r !== 'object') return 'not an object';
  if (typeof r.nSesid !== 'string' || !r.nSesid) return 'nSesid';
  if (!isNonNegInt(r.epoch)) return 'epoch';
  if (r.rebaseSeq !== null && !isNonNegInt(r.rebaseSeq)) return 'rebaseSeq';
  if (!r.lineage || typeof r.lineage !== 'object') return 'lineage';
  if (r.lineage.appliedRawSeq !== null && !isNonNegInt(r.lineage.appliedRawSeq)) return 'lineage.appliedRawSeq';
  if (r.lineage.appliedRawHash !== null && typeof r.lineage.appliedRawHash !== 'string') return 'lineage.appliedRawHash';
  if (!isNonNegInt(r.rev)) return 'rev';
  if (!isNonNegInt(r.totalLines)) return 'totalLines';
  if (typeof r.root !== 'string') return 'root';
  if (!isNonNegInt(r.rawSeqThrough)) return 'rawSeqThrough';
  if (typeof r.rawHashThrough !== 'string') return 'rawHashThrough';
  if (!Number.isSafeInteger(r.parts) || r.parts < 1) return 'parts';
  if (!Number.isSafeInteger(r.part) || r.part < 1 || r.part > r.parts) return 'part';
  if (!Array.isArray(r.pages)) return 'pages';
  for (const pg of r.pages) {
    if (!pg || typeof pg !== 'object' || !Number.isSafeInteger(pg.p) || typeof pg.d !== 'string' || !Array.isArray(pg.lines)) {
      return 'page entry';
    }
  }
  return null;
}

// ===========================================================================
// Cloud side: validating a complete round (§5.5 "Round apply")
// ===========================================================================

/** The cloud's edge meta for one session (Redis edge:meta:<nSesid>, edge-meta.json; D10). */
export interface CloudSessionMeta {
  nSesid: string;
  nLines: number;
  fmt: number;
  epoch: number;
  rebaseSeq: number | null;
  /** 0 before the first applied round */
  appliedRev: number;
  /** rawSeqThrough of the last applied round; null before the first (D19) */
  appliedRawSeq: number | null;
  /** its chain hash; null before the first, or after a state loss with only nAppliedRawSeq (O-7) */
  appliedRawHash: Sha256Hex | null;
  totalLines: number;
  root: Sha256Hex;
  /** index p-1 = page p */
  digests: Sha256Hex[];
  /** uplink frozen by a FORK / D19 mismatch; cleared only by an admin (split) */
  frozen?: boolean;
}

/** The genesis meta of a freshly bound session. */
export function emptyCloudMeta(
  nSesid: string,
  opts: { nLines?: number; fmt?: number; epoch?: number; rebaseSeq?: number | null } = {},
): CloudSessionMeta {
  return {
    nSesid,
    nLines: opts.nLines ?? DEFAULT_LINES_PER_PAGE,
    fmt: opts.fmt ?? EDGE_FMT,
    epoch: opts.epoch ?? 1,
    rebaseSeq: opts.rebaseSeq ?? null,
    appliedRev: 0,
    appliedRawSeq: null,
    appliedRawHash: null,
    totalLines: 0,
    root: rootDigest(nSesid, 0, []),
    digests: [],
  };
}

export interface ShrinkGuardOptions {
  maxLines: number;
  maxFraction: number;
}

export interface ValidateRoundOptions {
  /**
   * The binding record re-read INSIDE the queue task (§5.5 step 0):
   * bound = RSessionMaster.nEdgeid == socket.edgeId and cFeedSource == 'E';
   * epoch = nIngestEpoch. Omitted = already checked by the caller.
   */
  binding?: { bound: boolean; epoch: number };
  /** cloud raw store: chain hash after `seq`, or undefined if not yet acked */
  rawHashAt?: (seq: number) => Sha256Hex | undefined;
  /** MR-2 thresholds (default SHRINK_GUARD); false disables the guard */
  shrinkGuard?: ShrinkGuardOptions | false;
  /** the admin confirmed this held shrink (incident SHRINK_CONFIRMED) */
  confirmShrink?: boolean;
}

/** One batched apply (D17): everything applyPagesAtomic and the meta write need. */
export interface RoundApplyPlan {
  nSesid: string;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  /** the round's pages, ascending, with their verified digests */
  pages: RoundPage[];
  /** every page digest after the apply (index p-1 = page p) */
  digests: Sha256Hex[];
  /** delete stored pages above this page number */
  deletePagesAbove: number;
  /** pages that existed before and are dropped */
  droppedPages: number[];
  /** the edge meta to store after the apply (§5.5 step 6) */
  meta: CloudSessionMeta;
  /** the raw lane has not reached rawSeqThrough yet: verify this pair when it does (MR-1) */
  pendingRawCheck?: RawPosition;
  /** the last-applied hash was unknown (state loss, O-7): only the seq was checked */
  lineageUnverified?: boolean;
  /** lines removed by this round (a confirmed or small shrink) */
  shrink?: { removed: number; fromTotal: number; toTotal: number };
  /** the box's note on why lines were removed (round.shrink.cause) */
  shrinkCause?: string;
  /** more than CATCH_UP_ROUND_PAGES pages: the session shows catching-up (§5.6) */
  catchingUp: boolean;
  /** the ack to send once applied */
  reply: RoundReplyOk;
}

export type RoundDecision =
  | { action: 'apply'; plan: RoundApplyPlan }
  | { action: 'refuse'; reply: RoundReplyRefusal; freeze: boolean; alert?: AlertTier; reason: string }
  /** MR-2: stage, reply HELD_SHRINK{heldId} (the caller mints heldId), P1 alert */
  | { action: 'hold'; removed: number; fromTotal: number; toTotal: number; alert: 'P1'; reason: string };

const refuse = (reply: RoundReplyRefusal, reason: string, freeze = false, alert?: AlertTier): RoundDecision =>
  alert ? { action: 'refuse', reply, freeze, alert, reason } : { action: 'refuse', reply, freeze, reason };

/**
 * Decide what to do with a complete round. Nothing is applied unless the
 * decision is 'apply'; a 'refuse' with freeze=true means the session's uplink
 * must be frozen (no later round applies until an admin acts, D19).
 *
 * A round whose `lineage.appliedRawSeq` is not the cloud's (the box missed an
 * ack) gets LINEAGE, not FORK: the box re-runs hello, where the D19 hash check
 * runs against its journal. FORK (and the freeze) is for a hash that differs
 * at the same seq. Throws UnsupportedFmtError if meta.fmt has no verifier.
 */
export function validateRound(
  round: EdgeRound,
  meta: CloudSessionMeta | null | undefined,
  opts: ValidateRoundOptions = {},
): RoundDecision {
  const shape = roundShapeProblem(round);
  if (shape) return refuse({ ok: false, code: 'BAD_PAGE', p: 0 }, `malformed round: ${shape}`, false, 'P2');

  // 0. Binding (re-read inside the queue task).
  if (!meta || meta.nSesid !== round.nSesid) return refuse({ ok: false, code: 'NOT_BOUND' }, 'session not bound to this box');
  if (opts.binding) {
    if (!opts.binding.bound) return refuse({ ok: false, code: 'NOT_BOUND' }, 'binding record says not bound');
    if (opts.binding.epoch !== round.epoch) return refuse({ ok: false, code: 'FENCED' }, `epoch ${round.epoch} fenced at ${opts.binding.epoch}`);
  }
  if (meta.frozen) return refuse({ ok: false, code: 'FORK' }, 'session uplink is frozen', true);

  // 1. rev must be newer than the last applied round.
  if (round.rev <= meta.appliedRev) {
    return refuse({ ok: false, code: 'STALE', appliedRev: meta.appliedRev, root: meta.root }, `rev ${round.rev} <= applied ${meta.appliedRev}`);
  }

  // 2. Lineage: MR-1 and the D19 last-applied check.
  if (round.epoch !== meta.epoch || round.rebaseSeq !== meta.rebaseSeq) {
    return refuse({ ok: false, code: 'LINEAGE', epoch: meta.epoch, rebaseSeq: meta.rebaseSeq }, 'epoch/rebaseSeq differ');
  }
  let lineageUnverified = false;
  if (meta.appliedRawSeq !== null) {
    if (round.lineage.appliedRawSeq !== meta.appliedRawSeq) {
      // The box's view of the last applied round is out of date (e.g. a lost
      // ack): it must run hello, where D19 is checked against its journal.
      return refuse(
        { ok: false, code: 'LINEAGE', epoch: meta.epoch, rebaseSeq: meta.rebaseSeq },
        `round continues seq ${round.lineage.appliedRawSeq}, last applied is ${meta.appliedRawSeq}`,
      );
    }
    if (meta.appliedRawHash === null) {
      lineageUnverified = true;
    } else if (round.lineage.appliedRawHash !== meta.appliedRawHash) {
      return refuse({ ok: false, code: 'FORK' }, 'D19: box chain hash at appliedRawSeq differs from the last applied round', true, 'P1');
    }
    if (round.rawSeqThrough < meta.appliedRawSeq) {
      return refuse({ ok: false, code: 'REGRESS', appliedRawSeq: meta.appliedRawSeq }, `rawSeqThrough ${round.rawSeqThrough} < applied ${meta.appliedRawSeq}`);
    }
    if (round.rawSeqThrough === meta.appliedRawSeq && meta.appliedRawHash !== null && round.rawHashThrough !== meta.appliedRawHash) {
      return refuse({ ok: false, code: 'FORK' }, 'rawHashThrough differs at the last applied seq', true, 'P1');
    }
  } else if (round.lineage.appliedRawSeq !== null) {
    return refuse(
      { ok: false, code: 'LINEAGE', epoch: meta.epoch, rebaseSeq: meta.rebaseSeq },
      'round continues an applied round the cloud has no record of',
    );
  }
  let pendingRawCheck: RawPosition | undefined;
  const cloudHash = opts.rawHashAt ? opts.rawHashAt(round.rawSeqThrough) : undefined;
  if (cloudHash !== undefined) {
    if (cloudHash !== round.rawHashThrough) {
      return refuse({ ok: false, code: 'FORK' }, `raw store holds seq ${round.rawSeqThrough} with another hash`, true, 'P1');
    }
  } else {
    pendingRawCheck = { seq: round.rawSeqThrough, hash: round.rawHashThrough };
  }

  // 3. Pages: in range, exact length, digest of the lines AS RECEIVED.
  const nLines = meta.nLines;
  const fmt = assertFmt(meta.fmt);
  const total = round.totalLines;
  const count = pageCount(total, nLines);
  const seen = new Set<number>();
  const incoming = new Map<number, RoundPage>();
  for (const pg of round.pages) {
    const bad = () => refuse({ ok: false, code: 'BAD_PAGE', p: pg.p }, `page ${pg.p} rejected`, false, 'P2');
    if (pg.p < 1 || pg.p > count || seen.has(pg.p)) return bad();
    seen.add(pg.p);
    const expected = pg.p < count ? nLines : total - (count - 1) * nLines;
    if (pg.lines.length !== expected || !pg.lines.every(line => Array.isArray(line))) return bad();
    if (pageDigest(pg.lines, fmt) !== pg.d) return bad();
    incoming.set(pg.p, pg);
  }

  // 4. Root over (stored ⊕ round); then the shrink guard.
  const digests: Sha256Hex[] = new Array(count);
  for (let p = 1; p <= count; p++) {
    const d = incoming.get(p)?.d ?? meta.digests[p - 1];
    if (d === undefined) {
      return refuse({ ok: false, code: 'ROOT', cloudDigests: [...meta.digests] }, `page ${p} neither stored nor sent`, false, 'P2');
    }
    digests[p - 1] = d;
  }
  if (rootDigest(round.nSesid, total, digests) !== round.root) {
    return refuse({ ok: false, code: 'ROOT', cloudDigests: [...meta.digests] }, 'root over stored ⊕ round differs', false, 'P2');
  }
  let shrink: RoundApplyPlan['shrink'];
  if (total < meta.totalLines) {
    const removed = meta.totalLines - total;
    shrink = { removed, fromTotal: meta.totalLines, toTotal: total };
    const guard = opts.shrinkGuard === undefined ? SHRINK_GUARD : opts.shrinkGuard;
    if (guard && !opts.confirmShrink && (removed > guard.maxLines || removed > guard.maxFraction * meta.totalLines)) {
      return { action: 'hold', removed, fromTotal: meta.totalLines, toTotal: total, alert: 'P1', reason: `drop of ${removed} of ${meta.totalLines} lines` };
    }
  }

  // 5./6. The plan: one synchronous memory swap + one Redis batch (D17), then the meta.
  const droppedPages: number[] = [];
  for (let p = count + 1; p <= meta.digests.length; p++) droppedPages.push(p);
  const pages = [...incoming.values()].sort((a, b) => a.p - b.p);
  const nextMeta: CloudSessionMeta = {
    ...meta,
    appliedRev: round.rev,
    appliedRawSeq: round.rawSeqThrough,
    appliedRawHash: round.rawHashThrough,
    totalLines: total,
    root: round.root,
    digests,
  };
  const plan: RoundApplyPlan = {
    nSesid: round.nSesid,
    rev: round.rev,
    totalLines: total,
    root: round.root,
    pages,
    digests,
    deletePagesAbove: count,
    droppedPages,
    meta: nextMeta,
    ...(pendingRawCheck ? { pendingRawCheck } : {}),
    ...(lineageUnverified ? { lineageUnverified } : {}),
    ...(shrink ? { shrink } : {}),
    ...(shrink && round.shrink?.cause ? { shrinkCause: round.shrink.cause } : {}),
    catchingUp: pages.length > CATCH_UP_ROUND_PAGES,
    reply: { ok: true, appliedRev: round.rev, root: round.root },
  };
  return { action: 'apply', plan };
}

/**
 * A queued (seq, hash) pair once the raw lane has moved (MR-1): 'ok', 'fork'
 * (CRITICAL: freeze the uplink) or still 'pending'.
 */
export function checkPendingRawPair(pair: RawPosition, rawHashAt: (seq: number) => Sha256Hex | undefined): 'ok' | 'fork' | 'pending' {
  const h = rawHashAt(pair.seq);
  if (h === undefined) return 'pending';
  return h === pair.hash ? 'ok' : 'fork';
}

// ===========================================================================
// Cloud side: hello verdict (§5.4, §5.5 MR-3, D19)
// ===========================================================================

export interface HelloContext {
  /** null/undefined = the cloud has no binding for this box and session */
  meta: CloudSessionMeta | null | undefined;
  /** the binding record agrees (nEdgeid, cFeedSource 'E') */
  bound: boolean;
  syncState?: SyncState | null;
  /** the cloud raw store's durable head (seq 0 = nothing) */
  rawAcked: RawPosition;
  /** cloud raw store hash after `seq`, undefined if not held */
  rawHashAt?: (seq: number) => Sha256Hex | undefined;
}

/**
 * The cloud's per-session hello reply. The cloud checks what it can see (the
 * box's head and last round against the last applied round and the raw
 * store); the box completes the D19 / MR-3 checks with boxCheckHelloReply.
 * v1 has no in-session failover (D1): an epoch or rebaseSeq mismatch freezes.
 */
export function helloVerdict(box: EdgeHelloSession, ctx: HelloContext): EdgeHelloReplySession {
  const meta = ctx.meta;
  const rawAcked: RawPosition = ctx.rawAcked ?? { seq: 0, hash: '' };
  if (!meta || !ctx.bound || meta.nSesid !== box.nSesid) {
    return {
      nSesid: box.nSesid,
      verdict: 'unknown',
      epoch: meta?.epoch ?? 0,
      rebaseSeq: meta?.rebaseSeq ?? null,
      appliedRev: 0,
      appliedRawSeq: null,
      appliedRawHash: null,
      totalLines: 0,
      root: '',
      pageDigests: [],
      rawAcked,
    };
  }
  const base = {
    nSesid: box.nSesid,
    epoch: meta.epoch,
    rebaseSeq: meta.rebaseSeq,
    appliedRev: meta.appliedRev,
    appliedRawSeq: meta.appliedRawSeq,
    appliedRawHash: meta.appliedRawHash,
    totalLines: meta.totalLines,
    root: meta.root,
    pageDigests: [...meta.digests],
    rawAcked,
  };
  const verdict = (v: HelloVerdict, recoverFrom?: number): EdgeHelloReplySession =>
    recoverFrom !== undefined ? { ...base, verdict: v, recoverFrom } : { ...base, verdict: v };

  if (ctx.syncState === 'K' || ctx.syncState === 'W' || ctx.syncState === 'F') return verdict('sealed');
  if (meta.frozen) return verdict('frozen');
  if (box.epoch !== meta.epoch || box.rebaseSeq !== meta.rebaseSeq) return verdict('frozen');

  const head = box.raw?.headSeq ?? 0;
  const headHash = box.raw?.headHash;
  if (meta.appliedRawSeq !== null) {
    if (head < meta.appliedRawSeq) return verdict('frozen');
    if (meta.appliedRawHash !== null) {
      if (head === meta.appliedRawSeq && headHash !== meta.appliedRawHash) return verdict('frozen');
      if (box.lastRound && box.lastRound.rawSeqThrough === meta.appliedRawSeq && box.lastRound.rawHashThrough !== meta.appliedRawHash) {
        return verdict('frozen');
      }
    }
  }
  const afterApplied = (meta.appliedRawSeq ?? 0) + 1;
  if (rawAcked.seq > 0) {
    if (head < rawAcked.seq) {
      const cloudAtHead = ctx.rawHashAt?.(head);
      return verdict('recover', cloudAtHead !== undefined && cloudAtHead !== headHash ? afterApplied : head + 1);
    }
    if (head === rawAcked.seq && headHash !== rawAcked.hash) return verdict('recover', afterApplied);
  }
  return verdict(ctx.syncState === 'S' ? 'end' : 'continue');
}

// ===========================================================================
// Cloud side: raw lane sequencing (§5.5 "Raw lane"), header level
// ===========================================================================

export interface RawStoreHead {
  epoch: number;
  ackedSeq: number;
  ackedHash: Sha256Hex;
  /** cloud chain hash after `seq` (≤ ackedSeq), undefined if not held */
  hashAt(seq: number): Sha256Hex | undefined;
}

export type RawAppendDecision =
  /** decode, CRC- and chain-check the batch, append from appendFrom, fsync, then ack */
  | { action: 'append'; appendFrom: number; verifyOverlap?: { fromSeq: number; toSeq: number } }
  /** the whole batch is already durable: verify the overlap, then re-ack the head */
  | { action: 'duplicate'; verifyOverlap: { fromSeq: number; toSeq: number }; ack: RawAck }
  | { action: 'nack'; nack: RawNack };

/**
 * Header-level sequencing of an `e.raw` batch: `fromSeq == ackedSeq+1` with
 * `prevHash == ackedHash`; an overlap (`fromSeq <= ackedSeq`) is trimmed only
 * after it is verified against the cloud's own chain (the caller checks each
 * overlapping record's chain hash with hashAt); a gap or a chain break is
 * nacked with the seq the cloud expects. CRC and per-record chain checks need
 * the record codec (libs/rt-ingest) and are the caller's.
 */
export function planRawAppend(
  batch: { epoch: number; fromSeq: number; toSeq: number; prevHash: Sha256Hex },
  store: RawStoreHead,
): RawAppendDecision {
  const expectSeq = store.ackedSeq + 1;
  if (batch.epoch !== store.epoch) return { action: 'nack', nack: { expectSeq, reason: 'epoch' } };
  if (!Number.isSafeInteger(batch.fromSeq) || !Number.isSafeInteger(batch.toSeq) || batch.fromSeq < 1 || batch.toSeq < batch.fromSeq) {
    return { action: 'nack', nack: { expectSeq, reason: 'gap' } };
  }
  if (batch.fromSeq > expectSeq) return { action: 'nack', nack: { expectSeq, reason: 'gap' } };
  const anchor = batch.fromSeq === expectSeq ? store.ackedHash : store.hashAt(batch.fromSeq - 1);
  if (anchor === undefined || anchor !== batch.prevHash) return { action: 'nack', nack: { expectSeq, reason: 'chain' } };
  if (batch.fromSeq === expectSeq) return { action: 'append', appendFrom: batch.fromSeq };
  const overlap = { fromSeq: batch.fromSeq, toSeq: Math.min(batch.toSeq, store.ackedSeq) };
  if (batch.toSeq <= store.ackedSeq) {
    return { action: 'duplicate', verifyOverlap: overlap, ack: { ackedSeq: store.ackedSeq, ackedHash: store.ackedHash } };
  }
  return { action: 'append', appendFrom: expectSeq, verifyOverlap: overlap };
}

// ===========================================================================
// Cloud side: completeness proof (§5.7)
// ===========================================================================

export interface RecomputedRoot {
  root: Sha256Hex;
  /** index p-1 = page p; undefined for a missing page */
  digests: (Sha256Hex | undefined)[];
  /** pages 1..N absent from the store */
  missingPages: number[];
  /** pages present with the wrong line count */
  badPages: number[];
  /**
   * Stored page numbers outside 1..N (ascending, deduplicated): pages a
   * shrink dropped whose delete failed, or junk. Readers of data/dt_<id>/
   * treat every file there as transcript, so they must be deleted. Only
   * known when `storedPageNumbers` was passed; [] otherwise.
   */
  extraPages: number[];
}

/**
 * Every page number a session's store holds (page_N.json in data/dt_<id>/,
 * Redis page keys, memory). An array or a Set, not a one-shot iterator such
 * as Map#keys(): a re-check with the same context must see the same list.
 */
export type StoredPageNumbers = readonly number[] | ReadonlySet<number>;

/**
 * Recompute the root from the pages actually stored (the seal check and the
 * D18 boot recompute), with the same pure serialization as the box. Missing
 * and wrongly sized pages are reported; the root is then not the box's.
 * With `storedPageNumbers`, pages outside 1..N are reported too (extraPages);
 * they never enter the root.
 */
export function recomputeRoot(
  nSesid: string,
  totalLines: number,
  storedPage: (p: number) => readonly unknown[] | null | undefined,
  opts: { nLines?: number; fmt?: number; storedPageNumbers?: StoredPageNumbers } = {},
): RecomputedRoot {
  const nLines = opts.nLines ?? DEFAULT_LINES_PER_PAGE;
  const fmt = opts.fmt ?? EDGE_FMT;
  const count = pageCount(totalLines, nLines);
  const digests: (Sha256Hex | undefined)[] = new Array(count);
  const missingPages: number[] = [];
  const badPages: number[] = [];
  for (let p = 1; p <= count; p++) {
    const page = storedPage(p);
    if (!Array.isArray(page)) {
      missingPages.push(p);
      digests[p - 1] = undefined;
      continue;
    }
    const expected = p < count ? nLines : totalLines - (count - 1) * nLines;
    if (page.length !== expected) badPages.push(p);
    digests[p - 1] = pageDigest(page, fmt);
  }
  const root = rootDigest(nSesid, totalLines, digests.map(d => d ?? ''));
  return { root, digests, missingPages, badPages, extraPages: pagesOutside(opts.storedPageNumbers, count) };
}

/** Stored page numbers that are not a page 1..count, ascending and unique. */
function pagesOutside(stored: StoredPageNumbers | undefined, count: number): number[] {
  if (!stored) return [];
  const extra = new Set<number>();
  for (const p of stored) if (!(Number.isSafeInteger(p) && p >= 1 && p <= count)) extra.add(p);
  return [...extra].sort((a, b) => a - b);
}

export interface BootManifest {
  /** digests to advertise in hello (index p-1 = page p); '' for a page that is missing */
  pageDigests: Sha256Hex[];
  /** restored pages whose digest differs from the stored meta (stale after a crash between flushes) */
  stalePages: number[];
  missingPages: number[];
  /**
   * restored pages above the session's page count (a shrink's delete that a
   * crash or a failed batch left behind): delete them from memory, Redis and
   * disk before serving the session; they are not transcript
   */
  extraPages: number[];
  /** root over the restored pages */
  root: Sha256Hex;
}

/**
 * D18: on realtime-server boot, recompute a venue session's digests from the
 * pages actually restored (Redis, else disk) instead of trusting the stored
 * meta, which can describe a newer round than a crash between 1 s flushes left
 * behind. Stale and missing pages then differ from the box's digests, so the
 * box's hello diff resends them. The stored meta keeps appliedRev /
 * appliedRawSeq / appliedRawHash as hints; store `pageDigests` as its digests.
 * `storedPageNumbers` = every page number restored, so pages above the count
 * are reported in `extraPages` for deletion.
 */
export function bootDigests(
  meta: CloudSessionMeta,
  storedPage: (p: number) => readonly unknown[] | null | undefined,
  storedPageNumbers: StoredPageNumbers,
): BootManifest {
  const re = recomputeRoot(meta.nSesid, meta.totalLines, storedPage, { nLines: meta.nLines, fmt: meta.fmt, storedPageNumbers });
  const bad = new Set([...re.missingPages, ...re.badPages]);
  const pageDigests = re.digests.map((d, k) => (d === undefined || bad.has(k + 1) ? '' : d));
  const stalePages: number[] = [];
  pageDigests.forEach((d, k) => {
    if (d !== '' && d !== meta.digests[k]) stalePages.push(k + 1);
  });
  for (const p of re.badPages) stalePages.push(p);
  stalePages.sort((a, b) => a - b);
  return { pageDigests, stalePages, missingPages: re.missingPages, extraPages: re.extraPages, root: re.root };
}

/**
 * Box side: the seal fields for a session whose final state the cloud holds,
 * or null while a round is still needed (§4.4 step 6 before step 7).
 *
 * `finalRev` is the rev the cloud APPLIED for this state (the last acked
 * round's rev, or the hello reply's appliedRev), not the cutter's current rev:
 * a hello moves the cutter's rev past appliedRev even when nothing is dirty,
 * and the cloud accepts a seal only if appliedRev == finalRev (§5.7 2).
 * Sign sealSigningPayload(claims) with the device key and send {...claims, sig}.
 */
export function sealClaims(input: {
  source: RoundSource;
  cloud: CloudView;
  appliedRev: number;
  epoch: number;
  rawFinalSeq: number;
  rawFinalHash: Sha256Hex;
  endedAtEdgeMs: number;
  endedBy: string;
  incidents: EdgeIncident[];
}): Omit<EdgeSeal, 'sig'> | null {
  if (needsRound(input.source, input.cloud)) return null;
  return {
    nSesid: input.source.nSesid,
    epoch: input.epoch,
    finalRev: input.appliedRev,
    totalLines: input.source.totalLines,
    root: input.source.root,
    rawFinalSeq: input.rawFinalSeq,
    rawFinalHash: input.rawFinalHash,
    endedAtEdgeMs: input.endedAtEdgeMs,
    endedBy: input.endedBy,
    incidents: input.incidents,
  };
}

/**
 * The exact string the box signs with its device key and the cloud verifies:
 * the seal without `sig`, as JSON with keys sorted at every level.
 */
export function sealSigningPayload(seal: Omit<EdgeSeal, 'sig'> | EdgeSeal): string {
  const { sig: _sig, ...rest } = seal as EdgeSeal;
  return stableStringify(rest);
}

export interface SealContext {
  meta: CloudSessionMeta;
  /** signature over sealSigningPayload verified against RtEdgeNode.cPubKey */
  signatureValid: boolean;
  storedPage: (p: number) => readonly unknown[] | null | undefined;
  /** every page number the store holds (page_N.json in data/dt_<id>/, Redis page keys) */
  storedPageNumbers: StoredPageNumbers;
  rawAcked: RawPosition;
  /** the record at rawFinalSeq in the cloud raw store is SESSION_END */
  finalRecordIsSessionEnd: boolean;
  /** INCIDENT records in the cloud raw store for the lineage */
  rawIncidents: readonly EdgeIncident[];
  /** RtEdgeOrphan rows with cStatus 'P' */
  pendingOrphans: number;
}

export interface SealCheck {
  reply: SealReply;
  /** why the seal was not accepted (empty when complete) */
  reasons: string[];
  /** the recomputed root (for logs and the RtEdgeEvent row) */
  root: Sha256Hex;
  /** warning-level incidents in the signed list */
  warnings: number;
  /**
   * stored pages outside 1..ceil(totalLines/nLines) (a shrink's delete that
   * failed with no later round to retry it): the seal is refused while any
   * exist; delete them, then check again
   */
  extraPages: number[];
}

/**
 * The cloud accepts `e.seal` only if all of §5.7 1–6 hold; the state is 'K'
 * with no warning-level incident and no pending orphan, else 'W'. Otherwise
 * the reply asks for the pages it lacks and the raw it has not acked.
 * §5.7(3) needs the STORE to hold exactly the sealed transcript, so a stored
 * page above the sealed count refuses the seal too; the box cannot fix that,
 * so it is returned in `extraPages` for the caller to delete and re-check.
 */
export function checkSeal(seal: EdgeSeal, ctx: SealContext): SealCheck {
  const { meta } = ctx;
  const reasons: string[] = [];
  if (!ctx.signatureValid) reasons.push('signature does not verify');
  if (meta.appliedRev !== seal.finalRev) reasons.push(`appliedRev ${meta.appliedRev} != finalRev ${seal.finalRev}`);
  if (meta.epoch !== seal.epoch) reasons.push(`epoch ${seal.epoch} is not current (${meta.epoch})`);
  if (meta.frozen) reasons.push('session uplink is frozen');

  const recomputed = recomputeRoot(seal.nSesid, seal.totalLines, ctx.storedPage, {
    nLines: meta.nLines,
    fmt: meta.fmt,
    storedPageNumbers: ctx.storedPageNumbers,
  });
  const needPages = new Set<number>([...recomputed.missingPages, ...recomputed.badPages]);
  if (recomputed.root !== seal.root) {
    reasons.push('root recomputed from stored pages differs');
    recomputed.digests.forEach((d, k) => {
      if (d !== undefined && d !== meta.digests[k]) needPages.add(k + 1);
    });
  }
  const { extraPages } = recomputed;
  if (extraPages.length) reasons.push(`store holds pages beyond the sealed transcript: ${extraPages.join(', ')}`);
  if (meta.totalLines !== seal.totalLines) reasons.push(`totalLines ${meta.totalLines} != sealed ${seal.totalLines}`);

  let rawFrom: number | undefined;
  if (ctx.rawAcked.seq !== seal.rawFinalSeq || ctx.rawAcked.hash !== seal.rawFinalHash) {
    reasons.push(`raw acked ${ctx.rawAcked.seq} does not match rawFinalSeq ${seal.rawFinalSeq}`);
    if (ctx.rawAcked.seq < seal.rawFinalSeq) rawFrom = ctx.rawAcked.seq + 1;
  } else if (!ctx.finalRecordIsSessionEnd) {
    reasons.push('record at rawFinalSeq is not SESSION_END');
  }
  if (!sameIncidents(seal.incidents || [], ctx.rawIncidents || [])) reasons.push('signed incidents differ from the raw store');

  const warnings = (seal.incidents || []).filter(isWarningIncident).length;
  if (reasons.length) {
    const reply: SealReply =
      rawFrom !== undefined
        ? { complete: false, needPages: [...needPages].sort((a, b) => a - b), rawFrom }
        : { complete: false, needPages: [...needPages].sort((a, b) => a - b) };
    return { reply, reasons, root: recomputed.root, warnings, extraPages };
  }
  const state: 'K' | 'W' = warnings === 0 && ctx.pendingOrphans === 0 ? 'K' : 'W';
  return { reply: { complete: true, state }, reasons, root: recomputed.root, warnings, extraPages };
}

function sameIncidents(a: readonly EdgeIncident[], b: readonly EdgeIncident[]): boolean {
  if (a.length !== b.length) return false;
  const ka = a.map(stableStringify).sort();
  const kb = b.map(stableStringify).sort();
  return ka.every((k, i) => k === kb[i]);
}

/** JSON with object keys sorted at every level (undefined members dropped). */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === 'object' && !(value instanceof Uint8Array)) {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as object).sort()) {
      const v = (value as Record<string, unknown>)[k];
      if (v !== undefined) out[k] = sortKeys(v);
    }
    return out;
  }
  return value;
}

// ===========================================================================
// Helpers
// ===========================================================================

/** UTF-8 byte length of a string (lone surrogates count as U+FFFD, 3 bytes). */
export function utf8ByteLength(text: string): number {
  let bytes = 0;
  for (let k = 0; k < text.length; k++) {
    const c = text.charCodeAt(k);
    if (c < 0x80) bytes += 1;
    else if (c < 0x800) bytes += 2;
    else if (c >= 0xd800 && c <= 0xdbff && k + 1 < text.length) {
      const next = text.charCodeAt(k + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        k += 1;
      } else {
        bytes += 3;
      }
    } else bytes += 3;
  }
  return bytes;
}
