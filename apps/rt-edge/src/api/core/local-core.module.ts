import { Module, Type } from '@nestjs/common';
import { CodeTableCoreHttpModule } from '@app/rt-features/code-tables';
import { TeamUsersCoreHttpModule } from '@app/rt-features/team-users';

import { CodeTableRelay } from '../relays/code-table.relay';
import { TeamUsersRelay } from '../relays/team-users.relay';

/**
 * The shared feature HTTP modules mounted under /coreapi, by class: api.module.ts registers them as the router
 * children of this module, because a RouterModule prefix reaches only the routed module and its listed children,
 * not the modules it imports. One entry per feature; route-ownership.spec.ts checks the list equals the imports.
 */
export const LOCAL_CORE_FEATURE_MODULES: Type<unknown>[] = [TeamUsersCoreHttpModule, CodeTableCoreHttpModule];

/**
 * `/coreapi` on the box (api.module.ts mounts it under that prefix): the coreapi HTTP modules of @app/rt-features,
 * one module class per URL family, each over the box's adapter of its operations port. Phase 5 mounts the first,
 * team users: `GET /coreapi/common/myteamusers` is answered by the shared CoreTeamUsersController over
 * TeamUsersRelay (CLOUD_RELAY), and its manifest row is `controller` (route-ownership.spec.ts, R6). Phase 10 mounts
 * the code tables: `GET /coreapi/common/getcode` is the shared CoreCodeTableController over CodeTableRelay (relayed
 * to realtime-server issue/dynamiccombo). Every other coreapi row of ROUTE_MANIFEST is still a table row
 * (RtDataMiddleware) or `use_cloud`.
 */
@Module({
    imports: [TeamUsersCoreHttpModule.register({ operations: TeamUsersRelay }), CodeTableCoreHttpModule.register({ operations: CodeTableRelay })],
})
export class LocalCoreModule {}
