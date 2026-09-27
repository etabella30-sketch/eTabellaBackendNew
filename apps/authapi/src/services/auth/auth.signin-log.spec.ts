import { AuthService } from './auth.service';

const USER = '44444444-4444-4444-8444-444444444444';
const HASH = '$2b$10$storedpasswordhashvalue';

describe('AuthService.signIn log entries', () => {
    let executeRef: jest.Mock;
    let service: AuthService;

    const logCalls = () => executeRef.mock.calls.filter(([name]) => name === 'log_insert').map(([, data]) => data);

    beforeEach(() => {
        executeRef = jest.fn(async (name: string) => {
            if (name === 'signin') return { success: true, data: [[{ nUserid: USER, cPassword: HASH, isAdmin: false }]] };
            if (name === 'signin_responce') return { success: true, data: [[{ nUserid: USER }]] };
            return { success: true, data: [] };
        });
        service = Object.create(AuthService.prototype);
        Object.assign(service, {
            db: { executeRef },
            passHash: { verifyPassword: jest.fn() },
            jwtService: { sign: jest.fn(() => 'signed.jwt.token') },
            utility: { emit: jest.fn() },
            rds: { getValue: jest.fn().mockResolvedValue(''), setValue: jest.fn() },
            config: { get: jest.fn(() => 'origin') },
            expiry_token_limit_days: 15,
        });
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterEach(() => jest.restoreAllMocks());

    it('never writes the stored password hash when the password is wrong', async () => {
        (service as any).passHash.verifyPassword.mockResolvedValue(false);
        await expect(service.signIn({ password: 'x', cBroweserid: 'b' } as any)).resolves.toEqual({ msg: -1, value: 'Invalid password' });
        const logs = logCalls();
        expect(logs).toHaveLength(1);
        expect(logs[0].nLCatid).toBe(6);
        expect(JSON.stringify(logs[0])).not.toContain(HASH);
    });

    it('never writes the issued token on a successful sign-in', async () => {
        (service as any).passHash.verifyPassword.mockResolvedValue(true);
        const res = await service.signIn({ password: 'x', cBroweserid: 'b' } as any);
        expect(res.msg).toBe(1);
        const logs = logCalls();
        expect(logs).toHaveLength(1);
        expect(logs[0].nLCatid).toBe(1);
        expect(JSON.stringify(logs[0])).not.toContain('signed.jwt.token');
        expect(logs[0].jData.limit).toBe(15);
    });
});
