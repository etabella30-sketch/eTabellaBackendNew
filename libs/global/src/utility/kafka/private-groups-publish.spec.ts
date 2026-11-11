import { Subject, throwError } from 'rxjs';
import { KafkaGlobalService } from './kafka.shared.service';

describe('private group event delivery', () => {
  it('observes the producer completion rather than silently dropping asynchronous errors', async () => {
    const delivery = new Subject<unknown>();
    const service = new KafkaGlobalService({ emit: jest.fn(() => delivery) } as any);
    let complete = false;
    const result = service.sendMessage('private-groups-changed', { userId: 'owner' }).then(() => { complete = true; });
    await Promise.resolve(); expect(complete).toBe(false);
    delivery.next({}); delivery.complete(); await result;
    expect(complete).toBe(true);
    const failed = new KafkaGlobalService({ emit: jest.fn(() => throwError(() => new Error('broker unavailable'))) } as any);
    await expect(failed.sendMessage('private-groups-changed', { userId: 'owner' })).rejects.toThrow('broker unavailable');
  });
});
