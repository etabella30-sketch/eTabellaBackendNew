import { NETWORK_CHECK_KEYS, NetworkCheck, NetworkCheckKey } from '../contracts';
import { evaluateNetworkChecks, isVirtualAdapter, NetworkCheckInput, pickRoomAddress, pickTransmitterAddress, rankAddresses, roomAddressValue, urlHost } from './network';
import { OPS_NETWORK_PROBE_FRESH_MS } from './ops.constants';
import type { OpsHttpsProbe } from './ops-host';
import { failedDns, NOW, okDns, testConfig } from './testing/ops-fakes';

const ADDRS = [
    { name: 'lo', address: '127.0.0.1', internal: true },
    { name: 'eth0', address: '169.254.10.2', internal: false },
    { name: 'eth0', address: '10.40.1.5', internal: false },
    { name: 'eth1', address: '192.168.20.2', internal: false },
];

/** The box PC of 2026-10-04 in `os.networkInterfaces()` order: two VPNs and a virtual switch before the Wi-Fi. */
const THIS_PC = [
    { name: 'Loopback Pseudo-Interface 1', address: '127.0.0.1', internal: true },
    { name: 'Radmin VPN', address: '26.118.179.38', internal: false },
    { name: 'Hamachi', address: '25.27.55.98', internal: false },
    { name: 'vEthernet (Default Switch)', address: '172.18.64.1', internal: false },
    { name: 'Wi-Fi 2', address: '192.168.1.5', internal: false },
];
/** Its box.json: plain HTTP on :4000, no reporter network configured (dev: every interface), reporter port 5555. */
const THIS_BOX = testConfig({ http: { host: '0.0.0.0', port: 4000, tls: null }, transmitter: { listenPort: 5555 } });
const TLS = { certFile: 'c.pem', keyFile: 'k.pem' };

const ETABELLA_OK: OpsHttpsProbe = { ok: true, status: 204, ms: 48, serverDateMs: NOW, sentAtMs: NOW, receivedAtMs: NOW + 48, error: null };
const ETABELLA_REFUSED: OpsHttpsProbe = { ok: false, status: null, ms: null, serverDateMs: null, sentAtMs: NOW, receivedAtMs: null, error: 'ECONNREFUSED' };

function input(over: Partial<NetworkCheckInput> = {}): NetworkCheckInput {
    return {
        nowMs: NOW,
        room: { value: '10.40.1.5', present: true },
        transmitter: { value: '192.168.20.2', present: true },
        transmitterMode: 'listen',
        serialPath: null,
        internet: { state: 'up', sinceMs: NOW - 60_000 },
        etabellaReachable: false,
        cloudCantReach: false,
        probedAtMs: NOW,
        internetProbe: okDns(9),
        etabellaProbe: ETABELLA_OK,
        dnsProbe: okDns(12, '192.168.10.1'),
        dnsHost: 'etabella.net',
        clock: { synced: true, offsetMs: 3 },
        ...over,
    };
}

const row = (checks: readonly NetworkCheck[], key: NetworkCheckKey): NetworkCheck => checks.find(c => c.key === key) as NetworkCheck;

