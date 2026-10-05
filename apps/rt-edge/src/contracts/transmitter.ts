/**
 * Box settings → Transmitter (D34, DR13, DR16, §12.11) and the "Show to reporter" card (DR16, build default O-12).
 *
 * Two modes on the dedicated transmitter (CAT) network:
 * - `listen` — "Transmitter connects to box". Eclipse 12's realtime output is set to **"Connect to server"**:
 *   the reporter types this box's address, port 2500 and the per-session login. Protocol comes from the session.
 * - `dial` — "Box connects to transmitter" (RT local 3.0 way). Eclipse's output is set to **"Wait for connection"**:
 *   the box dials the reporter's laptop at host:port with the chosen protocol and reconnects every 3 s. No login.
 * - `serial` — "Live data · COM port" (new in 3.0). The CAT program writes its realtime output to a serial port; the
 *   box reads a COM port of its own computer (a cable, or a virtual COM pair) at the chosen baud rate, 8N1, and opens
 *   it again every 3 s while it is missing or held by another program. No login.
 * (libs/rt-ingest names: `TransmitterMode` 'listen' | 'dial' | 'serial'; `CatProtocol` 'B' = bridge, 'C' = caseview.)
 */

import type { EdgeActor } from './common';
import type { EdgeSessionPhase } from './local-cases';

export type TransmitterMode = 'listen' | 'dial' | 'serial';
export type TransmitterProtocol = 'bridge' | 'caseview';

/** Baud rates the COM port setting offers (libs/rt-ingest SERIAL_BAUD_RATES). */
export const TRANSMITTER_BAUD_RATES: readonly number[] = Object.freeze([1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]);
export const TRANSMITTER_DEFAULT_BAUD_RATE = 9600;

/** "COM3" … "COM999", or a device path (/dev/ttyUSB0) on a box that is not Windows. */
export function isSerialPortName(path: string): boolean {
    const p = String(path ?? '').trim();
    return /^COM([1-9]\d{0,2})$/i.test(p) || /^\/dev\/[A-Za-z0-9._/-]{1,64}$/.test(p);
}

/** Outbound modes: the box opens the link itself (Connect / Reconnect apply), as opposed to waiting for Eclipse. */
export function isOutboundMode(mode: TransmitterMode | null | undefined): mode is 'dial' | 'serial' {
    return mode === 'dial' || mode === 'serial';
}

/** Eclipse connects to this port on the box in listen mode (the cloud-direct port too). */
export const TRANSMITTER_LISTEN_PORT = 2500;
/** Dial mode reconnects this often while auto-reconnect is on ("Reconnect automatically every 3 s"). */
export const TRANSMITTER_RECONNECT_EVERY_SEC = 3;
/** A "Test only" run gives up after this long. */
export const TRANSMITTER_TEST_MAX_MS = 10_000;

/**
 * The transmitter → box link (operator chip middle segment, DR6; Transmitter status pill):
 * - `not-set-up`: dial mode without an address yet (first run);
 * - `waiting`: listen mode, Eclipse not connected yet; or dial mode with auto-reconnect off and idle;
 * - `connecting`: dial mode, attempt `attempt` in progress or scheduled ("Connecting (try 3)");
 * - `connected-no-session`: TCP link up but no live session receiving — "Connected · no live session yet.
 *   Lines appear in the transcript once <session> starts." (DR8);
 * - `live`: a line within `EDGE_TIMING.liveLineWindowMs`;
 * - `quiet`: connected, no line for longer (neutral up to `EDGE_TIMING.quietNeutralMs`, then `quietLevel:'warn'`);
 * - `disconnected`: the link dropped after having been up (feed stopped).
 * Listen mode with several live sessions: the box-wide segment shows the worst of their connections.
 */
export type TransmitterLinkState = 'not-set-up' | 'waiting' | 'connecting' | 'connected-no-session' | 'live' | 'quiet' | 'disconnected';

