import { randomUUID } from 'node:crypto';
import { SignJWT } from 'jose';
import {
    EDGE_BOX_SECRET_MIN_BYTES, EDGE_BOX_TOKEN_ALG, EDGE_BOX_TOKEN_TYP, EDGE_JTI_MAX_LENGTH, EDGE_OPERATOR_TOKEN_MAX_TTL_SEC,
    EDGE_ROOM_TOKEN_MAX_TTL_SEC, EDGE_UUID_RE, edgeAudience, edgeBoxIssuer, edgeOperatorSubject, isEdgeDay,
} from './constants';
import { EdgeBoxClaims, EdgeOperatorTokenClaims, EdgeRoomTokenClaims, edgeBoxIdOfIssuer, isEdgeBoxTokenClaims } from './claims';
import { EdgeTokenError } from './errors';
import { EdgeRevocationCheck, isEdgeExpired, verifiedJwsPayload } from './verify';

/**
 * Box-signed tokens (spec §8.4 "Room codes" and "Daily operator code", §4.10; D33, DR7, DR10; build defaults O-9,
 * O-10, O-11; apps/rt-edge ports/auth.port.ts). The venue box mints them when someone redeems a room code or today's
 * operator code, and is the only one that ever verifies them: HS256 with the box-local secret
 * (`StatePort.identity.secret('box-token-signing')`, 32 random bytes that never leave the box). They carry
 * `iss: box:<nEdgeid>` and `typ: edge-box+jwt`, so the cloud's edge-token verifier refuses them (wrong `alg`, `typ`,
 * issuer and key) and the box never mistakes one for an online edge token. They are never forwarded to the cloud.
 *
 * - room-code (O-9): one person (`sub` = nUserid), one session (`nSesid`); access until the session ends (the box's
 *   check at use time), capped at redemption + 24 h by `exp`.
 * - operator (DR7, O-10, O-11): box admin for one box-local day (`day`, `sub` = `operator:<day>`); `exp` = the end of
 *   that day. Its authority is the minting case admin's (`mintedBy`) cases assigned to the box, which the box resolves
 *   from its cached roster.
 */

/** A room-code redemption to mint a token for. */
export interface EdgeRoomTokenInput {
    nEdgeid: string;
    /** The person the code was issued to. */
    nUserid: string;
    /** The one session the code opens. */
    nSesid: string;
    /** The case admin who issued the code. */
    mintedBy: string;
    /** Redemption time, epoch ms. */
    nowMs: number;
    /** Optional earlier end (e.g. the session's scheduled end), epoch ms; the token never outlives now + 24 h (O-9). */
    validUntilMs?: number;
    /** Defaults to a random UUID. */
    jti?: string;
}

/** An operator-code sign-in to mint a token for. */
export interface EdgeOperatorTokenInput {
    nEdgeid: string;
    /** The box-local day the code is for, `YYYY-MM-DD`. */
    day: string;
    /** The case admin who minted the code (O-10). */
    mintedBy: string;
    nowMs: number;
    /** The end of `day` in the box's time zone (23:59:59.999), epoch ms; the box computes it from its zone. */
    validUntilMs: number;
    jti?: string;
}

const isUuid = (v: unknown): v is string => typeof v === 'string' && EDGE_UUID_RE.test(v.trim());

function uuidOrThrow(value: unknown, name: string): string {
    if (!isUuid(value)) throw new Error(`box token: ${name} must be a uuid`);
    return value.trim().toLowerCase();
}

function jtiOrRandom(jti: unknown): string {
    if (jti === undefined || jti === null) return randomUUID();
    if (typeof jti !== 'string' || !jti || jti.length > EDGE_JTI_MAX_LENGTH) throw new Error('box token: jti is malformed');
    return jti;
}

function nowSecOrThrow(nowMs: unknown): number {
    if (typeof nowMs !== 'number' || !Number.isFinite(nowMs) || nowMs < 0) throw new Error('box token: nowMs must be a time');
    return Math.floor(nowMs / 1000);
}

/** The box secret, checked: bytes, at least 256 bits. Never echoed. */
function secretOrThrow(secret: unknown): Uint8Array {
    if (!(secret instanceof Uint8Array) || secret.length < EDGE_BOX_SECRET_MIN_BYTES) {
        throw new Error(`box token: the signing secret must be at least ${EDGE_BOX_SECRET_MIN_BYTES} bytes`);
    }
    return secret;
}

