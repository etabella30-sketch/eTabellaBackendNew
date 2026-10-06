/**
 * The RT data routes the box answers under the cloud service bases (spec §8.2 rows 4, 6, 7; §8.5; D32, DR9, DR19):
 * what the edge build's RT page reads and writes on `/realtimeapi` and `/coreapi`, and how the box answers each one.
 * Everything NOT in this table keeps answering `403 {useCloud:true}` (LanExceptionFilter), any method.
 *
 * Kinds:
 * - `local`: answered from the box's own state and kernel (works with the internet down), scope-checked by the
 *   principal's cases and sessions (DR19).
 * - `local-or-cloud`: one session's transcript; local while the kernel holds the session (live, ended-unsealed), else
 *   read from the cloud like `cloud-read` (a sealed session: the kernel dropped it, the cloud has every line), else
 *   the local "no data yet" answer.
 * - `cloud-read`: an allowlisted GET proxied to `BoxConfig.cloud.realtimeApiUrl` with the caller's edge token and a
 *   per-user read-through cache (short TTL; stale-if-offline with `X-Edge-Stale: <age s>`). Offline, or for a
 *   box-signed token that is never forwarded: the cached copy, else `offlineBody` (`X-Edge-Offline: 1` /
 *   `X-Edge-Reauth: 1`), or `503 offline` / `503 reauth` for a route without one.
 * - `cloud-write`: an allowlisted write (marks, issues; v1 marks need the internet, S-D6): proxied online with the
 *   caller's edge token; `503 {offline:true}` offline; `503 {reauth:true}` for box-signed tokens. Never cached; a
 *   successful write makes the caller's cached reads stale (kept only for the fallbacks).
 *
 * Matching is EXACT: the method, and the raw request path compared case-insensitively (Express on the cloud routes
 * case-insensitively too: the FE calls `fact/inserthighlights`, the cloud declares `insertHighlights`), one optional
 * trailing slash. A percent-escape, a backslash, `.`/`..` or an empty segment never matches (→ `use_cloud`). The
 * proxied path is `cloudPath` from this table, never the client's path.
 */

export type RtRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type RtRouteKind = 'local' | 'local-or-cloud' | 'cloud-read' | 'cloud-write';

export interface RtRoute {
    /** Stable id (handlers, cache keys, logs). */
    readonly id: string;
    readonly method: RtRouteMethod;
    /** The box path as the edge build calls it (matched case-insensitively). */
    readonly path: string;
    readonly kind: RtRouteKind;
    /** `local-or-cloud`, `cloud-read`, `cloud-write`: the path under `cloud.realtimeApiUrl`, as the cloud declares it. */
    readonly cloudPath?: string;
    /**
     * `cloud-read`: the body an offline caller (no cached copy) or a box-signed token gets, as the FE mock answers it;
     * `null` = no safe empty answer (`503 offline` / `503 reauth`): the Full Fact editor must never open on an empty
     * read and save it back (mark-api.service.ts readFactSheetRows).
     */
    readonly offlineBody?: unknown;
    /** `local` routes that answer a fixed body (the FE mock's empty coreapi lists). */
    readonly localBody?: unknown;
    /** Why the box answers it this way (and where the FE calls it). */
    readonly note: string;
}

const EMPTY3 = Object.freeze([Object.freeze([]), Object.freeze([]), Object.freeze([])]);
const EMPTY2 = Object.freeze([Object.freeze([]), Object.freeze([])]);
const EMPTY = Object.freeze([]);

