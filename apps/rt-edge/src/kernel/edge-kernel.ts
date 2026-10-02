/**
 * KernelPort (ports/kernel.port.ts): the box's ingest kernel. CAT → write-ahead journal → parser → in-lane cut →
 * LAN / uplink, never depending on the uplink, the internet or `StatePort` writes (spec §2.1, §10 #1, MR-5).
 *
 * Wiring (libs/rt-ingest + libs/edge-sync):
 * - one `KernelArbiter` (FeedArbiter + hooks): one active connection per session, held second peers captured to
 *   `captureDir` (orphan 'C', mirrored into StatePort.heldCaptures), the end drain;
 * - per session a `SessionWorker` (journal under `paths.journalDir`, checkpoints in `StatePort.checkpoints`) and a
 *   `PageCutter` whose `boundary` runs INSIDE the parser lane (onBoundary); every committed cut goes to `onCut`
 *   listeners (the LAN gateway plans the broadcast with edge-sync `planBroadcast`; the uplink builds rounds from
 *   `view()`). The recovery boundary after a restart is NOT emitted (port rule); the cut rev keeps growing across a
 *   restart through a persisted floor (rev-floor.ts);
 * - listen mode: one `CatListener` on `transmitter.bindAddress:listenPort` routing by the armed sessions' Eclipse
 *   credentials (an in-memory RouteCache loaded from StatePort, never a file); dial mode: one `CatDialer`
 *   (hosts outside `transmitter.networkCidr` refused, S-D14) feeding the receiving session.
 * - the transmitter state version (StatePort.transmitter) moves on every applied-settings change and every link
 *   connection change; the Connectivity Log gets the `tx-*` and `disk-write-*` rows (retries collapsed).
 * - cloud reporter settings: a session that carries the reporter machine's address (typed on etabella.net) makes the
 *   kernel switch to dial mode for it by itself (`followCloudReporter`; the rules are in ports/kernel.port.ts).
 */
import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

import { BoxJournalView, CanonicalPage, Cut, CutterView, EdgeRawPullReply, isWarningIncident, PageCutter, Sha256Hex } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import {
    AttachResult,
    BoundaryInfo,
    CatConnection,
    CatDialer,
    CatListener,
    CatProtocol,
    chainNext,
    chainSeed,
    ConnectivityLogEntry,
    DialerSettings,
    EndResult,
    IngestAlert,
    journalDir as journalDirOf,
    JournalCorruptError,
    journalHashAt,
    ParserVersionMismatchError,
    readRawRange,
    RouteCache,
    SessionWorker,
} from '@app/rt-ingest';

import {
    EDGE_DISK_ARM_MIN_MB,
    EDGE_TIMING,
    EdgeActor,
    EdgeFeedState,
    EdgeLinePosition,
    TRANSMITTER_LISTEN_PORT,
    TransmitterApplyRequest,
    TransmitterFieldErrors,
    TransmitterGuard,
    transmitterInterruptingChanges,
    TransmitterLinkState,
    TransmitterLinkStatus,
    TransmitterMode,
    TransmitterProtocol,
    TransmitterSessionOption,
    TransmitterSettings,
    TransmitterTestRequest,
    validateTransmitterSettings,
} from '../contracts';
import {
    AssignmentsDiff,
    BOX_CONFIG,
    BoxConfig,
    BoxIncidentRecord,
    BoxSessionLocalPatch,
    BoxSessionRecord,
    boxDay,
    CloudReporterReason,
    CloudReporterStatus,
    ConnectivityLogInsert,
    CutListener,
    deriveFeedState,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EdgeAlert,
    EdgeBusEventName,
    EdgeBusEvents,
    EdgeClock,
    EdgeEventBus,
    EdgePortError,
    HeldCaptureRecord,
    ipv4InCidr,
    isTimeZone,
    KernelArmRefusal,
    KernelArmResult,
    KernelEndResult,
    KernelPort,
    KernelRawRange,
    KernelRecoverResult,
    KernelSessionView,
    KernelTransmitterState,
    KernelTransmitterTest,
    phaseOfFeed,
    SessionStatusCause,
    sessionArmable,
    sessionEndPending,
    sessionStaysOpen,
    STATE_PORT,
    StatePort,
    Unsubscribe,
} from '../ports';
import { wallClockToEpochMs } from '../state/wall-clock';
import { MirroredCaptureStore } from './held-captures';
import { ArbiterHooks, KernelArbiter } from './kernel-arbiter';
import { KERNEL_BUILD_FLOOR_MS, KERNEL_DEFAULTS, KERNEL_OPTIONS, KernelOptions } from './kernel-options';
import { JournalRewriteError, planJournalRewrite, RecoverRefusedError, rewriteJournalFrom, scanJournal } from './journal-rewrite';
import { pullCloudRange } from './raw-pull';
import { nextRevFloor, readRevFloor, writeRevFloor } from './rev-floor';
import { probeTransmitter, socketErrorClass } from './transmitter-probe';

const hex = (b: Buffer | null | undefined): string => (b ? b.toString('hex') : '');
/**
 * RECOVER plans against the journal of a LIVE writer before it touches the session: a group the writer is appending
 * at that moment ends the last segment like a torn tail, never like corruption (the plan is made again on the closed
 * journal before anything is rewritten).
 */
const LIVE_PLAN_TORN_TAIL_MAX_BYTES = 16 * 1024 * 1024;
const DEFAULT_SETTINGS: TransmitterSettings = Object.freeze({ mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null });
/** Who "applied" the settings the kernel took from a session's cloud reporter address (audit, "Applied 09:12 by …"). */
const CLOUD_REPORTER_ACTOR: EdgeActor = Object.freeze({ nUserid: null, name: 'etabella.net (session settings)', via: 'online', operatorName: null });

const transmitterProtocolOf = (p: CatProtocol | null | undefined): TransmitterProtocol | null => (p === 'C' ? 'caseview' : p === 'B' ? 'bridge' : null);

/** The dial settings a session's reporter address asks for. */
function cloudReporterSettings(nSesid: string, host: string, port: number, protocol: TransmitterProtocol): TransmitterSettings {
    return { mode: 'dial', protocol, host, port, autoReconnect: true, receivingSesid: nSesid };
}

/** "nSesid|host|port|protocol": one value of the cloud reporter settings (StatePort.transmitter.cloudReporter). */
function cloudReporterFingerprint(s: TransmitterSettings): string {
    return `${s.receivingSesid}|${s.host}|${s.port}|${s.protocol}`;
}

/** The settings a stored fingerprint stands for; null when it is not one this build wrote. */
function settingsOfFingerprint(fingerprint: string): TransmitterSettings | null {
    const [nSesid, host, port, protocol, ...rest] = fingerprint.split('|');
    if (rest.length || !nSesid || !host || !/^\d{1,5}$/.test(port ?? '') || (protocol !== 'bridge' && protocol !== 'caseview')) return null;
    return cloudReporterSettings(nSesid, host, Number(port), protocol);
}

function sameSettings(a: TransmitterSettings, b: TransmitterSettings): boolean {
    return a.mode === b.mode && a.protocol === b.protocol && a.host === b.host && a.port === b.port && a.autoReconnect === b.autoReconnect && a.receivingSesid === b.receivingSesid;
}

/**
 * A started session keeps the transmitter this long after its last byte or line, link up or not: a link that drops
 * mid-hearing (or a lunch break) never hands the box to another session. After it, a session nobody ended no
 * longer blocks the next one.
 */
export const CLOUD_REPORTER_HOLD_MS = 6 * 3600 * 1000;
/** The tick re-reads the owner this often (a session becomes due, a started one goes stale) with no other event. */
export const CLOUD_REPORTER_RECHECK_MS = 15_000;

/** A stored session that may own the transmitter: listed, not deleted, not ended or ending. */
function staysOpen(r: BoxSessionRecord): boolean {
    return r.listed && !r.deleted && sessionArmable(r);
}

/** The cloud value a stored session carries, as a fingerprint; null without a reporter address or a pinned protocol. */
function reporterFingerprintOf(r: BoxSessionRecord): string | null {
    const protocol = transmitterProtocolOf(r.protocol);
    return r.reporter && protocol ? cloudReporterFingerprint(cloudReporterSettings(r.nSesid, r.reporter.host, r.reporter.port, protocol)) : null;
}

/** A session that may own the transmitter, as the owner rule sees it (`openSessions`). */
interface OpenSession {
    readonly record: BoxSessionRecord;
    readonly armed: boolean;
    /** Its transmitter connection is up now (logged in or dialed), even before its first line. */
    readonly up: boolean;
    /**
     * Closing its connection would cost something: a reporter's Eclipse is logged in (even before its first line), or
     * lines have arrived over the connection the box dialed. A dialed connection that never carried a line is not.
     */
    readonly busy: boolean;
    readonly started: boolean;
    /** Last byte or line, else the first line; null while unknown (not started, or its journal is still being read). */
    readonly activeAtMs: number | null;
    readonly startAtMs: number | null;
}

const byId = (a: OpenSession, b: OpenSession): number => (a.record.nSesid < b.record.nSesid ? -1 : a.record.nSesid > b.record.nSesid ? 1 : 0);
/** Earliest start first (no start last), then nSesid. */
function byStart(a: OpenSession, b: OpenSession): number {
    if (a.startAtMs !== b.startAtMs) return a.startAtMs === null ? 1 : b.startAtMs === null ? -1 : a.startAtMs - b.startAtMs;
    return byId(a, b);
}
/** Most recently active first (unknown counts as now), then earliest start. */
function byActivity(a: OpenSession, b: OpenSession): number {
    const ta = a.activeAtMs ?? Number.MAX_SAFE_INTEGER;
    const tb = b.activeAtMs ?? Number.MAX_SAFE_INTEGER;
    return ta !== tb ? tb - ta : byStart(a, b);
}

/** One reading of the cloud reporter settings against the box's state (`cloudReporterPlan`). */
interface CloudReporterPlan {
    /**
     * `apply`: switch to `wanted` (the owner's reporter address); `adopt`: the settings already are `wanted`, only
     * remember the value; `restore`: the cloud's settings are over, `wanted` (the settings in force before them)
     * returns; `none`: leave everything as it is.
     */
    readonly action: 'none' | 'apply' | 'adopt' | 'restore';
    /** The owner when it carries a reporter address, else the next session that does; null when none does. */
    readonly status: CloudReporterStatus | null;
    readonly sessionName: string | null;
    readonly wanted: TransmitterSettings | null;
    /** The owner's cloud value (also while it waits or is refused): a person's Apply marks it as dealt with. */
    readonly fingerprint: string | null;
    /** `apply` over settings that are not the cloud's: what to bring back later. Undefined: keep what is remembered. */
    readonly previous?: TransmitterSettings | null;
}

/** Close reasons that are not a feed drop (no feed-stopped, no CAT_DISCONNECT). Mirrors rt-ingest's EXPECTED_CLOSE. */
const EXPECTED_CLOSE = new Set([
    'superseded',
    'idle-takeover',
    'repinned',
    'session-end',
    'settings-changed',
    'session-changed',
    'manual-reconnect',
    'disconnect',
    'shutdown',
    'route-removed',
    'recover',
]);

interface Held {
    readonly nSesid: string;
    record: BoxSessionRecord;
    cutter: PageCutter | null;
    cut: Cut | null;
    worker: SessionWorker | null;
    /** The boot recovery boundary is computed but not emitted (port: no synthetic cut). */
    suppressCut: boolean;
    openError: { reason: KernelArmRefusal; message: string } | null;
    armed: boolean;
    /** The arm checks passed and the worker is opening (replay): the route is already registered. */
    routeEarly: boolean;
    arming: Promise<KernelArmResult> | null;
    recovering: { startedAtMs: number; progressPct: number | null } | null;
    corrupt: JournalCorruptError | null;
    corruptWaiters: Array<() => void>;
    recoverPromise: Promise<KernelRecoverResult> | null;
    endPromise: Promise<KernelEndResult> | null;
    endResult: KernelEndResult | null;
    firstLineAtMs: number | null;
    lastLineAtMs: number | null;
    feedStoppedAtMs: number | null;
    lastMode: TransmitterMode | null;
    lastAudit: { atMs: number; ok: boolean } | null;
    lastAuditRunAt: number;
    auditing: boolean;
    parseErrors: number;
    degradedSinceMs: number | null;
    mirroredIncidents: number;
    extraIncidents: BoxIncidentRecord[];
    revFloor: number;
    revFloorWrite: Promise<void> | null;
    lastPublishedLineAt: number | null;
    lastFeed: EdgeFeedState | null;
    quietLogged: boolean;
    dropped: boolean;
    /** End of a never-armed session pinned to another parser: open it unpinned (no data was ever accepted). */
    openUnpinned: boolean;
    /** RECOVER is rewriting the journal: no worker may open meanwhile. */
    rewriting: boolean;
}

@Injectable()
export class EdgeKernel implements KernelPort {
    private readonly logger = new Logger('EdgeKernel');
    private readonly opts: KernelOptions;
    private readonly parserVer: string;
    private readonly held = new Map<string, Held>();
    private readonly cutListeners = new Set<CutListener>();
    private readonly unsubscribes: Unsubscribe[] = [];

