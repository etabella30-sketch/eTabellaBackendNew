/**
 * `GET /edge/local/cases` — the box dashboard (D32, DR4, DR8, DR15, DR19). Served from the box's cached
 * assignments (`et_rtedge_assignments`), so it works offline.
 */

import type { EdgeIdentityKind } from './common';

/**
 * Edge-local session states (spec §4.1): `assigned → armed → live → ending (draining) → sealed → complete`, plus
 * `recovering` and `frozen` (lineage mismatch, D19). `fenced` / `rebasing` are Phase 4 (D1) and never sent in v1.
 */
export type EdgeSessionLocalState = 'assigned' | 'armed' | 'live' | 'ending' | 'sealed' | 'complete' | 'recovering' | 'frozen';

/**
 * What a person sees of one session:
 * - `not-started`: no line received yet ("Waiting for the reporter", DR8);
 * - `live`: at least one line received, not ended (a frozen uplink is still live in the room);
 * - `ended`: the box journaled SESSION_END after the cloud's end request and the drain (spec §4.4).
 */
export type EdgeSessionPhase = 'not-started' | 'live' | 'ended';

/** Where a split hearing continues (D7, DR9): Part 2 runs in the cloud. */
export interface EdgePartPointer {
    readonly nSesid: string;
    readonly nPartNo: number;
    /** `${cloudOrigin}/rt/session/<nSesid>` */
    readonly cloudUrl: string;
    readonly splitAtMs: number;
}

/** One session bound to this box, as the dashboard and the RT section's list need it. */
export interface EdgeLocalSession {
    readonly nSesid: string;
    readonly nCaseid: string;
    /** "Day 3 — Morning" */
    readonly cName: string;
    /** As the cloud stores it: a wall-clock string in `tz` (no offset); null when the session has no start. */
    readonly dStartDt: string | null;
    /** The session's pinned IANA zone (spec §4.2). */
    readonly tz: string;
    /** `dStartDt` resolved in `tz` by the box; null when there is no start or it is date-only. */
    readonly startAtMs: number | null;
    /** The session's start date in `tz` is today in `tz`. */
    readonly isToday: boolean;
    readonly phase: EdgeSessionPhase;
    readonly localState: EdgeSessionLocalState;
    /** "started 10:02" on the live card. */
    readonly firstLineAtMs: number | null;
    readonly lastLineAtMs: number | null;
    /** Latest page number for "page 41"; null before the first line. */
    readonly page: number | null;
    readonly totalLines: number;
    readonly endedAtMs: number | null;
    /** 1 unless the hearing was split (D7). */
    readonly nPartNo: number;
    readonly nPrevPartSesid: string | null;
    /** Set once an admin used "Split to direct cloud" (D7, DR9). */
    readonly continuedAs: EdgePartPointer | null;
    /** `${cloudOrigin}/rt/session/<nSesid>` for "Open on etabella.net" (DR9). */
    readonly cloudUrl: string;
}

/**
 * The RT button of one case card (DR4, DR8), computed by the box:
 * - `live`: a session is live → full-width card, "Open realtime · Live";
 * - `next-today`: a session today not started, with a start time → "RT · Starts 10:00" (earliest such start);
 * - `today-not-started`: a session today not started, without a start time → "RT · Today, not started";
 * - `other`: nothing today (or today's sessions ended) → "RT".
 */
export type EdgeCaseRtKind = 'live' | 'next-today' | 'today-not-started' | 'other';

/** Card order (DR4): live, then next today (by start), then today-not-started, then others. */
export const EDGE_CASE_RT_RANK: Readonly<Record<EdgeCaseRtKind, number>> = {
    live: 0,
    'next-today': 1,
    'today-not-started': 2,
    other: 3,
};

export interface EdgeCaseRt {
    readonly kind: EdgeCaseRtKind;
    /** The session the button opens (`/rt/session/<nSesid>`); null for `other` (opens the RT section's list). */
    readonly nSesid: string | null;
    readonly sessionName: string | null;
    /** `next-today` only: the start the label shows, formatted in the session's `tz`. */
    readonly startAtMs: number | null;
    /** `EDGE_CASE_RT_RANK[kind]`. */
    readonly rank: number;
}

/** One case card. */
export interface EdgeLocalCase {
    readonly nCaseid: string;
    /** Same names as the cloud dashboard's case rows. */
    readonly cCasename: string;
    readonly cCaseno: string;
    /** The viewer is case admin of this case (may issue room codes for it). */
    readonly isCaseAdmin: boolean;
    /** Room-code viewers only: the "Room access · <session>" tag (DR19). */
    readonly roomAccess: { readonly nSesid: string; readonly sessionName: string } | null;
    readonly rt: EdgeCaseRt;
    /**
     * The case's unpurged box sessions, oldest start first. A room-code viewer gets only the one session the code
     * opens.
     */
    readonly sessions: readonly EdgeLocalSession[];
}

/** Which list this is: drives the page title ("Cases on this box" / "Your room access"). */
export type EdgeCasesScope = 'case-team' | 'room-code' | 'operator';

/**
 * Why `cases` is empty (DR4, DR15) — three different truths, three different sentences:
 * - `no-cases`: the box's assignments are current and none of its cases is open to this person →
 *   "No hearings on this box today" + "Cases appear when an admin assigns them to <boxName> on etabella.net."
 * - `not-on-box-yet`: the box cannot vouch (assignments never synced, or not since the start of today, and the cloud
 *   is unreachable now) → "Session details aren't on this box yet" + "Ask the operator …".
 */
export type EdgeCasesEmptyReason = 'no-cases' | 'not-on-box-yet';

export interface EdgeAssignmentsFreshness {
    /** Last successful assignment pull or push from the cloud; null = never. */
    readonly syncedAtMs: number | null;
    /** Synced since the start of today (box time zone) or the cloud is reachable now. */
    readonly fresh: boolean;
}

/**
 * Reply of `GET /edge/local/cases`: box cases ∩ what this viewer may open (D32, DR19), sorted by `rt.rank`, then
 * `rt.startAtMs` (earliest first), then `cCasename`.
 */
export interface EdgeLocalCasesResponse {
    readonly msg: 1;
    readonly nowMs: number;
    /** Today in the box time zone (YYYY-MM-DD). */
    readonly today: string;
    readonly timeZone: string;
    readonly viewer: EdgeIdentityKind;
    readonly scope: EdgeCasesScope;
    /** Null whenever `cases` is not empty. */
    readonly emptyReason: EdgeCasesEmptyReason | null;
    readonly assignments: EdgeAssignmentsFreshness;
    readonly cases: readonly EdgeLocalCase[];
}
