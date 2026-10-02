/**
 * One active CAT connection per session (spec §3.2, C7/S2, §10 #5 #7,
 * RC-2), for listen and dial connections alike (D34), plus the end drain
 * (§4.4).
 *
 * Rules, applied when an authenticated (listen) or dialed connection arrives:
 *  - Same peer IP as the active connection: it takes over. The old one gets
 *    CONN_CLOSE{reason:'superseded'} and is destroyed; then the new one gets
 *    CONN_OPEN.
 *  - Different peer while the active one sent a byte (or connected) in the
 *    last 30 s: HELD. Its bytes go to a capture (orphan kind 'C'), never the
 *    journal or the parser; a P1 alert shows both peers (and MACs when an
 *    ARP lookup is configured); a CONCURRENT_CAT incident is journaled.
 *  - Different peer while the active one has been idle ≥30 s: it takes over,
 *    with an alert.
 *  - The session is pinned to its first peer: with no active connection, a
 *    connection from another peer is held while the pinned feed's last byte
 *    is under 30 s old, and takes over (alerted) after that. The pin survives
 *    a restart (it is the last CONN_OPEN in the journal).
 *  - repin() is the admin's "Make this the active feed" (a held connection
 *    becomes the active one) or a new pinned peer (dial-mode settings change).
 *  - Ending (requestEnd): new connections are refused (ENDING_REFUSED), the
 *    active one is DRAINED until the CAT has been idle ≥60 s and no R..E
 *    window is open, bounded at 5 min (a window still open at the bound is
 *    aborted per S-D11 → ABORTED_WINDOW); then CONN_CLOSE, lane drain, final
 *    boundary and SESSION_END (SessionWorker.end).
 *
 * Every decision for one session runs on that session's serial chain, so two
 * connections arriving together are decided one after the other. Chunks are
 * routed synchronously (data()), so the journal order is the socket order.
 */
import { CaptureKind, CaptureStore, CaptureWriter } from './capture';
import { EndResult, SessionWorker, WorkerStatus } from './session-worker';
import { AlertSink, AlertTier, CatProtocol, Clock, IncidentKind, IngestAlertKind, normalizePeer, safeAlert, systemClock, TransmitterMode } from './types';

/** A connection as the arbiter sees it; the listener and the dialer own the socket. */
export interface CatConnection {
    readonly connId: string;
    readonly mode: TransmitterMode;
    /** peer IP (the single-active rule compares this) */
    readonly peer: string;
    /** ip:port of the far end */
    readonly remote: string;
    /** Eclipse username (listen mode); never a password */
    readonly user?: string;
    /** dial mode: the configured protocol */
    readonly protocolHint?: CatProtocol;
    /** destroy the socket; idempotent */
    close(reason: string): void;
}

export type AttachResult =
    | { status: 'active'; takeover: 'first' | 'pinned' | 'same-peer' | 'idle' | 'repin'; superseded?: string }
    | { status: 'held'; captured: boolean; why: 'busy' | 'pinned' | 'route' }
    | { status: 'refused'; reason: 'ending' | 'ended' | 'held-limit' | 'worker-error' | 'closed' };

export type DataRoute = 'fed' | 'held' | 'dropped';

export interface ActiveFeedStatus {
    connId: string;
    peer: string;
    remote: string;
    mode: TransmitterMode;
    user: string | null;
    openedAt: number;
    lastByteAt: number | null;
    bytes: number;
}

export interface HeldFeedStatus {
    connId: string;
    peer: string;
    remote: string;
    mode: TransmitterMode;
    user: string | null;
    since: number;
    bytes: number;
    capturedBytes: number;
    capped: boolean;
    captureFile: string | null;
}

export interface SessionLinkStatus {
    nSesid: string;
    active: ActiveFeedStatus | null;
    held: HeldFeedStatus[];
    pinnedPeer: string | null;
    /** last byte of the session's active feed (survives a disconnect and a restart) */
    lastByteAt: number | null;
    ending: boolean;
    ended: boolean;
    worker: WorkerStatus | null;
}

export interface DrainOptions {
    /** CAT idle time that ends the drain (default 60 s) */
    idleMs?: number;
    /** hard bound after the end request (default 5 min) */
    boundMs?: number;
    /** how often the drain re-checks (default 1 s) */
    pollMs?: number;
}

