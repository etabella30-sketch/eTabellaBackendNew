/**
 * Serial mode, "Live data · COM port": the box reads the reporter's CAT output from a serial (COM) port on its own
 * computer (a cable from the reporter's laptop, or a virtual COM pair). New in 3.0: RT local had TCP/IP only.
 *
 *  - Settings: protocol Bridge / CaseView, the port ("COM3" on Windows, "/dev/ttyUSB0" elsewhere) and its baud rate.
 *    The frame is fixed at 8 data bits, no parity, 1 stop bit, no flow control: what CAT serial output uses.
 *  - Behaves like the dialer (cat-dialer.ts) towards the kernel: one primary Connect, Reconnect, Disconnect, auto
 *    re-open every 3 s while the port is missing or busy, a state version that moves on every settings / binding /
 *    connection change, and the same Connectivity Log entries.
 *  - Feeds the bound live session through the same FeedArbiter / journal / parser lane; every opening of the port
 *    is bracketed by its own CONN_OPEN (no user) / CONN_CLOSE.
 *  - Test only: opens the port, reports within the window whether bytes arrived and in which protocol, closes it.
 *    Never feeds a session, and is refused while the reader holds the port or is retrying.
 *
 * The `serialport` package (native bindings) is loaded only when a port is actually opened or listed, so the cloud
 * and the specs never need it.
 */
import { CatConnection, FeedArbiter } from './feed-arbiter';
import { ConnectivityLogEntry, ConnectivityLogKind, DEFAULT_RECONNECT_MS, DialProtocol } from './cat-dialer';
import { CatProtocol, catProtocolOf, Clock, newConnId, normalizePeer, systemClock } from './types';

/** Baud rates a CAT program offers for serial output. */
export const SERIAL_BAUD_RATES: readonly number[] = Object.freeze([1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]);
export const DEFAULT_SERIAL_BAUD_RATE = 9600;

export interface SerialSettings {
    protocol: DialProtocol;
    /** "COM3" (Windows) or a device path ("/dev/ttyUSB0") */
    path: string;
    baudRate: number;
    autoReconnect: boolean;
    /** re-open interval (default 3000 ms) */
    reconnectMs?: number;
}

/** The part of a `serialport` SerialPort the reader uses (a fake one in specs). */
export interface SerialPortLike {
    readonly isOpen: boolean;
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: (error?: Error | null) => void): this;
    once(event: 'open', listener: () => void): this;
    removeAllListeners(event?: string): this;
    close(callback?: (error?: Error | null) => void): void;
}

export interface SerialOpenOptions {
    readonly path: string;
    readonly baudRate: number;
}

/** Opens the port asynchronously: it emits 'open' once usable, or 'error' when it cannot be opened. */
export type OpenSerialPort = (opts: SerialOpenOptions) => SerialPortLike;

/** One serial port of the computer, as the box's settings page lists it. */
export interface SerialPortInfo {
    /** "COM3" */
    readonly path: string;
    /** "Prolific USB-to-Serial Comm Port (COM3)"; null when the system gives none */
    readonly friendlyName: string | null;
    readonly manufacturer: string | null;
}

interface SerialPortModule {
    SerialPort: {
        new (opts: Record<string, unknown>): SerialPortLike;
        list(): Promise<Array<{ path: string; friendlyName?: string; manufacturer?: string; pnpId?: string }>>;
    };
}

let serialModule: SerialPortModule | null = null;

function loadSerialport(): SerialPortModule {
    if (!serialModule) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            serialModule = require('serialport') as SerialPortModule;
        } catch {
            throw Object.assign(new Error('the serialport package is not installed on this computer'), { code: 'ESERIALMISSING' });
        }
    }
    return serialModule;
}

/** The real port: 8N1, no flow control, an exclusive lock (a second program cannot read it at the same time). */
export const openSystemSerialPort: OpenSerialPort = ({ path, baudRate }) =>
    new (loadSerialport().SerialPort)({ path, baudRate, dataBits: 8, parity: 'none', stopBits: 1, rtscts: false, xon: false, xoff: false, lock: true, autoOpen: true });

/** The computer's serial ports, sorted COM1, COM2 … COM10 (numbers in order). Empty when none or when listing fails. */
export async function listSystemSerialPorts(): Promise<SerialPortInfo[]> {
    const ports = await loadSerialport().SerialPort.list();
    const num = (p: string) => Number(/(\d+)$/.exec(p)?.[1] ?? Number.MAX_SAFE_INTEGER);
    return ports
        .filter(p => typeof p.path === 'string' && p.path.trim())
        .map(p => ({ path: p.path.trim(), friendlyName: p.friendlyName?.trim() || null, manufacturer: p.manufacturer?.trim() || null }))
        .sort((a, b) => num(a.path) - num(b.path) || a.path.localeCompare(b.path));
}

