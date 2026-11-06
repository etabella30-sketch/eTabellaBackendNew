import { RedisDbService } from './redis-db.service';
import { draftRecoveryEpochKey, draftRecoveryRateKey, draftRecoveryRecordKey } from './draft-recovery-keys';

// This is the same independent slot implementation ioredis uses to route
// cluster requests, not a check of how our own key helper is implemented.
const slot = require('cluster-key-slot') as (key: string) => number;

describe('draft recovery Redis Cluster keys', () => {
  const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const other = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const draft = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  const hash = 'a'.repeat(64);
  let redis: { on: jest.Mock; eval: jest.Mock; get: jest.Mock };
  let service: RedisDbService;

  beforeEach(() => {
    redis = { on: jest.fn(), eval: jest.fn().mockResolvedValue(1), get: jest.fn().mockResolvedValue('0') };
    service = new RedisDbService(redis as any);
  });

  function expectOneSlot(call: unknown[]): void {
    const count = call[1] as number;
    const keys = call.slice(2, 2 + count) as string[];
    expect(keys.length).toBe(count);
    expect(keys).toContain(`user/${user}`);
    expect(new Set(keys.map(slot))).toEqual(new Set([slot(`user/${user}`)]));
  }

  it('uses the current session slot for every key in issue, release, delete and logout scripts', async () => {
    await service.putDraftRecoveryIfEpoch(user, 'browser', hash, draft, '0', 'wrapped', 60);
    await service.getDraftRecoveryIfEpoch(user, 'browser', hash, draft, '0');
    await service.deleteDraftRecoveryIfEpoch(user, 'browser', hash, draft, '0', 'wrapped');
    await service.invalidateDraftRecoveryAndEndSession(user, 'browser', hash);
    expect(redis.eval).toHaveBeenCalledTimes(4);
    for (const call of redis.eval.mock.calls) expectOneSlot(call);
    expect(redis.eval.mock.calls[0].slice(2, 6)).toEqual([
      draftRecoveryEpochKey(user), draftRecoveryRecordKey(user, draft), `user/${user}`, draftRecoveryRateKey(user),
    ]);
    expect(redis.eval.mock.calls[1].slice(2, 5)).toEqual([
      draftRecoveryEpochKey(user), draftRecoveryRecordKey(user, draft), `user/${user}`,
    ]);
    expect(redis.eval.mock.calls[2].slice(2, 5)).toEqual([
      draftRecoveryEpochKey(user), draftRecoveryRecordKey(user, draft), `user/${user}`,
    ]);
    expect(redis.eval.mock.calls[3].slice(2, 4)).toEqual([draftRecoveryEpochKey(user), `user/${user}`]);
    await service.getDraftRecoveryEpoch(user);
    expect(redis.get).toHaveBeenCalledWith(draftRecoveryEpochKey(user));
  });

  it('keeps the same draft ID separate across users and rejects injected hash tags', () => {
    expect(draftRecoveryRecordKey(user, draft)).not.toBe(draftRecoveryRecordKey(other, draft));
    expect(slot(draftRecoveryRecordKey(other, draft))).toBe(slot(`user/${other}`));
    expect(() => draftRecoveryRecordKey(`${user}{other}`, draft)).toThrow('Invalid recovery user');
    expect(() => draftRecoveryRecordKey(user, `${draft}{other}`)).toThrow('Invalid recovery draft');
  });
});
