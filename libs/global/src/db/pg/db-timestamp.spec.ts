import { types } from 'pg';
import { getTypeParser } from 'pg-types';
import { PG_TIMESTAMP_OID, pgWallClockTimestamp, registerWallClockTimestamps } from './db-timestamp';

/**
 * R3-006: a `timestamp without time zone` stamp (now() digits of the DB zone, or a venue
 * clock) left the API as an instant with a `Z`, shifted by the Node process zone. The
 * column must come out as the stored wall clock, with no zone attached.
 */
describe('timestamp without time zone leaves the DB as the stored wall clock', () => {
  it('turns the Postgres text into the wall-clock shape the other date fields use', () => {
    expect(pgWallClockTimestamp('2026-10-28 10:49:33.549')).toBe('2026-10-28T10:49:33.549');
    expect(pgWallClockTimestamp('2026-10-28 10:49:33')).toBe('2026-10-28T10:49:33');
    expect(pgWallClockTimestamp('2026-09-29 10:00:00')).toBe('2026-09-29T10:00:00');
  });

  it('keeps millisecond precision only, the digits the old Z string carried', () => {
    expect(pgWallClockTimestamp('2026-10-28 10:49:33.549123')).toBe('2026-10-28T10:49:33.549');
    expect(pgWallClockTimestamp('2026-10-28 10:49:33.5')).toBe('2026-10-28T10:49:33.500');
  });

  it('never attaches a zone, whatever the process zone is', () => {
    const out = pgWallClockTimestamp('2026-10-28 10:49:33.549');
    expect(out).not.toMatch(/Z|[+-]\d\d:\d\d$/);
    // A browser reads it as its own local 10:49, not as a 10:49Z instant.
    const d = new Date(out);
    expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([10, 49, 33, 549]);
  });

  it('passes on what it does not recognise as Postgres printed it', () => {
    expect(pgWallClockTimestamp('infinity')).toBe('infinity');
    expect(pgWallClockTimestamp('-infinity')).toBe('-infinity');
    expect(pgWallClockTimestamp('0001-01-01 00:00:00 BC')).toBe('0001-01-01 00:00:00 BC');
    expect(pgWallClockTimestamp('')).toBe('');
  });

  describe('registration on node-pg', () => {
    it('replaces only the timestamp-without-zone parser; timestamptz stays an instant', () => {
      const before = getTypeParser(PG_TIMESTAMP_OID)('2026-10-28 10:49:33.549');
      expect(before).toBeInstanceOf(Date);          // node-pg's default: digits in the process zone

      registerWallClockTimestamps();

      expect(types.getTypeParser(PG_TIMESTAMP_OID)).toBe(pgWallClockTimestamp);
      expect(getTypeParser(PG_TIMESTAMP_OID)('2026-10-28 10:49:33.549')).toBe('2026-10-28T10:49:33.549');
      const tz = getTypeParser(1184)('2026-10-28 10:49:33.549+05:30');
      expect(tz).toBeInstanceOf(Date);
      expect((tz as Date).toISOString()).toBe('2026-10-28T05:19:33.549Z');
    });

    it('is idempotent', () => {
      registerWallClockTimestamps();
      registerWallClockTimestamps();
      expect(types.getTypeParser(PG_TIMESTAMP_OID)).toBe(pgWallClockTimestamp);
    });
  });
});
