/**
 * The venue box (apps/rt-edge, spec §3.2): one Nest process — CAT ingest, local state, cloud uplink, LAN auth,
 * ops and the LAN HTTPS/socket surface.
 *
 * Module graph (arrows = imports; no cycles; the global core is visible everywhere):
 *
 *   EdgeCoreModule (global): BOX_CONFIG, EDGE_RUN_MODE, EDGE_CLOCK, EDGE_EVENT_BUS, EDGE_BOOT_STATUS
 *   StateModule  ← KernelModule ← UplinkModule ← AuthModule ← OpsModule ← LanModule
 *   CliModule → StateModule, KernelModule, UplinkModule
 *
 * Lifecycle (EdgeLifecycle; 'serve' mode only; rules in ports/boot.ts). Recording never depends on the cloud, the
 * certificate or the LAN port (spec §10 #1, MR-5):
 *   0. The graph itself is built: StateModule's factory opens and migrates the state database. A database that cannot
 *      be opened is fatal (`EdgeStateUnavailableError`; main.ts rejects with `EdgeBootError` stage `module-graph`).
 *   1. Nest bootstrap hook (`app.init()`), BEFORE the LAN listener's first attempt: kernel.start. Its rejection is
 *      fatal (`EdgeBootError` stage `recording`): everything is closed and the boot fails (exit 70; systemd restarts
 *      the box). Nothing after this step is fatal.
 *   2. main.ts's `EdgeLanListener` tries to bind; without a loadable certificate, or when the bind fails, it records
 *      the state in EDGE_BOOT_STATUS, alerts and retries — never fatal.
 *   3. `startServices()`, called by main.ts after that first attempt, bound or not: uplink.start → ops.start →
 *      lan.start. A step that rejects or overruns EDGE_START_STEP_BUDGET_MS is logged, alerted (`alert`
 *      START_FAILED) and recorded in EDGE_BOOT_STATUS; the next step still starts and the box keeps recording and
 *      serving.
 * Shutdown, every mode, each step bounded by `BoxConfig.shutdownTimeoutMs` and isolated from the others' failures:
 * lan.close → ops.close → uplink.close → kernel.close (journals flushed) → state.close. A service start in flight
 * finishes its current step (≤ the budget) first; no further step starts.
 */
import {
    BeforeApplicationShutdown,
    DynamicModule,
    Global,
    Inject,
    Injectable,
    Logger,
    Module,
    OnApplicationBootstrap,
} from '@nestjs/common';

import { AuthModule } from './auth/auth.module';
import { CliModule } from './cli/cli.module';
import { KernelModule } from './kernel/kernel.module';
import { ConsoleModule } from './console/console.module';
import { LanModule } from './lan/lan.module';
import { OpsModule } from './ops/ops.module';
import {
    BOX_CONFIG,
    BoxConfig,
    EDGE_BOOT_STATUS,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EDGE_RUN_MODE,
    EDGE_START_STEP_BUDGET_MS,
    EdgeBootRecorder,
    EdgeClock,
    EdgeEventBus,
    EdgeRunMode,
    EdgeServiceStep,
    EdgeStartFailure,
    InMemoryEdgeEventBus,
    KERNEL_PORT,
    KernelPort,
    LAN_PORT,
    LanPort,
    OPS_PORT,
    OpsPort,
    STATE_PORT,
    StatePort,
    UPLINK_PORT,
    UplinkPort,
} from './ports';
import { StateModule } from './state/state.module';
import { UplinkModule } from './uplink/uplink.module';

export interface AppModuleOptions {
    readonly config: BoxConfig;
    readonly mode: EdgeRunMode;
    /** Defaults to `Date.now`; specs pass a fake clock. */
    readonly clock?: EdgeClock;
    /** Budget of each service start (uplink, ops, lan). Default EDGE_START_STEP_BUDGET_MS; specs pass a short one. */
    readonly startStepBudgetMs?: number;
}

/** Local token of AppModule: the service-start budget in ms. */
export const EDGE_START_STEP_BUDGET = 'RT_EDGE_START_STEP_BUDGET';