export interface FeedArbiterOptions {
    /** open (or reopen) a session's worker; called once per session until it succeeds */
    openWorker: (nSesid: string) => Promise<SessionWorker>;
    captures?: CaptureStore | null;
    onAlert?: AlertSink;
    clock?: Clock;
    /** activity window of the takeover/hold rule (default 30 s) */
    activeWindowMs?: number;
    /** held connections per session; more are refused (default 4) */
    maxHeldPerSession?: number;
    /** MAC of a peer from the kit's ARP table (box), for the held-peer alert */
    macLookup?: (ip: string) => string | null | Promise<string | null>;
    drain?: DrainOptions;
}

interface ActiveFeed {
    conn: CatConnection;
    openedAt: number;
    lastByteAt: number | null;
    bytes: number;
}

interface HeldFeed {
    conn: CatConnection;
    since: number;
    bytes: number;
    capture: CaptureWriter | null;
}

interface Link {
    nSesid: string;
    worker: SessionWorker | null;
    workerPromise: Promise<SessionWorker> | null;
    active: ActiveFeed | null;
    held: Map<string, HeldFeed>;
    pinnedPeer: string | null;
    lastByteAt: number | null;
    ending: boolean;
    ended: boolean;
    endPromise: Promise<EndResult> | null;
    chain: Promise<unknown>;
}

/** Close reasons that are not a CAT disconnect (no CAT_DISCONNECT incident). */
const EXPECTED_CLOSE = new Set([
    'superseded',
    'idle-takeover',
    'repinned',
    'session-end',
    'settings-changed',
    'session-changed',
    'manual-reconnect',
    'disconnect',
    'shutdown',
    'route-removed',
]);

/** Peer IP of a journaled `remote` ("ip:port"). */
export function peerOfRemote(remote: string | undefined | null): string | null {
    if (!remote) return null;
    const s = String(remote);
    const bracket = /^\[([^\]]+)\]:\d+$/.exec(s);
    if (bracket) return normalizePeer(bracket[1]);
    const idx = s.lastIndexOf(':');
    if (idx <= 0) return normalizePeer(s);
    const port = s.slice(idx + 1);
    return /^\d+$/.test(port) ? normalizePeer(s.slice(0, idx)) : normalizePeer(s);
}

export class FeedArbiter {
    private readonly opts: FeedArbiterOptions;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly activeWindowMs: number;
    private readonly maxHeld: number;
    private readonly links = new Map<string, Link>();
    private readonly index = new Map<string, { link: Link; role: 'active' | 'held' }>();
    private strayAlertAt = 0;
    private closed = false;

    constructor(opts: FeedArbiterOptions) {
        this.opts = opts;
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
        this.activeWindowMs = opts.activeWindowMs ?? 30_000;
        this.maxHeld = opts.maxHeldPerSession ?? 4;
    }

