/**
 * The manifest itself: sound under manifestInvariants (the gate Phase 3 seeds against) and frozen, so no host can
 * patch a row at runtime and make the box table and the cloud allowlist disagree.
 */
import { ROUTE_MANIFEST } from './route-manifest';
import { manifestInvariants } from './route-manifest.invariants';

describe('libs/api-contracts ROUTE_MANIFEST', () => {
  it('satisfies every manifest invariant', () => {
    expect(manifestInvariants(ROUTE_MANIFEST)).toEqual([]);
  });

  it('is frozen', () => {
    expect(Object.isFrozen(ROUTE_MANIFEST)).toBe(true);
    expect(() => (ROUTE_MANIFEST as unknown[]).push({})).toThrow();
  });

  it('every row id is unique and non-empty', () => {
    const ids = ROUTE_MANIFEST.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id: string) => id.length > 0)).toBe(true);
  });
});
