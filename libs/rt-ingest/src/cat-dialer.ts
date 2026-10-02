/**
 * Dial mode, "Box connects to transmitter" (spec §3.2 `cat-dialer.ts`, D34,
 * DR13; the RT local 3.0 way, modelled on
 * com-realtime-local_api-main/apps/realtime/src/tcp/tcp.service.ts:90-120).
 * Not to be confused with the test harness tools/feed-replay/cat-dialer.ts.
 *
 *  - Settings: protocol Bridge / CaseView, transmitter host (IP) and port,
 *    auto-reconnect (every 3 s by default). Allowed only on the transmitter
 *    (CAT) network (S-D14): a dialed transmitter has no login and is trusted
 *    by network position, so the host can be checked by `hostAllowed`.
 *  - Feeds the bound live session through the same FeedArbiter / journal /
 *    parser lane as listen mode; every TCP connection is bracketed by its own
 *    CONN_OPEN (no user) / CONN_CLOSE (DET-6 applies unchanged).
 *  - One primary Connect; Reconnect (manual); Disconnect.
 *  - Test only: opens a socket and reports reachability within 5 s, never
 *    feeds a session, and is REFUSED while the dialer is capturing, connecting
 *    or retrying (DR13), or while the bound session has an active feed.
 *  - State version (DR13): every settings / binding change and every
 *    connection state change bumps it; apply(change, expectedVersion) is
 *    refused when the version moved, so the guard dialog re-checks on confirm.
 *  - Every attempt, connect, disconnect, error, first feed and first line
 *    ("success") goes to the Connectivity Log callback.
 */
import * as net from 'net';

import { CatConnection, FeedArbiter } from './feed-arbiter';
import { CatProtocol, catProtocolOf, Clock, newConnId, normalizePeer, systemClock } from './types';

export type DialProtocol = 'bridge' | 'caseview';

export interface DialerSettings {
    protocol: DialProtocol;
    /** transmitter IP (or host name) on the CAT network */
    host: string;
    port: number;
    autoReconnect: boolean;
    /** reconnect interval (default 3000 ms, as RT local 3.0) */
    reconnectMs?: number;
}

export type DialerState = 'not-set-up' | 'connecting' | 'live' | 'quiet' | 'disconnected';

export interface DialerStatus {
    state: DialerState;
    /** attempt number of the current (re)connect cycle; 0 once connected or idle */
    attempt: number;
    /** transmitter address while connected */
    peer: string | null;
    /** bytes received since the last Connect */
    bytes: number;
    lastByteAt: number | null;
    /** last line the parser produced for the bound session */
    lastLineAt: number | null;
    version: number;
    settings: DialerSettings | null;
    nSesid: string | null;
    connected: boolean;
    /** a reconnect is scheduled or a connect attempt is in flight */
    retrying: boolean;
    /** what the arbiter made of the current connection */
    role: 'active' | 'held' | null;
    connectedAt: number | null;
    nextAttemptAt: number | null;
    lastError: string | null;
    testing: boolean;
}

export type ConnectivityLogKind = 'attempt' | 'connected' | 'disconnected' | 'error' | 'feed' | 'success' | 'test';

export interface ConnectivityLogEntry {
    at: number;
    kind: ConnectivityLogKind;
    message: string;
    attempt?: number;
    peer?: string;
    nSesid?: string | null;
    /** retries of one reconnect cycle share a key so the log can collapse them into one row (DR12) */
    collapseKey?: string;
}

export type DialerApplyResult =
    | { ok: true; version: number }
    | { ok: false; reason: 'stale' | 'invalid' | 'closed'; version: number; errors?: string[] };

export type DialerCommandResult =
    | { ok: true; version: number }
    | { ok: false; reason: 'not-set-up' | 'session-ending' | 'testing' | 'closed'; version: number };

