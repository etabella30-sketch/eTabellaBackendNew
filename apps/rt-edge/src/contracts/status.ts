/**
 * Status chips and the per-session status (DR6, DR8, DR9; spec §12 signals).
 *
 * - Room chip (everyone, words on every device): Live in this room · Waiting for reporter ·
 *   No new lines since HH:MM · Feed stopped · Offline · marking paused (· Session ended HH:MM).
 * - Operator chip (box admins), three segments: device → box (client-side, `edgeDeviceLinkState`),
 *   transmitter → box (`TransmitterLinkStatus`), box → cloud (`CloudLinkStatus`).
 *
 * Sources: `GET /edge/local/status` (snapshot, polled by the dashboard every `EDGE_TIMING.statusHeartbeatMs`) and
 * the LAN socket event `edge-status` (one `EdgeSessionStatus` per joined session; socket.ts).
 */

import { EDGE_TIMING } from './common';
import type { EdgeInternetStatus } from './config';
import type { EdgePartPointer } from './local-cases';
import type { TransmitterLinkStatus } from './transmitter';

/**
 * The feed of one session, as the box derives it:
 * - `waiting`: no line received yet;
 * - `live`: a line within `EDGE_TIMING.liveLineWindowMs`;
 * - `quiet`: the transmitter link is up but no line for longer (a recess) — neutral;
 * - `stopped`: lines were received, the session has not ended, and its transmitter link is down;
 * - `ended`: SESSION_END journaled (after the cloud's end request and the drain, spec §4.4).
 */
export type EdgeFeedState = 'waiting' | 'live' | 'quiet' | 'stopped' | 'ended';

/** v1 marks need the internet (S-D6 default): `paused` while the box's internet is unavailable. */
export type EdgeMarkingState = 'available' | 'paused';

/** The one state the room chip shows (`edgeRoomChip`). */
export type EdgeRoomChipState = 'waiting' | 'live' | 'quiet' | 'feed-stopped' | 'offline' | 'ended';

/**
 * Room chip precedence: ended → feed stopped → waiting → offline (marking paused) → quiet → live.
 * Cloud state shows only when it changes what people can do (DR6), and never hides a stopped feed.
 */
export function edgeRoomChip(feed: EdgeFeedState, marking: EdgeMarkingState): EdgeRoomChipState {
    if (feed === 'ended') return 'ended';
    if (feed === 'stopped') return 'feed-stopped';
    if (feed === 'waiting') return 'waiting';
    if (marking === 'paused') return 'offline';
    return feed;
}

/** Everything the room chip, the waiting state (DR8) and the banner slot (DR9) need for one session. */
export interface EdgeRoomStatus {
    /** `edgeRoomChip(feed, marking)`. */
    readonly chip: EdgeRoomChipState;
    readonly feed: EdgeFeedState;
    readonly marking: EdgeMarkingState;
    /** Scheduled start, for "Starts 10:00" on the waiting state. */
    readonly startAtMs: number | null;
    readonly firstLineAtMs: number | null;
    /** "No new lines since HH:MM". */
    readonly lastLineAtMs: number | null;
    /** When the transmitter link went down with the session live; null otherwise. */
    readonly feedStoppedAtMs: number | null;
    /** "Internet unavailable since 10:42"; null while up. */
    readonly internetDownSinceMs: number | null;
    /** "Session ended 13:02". */
    readonly endedAtMs: number | null;
}

/**
 * Box → cloud (operator chip right segment, DR6, DR16):
 * - `not-linked`: no confirmed device identity (never enrolled, revoked, quarantined);
 * - `synced`: the cloud has CONFIRMED everything (acked round, or a hello that carried every open session and found
 *   nothing to send; "Synced" only then), or a change is in flight for less than `EDGE_TIMING.cloudBehindAfterSec`
 *   (user decision 2026-10-04);
 * - `behind`: catching up, neutral blue with the lag in seconds ("18 s behind"): something waits, and either its
 *   oldest change is `EDGE_TIMING.cloudBehindAfterSec` old, or that session had no confirmation for that long since
 *   its wait began, or nothing was confirmed since the box started;
 * - `internet-unavailable`: the box has no internet;
 * - `cant-reach-etabella`: internet works but etabella.net does not answer ("Can't reach eTabella");
 * - `sync-refused`: the cloud refused the history (D19 frozen lineage, or FORK / REGRESS).
 */
