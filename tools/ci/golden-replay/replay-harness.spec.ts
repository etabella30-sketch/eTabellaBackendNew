import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { BridgeParserService, CaseviewParserService, FEED_PARSE_VERSION, SessionContext } from '@app/feed-parse';
import { replayCorpus, replayAll, feedParseVersion, detectedProtocol, canonicalSummary, ReplayInput, CHUNK_TIMEOUT_MS } from './replay-harness';
import { listCorpora, loadCorpus, replayInput } from './corpora';
import { MASKED_FIELDS, lineRecords, diffRecords, formatDiff, diffDeliveries, deliveryDigests, decodeValue } from './compare';
import { staleFiles } from './build-synthetic-corpora';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { summarize, splitVersion } = require('./gate');

/*
 * The harness against the real libs/feed-parse services. The last block reads
 * the committed corpora and goldens (read-only) and replays them, which is
 * the gate's own check run through ts-jest.
 */

const REPO = path.resolve(__dirname, '..', '..', '..');
const latin1 = (s: string) => [...Buffer.from(s, 'latin1')];
const cmd = (letter: string, data: number[] = []) => [0x02, letter.charCodeAt(0), ...data, 0x03];
const textOf = (tuple: any[]) => String.fromCharCode(...(tuple[1] || []));

function input(protocol: 'B' | 'C', chunks: number[][]): ReplayInput {
  return {
    id: 'spec',
    protocol,
    nSesid: '00000000-0000-4000-8000-000000000999',
    nLines: 25,
    cTimezone: 'UTC',
    chunks: chunks.map((bytes, n) => ({ bytes: Buffer.from(bytes), tRecv: Date.UTC(2026, 0, 5, 10, 0, n) })),
  };
}

describe('replayCorpus', () => {
  it('feeds Bridge chunks through framing and the parser; [6] comes from the lib\'s allocator (DET-3), not the sink', async () => {
    const out = await replayCorpus(input('B', [
      cmd('P', [1, 0]),
      [...cmd('N', [1]), ...cmd('T', [10, 0, 0, 0]), ...latin1('Good')],
      latin1(' morning.'),
      [...cmd('N', [2]), ...cmd('T', [10, 0, 5, 0]), ...latin1('Thank you.')],
    ]));
    expect(out.fed).toBe(4);
    expect(out.lineBuffer.map(textOf)).toEqual(['', 'Good morning.', 'Thank you.']);
    expect(out.lineBuffer[1].slice(0, 7)).toEqual(['10:00:00:00', latin1('Good morning.'), 1, 'FL', 1, 1, 1e6]);
    expect(out.lineBuffer[2][6]).toBe(2e6); // the sink still answers id || nextId++, and is ignored
    expect(out.duplicateIdChunks).toBe(0);
  });

  it('records every delivery by the chunk that made it, encoded at the moment of the call', async () => {
    const out = await replayCorpus(input('B', [
      cmd('P', [1, 0]),
      [...cmd('N', [1]), ...cmd('T', [10, 0, 0, 0]), ...latin1('A')],
      [...cmd('N', [2]), ...cmd('T', [10, 0, 5, 0]), ...cmd('D')], // D on an empty line: removeLines + pop
    ]));
    expect(out.deliveries.map((d) => d.chunk)).toEqual([1, 2]);
    const calls = out.deliveries[0].calls;
    expect(calls.map((c) => `${c.fn}:${c.event}`)).toContain('emitDelivery:TCP-DATA');
    const tcp = decodeValue(calls.filter((c) => c.event === 'TCP-DATA').pop()!.payload);
    expect(tcp.d.map(textOf)).toEqual(['', 'A']); // what was delivered then, not the final buffer
    expect(out.deliveries[1].calls.map((c) => c.fn)).toContain('removeLines');
    expect(out.deliveryDigest).toEqual(deliveryDigests(out.deliveries, []));
  });

  it('keeps digests only when keepCalls is false (extended corpora), and masks the digests and canonical root', async () => {
    const chunks = [cmd('P', [1, 0]), [...cmd('N', [1]), ...cmd('T', [10, 0, 0, 0]), ...latin1('Hi')]];
    const full = await replayCorpus(input('B', chunks));
    const lean = await replayCorpus({ ...input('B', chunks), keepCalls: false });
    expect(lean.deliveries).toEqual([]);
    expect(lean.deliveryDigest).toEqual(full.deliveryDigest);
    const masked = await replayCorpus({ ...input('B', chunks), mask: [6] });
    expect(masked.deliveryDigest.sha256).not.toBe(full.deliveryDigest.sha256);
    expect(masked.canonical.root).toBe(canonicalSummary(masked, [6]).root);
    expect(full.canonical.root).not.toBe(masked.canonical.root);
  });

  it('CaseView [0] is the chunk\'s receive time in the corpus zone (DET-1), so two replays agree', async () => {
    const chunks = [latin1('Q.  Where?'), [0xf9, ...latin1('0001'), 0xfa, ...latin1('A.  Home.')]];
    const one = await replayCorpus(input('C', chunks));
    const two = await replayCorpus(input('C', chunks));
    expect(one.lineBuffer.map((l: any) => l[0])).toEqual(['10:00:00', '10:00:01']);
    expect(JSON.stringify(two.lineBuffer)).toBe(JSON.stringify(one.lineBuffer));
  });

  it('reassembles a command split across chunks, as the live framing does', async () => {
    const whole = [...cmd('N', [1]), ...cmd('T', [10, 0, 0, 0]), ...latin1('Hi')];
    const split = await replayCorpus(input('B', whole.map((b) => [b])));
    const once = await replayCorpus(input('B', [whole]));
    expect(lineRecords(split.lineBuffer, [])).toEqual(lineRecords(once.lineBuffer, []));
  });

  it('feeds CaseView chunks to the CaseView parser and skips empty chunks', async () => {
    const out = await replayCorpus(input('C', [latin1('Q.  Where?'), [], [0xf9, ...latin1('0001'), 0xfa, ...latin1('A.  Home.')]]));
    expect(out.fed).toBe(2);
    expect(out.lineBuffer.map(textOf)).toEqual(['Q.  Where?', 'A.  Home.']);
    expect(out.lineBuffer[0][0]).toBe('10:00:00'); // the first chunk's receive time (DET-1)
  });

  it('waits for each chunk\'s queued work before the next, so the final buffer is complete', async () => {
    const chunks = Array.from({ length: 60 }, (_, n) => [...cmd('N', [n + 1]), ...cmd('T', [10, 0, n, 0]), ...latin1(`line ${n}`)]);
    const out = await replayCorpus(input('B', chunks));
    expect(out.lineBuffer).toHaveLength(61);
    expect(textOf(out.lineBuffer[60])).toBe('line 59');
  });
});

