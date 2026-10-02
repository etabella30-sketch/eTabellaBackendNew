/**
 * In-memory Eclipse route cache (spec §3.2, PM10, RC-2).
 *
 * Today the listener re-reads the route file on every handshake AND every
 * chunk, and a read error returns [] and kills every live stream
 * (eclipse-tcp-ingest.service.ts:123-129). Here the routes are read from an
 * injectable source when it signals a change (and on a slow poll), and the
 * last good routes are KEPT when a read or parse fails. Every lookup on the
 * CAT path is a synchronous map lookup.
 *
 * Two route shapes are accepted and normalised:
 *  - the cloud route file written by EclipseSessionService.writeEclipseRoute
 *    ({nSesid, nCaseid, label, nLines, user, cTimezone, passwordSalt,
 *    passwordHash, passwordEnc?}, plus rev-3 feedSource/nEdgeid/epoch/apply/scryptN);
 *  - the box assignment payload's route ({user, salt, hash, scryptN}, §4.2),
 *    flattened with the session fields.
 * `passwordEnc` never enters the cache (it never leaves the cloud).
 */
import * as fs from 'fs';
import * as path from 'path';

import { AlertSink, Clock, safeAlert, systemClock } from './types';

export interface EclipseRoute {
    nSesid: string;
    nCaseid: string | null;
    /** Eclipse username, compared exactly as Eclipse sends it */
    user: string;
    /** base64 scrypt salt / hash; absent only on legacy plaintext routes */
    salt: string | null;
    hash: string | null;
    /** scrypt cost (default 2^14, the node default today's routes were written with; new routes 2^15) */
    scryptN: number | null;
    /** legacy plaintext password (routes written before hashing); compared in constant time */
    legacyPass: string | null;
    label: string;
    nLines: number;
    tz: string | null;
    /** 'D' direct, 'E' venue edge, 'H' legacy venue; null = unknown provenance */
    feedSource: string | null;
    nEdgeid: string | null;
    epoch: number | null;
    apply: string | null;
}

/** Where the routes come from. `read` resolves the parsed value (an array) or rejects. */
export interface RoutesSource {
    read(): Promise<unknown>;
    /** Optional change notification; returns an unsubscribe function. */
    watch?(onChange: () => void): () => void;
    describe?(): string;
}

export interface RouteDiff {
    added: string[];
    removed: string[];
    changed: string[];
}

export interface RouteRefreshResult {
    ok: boolean;
    error?: string;
    diff?: RouteDiff;
    /** entries skipped because they were not usable routes */
    skipped?: number;
}

export interface RouteCacheStatus {
    generation: number;
    count: number;
    lastGoodAt: number | null;
    lastError: string | null;
    lastErrorAt: number | null;
    consecutiveErrors: number;
    /** true once at least one read succeeded */
    loaded: boolean;
}

export interface RouteCacheOptions {
    source: RoutesSource;
    /** slow poll as a safety net behind `watch` (0 disables) */
    pollMs?: number;
    /** coalesce bursts of change events */
    debounceMs?: number;
    clock?: Clock;
    onAlert?: AlertSink;
    onChange?: (diff: RouteDiff, cache: RouteCache) => void;
}

export function normalizeRoute(raw: unknown): EclipseRoute | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, any>;
    const nested = r.route && typeof r.route === 'object' ? (r.route as Record<string, any>) : {};
    const nSesid = String(r.nSesid ?? '').trim();
    const user = r.user ?? nested.user;
    if (!nSesid || user === undefined || user === null || String(user) === '') return null;
    const salt = r.passwordSalt ?? r.salt ?? nested.passwordSalt ?? nested.salt ?? null;
    const hash = r.passwordHash ?? r.hash ?? nested.passwordHash ?? nested.hash ?? null;
    const legacyPass = r.pass ?? nested.pass;
    if (!(salt && hash) && (legacyPass === undefined || legacyPass === null)) return null;
    const scryptN = Number(r.scryptN ?? nested.scryptN);
    const nLines = Number(r.nLines);
    const epoch = Number(r.epoch);
    return {
        nSesid,
        nCaseid: r.nCaseid !== undefined && r.nCaseid !== null ? String(r.nCaseid) : null,
        user: String(user),
        salt: salt ? String(salt) : null,
        hash: hash ? String(hash) : null,
        scryptN: Number.isInteger(scryptN) && scryptN > 1 ? scryptN : null,
        legacyPass: salt && hash ? null : String(legacyPass),
        label: String(r.label ?? r.cName ?? user),
        nLines: Number.isInteger(nLines) && nLines > 0 ? nLines : 25,
        tz: r.cTimezone ?? r.tz ?? null,
        feedSource: r.feedSource ?? r.cFeedSource ?? null,
        nEdgeid: r.nEdgeid !== undefined && r.nEdgeid !== null ? String(r.nEdgeid) : null,
        epoch: Number.isInteger(epoch) ? epoch : null,
        apply: r.apply ?? null,
    };
}

