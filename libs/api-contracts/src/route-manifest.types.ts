/**
 * The route manifest row (shared-libraries plan, Phase 3 "one route contract"). One list will drive three things that
 * are hand-kept today and drift: the box RT table (`apps/rt-edge/src/lan/rt-data/rt-routes.ts` derives `RT_ROUTES`),
 * the cloud edge-token allowlist (`apps/realtime-server/src/middleware/realtime-edge-token.ts` derives
 * `EDGE_TOKEN_ROUTES`) and the FE drift check (`tools/ci/export-route-manifest.js` writes JSON for the FE).
 *
 * Types only: nothing here runs, so the FE export and the box read the same shape without a framework.
 * The rules between the fields are code, not comments: route-manifest.invariants.ts.
 */

/** The URL family a row is served under. `edge` rows stay owned by apps/rt-edge/src/contracts/routes.ts. */
export type RouteFamily = 'authapi' | 'coreapi' | 'realtimeapi' | 'edge';

export type RouteMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Which live deployment answers the row; `none` for routes only the box serves. */
export type LiveOwner = 'authapi' | 'coreapi' | 'realtime-server' | 'none';

/**
 * R6, exactly one owner per row on the box: an `/edge` controller, the RT data table (`RtDataMiddleware`), a mounted
 * shared controller (`LocalApiModule`), or nobody (`LanExceptionFilter` answers 403 `use_cloud`).
 */
export type BoxOwner = 'edge' | 'table' | 'controller' | 'use_cloud';

/** How the box answers a `table` or `controller` row: the four `RtRouteKind`s of rt-routes.ts, unchanged. */
export type BoxKind = 'local' | 'local-or-cloud' | 'cloud-read' | 'cloud-write';

/**
 * R4: an `actor` row takes every user id from the verified `Caller` and ignores `nUserid` / `nMasterid` in the body;
 * an `actor+target` row also carries a field that really names ANOTHER user, listed in `targetFields`.
 */
export type RouteIdentity = 'actor' | 'actor+target';

/** D7: which host's legacy error body a shared controller reproduces byte for byte while its feature is extracted. */
export type LegacyShape = 'coreapi' | 'realtime-server' | 'authapi';

export interface RouteManifestRow {
  /** Stable id (`marknav.all`, `core.myteamusers`): handlers, cache keys, logs and the G3 ownership spec key on it. */
  readonly id: string;
  readonly family: RouteFamily;
  readonly method: RouteMethod;
  /** The path as the FE calls it, with the family prefix (`/realtimeapi/marknav/all`). */
  readonly path: string;
  readonly liveOwner: LiveOwner;
  /** The path as the live app declares it, without the nginx prefix (`marknav/all`); nginx strips the prefix. */
  readonly livePath: string;
  readonly boxOwner: BoxOwner;
  /** Required on a `table` row (the table cannot answer without a kind); absent on `use_cloud`. */
  readonly boxKind?: BoxKind;
  /** Relay kinds (`local-or-cloud`, `cloud-read`, `cloud-write`): the path under `cloud.realtimeApiUrl`. */
  readonly cloudPath?: string;
  /**
   * `cloud-read`: the body an offline caller without a cached copy gets, as the FE mock answers it; `null` = no safe
   * empty answer, the box answers 503 `offline` / `reauth` instead. R5: every `teamScoped` row is `null` here.
   */
  readonly offlineBody?: unknown;
  /** `local` rows that answer a fixed body (the FE mock's empty coreapi lists). */
  readonly localBody?: unknown;
  /** R5: the row reads or writes team data. The box relays it and never answers it itself (its roster has no team). */
  readonly teamScoped: boolean;
  readonly identity: RouteIdentity;
  /** `actor+target` only: the DTO fields that name a target user. Never the actor's own id fields. */
  readonly targetFields?: readonly string[];
  readonly legacyShape?: LegacyShape;
  /**
   * `CaseScopeGuard` checks cloud-jwt callers only where this is set (edge callers are always checked, as today).
   * Each `true` is an approved behaviour change, because live routes trust the SP's membership check today.
   */
  readonly cloudCaseCheck?: boolean;
  /** Why the row is what it is, and where the FE calls it (carried into the box table's `note`). */
  readonly note: string;
}
