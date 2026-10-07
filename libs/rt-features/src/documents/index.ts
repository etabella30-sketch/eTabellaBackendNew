/**
 * @app/rt-features/documents: the document reads behind the RT page's DocLink picker and document dock (the Evidence
 * bundle tree, folder documents and search, the section index, one file's data), one implementation for coreapi's
 * BundlesController, realtime-server's `bundles/*` (mounted for the venue box) and the box's /coreapi relay (plan
 * Phase 10c, D12). Hosts import this folder alias, never the lib root.
 */
export * from './dto/documents.dto';
export * from './documents.operations';
export * from './documents.service';
export * from './http/documents.controller';
export * from './http/legacy-shapes';
export * from './http/documents.http.module';
