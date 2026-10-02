import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { CaptureStore, readCapture } from './capture';
import { CatConnection, FeedArbiter, peerOfRemote } from './feed-arbiter';
import { decodeBody, readJournal, RecordType } from './raw-journal';
import { SessionWorker } from './session-worker';
import { CatProtocol, IngestAlert, TransmitterMode } from './types';

const SES = 'ses-arb-1';
// real journals on disk: generous under a parallel full-suite run
jest.setTimeout(30_000);
let seq = 0;

class FakeConn implements CatConnection {
    readonly connId: string;
    readonly remote: string;
    closed: string[] = [];
    constructor(
        readonly peer: string,
        readonly mode: TransmitterMode = 'listen',
        readonly user: string | undefined = 'alok',
        readonly protocolHint?: CatProtocol,
    ) {
        seq += 1;
        this.connId = `fake-${seq}`;
        this.remote = `${peer}:${5000 + seq}`;
    }
    close(reason: string): void {
        this.closed.push(reason);
    }
}

const STX = 0x02;
const ETX = 0x03;
const cmd = (letter: string, data: number[] = []) => Buffer.from([STX, letter.charCodeAt(0), ...data, ETX]);

describe('FeedArbiter: one active CAT connection per session', () => {
    let root: string;
    let now: number;
    let alerts: IngestAlert[];
    let captures: CaptureStore;
    let arbiter: FeedArbiter;
    const make = (extra: Partial<ConstructorParameters<typeof FeedArbiter>[0]> = {}) =>
        new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: path.join(root, 'journal'), parserVer: '1.0.0', boundaryMs: 0, onAlert: a => alerts.push(a) }),
            captures,
            clock: () => now,
            onAlert: a => alerts.push(a),
            macLookup: ip => (ip === '10.0.0.5' ? 'aa:bb:cc:00:00:05' : null),
            ...extra,
        });
    const journal = async (nSesid = SES) => {
        const w = arbiter.worker(nSesid)!;
        await w.settled();
        await w.journal.flush();
        return (await readJournal({ root: path.join(root, 'journal'), nSesid, repair: false })).records.map(r => ({ type: r.type, body: decodeBody(r) as any }));
    };
    const connRecords = async () =>
        (await journal()).filter(r => r.type === RecordType.CONN_OPEN || r.type === RecordType.CONN_CLOSE).map(r => (r.type === RecordType.CONN_OPEN ? `open:${r.body.connId}` : `close:${r.body.connId}:${r.body.reason}`));

    beforeEach(async () => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-arbiter-'));
        now = 1_700_000_000_000;
        alerts = [];
        captures = new CaptureStore({ root: path.join(root, 'capture'), limits: 'cloud' });
        await captures.init();
        arbiter = make();
    });
    afterEach(async () => {
        await arbiter.close();
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('the first connection becomes active and pins the session to its peer', async () => {
        const a = new FakeConn('10.0.0.5');
        expect(await arbiter.attach(SES, a)).toEqual({ status: 'active', takeover: 'first' });
        expect(arbiter.data(a, Buffer.from('hello'))).toBe('fed');
        expect(arbiter.sessionStatus(SES)).toMatchObject({ pinnedPeer: '10.0.0.5', active: { connId: a.connId, bytes: 5 } });
        expect(await connRecords()).toEqual([`open:${a.connId}`]);
    });

    it('same peer IP takes over: CONN_CLOSE{superseded} and destroy, THEN CONN_OPEN', async () => {
        const a = new FakeConn('10.0.0.5');
        const b = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('typing'));
        expect(await arbiter.attach(SES, b)).toEqual({ status: 'active', takeover: 'same-peer', superseded: a.connId });
        expect(a.closed).toEqual(['superseded']);
        expect(arbiter.data(a, Buffer.from('late'))).toBe('dropped');
        expect(arbiter.data(b, Buffer.from('new'))).toBe('fed');
        expect(await connRecords()).toEqual([`open:${a.connId}`, `close:${a.connId}:superseded`, `open:${b.connId}`]);
        await arbiter.detach(a, 'superseded'); // the socket's own close event: a no-op now
        expect(await connRecords()).toHaveLength(3);
    });

    it('a different peer while the active one sent a byte in the last 30 s is HELD: captured, never journaled or parsed, P1 alert with both peers', async () => {
        const a = new FakeConn('10.0.0.5');
        const b = new FakeConn('10.0.0.6');
        await arbiter.attach(SES, a);
        now += 1_000;
        arbiter.data(a, Buffer.from('reporter typing'));
        now += 29_000; // 29 s since the last byte
        expect(await arbiter.attach(SES, b)).toEqual({ status: 'held', captured: true, why: 'busy' });
        expect(arbiter.data(b, Buffer.from('SNIFFED-FEED'))).toBe('held');
        expect(b.closed).toEqual([]);
        const held = alerts.find(a2 => a2.kind === 'HELD_PEER')!;
        expect(held).toMatchObject({ tier: 'P1', nSesid: SES, peers: ['10.0.0.5', '10.0.0.6'], macs: ['aa:bb:cc:00:00:05', null], user: 'alok' });
        const recs = await journal();
        expect(Buffer.concat(recs.filter(r => r.type === RecordType.DATA).map(r => r.body as Buffer)).toString()).toBe('reporter typing');
        expect(recs.find(r => r.type === RecordType.INCIDENT)!.body).toMatchObject({ kind: 'CONCURRENT_CAT', level: 'warning' });
        const status = arbiter.sessionStatus(SES)!;
        expect(status.active!.connId).toBe(a.connId);
        expect(status.held).toEqual([expect.objectContaining({ connId: b.connId, peer: '10.0.0.6', bytes: 12 })]);
        await arbiter.detach(b, 'peer-closed');
        const meta = (await captures.list(SES))[0];
        expect(meta).toMatchObject({ kind: 'C', peer: '10.0.0.6', user: 'alok', bytes: 12, closedReason: 'peer-closed' });
        const capRecs = await readCapture(captures.filePath(meta), SES);
        expect(capRecs.filter(r => r.type === RecordType.DATA).map(r => r.payload.toString())).toEqual(['SNIFFED-FEED']);
    });

    it('a just-connected active feed counts as activity (it is not idle before its first byte)', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        now += 5_000;
        expect((await arbiter.attach(SES, new FakeConn('10.0.0.6'))).status).toBe('held');
    });

    it('a different peer while the active one has been idle ≥ 30 s takes over, with an alert', async () => {
        const a = new FakeConn('10.0.0.5');
        const b = new FakeConn('10.0.0.6');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('x'));
        now += 30_000;
        expect(await arbiter.attach(SES, b)).toEqual({ status: 'active', takeover: 'idle', superseded: a.connId });
        expect(a.closed).toEqual(['idle-takeover']);
        expect(alerts.find(x => x.kind === 'PEER_TAKEOVER')).toMatchObject({ tier: 'P2', peers: ['10.0.0.5', '10.0.0.6'] });
        expect(arbiter.sessionStatus(SES)!.pinnedPeer).toBe('10.0.0.6');
        expect(await connRecords()).toEqual([`open:${a.connId}`, `close:${a.connId}:idle-takeover`, `open:${b.connId}`]);
    });

    it('pinned to its first peer: with no active connection another peer is held for 30 s after the last byte, then takes over', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('x'));
        await arbiter.detach(a, 'peer-closed'); // Eclipse restarting
        now += 10_000;
        expect((await arbiter.attach(SES, new FakeConn('10.0.0.6'))).status).toBe('held');
        expect((await arbiter.attach(SES, new FakeConn('10.0.0.5'))).status).toBe('active'); // the pinned peer comes back
        await arbiter.detach(arbiter['links'].get(SES).active.conn, 'peer-closed');
        now += 31_000;
        expect(await arbiter.attach(SES, new FakeConn('10.0.0.7'))).toMatchObject({ status: 'active', takeover: 'idle' });
        expect(alerts.filter(x => x.kind === 'PEER_TAKEOVER')).toHaveLength(1);
    });

    it('the pin and the last byte survive a restart (they come from the journal)', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('typed just before the restart'));
        await arbiter.worker(SES)!.settled();
        await arbiter.close();

        arbiter = make({ clock: () => Date.now() }); // the journal's tRecv is wall-clock time
        const res = await arbiter.attach(SES, new FakeConn('10.0.0.6'));
        expect(res).toMatchObject({ status: 'held', why: 'pinned' });
        expect(arbiter.sessionStatus(SES)!.pinnedPeer).toBe('10.0.0.5');
        expect((await arbiter.attach(SES, new FakeConn('10.0.0.5'))).status).toBe('active');
    });

    it('repin(connId): "Make this the active feed" promotes a held connection and closes the old active one', async () => {
        const a = new FakeConn('10.0.0.5');
        const b = new FakeConn('10.0.0.6');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('a'));
        await arbiter.attach(SES, b);
        arbiter.data(b, Buffer.from('held-before-repin'));
        expect(await arbiter.repin(SES, { connId: b.connId }, 'admin:7')).toBe(true);
        expect(a.closed).toEqual(['repinned']);
        expect(arbiter.data(b, Buffer.from('now-fed'))).toBe('fed');
        expect(arbiter.sessionStatus(SES)).toMatchObject({ pinnedPeer: '10.0.0.6', held: [], active: { connId: b.connId } });
        expect(alerts.find(x => x.kind === 'REPINNED')!.message).toContain('admin:7');
        const recs = await journal();
        expect(recs.filter(r => r.type === RecordType.DATA).map(r => (r.body as Buffer).toString())).toEqual(['a', 'now-fed']);
        expect(await connRecords()).toEqual([`open:${a.connId}`, `close:${a.connId}:repinned`, `open:${b.connId}`]);
        expect((await captures.list(SES))[0]).toMatchObject({ closedReason: 'repinned', bytes: 17 });
        expect(await arbiter.repin(SES, { connId: 'nope' })).toBe(false);
    });

    it('repin(peer) pins a new peer for future connections (dial-mode settings change)', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('x'));
        await arbiter.detach(a, 'settings-changed');
        expect(await arbiter.repin(SES, { peer: '::ffff:192.168.50.10' }, 'transmitter-settings')).toBe(true);
        expect(await arbiter.attach(SES, new FakeConn('192.168.50.10', 'dial', undefined, 'B'))).toMatchObject({ status: 'active', takeover: 'pinned' });
    });

    it('caps held connections per session, and a newer held connection from the same peer replaces the older one', async () => {
        arbiter = make({ maxHeldPerSession: 2 });
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        const h1 = new FakeConn('10.0.0.6');
        const h1b = new FakeConn('10.0.0.6');
        await arbiter.attach(SES, h1);
        await arbiter.attach(SES, h1b);
        expect(h1.closed).toEqual(['superseded']);
        await arbiter.attach(SES, new FakeConn('10.0.0.7'));
        expect(await arbiter.attach(SES, new FakeConn('10.0.0.8'))).toEqual({ status: 'refused', reason: 'held-limit' });
        expect(arbiter.sessionStatus(SES)!.held.map(h => h.peer)).toEqual(['10.0.0.6', '10.0.0.7']);
    });

    it('an unexpected drop of the active feed is a CAT_DISCONNECT incident (info) + alert; an expected close is not', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        await arbiter.detach(a, 'error:ECONNRESET');
        const b = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, b);
        await arbiter.detach(b, 'shutdown');
        const inc = (await journal()).filter(r => r.type === RecordType.INCIDENT).map(r => r.body);
        expect(inc).toEqual([expect.objectContaining({ kind: 'CAT_DISCONNECT', level: 'info' })]);
        expect(alerts.filter(x => x.kind === 'CAT_DISCONNECT')).toHaveLength(1);
    });

    it('holdOnly (cloud, direct stream for an E session): held as orphan H, never parsed, no worker opened', async () => {
        const c = new FakeConn('203.0.113.9');
        expect(await arbiter.attach('ses-edge', c, { holdOnly: true })).toEqual({ status: 'held', captured: true, why: 'route' });
        expect(arbiter.data(c, Buffer.from('direct'))).toBe('held');
        expect(arbiter.worker('ses-edge')).toBeNull();
        expect(alerts.find(x => x.kind === 'HELD_ROUTE')).toMatchObject({ tier: 'P1', nSesid: 'ses-edge', peer: '203.0.113.9' });
        await arbiter.detach(c, 'peer-closed');
        expect((await captures.list('ses-edge'))[0]).toMatchObject({ kind: 'H', bytes: 6 });
    });

    it('drops chunks of unknown connections', async () => {
        expect(arbiter.data(new FakeConn('10.0.0.9'), Buffer.from('x'))).toBe('dropped');
        expect(alerts.find(x => x.kind === 'STRAY_FEED')).toBeDefined();
    });

    it('peerOfRemote reads the IP back from a journaled remote', () => {
        expect(peerOfRemote('10.0.0.5:5000')).toBe('10.0.0.5');
        expect(peerOfRemote('::ffff:10.0.0.5:5000')).toBe('10.0.0.5');
        expect(peerOfRemote('[::1]:5000')).toBe('::1');
        expect(peerOfRemote(undefined)).toBeNull();
    });
});

