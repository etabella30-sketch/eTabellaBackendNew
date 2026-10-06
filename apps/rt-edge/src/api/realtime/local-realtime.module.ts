import { Module } from '@nestjs/common';

/**
 * `/realtimeapi` on the box (api.module.ts mounts it under that prefix). Empty in Phase 4: every realtimeapi row of
 * ROUTE_MANIFEST is still a table row (RtDataMiddleware) or `use_cloud`. From Phase 5 it imports the realtime HTTP
 * modules of @app/rt-features (`TeamUsersRealtimeHttpModule` first, then transcript shaping, facts, marks, issues),
 * as each manifest row flips from `table` to `controller` (route-ownership.spec.ts, R6).
 */
@Module({})
export class LocalRealtimeModule {}
