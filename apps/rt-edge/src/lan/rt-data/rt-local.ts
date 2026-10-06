/**
 * The local RT reads (rt-routes.ts kind `local` / `local-or-cloud`), built from the box's state and the kernel's
 * committed canonical pages, in the shapes the cloud's handlers answer (apps/realtime-server):
 *
 * - session rows (`session/getSessionsByCaseId`, `getlivesessionbycaseid`, `activesession`): the fields the edge
 *   build reads (evidence-api.types.ts `ApiSessionRes`, the FE mock's `sessionRow`), venue fields included. The
 *   cloud's list SP (`realtime_combo_sessionlist`) is not in the repo, so its exact column list is not mirrored.
 * - `session/activesession/detail`: `et_realtime_sessiondata`'s columns (assets/sql-migrations/
 *   2026-05-09_upload_publish_cstatus.sql) + `maxNumber` + `pageRes` (session.service.ts getActiveSessionDetail /
 *   getFilesCount: the draft page count and the last page as its JSON text). Columns the box cannot know (issue
 *   defaults, server, creator) carry the SP's empty values.
 * - `session/realtimedatabysesid`: `{msg:1, data}` with `data` exactly as the cloud builds it, through the SAME
 *   shared code since Phase 6 (@app/rt-features/transcript-shape `pagesFromList`; the cloud's ConversionJsService
 *   calls `pagesFromSessionMap` of the same module): `{msg, page, data:[{time, lineIndex, lines, formate, unicid}]}`;
 *   `{msg:-1}` when there is nothing. The row and page types are @app/api-contracts (responses/transcript.ts).
 * - `feed/pages/total` `{msg:1, total}` / `{msg:-1, total:0}`, `feed/pages/data` `{total, feed:[{nSesid, page,
 *   data}]}` with the canonical tuples (feed.service.ts, feed-data.service.ts getSessionPagesData).
 *
 * Scope (DR19): a case's rows only when `AuthPort.canSeeCase`, and only the sessions `AuthPort.canOpenSession`
 * allows (case team, assignee, case admin, super-admin; a room code only its session); unknown, purged and
 * cloud-deleted sessions never. A client-supplied `nUserid` is never read.
 */
import type { CanonicalPage } from '@app/edge-sync';
import type { RtSessionDetail, RtSessionRow, RtSessionStatus, RtSyncState, RtTranscriptPage } from '@app/api-contracts';
import { pagesFromList } from '@app/rt-features/transcript-shape';

import { AuthPort, BoxCaseRecord, BoxSessionRecord, EdgePortError, EdgePrincipal, KernelPort, KernelSessionView, StatePort } from '../../ports';
import { isSessionEnding, isSessionGone, sameId, sessionPhaseOf } from '../../auth/session-facts';

// The wire shapes live in @app/api-contracts since Phase 6; re-exported for this folder's importers.
export type { RtSessionDetail, RtSessionRow, RtSessionStatus, RtSyncState, RtTranscriptLine, RtTranscriptPage } from '@app/api-contracts';
export { codesToText } from '@app/rt-features/transcript-shape';

export interface RtLocalDeps {
    readonly state: StatePort;
    readonly kernel: KernelPort;
    readonly auth: AuthPort;
}

export interface RtFeedPage {
    readonly nSesid: string;
    readonly page: number;
    readonly data: CanonicalPage;
}

/** Local states in which the kernel records a session that has no line yet (it is waiting for the reporter). */
const RECORDING_STATES: ReadonlySet<string> = new Set(['armed', 'live', 'recovering', 'frozen']);
/** The most page numbers one `feed/pages/data` call may name. */
export const RT_MAX_PAGES_PER_CALL = 2_000;

/** The kernel's live view of a session, or null when it does not hold it (never throws). */
export function kernelView(kernel: KernelPort, nSesid: string): KernelSessionView | null {
    try {
        return kernel.session(nSesid) ?? null;
    } catch {
        return null;
    }
}

/** The kernel's committed canonical pages (index p-1 = page p); null when the kernel does not hold the session. */
export function heldPages(kernel: KernelPort, nSesid: string): readonly CanonicalPage[] | null {
    if (!kernelView(kernel, nSesid)) return null;
    try {
        return kernel.pages(nSesid) ?? [];
    } catch {
        return [];
    }
}

