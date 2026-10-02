/**
 * Shared vocabulary of the cloud edge module (RS/edge, spec docs/rt-local-edge-spec.md rev 3 §3.2, §5.3–§5.7,
 * §7; ledger D5, D7, D10, D17–D19; build defaults O-5, O-6, O-8).
 *
 * Everything here is plain data or a tiny helper: config keys, Redis keys, timings, the SP-call helper that
 * follows the repo's executeRef convention (libs/global/src/db/pg), the direct-read SQL constants (the
 * README of assets/sql-migrations/2026-10-01_rt_edge_* keeps per-request reads as plain SQL, like
 * SESSION_ACCESS_SQL), the binding record the per-message checks read, and the alert shape.
 */
import { isIP } from 'net';

import { isUuid } from '../services/utility/safe-path';

// ---------------------------------------------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------------------------------------------

/** The box namespace on the shared socket.io server (spec §5.3). */
export const EDGE_NAMESPACE = '/edge';

/** Environment keys the module reads (ConfigService). None of them is required to boot realtime-server. */
export const EDGE_CONFIG = Object.freeze({
    /** '1' / 'true' turns the module on. Anything else: /edge is not attached and every edge route answers 503. */
    enabled: 'EDGE_ENABLED',
    /** Cloud raw journals and edge meta: <dir>/<nSesid>/seg-*.ej, edge-meta.json (D10). Default data/journal. */
    journalDir: 'EDGE_JOURNAL_DIR',
    /** Held direct streams for 'E' sessions (orphan 'H'). Default data/edge-captures. */
    captureDir: 'EDGE_CAPTURE_DIR',
    /** The Eclipse route file (same key and default as EclipseSessionService). */
    routeFile: 'ECLIPSE_SESSION_CONFIG',
    /** Cloud listener host and port given to the reporter after a split (same keys as session/eclipse). */
    feedHost: 'ECLIPSE_FEED_HOST',
    feedPort: 'ECLIPSE_AUTH_PORT',
    /** Public JWKS of the edge-token signer (authapi GET edge/jwks), JSON. Sent to boxes as edgeTokenKeys. */
    tokenJwks: 'EDGE_TOKEN_JWKS',
    /** Pager route (spec §12 "Alerts"): P1/P2 alerts are POSTed here as JSON when set. */
    alertWebhook: 'EDGE_ALERT_WEBHOOK',
    /** Origin printed in the enrolment QR text (default https://etabella.net). */
    cloudOrigin: 'EDGE_CLOUD_ORIGIN',
});

export function edgeEnabled(config: { get(key: string): any } | null | undefined): boolean {
    const raw = String(config?.get(EDGE_CONFIG.enabled) ?? '').trim().toLowerCase();
    return raw === '1' || raw === 'true';
}

/** Redis keys (spec §5.3 nonce, §12 status, D10 meta). */
export const EDGE_REDIS = Object.freeze({
    nonce: (nEdgeid: string, nonce: string) => `edge:nonce:${nEdgeid}:${nonce}`,
    /** INCR marker claiming a nonce's first use (RedisDbService.countInc: atomic, kept 24 h). */
    nonceUsed: (nEdgeid: string, nonce: string) => `edge:nonce-used:${nEdgeid}:${nonce}`,
    meta: (nSesid: string) => `edge:meta:${nSesid}`,
    status: (nEdgeid: string) => `edge:status:${nEdgeid}`,
    /**
     * Prefix of authapi's per-jti revocation keys (`edge:revoked:<jti>`). Mirrors
     * libs/edge-token EDGE_REVOCATION_REDIS_KEYS.jti; this module does not import @app/edge-token (task rule).
     */
    revokedJtiPrefix: 'edge:revoked:',
});

