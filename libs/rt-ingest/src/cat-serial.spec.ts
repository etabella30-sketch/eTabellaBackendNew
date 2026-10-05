import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { ConnectivityLogEntry } from './cat-dialer';
import {
    CatSerial,
    isSerialPath,
    normalizeSerialPath,
    SerialOpenOptions,
    SerialPortLike,
    SerialSettings,
    serialErrorClass,
    validateSerialSettings,
} from './cat-serial';
import { FeedArbiter } from './feed-arbiter';
import { decodeBody, readJournal, RecordType } from './raw-journal';
import { SessionWorker } from './session-worker';

const SES = 'ses-serial-1';
const SES2 = 'ses-serial-2';
jest.setTimeout(30_000);

/** A COM port as `serialport` behaves: opens asynchronously, emits data, closes (or vanishes when unplugged). */
class FakePort extends EventEmitter implements SerialPortLike {
    isOpen = false;
    closeCalls = 0;

    constructor(readonly path: string, readonly baudRate: number) {
        super();
    }

    openNow(): void {
        this.isOpen = true;
        this.emit('open');
    }

    failOpen(message: string): void {
        this.emit('error', new Error(message));
    }

    feed(data: string): void {
        this.emit('data', Buffer.from(data, 'latin1'));
    }

    /** The USB adapter is pulled out: the port closes with an error. */
    unplug(): void {
        this.isOpen = false;
        this.emit('close', Object.assign(new Error('Reading from COM port (ReadIOCompletion): Access is denied.'), { disconnected: true }));
    }

