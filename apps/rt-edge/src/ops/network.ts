/**
 * Network checks (D34, DR16; CONTRACTS.md §8.6): the box's two addresses, internet, etabella.net, DNS and the clock
 * offset, one `NetworkCheck` per NETWORK_CHECK_KEYS entry, in that order. Pure over the probe results (the probes
 * themselves are `OpsHost`); specs beside.
 */
import { EdgeCheckLevel, EdgeInternetStatus, isIpv4, NETWORK_CHECK_KEYS, NetworkCheck, NetworkCheckKey, TransmitterMode } from '../contracts';
import { BoxConfig, ipv4InCidr } from '../ports';
import { OPS_NETWORK_PROBE_FRESH_MS } from './ops.constants';
import type { OpsDnsProbe, OpsHttpsProbe, OpsInterfaceAddress } from './ops-host';
import { ClockFacts, clockLevel } from './readiness';

/** The address and whether this box actually holds it now. */
export interface AddressPick {
    readonly value: string | null;
    readonly present: boolean;
}

const usableIp = (ip: string | null | undefined): ip is string =>
    !!ip && isIpv4(ip) && ip !== '0.0.0.0' && !ip.startsWith('127.') && !ip.startsWith('169.254.');
const usable = (a: OpsInterfaceAddress): boolean => !a.internal && usableIp(a.address);

const PRIVATE_CIDRS: readonly string[] = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
/** Ranges VPN overlays hand out: 25/8 and 26/8 (Hamachi, Radmin VPN), 100.64/10 (carrier-grade NAT; Tailscale). */
const VPN_CIDRS: readonly string[] = ['25.0.0.0/8', '26.0.0.0/8', '100.64.0.0/10'];
/** Adapter names of VPN overlays and virtual switches (Hyper-V / WSL "vEthernet", VirtualBox, VMware, Docker, …). */
const VIRTUAL_NAME_RE = /radmin|hamachi|vethernet|virtualbox|vbox|vmware|vmnet|docker|virbr|veth|tailscale|zerotier|wireguard|openvpn|\bvpn\b|hyper-v|\bwsl\b|^br-|^tun\d|^tap\d|^utun\d|^wg\d/i;

/** A VPN overlay or a virtual switch, by adapter name or by address range: never what the room reaches first. */
export function isVirtualAdapter(a: Pick<OpsInterfaceAddress, 'name' | 'address'>): boolean {
    return VIRTUAL_NAME_RE.test(a.name ?? '') || VPN_CIDRS.some(c => ipv4InCidr(a.address, c));
}

/**
 * The box's usable IPv4 addresses, best first (user decision 2026-10-04): the default-route one (the address the OS
 * sends from, `OpsHost.defaultRouteIpv4`), then private ranges, then the rest, VPN / virtual adapters last; the OS
 * order is kept inside each group. `os.networkInterfaces()` lists adapters in no useful order (on the box PC Radmin VPN
 * and Hamachi come before the Wi-Fi). Loopback, link-local and duplicates are left out.
 *
 * The default route leads only while it is a usable address of an adapter in `addresses` that is not a VPN or virtual
 * one (review 2026-10-04): the reading can be up to two minutes old (the Wi-Fi dropped, a new DHCP lease), and on a
 * full-tunnel VPN the OS routes from the tunnel's address. Otherwise the groups alone decide.
 */
export function rankAddresses(addresses: readonly OpsInterfaceAddress[], defaultRoute: string | null): string[] {
    const group = (a: OpsInterfaceAddress): number => (isVirtualAdapter(a) ? 2 : PRIVATE_CIDRS.some(c => ipv4InCidr(a.address, c)) ? 0 : 1);
    const listed = addresses.filter(usable);
    const ranked = listed
        .map((a, i) => ({ a, i, g: group(a) }))
        .sort((x, y) => x.g - y.g || x.i - y.i)
        .map(x => x.a.address);
    const route = usableIp(defaultRoute) && listed.some(a => a.address === defaultRoute && !isVirtualAdapter(a)) ? [defaultRoute] : [];
    return [...new Set([...route, ...ranked])];
}

