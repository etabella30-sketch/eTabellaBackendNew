/**
 * The box's LAN TLS certificate (spec §8.3, §3.4 install step 3, §12): types and pure rules shared by the three
 * modules that touch it. One owner per duty:
 *
 * - FETCH + RENEW: the uplink (`UplinkPort.ensureCertificate`, uplink.port.ts). It generates the TLS key and the CSR
 *   on the box (the key never leaves it), gets the chain from the cloud over `edge/v1/cert`, verifies it and
 *   installs `http.tls.certFile` / `keyFile` atomically, then publishes `certificate-installed`.
 * - SERVE: main.ts (`EdgeLanListener`). The LAN HTTPS listener binds only once `readTlsMaterial` accepts the pair;
 *   until then the box records, links and fetches its certificate (a missing certificate is a RUNTIME state, never a
 *   config error: a freshly enrolled box has none). Afterwards a file change or `certificate-installed` hot-reloads
 *   the pair; a pair that does not load is refused and the served one stays.
 * - REPORT: ops (`device-health.certDaysLeft`, readiness `box-linked` / verdict `box-not-linked` with failure
 *   'certificate' through `edgeLinkFailure` in ops.port.ts, and the expiry alerts).
 *
 * Validity dates never gate the listener: a box with a wrong clock must still serve a good certificate (clients
 * judge validity with their own clocks); expiry is reported, alerted and renewed instead.
 */
import { X509Certificate } from 'crypto';
import { createSecureContext as nodeCreateSecureContext, SecureContextOptions } from 'tls';

import type { BoxTlsConfig } from './box-config';

/** Every LAN TLS context the box builds (spec §8.3; `setSecureContext` resets an omitted minVersion, so always pass it). */
export const EDGE_TLS_MIN_VERSION = 'TLSv1.2';

/** "Venue box ready" refuses a certificate with fewer days left (spec §8.3): readiness/verdict failure 'certificate'. */
export const EDGE_CERT_READY_MIN_DAYS = 14;
/** P2 alert below this many days left (spec §12 "Certificate <21 days"). */
export const EDGE_CERT_ALERT_DAYS = 21;
/** P1 alert below this many days left while the box holds a session that is not sealed (spec §8.3, §12). */
export const EDGE_CERT_PAGE_DAYS = 7;
/** Renew once less than this fraction of the lifetime remains (spec §8.3 "less than two thirds"). */
export const EDGE_CERT_RENEW_REMAINING_FRACTION = 2 / 3;
/** How often the uplink re-runs `ensureCertificate` while online (it also runs after every completed hello). */
export const EDGE_CERT_CHECK_INTERVAL_MS = 3_600_000;
/** `certificate()` re-inspects the files at most this often (and always right after an install). */
export const EDGE_CERT_INSPECT_CACHE_MS = 60_000;

const DAY_MS = 86_400_000;

/**
 * Why the configured pair cannot be served:
 * - `missing`: a file does not exist (ENOENT, ENOTDIR): the normal state of a box before its first certificate;
 * - `unreadable`: a file exists but cannot be read (EACCES, EISDIR, EIO, …);
 * - `invalid`: read, but empty, not PEM, or the key does not match the certificate (OpenSSL refused the pair).
 */
export type EdgeTlsProblemReason = 'missing' | 'unreadable' | 'invalid';

export interface EdgeTlsProblem {
    readonly reason: EdgeTlsProblemReason;
    /** The file at fault; null when the pair as a whole was refused (e.g. key values mismatch). */
    readonly file: string | null;
    /** Developer text: the errno code or the OpenSSL message. Never key material. */
    readonly message: string;
}

/** Thrown where a usable pair is required (`reloadTlsContext` in main.ts); the served pair stays. */
export class EdgeTlsError extends Error {
    constructor(readonly problem: EdgeTlsProblem) {
        super(`TLS ${problem.reason}${problem.file ? ` ${problem.file}` : ''}: ${problem.message}`);
        this.name = 'EdgeTlsError';
    }
}

/**
 * The configured pair: `ok` → `options` (for `server.setSecureContext` as they are, minVersion included) and
 * `certPem` are set and `problem` is null; otherwise only `problem` is set.
 */
export interface TlsMaterial {
    readonly ok: boolean;
    readonly options: Readonly<SecureContextOptions> | null;
    readonly certPem: Buffer | null;
    readonly problem: EdgeTlsProblem | null;
}

