import {
    EDGE_BOX_TOKEN_KINDS, EDGE_JTI_MAX_LENGTH, EDGE_OPERATOR_TOKEN_MAX_TTL_SEC, EDGE_ROOM_TOKEN_MAX_TTL_SEC, EDGE_TOKEN_ISSUER,
    EDGE_TOKEN_SCOPE, EDGE_UUID_RE, EdgeBoxTokenKind, edgeAudience, edgeBoxIssuer, edgeOperatorSubject, isEdgeDay,
} from './constants';

/**
 * Claim shapes of the two token families. Times are epoch seconds, as in every JWT. The box contract mirrors these
 * (apps/rt-edge/src/contracts/auth.ts `EdgeTokenClaims`, `EdgeBoxTokenClaims`); edge-token.contract-parity.spec.ts
 * fails when they drift.
 */

/** Claims of an edge token (authapi, spec §8.4 step 3). */
export interface EdgeTokenClaims {
    iss: string;
    /** nUserid of the signed-in user. */
    sub: string;
    /** Same as `sub`; keeps the FE's `userId` reader (FE auth.service.ts) working. */
    userId: string;
    /** `edge:<nEdgeid>`. */
    aud: string;
    /** The box id (nEdgeid) the token is for. */
    edge: string;
    /** D22: the case ids this token may reach, = the box's RtEdgeCase cases ∩ the user's case teams. Sorted, lower case. */
    cases: string[];
    scope: typeof EDGE_TOKEN_SCOPE;
    /** Unique per token; one active per (user, box), a new one revokes the previous. */
    jti: string;
    iat: number;
    /** ≤ iat + 12 h (D28) and ≤ auth_time + 24 h (D24). */
    exp: number;
    /** The etabella.net sign-in this token descends from; preserved across renewals (D24). */
    auth_time: number;
}

/** Claims of a box-signed token, either kind (mirror of the contract's `EdgeBoxTokenClaims`). */
export interface EdgeBoxTokenClaims {
    /** `box:<nEdgeid>` */
    iss: string;
    /** `edge:<nEdgeid>` */
    aud: string;
    kind: EdgeBoxTokenKind;
    /** room-code: the person's nUserid; operator: `operator:<YYYY-MM-DD>`. */
    sub: string;
    jti: string;
    iat: number;
    exp: number;
    /** room-code only: the one session the code opens. */
    nSesid?: string;
    /** operator only: the box-local day the code is for. */
    day?: string;
    /** nUserid of the case admin who issued the room code, or who minted the operator code. */
    mintedBy: string;
}

/**
 * A room-code token (D33, DR10, O-9): one person, one session. Access lasts until the session ends (the box checks
 * that at use time) and never longer than 24 h from redemption. Read-only in v1; never forwarded to the cloud.
 */
export interface EdgeRoomTokenClaims extends EdgeBoxTokenClaims {
    kind: 'room-code';
    nSesid: string;
    day?: undefined;
}

/**
 * An operator token (DR7, O-10, O-11): box admin for that box-local day only. Its authority is the minting case
 * admin's cases assigned to the box (the box resolves them from its cached roster).
 */
export interface EdgeOperatorTokenClaims extends EdgeBoxTokenClaims {
    kind: 'operator';
    day: string;
    nSesid?: undefined;
}

export type EdgeBoxClaims = EdgeRoomTokenClaims | EdgeOperatorTokenClaims;

const isStr = (v: unknown): v is string => typeof v === 'string';
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const isUuid = (v: unknown): v is string => isStr(v) && EDGE_UUID_RE.test(v);
const isJti = (v: unknown): v is string => isStr(v) && v.length > 0 && v.length <= EDGE_JTI_MAX_LENGTH;
const isRecord = (c: unknown): c is Record<string, unknown> => !!c && typeof c === 'object' && !Array.isArray(c);

/** True when `c` has every edge claim with the right type and the invariants between them. */
export function isEdgeTokenClaims(c: any): c is EdgeTokenClaims {
    if (!isRecord(c)) return false;
    if (c.iss !== EDGE_TOKEN_ISSUER || c.scope !== EDGE_TOKEN_SCOPE) return false;
    if (!isUuid(c.sub) || c.userId !== c.sub) return false;
    if (!isUuid(c.edge) || c.aud !== edgeAudience(c.edge)) return false;
    if (!Array.isArray(c.cases) || !c.cases.length || !c.cases.every(isUuid)) return false;
    if (!isJti(c.jti)) return false;
    if (!isInt(c.iat) || !isInt(c.exp) || !isInt(c.auth_time)) return false;
    return c.exp > c.iat && c.auth_time <= c.iat;
}

/**
 * The box id a box token's `iss` names (`box:<uuid>`, lower case), or null when `iss` is not a box issuer. The
 * audience must name the same box.
 */
export function edgeBoxIdOfIssuer(iss: unknown): string | null {
    if (!isStr(iss) || !iss.startsWith('box:')) return null;
    const id = iss.slice(4);
    return isUuid(id) && edgeBoxIssuer(id) === iss ? id : null;
}

/** True when `c` is a well-formed room-code token's claims (O-9: life ≤ 24 h). */
export function isEdgeRoomTokenClaims(c: any): c is EdgeRoomTokenClaims {
    if (!isBoxBase(c, 'room-code', EDGE_ROOM_TOKEN_MAX_TTL_SEC)) return false;
    return isUuid(c.sub) && isUuid(c.nSesid) && c.day === undefined;
}

/** True when `c` is a well-formed operator token's claims (DR7: `sub` = `operator:<day>`, life ≤ one day). */
export function isEdgeOperatorTokenClaims(c: any): c is EdgeOperatorTokenClaims {
    if (!isBoxBase(c, 'operator', EDGE_OPERATOR_TOKEN_MAX_TTL_SEC)) return false;
    return isEdgeDay(c.day) && c.sub === edgeOperatorSubject(c.day) && c.nSesid === undefined;
}

/** True when `c` is a well-formed box token of either kind. */
export function isEdgeBoxTokenClaims(c: any): c is EdgeBoxClaims {
    return isEdgeRoomTokenClaims(c) || isEdgeOperatorTokenClaims(c);
}

function isBoxBase(c: any, kind: EdgeBoxTokenKind, maxTtlSec: number): boolean {
    if (!isRecord(c) || c.kind !== kind || !(EDGE_BOX_TOKEN_KINDS as readonly unknown[]).includes(c.kind)) return false;
    const box = edgeBoxIdOfIssuer(c.iss);
    if (!box || c.aud !== edgeAudience(box)) return false;
    if (!isJti(c.jti) || !isUuid(c.mintedBy)) return false;
    if (!isInt(c.iat) || !isInt(c.exp)) return false;
    return c.exp > c.iat && c.exp - c.iat <= maxTtlSec;
}
