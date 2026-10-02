/**
 * The box's internet: a loopback TCP proxy between the box and the cloud that can be severed and restored. Every
 * byte of the box→cloud path goes through it (the `/edge` socket, the HTTP challenge / enroll / archive calls and
 * the reachability probe of `cloud.pingUrl`), so cutting it is what a WAN outage looks like from the box.
 *
 * Cut modes:
 * - `reset` (default): every live connection is reset and new ones are reset on accept (ECONNRESET: the box's
 *   "internet unavailable" class, uplink/cloud-http.ts NO_INTERNET);
 * - `blackhole`: live connections are reset, new ones are accepted and never answered (connect / request timeouts).
 */
import * as net from 'net';

export type ProxyCutMode = 'reset' | 'blackhole';

export class TcpProxy {
    port = 0;
    accepted = 0;
    refusedWhileCut = 0;
    private server: net.Server | null = null;
    private mode: 'open' | ProxyCutMode = 'open';
    private readonly pairs = new Set<{ a: net.Socket; b: net.Socket | null }>();
    private readonly held = new Set<net.Socket>();

    constructor(private targetPort: number, private readonly targetHost = '127.0.0.1') {}

    get isCut(): boolean {
        return this.mode !== 'open';
    }

    setTarget(port: number): void {
        this.targetPort = port;
    }

    async start(): Promise<void> {
        this.server = net.createServer(a => this.onConnection(a));
        await new Promise<void>(resolve => this.server!.listen(0, '127.0.0.1', () => resolve()));
        this.port = (this.server.address() as net.AddressInfo).port;
    }

    /** Sever the link: live connections are reset; new ones per `mode`. */
    cut(mode: ProxyCutMode = 'reset'): void {
        this.mode = mode;
        for (const pair of [...this.pairs]) {
            reset(pair.a);
            if (pair.b) reset(pair.b);
        }
        this.pairs.clear();
    }

    /** The link is back: new connections are forwarded again (black-holed ones are dropped). */
    restore(): void {
        this.mode = 'open';
        for (const s of this.held) reset(s);
        this.held.clear();
    }

    async close(): Promise<void> {
        this.cut('reset');
        for (const s of this.held) reset(s);
        this.held.clear();
        const server = this.server;
        this.server = null;
        if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    }

    private onConnection(a: net.Socket): void {
        a.on('error', () => undefined);
        if (this.mode === 'reset') {
            this.refusedWhileCut += 1;
            reset(a);
            return;
        }
        if (this.mode === 'blackhole') {
            this.refusedWhileCut += 1;
            a.pause();
            this.held.add(a);
            a.once('close', () => this.held.delete(a));
            return;
        }
        this.accepted += 1;
        const pair: { a: net.Socket; b: net.Socket | null } = { a, b: null };
        this.pairs.add(pair);
        const b = net.connect({ port: this.targetPort, host: this.targetHost });
        pair.b = b;
        b.on('error', () => undefined);
        a.setNoDelay(true);
        b.setNoDelay(true);
        const done = (): void => {
            if (!this.pairs.has(pair)) return;
            this.pairs.delete(pair);
            a.destroy();
            b.destroy();
        };
        a.once('close', done);
        b.once('close', done);
        a.pipe(b);
        b.pipe(a);
    }
}

function reset(s: net.Socket): void {
    try {
        if (!s.destroyed) s.resetAndDestroy();
    } catch {
        s.destroy();
    }
}
