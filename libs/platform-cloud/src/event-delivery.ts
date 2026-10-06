/**
 * EVENT_DELIVERY of the live hosts.
 *  - 'notification': what UtilityService.sendNotification does today in coreapi and realtime-server
 *    (apps/<app>/src/services/utility/utility.service.ts): one Kafka message per recipient on the `notification`
 *    topic through the same KafkaGlobalService (the 'KAFKA_SERVICE' ClientKafka), with the notificationReq keys of
 *    apps/coreapi/src/interfaces/notification.interface.ts. The event's `template` is that message's cType and its
 *    `data` the rest; a lib cannot import the app interface (R1), so the shape is spelled out here and the spec
 *    pins it against a literal built the way sendNotification builds one.
 *  - 'message': what UtilityService.emit does today: one Kafka message on the event's topic with its data as is (the
 *    fact-comment broadcast on `factsheet-comments`, Phase 10).
 *  - 'marks.changed': a no-op for now. realtime-server's MarkEventsService (services/marks) still announces mark
 *    changes from its @MarkWrite interceptor; routing it through this port is Phase 7a's work.
 * Delivery is fire and forget: a host without a Kafka client, or a failing emit, is logged and dropped, never thrown
 * into the request that already committed its write.
 */
import { Logger } from '@nestjs/common';
import { DomainEvent, EventDelivery } from '@app/api-kernel';

/** The Kafka topic UtilityService.sendNotification emits on. */
export const NOTIFICATION_TOPIC = 'notification';

export type NotificationEvent = Extract<DomainEvent, { kind: 'notification' }>;

/** One `notification` message, key for key the notificationReq of coreapi (values as the caller gave them). */
export interface NotificationMessage {
  nUserid: unknown;
  cTitle: unknown;
  cMsg: unknown;
  cStatus: unknown;
  cType: unknown;
  nCaseid: unknown;
  cToken: unknown;
  nFSid: unknown;
  nDocid: unknown;
  nWebid: unknown;
  nBundledetailid: unknown;
  nRefuserid: unknown;
}

/** What the delivery needs of KafkaGlobalService. */
export interface NotificationEmitter {
  sendMessage(topic: string, data: unknown): unknown;
}

/** The messages sendNotification would emit for this event: one per recipient, the same defaults (`cStatus` 'P', nulls). */
export function notificationMessages(e: NotificationEvent): NotificationMessage[] {
  const d = e.data;
  return e.toUserIds.map((nUserid) => ({
    nUserid,
    cTitle: d.cTitle,
    cMsg: d.cMsg,
    cStatus: d.cStatus || 'P',
    cType: e.template,
    nCaseid: d.nCaseid,
    cToken: d.cToken,
    nFSid: d.nFSid || null,
    nDocid: d.nDocid || null,
    nWebid: d.nWebid || null,
    nBundledetailid: d.nBundledetailid || null,
    nRefuserid: d.nRefuserid || null,
  }));
}

export class KafkaNotificationEventDelivery implements EventDelivery {
  private readonly logger = new Logger(KafkaNotificationEventDelivery.name);
  private warnedNoKafka = false;

  /** `kafka` is looked up per publish (host-services.ts hostKafkaOf), so a host without Kafka still boots. */
  constructor(private readonly kafka: () => NotificationEmitter) {}

  publish(e: DomainEvent): void {
    if (e.kind !== 'notification' && e.kind !== 'message') return; // marks.changed: MarkEventsService's job until Phase 7a
    let emitter: NotificationEmitter;
    try {
      emitter = this.kafka();
    } catch (error) {
      if (!this.warnedNoKafka) {
        this.warnedNoKafka = true;
        this.logger.warn(`${e.kind} dropped, no Kafka client on this host: ${(error as Error)?.message ?? error}`);
      }
      return;
    }
    if (e.kind === 'message') {
      this.send(emitter, e.topic, e.data);
      return;
    }
    for (const message of notificationMessages(e)) this.send(emitter, NOTIFICATION_TOPIC, message);
  }

  /** One Kafka message, fire and forget: a thrown or rejected send is logged, never thrown into the request. */
  private send(emitter: NotificationEmitter, topic: string, message: unknown): void {
    try {
      Promise.resolve(emitter.sendMessage(topic, message)).catch((error) => this.emitFailed(error));
    } catch (error) {
      this.emitFailed(error);
    }
  }

  private emitFailed(error: unknown): void {
    this.logger.warn(`notification emit failed: ${(error as Error)?.message ?? error}`);
  }
}
