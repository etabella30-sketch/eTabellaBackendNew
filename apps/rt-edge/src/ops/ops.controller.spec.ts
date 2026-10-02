import { INestApplication, Logger } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';

import { EDGE_ROUTES, edgePath, EdgeRouteName, NETWORK_CHECK_KEYS, READINESS_KEYS } from '../contracts';
import { LanExceptionFilter } from '../lan/lan-exception.filter';
import { LAN_CONTROLLERS } from '../lan/lan.module';
import { AUTH_PORT, BoxConfig, InMemoryEdgeEventBus, NotImplementedPortError, OPS_PORT } from '../ports';
import { DEFAULT_OPS_TUNING } from './ops.constants';
import { OPS_HTTP_ROUTES, OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import {
    DIAL,
    FakeAuth,
    FakeBoot,
    FakeKernel,
    FakeOpsHost,
    FakeState,
    FakeUplink,
    kernelView,
    LISTEN,
    linkOf,
    ManualTimers,
    NOW,
    principalOf,
    sessionRecord,
    testConfig,
} from './testing/ops-fakes';
import { unzip } from './testing/unzip';
import { TransmitterControl } from './transmitter';

const R = EDGE_ROUTES;

interface Harness {
    app: INestApplication;
    http: () => ReturnType<typeof request>;
    ops: OpsService;
    state: FakeState;
    kernel: FakeKernel;
    uplink: FakeUplink;
    auth: FakeAuth;
    bus: InMemoryEdgeEventBus;
}

/**
 * The controller as the LAN mounts it (lan/lan.module.ts `LAN_CONTROLLERS`, with the LAN's app-wide contract error
 * filter `LanExceptionFilter` beside the controller's own), in front of the REAL OpsService over fakes.
 */
async function harness(opsOverride?: unknown, config: BoxConfig = testConfig()): Promise<Harness> {
    const clock = () => NOW;
    const state = new FakeState();
    state.sessionsData = [sessionRecord()];
    const kernel = new FakeKernel();
    const uplink = new FakeUplink();
    const auth = new FakeAuth();
    auth.tokens.set('admin-token', principalOf('online'));
    auth.tokens.set('operator-token', principalOf('operator'));
    auth.tokens.set('room-token', principalOf('room-code'));
    const bus = new InMemoryEdgeEventBus();
    const ops = new OpsService(config, clock, bus, new FakeBoot(), state.asPort(), kernel.asPort(), uplink.asPort(), auth.asPort(), new FakeOpsHost(), new ManualTimers(), {
        ...DEFAULT_OPS_TUNING,
        probeTimeoutMs: 20,
        syncTimeoutMs: 20,
    });
    const ref = await Test.createTestingModule({
        controllers: [OpsController],
        providers: [
            { provide: OPS_PORT, useValue: opsOverride ?? ops },
            { provide: AUTH_PORT, useValue: auth.asPort() },
            { provide: TransmitterControl, useValue: new TransmitterControl(kernel.asPort(), state.asPort(), config, clock) },
            { provide: APP_FILTER, useClass: LanExceptionFilter },
        ],
    })
        .setLogger(false as never)
        .compile();
    const app = ref.createNestApplication({ logger: false });
    app.use(cookieParser());
    await app.listen(0, '127.0.0.1');
    return { app, http: () => request(app.getHttpServer()), ops, state, kernel, uplink, auth, bus };
}

const binary = (res: request.Response, cb: (err: Error | null, body: Buffer) => void): void => {
    const chunks: Buffer[] = [];
    res.on('data', (c: Buffer) => chunks.push(c));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
};

/** Every ops route with a valid request for it. */
function routeCall(name: EdgeRouteName): { method: 'get' | 'post' | 'put'; path: string; body?: object } {
    const def = EDGE_ROUTES[name];
    const path = def.path.includes(':id') ? edgePath(def.path, { id: 'r1' }) : def.path;
    const bodies: Partial<Record<EdgeRouteName, object>> = {
        readinessRun: {},
        recoveryDismiss: {},
        networkRun: {},
        transmitterApply: { stateVersion: 7, settings: LISTEN, confirmInterrupt: false },
        transmitterConnect: { stateVersion: 7 },
        transmitterReconnect: { stateVersion: 7 },
        transmitterTest: { protocol: 'bridge', host: '192.168.20.31', port: 8080 },
        reporterCard: { nSesid: 's1' },
    };
    return { method: def.method.toLowerCase() as 'get' | 'post' | 'put', path, body: bodies[name] };
}

function send(h: Harness, name: EdgeRouteName, token: string | null) {
    const call = routeCall(name);
    let req = h.http()[call.method](call.path);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    return call.body ? req.send(call.body) : req;
}

beforeAll(() => Logger.overrideLogger(false));
afterAll(() => Logger.overrideLogger(['log', 'error', 'warn', 'debug', 'verbose']));

describe('OpsController — the box-admin routes (CONTRACTS.md §4 rows 18–33)', () => {
    let h: Harness;

    beforeEach(async () => {
        h = await harness();
    });

    afterEach(async () => {
        await h.ops.close();
        await h.app.close();
    });

    it('covers exactly the ops rows of EDGE_ROUTES, all box-admin', () => {
        expect([...OPS_HTTP_ROUTES].sort()).toEqual(
            (Object.keys(EDGE_ROUTES) as EdgeRouteName[]).filter(n => EDGE_ROUTES[n].path.startsWith('/edge/local/ops/')).sort(),
        );
        expect(OPS_HTTP_ROUTES.every(n => EDGE_ROUTES[n].auth === 'box-admin')).toBe(true);
    });

    it('every route: 401 without a valid token, 403 for a room-code reader; nothing runs, no-store', async () => {
        for (const name of OPS_HTTP_ROUTES) {
            for (const [token, status, error] of [
                [null, 401, 'unauthenticated'],
                ['forged', 401, 'unauthenticated'],
                ['room-token', 403, 'not_box_admin'],
            ] as const) {
                const res = await send(h, name, token);
                expect([name, res.status, res.body.error]).toEqual([name, status, error]);
                expect(res.body.msg).toBe(-1);
                expect(res.headers['cache-control']).toBe('no-store');
            }
        }
        expect(h.kernel.calls).toEqual([]);
        expect(h.state.auditRows).toEqual([]);
        expect(h.auth.authenticateCalls[0]).toEqual({ token: null, ip: '127.0.0.1' });
    });

    it('every route answers a box admin (online or operator) with msg:1 and no-store; POSTs answer 200', async () => {
        // Ids that do not exist (dismiss, tries) and a busy link (test, connect) are covered by their own cases below.
        const skip: EdgeRouteName[] = ['recoveryDismiss', 'logTries', 'transmitterTest', 'transmitterConnect'];
        for (const token of ['admin-token', 'operator-token']) {
            for (const name of OPS_HTTP_ROUTES) {
                if (skip.includes(name)) continue;
                h.kernel.settings = DIAL;
                h.kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
                h.kernel.stateVersion = 7;
                const res = await send(h, name, token);
                expect([name, res.status]).toEqual([name, 200]);
                expect(res.headers['cache-control']).toBe('no-store');
                if (name !== 'diagnostics') expect(res.body.msg).toBe(1);
            }
        }
    });

    it('is the controller the LAN mounts (CONTRACTS.md §4 rows 18–33 on the box origin)', () => {
        expect(LAN_CONTROLLERS).toContain(OpsController);
        expect(OPS_HTTP_ROUTES.map(n => EDGE_ROUTES[n].path)).toEqual([
            '/edge/local/ops/readiness',
            '/edge/local/ops/readiness/run',
            '/edge/local/ops/verdict',
            '/edge/local/ops/verdict/recoveries/:id/dismiss',
            '/edge/local/ops/log',
            '/edge/local/ops/log/:id/tries',
            '/edge/local/ops/network',
            '/edge/local/ops/network/run',
            '/edge/local/ops/box',
            '/edge/local/ops/diagnostics',
            '/edge/local/ops/transmitter',
            '/edge/local/ops/transmitter',
            '/edge/local/ops/transmitter/connect',
            '/edge/local/ops/transmitter/reconnect',
            '/edge/local/ops/transmitter/test',
            '/edge/local/ops/reporter-card',
        ]);
    });

    it('GET readiness (DR23 default): the seven checks, no operator-code line for anyone', async () => {
        for (const token of ['admin-token', 'operator-token']) {
            const res = await h.http().get(R.readiness.path).set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(200);
            expect(res.body.msg).toBe(1);
            expect(res.body.items.map((i: { key: string }) => i.key)).toEqual(READINESS_KEYS.filter(k => k !== 'operator-code-issued'));
            expect(res.body.total).toBe(7);
            expect(JSON.stringify(res.body)).not.toMatch(/operator-code|issue-operator-code/);
        }
    });

    it('GET readiness (operator code switched on): the eight checks; "Issue operator code" only for an online case admin', async () => {
        const on = await harness(undefined, testConfig({ features: { operatorCode: true } }));
        try {
            const online = await on.http().get(R.readiness.path).set('Authorization', 'Bearer admin-token');
            expect(online.status).toBe(200);
            expect(online.body.items).toHaveLength(8);
            expect(online.body.items.find((i: { key: string }) => i.key === 'operator-code-issued').action).toEqual({ kind: 'issue-operator-code', primary: true, href: null });
            const operator = await on.http().get(R.readiness.path).set('Authorization', 'Bearer operator-token');
            expect(operator.body.items.find((i: { key: string }) => i.key === 'operator-code-issued').action.kind).toBe('open-rt-production');
        } finally {
            await on.ops.close();
            await on.app.close();
        }
    });

    it('POST readiness/run and network/run: 200 with the results, audited with the client IP; a non-object body is invalid_request', async () => {
        const run = await h.http().post(R.readinessRun.path).set('Authorization', 'Bearer admin-token').send({});
        expect(run.status).toBe(200);
        expect(run.body).toMatchObject({ msg: 1, checkedAtMs: NOW, running: false });
        const net = await h.http().post(R.networkRun.path).set('Authorization', 'Bearer admin-token');
        expect(net.status).toBe(200);
        expect(net.body.checks).toHaveLength(6);
        expect(h.state.auditRows.map(r => [r.action, r.outcome, r.ip])).toEqual([
            ['readiness-run', 'ok', '127.0.0.1'],
            ['network-run', 'ok', '127.0.0.1'],
        ]);
        const bad = await h.http().post(R.readinessRun.path).set('Authorization', 'Bearer admin-token').send([1, 2]);
        expect([bad.status, bad.body.error]).toEqual([400, 'invalid_request']);
    });

    it('verdict and recoveries: a reconnect shows until "Done"; an unknown id is 404', async () => {
        await h.ops.start();
        h.bus.publish('feed-resumed', { nSesid: 's1', reconnectedAtMs: NOW, gapFromMs: NOW - 300_000, gapToMs: NOW });
        const v = await h.http().get(R.verdict.path).set('Authorization', 'Bearer admin-token');
        expect(v.status).toBe(200);
        expect(v.body).toMatchObject({ msg: 1, overall: 'ok', problems: [], logFilterDefault: 'all' });
        const id = v.body.recoveries[0].id as string;
        expect(id).toContain(':');
        const missing = await h.http().post(edgePath(R.recoveryDismiss.path, { id: 'nope' })).set('Authorization', 'Bearer admin-token').send({});
        expect([missing.status, missing.body.error, missing.headers['cache-control']]).toEqual([404, 'not_found', 'no-store']);
        const done = await h.http().post(edgePath(R.recoveryDismiss.path, { id })).set('Authorization', 'Bearer admin-token').send({});
        expect([done.status, done.body]).toEqual([200, { msg: 1 }]);
        expect((await h.http().get(R.verdict.path).set('Authorization', 'Bearer admin-token')).body.recoveries).toEqual([]);
    });

    it('Connectivity Log: query parsing, paging and tries; bad queries are 400, unknown rows 404; no delete route', async () => {
        h.state.log.append({ atMs: NOW - 9_000, event: 'connected', source: 'transmitter', code: 'tx-connected', problem: false, nSesid: 's1', sessionName: 'Day 3 — Morning', peer: '192.168.20.31:8080', actor: null, data: {} });
        const row = h.state.log.retry('k', { atMs: NOW - 5_000, error: 'refused', peer: '192.168.20.31:8080' }, { atMs: NOW - 5_000, event: 'retrying', source: 'transmitter', code: 'tx-refused', problem: true, nSesid: null, sessionName: null, peer: '192.168.20.31:8080', actor: null, data: { error: 'refused' } });
        h.state.log.retry('k', { atMs: NOW - 2_000, error: 'refused', peer: '192.168.20.31:8080' }, { atMs: NOW, event: 'retrying', source: 'transmitter', code: 'tx-refused', problem: true, nSesid: null, sessionName: null, peer: null, actor: null, data: {} });
        const auth = (r: request.Test) => r.set('Authorization', 'Bearer admin-token');

        const all = await auth(h.http().get(R.log.path));
        expect(all.status).toBe(200);
        expect(all.body).toMatchObject({ msg: 1, filter: 'all', day: '2026-10-01', days: ['2026-10-01'] });
        expect(all.body.rows.map((r: { code: string }) => r.code)).toEqual(['tx-refused', 'tx-connected']);
        expect(all.body.rows[0].retry).toEqual({ sinceMs: NOW - 5_000, tries: 2, lastError: 'refused', active: true });

        const problems = await auth(h.http().get(R.log.path).query({ filter: 'problems', q: 'REFUSED', limit: '1', day: '2026-10-01' }));
        expect(problems.body.rows.map((r: { code: string }) => r.code)).toEqual(['tx-refused']);
        const page1 = await auth(h.http().get(R.log.path).query({ limit: '1' }));
        const page2 = await auth(h.http().get(R.log.path).query({ limit: '1', before: page1.body.nextBefore }));
        expect(page2.body.rows.map((r: { code: string }) => r.code)).toEqual(['tx-connected']);

        for (const query of ['filter=errors', 'limit=abc', 'limit=0', 'limit=201', 'day=2026-13-01', 'filter=all&filter=cloud', 'before=%25%25%25']) {
            const res = await auth(h.http().get(`${R.log.path}?${query}`));
            expect([query, res.status, res.body.error]).toEqual([query, 400, 'invalid_request']);
        }

        const tries = await auth(h.http().get(edgePath(R.logTries.path, { id: row.id })).query({ limit: '1' }));
        expect(tries.status).toBe(200);
        expect(tries.body).toMatchObject({ msg: 1, rowId: row.id, rows: [{ atMs: NOW - 2_000, error: 'refused', peer: '192.168.20.31:8080' }] });
        const more = await auth(h.http().get(edgePath(R.logTries.path, { id: row.id })).query({ before: tries.body.nextBefore }));
        expect(more.body.rows).toHaveLength(1);
        expect((await auth(h.http().get(edgePath(R.logTries.path, { id: 'r999' })))).status).toBe(404);
        expect((await auth(h.http().get(edgePath(R.logTries.path, { id: row.id })).query({ limit: '-1' }))).status).toBe(400);

        for (const method of ['delete', 'post', 'put'] as const) {
            const res = await auth(h.http()[method](R.log.path));
            expect(res.status).toBe(404);
        }
    });

    it('GET box: "This box" details', async () => {
        const res = await h.http().get(R.boxDetails.path).set('Authorization', 'Bearer admin-token');
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ msg: 1, boxName: 'Court 3', boxLabel: 'VB-014', version: '1.0.3', timeZone: 'Europe/London', diskFreeMB: 212_000 });
    });

    it('GET diagnostics: an application/zip attachment named for the box, audited, never JSON-wrapped', async () => {
        h.kernel.views = [kernelView()];
        const res = await h.http().get(R.diagnostics.path).set('Authorization', 'Bearer admin-token').buffer(true).parse(binary);
        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toBe('application/zip');
        expect(res.headers['content-disposition']).toBe('attachment; filename="etabella-box-VB-014-20261001-1030.zip"');
        expect(res.headers['cache-control']).toBe('no-store');
        expect(res.headers['x-content-type-options']).toBe('nosniff');
        const entries = unzip(res.body as Buffer);
        expect(entries[0].name).toBe('README.txt');
        expect(Buffer.concat(entries.map(e => e.data)).toString()).not.toContain('admin-token');
        expect(h.state.auditRows).toEqual([expect.objectContaining({ action: 'diagnostics-download', outcome: 'ok', ip: '127.0.0.1' })]);
    });

    it('transmitter: GET state; PUT with the version guard, field errors and the confirm guard; 200 on apply', async () => {
        const auth = (r: request.Test) => r.set('Authorization', 'Bearer admin-token');
        const state = await auth(h.http().get(R.transmitter.path));
        expect(state.status).toBe(200);
        expect(state.body).toMatchObject({ msg: 1, stateVersion: 7, settings: LISTEN, listen: { boxTransmitterAddress: '192.168.20.2', port: 2500 } });

        const stale = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 3, settings: DIAL, confirmInterrupt: false });
        expect([stale.status, stale.body.error, stale.body.stateVersion]).toEqual([409, 'state_changed', 7]);

        const fields = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 7, settings: { ...DIAL, host: '10.0.0.9', port: 99_999 } });
        expect([fields.status, fields.body.error, fields.body.fields]).toEqual([400, 'invalid_settings', { host: 'ipv4', port: 'port-range' }]);

        h.kernel.link = linkOf({ state: 'live', receivingSesid: 's1' });
        const guard = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 7, settings: DIAL, confirmInterrupt: false });
        expect([guard.status, guard.body.error]).toEqual([409, 'confirm_required']);
        expect(guard.body.guard).toMatchObject({ changes: ['mode'], now: LISTEN, after: DIAL, stateVersion: 7, session: { nSesid: 's1', sessionName: 'Day 3 — Morning' } });

        const ok = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 7, settings: DIAL, confirmInterrupt: true });
        expect(ok.status).toBe(200);
        expect(ok.body).toMatchObject({ msg: 1, stateVersion: 8, settings: DIAL });
        expect(h.kernel.calls.map(c => c[0])).toEqual(['applyTransmitter']);

        const malformed = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 'x' });
        expect([malformed.status, malformed.body.error]).toEqual([400, 'invalid_request']);
    });

    it('transmitter: connect / reconnect / test with their contract errors', async () => {
        const auth = (r: request.Test) => r.set('Authorization', 'Bearer admin-token');
        const connectListen = await auth(h.http().post(R.transmitterConnect.path)).send({ stateVersion: 7 });
        expect([connectListen.status, connectListen.body.error]).toEqual([409, 'not_dial_mode']);
        h.kernel.settings = DIAL;
        h.kernel.link = linkOf({ state: 'live', mode: 'dial' });
        expect((await auth(h.http().post(R.transmitterConnect.path)).send({ stateVersion: 7 })).body.error).toBe('already_connected');
        expect((await auth(h.http().post(R.transmitterReconnect.path)).send({ stateVersion: 7 })).body.error).toBe('link_up');
        const busy = await auth(h.http().post(R.transmitterTest.path)).send({ protocol: 'bridge', host: '192.168.20.31', port: 8080 });
        expect([busy.status, busy.body.error, busy.body.linkState]).toEqual([409, 'test_refused_busy', 'live']);

        h.kernel.link = linkOf({ state: 'waiting', mode: 'dial' });
        h.kernel.settings = { ...DIAL, autoReconnect: false };
        const connected = await auth(h.http().post(R.transmitterConnect.path)).send({ stateVersion: 7 });
        expect([connected.status, connected.body.msg, connected.body.link.state]).toEqual([200, 1, 'connecting']);
        h.kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        const reconnected = await auth(h.http().post(R.transmitterReconnect.path)).send({ stateVersion: 8 });
        expect(reconnected.status).toBe(200);
        const tested = await auth(h.http().post(R.transmitterTest.path)).send({ protocol: 'bridge', host: '192.168.20.31', port: 8080 });
        expect([tested.status, tested.body]).toEqual([200, { msg: 1, result: 'data', protocolSeen: 'bridge', bytes: 512, durationMs: 1_200 }]);
        const badDraft = await auth(h.http().post(R.transmitterTest.path)).send({ protocol: 'bridge', host: '192.168.20.300', port: 8080 });
        expect([badDraft.status, badDraft.body.fields]).toEqual([400, { host: 'ipv4' }]);
    });

    it('reporter card: 200 with the session login details and no password; 404 / 400 otherwise', async () => {
        const auth = (r: request.Test) => r.set('Authorization', 'Bearer admin-token');
        const card = await auth(h.http().post(R.reporterCard.path)).send({ nSesid: 's1' });
        expect(card.status).toBe(200);
        expect(card.body).toEqual({
            msg: 1,
            nSesid: 's1',
            sessionName: 'Day 3 — Morning',
            caseName: 'Acme v Beta',
            serverAddress: '192.168.20.2',
            port: 2500,
            username: 'eclipse-user-7',
            password: null,
            passwordSource: 'rt-production',
            mode: 'listen',
            openedAtMs: NOW,
        });
        expect((await auth(h.http().post(R.reporterCard.path)).send({ nSesid: 'nope' })).status).toBe(404);
        expect((await auth(h.http().post(R.reporterCard.path)).send({})).body.error).toBe('invalid_request');
        expect((await auth(h.http().post(R.reporterCard.path)).send({ nSesid: 5 })).status).toBe(400);
    });
});

