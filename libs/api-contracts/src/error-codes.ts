/**
 * Error codes shared by every host, as plain data (no classes, no Nest), so the FE JSON export and the box bundle
 * read them without the libs that throw them.
 *
 * Two tables:
 * - The box envelope codes: a COPY of apps/rt-edge/src/contracts/errors.ts. That folder may import only its own
 *   siblings (the CONTRACTS.md §11 generator concatenates it for the FE), so it cannot import this lib, and a lib
 *   never imports apps/ (R1). error-codes.spec.ts fails the moment the two drift.
 * - The DomainError codes of @app/api-kernel and the HTTP status each one answers with. Every ErrorEnvelope
 *   (LegacyEnvelope live, EdgeEnvelope on the box) maps a DomainError through this table, so a shared controller
 *   answers the same status on every host; only the body differs, per `legacyShape`. Where a code also exists in
 *   the box envelope it carries the box's status, so the two tables never disagree.
 */

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

/** HTTP status per box envelope code; the same table as the box contract (asserted by error-codes.spec.ts). */
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
  payload_too_large: 413,
  rate_limited: 429,
  cloud_refused: 502,
  server_error: 500,
};

/**
 * The DomainError codes, in the order of the @app/api-kernel `DomainErrorCode` union. Kept as a runtime list here
 * (the kernel only has the type) so the FE export and a spec can enumerate them; error-codes.kernel-parity.spec.ts
 * fails when the two lists drift.
 */
export const DOMAIN_ERROR_CODES = [
  'invalid',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'unavailable',
  'offline',
  'reauth',
  'upstream',
  'cloud_refused',
] as const;

/**
 * HTTP status per DomainError code, on every host.
 * - `offline` / `reauth` are 503 and `cloud_refused` 502 because the box contract already answers them so (and the
 *   FE edge interceptor keys on those statuses: 503 never signs anyone out, spec §8.2).
 * - `upstream` (the database or the cloud behind the host failed or answered nonsense) is 502 for the same reason as
 *   `cloud_refused`: the host itself is fine. A host that must keep today's 500 body does so through `legacyShape`.
 * - `unavailable` is 503: the host refuses the call for now (a dependency is down), try again later.
 */
export const DOMAIN_ERROR_STATUS: Readonly<Record<typeof DOMAIN_ERROR_CODES[number], number>> = {
  invalid: 400,
  unauthenticated: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  unavailable: 503,
  offline: 503,
  reauth: 503,
  upstream: 502,
  cloud_refused: 502,
};
