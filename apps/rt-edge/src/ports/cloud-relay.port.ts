/**
 * The box-only seam between a shared controller mounted on the local API host (apps/rt-edge/src/api, Phase 4 of the
 * shared-libraries plan) and the RT data layer that answers the cloud-backed routes today (lan/rt-data): a relay
 * adapter asks `CLOUD_RELAY` for one manifest route and gets the answer the box would have sent on that route,
 * status, headers and bytes, from the SAME RtDataService instance the table uses (one RtCloudProxy, one RtReadCache,
 * one in-flight budget, one marks-changed invalidation). It stays in the app and never enters a lib; shared code
 * only ever sees its feature's operations port.
 */
import type { Request, Response } from 'express';

import type { EdgePrincipal } from './auth.port';

export const CLOUD_RELAY = 'RT_EDGE_CLOUD_RELAY';

/** The HTTP request a shared controller is answering, kept by the local API host's AsyncLocalStorage (api/api-context.ts). */
export interface ApiRequestContext {
    readonly req: Request;
    readonly res: Response;
    /** The raw bearer token of the request, or null (the relay re-verifies it; shared code never forwards it). */
    readonly bearer: string | null;
}

/** What the box would have answered on the route: the contract envelope on failure, the cloud's bytes on success. */
export interface RelayAnswer {
    readonly status: number;
    /** Header names in lower case (`cache-control`, `x-edge-source`, `x-edge-stale`, …). */
    readonly headers: Readonly<Record<string, string>>;
    /** The body parsed as JSON; null for an empty body. */
    readonly body: unknown;
    /** The body as sent. */
    readonly raw: Buffer;
}

export interface CloudRelay {
    /**
     * Answer `routeId` (a `table` row of ROUTE_MANIFEST) for the request in `ctx` with this query and, for a write,
     * this body (the request's own body is not read). Never rejects for a box or cloud condition: those are answers.
     */
    call(routeId: string, query: Readonly<Record<string, string>>, body: unknown, ctx: ApiRequestContext): Promise<RelayAnswer>;

    /**
     * The refusals the table gave BEFORE it forwarded `routeId` (or fell back) for this verified sign-in and request
     * (the query rule, the scope rule, `reauth`, the body shape, the size, offline), each thrown as the EdgePortError
     * it is; returns when the table would have gone on to answer. The local API host runs it ahead of a shared
     * controller's validation (api/adapters/edge-table-parity.interceptor.ts), so a request the controller's DTO
     * would refuse still gets the table's earlier answer.
     */
    precheck(routeId: string, principal: EdgePrincipal, req: Request): void;
}
