import { HttpException, HttpStatus } from '@nestjs/common';
import { EDGE_RENEWAL_CEILING_SEC, EDGE_TOKEN_TTL_SEC, EdgeTokenClaims } from '@app/edge-token';

/**
 * Venue edge box sign-in (RT local edge spec §8.4, ledger D22 / D24 / D28 / D33, design review DR5 /
 * DR11 / DR22): shared constants, claim shape, error codes and the injected provider contracts.
 *
 * An edge token ("room sign-in" in the UI) is an ES256 JWS that a venue box verifies offline with the
 * public keys realtime-server hands it in `e.hello` (`edgeTokenKeys`). It is never accepted where a
 * cloud token is (JwtMiddleware verifies HS256 with JWT_SECRET, so an ES256 token fails there).
 *
 * The token's shape and the rules every verifier shares (algorithm, `typ`, issuer, scope, audience, the 12 h life
 * (D28), the 24 h `auth_time` ceiling (D24), the boxes' clock skew, the revocation overlap and the claim type) live in
 * `@app/edge-token`, so realtime-server and the venue box verify exactly what authapi issues. They are re-exported
 * here unchanged for authapi's own code.
 */
export {
    EDGE_BOX_CLOCK_SKEW_SEC, EDGE_RENEWAL_CEILING_SEC, EDGE_REVOCATION_OVERLAP_MS, EDGE_TOKEN_ALG, EDGE_TOKEN_ISSUER, EDGE_TOKEN_SCOPE,
    EDGE_TOKEN_TTL_SEC, EDGE_TOKEN_TYP, EDGE_UUID_RE, edgeAudience,
} from '@app/edge-token';
export type { EdgeTokenClaims } from '@app/edge-token';

/** One-time authorization code: valid for 60 s, single use. */
export const EDGE_CODE_TTL_SEC = 60;
/** How long a used or expired code is remembered, so a replay reads `code_used` / `code_expired` instead of `code_invalid`. */
export const EDGE_CODE_RETAIN_SEC = 600;
/**
 * A request whose response was lost may be retried this long (venue networks drop responses): `edge/refresh` with the
 * renewed token, or `edge/token` with the same code and verifier, gets the token it was already issued (same claims and
 * `jti`, signed again) instead of `token_revoked` / `code_used`, while that token is still the active one.
 */
export const EDGE_RETRY_GRACE_SEC = 120;
/**
 * `edge/authorize` asks for a fresh etabella.net sign-in (`login_required`) when the caller's cloud sign-in is older
 * than this. 12 h keeps the first edge token's life a full 12 h under the 24 h ceiling (D24).
 */
export const EDGE_SIGNIN_MAX_AGE_SEC = 12 * 3600;
/** The box renews at least 2 h before expiry (spec §8.4 step 6); `refreshAfter` in a token result reflects it. */
export const EDGE_REFRESH_LEAD_SEC = 2 * 3600;
/** A token with less life than this under the ceiling is never issued; `reauth_required` is returned instead. */
export const EDGE_MIN_TOKEN_LIFETIME_SEC = 60;
/** Boxes live at `<cSlug>.<domain>` (spec §8.3); overridable with EDGE_BOX_DOMAIN for staging. */
export const EDGE_BOX_DOMAIN_DEFAULT = 'etabella-edge.net';
/** The box page the etabella.net authorize page returns to (spec §8.2). */
export const EDGE_CALLBACK_PATH = '/auth/callback';

