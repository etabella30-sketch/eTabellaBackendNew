import { compactVerify, decodeProtectedHeader, KeyLike, ProtectedHeaderParameters } from 'jose';
import { isWithinEdgeLifetime } from './ceiling';
import { EdgeTokenClaims, isEdgeTokenClaims } from './claims';
import { EDGE_RENEWAL_CEILING_SEC, EDGE_TOKEN_ALG, EDGE_TOKEN_MAX_LENGTH, EDGE_TOKEN_TTL_SEC, EDGE_TOKEN_TYP, EDGE_UUID_RE } from './constants';
import { EdgeTokenError } from './errors';
import { EdgeKeyResolver } from './key-resolver';

/**
 * Offline verification of an edge token (spec §8.4 "Where the edge token works"; D22, D24, D28), shared by authapi
 * (`edge/refresh`, `edge/signout`), realtime-server (the edge-token branch of the RT auth middleware) and the venue box.
 */

/**
 * Is this token revoked? `sub` and `iat` let a verifier also honour per-user revocations ("every token of this user
 * issued up to T"), as `revocations{users, jtis}` carries them. A thrown error is a lookup failure: the caller must
 * refuse the request (fail closed), never treat it as "not revoked".
 */
export interface EdgeRevocationCheck {
    isRevoked(jti: string, sub: string, iat: number): boolean | Promise<boolean>;
}

export interface EdgeVerifyOptions {
    /** Clock, epoch ms. */
    nowMs: number;
    /** Accepted lateness on `exp`, seconds. Boxes use EDGE_BOX_CLOCK_SKEW_SEC; authapi and realtime-server use 0 (the default). */
    clockSkewSec?: number;
    /** Skip the `exp` check (sign-out of an expired token). */
    ignoreExpiry?: boolean;
    /** When given, the token must be for this box (`box_mismatch`). */
    nEdgeid?: string;
    /**
     * D22: when given (even null or empty), the case or cases the request reaches; each must be in the token's `cases`
     * claim (`case_not_allowed`). A request whose case could not be resolved passes null and is refused.
     */
    nCaseid?: string | readonly string[] | null;
    /** When given, a revoked token is refused (`token_revoked`). */
    revocation?: EdgeRevocationCheck | null;
    /**
     * Refuse (`token_invalid`) a token whose own claims break D28 (`exp - iat` > `maxTtlSec`) or D24 (`exp` >
     * `auth_time` + `ceilingSec`). Default true: realtime-server and the box never accept a token authapi would not
     * have issued. authapi turns it off: it applies D24 itself, answering `reauth_required` on renewal.
     */
    checkLifetime?: boolean;
    /** D28: longest accepted `exp - iat`; default 12 h. */
    maxTtlSec?: number;
    /** D24: latest accepted `exp` after `auth_time`; default 24 h. */
    ceilingSec?: number;
}

const invalid = () => new EdgeTokenError('token_invalid');

/** The protected header of a compact JWS with three segments, or a `token_invalid` refusal. */
export function edgeTokenHeader(token: unknown): ProtectedHeaderParameters {
    if (typeof token !== 'string' || !token || token.length > EDGE_TOKEN_MAX_LENGTH || token.split('.').length !== 3) throw invalid();
    try {
        return decodeProtectedHeader(token);
    } catch {
        throw invalid();
    }
}

/** Resolves the key for one pinned algorithm (an ES256 public key, or an HS256 secret). */
export type EdgeJwsKeyResolver = (kid: string | undefined) => KeyLike | Uint8Array | null | Promise<KeyLike | Uint8Array | null>;

/**
 * Checks the header (`alg` pinned, `typ`), resolves the key (by `kid`), verifies the signature and returns the parsed
 * payload. Every failure is `token_invalid`, except a resolver that throws: that is an infrastructure failure and
 * propagates as is. Shared by the edge-token (ES256) and box-token (HS256) verifiers.
 */
