/**
 * The dial-mode transmitter (Eclipse 12 output "Wait for connection", D34): tcp-server-main/tcp.js itself, run as a
 * child process (read-only, from its own folder) through tcp-preload.js (loopback port 0, compressed pace).
 *
 * tcp.js is an interactive CLI: once a client is connected, `s` streams commands.json from the start; at the first
 * refresh (`R`) it holds and asks on stderr, and `all` bypasses every later hold. This wrapper answers exactly that.
 * Its stdout echoes every chunk as a Buffer (hearing text in hex): it is read only for markers and never kept,
 * printed or attached to an error.
 */
import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';

import { TCP_SERVER_DIR, TCP_SERVER_SCRIPT } from './corpus';
import { waitFor } from './pacer';

const PRELOAD = path.join(__dirname, 'tcp-preload.js');

export class TcpServerChild {
    port = 0;
    httpPort = 0;
    /** "TCP Client connected" lines seen. */
    clientConnects = 0;
    /** "Sending chunk" lines seen (progress only; the line itself is dropped). */
    chunksSent = 0;
    /** Refresh holds answered with `all`. */
    holdsAnswered = 0;
    exited: { code: number | null; signal: string | null } | null = null;
    private feeding = false;

    private constructor(private readonly child: ChildProcess) {}

    /** Spawn tcp.js; `scale` compresses its 400 ms pace (200 → 2 ms per chunk). */
    static async start(scale: number): Promise<TcpServerChild> {
        const child = spawn(process.execPath, ['-r', PRELOAD, TCP_SERVER_SCRIPT], {
            cwd: TCP_SERVER_DIR,
            env: { ...process.env, E2E_TCP_TIME_SCALE: String(scale) },
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });
        const t = new TcpServerChild(child);
        t.watch();
        await waitFor(() => t.port > 0 || t.exited !== null, 30_000, 'tcp.js to listen');
        if (!t.port) throw new Error(`tcp.js exited before listening (code ${t.exited?.code})`);
        return t;
    }

    private watch(): void {
        const onLine = (line: string): void => {
            const m = /E2E_LISTEN (tcp|http) (\d+)/.exec(line);
            if (m) {
                if (m[1] === 'tcp') this.port = Number(m[2]);
                else this.httpPort = Number(m[2]);
                return;
            }
            if (line.includes('Sending chunk:')) {
                this.chunksSent += 1;
                return;
            }
            if (line.includes('TCP Client connected')) {
                this.clientConnects += 1;
                return;
            }
            if (line.includes('Found refresh command') && this.feeding) {
                this.holdsAnswered += 1;
                this.command('all');
            }
        };
        const lines = (stream: NodeJS.ReadableStream | null): void => {
            let rest = '';
            stream?.setEncoding?.('utf8');
            stream?.on('data', (chunk: string) => {
                rest += chunk;
                const parts = rest.split(/\r?\n/);
                rest = parts.pop() ?? '';
                for (const p of parts) onLine(p);
            });
        };
        lines(this.child.stdout);
        lines(this.child.stderr);
        this.child.on('exit', (code, signal) => {
            this.exited = { code, signal };
        });
    }

    command(text: string): void {
        if (this.exited || !this.child.stdin || this.child.stdin.destroyed) return;
        this.child.stdin.write(`${text}\n`);
    }

    /** Once a client (the box) is connected: `s` streams the whole file; refresh holds are answered `all`. */
    async startFeed(): Promise<void> {
        await waitFor(() => this.clientConnects > 0, 30_000, 'the box to dial tcp.js');
        this.feeding = true;
        this.command('s');
    }

    async kill(): Promise<void> {
        if (this.exited) return;
        this.child.kill();
        await waitFor(() => this.exited !== null, 10_000, 'tcp.js to exit').catch(() => undefined);
    }
}
