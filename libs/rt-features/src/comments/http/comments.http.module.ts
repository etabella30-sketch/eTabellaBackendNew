/**
 * The HTTP module of the fact comments, for the coreapi URL family (plan §3.4; realtime-server mounts the same two
 * box rows under its own prefix, since the box relays them there). `register({ operations, mount })` binds the
 * operations port to the host's implementation (CommentsService on live, the relay adapter on the box) and mounts
 * the controllers the host serves: 'live' = the two box rows AND the commenters / edit / delete routes (coreapi);
 * 'box' = the two rows only, the manifest's `controller` rows (realtime-server and the box; route-ownership.spec.ts,
 * R6). No middleware, no global providers, no lifecycle (R3): the host binds its auth middleware by controller class
 * and provides the kernel ports the guards and the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { COMMENTS_OPS, CommentsOperations } from '../comments.operations';
import { CommentsController, CommentsLiveController } from './comments.controllers';

export type CommentsMount = 'live' | 'box';

export interface CommentsHttpOptions {
  /** The class bound to COMMENTS_OPS (resolved with the host's injector). */
  readonly operations: Type<CommentsOperations>;
  /** Which controllers the host serves (see the top of this file). */
  readonly mount: CommentsMount;
}

/** The controllers of each mount. */
export const COMMENTS_CONTROLLERS: Readonly<Record<CommentsMount, readonly Type<unknown>[]>> = Object.freeze({
  live: Object.freeze([CommentsController, CommentsLiveController]),
  box: Object.freeze([CommentsController]),
});

@Module({})
export class CommentsHttpModule {
  static register(options: CommentsHttpOptions): DynamicModule {
    return {
      module: CommentsHttpModule,
      controllers: [...COMMENTS_CONTROLLERS[options.mount]],
      providers: [{ provide: COMMENTS_OPS, useClass: options.operations }],
    };
  }
}
