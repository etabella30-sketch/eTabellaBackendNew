/**
 * @app/platform-cloud — LIVE ONLY. The adapters that bind the @app/api-kernel ports to the cloud's infrastructure
 * (the host's pg DbService, its Kafka client, the HttpErrorFilter body) for authapi, coreapi and realtime-server, and
 * the one @Global() module that registers them. Shared-libraries plan §3.2, §3.3 and Phase 1 (2026-10-06).
 *
 * HARD RULE (platform-cloud.purity.spec.ts): the only lib allowed to import @app/global and the live packages (pg,
 * ioredis, kafkajs, @nestjs/*), and the one lib apps/rt-edge may never import (its boundary spec refuses it). It
 * imports no apps/ (R1), reads no process.env or ConfigService, registers nothing app-wide, and none of its providers
 * throws at construction (R3): the host's services are found at first use.
 */
export * from './host-services';
export * from './pg-sp-executor';
export * from './pg-row-query';
export * from './stamped-caller.resolver';
export * from './pg-case-access';
export * from './legacy-envelope';
export * from './event-delivery';
export * from './cloud-platform.module';
export * from './dto-docs';
