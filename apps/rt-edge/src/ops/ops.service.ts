/**
 * OpsService: the box's operator side behind OPS_PORT (ports/ops.port.ts; spec §3.2 `ops`, §10 #19, §12; DR6, DR12,
 * DR15, DR16; CONTRACTS.md §7.2, §8.3–§8.7, §9.1).
 *
 * - Status: one `EdgeSessionStatus` per session (room chip, cloud-compatible venue fields, Part 2 pointer), the
 *   snapshot, the operator chip (DR6), and the box-wide LAN `seq` (persisted floor, never re-issued after a restart).
 * - "Ready for today" (DR15) and the ranked verdict (DR12) from the kernel, the uplink, the state and the boot status;
 *   feed drops and reconnects from the kernel's bus events. DR23 (email sign-in only, v1): with `features.operatorCode`
 *   off — the default — readiness has 7 checks (no operator-code line) and `readinessToDo` counts only those 7.
 * - Network checks (the clock offset against the cloud's `serverNowMs`), "This box", diagnostics (redacted zip), the
 *   reporter card (O-12: never a password), metrics.
 * - Timers (serve mode, `start()`): the 5 s heartbeat (`device-health`, `session-status` heartbeats, the `lan-seq`
 *   floor, certificate / disk / feed alerts), the clock + UPS check (`clock-*` log rows, clock alerts), the network
 *   checks re-run (`OpsTuning.networkCheckMs`, user decision 2026-10-04), retention.
 *
 * Every OS or network probe goes through OPS_HOST and every timer through OPS_TIMERS, so specs drive both.
 */
import * as path from 'path';

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { EDGE_FMT, EDGE_PROTO } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse/version';

import {
    BoxDetailsResponse,
    CloudLinkStatus,
    ConnectivityLogClearResult,
    ConnectivityLogPage,
    ConnectivityLogQuery,
    ConnectivityLogRow,
    ConnectivityLogTriesPage,
    CONNECTIVITY_LOG_DEFAULT_LIMIT,
    CONNECTIVITY_LOG_MAX_LIMIT,
    EDGE_CLOCK_FAR_OFFSET_MS,
    EDGE_CLOCK_READY_MAX_OFFSET_MS,
    EDGE_CONTRACT_VERSION,
    EDGE_TIMING,
    EdgeInternetStatus,
    EdgeLinePosition,
    EdgeLinkFailure,
    EdgeOperatorStatus,
    EdgeSessionStatus,
    EdgeStatusSnapshot,
    EdgeTimeSource,
    EdgeVenueState,
    NetworkChecksResponse,
    ReadinessResponse,
    ReporterCardRequest,
    ReporterCardResponse,
    VerdictProblem,
    VerdictResponse,
} from '../contracts';
import {
    AUTH_PORT,
    AuthPort,
    BOX_CONFIG,
    BoxConfig,
    BoxSessionRecord,
    boxDay,
    bootEdgeSeqFloor,
    EDGE_BOOT_STATUS,
    EDGE_CERT_ALERT_DAYS,
    EDGE_CERT_PAGE_DAYS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EDGE_SERVER_TIME,
    EdgeAlert,
    EdgeAuditAction,
    EdgeBootStatus,
    EdgeClock,
    EdgeDeviceHealth,
    EdgeDiagnosticsFile,
    EdgeEventBus,
    edgeLinkFailure,
    EdgePortError,
    EdgePrincipal,
    EdgeRequestContext,
    isBoxDay,
    KERNEL_PORT,
    KernelPort,
    KernelSessionView,
    KernelTransmitterState,
    nextEdgeSeq,
    OpsPort,
    phaseOfFeed,
    Reply,
    ServerTime,
    sessionZone,
    STATE_PORT,
    StatePort,
    Unsubscribe,
    UPLINK_PORT,
    UplinkPort,
} from '../ports';
import { buildDiagnosticsFile, diagnosticsFileName } from './diagnostics';
import { bool, MetricFamily, renderMetrics } from './metrics';
import { evaluateNetworkChecks, pickRoomAddress, pickTransmitterAddress, urlHost } from './network';
import {
    OPS_ALERT_BUFFER,
    OPS_AUDIT_KEEP_MS,
    OPS_CLOCK_ALERT_P1_MS,
    OPS_CLOCK_ALERT_P2_MS,
    OPS_CLOCK_STEP_EVERY_MS,
    OPS_CLOCK_STEP_MAX_AGE_MS,
    OPS_CLOCK_STEP_MAX_RTT_MS,
    OPS_CLOCK_UNSYNCED_PAGE_MS,
    OPS_CLOUD_CLOCK_MAX_AGE_MS,
    OPS_DEFAULT_ROUTE_TIMEOUT_MS,
    OPS_DIAGNOSTICS_LOG_WINDOW_MS,
    OPS_DIAGNOSTICS_MAX_LOG_ROWS,
    OPS_DISK_ALERT_MB,
    OPS_FEED_STOPPED_ALERT_AFTER_MS,
    OPS_INTERNET_PROBE_HOSTS,
    OPS_LOG_KEEP_DAYS,
    OPS_NETWORK_PROBE_FRESH_MS,
    OPS_PURGE_AFTER_SEAL_MS,
    OPS_RT_PRODUCTION_PATH,
    OPS_TUNING,
    OpsTuning,
} from './ops.constants';
import { httpDateOffsetMs, OPS_HOST, OPS_TIMERS, OpsClockReading, OpsDiskUsage, OpsDnsProbe, OpsHost, OpsHttpsProbe, OpsTimers } from './ops-host';
import { ClockFacts, evaluateReadiness, ReadinessSessionFacts } from './readiness';
import { normalizeCloudLink, normalizeTransmitterLink, roomStatus, buildSessionStatus, venueOf } from './status';
import { actorOf, hasDialAddress } from './transmitter';
import { buildVerdictProblems, FeedIncidents, heldCapturesOf, logFilterDefaultOf, ProblemClock, VerdictSessionFacts, verdictOverall } from './verdict';
import { wallClockDay, zonedWallClockToEpochMs } from './wall-clock';

/**
 * OPTIONAL uplink member ops uses when the uplink provides it (not part of UplinkPort yet; proposed): the box clock
 * minus the cloud's `serverNowMs` of the last hello reply, RTT-corrected (spec §10 #8 fallback when chrony is not
 * available); null before the first hello.
 */
export interface UplinkCloudClock {
    cloudClockOffset?(): { readonly offsetMs: number; readonly rttMs: number | null; readonly atMs: number } | null;
}

/**
 * What the HTTP layer may pass beyond OpsPort (all optional, so OpsPort callers are unaffected): the viewer for the
 * readiness `operator-code-issued` action (DR15: "Issue operator code" only for an online case admin; the line exists
 * only while `features.operatorCode` is on, DR23) and the request context for the audit rows (client IP).
 */
export interface OpsViewerExtensions {
    readiness(principal?: EdgePrincipal | null): Reply<ReadinessResponse>;
    runReadiness(principal: EdgePrincipal, ctx?: EdgeRequestContext | null): Promise<Reply<ReadinessResponse>>;
    dismissRecovery(principal: EdgePrincipal, id: string, ctx?: EdgeRequestContext | null): void;
    clearConnectivityLog(principal: EdgePrincipal, ctx?: EdgeRequestContext | null): Reply<ConnectivityLogClearResult>;
    runNetwork(principal: EdgePrincipal, ctx?: EdgeRequestContext | null): Promise<Reply<NetworkChecksResponse>>;
    diagnostics(principal: EdgePrincipal, ctx?: EdgeRequestContext | null): Promise<EdgeDiagnosticsFile>;
    reporterCard(principal: EdgePrincipal, req: ReporterCardRequest, ctx?: EdgeRequestContext | null): Reply<ReporterCardResponse>;
}

export type OpsPortWithContext = OpsPort & OpsViewerExtensions;

/** Session ids are UUID-like; anything else is never used to build a path (retention). */
const SAFE_ID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const DAY_MS = 86_400_000;

