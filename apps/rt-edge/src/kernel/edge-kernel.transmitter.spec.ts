import * as net from 'net';

import { readJournal, RecordType } from '@app/rt-ingest';

import type { EdgeActor, TransmitterSettings } from '../contracts';
import { EdgePortError, isEdgePortError } from '../ports';
import { bridgeLines, eclipse, Harness, harness, sessionAssignment, sleep, waitFor } from './testing/kernel-harness';

jest.setTimeout(90_000);

const ACTOR: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };
const LISTEN: TransmitterSettings = { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };

/** A transmitter that waits for the box ("Wait for connection") and streams Bridge lines to whoever connects. */
class LoopbackTransmitter {
    server: net.Server | null = null;
    port = 0;
    readonly sockets = new Set<net.Socket>();
    connections = 0;
    next = 0;

    async start(port = 0): Promise<number> {
        this.server = net.createServer(sock => {
            this.connections += 1;
            this.sockets.add(sock);
            sock.on('error', () => undefined);
            sock.on('close', () => this.sockets.delete(sock));
        });
        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(port, '127.0.0.1', () => resolve());
        });
        this.port = (this.server.address() as net.AddressInfo).port;
        return this.port;
    }

    send(lines: number): void {
        const data = bridgeLines(this.next, lines);
        this.next += lines;
        for (const s of this.sockets) s.write(data);
    }

    async stop(): Promise<void> {
        for (const s of this.sockets) s.destroy();
        await new Promise<void>(resolve => (this.server ? this.server.close(() => resolve()) : resolve()));
        this.server = null;
    }
}

async function expectCode(p: Promise<unknown>, code: string, extra?: Record<string, unknown>): Promise<EdgePortError> {
    let caught: unknown;
    try {
        await p;
    } catch (err) {
        caught = err;
    }
    expect(isEdgePortError(caught)).toBe(true);
    expect((caught as EdgePortError).code).toBe(code);
    if (extra) expect((caught as EdgePortError).extra).toMatchObject(extra);
    return caught as EdgePortError;
}

