/**
 * In-memory attempt limits of the box's unauthenticated entry points (nothing here is persisted: a restart clears a
 * lock, which is acceptable for a 60 s lock and keeps the box's database free of attempt rows).
 *
 * - `CodeEntryLockout` (O-9, CONTRACTS.md §2.3): wrong room-code / operator-code tries are counted per device cookie
 *   AND per client IP; the 5th wrong try within the window locks entry for 60 s on every key it counted on. Tries while
 *   locked are refused without extending the lock. One instance is shared by both code kinds, so alternating between
 *   them gives no extra tries.
 * - `SlidingWindowLimiter`: `POST /edge/auth/sign-in/start` allows 20 calls per minute per client IP.
 */
import { EDGE_CODE_LOCK_SEC, EDGE_CODE_MAX_TRIES } from '../contracts';

/** Wrong tries older than this no longer count toward a lock. */
export const EDGE_CODE_TRY_WINDOW_MS = 15 * 60_000;
/** Sign-in starts per client IP per minute (ports/auth.port.ts). */
export const EDGE_SIGNIN_START_PER_MINUTE = 20;

/** The lockout keys of one attempt: the device cookie's hash and the client IP (either may be missing). */
export function lockoutKeys(ip: string | null, deviceHash: string | null): string[] {
    const keys: string[] = [];
    if (deviceHash) keys.push(`device:${deviceHash}`);
    if (ip) keys.push(`ip:${ip}`);
    if (!keys.length) keys.push('anonymous');
    return keys;
}

interface LockEntry {
    tries: number[];
    lockedUntilMs: number;
}

export interface LockoutVerdict {
    /** Seconds until entry opens again (0 = not locked). */
    readonly retryAfterSec: number;
    /** Wrong tries left before the lock (0 when locked). */
    readonly attemptsLeft: number;
}

export class CodeEntryLockout {
    private readonly entries = new Map<string, LockEntry>();

    constructor(
        private readonly maxTries: number = EDGE_CODE_MAX_TRIES,
        private readonly lockMs: number = EDGE_CODE_LOCK_SEC * 1000,
        private readonly windowMs: number = EDGE_CODE_TRY_WINDOW_MS,
        private readonly maxKeys: number = 10_000,
    ) {}

    /** Seconds left on the longest lock covering any of `keys`; 0 when none is locked. */
    lockedFor(keys: readonly string[], nowMs: number): number {
        let until = 0;
        for (const key of keys) {
            const entry = this.entries.get(key);
            if (entry && entry.lockedUntilMs > nowMs) until = Math.max(until, entry.lockedUntilMs);
        }
        return until > nowMs ? Math.max(1, Math.ceil((until - nowMs) / 1000)) : 0;
    }

    /** Count one wrong try on every key. Locks a key on its `maxTries`-th try within the window. */
    fail(keys: readonly string[], nowMs: number): LockoutVerdict {
        let attemptsLeft = this.maxTries;
        for (const key of keys) {
            const entry = this.entry(key, nowMs);
            entry.tries.push(nowMs);
            if (entry.tries.length >= this.maxTries) {
                entry.tries = [];
                entry.lockedUntilMs = nowMs + this.lockMs;
            }
            const left = entry.lockedUntilMs > nowMs ? 0 : this.maxTries - entry.tries.length;
            attemptsLeft = Math.min(attemptsLeft, left);
        }
        this.sweep(nowMs);
        return { retryAfterSec: this.lockedFor(keys, nowMs), attemptsLeft };
    }

    /** A correct code: forget the wrong tries of these keys (a running lock on another key is untouched). */
    succeed(keys: readonly string[]): void {
        for (const key of keys) {
            const entry = this.entries.get(key);
            if (entry && entry.lockedUntilMs === 0) this.entries.delete(key);
            else if (entry) entry.tries = [];
        }
    }

    /** Keys currently tracked (specs, diagnostics). */
    get size(): number {
        return this.entries.size;
    }

    private entry(key: string, nowMs: number): LockEntry {
        let entry = this.entries.get(key);
        if (!entry) {
            entry = { tries: [], lockedUntilMs: 0 };
            this.entries.set(key, entry);
        }
        if (entry.lockedUntilMs && entry.lockedUntilMs <= nowMs) entry.lockedUntilMs = 0;
        entry.tries = entry.tries.filter(at => nowMs - at < this.windowMs);
        return entry;
    }

    /** Drop entries with nothing left to remember; past `maxKeys`, the oldest ones go first. */
    private sweep(nowMs: number): void {
        if (this.entries.size <= this.maxKeys) return;
        for (const [key, entry] of this.entries) {
            const live = entry.lockedUntilMs > nowMs || entry.tries.some(at => nowMs - at < this.windowMs);
            if (!live) this.entries.delete(key);
        }
        while (this.entries.size > this.maxKeys) {
            const oldest = this.entries.keys().next().value as string;
            this.entries.delete(oldest);
        }
    }
}

export type LimiterVerdict = { readonly ok: true } | { readonly ok: false; readonly retryAfterSec: number };

/** At most `limit` calls per `windowMs` per key (sliding window). */
export class SlidingWindowLimiter {
    private readonly calls = new Map<string, number[]>();

    constructor(
        private readonly limit: number = EDGE_SIGNIN_START_PER_MINUTE,
        private readonly windowMs: number = 60_000,
        private readonly maxKeys: number = 10_000,
    ) {}

    /** Count one call for `key` (only when it is allowed). */
    take(key: string, nowMs: number): LimiterVerdict {
        const recent = (this.calls.get(key) ?? []).filter(at => nowMs - at < this.windowMs);
        if (recent.length >= this.limit) {
            this.calls.set(key, recent);
            return { ok: false, retryAfterSec: Math.max(1, Math.ceil((recent[0] + this.windowMs - nowMs) / 1000)) };
        }
        recent.push(nowMs);
        this.calls.delete(key);
        this.calls.set(key, recent);
        if (this.calls.size > this.maxKeys) {
            for (const [k, list] of this.calls) {
                if (!list.some(at => nowMs - at < this.windowMs)) this.calls.delete(k);
            }
            while (this.calls.size > this.maxKeys) this.calls.delete(this.calls.keys().next().value as string);
        }
        return { ok: true };
    }
}