/** Box admins only (it carries the transmitter IP, DR6). */
export interface TransmitterLinkStatus {
    readonly state: TransmitterLinkState;
    readonly mode: TransmitterMode;
    /** The protocol of the live connection; null while not connected. */
    readonly protocol: TransmitterProtocol | null;
    /** When `state` began. */
    readonly sinceMs: number | null;
    /** `connecting` only: the try number. */
    readonly attempt: number | null;
    /** `quiet` only. */
    readonly quietLevel: 'neutral' | 'warn' | null;
    /**
     * "192.168.20.31:8080" — the transmitter (dial) or the Eclipse laptop (listen), while connected; serial: the
     * configured port "COM3 @ 9600" in every state but `not-set-up`, open or not (user decision 2026-10-04: the row
     * must say which port the box is trying exactly when it is not open).
     */
    readonly peer: string | null;
    readonly bytesIn: number;
    readonly lastLineAtMs: number | null;
    /** The session the link currently feeds. */
    readonly receivingSesid: string | null;
    /** Second CAT connections held, never parsed (spec §3.2; P1 alert). */
    readonly heldPeers: number;
    /**
     * Listen mode: Eclipse login locked out after wrong passwords. The lock is timed and lifts by itself after 5 min
     * (libs/rt-ingest lockout.ts `blockMs`); there is no unlock on the cloud.
     */
    readonly lockout: boolean;
}

/**
 * Saved transmitter settings. `host` and `port` apply to dial mode, `serialPath` and `baudRate` to serial mode;
 * `protocol`, `autoReconnect` and `receivingSesid` to both. Settings stored before serial mode existed have no
 * `serialPath` / `baudRate` (read as null).
 */
export interface TransmitterSettings {
    readonly mode: TransmitterMode;
    readonly protocol: TransmitterProtocol | null;
    /** "Reporter network address": the reporter laptop's IPv4 on the transmitter network. */
    readonly host: string | null;
    /** 1–65535. */
    readonly port: number | null;
    /** Serial mode: the box's COM port ("COM3"). */
    readonly serialPath?: string | null;
    /** Serial mode: one of TRANSMITTER_BAUD_RATES. */
    readonly baudRate?: number | null;
    readonly autoReconnect: boolean;
    /** "Session receiving this transcript"; null = automatic (the one live session bound to the box). */
    readonly receivingSesid: string | null;
}

export type TransmitterField = keyof TransmitterSettings;

/**
 * The settings with `serialPath` / `baudRate` present only when they are set: stored rows and replies of settings that
 * use no COM port keep exactly the shape they had before COM ports existed.
 */
export function compactSerialFields(settings: TransmitterSettings): TransmitterSettings {
    const { serialPath, baudRate, ...rest } = settings;
    return {
        ...rest,
        ...(serialPath !== null && serialPath !== undefined ? { serialPath } : {}),
        ...(baudRate !== null && baudRate !== undefined ? { baudRate } : {}),
    };
}

/** Inline validation (DR13: IPv4, port 1–65535; a COM port name and a listed baud rate). */
export type TransmitterFieldErrorCode = 'required' | 'ipv4' | 'port-range' | 'unknown-session' | 'serial-path' | 'baud-rate';

export type TransmitterFieldErrors = { readonly [K in TransmitterField]?: TransmitterFieldErrorCode };

/** Dotted-quad IPv4, each part 0–255, no leading zeros. */
export function isIpv4(host: string): boolean {
    const parts = String(host ?? '').trim().split('.');
    if (parts.length !== 4) return false;
    return parts.every(p => /^(0|[1-9]\d{0,2})$/.test(p) && Number(p) <= 255);
}

/**
 * The same validation on both sides. Listen mode needs nothing else. Dial mode needs a protocol, an IPv4 host and a
 * port 1–65535; serial mode a protocol, a COM port and a listed baud rate. `receivingSesid`, when set, must be one of
 * `knownSessionIds` (when given).
 */
export function validateTransmitterSettings(settings: TransmitterSettings, knownSessionIds?: readonly string[]): TransmitterFieldErrors {
    const errors: { [K in TransmitterField]?: TransmitterFieldErrorCode } = {};
    if (!isOutboundMode(settings.mode)) return errors;
    if (settings.protocol !== 'bridge' && settings.protocol !== 'caseview') errors.protocol = 'required';
    if (settings.mode === 'dial') {
        if (settings.host === null || settings.host === undefined || String(settings.host).trim() === '') errors.host = 'required';
        else if (!isIpv4(settings.host)) errors.host = 'ipv4';
        if (settings.port === null || settings.port === undefined) errors.port = 'required';
        else if (!Number.isInteger(settings.port) || settings.port < 1 || settings.port > 65535) errors.port = 'port-range';
    } else {
        if (settings.serialPath === null || settings.serialPath === undefined || String(settings.serialPath).trim() === '') errors.serialPath = 'required';
        else if (!isSerialPortName(settings.serialPath)) errors.serialPath = 'serial-path';
        if (settings.baudRate === null || settings.baudRate === undefined) errors.baudRate = 'required';
        else if (!TRANSMITTER_BAUD_RATES.includes(settings.baudRate)) errors.baudRate = 'baud-rate';
    }
    if (settings.receivingSesid && knownSessionIds && !knownSessionIds.includes(settings.receivingSesid)) {
        errors.receivingSesid = 'unknown-session';
    }
    return errors;
}

