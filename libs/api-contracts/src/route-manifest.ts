/**
 * ROUTE_MANIFEST: the one list behind the box RT table, the cloud edge-token allowlist and the FE drift check
 * (Phase 3 of the shared-libraries plan, 2026-10-06).
 *
 * Derived from it, in the same commit it was seeded:
 * - apps/rt-edge/src/lan/rt-data/rt-routes.ts `RT_ROUTES`: the `table` rows, in this order (spec §8.2), as the box
 *   answers them (`boxKind`, `cloudPath`, `offlineBody`, `localBody`, `note`);
 * - apps/realtime-server/src/middleware/realtime-edge-token.ts `EDGE_TOKEN_ROUTES`: the cloud paths of the relay
 *   rows (`local-or-cloud`, `cloud-read`, `cloud-write`), the only routes a venue box's edge token may call;
 * - the FE copy src/app/features/edge/api/rt-route-manifest.json (tools/ci/export-route-manifest.js), checked
 *   against the paths the four RT services call.
 *
 * Rows are either `table` (the box answers them: locally, or relayed to the cloud) or `use_cloud` (the FE calls them
 * from the RT services, the box refuses them `403 use_cloud` and the edge build goes to etabella.net directly). The
 * `/edge` family is NOT here: apps/rt-edge/src/contracts/routes.ts stays its source (it may import only its own
 * folder, and a lib never imports apps/).
 *
 * Seeded 2026-10-06 from the 43 `RT_ROUTES` and the 34 `EDGE_TOKEN_ROUTES`, behaviour unchanged, with one approved
 * removal (D11): `POST fact/addhighlight`. The FE calls it (mark-api.service.ts addFactHighlight), but no
 * realtime-server controller declares it, so the cloud answered 404 and the box passed that through; it now answers
 * `use_cloud` like every unknown route, and the cloud still answers 404. The three fixed-`[]` coreapi rows are kept
 * as they were (zero behaviour change).
 *
 * `teamScoped` is set only where today's shape already satisfies R5 (a relay with `offlineBody: null`): the Full Fact
 * editor reads and the team-users lookup. The mark and issue lists are team data too, but answer `[]` offline today;
 * flipping them to `null` (503 offline) is a behaviour change for Phases 7 and 9 (D3), not for this seed.
 *
 * `identity` names the rows whose body carries ANOTHER user's id (`jUsers` on the realtime-server DTOs InsertFact,
 * InsertQuickFact, saveFactSheet and InsertDoc); every other row takes every user id from the verified Caller once a
 * shared controller serves it (R4). On `use_cloud` rows it is informational until the row moves off `use_cloud`.
 *
 * route-manifest.spec.ts runs manifestInvariants over it; apps/realtime-server/src/route-manifest.spec.ts and
 * tools/ci/guards/route-manifest.spec.ts check every path against the committed route inventories.
 */
import type { RouteManifestRow } from './route-manifest.types';

const EMPTY3 = Object.freeze([Object.freeze([]), Object.freeze([]), Object.freeze([])]);
const EMPTY = Object.freeze([]);
const JUSERS = Object.freeze(['jUsers']);

/** Shorthand for the four shapes a row takes; `note` always comes from the caller. */
type Over = Partial<RouteManifestRow> & { id: string; path: string; note: string };

