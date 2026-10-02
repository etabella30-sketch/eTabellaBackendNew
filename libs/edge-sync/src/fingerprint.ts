/**
 * Per-line fingerprints for the boundary scan (spec §6.2: `fp[i] =
 * cyrb53(canonicalFields(buf[i]))`, "content hash, ~1 ms / 3k lines, no
 * allocation").
 *
 * The fingerprint of a buffer entry is a 53-bit cyrb53 hash of exactly what
 * its canonical line (canonical.ts) depends on, apart from [2]: the canonical
 * [2] is always the absolute position, which the scan compares index by index,
 * so the parser's own [2] (rewritten in place by the parser) never makes a
 * line look changed. Hence, up to hash collisions:
 *
 *   lineFingerprint(a) === lineFingerprint(b)
 *     ⇔ canonicalLine(a, i) deep-equals canonicalLine(b, i) for every i
 *
 * and lineFingerprint(canonicalLine(x, i)) === lineFingerprint(x), so a cutter
 * restored from canonical pages has the same fingerprints as the live buffer.
 * Collisions are caught by the cutter's periodic digest audit (§6.2 "Audit").
 *
 * Fingerprints never leave the process (they are not on the wire and are
 * recomputed on restore), so they may use the platform's float layout.
 *
 * PURITY: synchronous, no I/O. Hashing state is module-level scratch, so the
 * scan allocates only for objects inside a tuple and for lines that need
 * sanitizing (0x0C/0x0F present).
 */
import { FILLER_TIMECODE, isFillerEntry, sanitizeLineCodes } from './canonical';

// Type tags keep different shapes from hashing alike (['a',[1]] vs ['a1',[]]).
const TAG_LINE = 0x4c494e45;
const TAG_INDEX = 0x49445831;
const TAG_NULL = 0x4e554c4c;
const TAG_TRUE = 0x54525545;
const TAG_FALSE = 0x46414c53;
const TAG_INT = 0x494e5433;
const TAG_F64 = 0x46363434;
const TAG_STR = 0x53545231;
const TAG_ARR = 0x41525231;
const TAG_OBJ = 0x4f424a31;
const TAG_END = 0x454e4431;

const SEED = 0x65646765; // "edge"

let h1 = 0;
let h2 = 0;
const f64 = new Float64Array(1);
const u32 = new Uint32Array(f64.buffer);
// Objects currently being walked (cycle guard); reused, never reallocated.
const walkPath: object[] = [];

function reset(): void {
  h1 = 0xdeadbeef ^ SEED;
  h2 = 0x41c6ce57 ^ SEED;
}

function mix(w: number): void {
  h1 = Math.imul(h1 ^ w, 2654435761);
  h2 = Math.imul(h2 ^ w, 1597334677);
}

function finish(): number {
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

function mixString(s: string): void {
  mix(TAG_STR);
  mix(s.length);
  let k = 0;
  for (; k + 1 < s.length; k += 2) mix(s.charCodeAt(k) | (s.charCodeAt(k + 1) << 16));
  if (k < s.length) mix(s.charCodeAt(k));
}

function mixNumber(v: number): void {
  if (!Number.isFinite(v)) {
    mix(TAG_NULL);
  } else if (Number.isInteger(v) && v >= -2147483648 && v <= 2147483647) {
    mix(TAG_INT);
    mix(v | 0); // -0 | 0 === 0, as JSON writes it
  } else {
    f64[0] = v;
    mix(TAG_F64);
    mix(u32[0]);
    mix(u32[1]);
  }
}

/** Resolve toJSON like JSON.stringify does; undefined result means "omit". */
function resolve(value: unknown, key: string | number): unknown {
  if (value !== null && (typeof value === 'object' || typeof value === 'bigint')) {
    const toJSON = (value as { toJSON?: unknown }).toJSON;
    if (typeof toJSON === 'function') value = toJSON.call(value, String(key));
  }
  if (value instanceof Number || value instanceof String || value instanceof Boolean) value = value.valueOf();
  return value;
}

function isOmitted(value: unknown): boolean {
  const t = typeof value;
  return t === 'undefined' || t === 'function' || t === 'symbol';
}

/** Hash one value with canonicalValue's semantics (omitted → null here). */
function mixValue(raw: unknown, key: string | number): void {
  mixResolved(resolve(raw, key));
}

/** mixValue after toJSON/unboxing (JSON.stringify never applies toJSON twice). */
function mixResolved(value: unknown): void {
  switch (typeof value) {
    case 'string':
      mixString(value);
      return;
    case 'number':
      mixNumber(value);
      return;
    case 'boolean':
      mix(value ? TAG_TRUE : TAG_FALSE);
      return;
    case 'object':
      break;
    default: // undefined, function, symbol, bigint → null
      mix(TAG_NULL);
      return;
  }
  if (value === null || walkPath.includes(value as object)) {
    mix(TAG_NULL);
    return;
  }
  walkPath.push(value as object);
  try {
    if (Array.isArray(value)) {
      mix(TAG_ARR);
      mix(value.length);
      for (let k = 0; k < value.length; k++) {
        const el = value[k];
        if (typeof el === 'number') mixNumber(el); // char codes: the hot path
        else mixValue(el, k);
      }
      return;
    }
    mix(TAG_OBJ);
    for (const k of Object.keys(value as object)) {
      const v = resolve((value as Record<string, unknown>)[k], k);
      if (isOmitted(v)) continue;
      mixString(k);
      mixResolved(v);
    }
    mix(TAG_END);
  } finally {
    walkPath.pop();
  }
}

/**
 * 53-bit fingerprint of one buffer entry's canonical content (index-free).
 * Holes, non-arrays and `[]` hash as the filler row, as they canonicalise.
 */
export function lineFingerprint(line: unknown): number {
  reset();
  mix(TAG_LINE);
  if (isFillerEntry(line)) {
    mix(3);
    mixString(FILLER_TIMECODE);
    mix(TAG_ARR);
    mix(0);
    mix(TAG_INDEX);
    return finish();
  }
  const src = line as unknown[];
  const len = Math.max(src.length, 3);
  mix(len);
  for (let k = 0; k < len; k++) {
    if (k === 1) mixValue(sanitizeLineCodes(src[1] as number[]), '1');
    else if (k === 2) mix(TAG_INDEX);
    else mixValue(src[k], k);
  }
  return finish();
}

/** Fingerprints of every entry of a buffer (index i holds line i). */
export function fingerprintBuffer(buf: ArrayLike<unknown>): Float64Array {
  const n = buf.length;
  const fp = new Float64Array(n);
  for (let i = 0; i < n; i++) fp[i] = lineFingerprint(buf[i]);
  return fp;
}
