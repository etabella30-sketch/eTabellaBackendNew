/**
 * Small, clock-driven pieces of the uplink, kept pure so they are specified on their own:
 * - `Backoff`: reconnect delays 1 → 30 s with FULL jitter, reset after 60 s connected (spec §10 #2);
 * - `InternetTracker`: the box's internet with the UI hysteresis (offline after 15 s down, online after 10 s up,
 *   EDGE_TIMING), `since` = when the reported state actually began;
 * - `TokenBucket`: the per-edge budget (default 1 MB/s, lowered by the hello reply's `limits.edgeBps`, §5.6), on a
 *   MONOTONIC clock (`monotonicMs`): the ops cloud-time fallback steps the wall clock, and a backward step must never
 *   turn into seconds of silence;
 * - `pickUplinkJob`: the scheduler order of §5.6 (degraded raw first, then live rounds round-robin, raw tail,
 *   catch-up round parts, raw backlog; seals last), with the raw floor: a raw lane that has waited longer than
 *   `RAW_STARVE_MS` while rounds kept coming goes ahead of the next round ("Raw always gets ≥ 32 KB/s").
 */
import { performance } from 'perf_hooks';

import type { EdgeInternetState, EdgeInternetStatus } from '../contracts';

/**
 * Milliseconds on a clock that never steps (`performance.now()`): every pacing, backoff and retry interval of the
 * uplink is measured on it. The wall clock (EDGE_CLOCK) is only for timestamps people or the cloud read.
 */
export const monotonicMs = (): number => performance.now();

export class Backoff {
    private attempt = 0;
    private connectedAt: number | null = null;

    constructor(
        private readonly baseMs: number,
        private readonly maxMs: number,
        private readonly stableResetMs: number,
        private readonly random: () => number,
    ) {}

    /** Delay before the next attempt: uniform in [0, min(max, base·2^n)] ("full jitter"). */
    next(): number {
        const cap = Math.min(this.maxMs, this.baseMs * 2 ** Math.min(this.attempt, 30));
        this.attempt += 1;
        return Math.floor(this.random() * cap);
    }

    get attempts(): number {
        return this.attempt;
    }

    connected(nowMs: number): void {
        this.connectedAt = nowMs;
    }

    /** On a disconnect: a link that stayed up ≥ stableResetMs starts the backoff from scratch. */
    disconnected(nowMs: number): void {
        if (this.connectedAt !== null && nowMs - this.connectedAt >= this.stableResetMs) this.attempt = 0;
        this.connectedAt = null;
    }

    reset(): void {
        this.attempt = 0;
    }
}

export class InternetTracker {
    private reported: EdgeInternetState = 'unknown';
    private reportedSince: number | null = null;
    private raw: { up: boolean; since: number } | null = null;

    constructor(
        private readonly offlineAfterMs: number,
        private readonly onlineAfterMs: number,
    ) {}

    /** Record one piece of evidence; returns true when the reported state changed. */
    evidence(up: boolean, atMs: number): boolean {
        if (!this.raw || this.raw.up !== up) this.raw = { up, since: atMs };
        return this.evaluate(atMs);
    }

    /** Re-evaluate the hysteresis at `nowMs`; returns true when the reported state changed. */
    evaluate(nowMs: number): boolean {
        if (!this.raw) return false;
        const want: EdgeInternetState = this.raw.up ? 'up' : 'down';
        if (want === this.reported) return false;
        const held = nowMs - this.raw.since;
        // The first evidence is reported at once: there is no earlier state to flap from.
        if (this.reported !== 'unknown' && held < (this.raw.up ? this.onlineAfterMs : this.offlineAfterMs)) return false;
        this.reported = want;
        this.reportedSince = this.raw.since;
        return true;
    }

    status(): EdgeInternetStatus {
        return { state: this.reported, sinceMs: this.reportedSince };
    }
}

export class TokenBucket {
    private tokens: number;
    private at: number;

    constructor(
        private rate: number,
        private readonly now: () => number,
    ) {
        this.tokens = rate;
        this.at = now();
    }

    setRate(rate: number): void {
        if (Number.isFinite(rate) && rate > 0) {
            this.refill();
            this.rate = rate;
            this.tokens = Math.min(this.tokens, rate);
        }
    }

