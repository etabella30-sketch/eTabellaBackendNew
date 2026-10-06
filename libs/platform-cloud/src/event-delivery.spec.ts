import { Logger } from '@nestjs/common';
import { DomainEvent } from '@app/api-kernel';
import { KafkaNotificationEventDelivery, NOTIFICATION_TOPIC, notificationMessages } from './event-delivery';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const THIRD = '33333333-3333-4333-8333-333333333333';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';

const share: DomainEvent = {
  kind: 'notification',
  toUserIds: [OTHER, THIRD],
  template: 'FS',
  data: { cTitle: 'Fact shared', cMsg: 'Me shared a fact with you', nCaseid: CASE, cToken: 'tok', nFSid: 'f1', nRefuserid: ME },
};

const marks: DomainEvent = { kind: 'marks.changed', nCaseid: CASE, nSesid: null, mark: 'F', op: 'insert', id: 'f1', audienceBefore: [] };

/** The message UtilityService.sendNotification builds today for one recipient (coreapi and realtime-server alike). */
function sendNotificationMessage(jobData: any, nMasterid: any) {
  return {
    nUserid: jobData.nUserid,
    cTitle: jobData.cTitle,
    cMsg: jobData.cMsg,
    cStatus: jobData.cStatus || 'P',
    cType: jobData.cType,
    nCaseid: jobData.nCaseid,
    cToken: jobData.cToken,
    nFSid: jobData.nFSid || null,
    nDocid: jobData.nDocid || null,
    nWebid: jobData.nWebid || null,
    nBundledetailid: jobData.nBundledetailid || null,
    nRefuserid: nMasterid || null,
  };
}

describe('notificationMessages', () => {
  it('builds one message per recipient, key for key what sendNotification emits, with its defaults', () => {
    const messages = notificationMessages(share as Extract<DomainEvent, { kind: 'notification' }>);
    const job = { cTitle: 'Fact shared', cMsg: 'Me shared a fact with you', cType: 'FS', nCaseid: CASE, cToken: 'tok', nFSid: 'f1' };
    expect(messages).toEqual([
      sendNotificationMessage({ ...job, nUserid: OTHER }, ME),
      sendNotificationMessage({ ...job, nUserid: THIRD }, ME),
    ]);
    expect(Object.keys(messages[0])).toEqual(Object.keys(sendNotificationMessage({ nUserid: OTHER }, ME)));
    expect(messages[0]).toMatchObject({ cStatus: 'P', nDocid: null, nWebid: null, nBundledetailid: null, cType: 'FS' });
  });

  it('keeps a given cStatus and an absent actor as null', () => {
    const [message] = notificationMessages({ kind: 'notification', toUserIds: [OTHER], template: 'DS', data: { cStatus: 'R', nDocid: 'd1' } });
    expect(message).toMatchObject({ cStatus: 'R', nDocid: 'd1', nRefuserid: null, cType: 'DS' });
  });
});

describe('KafkaNotificationEventDelivery', () => {
  let sendMessage: jest.Mock;
  let warn: jest.SpyInstance;

  beforeEach(() => {
    sendMessage = jest.fn(async () => true);
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('emits each notification message on the notification topic through the host Kafka client', () => {
    new KafkaNotificationEventDelivery(() => ({ sendMessage })).publish(share);
    expect(sendMessage).toHaveBeenCalledTimes(2);
    expect(sendMessage.mock.calls.map((c) => c[0])).toEqual([NOTIFICATION_TOPIC, NOTIFICATION_TOPIC]);
    expect(sendMessage.mock.calls.map((c) => c[1].nUserid)).toEqual([OTHER, THIRD]);
    expect(NOTIFICATION_TOPIC).toBe('notification');
  });

  it('does nothing for marks.changed (MarkEventsService announces those today)', () => {
    const kafka = jest.fn(() => ({ sendMessage }));
    new KafkaNotificationEventDelivery(kafka).publish(marks);
    expect(kafka).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it('drops and warns once when the host has no Kafka client, without throwing', () => {
    const delivery = new KafkaNotificationEventDelivery(() => { throw new Error('KafkaGlobalService is not provided by this host'); });
    expect(() => delivery.publish(share)).not.toThrow();
    expect(() => delivery.publish(share)).not.toThrow();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('no Kafka client');
  });

  it('never throws into the request when an emit throws or rejects, and still sends the other messages', async () => {
    sendMessage.mockImplementationOnce(() => { throw new Error('sync boom'); }).mockImplementationOnce(async () => { throw new Error('async boom'); });
    const delivery = new KafkaNotificationEventDelivery(() => ({ sendMessage }));
    expect(() => delivery.publish(share)).not.toThrow();
    expect(sendMessage).toHaveBeenCalledTimes(2);
    await new Promise((resolve) => setImmediate(resolve));
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls.map((c) => String(c[0]))).toEqual([expect.stringContaining('sync boom'), expect.stringContaining('async boom')]);
  });
});
