import { getTypeParser } from 'pg-types';
import { hearingWallClock, withHearingWallClock } from './hearing-wall-clock';

/**
 * Regression (2026-09-24): a 10:00 hearing showed as 04:30 on Case Home — node-pg read the
 * `timestamp without time zone` in the server's zone (India, UTC+05:30) and JSON sent it as
 * UTC. The row must leave coreapi as the wall clock that is stored, on any server zone.
 */
describe('hearing start as the venue wall clock', () => {
  const pgTimestamp = getTypeParser(1114) as (text: string) => Date;   // what node-pg does to the column

  it('gives back exactly the stored digits after node-pg parsed them', () => {
    expect(hearingWallClock(pgTimestamp('2026-09-29 10:00:00'))).toBe('2026-09-29T10:00:00');
    expect(hearingWallClock(pgTimestamp('2026-12-31 23:45:30'))).toBe('2026-12-31T23:45:30');
    expect(hearingWallClock(pgTimestamp('2027-01-01 00:00:00'))).toBe('2027-01-01T00:00:00');
  });

  it('leaves text, nulls and anything else as it is', () => {
    expect(hearingWallClock('2026-09-29T10:00:00')).toBe('2026-09-29T10:00:00');
    expect(hearingWallClock(null)).toBeNull();
    expect(hearingWallClock(undefined)).toBeUndefined();
    expect(hearingWallClock(new Date('nope'))).toBeInstanceOf(Date);
  });

  it('rewrites only dHearingDt on the case row', () => {
    const row = { msg: 1, nCaseid: 'c1', cHearingTimezone: 'Asia/Dubai', nHearingDays: 10, dHearingDt: pgTimestamp('2026-09-29 10:00:00') };
    expect(withHearingWallClock(row)).toEqual({ ...row, dHearingDt: '2026-09-29T10:00:00' });
    const noHearing = { msg: 1, nCaseid: 'c1' };
    expect(withHearingWallClock(noHearing)).toBe(noHearing);
    expect(withHearingWallClock(undefined)).toBeUndefined();
  });
});
