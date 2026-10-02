import { CutterView, PageCutter } from './cutter';
import { pageDigest, rootDigest } from './digest';
import { EdgeHelloReplySession, EdgeHelloSession, EdgeIncident, EdgeRound, EdgeSeal, MAX_PART_BYTES } from './protocol';
import {
  BuiltRound,
  CloudSessionMeta,
  PageTooLargeError,
  ResumeRefusedError,
  RoundApplyPlan,
  RoundAssembler,
  RoundDecision,
  bootDigests,
  boxCheckHelloReply,
  buildRound,
  checkPendingRawPair,
  checkSeal,
  classifyRoundReply,
  dirtyPages,
  emptyCloudMeta,
  helloVerdict,
  needsRound,
  planRawAppend,
  recomputeRoot,
  resumeFromHello,
  roundShapeProblem,
  sealClaims,
  sealSigningPayload,
  stableStringify,
  utf8ByteLength,
  validateRound,
} from './round';

const SES = '3b9c6a1e-2222-4b4b-8c8c-000000000002';
const codes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const mk = (i: number, text = `line ${i}`) => ['10:00:00', codes(text), i, 'FL', 1, (i % 25) + 1, (i + 1) * 1e6, null, null, null];
const buffer = (n: number, prefix = 'line') => Array.from({ length: n }, (_, i) => mk(i, `${prefix} ${i}`));
/** A fake chain hash for raw seq n of history `h`. */
const H = (n: number, h = 'A') => `${h}${String(n).padStart(63, '0')}`.slice(0, 64);

/** The box: a cutter over a buffer, and what it believes about the cloud. */
function box(n: number, nLines = 25) {
  const cutter = new PageCutter({ nSesid: SES, nLines });
  const buf: unknown[] = buffer(n);
  cutter.boundary(buf, n, H(n));
  return { cutter, buf };
}

/** The cloud store a plan is applied to (what applyPagesAtomic would do). */
class CloudStore {
  meta: CloudSessionMeta;
  pages = new Map<number, readonly unknown[]>();
  constructor(nLines = 25) {
    this.meta = emptyCloudMeta(SES, { nLines });
  }
  apply(plan: RoundApplyPlan) {
    for (const pg of plan.pages) this.pages.set(pg.p, JSON.parse(JSON.stringify(pg.lines)));
    for (const p of [...this.pages.keys()]) if (p > plan.deletePagesAbove) this.pages.delete(p);
    this.meta = plan.meta;
  }
}

const lineageOf = (meta: CloudSessionMeta) => ({ appliedRawSeq: meta.appliedRawSeq, appliedRawHash: meta.appliedRawHash });

function roundFor(view: CutterView, meta: CloudSessionMeta, extra: Partial<Parameters<typeof buildRound>[0]> = {}): BuiltRound {
  return buildRound({
    source: view,
    epoch: meta.epoch,
    rebaseSeq: meta.rebaseSeq,
    lineage: lineageOf(meta),
    cloud: { digests: meta.digests, totalLines: meta.totalLines, root: meta.root },
    ...extra,
  })!;
}

function single(built: BuiltRound): EdgeRound {
  expect(built.parts).toHaveLength(1);
  return built.parts[0];
}

/** All parts of a round, as the cloud's assembler hands them to validateRound. */
function whole(built: BuiltRound): EdgeRound {
  const asm = new RoundAssembler();
  let res;
  for (const part of built.parts) res = asm.add(part, 0);
  expect(res.status).toBe('complete');
  return res.round;
}

function applied(decision: RoundDecision): RoundApplyPlan {
  if (decision.action !== 'apply') throw new Error(`expected apply, got ${JSON.stringify(decision)}`);
  return decision.plan;
}

/** A cloud that has applied the box's first round (n lines). */
function syncedPair(n: number, nLines = 25) {
  const b = box(n, nLines);
  const cloud = new CloudStore(nLines);
  cloud.apply(applied(validateRound(whole(roundFor(b.cutter.view(), cloud.meta)), cloud.meta)));
  return { ...b, cloud };
}

describe('box side: dirty set and round building (§5.2)', () => {
  it('dirtyPages lists pages whose digest differs from the cloud, ascending', () => {
    expect(dirtyPages(['a', 'b', 'c'], ['a', 'x'])).toEqual([2, 3]);
    expect(dirtyPages(['a'], ['a', 'b'])).toEqual([]);
    expect(dirtyPages([], [])).toEqual([]);
  });

  it('needsRound is false only when the cloud already holds the same state', () => {
    const local = { digests: ['a', 'b'], totalLines: 30, root: 'r' };
    expect(needsRound(local, { digests: ['a', 'b'], totalLines: 30, root: 'r' })).toBe(false);
    expect(needsRound(local, { digests: ['a', 'b'], totalLines: 30 })).toBe(false);
    expect(needsRound(local, { digests: ['a', 'b'], totalLines: 31 })).toBe(true);
    expect(needsRound(local, { digests: ['a', 'b'], totalLines: null })).toBe(true);
    expect(needsRound(local, { digests: ['a', 'b', 'c'], totalLines: 30 })).toBe(true);
    expect(needsRound(local, { digests: ['a', 'x'], totalLines: 30 })).toBe(true);
    expect(needsRound(local, { digests: ['a', 'b'], totalLines: 30, root: 'other' })).toBe(true);
  });

  it('builds nothing when the cloud matches', () => {
    const { cutter, cloud } = syncedPair(30);
    expect(buildRound({
      source: cutter.view(),
      epoch: 1,
      rebaseSeq: null,
      lineage: lineageOf(cloud.meta),
      cloud: { digests: cloud.meta.digests, totalLines: cloud.meta.totalLines },
    })).toBeNull();
  });

  it('carries the dirty pages, one rev and the lineage (D19)', () => {
    const { cutter, buf, cloud } = syncedPair(60);
    buf[30] = mk(30, 'corrected');
    buf.push(mk(60));
    cutter.boundary(buf, 70, H(70));
    const built = roundFor(cutter.view(), cloud.meta);
    const round = single(built);
    expect(built.dirty).toEqual([2, 3]);
    expect(round).toMatchObject({
      nSesid: SES,
      epoch: 1,
      rebaseSeq: null,
      lineage: { appliedRawSeq: 60, appliedRawHash: H(60) },
      rev: 2,
      totalLines: 61,
      root: cutter.view().root,
      rawSeqThrough: 70,
      rawHashThrough: H(70),
      part: 1,
      parts: 1,
    });
    expect(round.shrink).toBeUndefined();
    expect(round.pages.map(p => p.p)).toEqual([2, 3]);
    expect(round.pages[0].d).toBe(pageDigest(round.pages[0].lines));
    expect(built.afterAck).toEqual({
      appliedRev: 2,
      cloud: { digests: cutter.view().digests, totalLines: 61, root: cutter.view().root },
      lineage: { appliedRawSeq: 70, appliedRawHash: H(70) },
    });
  });

  it('a shrink to a page boundary still sends a (page-less) round with the shrink note', () => {
    const { cutter, buf, cloud } = syncedPair(60);
    buf.length = 50;
    cutter.boundary(buf, 61, H(61), 'G');
    const round = single(roundFor(cutter.view(), cloud.meta));
    expect(round.pages).toEqual([]);
    expect(round.totalLines).toBe(50);
    expect(round.shrink).toEqual({ lines: 10, cause: 'G' });
  });

  it('sends every page when the cloud total is unknown (after ROOT)', () => {
    const { cutter } = box(60);
    const built = buildRound({ source: cutter.view(), epoch: 1, rebaseSeq: null, lineage: { appliedRawSeq: null, appliedRawHash: null }, cloud: { digests: [], totalLines: null } })!;
    expect(built.dirty).toEqual([1, 2, 3]);
  });

  describe('multi-part splitting (≤ 256 KB per part)', () => {
    const bigBox = (pages: number, lineChars: number) => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = Array.from({ length: pages * 25 }, (_, i) => mk(i, `${i}:`.padEnd(lineChars, 'é')));
      cutter.boundary(buf, 1, H(1));
      return cutter.view();
    };

    it('keeps every part within the default 256 KB and covers every dirty page once, in order', () => {
      const view = bigBox(128, 200); // ~128 pages of 25 × 200-char lines ≈ 2 MB
      const built = roundFor(view, emptyCloudMeta(SES));
      expect(built.parts.length).toBeGreaterThan(1);
      built.parts.forEach((part, k) => {
        expect(part.part).toBe(k + 1);
        expect(part.parts).toBe(built.parts.length);
        expect(built.partBytes[k]).toBe(utf8ByteLength(JSON.stringify(part)));
        expect(built.partBytes[k]).toBeLessThanOrEqual(MAX_PART_BYTES);
        expect(Buffer.byteLength(JSON.stringify(part), 'utf8')).toBe(built.partBytes[k]);
        const { pages: _p, part: _n, ...header } = part;
        const { pages: _q, part: _m, ...first } = built.parts[0];
        expect(header).toEqual(first);
      });
      expect(built.parts.flatMap(p => p.pages.map(pg => pg.p))).toEqual(Array.from({ length: 128 }, (_, k) => k + 1));
      expect(built.oversizePages).toEqual([]);
    });

    it('packs greedily under a small limit', () => {
      const view = bigBox(10, 20);
      const built = roundFor(view, emptyCloudMeta(SES), { maxPartBytes: 4096 });
      expect(built.parts.length).toBeGreaterThan(2);
      for (const bytes of built.partBytes) expect(bytes).toBeLessThanOrEqual(4096);
      // Greedy: no part could have taken the next part's first page.
      for (let k = 0; k + 1 < built.parts.length; k++) {
        const next = built.parts[k + 1].pages[0];
        expect(built.partBytes[k] + 1 + utf8ByteLength(JSON.stringify(next))).toBeGreaterThan(4096 - 16);
      }
    });

    it('sends a page bigger than the limit alone, and refuses one over the hard ceiling', () => {
      const view = bigBox(3, 200);
      const built = roundFor(view, emptyCloudMeta(SES), { maxPartBytes: 2048 });
      expect(built.oversizePages).toEqual([1, 2, 3]);
      expect(built.parts.map(p => p.pages.map(pg => pg.p))).toEqual([[1], [2], [3]]);
      expect(() => roundFor(view, emptyCloudMeta(SES), { maxPartBytes: 2048, hardMaxPartBytes: 4096 })).toThrow(PageTooLargeError);
    });

    it('the cloud reassembles the parts in any order into the same round', () => {
      const view = bigBox(12, 60);
      const built = roundFor(view, emptyCloudMeta(SES), { maxPartBytes: 8192 });
      const asm = new RoundAssembler();
      const order = built.parts.map((_, k) => k).reverse();
      let result;
      for (const k of order) result = asm.add(built.parts[k], 1000);
      expect(result.status).toBe('complete');
      const merged = result.round as EdgeRound;
      expect(merged.pages.map(p => p.p)).toEqual(Array.from({ length: 12 }, (_, k) => k + 1));
      expect(applied(validateRound(merged, emptyCloudMeta(SES))).root).toBe(view.root);
    });
  });

  it('counts UTF-8 bytes exactly, surrogates included', () => {
    for (const s of ['', 'abc', 'é', '€', '😀', 'a😀b', '\ud800', '\udc00x', JSON.stringify(['\ud83d'])]) {
      expect(utf8ByteLength(s)).toBe(Buffer.byteLength(s, 'utf8'));
    }
  });
});

