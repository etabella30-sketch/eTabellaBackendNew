/**
 * EdgeController through a real Nest HTTP stack: EdgeModule's own middleware wiring (RealtimeAuthMiddleware +
 * RealtimeAdminMiddleware), the same global ValidationPipe as realtime-server main.ts, and mocked services.
 * Covers admin authorization on EVERY admin route (no token / non-admin / admin), the session routes, the
 * device routes (public, rate-limited, device-signed), validation and the EDGE_ENABLED gate.
 */
import { Global, INestApplication, Logger, Module, RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { generateKeyPairSync } from 'crypto';
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { EDGE_ASSIGN_PUSH } from '../services/transcript-completeness/edge-assign-push';
import { EDGE_APPLY_PORT } from './edge-apply.port';
import { EdgeAuthService } from './edge-auth.middleware';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeRegistryService } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { EDGE_ADMIN_ROUTES, EDGE_DEVICE_ROUTES, EDGE_SESSION_ROUTES, EdgeModule } from './edge.module';
import { pemDer } from './edge.controller';
import { EdgeDbError, EdgeServiceError } from './edge.types';
import { IDS } from './edge-test-kit.spec';

const SECRET = 'edge-controller-secret';
const env: Record<string, any> = {};
const config = { get: (k: string) => env[k] };

@Global()
@Module({ providers: [{ provide: ConfigService, useValue: config }], exports: [ConfigService] })
class TestConfigModule { }

const sessions: Record<string, { id: string; a: boolean }> = {
    [IDS.admin]: { id: 'b-admin', a: true },
    [IDS.user]: { id: 'b-user', a: false },
    [IDS.operator]: { id: 'b-op', a: false },
};
const rds = { getValue: jest.fn(async (key: string) => JSON.stringify(sessions[key.replace('user/', '')] ?? null)), deleteValue: jest.fn(), setValue: jest.fn() };
const db = { executeRef: jest.fn(async () => ({ success: true, data: [] })), rowQuery: jest.fn(async () => ({ success: true, data: [] })) };
const token = (userId: string) => jwt.sign({ userId, broweserId: sessions[userId].id }, SECRET);

const ok = <T>(v: T) => jest.fn(async (..._a: any[]) => v);
const registry = {
    listNodes: ok([{ nEdgeid: IDS.box, cName: 'Box' }]),
    getNode: ok({ node: { nEdgeid: IDS.box, cPubKey: 'SECRET-KEY', cStatus: 'A' }, cases: [] }),
    createNode: ok({ node: { nEdgeid: IDS.box }, enroll: { code: 'AAAAA', qrText: 'q' } }),
    issueEnrollCode: ok({ nEdgeid: IDS.box, code: 'BBBBB' }),
    confirmKey: ok({ nEdgeid: IDS.box, cStatus: 'A' }),
    quarantine: ok({ nEdgeid: IDS.box, cStatus: 'Q', bChanged: true }),
    setCase: ok({ nEdgeid: IDS.box, bAssigned: true }),
    assignments: ok({ ok: true, code: null, status: 'A', ends: [], missingRoutes: [], assigned: [], snapshot: { sessions: [{ nSesid: IDS.ses, route: { user: 'u', salt: 's', hash: 'HASH', scryptN: 1 } }] } }),
    liveStatus: ok({ status: {}, receivedAtMs: 1, ip: null }),
    recentAlerts: jest.fn(() => [{ kind: 'FORK', nEdgeid: IDS.box }, { kind: 'X', nEdgeid: IDS.box2 }]),
    orphans: ok([{ nOrphanid: 'o' }]),
    resolveOrphan: ok({ msg: 1, nOrphanid: 'o' }),
    events: ok([{ nId: 1 }]),
    enroll: ok({ nEdgeid: IDS.box, cStatus: 'C', keyFingerprint: 'AA' }),
    issueCertificate: jest.fn(async (..._a: any[]): Promise<any> => {
        throw new EdgeServiceError('NOT_IMPLEMENTED', 'Phase 3');
    }),
    gateway: { connection: () => null },
};
const sync = {
    revokeBox: ok({ nEdgeid: IDS.box, sessions: [] }),
    heldShrink: ok({ held: false }),
    decideShrink: ok({ msg: 1, value: 'Confirmed and applied' }),
    forceSeal: ok({ cSyncState: 'F' }),
    split: ok({ msg: 1, nPart2Sesid: IDS.ses2 }),
    useDirectCloud: ok({ msg: 1, cFeedSource: 'D' }),
    warnAck: ok({ msg: 1, cSyncState: 'W' }),
    feedStatus: ok({ msg: 1, nSesid: IDS.ses }),
    loadBindings: jest.fn(async (..._a: any[]) => new Map([[IDS.ses, { nSesid: IDS.ses, nCaseid: IDS.caseA, nEdgeid: IDS.box, cFeedSource: 'E', nHearingOpid: IDS.operator }]])),
    isCaseAdmin: jest.fn(async (..._a: any[]) => false),
};
const auth = { issueChallenge: ok({ nonce: 'n'.repeat(64), expiresInSec: 60 }), authenticateDevice: jest.fn(async (..._a: any[]): Promise<any> => ({ ok: false, code: 'UNAUTHORIZED', message: 'bad' })) };
const rawStore = { archive: { presignPut: jest.fn(async (..._a: any[]): Promise<any> => null) } };

