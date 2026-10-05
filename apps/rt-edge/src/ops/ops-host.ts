/**
 * The box host as ops sees it: disk, directory sizes, interfaces, chrony, the UPS, DNS, an HTTPS probe, file removal
 * and the clock step (token OPS_HOST). Everything that touches the OS or the network sits behind this interface, so
 * the ops logic is pure over its results and specs inject `FakeOpsHost` (ops/testing) — no spec reaches the network.
 *
 * `NodeOpsHost` is the production implementation, Node 24 built-ins only (node:fs, node:os, node:dns, node:https,
 * node:child_process). Every probe is bounded by a timeout and never throws: a failure is a result.
 *
 * Clock and UPS inside the container (docker/edge/README.md "Host status for the container"): the container cannot
 * run `chronyc` or `upsc`; the host's `etabella-edge-hoststatus` service writes their raw output every 10 s into
 * `/run/etabella-edge/host/` (`chrony-tracking.csv`, `ups.txt`), mounted read-only. A file older than 60 s is stale
 * (= not measured); a MISSING file falls back to running the command (a box installed without the container).
 */
import { execFile } from 'child_process';
import * as dgram from 'dgram';
import * as dns from 'dns';
import * as fs from 'fs';
import * as https from 'https';
import * as os from 'os';
import * as path from 'path';

import { Inject, Injectable, Optional } from '@nestjs/common';

import { isIpv4 } from '../contracts';
import { boundedLookup, CLOUD_DNS_TIMEOUT_MS } from '../uplink/bounded-lookup';

/** DI token of `OpsHost`. */
export const OPS_HOST = 'RT_EDGE_OPS_HOST';
/** DI token of `OpsTimers`. */
export const OPS_TIMERS = 'RT_EDGE_OPS_TIMERS';
/** Optional DI token: the host-status directory (default OPS_HOST_STATUS_DIR). */
export const OPS_HOST_STATUS_DIR_TOKEN = 'RT_EDGE_OPS_HOST_STATUS_DIR';

/** Where `etabella-edge-hoststatus.sh` publishes chrony and UPS state (docker-compose.yml bind mount). */
export const OPS_HOST_STATUS_DIR = '/run/etabella-edge/host';
/** A host-status file older than this is stale (the script runs every 10 s). */
export const OPS_HOST_STATUS_MAX_AGE_MS = 60_000;

const MIB = 1024 * 1024;

export interface OpsDiskUsage {
    /** Free space available to the box process, MiB (floor). */
    readonly freeMB: number;
    readonly totalMB: number;
}

/** A clock reading: box clock minus the reference, ms (positive = the box is ahead). */
export interface OpsClockReading {
    readonly offsetMs: number;
    /** chrony: leap status is not "Not synchronised"; cloud: |offset| < 1 s; http-date: never (1 s resolution). */
    readonly synced: boolean;
    readonly source: 'chrony' | 'cloud' | 'http-date';
}

export interface OpsInterfaceAddress {
    readonly name: string;
    readonly address: string;
    readonly internal: boolean;
}

export interface OpsDnsProbe {
    readonly ok: boolean;
    /** Lookup time, ms; null when it did not finish. */
    readonly ms: number | null;
    /** The first configured IPv4 resolver ("192.168.1.1", `firstIpv4Resolver`); null when only IPv6 ones are known. */
    readonly resolver: string | null;
    /** Error class ('timeout', 'ENOTFOUND', …); null when ok. */
    readonly error: string | null;
}

export interface OpsHttpsProbe {
    /** Any HTTP answer (with a valid certificate) counts as reachable. */
    readonly ok: boolean;
    readonly status: number | null;
    /** Round trip, ms; null when no answer. */
    readonly ms: number | null;
    /** The answer's `Date` header (epoch ms, 1 s resolution); null when absent. */
    readonly serverDateMs: number | null;
    /** Box clock when the request was sent and when the answer arrived (for an RTT-corrected offset). */
    readonly sentAtMs: number;
    readonly receivedAtMs: number | null;
    readonly error: string | null;
}

