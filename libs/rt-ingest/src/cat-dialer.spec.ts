import * as fs from 'fs';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';

import { CatDialer, ConnectivityLogEntry, DEFAULT_RECONNECT_MS, DialerSettings, validateDialerSettings } from './cat-dialer';
import { FeedArbiter } from './feed-arbiter';
import { decodeBody, readJournal, RecordType } from './raw-journal';
import { SessionWorker } from './session-worker';

const SES = 'ses-dial-1';
const SES2 = 'ses-dial-2';
// real sockets and journals: generous under a parallel full-suite run
jest.setTimeout(30_000);

/** Stands in for a transmitter in server mode (like tcp-server-main/tcp.js): waits for the box to connect. */
class Transmitter {
    private server: net.Server | null = null;
    readonly sockets = new Set<net.Socket>();
    connections = 0;
    port = 0;
    received: Buffer[] = [];
    onConnect: ((s: net.Socket) => void) | null = null;

    async start(port = 0): Promise<number> {
        this.server = net.createServer(sock => {
            this.connections += 1;
            this.sockets.add(sock);
            sock.on('data', d => this.received.push(d));
            sock.on('close', () => this.sockets.delete(sock));
            sock.on('error', () => undefined);
            this.onConnect?.(sock);
        });
        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(port, '127.0.0.1', () => resolve());
        });
        this.port = (this.server.address() as net.AddressInfo).port;
        return this.port;
    }

    send(data: string | Buffer): void {
        for (const s of this.sockets) s.write(data);
    }

    dropClients(): void {
        for (const s of this.sockets) s.destroy();
    }

    async stop(): Promise<void> {
        this.dropClients();
        const server = this.server;
        this.server = null;
        if (server) await new Promise<void>(resolve => server.close(() => resolve()));
    }
}