export async function verifiedJwsPayload(token: unknown, alg: string, typ: string, keyFor: EdgeJwsKeyResolver): Promise<unknown> {
    const header = edgeTokenHeader(token);
    if (header.alg !== alg || header.typ !== typ) throw invalid();
    const key = await keyFor(typeof header.kid === 'string' ? header.kid : undefined);
    if (!key) throw invalid();
    try {
        const { payload } = await compactVerify(token as string, key, { algorithms: [alg] });
        return JSON.parse(Buffer.from(payload).toString('utf8'));
    } catch {
        throw invalid();
    }
}

/** True when `nowMs` is at or past `exp` + skew. A clock that is not a number reads as expired (fail closed). */
export function isEdgeExpired(expSec: number, nowMs: number, clockSkewSec = 0): boolean {
    if (!Number.isFinite(nowMs)) return true;
    const skew = Number.isFinite(clockSkewSec) ? Math.max(0, clockSkewSec) : 0;
    return Math.floor(nowMs / 1000) >= expSec + skew;
}

/**
 * Verifies an edge token offline: ES256 only, `typ` edge+jwt, a known `kid`, issuer, audience = `edge:<edge>`, every
 * claim well formed, a life within 12 h and under the 24 h `auth_time` ceiling (unless `checkLifetime: false`), then
 * (as asked) the box, expiry, revocation and case scope, in that order. Throws `EdgeTokenError`: `token_invalid`,
 * `box_mismatch`, `token_expired`, `token_revoked` or `case_not_allowed`.
 *
 * Not done here: the one-active-token rule and renewal successors (authapi's store), and whether the box itself is
 * active with the case still assigned to it (realtime-server's lookup).
 */
export async function verifyEdgeToken(token: unknown, keyFor: EdgeKeyResolver, opts: EdgeVerifyOptions): Promise<EdgeTokenClaims> {
    const claims = await verifiedJwsPayload(token, EDGE_TOKEN_ALG, EDGE_TOKEN_TYP, keyFor);
    if (!isEdgeTokenClaims(claims)) throw invalid();
    if (opts.checkLifetime !== false
        && !isWithinEdgeLifetime(claims, { ttlSec: opts.maxTtlSec ?? EDGE_TOKEN_TTL_SEC, ceilingSec: opts.ceilingSec ?? EDGE_RENEWAL_CEILING_SEC })) {
        throw invalid();
    }
    if (opts.nEdgeid !== undefined && claims.edge !== String(opts.nEdgeid).toLowerCase()) throw new EdgeTokenError('box_mismatch');
    if (!opts.ignoreExpiry && isEdgeExpired(claims.exp, opts.nowMs, opts.clockSkewSec)) throw new EdgeTokenError('token_expired');
    if (opts.revocation && await opts.revocation.isRevoked(claims.jti, claims.sub, claims.iat)) throw new EdgeTokenError('token_revoked');
    if (opts.nCaseid !== undefined) assertEdgeTokenCovers(claims, opts.nCaseid);
    return claims;
}

/**
 * D22: true when every given case is in the token's `cases` claim. No case at all (null, '', []) or a malformed id is
 * never covered: a route that cannot name its case refuses edge tokens.
 */
export function edgeTokenCovers(claims: Pick<EdgeTokenClaims, 'cases'>, nCaseid: string | readonly string[] | null | undefined): boolean {
    const wanted = (Array.isArray(nCaseid) ? nCaseid : [nCaseid]) as unknown[];
    if (!wanted.length) return false;
    const scope = new Set((claims?.cases ?? []).map(id => String(id).toLowerCase()));
    return wanted.every(id => typeof id === 'string' && EDGE_UUID_RE.test(id.trim()) && scope.has(id.trim().toLowerCase()));
}

/** `edgeTokenCovers` or a `case_not_allowed` refusal. */
export function assertEdgeTokenCovers(claims: Pick<EdgeTokenClaims, 'cases'>, nCaseid: string | readonly string[] | null | undefined): void {
    if (!edgeTokenCovers(claims, nCaseid)) throw new EdgeTokenError('case_not_allowed');
}
