import { Module, Provider } from '@nestjs/common';

import { KernelModule } from '../kernel/kernel.module';
import { ACCESS_PORT, AUTH_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { UplinkModule } from '../uplink/uplink.module';
import { EdgeAccessService } from './access.service';
import { EdgeAuthService } from './auth.service';

/** The two auth ports. Exported so specs (and the LAN's spec harness) wire exactly what the module wires. */
export const AUTH_PROVIDERS: Provider[] = [
    { provide: AUTH_PORT, useClass: EdgeAuthService },
    { provide: ACCESS_PORT, useClass: EdgeAccessService },
];

/**
 * auth/ (spec §3.2, §4.10, §8.4): offline edge-token verification with the cached cloud keys, box-signed room-code and
 * operator tokens, roster checks, revocations and the sign-out denylist, room codes (issue, redeem with device
 * binding, revoke, end access, re-issue) and the daily operator code (sign-in, status, online relay), behind
 * AUTH_PORT (EdgeAuthService) and ACCESS_PORT (EdgeAccessService); ports/auth.port.ts.
 * Uses: STATE_PORT, KERNEL_PORT (live session phase), UPLINK_PORT (operator-code relay), EDGE_EVENT_BUS, BOX_CONFIG,
 * EDGE_CLOCK. auth.stub.ts keeps the skeleton stubs for the skeleton specs.
 *
 * v1 ships with both code sign-ins switched off (`BoxConfig.features`, DR23, features.ts): the online email sign-in is
 * then the only way in, box-signed tokens are not accepted and every room-code / operator-code method answers 404
 * `feature_disabled`.
 */
@Module({
    imports: [StateModule, KernelModule, UplinkModule],
    providers: AUTH_PROVIDERS,
    exports: [AUTH_PORT, ACCESS_PORT],
})
export class AuthModule {}
