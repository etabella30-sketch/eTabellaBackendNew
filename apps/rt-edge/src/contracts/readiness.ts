/**
 * Box settings → Status & troubleshooting → "Ready for today" (DR15, DR7, spec §12 runbook step 3).
 * The landing view until the first session of the day goes live; then the live verdict takes over.
 */

import type { EdgeCheckLevel } from './common';
import type { EdgeInternetState } from './config';
import type { TransmitterLinkState, TransmitterMode } from './transmitter';

/** The checks, in display order (wireframe frame 9). `operator-code` is listed only with `features.operatorCode` on (DR23), so a reply holds 7 by default. */
export const READINESS_KEYS = [
    'box-linked',
    'sessions-today',
    'team-lists',
    'transmitter-connected',
    'etabella-reachable',
    'operator-code-issued',
    'disk-free',
    'clock-in-sync',
] as const;
export type ReadinessKey = typeof READINESS_KEYS[number];

/** "Disk free" is ok from 20 GB (runbook), warn from 10 GB (a session will not arm below it, §10 #3), else bad. */
export const EDGE_DISK_READY_MIN_MB = 20_480;
export const EDGE_DISK_ARM_MIN_MB = 10_240;
/**
 * The PC clock reads "synced" (`synced` of the clock details) under 1 s offset; 5 s is the P2 alert threshold. Since
 * the box follows etabella.net time (user decision 2026-10-05) neither decides "Clock in sync": see `EdgeTimeSource`.
 */
export const EDGE_CLOCK_READY_MAX_OFFSET_MS = 1_000;
export const EDGE_CLOCK_WARN_MAX_OFFSET_MS = 5_000;
/** From 60 s off the PC clock is bad, whatever the lines follow (the P1 alert threshold; user decision 2026-10-05). */
export const EDGE_CLOCK_FAR_OFFSET_MS = 60_000;
/** A saved etabella.net time correction older than this (24 h) reads warn (user decision 2026-10-05). */
export const EDGE_SAVED_TIME_WARN_AFTER_MS = 86_400_000;

/**
 * Which clock new lines follow (user decision 2026-10-05: new lines carry etabella.net time, the box PC clock
 * corrected by the offset measured at every hello):
 * - `etabella`: a reading from etabella.net at most 15 min old — "Following etabella.net time · 0.3 s" (the offset is
 *   how far the PC clock is off, and it is corrected);
 * - `saved`: the correction saved earlier (the box restarted offline, or no reading for 15 min) — "Following
 *   etabella.net time · saved HH:MM"; warn once it is over `EDGE_SAVED_TIME_WARN_AFTER_MS` old;
 * - `chrony`: no etabella.net time yet, but chrony keeps the PC clock synced (Linux boxes);
 * - `box`: no etabella.net time since the start and nothing saved — new lines use the box's own clock: "No
 *   etabella.net time yet" (warn, and the verdict's `clock` problem). It switches to etabella.net time as soon as a
 *   reading arrives.
 * "Clock in sync" is ok for `etabella`, `chrony` and a `saved` one under 24 h old, while the PC clock is under
 * `EDGE_CLOCK_FAR_OFFSET_MS` off; warn for `box` or an old `saved`; bad from 60 s off.
 */
export type EdgeTimeSource = 'etabella' | 'saved' | 'chrony' | 'box';

/** Why the box is not linked (also used by the verdict). */
export type EdgeLinkFailure = 'never-enrolled' | 'revoked' | 'quarantined' | 'key-refused' | 'certificate' | 'unreachable';

/** A session in "Today's sessions on the box · 2 sessions (Day 3 — Morning 10:00, …)". */
export interface ReadinessSessionRef {
    readonly nSesid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly startAtMs: number | null;
    /**
     * The session's pinned IANA zone (`EdgeLocalSession.tz`); null when the session has none. Its start is shown in
     * this zone, with a short zone label where the screen also shows box times (user decision 2026-10-05).
     */
    readonly tz: string | null;
}