    private started = false;
    private closing: Promise<void> | null = null;
    private arbiter: KernelArbiter | null = null;
    private captures: MirroredCaptureStore | null = null;
    private routes: RouteCache | null = null;
    private listener: CatListener | null = null;
    private listenerPort: number | null = null;
    private listenerError: string | null = null;
    private listenRetry: NodeJS.Timeout | null = null;
    private listenStarting: Promise<void> | null = null;
    private dialer: CatDialer | null = null;
    private dialWant = false;
    private dialEverConnected = false;
    private dialConnectedAt: number | null = null;
    private tick: NodeJS.Timeout | null = null;
    private link: { state: TransmitterLinkState; sinceMs: number } | null = null;
    private linkOp: Promise<void> = Promise.resolve();
    /** Refused cloud reporter values already alerted (one alert per value, not one per assignment pull). */
    private readonly cloudReporterAlerted = new Set<string>();
    /** When the owner rule last ran (`onTick` runs it again after CLOUD_REPORTER_RECHECK_MS). */
    private cloudReporterCheckedAt = 0;

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Optional() @Inject(KERNEL_OPTIONS) opts?: KernelOptions,
    ) {
        this.opts = opts ?? {};
        this.parserVer = this.opts.parserVer ?? FEED_PARSE_VERSION;
    }

    // =============================================================================================================
    // Lifecycle
    // =============================================================================================================

    async start(): Promise<void> {
        if (this.started) return;
        this.started = true;
        const journalRoot = this.config.paths.journalDir;
        await fs.promises.mkdir(journalRoot, { recursive: true }).catch(err => this.alert('P1', true, 'JOURNAL_DIR', `journal directory ${journalRoot} cannot be created: ${errText(err)}`));

        this.captures = new MirroredCaptureStore(
            { root: this.config.paths.captureDir, limits: 'box', clock: this.clock, onAlert: a => this.onIngestAlert(a) },
            record => this.mirrorCapture(record),
        );
        void this.captures
            .init()
            .then(() => this.captures?.mirrorExisting())
            .catch(err => this.alert('P2', false, 'CAPTURE_ERROR', `held captures could not be initialised: ${errText(err)}`));

        this.routes = new RouteCache({ source: { read: async () => this.routeEntries(), describe: () => 'armed sessions (edge.sqlite)' }, pollMs: 0, clock: this.clock, onAlert: a => this.onIngestAlert(a) });
        await this.routes.start();

        const hooks: ArbiterHooks = {
            onAttached: (nSesid, conn, res) => this.onAttached(nSesid, conn, res),
            onDetached: (nSesid, conn, reason, role) => this.onDetached(nSesid, conn, reason, role),
        };
        this.arbiter = new KernelArbiter(
            {
                openWorker: nSesid => this.openWorker(nSesid),
                captures: this.captures,
                onAlert: a => this.onIngestAlert(a),
                clock: this.clock,
                drain: {
                    idleMs: this.opts.drain?.idleMs ?? KERNEL_DEFAULTS.drainIdleMs,
                    boundMs: this.opts.drain?.boundMs ?? KERNEL_DEFAULTS.drainBoundMs,
                    pollMs: this.opts.drain?.pollMs ?? KERNEL_DEFAULTS.drainPollMs,
                },
            },
            hooks,
        );

        this.unsubscribes.push(this.bus.subscribe('assignments-changed', diff => this.onAssignmentsChanged(diff)));
        this.unsubscribes.push(
            this.bus.subscribe('session-status', e => {
                if (e.cause === 'uplink') this.recheck(e.nSesid);
            }),
        );

        for (const record of this.safeState(() => this.state.sessions.list(), [] as readonly BoxSessionRecord[])) this.consider(record);

        const settings = this.settings();
        if (settings.mode === 'dial' && settings.autoReconnect) this.dialWant = true;
        // Binding a local socket is prompt; a failure is link state + retries, never a rejection.
        await this.runLink(() => this.applyLink());
        this.followCloudReporter();

        this.tick = setInterval(() => this.onTick(), this.opts.tickMs ?? KERNEL_DEFAULTS.tickMs);
        this.tick.unref?.();
    }

    close(): Promise<void> {
        if (!this.started) return Promise.resolve();
        if (!this.closing) this.closing = this.shutdown();
        return this.closing;
    }

    private async shutdown(): Promise<void> {
        if (this.tick) clearInterval(this.tick);
        this.tick = null;
        if (this.listenRetry) clearTimeout(this.listenRetry);
        this.listenRetry = null;
        for (const off of this.unsubscribes.splice(0)) off();
        await this.linkOp.catch(() => undefined);
        await this.listener?.stop().catch(() => undefined);
        this.listener = null;
        await this.dialer?.close().catch(() => undefined);
        this.dialer = null;
        this.routes?.stop();
        // Final checkpoint per session before the workers close (no SESSION_END: a restart resumes).
        for (const h of this.held.values()) {
            const w = h.worker;
            if (!w || w.ended) {
                // An ended (read-only) session writes no checkpoint, but a rev-floor write may still be in flight.
                if (h.revFloorWrite) await h.revFloorWrite.catch(() => undefined);
                continue;
            }
            await w.settled().catch(() => undefined);
            await w.checkpointNow().catch(() => undefined);
            await this.persistRevFloor(h, true).catch(() => undefined);
        }
        await this.arbiter?.close().catch(() => undefined);
        for (const h of this.held.values()) await h.worker?.close().catch(() => undefined);
    }

    // =============================================================================================================
    // Sessions
    // =============================================================================================================

    sessions(): readonly KernelSessionView[] {
        return [...this.held.values()]
            .filter(h => !h.dropped)
            .sort((a, b) => (a.nSesid < b.nSesid ? -1 : a.nSesid > b.nSesid ? 1 : 0))
            .map(h => this.viewOf(h));
    }

    session(nSesid: string): KernelSessionView | null {
        const h = this.held.get(nSesid);
        return h && !h.dropped ? this.viewOf(h) : null;
    }

    async arm(nSesid: string): Promise<KernelArmResult> {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record || !sessionStaysOpen(record)) return refuse('unknown-session', `session ${nSesid} is not open on this box`);
        if (!sessionArmable(record)) return refuse('ended', `session ${nSesid} has ended or is ending`);
        if (!this.started) return refuse('worker-error', 'the kernel is not running');
        const h = this.hold(record);
        if (h.armed && h.worker && !h.worker.ended) return { ok: true, view: this.viewOf(h), already: true };
        if (h.arming) return h.arming;
        h.arming = this.doArm(h).finally(() => {
            h.arming = null;
        });
        return h.arming;
    }

    private async doArm(h: Held): Promise<KernelArmResult> {
        const record = h.record;
        const fresh = !(await this.journalExists(h.nSesid));
        const tzOk = !record.tz || isTimeZone(record.tz);
        if (fresh) {
            const freeMb = await this.diskFreeMb();
            if (freeMb !== null && freeMb < EDGE_DISK_ARM_MIN_MB) return this.refuseArm(h, 'disk-low', `${freeMb} MiB free, below ${EDGE_DISK_ARM_MIN_MB} MiB`);
            if (record.protocol === 'C' && this.clock() < (this.opts.buildDateMs ?? KERNEL_BUILD_FLOOR_MS)) {
                return this.refuseArm(h, 'clock-before-build', 'the box clock is earlier than this build; a CaseView session needs a sane clock');
            }
            if (record.parserVer && record.parserVer !== this.parserVer) return this.refuseArm(h, 'parser-mismatch', `pinned to ${record.parserVer}, this build runs ${this.parserVer}`);
            if (!tzOk) return this.refuseArm(h, 'worker-error', `time zone ${record.tz} is unknown to this box (DET-2)`);
        }
        // The login is known while the journal replays: an Eclipse that reconnects during a long recovery is not
        // refused as an unknown login (D3 alert); the listener holds its bytes until the worker is open, then feeds them.
        h.routeEarly = true;
        this.reloadRoutes();
        try {
            await this.arbiter!.ensureWorker(h.nSesid);
        } catch (err) {
            h.routeEarly = false;
            this.reloadRoutes();
            const refusal = h.openError ?? { reason: 'worker-error' as const, message: errText(err) };
            return { ok: false, reason: refusal.reason, message: refusal.message };
        }
        h.routeEarly = false;
        const now = this.refresh(h);
        if (!now || !sessionArmable(now) || h.worker?.ended) {
            this.reloadRoutes();
            return refuse('ended', `session ${h.nSesid} ended while arming`);
        }
        h.armed = true;
        h.openError = null;
        this.reloadRoutes();
        this.rebindDial();
        this.followCloudReporter();
        if (now.localState === 'assigned' || now.localState === 'recovering') this.setLocal(h, { localState: h.firstLineAtMs ? 'live' : 'armed' });
        const atMs = this.clock();
        this.publish('session-armed', { nSesid: h.nSesid, atMs });
        this.statusChanged(h, 'phase');
        return { ok: true, view: this.viewOf(h), already: false };
    }

    private refuseArm(h: Held, reason: KernelArmRefusal, message: string): KernelArmResult {
        h.openError = { reason, message };
        this.alert('P2', false, 'ARM_REFUSED', `session ${h.nSesid} not armed (${reason}): ${message}`, h.nSesid, { reason });
        return { ok: false, reason, message };
    }

    requestEnd(nSesid: string, endedBy: string): Promise<KernelEndResult> {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record || !sessionStaysOpen(record)) return Promise.reject(new EdgePortError('session_not_found', `session ${nSesid} is not open on this box`));
        const existing = this.held.get(nSesid);
        if (existing && !existing.dropped) {
            if (existing.endPromise) return existing.endPromise;
            if (existing.endResult) return Promise.resolve(existing.endResult);
        }
        if (!this.started) return Promise.reject(new Error('rt-edge kernel: not running'));
        const h = this.hold(record);
        if (h.endResult) return Promise.resolve(h.endResult);
        h.endPromise = this.runEnd(h, endedBy).catch(err => {
            h.endPromise = null;
            throw err;
        });
        return h.endPromise;
    }

    endResult(nSesid: string): KernelEndResult | null {
        const h = this.held.get(nSesid);
        return h && !h.dropped ? h.endResult : null;
    }

    private async runEnd(h: Held, endedBy: string): Promise<KernelEndResult> {
        await this.openForEnd(h);
        const worker = h.worker!;
        if (worker.ended) {
            if (!h.endResult) h.endResult = await this.endResultFrom(h, await worker.end({ endedBy }));
            return h.endResult;
        }
        const record = this.refresh(h) ?? h.record;
        const now = this.clock();
        const endRequestedAtMs = record.endRequestedAtMs ?? now;
        const patch: BoxSessionLocalPatch = record.endRequestedAtMs == null ? { endRequestedAtMs } : {};
        this.setLocal(h, record.localState === 'frozen' ? patch : { ...patch, localState: 'ending' });
        this.statusChanged(h, 'phase');
        const boundMs = Math.max(0, (this.opts.drain?.boundMs ?? KERNEL_DEFAULTS.drainBoundMs) - Math.max(0, now - endRequestedAtMs));
        const res = await this.arbiter!.requestEnd(h.nSesid, {
            endedBy,
            idleMs: this.opts.drain?.idleMs ?? KERNEL_DEFAULTS.drainIdleMs,
            boundMs,
            pollMs: this.opts.drain?.pollMs ?? KERNEL_DEFAULTS.drainPollMs,
        });
        const result = await this.endResultFrom(h, res);
        h.endResult = result;
        h.armed = false;
        this.setLocal(h, { endedAtMs: res.endedAtEdgeMs });
        // Room codes are switched off in v1 ("email sign-in only"): the kernel touches their repository only when on.
        if (this.config.features.roomCodes) this.safeState(() => this.state.roomCodes.expireSession(h.nSesid, this.clock()), 0);
        this.mirrorIncidents(h);
        this.reloadRoutes();
        this.rebindDial();
        this.followCloudReporter();
        await this.persistRevFloor(h, true).catch(() => undefined);
        this.publish('session-event', { type: 'ended', nSesid: h.nSesid, endedAtMs: res.endedAtEdgeMs });
        this.statusChanged(h, 'phase');
        return result;
    }

    private async endResultFrom(h: Held, res: EndResult): Promise<KernelEndResult> {
        const view = h.cutter!.view();
        return Object.freeze({ ...res, incidents: [...res.incidents], finalRev: view.rev, totalLines: view.totalLines, root: view.root });
    }

    /** Open the worker for an end; a corrupt journal waits for RECOVER; a fresh session pinned to another parser ends unpinned (no data was ever accepted). */
    private async openForEnd(h: Held): Promise<void> {
        for (;;) {
            if (h.worker) return;
            try {
                await this.arbiter!.ensureWorker(h.nSesid);
                return;
            } catch (err) {
                if (h.corrupt) {
                    // MR-4: resolves after RECOVER repaired the journal; frozen for a split it stays pending.
                    await new Promise<void>(resolve => h.corruptWaiters.push(resolve));
                    continue;
                }
                if (err instanceof ParserVersionMismatchError && !h.openUnpinned && !(await this.journalExists(h.nSesid))) {
                    h.openUnpinned = true;
                    continue;
                }
                throw err;
            }
        }
    }

    // =============================================================================================================
    // Cuts and pages
    // =============================================================================================================

    onCut(listener: CutListener): Unsubscribe {
        if (typeof listener !== 'function') throw new TypeError('rt-edge kernel: cut listener must be a function');
        this.cutListeners.add(listener);
        let active = true;
        return () => {
            if (!active) return;
            active = false;
            this.cutListeners.delete(listener);
        };
    }

    currentCut(nSesid: string): Cut | null {
        const h = this.held.get(nSesid);
        return h && !h.dropped && !h.recovering ? h.cut : null;
    }

    view(nSesid: string): CutterView | null {
        const h = this.held.get(nSesid);
        if (!h || h.dropped || h.recovering || !h.worker || !h.cutter) return null;
        return h.cutter.view();
    }

    pages(nSesid: string): readonly CanonicalPage[] {
        return this.currentCut(nSesid)?.allPages ?? [];
    }

    // =============================================================================================================
    // Raw journal
    // =============================================================================================================

    /**
     * MR-4: a corrupt journal is its VERIFIED PREFIX, whether the corruption was found at boot (no worker) or by a read
     * while the worker records on (raw lane, hello): the head the hello reports, the hashes it checks (D19) and the
     * seq RECOVER repairs from (good head + 1) all stop at the last record that verifies. The live worker keeps
     * recording and serving the room meanwhile; RECOVER puts its later records back after the repair.
     */
    rawHead(nSesid: string): KernelSessionView['raw'] | null {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) return null;
        if (h.corrupt) {
            const g = h.corrupt.goodHead;
            return { headSeq: g.seq, headHash: hex(g.hash), durableSeq: g.seq, durableHash: hex(g.hash) };
        }
        if (h.worker) {
            const head = h.worker.journal.head;
            const durable = h.worker.journal.durableHead;
            return { headSeq: head.seq, headHash: hex(head.hash), durableSeq: durable.seq, durableHash: hex(durable.hash) };
        }
        return null;
    }

    async readRaw(nSesid: string, fromSeq: number, maxBytes: number, opts: { readonly includeUndurable?: boolean } = {}): Promise<KernelRawRange | null> {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) throw new EdgePortError('session_not_found', `session ${nSesid} is not open on this box`);
        if (!Number.isSafeInteger(fromSeq) || fromSeq < 1) throw new EdgePortError('invalid_request', 'fromSeq must be ≥ 1');
        const worker = h.worker;
        if (!worker) return null;
        const journal = worker.journal;
        const durable = journal.durableHead;
        // MR-4: nothing past the verified head of a corrupt journal is served.
        const lastSeq = h.corrupt ? Math.min(durable.seq, h.corrupt.goodHead.seq) : durable.seq;
        const parts: Buffer[] = [];
        let prevHash: Buffer | null = null;
        let toSeq = fromSeq - 1;
        let toHash: Buffer | null = null;
        let bytes = 0;
        const limit = Math.max(1, Math.floor(maxBytes));
        if (fromSeq <= lastSeq) {
            let range;
            try {
                range = await readRawRange({ root: this.config.paths.journalDir, nSesid, fromSeq, toSeq: lastSeq, maxBytes: limit });
            } catch (err) {
                if (err instanceof JournalCorruptError) this.markCorrupt(h, err);
                throw err;
            }
            if (!range) return null;
            parts.push(range.recs);
            prevHash = range.prevHash;
            toSeq = range.toSeq;
            toHash = range.hash;
            bytes = range.recs.length;
        }
        let durableOnly = true;
        if (opts.includeUndurable && !h.corrupt && journal.state === 'failed' && toSeq === Math.max(durable.seq, fromSeq - 1)) {
            for (const rec of journal.undurableRecords()) {
                if (rec.seq <= toSeq) continue;
                if (rec.seq !== toSeq + 1) break;
                if (parts.length && bytes + rec.encoded.length > limit) break;
                if (prevHash === null) prevHash = rec.seq === 1 ? chainSeed(nSesid) : await this.hashAtBuffer(h, rec.seq - 1);
                if (prevHash === null) break;
                parts.push(rec.encoded);
                bytes += rec.encoded.length;
                toSeq = rec.seq;
                toHash = rec.hash;
                durableOnly = false;
            }
        }
        if (!parts.length || prevHash === null || toHash === null) return null;
        const recs = parts.length === 1 ? parts[0] : Buffer.concat(parts);
        return { nSesid, fromSeq, toSeq, prevHash: hex(prevHash), toHash: hex(toHash), recs, durable: durableOnly };
    }

    async rawHashAt(nSesid: string, seq: number): Promise<Sha256Hex | null> {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) return null;
        const b = await this.hashAtBuffer(h, seq);
        return b ? hex(b) : null;
    }

    async journalView(nSesid: string, seqs: readonly number[]): Promise<BoxJournalView> {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) throw new EdgePortError('session_not_found', `session ${nSesid} is not open on this box`);
        const want = [...new Set(seqs.filter(s => Number.isSafeInteger(s) && s >= 0))];
        const hashes = new Map<number, string>();
        let headSeq: number;
        if (h.corrupt) {
            // MR-4, worker live or not: the verified prefix (a scan that finds an earlier corruption lowers it).
            const scan = await scanJournal(this.config.paths.journalDir, nSesid, want);
            if (scan.corrupt) this.markCorrupt(h, scan.corrupt);
            headSeq = Math.min(scan.head.seq, h.corrupt.goodHead.seq);
            for (const [seq, value] of scan.hashes) if (seq <= headSeq) hashes.set(seq, value);
            if (want.includes(0)) hashes.set(0, hex(chainSeed(nSesid)));
        } else if (h.worker) {
            await h.worker.journal.flush().catch(() => undefined);
            headSeq = h.worker.journal.head.seq;
            for (const seq of want) {
                if (seq > headSeq) continue;
                const b = await this.hashAtBuffer(h, seq);
                if (b) hashes.set(seq, hex(b));
            }
            // A read above may have just found corruption: answer with the verified prefix, as the next hello will.
            if (h.corrupt) return this.journalView(nSesid, seqs);
        } else {
            throw new EdgePortError('session_not_found', `session ${nSesid} has no open journal`);
        }
        return { headSeq, hashAt: (seq: number) => hashes.get(seq) };
    }

    private async hashAtBuffer(h: Held, seq: number): Promise<Buffer | null> {
        if (!Number.isSafeInteger(seq) || seq < 0) return null;
        if (seq === 0) return chainSeed(h.nSesid);
        const worker = h.worker;
        if (h.corrupt) {
            // MR-4: the box holds only its verified prefix as journal history.
            const g = h.corrupt.goodHead;
            if (seq > g.seq) return null;
            if (seq === g.seq) return g.hash;
        } else if (worker) {
            const head = worker.journal.head;
            if (seq > head.seq) return null;
            if (seq === head.seq) return head.hash;
            if (worker.journal.state === 'failed') {
                const rec = worker.journal.undurableRecords().find(r => r.seq === seq);
                if (rec) return rec.hash;
            } else if (seq > worker.journal.durableHead.seq) {
                await worker.journal.flush().catch(() => undefined);
            }
        }
        try {
            return await journalHashAt({ root: this.config.paths.journalDir, nSesid: h.nSesid, seq });
        } catch (err) {
            if (err instanceof JournalCorruptError && h.worker) this.markCorrupt(h, err);
            return null;
        }
    }

    async recoverFromCloud(nSesid: string, fromSeq: number, pull: (fromSeq: number, toSeq: number) => Promise<EdgeRawPullReply>): Promise<KernelRecoverResult> {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) throw new EdgePortError('session_not_found', `session ${nSesid} is not open on this box`);
        // An end waiting on a corrupt journal that no worker could open (MR-4, `openForEnd`) is exactly what RECOVER
        // unblocks; any other ending session is refused — an end draining a live worker included, corrupt or not.
        const ending = !!h.endPromise || !!h.worker?.ending;
        const endWaitsForRepair = ending && !!h.corrupt && !h.worker;
        if ((ending && !endWaitsForRepair) || h.endResult || h.worker?.ended) return { ok: false, reason: 'session-ended', message: 'RECOVER is never run for an ending or ended session' };
        if (h.recoverPromise) return h.recoverPromise;
        h.recoverPromise = this.doRecover(h, fromSeq, pull).finally(() => {
            h.recoverPromise = null;
        });
        return h.recoverPromise;
    }

    private async doRecover(h: Held, fromSeq: number, pull: (fromSeq: number, toSeq: number) => Promise<EdgeRawPullReply>): Promise<KernelRecoverResult> {
        const nSesid = h.nSesid;
        if (!Number.isSafeInteger(fromSeq) || fromSeq < 1) return { ok: false, reason: 'io-error', message: `bad fromSeq ${fromSeq}` };
        // The box's own hash at fromSeq-1: the pulled chain must continue it (D19: RECOVER only for a box that still
        // continues the cloud's history).
        let prev: Buffer | null;
        if (h.worker) {
            prev = await this.hashAtBuffer(h, fromSeq - 1).catch(() => null);
        } else {
            const scan = await scanJournal(this.config.paths.journalDir, nSesid, [fromSeq - 1]).catch(() => null);
            const value = fromSeq - 1 === 0 ? hex(chainSeed(nSesid)) : scan?.hashes.get(fromSeq - 1);
            prev = value ? Buffer.from(value, 'hex') : null;
        }
        if (!prev || !prev.length) return { ok: false, reason: 'chain-mismatch', message: `the journal does not hold seq ${fromSeq - 1}` };
        const root = this.config.paths.journalDir;

        // 1. Pull everything the cloud holds from fromSeq on, verifying the chain as it arrives (raw-pull.ts). A failed
        //    pull, or one that brings nothing, changes nothing: the journal is kept, the uplink alerts and retries.
        const pulled = await pullCloudRange(fromSeq, prev, pull);
        if (pulled.ok === false) return { ok: false, reason: pulled.reason, message: pulled.message };
        const range = pulled.range;
        if (!range.records.length) return { ok: false, reason: 'cloud-behind', message: `the cloud holds nothing from seq ${fromSeq}; the journal is kept` };

        // 2. Plan against the journal as it is, before the feed or the room is touched (journal-rewrite.ts): RECOVER
        //    replaces only what the cloud proves different, so a short pull that would drop records the box holds and
        //    the cloud does not is refused here, with the worker still recording. The plan is made again, and binds,
        //    on the closed journal below.
        if (h.worker) {
            await h.worker.journal.flush().catch(() => undefined);
            try {
                const plan = await planJournalRewrite({ root, nSesid, pulled: range, knownHead: h.worker.journal.durableHead, tornTailMaxBytes: LIVE_PLAN_TORN_TAIL_MAX_BYTES });
                if (plan.corrupt) this.markCorrupt(h, plan.corrupt); // found by this read: the repair is recorded as MR-4
            } catch (err) {
                const refused = this.recoverRefusal(h, err);
                if (refused) return refused;
                // The live journal on disk does not reach fromSeq-1 (records not durable yet): retried at the next hello.
                if (err instanceof JournalRewriteError) return { ok: false, reason: 'io-error', message: errText(err) };
                // Anything else (a read that failed) is decided again on the closed journal below.
            }
        }

        // 3. Quiesce: refuse new connections, close the session's sockets (CONN_CLOSE 'recover') and its worker. The LAN
        //    keeps the old view until the replay commits.
        //    An arm still in flight (the boot arm) already shows its worker, but the arbiter is handed that worker only
        //    when the open settles — possibly after `resetWorker` below — and the reopen after the rewrite would then get
        //    the CLOSED old worker back (no view, no recording). Let the arm finish first; nothing awaits between here
        //    and `rewriting`, so no new open can start in between.
        if (h.arming) await h.arming.catch(() => undefined);
        const arbiter = this.arbiter!;
        const wasArmed = h.armed;
        arbiter.block(nSesid);
        h.rewriting = true;
        let rewrite;
        try {
            await arbiter.closeConnections(nSesid, 'recover');
            const closing = h.worker;
            await closing?.close().catch(() => undefined);
            arbiter.resetWorker(nSesid);
            h.worker = null;
            try {
                // The closed writer's last durable record proves what a repair in place must keep (MR-4).
                rewrite = await rewriteJournalFrom({ root, nSesid, pulled: range, knownHead: closing ? closing.journal.durableHead : null, nowMs: this.clock() });
            } catch (err) {
                h.rewriting = false;
                await arbiter.ensureWorker(nSesid).catch(() => undefined);
                return this.recoverRefusal(h, err) ?? { ok: false, reason: err instanceof JournalRewriteError ? 'chain-mismatch' : 'io-error', message: errText(err) };
            }
        } finally {
            h.rewriting = false;
            arbiter.unblock(nSesid);
        }
        const wasCorrupt = h.corrupt;
        h.corrupt = null;
        // 4. Replay: the reopened worker's recovery boundary is diffed against the old cutter and EMITTED (the LAN
        //    view changes only now, when the replay commits).
        h.suppressCut = false;
        try {
            await arbiter.ensureWorker(nSesid);
        } catch (err) {
            return { ok: false, reason: 'io-error', message: `reopen after RECOVER failed: ${errText(err)}` };
        }
        const kept = rewrite.reattached ? `, ${rewrite.reattached} of the box's own after it kept` : '';
        if (wasCorrupt) h.worker?.incident('JOURNAL_CORRUPT', { fromSeq, note: `journal corrupt at ${wasCorrupt.segment}:${wasCorrupt.offset}; repaired by RECOVER from the cloud (${rewrite.movedBytes} B copied aside${kept})` });
        h.worker?.incident('TAIL_TRUNCATED', { fromSeq, toSeq: rewrite.head.seq, note: `RECOVER: ${rewrite.movedRecords} local record(s) moved aside, ${rewrite.appended} pulled from the cloud${kept}` });
        if (wasArmed) {
            h.armed = true;
            this.reloadRoutes();
            this.rebindDial();
            this.followCloudReporter();
        }
        for (const resolve of h.corruptWaiters.splice(0)) resolve();
        this.statusChanged(h, 'uplink');
        return { ok: true, fromSeq, toSeq: rewrite.head.seq, records: rewrite.appended, movedAside: rewrite.movedRecords };
    }

    /**
     * A RECOVER the journal does not justify: `RecoverRefusedError` (the cloud holds less than the box, or nothing that
     * differs) → `cloud-behind`; a corruption found BEFORE fromSeq-1 → recorded (it lowers the verified head the next
     * hello reports) and `io-error`, so RECOVER runs again from the right seq. Null for anything else.
     */
    private recoverRefusal(h: Held, err: unknown): KernelRecoverResult | null {
        if (err instanceof RecoverRefusedError) return { ok: false, reason: 'cloud-behind', message: err.message };
        if (err instanceof JournalCorruptError) {
            this.markCorrupt(h, err);
            return { ok: false, reason: 'io-error', message: `the journal is corrupt at ${err.segment}:${err.offset} (after seq ${err.goodHead.seq}); RECOVER runs again from there at the next hello` };
        }
        return null;
    }

    // =============================================================================================================
    // Transmitter
    // =============================================================================================================

    transmitterState(): KernelTransmitterState {
        const stored = this.safeState(() => this.state.transmitter.get(), { settings: null, applied: null });
        const link = this.transmitterLink();
        const settings = stored.settings;
        const dial = settings?.mode === 'dial';
        const configured = !!(dial && settings.host && settings.port && settings.protocol);
        const up = this.linkUp();
        const dialStatus = this.dialer?.status();
        const retrying = !!dialStatus?.retrying;
        return {
            stateVersion: this.safeState(() => this.state.transmitter.version(), 0),
            settings,
            applied: stored.applied,
            link,
            sessions: this.sessionOptions(),
            listen: { boxTransmitterAddress: this.config.transmitter.bindAddress, port: this.listenerPort ?? this.config.transmitter.listenPort ?? TRANSMITTER_LISTEN_PORT },
            actions: {
                connect: configured && !up && !retrying,
                testOnly: !this.testBusy(),
                reconnect: configured && !up,
            },
        };
    }

    transmitterLink(): TransmitterLinkStatus {
        const status = this.computeLink();
        const now = this.clock();
        if (!this.link || this.link.state !== status.state) this.link = { state: status.state, sinceMs: now };
        return { ...status, sinceMs: this.link.sinceMs };
    }

    async applyTransmitter(req: TransmitterApplyRequest, actor: EdgeActor): Promise<KernelTransmitterState> {
        const current = this.state.transmitter.version();
        if (!req || req.stateVersion !== current) throw new EdgePortError('state_changed', 'the transmitter state changed', { stateVersion: current });
        const next = this.cleanSettings(req.settings);
        const fields = this.settingsErrors(next);
        if (Object.keys(fields).length) throw new EdgePortError('invalid_settings', 'invalid transmitter settings', { fields });
        const stored = this.state.transmitter.get().settings;
        const changes = transmitterInterruptingChanges(stored, next);
        if (this.linkUp() && changes.length && req.confirmInterrupt !== true) {
            throw new EdgePortError('confirm_required', 'the change interrupts a live feed', { guard: this.guard(stored ?? DEFAULT_SETTINGS, next, changes, current) });
        }
        // A person's Apply wins over the reporter address a session carries now: that value counts as dealt with, so
        // it is not applied over their settings at the next link drop (a NEW value from the cloud still is).
        await this.commitSettings(next, stored, actor, { cloudReporter: this.cloudReporterSeen() });
        return this.transmitterState();
    }

    /**
     * The apply itself (step 4), for a person's Apply and for the cloud reporter settings alike: persist and move the
     * state version in one transaction (synchronously: whoever looks next sees the new settings), then (re)start the
     * link, audit, log and publish. `cloudReporter`, when given, is stored (null: cleared) in that transaction, with
     * `previous` (the settings to bring back when the cloud's are over) when that is given too.
     */
    private commitSettings(
        next: TransmitterSettings,
        stored: TransmitterSettings | null,
        actor: EdgeActor,
        opts: { readonly cloudReporter?: string | null; readonly previous?: TransmitterSettings | null; readonly nSesid?: string | null; readonly sessionName?: string | null } = {},
    ): Promise<void> {
        const changes = transmitterInterruptingChanges(stored, next);
        const atMs = this.clock();
        this.state.transaction(() => {
            this.state.transmitter.save(next, { atMs, by: actor });
            this.state.transmitter.bumpVersion();
            if (opts.cloudReporter !== undefined) {
                if (opts.previous !== undefined) this.state.transmitter.setCloudReporter(opts.cloudReporter, opts.previous);
                else this.state.transmitter.setCloudReporter(opts.cloudReporter);
            }
        });
        // Dial with auto-reconnect starts at once (as at boot); without it the link waits for "Connect", unless it
        // was already wanted in dial mode.
        this.dialWant = next.mode === 'dial' && (next.autoReconnect || (stored?.mode === 'dial' && this.dialWant));
        const nSesid = opts.nSesid ?? null;
        return this.runLink(() => this.applyLink('settings-changed')).then(() => {
            this.audit('transmitter-apply', actor, 'ok', nSesid, { mode: next.mode, changes });
            this.log({ atMs, event: 'success', source: 'transmitter', code: 'tx-settings-applied', problem: false, nSesid, sessionName: opts.sessionName ?? null, peer: next.mode === 'dial' && next.host ? `${next.host}:${next.port}` : null, actor, data: next.protocol ? { protocol: next.protocol } : {} });
            this.publishTransmitter();
        });
    }

    async connectTransmitter(stateVersion: number, actor: EdgeActor): Promise<KernelTransmitterState> {
        const current = this.state.transmitter.version();
        if (stateVersion !== current) throw new EdgePortError('state_changed', 'the transmitter state changed', { stateVersion: current });
        const s = this.settings();
        if (s.mode !== 'dial') throw new EdgePortError('not_dial_mode', 'the transmitter is in listen mode');
        if (!s.host || !s.port || !s.protocol) throw new EdgePortError('not_configured', 'no applied transmitter address');
        const st = this.dialer?.status();
        if (this.linkUp() || st?.connected) throw new EdgePortError('already_connected', 'the transmitter link is up');
        this.dialWant = true;
        await this.runLink(() => this.applyLink('connect'));
        if (this.dialer?.nSesid && !this.dialer.status().connected && !this.dialer.status().retrying) this.dialer.connect();
        this.bumpVersion();
        this.audit('transmitter-connect', actor, 'ok', this.dialer?.nSesid ?? null, null);
        return this.transmitterState();
    }

    async reconnectTransmitter(stateVersion: number, actor: EdgeActor): Promise<KernelTransmitterState> {
        const current = this.state.transmitter.version();
        if (stateVersion !== current) throw new EdgePortError('state_changed', 'the transmitter state changed', { stateVersion: current });
        const s = this.settings();
        if (s.mode !== 'dial') throw new EdgePortError('not_dial_mode', 'the transmitter is in listen mode');
        if (this.linkUp() || this.dialer?.status().connected) throw new EdgePortError('link_up', 'the transmitter link is up');
        this.dialWant = true;
        await this.runLink(() => this.applyLink('connect'));
        if (this.dialer?.nSesid) this.dialer.reconnect();
        this.bumpVersion();
        this.audit('transmitter-reconnect', actor, 'ok', this.dialer?.nSesid ?? null, null);
        return this.transmitterState();
    }

    async testTransmitter(req: TransmitterTestRequest, actor: EdgeActor): Promise<KernelTransmitterTest> {
        if (this.testBusy()) {
            const linkState = this.transmitterLink().state;
            this.audit('transmitter-test', actor, 'test_refused_busy', null, { linkState });
            throw new EdgePortError('test_refused_busy', 'a transmitter link is connected or retrying', { linkState });
        }
        const draft = this.cleanSettings({ mode: 'dial', protocol: req?.protocol ?? null, host: req?.host ?? null, port: req?.port ?? null, autoReconnect: false, receivingSesid: null });
        const fields = this.settingsErrors(draft, false);
        if (Object.keys(fields).length) throw new EdgePortError('invalid_settings', 'invalid test address', { fields });
        const res = await probeTransmitter({
            host: draft.host!,
            port: draft.port!,
            protocol: draft.protocol!,
            totalMs: this.opts.testWindowMs,
            connectTimeoutMs: this.opts.dialConnectTimeoutMs,
            createConnection: this.opts.createConnection,
            clock: this.clock,
        });
        const peer = `${draft.host}:${draft.port}`;
        this.audit('transmitter-test', actor, 'ok', null, { result: res.result });
        this.log({
            atMs: this.clock(),
            event: res.result === 'data' ? 'success' : 'error',
            source: 'transmitter',
            code: 'tx-test',
            problem: false,
            nSesid: null,
            sessionName: null,
            peer,
            actor,
            data: { ...(res.error ? { error: res.error } : {}), ...(res.protocolSeen ? { protocol: res.protocolSeen } : {}), durationMs: res.durationMs },
        });
        return { result: res.result, protocolSeen: res.protocolSeen, bytes: res.bytes, durationMs: res.durationMs };
    }

    cloudReporterStatus(): CloudReporterStatus | null {
        if (!this.started || this.closing) return null;
        try {
            return this.cloudReporterPlan().status;
        } catch {
            return null;
        }
    }

    // ---- kernel extras (not on the port; specs and the CLI) -----------------------------------------------------

    /** The CAT listener's bound address (null when not listening). */
    listenAddress(): { address: string; port: number } | null {
        const a = this.listener?.address();
        return a ? { address: a.address, port: a.port } : null;
    }

    /** Wait until every open worker applied what it journaled (specs). */
    async settled(): Promise<void> {
        for (const h of this.held.values()) await h.worker?.settled().catch(() => undefined);
    }

    // =============================================================================================================
    // Internals: session bookkeeping
    // =============================================================================================================

    private hold(record: BoxSessionRecord): Held {
        let h = this.held.get(record.nSesid);
        if (h && h.dropped) {
            this.held.delete(record.nSesid);
            h = undefined;
        }
        if (!h) {
            h = {
                nSesid: record.nSesid,
                record,
                cutter: null,
                cut: null,
                worker: null,
                suppressCut: false,
                openError: null,
                armed: false,
                routeEarly: false,
                arming: null,
                recovering: null,
                corrupt: null,
                corruptWaiters: [],
                recoverPromise: null,
                endPromise: null,
                endResult: null,
                firstLineAtMs: record.firstLineAtMs,
                lastLineAtMs: null,
                feedStoppedAtMs: null,
                lastMode: null,
                lastAudit: null,
                lastAuditRunAt: this.clock(),
                auditing: false,
                parseErrors: 0,
                degradedSinceMs: null,
                mirroredIncidents: 0,
                extraIncidents: [],
                revFloor: 0,
                revFloorWrite: null,
                lastPublishedLineAt: null,
                lastFeed: null,
                quietLogged: false,
                dropped: false,
                openUnpinned: false,
                rewriting: false,
            };
            this.held.set(record.nSesid, h);
        } else {
            h.record = record;
        }
        return h;
    }

    /** Apply the three rules of kernel.port.ts to one stored record. */
    private consider(record: BoxSessionRecord): void {
        if (!sessionStaysOpen(record)) {
            void this.drop(record.nSesid);
            return;
        }
        const h = this.hold(record);
        if (sessionEndPending(record)) {
            void this.requestEnd(record.nSesid, 'cloud').catch(err => this.logger.warn(`end of ${record.nSesid} failed: ${errText(err)}`));
        } else if (sessionArmable(record)) {
            void this.arm(record.nSesid).then(res => {
                if (res.ok === false && res.reason !== 'ended') this.logger.warn(`session ${record.nSesid} not armed: ${res.reason} (${res.message})`);
            });
        } else if (!h.worker) {
            // Ended-unsealed (or not armable): open read-only so the uplink can seal and the room can read.
            void this.arbiter!.ensureWorker(record.nSesid).catch(() => undefined);
        }
    }

    private recheck(nSesid: string): void {
        if (!this.started || this.closing) return;
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record) return;
        const h = this.held.get(nSesid);
        if (h) h.record = record;
        if (!sessionStaysOpen(record)) void this.drop(nSesid);
    }

    private onAssignmentsChanged(diff: AssignmentsDiff): void {
        if (!this.started || this.closing) return;
        const ids = new Set([...(diff.sessionsAdded ?? []), ...(diff.sessionsUpdated ?? []), ...(diff.sessionsEndRequested ?? [])]);
        for (const nSesid of ids) {
            const record = this.safeState(() => this.state.sessions.get(nSesid), null);
            if (record) this.consider(record);
        }
        for (const nSesid of diff.sessionsPurged ?? []) void this.drop(nSesid);
        if (ids.size) {
            this.reloadRoutes();
            this.rebindDial();
        }
        // Every pull: a session that left the list (or lost its reporter) changes who the box connects to.
        this.followCloudReporter();
    }

    private async drop(nSesid: string): Promise<void> {
        const h = this.held.get(nSesid);
        if (!h || h.dropped) return;
        if (h.endPromise && !h.endResult) return; // never drop a session mid-drain
        h.dropped = true;
        h.armed = false;
        this.reloadRoutes();
        this.rebindDial();
        this.followCloudReporter();
        await this.persistRevFloor(h, true).catch(() => undefined);
        await h.worker?.close().catch(() => undefined);
        if (this.held.get(nSesid) === h) this.held.delete(nSesid);
    }

    private refresh(h: Held): BoxSessionRecord | null {
        const record = this.safeState(() => this.state.sessions.get(h.nSesid), null);
        if (record) h.record = record;
        return record;
    }

    private setLocal(h: Held, patch: BoxSessionLocalPatch): void {
        if (!Object.keys(patch).length) return;
        const record = this.safeState(() => this.state.sessions.setLocal(h.nSesid, patch, this.clock()), null);
        if (record) h.record = record;
    }

    // =============================================================================================================
    // Internals: workers
    // =============================================================================================================

    private openWorker(nSesid: string): Promise<SessionWorker> {
        const record = this.safeState(() => this.state.sessions.get(nSesid), null);
        if (!record) return Promise.reject(new EdgePortError('session_not_found', `session ${nSesid} is not on this box`));
        const h = this.hold(record);
        if (h.rewriting) return Promise.reject(new Error(`rt-edge kernel: the journal of ${nSesid} is being rewritten (RECOVER)`));
        return this.openWorkerWith(h, { unpinned: h.openUnpinned });
    }

    private async openWorkerWith(h: Held, how: { unpinned?: boolean }): Promise<SessionWorker> {
        const record = h.record;
        const nSesid = h.nSesid;
        const journalRoot = this.config.paths.journalDir;
        const fresh = !(await this.journalExists(nSesid));
        const startedAtMs = this.clock();
        if (!fresh) {
            h.recovering = { startedAtMs, progressPct: null };
            if (['assigned', 'armed', 'live'].includes(record.localState)) this.setLocal(h, { localState: 'recovering' });
            this.statusChanged(h, 'phase');
        }
        if (!h.cutter) {
            const cutter = new PageCutter({ nSesid, nLines: record.nLines || 25, fmt: record.fmt || 1, rawSeqThrough: 0, rawHashThrough: hex(chainSeed(nSesid)) });
            const floor = await readRevFloor(journalRoot, nSesid);
            if (floor > 0) cutter.advanceRev(floor - 1);
            h.revFloor = floor;
            h.cutter = cutter;
            h.suppressCut = true;
        }
        let worker: SessionWorker;
        try {
            worker = await SessionWorker.open({
                meta: {
                    nSesid,
                    nCaseid: record.nCaseid,
                    nLines: record.nLines || 25,
                    tz: record.tz || null,
                    parserVer: how.unpinned ? undefined : record.parserVer || undefined,
                    fmt: record.fmt || 1,
                    epoch: record.epoch || 1,
                    owner: 'edge',
                    label: record.cName,
                },
                journalRoot,
                fs: this.opts.journalFs,
                journal: this.opts.journal,
                checkpoints: this.state.checkpoints,
                checkpointEveryMs: this.opts.checkpointEveryMs ?? KERNEL_DEFAULTS.checkpointEveryMs,
                checkpointExtra: () => ({ rev: h.cutter?.currentRev ?? null, root: h.cutter?.view().root ?? null }),
                laneFactory: this.opts.laneFactory,
                onBoundary: info => this.onBoundary(h, info),
                boundaryMs: this.opts.boundaryMs ?? KERNEL_DEFAULTS.boundaryMs,
                onAlert: a => this.onIngestAlert(a),
                degradedRetryMs: this.opts.degradedRetryMs,
                clock: this.clock,
                parserVer: this.parserVer,
            });
        } catch (err) {
            h.recovering = null;
            this.classifyOpenError(h, err);
            this.statusChanged(h, 'phase');
            throw err;
        }
        h.worker = worker;
        h.corrupt = null;
        h.openError = null;
        if (worker.ended) {
            // The worker skips its recovery boundary for an ended session: cut the replayed state here.
            await this.recutFromLane(h, worker);
            h.endResult = await this.endResultFrom(h, await worker.end({ endedBy: 'cloud' }));
        }
        h.suppressCut = false;
        h.recovering = null;
        if (!h.firstLineAtMs && (h.cut?.totalLines ?? 0) > 0) h.firstLineAtMs = record.firstLineAtMs ?? worker.applier.lastByteAt ?? this.clock();
        if (h.lastLineAtMs === null && (h.cut?.totalLines ?? 0) > 0) h.lastLineAtMs = worker.applier.lastByteAt;
        if (!fresh && !worker.ended && (h.cut?.totalLines ?? 0) > 0 && !this.arbiter?.hasActive(nSesid)) {
            h.feedStoppedAtMs = worker.applier.lastConnClose?.tRecvMs ?? worker.applier.lastByteAt ?? startedAtMs;
        }
        h.lastMode = (worker.applier.lastConnOpen?.mode as TransmitterMode | undefined) ?? h.lastMode;
        const after = this.refresh(h) ?? record;
        if (after.localState === 'recovering') this.setLocal(h, { localState: h.firstLineAtMs ? 'live' : h.armed ? 'armed' : 'assigned' });
        if (h.firstLineAtMs && !after.firstLineAtMs) this.setLocal(h, { firstLineAtMs: h.firstLineAtMs });
        this.mirrorIncidents(h);
        await this.persistRevFloor(h, false).catch(() => undefined);
        this.statusChanged(h, 'phase');
        return worker;
    }

    private classifyOpenError(h: Held, err: unknown): void {
        if (err instanceof JournalCorruptError) {
            this.markCorrupt(h, err);
            h.openError = { reason: 'journal-corrupt', message: err.message };
        } else if (err instanceof ParserVersionMismatchError) {
            h.openError = { reason: 'parser-mismatch', message: err.message };
            // Build default O-1: no REBASE in v1; the session freezes for an admin's split, with an incident.
            this.setLocal(h, { localState: 'frozen' });
            this.recordStateIncident(h, 'REPLAY_DIVERGED', `parser version mismatch: journal pinned to ${err.pinned}, this build runs ${err.running}; replay refused (O-1)`);
        } else {
            h.openError = { reason: 'worker-error', message: errText(err) };
        }
    }

    /** MR-4. The earliest corruption found bounds the verified prefix: a later one never raises it. */
    private markCorrupt(h: Held, err: JournalCorruptError): void {
        const first = !h.corrupt;
        if (h.corrupt && h.corrupt.goodHead.seq <= err.goodHead.seq) return;
        h.corrupt = err;
        if (first) this.recordStateIncident(h, 'JOURNAL_CORRUPT', `journal corrupt at ${err.segment}:${err.offset} (expected seq ${err.expectSeq}); uplink halted (MR-4)`);
        this.statusChanged(h, 'uplink');
    }

    private recordStateIncident(h: Held, kind: BoxIncidentRecord['kind'], note: string): void {
        const incident: BoxIncidentRecord = { nSesid: h.nSesid, seq: null, atMs: this.clock(), kind, level: isWarningIncident({ kind }) ? 'warning' : 'info', note };
        h.extraIncidents.push(incident);
        this.safeState(() => this.state.incidents.record(incident), undefined);
    }

    private async recutFromLane(h: Held, worker: SessionWorker): Promise<void> {
        const lane = worker.applier.lane;
        if (!lane || !h.cutter) return;
        const seq = worker.applier.lastSeq;
        const hash = hex(worker.applier.lastHash);
        await lane.inLane(() => {
            const cut = h.cutter!.boundaryFromContext(lane.ctx as never, seq, hash);
            if (cut) h.cut = cut;
        });
    }

    private onBoundary(h: Held, info: BoundaryInfo): void {
        const cutter = h.cutter;
        if (!cutter) return;
        const buffer = (info.ctx as unknown as { job?: { lineBuffer?: unknown[] } }).job?.lineBuffer ?? [];
        if (info.final && h.cut) {
            const audit = cutter.audit(buffer);
            h.lastAudit = { atMs: this.clock(), ok: audit.mismatchedPages.length === 0 };
            if (audit.mismatchedPages.length) this.auditMismatch(h, audit.mismatchedPages);
        }
        const cut = cutter.boundaryFromContext(info.ctx as never, info.rawSeqThrough, info.rawHashThrough);
        if (!cut) return;
        h.cut = cut;
        if (info.reason === 'recovered' && h.suppressCut) return;
        for (const listener of [...this.cutListeners]) {
            try {
                listener(cut);
            } catch (err) {
                this.logger.error(`a cut listener threw: ${errText(err)}`);
            }
        }
        this.afterCut(h, cut);
    }

    private afterCut(h: Held, cut: Cut): void {
        const now = this.clock();
        if (cut.totalLines > 0) h.lastLineAtMs = h.worker?.lastLineAt ?? now;
        const floor = nextRevFloor(cut.rev, h.revFloor);
        if (floor !== null) void this.persistRevFloor(h, false).catch(() => undefined);
        if (!h.firstLineAtMs && cut.totalLines > 0) {
            h.firstLineAtMs = now;
            const record = h.record;
            this.setLocal(h, { firstLineAtMs: now, ...(['assigned', 'armed'].includes(record.localState) ? { localState: 'live' as const } : {}) });
            this.publish('session-event', { type: 'first-line', nSesid: h.nSesid, atMs: now });
            this.log({ atMs: now, event: 'success', source: 'transmitter', code: 'tx-first-line', problem: false, nSesid: h.nSesid, sessionName: h.record.cName, peer: this.arbiter?.sessionStatus(h.nSesid)?.active?.remote ?? null, actor: null, data: { lines: cut.totalLines } });
            this.statusChanged(h, 'phase');
        }
        if (h.quietLogged && cut.totalLines > 0) {
            h.quietLogged = false;
            this.log({ atMs: now, event: 'feed', source: 'transmitter', code: 'tx-resumed', problem: false, nSesid: h.nSesid, sessionName: h.record.cName, peer: null, actor: null, data: {} });
        }
    }

    private auditMismatch(h: Held, pages: readonly number[]): void {
        h.worker?.incident('AUDIT_MISMATCH', { note: `digest audit: page(s) ${pages.join(', ')} differed from their committed digest (fingerprint collision); re-cut` });
        this.alert('P2', false, 'AUDIT_MISMATCH', `session ${h.nSesid}: digest audit mismatch on page(s) ${pages.join(', ')}`, h.nSesid, { pages: [...pages] });
    }

    private runAudit(h: Held): void {
        const worker = h.worker;
        const lane = worker?.applier.lane;
        if (!worker || !lane || worker.ended || h.auditing || !h.cutter || !h.cut) return;
        h.auditing = true;
        h.lastAuditRunAt = this.clock();
        void lane
            .inLane(() => {
                const audit = h.cutter!.audit((lane.ctx as unknown as { job: { lineBuffer: unknown[] } }).job.lineBuffer ?? []);
                h.lastAudit = { atMs: this.clock(), ok: audit.mismatchedPages.length === 0 };
                return audit.mismatchedPages;
            })
            .then(pages => {
                if (pages.length) {
                    this.auditMismatch(h, pages);
                    return worker.boundary();
                }
                return undefined;
            })
            .catch(err => this.logger.warn(`audit of ${h.nSesid} failed: ${errText(err)}`))
            .finally(() => {
                h.auditing = false;
            });
    }

    private async persistRevFloor(h: Held, force: boolean): Promise<void> {
        if (this.closing && !force) return;
        const rev = h.cutter?.currentRev ?? 0;
        const next = force ? Math.max(h.revFloor, rev + 1_000) : nextRevFloor(rev, h.revFloor);
        if (next === null || next <= h.revFloor) return;
        if (h.revFloorWrite) await h.revFloorWrite.catch(() => undefined);
        if (next <= h.revFloor) return;
        h.revFloorWrite = writeRevFloor(this.config.paths.journalDir, h.nSesid, next).then(
            () => {
                h.revFloor = Math.max(h.revFloor, next);
            },
            err => this.logger.warn(`rev floor of ${h.nSesid} not saved: ${errText(err)}`),
        );
        await h.revFloorWrite;
        h.revFloorWrite = null;
    }

    private mirrorIncidents(h: Held): void {
        const incidents = h.worker?.applier.incidents ?? [];
        if (incidents.length <= h.mirroredIncidents) return;
        const atMs = this.clock();
        for (let i = h.mirroredIncidents; i < incidents.length; i++) {
            const inc = incidents[i];
            const ok = this.safeState(() => {
                this.state.incidents.record({ ...inc, nSesid: h.nSesid, seq: inc.seq, atMs } as BoxIncidentRecord);
                return true;
            }, false);
            if (!ok) return;
            h.mirroredIncidents = i + 1;
        }
    }

    private async journalExists(nSesid: string): Promise<boolean> {
        try {
            const names = await fs.promises.readdir(journalDirOf(this.config.paths.journalDir, nSesid));
            for (const name of names) {
                if (!/^seg-\d{5,}\.ej$/.test(name)) continue;
                const st = await fs.promises.stat(path.join(journalDirOf(this.config.paths.journalDir, nSesid), name));
                if (st.size > 0) return true;
            }
            return false;
        } catch {
            return false;
        }
    }

    private async diskFreeMb(): Promise<number | null> {
        try {
            if (this.opts.diskFreeMb) return await this.opts.diskFreeMb(this.config.paths.journalDir);
            const statfs = (fs.promises as unknown as { statfs?: (p: string) => Promise<{ bavail: number; bsize: number }> }).statfs;
            if (!statfs) return null;
            const st = await statfs(this.config.paths.journalDir);
            return Math.floor((Number(st.bavail) * Number(st.bsize)) / (1024 * 1024));
        } catch {
            return null;
        }
    }

    // =============================================================================================================
    // Internals: views and status
    // =============================================================================================================

    private viewOf(h: Held): KernelSessionView {
        const now = this.clock();
        const record = h.record;
        const link = this.arbiter?.sessionStatus(h.nSesid) ?? null;
        const worker = h.worker;
        const status = worker?.status();
        const linkUp = !!link?.active;
        const endedAtMs = h.endResult?.endedAtEdgeMs ?? record.endedAtMs ?? null;
        const lastLineAtMs = h.lastLineAtMs ?? (h.firstLineAtMs ? h.firstLineAtMs : null);
        const feed = deriveFeedState({ endedAtMs, firstLineAtMs: h.firstLineAtMs, lastLineAtMs, linkUp, nowMs: now });
        const view = h.cutter && worker ? h.cutter.view() : null;
        const totalLines = h.cut?.totalLines ?? view?.totalLines ?? 0;
        const nLines = record.nLines || 25;
        const page = totalLines > 0 ? Math.ceil(totalLines / nLines) : null;
        const lastLine: EdgeLinePosition | null = totalLines > 0 ? { page: page!, line: totalLines - (page! - 1) * nLines, atMs: lastLineAtMs } : null;
        const raw = this.rawHead(h.nSesid) ?? { headSeq: 0, headHash: hex(chainSeed(h.nSesid)), durableSeq: 0, durableHash: hex(chainSeed(h.nSesid)) };
        const incidents = [...(worker?.applier.incidents ?? []), ...h.extraIncidents];
        const lockout = this.listenerLockout(h.nSesid, now);
        return {
            nSesid: h.nSesid,
            localState: h.recovering ? 'recovering' : record.localState,
            phase: phaseOfFeed(feed),
            feed,
            protocol: worker?.protocol ?? null,
            mode: (link?.active?.mode as TransmitterMode | undefined) ?? h.lastMode,
            catConnected: linkUp,
            peer: link?.active?.remote ?? null,
            heldPeers: (link?.held ?? []).map(x => x.remote),
            lockout,
            bytesIn: status?.bytesIn ?? 0,
            lastByteAtMs: link?.lastByteAt ?? status?.lastByteAt ?? null,
            firstLineAtMs: h.firstLineAtMs,
            lastLineAtMs,
            feedStoppedAtMs: feed === 'stopped' ? h.feedStoppedAtMs ?? lastLineAtMs : null,
            lastLine,
            endRequestedAtMs: record.endRequestedAtMs,
            endedAtMs,
            rev: h.cut?.rev ?? view?.rev ?? 0,
            totalLines,
            page,
            root: h.cut?.root ?? view?.root ?? null,
            raw,
            durability: worker?.durability ?? 'ok',
            degradedSinceMs: worker?.durability === 'degraded' ? h.degradedSinceMs ?? now : null,
            journalCorrupt: !!h.corrupt,
            recovering: h.recovering,
            incidents: { total: incidents.length, warnings: incidents.filter(i => isWarningIncident(i)).length },
            parseErrors: h.parseErrors,
            lastAudit: h.lastAudit,
        };
    }

    private listenerLockout(nSesid: string, now: number): boolean {
        try {
            return !!this.listener?.lockoutState.status().some(e => e.nSesid === nSesid && e.blockedUntil !== null && e.blockedUntil > now);
        } catch {
            return false;
        }
    }

    private statusChanged(h: Held, cause: SessionStatusCause): void {
        this.publish('session-status', { nSesid: h.nSesid, cause, atMs: this.clock() });
    }

    private onTick(): void {
        if (!this.started || this.closing) return;
        const now = this.clock();
        for (const h of this.held.values()) {
            if (h.dropped) continue;
            this.mirrorIncidents(h);
            const worker = h.worker;
            if (!worker) continue;
            const lineAt = worker.lastLineAt;
            if (lineAt !== null && (h.lastLineAtMs === null || lineAt > h.lastLineAtMs)) h.lastLineAtMs = lineAt;
            const view = this.viewOf(h);
            if (view.feed !== h.lastFeed) {
                const cause: SessionStatusCause = h.lastFeed === null || view.feed === 'ended' ? 'phase' : 'link';
                h.lastFeed = view.feed;
                this.statusChanged(h, cause);
            } else if (h.lastLineAtMs !== null && h.lastLineAtMs !== h.lastPublishedLineAt) {
                h.lastPublishedLineAt = h.lastLineAtMs;
                this.statusChanged(h, 'line');
            }
            if (view.feed === 'quiet' && !h.quietLogged && h.lastLineAtMs !== null && now - h.lastLineAtMs >= EDGE_TIMING.quietNeutralMs) {
                h.quietLogged = true;
                this.log({ atMs: now, event: 'feed', source: 'transmitter', code: 'tx-quiet', problem: false, nSesid: h.nSesid, sessionName: h.record.cName, peer: view.peer, actor: null, data: { durationMs: now - h.lastLineAtMs } });
            }
            if (!worker.ended && now - h.lastAuditRunAt >= (this.opts.auditEveryMs ?? KERNEL_DEFAULTS.auditEveryMs)) this.runAudit(h);
        }
        this.transmitterLink();
        // Time alone changes the owner: a session becomes due, a started one nobody ended goes stale.
        if (now - this.cloudReporterCheckedAt >= (this.opts.cloudReporterRecheckMs ?? CLOUD_REPORTER_RECHECK_MS)) this.followCloudReporter();
    }

    // =============================================================================================================
    // Internals: transmitter link
    // =============================================================================================================

    private settings(): TransmitterSettings {
        return this.safeState(() => this.state.transmitter.get().settings, null) ?? DEFAULT_SETTINGS;
    }

    private cleanSettings(s: TransmitterSettings): TransmitterSettings {
        const v = (s ?? {}) as Partial<TransmitterSettings>;
        return {
            mode: v.mode === 'dial' ? 'dial' : v.mode === 'listen' ? 'listen' : (v.mode as never),
            protocol: v.protocol === 'bridge' || v.protocol === 'caseview' ? v.protocol : (v.protocol ?? null),
            host: typeof v.host === 'string' ? v.host.trim() : (v.host ?? null),
            port: v.port ?? null,
            autoReconnect: v.autoReconnect !== false,
            receivingSesid: typeof v.receivingSesid === 'string' && v.receivingSesid ? v.receivingSesid : null,
        };
    }

    /** Contract validation + S-D14 (a dial host outside the transmitter network is refused as `ipv4`). */
    private settingsErrors(s: TransmitterSettings, checkSession = true): TransmitterFieldErrors {
        const fields: Record<string, string> = {};
        if (s.mode !== 'listen' && s.mode !== 'dial') fields.mode = 'required';
        const known = [...this.held.values()].filter(h => !h.dropped && !h.endResult).map(h => h.nSesid);
        Object.assign(fields, validateTransmitterSettings(s, checkSession ? known : undefined));
        const cidr = this.config.transmitter.networkCidr;
        if (s.mode === 'dial' && !fields.host && s.host && cidr && !ipv4InCidr(s.host, cidr)) fields.host = 'ipv4';
        return fields as TransmitterFieldErrors;
    }

    private linkUp(): boolean {
        if (this.dialer?.status().connected) return true;
        return [...this.held.values()].some(h => !h.dropped && !!this.arbiter?.hasActive(h.nSesid));
    }

    private testBusy(): boolean {
        const d = this.dialer?.status();
        return !!(d && (d.connected || d.retrying)) || this.linkUp();
    }

    private guard(now: TransmitterSettings, after: TransmitterSettings, changes: TransmitterGuard['changes'], stateVersion: number): TransmitterGuard {
        const link = this.transmitterLink();
        const h = link.receivingSesid ? this.held.get(link.receivingSesid) : undefined;
        const caseName = h ? this.safeState(() => this.state.assignments.case(h.record.nCaseid)?.cCasename ?? '', '') : '';
        return {
            session: h ? { nSesid: h.nSesid, sessionName: h.record.cName, caseName } : null,
            lastLineAtMs: link.lastLineAtMs,
            peer: link.peer,
            now,
            after,
            changes,
            stateVersion,
        };
    }

    private sessionOptions(): TransmitterSessionOption[] {
        const now = this.clock();
        const tz = this.config.box.timeZone;
        const today = boxDay(now, tz);
        return [...this.held.values()]
            .filter(h => !h.dropped && !h.endResult && !h.endPromise && sessionArmable(h.record))
            .map(h => {
                const v = this.viewOf(h);
                const startAtMs = wallClockToEpochMs(h.record.dStartDt, h.record.tz);
                const caseName = this.safeState(() => this.state.assignments.case(h.record.nCaseid)?.cCasename ?? '', '');
                return { nSesid: h.nSesid, sessionName: h.record.cName, caseName, phase: v.phase, isToday: startAtMs !== null ? boxDay(startAtMs, tz) === today : false };
            });
    }

    /** The session a dialed transmitter feeds: the setting, else the single live (else armed) session, else none. */
    private receivingSession(s: TransmitterSettings): string | null {
        const armed = [...this.held.values()].filter(h => !h.dropped && h.armed && !h.endPromise && !h.endResult);
        if (s.receivingSesid) return armed.some(h => h.nSesid === s.receivingSesid) ? s.receivingSesid : null;
        const live = armed.filter(h => h.firstLineAtMs);
        if (live.length === 1) return live[0].nSesid;
        if (live.length === 0 && armed.length === 1) return armed[0].nSesid;
        return null;
    }

    private queueLink(op: () => Promise<void>): void {
        this.linkOp = this.linkOp.then(op).catch(err => this.logger.error(`transmitter link change failed: ${errText(err)}`));
    }

    private runLink(op: () => Promise<void>): Promise<void> {
        this.queueLink(op);
        return this.linkOp;
    }

    /** Start the link the applied settings ask for (and stop the other mode). */
    private async applyLink(reason = 'settings-changed'): Promise<void> {
        if (!this.started || this.closing) return;
        const s = this.settings();
        if (s.mode === 'dial') {
            if (this.listener) {
                // The interrupted Eclipse connections close with the reason the guard announced (CONN_CLOSE journaled).
                for (const h of this.held.values()) {
                    if (this.arbiter?.sessionStatus(h.nSesid)?.active?.mode === 'listen') await this.arbiter.closeConnections(h.nSesid, reason).catch(() => 0);
                }
            }
            await this.stopListener();
            this.ensureDialer(s, reason);
        } else {
            if (this.dialer) {
                const d = this.dialer;
                this.dialer = null;
                d.disconnect(reason);
                await d.close();
            }
            this.dialWant = false;
            this.dialEverConnected = false;
            await this.startListener();
        }
    }

    private async startListener(): Promise<void> {
        if (this.listener || !this.routes || !this.arbiter) return;
        if (this.listenStarting) return this.listenStarting;
        this.listenStarting = (async () => {
            const listener = new CatListener({
                port: this.config.transmitter.listenPort,
                bindAddress: this.config.transmitter.bindAddress ?? undefined,
                routes: this.routes!,
                arbiter: this.arbiter!,
                onAlert: a => this.onIngestAlert(a),
                clock: this.clock,
                handshakeTimeoutMs: this.opts.handshakeTimeoutMs,
                drain: { idleMs: this.opts.drain?.idleMs, boundMs: this.opts.drain?.boundMs, pollMs: this.opts.drain?.pollMs },
                log: (message, level) => {
                    if (level === 'error') this.logger.error(message);
                    else if (level === 'warn') this.logger.warn(message);
                },
            });
            try {
                const addr = await listener.start();
                this.listener = listener;
                this.listenerPort = addr.port;
                this.listenerError = null;
            } catch (err) {
                const code = (err as NodeJS.ErrnoException)?.code ?? errText(err);
                if (this.listenerError !== code) this.alert('P1', false, 'LISTEN_FAILED', `the CAT listener could not bind ${this.config.transmitter.bindAddress ?? '*'}:${this.config.transmitter.listenPort} (${code}); retrying`, null, { code });
                this.listenerError = code;
                if (!this.listenRetry && !this.closing) {
                    this.listenRetry = setTimeout(() => {
                        this.listenRetry = null;
                        if (this.settings().mode === 'listen') this.queueLink(() => this.startListener());
                    }, this.opts.listenRetryMs ?? KERNEL_DEFAULTS.listenRetryMs);
                    this.listenRetry.unref?.();
                }
            }
        })().finally(() => {
            this.listenStarting = null;
        });
        return this.listenStarting;
    }

    private async stopListener(): Promise<void> {
        if (this.listenRetry) clearTimeout(this.listenRetry);
        this.listenRetry = null;
        const listener = this.listener;
        this.listener = null;
        this.listenerPort = null;
        if (listener) await listener.stop().catch(() => undefined);
    }

    private ensureDialer(s: TransmitterSettings, reason: string): void {
        if (!this.arbiter) return;
        if (!this.dialer) {
            const cidr = this.config.transmitter.networkCidr;
            this.dialer = new CatDialer({
                arbiter: this.arbiter,
                clock: this.clock,
                onLog: e => this.onDialLog(e),
                connectTimeoutMs: this.opts.dialConnectTimeoutMs ?? KERNEL_DEFAULTS.dialConnectTimeoutMs,
                hostAllowed: cidr ? host => ipv4InCidr(host, cidr) : undefined,
                createConnection: this.opts.createConnection,
            });
            this.dialEverConnected = false;
        }
        const d = this.dialer;
        const configured = !!(s.host && s.port && s.protocol);
        const ds: DialerSettings | null = configured ? { protocol: s.protocol!, host: s.host!, port: s.port!, autoReconnect: s.autoReconnect, reconnectMs: this.opts.dialReconnectMs ?? KERNEL_DEFAULTS.dialReconnectMs } : null;
        const nSesid = this.receivingSession(s);
        const cur = d.settings;
        const same = cur && ds ? cur.host === ds.host && cur.port === ds.port && cur.protocol === ds.protocol && cur.autoReconnect === ds.autoReconnect : cur === ds;
        if (!same || d.nSesid !== nSesid) {
            const res = d.apply({ settings: ds, nSesid }, d.version);
            if (res.ok === false) this.logger.warn(`dialer refused the settings (${res.reason}${res.errors ? `: ${res.errors.join('; ')}` : ''})`);
            void reason;
        }
        const st = d.status();
        if (this.dialWant && ds && nSesid && !st.connected && !st.retrying) d.connect();
    }

    /** Re-point the dialer when the receiving session changes (arm, end, drop). */
    private rebindDial(): void {
        if (!this.dialer) return;
        const s = this.settings();
        if (s.mode !== 'dial') return;
        this.ensureDialer(s, 'session-changed');
    }

    // ---- cloud reporter settings (ports/kernel.port.ts) -----------------------------------------------------------

    /**
     * Let the transmitter follow the reporter address the cloud set on a session. Called wherever the sessions or the
     * link change (boot, assignments, arm, end, drop, link drop) and from the tick; never throws into those paths.
     */
    private followCloudReporter(): void {
        if (!this.started || this.closing || !this.arbiter) return;
        this.cloudReporterCheckedAt = this.clock();
        try {
            this.forgetCloudReporter();
            const plan = this.cloudReporterPlan();
            const status = plan.status;
            if (status?.state === 'refused') this.cloudReporterRefused(status);
            if (plan.action === 'none') return;
            if (plan.action === 'adopt') {
                this.state.transaction(() => this.state.transmitter.setCloudReporter(plan.fingerprint));
                return;
            }
            const stored = this.state.transmitter.get().settings;
            const linkFailed = (err: unknown): void => this.logger.error(`cloud reporter settings: the link did not restart: ${errText(err)}`);
            if (plan.action === 'apply' && plan.wanted && status) {
                this.logger.log(`session ${status.nSesid}: reporter connection ${status.host}:${status.port} (${plan.wanted.protocol}) taken from etabella.net`);
                this.commitSettings(plan.wanted, stored, CLOUD_REPORTER_ACTOR, { cloudReporter: plan.fingerprint, previous: plan.previous, nSesid: status.nSesid, sessionName: plan.sessionName }).catch(linkFailed);
            } else if (plan.action === 'restore' && plan.wanted) {
                this.logger.log(`the reporter address taken from etabella.net is over: back to ${plan.wanted.mode} mode, as set before it`);
                this.commitSettings(plan.wanted, stored, CLOUD_REPORTER_ACTOR, { cloudReporter: null }).catch(linkFailed);
            }
        } catch (err) {
            this.logger.error(`cloud reporter settings not followed: ${errText(err)}`);
        }
    }

    /**
     * The sessions that may own the transmitter: every STORED session that is listed, not deleted, not ended or ending
     * and whose arm was not refused, with or without a reporter address, armed already or not.
     */
    private openSessions(): OpenSession[] {
        const out: OpenSession[] = [];
        const dialed = this.dialer?.status().connected ? this.dialer.nSesid : null;
        for (const record of this.state.sessions.list()) {
            if (!staysOpen(record)) continue;
            const h = this.held.get(record.nSesid) ?? null;
            if (h && (h.dropped || h.openError || h.endPromise || h.endResult)) continue;
            const armed = !!h?.armed;
            const firstLineAtMs = h?.firstLineAtMs ?? record.firstLineAtMs ?? null;
            const active = !!h && !!this.arbiter?.hasActive(record.nSesid);
            const up = active || (!!h && dialed === record.nSesid);
            out.push({
                record,
                armed,
                up,
                busy: up && (firstLineAtMs !== null || (active && h?.lastMode === 'listen')),
                started: firstLineAtMs !== null,
                // Before it is armed the journal is still being read: the last activity is not known yet.
                activeAtMs: firstLineAtMs === null || !armed ? null : Math.max(firstLineAtMs, h?.lastLineAtMs ?? 0),
                startAtMs: wallClockToEpochMs(record.dStartDt, record.tz),
            });
        }
        return out;
    }

    /**
     * The OWNER of the transmitter among the open sessions:
     * (1) the session whose transmitter connection is up now; else
     * (2) the session that has started and was active less than CLOUD_REPORTER_HOLD_MS ago (the most recent); else
     * (3) among the sessions not started yet, the latest one whose start time has passed, else the one that starts
     *     first (no start last, then nSesid); a started session nobody ended, idle for longer than the hold, comes
     *     last (the most recently active).
     */
    private transmitterOwner(open: readonly OpenSession[], nowMs: number): OpenSession | null {
        const up = open.filter(s => s.up);
        if (up.length) return [...up].sort(byActivity)[0];
        const holdMs = this.opts.cloudReporterHoldMs ?? CLOUD_REPORTER_HOLD_MS;
        const holding = open.filter(s => s.started && (s.activeAtMs === null || nowMs - s.activeAtMs < holdMs));
        if (holding.length) return [...holding].sort(byActivity)[0];
        const fresh = open.filter(s => !s.started);
        const due = fresh.filter(s => s.startAtMs !== null && s.startAtMs <= nowMs);
        if (due.length) return [...due].sort((a, b) => (a.startAtMs !== b.startAtMs ? b.startAtMs! - a.startAtMs! : byId(a, b)))[0];
        if (fresh.length) return [...fresh].sort(byStart)[0];
        return [...open].sort(byActivity)[0] ?? null;
    }

    /**
     * Read-only: who owns the transmitter and what to do about the reporter address the cloud set (the rules are in
     * ports/kernel.port.ts). The owner comes from the stored sessions, never from the ones that happen to be armed
     * already, and nothing is applied before the owner itself is armed.
     */
    private cloudReporterPlan(): CloudReporterPlan {
        const stored = this.state.transmitter.cloudReporter();
        const now = this.settings();
        const nowMs = this.clock();
        const open = this.openSessions();
        const owner = this.transmitterOwner(open, nowMs);
        const applied = stored ? settingsOfFingerprint(stored) : null;
        /** The settings in force are exactly the ones taken from the cloud (nobody changed them at the box). */
        const cloudInForce = !!applied && sameSettings(now, applied);
        /** The change would close a connection worth keeping (`OpenSession.busy`): it waits for that link to drop. */
        const upElsewhere = (next: TransmitterSettings): boolean => open.some(s => s.busy) && transmitterInterruptingChanges(now, next).length > 0;

        /** The cloud's settings are over: the settings in force before them return, unless that closes an up connection. */
        const restore = (status: CloudReporterStatus | null, sessionName: string | null, fingerprint: string | null): CloudReporterPlan => {
            const back = this.state.transmitter.cloudReporterPrevious() ?? DEFAULT_SETTINGS;
            const action = cloudInForce && !upElsewhere(back) ? 'restore' : 'none';
            return { action, status, sessionName, wanted: action === 'restore' ? back : null, fingerprint };
        };

        if (!owner?.record.reporter) {
            // The owner's reporter connects TO the box (or no session is open): another session's address waits.
            const next = owner ? [...open].filter(s => s !== owner && !!s.record.reporter).sort(byStart)[0] : undefined;
            if (!owner || !next) return restore(null, null, null);
            const { host, port } = next.record.reporter!;
            const overridden = !cloudInForce && reporterFingerprintOf(next.record) === stored;
            const status: CloudReporterStatus = overridden
                ? { nSesid: next.record.nSesid, host, port, state: 'overridden', reason: null }
                : { nSesid: next.record.nSesid, host, port, state: 'waiting', reason: 'held-by-session', heldBy: owner.record.nSesid };
            return restore(status, next.record.cName, null);
        }

        const { host, port } = owner.record.reporter;
        const nSesid = owner.record.nSesid;
        const sessionName = owner.record.cName;
        const status = (state: CloudReporterStatus['state'], reason: CloudReporterReason | null = null): CloudReporterStatus => ({ nSesid, host, port, state, reason });
        /** A refused owner still needs the box: settings the cloud applied for ANOTHER session do not stay in its way. */
        const refused = (reason: CloudReporterReason, fingerprint: string | null): CloudReporterPlan =>
            applied?.receivingSesid !== nSesid ? restore(status('refused', reason), sessionName, fingerprint) : { action: 'none', status: status('refused', reason), sessionName, wanted: null, fingerprint };

        const protocol = transmitterProtocolOf(owner.record.protocol);
        if (!protocol) return refused('protocol-unknown', null);
        const wanted = cloudReporterSettings(nSesid, host, port, protocol);
        const fingerprint = cloudReporterFingerprint(wanted);
        const plan = (action: CloudReporterPlan['action'], s: CloudReporterStatus, previous?: TransmitterSettings | null): CloudReporterPlan => ({ action, status: s, sessionName, wanted, fingerprint, previous });
        if (fingerprint === stored) return plan('none', status(sameSettings(now, wanted) ? 'applied' : 'overridden'));
        const refusal = this.cloudReporterRefusal(wanted);
        if (refusal) return refused(refusal, fingerprint);
        // Arm order must not decide: whichever session arms first, the owner's value waits for the owner itself.
        if (!owner.armed) return plan('none', status('waiting'));
        if (sameSettings(now, wanted)) return plan('adopt', status('applied'));
        if (upElsewhere(wanted)) return plan('none', status('waiting', 'feed-live'));
        // One cloud value replacing another keeps what was remembered before the first of them.
        return plan('apply', status('waiting'), cloudInForce ? undefined : this.state.transmitter.get().settings);
    }

    /** The box's own rules a cloud reporter address must pass (the same as a person's Apply). */
    private cloudReporterRefusal(wanted: TransmitterSettings): CloudReporterReason | null {
        if (!this.config.features.transmitterDialMode) return 'dial-mode-off';
        const fields = this.settingsErrors(wanted);
        if (fields.host) return 'outside-network';
        // Not reachable for a normalized assignment; never apply settings the box calls invalid.
        if (Object.keys(fields).length) throw new Error(`rt-edge kernel: invalid cloud reporter settings (${Object.keys(fields).join(', ')})`);
        return null;
    }

    /**
     * Forget a remembered cloud value nobody carries any more, once a person changed the connection since: the same
     * address typed again on etabella.net is then a new value. While the cloud's settings are still in force the
     * value stays (the restore needs it).
     */
    private forgetCloudReporter(): void {
        const stored = this.state.transmitter.cloudReporter();
        if (!stored) return;
        const applied = settingsOfFingerprint(stored);
        if (applied && sameSettings(this.settings(), applied)) return;
        if (this.state.sessions.list().some(r => staysOpen(r) && reporterFingerprintOf(r) === stored)) return;
        this.state.transaction(() => this.state.transmitter.setCloudReporter(null));
    }

    /** One alert per refused value (the assignments are pulled again and again). */
    private cloudReporterRefused(status: CloudReporterStatus): void {
        const key = `${status.nSesid}|${status.host}|${status.port}|${status.reason}`;
        if (this.cloudReporterAlerted.has(key)) return;
        this.cloudReporterAlerted.add(key);
        const why =
            status.reason === 'dial-mode-off'
                ? 'connecting to the reporter is switched off on this box'
                : status.reason === 'outside-network'
                  ? `it is outside the transmitter network ${this.config.transmitter.networkCidr}`
                  : 'the session pins no protocol (Bridge or CaseView)';
        this.alert('P2', false, 'CLOUD_REPORTER_REFUSED', `session ${status.nSesid}: the reporter address ${status.host}:${status.port} set on etabella.net is not used: ${why}`, status.nSesid, {
            reason: status.reason,
            host: status.host,
            port: status.port,
        });
    }

    /**
     * The reporter address the box follows now (the owner's), as a fingerprint: a person's Apply marks it as dealt
     * with. Undefined when the owner carries no usable one (the stored fingerprint is then left alone).
     */
    private cloudReporterSeen(): string | undefined {
        try {
            return this.cloudReporterPlan().fingerprint ?? undefined;
        } catch {
            return undefined;
        }
    }

    private reloadRoutes(): void {
        if (!this.routes) return;
        this.routes.load(this.routeEntries());
    }

    private routeEntries(): unknown[] {
        const out: unknown[] = [];
        for (const h of this.held.values()) {
            if (h.dropped || !(h.armed || h.routeEarly) || h.endResult) continue;
            const r = h.record.route;
            if (!r || !r.user || !r.salt || !r.hash) continue;
            out.push({ nSesid: h.nSesid, nCaseid: h.record.nCaseid, user: r.user, salt: r.salt, hash: r.hash, scryptN: r.scryptN, nLines: h.record.nLines, cTimezone: h.record.tz, label: h.record.cName });
        }
        return out;
    }

    private computeLink(): Omit<TransmitterLinkStatus, 'sinceMs'> & { sinceMs: number | null } {
        const now = this.clock();
        const s = this.settings();
        const heldPeers = [...this.held.values()].reduce((n, h) => n + (this.arbiter?.sessionStatus(h.nSesid)?.held.length ?? 0), 0);
        const lockout = [...this.held.values()].some(h => this.listenerLockout(h.nSesid, now));
        const base = { mode: s.mode, sinceMs: null, attempt: null, quietLevel: null, heldPeers, lockout } as const;
        const quiet = (lastLineAtMs: number | null): { state: TransmitterLinkState; quietLevel: 'neutral' | 'warn' | null } => {
            if (lastLineAtMs !== null && now - lastLineAtMs <= EDGE_TIMING.liveLineWindowMs) return { state: 'live', quietLevel: null };
            const since = lastLineAtMs ?? now;
            return { state: 'quiet', quietLevel: now - since > EDGE_TIMING.quietNeutralMs ? 'warn' : 'neutral' };
        };
        if (s.mode === 'dial') {
            const d = this.dialer?.status();
            if (!s.host || !s.port || !s.protocol) return { ...base, state: 'not-set-up', protocol: null, peer: null, bytesIn: 0, lastLineAtMs: null, receivingSesid: null };
            const nSesid = d?.nSesid ?? null;
            const h = nSesid ? this.held.get(nSesid) : undefined;
            const protocol: TransmitterProtocol = s.protocol;
            if (d?.connected) {
                if (!h || !h.firstLineAtMs) return { ...base, state: 'connected-no-session', protocol, peer: d.peer, bytesIn: d.bytes, lastLineAtMs: h?.lastLineAtMs ?? null, receivingSesid: nSesid };
                const q = quiet(h.lastLineAtMs);
                return { ...base, state: q.state, quietLevel: q.quietLevel, protocol, peer: d.peer, bytesIn: d.bytes, lastLineAtMs: h.lastLineAtMs, receivingSesid: nSesid };
            }
            if (d && (d.retrying || (this.dialWant && nSesid && d.state === 'connecting'))) {
                return { ...base, state: 'connecting', attempt: Math.max(1, d.attempt), protocol: null, peer: null, bytesIn: d.bytes, lastLineAtMs: h?.lastLineAtMs ?? null, receivingSesid: nSesid };
            }
            const stopped = this.dialEverConnected || !!h?.feedStoppedAtMs;
            return { ...base, state: stopped ? 'disconnected' : 'waiting', protocol: null, peer: null, bytesIn: d?.bytes ?? 0, lastLineAtMs: h?.lastLineAtMs ?? null, receivingSesid: nSesid };
        }
        // Listen mode: the worst of the armed sessions' connections.
        let pick: { rank: number; status: Omit<TransmitterLinkStatus, 'sinceMs'> & { sinceMs: number | null } } | null = null;
        for (const h of this.held.values()) {
            if (h.dropped || (!h.armed && !h.endPromise)) continue;
            const link = this.arbiter?.sessionStatus(h.nSesid);
            const protocol: TransmitterProtocol | null = h.worker?.protocol === 'C' ? 'caseview' : h.worker?.protocol === 'B' ? 'bridge' : null;
            let status: Omit<TransmitterLinkStatus, 'sinceMs'> & { sinceMs: number | null };
            let rank: number;
            if (link?.active) {
                if (!h.firstLineAtMs) {
                    status = { ...base, state: 'connected-no-session', protocol, peer: link.active.remote, bytesIn: link.active.bytes, lastLineAtMs: null, receivingSesid: h.nSesid };
                    rank = 2;
                } else {
                    const q = quiet(h.lastLineAtMs);
                    status = { ...base, state: q.state, quietLevel: q.quietLevel, protocol, peer: link.active.remote, bytesIn: link.active.bytes, lastLineAtMs: h.lastLineAtMs, receivingSesid: h.nSesid };
                    rank = q.state === 'live' ? 1 : q.quietLevel === 'warn' ? 4 : 3;
                }
            } else if (h.feedStoppedAtMs && !h.endResult) {
                status = { ...base, state: 'disconnected', protocol: null, peer: null, bytesIn: 0, lastLineAtMs: h.lastLineAtMs, receivingSesid: h.nSesid };
                rank = 5;
            } else {
                continue;
            }
            if (!pick || rank > pick.rank) pick = { rank, status };
        }
        if (pick) return pick.status;
        return { ...base, state: 'waiting', protocol: null, peer: null, bytesIn: 0, lastLineAtMs: null, receivingSesid: null };
    }

    private bumpVersion(): number {
        const v = this.safeState(() => this.state.transmitter.bumpVersion(), null);
        if (v !== null) this.publish('transmitter-changed', { stateVersion: v, link: this.transmitterLink(), atMs: this.clock() });
        return v ?? 0;
    }

    private publishTransmitter(): void {
        const v = this.safeState(() => this.state.transmitter.version(), 0);
        this.publish('transmitter-changed', { stateVersion: v, link: this.transmitterLink(), atMs: this.clock() });
    }

    private onAttached(nSesid: string, conn: CatConnection, res: AttachResult): void {
        const h = this.held.get(nSesid);
        const now = this.clock();
        if (res.status === 'active') {
            if (h) {
                h.lastMode = conn.mode;
                if (h.feedStoppedAtMs !== null) {
                    const gapFromMs = h.lastLineAtMs ?? h.feedStoppedAtMs;
                    h.feedStoppedAtMs = null;
                    this.publish('feed-resumed', { nSesid, reconnectedAtMs: now, gapFromMs, gapToMs: now });
                }
                this.statusChanged(h, 'link');
            }
            // Dial connections are logged and versioned from the dialer's own events (onDialLog).
            if (conn.mode === 'listen') {
                this.log({ atMs: now, event: 'connected', source: 'transmitter', code: 'tx-listen-connected', problem: false, nSesid, sessionName: h?.record.cName ?? null, peer: conn.remote, actor: null, data: {} });
                this.bumpVersion();
            }
        } else if (res.status === 'held') {
            this.log({ atMs: now, event: 'error', source: 'transmitter', code: 'tx-held-peer', problem: true, nSesid, sessionName: h?.record.cName ?? null, peer: conn.remote, actor: null, data: {} });
            if (h) this.statusChanged(h, 'link');
        }
    }

    private onDetached(nSesid: string, conn: CatConnection, reason: string, role: 'active' | 'held'): void {
        if (role !== 'active') return;
        const h = this.held.get(nSesid);
        const now = this.clock();
        const expected = EXPECTED_CLOSE.has(reason);
        const live = !!h && !!h.firstLineAtMs && !h.endPromise && !h.endResult;
        if (conn.mode === 'listen') {
            this.log({
                atMs: now,
                event: 'disconnected',
                source: 'transmitter',
                code: /RESET|EPIPE/i.test(reason) ? 'tx-reset' : 'tx-peer-closed',
                problem: live && !expected,
                nSesid,
                sessionName: h?.record.cName ?? null,
                peer: conn.remote,
                actor: null,
                data: { lines: h?.cut?.totalLines ?? 0 },
            });
        }
        if (h && live && !expected) {
            h.feedStoppedAtMs = now;
            this.publish('feed-stopped', { nSesid, feedStoppedAtMs: now, lastLine: this.viewOf(h).lastLine, mode: conn.mode, peer: conn.remote });
        }
        if (h) this.statusChanged(h, 'link');
        if (conn.mode === 'listen') this.bumpVersion();
        // The link dropped: a NEW address for this same session that waited for its link may be applied now (the
        // session itself keeps the transmitter: CLOUD_REPORTER_HOLD_MS).
        this.followCloudReporter();
    }

    private onDialLog(e: ConnectivityLogEntry): void {
        const s = this.settings();
        const key = `tx-dial:${s.host}:${s.port}`;
        const nSesid = e.nSesid ?? null;
        const h = nSesid ? this.held.get(nSesid) : undefined;
        const sessionName = h?.record.cName ?? null;
        const peer = e.peer ?? (s.host ? `${s.host}:${s.port}` : null);
        const protocol = s.protocol ?? undefined;
        switch (e.kind) {
            case 'error': {
                if (e.collapseKey !== 'dial-retry') return;
                const cls = socketErrorClass(/:\s*(\S+)$/.exec(e.message)?.[1] ?? e.message);
                const code = cls === 'refused' ? 'tx-refused' : cls === 'timeout' ? 'tx-timeout' : 'tx-unreachable';
                this.safeState(
                    () =>
                        this.state.connectivityLog.retry(key, { atMs: e.at, error: cls, peer }, { atMs: e.at, event: 'retrying', source: 'transmitter', code, problem: true, nSesid, sessionName, peer, actor: null, data: { error: cls, ...(protocol ? { protocol } : {}) } }),
                    null,
                );
                return;
            }
            case 'connected':
                this.dialEverConnected = true;
                this.dialConnectedAt = e.at;
                this.safeState(() => this.state.connectivityLog.endRetry(key, e.at), null);
                this.log({ atMs: e.at, event: 'connected', source: 'transmitter', code: 'tx-connected', problem: false, nSesid, sessionName, peer, actor: null, data: protocol ? { protocol } : {} });
                this.bumpVersion();
                return;
            case 'disconnected': {
                const live = !!h && !!h.firstLineAtMs && !h.endPromise && !h.endResult;
                const unexpected = !/\((settings-changed|session-changed|manual-reconnect|disconnect|shutdown|session-end)\)/.test(e.message);
                this.log({
                    atMs: e.at,
                    event: 'disconnected',
                    source: 'transmitter',
                    code: /RESET|EPIPE/i.test(e.message) ? 'tx-reset' : 'tx-peer-closed',
                    problem: live && unexpected,
                    nSesid,
                    sessionName,
                    peer,
                    actor: null,
                    data: { ...(this.dialConnectedAt !== null ? { durationMs: Math.max(0, e.at - this.dialConnectedAt) } : {}), lines: h?.cut?.totalLines ?? 0 },
                });
                this.dialConnectedAt = null;
                this.bumpVersion();
                return;
            }
            case 'success':
                if (h && h.firstLineAtMs && h.firstLineAtMs < (this.dialConnectedAt ?? 0)) {
                    this.log({ atMs: e.at, event: 'feed', source: 'transmitter', code: 'tx-resumed', problem: false, nSesid, sessionName, peer, actor: null, data: {} });
                }
                return;
            default:
                return;
        }
    }

    // =============================================================================================================
    // Internals: alerts, log, audit, state
    // =============================================================================================================

    private onIngestAlert(a: IngestAlert): void {
        const h = a.nSesid ? this.held.get(a.nSesid) : undefined;
        switch (a.kind) {
            case 'JOURNAL_CORRUPT':
                break;
            case 'DEGRADED_DURABILITY':
                if (h) h.degradedSinceMs = h.degradedSinceMs ?? a.at;
                this.log({ atMs: a.at, event: 'error', source: 'box', code: 'disk-write-failed', problem: true, nSesid: a.nSesid ?? null, sessionName: h?.record.cName ?? null, peer: null, actor: null, data: { error: 'io-error' } });
                if (h) this.statusChanged(h, 'phase');
                break;
            case 'DURABILITY_RESTORED':
                if (h) h.degradedSinceMs = null;
                this.log({ atMs: a.at, event: 'success', source: 'box', code: 'disk-write-restored', problem: false, nSesid: a.nSesid ?? null, sessionName: h?.record.cName ?? null, peer: null, actor: null, data: {} });
                if (h) this.statusChanged(h, 'phase');
                break;
            case 'PARSER_ERROR':
                if (h) h.parseErrors += 1;
                break;
            case 'UNKNOWN_LOGIN':
                this.log({ atMs: a.at, event: 'error', source: 'transmitter', code: 'tx-login-refused', problem: true, nSesid: null, sessionName: null, peer: a.peer ?? null, actor: null, data: { error: 'unknown-login' } });
                break;
            case 'LOCKOUT':
                this.log({ atMs: a.at, event: 'error', source: 'transmitter', code: 'tx-lockout', problem: true, nSesid: a.nSesid ?? null, sessionName: h?.record.cName ?? null, peer: a.peer ?? null, actor: null, data: {} });
                break;
            default:
                break;
        }
        const data: Record<string, unknown> = { ...(a.data ?? {}) };
        if (a.user !== undefined) data.user = a.user;
        if (a.peer !== undefined) data.peer = a.peer;
        if (a.peers !== undefined) data.peers = a.peers;
        if (a.macs !== undefined) data.macs = a.macs;
        if (a.connId !== undefined) data.connId = a.connId;
        const alert: EdgeAlert = { source: 'ingest', tier: a.tier, critical: !!a.critical, kind: a.kind, message: a.message, atMs: a.at, nSesid: a.nSesid ?? null, data };
        this.publish('alert', alert);
    }

    private alert(tier: EdgeAlert['tier'], critical: boolean, kind: string, message: string, nSesid: string | null = null, data: Record<string, unknown> | null = null): void {
        this.logger[tier === 'info' ? 'log' : 'warn'](message);
        this.publish('alert', { source: 'ingest', tier, critical, kind, message, atMs: this.clock(), nSesid, data });
    }

    private log(row: ConnectivityLogInsert): void {
        this.safeState(() => this.state.connectivityLog.append(row), null);
    }

    private audit(action: 'transmitter-apply' | 'transmitter-connect' | 'transmitter-reconnect' | 'transmitter-test', actor: EdgeActor, outcome: string, nSesid: string | null, data: Record<string, unknown> | null): void {
        this.safeState(() => this.state.audit.append({ atMs: this.clock(), action, actor, outcome, nSesid, target: null, ip: null, deviceHash: null, data }), undefined);
    }

    private mirrorCapture(record: HeldCaptureRecord): void {
        const existing = this.safeState(() => this.state.heldCaptures.get(record.id), null);
        this.safeState(() => this.state.heldCaptures.upsert({ ...record, uploadedAtMs: existing?.uploadedAtMs ?? null, nOrphanid: existing?.nOrphanid ?? null }), undefined);
    }

    private publish<K extends EdgeBusEventName>(type: K, payload: EdgeBusEvents[K]): void {
        try {
            this.bus.publish(type, payload);
        } catch (err) {
            this.logger.error(`publishing ${String(type)} failed: ${errText(err)}`);
        }
    }

    /** StatePort failures are logged and alerted; ingest never depends on the database (spec §10 #1). */
    private safeState<T>(fn: () => T, fallback: T): T {
        try {
            return fn();
        } catch (err) {
            this.logger.error(`state write/read failed: ${errText(err)}`);
            try {
                this.bus.publish('alert', { source: 'state', tier: 'P2', critical: false, kind: 'STATE_ERROR', message: `edge.sqlite: ${errText(err)}`, atMs: this.clock(), nSesid: null, data: null });
            } catch {
                /* ignore */
            }
            return fallback;
        }
    }
}

function refuse(reason: KernelArmRefusal, message: string): KernelArmResult {
    return { ok: false, reason, message };
}

function errText(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

/** sha256 hex of a buffer (CLI/specs). */
export function sha256Hex(b: Buffer): string {
    return createHash('sha256').update(b).digest('hex');
}
