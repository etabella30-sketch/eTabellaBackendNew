/**
 * Box ↔ cloud replication protocol on the `/edge` namespace (spec §5.3, §5.4).
 *
 * Wire messages are plain JSON objects sent with `emitWithAck` (15 s timeout);
 * `e.*` events go box → cloud, `c.*` events cloud → box. Every type here is
 * the body of one event or of its ack.
 *
 * Revision 3 scope (D1): in-session failover is Phase 4. The items only used
 * by it are marked `@phase4` and listed in PHASE4_ONLY: REBASE (hello verdict
 * 'rebase', c.assign `rebase`), `e.pagespull`, the switch path
 * (`session/edge/switch`, c.assign `drain`/`fence`, `e.drained`, verdict
 * 'fenced', incident SWITCH_UNDRAINED) and the offline-marks outbox. v1 code
 * must not send them.
 *
 * PURITY: types and constants only; nothing here performs I/O.
 */
import type { CanonicalPage } from './canonical';

// ---------------------------------------------------------------------------
// Versions and limits
// ---------------------------------------------------------------------------

/** Protocol version this build speaks. The cloud accepts N and N-1 (§5.3). */
export const EDGE_PROTO = 1;

/** Oldest protocol version the cloud still accepts (N-1, never below 1). */
export const EDGE_PROTO_MIN_SUPPORTED = Math.max(1, EDGE_PROTO - 1);

/** Page format (serialization) version, pinned per session (§5.2). */
export const EDGE_FMT = 1;

/** Every fmt this build can serialize and verify (digest.ts). */
export const SUPPORTED_FMTS: readonly number[] = Object.freeze([1]);

/** Largest `e.round` / `e.raw` / pull part, in UTF-8 bytes of its JSON (§5.4). */
export const MAX_PART_BYTES = 256 * 1024;

/** Socket.IO maxHttpBufferSize on the shared server (§5.3, RS/main.ts). */
export const MAX_SOCKET_BUFFER_BYTES = 1_000_000;

/** emitWithAck timeout for every request (§5.3). */
export const ACK_TIMEOUT_MS = 15_000;

/** How long the cloud keeps the parts of an incomplete round (§5.5). */
export const ROUND_STAGE_TTL_MS = 60_000;

/** `e.status` period (§5.4). */
export const STATUS_INTERVAL_MS = 5_000;

/** Shrink guard defaults (MR-2, S-D16): hold a round dropping more than this. */
export const SHRINK_GUARD: Readonly<{ maxLines: number; maxFraction: number }> = Object.freeze({ maxLines: 500, maxFraction: 0.05 });

/** A round with more pages than this marks the session `catching-up` (§5.6). */
export const CATCH_UP_ROUND_PAGES = 8;

/** True when the cloud accepts a box speaking `proto` (N or N-1). */
export function cloudSupportsProto(proto: number): boolean {
  return Number.isInteger(proto) && proto >= EDGE_PROTO_MIN_SUPPORTED && proto <= EDGE_PROTO;
}

/**
 * The protocol version both sides speak, or null when there is none. The box
 * offers [protoMin, proto]; the cloud speaks [EDGE_PROTO_MIN_SUPPORTED, EDGE_PROTO].
 * The highest common version wins.
 */
export function negotiateProto(boxProto: number, boxProtoMin: number = boxProto): number | null {
  if (!Number.isInteger(boxProto) || !Number.isInteger(boxProtoMin) || boxProtoMin > boxProto) return null;
  const hi = Math.min(boxProto, EDGE_PROTO);
  const lo = Math.max(boxProtoMin, EDGE_PROTO_MIN_SUPPORTED);
  return hi >= lo ? hi : null;
}

// ---------------------------------------------------------------------------
// Event names
// ---------------------------------------------------------------------------

export const EdgeEvent = Object.freeze({
  hello: 'e.hello',
  round: 'e.round',
  raw: 'e.raw',
  rawpull: 'e.rawpull',
  /** @phase4 REBASE page pull-back (D1). */
  pagespull: 'e.pagespull',
  seal: 'e.seal',
  /** @phase4 reply to a drain (switch, D1). */
  drained: 'e.drained',
  capture: 'e.capture',
  ready: 'e.ready',
  status: 'e.status',
  /** @phase4 offline marks outbox. */
  outbox: 'e.outbox',
  assign: 'c.assign',
  need: 'c.need',
  cmd: 'c.cmd',
} as const);

export type EdgeEventName = (typeof EdgeEvent)[keyof typeof EdgeEvent];