/** One table, in the order of spec §8.2. Frozen. */
export const RT_ROUTES: readonly RtRoute[] = Object.freeze(([
    // ---- local reads (box sessions; DR19 scope) ------------------------------------------------------------------
    {
        id: 'session.list',
        method: 'GET',
        path: '/realtimeapi/session/getSessionsByCaseId',
        kind: 'local',
        note: 'session list of a case (TranscriptSessionApiService getTranscriptSessions + getLocalRealtimeSessionsByCaseId; also matches getsessionsbycaseid)',
    },
    {
        id: 'session.live',
        method: 'GET',
        path: '/realtimeapi/session/getlivesessionbycaseid',
        kind: 'local',
        note: 'live sessions of a case (getLiveSessionByCaseId)',
    },
    {
        id: 'session.active',
        method: 'GET',
        path: '/realtimeapi/session/activesession',
        kind: 'local',
        note: "the case's live session, one row (RealtimeActiveSessionService)",
    },
    {
        id: 'session.detail',
        method: 'GET',
        path: '/realtimeapi/session/activesession/detail',
        kind: 'local-or-cloud',
        cloudPath: 'session/activesession/detail',
        note: 'one session: nLines + maxNumber (RealtimeLiveFeedStore after a reload)',
    },
    {
        id: 'session.transcript',
        method: 'GET',
        path: '/realtimeapi/session/realtimedatabysesid',
        kind: 'local-or-cloud',
        cloudPath: 'session/realtimedatabysesid',
        note: 'the full transcript of a session (reader / transcript view)',
    },
    {
        id: 'feed.total',
        method: 'GET',
        path: '/realtimeapi/feed/pages/total',
        kind: 'local-or-cloud',
        cloudPath: 'feed/pages/total',
        note: 'page count for live-feed recovery',
    },
    {
        id: 'feed.data',
        method: 'GET',
        path: '/realtimeapi/feed/pages/data',
        kind: 'local-or-cloud',
        cloudPath: 'feed/pages/data',
        note: 'pages for live-feed recovery (bTranscript=true: the published transcript, always from the cloud)',
    },
    // ---- allowlisted reads proxied to the cloud (spec §8.2 row 6, plus the Full Fact editor's reads) ---------------
    { id: 'marknav.all', method: 'GET', path: '/realtimeapi/marknav/all', kind: 'cloud-read', cloudPath: 'marknav/all', offlineBody: EMPTY3, note: 'Mark Navigator (MarkApiService getMarkNavAll)' },
    { id: 'marknav.quickmarks', method: 'GET', path: '/realtimeapi/marknav/quickmarklist', kind: 'cloud-read', cloudPath: 'marknav/quickmarklist', offlineBody: EMPTY, note: 'Quick Marks of a session (getQuickMarks)' },
    { id: 'feed.annotations', method: 'GET', path: '/realtimeapi/feed/annotations', kind: 'cloud-read', cloudPath: 'feed/annotations', offlineBody: EMPTY3, note: 'transcript overlay marks (getFeedAnnotations / getFeedAnnotationCursors)' },
    { id: 'doclink.detail', method: 'GET', path: '/realtimeapi/doclink/docdetail', kind: 'cloud-read', cloudPath: 'doclink/docdetail', offlineBody: EMPTY, note: 'DocLink destinations (getDocDetails)' },
    { id: 'issue.list', method: 'GET', path: '/realtimeapi/issue/issuelist_V2', kind: 'cloud-read', cloudPath: 'issue/issuelist_V2', offlineBody: EMPTY2, note: 'claims + issues for the QFact picker (IssueApiService getIssueList)' },
    { id: 'factsheet.detail', method: 'GET', path: '/realtimeapi/factsheet/detail', kind: 'cloud-read', cloudPath: 'factsheet/detail', offlineBody: null, note: 'Full Fact editor on the RT page (getFactSheetDetail)' },
    { id: 'factsheet.issues', method: 'GET', path: '/realtimeapi/factsheet/issues', kind: 'cloud-read', cloudPath: 'factsheet/issues', offlineBody: null, note: 'Full Fact editor (getFactSheetRows issues)' },
    { id: 'factsheet.contacts', method: 'GET', path: '/realtimeapi/factsheet/contacts', kind: 'cloud-read', cloudPath: 'factsheet/contacts', offlineBody: null, note: 'Full Fact editor (getFactSheetRows contacts)' },
    { id: 'factsheet.links', method: 'GET', path: '/realtimeapi/factsheet/links', kind: 'cloud-read', cloudPath: 'factsheet/links', offlineBody: null, note: 'Full Fact editor (getFactSheetRows links)' },
    { id: 'factsheet.shared', method: 'GET', path: '/realtimeapi/factsheet/shared', kind: 'cloud-read', cloudPath: 'factsheet/shared', offlineBody: null, note: 'Full Fact editor (getFactSheetRows shared)' },
    { id: 'factsheet.tasks', method: 'GET', path: '/realtimeapi/factsheet/tasks', kind: 'cloud-read', cloudPath: 'factsheet/tasks', offlineBody: null, note: 'Full Fact editor (getFactSheetRows tasks)' },
    // ---- allowlisted writes (spec §8.2 row 7; §8.5 v1 online only) ---------------------------------------------------
    { id: 'fact.quickmark.insert', method: 'POST', path: '/realtimeapi/fact/inserthighlights', kind: 'cloud-write', cloudPath: 'fact/insertHighlights', note: 'Quick Mark create (insertQuickMark)' },
    { id: 'fact.quickmark.delete', method: 'POST', path: '/realtimeapi/fact/deleteHighlights', kind: 'cloud-write', cloudPath: 'fact/deleteHighlights', note: 'Quick Mark delete (deleteQuickMark)' },
    { id: 'fact.qfact.insert', method: 'POST', path: '/realtimeapi/fact/insertquickfact', kind: 'cloud-write', cloudPath: 'fact/insertquickfact', note: 'QFact create (insertQuickFact)' },
    { id: 'fact.qfact.update', method: 'POST', path: '/realtimeapi/fact/quickfactupdate', kind: 'cloud-write', cloudPath: 'fact/quickfactupdate', note: 'QFact update (updateQuickFact)' },
    { id: 'fact.insert', method: 'POST', path: '/realtimeapi/fact/insertfact', kind: 'cloud-write', cloudPath: 'fact/insertfact', note: 'Fact create (insertFact)' },
    { id: 'fact.highlight', method: 'POST', path: '/realtimeapi/fact/addhighlight', kind: 'cloud-write', cloudPath: 'fact/addhighlight', note: 'PDF Fact/QFact highlight (addFactHighlight; spec §8.2 allowlist)' },
    { id: 'factsheet.save', method: 'POST', path: '/realtimeapi/factsheet/save', kind: 'cloud-write', cloudPath: 'factsheet/save', note: 'Full Fact edit (saveFactSheet)' },
    { id: 'factsheet.delete', method: 'POST', path: '/realtimeapi/factsheet/delete', kind: 'cloud-write', cloudPath: 'factsheet/delete', note: 'Fact / QFact delete (deleteFact)' },
    { id: 'doclink.insert', method: 'POST', path: '/realtimeapi/doclink/insertdoc', kind: 'cloud-write', cloudPath: 'doclink/insertdoc', note: 'DocLink create (insertDoc)' },
    { id: 'doclink.delete', method: 'POST', path: '/realtimeapi/doclink/docdelete', kind: 'cloud-write', cloudPath: 'doclink/docdelete', note: 'DocLink delete (deleteDoc)' },
    { id: 'issue.update', method: 'PUT', path: '/realtimeapi/issue/updateIssue', kind: 'cloud-write', cloudPath: 'issue/updateIssue', note: 'issue-api.service.ts updateIssue' },
    { id: 'issue.insert', method: 'POST', path: '/realtimeapi/issue/insertIssue', kind: 'cloud-write', cloudPath: 'issue/insertIssue', note: 'issue-api.service.ts insertIssue' },
    { id: 'issue.delete', method: 'DELETE', path: '/realtimeapi/issue/deleteIssue', kind: 'cloud-write', cloudPath: 'issue/deleteIssue', note: 'issue-api.service.ts deleteIssue' },
    { id: 'issue.delete.multi', method: 'DELETE', path: '/realtimeapi/issue/delete/multi/issue', kind: 'cloud-write', cloudPath: 'issue/delete/multi/issue', note: 'issue-api.service.ts deleteMultiIssue' },
    { id: 'issue.category.insert', method: 'POST', path: '/realtimeapi/issue/insertCategory', kind: 'cloud-write', cloudPath: 'issue/insertCategory', note: 'issue-api.service.ts insertCategory' },
    { id: 'issue.qfact.sequence', method: 'POST', path: '/realtimeapi/issue/qfact/sequence', kind: 'cloud-write', cloudPath: 'issue/qfact/sequence', note: 'issue-api.service.ts saveQfactSequence' },
    { id: 'issue.qfact.claim.sequence', method: 'POST', path: '/realtimeapi/issue/qfact/claim/sequence', kind: 'cloud-write', cloudPath: 'issue/qfact/claim/sequence', note: 'issue-api.service.ts saveQfactClaimSequence' },
    { id: 'issue.claim.update', method: 'PUT', path: '/realtimeapi/issue/updateClaimDetail', kind: 'cloud-write', cloudPath: 'issue/updateClaimDetail', note: 'issue-api.service.ts updateClaim' },
    // ---- coreapi aliases: team sharing uses the scoped realtime API; other pickers remain local -----------------
    { id: 'core.caseinfo', method: 'GET', path: '/coreapi/case/caseinfo', kind: 'local', note: "the case chip, from the box's cached assignments" },
    { id: 'core.getcode', method: 'GET', path: '/coreapi/common/getcode', kind: 'local', localBody: EMPTY, note: 'code tables (party / grade pickers): not on the box, empty as the FE mock answers' },
    { id: 'core.myteamusers', method: 'GET', path: '/coreapi/common/myteamusers', kind: 'cloud-read', cloudPath: 'factsheet/teamusers', offlineBody: null, note: 'Fact sharing recipients: the caller\'s sub-team from the Edge-scoped realtime endpoint (nCaseid required)' },
    { id: 'core.contacts', method: 'GET', path: '/coreapi/contact/getcontactlist', kind: 'local', localBody: EMPTY, note: 'Full Fact participants picker: not on the box, empty as the FE mock answers' },
    { id: 'core.tasks', method: 'GET', path: '/coreapi/workspace/tasks/list', kind: 'local', localBody: EMPTY, note: 'Full Fact task picker: not on the box, empty as the FE mock answers' },
    { id: 'core.comments', method: 'GET', path: '/coreapi/comments/grid', kind: 'local', localBody: EMPTY, note: 'Fact comments: not on the box, empty as the FE mock answers' },
    { id: 'core.annotations', method: 'GET', path: '/coreapi/common/getannotations', kind: 'local', localBody: EMPTY, note: 'PDF overlay geometry (reader): not on the box, empty as the FE mock answers' },
] as RtRoute[]).map(r => Object.freeze(r)));