describe('EdgeKernel — transmitter settings, guard and actions (D34, DR13)', () => {
    let h: Harness;
    const SES = 'ses-tx-1';

    beforeEach(async () => {
        h = harness();
        h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
    });
    afterEach(async () => {
        await h.close();
    });

    it('first run: listen mode, no settings, the box address on the transmitter network, Test only offered', () => {
        const st = h.kernel.transmitterState();
        expect(st).toMatchObject({ stateVersion: 0, settings: null, applied: null, link: { state: 'waiting', mode: 'listen' }, listen: { boxTransmitterAddress: '127.0.0.1' } });
        expect(st.listen.port).toBe(h.kernel.listenAddress()!.port);
        expect(st.actions).toEqual({ connect: false, testOnly: true, reconnect: false });
        expect(st.sessions).toEqual([expect.objectContaining({ nSesid: SES, sessionName: `Day 3 — ${SES}`, phase: 'not-started' })]);
    });

    it('apply checks the version first, then the fields (incl. S-D14), then the guard; audits, logs and publishes', async () => {
        await expectCode(h.kernel.applyTransmitter({ stateVersion: 7, settings: LISTEN, confirmInterrupt: false }, ACTOR), 'state_changed', { stateVersion: 0 });
        await expectCode(
            h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: null, host: '10.0.0', port: 70000, autoReconnect: true, receivingSesid: 'ghost' }, confirmInterrupt: false }, ACTOR),
            'invalid_settings',
            { fields: { protocol: 'required', host: 'ipv4', port: 'port-range', receivingSesid: 'unknown-session' } },
        );
        // A valid IPv4 outside the transmitter network (127.0.0.0/8 here) is refused as `ipv4` (S-D14).
        await expectCode(
            h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: 'bridge', host: '192.168.20.31', port: 8080, autoReconnect: true, receivingSesid: null }, confirmInterrupt: false }, ACTOR),
            'invalid_settings',
            { fields: { host: 'ipv4' } },
        );
        const st = await h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.9', port: 1, autoReconnect: false, receivingSesid: null }, confirmInterrupt: false }, ACTOR);
        expect(st.settings).toEqual({ mode: 'dial', protocol: 'bridge', host: '127.0.0.9', port: 1, autoReconnect: false, receivingSesid: null });
        expect(st.applied).toMatchObject({ by: ACTOR });
        expect(st.stateVersion).toBeGreaterThan(0);
        expect(h.kernel.listenAddress()).toBeNull(); // dial mode: no listener
        expect(st.link.mode).toBe('dial');
        expect(st.actions).toMatchObject({ connect: true, reconnect: true });
        expect(h.state.audit.list({ limit: 10 })[0]).toMatchObject({ action: 'transmitter-apply', outcome: 'ok', actor: ACTOR });
        expect(h.state.connectivityLog.page({}, today()).rows.map(r => r.code)).toContain('tx-settings-applied');
        expect(h.events.of('transmitter-changed').length).toBeGreaterThan(0);
        // Back to listen mode: the listener binds again.
        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: false }, ACTOR);
        expect(h.kernel.listenAddress()).not.toBeNull();
    });

    it('asks for the guard while a feed is live and re-checks the version on confirm', async () => {
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await c.send(bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 4);
        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: false }, ACTOR); // first save: nothing to interrupt
        const v = h.state.transmitter.version();
        const dial: TransmitterSettings = { mode: 'dial', protocol: 'bridge', host: '127.0.0.9', port: 1, autoReconnect: true, receivingSesid: null };
        const err = await expectCode(h.kernel.applyTransmitter({ stateVersion: v, settings: dial, confirmInterrupt: false }, ACTOR), 'confirm_required');
        const guard = (err.extra as { guard: Record<string, unknown> }).guard;
        expect(guard).toMatchObject({ changes: ['mode'], stateVersion: v, now: LISTEN, after: dial, session: { nSesid: SES, sessionName: `Day 3 — ${SES}` } });
        expect(guard.peer).toMatch(/^127\.0\.0\.1:/);
        // The connection changes while the guard is open: the confirm is refused with the new version.
        await c.end();
        await waitFor(() => h.state.transmitter.version() > v);
        await expectCode(h.kernel.applyTransmitter({ stateVersion: v, settings: dial, confirmInterrupt: true }, ACTOR), 'state_changed', { stateVersion: h.state.transmitter.version() });
        // Reconnected again; confirming with the current version applies and closes the interrupted connection.
        const c2 = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await waitFor(() => h.kernel.session(SES)!.catConnected);
        const st = await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: dial, confirmInterrupt: true }, ACTOR);
        expect(st.settings!.mode).toBe('dial');
        await c2.closed;
        await waitFor(() => !h.kernel.session(SES)!.catConnected);
        await h.kernel.settled();
        const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
        const closes = j.records.filter(r => r.type === RecordType.CONN_CLOSE).map(r => JSON.parse(r.payload.toString()).reason);
        expect(closes[closes.length - 1]).toBe('settings-changed');
    });

    it('Connect / Reconnect errors in contract order', async () => {
        await expectCode(h.kernel.connectTransmitter(99, ACTOR), 'state_changed');
        await expectCode(h.kernel.connectTransmitter(0, ACTOR), 'not_dial_mode');
        await expectCode(h.kernel.reconnectTransmitter(0, ACTOR), 'not_dial_mode');
        await h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null }, confirmInterrupt: false }, ACTOR).catch(() => undefined);
        // An incomplete dial setting is invalid; store a complete one then check not_configured via a raw stored record.
        h.state.transmitter.save({ mode: 'dial', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null }, { atMs: Date.now(), by: ACTOR });
        await expectCode(h.kernel.connectTransmitter(h.state.transmitter.version(), ACTOR), 'not_configured');
        expect(h.kernel.transmitterLink().state).toBe('not-set-up');
    });

    it('Test only: data / protocol mismatch / connected-no-data / refused, never feeds a session, refused while busy', async () => {
        const servers: net.Server[] = [];
        const serve = async (onConn: (s: net.Socket) => void): Promise<number> => {
            const s = net.createServer(onConn);
            servers.push(s);
            await new Promise<void>(r => s.listen(0, '127.0.0.1', () => r()));
            return (s.address() as net.AddressInfo).port;
        };
        try {
            // Eclipse connects mid-page: the Bridge stream starts with text (the old first-byte rule called it CaseView)
            const bridgePort = await serve(s => s.write(Buffer.concat([Buffer.from(' the witness', 'latin1'), bridgeLines(0, 2)])));
            // CaseView ends lines with 0xF9 + 4 hex digits + 0xFA
            const marker = (n: number) => Buffer.from([0xf9, ...Buffer.from(String(n).padStart(4, '0'), 'latin1'), 0xfa]);
            const caseviewPort = await serve(s => s.write(Buffer.concat([Buffer.from('caseview line one', 'latin1'), marker(1), Buffer.from('line two', 'latin1'), marker(2)])));
            // bytes with neither framing, then the transmitter hangs up: data, but the protocol is unknown (never a mismatch)
            const unclearPort = await serve(s => s.end(Buffer.from('plain text, no framing')));
            const silentPort = await serve(() => undefined);
            const closed = await serve(() => undefined);
            await new Promise<void>(r => servers.pop()!.close(() => r())); // nothing listens there now

            expect(await h.kernel.testTransmitter({ protocol: 'bridge', host: '127.0.0.1', port: bridgePort }, ACTOR)).toMatchObject({ result: 'data', protocolSeen: 'bridge' });
            expect(await h.kernel.testTransmitter({ protocol: 'bridge', host: '127.0.0.1', port: caseviewPort }, ACTOR)).toMatchObject({ result: 'protocol-mismatch', protocolSeen: 'caseview' });
            expect(await h.kernel.testTransmitter({ protocol: 'caseview', host: '127.0.0.1', port: unclearPort }, ACTOR)).toMatchObject({ result: 'data', protocolSeen: null, bytes: 22 });
            const silent = await new Promise<number>(resolve => resolve(silentPort));
            const h2res = await (async () => {
                const k = harness({ kernel: { testWindowMs: 300 } });
                try {
                    await k.kernel.start();
                    return await k.kernel.testTransmitter({ protocol: 'caseview', host: '127.0.0.1', port: silent }, ACTOR);
                } finally {
                    await k.close();
                }
            })();
            expect(h2res).toMatchObject({ result: 'connected-no-data', protocolSeen: null, bytes: 0 });
            expect(await h.kernel.testTransmitter({ protocol: 'bridge', host: '127.0.0.1', port: closed }, ACTOR)).toMatchObject({ result: 'refused' });
            await expectCode(h.kernel.testTransmitter({ protocol: 'bridge', host: '192.168.20.31', port: 8080 }, ACTOR), 'invalid_settings', { fields: { host: 'ipv4' } });
            await expectCode(h.kernel.testTransmitter({ protocol: 'bridge', host: 'nope', port: 0 }, ACTOR), 'invalid_settings');
            expect(h.kernel.currentCut(SES)).toBeNull(); // nothing reached the session
            expect(h.state.connectivityLog.page({}, today()).rows.filter(r => r.code === 'tx-test').length).toBe(4);
            expect(h.state.audit.list({ limit: 20 }).filter(a => a.action === 'transmitter-test').length).toBeGreaterThanOrEqual(4);

            // Busy: an Eclipse connection is live → refused with the link state.
            const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
            await waitFor(() => h.kernel.session(SES)!.catConnected);
            expect(h.kernel.transmitterState().actions.testOnly).toBe(false);
            await expectCode(h.kernel.testTransmitter({ protocol: 'bridge', host: '127.0.0.1', port: bridgePort }, ACTOR), 'test_refused_busy', { linkState: 'connected-no-session' });
            await c.end();
        } finally {
            for (const s of servers) await new Promise<void>(r => s.close(() => r()));
        }
    });
});

