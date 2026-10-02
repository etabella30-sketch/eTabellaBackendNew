import {
  MASKED_FIELDS,
  encodeValue,
  lineRecords,
  diffRecords,
  formatDiff,
  compareRuns,
  assessDeterminism,
  maskCall,
  deliveryDigests,
  diffDeliveries,
  blockDigests,
  digestListDifferences,
  outputDigest,
  goldenSetDigest,
  duplicateIds,
  lineFieldDigests,
  describeCalls,
} from './compare';

const codes = (s: string) => [...s].map((c) => c.charCodeAt(0));
const bridgeLine = (index: number, text: string, id: number, extra: any[] = []) =>
  ['10:00:00:00', codes(text), index, 'FL', 1, index, id, ...extra];

/** The masks the gate used until DET-1 / DET-3 (FEED_PARSE_VERSION 1.0.0), for the masking mechanism's own specs. */
const OLD_MASKS = { B: [6], C: [0] };

describe('MASKED_FIELDS', () => {
  it('masks nothing since DET-1…DET-12: --determinism shows no field differing between two runs', () => {
    // Changing this list changes what the release gate compares: a field goes
    // back in only with the evidence of a failing --determinism run (README "Masks").
    expect(MASKED_FIELDS).toEqual({ B: [], C: [] });
    expect(Object.isFrozen(MASKED_FIELDS)).toBe(true);
    expect(Object.isFrozen(MASKED_FIELDS.B)).toBe(true);
  });
});

describe('deliveries', () => {
  const call = (event: string, tuples: any[][]) => ({ fn: 'emitDelivery', event, payload: encodeValue({ i: 1, d: tuples, date: 's' }) });

  it('masks the tuples a payload carries, and the ids of a removeLines call under a [6] mask', () => {
    const masked = maskCall(call('TCP-DATA', [bridgeLine(0, 'a', 1e6)]), [6]);
    expect(masked.payload.$obj.d[0][6]).toEqual({ $masked: 1 });
    expect(masked.payload.$obj.d[0][1]).toEqual(codes('a'));
    expect(maskCall({ fn: 'removeLines', event: null, payload: encodeValue([5, 6]) }, [6]).payload).toEqual([{ $masked: 1 }, { $masked: 1 }]);
    expect(maskCall({ fn: 'removeLines', event: null, payload: encodeValue([5, 6]) }, []).payload).toEqual([5, 6]);
  });

  it('digests per chunk, and the per-chunk diff names the chunks that deliver differently', () => {
    const a = deliveryDigests([{ chunk: 0, calls: [call('TCP-DATA', [bridgeLine(0, 'a', 1)])] }, { chunk: 3, calls: [call('TCP-DATA', [bridgeLine(1, 'b', 2)])] }], []);
    const b = deliveryDigests([{ chunk: 0, calls: [call('TCP-DATA', [bridgeLine(0, 'a', 1)])] }, { chunk: 3, calls: [call('TCP-DATA', [bridgeLine(1, 'B', 2)])] }], []);
    expect(a).toMatchObject({ calls: 2, chunks: 2 });
    expect(a.perChunk[0]).toMatch(/^0:1:[0-9a-f]{12}$/);
    expect(a.sha256).not.toBe(b.sha256);
    expect(diffDeliveries(a.perChunk, b.perChunk).map((d: any) => d.chunk)).toEqual([3]);
    expect(diffDeliveries(a.perChunk, a.perChunk.slice(0, 1))).toEqual([{ chunk: 3, golden: expect.objectContaining({ calls: 1 }), replay: null }]);
  });

  it('a masked field does not change the digest; an unmasked one does', () => {
    const one = deliveryDigests([{ chunk: 0, calls: [call('TCP-DATA', [bridgeLine(0, 'a', 1)])] }], [6]);
    const two = deliveryDigests([{ chunk: 0, calls: [call('TCP-DATA', [bridgeLine(0, 'a', 2)])] }], [6]);
    expect(one.sha256).toBe(two.sha256);
    expect(deliveryDigests([{ chunk: 0, calls: [call('TCP-DATA', [bridgeLine(0, 'a', 2)])] }], []).sha256).not.toBe(one.sha256);
  });

  it('groups per-chunk digests into blocks (extended corpora keep no per-chunk digest) and finds differing entries', () => {
    const per = ['0:2:aaaaaaaaaaaa', '255:1:bbbbbbbbbbbb', '256:3:cccccccccccc', '900:1:dddddddddddd'];
    const blocks = blockDigests(per);
    expect(blocks.map((b: string) => b.split(':').slice(0, 2).join(':'))).toEqual(['0-255:3', '256-511:3', '768-1023:1']);
    const changed = blockDigests(['0:2:aaaaaaaaaaaa', '255:1:bbbbbbbbbbbb', '256:3:ffffffffffff', '900:1:dddddddddddd']);
    expect(digestListDifferences(blocks, changed)).toEqual([1]);
    expect(digestListDifferences(['a'], ['a', 'b'])).toEqual([1]);
  });

  it('describes removeLines by its ids', () => {
    expect(describeCalls([{ fn: 'removeLines', event: null, payload: encodeValue([2e6]) }])).toEqual(['        removeLines: ids [2000000]']);
  });
});