    close(callback?: (error?: Error | null) => void): void {
        this.closeCalls += 1;
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

async function waitFor(cond: () => boolean | Promise<boolean>, ms = 10_000, what = 'condition'): Promise<void> {
    const deadline = Date.now() + ms;
    while (!(await cond())) {
        if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
        await new Promise(resolve => setTimeout(resolve, 10));
    }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('CatSerial ("Live data · COM port")', () => {
    let root: string;
    let arbiter: FeedArbiter;
    let log: ConnectivityLogEntry[];
    let ports: FakePort[];
    /** What the next opened port does; default: opens. */
    let behaviour: (p: FakePort) => void;
    const readers: CatSerial[] = [];

    const opener = (o: SerialOpenOptions): SerialPortLike => {
        const p = new FakePort(o.path, o.baudRate);
        ports.push(p);
        const act = behaviour;
        setImmediate(() => act(p));
        return p;
    };
    const settings = (over: Partial<SerialSettings> = {}): SerialSettings => ({ protocol: 'caseview', path: 'COM3', baudRate: 9600, autoReconnect: true, reconnectMs: 100, ...over });
    const makeReader = (over: Partial<ConstructorParameters<typeof CatSerial>[0]> = {}) => {
        const r = new CatSerial({ arbiter, onLog: e => log.push(e), openPort: opener, openTimeoutMs: 1_000, ...over });
        readers.push(r);
        return r;
    };
    const setUp = (r: CatSerial, s: SerialSettings = settings(), nSesid: string | null = SES) => {
        const res = r.apply({ settings: s, nSesid }, r.version);
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
        (await journal(nSesid)).filter(r => r.type === RecordType.CONN_OPEN || r.type === RecordType.CONN_CLOSE).map(r => (r.type === RecordType.CONN_OPEN ? `open:${r.body.mode}` : `close:${r.body.reason}`));
    const last = () => ports[ports.length - 1]!;

    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-serial-'));
        log = [];
        ports = [];
        behaviour = p => p.openNow();
        arbiter = new FeedArbiter({
            openWorker: nSesid => SessionWorker.open({ meta: { nSesid, parserVer: '1.0.0' }, journalRoot: path.join(root, 'journal'), parserVer: '1.0.0', boundaryMs: 0 }),
        });
    });
    afterEach(async () => {
        for (const r of readers.splice(0)) await r.close();
        await arbiter.close();
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('validates settings: protocol, COM port or /dev path, a baud rate a CAT program offers, auto-reconnect', () => {
        expect(validateSerialSettings(settings())).toEqual([]);
        expect(validateSerialSettings(settings({ path: '/dev/ttyUSB0', baudRate: 115200, protocol: 'bridge' }))).toEqual([]);
        expect(validateSerialSettings(settings({ path: 'COM0' }))).toHaveLength(1);
        expect(validateSerialSettings(settings({ path: 'COM3; rm -rf' }))).toHaveLength(1);
        expect(validateSerialSettings(settings({ baudRate: 9601 }))).toHaveLength(1);
        expect(validateSerialSettings({ protocol: 'xml' as any, path: '', baudRate: 0, autoReconnect: 'yes' as any })).toHaveLength(4);
        expect(validateSerialSettings(null)).toEqual(['settings are required']);
        expect(isSerialPath('com12')).toBe(true);
        expect(isSerialPath('/dev/../etc/passwd')).toBe(true); // a path, but nothing is ever written to the port
        expect(isSerialPath('C:\\COM3')).toBe(false);
        expect(normalizeSerialPath(' com7 ')).toBe('COM7');
        expect(normalizeSerialPath('/dev/ttyS0')).toBe('/dev/ttyS0');
    });

    it('classifies port errors: not found, busy, the package missing, anything else', () => {
        expect(serialErrorClass(new Error('Opening COM9: File not found'))).toBe('not-found');
        expect(serialErrorClass(new Error('Opening COM3: Access denied'))).toBe('busy');
        expect(serialErrorClass(Object.assign(new Error('Error: Resource busy, cannot open /dev/ttyUSB0'), { code: 'EBUSY' }))).toBe('busy');
        expect(serialErrorClass(Object.assign(new Error('x'), { code: 'ESERIALMISSING' }))).toBe('missing-driver');
        expect(serialErrorClass(new Error('Unknown error code 31'))).toBe('error');
        expect(serialErrorClass(null)).toBe('error');
    });

    it('opens the port and feeds the bound session: CONN_OPEN with mode serial and no user, bytes in order', async () => {
        const r = makeReader();
        setUp(r);
        expect(r.status().state).toBe('disconnected');
        expect(r.connect().ok).toBe(true);
        await waitFor(() => r.status().connected, 5_000, 'open');
        expect(last().path).toBe('COM3');
        expect(last().baudRate).toBe(9600);
        last().feed('Q. Where were you\r\n');
        last().feed('A. At the office\r\n');
        await waitFor(async () => (await dataOf()) === 'Q. Where were you\r\nA. At the office\r\n', 5_000, 'data journaled');
        const open = (await journal()).find(x => x.type === RecordType.CONN_OPEN)!;
        expect(open.body.mode).toBe('serial');
        expect(open.body.user).toBeUndefined();
        expect(open.body.remote).toBe('COM3 @ 9600');
        const st = r.status();
        expect(st.peer).toBe('COM3 @ 9600');
        expect(st.bytes).toBe(37);
        expect(['live', 'quiet']).toContain(st.state);
        expect(log.map(e => e.kind)).toEqual(expect.arrayContaining(['attempt', 'connected', 'feed']));
    });

    it('bytes that arrive before the session attached are kept and fed in order', async () => {
        behaviour = p => {
            p.openNow();
            p.feed('one ');
            p.feed('two ');
        };
        const r = makeReader();
        setUp(r);
        r.connect();
        await waitFor(() => r.status().connected, 5_000, 'open');
        last().feed('three');
        await waitFor(async () => (await dataOf()) === 'one two three', 5_000, 'all bytes');
    });

    it('a missing port is tried again every reconnect interval, one collapsible row per try, until it appears', async () => {
        behaviour = p => p.failOpen('Opening COM3: File not found');
        const r = makeReader();
        setUp(r);
        r.connect();
        await waitFor(() => ports.length >= 3, 5_000, 'three tries');
        const st = r.status();
        expect(st.connected).toBe(false);
        expect(st.retrying).toBe(true);
        expect(st.state).toBe('connecting');
        expect(st.lastError).toBe('not-found');
        const errors = log.filter(e => e.kind === 'error');
        expect(errors.length).toBeGreaterThanOrEqual(2);
        expect(errors.every(e => e.collapseKey === 'serial-retry' && /not-found/.test(e.message))).toBe(true);

        behaviour = p => p.openNow(); // the adapter is plugged in
        await waitFor(() => r.status().connected, 5_000, 'open after retries');
        expect(r.status().attempt).toBe(0);
        expect(r.status().lastError).toBeNull();
    });

    it('names the configured port in every state, open or not (user decision 2026-10-04)', async () => {
        behaviour = p => p.failOpen('Opening COM3: File not found');
        const r = makeReader();
        expect(r.status().peer).toBeNull(); // nothing set up
        setUp(r);
        expect(r.status()).toMatchObject({ state: 'disconnected', connected: false, peer: 'COM3 @ 9600' });
        r.connect();
        await waitFor(() => ports.length >= 2, 5_000, 'retrying');
        expect(r.status()).toMatchObject({ state: 'connecting', connected: false, peer: 'COM3 @ 9600' });
        behaviour = p => p.openNow();
        await waitFor(() => r.status().connected, 5_000, 'open');
        expect(r.status().peer).toBe('COM3 @ 9600');
        r.disconnect();
        expect(r.status()).toMatchObject({ connected: false, peer: 'COM3 @ 9600' });
        setUp(r, settings({ path: 'com7', baudRate: 19200 }));
        expect(r.status().peer).toBe('COM7 @ 19200');
    });

    it('an unplugged adapter closes the feed, is logged, and the port is opened again', async () => {
        const r = makeReader();
        setUp(r);
        r.connect();
        await waitFor(() => r.status().connected, 5_000, 'open');
        last().feed('before ');
        await waitFor(async () => (await dataOf()) === 'before ', 5_000, 'first bytes');
        const first = last();
        first.unplug();
        await waitFor(() => ports.length === 2 && r.status().connected, 5_000, 'reopened');
        expect(log.some(e => e.kind === 'disconnected' && /Closed COM3 @ 9600/.test(e.message))).toBe(true);
        last().feed('after');
        await waitFor(async () => (await dataOf()) === 'before after', 5_000, 'bytes after reopen');
        expect(await connRecords()).toEqual(['open:serial', expect.stringMatching(/^close:/), 'open:serial']);
    });

    it('an open that never answers times out and is tried again', async () => {
        let first = true;
        behaviour = p => {
            if (first) {
                first = false; // silence: neither open nor error
                return;
            }
            p.openNow();
        };
        const r = makeReader({ openTimeoutMs: 150 });
        setUp(r);
        r.connect();
        await waitFor(() => r.status().connected, 5_000, 'open on the second try');
        expect(log.some(e => e.kind === 'error' && /timeout/.test(e.message))).toBe(true);
        expect(ports.length).toBe(2);
    });

    it('new settings close the port and open the new one; a new session does the same', async () => {
        const r = makeReader();
        setUp(r);
        r.connect();
        await waitFor(() => r.status().connected, 5_000, 'open');
        const before = last();
        expect(r.apply({ settings: settings({ path: 'COM7', baudRate: 19200 }) }, r.version).ok).toBe(true);
        await waitFor(() => r.status().connected && last().path === 'COM7', 5_000, 'reopened on COM7');
        expect(before.isOpen).toBe(false);
        expect(last().baudRate).toBe(19200);

        expect(r.apply({ nSesid: SES2 }, r.version).ok).toBe(true);
        await waitFor(() => r.status().connected && r.status().nSesid === SES2, 5_000, 'reopened for SES2');
        last().feed('second session');
        await waitFor(async () => (await dataOf(SES2)) === 'second session', 5_000, 'SES2 data');
        expect(await connRecords(SES)).toEqual(['open:serial', 'close:settings-changed', 'open:serial', 'close:session-changed']);
    });

    it('a stale version or invalid settings are refused and change nothing', () => {
        const r = makeReader();
        setUp(r);
        const v = r.version;
        expect(r.apply({ settings: settings({ path: 'LPT1' }) }, v)).toMatchObject({ ok: false, reason: 'invalid' });
        expect(r.apply({ settings: settings({ path: 'COM4' }) }, v - 1)).toMatchObject({ ok: false, reason: 'stale' });
        expect(r.settings?.path).toBe('COM3');
        expect(r.version).toBe(v);
    });

    it('Disconnect closes the port and stops re-opening; Connect without settings or a session is refused', async () => {
        const r = makeReader();
        expect(r.connect()).toMatchObject({ ok: false, reason: 'not-set-up' });
        setUp(r);
        r.connect();
        await waitFor(() => r.status().connected, 5_000, 'open');
        expect(r.busy()).toBe(true);
        r.disconnect();
        await sleep(300);
        expect(r.status().connected).toBe(false);
        expect(r.status().retrying).toBe(false);
        expect(ports.length).toBe(1);
        expect(r.busy()).toBe(false);
    });

    it('auto-reconnect off: a failed open is not tried again until Reconnect', async () => {
        behaviour = p => p.failOpen('Opening COM3: Access denied');
        const r = makeReader();
        setUp(r, settings({ autoReconnect: false }));
        r.connect();
        await waitFor(() => r.status().lastError === 'busy', 5_000, 'busy');
        await sleep(300);
        expect(ports.length).toBe(1);
        behaviour = p => p.openNow();
        expect(r.reconnect().ok).toBe(true);
        await waitFor(() => r.status().connected, 5_000, 'open after Reconnect');
    });

    it('without the serialport package the error says so and the reader keeps trying', async () => {
        const r = makeReader({
            openPort: () => {
                throw Object.assign(new Error('the serialport package is not installed on this computer'), { code: 'ESERIALMISSING' });
            },
        });
        setUp(r);
        r.connect();
        await waitFor(() => log.filter(e => e.kind === 'error').length >= 2, 5_000, 'two tries');
        expect(r.status().lastError).toBe('missing-driver');
        expect(r.status().retrying).toBe(true);
    });
});
