import { decodeProtectedHeader } from 'jose';
import { EdgeBoxClaims, EdgeOperatorTokenClaims, EdgeRoomTokenClaims, EdgeTokenClaims } from './claims';
import { EDGE_BOX_CLOCK_SKEW_SEC, EDGE_BOX_TOKEN_TYP, EDGE_TOKEN_MAX_LENGTH, EDGE_TOKEN_TYP, EDGE_UUID_RE } from './constants';
import { EdgeTokenError } from './errors';
import { EdgeKeyResolver } from './key-resolver';
import { verifyEdgeBoxToken } from './box-token';
import { EdgeRevocationCheck, verifyEdgeToken } from './verify';

/**
 * The venue box's one bearer header (apps/rt-edge CONTRACTS.md §2.1): `Authorization: Bearer <token>` carries an
 * edge token (`online`), a room-code token or an operator token. `verifyEdgeBearer` tells them apart by the JWS `typ`
 * and verifies each with its own key and pinned algorithm only: cloud tokens ES256 with the cached cloud JWKS, box
 * tokens HS256 with the box's own secret.
 */

/** Which verifier a bearer token is for, read from its unverified header. */
export type EdgeBearerFamily = 'online' | 'box';

/**
 * Peeks at the JWS `typ` without verifying anything: `online` (edge+jwt), `box` (edge-box+jwt) or null. For routing
 * only, never for trust: the box proxy uses it to answer a box-signed token on a proxied cloud route with
 * `503 {reauth:true}` instead of forwarding it (spec §8.4); every decision about access needs `verifyEdgeBearer`.
 */
export function edgeBearerFamily(token: unknown): EdgeBearerFamily | null {
    if (typeof token !== 'string' || !token || token.length > EDGE_TOKEN_MAX_LENGTH || token.split('.').length !== 3) return null;
    try {
        const typ = decodeProtectedHeader(token).typ;
        return typ === EDGE_TOKEN_TYP ? 'online' : typ === EDGE_BOX_TOKEN_TYP ? 'box' : null;
    } catch {
        return null;
    }
}

/** A verified identity on the box (contract `EdgeIdentityKind`). */
export type EdgeIdentity =
    | { kind: 'online'; claims: EdgeTokenClaims }
    | { kind: 'room-code'; claims: EdgeRoomTokenClaims }
    | { kind: 'operator'; claims: EdgeOperatorTokenClaims };

export interface EdgeBearerVerifyOptions {
    /**
     * This box: required, a uuid. Every kind must be for this box (online `aud`/`edge`, box `iss`). There is no "any box"
     * mode here: a missing or malformed id (box identity not loaded yet) is a configuration error, never a pass.
     */
    nEdgeid: string;
    /** Clock, epoch ms. */
    nowMs: number;
    /** The cloud's edge-token keys (an `EdgeKeyCache` fed by `e.hello`). */
    cloudKeys: EdgeKeyResolver;
    /** The box's own room-code / operator signing secret (≥ 32 bytes). */
    boxSecret: Uint8Array;
    /** Accepted lateness on an online token's `exp` (default ±5 min, spec §8.4); box tokens use the box clock (0). */
    clockSkewSec?: number;
    /** Cloud revocations and the box's sign-out denylist (an `EdgeRevocationList`), applied to every kind. */
    revocation?: EdgeRevocationCheck | null;
    /** The box-local day, for operator tokens (`token_expired` on another day's). */
    today?: string;
}

/** This box's id, checked and lower-cased; anything but a uuid is a configuration error (plain `Error`, no id echoed). */
function thisBoxOrThrow(nEdgeid: unknown): string {
    if (typeof nEdgeid !== 'string' || !EDGE_UUID_RE.test(nEdgeid.trim())) {
        throw new Error('edge bearer: this box\'s nEdgeid must be a uuid (box identity not loaded)');
    }
    return nEdgeid.trim().toLowerCase();
}

/**
 * Verifies any bearer the box accepts and says who it is. An online token is checked against the cloud keys with the
 * box audience, ±5 min skew and the revocation list (D28: it then works offline for its remaining ≤ 12 h); a
 * box-signed token against the box's own secret. Case and session reach (roster, D22, DR10) is the caller's next step:
 * `edgeTokenCovers` for online claims, the room-code `nSesid`, the operator's `mintedBy` cases.
 * Throws `EdgeTokenError` (`token_invalid` for anything that is neither family). An `nEdgeid` that is not a uuid
 * (undefined, null, '', garbage: the box identity is not loaded) is a configuration error, a plain `Error` thrown
 * before the token is looked at, so the caller answers `box_not_configured` (503) and never signs anyone out; it is
 * never read as "any box" (`verifyEdgeToken` without `nEdgeid` would accept another venue's token).
 */
export async function verifyEdgeBearer(token: unknown, opts: EdgeBearerVerifyOptions): Promise<EdgeIdentity> {
    const nEdgeid = thisBoxOrThrow(opts?.nEdgeid);
    const family = edgeBearerFamily(token);
    if (family === 'online') {
        const claims = await verifyEdgeToken(token, opts.cloudKeys, {
            nowMs: opts.nowMs,
            nEdgeid,
            clockSkewSec: opts.clockSkewSec ?? EDGE_BOX_CLOCK_SKEW_SEC,
            revocation: opts.revocation,
        });
        return { kind: 'online', claims };
    }
    if (family === 'box') {
        const claims: EdgeBoxClaims = await verifyEdgeBoxToken(token, opts.boxSecret, {
            nEdgeid,
            nowMs: opts.nowMs,
            today: opts.today,
            revocation: opts.revocation,
        });
        return claims.kind === 'room-code' ? { kind: 'room-code', claims } : { kind: 'operator', claims };
    }
    throw new EdgeTokenError('token_invalid');
}
