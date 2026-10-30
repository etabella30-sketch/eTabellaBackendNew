import { types } from 'pg';

/** Postgres OID of `timestamp without time zone` (its array type, 1115, has no column in this schema). */
export const PG_TIMESTAMP_OID = 1114;

const PG_TIMESTAMP_TEXT = /^(\d{4,}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})(?:\.(\d+))?$/;

/**
 * A `timestamp without time zone` column holds the digits of SOME wall clock — `now()`
 * in the DB session's zone (FactMaster.dCreateDt, RSessionMaster.dCreatedt, …), the
 * venue's clock (RSessionMaster.dStartDt, CaseMaster.dHearingDt) or the user's — and
 * the column itself cannot say which. node-pg's default parser read those digits in
 * the Node process zone and JSON then sent that instant with a `Z`, so a 10:49 IST
 * stamp left a UTC droplet as "…T10:49:33.549Z" and every viewer saw it 5:30 off
 * (R3-006). Guessing one zone for every column would move the venue clocks wrongly.
 *
 * So the column goes out as the stored wall clock, in the shape the other wall-clock
 * fields already use ('YYYY-MM-DDTHH:mm:ss', plus '.SSS' when the stamp has a fraction):
 * `2026-10-28 10:49:33.549123` -> `2026-10-28T10:49:33.549`. The fraction is cut to
 * milliseconds, what the old `Z` string carried; the `T` form parses on every browser
 * as the viewer's local time (a space form is NaN on Safari). Anything else Postgres
 * prints for the type ('infinity', a BC date) is passed on as printed.
 */
export function pgWallClockTimestamp(text: string): string {
  const m = PG_TIMESTAMP_TEXT.exec(text);
  if (!m) return text;
  const fraction = m[3] ? '.' + m[3].slice(0, 3).padEnd(3, '0') : '';
  return `${m[1]}T${m[2]}${fraction}`;
}

/**
 * Registers {@link pgWallClockTimestamp} for OID 1114 on node-pg's process-wide type
 * registry, so every Pool in this process answers the column as wall-clock text.
 * `timestamp with time zone` (1184) keeps node-pg's Date: those columns are instants.
 * Idempotent; DbService calls it before its Pool is built.
 */
export function registerWallClockTimestamps(): void {
  types.setTypeParser(PG_TIMESTAMP_OID, pgWallClockTimestamp);
}
