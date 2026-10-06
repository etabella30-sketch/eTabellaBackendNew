/**
 * The RT data routes of the box (rt-routes.ts; spec §8.2, §8.5; D32, DR9, DR19): local reads from the box's state
 * and kernel, the allowlisted read-through proxy, and the allowlisted mark / issue writes.
 *
 * Order of every call (the first refusal answers):
 * 1. Sign-in: `AuthPort.authenticate` (401 `unauthenticated` / `token_expired` / `token_revoked`, 503
 *    `box_not_configured` / `box_not_linked`). Every RT route needs a box sign-in (online, room code or operator).
 * 2. The query: one value per key, at most `maxQueryBytes` (else 400 `invalid_request`).
 * 3. By kind:
 *    - `local`: scope-filtered answers (DR19); a case the principal may not see answers the cloud's "nothing" for
 *      lists, and `use_cloud` for `coreapi/case/caseinfo` (it is not this box's to show).
 *    - `local-or-cloud`: the session must be one the principal may open (else the cloud's "no data" answer); local
 *      while the kernel holds it; otherwise (the query's other ids checked like `cloud-read` first) read from the
 *      cloud like `cloud-read`, falling back to the local "no data yet" answer (with `X-Edge-Offline` /
 *      `X-Edge-Reauth`).
 *    - `cloud-read`: scope ids in the query (`nCaseid`, `nSesid`, `nSessionid`; the legacy sentinels '', 'null',
 *      '0' count as absent) must be the principal's (else 403 `use_cloud`, the cloud is not asked); a box-signed token
 *      is never forwarded (`offlineBody` + `X-Edge-Reauth: 1`, or 503 `reauth`); a fresh cached copy answers at once
 *      (`X-Edge-Age`, never `X-Edge-Stale`: that header only marks a copy served in place of an answer the cloud could
 *      not give); offline (the uplink's internet state `down`) the cached copy (`X-Edge-Stale`), else `offlineBody` +
 *      `X-Edge-Offline: 1` (or 503 `offline`); online the cloud is asked (identical reads of one user in flight share
 *      one call).
 *    - `cloud-write`: 503 `reauth` for a box-signed token, then the body's scope ids (403 `use_cloud`), then 503
 *      `offline` at once when the internet is down, then the cloud. Only the JSON body is forwarded (re-serialised,
 *      `nUserid` / `nMasterid` replaced by the caller's id where present, as the cloud's RealtimeAuthMiddleware
 *      does); the query string of a write is not forwarded.
 * 4. The cloud's answer: 2xx with a JSON (or empty) body passes through (a 200 read is cached, unless it is the
 *    cloud's "failed" answer with msg below 0, which also replaces the caller's copy of that read with a marker that
 *    is never served, as the cloud sends it for refusals too: a read of theirs in flight across it neither stores the
 *    copy again nor falls back on it; a write makes the caller's cached reads stale); 401 becomes 502
 *    `cloud_refused` (a box 401 would sign the person out, and the box verified the token itself); other 4xx with a
 *    JSON body pass through as the cloud's own answer (403 drops the cached copy); 5xx, a non-JSON body, a redirect,
 *    a reply over the size limit → 502 `cloud_refused` (a read serves its stale copy first); unreachable → a read
 *    answers like offline, a write 503 `offline`; a write that timed out → 502 `cloud_refused` (it may have reached
 *    the cloud); too many calls in flight → 429 `rate_limited` (reads may take all but `writeSlots` of them, so a mark
 *    save still gets one while reads fill the box; a read first waits its turn for a slot, see below).
 *
 * Every answer carries `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and `X-Edge-Source`
 * (`box` | `cloud` | `cache`); errors use the contract envelope (edge-http.ts `sendError`).
 *
 * Live mark sync (user decision 2026-10-05): on the bus's `marks-changed` the listed users' cached reads (a resync:
 * everyone's) go stale AT ONCE, inside the publish, so the devices the LAN gateway tells `LAN_MARKS_WINDOW_MS` later
 * read the change from the cloud, never a 15 s old copy. A write does the same to its writer's copies. The copies are
 * kept for the busy / 5xx / offline fallbacks (each person only ever gets their own). On a busy box a read with no copy,
 * or with one a notice or a write made stale, first waits its turn (first come, first served) up to `staleReadWaitMs`
 * for a cloud slot (the reload burst after a notice), so it is neither refused 429 at once nor handed an old copy as
 * the current marks while the cloud can still answer; only when that wait runs out does it get the copy
 * (`X-Edge-Stale`) or 429. A read in flight across a notice (or a write of its user) is stored stale and never
 * replaces a newer copy, and a read that starts after the notice does not share its call (`RtReadCache.stamp`).
 */
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { CanonicalPage } from '@app/edge-sync';