/**
 * What people in the room open at `ip`: the bare IPv4 with TLS (the box's https name resolves to it), else
 * `http://<ip>:<port>` — a plain-HTTP box (dev, `http.tls: null`) is not reached on 443. Port 80, and 0 ("any free
 * port", specs), are left out.
 */
export function roomAddressValue(ip: string, http: Pick<BoxConfig['http'], 'port' | 'tls'>): string {
    if (http.tls) return ip;
    return http.port && http.port !== 80 ? `http://${ip}:${http.port}` : `http://${ip}`;
}

/**
 * "Address for people in the room" (DR16): the configured `http.host` when it is a concrete IPv4 (present on an
 * interface or not), else the best-ranked usable IPv4 that is not on the transmitter network (`rankAddresses`: the
 * default-route address first). In the `roomAddressValue` form.
 */
export function pickRoomAddress(addresses: readonly OpsInterfaceAddress[], config: Pick<BoxConfig, 'http' | 'transmitter'>, defaultRoute: string | null = null): AddressPick {
    const host = config.http.host;
    if (isIpv4(host) && host !== '0.0.0.0') return { value: roomAddressValue(host, config.http), present: addresses.some(a => a.address === host) };
    const cidr = config.transmitter.networkCidr;
    const bind = config.transmitter.bindAddress;
    const room = rankAddresses(addresses, defaultRoute).find(ip => ip !== bind && !(cidr && ipv4InCidr(ip, cidr)));
    return room ? { value: roomAddressValue(room, config.http), present: true } : { value: null, present: false };
}

/**
 * The box's own address on the transmitter (reporter) network — "Server address" on the reporter card: the
 * configured `transmitter.bindAddress` (present or not), else (dev) the first usable IPv4 inside `networkCidr`. A dev
 * box with neither listens on every interface: the reporter reaches it on its default-route address, else the best
 * ranked one (user decision 2026-10-04).
 */
export function pickTransmitterAddress(addresses: readonly OpsInterfaceAddress[], config: Pick<BoxConfig, 'transmitter'>, defaultRoute: string | null = null): AddressPick {
    const bind = config.transmitter.bindAddress;
    if (bind && bind !== '0.0.0.0') return { value: bind, present: addresses.some(a => a.address === bind) };
    const cidr = config.transmitter.networkCidr;
    const found = cidr ? rankAddresses(addresses, null).find(ip => ipv4InCidr(ip, cidr)) : rankAddresses(addresses, defaultRoute)[0];
    return found ? { value: found, present: true } : { value: null, present: false };
}

export interface NetworkCheckInput {
    readonly nowMs: number;
    readonly room: AddressPick;
    readonly transmitter: AddressPick;
    /** The applied transmitter mode and COM port: `box-transmitter-address` does not apply to a COM port. */
    readonly transmitterMode: TransmitterMode | null;
    readonly serialPath: string | null;
    /** The uplink's view (with hysteresis): `up` / `down` decide the internet check; a probe speaks only while `unknown`. */
    readonly internet: EdgeInternetStatus;
    /** The uplink reaches etabella.net now (`UplinkPort.etabellaReachable()`). */
    readonly etabellaReachable: boolean;
    /**
     * The uplink's cloud state is `cant-reach-etabella` (`UplinkPort.cloudLink()`): the box's link to etabella.net does
     * not connect, whatever an HTTPS ping says.
     */
    readonly cloudCantReach: boolean;
    /** When the probes below last ran; null = never. A probe older than OPS_NETWORK_PROBE_FRESH_MS is not used by internet / eTabella. */
    readonly probedAtMs: number | null;
    /** Recursive DNS of a public name through the box resolver; null = not probed. */
    readonly internetProbe: OpsDnsProbe | null;
    /** HTTPS to the cloud's ping URL; null = not probed. */
    readonly etabellaProbe: OpsHttpsProbe | null;
    /** Resolving the cloud host; null = not probed. */
    readonly dnsProbe: OpsDnsProbe | null;
    /** The name the `dns` check looks up ("etabella.net"); null when the cloud origin has none. */
    readonly dnsHost: string | null;
    readonly clock: ClockFacts;
}