    /**
     * Decide what a new connection is: the active feed, held, or refused.
     * `holdOnly` (cloud): a direct stream for an 'E' session is accepted and
     * held as orphan kind 'H', never parsed.
     */
    attach(nSesid: string, conn: CatConnection, opts: { holdOnly?: boolean } = {}): Promise<AttachResult> {
        if (this.closed) return Promise.resolve({ status: 'refused', reason: 'closed' });
        const link = this.link(nSesid);
        return this.serial(link, async (): Promise<AttachResult> => {
            if (link.ended || link.ending) {
                this.raise('ENDING_REFUSED', 'P2', link, `Refused a CAT connection from ${conn.peer}: the session is ${link.ended ? 'ended' : 'ending'}`, { peer: conn.peer, user: conn.user, connId: conn.connId });
                return { status: 'refused', reason: link.ended ? 'ended' : 'ending' };
            }
            if (opts.holdOnly) return this.hold(link, conn, 'route', 'H');

            let worker: SessionWorker;
            try {
                worker = await this.workerOf(link);
            } catch {
                return { status: 'refused', reason: 'worker-error' };
            }
            if (worker.ended) {
                link.ended = true;
                return { status: 'refused', reason: 'ended' };
            }
            const now = this.clock();
            if (!link.active) {
                if (!link.pinnedPeer || link.pinnedPeer === conn.peer) return this.activate(link, worker, conn, link.pinnedPeer ? 'pinned' : 'first');
                const idleFor = link.lastByteAt === null ? Infinity : now - link.lastByteAt;
                if (idleFor >= this.activeWindowMs) {
                    this.raise('PEER_TAKEOVER', 'P2', link, `${conn.peer} took over the feed from pinned peer ${link.pinnedPeer} (no byte for ${Math.round(idleFor / 1000)} s)`, {
                        peers: [link.pinnedPeer, conn.peer],
                        user: conn.user,
                        connId: conn.connId,
                    });
                    return this.activate(link, worker, conn, 'idle');
                }
                return this.hold(link, conn, 'pinned', 'C');
            }

            const current = link.active;
            if (current.conn.peer === conn.peer) {
                this.closeActive(link, worker, 'superseded');
                return this.activate(link, worker, conn, 'same-peer', current.conn.connId);
            }
            const lastActivity = current.lastByteAt ?? current.openedAt;
            if (now - lastActivity < this.activeWindowMs) return this.hold(link, conn, 'busy', 'C');

            this.raise('PEER_TAKEOVER', 'P2', link, `${conn.peer} took over the feed from idle ${current.conn.peer} (no byte for ${Math.round((now - lastActivity) / 1000)} s)`, {
                peers: [current.conn.peer, conn.peer],
                user: conn.user,
                connId: conn.connId,
            });
            this.closeActive(link, worker, 'idle-takeover');
            return this.activate(link, worker, conn, 'idle', current.conn.connId);
        });
    }

    /** Route one chunk synchronously: the active feed is journaled + parsed, a held one captured, anything else dropped. */
    data(conn: CatConnection, chunk: Buffer): DataRoute {
        const entry = this.index.get(conn.connId);
        if (!entry || !chunk?.length) {
            if (chunk?.length) this.stray(conn, chunk.length);
            return 'dropped';
        }
        const link = entry.link;
        const now = this.clock();
        if (link.active && link.active.conn.connId === conn.connId) {
            link.active.lastByteAt = now;
            link.active.bytes += chunk.length;
            link.lastByteAt = now;
            return link.worker && link.worker.feed(conn.connId, chunk, now) ? 'fed' : 'dropped';
        }
        const held = link.held.get(conn.connId);
        if (held) {
            held.bytes += chunk.length;
            held.capture?.write(chunk, now);
            return 'held';
        }
        this.stray(conn, chunk.length);
        return 'dropped';
    }

    /** The socket closed (or the owner closed it). Writes CONN_CLOSE for an active feed; finalizes a held capture. */
    detach(conn: CatConnection, reason: string): Promise<void> {
        const entry = this.index.get(conn.connId);
        if (!entry) return Promise.resolve();
        const link = entry.link;
        return this.serial(link, async () => {
            if (link.active && link.active.conn.connId === conn.connId) {
                const worker = link.worker;
                link.active = null;
                this.index.delete(conn.connId);
                if (worker && !worker.ended) {
                    worker.connectionClosed(conn.connId, reason);
                    if (!EXPECTED_CLOSE.has(reason) && !link.ending) {
                        worker.incident('CAT_DISCONNECT', { fromSeq: worker.head.seq, note: `${conn.mode} connection from ${conn.peer} closed: ${reason}` });
                        this.raise('CAT_DISCONNECT', 'info', link, `CAT connection from ${conn.peer} closed (${reason})`, { peer: conn.peer, connId: conn.connId });
                    }
                }
                return;
            }
            const held = link.held.get(conn.connId);
            if (held) {
                link.held.delete(conn.connId);
                this.index.delete(conn.connId);
                await held.capture?.close(reason).catch(() => undefined);
            }
        }).then(() => undefined);
    }

