/**
 * Box settings → Status & troubleshooting → live verdict (DR12, DR16; spec §12 runbook steps 4 and 10).
 * Every problem stays listed, worst first; a reconnect leaves a green "Reconnected · gap A–B" until dismissed.
 */

import type { EdgeLinePosition } from './common';
import type { ConnectivityLogFilter } from './log';
import type { EdgeLinkFailure, EdgeTimeSource } from './readiness';
import type { TransmitterMode } from './transmitter';

/**
 * Problem kinds in DR12 rank order (index = rank, 0 = worst): recording to disk failed → box not linked →
 * disk low → recovering after restart → cloud refused the history (D19) → feed stopped → COM port quiet →
 * internet unavailable → can't reach eTabella → clock → held captures not uploaded. (`feed-quiet`,
 * `cant-reach-etabella` and `captures-not-uploaded`: user decision 2026-10-04.)
 */
export const VERDICT_KINDS = [
    'recording-failed',
    'box-not-linked',
    'disk-low',
    'recovering',
    'history-refused',
    'feed-stopped',
    'feed-quiet',
    'internet-unavailable',
    'cant-reach-etabella',
    'clock',
    'captures-not-uploaded',
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
    'feed-quiet': 'warn',
    'internet-unavailable': 'bad',
    'cant-reach-etabella': 'bad',
    clock: 'warn',
    'captures-not-uploaded': 'warn',
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
    /** COM port mode (the applied mode): the port the box reads ("COM13"); null in the other modes. */
    readonly serialPath: string | null;
    /**
     * Listen mode (the applied mode): the port Eclipse "Connect to server" reaches on the box
     * (`TransmitterStateResponse.listen.port`, e.g. 5555), for the `check-reporter-login` words; null in the other
     * modes.
     */
    readonly listenPort: number | null;
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
    /**
     * COM port mode only (user decision 2026-10-04): the port is open but no line came for longer than
     * `EDGE_TIMING.quietNeutralMs` — the moment the Transmitter pill turns amber. Eclipse output stopping, or the
     * cable coming out at the reporter's end, leaves the box's COM port open, so the feed never reads `stopped`:
     * "No lines from COM13 since 10:31". A warning, never `feed-stopped`: a long silence is normal in a hearing, so it
     * pages no one and offers no split.
     */
    readonly 'feed-quiet': {
        readonly lastLineAtMs: number;
        readonly lastLine: EdgeLinePosition | null;
        /** The applied COM port ("COM13") and baud rate; null when unknown. */
        readonly serialPath: string | null;
        readonly baudRate: number | null;
    };
    readonly 'internet-unavailable': {
        readonly sinceMs: number;
        readonly pendingPages: number;
        readonly lagSec: number;
    };
    /**
     * The internet works but etabella.net does not answer — the Cloud card's "Can't reach eTabella" (user decision
     * 2026-10-04). `sinceMs`: the uplink's `cant-reach-etabella` since, else when the box's own etabella.net check
     * started failing. Listed once it lasts `EDGE_TIMING.internetOfflineAfterMs` (the internet's own hysteresis), never
     * beside `internet-unavailable`. A link failure `unreachable` on a box that linked before is the same fact: it is
     * listed as this kind, not as `box-not-linked` (review 2026-10-04). Beside `box-not-linked` only for `certificate`;
     * never-enrolled, revoked, quarantined and key-refused list `box-not-linked` alone.
     */
    readonly 'cant-reach-etabella': {
        readonly sinceMs: number;
        readonly pendingPages: number;
        readonly lagSec: number;
    };
    /**
     * Listed only while new lines use the box's own clock (`source` 'box': no etabella.net time yet, chrony not synced),
     * or the PC clock is `EDGE_CLOCK_FAR_OFFSET_MS` (60 s) or more off (user decision 2026-10-05). `synced` / `offsetMs`
     * are the PC clock itself.
     */
    readonly clock: {
        readonly synced: boolean;
        readonly offsetMs: number | null;
        readonly source: EdgeTimeSource;
    };
    /**
     * Held captures (second Eclipse connections the box kept, spec §3.2) the box could not upload to etabella.net:
     * "1 held capture not uploaded · eTabella answered 503 at 19:33" (user decision 2026-10-04). Listed while a
     * capture waits AND the last upload attempt failed; the box keeps retrying, and keeps the session's files until
     * they are uploaded.
     */
    readonly 'captures-not-uploaded': {
        readonly pending: number;
        /** The last failed upload: when, the HTTP status (null = no answer) and the cloud's code ("NOT_CONFIGURED"). */
        readonly lastError: {
            readonly atMs: number;
            readonly status: number | null;
            readonly code: string | null;
        };
    };
}

/**
 * Plain-language steps the FE words (DR16), e.g. "Check Eclipse output is still started on the reporter's laptop."
 * `check-com-cable` (COM port mode, user decision 2026-10-04): "Check the serial cable or USB adapter between the
 * reporter's laptop and this box." `check-reporter-login` names the box's real listen port
 * (`FeedStoppedIncident.listenPort`).
 */
export type VerdictHint =
    | 'check-eclipse-output'
    | 'check-cable'
    | 'check-com-cable'
    | 'check-transmitter-address'
    | 'check-reporter-login'
    | 'check-internet'
    | 'free-disk-space'
    | 'replace-disk'
    | 'wait-for-recovery'
    | 'contact-support';

/**
 * Actions offered in a problem card:
 * - `reconnect` → `POST /edge/local/ops/transmitter/reconnect` with `stateVersion` (dial or COM port mode, link down
 *   only, DR13);
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
        /** Session-scoped problems (recording failed, recovering, history refused, feed stopped, feed quiet); null for box-wide ones. */
        readonly nSesid: string | null;
        readonly sessionName: string | null;
        /**
         * The session's pinned IANA zone: the times of a session-scoped problem are shown in it, with a short zone label
         * where the screen also shows box times (user decision 2026-10-05). Null for box-wide problems (box time zone)
         * and for a session without a zone.
         */
        readonly sessionTz: string | null;
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
    /** The session's pinned IANA zone (the gap times are shown in it; user decision 2026-10-05); null when unknown. */
    readonly sessionTz: string | null;
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
    /**
     * A readiness or network run is in flight ("Running checks…"); the box's own 2-minute network re-run never sets it
     * (review 2026-10-04), so the headline does not flicker on a box with no problems.
     */
    readonly running: boolean;
    readonly overall: VerdictOverall;
    readonly problems: readonly VerdictProblem[];
    /** Shown until dismissed. */
    readonly recoveries: readonly VerdictRecovery[];
    /** DR12: the Connectivity Log opens on Problems while the verdict is red. */
    readonly logFilterDefault: ConnectivityLogFilter;
}
