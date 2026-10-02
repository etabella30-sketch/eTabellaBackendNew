/**
 * rt-edge entry point (spec §3.2, §3.4): `node dist/apps/rt-edge/main.js [--config <file.json>] [command]`.
 *
 * - Config: ONLY the JSON box config (`--config` or `RT_EDGE_CONFIG`; ports/box-config.ts). No dotenv, no `.env`.
 *   A missing or structurally invalid config exits 78; nothing found at runtime does.
 * - Serve: Nest HTTPS directly (no sidecar), certificate and key from `BoxConfig.http.tls`, hot-reloaded when the
 *   files change (`server.setSecureContext`); plain HTTP only in `mode: "dev"` with `http.tls: null`. Every HTTPS
 *   response carries `Strict-Transport-Security` (spec §8.3 "HSTS is kept"); plain HTTP never does.
 * - Boot order and the fatal conditions (ports/boot.ts; `startServer` rejects with `EdgeBootError`, exit 70):
 *   1. The module graph is built. A provider that cannot be built is fatal (stage `module-graph`): in practice the
 *      state database that cannot be opened or migrated (`EdgeStateUnavailableError`, state/state.module.ts).
 *   2. `app.init()`: kernel.start (Nest bootstrap hook). Its rejection is fatal (stage `recording`); everything is
 *      closed first.
 *   3. The LAN listener's first attempt (`EdgeLanListener`): it binds only with a loadable certificate/key pair. A
 *      production box without one (a freshly enrolled box has none: the uplink fetches it, spec §8.3), or a failed
 *      bind, keeps running: the state goes to `EdgeBootStatus.lanListener()`, a P1 alert goes out, and the listener
 *      retries every `http.tls.reloadPollMs` and at once on `certificate-installed`. Never fatal.
 *   4. `EdgeLifecycle.startServices()` (uplink → ops → lan; failures are alerted, never fatal), so the room's HTTPS
 *      never waits for the cloud and the cloud link never waits for a certificate.
 * - Staying alive: every timer and watcher of the box is unref'd (the listener's retry timer, the certificate
 *   watchers, the kernel's, the uplink's and the ops timers), so nothing but an open socket would keep Node running.
 *   `startServer` therefore holds the process open itself (`holdProcessOpen`) from before the module graph is built
 *   until the HTTP server closed in the shutdown (or the boot failed); `runCli` holds it for the length of a command.
 * - Graceful shutdown: SIGTERM / SIGINT → Nest shutdown hooks → EdgeLifecycle closes lan → ops → uplink → kernel →
 *   state (app.module.ts); the listener stops retrying once the shutdown began and when the server closes.
 * - CLI commands (`enroll`, `status`, `recover`, `capture …`, `cert install`; all parsed by ports/cli.port.ts
 *   `parseEdgeArgs`) run in an application context with run mode 'cli'. A context that cannot be built (the state
 *   database again) prints the reason and exits 70.
 * - Request bodies: JSON and urlencoded are parsed with an explicit limit (EDGE_BODY_LIMIT_BYTES, just above the rt-data
 *   layer's documented 1 MB write limit) instead of Nest's default 100 KB, so the rt-data layer's own size check is the
 *   one that answers (review 23).
 * - The certificate pair is checked for an install a crash interrupted (uplink/cert-install.ts) before the listener
 *   reads it, at boot and on every check while it is not bound (review 24).
 * Exit codes: EDGE_EXIT (ports/cli.port.ts).
 */
import * as fs from 'fs';
import type { SecureContextOptions } from 'tls';

import { DynamicModule, INestApplication, INestApplicationContext, Logger, LoggerService, LogLevel, NestApplicationOptions } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { HttpsOptions } from '@nestjs/common/interfaces/external/https-options.interface';
import type { NestApplicationContextOptions } from '@nestjs/common/interfaces/nest-application-context-options.interface';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';