/** Viewer-facing `realtime-events` types the cut broadcast adds (§5.8). */
export const ViewerEventType = Object.freeze({
  feedShrink: 'feed-shrink',
  feedResync: 'feed-resync',
  edgeSessionReady: 'edge-session-ready',
} as const);

/**
 * Everything that exists only with Phase-4 in-session failover (rev 3, D1).
 * v1 code paths must not send or expect these.
 */
export const PHASE4_ONLY = Object.freeze({
  events: Object.freeze([EdgeEvent.pagespull, EdgeEvent.drained, EdgeEvent.outbox] as const),
  helloVerdicts: Object.freeze(['rebase', 'fenced'] as const),
  assignOps: Object.freeze(['drain', 'fence'] as const),
  assignFields: Object.freeze(['rebase'] as const),
  incidents: Object.freeze(['SWITCH_UNDRAINED'] as const),
  restRoutes: Object.freeze(['session/edge/switch'] as const),
  localStates: Object.freeze(['fenced', 'rebasing'] as const),
});

/** True when an event, verdict, assign op or incident kind is Phase-4 only. */
export function isPhase4Only(name: string): boolean {
  return (
    (PHASE4_ONLY.events as readonly string[]).includes(name) ||
    (PHASE4_ONLY.helloVerdicts as readonly string[]).includes(name) ||
    (PHASE4_ONLY.assignOps as readonly string[]).includes(name) ||
    (PHASE4_ONLY.incidents as readonly string[]).includes(name) ||
    (PHASE4_ONLY.restRoutes as readonly string[]).includes(name)
  );
}

// ---------------------------------------------------------------------------
// Shared vocabulary
// ---------------------------------------------------------------------------

/** Lowercase hex sha256. */
export type Sha256Hex = string;

/** `RSessionMaster.cFeedSource` (§4.1). NULL = unknown provenance. */
export type FeedSource = 'D' | 'E' | 'H' | 'W';

/** `RSessionMaster.cSyncState` (§4.1). */
export type SyncState = 'L' | 'S' | 'K' | 'W' | 'F';

/** Edge-local session states (§4.1). 'fenced'/'rebasing' are Phase 4 (D1). */
export type EdgeLocalState =
  | 'assigned'
  | 'armed'
  | 'live'
  | 'ending'
  | 'sealed'
  | 'complete'
  | 'purged'
  | 'recovering'
  | 'frozen'
  /** @phase4 */
  | 'fenced'
  /** @phase4 */
  | 'rebasing';

/** Uplink state reported in e.status (§12). */
export type UplinkState = 'ok' | 'recovering' | 'frozen' | 'rebasing' | 'fenced';

/** Incident kinds that block 'K' (§4.1). SWITCH_UNDRAINED is Phase 4 (D1). */
export const WARNING_INCIDENTS = Object.freeze([
  'ABORTED_WINDOW',
  'DEGRADED_DURABILITY',
  'JOURNAL_CORRUPT',
  'REBASE',
  'REPLAY_DIVERGED',
  'SHRINK_CONFIRMED',
  'AUDIT_MISMATCH',
  'SWITCH_UNDRAINED',
  'CONCURRENT_CAT',
  'CLOCK_UNVERIFIED',
] as const);

/** Info-level incident kinds (§4.1). */
export const INFO_INCIDENTS = Object.freeze(['CAT_DISCONNECT', 'TAIL_TRUNCATED', 'LOCKOUT'] as const);

export type IncidentKind = (typeof WARNING_INCIDENTS)[number] | (typeof INFO_INCIDENTS)[number];
export type IncidentLevel = 'warning' | 'info';

/** An INCIDENT journal record's payload, as listed in the signed seal (§5.1, §5.7). */
export interface EdgeIncident {
  kind: IncidentKind;
  level: IncidentLevel;
  fromSeq?: number;
  toSeq?: number;
  lines?: number;
  note?: string;
}

/** The level a kind has by default (§4.1); unknown kinds count as warnings. */
export function incidentLevel(kind: string): IncidentLevel {
  return (INFO_INCIDENTS as readonly string[]).includes(kind) ? 'info' : 'warning';
}

/** True when an incident blocks 'K' (its level, or its kind's level when absent). */
export function isWarningIncident(incident: Pick<EdgeIncident, 'kind'> & { level?: string }): boolean {
  return (incident.level ?? incidentLevel(incident.kind)) !== 'info';
}

/** A raw-journal position: record seq and the chain hash after it (§5.1). */
export interface RawPosition {
  seq: number;
  hash: Sha256Hex;
}