const BODY = {
    nEdgeid: IDS.box,
    nSesid: IDS.ses,
};

/** One valid request per admin route, and the service call it must reach. */
const ADMIN_CASES: Array<{ method: 'GET' | 'POST'; path: string; data?: any; reached: () => jest.Mock; actorArg?: number }> = [
    { method: 'GET', path: 'edge/admin/list', reached: () => registry.listNodes },
    { method: 'GET', path: 'edge/admin/get', data: { nEdgeid: IDS.box }, reached: () => registry.getNode },
    { method: 'POST', path: 'edge/admin/create', data: { cName: 'Court 3' }, reached: () => registry.createNode, actorArg: 0 },
    { method: 'POST', path: 'edge/admin/enroll-code', data: { nEdgeid: IDS.box }, reached: () => registry.issueEnrollCode, actorArg: 0 },
    { method: 'POST', path: 'edge/admin/confirm-key', data: { nEdgeid: IDS.box, cKeyFpr: 'AB:CD' }, reached: () => registry.confirmKey, actorArg: 0 },
    { method: 'POST', path: 'edge/admin/quarantine', data: { nEdgeid: IDS.box, cAction: 'Q' }, reached: () => registry.quarantine, actorArg: 0 },
    { method: 'POST', path: 'edge/admin/revoke', data: { nEdgeid: IDS.box }, reached: () => sync.revokeBox, actorArg: 0 },
    { method: 'POST', path: 'edge/admin/cases', data: { nEdgeid: IDS.box, nCaseid: IDS.caseA, permission: 'I' }, reached: () => registry.setCase, actorArg: 0 },
    { method: 'GET', path: 'edge/admin/assignments', data: { nEdgeid: IDS.box }, reached: () => registry.assignments },
    { method: 'GET', path: 'edge/admin/status', data: { nEdgeid: IDS.box }, reached: () => registry.liveStatus },
    { method: 'GET', path: 'edge/admin/orphans', data: { nSesid: IDS.ses }, reached: () => registry.orphans },
    { method: 'POST', path: 'edge/admin/resolve', data: { nOrphanid: IDS.ses3, cStatus: 'A' }, reached: () => registry.resolveOrphan, actorArg: 0 },
    { method: 'GET', path: 'edge/admin/events', data: { nEdgeid: IDS.box }, reached: () => registry.events },
    { method: 'GET', path: 'edge/admin/shrink', data: { nSesid: IDS.ses }, reached: () => sync.heldShrink },
    { method: 'POST', path: 'edge/admin/shrink', data: { nSesid: IDS.ses, heldId: IDS.ses3, cAction: 'confirm' }, reached: () => sync.decideShrink, actorArg: 0 },
    { method: 'POST', path: 'session/forceseal', data: { nSesid: IDS.ses, cSealNote: 'venue data missing' }, reached: () => sync.forceSeal, actorArg: 0 },
];