const tlsProblem = (problem: EdgeTlsProblem): TlsMaterial => ({ ok: false, options: null, certPem: null, problem });

const MISSING_CODES: ReadonlySet<string> = new Set(['ENOENT', 'ENOTDIR']);

/**
 * Read the configured certificate chain, key and optional CA bundle and check that OpenSSL accepts them as a pair
 * (`createSecureContext`, which refuses bad PEM and "key values mismatch"). Never throws. Checks the files in the
 * order cert, key, CA and reports the first problem.
 */
export function readTlsMaterial(
    config: BoxTlsConfig,
    readFile: (file: string) => Buffer,
    createSecureContext: (options: SecureContextOptions) => unknown = nodeCreateSecureContext,
): TlsMaterial {
    const read = (file: string): Buffer | EdgeTlsProblem => {
        try {
            const data = readFile(file);
            if (!data || data.length === 0) return { reason: 'invalid', file, message: 'empty file' };
            return data;
        } catch (err) {
            const code = (err as NodeJS.ErrnoException)?.code;
            const message = code ?? (err instanceof Error ? err.message : String(err));
            return { reason: code && MISSING_CODES.has(code) ? 'missing' : 'unreadable', file, message };
        }
    };
    const files: Array<[keyof SecureContextOptions, string]> = [
        ['cert', config.certFile],
        ['key', config.keyFile],
    ];
    if (config.caFile) files.push(['ca', config.caFile]);
    const options: SecureContextOptions = { minVersion: EDGE_TLS_MIN_VERSION };
    for (const [key, file] of files) {
        const data = read(file);
        if (!Buffer.isBuffer(data)) return tlsProblem(data);
        (options as Record<string, unknown>)[key] = data;
    }
    try {
        createSecureContext(options);
    } catch (err) {
        return tlsProblem({ reason: 'invalid', file: null, message: err instanceof Error ? err.message : String(err) });
    }
    return { ok: true, options: Object.freeze(options), certPem: options.cert as Buffer, problem: null };
}

/** What the leaf certificate says (the first certificate of a full-chain PEM). */
export interface EdgeCertificateInfo {
    /** Epoch ms. */
    readonly notBeforeMs: number;
    /** Epoch ms. */
    readonly notAfterMs: number;
    /** subjectAltName DNS names, lower case, in certificate order. */
    readonly hosts: readonly string[];
    /** SHA-256 fingerprint, colon-separated upper-case hex (`X509Certificate.fingerprint256`). */
    readonly fingerprint256: string;
}

/** Parse the leaf of a PEM (chain). Throws when it is not a certificate. */
export function inspectCertificatePem(pem: string | Buffer): EdgeCertificateInfo {
    const x509 = new X509Certificate(pem);
    const date = (asDate: Date | undefined, text: string): number => {
        const ms = asDate instanceof Date ? asDate.getTime() : Date.parse(text);
        if (!Number.isFinite(ms)) throw new Error(`unreadable certificate date "${text}"`);
        return ms;
    };
    const withDates = x509 as X509Certificate & { readonly validFromDate?: Date; readonly validToDate?: Date };
    return {
        notBeforeMs: date(withDates.validFromDate, x509.validFrom),
        notAfterMs: date(withDates.validToDate, x509.validTo),
        hosts: sanDnsNames(x509.subjectAltName),
        fingerprint256: x509.fingerprint256,
    };
}

function sanDnsNames(san: string | undefined): string[] {
    if (!san) return [];
    const out: string[] = [];
    for (const part of san.split(/,\s*/)) {
        if (!part.startsWith('DNS:')) continue;
        const name = part.slice(4).replace(/^"(.*)"$/, '$1').trim().toLowerCase();
        if (name) out.push(name);
    }
    return out;
}

/** The box's LAN hostname `<slug>.<domain>` (S-D3), lower case. */
export function boxHostname(slug: string, domain: string): string {
    return `${slug}.${domain}`.toLowerCase();
}

/** True when `host` is one of `hosts`, or matches a single-label wildcard (`*.etabella-edge.net`). */
export function certificateCoversHost(hosts: readonly string[], host: string): boolean {
    const wanted = host.toLowerCase();
    return hosts.some(h => {
        const name = h.toLowerCase();
        if (name === wanted) return true;
        if (!name.startsWith('*.')) return false;
        const dot = wanted.indexOf('.');
        return dot > 0 && wanted.slice(dot + 1) === name.slice(2);
    });
}