export interface OpsHost {
    /** Usage of the filesystem holding `dir` (or its nearest existing parent); null when it cannot be read. */
    disk(dir: string): OpsDiskUsage | null;
    /** Bytes of the regular files under `dir` (0 when it does not exist); null when it cannot be read. */
    dirBytes(dir: string): number | null;
    /** IPv4 interface addresses. */
    ipv4Addresses(): readonly OpsInterfaceAddress[];
    /** Seconds since the box process started. */
    uptimeSec(): number;
    /** chrony's view of the clock; null when not available or stale. Never rejects. */
    chrony(): Promise<OpsClockReading | null>;
    /** NUT: true on battery, false on mains, null without a (fresh) UPS reading. Never rejects. */
    upsOnBattery(): Promise<boolean | null>;
    /** Resolve `host` (A records) with the system resolver within `timeoutMs`. Never rejects. */
    resolve(host: string, timeoutMs: number): Promise<OpsDnsProbe>;
    /** GET `url` with certificate validation within `timeoutMs`. Never rejects. */
    httpsProbe(url: string, timeoutMs: number): Promise<OpsHttpsProbe>;
    /** Remove a file or directory tree (retention purge). Missing = done. */
    remove(target: string): Promise<void>;
    /**
     * Step the system clock to `targetMs` (spec §10 #8 cloud-time fallback; the container holds CAP_SYS_TIME and
     * shares the host clock). Resolves true when the clock was set. Never rejects.
     */
    stepClock(targetMs: number): Promise<boolean>;
    /**
     * The IPv4 the OS sends from on its default route (`defaultRouteIpv4`): what the room and the reporter reach on a
     * box with no configured address (user decision 2026-10-04). Null without a route or within `timeoutMs`. Never
     * rejects.
     */
    defaultRouteIpv4(timeoutMs: number): Promise<string | null>;
    /**
     * A Windows box (no chrony): whether Windows Time keeps the clock synced (`w32tm /query /status`,
     * `parseW32tmStatus`; user decision 2026-10-04). Null on any other system or when it cannot be read. Never rejects.
     */
    windowsTimeSynced(): Promise<boolean | null>;
}

/** Interval timers (specs drive them by hand). */
export interface OpsTimers {
    setInterval(fn: () => void, ms: number): unknown;
    clearInterval(handle: unknown): void;
}

/** Node timers, unref'd (ops never keeps the process alive). */
export const NODE_OPS_TIMERS: OpsTimers = Object.freeze({
    setInterval: (fn: () => void, ms: number): unknown => {
        const handle = setInterval(fn, ms);
        handle.unref?.();
        return handle;
    },
    clearInterval: (handle: unknown): void => clearInterval(handle as NodeJS.Timeout),
});

// ---------------------------------------------------------------------------------------------------------------
// Parsers (pure; specs beside)
// ---------------------------------------------------------------------------------------------------------------

/**
 * `chronyc -c tracking` (one CSV line): ref id, ref name, stratum, ref time, SYSTEM TIME, last offset, RMS offset,
 * frequency, residual freq, skew, root delay, root dispersion, update interval, leap status. "System time" is
 * chrony's current correction in seconds: positive = the system clock is SLOW of NTP time, so the box-minus-reference
 * offset is its negation. Synced unless the leap status reads "Not synchronised" (or the reference id is 0).
 * Null for anything it cannot read.
 */
export function parseChronyTracking(output: string): OpsClockReading | null {
    const line = String(output ?? '')
        .split(/\r?\n/)
        .map(l => l.trim())
        .find(l => l.length > 0);
    if (!line) return null;
    const fields = line.split(',');
    if (fields.length < 14) return null;
    const correctionSec = Number(fields[4]);
    if (!Number.isFinite(correctionSec) || fields[4].trim() === '') return null;
    const leap = fields[13].trim().toLowerCase();
    const refId = fields[0].trim();
    const synced = leap !== 'not synchronised' && leap !== 'not synchronized' && !/^0+$/.test(refId);
    const offsetMs = -correctionSec * 1000;
    return { offsetMs: Object.is(offsetMs, -0) ? 0 : offsetMs, synced, source: 'chrony' };
}

