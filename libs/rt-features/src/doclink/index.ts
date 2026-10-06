/**
 * @app/rt-features/doclink: the DocLink routes, one shared controller set for realtime-server, coreapi and the venue
 * box's relay (plan Phase 8): the three box rows (insertdoc, docdelete, docdetail) and the cloud-only docshared. The
 * reads have one implementation (DocLinkService); the writes stay host-bound (DOCLINK_WRITES) until the two create
 * gates and the two et_doc_delete variants are reconciled with approval. Hosts import this folder alias, never the
 * lib root.
 */
export * from './dto/doclink.dto';
export * from './doclink.operations';
export * from './doclink.service';
export * from './http/doclink.controller';
export * from './http/doclink-live.controller';
export * from './http/doclink.http.module';
export * from './http/legacy-shapes';
