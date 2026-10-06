/**
 * Who is calling. Each host keeps its own authentication (cookie JWT + Redis binding on the live apps, edge and box
 * tokens on the venue box) and runs it before any shared controller; a CallerResolver only turns what the host has
 * already verified into one `Caller`. Shared services take the actor from here and never from the body or the query
 * (plan §3.3, invariant R4), so a forged nMasterid / nUserid can no longer name somebody else.
 */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DomainError } from './errors';

export type CallerFamily = 'cloud-jwt' | 'edge-online' | 'edge-box' | 'service';

export interface Caller {
  /** The actor (UserMaster.nUserid). Services write it into both SP identity keys. */
  readonly userId: string;
  readonly family: CallerFamily;
  /** Cloud: the Redis session's `a` flag. Box: the roster's super_admins (= UserMaster.isAdmin). */
  readonly isPlatformAdmin: boolean;
  /** 'membership': the case rule is a SQL membership check. A list: the only cases this caller may reach (edge tokens). */
  readonly caseScope: 'membership' | readonly string[];
}

export const CALLER_RESOLVER = 'ET_CALLER_RESOLVER';

export interface CallerResolver {
  /** null = not signed in (401). Never throws on a bad token: a throw means the host's own infrastructure failed. */
  resolve(req: unknown): Promise<Caller | null>;
}

/** The request property CallerGuard sets and @Caller() reads (the live JwtMiddleware stamps the same key). */
export const CALLER_KEY = 'etCaller';

/** The Caller stamped on a request, else null. The shape check keeps a half-stamped request from passing as signed in. */
export function callerOf(req: unknown): Caller | null {
  const value = (req as Record<string, unknown> | null)?.[CALLER_KEY];
  if (!value || typeof value !== 'object') return null;
  const caller = value as Partial<Caller>;
  return typeof caller.userId === 'string' && caller.userId && typeof caller.family === 'string' ? (caller as Caller) : null;
}

/**
 * The verified caller (set by CallerGuard). Lives beside the interface so `Caller` is one name for the type and the
 * decorator, as a class would be; a second module exporting the value would make the index's `export *` ambiguous.
 * Without a guard on the route this throws instead of handing the handler `undefined`: fail closed.
 */
export const Caller = createParamDecorator((_data: unknown, context: ExecutionContext): Caller => {
  const caller = callerOf(context.switchToHttp().getRequest());
  if (!caller) throw new DomainError('unauthenticated', 'No verified caller on the request; is CallerGuard applied?');
  return caller;
});
