/**
 * Listen mode, "Transmitter connects to box" (spec §3.2 `cat-listener.ts`,
 * §4.3, D3, D14, D34): Eclipse 12 connects to :2500 on the CAT network and
 * sends `username\r\npassword\r\n` before the CAT stream, exactly as it does
 * against the cloud today (eclipse-tcp-ingest.service.ts:93-111).
 *
 * Per connection:
 *  1. Handshake: two CRLF-terminated lines within 512 bytes (and a timeout);
 *     latin1, compared exactly. Bytes that follow in the same chunk, or arrive
 *     while the password is being verified, are buffered and fed in order.
 *  2. Username with no route: refused + alerted (UNKNOWN_LOGIN); nothing is
 *     kept (D3, no unclaimed-capture store). Over 30 such handshakes per
 *     minute from one IP are dropped silently; >100/h raises HANDSHAKE_FLOOD.
 *  3. Username with a live route: a verification slot is reserved first. A
 *     blocked (IP, user) is dropped without verifying, and so is a handshake
 *     whose pair already has its whole failure budget in flight (parallel
 *     guesses) or whose IP has too many verifications in flight. Otherwise the
 *     scrypt hash is verified (async, constant time). A wrong password counts
 *     toward the lockout (5/min → 5 min block). While the password is being
 *     verified the socket is paused once 64 KB is buffered (TCP backpressure,
 *     never a byte lost), so an unauthenticated client cannot grow memory.
 *  4. Right password: the FeedArbiter decides active / held / refused
 *     (single active connection per session; ending sessions refuse).
 *  5. Chunks are routed synchronously; liveness is a synchronous RouteCache
 *     lookup. A route that disappears does not kill the stream: the session
 *     is asked to end and its active connection drains (§4.4).
 *
 * Keepalive 10 s; `bindAddress` binds the CAT network only (the cloud
 * listener binds every interface). Passwords are never logged, journaled or
 * captured.
 */
import { scrypt, timingSafeEqual } from 'crypto';
import * as net from 'net';

import { CatConnection, FeedArbiter } from './feed-arbiter';
import { HandshakeLockout } from './lockout';
import { EclipseRoute, RouteCache } from './route-cache';
import { AlertSink, Clock, newConnId, normalizePeer, safeAlert, systemClock } from './types';

export const HANDSHAKE_MAX_BYTES = 512;
/** bytes buffered after the handshake while the password is verified; above it the socket is paused */
export const HANDSHAKE_PENDING_MAX_BYTES = 64 * 1024;
/** scrypt cost of routes written without `scryptN` (node's default; today's cloud routes) */
export const DEFAULT_SCRYPT_N = 16_384;

export type RouteDisposition = 'feed' | 'hold';

export interface CatListenerOptions {
    port: number;
    /** CAT network address on the box; omit to listen on every interface (cloud) */
    bindAddress?: string;
    routes: RouteCache;
    arbiter: FeedArbiter;
    lockout?: HandshakeLockout;
    onAlert?: AlertSink;
    clock?: Clock;
    keepAliveMs?: number;
    handshakeTimeoutMs?: number;
    /** 'hold' = accept and hold, never parse (cloud: a direct stream for an 'E' route, orphan 'H') */
    routeDisposition?: (route: EclipseRoute) => RouteDisposition;
    /** password check; default: scrypt against the route's salt/hash (legacy plaintext routes compared in constant time) */
    verifyPassword?: (route: EclipseRoute, supplied: string) => Promise<boolean>;
    /** what a disappearing route does to its live stream (default 'drain') */
    onRouteGone?: 'drain' | 'close';
    /** drain options passed to requestEnd when a route disappears */
    drain?: { idleMs?: number; boundMs?: number; pollMs?: number };
    log?: (message: string, level?: 'log' | 'warn' | 'error') => void;
}

export interface ListenerStats {
    connections: number;
    handshakes: number;
    unknownLogins: number;
    droppedUnknown: number;
    wrongPasswords: number;
    /** password verifications run (each held a lockout slot) */
    verifications: number;
    /** dropped unverified: the (IP, user) was blocked */
    droppedBlocked: number;
    /** dropped unverified: the pair's failure budget or the IP's verification cap was in flight */
    droppedBusy: number;
    /** handshakes whose socket was paused at HANDSHAKE_PENDING_MAX_BYTES while verifying */
    pausedHandshakes: number;
    /** most bytes ever buffered for one handshake while verifying */
    maxPendingBytes: number;
    accepted: number;
    held: number;
    refused: number;
    open: number;
}

