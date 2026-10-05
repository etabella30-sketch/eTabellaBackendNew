/**
 * StatePort (token STATE_PORT, module state/): the box's durable state in ONE node:sqlite database
 * (`BoxConfig.paths.stateDb`, `edge.sqlite`, spec §3.2 `state`, §4.10). Raw journals and held-capture bytes stay in
 * files (`journalDir`, `captureDir`); this database holds everything else.
 *
 * Rules every repository below follows (the implementer of state/ guarantees them; callers rely on them):
 * - node:sqlite `DatabaseSync` (Node ≥ 22.5) opened with `PRAGMA journal_mode=WAL`, `synchronous=NORMAL`,
 *   `foreign_keys=ON`, `busy_timeout=5000`. The same connection is shared with rt-ingest's `SqliteCheckpointStore`
 *   (`checkpoints`), which raises `synchronous` to FULL around its own writes.
 * - Every method is SYNCHRONOUS (except `checkpoints.*` and `close`, which follow rt-ingest's async interface).
 *   Each write method is atomic on its own (one transaction); `transaction(fn)` groups several.
 * - Times are epoch ms (UTC) unless a name says `Sec`; days are `YYYY-MM-DD` in `BoxConfig.box.timeZone`
 *   (ports/time.ts `boxDay`).
 * - Returned records are plain frozen objects (never live rows); arrays are new arrays.
 * - The state module NEVER publishes bus events: the caller that wrote publishes (e.g. the uplink publishes
 *   `assignments-changed` with the diff `assignments.replaceAll` returned).
 * - Nothing here ever stores a password, a code value, a token, or transcript text (room codes and the operator code
 *   are stored as hashes only; audit rows carry outcomes, never values).
 * - Error codes: a write that names an unknown or purged session throws `EdgePortError('session_not_found')`;
 *   an unknown row id throws `EdgePortError('not_found')`; a malformed argument throws
 *   `EdgePortError('invalid_request')`. SQLite I/O failures propagate as plain Errors (callers treat them as
 *   internal failures; the kernel's ingest never depends on this database being writable).
 * - `schemaVersion` is stored in `PRAGMA user_version`; migrations run inside the provider factory before the
 *   port is handed out, so a resolved StatePort is always migrated. A database the factory cannot open or migrate
 *   (unreadable or corrupt file, a schema newer than this build) makes it throw `EdgeStateUnavailableError`
 *   (ports/boot.ts): the module graph is not built and the box does not start (fatal boot condition 2; exit 70 in
 *   'serve' and 'cli' run mode alike). There is no automatic rebuild in this wave.
 */
import type { CatProtocol, CheckpointStore } from '@app/rt-ingest';
import type { EdgeIncident, EdgeLocalState, EdgeRevocations } from '@app/edge-sync';
import { EDGE_BOX_CLOCK_SKEW_SEC, EDGE_RENEWAL_CEILING_SEC } from '@app/edge-token/constants';

import type {
    ConnectivityLogClearResult,
    ConnectivityLogData,
    ConnectivityLogEvent,
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogRow,
    ConnectivityLogSource,
    ConnectivityLogCode,
    ConnectivityLogTriesPage,
    EdgeActor,
    EdgeLinkFailure,
    EdgePersonRef,
    RoomCodeStatus,
    TransmitterApplied,
    TransmitterSettings,
} from '../contracts';
import { isIpv4, isSerialPortName, TRANSMITTER_BAUD_RATES } from '../contracts/transmitter';
import type { Reply } from './common';

// ---------------------------------------------------------------------------------------------------------------
// Assignments: what the cloud delivered (hello reply + c.assign; spec §4.2, §5.4; et_rtedge_assignments r1–r5)
// ---------------------------------------------------------------------------------------------------------------

/** A case assigned to this box (`RtEdgeCase`; assignments r2). */
export interface BoxCaseRecord {
    readonly nCaseid: string;
    /** Same names as the cloud dashboard's case rows. */
    readonly cCasename: string;
    readonly cCaseno: string;
    readonly assignedAtMs: number | null;
}

/** A person as the cached roster knows them. */
export interface BoxPersonRecord {
    readonly nUserid: string;
    /** Full display name ("Daniel Okafor"). */
    readonly name: string;
    /** Null when the cloud did not deliver it (CONTRACTS.md §12.3 open item). */
    readonly email: string | null;
}

/**
 * One roster row (assignments r4, mirroring the cloud's `SESSION_ACCESS_SQL`): a case-team member (`source:'team'`,
 * `nSesid: null`) or a session assignee (`source:'session'`, `nSesid` set).
 */
export interface BoxRosterMember extends BoxPersonRecord {
    readonly nCaseid: string;
    readonly nSesid: string | null;
    /** "Counsel", "Paralegal"; null when the roster has none. */
    readonly role: string | null;
    readonly isCaseAdmin: boolean;
    /** `cUserStatus` is active. Inactive members are kept (for names in history) but grant nothing. */
    readonly active: boolean;
    readonly source: 'team' | 'session';
}

/** The Eclipse route of a session as delivered (never a password, never `passwordEnc`). Listen mode only. */
export interface BoxRouteCredential {
    readonly user: string;
    /** base64 scrypt salt and hash, as the cloud route file writes them. */
    readonly salt: string;
    readonly hash: string;
    readonly scryptN: number;
}