describe('replayAll', () => {
  it('collects console and Nest Logger output while replaying and restores both afterwards', async () => {
    const log = console.log;
    const overrideLogger = jest.spyOn(Logger, 'overrideLogger');
    const res = await replayAll([input('B', [[...cmd('N', [1]), ...latin1('a'), 0x02, 0x48, 0x03]])]);
    expect(res.consoleLines.some((l) => l.includes('Unknown command: K'))).toBe(true);
    expect(console.log).toBe(log);
    expect(overrideLogger).toHaveBeenCalledTimes(2);
    overrideLogger.mockRestore();
  });
});

describe('the per-chunk watchdog', () => {
  /** A lane task that never settles, the shape of a stalled parser regression. */
  const stall = (queue: SessionContext['parseQueue']) => void queue.addTask(() => new Promise<void>(() => { }));

  afterEach(() => jest.restoreAllMocks());

  it('fails the replay, naming the corpus and chunk, when a Bridge lane stalls', async () => {
    jest.spyOn(BridgeParserService.prototype, 'sendToParseData').mockImplementationOnce((ctx: SessionContext) => stall(ctx.bridgeQueue));
    await expect(replayCorpus(input('B', [latin1('a'), cmd('P', [1, 0]), latin1('b')]), { chunkTimeoutMs: 50 }))
      .rejects.toThrow('replay stalled: corpus spec, chunk 1 of 3 did not finish within 50 ms');
  });

  it('fails the replay when a CaseView lane stalls, and replayAll restores the console', async () => {
    const log = console.log;
    jest.spyOn(CaseviewParserService.prototype, 'parseData')
      .mockImplementationOnce(async () => undefined)
      .mockImplementationOnce(async (ctx: SessionContext) => stall(ctx.parseQueue));
    await expect(replayAll([input('C', [latin1('a'), [], latin1('b')])], { chunkTimeoutMs: 50 }))
      .rejects.toThrow('replay stalled: corpus spec, chunk 3 of 3 did not finish within 50 ms');
    expect(console.log).toBe(log);
  });

  it('defaults to 30 s and clears its timer for every chunk that finishes', async () => {
    const set = jest.spyOn(global, 'setTimeout');
    const clear = jest.spyOn(global, 'clearTimeout');
    await replayCorpus(input('C', [latin1('a'), latin1('b'), latin1('c')]));
    const watchdogs = set.mock.calls.flatMap((call, n) => (call[1] === CHUNK_TIMEOUT_MS ? [set.mock.results[n].value] : []));
    expect(CHUNK_TIMEOUT_MS).toBe(30000);
    expect(watchdogs).toHaveLength(3);
    for (const timer of watchdogs) expect(clear).toHaveBeenCalledWith(timer);
  });
});

