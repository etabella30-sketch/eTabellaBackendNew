/**
 * Wall-clock helpers of the box (CONTRACTS.md §1): a day is `YYYY-MM-DD` in the box time zone, and a session's
 * `dStartDt` is a wall-clock string in the session's own pinned zone (`tz`, spec §4.2). Pure: no clock, no I/O.
 *
 * - `startOfBoxDayMs` / `endOfBoxDayMs`: the first and last millisecond of a box-local day (the operator code is valid
 *   until 23:59:59.999 box time, DR7; the dashboard's "synced since the start of today", DR15).
 * - `parseCloudWallTime` / `sessionStartAtMs` / `sessionStartDay`: `dStartDt` as the cloud stores it
 *   (`2026-10-01 10:00:00`, `2026-10-01T10:00:00.000`, date-only `2026-10-01`, or, leniently, an ISO instant).
 */
import { isTimeZone } from '../ports';

const partFormatters = new Map<string, Intl.DateTimeFormat>();

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
    let fmt = partFormatters.get(timeZone);
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
        partFormatters.set(timeZone, fmt);
    }
    return fmt;
}

/** Offset of `timeZone` from UTC at the instant `ms` (positive east of Greenwich), whole seconds, in ms. */
export function zoneOffsetMs(ms: number, timeZone: string): number {
    const parts = partsFormatter(timeZone).formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find(p => p.type === type)?.value ?? 0);
    const hour = get('hour') % 24;
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'));
    return asUtc - Math.floor(ms / 1000) * 1000;
}

/** A wall-clock time without a zone. */
export interface WallTime {
    readonly year: number;
    readonly month: number;
    readonly day: number;
    readonly hour: number;
    readonly minute: number;
    readonly second: number;
    readonly millisecond: number;
}

const DAY_MS = 86_400_000;

/**
 * The instant at which the clocks of `timeZone` read `wall`. A repeated hour (clocks going back) resolves to its first
 * occurrence; a time inside a daylight-saving gap (clocks going forward) resolves with the offset in force before the
 * gap, i.e. one offset later than written (as most date libraries do).
 */
export function wallTimeToEpochMs(wall: WallTime, timeZone: string): number {
    const local = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, wall.millisecond);
    const offsets = [zoneOffsetMs(local - DAY_MS, timeZone), zoneOffsetMs(local, timeZone), zoneOffsetMs(local + DAY_MS, timeZone)];
    const valid = [...new Set(offsets.map(o => local - o))]
        .filter(candidate => candidate + zoneOffsetMs(candidate, timeZone) === local)
        .sort((a, b) => a - b);
    return valid.length ? valid[0] : local - offsets[0];
}

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** `YYYY-MM-DD` → its parts, or null when it is not a real calendar date. */
function dayParts(day: string): { year: number; month: number; day: number } | null {
    const m = DAY_RE.exec(String(day ?? ''));
    if (!m) return null;
    const [year, month, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const check = new Date(Date.UTC(year, month - 1, d));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== d) return null;
    return { year, month, day: d };
}

/** `day` moved by `n` calendar days (`2026-10-31`, 1 → `2026-11-01`). Throws RangeError for a malformed day. */
export function addBoxDays(day: string, n: number): string {
    const p = dayParts(day);
    if (!p) throw new RangeError(`rt-edge: "${day}" is not a YYYY-MM-DD day`);
    const d = new Date(Date.UTC(p.year, p.month - 1, p.day + n));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** The first millisecond of box-local `day` in `timeZone`. Throws RangeError for a malformed day or zone. */
export function startOfBoxDayMs(day: string, timeZone: string): number {
    const p = dayParts(day);
    if (!p) throw new RangeError(`rt-edge: "${day}" is not a YYYY-MM-DD day`);
    if (!isTimeZone(timeZone)) throw new RangeError(`rt-edge: "${timeZone}" is not an IANA time zone`);
    return wallTimeToEpochMs({ year: p.year, month: p.month, day: p.day, hour: 0, minute: 0, second: 0, millisecond: 0 }, timeZone);
}

/** The last millisecond (23:59:59.999) of box-local `day` in `timeZone`. */
export function endOfBoxDayMs(day: string, timeZone: string): number {
    return startOfBoxDayMs(addBoxDays(day, 1), timeZone) - 1;
}

/** What a cloud `dStartDt` string says. */
export type CloudWallTime =
    | { readonly kind: 'wall'; readonly day: string; readonly wall: WallTime }
    | { readonly kind: 'date'; readonly day: string }
    | { readonly kind: 'instant'; readonly ms: number };

const WALL_RE = /^\s*(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:[.,](\d{1,9}))?)?\s*(Z|[+-]\d{2}(?::?\d{2})?)?)?\s*$/i;

/**
 * Parse `dStartDt`: a wall-clock string (no offset, the cloud's form), a date-only string, or — leniently — a string
 * with `Z` or an offset (an absolute instant). Null for anything else, including impossible dates and times.
 */
export function parseCloudWallTime(text: unknown): CloudWallTime | null {
    if (typeof text !== 'string') return null;
    const m = WALL_RE.exec(text);
    if (!m) return null;
    const day = `${m[1]}-${m[2]}-${m[3]}`;
    const date = dayParts(day);
    if (!date) return null;
    if (m[4] === undefined) return { kind: 'date', day };
    const hour = Number(m[4]);
    const minute = Number(m[5]);
    const second = m[6] === undefined ? 0 : Number(m[6]);
    const millisecond = m[7] === undefined ? 0 : Math.floor(Number(`0.${m[7]}`) * 1000);
    if (hour > 23 || minute > 59 || second > 59) return null;
    const wall: WallTime = { year: date.year, month: date.month, day: date.day, hour, minute, second, millisecond };
    if (m[8] !== undefined) {
        const zone = m[8].toUpperCase();
        let offsetMin = 0;
        if (zone !== 'Z') {
            const sign = zone.startsWith('-') ? -1 : 1;
            const digits = zone.slice(1).replace(':', '');
            const oh = Number(digits.slice(0, 2));
            const om = digits.length > 2 ? Number(digits.slice(2, 4)) : 0;
            if (oh > 23 || om > 59) return null;
            offsetMin = sign * (oh * 60 + om);
        }
        const local = Date.UTC(wall.year, wall.month - 1, wall.day, hour, minute, second, millisecond);
        return { kind: 'instant', ms: local - offsetMin * 60_000 };
    }
    return { kind: 'wall', day, wall };
}

/** `tz` when the runtime knows it, else `fallback` (the box zone). */
export function usableZone(tz: unknown, fallback: string): string {
    return isTimeZone(tz) ? tz : fallback;
}

/** `dStartDt` resolved in `tz`; null when there is no start, it is date-only, or it does not parse. */
export function sessionStartAtMs(dStartDt: string | null, tz: string): number | null {
    const parsed = parseCloudWallTime(dStartDt);
    if (!parsed || parsed.kind === 'date') return null;
    if (parsed.kind === 'instant') return parsed.ms;
    if (!isTimeZone(tz)) return null;
    return wallTimeToEpochMs(parsed.wall, tz);
}

/** The start DATE of a session in its `tz` (`YYYY-MM-DD`); null when there is no start or it does not parse. */
export function sessionStartDay(dStartDt: string | null, tz: string): string | null {
    const parsed = parseCloudWallTime(dStartDt);
    if (!parsed) return null;
    if (parsed.kind !== 'instant') return parsed.day;
    if (!isTimeZone(tz)) return null;
    const parts = partsFormatter(tz).formatToParts(new Date(parsed.ms));
    const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find(p => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}
