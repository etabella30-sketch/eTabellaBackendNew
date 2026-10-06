/**
 * The local API host of the venue box (Phase 4 of the shared-libraries plan, plan §3.4): `/authapi`, `/coreapi` and
 * `/realtimeapi` exist as Nest router prefixes on the box's one origin and port, so the shared feature HTTP modules of
 * @app/rt-features can be mounted under them from Phase 5 on, exactly as the live apps mount them behind nginx.
 *
 * In Phase 4 the three modules are empty and the RT data table (lan/rt-data, RtDataMiddleware, bound by LanModule
 * before this module) still answers every route it answered: the middleware order is LAN (static files, then the
 * table) first, then this module's path hygiene and request context, then the Nest router; a request no controller
 * answers still ends in LanExceptionFilter as `403 use_cloud`. Nothing observable changes until a manifest row flips
 * from `table` to `controller` (R6, route-ownership.spec.ts).
 *
 * R7: imported by AppModule in `serve` mode only, after LanModule; depends only on AuthModule, LanModule and the
 * global EdgeCoreModule (through EdgeApiPlatformModule); nothing on the kernel side depends on it. R3: no provider
 * here has a lifecycle hook (api.boot.spec.ts).
 */
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { RouterModule, Routes } from '@nestjs/core';

import { EdgeApiPlatformModule } from './adapters/edge-api-platform.module';
import { ApiContextMiddleware } from './api-context';
import { ApiPathHygieneMiddleware } from './api-path-hygiene.middleware';
import { LOCAL_AUTH_FEATURE_MODULES, LocalAuthModule } from './auth/local-auth.module';
import { LOCAL_CORE_FEATURE_MODULES, LocalCoreModule } from './core/local-core.module';
import { LOCAL_REALTIME_FEATURE_MODULES, LocalRealtimeModule } from './realtime/local-realtime.module';

/**
 * One module class per URL family (a Nest module mounts under one prefix only), the prefixes as nginx strips them
 * live. The shared feature modules each family imports are its router `children`: a RouterModule prefix reaches
 * the routed module and its listed children, never the modules it merely imports.
 */
export const LOCAL_API_ROUTES: Routes = [
    { path: 'authapi', module: LocalAuthModule, children: [...LOCAL_AUTH_FEATURE_MODULES] },
    { path: 'coreapi', module: LocalCoreModule, children: [...LOCAL_CORE_FEATURE_MODULES] },
    { path: 'realtimeapi', module: LocalRealtimeModule, children: [...LOCAL_REALTIME_FEATURE_MODULES] },
];

/** The family modules and their router registration (the LAN test kit mounts the same over its fakes). */
export const LOCAL_API_IMPORTS = [LocalAuthModule, LocalCoreModule, LocalRealtimeModule, RouterModule.register(LOCAL_API_ROUTES)];

/**
 * Path hygiene, then the request context, on every request (each one skips paths outside the three families). Bound
 * on `*` like the LAN middleware: a string route would not see `..`, `%2e` or an empty segment the same way Express
 * does, and the hygiene rule must see the raw target.
 */
export function configureLocalApiMiddleware(consumer: MiddlewareConsumer): void {
    consumer.apply(ApiPathHygieneMiddleware, ApiContextMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
}

@Module({
    imports: [EdgeApiPlatformModule, ...LOCAL_API_IMPORTS],
})
export class LocalApiModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        configureLocalApiMiddleware(consumer);
    }
}