export interface DialerTestResult {
    ok: boolean;
    /** why the test did not run */
    refused?: 'busy' | 'testing' | 'invalid' | 'closed';
    reachable?: boolean;
    ms?: number;
    error?: string;
    errors?: string[];
    host?: string;
    port?: number;
    state?: DialerState;
}

export interface CatDialerOptions {
    arbiter: FeedArbiter;
    clock?: Clock;
    onLog?: (entry: ConnectivityLogEntry) => void;
    connectTimeoutMs?: number;
    testTimeoutMs?: number;
    /** connected but silent this long = 'quiet' (default 2 min, §12 "CAT silent >2 min") */
    quietMs?: number;
    keepAliveMs?: number;
    /** S-D14: is this host on the transmitter network? */
    hostAllowed?: (host: string) => boolean;
    createConnection?: (opts: net.NetConnectOpts) => net.Socket;
    settings?: DialerSettings | null;
    nSesid?: string | null;
}

export const DEFAULT_RECONNECT_MS = 3_000;

export function validateDialerSettings(s: DialerSettings | null | undefined, hostAllowed?: (host: string) => boolean): string[] {
    const errors: string[] = [];
    if (!s || typeof s !== 'object') return ['settings are required'];
    if (s.protocol !== 'bridge' && s.protocol !== 'caseview') errors.push("protocol must be 'bridge' or 'caseview'");
    const host = typeof s.host === 'string' ? s.host.trim() : '';
    if (!host) errors.push('host is required');
    else if (!net.isIP(host) && !/^[A-Za-z0-9]([A-Za-z0-9-]{0,62}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,62}[A-Za-z0-9])?)*$/.test(host)) errors.push('host must be an IP address or a host name');
    else if (hostAllowed && !hostAllowed(host)) errors.push('host is not on the transmitter network');
    if (!Number.isInteger(s.port) || s.port < 1 || s.port > 65_535) errors.push('port must be 1-65535');
    if (typeof s.autoReconnect !== 'boolean') errors.push('autoReconnect must be true or false');
    if (s.reconnectMs !== undefined && (!Number.isInteger(s.reconnectMs) || s.reconnectMs < 100 || s.reconnectMs > 600_000)) errors.push('reconnectMs must be 100-600000');
    return errors;
}

class DialConnection implements CatConnection {
    readonly connId = newConnId('dial');
    readonly mode = 'dial' as const;
    closedReason: string | null = null;

    constructor(
        readonly socket: net.Socket,
        readonly peer: string,
        readonly remote: string,
        readonly protocolHint: CatProtocol,
    ) {}

    close(reason: string): void {
        if (!this.closedReason) this.closedReason = reason;
        if (!this.socket.destroyed) this.socket.destroy();
    }
}

type Coarse = 'not-set-up' | 'connecting' | 'connected' | 'disconnected';

export class CatDialer {
    private readonly opts: CatDialerOptions;
    private readonly clock: Clock;
    private readonly createConnection: (o: net.NetConnectOpts) => net.Socket;

    private settingsValue: DialerSettings | null;
    private nSesidValue: string | null;
    private versionValue = 1;
    private coarse: Coarse;

    private wantConnected = false;
    private socket: net.Socket | null = null;
    private conn: DialConnection | null = null;
    private connected = false;
    private connectedAt: number | null = null;
    private role: 'active' | 'held' | null = null;
    private attempt = 0;
    private retryTimer: NodeJS.Timeout | null = null;
    private nextAttemptAt: number | null = null;
    private lastError: string | null = null;
    private bytes = 0;
    private lastByteAt: number | null = null;
    private firstFeedLogged = false;
    private successLogged = false;
    /** the next connection re-pins the session to the transmitter (settings or binding were applied) */
    private repinPending = true;
    private testing = false;
    private closed = false;