describe('box side: replies and resume (§5.4, §5.5)', () => {
  it('maps every reply to an action', () => {
    expect(classifyRoundReply({ ok: true, appliedRev: 4, root: 'r' })).toEqual({ kind: 'acked', appliedRev: 4, root: 'r' });
    expect(classifyRoundReply({ ok: true, partial: true, have: 1, parts: 3 })).toEqual({ kind: 'partial' });
    expect(classifyRoundReply({ ok: false, code: 'STALE', appliedRev: 4, root: 'r' })).toEqual({ kind: 'rehello', code: 'STALE' });
    expect(classifyRoundReply({ ok: false, code: 'LINEAGE', epoch: 1, rebaseSeq: null })).toEqual({ kind: 'rehello', code: 'LINEAGE' });
    expect(classifyRoundReply({ ok: false, code: 'BAD_PAGE', p: 2 })).toEqual({ kind: 'rehello', code: 'BAD_PAGE', alert: 'P2' });
    expect(classifyRoundReply({ ok: false, code: 'ROOT', cloudDigests: ['d'] })).toEqual({ kind: 'rebuild', cloud: { digests: ['d'], totalLines: null, root: null } });
    expect(classifyRoundReply({ ok: false, code: 'BUSY', retryMs: 250 })).toEqual({ kind: 'retry', retryMs: 250 });
    expect(classifyRoundReply({ ok: false, code: 'REGRESS', appliedRawSeq: 9 })).toEqual({ kind: 'recover', appliedRawSeq: 9 });
    expect(classifyRoundReply({ ok: false, code: 'FORK' })).toEqual({ kind: 'freeze' });
    expect(classifyRoundReply({ ok: false, code: 'HELD_SHRINK', heldId: 'h1' })).toEqual({ kind: 'hold', heldId: 'h1' });
    expect(classifyRoundReply({ ok: false, code: 'FENCED' })).toEqual({ kind: 'stop', code: 'FENCED' });
    expect(classifyRoundReply({ ok: false, code: 'NOT_BOUND' })).toEqual({ kind: 'stop', code: 'NOT_BOUND' });
  });

  const reply = (over: Partial<EdgeHelloReplySession> = {}): EdgeHelloReplySession => ({
    nSesid: SES,
    verdict: 'continue',
    epoch: 1,
    rebaseSeq: null,
    appliedRev: 7,
    appliedRawSeq: 100,
    appliedRawHash: H(100),
    totalLines: 30,
    root: 'r',
    pageDigests: ['d1', 'd2'],
    rawAcked: { seq: 80, hash: H(80) },
    ...over,
  });
  const journal = (headSeq: number, history = 'A', forkAfter = Infinity, other = 'B') => ({
    headSeq,
    hashAt: (seq: number) => (seq > headSeq ? undefined : H(seq, seq > forkAfter ? other : history)),
  });

  it('continues when the box holds the last applied record with the same hash (D19) and reaches the raw head', () => {
    expect(boxCheckHelloReply(reply(), journal(120))).toEqual({ verdict: 'continue' });
    expect(boxCheckHelloReply(reply({ verdict: 'end' }), journal(120))).toEqual({ verdict: 'end' });
  });

  it('freezes a box whose chain differs at appliedRawSeq, or that no longer holds it (old image, lost journal)', () => {
    expect(boxCheckHelloReply(reply(), journal(120, 'A', 90)).verdict).toBe('frozen');
    expect(boxCheckHelloReply(reply(), journal(99)).verdict).toBe('frozen');
    expect(boxCheckHelloReply(reply(), { headSeq: 120, hashAt: () => undefined }).verdict).toBe('frozen');
  });

  it('recovers a box behind the cloud raw head, or diverging from it (MR-3)', () => {
    const behind = reply({ appliedRawSeq: 50, appliedRawHash: H(50), rawAcked: { seq: 80, hash: H(80) } });
    expect(boxCheckHelloReply(behind, journal(70))).toEqual({ verdict: 'recover', recoverFrom: 71, reason: expect.any(String) });
    expect(boxCheckHelloReply(behind, journal(90, 'A', 60))).toEqual({ verdict: 'recover', recoverFrom: 51, reason: expect.any(String) });
  });

  it("runs the D19 check on a 'recover' reply too: a box forked before appliedRawSeq is frozen, not recovered", () => {
    // The cloud's raw lane is ahead of its applied rounds (records that change no line advance raw without a round).
    // Head below the raw head, and head at the raw head with another hash: the cloud sees only the head and says recover.
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 101, rawAcked: { seq: 150, hash: H(150) } }), journal(120, 'A', 50)))
      .toEqual({ verdict: 'frozen', reason: expect.any(String) });
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 101, rawAcked: { seq: 120, hash: H(120) } }), journal(120, 'A', 50)))
      .toEqual({ verdict: 'frozen', reason: expect.any(String) });
    // A journal that no longer holds the last applied record is frozen as well.
    const lost = { headSeq: 120, hashAt: (s: number) => (s === 100 || s > 120 ? undefined : H(s)) };
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 101 }), lost).verdict).toBe('frozen');
    // Forked after it: the journal still holds appliedRawHash at appliedRawSeq, so RECOVER by raw pull-back stays.
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 101, rawAcked: { seq: 150, hash: H(150) } }), journal(120, 'A', 110)))
      .toEqual({ verdict: 'recover', recoverFrom: 101, reason: expect.any(String) });
  });

  it("drives the cloud's 'recover' verdict into the box check: frozen when forked before the applied seq, recover after (MR-3 rev 3)", () => {
    const meta: CloudSessionMeta = { ...emptyCloudMeta(SES), appliedRev: 7, appliedRawSeq: 100, appliedRawHash: H(100), totalLines: 30, root: 'r', digests: ['d1', 'd2'] };
    const helloOf = (j: ReturnType<typeof journal>): EdgeHelloSession => ({
      nSesid: SES, epoch: 1, rebaseSeq: null, rev: 9, totalLines: 30, root: 'r',
      raw: { headSeq: j.headSeq, headHash: j.hashAt(j.headSeq)! }, lastRound: null, state: 'live', incidents: [],
    });
    for (const acked of [150, 120]) {
      const ctx = { meta, bound: true, rawAcked: { seq: acked, hash: H(acked) }, rawHashAt: (s: number) => (s <= acked ? H(s) : undefined) };
      const forked = journal(120, 'A', 50);
      const toForked = helloVerdict(helloOf(forked), ctx);
      expect(toForked).toMatchObject({ verdict: 'recover', recoverFrom: 101 });
      expect(boxCheckHelloReply(toForked, forked).verdict).toBe('frozen');
      expect(() => resumeFromHello(toForked, forked)).toThrow(ResumeRefusedError);
      const recoverable = journal(120, 'A', 110);
      const toRecoverable = helloVerdict(helloOf(recoverable), ctx);
      expect(boxCheckHelloReply(toRecoverable, recoverable)).toMatchObject({ verdict: 'recover', recoverFrom: 101 });
    }
  });

  it("keeps the cloud's recoverFrom, defaults it to appliedRawSeq+1 and caps it at the journal head + 1", () => {
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 115 }), journal(120))).toMatchObject({ verdict: 'recover', recoverFrom: 115 });
    expect(boxCheckHelloReply(reply({ verdict: 'recover' }), journal(120))).toMatchObject({ verdict: 'recover', recoverFrom: 101 });
    expect(boxCheckHelloReply(reply({ verdict: 'recover', recoverFrom: 131 }), journal(120))).toMatchObject({ verdict: 'recover', recoverFrom: 121 });
    // Before anything was applied there is no D19 check; the box is behind the raw head.
    const genesis = reply({ verdict: 'recover', recoverFrom: 71, appliedRev: 0, appliedRawSeq: null, appliedRawHash: null });
    expect(boxCheckHelloReply(genesis, journal(70))).toMatchObject({ verdict: 'recover', recoverFrom: 71 });
  });

  it('passes the other verdicts through and skips the checks before anything was applied', () => {
    for (const verdict of ['frozen', 'unknown', 'sealed'] as const) {
      expect(boxCheckHelloReply(reply({ verdict }), journal(120, 'A', 50))).toEqual({ verdict });
    }
    const genesis = reply({ appliedRev: 0, appliedRawSeq: null, appliedRawHash: null, rawAcked: { seq: 0, hash: '' } });
    expect(boxCheckHelloReply(genesis, journal(0))).toEqual({ verdict: 'continue' });
  });

  it("resumes with the lineage hash from the box's OWN journal, the cloud digests and the raw cursor (D19)", () => {
    expect(resumeFromHello(reply(), journal(120))).toEqual({
      appliedRev: 7,
      cloud: { digests: ['d1', 'd2'], totalLines: 30, root: 'r' },
      lineage: { appliedRawSeq: 100, appliedRawHash: H(100) },
      rawCursor: 81,
    });
    expect(resumeFromHello(reply({ verdict: 'end' }), journal(120)).lineage).toEqual({ appliedRawSeq: 100, appliedRawHash: H(100) });
    // The hash is read from the journal, not echoed from the reply: after a cloud state loss (O-7) the reply has none.
    const own = { headSeq: 120, hashAt: (s: number) => (s <= 120 ? `own-${s}` : undefined) };
    expect(resumeFromHello(reply({ appliedRawHash: null, rawAcked: { seq: 0, hash: '' } }), own).lineage).toEqual({ appliedRawSeq: 100, appliedRawHash: 'own-100' });
    const genesis = reply({ appliedRev: 0, appliedRawSeq: null, appliedRawHash: null, rawAcked: { seq: 0, hash: '' } });
    expect(resumeFromHello(genesis, journal(0))).toMatchObject({ appliedRev: 0, lineage: { appliedRawSeq: null, appliedRawHash: null }, rawCursor: 1 });
  });

  it('refuses to resume unless the hello check passes (continue or end)', () => {
    const refusal = (r: EdgeHelloReplySession, j: ReturnType<typeof journal>): ResumeRefusedError => {
      try {
        resumeFromHello(r, j);
      } catch (e) {
        expect(e).toBeInstanceOf(ResumeRefusedError);
        return e as ResumeRefusedError;
      }
      throw new Error('resumed');
    };
    expect(refusal(reply(), journal(120, 'A', 90))).toMatchObject({ nSesid: SES, decision: { verdict: 'frozen' } });
    expect(refusal(reply(), journal(99)).decision.verdict).toBe('frozen');
    expect(refusal(reply({ verdict: 'recover', recoverFrom: 101 }), journal(120, 'A', 110)).decision).toMatchObject({ verdict: 'recover', recoverFrom: 101 });
    expect(refusal(reply({ rawAcked: { seq: 130, hash: H(130) } }), journal(120)).decision).toMatchObject({ verdict: 'recover', recoverFrom: 121 });
    for (const verdict of ['frozen', 'unknown', 'sealed'] as const) expect(refusal(reply({ verdict }), journal(120)).decision.verdict).toBe(verdict);
    expect(refusal(reply(), journal(120, 'A', 90)).message).toMatch(/cannot resume \(frozen: /);
    // A journal that loses the record between the check and the read is refused, never sent without a hash.
    let reads = 0;
    const flaky = { headSeq: 120, hashAt: (s: number) => (s === 100 && reads++ > 0 ? undefined : s <= 120 ? H(s) : undefined) };
    expect(refusal(reply(), flaky).decision.verdict).toBe('frozen');
  });
});

