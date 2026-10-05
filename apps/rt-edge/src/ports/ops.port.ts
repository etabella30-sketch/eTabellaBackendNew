/**
 * OpsPort (token OPS_PORT, module ops/): status, chips, "Ready for today", the ranked verdict, network checks,
 * "This box", diagnostics, the reporter card and LAN metrics (spec §3.2 `ops`, §12; DR6, DR12, DR15, DR16;
 * CONTRACTS.md §7.2, §8.3–§8.7, §9.1). Ops reads the kernel, the uplink, the state and EDGE_BOOT_STATUS; it owns:
 * - the `seq` shared by `edge-status` and `edge-session` (CONTRACTS.md §9.2: a client drops anything at or below the
 *   last seen, so EVERY emission takes a new seq from `nextSeq`, the 5 s heartbeat included). Clients keep the last
 *   seq across a socket reconnect, so seq must keep growing across a box RESTART: one box-wide counter
 *   (`nextEdgeSeq`: strictly increasing, never below the clock), seeded from the persisted floor
 *   (`bootEdgeSeqFloor(StatePort.counters.get('lan-seq'))`) on first use, and persisted with
 *   `counters.raise('lan-seq', last)` every heartbeat and in `close()`. Per session the values are strictly
 *   increasing with gaps, which the contract allows;
 * - the readiness results, the verdict problems and the `reconnected` recoveries (kept until dismissed);
 * - the 5 s status heartbeat: every `EDGE_TIMING.statusHeartbeatMs` it publishes `session-status` (cause
 *   'heartbeat') for every unpurged session so the LAN re-emits `edge-status` (that is what makes "stale"
 *   detectable on the FE), and `device-health` (EdgeDeviceHealth: disk, journal/capture bytes, clock, certificate,
 *   UPS) for the uplink's `e.status` device block and the disk/clock/certificate alerts of spec §12 (also on
 *   `certificate-installed`);
 * - the certificate expiry alerts (spec §8.3, §12), from `UplinkPort.certificate()` at every heartbeat:
 *   `CERTIFICATE_EXPIRING` P2 while `daysLeft < EDGE_CERT_ALERT_DAYS` (21), P1 while `daysLeft < EDGE_CERT_PAGE_DAYS`
 *   (7) and the box holds a session that is not sealed; each tier at most once per box day. (A missing or unusable
 *   pair is alerted by main.ts's LAN listener, `CERTIFICATE_UNAVAILABLE`; renewal failures by the uplink.);
 * - retention (purge of sealed sessions, §10 #19), clock checks (`clock-*` log rows), the `box-started` row and a
 *   super admin's "Clear log" (the `log-cleared` row).
 * Times are epoch ms.
 */
import type {
    BoxDetailsResponse,
    ConnectivityLogClearResult,
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogTriesPage,
    EdgeOperatorStatus,
    EdgeSessionStatus,
    EdgeStatusSnapshot,
    NetworkChecksResponse,
    ReadinessResponse,
    ReporterCardRequest,
    ReporterCardResponse,
    VerdictResponse,
} from '../contracts';
import type { EdgeLinkFailure } from '../contracts';
import type { EdgePrincipal } from './auth.port';
import type { EdgeLanListenerStatus } from './boot';
import { certificateBlocksReady, EdgeCertificateStatus } from './certificate';
import type { Reply } from './common';
import type { BoxIdentityRecord } from './state.port';

/** The diagnostics zip (CONTRACTS.md §8.6): never transcript text, tokens, hashes or Eclipse logins. */
export interface EdgeDiagnosticsFile {
    /** `etabella-box-<boxLabel>-<YYYYMMDD-HHmm>.zip` (box-local time). */
    readonly fileName: string;
    readonly contentType: 'application/zip';
    readonly body: Buffer;
}

export interface OpsPort {
    /**
     * Start the heartbeat, retention and clock timers, publish the first `device-health`, log `box-started`, and
     * kick off the boot readiness run in the BACKGROUND. Called after the LAN listener's first attempt, whether or not
     * it bound (ports/boot.ts). Resolves PROMPTLY (never awaits a network check, a readiness run or the uplink) and
     * does NOT reject for a runtime condition (a failing check is a result, a failing probe is `null` in
     * `device-health`); rejects only on a programming error. Idempotent.
     */
    start(): Promise<void>;
    /**
     * Stop every timer and persist the `lan-seq` floor (when a seq was issued). Idempotent; apart from the persist a
     * no-op when `start` never ran.
     */
    close(): Promise<void>;

