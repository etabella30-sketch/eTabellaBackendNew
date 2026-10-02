/**
 * AuthPort and AccessPort (tokens AUTH_PORT, ACCESS_PORT; module auth/): who is calling, what they may do, and the
 * room-code / operator-code flows (spec §8.4, §4.10; D22, D24, D28, D33; DR5, DR7, DR10, DR11; O-9, O-10, O-11, O-13;
 * CONTRACTS.md §2, §6, §8.1, §8.2).
 *
 * Token kinds (CONTRACTS.md §2.1), one header `Authorization: Bearer <token>` (socket: `auth: {token}`):
 * - `online`: etabella.net edge token, ES256, `typ:'edge+jwt'`, `iss:'etabella-authapi'`, `aud:'edge:<nEdgeid>'`
 *   (lower case), `scope:'rt'`, verified OFFLINE with `StatePort.jwks` (key chosen by `kid`; alg pinned to ES256).
 *   Its `cases` claim is intersected with the box's cases.
 * - `room-code` / `operator`: box-signed tokens (`EdgeBoxTokenClaims`), HS256 with
 *   `StatePort.identity.secret('box-token-signing')`, `iss:'box:<nEdgeid>'`, `aud:'edge:<nEdgeid>'`. Never
 *   forwarded to the cloud (`EdgePrincipal.forwardable === false`).
 *
 * Verification order and error codes of `authenticate` (all 401 except the two 503s; 401 ONLY means "your sign-in is
 * not valid", CONTRACTS.md §2.4):
 * 1. no identity → `box_not_configured` (503);
 * 2. missing / unparsable token, bad signature, wrong alg/typ/iss/aud, unknown kid → `unauthenticated`;
 *    an `online` token while `StatePort.jwks` is empty → `box_not_linked` (503; never signs anyone out);
 * 3. `exp` passed by more than 5 min (EDGE_BOX_CLOCK_SKEW) → `token_expired`; also a room-code token whose session
 *    has ended, and an operator token whose `day` is not today;
 * 4. jti denied (`StatePort.revocations.isJtiDenied`: sign-out, cloud list, ended room access) or the user's cut-off
 *    covers the token (`isRevokedByUserCutoff(iat, StatePort.revocations.userRevokedAtMs(sub))`; the cut-off is
 *    arrival + 5 min, `userRevocationCutoffMs`) → `token_revoked`;
 * 5. otherwise the principal, built from the claims AND the cached roster (names, admin flags, current case list).
 *
 * Code hashing (both ends live in this module, the state module stores opaque strings):
 * - room code: `codeHash = hex(HMAC-SHA256(identity.secret('room-code-hmac'), 'room:' + normalizeEdgeCode(code)))`;
 * - operator code: scrypt over `normalizeOperatorCode(code)` with the stored salt/N, constant-time compare;
 * - device binding: `deviceHash = hex(sha256(deviceCookie))`; the cookie value is 32 random bytes, base64url.
 */
import { EDGE_BOX_CLOCK_SKEW_SEC } from '@app/edge-token/constants';

import type {
    EdgeIdentityKind,
    EdgeMeResponse,
    EdgePersonRef,
    EdgeRoomGrant,
    EdgeSignInStartRequest,
    EdgeSignInStartResponse,
    IssueRoomCodesRequest,
    IssueRoomCodesResponse,
    OperatorCodeIssueResponse,
    OperatorCodeSignInRequest,
    OperatorCodeSignInResponse,
    OperatorCodeStatusResponse,
    ReissueRoomCodeRequest,
    ReissueRoomCodeResponse,
    RoomCodeListResponse,
    RoomCodePickerResponse,
    RoomCodeRedeemRequest,
    RoomCodeRedeemResponse,
    RoomCodeRowResponse,
} from '../contracts';
import { EDGE_DEVICE_COOKIE } from '../contracts';
import type { EdgeRequestContext, Reply } from './common';

/** Box clock skew tolerated on token expiry and added to user revocation cut-offs (spec §8.4: ±5 min). */
export const EDGE_BOX_CLOCK_SKEW_MS = EDGE_BOX_CLOCK_SKEW_SEC * 1000;

/** O-9: a redeemed room code's access is capped at redemption + 24 h (and ends with its session). */
export const ROOM_CODE_ACCESS_MAX_MS = 24 * 3_600_000;

/** Device cookie lifetime (CONTRACTS.md §2.3: Max-Age 7 days). */
export const EDGE_DEVICE_COOKIE_MAX_AGE_SEC = 7 * 24 * 3600;

/**
 * The verified caller. Every field comes from the verified token and the cached roster, never from the request.
 */
