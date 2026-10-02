import * as fs from 'fs';
import * as path from 'path';

import { isCloudApiPath } from '../cloud-paths';
import { isPlainPath, matchRtRoute, RT_ROUTES, RtRoute, rtRouteKeys } from './rt-routes';

const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');

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
    'POST /realtimeapi/fact/addhighlight': 'write',
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

/** `METHOD controller/path` (lower case) of every route a Nest app's controllers declare (commented-out lines skipped). */
function cloudRoutes(controllersDir: string): Set<string> {
    const out = new Set<string>();
    const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.name.endsWith('.controller.ts')) {
                let base = '';
                for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
                    if (/^\s*\/\//.test(line)) continue;
                    const c = /@Controller\('([^']*)'\)/.exec(line);
                    if (c) base = c[1];
                    const r = /@(Get|Post|Put|Delete|Patch)\('([^']*)'\)/.exec(line);
                    if (r) out.add(key(r[1], `${base}/${r[2]}`.replace(/^\/+/, '')));
                }
            }
        }
    };
    walk(controllersDir);
    return out;
}

describe('RT data route table (rt-routes.ts)', () => {
    describe('the FE preview mock (tools/edge-preview/mock-box.mjs) is fully covered', () => {
        const mockFile = process.env.EDGE_PREVIEW_MOCK || path.resolve(REPO, '..', 'eTabella-angular-21-rt-edge', 'tools', 'edge-preview', 'mock-box.mjs');
        (fs.existsSync(mockFile) ? it : it.skip)('the snapshot above is what the mock serves today (read-only check of the FE worktree)', () => {
            expect(parseMockRoutes(fs.readFileSync(mockFile, 'utf8')).sort()).toEqual([...MOCK_RT_ROUTES].sort());
        });

        it('every route the mock serves is in the box table, with the same method', () => {
            const box = new Set(RT_ROUTES.map(routeKey));
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
            const extra = RT_ROUTES.map(routeKey).filter(k => !mock.has(k)).sort();
            expect(extra).toEqual(Object.keys(BOX_ONLY).map(k => key(k.split(' ')[0], k.split(' ')[1])).sort());
        });

        it('the mock routes the box answers differently on purpose are exactly the documented ones', () => {
            const different = RT_ROUTES.filter(r => r.kind !== 'local' && MOCK_RT_ROUTES.some(m => key(m.split(' ')[0], m.split(' ')[1]) === routeKey(r)));
            expect(Object.fromEntries(different.map(r => [`${r.method} ${r.path}`, r.kind]))).toEqual(KIND_DIFFERENCES);
        });
    });

    describe('every route mirrors a real cloud handler', () => {
        const realtime = cloudRoutes(path.join(REPO, 'apps', 'realtime-server', 'src', 'controllers'));
        const coreapi = cloudRoutes(path.join(REPO, 'apps', 'coreapi', 'src', 'controllers'));

        it('found the cloud controllers', () => {
            expect(realtime.size).toBeGreaterThan(50);
            expect(coreapi.size).toBeGreaterThan(50);
        });

        it('each /realtimeapi route (and its cloudPath) is declared by a realtime-server controller, each /coreapi route by a coreapi one', () => {
            const notOnCloud: string[] = [];
            for (const r of RT_ROUTES) {
                const [, base, ...rest] = r.path.split('/');
                const cloudSide = base === 'coreapi' ? coreapi : realtime;
                if (!cloudSide.has(key(r.method, rest.join('/')))) notOnCloud.push(routeKey(r));
                if (r.cloudPath && !realtime.has(key(r.method, r.cloudPath))) notOnCloud.push(`cloudPath ${key(r.method, r.cloudPath)}`);
            }
            // fact/addhighlight is on the spec's allowlist and the FE calls it (mark-api.service.ts addFactHighlight, the
            // PDF reader), but no realtime-server controller declares it today: the cloud answers it 404, passed through.
            expect(notOnCloud).toEqual(['POST /realtimeapi/fact/addhighlight', 'cloudPath POST fact/addhighlight']);
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

        it('reads are GETs, writes never are; every cloud kind names its cloud path; only /realtimeapi is ever proxied', () => {
            for (const r of RT_ROUTES) {
                if (r.kind === 'cloud-write') expect([r.id, r.method === 'GET']).toEqual([r.id, false]);
                else expect([r.id, r.method]).toEqual([r.id, 'GET']);
                if (r.kind === 'local') expect([r.id, r.cloudPath]).toEqual([r.id, undefined]);
                else {
                    expect([r.id, typeof r.cloudPath]).toEqual([r.id, 'string']);
                    expect([r.id, r.path.startsWith('/realtimeapi/')]).toEqual([r.id, true]);
                    expect([r.id, r.path.toLowerCase()]).toEqual([r.id, `/realtimeapi/${r.cloudPath}`.toLowerCase()]);
                }
            }
        });

        it('offline answers: the mock\'s empty cursors for the lists, none (503) for the Full Fact editor reads', () => {
            const offline = Object.fromEntries(RT_ROUTES.filter(r => r.kind === 'cloud-read').map(r => [r.id, r.offlineBody]));
            expect(offline).toEqual({
                'marknav.all': [[], [], []],
                'marknav.quickmarks': [],
                'feed.annotations': [[], [], []],
                'doclink.detail': [],
                'issue.list': [[], []],
                'factsheet.detail': null,
                'factsheet.issues': null,
                'factsheet.contacts': null,
                'factsheet.links': null,
                'factsheet.shared': null,
                'factsheet.tasks': null,
            });
        });
    });

    describe('matchRtRoute', () => {
        it('matches the exact method and the path case-insensitively, with one optional trailing slash', () => {
            expect(matchRtRoute('GET', '/realtimeapi/marknav/all')?.id).toBe('marknav.all');
            expect(matchRtRoute('get', '/realtimeapi/MarkNav/ALL/')?.id).toBe('marknav.all');
            expect(matchRtRoute('POST', '/realtimeapi/fact/insertHighlights')?.id).toBe('fact.quickmark.insert');
            expect(matchRtRoute('POST', '/realtimeapi/fact/inserthighlights')?.id).toBe('fact.quickmark.insert');
            expect(matchRtRoute('POST', '/realtimeapi/marknav/all')).toBeNull();
            expect(matchRtRoute('GET', '/realtimeapi/fact/insertfact')).toBeNull();
            expect(matchRtRoute('PATCH', '/realtimeapi/issue/updateIssue')).toBeNull();
            expect(matchRtRoute('HEAD', '/realtimeapi/marknav/all')).toBeNull();
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
