/**
 * The HTTP module of the issue and claim box rows (plan §3.4, Phase 9). `register({ operations })` binds the
 * operations port to the host's implementation (IssuesService on live, the relay adapter on the box) and mounts the
 * shared controller. No middleware, no global providers, no lifecycle (R3): the host binds its auth middleware by
 * controller class and provides the kernel ports the guards and the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { ISSUES_OPS, IssuesOperations } from '../issues.operations';
import { IssuesController } from './issues.controller';

export interface IssuesHttpOptions {
  /** The class bound to ISSUES_OPS (resolved with the host's injector). */
  readonly operations: Type<IssuesOperations>;
}

@Module({})
export class IssuesHttpModule {
  static register(options: IssuesHttpOptions): DynamicModule {
    return {
      module: IssuesHttpModule,
      controllers: [IssuesController],
      providers: [{ provide: ISSUES_OPS, useClass: options.operations }],
    };
  }
}
