/**
 * `CaseMaster."dHearingDt"` is the hearing start as the VENUE's wall clock — a
 * `timestamp without time zone`, read together with `cHearingTimezone`.
 *
 * node-pg turns such a column into a JS Date by reading the digits in the SERVER's
 * own zone, and JSON then sends that instant in UTC: a 10:00 hearing left a coreapi
 * running in India as "…T04:30:00.000Z", and Case Home printed 04:30 (2026-09-24).
 * The admin form would then save 04:30 back, moving the hearing on every edit.
 *
 * The Date's LOCAL fields are exactly the stored digits, whatever the server's zone,
 * so the column goes out as the wall-clock text it is: 'YYYY-MM-DDTHH:mm:ss'.
 */
export function hearingWallClock(value: unknown): unknown {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    + `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}

/** The case row with its hearing start as wall-clock text (see {@link hearingWallClock}). */
export function withHearingWallClock<T>(row: T): T {
  if (!row || typeof row !== 'object' || !('dHearingDt' in row)) return row;
  const r = row as T & { dHearingDt?: unknown };
  return { ...r, dHearingDt: hearingWallClock(r.dHearingDt) } as T;
}
