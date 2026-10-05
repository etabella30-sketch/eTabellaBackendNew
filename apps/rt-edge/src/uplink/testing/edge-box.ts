/**
 * SPEC HELPER (imported by *.spec.ts only): a whole recording box on a temp data dir — node:sqlite state, the real
 * kernel (CAT listener on 127.0.0.1:0) and the real uplink, wired on one recording bus exactly as the Nest graph
 * wires them — pointed at a FakeCloud origin. No database server, no real cloud.
 */
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { CanonicalPage } from '@app/edge-sync';

import type { BoxConfig, ServerTime } from '../../ports';
import { SqliteEdgeState } from '../../state/sqlite-state';
import { attachServerTime } from '../../state/state.module';
import { EdgeKernel } from '../../kernel/edge-kernel';
import { KernelOptions } from '../../kernel/kernel-options';
import { edgeConfig, EventLog, FAST_KERNEL, recordingBus, waitFor } from '../../kernel/testing/kernel-harness';
import { EdgeUplink } from '../edge-uplink';
import { UplinkOptions } from '../uplink-options';
import { FakeCloud } from './fake-cloud';

/** Fast, deterministic uplink timers for specs. */
export const FAST_UPLINK: UplinkOptions = {
    backoffBaseMs: 20,
    backoffMaxMs: 150,
    stableResetMs: 1_000,
    ackTimeoutMs: 4_000,
    connectTimeoutMs: 4_000,
    statusIntervalMs: 150,
    rehelloEveryMs: 60_000,
    probeOfflineEveryMs: 400,
    probeOnlineEveryMs: 1_000,
    tickMs: 25,
    heldShrinkRehelloMs: 300,
    sealRetryMs: 150,
    operatorScryptN: 1024,
    internetOfflineAfterMs: 150,
    internetOnlineAfterMs: 50,
    certCheckEveryMs: 3_600_000,
    captureRetryMs: 150,
    syncNowTimeoutMs: 3_000,
    random: () => 0.5,
};

export interface EdgeBox {
    readonly dir: string;
    readonly config: BoxConfig;
    readonly state: SqliteEdgeState;
    readonly events: EventLog;
    readonly kernel: EdgeKernel;
    readonly uplink: EdgeUplink;
    /** kernel.start() then uplink.start() (the lifecycle order, ports/boot.ts). */
    start(): Promise<void>;
    /** uplink → kernel → state (the lifecycle's close order); removes the dir unless kept. */
    close(opts?: { keepDir?: boolean }): Promise<void>;
}

export interface EdgeBoxOptions {
    readonly dir?: string;
    readonly cloudOrigin: string;
    readonly config?: Record<string, unknown>;
    readonly kernel?: KernelOptions;
    readonly uplink?: UplinkOptions;
    readonly mode?: 'serve' | 'cli';
    readonly clock?: () => number;
    /**
     * etabella.net time as the Nest graph wires it (app.module.ts, user decision 2026-10-05): the kernel and the uplink
     * read `serverTime.now()` (unless `clock` is given), the uplink measures on `serverTime.raw()` and feeds it every
     * hello, and the correction is saved in this box's state.
     */
    readonly serverTime?: ServerTime;
}

export function edgeBox(opts: EdgeBoxOptions): EdgeBox {
    const dir = opts.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-box-'));
    const config = edgeConfig(dir, { cloud: { origin: opts.cloudOrigin }, ...(opts.config ?? {}) });
    const state = SqliteEdgeState.open({ file: config.paths.stateDb, timeZone: config.box.timeZone });
    const serverTime = opts.serverTime ?? null;
    if (serverTime) attachServerTime(serverTime, state);
    const events = recordingBus();
    const clock = opts.clock ?? (serverTime ? () => serverTime.now() : () => Date.now());
    const kernel = new EdgeKernel(config, clock, events.bus, state, { ...FAST_KERNEL, ...(opts.kernel ?? {}) });
    const uplink = new EdgeUplink(config, clock, events.bus, opts.mode ?? 'serve', state, kernel, { ...FAST_UPLINK, ...(opts.uplink ?? {}) }, serverTime);
    let closed = false;
    return {
        dir,
        config,
        state,
        events,
        kernel,
        uplink,
        async start() {
            await kernel.start();
            await uplink.start();
        },
        async close(o = {}) {
            if (closed) return;
            closed = true;
            await uplink.close().catch(() => undefined);
            await kernel.close().catch(() => undefined);
            await state.close().catch(() => undefined);
            if (!o.keepDir) fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
        },
    };
}

