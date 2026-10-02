import { randomBytes, scryptSync } from 'crypto';
import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { CaptureStore, readCapture } from './capture';
import { CatListener, HANDSHAKE_PENDING_MAX_BYTES, verifyRoutePassword } from './cat-listener';
import { FeedArbiter } from './feed-arbiter';
import { HandshakeLockout } from './lockout';
import { decodeBody, readJournal, RecordType } from './raw-journal';
import { normalizeRoute, RouteCache } from './route-cache';
import { SessionWorker } from './session-worker';
import { IngestAlert } from './types';

const SES = 'ses-listen-1';
const SES2 = 'ses-listen-2';
const N = 1024; // cheap scrypt for tests; routes carry their own cost
// real sockets and journals: generous under a parallel full-suite run
jest.setTimeout(30_000);

function routeFor(nSesid: string, user: string, pass: string, extra: Record<string, unknown> = {}) {
    const salt = randomBytes(16);
    return {
        nSesid,
        nCaseid: `case-${nSesid}`,
        label: nSesid,
        nLines: 25,
        user,
        scryptN: N,
        passwordSalt: salt.toString('base64'),
        passwordHash: scryptSync(pass, salt, 32, { N }).toString('base64'),
        ...extra,
    };
}

interface Client {
    sock: net.Socket;
    closed: Promise<void>;
    isClosed: () => boolean;
    received: Buffer[];
}

function connect(port: number, localAddress = '127.0.0.1'): Promise<Client> {
    return new Promise((resolve, reject) => {
        const sock = net.connect({ port, host: '127.0.0.1', localAddress });
        let closed = false;
        const received: Buffer[] = [];
        const closedP = new Promise<void>(r => sock.on('close', () => {
            closed = true;
            r();
        }));
        sock.on('data', d => received.push(d));
        sock.on('error', () => undefined);
        sock.once('connect', () => resolve({ sock, closed: closedP, isClosed: () => closed, received }));
        sock.once('error', reject);
    });
}

