/**
 * SPEC HELPER (imported by *.spec.ts only): a real kernel on a temp data dir, its node:sqlite state, an in-memory
 * bus that records every event, loopback Eclipse clients and a synthetic Bridge feed. No cloud, no database server.
 */
import { randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { FEED_PARSE_VERSION } from '@app/feed-parse';

import { BoxConfig, BoxSessionAssignment, EdgeBusEventName, EdgeBusEvents, InMemoryEdgeEventBus, parseBoxConfig } from '../../ports';
import { SqliteEdgeState } from '../../state/sqlite-state';
import { EdgeKernel } from '../edge-kernel';
import { KernelOptions } from '../kernel-options';

export const STX = 0x02;
export const ETX = 0x03;
const cmd = (letter: string, data: number[] = []): Buffer => Buffer.from([STX, letter.charCodeAt(0), ...data, ETX]);

/** A Bridge feed of `count` lines starting at line `from` (N line number, T timecode, then the text). */
export function bridgeLines(from: number, count: number, text = 'Line'): Buffer {
    const parts: Buffer[] = [];
    for (let i = from; i < from + count; i++) {
        parts.push(cmd('N', [(i % 25) + 1]));
        parts.push(cmd('T', [9, Math.floor(i / 60) % 60, i % 60, 0]));
        parts.push(Buffer.from(`${text} ${i} text`, 'latin1'));
    }
    return Buffer.concat(parts);
}

export const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export async function waitFor(cond: () => boolean | Promise<boolean>, ms = 15_000, what = 'condition'): Promise<void> {
    const deadline = Date.now() + ms;
    while (!(await cond())) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
        await sleep(10);
    }
}

export interface EventLog {
    readonly bus: InMemoryEdgeEventBus;
    of<K extends EdgeBusEventName>(type: K): EdgeBusEvents[K][];
    clear(): void;
}

export function recordingBus(): EventLog {
    const bus = new InMemoryEdgeEventBus();
    const seen = new Map<string, unknown[]>();
    const types: EdgeBusEventName[] = [
        'session-status',
        'session-event',
        'session-armed',
        'transmitter-changed',
        'cloud-link-changed',
        'internet-changed',
        'assignments-changed',
        'access-revoked',
        'lan-viewers',
        'feed-stopped',
        'feed-resumed',
        'device-health',
        'certificate-installed',
        'alert',
    ];
    for (const t of types) bus.subscribe(t, (p: unknown) => (seen.get(t) ?? seen.set(t, []).get(t)!).push(p));
    return {
        bus,
        of: <K extends EdgeBusEventName>(type: K) => (seen.get(type) ?? []) as EdgeBusEvents[K][],
        clear: () => seen.clear(),
    };
}

export function edgeConfig(dataDir: string, extra: Record<string, unknown> = {}): BoxConfig {
    return parseBoxConfig(
        {
            mode: 'dev',
            box: { name: 'Court 3', label: 'VB-014', timeZone: 'Europe/London' },
            cloud: { origin: 'https://cloud.invalid' },
            http: { host: '127.0.0.1', port: 0, tls: null },
            transmitter: { bindAddress: '127.0.0.1', networkCidr: '127.0.0.0/8', listenPort: 0 },
            paths: { dataDir },
            shutdownTimeoutMs: 2_000,
            ...extra,
        },
        path.join(dataDir, 'rt-edge.json'),
    );
}

/** Fast timers for specs (the drain still idles a little so in-flight bytes land). */
export const FAST_KERNEL: KernelOptions = {
    boundaryMs: 20,
    tickMs: 50,
    checkpointEveryMs: 200,
    drain: { idleMs: 150, boundMs: 3_000, pollMs: 25 },
    dialReconnectMs: 100,
    dialConnectTimeoutMs: 1_000,
    listenRetryMs: 100,
    cloudReporterRecheckMs: 100,
    diskFreeMb: async () => 100_000,
};

export function scryptRoute(user: string, password: string, N = 1024): { user: string; salt: string; hash: string; scryptN: number } {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 32, { N, r: 8, p: 1 });
    return { user, salt: salt.toString('base64'), hash: hash.toString('base64'), scryptN: N };
}

