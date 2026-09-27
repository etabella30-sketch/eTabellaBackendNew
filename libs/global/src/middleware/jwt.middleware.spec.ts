import * as jwt from 'jsonwebtoken';
import { JwtMiddleware } from './jwt.middleware';

const SECRET = 'unit-test-secret';
const VICTIM = '44444444-4444-4444-8444-444444444444';
const BROWSER = 'browser-1';

describe('JwtMiddleware', () => {
    let rds: { getValue: jest.Mock; deleteValue: jest.Mock };
    let db: { executeRef: jest.Mock };
    let middleware: JwtMiddleware;
    let res: any;
    let next: jest.Mock;

    const request = (token: string, method = 'POST') =>
        ({ method, originalUrl: '/x', headers: { authorization: `Bearer ${token}` }, body: {}, query: {} } as any);
    const past = () => Math.floor(Date.now() / 1000) - 60;

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        rds = { getValue: jest.fn().mockResolvedValue(JSON.stringify({ id: BROWSER, a: false })), deleteValue: jest.fn() };
        db = { executeRef: jest.fn().mockResolvedValue({ success: true }) };
        const config = { get: (key: string) => (key === 'JWT_SECRET' ? SECRET : 'origin') };
        middleware = new JwtMiddleware(rds as any, config as any, db as any);
        res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        next = jest.fn();
    });

    afterEach(() => jest.restoreAllMocks());

    it('accepts a valid token bound to the browser and injects identity', async () => {
        const req = request(jwt.sign({ userId: VICTIM, broweserId: BROWSER }, SECRET));
        await middleware.use(req, res, next);
        expect(next).toHaveBeenCalled();
        expect(req.body.nMasterid).toBe(VICTIM);
        expect(req.isAdmin).toBe(false);
    });

    it('rejects a valid token whose browser binding is gone, without deleting anything', async () => {
        rds.getValue.mockResolvedValue(null);
        await middleware.use(request(jwt.sign({ userId: VICTIM, broweserId: BROWSER }, SECRET)), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it("does not end another user's session for a token signed with the wrong key", async () => {
        await middleware.use(request(jwt.sign({ userId: VICTIM, broweserId: 'x' }, 'not-the-secret')), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('does not end a session for an expired token with a bad signature', async () => {
        const forged = jwt.sign({ userId: VICTIM, broweserId: 'x', exp: past() }, 'not-the-secret');
        await middleware.use(request(forged), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('does not end a session for an unsigned (alg none) token', async () => {
        const unsigned = jwt.sign({ userId: VICTIM, broweserId: 'x' }, '', { algorithm: 'none' } as any);
        await middleware.use(request(unsigned), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('ignores a malformed token', async () => {
        await middleware.use(request('not.a.jwt'), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('still ends the session of a correctly signed, expired token (unchanged)', async () => {
        const expired = jwt.sign({ userId: VICTIM, broweserId: BROWSER, exp: past() }, SECRET);
        await middleware.use(request(expired), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(db.executeRef).toHaveBeenCalledWith('log_insert', expect.objectContaining({ nMasterid: VICTIM }));
        expect(rds.deleteValue).toHaveBeenCalledWith(`user/${VICTIM}`);
    });

    it('does not end the live session for a correctly signed, expired token from a replaced browser', async () => {
        // Signed in on browser-old, then on BROWSER: Redis now binds VICTIM to BROWSER.
        const stale = jwt.sign({ userId: VICTIM, broweserId: 'browser-old', exp: past() }, SECRET);
        await middleware.use(request(stale), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(db.executeRef).toHaveBeenCalledWith('log_insert', expect.objectContaining({ nMasterid: VICTIM }));
        expect(rds.getValue).toHaveBeenCalledWith(`user/${VICTIM}`);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('does not delete anything for a correctly signed, expired token when no session is stored', async () => {
        rds.getValue.mockResolvedValue(null);
        await middleware.use(request(jwt.sign({ userId: VICTIM, broweserId: BROWSER, exp: past() }, SECRET)), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });

    it('handles a failing Redis delete in the request instead of leaving an unhandled rejection', async () => {
        rds.deleteValue.mockRejectedValue(new Error('redis down'));
        const expired = jwt.sign({ userId: VICTIM, broweserId: BROWSER, exp: past() }, SECRET);
        await middleware.use(request(expired), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).toHaveBeenCalledWith(`user/${VICTIM}`);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('redis down'));
    });

    it('does not delete for a correctly signed, expired token that carries no browser id', async () => {
        rds.getValue.mockResolvedValue(JSON.stringify({ a: false }));
        await middleware.use(request(jwt.sign({ userId: VICTIM, exp: past() }, SECRET)), res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(rds.deleteValue).not.toHaveBeenCalled();
    });
});
