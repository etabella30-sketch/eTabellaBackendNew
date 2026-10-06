/**
 * The HTTP modules of the code-tables feature, one per URL family because a Nest module class mounts under one
 * RouterModule prefix only (plan §3.4): coreapi (and the box's /coreapi) mount CodeTableCoreHttpModule,
 * realtime-server mounts CodeTableRealtimeHttpModule. Each `register({ operations })` binds the operations port to
 * the host's implementation: CodeTableService on live, the relay adapter on the box. No middleware, no global
 * providers, no lifecycle (R3): the host binds its own auth middleware by controller class and provides the kernel
 * ports (CALLER_RESOLVER, ERROR_ENVELOPE) the guard and the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { CODE_TABLE_OPS, CodeTableOperations } from '../code-tables.operations';
import { CoreCodeTableController, RealtimeCodeTableController } from './code-tables.controllers';

export interface CodeTableHttpOptions {
  /** The class bound to CODE_TABLE_OPS (resolved with the host's injector). */
  readonly operations: Type<CodeTableOperations>;
}

@Module({})
export class CodeTableCoreHttpModule {
  static register(options: CodeTableHttpOptions): DynamicModule {
    return {
      module: CodeTableCoreHttpModule,
      controllers: [CoreCodeTableController],
      providers: [{ provide: CODE_TABLE_OPS, useClass: options.operations }],
    };
  }
}

@Module({})
export class CodeTableRealtimeHttpModule {
  static register(options: CodeTableHttpOptions): DynamicModule {
    return {
      module: CodeTableRealtimeHttpModule,
      controllers: [RealtimeCodeTableController],
      providers: [{ provide: CODE_TABLE_OPS, useClass: options.operations }],
    };
  }
}
