/**
 * Seeded property tests for libs/edge-sync (spec §13 "Test strategy"):
 *  - P3: after every boundary, the committed pages == a full canonicalisation
 *    of the buffer, and the cut's changed set / pages / shrink are exact;
 *  - determinism: two independent runs over the same edits give the same
 *    revs, roots and digests;
 *  - P4/P9 (in-process): under dropped rounds, lost acks, partial and
 *    duplicated parts, out-of-order parts, a lagging raw lane and held
 *    shrinks, the cloud converges to the box, never exposes a root the box
 *    never had, and its appliedRev/appliedRawSeq never decrease;
 *  - P8 (in-order delivery): a reader model fed only the broadcast plan of
 *    every cut equals a fresh snapshot of the box;
 *  - round splitting: parts within the limit, every dirty page exactly once.
 * Randomness comes only from a seeded PRNG.
 */
import { BroadcastPlan, broadcastCutFromRound, planBroadcast } from './broadcast-plan';
import { canonicalPages, pageCount } from './canonical';
import { CutterView, PageCutter } from './cutter';
import { pageDigest, rootDigest } from './digest';
import { EdgeHelloSession } from './protocol';
import {
  CloudSessionMeta,
  CloudView,
  RoundApplyPlan,
  RoundAssembler,
  boxCheckHelloReply,
  buildRound,
  classifyRoundReply,
  emptyCloudMeta,
  helloVerdict,
  resumeFromHello,
  utf8ByteLength,
  validateRound,
} from './round';
import { buildSnapshot, pagesFromList } from './snapshot';

const SES = '0b3f7e21-4444-4d4d-8e8e-000000000004';

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

const H = (seq: number) => `A${String(seq).padStart(63, '0')}`;
const WORDS = ['the', 'witness', 'objection', 'Q.', 'A.', 'yes', 'no', 'exhibit', '\x0F26JAN240', '\x0C0042', 'é', '😀'];

/** A random editing session over a parser-like line buffer. */
class Editor {
  buf: unknown[] = [];
  shrinkCause?: string;
  private serial = 0;
  constructor(private readonly rand: () => number) {}

  private int(n: number): number {
    return Math.floor(this.rand() * n);
  }

  private line(i: number): unknown[] {
    const words = Array.from({ length: 1 + this.int(6) }, () => WORDS[this.int(WORDS.length)]);
    const text = words.join(' ') + ` #${this.serial++}`;
    const tuple: unknown[] = ['10:00:' + String(this.int(60)).padStart(2, '0'), Array.from(text, c => c.charCodeAt(0)), i, 'FL', 1, (i % 25) + 1, null, null, null, null];
    if (this.rand() < 0.1) tuple[7] = [{ tab: this.int(3) }];
    if (this.rand() < 0.1) tuple.length = 7;
    return tuple;
  }

  /** Apply one random edit. */
  step(): void {
    const n = this.buf.length;
    this.shrinkCause = undefined;
    const r = this.rand();
    if (r < 0.25 && n) {
      // keystrokes on the last line, in place (the parser rewrites [1] on the shared tuple)
      const last = this.buf[n - 1];
      if (Array.isArray(last)) last[1] = [...(last[1] as number[]), 97 + this.int(26)];
      else this.buf[n - 1] = this.line(n - 1);
    } else if (r < 0.45) {
      this.buf.push(this.line(n));
    } else if (r < 0.55 && n) {
      this.buf[this.int(n)] = this.line(0); // refresh / G rewrites an earlier line
    } else if (r < 0.62) {
      const at = this.int(n + 1);
      this.buf.splice(at, 0, this.line(at)); // moves every later line, across page boundaries
    } else if (r < 0.7 && n) {
      this.buf.splice(this.int(n), 1 + this.int(3)); // R..E / D10 / backspace: a shrink
      this.shrinkCause = 'R..E';
    } else if (r < 0.74 && n) {
      this.buf.length = Math.max(0, n - 1 - this.int(30));
      this.shrinkCause = 'D10';
    } else if (r < 0.78 && n > 1) {
      this.buf[this.int(n - 1)] = undefined; // a hole → filler
    } else if (r < 0.83 && n) {
      const t = this.buf[this.int(n)];
      if (Array.isArray(t)) t[2] = this.int(5000); // [2] rewritten in place: no canonical change
    } else if (r < 0.88) {
      this.buf = this.buf.map(t => (Array.isArray(t) ? [...t] : t)); // DET-8: a new buffer object
    } else if (r < 0.92) {
      const k = 20 + this.int(200);
      for (let j = 0; j < k; j++) this.buf.push(this.line(this.buf.length));
    }
    // else: no-op (a timer boundary with nothing new)
  }
}

