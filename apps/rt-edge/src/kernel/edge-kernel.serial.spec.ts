import { EventEmitter } from 'events';

import { SerialOpenOptions, SerialPortLike } from '@app/rt-ingest';

import type { EdgeActor, TransmitterSettings } from '../contracts';
import { EdgePortError, isEdgePortError } from '../ports';
import { bridgeLines, Harness, harness, sessionAssignment, sleep, waitFor } from './testing/kernel-harness';

jest.setTimeout(90_000);

const ACTOR: EdgeActor = { nUserid: 'u-admin', name: 'Priya Shah', via: 'online', operatorName: null };
const LISTEN: TransmitterSettings = { mode: 'listen', protocol: null, host: null, port: null, autoReconnect: true, receivingSesid: null };
const SERIAL: TransmitterSettings = { mode: 'serial', protocol: 'bridge', host: null, port: null, serialPath: 'COM3', baudRate: 9600, autoReconnect: true, receivingSesid: null };

/** A COM port as `serialport` behaves: opens asynchronously, emits data, closes. */
class FakePort extends EventEmitter implements SerialPortLike {
    isOpen = false;

    constructor(readonly path: string, readonly baudRate: number) {
        super();
    }

    close(callback?: (error?: Error | null) => void): void {
        if (!this.isOpen) {
            callback?.(new Error('Port is not open'));
            return;
        }
        this.isOpen = false;
        setImmediate(() => {
            this.emit('close', null);
            callback?.(null);
        });
    }
}

/** The box computer's COM ports: which exist, which another program holds, and what the CAT program writes. */
class FakeSerial {
    readonly present = new Set<string>(['COM3']);
    readonly held = new Set<string>();
    readonly ports: FakePort[] = [];

    readonly open = (o: SerialOpenOptions): SerialPortLike => {
        const p = new FakePort(o.path, o.baudRate);
        this.ports.push(p);
        setImmediate(() => {
            if (!this.present.has(o.path)) p.emit('error', new Error(`Opening ${o.path}: File not found`));
            else if (this.held.has(o.path)) p.emit('error', new Error(`Opening ${o.path}: Access denied`));
            else {
                p.isOpen = true;
                p.emit('open');
            }
        });
        return p;
    };

    openPort(path: string): FakePort | undefined {
        return [...this.ports].reverse().find(p => p.path === path && p.isOpen);
    }

