/**
 * The manifest row is a type, so its spec is a compile-time contract: the literal unions are exactly the ones the
 * plan names (a stray value would silently widen what Phase 3 may seed), and a row written the way rt-routes.ts
 * writes its rows type-checks. ts-jest type-checks the spec, so a drift fails the run, not only an editor.
 */
import type { BoxKind, BoxOwner, LegacyShape, LiveOwner, RouteFamily, RouteIdentity, RouteManifestRow, RouteMethod } from './route-manifest.types';

/** `true` only when A and B are the same type in both directions. */
type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

const familyIsExact: Equals<RouteFamily, 'authapi' | 'coreapi' | 'realtimeapi' | 'edge'> = true;
const methodIsExact: Equals<RouteMethod, 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = true;
const liveOwnerIsExact: Equals<LiveOwner, 'authapi' | 'coreapi' | 'realtime-server' | 'none'> = true;
const boxOwnerIsExact: Equals<BoxOwner, 'edge' | 'table' | 'controller' | 'use_cloud'> = true;
const boxKindIsExact: Equals<BoxKind, 'local' | 'local-or-cloud' | 'cloud-read' | 'cloud-write'> = true;
const identityIsExact: Equals<RouteIdentity, 'actor' | 'actor+target'> = true;
const legacyShapeIsExact: Equals<LegacyShape, 'coreapi' | 'realtime-server' | 'authapi'> = true;

/** Every key the plan lists for a row, and nothing else. */
const keysAreExact: Equals<
  keyof RouteManifestRow,
  | 'id' | 'family' | 'method' | 'path' | 'liveOwner' | 'livePath' | 'boxOwner' | 'boxKind' | 'cloudPath' | 'offlineBody'
  | 'localBody' | 'teamScoped' | 'identity' | 'targetFields' | 'legacyShape' | 'cloudCaseCheck' | 'note'
> = true;

/** The team-users row as Phase 3 will seed it from rt-routes.ts `core.myteamusers`. */
const teamUsersRow: RouteManifestRow = {
  id: 'core.myteamusers',
  family: 'coreapi',
  method: 'GET',
  path: '/coreapi/common/myteamusers',
  liveOwner: 'coreapi',
  livePath: 'common/myteamusers',
  boxOwner: 'table',
  boxKind: 'cloud-read',
  cloudPath: 'factsheet/teamusers',
  offlineBody: null,
  teamScoped: true,
  identity: 'actor',
  legacyShape: 'coreapi',
  note: 'Fact sharing recipients',
};

/** A `use_cloud` row needs only the required fields. */
const useCloudRow: RouteManifestRow = {
  id: 'core.bundles.list',
  family: 'coreapi',
  method: 'GET',
  path: '/coreapi/bundles/list',
  liveOwner: 'coreapi',
  livePath: 'bundles/list',
  boxOwner: 'use_cloud',
  teamScoped: false,
  identity: 'actor',
  note: 'bundle tree: never on the box',
};

describe('libs/api-contracts route-manifest.types', () => {
  it('pins the literal unions and the row keys to the plan', () => {
    expect([familyIsExact, methodIsExact, liveOwnerIsExact, boxOwnerIsExact, boxKindIsExact, identityIsExact, legacyShapeIsExact, keysAreExact])
      .toEqual([true, true, true, true, true, true, true, true]);
  });

  it('accepts a relay row and a use_cloud row written as rt-routes.ts writes them', () => {
    expect(teamUsersRow.teamScoped).toBe(true);
    expect(teamUsersRow.offlineBody).toBeNull();
    expect(useCloudRow.boxKind).toBeUndefined();
  });
});