describe('EdgeKernel — dial mode against a loopback transmitter (D34)', () => {
    it('dials the receiving session, journals CONN_OPEN without a user, reconnects after a transmitter restart with collapsed retries', async () => {
        const tx = new LoopbackTransmitter();
        const port = await tx.start();
        const h = harness();
        const SES = 'ses-dial-1';
        try {
            h.state.sessions.upsertAssignment(sessionAssignment(SES, { route: null }), Date.now());
            await h.kernel.start();
            await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
            const st = await h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.1', port, autoReconnect: true, receivingSesid: null }, confirmInterrupt: false }, ACTOR);
            expect(st.settings!.mode).toBe('dial');
            await waitFor(() => tx.sockets.size === 1, 10_000, 'box dialed in');
            await waitFor(() => h.kernel.session(SES)!.catConnected);
            expect(h.kernel.transmitterLink()).toMatchObject({ state: 'connected-no-session', mode: 'dial', receivingSesid: SES, protocol: 'bridge' });
            tx.send(10);
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 11);
            expect(h.kernel.transmitterLink()).toMatchObject({ state: 'live', receivingSesid: SES });
            expect(h.kernel.session(SES)).toMatchObject({ mode: 'dial', protocol: 'B', feed: 'live' });

            // The transmitter reboots: refused while down (retries collapse into one row), then the box reconnects.
            const versionBeforeDrop = h.state.transmitter.version();
            await tx.stop();
            await waitFor(() => h.events.of('feed-stopped').length === 1, 10_000, 'feed stopped');
            await waitFor(() => (h.state.connectivityLog.page({}, today()).rows.find(r => r.event === 'retrying')?.retry?.tries ?? 0) >= 3, 10_000, 'collapsed retries');
            expect(h.kernel.transmitterLink().state).toBe('connecting');
            await tx.start(port);
            await waitFor(() => tx.sockets.size === 1, 10_000, 'redialed');
            await waitFor(() => h.events.of('feed-resumed').length === 1, 10_000, 'feed resumed');
            tx.send(5);
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 16);
            expect(h.state.transmitter.version()).toBeGreaterThan(versionBeforeDrop);

            const log = h.state.connectivityLog.page({}, today()).rows;
            const retry = log.find(r => r.event === 'retrying')!;
            expect(retry).toMatchObject({ code: 'tx-refused', retry: { active: false }, problem: true });
            expect(log.filter(r => r.code === 'tx-connected')).toHaveLength(2);
            expect(log.some(r => r.code === 'tx-peer-closed' && r.problem)).toBe(true);
            const tries = h.state.connectivityLog.tries(retry.id, null, 50)!;
            expect(tries.rows.length).toBe(retry.retry!.tries);

            await h.kernel.settled();
            const j = await readJournal({ root: h.config.paths.journalDir, nSesid: SES, repair: false });
            const opens = j.records.filter(r => r.type === RecordType.CONN_OPEN).map(r => JSON.parse(r.payload.toString()));
            expect(opens).toHaveLength(2);
            for (const o of opens) {
                expect(o.mode).toBe('dial');
                expect(o.user).toBeUndefined(); // dial mode has no login
            }
            expect(j.records.filter(r => r.type === RecordType.CONN_CLOSE).length).toBeGreaterThanOrEqual(1);

            // Reconnect only while the link is down; Connect only while not connected.
            await expectCode(h.kernel.reconnectTransmitter(h.state.transmitter.version(), ACTOR), 'link_up');
            await expectCode(h.kernel.connectTransmitter(h.state.transmitter.version(), ACTOR), 'already_connected');
            await expectCode(h.kernel.testTransmitter({ protocol: 'bridge', host: '127.0.0.1', port }, ACTOR), 'test_refused_busy');
        } finally {
            await h.close();
            await tx.stop();
        }
    });

    it('auto-reconnect off: waits for Connect, then Reconnect redials after a drop', async () => {
        const tx = new LoopbackTransmitter();
        const port = await tx.start();
        const h = harness();
        const SES = 'ses-dial-2';
        try {
            h.state.sessions.upsertAssignment(sessionAssignment(SES), Date.now());
            await h.kernel.start();
            await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
            await h.kernel.applyTransmitter({ stateVersion: 0, settings: { mode: 'dial', protocol: 'bridge', host: '127.0.0.1', port, autoReconnect: false, receivingSesid: SES }, confirmInterrupt: false }, ACTOR);
            await sleep(200);
            expect(tx.sockets.size).toBe(0);
            expect(h.kernel.transmitterLink().state).toBe('waiting');
            const st = await h.kernel.connectTransmitter(h.state.transmitter.version(), ACTOR);
            expect(st.stateVersion).toBe(h.state.transmitter.version());
            await waitFor(() => tx.sockets.size === 1);
            tx.send(3);
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 4);
            for (const s of tx.sockets) s.destroy();
            await waitFor(() => !h.kernel.session(SES)!.catConnected);
            await sleep(250);
            expect(tx.sockets.size).toBe(0); // no auto-reconnect
            expect(h.kernel.transmitterLink().state).toBe('disconnected');
            await h.kernel.reconnectTransmitter(h.state.transmitter.version(), ACTOR);
            await waitFor(() => tx.sockets.size === 1);
            expect(h.state.audit.list({ limit: 10 }).map(a => a.action)).toEqual(expect.arrayContaining(['transmitter-connect', 'transmitter-reconnect', 'transmitter-apply']));
        } finally {
            await h.close();
            await tx.stop();
        }
    });
});

function today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