/** Constant-time scrypt check of an Eclipse password against a route. */
export function verifyRoutePassword(route: EclipseRoute, supplied: string): Promise<boolean> {
    const pass = String(supplied ?? '');
    if (route.salt && route.hash) {
        let expected: Buffer;
        let salt: Buffer;
        try {
            expected = Buffer.from(route.hash, 'base64');
            salt = Buffer.from(route.salt, 'base64');
        } catch {
            return Promise.resolve(false);
        }
        if (!expected.length) return Promise.resolve(false);
        const N = route.scryptN ?? DEFAULT_SCRYPT_N;
        return new Promise(resolve => {
            scrypt(pass, salt, expected.length, { N, r: 8, p: 1, maxmem: 256 * N * 8 + 1024 * 1024 }, (error, actual) => {
                if (error || !actual) return resolve(false);
                resolve(actual.length === expected.length && timingSafeEqual(actual, expected));
            });
        });
    }
    if (route.legacyPass !== null) {
        const a = Buffer.from(route.legacyPass, 'utf8');
        const b = Buffer.from(pass, 'utf8');
        return Promise.resolve(a.length === b.length && timingSafeEqual(a, b));
    }
    return Promise.resolve(false);
}

class ListenerConnection implements CatConnection {
    readonly connId = newConnId('listen');
    readonly mode = 'listen' as const;
    readonly peer: string;
    readonly remote: string;
    user?: string;
    nSesid: string | null = null;
    attached = false;
    closedReason: string | null = null;

    constructor(readonly socket: net.Socket) {
        this.peer = normalizePeer(socket.remoteAddress);
        this.remote = `${this.peer}:${socket.remotePort ?? 0}`;
    }

    close(reason: string): void {
        if (!this.closedReason) this.closedReason = reason;
        if (!this.socket.destroyed) this.socket.destroy();
    }
}

export class CatListener {
    private readonly opts: CatListenerOptions;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly lockout: HandshakeLockout;
    private server: net.Server | null = null;
    private readonly sockets = new Set<ListenerConnection>();
    private readonly statsValue: ListenerStats = {
        connections: 0,
        handshakes: 0,
        unknownLogins: 0,
        droppedUnknown: 0,
        wrongPasswords: 0,
        verifications: 0,
        droppedBlocked: 0,
        droppedBusy: 0,
        pausedHandshakes: 0,
        maxPendingBytes: 0,
        accepted: 0,
        held: 0,
        refused: 0,
        open: 0,
    };
    private unsubscribeRoutes: (() => void) | null = null;
    private readonly goneRequested = new Set<string>();

    constructor(opts: CatListenerOptions) {
        this.opts = opts;
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
        this.lockout = opts.lockout ?? new HandshakeLockout({ clock: this.clock, onAlert: opts.onAlert });
    }

    get lockoutState(): HandshakeLockout {
        return this.lockout;
    }

    get stats(): ListenerStats {
        return { ...this.statsValue, open: this.sockets.size };
    }

    /** Bound address once listening. */
    address(): net.AddressInfo | null {
        const addr = this.server?.address();
        return addr && typeof addr === 'object' ? addr : null;
    }

    start(): Promise<net.AddressInfo> {
        if (this.server) return Promise.resolve(this.address()!);
        const server = net.createServer(sock => this.handle(sock));
        this.server = server;
        this.unsubscribeRoutes = this.opts.routes.onRemoved(nSesid => this.routeGone(nSesid));
        return new Promise((resolve, reject) => {
            const onError = (error: Error) => {
                this.server = null;
                reject(error);
            };
            server.once('error', onError);
            server.listen({ port: this.opts.port, host: this.opts.bindAddress }, () => {
                server.off('error', onError);
                server.on('error', error => this.log(`listener error: ${(error as Error)?.message ?? error}`, 'error'));
                resolve(this.address()!);
            });
        });
    }

