import { MiddlewareConsumer, Module, NestModule, Provider, RequestMethod, Type } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AuthModule } from '../auth/auth.module';
import { KernelModule } from '../kernel/kernel.module';
import { OpsController } from '../ops/ops.controller';
import { OpsModule } from '../ops/ops.module';
import { CLOUD_RELAY, LAN_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { UplinkModule } from '../uplink/uplink.module';
import { CloudSignInForwarder } from './cloud-signin';
import { EdgeLocalController } from './edge-local.controller';
import { EdgePublicController } from './edge-public.controller';
import { LanExceptionFilter } from './lan-exception.filter';
import { LanGateway } from './lan.gateway';
import { RtCloudProxy } from './rt-data/cloud-proxy';
import { DEFAULT_RT_DATA_OPTIONS, RT_DATA_OPTIONS } from './rt-data/rt-data.options';
import { RtDataMiddleware } from './rt-data/rt-data.middleware';
import { RtDataService } from './rt-data/rt-data.service';
import { EdgeStaticFiles } from './static-files';

/**
 * Every box HTTP route of EDGE_ROUTES (contracts/routes.ts):
 * - EdgePublicController: `/edge-config.json`, `/edge/ping`, sign-in start, room-code and operator-code redemption;
 * - EdgeLocalController: me, sign-out, the dashboard, the status snapshot, room codes, the operator code;
 * - OpsController (ops/ops.controller.ts, `OPS_HTTP_ROUTES`): Status & troubleshooting and Transmitter. The ops module
 *   owns that HTTP layer (viewer-dependent readiness actions, the DR13 transmitter checks via TransmitterControl, audit
 *   rows with the client IP) and leaves it to the module that serves the box's HTTP surface to mount it: here.
 */
export const LAN_CONTROLLERS: Type<unknown>[] = [EdgePublicController, EdgeLocalController, OpsController];

/**
 * The gateway (also the LanPort), the app-wide contract error filter, the static FE server, and the RT data routes
 * (rt-data/: local reads, the allowlisted cloud proxy and its read cache; limits in RT_DATA_OPTIONS). The same
 * RtDataService is the CLOUD_RELAY port of the local API host (api/, Phase 4): one proxy, one cache, one budget.
 */
export const LAN_PROVIDERS: Provider[] = [
    LanGateway,
    { provide: LAN_PORT, useExisting: LanGateway },
    { provide: APP_FILTER, useClass: LanExceptionFilter },
    EdgeStaticFiles,
    CloudSignInForwarder,
    { provide: RT_DATA_OPTIONS, useValue: DEFAULT_RT_DATA_OPTIONS },
    RtCloudProxy,
    RtDataService,
    { provide: CLOUD_RELAY, useExisting: RtDataService },
];

/**
 * The FE bundle is served for every path the API does not own (EdgeStaticFiles skips the API paths itself); the RT
 * data routes answer their exact method + path under the cloud service bases (RtDataMiddleware passes everything
 * else on, so it still ends as `use_cloud` / `not_found` in LanExceptionFilter).
 */
export function configureLanMiddleware(consumer: MiddlewareConsumer): void {
    consumer.apply(EdgeStaticFiles, RtDataMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
}

/**
 * lan/ (spec §3.2, §8.1–§8.3, §8.7; CONTRACTS.md): the box's whole LAN surface on the one HTTPS origin —
 * `/edge-config.json`, `/edge/ping`, every `/edge/*` route of EDGE_ROUTES (LAN_CONTROLLERS), the FE `edge` bundle with
 * SPA fallback (EdgeStaticFiles), the contract error envelope for anything unanswered (LanExceptionFilter: `not_found`,
 * or `use_cloud` 403 under the cloud service bases of cloud-paths.ts), and the viewer socket.io gateway (LanGateway,
 * also LAN_PORT). The room-code / operator-code routes answer 404 `feature_disabled` while their switch is off (v1
 * default, DR23; auth/features.ts). Uses every other port, OpsModule's TransmitterControl, EDGE_EVENT_BUS, BOX_CONFIG,
 * EDGE_CLOCK. lan.stub.ts keeps the skeleton stub for the skeleton specs.
 *
 * The RT data routes (spec §8.2 rows 4, 6, 7; rt-data/rt-routes.ts `RT_ROUTES`): the session list, live session,
 * session detail, full transcript and feed pages of the box's sessions served locally (works offline), the case chip
 * from the cached assignments, the allowlisted mark / issue reads proxied to `cloud.realtimeApiUrl` with the caller's
 * edge token and a per-user read-through cache, and the allowlisted mark / issue writes (online only in v1, S-D6;
 * `503 offline` offline, `503 reauth` for box-signed tokens). Every other cloud path still answers `use_cloud`.
 */
@Module({
    imports: [StateModule, KernelModule, UplinkModule, AuthModule, OpsModule],
    controllers: LAN_CONTROLLERS,
    providers: LAN_PROVIDERS,
    exports: [LAN_PORT, CLOUD_RELAY],
})
export class LanModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        configureLanMiddleware(consumer);
    }
}
