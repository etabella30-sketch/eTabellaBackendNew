/**
 * UplinkPort (ports/uplink.port.ts): the box → cloud link (spec §5.3–§5.7, D17–D19, D22, D24).
 *
 * - Transport: socket.io-client to `cloud.uplinkUrl + uplinkNamespace` (`/edge`), websocket first then polling
 *   (socket.io-client 4.7 has no `tryAllTransports`; consecutive attempts alternate the transport list, and the flag
 *   is passed for 4.8+), our own reconnect loop (backoff 1 → 30 s, full jitter, reset after 60 s stable), every
 *   request an `emitWithAck` with a 15 s timeout; a lost ack reconnects and the hello diff resumes (no persisted ack
 *   state, §5.5).
 * - Auth (clock-free, §5.3): GET `<realtimeApiUrl>/edge/v1/challenge?edgeId` → nonce (a fresh one per attempt); the
 *   device key (P-256 software key on pilot boxes, `bTpmKey=false`, D2) signs `nonce‖edgeId‖bootId`;
 *   `auth:{edgeId, nonce, bootId, sig}`. `connect_error` / `c.refused` codes (REVOKED, KEY_UNCONFIRMED, NOT_ENROLLED,
 *   UNAUTHORIZED, DUP_IDENTITY, QUARANTINED, …) become identity state, Connectivity Log rows and alerts.
 * - `e.hello` with every open session's state; a refusal (`{ok:false, code}`) is identity state too. Per verdict:
 *   continue / end (resume after the box's half of the checks, `boxCheckHelloReply` + `resumeFromHello`, D19),
 *   recover (`KernelPort.recoverFromCloud` over `e.rawpull`; a failure is RECOVER_FAILED, P2, once per session and
 *   cause; a corrupt journal RECOVER cannot repair — refused `cloud-behind` / `session-ended` RECOVER_ESCALATE_AFTER
 *   times in a row — is frozen with one P1 JOURNAL_UNRECOVERABLE naming the admin's next step, MR-4), frozen (push
 *   nothing, P1, local state 'frozen'), unknown (push nothing), sealed.
 * - A sequential pump in the §5.6 order (degraded raw, live rounds round-robin, raw tail, catch-up round parts, raw
 *   backlog, seals), one round in flight per session (multi-part, ≤ limits.maxPart), BUSY / STALE / ROOT /
 *   LINEAGE / REGRESS / FORK / HELD_SHRINK handled per `classifyRoundReply`, a per-edge token bucket.
 * - The raw lane from the cursor (`KernelPort.readRaw`, undurable records too in degraded mode, MR-5) and its acks.
 * - `e.seal` signed with the device key over `sealSigningPayload`, once the cloud holds the final state.
 * - Hello side effects: JWKS → StatePort.jwks; revocations → StatePort.revocations (BOX receipt time) +
 *   `access-revoked`; assignments (the full `assignmentSnapshot` when the cloud sends it, else `assignments`) →
 *   StatePort + `assignments-changed`, then `e.ready` once per armed session.
 * - `c.assign` / `c.need` / `c.cmd` / `c.refused` handlers, `c.marks` (live mark sync, user decision 2026-10-05: no
 *   ack; checked, then `marks-changed` on the bus for a session the box holds), `e.status` every 5 s, the internet
 *   hysteresis, the operator-chip segment (`cloudLink`), Connectivity Log `cloud-*` / `internet-*` rows (connect
 *   retries collapsed).
 * - Enrolment (§3.4), held-capture upload (automatic while online; `rt-edge capture upload` for a manual retry), the
 *   operator-code relay (O-10; switched off with `features.operatorCode`, the v1 default) and the LAN certificate
 *   (§8.3).
 * Room codes and the operator code (switched off in v1, build decision "email sign-in only") are never needed here:
 * the uplink never reads their repositories, and a delivered operator-code hash is dropped while the feature is off.
 */
import { createHash, generateKeyPairSync, randomBytes, scrypt as scryptCb } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { io as ioClient, Socket } from 'socket.io-client';

import {
    ACK_TIMEOUT_MS,
    boxCheckHelloReply,
    BoxRoundAction,
    BuiltRound,
    buildRound,
    CATCH_UP_ROUND_PAGES,
    CAssign,
    classifyRoundReply,
    cMarksProblem,
    CloudView,
    CNeed,
    CutterView,
    dirtyPages,
    EDGE_FMT,
    EDGE_PROTO,
    EDGE_PROTO_MIN_SUPPORTED,
    EdgeCaptureReply,
    EdgeEvent,
    EdgeHello,
    EdgeHelloReply,
    EdgeHelloReplySession,
    EdgeHelloSession,
    EdgeIncident,
    EdgeRawPullReply,
    EdgeSeal,
    EdgeStatus,
    EdgeStatusSession,
    HelloVerdict,
    MAX_PART_BYTES,
    needsRound,
    PageTooLargeError,
    parseCMarks,
    RawAck,
    RawNack,
    RawPosition,
    resumeFromHello,
    ResumeRefusedError,
    rootDigest,
    RoundLineage,
    RoundReply,
    RoundSource,
    sealClaims,
    SealReply,
    sealSigningPayload,
    UplinkState,
} from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { decodeRecordAt, RecordType } from '@app/rt-ingest';

import type { CloudLinkState, CloudLinkStatus, CloudUploadError, EdgeInternetStatus, EdgeLinkFailure } from '../contracts';
import { EDGE_TIMING, normalizeOperatorCode, OPERATOR_CODE_RE } from '../contracts';
import {
    AssignmentsDiff,
    BOX_CONFIG,
    BoxConfig,
    boxDay,
    boxHostname,
    BoxIdentityRecord,
    certificateRenewalDue,
    certificateStatus,
    EDGE_CERT_CHECK_INTERVAL_MS,
    EDGE_CERT_INSPECT_CACHE_MS,
    EDGE_CERT_PAGE_DAYS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EDGE_RUN_MODE,
    EDGE_SERVER_TIME,
    EdgeAlert,
    EdgeBusEventName,
    EdgeBusEvents,
    EdgeCertificateStatus,
    EdgeClock,
    EdgeDeviceHealth,
    EdgeEventBus,
    EdgePortError,
    EdgePrincipal,
    EdgeRunMode,
    EdgeTlsError,
    KERNEL_PORT,
    KernelPort,
    KernelSessionView,
    RelayedOperatorCode,
    SERVER_TIME_JUMP_MS,
    ServerTime,
    sessionArmable,
    SessionStatusCause,
    STATE_PORT,
    StatePort,
    Unsubscribe,
    UplinkEnrolResult,
    UplinkLinkStatus,
    UplinkPort,
    UplinkSessionSync,
} from '../ports';
import { isSessionGone } from '../auth/session-facts';
import { assignmentSnapshotFrom, sessionDeliveryFrom } from './assignments';
import { CERT_INSTALL_LOCK_STALE_MS, CertificateInstallBusyError, CertificateRefusedError, checkCertificatePair, completeCertificateInstall, installCertificatePair } from './cert-install';
import { CloudHttp, CloudHttpResponse, CloudNetworkError, isNoInternet, nodeCloudHttp } from './cloud-http';
import { buildCsr } from './csr';
import { archiveUrlPayload, certRequestPayload, DeviceKey, edgeAuthPayload } from './device-key';
import { Backoff, InternetTracker, monotonicMs, pickUplinkJob, rawStarveMs, TokenBucket, UplinkCandidate } from './link-control';
import { SocketFactory, UPLINK_DEFAULTS, UPLINK_OPTIONS, UplinkOptions } from './uplink-options';

/**
 * Uplink alerts that also go to the cloud in `e.status.alerts` (the others describe the link to the cloud itself,
 * which the cloud already knows). CERTIFICATE_RENEWAL_FAILED (review 5): the cloud is the one that can fix it.
 * JOURNAL_UNRECOVERABLE (MR-4): the box froze the session itself, so only the box knows why; the admin who splits or
 * force-closes works on etabella.net.
 */
export const FORWARDED_UPLINK_ALERTS: ReadonlySet<string> = new Set(['CERTIFICATE_RENEWAL_FAILED', 'JOURNAL_UNRECOVERABLE']);

interface SyncSession {
    readonly nSesid: string;
    epoch: number;
    rebaseSeq: number | null;
    verdict: HelloVerdict | null;
    helloOk: boolean;
    uplinkState: UplinkState;
    /** Push nothing: 'unknown' (cloud does not know it), 'FENCED' / 'NOT_BOUND' (round refusals), 'quarantined'. */
    stopped: string | null;
    cloud: CloudView | null;
    appliedRev: number;
    appliedRawSeq: number | null;
    lineage: RoundLineage;
    rawCursor: number;
    rawAcked: RawPosition;
    cloudRoot: string | null;
    lastRound: { rawSeqThrough: number; rawHashThrough: string } | null;
    round: { built: BuiltRound; next: number; viewRev: number } | null;
    /** Monotonic ms (link-control `monotonicMs`): no round before this (BUSY / an error reply). */
    busyUntil: number;
    /** Monotonic ms: no raw batch before this (a `rate` / `crc` nack, an error reply). */
    rawBusyUntil: number;
    /** Monotonic ms since raw records have been waiting for a send (the raw floor, review 35); null when none wait. */
    rawWaitSince: number | null;
    heldShrinkId: string | null;
    /** Monotonic ms of the held-shrink reply (the re-hello interval). */
    heldAtMs: number | null;
    frozenAtMs: number | null;
    frozenReason: string | null;
    lastSyncedAtMs: number | null;
    /**
     * Cuts not yet confirmed by the cloud, oldest first (lagSec). After a restart the hello seeds the first one from the
     * journal (`seedLagFromJournal`, critic item 21).
     */
    pendingCuts: Array<{ rev: number; atMs: number }>;
    /** Raw heads not yet acked, as first seen, oldest first (the raw lane's lagSec, critic item 22). */
    rawSeen: RawSeen[];
    bytesPerRecord: number;
    sealState: 'K' | 'W' | null;
    /** Monotonic ms: the next seal attempt after an incomplete reply. */
    sealRetryAt: number;
    recovering: boolean;
    catchingUpLogged: boolean;
    /** The last RECOVER_FAILED raised for this session (one alert per cause, B1): `atMono` is monotonic ms. */
    recoverAlert: { cause: string; atMono: number } | null;
    /** Consecutive RECOVER refusals that prove the cloud cannot repair a corrupt journal (MR-4 escalation). */
    recoverRefusals: number;
    /** Set once those refusals froze the session for an admin (MR-4): no RECOVER, no new alert, until the journal is whole. */
    recoverExhausted: { readonly reason: string; readonly atMs: number } | null;
}

/**
 * RECOVER_FAILED (P2) is raised once per session and cause (the refusal reason, or 'error' for a pull that threw), and
 * again only when the cause changes or after this long: a hello every minute used to raise it every minute.
 */
export const RECOVER_FAILED_REALERT_MS = 60 * 60_000;
/**
 * MR-4 escalation: a session whose journal is corrupt (JOURNAL_CORRUPT) and whose RECOVER the box has seen refused
 * this many times in a row because the cloud holds nothing to repair it with (`cloud-behind`), or because the session
 * ended (`session-ended`: RECOVER never runs for an ending or ended session), cannot be repaired by RECOVER. It is
 * frozen for an admin (P1 JOURNAL_UNRECOVERABLE with the next step in plain words) instead of a P2 every hello.
 */
export const RECOVER_ESCALATE_AFTER = 3;

interface Limits {
    maxPart: number;
    /** The raw lane's floor (hello `limits.rawMinBps`); null before the cloud sent one. */
    rawMinBps: number | null;
}

/** A hello the cloud refused (edge-sync.service `EdgeHelloRefusal`). */
interface HelloRefusal {
    readonly ok: false;
    readonly code: string;
    readonly message?: string;
}

type Mutable<T> = { -readonly [K in keyof T]?: T[K] };

const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err));
const offline = (message: string): EdgePortError<'offline'> => new EdgePortError('offline', message, { offline: true });

class UplinkOfflineError extends Error {
    constructor(message = 'the uplink is not connected') {
        super(message);
        this.name = 'UplinkOfflineError';
    }
}

/**
 * etabella.net's answer to `archive-url` when no archive is configured for venue uploads (realtime-server
 * edge.controller.ts, 503): the held-capture upload then backs off (`captureNotConfiguredRetryMs`).
 */
export const CAPTURE_NOT_CONFIGURED = 'NOT_CONFIGURED';

/**
 * The cloud's code in a refused edge HTTP answer. realtime-server's global HttpErrorFilter reshapes every
 * HttpException to `{statusCode, message, detailedError}`, so the edge routes' `{msg:-1, value, cCode}` arrives only
 * inside `detailedError`, a JSON string (edge-apply.port.ts note 10). Read there first, then the plain body. Null when
 * neither carries one.
 */
export function cloudErrorCode(body: Readonly<Record<string, unknown>>): string | null {
    const pick = (o: Readonly<Record<string, unknown>> | null): string | null => {
        if (!o) return null;
        for (const key of ['cCode', 'error'] as const) {
            const v = o[key];
            if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return null;
    };
    let inner: Record<string, unknown> | null = null;
    const raw = body.detailedError;
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
        try {
            const parsed: unknown = JSON.parse(raw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) inner = parsed as Record<string, unknown>;
        } catch {
            inner = null;
        }
    }
    return pick(inner) ?? pick(body);
}

/** How much journal a resume reads at most to find the first DATA record past what the cloud applied (item 21). */
const JOURNAL_SEED_READ_BYTES = 64 * 1024;

/** Once the box has edge-token keys, the fallback read (`fetchTokenKeys`) runs at most this often (key rotation). */
const TOKEN_KEYS_FALLBACK_EVERY_MS = 10 * 60_000;

/** Connection-level refusal codes the cloud may send (connect_error message, `c.refused`, hello `{ok:false}`). */
const KEY_REFUSAL_RE = /UNAUTHORI[SZ]ED|KEY_REFUSED|KEY_UNCONFIRMED|NOT_CONFIRMED|NOT_ENROLLED|BAD_SIGNATURE|FORBIDDEN|UNKNOWN_EDGE|NOT_ACTIVE/;

@Injectable()
export class EdgeUplink implements UplinkPort {
    private readonly logger = new Logger('EdgeUplink');
    /** The fallback read of the edge-token keys in flight, and when the last one succeeded (`fetchTokenKeys`). */
    private tokenKeysFetch: Promise<void> | null = null;
    private tokenKeysFetchedAt = 0;
    /** The last fallback-read failure logged, so a hello every few seconds does not repeat the same warning. */
    private tokenKeysWarned: string | null = null;
    private readonly opts: UplinkOptions;
    private readonly io: SocketFactory;
    private readonly http: CloudHttp;
    private readonly random: () => number;
    /** Pacing, backoff and retry intervals (review 25): never the wall clock, which ops may step. */
    private readonly mono: () => number;
    private readonly bootId = randomBytes(16).toString('hex');
    private readonly backoff: Backoff;
    private readonly internetTracker: InternetTracker;
    private readonly budget: TokenBucket;
    private readonly syncs = new Map<string, SyncSession>();
    private readonly lanViewers = new Map<string, number>();
    private readonly recentAlerts: EdgeAlert[] = [];
    private readonly unsubscribes: Unsubscribe[] = [];
    private readonly readyAcked = new Set<string>();
    private readonly readySending = new Set<string>();
    private readonly startedAtMs: number;