describe('cloud side: RoundAssembler (§5.5 multi-part rounds)', () => {
  const part = (k: number, parts: number, pages: number[], over: Partial<EdgeRound> = {}): EdgeRound => ({
    nSesid: SES,
    epoch: 1,
    rebaseSeq: null,
    lineage: { appliedRawSeq: null, appliedRawHash: null },
    rev: 5,
    totalLines: 100,
    root: 'r',
    rawSeqThrough: 10,
    rawHashThrough: H(10),
    part: k,
    parts,
    pages: pages.map(p => ({ p, d: `d${p}`, lines: [] })),
    ...over,
  });

  it('completes a single-part round at once, pages sorted', () => {
    const asm = new RoundAssembler();
    const res = asm.add(part(1, 1, [3, 1]), 0);
    expect(res.status).toBe('complete');
    expect((res as any).round.pages.map((p: any) => p.p)).toEqual([1, 3]);
    expect(asm.size).toBe(0);
  });

  it('acks partial parts and completes when the last arrives, in any order', () => {
    const asm = new RoundAssembler();
    expect(asm.add(part(3, 3, [5]), 0)).toEqual({ status: 'partial', reply: { ok: true, partial: true, have: 1, parts: 3 } });
    expect(asm.add(part(1, 3, [1, 2]), 1)).toEqual({ status: 'partial', reply: { ok: true, partial: true, have: 2, parts: 3 } });
    expect(asm.add(part(1, 3, [1, 2]), 2).status).toBe('partial'); // a resent part is idempotent
    const res = asm.add(part(2, 3, [3, 4]), 3);
    expect(res.status).toBe('complete');
    expect((res as any).round).toMatchObject({ part: 1, parts: 1, rev: 5 });
    expect((res as any).round.pages.map((p: any) => p.p)).toEqual([1, 2, 3, 4, 5]);
    expect(asm.size).toBe(0);
  });

  it('refuses a page sent twice', () => {
    const asm = new RoundAssembler();
    asm.add(part(1, 2, [1, 2]), 0);
    expect(asm.add(part(2, 2, [2]), 0)).toMatchObject({ status: 'invalid', reply: { ok: false, code: 'BAD_PAGE', p: 2 } });
    expect(asm.add(part(1, 1, [4, 4]), 0)).toMatchObject({ status: 'invalid', reply: { code: 'BAD_PAGE', p: 4 } });
  });

  it('restarts the staging when the header changes, replaces it for a newer rev, refuses an older rev', () => {
    const asm = new RoundAssembler();
    asm.add(part(1, 2, [1]), 0);
    expect(asm.add(part(2, 2, [2], { root: 'other' }), 0)).toMatchObject({ status: 'partial', reply: { have: 1 } });
    expect(asm.add(part(1, 2, [1], { rev: 6 }), 0)).toMatchObject({ status: 'partial', reply: { have: 1 } });
    expect(asm.add(part(2, 2, [2], { rev: 5 }), 0)).toEqual({ status: 'stale' });
    expect(asm.add(part(1, 1, [9], { rev: 4 }), 0)).toEqual({ status: 'stale' });
    expect(asm.add(part(2, 2, [2], { rev: 6 }), 0).status).toBe('complete');
  });

  it('drops stagings after the TTL', () => {
    const asm = new RoundAssembler({ ttlMs: 60_000 });
    asm.add(part(1, 2, [1]), 0);
    expect(asm.sweep(59_999)).toBe(0);
    expect(asm.sweep(60_000)).toBe(1);
    asm.add(part(1, 2, [1]), 0);
    expect(asm.add(part(2, 2, [2]), 60_001)).toMatchObject({ status: 'partial', reply: { have: 1 } });
    asm.drop(SES);
    expect(asm.size).toBe(0);
  });

  it('refuses a malformed part', () => {
    const asm = new RoundAssembler();
    expect(asm.add(part(3, 2, [1]), 0)).toMatchObject({ status: 'invalid', reply: { code: 'BAD_PAGE', p: 0 } });
    expect(asm.add({ ...part(1, 1, [1]), pages: 'x' } as any, 0)).toMatchObject({ status: 'invalid' });
    expect(roundShapeProblem(part(1, 1, [1]))).toBeNull();
    expect(roundShapeProblem({ ...part(1, 1, [1]), rev: -1 })).toBe('rev');
    expect(roundShapeProblem({ ...part(1, 1, [1]), lineage: null } as any)).toBe('lineage');
    expect(roundShapeProblem({ ...part(1, 1, [1]), pages: [{ p: 1, d: 'd' }] } as any)).toBe('page entry');
    expect(roundShapeProblem(null as any)).toBe('not an object');
  });
});