import {
    ApiRequestContext,
    AUTH_PORT,
    AuthPort,
    BoxSessionRecord,
    CloudRelay,
    EDGE_CLOCK,
    EDGE_EVENT_BUS,
    EdgeClock,
    EdgeEventBus,
    EdgePortError,
    EdgePrincipal,
    KERNEL_PORT,
    KernelPort,
    MarksChanged,
    RelayAnswer,
    STATE_PORT,
    StatePort,
    Unsubscribe,
    UPLINK_PORT,
    UplinkPort,
} from '../../ports';
import { sameId } from '../../auth/session-facts';
import { useCloudError } from '../cloud-paths';
import { bodyObject, EDGE_NO_STORE, isRecord, requestContext, requestToken, sendError } from '../edge-http';
import { CloudResult, RtCloudProxy } from './cloud-proxy';
import { RtCacheHit, RtReadCache } from './read-cache';
import { ResponseRecorder } from './response-recorder';
import { RT_DATA_OPTIONS, rtDataOptions, RtDataOptions } from './rt-data.options';
import {
    activeSessionRow,
    caseInfo,
    feedPagesData,
    heldPages,
    liveSessionRows,
    openableSession,
    parsePagesParam,
    RtLocalDeps,
    sessionDetail,
    sessionList,
    transcriptPages,
} from './rt-local';
import { RtRoute, rtRouteById } from './rt-routes';

/**
 * Where an answer came from (`X-Edge-Source`, CONTRACTS.md §8.8): `box` (served from the box's own state / kernel),
 * `cloud` (proxied), `cache` (the box's cached copy of a proxied read). Diagnostics only; the FE does not read it.
 */
export const RT_SOURCES = ['box', 'cloud', 'cache'] as const;
export type RtSource = typeof RT_SOURCES[number];

export const RT_HEADER_SOURCE = 'X-Edge-Source';
/**
 * Spec §8.2: a kept copy served in place of an answer the cloud could not give (offline, busy once the wait for a slot
 * ran out, a 5xx, unreachable), with its age in whole seconds. Never on a fresh copy: the device takes this header as
 * "not etabella.net's answer of now".
 */
export const RT_HEADER_STALE = 'X-Edge-Stale';
/** A fresh cached copy (answered without asking the cloud), with its age in whole seconds. Diagnostics only. */
export const RT_HEADER_AGE = 'X-Edge-Age';
/** The box answered without the cloud because the internet is down (or the cloud could not be reached). */
export const RT_HEADER_OFFLINE = 'X-Edge-Offline';
/** The box answered without the cloud because the caller's sign-in is box-signed (never forwarded). */
export const RT_HEADER_REAUTH = 'X-Edge-Reauth';

/** Ids that name what a request is about (DR19 / D22 scope). */
const SCOPE_CASE_KEY = 'nCaseid';
const SCOPE_SESSION_KEYS = ['nSesid', 'nSessionid'] as const;
/** Legacy "no id" values the FE sends (`nSessionid: 'null'` on the PDF reader). */
const NO_ID = new Set(['', 'null', 'undefined', '0']);
/** Keys the cloud replaces with the token user (realtime-auth.middleware.ts IDENTITY_KEYS). */
const IDENTITY_KEYS = ['nUserid', 'nMasterid'] as const;
const MAX_QUERY_PARAMS = 64;

type Why = 'offline' | 'reauth';

const offlineError = (message: string) => new EdgePortError('offline', message, { offline: true });
const reauthError = () => new EdgePortError('reauth', 'a box-signed sign-in is never forwarded to etabella.net: sign in with etabella.net to mark', { reauth: true });
const cloudRefused = (message: string) => new EdgePortError('cloud_refused', message);