/** "COM3" … "COM256", or a device path (/dev/ttyS0, /dev/ttyUSB0, /dev/tty.usbserial-1410). */
export function isSerialPath(path: string): boolean {
    const p = String(path ?? '').trim();
    return /^COM([1-9]\d{0,2})$/i.test(p) || /^\/dev\/[A-Za-z0-9._/-]{1,64}$/.test(p);
}

/** "COM3" stays as typed but upper-case; device paths are kept as they are. */
export function normalizeSerialPath(path: string): string {
    const p = String(path ?? '').trim();
    return /^com\d+$/i.test(p) ? p.toUpperCase() : p;
}

export function validateSerialSettings(s: SerialSettings | null | undefined): string[] {
    const errors: string[] = [];
    if (!s || typeof s !== 'object') return ['settings are required'];
    if (s.protocol !== 'bridge' && s.protocol !== 'caseview') errors.push("protocol must be 'bridge' or 'caseview'");
    if (!isSerialPath(s.path)) errors.push('path must be a COM port (COM1-COM999) or a /dev path');
    if (!SERIAL_BAUD_RATES.includes(s.baudRate)) errors.push(`baudRate must be one of ${SERIAL_BAUD_RATES.join(', ')}`);
    if (typeof s.autoReconnect !== 'boolean') errors.push('autoReconnect must be true or false');
    if (s.reconnectMs !== undefined && (!Number.isInteger(s.reconnectMs) || s.reconnectMs < 100 || s.reconnectMs > 600_000)) errors.push('reconnectMs must be 100-600000');
    return errors;
}

/**
 * A port error → the Connectivity Log's class: `not-found` (no such port: unplugged, wrong number), `busy` (another
 * program holds it, for example the CAT program reading its own end), else `error`.
 */
export function serialErrorClass(error: unknown): 'not-found' | 'busy' | 'missing-driver' | 'error' {
    const e = error as { code?: string; message?: string } | null;
    const text = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
    if (e?.code === 'ESERIALMISSING') return 'missing-driver';
    if (/file not found|cannot find|no such file|enoent|does not exist|not found/.test(text)) return 'not-found';
    if (/access denied|in use|busy|ebusy|resource temporarily unavailable|cannot lock|eacces|permission/.test(text)) return 'busy';
    return 'error';
}

export type SerialState = 'not-set-up' | 'connecting' | 'live' | 'quiet' | 'disconnected';

export interface SerialStatus {
    state: SerialState;
    /** attempt number of the current (re)open cycle; 0 once open or idle */
    attempt: number;
    /**
     * The configured port, "COM3 @ 9600", open or not (`connected` says which; user decision 2026-10-04: the box must
     * name the port it is trying exactly while it is not open); null before settings.
     */
    peer: string | null;
    bytes: number;
    lastByteAt: number | null;
    lastLineAt: number | null;
    version: number;
    settings: SerialSettings | null;
    nSesid: string | null;
    connected: boolean;
    retrying: boolean;
    role: 'active' | 'held' | null;
    connectedAt: number | null;
    nextAttemptAt: number | null;
    lastError: string | null;
    testing: boolean;
}

export type SerialApplyResult =
    | { ok: true; version: number }
    | { ok: false; reason: 'stale' | 'invalid' | 'closed'; version: number; errors?: string[] };

export type SerialCommandResult =
    | { ok: true; version: number }
    | { ok: false; reason: 'not-set-up' | 'session-ending' | 'testing' | 'closed'; version: number };

export interface CatSerialOptions {
    arbiter: FeedArbiter;
    clock?: Clock;
    onLog?: (entry: ConnectivityLogEntry) => void;
    /** an open that neither opened nor failed within this long counts as failed (default 5 s) */
    openTimeoutMs?: number;
    /** open but silent this long = 'quiet' (default 2 min) */
    quietMs?: number;
    openPort?: OpenSerialPort;
    settings?: SerialSettings | null;
    nSesid?: string | null;
}

class SerialConnection implements CatConnection {
    readonly connId = newConnId('serial');
    readonly mode = 'serial' as const;
    closedReason: string | null = null;

    constructor(
        private readonly port: SerialPortLike,
        /** the single-active rule compares this: the port name, normalized as every peer is ("com3") */
        readonly peer: string,
        /** "COM3 @ 9600" */
        readonly remote: string,
        readonly protocolHint: CatProtocol,
    ) {}

