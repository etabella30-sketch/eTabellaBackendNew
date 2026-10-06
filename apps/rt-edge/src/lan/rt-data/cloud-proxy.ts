/**
 * The one HTTP client of the RT data routes (spec §8.2 rows 6–7, §3.2 `lan` "allowlisted /realtimeapi proxy"): it
 * sends an allowlisted request to the box's configured cloud and reads the reply within hard limits. It is not an
 * open proxy:
 *
 * - Only the configured cloud: every URL is `BoxConfig.cloud.realtimeApiUrl` + a `cloudPath` from the route table
 *   (rt-routes.ts) + a re-serialised query; the result must lie on `BoxConfig.cloud.origin`. A config whose
 *   `realtimeApiUrl` is on another origin disables the proxy (every call answers `disabled`, logged once).
 * - Only the caller's edge token: `Authorization: Bearer <token>` is the one credential sent, and only to that origin.
 *   No client header, cookie or address is forwarded; the box adds `Accept`, `User-Agent` and, for a body,
 *   `Content-Type: application/json` and `Content-Length`.
 * - Redirects are never followed (a 3xx is `refused`); TLS certificates are validated (Node's defaults).
 * - Bounded: one timeout per call covering connect and reply; the reply body is read up to `maxBytes` and the call is
 *   cut beyond it (`refused/too-large`, never truncated); at most `maxInFlight` calls at once (`busy`), of which reads
 *   may take all but `writeSlots` (a mark save still gets a slot while reads fill the box). A call that asks for it
 *   (`waitForSlotMs`) waits that long for a slot, first come first served, before it is `busy`; at most
 *   `WAITING_PER_SLOT` × `maxInFlight` calls wait, and a waiting call holds no socket and no reply buffer.
 *
 * The token is never logged; log lines carry the route path, the status and the duration only.
 */
import * as http from 'http';
import * as https from 'https';

import { Inject, Injectable, Logger, OnModuleDestroy, Optional } from '@nestjs/common';

import { BOX_CONFIG, BoxConfig } from '../../ports';
import { RT_DATA_OPTIONS, rtDataOptions, RtDataOptions } from './rt-data.options';

export interface CloudCall {
    readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    /** From the route table, e.g. `marknav/all` (never from the client). */
    readonly cloudPath: string;
    /** Already validated and identity-overwritten; '' for none. */
    readonly query: string;
    /** JSON body (writes), or null. */
    readonly body: Buffer | null;
    /** The caller's edge token (`EdgePrincipal.token` of a forwardable principal). */
    readonly token: string;
    readonly timeoutMs: number;
    readonly maxBytes: number;
    /**
     * When no slot is free: wait up to this long for one (first come, first served) instead of answering `busy` at
     * once. Absent or 0: `busy` at once. Not counted in `timeoutMs`, which starts when the call is sent.
     */
    readonly waitForSlotMs?: number;
}

/** Most calls waiting for a slot, per slot of `maxInFlight`; past it a call is `busy` at once. */
export const WAITING_PER_SLOT = 4;

/** A call waiting for a slot: `granted(true)` hands it one (already counted in flight), `granted(false)` none. */
interface SlotWaiter {
    readonly limit: number;
    readonly timer: NodeJS.Timeout;
    readonly granted: (got: boolean) => void;
}

export type CloudResult =
    /** The cloud answered (any status below 300 or from 400). */
    | { readonly kind: 'response'; readonly status: number; readonly body: Buffer }
    /** No answer: the cloud could not be reached, the connection broke, or the call timed out. */
    | { readonly kind: 'unreachable'; readonly reason: 'network' | 'timeout'; readonly message: string }
    /** The box refused the cloud's answer (or did not make the call). */
    | { readonly kind: 'refused'; readonly reason: 'too-large' | 'redirect' | 'disabled' | 'busy'; readonly message: string };

@Injectable()
export class RtCloudProxy implements OnModuleDestroy {
    private readonly logger = new Logger('LanRtProxy');
    private readonly opts: RtDataOptions;
    private readonly base: URL | null;
    private readonly disabledReason: string | null;
    private readonly agents: { readonly http: http.Agent; readonly https: https.Agent };
    private readonly userAgent: string;
    private inFlight = 0;
    /** Calls waiting for a slot, oldest first. */
    private readonly waiting: SlotWaiter[] = [];

