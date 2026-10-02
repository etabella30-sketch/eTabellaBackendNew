import { wallClockDay, zonedWallClockToEpochMs, zoneOffsetMs } from './wall-clock';

describe('wall-clock (session dStartDt in its pinned zone)', () => {
    it('resolves a wall-clock time in its zone, with or without seconds, T or space, millis', () => {
        expect(zonedWallClockToEpochMs('2026-10-01 10:00:00', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0));
        expect(zonedWallClockToEpochMs('2026-10-01T10:00', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0));
        expect(zonedWallClockToEpochMs('2026-10-01 10:00:05.250', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0, 5, 250));
        expect(zonedWallClockToEpochMs('2026-12-01 10:00', 'Europe/London')).toBe(Date.UTC(2026, 11, 1, 10, 0));
        expect(zonedWallClockToEpochMs('2026-10-01 10:00', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 1, 4, 30));
        expect(zonedWallClockToEpochMs('2026-10-01 10:00', 'America/New_York')).toBe(Date.UTC(2026, 9, 1, 14, 0));
    });

    it('ignores a trailing offset: the session zone is authoritative', () => {
        expect(zonedWallClockToEpochMs('2026-10-01T10:00:00Z', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0));
        expect(zonedWallClockToEpochMs('2026-10-01T10:00:00+05:30', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9, 0));
    });

    it('is null for a bare date, garbage, impossible dates and unknown zones', () => {
        expect(zonedWallClockToEpochMs('2026-10-01', 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs(null, 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs(undefined, 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs('tomorrow at ten', 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs('2026-02-30 10:00', 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs('2026-10-01 24:00', 'Europe/London')).toBeNull();
        expect(zonedWallClockToEpochMs('2026-10-01 10:00', 'Mars/Olympus')).toBeNull();
    });

    it('resolves a time skipped by spring-forward past the gap, and a repeated time to its first occurrence', () => {
        // London 2026-03-29: 01:00 GMT → 02:00 BST. 01:30 does not exist → 02:30 BST = 01:30 UTC.
        expect(zonedWallClockToEpochMs('2026-03-29 01:30', 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 1, 30));
        // London 2026-10-25: 02:00 BST → 01:00 GMT. 01:30 happens twice; the first is 00:30 UTC.
        expect(zonedWallClockToEpochMs('2026-10-25 01:30', 'Europe/London')).toBe(Date.UTC(2026, 9, 25, 0, 30));
    });

    it('reads the calendar day of the wall clock string itself', () => {
        expect(wallClockDay('2026-10-01 23:30:00')).toBe('2026-10-01');
        expect(wallClockDay('2026-10-01')).toBe('2026-10-01');
        expect(wallClockDay('2026-13-01')).toBeNull();
        expect(wallClockDay(null)).toBeNull();
    });

    it('zoneOffsetMs reads the offset in force at an instant', () => {
        expect(zoneOffsetMs(Date.UTC(2026, 9, 1, 9, 0), 'Europe/London')).toBe(3_600_000);
        expect(zoneOffsetMs(Date.UTC(2026, 11, 1, 9, 0, 0, 500), 'Europe/London')).toBe(0);
        expect(zoneOffsetMs(Date.UTC(2026, 9, 1, 9, 0), 'Asia/Kolkata')).toBe(19_800_000);
    });
});