/** The exact key sets of the contract types (apps/rt-edge/src/contracts; the FE mirror reads these and nothing else). */
const SHAPES = {
    readiness: ['msg', 'day', 'checkedAtMs', 'running', 'landing', 'firstLiveAtMs', 'items', 'needAttention', 'total'],
    readinessItem: ['key', 'ok', 'level', 'detail', 'action'],
    readinessAction: ['kind', 'primary', 'href'],
    readinessDetail: {
        'box-linked': ['linked', 'lastCloudContactAtMs', 'failure'],
        'sessions-today': ['count', 'sessions', 'assignmentsSyncedAtMs'],
        'team-lists': ['people', 'cases', 'syncedAtMs'],
        'transmitter-connected': ['state', 'mode'],
        'etabella-reachable': ['internet', 'reachable', 'sinceMs'],
        'operator-code-issued': ['issued', 'issuedAtMs', 'mintedByName'],
        'disk-free': ['freeMB', 'minFreeMB'],
        'clock-in-sync': ['synced', 'offsetMs'],
    } as Record<string, string[]>,
    readinessSession: ['nSesid', 'sessionName', 'caseName', 'startAtMs'],
    verdict: ['msg', 'checkedAtMs', 'running', 'overall', 'problems', 'recoveries', 'logFilterDefault'],
    problem: ['id', 'kind', 'rank', 'severity', 'sinceMs', 'nSesid', 'sessionName', 'detail', 'hints', 'actions'],
    verdictAction: ['kind', 'primary', 'stateVersion', 'nSesid'],
    feedStopped: ['feedStoppedAtMs', 'gapFromMs', 'gapToMs', 'lastLine', 'resendFromMs', 'supportAlertedAtMs', 'splitOfferedFromMs', 'mode', 'peer'],
    linePosition: ['page', 'line', 'atMs'],
    recovery: ['id', 'kind', 'nSesid', 'sessionName', 'reconnectedAtMs', 'gapFromMs', 'gapToMs', 'resendFromMs'],
    ack: ['msg'],
    logPage: ['msg', 'filter', 'day', 'rows', 'nextBefore', 'newest', 'days'],
    logRow: ['id', 'atMs', 'updatedAtMs', 'event', 'source', 'code', 'problem', 'nSesid', 'sessionName', 'peer', 'actor', 'data', 'retry'],
    logRetry: ['sinceMs', 'tries', 'lastError', 'active'],
    triesPage: ['msg', 'rowId', 'rows', 'nextBefore'],
    logTry: ['atMs', 'error', 'peer'],
    network: ['msg', 'running', 'checkedAtMs', 'checks'],
    networkCheck: ['key', 'ok', 'level', 'value', 'ms'],
    box: [
        'msg', 'nEdgeid', 'boxName', 'boxLabel', 'version', 'parserVer', 'backendCommit', 'feCommit', 'nowMs', 'timeZone', 'uptimeSec',
        'clockOffsetMs', 'clockSynced', 'diskFreeMB', 'diskTotalMB', 'journalMB', 'certDaysLeft', 'upsOnBattery', 'cloudRootShort',
    ],
    transmitter: ['msg', 'stateVersion', 'settings', 'applied', 'link', 'sessions', 'listen', 'actions'],
    settings: ['mode', 'protocol', 'host', 'port', 'autoReconnect', 'receivingSesid'],
    applied: ['atMs', 'by'],
    link: ['state', 'mode', 'protocol', 'sinceMs', 'attempt', 'quietLevel', 'peer', 'bytesIn', 'lastLineAtMs', 'receivingSesid', 'heldPeers', 'lockout'],
    sessionOption: ['nSesid', 'sessionName', 'caseName', 'phase', 'isToday'],
    listen: ['boxTransmitterAddress', 'port'],
    txActions: ['connect', 'testOnly', 'reconnect'],
    test: ['msg', 'result', 'protocolSeen', 'bytes', 'durationMs'],
    reporterCard: ['msg', 'nSesid', 'sessionName', 'caseName', 'serverAddress', 'port', 'username', 'password', 'passwordSource', 'mode', 'openedAtMs'],
    error: ['msg', 'error', 'message'],
    guard: ['session', 'lastLineAtMs', 'peer', 'now', 'after', 'changes', 'stateVersion'],
};

