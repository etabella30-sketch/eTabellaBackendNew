/**
 * CALLER_RESOLVER on the box (plan §3.3 bindings): the verified `Caller` of a request on the local API host comes from
 * AUTH_PORT, the same `authenticate` the RT table and the `/edge/*` controllers use (online edge token via the cached
 * JWKS, room-code and operator tokens the box signed), so a shared controller trusts exactly what the box already
 * trusts. Every refusal of `authenticate` is thrown as the EdgePortError it is (`unauthenticated`, `token_expired`,
 * `token_revoked`, `box_not_configured`, `box_not_linked`, `rate_limited`), which EdgeEnvelope sends as the box's
 * own envelope: the answer the RT table gave for the same token, code and message included, never the kernel's
 * generic 401. `null` is never returned. An operator session has no user: it gets the answer every relayed route
 * gave a box-signed sign-in, 503 `reauth` (rt-data.service.ts reauthError), so the box answers the same before and
 * after a route moved to a shared controller.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Caller, CallerResolver } from '@app/api-kernel';

import { requestContext, requestToken } from '../../lan/edge-http';
import { reauthError } from '../../lan/rt-data/rt-data.service';
import { AUTH_PORT, AuthPort, EdgePrincipal } from '../../ports';

/** The Caller of a box principal: the user, the token family, platform admin, and the cases this sign-in may open. */
export function callerOfPrincipal(principal: EdgePrincipal): Caller {
    if (!principal.userId) throw reauthError();
    return Object.freeze({
        userId: principal.userId,
        family: principal.kind === 'online' ? 'edge-online' : 'edge-box',
        isPlatformAdmin: principal.isSuperAdmin,
        caseScope: principal.caseIds,
    });
}

@Injectable()
export class EdgeCallerResolver implements CallerResolver {
    constructor(@Inject(AUTH_PORT) private readonly auth: AuthPort) {}

    async resolve(req: unknown): Promise<Caller | null> {
        const request = req as Request;
        const principal: EdgePrincipal = await this.auth.authenticate(requestToken(request), requestContext(request));
        return callerOfPrincipal(principal);
    }
}