/** Timings (spec §5.3, §5.5, §10 #2, §12). Overridable through EDGE_OPTIONS for tests. */
export interface EdgeTimings {
    nonceTtlSec: number;
    statusTtlSec: number;
    /** MR-6: a newcomer with another bootId is refused while the old socket was seen within this window. */
    dupIdentityWindowMs: number;
    /** et_rtedge_heartbeat is called at most this often per box (the SP throttles at 55 s too). */
    heartbeatMinMs: number;
    /** et_rtedge_applied at most this often per session (spec §5.5 step 6). */
    appliedThrottleMs: number;
    /** Viewer `edge-status` hysteresis (§12): offline after 15 s silent, online after 10 s stable. */
    viewerOfflineAfterMs: number;
    viewerOnlineAfterMs: number;
    /** P1 when a box with a live session has been silent this long (§12 alerts). */
    silentPageAfterMs: number;
    /** P2 when lagSec exceeds this while connected. */
    lagAlertSec: number;
    /** The same alert (kind, box, session) is raised at most once per window. */
    alertDedupMs: number;
    enrollCodeTtlMs: number;
    metaTtlSec: number;
    /** Ack timeout of cloud → box requests (emitWithAck, §5.3). */
    pushTimeoutMs: number;
    /**
     * Upper bound on a database or Redis wait INSIDE the page store's single global queue task (review #32): a slow
     * PG or Redis must never park every live session's writes. A binding read that takes longer answers BUSY
     * (the box retries, nothing applied); a Redis meta write that takes longer finishes in the background.
     */
    queueIoBoundMs: number;
    /** A heartbeat the SP did not write (or that failed) is retried after this long, not after heartbeatMinMs. */
    heartbeatRetryMs: number;
    /** Retry of a deferred end body (route removal, dump, 'E') that did not complete after a seal (review #4/#33). */
    endBodyRetryMs: number;
    /** Sweep of sealed sessions whose dormant 'E' route is still in the route file (boot, then this often). */
    endBodySweepMs: number;
}

export const EDGE_TIMING: Readonly<EdgeTimings> = Object.freeze({
    nonceTtlSec: 60,
    statusTtlSec: 30,
    dupIdentityWindowMs: 20_000,
    heartbeatMinMs: 55_000,
    appliedThrottleMs: 60_000,
    viewerOfflineAfterMs: 15_000,
    viewerOnlineAfterMs: 10_000,
    silentPageAfterMs: 60_000,
    lagAlertSec: 30,
    alertDedupMs: 60_000,
    enrollCodeTtlMs: 15 * 60_000,
    metaTtlSec: 7 * 24 * 3600,
    pushTimeoutMs: 15_000,
    queueIoBoundMs: 1_500,
    heartbeatRetryMs: 15_000,
    endBodyRetryMs: 30_000,
    endBodySweepMs: 10 * 60_000,
});

/** Per-window request limits of the public device routes (spec §7: challenge and enroll are rate-limited). */
export interface EdgeRateLimits {
    windowMs: number;
    challengePerIp: number;
    /**
     * Challenges for one box FROM ONE ADDRESS (review #2). The budget is keyed on (address, box), never on the box
     * alone: an unauthenticated caller elsewhere can no longer spend the box's own budget and keep it off the uplink.
     */
    challengePerBox: number;
    enrollPerIp: number;
    /** every enrolment attempt, all addresses together (a distributed guess of the code is still bounded) */
    enrollTotal: number;
}

export const EDGE_RATE_LIMITS: Readonly<EdgeRateLimits> = Object.freeze({
    windowMs: 60_000,
    challengePerIp: 30,
    challengePerBox: 20,
    enrollPerIp: 10,
    enrollTotal: 60,
});

/** Optional module options (tests): timing overrides, rate limits and a clock. */
export const EDGE_OPTIONS = 'RT_EDGE_OPTIONS';
export interface EdgeModuleOptions {
    timings?: Partial<EdgeTimings>;
    rateLimits?: Partial<EdgeRateLimits>;
    /** `limits.maxPart` sent in the hello reply (default MAX_PART_BYTES; small values force multi-part rounds) */
    maxPartBytes?: number;
    clock?: () => number;
}

export function edgeTimings(opts?: EdgeModuleOptions | null): EdgeTimings {
    return { ...EDGE_TIMING, ...(opts?.timings ?? {}) };
}

export function edgeRateLimits(opts?: EdgeModuleOptions | null): EdgeRateLimits {
    return { ...EDGE_RATE_LIMITS, ...(opts?.rateLimits ?? {}) };
}

