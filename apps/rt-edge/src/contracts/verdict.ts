/**
 * Box settings → Status & troubleshooting → live verdict (DR12, DR16; spec §12 runbook steps 4 and 10).
 * Every problem stays listed, worst first; a reconnect leaves a green "Reconnected · gap A–B" until dismissed.
 */

import type { EdgeLinePosition } from './common';
import type { ConnectivityLogFilter } from './log';
import type { EdgeLinkFailure } from './readiness';
import type { TransmitterMode } from './transmitter';

/**
 * Problem kinds in DR12 rank order (index = rank, 0 = worst): recording to disk failed → box not linked →
 * disk low → recovering after restart → cloud refused the history (D19) → feed stopped → internet unavailable →
 * clock.
 */
export const VERDICT_KINDS = [
    'recording-failed',
    'box-not-linked',
    'disk-low',
    'recovering',
    'history-refused',
    'feed-stopped',
    'internet-unavailable',
    'clock',
] as const;
export type VerdictKind = typeof VERDICT_KINDS[number];

/** `critical` = the dark verdict that sits above everything ("Recording to disk has failed"). */
export type VerdictSeverity = 'critical' | 'bad' | 'warn';

export const VERDICT_SEVERITY: Readonly<Record<VerdictKind, VerdictSeverity>> = {
    'recording-failed': 'critical',
    'box-not-linked': 'bad',
    'disk-low': 'bad',
    recovering: 'warn',
    'history-refused': 'bad',
    'feed-stopped': 'bad',
    'internet-unavailable': 'bad',
    clock: 'warn',
};

/** Rank of a kind (0 = worst). */
export function verdictRank(kind: VerdictKind): number {
    return VERDICT_KINDS.indexOf(kind);
}

/** Worst first; within a kind, the longest-standing first. Returns a new array. */
export function sortVerdictProblems<T extends { readonly kind: VerdictKind; readonly sinceMs: number }>(problems: readonly T[]): T[] {
    return [...problems].sort((a, b) => verdictRank(a.kind) - verdictRank(b.kind) || a.sinceMs - b.sinceMs);
}

/**
 * A feed drop (DR12): "Feed stopped 4 min 12 s ago", the last line, the possible gap, "Ask the reporter to resend
 * from 10:31", "Support alerted 10:33", and the split-to-cloud fallback offered from 5 min.
 */
export interface FeedStoppedIncident {
    readonly feedStoppedAtMs: number;
    /** Start of the possible gap = the last line's time (or the stop time when no line is known). */
    readonly gapFromMs: number;
    /** Null while the feed is still stopped; set on reconnect. */
    readonly gapToMs: number | null;
    readonly lastLine: EdgeLinePosition | null;
    /** `gapFromMs` floored to the minute: what the reporter should resend from. */
    readonly resendFromMs: number;
    /** When the P-tier alert reached support; null if not (yet) alerted. */
    readonly supportAlertedAtMs: number | null;
    /** `feedStoppedAtMs + EDGE_TIMING.splitOfferAfterMs`. */
    readonly splitOfferedFromMs: number;
    readonly mode: TransmitterMode;
    /** Last known transmitter / Eclipse peer. */
    readonly peer: string | null;
}

/** Typed detail per problem kind. */
export interface VerdictDetailMap {
    /** "Recording to disk has failed. New lines are not safely stored. Last safely saved: page 41, line 12 · 10:30:48." */
    readonly 'recording-failed': {
        readonly reason: 'disk-full' | 'io-error' | 'journal-corrupt';
        readonly lastSafe: EdgeLinePosition | null;
    };
    readonly 'box-not-linked': {
        readonly failure: EdgeLinkFailure;
        readonly lastLinkedAtMs: number | null;
    };
    readonly 'disk-low': {
        readonly freeMB: number;
        readonly minFreeMB: number;
    };
    /** Rebuilding from the journal after a restart (spec §10 #3). */
    readonly recovering: {
        readonly startedAtMs: number;
        /** Always null in v1: the journal replay reports no progress; the FE words it without a percentage (§8.4). */
        readonly progressPct: number | null;
    };
    /**
     * D19: the cloud refused this box's history — or (MR-4) the session's journal is corrupt and RECOVER cannot repair
     * it — so the session's uplink is frozen until an admin splits (or force-closes a session that already ended).
     */
    readonly 'history-refused': {
        readonly refusedAtMs: number;
        readonly splitDone: boolean;
    };
    readonly 'feed-stopped': FeedStoppedIncident;
    readonly 'internet-unavailable': {
        readonly sinceMs: number;
        readonly pendingPages: number;
        readonly lagSec: number;
    };
    readonly clock: {
        readonly synced: boolean;
        readonly offsetMs: number | null;
    };
}