export interface EdgePrincipal {
    readonly kind: EdgeIdentityKind;
    /** nUserid; null for an operator-code session (the code is not a user). */
    readonly userId: string | null;
    /** "Daniel Okafor"; "Operator" for an operator session. */
    readonly name: string;
    /** From the roster; null when unknown or operator. */
    readonly email: string | null;
    /**
     * Cases this identity may OPEN (DR19), each assigned to the box:
     * online: token `cases` ∩ box cases (a super-admin: every box case);
     * room-code: exactly the code's case; operator: the minting admin's box cases where they are case admin.
     */
    readonly caseIds: readonly string[];
    /** Cases this identity may issue room codes for (case admin of that case; operator: the minting admin's). */
    readonly adminCaseIds: readonly string[];
    /** room-code only: the one session the code opens. */
    readonly sessionId?: string;
    /** O-11: case admin of ≥ 1 box case, or super-admin, or an operator session (that day). Never for room-code. */
    readonly isBoxAdmin: boolean;
    readonly isSuperAdmin: boolean;
    /**
     * Epoch ms until which the sign-in is valid ("Room sign-in valid until HH:MM", DR11): online = token `exp`;
     * room-code = redemption + 24 h (access also ends with the session, `untilSessionEnds`); operator = end of the
     * box-local day (23:59:59.999).
     */
    readonly validUntil: number;
    readonly untilSessionEnds: boolean;
    readonly jti: string;
    /** Token `iat`, epoch ms. */
    readonly issuedAt: number;
    /** online: `auth_time` in epoch ms (D24 renewal ceiling); null otherwise. */
    readonly authTime: number | null;
    /** room-code: the admin who issued it; operator: the admin who minted the code. Null for online. */
    readonly mintedBy: EdgePersonRef | null;
    /** operator only: the box-local day. */
    readonly operatorDay: string | null;
    /** room-code only: sha256 of the bound device cookie. */
    readonly deviceHash: string | null;
    /** True only for `online`: the raw token may be forwarded to the cloud on the allowlisted proxy routes. */
    readonly forwardable: boolean;
    /** The raw bearer token (forward it only when `forwardable`; never log it). */
    readonly token: string;
}

/** `Authorization: Bearer <token>` → token; anything else → null. Case-insensitive scheme, trims spaces. */
export function bearerToken(authorization: string | string[] | null | undefined): string | null {
    const header = Array.isArray(authorization) ? authorization[0] : authorization;
    if (typeof header !== 'string') return null;
    const m = /^\s*Bearer\s+([^\s]+)\s*$/i.exec(header);
    return m ? m[1] : null;
}

export interface AuthPort {
    /** Verify a bearer token (HTTP header or socket `auth.token`). Errors: see the file header (in that order). */
    authenticate(token: string | null | undefined, ctx: EdgeRequestContext): Promise<EdgePrincipal>;
    /**
     * The principal an OPEN LAN socket of an `online` sign-in holds now (CONTRACTS.md §9; D24, D28): its own token,
     * or a NEWER token of the same etabella.net sign-in (same user, same `auth_time`) that this box has verified since —
     * a silent renewal the device used here (preferred when it is valid) — rebuilt from the cached roster NOW (cases,
     * admin flags, box admin). Re-checked: revocation (jti denied, user cut-off) and the roster. Not re-checked: the
     * signature (verified at the handshake, the token string cannot change) and `exp` (D28: an open socket outlives
     * it; the D24 ceiling is enforced by the gateway's `lapsed`). Synchronous. Throws `token_revoked` when no token of
     * the sign-in is valid any more, `unauthenticated` for a principal that is not `online`.
     */
    reverifyOnline(principal: EdgePrincipal): EdgePrincipal;
    /** Throws `not_box_admin` unless `principal.isBoxAdmin`. */
    requireBoxAdmin(principal: EdgePrincipal): void;
    /**
     * `online-case-admin` routes (EDGE_ROUTES `auth`): throws `online_sign_in_required` for room-code / operator
     * principals, then `not_case_admin` unless super-admin or case admin of ≥ 1 box case.
     */
    requireOnlineCaseAdmin(principal: EdgePrincipal): void;
    /** May this principal see case `nCaseid` (dashboard, room-code list)? */
    canSeeCase(principal: EdgePrincipal, nCaseid: string): boolean;
    /**
     * May this principal `join-room` `S<nSesid>` / read that session's feed? Online and operator: the session's case
     * is in `caseIds` AND the person is on its roster (`StatePort.roster.forSession`) or admin of the case or
     * super-admin; room-code: only `sessionId`. False for unknown or purged sessions.
     */
    canOpenSession(principal: EdgePrincipal, nSesid: string): boolean;
    /** Sessions this principal may join, with the reason (`EdgeMeResponse.rooms`). */
    rooms(principal: EdgePrincipal): readonly EdgeRoomGrant[];
    /** `GET /edge/auth/me` data. */
    me(principal: EdgePrincipal, nowMs: number): Reply<EdgeMeResponse>;
    /**
     * `POST /edge/auth/sign-out`: deny the jti until its expiry + skew, publish `access-revoked {reason:'sign-out'}`
     * (the LAN closes that identity's sockets), audit. A room-code binding survives. Idempotent.
     */
    signOut(principal: EdgePrincipal, ctx: EdgeRequestContext): Promise<void>;
}

/** The `Set-Cookie` the LAN layer must send after a FIRST room-code redemption (CONTRACTS.md §2.3). */
export interface EdgeDeviceCookie {
    readonly name: typeof EDGE_DEVICE_COOKIE;
    /** 32 random bytes, base64url. */
    readonly value: string;
    readonly maxAgeSec: number;
    readonly httpOnly: true;
    readonly secure: true;
    readonly sameSite: 'strict';
    readonly path: '/';
}

