import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { createHash } from 'crypto';

import * as request from 'supertest';
import { EdgeBoxTokenSigner } from '@app/edge-token';

import { endOfBoxDayMs } from '../auth/box-time';
import { FakeState } from '../auth/testing/fake-state';
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
    H,
    MEMBER,
    NOW,
    NOW_SEC,
    onlineToken,
    OUTSIDER,
    PERSON,
    S_B,
    S_ENDED,
    S_LIVE,
    S_NEXT,
    SpecClock,
} from '../auth/testing/edge-world';
import { EDGE_CONTRACT_VERSION, EDGE_ROUTES, edgePath, EdgeRouteDef, isEdgeConfig, isEdgeErrorBody } from '../contracts';
import { ACCESS_PORT, AccessPort, EdgePortError, KernelSessionView, NO_REQUEST_CONTEXT } from '../ports';
import { LanApp, makePublicDir, startLanApp } from './testing/lan-test-kit';

const ROUTES = Object.entries(EDGE_ROUTES) as Array<[string, EdgeRouteDef]>;
const filled = (def: EdgeRouteDef): string => (def.path.includes(':id') ? edgePath(def.path, { id: 'x1' }) : def.path);

function call(app: LanApp, def: EdgeRouteDef, url = filled(def)): request.Test {
    const agent = request(app.url);
    if (def.method === 'GET') return agent.get(url);
    if (def.method === 'PUT') return agent.put(url).send({});
    return agent.post(url).send({});
}

