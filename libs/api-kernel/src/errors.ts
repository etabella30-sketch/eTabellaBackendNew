/**
 * One error type for shared services and guards. A DomainError names WHAT went wrong (`code`), not how a host
 * answers it: the live apps keep their legacy body (plan D7, `LegacyEnvelope`), the venue box its CONTRACTS.md
 * envelope, and DomainErrorFilter hands the error to whichever ErrorEnvelope the host bound. Without an envelope the
 * filter answers the plain `{statusCode, cCode, message}` of DOMAIN_ERROR_STATUS. `message` is developer text.
 */
import type { Response } from 'express';

export type DomainErrorCode =
  | 'invalid'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unavailable'
  | 'offline'
  | 'reauth'
  | 'upstream'
  | 'cloud_refused';

export class DomainError extends Error {
  readonly name = 'DomainError';

  constructor(readonly code: DomainErrorCode, message: string, readonly detail?: Readonly<Record<string, unknown>>) {
    super(message);
  }
}

export const isDomainError = (err: unknown): err is DomainError => err instanceof DomainError;

/** The status DomainErrorFilter uses when no ErrorEnvelope is bound (the box and live envelopes may differ per route). */
export const DOMAIN_ERROR_STATUS: Readonly<Record<DomainErrorCode, number>> = Object.freeze({
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
});

export const ERROR_ENVELOPE = 'ET_ERROR_ENVELOPE';

/**
 * How a host writes an error to the wire. `routeId` is the manifest id of the route that failed (null when the
 * handler carries no @RouteId), so a live envelope can reproduce that route's legacy body byte for byte.
 */
export interface ErrorEnvelope {
  send(res: Response, err: unknown, routeId: string | null): void;
}

/**
 * The ValidationPipe options every host already runs globally; shared controllers apply the same ones at controller
 * scope so the box (which has no global pipe) validates exactly as the cloud does.
 */
export const SHARED_VALIDATION = { whitelist: true, forbidNonWhitelisted: true, transform: true } as const;
