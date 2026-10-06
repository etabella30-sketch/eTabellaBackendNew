/**
 * Turns the host's verified identity into the request's Caller. Shared controllers carry
 * `@UseGuards(CallerGuard, CaseScopeGuard)`; CallerGuard runs first, so everything after it (CaseScopeGuard, pipes,
 * the handler's @Caller()) can rely on req[CALLER_KEY]. It also stamps the handler's @RouteId on the request, before
 * resolving, so even the 401 reaches the ErrorEnvelope with its route id.
 */
import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { CALLER_KEY, CALLER_RESOLVER, CallerResolver } from './caller';
import { DomainError } from './errors';
import { ROUTE_ID_KEY, routeIdFromContext } from './route-id';

@Injectable()
export class CallerGuard implements CanActivate {
  constructor(@Inject(CALLER_RESOLVER) private readonly resolver: CallerResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Record<string, unknown>>();
    req[ROUTE_ID_KEY] = routeIdFromContext(context);
    const caller = await this.resolver.resolve(req);
    if (!caller) throw new DomainError('unauthenticated', 'Sign in to continue.');
    req[CALLER_KEY] = caller;
    return true;
  }
}