/** Where a split hearing continues (D7): Part 2's id as the cloud delivered it (r3 `nNextPartSesid`). */
export interface BoxNextPart {
    readonly nSesid: string;
    readonly nPartNo: number;
    /** Null when the cloud did not say when (the LAN shows the pointer without a time). */
    readonly splitAtMs: number | null;
}

/**
 * The reporter machine a session's feed comes from, typed by the admin in the cloud's "Start realtime session" dialog
 * (r3 `cReporterIp` / `nReporterPort`). Eclipse there is set to "Wait for connection": the box dials it.
 */
export interface BoxReporterTcp {
    /** IPv4 dotted quad on the transmitter network ("192.168.1.20"). */
    readonly host: string;
    /** 1–65535. */
    readonly port: number;
}

/**
 * A COM port of the box the session's feed comes in on, chosen in the same dialog (r3 `cReporterSerial` /
 * `nReporterBaud`). The CAT program writes its realtime output to a serial cable or virtual COM pair; the box reads it.
 */
export interface BoxReporterSerial {
    /** "COM3" (or a /dev path on a box that is not Windows). */
    readonly serialPath: string;
    /** One of TRANSMITTER_BAUD_RATES. */
    readonly baudRate: number;
}

/** Where the box gets a session's feed when the cloud set it: a reporter address to dial, or a COM port to read. */
export type BoxReporterAddress = BoxReporterTcp | BoxReporterSerial;

export function isSerialReporter(r: BoxReporterAddress | null | undefined): r is BoxReporterSerial {
    return !!r && typeof (r as BoxReporterSerial).serialPath === 'string';
}

/** "192.168.1.20:5555" or "COM3 @ 9600" (logs, alerts, the box console). */
export function reporterLabel(r: BoxReporterAddress): string {
    return isSerialReporter(r) ? `${r.serialPath} @ ${r.baudRate}` : `${r.host}:${r.port}`;
}

/**
 * A usable reporter connection, else null: an IPv4 address with a port 1–65535, or a COM port with a listed baud
 * rate (a delivery carrying both kinds is read as the COM port). The box never dials or opens anything else.
 * `serialPath` / `baudRate` and `host` / `port` are read from the wire object or the stored assignment alike.
 */
export function normalizeBoxReporter(raw: { readonly host?: unknown; readonly port?: unknown; readonly serialPath?: unknown; readonly baudRate?: unknown } | null | undefined): BoxReporterAddress | null {
    if (!raw || typeof raw !== 'object') return null;
    const path = typeof raw.serialPath === 'string' ? raw.serialPath.trim() : '';
    const baud = typeof raw.baudRate === 'number' ? raw.baudRate : Number(raw.baudRate);
    if (path && isSerialPortName(path) && TRANSMITTER_BAUD_RATES.includes(baud)) {
        return { serialPath: /^com\d+$/i.test(path) ? path.toUpperCase() : path, baudRate: baud };
    }
    const host = typeof raw.host === 'string' ? raw.host.trim() : '';
    const port = typeof raw.port === 'number' ? raw.port : Number(raw.port);
    if (host && isIpv4(host) && Number.isInteger(port) && port >= 1 && port <= 65535) return { host, port };
    return null;
}

/** One session bound to this box, as the cloud delivered it (assignments r3 + route). */
export interface BoxSessionAssignment {
    readonly nSesid: string;
    readonly nCaseid: string;
    /** "Day 3 — Morning" */
    readonly cName: string;
    /** Wall-clock string in `tz`, no offset, as the cloud stores it; null when the session has no start. */
    readonly dStartDt: string | null;
    /** Pinned IANA zone (`cTimezone`). */
    readonly tz: string;
    /** Lines per page (25). */
    readonly nLines: number;
    /** `cProtocol` when the cloud pinned one; null = decided from the first bytes (listen) or the dial setting. */
    readonly protocol: CatProtocol | null;
    /** `nIngestEpoch`. */
    readonly epoch: number;
    readonly rebaseSeq: number | null;
    /** `cParserVer` the session is pinned to (DET-10); the kernel refuses to arm under another parser. */
    readonly parserVer: string;
    /** Page format pinned per session (`EDGE_FMT`). */
    readonly fmt: number;
    /** Listen-mode login; null when the cloud sent none (dial-only session). */
    readonly route: BoxRouteCredential | null;
    /** The case admin who may split or unlock (`nHearingOpid`). */
    readonly hearingOperator: EdgePersonRef | null;
    /** 1 unless the hearing was split (D7). */
    readonly nPartNo: number;
    readonly nPrevPartSesid: string | null;
    readonly next: BoxNextPart | null;
    /** `cOp`: 'end' = the cloud asked the box to end (drain, SESSION_END, seal; spec §4.4); also a split Part 1. */
    readonly cloudOp: 'upsert' | 'end';
    /** Soft-deleted in the cloud: still drained and sealed, never shown on the dashboard. */
    readonly deleted: boolean;
    /**
     * Where the box gets this session's feed: a reporter address to dial or a COM port to read; null = the cloud set
     * none (the reporter's Eclipse connects to the box and logs in with `route`, as before). The kernel applies it by
     * itself (kernel.port.ts `CloudReporterStatus`). A session stored before this field existed reads null.
     */
    readonly reporter: BoxReporterAddress | null;
}