function routeFingerprint(route: EclipseRoute): string {
    return JSON.stringify(route);
}

export class RouteCache {
    private readonly source: RoutesSource;
    private readonly pollMs: number;
    private readonly debounceMs: number;
    private readonly clock: Clock;
    private readonly alert: AlertSink;
    private readonly onChange?: (diff: RouteDiff, cache: RouteCache) => void;

    private routesList: EclipseRoute[] = [];
    private byUserMap = new Map<string, EclipseRoute[]>();
    private bySessionMap = new Map<string, EclipseRoute>();
    private generationValue = 0;
    private loaded = false;
    private lastGoodAt: number | null = null;
    private lastError: string | null = null;
    private lastErrorAt: number | null = null;
    private consecutiveErrors = 0;

    private inflight: Promise<RouteRefreshResult> | null = null;
    private again = false;
    private pollTimer: NodeJS.Timeout | null = null;
    private debounceTimer: NodeJS.Timeout | null = null;
    private unwatch: (() => void) | null = null;
    private stopped = false;
    private readonly removedListeners = new Set<(nSesid: string) => void>();

    constructor(opts: RouteCacheOptions) {
        this.source = opts.source;
        this.pollMs = opts.pollMs ?? 5_000;
        this.debounceMs = opts.debounceMs ?? 50;
        this.clock = opts.clock ?? systemClock;
        this.alert = safeAlert(opts.onAlert);
        this.onChange = opts.onChange;
    }

    /** First read, then watch + poll. A failing first read leaves the cache empty and keeps retrying. */
    async start(): Promise<RouteRefreshResult> {
        this.stopped = false;
        const first = await this.refresh();
        if (this.source.watch && !this.unwatch) {
            try {
                this.unwatch = this.source.watch(() => this.scheduleRefresh());
            } catch (error) {
                this.recordError(`watch failed: ${errorText(error)}`);
            }
        }
        if (this.pollMs > 0 && !this.pollTimer) {
            this.pollTimer = setInterval(() => void this.refresh(), this.pollMs);
            this.pollTimer.unref?.();
        }
        return first;
    }

    stop(): void {
        this.stopped = true;
        if (this.pollTimer) clearInterval(this.pollTimer);
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.pollTimer = null;
        this.debounceTimer = null;
        try {
            this.unwatch?.();
        } catch {
            /* ignore */
        }
        this.unwatch = null;
    }

    /**
     * Re-read the source. On any read or parse error the last good routes stay
     * in place (alerted once per error streak). Concurrent calls coalesce.
     */
    refresh(): Promise<RouteRefreshResult> {
        if (this.inflight) {
            this.again = true;
            return this.inflight;
        }
        this.inflight = this.doRefresh().finally(() => {
            this.inflight = null;
            if (this.again && !this.stopped) {
                this.again = false;
                void this.refresh();
            }
        });
        return this.inflight;
    }

    /** Replace the routes directly (tests, or a host that pushes assignments). */
    load(raw: unknown): RouteRefreshResult {
        return this.apply(raw);
    }

    list(): readonly EclipseRoute[] {
        return this.routesList;
    }

    byUser(user: string): readonly EclipseRoute[] {
        return this.byUserMap.get(String(user)) ?? [];
    }

    bySession(nSesid: string): EclipseRoute | undefined {
        return this.bySessionMap.get(String(nSesid));
    }

    /** Per-chunk liveness: a synchronous lookup, never an I/O. */
    isLive(nSesid: string): boolean {
        return this.bySessionMap.has(String(nSesid));
    }

    get generation(): number {
        return this.generationValue;
    }

    status(): RouteCacheStatus {
        return {
            generation: this.generationValue,
            count: this.routesList.length,
            lastGoodAt: this.lastGoodAt,
            lastError: this.lastError,
            lastErrorAt: this.lastErrorAt,
            consecutiveErrors: this.consecutiveErrors,
            loaded: this.loaded,
        };
    }

    /** Called with each session whose route disappeared from a good read. */
    onRemoved(listener: (nSesid: string) => void): () => void {
        this.removedListeners.add(listener);
        return () => this.removedListeners.delete(listener);
    }