    private started = false;
    private closed = false;
    private socket: Socket | null = null;
    private gen = 0;
    private connecting = false;
    private connectTimer: NodeJS.Timeout | null = null;
    private timers: NodeJS.Timeout[] = [];
    private helloDone = false;
    private helloRunning: Promise<boolean> | null = null;
    private helloSessions = new Set<string>();
    private helloRefusal: string | null = null;
    /** Monotonic ms of the last completed hello reply (the re-hello cadence); null before the first. */
    private lastHelloAt: number | null = null;
    private lastCheckedAt: number;
    private lastSyncAt: number | null = null;
    private etabellaOk = false;
    private probing = false;
    /** Monotonic ms of the last reachability probe; null before the first. */
    private lastProbeAt: number | null = null;
    private pumping = false;
    private pumpAgain = false;
    private pausePump = 0;
    private lastServed: string | null = null;
    private limits: Limits = { maxPart: MAX_PART_BYTES, rawMinBps: null };
    private deviceHealth: EdgeDeviceHealth | null = null;
    private deviceKey: DeviceKey | null = null;
    /**
     * The cloud link as `linkChanged` last published it (`cloud-link-changed`). Only `linkChanged` writes it: a read of
     * `cloudLink()` (GET /status) used to store the new state first, so the change was never published (critic item 20).
     */
    private lastPublishedLink: { state: CloudLinkState; sinceMs: number } | null = null;
    /** Per session, wall ms since it has had something waiting to be sent (`linkChanged` tracks it; item 6). */
    private readonly waitingSince = new Map<string, number>();
    /**
     * Open sessions with no sync state yet (no hello since the start; nothing about the cloud is known, §5.5): the
     * journal head first seen, and when a record past it was first seen (the pre-hello lag, a lower bound, item 21).
     */
    private readonly preHello = new Map<string, { headSeq: number; sinceMs: number | null }>();
    private connectedLogged = false;
    private refused: string | null = null;
    /** The last hello's reading, on the RAW PC clock (how far the PC clock itself is off); null before the first. */
    private cloudClock: { offsetMs: number; rttMs: number; atMs: number } | null = null;
    /**
     * etabella.net time (EDGE_SERVER_TIME; user decision 2026-10-05): every hello's reading goes into it, and the tick
     * folds PC clock jumps into it. Null in specs that build the uplink without it (the clock is then the PC clock).
     */
    private readonly serverTime: ServerTime | null;
    private egressIp: string | null = null;
    /** `at`: monotonic ms of the inspection. */
    private certCache: { at: number; status: EdgeCertificateStatus } | null = null;
    private certRun: Promise<EdgeCertificateStatus> | null = null;
    /** Monotonic ms of the last background certificate check; null before the first. */
    private lastCertCheck: number | null = null;
    /** Monotonic ms: no background certificate attempt before this after a failed one (review 5); 0 = none failed. */
    private certRetryAt = 0;
    private captureUploading = false;
    /** Monotonic ms. */
    private captureRetryAt = 0;
    /** 503 NOT_CONFIGURED answers in a row (the capture backoff step); 0 after an upload (item 10). */
    private captureNotConfigured = 0;
    /**
     * The last failed held-capture upload; null after one succeeded (`CloudLinkStatus.lastUploadError`). It, the
     * backoff step and the next try's wall time are kept in the state (`heldCaptures.uploadState`, review 2026-10-04),
     * so a restart neither tries again at once nor forgets it. The orphan id of a reported capture is kept with the
     * capture itself (`heldCaptures.setOrphan`): neither a retry nor a restart reports it again.
     */
    private lastUploadError: CloudUploadError | null = null;
    /** Monotonic ms of the last "c.marks dropped" warning (one a minute); null before the first. */
    private marksWarnedAt: number | null = null;

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        @Inject(EDGE_RUN_MODE) private readonly mode: EdgeRunMode,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Optional() @Inject(UPLINK_OPTIONS) opts?: UplinkOptions,
        @Optional() @Inject(EDGE_SERVER_TIME) serverTime?: ServerTime | null,
    ) {
        this.serverTime = serverTime ?? null;
        this.opts = opts ?? {};
        this.io = this.opts.io ?? ((url, o) => ioClient(url, o));
        this.http = this.opts.http ?? nodeCloudHttp;
        this.random = this.opts.random ?? Math.random;
        this.mono = this.opts.monotonic ?? monotonicMs;
        this.backoff = new Backoff(
            this.opts.backoffBaseMs ?? UPLINK_DEFAULTS.backoffBaseMs,
            this.opts.backoffMaxMs ?? UPLINK_DEFAULTS.backoffMaxMs,
            this.opts.stableResetMs ?? UPLINK_DEFAULTS.stableResetMs,
            this.random,
        );
        this.internetTracker = new InternetTracker(this.opts.internetOfflineAfterMs ?? EDGE_TIMING.internetOfflineAfterMs, this.opts.internetOnlineAfterMs ?? EDGE_TIMING.internetOnlineAfterMs);
        // Monotonic (review 25): ops may step the wall clock back (cloud-time fallback), and a bucket on Date.now()
        // then owed the step in seconds of silence.
        this.budget = new TokenBucket(this.opts.edgeBps ?? UPLINK_DEFAULTS.edgeBps, this.mono);
        this.startedAtMs = clock();
        this.lastCheckedAt = clock();
    }

    // =============================================================================================================
    // Lifecycle
    // =============================================================================================================

    async start(): Promise<void> {
        if (this.started || this.closed) return;
        this.started = true;
        this.unsubscribes.push(
            this.bus.subscribe('device-health', h => {
                this.deviceHealth = h;
            }),
            this.bus.subscribe('lan-viewers', v => {
                this.lanViewers.set(v.nSesid, v.count);
            }),
            this.bus.subscribe('session-event', e => {
                if (e.type === 'ended') this.kick();
            }),
            this.bus.subscribe('alert', a => {
                if (a.tier === 'info') return;
                if (a.source === 'uplink' && !FORWARDED_UPLINK_ALERTS.has(a.kind)) return;
                this.recentAlerts.push(a);
                if (this.recentAlerts.length > 20) this.recentAlerts.splice(0, this.recentAlerts.length - 20);
            }),
            this.kernel.onCut(cut => {
                const sync = this.syncs.get(cut.nSesid);
                if (sync) {
                    sync.pendingCuts.push({ rev: cut.rev, atMs: this.clock() });
                    // Only lagSec reads it (the oldest unconfirmed commit time): a long outage thins it in pairs, each
                    // pair keeping its later rev and its EARLIER time, so the lag is never under-reported.
                    if (sync.pendingCuts.length > PENDING_CUTS_MAX) sync.pendingCuts = thinPendingCuts(sync.pendingCuts);
                }
                this.kick();
            }),
        );
        const every = (ms: number, fn: () => void): void => {
            const t = setInterval(fn, ms);
            t.unref?.();
            this.timers.push(t);
        };
        every(this.opts.statusIntervalMs ?? UPLINK_DEFAULTS.statusIntervalMs, () => this.sendStatus());
        every(this.opts.tickMs ?? UPLINK_DEFAULTS.tickMs, () => this.onTick());
        this.restoreCaptureUploadState();
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (identity && identity.status !== 'revoked') {
            this.scheduleConnect(0);
            if (identity.status === 'active') void this.certificateInBackground();
        } else if (!identity) {
            this.refused = 'never-enrolled';
        }
        void this.probe();
    }

    async close(): Promise<void> {
        if (this.closed) return;
        this.closed = true;
        for (const t of this.timers.splice(0)) clearInterval(t);
        if (this.connectTimer) clearTimeout(this.connectTimer);
        this.connectTimer = null;
        for (const off of this.unsubscribes.splice(0)) off();
        const socket = this.socket;
        this.socket = null;
        this.gen += 1;
        this.helloDone = false;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
    }

    // =============================================================================================================
    // Status
    // =============================================================================================================

    status(): UplinkLinkStatus {
        const now = this.clock();
        const all = this.sessions();
        return {
            online: this.isOnline(),
            lagSec: this.lagSecOf(all, now),
            pendingPages: all.reduce((n, s) => n + s.dirtyPages, 0),
            lastSyncAt: this.lastSyncAt,
            lastCheckedAt: this.lastCheckedAt,
            stale: this.started && now - this.lastCheckedAt > EDGE_TIMING.statusStaleAfterMs,
        };
    }

    /**
     * Read-only (critic item 20): the state is computed, never stored; `linkChanged` alone keeps the published state.
     * `sinceMs` is when the published state began, or null for a state no tick has published yet (review 2026-10-04):
     * it used to read now, so on an uplink whose ticks never ran (its start threw) every read started the state afresh
     * and ops' 15 s "Can't reach eTabella" never came; ops falls back to when it first saw the state.
     */
    cloudLink(): CloudLinkStatus {
        const now = this.clock();
        const all = this.sessions();
        const lagLines = all.reduce((n, s) => n + s.lagLines, 0);
        const pendingPages = all.reduce((n, s) => n + s.dirtyPages, 0);
        const state = this.linkState(all, now);
        const published = this.lastPublishedLink;
        const heldCapturesPending = this.safeState(() => this.state.heldCaptures.list({ pendingUpload: true }).length, 0);
        return {
            state,
            sinceMs: published && published.state === state ? published.sinceMs : null,
            lagSec: this.lagSecOf(all, now),
            lagLines,
            pendingPages,
            lastSyncedAtMs: this.lastSyncAt,
            heldCapturesPending,
            lastUploadError: heldCapturesPending > 0 ? this.lastUploadError : null,
        };
    }

    /**
     * The box-wide lag: the oldest over the sessions the hello resumed, and, for open sessions no hello has resumed since
     * the start, the age of the first change journaled since then (a lower bound: what the cloud held before the
     * restart is unknown until the hello, §5.5; critic item 21).
     */
    private lagSecOf(all: readonly UplinkSessionSync[], now: number): number {
        let lag = all.reduce((m, s) => Math.max(m, s.lagSec), 0);
        for (const p of this.preHello.values()) if (p.sinceMs !== null) lag = Math.max(lag, Math.floor(Math.max(0, now - p.sinceMs) / 1000));
        return lag;
    }

    internet(): EdgeInternetStatus {
        return this.internetTracker.status();
    }

    etabellaReachable(): boolean {
        return this.etabellaOk;
    }

    session(nSesid: string): UplinkSessionSync | null {
        const sync = this.syncs.get(nSesid);
        return sync ? this.syncView(sync) : null;
    }

    sessions(): readonly UplinkSessionSync[] {
        return [...this.syncs.values()].sort((a, b) => (a.nSesid < b.nSesid ? -1 : a.nSesid > b.nSesid ? 1 : 0)).map(s => this.syncView(s));
    }

    /**
     * Optional member ops reads (ops.service.ts `UplinkCloudClock`): the RAW PC clock minus the cloud's `serverNowMs` of
     * the last hello reply, RTT-corrected (spec §3.4 "Time", §10 #8 fallback when chrony is unsynced) — how far the PC
     * clock itself is off, whatever etabella.net time corrects; `atMs` is on the raw clock too. Null before the first.
     */
    cloudClockOffset(): { readonly offsetMs: number; readonly rttMs: number | null; readonly atMs: number } | null {
        return this.cloudClock;
    }

    /** The PC clock the cloud offset is measured on (EDGE_RAW_CLOCK); EDGE_CLOCK when the uplink has no ServerTime. */
    private rawNow(): number {
        return this.serverTime ? this.serverTime.raw() : this.clock();
    }

    private isOnline(): boolean {
        return !!this.socket?.connected && this.helloDone;
    }

    /**
     * DR6 with the in-flight grace (critic items 6 and 7, user decision 2026-10-04): `synced` when nothing waits (a
     * null `lastSyncAt` is `behind` only when something waits); with something waiting, `behind` when nothing was
     * confirmed since the start, or when a waiting session's oldest change is `EDGE_TIMING.cloudBehindAfterSec` old, or
     * that session had no confirmation for that long since its wait began (per session, so another session's acks or
     * hellos never hide one that is stuck); else (one round trip in flight) still `synced`.
     */
    private linkState(all: readonly UplinkSessionSync[], now: number): CloudLinkState {
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity || identity.status === 'revoked' || identity.status === 'quarantined') return 'not-linked';
        if (identity.linkFailure === 'key-refused' || identity.linkFailure === 'never-enrolled') return 'not-linked';
        if (all.some(s => s.uplinkState === 'frozen')) return 'sync-refused';
        if (this.internetTracker.status().state === 'down') return 'internet-unavailable';
        if (!this.isOnline()) return identity.status === 'pending-confirm' ? 'not-linked' : 'cant-reach-etabella';
        const waiting = all.filter(waitsToSend);
        if (!waiting.length) return 'synced';
        if (this.lastSyncAt === null) return 'behind';
        const afterSec = EDGE_TIMING.cloudBehindAfterSec;
        const late = waiting.some(s => {
            if (s.lagSec >= afterSec) return true;
            const confirmedOrWaiting = Math.max(s.lastSyncedAtMs ?? Number.NEGATIVE_INFINITY, this.waitingSince.get(s.nSesid) ?? now);
            return now - confirmedOrWaiting >= afterSec * 1000;
        });
        return late ? 'behind' : 'synced';
    }

    private syncView(s: SyncSession): UplinkSessionSync {
        const now = this.clock();
        const view = this.kernel.view(s.nSesid);
        const kv = this.kernel.session(s.nSesid);
        let dirty = 0;
        let lagLines = 0;
        if (view) {
            const pages = s.cloud ? dirtyPages(view.digests, s.cloud.digests) : [];
            dirty = s.cloud ? pages.length : view.pages.length;
            lagLines = linesCloudLacks(view, s.cloud, pages);
        }
        const headSeq = kv?.raw.headSeq ?? 0;
        const rawLagRecords = kv ? Math.max(0, headSeq - s.rawAcked.seq) : 0;
        const oldestCut = s.pendingCuts.length ? s.pendingCuts[0].atMs : null;
        // Read-only: raw records the tick has not noted yet are new (`now`).
        const oldestRaw = kv ? oldestUnackedRawAt(s.rawSeen, s.rawAcked.seq, headSeq, now) : null;
        const oldest = [oldestCut, oldestRaw].filter((x): x is number => x !== null);
        const lagSec = dirty === 0 && rawLagRecords === 0 ? 0 : oldest.length ? Math.max(0, Math.floor((now - Math.min(...oldest)) / 1000)) : 0;
        return {
            nSesid: s.nSesid,
            uplinkState: s.uplinkState,
            verdict: s.verdict,
            cloudAppliedRev: s.appliedRev,
            appliedRawSeq: s.appliedRawSeq,
            rawAckedSeq: s.rawAcked.seq,
            cloudRoot: s.cloudRoot,
            dirtyPages: dirty,
            lagLines,
            lagBytes: rawLagRecords * s.bytesPerRecord,
            lagSec,
            lastSyncedAtMs: s.lastSyncedAtMs,
            frozenAtMs: s.frozenAtMs,
            frozenReason: s.frozenReason,
            heldShrinkId: s.heldShrinkId,
            sealState: s.sealState,
        };
    }

    // =============================================================================================================
    // Connect / disconnect
    // =============================================================================================================

    private scheduleConnect(delayMs: number): void {
        if (this.closed || this.connectTimer || this.connecting || this.socket) return;
        this.connectTimer = setTimeout(() => {
            this.connectTimer = null;
            void this.connectOnce();
        }, Math.max(0, delayMs));
        this.connectTimer.unref?.();
    }

    private async connectOnce(): Promise<void> {
        if (this.closed || this.socket || this.connecting) return;
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity) {
            this.refused = 'never-enrolled';
            return;
        }
        if (identity.status === 'revoked') return;
        this.connecting = true;
        let failure: { err: unknown } | null = null;
        try {
            if (identity.cloudOrigin && identity.cloudOrigin !== this.config.cloud.origin) {
                throw Object.assign(new Error(`the box was enrolled with ${identity.cloudOrigin}, not ${this.config.cloud.origin}`), { refusal: 'ORIGIN' });
            }
            const key = await this.loadKey();
            const nonce = await this.challenge(identity.nEdgeid);
            const sig = key.sign(edgeAuthPayload(nonce, identity.nEdgeid, this.bootId));
            const transports = this.backoff.attempts % 2 === 0 ? ['websocket'] : ['polling', 'websocket'];
            const url = `${this.config.cloud.uplinkUrl}${this.config.cloud.uplinkNamespace}`;
            const socket = this.io(url, {
                path: this.config.cloud.uplinkPath,
                transports,
                reconnection: false,
                forceNew: true,
                timeout: this.opts.connectTimeoutMs ?? UPLINK_DEFAULTS.connectTimeoutMs,
                auth: { edgeId: identity.nEdgeid, nonce, bootId: this.bootId, sig },
                ...({ tryAllTransports: true } as object),
            });
            await new Promise<void>((resolve, reject) => {
                const onConnect = (): void => {
                    socket.off('connect_error', onError);
                    resolve();
                };
                const onError = (err: Error): void => {
                    socket.off('connect', onConnect);
                    socket.removeAllListeners();
                    socket.disconnect();
                    reject(err);
                };
                socket.once('connect', onConnect);
                socket.once('connect_error', onError);
            });
            if (this.closed) {
                socket.removeAllListeners();
                socket.disconnect();
                return;
            }
            this.connecting = false;
            this.onConnected(socket, identity);
        } catch (err) {
            failure = { err };
        } finally {
            this.connecting = false;
        }
        // After `connecting` is cleared: the failure handler schedules the next attempt.
        if (failure) this.onConnectFailed(failure.err);
    }

    private onConnected(socket: Socket, identity: BoxIdentityRecord): void {
        this.socket = socket;
        this.gen += 1;
        const gen = this.gen;
        const now = this.clock();
        this.backoff.connected(this.mono());
        this.refused = null;
        this.helloRefusal = null;
        this.lastCheckedAt = now;
        this.etabellaOk = true;
        this.internetEvidence(true);
        socket.on('disconnect', reason => {
            if (gen === this.gen) this.onDisconnected(String(reason));
        });
        socket.on(EdgeEvent.assign, (msg: CAssign, ack?: (r: unknown) => void) => void this.onAssign(msg, ack));
        socket.on(EdgeEvent.need, (msg: CNeed, ack?: (r: unknown) => void) => this.onNeed(msg, ack));
        socket.on(EdgeEvent.cmd, (_msg: unknown, ack?: (r: unknown) => void) => {
            // O-2 build default: restricted support commands are not in v1.
            if (typeof ack === 'function') ack({ ok: false });
        });
        socket.on('c.refused', (msg: { code?: unknown; message?: unknown }) => {
            if (gen === this.gen) this.onRefusalNotice(String(msg?.code ?? ''), String(msg?.message ?? ''));
        });
        // Live mark sync (user decision 2026-10-05): a plain emit, never acked (the cloud does not wait for one).
        socket.on(EdgeEvent.marks, (msg: unknown) => {
            if (gen === this.gen) this.onMarks(msg);
        });
        socket.io?.on?.('ping', () => {
            this.lastCheckedAt = this.clock();
        });
        // `lastCloudContactAtMs` is the running box's evidence (status, the CLI's "service connected" guard): a CLI
        // command's one-shot connection does not touch it.
        const patch: Mutable<BoxIdentityRecord> = this.mode === 'serve' ? { lastCloudContactAtMs: now, linkFailure: null } : { linkFailure: null };
        let confirmed = false;
        if (identity.status === 'pending-confirm') {
            // The cloud accepts only a confirmed key ('A'): the first accepted connect IS the admin's confirmation (§3.4 step 3).
            patch.status = 'active';
            patch.confirmedAtMs = now;
            confirmed = true;
        }
        this.safeState(() => this.state.identity.patch(patch), null);
        this.safeState(() => this.state.connectivityLog.endRetry('cloud-connect', now), null);
        this.logRow({ event: 'connected', code: 'cloud-connected', problem: false });
        this.connectedLogged = true;
        if (confirmed) {
            this.logger.log('the cloud confirmed the device key; fetching the LAN certificate');
            void this.certificateInBackground();
        }
        this.linkChanged();
        // A one-shot CLI connection (`capture upload`) never runs a hello: it must not touch assignments or rounds.
        if (this.mode === 'serve') void this.runHello();
    }

    private onConnectFailed(err: unknown): void {
        const now = this.clock();
        this.lastCheckedAt = now;
        const code = this.refusalOf(err);
        const failure = this.applyRefusal(code, 'connect');
        const errorClass = code === 'NO_INTERNET' ? 'no-internet' : code.toLowerCase();
        this.safeState(
            () =>
                this.state.connectivityLog.retry(
                    'cloud-connect',
                    { atMs: now, error: errorClass, peer: null },
                    { atMs: now, event: 'retrying', source: 'cloud', code: failure === 'unreachable' ? 'cloud-disconnected' : 'cloud-refused', problem: true, nSesid: null, sessionName: null, peer: null, actor: null, data: { error: errorClass } },
                ),
            null,
        );
        this.linkChanged();
        if (failure !== 'revoked' && !this.closed && this.mode === 'serve') this.scheduleConnect(this.backoff.next());
    }

    /**
     * What a refusal code means for the identity (connect_error, `c.refused`, hello refusal). Returns the link failure
     * it stands for; 'revoked' stops reconnecting for good.
     */
    private applyRefusal(code: string, where: 'connect' | 'notice' | 'hello'): EdgeLinkFailure {
        switch (code) {
            case 'REVOKED':
                if (this.safeState(() => this.state.identity.get()?.status, null) !== 'revoked') {
                    this.safeState(() => this.state.identity.patch({ status: 'revoked', linkFailure: 'revoked' }), null);
                    this.raise('P1', true, 'BOX_REVOKED', 'the cloud revoked this box: no further uplink');
                }
                this.refused = code;
                return 'revoked';
            case 'QUARANTINED':
                if (this.safeState(() => this.state.identity.get()?.status, null) !== 'quarantined') {
                    this.safeState(() => this.state.identity.patch({ status: 'quarantined', linkFailure: 'quarantined' }), null);
                    this.raise('P1', false, 'QUARANTINED', 'the cloud quarantined this box: status only, no assignments, rounds refused until re-approved');
                }
                for (const s of this.syncs.values()) s.stopped = 'quarantined';
                this.refused = code;
                return 'quarantined';
            case 'KEY_REFUSED':
                this.safeState(() => this.state.identity.patch({ linkFailure: 'key-refused' }), null);
                this.refused = code;
                return 'key-refused';
            case 'DUP_IDENTITY':
                this.raise('P1', true, 'DUP_IDENTITY', 'the cloud refused this box: another socket with the same identity is live (clone or restored image?)');
                this.refused = code;
                return 'unreachable';
            case 'UPGRADE':
            case 'PROTO_UNSUPPORTED':
                this.raise('P1', false, code, `the cloud refuses this box software version (${code})`);
                this.refused = code;
                return 'unreachable';
            case 'NO_INTERNET':
                this.internetEvidence(false);
                this.etabellaOk = false;
                this.safeState(() => this.state.identity.patch({ linkFailure: 'unreachable' }), null);
                this.refused = code;
                return 'unreachable';
            default:
                if (where === 'connect') {
                    this.etabellaOk = false;
                    this.safeState(() => this.state.identity.patch({ linkFailure: 'unreachable' }), null);
                }
                this.refused = code || 'UNREACHABLE';
                return 'unreachable';
        }
    }

    /** Map a connect failure to a refusal code the box acts on. */
    private refusalOf(err: unknown): string {
        const tagged = (err as { refusal?: string })?.refusal;
        if (tagged === 'ORIGIN') return 'KEY_REFUSED';
        if (tagged) return tagged;
        if (err instanceof CloudNetworkError) return isNoInternet(err) ? 'NO_INTERNET' : 'UNREACHABLE';
        if (err instanceof EdgePortError) return err.code === 'offline' ? 'NO_INTERNET' : 'UNREACHABLE';
        return normalizeRefusal(`${(err as Error)?.message ?? ''} ${JSON.stringify((err as { data?: unknown })?.data ?? '')}`);
    }

    /** `c.refused {code, message}`: the cloud is about to disconnect this socket. */
    private onRefusalNotice(code: string, message: string): void {
        const normalized = normalizeRefusal(code);
        if (code.toUpperCase() === 'SUPERSEDED') return; // our own newer socket took over
        this.logger.warn(`the cloud refused this connection: ${code}${message ? ` (${message})` : ''}`);
        this.applyRefusal(normalized, 'notice');
        this.logRow({ event: 'error', code: 'cloud-refused', problem: true, data: { error: normalized.toLowerCase() } });
        this.linkChanged();
    }

    private onDisconnected(reason: string): void {
        this.socket = null;
        this.gen += 1;
        this.helloDone = false;
        this.helloSessions.clear();
        for (const s of this.syncs.values()) {
            s.helloOk = false;
            s.round = null;
        }
        this.backoff.disconnected(this.mono());
        if (!this.closed && this.connectedLogged) this.logRow({ event: 'disconnected', code: 'cloud-disconnected', problem: true, data: { error: reason } });
        this.connectedLogged = false;
        this.linkChanged();
        const revoked = this.safeState(() => this.state.identity.get()?.status, null) === 'revoked';
        if (!this.closed && !revoked && this.mode === 'serve') this.scheduleConnect(this.backoff.next());
    }

    /** Drop the socket (lost ack, protocol trouble); the reconnect + hello diff resumes. */
    private reconnect(why: string): void {
        this.logger.warn(`reconnecting: ${why}`);
        const socket = this.socket;
        if (!socket) return;
        const gen = this.gen;
        socket.disconnect();
        if (gen === this.gen) this.onDisconnected(why);
    }

    private async loadKey(): Promise<DeviceKey> {
        if (this.deviceKey) return this.deviceKey;
        try {
            this.deviceKey = await DeviceKey.load(this.config.paths.deviceKeyFile);
            return this.deviceKey;
        } catch (err) {
            this.raise('P1', false, 'DEVICE_KEY', `the device key ${this.config.paths.deviceKeyFile} cannot be read: ${errText(err)}`);
            throw Object.assign(new Error(`device key unreadable: ${errText(err)}`), { refusal: 'KEY_REFUSED' });
        }
    }

    private apiUrl(p: string, origin?: string): string {
        const base = origin ? `${origin}/realtimeapi` : this.config.cloud.realtimeApiUrl;
        return `${base.replace(/\/+$/, '')}/${p.replace(/^\/+/, '')}`;
    }

    private async challenge(edgeId: string, origin?: string): Promise<string> {
        const res = await this.http({ method: 'GET', url: this.apiUrl(`edge/v1/challenge?edgeId=${encodeURIComponent(edgeId)}`, origin), timeoutMs: 15_000 });
        const body = (res.json ?? {}) as Record<string, unknown>;
        const nonce = typeof body.nonce === 'string' ? body.nonce : null;
        if (res.status >= 200 && res.status < 300 && nonce) return nonce;
        const refusal = String(body.error ?? body.cCode ?? '').toUpperCase();
        throw Object.assign(new Error(`challenge refused (${res.status}${refusal ? ` ${refusal}` : ''})`), {
            refusal: refusal.includes('REVOKED') ? 'REVOKED' : refusal.includes('QUARANTINED') ? 'QUARANTINED' : res.status === 404 || res.status === 401 || res.status === 403 ? 'KEY_REFUSED' : 'UNREACHABLE',
        });
    }

    // =============================================================================================================
    // Hello
    // =============================================================================================================

    /** Resolves true when the hello completed (verdicts applied), false when it failed or was refused. */
    private runHello(): Promise<boolean> {
        if (this.helloRunning) return this.helloRunning;
        this.helloRunning = this.doHello().finally(() => {
            this.helloRunning = null;
        });
        return this.helloRunning;
    }

    private async doHello(): Promise<boolean> {
        const gen = this.gen;
        if (!this.socket) return false;
        this.pausePump += 1;
        let ok = false;
        try {
            await this.waitPumpIdle();
            if (gen !== this.gen) return false;
            const sent = this.helloSessionsNow();
            const hello: EdgeHello = {
                proto: EDGE_PROTO,
                protoMin: EDGE_PROTO_MIN_SUPPORTED,
                fmt: EDGE_FMT,
                sw: this.config.release.version,
                parserVer: FEED_PARSE_VERSION,
                bootId: this.bootId,
                sessions: sent,
            };
            // The round trip is measured on the RAW PC clock: on the corrected one (EDGE_CLOCK) the offset would shrink to
            // 0 after the first hello and stop correcting anything (user decision 2026-10-05).
            const r0 = this.rawNow();
            const m0 = this.mono();
            let reply: EdgeHelloReply | HelloRefusal;
            try {
                reply = await this.request<EdgeHelloReply | HelloRefusal>(EdgeEvent.hello, hello);
            } catch (err) {
                if (!(err instanceof UplinkOfflineError)) this.logger.warn(`hello failed: ${errText(err)}`);
                return false;
            }
            if (gen !== this.gen) return false;
            const r1 = this.rawNow();
            const m1 = this.mono();
            const t1 = this.clock();
            this.lastHelloAt = m1;
            this.lastCheckedAt = t1;
            if (!reply || typeof reply !== 'object' || (reply as HelloRefusal).ok === false || !Array.isArray((reply as EdgeHelloReply).sessions)) {
                this.onHelloRefused(reply as HelloRefusal);
                return false;
            }
            const helloReply = reply as EdgeHelloReply;
            if (typeof helloReply.serverNowMs === 'number' && Number.isFinite(helloReply.serverNowMs)) {
                this.cloudClock = { offsetMs: Math.round((r0 + r1) / 2 - helloReply.serverNowMs), rttMs: Math.max(0, r1 - r0), atMs: r1 };
                // A PC clock jump during the round trip spoils this reading: etabella.net time skips it (every read of
                // it folds the jump itself into the correction; `observe` does so before it keeps a reading).
                if (Math.abs(r1 - r0 - (m1 - m0)) < SERVER_TIME_JUMP_MS) this.serverTime?.observe(this.cloudClock);
            }
            const egress = (helloReply as unknown as { egressIp?: unknown }).egressIp;
            if (typeof egress === 'string' && egress) this.egressIp = egress;
            this.helloSessions = new Set(sent.map(s => s.nSesid));
            for (const s of sent) this.preHello.delete(s.nSesid);
            await this.applyHelloReply(helloReply, gen);
            if (gen !== this.gen) return false;
            this.helloDone = true;
            this.helloRefusal = null;
            // Nothing waits after the hello (no session, or every one caught up): the cloud confirmed it holds everything,
            // so a box with nothing to send reads "Synced", not "behind · Last confirmed not yet" (critic item 7). Only a
            // hello that carried every open session confirms that (review 2026-10-04): one sent while the kernel still
            // replayed a journal said nothing about that session, and stamping it read Synced until the next hello.
            if (!this.sessions().some(waitsToSend) && this.helloCoveredOpenSessions()) {
                this.lastSyncAt = this.clock();
                this.lastCheckedAt = this.lastSyncAt;
            }
            const identity = this.safeState(() => this.state.identity.get(), null);
            const patch: Mutable<BoxIdentityRecord> = { lastCloudContactAtMs: t1 };
            if (identity?.status === 'quarantined') {
                // A hello that is answered again is the admin's re-approval (§5.3 'Q' → 'A').
                patch.status = 'active';
                patch.linkFailure = null;
                for (const s of this.syncs.values()) if (s.stopped === 'quarantined') s.stopped = null;
            }
            if (identity?.linkFailure) patch.linkFailure = null;
            this.safeState(() => this.state.identity.patch(patch), null);
            this.linkChanged();
            ok = true;
        } finally {
            this.pausePump -= 1;
            this.kick();
        }
        if (this.safeState(() => this.state.identity.get()?.status, null) === 'active') void this.certificateInBackground();
        return ok;
    }

    /** A hello the cloud refused: identity state and alerts; the connection is dropped and retried unless revoked. */
    private onHelloRefused(reply: HelloRefusal | null): void {
        const raw = String(reply?.code ?? 'ERROR');
        const code = normalizeRefusal(raw);
        this.helloRefusal = code;
        this.logger.warn(`hello refused: ${raw}${reply?.message ? ` (${reply.message})` : ''}`);
        const failure = this.applyRefusal(code, 'hello');
        if (code !== 'QUARANTINED' && failure === 'unreachable' && !['UPGRADE', 'PROTO_UNSUPPORTED', 'DUP_IDENTITY'].includes(code)) {
            this.raise('P2', false, 'HELLO_REFUSED', `the cloud refused the hello (${raw})`);
        }
        this.logRow({ event: 'error', code: 'cloud-refused', problem: true, data: { error: code.toLowerCase() } });
        this.linkChanged();
        // A quarantined box stays connected to report status (§5.3) and re-hellos on the normal cadence.
        if (code !== 'QUARANTINED') setImmediate(() => this.reconnect(`hello refused (${raw})`));
    }

    /**
     * Every session a hello can carry was in the last hello (review 2026-10-04): only then may a hello stamp the
     * box-wide `lastSyncAt`. It waits only for the sessions a later hello will carry, by `helloSessionsNow`'s rule: one
     * still replaying its journal (the hello that carries it follows), or one with a view or a corrupt journal not sent
     * yet. A session the box state does not know, or one held with no worker (its open failed, a parser mismatch: no
     * view and no corrupt journal), is in no hello until an admin splits it, so it never holds the stamp back.
     */
    private helloCoveredOpenSessions(): boolean {
        return this.safeState(() => this.kernel.sessions(), [] as readonly KernelSessionView[]).every(v => {
            if (this.helloSessions.has(v.nSesid)) return true;
            if (this.safeState(() => this.state.sessions.get(v.nSesid), null) === null) return true;
            if (v.recovering) return false;
            return !v.journalCorrupt && this.safeState(() => this.kernel.view(v.nSesid), null) === null;
        });
    }

    private helloSessionsNow(): EdgeHelloSession[] {
        const out: EdgeHelloSession[] = [];
        for (const v of this.kernel.sessions()) {
            if (v.recovering) continue;
            const record = this.safeState(() => this.state.sessions.get(v.nSesid), null);
            if (!record) continue;
            const cv = this.kernel.view(v.nSesid);
            if (!cv && !v.journalCorrupt) continue;
            const sync = this.syncOf(v.nSesid, record.epoch, record.rebaseSeq);
            const incidents: EdgeIncident[] = this.safeState(() => this.state.incidents.list(v.nSesid), [])
                .filter(i => i.seq !== null)
                .map(i => stripIncident(i));
            out.push({
                nSesid: v.nSesid,
                epoch: record.epoch,
                rebaseSeq: record.rebaseSeq,
                rev: cv?.rev ?? v.rev,
                totalLines: cv?.totalLines ?? v.totalLines,
                root: cv?.root ?? v.root ?? rootDigest(v.nSesid, 0, []),
                raw: { headSeq: v.raw.headSeq, headHash: v.raw.headHash },
                lastRound: sync.lastRound,
                state: v.localState,
                incidents,
            });
        }
        return out;
    }

    /**
     * The edge-token keys the hello did not carry, read from the sign-in service itself (`cloud.jwksUrl`, authapi
     * `GET edge/jwks`: public keys, over HTTPS with certificate validation, the same trust as the uplink). Only EC
     * P-256 keys with a `kid` are kept, private members dropped, exactly what a hello would have delivered. While the
     * box has no keys every hello tries; once it has some, at most once per `TOKEN_KEYS_FALLBACK_EVERY_MS` (rotation).
     * Never throws: a failure is logged and the next hello tries again.
     */
    private fetchTokenKeys(): Promise<void> {
        if (this.tokenKeysFetch) return this.tokenKeysFetch;
        const cached = this.safeState(() => this.state.jwks.get(), null);
        if (cached && this.clock() - this.tokenKeysFetchedAt < TOKEN_KEYS_FALLBACK_EVERY_MS) return Promise.resolve();
        const url = this.config.cloud.jwksUrl ?? this.config.cloud.tokenUrl.replace(/\/token$/, '/jwks');
        this.tokenKeysFetch = (async () => {
            try {
                const res = await this.http({ method: 'GET', url, timeoutMs: 15_000 });
                const listed = (res.json as { keys?: unknown } | null)?.keys;
                const keys = (Array.isArray(listed) ? listed : [])
                    .filter((k): k is Record<string, string> => !!k && k.kty === 'EC' && k.crv === 'P-256' && typeof k.x === 'string' && typeof k.y === 'string' && typeof k.kid === 'string' && !!k.kid)
                    .map(k => ({ kty: 'EC', crv: 'P-256', x: k.x, y: k.y, kid: k.kid, alg: 'ES256', use: 'sig' }));
                if (res.status !== 200 || !keys.length) {
                    this.warnTokenKeys(`edge-token keys: ${url} answered ${res.status} with ${keys.length} usable key(s); online sign-ins stay refused until keys arrive`);
                    return;
                }
                this.tokenKeysFetchedAt = this.clock();
                this.tokenKeysWarned = null;
                const kids = keys.map(k => k.kid).join(', ');
                const before = cached ? cached.keys.map(k => String((k as { kid?: unknown }).kid)).join(', ') : null;
                this.safeState(() => this.state.jwks.save(keys as never, this.tokenKeysFetchedAt), null);
                if (before !== kids) this.logger.log(`edge-token keys read from ${url} (the cloud's hello carried none): ${kids}`);
            } catch (err) {
                this.warnTokenKeys(`edge-token keys could not be read from ${url}: ${errText(err)}`);
            } finally {
                this.tokenKeysFetch = null;
            }
        })();
        return this.tokenKeysFetch;
    }

    private warnTokenKeys(message: string): void {
        if (this.tokenKeysWarned === message) return;
        this.tokenKeysWarned = message;
        this.logger.warn(message);
    }

    private async applyHelloReply(reply: EdgeHelloReply, gen: number): Promise<void> {
        const now = this.clock();
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (reply.limits) {
            if (Number.isFinite(reply.limits.edgeBps) && reply.limits.edgeBps > 0) this.budget.setRate(reply.limits.edgeBps);
            if (Number.isInteger(reply.limits.maxPart) && reply.limits.maxPart > 1024) this.limits = { ...this.limits, maxPart: Math.min(reply.limits.maxPart, MAX_PART_BYTES) };
            if (Number.isFinite(reply.limits.rawMinBps) && reply.limits.rawMinBps > 0) this.limits = { ...this.limits, rawMinBps: reply.limits.rawMinBps };
        }
        if (Array.isArray(reply.edgeTokenKeys) && reply.edgeTokenKeys.length) this.safeState(() => this.state.jwks.save(reply.edgeTokenKeys, now), null);
        // The cloud sent none (its EDGE_TOKEN_JWKS is not configured): without keys every online sign-in is refused on
        // the box (`box_not_linked`), so read the sign-in service's public key set ourselves. Not awaited.
        else void this.fetchTokenKeys();
        if (reply.revocations) this.applyRevocations(reply.revocations, now);
        let diff: AssignmentsDiff | null = null;
        // The full snapshot (names, e-mail, cases, ended parts) wins over the protocol's minimal `assignments`.
        const delivered = (reply as unknown as { assignmentSnapshot?: unknown }).assignmentSnapshot ?? reply.assignments;
        if (delivered !== undefined && delivered !== null && identity?.status !== 'quarantined') {
            const parsed = assignmentSnapshotFrom(delivered);
            if (parsed) {
                if (parsed.skipped) this.raise('P2', false, 'ASSIGNMENT_MALFORMED', `${parsed.skipped} assignment entr${parsed.skipped === 1 ? 'y' : 'ies'} could not be used`);
                // Operator codes are switched off (v1 default): a delivered hash is never stored.
                const snapshot = this.config.features.operatorCode ? parsed.snapshot : { ...parsed.snapshot, operatorCode: null };
                diff = this.safeState(() => this.state.assignments.replaceAll(snapshot, now), null);
                if (diff) this.publish('assignments-changed', diff);
            }
        }
        const replies = new Map<string, EdgeHelloReplySession>();
        for (const rs of reply.sessions) if (rs && typeof rs.nSesid === 'string') replies.set(rs.nSesid, rs);
        for (const nSesid of this.helloSessions) {
            if (gen !== this.gen) return;
            const rs = replies.get(nSesid);
            await this.applyVerdict(nSesid, rs ?? null).catch(err => this.logger.error(`hello verdict of ${nSesid}: ${errText(err)}`));
        }
        if (gen !== this.gen) return;
        await this.sendReady(diff);
    }

    private applyRevocations(rev: { users?: string[]; jtis?: string[]; since?: number }, receivedAtMs: number): void {
        const res = this.safeState(() => this.state.revocations.applyCloud({ users: rev.users ?? [], jtis: rev.jtis ?? [], since: rev.since ?? 0 }, receivedAtMs), null);
        if (res && (res.newJtis.length || res.newUsers.length)) {
            this.publish('access-revoked', { jtis: res.newJtis, userIds: res.newUsers, reason: 'cloud-revocation', atMs: receivedAtMs });
        }
    }

    private async applyVerdict(nSesid: string, rs: EdgeHelloReplySession | null): Promise<void> {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        const sync = this.syncOf(nSesid, record?.epoch ?? 1, record?.rebaseSeq ?? null);
        if (!rs) {
            sync.verdict = 'unknown';
            sync.stopped = 'unknown';
            return;
        }
        sync.verdict = rs.verdict;
        sync.epoch = rs.epoch || sync.epoch;
        sync.rebaseSeq = rs.rebaseSeq ?? null;
        sync.appliedRawSeq = rs.appliedRawSeq ?? null;
        sync.rawAcked = rs.rawAcked ?? { seq: 0, hash: '' };
        sync.rawSeen = dropAckedRaw(sync.rawSeen, sync.rawAcked.seq);
        sync.cloudRoot = rs.root || null;
        sync.stopped = null;
        sync.heldShrinkId = null;
        sync.heldAtMs = null;
        switch (rs.verdict) {
            case 'continue':
            case 'end':
            case 'recover': {
                const kv = this.kernel.session(nSesid);
                if (sync.recoverExhausted) {
                    // MR-4: RECOVER cannot repair this journal (recover()); the session stays frozen for the admin, with
                    // no new RECOVER and no new alert, until the journal is whole again.
                    if (kv?.journalCorrupt) {
                        this.freeze(sync, sync.frozenReason ?? 'the journal is corrupt and RECOVER cannot repair it (MR-4)');
                        return;
                    }
                    sync.recoverExhausted = null;
                    sync.recoverRefusals = 0;
                }
                const seqs = [rs.appliedRawSeq ?? 0, rs.rawAcked?.seq ?? 0, kv?.raw.headSeq ?? 0];
                const jv = await this.kernel.journalView(nSesid, seqs);
                const decision = boxCheckHelloReply(rs, jv);
                if (decision.verdict === 'frozen') {
                    this.freeze(sync, decision.reason ?? 'the box does not continue the cloud history (D19)');
                    return;
                }
                if (decision.verdict === 'recover') {
                    await this.recover(sync, decision.recoverFrom ?? jv.headSeq + 1);
                    return;
                }
                let resume;
                try {
                    resume = resumeFromHello(rs, jv);
                } catch (err) {
                    if (err instanceof ResumeRefusedError) {
                        this.freeze(sync, err.decision.reason ?? err.message);
                        return;
                    }
                    throw err;
                }
                sync.cloud = resume.cloud;
                sync.appliedRev = resume.appliedRev;
                sync.lineage = resume.lineage;
                sync.rawCursor = resume.rawCursor;
                sync.helloOk = true;
                sync.uplinkState = 'ok';
                sync.frozenAtMs = null;
                sync.frozenReason = null;
                sync.round = null;
                if (record?.localState === 'frozen') this.unfreezeLocal(nSesid);
                if (kv?.journalCorrupt) {
                    // MR-4: the history matches up to the good head; RECOVER repairs the corrupt rest from the cloud.
                    await this.recover(sync, kv.raw.headSeq + 1);
                    return;
                }
                const view = this.kernel.view(nSesid);
                if (view && sync.cloud && !needsRound(view, sync.cloud)) {
                    // The hello confirmed the cloud holds these pages: a confirmation like a round ack, so an idle box
                    // after a restart reads "Synced · Last confirmed HH:MM", not "behind · not yet" (critic item 7).
                    const now = this.clock();
                    sync.lastSyncedAtMs = now;
                    sync.pendingCuts = [];
                    // The box-wide stamp only from a hello that carried every open session (review 2026-10-04).
                    if (this.helloCoveredOpenSessions()) {
                        this.lastSyncAt = now;
                        this.lastCheckedAt = now;
                    }
                } else if (view && sync.cloud) {
                    await this.seedLagFromJournal(sync, view.rev);
                }
                if (kv && kv.raw.headSeq > sync.rawAcked.seq) await this.seedRawLagFromJournal(sync, kv.raw.headSeq);
                if (rs.verdict === 'end') this.endFromCloud(nSesid);
                this.statusChanged(nSesid, 'uplink');
                return;
            }
            case 'frozen':
                this.freeze(sync, 'the cloud froze this session (lineage mismatch, D19)');
                return;
            case 'unknown':
                sync.stopped = 'unknown';
                return;
            case 'sealed':
                this.markSealed(sync, null);
                return;
            default:
                // 'rebase' / 'fenced' exist only with Phase-4 in-session failover (D1): never acted on in v1.
                this.freeze(sync, `Phase-4 verdict ${String(rs.verdict)} is not supported in v1`);
                return;
        }
    }

    /**
     * Push nothing for the session (uplink 'frozen', local 'frozen' while it records): an admin splits to direct cloud
     * (D7). The first freeze raises `alert` (default: P1 LINEAGE_FROZEN, D19) and logs a `cloud-refused` row.
     */
    private freeze(sync: SyncSession, reason: string, alert?: { readonly kind: string; readonly message: string; readonly logError: string }): void {
        const first = sync.uplinkState !== 'frozen';
        sync.uplinkState = 'frozen';
        sync.helloOk = false;
        sync.round = null;
        sync.frozenAtMs = sync.frozenAtMs ?? this.clock();
        sync.frozenReason = reason;
        const record = this.safeState(() => this.state.sessions.get(sync.nSesid), null);
        if (record && ['assigned', 'armed', 'live', 'recovering'].includes(record.localState)) {
            this.safeState(() => this.state.sessions.setLocal(sync.nSesid, { localState: 'frozen' }, this.clock()), null);
        }
        if (first) {
            if (alert) this.raise('P1', true, alert.kind, alert.message, sync.nSesid);
            else this.raise('P1', true, 'LINEAGE_FROZEN', `session ${sync.nSesid}: uplink frozen (${reason}); an admin splits to direct cloud (D7)`, sync.nSesid);
            this.logRow({ event: 'error', code: 'cloud-refused', problem: true, nSesid: sync.nSesid, data: { error: alert?.logError ?? 'history-refused' } });
        }
        this.statusChanged(sync.nSesid, 'uplink');
        this.linkChanged();
    }

    private unfreezeLocal(nSesid: string): void {
        const view = this.kernel.session(nSesid);
        this.safeState(() => this.state.sessions.setLocal(nSesid, { localState: view?.firstLineAtMs ? 'live' : 'armed' }, this.clock()), null);
    }

    /**
     * Pages the cloud lacks after a resume (critic item 21): no ack state survives a restart (§5.5), so the age of the
     * oldest change it lacks comes from the journal: the receive time of the first DATA record past the raw seq its
     * last applied round covered (no line can have changed before it). It goes first in `pendingCuts` under the
     * current rev (a round acked at or past it covers it) unless a cut already recorded is as old. Without it a box
     * restarted with unsent pages read "0 s behind" for the whole catch-up.
     */
    private async seedLagFromJournal(sync: SyncSession, rev: number): Promise<void> {
        const atMs = await this.journalTimeFrom(sync.nSesid, (sync.lineage.appliedRawSeq ?? 0) + 1, true);
        if (atMs === null) return;
        if (sync.pendingCuts.length && sync.pendingCuts[0].atMs <= atMs) return;
        sync.pendingCuts.unshift({ rev, atMs });
    }

    /**
     * The raw lane's counterpart (item 21): the journal head at the hello, dated by the receive time of the first record
     * the cloud has not acked (`seedRawSeen`, review 2026-10-04: seeding only that first record let a partial ack drop
     * the lag to "seconds since the hello" with most of the backlog still unsent).
     */
    private async seedRawLagFromJournal(sync: SyncSession, headSeqAtHello: number): Promise<void> {
        const atMs = await this.journalTimeFrom(sync.nSesid, sync.rawAcked.seq + 1, false);
        if (atMs === null) return;
        sync.rawSeen = seedRawSeen(sync.rawSeen, sync.rawAcked.seq, headSeqAtHello, atMs);
    }

    /**
     * The receive time (`tRecvMs`) of the record at `fromSeq`, or with `dataOnly` of the first DATA record from there
     * within one read (else the last record read: never later than the change). Null when the journal does not hold
     * it or cannot be read (the lag then counts from the cuts recorded since).
     */
    private async journalTimeFrom(nSesid: string, fromSeq: number, dataOnly: boolean): Promise<number | null> {
        let range;
        try {
            range = await this.kernel.readRaw(nSesid, Math.max(1, fromSeq), dataOnly ? JOURNAL_SEED_READ_BYTES : 1, { includeUndurable: true });
        } catch {
            return null;
        }
        if (!range) return null;
        let last: number | null = null;
        for (let offset = 0; offset < range.recs.length; ) {
            const d = decodeRecordAt(range.recs, offset);
            if (!d.ok) break;
            const t = d.record.tRecvMs > 0 ? d.record.tRecvMs : null;
            if (t !== null && (!dataOnly || d.record.type === RecordType.DATA)) return t;
            if (t !== null) last = t;
            offset += d.size;
        }
        return last;
    }

    private async recover(sync: SyncSession, fromSeq: number): Promise<void> {
        if (sync.recovering) return;
        sync.recovering = true;
        sync.uplinkState = 'recovering';
        sync.helloOk = false;
        this.statusChanged(sync.nSesid, 'uplink');
        try {
            const res = await this.kernel.recoverFromCloud(sync.nSesid, fromSeq, (from, to) => this.request<EdgeRawPullReply>(EdgeEvent.rawpull, { nSesid: sync.nSesid, fromSeq: from, toSeq: to }));
            if (res.ok === true) {
                this.logger.log(`session ${sync.nSesid} recovered ${res.records} record(s) from the cloud (seq ${res.fromSeq}..${res.toSeq})`);
                sync.uplinkState = 'ok';
                sync.recovering = false;
                sync.recoverAlert = null;
                sync.recoverRefusals = 0;
                sync.recoverExhausted = null;
                // Resume from the repaired journal on the next hello.
                setImmediate(() => void this.runHello());
                return;
            }
            if (res.reason === 'chain-mismatch') {
                sync.recovering = false;
                sync.recoverRefusals = 0;
                this.freeze(sync, `RECOVER refused: ${res.message}`);
                return;
            }
            if (this.escalateRecover(sync, res.reason, res.message)) return;
            this.recoverFailed(sync, res.reason, `session ${sync.nSesid}: RECOVER ${res.reason} (${res.message}); retried at the next hello`);
        } catch (err) {
            this.recoverFailed(sync, 'error', `session ${sync.nSesid}: RECOVER failed (${errText(err)}); retried at the next hello`);
        } finally {
            sync.recovering = false;
        }
    }

    /** RECOVER_FAILED, P2: once per session and cause, again only when the cause changes or after RECOVER_FAILED_REALERT_MS. */
    private recoverFailed(sync: SyncSession, cause: string, message: string): void {
        const mono = this.mono();
        const last = sync.recoverAlert;
        if (last && last.cause === cause && mono - last.atMono < (this.opts.recoverRealertMs ?? RECOVER_FAILED_REALERT_MS)) {
            this.logger.warn(`${message} (alert already raised)`);
            return;
        }
        sync.recoverAlert = { cause, atMono: mono };
        this.raise('P2', false, 'RECOVER_FAILED', message, sync.nSesid);
    }

    /**
     * MR-4 (spec §5.1 "Integrity on boot", §5.5): a corrupt journal resolves by RECOVER, "or by freeze + split". The
     * refusals that prove RECOVER cannot repair it are `cloud-behind` (the cloud holds nothing past the verified head:
     * the records after the corruption were never acked, so no later hello brings them) and `session-ended` (RECOVER
     * never runs for an ending or ended session). After RECOVER_ESCALATE_AFTER of them in a row, the session is frozen
     * for an admin with one P1 alert naming the next step; true when it did. Other outcomes (io-error, a pull that
     * threw) say nothing about the cloud's records and neither count nor reset the streak; a whole journal resets it.
     */
    private escalateRecover(sync: SyncSession, reason: string, message: string): boolean {
        if (!this.kernel.session(sync.nSesid)?.journalCorrupt) {
            sync.recoverRefusals = 0;
            return false;
        }
        if (reason !== 'cloud-behind' && reason !== 'session-ended') return false;
        sync.recoverRefusals += 1;
        const limit = Math.max(1, this.opts.recoverEscalateAfter ?? RECOVER_ESCALATE_AFTER);
        if (sync.recoverRefusals < limit) return false;
        const ended = reason === 'session-ended';
        const why = ended
            ? 'the session has ended, so it can no longer be repaired from etabella.net'
            : 'etabella.net holds nothing to repair it with (the damaged part was never uploaded)';
        const next = ended
            ? 'a super-admin force-closes the session in RT Production ("Force close (incomplete)", runbook 11 step 5)'
            : 'the hearing operator or a super-admin uses "Split to direct cloud" in RT Production so the transcript continues on etabella.net (runbook 8 and 10.4)';
        const text =
            `session ${sync.nSesid}: the box's recording of this session is damaged and ${why}; RECOVER was refused ${sync.recoverRefusals} times in a row (${reason}). ` +
            `Its upload is frozen. Next step: ${next}. The room keeps reading what the box holds; the reporter's Eclipse file is the authority for the damaged part (D25).`;
        sync.recoverExhausted = { reason, atMs: this.clock() };
        this.freeze(sync, `the journal is corrupt and RECOVER cannot repair it (${reason} ×${sync.recoverRefusals}: ${message})`, { kind: 'JOURNAL_UNRECOVERABLE', message: text, logError: 'journal-unrecoverable' });
        return true;
    }

    private endFromCloud(nSesid: string): void {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record || record.cloudOp === 'end') {
            if (record && !record.endedAtMs) void this.kernel.requestEnd(nSesid, 'cloud').catch(() => undefined);
            return;
        }
        this.safeState(() => this.state.sessions.requestEnd(nSesid, this.clock()), null);
        this.publish('assignments-changed', emptyDiff(this.clock(), { sessionsEndRequested: [nSesid] }));
    }

    private markSealed(sync: SyncSession, state: 'K' | 'W' | null): void {
        sync.sealState = state;
        sync.helloOk = false;
        sync.round = null;
        const now = this.clock();
        this.safeState(() => this.state.sessions.setLocal(sync.nSesid, { localState: 'sealed', sealedAtMs: now, sealState: state }, now), null);
        this.logRow({ event: 'success', code: 'cloud-synced', problem: false, nSesid: sync.nSesid });
        this.statusChanged(sync.nSesid, 'uplink');
    }

    /** `e.ready` once per armed session (spec §4.2 "Delivery to the edge": the box stores, arms, replies e.ready). */
    private async sendReady(diff: AssignmentsDiff | null): Promise<void> {
        const ids = new Set<string>([...(diff?.sessionsAdded ?? []), ...(diff?.sessionsUpdated ?? [])]);
        for (const r of this.safeState(() => this.state.sessions.list(), [] as ReturnType<StatePort['sessions']['list']>)) {
            if (!this.readyAcked.has(r.nSesid) && sessionArmable(r)) ids.add(r.nSesid);
        }
        for (const nSesid of ids) await this.armAndReady(nSesid);
    }

    private async armAndReady(nSesid: string): Promise<void> {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record || !sessionArmable(record)) return;
        const res = await this.kernel.arm(nSesid).catch(() => null);
        if (!res?.ok) return;
        if (!this.readyAcked.has(nSesid) && !this.readySending.has(nSesid)) {
            this.readySending.add(nSesid);
            try {
                const ack = await this.request<{ ok?: boolean }>(EdgeEvent.ready, { nSesid });
                if (ack?.ok) this.readyAcked.add(nSesid);
            } catch {
                /* the next hello announces it again */
            } finally {
                this.readySending.delete(nSesid);
            }
        }
        if (!this.helloSessions.has(nSesid) && this.isOnline()) setImmediate(() => void this.runHello());
    }

    // =============================================================================================================
    // Cloud → box
    // =============================================================================================================

    private async onAssign(msg: CAssign, ack?: (r: unknown) => void): Promise<void> {
        const reply = (r: unknown): void => {
            if (typeof ack === 'function') ack(r);
        };
        const now = this.clock();
        try {
            switch (msg?.op) {
                case 'upsert': {
                    if (this.state.identity.get()?.status === 'quarantined') return reply({ ok: false });
                    const d = sessionDeliveryFrom((msg as { session?: unknown }).session);
                    if (!d) return reply({ ok: false });
                    const res = this.state.sessions.upsertAssignment(d.assignment, now);
                    this.state.assignments.markSynced(now);
                    const diff = emptyDiff(now, {
                        sessionsAdded: res === 'added' ? [d.assignment.nSesid] : [],
                        sessionsUpdated: res === 'updated' ? [d.assignment.nSesid] : [],
                        sessionsEndRequested: d.assignment.cloudOp === 'end' && res !== 'unchanged' ? [d.assignment.nSesid] : [],
                    });
                    this.publish('assignments-changed', diff);
                    reply({ ok: true });
                    await this.armAndReady(d.assignment.nSesid);
                    return;
                }
                case 'end': {
                    const nSesid = (msg as { nSesid?: string }).nSesid;
                    const record = nSesid ? this.state.sessions.get(nSesid) : null;
                    if (!record || record.localState === 'purged') return reply({ ok: false });
                    const before = record.cloudOp;
                    this.state.sessions.requestEnd(nSesid!, now);
                    if (before !== 'end') this.publish('assignments-changed', emptyDiff(now, { sessionsEndRequested: [nSesid!] }));
                    return reply({ ok: true });
                }
                case 'revoke-user': {
                    const m = msg as { nUserid?: string; jtis?: string[] };
                    if (!m.nUserid) return reply({ ok: false });
                    this.state.revocations.revokeUser(m.nUserid, now);
                    const jtis = (m.jtis ?? []).filter(j => typeof j === 'string' && j);
                    for (const jti of jtis) this.state.revocations.denyJti(jti, now + 25 * 3_600_000, 'cloud', now);
                    this.publish('access-revoked', { jtis, userIds: [m.nUserid], reason: 'cloud-revocation', atMs: now });
                    return reply({ ok: true });
                }
                case 'purge': {
                    const nSesid = (msg as { nSesid?: string }).nSesid;
                    return reply({ ok: nSesid ? await this.purge(nSesid) : false });
                }
                case 'quarantine':
                    this.applyRefusal('QUARANTINED', 'notice');
                    this.linkChanged();
                    return reply({ ok: true });
                default:
                    // 'drain' / 'fence' are Phase-4 in-session failover (D1).
                    this.raise('P2', false, 'UNSUPPORTED_ASSIGN', `c.assign op ${String((msg as { op?: unknown })?.op)} is not supported in v1`);
                    return reply({ ok: false });
            }
        } catch (err) {
            this.logger.error(`c.assign ${String((msg as { op?: unknown })?.op)} failed: ${errText(err)}`);
            reply({ ok: false });
        }
    }

    /**
     * `c.assign{op:'purge'}`. Two cases are acknowledged (the cloud's wire contract):
     * - "Use direct cloud instead" (O-8): the box has received NO CAT byte for the session (nothing journaled but the
     *   header records, no connection, never ended) — the session leaves the box at once;
     * - retention of a session the cloud sealed and the kernel no longer holds (§10 #19).
     * Anything else (bytes received, not sealed, a held capture waiting) answers `{ok:false}`.
     */
    private async purge(nSesid: string): Promise<boolean> {
        const record = this.state.sessions.get(nSesid);
        if (!record) return false;
        if (record.localState === 'purged') return true;
        const kv = this.kernel.session(nSesid);
        const neverFed = !!kv && kv.bytesIn === 0 && kv.firstLineAtMs === null && !kv.catConnected && kv.heldPeers.length === 0 && kv.endedAtMs === null && record.endedAtMs === null;
        const sealedAndDropped = !!record.sealedAtMs && kv === null;
        if (!neverFed && !sealedAndDropped) return false;
        if (this.state.heldCaptures.list({ nSesid, pendingUpload: true }).length) return false;
        if (this.state.heldCaptures.list({ nSesid }).some(c => c.toMs === null)) return false;
        const now = this.clock();
        // The kernel drops the session (route removed, worker closed) on this diff, before the files go.
        this.state.sessions.purge(nSesid, now);
        this.publish('assignments-changed', emptyDiff(now, { sessionsPurged: [nSesid] }));
        const deadline = this.mono() + 5_000;
        while (this.kernel.session(nSesid) !== null && this.mono() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
        await this.state.checkpoints.removeAll(nSesid).catch(() => undefined);
        const rm = (dir: string): Promise<void> => fs.promises.rm(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }).catch(err => this.logger.warn(`purge of ${dir} failed: ${errText(err)}`));
        await rm(path.join(this.config.paths.journalDir, nSesid));
        await rm(path.join(this.config.paths.captureDir, nSesid));
        this.syncs.delete(nSesid);
        this.readyAcked.delete(nSesid);
        return true;
    }

    /**
     * `c.marks` (live mark sync, user decision 2026-10-05): the marks of a session changed on etabella.net for the
     * users listed (the author and the people the mark is shared with). No mark rides on it.
     * - Checked with edge-sync's `parseCMarks`: uuids only, 1..C_MARKS_MAX_USERS users (the cloud sends a longer list
     *   as several events), known kinds; anything else is dropped whole, with one warning a minute.
     * - Ignored for a session this box does not hold (unknown, purged, or deleted in the cloud): nobody on the LAN
     *   can open it, and its marks are read from etabella.net.
     * - Published as `marks-changed` (reason `cloud`, the stored session id): RtDataService makes those users' cached
     *   reads stale at once, and the LAN gateway tells their devices. Never throws.
     */
    private onMarks(msg: unknown): void {
        try {
            const notice = parseCMarks(msg);
            if (!notice) {
                const nowMs = this.mono();
                if (this.marksWarnedAt === null || nowMs - this.marksWarnedAt >= 60_000) {
                    this.marksWarnedAt = nowMs;
                    this.logger.warn(`c.marks dropped: ${cMarksProblem(msg) ?? 'unreadable'}`);
                }
                return;
            }
            const record = this.safeState(() => this.state.sessions.get(notice.nSesid), null);
            if (isSessionGone(record)) return;
            this.publish('marks-changed', { reason: 'cloud', nSesid: record.nSesid, users: notice.users, kinds: notice.kinds, atMs: notice.atMs });
        } catch (err) {
            this.logger.error(`c.marks failed: ${errText(err)}`);
        }
    }

    private onNeed(msg: CNeed, ack?: (r: unknown) => void): void {
        const sync = msg?.nSesid ? this.syncs.get(msg.nSesid) : undefined;
        if (sync) {
            if (Array.isArray(msg.pages) && sync.cloud) {
                const digests = [...sync.cloud.digests];
                for (const p of msg.pages) if (Number.isInteger(p) && p >= 1) digests[p - 1] = '';
                sync.cloud = { digests, totalLines: null, root: null };
            }
            if (Number.isInteger(msg.rawFrom) && msg.rawFrom >= 1) sync.rawCursor = Math.min(sync.rawCursor, msg.rawFrom);
            if (sync.heldShrinkId) {
                // The cloud decided the held shrink (realtime-server EdgeSyncService.decideShrink sends c.need when an
                // admin confirms it): drop the hold and resume from a fresh hello now, not after the re-hello interval.
                sync.heldShrinkId = null;
                sync.heldAtMs = null;
                sync.helloOk = false;
                sync.round = null;
                setImmediate(() => void this.runHello());
            }
            this.kick();
        }
        if (typeof ack === 'function') ack({ ok: !!sync });
    }

    // =============================================================================================================
    // The pump: rounds, raw lane, seals (§5.6)
    // =============================================================================================================

    private kick(): void {
        if (!this.isOnline() || this.closed) return;
        setImmediate(() => void this.pump());
    }

    private async pump(): Promise<void> {
        if (this.pumping) {
            this.pumpAgain = true;
            return;
        }
        this.pumping = true;
        try {
            while (this.isOnline() && !this.closed && this.pausePump === 0) {
                const job = pickUplinkJob(this.candidates(), this.lastServed);
                if (!job) break;
                const sync = this.syncs.get(job.nSesid)!;
                this.lastServed = job.nSesid;
                const gen = this.gen;
                let progressed: boolean;
                try {
                    if (job.kind === 'seal') progressed = (await this.sendSeal(sync)) !== null;
                    else if (job.kind.startsWith('raw')) progressed = await this.sendRaw(sync);
                    else progressed = await this.sendRoundPart(sync);
                } catch (err) {
                    if (gen === this.gen && !(err instanceof UplinkOfflineError)) this.logger.warn(`${job.kind} for ${job.nSesid}: ${errText(err)}`);
                    break;
                }
                if (gen !== this.gen) break;
                // A job that sent nothing ends this run (the tick wakes the pump again): never spin.
                if (!progressed) break;
            }
        } finally {
            this.pumping = false;
            if (this.pumpAgain) {
                this.pumpAgain = false;
                this.kick();
            }
        }
    }

    private waitPumpIdle(): Promise<void> {
        return new Promise(resolve => {
            const check = (): void => {
                if (this.pumping) setTimeout(check, 5);
                else resolve();
            };
            check();
        });
    }

    private candidates(): UplinkCandidate[] {
        const now = this.clock();
        const mono = this.mono();
        const starveMs = rawStarveMs(this.limits.maxPart, this.limits.rawMinBps);
        const out: UplinkCandidate[] = [];
        for (const sync of this.syncs.values()) {
            if (!sync.helloOk || sync.uplinkState !== 'ok' || sync.stopped || sync.recovering) continue;
            const kv = this.kernel.session(sync.nSesid);
            const view = this.kernel.view(sync.nSesid);
            if (!kv || !view || kv.journalCorrupt) continue;
            const degraded = kv.durability === 'degraded';
            // Raw lane: durable records (plus undurable ones in degraded mode, MR-5).
            const rawLimit = degraded ? kv.raw.headSeq : kv.raw.durableSeq;
            sync.rawSeen = noteRawHead(sync.rawSeen, kv.raw.headSeq, sync.rawAcked.seq, now);
            const rawDue = sync.rawCursor <= rawLimit && mono >= sync.rawBusyUntil;
            // The raw floor (review 35): records that have waited RAW_STARVE_MS for a send go ahead of the next round.
            sync.rawWaitSince = rawDue ? sync.rawWaitSince ?? mono : null;
            const raw = rawDue
                ? { lagBytes: (kv.raw.headSeq - sync.rawAcked.seq) * sync.bytesPerRecord, degraded, starved: sync.rawWaitSince !== null && mono - sync.rawWaitSince >= starveMs }
                : null;
            // Rounds: one in flight; in degraded mode only once the cloud holds the raw the round covers.
            let round: UplinkCandidate['round'] = null;
            if (mono >= sync.busyUntil && !sync.heldShrinkId && sync.cloud) {
                if (sync.round) round = { dirtyPages: sync.round.built.dirty.length };
                else if (needsRound(view, sync.cloud) && (!degraded || view.rawSeqThrough <= sync.rawAcked.seq)) round = { dirtyPages: dirtyPages(view.digests, sync.cloud.digests).length };
            }
            const end = this.kernel.endResult(sync.nSesid);
            const seal = !!end && sync.sealState === null && !raw && !round && mono >= sync.sealRetryAt && sync.rawAcked.seq >= end.rawFinalSeq && !!sync.cloud && !needsRound(view, sync.cloud);
            out.push({ nSesid: sync.nSesid, raw, round, seal });
        }
        return out;
    }

    private async throttle(bytes: number): Promise<void> {
        for (;;) {
            const wait = this.budget.take(bytes);
            if (wait <= 0) return;
            await new Promise(resolve => setTimeout(resolve, Math.min(wait, 1_000)));
        }
    }

    private async sendRoundPart(sync: SyncSession): Promise<boolean> {
        const view = this.kernel.view(sync.nSesid);
        if (!view || !sync.cloud) return false;
        if (!sync.round) {
            // Every round is newer than anything the cloud applied (§5.5 "rev = max(rev, appliedRev)+1").
            const source: RoundSource = { ...view, rev: Math.max(view.rev, sync.appliedRev + 1) };
            let built: BuiltRound | null;
            try {
                built = buildRound({ source, epoch: sync.epoch, rebaseSeq: sync.rebaseSeq, lineage: sync.lineage, cloud: sync.cloud, maxPartBytes: this.limits.maxPart });
            } catch (err) {
                if (err instanceof PageTooLargeError) {
                    this.freeze(sync, err.message);
                    return false;
                }
                throw err;
            }
            if (!built) return false;
            sync.round = { built, next: 0, viewRev: view.rev };
            sync.lastRound = { rawSeqThrough: view.rawSeqThrough, rawHashThrough: view.rawHashThrough };
            if (built.dirty.length > CATCH_UP_ROUND_PAGES && !sync.catchingUpLogged) {
                sync.catchingUpLogged = true;
                this.logRow({ event: 'feed', code: 'cloud-catching-up', problem: false, nSesid: sync.nSesid, data: { pages: built.dirty.length } });
            }
        }
        const round = sync.round;
        const part = round.built.parts[round.next];
        await this.throttle(round.built.partBytes[round.next]);
        const gen = this.gen;
        const reply = await this.request<RoundReply>(EdgeEvent.round, part);
        if (gen !== this.gen || sync.round !== round) return true;
        const action = classifyReply(reply);
        const now = this.clock();
        switch (action.kind) {
            case 'partial':
                round.next += 1;
                if (round.next >= round.built.parts.length) sync.round = null; // the cloud wants more than we sent: rebuild
                return true;
            case 'acked': {
                sync.round = null;
                sync.cloud = round.built.afterAck.cloud;
                sync.appliedRev = action.appliedRev;
                sync.lineage = round.built.afterAck.lineage;
                sync.appliedRawSeq = round.built.afterAck.lineage.appliedRawSeq;
                sync.cloudRoot = action.root;
                sync.lastSyncedAtMs = now;
                this.lastSyncAt = now;
                this.lastCheckedAt = now;
                sync.pendingCuts = sync.pendingCuts.filter(c => c.rev > round.viewRev);
                const latest = this.kernel.view(sync.nSesid);
                if (sync.catchingUpLogged && latest && !needsRound(latest, sync.cloud)) {
                    sync.catchingUpLogged = false;
                    this.logRow({ event: 'success', code: 'cloud-synced', problem: false, nSesid: sync.nSesid });
                }
                this.statusChanged(sync.nSesid, 'uplink');
                this.linkChanged();
                return true;
            }
            case 'rebuild':
                sync.round = null;
                sync.cloud = action.cloud;
                return true;
            case 'retry':
                sync.round = null;
                sync.busyUntil = this.mono() + Math.max(50, action.retryMs);
                return true;
            case 'rehello':
                sync.round = null;
                if (action.alert) this.raise(action.alert, false, `ROUND_${action.code}`, `session ${sync.nSesid}: round refused ${action.code}`, sync.nSesid);
                sync.helloOk = false;
                setImmediate(() => void this.runHello());
                return true;
            case 'recover':
                sync.round = null;
                sync.helloOk = false;
                setImmediate(() => void this.runHello());
                return true;
            case 'freeze':
                this.freeze(sync, 'the cloud refused the round: FORK (D19)');
                return true;
            case 'hold':
                sync.round = null;
                sync.heldShrinkId = action.heldId;
                sync.heldAtMs = this.mono();
                this.raise('P1', false, 'HELD_SHRINK', `session ${sync.nSesid}: a shrinking round is held for an admin (MR-2)`, sync.nSesid);
                this.statusChanged(sync.nSesid, 'uplink');
                return true;
            case 'stop':
                sync.round = null;
                sync.stopped = action.code;
                this.raise('P2', false, `ROUND_${action.code}`, `session ${sync.nSesid}: round refused ${action.code}; pushing stops until the next hello`, sync.nSesid);
                return true;
        }
        return true;
    }

    private async sendRaw(sync: SyncSession): Promise<boolean> {
        const kv = this.kernel.session(sync.nSesid);
        if (!kv) return false;
        const degraded = kv.durability === 'degraded';
        const range = await this.kernel.readRaw(sync.nSesid, sync.rawCursor, this.limits.maxPart, { includeUndurable: degraded });
        if (!range) return false;
        await this.throttle(range.recs.length);
        const gen = this.gen;
        const reply = await this.request<RawAck | RawNack>(EdgeEvent.raw, { nSesid: sync.nSesid, epoch: sync.epoch, fromSeq: range.fromSeq, toSeq: range.toSeq, prevHash: range.prevHash, recs: range.recs });
        if (gen !== this.gen) return true;
        const now = this.clock();
        const count = range.toSeq - range.fromSeq + 1;
        if (count > 0) sync.bytesPerRecord = Math.max(1, Math.round((sync.bytesPerRecord * 3 + range.recs.length / count) / 4));
        if (reply && typeof (reply as RawAck).ackedSeq === 'number' && typeof (reply as RawAck).ackedHash === 'string') {
            const ack = reply as RawAck;
            if (ack.ackedSeq === range.toSeq && ack.ackedHash !== range.toHash) {
                this.raise('P1', true, 'RAW_CHAIN', `session ${sync.nSesid}: the cloud acked seq ${ack.ackedSeq} with another chain hash`, sync.nSesid);
                sync.helloOk = false;
                setImmediate(() => void this.runHello());
                return true;
            }
            sync.rawAcked = { seq: ack.ackedSeq, hash: ack.ackedHash };
            sync.rawCursor = Math.max(sync.rawCursor, ack.ackedSeq + 1);
            sync.rawWaitSince = null; // served: whatever still waits starts a new wait (the raw floor, review 35)
            // The lag follows the oldest record still not acked, not the start of a burst that never caught up (item 22).
            sync.rawSeen = dropAckedRaw(sync.rawSeen, sync.rawAcked.seq);
            sync.lastSyncedAtMs = now;
            this.lastSyncAt = now;
            this.lastCheckedAt = now;
            return true;
        }
        const nack = reply as RawNack;
        const mono = this.mono();
        switch (nack?.reason) {
            case 'gap':
                sync.rawCursor = Math.max(1, Math.min(Number(nack.expectSeq) || 1, kv.raw.headSeq + 1));
                return true;
            case 'rate':
                sync.rawBusyUntil = mono + Math.max(50, nack.retryAfterMs ?? 1_000);
                return true;
            case 'crc':
                sync.rawBusyUntil = mono + 1_000;
                return true;
            case 'chain':
            case 'epoch':
                // The cloud's lineage differs; the hello decides (recover or frozen).
                sync.helloOk = false;
                setImmediate(() => void this.runHello());
                return true;
            default:
                // An unknown reply (a cloud error): try again a little later.
                sync.rawBusyUntil = mono + 2_000;
                return true;
        }
    }

    private async sendSeal(sync: SyncSession): Promise<SealReply | null> {
        const end = this.kernel.endResult(sync.nSesid);
        const view = this.kernel.view(sync.nSesid);
        if (!end || !view || !sync.cloud) return null;
        const claims = sealClaims({
            source: { ...view, rev: Math.max(view.rev, sync.appliedRev) },
            cloud: sync.cloud,
            appliedRev: sync.appliedRev,
            epoch: sync.epoch,
            rawFinalSeq: end.rawFinalSeq,
            rawFinalHash: end.rawFinalHash,
            endedAtEdgeMs: end.endedAtEdgeMs,
            endedBy: end.endedBy,
            incidents: end.incidents.map(stripIncident),
        });
        if (!claims) return null;
        const key = await this.loadKey();
        const seal: EdgeSeal = { ...claims, sig: key.sign(sealSigningPayload(claims)) };
        const gen = this.gen;
        const reply = await this.request<SealReply>(EdgeEvent.seal, seal);
        if (gen !== this.gen) return reply;
        if (reply && reply.complete === true) {
            this.markSealed(sync, reply.state === 'K' || reply.state === 'W' ? reply.state : null);
            return reply;
        }
        sync.sealRetryAt = this.mono() + (this.opts.sealRetryMs ?? UPLINK_DEFAULTS.sealRetryMs);
        const incomplete = (reply && reply.complete === false ? reply : { complete: false as const, needPages: [] as number[] }) as Extract<SealReply, { complete: false }>;
        const needPages = Array.isArray(incomplete.needPages) ? incomplete.needPages : [];
        if (needPages.length && sync.cloud) {
            const digests = [...sync.cloud.digests];
            for (const p of needPages) if (Number.isInteger(p) && p >= 1) digests[p - 1] = '';
            sync.cloud = { digests, totalLines: null, root: null };
        }
        if (Number.isInteger(incomplete.rawFrom) && incomplete.rawFrom >= 1) sync.rawCursor = Math.min(sync.rawCursor, incomplete.rawFrom);
        this.raise('P2', false, 'SEAL_INCOMPLETE', `session ${sync.nSesid}: the cloud has not accepted the seal yet (needs ${needPages.length} page(s)${incomplete.rawFrom ? `, raw from ${incomplete.rawFrom}` : ''})`, sync.nSesid);
        return incomplete;
    }

    // =============================================================================================================
    // Housekeeping: tick, status, probe, held captures
    // =============================================================================================================

    private onTick(): void {
        if (this.closed) return;
        // A PC clock jump (Windows setting its clock) is folded into etabella.net time on every read of it (review
        // 2026-10-05); the tick is the heartbeat: it reports the jumps folded since the last one and saves the progress
        // of a backward correction.
        const jump = this.serverTime?.checkJump() ?? 0;
        if (jump !== 0) this.logger.log(`the PC clock jumped ${jump > 0 ? '+' : ''}${jump} ms; etabella.net time on the box did not move`);
        const now = this.clock();
        const mono = this.mono();
        const since = (at: number | null): number => (at === null ? Infinity : mono - at);
        this.noteJournalHeads(now);
        if (this.internetTracker.evaluate(now)) this.internetChanged();
        if (this.socket?.connected && this.mode === 'serve') {
            // New open sessions (armed later, recovered) need a hello before they can push.
            const missing = this.kernel.sessions().some(v => !v.recovering && !this.helloSessions.has(v.nSesid) && (this.kernel.view(v.nSesid) !== null || v.journalCorrupt));
            const held = [...this.syncs.values()].some(s => s.heldShrinkId && s.heldAtMs !== null && since(s.heldAtMs) >= (this.opts.heldShrinkRehelloMs ?? UPLINK_DEFAULTS.heldShrinkRehelloMs));
            const due = since(this.lastHelloAt) >= (this.opts.rehelloEveryMs ?? UPLINK_DEFAULTS.rehelloEveryMs);
            const resumable = this.helloDone && [...this.syncs.values()].some(s => !s.helloOk && s.uplinkState === 'ok' && !s.recovering && !s.stopped && s.sealState === null && this.kernel.session(s.nSesid) !== null);
            if ((missing || held || due || resumable || !this.helloDone) && !this.helloRunning && (this.helloRefusal === null || due)) void this.runHello();
            this.kick();
            if (this.isOnline() && since(this.lastCertCheck) >= (this.opts.certCheckEveryMs ?? EDGE_CERT_CHECK_INTERVAL_MS)) void this.certificateInBackground();
            if (this.isOnline()) void this.uploadPendingCapture(mono);
        }
        const every = this.isOnline() ? this.opts.probeOnlineEveryMs ?? UPLINK_DEFAULTS.probeOnlineEveryMs : this.opts.probeOfflineEveryMs ?? UPLINK_DEFAULTS.probeOfflineEveryMs;
        if (since(this.lastProbeAt) >= every) void this.probe();
        this.linkChanged();
    }

    /**
     * Every tick, online or not: note each open session's journal head for the lag (critic items 21, 22) — the raw lane
     * of the sessions a hello resumed (`rawSeen`), and for the others when a record past the head first seen arrived
     * (`preHello`; a session still replaying its journal is skipped until the replay committed).
     */
    private noteJournalHeads(now: number): void {
        const open = new Set<string>();
        for (const v of this.safeState(() => this.kernel.sessions(), [] as readonly KernelSessionView[])) {
            open.add(v.nSesid);
            const sync = this.syncs.get(v.nSesid);
            if (sync) sync.rawSeen = noteRawHead(sync.rawSeen, v.raw.headSeq, sync.rawAcked.seq, now);
            if (sync && sync.verdict !== null) {
                // A hello answered for it: the resume (journal seed) has the real lag now.
                this.preHello.delete(v.nSesid);
                continue;
            }
            if (v.recovering) continue;
            const p = this.preHello.get(v.nSesid);
            if (!p) this.preHello.set(v.nSesid, { headSeq: v.raw.headSeq, sinceMs: null });
            else if (p.sinceMs === null && v.raw.headSeq > p.headSeq) p.sinceMs = now;
        }
        for (const nSesid of [...this.preHello.keys()]) if (!open.has(nSesid)) this.preHello.delete(nSesid);
    }

    /**
     * Held captures upload in the background while online (needed before a purge, §10 #19); a failure is tried again
     * in a minute, except etabella.net's 503 NOT_CONFIGURED (no archive for venue uploads), which waits 15 min, then
     * 60 min per refusal in a row (user decision 2026-10-04: it used to retry every minute for hours). The failure is
     * kept for `CloudLinkStatus.lastUploadError`.
     */
    private async uploadPendingCapture(mono: number): Promise<void> {
        if (this.captureUploading || mono < this.captureRetryAt) return;
        const pending = this.safeState(() => this.state.heldCaptures.list({ pendingUpload: true }), []);
        if (!pending.length) return;
        this.captureUploading = true;
        try {
            await this.uploadCapture(pending[0].id);
        } catch (err) {
            const notConfigured = this.lastUploadError?.code === CAPTURE_NOT_CONFIGURED;
            this.captureNotConfigured = notConfigured ? this.captureNotConfigured + 1 : this.captureNotConfigured;
            const waits = this.opts.captureNotConfiguredRetryMs ?? UPLINK_DEFAULTS.captureNotConfiguredRetryMs;
            const waitMs = notConfigured && waits.length ? waits[Math.min(this.captureNotConfigured, waits.length) - 1] : this.opts.captureRetryMs ?? UPLINK_DEFAULTS.captureRetryMs;
            this.captureRetryAt = this.mono() + waitMs;
            // Kept across a restart (review 2026-10-04): a box restarted with etabella.net still answering
            // NOT_CONFIGURED waits out the step it reached instead of trying (and paging) again at once.
            const kept = { notConfigured: this.captureNotConfigured, nextTryAtMs: this.clock() + waitMs, lastError: this.lastUploadError };
            this.safeState(() => this.state.heldCaptures.setUploadState(kept), null);
            this.logger.warn(`held capture ${pending[0].id} not uploaded: ${errText(err)}; next try in ${Math.round(waitMs / 1000)} s`);
        } finally {
            this.captureUploading = false;
        }
    }

    /**
     * At start: the held-capture upload's backoff step, last failure and next try as the last run left them (review
     * 2026-10-04). The wait still to go is the kept wall time minus now, never more than the longest wait (a clock
     * stepped back must not hold the upload for days).
     */
    private restoreCaptureUploadState(): void {
        const kept = this.safeState(() => this.state.heldCaptures.uploadState(), null);
        if (!kept) return;
        this.captureNotConfigured = kept.notConfigured;
        this.lastUploadError = kept.lastError;
        const waits = this.opts.captureNotConfiguredRetryMs ?? UPLINK_DEFAULTS.captureNotConfiguredRetryMs;
        const longest = Math.max(this.opts.captureRetryMs ?? UPLINK_DEFAULTS.captureRetryMs, ...waits);
        this.captureRetryAt = this.mono() + Math.min(Math.max(0, kept.nextTryAtMs - this.clock()), longest);
    }

    /** HTTPS GET of `cloud.pingUrl` with certificate validation: internet evidence and etabella reachability. */
    private async probe(): Promise<void> {
        if (this.probing || this.closed || this.mode !== 'serve') return;
        this.probing = true;
        this.lastProbeAt = this.mono();
        try {
            const res = await this.http({ method: 'GET', url: this.config.cloud.pingUrl, timeoutMs: EDGE_TIMING.pingTimeoutMs });
            this.internetEvidence(true);
            this.etabellaOk = res.status > 0 && res.status < 500;
        } catch (err) {
            if (isNoInternet(err)) this.internetEvidence(false);
            else this.internetEvidence(true);
            this.etabellaOk = false;
        } finally {
            this.probing = false;
            this.lastCheckedAt = this.clock();
            this.linkChanged();
        }
    }

    private internetEvidence(up: boolean): void {
        if (this.internetTracker.evidence(up, this.clock())) this.internetChanged();
    }

    private internetChanged(): void {
        const st = this.internetTracker.status();
        const now = this.clock();
        this.safeState(
            () =>
                this.state.connectivityLog.append({
                    atMs: st.sinceMs ?? now,
                    event: st.state === 'up' ? 'connected' : 'disconnected',
                    source: 'network',
                    code: st.state === 'up' ? 'internet-up' : 'internet-down',
                    problem: st.state !== 'up',
                    nSesid: null,
                    sessionName: null,
                    peer: null,
                    actor: null,
                    data: {},
                }),
            null,
        );
        this.publish('internet-changed', st);
        for (const s of this.kernel.sessions()) this.statusChanged(s.nSesid, 'internet');
    }

    /**
     * Publish `cloud-link-changed` when the state moved from the one last published (the tick and every link event call
     * this). It alone writes `lastPublishedLink`, so no read of `cloudLink()` can swallow a change (critic item 20).
     * It also tracks since when something has been waiting to be sent (the "behind" grace, item 6).
     */
    private linkChanged(): void {
        const now = this.clock();
        const all = this.sessions();
        const waiting = new Set(all.filter(waitsToSend).map(s => s.nSesid));
        for (const nSesid of waiting) if (!this.waitingSince.has(nSesid)) this.waitingSince.set(nSesid, now);
        for (const nSesid of [...this.waitingSince.keys()]) if (!waiting.has(nSesid)) this.waitingSince.delete(nSesid);
        const state = this.linkState(all, now);
        if (this.lastPublishedLink?.state === state) return;
        this.lastPublishedLink = { state, sinceMs: now };
        this.publish('cloud-link-changed', this.cloudLink());
    }

    /** `e.status` (spec §12): every 5 s while connected, also for a quarantined box (it reports status only, §5.3). */
    private sendStatus(): void {
        const socket = this.socket;
        if (!socket?.connected || this.mode !== 'serve') return;
        const now = this.clock();
        const sessions: EdgeStatusSession[] = this.kernel.sessions().map(v => {
            const sync = this.syncs.get(v.nSesid);
            const sv = sync ? this.syncView(sync) : null;
            const row: EdgeStatusSession = {
                nSesid: v.nSesid,
                transmitterMode: v.mode ?? undefined,
                catConnected: v.catConnected,
                catPeer: v.peer,
                heldPeers: [...v.heldPeers],
                lockout: v.lockout,
                lastCatByteAgeMs: v.lastByteAtMs === null ? null : Math.max(0, now - v.lastByteAtMs),
                bytesIn: v.bytesIn,
                lastLineAtMs: v.lastLineAtMs,
                rev: v.rev,
                totalLines: v.totalLines,
                cloudAppliedRev: sv?.cloudAppliedRev ?? 0,
                dirtyPages: sv?.dirtyPages ?? 0,
                lagLines: sv?.lagLines ?? 0,
                lagBytes: sv?.lagBytes ?? 0,
                lagSec: sv?.lagSec ?? 0,
                uplinkState: sv?.uplinkState ?? 'ok',
                lastCloudSyncMs: sv?.lastSyncedAtMs ?? null,
                durability: v.durability,
                incidents: v.incidents.total,
                lanViewers: this.lanViewers.get(v.nSesid) ?? 0,
                parseErrors: v.parseErrors,
                feedStoppedAtMs: v.feedStoppedAtMs,
            };
            if (v.lastAudit) row.lastAuditOk = v.lastAudit.ok;
            return row;
        });
        const device: EdgeStatus['device'] = { sw: this.config.release.version, parserVer: FEED_PARSE_VERSION, uptime: Math.floor((now - this.startedAtMs) / 1000) };
        const h = this.deviceHealth;
        if (h) {
            for (const key of ['diskFreeMB', 'journalBytes', 'captureBytes', 'clockOffsetMs', 'chronySynced', 'certDaysLeft', 'upsOnBattery'] as const) {
                const value = h[key];
                if (value !== null && value !== undefined) (device as Record<string, unknown>)[key] = value;
            }
        }
        if (this.egressIp) device.egressIp = this.egressIp;
        const cert = this.certificate();
        if (cert.info) device.dCertExp = new Date(cert.info.notAfterMs).toISOString();
        const alerts = this.recentAlerts.splice(0).map(a => ({ source: a.source, tier: a.tier, critical: a.critical, kind: a.kind, message: a.message, atMs: a.atMs, nSesid: a.nSesid }));
        const status: EdgeStatus & { alerts?: unknown[] } = { sessions, device, ...(alerts.length ? { alerts } : {}) };
        socket.emit(EdgeEvent.status, status);
    }

    // =============================================================================================================
    // Actions
    // =============================================================================================================

    async syncNow(): Promise<void> {
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity) throw new EdgePortError('box_not_configured', 'the box is not enrolled');
        const refused = (who: BoxIdentityRecord): boolean => who.status === 'revoked' || who.status === 'quarantined' || who.linkFailure === 'key-refused';
        if (refused(identity)) throw new EdgePortError('box_not_linked', `the cloud refuses this box (${identity.status}${identity.linkFailure ? `, ${identity.linkFailure}` : ''})`);
        if (this.internetTracker.status().state === 'down') throw offline('the internet is unavailable');
        if (!this.started || this.closed) throw offline('the uplink is not running');
        // "Run checks again" also tries a waiting held capture at once (an admin may just have set up the archive).
        this.captureRetryAt = 0;
        const afterHello = (ok: boolean): void => {
            const now = this.safeState(() => this.state.identity.get(), null);
            if (now && refused(now)) throw new EdgePortError('box_not_linked', 'the cloud refuses this box');
            if (!ok || !this.isOnline()) throw offline('the cloud could not be reached');
        };
        if (this.socket?.connected) {
            afterHello(await this.runHello());
            return;
        }
        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }
        if (!this.socket && !this.connecting) void this.connectOnce();
        const deadline = this.mono() + (this.opts.syncNowTimeoutMs ?? UPLINK_DEFAULTS.syncNowTimeoutMs);
        while (this.mono() < deadline && !this.closed) {
            if (this.socket?.connected) {
                const pending = this.helloRunning;
                if (pending) {
                    afterHello(await pending);
                    return;
                }
                if (this.isOnline()) return;
            }
            if (!this.connecting && !this.socket && this.refused) break;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        afterHello(false);
    }

    async enrol(input: { readonly code: string; readonly cloudOrigin?: string; readonly rekey?: boolean }): Promise<UplinkEnrolResult> {
        const code = String(input?.code ?? '').replace(/\s+/g, '');
        if (!/^[A-Za-z0-9_-]{16,64}$/.test(code)) throw new EdgePortError('invalid_request', 'the enrolment code is malformed');
        let origin = this.config.cloud.origin;
        if (input.cloudOrigin !== undefined && input.cloudOrigin !== null) {
            let given: string;
            try {
                given = new URL(input.cloudOrigin).origin;
            } catch {
                throw new EdgePortError('invalid_request', '--cloud must be an absolute URL');
            }
            if (given !== origin) throw new EdgePortError('invalid_request', `--cloud ${given} differs from the box config (${origin}); fix the config first`);
            origin = given;
        }
        const keyFile = this.config.paths.deviceKeyFile;
        if (DeviceKey.exists(keyFile) && !input.rekey) throw new EdgePortError('invalid_request', `a device key already exists at ${keyFile}; pass --rekey to replace it`);
        const key = DeviceKey.generate();
        let res: CloudHttpResponse;
        try {
            res = await this.http({
                method: 'POST',
                url: this.apiUrl('edge/v1/enroll'),
                body: {
                    code,
                    cPubKey: key.spkiB64(),
                    bTpmKey: false,
                    cVersion: this.config.release.version,
                    cParserVer: FEED_PARSE_VERSION,
                    ...(this.config.transmitter.bindAddress ? { cLanIp: this.config.transmitter.bindAddress } : {}),
                },
                timeoutMs: 15_000,
            });
        } catch (err) {
            throw offline(`the cloud could not be reached: ${errText(err)}`);
        }
        const body = (res.json ?? {}) as Record<string, unknown>;
        const nEdgeid = typeof body.nEdgeid === 'string' ? body.nEdgeid : null;
        const slug = typeof body.cSlug === 'string' ? body.cSlug : null;
        if (res.status < 200 || res.status >= 300 || Number(body.msg ?? 1) !== 1 || !nEdgeid || !slug) {
            throw new EdgePortError('cloud_refused', `enrolment refused (${res.status}${body.cCode ? ` ${String(body.cCode)}` : ''})`);
        }
        if (typeof body.cKeyFpr === 'string' && body.cKeyFpr.replace(/[^0-9a-f]/gi, '').toLowerCase() !== key.fingerprintHex()) {
            throw new EdgePortError('cloud_refused', 'the cloud recorded another key fingerprint');
        }
        // The box host is `<slug>.<domain>`: an unusable slug is refused before the key or the identity is written.
        if (!/^[a-z0-9-]{1,63}$/.test(slug)) throw new EdgePortError('cloud_refused', `the cloud returned an unusable box name "${slug}"`);
        await key.save(keyFile);
        this.deviceKey = key;
        const now = this.clock();
        const status = String(body.cStatus ?? 'C').trim() === 'A' ? 'active' : 'pending-confirm';
        const record: BoxIdentityRecord = {
            nEdgeid,
            slug,
            status,
            keyFingerprint: key.fingerprint(),
            publicKeySpki: key.spkiB64(),
            tpmKey: false,
            cloudOrigin: origin,
            enrolledAtMs: now,
            confirmedAtMs: status === 'active' ? now : null,
            // Set by the running box's first hello (an enrolment is not a link).
            lastCloudContactAtMs: null,
            linkFailure: null,
        };
        this.state.identity.save(record);
        this.safeState(() => this.state.audit.append({ atMs: now, action: 'enrol', actor: null, outcome: 'ok', nSesid: null, target: nEdgeid, ip: null, deviceHash: null, data: { rekey: !!input.rekey, status } }), null);
        this.refused = null;
        if (this.started && !this.closed) this.scheduleConnect(0);
        return { nEdgeid, slug, keyFingerprint: record.keyFingerprint, status };
    }

    async relayOperatorCode(principal: EdgePrincipal): Promise<RelayedOperatorCode> {
        // Build decision "email sign-in only" (DR23): the operator code is switched off by default.
        if (!this.config.features.operatorCode) throw new EdgePortError('not_found', 'operator codes are switched off on this box');
        if (!principal || principal.kind !== 'online' || !principal.forwardable) throw new EdgePortError('online_sign_in_required', 'issuing the operator code needs an online sign-in');
        if (!principal.isSuperAdmin && !(principal.adminCaseIds ?? []).length) throw new EdgePortError('not_case_admin', 'only a case admin of a box case can issue the operator code');
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity) throw new EdgePortError('box_not_configured', 'the box is not enrolled');
        if (this.internetTracker.status().state === 'down') throw offline('the internet is unavailable');
        const day = boxDay(this.clock(), this.config.box.timeZone);
        let res: CloudHttpResponse;
        try {
            res = await this.http({
                method: 'POST',
                url: this.apiUrl('edge/v1/operator-code'),
                body: { nEdgeid: identity.nEdgeid, day },
                headers: { authorization: `Bearer ${principal.token}` },
                timeoutMs: 15_000,
            });
        } catch (err) {
            throw offline(`the cloud could not be reached: ${errText(err)}`);
        }
        const body = (res.json ?? {}) as Record<string, unknown>;
        const code = typeof body.code === 'string' ? normalizeOperatorCode(body.code) : '';
        if (res.status < 200 || res.status >= 300 || Number(body.msg ?? 1) !== 1 || !OPERATOR_CODE_RE.test(code)) {
            throw new EdgePortError('cloud_refused', `the cloud refused the operator code (${res.status})`);
        }
        const minted = (body.mintedBy && typeof body.mintedBy === 'object' ? body.mintedBy : {}) as Record<string, unknown>;
        const mintedBy = { nUserid: String(minted.nUserid ?? principal.userId ?? ''), name: String(minted.name ?? principal.name) };
        const scryptN = this.opts.operatorScryptN ?? UPLINK_DEFAULTS.operatorScryptN;
        const salt = randomBytes(16);
        const hash = await new Promise<Buffer>((resolve, reject) =>
            scryptCb(code, salt, 32, { N: scryptN, r: 8, p: 1, maxmem: 256 * scryptN * 8 + 1024 * 1024 }, (err, out) => (err ? reject(err) : resolve(out))),
        );
        const now = this.clock();
        const { replacedEarlier } = this.state.operatorCodes.put({ day, alg: 'scrypt', salt: salt.toString('base64'), hash: hash.toString('base64'), scryptN, issuedAtMs: now, mintedBy, source: 'relay' });
        return { code, day, validUntilMs: endOfBoxDay(now, this.config.box.timeZone), mintedBy, replacedEarlier };
    }

    async seal(nSesid: string): Promise<SealReply> {
        const end = this.kernel.endResult(nSesid);
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (record?.sealedAtMs && record.sealState) return { complete: true, state: record.sealState };
        if (!end) throw new EdgePortError('invalid_request', `session ${nSesid} has not ended on this box`);
        if (!this.isOnline()) throw offline('the uplink is not connected');
        const sync = this.syncs.get(nSesid);
        if (!sync || !sync.helloOk) throw offline('the session has not been resumed with the cloud yet');
        const deadline = this.mono() + 60_000;
        while (this.mono() < deadline && this.isOnline()) {
            const c = this.candidates().find(x => x.nSesid === nSesid);
            if (!c || (!c.raw && !c.round)) break;
            this.kick();
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        sync.sealRetryAt = 0;
        const reply = await this.sendSeal(sync);
        if (!reply) throw new EdgePortError('cloud_refused', 'the cloud does not hold the final state yet');
        return reply;
    }

    /**
     * Every failure is kept for `CloudLinkStatus.lastUploadError` (status and code as etabella.net answered, else the
     * box's own code), and cleared by an upload. The `e.capture` report goes once per capture, across restarts too:
     * the orphan id the cloud gave is kept with the capture (`heldCaptures.setOrphan`), and a retry goes straight to
     * `archive-url` under it (critic item 10, review 2026-10-04: each report costs the cloud a session-row lock and a
     * P1 HELD_CAT_CONNECTION page; the orphan row itself is idempotent).
     */
    async uploadCapture(id: string): Promise<{ readonly nOrphanid: string }> {
        try {
            const out = await this.uploadCaptureOnce(id);
            this.lastUploadError = null;
            this.captureNotConfigured = 0;
            this.safeState(() => this.state.heldCaptures.setUploadState(null), null);
            return out;
        } catch (err) {
            const failure = (err as { uploadFailure?: { status: number | null; code: string | null } })?.uploadFailure;
            this.lastUploadError = {
                atMs: this.clock(),
                status: failure?.status ?? null,
                code: failure?.code ?? (err instanceof EdgePortError ? err.code : null),
            };
            throw err;
        }
    }

    private async uploadCaptureOnce(id: string): Promise<{ readonly nOrphanid: string }> {
        const rec = this.safeState(() => this.state.heldCaptures.get(id), null);
        if (!rec) throw new EdgePortError('not_found', `held capture ${id} not found`);
        if (rec.uploadedAtMs && rec.nOrphanid) return { nOrphanid: rec.nOrphanid };
        if (!rec.sha256 || rec.toMs === null) throw new EdgePortError('invalid_request', `held capture ${id} is still open`);
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity) throw new EdgePortError('box_not_configured', 'the box is not enrolled');
        if (identity.status === 'revoked' || identity.status === 'quarantined') throw new EdgePortError('box_not_linked', `the box is ${identity.status}`);
        // The bytes must still be the ones recorded before anything is announced to the cloud.
        let bytes: Buffer;
        try {
            bytes = await fs.promises.readFile(rec.file);
        } catch (err) {
            throw new EdgePortError('not_found', `held capture ${id}: ${errText(err)}`);
        }
        if (createHash('sha256').update(bytes).digest('hex') !== rec.sha256) throw new EdgePortError('invalid_request', `held capture ${id} does not match its recorded sha256`);
        const oneShot = this.mode === 'cli' && !this.socket?.connected;
        if (oneShot) await this.connectForCommand();
        const connected = this.mode === 'cli' ? !!this.socket?.connected : this.isOnline();
        if (!connected) {
            if (oneShot) this.endCommandConnection();
            throw offline('the uplink is not connected');
        }
        const refused = (message: string, status: number | null, code: string | null): EdgePortError =>
            Object.assign(new EdgePortError('cloud_refused', message), { uploadFailure: { status, code } });
        try {
            let nOrphanid = rec.nOrphanid;
            if (!nOrphanid) {
                const reply = await this.request<EdgeCaptureReply>(EdgeEvent.capture, { kind: 'C', nSesid: rec.nSesid, user: rec.user ?? '', peer: rec.peer, fromMs: rec.fromMs, toMs: rec.toMs, bytes: rec.bytes, sha256: rec.sha256 });
                if (!reply?.ok || !reply.nOrphanid) throw refused('the cloud refused the held capture', null, 'cloud_refused');
                const reported = reply.nOrphanid;
                nOrphanid = reported;
                this.safeState(() => this.state.heldCaptures.setOrphan(id, reported), null);
            }
            const key = await this.loadKey();
            const nonce = await this.challenge(identity.nEdgeid);
            const res = await this.http({
                method: 'POST',
                url: this.apiUrl('edge/v1/archive-url'),
                body: { edgeId: identity.nEdgeid, nonce, nSesid: rec.nSesid, sha256: rec.sha256, bytes: rec.bytes, sig: key.sign(archiveUrlPayload(nonce, identity.nEdgeid, rec.nSesid, rec.sha256)) },
                timeoutMs: 15_000,
            });
            const body = (res.json ?? {}) as Record<string, unknown>;
            if (res.status < 200 || res.status >= 300 || typeof body.url !== 'string') {
                const cloudCode = cloudErrorCode(body);
                throw refused(`archive-url refused (${res.status}${cloudCode ? ` ${cloudCode}` : ''})`, res.status, cloudCode);
            }
            const headers = (body.headers && typeof body.headers === 'object' ? body.headers : {}) as Record<string, string>;
            const put = await this.http({ method: (body.method === 'POST' ? 'POST' : 'PUT') as 'PUT', url: body.url, body: bytes, headers: { 'content-type': 'application/octet-stream', ...headers }, timeoutMs: 120_000 });
            if (put.status < 200 || put.status >= 300) throw refused(`the archive upload failed (${put.status})`, put.status, null);
            this.state.heldCaptures.markUploaded(id, nOrphanid, this.clock());
            return { nOrphanid };
        } catch (err) {
            if (err instanceof EdgePortError) throw err;
            if (err instanceof CloudNetworkError || err instanceof UplinkOfflineError) throw offline(errText(err));
            throw err;
        } finally {
            if (oneShot) this.endCommandConnection();
        }
    }

    /** A one-shot connection for a CLI command (the lifecycle never starts the uplink in 'cli' mode; no hello). */
    private async connectForCommand(): Promise<void> {
        this.refused = null;
        const deadline = this.mono() + (this.opts.syncNowTimeoutMs ?? UPLINK_DEFAULTS.syncNowTimeoutMs) * 2;
        void this.connectOnce();
        while (this.mono() < deadline && !this.socket?.connected) {
            if (!this.connecting && !this.socket && this.refused) break;
            await new Promise(resolve => setTimeout(resolve, 25));
        }
        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }
    }

    /** Drop a CLI command's connection (the uplink stays usable for the next command; no reconnect in 'cli' mode). */
    private endCommandConnection(): void {
        if (this.connectTimer) {
            clearTimeout(this.connectTimer);
            this.connectTimer = null;
        }
        const socket = this.socket;
        this.socket = null;
        this.gen += 1;
        this.helloDone = false;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
    }

    // =============================================================================================================
    // Certificate (spec §8.3)
    // =============================================================================================================

    certificate(): EdgeCertificateStatus {
        const mono = this.mono();
        if (this.certCache && mono - this.certCache.at < EDGE_CERT_INSPECT_CACHE_MS) return this.certCache.status;
        const identity = this.safeState(() => this.state.identity.get(), null);
        const host = identity ? boxHostname(identity.slug, this.config.box.domain) : null;
        const status = certificateStatus(this.config.http.tls, file => fs.readFileSync(file), this.clock(), host);
        this.certCache = { at: mono, status };
        return status;
    }

    async ensureCertificate(): Promise<EdgeCertificateStatus> {
        // An install a crash or power cut interrupted is finished (or discarded) first (cert-install.ts, review 24).
        const tls = this.config.http.tls;
        if (tls && !this.certRun) {
            try {
                if (completeCertificateInstall(tls) === 'completed') this.logger.warn('finished a LAN certificate install that was interrupted');
            } catch (err) {
                this.logger.warn(`could not finish an interrupted LAN certificate install: ${errText(err)}`);
            }
        }
        this.certCache = null;
        const current = this.certificate();
        const now = this.clock();
        if (!certificateRenewalDue(current, now)) return current;
        if (this.certRun) return this.certRun;
        const identity = this.safeState(() => this.state.identity.get(), null);
        if (!identity) throw new EdgePortError('box_not_configured', 'the box is not enrolled');
        if (identity.status !== 'active') throw new EdgePortError('box_not_linked', `the box is ${identity.status}; no certificate`);
        this.certRun = this.fetchCertificate(identity, current).finally(() => {
            this.certRun = null;
        });
        return this.certRun;
    }

    /**
     * The background trigger (start, confirmation, every hello, the hourly check). A failed attempt is not repeated
     * before `certRetryMs` (default the hourly check, review 5): every hello used to generate a key, ask the cloud
     * and raise the alert again, once a minute. The alert goes to the cloud too (FORWARDED_UPLINK_ALERTS).
     */
    private async certificateInBackground(): Promise<void> {
        const mono = this.mono();
        this.lastCertCheck = mono;
        if (mono < this.certRetryAt) return;
        try {
            await this.ensureCertificate();
            this.certRetryAt = 0;
        } catch (err) {
            const days = this.certificate().daysLeft;
            const tier = days !== null && days < EDGE_CERT_PAGE_DAYS ? 'P1' : 'P2';
            if (!(err instanceof EdgePortError && (err.code === 'box_not_linked' || err.code === 'box_not_configured'))) {
                this.certRetryAt = this.mono() + (this.opts.certRetryMs ?? this.opts.certCheckEveryMs ?? EDGE_CERT_CHECK_INTERVAL_MS);
                this.raise(tier, false, 'CERTIFICATE_RENEWAL_FAILED', `the LAN certificate could not be renewed: ${errText(err)}`);
            }
        }
    }

    private async fetchCertificate(identity: BoxIdentityRecord, previous: EdgeCertificateStatus): Promise<EdgeCertificateStatus> {
        const tls = this.config.http.tls!;
        const host = boxHostname(identity.slug, this.config.box.domain);
        // 1. A NEW TLS key per issuance (never the device key). It stays in memory until the cloud returned a chain
        // for it: a refused or pending request writes nothing.
        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
        // 2. The CSR.
        const csr = buildCsr(host, privateKey, publicKey);
        // 3. Challenge + device signature + POST edge/v1/cert.
        const deviceKey = await this.loadKey();
        let res: CloudHttpResponse;
        try {
            const nonce = await this.challenge(identity.nEdgeid);
            res = await this.http({
                method: 'POST',
                url: this.apiUrl('edge/v1/cert'),
                body: { edgeId: identity.nEdgeid, nonce, csr: csr.pem, sig: deviceKey.sign(certRequestPayload(nonce, identity.nEdgeid, csr.der)) },
                timeoutMs: 15_000,
            });
        } catch (err) {
            if (err instanceof CloudNetworkError) throw offline(`the cloud could not be reached: ${errText(err)}`);
            throw new EdgePortError('cloud_refused', errText(err));
        }
        const body = (res.json ?? {}) as Record<string, unknown>;
        if (res.status === 202 || body.pending === true) {
            this.logger.log('the cloud is still issuing the certificate; retried at the next trigger');
            return this.certificate();
        }
        if (res.status === 501 || String(body.cCode ?? body.code ?? body.error ?? '').toUpperCase() === 'NOT_IMPLEMENTED') {
            // v1: the cloud has no certificate issuer yet (the ACME DNS-01 issuer is Phase 3).
            throw new EdgePortError(
                'cloud_refused',
                `the cloud does not issue LAN certificates yet (${res.status} NOT_IMPLEMENTED): install one on the box with "rt-edge cert install --key <file> --chain <file>" (docs/rt-edge/install.md step 11)`,
            );
        }
        const chain = typeof body.chain === 'string' ? body.chain : null;
        if (res.status < 200 || res.status >= 300 || Number(body.msg ?? 1) !== 1 || !chain) throw new EdgePortError('cloud_refused', `the cloud refused the certificate request (${res.status})`);
        // 4. Verify before installing: the chain names the box host, matches the new key and is valid now.
        const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
        let info;
        try {
            info = checkCertificatePair({ keyPem, chainPem: chain, host, nowMs: this.clock() }).info;
        } catch (err) {
            throw new EdgePortError('cloud_refused', `unusable certificate: ${errText(err)}`);
        }
        // 5. Install atomically (cert-install.ts): both files staged and checked, then key and chain renamed in; a
        // crash between the two renames is finished at the next start instead of leaving a mismatched pair.
        // The console's `rt-edge cert install` shares the install lock: one install at a time, never interleaved.
        try {
            installCertificatePair(tls, { keyPem, chainPem: chain });
        } catch (err) {
            if (err instanceof EdgeTlsError || err instanceof CertificateRefusedError) throw new EdgePortError('cloud_refused', `the certificate/key pair does not load: ${errText(err)}`);
            if (err instanceof CertificateInstallBusyError) throw new EdgePortError('rate_limited', `${errText(err)}; nothing was written`, { retryAfterSec: Math.ceil(CERT_INSTALL_LOCK_STALE_MS / 1000) });
            throw err;
        }
        this.safeState(
            () => this.state.audit.append({ atMs: this.clock(), action: 'cert-install', actor: null, outcome: 'ok', nSesid: null, target: host, ip: null, deviceHash: null, data: { via: 'cloud', notAfterMs: info.notAfterMs } }),
            null,
        );
        // 6. Announce.
        this.certCache = null;
        const after = this.certificate();
        this.publish('certificate-installed', { atMs: this.clock(), notAfterMs: info.notAfterMs, fingerprint256: info.fingerprint256, first: previous.state !== 'ok' });
        return after;
    }

    // =============================================================================================================
    // Helpers
    // =============================================================================================================

    private syncOf(nSesid: string, epoch: number, rebaseSeq: number | null): SyncSession {
        let s = this.syncs.get(nSesid);
        if (!s) {
            s = {
                nSesid,
                epoch: epoch || 1,
                rebaseSeq,
                verdict: null,
                helloOk: false,
                uplinkState: 'ok',
                stopped: null,
                cloud: null,
                appliedRev: 0,
                appliedRawSeq: null,
                lineage: { appliedRawSeq: null, appliedRawHash: null },
                rawCursor: 1,
                rawAcked: { seq: 0, hash: '' },
                cloudRoot: null,
                lastRound: null,
                round: null,
                busyUntil: 0,
                rawBusyUntil: 0,
                rawWaitSince: null,
                heldShrinkId: null,
                heldAtMs: null,
                frozenAtMs: null,
                frozenReason: null,
                lastSyncedAtMs: null,
                pendingCuts: [],
                rawSeen: [],
                bytesPerRecord: 128,
                sealState: null,
                sealRetryAt: 0,
                recovering: false,
                catchingUpLogged: false,
                recoverAlert: null,
                recoverRefusals: 0,
                recoverExhausted: null,
            };
            this.syncs.set(nSesid, s);
        }
        return s;
    }

    private async request<T>(event: string, payload: unknown): Promise<T> {
        const socket = this.socket;
        const gen = this.gen;
        if (!socket || !socket.connected) throw new UplinkOfflineError();
        try {
            return (await socket.timeout(this.opts.ackTimeoutMs ?? ACK_TIMEOUT_MS).emitWithAck(event, payload)) as T;
        } catch (err) {
            if (gen === this.gen && this.socket === socket) this.reconnect(`no ack for ${event} (${errText(err)})`);
            throw new UplinkOfflineError(`no ack for ${event}`);
        }
    }

    private statusChanged(nSesid: string, cause: SessionStatusCause): void {
        this.publish('session-status', { nSesid, cause, atMs: this.clock() });
    }

    private publish<K extends EdgeBusEventName>(type: K, payload: EdgeBusEvents[K]): void {
        try {
            this.bus.publish(type, payload);
        } catch (err) {
            this.logger.error(`publishing ${String(type)} failed: ${errText(err)}`);
        }
    }

    private raise(tier: EdgeAlert['tier'], critical: boolean, kind: string, message: string, nSesid: string | null = null): void {
        this.logger.warn(message);
        this.publish('alert', { source: 'uplink', tier, critical, kind, message, atMs: this.clock(), nSesid, data: null });
    }

    private logRow(row: { event: 'connected' | 'disconnected' | 'error' | 'feed' | 'success'; code: 'cloud-connected' | 'cloud-disconnected' | 'cloud-catching-up' | 'cloud-synced' | 'cloud-refused'; problem: boolean; nSesid?: string | null; data?: Record<string, unknown> }): void {
        const nSesid = row.nSesid ?? null;
        const sessionName = nSesid ? this.safeState(() => this.state.sessions.get(nSesid)?.cName ?? null, null) : null;
        this.safeState(() => this.state.connectivityLog.append({ atMs: this.clock(), event: row.event, source: 'cloud', code: row.code, problem: row.problem, nSesid, sessionName, peer: null, actor: null, data: (row.data ?? {}) as never }), null);
    }

    private safeState<T>(fn: () => T, fallback: T): T {
        try {
            return fn();
        } catch (err) {
            // After close (the lifecycle closes the state database next) a late callback is not an error.
            if (!this.closed) this.logger.error(`state access failed: ${errText(err)}`);
            return fallback;
        }
    }
}

