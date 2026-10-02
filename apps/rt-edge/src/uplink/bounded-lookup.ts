/**
 * Cloud host-name resolution that never holds libuv's threadpool for long (review 28).
 *
 * `dns.lookup` (getaddrinfo) runs on the same small threadpool as the raw journal's writes and fdatasyncs. With the
 * WAN down and a resolver that black-holes queries, a few concurrent lookups (the reachability probe, a reconnect,
 * the ops probe, proxied reads) can each hold a pool thread for seconds and delay journal durability, so the CAT →
 * room path. This lookup asks DNS through c-ares instead (`dns.Resolver`: its own sockets, no pool thread) with a
 * hard deadline. Only a definite "no such name" falls back to `dns.lookup`, for names that live in the hosts file
 * (fast, local). An IP literal is answered at once. A timeout answers EAI_AGAIN, which the box reads as "no
 * internet" (cloud-http.ts `isNoInternet`).
 *
 * The box process also raises UV_THREADPOOL_SIZE (main.ts, docker/edge/docker-compose.yml), which covers the lookups
 * that do not go through here (socket.io's websocket connect, the LAN cloud proxy).
 */
import * as dns from 'dns';
import * as net from 'net';

/** Deadline of one cloud name resolution (A and AAAA asked together). */
export const CLOUD_DNS_TIMEOUT_MS = 3_000;

export interface BoundedLookupDeps {
    /** A records; rejects with the c-ares code (ENOTFOUND, ENODATA, ETIMEOUT, ...). */
    resolve4(host: string, timeoutMs: number): Promise<string[]>;
    /** AAAA records, likewise. */
    resolve6(host: string, timeoutMs: number): Promise<string[]>;
    /** The hosts-file path for a name DNS does not know (default dns.lookup with all:true). */
    fallback(host: string, family: 0 | 4 | 6): Promise<dns.LookupAddress[]>;
}

const NOT_IN_DNS: ReadonlySet<string> = new Set(['ENOTFOUND', 'ENODATA', 'NXDOMAIN']);

function caresQuery(kind: 'resolve4' | 'resolve6', host: string, timeoutMs: number): Promise<string[]> {
    const resolver = new dns.promises.Resolver({ timeout: Math.max(1, timeoutMs), tries: 1 });
    let timer: NodeJS.Timeout | undefined;
    return Promise.race([
        resolver[kind](host),
        new Promise<string[]>((_, reject) => {
            timer = setTimeout(() => {
                resolver.cancel();
                reject(Object.assign(new Error(`DNS ${kind === 'resolve4' ? 'A' : 'AAAA'} query for ${host} timed out after ${timeoutMs} ms`), { code: 'ETIMEOUT' }));
            }, timeoutMs);
            timer.unref?.();
        }),
    ]).finally(() => {
        if (timer) clearTimeout(timer);
    });
}

export const caresLookupDeps: BoundedLookupDeps = {
    resolve4: (host, ms) => caresQuery('resolve4', host, ms),
    resolve6: (host, ms) => caresQuery('resolve6', host, ms),
    fallback: (host, family) => dns.promises.lookup(host, { all: true, family }),
};

function familyOf(value: unknown): 0 | 4 | 6 {
    if (value === 4 || value === 'IPv4') return 4;
    if (value === 6 || value === 'IPv6') return 6;
    return 0;
}

/** Resolve `host` (A and/or AAAA per `family`) within `timeoutMs`; IPv4 first. */
export async function resolveBounded(host: string, family: 0 | 4 | 6, timeoutMs: number, deps: BoundedLookupDeps = caresLookupDeps): Promise<dns.LookupAddress[]> {
    const asks: Array<Promise<dns.LookupAddress[]>> = [];
    if (family !== 6) asks.push(deps.resolve4(host, timeoutMs).then(list => list.map(address => ({ address, family: 4 }))));
    if (family !== 4) asks.push(deps.resolve6(host, timeoutMs).then(list => list.map(address => ({ address, family: 6 }))));
    const settled = await Promise.allSettled(asks);
    const found = settled.flatMap(s => (s.status === 'fulfilled' ? s.value : []));
    if (found.length) return found;
    const codes = settled.map(s => (s.status === 'rejected' ? String((s.reason as NodeJS.ErrnoException)?.code ?? '') : 'ENODATA'));
    if (codes.every(code => NOT_IN_DNS.has(code))) {
        const local = await deps.fallback(host, family);
        if (local.length) return local;
        throw Object.assign(new Error(`getaddrinfo ENOTFOUND ${host}`), { code: 'ENOTFOUND', hostname: host });
    }
    // No answer in time (or a server failure): the internet, or at least DNS, is not usable now.
    throw Object.assign(new Error(`getaddrinfo EAI_AGAIN ${host} (${codes.join(', ')})`), { code: 'EAI_AGAIN', hostname: host });
}

/** A `lookup` for http(s).request / net.connect built on `resolveBounded` (supports `all`, as autoSelectFamily asks). */
export function boundedLookup(timeoutMs: number = CLOUD_DNS_TIMEOUT_MS, deps: BoundedLookupDeps = caresLookupDeps): net.LookupFunction {
    return (hostname, options, callback) => {
        const opts = (options && typeof options === 'object' ? options : {}) as dns.LookupOptions;
        const all = opts.all === true;
        const answer = (err: NodeJS.ErrnoException | null, list: dns.LookupAddress[]): void => {
            if (err) callback(err, all ? [] : '', 0);
            else if (all) callback(null, list);
            else callback(null, list[0].address, list[0].family);
        };
        const ip = net.isIP(hostname);
        if (ip) {
            process.nextTick(() => answer(null, [{ address: hostname, family: ip }]));
            return;
        }
        resolveBounded(hostname, familyOf(opts.family), timeoutMs, deps).then(
            list => answer(null, list),
            (err: NodeJS.ErrnoException) => answer(err, []),
        );
    };
}