    /** Stop accepting and destroy every socket (shutdown). Sessions are not ended. */
    async stop(): Promise<void> {
        this.unsubscribeRoutes?.();
        this.unsubscribeRoutes = null;
        const server = this.server;
        this.server = null;
        for (const conn of [...this.sockets]) conn.close('shutdown');
        if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    }

    private handle(sock: net.Socket): void {
        const conn = new ListenerConnection(sock);
        this.sockets.add(conn);
        this.statsValue.connections += 1;
        sock.setKeepAlive(true, this.opts.keepAliveMs ?? 10_000);
        sock.setNoDelay(true);

        let handshake: Buffer | null = Buffer.alloc(0);
        /** chunks received after the handshake but before the arbiter decided */
        let pending: Buffer[] | null = null;
        let pendingBytes = 0;
        /** Buffer one post-handshake chunk; pause the socket (TCP backpressure) once the cap is reached. */
        const hold = (chunk: Buffer) => {
            pending!.push(chunk);
            pendingBytes += chunk.length;
            if (pendingBytes > this.statsValue.maxPendingBytes) this.statsValue.maxPendingBytes = pendingBytes;
            if (pendingBytes >= HANDSHAKE_PENDING_MAX_BYTES && !sock.isPaused()) {
                sock.pause();
                this.statsValue.pausedHandshakes += 1;
            }
        };
        const timer = setTimeout(() => {
            if (!conn.attached && !conn.closedReason) {
                this.log(`[handshake] no Eclipse login from ${conn.peer} within ${this.opts.handshakeTimeoutMs ?? 15_000} ms`, 'warn');
                conn.close('handshake-timeout');
            }
        }, this.opts.handshakeTimeoutMs ?? 15_000);
        timer.unref?.();

        sock.on('data', (chunk: Buffer) => {
            if (conn.closedReason) return;
            if (conn.attached) {
                this.route(conn, chunk);
                return;
            }
            if (pending) {
                hold(chunk);
                return;
            }
            handshake = Buffer.concat([handshake!, chunk]);
            const first = handshake.indexOf('\r\n');
            const second = first < 0 ? -1 : handshake.indexOf('\r\n', first + 2);
            if (second < 0) {
                if (handshake.length > HANDSHAKE_MAX_BYTES) conn.close('handshake-too-long');
                return;
            }
            if (second + 2 > HANDSHAKE_MAX_BYTES) {
                conn.close('handshake-too-long');
                return;
            }
            const user = handshake.subarray(0, first).toString('latin1');
            const pass = handshake.subarray(first + 2, second).toString('latin1');
            const rest = handshake.subarray(second + 2);
            handshake = null;
            pending = [];
            if (rest.length) hold(Buffer.from(rest));
            void this.authenticate(conn, user, pass)
                .then(ok => {
                    clearTimeout(timer);
                    if (!ok || conn.closedReason) {
                        pending = null;
                        conn.close(conn.closedReason ?? 'refused');
                        return;
                    }
                    conn.attached = true;
                    const queued = pending ?? [];
                    pending = null;
                    pendingBytes = 0;
                    for (const piece of queued) this.route(conn, piece);
                    if (sock.isPaused() && !sock.destroyed) sock.resume();
                })
                .catch(error => {
                    this.log(`[handshake] error for ${conn.peer}: ${(error as Error)?.message ?? error}`, 'error');
                    conn.close('error');
                });
        });
        sock.on('error', error => {
            if (!conn.closedReason) conn.closedReason = `error:${(error as NodeJS.ErrnoException)?.code ?? 'socket'}`;
        });
        sock.on('close', () => {
            clearTimeout(timer);
            this.sockets.delete(conn);
            // Set before the arbiter answers too, so a socket that closes mid-handshake is detached (see authenticate).
            if (!conn.closedReason) conn.closedReason = 'peer-closed';
            if (conn.attached) void this.opts.arbiter.detach(conn, conn.closedReason);
        });
    }