/** NUT `ups.status` flags ("OL", "OB DISCHRG", "OL CHRG LB", …): true on battery, false online, null otherwise. */
export function parseUpsStatus(output: string): boolean | null {
    const flags = String(output ?? '')
        .trim()
        .toUpperCase()
        .split(/\s+/)
        .filter(Boolean);
    if (flags.includes('OB')) return true;
    if (flags.includes('OL')) return false;
    return null;
}

/** A full `upsc <ups>` report (`key: value` lines): its `ups.status`; a bare status line is read as is. */
export function parseUpsReport(output: string): boolean | null {
    const text = String(output ?? '');
    const line = text.split(/\r?\n/).find(l => /^\s*ups\.status\s*:/i.test(l));
    if (line) return parseUpsStatus(line.slice(line.indexOf(':') + 1));
    return /:/.test(text) ? null : parseUpsStatus(text);
}

/**
 * `w32tm /query /status` (Windows Time, English display language; user decision 2026-10-04): false when the leap
 * indicator is 3 ("not synchronized") or the source is the PC's own clock ("Local CMOS Clock", "Free-running System
 * Clock") — Windows is then not syncing at all; true when either line reads otherwise; null when neither line is
 * there (another display language, the service stopped): never a guess.
 */
export function parseW32tmStatus(output: string): boolean | null {
    const text = String(output ?? '');
    const leap = /^\s*Leap Indicator:\s*(\d)/im.exec(text);
    const source = /^\s*Source:\s*(.*?)\s*$/im.exec(text);
    if (!leap && !source) return null;
    if (leap?.[1] === '3') return false;
    if (source && /local cmos clock|free-running system clock/i.test(source[1])) return false;
    return true;
}

/**
 * The first IPv4 of a `dns.getServers()` list ("192.168.1.1"; a non-default ":port" dropped); null when only IPv6
 * resolvers are configured. A router often hands out its IPv6 link-local address first (fe80::…), which says nothing
 * to the person reading "via …".
 */
export function firstIpv4Resolver(servers: readonly string[]): string | null {
    for (const server of servers ?? []) {
        const m = /^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/.exec(String(server ?? '').trim());
        if (m && isIpv4(m[1])) return m[1];
    }
    return null;
}

/** Where the default-route lookup "connects" (a public IPv4 literal: no DNS lookup, and a UDP connect sends nothing). */
export const OPS_DEFAULT_ROUTE_PROBE = Object.freeze({ host: '1.1.1.1', port: 53 });

/**
 * The IPv4 this machine sends from on its default route: a UDP socket "connects" to a public address (the OS only
 * picks the route and the source address; no packet is sent), then reads its own address. Null without a route
 * (offline LAN), on any error, or after `timeoutMs`. Never rejects. Shared by ops and the box console.
 */
export function defaultRouteIpv4(timeoutMs: number): Promise<string | null> {
    return new Promise(resolve => {
        let socket: dgram.Socket | undefined;
        let done = false;
        const finish = (value: string | null): void => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            try {
                socket?.close();
            } catch {
                /* already closed */
            }
            resolve(value);
        };
        const timer = setTimeout(() => finish(null), Math.max(1, timeoutMs));
        timer.unref?.();
        try {
            socket = dgram.createSocket('udp4');
            socket.unref();
            socket.on('error', () => finish(null));
            socket.connect(OPS_DEFAULT_ROUTE_PROBE.port, OPS_DEFAULT_ROUTE_PROBE.host, () => {
                try {
                    const address = socket?.address().address ?? '';
                    finish(isIpv4(address) && address !== '0.0.0.0' ? address : null);
                } catch {
                    finish(null);
                }
            });
        } catch {
            finish(null);
        }
    });
}

/** Box clock minus the server's `Date` header, RTT-corrected (the header truncates to the second: +500 ms). */
export function httpDateOffsetMs(probe: Pick<OpsHttpsProbe, 'serverDateMs' | 'sentAtMs' | 'receivedAtMs'>): number | null {
    if (probe.serverDateMs === null || probe.receivedAtMs === null) return null;
    const midpoint = probe.sentAtMs + (probe.receivedAtMs - probe.sentAtMs) / 2;
    return Math.round(midpoint - (probe.serverDateMs + 500));
}