/** Severity the cloud raises with a refusal (§12 "Alerts"). */
export type AlertTier = 'P1' | 'P2';

// ---------------------------------------------------------------------------
// e.hello (§5.4, §5.5 resume)
// ---------------------------------------------------------------------------

export interface EdgeHelloSession {
  nSesid: string;
  epoch: number;
  /** seq of the current lineage's REBASE_BEGIN; null = genesis */
  rebaseSeq: number | null;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  /** the box's raw journal head */
  raw: { headSeq: number; headHash: Sha256Hex };
  /** the last round the box sent (applied or not); null before the first */
  lastRound: { rawSeqThrough: number; rawHashThrough: Sha256Hex } | null;
  state: EdgeLocalState;
  incidents: EdgeIncident[];
}

export interface EdgeHello {
  proto: number;
  protoMin: number;
  fmt: number;
  /** box software version */
  sw: string;
  parserVer: string;
  bootId: string;
  sessions: EdgeHelloSession[];
}

/**
 * Per-session hello verdict. 'frozen' (rev 3, D19): the box's chain hash at
 * appliedRawSeq differs from appliedRawHash; it pushes nothing and an admin
 * splits (D7). 'end' also ends a split Part 1 (D7).
 */
export type HelloVerdict =
  | 'continue'
  | 'recover'
  | 'frozen'
  /** @phase4 */
  | 'rebase'
  /** @phase4 */
  | 'fenced'
  | 'unknown'
  | 'end'
  | 'sealed';

/** @phase4 REBASE base the box starts its new lineage from (§4.5.1). */
export interface RebaseAssignment {
  epoch: number;
  baseSeq: number;
  baseHash: Sha256Hex;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  anchorIds: number[];
}

export interface EdgeHelloReplySession {
  nSesid: string;
  verdict: HelloVerdict;
  epoch: number;
  rebaseSeq: number | null;
  /** 0 before the first applied round */
  appliedRev: number;
  /** rawSeqThrough of the last applied round; null before the first (D19) */
  appliedRawSeq: number | null;
  /** chain hash at appliedRawSeq of the last applied round; null before the first (D19) */
  appliedRawHash: Sha256Hex | null;
  totalLines: number;
  root: Sha256Hex;
  /** the cloud's page digests, index p-1 = page p (recomputed at boot, D18) */
  pageDigests: Sha256Hex[];
  /** the cloud raw store's durable head; seq 0 = nothing acked */
  rawAcked: RawPosition;
  /** first seq the box must pull back (verdict 'recover') */
  recoverFrom?: number;
  /** @phase4 */
  fenceSeq?: number;
  /** @phase4 */
  rebase?: RebaseAssignment;
}

export interface EdgeLimits {
  /** uplink budget, bytes/s (default 1 MB/s, §5.6) */
  edgeBps: number;
  /** raw lane floor, bytes/s (default 32 KB/s) */
  rawMinBps: number;
  /** largest part, bytes (default MAX_PART_BYTES) */
  maxPart: number;
}

export interface EdgeRevocations {
  users: string[];
  jtis: string[];
  since: number;
}

export interface EdgeHelloReply {
  serverNowMs: number;
  /** cloud ES256 public keys for edge-token verification */
  edgeTokenKeys: Array<Record<string, unknown>>;
  limits: EdgeLimits;
  sessions: EdgeHelloReplySession[];
  assignments: AssignedSession[];
  revocations: EdgeRevocations;
}

/** Connection-level refusals (§5.3). UPGRADE only for revoked versions. */
export type ConnectionRefusal = 'DUP_IDENTITY' | 'QUARANTINED' | 'UPGRADE';

// ---------------------------------------------------------------------------
// e.round (§5.2, §5.4, §5.5)
// ---------------------------------------------------------------------------

export interface RoundPage {
  p: number;
  d: Sha256Hex;
  lines: CanonicalPage;
}

/**
 * The cloud's last applied position as the box sees it: appliedRawSeq from
 * the cloud, appliedRawHash = the box's OWN chain hash at that seq (D19).
 * Both null before the first applied round.
 */
export interface RoundLineage {
  appliedRawSeq: number | null;
  appliedRawHash: Sha256Hex | null;
}

export interface RoundShrink {
  lines: number;
  cause?: string;
}

