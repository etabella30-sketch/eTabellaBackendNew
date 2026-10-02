/**
 * EdgeSyncService (spec §3.2 `edge-sync.service.ts`; §4.4, §4.5, §5.4–§5.7; ledger D7, D10, D17, D18, D19;
 * build defaults O-1, O-3, O-5, O-6, O-7, O-8).
 *
 * Box → cloud replication, cloud side. All protocol decisions come from @app/edge-sync:
 *   - hello: `helloVerdict` (MR-3, D19) per session, after the D18 boot recompute (`bootDigests`) of the
 *     session's digests from the pages actually restored; a parser-version or fmt mismatch freezes (O-1).
 *   - rounds: `RoundAssembler` (multi-part, out of order, 60 s TTL) → `validateRound` (binding, rev, lineage
 *     MR-1 incl. the D19 last-applied check, pages, root over stored ⊕ round, shrink guard MR-2) run INSIDE the
 *     page store's queue task (`EdgeApplyPort.runBarrier`, the in-queue fence of §5.5 step 0), then
 *     `applyRoundAtomic` + edge meta + `broadcastCutFromRound` / `broadcastCut`.
 *   - seal: `checkSeal` (§5.7 1–6, root recomputed from STORED pages) → et_rtedge_session_seal (K / W / F) →
 *     the deferred end body (SessionService.completeGatedSessionEnd) → archive.
 * Edge meta (D10) per session: memory, Redis `edge:meta:<nSesid>` and `<journalDir>/<nSesid>/edge-meta.json`;
 * the throttled PG fallback watermark goes through et_rtedge_applied (≤ 60 s, exact at split and seal).
 *
 * Session lifecycle actions also live here because they need the meta: Split to direct cloud (D7, O-5, O-6),
 * "Use direct cloud instead" (O-8), revoke handling, held-shrink decisions (MR-2), forced close (O-3, S-D8),
 * warning acknowledgement and the feed status read.
 *
 * A frozen session (FORK / D19 / parser mismatch / rejected shrink) applies nothing until an admin splits
 * (D7); the freeze is kept in the meta and never cleared automatically.
 *
 * The in-queue fence (§5.5 step 0, review #32): a round re-checks, INSIDE the page store's queue task, the
 * in-memory binding record and the connection's box state. Every binding change this process makes (seal, forced
 * close, "Use direct cloud instead") is a barrier: one queue task raises the session's fence (rounds after it
 * answer BUSY), the SP runs OUTSIDE the queue, and the record is refreshed before the fence drops. The database is
 * read inside the queue only on a cache miss, bounded by queueIoBoundMs (BUSY on timeout), and the Redis meta write
 * is bounded the same way, so a slow PG or Redis never parks other sessions' writes.
 *
 * The deferred end body after a seal (review #4/#33) is idempotent and runs whenever it has not completed: on the
 * first seal, on a repeated seal or forced close, on a retry timer after a failure, and from a sweep (boot, then
 * every endBodySweepMs) of sealed sessions whose dormant 'E' route is still in the route file.
 */
import { Inject, Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';

import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import {
    bootDigests,
    broadcastCutFromRound,
    checkPendingRawPair,
    checkSeal,
    CloudSessionMeta,
    EDGE_FMT,
    EdgeCapture,
    EdgeHello,
    EdgeHelloReplySession,
    EdgeIncident,
    EdgeRaw,
    EdgeRawPull,
    EdgeRound,
    EdgeSeal,
    EdgeStatus,
    emptyCloudMeta,
    helloVerdict,
    HelloVerdict,
    isDigest,
    isSupportedFmt,
    MAX_PART_BYTES,
    negotiateProto,
    pageCount,
    RawPosition,
    RawReply,
    RoundAssembler,
    RoundReply,
    SealReply,
    sealSigningPayload,
    UnsupportedFmtError,
    validateRound,
} from '@app/edge-sync';

import { EDGE_APPLY_PORT, EdgeApplyPort } from './edge-apply.port';
import { verifyDeviceSignature } from './edge-auth.middleware';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeNodeStatus, EdgeRegistryService } from './edge-registry.service';
import {
    bindingFromRow,
    callSp,
    EDGE_BINDING_SQL,
    EDGE_CASE_ADMIN_SQL,
    EDGE_CONFIG,
    EDGE_LIMITS,
    EDGE_MESSAGE_LIMITS,
    EDGE_OPTIONS,
    EDGE_REDIS,
    EDGE_SEAL_FIELDS_SQL,
    EDGE_SESSION_CREATOR_SQL,
    EDGE_SUCCESSOR_SQL,
    EdgeActorRef,
    EdgeBinding,
    edgeClock,
    edgeEnabled,
    EdgeModuleOptions,
    EdgeServiceError,
    edgeTimings,
    EdgeTimings,
    EdgeTokenBucket,
    firstRow,
    isBoundTo,
    mayOperate,
    normId,
    num,
    peerIp,
    personName,
    readRows,
    spOk,
    spRefusal,
    withTimeout,
} from './edge.types';

// ---------------------------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------------------------

/** One authenticated /edge connection, as the services see it. */
export interface EdgeConnCtx {
    nEdgeid: string;
    bootId: string;
    status: EdgeNodeStatus;
    /** base64 SPKI of the box key (seal signature) */
    pubKey: string | null;
    ip: string | null;
    /** sessions that passed hello on THIS connection with verdict continue / end (MR-6: hello before pages) */
    helloed: Map<string, HelloVerdict>;
}

/** The edge meta the cloud keeps per venue session (D10). */
export interface CloudEdgeMeta extends CloudSessionMeta {
    nEdgeid: string | null;
    frozenReason?: string | null;
    frozenAtMs?: number | null;
    /** MR-1: (seq, hash) pairs applied before the raw lane reached them */
    pendingRawChecks?: RawPosition[];
    /** incidents only the cloud knows (SHRINK_CONFIRMED), added to the seal's list */
    cloudIncidents?: EdgeIncident[];
    heldShrink?: { heldId: string; rev: number; removed: number; fromTotal: number; toTotal: number; atMs: number } | null;
    /** the seal (or forced close); `endBodyAtMs` once the deferred end body completed, `archivedAtMs` once archived */
    sealed?: { state: string; atMs: number; endBodyAtMs?: number | null; archivedAtMs?: number | null } | null;
    updatedAtMs?: number;
}

/** What the end body needs to know about the session. */
export type EndBodyBinding = Pick<EdgeBinding, 'nCaseid' | 'nEdgeid' | 'bDeleted' | 'cSyncState'>;

/** What the deferred end body did (seal, forced close, sweep). */
export interface EdgeEndBodyOutcome {
    ok: boolean;
    /** 'done': it had already completed; 'deleted': a soft-deleted session's route was removed by this module */
    via: 'session-service' | 'fallback' | 'none' | 'done' | 'deleted';
    detail?: unknown;
}

export type EdgeHelloRefusal = { ok: false; code: 'QUARANTINED' | 'DUP_IDENTITY' | 'UPGRADE' | 'PROTO_UNSUPPORTED' | 'REVOKED' | 'NOT_ACTIVE' | 'BAD_REQUEST'; message: string };

/** The hello reply (protocol EdgeHelloReply) plus the additive fields this cloud sends. */
export interface EdgeHelloReplyWire {
    serverNowMs: number;
    proto: number;
    edgeTokenKeys: Array<Record<string, unknown>>;
    limits: { edgeBps: number; rawMinBps: number; maxPart: number };
    sessions: EdgeHelloReplySession[];
    assignments: any[];
    revocations: { users: string[]; jtis: string[]; since: number };
    /** Full assignment pull (EdgeAssignmentSnapshotWire): names, e-mail, cases, Part 2 pointers, super-admins. */
    assignmentSnapshot: unknown;
    /** The address the cloud sees the box connect from (the box reports it back as e.status device.egressIp, §12). */
    egressIp: string | null;
}

interface HeldRound {
    heldId: string;
    round: EdgeRound;
    nEdgeid: string;
    removed: number;
    fromTotal: number;
    toTotal: number;
    atMs: number;
}

type ViewerState = 'live' | 'catching-up' | 'offline' | 'sealed';

const SEALED_STATES = new Set(['K', 'W', 'F']);

/** §5.6: a box back after more than this offline shows its sessions catching-up until a round leaves nothing dirty. */
export const CATCH_UP_OFFLINE_MS = 30_000;

/** The box state the authenticated connection carries ('A' active; 'Q' status only; 'X' revoked mid-connection). */
const active = (conn: EdgeConnCtx): boolean => conn.status === 'A';

// ---------------------------------------------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------------------------------------------

