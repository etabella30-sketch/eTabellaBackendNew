/**
 * The box's binding of the code-tables operations port (plan §3.3 "Relay adapters", Phase 10): the shared
 * CoreCodeTableController mounted under /coreapi asks this adapter, which asks CLOUD_RELAY for `core.getcode`, a
 * cloud-read of realtime-server `issue/dynamiccombo` with the caller's edge token (per-user cache, the mock's []
 * offline or for a box-signed sign-in, with `X-Edge-Offline` / `X-Edge-Reauth`). The answer is the table's, byte for
 * byte (CloudRelayAdapter). The query names no case: the cloud admits it on the box's standing (manifest `caseless`).
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Caller } from '@app/api-kernel';
import type { CodeRow, CodeTableOperations, CodeTableQueryFields } from '@app/rt-features/code-tables';

import { CLOUD_RELAY, CloudRelay } from '../../ports';
import { CloudRelayAdapter } from './cloud-relay-adapter';

@Injectable()
export class CodeTableRelay extends CloudRelayAdapter implements CodeTableOperations {
    constructor(@Inject(CLOUD_RELAY) relay: CloudRelay) {
        super(relay, 'code-tables');
    }

    list(_caller: Caller, _query: CodeTableQueryFields): Promise<readonly CodeRow[]> {
        return this.read('core.getcode') as Promise<readonly CodeRow[]>;
    }
}