/** Paths are compared in lower case; a key is `METHOD path`. */
const BY_KEY: ReadonlyMap<string, RtRoute> = new Map(RT_ROUTES.map(r => [`${r.method} ${r.path.toLowerCase()}`, r]));

/** A raw request path the table may match: no escapes, backslashes, dot or empty segments, at most 512 characters. */
export function isPlainPath(rawPath: string): boolean {
    if (typeof rawPath !== 'string' || rawPath.length === 0 || rawPath.length > 512 || !rawPath.startsWith('/')) return false;
    if (/[%\\\0\s]/.test(rawPath)) return false;
    const segments = rawPath.slice(1).split('/');
    if (segments[segments.length - 1] === '') segments.pop(); // one trailing slash
    return segments.length > 0 && segments.every(s => s !== '' && s !== '.' && s !== '..');
}

/** The route of `method rawPath` (the path WITHOUT its query), or null. */
export function matchRtRoute(method: string, rawPath: string): RtRoute | null {
    if (typeof method !== 'string' || !isPlainPath(rawPath)) return null;
    const path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
    return BY_KEY.get(`${method.toUpperCase()} ${path.toLowerCase()}`) ?? null;
}

/** Every `METHOD path` key of the table (lower-case paths), for specs and diagnostics. */
export function rtRouteKeys(): string[] {
    return [...BY_KEY.keys()];
}