/** PKCE S256 challenge: base64url(sha256(verifier)), always 43 characters (RFC 7636 §4.2). */
export const EDGE_PKCE_CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/;
/** PKCE verifier: 43-128 unreserved characters (RFC 7636 §4.1). */
export const EDGE_PKCE_VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/;
/** The box's random `state`: 16-128 URL-safe characters. */
export const EDGE_STATE_RE = /^[A-Za-z0-9._~-]{16,128}$/;
/** One-time code: 32 random bytes, base64url. */
export const EDGE_CODE_RE = /^[A-Za-z0-9_-]{43}$/;
/** RtEdgeNode.cSlug: one DNS label (opaque, at most 40 characters). */
export const EDGE_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/**
 * Why an edge sign-in or renewal did not finish (DR22). The box maps these to its words:
 * `cancelled` → "cancelled"; `code_expired` / `code_invalid` / `code_used` → "link expired"; `network` → "internet
 * dropped" (client-side only, the server never sends it); `login_required` / `reauth_required` / `token_*` → sign in on
 * etabella.net again. A 400 without `error` never reaches the box: the edge routes answer malformed bodies with
 * `invalid_request` too.
 */
export const EDGE_SIGNIN_ERRORS = [
    'cancelled',
    'network',
    'code_expired',
    'code_used',
    'code_invalid',
    'verifier_mismatch',
    'state_mismatch',
    'redirect_not_allowed',
    'box_mismatch',
    'origin_not_allowed',
    'box_unknown',
    'box_inactive',
    'no_box_cases',
    'user_inactive',
    'login_required',
    'account_mismatch',
    'token_invalid',
    'token_expired',
    'token_revoked',
    'reauth_required',
    'invalid_request',
    'edge_unavailable',
    'server_error',
] as const;
export type EdgeSignInError = typeof EDGE_SIGNIN_ERRORS[number];

