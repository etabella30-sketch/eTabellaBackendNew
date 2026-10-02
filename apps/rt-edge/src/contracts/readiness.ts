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
/** "Clock in sync" is ok under 1 s offset with chrony synced (runbook), warn under 5 s (alert threshold), else bad. */
export const EDGE_CLOCK_READY_MAX_OFFSET_MS = 1_000;
export const EDGE_CLOCK_WARN_MAX_OFFSET_MS = 5_000;

/** Why the box is not linked (also used by the verdict). */
export type EdgeLinkFailure = 'never-enrolled' | 'revoked' | 'quarantined' | 'key-refused' | 'certificate' | 'unreachable';

/** A session in "Today's sessions on the box · 2 sessions (Day 3 — Morning 10:00, …)". */
export interface ReadinessSessionRef {
    readonly nSesid: string;
    readonly sessionName: string;
    readonly caseName: string;
    readonly startAtMs: number | null;
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
    readonly 'clock-in-sync': {
        readonly synced: boolean;
        readonly offsetMs: number | null;
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