@Global()
@Module({})
export class EdgeCoreModule {
    static register(opts: AppModuleOptions): DynamicModule {
        const busLogger = new Logger('EdgeEventBus');
        const clock: EdgeClock = opts.clock ?? (() => Date.now());
        return {
            module: EdgeCoreModule,
            global: true,
            providers: [
                { provide: BOX_CONFIG, useValue: opts.config },
                { provide: EDGE_RUN_MODE, useValue: opts.mode },
                { provide: EDGE_CLOCK, useValue: clock },
                {
                    provide: EDGE_EVENT_BUS,
                    useFactory: () =>
                        new InMemoryEdgeEventBus((type, err) =>
                            busLogger.error(`a '${type}' listener threw: ${err instanceof Error ? err.stack ?? err.message : String(err)}`),
                        ),
                },
                { provide: EDGE_BOOT_STATUS, useFactory: () => new EdgeBootRecorder() },
            ],
            exports: [BOX_CONFIG, EDGE_RUN_MODE, EDGE_CLOCK, EDGE_EVENT_BUS, EDGE_BOOT_STATUS],
        };
    }
}

type LifecycleStep<N extends string> = readonly [name: N, run: () => Promise<void>];

const describeError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

@Injectable()
export class EdgeLifecycle implements OnApplicationBootstrap, BeforeApplicationShutdown {
    private readonly logger = new Logger('EdgeLifecycle');
    private closing: Promise<void> | null = null;
    private services: Promise<void> | null = null;

    constructor(
        @Inject(EDGE_RUN_MODE) private readonly mode: EdgeRunMode,
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        @Inject(EDGE_BOOT_STATUS) private readonly boot: EdgeBootRecorder,
        @Inject(EDGE_START_STEP_BUDGET) private readonly startBudgetMs: number,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(OPS_PORT) private readonly ops: OpsPort,
        @Inject(LAN_PORT) private readonly lan: LanPort,
    ) {}

    /**
     * Boot step 1 (before the LAN listener's first attempt): start recording. A rejected `kernel.start()` closes everything
     * and re-throws (Nest's `close()` would not run the shutdown hooks after a failed init of an application context,
     * so a half-started kernel would otherwise keep its sockets).
     */
    async onApplicationBootstrap(): Promise<void> {
        if (this.mode !== 'serve') return;
        try {
            await this.kernel.start();
        } catch (err) {
            this.boot.setPhase('failed', this.clock());
            this.logger.error(`recording could not start, closing the box: ${describeError(err)}`);
            await this.beforeApplicationShutdown('boot-failure');
            throw err;
        }
        this.boot.setPhase('recording', this.clock());
    }

    /**
     * Boot step 3, called by main.ts after the LAN listener's first attempt (bound or not): uplink → ops → lan, each
     * bounded by the start budget. Never rejects; idempotent (concurrent calls share one run); a no-op in 'cli' mode,
     * after a failed kernel start and once the shutdown began.
     */
    startServices(): Promise<void> {
        if (this.mode !== 'serve') return Promise.resolve();
        if (!this.services) this.services = this.runServices();
        return this.services;
    }

    beforeApplicationShutdown(signal?: string): Promise<void> {
        if (!this.closing) this.closing = this.shutdown(signal);
        return this.closing;
    }

    private async runServices(): Promise<void> {
        if (this.closing || this.boot.phase() !== 'recording') {
            this.logger.warn(`services not started: the box is ${this.closing ? 'shutting down' : this.boot.phase()}`);
            return;
        }
        const steps: ReadonlyArray<LifecycleStep<EdgeServiceStep>> = [
            ['uplink', () => this.uplink.start()],
            ['ops', () => this.ops.start()],
            ['lan', () => this.lan.start()],
        ];
        for (const step of steps) {
            if (this.closing) return;
            await this.startBounded(step);
        }
        if (this.closing) return;
        this.boot.setPhase('started', this.clock());
        const failed = this.boot.startFailures().length;
        this.logger.log(
            `box "${this.config.box.name}" started (${this.config.mode}, release ${this.config.release.version})` +
                (failed ? `; ${failed} service start(s) failed, recording continues` : ''),
        );
    }

