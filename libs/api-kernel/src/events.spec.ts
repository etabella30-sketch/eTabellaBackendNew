import { DomainEvent, EVENT_DELIVERY, EventDelivery } from './events';

// The event port the live Kafka / MarkEvents adapters and the box no-op implement: token and event shapes are pinned.

class RecordingDelivery implements EventDelivery {
  readonly published: DomainEvent[] = [];

  publish(e: DomainEvent): void {
    this.published.push(e);
  }
}

describe('event delivery port', () => {
  it('pins the token', () => {
    expect(EVENT_DELIVERY).toBe('ET_EVENT_DELIVERY');
  });

  it('carries both event kinds and narrows on kind', () => {
    const delivery = new RecordingDelivery();
    const marks: DomainEvent = {
      kind: 'marks.changed', nCaseid: 'c1', nSesid: null, mark: 'Q', op: 'unshare', id: 'h1', audienceBefore: ['u1', 'u2'],
    };
    const note: DomainEvent = { kind: 'notification', toUserIds: ['u2'], template: 'fact_shared', data: { nFSid: 'f1' } };
    delivery.publish(marks);
    delivery.publish(note);
    expect(delivery.published).toEqual([marks, note]);
    const [first] = delivery.published;
    if (first.kind === 'marks.changed') expect(first.audienceBefore).toEqual(['u1', 'u2']);
  });

  it('publish is fire and forget: a void return, nothing to await', () => {
    const delivery: EventDelivery = { publish: jest.fn() };
    expect(delivery.publish({ kind: 'notification', toUserIds: [], template: 't', data: {} })).toBeUndefined();
  });
});