// ---------------------------------------------------------------------------------------------------------------
// Production implementation
// ---------------------------------------------------------------------------------------------------------------

const errorClass = (err: unknown): string => {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (typeof code === 'string' && code) return code;
    return err instanceof Error ? err.message : String(err);
};

function run(file: string, args: readonly string[], timeoutMs: number): Promise<string | null> {
    return new Promise(resolve => {
        try {
            execFile(file, [...args], { timeout: timeoutMs, windowsHide: true, maxBuffer: 64 * 1024 }, (err, stdout) => {
                resolve(err ? null : String(stdout));
            });
        } catch {
            resolve(null);
        }
    });
}

/** A host-status file: its text when fresh, 'stale' when older than the max age, null when missing / unreadable. */
export function readHostStatusFile(file: string, nowMs: number, maxAgeMs = OPS_HOST_STATUS_MAX_AGE_MS): string | 'stale' | null {
    try {
        const st = fs.statSync(file);
        if (!st.isFile()) return null;
        if (nowMs - st.mtimeMs > maxAgeMs) return 'stale';
        return fs.readFileSync(file, 'utf8');
    } catch {
        return null;
    }
}

/** Walk at most this many entries per directory size (a box holds dozens of journal segments). */
const DIR_WALK_LIMIT = 200_000;

@Injectable()
export class NodeOpsHost implements OpsHost {
    private readonly startedAtMs = Date.now() - Math.round(process.uptime() * 1000);
    private readonly statusDir: string;

    constructor(@Optional() @Inject(OPS_HOST_STATUS_DIR_TOKEN) statusDir?: string) {
        this.statusDir = statusDir || OPS_HOST_STATUS_DIR;
    }

    disk(dir: string): OpsDiskUsage | null {
        let probe = path.resolve(dir);
        for (;;) {
            try {
                const st = fs.statfsSync(probe);
                const bsize = Number(st.bsize);
                return { freeMB: Math.floor((Number(st.bavail) * bsize) / MIB), totalMB: Math.floor((Number(st.blocks) * bsize) / MIB) };
            } catch (err) {
                const parent = path.dirname(probe);
                if (errorClass(err) !== 'ENOENT' || parent === probe) return null;
                probe = parent;
            }
        }
    }

    dirBytes(dir: string): number | null {
        const root = path.resolve(dir);
        let total = 0;
        let seen = 0;
        const stack = [root];
        while (stack.length) {
            const current = stack.pop() as string;
            let entries: fs.Dirent[];
            try {
                entries = fs.readdirSync(current, { withFileTypes: true });
            } catch (err) {
                if (errorClass(err) === 'ENOENT') {
                    if (current === root) return 0;
                    continue;
                }
                return null;
            }
            for (const entry of entries) {
                if (++seen > DIR_WALK_LIMIT) return total;
                const full = path.join(current, entry.name);
                if (entry.isDirectory()) stack.push(full);
                else if (entry.isFile()) {
                    try {
                        total += fs.lstatSync(full).size;
                    } catch {
                        /* removed meanwhile */
                    }
                }
            }
        }
        return total;
    }

    ipv4Addresses(): readonly OpsInterfaceAddress[] {
        const out: OpsInterfaceAddress[] = [];
        for (const [name, list] of Object.entries(os.networkInterfaces())) {
            for (const info of list ?? []) {
                const family = info.family as unknown;
                if (family === 'IPv4' || family === 4) out.push({ name, address: info.address, internal: info.internal });
            }
        }
        return out;
    }

    uptimeSec(): number {
        return Math.max(0, Math.floor((Date.now() - this.startedAtMs) / 1000));
    }

    async chrony(): Promise<OpsClockReading | null> {
        const published = readHostStatusFile(path.join(this.statusDir, 'chrony-tracking.csv'), Date.now());
        if (published === 'stale') return null;
        if (published !== null) return parseChronyTracking(published);
        const out = await run('chronyc', ['-c', 'tracking'], 2_000);
        return out === null ? null : parseChronyTracking(out);
    }

