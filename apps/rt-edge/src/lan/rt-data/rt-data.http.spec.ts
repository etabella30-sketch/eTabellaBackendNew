import * as fs from 'fs';
import * as http from 'http';
import type { AddressInfo } from 'net';
import * as path from 'path';

import * as request from 'supertest';
import { buildSnapshot, CanonicalPage, canonicalPages, Cut, pagesFromList } from '@app/edge-sync';
import { EdgeBoxTokenSigner } from '@app/edge-token';

// The cloud's own converter (realtime-server session/realtimedatabysesid): the box must build the same pages.
import { ConversionJsService } from '../../../../realtime-server/src/services/conversion.js/conversion.js.service';
import { endOfBoxDayMs } from '../../auth/box-time';
import { FakeState } from '../../auth/testing/fake-state';
import {
    ADMIN,
    ASSIGNEE,
    BOX,
    CASE_A,
    CASE_B,
    CASE_C,
    cloudKeys,
    CloudKeys,
    edgeWorld,
    MEMBER,
    NOW,
    onlineToken,
    OUTSIDER,
    PERSON,
    S_B,
    S_DELETED,
    S_ENDED,
    S_LIVE,
    S_NEXT,
    S_UNKNOWN,
    SpecClock,
} from '../../auth/testing/edge-world';
import { isEdgeErrorBody } from '../../contracts';
import { ACCESS_PORT, AccessPort, KernelSessionView, NO_REQUEST_CONTEXT } from '../../ports';
import { LanApp, startLanApp } from '../testing/lan-test-kit';
import { CloudResult, RtCloudProxy } from './cloud-proxy';
import { RtDataOptions } from './rt-data.options';
import { RtDataService } from './rt-data.service';
import { RT_ROUTES } from './rt-routes';
import { FakeCloudApi } from './testing/fake-cloud-api';

const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');

/** realtime.et_realtime_sessiondata's columns (assets/sql-migrations/2026-05-09_upload_publish_cstatus.sql). */
const CLOUD_SESSIONDATA_COLUMNS = [
    'nCaseid', 'nSesid', 'nRTSid', 'cName', 'dStartDt', 'nDays', 'nLines', 'nPageno', 'cUnicuserid', 'cStatus', 'cNotifytype', 'dCreatedt', 'cCaseno',
    'cUrl', 'nPort', 'cCasename', 'totaIssues', 'cDefHIssues', 'nLID', 'cColor', 'cDefIssues', 'nLIid', 'cAColor', 'isTrans', 'nDemoid', 'cProtocol',
];
/** What session.service.ts getActiveSessionDetail adds to the SP row. */
const DETAIL_EXTRA_KEYS = ['maxNumber', 'pageRes'];
/** What the edge build reads off a session row (evidence-api.types.ts ApiSessionRes). */
const FE_SESSION_ROW_KEYS = [
    'nSesid', 'cName', 'dStartDt', 'cStatus', 'isTranscript', 'isUploaded', 'cProtocol', 'nLines', 'nCaseid', 'nLSesid', 'nRTSid', 'bRefresh', 'cUrl', 'nPort',
    'cCaseno', 'cFeedSource', 'nEdgeid', 'cSyncState', 'nPartNo', 'nPrevPartSesid',
];
/** The FE preview mock's `sessionRow` keys (tools/edge-preview/mock-box.mjs). */
const MOCK_SESSION_ROW_KEYS = ['nSesid', 'cName', 'dStartDt', 'cStatus', 'isTranscript', 'isUploaded', 'cProtocol', 'nLines', 'nCaseid', 'cCaseno', 'bRefresh'];

/** feed-data.service.ts getSessionPagesData (the live memory path), as written there, plus the disk path's nSesid. */
function cloudLivePagesData(nSesid: string, sessionData: Record<number, readonly unknown[]>, reqPages: number[]): { total: number; feed: unknown[] } {
    const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b));
    if (!pages?.length) return { total: 0, feed: [] };
    const finalPages = pages.filter(a => reqPages.includes(Number(a[0])));
    const result = [];
    for (const x of finalPages) result.push({ nSesid, page: Number(x[0]), data: x[1] || [] });
    return { total: pages?.length, feed: result };
}

const codes = (text: string): number[] => Array.from(text, c => c.charCodeAt(0));

/** 30 parser tuples [time, codes, i, formate, oPage, oLine, unicid, links], one hole (index 10) and one framed line. */
function transcriptBuffer(): unknown[] {
    const buf: unknown[] = [];
    for (let i = 0; i < 30; i++) {
        if (i === 10) {
            buf.push(undefined);
            continue;
        }
        const text = i === 3 ? '  Q. Where were you on the third?  ' : i === 4 ? `\x0F20261001A. At home\x0C0002` : `Line ${i} of the hearing`;
        buf.push([`10:02:${String(i).padStart(2, '0')}`, codes(text), i, i % 4 === 0 ? 'QES' : undefined, Math.floor(i / 25) + 1, (i % 25) + 1, 5000 + i, null]);
    }
    return buf;
}

const PAGES: readonly CanonicalPage[] = canonicalPages(transcriptBuffer(), 25);
const RT_OPTIONS: Partial<RtDataOptions> = {
    readTimeoutMs: 400,
    writeTimeoutMs: 400,
    maxReadResponseBytes: 64 * 1024,
    maxWriteResponseBytes: 16 * 1024,
    maxRequestBodyBytes: 8 * 1024,
};

