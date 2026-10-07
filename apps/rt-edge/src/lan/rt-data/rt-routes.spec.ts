import * as fs from 'fs';
import * as path from 'path';
import { manifestBoxRows, manifestTableRows, ROUTE_MANIFEST } from '@app/api-contracts';

import { isCloudApiPath } from '../cloud-paths';
import { isPlainPath, matchRtRoute, RT_ROUTES, RtRoute, rtRouteById, rtRouteKeys, rtRouteOf } from './rt-routes';

const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');

/**
 * The hand-written table as it was the day the manifest replaced it (2026-10-06, Phase 3 of the shared-libraries
 * plan), minus the one approved removal (`fact.highlight`, D11) and the first row moved to a shared controller
 * (`core.myteamusers`, Phase 5: it is still relayed by the RT data layer, through CLOUD_RELAY, so `rtRouteById`
 * knows it; RtDataMiddleware does not). The derived table must equal it key for key; a deliberate change to a route
 * edits both the manifest and this file, in the same commit.
 */
const SNAPSHOT: readonly RtRoute[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'rt-routes.snapshot.json'), 'utf8'));

/**
 * Every `METHOD /realtimeapi|coreapi…` route the FE preview mock serves (eTabella-angular-21-rt-edge,
 * tools/edge-preview/mock-box.mjs, section "RT routes the box serves locally (/realtimeapi), and the cloud-only rest",
 * as of 2026-10-02). When the mock is checked out beside this repo, the first spec below re-reads it and fails on
 * any drift, so this list cannot go stale silently.
 *
 * The mock also answers EVERY other non-GET `/realtimeapi/*` with reauth / offline / cloud_refused (its
 * `cloudFallback`: "marks are not simulated"); the box does that only for the allowlisted writes below and answers
 * every other write `use_cloud` (spec §8.2: "never let a write bypass the allowlist").
 */
const MOCK_RT_ROUTES: readonly string[] = [
    'GET /realtimeapi/session/getsessionsbycaseid',
    'GET /realtimeapi/session/getSessionsByCaseId',
    'GET /realtimeapi/session/activesession',
    'GET /realtimeapi/session/getlivesessionbycaseid',
    'GET /realtimeapi/session/activesession/detail',
    'GET /realtimeapi/session/realtimedatabysesid',
    'GET /realtimeapi/feed/pages/total',
    'GET /realtimeapi/feed/pages/data',
    'GET /realtimeapi/marknav/all',
    'GET /realtimeapi/feed/annotations',
    'GET /realtimeapi/marknav/quickmarklist',
    'GET /realtimeapi/doclink/docdetail',
    'GET /realtimeapi/issue/issuelist_V2',
    'GET /coreapi/case/caseinfo',
    'GET /coreapi/common/getcode',
    'GET /coreapi/common/myteamusers',
    'GET /coreapi/contact/getcontactlist',
    'GET /coreapi/workspace/tasks/list',
    'GET /coreapi/comments/grid',
    'GET /coreapi/common/getannotations',
];

/**
 * Routes the box answers that the mock does not list, each with why. Any new box route must be added here (the spec
 * below compares the sets exactly), so the FE mock and the box never drift apart unnoticed.
 */
