/**
 * The RT table's refusals, given before a shared controller's validation (plan §3.3; Phases 7-9): a row that moved
 * from the table to a shared controller on the box is still answered by the table's RtDataService through a relay
 * adapter, but Nest validates the handler's DTO BEFORE the handler runs, where the table checked the sign-in, the
 * scope rule, the body shape, the size and the internet first. Without this, a room-code sign-in, or a case outside
 * the sign-in, sending a body the DTO refuses would get the DTO's 400 where the table answered 503 `reauth` or 403
 * `use_cloud`. So this global interceptor (interceptors run after the guards and before the pipes) asks CLOUD_RELAY
 * for exactly those refusals (`precheck`) on every handler that carries a @RouteId, with the principal CallerGuard's
 * resolver verified for the request; a refusal is thrown as its EdgePortError and EdgeEnvelope sends it as the table
 * did. A handler without a @RouteId (the box's own /edge/* controllers) and a request the resolver did not see pass
 * through untouched. Box-only: shared code never imports this.
 */
import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { routeIdFromContext } from '@app/api-kernel';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { principalOf } from './edge-caller.resolver';

@Injectable()
export class EdgeTableParityInterceptor implements NestInterceptor {
    constructor(@Inject(CLOUD_RELAY) private readonly relay: CloudRelay) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const routeId = routeIdFromContext(context);
        if (routeId) {
            const req = context.switchToHttp().getRequest<Request>();
            const principal = principalOf(req);
            if (principal) this.relay.precheck(routeId, principal, req);
        }
        return next.handle();
    }
}