    constructor(opts: CatDialerOptions) {
        this.opts = opts;
        this.clock = opts.clock ?? systemClock;
        this.createConnection = opts.createConnection ?? (o => net.createConnection(o));
        this.settingsValue = opts.settings ? { ...opts.settings } : null;
        this.nSesidValue = opts.nSesid ?? null;
        if (this.settingsValue && validateDialerSettings(this.settingsValue, opts.hostAllowed).length) this.settingsValue = null;
        this.coarse = this.computeCoarse();
    }

    get version(): number {
        return this.versionValue;
    }

    get settings(): DialerSettings | null {
        return this.settingsValue ? { ...this.settingsValue } : null;
    }

    get nSesid(): string | null {
        return this.nSesidValue;
    }

    status(): DialerStatus {
        const lastLineAt = this.lastLineAt();
        this.checkSuccess(lastLineAt);
        return {
            state: this.state(),
            attempt: this.attempt,
            peer: this.connected ? this.conn?.remote ?? null : null,
            bytes: this.bytes,
            lastByteAt: this.lastByteAt,
            lastLineAt,
            version: this.versionValue,
            settings: this.settings,
            nSesid: this.nSesidValue,
            connected: this.connected,
            retrying: this.isRetrying(),
            role: this.role,
            connectedAt: this.connectedAt,
            nextAttemptAt: this.nextAttemptAt,
            lastError: this.lastError,
            testing: this.testing,
        };
    }

    /**
     * Apply new settings and/or a new receiving session, guarded by the state
     * version the admin's dialog was built from (DR13). An interrupting change
     * (host, port, protocol, session) closes the current connection
     * ('settings-changed' / 'session-changed') and, if Connect is on, dials again.
     */
    apply(change: { settings?: DialerSettings | null; nSesid?: string | null }, expectedVersion: number): DialerApplyResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (expectedVersion !== this.versionValue) return { ok: false, reason: 'stale', version: this.versionValue };
        const next = change.settings === undefined ? this.settingsValue : change.settings ? { ...change.settings, host: String(change.settings.host).trim() } : null;
        if (next) {
            const errors = validateDialerSettings(next, this.opts.hostAllowed);
            if (errors.length) return { ok: false, reason: 'invalid', version: this.versionValue, errors };
        }
        const nextSesid = change.nSesid === undefined ? this.nSesidValue : change.nSesid;
        const prev = this.settingsValue;
        const linkChanged = !prev || !next || prev.host !== next.host || prev.port !== next.port || prev.protocol !== next.protocol;
        const sessionChanged = nextSesid !== this.nSesidValue;
        this.settingsValue = next;
        this.nSesidValue = nextSesid;
        this.versionValue += 1;
        if (linkChanged || sessionChanged) this.repinPending = true;

