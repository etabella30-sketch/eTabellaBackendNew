/**
 * Box settings → Status & troubleshooting tiles: network checks (D34, DR16), "this box" details (also the login
 * screen's admin-only "Box details", DR5) and "Download diagnostics" (D34, spec §12 runbook step 7).
 */

import type { EdgeCheckLevel } from './common';
import type { EdgeTimeSource } from './readiness';

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
    /**
     * `box-room-address`: what people in the room open — the IPv4 with TLS, `http://<IPv4>:<port>` on a box that
     * serves plain HTTP (dev, `http.tls: null`); the configured `http.host`, else the box's default-route address,
     * else private ranges before VPN / virtual adapters (user decision 2026-10-04). `box-transmitter-address`: the
     * IPv4, or the COM port ("COM13") when `applies` is false. `dns`: the name looked up ("etabella.net").
     * `etabella-reachable`: "website answers · box link refused" while an HTTPS ping answers but the box's link to
     * etabella.net does not connect (the check is then not ok; review 2026-10-04). Null otherwise.
     */
    readonly value: string | null;
    /**
     * Round-trip time — `internet`: the DNS answer time of a public name (the box's firewall lets out only the cloud,
     * DNS and NTP); `etabella-reachable`; `dns` — or the clock offset; null when not measured or the probe is older
     * than 5 min.
     */
    readonly ms: number | null;
    /**
     * False when the check does not apply to this box's setup (user decision 2026-10-04): `box-transmitter-address`
     * while the feed comes in on a COM port (no reporter network). `ok` is then true and the FE shows the row muted
     * ("Not used · feed on COM13"). True otherwise.
     */
    readonly applies: boolean;
    /** `dns` only: the resolver's IPv4 ("via 192.168.1.1"); null for the other checks and when the box knows only IPv6 ones. */
    readonly resolver: string | null;
}

/**
 * `GET /edge/local/ops/network` (last results) and `POST /edge/local/ops/network/run` ("Run checks again"; replies
 * when done, at most ~10 s) — box admins. `checks` holds every `NETWORK_CHECK_KEYS` entry, in that order.
 * The box also re-runs the checks by itself every `everyMs` (user decision 2026-10-04), so `checkedAtMs` is the
 * last run of either kind; the FE marks it old after twice `everyMs`. `internet` and `etabella-reachable` follow the
 * box's live link to etabella.net and use a probe only while it is at most 5 min old.
 */
export interface NetworkChecksResponse {
    readonly msg: 1;
    /** A run someone started (or joined) is in flight; the box's own background re-run never sets it. */
    readonly running: boolean;
    readonly checkedAtMs: number | null;
    /** How often the box re-runs the checks by itself, ms. */
    readonly everyMs: number;
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
    /** The PC clock itself: its offset from the reference clock (chrony, else etabella.net, else its Date header). */
    readonly clockOffsetMs: number | null;
    /** The PC clock itself reads synced (Windows Time "Leap 3 / Local CMOS Clock" never does; user decision 2026-10-04). */
    readonly clockSynced: boolean;
    /** Which clock new lines follow (`EdgeTimeSource`, user decision 2026-10-05): the Clock row's words. */
    readonly timeSource: EdgeTimeSource;
    /**
     * When etabella.net time was last checked (a hello reading, or the saved one's), in etabella.net time: "saved HH:MM";
     * null for `box` and `chrony` with no reading.
     */
    readonly serverTimeCheckedAtMs: number | null;
    /** Null when the data disk could not be measured ("not measured", never "0 GB of 0 GB"; user decision 2026-10-04). */
    readonly diskFreeMB: number | null;
    readonly diskTotalMB: number | null;
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
