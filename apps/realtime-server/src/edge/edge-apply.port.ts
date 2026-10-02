/**
 * EdgeApplyPort: the ONE seam through which the edge module writes a verified round into the cloud page
 * store and broadcasts it (spec §5.5 steps 5 and 7, §5.8; ledger D17, D18, D21).
 *
 * The edge module never touches FeedDataService or EventsGateway directly; it calls this port. Today the
 * port is implemented by FeedDataApplyAdapter over the public surface FeedDataService and the shared
 * socket.io server already have (not batched). A later wave implements a true batched applyPagesAtomic in
 * feed-data.service.ts behind the same port.
 *
 * ===== What the later wave must provide (FeedDataService / EventsGateway), so the adapter can be swapped =====
 *
 * 1. `FeedDataService.runBarrier<T>(nSesid, fn: () => Promise<T>): Promise<T>`
 *    Runs `fn` as ONE task of the global feed queue (the async.queue of concurrency 1, feed-data.service.ts:29-35),
 *    so a round is serialized with live writes, the 1 s disk flush, `sessionEnd` dumps, and bind / revoke barriers.
 *    The result or the rejection of `fn` is passed through. `fn` must not push another task and await it (that
 *    would deadlock); everything below is safe to call from inside it.
 * 2. `FeedDataService.applyPagesAtomic(nSesid, input): Promise<{ redisOk: boolean }>` with
 *    `input = { nLines, totalLines, pages: {p, d, lines}[], digests: string[], deletePagesAbove: number }`,
 *    called from INSIDE runBarrier:
 *      a. synchronously (no await between) set every page in memory and delete memory pages above
 *         `deletePagesAbove`, so `fetch-data` never sees part of a round (D21: atomic = the store);
 *      b. store each page WITH its digest (for D18) — never in data/dt_<id>/ (D10: that folder holds only page_N.json);
 *      c. write all of the round's pages to Redis in ONE pipelined batch (SET session:<nSesid>:<p> … EX 172800,
 *         plus DEL of session:<nSesid>:<q> for q > deletePagesAbove), still inside the task (D17);
 *      d. mark the pages dirty for the 1 s disk flush and prune page_N.json above `deletePagesAbove`;
 *      e. a failed Redis batch is logged and the WHOLE round is kept and retried as one batch at the session's next
 *         applyPagesAtomic (memory already holds the pages; the disk flush is unaffected); it never throws for a
 *         Redis failure and never re-canonicalises (`sanitizeLineCodes` is never applied to edge pages);
 *      f. `nLines` is honoured instead of the literal 25.
 * 3. `FeedDataService.pageSnapshot(nSesid): Map<number, unknown[]>` — the pages held for a session after the boot
 *    restore (Redis → memory, then disk fills missing pages), synchronous, read-only; used for root / seal / D18
 *    recompute. The boot restore order (onInitService is the first queue task) must stay, so the first edge task
 *    already sees restored pages.
 * 4. `EventsGateway.broadcastCut(nSesid, cut: BroadcastCut): void` — executes `planBroadcast(cut)` (rev-tagged
 *    `message` / paced `previous-data` / `feed-shrink` / `feed-resync`) to room `S<nSesid>`, and
 *    `EventsGateway.emitEdgeStatus(nSesid, status)` for the viewer banner (§12, with hysteresis done by the caller).
 * 5. `SessionService.completeGatedSessionEnd(nSesid, nCaseid)` (already present) — the deferred end body run
 *    after a verified seal or a forced close. It must return `{msg: 1}` on success (the port reports `ok` from it).
 *
 * ===== What step 8 must provide outside this port (files the edge module may not edit) =====
 *
 * 6. `SessionService.sessionEnd` for a gated session (bEverEdge or cApply 'C'): call `et_rtedge_session_end`; when
 *    `bPending`, call the exported EDGE_ASSIGN_PUSH(nEdgeid, {op:'end', nSesid}) (it also notes 'S' in the edge
 *    module's binding cache), answer `{msg:1, pending:true}` and DEFER feedData.sessionEnd, route removal and
 *    `on-notification 'E'` until the edge module calls `completeGatedSessionEnd` after the seal (spec §4.4).
 * 7. `EclipseSessionService` 'E' create path: `et_rtedge_session_bind`, then the DORMANT route (feedSource 'E',
 *    nEdgeid, epoch 1, base64 passwordSalt / passwordHash as today, scryptN when not node's default 16384), then
 *    `EdgeRegistryService.pushSessionUpsert(nEdgeid, nSesid)` (exported) so a connected box arms at once (§4.2
 *    step 5; the box's hello pull is the guarantee). `pruneDeadEclipseRoutes` must keep 'E' routes; split (D7) and
 *    "Use direct cloud instead" (O-8) rewrite them through `EdgeRegistryService.updateRoutes`, so both writers must
 *    keep the file's array-of-routes shape.
 * 8. `EclipseTcpIngestService` (cloud listener): a handshake that verifies against a route with feedSource 'E' is
 *    HELD, never parsed: call `EdgeRawStoreService.openHeldStream({nSesid, user, peer, connId, nEdgeid})`, write
 *    only post-handshake bytes into the handle, `close(reason)` when the socket closes (orphan 'H', P1, spec §4.5).
 * 9. `main.ts`: the shared socket.io server keeps `maxHttpBufferSize` ≥ 1 MB (rounds and raw parts are ≤ 256 KB,
 *    a single oversized page ≤ 1 MB) and turns `perMessageDeflate` on (spec §5.3). No ws-auth exemption is needed:
 *    /edge is created with `io.of('/edge')` outside Nest, and WsAuthIoAdapter's `server.use` covers only `/`.
 * 10. Global `HttpErrorFilter` reshapes every HttpException to `{statusCode, message, detailedError}`, so the edge
 *    routes' `{msg:-1, value, cCode}` reaches callers only inside `detailedError` (a JSON string). The box needs only
 *    the HTTP status (challenge, enroll); the admin FE (step 9) must read `cCode` from `detailedError`.
 *
 * ===== State of step 8's (interrupted, uncommitted) feed-data edits, as found on 2026-10-02 =====
 * feed-data.service.ts already carries `runBarrier`, `applyPagesAtomic` and `pageSnapshot`, and
 * feed-data.apply-pages.spec.ts drives THIS adapter over that store ("the edge module's FeedDataApplyAdapter over
 * this store"): those 3 tests pass — the adapter's per-page `setPage` / `deleteExtraPages` calls inside one barrier
 * leave in ONE pipelined Redis batch (D17 met through the adapter's own calls). Step 8a (2026-10-02) finished the
 * store: that file's own applyPagesAtomic tests (shrink DEL in the same pipeline; whole-round retry; per-session
 * retry isolation) now pass. The adapter may therefore switch to `feed.runBarrier` and
 * `feed.applyPagesAtomic({nLines, totalLines, pages, digests, deletePagesAbove, rev})` directly (cut snapshots
 * would then carry the rev without the viewer port); it still keeps the calls below, which that spec pins.
 * `edge-status` goes through `EventsGateway.announceEdgeStatus` (full cloud-viewer payload) since 2026-10-02.
 *
 * ===== What the adapter does today (FeedDataApplyAdapter) =====
 * - runBarrier: pushes the task into FeedDataService's private `queue` when it exists (a structural check, the
 *   only private member touched); otherwise serializes edge tasks on a local promise chain.
 * - applyRoundAtomic: (a) synchronous memory swap through the public `manager` (setPageData / deletePageData);
 *   (c) Redis + (d) dirty marks through the public `setPage` once per page — NOT one batch; `setPage` swallows a
 *   Redis error (logged by FeedDataService), so the whole-round retry of 2e is not available until the later
 *   wave; a stale Redis page after a restart is caught by the D18 boot recompute and resent by the box.
 *   Dropped pages go through the public `deleteExtraPages` (memory, Redis, disk). Digests are kept by the edge
 *   module in its own meta (edge:meta:<nSesid> and data/journal/<nSesid>/edge-meta.json), not in the page store.
 * - currentPages: `restoreFromDiskIfNeeded` then `readSessionData` (memory, else Redis).
 * - broadcastCut / emitToSession: `planBroadcast` executed on the shared socket.io server (the same server
 *   EventsGateway emits on), later steps paced with unref'd timers.
 * - completeSessionEnd: SessionService.completeGatedSessionEnd when the running app has it; otherwise the same
 *   steps (feed dump, route removal, on-notification 'E').
 * - feedPathChanged: EventsGateway.forgetIngestLane (the gateway is `viewers`), so a session re-bound to direct cloud
 *   is no longer refused legacy ingest for the rest of the gateway's 60 s lane cache.
 */