export function rtSessionStatus(s: BoxSessionRecord, view: KernelSessionView | null): RtSessionStatus {
    const phase = sessionPhaseOf(s, view);
    if (phase === 'live') return 'R';
    if (phase === 'ended') return s.sealedAtMs != null || s.localState === 'sealed' || s.localState === 'complete' ? 'C' : 'E';
    return RECORDING_STATES.has(view?.localState ?? s.localState) ? 'R' : 'D';
}

export function rtSyncState(s: BoxSessionRecord, view: KernelSessionView | null): RtSyncState {
    if (s.sealState === 'K' || s.sealState === 'W') return s.sealState;
    return isSessionEnding(s, view) ? 'S' : 'L';
}

function protocolOf(s: BoxSessionRecord, view: KernelSessionView | null): 'B' | 'C' {
    const p = view?.protocol ?? s.protocol;
    return p === 'B' ? 'B' : 'C';
}

/** The box's id (venue fields); null when it cannot be read. */
export function boxId(state: StatePort): string | null {
    try {
        return state.identity.get()?.nEdgeid ?? null;
    } catch {
        return null;
    }
}

export function rtSessionRow(s: BoxSessionRecord, c: BoxCaseRecord | null, view: KernelSessionView | null, nEdgeid: string | null): RtSessionRow {
    return {
        nSesid: s.nSesid,
        nCaseid: s.nCaseid,
        cName: s.cName,
        dStartDt: s.dStartDt,
        cStatus: rtSessionStatus(s, view),
        isTranscript: false,
        isUploaded: false,
        cProtocol: protocolOf(s, view),
        nLines: s.nLines,
        cCaseno: c?.cCaseno ?? '',
        cCasename: c?.cCasename ?? '',
        bRefresh: false,
        nRTSid: null,
        nLSesid: s.nSesid,
        cUrl: null,
        nPort: null,
        cTimezone: s.tz,
        cFeedSource: 'E',
        nEdgeid,
        cSyncState: rtSyncState(s, view),
        nPartNo: s.nPartNo,
        nPrevPartSesid: s.nPrevPartSesid,
        nNextPartSesid: s.next?.nSesid ?? null,
    };
}

/** The sessions of `nCaseid` this principal may open (DR19), in the store's order (oldest start first). */
export function visibleSessions(deps: RtLocalDeps, principal: EdgePrincipal, nCaseid: string | null): BoxSessionRecord[] {
    if (!nCaseid || !deps.auth.canSeeCase(principal, nCaseid)) return [];
    return deps.state.sessions.forCase(nCaseid).filter(s => !isSessionGone(s) && deps.auth.canOpenSession(principal, s.nSesid));
}

function caseOf(deps: RtLocalDeps, nCaseid: string): BoxCaseRecord | null {
    try {
        return deps.state.assignments.case(nCaseid);
    } catch {
        return null;
    }
}

/** `session/getSessionsByCaseId`: every visible session of the case ([] for a case the principal may not see). */
export function sessionList(deps: RtLocalDeps, principal: EdgePrincipal, nCaseid: string | null): RtSessionRow[] {
    const sessions = visibleSessions(deps, principal, nCaseid);
    if (!sessions.length) return [];
    const c = caseOf(deps, nCaseid);
    const nEdgeid = boxId(deps.state);
    return sessions.map(s => rtSessionRow(s, c, kernelView(deps.kernel, s.nSesid), nEdgeid));
}

/** `session/getlivesessionbycaseid`: the visible sessions that are live (lines received, not ended). */
export function liveSessionRows(deps: RtLocalDeps, principal: EdgePrincipal, nCaseid: string | null): RtSessionRow[] {
    const sessions = visibleSessions(deps, principal, nCaseid);
    if (!sessions.length) return [];
    const c = caseOf(deps, nCaseid);
    const nEdgeid = boxId(deps.state);
    const out: Array<{ row: RtSessionRow; firstLineAtMs: number }> = [];
    for (const s of sessions) {
        const view = kernelView(deps.kernel, s.nSesid);
        if (sessionPhaseOf(s, view) !== 'live') continue;
        out.push({ row: rtSessionRow(s, c, view, nEdgeid), firstLineAtMs: view?.firstLineAtMs ?? s.firstLineAtMs ?? 0 });
    }
    // The most recently started first (the one `activesession` answers).
    return out.sort((a, b) => b.firstLineAtMs - a.firstLineAtMs).map(x => x.row);
}

