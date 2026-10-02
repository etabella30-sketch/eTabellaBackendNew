/**
 * The stand-in cloud: the REAL realtime-server edge module (EdgeModule: EdgeController, device auth, EdgeUplinkGateway
 * on the shared socket.io server, EdgeSyncService, EdgeRawStoreService, EdgeRegistryService) in a Nest HTTP app on
 * 127.0.0.1, with realtime-server's global ValidationPipe and HttpErrorFilter and the nginx `/realtimeapi` prefix
 * stripped, exactly as apps/realtime-server/src/edge/edge-interop.spec.ts boots it.
 *
 * Faked, and nothing else:
 * - the database and Redis: FakeEdgeDb / FakeRedis from edge-test-kit.spec.ts (the 2026-10-01 SP semantics, every
 *   call checked against the migrations' contract);
 * - the feed store: MemoryFeedStore below, behind the REAL apply adapter (FeedDataApplyAdapter: the barrier, the
 *   atomic memory swap, the per-page writes, the rev-tagged viewer broadcast on the shared socket.io server). Its
 *   `persisted` half is Redis + data/ (it survives a cloud restart), its `memory` half is process memory (lost);
 * - the viewer side of EventsGateway (not under test, and not bootable without the whole realtime-server):
 *   CloudViewerRoom answers `join-room` / `fetch-data` on `/` and sends `edge-status` with the REAL cloud-viewer
 *   payload (EdgeViewerAdapter + cloudEdgeStatus, edge-viewer.port.ts) and EventsGateway's `since` rule.
 */