import { Logger } from '@nestjs/common';
import type { ModulesContainer } from '@nestjs/core';
import { BroadcastCut, planBroadcast, RoundApplyPlan, sessionRoom } from '@app/edge-sync';

import { EventsGateway } from '../events/events.gateway';
import { EclipseSessionService } from '../services/eclipse-session/eclipse-session.service';
import { FeedDataService } from '../services/feed-data/feed-data.service';
import { SessionService } from '../services/session/session.service';

export const EDGE_APPLY_PORT = 'RT_EDGE_APPLY_PORT';

export interface EdgeApplyOutcome {
    /** pages written to the store */
    appliedPages: number;
    /** pages above this number were deleted (null when nothing was dropped) */
    deletedAbove: number | null;
    /** true only once the later wave's single pipelined Redis batch is in place */
    redisBatched: boolean;
}

export interface EdgeSessionEndOutcome {
    ok: boolean;
    via: 'session-service' | 'fallback' | 'none';
    detail?: unknown;
}

export interface EdgeApplyPort {
    /** The live page store is reachable (false: rounds answer BUSY). */
    ready(): boolean;
    /** Run `fn` as one serialized task of the page store (spec §5.5: one queue task per round; barriers). */
    runBarrier<T>(nSesid: string, fn: () => Promise<T>): Promise<T>;
    /** Every page the store holds for the session (memory, Redis, disk restore), page number → lines. */
    currentPages(nSesid: string): Promise<Map<number, unknown[]>>;
    /** Apply a validated round (validateRound's plan) atomically to the store. Call inside runBarrier. */
    applyRoundAtomic(nSesid: string, plan: RoundApplyPlan): Promise<EdgeApplyOutcome>;
    /** Delete stored pages above `maxPage` (memory, Redis, disk). Call inside runBarrier. */
    deletePagesAbove(nSesid: string, maxPage: number): Promise<void>;
    /** Broadcast one applied round to viewers (rev-tagged plan, §5.8). */
    broadcastCut(nSesid: string, cut: BroadcastCut): void;
    /** Emit to the session room S<nSesid> (edge-status, realtime-events). */
    emitToSession(nSesid: string, event: string, payload: unknown): void;
    /** Emit to every connected client (on-notification). */
    emitToAll(event: string, payload: unknown): void;
    /** The deferred end body after a verified seal or a forced close (spec §4.4 "Seal verified"). */
    completeSessionEnd(nSesid: string, nCaseid: string | null): Promise<EdgeSessionEndOutcome>;
    /**
     * The session's feed path changed ("Use direct cloud instead", a split's new Part 2, a failed venue create
     * unbound): the viewer gateway forgets its cached ingest-lane verdict, so legacy ingest is judged on the new
     * path at once instead of after the 60 s cache. Never throws.
     */
    feedPathChanged(nSesid: string): void;
}

