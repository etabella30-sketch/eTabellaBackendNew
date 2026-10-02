/**
 * The box as v1 ships it (build decision 2026-10-01 "email sign-in only for v1", DR23): room codes and the operator
 * code switched OFF (box-config.ts defaults). The online email sign-in (PKCE on etabella.net, verified offline with the
 * cached cloud keys) is then the only way in, on HTTP and on the LAN socket.
 */
import { EdgeBoxTokenSigner } from '@app/edge-token';
import * as request from 'supertest';
import { io, Socket as ClientSocket } from 'socket.io-client';

import { endOfBoxDayMs } from '../auth/box-time';
import { FakeState } from '../auth/testing/fake-state';
import { ADMIN, BOX, CASE_A, cloudKeys, CloudKeys, edgeWorld, H, MEMBER, NOW, NOW_SEC, onlineToken, PERSON, S_LIVE, SpecClock } from '../auth/testing/edge-world';
import { EDGE_ROUTES, edgePath, EdgeRouteDef, EdgeRouteName, edgeSignInFailureReason, isEdgeErrorBody } from '../contracts';
import { LanGateway } from './lan.gateway';
import { LanApp, makePublicDir, startLanApp } from './testing/lan-test-kit';

const CODE_ROUTES: readonly EdgeRouteName[] = [
    'roomCodeRedeem',
    'operatorCodeSignIn',
    'roomCodes',
    'roomCodePicker',
    'roomCodesIssue',
    'roomCodeRevoke',
    'roomCodeEndAccess',
    'roomCodeReissue',
    'operatorCode',
    'operatorCodeIssue',
];

const STATE = 'state-0123456789abcdef';
const CHALLENGE = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