    /** Resolve credentials to a session and let the arbiter decide. True when the socket stays open. */
    private async authenticate(conn: ListenerConnection, user: string, pass: string): Promise<boolean> {
        this.statsValue.handshakes += 1;
        const candidates = this.opts.routes.byUser(user);
        if (!candidates.length) {
            const verdict = this.lockout.noteUnknown(conn.peer);
            if (verdict.action === 'drop') {
                this.statsValue.droppedUnknown += 1;
                return false;
            }
            this.statsValue.unknownLogins += 1;
            this.alert({
                kind: 'UNKNOWN_LOGIN',
                tier: 'P2',
                user,
                peer: conn.peer,
                message: `Eclipse login '${user}' from ${conn.peer} matches no session on this listener; refused (nothing kept)`,
                at: this.clock(),
            });
            return false;
        }
        // Reserve before verifying: an in-flight verification holds a failure slot, so parallel handshakes cannot
        // verify more guesses than the 5-per-minute rule allows.
        const slot = this.lockout.reserve(conn.peer, user);
        if (slot.ok === false) {
            if (slot.reason === 'blocked') this.statsValue.droppedBlocked += 1;
            else this.statsValue.droppedBusy += 1;
            return false;
        }
        const verify = this.opts.verifyPassword ?? verifyRoutePassword;
        let route: EclipseRoute | null = null;
        this.statsValue.verifications += 1;
        try {
            for (const candidate of candidates) {
                if (await verify(candidate, pass)) {
                    route = candidate;
                    break;
                }
            }
        } catch (error) {
            this.lockout.settle(slot.ticket, 'uncounted');
            throw error;
        }
        if (!route) {
            this.statsValue.wrongPasswords += 1;
            const live = candidates.filter(c => this.opts.routes.isLive(c.nSesid));
            const res = this.lockout.settle(slot.ticket, live.length ? 'failure' : 'uncounted', live[0]?.nSesid);
            if (res?.justBlocked) {
                for (const c of live) void this.opts.arbiter.incident(c.nSesid, 'LOCKOUT', { note: `${user} from ${conn.peer} blocked until ${new Date(res.until!).toISOString()}` });
            }
            this.log(`[auth] wrong password for '${user}' from ${conn.peer}`, 'warn');
            return false;
        }
        this.lockout.settle(slot.ticket, 'success');
        if (!this.opts.routes.isLive(route.nSesid) || conn.closedReason) return false;
        conn.user = user;
        conn.nSesid = route.nSesid;
        const disposition = this.opts.routeDisposition?.(route) ?? 'feed';
        const res = await this.opts.arbiter.attach(route.nSesid, conn, { holdOnly: disposition === 'hold' });
        if (res.status === 'refused') {
            this.statsValue.refused += 1;
            return false;
        }
        if (res.status === 'held') this.statsValue.held += 1;
        else this.statsValue.accepted += 1;
        this.log(`[auth] '${user}' from ${conn.peer} -> S${route.nSesid} (${res.status}${res.status === 'active' ? `, ${res.takeover}` : ''})`);
        if (conn.closedReason) {
            // The socket closed while the arbiter was deciding.
            void this.opts.arbiter.detach(conn, conn.closedReason);
            return false;
        }
        return true;
    }

    private route(conn: ListenerConnection, chunk: Buffer): void {
        const nSesid = conn.nSesid!;
        // Per-chunk liveness is a synchronous map lookup; a gone route drains, it never drops bytes.
        if (!this.opts.routes.isLive(nSesid)) this.routeGone(nSesid);
        else if (this.goneRequested.has(nSesid) && !this.opts.arbiter.isEnding(nSesid)) this.goneRequested.delete(nSesid);
        this.opts.arbiter.data(conn, chunk);
    }

    /** A route disappeared from a good read: the session ends with a drain (or its streams close). */
    private routeGone(nSesid: string): void {
        if (this.goneRequested.has(nSesid)) return;
        this.goneRequested.add(nSesid);
        if ((this.opts.onRouteGone ?? 'drain') === 'close') {
            for (const conn of this.sockets) if (conn.nSesid === nSesid) conn.close('route-removed');
            return;
        }
        if (!this.opts.arbiter.isEnding(nSesid) && [...this.sockets].some(c => c.nSesid === nSesid)) {
            void this.opts.arbiter.requestEnd(nSesid, { endedBy: 'route-removed', ...(this.opts.drain ?? {}) }).catch(error => this.log(`end of ${nSesid} after route removal failed: ${(error as Error)?.message ?? error}`, 'error'));
        }
    }

    private log(message: string, level: 'log' | 'warn' | 'error' = 'log'): void {
        try {
            this.opts.log?.(message, level);
        } catch {
            /* ignore */
        }
    }
}
