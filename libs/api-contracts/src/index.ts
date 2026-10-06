/**
 * @app/api-contracts — pure data shared by every host and exported to the FE: the route manifest, the error-code
 * tables and the response shapes of the shared RT features.
 *
 * HARD RULE (api-contracts.purity.spec.ts): no Nest, no class-validator, no I/O, no clock, no `@app/*` except a
 * type-only import of @app/api-kernel. The box bundle and the FE JSON export (tools/ci/export-route-manifest.js,
 * Phase 3) must be able to read this lib without pulling a framework in, and api-kernel may import it in return
 * without a cycle at runtime.
 */
export * from './route-manifest.types';
export * from './route-manifest.invariants';
export * from './route-manifest';
export * from './error-codes';
export * from './responses/team-users';
