/**
 * The box's binding of the Full Fact editor's operations port (plan §3.3 "Relay adapters", Phase 7a): the shared
 * FactsheetController mounted under /realtimeapi asks this adapter, which asks CLOUD_RELAY for the manifest row the
 * RT table answered until Phase 7a (the six `cloud-read` reads with their per-user cache and offline / box-signed
 * fallbacks, the two `cloud-write` writes). The request reaches the relay as the table received it from the FE:
 * the raw query and the raw body of the local API request (the DTO only validated them), so the relay forwards and
 * overwrites the caller's own ids exactly as the table did. The answer is the table's, byte for byte: every header
 * the relay recorded goes onto the response; a JSON body with the status Nest gives the handler anyway (200 for a
 * read, 201 for a write) is returned for the controller to send; anything else, a cloud 200 on a write included, is
 * thrown as a DomainError carrying the recorded answer, which EdgeEnvelope writes as it was, status and all.
 *
 * permissions, unshare and factannotation are never mounted on the box (FactsheetLiveController is cloud only);
 * their adapter methods answer the table's refusal for a route the box does not serve, `use_cloud`.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, DomainError } from '@app/api-kernel';
import type { FactsheetOperations, FactsheetQueryFields, FactsheetSaveFields } from '@app/rt-features/factsheet';

import { apiRequestContext } from '../api-context';
import { ApiRequestContext, CLOUD_RELAY, CloudRelay, RelayAnswer } from '../../ports';

/** Headers the controller's own serialisation sets; everything else the relay recorded is copied. */
const NOT_COPIED = new Set(['content-type', 'content-length']);

/** The request's own query, as the FE sent it (string values only, as Express parses them). */
export function rawQueryOf(ctx: ApiRequestContext): Record<string, string> {
    const out: Record<string, string> = {};
    const query = (ctx.req as { query?: Record<string, unknown> }).query ?? {};
    for (const [key, value] of Object.entries(query)) if (typeof value === 'string') out[key] = value;
    return out;
}

@Injectable()
export class FactsheetRelay implements FactsheetOperations {
    constructor(@Inject(CLOUD_RELAY) private readonly relay: CloudRelay) {}

    detail(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.detail'); }
    shared(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.shared'); }
    issues(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.issues'); }
    contacts(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.contacts'); }
    tasks(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.tasks'); }
    links(_caller: Caller, _query: FactsheetQueryFields): Promise<unknown> { return this.read('factsheet.links'); }
    save(_caller: Caller, _body: FactsheetSaveFields): Promise<unknown> { return this.write('factsheet.save'); }
    remove(_caller: Caller, _body: FactsheetQueryFields): Promise<unknown> { return this.write('factsheet.delete'); }

    permissions(): Promise<unknown> { return Promise.reject(FactsheetRelay.notServed()); }
    unshare(): Promise<unknown> { return Promise.reject(FactsheetRelay.notServed()); }
    annotation(): Promise<unknown> { return Promise.reject(FactsheetRelay.notServed()); }

    /** The box serves no such route: the table's refusal, which EdgeEnvelope renders as `use_cloud`. */
    static notServed(): DomainError {
        return new DomainError('forbidden', 'This request is served by etabella.net; the venue box does not answer it.');
    }

    private async read(routeId: string): Promise<unknown> {
        const ctx = this.context();
        return this.answer(await this.relay.call(routeId, rawQueryOf(ctx), null, ctx), ctx, 200);
    }

    private async write(routeId: string): Promise<unknown> {
        const ctx = this.context();
        return this.answer(await this.relay.call(routeId, {}, (ctx.req as { body?: unknown }).body ?? null, ctx), ctx, 201);
    }

    private context(): ApiRequestContext {
        const ctx = apiRequestContext();
        if (!ctx) throw new DomainError('unavailable', 'the factsheet relay runs only inside a local API request');
        return ctx;
    }

    /** `handlerStatus`: what Nest sends for the handler on its own; any other status goes out as recorded. */
    private answer(answer: RelayAnswer, ctx: ApiRequestContext, handlerStatus: number): unknown {
        for (const [name, value] of Object.entries(answer.headers)) if (!NOT_COPIED.has(name)) ctx.res.setHeader(name, value);
        if (answer.status !== handlerStatus) throw new DomainError('upstream', 'relayed answer', { relay: answer });
        return answer.body;
    }
}