/** The day's operator-code hash as delivered with the assignments or stored by the relay (DR7, O-10). */
export interface OperatorCodeDelivery {
    /** Box-local day the code is valid for. */
    readonly day: string;
    /** scrypt over the normalized code (`normalizeOperatorCode`, e.g. `OPR6Z3K91`), like the Eclipse route. */
    readonly alg: 'scrypt';
    /** base64 */
    readonly salt: string;
    /** base64, 32 bytes */
    readonly hash: string;
    readonly scryptN: number;
    readonly issuedAtMs: number;
    /** The case admin who minted it; the operator session's authority is that admin's box cases (O-10). */
    readonly mintedBy: EdgePersonRef;
}

/** One full assignment pull (hello reply or `rtedge_assignments`), normalized by the uplink. */
export interface BoxAssignmentSnapshot {
    readonly cases: readonly BoxCaseRecord[];
    readonly sessions: readonly BoxSessionAssignment[];
    readonly roster: readonly BoxRosterMember[];
    /** Global admins (r5): super-admins for O-11. */
    readonly superAdmins: readonly BoxPersonRecord[];
    /** Today's operator-code hash if the cloud delivered one; null = leave the stored one unchanged. */
    readonly operatorCode: OperatorCodeDelivery | null;
}

/** What a write to the assignments changed (ids, ascending). The writer publishes it as `assignments-changed`. */
export interface AssignmentsDiff {
    readonly atMs: number;
    /** true for `replaceAll`, false for a single `c.assign` op. */
    readonly full: boolean;
    readonly sessionsAdded: readonly string[];
    readonly sessionsUpdated: readonly string[];
    /**
     * `cloudOp` BECAME 'end' in this write (or the session was listed as ended for the first time). Transitions only:
     * a session already stored with `cloudOp:'end'` is not listed again by a later pull, so after a restart the
     * kernel finds unfinished ends itself (`sessionEndPending`, ports/kernel.port.ts).
     */
    readonly sessionsEndRequested: readonly string[];
    /** Present before, absent from this full snapshot (kept: unlisted sessions are never deleted by a pull). */
    readonly sessionsUnlisted: readonly string[];
    readonly sessionsPurged: readonly string[];
    readonly casesAdded: readonly string[];
    readonly casesRemoved: readonly string[];
    readonly rosterChanged: boolean;
    readonly operatorCodeChanged: boolean;
}

// ---------------------------------------------------------------------------------------------------------------
// Sessions: assignment + box-local progress
// ---------------------------------------------------------------------------------------------------------------

/** Box-local fields of a session, written by the kernel and the uplink. */
export interface BoxSessionLocal {
    /** Spec §4.1 edge-local state (`purged` = tombstone kept after purge, §10 #19). */
    readonly localState: EdgeLocalState;
    /** Present in the latest full snapshot. */
    readonly listed: boolean;
    readonly assignedAtMs: number;
    readonly updatedAtMs: number;
    /** First parsed line (kept across restarts for "started 10:02"). */
    readonly firstLineAtMs: number | null;
    /** When the box learnt of the cloud's end request. */
    readonly endRequestedAtMs: number | null;
    /** SESSION_END journaled. */
    readonly endedAtMs: number | null;
    /** The cloud answered the seal (`SealReply.complete`). */
    readonly sealedAtMs: number | null;
    readonly sealState: 'K' | 'W' | null;
    readonly purgedAtMs: number | null;
}

export type BoxSessionRecord = BoxSessionAssignment & BoxSessionLocal;

/** The local fields the kernel/uplink may set (the assignment fields come only from the cloud). */
export type BoxSessionLocalPatch = Partial<Omit<BoxSessionLocal, 'assignedAtMs' | 'updatedAtMs' | 'listed'>>;

export interface SessionsRepo {
    /** Null when unknown; a purged session comes back as its tombstone (`localState:'purged'`). */
    get(nSesid: string): BoxSessionRecord | null;
    /** Every session, oldest start first (null starts last), then by nSesid. Tombstones only when asked. */
    list(opts?: { includePurged?: boolean }): readonly BoxSessionRecord[];
    /** The case's sessions, same order, never tombstones. */
    forCase(nCaseid: string): readonly BoxSessionRecord[];
    /**
     * Insert or update one session from a `c.assign {op:'upsert'}` (no roster change). A new session starts with
     * `localState:'assigned'`, `listed:true`. Never changes local fields, except: `cloudOp` 'end' sets
     * `endRequestedAtMs` once. A purged session is NOT resurrected (returns 'unchanged').
     */
    upsertAssignment(assignment: BoxSessionAssignment, atMs: number): 'added' | 'updated' | 'unchanged';
    /** `c.assign {op:'end'}`: sets `cloudOp:'end'` and `endRequestedAtMs` (first time only). Idempotent. Throws session_not_found. */
    requestEnd(nSesid: string, atMs: number): BoxSessionRecord;
    /** Patch box-local fields; `updatedAtMs` = atMs. Throws session_not_found (also for a purged session). */
    setLocal(nSesid: string, patch: BoxSessionLocalPatch, atMs: number): BoxSessionRecord;
    /**
     * Purge (§10 #19): deletes the session's room codes, incidents and uploaded held-capture rows in one transaction
     * and keeps a tombstone (`localState:'purged'`, `purgedAtMs`). The caller (ops retention) checked the purge
     * conditions and deletes the journal and capture files. Idempotent. Throws session_not_found when unknown.
     */
    purge(nSesid: string, atMs: number): BoxSessionRecord;
}

