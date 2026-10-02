/**
 * Sign-in on the box (spec §8.4, D22, D24, D28, D33; DR5, DR7, DR10, DR11, DR22; build defaults O-9, O-10, O-13).
 *
 * Three ways in, one bearer header: every signed-in box call carries `Authorization: Bearer <token>`, where the
 * token is an etabella.net edge token (`online`), a box-signed room-code token (`room-code`) or a box-signed
 * operator token (`operator`). The FE keeps it in `localStorage` on the box origin (spec §8.4 step 5).
 * The box never serves a password form and never sees a password (D33).
 */

import type { EdgeIdentityKind, EdgePersonRef } from './common';

// ---------------------------------------------------------------------------------------------------------------
// Online sign-in: start (DR5) → etabella.net (password there) → /auth/callback (DR22) → authapi edge/token
// ---------------------------------------------------------------------------------------------------------------

/** The box page's random `state`: 16–128 URL-safe characters (same rule as authapi). */
export const EDGE_STATE_RE = /^[A-Za-z0-9._~-]{16,128}$/;
/** PKCE S256 challenge: base64url(sha256(verifier)), always 43 characters (RFC 7636 §4.2). */
export const EDGE_PKCE_CHALLENGE_RE = /^[A-Za-z0-9_-]{43}$/;
/** PKCE verifier: 43–128 unreserved characters (RFC 7636 §4.1). It never leaves the browser except to authapi. */
export const EDGE_PKCE_VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/;

/**
 * Query of the etabella.net authorize page the box builds (spec §8.4 step 1):
 * `<pkce.authorizeUrl>?edge=<nEdgeid>&state=<state>&cc=<challenge>&login_hint=<email>`.
 */
export interface EdgeAuthorizeQuery {
    readonly edge: string;
    readonly state: string;
    readonly cc: string;
    /** The email typed on the box login, prefilled on etabella.net (DR5). */
    readonly login_hint: string;
}

/**
 * `POST /edge/auth/sign-in/start` — no token. The FE has already checked the device can reach etabella.net (DR5)
 * and holds the PKCE verifier and `state` in sessionStorage; the box only validates, audits ("sign-in started")
 * and builds the authorize URL from its own identity, so no box id is ever taken from the browser.
 */
export interface EdgeSignInStartRequest {
    readonly email: string;
    readonly state: string;
    readonly codeChallenge: string;
    readonly codeChallengeMethod: 'S256';
}

export interface EdgeSignInStartResponse {
    readonly msg: 1;
    /** Where the FE navigates (top-level) next; built from `EdgeAuthorizeQuery`. */
    readonly authorizeUrl: string;
}

/** Errors of `POST /edge/auth/sign-in/start`. */
export type EdgeSignInStartError = 'invalid_request' | 'box_not_linked' | 'box_not_configured' | 'rate_limited';

/** Query the etabella.net page returns to on the box: `/auth/callback?code&state` or `/auth/callback?error&state`. */
export interface EdgeCallbackQuery {
    readonly code?: string;
    readonly state?: string;
    readonly error?: string;
}

/**
 * Error codes authapi's edge routes send (mirror of `EDGE_SIGNIN_ERRORS` in
 * apps/authapi/src/services/auth/edge-token.types.ts; contracts.spec.ts fails when the two drift).
 * `network` is client-side only: the token exchange never reached authapi.
 */
export const EDGE_CLOUD_SIGNIN_ERRORS = [
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
    'invalid_credentials',
    'token_invalid',
    'token_expired',
    'token_revoked',
    'reauth_required',
    'invalid_request',
    'edge_unavailable',
    'server_error',
] as const;
export type EdgeCloudSignInError = typeof EDGE_CLOUD_SIGNIN_ERRORS[number];

/**
 * The reason "Sign-in didn't finish" names (DR22): cancelled / internet dropped / link expired when known.
 * `no-access` and `other-account` are the two other reasons a person can act on; everything else is `unknown`
 * (the banner then gives no reason, only "Try again").
 */
