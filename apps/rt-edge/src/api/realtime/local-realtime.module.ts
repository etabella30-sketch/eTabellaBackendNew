import { Module, Type } from '@nestjs/common';

/** The shared feature HTTP modules mounted under /realtimeapi (router children of this module); none yet. */
export const LOCAL_REALTIME_FEATURE_MODULES: Type<unknown>[] = [];

/**
 * `/realtimeapi` on the box (api.module.ts mounts it under that prefix). Empty in Phase 4: every realtimeapi row of
 * ROUTE_MANIFEST is still a table row (RtDataMiddleware) or `use_cloud`. From Phase 5 it imports the realtime HTTP
 * modules of @app/rt-features (`TeamUsersRealtimeHttpModule` first, then transcript shaping, facts, marks, issues),
 * as each manifest row flips from `table` to `controller` (route-ownership.spec.ts, R6).
 */
@Module({})
export class LocalRealtimeModule {}
