/**
 * The HTTP module of the documents feature, for the coreapi URL family's `bundles/*` paths (plan §3.4): realtime-server
 * mounts it under its own prefix (the cloudPath the box relays to), the box under /coreapi. `register({ operations,
 * fileAccessGuard })` binds the operations port to the host's implementation (DocumentsService on live, the relay
 * adapter on the box) and the service's one option. coreapi does NOT mount it: its BundlesController keeps the HTTP
 * surface (DTOs, Swagger, API-usage log) and binds DocumentsService itself. No middleware, no global providers, no
 * lifecycle (R3): the host binds its auth middleware by controller class and provides the kernel ports the guards and
 * the filter resolve.
 */
import { DynamicModule, Module, Type } from '@nestjs/common';

import { DOCUMENTS_OPS, DocumentsOperations } from '../documents.operations';
import { DOCUMENTS_OPTIONS, DocumentsOptions } from '../documents.service';
import { DocumentsController } from './documents.controller';

export interface DocumentsHttpOptions {
  /** The class bound to DOCUMENTS_OPS (resolved with the host's injector). */
  readonly operations: Type<DocumentsOperations>;
  /** DocumentsOptions.fileAccessGuard for the live executor (ignored by a relay). Default off, as coreapi's env flag. */
  readonly fileAccessGuard?: boolean;
}

@Module({})
export class DocumentsHttpModule {
  static register(options: DocumentsHttpOptions): DynamicModule {
    const documentsOptions: DocumentsOptions = { fileAccessGuard: options.fileAccessGuard === true };
    return {
      module: DocumentsHttpModule,
      controllers: [DocumentsController],
      providers: [
        { provide: DOCUMENTS_OPS, useClass: options.operations },
        { provide: DOCUMENTS_OPTIONS, useValue: documentsOptions },
      ],
    };
  }
}