const check = (key: NetworkCheckKey, ok: boolean, level: EdgeCheckLevel, value: string | null, ms: number | null, extra: Partial<Pick<NetworkCheck, 'applies' | 'resolver'>> = {}): NetworkCheck => ({
    key,
    ok,
    level: ok ? 'ok' : level,
    value,
    ms,
    applies: extra.applies ?? true,
    resolver: extra.resolver ?? null,
});

/** The `etabella-reachable` value while the website answers but the box's link to etabella.net does not connect. */
export const ETABELLA_LINK_REFUSED_VALUE = 'website answers · box link refused';

/**
 * Every check, in NETWORK_CHECK_KEYS order. A probe that was not run reads not ok, level `warn`. Since the checks
 * re-run by themselves (user decision 2026-10-04), `internet` and `etabella-reachable` must not keep a boot-time
 * answer: the uplink's live state decides, and a probe counts only while fresh.
 *
 * `etabella-reachable` is never ok while the uplink's cloud state is `cant-reach-etabella` (review 2026-10-04): the
 * edge-sync gateway can be down, or a venue proxy can drop WebSockets, while the website still answers the HTTPS ping,
 * and the row then read ✓ beside the "Can't reach eTabella" banner. When a ping answers it says so
 * (ETABELLA_LINK_REFUSED_VALUE).
 */
export function evaluateNetworkChecks(input: NetworkCheckInput): NetworkCheck[] {
    const fresh = input.probedAtMs !== null && input.nowMs - input.probedAtMs <= OPS_NETWORK_PROBE_FRESH_MS;
    const freshOk = (probe: { readonly ok: boolean } | null): boolean => fresh && !!probe?.ok;
    const net = input.internet.state;
    const internetOk = net === 'up' || (net === 'unknown' && freshOk(input.internetProbe));
    const internetLevel: EdgeCheckLevel = net === 'down' || (net === 'unknown' && fresh && input.internetProbe !== null) ? 'bad' : 'warn';
    const websiteAnswers = input.etabellaReachable || freshOk(input.etabellaProbe);
    const etabellaOk = websiteAnswers && !input.cloudCantReach;
    const etabellaValue = input.cloudCantReach && websiteAnswers ? ETABELLA_LINK_REFUSED_VALUE : null;
    const etabellaLevel: EdgeCheckLevel = input.cloudCantReach || input.etabellaProbe ? 'bad' : 'warn';
    // The readiness rule (user decision 2026-10-05): what the lines follow decides; unmeasured on the box clock is warn.
    const clock = clockLevel(input.clock);
    const resolver = input.dnsProbe?.resolver && isIpv4(input.dnsProbe.resolver) ? input.dnsProbe.resolver : null;
    const transmitter =
        input.transmitterMode === 'serial'
            ? check('box-transmitter-address', true, 'ok', input.serialPath, null, { applies: false })
            : check('box-transmitter-address', input.transmitter.value !== null && input.transmitter.present, 'bad', input.transmitter.value, null);
    const checks: NetworkCheck[] = [
        check('box-room-address', input.room.value !== null && input.room.present, 'bad', input.room.value, null),
        transmitter,
        check('internet', internetOk, internetLevel, null, internetOk && freshOk(input.internetProbe) ? input.internetProbe!.ms : null),
        check('etabella-reachable', etabellaOk, etabellaLevel, etabellaValue, freshOk(input.etabellaProbe) ? input.etabellaProbe!.ms : null),
        check('dns', !!input.dnsProbe?.ok, input.dnsProbe ? 'bad' : 'warn', input.dnsHost, input.dnsProbe?.ok ? input.dnsProbe.ms : null, { resolver }),
        check('clock-offset', clock === 'ok', clock, null, input.clock.offsetMs === null ? null : Math.round(input.clock.offsetMs)),
    ];
    return NETWORK_CHECK_KEYS.map(key => checks.find(c => c.key === key) as NetworkCheck);
}

/** The hostname of an absolute URL; null when unreadable. */
export function urlHost(url: string): string | null {
    try {
        return new URL(url).hostname || null;
    } catch {
        return null;
    }
}
