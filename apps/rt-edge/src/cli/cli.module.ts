import { Module } from '@nestjs/common';

import { KernelModule } from '../kernel/kernel.module';
import { CLI_PORT } from '../ports';
import { StateModule } from '../state/state.module';
import { UplinkModule } from '../uplink/uplink.module';
import { EdgeCli } from './edge-cli';

/**
 * cli/ (spec §3.2): `enroll`, `status`, `recover --journal`, `capture list|upload`, behind CLI_PORT
 * (ports/cli.port.ts). Runs in an application context with EDGE_RUN_MODE 'cli'.
 * Uses: STATE_PORT, UPLINK_PORT, BOX_CONFIG, EDGE_CLOCK (and the optional CLI_OPTIONS seam for specs). The kernel is
 * imported for the module graph only: `recover` replays a journal copy with rt-ingest directly, never the kernel.
 */
@Module({
    imports: [StateModule, KernelModule, UplinkModule],
    providers: [{ provide: CLI_PORT, useClass: EdgeCli }],
    exports: [CLI_PORT],
})
export class CliModule {}