const keys = (o: unknown): string[] => Object.keys(o as object).sort();
const same = (o: unknown, expected: readonly string[]): void => expect(keys(o)).toEqual([...expected].sort());

describe('OpsController — every route answers exactly the contract shapes (CONTRACTS.md §8.3–§8.7)', () => {
    let h: Harness;
    const auth = (r: request.Test) => r.set('Authorization', 'Bearer admin-token');

    beforeEach(async () => {
        h = await harness(undefined, testConfig({ features: { operatorCode: true } }));
    });

    afterEach(async () => {
        await h.ops.close();
        await h.app.close();
    });

    it('readiness and readiness/run', async () => {
        h.kernel.views = [kernelView({ firstLineAtMs: null, feed: 'waiting', phase: 'not-started' })];
        for (const res of [await auth(h.http().get(R.readiness.path)), await auth(h.http().post(R.readinessRun.path)).send({})]) {
            expect(res.status).toBe(200);
            same(res.body, SHAPES.readiness);
            expect(res.body.items.map((i: { key: string }) => i.key)).toEqual([...READINESS_KEYS]);
            for (const item of res.body.items) {
                same(item, SHAPES.readinessItem);
                same(item.detail, SHAPES.readinessDetail[item.key]);
                if (item.action) same(item.action, SHAPES.readinessAction);
            }
            for (const s of res.body.items.find((i: { key: string }) => i.key === 'sessions-today').detail.sessions) same(s, SHAPES.readinessSession);
        }
    });

    it('verdict (a feed drop, a reconnect) and recoveries/:id/dismiss', async () => {
        await h.ops.start();
        h.kernel.link = linkOf({ state: 'disconnected' });
        h.kernel.views = [kernelView({ feed: 'stopped', catConnected: false, feedStoppedAtMs: NOW - 400_000, lastLine: { page: 41, line: 18, atMs: NOW - 401_000 } })];
        h.bus.publish('feed-resumed', { nSesid: 's1', reconnectedAtMs: NOW - 500_000, gapFromMs: NOW - 900_000, gapToMs: NOW - 500_000 });
        h.state.identityRecord = null;
        const res = await auth(h.http().get(R.verdict.path));
        expect(res.status).toBe(200);
        same(res.body, SHAPES.verdict);
        expect(res.body.problems.map((p: { kind: string }) => p.kind)).toEqual(['box-not-linked', 'feed-stopped']);
        for (const p of res.body.problems) {
            same(p, SHAPES.problem);
            for (const a of p.actions) same(a, SHAPES.verdictAction);
        }
        const feed = res.body.problems[1];
        same(feed.detail, SHAPES.feedStopped);
        same(feed.detail.lastLine, SHAPES.linePosition);
        same(res.body.problems[0].detail, ['failure', 'lastLinkedAtMs']);
        expect(res.body.recoveries).toHaveLength(1);
        same(res.body.recoveries[0], SHAPES.recovery);
        const done = await auth(h.http().post(edgePath(R.recoveryDismiss.path, { id: res.body.recoveries[0].id }))).send({});
        expect(done.status).toBe(200);
        same(done.body, SHAPES.ack);
    });

    it('log and log/:id/tries', async () => {
        h.state.log.append({ atMs: NOW - 9_000, event: 'connected', source: 'transmitter', code: 'tx-connected', problem: false, nSesid: 's1', sessionName: 'Day 3 — Morning', peer: '192.168.20.31:8080', actor: null, data: { protocol: 'bridge' } });
        const row = h.state.log.retry('k', { atMs: NOW - 5_000, error: 'refused', peer: '192.168.20.31:8080' }, { atMs: NOW - 5_000, event: 'retrying', source: 'transmitter', code: 'tx-refused', problem: true, nSesid: null, sessionName: null, peer: '192.168.20.31:8080', actor: null, data: { error: 'refused' } });
        const page = await auth(h.http().get(R.log.path));
        same(page.body, SHAPES.logPage);
        for (const r of page.body.rows) same(r, SHAPES.logRow);
        same(page.body.rows[0].retry, SHAPES.logRetry);
        const tries = await auth(h.http().get(edgePath(R.logTries.path, { id: row.id })));
        same(tries.body, SHAPES.triesPage);
        same(tries.body.rows[0], SHAPES.logTry);
    });

    it('network and network/run', async () => {
        for (const res of [await auth(h.http().get(R.network.path)), await auth(h.http().post(R.networkRun.path)).send({})]) {
            same(res.body, SHAPES.network);
            expect(res.body.checks.map((c: { key: string }) => c.key)).toEqual([...NETWORK_CHECK_KEYS]);
            for (const c of res.body.checks) same(c, SHAPES.networkCheck);
        }
    });

    it('box', async () => {
        same((await auth(h.http().get(R.boxDetails.path))).body, SHAPES.box);
    });

    it('transmitter: GET, PUT, connect, reconnect, test, and the error extras', async () => {
        h.kernel.settings = { mode: 'dial', protocol: 'bridge', host: '192.168.20.31', port: 8080, autoReconnect: false, receivingSesid: null };
        h.kernel.link = linkOf({ state: 'waiting', mode: 'dial' });
        const check = (body: Record<string, unknown>) => {
            same(body, SHAPES.transmitter);
            same(body.settings, SHAPES.settings);
            same(body.applied, SHAPES.applied);
            same((body.applied as { by: object }).by, ['nUserid', 'name', 'via', 'operatorName']);
            same(body.link, SHAPES.link);
            for (const s of body.sessions as object[]) same(s, SHAPES.sessionOption);
            same(body.listen, SHAPES.listen);
            same(body.actions, SHAPES.txActions);
        };
        check((await auth(h.http().get(R.transmitter.path))).body);
        check((await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 7, settings: DIAL, confirmInterrupt: false })).body);
        h.kernel.link = linkOf({ state: 'waiting', mode: 'dial' });
        check((await auth(h.http().post(R.transmitterConnect.path)).send({ stateVersion: 8 })).body);
        h.kernel.link = linkOf({ state: 'disconnected', mode: 'dial' });
        h.kernel.settings = { ...DIAL, autoReconnect: false };
        check((await auth(h.http().post(R.transmitterReconnect.path)).send({ stateVersion: 9 })).body);
        const tested = await auth(h.http().post(R.transmitterTest.path)).send({ protocol: 'bridge', host: '192.168.20.31', port: 8080 });
        same(tested.body, SHAPES.test);

        const stale = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 1, settings: DIAL, confirmInterrupt: false });
        same(stale.body, [...SHAPES.error, 'stateVersion']);
        const fields = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 10, settings: { ...DIAL, port: 0 }, confirmInterrupt: false });
        same(fields.body, [...SHAPES.error, 'fields']);
        h.kernel.link = linkOf({ state: 'live', mode: 'dial', receivingSesid: 's1' });
        const guard = await auth(h.http().put(R.transmitterApply.path)).send({ stateVersion: 10, settings: LISTEN, confirmInterrupt: false });
        same(guard.body, [...SHAPES.error, 'guard']);
        same(guard.body.guard, SHAPES.guard);
        const busy = await auth(h.http().post(R.transmitterTest.path)).send({ protocol: 'bridge', host: '192.168.20.31', port: 8080 });
        same(busy.body, [...SHAPES.error, 'linkState']);
        for (const [path, code] of [[R.transmitterConnect.path, 'already_connected'], [R.transmitterReconnect.path, 'link_up']] as const) {
            const res = await auth(h.http().post(path)).send({ stateVersion: 10 });
            expect(res.body.error).toBe(code);
            same(res.body, SHAPES.error);
        }
    });

    it('reporter-card', async () => {
        same((await auth(h.http().post(R.reporterCard.path)).send({ nSesid: 's1' })).body, SHAPES.reporterCard);
    });
});

