/**
 * The transmitter in LISTEN mode (Eclipse 12 output "Connect to server", D34): it connects to the box's CAT port,
 * logs in with the session's Eclipse credentials (`user\r\npass\r\n`) and streams the capture.
 *
 * tcp-server-main/tcp.js can only WAIT for a connection (it is the dial-mode stand-in, see tcp-server-child.ts), so
 * listen mode replays the same entries with tcp.js's chunking: one socket write per corpus entry, Nagle off, paced.
 * tcp.js waits 400 ms between writes; the suite compresses that (`msPerEntry`), optionally slower for the first entries
 * so the room can be seen receiving lines as they are typed.
 *
 * Like Eclipse it reconnects when the box goes away (every `reconnectMs`), logs in again and carries on with the entry
 * it had not written yet. It never resends an entry whose write completed: bytes the box acknowledged at TCP level but
 * did not journal before a hard kill are lost (spec D25), exactly as with a real transmitter that does not resend.
 */
import * as net from 'net';

import { nowMs, sleep, waitUntil } from './pacer';

export interface EclipseSenderOptions {
    readonly port: number;
    readonly user: string;
    readonly password: string;
    readonly entries: readonly Buffer[];
    /** Pace between writes (tcp.js: 400 ms; compressed here). */
    readonly msPerEntry: number;
    /** The first `until` entries go at this slower pace (the room sees lines grow). */
    readonly slow?: { readonly until: number; readonly msPerEntry: number };
    /** First entry to send (a stream that starts mid-page). Default 0. */
    readonly startAt?: number;
    readonly reconnectMs?: number;
    readonly host?: string;
}

export class EclipseSender {
    /** Index of the next entry to write. */
    next: number;
    bytesWritten = 0;
    connects = 0;
    /** Bytes written on each connection, in order. */
    readonly bytesPerConnection: number[] = [];
    /** The first entry index written on each connection. */
    readonly firstEntryPerConnection: number[] = [];
    done = false;

    private socket: net.Socket | null = null;
    private stopped = false;
    private pauseIndex: number | null = null;
    private paused = false;
    private resumeFn: (() => void) | null = null;
    private pauseWaiters: Array<() => void> = [];
    private readonly hooks: Array<(next: number) => void> = [];
    private run: Promise<void> | null = null;

    constructor(private readonly o: EclipseSenderOptions) {
        this.next = o.startAt ?? 0;
    }

    get isPaused(): boolean {
        return this.paused;
    }

    get connected(): boolean {
        return !!this.socket && !this.socket.destroyed;
    }

    /** Called after every completed write with the new `next`. */
    onProgress(fn: (next: number) => void): void {
        this.hooks.push(fn);
    }

    start(): this {
        if (!this.run) this.run = this.loop();
        return this;
    }

    /** Stop before writing entry `index`; resolves once paused there (or when the stream finished first). */
    pauseAt(index: number): Promise<void> {
        this.pauseIndex = index;
        if (this.done || (this.paused && this.next >= index)) return Promise.resolve();
        return new Promise(resolve => this.pauseWaiters.push(resolve));
    }

    resume(): void {
        this.pauseIndex = null;
        const fn = this.resumeFn;
        this.resumeFn = null;
        fn?.();
    }

    /** Resume and stop again before entry `index`; resolves once paused there (or finished). */
    resumeUntil(index: number): Promise<void> {
        this.pauseIndex = index;
        const waiter = this.done ? Promise.resolve() : new Promise<void>(resolve => this.pauseWaiters.push(resolve));
        const fn = this.resumeFn;
        this.resumeFn = null;
        fn?.();
        return waiter;
    }

    /** Resolves when every entry was written. */
    async finished(): Promise<void> {
        await this.run;
    }

    /** The bytes of the entries written so far (from `startAt`). */
    sentBytes(): Buffer {
        return Buffer.concat(this.o.entries.slice(this.o.startAt ?? 0, this.next));
    }

    async stop(): Promise<void> {
        this.stopped = true;
        this.resume();
        this.flushWaiters();
        const s = this.socket;
        this.socket = null;
        if (s) {
            s.removeAllListeners('close');
            s.destroy();
        }
        await this.run?.catch(() => undefined);
    }

    /** Drop the connection as a transmitter whose cable is pulled would (the loop reconnects). */
    dropConnection(): void {
        this.socket?.destroy();
    }

    private flushWaiters(): void {
        for (const w of this.pauseWaiters.splice(0)) w();
    }

    private async loop(): Promise<void> {
        let last = nowMs();
        while (!this.stopped && this.next < this.o.entries.length) {
            if (this.pauseIndex !== null && this.next >= this.pauseIndex) {
                this.paused = true;
                this.flushWaiters();
                await new Promise<void>(resolve => (this.resumeFn = resolve));
                this.paused = false;
                last = nowMs();
                continue;
            }
            if (!this.connected) {
                if (!(await this.connect())) {
                    await sleep(this.o.reconnectMs ?? 100);
                    continue;
                }
                last = nowMs();
            }
            const buf = this.o.entries[this.next];
            if (!(await this.write(buf))) {
                this.socket?.destroy();
                this.socket = null;
                continue; // never left this process: written again on the next connection
            }
            this.next += 1;
            this.bytesWritten += buf.length;
            this.bytesPerConnection[this.bytesPerConnection.length - 1] += buf.length;
            for (const h of this.hooks) h(this.next);
            const pace = this.o.slow && this.next < this.o.slow.until ? this.o.slow.msPerEntry : this.o.msPerEntry;
            last += pace;
            if (nowMs() - last > 250) last = nowMs(); // a stall (GC, a busy box) does not turn into a burst
            await waitUntil(last);
        }
        this.done = true;
        this.flushWaiters();
    }

    private connect(): Promise<boolean> {
        return new Promise(resolve => {
            const s = net.connect({ port: this.o.port, host: this.o.host ?? '127.0.0.1' });
            const fail = (): void => {
                s.destroy();
                resolve(false);
            };
            s.once('error', fail);
            s.once('connect', () => {
                s.removeListener('error', fail);
                s.setNoDelay(true);
                s.on('error', () => undefined);
                s.on('close', () => {
                    if (this.socket === s) this.socket = null;
                });
                s.write(`${this.o.user}\r\n${this.o.password}\r\n`, 'latin1');
                this.socket = s;
                this.connects += 1;
                this.bytesPerConnection.push(0);
                this.firstEntryPerConnection.push(this.next);
                resolve(true);
            });
        });
    }

    private write(buf: Buffer): Promise<boolean> {
        const s = this.socket;
        if (!s || s.destroyed) return Promise.resolve(false);
        return new Promise(resolve => {
            try {
                s.write(buf, err => resolve(!err));
            } catch {
                resolve(false);
            }
        });
    }
}
