/**
 * How the suite builds the REAL box app (apps/rt-edge AppModule, every feature module) for `startServer`'s
 * `createApp` seam, in-process or in a child process (box-child.ts):
 *
 * - the kernel and uplink tunables through their documented optional DI seams (KERNEL_OPTIONS, UPLINK_OPTIONS),
 *   provided by a global module: production values where the scenario does not care, short timers where it does
 *   (end drain idle, uplink backoff, the offline / online hysteresis, ack timeout) so the file runs in minutes;
 * - OPS_HOST replaced by LoopbackOpsHost: the box's readiness and network checks would otherwise resolve
 *   one.one.one.one / dns.google and run `chronyc`. The suite touches nothing beyond loopback and never steps a clock.
 *
 * Nothing else is replaced: the module graph, the lifecycle (kernel → LAN listener → uplink → ops → lan), the LAN
 * HTTP routes and socket gateway, node:sqlite state and the journals on disk are the box's own.
 */
import { DynamicModule, Global, INestApplication, Module, NestApplicationOptions } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JournalFs, nodeJournalFs } from '@app/rt-ingest';

import { KERNEL_OPTIONS, KernelOptions } from '../../src/kernel/kernel-options';
import { OPS_HOST, NodeOpsHost, OpsClockReading, OpsDnsProbe, OpsHttpsProbe } from '../../src/ops/ops-host';
import { UPLINK_OPTIONS, UplinkOptions } from '../../src/uplink/uplink-options';

/** Kernel: production boundary (50 ms) and checkpoints; a short end drain so "End" seals in seconds, not minutes. */
export const E2E_KERNEL: KernelOptions = Object.freeze({
    boundaryMs: 50,
    tickMs: 100,
    checkpointEveryMs: 1_000,
    auditEveryMs: 5_000,
    drain: Object.freeze({ idleMs: 400, boundMs: 10_000, pollMs: 25 }),
    dialReconnectMs: 200,
    dialConnectTimeoutMs: 2_000,
    listenRetryMs: 100,
    // statfs on the CI disk says nothing about a box: arming checks a free-space floor (EDGE_DISK_ARM_MIN_MB).
    diskFreeMb: async () => 100_000,
});

/**
 * The box's journal file system (KernelOptions.journalFs seam) with every segment READ held until `release()`: the
 * restarted box serves its LAN at once while its journal replay waits in `SessionWorker.open`, so a room device is
 * deterministically served DURING the replay. Writes, listings and everything else pass straight through.
 */
export function heldJournalFs(): { readonly fs: JournalFs; release: () => void; readonly heldReads: () => number } {
    let open = false;
    let held = 0;
    const waiters: Array<() => void> = [];
    const fs: JournalFs = {
        ...nodeJournalFs,
        async readFile(file) {
            if (!open) {
                held += 1;
                await new Promise<void>(resolve => waiters.push(resolve));
            }
            return nodeJournalFs.readFile(file);
        },
    };
    return {
        fs,
        release: () => {
            open = true;
            for (const resolve of waiters.splice(0)) resolve();
        },
        heldReads: () => held,
    };
}

/** Uplink: fast backoff and hysteresis (production: 1→30 s backoff, offline after 15 s, online after 10 s). */
export const E2E_UPLINK: UplinkOptions = Object.freeze({
    backoffBaseMs: 50,
    backoffMaxMs: 400,
    stableResetMs: 2_000,
    ackTimeoutMs: 5_000,
    connectTimeoutMs: 4_000,
    statusIntervalMs: 500,
    rehelloEveryMs: 60_000,
    probeOfflineEveryMs: 300,
    probeOnlineEveryMs: 1_000,
    tickMs: 25,
    heldShrinkRehelloMs: 1_000,
    sealRetryMs: 300,
    operatorScryptN: 1024,
    internetOfflineAfterMs: 500,
    internetOnlineAfterMs: 300,
    certCheckEveryMs: 3_600_000,
    captureRetryMs: 1_000,
    syncNowTimeoutMs: 3_000,
});

/** The OS-facing ops probes, loopback only (see the file header). Disk and file reads stay real. */
export class LoopbackOpsHost extends NodeOpsHost {
    constructor() {
        super('/nonexistent/e2e-host-status');
    }

    async chrony(): Promise<OpsClockReading | null> {
        return null;
    }

    async upsOnBattery(): Promise<boolean | null> {
        return null;
    }

    async resolve(_host: string, _timeoutMs: number): Promise<OpsDnsProbe> {
        return { ok: true, ms: 1, resolver: '127.0.0.1', error: null };
    }

    async httpsProbe(_url: string, _timeoutMs: number): Promise<OpsHttpsProbe> {
        return { ok: false, status: null, ms: null, serverDateMs: null, sentAtMs: Date.now(), receivedAtMs: null, error: 'e2e-no-probe' };
    }

    async stepClock(_targetMs: number): Promise<boolean> {
        return false;
    }
}

@Global()
@Module({})
class E2eBoxTuningModule {
    static register(kernel: KernelOptions, uplink: UplinkOptions): DynamicModule {
        return {
            module: E2eBoxTuningModule,
            global: true,
            providers: [
                { provide: KERNEL_OPTIONS, useValue: kernel },
                { provide: UPLINK_OPTIONS, useValue: uplink },
            ],
            exports: [KERNEL_OPTIONS, UPLINK_OPTIONS],
        };
    }
}

const silent = { log: () => undefined, error: () => undefined, warn: () => undefined, debug: () => undefined, verbose: () => undefined };

/** `startServer`'s `createApp`: the registered AppModule plus the tuning above. */
export function e2eCreateApp(kernel: KernelOptions = E2E_KERNEL, uplink: UplinkOptions = E2E_UPLINK) {
    return async (module: DynamicModule, options: NestApplicationOptions): Promise<INestApplication> => {
        const ref = await Test.createTestingModule({ imports: [module, E2eBoxTuningModule.register(kernel, uplink)] })
            .overrideProvider(OPS_HOST)
            .useValue(new LoopbackOpsHost())
            .setLogger(silent)
            .compile();
        return ref.createNestApplication(options);
    };
}