describe('OpsController — defence in depth', () => {
    it('never returns another case\'s reporter login, even from an OpsPort that does not check (DR19)', async () => {
        const lax = { reporterCard: (_p: unknown, req: { nSesid: string }) => ({ nSesid: req.nSesid, username: 'eclipse-user-7', password: null }) };
        const h = await harness(lax);
        try {
            h.auth.openable = new Set();
            const res = await h.http().post(R.reporterCard.path).set('Authorization', 'Bearer admin-token').send({ nSesid: 's1' });
            expect([res.status, res.body.error]).toEqual([404, 'session_not_found']);
            expect(JSON.stringify(res.body)).not.toContain('eclipse-user-7');
            h.auth.tokens.set('super-token', principalOf('online', { isSuperAdmin: true }));
            const sup = await h.http().post(R.reporterCard.path).set('Authorization', 'Bearer super-token').send({ nSesid: ' s1 ' });
            expect([sup.status, sup.body.nSesid]).toEqual([200, 's1']);
        } finally {
            await h.app.close();
        }
    });
});

describe('OpsController — error envelope', () => {
    it('maps an unexpected error to 500 server_error without leaking it, and a not-implemented port to 500', async () => {
        const failing = {
            verdict: () => {
                throw new Error('SELECT * FROM secret_table failed at /var/lib/etabella-edge/edge.sqlite');
            },
            network: () => {
                throw new NotImplementedPortError('OpsPort', 'network');
            },
        };
        const h = await harness(failing);
        try {
            const res = await h.http().get(R.verdict.path).set('Authorization', 'Bearer admin-token');
            expect(res.status).toBe(500);
            expect(res.body).toEqual({ msg: -1, error: 'server_error', message: 'internal error' });
            expect(res.headers['cache-control']).toBe('no-store');
            const ni = await h.http().get(R.network.path).set('Authorization', 'Bearer admin-token');
            expect([ni.status, ni.body.error, ni.body.notImplemented]).toEqual([500, 'server_error', undefined]);
        } finally {
            await h.app.close();
        }
    });
});
