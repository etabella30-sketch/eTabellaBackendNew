/**
 * Network checks (D34, DR16; CONTRACTS.md §8.6): the box's two addresses, internet, etabella.net, DNS and the clock
 * offset, one `NetworkCheck` per NETWORK_CHECK_KEYS entry, in that order. Pure over the probe results (the probes
 * themselves are `OpsHost`); specs beside.
 */
import { EdgeCheckLevel, EdgeInternetStatus, isIpv4, NETWORK_CHECK_KEYS, NetworkCheck, NetworkCheckKey } from '../contracts';
import { BoxConfig, ipv4InCidr } from '../ports';
import type { OpsDnsProbe, OpsHttpsProbe, OpsInterfaceAddress } from './ops-host';
import { ClockFacts, clockLevel } from './readiness';

/** The address and whether this box actually holds it now. */
export interface AddressPick {
    readonly value: string | null;
    readonly present: boolean;
}

const usable = (a: OpsInterfaceAddress): boolean => !a.internal && isIpv4(a.address) && !a.address.startsWith('169.254.');

/**
 * "Address for people in the room" (DR16): the configured `http.host` when it is a concrete IPv4 (present on an
 * interface or not), else the first usable IPv4 that is not on the transmitter network.
 */
export function pickRoomAddress(addresses: readonly OpsInterfaceAddress[], config: Pick<BoxConfig, 'http' | 'transmitter'>): AddressPick {
    const host = config.http.host;
    if (isIpv4(host) && host !== '0.0.0.0') return { value: host, present: addresses.some(a => a.address === host) };
    const cidr = config.transmitter.networkCidr;
    const bind = config.transmitter.bindAddress;
    const room = addresses.find(a => usable(a) && a.address !== bind && !(cidr && ipv4InCidr(a.address, cidr)));
    return room ? { value: room.address, present: true } : { value: null, present: false };
}

/**
 * The box's own address on the transmitter (reporter) network — "Server address" on the reporter card: the
 * configured `transmitter.bindAddress` (present or not), else (dev) the first usable IPv4 inside `networkCidr`.
 */
export function pickTransmitterAddress(addresses: readonly OpsInterfaceAddress[], config: Pick<BoxConfig, 'transmitter'>): AddressPick {
    const bind = config.transmitter.bindAddress;
    if (bind && bind !== '0.0.0.0') return { value: bind, present: addresses.some(a => a.address === bind) };
    const cidr = config.transmitter.networkCidr;
    const found = cidr ? addresses.find(a => usable(a) && ipv4InCidr(a.address, cidr)) : undefined;
    return found ? { value: found.address, present: true } : { value: null, present: false };
}

export interface NetworkCheckInput {
    readonly room: AddressPick;
    readonly transmitter: AddressPick;
    /** The uplink's view (with hysteresis); `up` makes the internet check ok on its own. */
    readonly internet: EdgeInternetStatus;
    /** Recursive DNS of a public name through the box resolver; null = not probed. */
    readonly internetProbe: OpsDnsProbe | null;
    /** HTTPS to the cloud's ping URL; null = not probed. */
    readonly etabellaProbe: OpsHttpsProbe | null;
    /** Resolving the cloud host; null = not probed. */
    readonly dnsProbe: OpsDnsProbe | null;
    readonly clock: ClockFacts;
}

const check = (key: NetworkCheckKey, ok: boolean, level: EdgeCheckLevel, value: string | null, ms: number | null): NetworkCheck => ({
    key,
    ok,
    level: ok ? 'ok' : level,
    value,
    ms,
});

/** Every check, in NETWORK_CHECK_KEYS order. A probe that was not run reads not ok, level `warn`. */
export function evaluateNetworkChecks(input: NetworkCheckInput): NetworkCheck[] {
    const internetOk = input.internet.state === 'up' || !!input.internetProbe?.ok;
    const internetMeasured = input.internet.state !== 'unknown' || input.internetProbe !== null;
    const clockMeasured = input.clock.offsetMs !== null || input.clock.synced !== null;
    const clock = clockMeasured ? clockLevel(input.clock) : 'warn';
    const checks: NetworkCheck[] = [
        check('box-room-address', input.room.value !== null && input.room.present, 'bad', input.room.value, null),
        check('box-transmitter-address', input.transmitter.value !== null && input.transmitter.present, 'bad', input.transmitter.value, null),
        check('internet', internetOk, internetMeasured ? 'bad' : 'warn', null, input.internetProbe?.ok ? input.internetProbe.ms : null),
        check('etabella-reachable', !!input.etabellaProbe?.ok, input.etabellaProbe ? 'bad' : 'warn', null, input.etabellaProbe?.ok ? input.etabellaProbe.ms : null),
        check('dns', !!input.dnsProbe?.ok, input.dnsProbe ? 'bad' : 'warn', input.dnsProbe?.resolver ?? null, input.dnsProbe?.ok ? input.dnsProbe.ms : null),
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