/** HTTP status each error is sent with. `network` is client-side only. */
export const EDGE_ERROR_STATUS: Record<EdgeSignInError, number> = {
    cancelled: HttpStatus.BAD_REQUEST,
    network: HttpStatus.SERVICE_UNAVAILABLE,
    code_expired: HttpStatus.BAD_REQUEST,
    code_used: HttpStatus.BAD_REQUEST,
    code_invalid: HttpStatus.BAD_REQUEST,
    verifier_mismatch: HttpStatus.BAD_REQUEST,
    state_mismatch: HttpStatus.BAD_REQUEST,
    redirect_not_allowed: HttpStatus.BAD_REQUEST,
    box_mismatch: HttpStatus.BAD_REQUEST,
    origin_not_allowed: HttpStatus.FORBIDDEN,
    box_unknown: HttpStatus.NOT_FOUND,
    box_inactive: HttpStatus.FORBIDDEN,
    no_box_cases: HttpStatus.FORBIDDEN,
    user_inactive: HttpStatus.FORBIDDEN,
    login_required: HttpStatus.UNAUTHORIZED,
    account_mismatch: HttpStatus.CONFLICT,
    token_invalid: HttpStatus.UNAUTHORIZED,
    token_expired: HttpStatus.UNAUTHORIZED,
    token_revoked: HttpStatus.UNAUTHORIZED,
    reauth_required: HttpStatus.UNAUTHORIZED,
    invalid_request: HttpStatus.BAD_REQUEST,
    edge_unavailable: HttpStatus.SERVICE_UNAVAILABLE,
    server_error: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** Extra fields an error body may carry. */
export interface EdgeErrorExtra {
    /** Where the etabella.net page sends the browser so the box can say why sign-in didn't finish (DR22). */
    redirect?: string;
    /** `login_required`: the oldest cloud sign-in `edge/authorize` accepts, in seconds. */
    maxAgeSec?: number;
    /** `account_mismatch`: the account signed in on etabella.net (shown only to that signed-in user). */
    signedInAs?: string;
}

/** Error body of every edge route: `{msg:-1, error, message, redirect?, maxAgeSec?, signedInAs?}`. */
export interface EdgeErrorBody extends EdgeErrorExtra {
    msg: -1;
    error: EdgeSignInError;
    message: string;
}

/** An edge sign-in failure with its DR22 code; Nest sends `getResponse()` as the body. */
export class EdgeAuthError extends HttpException {
    constructor(readonly code: EdgeSignInError, message: string, readonly extra: EdgeErrorExtra = {}) {
        super({ msg: -1, error: code, message, ...extra } as EdgeErrorBody, EDGE_ERROR_STATUS[code]);
    }
}

/** A registered box as the registry knows it (RtEdgeNode + its RtEdgeCase rows). */
export interface EdgeBoxRecord {
    nEdgeid: string;
    /** Opaque DNS label: the box lives at `https://<cSlug>.<EDGE_BOX_DOMAIN>`. */
    cSlug: string;
    /** P code issued, C key presented, A active, Q quarantined, X revoked. Only 'A' may sign people in. */
    cStatus: string;
    /** The box's assigned cases (RtEdgeCase). */
    caseIds: string[];
}

/**
 * Box lookup; the redirect-URI allowlist is derived from the slug it returns. Null = no such box; a lookup failure
 * throws (the routes then answer `server_error`, never "unknown box").
 */
export interface EdgeBoxRegistry {
    getBox(nEdgeid: string): Promise<EdgeBoxRecord | null>;
}

export interface EdgeUserRecord {
    nUserid: string;
    cEmail: string | null;
    /** UserMaster.cStatus = 'A'. */
    bActive: boolean;
}

/** User status and case-team membership. A lookup failure throws (never reads as "no cases"). */
export interface EdgeUserDirectory {
    getUser(nUserid: string): Promise<EdgeUserRecord | null>;
    /** The subset of `caseIds` the user may open: on the case team, or assigned to one of the case's sessions. */
    memberCaseIds(nUserid: string, caseIds: string[]): Promise<string[]>;
}

/** The etabella.net sign-in behind an `edge/authorize` call. */
export interface EdgeCloudSessionInfo {
    nUserid: string;
    /** When the user signed in on etabella.net (the cloud token's `iat`), epoch seconds. Becomes `auth_time`. */
    authTime: number;
}

/**
 * Resolves the caller's cloud token (the etabella.net `access_token` cookie or Bearer header) to its signed-in user.
 * Null for a missing, invalid, expired or signed-out token (same rules as JwtMiddleware and `auth/validate`).
 */
export interface EdgeCloudSession {
    resolve(cloudToken: string | null | undefined): Promise<EdgeCloudSessionInfo | null>;
}

/** `edge/authorize` request (the etabella.net `/auth/edge` page, with the user's cloud token). */
export interface EdgeAuthorizeInput {
    nEdgeid: string;
    /** PKCE S256 code challenge. */
    cc: string;
    /** Only 'S256'; 'plain' is refused. Optional, S256 is assumed. */
    cc_method?: string;
    /** The box's random state, echoed on the redirect. */
    state: string;
    /** Optional; when given it must be exactly the box's registered callback, and `edge/token` must repeat it. */
    redirect_uri?: string;
    /** The email typed on the box (DR5); a different signed-in account answers `account_mismatch`. */
    login_hint?: string;
}

/** `edge/authorize` success: the etabella.net page navigates to `redirect`. */
export interface EdgeAuthorizeResult {
    msg: 1;
    nEdgeid: string;
    /** One-time code (also inside `redirect`): 60 s, single use, bound to user, box and challenge. */
    code: string;
    state: string;
    /** `https://<cSlug>.<box domain>/auth/callback?code=…&state=…`, derived from the registry, never from the request. */
    redirect: string;
    /** Code expiry, epoch ms. */
    expiresAt: number;
    expiresIn: number;
}

/** `edge/cancel` request: the user gave up on etabella.net (DR22 "cancelled"). */
export interface EdgeCancelInput {
    nEdgeid: string;
    state: string;
}

/** Where the etabella.net page sends the browser back to the box. */
export interface EdgeRedirectResult {
    msg: 1;
    redirect: string;
}

/** `edge/token` request (the box's `/auth/callback` page). */
export interface EdgeTokenInput {
    code: string;
    /** PKCE code verifier. */
    verifier: string;
    /** Optional; when given it must equal the authorize `state` (`state_mismatch`). */
    state?: string;
    /** Optional; when given it must be the box the code was issued for (`box_mismatch`). */
    nEdgeid?: string;
    /** Required when authorize named one (RFC 6749 §4.1.3); must then be identical. */
    redirect_uri?: string;
}

/** `edge/refresh` / `edge/signout` request body; the edge token itself rides in `Authorization: Bearer`. */
export interface EdgeRefreshInput {
    /** Optional; when given it must be the token's box (`box_mismatch`). */
    nEdgeid?: string;
}

/**
 * A signed edge token and what the box needs to show and renew it (DR11 "Room sign-in valid until HH:MM").
 * Times are epoch milliseconds.
 */
export interface EdgeTokenResult {
    msg: 1;
    /** The ES256 JWS. */
    token: string;
    tokenType: 'Bearer';
    nEdgeid: string;
    userId: string;
    /** D22 case scope, as in the token's `cases` claim. */
    cases: string[];
    jti: string;
    issuedAt: number;
    /** The token's `exp`: "Room sign-in valid until HH:MM" (DR11). */
    expiresAt: number;
    /** Seconds until `expiresAt`. */
    expiresIn: number;
    /** The etabella.net sign-in (`auth_time`), preserved across renewals (D24). */
    authTime: number;
    /** `authTime` + 24 h: no renewal ever expires later (D24); past it the user signs in on etabella.net again. */
    renewableUntil: number;
    /** When the box should call `edge/refresh`: 2 h before expiry (spec §8.4 step 6), never before `issuedAt`. */
    refreshAfter: number;
    /** False when `expiresAt` already equals `renewableUntil`: a refresh cannot extend it, only a new sign-in can. */
    canRenew: boolean;
}

/** Revoked token ids for the box revocation list (`revocations{jtis, since}` in `e.hello` and the 60 s pull). */
export interface EdgeRevocations {
    jtis: string[];
    /** Pass back as `sinceMs` on the next pull (it overlaps the read by EDGE_REVOCATION_OVERLAP_MS). */
    since: number;
}

/** What `edge/authorize` binds a one-time code to. Times are epoch milliseconds except `authTime`. */
export interface EdgeCodeGrant {
    nUserid: string;
    nEdgeid: string;
    /** PKCE S256 challenge. */
    cc: string;
    state: string;
    /** The box callback the code was issued for (always the server-derived one). */
    redirectUri: string;
    /** True when the authorize request named `redirectUri`; the token request must then repeat it (RFC 6749 §4.1.3). */
    redirectUriGiven: boolean;
    /** The etabella.net sign-in time, epoch seconds; becomes `auth_time`. */
    authTime: number;
    issuedAt: number;
    expiresAt: number;
}

/**
 * The claims of a token as issued, and when (epoch ms). Kept for EDGE_RETRY_GRACE_SEC so a retried request is answered
 * with the same token, signed again; the signed token itself is never stored.
 */
export interface EdgeIssuedClaims {
    claims: EdgeTokenClaims;
    at: number;
}

/**
 * Result of taking a code: the first taker gets the grant, every later one a tombstone (with the token the code was
 * redeemed for, once it was).
 */
export type EdgeCodeTake =
    | { status: 'ok'; grant: EdgeCodeGrant }
    | { status: 'used'; grant: EdgeCodeGrant; jti?: string; issued?: EdgeIssuedClaims }
    | { status: 'unknown' };

/** A revoked token id as the box revocation list carries it. */
export interface EdgeRevokedJti {
    jti: string;
    /** When it was revoked, epoch ms. */
    at: number;
}

/**
 * Shared state for codes, the one active token per (user, box), and revocations. Must be shared by every authapi
 * instance and readable by realtime-server for `revocations{jtis}` (the Redis store is).
 */
export interface EdgeTokenStore {
    /** Stores a fresh code under the hash of its value. */
    saveCode(codeHash: string, grant: EdgeCodeGrant, retainSec: number): Promise<void>;
    /** Atomic: exactly one caller ever gets `ok` for a code; the record then becomes a `used` tombstone. */
    takeCode(codeHash: string, retainSec: number): Promise<EdgeCodeTake>;
    /**
     * Records on the tombstone the token a code was redeemed for, so a retry within the grace gets it again and a later
     * replay can revoke it.
     */
    markCodeRedeemed(codeHash: string, grant: EdgeCodeGrant, issued: EdgeIssuedClaims, retainSec: number): Promise<void>;
    getActiveJti(nUserid: string, nEdgeid: string): Promise<string | null>;
    /**
     * Makes `next` the active token of (user, box). With `expected` non-null it is a compare-and-set that fails when
     * the active token is not `expected`. Returns the token that was active before.
     */
    swapActiveJti(nUserid: string, nEdgeid: string, expected: string | null, next: string, ttlSec: number): Promise<{ ok: boolean; previous: string | null }>;
    /**
     * A renewal: the compare-and-set of `swapActiveJti` from `expected` to `next`, recording atomically with it
     * `successor` (the claims of `next`) under `expected` for `graceSec`, so a retry with `expected` gets that successor.
     */
    rotateActiveJti(
        nUserid: string, nEdgeid: string, expected: string, next: string, ttlSec: number, successor: EdgeIssuedClaims, graceSec: number,
    ): Promise<{ ok: boolean; previous: string | null }>;
    /** The successor recorded by `rotateActiveJti` for `jti` while its grace lasts, or null. */
    getSuccessor(jti: string): Promise<EdgeIssuedClaims | null>;
    /** Clears (user, box)'s active token when it is `jti`. */
    clearActiveJti(nUserid: string, nEdgeid: string, jti: string): Promise<void>;
    /** Revokes a token id until `ttlSec` from now (its remaining life). */
    revokeJti(jti: string, ttlSec: number, atMs: number): Promise<void>;
    isRevoked(jti: string): Promise<boolean>;
    /** Revocations at or after `sinceMs`, oldest first. */
    revokedSince(sinceMs: number): Promise<EdgeRevokedJti[]>;
}

/** Tunables; the defaults are the ledger's values. Tests override `now`. */
export interface EdgeTokenOptions {
    /** Clock, epoch milliseconds. */
    now: () => number;
    tokenTtlSec: number;
    ceilingSec: number;
    codeTtlSec: number;
    codeRetainSec: number;
    signInMaxAgeSec: number;
    refreshLeadSec: number;
    minLifetimeSec: number;
    retryGraceSec: number;
    boxDomain: string;
}

export const EDGE_TOKEN_DEFAULTS: EdgeTokenOptions = {
    now: () => Date.now(),
    tokenTtlSec: EDGE_TOKEN_TTL_SEC,
    ceilingSec: EDGE_RENEWAL_CEILING_SEC,
    codeTtlSec: EDGE_CODE_TTL_SEC,
    codeRetainSec: EDGE_CODE_RETAIN_SEC,
    signInMaxAgeSec: EDGE_SIGNIN_MAX_AGE_SEC,
    refreshLeadSec: EDGE_REFRESH_LEAD_SEC,
    minLifetimeSec: EDGE_MIN_TOKEN_LIFETIME_SEC,
    retryGraceSec: EDGE_RETRY_GRACE_SEC,
    boxDomain: EDGE_BOX_DOMAIN_DEFAULT,
};

/** DI tokens. */
export const EDGE_TOKEN_KEY_CONFIG = 'EDGE_TOKEN_KEY_CONFIG';
export const EDGE_BOX_REGISTRY = 'EDGE_BOX_REGISTRY';
export const EDGE_USER_DIRECTORY = 'EDGE_USER_DIRECTORY';
export const EDGE_TOKEN_STORE = 'EDGE_TOKEN_STORE';
export const EDGE_TOKEN_OPTIONS = 'EDGE_TOKEN_OPTIONS';
export const EDGE_CLOUD_SESSION = 'EDGE_CLOUD_SESSION';
