/**
 * CALLER_RESOLVER on the box (plan §3.3 bindings): the verified `Caller` of a request on the local API host comes from
 * AUTH_PORT, the same `authenticate` the RT table and the `/edge/*` controllers use (online edge token via the cached
 * JWKS, room-code and operator tokens the box signed), so a shared controller trusts exactly what the box already
 * trusts. A sign-in failure is `null` (CallerGuard answers 401 `unauthenticated`); a box condition
 * (`box_not_configured`, `box_not_linked`, `rate_limited`) is thrown as the EdgePortError it is, which EdgeEnvelope
 * sends as the box code. An operator session has no user and cannot act as one here (`online_sign_in_required`).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Caller, CallerResolver } from '@app/api-kernel';

import { requestContext, requestToken } from '../../lan/edge-http';
import { AUTH_PORT, AuthPort, EdgePortError, EdgePrincipal } from '../../ports';

/** The authenticate failures that mean "no valid sign-in" (401 on the contract), not a box condition. */
export const SIGN_IN_FAILURES: ReadonlySet<string> = new Set(['unauthenticated', 'token_expired', 'token_revoked']);

/** The Caller of a box principal: the user, the token family, platform admin, and the cases this sign-in may open. */
export function callerOfPrincipal(principal: EdgePrincipal): Caller {
    if (!principal.userId) {
        throw new EdgePortError('online_sign_in_required', 'an operator session is not a user; sign in with etabella.net to use this route');
    }
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
        let principal: EdgePrincipal;
        try {
            principal = await this.auth.authenticate(requestToken(request), requestContext(request));
        } catch (err) {
            if (err instanceof EdgePortError && SIGN_IN_FAILURES.has(err.code)) return null;
            throw err;
        }
        return callerOfPrincipal(principal);
    }
}