import { AppModule, EdgeLifecycle } from './app.module';
import { DEFAULT_RT_DATA_OPTIONS } from './lan/rt-data/rt-data.options';
import { completeCertificateInstall } from './uplink/cert-install';
import {
    BoxConfig,
    BoxConfigError,
    BoxTlsConfig,
    CLI_PORT,
    CliOutput,
    CliPort,
    EDGE_BOOT_STATUS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EDGE_EXIT,
    EDGE_TLS_MIN_VERSION,
    EDGE_USAGE,
    EdgeAlert,
    EdgeBootError,
    EdgeBootRecorder,
    EdgeCliCommand,
    EdgeClock,
    EdgeCommand,
    EdgeEventBus,
    EdgeLanListenerStatus,
    EdgeTlsError,
    EdgeTlsProblem,
    EdgeUsageError,
    isNotImplemented,
    loadBoxConfig,
    parseEdgeArgs,
    readTlsMaterial,
    resolveConfigPath,
} from './ports';

type ReadFile = (file: string) => Buffer;
const readFileBuffer: ReadFile = file => fs.readFileSync(file);

/** How often a plain-HTTP (dev) listener retries a failed bind. With TLS the period is `http.tls.reloadPollMs`. */
export const EDGE_LISTEN_RETRY_MS = 5_000;

/** Nest logger option: `false` silences Nest (specs), a LoggerService or level list otherwise. */
export type EdgeLoggerOption = false | LoggerService | LogLevel[];

/** Builds the Nest app from the box module. Default `NestFactory.create`; specs compile it with provider overrides. */
export type EdgeAppFactory = (module: DynamicModule, options: NestApplicationOptions) => Promise<INestApplication>;
/** Builds the initialised CLI context. Default `NestFactory.createApplicationContext`. */
export type EdgeContextFactory = (module: DynamicModule, options: NestApplicationContextOptions) => Promise<INestApplicationContext>;

const nestAppFactory: EdgeAppFactory = (module, options) => NestFactory.create(module, options);
const nestContextFactory: EdgeContextFactory = (module, options) => NestFactory.createApplicationContext(module, options);

/**
 * `Strict-Transport-Security` of every HTTPS response (spec §8.3 "HTTPS is mandatory and HSTS is kept", §11 LAN MITM):
 * one year, in seconds. No `includeSubDomains` (the box is a leaf host, `<slug>.etabella-edge.net`) and no `preload`.
 * Never sent over dev plain HTTP (browsers ignore it there, and a dev host must not be pinned to HTTPS).
 */
export const EDGE_HSTS_MAX_AGE_SEC = 31_536_000;
export const EDGE_HSTS_HEADER = 'Strict-Transport-Security';
export const EDGE_HSTS_VALUE = `max-age=${EDGE_HSTS_MAX_AGE_SEC}`;

/**
 * Request body limit of the box (JSON and urlencoded, review 23). Nest's default parser stops at 100 KB, below the
 * 1 MB the rt-data write path documents (`maxRequestBodyBytes`), and its 413 surfaced as a bare `invalid_request`.
 * This is that limit plus a margin, so the rt-data layer's own size check is the one that answers.
 */
export const EDGE_BODY_LIMIT_BYTES = DEFAULT_RT_DATA_OPTIONS.maxRequestBodyBytes + 64 * 1024;

/**
 * Register the JSON and urlencoded parsers with EDGE_BODY_LIMIT_BYTES (before `init()`: Nest then skips its own
 * default parsers, which it recognises by name).
 */
export function useEdgeBodyParsers(app: INestApplication, limitBytes: number = EDGE_BODY_LIMIT_BYTES): void {
    const parsers = app as unknown as Partial<Pick<NestExpressApplication, 'useBodyParser'>>;
    if (typeof parsers.useBodyParser !== 'function') return;
    parsers.useBodyParser('json', { limit: limitBytes });
    parsers.useBodyParser('urlencoded', { limit: limitBytes, extended: true });
}

/** libuv threadpool size of the box process (review 28; the compose file sets the same value). */
export const EDGE_UV_THREADPOOL_SIZE = 16;

/** Takes a hold that keeps the Node process alive; the returned function releases it (idempotent). */
export type EdgeProcessHold = () => () => void;

/** The longest delay a Node timer takes (2^31 − 1 ms ≈ 24.8 days); the hold's timer just fires again. */
const HOLD_TIMER_MS = 2_147_483_647;