/** A box enrolled with `cloud` (one-time code, auto-confirmed unless said otherwise), then started. */
export async function enrolledBox(cloud: FakeCloud, opts: Partial<EdgeBoxOptions> & { autoConfirm?: boolean; start?: boolean } = {}): Promise<EdgeBox> {
    const box = edgeBox({ cloudOrigin: cloud.origin, ...opts });
    if (!box.state.identity.get()) {
        const code = randomBytes(12).toString('hex');
        cloud.addEnrollCode(code, { autoConfirm: opts.autoConfirm ?? true });
        await box.uplink.enrol({ code });
    }
    if (opts.start !== false) await box.start();
    return box;
}

/** Box and cloud hold the same transcript, the same root and the same raw chain head, and nothing is in flight. */
export function converged(box: EdgeBox, cloud: FakeCloud, nSesid: string): boolean {
    const view = box.kernel.view(nSesid);
    const head = box.kernel.rawHead(nSesid);
    if (!view || !head || head.durableSeq !== head.headSeq) return false;
    const meta = cloud.session(nSesid).meta;
    const raw = cloud.rawHead(nSesid);
    return meta.root === view.root && meta.totalLines === view.totalLines && raw.seq === head.headSeq && raw.hash === head.headHash;
}

/** `waitFor(converged)`, but a timeout reports where box and cloud stand. */
export async function waitConverged(box: EdgeBox, cloud: FakeCloud, nSesid: string, what: string, extra: () => boolean = () => true, ms = 30_000): Promise<void> {
    try {
        await waitFor(() => converged(box, cloud, nSesid) && extra(), ms, what);
    } catch (err) {
        const s = cloud.sessions.get(nSesid);
        const view = box.kernel.view(nSesid);
        const dump = {
            box: { status: box.uplink.status(), link: box.uplink.cloudLink(), sync: box.uplink.session(nSesid), view: view && { rev: view.rev, totalLines: view.totalLines, root: view.root }, raw: box.kernel.rawHead(nSesid), identity: box.state.identity.get(), alerts: box.events.of('alert').filter(a => a.source === 'uplink').map(a => `${a.kind}: ${a.message}`) },
            cloud: { running: cloud.running, connected: cloud.boxConnected, meta: s && { appliedRev: s.meta.appliedRev, appliedRawSeq: s.meta.appliedRawSeq, totalLines: s.meta.totalLines, root: s.meta.root, frozen: s.meta.frozen }, raw: s && cloud.rawHead(nSesid), connects: cloud.log.connects.length, refused: cloud.log.refusedConnects, lastHello: cloud.log.helloReplies[cloud.log.helloReplies.length - 1], lastRoundReplies: cloud.log.roundReplies.slice(-3) },
        };
        throw new Error(`${(err as Error).message}\n${JSON.stringify(dump, null, 1)}`);
    }
}

const textOf = (line: readonly unknown[]): string => (Array.isArray(line[1]) ? String.fromCharCode(...(line[1] as number[])) : '');

/** The numbers of the kernel harness's "Line <n> text" lines, in transcript order. */
export function lineNumbers(pages: readonly CanonicalPage[]): number[] {
    const out: number[] = [];
    for (const page of pages)
        for (const line of page) {
            const m = /Line (\d+) text/.exec(textOf(line));
            if (m) out.push(Number(m[1]));
        }
    return out;
}

export const range = (from: number, to: number): number[] => Array.from({ length: to - from }, (_, i) => from + i);