/** The query of a request: one value per key, bounded. */
export function readQuery(raw: string, maxBytes: number): URLSearchParams {
    if (raw.length > maxBytes) throw new EdgePortError('invalid_request', `the query is longer than ${maxBytes} bytes`);
    const params = new URLSearchParams(raw);
    const seen = new Set<string>();
    let n = 0;
    for (const key of params.keys()) {
        if (++n > MAX_QUERY_PARAMS) throw new EdgePortError('invalid_request', 'too many query parameters');
        if (seen.has(key)) throw new EdgePortError('invalid_request', `${key} must be given once`);
        seen.add(key);
    }
    return params;
}

/** Sorted, so one read has one cache key whatever the order the client wrote. */
export function canonicalQuery(params: URLSearchParams): string {
    return new URLSearchParams([...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))).toString();
}

/** One id of a request, or null when absent / a legacy sentinel; arrays and objects are `invalid_request`. */
export function scopeId(value: unknown, key: string): string | null {
    if (value === undefined || value === null) return null;
    const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
    if (typeof text !== 'string' || text.length > 128) throw new EdgePortError('invalid_request', `${key} must be one id`);
    const trimmed = text.trim();
    return NO_ID.has(trimmed.toLowerCase()) ? null : trimmed;
}

/** A copy of a write body with the identity keys it carries set to the caller (never added). */
export function withIdentity(body: Record<string, unknown>, userId: string): Record<string, unknown> {
    const out = { ...body };
    for (const key of IDENTITY_KEYS) if (Object.prototype.hasOwnProperty.call(out, key)) out[key] = userId;
    return out;
}

/** What `readJson` answers for a body that is not JSON. */
const NOT_JSON: unique symbol = Symbol('not JSON');

/** The parsed body (undefined for an empty one), or `NOT_JSON`. */
function readJson(body: Buffer): unknown {
    if (body.length === 0) return undefined;
    try {
        return JSON.parse(body.toString('utf8'));
    } catch {
        return NOT_JSON;
    }
}

function isJsonOrEmpty(body: Buffer): boolean {
    return readJson(body) !== NOT_JSON;
}

/**
 * The cloud's "failed" answer sent with HTTP 200: an object whose `msg` is below 0, alone or as the only row of a
 * list (marknav/all answers `[{ msg: -1, value: 'Failed ' }]` when its query fails). The FE reads `msg` the same way.
 */
export function isFailureAnswer(json: unknown): boolean {
    const row = Array.isArray(json) ? (json.length === 1 ? json[0] : null) : json;
    if (!isRecord(row)) return false;
    const msg = row.msg;
    if (typeof msg !== 'number' && !(typeof msg === 'string' && msg.trim() !== '')) return false;
    return Number(msg) < 0;
}

function setCommonHeaders(res: Response, source: RtSource, extra: Record<string, string>): void {
    res.setHeader('Cache-Control', EDGE_NO_STORE);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(RT_HEADER_SOURCE, source);
    for (const [name, value] of Object.entries(extra)) res.setHeader(name, value);
}

/** A JSON body. */
export function sendRtJson(res: Response, status: number, body: unknown, source: RtSource, extra: Record<string, string> = {}): void {
    if (res.headersSent) return;
    res.status(status);
    setCommonHeaders(res, source, extra);
    res.json(body);
}

/** Bytes already known to be JSON (or empty: the cloud's "no row" answer, sent as an empty 200 body). */
export function sendRtRaw(res: Response, status: number, body: Buffer, source: RtSource, extra: Record<string, string> = {}): void {
    if (res.headersSent) return;
    res.status(status);
    setCommonHeaders(res, source, extra);
    if (body.length) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(body.length));
        res.end(body);
    } else {
        res.end();
    }
}

@Injectable()
export class RtDataService implements OnModuleInit, OnModuleDestroy, CloudRelay {
    private readonly logger = new Logger('LanRtData');
    private readonly opts: RtDataOptions;
    /** Exposed for specs and diagnostics. */
    readonly cache: RtReadCache;
    private readonly pending = new Map<string, Promise<CloudResult>>();
    private readonly deps: RtLocalDeps;
    private unsubscribe: Unsubscribe | null = null;