    constructor(
        @Inject(BOX_CONFIG) private readonly config: BoxConfig,
        @Optional() @Inject(RT_DATA_OPTIONS) options?: Partial<RtDataOptions>,
    ) {
        this.opts = rtDataOptions(options);
        const { base, problem } = proxyBase(config);
        this.base = base;
        this.disabledReason = problem;
        if (problem) this.logger.error(`the RT data proxy is disabled: ${problem}`);
        this.agents = { http: new http.Agent({ keepAlive: true, maxSockets: 16 }), https: new https.Agent({ keepAlive: true, maxSockets: 16 }) };
        this.userAgent = `etabella-rt-edge/${config.release.version}`;
    }

    /** Null when the proxy may run; else why it is disabled. */
    disabled(): string | null {
        return this.disabledReason;
    }

    /** The URL a call goes to (null when disabled or when it would leave the cloud origin). */
    urlFor(cloudPath: string, query: string): URL | null {
        if (!this.base || typeof cloudPath !== 'string' || !/^[A-Za-z0-9_]+(\/[A-Za-z0-9_]+)*$/.test(cloudPath)) return null;
        const url = new URL(`${this.base.href.replace(/\/+$/, '')}/${cloudPath}`);
        if (query) url.search = query;
        return url.origin === this.config.cloud.origin ? url : null;
    }

    send(call: CloudCall): Promise<CloudResult> {
        if (this.disabledReason) return Promise.resolve({ kind: 'refused', reason: 'disabled', message: this.disabledReason });
        const url = this.urlFor(call.cloudPath, call.query);
        if (!url) return Promise.resolve({ kind: 'refused', reason: 'disabled', message: `"${call.cloudPath}" is not a cloud route of ${this.config.cloud.origin}` });
        const limit = this.slotsFor(call.method);
        if (this.inFlight < limit) {
            this.inFlight++;
            return this.run(url, call);
        }
        const waitMs = Math.max(0, call.waitForSlotMs ?? 0);
        if (!waitMs || this.waiting.length >= this.opts.maxInFlight * WAITING_PER_SLOT) return Promise.resolve(this.busy());
        return this.slot(limit, waitMs).then(got => (got ? this.run(url, call) : this.busy()));
    }

    onModuleDestroy(): void {
        for (const waiter of this.waiting.splice(0)) {
            clearTimeout(waiter.timer);
            waiter.granted(false);
        }
        this.agents.http.destroy();
        this.agents.https.destroy();
    }

    /** The slots a call may use: all of them for a write, all but `writeSlots` (at least one) for a read. */
    private slotsFor(method: CloudCall['method']): number {
        return method === 'GET' ? Math.max(1, this.opts.maxInFlight - this.opts.writeSlots) : this.opts.maxInFlight;
    }

    private busy(): CloudResult {
        return { kind: 'refused', reason: 'busy', message: `${this.inFlight} cloud calls in flight` };
    }

