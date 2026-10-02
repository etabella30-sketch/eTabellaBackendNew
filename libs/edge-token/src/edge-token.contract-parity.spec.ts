/**
 * The library's claim types and constants against the two places that restate them: the venue box contract
 * (apps/rt-edge/src/contracts, mirrored by the FE) and authapi's re-exports. Compile-time checks fail the suite
 * through ts-jest's type check; the runtime checks catch value drift.
 */
import * as authapiKeys from '../../../apps/authapi/src/services/auth/edge-token.keys';
import * as authapiService from '../../../apps/authapi/src/services/auth/edge-token.service';
import * as authapiStore from '../../../apps/authapi/src/services/auth/edge-token.store';
import * as authapiTypes from '../../../apps/authapi/src/services/auth/edge-token.types';
import type * as boxAuth from '../../../apps/rt-edge/src/contracts/auth';
import { EDGE_RENEWAL_CEILING_MS, EDGE_TOKEN_TTL_MS } from '../../../apps/rt-edge/src/contracts/auth';
import type { EdgeIdentityKind } from '../../../apps/rt-edge/src/contracts/common';
import * as lib from './index';

/** Exact type equality (optional / readonly-insensitive only where `Loose` strips it). */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
/** The contract's types are readonly throughout; compare their shapes without it. */
type Loose<T> = { -readonly [K in keyof T]: T[K] extends readonly (infer U)[] ? U[] : T[K] };

const onlineClaimsMatch: Equal<Loose<boxAuth.EdgeTokenClaims>, lib.EdgeTokenClaims> = true;
const boxClaimsMatch: Equal<Loose<boxAuth.EdgeBoxTokenClaims>, lib.EdgeBoxTokenClaims> = true;
const kindsMatch: Equal<lib.EdgeIdentity['kind'], EdgeIdentityKind> = true;
const boxKindsMatch: Equal<lib.EdgeBoxTokenKind, Exclude<EdgeIdentityKind, 'online'>> = true;
const authapiClaimsAreTheLibrarys: Equal<authapiTypes.EdgeTokenClaims, lib.EdgeTokenClaims> = true;
// Controls: the check does tell a missing claim, an optional claim and a widened claim apart.
const missingClaimDiffers: Equal<Loose<boxAuth.EdgeTokenClaims>, Omit<lib.EdgeTokenClaims, 'auth_time'>> = false;
const optionalClaimDiffers: Equal<Loose<boxAuth.EdgeBoxTokenClaims>, Partial<lib.EdgeBoxTokenClaims>> = false;
const widenedClaimDiffers: Equal<Loose<boxAuth.EdgeBoxTokenClaims>, Omit<lib.EdgeBoxTokenClaims, 'kind'> & { kind: string }> = false;

describe('edge-token parity', () => {
    it('claim types match the venue box contract (compile-time)', () => {
        expect([onlineClaimsMatch, boxClaimsMatch, kindsMatch, boxKindsMatch, authapiClaimsAreTheLibrarys]).toEqual([true, true, true, true, true]);
        expect([missingClaimDiffers, optionalClaimDiffers, widenedClaimDiffers]).toEqual([false, false, false]);
    });

    it('box-contract lifetimes are the library\'s', () => {
        expect(EDGE_TOKEN_TTL_MS).toBe(lib.EDGE_TOKEN_TTL_SEC * 1000);
        expect(EDGE_RENEWAL_CEILING_MS).toBe(lib.EDGE_RENEWAL_CEILING_SEC * 1000);
    });

    it('authapi re-exports the library\'s bindings, not copies', () => {
        expect(authapiTypes.EDGE_TOKEN_ALG).toBe(lib.EDGE_TOKEN_ALG);
        expect(authapiTypes.EDGE_TOKEN_TYP).toBe(lib.EDGE_TOKEN_TYP);
        expect(authapiTypes.EDGE_TOKEN_ISSUER).toBe(lib.EDGE_TOKEN_ISSUER);
        expect(authapiTypes.EDGE_TOKEN_SCOPE).toBe(lib.EDGE_TOKEN_SCOPE);
        expect(authapiTypes.EDGE_TOKEN_TTL_SEC).toBe(lib.EDGE_TOKEN_TTL_SEC);
        expect(authapiTypes.EDGE_RENEWAL_CEILING_SEC).toBe(lib.EDGE_RENEWAL_CEILING_SEC);
        expect(authapiTypes.EDGE_BOX_CLOCK_SKEW_SEC).toBe(lib.EDGE_BOX_CLOCK_SKEW_SEC);
        expect(authapiTypes.EDGE_REVOCATION_OVERLAP_MS).toBe(lib.EDGE_REVOCATION_OVERLAP_MS);
        expect(authapiTypes.EDGE_UUID_RE).toBe(lib.EDGE_UUID_RE);
        expect(authapiTypes.edgeAudience).toBe(lib.edgeAudience);
        expect(authapiService.isEdgeTokenClaims).toBe(lib.isEdgeTokenClaims);
        expect(authapiService.edgeKeyResolverFromJwks).toBe(lib.edgeKeyResolverFromJwks);
        expect(authapiKeys.buildEdgeJwks).toBe(lib.buildEdgeJwks);
        expect(authapiKeys.parseEdgeJwkList).toBe(lib.parseEdgeJwkList);
        expect(authapiStore.EDGE_REVOKED_KEEP_MS).toBe(lib.EDGE_REVOKED_KEEP_MS);
        expect(authapiStore.edgeStoreKeys.revoked('j')).toBe(lib.EDGE_REVOCATION_REDIS_KEYS.jti('j'));
        expect(authapiStore.edgeStoreKeys.revokedIndex).toBe(lib.EDGE_REVOCATION_REDIS_KEYS.index);
    });

    it('authapi\'s verifyEdgeToken keeps its DR22 errors over the library\'s checks', async () => {
        const ring = await lib.EdgeSigningKeyRing.create({ signingKey: await lib.generateEdgeSigningKey('k') });
        const err = await authapiService.verifyEdgeToken('not.a.token', ring.resolver(), { nowMs: 0 }).then(() => null, e => e);
        expect(err).toBeInstanceOf(authapiTypes.EdgeAuthError);
        expect(err.getStatus()).toBe(401);
        expect(err.getResponse()).toEqual({ msg: -1, error: 'token_invalid', message: 'This room sign-in is not valid.' });
    });
});