describe('network checks (D34, DR16; CONTRACTS.md §8.6)', () => {
    it('room address: a concrete http.host, else the first usable IPv4 off the transmitter network', () => {
        const tls = (http: Record<string, unknown> = {}) => testConfig({ http: { host: '0.0.0.0', port: 443, tls: TLS, ...http } });
        expect(pickRoomAddress(ADDRS, tls())).toEqual({ value: '10.40.1.5', present: true });
        expect(pickRoomAddress(ADDRS, tls({ host: '10.40.1.9' }))).toEqual({ value: '10.40.1.9', present: false });
        expect(pickRoomAddress(ADDRS, tls({ host: '10.40.1.5' }))).toEqual({ value: '10.40.1.5', present: true });
        expect(pickRoomAddress([ADDRS[0], ADDRS[3]], tls())).toEqual({ value: null, present: false });
    });

    it('room address (user decision 2026-10-04): the default-route address, else private ranges first and VPN / virtual adapters last', () => {
        // This PC: Radmin VPN and Hamachi come first from the OS, the Wi-Fi is what the room reaches.
        expect(pickRoomAddress(THIS_PC, THIS_BOX, '192.168.1.5')).toEqual({ value: 'http://192.168.1.5:4000', present: true });
        expect(pickRoomAddress(THIS_PC, THIS_BOX)).toEqual({ value: 'http://192.168.1.5:4000', present: true });
        // The default route wins over the ranking (a public uplink address, say).
        expect(pickRoomAddress([...THIS_PC, { name: 'eth9', address: '81.2.69.160', internal: false }], THIS_BOX, '81.2.69.160').value).toBe('http://81.2.69.160:4000');
        // ...but never onto the transmitter network.
        expect(pickRoomAddress(ADDRS, testConfig({ http: { host: '0.0.0.0', port: 443, tls: TLS } }), '192.168.20.2')).toEqual({ value: '10.40.1.5', present: true });
        // A configured host still comes first, with the plain-HTTP form.
        expect(pickRoomAddress(THIS_PC, testConfig({ http: { host: '192.168.1.5', port: 4000, tls: null } }), '26.118.179.38').value).toBe('http://192.168.1.5:4000');
        // Only VPN adapters: still an address (the best there is), never none.
        expect(pickRoomAddress(THIS_PC.slice(0, 3), THIS_BOX).value).toBe('http://26.118.179.38:4000');
    });

    it('ranks addresses: default route, private, other, then VPN / virtual (OS order kept inside a group)', () => {
        expect(rankAddresses(THIS_PC, null)).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1']);
        expect(rankAddresses(THIS_PC, '192.168.1.5')).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1']);
        const mixed = [
            { name: 'eth2', address: '81.2.69.160', internal: false },
            { name: 'tailscale0', address: '100.101.102.103', internal: false },
            { name: 'eth1', address: '10.0.0.7', internal: false },
            { name: 'eth0', address: '169.254.1.1', internal: false },
        ];
        expect(rankAddresses(mixed, null)).toEqual(['10.0.0.7', '81.2.69.160', '100.101.102.103']);
        // The default route leads only as a usable address of an adapter listed now; a link-local or loopback one never.
        expect(rankAddresses(mixed, '81.2.69.160')).toEqual(['81.2.69.160', '10.0.0.7', '100.101.102.103']);
        expect(rankAddresses(mixed, '127.0.0.1')[0]).toBe('10.0.0.7');
        expect(rankAddresses(mixed, '169.254.7.7')[0]).toBe('10.0.0.7');
    });

    it('a default route no adapter holds now, or one on a VPN / virtual adapter, never leads (review 2026-10-04)', () => {
        // (a) The Wi-Fi dropped, or DHCP gave a new lease: the address ops read up to 2 min ago is on no adapter.
        const mixed = [
            { name: 'eth1', address: '10.0.0.7', internal: false },
            { name: 'eth2', address: '81.2.69.160', internal: false },
        ];
        expect(rankAddresses(mixed, '10.9.9.9')).toEqual(['10.0.0.7', '81.2.69.160']);
        expect(pickRoomAddress(THIS_PC.slice(0, 4), THIS_BOX, '192.168.1.5')).toEqual({ value: 'http://26.118.179.38:4000', present: true });
        expect(pickTransmitterAddress(THIS_PC.slice(0, 4), THIS_BOX, '192.168.1.5')).toEqual({ value: '26.118.179.38', present: true });
        // (b) A full-tunnel VPN: the UDP connect to 1.1.1.1 answers with the tunnel's address, never what the room reaches.
        const tunnel = [...THIS_PC, { name: 'OpenVPN Data Channel Offload', address: '10.8.0.6', internal: false }];
        expect(rankAddresses(tunnel, '10.8.0.6')).toEqual(['192.168.1.5', '26.118.179.38', '25.27.55.98', '172.18.64.1', '10.8.0.6']);
        expect(pickRoomAddress(tunnel, THIS_BOX, '10.8.0.6')).toEqual({ value: 'http://192.168.1.5:4000', present: true });
        expect(pickTransmitterAddress(tunnel, THIS_BOX, '10.8.0.6')).toEqual({ value: '192.168.1.5', present: true });
        // A VPN by range (Radmin's 26/8) as the default route: the same.
        expect(rankAddresses(THIS_PC, '26.118.179.38')[0]).toBe('192.168.1.5');
    });

    it('knows VPN overlays and virtual switches by name or by range', () => {
        for (const name of ['Radmin VPN', 'Hamachi', 'vEthernet (WSL)', 'VirtualBox Host-Only Network', 'VMware Network Adapter VMnet8', 'docker0', 'tailscale0', 'ZeroTier One [abc]', 'wg0', 'tun0', 'utun3', 'OpenVPN TAP-Windows6']) {
            expect({ name, virtual: isVirtualAdapter({ name, address: '192.168.56.1' }) }).toEqual({ name, virtual: true });
        }
        for (const address of ['25.27.55.98', '26.118.179.38', '100.64.0.9']) expect(isVirtualAdapter({ name: 'Ethernet 3', address })).toBe(true);
        for (const name of ['Wi-Fi 2', 'Ethernet', 'eth0', 'enp3s0', 'wlan0', 'Local Area Connection']) expect(isVirtualAdapter({ name, address: '192.168.1.5' })).toBe(false);
    });

    it('the room address is a URL on a plain-HTTP box (http://…:4000), the bare IPv4 with TLS', () => {
        expect(roomAddressValue('192.168.1.5', { port: 4000, tls: null })).toBe('http://192.168.1.5:4000');
        expect(roomAddressValue('192.168.1.5', { port: 80, tls: null })).toBe('http://192.168.1.5');
        // 0 = any free port (specs): no port to name.
        expect(roomAddressValue('192.168.1.5', { port: 0, tls: null })).toBe('http://192.168.1.5');
        expect(roomAddressValue('192.168.1.5', { port: 443, tls: { certFile: 'c', keyFile: 'k', caFile: null, reloadPollMs: 30_000 } })).toBe('192.168.1.5');
    });

    it('transmitter address: the configured bind address (present or not), else (dev) an IPv4 inside the CIDR', () => {
        expect(pickTransmitterAddress(ADDRS, testConfig())).toEqual({ value: '192.168.20.2', present: true });
        expect(pickTransmitterAddress(ADDRS.slice(0, 3), testConfig())).toEqual({ value: '192.168.20.2', present: false });
        const dev = testConfig({ transmitter: { bindAddress: null, networkCidr: '192.168.20.0/24' } });
        expect(pickTransmitterAddress(ADDRS, dev)).toEqual({ value: '192.168.20.2', present: true });
        // A transmitter network with no address of the box in it stays missing (the default route is not on it).
        expect(pickTransmitterAddress(ADDRS.slice(0, 3), dev, '10.40.1.5')).toEqual({ value: null, present: false });
    });

    it('transmitter address (dev, listening on every interface; user decision 2026-10-04): the default-route address, else the best ranked', () => {
        expect(pickTransmitterAddress(THIS_PC, THIS_BOX, '192.168.1.5')).toEqual({ value: '192.168.1.5', present: true });
        expect(pickTransmitterAddress(THIS_PC, THIS_BOX)).toEqual({ value: '192.168.1.5', present: true });
        expect(pickTransmitterAddress(ADDRS, testConfig({ transmitter: { bindAddress: '0.0.0.0', networkCidr: null } }), '10.40.1.5')).toEqual({ value: '10.40.1.5', present: true });
        expect(pickTransmitterAddress([ADDRS[0]], testConfig({ transmitter: { bindAddress: null, networkCidr: null } }))).toEqual({ value: null, present: false });
    });

    it('returns every NETWORK_CHECK_KEYS entry in order, with values and timings', () => {
        const checks = evaluateNetworkChecks(input());
        expect(checks.map(c => c.key)).toEqual([...NETWORK_CHECK_KEYS]);
        expect(checks).toEqual([
            { key: 'box-room-address', ok: true, level: 'ok', value: '10.40.1.5', ms: null, applies: true, resolver: null },
            { key: 'box-transmitter-address', ok: true, level: 'ok', value: '192.168.20.2', ms: null, applies: true, resolver: null },
            { key: 'internet', ok: true, level: 'ok', value: null, ms: 9, applies: true, resolver: null },
            { key: 'etabella-reachable', ok: true, level: 'ok', value: null, ms: 48, applies: true, resolver: null },
            { key: 'dns', ok: true, level: 'ok', value: 'etabella.net', ms: 12, applies: true, resolver: '192.168.10.1' },
            { key: 'clock-offset', ok: true, level: 'ok', value: null, ms: 3, applies: true, resolver: null },
        ]);
    });

    it('tells "Internet unavailable" from "Can\'t reach eTabella" (DR16)', () => {
        const cantReach = evaluateNetworkChecks(input({ etabellaProbe: ETABELLA_REFUSED }));
        expect(row(cantReach, 'internet')).toMatchObject({ ok: true });
        expect(row(cantReach, 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad', ms: null });
        const offline = evaluateNetworkChecks(input({ internet: { state: 'down', sinceMs: NOW - 60_000 }, internetProbe: failedDns('ETIMEOUT') }));
        expect(row(offline, 'internet')).toMatchObject({ ok: false, level: 'bad', ms: null });
        // The uplink's own view of the internet counts even when the DNS probe failed.
        expect(row(evaluateNetworkChecks(input({ internetProbe: failedDns() })), 'internet').ok).toBe(true);
    });

    it('re-runs keep the internet and eTabella rows honest: the live link first, a probe only while fresh (user decision 2026-10-04)', () => {
        const stale = NOW - OPS_NETWORK_PROBE_FRESH_MS - 1;
        const unknown = { state: 'unknown' as const, sinceMs: null };
        const at = (over: Partial<NetworkCheckInput>) => evaluateNetworkChecks(input(over));
        // An outage after the boot probe turns the row red: the uplink's state wins over an old ok probe, and over a
        // fresh one (the verdict's "Internet unavailable" reads the same state).
        expect(row(at({ internet: { state: 'down', sinceMs: NOW - 60_000 }, probedAtMs: stale }), 'internet')).toMatchObject({ ok: false, level: 'bad', ms: null });
        expect(row(at({ internet: { state: 'down', sinceMs: NOW - 60_000 } }), 'internet')).toMatchObject({ ok: false, level: 'bad', ms: null });
        // Up: ok; the DNS answer time only from a fresh probe.
        expect(row(at({ probedAtMs: stale }), 'internet')).toMatchObject({ ok: true, level: 'ok', ms: null });
        expect(row(at({ probedAtMs: NOW - OPS_NETWORK_PROBE_FRESH_MS }), 'internet')).toMatchObject({ ok: true, ms: 9 });
        // Unknown (boot): a fresh probe decides; a stale one reads not measured.
        expect(row(at({ internet: unknown }), 'internet')).toMatchObject({ ok: true, ms: 9 });
        expect(row(at({ internet: unknown, internetProbe: failedDns('ETIMEOUT') }), 'internet')).toMatchObject({ ok: false, level: 'bad' });
        expect(row(at({ internet: unknown, probedAtMs: stale }), 'internet')).toMatchObject({ ok: false, level: 'warn', ms: null });
        // eTabella: the uplink reaching it now, or a fresh probe that answered — never only the boot probe.
        expect(row(at({ probedAtMs: stale }), 'etabella-reachable')).toMatchObject({ ok: false, level: 'bad', ms: null });
        expect(row(at({ probedAtMs: stale, etabellaReachable: true }), 'etabella-reachable')).toMatchObject({ ok: true, level: 'ok', ms: null });
        expect(row(at({ etabellaReachable: true, etabellaProbe: ETABELLA_REFUSED }), 'etabella-reachable')).toMatchObject({ ok: true, ms: null });
        expect(row(at({ etabellaProbe: null, probedAtMs: null }), 'etabella-reachable')).toMatchObject({ ok: false, level: 'warn' });
    });

    it("eTabella is not reachable while the box's link to it cannot connect, though the website answers (review 2026-10-04)", () => {
        // The edge-sync gateway on etabella.net is down, or a venue proxy drops WebSockets: the HTTPS ping answers, the
        // box's link does not connect, and the banner reads "Can't reach eTabella". The row must not read ✓ beside it.
        const refused = (over: Partial<NetworkCheckInput> = {}) => row(evaluateNetworkChecks(input({ cloudCantReach: true, ...over })), 'etabella-reachable');
        expect(refused()).toEqual({ key: 'etabella-reachable', ok: false, level: 'bad', value: 'website answers · box link refused', ms: 48, applies: true, resolver: null });
        // The uplink's own ping answered (ops' probe is old): the same words, no time.
        expect(refused({ etabellaReachable: true, probedAtMs: NOW - OPS_NETWORK_PROBE_FRESH_MS - 1 })).toMatchObject({ ok: false, level: 'bad', value: 'website answers · box link refused', ms: null });
        // Nothing answers: plain not ok (the FE reads "can't reach eTabella"), bad even before a probe ran.
        expect(refused({ etabellaProbe: ETABELLA_REFUSED })).toMatchObject({ ok: false, level: 'bad', value: null, ms: null });
        expect(refused({ etabellaProbe: null, probedAtMs: null })).toMatchObject({ ok: false, level: 'bad', value: null, ms: null });
        // Linked again: ✓ as before.
        expect(row(evaluateNetworkChecks(input()), 'etabella-reachable')).toMatchObject({ ok: true, level: 'ok', value: null, ms: 48 });
    });

    it('the reporter-network address does not apply to a COM port: ok, muted, the port as its value (user decision 2026-10-04)', () => {
        const serial = evaluateNetworkChecks(input({ transmitterMode: 'serial', serialPath: 'COM13', transmitter: { value: null, present: false } }));
        expect(row(serial, 'box-transmitter-address')).toEqual({ key: 'box-transmitter-address', ok: true, level: 'ok', value: 'COM13', ms: null, applies: false, resolver: null });
        expect(serial.filter(c => !c.applies).map(c => c.key)).toEqual(['box-transmitter-address']);
        // Listen and dial (and no mode applied yet): a missing address stays bad.
        for (const transmitterMode of ['listen', 'dial', null] as const) {
            expect(row(evaluateNetworkChecks(input({ transmitterMode, transmitter: { value: null, present: false } })), 'box-transmitter-address')).toMatchObject({ ok: false, level: 'bad', applies: true });
        }
    });

    it('DNS: the name looked up as the value, the resolver only as an IPv4 ("via 192.168.1.1"; user decision 2026-10-04)', () => {
        expect(row(evaluateNetworkChecks(input({ dnsProbe: okDns(16, '192.168.1.1') })), 'dns')).toMatchObject({ ok: true, value: 'etabella.net', resolver: '192.168.1.1', ms: 16 });
        // The router's IPv6 link-local resolver is never shown.
        expect(row(evaluateNetworkChecks(input({ dnsProbe: okDns(16, 'fe80::4663:c2ff:fe3d:5608') })), 'dns')).toMatchObject({ ok: true, value: 'etabella.net', resolver: null });
        expect(row(evaluateNetworkChecks(input({ dnsHost: null })), 'dns').value).toBeNull();
    });

    it('a probe that was not run yet reads not ok, level warn; missing addresses are bad', () => {
        const never = evaluateNetworkChecks(
            input({
                internet: { state: 'unknown', sinceMs: null },
                probedAtMs: null,
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
        const at = (offsetMs: number, synced = true) => row(evaluateNetworkChecks(input({ clock: { synced, offsetMs } })), 'clock-offset');
        expect(at(-400)).toMatchObject({ ok: true, level: 'ok', ms: -400 });
        expect(at(2_000)).toMatchObject({ ok: false, level: 'warn', ms: 2_000 });
        expect(at(90_000)).toMatchObject({ ok: false, level: 'bad', ms: 90_000 });
        expect(at(10, false)).toMatchObject({ ok: false, level: 'warn' });
        expect(row(evaluateNetworkChecks(input({ dnsProbe: failedDns() })), 'dns')).toMatchObject({ ok: false, level: 'bad', value: 'etabella.net', resolver: '192.168.10.1', ms: null });
    });

    it('urlHost reads the cloud host', () => {
        expect(urlHost('https://etabella.net')).toBe('etabella.net');
        expect(urlHost('not a url')).toBeNull();
    });
});