    write(path: string, data: Buffer): void {
        this.openPort(path)?.emit('data', data);
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

const today = (): string => new Date().toISOString().slice(0, 10);

describe('EdgeKernel — "Live data · COM port" (serial mode)', () => {
    let h: Harness;
    let serial: FakeSerial;
    let listed: () => Promise<{ path: string; friendlyName: string | null; manufacturer: string | null }[]>;
    const SES = 'ses-com-1';

    const start = async (extra: Parameters<typeof sessionAssignment>[1] = {}) => {
        h = harness({
            kernel: {
                openSerialPort: serial.open,
                listSerialPorts: () => listed(),
                serialOpenTimeoutMs: 500,
                testWindowMs: 400,
            },
        });
        h.state.sessions.upsertAssignment(sessionAssignment(SES, extra), Date.now());
        await h.kernel.start();
        await waitFor(() => h.kernel.session(SES)?.localState === 'armed');
    };
    const apply = (settings: TransmitterSettings, confirmInterrupt = false) => h.kernel.applyTransmitter({ stateVersion: h.state.transmitter.version(), settings, confirmInterrupt }, ACTOR);
    const logCodes = () => h.state.connectivityLog.page({}, today()).rows.map(r => r.code);

    beforeEach(() => {
        serial = new FakeSerial();
        listed = async () => [
            { path: 'COM3', friendlyName: 'Prolific USB-to-Serial Comm Port (COM3)', manufacturer: 'Prolific' },
            { path: 'COM13', friendlyName: 'Eterlogic Virtual Serial Port (COM13)', manufacturer: 'Eterlogic Software' },
        ];
    });
    afterEach(async () => {
        await h?.close();
    });

    it('validates a COM port setting: protocol, a COM port name, a listed baud rate', async () => {
        await start();
        await expectCode(apply({ ...SERIAL, protocol: null, serialPath: 'LPT1', baudRate: 9601 }), 'invalid_settings', {
            fields: { protocol: 'required', serialPath: 'serial-path', baudRate: 'baud-rate' },
        });
        await expectCode(apply({ ...SERIAL, serialPath: null, baudRate: null }), 'invalid_settings', { fields: { serialPath: 'required', baudRate: 'required' } });
        expect(serial.ports).toHaveLength(0);
    });

    it('applied: the listener stops, the port opens at its baud rate and the lines reach the session', async () => {
        await start();
        const st = await apply({ ...SERIAL, serialPath: 'com3' });
        expect(st.settings).toEqual(SERIAL); // "com3" stored as "COM3"
        expect(h.kernel.listenAddress()).toBeNull();
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'COM3 open');
        expect(serial.openPort('COM3')!.baudRate).toBe(9600);
        await waitFor(() => h.kernel.transmitterLink().state === 'connected-no-session', 5_000, 'connected');
        expect(h.kernel.transmitterLink()).toMatchObject({ mode: 'serial', peer: 'COM3 @ 9600', receivingSesid: SES });

        serial.write('COM3', bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) > 0, 10_000, 'lines in the session');
        await waitFor(() => h.kernel.transmitterLink().state === 'live', 5_000, 'live');
        const view = h.kernel.session(SES)!;
        expect(view.mode).toBe('serial');
        expect(view.catConnected).toBe(true);
        expect(logCodes()).toEqual(expect.arrayContaining(['tx-settings-applied', 'tx-connected']));
        const connected = h.state.connectivityLog.page({}, today()).rows.find(r => r.code === 'tx-connected')!;
        expect(connected).toMatchObject({ peer: 'COM3 @ 9600', data: { serial: true, protocol: 'bridge' } });

        // Back to listen mode (the guard first: a feed is live): the port is closed and the listener binds again.
        await expectCode(apply(LISTEN), 'confirm_required');
        await apply(LISTEN, true);
        await waitFor(() => !serial.openPort('COM3'), 5_000, 'COM3 closed');
        expect(h.kernel.listenAddress()).not.toBeNull();
    });

    it('a missing port is retried in one collapsed row; plugging it in connects', async () => {
        serial.present.clear();
        await start();
        await apply(SERIAL);
        await waitFor(() => serial.ports.length >= 3, 5_000, 'three tries');
        // The port the box is trying is named while it is not open (user decision 2026-10-04).
        expect(h.kernel.transmitterLink()).toMatchObject({ state: 'connecting', mode: 'serial', peer: 'COM3 @ 9600' });
        const retry = h.state.connectivityLog.page({}, today()).rows.find(r => r.event === 'retrying')!;
        expect(retry).toMatchObject({ code: 'tx-unreachable', problem: true, data: { error: 'not-found', serial: true } });
        expect(retry.retry?.tries).toBeGreaterThanOrEqual(2);
        expect(h.state.connectivityLog.page({}, today()).rows.filter(r => r.event === 'retrying')).toHaveLength(1);

        serial.present.add('COM3');
        await waitFor(() => h.kernel.transmitterLink().state === 'connected-no-session', 5_000, 'connected after plug-in');
    });

    it('Connect / Reconnect apply to the COM port; auto-reconnect off waits for Connect', async () => {
        await start();
        await apply({ ...SERIAL, autoReconnect: false });
        await sleep(300);
        expect(serial.ports).toHaveLength(0);
        const st = h.kernel.transmitterState();
        expect(st.actions).toMatchObject({ connect: true, reconnect: true });
        expect(st.link).toMatchObject({ mode: 'serial', peer: 'COM3 @ 9600' });
        expect(['waiting', 'disconnected']).toContain(st.link.state);
        await h.kernel.connectTransmitter(st.stateVersion, ACTOR);
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'opened by Connect');
        await expectCode(h.kernel.connectTransmitter(h.state.transmitter.version(), ACTOR), 'already_connected');
        await expectCode(h.kernel.reconnectTransmitter(h.state.transmitter.version(), ACTOR), 'link_up');
        expect(h.state.audit.list({ limit: 10 }).map(a => a.action)).toContain('transmitter-connect');
    });