    /**
     * Admin re-pin. `connId`: "Make this the active feed" for a held
     * connection (the current active one is closed with 'repinned'). `peer`:
     * pin the session to a new peer for future connections (dial settings).
     */
    repin(nSesid: string, target: { connId?: string; peer?: string }, by = 'admin'): Promise<boolean> {
        const link = this.link(nSesid);
        return this.serial(link, async () => {
            if (link.ended || link.ending) return false;
            if (target.connId) {
                const held = link.held.get(target.connId);
                if (!held) return false;
                const worker = await this.workerOf(link);
                if (link.active) this.closeActive(link, worker, 'repinned');
                link.held.delete(target.connId);
                this.index.delete(target.connId);
                await held.capture?.close('repinned').catch(() => undefined);
                const res = this.activate(link, worker, held.conn, 'repin');
                if (res.status !== 'active') return false;
                this.raise('REPINNED', 'P2', link, `${by} made ${held.conn.peer} the active feed`, { peer: held.conn.peer, connId: held.conn.connId });
                return true;
            }
            if (target.peer) {
                const peer = normalizePeer(target.peer);
                if (link.pinnedPeer === peer) return true;
                const previous = link.pinnedPeer;
                link.pinnedPeer = peer;
                this.raise('REPINNED', 'info', link, `${by} pinned the feed to ${peer}${previous ? ` (was ${previous})` : ''}`, { peer });
                return true;
            }
            return false;
        }) as Promise<boolean>;
    }

    /**
     * End the session (§4.4): refuse new connections, drain the active one,
     * close held ones, then SessionWorker.end. Idempotent.
     */
    requestEnd(nSesid: string, opts: { endedBy: string } & DrainOptions): Promise<EndResult> {
        const link = this.link(nSesid);
        if (link.endPromise) return link.endPromise;
        link.ending = true;
        const idleMs = opts.idleMs ?? this.opts.drain?.idleMs ?? 60_000;
        const boundMs = opts.boundMs ?? this.opts.drain?.boundMs ?? 5 * 60_000;
        const pollMs = opts.pollMs ?? this.opts.drain?.pollMs ?? 1_000;
        link.endPromise = (async () => {
            const worker = await this.workerOf(link);
            const t0 = this.clock();
            for (;;) {
                const active = link.active;
                const windowOpen = await worker.windowOpen();
                const now = this.clock();
                if (!active) {
                    // Nothing can close the window any more (new connections are refused): S-D11.
                    if (windowOpen) worker.abortWindow('end-no-connection');
                    break;
                }
                const idle = now - (active.lastByteAt ?? active.openedAt);
                if (idle >= idleMs && !windowOpen) break;
                if (now - t0 >= boundMs) {
                    if (windowOpen) worker.abortWindow('end-bound');
                    break;
                }
                const wait = Math.max(1, Math.min(pollMs, boundMs - (now - t0), windowOpen ? pollMs : idleMs - idle));
                await new Promise(resolve => setTimeout(resolve, wait));
            }
            await this.serial(link, async () => {
                if (link.active) this.closeActive(link, worker, 'session-end');
                for (const [connId, held] of [...link.held]) {
                    link.held.delete(connId);
                    this.index.delete(connId);
                    await held.capture?.close('session-end').catch(() => undefined);
                    held.conn.close('session-end');
                }
            });
            const result = await worker.end({ endedBy: opts.endedBy });
            link.ended = true;
            return result;
        })();
        link.endPromise.catch(() => {
            link.endPromise = null;
            link.ending = false;
        });
        return link.endPromise;
    }

    isEnding(nSesid: string): boolean {
        const link = this.links.get(nSesid);
        return !!link && (link.ending || link.ended);
    }

    hasActive(nSesid: string): boolean {
        return !!this.links.get(nSesid)?.active;
    }

    /** The open worker of a session (null when not opened yet). */
    worker(nSesid: string): SessionWorker | null {
        return this.links.get(nSesid)?.worker ?? null;
    }

    /** Open the session's worker if needed. */
    ensureWorker(nSesid: string): Promise<SessionWorker> {
        return this.workerOf(this.link(nSesid));
    }

    /** Journal an incident for a session (opens its worker when needed). */
    async incident(nSesid: string, kind: IncidentKind, opts: { fromSeq?: number; toSeq?: number; lines?: number; note?: string } = {}): Promise<number | null> {
        try {
            const worker = await this.ensureWorker(nSesid);
            return worker.incident(kind, opts);
        } catch {
            return null;
        }
    }

