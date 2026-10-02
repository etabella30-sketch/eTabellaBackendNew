import { Module } from '@nestjs/common';

import { KernelModule } from '../kernel/kernel.module';
import { UPLINK_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { EdgeUplink } from './edge-uplink';

/**
 * uplink/ (spec §3.2): socket.io-client to the cloud `/edge` namespace — hello, rounds, raw lane, RECOVER, seal,
 * assignments, revocations, enrolment, held-capture upload, the LAN certificate — behind UPLINK_PORT
 * (ports/uplink.port.ts). Uses: STATE_PORT, KERNEL_PORT, EDGE_EVENT_BUS, BOX_CONFIG, EDGE_CLOCK, EDGE_RUN_MODE (and the
 * optional UPLINK_OPTIONS seam for specs). Constructing it does no I/O; in 'cli' run mode `start` is never called and
 * only `enrol`, `certificate` and a one-shot `uploadCapture` connection are used.
 */
@Module({
    imports: [StateModule, KernelModule],
    providers: [{ provide: UPLINK_PORT, useClass: EdgeUplink }],
    exports: [UPLINK_PORT],
})
export class UplinkModule {}