/**
 * The changes in `next` that would interrupt a live feed (DR13 guard): a mode change; in dial mode a change of
 * protocol, address, port or receiving session; in serial mode of protocol, COM port, baud rate or receiving session;
 * in both, turning auto-reconnect off. Listen-mode field edits never interrupt (those fields are unused there).
 * Fields in `TransmitterSettings` order.
 */
export function transmitterInterruptingChanges(now: TransmitterSettings | null, next: TransmitterSettings): TransmitterField[] {
    if (!now) return [];
    if (now.mode !== next.mode) return ['mode'];
    if (!isOutboundMode(next.mode)) return [];
    const changes: TransmitterField[] = [];
    if (now.protocol !== next.protocol) changes.push('protocol');
    if (next.mode === 'dial') {
        if (now.host !== next.host) changes.push('host');
        if (now.port !== next.port) changes.push('port');
    } else {
        if ((now.serialPath ?? null) !== (next.serialPath ?? null)) changes.push('serialPath');
        if ((now.baudRate ?? null) !== (next.baudRate ?? null)) changes.push('baudRate');
    }
    if (now.autoReconnect && !next.autoReconnect) changes.push('autoReconnect');
    if (now.receivingSesid !== next.receivingSesid) changes.push('receivingSesid');
    return changes;
}

/** A session the "Session receiving this transcript" picker offers. */
export interface TransmitterSessionOption {
    readonly nSesid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly phase: EdgeSessionPhase;
    readonly isToday: boolean;
    /** The session's pinned IANA zone (its times are shown in it; user decision 2026-10-05); null when it has none. */
    readonly tz: string | null;
}

/** What a reporter needs for listen mode ("Address for people in the room" is the box hostname, not this). */
export interface TransmitterListenInfo {
    /** The box's IPv4 on the transmitter network: "Server address" on the reporter card. */
    readonly boxTransmitterAddress: string | null;
    readonly port: number;
}

/** Which buttons the Transmitter page shows (DR13). */
export interface TransmitterActions {
    /** The one primary "Connect": dial or serial mode, applied settings, link not up. */
    readonly connect: boolean;
    /** "Test only": only while nothing is connected or retrying. */
    readonly testOnly: boolean;
    /** "Reconnect" (shown in the verdict, not here): dial or serial mode and the link is down. */
    readonly reconnect: boolean;
}

/** "Applied 09:12 by P. Shah" */
export interface TransmitterApplied {
    readonly atMs: number;
    readonly by: EdgeActor;
}

/**
 * `GET /edge/local/ops/transmitter` — box admins.
 * `stateVersion` increases whenever the applied settings change AND whenever the link's connection changes
 * (connect, disconnect, a new connection). It does not move on bytes or lines. Every write names the version it
 * was based on, and the box refuses a stale one with `state_changed` ("The connection changed while you were
 * editing. Review again.", DR13).
 */
export interface TransmitterStateResponse {
    readonly msg: 1;
    readonly stateVersion: number;
    /** Null on first run (nothing applied yet): the page shows the mode question and no address. */
    readonly settings: TransmitterSettings | null;
    readonly applied: TransmitterApplied | null;
    readonly link: TransmitterLinkStatus;
    readonly sessions: readonly TransmitterSessionOption[];
    readonly listen: TransmitterListenInfo;
    readonly actions: TransmitterActions;
}

/**
 * `PUT /edge/local/ops/transmitter` — "Apply…" (edits are a draft until applied, DR13).
 * The box re-checks on every call: a stale `stateVersion` → `state_changed` 409 {stateVersion}; invalid fields →
 * `invalid_settings` 400 {fields}; an interrupting change (`transmitterInterruptingChanges`) while the link is up and
 * `confirmInterrupt` is false → `confirm_required` 409 {guard} (the FE shows the guard, then resends with true).
 * 200 replies the new `TransmitterStateResponse`. Audited.
 */
export interface TransmitterApplyRequest {
    readonly stateVersion: number;
    readonly settings: TransmitterSettings;
    readonly confirmInterrupt: boolean;
}