/** Whole days until `notAfterMs` (floor; negative once expired, e.g. -1 during the first day after expiry). */
export function certDaysLeft(notAfterMs: number, nowMs: number): number {
    return Math.floor((notAfterMs - nowMs) / DAY_MS);
}

/**
 * - `not-configured`: plain HTTP (dev, `http.tls: null`): no certificate by design, never a problem;
 * - `missing` / `unreadable` / `invalid`: `EdgeTlsProblemReason` (the leaf did not parse also reads `invalid`);
 * - `ok`: a loadable pair; its dates and hosts are in `info` (an expired or wrong-host certificate is still `ok`
 *   here: `daysLeft` and `coversHost` say so, and `certificateRenewalDue` is true).
 */
export type EdgeCertificateState = 'not-configured' | EdgeTlsProblemReason | 'ok';

/** The installed certificate as the uplink reports it (`UplinkPort.certificate()`). */
export interface EdgeCertificateStatus {
    readonly state: EdgeCertificateState;
    /** Set for `missing` / `unreadable` / `invalid`. */
    readonly problem: EdgeTlsProblem | null;
    /** Set for `ok`. */
    readonly info: EdgeCertificateInfo | null;
    /** `certDaysLeft(info.notAfterMs, checkedAtMs)`; null unless `ok`. */
    readonly daysLeft: number | null;
    /** The certificate covers `boxHostname(slug, domain)`; null unless `ok` with a known host (enrolled box). */
    readonly coversHost: boolean | null;
    /** Epoch ms of the inspection. */
    readonly checkedAtMs: number;
}

/**
 * Inspect the configured pair: `readTlsMaterial`, then the leaf. `host` = `boxHostname(identity.slug, box.domain)`,
 * or null before enrolment. Never throws.
 */
export function certificateStatus(
    config: BoxTlsConfig | null,
    readFile: (file: string) => Buffer,
    nowMs: number,
    host: string | null,
    createSecureContext?: (options: SecureContextOptions) => unknown,
): EdgeCertificateStatus {
    const base = { problem: null, info: null, daysLeft: null, coversHost: null, checkedAtMs: nowMs };
    if (!config) return { ...base, state: 'not-configured' };
    const material = readTlsMaterial(config, readFile, createSecureContext);
    if (!material.ok) return { ...base, state: material.problem.reason, problem: material.problem };
    let info: EdgeCertificateInfo;
    try {
        info = inspectCertificatePem(material.certPem);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ...base, state: 'invalid', problem: { reason: 'invalid', file: config.certFile, message } };
    }
    return {
        ...base,
        state: 'ok',
        info,
        daysLeft: certDaysLeft(info.notAfterMs, nowMs),
        coversHost: host === null ? null : certificateCoversHost(info.hosts, host),
    };
}

/**
 * Should the uplink fetch a (new) certificate now? Never for `not-configured`. Always when the pair is not `ok`,
 * when it does not cover the box host, or when it is not yet valid; otherwise once less than two thirds of its
 * lifetime remain (spec §8.3), which includes an expired one.
 */
export function certificateRenewalDue(status: EdgeCertificateStatus, nowMs: number): boolean {
    if (status.state === 'not-configured') return false;
    if (status.state !== 'ok' || !status.info) return true;
    if (status.coversHost === false) return true;
    const { notBeforeMs, notAfterMs } = status.info;
    if (nowMs < notBeforeMs) return true;
    const lifetime = notAfterMs - notBeforeMs;
    if (!(lifetime > 0)) return true;
    return notAfterMs - nowMs < lifetime * EDGE_CERT_RENEW_REMAINING_FRACTION;
}

/**
 * True when the certificate keeps the box from being "ready" (readiness `box-linked` / verdict `box-not-linked`,
 * failure 'certificate'): not loadable, not covering the box host, or fewer than EDGE_CERT_READY_MIN_DAYS left.
 * `not-configured` (dev) is never a problem.
 */
export function certificateBlocksReady(status: EdgeCertificateStatus): boolean {
    if (status.state === 'not-configured') return false;
    if (status.state !== 'ok') return true;
    if (status.coversHost === false) return true;
    return status.daysLeft === null || status.daysLeft < EDGE_CERT_READY_MIN_DAYS;
}