export type CloudLinkState = 'not-linked' | 'synced' | 'behind' | 'internet-unavailable' | 'cant-reach-etabella' | 'sync-refused';

/** The last failed upload of a held capture (orphan 'C', spec §3.2): "eTabella answered 503 at 19:52". */
export interface CloudUploadError {
    readonly atMs: number;
    /** The HTTP status etabella.net answered (503); null when it gave none (offline, the capture report refused). */
    readonly status: number | null;
    /**
     * etabella.net's code when it gave one (`NOT_CONFIGURED`: no archive is set up for venue uploads; the box then
     * tries again after 15 min, then every 60 min), else the box's own error code (`offline`, `cloud_refused`,
     * `invalid_request`, `not_found`); null when unknown.
     */
    readonly code: string | null;
}

export interface CloudLinkStatus {
    readonly state: CloudLinkState;
    /** When `state` began (the box's published state); null for a state the box has not published yet. */
    readonly sinceMs: number | null;
    /**
     * Box now minus the commit time of the oldest change the cloud has not confirmed, whole seconds (spec §12); 0 when
     * nothing waits. After a restart the box takes it from the journal (the receive time of the first record past what
     * the cloud confirmed) once the hello says what the cloud holds, for every record through the journal head at that
     * hello (a partial raw ack keeps it; review 2026-10-04); before that hello it counts from the first change
     * journaled since the start (a lower bound: no ack state survives a restart, §5.5).
     */
    readonly lagSec: number;
    /**
     * Lines the cloud does not hold yet: the lines past the cloud's confirmed total, plus one for each page it holds
     * whose lines changed (user decision 2026-10-04; it used to count every line of every page not yet confirmed).
     * Every line of those pages when the cloud's total is unknown (after a ROOT reply or a `c.need`).
     */
    readonly lagLines: number;
    /** Pages whose digest differs from the cloud's (a page in flight counts). */
    readonly pendingPages: number;
    /** Last cloud-confirmed sync ("Synced" only after the cloud confirms, DR6). */
    readonly lastSyncedAtMs: number | null;
    /** Closed held captures not uploaded yet (each one blocks its session's purge). Absent on a box before 2026-10-04. */
    readonly heldCapturesPending?: number;
    /** The last failed upload while a held capture waits; null otherwise. Absent on a box before 2026-10-04. */
    readonly lastUploadError?: CloudUploadError | null;
}

/** Box-wide operator view (box admins only). */
export interface EdgeOperatorStatus {
    /** When the box built this status. */
    readonly checkedAtMs: number;
    /** The box's own data is older than `EDGE_TIMING.statusStaleAfterMs` (a stalled worker): "Status unavailable". */
    readonly stale: boolean;
    readonly transmitter: TransmitterLinkStatus;
    readonly cloud: CloudLinkStatus;
    /** Verdict problems now (side nav "1 problem"). */
    readonly problems: number;
    /** "Ready for today" lines needing attention (side nav "2 to do"); 0 once the first session went live. */
    readonly readinessToDo: number;
    /**
     * Where Eclipse "Connect to server" reaches the box (user decision 2026-10-04): the box's address on the reporter
     * network — `ReporterCardResponse.serverAddress`: the bind address, else (dev, every interface) the box's
     * default-route address; null when unknown — and the listen port. Sent in every mode; the Transmitter card shows
     * it in listen mode. `transmitter.lockout` and `transmitter.heldPeers` stay where they are.
     */
    readonly listen: {
        readonly address: string | null;
        readonly port: number;
    };
}