describe('rt-edge as shipped: email sign-in only (DR23)', () => {
    let cloud: CloudKeys;
    let dist: ReturnType<typeof makePublicDir>;
    let state: FakeState;
    let clock: SpecClock;
    let lan: LanApp;
    let clients: ClientSocket[];

    beforeAll(async () => {
        cloud = await cloudKeys();
        dist = makePublicDir();
    });

    afterAll(() => dist.cleanup());

    beforeEach(async () => {
        state = edgeWorld(cloud.keys);
        clock = new SpecClock();
        lan = await startLanApp({ state, clock: clock.now, publicDir: dist.publicDir, shippedFeatures: true });
        await lan.lan.start();
        clients = [];
    });

    afterEach(async () => {
        for (const c of clients) c.disconnect();
        await lan.close();
    });

    const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });
    const tokenFor = (sub: string, over: Record<string, unknown> = {}) => onlineToken(cloud, { sub, ...over });
    const signer = () => EdgeBoxTokenSigner.create(BOX, state.identity.secret('box-token-signing'));
    const call = (def: EdgeRouteDef): request.Test => {
        const url = def.path.includes(':id') ? edgePath(def.path, { id: 'x1' }) : def.path;
        const agent = request(lan.url);
        if (def.method === 'GET') return agent.get(url);
        if (def.method === 'PUT') return agent.put(url).send({});
        return agent.post(url).send(def === EDGE_ROUTES.roomCodeRedeem ? { code: 'K7Q4M2' } : def === EDGE_ROUTES.operatorCodeSignIn ? { code: 'OPR6Z3K91' } : {});
    };

    function client(token: unknown): ClientSocket {
        const socket = io(lan.url, { path: '/socket.io', transports: ['websocket'], auth: { token }, reconnection: false, forceNew: true });
        clients.push(socket);
        return socket;
    }
    const connect = (token: unknown): Promise<ClientSocket> =>
        new Promise((resolve, reject) => {
            const socket = client(token);
            socket.once('connect', () => resolve(socket));
            socket.once('connect_error', reject);
        });
    const refusal = (token: unknown): Promise<Error & { data?: { error: string; status: number } }> =>
        new Promise((resolve, reject) => {
            const socket = client(token);
            socket.once('connect', () => reject(new Error('expected the handshake to be refused')));
            socket.once('connect_error', err => resolve(err as Error & { data?: { error: string; status: number } }));
        });
    const next = <T = unknown>(socket: ClientSocket, event: string, timeoutMs = 3000): Promise<T> =>
        new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error(`no '${event}' within ${timeoutMs} ms`)), timeoutMs);
            socket.once(event, (payload: T) => {
                clearTimeout(timer);
                resolve(payload);
            });
        });
    const disconnected = (socket: ClientSocket): Promise<string> => new Promise(resolve => socket.once('disconnect', reason => resolve(reason)));

    it('/edge-config.json tells the FE both code sign-ins are off (no room-code entry, no operator code)', async () => {
        const res = await request(lan.url).get('/edge-config.json');
        expect(res.status).toBe(200);
        expect(res.body.features).toEqual({ roomCodes: false, operatorCode: false, transmitterDialMode: true, offlineMarks: false, reporterPasswordOnBox: false, documentsOnBox: false });
    });

    it('every room-code and operator-code route answers 404 feature_disabled — without a token, with a bad one, as a case admin — and does nothing', async () => {
        const admin = await tokenFor(ADMIN);
        for (const name of CODE_ROUTES) {
            const def = EDGE_ROUTES[name];
            for (const [who, auth] of [['no token', null], ['bad token', 'garbage'], ['case admin', admin]] as const) {
                const res = auth ? await call(def).set(bearer(auth)) : await call(def);
                expect([name, who, res.status, res.body]).toEqual([name, who, 404, { msg: -1, error: 'feature_disabled', message: expect.any(String) }]);
                expect(res.headers['cache-control']).toBe('no-store');
                expect(res.headers['set-cookie']).toBeUndefined();
                // `feature_disabled` is a contract error code (404), so the FE recognises it.
                expect(isEdgeErrorBody(res.body)).toBe(true);
            }
        }
        expect(state.auditRows.filter(r => r.action !== 'sign-in-start')).toEqual([]);
        expect(state.roomCodeRows.size).toBe(0);
        expect(state.operatorCodeRows.size).toBe(0);
        expect(lan.uplink.relayed).toEqual([]);
    });

    it('the email sign-in is the way in: start → etabella.net authorize URL; its token opens me, the dashboard, the status and the LAN socket', async () => {
        const start = await request(lan.url).post('/edge/auth/sign-in/start').send({ email: 'priya@firm.example', state: STATE, codeChallenge: CHALLENGE, codeChallengeMethod: 'S256' });
        expect(start.status).toBe(200);
        const url = new URL(start.body.authorizeUrl);
        expect(`${url.origin}${url.pathname}`).toBe('https://cloud.invalid/auth/edge');
        expect(Object.fromEntries(url.searchParams)).toEqual({ edge: BOX, state: STATE, cc: CHALLENGE, login_hint: 'priya@firm.example' });
        expect(state.audited('sign-in-start')).toEqual([expect.objectContaining({ outcome: 'ok', data: { emailDigest: expect.stringMatching(/^[0-9a-f]{64}$/) } })]);
        expect(JSON.stringify(state.auditRows)).not.toContain('priya@firm.example');

        // The FE exchanged the code with authapi (edge/token) and holds the ES256 edge token; the box checks it offline.
        const token = await tokenFor(ADMIN);
        const me = await request(lan.url).get('/edge/auth/me').set(bearer(token));
        expect(me.status).toBe(200);
        expect(me.body).toMatchObject({ msg: 1, kind: 'online', nUserid: ADMIN, name: 'Priya Shah', isBoxAdmin: true, roomCodeCaseIds: [], operator: null, untilSessionEnds: false });
        expect(me.body.renewal).toMatchObject({ canRenew: true, silentRefreshFromMs: me.body.validUntilMs - 2 * H });
        const cases = await request(lan.url).get('/edge/local/cases').set(bearer(token));
        expect(cases.body).toMatchObject({ msg: 1, viewer: 'online', scope: 'case-team', emptyReason: null });
        expect(cases.body.cases.map((c: { nCaseid: string }) => c.nCaseid)).toEqual([CASE_A]);
        expect((await request(lan.url).get('/edge/local/status').set(bearer(token))).status).toBe(200);

        const socket = await connect(token);
        const status = next<{ nSesid: string }>(socket, 'edge-status');
        socket.emit('join-room', { room: `S${S_LIVE}`, nSesid: S_LIVE });
        expect((await status).nSesid).toBe(S_LIVE);
        const end = next(socket, 'previous-data-end');
        socket.emit('fetch-data', { nSesid: S_LIVE, tab: 1 });
        expect(await end).toEqual({ nSesid: S_LIVE, tab: 1 });

        const gone = disconnected(socket);
        expect((await request(lan.url).post('/edge/auth/sign-out').set(bearer(token)).send({})).body).toEqual({ msg: 1 });
        expect(await gone).toBe('io server disconnect');
        expect((await request(lan.url).get('/edge/auth/me').set(bearer(token))).body.error).toBe('token_revoked');
    });

    it('a box-signed token (room code, operator) is not a sign-in here: 401 unauthenticated on HTTP, unauthorized on the socket', async () => {
        const room = (await signer().mintRoomToken({ nUserid: PERSON, nSesid: S_LIVE, mintedBy: ADMIN, nowMs: NOW - 60_000 })).token;
        const operator = (await signer().mintOperatorToken({ day: '2026-10-01', mintedBy: ADMIN, nowMs: NOW - 60_000, validUntilMs: endOfBoxDayMs('2026-10-01', 'Europe/London') })).token;
        for (const token of [room, operator]) {
            for (const path of ['/edge/auth/me', '/edge/local/cases', '/edge/local/status', '/edge/local/ops/readiness']) {
                const res = await request(lan.url).get(path).set(bearer(token));
                expect([path, res.status, res.body.error]).toEqual([path, 401, 'unauthenticated']);
            }
            const err = await refusal(token);
            expect([err.message, err.data]).toEqual(['unauthorized', { error: 'unauthenticated', status: 401 }]);
        }
    });

    it('the PKCE return page is the app (the FE exchanges the code and words the DR22 reasons); the box never reads the query', async () => {
        for (const [error, reason] of [['cancelled', 'cancelled'], ['network', 'internet-dropped'], ['code_expired', 'link-expired'], ['state_mismatch', 'link-expired'], ['no_box_cases', 'no-access'], ['weird', 'unknown']] as const) {
            const res = await request(lan.url).get(`/auth/callback?error=${error}&state=${STATE}`);
            expect([error, res.status, res.headers['content-type']]).toEqual([error, 200, 'text/html; charset=utf-8']);
            expect(edgeSignInFailureReason(error)).toBe(reason);
        }
        expect(state.auditRows).toEqual([]);
    });

    describe('renewal and expiry (DR11, D24, D28, O-13)', () => {
        it('a silently refreshed token (new jti, same auth_time) works; signing out with it also closes the socket opened with the earlier one', async () => {
            const authTime = NOW_SEC - 10 * 3600;
            const first = await tokenFor(MEMBER, { jti: 'lineage-1', iat: NOW_SEC - 9 * 3600, exp: NOW_SEC + 3 * 3600, auth_time: authTime });
            const renewed = await tokenFor(MEMBER, { jti: 'lineage-2', iat: NOW_SEC - 60, exp: NOW_SEC - 60 + 12 * 3600, auth_time: authTime });
            const elsewhere = await tokenFor(MEMBER, { jti: 'other-device', auth_time: NOW_SEC - 3600 });
            const old = await connect(first);
            const other = await connect(elsewhere);
            const me = await request(lan.url).get('/edge/auth/me').set(bearer(renewed));
            expect(me.body).toMatchObject({ kind: 'online', validUntilMs: (NOW_SEC - 60 + 12 * 3600) * 1000 });
            expect(me.body.renewal).toMatchObject({ authTimeMs: authTime * 1000, ceilingAtMs: authTime * 1000 + 24 * H, canRenew: true });
            const gone = disconnected(old);
            await request(lan.url).post('/edge/auth/sign-out').set(bearer(renewed)).send({});
            expect(await gone).toBe('io server disconnect');
            await sleep(50);
            expect(other.connected).toBe(true);
            expect(lan.app.get(LanGateway).closeSignIn({ kind: 'online', jti: 'none', userId: MEMBER, authTime: 0 } as never)).toBe(0);
        });

        it('expiry: accepted up to 5 min past exp (box clock skew), then 401 token_expired — the FE signs in again by email', async () => {
            const token = await tokenFor(MEMBER, { iat: NOW_SEC - 3600, exp: NOW_SEC, auth_time: NOW_SEC - 3600 });
            clock.nowMs = NOW + 299_000;
            expect((await request(lan.url).get('/edge/auth/me').set(bearer(token))).status).toBe(200);
            clock.nowMs = NOW + 300_000;
            const res = await request(lan.url).get('/edge/auth/me').set(bearer(token));
            expect([res.status, res.body.error]).toEqual([401, 'token_expired']);
            expect((await refusal(token)).data).toEqual({ error: 'token_expired', status: 401 });
        });

        it('the 24 h ceiling (D24): a token reaching past auth_time + 24 h is refused, canRenew turns false near it, and an open socket closes at it', async () => {
            const authTime = NOW_SEC - 23 * 3600;
            const past = await tokenFor(MEMBER, { iat: NOW_SEC - 60, exp: authTime + 24 * 3600 + 60, auth_time: authTime });
            expect((await request(lan.url).get('/edge/auth/me').set(bearer(past))).body.error).toBe('unauthenticated');
            const last = await tokenFor(MEMBER, { iat: NOW_SEC - 60, exp: authTime + 24 * 3600 - 30, auth_time: authTime });
            const me = await request(lan.url).get('/edge/auth/me').set(bearer(last));
            expect(me.body.renewal).toMatchObject({ canRenew: false, ceilingAtMs: (authTime + 24 * 3600) * 1000 });
            const socket = await connect(last);
            const gone = disconnected(socket);
            clock.nowMs = (authTime + 24 * 3600) * 1000 + 300_000; // ceiling + box clock skew
            lan.app.get(LanGateway).heartbeatTick();
            expect(await gone).toBe('io server disconnect');
        });
    });

    it('offline: a held sign-in keeps working (cloud keys cached); with no cached keys it is 503 box_not_linked, never a sign-out', async () => {
        lan.uplink.internetStatus = { state: 'down', sinceMs: NOW - 10 * 60_000 };
        lan.uplink.online = false;
        const token = await tokenFor(MEMBER);
        expect((await request(lan.url).get('/edge/auth/me').set(bearer(token))).status).toBe(200);
        // the device has its own route to etabella.net: the box still builds the authorize URL while offline itself
        expect((await request(lan.url).post('/edge/auth/sign-in/start').send({ email: 'ann@firm.example', state: STATE, codeChallenge: CHALLENGE, codeChallengeMethod: 'S256' })).status).toBe(200);
        expect((await request(lan.url).get('/edge/ping')).body).toMatchObject({ internet: { state: 'down' }, cloudLinked: true });
        state.jwksRow = null;
        const res = await request(lan.url).get('/edge/auth/me').set(bearer(token));
        expect([res.status, res.body.error]).toEqual([503, 'box_not_linked']);
    });

    it('a cloud user revocation refuses the token and closes the sockets it covers', async () => {
        const token = await tokenFor(MEMBER, { iat: NOW_SEC - 600 });
        const socket = await connect(token);
        state.revocations.revokeUser(MEMBER, NOW);
        const gone = disconnected(socket);
        lan.bus.publish('access-revoked', { jtis: [], userIds: [MEMBER], reason: 'cloud-revocation', atMs: NOW });
        expect(await gone).toBe('io server disconnect');
        expect((await request(lan.url).get('/edge/auth/me').set(bearer(token))).body.error).toBe('token_revoked');
    });
});