describe('FeedArbiter.requestEnd: refuse new connections, drain the active one (§4.4)', () => {
    let root: string;
    let alerts: IngestAlert[];
    let arbiter: FeedArbiter;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-end-'));
        alerts = [];
        arbiter = new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: root, parserVer: '1.0.0', boundaryMs: 0, onAlert: a => alerts.push(a) }),
            onAlert: a => alerts.push(a),
        });
    });
    afterEach(async () => {
        await arbiter.close();
        fs.rmSync(root, { recursive: true, force: true });
    });

    const records = async () => (await readJournal({ root, nSesid: SES })).records.map(r => ({ type: r.type, body: decodeBody(r) as any }));

    it('keeps feeding the active connection until the CAT is idle, refuses newcomers, then CONN_CLOSE + SESSION_END', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('before end '));
        const ending = arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 150, boundMs: 5_000, pollMs: 20 });
        expect(arbiter.isEnding(SES)).toBe(true);
        expect(await arbiter.attach(SES, new FakeConn('10.0.0.5'))).toEqual({ status: 'refused', reason: 'ending' });
        expect(alerts.find(x => x.kind === 'ENDING_REFUSED')).toMatchObject({ tier: 'P2' });
        // the reporter's closing lines still land
        for (let i = 0; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 60));
            expect(arbiter.data(a, Buffer.from(`closing-${i} `))).toBe('fed');
        }
        const res = await ending;
        expect(a.closed).toEqual(['session-end']);
        const recs = await records();
        expect(Buffer.concat(recs.filter(r => r.type === RecordType.DATA).map(r => r.body as Buffer)).toString()).toBe('before end closing-0 closing-1 closing-2 ');
        // These bytes show no CAT framing, so they were held undecided (DET-4); the end decides CaseView, the default,
        // before SESSION_END, so they still reach a parser.
        expect(recs.slice(-3).map(r => r.type)).toEqual([RecordType.CONN_CLOSE, RecordType.CTX_SET, RecordType.SESSION_END]);
        expect(recs[recs.length - 3].body.reason).toBe('session-end');
        expect(recs[recs.length - 2].body).toEqual({ protocol: 'C' });
        expect(alerts.find(x => x.kind === 'PROTOCOL_FALLBACK')).toMatchObject({ tier: 'P2', data: { how: 'end' } });
        expect(res).toMatchObject({ endedBy: 'cloud', rawFinalSeq: recs.length });
        expect(await arbiter.attach(SES, new FakeConn('10.0.0.5'))).toEqual({ status: 'refused', reason: 'ended' });
        expect(await arbiter.requestEnd(SES, { endedBy: 'again' })).toBe(res);
    });

    it('never aborts an open R..E window while the CAT is connected, until the bound: then S-D11 + ABORTED_WINDOW', async () => {
        const a = new FakeConn('10.0.0.5', 'listen', 'u');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.concat([cmd('N', [1]), cmd('T', [9, 0, 0, 0]), Buffer.from('kept'), cmd('R', [9, 0, 0, 0, 9, 0, 1, 0]), Buffer.from('pending')]));
        const t0 = Date.now();
        await arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 50, boundMs: 400, pollMs: 20 });
        expect(Date.now() - t0).toBeGreaterThanOrEqual(380); // idle long before, but the window kept it draining
        const recs = await records();
        const abortSet = recs.findIndex(r => r.type === RecordType.CTX_SET && r.body.abortWindow === 'end-bound');
        expect(abortSet).toBeGreaterThan(-1);
        const inc = recs.find(r => r.type === RecordType.INCIDENT && r.body.kind === 'ABORTED_WINDOW');
        expect(inc).toBeDefined();
        expect(recs[recs.length - 1].type).toBe(RecordType.SESSION_END);
        expect(alerts.find(x => x.kind === 'ABORTED_WINDOW')).toBeDefined();
    });

    it('ends promptly when the window closes and the CAT goes idle', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.concat([cmd('N', [1]), cmd('R', [9, 0, 0, 0, 9, 0, 1, 0])]));
        const ending = arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 80, boundMs: 10_000, pollMs: 10 });
        await new Promise(resolve => setTimeout(resolve, 50));
        arbiter.data(a, cmd('E'));
        const t0 = Date.now();
        await ending;
        expect(Date.now() - t0).toBeLessThan(2_000);
        expect((await records()).some(r => r.type === RecordType.INCIDENT && r.body.kind === 'ABORTED_WINDOW')).toBe(false);
    });

    it('with no active connection, an open window is aborted at once (nothing can close it any more)', async () => {
        const a = new FakeConn('10.0.0.5');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.concat([cmd('N', [1]), cmd('R', [9, 0, 0, 0, 9, 0, 1, 0])]));
        await arbiter.detach(a, 'peer-closed');
        await arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 60_000, boundMs: 60_000 });
        const recs = await records();
        expect(recs.some(r => r.type === RecordType.CTX_SET && r.body.abortWindow === 'end-no-connection')).toBe(true);
        expect(recs[recs.length - 1].type).toBe(RecordType.SESSION_END);
    });

    it('ends a session that never had a connection', async () => {
        const res = await arbiter.requestEnd('ses-quiet', { endedBy: 'cloud' });
        expect(res.nSesid).toBe('ses-quiet');
        const recs = (await readJournal({ root, nSesid: 'ses-quiet' })).records.map(r => r.type);
        expect(recs).toEqual([RecordType.SESSION_HEADER, RecordType.EPOCH, RecordType.SESSION_END]);
    });

    it('closes held connections at the end and finalizes their captures', async () => {
        const captures = new CaptureStore({ root: path.join(root, 'capture'), limits: 'box' });
        await captures.init();
        await arbiter.close();
        arbiter = new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: root, parserVer: '1.0.0', boundaryMs: 0 }),
            captures,
        });
        const a = new FakeConn('10.0.0.5');
        const h = new FakeConn('10.0.0.6');
        await arbiter.attach(SES, a);
        arbiter.data(a, Buffer.from('x'));
        expect((await arbiter.attach(SES, h)).status).toBe('held');
        arbiter.data(h, Buffer.from('held'));
        await arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 10, boundMs: 1_000, pollMs: 5 });
        expect(a.closed).toEqual(['session-end']);
        expect(h.closed).toEqual(['session-end']);
        expect((await captures.list(SES))[0]).toMatchObject({ closedReason: 'session-end', bytes: 4 });
        expect(arbiter.sessionStatus(SES)).toMatchObject({ active: null, held: [], ended: true });
    });
});
