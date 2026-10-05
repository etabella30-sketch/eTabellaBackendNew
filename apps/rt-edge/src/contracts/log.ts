/**
 * Box settings → Status & troubleshooting → Connectivity Log (D34, DR12, spec §12.10).
 * Calm by design: retries collapse into one updating row, the list pauses while scrolled ("N new events"),
 * Problems is the default filter while the verdict is red, and the one delete is a super admin's "Clear log"
 * (`POST …/log/clear`, user decision 2026-10-04), which leaves one `log-cleared` row naming who cleared it.
 */

import type { EdgeActor } from './common';
import type { TransmitterProtocol } from './transmitter';

/** Filter chips: All · Problems · Transmitter · Cloud. */
export type ConnectivityLogFilter = 'all' | 'problems' | 'transmitter' | 'cloud';

/** The event column (RT local 3.0's Attempt / Connected / Disconnected / Error / Feed / Success, plus Retrying). */
export type ConnectivityLogEvent = 'attempt' | 'retrying' | 'connected' | 'disconnected' | 'error' | 'feed' | 'success';

export type ConnectivityLogSource = 'transmitter' | 'cloud' | 'network' | 'box';

/** What happened, for the FE's sentence ("Transmitter closed the connection after 29 min · 2,341 lines"). */
export type ConnectivityLogCode =
    // transmitter, dial mode
    | 'tx-dialing'
    | 'tx-refused'
    | 'tx-timeout'
    | 'tx-unreachable'
    | 'tx-connected'
    // transmitter, listen mode
    | 'tx-listen-connected'
    | 'tx-login-refused'
    | 'tx-lockout'
    | 'tx-held-peer'
    // transmitter, both
    | 'tx-peer-closed'
    | 'tx-reset'
    | 'tx-first-line'
    | 'tx-quiet'
    | 'tx-resumed'
    | 'tx-settings-applied'
    | 'tx-test'
    // cloud
    | 'cloud-connected'
    | 'cloud-disconnected'
    | 'cloud-catching-up'
    | 'cloud-synced'
    | 'cloud-refused'
    // network and box
    | 'internet-down'
    | 'internet-up'
    | 'disk-write-failed'
    | 'disk-write-restored'
    | 'clock-unsynced'
    | 'clock-synced'
    | 'box-started'
    | 'log-cleared';

/** Numbers the sentence needs; only the fields relevant to `code` are present. */
export interface ConnectivityLogData {
    readonly lines?: number;
    readonly pages?: number;
    readonly durationMs?: number;
    readonly lagSec?: number;
    /**
     * Socket error class: 'refused', 'timeout', 'unreachable', 'reset', 'dns', …; for a COM port 'not-found',
     * 'busy' (held by another program), 'missing-driver' (the serialport package is missing), 'timeout'.
     */
    readonly error?: string;
    readonly protocol?: TransmitterProtocol;
    /** The row is about the box's COM port ("Live data · COM port"); `peer` is then "COM3 @ 9600". */
    readonly serial?: boolean;
}

/** A collapsed run of retries ("refused · retrying since 10:31:08 · 63 tries", with "Show tries"). */
export interface ConnectivityLogRetry {
    readonly sinceMs: number;
    readonly tries: number;
    readonly lastError: string | null;
    /** Still retrying (the row keeps updating in place). */
    readonly active: boolean;
}

export interface ConnectivityLogRow {
    /** Stable: a collapsed retry row keeps its id while it updates. */
    readonly id: string;
    /** First event of the row. */
    readonly atMs: number;
    /** Last update (retry rows); equals `atMs` otherwise. */
    readonly updatedAtMs: number;
    readonly event: ConnectivityLogEvent;
    readonly source: ConnectivityLogSource;
    readonly code: ConnectivityLogCode;
    /** Listed under the Problems filter. */
    readonly problem: boolean;
    readonly nSesid: string | null;
    readonly sessionName: string | null;
    /**
     * The pinned IANA zone of the session the row names: its time is shown in that zone, with a short zone label beside
     * box-zone rows (user decision 2026-10-05). Null for box-level rows (box time zone), and when the session has no
     * zone or is no longer on the box. Taken from the session as the row is read, so the FE needs no session list.
     */
    readonly sessionTz: string | null;
    /** "192.168.20.31:8080" */
    readonly peer: string | null;
    /** Who acted, for `tx-settings-applied` / `tx-test` / `log-cleared` ("Log cleared by A. Jha"); null otherwise. */
    readonly actor: EdgeActor | null;
    readonly data: ConnectivityLogData;
    readonly retry: ConnectivityLogRetry | null;
}

/**
 * `GET /edge/local/ops/log` query — box admins.
 * - `before`: an opaque cursor from `nextBefore` → the next OLDER page;
 * - `after`: an opaque cursor from `newest` → rows created OR updated since (the "N new events" poll; a collapsed
 *   retry row that updated comes back with the same id);
 * - `day`: YYYY-MM-DD (box time zone), default today; `q`: case-insensitive text search; `limit` 1–200, default 50.
 */
export interface ConnectivityLogQuery {
    readonly filter?: ConnectivityLogFilter;
    readonly day?: string;
    readonly q?: string;
    readonly before?: string;
    readonly after?: string;
    readonly limit?: number;
}

export const CONNECTIVITY_LOG_DEFAULT_LIMIT = 50;
export const CONNECTIVITY_LOG_MAX_LIMIT = 200;

export interface ConnectivityLogPage {
    readonly msg: 1;
    readonly filter: ConnectivityLogFilter;
    readonly day: string;
    /** Newest first. Empty with no cursor = "No events today". */
    readonly rows: readonly ConnectivityLogRow[];
    /** Cursor for the next older page; null at the end. */
    readonly nextBefore: string | null;
    /** Cursor for polling newer rows; null when the day has no rows yet. */
    readonly newest: string | null;
    /** Days that have rows, newest first (the "Today ▾" menu). */
    readonly days: readonly string[];
}

/** One attempt inside a collapsed retry row. */
export interface ConnectivityLogTry {
    readonly atMs: number;
    readonly error: string | null;
    readonly peer: string | null;
}

/** `GET /edge/local/ops/log/:id/tries?before=&limit=` — "Show tries", newest first. Errors: `not_found` 404. */
export interface ConnectivityLogTriesPage {
    readonly msg: 1;
    readonly rowId: string;
    readonly rows: readonly ConnectivityLogTry[];
    readonly nextBefore: string | null;
}

/**
 * `POST /edge/local/ops/log/clear` (body `{}`) — "Clear log", SUPER ADMINS only (user decision 2026-10-04): every row
 * of every day goes, with its tries, and the log then holds ONE row, `code: 'log-cleared'` (`source: 'box'`,
 * `event: 'success'`) with `actor` = who cleared it. Cursors from before the clear stay valid: an `after` poll returns
 * that row under every filter and search (it passes them all), a `before` page is empty. A body with keys is
 * `invalid_request`. Errors: `not_box_admin` 403 for a case admin or an operator-code session, also
 * when `box.settingsAccess` lets them into Box settings.
 */
export interface ConnectivityLogClearResult {
    readonly msg: 1;
    /** Rows deleted (their tries are not counted). */
    readonly removed: number;
    /** The one row the log holds now. */
    readonly row: ConnectivityLogRow;
}
