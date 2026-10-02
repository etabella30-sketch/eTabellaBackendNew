/**
 * A session's `dStartDt` is a wall-clock string in its pinned zone `tz`, without an offset, as the cloud stores it
 * ("2026-10-01 10:00:00", "2026-10-01T10:00", or a bare date). These helpers resolve it to epoch ms (CONTRACTS.md
 * `EdgeLocalSession.startAtMs`) and read its calendar day (`isToday`).
 */

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

const offsetFormatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
    let fmt = offsetFormatters.get(timeZone);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat('en-US', {
            timeZone,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        offsetFormatters.set(timeZone, fmt);
    }
    return fmt;
}

/** Offset of `timeZone` at the instant `utcMs` (local wall clock minus UTC), ms. */
export function zoneOffsetMs(utcMs: number, timeZone: string): number {
    const parts = formatterFor(timeZone).formatToParts(new Date(utcMs));
    const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find(p => p.type === type)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return asUtc - (utcMs - (((utcMs % 1000) + 1000) % 1000));
}

interface WallParts {
    readonly y: number;
    readonly m: number;
    readonly d: number;
    readonly time: { readonly h: number; readonly mi: number; readonly s: number; readonly ms: number } | null;
}

function parseWall(wall: string | null | undefined): WallParts | null {
    if (typeof wall !== 'string') return null;
    const m = WALL_RE.exec(wall.trim());
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const check = new Date(Date.UTC(y, mo - 1, d));
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
    if (m[4] === undefined) return { y, m: mo, d, time: null };
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const s = m[6] === undefined ? 0 : Number(m[6]);
    const ms = m[7] === undefined ? 0 : Number(m[7].padEnd(3, '0'));
    if (h > 23 || mi > 59 || s > 59) return null;
    return { y, m: mo, d, time: { h, mi, s, ms } };
}

/** `YYYY-MM-DD` of a wall-clock string (its own calendar day, in its own zone); null when unreadable. */
export function wallClockDay(wall: string | null | undefined): string | null {
    const p = parseWall(wall);
    if (!p) return null;
    return `${String(p.y).padStart(4, '0')}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/**
 * Epoch ms of the wall-clock string in `timeZone`; null when there is no time (a bare date), the string is
 * unreadable or the zone unknown. A time skipped by a DST jump resolves forward (02:30 on a spring-forward night →
 * 03:30); a repeated time resolves to its first occurrence. Any trailing offset in the string is ignored: the
 * session's zone is authoritative (spec §4.2).
 */
export function zonedWallClockToEpochMs(wall: string | null | undefined, timeZone: string): number | null {
    const p = parseWall(wall);
    if (!p || !p.time) return null;
    try {
        const local = Date.UTC(p.y, p.m - 1, p.d, p.time.h, p.time.mi, p.time.s, p.time.ms);
        // Offsets in force around that wall time (two of them across a DST transition).
        const offsets = new Set([zoneOffsetMs(local - 43_200_000, timeZone), zoneOffsetMs(local, timeZone), zoneOffsetMs(local + 43_200_000, timeZone)]);
        const candidates = [...offsets].map(o => local - o);
        const exact = candidates.filter(t => t + zoneOffsetMs(t, timeZone) === local).sort((a, b) => a - b);
        // A repeated wall time: its first occurrence. A skipped one: the earlier offset, i.e. forward past the gap.
        return exact.length ? exact[0] : Math.max(...candidates);
    } catch {
        return null;
    }
}
