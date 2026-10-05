/**
 * The venue box under test: apps/rt-edge as it ships — a JSON box config on disk, `rt-edge enroll --code` through
 * main() (the CLI context), then `startServer` (main.ts) building the whole AppModule graph — on a temp data dir.
 *
 * In-process (InProcessBox) the suite reads the box's own ports (kernel, uplink, state) to compare digests. For a
 * hard kill the same server runs in a child process (ChildBox, box-child.ts) and is killed at process level; the
 * suite then restarts it in-process on the same data dir and inspects what the journal recovered.
 */
import { ChildProcess, spawn } from 'child_process';
import * as fs from 'fs';
import * as net from 'net';
import * as path from 'path';

import type { INestApplication } from '@nestjs/common';

import { EdgeKernel } from '../../src/kernel/edge-kernel';
import type { KernelOptions } from '../../src/kernel/kernel-options';
import { main, startServer } from '../../src/main';
import { EDGE_EVENT_BUS, EdgeEventBus, KERNEL_PORT, loadBoxConfig, STATE_PORT, StatePort, UPLINK_PORT, UplinkPort } from '../../src/ports';
import { waitFor } from './pacer';
import { e2eCreateApp } from './tuning';

const BACKEND_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

/** Free loopback ports (bound once and released), so a restarted box comes back on the same address. */
export async function freePorts(n: number): Promise<number[]> {
    const servers = await Promise.all(
        Array.from({ length: n }, () => new Promise<net.Server>(resolve => {
            const s = net.createServer();
            s.listen(0, '127.0.0.1', () => resolve(s));
        })),
    );
    const ports = servers.map(s => (s.address() as net.AddressInfo).port);
    await Promise.all(servers.map(s => new Promise<void>(resolve => s.close(() => resolve()))));
    return ports;
}

export interface BoxPorts {
    readonly http: number;
    readonly cat: number;
}

/** A dev-mode box config (plain HTTP on loopback, the CAT network = loopback) written as the box image would. */
export function writeBoxConfig(dir: string, cloudOrigin: string, ports: BoxPorts): string {
    const file = path.join(dir, 'rt-edge.json');
    fs.mkdirSync(path.join(dir, 'public'), { recursive: true });
    const config = {
        mode: 'dev',
        // The e2e drives operator / case-admin flows (Transmitter, Status): box settings open to case admins, not only
        // super-admins (the default since 2026-10-02, which refused scenario 2 with not_box_admin).
        box: { name: 'Court 3', label: 'VB-E2E', timeZone: 'Europe/London', roomWifiSsid: 'Court3-Transcript', settingsAccess: 'case-admin' },
        cloud: { origin: cloudOrigin },
        http: { host: '127.0.0.1', port: ports.http, tls: null },
        transmitter: { listenPort: ports.cat, bindAddress: '127.0.0.1', networkCidr: '127.0.0.0/8' },
        // Several e2e boxes run at once: no localhost console (it would want port 2601 in each).
        console: { port: 0 },
        paths: { dataDir: dir, publicDir: path.join(dir, 'public') },
        // Scenario 2 has the box dial the reporter: on here, off on a real box by default (2026-10-03).
        features: { transmitterDialMode: true },
        shutdownTimeoutMs: 5_000,
    };
    fs.writeFileSync(file, JSON.stringify(config, null, 2));
    return file;
}

/** `rt-edge --config <file> enroll --code <code>`; resolves the exit code and the fingerprint it printed. */
export async function enrollBox(configFile: string, code: string): Promise<{ exit: number; fingerprint: string | null }> {
    const lines: string[] = [];
    const out = { log: (l: string) => lines.push(l), error: (l: string) => lines.push(l) };
    const exit = await main(['--config', configFile, 'enroll', '--code', code], {}, { out, logger: false, holdProcess: () => () => undefined });
    const fpr = lines.map(l => /Key fingerprint: (\S+)/.exec(l)?.[1]).find(Boolean) ?? null;
    return { exit: typeof exit === 'number' ? exit : -1, fingerprint: fpr };
}

export class InProcessBox {
    private constructor(
        readonly app: INestApplication,
        readonly configFile: string,
    ) {}

    /** `startServer` on the config file (the same data dir and ports every time); `kernel` replaces the suite's kernel tuning. */
    static async start(configFile: string, opts: { readonly kernel?: KernelOptions } = {}): Promise<InProcessBox> {
        const config = loadBoxConfig(configFile);
        const app = await startServer(config, {
            logger: false,
            shutdownHooks: false,
            createApp: e2eCreateApp(opts.kernel),
            listenRetryMs: 100,
            holdProcess: () => () => undefined,
        });
        return new InProcessBox(app, configFile);
    }

    get kernel(): EdgeKernel {
        return this.app.get(KERNEL_PORT) as EdgeKernel;
    }
    get uplink(): UplinkPort {
        return this.app.get<UplinkPort>(UPLINK_PORT);
    }
    get state(): StatePort {
        return this.app.get<StatePort>(STATE_PORT);
    }
    get bus(): EdgeEventBus {
        return this.app.get<EdgeEventBus>(EDGE_EVENT_BUS);
    }
    get nEdgeid(): string | null {
        return this.state.identity.get()?.nEdgeid ?? null;
    }
    get httpPort(): number {
        return (this.app.getHttpServer().address() as net.AddressInfo | null)?.port ?? 0;
    }

    /** Graceful stop (SIGTERM path): lan → ops → uplink → kernel (journals flushed, final checkpoint) → state. */
    async stop(): Promise<void> {
        await this.app.close();
    }
}

/** The same server in a child process (ts-node, transpile only), for a process-level hard kill. */
export class ChildBox {
    ready = false;
    exited: { code: number | null; signal: string | null } | null = null;
    private stderrTail = '';

    private constructor(private readonly child: ChildProcess) {}

    static async start(configFile: string): Promise<ChildBox> {
        const fixture = path.join(__dirname, 'box-child.ts');
        const child = spawn(
            process.execPath,
            ['-r', path.join(BACKEND_ROOT, 'node_modules', 'ts-node', 'register', 'transpile-only.js'), '-r', path.join(BACKEND_ROOT, 'node_modules', 'tsconfig-paths', 'register.js'), fixture, configFile],
            { cwd: path.dirname(configFile), env: { ...process.env, TS_NODE_PROJECT: path.join(BACKEND_ROOT, 'tsconfig.json'), TS_NODE_TRANSPILE_ONLY: 'true' }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
        );
        const box = new ChildBox(child);
        child.stdout?.setEncoding('utf8').on('data', (chunk: string) => {
            if (chunk.includes('E2E_BOX_READY')) box.ready = true;
        });
        // Only the tail is kept, for a boot failure; the box never logs transcript text (its Nest logger is off).
        child.stderr?.setEncoding('utf8').on('data', (chunk: string) => (box.stderrTail = (box.stderrTail + chunk).slice(-2_000)));
        child.on('exit', (code, signal) => (box.exited = { code, signal }));
        await waitFor(() => box.ready || box.exited !== null, 180_000, 'the box child process to serve');
        if (!box.ready) throw new Error(`box child exited before serving (code ${box.exited?.code}): ${box.stderrTail}`);
        return box;
    }

    /** Process-level hard kill (TerminateProcess on Windows, SIGKILL elsewhere): no shutdown hook runs. */
    async kill(): Promise<void> {
        if (this.exited) return;
        this.child.kill('SIGKILL');
        await waitFor(() => this.exited !== null, 15_000, 'the box child to die');
    }
}
