/**
 * The identity keys every legacy request carries. Old clients send nMasterid / nUserid themselves and the live
 * JwtMiddleware injects nMasterid into the body and the query, so a shared DTO must still DECLARE both or the global
 * `forbidNonWhitelisted` pipe would answer 400. Shared services ignore the values and use the verified Caller
 * (invariant R4); a route where nUserid really names a target user says so in the route manifest.
 */
import { IsItUUID } from './is-it-uuid';

export class ActorFields {
  /** Accepted for compatibility only; the actor is the Caller. */
  @IsItUUID()
  nMasterid?: string;

  /** Accepted for compatibility only; the actor is the Caller unless the manifest row names it as a target. */
  @IsItUUID()
  nUserid?: string;
}

/**
 * An id value that means "no id": exactly what IsItUUID turns into null before a controller runs (falsy, 'null',
 * 'undefined', '0'). The RT page sends nIDid='null', nSessionid='null' and nIid=0 for "none". Same rule and value as
 * realtime-server's edge-token scope check, which re-exports this one so the two can never drift.
 */
export function absentId(value: unknown): boolean {
  return !value || value === 'null' || value === 'undefined' || value == '0';
}

export const UUID_TEXT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A raw request value that is a UUID string (any case). */
export function isUuidText(value: unknown): value is string {
  return typeof value === 'string' && UUID_TEXT_RE.test(value);
}