async function waitFor(cond: () => boolean | Promise<boolean>, ms = 10_000): Promise<void> {
    const deadline = Date.now() + ms;
    while (!(await cond())) {
        if (Date.now() > deadline) throw new Error('timed out waiting');
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CatListener (listen mode, real loopback sockets)', () => {
    let root: string;
    let alerts: IngestAlert[];
    let routes: RouteCache;
    let arbiter: FeedArbiter;
    let captures: CaptureStore;
    let listener: CatListener;
    let port: number;
    const clients: Client[] = [];

    async function setup(
        opts: { activeWindowMs?: number; routeDisposition?: any; drain?: any; lockout?: HandshakeLockout; handshakeTimeoutMs?: number; verifyPassword?: (route: any, supplied: string) => Promise<boolean> } = {},
    ) {
        captures = new CaptureStore({ root: path.join(root, 'capture'), limits: 'box' });
        await captures.init();
        arbiter = new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: path.join(root, 'journal'), parserVer: '1.0.0', boundaryMs: 0, onAlert: a => alerts.push(a) }),
            captures,
            onAlert: a => alerts.push(a),
            activeWindowMs: opts.activeWindowMs ?? 30_000,
        });
        listener = new CatListener({
            port: 0,
            bindAddress: '127.0.0.1',
            routes,
            arbiter,
            onAlert: a => alerts.push(a),
            lockout: opts.lockout,
            routeDisposition: opts.routeDisposition,
            drain: opts.drain,
            handshakeTimeoutMs: opts.handshakeTimeoutMs,
            verifyPassword: opts.verifyPassword,
        });
        const addr = await listener.start();
        port = addr.port;
        return addr;
    }
    const client = async (local = '127.0.0.1') => {
        const c = await connect(port, local);
        clients.push(c);
        return c;
    };
    const journal = async (nSesid = SES) => {
        const w = arbiter.worker(nSesid);
        if (w) {
            await w.settled();
            await w.journal.flush();
        }
        return (await readJournal({ root: path.join(root, 'journal'), nSesid, repair: false })).records.map(r => ({ type: r.type, body: decodeBody(r) as any }));
    };
    const dataOf = async (nSesid = SES) => Buffer.concat((await journal(nSesid)).filter(r => r.type === RecordType.DATA).map(r => r.body as Buffer)).toString('latin1');

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-listener-'));
        alerts = [];
        routes = new RouteCache({ source: { read: async () => [] }, pollMs: 0 });
        routes.load([routeFor(SES, 'alok', 'Correct-Horse-1'), routeFor(SES2, 'bina', 'Other-Pass-22')]);
    });
    afterEach(async () => {
        for (const c of clients.splice(0)) c.sock.destroy();
        await listener?.stop();
        await arbiter?.close();
        routes.stop();
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('binds the given address with keepalive 10 s, and routes a valid handshake to its session (password never journaled)', async () => {
        const keepAlive = jest.spyOn(net.Socket.prototype, 'setKeepAlive');
        const addr = await setup();
        expect(addr.address).toBe('127.0.0.1');
        const c = await client();
        c.sock.write('alok\r\nCorrect-Horse-1\r\nFIRST-BYTES');
        await waitFor(async () => (await dataOf()).includes('FIRST-BYTES'));
        c.sock.write('-MORE');
        await waitFor(async () => (await dataOf()) === 'FIRST-BYTES-MORE');
        const recs = await journal();
        const open = recs.find(r => r.type === RecordType.CONN_OPEN)!;
        expect(open.body).toMatchObject({ user: 'alok', mode: 'listen' });
        expect(open.body.remote).toMatch(/^127\.0\.0\.1:\d+$/);
        const raw = fs.readFileSync(path.join(root, 'journal', SES, 'seg-00001.ej')).toString('latin1');
        expect(raw).not.toContain('Correct-Horse-1');
        expect(keepAlive).toHaveBeenCalledWith(true, 10_000);
        expect(listener.stats).toMatchObject({ accepted: 1, handshakes: 1 });
        keepAlive.mockRestore();
    });

    it('reassembles a handshake split across chunks and buffers bytes that arrive during password verification', async () => {
        await setup();
        const c = await client();
        c.sock.write('al');
        await sleep(20);
        c.sock.write('ok\r\nCorrect-Ho');
        await sleep(20);
        c.sock.write('rse-1\r\nA');
        c.sock.write('B');
        c.sock.write('C');
        await waitFor(async () => (await dataOf()) === 'ABC');
    });

    it('unknown username: refused and alerted, nothing kept, no session touched (D3)', async () => {
        await setup();
        const c = await client();
        c.sock.write('mallory\r\nwhatever\r\nSECRET-TEXT');
        await c.closed;
        expect(alerts.find(a => a.kind === 'UNKNOWN_LOGIN')).toMatchObject({ tier: 'P2', user: 'mallory', peer: '127.0.0.1' });
        expect(arbiter.worker(SES)).toBeNull();
        expect(fs.existsSync(path.join(root, 'journal', SES))).toBe(false);
        expect(fs.readdirSync(path.join(root, 'capture'))).toEqual([]);
    });

    it('closes a handshake longer than 512 bytes, and one that never completes', async () => {
        await setup({ handshakeTimeoutMs: 150 });
        const long = await client();
        long.sock.write('x'.repeat(600));
        await long.closed;
        const huge = await client();
        huge.sock.write(`${'u'.repeat(300)}\r\n${'p'.repeat(300)}\r\nDATA`);
        await huge.closed;
        const slow = await client();
        slow.sock.write('alok\r\n');
        await slow.closed;
        expect(listener.stats.accepted).toBe(0);
    });

    it('wrong passwords for a live route lock the (IP, user) out after 5; the right password is then dropped too; Unlock lifts it; another IP is unaffected', async () => {
        await setup();
        for (let i = 0; i < 5; i++) {
            const c = await client('127.0.0.2');
            c.sock.write('alok\r\nwrong-password\r\n');
            await c.closed;
        }
        expect(listener.lockoutState.isBlocked('127.0.0.2', 'alok')).toBe(true);
        expect(alerts.filter(a => a.kind === 'LOCKOUT')).toHaveLength(1);
        await waitFor(async () => (await journal()).some(r => r.type === RecordType.INCIDENT && r.body.kind === 'LOCKOUT'));

        const blocked = await client('127.0.0.2');
        blocked.sock.write('alok\r\nCorrect-Horse-1\r\nDROPPED');
        await blocked.closed;
        expect(listener.stats.droppedBlocked).toBe(1);

        const other = await client('127.0.0.3');
        other.sock.write('alok\r\nCorrect-Horse-1\r\nFROM-3');
        await waitFor(async () => (await dataOf()).includes('FROM-3'));
        other.sock.destroy();
        await other.closed;

        expect(listener.lockoutState.unlock({ ip: '127.0.0.2', user: 'alok' })).toBe(1);
        const again = await client('127.0.0.2');
        again.sock.write('alok\r\nCorrect-Horse-1\r\nAFTER-UNLOCK');
        // accepted again; the session is now pinned to .3, which fed it seconds ago, so .2 is held (pin rule)
        await waitFor(() => (arbiter.sessionStatus(SES)?.held ?? []).some(h => h.peer === '127.0.0.2' && h.bytes === 12));
        expect(again.isClosed()).toBe(false);
        expect(await dataOf()).not.toContain('DROPPED');
    });

    it('parallel wrong-password handshakes verify at most 5 guesses: a verification in flight holds a failure slot', async () => {
        let calls = 0;
        let running = 0;
        let maxRunning = 0;
        await setup({
            verifyPassword: async () => {
                calls += 1;
                running += 1;
                maxRunning = Math.max(maxRunning, running);
                await sleep(150);
                running -= 1;
                return false;
            },
        });
        const conns = await Promise.all(Array.from({ length: 20 }, () => client('127.0.0.2')));
        for (const c of conns) c.sock.write('alok\r\nwrong-password\r\n');
        await Promise.all(conns.map(c => c.closed));
        expect(calls).toBe(5);
        expect(maxRunning).toBeLessThanOrEqual(5);
        const st = listener.stats;
        expect(st).toMatchObject({ handshakes: 20, verifications: 5, wrongPasswords: 5, accepted: 0 });
        expect(st.droppedBusy + st.droppedBlocked).toBe(15);
        expect(listener.lockoutState.isBlocked('127.0.0.2', 'alok')).toBe(true);
        const entry = listener.lockoutState.status().find(e => e.ip === '127.0.0.2' && e.user === 'alok')!;
        // the five verified guesses are failures, never "dropped while blocked"; only real drops are reported as such
        expect(entry.droppedWhileBlocked).toBe(st.droppedBlocked);
        expect(entry.droppedBusy).toBe(st.droppedBusy);
        expect(entry.inFlight).toBe(0);
        expect(alerts.filter(a => a.kind === 'LOCKOUT')).toHaveLength(1);
    });

    it('caps password verifications in flight per IP across users; a handshake dropped for it is not a failure', async () => {
        let calls = 0;
        const lockout = new HandshakeLockout({ policy: { maxVerifyPerIp: 1 } });
        await setup({
            lockout,
            verifyPassword: async (route, supplied) => {
                calls += 1;
                await sleep(150);
                return verifyRoutePassword(route, supplied);
            },
        });
        const a = await client('127.0.0.4');
        const b = await client('127.0.0.4');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nA');
        await waitFor(() => lockout.inFlight('127.0.0.4') === 1);
        b.sock.write('bina\r\nOther-Pass-22\r\nB');
        await b.closed;
        expect(listener.stats.droppedBusy).toBe(1);
        await waitFor(async () => (await dataOf(SES)) === 'A');
        expect(calls).toBe(1);
        expect(lockout.inFlight('127.0.0.4')).toBe(0);
        expect(lockout.status()).toEqual([]); // nothing was counted against anyone
        const again = await client('127.0.0.4');
        again.sock.write('bina\r\nOther-Pass-22\r\nB-AGAIN');
        await waitFor(async () => (await dataOf(SES2)) === 'B-AGAIN');
    });

    it('pauses the socket while the password is verified (bounded buffering) and loses no byte', async () => {
        let release!: () => void;
        const gate = new Promise<void>(resolve => (release = resolve));
        // a held route keeps the parser out of it: this is about the listener's buffering, not parse speed
        await setup({
            routeDisposition: () => 'hold',
            verifyPassword: async (route, supplied) => {
                await gate;
                return verifyRoutePassword(route, supplied);
            },
        });
        const backlog = Buffer.from(Array.from({ length: 16_384 }, (_, i) => `backlog ${String(i).padStart(5, '0')}\r\n`).join(''), 'latin1'); // ~256 KB
        const c = await client('127.0.0.1');
        c.sock.write(Buffer.concat([Buffer.from('alok\r\nCorrect-Horse-1\r\n'), backlog]));
        await waitFor(() => listener.stats.pausedHandshakes === 1);
        await sleep(200); // the client keeps pushing; the paused socket must not buffer it in user space
        // at most the cap plus one socket read (64 KB) is ever held in user space
        expect(listener.stats.maxPendingBytes).toBeLessThanOrEqual(HANDSHAKE_PENDING_MAX_BYTES + 64 * 1024);
        expect(listener.stats.maxPendingBytes).toBeLessThan(backlog.length);
        expect(arbiter.sessionStatus(SES)?.held ?? []).toEqual([]); // nothing reaches the session before the password is verified
        release();
        await waitFor(() => (arbiter.sessionStatus(SES)?.held[0]?.bytes ?? 0) === backlog.length, 20_000);
        expect(c.isClosed()).toBe(false);
        c.sock.destroy();
        await waitFor(async () => (await captures.list(SES)).some(m => m.closedReason !== null));
        const meta = (await captures.list(SES))[0];
        const recs = await readCapture(captures.filePath(meta), SES);
        expect(Buffer.concat(recs.filter(r => r.type === RecordType.DATA).map(r => r.payload)).equals(backlog)).toBe(true);
    });

    it('same peer reconnect takes over: the old socket is closed with CONN_CLOSE{superseded}', async () => {
        await setup();
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nOLD');
        await waitFor(async () => (await dataOf()) === 'OLD');
        const b = await client('127.0.0.1');
        b.sock.write('alok\r\nCorrect-Horse-1\r\nNEW');
        await a.closed;
        await waitFor(async () => (await dataOf()) === 'OLDNEW');
        const conn = (await journal()).filter(r => r.type === RecordType.CONN_OPEN || r.type === RecordType.CONN_CLOSE).map(r => r.body.reason ?? 'open');
        expect(conn).toEqual(['open', 'superseded', 'open']);
        expect(b.isClosed()).toBe(false);
    });

    it('a different peer while the active one is busy is HELD (socket open, bytes captured, never parsed) with a P1 alert', async () => {
        await setup();
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nREPORTER');
        await waitFor(async () => (await dataOf()) === 'REPORTER');
        const b = await client('127.0.0.2');
        b.sock.write('alok\r\nCorrect-Horse-1\r\nINTRUDER');
        await waitFor(() => (arbiter.sessionStatus(SES)?.held[0]?.bytes ?? 0) === 8);
        a.sock.write('-STILL');
        await waitFor(async () => (await dataOf()) === 'REPORTER-STILL');
        expect(b.isClosed()).toBe(false);
        expect(alerts.find(x => x.kind === 'HELD_PEER')).toMatchObject({ tier: 'P1', peers: ['127.0.0.1', '127.0.0.2'], user: 'alok' });
        expect(listener.stats.held).toBe(1);
        b.sock.destroy();
        await waitFor(async () => (await captures.list(SES)).some(m => m.closedReason !== null));
        expect((await captures.list(SES))[0]).toMatchObject({ kind: 'C', peer: '127.0.0.2', user: 'alok', bytes: 8 });
    });

    it('a different peer takes over an active feed idle for the window, with an alert', async () => {
        await setup({ activeWindowMs: 200 });
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nX');
        await waitFor(async () => (await dataOf()) === 'X');
        await sleep(260);
        const b = await client('127.0.0.2');
        b.sock.write('alok\r\nCorrect-Horse-1\r\nY');
        await a.closed;
        await waitFor(async () => (await dataOf()) === 'XY');
        expect(alerts.find(x => x.kind === 'PEER_TAKEOVER')).toMatchObject({ peers: ['127.0.0.1', '127.0.0.2'] });
    });

    it('pinned peer: another peer right after a drop is held, the pinned peer gets back in, and an admin re-pin promotes the held one', async () => {
        await setup({ activeWindowMs: 20_000 });
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nA1');
        await waitFor(async () => (await dataOf()) === 'A1');
        a.sock.destroy();
        await waitFor(() => !arbiter.hasActive(SES));
        const b = await client('127.0.0.2');
        b.sock.write('alok\r\nCorrect-Horse-1\r\nB1');
        await waitFor(() => (arbiter.sessionStatus(SES)?.held.length ?? 0) === 1);
        const a2 = await client('127.0.0.1');
        a2.sock.write('alok\r\nCorrect-Horse-1\r\nA2');
        await waitFor(async () => (await dataOf()) === 'A1A2');

        const heldId = arbiter.sessionStatus(SES)!.held[0].connId;
        expect(await arbiter.repin(SES, { connId: heldId }, 'operator')).toBe(true);
        await a2.closed;
        b.sock.write('B2');
        await waitFor(async () => (await dataOf()) === 'A1A2B2');
        expect(arbiter.sessionStatus(SES)!.pinnedPeer).toBe('127.0.0.2');
    });

    it('keeps sessions apart: two logins feed two journals', async () => {
        await setup();
        const a = await client('127.0.0.1');
        const b = await client('127.0.0.2');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nSESSION-ONE');
        b.sock.write('bina\r\nOther-Pass-22\r\nSESSION-TWO');
        await waitFor(async () => (await dataOf(SES)) === 'SESSION-ONE' && (await dataOf(SES2)) === 'SESSION-TWO');
    });

    it('ending: a new connection is refused while the active one drains, then the server closes it', async () => {
        await setup();
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nBODY');
        await waitFor(async () => (await dataOf()) === 'BODY');
        const ended = arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 250, boundMs: 5_000, pollMs: 20 });
        const late = await client('127.0.0.1');
        late.sock.write('alok\r\nCorrect-Horse-1\r\nLATE');
        await late.closed;
        a.sock.write('-CLOSING');
        await ended;
        await a.closed;
        expect(await dataOf()).toBe('BODY-CLOSING');
        expect(listener.stats.refused).toBe(1);
        const recs = await journal();
        expect(recs[recs.length - 1].type).toBe(RecordType.SESSION_END);
    });

    it('a route that disappears does not kill the stream: the session drains, then ends', async () => {
        await setup({ drain: { idleMs: 200, boundMs: 5_000, pollMs: 20 } });
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nBEFORE');
        await waitFor(async () => (await dataOf()) === 'BEFORE');
        routes.load([routeFor(SES2, 'bina', 'Other-Pass-22')]); // SES removed
        a.sock.write('-AFTER');
        await waitFor(async () => (await dataOf()) === 'BEFORE-AFTER');
        await a.closed;
        await waitFor(() => !!arbiter.sessionStatus(SES)?.ended);
        const recs = await journal();
        expect(recs[recs.length - 3]).toMatchObject({ type: RecordType.CONN_CLOSE, body: { reason: 'session-end' } });
        // 'BEFORE-AFTER' shows no CAT framing (DET-4): the end decides CaseView, the default, so the bytes still parse
        expect(recs[recs.length - 2]).toMatchObject({ type: RecordType.CTX_SET, body: { protocol: 'C' } });
        expect(recs[recs.length - 1]).toMatchObject({ type: RecordType.SESSION_END, body: { endedBy: 'route-removed' } });
    });

    it('a route read error keeps live streams and logins working (last good routes)', async () => {
        let fail = false;
        routes = new RouteCache({
            source: {
                read: async () => {
                    if (fail) throw new Error('EIO');
                    return [routeFor(SES, 'alok', 'Correct-Horse-1')];
                },
            },
            pollMs: 0,
        });
        await routes.start();
        await setup();
        const a = await client('127.0.0.1');
        a.sock.write('alok\r\nCorrect-Horse-1\r\nONE');
        await waitFor(async () => (await dataOf()) === 'ONE');
        fail = true;
        expect((await routes.refresh()).ok).toBe(false);
        a.sock.write('-TWO');
        await waitFor(async () => (await dataOf()) === 'ONE-TWO');
        expect(a.isClosed()).toBe(false);
    });

    it('cloud: a direct stream for an E route is accepted and held (orphan H), never parsed', async () => {
        routes.load([routeFor(SES, 'alok', 'Correct-Horse-1', { feedSource: 'E', nEdgeid: 3 })]);
        await setup({ routeDisposition: (r: any) => (r.feedSource === 'E' ? 'hold' : 'feed') });
        const c = await client('127.0.0.1');
        c.sock.write('alok\r\nCorrect-Horse-1\r\nDIRECT');
        await waitFor(() => (arbiter.sessionStatus(SES)?.held[0]?.bytes ?? 0) === 6);
        expect(arbiter.worker(SES)).toBeNull();
        expect(alerts.find(x => x.kind === 'HELD_ROUTE')).toBeDefined();
    });
});

