/**
 * Canonical line form (spec rt-local-edge-spec.md §6.2 "Canonical line", §5.2).
 *
 * Runs ONLY where the parser runs (the venue box, or the cloud for cut-mode
 * 'D' sessions). The cloud never re-canonicalises box pages: it checks digests
 * of the lines exactly as received (§5.5 step 3).
 *
 * A canonical line is a deep, frozen copy of the parser's tuple:
 *  - [1] = sanitizeLineCodes copy (page-frame atoms stripped);
 *  - [2] = the absolute buffer position;
 *  - every other slot preserved, with JSON semantics (undefined → null,
 *    NaN/±Infinity → null, -0 → 0, holes → null);
 *  - a hole, a non-array entry or `[]` becomes exactly the filler
 *    updateFeedData writes today: ['00:00:00:00', [], i]
 *    (apps/realtime-server/src/services/feed-data/feed-data.service.ts:333-335).
 *
 * The result is a pure JSON value (arrays, plain objects, strings, finite
 * numbers, booleans, null), so `JSON.parse(JSON.stringify(x))` round-trips it
 * byte for byte. That is what makes the page digest a pure serialization.
 *
 * PURITY: no I/O, no clock, no randomness. Its version is covered by
 * FEED_PARSE_VERSION (DET-10), because the golden digests are computed over
 * canonical pages.
 */

/** Lines per page when a session does not say otherwise. */
export const DEFAULT_LINES_PER_PAGE = 25;

/** Timecode of the filler row updateFeedData writes for a missing line. */
export const FILLER_TIMECODE = '00:00:00:00';

/** A canonical line: a frozen JSON tuple whose [2] is its absolute position. */
export type CanonicalLine = readonly unknown[];

/** A canonical page: up to nLines canonical lines, frozen. */
export type CanonicalPage = readonly CanonicalLine[];

// CaseView page-frame atoms (\x0F + 8-char job/date token, \x0C + 4-digit
// page no, or a lone control). Copied verbatim from feed-data.service.ts:137
// so the box and the cloud strip exactly the same bytes.
const FRAME_ATOM_PATTERNS = [/\x0F[0-9A-Za-z]{8}/g, /\x0C\d{4}/g, /[\x0C\x0F]/g];

/**
 * Strip CaseView page-frame atoms from a line's char codes. Same semantics as
 * FeedDataService.sanitizeLineCodes (feed-data.service.ts:139-149), including
 * its quirks, which the parity spec pins:
 *  - a non-array or empty input returns `codes || []`;
 *  - an array without 0x0C/0x0F is returned as the SAME reference;
 *  - otherwise a new array is built from the code points of the cleaned
 *    string (a surrogate pair keeps only its high half), and any throw
 *    (e.g. an argument list too long for String.fromCharCode) returns the
 *    input unchanged.
 */
export function sanitizeLineCodes(codes: number[]): number[] {
  try {
    if (!Array.isArray(codes) || !codes.length) return codes || [];
    if (!codes.includes(0x0C) && !codes.includes(0x0F)) return codes;
    let s = String.fromCharCode(...codes);
    for (const re of FRAME_ATOM_PATTERNS) s = s.replace(re, '');
    return Array.from(s, c => c.charCodeAt(0));
  } catch (error) {
    return codes;
  }
}

/** Throws unless nLines is a positive safe integer. */
export function assertLinesPerPage(nLines: number): number {
  if (!Number.isSafeInteger(nLines) || nLines < 1) {
    throw new RangeError(`edge-sync: lines per page must be a positive integer, got ${String(nLines)}`);
  }
  return nLines;
}

/** Number of pages that hold totalLines lines (0 for an empty transcript). */
export function pageCount(totalLines: number, nLines: number = DEFAULT_LINES_PER_PAGE): number {
  return totalLines > 0 ? Math.ceil(totalLines / nLines) : 0;
}

/** 1-based page of the line at absolute index i (feed-data.service.ts:327). */
export function pageOfIndex(i: number, nLines: number = DEFAULT_LINES_PER_PAGE): number {
  return Math.floor(i / nLines) + 1;
}

/** The filler row for a missing line at absolute index i (frozen). */
export function fillerLine(i: number): CanonicalLine {
  return deepFreeze([FILLER_TIMECODE, [], i]);
}

/** True when a buffer entry canonicalises to the filler row. */
export function isFillerEntry(line: unknown): boolean {
  return !Array.isArray(line) || line.length === 0;
}

