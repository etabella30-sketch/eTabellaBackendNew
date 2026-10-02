/**
 * The read-through cache of the proxied RT reads (spec §8.2 row 6: "response cached per (user, URL)", stale-if-offline
 * with `X-Edge-Stale: <age>`).
 *
 * - Memory only: nothing is written to disk, nothing survives a restart.
 * - Per user: the key starts with the caller's user id, and a lookup is only ever made for the verified principal, so
 *   one person's cached marks never reach another person (the cloud's per-user rules stay intact).
 * - Only a 200 JSON reply of an allowlisted GET is stored; writes are never cached, and a successful write drops the
 *   writer's entries (`dropUser`) so the next read sees the change.
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
}

export interface RtCacheHit {
    readonly body: Buffer;
    readonly ageMs: number;
    /** Younger than `freshMs`: answered without asking the cloud. */
    readonly fresh: boolean;
}

/** `user` is compared case-insensitively (uuids). */
const userKey = (user: string): string => String(user ?? '').trim().toLowerCase();

export class RtReadCache {
    private readonly entries = new Map<string, Entry>();
    private totalBytes = 0;

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
        // Most recently used last.
        this.entries.delete(key);
        this.entries.set(key, entry);
        return { body: entry.body, ageMs, fresh: ageMs < this.opts.freshMs };
    }

    set(key: string, user: string, body: Buffer): boolean {
        if (!Buffer.isBuffer(body) || body.length > Math.floor(this.opts.maxBytes / 4)) {
            this.delete(key);
            return false;
        }
        this.delete(key);
        const entry: Entry = { user: userKey(user), body, storedAtMs: this.clock() };
        this.entries.set(key, entry);
        this.totalBytes += body.length;
        while (this.entries.size > this.opts.maxEntries || this.totalBytes > this.opts.maxBytes) {
            const [oldestKey, oldest] = this.entries.entries().next().value as [string, Entry];
            this.remove(oldestKey, oldest);
        }
        return true;
    }

    delete(key: string): void {
        const entry = this.entries.get(key);
        if (entry) this.remove(key, entry);
    }

    /** Drop every entry of one user (after their successful write). Returns how many. */
    dropUser(user: string): number {
        const who = userKey(user);
        let n = 0;
        for (const [key, entry] of [...this.entries]) {
            if (entry.user !== who) continue;
            this.remove(key, entry);
            n++;
        }
        return n;
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

    private remove(key: string, entry: Entry): void {
        this.entries.delete(key);
        this.totalBytes -= entry.body.length;
    }
}
