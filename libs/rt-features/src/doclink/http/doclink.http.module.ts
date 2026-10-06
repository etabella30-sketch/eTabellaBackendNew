/**
 * The HTTP module of the DocLink routes (plan §3.4, Phase 8). `register({ operations, writes, mount })` binds the
 * operations port to the host's implementation (DocLinkService on live, the relay adapter on the box), the
 * host-bound writes port when the host has one (live only: the box's relay adapter answers the writes itself), and
 * mounts the controllers the host serves: 'live' = the three box rows AND the cloud-only docshared; 'rows' = the three
 * rows only (the manifest's `controller` rows; coreapi, which never served docshared, and the box).
 *
 * The writes class belongs to the HOST (realtime-server's or coreapi's DoclinkService, with the host's own
 * dependencies), so this module never instantiates it: DOCLINK_WRITES is a thin delegate that finds the host's own
 * instance in the application container at first call (ModuleRef, non-strict), the way platform-cloud finds the
 * host's DbService. No middleware, no global providers, no lifecycle, nothing thrown at construction (R3).
 */
import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { Caller } from '@app/api-kernel';

import type { DocLinkIdFields, DocLinkInsertFields } from '../dto/doclink.dto';
import { DOCLINK_OPS, DOCLINK_WRITES, DocLinkOperations, DocLinkWrites } from '../doclink.operations';
import { DocLinkController } from './doclink.controller';
import { DocLinkLiveController } from './doclink-live.controller';

export type DocLinkMount = 'live' | 'rows';

export interface DocLinkHttpOptions {
  /** The class bound to DOCLINK_OPS (resolved with this module's injector: it depends on kernel ports only). */
  readonly operations: Type<DocLinkOperations>;
  /** The host's own writes class (create / delete), found in the host's container at first call; omitted on the box. */
  readonly writes?: Type<DocLinkWrites>;
  /** Which controllers the host serves (see the top of this file). */
  readonly mount: DocLinkMount;
}

/** The controllers of each mount. */
export const DOCLINK_CONTROLLERS: Readonly<Record<DocLinkMount, readonly Type<unknown>[]>> = Object.freeze({
  live: Object.freeze([DocLinkController, DocLinkLiveController]),
  rows: Object.freeze([DocLinkController]),
});

/** DOCLINK_WRITES over the host's own instance of `writes`, looked up at first call (never at construction). */
export function hostWrites(ref: ModuleRef, writes: Type<DocLinkWrites>): DocLinkWrites {
  const target = (): DocLinkWrites => ref.get(writes, { strict: false });
  return {
    insert: (caller: Caller, body: DocLinkInsertFields) => target().insert(caller, body),
    remove: (caller: Caller, body: DocLinkIdFields) => target().remove(caller, body),
  };
}

@Module({})
export class DocLinkHttpModule {
  static register(options: DocLinkHttpOptions): DynamicModule {
    const providers: Provider[] = [{ provide: DOCLINK_OPS, useClass: options.operations }];
    if (options.writes) {
      const writes = options.writes;
      providers.push({ provide: DOCLINK_WRITES, useFactory: (ref: ModuleRef) => hostWrites(ref, writes), inject: [ModuleRef] });
    }
    return {
      module: DocLinkHttpModule,
      controllers: [...DOCLINK_CONTROLLERS[options.mount]],
      providers,
    };
  }
}
