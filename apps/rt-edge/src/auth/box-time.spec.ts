import { addBoxDays, endOfBoxDayMs, parseCloudWallTime, sessionStartAtMs, sessionStartDay, startOfBoxDayMs, usableZone, wallTimeToEpochMs, zoneOffsetMs } from './box-time';
import { contractLocalState, idKey, isSessionEnded, isSessionEnding, isSessionGone, sameId, sessionPhaseOf } from './session-facts';
import { sessionRecord } from './testing/fake-state';
import type { KernelSessionView } from '../ports';

const wall = (y: number, mo: number, d: number, h = 0, mi = 0, s = 0, ms = 0) => ({ year: y, month: mo, day: d, hour: h, minute: mi, second: s, millisecond: ms });

describe('box-time', () => {
    it('zone offsets follow daylight saving', () => {
        expect(zoneOffsetMs(Date.UTC(2026, 0, 15, 12), 'Europe/London')).toBe(0);
        expect(zoneOffsetMs(Date.UTC(2026, 6, 15, 12), 'Europe/London')).toBe(3_600_000);
        expect(zoneOffsetMs(Date.UTC(2026, 6, 15, 12), 'Asia/Kolkata')).toBe(19_800_000);
        expect(zoneOffsetMs(Date.UTC(2026, 6, 15, 12), 'America/New_York')).toBe(-14_400_000);
    });

    it('resolves wall times, including the repeated and the missing hour', () => {
        expect(wallTimeToEpochMs(wall(2026, 10, 1, 10), 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9));
        expect(wallTimeToEpochMs(wall(2026, 10, 1, 10, 0, 0, 250), 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 1, 4, 30, 0, 250));
        // 2026-10-25 01:30 happens twice in London: the first (BST) occurrence wins.
        expect(wallTimeToEpochMs(wall(2026, 10, 25, 1, 30), 'Europe/London')).toBe(Date.UTC(2026, 9, 25, 0, 30));
        // 2026-03-29 01:30 does not exist in London: read with the offset before the gap (= 02:30 BST).
        expect(wallTimeToEpochMs(wall(2026, 3, 29, 1, 30), 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 1, 30));
    });

    it('gives the first and last millisecond of a box day, also on 23 h and 25 h days', () => {
        expect(startOfBoxDayMs('2026-10-01', 'Europe/London')).toBe(Date.UTC(2026, 8, 30, 23));
        expect(endOfBoxDayMs('2026-10-01', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 22, 59, 59, 999));
        expect(endOfBoxDayMs('2026-10-25', 'Europe/London') - startOfBoxDayMs('2026-10-25', 'Europe/London') + 1).toBe(25 * 3_600_000);
        expect(endOfBoxDayMs('2026-03-29', 'Europe/London') - startOfBoxDayMs('2026-03-29', 'Europe/London') + 1).toBe(23 * 3_600_000);
        expect(endOfBoxDayMs('2026-12-31', 'UTC')).toBe(Date.UTC(2026, 11, 31, 23, 59, 59, 999));
        expect(() => startOfBoxDayMs('2026-02-30', 'UTC')).toThrow(RangeError);
        expect(() => startOfBoxDayMs('2026-10-01', 'Mars/Base')).toThrow(RangeError);
    });

    it('moves days across months and years', () => {
        expect(addBoxDays('2026-10-31', 1)).toBe('2026-11-01');
        expect(addBoxDays('2026-01-01', -1)).toBe('2025-12-31');
        expect(addBoxDays('2028-02-28', 1)).toBe('2028-02-29');
        expect(() => addBoxDays('nope', 1)).toThrow(RangeError);
    });

    it("parses the cloud's dStartDt forms and refuses impossible ones", () => {
        expect(parseCloudWallTime('2026-10-01 10:00:00')).toEqual({ kind: 'wall', day: '2026-10-01', wall: wall(2026, 10, 1, 10) });
        expect(parseCloudWallTime('2026-10-01T10:05')).toEqual({ kind: 'wall', day: '2026-10-01', wall: wall(2026, 10, 1, 10, 5) });
        expect(parseCloudWallTime('2026-10-01T10:05:07.123456')).toEqual({ kind: 'wall', day: '2026-10-01', wall: wall(2026, 10, 1, 10, 5, 7, 123) });
        expect(parseCloudWallTime('2026-10-01')).toEqual({ kind: 'date', day: '2026-10-01' });
        expect(parseCloudWallTime('2026-10-01T09:00:00Z')).toEqual({ kind: 'instant', ms: Date.UTC(2026, 9, 1, 9) });
        expect(parseCloudWallTime('2026-10-01T10:00:00+05:30')).toEqual({ kind: 'instant', ms: Date.UTC(2026, 9, 1, 4, 30) });
        for (const bad of [null, undefined, 42, '', 'tomorrow', '2026-13-01', '2026-02-30 10:00', '2026-10-01 24:00', '2026-10-01 10:61']) {
            expect(parseCloudWallTime(bad)).toBeNull();
        }
    });

    it("resolves a session's start in its own zone; date-only and missing starts have no instant", () => {
        expect(sessionStartAtMs('2026-10-01 10:00:00', 'Europe/London')).toBe(Date.UTC(2026, 9, 1, 9));
        expect(sessionStartAtMs('2026-10-01 10:00:00', 'Asia/Kolkata')).toBe(Date.UTC(2026, 9, 1, 4, 30));
        expect(sessionStartAtMs('2026-10-01', 'Europe/London')).toBeNull();
        expect(sessionStartAtMs(null, 'Europe/London')).toBeNull();
        expect(sessionStartAtMs('2026-10-01 10:00:00', 'Mars/Base')).toBeNull();
        expect(sessionStartDay('2026-10-01 23:30:00', 'Europe/London')).toBe('2026-10-01');
        expect(sessionStartDay('2026-10-01', 'Europe/London')).toBe('2026-10-01');
        expect(sessionStartDay('2026-10-01T23:30:00Z', 'Europe/London')).toBe('2026-10-02');
        expect(sessionStartDay(null, 'Europe/London')).toBeNull();
        expect(usableZone('Asia/Kolkata', 'UTC')).toBe('Asia/Kolkata');
        expect(usableZone('nope', 'UTC')).toBe('UTC');
    });
});