/**
 * Keep the Node process alive until the returned function is called: one ref'd timer that does nothing. Every other
 * timer and watcher of the box is unref'd, so without this a serving box whose LAN listener is not bound (no
 * certificate yet, port taken) and whose CAT and cloud sockets happen to be closed would exit with code 0.
 */
export const holdProcessOpen: EdgeProcessHold = () => {
    let handle: NodeJS.Timeout | null = setInterval(() => undefined, HOLD_TIMER_MS);
    return () => {
        if (handle === null) return;
        clearInterval(handle);
        handle = null;
    };
};

/** Interval timers of the LAN listener (default: Node's, unref'd: `holdProcessOpen` is what keeps the box alive). */
export interface LanTimers {
    setInterval(fn: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
}

const nodeTimers: LanTimers = {
    setInterval: (fn, ms) => {
        const handle = setInterval(fn, ms);
        handle.unref?.();
        return handle;
    },
    clearInterval: handle => clearInterval(handle as NodeJS.Timeout),
};

export interface StartServerOptions {
    readonly logger?: EdgeLoggerOption;
    /** Register SIGTERM/SIGINT shutdown hooks (default true; specs pass false). */
    readonly shutdownHooks?: boolean;
    /** Default `NestFactory.create`. */
    readonly createApp?: EdgeAppFactory;
    /** The certificate reads and watchers (default `fs.readFileSync`, `fs.watchFile` / `fs.unwatchFile`). */
    readonly tlsWatch?: TlsWatchDeps;
    /** Retry period while the listener is not bound. Default `http.tls.reloadPollMs`, or EDGE_LISTEN_RETRY_MS. */
    readonly listenRetryMs?: number;
    /** Default: Node's timers, unref'd. */
    readonly timers?: LanTimers;
    /** Default `holdProcessOpen`: taken before the module graph is built, released when the HTTP server closed or the boot failed. */
    readonly holdProcess?: EdgeProcessHold;
    /** Default: uplink/cert-install.ts `completeCertificateInstall` (EdgeLanListenerDeps.recoverCertificate). */
    readonly recoverCertificate?: (tls: BoxTlsConfig) => void;
}

/**
 * The options the HTTP server is CREATED with; undefined = plain HTTP, allowed only in dev mode (else BoxConfigError,
 * exit 78: the box must not silently fall back to HTTP — HSTS and the room's trust depend on it, spec §8.3).
 * With TLS the server is created WITHOUT a certificate: `EdgeLanListener` installs a loadable pair with
 * `setSecureContext` before it ever binds, so no certificate problem can stop the box from starting.
 */
export function buildHttpsOptions(config: BoxConfig): HttpsOptions | undefined {
    if (!config.http.tls) {
        if (config.mode !== 'dev') throw new BoxConfigError(['http.tls is required outside dev mode'], config.configPath);
        return undefined;
    }
    return { minVersion: EDGE_TLS_MIN_VERSION } as HttpsOptions;
}

/** Anything with `setSecureContext` (an https.Server). */
export interface SecureContextTarget {
    setSecureContext(options: SecureContextOptions): void;
}

/**
 * Re-read the certificate, key and CA and swap them into the running server (with the TLS minimum version, which
 * `setSecureContext` would otherwise reset). Throws EdgeTlsError (old context kept) when the pair does not load.
 */
export function reloadTlsContext(server: SecureContextTarget, tls: BoxTlsConfig, readFile: ReadFile = readFileBuffer): void {
    const material = readTlsMaterial(tls, readFile);
    if (!material.ok) throw new EdgeTlsError(material.problem);
    server.setSecureContext({ ...material.options });
}

export interface TlsWatchDeps {
    readonly watchFile: (file: string, opts: { interval: number; persistent: boolean }, listener: (curr: fs.Stats, prev: fs.Stats) => void) => { unref?: () => void } | void;
    readonly unwatchFile: (file: string, listener: (curr: fs.Stats, prev: fs.Stats) => void) => void;
    readonly readFile: ReadFile;
}

const nodeTlsWatchDeps: TlsWatchDeps = {
    watchFile: (file, opts, listener) => fs.watchFile(file, opts, listener),
    unwatchFile: (file, listener) => fs.unwatchFile(file, listener),
    readFile: readFileBuffer,
};

/**
 * Hot-reload the certificate (spec §3.4 "the certificate hot-reloads when its file changes"): poll both files every
 * `tls.reloadPollMs`; a change in mtime or size reloads the context. A failed reload is logged and the old
 * certificate stays. The watchers never keep the process alive. Returns a stop function.
 */
export function startTlsReloader(server: SecureContextTarget, tls: BoxTlsConfig, logger: Pick<Logger, 'log' | 'error'>, deps: TlsWatchDeps = nodeTlsWatchDeps): () => void {
    const files = [tls.certFile, tls.keyFile, ...(tls.caFile ? [tls.caFile] : [])];
    const listener = (curr: fs.Stats, prev: fs.Stats): void => {
        if (curr.mtimeMs === prev.mtimeMs && curr.size === prev.size) return;
        if (curr.size === 0) return; // mid-write or deleted: wait for the next change
        try {
            reloadTlsContext(server, tls, deps.readFile);
            logger.log('TLS certificate reloaded');
        } catch (err) {
            logger.error(`TLS certificate reload failed, keeping the current one: ${err instanceof Error ? err.message : String(err)}`);
        }
    };
    for (const file of files) {
        const watcher = deps.watchFile(file, { interval: tls.reloadPollMs, persistent: false }, listener) as { unref?: () => void } | undefined;
        watcher?.unref?.();
    }
    let stopped = false;
    return () => {
        if (stopped) return;
        stopped = true;
        for (const file of files) deps.unwatchFile(file, listener);
    };
}

export interface EdgeLanListenerDeps {
    /** The app's HTTP(S) server; with TLS it was created without a certificate (`buildHttpsOptions`). */
    readonly server: Partial<SecureContextTarget> & { close(): unknown };
    /** Null = plain HTTP (dev). */
    readonly tls: BoxTlsConfig | null;
    /** Bind the server (`app.listen(http.port, http.host)`). */
    readonly listen: () => Promise<unknown>;
    /** `http.host:port`, for the logs. */
    readonly address: string;
    readonly boot: EdgeBootRecorder;
    readonly bus: EdgeEventBus;
    readonly clock: EdgeClock;
    readonly logger: Pick<Logger, 'log' | 'warn' | 'error'>;
    readonly watch: TlsWatchDeps;
    readonly timers: LanTimers;
    /** Retry period while not bound, ms. */
    readonly retryMs: number;
    /**
     * Finish or discard a certificate install a crash interrupted (uplink/cert-install.ts `completeCertificateInstall`)
     * before the pair is read; runs on every check while the listener is not bound. Default: none.
     */
    readonly recoverCertificate?: (tls: BoxTlsConfig) => void;
}

const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));
const describeTlsProblem = (p: EdgeTlsProblem): string => `TLS ${p.reason}${p.file ? ` ${p.file}` : ''} (${p.message})`;