    private scheduleRefresh(): void {
        if (this.stopped) return;
        if (this.debounceTimer) clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            void this.refresh();
        }, this.debounceMs);
        this.debounceTimer.unref?.();
    }

    private async doRefresh(): Promise<RouteRefreshResult> {
        let raw: unknown;
        try {
            raw = await this.source.read();
        } catch (error) {
            return this.recordError(`read failed: ${errorText(error)}`);
        }
        return this.apply(raw);
    }

    private apply(raw: unknown): RouteRefreshResult {
        if (!Array.isArray(raw)) return this.recordError(`expected an array of routes, got ${raw === null ? 'null' : typeof raw}`);
        const next: EclipseRoute[] = [];
        const seen = new Set<string>();
        let skipped = 0;
        for (const entry of raw) {
            const route = normalizeRoute(entry);
            if (!route || seen.has(route.nSesid)) {
                skipped += 1;
                continue;
            }
            seen.add(route.nSesid);
            next.push(route);
        }

        const diff: RouteDiff = { added: [], removed: [], changed: [] };
        for (const route of next) {
            const prev = this.bySessionMap.get(route.nSesid);
            if (!prev) diff.added.push(route.nSesid);
            else if (routeFingerprint(prev) !== routeFingerprint(route)) diff.changed.push(route.nSesid);
        }
        for (const nSesid of this.bySessionMap.keys()) if (!seen.has(nSesid)) diff.removed.push(nSesid);

        const byUser = new Map<string, EclipseRoute[]>();
        const bySession = new Map<string, EclipseRoute>();
        for (const route of next) {
            bySession.set(route.nSesid, route);
            const list = byUser.get(route.user) ?? [];
            list.push(route);
            byUser.set(route.user, list);
        }
        this.routesList = next;
        this.byUserMap = byUser;
        this.bySessionMap = bySession;
        this.loaded = true;
        this.lastGoodAt = this.clock();
        if (this.consecutiveErrors) {
            this.consecutiveErrors = 0;
            this.lastError = null;
        }
        const changed = diff.added.length + diff.removed.length + diff.changed.length > 0;
        if (changed) {
            this.generationValue += 1;
            for (const nSesid of diff.removed) {
                for (const listener of this.removedListeners) {
                    try {
                        listener(nSesid);
                    } catch {
                        /* a listener must not break the cache */
                    }
                }
            }
            try {
                this.onChange?.(diff, this);
            } catch {
                /* ignore */
            }
        }
        return { ok: true, diff, skipped };
    }

    private recordError(message: string): RouteRefreshResult {
        const now = this.clock();
        this.consecutiveErrors += 1;
        this.lastError = message;
        this.lastErrorAt = now;
        if (this.consecutiveErrors === 1) {
            this.alert({
                kind: 'ROUTES_READ_ERROR',
                tier: 'P2',
                message: `Eclipse routes could not be read (${message}); keeping the last good ${this.routesList.length} route(s)`,
                at: now,
                data: { source: this.source.describe?.() ?? null, kept: this.routesList.length, loaded: this.loaded },
            });
        }
        return { ok: false, error: message };
    }
}

/**
 * A JSON route file (the cloud's runtime route file, or the box's armed
 * routes). A missing file means "no routes", exactly as
 * EclipseSessionService.readEclipseRoutes treats ENOENT; anything else that
 * fails to read or parse is an error, so the cache keeps its last good routes.
 * The directory is watched (the file is replaced by rename on write).
 */
export function fileRoutesSource(file: string): RoutesSource {
    const resolved = path.resolve(file);
    return {
        async read() {
            let text: string;
            try {
                text = await fs.promises.readFile(resolved, 'utf8');
            } catch (error) {
                if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
                throw error;
            }
            return JSON.parse(text);
        },
        watch(onChange) {
            const dir = path.dirname(resolved);
            const base = path.basename(resolved);
            let watcher: fs.FSWatcher | null = null;
            try {
                watcher = fs.watch(dir, { persistent: false }, (_event, name) => {
                    if (!name || String(name) === base) onChange();
                });
                watcher.on('error', () => undefined);
            } catch {
                watcher = null;
            }
            return () => watcher?.close();
        },
        describe() {
            return resolved;
        },
    };
}

function errorText(error: unknown): string {
    const e = error as { code?: string; message?: string };
    return e?.code ? `${e.code}: ${e.message ?? ''}`.trim() : String(e?.message ?? error);
}