export function edgeClock(opts?: EdgeModuleOptions | null): () => number {
    return opts?.clock ?? (() => Date.now());
}

/** Uplink budget (spec §5.6). */
export const EDGE_LIMITS = Object.freeze({ edgeBps: 1024 * 1024, rawMinBps: 32 * 1024, burstBytes: 4 * 1024 * 1024 });

/**
 * Size limits on what an authenticated box may send (security review: a box is trusted only as far as its key).
 * Parts are already bounded by the socket buffer (1 MB) and an honest box sends ≤ MAX_PART_BYTES per part.
 */
export const EDGE_MESSAGE_LIMITS = Object.freeze({
    /** parts of one round (a whole multi-day transcript at 256 KB per part stays far below this) */
    maxRoundParts: 512,
    /** bytes staged for one session's incomplete multi-part round */
    maxStagedRoundBytes: 64 * 1024 * 1024,
    /** INCIDENT entries in a signed seal */
    maxSealIncidents: 10_000,
    /** characters of the free-text seal fields (endedBy) and of a signature */
    maxSealText: 200,
    maxSigChars: 400,
    /** sessions in one e.status, and its JSON size */
    maxStatusSessions: 256,
    maxStatusBytes: 256 * 1024,
});

// ---------------------------------------------------------------------------------------------------------------
// Ids
// ---------------------------------------------------------------------------------------------------------------

/** Lower-case canonical id, or null when the value is not a UUID. */
export function normId(value: unknown): string | null {
    return isUuid(value) ? String(value).toLowerCase() : null;
}

export function sameEdgeId(a: unknown, b: unknown): boolean {
    const x = normId(a);
    return !!x && x === normId(b);
}

// ---------------------------------------------------------------------------------------------------------------
// Database helpers (executeRef convention)
// ---------------------------------------------------------------------------------------------------------------

/** The part of DbService the module uses. */
export interface EdgeDb {
    executeRef(name: string, params: any): Promise<any>;
    rowQuery(text: string, params?: any[]): Promise<any>;
}

/** A failed SP or query (transport error, not an SP refusal). */
export class EdgeDbError extends Error {
    constructor(readonly what: string, readonly detail: unknown) {
        super(`rt-edge: ${what} failed: ${typeof detail === 'string' ? detail : (detail as any)?.message ?? JSON.stringify(detail)}`);
        this.name = 'EdgeDbError';
    }
}

/** One SP result row: msg 1 ok, -1 invalid / not found, -2 state conflict, -3 not allowed (README). */
export interface EdgeSpRow {
    msg: number;
    value?: string;
    cCode?: string;
    [key: string]: any;
}

/**
 * Call `et_<name>` with `ref` cursors and return the rows of each cursor (data[i] = cursor r(i+1)).
 * A transport failure throws EdgeDbError; an SP refusal is an ordinary row with msg ≠ 1.
 */
export async function callSp(db: EdgeDb, name: string, params: Record<string, unknown>, ref = 1): Promise<any[][]> {
    const res = await db.executeRef(name, { ...params, ref });
    if (!res?.success) throw new EdgeDbError(`et_${name}`, res?.error);
    return Array.isArray(res.data) ? res.data : [];
}

/** The first row of cursor `i`, or a synthetic not-found row. */
export function firstRow(cursors: any[][], i = 0): EdgeSpRow {
    const row = cursors?.[i]?.[0];
    return row && typeof row === 'object' ? (row as EdgeSpRow) : { msg: -1, value: 'No result', cCode: 'NO_RESULT' };
}

export function spOk(row: EdgeSpRow | null | undefined): boolean {
    return Number(row?.msg) === 1;
}

/** Rows of a direct read; throws EdgeDbError on a failed query. */
export async function readRows(db: EdgeDb, what: string, sql: string, params: any[]): Promise<any[]> {
    const res = await db.rowQuery(sql, params);
    if (!res?.success) throw new EdgeDbError(what, res?.error);
    return Array.isArray(res.data) ? res.data : [];
}

/** A wait that took longer than its bound (the work itself may still finish in the background). */
export class EdgeTimeoutError extends Error {
    constructor(readonly what: string, readonly ms: number) {
        super(`rt-edge: ${what} took longer than ${ms} ms`);
        this.name = 'EdgeTimeoutError';
    }
}