describe('digests of the compared output (DET-10)', () => {
  const parts = {
    protocol: 'B', masked: [], input: { sha256: 'i' }, buffer: { sha256: 'b', lines: 2 },
    deliveries: { sha256: 'd' }, canonical: { root: 'c' }, duplicateIdChunks: 0,
  };

  it('outputDigest changes with the buffer, the deliveries, the canonical root and the [6] uniqueness count', () => {
    const base = outputDigest(parts);
    expect(outputDigest({ ...parts })).toBe(base);
    expect(outputDigest({ ...parts, buffer: { sha256: 'b2', lines: 2 } })).not.toBe(base);
    expect(outputDigest({ ...parts, deliveries: { sha256: 'd2' } })).not.toBe(base);
    expect(outputDigest({ ...parts, canonical: { root: 'c2' } })).not.toBe(base);
    expect(outputDigest({ ...parts, duplicateIdChunks: 1 })).not.toBe(base);
  });

  it('goldenSetDigest is 16 hex digits, independent of order, and changes with any golden', () => {
    const set = goldenSetDigest([{ id: 'a', outputDigest: '1' }, { id: 'b', outputDigest: '2' }]);
    expect(set).toMatch(/^[0-9a-f]{16}$/);
    expect(goldenSetDigest([{ id: 'b', outputDigest: '2' }, { id: 'a', outputDigest: '1' }])).toBe(set);
    expect(goldenSetDigest([{ id: 'a', outputDigest: '1' }, { id: 'b', outputDigest: '3' }])).not.toBe(set);
  });
});

describe('duplicateIds ([6] uniqueness)', () => {
  it('lists ids on more than one line; the empty line-0 slot and id-less lines never count', () => {
    // eslint-disable-next-line no-sparse-arrays
    const buf = [[, , 0], bridgeLine(1, 'a', 5), bridgeLine(2, 'b', 7), bridgeLine(3, 'c', 5), ['', [], 4, 'FL', 1, 4, null], bridgeLine(5, 'x', 0)];
    expect(duplicateIds(buf)).toEqual([5]);
    expect(duplicateIds([bridgeLine(1, 'a', 1), bridgeLine(2, 'b', 2)])).toEqual([]);
  });
});

describe('encodeValue', () => {
  it('keeps undefined and holes apart from null, and survives a JSON round trip', () => {
    // eslint-disable-next-line no-sparse-arrays
    const tuple = ['t', [65], 0, , null, undefined];
    const encoded = encodeValue(tuple);
    expect(JSON.parse(JSON.stringify(encoded))).toEqual(['t', [65], 0, { $undef: 1 }, null, { $undef: 1 }]);
    expect(JSON.stringify(encodeValue(null))).not.toBe(JSON.stringify(encodeValue(undefined)));
  });

  it('spells out the numbers JSON would turn into null or 0', () => {
    expect(encodeValue(NaN)).toEqual({ $num: 'NaN' });
    expect(encodeValue(Infinity)).toEqual({ $num: 'Infinity' });
    expect(encodeValue(-Infinity)).toEqual({ $num: '-Infinity' });
    expect(encodeValue(-0)).toEqual({ $num: '-0' });
    expect(encodeValue(0)).toBe(0);
  });

  it('sorts object keys so equal objects encode identically', () => {
    expect(JSON.stringify(encodeValue({ b: 1, a: [undefined] }))).toBe(JSON.stringify(encodeValue({ a: [undefined], b: 1 })));
  });
});

