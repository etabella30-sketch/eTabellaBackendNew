/**
 * Limits of the RT data routes (rt-routes.ts): the cloud proxy's timeouts and sizes, the read-through cache. The box
 * provides `DEFAULT_RT_DATA_OPTIONS` (lan.module.ts); specs override single values with `RT_DATA_OPTIONS`.
 */

export const RT_DATA_OPTIONS = 'RT_EDGE_RT_DATA_OPTIONS';

export interface RtDataOptions {
    /** A proxied read gives up after this long (connect included); it then answers like offline (cache, else empty). */
    readonly readTimeoutMs: number;
    /** A proxied write gives up after this long: `502 cloud_refused` (it may or may not have reached the cloud). */
    readonly writeTimeoutMs: number;
    /** Largest cloud reply body to a read; larger is refused (`502 cloud_refused`), never truncated. */
    readonly maxReadResponseBytes: number;
    /** Largest cloud reply body to a write. */
    readonly maxWriteResponseBytes: number;
    /** Largest JSON body the box forwards (re-serialised); larger is `413 payload_too_large`. */
    readonly maxRequestBodyBytes: number;
    /** Longest query string the box reads on these routes; longer is `400 invalid_request`. */
    readonly maxQueryBytes: number;
    /**
     * Cloud calls in flight at once; one more is `429 rate_limited` (a read first waits its turn, `staleReadWaitMs`,
     * and falls back to its cached copy).
     */
    readonly maxInFlight: number;
    /**
     * Of `maxInFlight`, the slots only writes may take: reads count as busy at `maxInFlight - writeSlots` (never below
     * one), so the reload burst after a mark notice cannot take the slots a mark save needs (a 429). Reads lose little:
     * the cloud agent opens at most 16 sockets anyway.
     */
    readonly writeSlots: number;
    /**
     * When the box is busy, a read with no cached copy, or with one a mark notice (or a write) made stale, waits at most
     * this long (and never longer than `readTimeoutMs`) for a free cloud slot, first come first served, instead of a
     * 429 at once or that copy passed off as current. Only once the wait runs out is the copy served (`X-Edge-Stale`),
     * or, with no copy, 429. A copy nothing has made stale is still served at once.
     */
    readonly staleReadWaitMs: number;
    /** A cached read younger than this is answered without asking the cloud. */
    readonly cacheFreshMs: number;
    /** A cached read is kept (and served offline as stale) at most this long. */
    readonly cacheStaleMaxMs: number;
    readonly cacheMaxEntries: number;
    /** Memory budget of the cache (bodies); one entry may use at most a quarter of it. */
    readonly cacheMaxBytes: number;
}

export const DEFAULT_RT_DATA_OPTIONS: Readonly<RtDataOptions> = Object.freeze({
    readTimeoutMs: 8_000,
    writeTimeoutMs: 15_000,
    maxReadResponseBytes: 8 * 1024 * 1024,
    maxWriteResponseBytes: 1024 * 1024,
    maxRequestBodyBytes: 1024 * 1024,
    maxQueryBytes: 8 * 1024,
    maxInFlight: 32,
    writeSlots: 8,
    staleReadWaitMs: 2_000,
    cacheFreshMs: 15_000,
    cacheStaleMaxMs: 12 * 3_600_000,
    cacheMaxEntries: 1_000,
    cacheMaxBytes: 32 * 1024 * 1024,
});

/** Defaults with `over` applied (only positive finite numbers are taken). */
export function rtDataOptions(over: Partial<RtDataOptions> | null | undefined): RtDataOptions {
    const out: Record<string, number> = { ...DEFAULT_RT_DATA_OPTIONS };
    for (const [key, value] of Object.entries(over ?? {})) {
        if (key in out && typeof value === 'number' && Number.isFinite(value) && value > 0) out[key] = value;
    }
    return out as unknown as RtDataOptions;
}
