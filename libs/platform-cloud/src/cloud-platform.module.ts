/**
 * The live hosts' binding of the api-kernel ports (plan §3.5): authapi, coreapi and realtime-server (and download /
 * export, which mount coreapi's CommonModule) add `CloudPlatformModule.forRoot({ envelope })` to their root module,
 * and every shared controller then finds SP_EXECUTOR, ROW_QUERY, CALLER_RESOLVER, CASE_ACCESS, EVENT_DELIVERY and
 * ERROR_ENVELOPE. @Global(), so the feature HTTP modules need no import of their own. Providers only (R3): no
 * consumer.apply, no APP_* registration, no ConfigService or process.env, and nothing throws at construction: the
 * host's DbService and Kafka client are found at first use (host-services.ts), so no second pool is ever opened.
 * No app imports this module yet (Phase 1); the first consumer is Phase 5's team-users slice.
 */
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import {
  CALLER_RESOLVER,
  CASE_ACCESS,
  ERROR_ENVELOPE,
  ErrorEnvelope,
  EVENT_DELIVERY,
  ROW_QUERY,
  RowQuery,
  SP_EXECUTOR,
} from '@app/api-kernel';
import { KafkaNotificationEventDelivery } from './event-delivery';
import { hostDbOf, hostKafkaOf } from './host-services';
import { LegacyEnvelope } from './legacy-envelope';
import { PgCaseAccess } from './pg-case-access';
import { PgRowQuery } from './pg-row-query';
import { PgSpExecutor } from './pg-sp-executor';
import { StampedCallerResolver } from './stamped-caller.resolver';

export interface CloudPlatformOptions {
  /** The host's error envelope; a plain LegacyEnvelope (no per-route legacyShape) when omitted. */
  readonly envelope?: ErrorEnvelope;
}

/** The port tokens this module binds, in one place for the host and ownership specs. */
export const CLOUD_PLATFORM_TOKENS: readonly string[] = Object.freeze([
  SP_EXECUTOR,
  ROW_QUERY,
  CALLER_RESOLVER,
  CASE_ACCESS,
  EVENT_DELIVERY,
  ERROR_ENVELOPE,
]);

@Global()
@Module({})
export class CloudPlatformModule {
  static forRoot(options: CloudPlatformOptions = {}): DynamicModule {
    const envelope: ErrorEnvelope = options.envelope ?? new LegacyEnvelope();
    return {
      module: CloudPlatformModule,
      providers: [
        { provide: SP_EXECUTOR, useFactory: (ref: ModuleRef) => new PgSpExecutor(hostDbOf(ref)), inject: [ModuleRef] },
        { provide: ROW_QUERY, useFactory: (ref: ModuleRef) => new PgRowQuery(hostDbOf(ref)), inject: [ModuleRef] },
        { provide: CALLER_RESOLVER, useClass: StampedCallerResolver },
        { provide: CASE_ACCESS, useFactory: (rows: RowQuery) => new PgCaseAccess(rows), inject: [ROW_QUERY] },
        {
          provide: EVENT_DELIVERY,
          useFactory: (ref: ModuleRef) => new KafkaNotificationEventDelivery(hostKafkaOf(ref)),
          inject: [ModuleRef],
        },
        { provide: ERROR_ENVELOPE, useValue: envelope },
      ],
      exports: [...CLOUD_PLATFORM_TOKENS],
    };
  }
}
