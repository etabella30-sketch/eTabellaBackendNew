/**
 * INTEROP, live mark sync (user decision 2026-10-05): the REAL cloud (EdgeModule and MarkEventsModule booted in a
 * Nest HTTP app with realtime-server main.ts's global ValidationPipe and HttpErrorFilter, on 127.0.0.1 port 0, as in
 * edge-interop.spec.ts) against the REAL venue box: EdgeUplink with its own P-256 device key, the real kernel and
 * node:sqlite state, and the box's LAN side (LanGateway, RtDataService, the real auth) on the SAME bus, as the box's
 * Nest graph wires them. Only the database (FakeEdgeDb), Redis (FakeRedis) and the page-store apply port are fakes;
 * nothing leaves the machine.
 *
 * Proves: mark writes MarkWriteInterceptor reports to MarkEventsService.changed() reach the box as ONE `c.marks` over
 * /edge (a plain emit, no ack); the box checks it, makes the listed users' cached reads stale, and 250 ms later a LAN
 * socket of a listed user (an online etabella.net sign-in the box verified offline with the keys the hello brought) in
 * its own `U<nUserid>` room gets `marks-changed {nSesid, kinds, by:'', atMs}` — with its cached reads ALREADY stale
 * when it hears of it, another user's still fresh. A listed user who may not open the session on the box and a team
 * member who is not listed hear nothing.
 */