/** `day` minus `n` calendar days (YYYY-MM-DD). */
export function dayMinus(day: string, n: number): string {
    const [y, m, d] = day.split('-').map(Number);
    const t = new Date(Date.UTC(y, m - 1, d) - n * DAY_MS);
    return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`;
}

/**
 * §10 #19 purge conditions the box can check: sealed 'K' (the cloud verified the root and the raw chain; a 'W' needs
 * an acknowledgement the box never sees, so it is never auto-purged and disk pressure alerts instead), 24 h after the
 * seal (S-D9: publish is not visible on the box), not purged yet.
 */
export function purgeEligible(s: Pick<BoxSessionRecord, 'sealedAtMs' | 'sealState' | 'purgedAtMs' | 'localState'>, nowMs: number): boolean {
    return s.sealedAtMs !== null && s.sealState === 'K' && s.purgedAtMs === null && s.localState !== 'purged' && nowMs - s.sealedAtMs >= OPS_PURGE_AFTER_SEAL_MS;
}

/** `9f3c…c0a1`: first and last 4 hex characters of a root (BoxDetailsResponse.cloudRootShort). */
export function shortRoot(root: string | null | undefined): string | null {
    if (!root) return null;
    return root.length <= 8 ? root : `${root.slice(0, 4)}…${root.slice(-4)}`;
}

/**
 * Synced, on a box without chrony, from the cloud-measured offset: under EDGE_CLOCK_READY_MAX_OFFSET_MS (1 s). Windows
 * Time only vetoes, never vouches (review 2026-10-04): `false` ("Leap 3 / Local CMOS Clock", user decision 2026-10-04)
 * is not synced however small the offset; `true` (Leap 0 from an NTP source, synced every few hours with drift between)
 * does not excuse a measured offset of 1 s or more; null (not Windows, unreadable) leaves the offset alone.
 */
export function windowsVetoedSync(windowsSynced: boolean | null, cloudOffsetMs: number): boolean {
    return windowsSynced === false ? false : Math.abs(cloudOffsetMs) < EDGE_CLOCK_READY_MAX_OFFSET_MS;
}

const mib = (bytes: number | null): number => (bytes === null ? 0 : Math.round((bytes / 1_048_576) * 10) / 10);
const describe = (err: unknown): string => (err instanceof Error ? err.message : String(err));

interface NetworkProbes {
    readonly internet: OpsDnsProbe | null;
    readonly etabella: OpsHttpsProbe | null;
    readonly dns: OpsDnsProbe | null;
}

@Injectable()
export class OpsService implements OpsPortWithContext {
    private readonly logger = new Logger('EdgeOps');

    // lifecycle
    private started = false;
    private closed = false;
    private readonly intervals: unknown[] = [];
    private readonly unsubscribers: Unsubscribe[] = [];
    private lastHeartbeatAtMs: number | null = null;

    // LAN seq
    private seqLast: number | null = null;
    private seqPersisted = 0;
    private readonly seqBySession = new Map<string, number>();

    // measurements
    private disk: OpsDiskUsage | null = null;
    private journalBytes: number | null = null;
    private captureBytes: number | null = null;
    private clockReading: OpsClockReading | null = null;
    private upsOnBattery: boolean | null = null;
    private probes: NetworkProbes = { internet: null, etabella: null, dns: null };
    private networkCheckedAtMs: number | null = null;
    private lastHttpProbe: OpsHttpsProbe | null = null;
    /** When ops' etabella.net probe started failing (null while it answers or before the first run). */
    private etabellaFailingSinceMs: number | null = null;
    /** "Can't reach eTabella" with no known start: when ops first saw it (null while reachable). */
    private cantReachSeenAtMs: number | null = null;
    /** The IPv4 the OS routes from (`OpsHost.defaultRouteIpv4`, refreshed with every network run); null = none / not yet. */
    private defaultRoute: string | null = null;
    /** Box clock minus the cloud's `serverNowMs` (uplink hello, RTT-corrected), taken at the last clock check. */
    private cloudOffset: { readonly offsetMs: number; readonly atMs: number } | null = null;
    /** Windows Time keeps the clock synced (`OpsHost.windowsTimeSynced`); null when not a Windows box or unreadable. */
    private windowsSynced: boolean | null = null;

    // runs
    private readinessRun: Promise<void> | null = null;
    private networkRun: Promise<void> | null = null;
    /**
     * `networkRun` while it is the 2-minute background re-run nobody joined: it never reads "Running checks…"
     * (`VerdictResponse.running`, `NetworkChecksResponse.running`; review 2026-10-04). A run someone starts or joins
     * ("Run checks again", a readiness run) clears it.
     */
    private quietNetworkRun: Promise<void> | null = null;
    private clockRun: Promise<void> | null = null;
    private retentionRun: Promise<void> | null = null;
    private lastReadinessRunAtMs: number | null = null;

    // verdict
    private readonly problemClock = new ProblemClock();
    private readonly feeds = new FeedIncidents();
    private readonly lastSafeLine = new Map<string, EdgeLinePosition | null>();
    private readonly venues = new Map<string, { readonly venue: EdgeVenueState; readonly since: number | null }>();

    // alerts and the rest
    private readonly recentAlerts: EdgeAlert[] = [];
    private readonly alertedKeys = new Set<string>();
    private readonly lanViewers = new Map<string, number>();
    private clockInSync: boolean | null = null;
    private unsyncedSinceMs: number | null = null;
    /**
     * Since when the clock has drifted in a way that pages CLOCK_UNSYNCED: an unsynced reading other than Windows Time
     * alone (`onClockReading`'s `windowsOnly`). A synced reading and every Windows-only one reset it (review
     * 2026-10-04): `unsyncedSinceMs` never resets on a "Leap 3" box, so one slow round trip of 1 s or more after hours
     * under it paged at once. Null while not drifting.
     */
    private driftingSinceMs: number | null = null;
    private lastClockStepAtMs: number | null = null;
    /** When the last clock check ran (EDGE_CLOCK); null before the first: the verdict claims no clock problem until then. */
    private clockCheckedAtMs: number | null = null;
    /**
     * etabella.net time (EDGE_SERVER_TIME, user decision 2026-10-05): which clock new lines follow, and the PC clock
     * (`raw()`) the cloud offset is measured on. Null in specs that build ops without it (the box clock then).
     */
    private readonly serverTime: ServerTime | null;
    private lastWarnAt = new Map<string, number>();

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        @Inject(EDGE_BOOT_STATUS) private readonly boot: EdgeBootStatus,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        @Inject(OPS_HOST) private readonly host: OpsHost,
        @Inject(OPS_TIMERS) private readonly timers: OpsTimers,
        @Inject(OPS_TUNING) private readonly tuning: OpsTuning,
        @Optional() @Inject(EDGE_SERVER_TIME) serverTime?: ServerTime | null,
    ) {
        this.serverTime = serverTime ?? null;
    }

    // ---- lifecycle ------------------------------------------------------------------------------------------------

    async start(): Promise<void> {
        if (this.started || this.closed) return;
        this.started = true;
        const now = this.clock();
        this.subscribe();
        this.safe('box-started', () =>
            this.state.connectivityLog.append({ atMs: now, event: 'success', source: 'box', code: 'box-started', problem: false, nSesid: null, sessionName: null, peer: null, actor: null, data: {} }),
        );
        this.heartbeat();
        this.intervals.push(this.timers.setInterval(() => this.heartbeat(), this.tuning.heartbeatMs));
        this.intervals.push(this.timers.setInterval(() => void this.checkClock(), this.tuning.clockCheckMs));
        // The Network card must not show boot-time probes as current (user decision 2026-10-04): re-run them. A run
        // already in flight (readiness, "Run checks again") is shared; never audited, and quiet: it never reads
        // "Running checks…" (review 2026-10-04).
        this.intervals.push(this.timers.setInterval(() => void this.startRun('network', () => this.runNetworkChecks(), true), this.tuning.networkCheckMs));
        this.intervals.push(this.timers.setInterval(() => void this.runRetention(), this.tuning.retentionEveryMs));
        // Background, never awaited: the boot readiness run (network checks + clock) and the first retention sweep.
        void this.startRun('readiness', () => this.runChecks(false));
        void this.runRetention();
    }

    async close(): Promise<void> {
        if (!this.closed) {
            this.closed = true;
            for (const handle of this.intervals.splice(0)) this.timers.clearInterval(handle);
            for (const unsubscribe of this.unsubscribers.splice(0)) this.safe('unsubscribe', unsubscribe);
        }
        this.safe('seq-floor', () => this.persistSeq());
    }

    // ---- status -------------------------------------------------------------------------------------------------

    nextSeq(nSesid: string): number {
        if (this.seqLast === null) {
            let floor = 0;
            try {
                floor = this.state.counters.get('lan-seq');
            } catch (err) {
                this.warn('seq-floor-read', `could not read the lan-seq floor (the clock still keeps seq growing): ${describe(err)}`);
            }
            this.seqLast = bootEdgeSeqFloor(floor);
        }
        this.seqLast = nextEdgeSeq(this.seqLast, this.clock());
        this.seqBySession.set(nSesid, this.seqLast);
        return this.seqLast;
    }

    sessionStatus(nSesid: string, opts: { readonly includeOperator: boolean; readonly seq?: number }): EdgeSessionStatus | null {
        const record = this.state.sessions.get(nSesid);
        if (!record || record.purgedAtMs !== null || record.localState === 'purged') return null;
        const now = this.clock();
        const sync = this.uplink.session(nSesid);
        const online = this.uplink.status().online;
        return buildSessionStatus({
            record,
            view: this.kernel.session(nSesid),
            sync,
            uplinkOnline: online,
            internet: this.uplink.internet(),
            cloudOrigin: this.config.cloud.origin,
            seq: opts.seq ?? this.seqBySession.get(nSesid) ?? 0,
            nowMs: now,
            venueSince: this.trackVenue(nSesid, venueOf(online, sync), now),
            startAtMs: zonedWallClockToEpochMs(record.dStartDt, record.tz),
            operator: opts.includeOperator ? this.operatorStatus() : undefined,
        });
    }

    statusSnapshot(principal: EdgePrincipal): Reply<EdgeStatusSnapshot> {
        const now = this.clock();
        const sessions = this.state.sessions
            .list()
            .filter(s => !s.deleted && this.auth.canOpenSession(principal, s.nSesid))
            .map(s => this.sessionStatus(s.nSesid, { includeOperator: false }))
            .filter((s): s is EdgeSessionStatus => s !== null);
        const snapshot: Reply<EdgeStatusSnapshot> = {
            nowMs: now,
            heartbeatMs: EDGE_TIMING.statusHeartbeatMs,
            staleAfterMs: EDGE_TIMING.statusStaleAfterMs,
            internet: this.uplink.internet(),
            sessions,
        };
        return principal.isBoxAdmin ? { ...snapshot, operator: this.operatorStatus() } : snapshot;
    }

    operatorStatus(): EdgeOperatorStatus {
        const now = this.clock();
        const problems = this.problems(now);
        const readiness = this.evaluateReadinessNow(null, now);
        return {
            checkedAtMs: now,
            stale: this.isStale(now),
            transmitter: normalizeTransmitterLink(this.kernel.transmitterLink(), now),
            cloud: normalizeCloudLink(this.uplink.cloudLink()),
            problems: problems.length,
            readinessToDo: readiness.landing ? readiness.needAttention : 0,
            listen: this.listenInfo(this.safeValue(() => this.kernel.transmitterState(), null)),
        };
    }

    // ---- readiness and verdict ----------------------------------------------------------------------------------

    readiness(principal: EdgePrincipal | null = null): Reply<ReadinessResponse> {
        return this.evaluateReadinessNow(principal, this.clock());
    }

    async runReadiness(principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<Reply<ReadinessResponse>> {
        await this.startRun('readiness', () => this.runChecks(true));
        this.audit('readiness-run', principal, 'ok', ctx);
        return this.readiness(principal);
    }

    verdict(): Reply<VerdictResponse> {
        const now = this.clock();
        const problems = this.problems(now);
        return {
            checkedAtMs: now,
            running: this.isRunning(),
            overall: verdictOverall(problems),
            problems,
            // The gap times are shown in the session's zone (user decision 2026-10-05).
            recoveries: this.feeds.recoveries().map(r => ({ ...r, sessionTz: sessionZone(this.safeValue(() => this.state.sessions.get(r.nSesid)?.tz, null)) })),
            logFilterDefault: logFilterDefaultOf(problems),
        };
    }

    dismissRecovery(principal: EdgePrincipal, id: string, ctx: EdgeRequestContext | null = null): void {
        const known = typeof id === 'string' && this.feeds.dismiss(id);
        this.audit('recovery-dismiss', principal, known ? 'ok' : 'not_found', ctx, { target: typeof id === 'string' ? id.slice(0, 200) : null });
        if (!known) throw new EdgePortError('not_found', 'no such recovery');
    }

    // ---- Connectivity Log ---------------------------------------------------------------------------------------

    connectivityLog(query: ConnectivityLogQuery): Reply<ConnectivityLogPage> {
        const q = query ?? {};
        if (q.filter !== undefined && !['all', 'problems', 'transmitter', 'cloud'].includes(q.filter)) throw new EdgePortError('invalid_request', 'unknown filter');
        if (q.day !== undefined && !isBoxDay(q.day)) throw new EdgePortError('invalid_request', 'day must be YYYY-MM-DD');
        if (q.limit !== undefined && (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > CONNECTIVITY_LOG_MAX_LIMIT)) {
            throw new EdgePortError('invalid_request', `limit must be 1-${CONNECTIVITY_LOG_MAX_LIMIT}`);
        }
        if (q.q !== undefined && (typeof q.q !== 'string' || q.q.length > 200)) throw new EdgePortError('invalid_request', 'q must be at most 200 characters');
        for (const key of ['before', 'after'] as const) {
            const v = q[key];
            if (v !== undefined && (typeof v !== 'string' || v.length === 0 || v.length > 512)) throw new EdgePortError('invalid_request', `${key} is not a cursor`);
        }
        const normalized: ConnectivityLogQuery = {
            ...q,
            filter: q.filter ?? 'all',
            limit: q.limit ?? CONNECTIVITY_LOG_DEFAULT_LIMIT,
            ...(q.q !== undefined && q.q.trim() === '' ? { q: undefined } : {}),
        };
        return this.state.connectivityLog.page(normalized, this.today(this.clock()));
    }

    connectivityLogTries(rowId: string, before: string | null, limit: number | null): Reply<ConnectivityLogTriesPage> {
        if (typeof rowId !== 'string' || rowId.length === 0 || rowId.length > 200) throw new EdgePortError('invalid_request', 'bad row id');
        if (before !== null && (typeof before !== 'string' || before.length === 0 || before.length > 512)) throw new EdgePortError('invalid_request', 'before is not a cursor');
        const n = limit ?? CONNECTIVITY_LOG_DEFAULT_LIMIT;
        if (!Number.isInteger(n) || n < 1 || n > CONNECTIVITY_LOG_MAX_LIMIT) throw new EdgePortError('invalid_request', `limit must be 1-${CONNECTIVITY_LOG_MAX_LIMIT}`);
        const page = this.state.connectivityLog.tries(rowId, before, n);
        if (!page) throw new EdgePortError('not_found', 'no such log row');
        return page;
    }

    /**
     * "Clear log" (user decision 2026-10-04): super admins only — the box-admin guard also lets case admins (with
     * `box.settingsAccess` 'case-admin') and operator-code sessions through, so the check is here. The log keeps one
     * `log-cleared` row with the caller as `actor`, the actor shape of `tx-settings-applied` ("Log cleared by A. Jha").
     */
    clearConnectivityLog(principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Reply<ConnectivityLogClearResult> {
        if (!principal?.isSuperAdmin) {
            this.audit('log-clear', principal, 'not_box_admin', ctx);
            throw new EdgePortError('not_box_admin', 'only a super-admin can clear the Connectivity Log');
        }
        const cleared = this.state.connectivityLog.clearAll({
            atMs: this.clock(),
            event: 'success',
            source: 'box',
            code: 'log-cleared',
            problem: false,
            nSesid: null,
            sessionName: null,
            peer: null,
            actor: actorOf(principal),
            data: {},
        });
        this.audit('log-clear', principal, 'ok', ctx, { data: { removed: cleared.removed } });
        return cleared;
    }

    // ---- network, box, diagnostics, reporter card, metrics -------------------------------------------------------

    network(): Reply<NetworkChecksResponse> {
        const addresses = this.safeValue(() => this.host.ipv4Addresses(), []);
        const tx = this.safeValue(() => this.kernel.transmitterState(), null);
        return {
            running: this.networkRunShown(),
            checkedAtMs: this.networkCheckedAtMs,
            everyMs: this.tuning.networkCheckMs,
            checks: evaluateNetworkChecks({
                nowMs: this.clock(),
                room: pickRoomAddress(addresses, this.config, this.defaultRoute),
                transmitter: pickTransmitterAddress(addresses, this.config, this.defaultRoute),
                transmitterMode: tx?.settings?.mode ?? tx?.link.mode ?? null,
                serialPath: tx?.settings?.serialPath ?? null,
                internet: this.uplink.internet(),
                etabellaReachable: this.safeValue(() => this.uplink.etabellaReachable(), false),
                cloudCantReach: this.cloudCantReach(),
                probedAtMs: this.networkCheckedAtMs,
                internetProbe: this.probes.internet,
                etabellaProbe: this.probes.etabella,
                dnsProbe: this.probes.dns,
                dnsHost: urlHost(this.config.cloud.origin),
                clock: this.networkClockFacts(),
            }),
        };
    }

    async runNetwork(principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<Reply<NetworkChecksResponse>> {
        await this.startRun('network', () => this.runNetworkChecks());
        this.audit('network-run', principal, 'ok', ctx);
        return this.network();
    }

    boxDetails(): Reply<BoxDetailsResponse> {
        const now = this.clock();
        if (!this.disk) this.safe('measure', () => this.measureDisk());
        const identity = this.state.identity.get();
        const cert = this.safeValue(() => this.uplink.certificate(), null);
        const reading = this.clockReading;
        const time = this.timeSource();
        return {
            nEdgeid: identity?.nEdgeid ?? '',
            boxName: this.config.box.name,
            boxLabel: this.config.box.label,
            version: this.config.release.version,
            parserVer: FEED_PARSE_VERSION,
            backendCommit: this.config.release.backendCommit,
            feCommit: this.config.release.feCommit,
            nowMs: now,
            timeZone: this.config.box.timeZone,
            uptimeSec: this.safeValue(() => this.host.uptimeSec(), 0),
            clockOffsetMs: reading ? Math.round(reading.offsetMs) : null,
            clockSynced: reading?.synced === true,
            timeSource: time.source,
            serverTimeCheckedAtMs: time.checkedAtMs,
            // Null = not measured ("not measured", never "0 GB of 0 GB"; user decision 2026-10-04).
            diskFreeMB: this.disk?.freeMB ?? null,
            diskTotalMB: this.disk?.totalMB ?? null,
            journalMB: mib(this.journalBytes),
            certDaysLeft: cert?.daysLeft ?? null,
            upsOnBattery: this.upsOnBattery,
            cloudRootShort: this.cloudRootShort(),
        };
    }

    async diagnostics(principal: EdgePrincipal, ctx: EdgeRequestContext | null = null): Promise<EdgeDiagnosticsFile> {
        const now = this.clock();
        const section = (name: string, build: () => unknown): readonly [string, unknown] => {
            try {
                return [name, build()];
            } catch (err) {
                return [name, { unavailable: describe(err) }];
            }
        };
        const sections = [
            section('manifest', () => this.manifest(now)),
            section('box', () => this.boxDetails()),
            section('status', () => this.statusSection()),
            section('readiness', () => this.readiness(principal)),
            section('verdict', () => this.verdict()),
            section('network', () => this.network()),
            section('transmitter', () => this.kernel.transmitterState()),
            section('sessions', () => this.sessionsSection()),
            section('device', () => this.deviceHealth(now)),
            section('boot', () => ({
                phase: this.boot.phase(),
                phaseSinceMs: this.boot.phaseSinceMs(),
                startFailures: this.boot.startFailures(),
                lanListener: this.boot.lanListener(),
            })),
            section('certificate', () => this.certificateSection()),
            section('state-health', () => this.state.health()),
            section('connectivity-log', () => this.recentLog(now)),
            section('alerts', () => [...this.recentAlerts]),
            section('audit', () =>
                this.state.audit
                    .list({ sinceMs: now - OPS_DIAGNOSTICS_LOG_WINDOW_MS, limit: 1000 })
                    .map(({ deviceHash: _deviceHash, ...rest }) => rest),
            ),
        ];
        const file = buildDiagnosticsFile(sections, diagnosticsFileName(this.config.box.label, now, this.config.box.timeZone), now);
        this.audit('diagnostics-download', principal, 'ok', ctx, { data: { bytes: file.body.length } });
        return file;
    }

    reporterCard(principal: EdgePrincipal, req: ReporterCardRequest, ctx: EdgeRequestContext | null = null): Reply<ReporterCardResponse> {
        const nSesid = typeof req?.nSesid === 'string' ? req.nSesid.trim() : '';
        if (!nSesid || nSesid.length > 128) throw new EdgePortError('invalid_request', 'nSesid is required');
        const record = this.state.sessions.get(nSesid);
        const visible =
            !!record &&
            record.purgedAtMs === null &&
            record.localState !== 'purged' &&
            !record.deleted &&
            (principal.isSuperAdmin || this.auth.canOpenSession(principal, nSesid));
        if (!visible) {
            this.audit('reporter-card', principal, 'session_not_found', ctx, { nSesid, target: nSesid });
            throw new EdgePortError('session_not_found', 'unknown session');
        }
        const tx = this.safeValue(() => this.kernel.transmitterState(), null);
        const listen = this.listenInfo(tx);
        const reply: Reply<ReporterCardResponse> = {
            nSesid,
            sessionName: record.cName,
            caseName: this.state.assignments.case(record.nCaseid)?.cCasename ?? '',
            serverAddress: listen.address,
            port: listen.port,
            username: record.route?.user ?? '',
            // O-12 build default: the box holds only the scrypt hash; the card points to RT Production.
            password: null,
            passwordSource: 'rt-production',
            mode: tx?.settings?.mode ?? tx?.link.mode ?? 'listen',
            openedAtMs: this.clock(),
        };
        this.audit('reporter-card', principal, 'ok', ctx, { nSesid, target: nSesid });
        return reply;
    }

    metrics(): string {
        const now = this.clock();
        const uplink = this.safeValue(() => this.uplink.status(), null);
        const internet = this.safeValue(() => this.uplink.internet(), null);
        const cert = this.safeValue(() => this.uplink.certificate(), null);
        const views = this.safeValue(() => this.kernel.sessions(), [] as readonly KernelSessionView[]);
        const syncs = new Map(this.safeValue(() => this.uplink.sessions(), []).map(s => [s.nSesid, s]));
        const problems = this.safeValue(() => this.problems(now), [] as VerdictProblem[]);
        const readiness = this.safeValue(() => this.evaluateReadinessNow(null, now), null);
        const link = this.safeValue(() => this.kernel.transmitterLink(), null);
        const per = (pick: (v: KernelSessionView) => number | null) => views.map(v => ({ labels: { nsesid: v.nSesid }, value: pick(v) }));
        const perSync = (pick: (nSesid: string) => number | null) => views.map(v => ({ labels: { nsesid: v.nSesid }, value: pick(v.nSesid) }));
        const families: MetricFamily[] = [
            { name: 'rt_edge_up', help: 'The ops module answered.', type: 'gauge', samples: [{ value: 1 }] },
            { name: 'rt_edge_uptime_seconds', help: 'Seconds since the box process started.', type: 'gauge', samples: [{ value: this.safeValue(() => this.host.uptimeSec(), null) }] },
            { name: 'rt_edge_disk_free_bytes', help: 'Free space on the data filesystem.', type: 'gauge', samples: [{ value: this.disk ? this.disk.freeMB * 1_048_576 : null }] },
            { name: 'rt_edge_journal_bytes', help: 'Bytes under the journal directory.', type: 'gauge', samples: [{ value: this.journalBytes }] },
            { name: 'rt_edge_capture_bytes', help: 'Bytes under the held-capture directory.', type: 'gauge', samples: [{ value: this.captureBytes }] },
            { name: 'rt_edge_clock_offset_seconds', help: 'Box clock minus the reference clock.', type: 'gauge', samples: [{ value: this.clockReading ? this.clockReading.offsetMs / 1000 : null }] },
            { name: 'rt_edge_clock_synced', help: '1 when the clock reads synced.', type: 'gauge', samples: [{ value: this.clockReading ? bool(this.clockReading.synced) : null }] },
            { name: 'rt_edge_cert_days_left', help: 'Days until the LAN certificate expires.', type: 'gauge', samples: [{ value: cert?.daysLeft ?? null }] },
            { name: 'rt_edge_ups_on_battery', help: '1 while the UPS runs on battery.', type: 'gauge', samples: [{ value: bool(this.upsOnBattery) }] },
            { name: 'rt_edge_internet_up', help: '1 while the box internet is up.', type: 'gauge', samples: [{ value: internet ? bool(internet.state === 'up') : null }] },
            { name: 'rt_edge_cloud_online', help: '1 while the uplink is online.', type: 'gauge', samples: [{ value: uplink ? bool(uplink.online) : null }] },
            { name: 'rt_edge_cloud_lag_seconds', help: 'Age of the oldest change the cloud has not confirmed.', type: 'gauge', samples: [{ value: uplink?.lagSec ?? null }] },
            { name: 'rt_edge_cloud_pending_pages', help: 'Pages the cloud has not confirmed.', type: 'gauge', samples: [{ value: uplink?.pendingPages ?? null }] },
            { name: 'rt_edge_transmitter_link_up', help: '1 while the transmitter link carries a connection.', type: 'gauge', samples: [{ value: link ? bool(['connected-no-session', 'live', 'quiet'].includes(link.state)) : null }] },
            { name: 'rt_edge_transmitter_bytes_in_total', help: 'Bytes received on the transmitter link.', type: 'counter', samples: [{ value: link?.bytesIn ?? null }] },
            { name: 'rt_edge_verdict_problems', help: 'Verdict problems listed now, by severity.', type: 'gauge', samples: (['critical', 'bad', 'warn'] as const).map(sev => ({ labels: { severity: sev }, value: problems.filter(p => p.severity === sev).length })) },
            { name: 'rt_edge_readiness_need_attention', help: 'Ready-for-today checks not ok.', type: 'gauge', samples: [{ value: readiness?.needAttention ?? null }] },
            { name: 'rt_edge_session_cat_connected', help: '1 while the session has a transmitter connection.', type: 'gauge', samples: per(v => bool(v.catConnected)) },
            { name: 'rt_edge_session_bytes_in_total', help: 'Bytes received for the session.', type: 'counter', samples: per(v => v.bytesIn) },
            { name: 'rt_edge_session_total_lines', help: 'Lines in the session transcript.', type: 'gauge', samples: per(v => v.totalLines) },
            { name: 'rt_edge_session_rev', help: 'Current cut revision.', type: 'gauge', samples: per(v => v.rev) },
            { name: 'rt_edge_session_degraded', help: '1 while journal durability is degraded.', type: 'gauge', samples: per(v => bool(v.durability === 'degraded')) },
            { name: 'rt_edge_session_journal_corrupt', help: '1 when the journal failed verification.', type: 'gauge', samples: per(v => bool(v.journalCorrupt)) },
            { name: 'rt_edge_session_parse_errors_total', help: 'Parser errors since the worker opened.', type: 'counter', samples: per(v => v.parseErrors) },
            { name: 'rt_edge_session_incidents', help: 'Journaled incidents.', type: 'gauge', samples: per(v => v.incidents.total) },
            { name: 'rt_edge_session_last_line_age_seconds', help: 'Seconds since the last line.', type: 'gauge', samples: per(v => (v.lastLineAtMs === null ? null : Math.max(0, (now - v.lastLineAtMs) / 1000))) },
            { name: 'rt_edge_session_lag_lines', help: 'Lines the cloud has not confirmed.', type: 'gauge', samples: perSync(id => syncs.get(id)?.lagLines ?? null) },
            { name: 'rt_edge_session_lag_seconds', help: 'Age of the session change the cloud has not confirmed.', type: 'gauge', samples: perSync(id => syncs.get(id)?.lagSec ?? null) },
            { name: 'rt_edge_session_dirty_pages', help: 'Pages whose digest differs from the cloud.', type: 'gauge', samples: perSync(id => syncs.get(id)?.dirtyPages ?? null) },
            { name: 'rt_edge_session_lan_viewers', help: 'LAN sockets joined to the session.', type: 'gauge', samples: perSync(id => this.lanViewers.get(id) ?? 0) },
        ];
        return renderMetrics(families);
    }

    // ---- internals: readiness / verdict inputs -------------------------------------------------------------------

    private today(nowMs: number): string {
        return boxDay(nowMs, this.config.box.timeZone);
    }

    private linkFailure(): EdgeLinkFailure | null {
        return edgeLinkFailure({
            identity: this.state.identity.get(),
            certificate: this.uplink.certificate(),
            lanListener: this.boot.lanListener(),
            uplinkStartFailed: this.boot.stepFailed('uplink'),
        });
    }

    private clockFacts(): ClockFacts {
        const r = this.clockReading;
        const time = this.timeSource();
        return { synced: r ? r.synced : null, offsetMs: r ? Math.round(r.offsetMs) : null, source: time.source, readingAgeMs: time.readingAgeMs };
    }

    /** The PC clock (EDGE_RAW_CLOCK): what the cloud offset and its age are measured on. */
    private rawNow(): number {
        return this.serverTime ? this.serverTime.raw() : this.clock();
    }

    /**
     * Which clock new lines follow (user decision 2026-10-05; `EdgeTimeSource`): a fresh etabella.net reading (at most
     * OPS_CLOUD_CLOCK_MAX_AGE_MS old on the PC clock) → `etabella`; an older one or the saved correction → `saved`; none,
     * with chrony synced → `chrony`; else `box`. `checkedAtMs` is when etabella.net time was last checked, in
     * etabella.net time; `readingAgeMs` that reading's age on the PC clock. A reading in the PC clock's future (the
     * clock went back under it, unfolded) is stale, not 0 s old (review 2026-10-05): its age is unknown, so it reads
     * `saved` with an infinite age (Clock warns).
     */
    private timeSource(): { readonly source: EdgeTimeSource; readonly checkedAtMs: number | null; readonly readingAgeMs: number | null } {
        const st = this.serverTime?.status() ?? null;
        if (st && st.source !== 'box' && st.checkedAtMs !== null) {
            const ageMs = this.rawNow() - st.checkedAtMs;
            const readingAgeMs = ageMs < 0 ? Number.POSITIVE_INFINITY : ageMs;
            const fresh = st.source === 'etabella' && readingAgeMs <= OPS_CLOUD_CLOCK_MAX_AGE_MS;
            return { source: fresh ? 'etabella' : 'saved', checkedAtMs: st.checkedAtMs - st.targetMs, readingAgeMs };
        }
        const chronySynced = this.clockReading?.source === 'chrony' && this.clockReading.synced;
        return { source: chronySynced ? 'chrony' : 'box', checkedAtMs: null, readingAgeMs: null };
    }

    /**
     * The `clock-offset` network check: the offset against the CLOUD's clock (`serverNowMs` of the uplink's last
     * hello, RTT-corrected) whenever a fresh one exists — the clock the cloud judges this box's timestamps by — with
     * chrony's synced flag when chrony answers, else the cloud reading's own (under 1 s), which Windows Time can only
     * veto (`windowsVetoedSync`); without a fresh cloud reading, the box's clock reading (chrony, else etabella.net's
     * Date header).
     */
    private networkClockFacts(): ClockFacts {
        const cloud = this.cloudOffset;
        const facts = this.clockFacts();
        if (!cloud) return facts;
        const chrony = this.clockReading?.source === 'chrony' ? this.clockReading : null;
        return { ...facts, synced: chrony ? chrony.synced : windowsVetoedSync(this.windowsSynced, cloud.offsetMs), offsetMs: cloud.offsetMs };
    }

    /**
     * etabella.net reachable for readiness (and issuing an operator code): the uplink's ping, else ops' own fresh
     * probe — never while the uplink's cloud state is `cant-reach-etabella` (review 2026-10-04): the website can answer
     * while the box's link is refused, and the line then read ✓ beside the red Cloud card.
     */
    private etabellaReachable(nowMs: number): boolean {
        if (this.cloudCantReach()) return false;
        if (this.safeValue(() => this.uplink.etabellaReachable(), false)) return true;
        const probe = this.probes.etabella;
        return !!probe?.ok && this.networkCheckedAtMs !== null && nowMs - this.networkCheckedAtMs <= OPS_NETWORK_PROBE_FRESH_MS;
    }

    /** The uplink's cloud state is `cant-reach-etabella`: the box's link to etabella.net does not connect. */
    private cloudCantReach(): boolean {
        return this.safeValue(() => this.uplink.cloudLink().state, null) === 'cant-reach-etabella';
    }

    /**
     * The verdict's "Can't reach eTabella" (user decision 2026-10-04), the Cloud card's state: since when, with the
     * internet not down. The uplink's `cant-reach-etabella` decides first (its since, else ops' own failing probe's,
     * else when ops first saw it); an uplink online (synced / behind) reaches etabella.net whatever a probe said;
     * otherwise ops' own probe failing with nothing reaching etabella.net. Null while reachable.
     */
    private cantReachSinceMs(nowMs: number, internet: EdgeInternetStatus): number | null {
        const cloud = this.safeValue(() => this.uplink.cloudLink(), null);
        let since: number | null = null;
        if (internet.state !== 'down') {
            if (cloud?.state === 'cant-reach-etabella') since = this.unreachableSinceMs() ?? this.cantReachSeenAtMs ?? nowMs;
            else if (cloud?.state !== 'synced' && cloud?.state !== 'behind' && !this.etabellaReachable(nowMs)) since = this.etabellaFailingSinceMs;
        }
        this.cantReachSeenAtMs = since === null ? null : this.cantReachSeenAtMs ?? nowMs;
        return since;
    }

    /**
     * Where Eclipse "Connect to server" reaches the box: the kernel's listen address (the bind address), else the
     * configured one, else (dev, every interface) the box's default-route address or its best-ranked one (user
     * decision 2026-10-04); the kernel's listen port, else the configured one. The reporter card and the operator
     * status read it.
     */
    private listenInfo(tx: KernelTransmitterState | null): EdgeOperatorStatus['listen'] {
        const address =
            tx?.listen.boxTransmitterAddress ??
            this.config.transmitter.bindAddress ??
            pickTransmitterAddress(this.safeValue(() => this.host.ipv4Addresses(), []), this.config, this.defaultRoute).value;
        return { address, port: tx?.listen.port || this.config.transmitter.listenPort };
    }

    /**
     * Since when etabella.net has not been reachable with the internet up ("Can't reach eTabella since 10:42"): the
     * uplink's `cant-reach-etabella` since, else when ops' own probe started failing; null when unknown.
     */
    private unreachableSinceMs(): number | null {
        const cloud = this.safeValue(() => this.uplink.cloudLink(), null);
        if (cloud?.state === 'cant-reach-etabella' && cloud.sinceMs !== null) return cloud.sinceMs;
        return this.etabellaFailingSinceMs;
    }

    private evaluateReadinessNow(principal: EdgePrincipal | null, nowMs: number): Reply<ReadinessResponse> {
        const today = this.today(nowMs);
        const identity = this.state.identity.get();
        const internet = this.uplink.internet();
        const reachable = this.etabellaReachable(nowMs);
        const cases = this.state.assignments.cases();
        const counts = this.state.roster.counts();
        const casesWithRoster = cases.filter(c => this.state.roster.forCase(c.nCaseid).some(m => m.active)).length;
        // DR23: with the operator code switched off (the v1 default) there is no operator-code line, nothing reads the
        // day's code and nothing offers to issue one.
        const operatorCodeOn = this.config.features.operatorCode === true;
        const code = operatorCodeOn ? this.state.operatorCodes.get(today) : null;
        const link = this.kernel.transmitterLink();
        const canIssue = operatorCodeOn && !!principal && principal.kind === 'online' && (principal.isSuperAdmin || principal.adminCaseIds.length > 0) && reachable;
        const evaluation = evaluateReadiness({
            today,
            dayOf: ms => this.today(ms),
            linkFailure: this.linkFailure(),
            lastCloudContactAtMs: identity?.lastCloudContactAtMs ?? null,
            sessions: this.readinessSessions(nowMs),
            assignmentsSyncedAtMs: this.state.assignments.syncedAtMs(),
            roster: { people: counts.people, casesWithRoster, boxCases: cases.length },
            transmitter: { state: link.state, mode: link.mode },
            internet,
            etabellaReachable: reachable,
            unreachableSinceMs: reachable ? null : this.unreachableSinceMs(),
            operatorCodeOn,
            operatorCode: { issued: !!code, issuedAtMs: code?.issuedAtMs ?? null, mintedByName: code?.mintedBy?.name ?? null },
            canIssueOperatorCode: canIssue,
            rtProductionUrl: `${this.config.cloud.origin}${OPS_RT_PRODUCTION_PATH}`,
            diskFreeMB: this.disk?.freeMB ?? null,
            clock: this.clockFacts(),
        });
        return {
            day: today,
            checkedAtMs: this.lastReadinessRunAtMs === null ? null : Math.max(this.lastReadinessRunAtMs, this.lastHeartbeatAtMs ?? 0),
            running: this.readinessRun !== null,
            landing: evaluation.landing,
            firstLiveAtMs: evaluation.firstLiveAtMs,
            items: evaluation.items,
            needAttention: evaluation.needAttention,
            total: evaluation.total,
        };
    }

    private readinessSessions(nowMs: number): ReadinessSessionFacts[] {
        return this.state.sessions
            .list()
            .filter(s => !s.deleted)
            .map(s => {
                const view = this.kernel.session(s.nSesid);
                const room = roomStatus({ record: s, view, internet: { state: 'unknown', sinceMs: null }, nowMs, startAtMs: null });
                let today = false;
                try {
                    today = wallClockDay(s.dStartDt) === boxDay(nowMs, s.tz);
                } catch {
                    today = wallClockDay(s.dStartDt) === this.today(nowMs);
                }
                return {
                    nSesid: s.nSesid,
                    sessionName: s.cName,
                    caseName: this.state.assignments.case(s.nCaseid)?.cCasename ?? '',
                    startAtMs: zonedWallClockToEpochMs(s.dStartDt, s.tz),
                    tz: sessionZone(s.tz),
                    isToday: today,
                    firstLineAtMs: room.firstLineAtMs,
                    liveNow: phaseOfFeed(room.feed) === 'live',
                };
            });
    }

    private problems(nowMs: number): VerdictProblem[] {
        const views = this.kernel.sessions();
        const viewById = new Map(views.map(v => [v.nSesid, v]));
        const records = this.state.sessions.list();
        const names = new Map(records.map(r => [r.nSesid, r.cName]));
        const tx = this.kernel.transmitterState();
        this.feeds.reconcile(views, nowMs, id => names.get(id) ?? '', tx.settings?.mode ?? tx.link.mode, this.tuning.heartbeatMs);
        const sessions: VerdictSessionFacts[] = records.map(r => ({
            nSesid: r.nSesid,
            sessionName: r.cName,
            tz: sessionZone(r.tz),
            localState: r.localState,
            view: viewById.get(r.nSesid) ?? null,
            sync: this.uplink.session(r.nSesid),
            splitDone: r.next !== null,
        }));
        for (const v of views) {
            if (!names.has(v.nSesid)) sessions.push({ nSesid: v.nSesid, sessionName: '', tz: null, localState: v.localState, view: v, sync: this.uplink.session(v.nSesid), splitDone: false });
        }
        const status = this.uplink.status();
        const identity = this.state.identity.get();
        const internet = this.uplink.internet();
        const mode = tx.settings?.mode ?? tx.link.mode;
        return buildVerdictProblems({
            nowMs,
            sessions,
            linkFailure: this.linkFailure(),
            lastLinkedAtMs: identity?.lastCloudContactAtMs ?? null,
            diskFreeMB: this.disk?.freeMB ?? null,
            internet,
            pendingPages: status.pendingPages,
            lagSec: status.lagSec,
            // Claimed only once a clock check ran (user decision 2026-10-05: "no etabella.net time yet" is a problem
            // with or without a reading of the PC clock).
            clock: { ...this.clockFacts(), measured: this.clockCheckedAtMs !== null || this.clockReading !== null },
            transmitter: {
                mode,
                linkState: tx.link.state,
                stateVersion: tx.stateVersion,
                hasDialAddress: hasDialAddress(tx.settings),
                serialPath: mode === 'serial' ? tx.settings?.serialPath ?? null : null,
                baudRate: mode === 'serial' ? tx.settings?.baudRate ?? null : null,
                listenPort: tx.listen.port || this.config.transmitter.listenPort,
            },
            cantReachSinceMs: this.cantReachSinceMs(nowMs, internet),
            // CloudLinkStatus.heldCapturesPending / lastUploadError, read defensively (an older uplink sends neither).
            heldCaptures: heldCapturesOf(this.safeValue(() => this.uplink.cloudLink(), null as CloudLinkStatus | null)),
            feedIncidents: this.feeds.incidents(),
            lastSafe: id => this.lastSafeLine.get(id) ?? null,
            since: this.problemClock,
        });
    }

    private isStale(nowMs: number): boolean {
        const heartbeatLate = this.started && !this.closed && this.lastHeartbeatAtMs !== null && nowMs - this.lastHeartbeatAtMs > EDGE_TIMING.statusStaleAfterMs;
        return heartbeatLate || this.safeValue(() => this.uplink.status().stale, false);
    }

    private isRunning(): boolean {
        return this.readinessRun !== null || this.networkRunShown();
    }

    /** A network run is in flight that someone started or joined (the quiet background re-run is not shown). */
    private networkRunShown(): boolean {
        return this.networkRun !== null && this.networkRun !== this.quietNetworkRun;
    }

    private trackVenue(nSesid: string, venue: EdgeVenueState, nowMs: number): number | null {
        const prev = this.venues.get(nSesid);
        if (prev && prev.venue === venue) return prev.since;
        // Before the uplink's first tick its state has no published start (null): the venue then starts now.
        const since = prev ? nowMs : (this.safeValue(() => this.uplink.cloudLink().sinceMs, null) ?? nowMs);
        this.venues.set(nSesid, { venue, since });
        return since;
    }

    private cloudRootShort(): string | null {
        const synced = this.safeValue(() => this.uplink.sessions(), [])
            .filter(s => !!s.cloudRoot)
            .sort((a, b) => (b.lastSyncedAtMs ?? 0) - (a.lastSyncedAtMs ?? 0));
        return shortRoot(synced[0]?.cloudRoot);
    }

    // ---- internals: runs ------------------------------------------------------------------------------------------

    /**
     * One run of each kind at a time; concurrent callers share it. Never rejects. `quiet` (the background network
     * re-run only): not shown as running until a caller that is not quiet joins it.
     */
    private startRun(kind: 'readiness' | 'network', work: () => Promise<void>, quiet = false): Promise<void> {
        const current = kind === 'readiness' ? this.readinessRun : this.networkRun;
        if (current) {
            if (!quiet && current === this.quietNetworkRun) this.quietNetworkRun = null;
            return current;
        }
        const run: Promise<void> = Promise.resolve()
            .then(work)
            .catch(err => this.warn(`${kind}-run`, `${kind} run failed: ${describe(err)}`))
            .finally(() => {
                if (kind === 'readiness') this.readinessRun = null;
                else this.networkRun = null;
                if (this.quietNetworkRun === run) this.quietNetworkRun = null;
            });
        if (kind === 'readiness') this.readinessRun = run;
        else {
            this.networkRun = run;
            this.quietNetworkRun = quiet ? run : null;
        }
        return run;
    }

    /** A readiness run: assignments (when online), disk, network checks and the clock, all bounded (~10 s). */
    private async runChecks(sync: boolean): Promise<void> {
        const tasks: Promise<unknown>[] = [this.startRun('network', () => this.runNetworkChecks())];
        if (sync && this.safeValue(() => this.uplink.internet().state, 'unknown') !== 'down') {
            tasks.push(
                this.bounded(Promise.resolve().then(() => this.uplink.syncNow()), this.tuning.syncTimeoutMs, undefined).catch(err =>
                    this.warn('sync-now', `readiness: the assignment pull did not complete: ${describe(err)}`),
                ),
            );
        }
        this.safe('measure', () => this.measureDisk());
        await Promise.all(tasks);
        this.lastReadinessRunAtMs = this.clock();
    }

    private async runNetworkChecks(): Promise<void> {
        const t = this.tuning.probeTimeoutMs;
        const host = urlHost(this.config.cloud.origin);
        const noProbe = (error: string): OpsDnsProbe => ({ ok: false, ms: null, resolver: null, error });
        const [internet, etabella, dns, defaultRoute] = await Promise.all([
            this.probeInternet(t),
            this.bounded(this.host.httpsProbe(this.config.cloud.pingUrl, t), t + 1_000, {
                ok: false,
                status: null,
                ms: null,
                serverDateMs: null,
                sentAtMs: this.clock(),
                receivedAtMs: null,
                error: 'timeout',
            } as OpsHttpsProbe),
            host ? this.bounded(this.host.resolve(host, t), t + 1_000, noProbe('timeout')) : Promise.resolve(noProbe('no-host')),
            // The room / reporter address of a box with none configured (user decision 2026-10-04).
            this.bounded(
                this.host.defaultRouteIpv4(OPS_DEFAULT_ROUTE_TIMEOUT_MS).catch(() => null),
                OPS_DEFAULT_ROUTE_TIMEOUT_MS + 1_000,
                null,
            ),
        ]);
        this.probes = { internet, etabella, dns };
        this.defaultRoute = defaultRoute;
        if (etabella.ok && etabella.serverDateMs !== null) this.lastHttpProbe = etabella;
        this.networkCheckedAtMs = this.clock();
        if (etabella.ok) this.etabellaFailingSinceMs = null;
        else if (this.etabellaFailingSinceMs === null) this.etabellaFailingSinceMs = etabella.sentAtMs;
        await this.checkClock();
    }

    private async probeInternet(timeoutMs: number): Promise<OpsDnsProbe> {
        const results = await Promise.all(
            OPS_INTERNET_PROBE_HOSTS.map(h => this.bounded(this.host.resolve(h, timeoutMs), timeoutMs + 1_000, { ok: false, ms: null, resolver: null, error: 'timeout' } as OpsDnsProbe)),
        );
        const ok = results.filter(r => r.ok).sort((a, b) => (a.ms ?? 0) - (b.ms ?? 0));
        return ok[0] ?? results[0] ?? { ok: false, ms: null, resolver: null, error: 'no-probe' };
    }

    private bounded<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
        let timer: NodeJS.Timeout | undefined;
        return Promise.race([
            work,
            new Promise<T>(resolve => {
                timer = setTimeout(() => resolve(fallback), ms);
                timer.unref?.();
            }),
        ]).finally(() => {
            if (timer) clearTimeout(timer);
        });
    }

    // ---- internals: heartbeat, measurements, alerts ----------------------------------------------------------------

    private subscribe(): void {
        this.unsubscribers.push(
            this.bus.subscribe('feed-stopped', e => this.feeds.stopped(e)),
            this.bus.subscribe('feed-resumed', e => this.feeds.resumed(e, this.safeValue(() => this.state.sessions.get(e.nSesid)?.cName ?? '', ''))),
            this.bus.subscribe('alert', a => this.onAlert(a)),
            this.bus.subscribe('lan-viewers', e => this.lanViewers.set(e.nSesid, e.count)),
            this.bus.subscribe('certificate-installed', () => this.safe('device-health', () => this.publishDeviceHealth(this.clock()))),
        );
    }

    private onAlert(alert: EdgeAlert): void {
        this.recentAlerts.push(alert);
        if (this.recentAlerts.length > OPS_ALERT_BUFFER) this.recentAlerts.splice(0, this.recentAlerts.length - OPS_ALERT_BUFFER);
        this.feeds.noteAlert(alert, this.safeValue(() => this.uplink.status().online, false));
    }

    private heartbeat(): void {
        if (this.closed) return;
        const now = this.clock();
        this.lastHeartbeatAtMs = now;
        this.safe('measure', () => this.measureDisk());
        this.safe('device-health', () => this.publishDeviceHealth(now));
        this.safe('status-heartbeat', () => {
            for (const s of this.state.sessions.list()) this.bus.publish('session-status', { nSesid: s.nSesid, cause: 'heartbeat', atMs: now });
        });
        this.safe('seq-floor', () => this.persistSeq());
        this.safe('kernel-watch', () => this.watchKernel(now));
        this.safe('certificate', () => this.checkCertificate(now));
        this.safe('disk-alert', () => this.checkDiskAlert(now));
    }

    private measureDisk(): void {
        this.disk = this.host.disk(this.config.paths.dataDir);
        this.journalBytes = this.host.dirBytes(this.config.paths.journalDir);
        this.captureBytes = this.host.dirBytes(this.config.paths.captureDir);
    }

    private deviceHealth(nowMs: number): EdgeDeviceHealth {
        const cert = this.safeValue(() => this.uplink.certificate(), null);
        const reading = this.clockReading;
        return {
            atMs: nowMs,
            diskFreeMB: this.disk?.freeMB ?? null,
            journalBytes: this.journalBytes,
            captureBytes: this.captureBytes,
            clockOffsetMs: reading ? Math.round(reading.offsetMs) : null,
            chronySynced: reading?.source === 'chrony' ? reading.synced : null,
            certDaysLeft: cert?.daysLeft ?? null,
            upsOnBattery: this.upsOnBattery,
        };
    }

    private publishDeviceHealth(nowMs: number): void {
        this.bus.publish('device-health', this.deviceHealth(nowMs));
    }

    private persistSeq(): void {
        if (this.seqLast === null || this.seqLast <= this.seqPersisted) return;
        this.state.counters.raise('lan-seq', this.seqLast);
        this.seqPersisted = this.seqLast;
    }

    /** lastSafe lines, feed incidents vs the kernel, and the DR12 "Support alerted" FEED_STOPPED alert. */
    private watchKernel(nowMs: number): void {
        const views = this.kernel.sessions();
        for (const v of views) if (v.durability === 'ok' && !v.journalCorrupt) this.lastSafeLine.set(v.nSesid, v.lastLine);
        const tx = this.kernel.transmitterLink();
        this.feeds.reconcile(views, nowMs, id => this.safeValue(() => this.state.sessions.get(id)?.cName ?? '', ''), tx.mode, this.tuning.heartbeatMs);
        const online = this.safeValue(() => this.uplink.status().online, false);
        for (const incident of this.feeds.incidents()) {
            if (incident.supportAlertedAtMs !== null || nowMs - incident.feedStoppedAtMs < OPS_FEED_STOPPED_ALERT_AFTER_MS) continue;
            // Raise once; raise again once the uplink is online if the first one could not reach support.
            if (incident.alertRaisedAtMs !== null && !online) continue;
            if (incident.alertRaisedAtMs !== null && incident.alertRaisedAtMs >= nowMs) continue;
            this.feeds.markAlertRaised(incident.nSesid, nowMs);
            this.alert('P2', 'FEED_STOPPED', `the transmitter feed of session ${incident.nSesid} stopped`, nowMs, incident.nSesid, {
                feedStoppedAtMs: incident.feedStoppedAtMs,
                gapFromMs: incident.gapFromMs,
                mode: incident.mode,
            });
        }
    }

    private checkCertificate(nowMs: number): void {
        const cert = this.uplink.certificate();
        if (cert.state !== 'ok' || cert.daysLeft === null) return;
        const day = this.today(nowMs);
        if (cert.daysLeft < EDGE_CERT_ALERT_DAYS) {
            this.alertOncePerDay('P2', 'CERTIFICATE_EXPIRING', day, `the LAN certificate expires in ${cert.daysLeft} days`, nowMs, { daysLeft: cert.daysLeft });
        }
        if (cert.daysLeft < EDGE_CERT_PAGE_DAYS && this.state.sessions.list().some(s => s.sealedAtMs === null)) {
            this.alertOncePerDay('P1', 'CERTIFICATE_EXPIRING', day, `the LAN certificate expires in ${cert.daysLeft} days and the box holds an unsealed session`, nowMs, { daysLeft: cert.daysLeft });
        }
    }

    private checkDiskAlert(nowMs: number): void {
        if (this.disk && this.disk.freeMB < OPS_DISK_ALERT_MB) {
            this.alertOncePerDay('P2', 'DISK_LOW', this.today(nowMs), `only ${this.disk.freeMB} MB free on the data disk`, nowMs, { freeMB: this.disk.freeMB });
        }
    }

    /** The clock (chrony → the uplink's cloud clock → the last etabella.net Date header) and the UPS. */
    private checkClock(): Promise<void> {
        if (this.closed) return Promise.resolve();
        if (!this.clockRun) {
            this.clockRun = this.measureClockAndUps()
                .catch(err => this.warn('clock', `clock check failed: ${describe(err)}`))
                .finally(() => (this.clockRun = null));
        }
        return this.clockRun;
    }

    private async measureClockAndUps(): Promise<void> {
        const [chrony, ups, windows] = await Promise.all([
            this.bounded(this.host.chrony().catch(() => null), 5_000, null),
            this.bounded(this.host.upsOnBattery().catch(() => null), 5_000, null),
            this.bounded(this.host.windowsTimeSynced().catch(() => null), 5_000, null),
        ]);
        const now = this.clock();
        // The cloud reading's time is on the PC clock (user decision 2026-10-05): its age is too, never etabella.net time
        // (a PC clock 20 min slow would make a 2 s old reading look 20 min old).
        const rawNow = this.rawNow();
        this.clockCheckedAtMs = now;
        this.windowsSynced = windows;
        const cloud = this.safeValue(() => (this.uplink as UplinkPort & UplinkCloudClock).cloudClockOffset?.() ?? null, null);
        // A reading in the PC clock's future (the clock went back since) is stale, not fresh (review 2026-10-05): its
        // offset no longer describes the PC clock, and a step from it would set the clock wrong.
        const cloudAgeMs = cloud ? rawNow - cloud.atMs : Number.NaN;
        const cloudFresh = !!cloud && Number.isFinite(cloud.offsetMs) && Number.isFinite(cloudAgeMs) && cloudAgeMs >= 0 && cloudAgeMs <= OPS_CLOUD_CLOCK_MAX_AGE_MS;
        this.cloudOffset = cloudFresh ? { offsetMs: Math.round(cloud.offsetMs), atMs: cloud.atMs } : null;
        let reading: OpsClockReading | null = chrony;
        // No chrony (a Windows box): the offset from the cloud, synced when under 1 s. Windows Time only vetoes, never
        // vouches (review 2026-10-04): "Leap 3 / Local CMOS Clock" is not synced however small the offset (user decision
        // 2026-10-04), but its "synced" does not excuse a measured drift (it syncs every few hours, drifting between).
        if (!reading && cloudFresh) reading = { offsetMs: cloud.offsetMs, synced: windowsVetoedSync(windows, cloud.offsetMs), source: 'cloud' };
        if (!reading && this.lastHttpProbe) {
            const offset = httpDateOffsetMs(this.lastHttpProbe);
            if (offset !== null) reading = { offsetMs: offset, synced: false, source: 'http-date' };
        }
        this.clockReading = reading;
        this.onClockReading(reading, now);
        this.onUps(ups, now);
        if (cloudFresh) await this.maybeStepClock(cloud, now, rawNow);
    }

    /**
     * Spec §10 #8 cloud-time fallback (§3.2 ops "cloud-time fallback for chrony"): step the clock to the cloud's time
     * when chrony has been unsynced for over an hour, or the box is more than a minute off the cloud. Production boxes
     * only, a fresh low-RTT cloud reading only, at most once per OPS_CLOCK_STEP_EVERY_MS. The reading's age and the
     * target are on the PC clock (`rawNowMs`); once stepped, etabella.net time goes back to the PC clock until the next
     * hello, so the correction is not applied twice (user decision 2026-10-05).
     */
    private async maybeStepClock(cloud: { readonly offsetMs: number; readonly rttMs: number | null; readonly atMs: number }, nowMs: number, rawNowMs: number): Promise<void> {
        if (this.config.mode !== 'production' || this.closed) return;
        if (rawNowMs - cloud.atMs > OPS_CLOCK_STEP_MAX_AGE_MS || (cloud.rttMs !== null && cloud.rttMs > OPS_CLOCK_STEP_MAX_RTT_MS)) return;
        if (this.lastClockStepAtMs !== null && nowMs - this.lastClockStepAtMs < OPS_CLOCK_STEP_EVERY_MS) return;
        const unsyncedLong = this.unsyncedSinceMs !== null && nowMs - this.unsyncedSinceMs > OPS_CLOCK_UNSYNCED_PAGE_MS;
        const farOff = Math.abs(cloud.offsetMs) > OPS_CLOCK_ALERT_P1_MS;
        if (!unsyncedLong && !farOff) return;
        if (Math.abs(cloud.offsetMs) < 1_000) return; // nothing worth stepping
        this.lastClockStepAtMs = nowMs;
        const target = this.rawNow() - cloud.offsetMs;
        const stepped = await this.host.stepClock(target).catch(() => false);
        if (stepped) this.serverTime?.reset();
        const message = stepped
            ? `stepped the box clock by ${Math.round(-cloud.offsetMs)} ms to the cloud's time`
            : `could not step the box clock (off by ${Math.round(cloud.offsetMs)} ms from the cloud's time)`;
        if (stepped) this.logger.warn(message);
        else this.warn('clock-step', message);
        this.alert('P2', stepped ? 'CLOCK_STEPPED' : 'CLOCK_STEP_FAILED', message, this.clock(), null, {
            offsetMs: Math.round(cloud.offsetMs),
            reason: farOff ? 'offset' : 'unsynced',
        });
    }

    private onClockReading(reading: OpsClockReading | null, nowMs: number): void {
        // The Connectivity Log's clock rows follow the verdict's clock problem (user decision 2026-10-05): "not synced"
        // while new lines use the box's own clock or the PC clock is 60 s or more off, not for a PC clock Windows calls
        // unsynced while the lines follow etabella.net time.
        const facts = this.clockFacts();
        const inSync = facts.source !== 'box' && !(facts.offsetMs !== null && Math.abs(facts.offsetMs) >= EDGE_CLOCK_FAR_OFFSET_MS);
        if (this.clockInSync !== inSync && !(this.clockInSync === null && inSync)) {
            this.safe('clock-log', () =>
                this.state.connectivityLog.append({
                    atMs: nowMs,
                    event: inSync ? 'success' : 'error',
                    source: 'box',
                    code: inSync ? 'clock-synced' : 'clock-unsynced',
                    problem: !inSync,
                    nSesid: null,
                    sessionName: null,
                    peer: null,
                    actor: null,
                    data: {},
                }),
            );
        }
        this.clockInSync = inSync;
        if (!reading) return;
        const abs = Math.abs(reading.offsetMs);
        this.unsyncedSinceMs = reading.synced ? null : this.unsyncedSinceMs ?? nowMs;
        const day = this.today(nowMs);
        if (abs > OPS_CLOCK_ALERT_P1_MS) this.alertOncePerDay('P1', 'CLOCK_OFFSET', day, `the box clock is off by ${Math.round(abs / 1000)} s`, nowMs, { offsetMs: Math.round(reading.offsetMs), source: reading.source });
        else if (abs > OPS_CLOCK_ALERT_P2_MS) this.alertOncePerDay('P2', 'CLOCK_OFFSET', day, `the box clock is off by ${Math.round(abs / 1000)} s`, nowMs, { offsetMs: Math.round(reading.offsetMs), source: reading.source });
        // CLOCK_UNSYNCED pages only while the box is not following etabella.net time (user decision 2026-10-05): the
        // lines are corrected otherwise. On the box clock: "not synced" from Windows Time alone (w32tm Leap 3 / Local
        // CMOS Clock) while the cloud measures the clock within 1 s pages no one; chrony unsynced, the Date-header
        // fallback and a measured drift of 1 s or more page after an hour of it (spec §12); a Windows-only reading in
        // between starts that hour again (review 2026-10-04).
        const following = facts.source === 'etabella' || facts.source === 'saved';
        const windowsOnly = reading.source === 'cloud' && !reading.synced && this.windowsSynced === false && abs < EDGE_CLOCK_READY_MAX_OFFSET_MS;
        this.driftingSinceMs = reading.synced || windowsOnly || following ? null : this.driftingSinceMs ?? nowMs;
        if (this.driftingSinceMs !== null && nowMs - this.driftingSinceMs > OPS_CLOCK_UNSYNCED_PAGE_MS) {
            const caseView = this.safeValue(() => this.kernel.sessions().some(v => v.protocol === 'C' && v.endedAtMs === null), false);
            if (caseView) this.alertOncePerDay('P1', 'CLOCK_UNSYNCED', day, 'the box clock has been unsynced for over an hour with a CaseView session', nowMs, { sinceMs: this.driftingSinceMs });
        }
    }

    private onUps(onBattery: boolean | null, nowMs: number): void {
        const before = this.upsOnBattery;
        this.upsOnBattery = onBattery;
        if (onBattery === true && before !== true) this.alert('P2', 'UPS_ON_BATTERY', 'the UPS is running on battery', nowMs, null, null);
    }

    private alertOncePerDay(tier: 'P1' | 'P2', kind: string, day: string, message: string, nowMs: number, data: Record<string, unknown>): void {
        const key = `${kind}|${tier}|${day}`;
        if (this.alertedKeys.has(key)) return;
        this.alertedKeys.add(key);
        if (this.alertedKeys.size > 500) this.alertedKeys.delete(this.alertedKeys.values().next().value as string);
        this.alert(tier, kind, message, nowMs, null, data);
    }

    private alert(tier: 'P1' | 'P2', kind: string, message: string, nowMs: number, nSesid: string | null, data: Record<string, unknown> | null): void {
        this.safe('alert', () => this.bus.publish('alert', { source: 'ops', tier, critical: false, kind, message, atMs: nowMs, nSesid, data }));
    }

    // ---- internals: retention -------------------------------------------------------------------------------------

    private runRetention(): Promise<void> {
        if (this.closed) return Promise.resolve();
        if (!this.retentionRun) {
            this.retentionRun = this.retention()
                .catch(err => this.warn('retention', `retention failed: ${describe(err)}`))
                .finally(() => (this.retentionRun = null));
        }
        return this.retentionRun;
    }

    private async retention(): Promise<void> {
        const now = this.clock();
        const today = this.today(now);
        for (const s of this.state.sessions.list()) {
            if (this.closed) return;
            if (!purgeEligible(s, now)) continue;
            if (this.kernel.session(s.nSesid) !== null) continue; // the kernel still holds it
            const captures = this.state.heldCaptures.list({ nSesid: s.nSesid });
            if (captures.some(c => c.uploadedAtMs === null)) continue; // §10 #19: held captures first
            if (!SAFE_ID_RE.test(s.nSesid)) {
                this.warn(`purge-id:${s.nSesid}`, `not purging session "${s.nSesid}": unexpected id format`);
                continue;
            }
            this.state.sessions.purge(s.nSesid, now);
            this.seqBySession.delete(s.nSesid);
            this.venues.delete(s.nSesid);
            this.lastSafeLine.delete(s.nSesid);
            this.lanViewers.delete(s.nSesid);
            const targets = [this.inside(this.config.paths.journalDir, path.join(this.config.paths.journalDir, s.nSesid))];
            for (const c of captures) targets.push(this.inside(this.config.paths.captureDir, c.file));
            for (const target of targets) {
                if (!target) continue;
                try {
                    await this.host.remove(target);
                } catch (err) {
                    this.warn(`purge-files:${s.nSesid}`, `purged session ${s.nSesid} but could not delete ${target}: ${describe(err)}`);
                    this.alert('P2', 'PURGE_FILES_FAILED', `could not delete the files of purged session ${s.nSesid}`, now, s.nSesid, null);
                }
            }
            this.logger.log(`purged sealed session ${s.nSesid} (sealed ${new Date(s.sealedAtMs as number).toISOString()})`);
        }
        this.safe('prune-log', () => this.state.connectivityLog.pruneBefore(dayMinus(today, OPS_LOG_KEEP_DAYS)));
        this.safe('prune-audit', () => this.state.audit.pruneBefore(now - OPS_AUDIT_KEEP_MS));
        this.safe('prune-operator-codes', () => this.state.operatorCodes.purgeBefore(today));
        this.safe('prune-revocations', () => this.state.revocations.prune(now));
    }

    /** `target` when it lies strictly inside `dir`; null otherwise (never delete outside the box's data dirs). */
    private inside(dir: string, target: string): string | null {
        const root = path.resolve(dir);
        const full = path.resolve(target);
        const rel = path.relative(root, full);
        return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? full : null;
    }

    // ---- internals: diagnostics sections ---------------------------------------------------------------------------

    private manifest(nowMs: number): Record<string, unknown> {
        const identity = this.safeValue(() => this.state.identity.get(), null);
        return {
            generatedAtMs: nowMs,
            box: {
                nEdgeid: identity?.nEdgeid ?? null,
                status: identity?.status ?? null,
                name: this.config.box.name,
                label: this.config.box.label,
                venueLabel: this.config.box.venueLabel,
                timeZone: this.config.box.timeZone,
                domain: this.config.box.domain,
                mode: this.config.mode,
                cloudOrigin: this.config.cloud.origin,
            },
            versions: {
                sw: this.config.release.version,
                backendCommit: this.config.release.backendCommit,
                feCommit: this.config.release.feCommit,
                parserVer: FEED_PARSE_VERSION,
                edgeProto: EDGE_PROTO,
                edgeFmt: EDGE_FMT,
                contract: EDGE_CONTRACT_VERSION,
                node: process.version,
            },
            uptimeSec: this.safeValue(() => this.host.uptimeSec(), null),
            features: this.config.features,
        };
    }

    private statusSection(): Record<string, unknown> {
        return {
            operator: this.operatorStatus(),
            internet: this.uplink.internet(),
            cloudLink: this.uplink.cloudLink(),
            uplink: this.uplink.status(),
            sessions: this.state.sessions
                .list()
                .map(s => this.sessionStatus(s.nSesid, { includeOperator: false }))
                .filter(s => s !== null),
        };
    }

    private sessionsSection(): unknown[] {
        return this.state.sessions.list({ includePurged: true }).map(s => {
            const view = this.safeValue(() => this.kernel.session(s.nSesid), null);
            const sync = this.safeValue(() => this.uplink.session(s.nSesid), null);
            return {
                nSesid: s.nSesid,
                nCaseid: s.nCaseid,
                cName: s.cName,
                dStartDt: s.dStartDt,
                tz: s.tz,
                nLines: s.nLines,
                protocol: s.protocol,
                epoch: s.epoch,
                rebaseSeq: s.rebaseSeq,
                parserVer: s.parserVer,
                fmt: s.fmt,
                hasRoute: s.route !== null,
                nPartNo: s.nPartNo,
                nPrevPartSesid: s.nPrevPartSesid,
                next: s.next,
                cloudOp: s.cloudOp,
                deleted: s.deleted,
                localState: s.localState,
                listed: s.listed,
                assignedAtMs: s.assignedAtMs,
                updatedAtMs: s.updatedAtMs,
                firstLineAtMs: s.firstLineAtMs,
                endRequestedAtMs: s.endRequestedAtMs,
                endedAtMs: s.endedAtMs,
                sealedAtMs: s.sealedAtMs,
                sealState: s.sealState,
                purgedAtMs: s.purgedAtMs,
                kernel: view
                    ? {
                          localState: view.localState,
                          phase: view.phase,
                          feed: view.feed,
                          protocol: view.protocol,
                          mode: view.mode,
                          catConnected: view.catConnected,
                          peer: view.peer,
                          heldPeers: view.heldPeers,
                          lockout: view.lockout,
                          bytesIn: view.bytesIn,
                          lastByteAtMs: view.lastByteAtMs,
                          firstLineAtMs: view.firstLineAtMs,
                          lastLineAtMs: view.lastLineAtMs,
                          feedStoppedAtMs: view.feedStoppedAtMs,
                          lastLine: view.lastLine,
                          endRequestedAtMs: view.endRequestedAtMs,
                          endedAtMs: view.endedAtMs,
                          rev: view.rev,
                          totalLines: view.totalLines,
                          page: view.page,
                          raw: { headSeq: view.raw.headSeq, durableSeq: view.raw.durableSeq },
                          durability: view.durability,
                          degradedSinceMs: view.degradedSinceMs,
                          journalCorrupt: view.journalCorrupt,
                          recovering: view.recovering,
                          incidents: view.incidents,
                          parseErrors: view.parseErrors,
                          lastAudit: view.lastAudit,
                      }
                    : null,
                uplink: sync
                    ? {
                          uplinkState: sync.uplinkState,
                          verdict: sync.verdict,
                          cloudAppliedRev: sync.cloudAppliedRev,
                          appliedRawSeq: sync.appliedRawSeq,
                          rawAckedSeq: sync.rawAckedSeq,
                          dirtyPages: sync.dirtyPages,
                          lagLines: sync.lagLines,
                          lagBytes: sync.lagBytes,
                          lagSec: sync.lagSec,
                          lastSyncedAtMs: sync.lastSyncedAtMs,
                          frozenAtMs: sync.frozenAtMs,
                          frozenReason: sync.frozenReason,
                          heldShrinkId: sync.heldShrinkId,
                          sealState: sync.sealState,
                      }
                    : null,
                incidents: this.safeValue(
                    () => this.state.incidents.list(s.nSesid).map(i => ({ kind: i.kind, level: i.level, seq: i.seq, atMs: i.atMs, fromSeq: i.fromSeq ?? null, toSeq: i.toSeq ?? null })),
                    [],
                ),
                heldCaptures: this.safeValue(
                    () =>
                        this.state.heldCaptures
                            .list({ nSesid: s.nSesid })
                            .map(c => ({ id: c.id, peer: c.peer, fromMs: c.fromMs, toMs: c.toMs, bytes: c.bytes, uploadedAtMs: c.uploadedAtMs, nOrphanid: c.nOrphanid })),
                    [],
                ),
            };
        });
    }

    private certificateSection(): Record<string, unknown> {
        const cert = this.uplink.certificate();
        return {
            state: cert.state,
            daysLeft: cert.daysLeft,
            coversHost: cert.coversHost,
            checkedAtMs: cert.checkedAtMs,
            notBeforeMs: cert.info?.notBeforeMs ?? null,
            notAfterMs: cert.info?.notAfterMs ?? null,
            hosts: cert.info?.hosts ?? [],
            problem: cert.problem,
        };
    }

    /** Connectivity Log rows created or updated in the last 24 h, newest first (capped). */
    private recentLog(nowMs: number): ConnectivityLogRow[] {
        const from = nowMs - OPS_DIAGNOSTICS_LOG_WINDOW_MS;
        const days = [...new Set([this.today(nowMs), this.today(from)])];
        const rows: ConnectivityLogRow[] = [];
        for (const day of days) {
            let before: string | undefined;
            for (let page = 0; page < 100 && rows.length < OPS_DIAGNOSTICS_MAX_LOG_ROWS; page++) {
                const result = this.state.connectivityLog.page({ day, limit: CONNECTIVITY_LOG_MAX_LIMIT, ...(before ? { before } : {}) }, this.today(nowMs));
                for (const row of result.rows) if (row.updatedAtMs >= from && row.atMs <= nowMs) rows.push(row);
                if (!result.nextBefore || result.rows.every(r => r.updatedAtMs < from)) break;
                before = result.nextBefore;
            }
        }
        return rows.sort((a, b) => b.atMs - a.atMs || b.updatedAtMs - a.updatedAtMs).slice(0, OPS_DIAGNOSTICS_MAX_LOG_ROWS);
    }

    // ---- internals: audit, errors ---------------------------------------------------------------------------------

    private audit(
        action: EdgeAuditAction,
        principal: EdgePrincipal,
        outcome: string,
        ctx: EdgeRequestContext | null,
        extra: { readonly nSesid?: string | null; readonly target?: string | null; readonly data?: Record<string, unknown> | null } = {},
    ): void {
        try {
            this.state.audit.append({
                atMs: this.clock(),
                action,
                actor: actorOf(principal),
                outcome,
                nSesid: extra.nSesid ?? null,
                target: extra.target ?? null,
                ip: ctx?.ip ?? null,
                deviceHash: null,
                data: extra.data ?? null,
            });
        } catch (err) {
            this.warn(`audit:${action}`, `could not audit ${action}: ${describe(err)}`);
        }
    }

    private safe(label: string, fn: () => unknown): void {
        try {
            fn();
        } catch (err) {
            this.warn(label, `${label} failed: ${describe(err)}`);
        }
    }

    private safeValue<T>(fn: () => T, fallback: T): T {
        try {
            return fn();
        } catch {
            return fallback;
        }
    }

    /** At most one warning per label per minute (a broken dependency must not flood the log every heartbeat). */
    private warn(label: string, message: string): void {
        const now = Date.now();
        const last = this.lastWarnAt.get(label);
        if (last !== undefined && now - last < 60_000) return;
        this.lastWarnAt.set(label, now);
        if (this.lastWarnAt.size > 1000) this.lastWarnAt = new Map([...this.lastWarnAt].slice(-500));
        this.logger.warn(message);
    }
}