/**
 * The LAN HTTP(S) listener (spec §8.2, §8.3, §10 #1): binds only with a loadable certificate/key pair
 * (`readTlsMaterial`); never stops the box.
 * - Not bound (`waiting-certificate`: no loadable pair; `listen-failed`: the bind failed): the state is written to
 *   `EdgeBootStatus.lanListener()`, logged and alerted once per distinct problem (`source:'lan'`, P1,
 *   `CERTIFICATE_UNAVAILABLE` / `LISTEN_FAILED`), and `check()` runs again every `retryMs` and on
 *   `certificate-installed`. It never binds once the shutdown began (phase not `recording` / `started`).
 * - Bound: `listening`; the files are watched for hot reload (`startTlsReloader`), and `check()` reloads.
 * `check()` calls are serialized (one in flight; calls meanwhile coalesce into one more run) and never reject.
 * Alerts raised before `announce()` are held (the services that forward alerts subscribe in their start) and
 * published by it, unless the listener bound in between.
 */
export class EdgeLanListener {
    private mode: 'idle' | 'listening' | 'stopped' = 'idle';
    private timer: unknown = null;
    private stopWatch: (() => void) | null = null;
    private running: Promise<void> | null = null;
    private again = false;
    private announced = false;
    private held: EdgeAlert | null = null;
    private problemKey: string | null = null;

