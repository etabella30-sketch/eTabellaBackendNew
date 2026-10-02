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

/** True when `tz` is an IANA zone this runtime's ICU knows. */
export function isKnownTimezone(tz?: string | null): boolean {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * DET-2 (spec §6.1): the session's zone with NO fallback. resolveTimezone
 * falls back to the HOST zone, so two machines in different zones would stamp
 * different times on the same feed. The zone is resolved once when the
 * session is created in the cloud and pinned in SESSION_HEADER; a box arming
 * a session calls this and refuses the session when it throws, so the parse
 * path never falls back there. Throws a RangeError for an absent or unknown
 * zone.
 */
export function resolveTimezoneStrict(tz?: string | null): string {
  if (!isKnownTimezone(tz)) {
    throw new RangeError(`feed-parse: unknown or missing session time zone ${JSON.stringify(tz ?? null)}; a session is armed only with a zone this runtime knows (DET-2)`);
  }
  return tz as string;
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
