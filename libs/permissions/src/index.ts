/**
 * @app/permissions — the permission rules shared by authapi, coreapi, realtime-server and the venue box
 * (apps/rt-edge), so a rule lives once: team scope, case membership, the Case Admin role. Shared-libraries plan
 * §3.2 and §3.6 (2026-10-06).
 *
 * HARD RULE (permissions.purity.spec.ts, invariant R2): the sources import only each other, @app/api-kernel and the
 * box-safe packages (@nestjs/common, @nestjs/core, class-validator, class-transformer, rxjs, reflect-metadata,
 * express types). No @app/global, pg, ioredis, kafkajs, @nestjs/config, @nestjs/swagger, jsonwebtoken, fs, net,
 * apps/, process.env or clock. Storage is reached only through the api-kernel ports a host binds.
 *
 * The contract spec template is test code and is reached as '@app/permissions/team-scope.contract', not from here,
 * so no app bundle carries jest globals.
 */
export * from './case-admin';
export * from './case-membership';
export * from './fact-visibility';
export * from './fact-audience';
export * from './mark-audience';
export * from './fact-create';
export * from './quick-mark';
export * from './doclink';
export * from './team-scope';