    constructor(private readonly d: EdgeLanListenerDeps) {}

    check(): Promise<void> {
        if (this.mode === 'stopped') return Promise.resolve();
        if (this.running) {
            this.again = true;
            return this.running;
        }
        const run = async (): Promise<void> => {
            do {
                this.again = false;
                try {
                    await this.checkOnce();
                } catch (err) {
                    this.d.logger.error(`LAN listener check failed: ${errorText(err)}`);
                }
            } while (this.again && this.mode !== 'stopped');
        };
        this.running = run().finally(() => {
            this.running = null;
        });
        return this.running;
    }

    /** Publish the alert held since boot (if the listener is still not bound); later alerts go out at once. */
    announce(): void {
        this.announced = true;
        const held = this.held;
        this.held = null;
        if (held && this.mode === 'idle') this.publish(held);
    }

    /** Stop retrying and watching (the server closed). Idempotent. */
    stop(): void {
        if (this.mode === 'stopped') return;
        this.mode = 'stopped';
        this.clearTimer();
        this.stopWatch?.();
        this.stopWatch = null;
        this.held = null;
    }

    private canBind(): boolean {
        const phase = this.d.boot.phase();
        return this.mode === 'idle' && (phase === 'recording' || phase === 'started');
    }

    private async checkOnce(): Promise<void> {
        if (this.mode === 'listening') return this.reload();
        if (!this.canBind()) return;
        const { tls, server } = this.d;
        if (tls) {
            if (this.d.recoverCertificate) {
                try {
                    this.d.recoverCertificate(tls);
                } catch (err) {
                    this.d.logger.error(`could not finish an interrupted certificate install: ${errorText(err)}`);
                }
            }
            const material = readTlsMaterial(tls, this.d.watch.readFile);
            if (!material.ok) return this.waitForCertificate(material.problem);
            if (!server.setSecureContext) throw new Error('the HTTP server cannot take a certificate');
            try {
                server.setSecureContext({ ...material.options });
            } catch (err) {
                return this.waitForCertificate({ reason: 'invalid', file: null, message: errorText(err) });
            }
        }
        try {
            await this.d.listen();
        } catch (err) {
            return this.bindFailed(err);
        }
        if ((this.mode as string) === 'stopped') {
            server.close(); // the server closed while it was binding
            return;
        }
        this.enterListening();
    }

    private waitForCertificate(problem: EdgeTlsProblem): void {
        const key = `certificate|${problem.reason}|${problem.file}|${problem.message}`;
        if (this.setProblem(key, { state: 'waiting-certificate', certificate: problem, error: null })) {
            const text =
                `the LAN HTTPS listener is not bound: ${describeTlsProblem(problem)}; the box keeps recording and binds ` +
                `as soon as a loadable certificate is installed (checked every ${this.d.retryMs} ms)`;
            this.d.logger.warn(text);
            this.alert('CERTIFICATE_UNAVAILABLE', text, { reason: problem.reason, file: problem.file, certFile: this.d.tls?.certFile ?? null, keyFile: this.d.tls?.keyFile ?? null });
        }
        this.ensureTimer();
    }

    private bindFailed(err: unknown): void {
        const code = (err as NodeJS.ErrnoException)?.code;
        const error = code ?? errorText(err);
        if (this.setProblem(`bind|${error}`, { state: 'listen-failed', certificate: null, error })) {
            const text = `the LAN listener could not bind ${this.d.address}: ${errorText(err)}; the box keeps recording and retries every ${this.d.retryMs} ms`;
            this.d.logger.error(text);
            this.alert('LISTEN_FAILED', text, { error, address: this.d.address });
        }
        this.ensureTimer();
    }

    /** Record a not-bound state; true when it differs from the last one (log and alert only then). */
    private setProblem(key: string, status: Pick<EdgeLanListenerStatus, 'state' | 'certificate' | 'error'>): boolean {
        if (key === this.problemKey) return false;
        this.problemKey = key;
        this.d.boot.setLanListener({ ...status, sinceMs: this.d.clock(), plainHttp: !this.d.tls });
        return true;
    }