// ---------------------------------------------------------------------------------------------------------------
// Adapter over today's FeedDataService
// ---------------------------------------------------------------------------------------------------------------

/** The public FeedDataService surface the adapter uses (structural, so specs pass a fake). */
export interface FeedStoreLike {
    manager: {
        setPageData(session: string, page: number, data: any[]): void;
        deletePageData(session: string, page: number): boolean;
        getSessionData(session: string): { [page: number]: any[] } | null;
    };
    setPage(sessionId: string, pageNumber: number, data: any[]): Promise<boolean>;
    deleteExtraPages(sessionId: string, maxPage: number): Promise<boolean>;
    restoreFromDiskIfNeeded(sessionId: string): Promise<void>;
    readSessionData(sessionId: string): Promise<{ [page: number]: any[] }>;
    sessionEnd(sessionId: string): Promise<boolean>;
}

/** socket.io server or namespace: what an emit needs. */
export interface EmitterLike {
    to(room: string): { emit(event: string, payload: unknown): unknown };
    emit(event: string, payload: unknown): unknown;
}

export interface EdgeApplyTargets {
    feed: FeedStoreLike | null;
    io: EmitterLike | null;
    session?: { completeGatedSessionEnd(nSesid: string, nCaseid?: string): Promise<any> } | null;
    routes?: { removeEclipseRoute(nSesid: string): Promise<void> } | null;
    /**
     * EventsGateway: sends `edge-status` with the cloud-viewer names (venue, since, lag, CAT link), and forgets a
     * session's cached ingest-lane verdict when its feed path changes (`forgetIngestLane`).
     */
    viewers?: { announceEdgeStatus(nSesid: string): boolean; forgetIngestLane?(nSesid: string): void } | null;
}