export type EdgeSignInFailureReason = 'cancelled' | 'internet-dropped' | 'link-expired' | 'no-access' | 'other-account' | 'unknown';

export const EDGE_SIGNIN_FAILURE_REASON: Readonly<Record<EdgeCloudSignInError, EdgeSignInFailureReason>> = {
    cancelled: 'cancelled',
    network: 'internet-dropped',
    code_expired: 'link-expired',
    code_used: 'link-expired',
    code_invalid: 'link-expired',
    verifier_mismatch: 'link-expired',
    state_mismatch: 'link-expired',
    redirect_not_allowed: 'unknown',
    box_mismatch: 'unknown',
    origin_not_allowed: 'unknown',
    box_unknown: 'unknown',
    box_inactive: 'unknown',
    no_box_cases: 'no-access',
    user_inactive: 'no-access',
    login_required: 'unknown',
    account_mismatch: 'other-account',
    invalid_credentials: 'unknown',
    token_invalid: 'unknown',
    token_expired: 'unknown',
    token_revoked: 'unknown',
    reauth_required: 'unknown',
    invalid_request: 'unknown',
    edge_unavailable: 'unknown',
    server_error: 'unknown',
};

/** DR22 reason for a cloud error code (or anything else the callback query carried). */
export function edgeSignInFailureReason(error: string | null | undefined): EdgeSignInFailureReason {
    if (typeof error !== 'string') return 'unknown';
    return (EDGE_CLOUD_SIGNIN_ERRORS as readonly string[]).includes(error)
        ? EDGE_SIGNIN_FAILURE_REASON[error as EdgeCloudSignInError]
        : 'unknown';
}

/** Cloud call (authapi, not the box): `POST <pkce.tokenUrl>`, no cookies (`withCredentials:false`). */
export interface EdgeTokenExchangeRequest {
    readonly code: string;
    readonly verifier: string;
    readonly state: string;
}

/**
 * Cloud reply of `edge/token` and `edge/refresh` as the box page relies on it. Only `token` is required here:
 * expiry, `auth_time` and the case list are read from the token's claims (`EdgeTokenClaims`), so extra fields
 * authapi adds never break the box page.
 * Renewal: `POST <pkce.refreshUrl>` with `Authorization: Bearer <current edge token>`, no body, no cookies.
 */
export interface EdgeTokenResult {
    readonly msg: 1;
    readonly token: string;
}

/** Claims of an etabella.net edge token (mirror of authapi `EdgeTokenClaims`). Epoch seconds. */
export interface EdgeTokenClaims {
    readonly iss: string;
    readonly sub: string;
    readonly userId: string;
    /** `edge:<nEdgeid>` */
    readonly aud: string;
    readonly edge: string;
    /** D22: the box's cases ∩ the user's case teams. */
    readonly cases: readonly string[];
    readonly scope: 'rt';
    readonly jti: string;
    readonly iat: number;
    /** ≤ iat + 12 h (D28) and ≤ auth_time + 24 h (D24). */
    readonly exp: number;
    /** The etabella.net sign-in this token descends from; kept across renewals (D24). */
    readonly auth_time: number;
}

/** Claims of a box-signed token (room code or operator code). Never forwarded to the cloud (§8.4). Epoch seconds. */
export interface EdgeBoxTokenClaims {
    /** `box:<nEdgeid>` */
    readonly iss: string;
    /** `edge:<nEdgeid>` */
    readonly aud: string;
    readonly kind: 'room-code' | 'operator';
    /** room-code: the person's nUserid; operator: `operator:<YYYY-MM-DD>`. */
    readonly sub: string;
    readonly jti: string;
    readonly iat: number;
    readonly exp: number;
    /** room-code only: the one session the code opens. */
    readonly nSesid?: string;
    /** operator only: the box-local day the code is for. */
    readonly day?: string;
    /** nUserid of the case admin who issued the room code, or who minted the operator code. */
    readonly mintedBy: string;
}