/** Plain-language steps the FE words (DR16), e.g. "Check Eclipse output is still started on the reporter's laptop." */
export type VerdictHint =
    | 'check-eclipse-output'
    | 'check-cable'
    | 'check-transmitter-address'
    | 'check-reporter-login'
    | 'check-internet'
    | 'free-disk-space'
    | 'replace-disk'
    | 'wait-for-recovery'
    | 'contact-support';

/**
 * Actions offered in a problem card:
 * - `reconnect` → `POST /edge/local/ops/transmitter/reconnect` with `stateVersion` (dial mode, link down only, DR13);
 * - `open-transmitter` → Box settings → Transmitter; `show-to-reporter` → `POST /edge/local/ops/reporter-card`
 *   for `nSesid`; `run-checks-again`; `download-diagnostics`;
 * - `split-to-cloud-info` → the "an eTabella admin can move the hearing to direct cloud" note (the split itself is
 *   a cloud action, D7).
 */
export type VerdictActionKind = 'reconnect' | 'open-transmitter' | 'show-to-reporter' | 'run-checks-again' | 'download-diagnostics' | 'split-to-cloud-info';

export interface VerdictAction {
    readonly kind: VerdictActionKind;
    readonly primary: boolean;
    /** `reconnect` only: the transmitter state version the reconnect is based on. */
    readonly stateVersion: number | null;
    /** `show-to-reporter` only. */
    readonly nSesid: string | null;
}

export type VerdictProblem = {
    readonly [K in VerdictKind]: {
        /** Stable while the problem lasts (FE keys and announcements use it). */
        readonly id: string;
        readonly kind: K;
        /** `verdictRank(kind)`. */
        readonly rank: number;
        readonly severity: VerdictSeverity;
        readonly sinceMs: number;
        /** Session-scoped problems (feed stopped, history refused); null for box-wide ones. */
        readonly nSesid: string | null;
        readonly sessionName: string | null;
        readonly detail: VerdictDetailMap[K];
        readonly hints: readonly VerdictHint[];
        readonly actions: readonly VerdictAction[];
    };
}[VerdictKind];

/** "Reconnected 10:36:12 · Gap 10:31:05 – 10:36:12 on Day 3 — Morning. Ask the reporter to resend from 10:31." */
export interface VerdictRecovery {
    readonly id: string;
    readonly kind: 'reconnected';
    readonly nSesid: string;
    readonly sessionName: string;
    readonly reconnectedAtMs: number;
    readonly gapFromMs: number;
    readonly gapToMs: number;
    readonly resendFromMs: number;
}

/** `ok` = nothing listed; `problem` = at least one bad / warn; `critical` = a critical problem is listed. */
export type VerdictOverall = 'ok' | 'problem' | 'critical';

/**
 * `GET /edge/local/ops/verdict` — box admins. `problems` are sorted with `sortVerdictProblems`.
 * `POST /edge/local/ops/verdict/recoveries/:id/dismiss` ("Done") removes one recovery; replies `EdgeAck`.
 * The verdict is "red" while a `critical` or `bad` problem is listed; `logFilterDefault` is then `'problems'`.
 */
export interface VerdictResponse {
    readonly msg: 1;
    readonly checkedAtMs: number;
    readonly running: boolean;
    readonly overall: VerdictOverall;
    readonly problems: readonly VerdictProblem[];
    /** Shown until dismissed. */
    readonly recoveries: readonly VerdictRecovery[];
    /** DR12: the Connectivity Log opens on Problems while the verdict is red. */
    readonly logFilterDefault: ConnectivityLogFilter;
}
