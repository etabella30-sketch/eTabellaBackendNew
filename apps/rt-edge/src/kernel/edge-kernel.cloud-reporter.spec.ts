import * as net from 'net';

import type { EdgeActor, TransmitterSettings } from '../contracts';
import type { BoxSessionAssignment } from '../ports';
import { bridgeLines, eclipse, Harness, harness, sessionAssignment, sleep, waitFor } from './testing/kernel-harness';

jest.setTimeout(90_000);

const PERSON: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };
const CLOUD: EdgeActor = { nUserid: null, name: 'etabella.net (session settings)', via: 'online', operatorName: null };
const LISTEN: TransmitterSettings = { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };

/** The reporter's machine: Eclipse set to "Wait for connection", streaming Bridge lines to whoever connects. */
class ReporterMachine {
    server: net.Server | null = null;
    port = 0;
    readonly sockets = new Set<net.Socket>();
    next = 0;

    async start(): Promise<number> {
        this.server = net.createServer(sock => {
            this.sockets.add(sock);
            sock.on('error', () => undefined);
            sock.on('close', () => this.sockets.delete(sock));
        });
        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(0, '127.0.0.1', () => resolve());
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

/** A venue session whose reporter address was typed on etabella.net (Bridge, on the loopback "transmitter network"). */
function venueSession(nSesid: string, port: number, extra: Partial<BoxSessionAssignment> = {}): BoxSessionAssignment {
    return sessionAssignment(nSesid, { protocol: 'B', reporter: { host: '127.0.0.1', port }, ...extra });
}

const dialTo = (nSesid: string, port: number, host = '127.0.0.1'): TransmitterSettings => ({ mode: 'dial', protocol: 'bridge', host, port, autoReconnect: true, receivingSesid: nSesid });
const settingsOf = (h: Harness): TransmitterSettings | null => h.state.transmitter.get().settings;
const cloudApplies = (h: Harness) => h.state.audit.list({ limit: 200 }).filter(a => a.action === 'transmitter-apply' && a.actor?.name === CLOUD.name);
const refusals = (h: Harness) => h.events.of('alert').filter(a => a.kind === 'CLOUD_REPORTER_REFUSED');
/** The kernel armed the session in THIS run (the stored `localState` alone may be left from the run before). */
const armed = (h: Harness, nSesid: string): Promise<void> => waitFor(() => h.events.of('session-armed').some(e => e.nSesid === nSesid), 15_000, `${nSesid} armed`);
/** The same assignments arrive again (the box pulls them every minute). */
const pullAgain = (h: Harness, a: BoxSessionAssignment): void => h.assign(a);
/** A wall-clock start `ms` from now in `tz` ("YYYY-MM-DD HH:mm:ss"), so no case depends on today's date. */
function startIn(ms: number, tz = 'Europe/London'): string {
    const opts: Intl.DateTimeFormatOptions = { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' };
    return new Intl.DateTimeFormat('sv-SE', opts).format(new Date(Date.now() + ms));
}
const HOUR = 3_600_000;

describe('EdgeKernel — the reporter connection set on etabella.net (cloud reporter settings)', () => {
    let h: Harness;
    let reporter: ReporterMachine;
    let port: number;

    beforeEach(async () => {
        reporter = new ReporterMachine();
        port = await reporter.start();
    });
    afterEach(async () => {
        await h?.close();
        await reporter.stop();
    });

    it('a session without a reporter changes nothing: listen mode, no settings, no audit row', async () => {
        h = harness();
        const plain = sessionAssignment('ses-plain', { protocol: 'B' });
        h.state.sessions.upsertAssignment(plain, Date.now());
        await h.kernel.start();
        await armed(h, 'ses-plain');
        pullAgain(h, plain);
        h.assign(sessionAssignment('ses-plain-2'));
        await armed(h, 'ses-plain-2');
        expect(h.kernel.cloudReporterStatus()).toBeNull();
        expect(h.state.transmitter.get()).toEqual({ settings: null, applied: null });
        expect(h.state.transmitter.cloudReporter()).toBeNull();
        expect(h.kernel.listenAddress()).not.toBeNull();
        expect(h.state.audit.list({ limit: 50 }).filter(a => a.action === 'transmitter-apply')).toEqual([]);
        expect(refusals(h)).toEqual([]);
    });

    it('applies it by itself through the normal apply: dial mode, the box connects and lines arrive; audited, logged, versioned, remembered', async () => {
        h = harness();
        const SES = 'ses-venue-1';
        await h.kernel.start();
        expect(h.kernel.listenAddress()).not.toBeNull();
        const versionBefore = h.state.transmitter.version();
        h.assign(venueSession(SES, port, { route: null }));
        await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the reporter');
        await waitFor(() => h.kernel.session(SES)!.catConnected);

        expect(h.state.transmitter.get()).toMatchObject({ settings: dialTo(SES, port), applied: { by: CLOUD } });
        expect(h.state.transmitter.cloudReporter()).toBe(`${SES}|127.0.0.1|${port}|bridge`);
        expect(h.state.transmitter.version()).toBeGreaterThan(versionBefore);
        expect(h.kernel.listenAddress()).toBeNull(); // dial mode: no listener
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'applied', reason: null });
        expect(h.kernel.transmitterState()).toMatchObject({ settings: dialTo(SES, port), link: { mode: 'dial', receivingSesid: SES } });

        reporter.send(5);
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 5);
        expect(h.kernel.session(SES)).toMatchObject({ mode: 'dial', protocol: 'B', feed: 'live' });

        await waitFor(() => cloudApplies(h).length === 1);
        expect(cloudApplies(h)[0]).toMatchObject({ outcome: 'ok', actor: CLOUD, nSesid: SES, data: { mode: 'dial' } });
        const row = h.state.connectivityLog.page({}, today()).rows.find(r => r.code === 'tx-settings-applied')!;
        expect(row).toMatchObject({ source: 'transmitter', problem: false, nSesid: SES, peer: `127.0.0.1:${port}`, actor: CLOUD, data: { protocol: 'bridge' } });
        expect(h.events.of('transmitter-changed').length).toBeGreaterThan(0);
        expect(refusals(h)).toEqual([]);

        // The same assignments again and again: nothing is applied twice.
        const versionAfter = h.state.transmitter.version();
        pullAgain(h, h.state.sessions.get(SES)!);
        pullAgain(h, h.state.sessions.get(SES)!);
        await sleep(150);
        expect(cloudApplies(h)).toHaveLength(1);
        expect(h.state.transmitter.version()).toBe(versionAfter);
        expect(reporter.sockets.size).toBe(1);
    });

    it('applies it at boot too, for a CaseView session (C → caseview)', async () => {
        h = harness();
        const SES = 'ses-venue-cv';
        h.state.sessions.upsertAssignment(venueSession(SES, port, { protocol: 'C' }), Date.now());
        await h.kernel.start();
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual({ ...dialTo(SES, port), protocol: 'caseview' });
        expect(h.state.transmitter.cloudReporter()).toBe(`${SES}|127.0.0.1|${port}|caseview`);
    });

    it('follows only an armed, listed, not deleted, not ended session with a pinned protocol', async () => {
        h = harness();
        await h.kernel.start();
        // Deleted in the cloud: still armed (it is drained and sealed), never followed.
        h.assign(venueSession('ses-deleted', port, { deleted: true }));
        await armed(h, 'ses-deleted');
        // Ended in the cloud before it ever reached the box.
        h.assign(venueSession('ses-ended', port, { cloudOp: 'end' }));
        await waitFor(() => h.kernel.endResult('ses-ended') !== null, 15_000, 'ses-ended ended');
        expect(h.kernel.cloudReporterStatus()).toBeNull();
        expect(settingsOf(h)).toBeNull();

        // No protocol pinned: a dialed link needs one, so the box says why and leaves the connection alone.
        const noProtocol = venueSession('ses-no-protocol', port, { protocol: null });
        h.assign(noProtocol);
        await armed(h, 'ses-no-protocol');
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: 'ses-no-protocol', host: '127.0.0.1', port, state: 'refused', reason: 'protocol-unknown' });
        pullAgain(h, noProtocol);
        expect(settingsOf(h)).toBeNull();
        expect(refusals(h)).toHaveLength(1);
        expect(refusals(h)[0]).toMatchObject({ source: 'ingest', tier: 'P2', nSesid: 'ses-no-protocol', data: { reason: 'protocol-unknown' } });
        expect(reporter.sockets.size).toBe(0);

        // A usable session that is due after it owns the transmitter and is followed.
        h.assign(venueSession('ses-ok', port, { dStartDt: startIn(-HOUR) }));
        await waitFor(() => settingsOf(h)?.receivingSesid === 'ses-ok');
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: 'ses-ok', state: 'applied' });
    });

    it('owner: the session whose connection is up, else the one started and still active, else by start time', async () => {
        // Dial mode is off on this box, so nothing is applied and the status names the session that owns the transmitter.
        h = harness({ config: { features: { transmitterDialMode: false } } });
        await h.kernel.start();
        const owner = (): string | null => h.kernel.cloudReporterStatus()?.nSesid ?? null;

        h.assign(venueSession('ses-nostart', port, { dStartDt: null }));
        await armed(h, 'ses-nostart');
        expect(owner()).toBe('ses-nostart'); // the only one
        // Nothing is due yet: the one that starts first (no start last, then the id).
        h.assign(venueSession('ses-afternoon', port, { dStartDt: startIn(5 * HOUR) }));
        await armed(h, 'ses-afternoon');
        expect(owner()).toBe('ses-afternoon');
        h.assign(venueSession('ses-morning-b', port, { dStartDt: startIn(2 * HOUR) }));
        h.assign(venueSession('ses-morning-a', port, { dStartDt: h.state.sessions.get('ses-morning-b')!.dStartDt }));
        await armed(h, 'ses-morning-a');
        await armed(h, 'ses-morning-b');
        expect(owner()).toBe('ses-morning-a');
        // One hour from now, written as Kolkata wall-clock time: starts compare as instants, not as text.
        h.assign(venueSession('ses-kolkata', port, { dStartDt: startIn(HOUR, 'Asia/Kolkata'), tz: 'Asia/Kolkata' }));
        await armed(h, 'ses-kolkata');
        expect(owner()).toBe('ses-kolkata');
        // Sessions whose start time has passed: the LATEST of them (yesterday's leftovers do not block today's).
        h.assign(venueSession('ses-due-old', port, { dStartDt: startIn(-30 * HOUR) }));
        h.assign(venueSession('ses-due-now', port, { dStartDt: startIn(-HOUR) }));
        await armed(h, 'ses-due-old');
        await armed(h, 'ses-due-now');
        expect(owner()).toBe('ses-due-now');

        // The afternoon session's reporter logs in: its connection is up, so it owns the transmitter even before a line.
        const c = await eclipse(h.kernel.listenAddress()!.port, 'eclipse-ses-afternoon', 'pw-ses-afternoon');
        await waitFor(() => h.kernel.session('ses-afternoon')!.catConnected);
        expect(owner()).toBe('ses-afternoon');
        await c.send(bridgeLines(0, 3));
        await waitFor(() => h.kernel.session('ses-afternoon')!.firstLineAtMs !== null);
        expect(owner()).toBe('ses-afternoon');
        // Its link drops mid-hearing: it has started and is still active, so it stays the owner.
        await c.end();
        await waitFor(() => !h.kernel.session('ses-afternoon')!.catConnected);
        expect(owner()).toBe('ses-afternoon');
        expect(settingsOf(h)).toBeNull();
    });

    it('does not re-apply after a local override, also across a restart; a new value from the cloud is applied again', async () => {
        const first = harness({ keepDir: true });
        h = first;
        const SES = 'ses-override';
        const assignment = venueSession(SES, port);
        h.state.sessions.upsertAssignment(assignment, Date.now());
        await h.kernel.start();
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        await waitFor(() => cloudApplies(h).length === 1);

        // A person at the box prefers the reporter to connect to the box.
        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: true }, PERSON);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'overridden', reason: null });
        pullAgain(h, assignment);
        pullAgain(h, assignment);
        await sleep(150);
        expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });
        expect(cloudApplies(h)).toHaveLength(1);
        expect(h.kernel.listenAddress()).not.toBeNull();

        // The box restarts: the override is still theirs.
        await h.kernel.close();
        await h.state.close();
        await waitFor(() => reporter.sockets.size === 0);
        h = harness({ dir: first.dir });
        await h.kernel.start();
        await armed(h, SES);
        pullAgain(h, h.state.sessions.get(SES)!);
        await sleep(150);
        expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });
        expect(cloudApplies(h)).toHaveLength(1);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: SES, state: 'overridden' });

        // The admin changes the port on etabella.net: a new value, applied once.
        const other = new ReporterMachine();
        const otherPort = await other.start();
        try {
            h.assign({ ...assignment, reporter: { host: '127.0.0.1', port: otherPort } });
            await waitFor(() => settingsOf(h)?.port === otherPort);
            await waitFor(() => other.sockets.size === 1, 10_000, 'the box dialed the new address');
            expect(settingsOf(h)).toEqual(dialTo(SES, otherPort));
            await waitFor(() => cloudApplies(h).length === 2);
            expect(h.kernel.cloudReporterStatus()).toMatchObject({ state: 'applied', port: otherPort });
        } finally {
            await h.close();
            await other.stop();
        }
    });

    it('after a restart the applied connection simply stays: not applied again, not dropped while the session re-arms', async () => {
        const first = harness({ keepDir: true });
        h = first;
        const SES = 'ses-restart';
        h.state.sessions.upsertAssignment(venueSession(SES, port), Date.now());
        await h.kernel.start();
        await waitFor(() => cloudApplies(h).length === 1);
        const applied = h.state.transmitter.get();
        await h.kernel.close();
        await h.state.close();
        await waitFor(() => reporter.sockets.size === 0);

        h = harness({ dir: first.dir });
        await h.kernel.start();
        await armed(h, SES);
        await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed again after the restart');
        expect(h.state.transmitter.get()).toEqual(applied);
        expect(h.state.audit.list({ limit: 50 }).filter(a => a.action === 'transmitter-apply')).toHaveLength(1);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: SES, state: 'applied' });
    });

    it("does not cut a live feed: waits while the reporter's Eclipse feeds the session in listen mode, applies when that link drops", async () => {
        h = harness();
        const SES = 'ses-live-listen';
        const assignment = sessionAssignment(SES, { protocol: 'B' });
        h.state.sessions.upsertAssignment(assignment, Date.now());
        await h.kernel.start();
        await armed(h, SES);
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await c.send(bridgeLines(0, 3));
        await waitFor(() => h.kernel.session(SES)!.firstLineAtMs !== null);

        // The admin now types the reporter address for the session that is already receiving lines.
        h.assign({ ...assignment, reporter: { host: '127.0.0.1', port } });
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'waiting', reason: 'feed-live' });
        pullAgain(h, h.state.sessions.get(SES)!);
        await c.send(bridgeLines(3, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 6);
        expect(h.kernel.session(SES)!.catConnected).toBe(true);
        expect(settingsOf(h)).toBeNull();
        expect(cloudApplies(h)).toEqual([]);
        expect(reporter.sockets.size).toBe(0);

        // The reporter's Eclipse disconnects: now the box connects to the address from etabella.net.
        await c.end();
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the reporter');
        expect(settingsOf(h)).toEqual(dialTo(SES, port));
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ state: 'applied' });
    });

    it('does not cut the feed of ANOTHER session: applies when that session ends', async () => {
        h = harness();
        const LIVE = 'ses-live-other';
        const NEXT = 'ses-next';
        h.state.sessions.upsertAssignment(sessionAssignment(LIVE, { dStartDt: '2026-10-01 09:00:00' }), Date.now());
        await h.kernel.start();
        await armed(h, LIVE);
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${LIVE}`, `pw-${LIVE}`);
        await c.send(bridgeLines(0, 3));
        await waitFor(() => h.kernel.session(LIVE)!.firstLineAtMs !== null);

        h.assign(venueSession(NEXT, port, { dStartDt: '2026-10-01 14:00:00' }));
        await armed(h, NEXT);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: NEXT, host: '127.0.0.1', port, state: 'waiting', reason: 'held-by-session', heldBy: LIVE });
        await c.send(bridgeLines(3, 3));
        await waitFor(() => (h.kernel.currentCut(LIVE)?.totalLines ?? 0) >= 6);
        expect(settingsOf(h)).toBeNull();
        expect(h.kernel.session(LIVE)!.catConnected).toBe(true);

        // The live session's link drops for a moment (a network blip): the box is NOT handed to the next session.
        await c.end();
        await waitFor(() => !h.kernel.session(LIVE)!.catConnected);
        pullAgain(h, h.state.sessions.get(NEXT)!);
        await sleep(400); // several owner re-checks
        expect(settingsOf(h)).toBeNull();
        expect(cloudApplies(h)).toEqual([]);
        expect(reporter.sockets.size).toBe(0);
        expect(h.kernel.listenAddress()).not.toBeNull();
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: NEXT, state: 'waiting', reason: 'held-by-session', heldBy: LIVE });
        // Its reporter's Eclipse reconnects and carries on.
        const again = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${LIVE}`, `pw-${LIVE}`);
        await again.send(bridgeLines(6, 3));
        await waitFor(() => (h.kernel.currentCut(LIVE)?.totalLines ?? 0) >= 9);

        await h.kernel.requestEnd(LIVE, 'spec');
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(NEXT, port));
        await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the next reporter');
        expect((await h.kernel.requestEnd(LIVE, 'spec')).totalLines).toBeGreaterThanOrEqual(9); // nothing of the live session was lost
        await again.end();
    });

    it('a session whose reporter connects TO the box keeps the listener while it owns the transmitter, even before its first line', async () => {
        h = harness();
        const FIRST = 'ses-first-listen';
        const LATER = 'ses-later-dial';
        // Both assigned the day before: the morning one has no reporter address, the afternoon one has.
        h.state.sessions.upsertAssignment(sessionAssignment(FIRST, { protocol: 'B', dStartDt: startIn(HOUR) }), Date.now());
        h.state.sessions.upsertAssignment(venueSession(LATER, port, { dStartDt: startIn(5 * HOUR) }), Date.now());
        await h.kernel.start();
        await armed(h, FIRST);
        await armed(h, LATER);
        pullAgain(h, h.state.sessions.get(LATER)!);
        await sleep(300);
        expect(settingsOf(h)).toBeNull();
        expect(h.kernel.listenAddress()).not.toBeNull();
        expect(reporter.sockets.size).toBe(0);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: LATER, host: '127.0.0.1', port, state: 'waiting', reason: 'held-by-session', heldBy: FIRST });

        // The morning reporter's Eclipse logs in and waits: connected, no line yet. Its connection is not closed.
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${FIRST}`, `pw-${FIRST}`);
        await waitFor(() => h.kernel.session(FIRST)!.catConnected);
        pullAgain(h, h.state.sessions.get(LATER)!);
        await sleep(300);
        expect(h.kernel.session(FIRST)!.catConnected).toBe(true);
        expect(settingsOf(h)).toBeNull();
        await c.send(bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(FIRST)?.totalLines ?? 0) >= 3);

        // The morning session ends: now the afternoon session's reporter address is applied.
        await h.kernel.requestEnd(FIRST, 'spec');
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(LATER, port));
        expect(cloudApplies(h)).toHaveLength(1);
        await c.end();
    });

    it('nothing is applied before the owner itself is armed', async () => {
        h = harness();
        await h.kernel.start();
        const SES = 'ses-not-armed-yet';
        h.assign(venueSession(SES, port));
        // The assignment is stored and the session is being armed (asynchronous): the address waits for it.
        expect(h.kernel.session(SES)?.localState).not.toBe('armed');
        expect(settingsOf(h)).toBeNull();
        expect(cloudApplies(h)).toEqual([]);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'waiting', reason: null });
        await armed(h, SES);
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(SES, port));
    });

    it("a reporter's Eclipse that is logged in is not disconnected, even before its first line", async () => {
        h = harness();
        const SES = 'ses-logged-in';
        const assignment = sessionAssignment(SES, { protocol: 'B' });
        h.state.sessions.upsertAssignment(assignment, Date.now());
        await h.kernel.start();
        await armed(h, SES);
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await waitFor(() => h.kernel.session(SES)!.catConnected);

        // The admin types a reporter address for this session while its reporter is connected and waiting.
        h.assign({ ...assignment, reporter: { host: '127.0.0.1', port } });
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'waiting', reason: 'feed-live' });
        await sleep(300);
        expect(h.kernel.session(SES)!.catConnected).toBe(true);
        expect(settingsOf(h)).toBeNull();
        expect(reporter.sockets.size).toBe(0);
        // Lines still arrive over that login.
        await c.send(bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 3);
        await c.end();
    });

    it('time alone moves the owner: a session with a reporter address is applied when its start time passes', async () => {
        h = harness();
        const NOW = 'ses-now-listen';
        const SOON = 'ses-soon-dial';
        h.state.sessions.upsertAssignment(sessionAssignment(NOW, { protocol: 'B', dStartDt: startIn(-HOUR) }), Date.now());
        h.state.sessions.upsertAssignment(venueSession(SOON, port, { dStartDt: startIn(4_000) }), Date.now());
        await h.kernel.start();
        await armed(h, NOW);
        await armed(h, SOON);
        expect(settingsOf(h)).toBeNull();
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: SOON, state: 'waiting', reason: 'held-by-session', heldBy: NOW });
        // No assignment arrives, nothing connects: the tick alone applies it once SOON is due (the latest due session).
        await waitFor(() => settingsOf(h)?.mode === 'dial', 10_000, 'applied when it became due');
        expect(settingsOf(h)).toEqual(dialTo(SOON, port));
    });

    it('a started session nobody ended stops holding the transmitter after the hold time', async () => {
        h = harness({ kernel: { cloudReporterHoldMs: 3_000 } });
        const STALE = 'ses-never-ended';
        const NEXT = 'ses-after-it';
        h.state.sessions.upsertAssignment(sessionAssignment(STALE, { protocol: 'B', dStartDt: startIn(-3 * HOUR) }), Date.now());
        await h.kernel.start();
        await armed(h, STALE);
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${STALE}`, `pw-${STALE}`);
        await c.send(bridgeLines(0, 3));
        await waitFor(() => h.kernel.session(STALE)!.firstLineAtMs !== null);
        await c.end();
        await waitFor(() => !h.kernel.session(STALE)!.catConnected);

        h.assign(venueSession(NEXT, port, { dStartDt: startIn(-HOUR) }));
        await armed(h, NEXT);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: NEXT, state: 'waiting', reason: 'held-by-session', heldBy: STALE });
        expect(settingsOf(h)).toBeNull();
        // Idle for longer than the hold: the next session takes the transmitter without anyone ending the stale one.
        await waitFor(() => settingsOf(h)?.mode === 'dial', 10_000, 'the stale session released the transmitter');
        expect(settingsOf(h)).toEqual(dialTo(NEXT, port));
    });

    it('refused outside the reporter network: nothing applied, one alert however often the assignments arrive, and the reason is exposed', async () => {
        h = harness();
        const SES = 'ses-outside';
        const outside = sessionAssignment(SES, { protocol: 'B', reporter: { host: '192.168.1.20', port: 1337 } });
        h.state.sessions.upsertAssignment(outside, Date.now());
        await h.kernel.start();
        await armed(h, SES);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '192.168.1.20', port: 1337, state: 'refused', reason: 'outside-network' });
        for (let i = 0; i < 5; i++) pullAgain(h, outside);
        await sleep(100);
        expect(h.state.transmitter.get()).toEqual({ settings: null, applied: null });
        expect(h.state.transmitter.cloudReporter()).toBeNull();
        expect(h.kernel.listenAddress()).not.toBeNull();
        expect(cloudApplies(h)).toEqual([]);
        expect(refusals(h)).toHaveLength(1);
        expect(refusals(h)[0]).toMatchObject({ tier: 'P2', critical: false, nSesid: SES, data: { reason: 'outside-network', host: '192.168.1.20', port: 1337 } });
        expect(refusals(h)[0].message).toContain('127.0.0.0/8');

        // Corrected on etabella.net: applied.
        h.assign({ ...outside, reporter: { host: '127.0.0.1', port } });
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(SES, port));
        expect(refusals(h)).toHaveLength(1);
    });

    it('refused when connecting to the reporter is switched off on this box; the connection a person sets instead stays', async () => {
        h = harness({ config: { features: { transmitterDialMode: false } } });
        const SES = 'ses-dial-off';
        const assignment = venueSession(SES, port);
        h.state.sessions.upsertAssignment(assignment, Date.now());
        await h.kernel.start();
        await armed(h, SES);
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: '127.0.0.1', port, state: 'refused', reason: 'dial-mode-off' });
        pullAgain(h, assignment);
        pullAgain(h, assignment);
        expect(settingsOf(h)).toBeNull();
        expect(refusals(h)).toHaveLength(1);
        expect(refusals(h)[0].data).toMatchObject({ reason: 'dial-mode-off' });
        expect(reporter.sockets.size).toBe(0);

        // A person saves the connection at the box: from now on the value from the cloud counts as dealt with.
        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: false }, PERSON);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: SES, state: 'overridden', reason: null });
        pullAgain(h, assignment);
        expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });
    });

    it("a person's Apply while the cloud value still waits is not replaced by it when the link drops", async () => {
        h = harness();
        const SES = 'ses-apply-while-waiting';
        const assignment = sessionAssignment(SES, { protocol: 'B' });
        h.state.sessions.upsertAssignment(assignment, Date.now());
        await h.kernel.start();
        await armed(h, SES);
        const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${SES}`, `pw-${SES}`);
        await c.send(bridgeLines(0, 3));
        await waitFor(() => h.kernel.session(SES)!.firstLineAtMs !== null);
        h.assign({ ...assignment, reporter: { host: '127.0.0.1', port } });
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ state: 'waiting', reason: 'feed-live' });

        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: true }, PERSON);
        await c.end();
        await waitFor(() => !h.kernel.session(SES)!.catConnected);
        await sleep(150);
        expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });
        expect(cloudApplies(h)).toEqual([]);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ state: 'overridden' });
        expect(reporter.sockets.size).toBe(0);
    });

    it('with two venue sessions the earliest is followed, and the next one when it ends', async () => {
        h = harness();
        const other = new ReporterMachine();
        const otherPort = await other.start();
        try {
            h.state.sessions.upsertAssignment(venueSession('ses-pm', otherPort, { dStartDt: startIn(5 * HOUR) }), Date.now());
            h.state.sessions.upsertAssignment(venueSession('ses-am', port, { dStartDt: startIn(HOUR) }), Date.now());
            await h.kernel.start();
            await armed(h, 'ses-am');
            await armed(h, 'ses-pm');
            await waitFor(() => settingsOf(h)?.receivingSesid === 'ses-am');
            await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the morning reporter');
            expect(settingsOf(h)).toEqual(dialTo('ses-am', port));
            // Whichever of the two armed first, the afternoon reporter was never dialed and nothing was applied twice.
            await waitFor(() => cloudApplies(h).length === 1);
            await sleep(300);
            expect(cloudApplies(h)).toHaveLength(1);
            expect(other.sockets.size).toBe(0);

            await h.kernel.requestEnd('ses-am', 'spec');
            await waitFor(() => settingsOf(h)?.receivingSesid === 'ses-pm');
            await waitFor(() => other.sockets.size === 1, 10_000, 'the box dialed the afternoon reporter');
            expect(settingsOf(h)).toEqual(dialTo('ses-pm', otherPort));
            expect(h.state.transmitter.cloudReporter()).toBe(`ses-pm|127.0.0.1|${otherPort}|bridge`);
        } finally {
            await h.close();
            await other.stop();
        }
    });

    describe('going back to listen mode', () => {
        const SES = 'ses-back';
        let assignment: BoxSessionAssignment;

        async function applied(): Promise<void> {
            h = harness();
            assignment = venueSession(SES, port);
            h.state.sessions.upsertAssignment(assignment, Date.now());
            await h.kernel.start();
            await waitFor(() => cloudApplies(h).length === 1);
            await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the reporter');
        }

        async function backToListen(): Promise<void> {
            await waitFor(() => settingsOf(h)?.mode === 'listen', 15_000, 'listen mode restored');
            await waitFor(() => h.kernel.listenAddress() !== null, 15_000, 'the listener is bound again');
            expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: CLOUD } });
            expect(h.state.transmitter.cloudReporter()).toBeNull();
            expect(h.kernel.cloudReporterStatus()).toBeNull();
            await waitFor(() => cloudApplies(h).length === 2);
            expect(cloudApplies(h)[0]).toMatchObject({ outcome: 'ok', data: { mode: 'listen' } });
            await waitFor(() => reporter.sockets.size === 0, 10_000, 'the box hung up');
        }

        it('when the session ends', async () => {
            await applied();
            await h.kernel.requestEnd(SES, 'spec');
            await backToListen();
            // A later session whose reporter connects TO the box works.
            const LATER = 'ses-later';
            h.assign(sessionAssignment(LATER));
            await armed(h, LATER);
            const c = await eclipse(h.kernel.listenAddress()!.port, `eclipse-${LATER}`, `pw-${LATER}`);
            await c.send(bridgeLines(0, 3));
            await waitFor(() => (h.kernel.currentCut(LATER)?.totalLines ?? 0) >= 3);
            expect(h.kernel.session(LATER)!.mode).toBe('listen');
            await c.end();
        });

        it('when the cloud clears the reporter', async () => {
            await applied();
            h.assign({ ...assignment, reporter: null });
            await backToListen();
        });

        it('when the session is deleted in the cloud', async () => {
            await applied();
            h.assign({ ...assignment, deleted: true });
            await backToListen();
        });

        it('when the session leaves the assignments (unlisted)', async () => {
            await applied();
            const diff = h.state.assignments.replaceAll({ cases: [], sessions: [], roster: [], superAdmins: [], operatorCode: null }, Date.now());
            expect(diff.sessionsUnlisted).toEqual([SES]);
            h.events.bus.publish('assignments-changed', diff);
            await backToListen();
        });

        it('not when a person changed the connection at the box: their settings stay', async () => {
            await applied();
            const theirs: TransmitterSettings = { ...dialTo(SES, port), autoReconnect: false };
            await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: theirs, confirmInterrupt: true }, PERSON);
            await h.kernel.requestEnd(SES, 'spec');
            await sleep(200);
            expect(h.state.transmitter.get()).toMatchObject({ settings: theirs, applied: { by: PERSON } });
            expect(cloudApplies(h)).toHaveLength(1);
            expect(h.kernel.listenAddress()).toBeNull();
        });

        it("when the next session's address is refused: that session still gets the listener", async () => {
            await applied();
            // Outside the network: the box will not dial it, so this session's Eclipse has to connect to the box.
            h.assign(sessionAssignment('ses-other', { protocol: 'B', dStartDt: startIn(5 * HOUR), reporter: { host: '192.168.1.20', port: 1337 } }));
            await armed(h, 'ses-other');
            await sleep(200);
            expect(settingsOf(h)).toEqual(dialTo(SES, port)); // SES owns the transmitter (its connection is up)
            await h.kernel.requestEnd(SES, 'spec');
            await waitFor(() => settingsOf(h)?.mode === 'listen', 15_000, 'listen mode restored');
            await waitFor(() => h.kernel.listenAddress() !== null, 15_000, 'the listener is bound again');
            expect(h.state.transmitter.cloudReporter()).toBeNull();
            expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: 'ses-other', state: 'refused', reason: 'outside-network' });
            const c = await eclipse(h.kernel.listenAddress()!.port, 'eclipse-ses-other', 'pw-ses-other');
            await c.send(bridgeLines(0, 3));
            await waitFor(() => (h.kernel.currentCut('ses-other')?.totalLines ?? 0) >= 3);
            await c.end();
        });

        it('to the settings a person had set before the cloud value, not to the defaults', async () => {
            h = harness();
            await h.kernel.start();
            // The venue's own setup: this box dials its usual reporter machine, whatever the session.
            const usual = new ReporterMachine();
            const usualPort = await usual.start();
            try {
                const theirs: TransmitterSettings = { mode: 'dial', protocol: 'caseview', host: '127.0.0.1', port: usualPort, autoReconnect: true, receivingSesid: null };
                await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: theirs, confirmInterrupt: false }, PERSON);
                h.assign(venueSession(SES, port));
                await waitFor(() => settingsOf(h)?.receivingSesid === SES);
                expect(settingsOf(h)).toEqual(dialTo(SES, port));
                expect(h.state.transmitter.cloudReporterPrevious()).toEqual(theirs);

                await h.kernel.requestEnd(SES, 'spec');
                await waitFor(() => settingsOf(h)?.port === usualPort, 15_000, 'their settings returned');
                expect(settingsOf(h)).toEqual(theirs);
                expect(h.state.transmitter.cloudReporter()).toBeNull();
                expect(h.state.transmitter.cloudReporterPrevious()).toBeNull();
            } finally {
                await h.close();
                await usual.stop();
            }
        });

        it('never while a feed is live: waits for the link to drop', async () => {
            await applied();
            reporter.send(4);
            await waitFor(() => h.kernel.session(SES)!.firstLineAtMs !== null);
            h.assign({ ...assignment, reporter: null });
            reporter.send(4);
            await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) >= 8);
            await sleep(150);
            expect(settingsOf(h)).toEqual(dialTo(SES, port));
            expect(h.kernel.session(SES)!.catConnected).toBe(true);
            expect(cloudApplies(h)).toHaveLength(1);

            for (const s of reporter.sockets) s.destroy();
            await backToListen();
            expect(h.kernel.session(SES)!.totalLines).toBeGreaterThanOrEqual(8);
        });
    });

    it('after a restart the owner comes from the stored sessions, not from whichever session arms first', async () => {
        const first = harness({ keepDir: true });
        h = first;
        const other = new ReporterMachine();
        const otherPort = await other.start();
        try {
            h.state.sessions.upsertAssignment(venueSession('ses-am', port, { dStartDt: startIn(-2 * HOUR) }), Date.now());
            await h.kernel.start();
            await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the morning reporter');
            // The morning hearing is running: a long journal, so it is the slow one to arm after the restart.
            for (let i = 0; i < 20; i++) reporter.send(25);
            await waitFor(() => (h.kernel.currentCut('ses-am')?.totalLines ?? 0) >= 500, 30_000);
            h.assign(venueSession('ses-pm', otherPort, { dStartDt: startIn(3 * HOUR) }));
            await armed(h, 'ses-pm');
            await waitFor(() => cloudApplies(h).length === 1);
            const before = h.state.transmitter.get();
            await h.kernel.close();
            await h.state.close();
            await waitFor(() => reporter.sockets.size === 0);

            h = harness({ dir: first.dir });
            await h.kernel.start();
            await armed(h, 'ses-am');
            await armed(h, 'ses-pm');
            await waitFor(() => reporter.sockets.size === 1, 10_000, 'the box dialed the morning reporter again');
            await sleep(300);
            expect(h.state.transmitter.get()).toEqual(before);
            expect(cloudApplies(h)).toHaveLength(1);
            expect(other.sockets.size).toBe(0);
            expect(h.kernel.session('ses-pm')!.firstLineAtMs).toBeNull();
            expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: 'ses-am', state: 'applied' });
        } finally {
            await h.close();
            await other.stop();
        }
    });

    it("a person's own connection survives a restart with two sessions that carry a reporter address", async () => {
        const first = harness({ keepDir: true });
        h = first;
        const other = new ReporterMachine();
        const otherPort = await other.start();
        try {
            h.state.sessions.upsertAssignment(venueSession('ses-am', port, { dStartDt: startIn(-2 * HOUR) }), Date.now());
            h.state.sessions.upsertAssignment(venueSession('ses-pm', otherPort, { dStartDt: startIn(3 * HOUR) }), Date.now());
            await h.kernel.start();
            await armed(h, 'ses-am');
            await armed(h, 'ses-pm');
            await waitFor(() => cloudApplies(h).length === 1);
            await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: true }, PERSON);
            await h.kernel.close();
            await h.state.close();

            h = harness({ dir: first.dir });
            await h.kernel.start();
            await armed(h, 'ses-am');
            await armed(h, 'ses-pm');
            pullAgain(h, h.state.sessions.get('ses-pm')!);
            await sleep(400);
            expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });
            expect(cloudApplies(h)).toHaveLength(1);
            expect(reporter.sockets.size + other.sockets.size).toBe(0);
            expect(h.kernel.cloudReporterStatus()).toMatchObject({ nSesid: 'ses-am', state: 'overridden' });
        } finally {
            await h.close();
            await other.stop();
        }
    });

    it('the same address typed again on etabella.net after a local override counts as a new value', async () => {
        h = harness();
        await h.kernel.start();
        const SES = 'ses-retyped';
        const assignment = venueSession(SES, port);
        h.assign(assignment);
        await waitFor(() => cloudApplies(h).length === 1);
        await h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings: LISTEN, confirmInterrupt: true }, PERSON);
        expect(h.kernel.cloudReporterStatus()).toMatchObject({ state: 'overridden' });

        // The admin clears the reporter address: the remembered value is forgotten, the person's settings stay.
        h.assign({ ...assignment, reporter: null });
        await sleep(200);
        expect(h.state.transmitter.cloudReporter()).toBeNull();
        expect(h.state.transmitter.get()).toMatchObject({ settings: LISTEN, applied: { by: PERSON } });

        // ... and types the same address again: applied once more.
        h.assign(assignment);
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(SES, port));
        await waitFor(() => cloudApplies(h).length === 2);
    });

    it('never throws into the kernel: a state failure is logged and the sessions carry on', async () => {
        h = harness();
        await h.kernel.start();
        const repo = h.state.transmitter as unknown as { cloudReporter: () => string | null };
        const real = repo.cloudReporter;
        repo.cloudReporter = () => {
            throw new Error('disk I/O error');
        };
        const SES = 'ses-state-down';
        expect(() => h.assign(venueSession(SES, port))).not.toThrow();
        await armed(h, SES);
        expect(h.kernel.cloudReporterStatus()).toBeNull();
        expect(settingsOf(h)).toBeNull();
        // The database answers again: the next pull applies it.
        repo.cloudReporter = real;
        pullAgain(h, h.state.sessions.get(SES)!);
        await waitFor(() => settingsOf(h)?.mode === 'dial');
        expect(settingsOf(h)).toEqual(dialTo(SES, port));
    });
});

function today(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