/** One part of a round (≤ MAX_PART_BYTES). `part` is 1-based. */
export interface EdgeRound {
  nSesid: string;
  epoch: number;
  rebaseSeq: number | null;
  lineage: RoundLineage;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  rawSeqThrough: number;
  rawHashThrough: Sha256Hex;
  shrink?: RoundShrink;
  part: number;
  parts: number;
  pages: RoundPage[];
}

export type RoundReplyCode =
  | 'STALE'
  | 'ROOT'
  | 'BAD_PAGE'
  | 'FENCED'
  | 'NOT_BOUND'
  | 'BUSY'
  | 'LINEAGE'
  | 'REGRESS'
  | 'FORK'
  | 'HELD_SHRINK';

export type RoundReplyOk = { ok: true; appliedRev: number; root: Sha256Hex };

/** Ack of a part that completed nothing yet (more parts expected). */
export type RoundReplyPartial = { ok: true; partial: true; have: number; parts: number };

export type RoundReplyRefusal =
  /** rev ≤ appliedRev; harmless */
  | { ok: false; code: 'STALE'; appliedRev: number; root: Sha256Hex }
  /** root over (stored ⊕ round) differs; nothing applied */
  | { ok: false; code: 'ROOT'; cloudDigests: Sha256Hex[] }
  | { ok: false; code: 'BAD_PAGE'; p: number }
  | { ok: false; code: 'FENCED' }
  | { ok: false; code: 'NOT_BOUND' }
  | { ok: false; code: 'BUSY'; retryMs: number }
  | { ok: false; code: 'LINEAGE'; epoch: number; rebaseSeq: number | null }
  /** edge enters RECOVER */
  | { ok: false; code: 'REGRESS'; appliedRawSeq: number }
  /** CRITICAL; also the D19 last-applied mismatch: nothing applied, uplink frozen */
  | { ok: false; code: 'FORK' }
  | { ok: false; code: 'HELD_SHRINK'; heldId: string };

export type RoundReply = RoundReplyOk | RoundReplyPartial | RoundReplyRefusal;

// ---------------------------------------------------------------------------
// Raw lane (§5.4, §5.5)
// ---------------------------------------------------------------------------

/** Encoded journal records [fromSeq..toSeq] (≤ 256 KB). epoch is envelope only. */
export interface EdgeRaw {
  nSesid: string;
  epoch: number;
  fromSeq: number;
  toSeq: number;
  /** chain hash at fromSeq-1 */
  prevHash: Sha256Hex;
  recs: Uint8Array;
}

export interface RawAck {
  ackedSeq: number;
  ackedHash: Sha256Hex;
}

export type RawNackReason = 'gap' | 'crc' | 'chain' | 'epoch' | 'rate';

export interface RawNack {
  expectSeq: number;
  reason: RawNackReason;
  retryAfterMs?: number;
}

export type RawReply = RawAck | RawNack;

/** RECOVER pull-back of raw records from the cloud store. */
export interface EdgeRawPull {
  nSesid: string;
  fromSeq: number;
  toSeq: number;
}

export interface EdgeRawPullReply {
  recs: Uint8Array;
  toSeq: number;
  hash: Sha256Hex;
}

/** @phase4 REBASE page pull-back (D1). */
export interface EdgePagesPull {
  nSesid: string;
  part?: number;
}

/** @phase4 */
export interface EdgePagesPullReply {
  epoch: number;
  baseSeq: number;
  baseHash: Sha256Hex;
  rev: number;
  totalLines: number;
  root: Sha256Hex;
  anchorIds: number[];
  part: number;
  parts: number;
  pages: RoundPage[];
}

// ---------------------------------------------------------------------------
// e.seal (§4.4, §5.7)
// ---------------------------------------------------------------------------

export interface EdgeSeal {
  nSesid: string;
  epoch: number;
  finalRev: number;
  totalLines: number;
  root: Sha256Hex;
  rawFinalSeq: number;
  rawFinalHash: Sha256Hex;
  endedAtEdgeMs: number;
  endedBy: string;
  incidents: EdgeIncident[];
  /** device-key (P-256) signature over sealSigningPayload(seal) (round.ts) */
  sig: string;
}

export type SealReply =
  | { complete: true; state: 'K' | 'W' }
  | { complete: false; needPages: number[]; rawFrom?: number };

/** @phase4 reply to c.assign{op:'drain'} (switch, D1). */
export interface EdgeDrained {
  nSesid: string;
  rawSeqThrough: number;
  rawHash: Sha256Hex;
  root: Sha256Hex;
}

// ---------------------------------------------------------------------------
// Captures, readiness, status
// ---------------------------------------------------------------------------

