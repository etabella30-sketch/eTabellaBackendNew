import { createHash, createHmac, randomBytes, scryptSync } from 'crypto';

import { CodeEntryLockout, lockoutKeys, SlidingWindowLimiter } from './attempt-limits';
import { deviceHash, deviceLabelOf, emailDigest, generateRoomCode, newDeviceCookieValue, operatorCodeMatches, roomCodeHash, usableDeviceCookie } from './codes';
import { codeFeatureOn, EDGE_FEATURE_DISABLED, EdgeFeatureDisabledError, featureOfBoxTokenKind, isFeatureDisabled, requireCodeFeature } from './features';
import { actorOf } from './principal';
import { EDGE_CODE_ALPHABET, isRoomCodeShape } from '../contracts';
import { edgeErrorResponse, EdgePortError, EdgePrincipal } from '../ports';

describe('codes', () => {
    it('draws room codes uniformly from the 32-letter alphabet', () => {
        const seen = new Set<string>();
        const counts = new Map<string, number>();
        for (let i = 0; i < 2000; i++) {
            const code = generateRoomCode();
            expect(isRoomCodeShape(code)).toBe(true);
            seen.add(code);
            for (const ch of code) counts.set(ch, (counts.get(ch) ?? 0) + 1);
        }
        expect(seen.size).toBeGreaterThan(1990);
        expect([...counts.keys()].sort().join('')).toBe([...EDGE_CODE_ALPHABET].sort().join(''));
    });

    it('hashes room codes with the box secret (HMAC over "room:" + code)', () => {
        const secret = randomBytes(32);
        expect(roomCodeHash(secret, 'K7Q4M2')).toBe(createHmac('sha256', secret).update('room:K7Q4M2').digest('hex'));
        expect(roomCodeHash(secret, 'K7Q4M2')).not.toBe(roomCodeHash(randomBytes(32), 'K7Q4M2'));
        expect(emailDigest(secret, ' Ann@Firm.example ')).toBe(emailDigest(secret, 'ann@firm.example'));
        expect(emailDigest(secret, 'ann@firm.example')).not.toContain('ann');
    });

    it('device cookies: 32 random bytes base64url, stored only as sha256; foreign values are ignored', () => {
        const value = newDeviceCookieValue();
        expect(value).toMatch(/^[A-Za-z0-9_-]{43}$/);
        expect(newDeviceCookieValue()).not.toBe(value);
        expect(deviceHash(value)).toBe(createHash('sha256').update(value).digest('hex'));
        expect(usableDeviceCookie(value)).toBe(value);
        for (const bad of [null, undefined, 42, '', 'short', 'has space in it ok', 'x'.repeat(129), 'a;b=c-0123456789']) {
            expect(usableDeviceCookie(bad)).toBeNull();
        }
    });

    it('labels devices coarsely from the User-Agent', () => {
        expect(deviceLabelOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)')).toBe('iPad');
        expect(deviceLabelOf('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('iPhone');
        expect(deviceLabelOf('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Android');
        expect(deviceLabelOf('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Windows');
        expect(deviceLabelOf('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBe('Mac');
        expect(deviceLabelOf('curl/8.0')).toBe('Other');
        expect(deviceLabelOf(null)).toBe('Other');
    });

    it('checks operator codes with scrypt in constant time and never matches a malformed delivery', async () => {
        const salt = randomBytes(16);
        const delivery = { alg: 'scrypt' as const, salt: salt.toString('base64'), hash: scryptSync('OPR6Z3K91', salt, 32, { N: 1024 }).toString('base64'), scryptN: 1024 };
        await expect(operatorCodeMatches('OPR6Z3K91', delivery)).resolves.toBe(true);
        await expect(operatorCodeMatches('OPR6Z3K92', delivery)).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', { ...delivery, scryptN: 1000 })).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', { ...delivery, scryptN: 1 << 21 })).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', { ...delivery, salt: '' })).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', { ...delivery, hash: 'AAAA' })).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', { ...delivery, alg: 'bcrypt' as never })).resolves.toBe(false);
        await expect(operatorCodeMatches('OPR6Z3K91', null as never)).resolves.toBe(false);
    });
});

describe('attempt limits', () => {
    it('lockout keys: device cookie hash and client IP, else one anonymous key', () => {
        expect(lockoutKeys('10.0.0.1', 'abc')).toEqual(['device:abc', 'ip:10.0.0.1']);
        expect(lockoutKeys(null, 'abc')).toEqual(['device:abc']);
        expect(lockoutKeys('10.0.0.1', null)).toEqual(['ip:10.0.0.1']);
        expect(lockoutKeys(null, null)).toEqual(['anonymous']);
    });

    it('locks on the 5th wrong try for 60 s, does not extend, and forgets tries outside the window', () => {
        const lock = new CodeEntryLockout();
        const keys = ['ip:a'];
        expect([1, 2, 3, 4].map(i => lock.fail(keys, i).attemptsLeft)).toEqual([4, 3, 2, 1]);
        expect(lock.fail(keys, 5)).toEqual({ retryAfterSec: 60, attemptsLeft: 0 });
        expect(lock.lockedFor(keys, 30_004)).toBe(31);
        expect(lock.lockedFor(keys, 60_005)).toBe(0);
        expect(lock.fail(keys, 60_006).attemptsLeft).toBe(4); // a fresh run after the lock
        const old = new CodeEntryLockout();
        for (let i = 0; i < 4; i++) old.fail(keys, i);
        expect(old.fail(keys, 15 * 60_000 + 10).attemptsLeft).toBe(4); // the first four aged out
    });

    it('succeed() forgets the tries; the key map stays bounded', () => {
        const lock = new CodeEntryLockout(5, 60_000, 60_000, 3);
        lock.fail(['ip:a'], 0);
        lock.succeed(['ip:a']);
        expect(lock.size).toBe(0);
        for (let i = 0; i < 10; i++) lock.fail([`ip:${i}`], 100_000 + i);
        expect(lock.size).toBeLessThanOrEqual(3);
    });

    it('sliding window: 20 per minute per key, retryAfterSec until the oldest call leaves the window', () => {
        const limiter = new SlidingWindowLimiter();
        for (let i = 0; i < 20; i++) expect(limiter.take('ip', i * 1000).ok).toBe(true);
        expect(limiter.take('ip', 20_000)).toEqual({ ok: false, retryAfterSec: 40 });
        expect(limiter.take('other', 20_000).ok).toBe(true);
        expect(limiter.take('ip', 60_000).ok).toBe(true);
    });
});

describe('code sign-in switches (DR23)', () => {
    const on = { features: { roomCodes: true, operatorCode: false } } as never;

    it('reads only an explicit true as on; a missing config or flag is off', () => {
        expect(codeFeatureOn(on, 'roomCodes')).toBe(true);
        expect(codeFeatureOn(on, 'operatorCode')).toBe(false);
        expect(codeFeatureOn(null, 'roomCodes')).toBe(false);
        expect(codeFeatureOn({ features: {} } as never, 'roomCodes')).toBe(false);
        expect(codeFeatureOn({ features: { roomCodes: 'yes' } } as never, 'roomCodes')).toBe(false);
        expect(featureOfBoxTokenKind('room-code')).toBe('roomCodes');
        expect(featureOfBoxTokenKind('operator')).toBe('operatorCode');
    });

    it('a switched-off route is a 404 feature_disabled with exactly {msg, error, message}, through every error path', () => {
        expect(() => requireCodeFeature(on, 'roomCodes')).not.toThrow();
        let err: unknown;
        try {
            requireCodeFeature(on, 'operatorCode');
        } catch (e) {
            err = e;
        }
        expect(isFeatureDisabled(err)).toBe(true);
        expect(err).toBeInstanceOf(EdgePortError);
        expect(err).toMatchObject({ code: 'feature_disabled', status: 404, feature: 'operatorCode' }); // a contract code (CONTRACTS.md §3)
        expect(edgeErrorResponse(err)).toEqual({ status: 404, body: { msg: -1, error: EDGE_FEATURE_DISABLED, message: 'the operator code is switched off on this box' } });
        expect(new EdgeFeatureDisabledError('roomCodes').toBody()).toEqual({ msg: -1, error: 'feature_disabled', message: 'room codes are switched off on this box' });
        expect(isFeatureDisabled(new EdgePortError('not_found', 'x'))).toBe(false);
    });
});

describe('actorOf', () => {
    const base = { userId: 'u1', name: 'Priya Shah', mintedBy: null } as unknown as EdgePrincipal;
    it('names the user, or for an operator session the minting admin plus the typed operator name (O-10)', () => {
        expect(actorOf({ ...base, kind: 'online' })).toEqual({ nUserid: 'u1', name: 'Priya Shah', via: 'online', operatorName: null });
        expect(actorOf({ ...base, kind: 'online' }, 'ignored')).toEqual({ nUserid: 'u1', name: 'Priya Shah', via: 'online', operatorName: null });
        const op = { ...base, kind: 'operator', userId: null, name: 'Operator', mintedBy: { nUserid: 'a1', name: 'Ann Admin' } } as EdgePrincipal;
        expect(actorOf(op, ' Jo ')).toEqual({ nUserid: null, name: 'Ann Admin', via: 'operator', operatorName: 'Jo' });
        expect(actorOf({ ...op, mintedBy: null })).toEqual({ nUserid: null, name: 'Operator', via: 'operator', operatorName: null });
    });
});
