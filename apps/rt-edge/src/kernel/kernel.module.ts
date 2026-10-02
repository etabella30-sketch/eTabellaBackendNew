import { Module } from '@nestjs/common';

import { KERNEL_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { EdgeKernel } from './edge-kernel';

/**
 * kernel/ (spec §3.2): libs/rt-ingest (listen + dial transmitter link, journal, worker, recovery) wired with the
 * SQLite checkpoint store and the edge-sync cutter, behind KERNEL_PORT (ports/kernel.port.ts).
 * Uses: STATE_PORT, EDGE_EVENT_BUS, BOX_CONFIG, EDGE_CLOCK (and the optional KERNEL_OPTIONS seam for specs).
 * In 'cli' run mode nothing is started (the lifecycle never calls `start`), so no socket is opened.
 */
@Module({
    imports: [StateModule],
    providers: [{ provide: KERNEL_PORT, useClass: EdgeKernel }],
    exports: [KERNEL_PORT],
})
export class KernelModule {}