export interface AssignmentsRepo {
    /**
     * Apply a full pull atomically: upsert every session (as `upsertAssignment`), mark sessions absent from it
     * `listed:false` (never delete them), replace cases, roster and super-admins wholesale, store `operatorCode` when
     * not null, and set `syncedAtMs = atMs`. Returns what changed.
     */
    replaceAll(snapshot: BoxAssignmentSnapshot, atMs: number): AssignmentsDiff;
    /** A pull that changed nothing still proves freshness ("assignments synced at"). */
    markSynced(atMs: number): void;
    /** Last successful pull or push; null = never (DR15 `not-on-box-yet`). */
    syncedAtMs(): number | null;
    /** Cases assigned to the box, by `cCasename`. */
    cases(): readonly BoxCaseRecord[];
    case(nCaseid: string): BoxCaseRecord | null;
}

export interface RosterRepo {
    /** The case's team + session assignees, by name. */
    forCase(nCaseid: string): readonly BoxRosterMember[];
    /** Who may open session `nSesid`: active team rows of its case ∪ its active session-assignee rows, by name. */
    forSession(nSesid: string): readonly BoxRosterMember[];
    /** Every active row of one user (their box cases and roles). */
    forUser(nUserid: string): readonly BoxRosterMember[];
    /** Name/email of anyone in the roster or the super-admin list; null when unknown. */
    person(nUserid: string): BoxPersonRecord | null;
    superAdmins(): readonly BoxPersonRecord[];
    isSuperAdmin(nUserid: string): boolean;
    /** "Case team lists stored · 14 people" (readiness `team-lists`): distinct active people and cases with a roster. */
    counts(): { readonly people: number; readonly cases: number };
}

// ---------------------------------------------------------------------------------------------------------------
// Revocations and the sign-out denylist (spec §8.4 "Revocation", CONTRACTS.md §6.6)
// ---------------------------------------------------------------------------------------------------------------

export type JtiRevocationReason = 'cloud' | 'sign-out' | 'room-access-ended' | 'replaced';

/**
 * How long a revocation row is kept after it arrives: no edge token outlives `auth_time + 24 h` (D24), plus the box
 * clock skew. Same as libs/edge-token `EdgeRevocationList`'s default retention.
 */
export const EDGE_REVOCATION_RETAIN_MS = (EDGE_RENEWAL_CEILING_SEC + EDGE_BOX_CLOCK_SKEW_SEC) * 1000;

/**
 * The per-user cut-off a user revocation received at `receivedAtMs` (BOX clock) sets: arrival + the box clock skew
 * (5 min), never earlier than a previous cut-off. This is libs/edge-token `EdgeRevocationList.applyCloud`'s rule, in
 * ms. It must NOT be the cloud's `since`: authapi's `since` is the read time minus 60 s (`EDGE_REVOCATION_OVERLAP_MS`),
 * so a token issued between `since` and the revocation would pass, and an offline box would honour it for up to 12 h.
 * The cost (safe direction): a reinstated user who signs in again within those minutes signs in once more.
 */
export function userRevocationCutoffMs(receivedAtMs: number, previousCutoffMs: number | null = null): number {
    if (!Number.isFinite(receivedAtMs) || receivedAtMs < 0) throw new RangeError('rt-edge: receivedAtMs must be an epoch ms time');
    const cutoff = Math.floor(receivedAtMs) + EDGE_BOX_CLOCK_SKEW_SEC * 1000;
    return previousCutoffMs != null && previousCutoffMs > cutoff ? previousCutoffMs : cutoff;
}

/** A token issued at `iatSec` (JWT `iat`, epoch SECONDS) is revoked by a user cut-off when `iatSec * 1000 <= cutoffMs`. */
export function isRevokedByUserCutoff(iatSec: number, cutoffMs: number | null): boolean {
    return cutoffMs != null && Number.isFinite(iatSec) && iatSec * 1000 <= cutoffMs;
}

/**
 * The cloud revocation list and the box's own denylist. Equivalent to libs/edge-token `EdgeRevocationList` (the auth
 * module may keep one in memory, built from these rows, for `verifyEdgeBearer`); every time below is BOX clock.
 */
export interface RevocationsRepo {
    /**
     * Store a cloud list (hello reply, 60 s pull) received at `receivedAtMs`: every jti is denied until
     * `receivedAtMs + EDGE_REVOCATION_RETAIN_MS` (a later `untilMs` already stored wins); every listed user gets the
     * cut-off `userRevocationCutoffMs(receivedAtMs, previous)` (NOT `rev.since`, see that function), kept until
     * cut-off + EDGE_REVOCATION_RETAIN_MS. `rev.since` is stored only as the cursor of the next pull. Malformed
     * entries are skipped. Returns the jtis / users not listed before, so the caller can publish `access-revoked`
     * and the LAN can disconnect those sockets.
     */
    applyCloud(rev: EdgeRevocations, receivedAtMs: number): { readonly newJtis: readonly string[]; readonly newUsers: readonly string[] };
    /** `since` of the last applied cloud list (the cursor); 0 = never. The next pull asks from here. */
    cloudSince(): number;
    /**
     * `c.assign {op:'revoke-user'}` received at `receivedAtMs` (box clock): the user's cut-off becomes
     * `userRevocationCutoffMs(receivedAtMs, previous)`. Idempotent; a cut-off never moves earlier.
     */
    revokeUser(nUserid: string, receivedAtMs: number): void;
    /**
     * The user's cut-off (epoch ms), null when never revoked or pruned. A token is revoked when
     * `isRevokedByUserCutoff(iat, this)`, i.e. `iat * 1000 <= this`.
     */
    userRevokedAtMs(nUserid: string): number | null;
    /** Deny one token id until `untilMs` (its expiry + 5 min skew). Idempotent; a later `untilMs` wins. */
    denyJti(jti: string, untilMs: number, reason: JtiRevocationReason, atMs: number): void;
    isJtiDenied(jti: string, nowMs: number): boolean;
    /** Drop jti rows past their `untilMs` and user cut-offs past their keep time; returns how many. */
    prune(nowMs: number): number;
}