import { Global, INestApplication, Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import type { AddressInfo } from 'net';
import * as path from 'path';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import * as request from 'supertest';

import { MARKS_CHANGED_EVENT, MarksChangedNotice } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';

import { AUTH_PROVIDERS } from '../../../rt-edge/src/auth/auth.module';
import { cloudKeys, CloudKeys, onlineToken } from '../../../rt-edge/src/auth/testing/edge-world';
import { waitFor, sleep } from '../../../rt-edge/src/kernel/testing/kernel-harness';
import { LAN_MARKS_WINDOW_MS, LanGateway } from '../../../rt-edge/src/lan/lan.gateway';
import { RtCloudProxy } from '../../../rt-edge/src/lan/rt-data/cloud-proxy';
import { RtReadCache } from '../../../rt-edge/src/lan/rt-data/read-cache';
import { DEFAULT_RT_DATA_OPTIONS, RT_DATA_OPTIONS } from '../../../rt-edge/src/lan/rt-data/rt-data.options';
import { RtDataService } from '../../../rt-edge/src/lan/rt-data/rt-data.service';
import { BOX_CONFIG, EDGE_CLOCK, EDGE_EVENT_BUS, KERNEL_PORT, OPS_PORT, STATE_PORT, UPLINK_PORT } from '../../../rt-edge/src/ports';
import { EdgeBox, edgeBox } from '../../../rt-edge/src/uplink/testing/edge-box';
import { MarkEventsModule } from '../services/marks/mark-events.module';
import { MARK_EVENTS_WINDOW_MS, MarkEventsService } from '../services/marks/mark-events.service';
import { EDGE_APPLY_PORT } from './edge-apply.port';
import { EDGE_ARCHIVE_PORT } from './edge-raw-store.service';
import { EdgeRegistryService } from './edge-registry.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { EdgeModule } from './edge.module';
import { EDGE_OPTIONS, EdgeModuleOptions } from './edge.types';
import { FakeEdgeDb, FakeRedis, IDS, MemoryApplyPort, rmTemp, tempDir } from './edge-test-kit.spec';

jest.setTimeout(120_000);

const SECRET = 'edge-marks-interop-jwt-secret';
const SES = IDS.ses;
/** A case-A team member the notices never name. */
const TEAM_MEMBER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const CLOUD_OPTIONS: EdgeModuleOptions = {
    timings: { viewerOnlineAfterMs: 50, viewerOfflineAfterMs: 50, silentPageAfterMs: 60_000 },
    rateLimits: { challengePerBox: 10_000, challengePerIp: 10_000 },
};

/** The cloud: EdgeModule + MarkEventsModule, the fakes edge-interop.spec.ts uses. */
class Cloud {
    readonly dir = tempDir('marks-interop-cloud');
    readonly db = new FakeEdgeDb();
    readonly redis = new FakeRedis();
    readonly apply = new MemoryApplyPort();
    readonly routeFile = path.join(this.dir, 'routes.json');
    readonly env: Record<string, unknown>;
    app: INestApplication | null = null;
    port = 0;

    constructor(keys: CloudKeys) {
        fs.writeFileSync(this.routeFile, '[]');
        this.env = {
            EDGE_ENABLED: '1',
            JWT_SECRET: SECRET,
            EDGE_JOURNAL_DIR: path.join(this.dir, 'journal'),
            EDGE_CAPTURE_DIR: path.join(this.dir, 'captures'),
            ECLIPSE_SESSION_CONFIG: this.routeFile,
            ECLIPSE_FEED_HOST: 'cloud.example',
            ECLIPSE_AUTH_PORT: '2500',
            // authapi's public edge-token keys: the hello hands them to the box, which verifies sign-ins with them.
            EDGE_TOKEN_JWKS: JSON.stringify({ keys: keys.keys }),
        };
        void this.redis.setValue(`user/${IDS.admin}`, JSON.stringify({ id: 'b-admin', a: true }));
        this.db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.operator, isCaseAdmin: true, cFname: 'Hana', cLname: 'Operator' });
        this.db.team.push({ nCaseid: IDS.caseA, nUserid: TEAM_MEMBER, isCaseAdmin: false, cFname: 'Tom', cLname: 'Member' });
    }

    get origin(): string {
        return `http://127.0.0.1:${this.port}`;
    }
    get gateway(): EdgeUplinkGateway {
        return this.app.get(EdgeUplinkGateway);
    }
    get marks(): MarkEventsService {
        return this.app.get(MarkEventsService);
    }

    async start(): Promise<void> {
        const env = this.env;
        @Global()
        @Module({
            providers: [
                { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
                { provide: EDGE_OPTIONS, useValue: CLOUD_OPTIONS },
                { provide: EDGE_ARCHIVE_PORT, useValue: { archiveJournal: async () => null, uploadCapture: async () => null, presignPut: async () => null } },
            ],
            exports: [ConfigService, EDGE_OPTIONS, EDGE_ARCHIVE_PORT],
        })
        class MarksInteropGlobals { }
        const moduleRef = await Test.createTestingModule({ imports: [MarksInteropGlobals, EdgeModule, MarkEventsModule] })
            .overrideProvider(DbService).useValue(this.db)
            .overrideProvider(RedisDbService).useValue(this.redis)
            .overrideProvider(EDGE_APPLY_PORT).useValue(this.apply)
            .compile();
        const app = moduleRef.createNestApplication({ logger: false });
        app.use((req: any, _res: any, next: () => void) => {
            if (typeof req.url === 'string' && req.url.startsWith('/realtimeapi/')) req.url = req.url.slice('/realtimeapi'.length);
            next();
        });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.listen(this.port, '127.0.0.1');
        this.port = (app.getHttpServer().address() as AddressInfo).port;
        this.app = app;
    }

    async dispose(): Promise<void> {
        const app = this.app;
        this.app = null;
        if (app) await app.close().catch(() => undefined);
        rmTemp(this.dir);
    }

    admin(route: string, data: Record<string, unknown>) {
        const token = jwt.sign({ userId: IDS.admin, broweserId: 'b-admin' }, SECRET);
        return request(this.app.getHttpServer()).post(`/realtimeapi/${route}`).send(data).set('Authorization', `Bearer ${token}`);
    }

    /** An 'E' session bound to the box (et_rtedge_session_bind, the DORMANT route), then the c.assign upsert push. */
    async bindSession(nEdgeid: string): Promise<{ delivered: boolean }> {
        this.db.assignCase(nEdgeid, IDS.caseA, { cCaseno: 'HC-2026-001', cCasename: 'Okafor v Shah' });
        this.db.addSession({ nSesid: SES, nEdgeid, nCaseid: IDS.caseA, cName: 'Day 3', cParserVer: FEED_PARSE_VERSION, nHearingOpid: IDS.operator });
        const salt = randomBytes(16);
        fs.writeFileSync(
            this.routeFile,
            JSON.stringify([
                {
                    nSesid: SES,
                    nCaseid: IDS.caseA,
                    label: 'Day 3',
                    nLines: 25,
                    user: 'eclipse-court3',
                    cTimezone: 'Europe/London',
                    passwordSalt: salt.toString('base64'),
                    passwordHash: scryptSync('pw-court3-7Q', salt, 32).toString('base64'),
                    passwordEnc: 'v1.never-sent-to-a-box',
                    feedSource: 'E',
                    nEdgeid,
                    epoch: 1,
                },
            ]),
        );
        return this.app.get(EdgeRegistryService).pushSessionUpsert(nEdgeid, SES);
    }
}