    private enterListening(): void {
        const waited = this.problemKey !== null;
        this.mode = 'listening';
        this.clearTimer();
        this.held = null;
        this.problemKey = null;
        this.d.boot.setLanListener({ state: 'listening', sinceMs: this.d.clock(), plainHttp: !this.d.tls, certificate: null, error: null });
        if (this.d.tls) {
            this.stopWatch = startTlsReloader(this.d.server as SecureContextTarget, this.d.tls, this.d.logger, this.d.watch);
            this.d.logger.log(`LAN HTTPS listening on ${this.d.address}${waited ? ' (the earlier problem is resolved)' : ''}`);
        } else {
            this.d.logger.warn(`LAN serving plain HTTP on ${this.d.address}: dev mode only, never on a venue box`);
        }
    }

    private reload(): void {
        if (!this.d.tls) return;
        try {
            reloadTlsContext(this.d.server as SecureContextTarget, this.d.tls, this.d.watch.readFile);
            this.d.logger.log('TLS certificate reloaded');
        } catch (err) {
            this.d.logger.error(`TLS certificate reload failed, keeping the current one: ${errorText(err)}`);
        }
    }

    private alert(kind: string, message: string, data: Record<string, unknown>): void {
        const alert: EdgeAlert = { source: 'lan', tier: 'P1', critical: false, kind, message, atMs: this.d.clock(), nSesid: null, data };
        if (this.announced) this.publish(alert);
        else this.held = alert;
    }

    private publish(alert: EdgeAlert): void {
        try {
            this.d.bus.publish('alert', alert);
        } catch (err) {
            this.d.logger.error(`could not publish the ${alert.kind} alert: ${errorText(err)}`);
        }
    }

    private ensureTimer(): void {
        if (this.timer === null && this.mode === 'idle') this.timer = this.d.timers.setInterval(() => void this.check(), this.d.retryMs);
    }

    private clearTimer(): void {
        if (this.timer === null) return;
        this.d.timers.clearInterval(this.timer);
        this.timer = null;
    }
}

/** `fn` runs at most once. */
function once(fn: () => void): () => void {
    let done = false;
    return () => {
        if (done) return;
        done = true;
        fn();
    };
}

/**
 * After a failed `app.init()`: run the lifecycle shutdown (idempotent, never rejects: a no-op after a failed kernel
 * start, which already ran it), then Nest's close. Needed when an init hook threw after the kernel started: its
 * sockets would otherwise keep alive a box that serves nothing. Never throws.
 */
async function closeAfterFailedInit(app: INestApplication): Promise<void> {
    try {
        await app.get(EdgeLifecycle).beforeApplicationShutdown('boot-failure');
    } catch {
        /* no lifecycle to run: nothing was started */
    }
    await app.close().catch(() => undefined);
}

/**
 * Start the box: build the module graph, init (recording starts: kernel), the LAN listener's first attempt on
 * `http.host:port` (HTTPS unless dev + `tls: null`), then the services (uplink, ops, lan). Resolves the running app —
 * also when the listener is not bound yet (no certificate, port taken: `EdgeBootStatus.lanListener()`; it keeps
 * retrying, and the process stays alive meanwhile: `holdProcessOpen`).
 * Rejects (ports/boot.ts, the three fatal conditions):
 * - `BoxConfigError`: the config is structurally invalid (plain HTTP outside dev); nothing was built;
 * - `EdgeBootError` stage `module-graph`: a provider could not be built or initialised — in practice the state
 *   database (`cause` is an `EdgeStateUnavailableError`);
 * - `EdgeBootError` stage `recording`: `KernelPort.start()` rejected; everything was closed first.
 * The process hold is released before it rejects.
 */
