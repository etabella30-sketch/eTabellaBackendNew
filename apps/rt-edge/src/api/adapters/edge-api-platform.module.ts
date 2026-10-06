/**
 * The box's bindings of the @app/api-kernel ports (plan §3.3 "Bindings per host", rt-edge column): what a shared
 * controller mounted on the local API host resolves CALLER_RESOLVER, CASE_ACCESS, ERROR_ENVELOPE and EVENT_DELIVERY
 * to, plus the box-only CLOUD_RELAY (LanModule's RtDataService) for the relay adapters. SP_EXECUTOR and ROW_QUERY
 * are deliberately NOT bound: the box has no database, and a feature that needs one is relayed (R2, R5).
 *
 * Providers only, no lifecycle hooks, no middleware, nothing started (R3); imports only AuthModule (AUTH_PORT) and
 * LanModule (CLOUD_RELAY), which it re-exports so a feature module importing this one sees every port it needs (R7).
 */
import { Module, Provider } from '@nestjs/common';
import { CALLER_RESOLVER, CASE_ACCESS, ERROR_ENVELOPE, EVENT_DELIVERY } from '@app/api-kernel';

import { AuthModule } from '../../auth/auth.module';
import { LanModule } from '../../lan/lan.module';
import { EdgeCallerResolver } from './edge-caller.resolver';
import { EdgeCaseAccess } from './edge-case-access';
import { EdgeEnvelope } from './edge-envelope';
import { EdgeEventDelivery } from './edge-event-delivery';

/** The adapter classes and the port tokens bound to them (the LAN test kit mounts the same list over its fakes). */
export const EDGE_API_PLATFORM_PROVIDERS: Provider[] = [
    EdgeCallerResolver,
    { provide: CALLER_RESOLVER, useExisting: EdgeCallerResolver },
    EdgeCaseAccess,
    { provide: CASE_ACCESS, useExisting: EdgeCaseAccess },
    EdgeEnvelope,
    { provide: ERROR_ENVELOPE, useExisting: EdgeEnvelope },
    EdgeEventDelivery,
    { provide: EVENT_DELIVERY, useExisting: EdgeEventDelivery },
];

export const EDGE_API_PLATFORM_PORTS = [CALLER_RESOLVER, CASE_ACCESS, ERROR_ENVELOPE, EVENT_DELIVERY] as const;

@Module({
    imports: [AuthModule, LanModule],
    providers: EDGE_API_PLATFORM_PROVIDERS,
    exports: [...EDGE_API_PLATFORM_PORTS, AuthModule, LanModule],
})
export class EdgeApiPlatformModule {}