    /** One service start: never throws, never waits longer than the budget (the start itself keeps running). */
    private async startBounded([step, start]: LifecycleStep<EdgeServiceStep>): Promise<void> {
        let timer: NodeJS.Timeout | undefined;
        const run: Promise<{ readonly ok: boolean; readonly err: unknown }> = Promise.resolve()
            .then(start)
            .then(
                () => ({ ok: true, err: null }),
                (err: unknown) => ({ ok: false, err }),
            );
        const outcome = await Promise.race([
            run,
            new Promise<'timeout'>(resolve => {
                timer = setTimeout(() => resolve('timeout'), this.startBudgetMs);
            }),
        ]);
        if (timer) clearTimeout(timer);
        if (outcome === 'timeout') {
            this.fail(step, 'timeout', `${step}.start() did not resolve within ${this.startBudgetMs} ms`);
            void run.then(late => {
                if (late.ok) {
                    this.boot.stepStarted(step);
                    this.logger.warn(`${step} started late`);
                } else {
                    this.fail(step, 'rejected', describeError(late.err));
                }
            });
            return;
        }
        if (outcome.ok) this.boot.stepStarted(step);
        else this.fail(step, 'rejected', describeError(outcome.err));
    }

    private fail(step: EdgeServiceStep, reason: EdgeStartFailure['reason'], message: string): void {
        const atMs = this.clock();
        this.boot.recordFailure({ step, reason, message, atMs });
        const text = `${step} failed to start (${reason}): ${message}; the box keeps recording`;
        this.logger.error(text);
        try {
            this.bus.publish('alert', { source: step, tier: 'P1', critical: false, kind: 'START_FAILED', message: text, atMs, nSesid: null, data: { step, reason } });
        } catch (err) {
            this.logger.error(`could not publish the START_FAILED alert: ${describeError(err)}`);
        }
    }

    private async shutdown(signal?: string): Promise<void> {
        const failedBoot = this.boot.phase() === 'failed';
        if (!failedBoot) this.boot.setPhase('stopping', this.clock());
        this.logger.log(`shutting down${signal ? ` on ${signal}` : ''}`);
        // A service start in flight ends after its current step (runServices checks `closing`; each step is bounded).
        if (this.services) await this.services;
        const steps: ReadonlyArray<LifecycleStep<string>> = [
            ['lan', () => this.lan.close()],
            ['ops', () => this.ops.close()],
            ['uplink', () => this.uplink.close()],
            ['kernel', () => this.kernel.close()],
            ['state', () => this.state.close()],
        ];
        for (const step of steps) await this.closeBounded(step);
        if (!failedBoot) this.boot.setPhase('stopped', this.clock());
    }

    /** One shutdown step: never throws, never waits longer than `shutdownTimeoutMs`. */
    private async closeBounded([name, close]: LifecycleStep<string>): Promise<void> {
        const limit = this.config.shutdownTimeoutMs;
        let timer: NodeJS.Timeout | undefined;
        try {
            const outcome = await Promise.race([
                Promise.resolve()
                    .then(close)
                    .then(() => 'closed' as const),
                new Promise<'timeout'>(resolve => {
                    timer = setTimeout(() => resolve('timeout'), limit);
                }),
            ]);
            if (outcome === 'timeout') this.logger.error(`${name} did not close within ${limit} ms; continuing the shutdown`);
        } catch (err) {
            this.logger.error(`${name} failed to close: ${describeError(err)}`);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
}

@Module({})
export class AppModule {
    /** The whole box for one run mode. `main.ts` passes the loaded config; specs pass a parsed one. */
    static register(opts: AppModuleOptions): DynamicModule {
        const budget = opts.startStepBudgetMs ?? EDGE_START_STEP_BUDGET_MS;
        if (!Number.isInteger(budget) || budget < 1) throw new RangeError('rt-edge: startStepBudgetMs must be a positive integer');
        return {
            module: AppModule,
            imports: [
                EdgeCoreModule.register(opts),
                StateModule,
                KernelModule,
                UplinkModule,
                AuthModule,
                OpsModule,
                LanModule,
                ConsoleModule,
                CliModule,
            ],
            providers: [{ provide: EDGE_START_STEP_BUDGET, useValue: budget }, EdgeLifecycle],
            exports: [EdgeLifecycle],
        };
    }
}