/** What the one guard dialog shows (DR13, wireframe frame 12). */
export interface TransmitterGuard {
    /** The session receiving lines now; null when connected without a live session. */
    readonly session: { readonly nSesid: string; readonly sessionName: string; readonly caseName: string } | null;
    readonly lastLineAtMs: number | null;
    /** Current connection, "192.168.20.31:8080". */
    readonly peer: string | null;
    readonly now: TransmitterSettings;
    readonly after: TransmitterSettings;
    readonly changes: readonly TransmitterField[];
    readonly stateVersion: number;
}

/**
 * Body of `POST /edge/local/ops/transmitter/connect` ("Connect": start the link with the APPLIED settings) and
 * `POST /edge/local/ops/transmitter/reconnect` ("Reconnect", from the verdict, only while the link is down).
 * Both reply `TransmitterStateResponse`. Errors: `state_changed`, `not_dial_mode` (listen mode: nothing to connect),
 * `not_configured`, `already_connected` (connect), `link_up` (reconnect). Audited.
 */
export interface TransmitterVersionRequest {
    readonly stateVersion: number;
}

/**
 * `POST /edge/local/ops/transmitter/test` — "Test only" with the DRAFT setting (nothing is applied). Refused with
 * `test_refused_busy` 409 {linkState} while anything is connected, retrying or capturing (DR13). Audited.
 * `mode` 'serial' tests a COM port (`serialPath`, `baudRate`); absent or 'dial' tests `host`:`port`.
 */
export interface TransmitterTestRequest {
    readonly protocol: TransmitterProtocol;
    readonly mode?: 'dial' | 'serial';
    readonly host?: string;
    readonly port?: number;
    readonly serialPath?: string;
    readonly baudRate?: number;
}

/**
 * - `data`: connected (or the COM port opened) and bytes arrived (`protocolSeen` says which);
 * - `connected-no-data`: connected / opened, nothing within the test window (Eclipse output not started?);
 * - `refused` / `timeout` / `unreachable`: no TCP connection;
 * - `port-not-found`: no such COM port on the box (unplugged, wrong number);
 * - `port-busy`: another program holds the COM port;
 * - `protocol-mismatch`: bytes arrived in the other protocol.
 */
export type TransmitterTestResult = 'data' | 'connected-no-data' | 'refused' | 'timeout' | 'unreachable' | 'port-not-found' | 'port-busy' | 'protocol-mismatch';

/** One COM port of the box's computer ("Port" list in the COM port setting). */
export interface TransmitterSerialPort {
    /** "COM3" */
    readonly path: string;
    /** "Prolific USB-to-Serial Comm Port (COM3)"; null when the system gives none. */
    readonly friendlyName: string | null;
    readonly manufacturer: string | null;
}

/**
 * `GET /edge/local/ops/transmitter/serial-ports` — box admins. The COM ports of the box's computer, COM1 first.
 * `error` says why the list is empty when it could not be read (`serial_unavailable`: the serialport package is
 * missing from the box; `list_failed`: the system refused); the page then lets the admin type a port.
 */
export interface TransmitterSerialPortsResponse {
    readonly msg: 1;
    readonly ports: readonly TransmitterSerialPort[];
    readonly error: 'serial_unavailable' | 'list_failed' | null;
}

export interface TransmitterTestResponse {
    readonly msg: 1;
    readonly result: TransmitterTestResult;
    readonly protocolSeen: TransmitterProtocol | null;
    readonly bytes: number;
    readonly durationMs: number;
}

/**
 * `POST /edge/local/ops/reporter-card` — "Show to reporter" (DR16): full-screen, large type, one per session.
 * POST because opening it is logged (audit row with who and when). Errors: `session_not_found` 404.
 */
export interface ReporterCardRequest {
    readonly nSesid: string;
}

export interface ReporterCardResponse {
    readonly msg: 1;
    readonly nSesid: string;
    readonly sessionName: string;
    readonly caseName: string;
    /** The box's address on the transmitter network ("Server address"). */
    readonly serverAddress: string | null;
    readonly port: number;
    /** The session's Eclipse username. */
    readonly username: string;
    /**
     * O-12 build default: null. The box holds only the scrypt hash, so the card says "Use the password shown in
     * RT Production when the session was created". A string only if `features.reporterPasswordOnBox` is turned on.
     */
    readonly password: string | null;
    readonly passwordSource: 'rt-production' | 'box';
    /** The current transmitter mode; the card is meant for listen mode ("Connect to server"). */
    readonly mode: TransmitterMode;
    readonly openedAtMs: number;
}
