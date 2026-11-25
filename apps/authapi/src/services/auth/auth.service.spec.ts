import { AuthService } from './auth.service';

describe('AuthService user information', () => {
  const db = { executeRef: jest.fn() };
  const service = new AuthService(db as never, {} as never, {} as never, {} as never, {} as never, {} as never);
  const user = { nMasterid: '11111111-1111-4111-8111-111111111111' };

  beforeEach(() => db.executeRef.mockReset());

  it('returns the user details supplied by the database', async () => {
    const detail = { msg: 1, nUserid: user.nMasterid };
    db.executeRef.mockResolvedValue({ success: true, data: [[detail]] });
    await expect(service.fetchUserInfo(user)).resolves.toEqual(detail);
    expect(db.executeRef).toHaveBeenCalledWith('userdetail', user);
  });

  it('returns a failure when user details cannot be read', async () => {
    db.executeRef.mockResolvedValue({ success: false, error: 'database unavailable' });
    await expect(service.fetchUserInfo(user)).resolves.toEqual({ msg: -1, value: 'Failed to fetch user information' });
  });
});
