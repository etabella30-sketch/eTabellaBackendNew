/**
 * The cloud service bases the edge build points at the box's own origin (FE `environment.edge.ts`: `/realtimeapi`,
 * `/coreapi`, `/uploadapi`, …). On the box they are API paths, never app routes: the static server never answers
 * them with the SPA's index.html, and a request the box has no route for answers the contract's
 * `403 {msg:-1, error:'use_cloud', useCloud:true}` (spec §8.2 "Everything else … 403 {useCloud:true}"; CONTRACTS.md
 * §2.4), so the FE shows "Open on etabella.net" instead of a raw error and never signs anyone out.
 *
 * The only exceptions are the exact method + path pairs of rt-data/rt-routes.ts (`RT_ROUTES`): local RT reads, and the
 * allowlisted mark / issue reads and writes proxied with the caller's edge token. Nothing else is ever proxied: no
 * Eclipse password, reveal, upload, transcript production or admin call transits the box.
 */
import { EdgePortError } from '../ports';

/** Every API base of the edge build, plus `/authapi` (sign-in happens on etabella.net, never on the box). */
export const CLOUD_API_PREFIXES: readonly string[] = Object.freeze([
    '/realtimeapi',
    '/coreapi',
    '/authapi',
    '/uploadapi',
    '/indexapi',
    '/elasticsearch',
    '/presentation',
    '/export',
    '/download',
    '/downloadapi',
]);

/** `/realtimeapi`, `/realtimeapi/…` (any listed prefix as a whole segment); `/realtimeapix` is not. */
export function isCloudApiPath(pathname: string): boolean {
    if (typeof pathname !== 'string') return false;
    return CLOUD_API_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/** The refusal of a cloud route the box does not serve. */
export function useCloudError(): EdgePortError<'use_cloud'> {
    return new EdgePortError('use_cloud', 'this route is served by etabella.net only', { useCloud: true });
}
