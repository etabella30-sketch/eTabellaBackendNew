/**
 * INTEROP: the REAL venue box uplink (apps/rt-edge: EdgeUplink with its own P-256 device key, the real kernel with
 * its CAT listener and journal, node:sqlite state) against the REAL cloud edge module (EdgeModule booted in a Nest
 * HTTP app with realtime-server main.ts's global ValidationPipe and HttpErrorFilter: EdgeController, device auth,
 * EdgeUplinkGateway on the shared socket.io server, EdgeSyncService, EdgeRawStoreService, EdgeRegistryService), on
 * 127.0.0.1 port 0. `/realtimeapi` is stripped in front of the app as nginx does in production.
 *
 * Only three things are fakes: the database (FakeEdgeDb: the 2026-10-01 SP semantics, every call checked against
 * the migrations' contract), Redis (FakeRedis) and the page-store apply port (MemoryApplyPort). Nothing leaves the
 * machine; the journals live in temp dirs.
 *
 * Proves: enrol (REST, 128-bit code) → KEY_UNCONFIRMED → fingerprint confirm → connect; bind push → arm → e.ready →
 * hello → rounds in order applied through the apply port; raw lane appended and chain-checked (cloud journal ==
 * box journal); end → signed seal accepted (K) on both sides; reconnect and cloud restart resume from the hello
 * diff with nothing lost or duplicated (D18 recompute); a forced FORK freezes both sides (D19); split (D7) ends
 * Part 1 on the box, which still seals it; revoke disconnects and refuses every reconnect; a wrong key is refused.
 */