    /** Milliseconds to wait before `bytes` may be sent (0 = now); takes the tokens when 0. */
    take(bytes: number): number {
        this.refill();
        const need = Math.min(bytes, this.rate); // a message larger than one second of budget waits for a full bucket
        if (this.tokens >= need) {
            this.tokens -= need;
            return 0;
        }
        return Math.ceil(((need - this.tokens) / this.rate) * 1000);
    }

    private refill(): void {
        const t = this.now();
        // Never negative: a clock that steps back (it should be monotonic, but never trust it) costs nothing.
        const elapsed = Math.max(0, t - this.at);
        this.tokens = Math.min(this.rate, this.tokens + (elapsed / 1000) * this.rate);
        this.at = t;
    }
}

export type UplinkJobKind = 'raw-degraded' | 'round-live' | 'raw-tail' | 'round-catchup' | 'raw-backlog' | 'seal';

export interface UplinkCandidate {
    readonly nSesid: string;
    /** A round is due (or a multi-part round is half sent); null when none. */
    readonly round: { readonly dirtyPages: number } | null;
    /**
     * Raw records are waiting; null when none. `starved`: they have waited longer than RAW_STARVE_MS for a send
     * (the raw floor of §5.6: rounds that keep coming due must not hold the raw lane back indefinitely).
     */
    readonly raw: { readonly lagBytes: number; readonly degraded: boolean; readonly starved?: boolean } | null;
    readonly seal: boolean;
}

export const RAW_TAIL_MAX_BYTES = 1024 * 1024;
export const LIVE_ROUND_MAX_PAGES = 2;
/**
 * The raw floor (spec §5.6 "Raw always gets ≥ 32 KB/s", `limits.rawMinBps`): raw records that have waited this
 * long for a send go ahead of the next round (`rawStarveMs` narrows it for a small `maxPart`).
 */
export const RAW_STARVE_MS = 2_000;

/**
 * How long raw may wait behind rounds: one batch of up to `maxPartBytes` every `maxPartBytes / rawMinBps` seconds
 * keeps the floor, bounded to [100 ms, RAW_STARVE_MS]; RAW_STARVE_MS when the cloud sent no floor.
 */
export function rawStarveMs(maxPartBytes: number, rawMinBps: number | null): number {
    if (!rawMinBps || !(rawMinBps > 0) || !(maxPartBytes > 0)) return RAW_STARVE_MS;
    return Math.min(RAW_STARVE_MS, Math.max(100, Math.floor((maxPartBytes / rawMinBps) * 1000)));
}

/**
 * The next job, in §5.6 order, round-robin among sessions inside a class (`after` = the session served last).
 * Null when nothing is due.
 */
export function pickUplinkJob(candidates: readonly UplinkCandidate[], after: string | null): { readonly kind: UplinkJobKind; readonly nSesid: string } | null {
    const order = rotate(candidates, after);
    const first = (kind: UplinkJobKind, test: (c: UplinkCandidate) => boolean) => {
        const c = order.find(test);
        return c ? { kind, nSesid: c.nSesid } : null;
    };
    const starved = order.find(c => !!c.raw?.starved);
    return (
        first('raw-degraded', c => !!c.raw?.degraded) ??
        (starved ? { kind: starved.raw!.lagBytes < RAW_TAIL_MAX_BYTES ? 'raw-tail' : 'raw-backlog', nSesid: starved.nSesid } : null) ??
        first('round-live', c => !!c.round && c.round.dirtyPages <= LIVE_ROUND_MAX_PAGES) ??
        first('raw-tail', c => !!c.raw && c.raw.lagBytes < RAW_TAIL_MAX_BYTES) ??
        first('round-catchup', c => !!c.round) ??
        first('raw-backlog', c => !!c.raw) ??
        first('seal', c => c.seal)
    );
}

function rotate(candidates: readonly UplinkCandidate[], after: string | null): UplinkCandidate[] {
    const sorted = [...candidates].sort((a, b) => (a.nSesid < b.nSesid ? -1 : a.nSesid > b.nSesid ? 1 : 0));
    if (after === null) return sorted;
    const i = sorted.findIndex(c => c.nSesid > after);
    return i < 0 ? sorted : [...sorted.slice(i), ...sorted.slice(0, i)];
}
