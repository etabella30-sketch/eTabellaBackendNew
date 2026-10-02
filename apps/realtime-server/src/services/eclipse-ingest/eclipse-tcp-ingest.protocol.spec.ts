import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';

import { DETECT_WINDOW_BYTES } from '@app/feed-parse';

import { IngestSessionWorker } from './eclipse-tcp-ingest.service';

/*
 * DET-4 on real bytes (spec §6.1; tools/ci/golden-replay/README "Protocol detection"). IngestSessionWorker.feed used to
 * pick the parser from the first byte (`chunk[0] === 0x02 ? 'B' : 'C'`). Eclipse connects mid-page, so the first byte
 * after its login is text and every real Bridge stream was parsed as CaseView (LIVE production defect). The worker now
 * asks libs/feed-parse detectProtocol. This spec feeds, exactly as the listener does after the login:
 *  - the four Eclipse 12 Bridge captures in tools/eclipse-capture/authtest (tcp_001..004, read in place);
 *  - every committed golden replay corpus (tools/ci/golden-replay/corpora), through the gate's own loader;
 * and checks which parser receives the bytes. Nothing is parsed (the parser entry points are stubs), nothing is
 * written, and no byte of a capture is copied into this repo: only parser names and byte counts are compared.
 */

const REPO = path.resolve(__dirname, '..', '..', '..', '..', '..');
// The golden gate's own corpus loader (plain CommonJS), so these are the very chunks the gate replays. Loaded with
// node's own require: it needs no transform (and ts-jest would warn about a .js file).
const corpora = createRequire(__filename)(path.join(REPO, 'tools', 'ci', 'golden-replay', 'corpora.js'));

interface Chunk { bytes: Buffer; tRecv: number }

/** Feeds the chunks into a fresh worker; reports the parser chosen and what each parser received. */
function route(chunks: Chunk[], cfg: Record<string, unknown> = {}) {
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  const worker = new IngestSessionWorker({ nSesid: '00000000-0000-4000-8000-0000000000aa', label: 'corpus', nLines: 25, ...cfg } as any, jest.fn(), logger as any);
  const bridge: Chunk[] = [];
  const caseview: Chunk[] = [];
  jest.spyOn((worker as any).framing, 'splitCommands').mockImplementation(((_ctx: unknown, bytes: Buffer, _on: unknown, tRecv: number) => { bridge.push({ bytes, tRecv }); }) as any);
  jest.spyOn((worker as any).caseview, 'parseData').mockImplementation((async (_ctx: unknown, bytes: Buffer, tRecv: number) => { caseview.push({ bytes, tRecv }); }) as any);
  jest.spyOn(worker as any, 'ensureRehydrated').mockImplementation(() => { });
  (worker as any).cap = { write: jest.fn() };
  for (const c of chunks) worker.feed(c.bytes, c.tRecv);
  const total = (list: Chunk[]) => list.reduce((n, c) => n + c.bytes.length, 0);
  return {
    protocol: (worker as any).protocol as 'B' | 'C' | null,
    undecided: worker.undecided,
    bridge,
    caseview,
    bridgeBytes: total(bridge),
    caseviewBytes: total(caseview),
    inputBytes: total(chunks),
    logger,
  };
}

/** Same chunks, same order, same receive times (compared without printing any byte). */
function sameStream(got: Chunk[], want: Chunk[]): boolean {
  return got.length === want.length && got.every((c, i) => c.bytes.equals(want[i].bytes) && c.tRecv === want[i].tRecv);
}

/** What the first-byte rule picked before DET-4, for the record. */
function firstByteRule(chunks: Chunk[]): 'B' | 'C' | null {
  const first = chunks.find((c) => c.bytes.length);
  return first ? (first.bytes[0] === 0x02 ? 'B' : 'C') : null;
}

const AUTHTEST = path.join(REPO, 'tools', 'eclipse-capture', 'authtest');
const captureDirs = fs.existsSync(AUTHTEST) ? fs.readdirSync(AUTHTEST).filter((d) => /^tcp_00[1-4]_/.test(d)).sort() : [];

