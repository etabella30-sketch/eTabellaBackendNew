/**
 * Boot status (token EDGE_BOOT_STATUS, provided by the global EdgeCoreModule; the phase and the start failures are
 * written only by EdgeLifecycle in app.module.ts, the LAN listener status only by main.ts's `EdgeLanListener`).
 *
 * Boot rule (spec §10 #1 "CAT→box→LAN does not depend on the uplink", MR-5).
 *
 * FATAL — the process ends and systemd restarts it. There are exactly three such conditions, in boot order:
 * 1. The box config is missing or structurally invalid (`BoxConfigError`, exit 78), before anything is built. Never a
 *    runtime condition.
 * 2. The module graph cannot be built (`EdgeBootError` stage `module-graph`, exit 70). In practice this is the state
 *    database: STATE_PORT's provider factory opens and migrates `BoxConfig.paths.stateDb` before any port is handed
 *    out (ports/state.port.ts) and throws `EdgeStateUnavailableError` when the file cannot be opened (unreadable,
 *    corrupt, a directory in its place) or carries a schema newer than this build. Every module needs the state
 *    (sessions, routes, identity), so the box neither records nor serves the LAN. No event bus exists yet: the only
 *    signals are the error log line, the exit code and the cloud's "box silent" alert (spec §12).
 *    NOT implemented in this wave: spec §10 #3 "if SQLite fails its integrity check, rebuild from raw". Moving the
 *    file aside and recreating it would also drop the box identity (enrolment), which the journals cannot rebuild,
 *    so that recovery is left to the state module's owner; until then this condition is fatal.
 * 3. `KernelPort.start()` rejected (`EdgeBootError` stage `recording`, exit 70): the box cannot record. Everything
 *    is closed first. The kernel rejects only on a programming error (ports/kernel.port.ts); a runtime condition
 *    (a session that cannot open, a busy CAT port) is reported by the kernel, never thrown from `start()`.
 * In `cli` run mode only 1 and 2 apply (the command prints the reason and exits 78 / 70).
 *
 * NOT FATAL — everything after recording started:
 * - The LAN listener makes its first attempt (main.ts). It binds only with a loadable certificate/key pair
 *   (`readTlsMaterial`, ports/certificate.ts); a missing, unreadable or invalid pair (a freshly enrolled box has
 *   none yet) or a failed bind (EADDRINUSE, EACCES) is NOT fatal: it is recorded in `lanListener()`, logged and
 *   alerted (`source:'lan'`, kinds `CERTIFICATE_UNAVAILABLE` / `LISTEN_FAILED`, P1), and retried until it binds.
 * - `UplinkPort.start()`, `OpsPort.start()` and `LanPort.start()` run after that first attempt, whether or not it
 *   bound (`EdgeLifecycle.startServices`): the uplink is what fetches the missing certificate. Each one that
 *   rejects, or does not resolve within `EDGE_START_STEP_BUDGET_MS`, is logged, published as an `alert`
 *   (`source` = the step, `kind: 'START_FAILED'`, tier P1) and recorded here; the box keeps recording and serving.
 *   Ops reads `startFailures()` and `lanListener()` for the verdict and the diagnostics, because both can change
 *   before ops subscribed to the bus.
 * - While the box serves ('serve' run mode, from before `KernelPort.start()` until the HTTP server closed in the
 *   shutdown), main.ts holds the process open itself: every timer and watcher of the box is unref'd, so without
 *   that hold a box whose LAN listener is not bound and whose CAT and cloud sockets happen to be closed would
 *   simply exit with code 0.
 */
import type { EdgeTlsProblem } from './certificate';

/** The cause's message (by shape, not `instanceof`: node:sqlite's errors come from another realm under jest). */
const causeText = (cause: unknown): string => {
    const message = (cause as { message?: unknown } | null)?.message;
    return typeof message === 'string' ? message : String(cause);
};

/**
 * STATE_PORT's provider factory (state/state.module.ts) could not hand out an opened, migrated database: the file
 * cannot be opened or its schema is newer than this build. Fatal for the boot (condition 2 above).
 */
export class EdgeStateUnavailableError extends Error {
    /** `BoxConfig.paths.stateDb`. */
    readonly file: string;
    /** What the open or the migration threw. */
    readonly cause: unknown;

    constructor(file: string, cause: unknown) {
        super(`the state database ${file} cannot be opened or migrated: ${causeText(cause)}`);
        this.name = 'EdgeStateUnavailableError';
        this.file = file;
        this.cause = cause;
    }
}

/**
 * Which fatal boot condition stopped the box (conditions 2 and 3 above; condition 1 is a `BoxConfigError`):
 * - `module-graph`: a provider could not be built or initialised — a provider factory, a constructor or a Nest init
 *   hook threw (`cause` is an `EdgeStateUnavailableError` for the state database);
 * - `recording`: `KernelPort.start()` rejected (the boot phase is `failed`).
 */
export type EdgeBootFailureStage = 'module-graph' | 'recording';

/** What `startServer` (main.ts) rejects with when the box cannot start; the process exits `EDGE_EXIT.software`. */
export class EdgeBootError extends Error {
    readonly stage: EdgeBootFailureStage;
    /** The original error (its message is part of this one's). */
    readonly cause: unknown;

    constructor(stage: EdgeBootFailureStage, cause: unknown) {
        const why =
            stage === 'recording'
                ? `recording could not start: ${causeText(cause)}`
                : cause instanceof EdgeStateUnavailableError
                  ? cause.message
                  : `the module graph could not be built: ${causeText(cause)}`;
        super(`the box cannot start: ${why}`);
        this.name = 'EdgeBootError';
        this.stage = stage;
        this.cause = cause;
    }
}