    /**
     * The next LAN seq for an emission concerning `nSesid` (every `edge-status` and `edge-session`, heartbeats
     * included): `last = nextEdgeSeq(last, clock())` on ONE box-wide counter, seeded on first use with
     * `bootEdgeSeqFloor(StatePort.counters.get('lan-seq'))`. Works before / without `start()` (a failed ops start
     * must not stop the LAN). Never throws for a valid id; unknown ids still get a seq.
     */
    nextSeq(nSesid: string): number;
    /**
     * One session's status (`edge-status` payload / snapshot row). `seq` defaults to the session's current seq (no
     * increment). `includeOperator` adds the box-admin `operator` field. Null for an unknown or purged session.
     */
    sessionStatus(nSesid: string, opts: { readonly includeOperator: boolean; readonly seq?: number }): EdgeSessionStatus | null;
    /** `GET /edge/local/status`: sessions the principal may open (`AuthPort.canOpenSession`); `operator` for box admins. */
    statusSnapshot(principal: EdgePrincipal): Reply<EdgeStatusSnapshot>;
    /** The operator chip (`stale` when the box's own status is older than `EDGE_TIMING.statusStaleAfterMs`). */
    operatorStatus(): EdgeOperatorStatus;

    /**
     * `GET /edge/local/ops/readiness`: the last results (`checkedAtMs: null` before the first run since boot).
     * `box-linked`: `failure = edgeLinkFailure(...)` (below); ok iff it is null and the cloud was seen today.
     */
    readiness(): Reply<ReadinessResponse>;
    /** `POST …/readiness/run`: re-run (also `UplinkPort.syncNow` when online), resolve when done (≤ ~10 s). Audited. */
    runReadiness(principal: EdgePrincipal): Promise<Reply<ReadinessResponse>>;
    /**
     * `GET /edge/local/ops/verdict`: problems sorted with `sortVerdictProblems`, recoveries until dismissed.
     * `box-not-linked` is listed while `edgeLinkFailure({identity: StatePort.identity.get(), certificate:
     * UplinkPort.certificate(), lanListener: EdgeBootStatus.lanListener(), uplinkStartFailed:
     * EdgeBootStatus.stepFailed('uplink')})` is non-null, with that `failure` — except `unreachable` on a box that
     * linked before while etabella.net is out of reach with the internet not down, which is `cant-reach-etabella`
     * (review 2026-10-04). Failed ops / lan starts have no contract kind and show only as alerts and in the diagnostics.
     */
    verdict(): Reply<VerdictResponse>;
    /** `POST …/verdict/recoveries/:id/dismiss`. Errors: `not_found`. Audited. */
    dismissRecovery(principal: EdgePrincipal, id: string): void;

    /** `GET /edge/local/ops/log` (defaults: today, filter 'all'). Errors: `invalid_request`. */
    connectivityLog(query: ConnectivityLogQuery): Reply<ConnectivityLogPage>;
    /** `GET /edge/local/ops/log/:id/tries`. Errors: `not_found`, `invalid_request`. */
    connectivityLogTries(rowId: string, before: string | null, limit: number | null): Reply<ConnectivityLogTriesPage>;
    /**
     * `POST /edge/local/ops/log/clear` ("Clear log", user decision 2026-10-04): SUPER ADMINS only, whatever
     * `box.settingsAccess` lets through the box-admin guard — a case admin or an operator-code session gets
     * `not_box_admin` and nothing is deleted. `StatePort.connectivityLog.clearAll` with a `log-cleared` row whose
     * `actor` is the caller ("Log cleared by A. Jha"). Audited (`log-clear`), refusals of box admins past the guard
     * too; a caller the guard itself refuses is not audited, as on every ops route.
     */
    clearConnectivityLog(principal: EdgePrincipal): Reply<ConnectivityLogClearResult>;

