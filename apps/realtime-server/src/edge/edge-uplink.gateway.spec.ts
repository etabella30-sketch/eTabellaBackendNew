/**
 * /edge end to end: a real socket.io server on an ephemeral localhost port, the real edge services
 * (registry, device auth, raw store on a temp dir, sync) and socket.io-client acting as the venue box.
 * The database, Redis and the page store are in-memory fakes (edge-test-kit.spec.ts); nothing leaves the
 * machine.
 */
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { Server } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { BoxResume, CloudView, EdgeHello, EDGE_FMT, EDGE_PROTO, resumeFromHello } from '@app/edge-sync';
import { RecordType, verifyRecordBatch } from '@app/rt-ingest';

import { EdgeAuthService } from './edge-auth.middleware';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeRegistryService } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { BoxSim, deviceKey, DeviceKey, FakeConfig, FakeEdgeDb, FakeRedis, IDS, MemoryApplyPort, PARSER_VER, rmTemp, signWith, tempDir, until } from './edge-test-kit.spec';

jest.setTimeout(20_000);

interface World {
    dir: string;
    config: FakeConfig;
    db: FakeEdgeDb;
    redis: FakeRedis;
    apply: MemoryApplyPort;
    registry: EdgeRegistryService;
    auth: EdgeAuthService;
    raw: EdgeRawStoreService;
    sync: EdgeSyncService;
    gateway: EdgeUplinkGateway;
    io: Server;
    http: http.Server;
    port: number;
    key: DeviceKey;
    clock: { now: number };
    clients: ClientSocket[];
    assigns: any[];
    needs: any[];
    refused: any[];
}

const ROUTE = { nSesid: IDS.ses, nCaseid: IDS.caseA, label: 'Day 1', nLines: 25, user: 'courtroom-1', cTimezone: 'Europe/London', passwordSalt: 'c2FsdA==', passwordHash: 'aGFzaA==', passwordEnc: 'v1.secret', feedSource: 'E', nEdgeid: IDS.box, epoch: 1 };

async function makeWorld(opts: { status?: string; clockStart?: number } = {}): Promise<World> {
    const dir = tempDir('gw');
    const routeFile = path.join(dir, 'routes.json');
    fs.writeFileSync(routeFile, JSON.stringify([ROUTE]));
    const config = new FakeConfig({
        EDGE_ENABLED: '1',
        EDGE_JOURNAL_DIR: path.join(dir, 'journal'),
        EDGE_CAPTURE_DIR: path.join(dir, 'captures'),
        ECLIPSE_SESSION_CONFIG: routeFile,
        ECLIPSE_FEED_HOST: 'cloud.example',
        ECLIPSE_AUTH_PORT: '2500',
    });
    const db = new FakeEdgeDb();
    const redis = new FakeRedis();
    const apply = new MemoryApplyPort();
    const key = deviceKey();
    db.addNode({ nEdgeid: IDS.box, cPubKey: key.spkiB64, cKeyFpr: key.fpr, cStatus: opts.status ?? 'A' });
    db.assignCase(IDS.box, IDS.caseA);
    db.team.push({ nCaseid: IDS.caseA, nUserid: IDS.operator, isCaseAdmin: true, cFname: 'Hana', cLname: 'Operator' });
    db.emails.set(IDS.operator, 'hana@example.com');
    db.addSession({ nSesid: IDS.ses });
    const clock = { now: opts.clockStart ?? Date.now() };
    const moduleOpts = { clock: () => clock.now, timings: { viewerOnlineAfterMs: 50, viewerOfflineAfterMs: 50, silentPageAfterMs: 100 } };
    const httpServer = http.createServer();
    const io = new Server(httpServer);
    await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
    const port = (httpServer.address() as any).port;
    const holder = { server: io as any };
    const registry = new EdgeRegistryService(db as any, redis as any, config as any, holder, undefined, undefined, async () => undefined, moduleOpts);
    const auth = new EdgeAuthService(redis as any, registry, moduleOpts);
    const raw = new EdgeRawStoreService(db as any, config as any, registry, undefined, moduleOpts);
    const sync = new EdgeSyncService(db as any, redis as any, config as any, registry, raw, apply, moduleOpts);
    const gateway = new EdgeUplinkGateway(config as any, auth, registry, sync, holder, moduleOpts);
    gateway.attach(io);
    return { dir, config, db, redis, apply, registry, auth, raw, sync, gateway, io, http: httpServer, port, key, clock, clients: [], assigns: [], needs: [], refused: [] };
}

async function closeWorld(w: World) {
    for (const c of w.clients) c.disconnect();
    w.gateway.onModuleDestroy();
    w.sync.onModuleDestroy();
    await new Promise<void>(resolve => w.io.close(() => resolve()));
    await w.sync.flushMetaWrites();
    rmTemp(w.dir);
}

function connectRaw(w: World, auth: any): Promise<ClientSocket> {
    return new Promise((resolve, reject) => {
        const socket = ioClient(`http://127.0.0.1:${w.port}/edge`, { transports: ['websocket'], reconnection: false, forceNew: true, auth });
        w.clients.push(socket);
        socket.on('c.assign', (msg: any, ack: any) => {
            w.assigns.push(msg);
            if (typeof ack === 'function') ack({ ok: true });
        });
        socket.on('c.need', (msg: any, ack: any) => {
            w.needs.push(msg);
            if (typeof ack === 'function') ack({ ok: true });
        });
        socket.on('c.refused', (msg: any) => w.refused.push(msg));
        socket.once('connect', () => resolve(socket));
        socket.once('connect_error', err => reject(err));
    });
}

