import { bearerToken } from './auth.port';
import { boxDay, isBoxDay, isTimeZone, sessionZone } from './time';

describe('boxDay', () => {
    it('formats the box-local calendar day', () => {
        const instant = Date.UTC(2026, 9, 1, 23, 30); // 2026-10-01 23:30 UTC
        expect(boxDay(instant, 'UTC')).toBe('2026-10-01');
        expect(boxDay(instant, 'Europe/London')).toBe('2026-10-02'); // BST, 00:30
        expect(boxDay(instant, 'America/New_York')).toBe('2026-10-01');
        expect(boxDay(Date.UTC(2026, 9, 1, 19, 0), 'Asia/Kolkata')).toBe('2026-10-02'); // 00:30 IST
    });

    it('throws for an unknown zone', () => {
        expect(() => boxDay(0, 'Mars/Olympus')).toThrow(RangeError);
    });
});

describe('isBoxDay / isTimeZone', () => {
    it('validates days', () => {
        expect(isBoxDay('2026-10-01')).toBe(true);
        expect(isBoxDay('2028-02-29')).toBe(true);
        expect(isBoxDay('2026-02-29')).toBe(false);
        expect(isBoxDay('2026-13-01')).toBe(false);
        expect(isBoxDay('2026-1-1')).toBe(false);
        expect(isBoxDay(20261001)).toBe(false);
    });

    it('validates zones', () => {
        expect(isTimeZone('Europe/London')).toBe(true);
        expect(isTimeZone('UTC')).toBe(true);
        expect(isTimeZone('Mars/Olympus')).toBe(false);
        expect(isTimeZone('')).toBe(false);
        expect(isTimeZone(null)).toBe(false);
    });

    it("sessionZone: a session's pinned zone for the box screens, else null (user decision 2026-10-05)", () => {
        expect(sessionZone('Asia/Dubai')).toBe('Asia/Dubai');
        expect(sessionZone(' Asia/Kolkata ')).toBe('Asia/Kolkata');
        expect(sessionZone('')).toBeNull();
        expect(sessionZone('Mars/Olympus')).toBeNull();
        expect(sessionZone(null)).toBeNull();
        expect(sessionZone(undefined)).toBeNull();
    });
});

describe('bearerToken', () => {
    it('reads `Authorization: Bearer <token>`', () => {
        expect(bearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
        expect(bearerToken('bearer   abc ')).toBe('abc');
        expect(bearerToken(['Bearer one', 'Bearer two'])).toBe('one');
    });

    it('refuses anything else', () => {
        expect(bearerToken(undefined)).toBeNull();
        expect(bearerToken(null)).toBeNull();
        expect(bearerToken('')).toBeNull();
        expect(bearerToken('Basic dXNlcjpwYXNz')).toBeNull();
        expect(bearerToken('Bearer')).toBeNull();
        expect(bearerToken('Bearer a b')).toBeNull();
    });
});
