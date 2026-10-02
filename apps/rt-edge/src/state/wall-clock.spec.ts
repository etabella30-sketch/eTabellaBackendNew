import { wallClockToEpochMs, zoneOffsetMs } from './wall-clock';

describe('state wall clock (dStartDt resolved in the session zone)', () => {
    it('resolves a wall-clock string in a zone with and without DST', () => {
        expect(wallClockToEpochMs('2026-10-01 10:00:00', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0, 0));
        expect(wallClockToEpochMs('2026-12-01T10:00', 'Europe/London')).toBe(Date.UTC(2026, 11, 1, 10, 0, 0));
        expect(wallClockToEpochMs('2026-10-01 10:00:00', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 1, 4, 30, 0));
        expect(wallClockToEpochMs('2026-10-01 10:00:00.250', 'UTC')).toBe(Date.UTC(2026, 9, 1, 10, 0, 0, 250));
    });

    it('takes a string with its own offset as an absolute instant', () => {
        expect(wallClockToEpochMs('2026-10-01T10:00:00Z', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 1, 10, 0, 0));
        expect(wallClockToEpochMs('2026-10-01T10:00:00+02:00', 'UTC')).toBe(Date.UTC(2026, 9, 1, 8, 0, 0));
    });

    it('is null for date-only, malformed, impossible or zone-less values', () => {
        expect(wallClockToEpochMs('2026-10-01', 'Europe/London')).toBeNull();
        expect(wallClockToEpochMs('tomorrow', 'Europe/London')).toBeNull();
        expect(wallClockToEpochMs('2026-02-30 10:00', 'Europe/London')).toBeNull();
        expect(wallClockToEpochMs('2026-10-01 25:00', 'Europe/London')).toBeNull();
        expect(wallClockToEpochMs('2026-10-01 10:00', null)).toBeNull();
        expect(wallClockToEpochMs('2026-10-01 10:00', 'Mars/Olympus')).toBeNull();
        expect(wallClockToEpochMs(null, 'UTC')).toBeNull();
    });

    it('settles the offset across the spring-forward and fall-back changes', () => {
        // London: 2026-03-29 01:00 UTC clocks go forward; 2026-10-25 01:00 UTC back.
        expect(wallClockToEpochMs('2026-03-29 03:00:00', 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 2, 0, 0));
        expect(wallClockToEpochMs('2026-10-25 03:00:00', 'Europe/London')).toBe(Date.UTC(2026, 9, 25, 3, 0, 0));
        expect(zoneOffsetMs(Date.UTC(2026, 6, 1), 'Europe/London')).toBe(3_600_000);
        expect(zoneOffsetMs(Date.UTC(2026, 0, 1), 'Europe/London')).toBe(0);
    });
});
