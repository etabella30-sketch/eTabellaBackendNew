import { NETWORK_CHECK_KEYS } from '../contracts';
import { evaluateNetworkChecks, NetworkCheckInput, pickRoomAddress, pickTransmitterAddress, urlHost } from './network';
import { failedDns, NOW, okDns, testConfig } from './testing/ops-fakes';

const ADDRS = [
    { name: 'lo', address: '127.0.0.1', internal: true },
    { name: 'eth0', address: '169.254.10.2', internal: false },
    { name: 'eth0', address: '10.40.1.5', internal: false },
    { name: 'eth1', address: '192.168.20.2', internal: false },
];

function input(over: Partial<NetworkCheckInput> = {}): NetworkCheckInput {
    return {
        room: { value: '10.40.1.5', present: true },
        transmitter: { value: '192.168.20.2', present: true },
        internet: { state: 'up', sinceMs: NOW - 60_000 },
        internetProbe: okDns(9),
        etabellaProbe: { ok: true, status: 204, ms: 48, serverDateMs: NOW, sentAtMs: NOW, receivedAtMs: NOW + 48, error: null },
        dnsProbe: okDns(12, '192.168.10.1'),
        clock: { synced: true, offsetMs: 3 },
        ...over,
    };
}

describe('network checks (D34, DR16; CONTRACTS.md §8.6)', () => {
    it('room address: a concrete http.host, else the first usable IPv4 off the transmitter network', () => {
        expect(pickRoomAddress(ADDRS, testConfig())).toEqual({ value: '10.40.1.5', present: true });
        expect(pickRoomAddress(ADDRS, testConfig({ http: { host: '10.40.1.9', port: 0, tls: null } }))).toEqual({ value: '10.40.1.9', present: false });
        expect(pickRoomAddress(ADDRS, testConfig({ http: { host: '10.40.1.5', port: 0, tls: null } }))).toEqual({ value: '10.40.1.5', present: true });
        expect(pickRoomAddress([ADDRS[0], ADDRS[3]], testConfig())).toEqual({ value: null, present: false });
    });

    it('transmitter address: the configured bind address (present or not), else (dev) an IPv4 inside the CIDR', () => {
        expect(pickTransmitterAddress(ADDRS, testConfig())).toEqual({ value: '192.168.20.2', present: true });
        expect(pickTransmitterAddress(ADDRS.slice(0, 3), testConfig())).toEqual({ value: '192.168.20.2', present: false });
        const dev = testConfig({ transmitter: { bindAddress: null, networkCidr: '192.168.20.0/24' } });
        expect(pickTransmitterAddress(ADDRS, dev)).toEqual({ value: '192.168.20.2', present: true });
        expect(pickTransmitterAddress(ADDRS, testConfig({ transmitter: { bindAddress: null, networkCidr: null } }))).toEqual({ value: null, present: false });
    });

    it('returns every NETWORK_CHECK_KEYS entry in order, with values and timings', () => {
        const checks = evaluateNetworkChecks(input());
        expect(checks.map(c => c.key)).toEqual([...NETWORK_CHECK_KEYS]);
        expect(checks).toEqual([
            { key: 'box-room-address', ok: true, level: 'ok', value: '10.40.1.5', ms: null },
            { key: 'box-transmitter-address', ok: true, level: 'ok', value: '192.168.20.2', ms: null },
            { key: 'internet', ok: true, level: 'ok', value: null, ms: 9 },
            { key: 'etabella-reachable', ok: true, level: 'ok', value: null, ms: 48 },
            { key: 'dns', ok: true, level: 'ok', value: '192.168.10.1', ms: 12 },
            { key: 'clock-offset', ok: true, level: 'ok', value: null, ms: 3 },
        ]);
    });

    it('tells "Internet unavailable" from "Can\'t reach eTabella" (DR16)', () => {
        const cantReach = evaluateNetworkChecks(input({ etabellaProbe: { ok: false, status: null, ms: null, serverDateMs: null, sentAtMs: NOW, receivedAtMs: null, error: 'ECONNREFUSED' } }));
        expect(cantReach.find(c => c.key === 'internet')).toMatchObject({ ok: true });
        expect(cantReach.find(c => c.key === 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad', ms: null });
        const offline = evaluateNetworkChecks(input({ internet: { state: 'down', sinceMs: NOW - 60_000 }, internetProbe: failedDns('ETIMEOUT') }));
        expect(offline.find(c => c.key === 'internet')).toMatchObject({ ok: false, level: 'bad', ms: null });
        // The uplink's own view of the internet counts even when the DNS probe failed.
        expect(evaluateNetworkChecks(input({ internetProbe: failedDns() })).find(c => c.key === 'internet')?.ok).toBe(true);
    });

    it('a probe that was not run yet reads not ok, level warn; missing addresses are bad', () => {
        const never = evaluateNetworkChecks(
            input({
                internet: { state: 'unknown', sinceMs: null },
                internetProbe: null,
                etabellaProbe: null,
                dnsProbe: null,
                clock: { synced: null, offsetMs: null },
                room: { value: null, present: false },
                transmitter: { value: '192.168.20.2', present: false },
            }),
        );
        expect(never.map(c => [c.key, c.ok, c.level])).toEqual([
            ['box-room-address', false, 'bad'],
            ['box-transmitter-address', false, 'bad'],
            ['internet', false, 'warn'],
            ['etabella-reachable', false, 'warn'],
            ['dns', false, 'warn'],
            ['clock-offset', false, 'warn'],
        ]);
    });

    it('clock offset levels follow the readiness thresholds and report the offset as ms', () => {
        const at = (offsetMs: number, synced = true) => evaluateNetworkChecks(input({ clock: { synced, offsetMs } })).find(c => c.key === 'clock-offset');
        expect(at(-400)).toMatchObject({ ok: true, level: 'ok', ms: -400 });
        expect(at(2_000)).toMatchObject({ ok: false, level: 'warn', ms: 2_000 });
        expect(at(90_000)).toMatchObject({ ok: false, level: 'bad', ms: 90_000 });
        expect(at(10, false)).toMatchObject({ ok: false, level: 'warn' });
        expect(evaluateNetworkChecks(input({ dnsProbe: failedDns() })).find(c => c.key === 'dns')).toMatchObject({ ok: false, level: 'bad', value: '192.168.10.1', ms: null });
    });

    it('urlHost reads the cloud host', () => {
        expect(urlHost('https://etabella.net')).toBe('etabella.net');
        expect(urlHost('not a url')).toBeNull();
    });
});