    constructor(
        @Inject(AUTH_PORT) private readonly auth: AuthPort,
        @Inject(STATE_PORT) private readonly state: StatePort,
        @Inject(KERNEL_PORT) private readonly kernel: KernelPort,
        @Inject(UPLINK_PORT) private readonly uplink: UplinkPort,
        @Inject(EDGE_CLOCK) private readonly clock: EdgeClock,
        @Inject(EDGE_EVENT_BUS) private readonly bus: EdgeEventBus,
        private readonly proxy: RtCloudProxy,
        @Optional() @Inject(RT_DATA_OPTIONS) options?: Partial<RtDataOptions>,
    ) {
        this.opts = rtDataOptions(options);
        this.cache = new RtReadCache(
            { freshMs: this.opts.cacheFreshMs, staleMaxMs: this.opts.cacheStaleMaxMs, maxEntries: this.opts.cacheMaxEntries, maxBytes: this.opts.cacheMaxBytes },
            () => this.clock(),
        );
        this.deps = { state, kernel, auth };
    }

    onModuleInit(): void {
        if (this.unsubscribe) return;
        this.unsubscribe = this.bus.subscribe('marks-changed', e => this.onMarksChanged(e));
    }

    onModuleDestroy(): void {
        this.unsubscribe?.();
        this.unsubscribe = null;
    }

    /** Live mark sync: those users' cached reads (a resync: everyone's) are stale from now on; the copies stay. */
    private onMarksChanged(e: MarksChanged): void {
        if (!e) return;
        if (e.reason === 'resync') {
            this.cache.expireAll();
            return;
        }
        for (const user of e.users ?? []) this.cache.expireUser(user);
    }

    /**
     * The CLOUD_RELAY port (ports/cloud-relay.port.ts; Phase 4 of the shared-libraries plan): the answer the table
     * would send on `routeId` for the request in `ctx`, recorded instead of written. It is `handle()` itself, run
     * against a ResponseRecorder, so the two can never answer differently: the same sign-in check, scope rule,
     * cache, coalescing, offline fallbacks and envelope. The request seen by `handle` is `ctx.req` with `body` in
     * front of it (the sign-in, cookies and client address are the real request's); the query is the one given here,
     * never the request's own. A route id the manifest does not know is a programming error (the relay adapter and
     * the manifest row are written together), answered as `server_error` rather than thrown.
     */
    async call(routeId: string, query: Readonly<Record<string, string>>, body: unknown, ctx: ApiRequestContext): Promise<RelayAnswer> {
        const recorder = new ResponseRecorder();
        const route = rtRouteById(routeId);
        if (!route) {
            sendError(recorder as unknown as Response, new EdgePortError('server_error', `no RT route ${routeId}`), this.logger, `relay ${routeId}`);
            return recorder.answer();
        }
        const req = Object.create(ctx.req, { body: { value: body, enumerable: true, writable: true, configurable: true } }) as Request;
        await this.handle(route, req, recorder as unknown as Response, new URLSearchParams(query).toString());
        return recorder.answer();
    }

    /** Answer one request of `route` (the middleware matched it). Never throws: every failure is a contract reply. */
    async handle(route: RtRoute, req: Request, res: Response, rawQuery: string): Promise<void> {
        try {
            const principal = await this.auth.authenticate(requestToken(req), requestContext(req));
            const query = readQuery(rawQuery, this.opts.maxQueryBytes);
            switch (route.kind) {
                case 'local':
                    return this.local(route, principal, query, res);
                case 'local-or-cloud':
                    return await this.sessionRead(route, principal, query, res);
                case 'cloud-read':
                    // Sharing recipients must always name a case; an absent/legacy-null id must never reach the cloud.
                    if (route.id === 'core.myteamusers' && !scopeId(query.get(SCOPE_CASE_KEY), SCOPE_CASE_KEY)) {
                        throw new EdgePortError('invalid_request', 'nCaseid is required');
                    }
                    this.requireScope(principal, key => query.get(key));
                    return await this.cloudRead(route, principal, query, res, why => this.readFallback(route, res, why));
                case 'cloud-write':
                    return await this.cloudWrite(route, principal, req, res);
            }
            throw new EdgePortError('server_error', `unknown RT route kind of ${route.id}`);
        } catch (err) {
            sendError(res, err, this.logger, `rt ${route.id}`);
        }
    }

    // ---- local ---------------------------------------------------------------------------------------------------