async function waitFor(cond: () => boolean | Promise<boolean>, ms = 10_000, what = 'condition'): Promise<void> {
    const deadline = Date.now() + ms;
    while (!(await cond())) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CatDialer (dial mode, "Box connects to transmitter")', () => {
    let root: string;
    let arbiter: FeedArbiter;
    let tx: Transmitter;
    let log: ConnectivityLogEntry[];
    const dialers: CatDialer[] = [];

    const settings = (over: Partial<DialerSettings> = {}): DialerSettings => ({ protocol: 'bridge', host: '127.0.0.1', port: tx.port, autoReconnect: true, reconnectMs: 100, ...over });
    const makeDialer = (over: Partial<ConstructorParameters<typeof CatDialer>[0]> = {}) => {
        const d = new CatDialer({ arbiter, onLog: e => log.push(e), connectTimeoutMs: 1_000, ...over });
        dialers.push(d);
        return d;
    };
    const setUp = (d: CatDialer, s: DialerSettings = settings(), nSesid: string | null = SES) => {
        const res = d.apply({ settings: s, nSesid }, d.version);
        expect(res.ok).toBe(true);
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
    const connRecords = async (nSesid = SES) =>
        (await journal(nSesid)).filter(r => r.type === RecordType.CONN_OPEN || r.type === RecordType.CONN_CLOSE).map(r => (r.type === RecordType.CONN_OPEN ? 'open' : `close:${r.body.reason}`));

    beforeEach(async () => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-dialer-'));
        log = [];
        arbiter = new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: path.join(root, 'journal'), parserVer: '1.0.0', boundaryMs: 0 }),
        });
        tx = new Transmitter();
        await tx.start();
    });
    afterEach(async () => {
        for (const d of dialers.splice(0)) await d.close();
        await tx.stop();
        await arbiter.close();
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('validates settings (protocol, host, port, auto-reconnect, transmitter network)', () => {
        expect(validateDialerSettings({ protocol: 'bridge', host: '192.168.50.10', port: 1337, autoReconnect: true })).toEqual([]);
        expect(validateDialerSettings({ protocol: 'caseview', host: 'stenograph-1.local', port: 23, autoReconnect: false, reconnectMs: 3000 })).toEqual([]);
        expect(validateDialerSettings({ protocol: 'xml' as any, host: '', port: 0, autoReconnect: 'yes' as any })).toHaveLength(4);
        expect(validateDialerSettings({ protocol: 'bridge', host: 'bad host!', port: 70_000, autoReconnect: true })).toHaveLength(2);
        expect(validateDialerSettings({ protocol: 'bridge', host: '8.8.8.8', port: 1, autoReconnect: true }, h => h.startsWith('192.168.50.'))).toEqual(['host is not on the transmitter network']);
        expect(validateDialerSettings(null)).toEqual(['settings are required']);
    });

    it('starts not set up; Connect needs settings and a receiving session', () => {
        const d = makeDialer();
        expect(d.status()).toMatchObject({ state: 'not-set-up', connected: false, retrying: false, version: 1 });
        expect(d.connect()).toMatchObject({ ok: false, reason: 'not-set-up' });
        d.apply({ settings: settings() }, d.version);
        expect(d.status().state).toBe('not-set-up'); // still no session
        d.apply({ nSesid: SES }, d.version);
        expect(d.status().state).toBe('disconnected');
    });

    it('connects, journals CONN_OPEN (no user) + CTX_SET from the configured protocol, and feeds the bound session', async () => {
        const d = makeDialer();
        setUp(d, settings({ protocol: 'caseview' }));
        expect(d.connect().ok).toBe(true);
        await waitFor(() => d.status().connected, 5_000, 'connected');
        await waitFor(() => d.status().role === 'active', 5_000, 'attached');
        tx.send('\x02  THE COURT:  Please be seated.\r\n'); // STX first, but the setting says CaseView
        await waitFor(async () => (await dataOf()).includes('Please be seated.'), 5_000, 'data');
        const recs = await journal();
        const open = recs.find(r => r.type === RecordType.CONN_OPEN)!;
        expect(open.body).toEqual({ connId: expect.stringMatching(/^d-/), remote: expect.stringMatching(/^127\.0\.0\.1:\d+$/), mode: 'dial' });
        expect(recs.find(r => r.type === RecordType.CTX_SET)!.body).toEqual({ protocol: 'C' });
        await waitFor(() => d.status().lastLineAt !== null, 5_000, 'a parsed line');
        const st = d.status();
        expect(st).toMatchObject({ state: 'live', attempt: 0, nSesid: SES, connected: true, role: 'active' });
        expect(st.bytes).toBeGreaterThan(0);
        expect(st.lastByteAt).not.toBeNull();
        expect(st.peer).toMatch(/^127\.0\.0\.1:/);
        expect(log.map(e => e.kind)).toEqual(expect.arrayContaining(['attempt', 'connected', 'feed', 'success']));
    });

    it('auto-reconnects every reconnectMs after the transmitter goes away, and resumes on the same port', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active', 5_000, 'first connection');
        tx.send('FIRST ');
        await waitFor(async () => (await dataOf()) === 'FIRST ', 5_000, 'first data');

        const port = tx.port;
        const stoppedAt = Date.now();
        await tx.stop(); // transmitter rebooting
        await waitFor(() => d.status().state === 'connecting', 5_000, 'connecting');
        const v = d.version;
        await waitFor(() => d.status().attempt >= 3, 10_000, 'three failed attempts at 100 ms'); // retries keep going
        const st = d.status();
        expect(st.state).toBe('connecting');
        expect(st.retrying).toBe(true);
        expect(d.version).toBe(v); // retries do not churn the state version
        expect(log.filter(e => e.kind === 'attempt').length).toBeGreaterThanOrEqual(3);
        expect(log.filter(e => e.kind === 'attempt').every(e => e.collapseKey === 'dial-retry')).toBe(true);
        expect(log.some(e => e.kind === 'error')).toBe(true);
        // every re-dial waits reconnectMs after the failure that ended the previous connection or attempt (never a tight loop)
        const cycle = log.filter(e => e.at >= stoppedAt && (e.kind === 'attempt' || e.kind === 'error' || e.kind === 'disconnected'));
        let spaced = 0;
        cycle.forEach((e, i) => {
            if (e.kind !== 'attempt') return;
            const failure = cycle.slice(0, i).reverse().find(x => x.kind !== 'attempt');
            if (!failure) return;
            expect(e.at - failure.at).toBeGreaterThanOrEqual(90);
            spaced += 1;
        });
        expect(spaced).toBeGreaterThanOrEqual(3);

        await tx.start(port); // back on the same port
        await waitFor(() => d.status().role === 'active', 5_000, 'reconnected');
        tx.send('SECOND');
        await waitFor(async () => (await dataOf()) === 'FIRST SECOND', 5_000, 'second data');
        expect(await connRecords()).toEqual(['open', 'close:peer-closed', 'open']);
        expect(d.status()).toMatchObject({ state: 'live', attempt: 0 });
        expect(tx.connections).toBe(2); // one before the reboot, one after: the failed attempts never connected
    });

    it('auto-reconnect defaults to every 3 s (RT local 3.0, D34): the next attempt is 3000 ms out and nothing re-dials early', async () => {
        expect(DEFAULT_RECONNECT_MS).toBe(3_000);
        const now = 5_000_000;
        const d = makeDialer({ clock: () => now });
        const dead = new Transmitter();
        const deadPort = await dead.start();
        await dead.stop();
        setUp(d, { protocol: 'bridge', host: '127.0.0.1', port: deadPort, autoReconnect: true }); // no reconnectMs
        expect(d.connect().ok).toBe(true);
        await waitFor(() => d.status().nextAttemptAt !== null, 10_000, 'the first attempt to fail');
        expect(d.status().nextAttemptAt! - now).toBe(3_000);
        expect(d.status()).toMatchObject({ state: 'connecting', retrying: true, attempt: 1 });
        await sleep(500);
        expect(log.filter(e => e.kind === 'attempt')).toHaveLength(1);
        expect(d.status().attempt).toBe(1);
    });

    it('with auto-reconnect off a drop leaves it disconnected, until a manual Reconnect', async () => {
        const d = makeDialer();
        setUp(d, settings({ autoReconnect: false }));
        d.connect();
        await waitFor(() => d.status().role === 'active');
        tx.dropClients();
        await waitFor(() => d.status().state === 'disconnected');
        await sleep(300);
        expect(tx.connections).toBe(1);
        expect(d.status().retrying).toBe(false);
        expect(d.reconnect().ok).toBe(true);
        await waitFor(() => d.status().role === 'active');
        expect(tx.connections).toBe(2);
    });

    it('manual Reconnect closes the live connection (CONN_CLOSE{manual-reconnect}) and dials at once', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        tx.send('A');
        await waitFor(async () => (await dataOf()) === 'A');
        d.reconnect();
        await waitFor(() => tx.connections === 2 && d.status().role === 'active');
        tx.send('B');
        await waitFor(async () => (await dataOf()) === 'AB');
        expect(await connRecords()).toEqual(['open', 'close:manual-reconnect', 'open']);
    });

    it('Disconnect stops feeding and does not reconnect', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        expect(d.disconnect().ok).toBe(true);
        await waitFor(async () => (await connRecords()).length === 2);
        expect(await connRecords()).toEqual(['open', 'close:disconnect']);
        await sleep(300);
        expect(tx.connections).toBe(1);
        expect(d.status().state).toBe('disconnected');
    });

    it('Test only reports reachability within 5 s and never feeds a session', async () => {
        const d = makeDialer();
        setUp(d);
        tx.onConnect = s => s.write('BYTES-THE-TEST-MUST-NOT-KEEP');
        const ok = await d.testOnly();
        expect(ok).toMatchObject({ ok: true, reachable: true, host: '127.0.0.1', port: tx.port });
        expect(ok.ms).toBeLessThan(5_000);
        expect(arbiter.worker(SES)).toBeNull(); // no session was opened, nothing journaled
        expect(fs.existsSync(path.join(root, 'journal', SES))).toBe(false);

        const closed = new Transmitter();
        const deadPort = await closed.start();
        await closed.stop();
        const bad = await d.testOnly(settings({ port: deadPort }));
        expect(bad).toMatchObject({ ok: true, reachable: false });
        expect(bad.error).toBeTruthy();

        expect(await d.testOnly(settings({ port: 0 }))).toMatchObject({ ok: false, refused: 'invalid' });
        expect(log.filter(e => e.kind === 'test').length).toBeGreaterThanOrEqual(4);
    });

    it('Test only is REFUSED while capturing, connecting or retrying (DR13)', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        expect(await d.testOnly()).toMatchObject({ ok: false, refused: 'busy', state: 'live' });
        await tx.stop();
        await waitFor(() => d.status().state === 'connecting');
        expect(await d.testOnly()).toMatchObject({ ok: false, refused: 'busy', state: 'connecting' });
        d.disconnect();
        const res = await d.testOnly();
        expect(res.ok).toBe(true);
        expect(res.refused).toBeUndefined();
    });

    it('Test only is refused while the bound session already has an active feed (e.g. listen mode)', async () => {
        const d = makeDialer();
        setUp(d);
        const fake = { connId: 'l-x', mode: 'listen' as const, peer: '10.9.9.9', remote: '10.9.9.9:1', user: 'u', close: () => undefined };
        await arbiter.attach(SES, fake);
        expect(await d.testOnly()).toMatchObject({ ok: false, refused: 'busy' });
    });

    it('a concurrent Test only, and Connect during a test, are refused', async () => {
        const d = makeDialer();
        setUp(d);
        const first = d.testOnly();
        expect(await d.testOnly()).toMatchObject({ ok: false, refused: 'testing' });
        expect(d.connect()).toMatchObject({ ok: false, reason: 'testing' });
        await first;
    });

    it('state version: an apply built from an older version is refused, including after a connection change', async () => {
        const d = makeDialer();
        const v0 = d.version;
        expect(d.apply({ settings: settings(), nSesid: SES }, v0 + 7)).toEqual({ ok: false, reason: 'stale', version: v0 });
        const res = d.apply({ settings: settings(), nSesid: SES }, v0);
        expect(res).toMatchObject({ ok: true });
        const draftVersion = d.version; // the admin opens the guard dialog here
        d.connect();
        await waitFor(() => d.status().role === 'active');
        expect(d.version).toBeGreaterThan(draftVersion);
        expect(d.apply({ settings: settings({ port: 1 }) }, draftVersion)).toMatchObject({ ok: false, reason: 'stale' });
        expect(d.settings!.port).toBe(tx.port);
        const vLive = d.version;
        tx.dropClients();
        await waitFor(() => d.status().state === 'connecting');
        expect(d.version).toBeGreaterThan(vLive); // the connection changed
        expect(d.apply({ settings: settings({ protocol: 'caseview' }) }, vLive)).toMatchObject({ ok: false, reason: 'stale' });
        expect(d.apply({ settings: settings({ host: '' }) }, d.version)).toMatchObject({ ok: false, reason: 'invalid' });
    });

    it('state version: every successful apply, Connect, Reconnect and Disconnect moves it, so a second draft built from the same version is stale', async () => {
        const d = makeDialer();
        setUp(d);
        const v = d.version;
        const a = settings({ protocol: 'caseview' });
        expect(d.apply({ settings: a }, v)).toMatchObject({ ok: true });
        expect(d.version).toBeGreaterThan(v);
        // a second guard dialog opened at v must re-check: refused, and the first change stands
        expect(d.apply({ settings: settings({ port: 1 }) }, v)).toEqual({ ok: false, reason: 'stale', version: d.version });
        expect(d.settings).toEqual(a);
        // even an apply that changes nothing invalidates other drafts
        const v2 = d.version;
        expect(d.apply({ settings: a }, v2).ok).toBe(true);
        expect(d.version).toBeGreaterThan(v2);
        expect(d.apply({ nSesid: SES2 }, v2)).toMatchObject({ ok: false, reason: 'stale' });
        expect(d.nSesid).toBe(SES);

        let before = d.version;
        expect(d.connect().ok).toBe(true);
        expect(d.version).toBeGreaterThan(before);
        await waitFor(() => d.status().role === 'active');
        before = d.version;
        expect(d.reconnect().ok).toBe(true);
        expect(d.version).toBeGreaterThan(before);
        await waitFor(() => tx.connections === 2 && d.status().role === 'active');
        before = d.version;
        expect(d.disconnect().ok).toBe(true);
        expect(d.version).toBeGreaterThan(before);
        expect(d.apply({ settings: a }, before)).toMatchObject({ ok: false, reason: 'stale' });
    });

    it('an applied transmitter change closes the live link (settings-changed) and dials the new one; the session pin follows', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        tx.send('OLD ');
        await waitFor(async () => (await dataOf()) === 'OLD ');
        const tx2 = new Transmitter();
        await tx2.start();
        try {
            expect(d.apply({ settings: settings({ port: tx2.port }) }, d.version).ok).toBe(true);
            await waitFor(() => tx2.connections === 1 && d.status().role === 'active');
            tx2.send('NEW');
            await waitFor(async () => (await dataOf()) === 'OLD NEW');
            expect(await connRecords()).toEqual(['open', 'close:settings-changed', 'open']);
            expect(arbiter.sessionStatus(SES)!.held).toEqual([]);
        } finally {
            await tx2.stop();
        }
    });

    it('re-binding to another live session closes with session-changed and feeds the new one', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        tx.send('ONE');
        await waitFor(async () => (await dataOf(SES)) === 'ONE');
        expect(d.apply({ nSesid: SES2 }, d.version).ok).toBe(true);
        await waitFor(() => tx.connections === 2 && d.status().role === 'active' && d.nSesid === SES2);
        tx.send('TWO');
        await waitFor(async () => (await dataOf(SES2)) === 'TWO');
        expect(await connRecords(SES)).toEqual(['open', 'close:session-changed']);
        expect(await dataOf(SES)).toBe('ONE');
    });

    it('goes quiet when connected but silent', async () => {
        const d = makeDialer({ quietMs: 150 });
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        await sleep(200);
        expect(d.status().state).toBe('quiet');
        tx.send('x');
        await waitFor(() => d.status().state === 'live');
        expect(d.status().connected).toBe(true);
    });

    it('stops reconnecting once the session ends, and refuses Connect afterwards', async () => {
        const d = makeDialer();
        setUp(d);
        d.connect();
        await waitFor(() => d.status().role === 'active');
        tx.send('LAST WORDS');
        await waitFor(async () => (await dataOf()) === 'LAST WORDS');
        await arbiter.requestEnd(SES, { endedBy: 'cloud', idleMs: 20, boundMs: 2_000, pollMs: 10 });
        await waitFor(() => !d.status().connected);
        await sleep(300);
        expect(tx.connections).toBe(1);
        expect(d.status().state).toBe('disconnected');
        expect(d.connect()).toMatchObject({ ok: false, reason: 'session-ending' });
    });
});