async function connectBox(w: World, box: BoxSim): Promise<ClientSocket> {
    const { nonce } = await w.auth.issueChallenge(box.nEdgeid);
    return connectRaw(w, box.auth(nonce));
}

const ask = (s: ClientSocket, event: string, body: any) => s.timeout(8000).emitWithAck(event, body);

function hello(box: BoxSim, sessions = [box.helloSession()]): EdgeHello {
    return { proto: EDGE_PROTO, protoMin: EDGE_PROTO, fmt: EDGE_FMT, sw: '1.0.0', parserVer: PARSER_VER, bootId: box.bootId, sessions };
}

interface BoxState {
    resume: BoxResume;
    cloud: CloudView;
    lineage: { appliedRawSeq: number | null; appliedRawHash: string | null };
    appliedRev: number;
}

async function helloAndResume(s: ClientSocket, box: BoxSim): Promise<{ reply: any; state: BoxState }> {
    const reply = await ask(s, 'e.hello', hello(box));
    const resume = resumeFromHello(reply.sessions[0], box.journal());
    box.cutter.advanceRev(resume.appliedRev);
    return { reply, state: { resume, cloud: resume.cloud, lineage: resume.lineage, appliedRev: resume.appliedRev } };
}

async function sendRaw(s: ClientSocket, box: BoxSim, fromSeq: number) {
    if (fromSeq > box.headSeq) return null;
    return ask(s, 'e.raw', box.rawBatch(fromSeq));
}

async function pushRound(s: ClientSocket, box: BoxSim, st: BoxState, maxPartBytes?: number) {
    const built = box.round(st.cloud, st.lineage, maxPartBytes);
    if (!built) return null;
    let reply: any;
    for (const part of built.parts) reply = await ask(s, 'e.round', part);
    if (reply?.ok === true && !reply.partial) {
        st.cloud = built.afterAck.cloud;
        st.lineage = built.afterAck.lineage;
        st.appliedRev = reply.appliedRev;
    }
    return { built, reply };
}

