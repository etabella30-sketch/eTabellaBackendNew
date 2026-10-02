import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { KernelModule } from '../kernel/kernel.module';
import { OPS_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { UplinkModule } from '../uplink/uplink.module';
import { DEFAULT_OPS_TUNING, OPS_TUNING } from './ops.constants';
import { NODE_OPS_TIMERS, NodeOpsHost, OPS_HOST, OPS_TIMERS } from './ops-host';
import { OpsService } from './ops.service';
import { TransmitterControl } from './transmitter';

/**
 * ops/ (spec §3.2): status, chips, readiness (DR15), the ranked verdict (DR12), network checks, "This box",
 * diagnostics, reporter card, metrics, retention and clock checks, behind OPS_PORT (ports/ops.port.ts).
 * Uses: STATE_PORT, KERNEL_PORT, UPLINK_PORT, AUTH_PORT, EDGE_EVENT_BUS, EDGE_BOOT_STATUS, BOX_CONFIG, EDGE_CLOCK.
 * Host probes (OPS_HOST), timers (OPS_TIMERS) and tunables (OPS_TUNING) are local tokens specs override.
 *
 * HTTP: the LAN module owns every box route (ports/lan.port.ts), so this module registers NO controller.
 * `OpsController` (ops.controller.ts, routes `OPS_HTTP_ROUTES`, CONTRACTS.md §4 rows 18–33) and `TransmitterControl`
 * (exported) are the ops-side HTTP layer; lan/lan.module.ts mounts `OpsController` in `LAN_CONTROLLERS` (never also
 * here: duplicate routes).
 */
@Module({
    imports: [StateModule, KernelModule, UplinkModule, AuthModule],
    providers: [
        { provide: OPS_HOST, useClass: NodeOpsHost },
        { provide: OPS_TIMERS, useValue: NODE_OPS_TIMERS },
        { provide: OPS_TUNING, useValue: DEFAULT_OPS_TUNING },
        TransmitterControl,
        { provide: OPS_PORT, useClass: OpsService },
    ],
    exports: [OPS_PORT, TransmitterControl],
})
export class OpsModule {}
