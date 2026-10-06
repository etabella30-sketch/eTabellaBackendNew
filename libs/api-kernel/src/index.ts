/**
 * @app/api-kernel — the ports, guards, errors and base DTO pieces every shared feature builds on, loaded alike by
 * authapi, coreapi, realtime-server and the venue box (apps/rt-edge). Plan: shared-libs §3.2, §3.3, invariants R2–R4.
 *
 * HARD RULE (api-kernel.purity.spec.ts): the sources import only each other, @nestjs/common, @nestjs/core,
 * class-validator, class-transformer, rxjs, reflect-metadata and express TYPES. No @app/global, pg, ioredis, kafkajs,
 * @nestjs/config, @nestjs/microservices, @nestjs/swagger, jsonwebtoken, fs or net: the box has none of them. No
 * process.env, no ConfigService, no module side effects; a provider never throws at construction.
 */
export * from './errors';
export * from './route-id';
export * from './caller';
export * from './caller.guard';
export * from './case-access';
export * from './case-access.guard';
export * from './storage';
export * from './events';
export * from './is-it-uuid';
export * from './actor-fields';
export * from './domain-error.filter';
export * from './http-error.filter';
export * from './mark-write';