// ---------------------------------------------------------------------------------------------------------------
// Renewal and expiry (DR11, D24, D28, build default O-13)
// ---------------------------------------------------------------------------------------------------------------

/** D28: one edge token lives at most 12 h. */
export const EDGE_TOKEN_TTL_MS = 12 * 3_600_000;
/** D24: no edge token expires later than auth_time + 24 h. */
export const EDGE_RENEWAL_CEILING_MS = 24 * 3_600_000;
/** O-13: online, a silent refresh runs from 2 h before expiry. */
export const EDGE_SILENT_REFRESH_LEAD_MS = 2 * 3_600_000;
/** O-13 / DR11: "Renew now" appears only if the silent refresh failed and under 60 min are left. */
export const EDGE_RENEW_NOW_LEAD_MS = 60 * 60_000;
/** DR11: offline, "Your sign-in ends at HH:MM. Get a room code from the operator before then." 30 min before. */
export const EDGE_OFFLINE_WARN_LEAD_MS = 30 * 60_000;
/** authapi never issues a token with less life than this under the ceiling. */
export const EDGE_MIN_TOKEN_LIFETIME_MS = 60_000;

/** When each DR11 step starts for one online token. Epoch ms. */
export interface EdgeRenewalPlan {
    readonly expiresAtMs: number;
    readonly authTimeMs: number;
    /** auth_time + 24 h: no renewal reaches past it; after it the person signs in on etabella.net again. */
    readonly ceilingAtMs: number;
    /** From here the FE refreshes silently while online (O-13). */
    readonly silentRefreshFromMs: number;
    /** From here, if the silent refresh failed, the quiet "Renew now" shows (DR11). */
    readonly renewNowFromMs: number;
    /** From here, while the internet is unavailable, the offline warning shows (DR11). */
    readonly offlineWarnFromMs: number;
    /** A renewal could still extend the sign-in (the ceiling is far enough past the current expiry). */
    readonly canRenew: boolean;
}

/** The renewal plan of a token with JWT `exp` and `auth_time` (epoch seconds). */
export function edgeRenewalPlan(expSec: number, authTimeSec: number): EdgeRenewalPlan {
    const expiresAtMs = expSec * 1000;
    const authTimeMs = authTimeSec * 1000;
    const ceilingAtMs = authTimeMs + EDGE_RENEWAL_CEILING_MS;
    return {
        expiresAtMs,
        authTimeMs,
        ceilingAtMs,
        silentRefreshFromMs: expiresAtMs - EDGE_SILENT_REFRESH_LEAD_MS,
        renewNowFromMs: expiresAtMs - EDGE_RENEW_NOW_LEAD_MS,
        offlineWarnFromMs: expiresAtMs - EDGE_OFFLINE_WARN_LEAD_MS,
        canRenew: ceilingAtMs - expiresAtMs >= EDGE_MIN_TOKEN_LIFETIME_MS,
    };
}

// ---------------------------------------------------------------------------------------------------------------
// Room codes and the operator code: shape, entry and lockout (D33, DR5, DR7, DR10, O-9, O-10)
// ---------------------------------------------------------------------------------------------------------------

/**
 * Code alphabet (Crockford base32: no I, L, O, U). Entry is forgiving: case-insensitive, spaces and dashes
 * ignored, O read as 0 and I / L read as 1 (`normalizeEdgeCode`).
 */
export const EDGE_CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** A room code is 6 characters (DR5), shown as `K7Q-4M2`. */
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_RE = /^[0-9A-HJKMNP-TV-Z]{6}$/;
/** An operator code is `OPR` + 6 characters, shown as `OPR-6Z3K-91` (DR7). */
export const OPERATOR_CODE_PREFIX = 'OPR';
export const OPERATOR_CODE_RE = /^OPR[0-9A-HJKMNP-TV-Z]{6}$/;
/** O-9: 5 wrong tries (per device cookie and per client IP) lock entry for 1 minute, with a countdown. */
export const EDGE_CODE_MAX_TRIES = 5;
export const EDGE_CODE_LOCK_SEC = 60;
/**
 * O-9 device binding: an httpOnly, Secure, SameSite=Strict, Path=/ cookie holding a random device id, set on the
 * box origin at the first redemption (Max-Age 7 days). A redeemed room code is bound to it: the same device may
 * re-enter, another device gets `code_used_elsewhere`.
 */
