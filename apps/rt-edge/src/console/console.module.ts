import { Module } from '@nestjs/common';

import { KernelModule } from '../kernel/kernel.module';
import { OpsModule } from '../ops/ops.module';
import { StateModule } from '../state/state.module';
import { UplinkModule } from '../uplink/uplink.module';
import { BoxConsoleServer } from './box-console.server';

/**
 * console/: the localhost box console (box-console.server.ts), a sign-in-free page for whoever sits at the box.
 * Its own listener on 127.0.0.1 (not a LAN route): the LAN surface and its sign-in rules stay exactly as they are.
 * Uses STATE_PORT, KERNEL_PORT, UPLINK_PORT and OpsModule's TransmitterControl.
 */
@Module({
    imports: [StateModule, KernelModule, UplinkModule, OpsModule],
    providers: [BoxConsoleServer],
    exports: [BoxConsoleServer],
})
export class ConsoleModule {}