    sessionStatus(nSesid: string): SessionLinkStatus | null {
        const link = this.links.get(nSesid);
        if (!link) return null;
        return {
            nSesid,
            active: link.active
                ? {
                      connId: link.active.conn.connId,
                      peer: link.active.conn.peer,
                      remote: link.active.conn.remote,
                      mode: link.active.conn.mode,
                      user: link.active.conn.user ?? null,
                      openedAt: link.active.openedAt,
                      lastByteAt: link.active.lastByteAt,
                      bytes: link.active.bytes,
                  }
                : null,
            held: [...link.held.values()].map(h => ({
                connId: h.conn.connId,
                peer: h.conn.peer,
                remote: h.conn.remote,
                mode: h.conn.mode,
                user: h.conn.user ?? null,
                since: h.since,
                bytes: h.bytes,
                capturedBytes: h.capture?.meta.bytes ?? 0,
                capped: h.capture?.isCapped ?? false,
                captureFile: h.capture?.meta.file ?? null,
            })),
            pinnedPeer: link.pinnedPeer,
            lastByteAt: link.lastByteAt,
            ending: link.ending,
            ended: link.ended,
            worker: link.worker ? link.worker.status() : null,
        };
    }

    sessions(): SessionLinkStatus[] {
        return [...this.links.keys()].map(id => this.sessionStatus(id)!).filter(Boolean);
    }

    /** Shutdown: close sockets (CONN_CLOSE 'shutdown'), finalize captures, close workers. */
    async close(): Promise<void> {
        this.closed = true;
        for (const link of this.links.values()) {
            await this.serial(link, async () => {
                const worker = link.worker;
                if (link.active) {
                    const conn = link.active.conn;
                    link.active = null;
                    this.index.delete(conn.connId);
                    if (worker && !worker.ended) worker.connectionClosed(conn.connId, 'shutdown');
                    conn.close('shutdown');
                }
                for (const [connId, held] of [...link.held]) {
                    link.held.delete(connId);
                    this.index.delete(connId);
                    await held.capture?.close('shutdown').catch(() => undefined);
                    held.conn.close('shutdown');
                }
                if (worker) await worker.close().catch(() => undefined);
            }).catch(() => undefined);
        }
    }

    // -------------------------------------------------------------------

    private link(nSesid: string): Link {
        let link = this.links.get(nSesid);
        if (!link) {
            link = {
                nSesid,
                worker: null,
                workerPromise: null,
                active: null,
                held: new Map(),
                pinnedPeer: null,
                lastByteAt: null,
                ending: false,
                ended: false,
                endPromise: null,
                chain: Promise.resolve(),
            };
            this.links.set(nSesid, link);
        }
        return link;
    }

    private serial<T>(link: Link, fn: () => Promise<T>): Promise<T> {
        const run = link.chain.then(fn, fn);
        link.chain = run.catch(() => undefined);
        return run;
    }

    private workerOf(link: Link): Promise<SessionWorker> {
        if (link.worker) return Promise.resolve(link.worker);
        if (!link.workerPromise) {
            link.workerPromise = this.opts.openWorker(link.nSesid).then(
                worker => {
                    link.worker = worker;
                    // The pin and the feed's last byte survive a restart through the journal.
                    if (!link.pinnedPeer) link.pinnedPeer = peerOfRemote(worker.applier.lastConnOpen?.remote);
                    if (link.lastByteAt === null) link.lastByteAt = worker.lastByteAt;
                    if (worker.ended) link.ended = true;
                    return worker;
                },
                error => {
                    link.workerPromise = null;
                    this.raise('WORKER_ERROR', 'P1', link, `Session ${link.nSesid} could not be opened: ${(error as Error)?.message ?? error}`, { critical: true });
                    throw error;
                },
            );
        }
        return link.workerPromise;
    }

    private activate(link: Link, worker: SessionWorker, conn: CatConnection, takeover: 'first' | 'pinned' | 'same-peer' | 'idle' | 'repin', superseded?: string): AttachResult {
        try {
            worker.connectionOpened({ connId: conn.connId, remote: conn.remote, user: conn.user, mode: conn.mode, protocolHint: conn.protocolHint });
        } catch {
            return { status: 'refused', reason: worker.ended ? 'ended' : 'worker-error' };
        }
        link.active = { conn, openedAt: this.clock(), lastByteAt: null, bytes: 0 };
        link.pinnedPeer = conn.peer;
        this.index.set(conn.connId, { link, role: 'active' });
        return superseded ? { status: 'active', takeover, superseded } : { status: 'active', takeover };
    }