@Injectable()
export class EdgeSyncService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger('EdgeSync');
    private readonly timings: EdgeTimings;
    private readonly clock: () => number;
    /** limits.maxPart of the hello reply */
    private readonly maxPart: number;
    private readonly assembler = new RoundAssembler();
    private readonly bucket: EdgeTokenBucket;
    private readonly metas = new Map<string, CloudEdgeMeta>();
    private readonly metaLoading = new Map<string, Promise<CloudEdgeMeta | null>>();
    private readonly booted = new Set<string>();
    private readonly bindings = new Map<string, EdgeBinding>();
    private readonly held = new Map<string, HeldRound>();
    private readonly appliedAt = new Map<string, number>();
    private readonly regress = new Map<string, number[]>();
    private readonly metaFileWrites = new Map<string, Promise<void>>();
    private readonly viewer = new Map<string, ViewerState>();
    private readonly boxSessions = new Map<string, Set<string>>();
    private readonly boxTimers = new Map<string, { online?: any; offline?: any; silent?: any }>();
    private readonly connected = new Set<string>();
    /** boxes connected for longer than the online hysteresis */
    private readonly stable = new Set<string>();
    /** when each box went offline (catching-up rule, §5.6) */
    private readonly offlineSince = new Map<string, number>();
    /** sessions in catch-up (back after > 30 s offline, or a round of more than 8 pages), §5.6 */
    private readonly catchingUp = new Set<string>();
    /** bytes staged per session for its in-flight multi-part round (size limit) */
    private readonly stagedBytes = new Map<string, { rev: number; bytes: number }>();
    /** sessions whose binding this process is changing right now (§5.5 step 0 answers BUSY), with a count */
    private readonly fenced = new Map<string, number>();
    /** bumped whenever a barrier changes a cached binding: a PG read that started before it never overwrites it */
    private readonly bindingRev = new Map<string, number>();
    /** Redis meta writes per session, in order (bounded wait inside the queue, #32) */
    private readonly redisWrites = new Map<string, Promise<void>>();
    /** the deferred end body in flight per session (one at a time) */
    private readonly ending = new Map<string, Promise<EdgeEndBodyOutcome>>();
    /** sessions whose end body completed in this process (also recorded in the meta when there is one) */
    private readonly endDone = new Set<string>();
    private readonly endRetry = new Map<string, { timer: any; attempts: number }>();
    private sweepTimer: any = null;

    constructor(
        private readonly db: DbService,
        private readonly redis: RedisDbService,
        private readonly config: ConfigService,
        private readonly registry: EdgeRegistryService,
        private readonly rawStore: EdgeRawStoreService,
        @Inject(EDGE_APPLY_PORT) private readonly apply: EdgeApplyPort,
        @Optional() @Inject(EDGE_OPTIONS) opts?: EdgeModuleOptions,
    ) {
        this.timings = edgeTimings(opts);
        this.clock = edgeClock(opts);
        const maxPart = Number(opts?.maxPartBytes);
        this.maxPart = Number.isSafeInteger(maxPart) && maxPart > 1024 ? Math.min(maxPart, MAX_PART_BYTES) : MAX_PART_BYTES;
        this.bucket = new EdgeTokenBucket(EDGE_LIMITS.edgeBps, EDGE_LIMITS.burstBytes, this.clock);
        this.rawStore.onAdvance(nSesid => this.recheckPendingPairs(nSesid));
        // A failed venue create unbound by EclipseSessionService (it reaches only the registry).
        this.registry.onFeedPathChanged?.(nSesid => this.feedPathChanged(nSesid));
    }

    /**
     * A session's feed path changed (re-bound to direct cloud, a split's new Part 2, a failed create unbound): drop
     * the cached binding and tell the viewer gateway, through the apply port, to forget its ingest-lane verdict
     * (EventsGateway.forgetIngestLane), so legacy ingest is judged on the new path at once. Never throws.
     */
    feedPathChanged(nSesid: string): void {
        const id = normId(nSesid);
        if (!id) return;
        this.invalidateBinding(id);
        try {
            this.apply.feedPathChanged(id);
        } catch (error) {
            this.logger.warn(`feed-path change of ${id} not passed on: ${(error as Error)?.message ?? error}`);
        }
    }

    /** EDGE_ENABLED only: sweep sealed sessions whose deferred end body never completed (boot, then periodically). */
    onApplicationBootstrap(): void {
        if (!edgeEnabled(this.config)) return;
        this.scheduleEndSweep(0);
    }

    onModuleDestroy(): void {
        for (const t of this.boxTimers.values()) for (const h of Object.values(t)) if (h) clearTimeout(h);
        this.boxTimers.clear();
        for (const r of this.endRetry.values()) clearTimeout(r.timer);
        this.endRetry.clear();
        if (this.sweepTimer) clearTimeout(this.sweepTimer);
        this.sweepTimer = null;
    }

    // -----------------------------------------------------------------------------------------------------------
    // Bindings (spec §5.3 per-message checks)
    // -----------------------------------------------------------------------------------------------------------

    /**
     * Read the binding records of sessions from PG and refresh the cache. A row whose cached record a barrier changed
     * while this read was in flight is returned but not cached (the barrier's record, or its fresh re-read, wins).
     */
    async loadBindings(ids: string[]): Promise<Map<string, EdgeBinding>> {
        const clean = [...new Set(ids.map(normId).filter(Boolean))];
        const out = new Map<string, EdgeBinding>();
        if (!clean.length) return out;
        const revs = new Map(clean.map(id => [id, this.bindingRev.get(id) ?? 0]));
        const rows = await readRows(this.db, 'session binding', EDGE_BINDING_SQL, [clean]);
        const current = (id: string) => (this.bindingRev.get(id) ?? 0) === revs.get(id);
        for (const row of rows) {
            const b = bindingFromRow(row);
            if (current(b.nSesid)) this.bindings.set(b.nSesid, b);
            out.set(b.nSesid, b);
        }
        for (const id of clean) if (!out.has(id) && current(id)) this.bindings.delete(id);
        return out;
    }

    /** The cached binding (the per-message check; §5.5 step 0 re-checks it inside the queue), loaded once when absent. */
    async binding(nSesid: string): Promise<EdgeBinding | null> {
        const id = normId(nSesid);
        if (!id) return null;
        if (this.bindings.has(id)) return this.bindings.get(id);
        return (await this.loadBindings([id])).get(id) ?? null;
    }

    invalidateBinding(nSesid: string): void {
        const id = normId(nSesid);
        if (!id) return;
        this.bumpBinding(id);
        this.bindings.delete(id);
    }

    /** A barrier changed the session (end request, split, seal): update the cached sync state at once. */
    noteSyncState(nSesid: string, cSyncState: string): void {
        const id = normId(nSesid);
        if (!id) return;
        this.bumpBinding(id);
        const b = this.bindings.get(id);
        if (b) b.cSyncState = cSyncState;
    }

    private bumpBinding(id: string): void {
        this.bindingRev.set(id, (this.bindingRev.get(id) ?? 0) + 1);
    }

    private raiseFence(id: string): void {
        this.fenced.set(id, (this.fenced.get(id) ?? 0) + 1);
    }

    private dropFence(id: string): void {
        const left = (this.fenced.get(id) ?? 1) - 1;
        if (left > 0) this.fenced.set(id, left);
        else this.fenced.delete(id);
    }

    /**
     * A binding change made by this process as a queue barrier (§5.5 step 0): one queue task raises the session's
     * fence, so every round queued before it applied under the old binding and every round after it answers BUSY
     * until the change is settled. `change` (the SP) runs OUTSIDE the queue, so a slow database parks no other
     * session. Afterwards the cached record is dropped (the next check re-reads the committed row) and the fence
     * drops. Never call it from inside a queue task.
     */
    private async changeBinding<T>(id: string, change: () => Promise<T>): Promise<T> {
        await this.apply.runBarrier(id, async () => this.raiseFence(id));
        try {
            return await change();
        } finally {
            this.invalidateBinding(id);
            this.dropFence(id);
        }
    }

    // -----------------------------------------------------------------------------------------------------------
    // Edge meta (D10) and the D18 boot recompute
    // -----------------------------------------------------------------------------------------------------------

    metaFile(nSesid: string): string {
        return path.join(this.rawStore.journalDir(nSesid), 'edge-meta.json');
    }

    /** Current meta (memory) for tests and status. */
    peekMeta(nSesid: string): CloudEdgeMeta | null {
        return this.metas.get(normId(nSesid)) ?? null;
    }

    /**
     * The meta of a bound session, with the D18 recompute run once per process. `inBarrier` says whether the
     * caller already runs inside the page store's queue task (the recompute must then not queue another).
     */
    private async ensureMeta(nSesid: string, b: EdgeBinding | null, inBarrier: boolean): Promise<CloudEdgeMeta | null> {
        const id = normId(nSesid);
        let m = this.metas.get(id) ?? null;
        if (!m) {
            let pending = this.metaLoading.get(id);
            if (!pending) {
                pending = this.readMeta(id, b).finally(() => this.metaLoading.delete(id));
                this.metaLoading.set(id, pending);
            }
            m = await pending;
            if (!m) return null;
            if (!this.metas.has(id)) this.metas.set(id, m);
            m = this.metas.get(id);
        }
        if (!this.booted.has(id)) {
            this.booted.add(id);
            const run = () => this.bootRecompute(m);
            try {
                if (inBarrier) await run();
                else await this.apply.runBarrier(id, run);
            } catch (error) {
                this.booted.delete(id);
                throw error;
            }
        }
        return m;
    }

    /**
     * The stored meta (Redis and edge-meta.json, the newer wins), or null. The Redis read is bounded (#32): a slow
     * Redis counts as unreadable, exactly like a Redis error, and the file copy (D10) is used.
     */
    private async storedMeta(id: string): Promise<CloudEdgeMeta | null> {
        const candidates: CloudEdgeMeta[] = [];
        try {
            const raw = await withTimeout(Promise.resolve(this.redis.getValue(EDGE_REDIS.meta(id))), this.timings.queueIoBoundMs, 'edge meta read');
            const parsed = raw ? JSON.parse(raw) : null;
            if (validMeta(parsed, id)) candidates.push(parsed);
        } catch (error) {
            this.logger.warn(`edge meta of ${id} unreadable in Redis: ${(error as Error)?.message ?? error}`);
        }
        try {
            const parsed = JSON.parse(await fs.readFile(this.metaFile(id), 'utf8'));
            if (validMeta(parsed, id)) candidates.push(parsed);
        } catch (error) {
            if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') this.logger.warn(`edge-meta.json of ${id} unreadable: ${(error as Error)?.message ?? error}`);
        }
        if (!candidates.length) return null;
        candidates.sort((x, y) => (y.appliedRev ?? 0) - (x.appliedRev ?? 0) || (y.updatedAtMs ?? 0) - (x.updatedAtMs ?? 0));
        return { ...candidates[0], nSesid: id };
    }

    private async readMeta(id: string, b: EdgeBinding | null): Promise<CloudEdgeMeta | null> {
        const stored = await this.storedMeta(id);
        if (stored) return stored;
        if (!b || b.cFeedSource !== 'E') return null;
        const m: CloudEdgeMeta = {
            ...emptyCloudMeta(id, { nLines: b.nLines, fmt: EDGE_FMT, epoch: b.nIngestEpoch, rebaseSeq: b.nRebaseSeq }),
            nEdgeid: b.nEdgeid,
            pendingRawChecks: [],
            cloudIncidents: [],
            heldShrink: null,
            sealed: null,
        };
        if (b.nAppliedRawSeq !== null) {
            // A cloud that lost Redis and data/: the throttled PG pair is the D19 fallback (O-7, README).
            m.appliedRawSeq = b.nAppliedRawSeq;
            m.appliedRawHash = isDigest(b.cAppliedRawHash) ? b.cAppliedRawHash : null;
            this.registry.alert({
                kind: 'META_FALLBACK',
                tier: 'P2',
                nEdgeid: b.nEdgeid,
                nSesid: id,
                message: `Edge meta of ${id} was lost; the lineage resumes from the PG watermark seq ${b.nAppliedRawSeq}${m.appliedRawHash ? '' : ' (no hash: seq-only check)'}`,
            });
        }
        return m;
    }

    /** D18: digests recomputed from the pages actually restored; stale / missing pages make the box resend them. */
    private async bootRecompute(m: CloudEdgeMeta): Promise<void> {
        if (!m.appliedRev && !m.totalLines && !(m.digests ?? []).length) return;
        if (!this.apply.ready()) return;
        const pages = await this.apply.currentPages(m.nSesid);
        const manifest = bootDigests(m, p => pages.get(p), [...pages.keys()]);
        if (manifest.extraPages.length) await this.apply.deletePagesAbove(m.nSesid, pageCount(m.totalLines, m.nLines));
        if (manifest.stalePages.length || manifest.missingPages.length) {
            this.registry.alert({
                kind: 'BOOT_STALE_PAGES',
                tier: 'P2',
                nEdgeid: m.nEdgeid,
                nSesid: m.nSesid,
                message: `After a restart ${manifest.stalePages.length} stale and ${manifest.missingPages.length} missing page(s) of ${m.nSesid}; the box resends them`,
                data: { stalePages: manifest.stalePages.slice(0, 50), missingPages: manifest.missingPages.slice(0, 50) },
            });
        }
        m.digests = manifest.pageDigests;
        m.root = manifest.root;
        await this.saveMeta(m);
    }

    /**
     * Memory now; Redis awaited up to queueIoBoundMs (#32: this runs inside the queue task, and a slow Redis must not
     * park every session's writes; a write still pending continues in the background, per session in order, always
     * writing the latest meta); edge-meta.json written atomically in the background (coalesced).
     */
    async saveMeta(m: CloudEdgeMeta): Promise<void> {
        m.updatedAtMs = this.clock();
        this.metas.set(m.nSesid, m);
        const id = m.nSesid;
        const stamp = m.updatedAtMs;
        const prevRedis = this.redisWrites.get(id) ?? Promise.resolve();
        const redisWrite = prevRedis
            .then(async () => {
                const latest = this.metas.get(id);
                // Gone (re-bound to direct cloud) or superseded by a newer save queued behind this one.
                if (!latest || latest.updatedAtMs !== stamp) return;
                await this.redis.setValue(EDGE_REDIS.meta(id), JSON.stringify(latest), this.timings.metaTtlSec);
            })
            .catch(error => this.logger.warn(`edge meta of ${id} not stored in Redis: ${(error as Error)?.message ?? error}`));
        this.redisWrites.set(id, redisWrite);
        try {
            await withTimeout(redisWrite, this.timings.queueIoBoundMs, 'edge meta write');
        } catch (error) {
            this.logger.warn(`edge meta of ${id}: ${(error as Error)?.message ?? error}; the write continues in the background`);
        }
        const prev = this.metaFileWrites.get(m.nSesid) ?? Promise.resolve();
        const next = prev.then(async () => {
            const latest = this.metas.get(m.nSesid);
            if (!latest || latest.updatedAtMs !== m.updatedAtMs) return; // a newer save follows
            const file = this.metaFile(m.nSesid);
            await fs.mkdir(path.dirname(file), { recursive: true });
            const tmp = `${file}.${process.pid}.tmp`;
            await fs.writeFile(tmp, JSON.stringify(latest, null, 2), 'utf8');
            await fs.rename(tmp, file);
        }).catch(error => this.logger.warn(`edge-meta.json of ${m.nSesid} not written: ${(error as Error)?.message ?? error}`));
        this.metaFileWrites.set(m.nSesid, next);
    }

    /** Wait for pending edge-meta.json and Redis meta writes (tests, shutdown). */
    async flushMetaWrites(): Promise<void> {
        await Promise.all([...this.metaFileWrites.values(), ...this.redisWrites.values()]);
    }

    /** et_rtedge_applied: at most every 60 s per session, or now when `exact` (split). Outside any barrier. */
    async persistApplied(m: CloudEdgeMeta, exact = false): Promise<void> {
        if (m.appliedRawSeq === null || m.appliedRawSeq === undefined) return;
        const now = this.clock();
        if (!exact && now - (this.appliedAt.get(m.nSesid) ?? 0) < this.timings.appliedThrottleMs) return;
        this.appliedAt.set(m.nSesid, now);
        try {
            const params: Record<string, unknown> = { nSesid: m.nSesid, nAppliedRawSeq: m.appliedRawSeq };
            if (m.appliedRawHash) params.cAppliedRawHash = m.appliedRawHash;
            if (m.nEdgeid) params.nEdgeid = m.nEdgeid;
            const row = firstRow(await callSp(this.db, 'rtedge_applied', params));
            if (!spOk(row) && row.cCode === 'FORK') {
                await this.freeze(m, `PG holds another hash for applied seq ${m.appliedRawSeq}`, 'FORK');
            }
        } catch (error) {
            this.appliedAt.delete(m.nSesid);
            this.logger.warn(`applied watermark of ${m.nSesid} not stored: ${(error as Error)?.message ?? error}`);
        }
    }

    /**
     * G5: et_rtedge_session_parser_pin stamps the box's parser version on a session bound before its box reported
     * one (the SP pins only a NULL cParserVer of a live 'E' session of this box). Returns the session's version
     * (stamped now, or by a concurrent hello first), or null when nothing is pinned (refused, failed).
     */
    private async pinParser(id: string, nEdgeid: string, parserVer: string): Promise<string | null> {
        try {
            const row = firstRow(await callSp(this.db, 'rtedge_session_parser_pin', { nSesid: id, nEdgeid, cParserVer: parserVer }));
            if (!spOk(row)) {
                this.logger.warn(`parser version of ${id} not pinned: ${row.cCode ?? row.value}`);
                return null;
            }
            return row.cParserVer ? String(row.cParserVer) : null;
        } catch (error) {
            this.logger.warn(`parser version of ${id} not pinned: ${(error as Error)?.message ?? error}`);
            return null;
        }
    }

    /** Freeze a session's uplink (D19 / FORK): nothing applies until an admin splits; P1 alert. */
    private async freeze(m: CloudEdgeMeta, reason: string, kind: string): Promise<void> {
        if (m.frozen) return;
        m.frozen = true;
        m.frozenReason = reason;
        m.frozenAtMs = this.clock();
        await this.saveMeta(m);
        const b = this.bindings.get(m.nSesid);
        this.registry.alert({
            kind,
            tier: 'P1',
            critical: true,
            nEdgeid: m.nEdgeid,
            nSesid: m.nSesid,
            message: `Uplink of session ${m.nSesid} is frozen: ${reason}. Split to direct cloud.`,
            data: { nHearingOpid: b?.nHearingOpid ?? null },
        });
        void this.registry.event('freeze', { nEdgeid: m.nEdgeid, nSesid: m.nSesid, jData: { kind, reason } }).catch(() => undefined);
    }

    /** MR-1: re-check (seq, hash) pairs queued before the raw lane reached them. */
    private recheckPendingPairs(nSesid: string): void {
        const m = this.metas.get(normId(nSesid));
        if (!m?.pendingRawChecks?.length) return;
        const keep: RawPosition[] = [];
        let fork: RawPosition | null = null;
        for (const pair of m.pendingRawChecks) {
            const v = checkPendingRawPair(pair, seq => this.rawStore.hashAt(m.nSesid, seq));
            if (v === 'pending') keep.push(pair);
            else if (v === 'fork') fork = pair;
        }
        m.pendingRawChecks = keep;
        if (fork) void this.freeze(m, `the raw store holds seq ${fork.seq} with another hash than an applied round`, 'FORK');
        else void this.saveMeta(m);
    }

    // -----------------------------------------------------------------------------------------------------------
    // Connections and the viewer edge-status
    // -----------------------------------------------------------------------------------------------------------

    boxConnected(conn: EdgeConnCtx): void {
        const id = conn.nEdgeid;
        this.connected.add(id);
        const since = this.offlineSince.get(id);
        this.offlineSince.delete(id);
        // §5.6: back after more than 30 s offline, its sessions catch up until a round leaves nothing dirty.
        if (since !== undefined && this.clock() - since > CATCH_UP_OFFLINE_MS) {
            for (const s of this.boxSessions.get(id) ?? []) this.catchingUp.add(s);
        }
        const t = this.timers(id);
        clearTimeout(t.offline);
        clearTimeout(t.silent);
        t.offline = t.silent = undefined;
        clearTimeout(t.online);
        t.online = this.later(() => {
            this.stable.add(id);
            for (const s of this.boxSessions.get(id) ?? []) this.setViewer(s, this.catchingUp.has(s) ? 'catching-up' : 'live');
        }, this.timings.viewerOnlineAfterMs);
    }

    boxDisconnected(conn: EdgeConnCtx): void {
        const id = conn.nEdgeid;
        this.connected.delete(id);
        this.stable.delete(id);
        if (!this.offlineSince.has(id)) this.offlineSince.set(id, this.clock());
        const t = this.timers(id);
        clearTimeout(t.online);
        t.online = undefined;
        clearTimeout(t.offline);
        t.offline = this.later(() => this.setViewerForBox(id, 'offline'), this.timings.viewerOfflineAfterMs);
        clearTimeout(t.silent);
        t.silent = this.later(() => {
            if (this.connected.has(id)) return;
            const live = [...(this.boxSessions.get(id) ?? [])].filter(s => this.bindings.get(s)?.cSyncState === 'L');
            if (live.length) {
                this.registry.alert({ kind: 'BOX_SILENT', tier: 'P1', nEdgeid: id, message: `Box ${id} has been silent for ${Math.round(this.timings.silentPageAfterMs / 1000)} s with ${live.length} live session(s)`, data: { sessions: live } });
            }
        }, this.timings.silentPageAfterMs);
    }

    private timers(nEdgeid: string) {
        let t = this.boxTimers.get(nEdgeid);
        if (!t) this.boxTimers.set(nEdgeid, (t = {}));
        return t;
    }

    private later(fn: () => void, ms: number) {
        const h = setTimeout(fn, ms);
        (h as any).unref?.();
        return h;
    }

    private setViewerForBox(nEdgeid: string, state: ViewerState): void {
        for (const s of this.boxSessions.get(nEdgeid) ?? []) this.setViewer(s, state);
    }

    private setViewer(nSesid: string, state: ViewerState): void {
        if (this.viewer.get(nSesid) === state) return;
        this.viewer.set(nSesid, state);
        const m = this.metas.get(nSesid);
        this.apply.emitToSession(nSesid, 'edge-status', {
            nSesid,
            state,
            atMs: this.clock(),
            appliedRev: m?.appliedRev ?? 0,
            totalLines: m?.totalLines ?? 0,
            lastSyncedAtMs: m?.updatedAtMs ?? null,
        });
    }

    viewerState(nSesid: string): ViewerState | null {
        return this.viewer.get(normId(nSesid)) ?? null;
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.hello (§5.4, §5.5 resume)
    // -----------------------------------------------------------------------------------------------------------

    async hello(conn: EdgeConnCtx, body: EdgeHello): Promise<EdgeHelloReplyWire | EdgeHelloRefusal> {
        if (conn.status === 'X') return { ok: false, code: 'REVOKED', message: 'this box is revoked' };
        if (conn.status === 'Q') return { ok: false, code: 'QUARANTINED', message: 'This box is quarantined: it may report status only' };
        if (!body || typeof body !== 'object' || !Array.isArray(body.sessions) || body.sessions.length > 256) {
            return { ok: false, code: 'BAD_REQUEST', message: 'hello needs a sessions array' };
        }
        // bootId fencing (MR-6): the hello speaks for the boot that signed this connection, never another one.
        if (body.bootId !== undefined && String(body.bootId) !== conn.bootId) {
            // The claimed boot id is box input: only its safe characters reach the log line.
            const claimed = String(body.bootId).replace(/[^A-Za-z0-9._:-]/g, '?').slice(0, 64);
            this.registry.alert({ kind: 'BOOT_ID_MISMATCH', tier: 'P1', nEdgeid: conn.nEdgeid, message: `Box ${conn.nEdgeid} sent a hello for boot ${claimed} on the connection of boot ${conn.bootId}` });
            return { ok: false, code: 'BAD_REQUEST', message: 'bootId differs from the authenticated connection' };
        }
        const proto = negotiateProto(Number(body.proto), Number(body.protoMin ?? body.proto));
        if (proto === null) {
            // UPGRADE is reserved for boxes without unsealed sessions (spec §5.3 "Compatibility").
            if (body.sessions.length) {
                this.registry.alert({ kind: 'PROTO_UNSUPPORTED', tier: 'P1', nEdgeid: conn.nEdgeid, message: `Box ${conn.nEdgeid} speaks protocol ${body.proto}..${body.protoMin}, which this cloud cannot serve, with unsealed sessions` });
                return { ok: false, code: 'PROTO_UNSUPPORTED', message: `protocol ${body.proto} is not supported` };
            }
            return { ok: false, code: 'UPGRADE', message: 'this box software must be updated' };
        }

        const pull = await this.registry.assignments(conn.nEdgeid);
        if (!pull.ok) {
            if (pull.code === 'QUARANTINED') {
                conn.status = 'Q';
                return { ok: false, code: 'QUARANTINED', message: 'This box is quarantined: it may report status only' };
            }
            return { ok: false, code: pull.code === 'REVOKED' ? 'REVOKED' : 'NOT_ACTIVE', message: `box is not active (${pull.code})` };
        }

        const reported = body.sessions.filter(s => s && normId(s.nSesid));
        const ids = new Set<string>([...reported.map(s => normId(s.nSesid)), ...pull.snapshot.sessions.map(s => s.nSesid)]);
        const bindings = await this.loadBindings([...ids]);
        const mine = new Set<string>();
        for (const [id, b] of bindings) if (isBoundTo(b, conn.nEdgeid) && !SEALED_STATES.has(b.cSyncState ?? '')) mine.add(id);
        this.boxSessions.set(conn.nEdgeid, mine);

        const replies: EdgeHelloReplySession[] = [];
        for (const s of body.sessions) {
            const id = normId(s?.nSesid);
            if (!id) continue;
            const b = bindings.get(id) ?? null;
            if (!isBoundTo(b, conn.nEdgeid)) {
                conn.helloed.delete(id);
                replies.push({ ...helloVerdict(s, { meta: null, bound: false, rawAcked: { seq: 0, hash: '' } }), nSesid: s.nSesid });
                continue;
            }
            await this.rawStore.ensureLoaded(id);
            const m = await this.ensureMeta(id, b, false);
            if (!m) {
                replies.push({ ...helloVerdict(s, { meta: null, bound: false, rawAcked: { seq: 0, hash: '' } }), nSesid: s.nSesid });
                continue;
            }
            const sealed = SEALED_STATES.has(b.cSyncState ?? '');
            if (!sealed && !b.cParserVer && typeof body.parserVer === 'string' && body.parserVer) {
                // G5: bound before its box ever reported a parser version, the session is pinned now, to what the
                // box runs (spec §4.2 "stamps cParserVer"; DET-10: a session is pinned to its lineage's parser).
                const pinned = await this.pinParser(id, conn.nEdgeid, body.parserVer);
                if (pinned) b.cParserVer = pinned;
            }
            if (!sealed && !m.frozen) {
                if (b.cParserVer && body.parserVer && b.cParserVer !== body.parserVer) {
                    await this.freeze(m, `the box parser ${body.parserVer} differs from the session's pinned ${b.cParserVer} (O-1: no REBASE in v1)`, 'PARSER_MISMATCH');
                } else if (!isSupportedFmt(m.fmt)) {
                    await this.freeze(m, `page format ${m.fmt} has no verifier in this build`, 'FMT_UNSUPPORTED');
                }
                this.recheckPendingPairs(id);
            }
            const rawAcked = this.rawStore.head(id);
            const reply = helloVerdict({ ...s, nSesid: id }, {
                meta: m,
                bound: true,
                syncState: b.cSyncState as any,
                rawAcked,
                rawHashAt: seq => this.rawStore.hashAt(id, seq),
            });
            if (reply.verdict === 'frozen' && !m.frozen && !sealed) {
                await this.freeze(m, 'the box does not continue the last applied history (D19)', 'LINEAGE_FROZEN');
            }
            // A new connection resends its in-flight round from part 1: the staged-bytes count starts again.
            this.stagedBytes.delete(id);
            if (reply.verdict === 'continue' || reply.verdict === 'end') {
                conn.helloed.set(id, reply.verdict);
                // Nothing dirty: the box holds exactly what the cloud applied (§5.6 back to live).
                if (s.root === m.root && s.totalLines === m.totalLines) this.catchingUp.delete(id);
            } else conn.helloed.delete(id);
            replies.push({ ...reply, nSesid: s.nSesid });
        }
        if (this.stable.has(conn.nEdgeid)) {
            for (const id of mine) this.setViewer(id, this.catchingUp.has(id) ? 'catching-up' : 'live');
        }

        const reportedIds = new Set(reported.map(s => normId(s.nSesid)));
        const pendingEnds = pull.ends.filter(id => !reportedIds.has(id));
        if (pendingEnds.length) {
            setImmediate(() => {
                for (const nSesid of pendingEnds) void this.registry.pushAssign(conn.nEdgeid, { op: 'end', nSesid });
            });
        }
        void this.registry.heartbeat(conn.nEdgeid, { ip: conn.ip, cVersion: body.sw, cParserVer: body.parserVer, force: true, liveSessions: mine.size });
        return {
            serverNowMs: this.clock(),
            proto,
            edgeTokenKeys: this.registry.edgeTokenKeys(),
            limits: { edgeBps: EDGE_LIMITS.edgeBps, rawMinBps: EDGE_LIMITS.rawMinBps, maxPart: this.maxPart },
            sessions: replies,
            assignments: pull.assigned,
            revocations: await this.registry.revocations(),
            assignmentSnapshot: pull.snapshot,
            egressIp: conn.ip,
        };
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.round (§5.5 "Round apply")
    // -----------------------------------------------------------------------------------------------------------

    async round(conn: EdgeConnCtx, part: EdgeRound): Promise<RoundReply> {
        const id = normId(part?.nSesid);
        if (!id) return { ok: false, code: 'BAD_PAGE', p: 0 };
        // A quarantined box reports status only; a box revoked while connected sends nothing more (§5.3).
        if (!active(conn)) return { ok: false, code: 'NOT_BOUND' };
        const b = await this.binding(id);
        if (!isBoundTo(b, conn.nEdgeid) || SEALED_STATES.has(b.cSyncState ?? '')) return { ok: false, code: 'NOT_BOUND' };
        if (!conn.helloed.has(id)) {
            // MR-6: on every connection a session must pass hello before it may push pages.
            return { ok: false, code: 'LINEAGE', epoch: b.nIngestEpoch, rebaseSeq: b.nRebaseSeq };
        }
        const oversize = this.oversizePart(id, part);
        if (oversize) {
            this.assembler.drop(id);
            this.stagedBytes.delete(id);
            this.registry.alert({ kind: 'BAD_ROUND', tier: 'P2', nEdgeid: conn.nEdgeid, nSesid: id, message: `Round part from box ${conn.nEdgeid} refused: ${oversize}` });
            return { ok: false, code: 'BAD_PAGE', p: 0 };
        }
        const now = this.clock();
        this.assembler.sweep(now);
        const staged = this.assembler.add({ ...part, nSesid: id }, now);
        if (staged.status === 'partial') return staged.reply;
        this.stagedBytes.delete(id);
        if (staged.status === 'invalid') {
            this.registry.alert({ kind: 'BAD_ROUND', tier: 'P2', nEdgeid: conn.nEdgeid, nSesid: id, message: `Malformed round part from box ${conn.nEdgeid}: ${staged.reason}` });
            return staged.reply;
        }
        if (staged.status === 'stale') {
            const m = this.metas.get(id);
            return { ok: false, code: 'STALE', appliedRev: m?.appliedRev ?? 0, root: m?.root ?? '' };
        }
        const round = staged.round;
        const cost = Buffer.byteLength(JSON.stringify(round.pages));
        const wait = this.bucket.take(conn.nEdgeid, cost);
        if (wait > 0) return { ok: false, code: 'BUSY', retryMs: wait };
        if (!this.apply.ready()) return { ok: false, code: 'BUSY', retryMs: 2000 };
        await this.rawStore.ensureLoaded(id);
        const reply = await this.apply.runBarrier(id, () => this.applyInBarrier(conn.nEdgeid, id, round, { conn }));
        const m = this.metas.get(id);
        if (m && (reply as any).ok === true && !(reply as any).partial) void this.persistApplied(m);
        return reply;
    }

    /**
     * Size limits on one round part (security review): the part count, and the bytes staged for one session's
     * incomplete multi-part round. Null when the part may be staged.
     */
    private oversizePart(id: string, part: EdgeRound): string | null {
        const parts = Number(part?.parts);
        if (Number.isSafeInteger(parts) && parts > EDGE_MESSAGE_LIMITS.maxRoundParts) return `${parts} parts (at most ${EDGE_MESSAGE_LIMITS.maxRoundParts})`;
        if (!Number.isSafeInteger(parts) || parts <= 1 || !Array.isArray(part?.pages)) return null;
        let bytes: number;
        try {
            bytes = Buffer.byteLength(JSON.stringify(part.pages));
        } catch {
            return 'pages are not serializable';
        }
        const prev = this.stagedBytes.get(id);
        const total = (prev && prev.rev === part.rev ? prev.bytes : 0) + bytes;
        if (total > EDGE_MESSAGE_LIMITS.maxStagedRoundBytes) return `${total} bytes staged for one round (at most ${EDGE_MESSAGE_LIMITS.maxStagedRoundBytes})`;
        this.stagedBytes.set(id, { rev: part.rev, bytes: total });
        return null;
    }

    /**
     * Steps 0–7 of §5.5, inside the page store's queue task.
     *
     * Step 0 (the in-queue fence, spec §5.3 / §5.5; review #32): re-check INSIDE the task what may have changed
     * since the per-message check, and apply nothing on a mismatch: the connection's box state (revoked or
     * quarantined meanwhile), a binding change in progress (BUSY until it settles), and the in-memory binding
     * record those barriers keep current. PG is read here only when the record is not cached (a barrier dropped
     * it), bounded by queueIoBoundMs; a slow or failed read applies nothing (BUSY, the box retries), and the next
     * queue task (any other session's live write) runs at once.
     */
    private async applyInBarrier(nEdgeid: string, id: string, round: EdgeRound, opts: { confirmShrink?: boolean; conn?: EdgeConnCtx }): Promise<RoundReply> {
        if (opts.conn && !active(opts.conn)) return { ok: false, code: 'NOT_BOUND' };
        if (this.fenced.has(id)) return { ok: false, code: 'BUSY', retryMs: 1000 };
        let b: EdgeBinding | null = this.bindings.get(id) ?? null;
        if (!b) {
            try {
                b = (await withTimeout(this.loadBindings([id]), this.timings.queueIoBoundMs, 'binding read')).get(id) ?? null;
            } catch (error) {
                this.logger.warn(`binding of ${id} not read inside the apply task: ${(error as Error)?.message ?? error}`);
                return { ok: false, code: 'BUSY', retryMs: 2000 };
            }
        }
        let m: CloudEdgeMeta | null;
        try {
            m = await this.ensureMeta(id, b, true);
        } catch (error) {
            this.logger.warn(`edge meta of ${id} not available inside the apply task: ${(error as Error)?.message ?? error}`);
            return { ok: false, code: 'BUSY', retryMs: 2000 };
        }
        if (!m) return { ok: false, code: 'NOT_BOUND' };
        if (m.pendingRawChecks?.length) this.recheckPendingPairs(id);
        let decision: ReturnType<typeof validateRound>;
        try {
            decision = validateRound(round, m, {
                binding: { bound: isBoundTo(b, nEdgeid) && !SEALED_STATES.has(b?.cSyncState ?? ''), epoch: b?.nIngestEpoch ?? -1 },
                rawHashAt: seq => this.rawStore.hashAt(id, seq),
                confirmShrink: opts.confirmShrink === true,
            });
        } catch (error) {
            if (error instanceof UnsupportedFmtError) {
                await this.freeze(m, error.message, 'FMT_UNSUPPORTED');
                return { ok: false, code: 'FORK' };
            }
            throw error;
        }

        if (decision.action === 'refuse') {
            const { reply } = decision;
            if (decision.freeze) {
                await this.freeze(m, decision.reason, decision.reason.startsWith('D19') ? 'LINEAGE_FROZEN' : 'FORK');
            } else if (reply.code === 'REGRESS') {
                const now = this.clock();
                const recent = (this.regress.get(id) ?? []).filter(t => now - t < 10 * 60_000);
                recent.push(now);
                this.regress.set(id, recent);
                if (recent.length >= 3) {
                    this.registry.alert({ kind: 'REGRESS_REPEATED', tier: 'P1', nEdgeid, nSesid: id, message: `Box ${nEdgeid} sent ${recent.length} regressing rounds for ${id} in 10 minutes` });
                }
            } else if (decision.alert) {
                this.registry.alert({ kind: reply.code === 'ROOT' ? 'ROUND_ROOT' : reply.code, tier: decision.alert, nEdgeid, nSesid: id, message: `Round rev ${round.rev} of ${id} refused: ${decision.reason}` });
            }
            return reply;
        }

        if (decision.action === 'hold') {
            const prev = this.held.get(id);
            const heldId = prev && prev.round.rev === round.rev && prev.round.root === round.root ? prev.heldId : randomUUID();
            this.held.set(id, { heldId, round, nEdgeid, removed: decision.removed, fromTotal: decision.fromTotal, toTotal: decision.toTotal, atMs: this.clock() });
            m.heldShrink = { heldId, rev: round.rev, removed: decision.removed, fromTotal: decision.fromTotal, toTotal: decision.toTotal, atMs: this.clock() };
            await this.saveMeta(m);
            if (!prev || prev.heldId !== heldId) {
                this.registry.alert({
                    kind: 'HELD_SHRINK',
                    tier: 'P1',
                    nEdgeid,
                    nSesid: id,
                    message: `A round would remove ${decision.removed} of ${decision.fromTotal} lines of ${id}; it is held for an admin`,
                    data: { heldId, nHearingOpid: b?.nHearingOpid ?? null },
                });
                void this.registry.event('held_shrink', { nEdgeid, nSesid: id, jData: { heldId, rev: round.rev, removed: decision.removed, fromTotal: decision.fromTotal, toTotal: decision.toTotal } }).catch(() => undefined);
            }
            return { ok: false, code: 'HELD_SHRINK', heldId };
        }

        const plan = decision.plan;
        const stored = await this.apply.currentPages(id);
        const before = { totalLines: m.totalLines, page: (p: number) => stored.get(p) };
        await this.apply.applyRoundAtomic(id, plan);
        const next: CloudEdgeMeta = {
            ...m,
            ...plan.meta,
            nEdgeid: m.nEdgeid ?? b?.nEdgeid ?? nEdgeid,
            pendingRawChecks: [...(m.pendingRawChecks ?? []), ...(plan.pendingRawCheck ? [plan.pendingRawCheck] : [])],
            cloudIncidents: [...(m.cloudIncidents ?? [])],
            heldShrink: null,
        };
        if (opts.confirmShrink && plan.shrink) {
            next.cloudIncidents.push({ kind: 'SHRINK_CONFIRMED', level: 'warning', lines: plan.shrink.removed, note: `rev ${plan.rev}: ${plan.shrink.fromTotal} -> ${plan.shrink.toTotal} lines` });
        }
        this.held.delete(id);
        await this.saveMeta(next);
        if (plan.lineageUnverified) {
            this.registry.alert({ kind: 'LINEAGE_UNVERIFIED', tier: 'P2', nEdgeid, nSesid: id, message: `Round rev ${plan.rev} of ${id} was checked by seq only (no stored hash, O-7)` });
        }
        try {
            this.apply.broadcastCut(id, broadcastCutFromRound(plan, before, m.nLines));
        } catch (error) {
            this.logger.warn(`broadcast of ${id} rev ${plan.rev} failed: ${(error as Error)?.message ?? error}`);
        }
        // §5.6: more than 8 pages is a catch-up; a round within the live budget leaves the box with nothing dirty.
        if (plan.catchingUp) this.catchingUp.add(id);
        else this.catchingUp.delete(id);
        this.setViewer(id, plan.catchingUp ? 'catching-up' : 'live');
        return plan.reply;
    }

    // -----------------------------------------------------------------------------------------------------------
    // Raw lane
    // -----------------------------------------------------------------------------------------------------------

    async raw(conn: EdgeConnCtx, batch: EdgeRaw): Promise<RawReply> {
        const id = normId(batch?.nSesid);
        if (!id) return { expectSeq: 0, reason: 'gap' };
        await this.rawStore.ensureLoaded(id);
        const expectSeq = this.rawStore.head(id).seq + 1;
        if (conn.status === 'Q') return { expectSeq, reason: 'rate', retryAfterMs: 60_000 };
        if (!active(conn)) return { expectSeq, reason: 'epoch' };
        const b = await this.binding(id);
        if (!isBoundTo(b, conn.nEdgeid) || SEALED_STATES.has(b.cSyncState ?? '')) return { expectSeq, reason: 'epoch' };
        return this.rawStore.append(id, b.nIngestEpoch, batch);
    }

    async rawPull(conn: EdgeConnCtx, req: EdgeRawPull): Promise<any> {
        const id = normId(req?.nSesid);
        // RECOVER reads the cloud's copy of the journal: an active box only.
        if (!active(conn)) return { ok: false, code: 'NOT_BOUND' };
        const b = id ? await this.binding(id) : null;
        if (!isBoundTo(b, conn.nEdgeid)) return { ok: false, code: 'NOT_BOUND' };
        // Records, an empty reply past the head, or {ok:false, code} (CLOUD_JOURNAL_CORRUPT / NOT_FOUND): see pull().
        return this.rawStore.pull(id, Number(req.fromSeq), Number(req.toSeq));
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.seal (§5.7)
    // -----------------------------------------------------------------------------------------------------------

    async seal(conn: EdgeConnCtx, seal: EdgeSeal): Promise<SealReply> {
        const refused: SealReply = { complete: false, needPages: [] };
        const id = normId(seal?.nSesid);
        if (!id || !Number.isSafeInteger(seal.finalRev) || !Number.isSafeInteger(seal.totalLines) || !Number.isSafeInteger(seal.rawFinalSeq) || typeof seal.sig !== 'string') {
            return refused;
        }
        if (!active(conn)) return refused;
        const L = EDGE_MESSAGE_LIMITS;
        if (
            seal.sig.length > L.maxSigChars ||
            (seal.incidents !== undefined && (!Array.isArray(seal.incidents) || seal.incidents.length > L.maxSealIncidents)) ||
            (seal.endedBy !== undefined && seal.endedBy !== null && String(seal.endedBy).length > L.maxSealText)
        ) {
            this.registry.alert({ kind: 'BAD_SEAL', tier: 'P2', nEdgeid: conn.nEdgeid, nSesid: id, message: `Seal of ${id} from box ${conn.nEdgeid} is over the size limits; not considered` });
            return refused;
        }
        const b = (await this.loadBindings([id])).get(id) ?? null;
        if (!isBoundTo(b, conn.nEdgeid)) return refused;
        if (SEALED_STATES.has(b.cSyncState ?? '')) {
            // A repeat: after a lost ack, or after a cloud restart (or a failure) between the seal SP and the end body
            // (review #4/#33). The seal is recorded; the deferred end body runs again unless it completed (it is
            // idempotent), then the box stops.
            await this.finishEnd(id, b);
            return { complete: true, state: b.cSyncState === 'K' ? 'K' : 'W' };
        }
        await this.rawStore.ensureLoaded(id);
        const signatureValid = verifyDeviceSignature(conn.pubKey, sealSigningPayload(seal), seal.sig);
        const { check, m } = await this.apply.runBarrier(id, async () => {
            const meta = await this.ensureMeta(id, b, true);
            if (!meta) return { check: null, m: null };
            const run = async () => {
                const pages = await this.apply.currentPages(id);
                return checkSeal(seal, {
                    meta,
                    signatureValid,
                    storedPage: p => pages.get(p),
                    storedPageNumbers: [...pages.keys()],
                    rawAcked: this.rawStore.head(id),
                    finalRecordIsSessionEnd: this.rawStore.isSessionEndAt(id, seal.rawFinalSeq),
                    rawIncidents: this.rawStore.incidents(id),
                    pendingOrphans: 0,
                });
            };
            let result = await run();
            if (result.extraPages.length) {
                await this.apply.deletePagesAbove(id, pageCount(seal.totalLines, meta.nLines));
                result = await run();
            }
            // A verified seal is a binding change (§5.5 step 0): no round may apply between this check and the SP.
            if (result.reply.complete) this.raiseFence(id);
            return { check: result, m: meta };
        });
        if (!check || !m) return refused;
        if (!check.reply.complete) {
            this.registry.alert({
                kind: signatureValid ? 'SEAL_REFUSED' : 'SEAL_SIGNATURE',
                tier: signatureValid ? 'P2' : 'P1',
                nEdgeid: conn.nEdgeid,
                nSesid: id,
                message: `Seal of ${id} not accepted: ${check.reasons.join('; ')}`,
            });
            return check.reply;
        }
        let recorded: SealReply;
        try {
            recorded = await this.recordSeal(conn, seal, b, m);
        } finally {
            this.dropFence(id);
        }
        if (recorded.complete) await this.finishEnd(id, b);
        return recorded;
    }

    /** The verified seal into PG (et_rtedge_session_seal: K / W / F) and the cached state. The caller holds the fence. */
    private async recordSeal(conn: EdgeConnCtx, seal: EdgeSeal, b: EdgeBinding, m: CloudEdgeMeta): Promise<SealReply> {
        const refused: SealReply = { complete: false, needPages: [] };
        const id = b.nSesid;
        const incidents = [...(seal.incidents ?? []), ...(m.cloudIncidents ?? [])];
        const params: Record<string, unknown> = {
            nSesid: id,
            nEdgeid: conn.nEdgeid,
            nEpoch: seal.epoch,
            nFinalRev: seal.finalRev,
            cFinalDigest: seal.root,
            nFinalLines: seal.totalLines,
            nRawFinalSeq: seal.rawFinalSeq,
            cRawFinalHash: seal.rawFinalHash,
            jIncidents: incidents,
            jSeal: seal,
        };
        if (m.rebaseSeq !== null && m.rebaseSeq !== undefined) params.nRebaseSeq = m.rebaseSeq;
        let row;
        try {
            row = firstRow(await callSp(this.db, 'rtedge_session_seal', params));
        } catch (error) {
            this.logger.error(`seal of ${id} not stored: ${(error as Error)?.message ?? error}`);
            return refused;
        }
        if (!spOk(row)) {
            this.registry.alert({ kind: 'SEAL_DB_REFUSED', tier: 'P1', nEdgeid: conn.nEdgeid, nSesid: id, message: `The seal of ${id} was refused by the database: ${row.value ?? row.cCode}` });
            return refused;
        }
        const state = String(row.cSyncState ?? 'W').trim();
        // The meta records the seal before the end body runs: a restart in between leaves `endBodyAtMs` unset, and
        // the box's repeated seal (it never got this ack) or the sweep runs the end body then.
        m.sealed = { state, atMs: this.clock(), endBodyAtMs: null, archivedAtMs: null };
        await this.saveMeta(m);
        this.noteSyncState(id, state);
        this.boxSessions.get(conn.nEdgeid)?.delete(id);
        this.catchingUp.delete(id);
        this.setViewer(id, 'sealed');
        // SealReply carries K or W; a backstop 'F' (dismissed orphan) is complete too.
        return { complete: true, state: state === 'K' ? 'K' : 'W' };
    }

    // -----------------------------------------------------------------------------------------------------------
    // The deferred end body (spec §4.4 "Seal verified"; review #4 / #33)
    // -----------------------------------------------------------------------------------------------------------

    /**
     * Run the deferred end body of a sealed or force-closed session unless it already completed: SessionService's
     * completeGatedSessionEnd (feed dump, dormant route removal, on-notification 'E'; idempotent), then the journal
     * archive (once), then the in-memory release. Completion is recorded in the meta (`sealed.endBodyAtMs`, Redis and
     * edge-meta.json) and in memory. One run per session at a time. A failure alerts END_BODY_FAILED and retries
     * with a backoff; the sweep is the backstop across restarts. `force` re-runs it even when recorded complete
     * (the sweep found the session's dormant route still in the route file).
     */
    finishEnd(nSesid: string, b: EndBodyBinding | null, opts: { force?: boolean } = {}): Promise<EdgeEndBodyOutcome> {
        const id = normId(nSesid);
        const running = this.ending.get(id);
        if (running) return running;
        const run = this.runEndBody(id, b, opts.force === true).finally(() => this.ending.delete(id));
        this.ending.set(id, run);
        return run;
    }

    private async runEndBody(id: string, b: EndBodyBinding | null, force: boolean): Promise<EdgeEndBodyOutcome> {
        let m = this.metas.get(id) ?? null;
        if (!m) {
            m = await this.storedMeta(id).catch(() => null);
            if (m && !this.metas.has(id)) this.metas.set(id, m);
            m = this.metas.get(id) ?? m;
        }
        if (!force && (this.endDone.has(id) || m?.sealed?.endBodyAtMs)) {
            this.cancelEndRetry(id);
            return { ok: true, via: 'done' };
        }
        const nCaseid = b?.nCaseid ?? null;
        const nEdgeid = b?.nEdgeid ?? m?.nEdgeid ?? null;
        let end: EdgeEndBodyOutcome;
        try {
            end = await this.apply.completeSessionEnd(id, nCaseid);
        } catch (error) {
            end = { ok: false, via: 'none', detail: (error as Error)?.message ?? String(error) };
        }
        if (!end.ok && b?.bDeleted && (end.detail as any)?.cCode === 'NOT_SEALED') {
            // A soft-deleted session is invisible to the completeness gate, so SessionService never sees it sealed.
            // Its dormant route must still go, or it blocks every new session of the case.
            try {
                await this.registry.removeRoute(id);
                end = { ok: true, via: 'deleted' };
            } catch (error) {
                end = { ok: false, via: 'deleted', detail: (error as Error)?.message ?? String(error) };
            }
        }
        if (end.ok) {
            // completeGatedSessionEnd answers msg 1 even when its own route removal failed (it is best effort there).
            // A sealed session never keeps its dormant route: check, and remove it here; when that fails too the end
            // body counts as failed and is retried (30 s, then backoff), so a leftover route never waits for the
            // 10-minute sweep.
            const left = await this.dropLeftoverRoute(id);
            if (left) end = { ok: false, via: end.via, detail: { routeLeft: left, end: end.detail ?? null } };
        }
        if (!end.ok) {
            const attempts = (this.endRetry.get(id)?.attempts ?? 0) + 1;
            const routeLeft = (end.detail as any)?.routeLeft;
            this.registry.alert({ kind: 'END_BODY_FAILED', tier: 'P2', nEdgeid, nSesid: id, message: `Session ${id} is sealed but its end body did not complete (${end.via}${routeLeft ? `: ${routeLeft}` : ''}, attempt ${attempts}); it is retried` });
            this.scheduleEndRetry(id, b, attempts);
            return end;
        }
        let archivedAtMs: number | null = m?.sealed?.archivedAtMs ?? null;
        if (!archivedAtMs) {
            try {
                const archived = await this.rawStore.archive.archiveJournal({ nCaseid, nSesid: id, dir: this.rawStore.journalDir(id) });
                if (archived) {
                    archivedAtMs = this.clock();
                    void this.registry.event('archive', { nEdgeid, nSesid: id, jData: archived }).catch(() => undefined);
                }
            } catch (error) {
                this.registry.alert({ kind: 'ARCHIVE_FAILED', tier: 'P2', nSesid: id, message: `Raw journal of ${id} not archived: ${(error as Error)?.message ?? error}` });
            }
        }
        this.endDone.add(id);
        this.cancelEndRetry(id);
        if (m) {
            m.sealed = { ...(m.sealed ?? { state: String(b?.cSyncState ?? 'W'), atMs: this.clock() }), endBodyAtMs: this.clock(), archivedAtMs };
            await this.saveMeta(m);
        }
        await this.forgetSession(id);
        return end;
    }

    /**
     * After the end body: the session's dormant route must be gone. Removes it when it is still in the route file.
     * Null when no route is left; otherwise why it could not be checked or removed.
     */
    private async dropLeftoverRoute(id: string): Promise<string | null> {
        try {
            if (!(await this.registry.routeFor(id))) return null;
            this.logger.warn(`the end body of ${id} left its dormant route in the route file; removing it`);
            await this.registry.removeRoute(id);
            return (await this.registry.routeFor(id)) ? 'the route is still in the route file after its removal' : null;
        } catch (error) {
            return `the route could not be removed: ${(error as Error)?.message ?? error}`;
        }
    }

    private scheduleEndRetry(id: string, b: EndBodyBinding | null, attempts: number): void {
        const prev = this.endRetry.get(id);
        if (prev?.timer) clearTimeout(prev.timer);
        // Backoff 30 s, 1, 2, 4 … min, at most 30 min apart; after 10 attempts the periodic sweep takes over.
        if (attempts > 10) {
            this.endRetry.delete(id);
            return;
        }
        const delay = Math.min(this.timings.endBodyRetryMs * 2 ** (attempts - 1), 30 * 60_000);
        const timer = this.later(() => void this.finishEnd(id, b).catch(() => undefined), delay);
        this.endRetry.set(id, { timer, attempts });
    }

    private cancelEndRetry(id: string): void {
        const r = this.endRetry.get(id);
        if (r?.timer) clearTimeout(r.timer);
        this.endRetry.delete(id);
    }

    private scheduleEndSweep(delayMs: number): void {
        if (this.sweepTimer) clearTimeout(this.sweepTimer);
        this.sweepTimer = this.later(() => {
            this.sweepTimer = null;
            void this.sweepEndedRoutes()
                .catch(error => this.logger.warn(`end-body sweep failed: ${(error as Error)?.message ?? error}`))
                .finally(() => this.scheduleEndSweep(this.timings.endBodySweepMs));
        }, delayMs);
    }

    /**
     * The backstop (review #4/#33): a sealed session ('K' / 'W' / 'F') whose dormant 'E' route is still in the route
     * file never finished its end body (a crash between the seal SP and the end body, a failure retried past
     * restarts). Re-run it (force: the route says it did not take effect). Returns the sessions it ran for. Costs
     * one route-file read, and one indexed binding read only when 'E' routes exist.
     */
    async sweepEndedRoutes(): Promise<string[]> {
        let routes: Array<{ nSesid?: unknown; feedSource?: unknown }>;
        try {
            routes = await this.registry.readRoutes();
        } catch (error) {
            this.logger.warn(`end-body sweep: route file unreadable: ${(error as Error)?.message ?? error}`);
            return [];
        }
        const ids = [...new Set(routes.filter(r => String(r?.feedSource ?? '').trim().toUpperCase() === 'E').map(r => normId(r?.nSesid)).filter(Boolean))];
        if (!ids.length) return [];
        const bindings = await this.loadBindings(ids);
        const ran: string[] = [];
        for (const [id, b] of bindings) {
            if (!SEALED_STATES.has(b.cSyncState ?? '') || this.ending.has(id)) continue;
            ran.push(id);
            // The end body itself removes a route its SessionService step left behind (dropLeftoverRoute), so the
            // sweep converges.
            await this.finishEnd(id, b, { force: true });
        }
        return ran;
    }

    /**
     * A sealed (or force-closed) session releases what grows with the hearing: the raw store's per-record chain
     * index (megabytes for a day), staging and counters. Its meta stays (a digest per page; the viewer port and
     * fetch-data's rev tag read it) and is persisted first. A later raw read reloads and re-verifies the journal,
     * so a long-running cloud does not keep every hearing it ever received.
     */
    private async forgetSession(id: string): Promise<void> {
        await (this.metaFileWrites.get(id) ?? Promise.resolve());
        this.metaFileWrites.delete(id);
        const redisWrite = this.redisWrites.get(id);
        if (redisWrite) {
            await withTimeout(redisWrite, this.timings.queueIoBoundMs, 'edge meta write').catch(() => undefined);
            if (this.redisWrites.get(id) === redisWrite) this.redisWrites.delete(id);
        }
        this.held.delete(id);
        this.regress.delete(id);
        this.appliedAt.delete(id);
        this.stagedBytes.delete(id);
        this.catchingUp.delete(id);
        this.assembler.drop(id);
        await this.rawStore.forget(id);
    }

    // -----------------------------------------------------------------------------------------------------------
    // e.ready, e.capture, e.status
    // -----------------------------------------------------------------------------------------------------------

    async ready(conn: EdgeConnCtx, body: { nSesid: string }): Promise<{ ok: boolean }> {
        const id = normId(body?.nSesid);
        // A quarantined box receives no assignments, so it has nothing to arm (§5.3).
        if (!active(conn)) return { ok: false };
        const b = id ? await this.binding(id) : null;
        if (!isBoundTo(b, conn.nEdgeid)) return { ok: false };
        void this.registry.event('ready', { nEdgeid: conn.nEdgeid, nSesid: id }).catch(() => undefined);
        const payload = { type: 'edge-session-ready', nSesid: id, nEdgeid: conn.nEdgeid };
        this.apply.emitToSession(id, 'realtime-events', payload);
        // Spec §4.2: the creator's U room (their create dialog flips to "Venue box ready"), plus the hearing
        // operator and the global admins (G4). The creator is read after the ack, so the box never waits for it.
        void this.sessionCreator(id).then(creator =>
            this.registry.emitToAdmins('realtime-events', payload, [b.nHearingOpid, creator].filter((u): u is string => !!u)),
        );
        return { ok: true };
    }

    /**
     * G4: who created a venue session. RSessionMaster has no creator column; et_rtedge_session_bind audits the
     * creating user (its nMasterid) as the 'bind' event's nByUser. Null when unknown or unreadable.
     */
    async sessionCreator(nSesid: string): Promise<string | null> {
        const id = normId(nSesid);
        if (!id) return null;
        try {
            const rows = await readRows(this.db, 'session creator', EDGE_SESSION_CREATOR_SQL, [id]);
            return normId(rows[0]?.nByUser);
        } catch (error) {
            this.logger.warn(`creator of ${id} unknown: ${(error as Error)?.message ?? error}`);
            return null;
        }
    }

    /** A held second CAT connection on the box (orphan 'C'); idempotent per (box, session, user, peer, start). */
    async capture(conn: EdgeConnCtx, body: EdgeCapture): Promise<{ ok: boolean; nOrphanid?: string }> {
        const id = normId(body?.nSesid);
        // A quarantined box may still report a held connection (evidence); a revoked one may not.
        if (conn.status === 'X') return { ok: false };
        const b = id ? await this.binding(id) : null;
        if (!isBoundTo(b, conn.nEdgeid) || body?.kind !== 'C' || !Number.isFinite(body?.fromMs)) return { ok: false };
        const nOrphanid = stableUuid(`${conn.nEdgeid}|${id}|${body.user ?? ''}|${body.peer ?? ''}|${body.fromMs}`);
        const params: Record<string, unknown> = {
            nSesid: id,
            cKind: 'C',
            nOrphanid,
            nEdgeid: conn.nEdgeid,
            nEpoch: b.nIngestEpoch,
            dFrom: new Date(body.fromMs).toISOString(),
            nBytes: Number(body.bytes) || 0,
        };
        if (body.user) params.cUser = String(body.user).slice(0, 64);
        const peer = peerIp(body.peer);
        if (peer) params.cPeer = peer;
        if (Number.isFinite(body.toMs)) params.dTo = new Date(body.toMs).toISOString();
        if (typeof body.sha256 === 'string' && /^[0-9a-f]{64}$/.test(body.sha256)) params.cSha256 = body.sha256;
        const res = await this.rawStore.recordOrphan(params);
        if (res.ok) {
            this.registry.alert({ kind: 'HELD_CAT_CONNECTION', tier: 'P1', nEdgeid: conn.nEdgeid, nSesid: id, message: `Box ${conn.nEdgeid} held a second CAT connection for ${id} from ${body.peer}`, data: { nOrphanid, user: body.user } });
        }
        return res.ok ? { ok: true, nOrphanid } : { ok: false };
    }

    async status(conn: EdgeConnCtx, body: EdgeStatus): Promise<void> {
        if (!body || typeof body !== 'object' || conn.status === 'X') return;
        const L = EDGE_MESSAGE_LIMITS;
        let bytes = 0;
        try {
            bytes = Buffer.byteLength(JSON.stringify(body));
        } catch {
            bytes = Number.POSITIVE_INFINITY;
        }
        // Kept in memory and Redis per box: an oversized report is dropped, never stored.
        if (bytes > L.maxStatusBytes || (Array.isArray(body.sessions) && body.sessions.length > L.maxStatusSessions)) {
            this.registry.alert({ kind: 'BAD_STATUS', tier: 'P2', nEdgeid: conn.nEdgeid, message: `e.status from box ${conn.nEdgeid} is over the size limits (${bytes} bytes); dropped` });
            return;
        }
        await this.registry.recordStatus(conn.nEdgeid, body, conn.ip);
    }

    // -----------------------------------------------------------------------------------------------------------
    // Split to direct cloud (D7) and "Use direct cloud instead" (O-8)
    // -----------------------------------------------------------------------------------------------------------

    /**
     * POST session/edge/split (D7): Part 1 'S' (awaiting its box), its dormant route removed, Part 2 'D' live
     * with Part 1's Eclipse username AND password hash (audited), parts linked by nPrevPartSesid / nPartNo
     * (O-6: et_rtedge_session_split, Part 1 = 1, Part 2 = previous + 1). The box gets op 'end' for Part 1 (push
     * now, and its next hello pull) and still uploads and seals Part 1's tail. A repeat returns the same Part 2.
     */
    async split(nSesid: string, actor: EdgeActorRef, opts: { cNote?: string; cName?: string } = {}) {
        const id = normId(nSesid);
        if (!id) throw new EdgeServiceError('INVALID', 'nSesid must be a session id');
        const b = (await this.loadBindings([id])).get(id);
        if (!b || b.bDeleted) throw new EdgeServiceError('NOT_FOUND', 'Session not found');
        if (!mayOperate(b, actor)) throw new EdgeServiceError('NOT_ALLOWED', "Only a super-admin or the session's hearing operator may split it");
        if (b.cFeedSource !== 'E') throw new EdgeServiceError('STATE', 'Only a venue-box session can be split to direct cloud', { cCode: 'STATE' });
        const route = await this.registry.routeFor(id);
        if (!route) {
            // Without Part 1's route there is no login to carry over: refuse before anything changes, unless
            // the split already happened (a repeat after Part 1's route moved to Part 2).
            const successor = await readRows(this.db, 'successor', EDGE_SUCCESSOR_SQL, [id]);
            if (!successor.length) {
                throw new EdgeServiceError('STATE', 'This session has no Eclipse route, so its login cannot move to Part 2. End it and create a new direct session.', { cCode: 'ROUTE_MISSING' });
            }
        }
        const m = this.metas.get(id) ?? (await this.ensureMeta(id, b, false).catch(() => null));
        if (m) await this.persistApplied(m, true);

        const params: Record<string, unknown> = { nSesid: id, nMasterid: actor.userId, cApply: 'L', cUnicuserid: `sess:${randomUUID()}` };
        if (route?.user) params.cEclipseUsername = String(route.user);
        if (opts.cNote) params.cNote = opts.cNote;
        if (opts.cName) params.cName = opts.cName;
        const row = firstRow(await callSp(this.db, 'rtedge_session_split', params));
        if (!spOk(row)) throw spRefusal(row);
        const part2 = normId(row.nPart2Sesid);
        this.noteSyncState(id, 'S');
        // Part 2 is a new direct-cloud feed path. Part 1 keeps its venue verdict on purpose: it is still 'E' (its box
        // uploads its tail), and forgetting it would accept a legacy event for it until the gateway's re-read answers.
        this.feedPathChanged(part2);

        // Route file: Part 1's dormant route goes, Part 2 gets the same login (hash copied, never re-hashed).
        let routeMoved = false;
        let routeError: string | null = null;
        try {
            await this.registry.updateRoutes(routes => {
                const p1 = routes.find(r => normId(r?.nSesid) === id);
                const p2 = routes.find(r => normId(r?.nSesid) === part2);
                const source = p1 ?? (route && normId(route.nSesid) === id ? route : null);
                const rest = routes.filter(r => normId(r?.nSesid) !== id && normId(r?.nSesid) !== part2);
                if (p2 && !source) return [...rest, p2];
                if (!source) return rest;
                const { nEdgeid: _e, epoch: _ep, apply: _a, feedSource: _f, ...login } = source as any;
                routeMoved = true;
                return [...rest, { ...login, nSesid: part2, nCaseid: row.nCaseid ?? source.nCaseid, label: row.cName ?? source.label, nLines: Number(row.nLines) || source.nLines, cTimezone: row.cTimezone ?? source.cTimezone, feedSource: 'D' }];
            });
        } catch (error) {
            routeError = (error as Error)?.message ?? String(error);
            this.registry.alert({ kind: 'SPLIT_ROUTE_FAILED', tier: 'P1', nEdgeid: b.nEdgeid, nSesid: id, message: `Split of ${id} recorded but the Eclipse route was not moved to Part 2 ${part2}: ${routeError}. Retry the split.` });
        }
        void this.registry.event('split_route', {
            nEdgeid: b.nEdgeid,
            nSesid: id,
            nMasterid: actor.userId,
            jData: { nPart2Sesid: part2, cEclipseUsername: route?.user ?? null, bHashCopied: routeMoved, bEncCopied: routeMoved && !!route?.passwordEnc, bAlready: row.bAlready === true, error: routeError },
        }).catch(() => undefined);

        if (b.nEdgeid) void this.registry.pushAssign(b.nEdgeid, { op: 'end', nSesid: id });
        if (!row.bAlready) {
            this.apply.emitToAll('on-notification', { msg: 1, nSesid: part2, nCaseid: row.nCaseid ?? b.nCaseid, cStatus: 'R' });
            this.apply.emitToSession(id, 'realtime-events', { type: 'edge-split', nSesid: id, nPart2Sesid: part2, nPartNo: Number(row.nPartNo) || 2 });
        }
        const host = this.cloudHost();
        const mode = this.transmitterModeOf(b.nEdgeid, id);
        return {
            msg: 1,
            value: row.value ?? 'Split to direct cloud',
            bAlready: row.bAlready === true,
            nSesid: id,
            nPart2Sesid: part2,
            nPartNo: Number(row.nPartNo) || 2,
            cName: row.cName ?? null,
            dStartDt: row.dStartDt ?? null,
            cHost: host.host,
            nPort: host.port,
            cEclipseUsername: route?.user ?? null,
            bRouteMoved: routeMoved,
            routeError,
            reporter: reporterInstructions(mode, host.host, host.port, route?.user ?? null),
        };
    }

    /**
     * POST session/edge/direct (O-8, "Use direct cloud instead"): before the box has received ANY byte of the
     * session, re-bind it from 'E' to 'D'. The box must be online and report no feed for it, and must
     * acknowledge `c.assign{op:'purge'}`; the cloud raw store must hold no CONN_OPEN / DATA and no round may
     * have been applied. After the first byte only Split is allowed. The re-bind itself is
     * et_rtedge_session_rebind_direct (migration file 09), which re-checks the same guards in one UPDATE and
     * answers CONFLICT when the session changed after the checks above.
     */
    async useDirectCloud(nSesid: string, actor: EdgeActorRef, opts: { boxRevoked?: boolean } = {}) {
        const id = normId(nSesid);
        if (!id) throw new EdgeServiceError('INVALID', 'nSesid must be a session id');
        const b = (await this.loadBindings([id])).get(id);
        if (!b || b.bDeleted) throw new EdgeServiceError('NOT_FOUND', 'Session not found');
        if (!mayOperate(b, actor)) throw new EdgeServiceError('NOT_ALLOWED', "Only a super-admin or the session's hearing operator may change its feed path");
        if (b.cFeedSource !== 'E' || b.cSyncState !== 'L') {
            throw new EdgeServiceError('STATE', 'Only a live venue-box session can switch to direct cloud', { cCode: 'STATE' });
        }
        await this.rawStore.ensureLoaded(id);
        const m = this.metas.get(id);
        if (this.rawStore.hasFeedRecords(id) || (m?.appliedRev ?? 0) > 0 || b.nAppliedRawSeq !== null) {
            throw new EdgeServiceError('STATE', 'The venue box has already received transcript data for this session. Use Split to direct cloud instead.', { cCode: 'FEED_STARTED' });
        }
        let boxConfirmed = false;
        if (!opts.boxRevoked) {
            const link = this.registry.gateway;
            if (!b.nEdgeid || !link?.connection(b.nEdgeid)) {
                throw new EdgeServiceError('STATE', 'The venue box is offline, so it cannot confirm it has received nothing. Use Split to direct cloud.', { cCode: 'BOX_UNVERIFIED' });
            }
            const st = this.registry.sessionStatus(b.nEdgeid, id);
            if (!st) throw new EdgeServiceError('STATE', 'The venue box has not reported its status recently. Use Split to direct cloud.', { cCode: 'BOX_UNVERIFIED' });
            const s = st.session;
            if (s && ((Number(s.bytesIn) || 0) > 0 || s.catConnected === true || (Number(s.totalLines) || 0) > 0)) {
                throw new EdgeServiceError('STATE', 'The venue box has already received transcript data for this session. Use Split to direct cloud instead.', { cCode: 'FEED_STARTED' });
            }
            const res = await link.push(b.nEdgeid, 'c.assign', { op: 'purge', nSesid: id });
            if (!res.delivered || (res.reply as any)?.ok !== true) {
                throw new EdgeServiceError('STATE', 'The venue box did not confirm it dropped the session. Use Split to direct cloud.', { cCode: 'BOX_REFUSED' });
            }
            boxConfirmed = true;
        }
        // A binding change (§5.5 step 0): no round queued after this point applies, whatever the SP answers.
        const row = await this.changeBinding(id, async () => firstRow(await callSp(this.db, 'rtedge_session_rebind_direct', { nSesid: id, nEdgeid: b.nEdgeid })));
        if (!spOk(row)) {
            if (row.cCode === 'CONFLICT') throw new EdgeServiceError('CONFLICT', 'The session changed while switching; reload it', { cCode: 'CONFLICT' });
            throw spRefusal(row);
        }
        let routeUpdated = false;
        try {
            await this.registry.updateRoutes(routes =>
                routes.map(r => {
                    if (normId(r?.nSesid) !== id) return r;
                    routeUpdated = true;
                    const { nEdgeid: _e, epoch: _ep, ...rest } = r as any;
                    return { ...rest, feedSource: 'D' };
                }),
            );
        } catch (error) {
            this.registry.alert({ kind: 'REBIND_ROUTE_FAILED', tier: 'P1', nSesid: id, message: `Session ${id} is direct-to-cloud but its route was not updated: ${(error as Error)?.message ?? error}` });
        }
        void this.registry.event('rebind_direct', { nEdgeid: b.nEdgeid, nSesid: id, nMasterid: actor.userId, jData: { bBoxConfirmed: boxConfirmed, bBoxRevoked: !!opts.boxRevoked, bRouteUpdated: routeUpdated } }).catch(() => undefined);
        // 'D' now: the viewer gateway's cached 'E' verdict would refuse legacy ingest for up to a minute.
        this.feedPathChanged(id);
        this.metas.delete(id);
        this.booted.delete(id);
        this.boxSessions.get(b.nEdgeid)?.delete(id);
        try {
            await this.redis.deleteValue(EDGE_REDIS.meta(id));
        } catch {
            /* the meta only describes a session that never synced */
        }
        const host = this.cloudHost();
        const route = await this.registry.routeFor(id).catch(() => null);
        return { msg: 1, value: 'The session now feeds the cloud directly', nSesid: id, cFeedSource: 'D', cHost: host.host, nPort: host.port, cEclipseUsername: route?.user ?? null, bBoxConfirmed: boxConfirmed };
    }

    /**
     * Revoke a box (et_rtedge_revoke) and handle its unsealed sessions (spec runbook §12.8, v1): a live session
     * that never received a byte is re-bound to direct cloud (O-8); any other live one is split (D7); sessions
     * already awaiting their seal ('S') and soft-deleted ones can only be force-closed now (O-3) and are listed.
     */
    async revokeBox(actor: EdgeActorRef, nEdgeid: string, cNote?: string) {
        const res = await this.registry.revokeNode(actor, nEdgeid, cNote);
        const handled: Array<{ nSesid: string; action: 'direct' | 'split' | 'force-close-needed'; detail?: unknown; error?: string }> = [];
        const bindings = await this.loadBindings(res.unsealed);
        for (const nSesid of res.unsealed) {
            const b = bindings.get(nSesid);
            if (!b || b.cSyncState !== 'L') {
                handled.push({ nSesid, action: 'force-close-needed' });
                continue;
            }
            try {
                await this.rawStore.ensureLoaded(nSesid);
                const fed = this.rawStore.hasFeedRecords(nSesid) || (this.metas.get(nSesid)?.appliedRev ?? 0) > 0 || b.nAppliedRawSeq !== null;
                if (!fed) handled.push({ nSesid, action: 'direct', detail: await this.useDirectCloud(nSesid, actor, { boxRevoked: true }) });
                else handled.push({ nSesid, action: 'split', detail: await this.split(nSesid, actor, { cNote: `box ${res.nEdgeid} revoked` }) });
            } catch (error) {
                handled.push({ nSesid, action: 'force-close-needed', error: (error as Error)?.message ?? String(error) });
            }
        }
        for (const nSesid of res.unsealedDeleted) handled.push({ nSesid, action: 'force-close-needed' });
        if (handled.some(h => h.action === 'force-close-needed')) {
            this.registry.alert({ kind: 'REVOKED_BOX_SESSIONS', tier: 'P2', nEdgeid: res.nEdgeid, message: `Revoked box ${res.nEdgeid} leaves sessions that need a forced close`, data: { sessions: handled.filter(h => h.action === 'force-close-needed').map(h => h.nSesid) } });
        }
        this.boxSessions.delete(res.nEdgeid);
        return { ...res, sessions: handled };
    }

    // -----------------------------------------------------------------------------------------------------------
    // Held shrinks (MR-2), forced close, acknowledgement, status
    // -----------------------------------------------------------------------------------------------------------

    /** What the admin sees before deciding a held shrink: the removed range and text samples (spec MR-2). */
    async heldShrink(nSesid: string) {
        const id = normId(nSesid);
        const h = this.held.get(id);
        const m = this.metas.get(id);
        if (!h) return { held: false, last: m?.heldShrink ?? null };
        let stored = new Map<number, unknown[]>();
        try {
            if (this.apply.ready()) stored = await this.apply.currentPages(id);
        } catch (error) {
            this.logger.warn(`held shrink samples of ${id} unavailable: ${(error as Error)?.message ?? error}`);
        }
        return {
            held: true,
            heldId: h.heldId,
            rev: h.round.rev,
            removed: h.removed,
            fromTotal: h.fromTotal,
            toTotal: h.toTotal,
            atMs: h.atMs,
            ...shrinkSamples(h.round, stored, m?.nLines ?? 25),
        };
    }

    /** The admin confirms (incident SHRINK_CONFIRMED, the held round is applied) or rejects (the session freezes). */
    async decideShrink(actor: EdgeActorRef, nSesid: string, heldId: string, action: 'confirm' | 'reject', cNote?: string) {
        const id = normId(nSesid);
        const h = this.held.get(id);
        if (!h || h.heldId !== heldId) throw new EdgeServiceError('NOT_FOUND', 'No held round with this id (the box resends it after a cloud restart)');
        const b = await this.binding(id);
        if (action === 'reject') {
            const m = await this.ensureMeta(id, b, false);
            this.held.delete(id);
            if (m) {
                m.heldShrink = null;
                await this.freeze(m, `held shrink ${heldId} rejected by an admin${cNote ? `: ${cNote}` : ''}`, 'SHRINK_REJECTED');
            }
            void this.registry.event('shrink_reject', { nEdgeid: h.nEdgeid, nSesid: id, nMasterid: actor.userId, jData: { heldId, cNote: cNote ?? null } }).catch(() => undefined);
            return { msg: 1, value: 'Rejected: the session uplink is frozen; split to direct cloud', frozen: true };
        }
        if (!this.apply.ready()) throw new EdgeServiceError('UNAVAILABLE', 'The page store is not available');
        const reply = await this.apply.runBarrier(id, () => this.applyInBarrier(h.nEdgeid, id, h.round, { confirmShrink: true }));
        if ((reply as any).ok !== true) return { msg: -1, value: `The held round could not be applied (${(reply as any).code})`, reply };
        void this.registry.event('shrink_confirm', { nEdgeid: h.nEdgeid, nSesid: id, nMasterid: actor.userId, jData: { heldId, removed: h.removed, fromTotal: h.fromTotal, toTotal: h.toTotal, cNote: cNote ?? null } }).catch(() => undefined);
        // No c.assign op exists for this: c.need prompts the box to re-run its round logic for the session.
        void this.registry.gateway?.push(h.nEdgeid, 'c.need', { nSesid: id });
        const m = this.metas.get(id);
        if (m) void this.persistApplied(m);
        return { msg: 1, value: 'Confirmed and applied', appliedRev: (reply as any).appliedRev };
    }

    /**
     * POST session/forceseal (super-admin, S-D8, O-3): 'S' → 'F', pending orphans dismissed, end body run. A repeat
     * (bAlready) runs the end body too when it never completed (review #4: a failure or a restart after the SP).
     */
    async forceSeal(actor: EdgeActorRef, nSesid: string, cSealNote: string) {
        const id = normId(nSesid);
        if (!id) throw new EdgeServiceError('INVALID', 'nSesid must be a session id');
        // A binding change (§5.5 step 0): the box may still be draining an 'S' session's tail.
        const row = await this.changeBinding(id, async () => firstRow(await callSp(this.db, 'rtedge_session_forceseal', { nSesid: id, nMasterid: actor.userId, cSealNote })));
        if (!spOk(row)) throw spRefusal(row);
        const m = this.metas.get(id);
        if (m && !m.sealed) {
            m.sealed = { state: 'F', atMs: this.clock(), endBodyAtMs: null, archivedAtMs: null };
            await this.saveMeta(m);
        }
        this.setViewer(id, 'sealed');
        const b = (await this.loadBindings([id])).get(id) ?? null;
        const end = await this.finishEnd(id, b);
        return { ...row, endBody: end };
    }

    /** POST session/warnack: et_rtedge_warn_ack (global admin, case admin or hearing operator; the SP checks). */
    async warnAck(actor: EdgeActorRef, nSesid: string, cNote?: string) {
        const params: Record<string, unknown> = { nSesid, nMasterid: actor.userId };
        if (cNote) params.cNote = cNote;
        const row = firstRow(await callSp(this.db, 'rtedge_warn_ack', params));
        if (!spOk(row)) throw spRefusal(row);
        return row;
    }

    /** Case admin of `nCaseid` (the SPs' rule, rtedge_is_case_admin). False on any doubt (no case, failed read). */
    async isCaseAdmin(nCaseid: string | null, nUserid: string): Promise<boolean> {
        const c = normId(nCaseid);
        const u = normId(nUserid);
        if (!c || !u) return false;
        try {
            const rows = await readRows(this.db, 'case admin', EDGE_CASE_ADMIN_SQL, [c, u]);
            return rows[0]?.bCaseAdmin === true;
        } catch (error) {
            this.logger.warn(`case admin check failed: ${(error as Error)?.message ?? error}`);
            return false;
        }
    }

    /**
     * GET session/feedstatus: what the cloud knows about a venue session's sync.
     *
     * Polled every 10 s by the FE, so it loads nothing that a sealed session ('K' / 'W' / 'F') released (review C2):
     * no journal reload (a chain hash per record, megabytes for a hearing day, pinned until the next seal), no D18
     * recompute (it reads every page into the live page store). A sealed session's meta is read from its stores as
     * is, and its raw head is the sealed one (`nRawFinalSeq`, else the PG watermark) unless the journal index
     * happens to be in memory. Only a live venue session ('E', not sealed) loads its journal.
     */
    async feedStatus(nSesid: string) {
        const id = normId(nSesid);
        const b = (await this.loadBindings([id])).get(id);
        if (!b) throw new EdgeServiceError('NOT_FOUND', 'Session not found');
        const sealed = SEALED_STATES.has(b.cSyncState ?? '');
        const venue = b.cFeedSource === 'E';
        if (venue && !sealed) await this.rawStore.ensureLoaded(id);
        let m: CloudEdgeMeta | null = null;
        if (venue) m = sealed ? await this.sealedMeta(id) : await this.ensureMeta(id, b, false).catch(() => null);
        const conn = b.nEdgeid ? this.registry.gateway?.connection(b.nEdgeid) ?? null : null;
        const seal = await this.sealFields(id);
        return {
            msg: 1,
            nSesid: id,
            cFeedSource: b.cFeedSource,
            cSyncState: b.cSyncState,
            // C1: who may split / switch it (besides super-admins); the FE hides those actions from everyone else.
            nHearingOpid: b.nHearingOpid,
            // G3: the seal's incident list and its acknowledgement, for the users this route admits (global admin,
            // case admin, hearing operator), so a 'W' session can be acknowledged without the admin-only audit trail.
            jIncidents: seal?.jIncidents ?? null,
            dWarnAckAt: seal?.dWarnAckAt ?? null,
            nWarnAckBy: seal?.nWarnAckBy ?? null,
            cWarnAckBy: seal?.cWarnAckBy ?? null,
            cSealNote: seal?.cSealNote ?? null,
            dSealedAt: seal?.dSealedAt ?? null,
            nFinalLines: seal?.nFinalLines ?? null,
            sealFieldsError: seal === null,
            nEdgeid: b.nEdgeid,
            nIngestEpoch: b.nIngestEpoch,
            nPartNo: b.nPartNo,
            nPrevPartSesid: b.nPrevPartSesid,
            box: conn ? { online: true, bootId: conn.bootId, status: conn.status, lastSeenMs: conn.lastSeenMs } : { online: false },
            viewer: this.viewer.get(id) ?? null,
            meta: m
                ? {
                    appliedRev: m.appliedRev,
                    appliedRawSeq: m.appliedRawSeq,
                    totalLines: m.totalLines,
                    pages: m.digests.length,
                    root: m.root,
                    frozen: !!m.frozen,
                    frozenReason: m.frozenReason ?? null,
                    pendingRawChecks: m.pendingRawChecks?.length ?? 0,
                    heldShrink: m.heldShrink ?? null,
                    sealed: m.sealed ?? null,
                    updatedAtMs: m.updatedAtMs ?? null,
                }
                : null,
            raw: this.rawStatus(id, b, seal),
        };
    }

    /** A sealed session's meta for a status read: memory, else Redis / edge-meta.json, never cached or recomputed. */
    private async sealedMeta(id: string): Promise<CloudEdgeMeta | null> {
        return this.metas.get(id) ?? (await this.storedMeta(id).catch(() => null));
    }

    /**
     * The raw head for session/feedstatus: the journal index when it is in memory; otherwise (a sealed or non-venue
     * session, see feedStatus) the sealed head, else the PG watermark pair, else nothing. `loaded` says which.
     */
    private rawStatus(id: string, b: EdgeBinding, seal: { nRawFinalSeq: number | null; cRawFinalHash: string | null } | null) {
        if (this.rawStore.isLoaded(id)) return { ...this.rawStore.head(id), corrupt: this.rawStore.isCorrupt(id), loaded: true };
        if (seal?.nRawFinalSeq !== null && seal?.nRawFinalSeq !== undefined) return { seq: seal.nRawFinalSeq, hash: seal.cRawFinalHash, corrupt: null, loaded: false };
        if (b.nAppliedRawSeq !== null) return { seq: b.nAppliedRawSeq, hash: b.cAppliedRawHash, corrupt: null, loaded: false };
        return { seq: null, hash: null, corrupt: null, loaded: false };
    }

    /** G3: the seal fields of a session (EDGE_SEAL_FIELDS_SQL), or null when they could not be read. */
    private async sealFields(id: string): Promise<{
        jIncidents: unknown[] | null;
        dWarnAckAt: string | null;
        nWarnAckBy: string | null;
        cWarnAckBy: string | null;
        cSealNote: string | null;
        dSealedAt: string | null;
        nFinalLines: number | null;
        nRawFinalSeq: number | null;
        cRawFinalHash: string | null;
    } | null> {
        try {
            const r = (await readRows(this.db, 'seal fields', EDGE_SEAL_FIELDS_SQL, [id]))[0] ?? {};
            let incidents: unknown = r.jIncidents ?? null;
            if (typeof incidents === 'string') {
                try {
                    incidents = JSON.parse(incidents);
                } catch {
                    incidents = null;
                }
            }
            const iso = (v: unknown) => (v ? new Date(v as any).toISOString() : null);
            const by = normId(r.nWarnAckBy);
            return {
                jIncidents: Array.isArray(incidents) ? incidents : null,
                dWarnAckAt: iso(r.dWarnAckAt),
                nWarnAckBy: by,
                cWarnAckBy: by ? personName(r.cWarnAckFname, r.cWarnAckLname, 'Unknown user') : null,
                cSealNote: r.cSealNote ?? null,
                dSealedAt: iso(r.dSealedAt),
                nFinalLines: num(r.nFinalLines),
                nRawFinalSeq: num(r.nRawFinalSeq),
                cRawFinalHash: r.cRawFinalHash ? String(r.cRawFinalHash) : null,
            };
        } catch (error) {
            this.logger.warn(`seal fields of ${id} unavailable: ${(error as Error)?.message ?? error}`);
            return null;
        }
    }

    // -----------------------------------------------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------------------------------------------

    private cloudHost(): { host: string; port: number } {
        return {
            host: this.config.get<string>(EDGE_CONFIG.feedHost) || '46.202.166.124',
            port: Number(this.config.get<string>(EDGE_CONFIG.feedPort)) || 2500,
        };
    }

    private transmitterModeOf(nEdgeid: string | null, nSesid: string): 'listen' | 'dial' | null {
        if (!nEdgeid) return null;
        const mode = this.registry.sessionStatus(nEdgeid, nSesid)?.session?.transmitterMode;
        return mode === 'dial' || mode === 'listen' ? mode : null;
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------------------------------------------

function validMeta(m: any, id: string): m is CloudEdgeMeta {
    return !!m && typeof m === 'object' && normId(m.nSesid) === id && Array.isArray(m.digests) && Number.isSafeInteger(m.appliedRev) && Number.isSafeInteger(m.totalLines);
}

/** A UUID derived from a key (idempotency of e.capture resends). */
export function stableUuid(key: string): string {
    const h = createHash('sha256').update(key).digest('hex');
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/**
 * O-5 (build default): reporter steps after a split. Listen mode changes only the host; a dial-mode
 * transmitter cannot be dialled by the cloud, so Eclipse must switch to "Connect to server" with the same login.
 */
export function reporterInstructions(mode: 'listen' | 'dial' | null, host: string, port: number, username: string | null) {
    const login = username ? `username ${username}` : 'the same username';
    if (mode === 'dial') {
        return {
            mode,
            host,
            port,
            username,
            steps: [
                'In Eclipse, switch realtime output to "Connect to server".',
                `Server ${host}, port ${port}.`,
                `Log in with ${login}; the password is unchanged.`,
            ],
        };
    }
    return {
        mode: mode ?? 'listen',
        host,
        port,
        username,
        steps: [`In Eclipse, change only the server address to ${host}, port ${port}.`, `Keep ${login} and the same password.`],
    };
}

/** Text of a canonical line ([1] holds char codes). */
export function lineText(line: unknown): string {
    const codes = Array.isArray(line) ? (line as any[])[1] : null;
    if (!Array.isArray(codes)) return '';
    return codes
        .filter(c => Number.isInteger(c) && c >= 0 && c <= 0xffff)
        .slice(0, 400)
        .map(c => String.fromCharCode(c))
        .join('');
}

/**
 * Samples for a held shrink: the first page the round rewrites (stored text vs round text, 5 lines) and the
 * lines the cloud would lose at the end (indexes toTotal .. toTotal+4 of the stored transcript).
 */
export function shrinkSamples(round: EdgeRound, stored: Map<number, unknown[]>, nLines: number) {
    const first = round.pages[0];
    const removedTail: string[] = [];
    for (let i = round.totalLines; i < round.totalLines + 5; i++) {
        const page = stored.get(Math.floor(i / nLines) + 1);
        const line = page?.[i % nLines];
        if (line === undefined) break;
        removedTail.push(lineText(line));
    }
    return {
        firstPage: first?.p ?? null,
        before: first ? (stored.get(first.p) ?? []).slice(0, 5).map(lineText) : [],
        after: first ? first.lines.slice(0, 5).map(lineText) : [],
        removedTail,
    };
}
