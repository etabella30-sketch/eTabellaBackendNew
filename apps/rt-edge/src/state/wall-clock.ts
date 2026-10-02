/**
 * The cloud stores a session start (`dStartDt`) as a wall-clock string in the session's pinned zone, with no offset
 * (contracts/local-cases.ts: "`dStartDt` resolved in `tz` by the box; null when there is no start or it is
 * date-only"). These helpers resolve it to epoch ms with Intl only (no dependency), so sessions sort by their real
 * start even when two sessions of one box carry different zones.
 */

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

/** Offset of `timeZone` at instant `ms` (local − UTC), in ms. Throws RangeError for an unknown zone. */
export function zoneOffsetMs(ms: number, timeZone: string): number {
    const parts = formatterFor(timeZone).formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find(p => p.type === type)?.value ?? 0);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return asUtc - (ms - (ms % 1000 + 1000) % 1000);
}

const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,6}))?)?$/;

/**
 * `2026-10-01 10:00:00` (or `…T10:00`, optional fraction) in `timeZone` → epoch ms. Null for a date-only value, an
 * unparsable value, an impossible date, or an unknown zone. A string that carries its own offset (`Z`, `+01:00`) is
 * taken as an absolute instant.
 */
export function wallClockToEpochMs(value: string | null | undefined, timeZone: string | null | undefined): number | null {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    if (/(Z|[+-]\d{2}:?\d{2})$/i.test(text) && /\d{2}:\d{2}/.test(text)) {
        const abs = Date.parse(text.replace(' ', 'T'));
        return Number.isFinite(abs) ? abs : null;
    }
    const m = WALL_RE.exec(text);
    if (!m || !timeZone) return null;
    const [y, mo, d, h, mi, s] = [m[1], m[2], m[3], m[4], m[5], m[6] ?? '0'].map(Number);
    const fraction = m[7] ? Math.floor(Number(`0.${m[7]}`) * 1000) : 0;
    const naive = Date.UTC(y, mo - 1, d, h, mi, s, fraction);
    const check = new Date(naive);
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d || h > 23 || mi > 59 || s > 59) return null;
    try {
        // Two passes settle the offset across a DST change (the second uses the offset at the first guess).
        let guess = naive - zoneOffsetMs(naive, timeZone);
        guess = naive - zoneOffsetMs(guess, timeZone);
        return guess;
    } catch {
        return null;
    }
}