    close(reason: string): void {
        if (!this.closedReason) this.closedReason = reason;
        closeQuietly(this.port);
    }
}

function closeQuietly(port: SerialPortLike): void {
    try {
        if (port.isOpen) port.close(() => undefined);
    } catch {
        /* already closing */
    }
}

type Coarse = 'not-set-up' | 'connecting' | 'connected' | 'disconnected';

export class CatSerial {
    private readonly opts: CatSerialOptions;
    private readonly clock: Clock;
    private readonly openPort: OpenSerialPort;

    private settingsValue: SerialSettings | null;
    private nSesidValue: string | null;
    private versionValue = 1;
    private coarse: Coarse;

    private wantConnected = false;
    private port: SerialPortLike | null = null;
    private conn: SerialConnection | null = null;
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
    private repinPending = true;
    private testing = false;
    private closed = false;

    constructor(opts: CatSerialOptions) {
        this.opts = opts;
        this.clock = opts.clock ?? systemClock;
        this.openPort = opts.openPort ?? openSystemSerialPort;
        this.settingsValue = opts.settings ? { ...opts.settings, path: normalizeSerialPath(opts.settings.path) } : null;
        this.nSesidValue = opts.nSesid ?? null;
        if (this.settingsValue && validateSerialSettings(this.settingsValue).length) this.settingsValue = null;
        this.coarse = this.computeCoarse();
    }

    get version(): number {
        return this.versionValue;
    }

    get settings(): SerialSettings | null {
        return this.settingsValue ? { ...this.settingsValue } : null;
    }

    get nSesid(): string | null {
        return this.nSesidValue;
    }