/** Typed detail of each check (the FE writes the sentence). */
export interface ReadinessDetailMap {
    readonly 'box-linked': {
        readonly linked: boolean;
        readonly lastCloudContactAtMs: number | null;
        readonly failure: EdgeLinkFailure | null;
    };
    readonly 'sessions-today': {
        readonly count: number;
        readonly sessions: readonly ReadinessSessionRef[];
        readonly assignmentsSyncedAtMs: number | null;
    };
    /** "Case team lists stored for room codes · 14 people". */
    readonly 'team-lists': {
        readonly people: number;
        readonly cases: number;
        readonly syncedAtMs: number | null;
    };
    readonly 'transmitter-connected': {
        readonly state: TransmitterLinkState;
        readonly mode: TransmitterMode;
    };
    readonly 'etabella-reachable': {
        readonly internet: EdgeInternetState;
        readonly reachable: boolean;
        readonly sinceMs: number | null;
    };
    /** "Today's operator code issued · not issued — needed to get in if the internet drops". */
    readonly 'operator-code-issued': {
        readonly issued: boolean;
        readonly issuedAtMs: number | null;
        readonly mintedByName: string | null;
    };
    /** "Disk free · 212 GB". */
    readonly 'disk-free': {
        readonly freeMB: number;
        readonly minFreeMB: number;
    };
    /** `synced` / `offsetMs`: the PC clock itself; `source`: which clock new lines follow (user decision 2026-10-05). */
    readonly 'clock-in-sync': {
        readonly synced: boolean;
        readonly offsetMs: number | null;
        readonly source: EdgeTimeSource;
    };
}

/**
 * The fix-it action of a failing line:
 * - `open-transmitter` ("Set up transmitter") → Box settings → Transmitter;
 * - `issue-operator-code` ("Issue operator code") → `POST /edge/local/operator-code/issue` (online case admin);
 *   offline, or for someone who cannot mint, the action comes as `open-rt-production` with `href` instead;
 * - `run-checks-again` → `POST /edge/local/ops/readiness/run` (also pulls assignments when online);
 * - `open-network-checks` → the network tile;
 * - `open-rt-production` → `href` on etabella.net (create sessions, mark the box ready, assign cases);
 * - `download-diagnostics` → `GET /edge/local/ops/diagnostics` (disk, clock: for support).
 */
export type ReadinessActionKind =
    | 'open-transmitter'
    | 'issue-operator-code'
    | 'run-checks-again'
    | 'open-network-checks'
    | 'open-rt-production'
    | 'download-diagnostics';

export interface ReadinessAction {
    readonly kind: ReadinessActionKind;
    /** Primary button (wireframe: "Issue operator code") vs secondary ("Set up transmitter"). */
    readonly primary: boolean;
    /** Absolute etabella.net URL for `open-rt-production`; null otherwise. */
    readonly href: string | null;
}

/** One line: a tick, or a fix-it action (DR15). */
export type ReadinessItem = {
    readonly [K in ReadinessKey]: {
        readonly key: K;
        readonly ok: boolean;
        /** ✓ ok, ! warn (e.g. operator code not issued), ✕ bad (e.g. transmitter not connected). */
        readonly level: EdgeCheckLevel;
        readonly detail: ReadinessDetailMap[K];
        /** Null when ok. */
        readonly action: ReadinessAction | null;
    };
}[ReadinessKey];

/**
 * `GET /edge/local/ops/readiness` (last results) and `POST /edge/local/ops/readiness/run` (re-run now; replies when
 * done, at most ~10 s) — box admins. `items` holds the checks in `READINESS_KEYS` order: 7 by default, 8 with `features.operatorCode` on (DR23).
 */
export interface ReadinessResponse {
    readonly msg: 1;
    /** The box-local day checked (YYYY-MM-DD). */
    readonly day: string;
    /** Null before the first run since boot ("Checks running"). */
    readonly checkedAtMs: number | null;
    readonly running: boolean;
    /** DR15: true until the first session of the day goes live; Status opens on this checklist while true. */
    readonly landing: boolean;
    readonly firstLiveAtMs: number | null;
    readonly items: readonly ReadinessItem[];
    /** "2 of 7 need attention"; 0 = all ticked. */
    readonly needAttention: number;
    readonly total: number;
}