export class FeedDataApplyAdapter implements EdgeApplyPort {
    private readonly logger = new Logger('EdgeApply');
    private localChain: Promise<unknown> = Promise.resolve();
    private resolved: EdgeApplyTargets | null = null;

    /** `targets` is resolved lazily (the providers live in the module that imports this one). */
    constructor(
        private readonly targets: () => EdgeApplyTargets,
        private readonly timers: { setTimeout: (fn: () => void, ms: number) => unknown } = {
            setTimeout: (fn, ms) => {
                const t = setTimeout(fn, ms);
                (t as any).unref?.();
                return t;
            },
        },
    ) { }

    private get t(): EdgeApplyTargets {
        if (!this.resolved || !this.resolved.feed || !this.resolved.io) {
            try {
                this.resolved = this.targets();
            } catch (error) {
                this.logger.error(`apply targets could not be resolved: ${(error as Error)?.message ?? error}`);
                this.resolved = { feed: null, io: null };
            }
        }
        return this.resolved;
    }

    private feed(): FeedStoreLike {
        const feed = this.t.feed;
        if (!feed) throw new Error('rt-edge: the page store (FeedDataService) is not available');
        return feed;
    }

    ready(): boolean {
        return !!this.t.feed;
    }

    runBarrier<T>(nSesid: string, fn: () => Promise<T>): Promise<T> {
        const queue = (this.t.feed as any)?.queue;
        if (queue && typeof queue.push === 'function') {
            return new Promise<T>((resolve, reject) => {
                queue.push(async () => {
                    try {
                        resolve(await fn());
                    } catch (error) {
                        reject(error);
                    }
                });
            });
        }
        const run = this.localChain.then(() => fn());
        this.localChain = run.then(() => undefined, () => undefined);
        return run;
    }

    async currentPages(nSesid: string): Promise<Map<number, unknown[]>> {
        const feed = this.feed();
        await feed.restoreFromDiskIfNeeded(nSesid);
        const data = (await feed.readSessionData(nSesid)) || {};
        const out = new Map<number, unknown[]>();
        for (const [k, v] of Object.entries(data)) {
            const p = Number(k);
            if (Number.isSafeInteger(p) && Array.isArray(v)) out.set(p, v);
        }
        return out;
    }

    async applyRoundAtomic(nSesid: string, plan: RoundApplyPlan): Promise<EdgeApplyOutcome> {
        const feed = this.feed();
        // (a) one synchronous memory swap: no await until every page of the round is in place.
        const held = feed.manager.getSessionData(nSesid) || {};
        const stalePages = Object.keys(held).map(Number).filter(p => Number.isSafeInteger(p) && p > plan.deletePagesAbove);
        for (const pg of plan.pages) feed.manager.setPageData(nSesid, pg.p, pg.lines as any[]);
        for (const p of stalePages) feed.manager.deletePageData(nSesid, p);
        // (c)+(d) Redis and the disk dirty marks, one page at a time (the later wave batches this, D17).
        for (const pg of plan.pages) await feed.setPage(nSesid, pg.p, pg.lines as any[]);
        let deletedAbove: number | null = null;
        if (stalePages.length || plan.droppedPages.length) {
            await feed.deleteExtraPages(nSesid, plan.deletePagesAbove);
            deletedAbove = plan.deletePagesAbove;
        }
        return { appliedPages: plan.pages.length, deletedAbove, redisBatched: false };
    }

    async deletePagesAbove(nSesid: string, maxPage: number): Promise<void> {
        await this.feed().deleteExtraPages(nSesid, maxPage);
    }

