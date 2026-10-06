/**
 * The RT data routes the box answers under the cloud service bases (spec §8.2 rows 4, 6, 7; §8.5; D32, DR9, DR19):
 * what the edge build's RT page reads and writes on `/realtimeapi` and `/coreapi`, and how the box answers each one.
 * Everything NOT in this table keeps answering `403 {useCloud:true}` (LanExceptionFilter), any method.
 *
 * Since Phase 3 of the shared-libraries plan (2026-10-06) the table is DERIVED from `ROUTE_MANIFEST`
 * (libs/api-contracts/src/route-manifest.ts): its `table` rows, in manifest order, as `RtRoute`s. The cloud's
 * edge-token allowlist derives from the same rows, so the two can no longer drift. Add or change a route there.
 *
 * Kinds:
 * - `local`: answered from the box's own state and kernel (works with the internet down), scope-checked by the
 *   principal's cases and sessions (DR19).
 * - `local-or-cloud`: one session's transcript; local while the kernel holds the session (live, ended-unsealed), else
 *   read from the cloud like `cloud-read` (a sealed session: the kernel dropped it, the cloud has every line), else
 *   the local "no data yet" answer.
 * - `cloud-read`: an allowlisted GET proxied to `BoxConfig.cloud.realtimeApiUrl` with the caller's edge token and a
 *   per-user read-through cache (short TTL; stale-if-offline with `X-Edge-Stale: <age s>`). Offline, or for a
 *   box-signed token that is never forwarded: the cached copy, else `offlineBody` (`X-Edge-Offline: 1` /
 *   `X-Edge-Reauth: 1`), or `503 offline` / `503 reauth` for a route without one.
 * - `cloud-write`: an allowlisted write (marks, issues; v1 marks need the internet, S-D6): proxied online with the
 *   caller's edge token; `503 {offline:true}` offline; `503 {reauth:true}` for box-signed tokens. Never cached; a
 *   successful write makes the caller's cached reads stale (kept only for the fallbacks).
 *
 * Matching is EXACT: the method, and the raw request path compared case-insensitively (Express on the cloud routes
 * case-insensitively too: the FE calls `fact/inserthighlights`, the cloud declares `insertHighlights`), one optional
 * trailing slash. A percent-escape, a backslash, `.`/`..` or an empty segment never matches (→ `use_cloud`). The
 * proxied path is `cloudPath` from this table, never the client's path.
 */
import { manifestTableRows, type RouteManifestRow } from '@app/api-contracts';

export type RtRouteMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type RtRouteKind = 'local' | 'local-or-cloud' | 'cloud-read' | 'cloud-write';

export interface RtRoute {
    /** Stable id (handlers, cache keys, logs). */
    readonly id: string;
    readonly method: RtRouteMethod;
    /** The box path as the edge build calls it (matched case-insensitively). */
    readonly path: string;
    readonly kind: RtRouteKind;
    /** `local-or-cloud`, `cloud-read`, `cloud-write`: the path under `cloud.realtimeApiUrl`, as the cloud declares it. */
    readonly cloudPath?: string;
    /**
     * `cloud-read`: the body an offline caller (no cached copy) or a box-signed token gets, as the FE mock answers it;
     * `null` = no safe empty answer (`503 offline` / `503 reauth`): the Full Fact editor must never open on an empty
     * read and save it back (mark-api.service.ts readFactSheetRows).
     */
    readonly offlineBody?: unknown;
    /** `local` routes that answer a fixed body (the FE mock's empty coreapi lists). */
    readonly localBody?: unknown;
    /** Why the box answers it this way (and where the FE calls it). */
    readonly note: string;
}

/**
 * One manifest row as the box's `RtRoute`: only the keys the table ever had, each present only when the row sets it
 * (so the derived table is exactly the hand-written one it replaced; rt-routes.spec.ts holds that snapshot). The box
 * never serves PATCH (route-manifest.spec.ts pins it), so the method cast is safe.
 */
export function rtRouteOf(row: RouteManifestRow): RtRoute {
    const route: { -readonly [K in keyof RtRoute]: RtRoute[K] } = { id: row.id, method: row.method as RtRouteMethod, path: row.path, kind: row.boxKind as RtRouteKind, note: row.note };
    if (row.cloudPath !== undefined) route.cloudPath = row.cloudPath;
    if (row.offlineBody !== undefined) route.offlineBody = row.offlineBody;
    if (row.localBody !== undefined) route.localBody = row.localBody;
    return Object.freeze(route);
}

/** One table, in the order of spec §8.2 (the manifest's order). Frozen. */
export const RT_ROUTES: readonly RtRoute[] = Object.freeze(manifestTableRows().map(rtRouteOf));

/** Paths are compared in lower case; a key is `METHOD path`. */
const BY_KEY: ReadonlyMap<string, RtRoute> = new Map(RT_ROUTES.map(r => [`${r.method} ${r.path.toLowerCase()}`, r]));

/** A raw request path the table may match: no escapes, backslashes, dot or empty segments, at most 512 characters. */
export function isPlainPath(rawPath: string): boolean {
    if (typeof rawPath !== 'string' || rawPath.length === 0 || rawPath.length > 512 || !rawPath.startsWith('/')) return false;
    if (/[%\\\0\s]/.test(rawPath)) return false;
    const segments = rawPath.slice(1).split('/');
    if (segments[segments.length - 1] === '') segments.pop(); // one trailing slash
    return segments.length > 0 && segments.every(s => s !== '' && s !== '.' && s !== '..');
}

/** The route of `method rawPath` (the path WITHOUT its query), or null. */
export function matchRtRoute(method: string, rawPath: string): RtRoute | null {
    if (typeof method !== 'string' || !isPlainPath(rawPath)) return null;
    const path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
    return BY_KEY.get(`${method.toUpperCase()} ${path.toLowerCase()}`) ?? null;
}

/** Every `METHOD path` key of the table (lower-case paths), for specs and diagnostics. */
export function rtRouteKeys(): string[] {
    return [...BY_KEY.keys()];
}