/**
 * Compact equality for big structures: a failure names the first differing
 * element instead of letting jest diff thousands of rows.
 */
function same(actual: unknown, expected: unknown, label: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) return;
  let detail = '';
  if (Array.isArray(actual) && Array.isArray(expected)) {
    const k = Array.from({ length: Math.max(actual.length, expected.length) }, (_, i) => i).find(
      i => JSON.stringify(actual[i]) !== JSON.stringify(expected[i]),
    );
    detail = ` (lengths ${actual.length}/${expected.length}; first difference at [${k}]: ${String(JSON.stringify(actual[k])).slice(0, 300)} vs ${String(JSON.stringify(expected[k])).slice(0, 300)})`;
  } else {
    detail = ` (${a?.slice(0, 300)} vs ${e?.slice(0, 300)})`;
  }
  throw new Error(`${label} differs${detail}`);
}

/**
 * A minimal reader model (pages of rows) driven by a broadcast plan, in order:
 * `message` rows land at [2]; a `previous-data` page replaces its page;
 * `feed-shrink` trims to totalLines; `feed-resync` refetches a snapshot of
 * `current()` (what fetch-data would send at that moment).
 */
function replayInto(model: Map<number, unknown[]>, plan: BroadcastPlan, nLines: number, current: () => Map<number, readonly unknown[]>): void {
  for (const step of plan.steps) {
    for (const emit of step.emits) {
      if (emit.event === 'message') {
        for (const row of emit.payload.d) {
          const idx = row[2] as number;
          const p = Math.floor(idx / emit.payload.l) + 1;
          const page = model.get(p) ?? [];
          page[idx % emit.payload.l] = row;
          model.set(p, page);
        }
      } else if (emit.event === 'previous-data') {
        model.set(emit.payload.page, JSON.parse(emit.payload.data));
      } else if (emit.payload.type === 'feed-shrink') {
        const count = pageCount(emit.payload.totalLines, nLines);
        for (const p of [...model.keys()]) if (p > count) model.delete(p);
        const last = model.get(count);
        if (last) last.length = Math.min(last.length, emit.payload.totalLines - (count - 1) * nLines);
      } else {
        model.clear();
        for (const payload of buildSnapshot(current(), { nSesid: SES })) model.set(payload.page, JSON.parse(payload.data));
      }
    }
  }
}