/**
 * `work`, or EdgeTimeoutError after `ms` (review #32: bounded waits inside the global feed queue). The timer is
 * unref'd and cleared; `work` is not cancelled, so callers use it only for reads and idempotent writes.
 */
export function withTimeout<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
    if (!(ms > 0) || !Number.isFinite(ms)) return work;
    let timer: any;
    const bound = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new EdgeTimeoutError(what, ms)), ms);
        timer?.unref?.();
    });
    return Promise.race([work, bound]).finally(() => clearTimeout(timer));
}

/** bigint / numeric columns come back from node-pg as strings. */
export function num(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------------------------------------------
// Direct reads (plain SQL constants, README "Direct reads (no SP)")
// ---------------------------------------------------------------------------------------------------------------

// Review #14: every predicate compares the uuid COLUMN with a uuid parameter (`= ANY($1::uuid[])`, `= $1::uuid`),
// never the column cast to text, so the primary key / ix_rsessionmaster_* / ix_rtedge* indexes serve the read.
// Callers pass normId'd ids (or null where the read allows it), so the casts never see a non-uuid string.

/**
 * The binding record of sessions (spec §5.3 per-message checks). Read before the queue; inside the queue task the
 * in-memory record is re-checked (§5.5 step 0), and this read runs there only on a cache miss, bounded (#32).
 */
export const EDGE_BINDING_SQL = `SELECT r."nSesid"::text AS "nSesid", r."nCaseid"::text AS "nCaseid", r."nEdgeid"::text AS "nEdgeid",
       r."cFeedSource", r."bEverEdge", r."cApply", r."nIngestEpoch", r."nRebaseSeq", r."cSyncState", r."cParserVer",
       r."nLines", r."cTimezone", r."cName", r."cStatus", r."nHearingOpid"::text AS "nHearingOpid",
       (r."dDelDt" IS NOT NULL) AS "bDeleted", r."nAppliedRawSeq", r."cAppliedRawHash", r."nPartNo",
       r."nPrevPartSesid"::text AS "nPrevPartSesid"
  FROM "RSessionMaster" r
 WHERE r."nSesid" = ANY($1::uuid[])`;

/**
 * G3: what a session's seal recorded (spec §4.4 "'W' incidents + Acknowledge"), for session/feedstatus: the
 * incident list, the forced-close note, and who acknowledged the warnings when; and the sealed raw head (the status of
 * a sealed session is answered from it, never by reloading the journal). $1 nSesid.
 */
export const EDGE_SEAL_FIELDS_SQL = `SELECT r."jIncidents", r."dWarnAckAt", r."nWarnAckBy"::text AS "nWarnAckBy",
       u."cFname" AS "cWarnAckFname", u."cLname" AS "cWarnAckLname", r."cSealNote", r."dSealedAt", r."nFinalLines",
       r."nRawFinalSeq", r."cRawFinalHash"
  FROM "RSessionMaster" r
  LEFT JOIN "UserMaster" u ON u."nUserid" = r."nWarnAckBy"
 WHERE r."nSesid" = $1::uuid`;

/**
 * G4: who created a venue session. RSessionMaster has no creator column; et_rtedge_session_bind records the
 * creating user (nMasterid) as the 'bind' event's nByUser. $1 nSesid.
 */
export const EDGE_SESSION_CREATOR_SQL = `SELECT e."nByUser"::text AS "nByUser" FROM "RtEdgeEvent" e
 WHERE e."nSesid" = $1::uuid AND e."cType" = 'bind' AND e."nByUser" IS NOT NULL
 ORDER BY e."nId" DESC LIMIT 1`;

/** G1: the state of boxes named by audit rows (key material is redacted until a box's key is confirmed). */
export const EDGE_NODE_STATUS_SQL = `SELECT n."nEdgeid"::text AS "nEdgeid", n."cStatus" FROM "RtEdgeNode" n WHERE n."nEdgeid" = ANY($1::uuid[])`;

/** Global admins (alert fan-out to their U rooms). */
export const EDGE_ADMINS_SQL = `SELECT u."nUserid"::text AS "nUserid" FROM "UserMaster" u WHERE u."isAdmin" IS TRUE`;

/**
 * Case admin of a session's case (spec §7 "Any admin" for session/feedstatus), through the migration's own helper
 * (2026-10-01_rt_edge_04_helpers.sql rtedge_is_case_admin), so the rule is the SPs' rule. $1 nCaseid, $2 nUserid.
 */
export const EDGE_CASE_ADMIN_SQL = `SELECT public.rtedge_is_case_admin($1::uuid, $2::uuid) AS "bCaseAdmin"`;

/** E-mail of roster members (CONTRACTS.md §12 item 3: the box needs it for `me` and the read-out card). */
export const EDGE_USER_EMAILS_SQL = `SELECT u."nUserid"::text AS "nUserid", u."cEmail" FROM "UserMaster" u WHERE u."nUserid" = ANY($1::uuid[])`;

/** Orphans for the admin list (spec §7 edge/admin/orphans). $1 nSesid?, $2 nEdgeid?, $3 cStatus?. */
export const EDGE_ORPHANS_SQL = `SELECT o."nOrphanid"::text AS "nOrphanid", o."nSesid"::text AS "nSesid", o."nEdgeid"::text AS "nEdgeid",
       o."cKind", o."cStatus", o."cUser", host(o."cPeer") AS "cPeer", o."nFromSeq", o."nToSeq", o."dFrom", o."dTo",
       o."nBytes", o."cSha256", o."cObjectKey", o."cNote", o."nResolvedBy"::text AS "nResolvedBy", o."dResolvedAt", o."dCreatedt"
  FROM "RtEdgeOrphan" o
 WHERE ($1::uuid IS NULL OR o."nSesid" = $1::uuid)
   AND ($2::uuid IS NULL OR o."nEdgeid" = $2::uuid)
   AND ($3::text IS NULL OR o."cStatus" = $3)
 ORDER BY o."dCreatedt" DESC
 LIMIT 500`;

/**
 * Audit trail for the admin screens. $1 nEdgeid?, $2 nSesid?, $3 cType? (one event type, e.g. 'ready': the FE's
 * "Venue box ready" check then sees that type's newest 200 rows, not the newest 200 of every type).
 */
export const EDGE_EVENTS_SQL = `SELECT e."nId", e."nEdgeid"::text AS "nEdgeid", e."nSesid"::text AS "nSesid", e."cType", e."jData",
       e."nByUser"::text AS "nByUser", e."dAt"
  FROM "RtEdgeEvent" e
 WHERE ($1::uuid IS NULL OR e."nEdgeid" = $1::uuid)
   AND ($2::uuid IS NULL OR e."nSesid" = $2::uuid)
   AND ($3::text IS NULL OR e."cType" = $3::text)
 ORDER BY e."nId" DESC
 LIMIT 200`;

/** The live next part of a split hearing (same rule as the SQL helper rtedge_successor; ux_rsessionmaster_nprevpartsesid). */
export const EDGE_SUCCESSOR_SQL = `SELECT r."nSesid"::text AS "nSesid" FROM "RSessionMaster" r
 WHERE r."nPrevPartSesid" = $1::uuid AND r."dDelDt" IS NULL LIMIT 1`;

/** The latest event of a box (a re-enrol raises an alert, spec §3.4 step 4). */
export const EDGE_LAST_EVENT_SQL = `SELECT e."cType" FROM "RtEdgeEvent" e WHERE e."nEdgeid" = $1::uuid ORDER BY e."nId" DESC LIMIT 1`;

// Every write goes through an SP. O-8 "Use direct cloud instead" (re-binding a never-fed 'E' session to 'D')
// is et_rtedge_session_rebind_direct (files 09 / 10), called by EdgeSyncService.useDirectCloud; pinning a pending
// parser version at a box's first hello (G5) is et_rtedge_session_parser_pin (file 10); the direct reads above are
// read-only.

// ---------------------------------------------------------------------------------------------------------------
// Binding record
// ---------------------------------------------------------------------------------------------------------------

/** What the per-message checks compare (spec §5.3): RSessionMaster's edge columns for one session. */
export interface EdgeBinding {
    nSesid: string;
    nCaseid: string | null;
    nEdgeid: string | null;
    cFeedSource: string | null;
    bEverEdge: boolean;
    cApply: string | null;
    nIngestEpoch: number;
    nRebaseSeq: number | null;
    cSyncState: string | null;
    cParserVer: string | null;
    nLines: number;
    cTimezone: string | null;
    cName: string | null;
    cStatus: string | null;
    nHearingOpid: string | null;
    bDeleted: boolean;
    nAppliedRawSeq: number | null;
    cAppliedRawHash: string | null;
    nPartNo: number | null;
    nPrevPartSesid: string | null;
}

export function bindingFromRow(row: any): EdgeBinding {
    return {
        nSesid: String(row.nSesid).toLowerCase(),
        nCaseid: normId(row.nCaseid),
        nEdgeid: normId(row.nEdgeid),
        cFeedSource: row.cFeedSource ? String(row.cFeedSource).trim() : null,
        bEverEdge: row.bEverEdge === true,
        cApply: row.cApply ? String(row.cApply).trim() : null,
        nIngestEpoch: num(row.nIngestEpoch) ?? 1,
        nRebaseSeq: num(row.nRebaseSeq),
        cSyncState: row.cSyncState ? String(row.cSyncState).trim() : null,
        cParserVer: row.cParserVer ?? null,
        nLines: num(row.nLines) || 25,
        cTimezone: row.cTimezone ?? null,
        cName: row.cName ?? null,
        cStatus: row.cStatus ? String(row.cStatus).trim() : null,
        nHearingOpid: normId(row.nHearingOpid),
        bDeleted: row.bDeleted === true,
        nAppliedRawSeq: num(row.nAppliedRawSeq),
        cAppliedRawHash: row.cAppliedRawHash ?? null,
        nPartNo: num(row.nPartNo),
        nPrevPartSesid: normId(row.nPrevPartSesid),
    };
}

/** True when the session is an 'E' session bound to this box (spec §5.3). */
export function isBoundTo(binding: EdgeBinding | null | undefined, nEdgeid: string): boolean {
    return !!binding && binding.cFeedSource === 'E' && sameEdgeId(binding.nEdgeid, nEdgeid);
}

/** The hearing operator of a session, or a global admin (split, O-8). */
export function mayOperate(binding: EdgeBinding | null | undefined, actor: EdgeActorRef): boolean {
    if (!actor?.userId) return false;
    if (actor.isAdmin) return true;
    return !!binding?.nHearingOpid && sameEdgeId(binding.nHearingOpid, actor.userId);
}

/** The verified caller of an admin route (req.user set by RealtimeAuthMiddleware). */
export interface EdgeActorRef {
    userId: string;
    isAdmin: boolean;
}

// ---------------------------------------------------------------------------------------------------------------
// Alerts (spec §12)
// ---------------------------------------------------------------------------------------------------------------

export type EdgeAlertTier = 'P1' | 'P2' | 'info';

export interface EdgeAlert {
    /** Stable kind (FORK, LINEAGE_FROZEN, DUP_IDENTITY, HELD_SHRINK, BOX_SILENT, …). */
    kind: string;
    tier: EdgeAlertTier;
    critical?: boolean;
    nEdgeid?: string | null;
    nSesid?: string | null;
    message: string;
    data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------------------------------------------
// Errors surfaced by the services (the controller maps them to HTTP statuses)
// ---------------------------------------------------------------------------------------------------------------

export type EdgeServiceErrorCode =
    | 'DISABLED'
    | 'INVALID'
    | 'NOT_FOUND'
    | 'NOT_ALLOWED'
    | 'STATE'
    | 'CONFLICT'
    | 'RATE'
    | 'NOT_IMPLEMENTED'
    | 'NOT_CONFIGURED'
    | 'UNAVAILABLE'
    | 'UNAUTHORIZED';

export const EDGE_ERROR_STATUS: Readonly<Record<EdgeServiceErrorCode, number>> = Object.freeze({
    DISABLED: 503,
    INVALID: 400,
    NOT_FOUND: 404,
    NOT_ALLOWED: 403,
    STATE: 409,
    CONFLICT: 409,
    RATE: 429,
    NOT_IMPLEMENTED: 501,
    NOT_CONFIGURED: 503,
    UNAVAILABLE: 503,
    UNAUTHORIZED: 401,
});

/** A refusal with a stable code; the controller answers `{msg:-1, value, cCode, ...extra}`. */
export class EdgeServiceError extends Error {
    readonly status: number;
    constructor(readonly code: EdgeServiceErrorCode, message: string, readonly extra: Record<string, unknown> = {}) {
        super(message);
        this.name = 'EdgeServiceError';
        this.status = EDGE_ERROR_STATUS[code];
    }
}

/** Map an SP refusal row's cCode onto a service error. */
export function spRefusal(row: EdgeSpRow, fallback = 'The request was refused'): EdgeServiceError {
    const code = String(row?.cCode ?? '').toUpperCase();
    const msg = String(row?.value ?? fallback);
    const extra = { cCode: code || null };
    if (code === 'NOT_ALLOWED' || code === 'NOT_SCOPE_ADMIN' || Number(row?.msg) === -3) return new EdgeServiceError('NOT_ALLOWED', msg, extra);
    if (code === 'NOT_FOUND' || code === 'NO_RESULT') return new EdgeServiceError('NOT_FOUND', msg, extra);
    if (Number(row?.msg) === -2) return new EdgeServiceError('STATE', msg, extra);
    return new EdgeServiceError('INVALID', msg, extra);
}

// ---------------------------------------------------------------------------------------------------------------
// Small utilities
// ---------------------------------------------------------------------------------------------------------------

/** Fixed-window counter per key (public routes are rate-limited, spec §7). */
export class EdgeRateLimiter {
    private readonly windows = new Map<string, { start: number; count: number }>();
    constructor(private readonly limit: number, private readonly windowMs: number, private readonly clock: () => number = () => Date.now()) { }

    /** True when one more request from `key` is allowed now. */
    take(key: string): boolean {
        const now = this.clock();
        if (this.windows.size > 10_000) {
            for (const [k, w] of this.windows) if (now - w.start >= this.windowMs) this.windows.delete(k);
        }
        const w = this.windows.get(key);
        if (!w || now - w.start >= this.windowMs) {
            this.windows.set(key, { start: now, count: 1 });
            return true;
        }
        if (w.count >= this.limit) return false;
        w.count += 1;
        return true;
    }
}

/** Token bucket per box for the uplink budget (spec §5.6: backpressure by BUSY{retryMs}, never by dropping). */
export class EdgeTokenBucket {
    private readonly buckets = new Map<string, { tokens: number; at: number }>();
    constructor(
        private readonly ratePerSec: number,
        private readonly burst: number,
        private readonly clock: () => number = () => Date.now(),
    ) { }

    /** 0 when `cost` may proceed now (and is taken), else the ms to wait. */
    take(key: string, cost: number): number {
        const now = this.clock();
        const b = this.buckets.get(key) ?? { tokens: this.burst, at: now };
        b.tokens = Math.min(this.burst, b.tokens + ((now - b.at) / 1000) * this.ratePerSec);
        b.at = now;
        this.buckets.set(key, b);
        const need = Math.min(cost, this.burst);
        if (b.tokens >= need) {
            b.tokens -= need;
            return 0;
        }
        return Math.max(1, Math.ceil(((need - b.tokens) / this.ratePerSec) * 1000));
    }
}

/**
 * A peer address the SPs' inet parser accepts, or null. The box normalizes peers to a bare IP but writes 'unknown'
 * when the socket had no address; et_rtedge_orphan_insert refuses a malformed cPeer outright (msg -1), which would
 * lose the whole held-stream record, so a non-IP peer is left out instead.
 */
export function peerIp(value: unknown): string | null {
    const raw = String(value ?? '').trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i, '$1');
    return raw && isIP(raw) ? raw : null;
}

/** Display name from first / last name columns. */
export function personName(first: unknown, last: unknown, fallback = ''): string {
    const name = [first, last].map(v => String(v ?? '').trim()).filter(Boolean).join(' ');
    return name || fallback;
}