    /** `GET /edge/local/ops/network`: the last results, every `NETWORK_CHECK_KEYS` entry in order. */
    network(): Reply<NetworkChecksResponse>;
    /** `POST …/network/run`: re-run now, resolve when done (≤ ~10 s). Audited. */
    runNetwork(principal: EdgePrincipal): Promise<Reply<NetworkChecksResponse>>;
    /** `GET /edge/local/ops/box`. */
    boxDetails(): Reply<BoxDetailsResponse>;
    /** `GET /edge/local/ops/diagnostics`. Audited. */
    diagnostics(principal: EdgePrincipal): Promise<EdgeDiagnosticsFile>;
    /** `POST /edge/local/ops/reporter-card` (logged). Errors: `session_not_found`. */
    reporterCard(principal: EdgePrincipal, req: ReporterCardRequest): Reply<ReporterCardResponse>;
    /** `GET /edge/local/metrics` (LAN only): Prometheus text exposition 0.0.4; labels carry session ids, never names. */
    metrics(): string;
}

// ---------------------------------------------------------------------------------------------------------------
// LAN seq (shared by ops and its specs; ops.port.spec.ts)
// ---------------------------------------------------------------------------------------------------------------

/**
 * Added to the persisted `lan-seq` floor at boot. Ops persists the floor at most one heartbeat (5 s) behind the last
 * seq it issued, and far fewer than this many seqs are issued in 5 s, so a crash never re-issues a seq — even when
 * the clock stepped back across the restart.
 */
export const EDGE_SEQ_BOOT_MARGIN = 1_000_000;

const wholeMs = (n: number): number => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** The `previous` value of the first `nextEdgeSeq` after a boot. */
export function bootEdgeSeqFloor(persistedFloor: number): number {
    return wholeMs(persistedFloor) + EDGE_SEQ_BOOT_MARGIN;
}

/**
 * The next LAN seq: strictly above `previous` and never below the clock (epoch ms), so it also stays above every
 * seq of an earlier run while the clock is sane. A safe integer for the next ~285 000 years.
 */
export function nextEdgeSeq(previous: number, nowMs: number): number {
    return Math.max(wholeMs(previous) + 1, wholeMs(nowMs));
}

// ---------------------------------------------------------------------------------------------------------------
// Why the box is not linked (readiness `box-linked`, verdict `box-not-linked`; ops.port.spec.ts)
// ---------------------------------------------------------------------------------------------------------------

export interface EdgeLinkInput {
    /** `StatePort.identity.get()`. */
    readonly identity: Pick<BoxIdentityRecord, 'status' | 'linkFailure'> | null;
    /** `UplinkPort.certificate()`. */
    readonly certificate: EdgeCertificateStatus;
    /** `EdgeBootStatus.lanListener()`. */
    readonly lanListener: EdgeLanListenerStatus;
    /** `EdgeBootStatus.stepFailed('uplink')`. */
    readonly uplinkStartFailed: boolean;
}

/**
 * The one `EdgeLinkFailure` readiness and the verdict show; null = linked. First match wins, so the failure shown is
 * the one to fix first (a box that is not enrolled or not trusted cannot get a certificate; a box without a usable
 * certificate cannot be reached by the room even while the cloud link is up):
 * 1. no identity → `never-enrolled`;
 * 2. identity `revoked` → `revoked`; `quarantined` → `quarantined`;
 * 3. `identity.linkFailure === 'key-refused'` (also an unconfirmed `pending-confirm` key) → `key-refused`;
 * 4. the LAN listener waits for a certificate, or `certificateBlocksReady(certificate)` (not loadable, wrong host,
 *    fewer than EDGE_CERT_READY_MIN_DAYS left) → `certificate`;
 * 5. any other recorded `identity.linkFailure` (`unreachable`, …) → it;
 * 6. a failed uplink start with nothing recorded → `unreachable`;
 * 7. otherwise null.
 * The uplink never records `certificate` itself: only this rule derives it.
 */
export function edgeLinkFailure(input: EdgeLinkInput): EdgeLinkFailure | null {
    const { identity } = input;
    if (!identity) return 'never-enrolled';
    if (identity.status === 'revoked') return 'revoked';
    if (identity.status === 'quarantined') return 'quarantined';
    if (identity.linkFailure === 'key-refused') return 'key-refused';
    if (input.lanListener.state === 'waiting-certificate' || certificateBlocksReady(input.certificate)) return 'certificate';
    if (identity.linkFailure && identity.linkFailure !== 'certificate') return identity.linkFailure;
    if (input.uplinkStartFailed) return 'unreachable';
    return null;
}