import { Global, INestApplication, Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import type { AddressInfo } from 'net';
import * as path from 'path';
import { io as ioClient } from 'socket.io-client';
import * as request from 'supertest';

import { sealSigningPayload } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { AppGateway } from '@app/global/modules/websocket.module';
import { readJournal, RecordType } from '@app/rt-ingest';

import { bridgeLines, copyDir, eclipse, EclipseClient, sleep, waitFor } from '../../../rt-edge/src/kernel/testing/kernel-harness';
import { DeviceKey, edgeAuthPayload, verifyDeviceSignature as boxVerify } from '../../../rt-edge/src/uplink/device-key';
import { EdgeBox, edgeBox, lineNumbers, range } from '../../../rt-edge/src/uplink/testing/edge-box';
import { EDGE_ASSIGN_PUSH, EdgeAssignPush } from '../services/transcript-completeness/edge-assign-push';
import { EDGE_APPLY_PORT } from './edge-apply.port';
import { EDGE_ARCHIVE_PORT, EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeRegistryService } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { EdgeModule } from './edge.module';
import { EDGE_OPTIONS, EdgeModuleOptions } from './edge.types';
import { FakeEdgeDb, FakeRedis, IDS, MemoryApplyPort, rmTemp, tempDir } from './edge-test-kit.spec';

jest.setTimeout(120_000);

const SECRET = 'edge-interop-jwt-secret';
const SES = IDS.ses;
const USER = 'eclipse-court3';
const PASS = 'pw-court3-7Q';

/** Fast but production-shaped cloud timings; the per-box challenge limit is raised for the box's fast test backoff. */
const CLOUD_OPTIONS: EdgeModuleOptions = {
    timings: { viewerOnlineAfterMs: 50, viewerOfflineAfterMs: 50, silentPageAfterMs: 60_000 },
    rateLimits: { challengePerBox: 10_000, challengePerIp: 10_000 },
    // limits.maxPart in the hello reply: small parts make every catch-up round multi-part on the wire.
    maxPartBytes: 4_096,
};

/** The cloud: one Nest app per start(); the database, Redis, the page store and the journals survive a restart. */
class Cloud {
    readonly dir = tempDir('interop-cloud');
    readonly db = new FakeEdgeDb();
    readonly redis = new FakeRedis();
    readonly apply = new MemoryApplyPort();
    readonly routeFile = path.join(this.dir, 'routes.json');
    readonly journalDir = path.join(this.dir, 'journal');
    readonly env: Record<string, unknown>;
    app: INestApplication | null = null;
    port = 0;
    starts = 0;
    /** Bytes PUT to the presigned archive URLs (the DO Spaces stand-in), by object key. */
    readonly uploads = new Map<string, Buffer>();
    /** The archive port (Phase-2 infra; here a presigner pointing back at this server's /upload/). */
    readonly archive = {
        archiveJournal: async () => null,
        uploadCapture: async () => null,
        presignPut: async (input: { nEdgeid: string; nSesid: string; sha256: string; bytes: number }) => ({ url: `${this.origin}/upload/${input.nSesid}-${input.sha256}`, key: `rt-captures/${input.nSesid}/${input.sha256}` }),
    };

    constructor() {
        fs.writeFileSync(this.routeFile, '[]');
        this.env = {
            EDGE_ENABLED: '1',
            JWT_SECRET: SECRET,
            EDGE_JOURNAL_DIR: this.journalDir,
            EDGE_CAPTURE_DIR: path.join(this.dir, 'captures'),
            ECLIPSE_SESSION_CONFIG: this.routeFile,
            ECLIPSE_FEED_HOST: 'cloud.example',
            ECLIPSE_AUTH_PORT: '2500',
        };
        // The admin's browser session (RealtimeAuthMiddleware: Redis user/<id>).
        void this.redis.setValue(`user/${IDS.admin}`, JSON.stringify({ id: 'b-admin', a: true }));
        this.db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.operator, isCaseAdmin: true, cFname: 'Hana', cLname: 'Operator' });
    }

    get origin(): string {
        return `http://127.0.0.1:${this.port}`;
    }
    get gateway(): EdgeUplinkGateway {
        return this.app.get(EdgeUplinkGateway);
    }
    get sync(): EdgeSyncService {
        return this.app.get(EdgeSyncService);
    }
    get raw(): EdgeRawStoreService {
        return this.app.get(EdgeRawStoreService);
    }
    get registry(): EdgeRegistryService {
        return this.app.get(EdgeRegistryService);
    }

    async start(): Promise<void> {
        const env = this.env;
        @Global()
        @Module({
            providers: [
                { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
                { provide: EDGE_OPTIONS, useValue: CLOUD_OPTIONS },
                { provide: EDGE_ARCHIVE_PORT, useValue: this.archive },
            ],
            exports: [ConfigService, EDGE_OPTIONS, EDGE_ARCHIVE_PORT],
        })
        class InteropGlobals { }
        const moduleRef = await Test.createTestingModule({ imports: [InteropGlobals, EdgeModule] })
            .overrideProvider(DbService).useValue(this.db)
            .overrideProvider(RedisDbService).useValue(this.redis)
            .overrideProvider(EDGE_APPLY_PORT).useValue(this.apply)
            .compile();
        const app = moduleRef.createNestApplication({ logger: false });
        // nginx: /realtimeapi/* → realtime-server /*
        app.use((req: any, _res: any, next: () => void) => {
            if (typeof req.url === 'string' && req.url.startsWith('/realtimeapi/')) req.url = req.url.slice('/realtimeapi'.length);
            next();
        });
        // The presigned PUT target (DO Spaces in production).
        app.use('/upload', (req: any, res: any) => {
            const chunks: Buffer[] = [];
            req.on('data', (c: Buffer) => chunks.push(c));
            req.on('end', () => {
                this.uploads.set(String(req.url).replace(/^\//, ''), Buffer.concat(chunks));
                res.status(200).end();
            });
        });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.listen(this.port, '127.0.0.1');
        this.port = (app.getHttpServer().address() as AddressInfo).port;
        this.app = app;
        this.starts += 1;
    }

    /** A cloud restart or outage: every socket drops, memory is lost, the stores stay. */
    async stop(): Promise<void> {
        const app = this.app;
        this.app = null;
        if (!app) return;
        await app.get(EdgeSyncService).flushMetaWrites();
        await app.close();
    }

    async dispose(): Promise<void> {
        await this.stop().catch(() => undefined);
        rmTemp(this.dir);
    }

    /** A request as the global admin, through the nginx prefix. */
    admin(method: 'GET' | 'POST', route: string, data: Record<string, unknown> = {}) {
        const token = jwt.sign({ userId: IDS.admin, broweserId: 'b-admin' }, SECRET);
        const server = this.app.getHttpServer();
        const r = method === 'GET' ? request(server).get(`/realtimeapi/${route}`).query(data) : request(server).post(`/realtimeapi/${route}`).send(data);
        return r.set('Authorization', `Bearer ${token}`);
    }

    /** The server sockets on /edge (to drop them as a network failure would). */
    edgeSockets(): any[] {
        const io: any = this.app.get(AppGateway).server;
        return [...io.of('/edge').sockets.values()];
    }

    /** How many challenges the cloud issued (each connection attempt of a box takes one). */
    challenges(): number {
        return this.redis.sets.filter(([k]) => String(k).startsWith('edge:nonce:')).length;
    }

    /**
     * What step 8's EclipseSessionService does for an 'E' create: et_rtedge_session_bind (here: the fake row), the
     * DORMANT route (base64 scrypt salt / hash as writeEclipseRoute writes them, node's default N), then the
     * registry's c.assign upsert push.
     */
    async bindSession(nEdgeid: string, nSesid = SES): Promise<{ delivered: boolean; reason?: string }> {
        this.db.assignCase(nEdgeid, IDS.caseA, { cCaseno: 'HC-2026-001', cCasename: 'Okafor v Shah' });
        this.db.addSession({ nSesid, nEdgeid, nCaseid: IDS.caseA, cName: 'Day 3', cParserVer: FEED_PARSE_VERSION, nHearingOpid: IDS.operator });
        const salt = randomBytes(16);
        const routes = JSON.parse(fs.readFileSync(this.routeFile, 'utf8'));
        routes.push({
            nSesid,
            nCaseid: IDS.caseA,
            label: 'Day 3',
            nLines: 25,
            user: USER,
            cTimezone: 'Europe/London',
            passwordSalt: salt.toString('base64'),
            passwordHash: scryptSync(PASS, salt, 32).toString('base64'),
            passwordEnc: 'v1.never-sent-to-a-box',
            feedSource: 'E',
            nEdgeid,
            epoch: 1,
        });
        fs.writeFileSync(this.routeFile, JSON.stringify(routes));
        return this.registry.pushSessionUpsert(nEdgeid, nSesid);
    }

    /** What step 8's SessionService does on RT Production Stop: et_rtedge_session_end, then EDGE_ASSIGN_PUSH(end). */
    async endSession(nEdgeid: string, nSesid = SES): Promise<unknown> {
        const s = this.db.sessions.get(nSesid);
        s.cSyncState = 'S';
        s.cStatus = 'C';
        return this.app.get<EdgeAssignPush>(EDGE_ASSIGN_PUSH)(nEdgeid, { op: 'end', nSesid });
    }

    pages(nSesid = SES): unknown[][] {
        const m = this.apply.store(nSesid);
        return [...m.keys()].sort((a, b) => a - b).map(p => m.get(p));
    }
}

/** Box and cloud hold the same transcript, root and raw chain head, and nothing is in flight. */
function converged(box: EdgeBox, cloud: Cloud, nSesid = SES): boolean {
    if (!cloud.app) return false;
    const view = box.kernel.view(nSesid);
    const head = box.kernel.rawHead(nSesid);
    const meta = cloud.sync.peekMeta(nSesid);
    if (!view || !head || !meta || head.durableSeq !== head.headSeq) return false;
    const raw = cloud.raw.head(nSesid);
    return meta.root === view.root && meta.totalLines === view.totalLines && raw.seq === head.headSeq && raw.hash === head.headHash;
}

async function waitConverged(box: EdgeBox, cloud: Cloud, what: string, extra: () => boolean = () => true, ms = 30_000): Promise<void> {
    try {
        await waitFor(() => converged(box, cloud) && extra(), ms, what);
    } catch (err) {
        const view = box.kernel.view(SES);
        const meta = cloud.app ? cloud.sync.peekMeta(SES) : null;
        const dump = {
            box: { link: box.uplink.cloudLink(), sync: box.uplink.session(SES), view: view && { rev: view.rev, totalLines: view.totalLines, root: view.root }, raw: box.kernel.rawHead(SES), identity: box.state.identity.get(), alerts: box.events.of('alert').map(a => `${a.kind}: ${a.message}`) },
            cloud: { meta: meta && { appliedRev: meta.appliedRev, appliedRawSeq: meta.appliedRawSeq, totalLines: meta.totalLines, root: meta.root, frozen: meta.frozen }, raw: cloud.app && cloud.raw.head(SES), alerts: cloud.app && cloud.registry.recentAlerts().map(a => `${a.kind}: ${a.message}`), contract: cloud.db.contractViolations },
        };
        throw new Error(`${(err as Error).message}\n${JSON.stringify(dump, null, 1)}`);
    }
}

/** The cloud raw store is the box journal, record for record (both read back with CRC + chain verification). */
async function expectSameJournal(box: EdgeBox, cloud: Cloud, nSesid = SES): Promise<void> {
    const cloudJournal = await readJournal({ root: cloud.journalDir, nSesid, repair: false });
    const boxJournal = await readJournal({ root: box.config.paths.journalDir, nSesid, repair: false });
    expect(cloudJournal.records.map(r => r.hash.toString('hex'))).toEqual(boxJournal.records.map(r => r.hash.toString('hex')));
    expect(cloudJournal.records.map(r => r.seq)).toEqual(range(1, boxJournal.records.length + 1));
}

describe('edge interop: the real box uplink against the real cloud /edge module', () => {
    let cloud: Cloud;
    const boxes: EdgeBox[] = [];
    const clients: EclipseClient[] = [];

    const newBox = (dir?: string): EdgeBox => {
        const b = edgeBox({ dir, cloudOrigin: cloud.origin, uplink: { backoffBaseMs: 40, backoffMaxMs: 250 } });
        boxes.push(b);
        return b;
    };

    /** Venue boxes → Add (admin, REST): the 128-bit code shown once. */
    async function addBoxOnCloud(): Promise<{ nEdgeid: string; code: string; qrText: string }> {
        const res = await cloud.admin('POST', 'edge/admin/create', { cName: 'Court 3', cVenue: 'Rolls Building' });
        expect(res.status).toBe(201);
        expect(res.body.enroll).toMatchObject({ bits: 128 });
        expect(res.body.enroll.code).toMatch(/^[A-Z2-7]{5}(-[A-Z2-7]{5}){4}-[A-Z2-7]$/);
        return { nEdgeid: res.body.node.nEdgeid, code: res.body.enroll.code, qrText: res.body.enroll.qrText };
    }

    /** Add → enrol → confirm → connected and helloed (the whole §3.4 install), returning the started box. */
    async function linkedBox(): Promise<{ box: EdgeBox; nEdgeid: string }> {
        const { nEdgeid, code } = await addBoxOnCloud();
        const box = newBox();
        await box.uplink.enrol({ code });
        await box.start();
        await waitFor(() => box.state.identity.get()?.linkFailure === 'key-refused', 15_000, 'KEY_UNCONFIRMED refusal');
        const res = await cloud.admin('POST', 'edge/admin/confirm-key', { nEdgeid, cKeyFpr: box.state.identity.get()!.keyFingerprint });
        expect(res.status).toBe(201);
        await waitFor(() => box.uplink.status().online && box.state.identity.get()?.status === 'active', 15_000, 'connected after the confirmation');
        return { box, nEdgeid };
    }

    /** A bound session armed on the box, helloed 'continue', and an Eclipse client feeding it. */
    async function liveSession(box: EdgeBox, nEdgeid: string): Promise<EclipseClient> {
        expect(await cloud.bindSession(nEdgeid)).toEqual({ delivered: true });
        await waitFor(() => box.kernel.session(SES)?.localState === 'armed', 15_000, 'armed on the box');
        await waitFor(() => box.uplink.session(SES)?.verdict === 'continue' && box.uplink.status().online, 15_000, 'hello continue');
        const client = await eclipse(box.kernel.listenAddress()!.port, USER, PASS);
        clients.push(client);
        return client;
    }

    beforeAll(() => Logger.overrideLogger(false));
    beforeEach(async () => {
        cloud = new Cloud();
        await cloud.start();
    });
    afterEach(async () => {
        for (const c of clients.splice(0)) await c.end().catch(() => undefined);
        for (const b of boxes.splice(0)) await b.close().catch(() => undefined);
        await cloud.dispose();
    });

    it('enrols over REST with the one-time 128-bit code, is refused KEY_UNCONFIRMED until the admin confirms the console fingerprint, then connects', async () => {
        const { nEdgeid, code, qrText } = await addBoxOnCloud();
        expect(qrText).toBe(`etabella-edge enroll --cloud https://etabella.net --code ${code}`);
        const box = newBox();
        const enrolled = await box.uplink.enrol({ code });
        // The box's key, as the cloud recorded it (et_rtedge_enroll computes the fingerprint from the SPKI).
        const node = cloud.db.nodes.get(nEdgeid);
        expect(node).toMatchObject({ cStatus: 'C', cPubKey: box.state.identity.get()!.publicKeySpki, cEnrollHash: null });
        expect(enrolled).toMatchObject({ nEdgeid, status: 'pending-confirm', keyFingerprint: node.cKeyFpr.toUpperCase().match(/.{2}/g)!.join(':') });
        // Single use: the same code again is refused (400 through the HttpErrorFilter).
        const again = await request(cloud.app.getHttpServer()).post('/realtimeapi/edge/v1/enroll').send({ code, cPubKey: DeviceKey.generate().spkiB64() });
        expect(again.status).toBe(400);

        await box.start();
        await waitFor(() => box.state.identity.get()?.linkFailure === 'key-refused', 15_000, 'KEY_UNCONFIRMED');
        expect(cloud.gateway.connections()).toEqual([]);
        expect(box.uplink.cloudLink().state).toBe('not-linked');

        // A mistyped fingerprint is refused and audited; the console's fingerprint confirms.
        const wrong = await cloud.admin('POST', 'edge/admin/confirm-key', { nEdgeid, cKeyFpr: 'AA:'.repeat(31) + 'AA' });
        expect(wrong.status).toBe(409);
        expect(cloud.db.nodes.get(nEdgeid).cStatus).toBe('C');
        const ok = await cloud.admin('POST', 'edge/admin/confirm-key', { nEdgeid, cKeyFpr: box.state.identity.get()!.keyFingerprint });
        expect(ok.status).toBe(201);
        expect(ok.body).toMatchObject({ msg: 1, cStatus: 'A' });

        await waitFor(() => box.uplink.status().online, 15_000, 'connected');
        expect(box.state.identity.get()).toMatchObject({ status: 'active', linkFailure: null, tpmKey: false });
        expect(cloud.gateway.connection(nEdgeid)).toMatchObject({ nEdgeid, status: 'A' });
        await waitFor(() => cloud.db.eventsOf('online').length >= 1, 5_000, 'online audited');
        expect(cloud.db.eventsOf('confirm_key_mismatch')).toHaveLength(1);
        // The box reports status every interval; the cloud keeps it for the admin screen, incl. the egress address
        // the cloud told it in the hello reply.
        await waitFor(() => cloud.registry.sessionStatus(nEdgeid, 'none') !== null, 5_000, 'e.status');
        await waitFor(async () => (await cloud.registry.liveStatus(nEdgeid))?.status?.device?.egressIp === '127.0.0.1', 5_000, 'egressIp in e.status');
        expect((await cloud.registry.liveStatus(nEdgeid))!.status.device).toMatchObject({ sw: '0.0.0-dev', parserVer: FEED_PARSE_VERSION });
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('hello → rounds in order through the apply port → raw lane chain-checked → end → signed seal K on both sides', async () => {
        const { box, nEdgeid } = await linkedBox();
        const client = await liveSession(box, nEdgeid);
        await waitFor(() => cloud.db.eventsOf('ready').length === 1, 5_000, 'e.ready audited');
        // The assignment the box stored came from the cloud's snapshot: case name and hearing operator name.
        expect(box.state.sessions.get(SES)).toMatchObject({ nCaseid: IDS.caseA, cName: 'Day 3', parserVer: FEED_PARSE_VERSION });
        expect(box.state.assignments.case(IDS.caseA)).toMatchObject({ cCasename: 'Okafor v Shah', cCaseno: 'HC-2026-001' });

        await client.send(bridgeLines(0, 70));
        await waitConverged(box, cloud, 'first rounds', () => cloud.sync.peekMeta(SES).totalLines >= 71);
        await client.send(bridgeLines(70, 30));
        await waitConverged(box, cloud, 'more rounds', () => cloud.sync.peekMeta(SES).totalLines >= 101);
        await client.send(bridgeLines(100, 20));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 121, 15_000, '120 lines on the box');
        await waitConverged(box, cloud, 'cloud == box');

        // Pages: applied in rev order through the apply port, the cloud store equals the box, nothing re-canonicalised.
        const revs = cloud.apply.applied.filter(a => a.nSesid === SES).map(a => a.plan.rev);
        expect(revs.length).toBeGreaterThanOrEqual(3);
        expect([...revs].sort((a, b) => a - b)).toEqual(revs);
        expect(new Set(revs).size).toBe(revs.length);
        expect(JSON.stringify(cloud.pages())).toBe(JSON.stringify(box.kernel.pages(SES)));
        expect(lineNumbers(cloud.pages() as any)).toEqual(range(0, 120));
        expect(cloud.apply.broadcasts.filter(b => b.nSesid === SES).length).toBe(revs.length);
        // D19: the cloud holds the box's OWN chain hash at the last applied seq.
        const meta = cloud.sync.peekMeta(SES);
        expect(meta.appliedRawHash).toBe(await box.kernel.rawHashAt(SES, meta.appliedRawSeq!));
        // Raw lane: the cloud journal is the box journal, each read back CRC- and chain-verified.
        await expectSameJournal(box, cloud);
        expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', verdict: 'continue', dirtyPages: 0, lagBytes: 0 });
        expect(box.uplink.cloudLink().state).toBe('synced');

        // RT Production Stop: the box drains, ends, uploads the tail and sends its signed seal.
        await cloud.endSession(nEdgeid);
        await waitFor(() => cloud.db.sessions.get(SES).cSyncState === 'K', 30_000, 'sealed K in the cloud');
        await waitFor(() => box.state.sessions.get(SES)?.localState === 'sealed', 10_000, 'sealed on the box');
        expect(box.state.sessions.get(SES)).toMatchObject({ sealState: 'K', cloudOp: 'end' });
        expect(box.uplink.session(SES)).toMatchObject({ sealState: 'K' });
        const sealed = cloud.db.eventsOf('seal');
        expect(sealed).toHaveLength(1);
        const seal = JSON.parse(sealed[0].jData.seal);
        expect(boxVerify(box.state.identity.get()!.publicKeySpki, sealSigningPayload(seal), seal.sig)).toBe(true);
        // The sealed meta is persisted (Redis, edge-meta.json); the raw store's per-record index left memory.
        const persisted = JSON.parse(await cloud.redis.getValue(`edge:meta:${SES}`));
        expect(persisted).toMatchObject({ sealed: { state: 'K' }, totalLines: 121 });
        expect(JSON.parse(fs.readFileSync(path.join(cloud.journalDir, SES, 'edge-meta.json'), 'utf8'))).toMatchObject({ sealed: { state: 'K' } });
        expect(cloud.sync.peekMeta(SES)).toMatchObject({ sealed: { state: 'K' }, totalLines: 121 });
        expect(cloud.raw.loadedSessions()).not.toContain(SES);
        expect(seal).toMatchObject({ nSesid: SES, epoch: 1, totalLines: 121, finalRev: persisted.appliedRev, root: persisted.root, endedBy: 'cloud' });
        const cloudJournal = await readJournal({ root: cloud.journalDir, nSesid: SES, repair: false });
        expect(cloudJournal.records[cloudJournal.records.length - 1].type).toBe(RecordType.SESSION_END);
        expect(seal.rawFinalSeq).toBe(cloudJournal.records.length);
        expect(cloud.db.sessions.get(SES)).toMatchObject({ nFinalLines: 121, cFinalDigest: seal.root, nRawFinalSeq: seal.rawFinalSeq, cRawFinalHash: seal.rawFinalHash });
        expect(cloud.apply.ended).toEqual([{ nSesid: SES, nCaseid: IDS.caseA }]);
        expect(cloud.sync.viewerState(SES)).toBe('sealed');
        // No alert at all on either side (a protocol mismatch would surface as one), and every SP call matched.
        expect(box.events.of('alert').filter(a => a.tier !== 'info').map(a => `${a.source} ${a.kind}: ${a.message}`)).toEqual([]);
        expect(cloud.registry.recentAlerts().filter(a => a.tier !== 'info').map(a => `${a.kind}: ${a.message}`)).toEqual([]);
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('resumes after a dropped connection and after a cloud restart (D18 recompute) with nothing lost, duplicated or reordered', async () => {
        const { box, nEdgeid } = await linkedBox();
        let client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 40));
        await waitConverged(box, cloud, 'first 40 lines', () => cloud.sync.peekMeta(SES).totalLines >= 41);

        // 1. The network drops the socket (no refusal): the same boot reconnects and the hello diff resumes.
        const connectsBefore = cloud.db.eventsOf('online').length;
        for (const s of cloud.edgeSockets()) s.disconnect(true);
        await client.send(bridgeLines(40, 20));
        await waitFor(() => cloud.db.eventsOf('online').length > connectsBefore, 15_000, 'reconnected');
        await waitConverged(box, cloud, 'after the reconnect', () => cloud.sync.peekMeta(SES).totalLines >= 61);
        expect(cloud.gateway.connection(nEdgeid)?.bootId).toBe(cloud.db.eventsOf('online')[0].jData.bootId);

        // 2. The cloud restarts mid-hearing: memory is gone, Redis / edge-meta.json / pages / journal stay.
        await cloud.stop();
        await waitFor(() => !box.uplink.status().online, 10_000, 'offline');
        await client.send(bridgeLines(60, 30));
        await client.end();
        client = await eclipse(box.kernel.listenAddress()!.port, USER, PASS);
        clients.push(client);
        await client.send(bridgeLines(90, 30));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 121, 15_000, 'lines recorded offline');
        expect(box.uplink.status().pendingPages).toBeGreaterThan(0);
        const offlineRoot = box.kernel.view(SES)!.root;
        await cloud.start();
        // Record the parts as the gateway hands them over (the catch-up round is staged out of parts, §5.5).
        const parts: Array<{ rev: number; part: number; parts: number }> = [];
        const round = cloud.sync.round.bind(cloud.sync);
        jest.spyOn(cloud.sync, 'round').mockImplementation(async (conn, part) => {
            parts.push({ rev: part.rev, part: part.part, parts: part.parts });
            return round(conn, part);
        });
        await waitConverged(box, cloud, 'caught up after the restart');
        expect(parts.some(p => p.parts > 1)).toBe(true);
        const multi = parts.filter(p => p.parts > 1);
        expect(new Set(multi.filter(p => p.rev === multi[0].rev).map(p => p.part)).size).toBe(multi[0].parts);
        expect(cloud.sync.peekMeta(SES).root).toBe(offlineRoot);
        expect(JSON.stringify(cloud.pages())).toBe(JSON.stringify(box.kernel.pages(SES)));
        expect(lineNumbers(cloud.pages() as any)).toEqual(range(0, 120));
        await expectSameJournal(box, cloud);
        const revs = cloud.apply.applied.filter(a => a.nSesid === SES).map(a => a.plan.rev);
        expect([...revs].sort((a, b) => a - b)).toEqual(revs);
        expect(new Set(revs).size).toBe(revs.length);
        expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', verdict: 'continue', frozenAtMs: null });
        expect(cloud.sync.peekMeta(SES).frozen).toBeFalsy();
        expect(cloud.registry.recentAlerts().filter(a => a.tier === 'P1')).toEqual([]);
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('RECOVER (MR-3): a box image behind the cloud raw store, still continuing the applied history, pulls the records back over e.rawpull', async () => {
        const { box, nEdgeid } = await linkedBox();
        let client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.sync.peekMeta(SES).totalLines >= 31);
        await client.end();
        clients.splice(clients.indexOf(client), 1);
        const dir = box.dir;
        await box.close({ keepDir: true });
        boxes.splice(boxes.indexOf(box), 1);
        const image = tempDir('interop-image');
        copyDir(dir, image); // the disk now: every applied round, every acked record

        // The box goes on; the page store is busy (rounds answer BUSY), so only the raw lane passes the image.
        const later = newBox(dir);
        await later.start();
        await waitFor(() => later.uplink.status().online && later.uplink.session(SES)?.verdict === 'continue', 15_000, 'hello continue');
        cloud.apply.isReady = false;
        client = await eclipse(later.kernel.listenAddress()!.port, USER, PASS);
        clients.push(client);
        await client.send(bridgeLines(30, 30));
        await waitFor(() => (later.kernel.view(SES)?.totalLines ?? 0) >= 61, 15_000, 'more lines');
        await waitFor(() => later.kernel.rawHead(SES)?.durableSeq === later.kernel.rawHead(SES)?.headSeq && cloud.raw.head(SES).seq === later.kernel.rawHead(SES)!.headSeq, 15_000, 'raw acked past the rounds');
        const fullRoot = later.kernel.view(SES)!.root;
        expect(cloud.sync.peekMeta(SES).totalLines).toBe(31);
        await client.end();
        clients.splice(clients.indexOf(client), 1);
        await later.close();
        boxes.splice(boxes.indexOf(later), 1);

        // The image comes back: its journal stops before the cloud's raw head but holds the last applied record.
        cloud.apply.isReady = true;
        const pulls: Array<{ fromSeq: number; toSeq: number }> = [];
        const rawPull = cloud.sync.rawPull.bind(cloud.sync);
        jest.spyOn(cloud.sync, 'rawPull').mockImplementation(async (conn, req) => {
            pulls.push({ fromSeq: req.fromSeq, toSeq: req.toSeq });
            return rawPull(conn, req);
        });
        const restored = newBox(image);
        await restored.start();
        await waitConverged(restored, cloud, 'converged after RECOVER', () => cloud.sync.peekMeta(SES).totalLines >= 61);
        expect(pulls.length).toBeGreaterThan(0);
        expect(restored.kernel.view(SES)!.root).toBe(fullRoot);
        expect(lineNumbers(cloud.pages() as any)).toEqual(range(0, 60));
        expect(JSON.stringify(cloud.pages())).toBe(JSON.stringify(restored.kernel.pages(SES)));
        await expectSameJournal(restored, cloud);
        expect(restored.uplink.session(SES)).toMatchObject({ uplinkState: 'ok', frozenAtMs: null });
        expect(cloud.sync.peekMeta(SES).frozen).toBeFalsy();
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('D19 chaos drill: an old image restored while the raw lane lags is frozen by the hello on BOTH sides; no page is replaced', async () => {
        const { box, nEdgeid } = await linkedBox();
        let client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.sync.peekMeta(SES).totalLines >= 31);
        await client.end();
        clients.splice(clients.indexOf(client), 1);
        const dir = box.dir;
        await box.close({ keepDir: true });
        boxes.splice(boxes.indexOf(box), 1);
        const oldImage = tempDir('interop-old-image');
        copyDir(dir, oldImage);

        // The box goes on while the cloud's raw disk is slow: rounds apply ahead of the raw lane (§5.5 example).
        const later = newBox(dir);
        await later.start();
        await waitFor(() => later.uplink.status().online && later.uplink.session(SES)?.verdict === 'continue', 15_000, 'hello continue');
        const slowRaw = jest.spyOn(cloud.raw, 'append').mockImplementation(async (id: string) => ({ expectSeq: cloud.raw.head(id).seq + 1, reason: 'rate' as const, retryAfterMs: 100 }));
        client = await eclipse(later.kernel.listenAddress()!.port, USER, PASS);
        clients.push(client);
        await client.send(bridgeLines(30, 50));
        await waitFor(() => cloud.sync.peekMeta(SES).totalLines >= 81 && cloud.sync.peekMeta(SES).root === later.kernel.view(SES)?.root, 30_000, 'rounds ahead of raw');
        const meta = cloud.sync.peekMeta(SES);
        expect(cloud.raw.head(SES).seq).toBeLessThan(meta.appliedRawSeq!);
        expect(meta.pendingRawChecks!.length).toBeGreaterThan(0);
        await client.end();
        clients.splice(clients.indexOf(client), 1);
        await later.close();
        boxes.splice(boxes.indexOf(later), 1);
        slowRaw.mockRestore();
        const pages = JSON.stringify(cloud.pages());
        const applied = cloud.apply.applied.length;

        // The old image comes back: its journal ends before the last applied round.
        const old = newBox(oldImage);
        await old.start();
        await waitFor(() => old.uplink.session(SES)?.uplinkState === 'frozen', 15_000, 'frozen on the box');
        expect(old.uplink.session(SES)).toMatchObject({ verdict: 'frozen' });
        expect(old.kernel.rawHead(SES)!.headSeq).toBeLessThan(meta.appliedRawSeq!);
        expect(old.state.sessions.get(SES)!.localState).toBe('frozen');
        expect(cloud.sync.peekMeta(SES).frozen).toBe(true);
        expect(cloud.registry.recentAlerts().find(a => a.kind === 'LINEAGE_FROZEN')).toMatchObject({ tier: 'P1', critical: true, nSesid: SES });
        // Recording goes on locally; the cloud takes nothing from it.
        const room = await eclipse(old.kernel.listenAddress()!.port, USER, PASS);
        clients.push(room);
        await room.send(bridgeLines(30, 10));
        await waitFor(() => (old.kernel.view(SES)?.totalLines ?? 0) >= 41, 15_000, 'old box records');
        await sleep(600);
        expect(cloud.apply.applied.length).toBe(applied);
        expect(JSON.stringify(cloud.pages())).toBe(pages);
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('a forced FORK (the cloud last applied another history, D19) freezes the session on BOTH sides; nothing more is applied', async () => {
        const { box, nEdgeid } = await linkedBox();
        const client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.sync.peekMeta(SES).totalLines >= 31);
        const pagesBefore = JSON.stringify(cloud.pages());
        const appliedBefore = cloud.apply.applied.length;
        // The cloud's record of the last applied round is another lineage's (e.g. a clone that synced first).
        cloud.sync.peekMeta(SES).appliedRawHash = 'ab'.repeat(32);

        await client.send(bridgeLines(30, 10));
        await waitFor(() => box.uplink.session(SES)?.uplinkState === 'frozen', 15_000, 'frozen on the box');
        // Cloud: FORK refused the round, froze the session, P1 critical alert, audited; nothing applied.
        const meta = cloud.sync.peekMeta(SES);
        expect(meta.frozen).toBe(true);
        expect(meta.frozenReason).toMatch(/D19/);
        expect(cloud.registry.recentAlerts().find(a => a.kind === 'LINEAGE_FROZEN')).toMatchObject({ tier: 'P1', critical: true, nSesid: SES });
        expect(cloud.db.eventsOf('freeze')).toHaveLength(1);
        // Box: the FORK reply froze its uplink; the room keeps reading locally.
        expect(box.uplink.session(SES)!.frozenReason).toMatch(/FORK/);
        expect(box.state.sessions.get(SES)!.localState).toBe('frozen');
        expect(box.events.of('alert').find(a => a.kind === 'LINEAGE_FROZEN')).toMatchObject({ tier: 'P1', critical: true });
        expect(box.uplink.cloudLink().state).toBe('sync-refused');

        await client.send(bridgeLines(40, 10));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 51, 15_000, 'the box still records');
        await sleep(600);
        expect(cloud.apply.applied.length).toBe(appliedBefore);
        expect(JSON.stringify(cloud.pages())).toBe(pagesBefore);

        // A reconnect does not thaw it: the cloud's hello answers 'frozen', the box stays frozen (an admin splits).
        const connectsBefore = cloud.db.eventsOf('online').length;
        for (const s of cloud.edgeSockets()) s.disconnect(true);
        await waitFor(() => cloud.db.eventsOf('online').length > connectsBefore && box.uplink.session(SES)?.verdict === 'frozen', 15_000, "hello verdict 'frozen'");
        expect(box.uplink.session(SES)).toMatchObject({ uplinkState: 'frozen' });
        await sleep(400);
        expect(cloud.apply.applied.length).toBe(appliedBefore);
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('split to direct cloud (D7): Part 2 takes the same login; the box gets op end for Part 1, uploads its tail and still seals it', async () => {
        const { box, nEdgeid } = await linkedBox();
        const client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 30));
        await waitConverged(box, cloud, 'synced', () => cloud.sync.peekMeta(SES).totalLines >= 31);
        const route = JSON.parse(fs.readFileSync(cloud.routeFile, 'utf8'))[0];

        const res = await cloud.admin('POST', 'session/edge/split', { nSesid: SES, cNote: 'box flaky' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ msg: 1, nSesid: SES, nPartNo: 2, cEclipseUsername: USER, bRouteMoved: true, reporter: { mode: 'listen' } });
        const part2 = res.body.nPart2Sesid;
        expect(cloud.db.sessions.get(part2)).toMatchObject({ cFeedSource: 'D', nPrevPartSesid: SES, nPartNo: 2 });
        expect(cloud.db.sessions.get(SES)).toMatchObject({ cSyncState: 'S', nPartNo: 1 });
        const routes = JSON.parse(fs.readFileSync(cloud.routeFile, 'utf8'));
        expect(routes.map((r: any) => r.nSesid)).toEqual([part2]);
        expect(routes[0]).toMatchObject({ user: USER, passwordSalt: route.passwordSalt, passwordHash: route.passwordHash, feedSource: 'D' });

        // The reporter's closing lines still reach the box; it ends Part 1, uploads the tail and seals it.
        await client.send(bridgeLines(30, 5));
        await waitFor(() => ['K', 'W'].includes(cloud.db.sessions.get(SES).cSyncState), 30_000, 'Part 1 sealed');
        await waitFor(() => box.state.sessions.get(SES)?.localState === 'sealed', 10_000, 'sealed on the box');
        expect(box.state.sessions.get(SES)!.cloudOp).toBe('end');
        // The tail after the split is in Part 1's sealed transcript.
        const seal = JSON.parse(cloud.db.eventsOf('seal')[0].jData.seal);
        expect(seal.totalLines).toBe(JSON.parse(await cloud.redis.getValue(`edge:meta:${SES}`)).totalLines);
        expect(lineNumbers(cloud.pages() as any)).toEqual(range(0, 35));
        expect(cloud.db.eventsOf('split_route')[0].jData).toMatchObject({ nPart2Sesid: part2, bHashCopied: true });
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('"Use direct cloud instead" (O-8): before any byte the box confirms the purge and the session becomes D; after the first byte only Split', async () => {
        const { box, nEdgeid } = await linkedBox();
        expect(await cloud.bindSession(nEdgeid)).toEqual({ delivered: true });
        await waitFor(() => box.kernel.session(SES)?.localState === 'armed', 15_000, 'armed on the box');
        await waitFor(() => !!cloud.registry.sessionStatus(nEdgeid, SES)?.reported, 10_000, 'the box reports the session');

        const res = await cloud.admin('POST', 'session/edge/direct', { nSesid: SES });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ msg: 1, cFeedSource: 'D', bBoxConfirmed: true, cEclipseUsername: USER });
        // The box dropped the session (its purge contract), the cloud re-bound it and updated its route.
        await waitFor(() => box.kernel.session(SES) === null, 10_000, 'purged on the box');
        expect(box.state.sessions.get(SES)?.localState ?? 'purged').toBe('purged');
        expect(cloud.db.sessions.get(SES)).toMatchObject({ cFeedSource: 'D', nEdgeid: null, cSyncState: null });
        expect(JSON.parse(fs.readFileSync(cloud.routeFile, 'utf8'))[0]).toMatchObject({ nSesid: SES, user: USER, feedSource: 'D' });
        expect(JSON.parse(fs.readFileSync(cloud.routeFile, 'utf8'))[0].nEdgeid).toBeUndefined();

        // A second session that has received bytes can only be split.
        const ses2 = IDS.ses2;
        expect(await cloud.bindSession(nEdgeid, ses2)).toEqual({ delivered: true });
        await waitFor(() => box.kernel.session(ses2)?.localState === 'armed', 15_000, 'second session armed');
        const client = await eclipse(box.kernel.listenAddress()!.port, USER, PASS);
        clients.push(client);
        await client.send(bridgeLines(0, 3));
        await waitFor(() => cloud.raw.hasFeedRecords(ses2), 15_000, 'first bytes reached the cloud raw store');
        const refused = await cloud.admin('POST', 'session/edge/direct', { nSesid: ses2 });
        expect(refused.status).toBe(409);
        expect(JSON.parse(refused.body.detailedError)).toMatchObject({ cCode: 'FEED_STARTED' });
        expect(box.kernel.session(ses2)).not.toBeNull();
        expect(cloud.db.sessions.get(ses2)).toMatchObject({ cFeedSource: 'E' });
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('quarantine: the box stays connected and reports status, nothing it sends is applied; re-approval resumes it at once', async () => {
        const { box, nEdgeid } = await linkedBox();
        const client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 20));
        await waitConverged(box, cloud, 'synced', () => cloud.sync.peekMeta(SES).totalLines >= 21);
        const applied = cloud.apply.applied.length;

        const q = await cloud.admin('POST', 'edge/admin/quarantine', { nEdgeid, cAction: 'Q', cNote: 'new egress network' });
        expect(q.status).toBe(201);
        await waitFor(() => box.state.identity.get()?.status === 'quarantined', 10_000, 'quarantined on the box');
        expect(box.events.of('alert').find(a => a.kind === 'QUARANTINED')).toMatchObject({ tier: 'P1' });
        expect(cloud.gateway.connection(nEdgeid)).toMatchObject({ status: 'Q' });
        // Status only: e.status keeps arriving, lines recorded meanwhile are not applied.
        const statuses = cloud.redis.sets.filter(([k]) => k === `edge:status:${nEdgeid}`).length;
        await client.send(bridgeLines(20, 10));
        await waitFor(() => cloud.redis.sets.filter(([k]) => k === `edge:status:${nEdgeid}`).length > statuses + 1, 10_000, 'e.status while quarantined');
        await sleep(400);
        expect(cloud.apply.applied.length).toBe(applied);
        expect(box.uplink.cloudLink().state).toBe('not-linked');

        const a = await cloud.admin('POST', 'edge/admin/quarantine', { nEdgeid, cAction: 'A' });
        expect(a.status).toBe(201);
        await waitFor(() => box.state.identity.get()?.status === 'active', 10_000, 're-approved on the box');
        await waitConverged(box, cloud, 'resumed after the re-approval', () => cloud.sync.peekMeta(SES).totalLines >= 31, 15_000);
        expect(cloud.gateway.connection(nEdgeid)).toMatchObject({ status: 'A' });
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('a held second CAT connection: e.capture records orphan C, then archive-url signs the presigned PUT and the bytes arrive', async () => {
        const { box, nEdgeid } = await linkedBox();
        const client = await liveSession(box, nEdgeid);
        await client.send(bridgeLines(0, 5));
        await waitFor(() => (box.kernel.view(SES)?.totalLines ?? 0) >= 5, 10_000, 'first lines');
        // Another peer logs in with the same credentials while the active one is feeding: held, never parsed.
        const intruder = await eclipse(box.kernel.listenAddress()!.port, USER, PASS, '127.0.0.2');
        clients.push(intruder);
        await intruder.send(bridgeLines(100, 3, 'Intruder'));
        await waitFor(() => (box.kernel.session(SES)?.heldPeers.length ?? 0) === 1, 10_000, 'held');
        await intruder.end();
        await waitFor(() => box.state.heldCaptures.list({ nSesid: SES }).some(c => c.uploadedAtMs !== null), 20_000, 'uploaded');
        const cap = box.state.heldCaptures.list({ nSesid: SES })[0];
        const orphan = cloud.db.orphans.get(cap.nOrphanid!);
        expect(orphan).toMatchObject({ cKind: 'C', nSesid: SES, nEdgeid, cPeer: '127.0.0.2', cUser: USER, cSha256: cap.sha256, cStatus: 'P' });
        const uploaded = cloud.uploads.get(`${SES}-${cap.sha256}`);
        expect(uploaded).toBeDefined();
        expect(uploaded!.equals(fs.readFileSync(cap.file))).toBe(true);
        expect(cloud.registry.recentAlerts().find(a => a.kind === 'HELD_CAT_CONNECTION')).toMatchObject({ tier: 'P1', nSesid: SES });
        // The box's own alert about it reaches the cloud pipeline through e.status (pager, admins).
        const boxKinds = box.events.of('alert').filter(a => a.source !== 'uplink' && a.tier !== 'info').map(a => a.kind);
        expect(boxKinds.length).toBeGreaterThan(0);
        await waitFor(() => boxKinds.every(k => cloud.registry.recentAlerts().some(a => a.kind === k && (a.data as any)?.reportedBy === 'box')), 10_000, 'box alerts forwarded');
        // The held bytes never reached the transcript.
        await waitConverged(box, cloud, 'synced');
        expect(lineNumbers(cloud.pages() as any)).toEqual(range(0, 5));
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('bootId fencing (MR-6): a clone of the box (same key, another boot) is refused DUP_IDENTITY while the box is online, admitted once it is gone', async () => {
        const { box, nEdgeid } = await linkedBox();
        const dir = box.dir;
        await box.close({ keepDir: true });
        boxes.splice(boxes.indexOf(box), 1);
        await waitFor(() => cloud.gateway.connection(nEdgeid) === null, 5_000, 'first boot gone');
        const cloneDir = tempDir('interop-clone');
        copyDir(dir, cloneDir);
        const original = newBox(dir);
        await original.start();
        await waitFor(() => original.uplink.status().online, 15_000, 'original online');
        const bootOfOriginal = cloud.gateway.connection(nEdgeid)!.bootId;

        const clone = newBox(cloneDir);
        await clone.start();
        await waitFor(() => clone.events.of('alert').some(a => a.kind === 'DUP_IDENTITY'), 15_000, 'clone refused');
        expect(clone.events.of('alert').find(a => a.kind === 'DUP_IDENTITY')).toMatchObject({ tier: 'P1', critical: true });
        expect(cloud.registry.recentAlerts().find(a => a.kind === 'DUP_IDENTITY')).toMatchObject({ tier: 'P1', critical: true, nEdgeid });
        expect(cloud.gateway.connection(nEdgeid)!.bootId).toBe(bootOfOriginal);
        expect(original.uplink.status().online).toBe(true);

        // The original goes away: the clone's next attempt is admitted, and must pass hello like any new boot.
        await original.close();
        boxes.splice(boxes.indexOf(original), 1);
        await waitFor(() => clone.uplink.status().online, 15_000, 'clone admitted');
        expect(cloud.gateway.connection(nEdgeid)!.bootId).not.toBe(bootOfOriginal);
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('revoke: c.refused REVOKED and a disconnect; the box stops for good, and any reconnect with its real key is refused', async () => {
        const { box, nEdgeid } = await linkedBox();
        const keyFile = box.config.paths.deviceKeyFile;
        const res = await cloud.admin('POST', 'edge/admin/revoke', { nEdgeid, cNote: 'stolen kit' });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ msg: 1, nEdgeid, cStatus: 'X' });
        await waitFor(() => box.state.identity.get()?.status === 'revoked', 10_000, 'revoked on the box');
        expect(box.state.identity.get()).toMatchObject({ linkFailure: 'revoked' });
        expect(box.events.of('alert').find(a => a.kind === 'BOX_REVOKED')).toMatchObject({ tier: 'P1', critical: true });
        await waitFor(() => cloud.gateway.connection(nEdgeid) === null, 5_000, 'disconnected');
        // It never tries again.
        const challenges = cloud.challenges();
        await sleep(700);
        expect(cloud.challenges()).toBe(challenges);
        expect(box.uplink.cloudLink().state).toBe('not-linked');
        await expect(box.uplink.syncNow()).rejects.toMatchObject({ code: 'box_not_linked' });

        // A copy of the box that missed the notice (offline at revoke) connects with the real key: refused at once.
        const dir = box.dir;
        box.state.identity.patch({ status: 'active', linkFailure: null });
        await box.close({ keepDir: true });
        boxes.splice(boxes.indexOf(box), 1);
        const again = newBox(dir);
        await again.start();
        await waitFor(() => again.state.identity.get()?.status === 'revoked', 10_000, 'refused REVOKED on reconnect');
        expect(cloud.gateway.connection(nEdgeid)).toBeNull();
        // The same, with the raw protocol: challenge, the real device key's signature, connect_error REVOKED.
        const key = await DeviceKey.load(keyFile);
        const { body } = await request(cloud.app.getHttpServer()).get('/realtimeapi/edge/v1/challenge').query({ edgeId: nEdgeid });
        const err = await new Promise<any>(resolve => {
            const s = ioClient(`${cloud.origin}/edge`, { transports: ['websocket'], reconnection: false, forceNew: true, auth: { edgeId: nEdgeid, nonce: body.nonce, bootId: 'raw-1', sig: key.sign(edgeAuthPayload(body.nonce, nEdgeid, 'raw-1')) } });
            s.once('connect', () => resolve(new Error('connected')));
            s.once('connect_error', e => {
                s.close();
                resolve(e);
            });
        });
        expect(err).toMatchObject({ message: 'REVOKED', data: { code: 'REVOKED' } });
        expect(cloud.db.contractViolations).toEqual([]);
    });

    it('a wrong device key is refused (UNAUTHORIZED → the box shows key-refused), with a P2 alert; nothing is admitted', async () => {
        const { box, nEdgeid } = await linkedBox();
        const dir = box.dir;
        await box.close({ keepDir: true });
        boxes.splice(boxes.indexOf(box), 1);
        await waitFor(() => cloud.gateway.connection(nEdgeid) === null, 5_000, 'old socket gone');
        // The disk's device key is replaced (another box's key, or a tampered one); the identity still names the box.
        const again = newBox(dir);
        await DeviceKey.generate().save(again.config.paths.deviceKeyFile);
        await again.start();
        await waitFor(() => again.state.identity.get()?.linkFailure === 'key-refused', 15_000, 'key-refused');
        expect(again.state.identity.get()!.status).toBe('active');
        expect(cloud.gateway.connection(nEdgeid)).toBeNull();
        expect(cloud.registry.recentAlerts().find(a => a.kind === 'DEVICE_SIGNATURE')).toMatchObject({ tier: 'P2', nEdgeid });
        expect(again.uplink.cloudLink().state).toBe('not-linked');
        expect(cloud.db.contractViolations).toEqual([]);
    });
});