        if (!next || !nextSesid) {
            this.wantConnected = false;
            this.cancelRetry();
            this.dropSocket(sessionChanged ? 'session-changed' : 'settings-changed');
        } else if (linkChanged || sessionChanged) {
            const wasActive = this.wantConnected;
            this.cancelRetry();
            this.dropSocket(sessionChanged ? 'session-changed' : 'settings-changed');
            if (wasActive) {
                this.attempt = 0;
                this.dial();
            }
        } else if (!next.autoReconnect && this.retryTimer) {
            // auto-reconnect switched off while waiting to retry: stop retrying
            this.cancelRetry();
        }
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** The one primary Connect: dial now and keep the link up (auto-reconnect per settings). */
    connect(): DialerCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (!this.settingsValue || !this.nSesidValue) return { ok: false, reason: 'not-set-up', version: this.versionValue };
        if (this.opts.arbiter.isEnding(this.nSesidValue)) return { ok: false, reason: 'session-ending', version: this.versionValue };
        if (this.testing) return { ok: false, reason: 'testing', version: this.versionValue };
        this.wantConnected = true;
        this.bytes = 0;
        this.versionValue += 1;
        if (!this.socket && !this.retryTimer) {
            this.attempt = 0;
            this.dial();
        }
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** Manual Reconnect: drop the current connection (if any) and dial at once. */
    reconnect(): DialerCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (!this.settingsValue || !this.nSesidValue) return { ok: false, reason: 'not-set-up', version: this.versionValue };
        if (this.opts.arbiter.isEnding(this.nSesidValue)) return { ok: false, reason: 'session-ending', version: this.versionValue };
        if (this.testing) return { ok: false, reason: 'testing', version: this.versionValue };
        this.wantConnected = true;
        this.cancelRetry();
        this.dropSocket('manual-reconnect');
        this.attempt = 0;
        this.versionValue += 1;
        this.dial();
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** Stop feeding: close the connection and do not reconnect. */
    disconnect(reason = 'disconnect'): DialerCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        this.wantConnected = false;
        this.cancelRetry();
        this.dropSocket(reason);
        this.attempt = 0;
        this.versionValue += 1;
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /**
     * Test only (DR13): can the box reach the transmitter? Opens a socket and
     * reports within the timeout. Never feeds a session (the socket is closed
     * on connect; any byte is ignored). Refused while capturing or retrying.
     */
    async testOnly(settings?: DialerSettings | null, timeoutMs = this.opts.testTimeoutMs ?? 5_000): Promise<DialerTestResult> {
        if (this.closed) return { ok: false, refused: 'closed' };
        if (this.testing) return { ok: false, refused: 'testing' };
        if (this.isCapturing()) return { ok: false, refused: 'busy', state: this.state() };
        const s = settings ?? this.settingsValue;
        const errors = validateDialerSettings(s, this.opts.hostAllowed);
        if (errors.length) return { ok: false, refused: 'invalid', errors };
        const host = s!.host.trim();
        const port = s!.port;
        this.testing = true;
        const t0 = this.clock();
        this.log('test', `Test only: connecting to ${host}:${port}`, { peer: `${host}:${port}` });
        try {
            const result = await new Promise<DialerTestResult>(resolve => {
                let done = false;
                const sock = this.createConnection({ host, port });
                const finish = (r: DialerTestResult) => {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    sock.removeAllListeners('data');
                    sock.destroy();
                    resolve(r);
                };
                const timer = setTimeout(() => finish({ ok: true, reachable: false, error: 'timeout', ms: this.clock() - t0, host, port }), timeoutMs);
                sock.on('data', () => undefined); // never fed anywhere
                sock.once('connect', () => finish({ ok: true, reachable: true, ms: this.clock() - t0, host, port }));
                sock.once('error', (error: NodeJS.ErrnoException) => finish({ ok: true, reachable: false, error: error?.code ?? error?.message ?? 'error', ms: this.clock() - t0, host, port }));
            });
            this.log('test', result.reachable ? `Test only: ${host}:${port} reachable (${result.ms} ms)` : `Test only: ${host}:${port} not reachable (${result.error})`, { peer: `${host}:${port}` });
            return result;
        } finally {
            this.testing = false;
        }
    }

    async close(): Promise<void> {
        if (this.closed) return;
        this.wantConnected = false;
        this.cancelRetry();
        this.dropSocket('shutdown');
        this.closed = true;
    }

    // -------------------------------------------------------------------

    private state(): DialerState {
        const coarse = this.computeCoarse();
        if (coarse !== 'connected') return coarse;
        const since = this.lastByteAt ?? this.connectedAt ?? this.clock();
        return this.clock() - since >= (this.opts.quietMs ?? 120_000) ? 'quiet' : 'live';
    }

    private computeCoarse(): Coarse {
        if (!this.settingsValue || !this.nSesidValue) return 'not-set-up';
        if (this.connected) return 'connected';
        if (this.wantConnected && (this.socket || this.retryTimer)) return 'connecting';
        return 'disconnected';
    }

    /** Bump the state version when the coarse state changed (connection changes, not every byte). */
    private syncCoarse(): void {
        const next = this.computeCoarse();
        if (next !== this.coarse) {
            this.coarse = next;
            this.versionValue += 1;
        }
    }