    private local(route: RtRoute, principal: EdgePrincipal, query: URLSearchParams, res: Response): void {
        if (route.localBody !== undefined) return sendRtJson(res, 200, route.localBody, 'box');
        const nCaseid = scopeId(query.get('nCaseid'), 'nCaseid');
        switch (route.id) {
            case 'session.list':
                return sendRtJson(res, 200, sessionList(this.deps, principal, nCaseid), 'box');
            case 'session.live':
                return sendRtJson(res, 200, liveSessionRows(this.deps, principal, nCaseid), 'box');
            case 'session.active': {
                // The cloud answers one row, or an empty body when the case has no live session.
                const row = activeSessionRow(this.deps, principal, nCaseid);
                return row ? sendRtJson(res, 200, row, 'box') : sendRtRaw(res, 200, Buffer.alloc(0), 'box');
            }
            case 'core.caseinfo': {
                const info = caseInfo(this.deps, principal, nCaseid);
                if (!info) throw useCloudError();
                return sendRtJson(res, 200, info, 'box');
            }
        }
        throw new EdgePortError('server_error', `no local answer for ${route.id}`);
    }

    // ---- one session's transcript: local while the kernel holds it, else the cloud -------------------------------

    private async sessionRead(route: RtRoute, principal: EdgePrincipal, query: URLSearchParams, res: Response): Promise<void> {
        const nSesid = scopeId(query.get('nSesid'), 'nSesid');
        if (!nSesid) throw new EdgePortError('invalid_request', 'nSesid is required');
        const wanted = route.id === 'feed.data' ? parsePagesParam(query.get('pages')) : [];
        const publishedTranscript = route.id === 'feed.data' && query.get('bTranscript') === 'true';
        const session = openableSession(this.deps, principal, nSesid);
        if (!session) return this.noSession(route, res);
        const pages = publishedTranscript ? null : heldPages(this.kernel, session.nSesid);
        if (pages) return this.sessionAnswer(route, session, pages, true, wanted, res, {});
        // The kernel no longer holds it (sealed: the cloud has every line), or the published transcript: the cloud.
        // Everything else the query names (nCaseid) must be the principal's too before it is forwarded.
        this.requireScope(principal, key => query.get(key));
        return this.cloudRead(route, principal, query, res, why =>
            this.sessionAnswer(route, session, [], false, wanted, res, { [why === 'offline' ? RT_HEADER_OFFLINE : RT_HEADER_REAUTH]: '1' }),
        );
    }

    /** The cloud's answers for a session the caller may not see (or that is not on the box). */
    private noSession(route: RtRoute, res: Response): void {
        switch (route.id) {
            case 'session.detail':
                return sendRtRaw(res, 200, Buffer.alloc(0), 'box');
            case 'session.transcript':
                return sendRtJson(res, 200, { msg: -1 }, 'box');
            case 'feed.total':
                return sendRtJson(res, 200, { msg: -1, total: 0 }, 'box');
            default:
                throw new EdgePortError('session_not_found', 'no session data found');
        }
    }

    private sessionAnswer(
        route: RtRoute,
        s: BoxSessionRecord,
        pages: readonly CanonicalPage[],
        held: boolean,
        wanted: readonly number[],
        res: Response,
        extra: Record<string, string>,
    ): void {
        switch (route.id) {
            case 'session.detail':
                return sendRtJson(res, 200, sessionDetail(this.deps, s, pages), 'box', extra);
            case 'session.transcript':
                return sendRtJson(res, 200, pages.length ? { msg: 1, data: transcriptPages(pages) } : { msg: -1 }, 'box', extra);
            case 'feed.total':
                return sendRtJson(res, 200, held ? { msg: 1, total: pages.length } : { msg: -1, total: 0 }, 'box', extra);
            case 'feed.data':
                return sendRtJson(res, 200, feedPagesData(s.nSesid, pages, wanted), 'box', extra);
        }
        throw new EdgePortError('server_error', `no session answer for ${route.id}`);
    }

    // ---- scope ---------------------------------------------------------------------------------------------------

