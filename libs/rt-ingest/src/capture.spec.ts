import { createHash } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { BOX_CAPTURE_LIMITS, CaptureFs, CaptureStore, CLOUD_CAPTURE_LIMITS, nodeCaptureFs, readCapture } from './capture';
import { decodeBody, RecordType } from './raw-journal';
import { IngestAlert } from './types';

const SES = 'ses-capture-1';
// real file I/O: generous under a parallel full-suite run
jest.setTimeout(30_000);

describe('capture limits (spec §3.2)', () => {
    it('box: 1 GB global and at most 5 % of free disk; cloud: 200 MB per session and 1 GB total', () => {
        expect(BOX_CAPTURE_LIMITS).toEqual({ totalBytes: 1024 ** 3, perSessionBytes: null, freeDiskFraction: 0.05 });
        expect(CLOUD_CAPTURE_LIMITS).toEqual({ totalBytes: 1024 ** 3, perSessionBytes: 200 * 1024 ** 2, freeDiskFraction: null });
    });
});

describe('CaptureStore', () => {
    let root: string;
    let now: number;
    const clock = () => now;
    beforeEach(() => {
        root = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-ingest-capture-'));
        now = 1_700_000_000_000;
    });
    afterEach(() => {
        fs.rmSync(root, { recursive: true, force: true });
    });

    it('records a held stream with username and peer, never the password, and a verifiable sha256', async () => {
        const store = new CaptureStore({ root, limits: 'cloud', clock });
        await store.init();
        const w = store.open({ kind: 'C', nSesid: SES, connId: 'l-abc', user: 'alok', peer: '10.0.0.7', remote: '10.0.0.7:5100', mode: 'listen' });
        now += 5;
        expect(w.write(Buffer.from('held bytes one '))).toBe(true);
        now += 5;
        expect(w.write(Buffer.from('two'))).toBe(true);
        now += 5;
        const meta = await w.close('session-end');
        expect(meta).toMatchObject({ kind: 'C', nSesid: SES, user: 'alok', peer: '10.0.0.7', bytes: 18, records: 4, capped: false, closedReason: 'session-end', fromMs: 1_700_000_000_000, toMs: 1_700_000_000_015 });
        const file = store.filePath(meta);
        const raw = fs.readFileSync(file);
        expect(meta.sha256).toBe(createHash('sha256').update(raw).digest('hex'));
        expect(raw.toString('latin1')).not.toContain('jha'); // the handshake password never reaches a capture
        const recs = await readCapture(file, SES);
        expect(recs.map(r => r.type)).toEqual([RecordType.CONN_OPEN, RecordType.DATA, RecordType.DATA, RecordType.CONN_CLOSE]);
        expect(decodeBody(recs[0])).toMatchObject({ connId: 'l-abc', user: 'alok', peer: '10.0.0.7', kind: 'C' });
        expect(Buffer.concat(recs.filter(r => r.type === RecordType.DATA).map(r => r.payload)).toString()).toBe('held bytes one two');
        const listed = await store.list(SES);
        expect(listed).toHaveLength(1);
        expect(listed[0].sha256).toBe(meta.sha256);
        expect(Object.keys(listed[0])).not.toContain('password');
    });

    it('cloud: stops recording at 200 MB-style per-session cap, alerts once, and keeps the stream held', async () => {
        const alerts: IngestAlert[] = [];
        // CONN_OPEN ≈ 116 B, each 100 B chunk is a 126 B record: 368 B fit under 450 B, a third chunk does not
        const store = new CaptureStore({ root, limits: { totalBytes: 1_000_000, perSessionBytes: 450, freeDiskFraction: null }, clock, onAlert: a => alerts.push(a) });
        await store.init();
        const w = store.open({ kind: 'H', nSesid: SES, connId: 'l-1', user: 'alok', peer: '1.2.3.4' });
        expect(w.write(Buffer.alloc(100, 1))).toBe(true);
        expect(w.write(Buffer.alloc(100, 2))).toBe(true);
        expect(w.write(Buffer.alloc(100, 3))).toBe(false); // would exceed the session cap
        expect(w.write(Buffer.alloc(10, 4))).toBe(false); // stays capped even though 10 B would fit (no capture with a hole)
        expect(w.isCapped).toBe(true);
        const meta = await w.close();
        expect(meta).toMatchObject({ capped: true, bytes: 200, droppedBytes: 110 });
        expect(alerts.filter(a => a.kind === 'CAPTURE_CAP')).toHaveLength(1);
        expect(alerts[0]).toMatchObject({ tier: 'P2', nSesid: SES, peer: '1.2.3.4' });
        // another session still has room under the total cap
        const other = store.open({ kind: 'H', nSesid: 'ses-other', connId: 'l-2', peer: '1.2.3.5' });
        expect(other.write(Buffer.alloc(100, 5))).toBe(true);
        await other.close();
    });

    it('cloud: enforces the total cap across sessions', async () => {
        const store = new CaptureStore({ root, limits: { totalBytes: 400, perSessionBytes: 10_000, freeDiskFraction: null }, clock });
        await store.init();
        const a = store.open({ kind: 'H', nSesid: 'ses-a', connId: 'a', peer: '1.1.1.1' });
        const b = store.open({ kind: 'H', nSesid: 'ses-b', connId: 'b', peer: '1.1.1.2' });
        expect(a.write(Buffer.alloc(150))).toBe(true);
        expect(b.write(Buffer.alloc(150))).toBe(false); // the two CONN_OPEN records + 150 B leave < 150 B
        await a.close();
        await b.close();
        expect(store.usage().totalBytes).toBeLessThanOrEqual(400 + 200); // framing records are accounted even when capped
    });

    it('box: the total cap is the smaller of 1 GB and 5 % of free disk', async () => {
        const cfs: CaptureFs = { ...nodeCaptureFs, diskFree: async () => 4_000 }; // 5 % of 4 kB = 200 B
        const store = new CaptureStore({ root, limits: 'box', fs: cfs, clock });
        await store.init();
        expect(store.usage().effectiveTotalCap).toBe(200);
        const w = store.open({ kind: 'C', nSesid: SES, connId: 'c1', peer: '10.0.0.8' });
        expect(w.write(Buffer.alloc(60))).toBe(true);
        expect(w.write(Buffer.alloc(200))).toBe(false);
        await w.close();
        const big: CaptureFs = { ...nodeCaptureFs, diskFree: async () => 1024 ** 4 }; // 1 TB free: the 1 GB cap wins
        const store2 = new CaptureStore({ root: path.join(root, 'b'), limits: 'box', fs: big, clock });
        await store2.init();
        expect(store2.usage().effectiveTotalCap).toBe(1024 ** 3);
    });

    it('counts existing captures after a restart and finalizes one a crash left open', async () => {
        const store = new CaptureStore({ root, limits: 'cloud', clock });
        await store.init();
        const w = store.open({ kind: 'C', nSesid: SES, connId: 'crash', user: 'u', peer: '10.0.0.9' });
        w.write(Buffer.from('before the crash'));
        await new Promise(resolve => setTimeout(resolve, 50)); // let the queued writes land; never closed
        const fileName = fs.readdirSync(path.join(root, SES)).find(n => n.endsWith('.ej'))!;
        const metaFile = path.join(root, SES, fileName.replace(/\.ej$/, '.json'));
        expect(JSON.parse(fs.readFileSync(metaFile, 'utf8')).toMs).toBeNull();

        const restarted = new CaptureStore({ root, limits: 'cloud', clock });
        await restarted.init();
        const size = fs.statSync(path.join(root, SES, fileName)).size;
        expect(restarted.usage().bySession[SES]).toBe(size);
        const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
        expect(meta).toMatchObject({ closedReason: 'recovered', bytes: 16, user: 'u' });
        expect(meta.sha256).toBe(createHash('sha256').update(fs.readFileSync(path.join(root, SES, fileName))).digest('hex'));

        await restarted.remove(meta);
        expect(restarted.usage().totalBytes).toBe(0);
        expect(await restarted.list(SES)).toHaveLength(0);
    });

    it('raises CAPTURE_ERROR when the capture cannot be written, and keeps refusing quietly', async () => {
        const alerts: IngestAlert[] = [];
        const broken: CaptureFs = {
            ...nodeCaptureFs,
            async openAppend() {
                return {
                    write: async () => {
                        throw Object.assign(new Error('ENOSPC'), { code: 'ENOSPC' });
                    },
                    datasync: async () => undefined,
                    close: async () => undefined,
                };
            },
        };
        const store = new CaptureStore({ root, limits: 'cloud', fs: broken, clock, onAlert: a => alerts.push(a) });
        await store.init();
        const w = store.open({ kind: 'C', nSesid: SES, connId: 'x', peer: '10.0.0.1' });
        w.write(Buffer.from('a'));
        await new Promise(resolve => setTimeout(resolve, 30));
        expect(w.write(Buffer.from('b'))).toBe(false);
        await w.close();
        expect(alerts.filter(a => a.kind === 'CAPTURE_ERROR')).toHaveLength(1);
        expect(store.usage().totalBytes).toBe(0); // failed writes give their reservation back
    });

    it('refuses unsafe ids (they become paths)', () => {
        const store = new CaptureStore({ root, limits: 'cloud', clock });
        expect(() => store.open({ kind: 'C', nSesid: '../etc', connId: 'x', peer: 'p' })).toThrow(/unsafe session id/);
        expect(() => store.open({ kind: 'C', nSesid: SES, connId: '../../x', peer: 'p' })).toThrow(/unsafe capture connId/);
    });
});