/**
 * Sign-in starts, code redemption, and Box settings → Room codes / operator code. Lockout (O-9): 5 wrong tries per
 * device cookie AND per client IP → `code_locked {retryAfterSec}` for 60 s (in memory; attempts while locked do not
 * extend it). Every attempt and every write is audited WITHOUT the code value.
 */
export interface AccessPort {
    /**
     * `POST /edge/auth/sign-in/start` (no token): validate (`EDGE_STATE_RE`, `EDGE_PKCE_CHALLENGE_RE`, email shape,
     * method S256), audit (email hashed), build `authorizeUrl = BoxConfig.cloud.authorizeUrl + '?' +
     * EdgeAuthorizeQuery` with `edge` from the box identity. Errors: `invalid_request`, `box_not_configured` (no
     * identity), `box_not_linked` (identity not active), `rate_limited {retryAfterSec}` (more than 20 per minute per IP).
     */
    signInStart(req: EdgeSignInStartRequest, ctx: EdgeRequestContext): Reply<EdgeSignInStartResponse>;
    /**
     * `POST /edge/auth/room-code` (no token). Errors: `invalid_request` (not 6 alphabet characters after
     * normalizing), `code_locked {retryAfterSec}`, `code_wrong {attemptsLeft}` (unknown code), `code_revoked`
     * (revoked or access ended), `code_expired {sessionName, endedAtMs}` (its session ended), `code_used_elsewhere
     * {usedAtMs, deviceLabel}` (bound to another device). Success binds the code to the device (`deviceCookie` is
     * non-null only when the request had no cookie and a new one must be set), issues a box token and replies
     * `reentry: true` for the same device again.
     */
    redeemRoomCode(req: RoomCodeRedeemRequest, ctx: EdgeRequestContext): Promise<{ readonly reply: Reply<RoomCodeRedeemResponse>; readonly deviceCookie: EdgeDeviceCookie | null }>;
    /**
     * `POST /edge/auth/operator-code` (no token). Errors: `invalid_request`, `code_locked {retryAfterSec}`,
     * `code_wrong {attemptsLeft}` (no hash for today or a mismatch), `code_expired {sessionName:null, endedAtMs:null}`
     * (matches another stored day's hash). Success counts a use (`StatePort.operatorCodes.recordUse`).
     */
    operatorSignIn(req: OperatorCodeSignInRequest, ctx: EdgeRequestContext): Promise<Reply<OperatorCodeSignInResponse>>;

    /** `GET /edge/local/room-codes[?nSesid]` (box admin): rows of the cases the principal can see, newest first. */
    listRoomCodes(principal: EdgePrincipal, nSesid: string | null): Reply<RoomCodeListResponse>;
    /** `GET /edge/local/room-codes/picker` (box admin). */
    roomCodePicker(principal: EdgePrincipal): Reply<RoomCodePickerResponse>;
    /**
     * `POST /edge/local/room-codes` (box admin + case admin of the session's case). Request-level errors in order:
     * `invalid_request` (1–50 distinct userIds), `session_not_found`, `not_case_admin`, `session_ended`,
     * `operator_name_required` (operator principal without a 2–80 character `operatorName`). Per person:
     * `not_on_case_team` / `user_not_found` results. A person's earlier unused code is revoked (`replacedId`).
     */
    issueRoomCodes(principal: EdgePrincipal, req: IssueRoomCodesRequest, ctx: EdgeRequestContext): Reply<IssueRoomCodesResponse>;
    /** "Revoke unused code". Errors: `not_found`, `not_case_admin`, `code_already_used`. */
    revokeRoomCode(principal: EdgePrincipal, id: string, ctx: EdgeRequestContext): Reply<RoomCodeRowResponse>;
    /**
     * "End <name>'s room access": deny the bound token, publish `access-revoked {reason:'room-access-ended'}`.
     * Errors: `not_found`, `not_case_admin`, `code_not_used`.
     */
    endRoomAccess(principal: EdgePrincipal, id: string, ctx: EdgeRequestContext): Reply<RoomCodeRowResponse>;
    /** "Re-issue". Errors: `not_found`, `not_case_admin`, `session_ended`, `operator_name_required`. */
    reissueRoomCode(principal: EdgePrincipal, id: string, req: ReissueRoomCodeRequest, ctx: EdgeRequestContext): Reply<ReissueRoomCodeResponse>;

    /** `GET /edge/local/operator-code` (box admin): today's state, never the code. */
    operatorCodeStatus(principal: EdgePrincipal, nowMs: number): Reply<OperatorCodeStatusResponse>;
    /**
     * `POST /edge/local/operator-code/issue` (online case admin): `UplinkPort.relayOperatorCode`, audited.
     * Errors: `online_sign_in_required`, `not_case_admin`, `offline`, `cloud_refused`.
     */
    issueOperatorCode(principal: EdgePrincipal, ctx: EdgeRequestContext): Promise<Reply<OperatorCodeIssueResponse>>;
}