/** `exp` for an instant given in ms: the first whole second at or after it (23:59:59.999 → the next midnight). */
const expOf = (ms: number): number => Math.ceil(ms / 1000);

/** The claims of a room-code token (O-9): exp = min(validUntil, now + 24 h). Throws on malformed input or no life left. */
export function edgeRoomTokenClaims(input: EdgeRoomTokenInput): EdgeRoomTokenClaims {
    const nEdgeid = uuidOrThrow(input?.nEdgeid, 'nEdgeid');
    const iat = nowSecOrThrow(input.nowMs);
    let exp = iat + EDGE_ROOM_TOKEN_MAX_TTL_SEC;
    if (input.validUntilMs !== undefined && input.validUntilMs !== null) {
        if (typeof input.validUntilMs !== 'number' || Number.isNaN(input.validUntilMs)) throw new Error('box token: validUntilMs must be a time');
        exp = Math.min(exp, expOf(input.validUntilMs));
    }
    if (exp <= iat) throw new Error('box token: no life left (validUntilMs is not after now)');
    return {
        iss: edgeBoxIssuer(nEdgeid),
        aud: edgeAudience(nEdgeid),
        kind: 'room-code',
        sub: uuidOrThrow(input.nUserid, 'nUserid'),
        jti: jtiOrRandom(input.jti),
        iat,
        exp,
        nSesid: uuidOrThrow(input.nSesid, 'nSesid'),
        mintedBy: uuidOrThrow(input.mintedBy, 'mintedBy'),
    };
}

/** The claims of an operator token (DR7): exp = the end of its box-local day. Throws on malformed input or no life left. */
export function edgeOperatorTokenClaims(input: EdgeOperatorTokenInput): EdgeOperatorTokenClaims {
    const nEdgeid = uuidOrThrow(input?.nEdgeid, 'nEdgeid');
    if (!isEdgeDay(input.day)) throw new Error('box token: day must be YYYY-MM-DD');
    const iat = nowSecOrThrow(input.nowMs);
    if (typeof input.validUntilMs !== 'number' || !Number.isFinite(input.validUntilMs)) throw new Error('box token: validUntilMs must be a time');
    const exp = expOf(input.validUntilMs);
    if (exp <= iat) throw new Error('box token: no life left (validUntilMs is not after now)');
    if (exp - iat > EDGE_OPERATOR_TOKEN_MAX_TTL_SEC) throw new Error('box token: an operator token lasts one day at most');
    return {
        iss: edgeBoxIssuer(nEdgeid),
        aud: edgeAudience(nEdgeid),
        kind: 'operator',
        sub: edgeOperatorSubject(input.day),
        jti: jtiOrRandom(input.jti),
        iat,
        exp,
        day: input.day,
        mintedBy: uuidOrThrow(input.mintedBy, 'mintedBy'),
    };
}

/** Signs well-formed box-token claims (HS256, `typ: edge-box+jwt`); refuses anything `isEdgeBoxTokenClaims` rejects. */
export async function signEdgeBoxToken(claims: EdgeBoxClaims, secret: Uint8Array): Promise<string> {
    const key = secretOrThrow(secret);
    if (!isEdgeBoxTokenClaims(claims)) throw new Error('box token: refusing to sign malformed claims');
    return new SignJWT({ ...claims })
        .setProtectedHeader({ alg: EDGE_BOX_TOKEN_ALG, typ: EDGE_BOX_TOKEN_TYP })
        .sign(key);
}

export interface EdgeBoxVerifyOptions {
    /** This box: a token minted by another box is `box_mismatch`. */
    nEdgeid: string;
    /** Clock, epoch ms. */
    nowMs: number;
    /** Accepted lateness on `exp`, seconds. Default 0: the box checks its own tokens against its own clock. */
    clockSkewSec?: number;
    /**
     * When given (even null), a room-code token must be for this session (`session_not_allowed`, DR10 "a room-code
     * token reaches only its own session"). Operator tokens are not session-bound: their reach is the minting admin's
     * box cases, which only the caller's roster can check.
     */
    nSesid?: string | null;
    /** The box-local day now (`YYYY-MM-DD`): an operator token for another day is `token_expired` (DR7, "that day only"). */
    today?: string;
    /** Box-local denylist (sign-out, "End <name>'s room access") and cloud user revocations; revoked = `token_revoked`. */
    revocation?: EdgeRevocationCheck | null;
}

