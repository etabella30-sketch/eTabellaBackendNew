/**
 * EdgeModule: the cloud side of the RT venue edge box (spec docs/rt-local-edge-spec.md rev 3 §3.2 "RS/edge",
 * §5, §7; ledger D5 — 7 files: this module, edge-uplink.gateway, edge-auth.middleware, edge-sync.service,
 * edge-raw-store.service, edge-registry.service, edge.controller; plus edge-apply.port, the one seam to the
 * page store, and the shared edge.types / edge.dto).
 *
 * Imported by RealtimeServerModule. Off unless EDGE_ENABLED=1/true: /edge is not attached and every edge
 * route answers 503, so importing it changes nothing for today's hearings.
 *
 * Exports EDGE_ASSIGN_PUSH (transcript-completeness/edge-assign-push.ts): SessionService uses it to push
 * c.assign{op:'end'} to a box when RT Production ends a venue session. EdgeRegistryService (exported) also offers
 * `pushSessionUpsert(nEdgeid, nSesid)` for EclipseSessionService's 'E' create (spec §4.2 step 5).
 * EDGE_OPTIONS (timings, rate limits, maxPart, clock) and EDGE_ARCHIVE_PORT / EDGE_CERT_ISSUER /
 * EDGE_ASN_RESOLVER / EDGE_ALERT_POST are optional injection tokens: absent in production today (defaults).
 *
 * Providers it does not own are reached without importing their module (which would be circular):
 * - the live FeedDataService / SessionService / EclipseSessionService are the instances BESIDE EventsGateway,
 *   found through ModulesContainer when the apply port is first used (edge-apply.port.ts);
 * - the shared socket.io server comes from WebSocketModule ('WEB_SOCKET_SERVER', AppGateway).
 * DbService (own pool, as TranscriptModule does) and RedisDbService (the global ioredis connection) are
 * provided here for the services and for RealtimeAuthMiddleware, which guards the admin and session routes.
 */
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { RouteInfo } from '@nestjs/common/interfaces';

import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { WebSocketModule } from '@app/global/modules/websocket.module';

import { RealtimeAdminMiddleware, RealtimeAuthMiddleware } from '../middleware/realtime-auth.middleware';
import { EDGE_ASSIGN_PUSH, EdgeAssignPush } from '../services/transcript-completeness/edge-assign-push';
import { EDGE_APPLY_PORT, FeedDataApplyAdapter, resolveLiveFeedTargets } from './edge-apply.port';
import { EdgeAuthService } from './edge-auth.middleware';
import { EdgeRawStoreService } from './edge-raw-store.service';
import { EdgeRegistryService, SocketServerHolder } from './edge-registry.service';
import { EdgeSyncService } from './edge-sync.service';
import { EdgeUplinkGateway } from './edge-uplink.gateway';
import { EdgeController } from './edge.controller';

const get = (path: string): RouteInfo => ({ path, method: RequestMethod.GET });
const post = (path: string): RouteInfo => ({ path, method: RequestMethod.POST });

/** Venue boxes admin: login + global admin. */
export const EDGE_ADMIN_ROUTES: RouteInfo[] = [
    get('edge/admin/list'),
    get('edge/admin/get'),
    post('edge/admin/create'),
    post('edge/admin/enroll-code'),
    post('edge/admin/confirm-key'),
    post('edge/admin/quarantine'),
    post('edge/admin/revoke'),
    post('edge/admin/cases'),
    get('edge/admin/assignments'),
    get('edge/admin/status'),
    get('edge/admin/orphans'),
    post('edge/admin/resolve'),
    get('edge/admin/events'),
    get('edge/admin/shrink'),
    post('edge/admin/shrink'),
    post('session/forceseal'),
];

/** Session routes: login (the role is checked by the controller and the SPs). */
export const EDGE_SESSION_ROUTES: RouteInfo[] = [
    post('session/edge/split'),
    post('session/edge/direct'),
    post('session/warnack'),
    get('session/feedstatus'),
];

/** Device routes: no user token (public + rate-limited, or device-signed). */
export const EDGE_DEVICE_ROUTES: RouteInfo[] = [
    get('edge/v1/challenge'),
    post('edge/v1/enroll'),
    post('edge/v1/cert'),
    post('edge/v1/archive-url'),
];

@Module({
    imports: [WebSocketModule],
    controllers: [EdgeController],
    providers: [
        DbService,
        QueryBuilderService,
        RedisDbService,
        EdgeRegistryService,
        EdgeAuthService,
        EdgeRawStoreService,
        EdgeSyncService,
        EdgeUplinkGateway,
        {
            provide: EDGE_APPLY_PORT,
            useFactory: (modules: ModulesContainer, ws: SocketServerHolder) =>
                new FeedDataApplyAdapter(() => ({ ...resolveLiveFeedTargets(modules), io: (ws?.server as any) ?? null })),
            inject: [ModulesContainer, 'WEB_SOCKET_SERVER'],
        },
        {
            provide: EDGE_ASSIGN_PUSH,
            useFactory: (registry: EdgeRegistryService, sync: EdgeSyncService): EdgeAssignPush => (nEdgeid, assign) => {
                if (assign?.op === 'end') sync.noteSyncState(assign.nSesid, 'S');
                return registry.pushAssign(nEdgeid, assign);
            },
            inject: [EdgeRegistryService, EdgeSyncService],
        },
    ],
    exports: [EDGE_ASSIGN_PUSH, EdgeRegistryService, EdgeRawStoreService, EdgeSyncService],
})
export class EdgeModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RealtimeAuthMiddleware).forRoutes(...EDGE_ADMIN_ROUTES, ...EDGE_SESSION_ROUTES);
        // Registered after the auth middleware above, which sets req.user (fails closed without it).
        consumer.apply(RealtimeAdminMiddleware).forRoutes(...EDGE_ADMIN_ROUTES);
    }
}
