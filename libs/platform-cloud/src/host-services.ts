/**
 * The host's own infrastructure, found at first use. No live host exports DbService or the Kafka client to the whole
 * app: coreapi takes DbService from its SharedModule, realtime-server lists it in its root module and again in
 * TranscriptModule, and the Kafka client comes from KafkaSharedModule or KafkaModule.register per app. A @Global()
 * module's factory therefore cannot `inject: [DbService]` (Nest resolves injection within a module's own imports),
 * and providing a DbService here would open a second pg pool. ModuleRef.get(token, { strict: false }) searches the
 * whole container instead; doing it lazily keeps invariant R3 as well: nothing throws at construction when a host
 * has no such service, the adapters report the absence per call.
 */
import { Type } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DbService } from '@app/global/db/pg/db.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';

/** What the storage adapters need of the host's DbService. */
export type HostDb = Pick<DbService, 'executeRef' | 'rowQuery'>;

/** What the event delivery needs of the host's KafkaGlobalService. */
export type HostKafka = Pick<KafkaGlobalService, 'sendMessage'>;

/** The ModuleRef surface used here, so a spec can hand in a plain object. */
export type ContainerLookup = Pick<ModuleRef, 'get'>;

/**
 * Finds `token` anywhere in the host's container on the first call and keeps it. Throws a named error when the host
 * provides none; the callers turn that into their port's failure answer.
 */
export function lazyHostService<T>(ref: ContainerLookup, token: Type<T>, name: string): () => T {
  let found: T | undefined;
  return (): T => {
    if (found === undefined) {
      try {
        found = ref.get<T, T>(token, { strict: false });
      } catch (error) {
        throw new Error(`${name} is not provided by this host: ${(error as Error)?.message ?? error}`);
      }
    }
    return found;
  };
}

/**
 * The host's DbService behind a forwarding object, so an adapter is built at module time and the service is looked
 * up at call time. Arguments are forwarded as given: a call without a schema reaches executeRef as two arguments,
 * exactly as today's services make it. The forwarders are async so a host without DbService is always a rejection,
 * never a synchronous throw out of a method the port declares as returning a promise.
 */
export function hostDbOf(ref: ContainerLookup): HostDb {
  const db = lazyHostService<DbService>(ref, DbService, 'DbService');
  return {
    executeRef: async (...args: Parameters<DbService['executeRef']>) => db().executeRef(...args),
    rowQuery: async (...args: Parameters<DbService['rowQuery']>) => db().rowQuery(...args),
  };
}

/** The host's KafkaGlobalService (the 'KAFKA_SERVICE' ClientKafka every UtilityService.sendNotification emits through). */
export function hostKafkaOf(ref: ContainerLookup): () => HostKafka {
  return lazyHostService<KafkaGlobalService>(ref, KafkaGlobalService, 'KafkaGlobalService');
}