describe('EdgeUplinkGateway over socket.io (/edge)', () => {
    let w: World;
    beforeAll(() => Logger.overrideLogger(false));
    beforeEach(async () => {
        w = await makeWorld();
    });
    afterEach(async () => {
        await closeWorld(w);
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('device auth', () => {
        it('admits a box that signs nonce+edgeId+bootId with its enrolled key, and audits it online', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            await connectBox(w, box);
            expect(w.gateway.connection(IDS.box)).toMatchObject({ nEdgeid: IDS.box, bootId: 'boot-1', status: 'A' });
            await until(() => w.db.eventsOf('online').length === 1);
        });

        it('accepts an IEEE-P1363 (r||s) signature as well as DER', async () => {
            const { nonce } = await w.auth.issueChallenge(IDS.box);
            const sig = signWith(w.key, `${nonce}${IDS.box}boot-1`, 'ieee-p1363');
            await connectRaw(w, { edgeId: IDS.box, nonce, bootId: 'boot-1', sig });
            expect(w.gateway.connection(IDS.box)).not.toBeNull();
        });

        it('refuses a signature by another key (UNAUTHORIZED) and raises a P2 alert', async () => {
            const box = new BoxSim(IDS.ses, deviceKey());
            await expect(connectBox(w, box)).rejects.toMatchObject({ message: 'UNAUTHORIZED' });
            expect(w.registry.recentAlerts().map(a => a.kind)).toContain('DEVICE_SIGNATURE');
            expect(w.gateway.connection(IDS.box)).toBeNull();
        });

        it('refuses a nonce that was never issued, and a nonce used twice', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            await expect(connectRaw(w, box.auth('a'.repeat(64)))).rejects.toMatchObject({ message: 'UNAUTHORIZED' });
            const { nonce } = await w.auth.issueChallenge(IDS.box);
            const first = await connectRaw(w, box.auth(nonce));
            first.disconnect();
            await until(() => !w.gateway.connection(IDS.box));
            await expect(connectRaw(w, box.auth(nonce))).rejects.toMatchObject({ message: 'UNAUTHORIZED' });
        });

        it('refuses a malformed credential and a user JWT (not a device credential): BAD_REQUEST', async () => {
            await expect(connectRaw(w, { edgeId: IDS.box, nonce: 'x' })).rejects.toMatchObject({ message: 'BAD_REQUEST' });
            await expect(connectRaw(w, { token: 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJ4In0.sig' })).rejects.toMatchObject({ message: 'BAD_REQUEST' });
        });

        it('tells an unconfirmed key KEY_UNCONFIRMED and a revoked box REVOKED, only after its signature verifies', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            w.db.nodes.get(IDS.box).cStatus = 'C';
            await expect(connectBox(w, box)).rejects.toMatchObject({ message: 'KEY_UNCONFIRMED' });
            w.db.nodes.get(IDS.box).cStatus = 'X';
            await expect(connectBox(w, box)).rejects.toMatchObject({ message: 'REVOKED' });
            const forger = new BoxSim(IDS.ses, deviceKey());
            await expect(connectBox(w, forger)).rejects.toMatchObject({ message: 'UNAUTHORIZED' });
        });

        it('refuses every box while EDGE_ENABLED is off (DISABLED)', async () => {
            w.config.values.EDGE_ENABLED = '0';
            const box = new BoxSim(IDS.ses, w.key);
            await expect(connectBox(w, box)).rejects.toMatchObject({ message: 'DISABLED' });
        });

        it('gives a box socket no viewer room and no viewer events (join-room does nothing on /edge)', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            const s = await connectBox(w, box);
            s.emit('join-room', { room: `S${IDS.ses}` });
            await new Promise(r => setTimeout(r, 50));
            const rooms = w.io.of('/edge').adapter.rooms;
            expect(rooms.has(`S${IDS.ses}`)).toBe(false);
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('identity fencing (MR-6)', () => {
        it('refuses a second box with another bootId while the first is online: DUP_IDENTITY, P1 critical', async () => {
            const a = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-A');
            const b = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-B');
            const sa = await connectBox(w, a);
            await expect(connectBox(w, b)).rejects.toMatchObject({ message: 'DUP_IDENTITY' });
            expect(sa.connected).toBe(true);
            const alert = w.registry.recentAlerts().find(x => x.kind === 'DUP_IDENTITY');
            expect(alert).toMatchObject({ tier: 'P1', critical: true, nEdgeid: IDS.box });
            expect(w.gateway.connection(IDS.box).bootId).toBe('boot-A');
        });

        it('still refuses the second boot when both passed the async admission check at once (no mutual supersede)', async () => {
            const a = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-A');
            const b = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-B');
            const sa = await connectBox(w, a);
            // The race: B's admission ran before A was registered, so it said ok.
            jest.spyOn(w.gateway as any, 'admit').mockReturnValueOnce({ ok: true });
            const sb = await connectBox(w, b);
            await until(() => w.refused.some(r => r.code === 'DUP_IDENTITY'));
            await until(() => !sb.connected);
            expect(sa.connected).toBe(true);
            expect(w.gateway.connection(IDS.box).bootId).toBe('boot-A');
            expect(w.registry.recentAlerts().find(x => x.kind === 'DUP_IDENTITY')).toMatchObject({ tier: 'P1', critical: true, data: expect.objectContaining({ refusedBootId: 'boot-B' }) });
        });

        it('lets the same bootId reconnect and closes the superseded socket', async () => {
            const a = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-A');
            const first = await connectBox(w, a);
            const second = await connectBox(w, a);
            await until(() => !first.connected);
            expect(second.connected).toBe(true);
            expect(w.refused).toContainEqual(expect.objectContaining({ code: 'SUPERSEDED' }));
        });

        it('accepts another bootId once the old socket is gone, but its sessions must pass hello before pages', async () => {
            const a = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-A');
            const sa = await connectBox(w, a);
            sa.disconnect();
            await until(() => !w.gateway.connection(IDS.box));
            const b = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-B').arm().connOpen();
            b.addLines(3);
            const sb = await connectBox(w, b);
            const built = b.round({ digests: [], totalLines: 0, root: null }, { appliedRawSeq: null, appliedRawHash: null });
            const reply = await ask(sb, 'e.round', built.parts[0]);
            expect(reply).toMatchObject({ ok: false, code: 'LINEAGE' });
        });

        it('accepts another bootId when the old socket has been silent for 20 s, and closes the old one', async () => {
            const a = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-A');
            const sa = await connectBox(w, a);
            w.clock.now += 21_000;
            const b = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-B');
            await connectBox(w, b);
            await until(() => !sa.connected);
            expect(w.gateway.connection(IDS.box).bootId).toBe('boot-B');
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('quarantine', () => {
        it('lets a quarantined box connect and report status, but answers hello QUARANTINED and refuses rounds and raw', async () => {
            await closeWorld(w);
            w = await makeWorld({ status: 'Q' });
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(2);
            const s = await connectBox(w, box);
            expect(await ask(s, 'e.hello', hello(box))).toMatchObject({ ok: false, code: 'QUARANTINED' });
            const built = box.round({ digests: [], totalLines: 0, root: null }, { appliedRawSeq: null, appliedRawHash: null });
            expect(await ask(s, 'e.round', built.parts[0])).toMatchObject({ ok: false, code: 'NOT_BOUND' });
            expect(await ask(s, 'e.raw', box.rawBatch(1))).toMatchObject({ reason: 'rate' });
            expect(await ask(s, 'e.status', { sessions: [], device: { sw: '1' } })).toEqual({ ok: true });
            expect(w.redis.store.has(`edge:status:${IDS.box}`)).toBe(true);
        });

        it('quarantining a connected box pushes op quarantine and its next hello is refused', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            expect((await ask(s, 'e.hello', hello(box))).sessions[0].verdict).toBe('continue');
            await w.registry.quarantine({ userId: IDS.admin, isAdmin: true }, IDS.box, 'Q', 'test');
            await until(() => w.assigns.some(a => a.op === 'quarantine'));
            expect(await ask(s, 'e.hello', hello(box))).toMatchObject({ ok: false, code: 'QUARANTINED' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'BOX_QUARANTINED')?.tier).toBe('P1');
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('hello verdicts', () => {
        it('continue for a bound session, with the assignment (route hash, never passwordEnc) and the full snapshot', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            const reply = await ask(s, 'e.hello', hello(box));
            expect(reply.sessions[0]).toMatchObject({ nSesid: IDS.ses, verdict: 'continue', appliedRev: 0, appliedRawSeq: null, pageDigests: [] });
            expect(reply.proto).toBe(EDGE_PROTO);
            expect(reply.assignments).toHaveLength(1);
            expect(reply.assignments[0]).toMatchObject({ nSesid: IDS.ses, route: { user: 'courtroom-1', salt: 'c2FsdA==', hash: 'aGFzaA==', scryptN: 16384 }, parserVer: PARSER_VER, fmt: 1, team: [{ nUserid: IDS.operator, isCaseAdmin: true }] });
            expect(JSON.stringify(reply)).not.toContain('v1.secret');
            expect(reply.assignmentSnapshot.roster[0]).toMatchObject({ name: 'Hana Operator', email: 'hana@example.com', isCaseAdmin: true, active: true });
            expect(reply.assignmentSnapshot.cases[0]).toMatchObject({ nCaseid: IDS.caseA, cCaseno: 'C-1', cCasename: 'Case One' });
            expect(reply.limits).toMatchObject({ maxPart: 256 * 1024 });
            expect(w.db.callsOf('rtedge_heartbeat')[0]).toMatchObject({ nEdgeid: IDS.box, bForce: true, cParserVer: PARSER_VER, cVersion: '1.0.0' });
        });

        it("unknown for a session not bound to this box, end for an end-requested one, sealed for a sealed one", async () => {
            w.db.addSession({ nSesid: IDS.ses2, cSyncState: 'S' });
            w.db.addSession({ nSesid: IDS.ses3, cSyncState: 'K' });
            const foreign = '12121212-1212-4121-8121-121212121212';
            w.db.addSession({ nSesid: foreign, nEdgeid: IDS.box2 });
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            const sessions = [IDS.ses2, IDS.ses3, foreign].map(id => ({ ...new BoxSim(id, w.key).arm().helloSession() }));
            const reply = await ask(s, 'e.hello', hello(box, sessions));
            expect(reply.sessions.map((x: any) => x.verdict)).toEqual(['end', 'sealed', 'unknown']);
        });

        it('pushes op end for an end-requested session the box did not report', async () => {
            w.db.addSession({ nSesid: IDS.ses2, cSyncState: 'S' });
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            await ask(s, 'e.hello', hello(box));
            await until(() => w.assigns.some(a => a.op === 'end' && a.nSesid === IDS.ses2));
        });

        it('frozen when the box is behind the last applied history (old image), with a P1 alert; it stays frozen', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(30);
            const s = await connectBox(w, box);
            const { state } = await helloAndResume(s, box);
            await sendRaw(s, box, 1);
            expect((await pushRound(s, box, state)).reply.ok).toBe(true);
            // A box restored from an image taken before the applied round: its journal ends at seq 2.
            const old = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-old').arm();
            s.disconnect();
            await until(() => !w.gateway.connection(IDS.box));
            const so = await connectBox(w, old);
            const reply = await ask(so, 'e.hello', hello(old));
            expect(reply.sessions[0].verdict).toBe('frozen');
            expect(w.sync.peekMeta(IDS.ses).frozen).toBe(true);
            const alert = w.registry.recentAlerts().find(a => a.kind === 'LINEAGE_FROZEN');
            expect(alert).toMatchObject({ tier: 'P1', nSesid: IDS.ses });
            // Even a later report of the newer journal on this connection stays frozen (only an admin split clears it).
            expect((await ask(so, 'e.hello', hello(old, [box.helloSession()]))).sessions[0].verdict).toBe('frozen');
            expect(w.db.eventsOf('freeze')).toHaveLength(1);
        });

        it('refuses a hello that names another boot than the one that signed the connection (bootId fencing, P1)', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            const twin = new BoxSim(IDS.ses, w.key, IDS.box, 'boot-twin').arm();
            expect(await ask(s, 'e.hello', hello(twin))).toMatchObject({ ok: false, code: 'BAD_REQUEST' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'BOOT_ID_MISMATCH')).toMatchObject({ tier: 'P1', nEdgeid: IDS.box });
            // The session passed no hello on this connection: its rounds are refused LINEAGE.
            expect(await ask(s, 'e.round', { nSesid: IDS.ses })).toMatchObject({ ok: false, code: 'LINEAGE' });
            expect((await ask(s, 'e.hello', hello(box))).sessions[0].verdict).toBe('continue');
        });

        it('recover when the cloud raw store is ahead of the box journal', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            const s = await connectBox(w, box);
            await helloAndResume(s, box);
            await sendRaw(s, box, 1);
            const behind = new BoxSim(IDS.ses, w.key).arm();
            const reply = await ask(s, 'e.hello', hello(behind));
            expect(reply.sessions[0]).toMatchObject({ verdict: 'recover', recoverFrom: 3, rawAcked: { seq: 4 } });
        });

        it('freezes a session whose pinned parser differs from the box parser (O-1: no REBASE in v1)', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            const reply = await ask(s, 'e.hello', { ...hello(box), parserVer: 'fp-9.9.9' });
            expect(reply.sessions[0].verdict).toBe('frozen');
            expect(w.registry.recentAlerts().find(a => a.kind === 'PARSER_MISMATCH')?.tier).toBe('P1');
        });

        it('answers UPGRADE to a box with no session on an unsupported protocol, PROTO_UNSUPPORTED to one with sessions', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            expect(await ask(s, 'e.hello', { ...hello(box, []), proto: 99, protoMin: 99 })).toMatchObject({ ok: false, code: 'UPGRADE' });
            expect(await ask(s, 'e.hello', { ...hello(box), proto: 99, protoMin: 99 })).toMatchObject({ ok: false, code: 'PROTO_UNSUPPORTED' });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('rounds', () => {
        async function live(lines = 30) {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(lines);
            const s = await connectBox(w, box);
            const { state } = await helloAndResume(s, box);
            await sendRaw(s, box, 1);
            return { box, s, state };
        }

        it('applies rounds in order: store == box pages, meta advanced, broadcast once per round, watermark throttled', async () => {
            const { box, s, state } = await live(30);
            const r1 = await pushRound(s, box, state);
            expect(r1.reply).toMatchObject({ ok: true, appliedRev: box.cutter.view().rev });
            const seqBefore = box.headSeq;
            box.addLines(4);
            await sendRaw(s, box, seqBefore + 1);
            const r2 = await pushRound(s, box, state);
            expect(r2.reply.ok).toBe(true);
            const stored = w.apply.pages.get(IDS.ses);
            expect([...stored.keys()].sort()).toEqual([1, 2]);
            expect(stored.get(2)).toEqual(JSON.parse(JSON.stringify(box.cutter.view().pages[1])));
            const meta = w.sync.peekMeta(IDS.ses);
            expect(meta).toMatchObject({ appliedRev: box.cutter.view().rev, totalLines: 34, appliedRawSeq: box.headSeq, root: box.cutter.view().root });
            expect(w.apply.broadcasts.map(b => b.kind)).toEqual(['append', 'append']);
            await until(() => w.db.callsOf('rtedge_applied').length === 1);
            expect(w.db.callsOf('rtedge_applied')[0]).toMatchObject({ nSesid: IDS.ses, nEdgeid: IDS.box });
            expect(JSON.parse(w.redis.store.get(`edge:meta:${IDS.ses}`).value).appliedRev).toBe(meta.appliedRev);
            await w.sync.flushMetaWrites();
            expect(JSON.parse(fs.readFileSync(path.join(w.dir, 'journal', IDS.ses, 'edge-meta.json'), 'utf8')).appliedRev).toBe(meta.appliedRev);
        });

        it('stages parts that arrive out of order and applies the round once complete', async () => {
            const { box, s, state } = await live(80);
            const built = box.round(state.cloud, state.lineage, 3000);
            expect(built.parts.length).toBeGreaterThanOrEqual(3);
            const order = [built.parts.length - 1, ...built.parts.slice(0, -1).map((_, k) => k)];
            const replies = [];
            for (const k of order) replies.push(await ask(s, 'e.round', built.parts[k]));
            expect(replies.slice(0, -1).every((r: any) => r.ok === true && r.partial === true)).toBe(true);
            expect(replies[replies.length - 1]).toMatchObject({ ok: true, appliedRev: built.rev });
            expect(w.apply.applied).toHaveLength(1);
            expect(w.apply.pages.get(IDS.ses).size).toBe(4);
        });

        it('answers STALE to a round at or below the applied rev and applies nothing', async () => {
            const { box, s, state } = await live(10);
            const { built } = await pushRound(s, box, state);
            const again = await ask(s, 'e.round', built.parts[0]);
            expect(again).toMatchObject({ ok: false, code: 'STALE', appliedRev: built.rev });
            expect(w.apply.applied).toHaveLength(1);
        });

        it('answers ROOT with the cloud digests when the root over stored ⊕ round differs, applies nothing, P2 alert', async () => {
            const { box, s, state } = await live(10);
            const built = box.round(state.cloud, state.lineage);
            const reply = await ask(s, 'e.round', { ...built.parts[0], root: 'f'.repeat(64) });
            expect(reply).toMatchObject({ ok: false, code: 'ROOT', cloudDigests: [] });
            expect(w.apply.applied).toHaveLength(0);
            expect(w.registry.recentAlerts().find(a => a.kind === 'ROUND_ROOT')?.tier).toBe('P2');
        });

        it('answers REGRESS to a round behind the last applied raw seq, and pages P1 when it repeats', async () => {
            const { box, s, state } = await live(10);
            await pushRound(s, box, state);
            const seqBefore = box.headSeq;
            box.addLines(2);
            await sendRaw(s, box, seqBefore + 1);
            const built = box.round(state.cloud, state.lineage);
            const regress = { ...built.parts[0], rawSeqThrough: 2, rawHashThrough: box.hashes[2] };
            for (let k = 0; k < 3; k++) {
                expect(await ask(s, 'e.round', regress)).toMatchObject({ ok: false, code: 'REGRESS', appliedRawSeq: seqBefore });
            }
            expect(w.registry.recentAlerts().find(a => a.kind === 'REGRESS_REPEATED')?.tier).toBe('P1');
            expect(w.apply.applied).toHaveLength(1);
        });

        it('FORK freezes the session uplink when the round does not continue the last applied hash (D19), with a P1 alert', async () => {
            const { box, s, state } = await live(10);
            await pushRound(s, box, state);
            box.addLines(3);
            const built = box.round(state.cloud, state.lineage);
            const forked = { ...built.parts[0], lineage: { ...built.parts[0].lineage, appliedRawHash: 'e'.repeat(64) } };
            expect(await ask(s, 'e.round', forked)).toMatchObject({ ok: false, code: 'FORK' });
            expect(w.sync.peekMeta(IDS.ses)).toMatchObject({ frozen: true });
            expect(w.registry.recentAlerts().find(a => a.kind === 'LINEAGE_FROZEN')).toMatchObject({ tier: 'P1', critical: true });
            // Frozen: even a correct round applies nothing.
            expect(await ask(s, 'e.round', built.parts[0])).toMatchObject({ ok: false, code: 'FORK' });
            expect(w.apply.applied).toHaveLength(1);
        });

        it('FORK when the cloud raw store holds rawSeqThrough with another hash', async () => {
            const { box, s, state } = await live(10);
            const built = box.round(state.cloud, state.lineage);
            const bad = { ...built.parts[0], rawHashThrough: 'd'.repeat(64) };
            expect(await ask(s, 'e.round', bad)).toMatchObject({ ok: false, code: 'FORK' });
            expect(w.sync.peekMeta(IDS.ses).frozen).toBe(true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'FORK')?.tier).toBe('P1');
        });

        it('applies a round ahead of the raw lane and freezes when the raw lane later shows another hash (MR-1)', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            const s = await connectBox(w, box);
            const { state } = await helloAndResume(s, box);
            const built = box.round(state.cloud, state.lineage);
            const ahead = { ...built.parts[0], rawHashThrough: 'c'.repeat(64) };
            expect((await ask(s, 'e.round', ahead)).ok).toBe(true);
            expect(w.sync.peekMeta(IDS.ses).pendingRawChecks).toHaveLength(1);
            expect(await sendRaw(s, box, 1)).toMatchObject({ ackedSeq: box.headSeq });
            await until(() => w.sync.peekMeta(IDS.ses).frozen === true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'FORK')?.tier).toBe('P1');
        });

        it('clears a pending (seq, hash) pair once the raw lane confirms it', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(5);
            const s = await connectBox(w, box);
            const { state } = await helloAndResume(s, box);
            expect((await pushRound(s, box, state)).reply.ok).toBe(true);
            expect(w.sync.peekMeta(IDS.ses).pendingRawChecks).toHaveLength(1);
            await sendRaw(s, box, 1);
            await until(() => w.sync.peekMeta(IDS.ses).pendingRawChecks.length === 0);
            expect(w.sync.peekMeta(IDS.ses).frozen).toBeFalsy();
        });

        it('holds a large shrink (HELD_SHRINK, P1), keeps the same heldId on a resend, and applies it once an admin confirms', async () => {
            const { box, s, state } = await live(600);
            expect((await pushRound(s, box, state)).reply.ok).toBe(true);
            const seq = box.headSeq;
            box.shrinkTo(100);
            await sendRaw(s, box, seq + 1);
            const built = box.round(state.cloud, state.lineage);
            const held = await ask(s, 'e.round', built.parts[0]);
            expect(held).toMatchObject({ ok: false, code: 'HELD_SHRINK' });
            const again = await ask(s, 'e.round', built.parts[0]);
            expect(again.heldId).toBe(held.heldId);
            expect(w.registry.recentAlerts().filter(a => a.kind === 'HELD_SHRINK')).toHaveLength(1);
            expect(w.apply.pages.get(IDS.ses).size).toBe(24);
            const info: any = await w.sync.heldShrink(IDS.ses);
            expect(info).toMatchObject({ held: true, heldId: held.heldId, removed: 500, fromTotal: 600, toTotal: 100 });
            expect(info.removedTail[0]).toBe('line 100');

            const res = await w.sync.decideShrink({ userId: IDS.admin, isAdmin: true }, IDS.ses, held.heldId, 'confirm');
            expect(res).toMatchObject({ msg: 1, appliedRev: built.rev });
            expect(w.apply.pages.get(IDS.ses).size).toBe(4);
            expect(w.sync.peekMeta(IDS.ses).cloudIncidents).toEqual([expect.objectContaining({ kind: 'SHRINK_CONFIRMED', level: 'warning', lines: 500 })]);
            await until(() => w.needs.some(n => n.nSesid === IDS.ses));
            expect(w.db.eventsOf('shrink_confirm')).toHaveLength(1);
        });

        it('freezes the session when an admin rejects a held shrink', async () => {
            const { box, s, state } = await live(600);
            await pushRound(s, box, state);
            const seq = box.headSeq;
            box.shrinkTo(10);
            await sendRaw(s, box, seq + 1);
            const held = await ask(s, 'e.round', box.round(state.cloud, state.lineage).parts[0]);
            await w.sync.decideShrink({ userId: IDS.admin, isAdmin: true }, IDS.ses, held.heldId, 'reject', 'wrong file');
            expect(w.sync.peekMeta(IDS.ses).frozen).toBe(true);
            expect(w.registry.recentAlerts().find(a => a.kind === 'SHRINK_REJECTED')?.tier).toBe('P1');
            await expect(w.sync.decideShrink({ userId: IDS.admin, isAdmin: true }, IDS.ses, held.heldId, 'confirm')).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('answers BUSY while the page store is not reachable, and NOT_BOUND for a session of another box', async () => {
            const { box, s, state } = await live(5);
            w.apply.isReady = false;
            expect(await ask(s, 'e.round', box.round(state.cloud, state.lineage).parts[0])).toMatchObject({ ok: false, code: 'BUSY' });
            w.db.addSession({ nSesid: IDS.ses2, nEdgeid: IDS.box2 });
            const other = new BoxSim(IDS.ses2, w.key).arm().connOpen();
            other.addLines(2);
            const part = other.round({ digests: [], totalLines: 0, root: null }, { appliedRawSeq: null, appliedRawHash: null }).parts[0];
            expect(await ask(s, 'e.round', part)).toMatchObject({ ok: false, code: 'NOT_BOUND' });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('raw lane', () => {
        async function ready() {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(3);
            const s = await connectBox(w, box);
            await helloAndResume(s, box);
            return { box, s };
        }

        it('acks in order after fsync, re-acks a duplicate, and trims a verified overlap', async () => {
            const { box, s } = await ready();
            expect(await ask(s, 'e.raw', box.rawBatch(1, 2))).toEqual({ ackedSeq: 2, ackedHash: box.hashes[2] });
            expect(await ask(s, 'e.raw', box.rawBatch(1, 2))).toEqual({ ackedSeq: 2, ackedHash: box.hashes[2] });
            expect(await ask(s, 'e.raw', box.rawBatch(2, 4))).toEqual({ ackedSeq: 4, ackedHash: box.hashes[4] });
            expect(fs.readdirSync(path.join(w.dir, 'journal', IDS.ses))).toContain('seg-00001.ej');
        });

        it('nacks a gap, a chain break, a CRC error and a wrong epoch with the seq it expects', async () => {
            const { box, s } = await ready();
            expect(await ask(s, 'e.raw', box.rawBatch(3, 4))).toEqual({ expectSeq: 1, reason: 'gap' });
            expect(await ask(s, 'e.raw', { ...box.rawBatch(1, 2), prevHash: 'a'.repeat(64) })).toEqual({ expectSeq: 1, reason: 'chain' });
            const corrupt = box.rawBatch(1, 2);
            const recs = Buffer.from(corrupt.recs);
            recs[recs.length - 1] ^= 0xff;
            expect(await ask(s, 'e.raw', { ...corrupt, recs })).toEqual({ expectSeq: 1, reason: 'crc' });
            expect(await ask(s, 'e.raw', box.rawBatch(1, 2, 2))).toEqual({ expectSeq: 1, reason: 'epoch' });
            expect(w.raw.head(IDS.ses).seq).toBe(0);
        });

        it('nacks an overlap that differs from the acked chain (P1 RAW_FORK)', async () => {
            const { box, s } = await ready();
            await ask(s, 'e.raw', box.rawBatch(1, 4));
            const other = new BoxSim(IDS.ses, w.key).arm().connOpen();
            other.addLines(7);
            other.addLines(1);
            expect(await ask(s, 'e.raw', other.rawBatch(1, 5))).toEqual({ expectSeq: 5, reason: 'chain' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'RAW_FORK')?.tier).toBe('P1');
            expect(w.raw.head(IDS.ses)).toEqual({ seq: 4, hash: box.hashes[4] });
        });

        it('serves RECOVER pull-back from the cloud store', async () => {
            const { box, s } = await ready();
            await ask(s, 'e.raw', box.rawBatch(1));
            const pulled = await ask(s, 'e.rawpull', { nSesid: IDS.ses, fromSeq: 2, toSeq: 4 });
            expect(pulled.toSeq).toBe(4);
            const check = verifyRecordBatch(Buffer.from(pulled.recs), 2, Buffer.from(box.hashes[1], 'hex'));
            expect(check.ok).toBe(true);
            expect(pulled.hash).toBe(box.hashes[4]);
            expect(await ask(s, 'e.rawpull', { nSesid: IDS.ses2, fromSeq: 1, toSeq: 2 })).toMatchObject({ ok: false, code: 'NOT_BOUND' });
            // C6, over the wire: past the head an EMPTY binary `recs` arrives (the box's raw-pull reads a Uint8Array
            // of length 0 as the end of its pull), with toSeq / hash at fromSeq - 1.
            const past = await ask(s, 'e.rawpull', { nSesid: IDS.ses, fromSeq: box.headSeq + 1, toSeq: box.headSeq + 9 });
            expect(past.recs).toBeInstanceOf(Uint8Array);
            expect(past.recs.length).toBe(0);
            expect(past).toMatchObject({ toSeq: box.headSeq, hash: box.headHash });
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('seal (§5.7)', () => {
        async function ended(withIncident = false) {
            const box = new BoxSim(IDS.ses, w.key).arm().connOpen();
            box.addLines(40);
            if (withIncident) box.incident('ABORTED_WINDOW');
            const s = await connectBox(w, box);
            const { state } = await helloAndResume(s, box);
            await pushRound(s, box, state);
            box.end();
            await sendRaw(s, box, 1);
            return { box, s, state };
        }

        it('accepts a complete, signed seal: K, the SP records it, the end body runs, a repeat is idempotent', async () => {
            const { box, s, state } = await ended();
            const seal = box.seal(state.appliedRev, state.cloud);
            expect(await ask(s, 'e.seal', seal)).toEqual({ complete: true, state: 'K' });
            const sp = w.db.callsOf('rtedge_session_seal')[0];
            expect(sp).toMatchObject({ nSesid: IDS.ses, nEdgeid: IDS.box, nEpoch: 1, nFinalRev: state.appliedRev, cFinalDigest: seal.root, nFinalLines: 40, nRawFinalSeq: box.headSeq, cRawFinalHash: box.headHash });
            expect(w.db.sessions.get(IDS.ses).cSyncState).toBe('K');
            expect(w.apply.ended).toEqual([{ nSesid: IDS.ses, nCaseid: IDS.caseA }]);
            expect(await ask(s, 'e.seal', seal)).toEqual({ complete: true, state: 'K' });
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(1);
        });

        it('seals W when the signed incident list holds a warning-level incident', async () => {
            const { box, s, state } = await ended(true);
            expect(await ask(s, 'e.seal', box.seal(state.appliedRev, state.cloud))).toEqual({ complete: true, state: 'W' });
        });

        it('refuses a seal whose signature does not verify (P1), whose incidents differ, or that the raw lane does not reach', async () => {
            const { box, s, state } = await ended();
            const seal = box.seal(state.appliedRev, state.cloud);
            expect(await ask(s, 'e.seal', { ...seal, sig: new BoxSim(IDS.ses, deviceKey()).sign('x') })).toMatchObject({ complete: false });
            expect(w.registry.recentAlerts().find(a => a.kind === 'SEAL_SIGNATURE')?.tier).toBe('P1');
            const fake = { ...seal, incidents: [{ kind: 'CAT_DISCONNECT', level: 'info' }] };
            const { sig: _s, ...claims } = fake as any;
            const { sealSigningPayload } = await import('@app/edge-sync');
            expect(await ask(s, 'e.seal', { ...claims, sig: box.sign(sealSigningPayload(claims)) })).toMatchObject({ complete: false });
            box.append(RecordType.CTX_SET, { protocol: 'B' });
            box.end();
            const later = box.seal(state.appliedRev, state.cloud);
            expect(await ask(s, 'e.seal', later)).toEqual({ complete: false, needPages: [], rawFrom: box.headSeq - 1 });
            expect(w.db.callsOf('rtedge_session_seal')).toHaveLength(0);
        });
    });

    // -----------------------------------------------------------------------------------------------------------
    describe('cloud → box', () => {
        it('pushes c.assign to a connected box and reports an offline box as not delivered', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            await connectBox(w, box);
            expect(await w.registry.pushAssign(IDS.box, { op: 'end', nSesid: IDS.ses })).toBe(true);
            expect(w.assigns).toContainEqual({ op: 'end', nSesid: IDS.ses });
            expect(await w.registry.pushAssign(IDS.box2, { op: 'end', nSesid: IDS.ses })).toBe(false);
        });

        it('notify sends c.marks as a plain emit (no ack awaited) to a connected box; false for an offline or unknown box, never a throw', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            const s = await connectBox(w, box);
            const got: any[] = [];
            // An old box: no handler and no ack. The cloud must not wait for one (live mark sync, 2026-10-05).
            s.on('c.marks', (msg: any, ack?: unknown) => got.push({ msg, ack: typeof ack }));
            const body = { nSesid: IDS.ses, users: [IDS.operator], kinds: ['F'], atMs: 1_760_000_000_000 };
            expect(w.gateway.notify(IDS.box, 'c.marks', body)).toBe(true);
            expect(w.gateway.notify(IDS.box.toUpperCase(), 'c.marks', body)).toBe(true);
            await until(() => got.length === 2);
            expect(got).toEqual([{ msg: body, ack: 'undefined' }, { msg: body, ack: 'undefined' }]);
            expect(w.gateway.notify(IDS.box2, 'c.marks', body)).toBe(false);
            expect(w.gateway.notify('not-a-box', 'c.marks', body)).toBe(false);
            expect(w.registry.gateway.notify(IDS.box, 'c.marks', body)).toBe(true);
            s.disconnect();
            await until(() => w.gateway.connection(IDS.box) === null);
            expect(w.gateway.notify(IDS.box, 'c.marks', body)).toBe(false);
        });

        it('re-approving a quarantined box drops its socket without a refusal (it reconnects and re-hellos)', async () => {
            w.db.nodes.get(IDS.box).cStatus = 'Q';
            const box = new BoxSim(IDS.ses, w.key);
            const s = await connectBox(w, box);
            expect(await ask(s, 'e.hello', hello(box))).toMatchObject({ ok: false, code: 'QUARANTINED' });
            await w.registry.quarantine({ userId: IDS.admin, isAdmin: true }, IDS.box, 'A');
            await until(() => !s.connected);
            expect(w.refused).toEqual([]);
            const again = await connectBox(w, box);
            expect((await ask(again, 'e.hello', hello(box))).sessions[0].verdict).toBe('continue');
            w.gateway.drop(IDS.box2, 'nobody'); // an unknown box: nothing happens
        });

        it('refuses Phase-4 events (D1)', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            const s = await connectBox(w, box);
            expect(await ask(s, 'e.pagespull', { nSesid: IDS.ses })).toMatchObject({ ok: false, code: 'PHASE4' });
            expect(await ask(s, 'e.drained', { nSesid: IDS.ses })).toMatchObject({ ok: false, code: 'PHASE4' });
        });

        it('records a held second CAT connection (orphan C, idempotent) with a P1 alert, and e.ready notifies the room', async () => {
            const box = new BoxSim(IDS.ses, w.key);
            const s = await connectBox(w, box);
            const cap = { kind: 'C', nSesid: IDS.ses, user: 'courtroom-1', peer: '10.0.0.77', fromMs: 1_700_000_000_000, toMs: 1_700_000_060_000, bytes: 120, sha256: 'a'.repeat(64) };
            const r1 = await ask(s, 'e.capture', cap);
            const r2 = await ask(s, 'e.capture', cap);
            expect(r1.ok).toBe(true);
            expect(r2.nOrphanid).toBe(r1.nOrphanid);
            expect(w.db.orphans.size).toBe(1);
            expect([...w.db.orphans.values()][0]).toMatchObject({ cKind: 'C', nEdgeid: IDS.box, cPeer: '10.0.0.77' });
            expect(w.registry.recentAlerts().find(a => a.kind === 'HELD_CAT_CONNECTION')?.tier).toBe('P1');
            expect(await ask(s, 'e.ready', { nSesid: IDS.ses })).toEqual({ ok: true });
            expect(w.apply.emits).toContainEqual(expect.objectContaining({ to: `S${IDS.ses}`, event: 'realtime-events', payload: expect.objectContaining({ type: 'edge-session-ready' }) }));
        });

        it('tells viewers the box is offline after the hysteresis and pages P1 when a live session stays silent', async () => {
            const box = new BoxSim(IDS.ses, w.key).arm();
            const s = await connectBox(w, box);
            await ask(s, 'e.hello', hello(box));
            await until(() => w.apply.emits.some(e => e.event === 'edge-status' && e.payload.state === 'live'));
            s.disconnect();
            await until(() => w.apply.emits.some(e => e.event === 'edge-status' && e.payload.state === 'offline'));
            await until(() => w.registry.recentAlerts().some(a => a.kind === 'BOX_SILENT'));
            await until(() => w.db.eventsOf('offline').length === 1);
        });
    });
});