describe('verifyRoutePassword', () => {
    it('checks scrypt routes at their own cost and legacy plaintext routes in constant time', async () => {
        const r = normalizeRoute(routeFor('s', 'u', 'p@ss'))!;
        expect(await verifyRoutePassword(r, 'p@ss')).toBe(true);
        expect(await verifyRoutePassword(r, 'p@sS')).toBe(false);
        expect(await verifyRoutePassword(r, '')).toBe(false);
        const legacy = normalizeRoute({ nSesid: 's', user: 'u', pass: 'plain' })!;
        expect(await verifyRoutePassword(legacy, 'plain')).toBe(true);
        expect(await verifyRoutePassword(legacy, 'plainx')).toBe(false);
        const broken = normalizeRoute({ nSesid: 's', user: 'u', passwordSalt: 'AA==', passwordHash: '', pass: undefined });
        expect(broken).toBeNull();
    });

    it('accepts routes written by today\'s cloud (node default scrypt cost, no scryptN)', async () => {
        const salt = randomBytes(16);
        const r = normalizeRoute({ nSesid: 's', user: 'u', passwordSalt: salt.toString('base64'), passwordHash: scryptSync('legacy-default', salt, 32).toString('base64') })!;
        expect(r.scryptN).toBeNull();
        expect(await verifyRoutePassword(r, 'legacy-default')).toBe(true);
    });
});
