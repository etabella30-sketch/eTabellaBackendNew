/**
 * The read-through cache of the proxied RT reads (spec §8.2 row 6: "response cached per (user, URL)", stale-if-offline
 * with `X-Edge-Stale: <age>`).
 *
 * - Memory only: nothing is written to disk, nothing survives a restart.
 * - Per user: the key starts with the caller's user id, and a lookup is only ever made for the verified principal, so
 *   one person's cached marks never reach another person (the cloud's per-user rules stay intact).
 * - Only a 200 JSON reply of an allowlisted GET is stored (not the cloud's "failed" answer, msg below 0: as the cloud
 *   also refuses that way, that answer replaces the caller's copy of the read with a marker that is never served, and
 *   a read that started before the refusal cannot store the copy again, `refuse`); writes are never cached, and a
 *   successful write makes the writer's entries stale (`expireUser`) so the next read sees the change.
 * - A fresh entry is answered with `X-Edge-Age`; `X-Edge-Stale` is only for a copy served in place of an answer the
 *   cloud could not give.
 * - Live mark sync (user decision 2026-10-05): a `marks-changed` notice makes the listed users' entries stale at once
 *   (`expireUser`; a resync after the cloud link came back: everyone's, `expireAll`). The copies are KEPT, each still
 *   under its owner's key: a busy box (too many cloud calls, once its short wait for a slot ran out), a 5xx or an
 *   offline box still answers that owner with them instead of an error or an empty list.
 * - Expiry stamps: a read that was in flight when its user's entries expired (or the user wrote) may have missed the
 *   change. `cloudRead` takes `stamp(user)` before it asks the cloud and hands it to `set`: such a copy is stored
 *   stale, and never replaces a copy stored by a read that started after the expiry.
 * - Bounded: `maxEntries`, `maxBytes` (bodies), and no single body over a quarter of `maxBytes`; least recently used
 *   entries go first. Entries older than `staleMaxMs` are gone.
 */

export interface RtCacheOptions {
    readonly freshMs: number;
    readonly staleMaxMs: number;
    readonly maxEntries: number;
    readonly maxBytes: number;
}

interface Entry {
    readonly user: string;
    readonly body: Buffer;
    readonly storedAtMs: number;
    /** The expiry stamp its read started at (`RtReadCache.stamp`). */
    readonly stamp: number;
    /** A notice (or a write) since: stale whatever its age, still served when the cloud cannot answer. */
    expired: boolean;
    /** Not a copy: the marker a refusal leaves (`refuse`). Never served; no body. */
    readonly refused: boolean;
}

export interface RtCacheHit {
    readonly body: Buffer;
    readonly ageMs: number;
    /** Younger than `freshMs`: answered without asking the cloud. */
    readonly fresh: boolean;
    /**
     * A mark notice (or a write of its user, or a resync) since it was read: the cloud has newer marks, so it must not
     * stand in for a fresh read while the cloud can still answer (RtDataService waits for a slot first).
     */
    readonly expired: boolean;
}

/** `user` is compared case-insensitively (uuids). */
const userKey = (user: string): string => String(user ?? '').trim().toLowerCase();

export class RtReadCache {
    private readonly entries = new Map<string, Entry>();
    private totalBytes = 0;
    /** Moves on every expiry (a notice, a resync, a write). */
    private epoch = 0;
    /** The epoch of the last `expireAll` (every user's stamp is at least this). */
    private allExpiredAt = 0;
    /** Per user: the epoch of that user's last expiry or write, when later than `allExpiredAt`. */
    private readonly userExpiredAt = new Map<string, number>();

    constructor(
        private readonly opts: RtCacheOptions,
        private readonly clock: () => number,
    ) {}

    /** The key of one read: user, route, canonical query (sorted, identity keys already overwritten). */
    static key(user: string, routeId: string, query: string): string {
        return `${userKey(user)}\n${routeId}\n${query}`;
    }

    get(key: string): RtCacheHit | null {
        const entry = this.entries.get(key);
        if (!entry) return null;
        const ageMs = Math.max(0, this.clock() - entry.storedAtMs);
        if (ageMs > this.opts.staleMaxMs) {
            this.remove(key, entry);
            return null;
        }
        if (entry.refused) return null;
        // Most recently used last.
        this.entries.delete(key);
        this.entries.set(key, entry);
        return { body: entry.body, ageMs, fresh: !entry.expired && ageMs < this.opts.freshMs, expired: entry.expired };
    }