describe('rt-edge RT data routes (spec §8.2, §8.5; rt-data/)', () => {
    let cloud: CloudKeys;
    let cloudApi: FakeCloudApi;
    let state: FakeState;
    let clock: SpecClock;
    let lan: LanApp;

    beforeAll(async () => {
        cloud = await cloudKeys();
        cloudApi = new FakeCloudApi();
        await cloudApi.start();
    });

    afterAll(async () => {
        await cloudApi.close();
    });

    async function start(config: Record<string, unknown> = {}, rtData: Partial<RtDataOptions> = {}): Promise<LanApp> {
        const app = await startLanApp({ state, clock: clock.now, config: { cloud: { origin: cloudApi.origin }, ...config }, rtData: { ...RT_OPTIONS, ...rtData } });
        app.kernel.views.set(S_LIVE, { nSesid: S_LIVE, phase: 'live', localState: 'live', protocol: 'B', firstLineAtMs: Date.UTC(2026, 9, 1, 9, 2), lastLineAtMs: NOW - 5000, endedAtMs: null } as Partial<KernelSessionView>);
        app.kernel.cuts.set(S_LIVE, { nSesid: S_LIVE, rev: 7, nLines: 25, allPages: PAGES } as unknown as Cut);
        app.kernel.views.set(S_NEXT, { nSesid: S_NEXT, phase: 'not-started', localState: 'armed', protocol: null, firstLineAtMs: null, lastLineAtMs: null, endedAtMs: null } as Partial<KernelSessionView>);
        return app;
    }

    beforeEach(async () => {
        state = edgeWorld(cloud.keys);
        // S_ENDED is sealed: the kernel dropped it (no view, no pages); the cloud holds its transcript.
        state.patchSession(S_ENDED, { localState: 'sealed', sealedAtMs: Date.UTC(2026, 8, 30, 16, 0), sealState: 'K' });
        clock = new SpecClock();
        cloudApi.requests.length = 0;
        cloudApi.reply = () => ({ status: 200, json: [] });
        lan = await start();
    });

    afterEach(async () => {
        await lan?.close();
    });

    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
    const tokenFor = (sub: string, over: Record<string, unknown> = {}) => onlineToken(cloud, { sub, ...over });
    const get = async (url: string, sub: string | null = MEMBER) => (sub ? request(lan.url).get(url).set(bearer(await tokenFor(sub))) : request(lan.url).get(url));
    const signer = () => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));
    const operatorToken = async () =>
        (await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') })).token;
    async function roomToken(nUserid = PERSON, nSesid = S_LIVE): Promise<string> {
        const admin = await lan.auth.authenticate(await tokenFor(ADMIN), NO_REQUEST_CONTEXT);
        const result = lan.app.get<AccessPort>(ACCESS_PORT).issueRoomCodes(admin, { nSesid, userIds: [nUserid] }, NO_REQUEST_CONTEXT).results[0];
        if (result.status !== 'issued') throw new Error(result.error);
        const res = await request(lan.url).post('/edge/auth/room-code').send({ code: result.issued.code });
        expect(res.status).toBe(200);
        return res.body.token;
    }
    const expectEdgeError = (res: request.Response, status: number, error: string): void => {
        expect([res.status, res.body?.error]).toEqual([status, error]);
        expect(res.body.msg).toBe(-1);
        expect(isEdgeErrorBody(res.body)).toBe(true);
        expect(res.headers['cache-control']).toBe('no-store');
    };
    const expectUseCloud = (res: request.Response): void => {
        expect([res.status, res.body]).toEqual([403, { msg: -1, error: 'use_cloud', message: expect.any(String), useCloud: true }]);
    };
    const send = (method: string, url: string) => (request(lan.url) as unknown as Record<string, (u: string) => request.Test>)[method.toLowerCase()](url);

    // ---- local reads: the cloud's shapes ----------------------------------------------------------------------------

    describe('local reads answer the shapes of the cloud handlers, from the box state and kernel', () => {
        it('session/getSessionsByCaseId (both spellings): the visible sessions of the case, oldest start first, with the FE and mock fields', async () => {
            for (const url of [`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}&nUserid=${OUTSIDER}`, `/realtimeapi/session/getsessionsbycaseid?nCaseid=${CASE_A}&nUserid=0`]) {
                const res = await get(url);
                expect([res.status, res.headers['cache-control'], res.headers['x-edge-source'], res.headers['x-content-type-options']]).toEqual([200, 'no-store', 'box', 'nosniff']);
                expect(res.body.map((r: { nSesid: string; cStatus: string }) => [r.nSesid, r.cStatus])).toEqual([
                    [S_ENDED, 'C'], // sealed
                    [S_LIVE, 'R'], // live
                    [S_NEXT, 'R'], // armed, waiting for the reporter (the mock answers R too)
                ]);
                for (const row of res.body) {
                    expect(Object.keys(row)).toEqual(expect.arrayContaining([...FE_SESSION_ROW_KEYS, ...MOCK_SESSION_ROW_KEYS]));
                }
                expect(res.body[1]).toEqual({
                    nSesid: S_LIVE,
                    nCaseid: CASE_A,
                    cName: 'Day 3 — Morning',
                    dStartDt: '2026-10-01 10:00:00',
                    cStatus: 'R',
                    isTranscript: false,
                    isUploaded: false,
                    cProtocol: 'B',
                    nLines: 25,
                    cCaseno: 'HC-2026-001',
                    cCasename: 'Harlow v Mercer Logistics',
                    bRefresh: false,
                    nRTSid: null,
                    nLSesid: S_LIVE,
                    cUrl: null,
                    nPort: null,
                    cTimezone: 'Europe/London',
                    cFeedSource: 'E',
                    nEdgeid: BOX,
                    cSyncState: 'L',
                    nPartNo: 1,
                    nPrevPartSesid: null,
                    nNextPartSesid: null,
                });
                expect(res.body[0]).toMatchObject({ cSyncState: 'K', cProtocol: 'C' });
            }
            // Case B: a stored session the kernel does not record (yet) is 'D'.
            expect((await get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_B}`)).body.map((r: { nSesid: string; cStatus: string }) => [r.nSesid, r.cStatus])).toEqual([[S_B, 'D']]);
            expect(cloudApi.requests).toEqual([]);
        });

        it('getlivesessionbycaseid / activesession: the live session (a list / one row); no live session = [] / an empty 200 body', async () => {
            const live = await get(`/realtimeapi/session/getlivesessionbycaseid?nCaseid=${CASE_A}&nUserid=x`);
            expect(live.body.map((r: { nSesid: string }) => r.nSesid)).toEqual([S_LIVE]);
            const active = await get(`/realtimeapi/session/activesession?nCaseid=${CASE_A}`);
            expect([active.status, active.body.nSesid, active.body.cStatus, Array.isArray(active.body)]).toEqual([200, S_LIVE, 'R', false]);
            const none = await get(`/realtimeapi/session/activesession?nCaseid=${CASE_B}`);
            expect([none.status, none.text, none.headers['cache-control']]).toEqual([200, '', 'no-store']);
            expect((await get(`/realtimeapi/session/getlivesessionbycaseid?nCaseid=${CASE_B}`)).body).toEqual([]);
        });

        it('activesession/detail: et_realtime_sessiondata columns + maxNumber + pageRes (the last page as its JSON text)', async () => {
            const sql = fs.readFileSync(path.join(REPO, 'assets', 'sql-migrations', '2026-05-09_upload_publish_cstatus.sql'), 'utf8');
            const body = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION realtime.et_realtime_sessiondata'));
            for (const column of CLOUD_SESSIONDATA_COLUMNS) expect([column, body.includes(`"${column}"`)]).toEqual([column, true]);

            const res = await get(`/realtimeapi/session/activesession/detail?nSesid=${S_LIVE}&nUserid=${OUTSIDER}`);
            expect(Object.keys(res.body).sort()).toEqual([...CLOUD_SESSIONDATA_COLUMNS, ...DETAIL_EXTRA_KEYS].sort());
            expect(res.body).toMatchObject({ nSesid: S_LIVE, nCaseid: CASE_A, nLines: 25, maxNumber: 2, cStatus: 'R', cProtocol: 'B', cCaseno: 'HC-2026-001', cCasename: 'Harlow v Mercer Logistics', isTrans: false });
            expect(JSON.parse(res.body.pageRes)).toEqual(JSON.parse(JSON.stringify(PAGES[1])));

            // Armed, no line yet: 0 pages (the cloud's getFilesCount answer for a session without a page file).
            const waiting = await get(`/realtimeapi/session/activesession/detail?nSesid=${S_NEXT}`);
            expect([waiting.body.maxNumber, waiting.body.pageRes, waiting.body.cStatus]).toEqual([0, null, 'R']);
        });

        it('session/realtimedatabysesid: {msg:1, data} exactly as the cloud converter builds it from the same pages', async () => {
            const res = await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_LIVE}&nUserid=${OUTSIDER}&nCaseid=${CASE_A}`);
            const cloudData = new ConversionJsService().pagesFromSessionMap({ 1: [...PAGES[0]], 2: [...PAGES[1]] } as unknown as Record<number, unknown[]>);
            expect(res.body).toEqual(JSON.parse(JSON.stringify({ msg: 1, data: cloudData })));
            expect(res.body.data[0].data[3]).toEqual({ time: '10:02:03', lineIndex: 4, lines: ['Q. Where were you on the third?'], formate: null, unicid: 5003 });
            expect(res.body.data[0].data[0]).toMatchObject({ formate: 'QES', lineIndex: 1 });
            expect(res.body.data[0].data[4].lines).toEqual(['A. At home']); // page-frame atoms stripped (canonical form)
            expect(res.body.data[0].data[10]).toEqual({ time: '00:00:00:00', lineIndex: 11, lines: [''] }); // the filler row
            // Armed, no line yet: the cloud's "no data" answer.
            expect((await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_NEXT}`)).body).toEqual({ msg: -1 });
        });

        it('feed/pages/total and feed/pages/data: the cloud live path (+ nSesid), the same pages the socket snapshot sends', async () => {
            expect((await get(`/realtimeapi/feed/pages/total?nSesid=${S_LIVE}`)).body).toEqual({ msg: 1, total: 2 });
            const res = await get(`/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=${encodeURIComponent('[2,1,9,2]')}`);
            expect(res.body).toEqual(JSON.parse(JSON.stringify(cloudLivePagesData(S_LIVE, { 1: PAGES[0], 2: PAGES[1] }, [2, 1, 9, 2]))));
            const snapshot = buildSnapshot(pagesFromList(PAGES), { nSesid: S_LIVE, tab: 1 });
            for (const page of res.body.feed) expect(JSON.stringify(page.data)).toBe(snapshot.find(p => p.page === page.page)?.data);

            // Armed, no line yet: total 0 (the session exists), no pages.
            expect((await get(`/realtimeapi/feed/pages/total?nSesid=${S_NEXT}`)).body).toEqual({ msg: 1, total: 0 });
            expect((await get(`/realtimeapi/feed/pages/data?nSesid=${S_NEXT}&pages=[1]`)).body).toEqual({ total: 0, feed: [] });
        });

        it('feed/pages/data and the session reads refuse a malformed request (400 invalid_request)', async () => {
            for (const url of [
                `/realtimeapi/feed/pages/data?nSesid=${S_LIVE}`,
                `/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=[]`,
                `/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=x`,
                `/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=[1.5]`,
                `/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=${encodeURIComponent(JSON.stringify(Array.from({ length: 2001 }, (_, i) => i + 1)))}`,
                `/realtimeapi/feed/pages/data?pages=[1]`,
                `/realtimeapi/feed/pages/total`,
                `/realtimeapi/session/realtimedatabysesid?nUserid=x`,
                `/realtimeapi/session/activesession/detail`,
                `/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}&nCaseid=${CASE_B}`,
                `/realtimeapi/session/getSessionsByCaseId?nCaseid=${'x'.repeat(9000)}`,
            ]) {
                expectEdgeError(await get(url), 400, 'invalid_request');
            }
        });

        it('coreapi/case/caseinfo from the cached assignments; the remaining local coreapi pickers answer []', async () => {
            const info = await get(`/coreapi/case/caseinfo?nCaseid=${CASE_A}`);
            expect([info.status, info.body]).toEqual([200, { nCaseid: CASE_A, cCasename: 'Harlow v Mercer Logistics', cCaseno: 'HC-2026-001' }]);
            for (const p of ['/coreapi/common/getcode?nCategoryid=22', `/coreapi/contact/getcontactlist?nCaseid=${CASE_A}`, `/coreapi/workspace/tasks/list?nCaseid=${CASE_A}`, '/coreapi/comments/grid?nFSid=f1', '/coreapi/common/getannotations?nBundledetailid=b1']) {
                const res = await get(p);
                expect([p, res.status, res.body, res.headers['x-edge-source']]).toEqual([p, 200, [], 'box']);
            }
            expect(cloudApi.requests).toEqual([]);
        });

        it('local reads work with the internet down', async () => {
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW - 60_000 };
            expect((await get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`)).body).toHaveLength(3);
            expect((await get(`/realtimeapi/session/activesession/detail?nSesid=${S_LIVE}`)).body.maxNumber).toBe(2);
            expect((await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_LIVE}`)).body.data).toHaveLength(2);
            expect((await get(`/realtimeapi/feed/pages/total?nSesid=${S_LIVE}`)).body).toEqual({ msg: 1, total: 2 });
            expect((await get(`/coreapi/case/caseinfo?nCaseid=${CASE_A}`)).status).toBe(200);
            expect(cloudApi.requests).toEqual([]);
        });
    });

    // ---- scope ---------------------------------------------------------------------------------------------------

    describe('scope (DR19): only the cases and sessions the sign-in may open', () => {
        it('a session assignee sees only that session; others answer the cloud\'s "no data"', async () => {
            const list = await get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`, ASSIGNEE);
            expect(list.body.map((r: { nSesid: string }) => r.nSesid)).toEqual([S_LIVE]);
            const detail = await get(`/realtimeapi/session/activesession/detail?nSesid=${S_NEXT}`, ASSIGNEE);
            expect([detail.status, detail.text]).toEqual([200, '']);
            expect((await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_NEXT}`, ASSIGNEE)).body).toEqual({ msg: -1 });
            expect((await get(`/realtimeapi/feed/pages/total?nSesid=${S_NEXT}`, ASSIGNEE)).body).toEqual({ msg: -1, total: 0 });
            expectEdgeError(await get(`/realtimeapi/feed/pages/data?nSesid=${S_NEXT}&pages=[1]`, ASSIGNEE), 404, 'session_not_found');
        });

        it('someone on no team sees nothing; unknown and cloud-deleted sessions look the same as forbidden ones', async () => {
            expect((await get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`, OUTSIDER)).body).toEqual([]);
            expect((await get(`/realtimeapi/session/activesession?nCaseid=${CASE_A}`, OUTSIDER)).text).toBe('');
            for (const nSesid of [S_LIVE, S_UNKNOWN, S_DELETED]) {
                const who = nSesid === S_LIVE ? OUTSIDER : MEMBER;
                expect((await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${nSesid}`, who)).body).toEqual({ msg: -1 });
                expect((await get(`/realtimeapi/session/activesession/detail?nSesid=${nSesid}`, who)).text).toBe('');
            }
            // The list never shows the deleted session.
            expect((await get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`)).body.map((r: { nSesid: string }) => r.nSesid)).not.toContain(S_DELETED);
        });

        it('a token without the case: [] for its lists, use_cloud for its case chip', async () => {
            const onlyB = bearer(await tokenFor(MEMBER, { cases: [CASE_B] }));
            expect((await request(lan.url).get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`).set(onlyB)).body).toEqual([]);
            expectUseCloud(await request(lan.url).get(`/coreapi/case/caseinfo?nCaseid=${CASE_A}`).set(onlyB));
            expect((await request(lan.url).get(`/coreapi/case/caseinfo?nCaseid=${CASE_B}`).set(onlyB)).status).toBe(200);
            expectUseCloud(await get(`/coreapi/case/caseinfo?nCaseid=${CASE_C}`)); // not in the token's cases
            expectUseCloud(await get('/coreapi/case/caseinfo'));
        });

        it('a room-code sign-in sees only its session', async () => {
            const room = bearer(await roomToken(PERSON, S_LIVE));
            const list = await request(lan.url).get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_A}`).set(room);
            expect(list.body.map((r: { nSesid: string }) => r.nSesid)).toEqual([S_LIVE]);
            expect((await request(lan.url).get(`/realtimeapi/session/activesession/detail?nSesid=${S_LIVE}`).set(room)).body.maxNumber).toBe(2);
            expect((await request(lan.url).get(`/realtimeapi/session/activesession/detail?nSesid=${S_NEXT}`).set(room)).text).toBe('');
            expect((await request(lan.url).get(`/realtimeapi/session/getSessionsByCaseId?nCaseid=${CASE_B}`).set(room)).body).toEqual([]);
        });

        it('every RT route needs a box sign-in: 401 without or with a bad token, and the cloud is never asked', async () => {
            for (const r of RT_ROUTES) {
                for (const auth of [null, 'Bearer garbage']) {
                    let req = send(r.method, `${r.path}?nCaseid=${CASE_A}&nSesid=${S_LIVE}`);
                    if (auth) req = req.set('Authorization', auth);
                    const res = r.method === 'GET' ? await req : await req.send({ nSesid: S_LIVE });
                    expect([r.id, res.status, res.body.error]).toEqual([r.id, 401, 'unauthenticated']);
                }
            }
            expect(cloudApi.requests).toEqual([]);
        });
    });

    describe('Fact sharing recipients through the coreapi alias', () => {
        const TEAM = `/coreapi/common/myteamusers?nCaseid=${CASE_A}`;

        it('returns the cloud recipients and replaces forged caller ids with the verified sign-in', async () => {
            const recipients = [{ nUserid: ADMIN, cFname: 'Priya', cLname: 'Shah', cEmail: 'priya@example.com', role: 'Counsel', nTeamid: 'team-a' }];
            const token = await tokenFor(MEMBER);
            cloudApi.reply = () => ({ status: 200, json: recipients });
            const res = await request(lan.url).get(`${TEAM}&nUserid=${OUTSIDER}&nMasterid=${OUTSIDER}`).set(bearer(token));
            expect([res.status, res.body, res.headers['x-edge-source']]).toEqual([200, recipients, 'cloud']);
            expect(cloudApi.requests).toHaveLength(1);
            const [call] = cloudApi.requests;
            expect([call.method, call.path, call.query.get('nCaseid'), call.query.get('nUserid'), call.query.get('nMasterid')]).toEqual([
                'GET', '/realtimeapi/factsheet/teamusers', CASE_A, MEMBER, MEMBER,
            ]);
            expect(call.headers.authorization).toBe(`Bearer ${token}`);
        });

        it('requires a case and refuses cases outside the sign-in before calling the cloud', async () => {
            for (const suffix of ['', '?nCaseid=', '?nCaseid=null', '?nCaseid=undefined']) {
                expectEdgeError(await get('/coreapi/common/myteamusers' + suffix), 400, 'invalid_request');
            }
            expectUseCloud(await get(`/coreapi/common/myteamusers?nCaseid=${CASE_C}`));
            expectUseCloud(await get(TEAM, OUTSIDER));
            const otherCase = bearer(await tokenFor(MEMBER, { cases: [CASE_B] }));
            expectUseCloud(await request(lan.url).get(TEAM).set(otherCase));
            expect(cloudApi.requests).toEqual([]);
        });

        it('reports an uncached offline read and box-signed sign-ins instead of succeeding with an empty list', async () => {
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            const offline = await get(TEAM);
            expectEdgeError(offline, 503, 'offline');
            expect(offline.body.offline).toBe(true);
            lan.uplink.internetStatus = { state: 'up', sinceMs: NOW };
            for (const token of [await roomToken(PERSON, S_LIVE), await operatorToken()]) {
                const reauth = await request(lan.url).get(TEAM).set(bearer(token));
                expectEdgeError(reauth, 503, 'reauth');
                expect(reauth.body.reauth).toBe(true);
            }
            expect(cloudApi.requests).toEqual([]);
        });

        it('passes a real empty cloud result through but surfaces a failed lookup', async () => {
            const empty = await get(TEAM);
            expect([empty.status, empty.body, empty.headers['x-edge-source']]).toEqual([200, [], 'cloud']);
            cloudApi.reply = () => ({ status: 500, json: { message: 'lookup failed' } });
            // Another case is another read (not the cached one). Since Phase 5 this route is a shared controller whose
            // query whitelist refuses an unknown key before the relay (the cloud's own whitelist refused it too), so a
            // stray `&request=failed` can no longer serve as the cache-buster here.
            expectEdgeError(await get(`/coreapi/common/myteamusers?nCaseid=${CASE_B}`), 502, 'cloud_refused');
            expect(cloudApi.requests).toHaveLength(2);
        });

        it('an unknown query key is refused by the shared controller before the cloud is asked (the cloud would refuse it too)', async () => {
            const res = await get(`${TEAM}&request=failed`);
            expectEdgeError(res, 400, 'invalid_request');
            expect(cloudApi.requests).toEqual([]);
        });
    });
    // ---- allowlisted reads proxied to the cloud -----------------------------------------------------------------------

    describe('allowlisted reads: proxied with the edge token, cached per user, offline from the cache', () => {
        it('forwards to the configured cloud with the caller\'s token only; nUserid becomes the caller; the cloud\'s headers stay out', async () => {
            const token = await tokenFor(MEMBER);
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'f1' }], [], []] });
            const res = await request(lan.url)
                .get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}&nUserid=${OUTSIDER}&cSorttype=H&nPageNumber=1`)
                .set('Authorization', `Bearer ${token}`)
                .set('Cookie', 'etab_edge_device=secret; other=1')
                .set('X-Forwarded-For', '203.0.113.9')
                .set('X-Custom', 'room');
            expect([res.status, res.body, res.headers['x-edge-source'], res.headers['cache-control'], res.headers['content-type']]).toEqual([
                200,
                [[{ nFSid: 'f1' }], [], []],
                'cloud',
                'no-store',
                'application/json; charset=utf-8',
            ]);
            expect([res.headers['set-cookie'], res.headers['x-cloud-internal']]).toEqual([undefined, undefined]);
            const [call] = cloudApi.requests;
            expect([call.method, call.path, call.query.get('nUserid'), call.query.get('nSesid'), call.query.get('cSorttype')]).toEqual(['GET', '/realtimeapi/marknav/all', MEMBER, S_LIVE, 'H']);
            expect(call.headers.authorization).toBe(`Bearer ${token}`);
            expect([call.headers.cookie, call.headers['x-forwarded-for'], call.headers['x-custom']]).toEqual([undefined, undefined, undefined]);
            expect(call.headers['user-agent']).toMatch(/^etabella-rt-edge\//);
            expect(call.headers.host).toBe(new URL(cloudApi.origin).host);
        });

        it('a fresh cached copy answers without the cloud; after the TTL the cloud is asked again; users never share entries', async () => {
            const url = `/realtimeapi/issue/issuelist_V2?nCaseid=${CASE_A}&nSessionid=null&nIDid=null&nUserid=${MEMBER}`;
            cloudApi.reply = () => ({ status: 200, json: [[{ nICid: 'c1' }], [{ nIid: 'i1' }]] });
            expect((await get(url)).headers['x-edge-source']).toBe('cloud');
            const again = await get(url);
            // A fresh copy is not served in place of anything the cloud could not give: no X-Edge-Stale, only its age.
            expect([again.body, again.headers['x-edge-source'], again.headers['x-edge-stale'], again.headers['x-edge-age']]).toEqual([
                [[{ nICid: 'c1' }], [{ nIid: 'i1' }]],
                'cache',
                undefined,
                '0',
            ]);
            expect(cloudApi.calls('/issue/issuelist_V2')).toHaveLength(1);
            // The query order does not make a new entry.
            expect((await get(`/realtimeapi/issue/issuelist_V2?nUserid=x&nIDid=null&nSessionid=null&nCaseid=${CASE_A}`)).headers['x-edge-source']).toBe('cache');
            // Another person: their own call.
            expect((await get(url, ADMIN)).headers['x-edge-source']).toBe('cloud');
            expect(cloudApi.calls('/issue/issuelist_V2')).toHaveLength(2);
            clock.advance(16_000);
            expect((await get(url)).headers['x-edge-source']).toBe('cloud');
            expect(cloudApi.calls('/issue/issuelist_V2')).toHaveLength(3);
        });

        it('identical reads of one user in flight share one cloud call', async () => {
            cloudApi.reply = () => ({ status: 200, json: [{ nHid: 'q1' }], delayMs: 150 });
            const token = bearer(await tokenFor(MEMBER));
            const url = `/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}&bIsTranscipt=false`;
            const [a, b] = await Promise.all([request(lan.url).get(url).set(token), request(lan.url).get(url).set(token)]);
            expect([a.body, b.body]).toEqual([[{ nHid: 'q1' }], [{ nHid: 'q1' }]]);
            expect(cloudApi.calls('/marknav/quickmarklist')).toHaveLength(1);
        });

        it('offline: the cached copy with X-Edge-Stale, else the mock\'s empty cursors with X-Edge-Offline; the editor reads 503 offline', async () => {
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'cached' }], [], []] });
            await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`);
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            clock.advance(90_000);
            const stale = await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`);
            expect([stale.status, stale.body, stale.headers['x-edge-source'], stale.headers['x-edge-stale']]).toEqual([200, [[{ nFSid: 'cached' }], [], []], 'cache', '90']);

            const empties: Array<[string, unknown]> = [
                [`/realtimeapi/marknav/all?nSesid=${S_NEXT}`, [[], [], []]],
                [`/realtimeapi/feed/annotations?nSessionid=${S_LIVE}&bTranscript=false`, [[], [], []]],
                [`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, []],
                ['/realtimeapi/doclink/docdetail?jDocids=["d1"]', []],
                [`/realtimeapi/issue/issuelist_V2?nCaseid=${CASE_A}&nSessionid=null`, [[], []]],
            ];
            for (const [url, body] of empties) {
                const started = Date.now();
                const res = await get(url);
                expect([url, res.status, res.body, res.headers['x-edge-offline'], res.headers['x-edge-source']]).toEqual([url, 200, body, '1', 'box']);
                expect(Date.now() - started).toBeLessThan(1_000);
            }
            for (const p of ['detail', 'issues', 'contacts', 'links', 'shared', 'tasks']) {
                const res = await get(`/realtimeapi/factsheet/${p}?nFSid=f1`);
                expectEdgeError(res, 503, 'offline');
                expect(res.body.offline).toBe(true);
            }
            expect(cloudApi.requests).toHaveLength(1); // only the first, online read
        });

        it('a box-signed sign-in is never forwarded: the empty cursors with X-Edge-Reauth, 503 reauth for the editor reads', async () => {
            for (const token of [await roomToken(PERSON, S_LIVE), await operatorToken()]) {
                const lists = await request(lan.url).get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`).set(bearer(token));
                expect([lists.status, lists.body, lists.headers['x-edge-reauth']]).toEqual([200, [[], [], []], '1']);
                const editor = await request(lan.url).get('/realtimeapi/factsheet/detail?nFSid=f1').set(bearer(token));
                expectEdgeError(editor, 503, 'reauth');
                expect(editor.body.reauth).toBe(true);
            }
            expect(cloudApi.requests).toEqual([]);
        });

        it('ids outside the sign-in\'s scope are refused use_cloud before the cloud is asked; legacy "null" ids count as absent', async () => {
            for (const url of [
                `/realtimeapi/marknav/all?nSesid=${S_UNKNOWN}`,
                `/realtimeapi/marknav/all?nSesid=${S_DELETED}`,
                `/realtimeapi/feed/annotations?nSessionid=${S_NEXT}&bTranscript=false`, // ASSIGNEE may not open S_NEXT
                `/realtimeapi/issue/issuelist_V2?nCaseid=${CASE_C}`,
                `/realtimeapi/issue/issuelist_V2?nCaseid=${CASE_B}&nSessionid=${S_LIVE}`, // session of another case
            ]) {
                expectUseCloud(await get(url, ASSIGNEE));
            }
            expect(cloudApi.requests).toEqual([]);
            expect((await get(`/realtimeapi/issue/issuelist_V2?nCaseid=${CASE_A}&nSessionid=null&nIDid=null`, ASSIGNEE)).status).toBe(200);
            expect(cloudApi.requests).toHaveLength(1);
        });

        it('the cloud\'s refusals: 401 → 502 (never a box 401), 403/404 JSON pass through, 5xx → 502 or the stale copy', async () => {
            const url = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
            cloudApi.reply = () => ({ status: 401, json: { message: 'Invalid Token' } });
            expectEdgeError(await get(url), 502, 'cloud_refused');
            cloudApi.reply = () => ({ status: 403, json: { message: 'Forbidden' } });
            const forbidden = await get(url);
            expect([forbidden.status, forbidden.body, forbidden.headers['x-edge-source']]).toEqual([403, { message: 'Forbidden' }, 'cloud']);
            cloudApi.reply = () => ({ status: 404, json: { statusCode: 404, message: 'No session data found' } });
            expect((await get(url)).status).toBe(404);
            cloudApi.reply = () => ({ status: 500, json: { message: 'boom' } });
            expectEdgeError(await get(url), 502, 'cloud_refused');

            cloudApi.reply = () => ({ status: 200, json: [['ok'], [], []] });
            await get(url);
            clock.advance(20_000);
            cloudApi.reply = () => ({ status: 503, json: { message: 'busy' } });
            const stale = await get(url);
            expect([stale.status, stale.body, stale.headers['x-edge-stale']]).toEqual([200, [['ok'], [], []], '20']);
            // A 401 drops the cached copy: offline afterwards there is nothing stale to show.
            cloudApi.reply = () => ({ status: 401, json: {} });
            expectEdgeError(await get(url), 502, 'cloud_refused');
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            expect((await get(url)).headers['x-edge-offline']).toBe('1');
        });

        it("a 200 failure answer (msg below 0, alone or as the one row) passes through as is, is never cached as a good read and drops that person's copy", async () => {
            const url = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
            const failures: unknown[] = [[{ msg: -1, value: 'Failed ' }], { msg: -1, value: 'Failed ' }, [{ msg: '-1' }], { msg: -2 }];
            for (const failure of failures) {
                cloudApi.requests.length = 0;
                cloudApi.reply = () => ({ status: 200, json: failure });
                const failed = await get(url);
                expect([failed.status, failed.body, failed.headers['x-edge-source']]).toEqual([200, failure, 'cloud']);
                cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'f1' }], [], []] });
                const next = await get(url); // asks the cloud: the failure was not kept
                expect([JSON.stringify(failure), next.body, next.headers['x-edge-source']]).toEqual([JSON.stringify(failure), [[{ nFSid: 'f1' }], [], []], 'cloud']);
                expect(cloudApi.calls('/marknav/all')).toHaveLength(2);
                lan.app.get(RtDataService).cache.clear();
            }

            // The cloud sends this shape for refusals too (factsheet/detail to a person who may no longer view the
            // fact), so a failure also drops the copy that person had of the read: offline there is no copy to serve.
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'good' }], [], []] });
            await get(url);
            lan.bus.publish('marks-changed', { reason: 'cloud', nSesid: S_LIVE, users: [MEMBER], kinds: ['F'], atMs: NOW });
            cloudApi.reply = () => ({ status: 200, json: [{ msg: -1, value: 'Failed ' }] });
            expect((await get(url)).body).toEqual([{ msg: -1, value: 'Failed ' }]);
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            const offline = await get(url);
            expect([offline.body, offline.headers['x-edge-source'], offline.headers['x-edge-offline']]).toEqual([[[], [], []], 'box', '1']);

            // Rows that carry a msg of 0 or more are ordinary answers and are cached.
            lan.uplink.internetStatus = { state: 'up', sinceMs: NOW };
            cloudApi.requests.length = 0;
            const quick = `/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`;
            cloudApi.reply = () => ({ status: 200, json: [{ msg: 1, nHid: 'q1' }] });
            await get(quick);
            expect((await get(quick)).headers['x-edge-source']).toBe('cache');
            expect(cloudApi.calls('/marknav/quickmarklist')).toHaveLength(1);
        });

        it("a refusal sent as a 200 failure (factsheet/detail: 'not permitted') drops that person's cached detail: busy or offline the box never serves it; other people's copies stay", async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800, staleReadWaitMs: 100 });
            const DETAIL = '/realtimeapi/factsheet/detail?nFSid=f1';
            const DETAIL_ROW = [{ nFSid: 'f1', cNote: 'the note' }];
            const NOT_VIEWABLE = { msg: -1, value: 'You are not permitted to view this fact' };
            cloudApi.reply = () => ({ status: 200, json: DETAIL_ROW });
            await get(DETAIL); // MEMBER could view it then
            await get(DETAIL, ADMIN);
            clock.advance(16_000); // past the fresh window: the next read asks the cloud
            cloudApi.reply = () => ({ status: 200, json: NOT_VIEWABLE });
            const refused = await get(DETAIL);
            expect([refused.status, refused.body, refused.headers['x-edge-source']]).toEqual([200, NOT_VIEWABLE, 'cloud']);

            // Busy: another read holds the one cloud slot past the wait. No copy is left, so 429, never the old detail.
            cloudApi.reply = () => ({ status: 200, json: [], delayMs: 500 });
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ASSIGNEE);
            while (cloudApi.calls('/marknav/quickmarklist').length === 0) await new Promise(resolve => setTimeout(resolve, 5));
            expectEdgeError(await get(DETAIL), 429, 'rate_limited');
            expect((await other).status).toBe(200);

            // Offline: no copy left, so the editor read's 503 offline.
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            expectEdgeError(await get(DETAIL), 503, 'offline');
            // Another person's copy of the same read is untouched.
            const admin = await get(DETAIL, ADMIN);
            expect([admin.status, admin.body, admin.headers['x-edge-source']]).toEqual([200, DETAIL_ROW, 'cache']);
            expect(cloudApi.calls('/factsheet/detail')).toHaveLength(3);
        });

        it('limits: a non-JSON body, a redirect (never followed), an oversized reply → 502; a hang → offline after the timeout', async () => {
            const url = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
            cloudApi.reply = () => ({ status: 200, raw: '<html><script>alert(1)</script></html>', headers: { 'Content-Type': 'text/html' } });
            expectEdgeError(await get(url), 502, 'cloud_refused');
            cloudApi.reply = r => (r.path.endsWith('/elsewhere') ? { status: 200, json: ['followed'] } : { status: 302, headers: { Location: `${cloudApi.origin}/realtimeapi/elsewhere` } });
            expectEdgeError(await get(url), 502, 'cloud_refused');
            expect(cloudApi.calls('/elsewhere')).toEqual([]);
            cloudApi.reply = () => ({ status: 200, streamBytes: 200 * 1024 });
            expectEdgeError(await get(url), 502, 'cloud_refused');
            const big = `[${'1,'.repeat(40 * 1024)}1]`;
            cloudApi.reply = () => ({ status: 200, raw: big, headers: { 'Content-Type': 'application/json', 'Content-Length': String(Buffer.byteLength(big)) } });
            expectEdgeError(await get(url), 502, 'cloud_refused'); // declared Content-Length over the limit

            cloudApi.reply = () => ({ hang: true });
            const started = Date.now();
            const hung = await get(url);
            const took = Date.now() - started;
            expect([hung.status, hung.body, hung.headers['x-edge-offline']]).toEqual([200, [[], [], []], '1']);
            expect(took).toBeGreaterThanOrEqual(350);
            expect(took).toBeLessThan(5_000);
            cloudApi.reply = () => ({ destroy: true });
            expect((await get(url)).headers['x-edge-offline']).toBe('1');
        });

        it('too many cloud calls in flight: a read with no copy waits its turn for a cloud slot and is answered; 429 rate_limited only once that wait ran out', async () => {
            const QUICK = `/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`;
            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800 });
            cloudApi.reply = () => ({ status: 200, json: [{ nHid: 'q1' }], delayMs: 300 });
            const first = get(QUICK, MEMBER);
            await new Promise(resolve => setTimeout(resolve, 100));
            const second = await get(QUICK, ADMIN); // nothing cached for ADMIN: it waits instead of a 429
            expect([second.status, second.body, second.headers['x-edge-source']]).toEqual([200, [{ nHid: 'q1' }], 'cloud']);
            expect((await first).status).toBe(200);
            expect(cloudApi.calls('/marknav/quickmarklist')).toHaveLength(2);

            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800, staleReadWaitMs: 100 });
            cloudApi.reply = () => ({ status: 200, json: [], delayMs: 500 });
            const slow = get(QUICK, MEMBER);
            await new Promise(resolve => setTimeout(resolve, 100));
            const started = Date.now();
            const refused = await get(QUICK, ADMIN);
            expectEdgeError(refused, 429, 'rate_limited');
            expect(refused.body.retryAfterSec).toBe(1);
            expect(Date.now() - started).toBeGreaterThanOrEqual(90);
            expect((await slow).status).toBe(200);
        });

        it('a busy box answers a copy that is only old (no mark notice or write since) at once, as before', async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800 });
            const url = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
            cloudApi.reply = () => ({ status: 200, json: [['old'], [], []] });
            await get(url);
            clock.advance(20_000);
            cloudApi.reply = () => ({ status: 200, json: [], delayMs: 300 });
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ADMIN);
            await new Promise(resolve => setTimeout(resolve, 100));
            const busy = await get(url);
            expect([busy.status, busy.body, busy.headers['x-edge-source'], busy.headers['x-edge-stale']]).toEqual([200, [['old'], [], []], 'cache', '20']);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(1); // it did not wait for the slot
            expect((await other).status).toBe(200);
        });

        it('a sealed session (the kernel dropped it) is read from the cloud; offline it answers the local "no data" with X-Edge-Offline', async () => {
            cloudApi.reply = () => ({ status: 200, json: { msg: 1, data: [{ msg: 1, page: 1, data: [{ time: '10:00:00', lineIndex: 1, lines: ['from the cloud'] }] }] } });
            const res = await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_ENDED}&nUserid=${OUTSIDER}&nCaseid=${CASE_A}`);
            expect([res.status, res.body.data[0].data[0].lines, res.headers['x-edge-source']]).toEqual([200, ['from the cloud'], 'cloud']);
            const [call] = cloudApi.requests;
            expect([call.path, call.query.get('nSesid'), call.query.get('nUserid')]).toEqual(['/realtimeapi/session/realtimedatabysesid', S_ENDED, MEMBER]);

            // The published transcript (bTranscript=true) is always the cloud's, even for a session the kernel holds.
            await get(`/realtimeapi/feed/pages/data?nSesid=${S_LIVE}&pages=[1]&bTranscript=true`);
            expect(cloudApi.calls('/feed/pages/data')).toHaveLength(1);
            // A case id beside the session that is not the session's (or not the sign-in's) is never forwarded.
            expectUseCloud(await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_ENDED}&nCaseid=${CASE_B}`));
            expectUseCloud(await get(`/realtimeapi/session/realtimedatabysesid?nSesid=${S_ENDED}&nCaseid=${CASE_C}`));

            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            const offline: Array<[string, unknown]> = [
                [`/realtimeapi/session/realtimedatabysesid?nSesid=${S_ENDED}&nCaseid=${CASE_A}&x=1`, { msg: -1 }],
                [`/realtimeapi/feed/pages/total?nSesid=${S_ENDED}`, { msg: -1, total: 0 }],
                [`/realtimeapi/feed/pages/data?nSesid=${S_ENDED}&pages=[1]`, { total: 0, feed: [] }],
            ];
            for (const [url, body] of offline) {
                const r = await get(url);
                expect([url, r.status, r.body, r.headers['x-edge-offline']]).toEqual([url, 200, body, '1']);
            }
            const detail = await get(`/realtimeapi/session/activesession/detail?nSesid=${S_ENDED}`);
            expect([detail.body.maxNumber, detail.body.cStatus, detail.headers['x-edge-offline']]).toEqual([0, 'C', '1']);
            expect(cloudApi.requests).toHaveLength(2);
        });
    });

    // ---- allowlisted writes ---------------------------------------------------------------------------------------

    describe('allowlisted writes: online with the edge token; offline 503; box-signed sign-ins 503 reauth', () => {
        it('every allowlisted write goes to its cloud route, with the caller as nUserid / nMasterid and only the JSON body', async () => {
            const token = await tokenFor(MEMBER);
            cloudApi.reply = () => ({ status: 201, json: [{ msg: 1, value: 'ok', nHid: 'h1' }] });
            for (const r of RT_ROUTES.filter(x => x.kind === 'cloud-write')) {
                cloudApi.requests.length = 0;
                const res = await send(r.method, `${r.path}?nCaseid=${CASE_C}&leak=1`)
                    .set('Authorization', `Bearer ${token}`)
                    .set('Cookie', 'etab_edge_device=secret')
                    .send({ nCaseid: CASE_A, nSesid: S_LIVE, nUserid: OUTSIDER, nMasterid: OUTSIDER, cColor: 'fbea49', jT: '[1]' });
                expect([r.id, res.status, res.body, res.headers['x-edge-source']]).toEqual([r.id, 201, [{ msg: 1, value: 'ok', nHid: 'h1' }], 'cloud']);
                const [call] = cloudApi.requests;
                expect([r.id, call.method, call.path, [...call.query.keys()]]).toEqual([r.id, r.method, `/realtimeapi/${r.cloudPath}`, []]);
                expect([r.id, JSON.parse(call.body)]).toEqual([r.id, { nCaseid: CASE_A, nSesid: S_LIVE, nUserid: MEMBER, nMasterid: MEMBER, cColor: 'fbea49', jT: '[1]' }]);
                expect([call.headers.authorization, call.headers['content-type'], call.headers.cookie]).toEqual([`Bearer ${token}`, 'application/json', undefined]);
            }
        });

        it('identity keys are replaced only where present (never added), and a write makes the writer\'s cached reads stale', async () => {
            cloudApi.reply = r => ({ status: 200, json: r.method === 'GET' ? [[{ nFSid: 'before' }], [], []] : [{ msg: 1 }] });
            const url = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
            await get(url);
            await get(url, ADMIN);
            expect((await get(url)).headers['x-edge-source']).toBe('cache');
            const token = await tokenFor(MEMBER);
            await request(lan.url).post('/realtimeapi/fact/deleteHighlights').set(bearer(token)).send({ nHid: 'h1' });
            expect(JSON.parse(cloudApi.calls('/fact/deleteHighlights')[0].body)).toEqual({ nHid: 'h1' });
            expect((await get(url)).headers['x-edge-source']).toBe('cloud'); // the writer's copy is stale: the cloud is asked
            expect((await get(url, ADMIN)).headers['x-edge-source']).toBe('cache'); // another person's is kept
        });

        it('offline: 503 {offline:true} at once, the cloud is not asked (v1 marks need the internet, S-D6)', async () => {
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW - 1_000 };
            const started = Date.now();
            const res = await request(lan.url).post('/realtimeapi/fact/inserthighlights').set(bearer(await tokenFor(MEMBER))).send({ nSesid: S_LIVE });
            expectEdgeError(res, 503, 'offline');
            expect(res.body.offline).toBe(true);
            expect(Date.now() - started).toBeLessThan(1_000);
            expect(cloudApi.requests).toEqual([]);
        });

        it('room-code and operator sign-ins: 503 {reauth:true}, before the offline check, never forwarded', async () => {
            const room = await roomToken(PERSON, S_LIVE);
            const op = await operatorToken();
            for (const token of [room, op]) {
                const res = await request(lan.url).post('/realtimeapi/fact/insertquickfact').set(bearer(token)).send({ nSesid: S_LIVE });
                expectEdgeError(res, 503, 'reauth');
                expect(res.body.reauth).toBe(true);
            }
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            expectEdgeError(await request(lan.url).put('/realtimeapi/issue/updateIssue').set(bearer(room)).send({ nCaseid: CASE_A }), 503, 'reauth');
            expect(cloudApi.requests).toEqual([]);
        });

        it('a write about a case or session outside the sign-in is use_cloud; a body that is not an object is 400, one too large is 413 payload_too_large', async () => {
            const token = bearer(await tokenFor(ASSIGNEE));
            expectUseCloud(await request(lan.url).post('/realtimeapi/fact/insertfact').set(token).send({ nSesid: S_NEXT }));
            expectUseCloud(await request(lan.url).post('/realtimeapi/fact/insertfact').set(token).send({ nSessionid: S_UNKNOWN }));
            expectUseCloud(await request(lan.url).post('/realtimeapi/issue/insertIssue').set(token).send({ nCaseid: CASE_C }));
            expectUseCloud(await request(lan.url).post('/realtimeapi/issue/insertIssue').set(token).send({ nCaseid: CASE_B, nSesid: S_LIVE }));
            expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').set(token).send([{ nSesid: S_LIVE }]), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').set(token).send({ nSesid: { $ne: 1 } }), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').set(token).send({ nSesid: S_LIVE, jT: 'x'.repeat(9 * 1024) }), 413, 'payload_too_large');
            expect(cloudApi.requests).toEqual([]);
        });

        it('the cloud\'s answers: 401 → 502, 4xx JSON passes, 5xx / non-JSON → 502, a timeout → 502, a dropped connection → 503 offline', async () => {
            const post = async () => request(lan.url).post('/realtimeapi/factsheet/save').set(bearer(await tokenFor(MEMBER))).send({ nFSid: 'f1', nSesid: S_LIVE });
            cloudApi.reply = () => ({ status: 401, json: { message: 'Old Token' } });
            expectEdgeError(await post(), 502, 'cloud_refused');
            cloudApi.reply = () => ({ status: 400, json: { message: ['nFt must be a number'], error: 'Bad Request', statusCode: 400 } });
            const bad = await post();
            expect([bad.status, bad.body.error, bad.headers['x-edge-source']]).toEqual([400, 'Bad Request', 'cloud']);
            cloudApi.reply = () => ({ status: 500, json: { message: 'boom' } });
            expectEdgeError(await post(), 502, 'cloud_refused');
            cloudApi.reply = () => ({ status: 200, raw: 'not json' });
            expectEdgeError(await post(), 502, 'cloud_refused');
            cloudApi.reply = () => ({ hang: true });
            expectEdgeError(await post(), 502, 'cloud_refused');
            cloudApi.reply = () => ({ destroy: true });
            const dropped = await post();
            expectEdgeError(dropped, 503, 'offline');
            cloudApi.reply = () => ({ status: 200, streamBytes: 40 * 1024 });
            expectEdgeError(await post(), 502, 'cloud_refused');
        });
    });

    // ---- live mark sync (user decision 2026-10-05) --------------------------------------------------------------------

    describe('live mark sync: a marks-changed notice makes cached reads stale at once (user decision 2026-10-05)', () => {
        const LIST = `/realtimeapi/marknav/all?nSesid=${S_LIVE}`;
        const cloudNotice = (users: string[]) => lan.bus.publish('marks-changed', { reason: 'cloud', nSesid: S_LIVE, users, kinds: ['F'], atMs: NOW });
        const until = async (condition: () => boolean, timeoutMs = 5_000): Promise<void> => {
            const deadline = Date.now() + timeoutMs;
            while (!condition()) {
                if (Date.now() > deadline) throw new Error('condition not met in time');
                await new Promise(resolve => setTimeout(resolve, 5));
            }
        };

        it("a cloud notice: those users' next read asks etabella.net at once; other users keep their cached copy", async () => {
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'v1' }], [], []] });
            await get(LIST);
            await get(LIST, ADMIN);
            expect((await get(LIST)).headers['x-edge-source']).toBe('cache');
            cloudNotice([MEMBER.toUpperCase()]);
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'v2' }], [], []] });
            const after = await get(LIST);
            expect([after.body, after.headers['x-edge-source']]).toEqual([[[{ nFSid: 'v2' }], [], []], 'cloud']);
            expect((await get(LIST, ADMIN)).headers['x-edge-source']).toBe('cache');
            // Stored fresh again: the user's other device takes it as the current marks (no X-Edge-Stale).
            const fresh = await get(LIST);
            expect([fresh.body, fresh.headers['x-edge-source'], fresh.headers['x-edge-stale']]).toEqual([[[{ nFSid: 'v2' }], [], []], 'cache', undefined]);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(3);
        });

        it('a resync (the cloud link came back) makes every user\'s cached reads stale', async () => {
            cloudApi.reply = () => ({ status: 200, json: [[], [], []] });
            await get(LIST);
            await get(LIST, ADMIN);
            lan.bus.publish('marks-changed', { reason: 'resync', nSesid: null, users: null, kinds: ['Q', 'F', 'D'], atMs: NOW });
            expect((await get(LIST)).headers['x-edge-source']).toBe('cloud');
            expect((await get(LIST, ADMIN)).headers['x-edge-source']).toBe('cloud');
        });

        it('a busy box never passes off the copy a notice made stale as current: the read waits for a free cloud slot and answers the new marks', async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800 });
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'kept' }], [], []] });
            await get(LIST);
            cloudNotice([MEMBER]);
            cloudApi.reply = r => (r.path.endsWith('/quickmarklist') ? { status: 200, json: [], delayMs: 300 } : { status: 200, json: [[{ nFSid: 'new' }], [], []] });
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ADMIN); // takes the one slot
            await until(() => cloudApi.calls('/marknav/quickmarklist').length === 1);
            const after = await get(LIST);
            expect([after.status, after.body, after.headers['x-edge-source'], after.headers['x-edge-stale']]).toEqual([200, [[{ nFSid: 'new' }], [], []], 'cloud', undefined]);
            expect((await other).status).toBe(200);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(2);
        });

        it('reads leave cloud slots for writes: a Quick Mark saved while the reload burst fills the box is not refused 429; the read that found no slot waits its turn', async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 2, readTimeoutMs: 800 });
            cloudApi.reply = r => (r.method === 'GET' ? { status: 200, json: [], delayMs: 300 } : { status: 200, json: [{ msg: 1, nHid: 'h1' }] });
            const [admin, assignee, member] = [await tokenFor(ADMIN), await tokenFor(ASSIGNEE), await tokenFor(MEMBER)];
            const QUICK = `/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`;
            let answered = 0;
            const read = (token: string) =>
                request(lan.url)
                    .get(QUICK)
                    .set(bearer(token))
                    .then(res => {
                        answered++;
                        return res;
                    });
            const first = read(admin); // takes the one read slot (2 slots, writeSlots 8)
            await until(() => cloudApi.calls('/marknav/quickmarklist').length === 1);
            const second = read(assignee); // no read slot and no copy: it waits for the first to end
            await new Promise(resolve => setTimeout(resolve, 50));
            const write = await request(lan.url).post('/realtimeapi/fact/inserthighlights').set(bearer(member)).send({ nSesid: S_LIVE });
            expect([write.status, write.body]).toEqual([200, [{ msg: 1, nHid: 'h1' }]]);
            expect(answered).toBe(0); // the write did not wait behind the reads
            const reads = (await Promise.all([first, second])).map(r => [r.status, r.headers['x-edge-source']]);
            expect(reads).toEqual([
                [200, 'cloud'],
                [200, 'cloud'],
            ]);
            expect(cloudApi.calls('/marknav/quickmarklist')).toHaveLength(2);
        });

        it("after the author's own write, their follow-up read on a busy box waits its turn for a cloud slot and answers the new marks", async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 2, readTimeoutMs: 800 });
            const member = await tokenFor(MEMBER);
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'v1' }], [], []] });
            await get(LIST);
            cloudApi.reply = r =>
                r.method !== 'GET'
                    ? { status: 200, json: [{ msg: 1, nFSid: 'v2' }] }
                    : r.path.endsWith('/quickmarklist')
                      ? { status: 200, json: [], delayMs: 300 }
                      : { status: 200, json: [[{ nFSid: 'v1' }, { nFSid: 'v2' }], [], []] };
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ADMIN); // takes the one read slot
            await until(() => cloudApi.calls('/marknav/quickmarklist').length === 1);
            const write = await request(lan.url).post('/realtimeapi/factsheet/save').set(bearer(member)).send({ nFSid: 'v2', nSesid: S_LIVE });
            expect(write.status).toBe(200);
            const after = await request(lan.url).get(LIST).set(bearer(member));
            expect([after.status, after.body, after.headers['x-edge-source'], after.headers['x-edge-stale']]).toEqual([200, [[{ nFSid: 'v1' }, { nFSid: 'v2' }], [], []], 'cloud', undefined]);
            expect((await other).status).toBe(200);
        });

        it("after a write, a busy read whose wait ran out falls back to the writer's own earlier copy (X-Edge-Stale), never another person's; offline too", async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 2, readTimeoutMs: 1_500, staleReadWaitMs: 150 });
            const member = await tokenFor(MEMBER);
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'member-copy' }], [], []] });
            await get(LIST);
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'admin-copy' }], [], []] });
            await get(LIST, ADMIN);
            cloudApi.reply = r => (r.method !== 'GET' ? { status: 200, json: [{ msg: 1 }] } : { status: 200, json: [], delayMs: 900 });
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ASSIGNEE); // holds the one read slot past the wait
            await until(() => cloudApi.calls('/marknav/quickmarklist').length === 1);
            const write = await request(lan.url).post('/realtimeapi/fact/deleteHighlights').set(bearer(member)).send({ nHid: 'h1' });
            expect(write.status).toBe(200);
            const started = Date.now();
            const busy = await request(lan.url).get(LIST).set(bearer(member));
            expect([busy.status, busy.body, busy.headers['x-edge-source'], busy.headers['x-edge-stale']]).toEqual([200, [[{ nFSid: 'member-copy' }], [], []], 'cache', '0']);
            expect(Date.now() - started).toBeGreaterThanOrEqual(140);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(2); // only the two first reads reached the cloud
            expect((await other).status).toBe(200);
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            const offline = await request(lan.url).get(LIST).set(bearer(member));
            expect([offline.body, offline.headers['x-edge-source']]).toEqual([[[{ nFSid: 'member-copy' }], [], []], 'cache']);
            const admin = await get(LIST, ADMIN);
            expect([admin.body, admin.headers['x-edge-source']]).toEqual([[[{ nFSid: 'admin-copy' }], [], []], 'cache']);
        });

        it('the stale copy is kept for when the cloud cannot answer: a busy box once its wait for a slot ran out, and a box gone offline', async () => {
            await lan.close();
            lan = await start({}, { maxInFlight: 1, readTimeoutMs: 800, staleReadWaitMs: 150 });
            cloudApi.reply = () => ({ status: 200, json: [[{ nFSid: 'kept' }], [], []] });
            await get(LIST);
            cloudNotice([MEMBER]);
            cloudApi.reply = () => ({ status: 200, json: [], delayMs: 600 });
            const other = get(`/realtimeapi/marknav/quickmarklist?nSesid=${S_LIVE}`, ADMIN); // holds the one slot past the wait
            await until(() => cloudApi.calls('/marknav/quickmarklist').length === 1);
            const started = Date.now();
            const busy = await get(LIST);
            expect([busy.status, busy.body, busy.headers['x-edge-source'], busy.headers['x-edge-stale']]).toEqual([200, [[{ nFSid: 'kept' }], [], []], 'cache', '0']);
            expect(Date.now() - started).toBeGreaterThanOrEqual(140);
            expect((await other).status).toBe(200);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(1);
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            const offline = await get(LIST);
            expect([offline.body, offline.headers['x-edge-source']]).toEqual([[[{ nFSid: 'kept' }], [], []], 'cache']);
        });

        it('a read in flight when the notice came is not kept as fresh and never replaces the newer copy; a read after the notice does not share its call', async () => {
            const replies = [
                { status: 200, json: [['before'], [], []], delayMs: 250 },
                { status: 200, json: [['after'], [], []] },
            ];
            cloudApi.reply = () => replies.shift() ?? { status: 200, json: [['later'], [], []] };
            const slow = get(LIST);
            await until(() => cloudApi.calls('/marknav/all').length === 1);
            cloudNotice([MEMBER]);
            const after = await get(LIST);
            expect([after.body, after.headers['x-edge-source']]).toEqual([[['after'], [], []], 'cloud']);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(2); // its own call, not the one in flight
            expect((await slow).body).toEqual([['before'], [], []]);
            const next = await get(LIST);
            expect([next.body, next.headers['x-edge-source']]).toEqual([[['after'], [], []], 'cache']);
            expect(cloudApi.calls('/marknav/all')).toHaveLength(2);
        });

        const DETAIL = '/realtimeapi/factsheet/detail?nFSid=f1';
        const DETAIL_ROW = [{ nFSid: 'f1', cNote: 'the note' }];
        const NOT_VIEWABLE = { msg: -1, value: 'You are not permitted to view this fact' };

        it("a read that started before the cloud refused this person (factsheet/detail: 'not permitted') and answers after it never brings the refused detail back", async () => {
            const replies = [
                { status: 200, json: DETAIL_ROW, delayMs: 250 }, // read before the share was removed, slow to arrive
                { status: 200, json: NOT_VIEWABLE },
            ];
            cloudApi.reply = () => replies.shift() ?? { status: 200, json: NOT_VIEWABLE };
            const slow = get(DETAIL);
            await until(() => cloudApi.calls('/factsheet/detail').length === 1);
            cloudNotice([MEMBER]); // the share removal tells MEMBER, so the next read has its own call
            expect((await get(DETAIL)).body).toEqual(NOT_VIEWABLE);
            expect((await slow).body).toEqual(DETAIL_ROW); // its own answer still passes through
            // It was not kept: offline there is no copy to serve.
            lan.uplink.internetStatus = { state: 'down', sinceMs: NOW };
            expectEdgeError(await get(DETAIL), 503, 'offline');
        });

        it('a read that took its copy before the cloud refused this person does not answer its own busy or 5xx fallback with that copy', async () => {
            await lan.close();
            lan = await start({}, { readTimeoutMs: 1_500 });
            cloudApi.reply = () => ({ status: 200, json: DETAIL_ROW });
            await get(DETAIL); // MEMBER could view it then
            clock.advance(16_000); // past the fresh window: the next reads ask the cloud, each with that copy in hand
            // Read 1: no cloud slot comes free until after the refusal.
            const proxy = lan.app.get(RtCloudProxy);
            let busyNow: () => void = () => undefined;
            const send = jest
                .spyOn(proxy, 'send')
                .mockImplementationOnce(() => new Promise<CloudResult>(resolve => (busyNow = () => resolve({ kind: 'refused', reason: 'busy', message: 'no free cloud slot' }))));
            const busy = get(DETAIL);
            await until(() => send.mock.calls.length === 1);
            // Read 2 (after a notice, so its own call): etabella.net answers 503, after the refusal.
            cloudNotice([MEMBER]);
            cloudApi.reply = () => ({ status: 503, json: { message: 'busy' }, delayMs: 400 });
            const failing = get(DETAIL);
            await until(() => cloudApi.calls('/factsheet/detail').length === 2);
            // Read 3 (after the share removal's notice): refused.
            cloudNotice([MEMBER]);
            cloudApi.reply = () => ({ status: 200, json: NOT_VIEWABLE });
            expect((await get(DETAIL)).body).toEqual(NOT_VIEWABLE);
            busyNow();
            expectEdgeError(await busy, 429, 'rate_limited');
            expectEdgeError(await failing, 502, 'cloud_refused');
        });
    });

    // ---- no open proxy -------------------------------------------------------------------------------------------

    describe('the allowlist is exact; nothing else under a cloud base is served or proxied', () => {
        it('other methods, other paths and path tricks answer use_cloud, and the cloud is never asked', async () => {
            const token = await tokenFor(MEMBER);
            const attempts: Array<[string, string]> = [
                ['get', '/realtimeapi/fact/insertfact'],
                ['post', '/realtimeapi/marknav/all'],
                ['patch', '/realtimeapi/issue/updateIssue'],
                ['put', '/realtimeapi/issue/insertIssue'],
                ['delete', '/realtimeapi/issue/deleteClaim'],
                ['post', '/realtimeapi/factsheet/unshare'],
                ['get', '/realtimeapi/marknav/factlist'],
                ['get', '/realtimeapi/factsheet/factannotation?nFSid=f1'],
                ['get', '/realtimeapi/session/eclipse/credential?nSesid=1'],
                ['post', '/realtimeapi/session/eclipse'],
                ['post', '/realtimeapi/session/sessionend'],
                ['post', '/realtimeapi/session/edge/split'],
                ['post', '/realtimeapi/upload'],
                ['post', '/realtimeapi/transcript/publish'],
                ['get', '/realtimeapi/marknav/%61ll'],
                ['get', '/realtimeapi/marknav%2Fall'],
                ['get', '/realtimeapi//marknav/all'],
                ['get', '/realtimeapi/marknav/all.json'],
                ['get', '/realtimeapi/marknav/all/x'],
                ['post', '/coreapi/comments/add'],
                ['get', '/coreapi/user/me'],
            ];
            for (const [method, url] of attempts) {
                const req = send(method, url).set('Authorization', `Bearer ${token}`);
                const res = method === 'get' ? await req : await req.send({ nSesid: S_LIVE });
                expect([method, url, res.status, res.body?.error]).toEqual([method, url, 403, 'use_cloud']);
            }
            // Raw request targets the HTTP client would normalise: dot segments, an absolute-form target naming another host.
            for (const target of [`/realtimeapi/x/../marknav/all?nSesid=${S_LIVE}`, `/realtimeapi/./marknav/all?nSesid=${S_LIVE}`, `http://evil.example/realtimeapi/marknav/all?nSesid=${S_LIVE}`]) {
                const res = await rawRequest(lan.port, 'GET', target, { Authorization: `Bearer ${token}` });
                expect([target, res.status, JSON.parse(res.body).error]).toEqual([target, 403, 'use_cloud']);
            }
            expect(cloudApi.requests).toEqual([]);
        });

        it('only the configured cloud origin: a realtimeApiUrl on another origin disables the proxy (502), and nothing is contacted', async () => {
            const other = new FakeCloudApi();
            await other.start();
            try {
                await lan.close();
                lan = await start({ cloud: { origin: cloudApi.origin, realtimeApiUrl: `${other.origin}/realtimeapi` } });
                expectEdgeError(await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`), 502, 'cloud_refused');
                expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').set(bearer(await tokenFor(MEMBER))).send({ nSesid: S_LIVE }), 502, 'cloud_refused');
                expect([cloudApi.requests, other.requests]).toEqual([[], []]);
                // Local reads are unaffected.
                expect((await get(`/realtimeapi/feed/pages/total?nSesid=${S_LIVE}`)).body).toEqual({ msg: 1, total: 2 });
            } finally {
                await other.close();
            }
        });

        it('a cloud that cannot be reached: reads answer like offline, writes 503 offline', async () => {
            const closed = http.createServer();
            await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', () => resolve()));
            const deadOrigin = `http://127.0.0.1:${(closed.address() as AddressInfo).port}`;
            await new Promise<void>(resolve => closed.close(() => resolve()));
            await lan.close();
            lan = await start({ cloud: { origin: deadOrigin } });
            const read = await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`);
            expect([read.status, read.body, read.headers['x-edge-offline']]).toEqual([200, [[], [], []], '1']);
            expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').set(bearer(await tokenFor(MEMBER))).send({ nSesid: S_LIVE }), 503, 'offline');
        });

        it('the cache keeps only 200 JSON reads, per user, in memory', async () => {
            const service = lan.app.get(RtDataService);
            cloudApi.reply = r =>
                r.method !== 'GET' ? { status: 200, json: [{ msg: 1 }] } : r.path.endsWith('/marknav/all') ? { status: 200, json: [[], [], []] } : { status: 404, json: { message: 'nope' } };
            await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`);
            await get('/realtimeapi/factsheet/detail?nFSid=f1');
            expect(service.cache.size).toBe(1); // the 404 was never stored
            await request(lan.url).post('/realtimeapi/fact/insertfact').set(bearer(await tokenFor(MEMBER))).send({ nSesid: S_LIVE });
            expect(service.cache.size).toBe(1); // the write left the writer's copy stale, not gone
            expect((await get(`/realtimeapi/marknav/all?nSesid=${S_LIVE}`)).headers['x-edge-source']).toBe('cloud');
            expect(service.cache.size).toBe(1); // the new answer replaced it
        });
    });
});

/** A raw HTTP request with an exact request target (no client-side normalisation). */
function rawRequest(port: number, method: string, target: string, headers: Record<string, string>): Promise<{ status: number; body: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, method, path: target, headers, agent: false }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
        });
        req.on('error', reject);
        req.end();
    });
}
