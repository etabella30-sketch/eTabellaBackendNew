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
    /** Cloud calls in flight at once; one more is `429 rate_limited` (reads fall back to a cached copy first). */
    readonly maxInFlight: number;
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