/** Pending cuts (and raw heads, `RawSeen`) kept per session for lagSec before they are thinned. */
export const PENDING_CUTS_MAX = 512;

/**
 * Merge neighbours: the later position (`rev` of a cut, `seq` of a raw head) with the EARLIER time, so an ack of the
 * later position never hides an older unacked change.
 */
export function thinPendingCuts<T extends { readonly atMs: number }>(cuts: readonly T[]): T[] {
    const out: T[] = [];
    for (let i = 0; i < cuts.length; i += 2) {
        const a = cuts[i];
        const b = cuts[i + 1];
        out.push(b ? { ...b, atMs: a.atMs } : { ...a });
    }
    return out;
}

/**
 * Lines the cloud does not hold yet (`lagLines`, critic item 6, user decision 2026-10-04): per dirty page, its lines
 * past the cloud's confirmed total, or one when it has none (lines the cloud holds that changed, or a page a shrink
 * removed). It used to add up every line of every dirty page, so one keystroke on the open page read "Waiting 19
 * lines". Unknown cloud total (after a ROOT reply or a `c.need`): every line of every dirty page; no cloud view yet:
 * every line.
 */
export function linesCloudLacks(view: Pick<CutterView, 'totalLines' | 'nLines' | 'pages'>, cloud: CloudView | null, dirty: readonly number[]): number {
    if (!cloud) return view.totalLines;
    const held = cloud.totalLines;
    if (held === null) return dirty.reduce((n, p) => n + (view.pages[p - 1]?.length ?? 0), 0);
    const nLines = view.nLines > 0 ? view.nLines : 25;
    let lines = 0;
    for (const p of dirty) {
        const added = Math.min(p * nLines, view.totalLines) - Math.max((p - 1) * nLines, held);
        lines += added > 0 ? added : 1;
    }
    return lines;
}

