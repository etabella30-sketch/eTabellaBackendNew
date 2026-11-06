import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth/auth.service';

describe('AuthController session cookies', () => {
  const auth = { signIn: jest.fn(), signOut: jest.fn() };
  const controller = new AuthController(auth as unknown as AuthService, {} as ConfigService);
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };

  beforeEach(() => jest.resetAllMocks());

  it('sets a strict, HTTP-only cookie after a successful sign-in', async () => {
    auth.signIn.mockResolvedValue({ msg: 1, token: 'test-token' });
    const body = { cEmail: 'test@example.invalid' } as never;
    await expect(controller.signIn(body, res as unknown as Response)).resolves.toEqual({ msg: 1, token: 'test-token' });
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'test-token', expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/' }));
  });

  it('does not set a cookie when sign-in is rejected', async () => {
    auth.signIn.mockResolvedValue({ msg: -1, value: 'Invalid credentials' });
    await expect(controller.signIn({} as never, res as unknown as Response)).resolves.toMatchObject({ msg: -1 });
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('clears the session cookie after sign-out', async () => {
    auth.signOut.mockResolvedValue({ msg: 1, value: 'User signout!' });
    await expect(controller.signOut({} as never, res as unknown as Response, { verifiedBrowserId: 'browser' } as never)).resolves.toMatchObject({ msg: 1 });
    expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.objectContaining({ httpOnly: true, sameSite: 'strict', path: '/' }));
  });

  it('does not clear a replacement session cookie when stale signout is refused', async () => {
    auth.signOut.mockResolvedValue({ msg: -1, value: 'Session is no longer active' });
    await expect(controller.signOut({} as never, res as unknown as Response, { verifiedBrowserId: 'old' } as never)).resolves.toMatchObject({ msg: -1 });
    expect(res.clearCookie).not.toHaveBeenCalled();
  });
});
