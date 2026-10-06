import * as jwt from 'jsonwebtoken';
import { CALLER_KEY, Caller } from '@app/api-kernel';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { StampedCallerResolver } from './stamped-caller.resolver';

const ME = '11111111-1111-4111-8111-111111111111';
const SECRET = 'stamp-test-secret';
const BROWSER = 'browser-1';

describe('StampedCallerResolver', () => {
  const resolver = new StampedCallerResolver();

  it('hands back the Caller the host middleware stamped', async () => {
    const caller: Caller = { userId: ME, family: 'cloud-jwt', isPlatformAdmin: true, caseScope: 'membership' };
    await expect(resolver.resolve({ [CALLER_KEY]: caller })).resolves.toBe(caller);
  });

  it('answers null (401) when nothing was stamped, and parses no token itself', async () => {
    await expect(resolver.resolve({ headers: { authorization: 'Bearer anything' }, cookies: { access_token: 'x' } })).resolves.toBeNull();
    await expect(resolver.resolve(undefined)).resolves.toBeNull();
    await expect(resolver.resolve(null)).resolves.toBeNull();
  });

  it('treats a half-stamped request as not signed in', async () => {
    await expect(resolver.resolve({ [CALLER_KEY]: { family: 'cloud-jwt' } })).resolves.toBeNull();
    await expect(resolver.resolve({ [CALLER_KEY]: { userId: '', family: 'cloud-jwt' } })).resolves.toBeNull();
    await expect(resolver.resolve({ [CALLER_KEY]: 'me' })).resolves.toBeNull();
  });

  /*
   * The live contract end to end: libs/global JwtMiddleware (authapi, coreapi, download, export) stamps the request
   * after its Redis browser check, in the shape the plan fixes, and nothing else about its answer changes.
   */
  describe('with the live JwtMiddleware', () => {
    let middleware: JwtMiddleware;
    let rds: { getValue: jest.Mock; deleteValue: jest.Mock };
    let res: { status: jest.Mock; json: jest.Mock };
    let next: jest.Mock;

    const request = (token: string, method = 'GET') =>
      ({ method, originalUrl: '/common/myteamusers', headers: { authorization: `Bearer ${token}` }, body: {}, query: {} }) as any;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation(() => undefined);
      rds = { getValue: jest.fn().mockResolvedValue(JSON.stringify({ id: BROWSER, a: true })), deleteValue: jest.fn() };
      const db = { executeRef: jest.fn().mockResolvedValue({ success: true }) };
      const config = { get: (key: string) => (key === 'JWT_SECRET' ? SECRET : 'origin') };
      middleware = new JwtMiddleware(rds as any, config as any, db as any);
      res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
      next = jest.fn();
    });
    afterEach(() => jest.restoreAllMocks());

    it('resolves the stamped cloud-jwt caller, admin flag from the Redis session, beside the unchanged injection', async () => {
      const req = request(jwt.sign({ userId: ME, broweserId: BROWSER }, SECRET));
      await middleware.use(req, res as any, next);
      expect(next).toHaveBeenCalled();
      await expect(resolver.resolve(req)).resolves.toEqual({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: true, caseScope: 'membership' });
      expect(req.query.nMasterid).toBe(ME);
      expect(req.isAdmin).toBe(true);
    });

    it('a non-admin session stamps isPlatformAdmin false', async () => {
      rds.getValue.mockResolvedValue(JSON.stringify({ id: BROWSER }));
      const req = request(jwt.sign({ userId: ME, broweserId: BROWSER }, SECRET), 'POST');
      await middleware.use(req, res as any, next);
      await expect(resolver.resolve(req)).resolves.toEqual({ userId: ME, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' });
      expect(req.body.nMasterid).toBe(ME);
    });

    it.each([
      ['a token whose browser binding moved', () => jwt.sign({ userId: ME, broweserId: 'browser-old' }, SECRET)],
      ['a token signed with the wrong key', () => jwt.sign({ userId: ME, broweserId: BROWSER }, 'not-the-secret')],
    ])('stamps nothing for %s, so the resolver answers null', async (_label, token) => {
      const req = request(token());
      await middleware.use(req, res as any, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(401);
      await expect(resolver.resolve(req)).resolves.toBeNull();
    });
  });
});