/** A held second CAT connection on the box (orphan kind 'C'). Kind 'U' removed (D3, D27). */
export interface EdgeCapture {
  kind: 'C';
  nSesid: string;
  user: string;
  peer: string;
  fromMs: number;
  toMs: number;
  bytes: number;
  sha256: Sha256Hex;
}

export interface EdgeCaptureReply {
  ok: boolean;
  nOrphanid?: string;
}

/** Route armed (after any REBASE checkpoint). */
export interface EdgeReady {
  nSesid: string;
}

export interface EdgeStatusSession {
  nSesid: string;
  transmitterMode?: 'listen' | 'dial';
  catConnected?: boolean;
  catPeer?: string | null;
  heldPeers?: string[];
  lockout?: boolean;
  lastCatByteAgeMs?: number | null;
  bytesIn?: number;
  lastLineAtMs?: number | null;
  rev?: number;
  totalLines?: number;
  cloudAppliedRev?: number;
  dirtyPages?: number;
  lagLines?: number;
  lagBytes?: number;
  lagSec?: number;
  uplinkState?: UplinkState;
  lastCloudSyncMs?: number | null;
  /** @phase4 */
  outboxPending?: number;
  durability?: 'ok' | 'degraded';
  incidents?: number;
  lanViewers?: number;
  parseErrors?: number;
  lastAuditOk?: boolean;
  [key: string]: unknown;
}

/** e.status, every STATUS_INTERVAL_MS (§12 "Signals"). */
export interface EdgeStatus {
  sessions: EdgeStatusSession[];
  device: {
    diskFreeMB?: number;
    journalBytes?: number;
    captureBytes?: number;
    clockOffsetMs?: number;
    chronySynced?: boolean;
    certDaysLeft?: number;
    upsOnBattery?: boolean;
    sw?: string;
    parserVer?: string;
    uptime?: number;
    egressIp?: string;
    [key: string]: unknown;
  };
}

/** @phase4 offline marks outbox item (afterRev, cClientId idempotency). */
export interface EdgeOutboxItem {
  opId: string;
  kind: string;
  nUserid: string;
  nSesid: string;
  afterRev: number;
  authRef: { jti: string; mintedBy?: string };
  payload: Record<string, unknown>;
}

/** @phase4 */
export interface EdgeOutbox {
  items: EdgeOutboxItem[];
}

/** @phase4 */
export interface EdgeOutboxItemReply {
  status: 'applied' | 'duplicate' | 'rejected';
  cloudId?: string;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Cloud → box
// ---------------------------------------------------------------------------

/** A session pushed to (and pulled by) the box (§4.2 "Delivery to the edge"). No plaintext, no passwordEnc. */
export interface AssignedSession {
  nSesid: string;
  nCaseid: string;
  cName: string;
  dStartDt: string;
  /** resolved IANA zone, pinned */
  tz: string;
  nLines: number;
  epoch: number;
  rebaseSeq: number | null;
  parserVer: string;
  fmt: number;
  route: { user: string; salt: string; hash: string; scryptN: number };
  team: Array<{ nUserid: string; isCaseAdmin: boolean }>;
  /** nUserid of the case admin who may split or unlock */
  hearingOperator: string | null;
  case: { cCaseno: string; cName: string };
}

export type CAssign =
  | { op: 'upsert'; session: AssignedSession; /** @phase4 */ rebase?: RebaseAssignment }
  /** also ends a split Part 1 on the box's next hello (D7) */
  | { op: 'end'; nSesid: string }
  /** @phase4 */
  | { op: 'drain'; nSesid: string }
  /** @phase4 */
  | { op: 'fence'; nSesid: string; epoch: number; fenceSeq: number }
  | { op: 'revoke-user'; nUserid: string; jtis?: string[] }
  | { op: 'purge'; nSesid: string }
  | { op: 'quarantine' };

export type CAssignOp = CAssign['op'];

/** The cloud detected loss. */
export interface CNeed {
  nSesid: string;
  pages?: number[];
  rawFrom?: number;
}

/** Restricted signed support command; v1 or Phase 5 is open (O-2). Not a shell. */
export interface CCmd {
  op: 'status-dump' | 'log-bundle' | 'restart' | 'apply-update' | 'rotate-cert' | 'unlock-cat' | 'release-held';
  jobId: string;
  sig: string;
}

export interface CCmdReply {
  ok: boolean;
  artefactUrl?: string;
}

/** Generic `{ok}` ack (c.assign, c.need, e.ready, e.drained). */
export interface OkReply {
  ok: boolean;
}
