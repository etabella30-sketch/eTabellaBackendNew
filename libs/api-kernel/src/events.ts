/**
 * Event delivery port. A shared service announces WHAT changed; the host decides where that goes (Kafka
 * notifications and MarkEventsService on the cloud, a no-op on the box for relayed writes because the cloud sends
 * `c.marks` back over the uplink, EDGE_EVENT_BUS for local executors). Delivery is fire and forget: an adapter that
 * fails must log, never throw into the request that already committed its write.
 */

export const EVENT_DELIVERY = 'ET_EVENT_DELIVERY';

export type DomainEvent =
  | {
      kind: 'marks.changed';
      nCaseid: string;
      nSesid: string | null;
      /** F fact, Q quick mark, D DocLink, I issue. */
      mark: 'F' | 'Q' | 'D' | 'I';
      op: 'insert' | 'update' | 'delete' | 'unshare';
      id: string;
      /** Who could see the mark before the change, so an unshare still reaches the users who lost it. */
      audienceBefore: readonly string[];
    }
  | { kind: 'notification'; toUserIds: readonly string[]; template: string; data: Readonly<Record<string, unknown>> }
  /** One message on a Kafka topic as UtilityService.emit sends it (socket-app fans it out to rooms): a fact comment (Phase 10). */
  | { kind: 'message'; topic: string; data: Readonly<Record<string, unknown>> };

export interface EventDelivery {
  /** Fire and forget; never throws into a request. */
  publish(e: DomainEvent): void;
}