export async function startServer(config: BoxConfig, opts: StartServerOptions = {}): Promise<INestApplication> {
    const logger = new Logger('rt-edge');
    const httpsOptions = buildHttpsOptions(config); // structural: before anything is built or held
    const release = once((opts.holdProcess ?? holdProcessOpen)());
    let app: INestApplication;
    try {
        app = await (opts.createApp ?? nestAppFactory)(AppModule.register({ config, mode: 'serve' }), {
            httpsOptions,
            ...(opts.logger === undefined ? {} : { logger: opts.logger }),
            abortOnError: false,
        });
    } catch (err) {
        release();
        throw err instanceof BoxConfigError ? err : new EdgeBootError('module-graph', err);
    }

    const tls = config.http.tls;
    const server = app.getHttpServer();
    server.once('close', release); // the shutdown closed the HTTP server (it emits `close` even if it never bound)
    const boot = app.get<EdgeBootRecorder>(EDGE_BOOT_STATUS);
    try {
        if (opts.shutdownHooks !== false) app.enableShutdownHooks();
        const express = app.getHttpAdapter().getInstance();
        if (express && typeof express.disable === 'function') express.disable('x-powered-by');
        // Before every route and the static files, so no HTTPS response leaves without it (spec §8.3).
        if (tls) {
            app.use((_req: unknown, res: { setHeader(name: string, value: string): void }, next: () => void) => {
                res.setHeader(EDGE_HSTS_HEADER, EDGE_HSTS_VALUE);
                next();
            });
        }
        app.use(cookieParser());
        useEdgeBodyParsers(app); // explicit limits, not Nest's 100 KB default (review 23)
        await app.init(); // EdgeLifecycle.onApplicationBootstrap: kernel.start (phase `failed` when it rejects)
    } catch (err) {
        const stage = boot.phase() === 'failed' ? 'recording' : 'module-graph';
        await closeAfterFailedInit(app);
        release(); // whether or not the server's `close` fired (it does not after a failed init of a bare context)
        throw new EdgeBootError(stage, err);
    }

    const bus = app.get<EdgeEventBus>(EDGE_EVENT_BUS);
    const listener = new EdgeLanListener({
        server,
        tls,
        listen: () => app.listen(config.http.port, config.http.host),
        address: `${config.http.host}:${config.http.port}`,
        boot,
        bus,
        clock: app.get<EdgeClock>(EDGE_CLOCK),
        logger,
        watch: opts.tlsWatch ?? nodeTlsWatchDeps,
        timers: opts.timers ?? nodeTimers,
        retryMs: opts.listenRetryMs ?? tls?.reloadPollMs ?? EDGE_LISTEN_RETRY_MS,
        recoverCertificate:
            opts.recoverCertificate ??
            (pair => {
                const outcome = completeCertificateInstall(pair);
                if (outcome === 'completed') logger.warn('finished a LAN certificate install that a crash interrupted');
                else if (outcome === 'discarded') logger.warn('discarded a LAN certificate install that a crash interrupted before it was complete');
            }),
    });
    const unsubscribe = bus.subscribe('certificate-installed', () => void listener.check());
    server.once('close', () => {
        unsubscribe();
        listener.stop();
    });

    await listener.check(); // binds now unless the certificate or the port is not available yet
    await app.get(EdgeLifecycle).startServices();
    listener.announce();
    return app;
}

const consoleOutput: CliOutput = {
    log: line => process.stdout.write(`${line}\n`),
    error: line => process.stderr.write(`${line}\n`),
};

export interface RunCliOptions {
    readonly logger?: EdgeLoggerOption;
    readonly out?: CliOutput;
    /** Default `NestFactory.createApplicationContext`. */
    readonly createContext?: EdgeContextFactory;
    /** Default `holdProcessOpen`: held for the length of the command (a command that only awaits unref'd timers must not end early). */
    readonly holdProcess?: EdgeProcessHold;
}

/**
 * Run one CLI command in a 'cli' application context (nothing is started: EdgeLifecycle, tokens.ts `EdgeRunMode`);
 * resolves the exit code. Never throws; always closes the context. A context that cannot be built (the state database
 * cannot be opened: `EdgeStateUnavailableError`) prints the reason and resolves EDGE_EXIT.software.
 */
export async function runCli(config: BoxConfig, command: EdgeCliCommand, opts: RunCliOptions = {}): Promise<number> {
    const out = opts.out ?? consoleOutput;
    const release = once((opts.holdProcess ?? holdProcessOpen)());
    let ctx: INestApplicationContext | null = null;
    try {
        ctx = await (opts.createContext ?? nestContextFactory)(AppModule.register({ config, mode: 'cli' }), {
            logger: opts.logger === undefined ? ['error', 'warn'] : opts.logger,
            abortOnError: false,
        });
        const cli = ctx.get<CliPort>(CLI_PORT);
        return await cli.run(command, out);
    } catch (err) {
        if (isNotImplemented(err)) {
            out.error(`rt-edge: "${command.name}" is not available in this build yet`);
            return EDGE_EXIT.software;
        }
        out.error(`rt-edge: ${command.name} failed: ${err instanceof Error ? err.message : String(err)}`);
        return EDGE_EXIT.software;
    } finally {
        if (ctx) await ctx.close().catch(() => undefined);
        release();
    }
}

