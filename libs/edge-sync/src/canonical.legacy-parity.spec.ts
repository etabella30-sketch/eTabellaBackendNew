/**
 * Parity with today's cloud scrubber: libs/edge-sync sanitizeLineCodes must
 * behave exactly like FeedDataService.sanitizeLineCodes
 * (apps/realtime-server/src/services/feed-data/feed-data.service.ts:137-149),
 * quirks included, because the box now strips what the cloud used to strip.
 *
 * The reference is the REAL service method (constructed with stub
 * dependencies; no Redis, no socket, no disk). This file and
 * snapshot.legacy-parity.spec.ts are the only edge-sync files that import from
 * apps/ (edge-sync.purity.spec.ts allows exactly these two).
 */
import { FeedDataService } from '../../../apps/realtime-server/src/services/feed-data/feed-data.service';
import { sanitizeLineCodes } from './canonical';

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

function makeReference(): { service: FeedDataService; stop: () => void } {
  const log = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  const service = new FeedDataService(
    {} as any,
    { scanKeys: jest.fn().mockResolvedValue([]), getValue: jest.fn() } as any,
    { error: jest.fn() } as any,
    {} as any,
  );
  return {
    service,
    stop: () => {
      clearInterval((service as any).flushTimer);
      log.mockRestore();
    },
  };
}

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** A random char-code array biased towards page-frame atoms and odd values. */
function randomCodes(rand: () => number): unknown {
  const alnum = (): number => ALNUM.charCodeAt(Math.floor(rand() * ALNUM.length));
  const len = Math.floor(rand() * 40);
  const out: unknown[] = [];
  while (out.length < len) {
    const r = rand();
    if (r < 0.35) out.push(32 + Math.floor(rand() * 95));
    else if (r < 0.45) out.push(0x0c);
    else if (r < 0.55) out.push(0x0f);
    else if (r < 0.62) out.push(0x0f, ...Array.from({ length: 8 }, alnum));
    else if (r < 0.68) out.push(0x0c, ...Array.from({ length: 4 }, () => 48 + Math.floor(rand() * 10)));
    else if (r < 0.72) out.push(0x0f, ...Array.from({ length: 1 + Math.floor(rand() * 7) }, alnum));
    else if (r < 0.76) out.push(0xd83d, 0xde00); // a surrogate pair
    else if (r < 0.79) out.push(0xd800 + Math.floor(rand() * 0x800)); // a lone surrogate
    else if (r < 0.82) out.push(0x10000 + 0x0c); // wraps to 0x0C in fromCharCode
    else if (r < 0.85) out.push(rand() * 300); // non-integer
    else if (r < 0.87) out.push(-1 - Math.floor(rand() * 5));
    else if (r < 0.89) out.push('12');
    else if (r < 0.9) out.push(null);
    else if (r < 0.95) out.push(Math.floor(rand() * 0xffff));
    else out.push(0x0c, 0x0f);
  }
  return out;
}

describe('sanitizeLineCodes parity with FeedDataService (feed-data.service.ts:137-149)', () => {
  let ref: ReturnType<typeof makeReference>;
  beforeAll(() => {
    ref = makeReference();
  });
  afterAll(() => ref.stop());

  const expectSame = (input: unknown) => {
    const expected = ref.service.sanitizeLineCodes(input as number[]);
    const actual = sanitizeLineCodes(input as number[]);
    expect(actual).toEqual(expected);
    // Same reference semantics: unchanged arrays come back as the same object.
    expect(actual === input).toBe(expected === input);
  };

  it('agrees on hand-picked inputs, including every quirk', () => {
    const cases: unknown[] = [
      undefined,
      null,
      0,
      '',
      'not-an-array',
      { length: 2 },
      [],
      [72, 105],
      [0x0f, 65, 66, 67, 68, 69, 70, 71, 72, 73],
      [0x0c, 48, 48, 49, 50, 65],
      [65, 0x0c, 0x0f, 66],
      [0x0f, 65, 66],
      [0xd83d, 0xde00, 0x0c],
      [0x1000c, 65, 0x0c],
      [65.9, 0x0c],
      ['12', 0x0c],
      [null, 0x0f],
      [-1, 0x0c],
    ];
    for (const input of cases) expectSame(input);
  });

  it('agrees on 5,000 seeded random inputs', () => {
    const rand = mulberry32(0xed9e5);
    for (let k = 0; k < 5000; k++) expectSame(randomCodes(rand));
  });

  it('agrees on a line long enough to strain the String.fromCharCode spread', () => {
    const huge = new Array(300_000).fill(65);
    huge[5] = 0x0c;
    expectSame(huge);
  });
});
