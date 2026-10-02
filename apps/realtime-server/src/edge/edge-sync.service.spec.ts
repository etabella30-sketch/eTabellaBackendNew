/**
 * EdgeSyncService: session lifecycle (D7 split, O-8 direct, revoke), the D18 boot recompute, the O-7
 * state-loss fallback, seal edge cases, forced close, acknowledgement and the feed status. The services are
 * real; DB / Redis / page store are the in-memory fakes of edge-test-kit.spec.ts, the gateway is a stub link.
 * The over-the-wire protocol cases are in edge-uplink.gateway.spec.ts.
 */
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CloudView, EDGE_FMT, EDGE_PROTO, EdgeHello, emptyCloudMeta, pageDigest, resumeFromHello, rootDigest } from '@app/edge-sync';

import { pullReplyStep } from '../../../rt-edge/src/kernel/raw-pull';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeCertificateIssuer, EdgeLink, EdgeRegistryService } from './edge-registry.service';
import { EdgeConnCtx, EdgeSyncService, reporterInstructions, shrinkSamples, stableUuid } from './edge-sync.service';
import { EDGE_BINDING_SQL, EdgeTimings, peerIp } from './edge.types';
import { BoxSim, deviceKey, DeviceKey, FakeConfig, FakeEdgeDb, FakeRedis, IDS, line, MemoryApplyPort, PARSER_VER, rmTemp, tempDir, until } from './edge-test-kit.spec';