describe('session-facts', () => {
    const s = (over = {}) => sessionRecord({ nSesid: 's', nCaseid: 'c', ...over });
    const view = (over: Partial<KernelSessionView>) => over as KernelSessionView;

    it('ids compare case-insensitively and never match empty', () => {
        expect(idKey(' AB ')).toBe('ab');
        expect(sameId('AbC', 'abc')).toBe(true);
        expect(sameId('', '')).toBe(false);
        expect(sameId(null, undefined)).toBe(false);
    });

    it('gone = unknown, purged or deleted in the cloud', () => {
        expect(isSessionGone(null)).toBe(true);
        expect(isSessionGone(s())).toBe(false);
        expect(isSessionGone(s({ localState: 'purged' }))).toBe(true);
        expect(isSessionGone(s({ purgedAtMs: 1 }))).toBe(true);
        expect(isSessionGone(s({ deleted: true }))).toBe(true);
    });

    it('ended = SESSION_END journaled or sealed; ending adds the cloud end request and the drain', () => {
        expect(isSessionEnded(s())).toBe(false);
        expect(isSessionEnded(s({ endedAtMs: 1 }))).toBe(true);
        expect(isSessionEnded(s({ localState: 'sealed' }))).toBe(true);
        expect(isSessionEnded(s(), view({ endedAtMs: 5 }))).toBe(true);
        expect(isSessionEnded(null)).toBe(false);
        expect(isSessionEnding(s({ cloudOp: 'end' }))).toBe(true);
        expect(isSessionEnding(s({ endRequestedAtMs: 1 }))).toBe(true);
        expect(isSessionEnding(s({ localState: 'ending' }))).toBe(true);
        expect(isSessionEnding(s())).toBe(false);
    });

    it("phase: the kernel's when it holds the session, else from the record", () => {
        expect(sessionPhaseOf(s(), view({ phase: 'live' }))).toBe('live');
        expect(sessionPhaseOf(s())).toBe('not-started');
        expect(sessionPhaseOf(s({ firstLineAtMs: 1 }))).toBe('live');
        expect(sessionPhaseOf(s({ firstLineAtMs: 1, endedAtMs: 2 }))).toBe('ended');
    });

    it('maps local states onto the contract (Phase-4 states read as frozen)', () => {
        expect(contractLocalState('live')).toBe('live');
        expect(contractLocalState('fenced')).toBe('frozen');
        expect(contractLocalState('rebasing')).toBe('frozen');
        expect(contractLocalState('purged')).toBe('complete');
    });
});