const BOX_ONLY: Readonly<Record<string, string>> = {
    // The Full Fact editor on the RT page (realtime-page.component.ts getFactSheetDetail / getFactSheetRows): the mock
    // leaves them to use_cloud; on the box they are proxied (online) so a saved Fact can be edited from the room.
    'GET /realtimeapi/factsheet/detail': 'Full Fact editor read',
    'GET /realtimeapi/factsheet/issues': 'Full Fact editor read',
    'GET /realtimeapi/factsheet/contacts': 'Full Fact editor read',
    'GET /realtimeapi/factsheet/links': 'Full Fact editor read',
    'GET /realtimeapi/factsheet/shared': 'Full Fact editor read',
    'GET /realtimeapi/factsheet/tasks': 'Full Fact editor read',
    // The allowlisted writes (spec §8.2 row 7). The mock answers them through its generic non-GET fallback.
    'POST /realtimeapi/fact/inserthighlights': 'write',
    'POST /realtimeapi/fact/deletehighlights': 'write',
    'POST /realtimeapi/fact/insertquickfact': 'write',
    'POST /realtimeapi/fact/quickfactupdate': 'write',
    'POST /realtimeapi/fact/insertfact': 'write',
    'POST /realtimeapi/factsheet/save': 'write',
    'POST /realtimeapi/factsheet/delete': 'write',
    'POST /realtimeapi/doclink/insertdoc': 'write',
    'POST /realtimeapi/doclink/docdelete': 'write',
    'PUT /realtimeapi/issue/updateissue': 'write',
    'POST /realtimeapi/issue/insertissue': 'write',
    'DELETE /realtimeapi/issue/deleteissue': 'write',
    'DELETE /realtimeapi/issue/delete/multi/issue': 'write',
    'POST /realtimeapi/issue/insertcategory': 'write',
    'POST /realtimeapi/issue/qfact/sequence': 'write',
    'POST /realtimeapi/issue/qfact/claim/sequence': 'write',
    'PUT /realtimeapi/issue/updateclaimdetail': 'write',
    // Phase 10 (D12): the fact comment write, relayed to realtime-server comments/add by the shared CommentsController
    // (the mock has no comments/add: it left it to use_cloud).
    'POST /coreapi/comments/add': 'write',
    // Phase 10c (D12): the documents behind the DocLink picker and the document dock, relayed to realtime-server
    // bundles/* by the shared DocumentsController; the saved-search list is the box's own [] (the mock has none of them).
    'GET /coreapi/bundles/sections': 'document read',
    'GET /coreapi/bundles/usersections': 'document read',
    'POST /coreapi/bundles/bundle': 'document read sent as POST (relayed online only)',
    'GET /coreapi/bundles/bundledetail': 'document read',
    'GET /coreapi/bundles/bundledetail-search': 'document read',
    'GET /coreapi/bundles/folder-search': 'document read',
    'GET /coreapi/bundles/index': 'document read',
    'GET /coreapi/bundles/filedata': 'document read',
    'GET /coreapi/bundles/saved-search': 'local []',
};

/**
 * Where the box answers a mock route differently ON PURPOSE (the mock is a preview stand-in; the box follows the
 * cloud's handlers and spec §8.2):
 */
const KIND_DIFFERENCES: Readonly<Record<string, string>> = {
    // The mock answers the mark lists with empty cursors for everyone; the box proxies them (spec §8.2 row 6) and gives
    // the mock's empty cursors only offline (`X-Edge-Offline`) or to a box-signed sign-in (`X-Edge-Reauth`).
    'GET /realtimeapi/marknav/all': 'cloud-read',
    'GET /realtimeapi/feed/annotations': 'cloud-read',
    'GET /realtimeapi/marknav/quickmarklist': 'cloud-read',
    'GET /realtimeapi/doclink/docdetail': 'cloud-read',
    'GET /realtimeapi/issue/issuelist_V2': 'cloud-read',
    // The sharing picker is relayed too, since Phase 5 by the shared team-users controller (a `controller` row, not in
    // this table; the comparison below reads every row the box answers).
    'GET /coreapi/common/myteamusers': 'cloud-read',
    // The code tables are relayed too, since Phase 10 by the shared code-tables controller (D12): the mock's [] only
    // offline or to a box-signed sign-in.
    'GET /coreapi/common/getcode': 'cloud-read',
    // The fact comments are relayed too, since Phase 10 by the shared comments controller (D12).
    'GET /coreapi/comments/grid': 'cloud-read',
    // Local while the kernel holds the session; a sealed session (dropped by the kernel) is read from the cloud.
    'GET /realtimeapi/session/activesession/detail': 'local-or-cloud',
    'GET /realtimeapi/session/realtimedatabysesid': 'local-or-cloud',
    'GET /realtimeapi/feed/pages/total': 'local-or-cloud',
    'GET /realtimeapi/feed/pages/data': 'local-or-cloud',
};

const key = (method: string, p: string): string => `${method.toUpperCase()} ${p.toLowerCase()}`;
const routeKey = (r: RtRoute): string => key(r.method, r.path);