    /** The ids a request names must be the principal's (DR19); otherwise `use_cloud` (unknown and forbidden alike). */
    private requireScope(principal: EdgePrincipal, get: (key: string) => unknown): void {
        const nCaseid = scopeId(get(SCOPE_CASE_KEY), SCOPE_CASE_KEY);
        if (nCaseid && !this.auth.canSeeCase(principal, nCaseid)) throw useCloudError();
        for (const key of SCOPE_SESSION_KEYS) {
            const nSesid = scopeId(get(key), key);
            if (!nSesid) continue;
            const s = openableSession(this.deps, principal, nSesid);
            if (!s || (nCaseid && !sameId(s.nCaseid, nCaseid))) throw useCloudError();
        }
    }

    // ---- reads proxied to the cloud ------------------------------------------------------------------------------

    private readFallback(route: RtRoute, res: Response, why: Why): void {
        if (route.offlineBody === null || route.offlineBody === undefined) {
            throw why === 'offline' ? offlineError('this read needs the internet') : reauthError();
        }
        sendRtJson(res, 200, route.offlineBody, 'box', { [why === 'offline' ? RT_HEADER_OFFLINE : RT_HEADER_REAUTH]: '1' });
    }

    private offline(): boolean {
        try {
            return this.uplink.internet()?.state === 'down';
        } catch {
            return false;
        }
    }

    /** A fresh copy, the box's answer without asking the cloud: its age (`X-Edge-Age`), never `X-Edge-Stale`. */
    private sendFresh(res: Response, hit: RtCacheHit): void {
        sendRtRaw(res, 200, hit.body, 'cache', { [RT_HEADER_AGE]: String(Math.floor(hit.ageMs / 1000)) });
    }

    /** A kept copy served in place of an answer the cloud could not give (offline, busy, 5xx, unreachable). */
    private sendCached(res: Response, hit: RtCacheHit): void {
        sendRtRaw(res, 200, hit.body, 'cache', { [RT_HEADER_STALE]: String(Math.floor(hit.ageMs / 1000)) });
    }

    private async cloudRead(route: RtRoute, principal: EdgePrincipal, query: URLSearchParams, res: Response, fallback: (why: Why) => void): Promise<void> {
        if (principal.kind !== 'online' || !principal.forwardable || !principal.userId || !principal.token) return fallback('reauth');
        const forwarded = new URLSearchParams(query);
        for (const key of IDENTITY_KEYS) if (forwarded.has(key)) forwarded.set(key, principal.userId);
        const canonical = canonicalQuery(forwarded);
        const key = RtReadCache.key(principal.userId, route.id, canonical);
        const cached = this.cache.get(key);
        if (cached?.fresh) return this.sendFresh(res, cached);
        if (this.offline()) return cached ? this.sendCached(res, cached) : fallback('offline');

        // Taken before the cloud is asked: a mark notice (or a write) while this read is in flight leaves its copy
        // stale, and a read that starts after the notice never shares this call.
        const stamp = this.cache.stamp(principal.userId);
        // On a busy box a read waits its turn for a cloud slot (the burst of reloads after a notice or a write) when it
        // has nothing current to fall back on: no copy at all (it would get 429), or a copy a notice or a write made
        // stale (it is not the current marks). Only a copy nothing has made stale is served at once, as before.
        const waitForSlotMs = cached && !cached.expired ? 0 : Math.min(this.opts.staleReadWaitMs, this.opts.readTimeoutMs);
        const result = await this.coalesced(`${key}\n${stamp}`, () =>
            this.proxy.send({
                method: 'GET',
                cloudPath: route.cloudPath,
                query: canonical,
                body: null,
                token: principal.token,
                timeoutMs: this.opts.readTimeoutMs,
                maxBytes: this.opts.maxReadResponseBytes,
                waitForSlotMs,
            }),
        );
        // The copy this read had when it started, looked up again when the cloud could not answer: the cloud may have
        // refused this person this read while it was in flight, and a refused copy is never served.
        const kept = (): RtCacheHit | null => (cached ? this.cache.get(key) : null);
        switch (result.kind) {
            case 'response': {
                const { status, body } = result;
                const json = readJson(body);
                if (status >= 200 && status < 300 && json !== NOT_JSON) {
                    // The cloud's "failed" answer (HTTP 200, msg below 0) passes through as is but is never kept:
                    // a later read must not be handed it as if it were the marks. The cloud also sends that shape to
                    // refuse a read (factsheet/detail to a person who may no longer view the fact), so this person's
                    // copy of this read is replaced by a marker that is never served, and a read of theirs that
                    // started before this one cannot store the copy again. Other people's copies stay.
                    if (status === 200 && isFailureAnswer(json)) this.cache.refuse(key, principal.userId, stamp);
                    else if (status === 200 && body.length) this.cache.set(key, principal.userId, body, stamp);
                    return sendRtRaw(res, status, body, 'cloud');
                }
                if (status === 401 || status === 403) this.cache.delete(key);
                if (status === 401) throw cloudRefused('etabella.net refused the sign-in for this read (401)');
                if (status >= 400 && status < 500 && json !== NOT_JSON) return sendRtRaw(res, status, body, 'cloud');
                const copy = kept();
                if (copy) return this.sendCached(res, copy);
                throw cloudRefused(`etabella.net answered ${status}${json !== NOT_JSON ? '' : ' with a body that is not JSON'}`);
            }
            case 'unreachable': {
                this.logger.warn(`${route.id}: etabella.net unreachable (${result.reason}): ${result.message}`);
                const copy = kept();
                return copy ? this.sendCached(res, copy) : fallback('offline');
            }
            case 'refused': {
                const copy = result.reason === 'disabled' ? null : kept();
                if (copy) return this.sendCached(res, copy);
                if (result.reason === 'busy') throw new EdgePortError('rate_limited', result.message, { retryAfterSec: 1 });
                throw cloudRefused(result.message);
            }
        }
    }