describe('edge-sync properties (seeded)', () => {
  it('P3: every cut is exact and the committed state == a full canonicalisation', () => {
    for (const nLines of [25, 10, 7]) {
      for (let s = 0; s < 12; s++) {
        const rand = mulberry32(1000 * nLines + s);
        const ed = new Editor(rand);
        const cutter = new PageCutter({ nSesid: SES, nLines });
        let prev: string[] = [];
        let prevAll: readonly (readonly unknown[])[] = [];
        let rev = 0;
        let seq = 0;
        for (let step = 0; step < 50; step++) {
          ed.step();
          seq += 1;
          const cut = cutter.boundary(ed.buf, seq, H(seq), ed.shrinkCause);
          // The oracle: a full canonicalisation of the buffer, from scratch.
          const full = canonicalPages(ed.buf, nLines);
          const now = full.flat().map(line => JSON.stringify(line));
          const n = now.length;
          expect(n).toBe(ed.buf.length);
          const prevN = prev.length;
          const changed = now.map((c, i) => (i >= prevN || c !== prev[i] ? i : -1)).filter(i => i >= 0);
          if (!changed.length && n === prevN) {
            expect(cut).toBeNull();
            continue;
          }
          expect(cut).not.toBeNull();
          rev += 1;
          const pages = new Set(changed.map(i => Math.floor(i / nLines) + 1));
          if (n !== prevN) pages.add(Math.floor(Math.min(n, prevN) / nLines) + 1);
          const count = pageCount(n, nLines);
          const at = `nLines ${nLines} seed ${s} step ${step}`;
          expect(cut!.rev).toBe(rev);
          expect(cut!.prevTotal).toBe(prevN);
          expect(cut!.totalLines).toBe(n);
          same(cut!.changed, changed, `${at}: changed`);
          same(cut!.changedPages, [...pages].sort((a, b) => a - b), `${at}: changedPages`);
          same(cut!.pages.map(p => p.p), [...pages].filter(p => p <= count).sort((a, b) => a - b), `${at}: pages`);
          same(cut!.droppedPages, Array.from({ length: Math.max(0, pageCount(prevN, nLines) - count) }, (_, k) => count + 1 + k), `${at}: dropped`);
          expect(cut!.from).toBe(changed.reduce((m, i) => Math.min(m, i), n !== prevN ? Math.min(n, prevN) : Infinity));
          same(cut!.shrink ?? null, n < prevN ? (ed.shrinkCause ? { lines: prevN - n, cause: ed.shrinkCause } : { lines: prevN - n }) : null, `${at}: shrink`);
          // Digests of the full canonicalisation == the cut's digests; the cut's
          // re-cut pages hash to their digests, and every other page is the very
          // page object of the previous cut (verified then): so pages == full.
          same(cut!.digests, full.map(p => pageDigest(p)), `${at}: digests vs full canonicalisation`);
          expect(cut!.root).toBe(rootDigest(SES, n, cut!.digests));
          expect(cut!.allPages).toHaveLength(count);
          const recut = new Map(cut!.pages.map(p => [p.p, p]));
          for (const p of cut!.pages) expect(p.d).toBe(pageDigest(p.lines));
          for (let k = 0; k < count; k++) {
            const page = cut!.allPages[k];
            if (recut.has(k + 1)) expect(page).toBe(recut.get(k + 1)!.lines);
            else expect(page).toBe(prevAll[k]);
          }
          prev = now;
          prevAll = cut!.allPages;
        }
        expect(cutter.audit(ed.buf).mismatchedPages).toEqual([]);
      }
    }
  });

  it('determinism: two independent runs give identical revs, roots and digests', () => {
    const run = (seed: number) => {
      const ed = new Editor(mulberry32(seed));
      const cutter = new PageCutter({ nSesid: SES });
      const trace: string[] = [];
      for (let step = 0; step < 80; step++) {
        ed.step();
        const cut = cutter.boundary(ed.buf, step, H(step), ed.shrinkCause);
        trace.push(cut ? `${cut.rev}|${cut.root}|${cut.digests.join(',')}|${cut.changed.length}` : '-');
      }
      return trace;
    };
    for (const seed of [11, 22]) expect(run(seed)).toEqual(run(seed));
  });

  it('P4/P9: the cloud converges to the box under drops, lost acks, partial/duplicate/reordered parts and a lagging raw lane', () => {
    for (let s = 0; s < 20; s++) {
      const rand = mulberry32(0xc0de + s);
      const int = (n: number) => Math.floor(rand() * n);
      const ed = new Editor(rand);
      const cutter = new PageCutter({ nSesid: SES });
      const boxRoots = new Set<string>([cutter.view().root]);

      let meta: CloudSessionMeta = emptyCloudMeta(SES);
      const store = new Map<number, unknown[]>();
      const asm = new RoundAssembler();
      let rawAcked = 0;
      let seq = 0;
      let nowMs = 0;
      let cloud: CloudView = { digests: [], totalLines: 0, root: meta.root };
      let lineage = { appliedRawSeq: null as number | null, appliedRawHash: null as string | null };
      let lastRound: EdgeHelloSession['lastRound'] = null;
      let needHello = false;

      const applyPlan = (plan: RoundApplyPlan) => {
        expect(boxRoots.has(plan.root)).toBe(true); // never a root the box never had
        expect(plan.meta.appliedRev).toBeGreaterThan(meta.appliedRev);
        expect(plan.meta.appliedRawSeq!).toBeGreaterThanOrEqual(meta.appliedRawSeq ?? 0);
        for (const pg of plan.pages) store.set(pg.p, JSON.parse(JSON.stringify(pg.lines)));
        for (const p of [...store.keys()]) if (p > plan.deletePagesAbove) store.delete(p);
        meta = plan.meta;
      };
      const rawHashAt = (q: number) => (q <= rawAcked ? H(q) : undefined);
      const deliver = (round: Parameters<typeof validateRound>[0]) => {
        let decision = validateRound(round, meta, { rawHashAt });
        if (decision.action === 'hold') decision = validateRound(round, meta, { rawHashAt, confirmShrink: true }); // the admin confirms
        if (decision.action === 'apply') {
          applyPlan(decision.plan);
          return decision.plan.reply;
        }
        expect(decision.action).toBe('refuse');
        if (decision.action === 'refuse') {
          expect(decision.freeze).toBe(false); // one history: never a fork
          return decision.reply;
        }
        return null;
      };
      const hello = () => {
        const reply = helloVerdict(
          { nSesid: SES, epoch: 1, rebaseSeq: null, rev: cutter.currentRev, totalLines: cutter.totalLines, root: cutter.view().root, raw: { headSeq: seq, headHash: H(seq) }, lastRound, state: 'live', incidents: [] },
          { meta, bound: true, rawAcked: { seq: rawAcked, hash: rawAcked ? H(rawAcked) : '' }, rawHashAt },
        );
        const journal = { headSeq: seq, hashAt: (q: number) => (q <= seq ? (q === 0 ? '' : H(q)) : undefined) };
        const decision = boxCheckHelloReply(reply, journal);
        expect(decision.verdict).toBe('continue');
        const resume = resumeFromHello(reply, journal);
        if (reply.appliedRawSeq !== null) expect(resume.lineage.appliedRawHash).toBe(journal.hashAt(reply.appliedRawSeq)); // the box's own hash (D19)
        cloud = resume.cloud;
        lineage = resume.lineage;
        cutter.advanceRev(resume.appliedRev);
        boxRoots.add(cutter.view().root);
        needHello = false;
      };

      const sync = (fate: number) => {
        if (needHello) hello();
        const view: CutterView = cutter.view();
        const built = buildRound({ source: view, epoch: 1, rebaseSeq: null, lineage, cloud, maxPartBytes: 1500 + int(6000) });
        if (!built) return;
        lastRound = { rawSeqThrough: view.rawSeqThrough, rawHashThrough: view.rawHashThrough };
        const order = built.parts.map((_, k) => k).sort(() => rand() - 0.5);
        const sendCount = fate < 0.1 ? 0 : fate < 0.2 ? int(built.parts.length) : built.parts.length; // drop / partial / all
        let reply = null;
        nowMs += 1000;
        for (const k of order.slice(0, sendCount)) {
          const res = asm.add(built.parts[k], nowMs);
          if (res.status === 'complete') reply = deliver(res.round);
          else expect(res.status).toBe('partial');
        }
        if (fate > 0.9 && sendCount === built.parts.length) {
          // duplicate delivery: harmless (STALE or a new partial staging)
          for (const k of order) {
            const res = asm.add(built.parts[k], nowMs);
            if (res.status === 'complete') {
              const again = validateRound(res.round, meta, { rawHashAt });
              expect(again).toMatchObject({ action: 'refuse', reply: { code: 'STALE' } });
            }
          }
        }
        const lostAck = fate > 0.8 && fate <= 0.9;
        if (!reply || lostAck) {
          needHello = true; // the ack timed out: reconnect and hello (§5.5 "Lost ack")
          return;
        }
        const action = classifyRoundReply(reply);
        if (action.kind === 'acked') {
          cloud = built.afterAck.cloud;
          lineage = built.afterAck.lineage;
        } else if (action.kind === 'rebuild') {
          cloud = action.cloud;
        } else {
          expect(['rehello']).toContain(action.kind);
          needHello = true;
        }
      };

      for (let step = 0; step < 70; step++) {
        ed.step();
        seq += 1 + int(3);
        const cut = cutter.boundary(ed.buf, seq, H(seq), ed.shrinkCause);
        if (cut) boxRoots.add(cut.root);
        rawAcked = Math.min(seq, rawAcked + int(6)); // the raw lane lags the rounds
        if (rand() < 0.7) sync(rand());
        expect(meta.appliedRawSeq ?? 0).toBeLessThanOrEqual(seq);
      }
      // The link heals: sync until the box has nothing left to send.
      for (let k = 0; k < 10 && (needHello || meta.root !== cutter.view().root); k++) sync(0.5);
      expect(meta.root).toBe(cutter.view().root);
      expect(meta.totalLines).toBe(ed.buf.length);
      const pages = [...store.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
      same(pages, cutter.view().pages, `seed ${s}: cloud pages vs box pages`);
    }
  });

  it('P8: a reader fed only the broadcast plans equals a fresh snapshot after every cut', () => {
    const kinds = new Set<string>();
    for (const limits of [{}, { maxAppendLines: 3, maxPagedPages: 4 }]) {
      for (let s = 0; s < 14; s++) {
        const ed = new Editor(mulberry32(0xbeef + s));
        const cutter = new PageCutter({ nSesid: SES, nLines: s % 2 ? 25 : 9 });
        const model = new Map<number, unknown[]>();
        for (let step = 0; step < 50; step++) {
          ed.step();
          const cut = cutter.boundary(ed.buf, step, H(step), ed.shrinkCause);
          if (!cut) continue;
          const plan = planBroadcast(cut, limits);
          kinds.add(plan.kind);
          replayInto(model, plan, cut.nLines, () => pagesFromList(cutter.view().pages));
          const fresh = buildSnapshot(pagesFromList(cutter.view().pages), { nSesid: SES }).map(p => [p.page, JSON.parse(p.data)]);
          const seen = [...model.entries()].sort((a, b) => b[0] - a[0]).map(([p, rows]) => [p, rows]);
          same(seen, fresh, `seed ${s} step ${step} (${plan.kind}): reader model vs snapshot`);
        }
      }
    }
    expect([...kinds].sort()).toEqual(['append', 'pages', 'resync']);
  });

  it('P8 (cloud): a reader fed the cloud broadcasts of applied rounds (coalescing several cuts) equals the box snapshot', () => {
    for (let s = 0; s < 12; s++) {
      const rand = mulberry32(0xfeed + s);
      const nLines = s % 2 ? 25 : 8;
      const ed = new Editor(rand);
      const cutter = new PageCutter({ nSesid: SES, nLines });
      const cloud = { meta: emptyCloudMeta(SES, { nLines }), pages: new Map<number, readonly unknown[]>() };
      const model = new Map<number, unknown[]>();
      for (let step = 0; step < 50; step++) {
        ed.step();
        cutter.boundary(ed.buf, step + 1, H(step + 1), ed.shrinkCause);
        if (rand() < 0.5) continue; // the round coalesces the cuts since the last one
        const view = cutter.view();
        cutter.advanceRev(cloud.meta.appliedRev);
        const built = buildRound({
          source: cutter.view(),
          epoch: 1,
          rebaseSeq: null,
          lineage: { appliedRawSeq: cloud.meta.appliedRawSeq, appliedRawHash: cloud.meta.appliedRawHash },
          cloud: { digests: cloud.meta.digests, totalLines: cloud.meta.totalLines },
        });
        if (!built) continue;
        const asm = new RoundAssembler();
        let res;
        for (const part of built.parts) res = asm.add(part, 0);
        let decision = validateRound(res.round, cloud.meta);
        if (decision.action === 'hold') decision = validateRound(res.round, cloud.meta, { confirmShrink: true });
        if (decision.action !== 'apply') throw new Error(`round refused: ${JSON.stringify(decision)}`);
        const plan = decision.plan;
        const bcut = broadcastCutFromRound(plan, { totalLines: cloud.meta.totalLines, page: p => cloud.pages.get(p) }, nLines);
        for (const pg of plan.pages) cloud.pages.set(pg.p, pg.lines);
        for (const p of [...cloud.pages.keys()]) if (p > plan.deletePagesAbove) cloud.pages.delete(p);
        cloud.meta = plan.meta;
        replayInto(model, planBroadcast(bcut), nLines, () => cloud.pages);
        const fresh = buildSnapshot(pagesFromList(view.pages), { nSesid: SES }).map(p => [p.page, JSON.parse(p.data)]);
        const seen = [...model.entries()].sort((a, b) => b[0] - a[0]).map(([p, rows]) => [p, rows]);
        same(seen, fresh, `seed ${s} step ${step}: cloud reader model vs box snapshot`);
      }
    }
  });

  it('round splitting: every part within the limit (or a lone oversize page), every dirty page once, in order', () => {
    const rand = mulberry32(0x5911);
    for (let s = 0; s < 40; s++) {
      const ed = new Editor(rand);
      for (let k = 0; k < 30; k++) ed.step();
      const cutter = new PageCutter({ nSesid: SES, nLines: 5 + Math.floor(rand() * 30) });
      cutter.boundary(ed.buf, 1, H(1));
      const view = cutter.view();
      const known = view.digests.map(d => (rand() < 0.5 ? d : 'stale'));
      const maxPartBytes = 800 + Math.floor(rand() * 20000);
      const built = buildRound({ source: view, epoch: 1, rebaseSeq: null, lineage: { appliedRawSeq: null, appliedRawHash: null }, cloud: { digests: known, totalLines: null }, maxPartBytes });
      if (!built) continue;
      expect(built.parts.flatMap(p => p.pages.map(pg => pg.p))).toEqual(built.dirty);
      built.parts.forEach((part, k) => {
        const bytes = utf8ByteLength(JSON.stringify(part));
        expect(bytes).toBe(built.partBytes[k]);
        if (part.pages.length === 1 && built.oversizePages.includes(part.pages[0].p)) return;
        expect(bytes).toBeLessThanOrEqual(maxPartBytes);
      });
    }
  });
});
