/**
 * EVENT_DELIVERY on the box (plan §3.3): nothing to deliver. A write a shared controller relays is applied by the
 * cloud, which tells every box with that session `c.marks` over the uplink; the box's LanGateway then emits
 * `marks-changed` to the room (lan.gateway.ts) and RtDataService expires the cached reads. Publishing the same event
 * again here would double every notice. Local executors (sessions, transcript shaping) publish on EDGE_EVENT_BUS,
 * not here. Never throws, keeps nothing.
 */
import { Injectable } from '@nestjs/common';
import type { DomainEvent, EventDelivery } from '@app/api-kernel';

@Injectable()
export class EdgeEventDelivery implements EventDelivery {
    publish(_event: DomainEvent): void {
        // intentionally nothing: see the file comment
    }
}