    private closeActive(link: Link, worker: SessionWorker, reason: string): void {
        const current = link.active;
        if (!current) return;
        link.active = null;
        this.index.delete(current.conn.connId);
        if (!worker.ended) worker.connectionClosed(current.conn.connId, reason);
        current.conn.close(reason);
    }

    private async hold(link: Link, conn: CatConnection, why: 'busy' | 'pinned' | 'route', kind: CaptureKind): Promise<AttachResult> {
        // A newer connection from a peer that is already held replaces the older held one.
        for (const [connId, held] of [...link.held]) {
            if (held.conn.peer !== conn.peer) continue;
            link.held.delete(connId);
            this.index.delete(connId);
            void held.capture?.close('superseded').catch(() => undefined);
            held.conn.close('superseded');
        }
        if (link.held.size >= this.maxHeld) {
            this.raise('HELD_PEER', 'P1', link, `Refused another concurrent CAT connection from ${conn.peer}: ${link.held.size} already held`, { peer: conn.peer, connId: conn.connId });
            return { status: 'refused', reason: 'held-limit' };
        }
        let capture: CaptureWriter | null = null;
        if (this.opts.captures) {
            try {
                capture = this.opts.captures.open({ kind, nSesid: link.nSesid, connId: conn.connId, user: conn.user ?? null, peer: conn.peer, remote: conn.remote, mode: conn.mode });
            } catch {
                capture = null;
            }
        }
        link.held.set(conn.connId, { conn, since: this.clock(), bytes: 0, capture });
        this.index.set(conn.connId, { link, role: 'held' });

        const activePeer = link.active?.conn.peer ?? link.pinnedPeer;
        const macs = await this.macs([activePeer, conn.peer]);
        if (why === 'route') {
            this.raise('HELD_ROUTE', 'P1', link, `Direct Eclipse stream from ${conn.peer} for venue-box session ${link.nSesid} held (never parsed)`, {
                peer: conn.peer,
                user: conn.user,
                connId: conn.connId,
                macs: [macs[1]],
            });
        } else {
            this.raise('HELD_PEER', 'P1', link, `Second CAT connection held: active ${activePeer ?? 'none'}, held ${conn.peer}`, {
                peers: [activePeer ?? 'none', conn.peer],
                macs,
                user: conn.user,
                connId: conn.connId,
            });
            const worker = link.worker;
            if (worker && !worker.ended) worker.incident('CONCURRENT_CAT', { fromSeq: worker.head.seq, note: `held ${conn.mode} connection ${conn.connId} from ${conn.peer} while ${activePeer ?? 'the pinned peer'} fed the session` });
        }
        return { status: 'held', captured: !!capture, why };
    }

    private async macs(ips: Array<string | null>): Promise<Array<string | null>> {
        const lookup = this.opts.macLookup;
        if (!lookup) return ips.map(() => null);
        return Promise.all(
            ips.map(async ip => {
                if (!ip) return null;
                try {
                    return (await Promise.race([Promise.resolve(lookup(ip)), new Promise<null>(resolve => setTimeout(() => resolve(null), 500))])) ?? null;
                } catch {
                    return null;
                }
            }),
        );
    }

    private stray(conn: CatConnection, bytes: number): void {
        const now = this.clock();
        if (now - this.strayAlertAt < 10_000) return;
        this.strayAlertAt = now;
        this.alert({ kind: 'STRAY_FEED', tier: 'info', peer: conn.peer, connId: conn.connId, message: `Dropped ${bytes} B from ${conn.peer}: not an active or held connection`, at: now });
    }

    private raise(kind: IngestAlertKind, tier: AlertTier, link: Link, message: string, extra: Partial<{ critical: boolean; peer: string; peers: string[]; macs: Array<string | null>; user: string; connId: string }> = {}): void {
        this.alert({ kind, tier, nSesid: link.nSesid, message, at: this.clock(), ...extra });
    }
}