import { Global, INestApplication, Logger, Module, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import type { AddressInfo } from 'net';
import * as path from 'path';
import type { Server, Socket } from 'socket.io';
import * as request from 'supertest';

import { buildSnapshot, RoundApplyPlan, sessionRoom, snapshotEnd } from '@app/edge-sync';
import { FEED_PARSE_VERSION } from '@app/feed-parse';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { HttpErrorFilter } from '@app/global/middleware/exception';
import { AppGateway } from '@app/global/modules/websocket.module';

import { EDGE_APPLY_PORT, EdgeApplyOutcome, EdgeApplyTargets, FeedDataApplyAdapter, FeedStoreLike } from '../../../realtime-server/src/edge/edge-apply.port';
import { EDGE_ARCHIVE_PORT, EdgeRawStoreService } from '../../../realtime-server/src/edge/edge-raw-store.service';
import { EdgeRegistryService } from '../../../realtime-server/src/edge/edge-registry.service';
import { EdgeSyncService } from '../../../realtime-server/src/edge/edge-sync.service';
import { FakeEdgeDb, FakeRedis, IDS, rmTemp, tempDir } from '../../../realtime-server/src/edge/edge-test-kit.spec';
import { EdgeUplinkGateway } from '../../../realtime-server/src/edge/edge-uplink.gateway';
import { EdgeModule } from '../../../realtime-server/src/edge/edge.module';
import { EDGE_OPTIONS, EdgeModuleOptions } from '../../../realtime-server/src/edge/edge.types';
import { EDGE_ASSIGN_PUSH, EdgeAssignPush } from '../../../realtime-server/src/services/transcript-completeness/edge-assign-push';
import { cloudEdgeStatus, EdgeVenueState, EdgeViewerAdapter, EdgeViewerStatus, lastContactMs, venueOf } from '../../../realtime-server/src/events/edge-viewer.port';

export { IDS };

const SECRET = 'rt-edge-e2e-jwt-secret';

/** Fast, production-shaped cloud timings (viewer hysteresis kept, shortened). */
export const E2E_CLOUD_OPTIONS: EdgeModuleOptions = {
    timings: { viewerOnlineAfterMs: 300, viewerOfflineAfterMs: 400, silentPageAfterMs: 120_000 },
    rateLimits: { challengePerBox: 100_000, challengePerIp: 100_000 },
    // Small parts: a catch-up round is multi-part on the wire.
    maxPartBytes: 8_192,
};

type Pages = Record<number, unknown[]>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

/** The faked feed store (FeedDataService's public surface the apply adapter uses). */
export class MemoryFeedStore implements FeedStoreLike {
    /** Process memory: lost on a cloud restart. */
    readonly memory = new Map<string, Pages>();
    /** Redis + data/dt_<id>/: survives a restart. */
    readonly persisted = new Map<string, Map<number, unknown[]>>();
    readonly ended: string[] = [];

    readonly manager = {
        setPageData: (session: string, page: number, data: unknown[]): void => {
            this.mem(session)[page] = data;
        },
        deletePageData: (session: string, page: number): boolean => {
            const m = this.memory.get(session);
            if (!m || !(page in m)) return false;
            delete m[page];
            return true;
        },
        getSessionData: (session: string): Pages | null => this.memory.get(session) ?? null,
    };

    private mem(session: string): Pages {
        let m = this.memory.get(session);
        if (!m) this.memory.set(session, (m = {}));
        return m;
    }

    private disk(session: string): Map<number, unknown[]> {
        let m = this.persisted.get(session);
        if (!m) this.persisted.set(session, (m = new Map()));
        return m;
    }

    async setPage(sessionId: string, pageNumber: number, data: unknown[]): Promise<boolean> {
        this.disk(sessionId).set(pageNumber, clone(data));
        return true;
    }

    async deleteExtraPages(sessionId: string, maxPage: number): Promise<boolean> {
        const m = this.memory.get(sessionId);
        if (m) for (const p of Object.keys(m).map(Number)) if (p > maxPage) delete m[p];
        const d = this.persisted.get(sessionId);
        if (d) for (const p of [...d.keys()]) if (p > maxPage) d.delete(p);
        return true;
    }

    async restoreFromDiskIfNeeded(sessionId: string): Promise<void> {
        if (this.memory.has(sessionId) || !this.persisted.has(sessionId)) return;
        const m = this.mem(sessionId);
        for (const [p, lines] of this.persisted.get(sessionId)!) m[p] = clone(lines);
    }

    async readSessionData(sessionId: string): Promise<Pages> {
        const m = this.memory.get(sessionId);
        if (m) return m;
        const d = this.persisted.get(sessionId);
        return d ? Object.fromEntries([...d].map(([p, lines]) => [p, clone(lines)])) : {};
    }

    async sessionEnd(sessionId: string): Promise<boolean> {
        this.ended.push(sessionId);
        return true;
    }

    /** A process restart: memory is gone, Redis / disk stay. */
    dropMemory(): void {
        this.memory.clear();
    }

    /** The pages viewers are served (memory, else what a restart would restore), page 1 first. */
    pages(sessionId: string): unknown[][] {
        const m = this.memory.get(sessionId);
        const entries: Array<[number, unknown[]]> = m ? Object.entries(m).map(([p, l]) => [Number(p), l]) : [...(this.persisted.get(sessionId) ?? new Map())];
        return entries.sort((x, y) => x[0] - y[0]).map(([, lines]) => lines);
    }
}

/** The real apply adapter, recording each applied round (rev, page count, when) for the catch-up assertions. */
export class RecordingApplyAdapter extends FeedDataApplyAdapter {
    constructor(
        targets: () => EdgeApplyTargets,
        private readonly log: Array<{ nSesid: string; rev: number; pages: number; totalLines: number; atMs: number }>,
    ) {
        super(targets);
    }

    async applyRoundAtomic(nSesid: string, plan: RoundApplyPlan): Promise<EdgeApplyOutcome> {
        const out = await super.applyRoundAtomic(nSesid, plan);
        this.log.push({ nSesid, rev: plan.rev, pages: plan.pages.length, totalLines: plan.totalLines, atMs: Date.now() });
        return out;
    }
}

/** EventsGateway's viewer side, as far as a cloud viewer of a venue session sees it (see the file header). */
export class CloudViewerRoom {
    private readonly venueSince = new Map<string, { venue: EdgeVenueState; since: number }>();

    constructor(private readonly cloud: CloudStandIn) {}

    attach(io: Server): void {
        io.on('connection', (socket: Socket) => {
            socket.on('join-room', (data: unknown) => {
                const room = typeof data === 'string' ? data : (data as { room?: unknown })?.room;
                if (typeof room !== 'string' || !room.startsWith('S')) return;
                socket.join(room);
                this.sendTo(socket, room.slice(1));
            });
            socket.on('fetch-data', (data: unknown) => void this.fetch(socket, data));
        });
    }

    /** FeedDataApplyAdapter → EventsGateway.announceEdgeStatus: the full cloud-viewer status to the room. */
    announceEdgeStatus(nSesid: string): boolean {
        const status = this.adapter()?.status(nSesid);
        const io = this.cloud.io;
        if (!status || !io) return false;
        io.to(sessionRoom(nSesid)).emit('edge-status', this.cloudStatus(nSesid, status));
        return true;
    }

    private sendTo(socket: Socket, nSesid: string): void {
        const status = this.adapter()?.status(nSesid);
        if (status) socket.emit('edge-status', this.cloudStatus(nSesid, status));
    }

    private async fetch(socket: Socket, data: unknown): Promise<void> {
        const nSesid = String((data as { nSesid?: unknown })?.nSesid ?? '').trim();
        if (!nSesid) return;
        const tab = (data as { tab?: unknown })?.tab;
        const rev = this.cloud.app ? this.cloud.sync.peekMeta(nSesid)?.appliedRev : undefined;
        const pages = new Map(this.cloud.feed.pages(nSesid).map((lines, k) => [k + 1, lines] as const));
        for (const payload of buildSnapshot(pages, { nSesid, tab, qFacts: [], qMarks: [], ...(rev ? { rev } : {}) })) {
            if (!socket.connected) return;
            socket.emit('previous-data', payload);
            await new Promise(resolve => setImmediate(resolve));
        }
        socket.emit('previous-data-end', snapshotEnd(nSesid, tab));
    }

    private adapter(): EdgeViewerAdapter | null {
        if (!this.cloud.app) return null;
        return new EdgeViewerAdapter(this.cloud.sync, this.cloud.registry);
    }

    /** EventsGateway.cloudStatus: `since` = when viewers were first told the current venue value. */
    private cloudStatus(nSesid: string, status: EdgeViewerStatus): EdgeViewerStatus {
        const id = String(nSesid).toLowerCase();
        const venue = venueOf(status.state);
        const known = this.venueSince.get(id);
        let since: number;
        if (known && known.venue === venue) {
            since = known.since;
        } else {
            const lastSeen = venue === 'offline' ? lastContactMs(status) : null;
            since = lastSeen !== null && lastSeen <= status.atMs && (!known || lastSeen >= known.since) ? lastSeen : status.atMs;
            this.venueSince.set(id, { venue, since });
        }
        return cloudEdgeStatus(status, since);
    }
}

export interface BindOptions {
    readonly user: string;
    readonly password: string;
    readonly tz: string;
    readonly name?: string;
}

export class CloudStandIn {
    readonly dir = tempDir('e2e-cloud');
    readonly db = new FakeEdgeDb();
    readonly redis = new FakeRedis();
    readonly feed = new MemoryFeedStore();
    readonly routeFile = path.join(this.dir, 'routes.json');
    readonly journalDir = path.join(this.dir, 'journal');
    /** Every round the apply port applied, in order (across restarts). */
    readonly applied: Array<{ nSesid: string; rev: number; pages: number; totalLines: number; atMs: number }> = [];
    readonly env: Record<string, unknown>;
    app: INestApplication | null = null;
    viewers: CloudViewerRoom | null = null;
    port = 0;
    starts = 0;

    constructor(tokenJwks: { keys: readonly Record<string, unknown>[] }) {
        fs.writeFileSync(this.routeFile, '[]');
        this.env = {
            EDGE_ENABLED: '1',
            JWT_SECRET: SECRET,
            EDGE_JOURNAL_DIR: this.journalDir,
            EDGE_CAPTURE_DIR: path.join(this.dir, 'captures'),
            ECLIPSE_SESSION_CONFIG: this.routeFile,
            ECLIPSE_FEED_HOST: 'cloud.example',
            ECLIPSE_AUTH_PORT: '2500',
            // The public key of the edge-token signer: the box verifies room sign-ins offline with it (D22).
            EDGE_TOKEN_JWKS: JSON.stringify(tokenJwks),
        };
        // The admin's browser session (RealtimeAuthMiddleware: Redis user/<id>).
        void this.redis.setValue(`user/${IDS.admin}`, JSON.stringify({ id: 'b-admin', a: true }));
        // Case team of case A: the hearing operator (case admin → box admin) and a room reader.
        this.db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.operator, isCaseAdmin: true, cFname: 'Hana', cLname: 'Operator' });
        this.db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.user, isCaseAdmin: false, cFname: 'Rita', cLname: 'Reader' });
    }

    get origin(): string {
        return `http://127.0.0.1:${this.port}`;
    }
    get gateway(): EdgeUplinkGateway {
        return this.app!.get(EdgeUplinkGateway);
    }
    get sync(): EdgeSyncService {
        return this.app!.get(EdgeSyncService);
    }
    get raw(): EdgeRawStoreService {
        return this.app!.get(EdgeRawStoreService);
    }
    get registry(): EdgeRegistryService {
        return this.app!.get(EdgeRegistryService);
    }
    get io(): Server | null {
        return this.app ? ((this.app.get(AppGateway).server as Server) ?? null) : null;
    }

    async start(): Promise<void> {
        const env = this.env;
        @Global()
        @Module({
            providers: [
                { provide: ConfigService, useValue: { get: (k: string) => env[k] } },
                { provide: EDGE_OPTIONS, useValue: E2E_CLOUD_OPTIONS },
                { provide: EDGE_ARCHIVE_PORT, useValue: { archiveJournal: async () => null, uploadCapture: async () => null, presignPut: async () => null } },
            ],
            exports: [ConfigService, EDGE_OPTIONS, EDGE_ARCHIVE_PORT],
        })
        class E2eCloudGlobals {}
        const viewers = new CloudViewerRoom(this);
        const moduleRef = await Test.createTestingModule({ imports: [E2eCloudGlobals, EdgeModule] })
            .overrideProvider(DbService)
            .useValue(this.db)
            .overrideProvider(RedisDbService)
            .useValue(this.redis)
            .overrideProvider(EDGE_APPLY_PORT)
            .useFactory({
                factory: (ws: { server?: unknown } | null) =>
                    new RecordingApplyAdapter(() => ({ feed: this.feed, io: (ws?.server as never) ?? null, viewers, session: null, routes: null }), this.applied),
                inject: ['WEB_SOCKET_SERVER'],
            })
            .compile();
        const app = moduleRef.createNestApplication({ logger: false });
        app.use((req: { url?: string }, _res: unknown, next: () => void) => {
            if (typeof req.url === 'string' && req.url.startsWith('/realtimeapi/')) req.url = req.url.slice('/realtimeapi'.length);
            next();
        });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
        app.useGlobalFilters(new HttpErrorFilter());
        await app.listen(this.port, '127.0.0.1');
        this.port = (app.getHttpServer().address() as AddressInfo).port;
        this.app = app;
        this.viewers = viewers;
        viewers.attach(this.io!);
        this.starts += 1;
    }

    /** A cloud restart or crash: every socket drops, process memory (incl. the feed store's) is lost, the stores stay. */
    async stop(): Promise<void> {
        const app = this.app;
        if (!app) return;
        await app.get(EdgeSyncService).flushMetaWrites();
        this.app = null;
        this.viewers = null;
        await app.close();
        this.feed.dropMemory();
    }

    async dispose(): Promise<void> {
        await this.stop().catch(() => undefined);
        rmTemp(this.dir);
    }

    /** A request as the global admin, through the nginx prefix. */
    admin(method: 'GET' | 'POST', route: string, data: Record<string, unknown> = {}): request.Test {
        const token = jwt.sign({ userId: IDS.admin, broweserId: 'b-admin' }, SECRET);
        const server = this.app!.getHttpServer();
        const r = method === 'GET' ? request(server).get(`/realtimeapi/${route}`).query(data) : request(server).post(`/realtimeapi/${route}`).send(data);
        return r.set('Authorization', `Bearer ${token}`);
    }

    /** Venue boxes → Add: the 128-bit one-time code. */
    async createBox(): Promise<{ nEdgeid: string; code: string }> {
        const res = await this.admin('POST', 'edge/admin/create', { cName: 'Court 3', cVenue: 'Rolls Building' });
        if (res.status !== 201) throw new Error(`edge/admin/create answered ${res.status}`);
        return { nEdgeid: res.body.node.nEdgeid, code: res.body.enroll.code };
    }

    /** Venue boxes → confirm the fingerprint the box console showed. */
    async confirmKey(nEdgeid: string, fingerprint: string): Promise<void> {
        const res = await this.admin('POST', 'edge/admin/confirm-key', { nEdgeid, cKeyFpr: fingerprint });
        if (res.status !== 201) throw new Error(`edge/admin/confirm-key answered ${res.status}`);
    }

    /**
     * What step 8's EclipseSessionService does for an 'E' create (as edge-interop.spec.ts): the session row, the
     * DORMANT route (base64 scrypt salt / hash, node's default N), then the registry's c.assign upsert push.
     */
    async bindSession(nEdgeid: string, nSesid: string, o: BindOptions): Promise<{ delivered: boolean; reason?: string }> {
        this.db.assignCase(nEdgeid, IDS.caseA, { cCaseno: 'HC-2026-001', cCasename: 'Okafor v Shah' });
        this.db.addSession({ nSesid, nEdgeid, nCaseid: IDS.caseA, cName: o.name ?? 'Day 3', cTimezone: o.tz, cParserVer: FEED_PARSE_VERSION, nHearingOpid: IDS.operator });
        const salt = randomBytes(16);
        const routes = JSON.parse(fs.readFileSync(this.routeFile, 'utf8'));
        routes.push({
            nSesid,
            nCaseid: IDS.caseA,
            label: o.name ?? 'Day 3',
            nLines: 25,
            user: o.user,
            cTimezone: o.tz,
            passwordSalt: salt.toString('base64'),
            passwordHash: scryptSync(o.password, salt, 32).toString('base64'),
            passwordEnc: 'v1.never-sent-to-a-box',
            feedSource: 'E',
            nEdgeid,
            epoch: 1,
        });
        fs.writeFileSync(this.routeFile, JSON.stringify(routes));
        return this.registry.pushSessionUpsert(nEdgeid, nSesid);
    }

    /** RT Production Stop on a venue session: et_rtedge_session_end, then EDGE_ASSIGN_PUSH(end) (spec §4.4). */
    async endSession(nEdgeid: string, nSesid: string): Promise<unknown> {
        const s = this.db.sessions.get(nSesid);
        s.cSyncState = 'S';
        s.cStatus = 'C';
        return this.app!.get<EdgeAssignPush>(EDGE_ASSIGN_PUSH)(nEdgeid, { op: 'end', nSesid });
    }
}

/** Nest's static logger is process-wide: both apps of the suite stay silent (no line text can reach the log). */
export function silenceNest(): void {
    Logger.overrideLogger(false);
}
