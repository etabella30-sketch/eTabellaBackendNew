/**
 * The HTTP module of the Mark Navigator's box rows (plan §3.4, Phase 8). `register({ operations })` binds the
 * operations port to the host's implementation (MarkNavigatorService on live, the relay adapter on the box) and
 * mounts the shared controller. The same class serves realtime-server, coreapi and the box's /realtimeapi: a module
 * class mounts under one RouterModule prefix per application, and each application mounts it once. No middleware,
 * no global providers, no lifecycle (R3): the host binds its auth middleware by controller class and provides the
 * kernel ports the guards and the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { MARK_NAVIGATOR_OPS, MarkNavigatorOperations } from '../marknav.operations';
import { MarkNavigatorController } from './marknav.controller';

export interface MarkNavigatorHttpOptions {
  /** The class bound to MARK_NAVIGATOR_OPS (resolved with the host's injector). */
  readonly operations: Type<MarkNavigatorOperations>;
}

@Module({})
export class MarkNavigatorHttpModule {
  static register(options: MarkNavigatorHttpOptions): DynamicModule {
    return {
      module: MarkNavigatorHttpModule,
      controllers: [MarkNavigatorController],
      providers: [{ provide: MARK_NAVIGATOR_OPS, useClass: options.operations }],
    };
  }
}
