import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { httpDateOffsetMs, NodeOpsHost, OPS_HOST_STATUS_MAX_AGE_MS, parseChronyTracking, parseUpsReport, parseUpsStatus, readHostStatusFile } from './ops-host';

// The exact shape `chronyc -c tracking` prints (docker/edge/host/etabella-edge-hoststatus.sh header).
const SYNCED = 'A29FC87B,ntp1.example.net,3,1727775000.123456789,0.000012345,-0.000002000,0.000030000,-12.345,0.001,0.010,0.012345678,0.001234567,1031.4,Normal\n';
const SLOW = 'A29FC87B,ntp1.example.net,3,1727775000.1,2.500000000,0.1,0.03,-12.3,0.001,0.01,0.012,0.0012,64.0,Normal';
const UNSYNCED = '00000000,,0,0.000000000,0.000000000,0.000000000,0.000000000,0.000,0.000,0.000,1.000000000,1.000000000,0.0,Not synchronised';

describe('ops host parsers', () => {
    it('reads chrony tracking: offset = -system time (positive = slow), synced unless "Not synchronised"', () => {
        const synced = parseChronyTracking(SYNCED)!;
        expect(synced).toMatchObject({ synced: true, source: 'chrony' });
        expect(synced.offsetMs).toBeCloseTo(-0.012345, 9);
        expect(parseChronyTracking(SLOW)).toEqual({ offsetMs: -2500, synced: true, source: 'chrony' });
        expect(parseChronyTracking(SLOW.replace('2.500000000', '-0.750000000'))).toEqual({ offsetMs: 750, synced: true, source: 'chrony' });
        expect(parseChronyTracking(UNSYNCED)).toEqual({ offsetMs: 0, synced: false, source: 'chrony' });
        expect(parseChronyTracking(SLOW.replace('Normal', 'Insert second'))?.synced).toBe(true);
        expect(parseChronyTracking(SLOW.replace('A29FC87B', '00000000'))?.synced).toBe(false);
    });

    it('refuses anything it cannot read', () => {
        expect(parseChronyTracking('')).toBeNull();
        expect(parseChronyTracking('506 Cannot talk to daemon')).toBeNull();
        expect(parseChronyTracking('a,b,c')).toBeNull();
        expect(parseChronyTracking(SLOW.replace('2.500000000', 'abc'))).toBeNull();
        expect(parseChronyTracking(SLOW.replace('2.500000000', ''))).toBeNull();
    });

    it('reads NUT ups.status flags and full upsc reports', () => {
        expect(parseUpsStatus('OL')).toBe(false);
        expect(parseUpsStatus('OL CHRG')).toBe(false);
        expect(parseUpsStatus('ob dischrg lb')).toBe(true);
        expect(parseUpsStatus('')).toBeNull();
        expect(parseUpsStatus('BYPASS')).toBeNull();
        expect(parseUpsReport('battery.charge: 100\nups.status: OB DISCHRG\nups.load: 12\n')).toBe(true);
        expect(parseUpsReport('battery.charge: 100\nups.status: OL\n')).toBe(false);
        expect(parseUpsReport('battery.charge: 100\n')).toBeNull();
        expect(parseUpsReport('OL')).toBe(false);
    });

    it('turns a Date header into an RTT-corrected offset (the header truncates to the second)', () => {
        const server = Date.UTC(2026, 9, 1, 9, 30, 0);
        expect(httpDateOffsetMs({ serverDateMs: server, sentAtMs: server + 400, receivedAtMs: server + 600 })).toBe(0);
        expect(httpDateOffsetMs({ serverDateMs: server, sentAtMs: server + 10_500, receivedAtMs: server + 10_500 })).toBe(10_000);
        expect(httpDateOffsetMs({ serverDateMs: null, sentAtMs: 1, receivedAtMs: 2 })).toBeNull();
        expect(httpDateOffsetMs({ serverDateMs: 1, sentAtMs: 1, receivedAtMs: null })).toBeNull();
    });
});

