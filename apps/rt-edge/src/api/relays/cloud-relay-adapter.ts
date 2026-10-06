/**
 * The box's binding of a shared feature's operations port (plan §3.3 "Relay adapters"): the shared controller mounted
 * under /realtimeapi or /coreapi asks the adapter, which asks CLOUD_RELAY for the manifest row the RT table answered
 * until the feature moved (a `cloud-read` with its per-user cache and offline / box-signed fallbacks, or a
 * `cloud-write`). The request reaches the relay as the table received it from the FE: the raw query and the raw body
 * of the local API request (the DTO only validated them), so the relay forwards and overwrites the caller's own ids
 * exactly as the table did. The answer is the table's, byte for byte: every header the relay recorded goes onto the
 * response; a JSON body with the status Nest gives the handler anyway (200 for a read, 201 for a write) is returned
 * for the controller to send; anything else, a cloud 200 on a write included, is thrown as a DomainError carrying
 * the recorded answer, which EdgeEnvelope writes as it was, status and all. Phase 7a wrote this for the Full Fact
 * editor; Phase 8 shares it with the Mark Navigator and DocLink relays.
 */
import { DomainError } from '@app/api-kernel';

import { apiRequestContext } from '../api-context';
import { ApiRequestContext, CloudRelay, RelayAnswer } from '../../ports';

/** Headers the controller's own serialisation sets; everything else the relay recorded is copied. */
const NOT_COPIED = new Set(['content-type', 'content-length']);

/** The request's own query, as the FE sent it (string values only, as Express parses them). */
export function rawQueryOf(ctx: ApiRequestContext): Record<string, string> {
    const out: Record<string, string> = {};
    const query = (ctx.req as { query?: Record<string, unknown> }).query ?? {};
    for (const [key, value] of Object.entries(query)) if (typeof value === 'string') out[key] = value;
    return out;
}

/** The box serves no such route: the table's refusal, which EdgeEnvelope renders as `use_cloud`. */
export function notServed(): DomainError {
    return new DomainError('forbidden', 'This request is served by etabella.net; the venue box does not answer it.');
}

export abstract class CloudRelayAdapter {
    protected constructor(private readonly relay: CloudRelay, private readonly feature: string) {}

    protected async read(routeId: string): Promise<unknown> {
        const ctx = this.context();
        return this.answer(await this.relay.call(routeId, rawQueryOf(ctx), null, ctx), ctx, 200);
    }

    /** `handlerStatus`: what Nest sends for the handler on its own (201 for POST, 200 for PUT and DELETE). */
    protected async write(routeId: string, handlerStatus = 201): Promise<unknown> {
        const ctx = this.context();
        return this.answer(await this.relay.call(routeId, {}, (ctx.req as { body?: unknown }).body ?? null, ctx), ctx, handlerStatus);
    }

    private context(): ApiRequestContext {
        const ctx = apiRequestContext();
        if (!ctx) throw new DomainError('unavailable', `the ${this.feature} relay runs only inside a local API request`);
        return ctx;
    }

    /** `handlerStatus`: what Nest sends for the handler on its own; any other status goes out as recorded. */
    private answer(answer: RelayAnswer, ctx: ApiRequestContext, handlerStatus: number): unknown {
        for (const [name, value] of Object.entries(answer.headers)) if (!NOT_COPIED.has(name)) ctx.res.setHeader(name, value);
        if (answer.status !== handlerStatus) throw new DomainError('upstream', 'relayed answer', { relay: answer });
        return answer.body;
    }
}