    async upsOnBattery(): Promise<boolean | null> {
        const published = readHostStatusFile(path.join(this.statusDir, 'ups.txt'), Date.now());
        if (published === 'stale') return null;
        if (published !== null) return parseUpsReport(published);
        const list = await run('upsc', ['-l'], 2_000);
        const name = list
            ?.split(/\r?\n/)
            .map(l => l.trim())
            .find(l => /^[A-Za-z0-9_.-]+$/.test(l));
        if (!name) return null;
        const status = await run('upsc', [`${name}@localhost`, 'ups.status'], 2_000);
        return status === null ? null : parseUpsStatus(status);
    }

    async resolve(host: string, timeoutMs: number): Promise<OpsDnsProbe> {
        const resolver = new dns.promises.Resolver({ timeout: Math.max(1, timeoutMs), tries: 1 });
        const server = firstIpv4Resolver(resolver.getServers());
        const started = Date.now();
        let timer: NodeJS.Timeout | undefined;
        try {
            const outcome = await Promise.race([
                resolver.resolve4(host).then(
                    addresses => ({ ok: addresses.length > 0, error: addresses.length > 0 ? null : 'ENODATA' }),
                    (err: unknown) => ({ ok: false, error: errorClass(err) }),
                ),
                new Promise<{ ok: false; error: string }>(resolve => {
                    timer = setTimeout(() => resolve({ ok: false, error: 'timeout' }), timeoutMs);
                    timer.unref?.();
                }),
            ]);
            if (outcome.error === 'timeout') resolver.cancel();
            return { ok: outcome.ok, ms: outcome.ok ? Date.now() - started : null, resolver: server, error: outcome.error };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    httpsProbe(url: string, timeoutMs: number): Promise<OpsHttpsProbe> {
        const sentAtMs = Date.now();
        return new Promise(resolve => {
            let settled = false;
            let req: ReturnType<typeof https.request> | undefined;
            const timer = setTimeout(() => {
                fail('timeout');
                req?.destroy();
            }, timeoutMs);
            timer.unref?.();
            function finish(result: Omit<OpsHttpsProbe, 'sentAtMs'>): void {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve({ ...result, sentAtMs });
            }
            function fail(error: string): void {
                finish({ ok: false, status: null, ms: null, serverDateMs: null, receivedAtMs: null, error });
            }
            try {
                // The host name through c-ares with a deadline, never a long getaddrinfo on the journal's threadpool
                // (uplink/bounded-lookup.ts, review 28).
                req = https.request(url, { method: 'GET', agent: false, rejectUnauthorized: true, headers: { 'cache-control': 'no-cache' }, lookup: boundedLookup(Math.min(timeoutMs, CLOUD_DNS_TIMEOUT_MS)) }, res => {
                    const receivedAtMs = Date.now();
                    const date = Date.parse(String(res.headers.date ?? ''));
                    finish({
                        ok: true,
                        status: res.statusCode ?? null,
                        ms: receivedAtMs - sentAtMs,
                        serverDateMs: Number.isFinite(date) ? date : null,
                        receivedAtMs,
                        error: null,
                    });
                    res.resume();
                    res.destroy();
                });
                req.on('error', err => fail(errorClass(err)));
                req.end();
            } catch (err) {
                fail(errorClass(err));
            }
        });
    }

    async remove(target: string): Promise<void> {
        await fs.promises.rm(target, { recursive: true, force: true });
    }

    async stepClock(targetMs: number): Promise<boolean> {
        if (process.platform !== 'linux' || !Number.isFinite(targetMs) || targetMs <= 0) return false;
        const out = await run('date', ['-u', '-s', `@${(targetMs / 1000).toFixed(3)}`], 3_000);
        return out !== null;
    }

    defaultRouteIpv4(timeoutMs: number): Promise<string | null> {
        return defaultRouteIpv4(timeoutMs);
    }

    async windowsTimeSynced(): Promise<boolean | null> {
        if (process.platform !== 'win32') return null;
        const out = await run('w32tm', ['/query', '/status'], 3_000);
        return out === null ? null : parseW32tmStatus(out);
    }
}
