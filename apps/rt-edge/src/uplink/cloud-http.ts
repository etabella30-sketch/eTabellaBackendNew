/**
 * The box's HTTPS client to the cloud realtime API (challenge, enroll, cert, archive-url, operator-code) and the
 * reachability probe. node:http/https only; certificate validation stays ON (spec §11 "Proxy upstream is HTTPS
 * with verification on"); every request has a timeout. A response body is parsed as JSON when it looks like JSON.
 * The cloud host name is resolved with a bounded, threadpool-free lookup (bounded-lookup.ts, review 28).
 */
import * as http from 'http';
import * as https from 'https';
import type { LookupFunction } from 'net';

import { boundedLookup } from './bounded-lookup';

export interface CloudHttpRequest {
    readonly method: 'GET' | 'POST' | 'PUT';
    readonly url: string;
    /** JSON-encoded when an object; sent as-is when a Buffer. */
    readonly body?: unknown;
    readonly headers?: Readonly<Record<string, string>>;
    readonly timeoutMs?: number;
}

export interface CloudHttpResponse {
    readonly status: number;
    readonly json: unknown;
    readonly text: string;
}

export type CloudHttp = (req: CloudHttpRequest) => Promise<CloudHttpResponse>;

/** A request that never reached an HTTP answer (DNS, refused, reset, timeout, TLS). */
export class CloudNetworkError extends Error {
    constructor(
        message: string,
        readonly code: string,
    ) {
        super(message);
        this.name = 'CloudNetworkError';
    }
}

/** Network-level codes that mean "no internet" rather than "etabella.net did not answer properly". */
const NO_INTERNET = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ENETUNREACH', 'EHOSTUNREACH', 'ENETDOWN', 'EADDRNOTAVAIL', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE']);

export function isNoInternet(err: unknown): boolean {
    return err instanceof CloudNetworkError && NO_INTERNET.has(err.code);
}

const cloudRequest = (req: CloudHttpRequest, lookup: LookupFunction | undefined): Promise<CloudHttpResponse> =>
    new Promise<CloudHttpResponse>((resolve, reject) => {
        let url: URL;
        try {
            url = new URL(req.url);
        } catch {
            reject(new CloudNetworkError(`bad url ${req.url}`, 'EINVAL'));
            return;
        }
        const lib = url.protocol === 'https:' ? https : http;
        const payload = req.body === undefined ? null : Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body), 'utf8');
        const headers: Record<string, string> = { accept: 'application/json', ...(req.headers ?? {}) };
        if (payload && !Buffer.isBuffer(req.body) && !headers['content-type']) headers['content-type'] = 'application/json';
        if (payload) headers['content-length'] = String(payload.length);
        const r = lib.request(url, { method: req.method, headers, timeout: req.timeoutMs ?? 15_000, agent: false, ...(lookup ? { lookup } : {}) }, res => {
            const chunks: Buffer[] = [];
            res.on('data', (c: Buffer) => chunks.push(c));
            res.on('end', () => {
                const text = Buffer.concat(chunks).toString('utf8');
                let json: unknown = null;
                if (/^\s*[[{]/.test(text)) {
                    try {
                        json = JSON.parse(text);
                    } catch {
                        json = null;
                    }
                }
                resolve({ status: res.statusCode ?? 0, json, text });
            });
            res.on('error', err => reject(new CloudNetworkError(err.message, (err as NodeJS.ErrnoException).code ?? 'ERESPONSE')));
        });
        r.on('timeout', () => r.destroy(Object.assign(new Error('request timed out'), { code: 'ETIMEDOUT' })));
        r.on('error', (err: NodeJS.ErrnoException) => reject(new CloudNetworkError(err.message, err.code ?? 'EREQUEST')));
        if (payload) r.write(payload);
        r.end();
    });

/** A CloudHttp whose requests resolve host names with `lookup` (default: Node's dns.lookup). */
export function createCloudHttp(opts: { readonly lookup?: LookupFunction } = {}): CloudHttp {
    return req => cloudRequest(req, opts.lookup);
}

/** The box's client: host names through `boundedLookup` (c-ares, a hard deadline, never a pool thread for long). */
export const nodeCloudHttp: CloudHttp = createCloudHttp({ lookup: boundedLookup() });