    /** One cloud call per (user, read) in flight; later identical reads share its result. */
    private coalesced(key: string, call: () => Promise<CloudResult>): Promise<CloudResult> {
        const running = this.pending.get(key);
        if (running) return running;
        const started = call().finally(() => this.pending.delete(key));
        this.pending.set(key, started);
        return started;
    }

    // ---- writes proxied to the cloud -----------------------------------------------------------------------------

    private async cloudWrite(route: RtRoute, principal: EdgePrincipal, req: Request, res: Response): Promise<void> {
        if (principal.kind !== 'online' || !principal.forwardable || !principal.userId || !principal.token) throw reauthError();
        const body = bodyObject(req.body);
        this.requireScope(principal, key => (isRecord(body) ? body[key] : undefined));
        const bytes = Buffer.from(JSON.stringify(withIdentity(body, principal.userId)), 'utf8');
        if (bytes.length > this.opts.maxRequestBodyBytes) throw new EdgePortError('payload_too_large', `the body is larger than ${this.opts.maxRequestBodyBytes} bytes`);
        if (this.offline()) throw offlineError('marking needs the internet (v1, S-D6)');

        const result = await this.proxy.send({
            method: route.method,
            cloudPath: route.cloudPath,
            query: '',
            body: bytes,
            token: principal.token,
            timeoutMs: this.opts.writeTimeoutMs,
            maxBytes: this.opts.maxWriteResponseBytes,
        });
        switch (result.kind) {
            case 'response': {
                const { status, body: answer } = result;
                if (status >= 200 && status < 300) {
                    // The writer's copies are stale (the next read asks the cloud) but kept: if the cloud cannot answer
                    // that read, the writer still gets their own earlier copy (X-Edge-Stale) instead of 429 or nothing.
                    this.cache.expireUser(principal.userId);
                    if (!isJsonOrEmpty(answer)) throw cloudRefused(`etabella.net answered ${status} with a body that is not JSON`);
                    return sendRtRaw(res, status, answer, 'cloud');
                }
                if (status === 401) throw cloudRefused('etabella.net refused the sign-in for this write (401)');
                if (status >= 400 && status < 500 && isJsonOrEmpty(answer)) return sendRtRaw(res, status, answer, 'cloud');
                throw cloudRefused(`etabella.net answered ${status}`);
            }
            case 'unreachable':
                this.logger.warn(`${route.id}: etabella.net unreachable for a write (${result.reason}): ${result.message}`);
                if (result.reason === 'timeout') throw cloudRefused('etabella.net did not answer in time; the write may or may not have been applied');
                throw offlineError('etabella.net cannot be reached');
            case 'refused':
                if (result.reason === 'busy') throw new EdgePortError('rate_limited', result.message, { retryAfterSec: 1 });
                throw cloudRefused(result.message);
        }
    }
}
