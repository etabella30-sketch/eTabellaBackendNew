/**
 * The HTTP module of the Full Fact editor, for the realtimeapi URL family (plan §3.4). `register({ operations,
 * mount })` binds the operations port to the host's implementation (FactsheetService on live, the relay adapter on
 * the box) and mounts the controllers the host serves: 'live' = the eight box rows AND the cloud-only routes;
 * 'box' = the eight rows only, the manifest's `controller` rows (route-ownership.spec.ts, R6). No middleware, no
 * global providers, no lifecycle (R3): the host binds its auth middleware by controller class and provides the
 * kernel ports the guards, the filter and @MarkWrite resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { FACTSHEET_OPS, FactsheetOperations } from '../factsheet.operations';
import { FactsheetController } from './factsheet.controller';
import { FactsheetLiveController } from './factsheet-live.controller';

export type FactsheetMount = 'live' | 'box';

export interface FactsheetHttpOptions {
  /** The class bound to FACTSHEET_OPS (resolved with the host's injector). */
  readonly operations: Type<FactsheetOperations>;
  /** Which controllers the host serves (see the top of this file). */
  readonly mount: FactsheetMount;
}

/** The controllers of each mount. */
export const FACTSHEET_CONTROLLERS: Readonly<Record<FactsheetMount, readonly Type<unknown>[]>> = Object.freeze({
  live: Object.freeze([FactsheetController, FactsheetLiveController]),
  box: Object.freeze([FactsheetController]),
});

@Module({})
export class FactsheetRealtimeHttpModule {
  static register(options: FactsheetHttpOptions): DynamicModule {
    return {
      module: FactsheetRealtimeHttpModule,
      controllers: [...FACTSHEET_CONTROLLERS[options.mount]],
      providers: [{ provide: FACTSHEET_OPS, useClass: options.operations }],
    };
  }
}
