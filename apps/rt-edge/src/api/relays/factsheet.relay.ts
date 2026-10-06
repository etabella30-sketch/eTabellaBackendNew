/**
 * The box's binding of the Full Fact editor's operations port (plan §3.3 "Relay adapters", Phase 7a): the shared
 * FactsheetController mounted under /realtimeapi asks this adapter, which asks CLOUD_RELAY for the manifest row the
 * RT table answered until Phase 7a (the six `cloud-read` reads, the two `cloud-write` writes), through the relay
 * adapter base (cloud-relay-adapter.ts: raw query / body forwarded, the answer byte for byte).
 *
 * permissions, unshare and factannotation are never mounted on the box (FactsheetLiveController is cloud only);
 * their adapter methods answer the table's refusal for a route the box does not serve, `use_cloud`.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, DomainError } from '@app/api-kernel';
import type { FactsheetOperations, FactsheetQueryFields, FactsheetSaveFields } from '@app/rt-features/factsheet';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter, notServed } from './cloud-relay-adapter';

export { rawQueryOf } from './cloud-relay-adapter';

@Injectable()
export class FactsheetRelay extends CloudRelayAdapter implements FactsheetOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'factsheet');
    }

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
        return notServed();
    }
}