// ---------------------------------------------------------------------------------------------------------------
// Connectivity Log (D34, DR12; CONTRACTS.md §8.5) — deleted only by day retention and a super admin's Clear log
// ---------------------------------------------------------------------------------------------------------------

/** A new row. `day` and `id` are assigned by the repo (`day` from `atMs` in the box zone). */
export interface ConnectivityLogInsert {
    readonly atMs: number;
    readonly event: ConnectivityLogEvent;
    readonly source: ConnectivityLogSource;
    readonly code: ConnectivityLogCode;
    readonly problem: boolean;
    readonly nSesid: string | null;
    /** Resolved by the writer at insert time (the row keeps it after the session is purged). */
    readonly sessionName: string | null;
    readonly peer: string | null;
    readonly actor: EdgeActor | null;
    readonly data: ConnectivityLogData;
}

/** One attempt of a collapsed retry run. */
export interface ConnectivityLogAttempt {
    readonly atMs: number;
    readonly error: string | null;
    readonly peer: string | null;
}

/**
 * Writers: kernel (`tx-*`, `disk-write-*`), uplink (`cloud-*`, `internet-*`), ops (`clock-*`, `box-started`,
 * `log-cleared`).
 * Cursors (`nextBefore`, `newest`, the `before`/`after` query values) are opaque strings minted and parsed only by
 * this repo; a cursor it cannot parse → `EdgePortError('invalid_request')`.
 */
export interface ConnectivityLogRepo {
    /** Insert one row (`updatedAtMs = atMs`, `retry: null`). */
    append(row: ConnectivityLogInsert): ConnectivityLogRow;
    /**
     * Collapse retries (DR12): while a run with this `key` is active, update that row in place — `retry.tries += 1`,
     * `retry.lastError`, `updatedAtMs = attempt.atMs` (the row keeps its `id`, so an `after` poll returns it again)
     * — and record the attempt; otherwise insert a new `event:'retrying'` row from `row` with `retry =
     * {sinceMs: attempt.atMs, tries: 1, lastError, active: true}`. Key example: `tx-dial:<host>:<port>`.
     */
    retry(key: string, attempt: ConnectivityLogAttempt, row: ConnectivityLogInsert): ConnectivityLogRow;
    /** End the active run of `key` (`retry.active = false`, `updatedAtMs = atMs`); null when none is active. */
    endRetry(key: string, atMs: number): ConnectivityLogRow | null;
    /**
     * One page, newest first (`atMs` desc, then id desc). `query.day` defaults to `today`; `limit` defaults to
     * CONNECTIVITY_LOG_DEFAULT_LIMIT and must be 1–CONNECTIVITY_LOG_MAX_LIMIT; `q` matches code, peer, session name
     * and data.error case-insensitively. `after` returns every row of that day created OR updated after the cursor
     * (ignores `before`); `newest` is the cursor of the latest change of the day (null when the day has no rows);
     * `nextBefore` is null at the end. Errors: invalid_request (bad day, limit, filter or cursor).
     */
    page(query: ConnectivityLogQuery, today: string): Reply<ConnectivityLogPage>;
    /** Attempts of one retry row, newest first. Null when the row id is unknown. Errors: invalid_request. */
    tries(rowId: string, before: string | null, limit: number): Reply<ConnectivityLogTriesPage> | null;
    /** Days that have rows, newest first. */
    days(): readonly string[];
    /** Retention: delete rows (and their attempts) of days before `beforeDay`. Returns rows deleted. */
    pruneBefore(beforeDay: string): number;
    /**
     * "Clear log" (super admins, user decision 2026-10-04; the caller checked who asks): in ONE transaction delete
     * every row of every day and every attempt, then insert `row` as `append` does — the trace of the clear
     * (`code: 'log-cleared'`, `actor` = who cleared). The change counter keeps counting (never reset), so an `after`
     * cursor minted before the clear returns that row (under every filter and search: `page` always lets the
     * `log-cleared` row through) and a `before` cursor an empty page; an active retry
     * run is gone with its row, so the next `retry` of its key starts a new row. `days()` is then that row's day.
     * Returns the rows deleted (attempts not counted) and the trace row. Errors: invalid_request (malformed row).
     */
    clearAll(row: ConnectivityLogInsert): Reply<ConnectivityLogClearResult>;
}

// ---------------------------------------------------------------------------------------------------------------
// Incidents, held captures
// ---------------------------------------------------------------------------------------------------------------

/** An INCIDENT the kernel journaled, mirrored for status, verdict and the seal's cross-check. */
export interface BoxIncidentRecord extends EdgeIncident {
    readonly nSesid: string;
    /** Journal seq of the INCIDENT record; null when it never reached the journal (degraded durability). */
    readonly seq: number | null;
    readonly atMs: number;
}

export interface IncidentsRepo {
    /** Idempotent on (nSesid, seq, kind) when seq is not null. Throws session_not_found. */
    record(incident: BoxIncidentRecord): void;
    /** Oldest first. */
    list(nSesid: string): readonly BoxIncidentRecord[];
    count(nSesid: string): { readonly total: number; readonly warnings: number };
}