    broadcastCut(nSesid: string, cut: BroadcastCut): void {
        const io = this.t.io;
        if (!io) {
            this.logger.warn(`no socket server: round rev ${cut.rev} of ${nSesid} not broadcast`);
            return;
        }
        const plan = planBroadcast(cut);
        for (const step of plan.steps) {
            const send = () => {
                for (const e of step.emits) {
                    try {
                        io.to(e.room).emit(e.event, e.payload);
                    } catch (error) {
                        this.logger.warn(`broadcast of ${e.event} to ${e.room} failed: ${(error as Error)?.message ?? error}`);
                    }
                }
            };
            if (step.atMs <= 0) send();
            else this.timers.setTimeout(send, step.atMs);
        }
    }

    emitToSession(nSesid: string, event: string, payload: unknown): void {
        try {
            // edge-status goes through the gateway, which sends the full cloud-viewer payload (CONTRACTS §9.1) and
            // keeps the room watched; the narrow payload below is only the fallback without it.
            if (event === 'edge-status' && this.t.viewers?.announceEdgeStatus?.(nSesid)) return;
            this.t.io?.to(sessionRoom(nSesid)).emit(event, payload);
        } catch (error) {
            this.logger.warn(`emit ${event} to ${sessionRoom(nSesid)} failed: ${(error as Error)?.message ?? error}`);
        }
    }

    emitToAll(event: string, payload: unknown): void {
        try {
            this.t.io?.emit(event, payload);
        } catch (error) {
            this.logger.warn(`emit ${event} failed: ${(error as Error)?.message ?? error}`);
        }
    }

    feedPathChanged(nSesid: string): void {
        try {
            this.t.viewers?.forgetIngestLane?.(nSesid);
        } catch (error) {
            this.logger.warn(`ingest lane of ${nSesid} not forgotten: ${(error as Error)?.message ?? error}`);
        }
    }

    async completeSessionEnd(nSesid: string, nCaseid: string | null): Promise<EdgeSessionEndOutcome> {
        const { session, feed, routes } = this.t;
        if (session && typeof session.completeGatedSessionEnd === 'function') {
            try {
                const res = await session.completeGatedSessionEnd(nSesid, nCaseid ?? undefined);
                return { ok: Number(res?.msg) === 1, via: 'session-service', detail: res };
            } catch (error) {
                this.logger.error(`completeGatedSessionEnd(${nSesid}) failed: ${(error as Error)?.message ?? error}`);
                return { ok: false, via: 'session-service', detail: (error as Error)?.message };
            }
        }
        if (!feed) return { ok: false, via: 'none' };
        let dumped = false;
        try {
            dumped = await feed.sessionEnd(nSesid);
        } catch (error) {
            this.logger.error(`feed dump of ${nSesid} failed: ${(error as Error)?.message ?? error}`);
        }
        try {
            await routes?.removeEclipseRoute(nSesid);
        } catch {
            /* best effort, like SessionService */
        }
        this.emitToAll('on-notification', { msg: 1, nSesid, nCaseid, cStatus: 'E' });
        return { ok: dumped, via: 'fallback' };
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Resolving the live providers
// ---------------------------------------------------------------------------------------------------------------

interface ModuleLike {
    providers: Map<any, { instance?: any }>;
}

/**
 * The FeedDataService (and SessionService, EclipseSessionService) that live BESIDE the EventsGateway.
 * realtime-server holds more than one FeedDataService instance (TranscriptModule provides its own), and
 * only the one the gateway reads for `fetch-data` is the live store, so the module is found by its
 * EventsGateway provider rather than by `moduleRef.get(FeedDataService, { strict: false })`.
 */
export function resolveLiveFeedTargets(modules: ModulesContainer | Map<string, ModuleLike> | null | undefined): Omit<EdgeApplyTargets, 'io'> {
    if (!modules) return { feed: null };
    for (const mod of (modules as Map<string, ModuleLike>).values()) {
        const providers = mod?.providers;
        if (!providers || typeof providers.get !== 'function' || !providers.has(EventsGateway)) continue;
        const instance = (token: any) => providers.get(token)?.instance ?? null;
        return {
            feed: instance(FeedDataService),
            session: instance(SessionService),
            routes: instance(EclipseSessionService),
            viewers: instance(EventsGateway),
        };
    }
    return { feed: null };
}
