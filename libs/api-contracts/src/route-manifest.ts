/**
 * ROUTE_MANIFEST: the one list behind the box RT table, the cloud edge-token allowlist and the FE drift check.
 *
 * EMPTY in Phase 1 on purpose: nothing derives from it yet, and an empty list cannot disagree with the four hand-kept
 * route lists that still own today's behaviour. Phase 3 seeds it from the 43 `RT_ROUTES` and the 34
 * `EDGE_TOKEN_ROUTES` and switches both derivations over in the same commit. The `/edge` rows will reference
 * apps/rt-edge/src/contracts/routes.ts, which stays the source for `/edge`.
 *
 * route-manifest.spec.ts runs manifestInvariants over it, so a seeded row that breaks R4 / R5 / R6 fails here first.
 */
import type { RouteManifestRow } from './route-manifest.types';

export const ROUTE_MANIFEST: readonly RouteManifestRow[] = Object.freeze([]);