/** Raw GET with an exact request path (no client-side normalisation of `..` or escapes). */
function rawGet(port: number, rawPath: string, headers: Record<string, string> = {}): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
    return new Promise((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port, method: 'GET', path: rawPath, headers, agent: false }, res => {
            let body = '';
            res.setEncoding('utf8');
            res.on('data', chunk => (body += chunk));
            res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

describe('rt-edge LAN HTTP surface (CONTRACTS.md)', () => {
    let cloud: CloudKeys;
    let dist: ReturnType<typeof makePublicDir>;
    let state: FakeState;
    let clock: SpecClock;
    let lan: LanApp;

    beforeAll(async () => {
        cloud = await cloudKeys();
        dist = makePublicDir();
    });

    afterAll(() => dist.cleanup());

    beforeEach(async () => {
        state = edgeWorld(cloud.keys);
        clock = new SpecClock();
        lan = await startLanApp({ state, clock: clock.now, publicDir: dist.publicDir });
        lan.kernel.views.set(S_LIVE, { nSesid: S_LIVE, phase: 'live', localState: 'live', firstLineAtMs: Date.UTC(2026, 9, 1, 9, 2), lastLineAtMs: NOW - 5000, page: 41, totalLines: 1018, endedAtMs: null } as Partial<KernelSessionView>);
    });

    afterEach(async () => {
        await lan.close();
    });

    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
    const tokenFor = (sub: string, over: Record<string, unknown> = {}) => onlineToken(cloud, { sub, ...over });
    const signer = () => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));
    const operatorToken = async () =>
        (await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') })).token;
    const access = (): AccessPort => lan.app.get<AccessPort>(ACCESS_PORT);
    async function issueCode(nUserid = PERSON, nSesid = S_LIVE): Promise<{ code: string; id: string }> {
        const admin = await lan.auth.authenticate(await tokenFor(ADMIN), NO_REQUEST_CONTEXT);
        const result = access().issueRoomCodes(admin, { nSesid, userIds: [nUserid] }, NO_REQUEST_CONTEXT).results[0];
        if (result.status !== 'issued') throw new Error(result.error);
        return { code: result.issued.code, id: result.issued.id };
    }

    const expectEdgeError = (res: request.Response, status: number, error: string): void => {
        expect([res.status, res.body?.error]).toEqual([status, error]);
        expect(res.body.msg).toBe(-1);
        expect(isEdgeErrorBody(res.body)).toBe(true);
        expect(res.headers['cache-control']).toBe('no-store');
    };

    // ---- identity and reachability --------------------------------------------------------------------------------

    describe('GET /edge-config.json and /edge/ping (D8, DR5, DR14)', () => {
        it('serves the runtime config (no msg, no-store) built from the box config and identity; any Authorization is ignored', async () => {
            const res = await request(lan.url).get('/edge-config.json').set('Authorization', 'Bearer garbage');
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toBe('no-store');
            expect(isEdgeConfig(res.body)).toBe(true);
            expect(res.body).toEqual({
                contractVersion: EDGE_CONTRACT_VERSION,
                nEdgeid: BOX,
                boxName: 'Court 3',
                venueLabel: 'Live transcript · Court 3',
                boxHost: 'k7q2m9x4.etabella-edge.net',
                roomWifiSsid: 'Court3-Transcript',
                timeZone: 'Europe/London',
                cloudOrigin: 'https://cloud.invalid',
                cloudPingUrl: 'https://cloud.invalid/favicon.ico',
                pkce: {
                    authorizeUrl: 'https://cloud.invalid/auth/edge',
                    tokenUrl: 'https://cloud.invalid/authapi/edge/token',
                    refreshUrl: 'https://cloud.invalid/authapi/edge/refresh',
                    callbackPath: '/auth/callback',
                    codeChallengeMethod: 'S256',
                    audience: `edge:${BOX}`,
                },
                features: { roomCodes: true, operatorCode: true, transmitterDialMode: true, offlineMarks: false, reporterPasswordOnBox: false, documentsOnBox: false },
            });
            expect('msg' in res.body).toBe(false);
        });

        it('answers 404 while the box has no identity (the FE shows "Box not configured"), never the FE placeholder file', async () => {
            state.identityRow = null;
            const res = await request(lan.url).get('/edge-config.json');
            expectEdgeError(res, 404, 'not_found');
            expect(JSON.stringify(res.body)).not.toContain('placeholder');
        });

        it('pings with the box id, clock, zone, internet state and whether the box is linked', async () => {
            const res = await request(lan.url).get('/edge/ping');
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toBe('no-store');
            expect(res.body).toEqual({ msg: 1, nEdgeid: BOX, nowMs: NOW, timeZone: 'Europe/London', internet: { state: 'up', sinceMs: NOW - H }, cloudLinked: true });
            state.setIdentity({ nEdgeid: BOX, status: 'quarantined' });
            lan.uplink.internet = () => {
                throw new Error('uplink not started');
            };
            expect((await request(lan.url).get('/edge/ping')).body).toMatchObject({ internet: { state: 'unknown', sinceMs: null }, cloudLinked: false });
            state.identityRow = null;
            expect((await request(lan.url).get('/edge/ping')).body).toMatchObject({ msg: 1, nEdgeid: '', cloudLinked: false });
            state.failReads = new Error('SQLITE_IOERR');
            expect((await request(lan.url).get('/edge/ping')).status).toBe(200);
        });
    });

    // ---- sign-in entry points ---------------------------------------------------------------------------------------

    describe('POST /edge/auth/sign-in/start (DR5, D33)', () => {
        const body = { email: 'priya@firm.example', state: 'state-0123456789abcdef', codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM', codeChallengeMethod: 'S256' };

        it('replies 200 (not 201) with the authorize URL built from the box identity', async () => {
            const res = await request(lan.url).post('/edge/auth/sign-in/start').send(body);
            expect(res.status).toBe(200);
            expect(res.headers['cache-control']).toBe('no-store');
            expect(res.body).toEqual({ msg: 1, authorizeUrl: `https://cloud.invalid/auth/edge?edge=${BOX}&state=${body.state}&cc=${body.codeChallenge}&login_hint=priya%40firm.example` });
        });

        it('answers invalid_request, box_not_linked, box_not_configured and rate_limited in the envelope', async () => {
            expectEdgeError(await request(lan.url).post('/edge/auth/sign-in/start').send({ ...body, codeChallengeMethod: 'plain' }), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).post('/edge/auth/sign-in/start').set('Content-Type', 'application/json').send('{"email":'), 400, 'invalid_request');
            state.setIdentity({ nEdgeid: BOX, status: 'pending-confirm' });
            expectEdgeError(await request(lan.url).post('/edge/auth/sign-in/start').send(body), 503, 'box_not_linked');
            state.identityRow = null;
            expectEdgeError(await request(lan.url).post('/edge/auth/sign-in/start').send(body), 503, 'box_not_configured');
            state.setIdentity({ nEdgeid: BOX });
            for (let i = 0; i < 20; i++) await request(lan.url).post('/edge/auth/sign-in/start').send(body);
            const limited = await request(lan.url).post('/edge/auth/sign-in/start').send(body);
            expectEdgeError(limited, 429, 'rate_limited');
            expect(limited.body.retryAfterSec).toBe(60);
        });

        it("a body over the parser's limit is 413 payload_too_large in the envelope, never a malformed request (400)", async () => {
            // This kit runs Nest's default parser (100 KB); the box runs EDGE_BODY_LIMIT_BYTES (main.ts). Same mapping.
            const big = { ...body, email: `${'x'.repeat(200 * 1024)}@firm.example` };
            const res = await request(lan.url).post('/edge/auth/sign-in/start').send(big);
            expectEdgeError(res, 413, 'payload_too_large');
            expect(res.body).toEqual({ msg: -1, error: 'payload_too_large', message: expect.any(String) });
            // Also before any route decides (a cloud write route: the parser refuses it first).
            expectEdgeError(await request(lan.url).post('/realtimeapi/fact/insertfact').send(big), 413, 'payload_too_large');
        });
    });

    describe('POST /edge/auth/room-code (DR5, DR10, O-9)', () => {
        it('signs the device in, sets the httpOnly SameSite=Strict device cookie once, and lets it re-enter', async () => {
            const { code } = await issueCode();
            const device = request.agent(lan.url);
            const first = await device.post('/edge/auth/room-code').set('User-Agent', 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)').send({ code: `${code.slice(0, 3)}-${code.slice(3)}` });
            expect(first.status).toBe(200);
            expect(first.headers['cache-control']).toBe('no-store');
            expect(first.body).toMatchObject({ msg: 1, status: 'ok', kind: 'room-code', nUserid: PERSON, name: 'Daniel Okafor', untilSessionEnds: true, reentry: false, room: { nSesid: S_LIVE, via: 'room-code' } });
            const cookie = String(first.headers['set-cookie']);
            expect(cookie).toMatch(/^etab_edge_device=[A-Za-z0-9_-]{43};/);
            expect(cookie).toContain('Max-Age=604800');
            expect(cookie).toContain('Path=/');
            expect(cookie).toContain('HttpOnly');
            expect(cookie).toContain('SameSite=Strict');
            expect(cookie).not.toContain('Secure'); // a dev box over plain HTTP
            const again = await device.post('/edge/auth/room-code').send({ code });
            expect(again.body).toMatchObject({ msg: 1, reentry: true });
            expect(again.headers['set-cookie']).toBeUndefined();
            const other = await request(lan.url).post('/edge/auth/room-code').send({ code });
            expectEdgeError(other, 409, 'code_used_elsewhere');
            expect(other.body).toMatchObject({ usedAtMs: NOW, deviceLabel: 'iPad' });
            const me = await request(lan.url).get('/edge/auth/me').set(bearer(again.body.token));
            expect(me.body).toMatchObject({ msg: 1, kind: 'room-code', nUserid: PERSON, isBoxAdmin: false, rooms: [{ nSesid: S_LIVE, via: 'room-code' }] });
        });

        it('wrong / locked / malformed codes are never 401', async () => {
            await issueCode();
            const wrong = await request(lan.url).post('/edge/auth/room-code').send({ code: 'ZZZZZZ' });
            expectEdgeError(wrong, 400, 'code_wrong');
            expect(wrong.body.attemptsLeft).toBe(4);
            for (let i = 0; i < 3; i++) await request(lan.url).post('/edge/auth/room-code').send({ code: 'ZZZZZZ' });
            const locked = await request(lan.url).post('/edge/auth/room-code').send({ code: 'ZZZZZZ' });
            expectEdgeError(locked, 429, 'code_locked');
            expect(locked.body.retryAfterSec).toBe(60);
            expectEdgeError(await request(lan.url).post('/edge/auth/room-code').send({ code: 12 }), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).post('/edge/auth/room-code').send('nonsense'), 400, 'invalid_request');
        });

        it('marks the cookie Secure on a box serving TLS', async () => {
            await lan.close();
            lan = await startLanApp({ state, clock: clock.now, publicDir: dist.publicDir, config: { http: { host: '127.0.0.1', port: 0, tls: { certFile: path.join(dist.root, 'c.pem'), keyFile: path.join(dist.root, 'k.pem') } } } });
            const { code } = await issueCode();
            const res = await request(lan.url).post('/edge/auth/room-code').send({ code });
            expect(String(res.headers['set-cookie'])).toContain('Secure');
        });
    });

    describe('POST /edge/auth/operator-code (DR7)', () => {
        it('wrong codes are 400 code_wrong; malformed ones invalid_request', async () => {
            const res = await request(lan.url).post('/edge/auth/operator-code').send({ code: 'OPR-6Z3K-91' });
            expectEdgeError(res, 400, 'code_wrong');
            expectEdgeError(await request(lan.url).post('/edge/auth/operator-code').send({ code: 'OPR' }), 400, 'invalid_request');
        });
    });

    // ---- sign-in checks on every signed-in route -----------------------------------------------------------------------

    describe('every signed-in route (CONTRACTS.md §2.4)', () => {
        const signedIn = ROUTES.filter(([, def]) => def.auth !== 'none');
        const boxAdmin = ROUTES.filter(([, def]) => def.auth === 'box-admin');

        it('answers 401 unauthenticated without a token or with an unreadable one', async () => {
            for (const [name, def] of signedIn) {
                expectEdgeError(await call(lan, def), 401, 'unauthenticated');
                const res = await call(lan, def).set('Authorization', 'Bearer nope');
                expect([name, res.status, res.body.error]).toEqual([name, 401, 'unauthenticated']);
            }
        });

        it('answers 401 token_expired / token_revoked, and 503 box_not_configured / box_not_linked', async () => {
            const expired = await tokenFor(MEMBER, { iat: NOW_SEC - 13 * 3600, exp: NOW_SEC - 3600, auth_time: NOW_SEC - 14 * 3600 });
            const revoked = await tokenFor(MEMBER, { jti: 'gone' });
            state.revocations.denyJti('gone', NOW + H, 'sign-out', NOW);
            const good = await tokenFor(MEMBER);
            for (const [name, def] of signedIn) {
                expect([name, (await call(lan, def).set(bearer(expired))).body.error]).toEqual([name, 'token_expired']);
                expect([name, (await call(lan, def).set(bearer(revoked))).body.error]).toEqual([name, 'token_revoked']);
            }
            state.jwksRow = null;
            expectEdgeError(await request(lan.url).get('/edge/auth/me').set(bearer(good)), 503, 'box_not_linked');
            state.identityRow = null;
            expectEdgeError(await request(lan.url).get('/edge/local/cases').set(bearer(good)), 503, 'box_not_configured');
        });

        it('refuses non-admins on every box-admin route with 403 not_box_admin (room-code users too)', async () => {
            const member = await tokenFor(MEMBER);
            const { code } = await issueCode();
            const room = (await request(lan.url).post('/edge/auth/room-code').send({ code })).body.token;
            for (const [name, def] of boxAdmin) {
                const res = await call(lan, def).set(bearer(member));
                expect([name, res.status, res.body.error]).toEqual([name, 403, 'not_box_admin']);
                expect([name, (await call(lan, def).set(bearer(room))).body.error]).toEqual([name, 'not_box_admin']);
            }
            expect(lan.ops.calls).toEqual([]);
            expect(lan.kernel.calls).toEqual([]);
        });

        it('a state failure while verifying is a 500 server_error that never leaks the cause and never signs anyone out', async () => {
            const good = await tokenFor(MEMBER);
            state.failReads = new Error('SQLITE_IOERR: disk I/O error at /var/lib/etabella-edge/edge.sqlite');
            const res = await request(lan.url).get('/edge/auth/me').set(bearer(good));
            expectEdgeError(res, 500, 'server_error');
            expect(res.body.message).toBe('internal error');
        });
    });

    // ---- me, sign-out ----------------------------------------------------------------------------------------------

    describe('GET /edge/auth/me and POST /edge/auth/sign-out', () => {
        it('me: the identity, renewal plan and rooms; sign-out denylists the token', async () => {
            const token = await tokenFor(ADMIN);
            const me = await request(lan.url).get('/edge/auth/me').set(bearer(token));
            expect(me.status).toBe(200);
            expect(me.body).toMatchObject({ msg: 1, kind: 'online', nUserid: ADMIN, name: 'Priya Shah', isBoxAdmin: true, roomCodeCaseIds: [CASE_A], operator: null, nowMs: NOW });
            expect(me.body.renewal).toMatchObject({ canRenew: true, ceilingAtMs: (NOW_SEC - 3600) * 1000 + 24 * H });
            const out = await request(lan.url).post('/edge/auth/sign-out').set(bearer(token)).send({});
            expect([out.status, out.body]).toEqual([200, { msg: 1 }]);
            expectEdgeError(await request(lan.url).get('/edge/auth/me').set(bearer(token)), 401, 'token_revoked');
        });

        it('operator-code sign-in: me names the operator, the day and the minting admin', async () => {
            const me = await request(lan.url).get('/edge/auth/me').set(bearer(await operatorToken()));
            expect(me.body).toMatchObject({ kind: 'operator', nUserid: null, name: 'Operator', isBoxAdmin: true, operator: { day: '2026-10-01', mintedBy: { nUserid: ADMIN, name: 'Priya Shah' } } });
        });
    });

    // ---- dashboard -----------------------------------------------------------------------------------------------------

    describe('GET /edge/local/cases (D32, DR4, DR8, DR15, DR19)', () => {
        const cases = async (token: string) => (await request(lan.url).get('/edge/local/cases').set(bearer(token))).body;

        it('a case-team member: box cases ∩ their cases, live first, then today-not-started, with session details', async () => {
            const body = await cases(await tokenFor(MEMBER));
            expect(body).toMatchObject({ msg: 1, nowMs: NOW, today: '2026-10-01', timeZone: 'Europe/London', viewer: 'online', scope: 'case-team', emptyReason: null, assignments: { syncedAtMs: NOW - 30 * 60_000, fresh: true } });
            expect(body.cases.map((c: { nCaseid: string; rt: { kind: string } }) => [c.nCaseid, c.rt.kind])).toEqual([
                [CASE_A, 'live'],
                [CASE_B, 'today-not-started'],
            ]);
            const a = body.cases[0];
            expect(a).toMatchObject({ cCasename: 'Harlow v Mercer Logistics', cCaseno: 'HC-2026-001', isCaseAdmin: false, roomAccess: null, rt: { kind: 'live', nSesid: S_LIVE, sessionName: 'Day 3 — Morning', startAtMs: null, rank: 0 } });
            expect(a.sessions.map((s: { nSesid: string }) => s.nSesid)).toEqual([S_ENDED, S_LIVE, S_NEXT]);
            const live = a.sessions[1];
            expect(live).toEqual({
                nSesid: S_LIVE,
                nCaseid: CASE_A,
                cName: 'Day 3 — Morning',
                dStartDt: '2026-10-01 10:00:00',
                tz: 'Europe/London',
                startAtMs: Date.UTC(2026, 9, 1, 9),
                isToday: true,
                phase: 'live',
                localState: 'live',
                firstLineAtMs: Date.UTC(2026, 9, 1, 9, 2),
                lastLineAtMs: NOW - 5000,
                page: 41,
                totalLines: 1018,
                endedAtMs: null,
                nPartNo: 1,
                nPrevPartSesid: null,
                continuedAs: null,
                cloudUrl: `https://cloud.invalid/rt/session/${S_LIVE}`,
            });
            expect(a.sessions[0]).toMatchObject({ phase: 'ended', isToday: false, endedAtMs: Date.UTC(2026, 8, 30, 15, 30) });
            expect(body.cases[1]).toMatchObject({ rt: { kind: 'today-not-started', nSesid: S_B, startAtMs: null, rank: 2 } });
        });

        it('next-today picks the earliest start; a super-admin sees every box case, with "other" for a case without sessions', async () => {
            lan.kernel.views.clear();
            state.patchSession(S_LIVE, { firstLineAtMs: null, localState: 'assigned' });
            const body = await cases(await tokenFor(ADMIN));
            expect(body.cases[0].rt).toEqual({ kind: 'next-today', nSesid: S_LIVE, sessionName: 'Day 3 — Morning', startAtMs: Date.UTC(2026, 9, 1, 9), rank: 1 });
            expect(body.cases[0].isCaseAdmin).toBe(true);
            state.addSuperAdmin({ nUserid: OUTSIDER, name: 'Otto Outsider', email: null });
            const all = await cases(await tokenFor(OUTSIDER, { cases: [CASE_C] }));
            expect(all.cases.map((c: { nCaseid: string; rt: { kind: string } }) => [c.nCaseid, c.rt.kind])).toEqual([
                [CASE_A, 'next-today'],
                [CASE_B, 'today-not-started'],
                [CASE_C, 'other'],
            ]);
            expect(all.cases[2]).toMatchObject({ sessions: [], rt: { nSesid: null, sessionName: null } });
        });

        it('a session assignee sees only that session of the case', async () => {
            const body = await cases(await tokenFor(ASSIGNEE, { cases: [CASE_A] }));
            expect(body.cases.map((c: { sessions: Array<{ nSesid: string }> }) => c.sessions.map(s => s.nSesid))).toEqual([[S_LIVE]]);
        });

        it('a room-code viewer: only the code case, only its session, tagged room access', async () => {
            const { code } = await issueCode();
            const token = (await request(lan.url).post('/edge/auth/room-code').send({ code })).body.token;
            const body = await cases(token);
            expect(body).toMatchObject({ viewer: 'room-code', scope: 'room-code' });
            expect(body.cases).toHaveLength(1);
            expect(body.cases[0]).toMatchObject({ nCaseid: CASE_A, isCaseAdmin: false, roomAccess: { nSesid: S_LIVE, sessionName: 'Day 3 — Morning' } });
            expect(body.cases[0].sessions.map((s: { nSesid: string }) => s.nSesid)).toEqual([S_LIVE]);
        });

        it('an operator sees the minting admin\'s cases', async () => {
            const body = await cases(await operatorToken());
            expect(body).toMatchObject({ viewer: 'operator', scope: 'operator' });
            expect(body.cases.map((c: { nCaseid: string }) => c.nCaseid)).toEqual([CASE_A]);
        });

        it('empty: "no-cases" when the assignments are fresh, "not-on-box-yet" when the box cannot vouch (DR15)', async () => {
            const stranger = await tokenFor(OUTSIDER, { cases: [CASE_C] });
            state.caseRows.delete(CASE_C);
            expect(await cases(stranger)).toMatchObject({ cases: [], emptyReason: 'no-cases', assignments: { fresh: true } });
            state.syncedAt = Date.UTC(2026, 8, 30, 22, 59); // 23:59 yesterday in London
            lan.uplink.online = false;
            expect(await cases(stranger)).toMatchObject({ cases: [], emptyReason: 'not-on-box-yet', assignments: { syncedAtMs: Date.UTC(2026, 8, 30, 22, 59), fresh: false } });
            lan.uplink.online = true;
            expect((await cases(stranger)).emptyReason).toBe('no-cases');
            state.syncedAt = null;
            lan.uplink.online = false;
            expect((await cases(stranger)).emptyReason).toBe('not-on-box-yet');
        });

        it('shows the Part 2 pointer after a split (D7, DR9)', async () => {
            state.patchSession(S_NEXT, { next: { nSesid: '5e550000-0000-4000-8000-0000000000aa', nPartNo: 2, splitAtMs: NOW - 1000 }, cloudOp: 'end' });
            const body = await cases(await tokenFor(ADMIN));
            const next = body.cases[0].sessions.find((s: { nSesid: string }) => s.nSesid === S_NEXT);
            expect(next.continuedAs).toEqual({ nSesid: '5e550000-0000-4000-8000-0000000000aa', nPartNo: 2, cloudUrl: 'https://cloud.invalid/rt/session/5e550000-0000-4000-8000-0000000000aa', splitAtMs: NOW - 1000 });
        });
    });

    it('GET /edge/local/status hands the principal to ops (operator block for box admins only)', async () => {
        const admin = await request(lan.url).get('/edge/local/status').set(bearer(await tokenFor(ADMIN)));
        expect(admin.body).toMatchObject({ msg: 1, heartbeatMs: 5000, staleAfterMs: 15000 });
        expect(admin.body.operator).toBeDefined();
        const member = await request(lan.url).get('/edge/local/status').set(bearer(await tokenFor(MEMBER)));
        expect(member.body.operator).toBeUndefined();
        expect(lan.ops.calls).toEqual(['statusSnapshot:online', 'statusSnapshot:online']);
    });

    // ---- room codes and the operator code ------------------------------------------------------------------------------

    describe('Box settings → Room codes and operator code', () => {
        it('issue, list, picker, revoke, end access and re-issue over HTTP', async () => {
            const admin = bearer(await tokenFor(ADMIN));
            const issued = await request(lan.url).post('/edge/local/room-codes').set(admin).send({ nSesid: S_LIVE, userIds: [PERSON, OUTSIDER] });
            expect(issued.status).toBe(200);
            expect(issued.body).toMatchObject({ msg: 1, nSesid: S_LIVE, sessionName: 'Day 3 — Morning', caseName: 'Harlow v Mercer Logistics' });
            expect(issued.body.results.map((r: { status: string }) => r.status)).toEqual(['issued', 'refused']);
            const id = issued.body.results[0].issued.id;

            const list = await request(lan.url).get(`/edge/local/room-codes?nSesid=${S_LIVE}`).set(admin);
            expect(list.body).toMatchObject({ msg: 1, unusedCount: 1, rows: [{ id, status: 'unused', can: { revoke: true, endAccess: false, reissue: true } }] });
            expect(JSON.stringify(list.body)).not.toContain(issued.body.results[0].issued.code);
            expectEdgeError(await request(lan.url).get('/edge/local/room-codes?nSesid=a&nSesid=b').set(admin), 400, 'invalid_request');

            const picker = await request(lan.url).get('/edge/local/room-codes/picker').set(admin);
            expect(picker.body).toMatchObject({ msg: 1, operatorNameRequired: false });
            expect(picker.body.sessions.map((s: { nSesid: string }) => s.nSesid)).toEqual([S_LIVE, S_NEXT, S_ENDED]);

            const reissued = await request(lan.url).post(`/edge/local/room-codes/${id}/reissue`).set(admin).send({});
            expect(reissued.body).toMatchObject({ msg: 1, row: { id, status: 'revoked' }, issued: { replacedId: id } });
            const fresh = reissued.body.issued;
            const redeemed = await request(lan.url).post('/edge/auth/room-code').send({ code: fresh.code });
            expect(redeemed.status).toBe(200);
            expectEdgeError(await request(lan.url).post(`/edge/local/room-codes/${fresh.id}/revoke`).set(admin).send({}), 409, 'code_already_used');
            const ended = await request(lan.url).post(`/edge/local/room-codes/${fresh.id}/end-access`).set(admin).send({});
            expect(ended.body).toMatchObject({ msg: 1, row: { id: fresh.id, status: 'ended' } });
            expectEdgeError(await request(lan.url).get('/edge/auth/me').set(bearer(redeemed.body.token)), 401, 'token_revoked');
            expectEdgeError(await request(lan.url).post(`/edge/local/room-codes/${id}/end-access`).set(admin).send({}), 409, 'code_not_used');
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes/nope/revoke').set(admin).send({}), 404, 'not_found');
        });

        it('issue refusals keep their HTTP statuses', async () => {
            const admin = bearer(await tokenFor(ADMIN));
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes').set(admin).send({ nSesid: S_LIVE, userIds: [] }), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes').set(admin).send({ nSesid: '5e550000-0000-4000-8000-0000000000ff', userIds: [PERSON] }), 404, 'session_not_found');
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes').set(admin).send({ nSesid: S_ENDED, userIds: [PERSON] }), 409, 'session_ended');
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes').set(bearer(await operatorToken())).send({ nSesid: S_LIVE, userIds: [PERSON] }), 400, 'operator_name_required');
            const adminOfB = bearer(await tokenFor(MEMBER));
            state.rosterRows = state.rosterRows.map(m => (m.nUserid === MEMBER && m.nCaseid === CASE_B ? { ...m, isCaseAdmin: true } : m));
            expectEdgeError(await request(lan.url).post('/edge/local/room-codes').set(adminOfB).send({ nSesid: S_LIVE, userIds: [PERSON] }), 403, 'not_case_admin');
            expect(S_B).toBeTruthy();
        });

        it('operator code: status for box admins; issue relays for an online case admin only', async () => {
            const admin = bearer(await tokenFor(ADMIN));
            const status = await request(lan.url).get('/edge/local/operator-code').set(admin);
            expect(status.body).toEqual({ msg: 1, day: '2026-10-01', issued: false, issuedAtMs: null, mintedBy: null, validUntilMs: null, usesToday: 0 });
            lan.uplink.relayReply = async () => ({ code: 'OPR6Z3K91', day: '2026-10-01', validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999), mintedBy: { nUserid: ADMIN, name: 'Priya Shah' }, replacedEarlier: false });
            const issued = await request(lan.url).post('/edge/local/operator-code/issue').set(admin).send({});
            expect(issued.body).toEqual({ msg: 1, code: 'OPR6Z3K91', display: 'OPR-6Z3K-91', day: '2026-10-01', validUntilMs: Date.UTC(2026, 9, 1, 22, 59, 59, 999), mintedBy: { nUserid: ADMIN, name: 'Priya Shah' }, replacedEarlier: false });
            lan.uplink.relayReply = async () => {
                throw new EdgePortError('offline', 'no internet', { offline: true });
            };
            const offline = await request(lan.url).post('/edge/local/operator-code/issue').set(admin).send({});
            expectEdgeError(offline, 503, 'offline');
            expect(offline.body.offline).toBe(true);
            expectEdgeError(await request(lan.url).post('/edge/local/operator-code/issue').set(bearer(await operatorToken())).send({}), 403, 'online_sign_in_required');
            expectEdgeError(await request(lan.url).post('/edge/local/operator-code/issue').set(bearer(await tokenFor(MEMBER))).send({}), 403, 'not_case_admin');
        });
    });

    // ---- status & troubleshooting, transmitter --------------------------------------------------------------------------

    describe('Box settings → Status & troubleshooting and Transmitter (box admins)', () => {
        it('every ops read and run answers msg:1 from the ports', async () => {
            const op = bearer(await operatorToken());
            for (const def of [EDGE_ROUTES.readiness, EDGE_ROUTES.readinessRun, EDGE_ROUTES.verdict, EDGE_ROUTES.network, EDGE_ROUTES.networkRun, EDGE_ROUTES.boxDetails, EDGE_ROUTES.transmitter]) {
                const res = await call(lan, def).set(op);
                expect([def.path, res.status, res.body.msg, res.headers['cache-control']]).toEqual([def.path, 200, 1, 'no-store']);
            }
            const dismissed = await request(lan.url).post('/edge/local/ops/verdict/recoveries/rec-1/dismiss').set(op).send({});
            expect(dismissed.body).toEqual({ msg: 1 });
            expect(lan.ops.calls).toEqual(['readiness', 'runReadiness:operator', 'readiness', 'verdict', 'network', 'runNetwork:operator', 'network', 'boxDetails', 'dismissRecovery:rec-1']);
        });

        it('passes the Connectivity Log query and refuses malformed ones', async () => {
            const op = bearer(await operatorToken());
            const res = await request(lan.url).get('/edge/local/ops/log?filter=problems&day=2026-10-01&q=refused&before=c1&limit=20').set(op);
            expect(res.body).toMatchObject({ msg: 1, rows: [] });
            expect(lan.ops.calls.pop()).toBe('connectivityLog:{"filter":"problems","day":"2026-10-01","q":"refused","before":"c1","limit":20}');
            await request(lan.url).get('/edge/local/ops/log?after=c9').set(op);
            expect(lan.ops.calls.pop()).toBe('connectivityLog:{"after":"c9"}');
            expectEdgeError(await request(lan.url).get('/edge/local/ops/log?filter=everything').set(op), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).get('/edge/local/ops/log?limit=ten').set(op), 400, 'invalid_request');
            expectEdgeError(await request(lan.url).get('/edge/local/ops/log?q=a&q=b').set(op), 400, 'invalid_request');
            const tries = await request(lan.url).get('/edge/local/ops/log/row%201/tries?before=t5&limit=10').set(op);
            expect(tries.body).toEqual({ msg: 1, rowId: 'row 1', rows: [], nextBefore: null });
            expect(lan.ops.calls.pop()).toBe('connectivityLogTries:["row 1","t5",10]');
        });

        it('diagnostics is a zip file with its name, never cached', async () => {
            const res = await request(lan.url).get('/edge/local/ops/diagnostics').set(bearer(await tokenFor(ADMIN))).buffer(true).parse((r, done) => {
                const chunks: Buffer[] = [];
                r.on('data', (c: Buffer) => chunks.push(c));
                r.on('end', () => done(null, Buffer.concat(chunks)));
            });
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toBe('application/zip');
            expect(res.headers['content-disposition']).toBe('attachment; filename="etabella-box-VB-014-20261001-1030.zip"');
            expect(res.headers['cache-control']).toBe('no-store');
            expect((res.body as Buffer).toString()).toBe('PK\u0003\u0004zip-bytes');
        });

        // The transmitter rules (DR13 order, guard, buttons) are ops' TransmitterControl and tested there; this only pins
        // that the LAN mounts the routes in front of it, box-admin only, with the actor and the contract envelope.
        it("transmitter writes reach the kernel through ops' TransmitterControl with the actor, in the contract envelope", async () => {
            const admin = bearer(await tokenFor(ADMIN));
            const actor = { nUserid: ADMIN, name: 'Priya Shah', via: 'online', operatorName: null };
            const settings = { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };
            const applied = await request(lan.url).put('/edge/local/ops/transmitter').set(admin).send({ stateVersion: 3, settings, confirmInterrupt: false });
            expect([applied.status, applied.body.msg, applied.headers['cache-control']]).toEqual([200, 1, 'no-store']);
            expect(lan.kernel.calls.pop()).toBe(`applyTransmitter:${JSON.stringify({ req: { stateVersion: 3, settings, confirmInterrupt: false }, actor })}`);
            expectEdgeError(await request(lan.url).put('/edge/local/ops/transmitter').set(admin).send({ settings }), 400, 'invalid_request');
        });

        it('reporter card is served for a box admin; a malformed body is invalid_request', async () => {
            const admin = bearer(await tokenFor(ADMIN));
            const card = await request(lan.url).post('/edge/local/ops/reporter-card').set(admin).send({ nSesid: S_LIVE });
            expect(card.body).toMatchObject({ msg: 1, nSesid: S_LIVE, password: null, passwordSource: 'rt-production' });
            expectEdgeError(await request(lan.url).post('/edge/local/ops/reporter-card').set(admin).send({}), 400, 'invalid_request');
        });
    });

    describe('per-box switches and LAN metrics', () => {
        const ROOM_CODE_ROUTES = ['roomCodeRedeem', 'roomCodes', 'roomCodePicker', 'roomCodesIssue', 'roomCodeRevoke', 'roomCodeEndAccess', 'roomCodeReissue'] as const;
        const OPERATOR_ROUTES = ['operatorCodeSignIn', 'operatorCode', 'operatorCodeIssue'] as const;
        const expectFeatureDisabled = (res: request.Response, label: string): void => {
            expect([label, res.status, res.body]).toEqual([label, 404, { msg: -1, error: 'feature_disabled', message: expect.any(String) }]);
            expect(res.headers['cache-control']).toBe('no-store');
        };

        it('with one code sign-in switched off, only its routes answer 404 feature_disabled, before any sign-in check', async () => {
            await lan.close();
            lan = await startLanApp({ state, clock: clock.now, publicDir: dist.publicDir, config: { features: { roomCodes: false, operatorCode: true } } });
            const admin = bearer(await tokenFor(ADMIN));
            for (const name of ROOM_CODE_ROUTES) {
                const def = EDGE_ROUTES[name];
                expectFeatureDisabled(await call(lan, def), `${name} without a token`);
                expectFeatureDisabled(await call(lan, def).set('Authorization', 'Bearer garbage'), `${name} with garbage`);
                expectFeatureDisabled(await call(lan, def).set(admin), `${name} as a case admin`);
            }
            // the operator code still works on this box
            expect((await request(lan.url).get('/edge/local/operator-code').set(admin)).body).toMatchObject({ msg: 1, issued: false });
            expectEdgeError(await request(lan.url).post('/edge/auth/operator-code').send({ code: 'OPR-6Z3K-91' }), 400, 'code_wrong');
            expect((await request(lan.url).get('/edge/auth/me').set(admin)).body).toMatchObject({ isBoxAdmin: true, roomCodeCaseIds: [] });
            expect((await request(lan.url).get('/edge-config.json')).body.features).toMatchObject({ roomCodes: false, operatorCode: true });
            expect(state.audited('room-code-redeem')).toEqual([]);
            expect(state.roomCodeRows.size).toBe(0);
        });

        it('with the operator code switched off, its three routes answer feature_disabled; room codes keep working', async () => {
            await lan.close();
            lan = await startLanApp({ state, clock: clock.now, publicDir: dist.publicDir, config: { features: { roomCodes: true, operatorCode: false } } });
            const admin = bearer(await tokenFor(ADMIN));
            for (const name of OPERATOR_ROUTES) {
                expectFeatureDisabled(await call(lan, EDGE_ROUTES[name]), `${name} without a token`);
                expectFeatureDisabled(await call(lan, EDGE_ROUTES[name]).set(admin), `${name} as a case admin`);
            }
            expect(lan.uplink.relayed).toEqual([]);
            expect((await request(lan.url).get('/edge/local/room-codes').set(admin)).body).toMatchObject({ msg: 1, rows: [] });
            // an operator token minted while the code was on is no longer a sign-in
            expectEdgeError(await request(lan.url).get('/edge/auth/me').set(bearer(await operatorToken())), 401, 'unauthenticated');
            expect(state.audited('operator-code-sign-in')).toEqual([]);
        });

        it('GET /edge/local/metrics: Prometheus text for box admins, never cached', async () => {
            expectEdgeError(await request(lan.url).get('/edge/local/metrics'), 401, 'unauthenticated');
            expectEdgeError(await request(lan.url).get('/edge/local/metrics').set(bearer(await tokenFor(MEMBER))), 403, 'not_box_admin');
            const res = await request(lan.url).get('/edge/local/metrics').set(bearer(await operatorToken()));
            expect([res.status, res.headers['content-type'], res.headers['cache-control']]).toEqual([200, 'text/plain; version=0.0.4; charset=utf-8', 'no-store']);
            expect(res.text).toBe('# TYPE rt_edge_lan_viewers gauge\nrt_edge_lan_viewers 0\n');
        });
    });

    // ---- unknown routes, the FE bundle ----------------------------------------------------------------------------------

    describe('unknown routes', () => {
        it('answer a contract 404, no-store, for unknown /edge paths and methods', async () => {
            expectEdgeError(await request(lan.url).get('/edge/not-a-route'), 404, 'not_found');
            expectEdgeError(await request(lan.url).get('/edge/x'), 404, 'not_found');
            expectEdgeError(await request(lan.url).delete('/edge/auth/me'), 404, 'not_found');
        });

        it('a cloud route the box does not serve answers 403 use_cloud {useCloud:true}, any method, never the app HTML (§8.2)', async () => {
            const member = bearer(await tokenFor(MEMBER));
            const attempts: Array<[string, string]> = [
                ['get', '/realtimeapi/session/eclipse/credential?nSesid=1'],
                ['post', '/realtimeapi/session/eclipse'],
                ['post', '/realtimeapi/session/sessionend'],
                ['post', '/realtimeapi/session/edge/split'],
                ['get', '/realtimeapi/transcript/files'],
                ['get', '/realtimeapi'],
                ['get', '/coreapi/case/caseinfo?nCaseid=1'],
                ['post', '/uploadapi/upload'],
                ['get', '/authapi/user/me'],
                ['get', '/downloadapi/job/1'],
                ['get', '/download/x'],
                ['put', '/export/x'],
                ['get', '/indexapi/x'],
                ['get', '/elasticsearch/x'],
                ['get', '/presentation/x'],
            ];
            for (const [method, url] of attempts) {
                const res = await (request(lan.url) as unknown as Record<string, (u: string) => request.Test>)[method](url).set(member);
                expect([method, url, res.status, res.body]).toEqual([method, url, 403, { msg: -1, error: 'use_cloud', message: expect.any(String), useCloud: true }]);
                expect(res.headers['cache-control']).toBe('no-store');
            }
            // a path that merely starts with a cloud base name is an app route (SPA fallback)
            const app = await request(lan.url).get('/coreapix');
            expect([app.status, app.headers['content-type']]).toEqual([200, 'text/html; charset=utf-8']);
        });
    });

    describe('the FE edge bundle (D23, spec §8.1)', () => {
        it('serves index.html at / and for app routes (SPA fallback), never cached, framed only by itself', async () => {
            // `/auth/callback` is the FE's PKCE return page (CONTRACTS.md §6.1): the box serves the app and never reads
            // the code, state or error itself (the FE exchanges the code with authapi; DR22 reasons are FE-side).
            for (const url of ['/', '/index.html', '/auth/callback?code=c&state=s', '/auth/callback?error=cancelled&state=s', '/rt/session/123', '/dashboard/']) {
                const res = await request(lan.url).get(url);
                expect([url, res.status, res.headers['content-type']]).toEqual([url, 200, 'text/html; charset=utf-8']);
                expect(res.text).toContain('<app-root>');
                expect(res.headers['cache-control']).toBe('no-cache');
                expect(res.headers['x-content-type-options']).toBe('nosniff');
                expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
            }
        });

        it('serves hashed bundles immutable and gzipped, other assets for an hour, with exact MIME types', async () => {
            const js = await request(lan.url).get('/main-ABCD1234.js').set('Accept-Encoding', 'gzip');
            expect(js.status).toBe(200);
            expect(js.headers['content-type']).toBe('text/javascript; charset=utf-8');
            expect(js.headers['content-encoding']).toBe('gzip');
            expect(js.headers['cache-control']).toBe('public, max-age=31536000, immutable');
            expect(js.headers.vary).toBe('Accept-Encoding');
            expect(js.text).toBe(dist.mainJs);
            const plain = await request(lan.url).get('/main-ABCD1234.js').set('Accept-Encoding', 'identity');
            expect(plain.headers['content-encoding']).toBeUndefined();
            expect(Number(plain.headers['content-length'])).toBe(Buffer.byteLength(dist.mainJs));
            const refused = await request(lan.url).get('/main-ABCD1234.js').set('Accept-Encoding', 'gzip;q=0');
            expect(refused.headers['content-encoding']).toBeUndefined();
            const font = await request(lan.url).get('/assets/fonts/inter.woff2');
            expect([font.headers['content-type'], font.headers['cache-control']]).toEqual(['font/woff2', 'public, max-age=3600']);
            const css = await request(lan.url).get('/styles-ZZZZ9999.css');
            expect([css.headers['content-type'], css.headers['content-encoding']]).toEqual(['text/css; charset=utf-8', undefined]); // under 1 KiB: not worth it
        });

        it('answers If-None-Match with 304 and HEAD without a body', async () => {
            const first = await request(lan.url).get('/main-ABCD1234.js');
            const etag = first.headers.etag;
            expect(etag).toMatch(/^W\/"/);
            expect((await request(lan.url).get('/main-ABCD1234.js').set('If-None-Match', etag)).status).toBe(304);
            const head = await request(lan.url).head('/favicon.ico');
            expect([head.status, head.headers['content-type'], head.headers['content-length']]).toEqual([200, 'image/x-icon', '4']);
        });

        it('a missing asset with an extension is a 404 (a stale chunk never loads HTML as JavaScript)', async () => {
            expectEdgeError(await request(lan.url).get('/chunk-NOPE1234.js'), 404, 'not_found');
        });

        it('refuses traversal, dot-files and odd escapes; nothing outside the public directory is ever served', async () => {
            const attempts = [
                '/../outside.txt',
                '/..%2foutside.txt',
                '/%2e%2e%2foutside.txt',
                '/assets/..%2f..%2foutside.txt',
                '/assets/%2e%2e/%2e%2e/outside.txt',
                '/..%5coutside.txt',
                '/assets%5c..%5c..%5coutside.txt',
                '/.env',
                '/%2eenv',
                '/assets/./fonts/inter.woff2%00.html',
                '/C:%5cWindows%5cwin.ini',
                '//outside.txt',
            ];
            for (const rawPath of attempts) {
                const res = await rawGet(lan.port, rawPath);
                expect([rawPath, res.body.includes('outside the public dir'), res.body.includes('SECRET')]).toEqual([rawPath, false, false]);
                expect([rawPath, res.status === 404 || res.status === 400 || res.headers['content-type'] === 'text/html; charset=utf-8']).toEqual([rawPath, true]);
            }
            const bad = await rawGet(lan.port, '/%E0%A4%A');
            expect(bad.status).toBe(400);
            expect(JSON.parse(bad.body)).toMatchObject({ msg: -1, error: 'invalid_request' });
        });

        it('never follows a symlink out of the public directory', async () => {
            const link = path.join(dist.publicDir, 'escape.txt');
            try {
                fs.symlinkSync(path.join(dist.root, 'outside.txt'), link, 'file');
            } catch {
                return; // symlinks need extra rights on this host (Windows without developer mode): nothing to prove
            }
            try {
                const res = await rawGet(lan.port, '/escape.txt');
                expect(res.body).not.toContain('outside the public dir');
                expectEdgeError({ status: res.status, body: JSON.parse(res.body), headers: res.headers } as unknown as request.Response, 404, 'not_found');
            } finally {
                fs.rmSync(link, { force: true });
            }
        });

        it('serves only GET and HEAD, and nothing when the bundle is missing', async () => {
            expectEdgeError(await request(lan.url).post('/').send({}), 404, 'not_found');
            await lan.close();
            lan = await startLanApp({ state, clock: clock.now, publicDir: path.join(dist.root, 'no-such-dir') });
            expectEdgeError(await request(lan.url).get('/'), 404, 'not_found');
        });
    });

    it('a device cookie set by the box is read back from the Cookie header (sha256 stored only)', async () => {
        const { code, id } = await issueCode();
        const res = await request(lan.url).post('/edge/auth/room-code').set('Cookie', 'other=1; etab_edge_device=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').send({ code });
        expect(res.headers['set-cookie']).toBeUndefined();
        expect(state.roomCodes.get(id).deviceHash).toBe(createHash('sha256').update('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA').digest('hex'));
    });
});