    private isRetrying(): boolean {
        return this.wantConnected && !this.connected && (!!this.socket || !!this.retryTimer);
    }

    /** DR13: capturing, connecting or retrying, or the bound session already has an active feed. */
    private isCapturing(): boolean {
        if (this.socket || this.retryTimer || this.connected) return true;
        return !!this.nSesidValue && this.opts.arbiter.hasActive(this.nSesidValue);
    }

    private lastLineAt(): number | null {
        if (!this.nSesidValue) return null;
        return this.opts.arbiter.worker(this.nSesidValue)?.lastLineAt ?? null;
    }

    private checkSuccess(lastLineAt: number | null): void {
        if (this.successLogged || !this.connected || this.connectedAt === null || lastLineAt === null) return;
        if (lastLineAt >= this.connectedAt) {
            this.successLogged = true;
            this.log('success', `Lines arriving from ${this.conn?.remote ?? 'the transmitter'}`, { peer: this.conn?.remote });
        }
    }

    private dial(): void {
        const settings = this.settingsValue;
        const nSesid = this.nSesidValue;
        if (!settings || !nSesid || this.closed || !this.wantConnected) return;
        this.retryTimer = null;
        this.nextAttemptAt = null;
        this.attempt += 1;
        const attempt = this.attempt;
        const host = settings.host;
        const port = settings.port;
        this.log('attempt', `Connecting to transmitter ${host}:${port} (attempt ${attempt})`, { attempt, peer: `${host}:${port}`, collapseKey: 'dial-retry' });

        const sock = this.createConnection({ host, port });
        this.socket = sock;
        let connTimer: NodeJS.Timeout | null = setTimeout(() => {
            connTimer = null;
            if (!this.connected && this.socket === sock) {
                this.lastError = 'connect timeout';
                sock.destroy(Object.assign(new Error('connect timeout'), { code: 'ETIMEDOUT' }));
            }
        }, this.opts.connectTimeoutMs ?? 5_000);
        connTimer.unref?.();

        let pending: Buffer[] | null = [];
        let conn: DialConnection | null = null;

        sock.once('connect', () => {
            if (connTimer) clearTimeout(connTimer);
            connTimer = null;
            if (this.socket !== sock) return;
            sock.setKeepAlive(true, this.opts.keepAliveMs ?? 10_000);
            sock.setNoDelay(true);
            const ipPeer = normalizePeer(sock.remoteAddress);
            const peer = net.isIP(host) ? normalizePeer(host) : ipPeer;
            conn = new DialConnection(sock, peer, `${ipPeer}:${sock.remotePort ?? port}`, catProtocolOf(settings.protocol));
            this.conn = conn;
            this.connected = true;
            this.connectedAt = this.clock();
            this.attempt = 0;
            this.lastError = null;
            this.firstFeedLogged = false;
            this.successLogged = false;
            this.log('connected', `Connected to transmitter ${conn.remote}`, { peer: conn.remote, attempt });
            this.syncCoarse();

            const thisConn = conn;
            if (this.repinPending) {
                this.repinPending = false;
                // Admin-set transmitter settings (guarded, audited): the session's pin follows them.
                void this.opts.arbiter.repin(nSesid, { peer }, 'transmitter-settings');
            }
            void this.opts.arbiter.attach(nSesid, thisConn).then(res => {
                if (this.socket !== sock || thisConn.closedReason || sock.destroyed) {
                    if (res.status !== 'refused') void this.opts.arbiter.detach(thisConn, thisConn.closedReason ?? 'peer-closed');
                    pending = null;
                    return;
                }
                if (res.status === 'refused') {
                    pending = null;
                    this.lastError = `refused: ${res.reason}`;
                    this.log('error', `Session ${nSesid} refused the transmitter feed (${res.reason})`, { peer: thisConn.remote });
                    if (res.reason === 'ending' || res.reason === 'ended') this.wantConnected = false;
                    thisConn.close(`refused:${res.reason}`);
                    return;
                }
                this.role = res.status;
                const queued = pending ?? [];
                pending = null;
                for (const chunk of queued) this.route(thisConn, chunk);
            });
        });

        sock.on('data', (chunk: Buffer) => {
            if (this.socket !== sock || !conn) return;
            this.bytes += chunk.length;
            this.lastByteAt = this.clock();
            if (!this.firstFeedLogged) {
                this.firstFeedLogged = true;
                this.log('feed', `First bytes from ${conn.remote}`, { peer: conn.remote });
            }
            if (pending) pending.push(chunk);
            else this.route(conn, chunk);
        });

        sock.on('error', (error: NodeJS.ErrnoException) => {
            const code = error?.code ?? error?.message ?? 'error';
            if (this.socket === sock) this.lastError = code;
            if (conn && !conn.closedReason) conn.closedReason = `error:${code}`;
            this.log('error', `Transmitter ${host}:${port}: ${code}`, { peer: `${host}:${port}`, attempt, collapseKey: this.connected ? undefined : 'dial-retry' });
        });

        sock.on('close', () => {
            if (connTimer) clearTimeout(connTimer);
            connTimer = null;
            const current = this.socket === sock;
            // Detach is serialized behind a pending attach, so this is right even mid-attach (a no-op when never attached).
            if (conn) void this.opts.arbiter.detach(conn, conn.closedReason ?? 'peer-closed');
            if (!current) return;
            const wasConnected = this.connected;
            this.socket = null;
            this.conn = null;
            this.connected = false;
            this.role = null;
            pending = null;
            if (wasConnected) this.log('disconnected', `Disconnected from transmitter ${host}:${port}${conn?.closedReason ? ` (${conn.closedReason})` : ''}`, { peer: `${host}:${port}` });
            this.scheduleRetry();
            this.syncCoarse();
        });
    }