/** The box's LAN side on the box's own bus, state, kernel and uplink (lan.module.ts's providers that matter here). */
async function boxLan(box: EdgeBox): Promise<{ app: INestApplication; url: string; rtData: RtDataService; close(): Promise<void> }> {
    @Module({
        providers: [
            { provide: BOX_CONFIG, useValue: box.config },
            { provide: EDGE_CLOCK, useValue: () => Date.now() },
            { provide: EDGE_EVENT_BUS, useValue: box.events.bus },
            { provide: STATE_PORT, useValue: box.state },
            { provide: KERNEL_PORT, useValue: box.kernel },
            { provide: UPLINK_PORT, useValue: box.uplink },
            // Only edge-status reads ops; nobody joins a session room here.
            { provide: OPS_PORT, useValue: { nextSeq: () => 1, sessionStatus: () => null } },
            ...AUTH_PROVIDERS,
            { provide: RT_DATA_OPTIONS, useValue: DEFAULT_RT_DATA_OPTIONS },
            RtCloudProxy,
            RtDataService,
            LanGateway,
        ],
    })
    class BoxLanModule { }
    const ref = await Test.createTestingModule({ imports: [BoxLanModule] }).compile();
    const app = ref.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
    const gateway = app.get(LanGateway);
    await gateway.start();
    return {
        app,
        url: `http://127.0.0.1:${(app.getHttpServer().address() as AddressInfo).port}`,
        rtData: app.get(RtDataService),
        close: async () => {
            await gateway.close();
            await app.close();
        },
    };
}