/** A held second CAT connection's capture file (orphan kind 'C', spec §3.2 capture.ts). */
export interface HeldCaptureRecord {
    /** The capture id (rt-ingest CaptureStore id). */
    readonly id: string;
    readonly nSesid: string;
    readonly kind: 'C';
    /** Eclipse username (listen mode); null in dial mode. Never a password. */
    readonly user: string | null;
    readonly peer: string;
    readonly fromMs: number;
    /** Null while the connection is still held. */
    readonly toMs: number | null;
    readonly bytes: number;
    /** sha256 hex of the file; null until the capture is closed. */
    readonly sha256: string | null;
    /** Absolute path under `captureDir`. */
    readonly file: string;
    readonly uploadedAtMs: number | null;
    readonly nOrphanid: string | null;
}

/**
 * The background held-capture upload's wait, kept across restarts (review 2026-10-04): a restart neither tries again at
 * once nor forgets etabella.net's last answer.
 */
export interface HeldCaptureUploadState {
    /** etabella.net's 503 NOT_CONFIGURED answers in a row (the backoff step; other failures leave it). */
    readonly notConfigured: number;
    /** Wall ms of the next background try. */
    readonly nextTryAtMs: number;
    /** The last failed upload (`CloudLinkStatus.lastUploadError`); null when unknown. */
    readonly lastError: { readonly atMs: number; readonly status: number | null; readonly code: string | null } | null;
}

export interface HeldCapturesRepo {
    /** Insert or replace by id. Throws session_not_found. */
    upsert(record: HeldCaptureRecord): void;
    get(id: string): HeldCaptureRecord | null;
    /** Oldest first. `pendingUpload: true` = closed (sha256 set) and not uploaded. */
    list(filter?: { readonly nSesid?: string; readonly pendingUpload?: boolean }): readonly HeldCaptureRecord[];
    /**
     * The cloud accepted the capture's `e.capture` report: keep the orphan id it gave with the capture, which still
     * waits for its upload (`uploadedAtMs` stays null), so neither a retry nor a restart reports it again (each report
     * pages P1 HELD_CAT_CONNECTION on the cloud; review 2026-10-04). Throws not_found.
     */
    setOrphan(id: string, nOrphanid: string): HeldCaptureRecord;
    /** Throws not_found. */
    markUploaded(id: string, nOrphanid: string, atMs: number): HeldCaptureRecord;
    /** The background upload's wait and last failure; null when none is kept. */
    uploadState(): HeldCaptureUploadState | null;
    /** Keep it (null clears it, after an upload). */
    setUploadState(state: HeldCaptureUploadState | null): void;
}

// ---------------------------------------------------------------------------------------------------------------
// Room codes and the operator code (§4.10, D33, DR7, DR10; O-9, O-10) — hashes only
// ---------------------------------------------------------------------------------------------------------------

export interface RoomCodeRecord {
    readonly id: string;
    readonly nSesid: string;
    readonly nCaseid: string;
    readonly nUserid: string;
    /** Opaque, unique among all stored codes; computed by the auth module (AccessPort docs). Never the code. */
    readonly codeHash: string;
    readonly status: RoomCodeStatus;
    readonly issuedAtMs: number;
    readonly issuedBy: EdgeActor;
    /** The previous unused code of the same (nSesid, nUserid) this one revoked; null when none. */
    readonly replacedId: string | null;
    /** sha256 hex of the redeeming device's cookie value (O-9 binding); null until used. */
    readonly deviceHash: string | null;
    readonly deviceLabel: string | null;
    readonly usedAtMs: number | null;
    /** jti of the newest box token issued on redemption (re-entry replaces it); null until used. */
    readonly tokenJti: string | null;
    readonly revokedAtMs: number | null;
    readonly endedAtMs: number | null;
    /** `expired` rows: when the session ended. */
    readonly expiredAtMs: number | null;
}

export interface RoomCodesRepo {
    /** Insert a new `unused` code. Throws session_not_found; a duplicate `codeHash` throws invalid_request. */
    insert(record: Omit<RoomCodeRecord, 'status' | 'deviceHash' | 'deviceLabel' | 'usedAtMs' | 'tokenJti' | 'revokedAtMs' | 'endedAtMs' | 'expiredAtMs'>): RoomCodeRecord;
    get(id: string): RoomCodeRecord | null;
    findByHash(codeHash: string): RoomCodeRecord | null;
    /** Newest first. `nCaseids` limits to those cases (DR19 visibility); omitted = all. */
    list(filter?: { readonly nSesid?: string; readonly nCaseids?: readonly string[] }): readonly RoomCodeRecord[];
    /** The unused code of (nSesid, nUserid), if any (at most one exists). */
    unusedFor(nSesid: string, nUserid: string): RoomCodeRecord | null;
    /** The used (bound) code of (nSesid, nUserid), if any. */
    usedFor(nSesid: string, nUserid: string): RoomCodeRecord | null;
    /**
     * Compare-and-set `unused` → `used` (first redemption) or `used` → `used` with a new `tokenJti` (same-device
     * re-entry). Returns null when the row is in any other state or bound to another device (caller answers the
     * code_* error). Throws not_found.
     */
    bind(id: string, binding: { readonly deviceHash: string; readonly deviceLabel: string | null; readonly tokenJti: string; readonly atMs: number }): RoomCodeRecord | null;
    /**
     * Compare-and-set a final state: `revoked` (from unused), `ended` (from used), `expired` (from unused).
     * Returns null when the current status does not allow it. Throws not_found.
     */
    finish(id: string, status: 'revoked' | 'ended' | 'expired', atMs: number): RoomCodeRecord | null;
    /** Session ended: every unused code of it → `expired`. Returns how many. */
    expireSession(nSesid: string, atMs: number): number;
}