/** `route('GET', '/realtimeapi/…')` and `for (const p of ['…', …]) route('GET', p` in mock-box.mjs. */
function parseMockRoutes(source: string): string[] {
    const out: string[] = [];
    for (const m of source.matchAll(/^\s*route\('(GET|POST|PUT|DELETE)', '(\/(?:realtimeapi|coreapi)\/[^']+)'/gm)) out.push(`${m[1]} ${m[2]}`);
    for (const m of source.matchAll(/for \(const p of \[([^\]]*)\]\)\s*\{?\s*route\('(GET|POST|PUT|DELETE)', p\b/g)) {
        for (const p of m[1].matchAll(/'([^']+)'/g)) if (/^\/(realtimeapi|coreapi)\//.test(p[1])) out.push(`${m[2]} ${p[1]}`);
    }
    return out;
}

describe('RT data route table (rt-routes.ts)', () => {
    describe('the FE preview mock (tools/edge-preview/mock-box.mjs) is fully covered', () => {
        const mockFile = process.env.EDGE_PREVIEW_MOCK || path.resolve(REPO, '..', 'eTabella-angular-21-rt-edge', 'tools', 'edge-preview', 'mock-box.mjs');
        (fs.existsSync(mockFile) ? it : it.skip)('the snapshot above is what the mock serves today (read-only check of the FE worktree)', () => {
            expect(parseMockRoutes(fs.readFileSync(mockFile, 'utf8')).sort()).toEqual([...MOCK_RT_ROUTES].sort());
        });

        it('every route the mock serves is in the box table or a shared controller the box mounts, with the same method', () => {
            const box = new Set(manifestBoxRows().map(r => key(r.method, r.path)));
            const missing = MOCK_RT_ROUTES.filter(r => {
                const [method, p] = r.split(' ');
                return !box.has(key(method, p));
            });
            expect(missing).toEqual([]);
            // Both spellings of the session list reach the same route (Express routes case-insensitively, so does the box).
            expect(matchRtRoute('GET', '/realtimeapi/session/getsessionsbycaseid')).toBe(matchRtRoute('GET', '/realtimeapi/session/getSessionsByCaseId'));
        });

        it('the box serves nothing else but the documented extensions (factsheet reads, the allowlisted writes)', () => {
            const mock = new Set(MOCK_RT_ROUTES.map(r => key(r.split(' ')[0], r.split(' ')[1])));
            // What the box answers = the table plus the rows its shared controllers serve (the factsheet rows since Phase 7a).
            const extra = manifestBoxRows().map(r => key(r.method, r.path)).filter(k => !mock.has(k)).sort();
            expect(extra).toEqual(Object.keys(BOX_ONLY).map(k => key(k.split(' ')[0], k.split(' ')[1])).sort());
        });

        it('the mock routes the box answers differently on purpose are exactly the documented ones', () => {
            // Every row the box answers: the table's and the ones its shared controllers relay (Phases 5, 7a, 8).
            const different = manifestBoxRows().map(rtRouteOf).filter(r => r.kind !== 'local' && MOCK_RT_ROUTES.some(m => key(m.split(' ')[0], m.split(' ')[1]) === routeKey(r)));
            expect(Object.fromEntries(different.map(r => [`${r.method} ${r.path}`, r.kind]))).toEqual(KIND_DIFFERENCES);
        });
    });

    describe('derived from ROUTE_MANIFEST (libs/api-contracts)', () => {
        it('is the hand-written table of 2026-10-06, key for key, in the same order (fact.highlight removed, D11; core.myteamusers moved to a controller, Phase 5; the eight factsheet rows, Phase 7a; the two marknav and three doclink rows, Phase 8; the nine issue rows, Phase 9; the code-table and comment-list rows, Phase 10; the saved-search row added, Phase 10c; notes may grow)', () => {
            const behaviour = (rows: readonly RtRoute[]) => JSON.parse(JSON.stringify(rows)).map(({ note, ...rest }: RtRoute) => rest);
            expect(behaviour(RT_ROUTES)).toEqual(behaviour(SNAPSHOT));
            for (const r of RT_ROUTES) expect([r.id, typeof r.note, r.note.length > 10]).toEqual([r.id, 'string', true]);
            expect(RT_ROUTES).toHaveLength(18);
            expect(RT_ROUTES.map(r => r.id)).toEqual(manifestTableRows().map(r => r.id));
            expect(RT_ROUTES.some(r => r.id === 'fact.highlight')).toBe(false);
            expect(matchRtRoute('POST', '/realtimeapi/fact/addhighlight')).toBeNull();
        });

        it('a row moved to a shared controller leaves the middleware table but stays in the relay registry, unchanged', () => {
            expect(matchRtRoute('GET', '/coreapi/common/myteamusers')).toBeNull();
            expect(RT_ROUTES.some(r => r.id === 'core.myteamusers')).toBe(false);
            const relayed = rtRouteById('core.myteamusers');
            expect(relayed).toEqual(expect.objectContaining({ method: 'GET', path: '/coreapi/common/myteamusers', kind: 'cloud-read', cloudPath: 'factsheet/teamusers', offlineBody: null }));
            expect(Object.isFrozen(relayed)).toBe(true);
            // Phase 10: the code tables left the table (local []) for a shared controller relaying realtime-server issue/dynamiccombo.
            expect(matchRtRoute('GET', '/coreapi/common/getcode')).toBeNull();
            expect(rtRouteById('core.getcode')).toEqual(expect.objectContaining({ method: 'GET', path: '/coreapi/common/getcode', kind: 'cloud-read', cloudPath: 'issue/dynamiccombo', offlineBody: [] }));
            // Phase 10: the fact comments too (the list relayed, the add a cloud-write that was use_cloud before).
            expect(matchRtRoute('GET', '/coreapi/comments/grid')).toBeNull();
            expect(rtRouteById('core.comments')).toEqual(expect.objectContaining({ method: 'GET', path: '/coreapi/comments/grid', kind: 'cloud-read', cloudPath: 'comments/grid', offlineBody: [] }));
            expect(rtRouteById('core.comments.add')).toEqual(expect.objectContaining({ method: 'POST', path: '/coreapi/comments/add', kind: 'cloud-write', cloudPath: 'comments/add' }));
            // Phase 10c: the document reads (the DocLink picker and the dock); the saved-search list is a table row answering [].
            expect(rtRouteById('core.bundles.usersections')).toEqual(expect.objectContaining({ method: 'GET', path: '/coreapi/bundles/usersections', kind: 'cloud-read', cloudPath: 'bundles/usersections', offlineBody: [[], []] }));
            expect(rtRouteById('core.bundles.filedata')).toEqual(expect.objectContaining({ method: 'GET', path: '/coreapi/bundles/filedata', kind: 'cloud-read', cloudPath: 'bundles/filedata', offlineBody: [] }));
            expect(rtRouteById('core.bundles.bundle')).toEqual(expect.objectContaining({ method: 'POST', path: '/coreapi/bundles/bundle', kind: 'cloud-write', cloudPath: 'bundles/bundle' }));
            expect(matchRtRoute('GET', '/coreapi/bundles/saved-search')).toEqual(expect.objectContaining({ id: 'core.bundles.savedsearch', kind: 'local', localBody: [] }));
            // Phase 7a: the Full Fact editor rows, relayed by the shared FactsheetController through the same registry.
            for (const p of ['detail', 'issues', 'contacts', 'links', 'shared', 'tasks']) {
                expect(matchRtRoute('GET', `/realtimeapi/factsheet/${p}`)).toBeNull();
                expect(rtRouteById(`factsheet.${p}`)).toEqual(expect.objectContaining({ method: 'GET', kind: 'cloud-read', cloudPath: `factsheet/${p}`, offlineBody: null }));
            }
            expect(matchRtRoute('POST', '/realtimeapi/factsheet/save')).toBeNull();
            expect(rtRouteById('factsheet.save')).toEqual(expect.objectContaining({ method: 'POST', kind: 'cloud-write', cloudPath: 'factsheet/save' }));
            expect(rtRouteById('factsheet.delete')).toEqual(expect.objectContaining({ method: 'POST', kind: 'cloud-write', cloudPath: 'factsheet/delete' }));
            expect(rtRouteById('marknav.all')?.kind).toBe('cloud-read');
            expect(rtRouteById('session.eclipse.create')).toBeNull(); // use_cloud rows are never relayed
            expect(rtRouteById('no.such')).toBeNull();
        });

        it('carries only the keys the table ever had, each only when the manifest row sets it', () => {
            for (const r of RT_ROUTES) {
                const keys = Object.keys(r).sort();
                expect([r.id, keys.every(k => ['id', 'method', 'path', 'kind', 'cloudPath', 'offlineBody', 'localBody', 'note'].includes(k))]).toEqual([r.id, true]);
                expect([r.id, 'cloudPath' in r, 'offlineBody' in r, 'localBody' in r]).toEqual([r.id, r.kind !== 'local', r.kind === 'cloud-read', r.localBody !== undefined]);
                expect(Object.isFrozen(r)).toBe(true);
            }
            // The whole manifest has rows the box does not answer; only `table` rows become routes.
            expect(ROUTE_MANIFEST.length).toBeGreaterThan(RT_ROUTES.length);
            expect(ROUTE_MANIFEST.filter(r => r.boxOwner === 'use_cloud').every(r => matchRtRoute(r.method, r.path) === null)).toBe(true);
        });

        it('rtRouteOf keeps a shared offline body by reference (the read cache hands it out frozen)', () => {
            const row = ROUTE_MANIFEST.find(r => r.id === 'marknav.all')!;
            expect(rtRouteOf(row).offlineBody).toBe(row.offlineBody);
            expect(Object.isFrozen(rtRouteOf(row).offlineBody)).toBe(true);
        });

        it('the cloud-only routes the box must never serve are not in the table (spec §8.2 row 8)', () => {
            for (const [method, p] of [
                ['POST', '/realtimeapi/session/eclipse'],
                ['GET', '/realtimeapi/session/eclipse/credential'],
                ['POST', '/realtimeapi/session/sessionend'],
                ['POST', '/realtimeapi/session/edge/split'],
                ['POST', '/realtimeapi/session/edge/direct'],
                ['POST', '/realtimeapi/upload'],
                ['POST', '/realtimeapi/transcript/publish'],
                ['GET', '/realtimeapi/transcript/download'],
                ['POST', '/realtimeapi/session/sessionbuilder'],
                ['DELETE', '/realtimeapi/issue/deleteClaim'],
                ['POST', '/realtimeapi/factsheet/unshare'],
                ['GET', '/realtimeapi/session/getallusers'],
            ]) {
                expect([method, p, matchRtRoute(method, p)]).toEqual([method, p, null]);
            }
        });
    });

    describe('table invariants', () => {
        it('ids and method + path pairs are unique; every path is a plain cloud-service path', () => {
            expect(new Set(RT_ROUTES.map(r => r.id)).size).toBe(RT_ROUTES.length);
            expect(new Set(rtRouteKeys()).size).toBe(RT_ROUTES.length);
            for (const r of RT_ROUTES) {
                expect([r.id, isPlainPath(r.path), isCloudApiPath(r.path)]).toEqual([r.id, true, true]);
                expect(Object.isFrozen(r)).toBe(true);
            }
            expect(Object.isFrozen(RT_ROUTES)).toBe(true);
        });

        it('reads are GETs, writes never are; every cloud kind names its cloud path; only the sharing alias changes service prefix', () => {
            for (const r of RT_ROUTES) {
                if (r.kind === 'cloud-write') expect([r.id, r.method === 'GET']).toEqual([r.id, false]);
                else expect([r.id, r.method]).toEqual([r.id, 'GET']);
                if (r.kind === 'local') expect([r.id, r.cloudPath]).toEqual([r.id, undefined]);
                else {
                    expect([r.id, typeof r.cloudPath]).toEqual([r.id, 'string']);
                    if (r.id === 'core.myteamusers') {
                        expect([r.method, r.path, r.kind, r.cloudPath]).toEqual(['GET', '/coreapi/common/myteamusers', 'cloud-read', 'factsheet/teamusers']);
                    } else {
                        expect([r.id, r.path.startsWith('/realtimeapi/')]).toEqual([r.id, true]);
                        expect([r.id, r.path.toLowerCase()]).toEqual([r.id, `/realtimeapi/${r.cloudPath}`.toLowerCase()]);
                    }
                }
            }
        });

        it('offline answers: the mock\'s empty cursors for mark lists, none (503) for Full Fact details and sharing recipients', () => {
            // Every cloud-read row the box relays: the table's, and the ones its shared controllers relay through the same
            // registry (the Full Fact editor since Phase 7a, the sharing picker since Phase 5).
            const offline = Object.fromEntries(manifestBoxRows().filter(r => r.boxKind === 'cloud-read').map(rtRouteOf).map(r => [r.id, r.offlineBody]));
            expect(offline).toEqual({
                'marknav.all': [[], [], []],
                'marknav.quickmarks': [],
                'feed.annotations': [[], [], []],
                'doclink.detail': [],
                'issue.list': null, // Phase 9 (D3): team data, the box never answers it itself
                'core.getcode': [], // Phase 10 (D12): the code tables, nobody's data; the mock's [] offline
                'core.comments': [], // Phase 10 (D12): the fact comments; the mock's [] offline
                'core.bundles.sections': [], // Phase 10c (D12): the documents behind the DocLink picker and the dock
                'core.bundles.usersections': [[], []],
                'core.bundles.bundledetail': [],
                'core.bundles.bundledetail.search': [],
                'core.bundles.folder.search': [],
                'core.bundles.index': [],
                'core.bundles.filedata': [],
                'factsheet.detail': null,
                'factsheet.issues': null,
                'factsheet.contacts': null,
                'factsheet.links': null,
                'factsheet.shared': null,
                'factsheet.tasks': null,
                'core.myteamusers': null,
            });
            // Phases 8 and 9: marknav.all, marknav.quickmarks, doclink.detail and issue.list are relayed by shared controllers, not the table.
            expect(RT_ROUTES.filter(r => r.kind === 'cloud-read').map(r => r.id)).toEqual(['feed.annotations']);
        });
    });

    describe('matchRtRoute', () => {
        it('matches the exact method and the path case-insensitively, with one optional trailing slash', () => {
            // Phase 8 moved marknav/all to a shared controller; feed/annotations is the table's remaining cloud-read sample.
            expect(matchRtRoute('GET', '/realtimeapi/feed/annotations')?.id).toBe('feed.annotations');
            expect(matchRtRoute('get', '/realtimeapi/Feed/ANNOTATIONS/')?.id).toBe('feed.annotations');
            expect(matchRtRoute('POST', '/realtimeapi/fact/insertHighlights')?.id).toBe('fact.quickmark.insert');
            expect(matchRtRoute('POST', '/realtimeapi/fact/inserthighlights')?.id).toBe('fact.quickmark.insert');
            expect(matchRtRoute('POST', '/realtimeapi/feed/annotations')).toBeNull();
            expect(matchRtRoute('GET', '/realtimeapi/marknav/all')).toBeNull(); // a controller row is not in the table
            expect(matchRtRoute('GET', '/realtimeapi/fact/insertfact')).toBeNull();
            expect(matchRtRoute('PATCH', '/realtimeapi/issue/updateIssue')).toBeNull();
            expect(matchRtRoute('HEAD', '/realtimeapi/feed/annotations')).toBeNull();
        });

        it('never matches escapes, dot or empty segments, backslashes, a second trailing slash or a longer path', () => {
            for (const p of [
                '/realtimeapi/marknav/%61ll',
                '/realtimeapi/marknav%2Fall',
                '/realtimeapi/x/../marknav/all',
                '/realtimeapi/./marknav/all',
                '/realtimeapi//marknav/all',
                '/realtimeapi/marknav/all//',
                '/realtimeapi/marknav\\all',
                '/realtimeapi/marknav/all/x',
                '/realtimeapi/marknav/all.json',
                'realtimeapi/marknav/all',
                '',
                `/realtimeapi/${'a/'.repeat(300)}`,
            ]) {
                expect([p, matchRtRoute('GET', p)]).toEqual([p, null]);
            }
        });
    });
});
