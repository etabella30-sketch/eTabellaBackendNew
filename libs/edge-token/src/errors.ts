/**
 * Why a token was refused. One plain `Error` subclass, no framework: authapi maps it onto its DR22 `EdgeAuthError`,
 * realtime-server onto its 401 / 403 answers, the box onto its `unauthenticated` / `token_expired` / `token_revoked`
 * envelope (apps/rt-edge contracts `EDGE_ERROR_CODES`). `message` is developer text, never shown to people as is.
 */

export const EDGE_TOKEN_ERROR_CODES = [
    /** Malformed, wrong algorithm or `typ`, unknown `kid`, bad signature, wrong issuer or audience, or ill-formed claims. */
    'token_invalid',
    /** Past `exp` (plus the verifier's clock skew), or an operator token for another day. */
    'token_expired',
    /** On the revocation list (cloud revocations, box sign-out denylist, ended room access). */
    'token_revoked',
    /** A valid token for a different venue box. */
    'box_mismatch',
    /** D22: the request reaches a case outside the token's `cases` claim. */
    'case_not_allowed',
    /** DR10: a room-code token used for a session other than its own. */
    'session_not_allowed',
] as const;
export type EdgeTokenErrorCode = typeof EDGE_TOKEN_ERROR_CODES[number];

/**
 * Suggested HTTP status per code for the box and realtime-server: "sign in again" is 401, a valid token used out of
 * its scope is 403. (authapi answers `box_mismatch` with 400, its DR22 table; it maps codes itself.)
 */
export const EDGE_TOKEN_ERROR_STATUS: Readonly<Record<EdgeTokenErrorCode, number>> = {
    token_invalid: 401,
    token_expired: 401,
    token_revoked: 401,
    box_mismatch: 401,
    case_not_allowed: 403,
    session_not_allowed: 403,
};

/** Default messages. The first three and `box_mismatch` are authapi's DR22 wording, kept identical. */
export const EDGE_TOKEN_ERROR_MESSAGE: Readonly<Record<EdgeTokenErrorCode, string>> = {
    token_invalid: 'This room sign-in is not valid.',
    token_expired: 'This room sign-in has expired.',
    token_revoked: 'This room sign-in was ended. Sign in again.',
    box_mismatch: 'This room sign-in is for a different venue box.',
    case_not_allowed: 'This room sign-in does not cover this case.',
    session_not_allowed: 'This room access does not cover this session.',
};

export class EdgeTokenError extends Error {
    readonly name = 'EdgeTokenError';
    /** Suggested HTTP status (`EDGE_TOKEN_ERROR_STATUS`). */
    readonly status: number;

    constructor(readonly code: EdgeTokenErrorCode, message: string = EDGE_TOKEN_ERROR_MESSAGE[code]) {
        super(message);
        this.status = EDGE_TOKEN_ERROR_STATUS[code];
    }
}

export const isEdgeTokenError = (err: unknown): err is EdgeTokenError => err instanceof EdgeTokenError;