describe('cloud side: validateRound (§5.5 "Round apply")', () => {
  it('applies a genesis round and plans one batched write (D17)', () => {
    const { cutter } = box(60);
    const meta = emptyCloudMeta(SES);
    const plan = applied(validateRound(single(roundFor(cutter.view(), meta)), meta));
    const view = cutter.view();
    expect(plan.rev).toBe(1);
    expect(plan.pages.map(p => p.p)).toEqual([1, 2, 3]);
    expect(plan.digests).toEqual(view.digests);
    expect(plan.deletePagesAbove).toBe(3);
    expect(plan.droppedPages).toEqual([]);
    expect(plan.reply).toEqual({ ok: true, appliedRev: 1, root: view.root });
    expect(plan.meta).toMatchObject({ appliedRev: 1, appliedRawSeq: 60, appliedRawHash: H(60), totalLines: 60, root: view.root, digests: view.digests });
    expect(plan.pendingRawCheck).toEqual({ seq: 60, hash: H(60) });
    expect(plan.catchingUp).toBe(false);
    expect(plan.shrink).toBeUndefined();
  });

  it('verifies the raw pair at once when the raw lane already holds it', () => {
    const { cutter } = box(10);
    const meta = emptyCloudMeta(SES);
    const round = single(roundFor(cutter.view(), meta));
    expect(applied(validateRound(round, meta, { rawHashAt: seq => H(seq) })).pendingRawCheck).toBeUndefined();
    const fork = validateRound(round, meta, { rawHashAt: seq => H(seq, 'B') });
    expect(fork).toMatchObject({ action: 'refuse', reply: { ok: false, code: 'FORK' }, freeze: true, alert: 'P1' });
    expect(checkPendingRawPair({ seq: 10, hash: H(10) }, () => undefined)).toBe('pending');
    expect(checkPendingRawPair({ seq: 10, hash: H(10) }, s => H(s))).toBe('ok');
    expect(checkPendingRawPair({ seq: 10, hash: H(10) }, s => H(s, 'B'))).toBe('fork');
  });

  it('marks a big round as catching-up and plans dropped pages on a shrink', () => {
    const { cutter, buf } = box(250);
    const meta = emptyCloudMeta(SES);
    expect(applied(validateRound(single(roundFor(cutter.view(), meta)), meta)).catchingUp).toBe(true);
    const { cutter: c2, buf: b2, cloud } = syncedPair(1010);
    b2.length = 1000;
    c2.boundary(b2, 2000, H(2000));
    const plan = applied(validateRound(single(roundFor(c2.view(), cloud.meta)), cloud.meta));
    expect(plan.pages).toEqual([]);
    expect(plan.droppedPages).toEqual([41]);
    expect(plan.deletePagesAbove).toBe(40);
    expect(plan.shrink).toEqual({ removed: 10, fromTotal: 1010, toTotal: 1000 });
    void buf;
  });

  describe('step 0: binding', () => {
    it('NOT_BOUND without meta, for another session, or when the binding record says so', () => {
      const { cutter } = box(5);
      const meta = emptyCloudMeta(SES);
      const round = single(roundFor(cutter.view(), meta));
      expect(validateRound(round, null)).toMatchObject({ action: 'refuse', reply: { code: 'NOT_BOUND' }, freeze: false });
      expect(validateRound(round, { ...meta, nSesid: 'other' })).toMatchObject({ reply: { code: 'NOT_BOUND' } });
      expect(validateRound(round, meta, { binding: { bound: false, epoch: 1 } })).toMatchObject({ reply: { code: 'NOT_BOUND' } });
    });

    it('FENCED when the in-queue epoch differs', () => {
      const { cutter } = box(5);
      const meta = emptyCloudMeta(SES);
      const round = single(roundFor(cutter.view(), meta));
      expect(validateRound(round, meta, { binding: { bound: true, epoch: 2 } })).toMatchObject({ reply: { code: 'FENCED' } });
      expect(validateRound(round, meta, { binding: { bound: true, epoch: 1 } }).action).toBe('apply');
    });

    it('a frozen session refuses every round with FORK', () => {
      const { cutter } = box(5);
      const meta = emptyCloudMeta(SES);
      const round = single(roundFor(cutter.view(), meta));
      expect(validateRound(round, { ...meta, frozen: true })).toMatchObject({ reply: { code: 'FORK' }, freeze: true });
    });
  });

  it('step 1: STALE when rev ≤ appliedRev, with the cloud root', () => {
    const { cutter, cloud } = syncedPair(30);
    const round = single(roundFor(cutter.view(), { ...cloud.meta, digests: [] }));
    expect(validateRound(round, cloud.meta)).toMatchObject({ action: 'refuse', reply: { ok: false, code: 'STALE', appliedRev: 1, root: cloud.meta.root }, freeze: false });
  });

  describe('step 2: lineage refusals (MR-1, D19)', () => {
    function next() {
      const pair = syncedPair(30);
      pair.buf.push(mk(30));
      pair.cutter.boundary(pair.buf, 40, H(40));
      return { ...pair, round: single(roundFor(pair.cutter.view(), pair.cloud.meta)) };
    }

    it('accepts the continuing round', () => {
      const { round, cloud } = next();
      expect(validateRound(round, cloud.meta).action).toBe('apply');
    });

    it('LINEAGE when epoch or rebaseSeq differ', () => {
      const { round, cloud } = next();
      expect(validateRound({ ...round, epoch: 2 }, cloud.meta)).toMatchObject({ reply: { code: 'LINEAGE', epoch: 1, rebaseSeq: null }, freeze: false });
      expect(validateRound({ ...round, rebaseSeq: 7 }, cloud.meta)).toMatchObject({ reply: { code: 'LINEAGE' } });
    });

    it('LINEAGE (re-hello, no freeze) when the box names another last-applied seq (lost ack)', () => {
      const { round, cloud } = next();
      expect(validateRound({ ...round, lineage: { appliedRawSeq: 20, appliedRawHash: H(20) } }, cloud.meta)).toMatchObject({ reply: { code: 'LINEAGE' }, freeze: false });
      expect(validateRound({ ...round, lineage: { appliedRawSeq: null, appliedRawHash: null } }, cloud.meta)).toMatchObject({ reply: { code: 'LINEAGE' } });
      const fresh = emptyCloudMeta(SES);
      expect(validateRound({ ...round, rev: 9, lineage: { appliedRawSeq: 5, appliedRawHash: H(5) } }, fresh)).toMatchObject({ reply: { code: 'LINEAGE' } });
    });

    it('FORK and freeze (P1) when the box hash at the last applied seq differs (D19)', () => {
      const { round, cloud } = next();
      const res = validateRound({ ...round, lineage: { appliedRawSeq: 30, appliedRawHash: H(30, 'B') } }, cloud.meta);
      expect(res).toMatchObject({ action: 'refuse', reply: { ok: false, code: 'FORK' }, freeze: true, alert: 'P1' });
    });

    it('REGRESS when rawSeqThrough is below the last applied seq', () => {
      const { round, cloud } = next();
      expect(validateRound({ ...round, rawSeqThrough: 29 }, cloud.meta)).toMatchObject({ reply: { code: 'REGRESS', appliedRawSeq: 30 }, freeze: false });
    });

    it('FORK when the round ends at the applied seq with another hash', () => {
      const { round, cloud } = next();
      expect(validateRound({ ...round, rawSeqThrough: 30, rawHashThrough: H(30, 'B') }, cloud.meta)).toMatchObject({ reply: { code: 'FORK' }, freeze: true });
      // Same seq, same hash: a re-sent state at a new rev is fine.
      expect(validateRound({ ...round, rawSeqThrough: 30, rawHashThrough: H(30) }, cloud.meta).action).toBe('apply');
    });

    it('checks only the seq when the applied hash was lost with the cloud state (O-7)', () => {
      const { round, cloud } = next();
      const plan = applied(validateRound(round, { ...cloud.meta, appliedRawHash: null }));
      expect(plan.lineageUnverified).toBe(true);
    });

    it('chaos drill: an old image restored while the raw lane lags replaces no page and is frozen (hello → check → resume → round)', () => {
      // Box A runs to raw seq 200 (pages applied), the cloud raw store has acked only 100.
      const rawHashAt = (s: number) => (s <= 100 ? H(s) : undefined);
      const cutterA = new PageCutter({ nSesid: SES });
      const bufA = buffer(120);
      cutterA.boundary(bufA, 200, H(200));
      const cloud = new CloudStore();
      cloud.apply(applied(validateRound(single(roundFor(cutterA.view(), cloud.meta)), cloud.meta, { rawHashAt })));
      const before = new Map(cloud.pages);
      const metaBefore = cloud.meta;
      // Box B = an image of A at seq 150 that then took a different history (hashes 'B' after 150).
      const cutterB = new PageCutter({ nSesid: SES });
      const bufB = buffer(130, 'other');
      cutterB.boundary(bufB, 210, H(210, 'B'));
      const hashB = (s: number) => (s <= 150 ? H(s) : H(s, 'B'));
      const journalB = { headSeq: 210, hashAt: (s: number) => (s <= 210 ? hashB(s) : undefined) };

      // 1. Hello: the cloud sees a head beyond the applied seq and its raw store behind it, so it says 'continue'.
      const helloReply = helloVerdict(
        { nSesid: SES, epoch: 1, rebaseSeq: null, rev: cutterB.currentRev, totalLines: 130, root: cutterB.view().root, raw: { headSeq: 210, headHash: hashB(210) }, lastRound: null, state: 'live', incidents: [] },
        { meta: cloud.meta, bound: true, rawAcked: { seq: 100, hash: H(100) }, rawHashAt },
      );
      expect(helloReply.verdict).toBe('continue');
      // 2. The box's D19 check freezes it, and resume refuses: no lineage is ever built from this reply.
      expect(boxCheckHelloReply(helloReply, journalB)).toMatchObject({ verdict: 'frozen' });
      expect(() => resumeFromHello(helloReply, journalB)).toThrow(ResumeRefusedError);
      // 3. The cloud's per-round guard: a lineage read from B's own journal (what resume builds) is FORK, not applied.
      //    Without D19 this round would pass: rawSeqThrough 210 >= 200 and the raw store has not reached 210.
      cutterB.advanceRev(helloReply.appliedRev);
      const roundB = single(buildRound({
        source: cutterB.view(),
        epoch: 1,
        rebaseSeq: null,
        lineage: { appliedRawSeq: helloReply.appliedRawSeq, appliedRawHash: journalB.hashAt(helloReply.appliedRawSeq!)! },
        cloud: { digests: helloReply.pageDigests, totalLines: helloReply.totalLines, root: helloReply.root },
      })!);
      const res = validateRound(roundB, cloud.meta, { rawHashAt });
      expect(res).toMatchObject({ action: 'refuse', reply: { code: 'FORK' }, freeze: true, alert: 'P1' });
      expect(classifyRoundReply((res as Extract<RoundDecision, { action: 'refuse' }>).reply)).toEqual({ kind: 'freeze' });
      expect(cloud.pages).toEqual(before);
      expect(cloud.meta).toBe(metaBefore);
    });

    it('a clone that resumed before the other box advanced gets LINEAGE, then is frozen at its next hello; its own-hash round is FORK', () => {
      // A and B share the history through raw seq 150; B then takes another one ('B' hashes).
      const rawHashAt = (s: number) => (s <= 100 ? H(s) : undefined);
      const hashB = (s: number) => (s <= 150 ? H(s) : H(s, 'B'));
      const journalB = { headSeq: 210, hashAt: (s: number) => (s <= 210 ? hashB(s) : undefined) };
      const cloud = new CloudStore();
      const cutterA = new PageCutter({ nSesid: SES });
      cutterA.boundary(buffer(60), 100, H(100));
      cloud.apply(applied(validateRound(single(roundFor(cutterA.view(), cloud.meta)), cloud.meta, { rawHashAt })));
      const cutterB = new PageCutter({ nSesid: SES });
      cutterB.boundary(buffer(128, 'other'), 205, hashB(205));
      cutterB.boundary(buffer(130, 'other'), 210, hashB(210));
      const helloB = () => helloVerdict(
        { nSesid: SES, epoch: 1, rebaseSeq: null, rev: cutterB.currentRev, totalLines: 130, root: cutterB.view().root, raw: { headSeq: 210, headHash: hashB(210) }, lastRound: { rawSeqThrough: 210, rawHashThrough: hashB(210) }, state: 'live', incidents: [] },
        { meta: cloud.meta, bound: true, rawAcked: { seq: 100, hash: H(100) }, rawHashAt },
      );
      // B still continues the last applied history (seq 100): it resumes, with its own hash there.
      const resume = resumeFromHello(helloB(), journalB);
      expect(resume.lineage).toEqual({ appliedRawSeq: 100, appliedRawHash: H(100) });
      // A advances the cloud to seq 200 before B's round arrives.
      const bufA = buffer(120);
      cutterA.boundary(bufA, 200, H(200));
      cloud.apply(applied(validateRound(single(roundFor(cutterA.view(), cloud.meta)), cloud.meta, { rawHashAt })));
      const before = new Map(cloud.pages);
      cutterB.advanceRev(resume.appliedRev);
      const late = single(buildRound({ source: cutterB.view(), epoch: 1, rebaseSeq: null, lineage: resume.lineage, cloud: resume.cloud })!);
      expect(late.rev).toBeGreaterThan(cloud.meta.appliedRev); // not merely STALE
      const refused = validateRound(late, cloud.meta, { rawHashAt });
      expect(refused).toMatchObject({ action: 'refuse', reply: { code: 'LINEAGE' }, freeze: false });
      expect(classifyRoundReply((refused as Extract<RoundDecision, { action: 'refuse' }>).reply)).toEqual({ kind: 'rehello', code: 'LINEAGE' });
      // Its next hello: the box no longer continues the last applied history.
      const again = helloB();
      expect(again.verdict).toBe('continue');
      expect(boxCheckHelloReply(again, journalB).verdict).toBe('frozen');
      expect(() => resumeFromHello(again, journalB)).toThrow(ResumeRefusedError);
      // Any round carrying its own chain hash at seq 200 is FORK.
      const own = { ...late, rev: late.rev + 5, lineage: { appliedRawSeq: 200, appliedRawHash: journalB.hashAt(200)! } };
      expect(validateRound(own, cloud.meta, { rawHashAt })).toMatchObject({ action: 'refuse', reply: { code: 'FORK' }, freeze: true, alert: 'P1' });
      expect(cloud.pages).toEqual(before);
    });
  });

  describe('step 3: pages', () => {
    function withPages(mut: (round: EdgeRound) => EdgeRound) {
      const { cutter } = box(60);
      const meta = emptyCloudMeta(SES);
      return validateRound(mut(single(roundFor(cutter.view(), meta))), meta);
    }

    it('BAD_PAGE for a page out of range, sent twice, of the wrong length, not a tuple, or with a wrong digest', () => {
      expect(withPages(r => ({ ...r, pages: [{ ...r.pages[0], p: 0 }] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 0 }, alert: 'P2' });
      expect(withPages(r => ({ ...r, pages: [...r.pages, { ...r.pages[2], p: 4 }] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 4 } });
      expect(withPages(r => ({ ...r, pages: [r.pages[0], r.pages[0]] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 1 } });
      expect(withPages(r => ({ ...r, pages: [{ ...r.pages[0], lines: r.pages[0].lines.slice(1) }] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 1 } });
      expect(withPages(r => ({ ...r, pages: [{ ...r.pages[2], lines: [...r.pages[2].lines, r.pages[2].lines[0]] }] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 3 } });
      expect(withPages(r => {
        const lines = [...r.pages[0].lines] as unknown[];
        lines[3] = 'not a tuple';
        return { ...r, pages: [{ ...r.pages[0], lines: lines as any, d: pageDigest(lines) }] };
      })).toMatchObject({ reply: { code: 'BAD_PAGE', p: 1 } });
      expect(withPages(r => ({ ...r, pages: [{ ...r.pages[0], d: r.pages[1].d }] }))).toMatchObject({ reply: { code: 'BAD_PAGE', p: 1 } });
    });

    it('verifies the lines as received, without re-canonicalising', () => {
      const res = withPages(r => {
        const lines = JSON.parse(JSON.stringify(r.pages[0].lines));
        lines[0][1] = [65, 0x0c]; // a box that did not sanitize: digest says so, cloud does not fix it
        return { ...r, pages: [{ ...r.pages[0], lines }] };
      });
      expect(res).toMatchObject({ reply: { code: 'BAD_PAGE', p: 1 } });
    });

    it('a malformed round is refused as BAD_PAGE 0', () => {
      const { cutter } = box(5);
      const meta = emptyCloudMeta(SES);
      expect(validateRound({ ...single(roundFor(cutter.view(), meta)), totalLines: -1 }, meta)).toMatchObject({ reply: { code: 'BAD_PAGE', p: 0 } });
    });
  });

  describe('step 4: root and shrink guard', () => {
    it('ROOT with the cloud digests when a page is neither stored nor sent, or the root differs', () => {
      const { cutter, buf, cloud } = syncedPair(30);
      buf.push(...buffer(30).map((_, k) => mk(30 + k)));
      cutter.boundary(buf, 80, H(80));
      const round = single(roundFor(cutter.view(), cloud.meta));
      const missing = { ...round, pages: round.pages.filter(p => p.p !== 3) };
      expect(validateRound(missing, cloud.meta)).toMatchObject({ reply: { code: 'ROOT', cloudDigests: cloud.meta.digests }, freeze: false, alert: 'P2' });
      expect(validateRound({ ...round, root: rootDigest(SES, 1, []) }, cloud.meta)).toMatchObject({ reply: { code: 'ROOT' } });
      const stale = { ...cloud.meta, digests: ['0'.repeat(64)] };
      const onlyNew = { ...round, pages: round.pages.filter(p => p.p !== 1) };
      expect(validateRound(onlyNew, stale)).toMatchObject({ reply: { code: 'ROOT', cloudDigests: stale.digests } });
    });

    it('holds a drop of more than 500 lines or 5 % (MR-2), applies it once confirmed', () => {
      const big = syncedPair(1000);
      big.buf.length = 940;
      big.cutter.boundary(big.buf, 2000, H(2000));
      const round = single(roundFor(big.cutter.view(), big.cloud.meta));
      expect(validateRound(round, big.cloud.meta)).toEqual({ action: 'hold', removed: 60, fromTotal: 1000, toTotal: 940, alert: 'P1', reason: expect.any(String) });
      expect(applied(validateRound(round, big.cloud.meta, { confirmShrink: true })).shrink).toEqual({ removed: 60, fromTotal: 1000, toTotal: 940 });
      expect(validateRound(round, big.cloud.meta, { shrinkGuard: false }).action).toBe('apply');
      expect(validateRound(round, big.cloud.meta, { shrinkGuard: { maxLines: 500, maxFraction: 0.1 } }).action).toBe('apply');

      const huge = syncedPair(20000);
      huge.buf.length = 19400;
      huge.cutter.boundary(huge.buf, 30000, H(30000));
      expect(validateRound(single(roundFor(huge.cutter.view(), huge.cloud.meta)), huge.cloud.meta)).toMatchObject({ action: 'hold', removed: 600 });
    });

    it('applies a small shrink (a refresh or backspace)', () => {
      const pair = syncedPair(1000);
      pair.buf.length = 990;
      pair.cutter.boundary(pair.buf, 2000, H(2000), 'R..E');
      const plan = applied(validateRound(single(roundFor(pair.cutter.view(), pair.cloud.meta)), pair.cloud.meta));
      expect(plan.shrink).toEqual({ removed: 10, fromTotal: 1000, toTotal: 990 });
      expect(plan.shrinkCause).toBe('R..E');
    });
  });

  it('honours a non-25 page size end to end', () => {
    const pair = syncedPair(23, 10);
    expect(pair.cloud.meta.digests).toHaveLength(3);
    pair.buf[12] = mk(12, 'fix');
    pair.cutter.boundary(pair.buf, 30, H(30));
    const round = single(roundFor(pair.cutter.view(), pair.cloud.meta));
    expect(round.pages.map(p => p.p)).toEqual([2]);
    pair.cloud.apply(applied(validateRound(round, pair.cloud.meta)));
    expect(pair.cloud.meta.root).toBe(pair.cutter.view().root);
    const continuing = { ...round, rev: 99, lineage: { appliedRawSeq: 30, appliedRawHash: H(30) } };
    expect(validateRound({ ...continuing, pages: [{ ...round.pages[0], p: 4 }] }, pair.cloud.meta)).toMatchObject({ reply: { code: 'BAD_PAGE', p: 4 } });
    expect(validateRound({ ...continuing, pages: [{ ...round.pages[0], p: 3 }] }, pair.cloud.meta)).toMatchObject({ reply: { code: 'BAD_PAGE', p: 3 } });
  });

  it('throws for a session fmt this build cannot verify', () => {
    const { cutter } = box(5);
    const meta = emptyCloudMeta(SES);
    expect(() => validateRound(single(roundFor(cutter.view(), meta)), { ...meta, fmt: 2 })).toThrow(/unsupported page format/);
  });
});

describe('cloud side: helloVerdict (§5.5 MR-3, D19)', () => {
  const meta = (): CloudSessionMeta => ({
    ...emptyCloudMeta(SES),
    appliedRev: 7,
    appliedRawSeq: 100,
    appliedRawHash: H(100),
    totalLines: 30,
    root: 'r',
    digests: ['d1', 'd2'],
  });
  const hello = (over: Partial<EdgeHelloSession> = {}): EdgeHelloSession => ({
    nSesid: SES,
    epoch: 1,
    rebaseSeq: null,
    rev: 7,
    totalLines: 30,
    root: 'r',
    raw: { headSeq: 120, headHash: H(120) },
    lastRound: { rawSeqThrough: 100, rawHashThrough: H(100) },
    state: 'live',
    incidents: [],
    ...over,
  });
  const ctx = (over = {}) => ({ meta: meta(), bound: true, rawAcked: { seq: 80, hash: H(80) }, rawHashAt: (s: number) => H(s), ...over });

  it('continue: returns the applied position, digests and raw head', () => {
    expect(helloVerdict(hello(), ctx())).toEqual({
      nSesid: SES,
      verdict: 'continue',
      epoch: 1,
      rebaseSeq: null,
      appliedRev: 7,
      appliedRawSeq: 100,
      appliedRawHash: H(100),
      totalLines: 30,
      root: 'r',
      pageDigests: ['d1', 'd2'],
      rawAcked: { seq: 80, hash: H(80) },
    });
  });

  it('unknown, sealed, end', () => {
    expect(helloVerdict(hello(), ctx({ meta: null })).verdict).toBe('unknown');
    expect(helloVerdict(hello(), ctx({ bound: false })).verdict).toBe('unknown');
    for (const s of ['K', 'W', 'F'] as const) expect(helloVerdict(hello(), ctx({ syncState: s })).verdict).toBe('sealed');
    expect(helloVerdict(hello(), ctx({ syncState: 'S' })).verdict).toBe('end');
  });

  it('frozen: a frozen session, another epoch, a box behind the applied seq, or a different hash there (D19)', () => {
    expect(helloVerdict(hello(), ctx({ meta: { ...meta(), frozen: true } })).verdict).toBe('frozen');
    expect(helloVerdict(hello({ epoch: 2 }), ctx()).verdict).toBe('frozen');
    expect(helloVerdict(hello({ rebaseSeq: 4 }), ctx()).verdict).toBe('frozen');
    expect(helloVerdict(hello({ raw: { headSeq: 99, headHash: H(99) } }), ctx()).verdict).toBe('frozen');
    expect(helloVerdict(hello({ raw: { headSeq: 100, headHash: H(100, 'B') } }), ctx()).verdict).toBe('frozen');
    expect(helloVerdict(hello({ lastRound: { rawSeqThrough: 100, rawHashThrough: H(100, 'B') } }), ctx()).verdict).toBe('frozen');
  });

  it('recover: a box behind the cloud raw head, or disagreeing at it (MR-3)', () => {
    const behind = ctx({ meta: { ...meta(), appliedRawSeq: 50, appliedRawHash: H(50) }, rawAcked: { seq: 80, hash: H(80) } });
    expect(helloVerdict(hello({ raw: { headSeq: 70, headHash: H(70) }, lastRound: null }), behind)).toMatchObject({ verdict: 'recover', recoverFrom: 71 });
    expect(helloVerdict(hello({ raw: { headSeq: 70, headHash: H(70, 'B') }, lastRound: null }), behind)).toMatchObject({ verdict: 'recover', recoverFrom: 51 });
    expect(helloVerdict(hello({ raw: { headSeq: 80, headHash: H(80, 'B') }, lastRound: null }), behind)).toMatchObject({ verdict: 'recover', recoverFrom: 51 });
    expect(helloVerdict(hello({ raw: { headSeq: 80, headHash: H(80) }, lastRound: null }), behind).verdict).toBe('continue');
  });

  it('genesis: nothing applied, nothing acked → continue', () => {
    const fresh = emptyCloudMeta(SES);
    const res = helloVerdict(hello({ raw: { headSeq: 3, headHash: H(3) }, lastRound: null }), { meta: fresh, bound: true, rawAcked: { seq: 0, hash: '' } });
    expect(res).toMatchObject({ verdict: 'continue', appliedRev: 0, appliedRawSeq: null, appliedRawHash: null, pageDigests: [] });
  });
});

describe('cloud side: raw lane sequencing (§5.5)', () => {
  const store = { epoch: 1, ackedSeq: 100, ackedHash: H(100), hashAt: (s: number) => (s <= 100 ? H(s) : undefined) };

  it('appends a contiguous batch chained to the acked head', () => {
    expect(planRawAppend({ epoch: 1, fromSeq: 101, toSeq: 150, prevHash: H(100) }, store)).toEqual({ action: 'append', appendFrom: 101 });
  });

  it('nacks another epoch, a gap, a broken chain, or a malformed range', () => {
    expect(planRawAppend({ epoch: 2, fromSeq: 101, toSeq: 150, prevHash: H(100) }, store)).toEqual({ action: 'nack', nack: { expectSeq: 101, reason: 'epoch' } });
    expect(planRawAppend({ epoch: 1, fromSeq: 105, toSeq: 150, prevHash: H(104) }, store)).toEqual({ action: 'nack', nack: { expectSeq: 101, reason: 'gap' } });
    expect(planRawAppend({ epoch: 1, fromSeq: 101, toSeq: 150, prevHash: H(100, 'B') }, store)).toEqual({ action: 'nack', nack: { expectSeq: 101, reason: 'chain' } });
    expect(planRawAppend({ epoch: 1, fromSeq: 101, toSeq: 100, prevHash: H(100) }, store)).toMatchObject({ action: 'nack', nack: { reason: 'gap' } });
    expect(planRawAppend({ epoch: 1, fromSeq: 0, toSeq: 5, prevHash: '' }, store)).toMatchObject({ action: 'nack' });
  });

  it('trims a verified overlap and re-acks a full duplicate', () => {
    expect(planRawAppend({ epoch: 1, fromSeq: 91, toSeq: 120, prevHash: H(90) }, store)).toEqual({ action: 'append', appendFrom: 101, verifyOverlap: { fromSeq: 91, toSeq: 100 } });
    expect(planRawAppend({ epoch: 1, fromSeq: 91, toSeq: 95, prevHash: H(90) }, store)).toEqual({
      action: 'duplicate',
      verifyOverlap: { fromSeq: 91, toSeq: 95 },
      ack: { ackedSeq: 100, ackedHash: H(100) },
    });
    expect(planRawAppend({ epoch: 1, fromSeq: 91, toSeq: 120, prevHash: H(90, 'B') }, store)).toMatchObject({ action: 'nack', nack: { reason: 'chain' } });
    expect(planRawAppend({ epoch: 1, fromSeq: 91, toSeq: 120, prevHash: H(90) }, { ...store, hashAt: () => undefined })).toMatchObject({ action: 'nack', nack: { reason: 'chain' } });
  });
});

describe('cloud side: completeness proof (§5.7)', () => {
  function sealed(over: Partial<EdgeSeal> = {}) {
    const pair = syncedPair(60);
    const view = pair.cutter.view();
    const seal: EdgeSeal = {
      nSesid: SES,
      epoch: 1,
      finalRev: pair.cloud.meta.appliedRev,
      totalLines: 60,
      root: view.root,
      rawFinalSeq: 61,
      rawFinalHash: H(61),
      endedAtEdgeMs: 1_790_000_000_000,
      endedBy: 'cloud',
      incidents: [],
      sig: 'sig',
      ...over,
    };
    const ctx = {
      meta: pair.cloud.meta,
      signatureValid: true,
      storedPage: (p: number) => pair.cloud.pages.get(p),
      storedPageNumbers: [...pair.cloud.pages.keys()],
      rawAcked: { seq: 61, hash: H(61) },
      finalRecordIsSessionEnd: true,
      rawIncidents: [] as EdgeIncident[],
      pendingOrphans: 0,
    };
    return { pair, seal, ctx };
  }

  it('recomputes the root from the stored pages', () => {
    const { pair } = sealed();
    const res = recomputeRoot(SES, 60, p => pair.cloud.pages.get(p));
    expect(res.root).toBe(pair.cutter.view().root);
    expect(res.digests).toEqual(pair.cutter.view().digests);
    expect(res.missingPages).toEqual([]);
    expect(res.badPages).toEqual([]);
    expect(res.extraPages).toEqual([]);
    const gaps = recomputeRoot(SES, 60, p => (p === 2 ? undefined : p === 3 ? [] : pair.cloud.pages.get(p)));
    expect(gaps.missingPages).toEqual([2]);
    expect(gaps.badPages).toEqual([3]);
    expect(gaps.root).not.toBe(res.root);
    const ten = syncedPair(23, 10);
    expect(recomputeRoot(SES, 23, p => ten.cloud.pages.get(p), { nLines: 10 }).root).toBe(ten.cutter.view().root);
  });

  it('reports stored pages outside 1..N when the stored page numbers are given (ascending, unique, junk included)', () => {
    const { pair } = sealed();
    const stored = (p: number) => pair.cloud.pages.get(p);
    expect(recomputeRoot(SES, 60, stored, { storedPageNumbers: [3, 1, 2] }).extraPages).toEqual([]);
    const extra = recomputeRoot(SES, 60, stored, { storedPageNumbers: [5, 1, 2, 3, 4, 4, 0, -1, 2.5] });
    expect(extra.extraPages).toEqual([-1, 0, 2.5, 4, 5]);
    // The root still covers pages 1..N only: extra pages are reported, not hashed.
    expect(extra.root).toBe(pair.cutter.view().root);
    expect(recomputeRoot(SES, 23, p => syncedPair(23, 10).cloud.pages.get(p), { nLines: 10, storedPageNumbers: new Set([1, 2, 3, 4]) }).extraPages).toEqual([4]);
    expect(recomputeRoot(SES, 0, () => undefined, { storedPageNumbers: [1] }).extraPages).toEqual([1]);
  });

  it('D18: boot digests come from the restored pages; stale and missing pages are resent by the hello diff', () => {
    const { pair } = sealed();
    const clean = bootDigests(pair.cloud.meta, p => pair.cloud.pages.get(p), [...pair.cloud.pages.keys()]);
    expect(clean).toEqual({ pageDigests: pair.cloud.meta.digests, stalePages: [], missingPages: [], extraPages: [], root: pair.cloud.meta.root });

    // A crash between 1 s flushes: page 2 restored from an older round, page 3 lost.
    const older = pair.cloud.pages.get(2)!.map((line: any, k: number) => (k === 0 ? [...line.slice(0, 1), [79, 76, 68], ...line.slice(2)] : line));
    const boot = bootDigests(pair.cloud.meta, p => (p === 2 ? older : p === 3 ? undefined : pair.cloud.pages.get(p)), [1, 2]);
    expect(boot.stalePages).toEqual([2]);
    expect(boot.missingPages).toEqual([3]);
    expect(boot.extraPages).toEqual([]);
    expect(boot.pageDigests[0]).toBe(pair.cloud.meta.digests[0]);
    expect(boot.pageDigests[1]).toBe(pageDigest(older));
    expect(boot.pageDigests[2]).toBe('');
    expect(dirtyPages(pair.cutter.view().digests, boot.pageDigests)).toEqual([2, 3]);

    // The box resends exactly those pages and the roots converge.
    const meta = { ...pair.cloud.meta, digests: boot.pageDigests };
    const cutter = pair.cutter;
    cutter.advanceRev(meta.appliedRev);
    const round = single(buildRound({ source: cutter.view(), epoch: 1, rebaseSeq: null, lineage: lineageOf(meta), cloud: { digests: boot.pageDigests, totalLines: meta.totalLines } })!);
    expect(round.pages.map(p => p.p)).toEqual([2, 3]);
    expect(applied(validateRound(round, meta)).root).toBe(cutter.view().root);

    // A restored page of the wrong length is treated as stale too.
    const short = bootDigests(pair.cloud.meta, p => (p === 1 ? pair.cloud.pages.get(1)!.slice(1) : pair.cloud.pages.get(p)), [1, 2, 3]);
    expect(short.stalePages).toEqual([1]);
    expect(short.pageDigests[0]).toBe('');
  });

  it('D18: a page restored above the session total (a shrink delete lost in the crash) is reported for deletion', () => {
    const pair = syncedPair(1000);
    pair.buf.length = 975; // a small shrink: page 40 is dropped
    pair.cutter.boundary(pair.buf, 2000, H(2000), 'R..E');
    const plan = applied(validateRound(single(roundFor(pair.cutter.view(), pair.cloud.meta)), pair.cloud.meta));
    expect(plan.droppedPages).toEqual([40]);
    const page40 = pair.cloud.pages.get(40)!;
    pair.cloud.apply(plan);
    const restored = new Map(pair.cloud.pages).set(40, page40);
    const boot = bootDigests(pair.cloud.meta, p => restored.get(p), new Set(restored.keys()));
    expect(boot.extraPages).toEqual([40]);
    expect(boot.pageDigests).toEqual(pair.cloud.meta.digests);
    expect(boot.stalePages).toEqual([]);
    expect(boot.root).toBe(pair.cloud.meta.root);
  });

  it('sealClaims waits for the cloud to hold the final state and seals at the APPLIED rev', () => {
    const { pair, seal, ctx } = sealed();
    const base = { epoch: 1, rawFinalSeq: 61, rawFinalHash: H(61), endedAtEdgeMs: seal.endedAtEdgeMs, endedBy: 'cloud', incidents: [] as EdgeIncident[] };
    // A hello moved the cutter past appliedRev although nothing is dirty.
    pair.cutter.advanceRev(pair.cloud.meta.appliedRev);
    const cloud = { digests: pair.cloud.meta.digests, totalLines: pair.cloud.meta.totalLines, root: pair.cloud.meta.root };
    const claims = sealClaims({ ...base, source: pair.cutter.view(), cloud, appliedRev: pair.cloud.meta.appliedRev })!;
    expect(claims.finalRev).toBe(1);
    expect(pair.cutter.view().rev).toBe(2);
    expect(checkSeal({ ...claims, sig: 's' }, ctx).reply).toEqual({ complete: true, state: 'K' });
    // Still dirty: no seal yet.
    pair.buf.push(mk(60));
    pair.cutter.boundary(pair.buf, 61, H(61));
    expect(sealClaims({ ...base, source: pair.cutter.view(), cloud, appliedRev: 1 })).toBeNull();
  });

  it("accepts a complete seal as 'K'", () => {
    const { seal, ctx } = sealed();
    expect(checkSeal(seal, ctx)).toEqual({ reply: { complete: true, state: 'K' }, reasons: [], root: seal.root, warnings: 0, extraPages: [] });
  });

  it('refuses while the store holds a page beyond the sealed transcript (a shrink delete that failed), accepts once it is deleted', () => {
    const pair = syncedPair(1000);
    pair.buf.length = 975; // the final round drops page 40
    pair.cutter.boundary(pair.buf, 1001, H(1001), 'R..E');
    const plan = applied(validateRound(single(roundFor(pair.cutter.view(), pair.cloud.meta)), pair.cloud.meta));
    expect(plan.droppedPages).toEqual([40]);
    // The batch that should delete page 40 fails, and the final round has no next round to retry it (D17).
    for (const pg of plan.pages) pair.cloud.pages.set(pg.p, JSON.parse(JSON.stringify(pg.lines)));
    pair.cloud.meta = plan.meta;
    expect(pair.cloud.pages.has(40)).toBe(true);
    const seal: EdgeSeal = {
      nSesid: SES,
      epoch: 1,
      finalRev: plan.rev,
      totalLines: 975,
      root: pair.cutter.view().root,
      rawFinalSeq: 1002,
      rawFinalHash: H(1002),
      endedAtEdgeMs: 1_790_000_000_000,
      endedBy: 'cloud',
      incidents: [],
      sig: 'sig',
    };
    const ctx = {
      meta: pair.cloud.meta,
      signatureValid: true,
      storedPage: (p: number) => pair.cloud.pages.get(p),
      storedPageNumbers: [...pair.cloud.pages.keys()],
      rawAcked: { seq: 1002, hash: H(1002) },
      finalRecordIsSessionEnd: true,
      rawIncidents: [] as EdgeIncident[],
      pendingOrphans: 0,
    };
    const refused = checkSeal(seal, ctx);
    expect(refused.reply).toEqual({ complete: false, needPages: [] });
    expect(refused.extraPages).toEqual([40]);
    expect(refused.reasons).toEqual(['store holds pages beyond the sealed transcript: 40']);
    expect(refused.root).toBe(seal.root); // pages 1..N are right; only the extra page blocks the proof
    expect(checkSeal(seal, ctx)).toEqual(refused); // the same context checked again sees the same store
    // The caller deletes the extra pages and checks again.
    pair.cloud.pages.delete(40);
    expect(checkSeal(seal, { ...ctx, storedPageNumbers: new Set(pair.cloud.pages.keys()) })).toEqual({
      reply: { complete: true, state: 'K' },
      reasons: [],
      root: seal.root,
      warnings: 0,
      extraPages: [],
    });
  });

  it("is 'W' with a warning-level incident or a pending orphan, 'K' with info incidents only", () => {
    const warn: EdgeIncident = { kind: 'ABORTED_WINDOW', level: 'warning', fromSeq: 10 };
    const info: EdgeIncident = { kind: 'CAT_DISCONNECT', level: 'info', fromSeq: 20 };
    let s = sealed({ incidents: [warn, info] });
    expect(checkSeal(s.seal, { ...s.ctx, rawIncidents: [info, { fromSeq: 10, level: 'warning', kind: 'ABORTED_WINDOW' }] })).toMatchObject({ reply: { complete: true, state: 'W' }, warnings: 1 });
    s = sealed({ incidents: [info] });
    expect(checkSeal(s.seal, { ...s.ctx, rawIncidents: [info] }).reply).toEqual({ complete: true, state: 'K' });
    s = sealed();
    expect(checkSeal(s.seal, { ...s.ctx, pendingOrphans: 1 }).reply).toEqual({ complete: true, state: 'W' });
  });

  it('refuses a bad signature, an old rev or epoch, a frozen session', () => {
    const { seal, ctx } = sealed();
    expect(checkSeal(seal, { ...ctx, signatureValid: false })).toMatchObject({ reply: { complete: false, needPages: [] }, reasons: ['signature does not verify'] });
    expect(checkSeal({ ...seal, finalRev: 9 }, ctx).reply.complete).toBe(false);
    expect(checkSeal({ ...seal, epoch: 2 }, ctx).reply.complete).toBe(false);
    expect(checkSeal(seal, { ...ctx, meta: { ...ctx.meta, frozen: true } }).reply.complete).toBe(false);
  });

  it('asks for the pages it lacks or holds stale, and for the raw it has not acked', () => {
    const { pair, seal, ctx } = sealed();
    const missing = checkSeal(seal, { ...ctx, storedPage: p => (p === 2 ? undefined : pair.cloud.pages.get(p)) });
    expect(missing.reply).toEqual({ complete: false, needPages: [2] });
    const stalePage = checkSeal(seal, { ...ctx, storedPage: p => (p === 3 ? pair.cloud.pages.get(3)!.slice(0, 9).concat([mk(59, 'old')]) : pair.cloud.pages.get(p)) });
    expect(stalePage.reply).toEqual({ complete: false, needPages: [3] });
    const rawBehind = checkSeal(seal, { ...ctx, rawAcked: { seq: 50, hash: H(50) } });
    expect(rawBehind.reply).toEqual({ complete: false, needPages: [], rawFrom: 51 });
    expect(checkSeal(seal, { ...ctx, rawAcked: { seq: 61, hash: H(61, 'B') } }).reply).toEqual({ complete: false, needPages: [] });
  });

  it('refuses when the last record is not SESSION_END or the incident lists differ', () => {
    const { seal, ctx } = sealed();
    expect(checkSeal(seal, { ...ctx, finalRecordIsSessionEnd: false }).reasons).toEqual(['record at rawFinalSeq is not SESSION_END']);
    expect(checkSeal(seal, { ...ctx, rawIncidents: [{ kind: 'LOCKOUT', level: 'info' }] }).reasons).toEqual(['signed incidents differ from the raw store']);
    expect(checkSeal({ ...seal, totalLines: 59 }, ctx).reply.complete).toBe(false);
  });

  it('signs a stable payload: no sig, keys sorted at every level', () => {
    const { seal } = sealed({ incidents: [{ kind: 'LOCKOUT', level: 'info', note: 'x' }] });
    const payload = sealSigningPayload(seal);
    expect(payload).not.toContain('"sig"');
    expect(JSON.parse(payload)).toEqual(JSON.parse(JSON.stringify({ ...seal, sig: undefined })));
    const reordered = Object.fromEntries(Object.entries(seal).reverse()) as unknown as EdgeSeal;
    expect(sealSigningPayload(reordered)).toBe(payload);
    expect(sealSigningPayload({ ...seal, sig: 'other' })).toBe(payload);
    expect(stableStringify({ b: 1, a: { d: [{ z: 1, y: undefined }], c: 2 } })).toBe('{"a":{"c":2,"d":[{"z":1}]},"b":1}');
  });
});

describe('emptyCloudMeta', () => {
  it('is the genesis edge meta of a bound session', () => {
    expect(emptyCloudMeta(SES)).toEqual({
      nSesid: SES,
      nLines: 25,
      fmt: 1,
      epoch: 1,
      rebaseSeq: null,
      appliedRev: 0,
      appliedRawSeq: null,
      appliedRawHash: null,
      totalLines: 0,
      root: rootDigest(SES, 0, []),
      digests: [],
    });
    expect(emptyCloudMeta(SES, { nLines: 30, epoch: 3, rebaseSeq: 9 })).toMatchObject({ nLines: 30, epoch: 3, rebaseSeq: 9 });
  });
});