    /** Wait up to `waitMs` for a slot under `limit`: true once one is handed over (already counted), false if none. */
    private slot(limit: number, waitMs: number): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            const waiter: SlotWaiter = {
                limit,
                granted: resolve,
                timer: setTimeout(() => {
                    const at = this.waiting.indexOf(waiter);
                    if (at >= 0) this.waiting.splice(at, 1);
                    resolve(false);
                }, waitMs),
            };
            waiter.timer.unref?.();
            this.waiting.push(waiter);
        });
    }

    /** A call ended: its freed slots go to the waiting calls, oldest first, before any later caller can take them. */
    private wake(): void {
        while (this.waiting.length && this.inFlight < this.waiting[0].limit) {
            const waiter = this.waiting.shift() as SlotWaiter;
            clearTimeout(waiter.timer);
            this.inFlight++;
            waiter.granted(true);
        }
    }

    /** Send a call that holds a slot (counted in `inFlight`); the slot is freed when it ends. */
    private run(url: URL, call: CloudCall): Promise<CloudResult> {
        const startedAt = Date.now();
        const answered = this.request(url, call).catch((err: unknown): CloudResult => ({ kind: 'unreachable', reason: 'network', message: errorText(err) }));
        return answered.then(result => {
            this.inFlight--;
            this.wake();
            const took = Date.now() - startedAt;
            const outcome = result.kind === 'response' ? String(result.status) : `${result.kind}/${result.reason}`;
            this.logger.debug(`${call.method} ${call.cloudPath} → ${outcome} in ${took} ms`);
            return result;
        });
    }

    private request(url: URL, call: CloudCall): Promise<CloudResult> {
        const isHttps = url.protocol === 'https:';
        const headers: http.OutgoingHttpHeaders = {
            Accept: 'application/json',
            Authorization: `Bearer ${call.token}`,
            'User-Agent': this.userAgent,
        };
        if (call.body) {
            headers['Content-Type'] = 'application/json';
            headers['Content-Length'] = String(call.body.length);
        }
        return new Promise<CloudResult>(resolve => {
            let settled = false;
            let timer: NodeJS.Timeout | null = null;
            let req: http.ClientRequest | null = null;
            const finish = (result: CloudResult): void => {
                if (settled) return;
                settled = true;
                if (timer) clearTimeout(timer);
                resolve(result);
            };
            const options: https.RequestOptions = {
                method: call.method,
                headers,
                agent: isHttps ? this.agents.https : this.agents.http,
            };
            try {
                req = (isHttps ? https : http).request(url, options, res => {
                    const status = res.statusCode ?? 0;
                    if (status >= 300 && status < 400) {
                        res.resume();
                        req?.destroy();
                        return finish({ kind: 'refused', reason: 'redirect', message: `the cloud answered ${status} (redirects are not followed)` });
                    }
                    const declared = Number(res.headers['content-length']);
                    if (Number.isFinite(declared) && declared > call.maxBytes) {
                        req?.destroy();
                        return finish({ kind: 'refused', reason: 'too-large', message: `the cloud reply declares ${declared} bytes (limit ${call.maxBytes})` });
                    }
                    const chunks: Buffer[] = [];
                    let size = 0;
                    res.on('data', (chunk: Buffer) => {
                        if (settled) return;
                        size += chunk.length;
                        if (size > call.maxBytes) {
                            finish({ kind: 'refused', reason: 'too-large', message: `the cloud reply passed ${call.maxBytes} bytes` });
                            req?.destroy();
                            return;
                        }
                        chunks.push(chunk);
                    });
                    res.on('end', () => finish({ kind: 'response', status, body: Buffer.concat(chunks) }));
                    res.on('aborted', () => finish({ kind: 'unreachable', reason: 'network', message: 'the cloud connection broke during the reply' }));
                    res.on('error', err => finish({ kind: 'unreachable', reason: 'network', message: errorText(err) }));
                });
            } catch (err) {
                return finish({ kind: 'unreachable', reason: 'network', message: errorText(err) });
            }
            req.on('error', err => finish({ kind: 'unreachable', reason: 'network', message: errorText(err) }));
            timer = setTimeout(() => {
                finish({ kind: 'unreachable', reason: 'timeout', message: `no reply within ${call.timeoutMs} ms` });
                req?.destroy();
            }, call.timeoutMs);
            timer.unref?.();
            if (call.body) req.write(call.body);
            req.end();
        });
    }
}

/** The proxy base from the config: `cloud.realtimeApiUrl`, which must lie on `cloud.origin`. */
export function proxyBase(config: BoxConfig): { base: URL | null; problem: string | null } {
    let base: URL;
    try {
        base = new URL(config.cloud.realtimeApiUrl);
    } catch {
        return { base: null, problem: 'cloud.realtimeApiUrl is not a URL' };
    }
    if (base.origin !== config.cloud.origin) return { base: null, problem: `cloud.realtimeApiUrl (${base.origin}) is not on cloud.origin (${config.cloud.origin})` };
    if (base.protocol !== 'https:' && !(config.mode === 'dev' && base.protocol === 'http:')) return { base: null, problem: `cloud.realtimeApiUrl must use https` };
    if (base.search || base.hash || base.username || base.password) return { base: null, problem: 'cloud.realtimeApiUrl must be a plain base URL' };
    return { base, problem: null };
}

function errorText(err: unknown): string {
    const code = (err as NodeJS.ErrnoException)?.code;
    const message = err instanceof Error ? err.message : String(err);
    return code ? `${code}: ${message}` : message;
}