/** The non-kernel start steps, in start order. */
export const EDGE_SERVICE_STEPS = ['uplink', 'ops', 'lan'] as const;
export type EdgeServiceStep = (typeof EDGE_SERVICE_STEPS)[number];

/** How long the lifecycle waits for one service start before it moves on (the step keeps running). */
export const EDGE_START_STEP_BUDGET_MS = 10_000;

/**
 * - `booting`: the module graph is built, nothing started;
 * - `recording`: `KernelPort.start()` resolved (the CAT link and the journals run; the HTTP server may not listen yet);
 * - `started`: the service steps ran (each one started, failed or overran its budget); the LAN listener may still be
 *   waiting (`lanListener()`);
 * - `failed`: `KernelPort.start()` rejected; everything was closed (a module graph that cannot be built never gets
 *   this far: no recorder exists);
 * - `stopping` / `stopped`: the shutdown is running / done.
 * In `cli` run mode the phase stays `booting` until the shutdown.
 */
export type EdgeBootPhase = 'booting' | 'recording' | 'started' | 'failed' | 'stopping' | 'stopped';

/** A service start that did not succeed. The box kept running without it (spec §10 #1). */
export interface EdgeStartFailure {
    readonly step: EdgeServiceStep;
    /** `rejected`: start() rejected. `timeout`: start() had not resolved after the budget (it may still resolve later). */
    readonly reason: 'rejected' | 'timeout';
    /** Developer text (error message). Never a token, code value or key material. */
    readonly message: string;
    /** Epoch ms. */
    readonly atMs: number;
}

/**
 * The LAN HTTP(S) listener (the room's only way in, spec §8.2):
 * - `not-started`: before the first attempt, and always in `cli` run mode;
 * - `listening`: bound on `BoxConfig.http.host:port` (with a loadable certificate unless `plainHttp`);
 * - `waiting-certificate`: production, no loadable certificate/key pair yet (`certificate` says why); the box records
 *   and links meanwhile, and binds as soon as one loads (poll every `http.tls.reloadPollMs`, or `certificate-installed`);
 * - `listen-failed`: the pair is fine (or plain HTTP) but the bind failed (`error`: EADDRINUSE, EACCES, …); retried.
 * The listener never goes back from `listening` (a later bad pair is refused by the hot reload; the served one stays).
 */
export type EdgeLanListenerState = 'not-started' | 'listening' | 'waiting-certificate' | 'listen-failed';

export interface EdgeLanListenerStatus {
    readonly state: EdgeLanListenerState;
    /** Epoch ms of the last state change; null while `not-started`. */
    readonly sinceMs: number | null;
    /** True when the box serves plain HTTP (dev, `http.tls: null`). */
    readonly plainHttp: boolean;
    /** `waiting-certificate`: why the configured pair cannot be served; null otherwise. */
    readonly certificate: EdgeTlsProblem | null;
    /** `listen-failed`: the bind error (code or message); null otherwise. */
    readonly error: string | null;
}

export const EDGE_LAN_LISTENER_NOT_STARTED: EdgeLanListenerStatus = Object.freeze({
    state: 'not-started',
    sinceMs: null,
    plainHttp: false,
    certificate: null,
    error: null,
});

export interface EdgeBootStatus {
    phase(): EdgeBootPhase;
    /** Epoch ms the phase was last changed; null while `booting`. */
    phaseSinceMs(): number | null;
    /** Every start failure since boot, oldest first (a late rejection after a `timeout` adds a `rejected` entry). */
    startFailures(): readonly EdgeStartFailure[];
    /** True when `step` has a failure recorded and has not started since. */
    stepFailed(step: EdgeServiceStep): boolean;
    /** The LAN listener now (frozen snapshot). */
    lanListener(): EdgeLanListenerStatus;
}

/** The one implementation; EdgeLifecycle and main.ts write it, everyone else reads it through `EdgeBootStatus`. */
export class EdgeBootRecorder implements EdgeBootStatus {
    private current: EdgeBootPhase = 'booting';
    private sinceMs: number | null = null;
    private readonly failures: EdgeStartFailure[] = [];
    private readonly started = new Set<EdgeServiceStep>();
    private listener: EdgeLanListenerStatus = EDGE_LAN_LISTENER_NOT_STARTED;

    phase(): EdgeBootPhase {
        return this.current;
    }

    phaseSinceMs(): number | null {
        return this.sinceMs;
    }

    startFailures(): readonly EdgeStartFailure[] {
        return [...this.failures];
    }

    stepFailed(step: EdgeServiceStep): boolean {
        return !this.started.has(step) && this.failures.some(f => f.step === step);
    }

    lanListener(): EdgeLanListenerStatus {
        return this.listener;
    }

    /** main.ts (`EdgeLanListener`) only. */
    setLanListener(status: EdgeLanListenerStatus): void {
        this.listener = Object.freeze({ ...status, certificate: status.certificate ? Object.freeze({ ...status.certificate }) : null });
    }

    setPhase(phase: EdgeBootPhase, atMs: number): void {
        this.current = phase;
        this.sinceMs = atMs;
    }

    /** A service step resolved (also after a `timeout`, when it resolves late). */
    stepStarted(step: EdgeServiceStep): void {
        this.started.add(step);
    }

    recordFailure(failure: EdgeStartFailure): void {
        this.failures.push(Object.freeze({ ...failure }));
        if (failure.reason === 'rejected') this.started.delete(failure.step);
    }
}
