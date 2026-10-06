/**
 * The box's binding of the Mark Navigator's operations port (Phase 8): the shared MarkNavigatorController mounted under
 * /realtimeapi asks this adapter, which relays the two `cloud-read` rows the RT table answered until Phase 8
 * (marknav.all with its three-cursor offline body, marknav.quickmarks), through the relay adapter base.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller } from '@app/api-kernel';
import type { MarkNavigatorListFields, MarkNavigatorOperations } from '@app/rt-features/marknav';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter } from './cloud-relay-adapter';

@Injectable()
export class MarkNavigatorRelay extends CloudRelayAdapter implements MarkNavigatorOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'marknav');
    }

    all(_caller: Caller, _query: MarkNavigatorListFields): Promise<unknown> { return this.read('marknav.all'); }
    quickMarks(_caller: Caller, _query: MarkNavigatorListFields): Promise<unknown> { return this.read('marknav.quickmarks'); }
}