/** The stored operator-code hash of one day. */
export interface OperatorCodeRecord extends OperatorCodeDelivery {
    readonly source: 'assignments' | 'relay';
    /** Operator-code sign-ins on that day (audited individually too). */
    readonly uses: number;
    readonly lastUsedAtMs: number | null;
}

export interface OperatorCodesRepo {
    get(day: string): OperatorCodeRecord | null;
    /** Replace that day's hash (resets `uses`). `replacedEarlier` = a hash for the day existed. */
    put(record: Omit<OperatorCodeRecord, 'uses' | 'lastUsedAtMs'>): { readonly replacedEarlier: boolean };
    /** Count one successful sign-in; returns the day's new `uses`. Throws not_found when the day has no hash. */
    recordUse(day: string, atMs: number): number;
    /** Retention: delete days before `day`. */
    purgeBefore(day: string): number;
}

// ---------------------------------------------------------------------------------------------------------------
// Transmitter settings + state version (D34, DR13)
// ---------------------------------------------------------------------------------------------------------------

export interface TransmitterSettingsRepo {
    /** `settings: null` = first run (nothing applied yet). */
    get(): { readonly settings: TransmitterSettings | null; readonly applied: TransmitterApplied | null };
    /** Persist applied settings (the caller validated them and bumps the version). */
    save(settings: TransmitterSettings, applied: TransmitterApplied): void;
    /** Current state version; 0 before the first bump. Survives restarts and never decreases. */
    version(): number;
    /**
     * Atomically increment and persist the state version; returns the new value. The KERNEL calls it on every
     * applied-settings change AND every link connection change (connect, disconnect, new connection) — never on
     * bytes or lines (contracts/transmitter.ts `TransmitterStateResponse`).
     */
    bumpVersion(): number;
    /**
     * The reporter connection the kernel last took from a session's cloud settings (`BoxSessionAssignment.reporter`),
     * as the fingerprint `"nSesid|host|port|protocol"`; null = none. The same fingerprint is never applied twice, so
     * a connection a person sets at the box afterwards stays (kernel.port.ts `CloudReporterStatus`).
     */
    cloudReporter(): string | null;
    /**
     * The settings that were in force before the kernel applied a cloud value over them (a person's, or none: null),
     * kept beside the fingerprint: they return when the cloud's settings are over. Null when none are remembered
     * (the default listen settings then).
     */
    cloudReporterPrevious(): TransmitterSettings | null;
    /**
     * Store (or clear with null) that fingerprint. Survives restarts. `previous`, when given, replaces the remembered
     * settings (null: forgets them); omitted, they stay as stored. Clearing the fingerprint forgets them too.
     */
    setCloudReporter(fingerprint: string | null, previous?: TransmitterSettings | null): void;
}

// ---------------------------------------------------------------------------------------------------------------
// Monotonic counters that must survive a restart
// ---------------------------------------------------------------------------------------------------------------

/**
 * - `lan-seq`: the floor of the LAN `seq` shared by `edge-status` and `edge-session` (ops.port.ts `nextEdgeSeq`):
 *   a client drops anything at or below the last seq it saw, so seq must keep growing across restarts.
 */
export type EdgeCounterName = 'lan-seq';

export interface CountersRepo {
    /** The stored value; 0 when never raised. */
    get(name: EdgeCounterName): number;
    /**
     * Store `max(stored, value)` (a counter never decreases) and return the stored value. `value` must be a
     * non-negative safe integer, else `invalid_request`.
     */
    raise(name: EdgeCounterName, value: number): number;
}

// ---------------------------------------------------------------------------------------------------------------
// Box identity / enrolment, cached JWKS, secrets, audit
// ---------------------------------------------------------------------------------------------------------------

/**
 * The box's cloud identity (spec §3.4 install, §5.3):
 * - `pending-confirm`: enrolled ('C' in the cloud), fingerprint not yet confirmed by an admin;
 * - `active`: confirmed ('A'); `quarantined`: 'Q' (connects, reports status, gets no assignments);
 * - `revoked`: 'X' (the key is dead; the box serves cached data only).
 */
export type BoxIdentityStatus = 'pending-confirm' | 'active' | 'quarantined' | 'revoked';

export interface BoxIdentityRecord {
    readonly nEdgeid: string;
    /** `RtEdgeNode.cSlug`: the box host is `<slug>.<BoxConfig.box.domain>`. */
    readonly slug: string;
    readonly status: BoxIdentityStatus;
    /** Printed by `rt-edge enroll` and compared by the admin (colon-separated hex). */
    readonly keyFingerprint: string;
    /** base64 DER SubjectPublicKeyInfo of the P-256 device key (the private key is in `paths.deviceKeyFile`). */
    readonly publicKeySpki: string;
    /** Full-chain TPM key (D2): false on pilot boxes. */
    readonly tpmKey: boolean;
    /** The cloud origin the box enrolled with (refuse to talk to another one). */
    readonly cloudOrigin: string;
    readonly enrolledAtMs: number;
    readonly confirmedAtMs: number | null;
    /** Last successful hello/heartbeat ack. */
    readonly lastCloudContactAtMs: number | null;
    /**
     * Why the cloud link fails, as the uplink last saw it; null when linked. The uplink records `never-enrolled`,
     * `revoked`, `quarantined`, `key-refused` (also an unconfirmed key) or `unreachable`, never `certificate`:
     * readiness and the verdict show `edgeLinkFailure(...)` (ops.port.ts), which derives that one.
     */
    readonly linkFailure: EdgeLinkFailure | null;
}