const realtime = (row: Over): RouteManifestRow => ({
  family: 'realtimeapi',
  method: 'GET',
  liveOwner: 'realtime-server',
  livePath: row.path.replace(/^\/realtimeapi\//, ''),
  boxOwner: 'table',
  teamScoped: false,
  identity: 'actor',
  legacyShape: 'realtime-server',
  ...row,
});

const core = (row: Over): RouteManifestRow => ({
  family: 'coreapi',
  method: 'GET',
  liveOwner: 'coreapi',
  livePath: row.path.replace(/^\/coreapi\//, ''),
  boxOwner: 'table',
  teamScoped: false,
  identity: 'actor',
  legacyShape: 'coreapi',
  ...row,
});

/** A relay row: `livePath` is the cloud's own spelling (the FE may call it in another case). */
const relay = (make: typeof realtime | typeof core, kind: 'local-or-cloud' | 'cloud-read' | 'cloud-write', row: Over & { cloudPath: string }): RouteManifestRow =>
  make({ livePath: row.cloudPath, boxKind: kind, ...row });

export const ROUTE_MANIFEST: readonly RouteManifestRow[] = Object.freeze(([
  // ---- box table: local reads (box sessions; DR19 scope) ---------------------------------------------------------
  realtime({ id: 'session.list', path: '/realtimeapi/session/getSessionsByCaseId', boxKind: 'local', note: 'session list of a case (TranscriptSessionApiService getTranscriptSessions + getLocalRealtimeSessionsByCaseId; also matches getsessionsbycaseid)' }),
  realtime({ id: 'session.live', path: '/realtimeapi/session/getlivesessionbycaseid', boxKind: 'local', note: 'live sessions of a case (getLiveSessionByCaseId)' }),
  realtime({ id: 'session.active', path: '/realtimeapi/session/activesession', boxKind: 'local', note: "the case's live session, one row (RealtimeActiveSessionService)" }),
  relay(realtime, 'local-or-cloud', { id: 'session.detail', path: '/realtimeapi/session/activesession/detail', cloudPath: 'session/activesession/detail', note: 'one session: nLines + maxNumber (RealtimeLiveFeedStore after a reload)' }),
  relay(realtime, 'local-or-cloud', { id: 'session.transcript', path: '/realtimeapi/session/realtimedatabysesid', cloudPath: 'session/realtimedatabysesid', note: 'the full transcript of a session (reader / transcript view)' }),
  relay(realtime, 'local-or-cloud', { id: 'feed.total', path: '/realtimeapi/feed/pages/total', cloudPath: 'feed/pages/total', note: 'page count for live-feed recovery' }),
  relay(realtime, 'local-or-cloud', { id: 'feed.data', path: '/realtimeapi/feed/pages/data', cloudPath: 'feed/pages/data', note: 'pages for live-feed recovery (bTranscript=true: the published transcript, always from the cloud)' }),
  // ---- box table: allowlisted reads proxied to the cloud (spec §8.2 row 6, plus the Full Fact editor's reads) ------
  relay(realtime, 'cloud-read', { id: 'marknav.all', path: '/realtimeapi/marknav/all', cloudPath: 'marknav/all', boxOwner: 'controller', offlineBody: EMPTY3, note: 'Mark Navigator (MarkApiService getMarkNavAll)' }),
  relay(realtime, 'cloud-read', { id: 'marknav.quickmarks', path: '/realtimeapi/marknav/quickmarklist', cloudPath: 'marknav/quickmarklist', boxOwner: 'controller', offlineBody: EMPTY, note: 'Quick Marks of a session (getQuickMarks)' }),
  relay(realtime, 'cloud-read', { id: 'feed.annotations', path: '/realtimeapi/feed/annotations', cloudPath: 'feed/annotations', offlineBody: EMPTY3, note: 'transcript overlay marks (getFeedAnnotations / getFeedAnnotationCursors)' }),
  relay(realtime, 'cloud-read', { id: 'doclink.detail', path: '/realtimeapi/doclink/docdetail', cloudPath: 'doclink/docdetail', boxOwner: 'controller', offlineBody: EMPTY, note: 'DocLink destinations (getDocDetails)' }),
  relay(realtime, 'cloud-read', { id: 'issue.list', path: '/realtimeapi/issue/issuelist_V2', cloudPath: 'issue/issuelist_V2', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'claims + issues for the QFact picker (IssueApiService getIssueList); team data (D3): the box never answers it itself, 503 offline (Phase 9)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.detail', path: '/realtimeapi/factsheet/detail', cloudPath: 'factsheet/detail', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor on the RT page (getFactSheetDetail)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.issues', path: '/realtimeapi/factsheet/issues', cloudPath: 'factsheet/issues', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor (getFactSheetRows issues)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.contacts', path: '/realtimeapi/factsheet/contacts', cloudPath: 'factsheet/contacts', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor (getFactSheetRows contacts)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.links', path: '/realtimeapi/factsheet/links', cloudPath: 'factsheet/links', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor (getFactSheetRows links)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.shared', path: '/realtimeapi/factsheet/shared', cloudPath: 'factsheet/shared', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor (getFactSheetRows shared)' }),
  relay(realtime, 'cloud-read', { id: 'factsheet.tasks', path: '/realtimeapi/factsheet/tasks', cloudPath: 'factsheet/tasks', boxOwner: 'controller', offlineBody: null, teamScoped: true, note: 'Full Fact editor (getFactSheetRows tasks)' }),
  // ---- box table: allowlisted writes (spec §8.2 row 7; §8.5 v1 online only) --------------------------------------
  relay(realtime, 'cloud-write', { id: 'fact.quickmark.insert', method: 'POST', path: '/realtimeapi/fact/inserthighlights', cloudPath: 'fact/insertHighlights', note: 'Quick Mark create (insertQuickMark)' }),
  relay(realtime, 'cloud-write', { id: 'fact.quickmark.delete', method: 'POST', path: '/realtimeapi/fact/deleteHighlights', cloudPath: 'fact/deleteHighlights', note: 'Quick Mark delete (deleteQuickMark)' }),
  relay(realtime, 'cloud-write', { id: 'fact.qfact.insert', method: 'POST', path: '/realtimeapi/fact/insertquickfact', cloudPath: 'fact/insertquickfact', identity: 'actor+target', targetFields: JUSERS, note: 'QFact create (insertQuickFact); jUsers = share recipients' }),
  relay(realtime, 'cloud-write', { id: 'fact.qfact.update', method: 'POST', path: '/realtimeapi/fact/quickfactupdate', cloudPath: 'fact/quickfactupdate', note: 'QFact update (updateQuickFact)' }),
  relay(realtime, 'cloud-write', { id: 'fact.insert', method: 'POST', path: '/realtimeapi/fact/insertfact', cloudPath: 'fact/insertfact', identity: 'actor+target', targetFields: JUSERS, note: 'Fact create (insertFact); jUsers = share recipients' }),
  relay(realtime, 'cloud-write', { id: 'factsheet.save', method: 'POST', path: '/realtimeapi/factsheet/save', cloudPath: 'factsheet/save', boxOwner: 'controller', identity: 'actor+target', targetFields: JUSERS, note: 'Full Fact edit (saveFactSheet); jUsers = share recipients' }),
  relay(realtime, 'cloud-write', { id: 'factsheet.delete', method: 'POST', path: '/realtimeapi/factsheet/delete', cloudPath: 'factsheet/delete', boxOwner: 'controller', note: 'Fact / QFact delete (deleteFact)' }),
  relay(realtime, 'cloud-write', { id: 'doclink.insert', method: 'POST', path: '/realtimeapi/doclink/insertdoc', cloudPath: 'doclink/insertdoc', boxOwner: 'controller', identity: 'actor+target', targetFields: JUSERS, note: 'DocLink create (insertDoc); jUsers = share recipients' }),
  relay(realtime, 'cloud-write', { id: 'doclink.delete', method: 'POST', path: '/realtimeapi/doclink/docdelete', cloudPath: 'doclink/docdelete', boxOwner: 'controller', note: 'DocLink delete (deleteDoc)' }),
  relay(realtime, 'cloud-write', { id: 'issue.update', method: 'PUT', path: '/realtimeapi/issue/updateIssue', cloudPath: 'issue/updateIssue', boxOwner: 'controller', note: 'issue-api.service.ts updateIssue' }),
  relay(realtime, 'cloud-write', { id: 'issue.insert', method: 'POST', path: '/realtimeapi/issue/insertIssue', cloudPath: 'issue/insertIssue', boxOwner: 'controller', note: 'issue-api.service.ts insertIssue' }),
  relay(realtime, 'cloud-write', { id: 'issue.delete', method: 'DELETE', path: '/realtimeapi/issue/deleteIssue', cloudPath: 'issue/deleteIssue', boxOwner: 'controller', note: 'issue-api.service.ts deleteIssue' }),
  relay(realtime, 'cloud-write', { id: 'issue.delete.multi', method: 'DELETE', path: '/realtimeapi/issue/delete/multi/issue', cloudPath: 'issue/delete/multi/issue', boxOwner: 'controller', note: 'issue-api.service.ts deleteMultiIssue' }),
  relay(realtime, 'cloud-write', { id: 'issue.category.insert', method: 'POST', path: '/realtimeapi/issue/insertCategory', cloudPath: 'issue/insertCategory', boxOwner: 'controller', note: 'issue-api.service.ts insertCategory' }),
  relay(realtime, 'cloud-write', { id: 'issue.qfact.sequence', method: 'POST', path: '/realtimeapi/issue/qfact/sequence', cloudPath: 'issue/qfact/sequence', boxOwner: 'controller', note: 'issue-api.service.ts saveQfactSequence' }),
  relay(realtime, 'cloud-write', { id: 'issue.qfact.claim.sequence', method: 'POST', path: '/realtimeapi/issue/qfact/claim/sequence', cloudPath: 'issue/qfact/claim/sequence', boxOwner: 'controller', note: 'issue-api.service.ts saveQfactClaimSequence' }),
  relay(realtime, 'cloud-write', { id: 'issue.claim.update', method: 'PUT', path: '/realtimeapi/issue/updateClaimDetail', cloudPath: 'issue/updateClaimDetail', boxOwner: 'controller', note: 'issue-api.service.ts updateClaim' }),
  // ---- box table: coreapi aliases (team sharing uses the scoped realtime API; other pickers stay local) ----------
  core({ id: 'core.caseinfo', path: '/coreapi/case/caseinfo', boxKind: 'local', note: "the case chip, from the box's cached assignments" }),
  core({ id: 'core.getcode', path: '/coreapi/common/getcode', boxKind: 'local', localBody: EMPTY, note: 'code tables (party / grade pickers): not on the box, empty as the FE mock answers' }),
  // Phase 5 (2026-10-06): the first row served by a shared controller on the box (@app/rt-features/team-users over
  // the CLOUD_RELAY), not by the RT table; the relay kind and cloud path stay, because the controller relays it.
  relay(core, 'cloud-read', { id: 'core.myteamusers', path: '/coreapi/common/myteamusers', livePath: 'common/myteamusers', cloudPath: 'factsheet/teamusers', offlineBody: null, teamScoped: true, boxOwner: 'controller', note: "Fact sharing recipients: the caller's sub-team from the Edge-scoped realtime endpoint (nCaseid required)" }),
  core({ id: 'core.contacts', path: '/coreapi/contact/getcontactlist', boxKind: 'local', localBody: EMPTY, note: 'Full Fact participants picker: not on the box, empty as the FE mock answers' }),
  core({ id: 'core.tasks', path: '/coreapi/workspace/tasks/list', boxKind: 'local', localBody: EMPTY, note: 'Full Fact task picker: not on the box, empty as the FE mock answers' }),
  core({ id: 'core.comments', path: '/coreapi/comments/grid', boxKind: 'local', localBody: EMPTY, note: 'Fact comments: not on the box, empty as the FE mock answers' }),
  core({ id: 'core.annotations', path: '/coreapi/common/getannotations', boxKind: 'local', localBody: EMPTY, note: 'PDF overlay geometry (reader): not on the box, empty as the FE mock answers' }),
  // ---- use_cloud: the RT services call these too; the box refuses them 403 use_cloud (spec §8.2 row 8) ----------
  realtime({ id: 'session.list.batch', method: 'POST', path: '/realtimeapi/session/getSessionsByCaseIds', boxOwner: 'use_cloud', note: 'batched session list of /admin/realtime (getTranscriptSessionsForCases): admin screen, cloud only' }),
  realtime({ id: 'factsheet.annotation', path: '/realtimeapi/factsheet/factannotation', boxOwner: 'use_cloud', note: 'PDF Fact geometry of the Document Reader (getFactAnnotation): the box serves no PDFs' }),
  realtime({ id: 'session.eclipse.credential', path: '/realtimeapi/session/eclipse/credential', boxOwner: 'use_cloud', note: 'super-admin reveal of the Eclipse password (RT Production): never on the box' }),
  realtime({ id: 'session.feedstatus', path: '/realtimeapi/session/feedstatus', boxOwner: 'use_cloud', note: 'cloud feed status of a session (RT Production lane): the cloud knows, the box does not answer for it' }),
  realtime({ id: 'session.eclipse.create', method: 'POST', path: '/realtimeapi/session/eclipse', boxOwner: 'use_cloud', note: 'session creation (D27: sessions are created only on etabella.net)' }),
  realtime({ id: 'session.edge.direct', method: 'POST', path: '/realtimeapi/session/edge/direct', boxOwner: 'use_cloud', note: 'split to direct cloud (super admins, RT Production)' }),
  realtime({ id: 'session.edge.split', method: 'POST', path: '/realtimeapi/session/edge/split', boxOwner: 'use_cloud', note: 'split to direct cloud (super admins, RT Production)' }),
  realtime({ id: 'session.forceseal', method: 'POST', path: '/realtimeapi/session/forceseal', boxOwner: 'use_cloud', note: 'force-close of a venue session (super admins, RT Production)' }),
  realtime({ id: 'session.delete', method: 'POST', path: '/realtimeapi/session/sessiondelete', boxOwner: 'use_cloud', note: 'session delete (RT Production)' }),
  realtime({ id: 'session.end', method: 'POST', path: '/realtimeapi/session/sessionend', boxOwner: 'use_cloud', note: 'session end (RT Production): the cloud ends it, the box seals' }),
  realtime({ id: 'session.warnack', method: 'POST', path: '/realtimeapi/session/warnack', boxOwner: 'use_cloud', note: 'venue warning acknowledgement (RT Production)' }),
  core({ id: 'core.comments.add', method: 'POST', path: '/coreapi/comments/add', boxOwner: 'use_cloud', note: 'Fact comment write (mark-api.service.ts): comments are not on the box (Phase 10, D12)' }),
  core({ id: 'core.contact.builder', method: 'POST', path: '/coreapi/contact/case/contactbuilder', boxOwner: 'use_cloud', note: 'participant create from the Full Fact dialog (document-share-api.service.ts)' }),
  core({ id: 'core.docinfo', path: '/coreapi/individual/getDocinfo', boxOwner: 'use_cloud', note: 'document info for the share dialog (document-share-api.service.ts)' }),
  core({ id: 'core.locationshare.sharedusers', path: '/coreapi/individual/locationshare/sharedusers', boxOwner: 'use_cloud', note: 'Quick View share recipients (document-share-api.service.ts): team data, cloud only' }),
  core({ id: 'core.locationshare.sharetousers', method: 'POST', path: '/coreapi/individual/locationshare/sharetousers', boxOwner: 'use_cloud', note: 'Quick View share write (document-share-api.service.ts): names recipients; target fields set when the row leaves use_cloud' }),
  core({ id: 'core.task.builder', method: 'POST', path: '/coreapi/task/taskBuilder/v2', boxOwner: 'use_cloud', note: 'task create from the Full Fact dialog (document-share-api.service.ts)' }),
] as RouteManifestRow[]).map((row) => Object.freeze(row)));

/** The box table rows (`boxOwner: 'table'`), in manifest order: what RtDataMiddleware answers before the router. */
export const manifestTableRows = (rows: readonly RouteManifestRow[] = ROUTE_MANIFEST): readonly RouteManifestRow[] =>
  rows.filter((row) => row.boxOwner === 'table');

/**
 * Every row the box answers itself, by the table or by a shared controller whose relay adapter asks the RT data
 * layer for it: the route registry of RtDataService.call (the CLOUD_RELAY port).
 */
export const manifestBoxRows = (rows: readonly RouteManifestRow[] = ROUTE_MANIFEST): readonly RouteManifestRow[] =>
  rows.filter((row) => (row.boxOwner === 'table' || row.boxOwner === 'controller') && row.boxKind !== undefined);

/** The rows the box relays to the cloud: the edge-token allowlist is exactly their `METHOD cloudPath`. */
export const manifestRelayRows = (rows: readonly RouteManifestRow[] = ROUTE_MANIFEST): readonly RouteManifestRow[] =>
  manifestBoxRows(rows).filter((row) => row.boxKind === 'local-or-cloud' || row.boxKind === 'cloud-read' || row.boxKind === 'cloud-write');