describe('feedParseVersion', () => {
  it('is the FEED_PARSE_VERSION libs/feed-parse exports, <semver>+<golden-set digest> (DET-10)', () => {
    expect(feedParseVersion()).toBe(FEED_PARSE_VERSION);
    expect(splitVersion(FEED_PARSE_VERSION)).toMatchObject({ wellFormed: true, digest: expect.stringMatching(/^[0-9a-f]{16}$/) });
  });
});

describe('detectedProtocol', () => {
  it('asks libs/feed-parse detectProtocol about the corpus\'s first bytes', () => {
    expect(detectedProtocol(input('B', [cmd('P', [1, 0]), cmd('N', [1])]))).toBe('bridge');
    expect(detectedProtocol(input('C', [[...latin1('a'), 0xf9, ...latin1('0001'), 0xfa, ...latin1('b'), 0xf9, ...latin1('0002'), 0xfa]]))).toBe('caseview');
    expect(detectedProtocol(input('B', []))).toBe('undecided');
  });
});

describe('the committed corpora', () => {
  const ids = listCorpora(fs, REPO);

  it('include real Bridge captures and synthetic Bridge and CaseView streams', () => {
    const metas = ids.map((id) => loadCorpus(fs, REPO, id).meta);
    const kinds = new Set(metas.map((m) => m.protocol + ':' + m.origin));
    expect([...kinds].sort()).toEqual(['B:real', 'B:synthetic', 'C:real', 'C:synthetic']);
  });

  it('match the synthetic corpus generator byte for byte', () => {
    expect(staleFiles()).toEqual([]);
  });

  it('strip the Eclipse login from the real captures (the first byte the parser sees is 0x20, not STX)', () => {
    const corpus = loadCorpus(fs, REPO, 'bridge-tcp-001');
    const payload = fs.readFileSync(path.join(REPO, corpus.meta.source.dir, 'payload.bin'));
    const fed = Buffer.concat(corpus.chunks.map((c: any) => c.bytes));
    expect(payload.subarray(payload.length - fed.length).equals(fed)).toBe(true);
    expect(payload.subarray(0, payload.length - fed.length).toString('latin1')).toMatch(/^[^\r\n]*\r\n[^\r\n]*\r\n$/);
    expect(fed[0]).toBe(0x20);
  });

  it('are routed by detectProtocol to the parser they replay through, except the one marked legacyMisroute', () => {
    for (const id of ids) {
      const corpus = loadCorpus(fs, REPO, id);
      const want = corpus.input.bytes === 0 ? 'undecided' : corpus.meta.protocol === 'B' ? 'bridge' : 'caseview';
      const got = detectedProtocol(corpus);
      if (corpus.meta.legacyMisroute) expect([id, got]).toEqual([id, 'bridge']);
      else expect([id, got]).toEqual([id, want]);
    }
    expect(ids.filter((id) => loadCorpus(fs, REPO, id).meta.legacyMisroute)).toEqual(['caseview-lane-tcp-001']);
  });

  it('replay to exactly their goldens: every line, every delivery, the canonical root, [6] unique', async () => {
    const corpora = ids.map((id) => loadCorpus(fs, REPO, id));
    const { outputs } = await replayAll(corpora.map((c) => ({ ...replayInput(c), mask: [...MASKED_FIELDS[c.meta.protocol]] })));
    const failures: string[] = [];
    corpora.forEach((corpus, n) => {
      const g = JSON.parse(fs.readFileSync(corpus.goldenFile, 'utf8'));
      const s = summarize({ corpus, output: outputs[n] });
      expect(g.feedParseSemver).toBe(splitVersion(feedParseVersion()).semver);
      expect(g.input).toEqual(corpus.input);
      expect(g.masked).toEqual([]);
      const diffs = diffRecords(g.lines, s.records, s.mask);
      if (diffs.length) failures.push(corpus.meta.id + '\n' + formatDiff(diffs).join('\n'));
      const deliveryDiffs = diffDeliveries(g.deliveryChunks, s.deliveries.perChunk);
      if (deliveryDiffs.length) failures.push(`${corpus.meta.id}: ${deliveryDiffs.length} chunk(s) deliver differently`);
      if (g.canonical.root !== s.canonical.root) failures.push(`${corpus.meta.id}: canonical root differs`);
      if (g.outputDigest !== s.outputDigest) failures.push(`${corpus.meta.id}: output digest differs`);
      if (outputs[n].duplicateIdChunks) failures.push(`${corpus.meta.id}: [6] not unique`);
    });
    expect(failures).toEqual([]);
  }, 180000);
});
