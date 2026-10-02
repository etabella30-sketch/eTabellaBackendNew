import { EDGE_RENEWAL_CEILING_SEC, EDGE_TOKEN_TTL_SEC } from './constants';

/**
 * The 24 h `auth_time` ceiling (D24) and the 12 h token life (D28), as plain arithmetic on epoch seconds, so authapi
 * (issuing, renewing), realtime-server and the box (verifying, "Room sign-in valid until HH:MM") compute them alike.
 */

/** Lifetime bounds; the defaults are the ledger's. */
export interface EdgeLifetimeLimits {
    /** D28: longest life of one token (`exp - iat`), seconds. */
    ttlSec?: number;
    /** D24: no token expires later than `auth_time` + this, seconds. */
    ceilingSec?: number;
}

/** `auth_time` + 24 h: the latest `exp` any token descending from that etabella.net sign-in may carry (D24). */
export function edgeCeilingSec(authTimeSec: number, ceilingSec: number = EDGE_RENEWAL_CEILING_SEC): number {
    return authTimeSec + ceilingSec;
}

/** `exp` of a token issued now: min(now + 12 h, auth_time + 24 h). */
export function edgeTokenExpirySec(nowSec: number, authTimeSec: number, limits: EdgeLifetimeLimits = {}): number {
    return Math.min(nowSec + (limits.ttlSec ?? EDGE_TOKEN_TTL_SEC), edgeCeilingSec(authTimeSec, limits.ceilingSec));
}

/** True while a renewal could still give a later `exp` (the token does not already end at the ceiling). */
export function edgeCanRenew(c: { exp: number; auth_time: number }, ceilingSec: number = EDGE_RENEWAL_CEILING_SEC): boolean {
    return c.exp < edgeCeilingSec(c.auth_time, ceilingSec);
}

/**
 * True when no renewal may be issued for this token: its etabella.net sign-in is more than 24 h old, or the token
 * already ends at the ceiling. The user then signs in on etabella.net again (authapi answers `reauth_required`).
 */
export function isPastEdgeRenewalCeiling(c: { exp: number; auth_time: number }, nowSec: number, ceilingSec: number = EDGE_RENEWAL_CEILING_SEC): boolean {
    return nowSec - c.auth_time > ceilingSec || !edgeCanRenew(c, ceilingSec);
}

/**
 * True when the token's own claims respect both bounds: `exp - iat` ≤ 12 h (D28) and `exp` ≤ `auth_time` + 24 h (D24).
 * authapi never issues anything else; verifiers refuse anything else as `token_invalid`.
 */
export function isWithinEdgeLifetime(c: { iat: number; exp: number; auth_time: number }, limits: EdgeLifetimeLimits = {}): boolean {
    return c.exp - c.iat <= (limits.ttlSec ?? EDGE_TOKEN_TTL_SEC) && c.exp <= edgeCeilingSec(c.auth_time, limits.ceilingSec);
}
