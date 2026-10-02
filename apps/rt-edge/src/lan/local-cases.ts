/**
 * `GET /edge/local/cases` (D32, DR4, DR8, DR15, DR19; CONTRACTS.md §7.1): the box dashboard, from the cached
 * assignments (works offline) and the kernel's live view of the sessions it holds open.
 *
 * - Scope: box cases ∩ what the viewer may open (`AuthPort.canSeeCase`); in each, the unpurged, undeleted sessions the
 *   viewer may join (`canOpenSession`). A room-code viewer gets its one case with only its session, tagged
 *   `roomAccess`.
 * - RT button: `live` if a session is live (the most recently started one), else `next-today` (the earliest start of
 *   today's not-started sessions with a start time), else `today-not-started` (today, date-only), else `other`;
 *   `startAtMs` only for `next-today`. Cards sort by rank, then that start, then case name.
 * - Empty: `no-cases` when the assignments are fresh (synced since the start of today in the box zone, or the cloud
 *   link is up now), else `not-on-box-yet` (DR15: never a false "No hearings today").
 */
import {
    EDGE_CASE_RT_RANK,
    EdgeCaseRt,
    EdgeCasesScope,
    EdgeLocalCase,
    EdgeLocalCasesResponse,
    EdgeLocalSession,
    EdgePartPointer,
} from '../contracts';
import { AuthPort, boxDay, BoxConfig, BoxSessionRecord, EdgePrincipal, KernelPort, KernelSessionView, Reply, StatePort, UplinkPort } from '../ports';
import { sessionStartAtMs, sessionStartDay, startOfBoxDayMs, usableZone } from '../auth/box-time';
import { contractLocalState, isSessionGone, sameId, sessionPhaseOf } from '../auth/session-facts';

export interface LocalCasesDeps {
    readonly config: BoxConfig;
    readonly state: StatePort;
    readonly kernel: KernelPort;
    readonly uplink: UplinkPort;
    readonly auth: AuthPort;
}

/** `${cloudOrigin}/rt/session/<nSesid>` ("Open on etabella.net", DR9). */
export function cloudSessionUrl(config: BoxConfig, nSesid: string): string {
    return `${config.cloud.origin}/rt/session/${encodeURIComponent(nSesid)}`;
}

/** The Part 2 pointer of a split session (D7, DR9); null before a split. */
export function partPointer(config: BoxConfig, s: BoxSessionRecord): EdgePartPointer | null {
    if (!s.next) return null;
    return {
        nSesid: s.next.nSesid,
        nPartNo: s.next.nPartNo,
        cloudUrl: cloudSessionUrl(config, s.next.nSesid),
        splitAtMs: s.next.splitAtMs ?? s.endRequestedAtMs ?? s.updatedAtMs,
    };
}

function kernelView(kernel: KernelPort, nSesid: string): KernelSessionView | null {
    try {
        return kernel.session(nSesid);
    } catch {
        return null;
    }
}

/** One session as the dashboard shows it. `isToday`: its start date in its own `tz` is today in that `tz`. */
export function localSession(deps: LocalCasesDeps, s: BoxSessionRecord, nowMs: number): EdgeLocalSession {
    const view = kernelView(deps.kernel, s.nSesid);
    const tz = usableZone(s.tz, deps.config.box.timeZone);
    return {
        nSesid: s.nSesid,
        nCaseid: s.nCaseid,
        cName: s.cName,
        dStartDt: s.dStartDt,
        tz: s.tz,
        startAtMs: sessionStartAtMs(s.dStartDt, tz),
        isToday: sessionStartDay(s.dStartDt, tz) === boxDay(nowMs, tz),
        phase: sessionPhaseOf(s, view),
        localState: contractLocalState(view?.localState ?? s.localState),
        firstLineAtMs: view?.firstLineAtMs ?? s.firstLineAtMs,
        lastLineAtMs: view?.lastLineAtMs ?? null,
        page: view?.page ?? null,
        totalLines: view?.totalLines ?? 0,
        endedAtMs: view?.endedAtMs ?? s.endedAtMs,
        nPartNo: s.nPartNo,
        nPrevPartSesid: s.nPrevPartSesid,
        continuedAs: partPointer(deps.config, s),
        cloudUrl: cloudSessionUrl(deps.config, s.nSesid),
    };
}

/**
 * "Oldest start first" (contract `EdgeLocalCase.sessions`): the start instant, a date-only start at the beginning of its
 * day in the session's zone, sessions without a start last; then the stored `dStartDt`, then the id (stable).
 */
