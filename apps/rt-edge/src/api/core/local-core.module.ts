import { Module } from '@nestjs/common';

/**
 * `/coreapi` on the box (api.module.ts mounts it under that prefix). Empty in Phase 4: every coreapi row of
 * ROUTE_MANIFEST is still a table row (RtDataMiddleware) or `use_cloud`. From Phase 5 it imports the coreapi HTTP
 * modules of @app/rt-features (`TeamUsersCoreHttpModule.register({ operations: TeamUsersRelay })` first), one module
 * class per URL family, as each manifest row flips from `table` to `controller` (route-ownership.spec.ts, R6).
 */
@Module({})
export class LocalCoreModule {}