export function sessionAssignment(nSesid: string, extra: Partial<BoxSessionAssignment> = {}): BoxSessionAssignment {
    return {
        nSesid,
        nCaseid: 'case-1',
        cName: `Day 3 — ${nSesid}`,
        dStartDt: '2026-10-01 10:00:00',
        tz: 'Europe/London',
        nLines: 25,
        protocol: null,
        epoch: 1,
        rebaseSeq: null,
        parserVer: FEED_PARSE_VERSION,
        fmt: 1,
        route: scryptRoute(`eclipse-${nSesid}`, `pw-${nSesid}`),
        hearingOperator: null,
        nPartNo: 1,
        nPrevPartSesid: null,
        next: null,
        cloudOp: 'upsert',
        deleted: false,
        reporter: null,
        ...extra,
    };
}

export interface Harness {
    readonly dir: string;
    readonly config: BoxConfig;
    readonly state: SqliteEdgeState;
    readonly events: EventLog;
    readonly kernel: EdgeKernel;
    readonly clock: () => number;
    /** Add a session as the uplink would (state + assignments-changed). */
    assign(a: BoxSessionAssignment): void;
    close(): Promise<void>;
}

export interface HarnessOptions {
    readonly dir?: string;
    readonly config?: Record<string, unknown>;
    readonly kernel?: KernelOptions;
    readonly clock?: () => number;
    readonly keepDir?: boolean;
}

export function harness(opts: HarnessOptions = {}): Harness {
    const dir = opts.dir ?? fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-kernel-'));
    const config = edgeConfig(dir, opts.config ?? {});
    const state = SqliteEdgeState.open({ file: config.paths.stateDb, timeZone: config.box.timeZone });
    const events = recordingBus();
    const clock = opts.clock ?? (() => Date.now());
    const kernel = new EdgeKernel(config, clock, events.bus, state, { ...FAST_KERNEL, ...(opts.kernel ?? {}) });
    let closed = false;
    return {
        dir,
        config,
        state,
        events,
        kernel,
        clock,
        assign(a) {
            const res = state.sessions.upsertAssignment(a, clock());
            events.bus.publish('assignments-changed', {
                atMs: clock(),
                full: false,
                sessionsAdded: res === 'added' ? [a.nSesid] : [],
                sessionsUpdated: res === 'updated' ? [a.nSesid] : [],
                sessionsEndRequested: [],
                sessionsUnlisted: [],
                sessionsPurged: [],
                casesAdded: [],
                casesRemoved: [],
                rosterChanged: false,
                operatorCodeChanged: false,
            });
        },
        async close() {
            if (closed) return;
            closed = true;
            await kernel.close().catch(() => undefined);
            await state.close().catch(() => undefined);
            if (!opts.keepDir) fs.rmSync(dir, { recursive: true, force: true });
        },
    };
}

export interface EclipseClient {
    readonly socket: net.Socket;
    send(data: Buffer | string): Promise<void>;
    end(): Promise<void>;
    closed: Promise<void>;
}

/** An Eclipse 12 "Connect to server" client: user\r\npass\r\n, then the CAT stream. */
export function eclipse(port: number, user: string, password: string, localAddress = '127.0.0.1'): Promise<EclipseClient> {
    return new Promise((resolve, reject) => {
        const socket = net.connect({ port, host: '127.0.0.1', localAddress });
        const closed = new Promise<void>(r => socket.once('close', () => r()));
        socket.on('error', () => undefined);
        socket.once('connect', () => {
            socket.setNoDelay(true);
            socket.write(`${user}\r\n${password}\r\n`, 'latin1');
            resolve({
                socket,
                closed,
                send: data => new Promise<void>(r => socket.write(data, () => r())),
                end: async () => {
                    socket.end();
                    socket.destroy();
                    await closed;
                },
            });
        });
        socket.once('error', reject);
    });
}

/** Copy a whole directory tree (a "power cut" snapshot of the box's disk). */
export function copyDir(from: string, to: string): void {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) {
        const src = path.join(from, name);
        const dst = path.join(to, name);
        if (fs.statSync(src).isDirectory()) copyDir(src, dst);
        else fs.copyFileSync(src, dst);
    }
}