    it('Test only opens the draft port, says what arrived, closes it; refused while the reader holds a port', async () => {
        await start();
        const testing = h.kernel.testTransmitter({ mode: 'serial', protocol: 'bridge', serialPath: 'COM3', baudRate: 9600 }, ACTOR);
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'test opened COM3');
        serial.write('COM3', bridgeLines(0, 2));
        expect(await testing).toMatchObject({ result: 'data', protocolSeen: 'bridge' });
        await waitFor(() => !serial.openPort('COM3'), 5_000, 'test closed COM3');

        expect(await h.kernel.testTransmitter({ mode: 'serial', protocol: 'bridge', serialPath: 'COM9', baudRate: 9600 }, ACTOR)).toMatchObject({ result: 'port-not-found' });
        serial.held.add('COM3');
        expect(await h.kernel.testTransmitter({ mode: 'serial', protocol: 'bridge', serialPath: 'COM3', baudRate: 9600 }, ACTOR)).toMatchObject({ result: 'port-busy' });
        serial.held.clear();
        expect(await h.kernel.testTransmitter({ mode: 'serial', protocol: 'caseview', serialPath: 'COM3', baudRate: 9600 }, ACTOR)).toMatchObject({ result: 'connected-no-data' });
        await expectCode(h.kernel.testTransmitter({ mode: 'serial', protocol: 'bridge', serialPath: 'COM0', baudRate: 7 }, ACTOR), 'invalid_settings', { fields: { serialPath: 'serial-path', baudRate: 'baud-rate' } });
        expect(logCodes()).toContain('tx-test');

        await apply(SERIAL);
        await waitFor(() => h.kernel.transmitterLink().state === 'connected-no-session', 5_000, 'reader holds COM3');
        await expectCode(h.kernel.testTransmitter({ mode: 'serial', protocol: 'bridge', serialPath: 'COM3', baudRate: 9600 }, ACTOR), 'test_refused_busy');
    });

    // Regression: ISSUE-002 — "No new lines for 2 h 40 min" logged 1 s after the box restarted (hours it was off).
    // Found by /qa on 2026-10-03
    // Report: eTabella angular 21/.gstack/qa-reports/run-20261003T122856Z/qa-report-192.168.1.5-2026-10-03.md
    it('after a restart the quiet notice counts from when the feed came back, not from the last line before the stop', async () => {
        await start();
        await apply(SERIAL);
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'COM3 open');
        serial.write('COM3', bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) > 0, 10_000, 'lines in the session');
        const dir = h.dir;
        await h.kernel.close();
        await h.state.close();

        // The box comes back three hours later (its clock says so); the reporter is still connected to COM3.
        let offset = 3 * 60 * 60_000;
        const later = () => Date.now() + offset;
        h = harness({ dir, clock: later, kernel: { openSerialPort: serial.open, listSerialPorts: () => listed(), serialOpenTimeoutMs: 500 } });
        await h.kernel.start();
        await waitFor(() => h.kernel.transmitterLink().state !== 'connecting' && h.kernel.transmitterLink().state !== 'waiting', 10_000, 'COM3 back');
        await sleep(400); // several kernel ticks with the feed up
        expect(logCodes()).not.toContain('tx-quiet');


        // Ten minutes after the feed came back with still no line: now it is quiet, and says for how long.
        offset += 11 * 60_000;
        await waitFor(() => logCodes().includes('tx-quiet'), 5_000, 'quiet logged');
        const quiet = h.state.connectivityLog.page({}, new Date(later()).toISOString().slice(0, 10)).rows.find(r => r.code === 'tx-quiet')!;
        expect(quiet.data.durationMs).toBeGreaterThanOrEqual(10 * 60_000);
        expect(quiet.data.durationMs).toBeLessThan(60 * 60_000);
    });

    // Regression: ISSUE-008 — restarted a few minutes after the last line, the reopened COM port was "held, not used"
    // (the pin restored from the journal read "com3 @ 9600", the new connection's peer "COM3"), so the feed stopped.
    // Found by /qa on 2026-10-03
    // Report: eTabella angular 21/.gstack/qa-reports/run-20261003T122856Z/qa-report-192.168.1.5-2026-10-03.md
    it('restarted soon after the last line, the same COM port is the session\'s feed again (not held)', async () => {
        await start();
        await apply(SERIAL);
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'COM3 open');
        serial.write('COM3', bridgeLines(0, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) > 0, 10_000, 'lines in the session');
        const dir = h.dir;
        await h.kernel.close();
        await h.state.close();

        h = harness({ dir, kernel: { openSerialPort: serial.open, listSerialPorts: () => listed(), serialOpenTimeoutMs: 500 } });
        await h.kernel.start();
        await waitFor(() => !!serial.openPort('COM3'), 5_000, 'COM3 reopened');
        await sleep(300);
        expect(logCodes()).not.toContain('tx-held-peer');
        const before = h.kernel.currentCut(SES)?.totalLines ?? 0;
        serial.write('COM3', bridgeLines(3, 3));
        await waitFor(() => (h.kernel.currentCut(SES)?.totalLines ?? 0) > before, 10_000, 'lines after the restart reach the session');
    });

    it('lists the computer\'s COM ports; says why when it cannot', async () => {
        await start();
        expect(await h.kernel.serialPorts()).toEqual({ ports: await listed(), error: null });
        listed = async () => {
            throw Object.assign(new Error('the serialport package is not installed on this computer'), { code: 'ESERIALMISSING' });
        };
        expect(await h.kernel.serialPorts()).toEqual({ ports: [], error: 'serial_unavailable' });
        listed = async () => {
            throw new Error('EACCES');
        };
        expect(await h.kernel.serialPorts()).toEqual({ ports: [], error: 'list_failed' });
    });

    it('a session whose COM port was set on etabella.net switches the box to that port by itself', async () => {
        serial.present.add('COM5');
        await start({ protocol: 'B', route: null, reporter: { serialPath: 'COM5', baudRate: 19200 } });
        await waitFor(() => h.kernel.cloudReporterStatus()?.state === 'applied', 10_000, 'cloud COM port applied');
        expect(h.kernel.cloudReporterStatus()).toEqual({ nSesid: SES, host: null, port: null, serialPath: 'COM5', baudRate: 19200, state: 'applied', reason: null });
        expect(h.kernel.transmitterState().settings).toEqual({ mode: 'serial', protocol: 'bridge', host: null, port: null, serialPath: 'COM5', baudRate: 19200, autoReconnect: true, receivingSesid: SES });
        await waitFor(() => !!serial.openPort('COM5'), 5_000, 'COM5 open');
        expect(serial.openPort('COM5')!.baudRate).toBe(19200);
        expect(h.kernel.transmitterState().applied?.by.name).toBe('etabella.net (session settings)');

        // A person's own setting afterwards stays (the cloud value counts as dealt with). The open port counts as a
        // live link: changing it goes through the guard.
        await expectCode(apply({ ...SERIAL, receivingSesid: SES }), 'confirm_required');
        await apply({ ...SERIAL, receivingSesid: SES }, true);
        await waitFor(() => h.kernel.cloudReporterStatus()?.state === 'overridden', 5_000, 'overridden');
        expect(h.kernel.transmitterState().settings).toMatchObject({ serialPath: 'COM3', baudRate: 9600 });
    });
});
