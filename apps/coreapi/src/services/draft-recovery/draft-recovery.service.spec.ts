import { ConfigService } from '@nestjs/config';
import { DraftRecoveryService } from './draft-recovery.service';
import { draftRecoveryRecordKey } from '@app/global/db/redis-db/draft-recovery-keys';

const USER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OTHER = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const CASE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const DOC = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const HASH = 'a'.repeat(64);

describe('DraftRecoveryService', () => {
  let records: Map<string, string>;
  let epoch: string;
  let accessible: boolean;
  let redis: any;
  let service: DraftRecoveryService;
  let db: any;

  beforeEach(() => {
    records = new Map(); epoch = '0'; accessible = true;
    redis = {
      getDraftRecoveryEpoch: jest.fn(async () => epoch),
      getValue: jest.fn(async (k: string) => records.get(k) ?? null),
      putDraftRecoveryIfEpoch: jest.fn(async (user: string, browserId: string, hash: string, id: string, e: string, v: string) => {
        if (browserId !== 'browser' || hash !== HASH) return false;
        if (e !== epoch) return false;
        records.set(draftRecoveryRecordKey(user, id), v); return true;
      }),
      getDraftRecoveryIfEpoch: jest.fn(async (user: string, browserId: string, hash: string, id: string, e: string) => browserId === 'browser' && hash === HASH && e === epoch ? records.get(draftRecoveryRecordKey(user, id)) ?? null : null),
      deleteDraftRecoveryIfEpoch: jest.fn(async (user: string, browserId: string, hash: string, id: string, e: string, envelope: string) => {
        const key = draftRecoveryRecordKey(user, id);
        if (browserId !== 'browser' || hash !== HASH || e !== epoch || records.get(key) !== envelope) return false;
        return records.delete(key);
      }),
      deleteValue: jest.fn(async (k: string) => { records.delete(k); }),
    };
    db = { rowQuery: jest.fn(async () => ({ success: true, data: [{ allowed: accessible }] })) };
    const config = { get: jest.fn(() => Buffer.alloc(32, 7).toString('base64')) };
    service = new DraftRecoveryService(db as any, redis, config as unknown as ConfigService);
  });

  it('wraps the key at rest and releases it only to its authenticated owner after rechecking access', async () => {
    const issued = await service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC });
    const stored = records.get(draftRecoveryRecordKey(USER, issued.draftId))!;
    expect(stored).not.toContain(issued.key);
    expect(JSON.stringify(redis.putDraftRecoveryIfEpoch.mock.calls)).not.toContain(issued.key);
    await expect(service.recover(OTHER, 'browser', HASH, issued.draftId)).rejects.toThrow();
    expect(await service.recover(USER, 'browser', HASH, issued.draftId)).toEqual({ ...issued, caseId: CASE, sourceKind: 'pdf', sourceId: DOC });
    accessible = false;
    await expect(service.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow();
  });

  it('refuses after explicit logout epoch changes, but does not consume a key on ordinary retrieval', async () => {
    const issued = await service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC });
    await service.recover(USER, 'browser', HASH, issued.draftId);
    epoch = '1';
    await expect(service.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow();
  });

  it('fails closed on missing wrapping configuration or denied source access', async () => {
    const disabled = new DraftRecoveryService({} as any, redis, { get: () => undefined } as any);
    await expect(disabled.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC })).rejects.toThrow();
    accessible = false;
    await expect(service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC })).rejects.toThrow();
    expect(records.size).toBe(0);
  });

  it('fails closed for tampering, replacement sessions, expiry and key rotation', async () => {
    const issued = await service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC });
    await expect(service.recover(USER, 'replaced-browser', HASH, issued.draftId)).rejects.toThrow();
    const key = draftRecoveryRecordKey(USER, issued.draftId);
    const original = records.get(key)!;
    const wrapped = JSON.parse(original);
    const bytes = Buffer.from(wrapped.data, 'base64'); bytes[0] ^= 1;
    wrapped.data = bytes.toString('base64'); records.set(key, JSON.stringify(wrapped));
    await expect(service.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow();
    records.set(key, original);
    const rotated = new DraftRecoveryService(db, redis, { get: () => Buffer.alloc(32, 9).toString('base64') } as any);
    await expect(rotated.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(issued.expiresAt + 1);
    try { await expect(service.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow(); }
    finally { clock.mockRestore(); }
  });

  it('checks exact nondeleted transcript session and case, and denies failed database checks', async () => {
    const issued = await service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'transcript', sourceId: DOC });
    expect(db.rowQuery.mock.calls[1][0]).toContain('r."nSesid" = $3::uuid');
    expect(db.rowQuery.mock.calls[1][0]).toContain('r."nCaseid" = $1::uuid');
    expect(db.rowQuery.mock.calls[1][0]).toContain('r."dDelDt" IS NULL');
    db.rowQuery.mockRejectedValue(new Error('database unavailable'));
    await expect(service.recover(USER, 'browser', HASH, issued.draftId)).rejects.toThrow();
  });

  it('does not issue a key when logout races the access query', async () => {
    db.rowQuery.mockImplementation(async () => {
      epoch = '1';
      return { success: true, data: [{ allowed: true }] };
    });
    await expect(service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC })).rejects.toThrow();
    expect(records.size).toBe(0);
  });

  it('does not let a stale same-browser token or another user delete a current draft', async () => {
    const issued = await service.issue(USER, 'browser', HASH, { caseId: CASE, sourceKind: 'pdf', sourceId: DOC });
    const key = draftRecoveryRecordKey(USER, issued.draftId);
    await expect(service.remove(USER, 'browser', 'b'.repeat(64), issued.draftId)).rejects.toThrow();
    expect(records.has(key)).toBe(true);
    // A different user's keyspace has no such record; a no-op must not reveal
    // or erase the other user's draft.
    await service.remove(OTHER, 'browser', HASH, issued.draftId);
    expect(records.has(key)).toBe(true);
    await service.remove(USER, 'browser', HASH, issued.draftId);
    expect(records.has(key)).toBe(false);
  });
});
