/**
 * Box settings → Status & troubleshooting tiles: network checks (D34, DR16), "this box" details (also the login
 * screen's admin-only "Box details", DR5) and "Download diagnostics" (D34, spec §12 runbook step 7).
 */

import type { EdgeCheckLevel } from './common';

/**
 * Network checks (D34): the box's two addresses (DR16 wording: "Address for people in the room" is the hearing
 * network hostname/IP; "Reporter network address" belongs to the transmitter, so the box's own address on that
 * network is `box-transmitter-address`), internet, etabella.net, DNS, clock offset.
 */
export const NETWORK_CHECK_KEYS = [
    'box-room-address',
    'box-transmitter-address',
    'internet',
    'etabella-reachable',
    'dns',
    'clock-offset',
] as const;
export type NetworkCheckKey = typeof NETWORK_CHECK_KEYS[number];

export interface NetworkCheck {
    readonly key: NetworkCheckKey;
    readonly ok: boolean;
    readonly level: EdgeCheckLevel;
    /** Address checks: the IPv4; `dns`: the resolver used; null otherwise. */
    readonly value: string | null;
    /** Round-trip time (internet, etabella-reachable, dns) or the clock offset; null when not measured. */
    readonly ms: number | null;
}

/**
 * `GET /edge/local/ops/network` (last results) and `POST /edge/local/ops/network/run` ("Run checks again"; replies
 * when done, at most ~10 s) — box admins. `checks` holds every `NETWORK_CHECK_KEYS` entry, in that order.
 */
export interface NetworkChecksResponse {
    readonly msg: 1;
    readonly running: boolean;
    readonly checkedAtMs: number | null;
    readonly checks: readonly NetworkCheck[];
}

/**
 * `GET /edge/local/ops/box` — box admins (any sign-in kind). "This box" tile and "Technical details"
 * ("Box VB-014 · v1.0.3 · parser fp-7 · cloud root 9f3c…a1"); spec ids and hashes stay behind that disclosure (DR16).
 */
export interface BoxDetailsResponse {
    readonly msg: 1;
    readonly nEdgeid: string;
    readonly boxName: string;
    /** Short label printed on the box ("VB-014"). */
    readonly boxLabel: string;
    /** rt-edge release ("1.0.3"). */
    readonly version: string;
    /** `FEED_PARSE_VERSION` ("fp-7"). */
    readonly parserVer: string;
    /** Release manifest commits (D6). */
    readonly backendCommit: string | null;
    readonly feCommit: string | null;
    readonly nowMs: number;
    readonly timeZone: string;
    readonly uptimeSec: number;
    readonly clockOffsetMs: number | null;
    readonly clockSynced: boolean;
    readonly diskFreeMB: number;
    readonly diskTotalMB: number;
    readonly journalMB: number;
    readonly certDaysLeft: number | null;
    readonly upsOnBattery: boolean | null;
    /** First and last 4 hex characters of the last cloud-confirmed root ("9f3c…a1"); null before the first sync. */
    readonly cloudRootShort: string | null;
}

/**
 * `GET /edge/local/ops/diagnostics` — box admins; audited. Replies a file, not JSON:
 * `Content-Type: application/zip`, `Content-Disposition: attachment; filename="<EDGE_DIAGNOSTICS_FILE_PREFIX><boxLabel>-<YYYYMMDD-HHmm>.zip"`.
 * Holds logs, the status snapshot, readiness / network results, versions and the Connectivity Log; never transcript
 * text, tokens, hashes or Eclipse logins.
 */
export const EDGE_DIAGNOSTICS_CONTENT_TYPE = 'application/zip';
export const EDGE_DIAGNOSTICS_FILE_PREFIX = 'etabella-box-';
