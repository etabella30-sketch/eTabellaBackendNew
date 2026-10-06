/**
 * CALLER_RESOLVER on the box (plan §3.3 bindings): the verified `Caller` of a request on the local API host comes from
 * AUTH_PORT, the same `authenticate` the RT table and the `/edge/*` controllers use (online edge token via the cached
 * JWKS, room-code and operator tokens the box signed), so a shared controller trusts exactly what the box already
 * trusts. Every refusal of `authenticate` is thrown as the EdgePortError it is (`unauthenticated`, `token_expired`,
 * `token_revoked`, `box_not_configured`, `box_not_linked`, `rate_limited`), which EdgeEnvelope sends as the box's
 * own envelope: the answer the RT table gave for the same token, code and message included, never the kernel's
 * generic 401. `null` is never returned.
 *
 * An operator session has no user. The RT table answered a box-signed sign-in per row: a cloud-read row WITH an
 * offline body got that body with `X-Edge-Reauth: 1` (200), every other relayed row 503 `reauth` (rt-data.service.ts
 * reauthError). So a shared controller's row keeps the same answer: when the row this request names has an offline
 * body, the operator is handed on as an `edge-box` Caller under the OPERATOR_USER sentinel and the relay adapter
 * lets RtDataService answer as the table did (the relay never forwards a box-signed token); otherwise 503 `reauth`
 * here, before the controller.
 *
 * The principal it verified is remembered for the request (`principalOf`), so the box's table-parity interceptor
 * (edge-table-parity.interceptor.ts, after the guards and before the pipes) can give the table's own refusals for
 * the row without verifying the token a second time.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { Caller, CallerResolver } from '@app/api-kernel';
import { manifestBoxRows } from '@app/api-contracts';
import { requestContext, requestToken } from '../../lan/edge-http';
import { splitTarget } from '../../lan/rt-data/rt-data.middleware';
import { reauthError } from '../../lan/rt-data/rt-data.service';
import { AUTH_PORT, AuthPort, EdgePrincipal } from '../../ports';

/** The userId of an operator session's Caller on the box: not a user; no relay adapter forwards it, no SP runs here. */
export const OPERATOR_USER = 'operator';

/** The principal `resolve` verified for each request (weakly held: gone with the request). */
const PRINCIPALS = new WeakMap<object, EdgePrincipal>();

/** The EdgePrincipal the resolver verified for this request, or null (the request did not pass CallerGuard here). */
export function principalOf(req: unknown): EdgePrincipal | null {
    return req && typeof req === 'object' ? (PRINCIPALS.get(req) ?? null) : null;
}

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

/** The operator's Caller for a row the table answered with its offline body (see the top of this file). */
export function operatorCaller(principal: EdgePrincipal): Caller {
    return Object.freeze({ userId: OPERATOR_USER, family: 'edge-box', isPlatformAdmin: false, caseScope: principal.caseIds });
}

/** Whether the box row this request names (method + plain path, case-insensitive) has an offline body. */
export function requestRowHasOfflineBody(method: string | undefined, target: string | undefined): boolean {
    const split = splitTarget(target);
    if (!split || !method) return false;
    const path = split.path.replace(/\/$/, '').toLowerCase();
    const row = manifestBoxRows().find(r => r.method === method.toUpperCase() && r.path.toLowerCase() === path);
    return row !== undefined && row.offlineBody !== null && row.offlineBody !== undefined;
}

@Injectable()
export class EdgeCallerResolver implements CallerResolver {
    constructor(@Inject(AUTH_PORT) private readonly auth: AuthPort) {}

    async resolve(req: unknown): Promise<Caller | null> {
        const request = req as Request;
        const principal: EdgePrincipal = await this.auth.authenticate(requestToken(request), requestContext(request));
        PRINCIPALS.set(request, principal);
        if (!principal.userId && requestRowHasOfflineBody(request.method, request.originalUrl ?? request.url)) return operatorCaller(principal);
        return callerOfPrincipal(principal);
    }
}