/** Something of the session waits to be sent: a dirty page or raw records not acked (nothing once it is sealed). */
function waitsToSend(s: UplinkSessionSync): boolean {
    return s.sealState === null && (s.dirtyPages > 0 || s.lagBytes > 0);
}

/**
 * A raw head as the uplink first saw it (critic item 22): records through `seq` were journaled by `atMs`. Kept per
 * session, oldest first, for the raw lane's lag; entries the cloud acked are dropped.
 */
export interface RawSeen {
    readonly seq: number;
    readonly atMs: number;
}

/** Note the journal head when it moved past both the last noted head and the cloud's ack (thinned past PENDING_CUTS_MAX). */
export function noteRawHead(seen: readonly RawSeen[], headSeq: number, ackedSeq: number, atMs: number): RawSeen[] {
    const last = seen.length ? seen[seen.length - 1].seq : ackedSeq;
    if (headSeq <= last || headSeq <= ackedSeq) return seen as RawSeen[];
    const next = [...seen, { seq: headSeq, atMs }];
    return next.length > PENDING_CUTS_MAX ? thinPendingCuts(next) : next;
}

/**
 * The raw lane's lag seed at a resume (critic item 21, review 2026-10-04): every record from `ackedSeq + 1` through
 * `headSeq`, the journal head at the hello, is taken to be as old as the first of them (`atMs`, its receive time) —
 * `thinPendingCuts`' convention, the later position with the earlier time. A partial ack then never hides the backlog
 * journaled before the hello (it over-reports rather than under-reports). Heads it covers merge into it (the earlier
 * time kept); later ones stay after it.
 */
