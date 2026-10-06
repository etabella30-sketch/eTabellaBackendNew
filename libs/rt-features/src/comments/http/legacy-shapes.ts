/**
 * The error answers coreapi's comment routes gave BEFORE they moved here, kept byte for byte (plan D7): every refusal
 * was a Nest HttpException carrying a `{ msg: -1, value }` body (a `{ msg: -1, value, error }` one when the SP
 * failed), written by the global HttpErrorFilter as `{ statusCode, message: 'An error occurred', detailedError:
 * <that body as JSON>, timestamp }`: 403 for a fact the caller may not view (add) or a comment that is not theirs
 * (edit, delete), 500 for a failed permission or owner lookup and for a failed SP. realtime-server, which serves the
 * list and the add for the venue box since Phase 10, registers the same shapes, so the box relays the answer coreapi
 * would have given. One recorded difference: the SP's own error text is carried under `error` where coreapi's catch
 * used to write the inner exception's class name ('Bad Request Exception').
 */
import type { Response } from 'express';
import { DOMAIN_ERROR_STATUS, DomainError, EXCEPTION_BY_STATUS, HttpErrorFilter, responseArgumentsHost } from '@app/api-kernel';

import { COMMENTS_ROUTE_IDS } from './comments.controllers';

/** The same signature as platform-cloud's LegacyShape, written here so this lib never imports the live-only lib. */
export type LegacyShapeHandler = (res: Response, err: DomainError, routeId: string) => void;

/** coreapi's body for a DomainError of the comment routes. */
export function commentsLegacyBody(err: DomainError): { msg: -1; value: string; error?: unknown } {
  const error = (err.detail as { error?: unknown } | undefined)?.error;
  return err.code === 'upstream' && error !== undefined ? { msg: -1, value: err.message, error } : { msg: -1, value: err.message };
}

/** coreapi's status: 403 forbidden, 404 not found, 500 for a failed lookup or SP ('unavailable' / 'upstream'), else the kernel's. */
export function commentsLegacyStatus(err: DomainError): number {
  if (err.code === 'unavailable' || err.code === 'upstream') return 500;
  return DOMAIN_ERROR_STATUS[err.code] ?? 500;
}

/** Writes the HttpErrorFilter body coreapi's `throw new <Exception>({ msg: -1, value })` produced. */
export function sendCommentsLegacyError(res: Response, err: DomainError): void {
  const status = commentsLegacyStatus(err);
  const Exception = EXCEPTION_BY_STATUS[status] ?? EXCEPTION_BY_STATUS[500];
  new HttpErrorFilter().catch(new Exception(commentsLegacyBody(err) as unknown as string), responseArgumentsHost(res));
}

export const COMMENTS_LEGACY_SHAPES: Readonly<Record<string, LegacyShapeHandler>> = Object.freeze(
  Object.fromEntries(Object.values(COMMENTS_ROUTE_IDS).map((id) => [id, (res: Response, err: DomainError): void => sendCommentsLegacyError(res, err)])),
);