/** Cloud-gateway `edge-status` venue values (spec §9); the LAN payload keeps them so one store reads both. */
export type EdgeVenueState = 'online' | 'offline' | 'catching-up';

/** One session's status: the payload of the LAN `edge-status` event and one row of the status snapshot. */
export interface EdgeSessionStatus {
    readonly nSesid: string;
    /** Per-session sequence shared with `edge-session` events; a client drops anything at or below the last seen. */
    readonly seq: number;
    /** When the box built this status. */
    readonly atMs: number;
    // Cloud-compatible fields (names of the cloud gateway's edge-status, spec §9; times are epoch ms):
    readonly venue: EdgeVenueState;
    readonly lagLines: number;
    readonly lagSec: number;
    /** When `venue` last changed. */
    readonly since: number | null;
    /** Last cloud-confirmed sync. */
    readonly lastSyncAt: number | null;
    readonly catConnected: boolean;
    // LAN-only:
    readonly room: EdgeRoomStatus;
    /** The DR9 Part 2 pointer once the hearing was split (D7). */
    readonly continuedAs: EdgePartPointer | null;
    /** Present only for box-admin viewers. */
    readonly operator?: EdgeOperatorStatus;
}

/**
 * `GET /edge/local/status` — any signed-in identity; `operator` only for box admins. Sessions are those the viewer
 * may open (DR19). The dashboard polls it every `heartbeatMs` (no session room joined there).
 */
export interface EdgeStatusSnapshot {
    readonly msg: 1;
    readonly nowMs: number;
    readonly heartbeatMs: number;
    readonly staleAfterMs: number;
    readonly internet: EdgeInternetStatus;
    readonly sessions: readonly EdgeSessionStatus[];
    readonly operator?: EdgeOperatorStatus;
}

/** Operator chip left segment (DR6): computed in the browser. */
export type EdgeDeviceLinkState = 'connected' | 'lost' | 'stale';

export interface EdgeDeviceLinkInput {
    /** The LAN socket.io connection is up. */
    readonly socketConnected: boolean;
    /** Last successful contact with the box (any 2xx/4xx reply, a socket event, or a ping); null = never. */
    readonly lastBoxContactAtMs: number | null;
    /** `atMs` (or `checkedAtMs`) of the newest status received; null = none yet. */
    readonly lastStatusAtMs: number | null;
    /** The newest status said `stale: true`. */
    readonly statusMarkedStale: boolean;
    readonly nowMs: number;
}

/**
 * Device → box, client side (DR6, DR9):
 * - `lost` when the LAN socket is down AND the box has not answered anything for `EDGE_TIMING.boxUnreachableAfterMs`
 *   (the FE pings `/edge/ping` every `pingEveryMs` meanwhile) → banner "Can't reach the venue box · retrying ·
 *   your lines stay on screen", plus "Open on etabella.net" once lost for `openCloudAfterMs`;
 * - `stale` when connected but the newest status is older than `statusStaleAfterMs` or marked stale →
 *   "Status unavailable · last checked HH:MM";
 * - else `connected`.
 */
export function edgeDeviceLinkState(input: EdgeDeviceLinkInput): EdgeDeviceLinkState {
    const { socketConnected, lastBoxContactAtMs, lastStatusAtMs, statusMarkedStale, nowMs } = input;
    if (!socketConnected) {
        const silentFor = lastBoxContactAtMs === null ? Number.POSITIVE_INFINITY : nowMs - lastBoxContactAtMs;
        if (silentFor >= EDGE_TIMING.boxUnreachableAfterMs) return 'lost';
    }
    if (statusMarkedStale) return 'stale';
    if (lastStatusAtMs === null || nowMs - lastStatusAtMs > EDGE_TIMING.statusStaleAfterMs) return 'stale';
    return 'connected';
}
