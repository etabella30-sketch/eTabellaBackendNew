/**
 * Hearing-timezone helpers — pure, Intl-only (no moment dependency; this lib
 * must stay side-effect free). A session's `cTimezone` (IANA name, chosen at
 * create time) decides the wall clock stamped onto live feed lines; anything
 * invalid or absent degrades to the server's zone, which is the exact
 * pre-timezone behavior.
 */

/** Server's own IANA zone — the historical implicit default. */
export function serverTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Returns `tz` when it is a usable IANA zone, else the server zone. */
export function resolveTimezone(tz?: string | null): string {
  if (tz) {
    try {
      new Intl.DateTimeFormat('en-GB', { timeZone: tz });
      return tz;
    } catch {
      // fall through — unknown zone name
    }
  }
  return serverTimezone();
}

/**
 * HH:mm:ss wall clock in the given zone. Replaces the legacy `getIndianTM()`
 * (`toLocaleTimeString('en-IN', …)` = server zone): same shape, now
 * zone-aware. 'en-GB' keeps 2-digit 24h output ('en-IN' rendered 24:xx for
 * midnight on some ICU builds; en-GB gives 00:xx).
 */
export function wallClockTime(tz?: string | null, now: Date = new Date()): string {
  return now.toLocaleTimeString('en-GB', {
    timeZone: resolveTimezone(tz),
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
