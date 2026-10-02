/**
 * Error model of the box API. Every error reply is `EdgeErrorBody`: `{msg:-1, error, message, …extra}` with the
 * HTTP status in `EDGE_ERROR_STATUS`. Per-endpoint subsets are listed beside each endpoint (and in CONTRACTS.md).
 *
 * 401 is reserved for "your sign-in is not valid" (the edge auth interceptor answers it by signing in again);
 * code-entry failures and permission refusals never use 401. 503 with `offline` / `reauth` never signs anyone out
 * (spec §8.2, §9 interceptor row).
 */

import type { TransmitterFieldErrors, TransmitterGuard, TransmitterLinkState } from './transmitter';

export const EDGE_ERROR_CODES = [
    // sign-in and permissions
    'unauthenticated',
    'token_expired',
    'token_revoked',
    'not_box_admin',
    'not_case_admin',
    'online_sign_in_required',
    'use_cloud',
    'reauth',
    'offline',
    'box_not_linked',
    'box_not_configured',
    // room-code and operator-code entry
    'code_wrong',
    'code_used_elsewhere',
    'code_expired',
    'code_revoked',
    'code_locked',
    // room-code administration
    'session_not_found',
    'session_ended',
    'operator_name_required',
    'code_already_used',
    'code_not_used',
    // transmitter
    'state_changed',
    'confirm_required',
    'invalid_settings',
    'not_dial_mode',
    'not_configured',
    'already_connected',
    'link_up',
    'test_refused_busy',
    // generic
    'feature_disabled',
    'not_found',
    'invalid_request',
    'payload_too_large',
    'rate_limited',
    'cloud_refused',
    'server_error',
] as const;
export type EdgeErrorCode = typeof EDGE_ERROR_CODES[number];

export const EDGE_ERROR_STATUS: Readonly<Record<EdgeErrorCode, number>> = {
    unauthenticated: 401,
    token_expired: 401,
    token_revoked: 401,
    not_box_admin: 403,
    not_case_admin: 403,
    online_sign_in_required: 403,
    use_cloud: 403,
    reauth: 503,
    offline: 503,
    box_not_linked: 503,
    box_not_configured: 503,
    code_wrong: 400,
    code_used_elsewhere: 409,
    code_expired: 410,
    code_revoked: 410,
    code_locked: 429,
    session_not_found: 404,
    session_ended: 409,
    operator_name_required: 400,
    code_already_used: 409,
    code_not_used: 409,
    state_changed: 409,
    confirm_required: 409,
    invalid_settings: 400,
    not_dial_mode: 409,
    not_configured: 409,
    already_connected: 409,
    link_up: 409,
    test_refused_busy: 409,
    feature_disabled: 404,
    not_found: 404,
    invalid_request: 400,
    /** A request body over the box's limit (1 MiB on the RT write routes): never a malformed one. */
    payload_too_large: 413,
    rate_limited: 429,
    cloud_refused: 502,
    server_error: 500,
};

/** Extra fields per code; codes not listed carry none. */
export interface EdgeErrorExtraMap {
    /** Spec §8.2: routes the box never serves (admin, Eclipse credentials, upload, transcript). */
    readonly use_cloud: { readonly useCloud: true };
    /** Spec §8.4: a box-signed token reached a proxied cloud route. */
    readonly reauth: { readonly reauth: true };
    /** Spec §8.2: the call needs the internet (answered within 300 ms). */
    readonly offline: { readonly offline: true };
    readonly code_wrong: { readonly attemptsLeft: number };
    /** "Used on another device at 10:48. Ask the operator." */
    readonly code_used_elsewhere: { readonly usedAtMs: number; readonly deviceLabel: string | null };
    /** "This code was for Day 2 — Afternoon, which has ended." (operator code: another day's code, both null). */
    readonly code_expired: { readonly sessionName: string | null; readonly endedAtMs: number | null };
    /** "Too many tries. Try again in 0:52." */
    readonly code_locked: { readonly retryAfterSec: number };
    readonly rate_limited: { readonly retryAfterSec: number };
    /** The version the box holds now; the FE reloads and asks the person to review again (DR13). */
    readonly state_changed: { readonly stateVersion: number };
    readonly confirm_required: { readonly guard: TransmitterGuard };
    readonly invalid_settings: { readonly fields: TransmitterFieldErrors };
    readonly test_refused_busy: { readonly linkState: TransmitterLinkState };
}

export type EdgeErrorExtra<K extends EdgeErrorCode> = K extends keyof EdgeErrorExtraMap ? EdgeErrorExtraMap[K] : unknown;

/** An error reply, discriminated on `error`. */
export type EdgeErrorBody<C extends EdgeErrorCode = EdgeErrorCode> = {
    readonly [K in C]: { readonly msg: -1; readonly error: K; readonly message: string } & EdgeErrorExtra<K>;
}[C];

/** True when `value` is an error reply with a known code. */
export function isEdgeErrorBody(value: unknown): value is EdgeErrorBody {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return v['msg'] === -1 && typeof v['error'] === 'string' && (EDGE_ERROR_CODES as readonly string[]).includes(v['error'] as string);
}

/**
 * Failures the browser produces itself (no reply from the box): `box_unreachable` (network error, status 0) and
 * `timeout` (no reply within the call's limit). Never sent by the box.
 */
export const EDGE_CLIENT_ERROR_CODES = ['box_unreachable', 'timeout'] as const;
export type EdgeClientErrorCode = typeof EDGE_CLIENT_ERROR_CODES[number];

export interface EdgeClientErrorBody {
    readonly msg: -1;
    readonly error: EdgeClientErrorCode;
    readonly message: string;
}