describe('NodeOpsHost (local files only; never the network)', () => {
    let dir: string;

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rt-edge-ops-host-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    it('reads the host-status files the container gets from etabella-edge-hoststatus', async () => {
        fs.writeFileSync(path.join(dir, 'chrony-tracking.csv'), SLOW);
        fs.writeFileSync(path.join(dir, 'ups.txt'), 'ups.status: OB DISCHRG\n');
        const host = new NodeOpsHost(dir);
        await expect(host.chrony()).resolves.toEqual({ offsetMs: -2500, synced: true, source: 'chrony' });
        await expect(host.upsOnBattery()).resolves.toBe(true);
    });

    it('treats a host-status file older than 60 s as not measured (the host service stopped)', async () => {
        const file = path.join(dir, 'chrony-tracking.csv');
        fs.writeFileSync(file, SLOW);
        const old = new Date(Date.now() - OPS_HOST_STATUS_MAX_AGE_MS - 5_000);
        fs.utimesSync(file, old, old);
        fs.writeFileSync(path.join(dir, 'ups.txt'), 'ups.status: OL\n');
        fs.utimesSync(path.join(dir, 'ups.txt'), old, old);
        const host = new NodeOpsHost(dir);
        await expect(host.chrony()).resolves.toBeNull();
        await expect(host.upsOnBattery()).resolves.toBeNull();
        expect(readHostStatusFile(file, Date.now())).toBe('stale');
        expect(readHostStatusFile(path.join(dir, 'nope'), Date.now())).toBeNull();
        expect(readHostStatusFile(dir, Date.now())).toBeNull();
    });

    it('measures disk usage of the data dir (or its nearest existing parent) and directory bytes', () => {
        const host = new NodeOpsHost(dir);
        const usage = host.disk(path.join(dir, 'not', 'created', 'yet'));
        expect(usage).not.toBeNull();
        expect(usage!.totalMB).toBeGreaterThan(0);
        expect(usage!.freeMB).toBeGreaterThanOrEqual(0);
        expect(usage!.freeMB).toBeLessThanOrEqual(usage!.totalMB);

        fs.mkdirSync(path.join(dir, 'journal', 's1'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'journal', 's1', 'seg-1.ej'), Buffer.alloc(1000));
        fs.writeFileSync(path.join(dir, 'journal', 'top.bin'), Buffer.alloc(24));
        expect(host.dirBytes(path.join(dir, 'journal'))).toBe(1024);
        expect(host.dirBytes(path.join(dir, 'missing'))).toBe(0);
    });

    it('lists IPv4 interfaces and its own uptime', () => {
        const host = new NodeOpsHost(dir);
        const addresses = host.ipv4Addresses();
        expect(addresses.every(a => /^\d+\.\d+\.\d+\.\d+$/.test(a.address))).toBe(true);
        expect(host.uptimeSec()).toBeGreaterThanOrEqual(0);
    });

    it('removes trees and missing paths alike', async () => {
        const host = new NodeOpsHost(dir);
        fs.mkdirSync(path.join(dir, 'j', 's9'), { recursive: true });
        fs.writeFileSync(path.join(dir, 'j', 's9', 'seg'), 'x');
        await host.remove(path.join(dir, 'j', 's9'));
        expect(fs.existsSync(path.join(dir, 'j', 's9'))).toBe(false);
        await expect(host.remove(path.join(dir, 'never'))).resolves.toBeUndefined();
    });

    it('never steps the clock to a nonsense time (and only on Linux)', async () => {
        const host = new NodeOpsHost(dir);
        await expect(host.stepClock(Number.NaN)).resolves.toBe(false);
        await expect(host.stepClock(-1)).resolves.toBe(false);
        if (process.platform !== 'linux') await expect(host.stepClock(Date.now())).resolves.toBe(false);
    });
});
