import { Module, Type } from '@nestjs/common';
import { FactsheetRealtimeHttpModule } from '@app/rt-features/factsheet';

import { FactsheetRelay } from '../relays/factsheet.relay';

/**
 * The shared feature HTTP modules mounted under /realtimeapi, by class: api.module.ts registers them as the router
 * children of this module, because a RouterModule prefix reaches only the routed module and its listed children,
 * not the modules it imports. One entry per feature; route-ownership.spec.ts checks the list equals the imports.
 */
export const LOCAL_REALTIME_FEATURE_MODULES: Type<unknown>[] = [FactsheetRealtimeHttpModule];

/**
 * `/realtimeapi` on the box (api.module.ts mounts it under that prefix): the realtime HTTP modules of @app/rt-features
 * over the box's adapter of their operations port. Phase 7a mounts the first, the Full Fact editor: the eight
 * `controller` rows of ROUTE_MANIFEST (six reads, save, delete) are answered by the shared FactsheetController over
 * FactsheetRelay (CLOUD_RELAY), exactly as the RT table relayed them (mount 'box': the cloud-only
 * FactsheetLiveController is not mounted, so permissions / unshare / factannotation stay `use_cloud`). Every other
 * realtimeapi row of ROUTE_MANIFEST is still a table row (RtDataMiddleware) or `use_cloud`.
 */
@Module({
    imports: [FactsheetRealtimeHttpModule.register({ operations: FactsheetRelay, mount: 'box' })],
})
export class LocalRealtimeModule {}