export function seedRawSeen(seen: readonly RawSeen[], ackedSeq: number, headSeq: number, atMs: number): RawSeen[] {
    const open = dropAckedRaw(seen, ackedSeq);
    if (headSeq <= ackedSeq) return open;
    const earliest = open.filter(e => e.seq <= headSeq).reduce((t, e) => Math.min(t, e.atMs), atMs);
    return [{ seq: headSeq, atMs: earliest }, ...open.filter(e => e.seq > headSeq)];
}

/** Drop what the cloud acked: entries at or below `ackedSeq`. */
export function dropAckedRaw(seen: readonly RawSeen[], ackedSeq: number): RawSeen[] {
    const i = seen.findIndex(e => e.seq > ackedSeq);
    return i < 0 ? [] : i === 0 ? (seen as RawSeen[]) : seen.slice(i);
}

/**
 * When the oldest raw record the cloud has not acked (`ackedSeq + 1`) was journaled, at the latest: the first noted
 * head past the ack; `nowMs` for records not noted yet (they are new); null when nothing waits.
 */
export function oldestUnackedRawAt(seen: readonly RawSeen[], ackedSeq: number, headSeq: number, nowMs: number): number | null {
    if (headSeq <= ackedSeq) return null;
    return seen.find(e => e.seq > ackedSeq)?.atMs ?? nowMs;
}