export function sessionStartOrder(a: EdgeLocalSession, b: EdgeLocalSession): number {
    const key = (s: EdgeLocalSession): number => {
        if (s.startAtMs != null) return s.startAtMs;
        const day = sessionStartDay(s.dStartDt, s.tz);
        if (day) {
            try {
                return startOfBoxDayMs(day, s.tz);
            } catch {
                /* an unknown zone: fall through */
            }
        }
        return Number.MAX_SAFE_INTEGER;
    };
    const noStart = (s: EdgeLocalSession): number => (s.dStartDt ? 0 : 1);
    return key(a) - key(b) || noStart(a) - noStart(b) || String(a.dStartDt ?? '').localeCompare(String(b.dStartDt ?? '')) || a.nSesid.localeCompare(b.nSesid);
}

/** The RT button of one case (DR4, DR8). */
export function caseRt(sessions: readonly EdgeLocalSession[]): EdgeCaseRt {
    const live = sessions.filter(s => s.phase === 'live');
    if (live.length) {
        const pick = [...live].sort((a, b) => (b.firstLineAtMs ?? 0) - (a.firstLineAtMs ?? 0))[0];
        return { kind: 'live', nSesid: pick.nSesid, sessionName: pick.cName, startAtMs: null, rank: EDGE_CASE_RT_RANK.live };
    }
    const todayWaiting = sessions.filter(s => s.isToday && s.phase === 'not-started');
    const timed = todayWaiting.filter(s => s.startAtMs != null).sort((a, b) => a.startAtMs - b.startAtMs);
    if (timed.length) {
        return { kind: 'next-today', nSesid: timed[0].nSesid, sessionName: timed[0].cName, startAtMs: timed[0].startAtMs, rank: EDGE_CASE_RT_RANK['next-today'] };
    }
    if (todayWaiting.length) {
        const s = todayWaiting[0];
        return { kind: 'today-not-started', nSesid: s.nSesid, sessionName: s.cName, startAtMs: null, rank: EDGE_CASE_RT_RANK['today-not-started'] };
    }
    return { kind: 'other', nSesid: null, sessionName: null, startAtMs: null, rank: EDGE_CASE_RT_RANK.other };
}

function scopeOf(principal: EdgePrincipal): EdgeCasesScope {
    return principal.kind === 'online' ? 'case-team' : principal.kind;
}

/** Assignments synced since the start of today (box zone), or the cloud link is up now. */
export function assignmentsFresh(deps: LocalCasesDeps, syncedAtMs: number | null, nowMs: number): boolean {
    const tz = deps.config.box.timeZone;
    if (syncedAtMs != null && syncedAtMs >= startOfBoxDayMs(boxDay(nowMs, tz), tz)) return true;
    try {
        return deps.uplink.status().online === true;
    } catch {
        return false;
    }
}

export function buildLocalCases(deps: LocalCasesDeps, principal: EdgePrincipal, nowMs: number): Reply<EdgeLocalCasesResponse> {
    const tz = deps.config.box.timeZone;
    const today = boxDay(nowMs, tz);
    const cases: EdgeLocalCase[] = [];
    for (const c of deps.state.assignments.cases()) {
        if (!deps.auth.canSeeCase(principal, c.nCaseid)) continue;
        const sessions = deps.state.sessions
            .forCase(c.nCaseid)
            .filter(s => !isSessionGone(s) && deps.auth.canOpenSession(principal, s.nSesid))
            .map(s => localSession(deps, s, nowMs))
            .sort(sessionStartOrder);
        const roomSession = principal.kind === 'room-code' ? sessions.find(s => sameId(s.nSesid, principal.sessionId)) : undefined;
        cases.push({
            nCaseid: c.nCaseid,
            cCasename: c.cCasename,
            cCaseno: c.cCaseno,
            isCaseAdmin: principal.adminCaseIds.some(id => sameId(id, c.nCaseid)),
            roomAccess: principal.kind === 'room-code' && principal.sessionId ? { nSesid: roomSession?.nSesid ?? principal.sessionId, sessionName: roomSession?.cName ?? '' } : null,
            rt: caseRt(sessions),
            sessions,
        });
    }
    cases.sort(
        (a, b) =>
            a.rt.rank - b.rt.rank ||
            (a.rt.startAtMs ?? Number.MAX_SAFE_INTEGER) - (b.rt.startAtMs ?? Number.MAX_SAFE_INTEGER) ||
            a.cCasename.localeCompare(b.cCasename),
    );
    const syncedAtMs = deps.state.assignments.syncedAtMs();
    const fresh = assignmentsFresh(deps, syncedAtMs, nowMs);
    return {
        nowMs,
        today,
        timeZone: tz,
        viewer: principal.kind,
        scope: scopeOf(principal),
        emptyReason: cases.length ? null : fresh ? 'no-cases' : 'not-on-box-yet',
        assignments: { syncedAtMs, fresh },
        cases,
    };
}