describe('edge interop: live mark sync, cloud MarkEventsService → c.marks → the box LAN socket', () => {
    let keys: CloudKeys;
    let cloud: Cloud;
    let box: EdgeBox | null = null;
    let lan: Awaited<ReturnType<typeof boxLan>> | null = null;
    const sockets: ClientSocket[] = [];

    beforeAll(async () => {
        Logger.overrideLogger(false);
        keys = await cloudKeys();
    });
    beforeEach(async () => {
        cloud = new Cloud(keys);
        await cloud.start();
    });
    afterEach(async () => {
        for (const s of sockets.splice(0)) s.disconnect();
        await lan?.close().catch(() => undefined);
        lan = null;
        await box?.close().catch(() => undefined);
        box = null;
        await cloud.dispose();
    });

    /** Add → enrol → confirm → connected (the §3.4 install), as edge-interop.spec.ts. */
    async function linkedBox(): Promise<{ box: EdgeBox; nEdgeid: string }> {
        const res = await cloud.admin('edge/admin/create', { cName: 'Court 3', cVenue: 'Rolls Building' });
        expect(res.status).toBe(201);
        const nEdgeid: string = res.body.node.nEdgeid;
        const b = edgeBox({ cloudOrigin: cloud.origin, uplink: { backoffBaseMs: 40, backoffMaxMs: 250 } });
        box = b;
        await b.uplink.enrol({ code: res.body.enroll.code });
        await b.start();
        await waitFor(() => b.state.identity.get()?.linkFailure === 'key-refused', 15_000, 'KEY_UNCONFIRMED refusal');
        const ok = await cloud.admin('edge/admin/confirm-key', { nEdgeid, cKeyFpr: b.state.identity.get()!.keyFingerprint });
        expect(ok.status).toBe(201);
        await waitFor(() => b.uplink.status().online && b.state.identity.get()?.status === 'active', 15_000, 'connected after the confirmation');
        return { box: b, nEdgeid };
    }

    /** An etabella.net edge token for this box (ES256, the keys the cloud's hello delivered). */
    function signIn(nEdgeid: string, sub: string): Promise<string> {
        const nowSec = Math.floor(Date.now() / 1000);
        return onlineToken(keys, { sub, aud: `edge:${nEdgeid}`, edge: nEdgeid, cases: [IDS.caseA], iat: nowSec - 60, exp: nowSec + 3600, auth_time: nowSec - 120 });
    }

    function connect(url: string, token: string): Promise<ClientSocket> {
        const socket = ioClient(url, { path: '/socket.io', transports: ['websocket'], auth: { token }, reconnection: false, forceNew: true });
        sockets.push(socket);
        return new Promise((resolve, reject) => {
            socket.once('connect', () => resolve(socket));
            socket.once('connect_error', reject);
        });
    }

    it("mark writes on etabella.net reach a listed user's LAN socket in their U room as one marks-changed, after the box made their cached reads stale; nobody else hears", async () => {
        const linked = await linkedBox();
        const b = linked.box;
        expect(await cloud.bindSession(linked.nEdgeid)).toEqual({ delivered: true });
        await waitFor(
            () => !!b.state.sessions.get(SES) && (b.state.jwks.get()?.keys.length ?? 0) > 0 && b.state.roster.forUser(IDS.operator).length > 0,
            15_000,
            'the box holds the session, the token keys and the roster',
        );
        lan = await boxLan(b);

        // Three online sign-ins on the box: the author's colleague (listed, case admin), someone listed who may not
        // open the session on this box (not on the case team), and a team member the notice does not name.
        const listed = await connect(lan.url, await signIn(linked.nEdgeid, IDS.operator));
        const notOnTeam = await connect(lan.url, await signIn(linked.nEdgeid, IDS.user));
        const unlisted = await connect(lan.url, await signIn(linked.nEdgeid, TEAM_MEMBER));
        const listedKey = RtReadCache.key(IDS.operator, 'marknav.all', `nSesid=${SES}`);
        const unlistedKey = RtReadCache.key(TEAM_MEMBER, 'marknav.all', `nSesid=${SES}`);
        lan.rtData.cache.set(listedKey, IDS.operator, Buffer.from('[[],[],[]]'));
        lan.rtData.cache.set(unlistedKey, TEAM_MEMBER, Buffer.from('[[],[],[]]'));

        const heard: MarksChangedNotice[] = [];
        const freshWhenHeard: Array<boolean | undefined> = [];
        listed.on(MARKS_CHANGED_EVENT, (n: MarksChangedNotice) => {
            freshWhenHeard.push(lan.rtData.cache.get(listedKey)?.fresh);
            heard.push(n);
        });
        const others: unknown[] = [];
        notOnTeam.on(MARKS_CHANGED_EVENT, (n: unknown) => others.push(n));
        unlisted.on(MARKS_CHANGED_EVENT, (n: unknown) => others.push(n));
        const notify = jest.spyOn(cloud.gateway, 'notify');

        // What MarkWriteInterceptor reports after two writes in one window: a shared fact, then a Quick Mark.
        const before = Date.now();
        cloud.marks.changed({ nSesid: SES, kind: 'F', by: IDS.admin, users: [IDS.operator, IDS.user] });
        cloud.marks.changed({ nSesid: SES, kind: 'Q', by: IDS.operator, users: [IDS.operator] });

        await waitFor(() => heard.length >= 1, 10_000, 'marks-changed on the box LAN socket');
        const tookMs = Date.now() - before;
        expect(heard[0]).toEqual({ nSesid: SES, kinds: ['Q', 'F'], by: '', atMs: expect.any(Number) });
        expect(heard[0].atMs).toBeGreaterThanOrEqual(before - 1_000);
        expect(tookMs).toBeGreaterThanOrEqual(MARK_EVENTS_WINDOW_MS + LAN_MARKS_WINDOW_MS - 50);
        // The box had made the listed user's cached reads stale before the socket heard of it; the copy is kept.
        expect(freshWhenHeard).toEqual([false]);
        expect(lan.rtData.cache.get(listedKey)?.body.toString()).toBe('[[],[],[]]');
        expect(lan.rtData.cache.get(unlistedKey)?.fresh).toBe(true);

        // One c.marks over /edge, a plain emit; the bus saw exactly what the cloud sent.
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify.mock.calls[0][0].toLowerCase()).toBe(linked.nEdgeid.toLowerCase());
        expect(notify.mock.calls[0][1]).toBe('c.marks');
        expect(notify.mock.calls[0][2]).toEqual({ nSesid: SES, users: [IDS.operator, IDS.user], kinds: ['Q', 'F'], atMs: heard[0].atMs });
        expect(b.events.of('marks-changed')).toEqual([{ reason: 'cloud', nSesid: SES, users: [IDS.operator, IDS.user], kinds: ['Q', 'F'], atMs: heard[0].atMs }]);

        await sleep(MARK_EVENTS_WINDOW_MS + LAN_MARKS_WINDOW_MS + 200);
        expect(heard).toHaveLength(1);
        expect(others).toEqual([]);
        expect(b.uplink.status().online).toBe(true);
        expect(cloud.db.contractViolations).toEqual([]);
    });
});
