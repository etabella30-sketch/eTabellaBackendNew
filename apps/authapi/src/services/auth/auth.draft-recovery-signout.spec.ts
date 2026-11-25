import { AuthService } from './auth.service';
import { createHash } from 'crypto';

describe('explicit cloud signout revokes pending draft keys', () => {
  const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  it('ends the bound session and invalidates recovery before recording signout', async () => {
    const order: string[] = [];
    const db = { executeRef: jest.fn(async () => { order.push('db'); return { success: true }; }) };
    const redis = { invalidateDraftRecoveryAndEndSession: jest.fn(async () => { order.push('revoke'); return true; }) };
    const service = new AuthService(db as any, {} as any, {} as any, {} as any, redis as any, {} as any);
    jest.spyOn(service, 'insertLog').mockResolvedValue(undefined);
    const result = await service.signOut({ nMasterid: user, cBroweserid: 'untrusted-body' } as any, 'verified-browser', 'verified-token-hash');
    expect(result.msg).toBe(1);
    expect(redis.invalidateDraftRecoveryAndEndSession).toHaveBeenCalledWith(user, 'verified-browser', 'verified-token-hash');
    expect(order).toEqual(['revoke', 'db']);
  });
  it('does not sign out a replacement session when the atomic binding check fails', async () => {
    const db = { executeRef: jest.fn() };
    const redis = { invalidateDraftRecoveryAndEndSession: jest.fn(async () => false) };
    const service = new AuthService(db as any, {} as any, {} as any, {} as any, redis as any, {} as any);
    const result = await service.signOut({ nMasterid: user } as any, 'old-browser', 'old-token-hash');
    expect(result.msg).toBe(-1);
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});

describe('same-browser reauthentication binds a fresh exact token', () => {
  it('stores a different token hash for each sign-in without storing the token itself', async () => {
    const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const db = { executeRef: jest.fn(async (name: string) => name === 'signin'
      ? { success: true, data: [[{ nUserid: user, cPassword: 'synthetic-password-hash', isAdmin: false }]] }
      : { success: true, data: [[{}]] }) };
    const redis = { getValue: jest.fn(async () => null), setValue: jest.fn(async (_key: string, _value: string) => undefined) };
    const jwt = { sign: jest.fn((payload: unknown) => JSON.stringify(payload)) };
    const pass = { verifyPassword: jest.fn(async () => true) };
    const service = new AuthService(db as any, pass as any, jwt as any, { emit: jest.fn() } as any, redis as any, { get: () => 'test' } as any);
    jest.spyOn(service, 'insertLog').mockResolvedValue(undefined);
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const input = { password: 'synthetic', cBroweserid: 'same-browser' } as any;
      const first = await service.signIn(input);
      const second = await service.signIn(input);
      const one = JSON.parse(redis.setValue.mock.calls[0][1] as string);
      const two = JSON.parse(redis.setValue.mock.calls[1][1] as string);
      expect(first.token).not.toBe(second.token);
      expect(one.tokenHash).toBe(createHash('sha256').update(first.token!).digest('hex'));
      expect(two.tokenHash).toBe(createHash('sha256').update(second.token!).digest('hex'));
      expect(one.tokenHash).not.toBe(two.tokenHash);
      expect(redis.setValue.mock.calls[0][1]).not.toContain(first.token);
    } finally { warn.mockRestore(); log.mockRestore(); }
  });
});
