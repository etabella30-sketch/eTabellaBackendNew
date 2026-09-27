import * as jwt from 'jsonwebtoken';
import { AuthController } from './auth.controller';
import { AuthService } from '../../services/auth/auth.service';

const SECRET = 'unit-test-secret';
const USER = '44444444-4444-4444-8444-444444444444';
const BROWSER = 'browser-1';

describe('GET /auth/validate browser binding', () => {
    let authService: { isSessionBound: jest.Mock; fetchUserInfo: jest.Mock };
    let controller: AuthController;
    let res: any;

    const req = (token?: string) => ({ headers: token ? { authorization: `Bearer ${token}` } : {}, cookies: {} } as any);
    const token = (claims: object = {}) => jwt.sign({ userId: USER, broweserId: BROWSER, ...claims }, SECRET);

    beforeEach(() => {
        authService = {
            isSessionBound: jest.fn().mockResolvedValue(true),
            fetchUserInfo: jest.fn().mockResolvedValue({ nUserid: USER, cEmail: 'u@example.test' }),
        };
        controller = new AuthController(authService as any, { get: () => SECRET } as any);
        res = { status: jest.fn().mockReturnThis() };
    });

    it('returns the user for a signed token whose session is still bound', async () => {
        await expect(controller.validate(req(token()), res)).resolves.toEqual({ msg: 1, userDetail: { nUserid: USER, cEmail: 'u@example.test' } });
        expect(authService.isSessionBound).toHaveBeenCalledWith(USER, BROWSER);
        expect(res.status).not.toHaveBeenCalled();
    });

    it('rejects a signed token after sign-out (binding gone) with the same response shape', async () => {
        authService.isSessionBound.mockResolvedValue(false);
        await expect(controller.validate(req(token()), res)).resolves.toEqual({ msg: -1, message: 'Old Token' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(authService.fetchUserInfo).not.toHaveBeenCalled();
    });

    it('still rejects expired and missing tokens as before', async () => {
        await expect(controller.validate(req(token({ exp: Math.floor(Date.now() / 1000) - 60 })), res))
            .resolves.toEqual({ msg: -1, message: 'Token expired' });
        await expect(controller.validate(req(), res)).resolves.toEqual({ msg: -1, message: 'No token provided' });
        expect(authService.isSessionBound).not.toHaveBeenCalled();
    });
});

describe('AuthService.isSessionBound', () => {
    let getValue: jest.Mock;
    let service: AuthService;

    beforeEach(() => {
        getValue = jest.fn();
        service = Object.create(AuthService.prototype);
        Object.assign(service, { rds: { getValue } });
    });

    it('is true only when Redis binds the user to this browser', async () => {
        getValue.mockResolvedValue(JSON.stringify({ id: BROWSER, a: false }));
        await expect(service.isSessionBound(USER, BROWSER)).resolves.toBe(true);
        expect(getValue).toHaveBeenCalledWith(`user/${USER}`);
        await expect(service.isSessionBound(USER, 'other-browser')).resolves.toBe(false);
    });

    it('is false when the session key is gone, unreadable or Redis fails', async () => {
        getValue.mockResolvedValueOnce(null);
        await expect(service.isSessionBound(USER, BROWSER)).resolves.toBe(false);
        getValue.mockResolvedValueOnce('{not json');
        await expect(service.isSessionBound(USER, BROWSER)).resolves.toBe(false);
        getValue.mockRejectedValueOnce(new Error('redis down'));
        await expect(service.isSessionBound(USER, BROWSER)).resolves.toBe(false);
    });
});