/** The box action for a round reply; anything the protocol does not know (a cloud error reply) is retried later. */
function classifyReply(reply: unknown): BoxRoundAction {
    if (!reply || typeof reply !== 'object') return { kind: 'retry', retryMs: 2_000 };
    try {
        const action = classifyRoundReply(reply as RoundReply);
        if (action && typeof action === 'object' && typeof action.kind === 'string') return action;
    } catch {
        /* fall through */
    }
    return { kind: 'retry', retryMs: 2_000 };
}

/** A refusal code from a free-form cloud message (connect_error message + data, `c.refused`, hello `{ok:false}`). */
export function normalizeRefusal(text: string): string {
    const upper = String(text ?? '').toUpperCase();
    for (const code of ['DUP_IDENTITY', 'QUARANTINED', 'REVOKED', 'UPGRADE', 'PROTO_UNSUPPORTED']) if (upper.includes(code)) return code;
    if (KEY_REFUSAL_RE.test(upper)) return 'KEY_REFUSED';
    if (/NO_INTERNET/.test(upper)) return 'NO_INTERNET';
    return 'UNREACHABLE';
}

function stripIncident(i: EdgeIncident & { seq?: unknown; nSesid?: unknown; atMs?: unknown }): EdgeIncident {
    const out: EdgeIncident = { kind: i.kind, level: i.level };
    if (i.fromSeq !== undefined && i.fromSeq !== null) out.fromSeq = i.fromSeq;
    if (i.toSeq !== undefined && i.toSeq !== null) out.toSeq = i.toSeq;
    if (i.lines !== undefined && i.lines !== null) out.lines = i.lines;
    if (i.note !== undefined && i.note !== null) out.note = i.note;
    return out;
}

function emptyDiff(atMs: number, extra: Partial<AssignmentsDiff>): AssignmentsDiff {
    return {
        atMs,
        full: false,
        sessionsAdded: [],
        sessionsUpdated: [],
        sessionsEndRequested: [],
        sessionsUnlisted: [],
        sessionsPurged: [],
        casesAdded: [],
        casesRemoved: [],
        rosterChanged: false,
        operatorCodeChanged: false,
        ...extra,
    };
}

/** 23:59:59.999 of the box-local day containing `nowMs`. */
export function endOfBoxDay(nowMs: number, timeZone: string): number {
    const day = boxDay(nowMs, timeZone);
    let lo = nowMs;
    let hi = nowMs + 26 * 3_600_000;
    while (hi - lo > 1) {
        const mid = Math.floor((lo + hi) / 2);
        if (boxDay(mid, timeZone) === day) lo = mid;
        else hi = mid;
    }
    return lo;
}
