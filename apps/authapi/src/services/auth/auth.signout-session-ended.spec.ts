import { AuthService } from './auth.service';

describe('sign-out ends the user\'s other devices', () => {
  const user = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const make = (ended: boolean) => {
    const db = { executeRef: jest.fn(async () => ({ success: true })) };
    const redis = { invalidateDraftRecoveryAndEndSession: jest.fn(async () => ended) };
    const utility = { emit: jest.fn() };
    const service = new AuthService(db as any, {} as any, {} as any, utility as any, redis as any, {} as any);
    jest.spyOn(service, 'insertLog').mockResolvedValue(undefined);
    return { service, utility };
  };

  it('emits SESSION-ENDED with the verified browser id, not the one in the body', async () => {
    const { service, utility } = make(true);
    await service.signOut({ nMasterid: user, cBroweserid: 'untrusted-body' } as any, 'verified-browser', 'hash');
    expect(utility.emit).toHaveBeenCalledTimes(1);
    expect(utility.emit).toHaveBeenCalledWith({ event: 'SESSION-ENDED', data: { nMasterid: user, cBroweserid: 'verified-browser' } }, 'SESSION-ENDED');
  });

  it('emits nothing when the session was not this browser\'s any more', async () => {
    const { service, utility } = make(false);
    await service.signOut({ nMasterid: user } as any, 'old-browser', 'old-hash');
    expect(utility.emit).not.toHaveBeenCalled();
  });
});

describe('a failed SESSION-ENDED announcement', () => {
  it('does not fail the sign-out', async () => {
    const db = { executeRef: jest.fn(async () => ({ success: true })) };
    const redis = { invalidateDraftRecoveryAndEndSession: jest.fn(async () => true) };
    const service = new AuthService(db as any, {} as any, {} as any, { emit: () => { throw new Error('broker down'); } } as any, redis as any, {} as any);
    jest.spyOn(service, 'insertLog').mockResolvedValue(undefined);
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect((await service.signOut({ nMasterid: 'u' } as any, 'b', 'h')).msg).toBe(1);
    } finally { error.mockRestore(); }
  });
});