/**
 * Verifies a box-signed token with the box's own secret: HS256 only, `typ` edge-box+jwt, well-formed claims of either
 * kind, issued by and for this box, unexpired, (operator) for today, not revoked and (room-code) for the session
 * asked. Throws `EdgeTokenError`: `token_invalid`, `box_mismatch`, `token_expired`, `token_revoked`,
 * `session_not_allowed`; a missing or short secret is a configuration error (plain `Error`). Whether a room-code
 * token's session has ended is the caller's check (O-9).
 */
export async function verifyEdgeBoxToken(token: unknown, secret: Uint8Array, opts: EdgeBoxVerifyOptions): Promise<EdgeBoxClaims> {
    const key = secretOrThrow(secret);
    const claims = await verifiedJwsPayload(token, EDGE_BOX_TOKEN_ALG, EDGE_BOX_TOKEN_TYP, () => key);
    if (!isEdgeBoxTokenClaims(claims)) throw new EdgeTokenError('token_invalid');
    if (edgeBoxIdOfIssuer(claims.iss) !== String(opts.nEdgeid).toLowerCase()) throw new EdgeTokenError('box_mismatch');
    if (isEdgeExpired(claims.exp, opts.nowMs, opts.clockSkewSec)) throw new EdgeTokenError('token_expired');
    if (claims.kind === 'operator' && opts.today !== undefined && claims.day !== opts.today) throw new EdgeTokenError('token_expired');
    if (opts.revocation && await opts.revocation.isRevoked(claims.jti, claims.sub, claims.iat)) throw new EdgeTokenError('token_revoked');
    if (claims.kind === 'room-code' && opts.nSesid !== undefined && claims.nSesid !== String(opts.nSesid ?? '').trim().toLowerCase()) {
        throw new EdgeTokenError('session_not_allowed');
    }
    return claims;
}

/** A minted box token and its claims. */
export interface EdgeMintedBoxToken<C extends EdgeBoxClaims = EdgeBoxClaims> {
    token: string;
    claims: C;
}

/**
 * A venue box's token mint: its box id and its box-local signing secret. The secret is copied in and never exposed;
 * a new secret (a re-imaged box) ends every box token minted before it, which is the intended effect.
 */
export class EdgeBoxTokenSigner {
    private constructor(readonly nEdgeid: string, private readonly secret: Uint8Array) { }

    static create(nEdgeid: string, secret: Uint8Array): EdgeBoxTokenSigner {
        return new EdgeBoxTokenSigner(uuidOrThrow(nEdgeid, 'nEdgeid'), Uint8Array.from(secretOrThrow(secret)));
    }

    async mintRoomToken(input: Omit<EdgeRoomTokenInput, 'nEdgeid'>): Promise<EdgeMintedBoxToken<EdgeRoomTokenClaims>> {
        const claims = edgeRoomTokenClaims({ ...input, nEdgeid: this.nEdgeid });
        return { token: await signEdgeBoxToken(claims, this.secret), claims };
    }

    async mintOperatorToken(input: Omit<EdgeOperatorTokenInput, 'nEdgeid'>): Promise<EdgeMintedBoxToken<EdgeOperatorTokenClaims>> {
        const claims = edgeOperatorTokenClaims({ ...input, nEdgeid: this.nEdgeid });
        return { token: await signEdgeBoxToken(claims, this.secret), claims };
    }

    /** `verifyEdgeBoxToken` against this box's secret and id. */
    verify(token: unknown, opts: Omit<EdgeBoxVerifyOptions, 'nEdgeid'>): Promise<EdgeBoxClaims> {
        return verifyEdgeBoxToken(token, this.secret, { ...opts, nEdgeid: this.nEdgeid });
    }

    /** No key material in logs or JSON. */
    toJSON(): { nEdgeid: string } {
        return { nEdgeid: this.nEdgeid };
    }
}