const SESSION_CASES: Array<{ method: 'GET' | 'POST'; path: string; data: any; reached: () => jest.Mock }> = [
    { method: 'POST', path: 'session/edge/split', data: { nSesid: IDS.ses, cNote: 'box died' }, reached: () => sync.split },
    { method: 'POST', path: 'session/edge/direct', data: { nSesid: IDS.ses }, reached: () => sync.useDirectCloud },
    { method: 'POST', path: 'session/warnack', data: { nSesid: IDS.ses }, reached: () => sync.warnAck },
    { method: 'GET', path: 'session/feedstatus', data: { nSesid: IDS.ses }, reached: () => sync.feedStatus },
];

describe('EdgeController (HTTP)', () => {
    let app: INestApplication;
    const send = (method: 'GET' | 'POST', path: string, data?: any, tok?: string) => {
        const r = method === 'GET' ? request(app.getHttpServer()).get(`/${path}`).query(data ?? {}) : request(app.getHttpServer()).post(`/${path}`).send(data ?? {});
        return tok ? r.set('Authorization', `Bearer ${tok}`) : r;
    };

    beforeAll(async () => {
        Logger.overrideLogger(false);
        const moduleRef = await Test.createTestingModule({ imports: [TestConfigModule, EdgeModule] })
            .overrideProvider(DbService).useValue(db)
            .overrideProvider(RedisDbService).useValue(rds)
            .overrideProvider(EdgeRegistryService).useValue(registry)
            .overrideProvider(EdgeSyncService).useValue(sync)
            .overrideProvider(EdgeRawStoreService).useValue(rawStore)
            .overrideProvider(EdgeAuthService).useValue(auth)
            .overrideProvider(EdgeUplinkGateway).useValue({})
            .overrideProvider(EDGE_APPLY_PORT).useValue({})
            .overrideProvider(EDGE_ASSIGN_PUSH).useValue(() => undefined)
            .compile();
        app = moduleRef.createNestApplication({ logger: false });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        await app.init();
    });
    afterAll(async () => {
        await app?.close();
    });
    beforeEach(() => {
        for (const k of Object.keys(env)) delete env[k];
        Object.assign(env, { JWT_SECRET: SECRET, EDGE_ENABLED: '1' });
        jest.clearAllMocks();
    });

    it('wires every admin route behind login + global admin, and the session routes behind login', () => {
        const key = (r: { method: RequestMethod; path: string }) => `${r.method} ${r.path}`;
        const methodOf = (m: 'GET' | 'POST') => (m === 'GET' ? RequestMethod.GET : RequestMethod.POST);
        expect(ADMIN_CASES.map(c => key({ method: methodOf(c.method), path: c.path })).sort()).toEqual(EDGE_ADMIN_ROUTES.map(key).sort());
        expect(SESSION_CASES.map(c => key({ method: methodOf(c.method), path: c.path })).sort()).toEqual(EDGE_SESSION_ROUTES.map(key).sort());
        expect(EDGE_DEVICE_ROUTES.map(key)).toEqual(['0 edge/v1/challenge', '1 edge/v1/enroll', '1 edge/v1/cert', '1 edge/v1/archive-url']);
    });

    describe.each(ADMIN_CASES)('$method /$path', c => {
        it('refuses a caller without a token (403)', async () => {
            const res = await send(c.method, c.path, c.data);
            expect(res.status).toBe(403);
            expect(c.reached()).not.toHaveBeenCalled();
        });

        it('refuses a logged-in non-admin (403 Admin rights required)', async () => {
            const res = await send(c.method, c.path, c.data, token(IDS.user));
            expect(res.status).toBe(403);
            expect(res.body.message).toBe('Admin rights required');
            expect(c.reached()).not.toHaveBeenCalled();
        });

        it('lets a global admin through to the service, acting as the token user', async () => {
            const res = await send(c.method, c.path, c.data, token(IDS.admin));
            expect([200, 201]).toContain(res.status);
            expect(res.body.msg).toBe(1);
            expect(c.reached()).toHaveBeenCalledTimes(1);
            if (c.actorArg !== undefined) expect(c.reached().mock.calls[0][c.actorArg]).toEqual({ userId: IDS.admin, isAdmin: true });
        });
    });

    describe.each(SESSION_CASES)('$method /$path', c => {
        it('refuses a caller without a token (403)', async () => {
            expect((await send(c.method, c.path, c.data)).status).toBe(403);
            expect(c.reached()).not.toHaveBeenCalled();
        });

        it('passes a logged-in user (the hearing operator) to the role checks of the service', async () => {
            const res = await send(c.method, c.path, c.data, token(IDS.operator));
            expect([200, 201]).toContain(res.status);
            expect(c.reached()).toHaveBeenCalledTimes(1);
        });
    });

    it('refuses an invalid or non-HS256 token (401), so an edge token never reaches an admin route', async () => {
        expect((await send('GET', 'edge/admin/list', {}, 'garbage')).status).toBe(401);
        const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256', privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
        const es = jwt.sign({ userId: IDS.admin, aud: `edge:${IDS.box}`, scope: 'rt' }, privateKey, { algorithm: 'ES256' });
        expect((await send('GET', 'edge/admin/list', {}, es)).status).toBe(401);
        expect(registry.listNodes).not.toHaveBeenCalled();
    });

    it('passes the split actor and options, and refuses session/feedstatus to a user who is not the hearing operator', async () => {
        await send('POST', 'session/edge/split', { nSesid: IDS.ses, cName: 'Part 2', cNote: 'x' }, token(IDS.operator));
        expect(sync.split).toHaveBeenCalledWith(IDS.ses, { userId: IDS.operator, isAdmin: false }, { cName: 'Part 2', cNote: 'x' });
        const res = await send('GET', 'session/feedstatus', { nSesid: IDS.ses }, token(IDS.user));
        expect(res.status).toBe(403);
        expect(sync.feedStatus).not.toHaveBeenCalled();
        expect(sync.isCaseAdmin).toHaveBeenCalledWith(IDS.caseA, IDS.user);
    });

    it('lets a case admin of the session case read session/feedstatus (spec §7 "any admin")', async () => {
        sync.isCaseAdmin.mockResolvedValueOnce(true);
        const res = await send('GET', 'session/feedstatus', { nSesid: IDS.ses }, token(IDS.user));
        expect(res.status).toBe(200);
        expect(sync.feedStatus).toHaveBeenCalledWith(IDS.ses);
    });

    it('maps service refusals and database failures to HTTP statuses with a stable cCode', async () => {
        sync.split.mockRejectedValueOnce(new EdgeServiceError('STATE', 'sealed', { cCode: 'SEALED' }));
        const refused = await send('POST', 'session/edge/split', { nSesid: IDS.ses }, token(IDS.admin));
        expect(refused.status).toBe(409);
        expect(refused.body).toMatchObject({ msg: -1, cCode: 'SEALED', message: 'sealed' });
        registry.listNodes.mockRejectedValueOnce(new EdgeDbError('et_rtedge_list', 'down'));
        expect((await send('GET', 'edge/admin/list', {}, token(IDS.admin))).status).toBe(503);
        registry.listNodes.mockRejectedValueOnce(new Error('boom'));
        expect((await send('GET', 'edge/admin/list', {}, token(IDS.admin))).status).toBe(500);
    });

    it('never returns the expected key fingerprint before an admin confirmed it, nor any device key (G1)', async () => {
        registry.listNodes.mockResolvedValueOnce([
            { nEdgeid: IDS.box, cStatus: 'C', cKeyFpr: 'f'.repeat(64), cPubKey: 'SECRET-KEY' },
            { nEdgeid: IDS.box2, cStatus: 'A', cKeyFpr: 'e'.repeat(64), cPubKey: 'SECRET-KEY' },
        ] as any);
        const l = await send('GET', 'edge/admin/list', {}, token(IDS.admin));
        expect(l.body.boxes.map((b: any) => b.cKeyFpr)).toEqual([null, 'e'.repeat(64)]);
        expect(JSON.stringify(l.body)).not.toContain('SECRET-KEY');
        expect(JSON.stringify(l.body)).not.toContain('f'.repeat(64));
        registry.getNode.mockResolvedValueOnce({ node: { nEdgeid: IDS.box, cStatus: 'C', cKeyFpr: 'f'.repeat(64), cPubKey: 'SECRET-KEY' }, cases: [] } as any);
        const g = await send('GET', 'edge/admin/get', { nEdgeid: IDS.box }, token(IDS.admin));
        expect(g.body.box).toMatchObject({ nEdgeid: IDS.box, cStatus: 'C', cKeyFpr: null });
        expect(JSON.stringify(g.body)).not.toContain('SECRET-KEY');
        expect(JSON.stringify(g.body)).not.toContain('f'.repeat(64));
    });

    it('never returns route hashes or the device key in admin reads, and the assignments read raises no alert (G2)', async () => {
        const a = await send('GET', 'edge/admin/assignments', { nEdgeid: IDS.box }, token(IDS.admin));
        expect(registry.assignments).toHaveBeenCalledWith(IDS.box, { alertMissingRoutes: false });
        expect(JSON.stringify(a.body)).not.toContain('HASH');
        expect(a.body.snapshot.sessions[0]).toMatchObject({ hasRoute: true, cEclipseUsername: 'u' });
        const g = await send('GET', 'edge/admin/get', { nEdgeid: IDS.box }, token(IDS.admin));
        expect(JSON.stringify(g.body)).not.toContain('SECRET-KEY');
        const s = await send('GET', 'edge/admin/status', { nEdgeid: IDS.box }, token(IDS.admin));
        expect(s.body.alerts).toEqual([{ kind: 'FORK', nEdgeid: IDS.box }]);
    });

    it('rejects undeclared keys and malformed ids (global ValidationPipe)', async () => {
        expect((await send('POST', 'edge/admin/create', { cName: 'x', nMasterid: IDS.user }, token(IDS.admin))).status).toBe(400);
        expect((await send('POST', 'session/edge/split', { nSesid: 'nope' }, token(IDS.admin))).status).toBe(400);
        expect((await send('GET', 'edge/admin/events', {}, token(IDS.admin))).status).toBe(400);
    });

    it("C3: edge/admin/events takes an optional cType (the FE's \"Venue box ready\" asks for 'ready' only), validated like the column", async () => {
        const res = await send('GET', 'edge/admin/events', { nSesid: IDS.ses, cType: 'ready' }, token(IDS.admin));
        expect(res.status).toBe(200);
        expect(registry.events).toHaveBeenCalledWith({ nEdgeid: null, nSesid: IDS.ses, cType: 'ready' });
        await send('GET', 'edge/admin/events', { nEdgeid: IDS.box }, token(IDS.admin));
        expect(registry.events).toHaveBeenLastCalledWith({ nEdgeid: IDS.box, nSesid: null, cType: null });
        for (const cType of ['Ready', "ready'; --", 'x'.repeat(31), '']) {
            expect((await send('GET', 'edge/admin/events', { nSesid: IDS.ses, cType }, token(IDS.admin))).status).toBe(400);
        }
        expect(registry.events).toHaveBeenCalledTimes(2);
    });

    describe('device routes', () => {
        it('serves a challenge without a token, rate-limited per address and per (address, box), never per box alone (review #2)', async () => {
            const from = (ip: string, edgeId: string = IDS.box2) => request(app.getHttpServer()).get('/edge/v1/challenge').query({ edgeId }).set('x-real-ip', ip);
            const res = await from('198.51.100.1');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ msg: 1, nonce: 'n'.repeat(64), expiresInSec: 60 });
            // One address asking for one box: 20 a minute.
            for (let k = 0; k < 19; k++) expect((await from('198.51.100.1')).status).toBe(200);
            expect((await from('198.51.100.1')).status).toBe(429);
            // Someone spending that budget for the box's (public) id does not keep the box itself off the uplink.
            expect((await from('203.0.113.9')).status).toBe(200);
            // One address across boxes: 30 a minute.
            for (let k = 0; k < 30; k++) expect((await from('198.51.100.2', k % 2 ? IDS.box : IDS.box2)).status).toBe(200);
            expect((await from('198.51.100.2', IDS.ses)).status).toBe(429);
            expect((await send('GET', 'edge/v1/challenge', { edgeId: 'nope' })).status).toBe(400);
        });

        it('enrols without a token and validates the body', async () => {
            const res = await send('POST', 'edge/v1/enroll', { code: 'AAAAA-BBBBB', cPubKey: 'k', bTpmKey: 'true' });
            expect(res.status).toBe(201);
            expect(registry.enroll).toHaveBeenCalledWith(expect.objectContaining({ code: 'AAAAA-BBBBB', cPubKey: 'k', bTpmKey: true }));
            expect((await send('POST', 'edge/v1/enroll', { code: 'x', cPubKey: 'k', extra: 1 })).status).toBe(400);
        });

        it('bounds enrolment attempts overall (60/min), not only per address: spoofed or distributed addresses cannot guess on', async () => {
            const enrol = (ip: string) => request(app.getHttpServer()).post('/edge/v1/enroll').set('x-real-ip', ip).send({ code: 'AAAAA-BBBBB', cPubKey: 'k' });
            const statuses: number[] = [];
            for (let k = 0; k < 61; k++) statuses.push((await enrol(`198.51.100.${k + 1}`)).status);
            // (an earlier test of this file may have spent a couple of the 60 already)
            const first = statuses.indexOf(429);
            expect(first).toBeGreaterThanOrEqual(57);
            expect(statuses.slice(0, first).every(s => s === 201)).toBe(true);
            expect(statuses.slice(first).every(s => s === 429)).toBe(true);
        });

        it('requires a device signature for a certificate (401), then answers 501 until an issuer exists (Phase 3)', async () => {
            const body = { edgeId: IDS.box, nonce: 'a'.repeat(64), sig: 'sig', csr: '-----BEGIN CERTIFICATE REQUEST-----\nAAAA\n-----END CERTIFICATE REQUEST-----' };
            expect((await send('POST', 'edge/v1/cert', body)).status).toBe(401);
            auth.authenticateDevice.mockResolvedValueOnce({ ok: true, nEdgeid: IDS.box, node: { nEdgeid: IDS.box } });
            expect((await send('POST', 'edge/v1/cert', body)).status).toBe(501);
            expect(auth.authenticateDevice.mock.calls[1][0]).toMatchObject({ allow: ['A'] });
            expect((await send('POST', 'edge/v1/cert', { ...body, csr: 'not pem !!' })).status).toBe(400);
        });

        it('gives a presigned archive URL only to the bound box, and 503 while no archive is configured', async () => {
            const body = { edgeId: IDS.box, nonce: 'a'.repeat(64), sig: 'sig', nSesid: IDS.ses, sha256: 'b'.repeat(64), bytes: 10 };
            auth.authenticateDevice.mockResolvedValue({ ok: true, nEdgeid: IDS.box, node: {} });
            expect((await send('POST', 'edge/v1/archive-url', body)).status).toBe(503);
            rawStore.archive.presignPut.mockResolvedValueOnce({ url: 'https://spaces/x', key: 'k' });
            expect((await send('POST', 'edge/v1/archive-url', body)).body).toEqual({ msg: 1, url: 'https://spaces/x', key: 'k' });
            auth.authenticateDevice.mockResolvedValue({ ok: true, nEdgeid: IDS.box2, node: {} });
            expect((await send('POST', 'edge/v1/archive-url', body)).status).toBe(403);
            auth.authenticateDevice.mockReset();
            auth.authenticateDevice.mockImplementation(async () => ({ ok: false, code: 'UNAUTHORIZED', message: 'bad' }));
        });
    });

    it('answers 503 DISABLED on every route while EDGE_ENABLED is off', async () => {
        env.EDGE_ENABLED = '0';
        const a = await send('GET', 'edge/admin/list', {}, token(IDS.admin));
        expect(a.status).toBe(503);
        expect(a.body.cCode).toBe('DISABLED');
        expect((await send('GET', 'edge/v1/challenge', { edgeId: IDS.box })).status).toBe(503);
        expect((await send('POST', 'session/edge/split', { nSesid: IDS.ses }, token(IDS.admin))).status).toBe(503);
        expect(registry.listNodes).not.toHaveBeenCalled();
    });

    it('pemDer decodes a PEM block and refuses garbage', () => {
        expect(pemDer('-----BEGIN X-----\nAAEC\n-----END X-----')).toEqual(Buffer.from([0, 1, 2]));
        expect(pemDer('')).toBeNull();
        expect(pemDer('%%%')).toBeNull();
    });
});