/**
 * Deep copy with JSON.stringify semantics, returned as a JSON value.
 * `undefined` at the top level or in an array → null; in an object the key is
 * dropped. Functions and symbols behave like undefined. A BigInt (which
 * JSON.stringify would throw on) and a cycle become null, so the lane never
 * throws on odd input. `key` is what a toJSON method receives (JSON.stringify
 * passes the array index or property name).
 */
export function canonicalValue(value: unknown, key: string = ''): unknown {
  // Fast path: most tuple slots are strings, numbers or null.
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number':
      return !Number.isFinite(value) ? null : Object.is(value, -0) ? 0 : value;
    case 'undefined':
    case 'function':
    case 'symbol':
      return null;
  }
  if (value === null) return null;
  const out = toJsonValue(value, key, new Set<object>());
  return out === OMIT ? null : out;
}

const OMIT: unique symbol = Symbol('omit');

function toJsonValue(value: unknown, key: string, path: Set<object>): unknown {
  if (value !== null && (typeof value === 'object' || typeof value === 'bigint')) {
    const toJSON = (value as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') value = toJSON.call(value, key);
  }
  switch (typeof value) {
    case 'string':
    case 'boolean':
      return value;
    case 'number':
      if (!Number.isFinite(value)) return null;
      return Object.is(value, -0) ? 0 : value;
    case 'undefined':
    case 'function':
    case 'symbol':
      return OMIT;
    case 'bigint':
      return null;
  }
  if (value === null) return null;
  const obj = value as object;
  if (obj instanceof Number || obj instanceof String || obj instanceof Boolean) {
    return toJsonValue(obj.valueOf(), key, path);
  }
  if (path.has(obj)) return null;
  path.add(obj);
  try {
    if (Array.isArray(obj)) {
      const arr = new Array(obj.length);
      for (let k = 0; k < obj.length; k++) {
        const v = toJsonValue(obj[k], String(k), path);
        arr[k] = v === OMIT ? null : v;
      }
      return arr;
    }
    const res: Record<string, unknown> = {};
    for (const k of Object.keys(obj)) {
      const v = toJsonValue((obj as Record<string, unknown>)[k], k, path);
      if (v !== OMIT) res[k] = v;
    }
    return res;
  } finally {
    path.delete(obj);
  }
}

/**
 * The canonical form of the buffer entry at absolute index i (see header).
 * A tuple shorter than 3 slots is extended so [1] and [2] exist.
 */
export function canonicalLine(line: unknown, i: number): CanonicalLine {
  if (isFillerEntry(line)) return fillerLine(i);
  const src = line as unknown[];
  const len = Math.max(src.length, 3);
  const out = new Array(len);
  for (let k = 0; k < len; k++) {
    if (k === 1) out[k] = canonicalValue(sanitizeLineCodes(src[1] as number[]), '1');
    else if (k === 2) out[k] = i;
    else out[k] = canonicalValue(src[k], String(k));
  }
  return deepFreeze(out);
}

/**
 * Canonical page p (1-based) of a buffer holding n lines: the lines at
 * [(p-1)*nLines, min(p*nLines, n)), frozen. Pages are never padded; the last
 * page holds the remainder, as today's stored pages do.
 */
export function canonicalPage(
  buf: ArrayLike<unknown>,
  p: number,
  n: number = buf.length,
  nLines: number = DEFAULT_LINES_PER_PAGE,
): CanonicalPage {
  const start = (p - 1) * nLines;
  const end = Math.min(p * nLines, n);
  const page: CanonicalLine[] = [];
  for (let i = start; i < end; i++) page.push(canonicalLine(buf[i], i));
  return Object.freeze(page);
}

/** Every canonical page of a buffer (index p-1 holds page p). */
export function canonicalPages(buf: ArrayLike<unknown>, nLines: number = DEFAULT_LINES_PER_PAGE): CanonicalPage[] {
  const n = buf.length;
  const pages: CanonicalPage[] = [];
  for (let p = 1; p <= pageCount(n, nLines); p++) pages.push(canonicalPage(buf, p, n, nLines));
  return pages;
}

/** Freeze a JSON value and everything inside it. Returns the same value. */
export function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const k of Object.keys(value as object)) deepFreeze((value as Record<string, unknown>)[k]);
  }
  return value;
}