    private route(conn: DialConnection, chunk: Buffer): void {
        this.opts.arbiter.data(conn, chunk);
        this.checkSuccess(this.lastLineAt());
    }

    private scheduleRetry(): void {
        const s = this.settingsValue;
        if (!this.wantConnected || this.closed || !s || !this.nSesidValue) return;
        if (this.opts.arbiter.isEnding(this.nSesidValue)) {
            this.wantConnected = false;
            return;
        }
        if (!s.autoReconnect) return;
        const ms = s.reconnectMs ?? DEFAULT_RECONNECT_MS;
        this.nextAttemptAt = this.clock() + ms;
        this.retryTimer = setTimeout(() => this.dial(), ms);
        this.retryTimer.unref?.();
    }

    private cancelRetry(): void {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        this.retryTimer = null;
        this.nextAttemptAt = null;
    }

    /** Close the current socket on purpose (its close handler detaches it with `reason`). */
    private dropSocket(reason: string): void {
        const sock = this.socket;
        if (!sock) return;
        const conn = this.conn;
        this.socket = null;
        this.conn = null;
        const wasConnected = this.connected;
        this.connected = false;
        this.role = null;
        if (conn) {
            conn.close(reason);
            // Detach now, not on the socket's 'close' event: a replacement dial can connect first, and it must
            // not supersede this one (the journal records why the link was dropped). The later detach is a no-op.
            void this.opts.arbiter.detach(conn, reason);
        } else {
            sock.destroy();
        }
        if (wasConnected) this.log('disconnected', `Disconnected from transmitter (${reason})`, { peer: conn?.remote });
    }

    private log(kind: ConnectivityLogKind, message: string, extra: Partial<ConnectivityLogEntry> = {}): void {
        try {
            this.opts.onLog?.({ at: this.clock(), kind, message, nSesid: this.nSesidValue, ...extra });
        } catch {
            /* the log must never break the link */
        }
    }
}