    /**
     * Store one read's copy. `stamp`: `stamp(user)` taken when that read started; a read that started before the
     * user's last expiry is stored stale, and never replaces a copy (or a refusal's marker) whose read started later
     * (false, and the marker stays even when this copy is too large to keep). Without a stamp the copy counts as read
     * now. False when nothing was stored.
     */
    set(key: string, user: string, body: Buffer, stamp?: number): boolean {
        const now = this.stamp(user);
        const startedAt = stamp ?? now;
        const existing = this.entries.get(key);
        if (existing && existing.stamp > startedAt) return false;
        if (!Buffer.isBuffer(body) || body.length > Math.floor(this.opts.maxBytes / 4)) {
            this.delete(key);
            return false;
        }
        this.put(key, { user: userKey(user), body, storedAtMs: this.clock(), stamp: startedAt, expired: startedAt < now, refused: false });
        return true;
    }

    /**
     * The cloud refused this read (its "failed" answer, e.g. factsheet/detail to a person who may no longer view the
     * fact): its copy is replaced by a marker that `get` never answers, so no fallback can serve it. The marker keeps
     * the refusing read's stamp (never lower than that of what it replaces): a read that started before it and answers
     * after it is not stored (`set`), so it cannot bring the refused copy back. A later good read replaces it as usual.
     * Counted and dropped like a copy, with no bytes.
     */
    refuse(key: string, user: string, stamp?: number): void {
        const startedAt = Math.max(stamp ?? this.stamp(user), this.entries.get(key)?.stamp ?? 0);
        this.put(key, { user: userKey(user), body: Buffer.alloc(0), storedAtMs: this.clock(), stamp: startedAt, expired: true, refused: true });
    }

    delete(key: string): void {
        const entry = this.entries.get(key);
        if (entry) this.remove(key, entry);
    }

    /**
     * A `marks-changed` notice for this user (user decision 2026-10-05), or their own successful write: every entry of
     * theirs is stale at once and the next read asks the cloud; the copies stay for the busy / 5xx / offline fallbacks.
     * Moves the user's stamp too: a read of theirs in flight across it is stored stale. Returns how many.
     */
    expireUser(user: string): number {
        const who = userKey(user);
        this.bump(who);
        let n = 0;
        for (const entry of this.entries.values()) {
            if (entry.user !== who) continue;
            entry.expired = true;
            n++;
        }
        return n;
    }

    /** The cloud link came back (notices may be lost): every entry is stale, the copies stay. Returns how many. */
    expireAll(): number {
        this.epoch += 1;
        this.allExpiredAt = this.epoch;
        this.userExpiredAt.clear();
        for (const entry of this.entries.values()) entry.expired = true;
        return this.entries.size;
    }

    /** The expiry stamp of `user` now: take it before asking the cloud and hand it to `set`. */
    stamp(user: string): number {
        return Math.max(this.allExpiredAt, this.userExpiredAt.get(userKey(user)) ?? 0);
    }

    clear(): void {
        this.entries.clear();
        this.totalBytes = 0;
    }

    get size(): number {
        return this.entries.size;
    }

    get bytes(): number {
        return this.totalBytes;
    }

    /** Replace the key's entry; past `maxEntries` or `maxBytes` the least recently used entries go. */
    private put(key: string, entry: Entry): void {
        this.delete(key);
        this.entries.set(key, entry);
        this.totalBytes += entry.body.length;
        while (this.entries.size > this.opts.maxEntries || this.totalBytes > this.opts.maxBytes) {
            const [oldestKey, oldest] = this.entries.entries().next().value as [string, Entry];
            this.remove(oldestKey, oldest);
        }
    }

    private remove(key: string, entry: Entry): void {
        this.entries.delete(key);
        this.totalBytes -= entry.body.length;
    }

    /** Move one user's stamp. Bounded like the entries: past `maxEntries` users, every user's stamp moves instead. */
    private bump(who: string): void {
        this.epoch += 1;
        if (this.userExpiredAt.size >= this.opts.maxEntries && !this.userExpiredAt.has(who)) {
            this.allExpiredAt = this.epoch;
            this.userExpiredAt.clear();
            return;
        }
        this.userExpiredAt.set(who, this.epoch);
    }
}
