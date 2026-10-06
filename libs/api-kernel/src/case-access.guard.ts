/**
 * The case-scope check of a shared route. `@CaseScoped('nCaseid')` names the request field that carries the case;
 * CaseScopeGuard asks CASE_ACCESS whether the Caller may reach every case the request names in that field.
 *
 * Who is checked (plan §3.3): edge callers always, as the box and realtime-server's edge-token branch do today; a
 * cloud JWT (and a service caller) only where the route says `cloudCaseCheck: true`, because each cloud route that
 * starts refusing non-members is an approved behaviour change recorded in the route manifest.
 *
 * Guards run before pipes, so the guard reads raw values: a request that names no case, or a case that is not an
 * id, is refused with 'forbidden' exactly as the edge-token branch answers NO_CASE / BAD_ID today.
 */
import { CanActivate, CustomDecorator, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { absentId, isUuidText } from './actor-fields';
import { Caller, callerOf } from './caller';
import { CASE_ACCESS, CaseAccess } from './case-access';
import { DomainError } from './errors';
import { MetadataTargets } from './route-id';

export const CASE_SCOPED_METADATA = 'et:caseScoped';

export interface CaseScopedOptions {
  /** Also check cloud-jwt and service callers (default false: only edge callers are checked). */
  readonly cloudCaseCheck?: boolean;
}

export interface CaseScopedMetadata {
  /** The request field (params, query or body) that names the case. */
  readonly field: string;
  readonly cloudCaseCheck: boolean;
}

/** Marks a handler (or every handler of a class) as reaching the case named by `field`. */
export function CaseScoped(field: string, options: CaseScopedOptions = {}): CustomDecorator<string> {
  const metadata: CaseScopedMetadata = { field, cloudCaseCheck: options.cloudCaseCheck === true };
  return SetMetadata(CASE_SCOPED_METADATA, metadata);
}

/** The @CaseScoped of the handler, else of its class, else null (the route is not case-scoped). */
export function caseScopedOf(context: MetadataTargets): CaseScopedMetadata | null {
  for (const target of [context.getHandler(), context.getClass()]) {
    if (!target) continue;
    const metadata: unknown = Reflect.getMetadata(CASE_SCOPED_METADATA, target);
    if (metadata && typeof metadata === 'object' && typeof (metadata as CaseScopedMetadata).field === 'string') {
      return metadata as CaseScopedMetadata;
    }
  }
  return null;
}

/** Whether this caller's family is checked on a route with this metadata. */
export function caseCheckApplies(caller: Pick<Caller, 'family'>, metadata: Pick<CaseScopedMetadata, 'cloudCaseCheck'>): boolean {
  return caller.family === 'edge-online' || caller.family === 'edge-box' || metadata.cloudCaseCheck;
}

/**
 * Every value of `field` the request carries in params, query and body ("no id" values skipped, duplicates folded,
 * lower-cased as ids are compared everywhere). Both sources count, as in the edge-token branch: a body id cannot
 * hide behind a query id.
 */
export function namedCaseIds(req: unknown, field: string): string[] {
  const r = (req as { params?: unknown; query?: unknown; body?: unknown } | null) ?? {};
  const found = new Set<string>();
  for (const source of [r.params, r.query, r.body]) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    const value: unknown = (source as Record<string, unknown>)[field];
    if (absentId(value)) continue;
    found.add(typeof value === 'string' ? value.trim().toLowerCase() : String(value));
  }
  return [...found];
}

@Injectable()
export class CaseScopeGuard implements CanActivate {
  constructor(@Inject(CASE_ACCESS) private readonly access: CaseAccess) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = caseScopedOf(context);
    if (!metadata) return true;
    const req: unknown = context.switchToHttp().getRequest();
    const caller = callerOf(req);
    if (!caller) throw new DomainError('unauthenticated', 'No verified caller on the request; is CallerGuard applied?');
    if (!caseCheckApplies(caller, metadata)) return true;
    const ids = namedCaseIds(req, metadata.field);
    // A request that names no case is malformed, not forbidden: 400 "<field> is required", the answer the venue
    // box's RT table always gave (EdgeEnvelope renders it as the box's invalid_request).
    if (!ids.length) throw new DomainError('invalid', `${metadata.field} is required`, { field: metadata.field });
    for (const id of ids) {
      if (!isUuidText(id)) throw new DomainError('forbidden', `${metadata.field} is not an id.`, { field: metadata.field });
      await this.access.assertMember(caller, id);
    }
    return true;
  }
}