/** Secrets that never leave the box (32 random bytes each, created on first use, kept until the box is re-imaged). */
export type BoxSecretPurpose = 'room-code-hmac' | 'box-token-signing';

export interface IdentityRepo {
    /** Null = never enrolled ("Box not configured", `box_not_configured`). */
    get(): BoxIdentityRecord | null;
    /** Write the whole record (enrol, re-enrol). */
    save(record: BoxIdentityRecord): void;
    /** Throws box_not_configured when there is no identity. */
    patch(patch: Partial<Omit<BoxIdentityRecord, 'nEdgeid'>>): BoxIdentityRecord;
    /** The secret for `purpose`: created atomically on first call (crypto.randomBytes(32)), then stable. */
    secret(purpose: BoxSecretPurpose): Buffer;
}

/** A JWK as `e.hello` delivers it (`edgeTokenKeys`, ES256 public keys with `kid`). */
export type CachedJwk = Readonly<Record<string, unknown>>;

export interface JwksRepo {
    /** Null = never received (online tokens cannot be verified: `box_not_linked`). */
    get(): { readonly keys: readonly CachedJwk[]; readonly receivedAtMs: number } | null;
    /** Replace the cached key set (two `kid`s during rotation). */
    save(keys: readonly CachedJwk[], atMs: number): void;
}

/** Audited box actions ("Every box-admin write is audited", CONTRACTS.md §4; every code attempt, §6.3/§6.4). */
export type EdgeAuditAction =
    | 'sign-in-start'
    | 'room-code-redeem'
    | 'operator-code-sign-in'
    | 'sign-out'
    | 'room-code-issue'
    | 'room-code-revoke'
    | 'room-code-end-access'
    | 'room-code-reissue'
    | 'operator-code-issue'
    | 'transmitter-apply'
    | 'transmitter-connect'
    | 'transmitter-reconnect'
    | 'transmitter-test'
    | 'reporter-card'
    | 'diagnostics-download'
    | 'readiness-run'
    | 'network-run'
    | 'recovery-dismiss'
    /** Connectivity Log "Clear log" (super admins; box admins past the guard who are refused too, outcome `not_box_admin`); `data.removed`. */
    | 'log-clear'
    | 'enrol'
    /** The LAN certificate pair installed (or refused): `data.via` 'console' (`rt-edge cert install`) or 'cloud' (renewal). */
    | 'cert-install';

export interface EdgeAuditEntry {
    readonly atMs: number;
    readonly action: EdgeAuditAction;
    /** Null for unauthenticated attempts (code entry, sign-in start). */
    readonly actor: EdgeActor | null;
    /** 'ok' or the EdgeErrorCode the call answered. */
    readonly outcome: string;
    readonly nSesid: string | null;
    /** Row id, room-code id, … */
    readonly target: string | null;
    readonly ip: string | null;
    /** sha256 hex of the device cookie, never the value. */
    readonly deviceHash: string | null;
    /** Small JSON detail (changed fields, counts). Never a code value, token, password, hash or email in clear. */
    readonly data: Readonly<Record<string, unknown>> | null;
}

export interface AuditRepo {
    append(entry: EdgeAuditEntry): void;
    /** Newest first; `limit` 1–1000. */
    list(opts: { readonly sinceMs?: number; readonly limit: number }): readonly (EdgeAuditEntry & { readonly id: string })[];
    /** Retention: delete rows older than `beforeMs`. */
    pruneBefore(beforeMs: number): number;
}

// ---------------------------------------------------------------------------------------------------------------
// The port
// ---------------------------------------------------------------------------------------------------------------

export interface StateHealth {
    /** `PRAGMA quick_check` returned ok. */
    readonly ok: boolean;
    readonly file: string;
    readonly sizeBytes: number;
    readonly walBytes: number;
    readonly schemaVersion: number;
}

export interface StatePort {
    readonly sessions: SessionsRepo;
    readonly assignments: AssignmentsRepo;
    readonly roster: RosterRepo;
    /** rt-ingest `SqliteCheckpointStore` on the shared connection (async interface). */
    readonly checkpoints: CheckpointStore;
    readonly revocations: RevocationsRepo;
    readonly connectivityLog: ConnectivityLogRepo;
    readonly incidents: IncidentsRepo;
    readonly heldCaptures: HeldCapturesRepo;
    readonly roomCodes: RoomCodesRepo;
    readonly operatorCodes: OperatorCodesRepo;
    readonly transmitter: TransmitterSettingsRepo;
    readonly counters: CountersRepo;
    readonly identity: IdentityRepo;
    readonly jwks: JwksRepo;
    readonly audit: AuditRepo;
    /**
     * Run `fn` in one transaction (`BEGIN IMMEDIATE` … `COMMIT`; `ROLLBACK` and rethrow if it throws). Repository
     * calls inside join it; a nested `transaction` joins the outer one. `fn` must be synchronous.
     */
    transaction<T>(fn: () => T): T;
    health(): StateHealth;
    /** Close the database (after the kernel closed its checkpoint writes). Idempotent. */
    close(): Promise<void>;
}
