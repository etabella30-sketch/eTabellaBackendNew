/**
 * Venue box (apps/rt-edge) HTTP + LAN socket contract: shared vocabulary.
 *
 * Authority: docs/rt-local-edge-spec.md revision 3 (§4.10, §8.2, §8.4, §8.7, §9.1, §9.2, §12), the plan's decision
 * ledger D1–D34 and design review DR1–DR22, and the v1 build defaults O-1…O-19. The human contract is
 * apps/rt-edge/CONTRACTS.md.
 *
 * MIRROR RULE: the FE keeps an exact copy of every declaration in this folder, in one file,
 * `src/app/features/edge/api/edge-api.types.ts` (same declarations, same order as index.ts, import lines dropped).
 * Change both in the same release; never edit one side alone.
 *
 * Conventions
 * - Instants are epoch milliseconds (UTC), named `…AtMs` (plus `nowMs`). Durations are `…Ms` or `…Sec`.
 *   The two exceptions are JWT claims (epoch seconds, as in every JWT) and the cloud-compatible `edge-status`
 *   fields `since` / `lastSyncAt`, which keep the names of the cloud gateway's payload (still epoch ms).
 * - A calendar day is `YYYY-MM-DD` in the box's time zone (`EdgeConfig.timeZone`) unless a field says otherwise.
 * - Ids keep the cloud's names and are strings: nEdgeid, nCaseid, nSesid, nUserid.
 * - Success bodies carry `msg: 1`. Error bodies carry `msg: -1`, a machine `error` code and a developer `message`
 *   (English, never shown to people). The FE owns every sentence a person reads.
 * - Every path is relative to the box origin (`https://<slug>.etabella-edge.net`). The box API has no CORS.
 */

/** Semver of this contract. `/edge-config.json` carries it; the FE refuses a box whose major differs. */
export const EDGE_CONTRACT_VERSION = '1.0.0';

/** Major part of a contract version ('1.0.0' → 1); NaN when the string is not a version. */
export function edgeContractMajor(version: string): number {
    const match = /^(\d+)\.\d+\.\d+$/.exec(typeof version === 'string' ? version.trim() : '');
    return match ? Number(match[1]) : Number.NaN;
}

/**
 * How the person on this device is signed in to the box (spec §8.4).
 * - `online`: an edge ("room sign-in") token issued by etabella.net after the PKCE sign-in (D33, D22, D24).
 * - `room-code`: a box-signed token from a one-time room code (D33, DR10, O-9). Read-only in v1: proxied
 *   mark writes answer `503 {reauth:true}` because box-signed tokens are never forwarded (§8.4).
 * - `operator`: a box-signed token from today's operator code (DR7, O-10). Box admin for that day only.
 */
export type EdgeIdentityKind = 'online' | 'room-code' | 'operator';

/** Plain success body. */
export interface EdgeAck {
    readonly msg: 1;
}

/** A person by id and full display name ("Daniel Okafor"). */
export interface EdgePersonRef {
    readonly nUserid: string;
    readonly name: string;
}

/** Who did something on the box (audit rows, "Applied 09:12 by P. Shah", room-code issuer). */
export interface EdgeActor {
    /** Null only for an operator-code session (the code is not a user). */
    readonly nUserid: string | null;
    /** Full name; for an operator-code session, the name of the case admin who minted the code. */
    readonly name: string;
    readonly via: EdgeIdentityKind;
    /** Operator-code sessions only: the operator name typed at issue (O-10). Null otherwise. */
    readonly operatorName: string | null;
}

/** Severity of one check line or tile: ✓ ok, ! warn, ✕ bad (wireframe frames 9 and 10). */
export type EdgeCheckLevel = 'ok' | 'warn' | 'bad';

/** Where the line a person last saw sits in the transcript (25-line pages). */
export interface EdgeLinePosition {
    readonly page: number;
    readonly line: number;
    /** When the line was received; null when unknown. */
    readonly atMs: number | null;
}

/**
 * Timing rules shared by the box and the FE so both sides agree on every threshold the screens show.
 * Values come from DR6, DR9, DR12, spec §10 #2 and §12.
 */
export const EDGE_TIMING = {
    /** The box rebuilds its status (`e.status`) and re-emits `edge-status` this often (§12). */
    statusHeartbeatMs: 5_000,
    /** Status older than this reads "Status unavailable · last checked HH:MM" (DR6). */
    statusStaleAfterMs: 15_000,
    /** Room chip "Live in this room" = a line within this window; after it, "No new lines since HH:MM" (DR6). */
    liveLineWindowMs: 120_000,
    /** A quiet transmitter stays neutral this long, then turns amber (DR6). */
    quietNeutralMs: 600_000,
    /** A stopped feed offers the split-to-cloud fallback after this long (DR12). */
    splitOfferAfterMs: 300_000,
    /** "Back online · marking available" shows this long (DR9). */
    backOnlineBannerMs: 5_000,
    /** Device → box: no contact for this long while the LAN socket is down = "Can't reach the venue box" (DR9). */
    boxUnreachableAfterMs: 10_000,
    /** "Open on etabella.net" joins the box-unreachable banner after this long (DR9). */
    openCloudAfterMs: 60_000,
    /** A `GET /edge/ping` (or etabella.net probe) slower than this counts as failed. */
    pingTimeoutMs: 4_000,
    /** How often the FE pings the box while the LAN socket is down. */
    pingEveryMs: 5_000,
    /** Box UI hysteresis for its internet state: offline after 15 s down, online after 10 s up (§10 #2). */
    internetOfflineAfterMs: 15_000,
    internetOnlineAfterMs: 10_000,
} as const;
