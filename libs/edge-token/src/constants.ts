/**
 * Shared constants of edge tokens (RT local edge spec §8.4, §11; ledger D22 / D24 / D28 / D33; build defaults
 * O-9 / O-10 / O-11).
 *
 * Two token families exist and must never be confused:
 * - **Edge tokens** ("room sign-in", kind `online` on the box): ES256 JWS signed by authapi with `EDGE_TOKEN_KEY`,
 *   header `typ: edge+jwt`, `iss: etabella-authapi`, `aud: edge:<nEdgeid>`. Verified offline by the box with the
 *   JWKS from `e.hello` (`edgeTokenKeys`), and in the cloud by realtime-server (RT allowlist, the box's cases only).
 * - **Box tokens** (room-code and operator, kinds `room-code` / `operator`): HS256 JWS minted by the venue box with
 *   its box-local secret (apps/rt-edge `StatePort.identity.secret('box-token-signing')`, 32 random bytes that never
 *   leave the box), header `typ: edge-box+jwt`, `iss: box:<nEdgeid>`, `aud: edge:<nEdgeid>`. Only the box that minted
 *   one accepts it; they are never forwarded to the cloud (§8.4, proxied calls get `503 {reauth:true}`), so no one
 *   else ever needs to verify them and a shared-nothing HMAC key is enough.
 */

/** JWS algorithm of every edge token. Verifiers pin it. */
export const EDGE_TOKEN_ALG = 'ES256';
/** JWS `typ` header of an edge token, so it cannot be confused with any other JWT (RFC 8725 §3.11). */
export const EDGE_TOKEN_TYP = 'edge+jwt';
/** `iss` claim of every edge token. */
export const EDGE_TOKEN_ISSUER = 'etabella-authapi';
/** `scope` claim: RT routes only. */
export const EDGE_TOKEN_SCOPE = 'rt';

/** D28: one edge token lives at most 12 h ("room readers keep reading for up to 12 h from their last online sign-in"). */
export const EDGE_TOKEN_TTL_SEC = 12 * 3600;
/** D24: no edge token ever expires later than `auth_time` + 24 h; past that the user signs in on etabella.net again. */
export const EDGE_RENEWAL_CEILING_SEC = 24 * 3600;
/**
 * Boxes accept an edge token's `exp` with ±5 min of clock skew (spec §8.4, §10 #8). Revocations therefore stay listed
 * this much longer than the token they revoke.
 */
export const EDGE_BOX_CLOCK_SKEW_SEC = 5 * 60;

/** Longest token any verifier reads; anything longer is refused before parsing. */
export const EDGE_TOKEN_MAX_LENGTH = 8192;
/** Longest `jti` any verifier accepts. */
export const EDGE_JTI_MAX_LENGTH = 64;

export const EDGE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `aud` claim of a token for box `nEdgeid` (edge tokens and box tokens alike). */
export const edgeAudience = (nEdgeid: string): string => `edge:${String(nEdgeid).toLowerCase()}`;

// ------------------------------------------------------------------------------------------------ box-signed tokens

/** JWS `typ` header of a box-signed token (room code or operator code). Never `edge+jwt`, so neither family passes for the other. */
export const EDGE_BOX_TOKEN_TYP = 'edge-box+jwt';
/** JWS algorithm of every box-signed token. Verifiers pin it (an ES256 or `none` header is refused). */
export const EDGE_BOX_TOKEN_ALG = 'HS256';
/** Shortest box signing secret accepted: 256 bits, the HS256 hash size (RFC 7518 §3.2). */
export const EDGE_BOX_SECRET_MIN_BYTES = 32;

/** `iss` claim of a token minted by box `nEdgeid`. */
export const edgeBoxIssuer = (nEdgeid: string): string => `box:${String(nEdgeid).toLowerCase()}`;

/** The two box-signed token kinds (contract `EdgeIdentityKind` minus `online`). */
export const EDGE_BOX_TOKEN_KINDS = ['room-code', 'operator'] as const;
export type EdgeBoxTokenKind = typeof EDGE_BOX_TOKEN_KINDS[number];

/**
 * O-9: a room-code token gives that device that session until the session ends, capped at redemption + 24 h (D24).
 * Session end is the box's check at use time; this is the cap a token itself may never exceed.
 */
export const EDGE_ROOM_TOKEN_MAX_TTL_SEC = 24 * 3600;
/**
 * DR7 / O-10: an operator token lasts to the end of its box-local day. A calendar day is at most 25 h long (the
 * autumn daylight-saving change), so no operator token may claim more.
 */
export const EDGE_OPERATOR_TOKEN_MAX_TTL_SEC = 25 * 3600;
/** `sub` of an operator token: `operator:<YYYY-MM-DD>` (an operator is not a user). */
export const EDGE_OPERATOR_SUB_PREFIX = 'operator:';
/** `sub` of the operator token for box-local day `day`. */
export const edgeOperatorSubject = (day: string): string => `${EDGE_OPERATOR_SUB_PREFIX}${day}`;

/** A box-local calendar day, `YYYY-MM-DD`. */
export const EDGE_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** True when `day` is a real calendar date written `YYYY-MM-DD` (no 2026-02-30). */
export function isEdgeDay(day: unknown): day is string {
    if (typeof day !== 'string') return false;
    const m = EDGE_DAY_RE.exec(day);
    if (!m) return false;
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (y < 1970 || mo < 1 || mo > 12 || d < 1) return false;
    const daysInMonth = [31, (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mo - 1];
    return d <= daysInMonth;
}