export const EDGE_DEVICE_COOKIE = 'etab_edge_device';

/** Uppercase, drop everything but letters and digits, read O as 0 and I / L as 1. */
export function normalizeEdgeCode(input: string): string {
    return String(input ?? '')
        .toUpperCase()
        .replace(/[^0-9A-Z]/g, '')
        .replace(/O/g, '0')
        .replace(/[IL]/g, '1');
}

/** True when `input` normalizes to a well-formed room code (6 alphabet characters). */
export function isRoomCodeShape(input: string): boolean {
    return ROOM_CODE_RE.test(normalizeEdgeCode(input));
}

/** `k7q4m2` → `K7Q-4M2` (as read out from the issuing card). Malformed input comes back normalized only. */
export function formatRoomCode(input: string): string {
    const code = normalizeEdgeCode(input);
    return ROOM_CODE_RE.test(code) ? `${code.slice(0, 3)}-${code.slice(3)}` : code;
}

/** `opr-6z3k-91` or `6Z3K91` → `OPR6Z3K91`. The `OPR` prefix is optional on entry. */
export function normalizeOperatorCode(input: string): string {
    const raw = String(input ?? '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    const body = raw.startsWith(OPERATOR_CODE_PREFIX) ? raw.slice(OPERATOR_CODE_PREFIX.length) : raw;
    return OPERATOR_CODE_PREFIX + normalizeEdgeCode(body);
}

/** `OPR6Z3K91` → `OPR-6Z3K-91`. Malformed input comes back normalized only. */
export function formatOperatorCode(input: string): string {
    const code = normalizeOperatorCode(input);
    return OPERATOR_CODE_RE.test(code) ? `${code.slice(0, 3)}-${code.slice(3, 7)}-${code.slice(7)}` : code;
}

/** A session one identity may open on this box, and why. */
export interface EdgeRoomGrant {
    readonly nSesid: string;
    readonly nCaseid: string;
    /** "Day 3 — Morning" */
    readonly sessionName: string;
    /** "Harlow v Mercer Logistics" */
    readonly caseName: string;
    readonly via: 'case-team' | 'room-code' | 'operator';
}

/** `POST /edge/auth/room-code` — no token; the device cookie is read and, on first redemption, set. */
export interface RoomCodeRedeemRequest {
    /** As typed or pasted; the box normalizes with `normalizeEdgeCode`. */
    readonly code: string;
}

/** 200: "Signed in as Daniel Okafor · Room access: Day 3 — Morning." with "Not you?" (DR5). */
export interface RoomCodeRedeemResponse {
    readonly msg: 1;
    readonly status: 'ok';
    /** Box-signed bearer token (`EdgeBoxTokenClaims`, kind `room-code`). */
    readonly token: string;
    readonly kind: 'room-code';
    readonly nUserid: string;
    readonly name: string;
    readonly room: EdgeRoomGrant;
    /** O-9: access lasts until the session ends, capped at redemption + 24 h; this is the cap. */
    readonly validUntilMs: number;
    readonly untilSessionEnds: true;
    /** Same device came back with the same code (DR10). */
    readonly reentry: boolean;
}

/**
 * Failures of room-code entry (wireframe frame 2):
 * `code_wrong` 400 {attemptsLeft} · `code_used_elsewhere` 409 {usedAtMs, deviceLabel} ·
 * `code_expired` 410 {sessionName, endedAtMs} · `code_revoked` 410 (revoked, or access ended by an admin) ·
 * `code_locked` 429 {retryAfterSec} · `invalid_request` 400 (not 6 alphabet characters) · `feature_disabled` 404
 * while `features.roomCodes` is off (the v1 default, DR23).
 * Never 401: a code failure must not look like an expired sign-in to the auth interceptor.
 */
export type RoomCodeRedeemError = 'code_wrong' | 'code_used_elsewhere' | 'code_expired' | 'code_revoked' | 'code_locked' | 'invalid_request' | 'feature_disabled';

/** `POST /edge/auth/operator-code` — no token (DR7). */
export interface OperatorCodeSignInRequest {
    /** As typed; the box normalizes with `normalizeOperatorCode`. */
    readonly code: string;
}

/** 200: Box settings open for today (wireframe frame 15). */
export interface OperatorCodeSignInResponse {
    readonly msg: 1;
    readonly status: 'ok';
    /** Box-signed bearer token (`EdgeBoxTokenClaims`, kind `operator`). */
    readonly token: string;
    readonly kind: 'operator';
    /** Display name for the avatar menu: "Operator". */
    readonly name: string;
    /** Box-local day the code is for (YYYY-MM-DD). */
    readonly day: string;
    /** End of that day in the box's time zone (23:59:59.999). */
    readonly validUntilMs: number;
    /** O-10: the case admin who minted the code; the session's authority is that admin's box cases. */
    readonly mintedBy: EdgePersonRef;
}

/**
 * Failures of operator-code entry ("same pattern as room codes"): `code_wrong` 400 {attemptsLeft} ·
 * `code_expired` 410 (another day's code) · `code_locked` 429 {retryAfterSec} · `invalid_request` 400 ·
 * `feature_disabled` 404 while `features.operatorCode` is off (the v1 default, DR23).
 * There is deliberately no "not issued" error: an unknown code is `code_wrong`.
 */
export type OperatorCodeSignInError = 'code_wrong' | 'code_expired' | 'code_locked' | 'invalid_request' | 'feature_disabled';

// ---------------------------------------------------------------------------------------------------------------
// Who am I, sign out
// ---------------------------------------------------------------------------------------------------------------

/** `GET /edge/auth/me` — any signed-in identity. Drives the avatar menu (DR11), chips and Box settings access. */
export interface EdgeMeResponse {
    readonly msg: 1;
    readonly kind: EdgeIdentityKind;
    /** Null for an operator-code session. */
    readonly nUserid: string | null;
    /** "Daniel Okafor"; "Operator" for an operator-code session. */
    readonly name: string;
    /** From the cached case-team roster; null when the box does not know it. */
    readonly email: string | null;
    /** "Room sign-in valid until HH:MM" (DR11): token expiry; room-code: the 24 h cap; operator: end of day. */
    readonly validUntilMs: number;
    /** room-code: access also ends when the session ends (O-9). */
    readonly untilSessionEnds: boolean;
    /** online only: when to refresh silently, show "Renew now", warn offline (O-13). */
    readonly renewal: EdgeRenewalPlan | null;
    /** O-11: case admin of at least one box case, or super-admin, or an operator-code session (that day). */
    readonly isBoxAdmin: boolean;
    readonly isSuperAdmin: boolean;
    /** Cases this identity may issue room codes for (case admin of that case; operator: the minting admin's). */
    readonly roomCodeCaseIds: readonly string[];
    /** Sessions this identity may join on the LAN socket (`join-room`), with the reason. */
    readonly rooms: readonly EdgeRoomGrant[];
    /** operator only. */
    readonly operator: { readonly day: string; readonly mintedBy: EdgePersonRef } | null;
    readonly nowMs: number;
}

/**
 * `POST /edge/auth/sign-out` — any signed-in identity, no body, replies `EdgeAck`. The box denylists the presented
 * token's `jti` until its expiry (so a copied token stops working on this box), closes that identity's LAN sockets
 * and audits. A room-code binding survives: the same device may re-enter with the same code while the session runs.
 * The FE then drops the token from localStorage.
 */
export type EdgeSignOutRequest = Record<string, never>;