describe('IngestSessionWorker protocol detection on the Eclipse 12 Bridge captures (tools/eclipse-capture/authtest)', () => {
  it('finds the four captures', () => {
    expect(captureDirs.map((d) => d.slice(0, 7))).toEqual(['tcp_001', 'tcp_002', 'tcp_003', 'tcp_004']);
  });

  it.each(captureDirs)('%s: every byte after the login goes to the Bridge parser (an empty capture parses nothing)', (dir) => {
    const raw: Chunk[] = corpora.readFrames(fs, path.join(AUTHTEST, dir, 'frames.ndjson'));
    const chunks: Chunk[] = raw.length ? corpora.stripEclipseLogin(raw, dir) : [];
    const r = route(chunks);
    // Counts only, so a failure never prints capture bytes.
    if (!chunks.length) {
      expect(r.protocol).toBeNull();
      expect(r.bridge.length + r.caseview.length).toBe(0);
      return;
    }
    // The defect: the first byte after the login is not STX, so the old rule chose CaseView.
    expect(firstByteRule(chunks)).toBe('C');
    expect(r.protocol).toBe('B');
    expect(r.caseview.length).toBe(0);
    expect(r.bridgeBytes).toBe(r.inputBytes);
    expect(sameStream(r.bridge, chunks)).toBe(true);
    expect(r.logger.warn).not.toHaveBeenCalled();
  });
});

describe('IngestSessionWorker protocol detection on the golden replay corpora (tools/ci/golden-replay/corpora)', () => {
  const ids: string[] = corpora.listCorpora(fs, REPO);

  it('finds the committed corpora, Bridge and CaseView', () => {
    const metas = ids.map((id) => corpora.loadCorpus(fs, REPO, id).meta);
    expect(metas.some((m: any) => m.protocol === 'B')).toBe(true);
    expect(metas.some((m: any) => m.protocol === 'C' && !m.legacyMisroute)).toBe(true);
  });

  it.each(ids)('%s: routed to the parser it is replayed through (the legacy-misroute corpus: to Bridge, its real protocol)', (id) => {
    const corpus = corpora.loadCorpus(fs, REPO, id);
    const chunks: Chunk[] = corpus.chunks;
    const r = route(chunks);
    if (!r.inputBytes) {
      expect(r.protocol).toBeNull();
      expect(r.bridge.length + r.caseview.length).toBe(0);
      return;
    }
    // caseview-lane-tcp-001 pins what production did to Bridge capture 001 (parsed as CaseView); DET-4 ends that.
    const want: 'B' | 'C' = corpus.meta.legacyMisroute ? 'B' : corpus.meta.protocol;
    expect(r.protocol).toBe(want);
    const got = want === 'B' ? r.bridge : r.caseview;
    expect((want === 'B' ? r.caseview : r.bridge).length).toBe(0);
    // every chunk reaches the parser once, in order, with its own receive time (DET-1), held bytes included
    expect(sameStream(got, chunks.filter((c) => c.bytes.length))).toBe(true);
  });
});

describe('IngestSessionWorker protocol detection: the ambiguous cases follow the spec rule', () => {
  const at = (bytes: Buffer, i: number): Chunk => ({ bytes, tRecv: 5000 + i });

  it('Bridge frames mixed with CaseView markers without a 4:1 majority stay undecided until 4096 bytes, then CaseView', () => {
    const frame = Buffer.from([0x02, 0x4e, 0x01, 0x03]);
    const marker = Buffer.from([0xf9, 0x30, 0x30, 0x30, 0x31, 0xfa]);
    const chunks = [at(frame, 0), at(marker, 1), at(frame, 2), at(marker, 3)];
    const early = route(chunks);
    expect(early.protocol).toBeNull();
    expect(early.undecided).toBe(true);

    const filler = at(Buffer.alloc(DETECT_WINDOW_BYTES, 0x20), 4);
    const r = route([...chunks, filler]);
    expect(r.protocol).toBe('C');
    expect(sameStream(r.caseview, [...chunks, filler])).toBe(true);
    expect(r.logger.warn).toHaveBeenCalledWith(expect.stringContaining('parsing as CaseView (the default)'));
  });

  it('a clear majority decides: 8 Bridge frames against 1 marker is Bridge', () => {
    const frame = Buffer.from([0x02, 0x4e, 0x01, 0x03]);
    const marker = Buffer.from([0xf9, 0x30, 0x30, 0x30, 0x31, 0xfa]);
    const chunks = [at(marker, 0), ...Array.from({ length: 8 }, (_, i) => at(frame, i + 1))];
    expect(route(chunks).protocol).toBe('B');
  });

  it("the route's configured protocol wins over what the bytes show", () => {
    const corpus = corpora.loadCorpus(fs, REPO, 'bridge-tcp-001');
    const r = route(corpus.chunks.slice(0, 50), { protocol: 'caseview' });
    expect(r.protocol).toBe('C');
    expect(r.bridge.length).toBe(0);
  });
});