export interface MainOptions extends StartServerOptions {
    readonly out?: CliOutput;
    readonly loadConfig?: (file: string) => BoxConfig;
    readonly createContext?: EdgeContextFactory;
}

/**
 * Parse argv, load the config, then serve (resolves the running app) or run a CLI command (resolves its exit
 * code). Config and usage problems resolve EDGE_EXIT.config / EDGE_EXIT.usage after printing the reason. A box that
 * cannot start rejects with `EdgeBootError` (the entry point logs it and exits EDGE_EXIT.software: `fatalExit`).
 */
export async function main(
    argv: readonly string[] = process.argv.slice(2),
    env: Readonly<Record<string, string | undefined>> = process.env,
    opts: MainOptions = {},
): Promise<INestApplication | number> {
    const out = opts.out ?? consoleOutput;
    let command: EdgeCommand;
    try {
        command = parseEdgeArgs(argv);
    } catch (err) {
        if (err instanceof EdgeUsageError) {
            out.error(`rt-edge: ${err.message}`);
            out.error(EDGE_USAGE);
            return EDGE_EXIT.usage;
        }
        throw err;
    }
    if (command.name === 'help') {
        out.log(EDGE_USAGE);
        return EDGE_EXIT.ok;
    }
    const configProblem = (err: unknown): number => {
        if (!(err instanceof BoxConfigError)) throw err;
        out.error(err.message);
        return EDGE_EXIT.config;
    };
    let config: BoxConfig;
    try {
        config = (opts.loadConfig ?? loadBoxConfig)(resolveConfigPath(argv, env));
    } catch (err) {
        return configProblem(err);
    }
    if (command.name !== 'serve') {
        return runCli(config, command, { logger: opts.logger, out, createContext: opts.createContext, holdProcess: opts.holdProcess });
    }
    try {
        return await startServer(config, opts);
    } catch (err) {
        return configProblem(err);
    }
}

/**
 * Log what `main()` rejected with and answer the exit code (EDGE_EXIT.software). A box that cannot start
 * (`EdgeBootError`) is logged as its own class, `fatal boot (<stage>): <why>`, with the cause's stack; anything else
 * as `fatal: <stack>`. No alert can be raised here: the bus is gone (or never existed), so the log line, the exit
 * code and the cloud's "box silent" alert (spec §12) are the signals.
 */
export function fatalExit(err: unknown, logger: Pick<Logger, 'error'> = new Logger('rt-edge')): number {
    if (err instanceof EdgeBootError) {
        const text = `fatal boot (${err.stage}): ${err.message}`;
        const stack = err.cause instanceof Error ? err.cause.stack : undefined;
        if (stack) logger.error(text, stack);
        else logger.error(text);
    } else {
        logger.error(`fatal: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    }
    return EDGE_EXIT.software;
}

// Run only as the entry point (specs import this file). Webpack (nest-cli `webpack: true`) maps `require.main` to
// the entry module's cache entry (CommonJsPlugin), so the check holds in the bundle as it does under plain node.
if (require.main === module) {
    // libuv's pool (default 4 threads) serves the journal's writes and fdatasyncs AND every getaddrinfo: a black-holed
    // resolver must not hold the journal back (review 28). The compose file sets it (docker/edge/docker-compose.yml);
    // this is the default for any other start, applied before the first asynchronous file or DNS call.
    if (!process.env.UV_THREADPOOL_SIZE) process.env.UV_THREADPOOL_SIZE = String(EDGE_UV_THREADPOOL_SIZE);
    main().then(
        result => {
            if (typeof result === 'number') process.exitCode = result;
        },
        err => {
            process.exitCode = fatalExit(err);
        },
    );
}
