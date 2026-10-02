import { canonicalLine } from './canonical';
import { fingerprintBuffer, lineFingerprint } from './fingerprint';

const codes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const line = (text: string, i: number, extra: unknown[] = []) => ['10:00:00', codes(text), i, 'FL', 1, i + 1, (i + 1) * 1e6, ...extra];

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('line fingerprints (spec §6.2 boundary scan)', () => {
  it('is a deterministic 53-bit integer', () => {
    const fp = lineFingerprint(line('hello', 0));
    expect(Number.isSafeInteger(fp)).toBe(true);
    expect(fp).toBeGreaterThanOrEqual(0);
    expect(lineFingerprint(line('hello', 0))).toBe(fp);
  });

  it('ignores the parser [2] (canonical [2] is the position)', () => {
    expect(lineFingerprint(line('same', 3))).toBe(lineFingerprint(['10:00:00', codes('same'), 99, 'FL', 1, 4, 4e6]));
  });

  it('changes with any other slot', () => {
    const base = lineFingerprint(line('text', 0));
    expect(lineFingerprint(line('texT', 0))).not.toBe(base);
    expect(lineFingerprint(['10:00:01', codes('text'), 0, 'FL', 1, 1, 1e6])).not.toBe(base);
    expect(lineFingerprint(['10:00:00', codes('text'), 0, 'Q', 1, 1, 1e6])).not.toBe(base);
    expect(lineFingerprint(['10:00:00', codes('text'), 0, 'FL', 1, 1, 2e6])).not.toBe(base);
    expect(lineFingerprint([...line('text', 0), null])).not.toBe(base);
  });

  it('keeps shapes apart (["a",[1]] vs ["a1",[]], 1 vs "1", [] vs {})', () => {
    expect(lineFingerprint(['a', [1], 0])).not.toBe(lineFingerprint(['a1', [], 0]));
    expect(lineFingerprint(['t', [], 0, 1])).not.toBe(lineFingerprint(['t', [], 0, '1']));
    expect(lineFingerprint(['t', [], 0, []])).not.toBe(lineFingerprint(['t', [], 0, {}]));
    expect(lineFingerprint(['t', [], 0, 1.5])).not.toBe(lineFingerprint(['t', [], 0, 1]));
    expect(lineFingerprint(['t', [], 0, true])).not.toBe(lineFingerprint(['t', [], 0, false]));
  });

  it('hashes what canonicalisation keeps: sanitized text, null for undefined/NaN, 0 for -0', () => {
    expect(lineFingerprint(['t', codes('A\x0F12345678B'), 0])).toBe(lineFingerprint(['t', codes('AB'), 0]));
    expect(lineFingerprint(['t', [], 0, undefined])).toBe(lineFingerprint(['t', [], 0, null]));
    expect(lineFingerprint(['t', [], 0, NaN])).toBe(lineFingerprint(['t', [], 0, null]));
    expect(lineFingerprint(['t', [], 0, -0])).toBe(lineFingerprint(['t', [], 0, 0]));
    expect(lineFingerprint(['t', [], 0, { a: 1, b: undefined }])).toBe(lineFingerprint(['t', [], 0, { a: 1 }]));
    expect(lineFingerprint(['t', null, 0])).toBe(lineFingerprint(['t', [], 0]));
  });

  it('gives a hole, a non-array and [] the filler fingerprint', () => {
    const filler = lineFingerprint(['00:00:00:00', [], 5]);
    for (const entry of [undefined, null, [], 'x', 7]) expect(lineFingerprint(entry)).toBe(filler);
  });

  it('survives cycles', () => {
    const loop: any[] = ['x'];
    loop.push(loop);
    expect(Number.isSafeInteger(lineFingerprint(['t', [], 0, loop]))).toBe(true);
  });

  it('fingerprints a canonical line exactly like its source (restore rebuilds the same fingerprints)', () => {
    const rand = mulberry32(42);
    const values: unknown[] = [undefined, null, NaN, -0, 1.25, 'x', '', [1, undefined], { k: 'v', u: undefined }, true, new Date(0), 7];
    for (let k = 0; k < 2000; k++) {
      const len = Math.floor(rand() * 11);
      const raw: unknown[] = new Array(len);
      for (let s = 0; s < len; s++) {
        if (s === 1) raw[s] = rand() < 0.2 ? codes('a\x0C0001b\x0F') : codes(String(k));
        else if (rand() < 0.8) raw[s] = values[Math.floor(rand() * values.length)];
      }
      const i = Math.floor(rand() * 1000);
      expect(lineFingerprint(canonicalLine(raw, i))).toBe(lineFingerprint(raw));
    }
  });

  it('equal fingerprints ⇔ equal canonical lines, on seeded random tuples', () => {
    const rand = mulberry32(7);
    const pool = ['a', 'b', '', 'FL', 'Q'];
    const make = () => {
      const t = ['10:00:0' + Math.floor(rand() * 3), codes(pool[Math.floor(rand() * pool.length)]), 0];
      if (rand() < 0.5) t.push(pool[Math.floor(rand() * pool.length)]);
      if (rand() < 0.3) t.push(Math.floor(rand() * 3));
      return t;
    };
    for (let k = 0; k < 3000; k++) {
      const a = make();
      const b = make();
      const sameCanonical = JSON.stringify(canonicalLine(a, 0)) === JSON.stringify(canonicalLine(b, 0));
      expect(lineFingerprint(a) === lineFingerprint(b)).toBe(sameCanonical);
    }
  });

  it('fingerprints a whole buffer, index by index', () => {
    const buf = [line('a', 0), undefined, line('c', 2)];
    const fp = fingerprintBuffer(buf);
    expect(fp).toBeInstanceOf(Float64Array);
    expect(Array.from(fp)).toEqual(buf.map(lineFingerprint));
  });
});