describe('lineRecords', () => {
  it('orders lines by [2], then by buffer position, and records position and length', () => {
    const buffer = [bridgeLine(2, 'two', 7), [], bridgeLine(0, 'zero', 5)];
    const records = lineRecords(buffer, []);
    expect(records.map((r: any) => r.pos)).toEqual([2, 1, 0]); // [2]=0, then the [] at position 1, then [2]=2
    expect(records[0]).toMatchObject({ pos: 2, n: 7, txt: 'zero' });
    expect(records[1]).toEqual({ pos: 1, n: 0, f: [] }); // an empty slot: no txt
  });

  it('replaces masked fields with {"$masked":1} and decodes [1] into txt', () => {
    const [record] = lineRecords([bridgeLine(0, 'Café ’', 4242)], [6]);
    expect(record.f[6]).toEqual({ $masked: 1 });
    expect(record.f[1]).toEqual(codes('Café ’'));
    expect(record.txt).toBe('Café ’');
  });

  it('records a slot that is not a tuple as a value', () => {
    expect(lineRecords([undefined], [])).toEqual([{ pos: 0, n: null, v: { $undef: 1 } }]);
  });
});

describe('diffRecords', () => {
  const golden = lineRecords([bridgeLine(0, 'Good morning.', 1), bridgeLine(1, 'Thank you.', 2)], [6]);

  it('finds nothing when every unmasked field matches, whatever the masked field holds', () => {
    const replay = lineRecords([bridgeLine(0, 'Good morning.', 900), bridgeLine(1, 'Thank you.', 901)], [6]);
    expect(diffRecords(golden, replay, [6])).toEqual([]);
  });

  it('reports a changed unmasked field with both values', () => {
    const replay = lineRecords([bridgeLine(0, 'Good morning!', 1), bridgeLine(1, 'Thank you.', 2)], [6]);
    const diffs = diffRecords(golden, replay, [6]);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].at).toBe(0);
    expect(diffs[0].diffs).toEqual([{ field: 1, a: codes('Good morning.'), b: codes('Good morning!') }]);
  });

  it('reports a trailing slot that appears or disappears (length and the field)', () => {
    const replay = lineRecords([bridgeLine(0, 'Good morning.', 1, [null]), bridgeLine(1, 'Thank you.', 2)], [6]);
    const fields = diffRecords(golden, replay, [6])[0].diffs.map((d: any) => d.field);
    expect(fields).toEqual(['length', 7]);
  });

  it('tells undefined from null', () => {
    const a = lineRecords([['t', [], 0, undefined]], []);
    const b = lineRecords([['t', [], 0, null]], []);
    expect(diffRecords(a, b, [])).toHaveLength(1);
  });

  it('reports lines missing from either side', () => {
    const replay = lineRecords([bridgeLine(0, 'Good morning.', 1)], [6]);
    expect(diffRecords(golden, replay, [6])).toEqual([{ at: 1, a: golden[1], b: null, diffs: null }]);
    expect(diffRecords(replay, golden, [6])).toEqual([{ at: 1, a: null, b: golden[1], diffs: null }]);
  });
});

describe('formatDiff', () => {
  it('prints text fields as text and the masked and undefined markers by name', () => {
    const golden = lineRecords([bridgeLine(0, 'Good morning.', 1, [undefined])], [6]);
    const replay = lineRecords([bridgeLine(0, 'Good morning!', 1, [null])], [6]);
    const text = formatDiff(diffRecords(golden, replay, [6])).join('\n');
    expect(text).toContain('line #0 (index 0, buffer position 0, timecode 10:00:00:00, "Good morning.")');
    expect(text).toContain('[1] text');
    expect(text).toContain('golden: "Good morning."');
    expect(text).toContain('replay: "Good morning!"');
    expect(text).toContain('[7] tabs');
    expect(text).toContain('golden: undefined');
    expect(text).toContain('replay: null');
  });

  it('caps the output and says how many lines it left out', () => {
    const golden = lineRecords(Array.from({ length: 30 }, (_, n) => bridgeLine(n, 'a', n)), []);
    const replay = lineRecords(Array.from({ length: 30 }, (_, n) => bridgeLine(n, 'b', n)), []);
    const out = formatDiff(diffRecords(golden, replay, []), { limit: 2 });
    expect(out[out.length - 1]).toContain('28 more differing line(s)');
  });
});

