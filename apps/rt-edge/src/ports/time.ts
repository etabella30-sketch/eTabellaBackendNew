/**
 * Box-local calendar days (CONTRACTS.md §1): a day is `YYYY-MM-DD` in the box time zone (`BoxConfig.box.timeZone`).
 * Every port that takes or returns a `day` uses this function, so the operator code, the Connectivity Log day menu,
 * readiness and the dashboard's "today" always agree.
 */

const dayFormatters = new Map<string, Intl.DateTimeFormat>();

/** `YYYY-MM-DD` of the instant `ms` (epoch ms) in IANA zone `timeZone`. Throws RangeError for an unknown zone. */
export function boxDay(ms: number, timeZone: string): string {
    let fmt = dayFormatters.get(timeZone);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
        dayFormatters.set(timeZone, fmt);
    }
    const parts = fmt.formatToParts(new Date(ms));
    const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find(p => p.type === type)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/** True when `day` is a well-formed calendar date `YYYY-MM-DD` (no zone involved). */
export function isBoxDay(day: unknown): day is string {
    if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** True when `timeZone` is an IANA zone this Node runtime knows. */
export function isTimeZone(timeZone: unknown): timeZone is string {
    if (typeof timeZone !== 'string' || timeZone.trim() === '') return false;
    try {
        new Intl.DateTimeFormat('en-US', { timeZone });
        return true;
    } catch {
        return false;
    }
}
