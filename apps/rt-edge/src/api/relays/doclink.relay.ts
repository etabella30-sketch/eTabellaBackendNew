/**
 * The box's binding of the DocLink operations port (Phase 8): the shared DocLinkController mounted under /realtimeapi
 * asks this adapter, which relays the three rows the RT table answered until Phase 8 (doclink.detail `cloud-read`,
 * doclink.insert and doclink.delete `cloud-write`), through the relay adapter base. docshared is never mounted on
 * the box (DocLinkLiveController is cloud only); its adapter method answers the table's refusal, `use_cloud`.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller } from '@app/api-kernel';
import type { DocLinkDetailFields, DocLinkIdFields, DocLinkInsertFields, DocLinkOperations } from '@app/rt-features/doclink';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter, notServed } from './cloud-relay-adapter';

@Injectable()
export class DocLinkRelay extends CloudRelayAdapter implements DocLinkOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'doclink');
    }

    detail(_caller: Caller, _query: DocLinkDetailFields): Promise<unknown> { return this.read('doclink.detail'); }
    insert(_caller: Caller, _body: DocLinkInsertFields): Promise<unknown> { return this.write('doclink.insert'); }
    remove(_caller: Caller, _body: DocLinkIdFields): Promise<unknown> { return this.write('doclink.delete'); }

    shared(): Promise<unknown> { return Promise.reject(notServed()); }
}