describe('compareRuns / assessDeterminism', () => {
  const run = (bridgeIds: number[], caseviewClock: string) => ({
    corpora: [
      { id: 'b', protocol: 'B', lines: lineRecords(bridgeIds.map((id, n) => bridgeLine(n, 'x', id)), []) },
      { id: 'c', protocol: 'C', lines: lineRecords([[caseviewClock, codes('y'), 0]], []) },
    ],
  });

  it('counts every field that differs between runs, per protocol', () => {
    const result = compareRuns(run([1, 523], '10:00:01'), run([1, 918], '10:00:02'));
    expect(result.byProtocol.B.fields).toEqual({ 6: { lines: 1, corpora: ['b'] } });
    expect(result.byProtocol.C.fields).toEqual({ 0: { lines: 1, corpora: ['c'] } });
    expect(result.structural).toEqual([]);
  });

  it('with no masks (today), any differing field is unexpected', () => {
    const verdict = assessDeterminism(compareRuns(run([1, 523], '10:00:01'), run([1, 918], '10:00:02')));
    expect(verdict.unexpected.map((r: any) => r.protocol + r.field)).toEqual(['B6', 'C0']);
    expect(verdict.covered).toEqual([]);
  });

  it('accepts differences inside the masks only (the mechanism, with the 1.0.0 masks)', () => {
    const verdict = assessDeterminism(compareRuns(run([1, 523], '10:00:01'), run([1, 918], '10:00:02')), OLD_MASKS);
    expect(verdict.unexpected).toEqual([]);
    expect(verdict.covered.map((r: any) => r.protocol + r.field)).toEqual(['B6', 'C0']);
  });

  it('flags a difference outside the masks as unexpected, never as masked', () => {
    const a = run([1, 2], '10:00:01');
    const b = run([1, 2], '10:00:01');
    b.corpora[0].lines[1].f[1] = codes('changed');
    const verdict = assessDeterminism(compareRuns(a, b), OLD_MASKS);
    expect(verdict.unexpected).toEqual([{ protocol: 'B', field: '1', lines: 1, corpora: ['b'] }]);
  });

  it('notes masked fields that did not differ, and line-count differences', () => {
    const a = run([1, 2], '10:00:01');
    const b = run([1, 2, 3], '10:00:01');
    const verdict = assessDeterminism(compareRuns(a, b), OLD_MASKS);
    expect(verdict.unobserved.map((u: any) => u.protocol + u.field)).toEqual(['B6', 'C0']);
    expect(verdict.structural).toEqual(['b: 2 line(s) in the first run, 3 in the second']);
  });

  it('compares deliveries field by field, the canonical root, and reports duplicate [6] ids as structural', () => {
    const withDelivery = (text: string, root: string, dups = 0) => ({
      corpora: [{
        id: 'b', protocol: 'B', canonicalRoot: root, duplicateIdChunks: dups,
        lines: lineRecords([bridgeLine(0, 'x', 1)], []),
        deliveries: [{ chunk: 0, calls: [{ fn: 'emitDelivery', event: 'TCP-DATA', payload: encodeValue({ d: [bridgeLine(0, text, 1)] }) }] }],
      }],
    });
    const result = compareRuns(withDelivery('x', 'r'), withDelivery('y', 'r2', 1));
    expect(Object.keys(result.byProtocol.B.fields).sort()).toEqual(['canonical root', 'delivery [1]']);
    expect(result.structural).toEqual(['b: [6] line ids not unique at 1 chunk boundary in the second run']);
  });

  it('compares extended corpora by per-field line digests and delivery digests, never their text', () => {
    const ext = (text: string, perChunk: string[]) => ({
      corpora: [{ id: 'e', protocol: 'B', extended: true, lineDigests: lineFieldDigests(lineRecords([bridgeLine(0, text, 1)], [])), deliveryDigests: perChunk }],
    });
    const result = compareRuns(ext('a', ['0:1:aaaaaaaaaaaa']), ext('b', ['0:1:bbbbbbbbbbbb']));
    expect(result.byProtocol.B.fields).toEqual({ 3: { lines: 1, corpora: ['e'] }, deliveries: { lines: 1, corpora: ['e'] } });
    expect(JSON.stringify(ext('secret', []))).not.toContain('secret');
  });
});