/** `session/activesession`: the case's live session (the most recently started one); null when none. */
export function activeSessionRow(deps: RtLocalDeps, principal: EdgePrincipal, nCaseid: string | null): RtSessionRow | null {
    return liveSessionRows(deps, principal, nCaseid)[0] ?? null;
}

/** The stored session when this principal may open it; null otherwise (unknown, gone and forbidden look the same). */
export function openableSession(deps: RtLocalDeps, principal: EdgePrincipal, nSesid: string | null): BoxSessionRecord | null {
    if (!nSesid) return null;
    let s: BoxSessionRecord | null;
    try {
        s = deps.state.sessions.get(nSesid);
    } catch {
        return null;
    }
    if (isSessionGone(s) || !deps.auth.canOpenSession(principal, s.nSesid)) return null;
    return s;
}

/** `session/activesession/detail` of a session the principal may open, from `pages` (the kernel's, or none). */
export function sessionDetail(deps: RtLocalDeps, s: BoxSessionRecord, pages: readonly CanonicalPage[]): RtSessionDetail {
    const view = kernelView(deps.kernel, s.nSesid);
    const c = caseOf(deps, s.nCaseid);
    return {
        nCaseid: s.nCaseid,
        nSesid: s.nSesid,
        nRTSid: null,
        cName: s.cName ?? '',
        dStartDt: s.dStartDt,
        nDays: 1,
        nLines: s.nLines || 25,
        nPageno: 1,
        cUnicuserid: null,
        cStatus: rtSessionStatus(s, view),
        cNotifytype: null,
        dCreatedt: null,
        cCaseno: c?.cCaseno ?? '',
        cUrl: null,
        nPort: null,
        cCasename: c?.cCasename ?? '',
        totaIssues: 0,
        cDefHIssues: [],
        nLID: null,
        cColor: null,
        cDefIssues: [],
        nLIid: null,
        cAColor: null,
        isTrans: false,
        nDemoid: 1,
        cProtocol: protocolOf(s, view),
        maxNumber: pages.length,
        pageRes: pages.length ? JSON.stringify(pages[pages.length - 1]) : null,
    };
}

/** The cloud's `realtimedatabysesid` pages over the box's committed pages (index p-1 = page p): the shared shaper. */
export function transcriptPages(pages: readonly CanonicalPage[]): RtTranscriptPage[] {
    return pagesFromList(pages);
}

/** `feed/pages/data` from the box's pages: each named page that exists, once, ascending (the cloud's live path). */
export function feedPagesData(nSesid: string, pages: readonly CanonicalPage[], wanted: readonly number[]): { total: number; feed: RtFeedPage[] } {
    const set = new Set(wanted.filter(p => Number.isInteger(p) && p >= 1 && p <= pages.length));
    const feed = [...set].sort((a, b) => a - b).map(p => ({ nSesid, page: p, data: pages[p - 1] }));
    return { total: pages.length, feed };
}

/**
 * The `pages` query of `feed/pages/data` (FeedPageReq): a JSON array of whole numbers, not empty, at most
 * RT_MAX_PAGES_PER_CALL. Anything else is `invalid_request` (the cloud's ValidationPipe answers 400 too).
 */
export function parsePagesParam(text: string | null): number[] {
    if (text === null || text === '') throw new EdgePortError('invalid_request', 'pages is required');
    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new EdgePortError('invalid_request', 'pages must be a JSON array of page numbers');
    }
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > RT_MAX_PAGES_PER_CALL) {
        throw new EdgePortError('invalid_request', `pages must be a JSON array of 1-${RT_MAX_PAGES_PER_CALL} page numbers`);
    }
    const out = parsed.map(v => Number(v));
    if (!out.every(n => Number.isSafeInteger(n))) throw new EdgePortError('invalid_request', 'pages must be whole numbers');
    return out;
}

/** `coreapi/case/caseinfo` of a box case the principal may see (the fields the box holds); null otherwise. */
export function caseInfo(deps: RtLocalDeps, principal: EdgePrincipal, nCaseid: string | null): { nCaseid: string; cCasename: string; cCaseno: string } | null {
    if (!nCaseid || !deps.auth.canSeeCase(principal, nCaseid)) return null;
    const c = caseOf(deps, nCaseid);
    if (!c || !sameId(c.nCaseid, nCaseid)) return null;
    return { nCaseid: c.nCaseid, cCasename: c.cCasename, cCaseno: c.cCaseno };
}