const ADMIN = { userId: IDS.admin, isAdmin: true };
const OPERATOR = { userId: IDS.operator, isAdmin: false };
const STRANGER = { userId: IDS.user, isAdmin: false };
const ROUTE = { nSesid: IDS.ses, nCaseid: IDS.caseA, label: 'Day 1', nLines: 25, user: 'courtroom-1', cTimezone: 'Europe/London', passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', passwordEnc: 'v1.secret', feedSource: 'E', nEdgeid: IDS.box, epoch: 1 };

interface W {
    dir: string;
    routeFile: string;
    config: FakeConfig;
    db: FakeEdgeDb;
    redis: FakeRedis;
    apply: MemoryApplyPort;
    registry: EdgeRegistryService;
    raw: EdgeRawStoreService;
    sync: EdgeSyncService;
    link: jest.Mocked<EdgeLink>;
    conn: EdgeConnCtx;
    key: DeviceKey;
    issuer: jest.Mocked<EdgeCertificateIssuer>;
    clock: { now: number };
}

function makeW(
    seed?: (w: Pick<W, 'db' | 'redis' | 'apply' | 'dir'>) => void,
    shared?: Partial<Pick<W, 'db' | 'redis' | 'apply' | 'dir' | 'key'>>,
    timings: Partial<EdgeTimings> = {},
): W {
    const dir = shared?.dir ?? tempDir('sync');
    const routeFile = path.join(dir, 'routes.json');
    if (!fs.existsSync(routeFile)) fs.writeFileSync(routeFile, JSON.stringify([ROUTE]));
    const config = new FakeConfig({
        EDGE_ENABLED: '1',
        EDGE_JOURNAL_DIR: path.join(dir, 'journal'),
        EDGE_CAPTURE_DIR: path.join(dir, 'captures'),
        ECLIPSE_SESSION_CONFIG: routeFile,
        ECLIPSE_FEED_HOST: 'cloud.example',
        ECLIPSE_AUTH_PORT: '2501',
    });
    const key = shared?.key ?? deviceKey();
    const db = shared?.db ?? new FakeEdgeDb();
    const redis = shared?.redis ?? new FakeRedis();
    const apply = shared?.apply ?? new MemoryApplyPort();
    if (!shared?.db) {
        db.addNode({ nEdgeid: IDS.box, cPubKey: key.spkiB64, cKeyFpr: key.fpr });
        db.assignCase(IDS.box, IDS.caseA);
        db.addSession({ nSesid: IDS.ses });
    }
    seed?.({ db, redis, apply, dir });
    const clock = { now: 1_800_000_000_000 };
    const opts = { clock: () => clock.now, timings: { viewerOnlineAfterMs: 10, viewerOfflineAfterMs: 10, silentPageAfterMs: 20, ...timings } };
    const issuer = { issue: jest.fn(), revoke: jest.fn(async () => undefined) } as any;
    const registry = new EdgeRegistryService(db as any, redis as any, config as any, { server: null }, issuer, undefined, async () => undefined, opts);
    const raw = new EdgeRawStoreService(db as any, config as any, registry, undefined, opts);
    const sync = new EdgeSyncService(db as any, redis as any, config as any, registry, raw, apply, opts);
    const link: jest.Mocked<EdgeLink> = {
        push: jest.fn(async (_id: string, _event: string, _payload: unknown) => ({ delivered: true, reply: { ok: true } as unknown })),
        disconnect: jest.fn(),
        connection: jest.fn((_id: string) => ({ nEdgeid: IDS.box, bootId: 'boot-1', status: 'A' as const, connectedAtMs: 1, lastSeenMs: 1, ip: '127.0.0.1' })),
        setStatus: jest.fn(),
    } as any;
    registry.bindLink(link);
    const conn: EdgeConnCtx = { nEdgeid: IDS.box, bootId: 'boot-1', status: 'A', pubKey: key.spkiB64, ip: '127.0.0.1', helloed: new Map() };
    return { dir, routeFile, config, db, redis, apply, registry, raw, sync, link, conn, key, issuer, clock };
}

function hello(box: BoxSim, sessions = [box.helloSession()]): EdgeHello {
    return { proto: EDGE_PROTO, protoMin: EDGE_PROTO, fmt: EDGE_FMT, sw: '1.0.0', parserVer: PARSER_VER, bootId: box.bootId, sessions };
}

interface St {
    cloud: CloudView;
    lineage: { appliedRawSeq: number | null; appliedRawHash: string | null };
    appliedRev: number;
}

async function syncUp(w: W, box: BoxSim): Promise<St> {
    const reply: any = await w.sync.hello(w.conn, hello(box));
    const resume = resumeFromHello(reply.sessions.find((s: any) => s.nSesid === box.nSesid), box.journal());
    box.cutter.advanceRev(resume.appliedRev);
    const st: St = { cloud: resume.cloud, lineage: resume.lineage, appliedRev: resume.appliedRev };
    await w.sync.raw(w.conn, box.rawBatch(resume.rawCursor));
    await push(w, box, st);
    return st;
}

async function push(w: W, box: BoxSim, st: St) {
    const built = box.round(st.cloud, st.lineage);
    if (!built) return null;
    let reply: any;
    for (const part of built.parts) reply = await w.sync.round(w.conn, part);
    if (reply?.ok === true && !reply.partial) {
        st.cloud = built.afterAck.cloud;
        st.lineage = built.afterAck.lineage;
        st.appliedRev = reply.appliedRev;
    }
    return reply;
}

const readRoutes = (w: W) => JSON.parse(fs.readFileSync(w.routeFile, 'utf8'));

describe('EdgeSyncService', () => {
    const worlds: W[] = [];
    const make = (...args: Parameters<typeof makeW>) => {
        const w = makeW(...args);
        worlds.push(w);
        return w;
    };
    beforeAll(() => Logger.overrideLogger(false));
    afterEach(async () => {
        for (const w of worlds.splice(0)) {
            w.sync.onModuleDestroy();
            await w.sync.flushMetaWrites();
            rmTemp(w.dir);
        }
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('Split to direct cloud (D7, O-5, O-6)', () => {
        it("lets the hearing operator split: Part 1 'S', its route moved to Part 2 'D' with the same login hash, parts linked, box told to end", async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            await syncUp(w, box);
            const res = await w.sync.split(IDS.ses, OPERATOR, { cNote: 'box died' });

            const sp = w.db.callsOf('rtedge_session_split')[0];
            expect(sp).toMatchObject({ nSesid: IDS.ses, nMasterid: IDS.operator, cApply: 'L', cEclipseUsername: 'courtroom-1', cNote: 'box died' });
            expect(sp.cUnicuserid).toMatch(/^sess:[0-9a-f-]{36}$/);
            const p1 = w.db.sessions.get(IDS.ses);
            const p2 = w.db.sessions.get(res.nPart2Sesid);
            expect(p1).toMatchObject({ cSyncState: 'S', cStatus: 'C', nPartNo: 1 });
            expect(p2).toMatchObject({ cFeedSource: 'D', bEverEdge: false, nPrevPartSesid: IDS.ses, nPartNo: 2, cStatus: 'R' });

            const routes = readRoutes(w);
            expect(routes.find((r: any) => r.nSesid === IDS.ses)).toBeUndefined();
            const moved = routes.find((r: any) => r.nSesid === res.nPart2Sesid);
            expect(moved).toMatchObject({ user: 'courtroom-1', passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', passwordEnc: 'v1.secret', feedSource: 'D' });
            expect(moved.nEdgeid).toBeUndefined();
            expect(moved.epoch).toBeUndefined();

            expect(w.db.callsOf('rtedge_applied').pop()).toMatchObject({ nSesid: IDS.ses, nAppliedRawSeq: box.headSeq });
            await until(() => w.db.eventsOf('split_route').length === 1);
            expect(w.db.eventsOf('split_route')[0].jData).toMatchObject({ nPart2Sesid: res.nPart2Sesid, bHashCopied: true, bEncCopied: true });
            expect(w.link.push).toHaveBeenCalledWith(IDS.box, 'c.assign', { op: 'end', nSesid: IDS.ses });
            expect(w.apply.emits).toContainEqual({ to: '*', event: 'on-notification', payload: expect.objectContaining({ nSesid: res.nPart2Sesid, cStatus: 'R' }) });
            expect(w.apply.emits).toContainEqual(expect.objectContaining({ to: `S${IDS.ses}`, payload: expect.objectContaining({ type: 'edge-split', nPart2Sesid: res.nPart2Sesid }) }));
            expect(res).toMatchObject({ msg: 1, bAlready: false, nPartNo: 2, cHost: 'cloud.example', nPort: 2501, cEclipseUsername: 'courtroom-1', bRouteMoved: true, routeError: null });
            expect(res.reporter).toMatchObject({ mode: 'listen' });
            expect(res.reporter.steps[0]).toContain('change only the server address to cloud.example, port 2501');
        });

        it('tells a dial-mode reporter to switch Eclipse to "Connect to server" (O-5)', async () => {
            const w = make();
            await w.registry.recordStatus(IDS.box, { sessions: [{ nSesid: IDS.ses, transmitterMode: 'dial' }], device: {} }, '10.0.0.1');
            const res = await w.sync.split(IDS.ses, ADMIN);
            expect(res.reporter.mode).toBe('dial');
            expect(res.reporter.steps[0]).toBe('In Eclipse, switch realtime output to "Connect to server".');
            expect(reporterInstructions(null, 'h', 1, null).steps[1]).toContain('the same username');
        });

        it('is idempotent: a repeat returns the same Part 2 and leaves the moved route alone', async () => {
            const w = make();
            const first = await w.sync.split(IDS.ses, ADMIN);
            const again = await w.sync.split(IDS.ses, ADMIN);
            expect(again).toMatchObject({ bAlready: true, nPart2Sesid: first.nPart2Sesid });
            expect([...w.db.sessions.values()].filter(s => s.nPrevPartSesid === IDS.ses)).toHaveLength(1);
            expect(readRoutes(w).filter((r: any) => r.nSesid === first.nPart2Sesid)).toHaveLength(1);
        });

        it('refuses anyone but a super-admin or the hearing operator, a non-venue session, a missing session', async () => {
            const w = make(({ db }) => db.addSession({ nSesid: IDS.ses2, cFeedSource: 'D', nEdgeid: null, bEverEdge: false, cSyncState: null }));
            await expect(w.sync.split(IDS.ses, STRANGER)).rejects.toMatchObject({ code: 'NOT_ALLOWED', status: 403 });
            await expect(w.sync.split(IDS.ses2, ADMIN)).rejects.toMatchObject({ code: 'STATE' });
            await expect(w.sync.split(IDS.ses3, ADMIN)).rejects.toMatchObject({ code: 'NOT_FOUND' });
            await expect(w.sync.split('nope', ADMIN)).rejects.toMatchObject({ code: 'INVALID' });
            expect(w.db.callsOf('rtedge_session_split')).toHaveLength(0);
        });

        it('refuses before any change when Part 1 has no Eclipse route to carry over', async () => {
            const w = make();
            fs.writeFileSync(w.routeFile, '[]');
            await expect(w.sync.split(IDS.ses, ADMIN)).rejects.toMatchObject({ code: 'STATE', extra: { cCode: 'ROUTE_MISSING' } });
            expect(w.db.sessions.get(IDS.ses).cSyncState).toBe('L');
        });

        it('records the split and pages P1 when the route file cannot be written; a retry moves the route', async () => {
            const w = make();
            const spy = jest.spyOn(w.registry, 'updateRoutes').mockRejectedValueOnce(new Error('disk full'));
            const res = await w.sync.split(IDS.ses, ADMIN);
            expect(res).toMatchObject({ bRouteMoved: false, routeError: 'disk full' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'SPLIT_ROUTE_FAILED')?.tier).toBe('P1');
            spy.mockRestore();
            const retry = await w.sync.split(IDS.ses, ADMIN);
            expect(retry).toMatchObject({ bAlready: true, bRouteMoved: true });
            expect(readRoutes(w).map((r: any) => r.nSesid)).toEqual([res.nPart2Sesid]);
        });

        it('refuses a split of a sealed session (SP SEALED)', async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'K'));
            await expect(w.sync.split(IDS.ses, ADMIN)).rejects.toMatchObject({ code: 'STATE', extra: { cCode: 'SEALED' } });
        });

        it("C5: tells the viewer gateway (through the apply port) about Part 2's new feed path; Part 1 keeps its venue verdict", async () => {
            const w = make();
            const res = await w.sync.split(IDS.ses, ADMIN);
            // Part 1 is still 'E' (its box uploads its tail): forgetting it would let a legacy event through until the
            // gateway's re-read answered.
            expect(w.apply.feedPathChanges).toEqual([res.nPart2Sesid]);
            await expect(w.sync.split(IDS.ses3, ADMIN)).rejects.toMatchObject({ code: 'NOT_FOUND' });
            expect(w.apply.feedPathChanges).toHaveLength(1);
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('Use direct cloud instead (O-8)', () => {
        const fresh = (w: W, session: any = { nSesid: IDS.ses, bytesIn: 0, catConnected: false, totalLines: 0 }) =>
            w.registry.recordStatus(IDS.box, { sessions: session ? [session] : [], device: {} }, '10.0.0.1');

        it('re-binds a never-fed session to D after the box confirms it dropped it', async () => {
            const w = make();
            await fresh(w);
            const res = await w.sync.useDirectCloud(IDS.ses, OPERATOR);
            expect(w.link.push).toHaveBeenCalledWith(IDS.box, 'c.assign', { op: 'purge', nSesid: IDS.ses });
            // The re-bind is et_rtedge_session_rebind_direct (migration file 09), not a direct UPDATE.
            expect(w.db.callsOf('rtedge_session_rebind_direct')).toEqual([{ nSesid: IDS.ses, nEdgeid: IDS.box }]);
            expect(w.db.sql.filter(([sql]) => /\b(UPDATE|INSERT|DELETE)\b/i.test(sql))).toEqual([]);
            expect(w.db.sessions.get(IDS.ses)).toMatchObject({ cFeedSource: 'D', cApply: 'L', nEdgeid: null, bEverEdge: false, cSyncState: null });
            const route = readRoutes(w)[0];
            expect(route).toMatchObject({ nSesid: IDS.ses, feedSource: 'D', user: 'courtroom-1' });
            expect(route.nEdgeid).toBeUndefined();
            expect(res).toMatchObject({ msg: 1, cFeedSource: 'D', cHost: 'cloud.example', nPort: 2501, bBoxConfirmed: true });
            await until(() => w.db.eventsOf('rebind_direct').length === 1);
        });

        it('accepts a box that never armed the session (absent from its status)', async () => {
            const w = make();
            await fresh(w, null);
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).resolves.toMatchObject({ cFeedSource: 'D' });
        });

        it('refuses after the first byte: the cloud raw store holds a CONN_OPEN / DATA record', async () => {
            const w = make();
            await fresh(w);
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            await w.sync.raw(w.conn, box.rawBatch(1));
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'FEED_STARTED' } });
            expect(w.db.sessions.get(IDS.ses).cFeedSource).toBe('E');
        });

        it('refuses when the box reports bytes, a connected CAT or lines for the session', async () => {
            const w = make();
            for (const s of [{ bytesIn: 10 }, { catConnected: true }, { totalLines: 3 }]) {
                await fresh(w, { nSesid: IDS.ses, ...s });
                await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'FEED_STARTED' } });
            }
            expect(w.link.push).not.toHaveBeenCalled();
        });

        it('refuses when the box is offline, has no fresh status, or does not confirm the purge', async () => {
            const w = make();
            w.link.connection.mockReturnValueOnce(null);
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'BOX_UNVERIFIED' } });
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'BOX_UNVERIFIED' } });
            await fresh(w);
            w.clock.now += 31_000;
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'BOX_UNVERIFIED' } });
            await fresh(w);
            w.link.push.mockResolvedValueOnce({ delivered: true, reply: { ok: false } });
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'BOX_REFUSED' } });
            w.link.push.mockResolvedValueOnce({ delivered: false, error: 'timeout' });
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'BOX_REFUSED' } });
            expect(w.db.sessions.get(IDS.ses).cFeedSource).toBe('E');
        });

        it('answers CONFLICT and changes nothing when the SP finds the session changed after the checks (a held stream appeared)', async () => {
            const w = make();
            await fresh(w);
            // The service does not read orphans; the SP's NOT EXISTS guard does.
            w.db.orphans.set('dddddddd-dddd-4ddd-8ddd-000000000099', { nOrphanid: 'dddddddd-dddd-4ddd-8ddd-000000000099', nSesid: IDS.ses, cKind: 'H', cStatus: 'P' });
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ code: 'CONFLICT', extra: { cCode: 'CONFLICT' } });
            expect(w.db.callsOf('rtedge_session_rebind_direct')).toHaveLength(1);
            expect(w.db.sessions.get(IDS.ses)).toMatchObject({ cFeedSource: 'E', bEverEdge: true, cSyncState: 'L', nEdgeid: IDS.box });
            expect(readRoutes(w)[0]).toMatchObject({ nSesid: IDS.ses, feedSource: 'E', nEdgeid: IDS.box });
            await new Promise(r => setTimeout(r, 10));
            expect(w.db.eventsOf('rebind_direct')).toHaveLength(0);
        });

        it("C5: a committed re-bind reaches the viewer gateway through the apply port (forgetIngestLane: legacy ingest is judged on 'D' at once); a refused one does not", async () => {
            const w = make();
            await fresh(w);
            const orphan = 'dddddddd-dddd-4ddd-8ddd-000000000098';
            w.db.orphans.set(orphan, { nOrphanid: orphan, nSesid: IDS.ses, cKind: 'H', cStatus: 'P' });
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ code: 'CONFLICT' });
            expect(w.apply.feedPathChanges).toEqual([]);
            w.db.orphans.delete(orphan);
            await fresh(w);
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).resolves.toMatchObject({ cFeedSource: 'D' });
            expect(w.apply.feedPathChanges).toEqual([IDS.ses]);
        });

        it('C5: a failed venue create unbound by EclipseSessionService (registry.noteFeedPathChanged) reaches the gateway and drops the cached binding', async () => {
            const w = make();
            expect((await w.sync.binding(IDS.ses)).cFeedSource).toBe('E');
            Object.assign(w.db.sessions.get(IDS.ses), { cFeedSource: 'D', nEdgeid: null, cSyncState: null });
            w.registry.noteFeedPathChanged(IDS.ses);
            expect(w.apply.feedPathChanges).toEqual([IDS.ses]);
            expect((await w.sync.binding(IDS.ses)).cFeedSource).toBe('D');
            // A port that throws never breaks the caller.
            jest.spyOn(w.apply, 'feedPathChanged').mockImplementation(() => {
                throw new Error('gateway gone');
            });
            expect(() => w.sync.feedPathChanged(IDS.ses)).not.toThrow();
        });

        it('refuses once a round was applied (PG watermark), a stranger, and a session that is not a live venue session', async () => {
            const w = make(({ db }) => {
                db.sessions.get(IDS.ses).nAppliedRawSeq = 4;
                db.addSession({ nSesid: IDS.ses2, cSyncState: 'S' });
            });
            await fresh(w);
            await expect(w.sync.useDirectCloud(IDS.ses, ADMIN)).rejects.toMatchObject({ extra: { cCode: 'FEED_STARTED' } });
            await expect(w.sync.useDirectCloud(IDS.ses, STRANGER)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
            await expect(w.sync.useDirectCloud(IDS.ses2, ADMIN)).rejects.toMatchObject({ code: 'STATE' });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('revoking a box', () => {
        it("disconnects it, revokes its certificate, re-binds unfed live sessions, splits fed ones and lists the rest for a forced close", async () => {
            const w = make(({ db }) => {
                db.addSession({ nSesid: IDS.ses2, nAppliedRawSeq: 9 });
                db.addSession({ nSesid: IDS.ses3, cSyncState: 'S' });
                db.addSession({ nSesid: 'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc', dDelDt: new Date() });
            });
            fs.writeFileSync(w.routeFile, JSON.stringify([ROUTE, { ...ROUTE, nSesid: IDS.ses2, user: 'courtroom-2' }]));
            const res = await w.sync.revokeBox(ADMIN, IDS.box, 'stolen');
            expect(w.db.nodes.get(IDS.box).cStatus).toBe('X');
            expect(w.link.disconnect).toHaveBeenCalledWith(IDS.box, 'REVOKED', expect.any(String));
            expect(w.issuer.revoke).toHaveBeenCalledWith({ nEdgeid: IDS.box, cSlug: expect.any(String) });
            const by = Object.fromEntries(res.sessions.map(s => [s.nSesid, s.action]));
            expect(by[IDS.ses]).toBe('direct');
            expect(by[IDS.ses2]).toBe('split');
            expect(by[IDS.ses3]).toBe('force-close-needed');
            expect(by['bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcbc']).toBe('force-close-needed');
            expect(w.db.sessions.get(IDS.ses).cFeedSource).toBe('D');
            expect(w.db.sessions.get(IDS.ses2).cSyncState).toBe('S');
            expect(w.registry.recentAlerts().find(a => a.kind === 'REVOKED_BOX_SESSIONS')?.tier).toBe('P2');
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('boot recompute (D18) and state loss (O-7)', () => {
        it('recomputes digests from the restored pages: a stale page and an extra page make the box resend, then roots converge', async () => {
            const first = make();
            const box = new BoxSim(IDS.ses, first.key).arm().connOpen();
            box.addLines(50);
            const st = await syncUp(first, box);
            const meta = first.sync.peekMeta(IDS.ses);
            expect(meta.appliedRev).toBe(st.appliedRev);
            await first.sync.flushMetaWrites();
            // The cloud crashed between flushes: page 2 is older than the meta says, a stray page 3 survived.
            const store = first.apply.store(IDS.ses);
            store.set(2, [line(25, 'old text'), ...store.get(2).slice(1)]);
            store.set(3, [line(50)]);

            const w = make(undefined, { db: first.db, redis: first.redis, apply: first.apply, dir: first.dir, key: first.key });
            const reply: any = await w.sync.hello(w.conn, hello(box));
            const s = reply.sessions[0];
            expect(s.verdict).toBe('continue');
            expect(s.pageDigests[0]).toBe(meta.digests[0]);
            expect(s.pageDigests[1]).toBe(pageDigest(store.get(2)));
            expect(s.pageDigests[1]).not.toBe(meta.digests[1]);
            expect(first.apply.store(IDS.ses).has(3)).toBe(false);
            const alert = w.registry.recentAlerts().find(a => a.kind === 'BOOT_STALE_PAGES');
            expect(alert).toMatchObject({ tier: 'P2', data: { stalePages: [2], missingPages: [] } });

            const resume = resumeFromHello(s, box.journal());
            box.cutter.advanceRev(resume.appliedRev);
            const built = box.round(resume.cloud, resume.lineage);
            expect(built.dirty).toEqual([2]);
            const ok: any = await w.sync.round(w.conn, built.parts[0]);
            expect(ok.ok).toBe(true);
            expect(rootDigest(IDS.ses, 50, [...first.apply.store(IDS.ses).values()].map(p => pageDigest(p)))).toBe(box.cutter.view().root);
        });

        it("advertises '' for a page missing after a restart", async () => {
            const first = make();
            const box = new BoxSim(IDS.ses, first.key).arm().connOpen();
            box.addLines(30);
            await syncUp(first, box);
            await first.sync.flushMetaWrites();
            first.apply.store(IDS.ses).delete(2);
            const w = make(undefined, { db: first.db, redis: first.redis, apply: first.apply, dir: first.dir, key: first.key });
            const reply: any = await w.sync.hello(w.conn, hello(box));
            expect(reply.sessions[0].pageDigests[1]).toBe('');
            expect(w.registry.recentAlerts().find(a => a.kind === 'BOOT_STALE_PAGES')?.data).toMatchObject({ missingPages: [2] });
        });

        it('prefers the newer of Redis and edge-meta.json', async () => {
            const w = make(({ redis }) => {
                const m = { ...emptyCloudMeta(IDS.ses), appliedRev: 3, nEdgeid: IDS.box };
                void redis.setValue(`edge:meta:${IDS.ses}`, JSON.stringify(m));
            });
            const file = path.join(w.dir, 'journal', IDS.ses, 'edge-meta.json');
            fs.mkdirSync(path.dirname(file), { recursive: true });
            fs.writeFileSync(file, JSON.stringify({ ...emptyCloudMeta(IDS.ses), appliedRev: 5, nEdgeid: IDS.box }));
            const box = new BoxSim(IDS.ses, w.key).arm();
            const reply: any = await w.sync.hello(w.conn, hello(box));
            expect(reply.sessions[0].appliedRev).toBe(5);
        });

        it('falls back to the PG watermark pair after a state loss (O-7) and alerts P2', async () => {
            const box = new BoxSim(IDS.ses, deviceKey()).arm().connOpen();
            box.addLines(5);
            const w = make(({ db }) => {
                db.sessions.get(IDS.ses).nAppliedRawSeq = 4;
                db.sessions.get(IDS.ses).cAppliedRawHash = box.hashes[4];
            });
            w.conn.pubKey = box.key.spkiB64;
            const reply: any = await w.sync.hello(w.conn, hello(box));
            expect(reply.sessions[0]).toMatchObject({ verdict: 'continue', appliedRawSeq: 4, appliedRawHash: box.hashes[4] });
            expect(w.registry.recentAlerts().find(a => a.kind === 'META_FALLBACK')?.tier).toBe('P2');
            const resume = resumeFromHello(reply.sessions[0], box.journal());
            box.cutter.advanceRev(resume.appliedRev);
            const r: any = await w.sync.round(w.conn, box.round(resume.cloud, resume.lineage).parts[0]);
            expect(r.ok).toBe(true);
        });

        it('checks the seq only when the PG pair has no hash (LINEAGE_UNVERIFIED, P2)', async () => {
            const box = new BoxSim(IDS.ses, deviceKey()).arm().connOpen();
            box.addLines(5);
            const w = make(({ db }) => (db.sessions.get(IDS.ses).nAppliedRawSeq = 4));
            const reply: any = await w.sync.hello(w.conn, hello(box));
            expect(reply.sessions[0].appliedRawHash).toBeNull();
            const resume = resumeFromHello(reply.sessions[0], box.journal());
            box.cutter.advanceRev(resume.appliedRev);
            expect(((await w.sync.round(w.conn, box.round(resume.cloud, resume.lineage).parts[0])) as any).ok).toBe(true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'LINEAGE_UNVERIFIED')?.tier).toBe('P2');
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('seal edge cases', () => {
        async function ended(w: W, lines = 40) {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(lines);
            const st = await syncUp(w, box);
            box.end();
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            return { box, st };
        }

        it('deletes stored pages beyond the sealed transcript, then accepts the seal', async () => {
            const w = make();
            const { box, st } = await ended(w);
            w.apply.store(IDS.ses).set(9, [line(200)]);
            expect(await w.sync.seal(w.conn, box.seal(st.appliedRev, st.cloud))).toEqual({ complete: true, state: 'K' });
            expect(w.apply.store(IDS.ses).has(9)).toBe(false);
        });

        it('adds cloud-side incidents (SHRINK_CONFIRMED) to the sealed list, making the session W', async () => {
            const w = make();
            const { box, st } = await ended(w);
            w.sync.peekMeta(IDS.ses).cloudIncidents = [{ kind: 'SHRINK_CONFIRMED', level: 'warning', lines: 600 }];
            expect(await w.sync.seal(w.conn, box.seal(st.appliedRev, st.cloud))).toEqual({ complete: true, state: 'W' });
            const sp = w.db.callsOf('rtedge_session_seal')[0];
            expect(sp.jIncidents).toEqual([{ kind: 'SHRINK_CONFIRMED', level: 'warning', lines: 600 }]);
            expect(sp.jSeal).toMatchObject({ nSesid: IDS.ses, finalRev: st.appliedRev });
        });

        it('refuses a seal while the uplink is frozen, from another box, or when the database refuses it (P1)', async () => {
            const w = make();
            const { box, st } = await ended(w);
            const seal = box.seal(st.appliedRev, st.cloud);
            const other = { ...w.conn, nEdgeid: IDS.box2 };
            expect((await w.sync.seal(other, seal)).complete).toBe(false);
            w.db.fail.set('rtedge_session_seal', 'connection reset');
            expect((await w.sync.seal(w.conn, seal)).complete).toBe(false);
            w.db.fail.delete('rtedge_session_seal');
            w.db.sessions.get(IDS.ses).nIngestEpoch = 2;
            w.sync.invalidateBinding(IDS.ses);
            expect((await w.sync.seal(w.conn, seal)).complete).toBe(false);
            w.db.sessions.get(IDS.ses).nIngestEpoch = 1;
            w.sync.peekMeta(IDS.ses).frozen = true;
            expect((await w.sync.seal(w.conn, seal)).complete).toBe(false);
            expect(w.apply.ended).toHaveLength(0);
        });

        it('refuses a malformed seal and a quarantined box', async () => {
            const w = make();
            expect(await w.sync.seal(w.conn, { nSesid: IDS.ses } as any)).toEqual({ complete: false, needPages: [] });
            const q = { ...w.conn, status: 'Q' as const };
            const { box, st } = await ended(w);
            expect((await w.sync.seal(q, box.seal(st.appliedRev, st.cloud))).complete).toBe(false);
        });

        it('a repeated seal re-runs the deferred end body when the first one failed, then never again (review #4)', async () => {
            const w = make();
            const { box, st } = await ended(w);
            const seal = box.seal(st.appliedRev, st.cloud);
            const end = jest.spyOn(w.apply, 'completeSessionEnd').mockResolvedValueOnce({ ok: false, via: 'session-service', detail: { msg: -1, cCode: 'UNVERIFIED' } });
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'END_BODY_FAILED')).toMatchObject({ tier: 'P2', nSesid: IDS.ses });
            expect(w.sync.peekMeta(IDS.ses).sealed).toMatchObject({ state: 'K', endBodyAtMs: null });
            // The box repeats its seal (a retry timer would too): the end body runs again and completes.
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(end).toHaveBeenCalledTimes(2);
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            expect(w.sync.peekMeta(IDS.ses).sealed).toMatchObject({ state: 'K', endBodyAtMs: expect.any(Number) });
            // Completed: another repeat answers from the binding without running it again.
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(end).toHaveBeenCalledTimes(2);
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(1);
        });

        it('a seal repeated after a restart between the seal SP and the end body runs the end body (review #33)', async () => {
            const w = make();
            const { box, st } = await ended(w);
            const seal = box.seal(st.appliedRev, st.cloud);
            // The process dies right after et_rtedge_session_seal committed: the end body never completes, the box
            // never gets the ack.
            jest.spyOn(w.apply, 'completeSessionEnd').mockImplementationOnce(() => new Promise(() => undefined));
            void w.sync.seal(w.conn, seal);
            await until(() => w.db.sessions.get(IDS.ses).cSyncState === 'K');
            await until(() => w.sync.peekMeta(IDS.ses)?.sealed?.state === 'K');
            await w.sync.flushMetaWrites();
            expect(w.apply.ended).toEqual([]);
            // A new process on the same stores; the box reconnects and repeats its seal.
            const w2 = make(undefined, { db: w.db, redis: w.redis, apply: w.apply, dir: w.dir, key: w.key });
            expect(await w2.sync.seal(w2.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            expect(w2.sync.peekMeta(IDS.ses).sealed).toMatchObject({ state: 'K', endBodyAtMs: expect.any(Number) });
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(1);
        });

        it('no round applies between a verified seal and its SP (the seal is a binding change, §5.5 step 0)', async () => {
            const w = make();
            const { box, st } = await ended(w);
            const seal = box.seal(st.appliedRev, st.cloud);
            let release!: () => void;
            const real = w.db.executeRef.bind(w.db);
            jest.spyOn(w.db, 'executeRef').mockImplementation(async (name: string, params: any) => {
                if (name === 'rtedge_session_seal') await new Promise<void>(res => (release = res));
                return real(name, params);
            });
            const sealing = w.sync.seal(w.conn, seal);
            await until(() => typeof release === 'function');
            expect((w.sync as any).fenced.has(IDS.ses)).toBe(true);
            release();
            expect(await sealing).toEqual({ complete: true, state: 'K' });
            expect((w.sync as any).fenced.has(IDS.ses)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('the deferred end body: forced close and the sweep (review #4 / #33)', () => {
        it('a repeated forced close runs the end body when the first one failed, and completes it once', async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'S'));
            jest.spyOn(w.apply, 'completeSessionEnd').mockResolvedValueOnce({ ok: false, via: 'session-service', detail: { cCode: 'UNVERIFIED' } });
            const first = await w.sync.forceSeal(ADMIN, IDS.ses, 'INCOMPLETE - venue data missing 10:02-11:40');
            expect(first).toMatchObject({ cSyncState: 'F', endBody: { ok: false } });
            expect(w.apply.ended).toEqual([]);
            const again: any = await w.sync.forceSeal(ADMIN, IDS.ses, 'x');
            expect(again).toMatchObject({ bAlready: true, endBody: { ok: true } });
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            const third: any = await w.sync.forceSeal(ADMIN, IDS.ses, 'x');
            expect(third.endBody).toMatchObject({ ok: true, via: 'done' });
            expect(w.apply.ended).toHaveLength(1);
        });

        it("the sweep finishes sealed sessions whose dormant 'E' route is still in the route file, and leaves live ones alone", async () => {
            const w = make(({ db }) => {
                db.sessions.get(IDS.ses).cSyncState = 'K';
                db.addSession({ nSesid: IDS.ses2 });
            });
            fs.writeFileSync(w.routeFile, JSON.stringify([ROUTE, { ...ROUTE, nSesid: IDS.ses2, user: 'courtroom-2' }, { ...ROUTE, nSesid: IDS.ses3, feedSource: 'D' }]));
            expect(await w.sync.sweepEndedRoutes()).toEqual([IDS.ses]);
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            // The sealed session's dormant route is gone (here no route remover is attached to the end body), so the
            // next sweep has nothing to do; the live session's route stays.
            expect(readRoutes(w).map((r: any) => r.nSesid)).toEqual([IDS.ses2, IDS.ses3]);
            expect(await w.sync.sweepEndedRoutes()).toEqual([]);
            expect(w.apply.ended).toHaveLength(1);
            // Nothing to do without 'E' routes: no database read at all.
            fs.writeFileSync(w.routeFile, JSON.stringify([{ ...ROUTE, nSesid: IDS.ses3, feedSource: 'D' }]));
            const reads = jest.spyOn(w.db, 'rowQuery');
            expect(await w.sync.sweepEndedRoutes()).toEqual([]);
            expect(reads).not.toHaveBeenCalled();
        });

        it("removes a sealed soft-deleted session's dormant route itself (the gate cannot see a deleted session)", async () => {
            const w = make(({ db }) => Object.assign(db.sessions.get(IDS.ses), { cSyncState: 'K', dDelDt: new Date() }));
            jest.spyOn(w.apply, 'completeSessionEnd').mockResolvedValueOnce({ ok: false, via: 'session-service', detail: { msg: -1, cCode: 'NOT_SEALED' } });
            expect(await w.sync.sweepEndedRoutes()).toEqual([IDS.ses]);
            expect(readRoutes(w).find((r: any) => r.nSesid === IDS.ses)).toBeUndefined();
            expect(w.registry.recentAlerts().find(a => a.kind === 'END_BODY_FAILED')).toBeUndefined();
        });

        it("C7: removes the dormant route the end body's SessionService step left behind (it answers msg 1 even then), at once, not at the 10-minute sweep", async () => {
            const w = make(({ db }) => {
                db.sessions.get(IDS.ses).cSyncState = 'K';
                db.addSession({ nSesid: IDS.ses2 });
            });
            fs.writeFileSync(w.routeFile, JSON.stringify([ROUTE, { ...ROUTE, nSesid: IDS.ses2, user: 'courtroom-2' }]));
            const b = (await w.sync.loadBindings([IDS.ses])).get(IDS.ses);
            // The memory port's completeSessionEnd removes no route: exactly the failed best-effort removal.
            expect(await w.sync.finishEnd(IDS.ses, b)).toMatchObject({ ok: true, via: 'session-service' });
            expect(w.apply.ended).toHaveLength(1);
            expect(readRoutes(w).map((r: any) => r.nSesid)).toEqual([IDS.ses2]);
            expect(w.registry.recentAlerts().find(a => a.kind === 'END_BODY_FAILED')).toBeUndefined();
            // Completed: a repeat neither runs it nor touches the file.
            const remove = jest.spyOn(w.registry, 'removeRoute');
            expect(await w.sync.finishEnd(IDS.ses, b)).toMatchObject({ ok: true, via: 'done' });
            expect(remove).not.toHaveBeenCalled();
        });

        it('C7: when the leftover route cannot be removed either, the end body counts as failed (P2, with the cause) and is retried until the route is gone', async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'K'), undefined, { endBodyRetryMs: 20 });
            const remove = jest.spyOn(w.registry, 'removeRoute').mockRejectedValueOnce(new Error('disk full'));
            const b = (await w.sync.loadBindings([IDS.ses])).get(IDS.ses);
            expect(await w.sync.finishEnd(IDS.ses, b)).toMatchObject({ ok: false, detail: { routeLeft: expect.stringContaining('disk full') } });
            expect(w.registry.recentAlerts().find(a => a.kind === 'END_BODY_FAILED')?.message).toContain('disk full');
            expect(readRoutes(w).map((r: any) => r.nSesid)).toEqual([IDS.ses]);
            await until(() => readRoutes(w).length === 0, 3000);
            await until(() => !(w.sync as any).endRetry.has(IDS.ses), 3000);
            expect(remove).toHaveBeenCalledTimes(2);
            expect(w.apply.ended).toHaveLength(2);
        });

        it('a failed end body is retried on a timer until it completes', async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'K'), undefined, { endBodyRetryMs: 20 });
            jest.spyOn(w.apply, 'completeSessionEnd').mockResolvedValueOnce({ ok: false, via: 'session-service' }).mockResolvedValueOnce({ ok: false, via: 'session-service' });
            const b = (await w.sync.loadBindings([IDS.ses])).get(IDS.ses);
            expect(await w.sync.finishEnd(IDS.ses, b)).toMatchObject({ ok: false });
            await until(() => w.apply.ended.length === 1, 3000);
            expect((w.sync as any).endRetry.has(IDS.ses)).toBe(false);
        });

        it('sweeps at boot only with EDGE_ENABLED (today\'s production runs nothing new)', async () => {
            const on = make();
            const sweep = jest.spyOn(on.sync, 'sweepEndedRoutes');
            on.sync.onApplicationBootstrap();
            await until(() => sweep.mock.calls.length === 1);
            const off = make();
            off.config.values.EDGE_ENABLED = undefined;
            const none = jest.spyOn(off.sync, 'sweepEndedRoutes');
            off.sync.onApplicationBootstrap();
            await new Promise(res => setTimeout(res, 30));
            expect(none).not.toHaveBeenCalled();
            expect((off.sync as any).sweepTimer).toBeNull();
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('forced close, acknowledgement, feed status, watermark', () => {
        it("force-closes an end-requested session (super-admin), runs the end body once", async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'S'));
            const res = await w.sync.forceSeal(ADMIN, IDS.ses, 'INCOMPLETE - venue data missing 10:02-11:40');
            expect(res).toMatchObject({ cSyncState: 'F', endBody: { ok: true } });
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            const again: any = await w.sync.forceSeal(ADMIN, IDS.ses, 'x');
            expect(again.bAlready).toBe(true);
            expect(w.apply.ended).toHaveLength(1);
        });

        it('refuses a forced close of a live session and by a non-admin', async () => {
            const w = make();
            await expect(w.sync.forceSeal(ADMIN, IDS.ses, 'x')).rejects.toMatchObject({ code: 'STATE' });
            await expect(w.sync.forceSeal(OPERATOR, IDS.ses, 'x')).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
        });

        it("acknowledges a 'W' session for the hearing operator and refuses others", async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cSyncState = 'W'));
            await expect(w.sync.warnAck(STRANGER, IDS.ses)).rejects.toMatchObject({ code: 'NOT_ALLOWED' });
            await expect(w.sync.warnAck(OPERATOR, IDS.ses, 'read')).resolves.toMatchObject({ cSyncState: 'W', nWarnAckBy: IDS.operator });
            w.db.sessions.get(IDS.ses).cSyncState = 'K';
            await expect(w.sync.warnAck(ADMIN, IDS.ses)).rejects.toMatchObject({ code: 'STATE' });
        });

        it('reports a session sync state', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            await syncUp(w, box);
            const st = await w.sync.feedStatus(IDS.ses);
            expect(st).toMatchObject({ msg: 1, cFeedSource: 'E', cSyncState: 'L', box: { online: true }, meta: { totalLines: 30, pages: 2, frozen: false }, raw: { seq: box.headSeq } });
            await expect(w.sync.feedStatus(IDS.ses2)).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('throttles the PG watermark to once a minute, writes it exactly on demand, and freezes on a PG FORK', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            const st = await syncUp(w, box);
            await until(() => w.db.callsOf('rtedge_applied').length === 1);
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            await push(w, box, st);
            await new Promise(r => setTimeout(r, 10));
            expect(w.db.callsOf('rtedge_applied')).toHaveLength(1);
            w.clock.now += 61_000;
            box.addLines(1);
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            await push(w, box, st);
            await until(() => w.db.callsOf('rtedge_applied').length === 2);
            const m = w.sync.peekMeta(IDS.ses);
            w.db.sessions.get(IDS.ses).cAppliedRawHash = 'f'.repeat(64);
            await w.sync.persistApplied(m, true);
            expect(m.frozen).toBe(true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'FORK')?.tier).toBe('P1');
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('fencing and size limits (security review)', () => {
        it('§5.5 step 0: a binding change in progress answers BUSY inside the apply task, and once settled the round applies nothing', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            expect(w.apply.applied).toHaveLength(1);
            // A binding change (re-bind, forced close, seal) whose SP is still running: its barrier raised the fence.
            let release!: () => void;
            const gate = new Promise<void>(res => (release = res));
            const change = (w.sync as any).changeBinding(IDS.ses, async () => {
                await gate;
                w.db.sessions.get(IDS.ses).nEdgeid = IDS.box2;
            });
            await until(() => (w.sync as any).fenced.has(IDS.ses));
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(st.lineage.appliedRawSeq! + 1));
            expect(await push(w, box, st)).toEqual({ ok: false, code: 'BUSY', retryMs: 1000 });
            release();
            await change;
            // Settled: the record is re-read from the committed row (moved to another box); nothing applies.
            expect(await push(w, box, st)).toEqual({ ok: false, code: 'NOT_BOUND' });
            expect(w.apply.applied).toHaveLength(1);
        });

        it('§5.5 step 0: a box revoked or quarantined while its round waited in the queue applies nothing', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            for (const status of ['X', 'Q'] as const) {
                const conn: EdgeConnCtx = { ...w.conn };
                let release!: () => void;
                const blocker = w.apply.runBarrier('another session', () => new Promise<void>(res => (release = res)));
                box.addLines(5);
                await w.sync.raw(w.conn, box.rawBatch(w.raw.head(IDS.ses).seq + 1));
                const built = box.round(st.cloud, st.lineage)!;
                const pending = w.sync.round(conn, built.parts[0]);
                await new Promise(res => setTimeout(res, 20));
                conn.status = status;
                release();
                await blocker;
                expect(await pending).toEqual({ ok: false, code: 'NOT_BOUND' });
            }
            expect(w.apply.applied).toHaveLength(1);
        });

        it('#32: a binding read that hangs inside the queue answers BUSY within the bound, and the next queue task (a live write) runs', async () => {
            const w = make(undefined, undefined, { queueIoBoundMs: 50 });
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            let release!: () => void;
            const blocker = w.apply.runBarrier('another session', () => new Promise<void>(res => (release = res)));
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(st.lineage.appliedRawSeq! + 1));
            const built = box.round(st.cloud, st.lineage)!;
            const pending = w.sync.round(w.conn, built.parts[0]);
            await new Promise(res => setTimeout(res, 20));
            // A barrier dropped the cached record meanwhile, and PG never answers.
            w.sync.invalidateBinding(IDS.ses);
            const hang = jest.spyOn(w.db, 'rowQuery').mockImplementation(() => new Promise(() => undefined));
            const liveWrite = w.apply.runBarrier('a legacy session', async () => 'feedReceive ran');
            const t0 = Date.now();
            release();
            await blocker;
            expect(await pending).toEqual({ ok: false, code: 'BUSY', retryMs: 2000 });
            expect(Date.now() - t0).toBeLessThan(1000);
            expect(await liveWrite).toBe('feedReceive ran');
            hang.mockRestore();
            expect(w.apply.applied).toHaveLength(1);
            // The box retries: its per-message check reads the record once, BEFORE the queue; step 0 reads nothing.
            const reads = jest.spyOn(w.db, 'rowQuery');
            expect(await w.sync.round(w.conn, built.parts[0])).toMatchObject({ ok: true });
            expect(reads.mock.calls.filter(c => c[0] === EDGE_BINDING_SQL)).toHaveLength(1);
            reads.mockRestore();
            expect(w.apply.applied).toHaveLength(2);
        });

        it('#32: a Redis meta write that hangs does not hold the queue past the bound; it lands later, in order', async () => {
            const w = make(undefined, undefined, { queueIoBoundMs: 50 });
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            const realSet = w.redis.setValue.bind(w.redis);
            const parked: Array<() => void> = [];
            const slow = jest.spyOn(w.redis, 'setValue').mockImplementation((key: string, value: any, ttl?: any) => new Promise<void>(res => parked.push(() => void realSet(key, value, ttl).then(res))));
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(st.lineage.appliedRawSeq! + 1));
            const t0 = Date.now();
            const reply: any = await push(w, box, st);
            expect(reply).toMatchObject({ ok: true });
            expect(Date.now() - t0).toBeLessThan(1500);
            expect(parked.length).toBeGreaterThan(0);
            slow.mockRestore();
            while (parked.length) parked.shift()!();
            await w.sync.flushMetaWrites();
            expect(JSON.parse((await w.redis.getValue(`edge:meta:${IDS.ses}`)) ?? '{}').appliedRev).toBe(reply.appliedRev);
        });

        it('refuses everything but hello REVOKED from a box revoked while connected', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            const x: EdgeConnCtx = { ...w.conn, status: 'X' };
            expect(await w.sync.hello(x, hello(box))).toMatchObject({ ok: false, code: 'REVOKED' });
            box.addLines(5);
            const built = box.round(st.cloud, st.lineage)!;
            expect(await w.sync.round(x, built.parts[0])).toEqual({ ok: false, code: 'NOT_BOUND' });
            expect(await w.sync.raw(x, box.rawBatch(st.lineage.appliedRawSeq! + 1))).toMatchObject({ reason: 'epoch' });
            expect(await w.sync.rawPull(x, { nSesid: IDS.ses, fromSeq: 1, toSeq: 2 })).toEqual({ ok: false, code: 'NOT_BOUND' });
            expect(await w.sync.ready(x, { nSesid: IDS.ses })).toEqual({ ok: false });
            expect(await w.sync.capture(x, { kind: 'C', nSesid: IDS.ses, user: 'u', peer: '10.0.0.9', fromMs: 1, toMs: 2, bytes: 3, sha256: 'a'.repeat(64) })).toEqual({ ok: false });
            await w.sync.status(x, { sessions: [], device: {} });
            expect(w.registry.sessionStatus(IDS.box, IDS.ses)).toBeNull();
            expect(w.apply.applied).toHaveLength(1);
            // A quarantined box may not pull its journal back either (status only, §5.3).
            expect(await w.sync.rawPull({ ...w.conn, status: 'Q' }, { nSesid: IDS.ses, fromSeq: 1, toSeq: 2 })).toEqual({ ok: false, code: 'NOT_BOUND' });
        });

        it('refuses a round of too many parts, and drops a staged round over the byte limit (BAD_PAGE, P2)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            box.addLines(60);
            const built = box.round(st.cloud, st.lineage, 2_000)!;
            expect(built.parts.length).toBeGreaterThan(1);
            const many = { ...built.parts[0], parts: 100_000 };
            expect(await w.sync.round(w.conn, many)).toEqual({ ok: false, code: 'BAD_PAGE', p: 0 });
            expect(w.registry.recentAlerts().find(a => a.kind === 'BAD_ROUND')).toMatchObject({ tier: 'P2' });
            // A part that pushes the staged bytes over the limit drops the whole staging.
            const huge = { ...built.parts[0], pages: [{ p: 1, d: 'x', lines: [['x'.repeat(65 * 1024 * 1024)]] }] };
            expect(await w.sync.round(w.conn, huge)).toEqual({ ok: false, code: 'BAD_PAGE', p: 0 });
            // The honest multi-part round still applies afterwards.
            let reply: any;
            for (const part of built.parts) reply = await w.sync.round(w.conn, part);
            expect(reply).toMatchObject({ ok: true, appliedRev: built.parts[0].rev });
        });

        it('refuses a seal over the size limits without looking further (P2)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            box.end();
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            const seal = box.seal(st.appliedRev, st.cloud);
            const many = { ...seal, incidents: Array.from({ length: 10_001 }, () => ({ kind: 'LOCKOUT' as const, level: 'info' as const })) };
            expect(await w.sync.seal(w.conn, many)).toEqual({ complete: false, needPages: [] });
            expect(await w.sync.seal(w.conn, { ...seal, sig: 'A'.repeat(401) })).toEqual({ complete: false, needPages: [] });
            expect(await w.sync.seal(w.conn, { ...seal, endedBy: 'x'.repeat(201) })).toEqual({ complete: false, needPages: [] });
            expect(w.registry.recentAlerts().find(a => a.kind === 'BAD_SEAL')).toMatchObject({ tier: 'P2' });
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(0);
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
        });

        it('drops an oversized e.status instead of storing it', async () => {
            const w = make();
            await w.sync.status(w.conn, { sessions: Array.from({ length: 257 }, (_, i) => ({ nSesid: `s${i}` })), device: {} });
            await w.sync.status(w.conn, { sessions: [{ nSesid: IDS.ses, note: 'x'.repeat(300 * 1024) }], device: {} });
            expect(w.registry.sessionStatus(IDS.box, IDS.ses)).toBeNull();
            expect(w.redis.store.has(`edge:status:${IDS.box}`)).toBe(false);
            expect(w.registry.recentAlerts().find(a => a.kind === 'BAD_STATUS')).toMatchObject({ tier: 'P2' });
            await w.sync.status(w.conn, { sessions: [{ nSesid: IDS.ses, bytesIn: 0 }], device: {} });
            expect(w.registry.sessionStatus(IDS.box, IDS.ses)).toMatchObject({ reported: true });
        });

        it('shows a box back after more than 30 s offline as catching-up until a round leaves nothing dirty (§5.6)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            w.sync.boxConnected(w.conn);
            await until(() => w.sync.viewerState(IDS.ses) === 'live');
            w.sync.boxDisconnected(w.conn);
            await until(() => w.sync.viewerState(IDS.ses) === 'offline');
            w.clock.now += 31_000;
            w.sync.boxConnected(w.conn);
            await until(() => w.sync.viewerState(IDS.ses) === 'catching-up');
            // The box was offline but recorded more: a small round (≤ 8 pages) leaves it with nothing dirty.
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(st.lineage.appliedRawSeq! + 1));
            expect(await push(w, box, st)).toMatchObject({ ok: true });
            expect(w.sync.viewerState(IDS.ses)).toBe('live');
            // A short blip (≤ 30 s) never shows catching-up; a hello that matches the cloud's root clears it too.
            w.sync.boxDisconnected(w.conn);
            w.clock.now += 5_000;
            w.sync.boxConnected(w.conn);
            await until(() => w.sync.viewerState(IDS.ses) === 'live');
            w.sync.boxDisconnected(w.conn);
            w.clock.now += 40_000;
            w.sync.boxConnected(w.conn);
            await until(() => w.sync.viewerState(IDS.ses) === 'catching-up');
            await w.sync.hello(w.conn, hello(box));
            expect(w.sync.viewerState(IDS.ses)).toBe('live');
        });

        it('drops a sealed session\'s raw index from memory (meta written first, kept) and still answers a repeated seal and a feed-status read', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            box.end();
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            const seal = box.seal(st.appliedRev, st.cloud);
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(w.sync.peekMeta(IDS.ses)).toMatchObject({ sealed: { state: 'K' }, totalLines: 30 });
            expect(w.raw.loadedSessions()).not.toContain(IDS.ses);
            expect(JSON.parse(fs.readFileSync(w.sync.metaFile(IDS.ses), 'utf8')).sealed).toMatchObject({ state: 'K' });
            // A seal resent after a lost ack is answered from the binding; the status read reloads from the stores.
            expect(await w.sync.seal(w.conn, seal)).toEqual({ complete: true, state: 'K' });
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(1);
            expect((await w.sync.feedStatus(IDS.ses)).meta).toMatchObject({ totalLines: 30, sealed: { state: 'K' } });
            // C2: the status read reports the SEALED raw head and reloads nothing (the FE polls it every 10 s).
            expect((await w.sync.feedStatus(IDS.ses)).raw).toEqual({ seq: box.headSeq, hash: box.headHash, corrupt: null, loaded: false });
            expect(w.raw.loadedSessions()).not.toContain(IDS.ses);
        });

        it('C2: polling a sealed session in a new process loads neither its journal nor its pages, and keeps no meta', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            box.end();
            await w.sync.raw(w.conn, box.rawBatch(box.headSeq));
            expect(await w.sync.seal(w.conn, box.seal(st.appliedRev, st.cloud))).toEqual({ complete: true, state: 'K' });
            await w.sync.flushMetaWrites();
            const w2 = make(undefined, { db: w.db, redis: w.redis, apply: w.apply, dir: w.dir, key: w.key });
            const pages = jest.spyOn(w.apply, 'currentPages');
            const load = jest.spyOn(w2.raw, 'ensureLoaded');
            for (let k = 0; k < 3; k++) {
                expect(await w2.sync.feedStatus(IDS.ses)).toMatchObject({
                    cSyncState: 'K',
                    meta: { totalLines: 30, appliedRev: st.appliedRev, sealed: { state: 'K' } },
                    raw: { seq: box.headSeq, hash: box.headHash, loaded: false },
                });
            }
            expect(load).not.toHaveBeenCalled();
            expect(w2.raw.loadedSessions()).toEqual([]);
            expect(pages).not.toHaveBeenCalled();
            expect(w2.sync.peekMeta(IDS.ses)).toBeNull();
            // A forced close ('F') without a sealed raw head reports the PG watermark pair instead.
            Object.assign(w.db.sessions.get(IDS.ses), { cSyncState: 'F', nRawFinalSeq: null, cRawFinalHash: null, nAppliedRawSeq: 4, cAppliedRawHash: box.hashes[4] });
            w2.sync.invalidateBinding(IDS.ses);
            expect((await w2.sync.feedStatus(IDS.ses)).raw).toEqual({ seq: 4, hash: box.hashes[4], corrupt: null, loaded: false });
            expect(load).not.toHaveBeenCalled();
        });

        it('C2: a live venue session still loads its journal for the status read (its raw head moves)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(1));
            await w.raw.forget(IDS.ses);
            expect((await w.sync.feedStatus(IDS.ses)).raw).toEqual({ seq: box.headSeq, hash: box.headHash, corrupt: null, loaded: true });
            expect(w.raw.loadedSessions()).toContain(IDS.ses);
        });

        it('C1: session/feedstatus names the hearing operator (the FE offers Split / Use direct cloud to them and to super-admins only)', async () => {
            const w = make();
            expect(await w.sync.feedStatus(IDS.ses)).toMatchObject({ nSesid: IDS.ses, nHearingOpid: IDS.operator });
            w.db.sessions.get(IDS.ses).nHearingOpid = null;
            w.sync.invalidateBinding(IDS.ses);
            expect((await w.sync.feedStatus(IDS.ses)).nHearingOpid).toBeNull();
        });

        it('C6: e.rawpull past the cloud head answers an empty reply the box reads as "nothing more"; a corrupt store its own code, which the box reads as a failure', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(1));
            const past = await w.sync.rawPull(w.conn, { nSesid: IDS.ses, fromSeq: box.headSeq + 1, toSeq: Number.MAX_SAFE_INTEGER });
            expect(past).toEqual({ recs: Buffer.alloc(0), toSeq: box.headSeq, hash: box.headHash });
            expect(pullReplyStep(past)).toEqual({ kind: 'end' });
            jest.spyOn(w.raw, 'pull').mockResolvedValueOnce({ ok: false, code: 'CLOUD_JOURNAL_CORRUPT' });
            const corrupt = await w.sync.rawPull(w.conn, { nSesid: IDS.ses, fromSeq: 1, toSeq: 2 });
            expect(corrupt).toEqual({ ok: false, code: 'CLOUD_JOURNAL_CORRUPT' });
            expect(pullReplyStep(corrupt)).toEqual({ kind: 'failed', why: 'the cloud answered CLOUD_JOURNAL_CORRUPT' });
            // Records still come back as before.
            const recs: any = await w.sync.rawPull(w.conn, { nSesid: IDS.ses, fromSeq: 1, toSeq: Number.MAX_SAFE_INTEGER });
            expect(pullReplyStep(recs)).toMatchObject({ kind: 'records', toSeq: box.headSeq, hash: box.headHash });
        });

        it('throttles a box over its uplink budget with BUSY{retryMs} (§5.6: backpressure by delaying, never by dropping)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const st = await syncUp(w, box);
            // Spend the box's whole burst (4 MB) at this instant: the next round waits for the bucket to refill.
            const bucket = (w.sync as any).bucket;
            while (bucket.take(IDS.box, 1024) === 0) { /* drain */ }
            while (bucket.take(IDS.box, 1) === 0) { /* to the last byte */ }
            box.addLines(5);
            await w.sync.raw(w.conn, box.rawBatch(st.lineage.appliedRawSeq! + 1));
            const busy: any = await push(w, box, st);
            expect(busy).toMatchObject({ ok: false, code: 'BUSY' });
            expect(busy.retryMs).toBeGreaterThan(0);
            expect(w.apply.applied).toHaveLength(1);
            // A second later (1 MB/s) the same round goes through.
            w.clock.now += 1_000;
            expect(await push(w, box, st)).toMatchObject({ ok: true });
            expect(w.apply.applied).toHaveLength(2);
        });

        it('records a held connection whose peer is not an IP without cPeer (et_rtedge_orphan_insert would refuse the whole row)', async () => {
            const w = make();
            const cap = (peer: string, fromMs: number) => w.sync.capture(w.conn, { kind: 'C', nSesid: IDS.ses, user: 'u', peer, fromMs, toMs: fromMs + 1, bytes: 3, sha256: 'a'.repeat(64) });
            expect(await cap('unknown', 1)).toMatchObject({ ok: true });
            expect(w.db.callsOf('rtedge_orphan_insert')[0]).not.toHaveProperty('cPeer');
            expect(await cap('::ffff:10.0.0.9', 2)).toMatchObject({ ok: true });
            expect(w.db.callsOf('rtedge_orphan_insert')[1]).toMatchObject({ cPeer: '10.0.0.9' });
            expect(await cap('fe80::1', 3)).toMatchObject({ ok: true });
            expect(w.db.callsOf('rtedge_orphan_insert')[2]).toMatchObject({ cPeer: 'fe80::1' });
            expect(peerIp('10.0.0.9:51234')).toBeNull();
            expect(peerIp(null)).toBeNull();
        });

        it('lets a case admin of the case through isCaseAdmin (the SPs\' rule), never on doubt', async () => {
            const w = make(({ db }) => db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.user, isCaseAdmin: true, cFname: 'C', cLname: 'A' }));
            expect(await w.sync.isCaseAdmin(IDS.caseA, IDS.user)).toBe(true);
            expect(await w.sync.isCaseAdmin(IDS.caseB, IDS.user)).toBe(false);
            expect(await w.sync.isCaseAdmin(null, IDS.user)).toBe(false);
            w.db.fail.set('rowQuery', 'pg down');
            expect(await w.sync.isCaseAdmin(IDS.caseA, IDS.user)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('gaps found by the FE work (G3, G4, G5)', () => {
        it("G3: session/feedstatus carries the seal's incidents and who acknowledged them when", async () => {
            const incidents = [{ kind: 'ABORTED_WINDOW', level: 'warning', note: 'window cut' }];
            const w = make(({ db }) => {
                Object.assign(db.sessions.get(IDS.ses), {
                    cSyncState: 'W',
                    jIncidents: incidents,
                    dWarnAckAt: new Date('2026-10-02T09:00:00Z'),
                    nWarnAckBy: IDS.operator,
                    nFinalLines: 30,
                    dSealedAt: new Date('2026-10-02T08:00:00Z'),
                });
                db.users.set(IDS.operator, { cFname: 'Hana', cLname: 'Operator' });
            });
            expect(await w.sync.feedStatus(IDS.ses)).toMatchObject({
                cSyncState: 'W',
                jIncidents: incidents,
                dWarnAckAt: '2026-10-02T09:00:00.000Z',
                nWarnAckBy: IDS.operator,
                cWarnAckBy: 'Hana Operator',
                dSealedAt: '2026-10-02T08:00:00.000Z',
                nFinalLines: 30,
                cSealNote: null,
                sealFieldsError: false,
            });
            // Not acknowledged yet: no one named.
            Object.assign(w.db.sessions.get(IDS.ses), { dWarnAckAt: null, nWarnAckBy: null });
            expect(await w.sync.feedStatus(IDS.ses)).toMatchObject({ jIncidents: incidents, dWarnAckAt: null, nWarnAckBy: null, cWarnAckBy: null });
        });

        it("G4: 'edge-session-ready' reaches the session's creator (the bind event's user), the hearing operator and the admins", async () => {
            const w = make();
            w.db.events.push({ nId: 1000, cType: 'bind', nEdgeid: IDS.box, nSesid: IDS.ses, jData: {}, nByUser: IDS.user });
            const fanOut = jest.spyOn(w.registry, 'emitToAdmins').mockResolvedValue(undefined);
            expect(await w.sync.ready(w.conn, { nSesid: IDS.ses })).toEqual({ ok: true });
            await until(() => fanOut.mock.calls.length === 1);
            expect(fanOut).toHaveBeenCalledWith('realtime-events', { type: 'edge-session-ready', nSesid: IDS.ses, nEdgeid: IDS.box }, [IDS.operator, IDS.user]);
            expect(w.apply.emits).toContainEqual({ to: `S${IDS.ses}`, event: 'realtime-events', payload: { type: 'edge-session-ready', nSesid: IDS.ses, nEdgeid: IDS.box } });
            // Unknown creator (no bind event, or the read fails): still the operator and the admins.
            expect(await w.sync.sessionCreator(IDS.ses2)).toBeNull();
        });

        it('G5: a session bound before its box reported a parser version is pinned to the version the box reports at its first hello', async () => {
            const w = make(({ db }) => (db.sessions.get(IDS.ses).cParserVer = null));
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            const reply: any = await w.sync.hello(w.conn, hello(box));
            expect(reply.sessions[0].verdict).toBe('continue');
            expect(w.db.callsOf('rtedge_session_parser_pin')).toEqual([{ nSesid: IDS.ses, nEdgeid: IDS.box, cParserVer: PARSER_VER }]);
            expect(w.db.sessions.get(IDS.ses).cParserVer).toBe(PARSER_VER);
            expect(w.sync.peekMeta(IDS.ses).frozen).toBeFalsy();
            // Pinned: a later hello from a box running another parser is the usual freeze (O-1), never a re-pin.
            await w.sync.hello(w.conn, { ...hello(box), parserVer: 'fp-2.0.0+other' });
            expect(w.db.sessions.get(IDS.ses).cParserVer).toBe(PARSER_VER);
            expect(w.sync.peekMeta(IDS.ses).frozen).toBe(true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'PARSER_MISMATCH')?.tier).toBe('P1');
            expect(w.db.callsOf('rtedge_session_parser_pin')).toHaveLength(1);
        });

        it('G5: a pinned session never calls the pin, and a failed pin leaves the session unpinned (no freeze)', async () => {
            const w = make();
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            await w.sync.hello(w.conn, hello(box));
            expect(w.db.callsOf('rtedge_session_parser_pin')).toHaveLength(0);
            const w2 = make(({ db }) => (db.sessions.get(IDS.ses).cParserVer = null));
            w2.db.fail.set('rtedge_session_parser_pin', 'pg down');
            const reply: any = await w2.sync.hello(w2.conn, hello(new BoxSim(IDS.ses, w2.key).arm().connOpen()));
            expect(reply.sessions[0].verdict).toBe('continue');
            expect(w2.sync.peekMeta(IDS.ses).frozen).toBeFalsy();
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('helpers', () => {
        it('stableUuid is a deterministic v4-shaped id', () => {
            expect(stableUuid('a')).toBe(stableUuid('a'));
            expect(stableUuid('a')).not.toBe(stableUuid('b'));
            expect(stableUuid('a')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        });

        it('shrinkSamples shows the first rewritten page before/after and the lines lost at the end', () => {
            const stored = new Map<number, unknown[]>([[1, [line(0, 'alpha'), line(1, 'beta')]], [2, [line(25, 'gone')]]]);
            const s = shrinkSamples({ totalLines: 25, pages: [{ p: 1, d: 'x', lines: [line(0, 'ALPHA')] }] } as any, stored, 25);
            expect(s).toEqual({ firstPage: 1, before: ['alpha', 'beta'], after: ['ALPHA'], removedTail: ['gone'] });
        });
    });
});
