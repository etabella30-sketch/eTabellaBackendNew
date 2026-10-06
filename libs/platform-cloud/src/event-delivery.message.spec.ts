import { Logger } from '@nestjs/common';
import { DomainEvent } from '@app/api-kernel';

import { KafkaNotificationEventDelivery, NOTIFICATION_TOPIC } from './event-delivery';

/*
 * The 'message' event (Phase 10): what UtilityService.emit does today, one Kafka message on the event's topic with
 * its data as is (the fact-comment broadcast on `factsheet-comments`), beside the 'notification' fan-out.
 */

const comment: DomainEvent = {
  kind: 'message',
  topic: 'factsheet-comments',
  data: { type: 'FACT-MESSAGE', nFSid: 'f1', nCid: 'c1', recipients: ['u1', 'u2'], permission: 'N' },
};

describe("KafkaNotificationEventDelivery 'message' events", () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('emits one Kafka message on the topic named, the data as the service built it', () => {
    const sendMessage = jest.fn();
    new KafkaNotificationEventDelivery(() => ({ sendMessage })).publish(comment);
    expect(sendMessage.mock.calls).toEqual([['factsheet-comments', comment.data]]);
  });

  it('a notification still fans out on the notification topic; marks.changed is still ignored', () => {
    const sendMessage = jest.fn();
    const delivery = new KafkaNotificationEventDelivery(() => ({ sendMessage }));
    delivery.publish({ kind: 'notification', toUserIds: ['u1'], template: 'FS', data: { cTitle: 't' } });
    delivery.publish({ kind: 'marks.changed', nCaseid: 'c', nSesid: null, mark: 'F', op: 'insert', id: 'f1', audienceBefore: [] });
    expect(sendMessage.mock.calls.map((c) => c[0])).toEqual([NOTIFICATION_TOPIC]);
  });

  it('fire and forget: no Kafka client, a thrown send or a rejected send is logged, never thrown into the request', async () => {
    expect(() => new KafkaNotificationEventDelivery(() => { throw new Error('no kafka'); }).publish(comment)).not.toThrow();
    expect(() => new KafkaNotificationEventDelivery(() => ({ sendMessage: () => { throw new Error('boom'); } })).publish(comment)).not.toThrow();
    const rejected = new KafkaNotificationEventDelivery(() => ({ sendMessage: () => Promise.reject(new Error('later')) }));
    expect(() => rejected.publish(comment)).not.toThrow();
    await new Promise((resolve) => setImmediate(resolve));
    expect(Logger.prototype.warn).toHaveBeenCalled();
  });
});