    status(): SerialStatus {
        const lastLineAt = this.lastLineAt();
        this.checkSuccess(lastLineAt);
        const s = this.settingsValue;
        return {
            state: this.state(),
            attempt: this.attempt,
            peer: this.connected && this.conn ? this.conn.remote : s ? `${s.path} @ ${s.baudRate}` : null,
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

    /** New settings and/or receiving session, guarded by the state version (as the dialer's `apply`). */
    apply(change: { settings?: SerialSettings | null; nSesid?: string | null }, expectedVersion: number): SerialApplyResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (expectedVersion !== this.versionValue) return { ok: false, reason: 'stale', version: this.versionValue };
        const next = change.settings === undefined ? this.settingsValue : change.settings ? { ...change.settings, path: normalizeSerialPath(change.settings.path) } : null;
        if (next) {
            const errors = validateSerialSettings(next);
            if (errors.length) return { ok: false, reason: 'invalid', version: this.versionValue, errors };
        }
        const nextSesid = change.nSesid === undefined ? this.nSesidValue : change.nSesid;
        const prev = this.settingsValue;
        const linkChanged = !prev || !next || prev.path !== next.path || prev.baudRate !== next.baudRate || prev.protocol !== next.protocol;
        const sessionChanged = nextSesid !== this.nSesidValue;
        this.settingsValue = next;
        this.nSesidValue = nextSesid;
        this.versionValue += 1;
        if (linkChanged || sessionChanged) this.repinPending = true;

        if (!next || !nextSesid) {
            this.wantConnected = false;
            this.cancelRetry();
            this.dropPort(sessionChanged ? 'session-changed' : 'settings-changed');
        } else if (linkChanged || sessionChanged) {
            const wasActive = this.wantConnected;
            this.cancelRetry();
            this.dropPort(sessionChanged ? 'session-changed' : 'settings-changed');
            if (wasActive) {
                this.attempt = 0;
                this.open();
            }
        } else if (!next.autoReconnect && this.retryTimer) {
            this.cancelRetry();
        }
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** Open the port now and keep it open (re-open per settings). */
    connect(): SerialCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (!this.settingsValue || !this.nSesidValue) return { ok: false, reason: 'not-set-up', version: this.versionValue };
        if (this.opts.arbiter.isEnding(this.nSesidValue)) return { ok: false, reason: 'session-ending', version: this.versionValue };
        if (this.testing) return { ok: false, reason: 'testing', version: this.versionValue };
        this.wantConnected = true;
        this.bytes = 0;
        this.versionValue += 1;
        if (!this.port && !this.retryTimer) {
            this.attempt = 0;
            this.open();
        }
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** Close the port (if open) and open it again at once. */
    reconnect(): SerialCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        if (!this.settingsValue || !this.nSesidValue) return { ok: false, reason: 'not-set-up', version: this.versionValue };
        if (this.opts.arbiter.isEnding(this.nSesidValue)) return { ok: false, reason: 'session-ending', version: this.versionValue };
        if (this.testing) return { ok: false, reason: 'testing', version: this.versionValue };
        this.wantConnected = true;
        this.cancelRetry();
        this.dropPort('manual-reconnect');
        this.attempt = 0;
        this.versionValue += 1;
        this.open();
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    disconnect(reason = 'disconnect'): SerialCommandResult {
        if (this.closed) return { ok: false, reason: 'closed', version: this.versionValue };
        this.wantConnected = false;
        this.cancelRetry();
        this.dropPort(reason);
        this.attempt = 0;
        this.versionValue += 1;
        this.syncCoarse();
        return { ok: true, version: this.versionValue };
    }

    /** True while the reader holds the port, is opening it or waits to retry (a test must not open it then). */
    busy(): boolean {
        return !!this.port || !!this.retryTimer || this.connected || this.testing;
    }

    async close(): Promise<void> {
        if (this.closed) return;
        this.wantConnected = false;
        this.cancelRetry();
        this.dropPort('shutdown');
        this.closed = true;
    }

    // -------------------------------------------------------------------

    private state(): SerialState {
        const coarse = this.computeCoarse();
        if (coarse !== 'connected') return coarse;
        const since = this.lastByteAt ?? this.connectedAt ?? this.clock();
        return this.clock() - since >= (this.opts.quietMs ?? 120_000) ? 'quiet' : 'live';
    }

    private computeCoarse(): Coarse {
        if (!this.settingsValue || !this.nSesidValue) return 'not-set-up';
        if (this.connected) return 'connected';
        if (this.wantConnected && (this.port || this.retryTimer)) return 'connecting';
        return 'disconnected';
    }

    private syncCoarse(): void {
        const next = this.computeCoarse();
        if (next !== this.coarse) {
            this.coarse = next;
            this.versionValue += 1;
        }
    }

    private isRetrying(): boolean {
        return this.wantConnected && !this.connected && (!!this.port || !!this.retryTimer);
    }

    private lastLineAt(): number | null {
        if (!this.nSesidValue) return null;
        return this.opts.arbiter.worker(this.nSesidValue)?.lastLineAt ?? null;
    }

    private checkSuccess(lastLineAt: number | null): void {
        if (this.successLogged || !this.connected || this.connectedAt === null || lastLineAt === null) return;
        if (lastLineAt >= this.connectedAt) {
            this.successLogged = true;
            this.log('success', `Lines arriving from ${this.conn?.remote ?? 'the COM port'}`, { peer: this.conn?.remote });
        }
    }

    private open(): void {
        const settings = this.settingsValue;
        const nSesid = this.nSesidValue;
        if (!settings || !nSesid || this.closed || !this.wantConnected) return;
        this.retryTimer = null;
        this.nextAttemptAt = null;
        this.attempt += 1;
        const attempt = this.attempt;
        const { path, baudRate } = settings;
        const label = `${path} @ ${baudRate}`;
        this.log('attempt', `Opening ${label} (attempt ${attempt})`, { attempt, peer: label, collapseKey: 'serial-retry' });

        let port: SerialPortLike;
        try {
            port = this.openPort({ path, baudRate });
        } catch (error) {
            // the package is missing, or the opener refused the options outright
            this.lastError = serialErrorClass(error);
            this.log('error', `${label}: ${this.lastError}`, { peer: label, attempt, collapseKey: 'serial-retry' });
            this.scheduleRetry();
            this.syncCoarse();
            return;
        }
        this.port = port;
        let opened = false;
        let openTimer: NodeJS.Timeout | null = setTimeout(() => {
            openTimer = null;
            if (!opened && this.port === port) {
                this.lastError = 'timeout';
                this.log('error', `${label}: timeout`, { peer: label, attempt, collapseKey: 'serial-retry' });
                this.forgetPort(port, null);
            }
        }, this.opts.openTimeoutMs ?? 5_000);
        openTimer.unref?.();

        let pending: Buffer[] | null = [];
        let conn: SerialConnection | null = null;

        port.once('open', () => {
            opened = true;
            if (openTimer) clearTimeout(openTimer);
            openTimer = null;
            if (this.port !== port) {
                closeQuietly(port);
                return;
            }
            conn = new SerialConnection(port, normalizePeer(path), label, catProtocolOf(settings.protocol));
            this.conn = conn;
            this.connected = true;
            this.connectedAt = this.clock();
            this.attempt = 0;
            this.lastError = null;
            this.firstFeedLogged = false;
            this.successLogged = false;
            this.log('connected', `Opened ${label}`, { peer: label, attempt });
            this.syncCoarse();

            const thisConn = conn;
            if (this.repinPending) {
                this.repinPending = false;
                void this.opts.arbiter.repin(nSesid, { peer: path }, 'transmitter-settings');
            }
            void this.opts.arbiter.attach(nSesid, thisConn).then(res => {
                if (this.port !== port || thisConn.closedReason) {
                    if (res.status !== 'refused') void this.opts.arbiter.detach(thisConn, thisConn.closedReason ?? 'port-closed');
                    pending = null;
                    return;
                }
                if (res.status === 'refused') {
                    pending = null;
                    this.lastError = `refused: ${res.reason}`;
                    this.log('error', `Session ${nSesid} refused the COM port feed (${res.reason})`, { peer: label });
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

        port.on('data', (chunk: Buffer) => {
            if (this.port !== port || !conn || !chunk?.length) return;
            this.bytes += chunk.length;
            this.lastByteAt = this.clock();
            if (!this.firstFeedLogged) {
                this.firstFeedLogged = true;
                this.log('feed', `First bytes from ${label}`, { peer: label });
            }
            if (pending) pending.push(chunk);
            else this.route(conn, chunk);
        });

        port.on('error', (error: Error) => {
            const cls = serialErrorClass(error);
            if (this.port === port) this.lastError = cls;
            if (conn && !conn.closedReason) conn.closedReason = `error:${cls}`;
            this.log('error', `${label}: ${cls}`, { peer: label, attempt, collapseKey: opened ? undefined : 'serial-retry' });
            // An open that failed never emits 'close': give up on this port object and schedule the next try.
            if (!opened) {
                if (openTimer) clearTimeout(openTimer);
                openTimer = null;
                this.forgetPort(port, conn);
            }
        });

        port.on('close', (error?: Error | null) => {
            if (openTimer) clearTimeout(openTimer);
            openTimer = null;
            if (conn && !conn.closedReason) conn.closedReason = error ? `error:${serialErrorClass(error)}` : 'port-closed';
            pending = null;
            this.forgetPort(port, conn);
        });
    }

    /** The port object is done (closed, or failed to open): detach its connection and retry when wanted. */
    private forgetPort(port: SerialPortLike, conn: SerialConnection | null): void {
        if (conn) void this.opts.arbiter.detach(conn, conn.closedReason ?? 'port-closed');
        port.removeAllListeners('data');
        closeQuietly(port);
        if (this.port !== port) return;
        const wasConnected = this.connected;
        const label = this.settingsValue ? `${this.settingsValue.path} @ ${this.settingsValue.baudRate}` : undefined;
        this.port = null;
        this.conn = null;
        this.connected = false;
        this.role = null;
        if (wasConnected) this.log('disconnected', `Closed ${label ?? 'the COM port'}${conn?.closedReason ? ` (${conn.closedReason})` : ''}`, { peer: label });
        this.scheduleRetry();
        this.syncCoarse();
    }

    private route(conn: SerialConnection, chunk: Buffer): void {
        this.opts.arbiter.data(conn, chunk);
        this.checkSuccess(this.lastLineAt());
    }

    private scheduleRetry(): void {
        const s = this.settingsValue;
        if (!this.wantConnected || this.closed || !s || !this.nSesidValue || this.retryTimer) return;
        if (this.opts.arbiter.isEnding(this.nSesidValue)) {
            this.wantConnected = false;
            return;
        }
        if (!s.autoReconnect) return;
        const ms = s.reconnectMs ?? DEFAULT_RECONNECT_MS;
        this.nextAttemptAt = this.clock() + ms;
        this.retryTimer = setTimeout(() => this.open(), ms);
        this.retryTimer.unref?.();
    }

    private cancelRetry(): void {
        if (this.retryTimer) clearTimeout(this.retryTimer);
        this.retryTimer = null;
        this.nextAttemptAt = null;
    }

    /** Close the port on purpose (its connection is detached now with `reason`). */
    private dropPort(reason: string): void {
        const port = this.port;
        if (!port) return;
        const conn = this.conn;
        this.port = null;
        this.conn = null;
        const wasConnected = this.connected;
        this.connected = false;
        this.role = null;
        port.removeAllListeners('data');
        if (conn) {
            conn.close(reason);
            void this.opts.arbiter.detach(conn, reason);
        } else {
            closeQuietly(port);
        }
        if (wasConnected) this.log('disconnected', `Closed ${conn?.remote ?? 'the COM port'} (${reason})`, { peer: conn?.remote });
    }

    private log(kind: ConnectivityLogKind, message: string, extra: Partial<ConnectivityLogEntry> = {}): void {
        try {
            this.opts.onLog?.({ at: this.clock(), kind, message, nSesid: this.nSesidValue, ...extra });
        } catch {
            /* the log must never break the link */
        }
    }
}
