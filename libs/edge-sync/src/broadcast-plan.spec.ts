import { BROADCAST_LIMITS, BroadcastCut, BroadcastPlan, broadcastCutFromRound, planBroadcast, sessionRoom } from './broadcast-plan';
import { canonicalLine } from './canonical';
import { Cut, PageCutter } from './cutter';
import * as fingerprint from './fingerprint';

const SES = '5e7a2b3c-3333-4c4c-9d9d-000000000003';
const ROOM = `S${SES}`;
const codes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const mk = (i: number, text = `line ${i}`) => ['10:00:00', codes(text), i, 'FL', 1, (i % 25) + 1, (i + 1) * 1e6, null, null, null];
const buffer = (n: number) => Array.from({ length: n }, (_, i) => mk(i));

function cutter(n: number, nLines = 25) {
  const c = new PageCutter({ nSesid: SES, nLines });
  const buf: unknown[] = buffer(n);
  const first = n ? c.boundary(buf, 1, 'h1') : null;
  return { c, buf, first };
}

const events = (plan: BroadcastPlan) => plan.steps.flatMap(s => s.emits.map(e => [s.atMs, e.event] as const));

describe('planBroadcast (spec §5.8)', () => {
  it('uses the session room S{nSesid}', () => {
    expect(sessionRoom(SES)).toBe(ROOM);
    expect(BROADCAST_LIMITS).toEqual({ maxAppendLines: 200, maxPagedPages: 400, pagesPerTick: 20, tickMs: 100 });
  });

  it('plans nothing for an empty cut', () => {
    const empty: BroadcastCut = { nSesid: SES, nLines: 25, rev: 3, prevTotal: 10, totalLines: 10, changed: [], pages: [] };
    expect(planBroadcast(empty)).toEqual({ kind: 'none', nSesid: SES, rev: 3, steps: [], emitCount: 0, pages: [] });
  });

  describe('pure append → one rev-tagged message', () => {
    it('sends the changed rows with the parser TCP-DATA fields (i, d, date, l, p) plus rev', () => {
      const { c, buf } = cutter(30);
      buf[29] = mk(29, 'line 29 grows');
      buf.push(mk(30), mk(31));
      const cut = c.boundary(buf, 2, 'h2')!;
      const plan = planBroadcast(cut);
      expect(plan.kind).toBe('append');
      expect(plan.steps).toHaveLength(1);
      const [emit] = plan.steps[0].emits;
      expect(emit.room).toBe(ROOM);
      expect(emit.event).toBe('message');
      expect(Object.keys(emit.payload)).toEqual(['i', 'd', 'date', 'l', 'p', 'rev']);
      expect(emit.payload).toEqual({
        i: 32,
        d: [canonicalLine(buf[29], 29), canonicalLine(buf[30], 30), canonicalLine(buf[31], 31)],
        date: SES,
        l: 25,
        p: 2,
        rev: 2,
      });
    });

    it('the first cut of a session (prevTotal 0) is an append', () => {
      const { first } = cutter(40);
      const plan = planBroadcast(first!);
      expect(plan.kind).toBe('append');
      expect((plan.steps[0].emits[0].payload as any).d).toHaveLength(40);
      expect((plan.steps[0].emits[0].payload as any).p).toBe(2);
    });

    it('up to 200 lines; 201 lines go out as pages', () => {
      expect(planBroadcast(cutter(200).first!).kind).toBe('append');
      const plan = planBroadcast(cutter(201).first!);
      expect(plan.kind).toBe('pages');
      expect(plan.pages).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
    });

    it('honours a non-25 page size in l and p', () => {
      const { c, buf } = cutter(19, 10);
      buf.push(mk(19), mk(20));
      const payload = planBroadcast(c.boundary(buf, 2, 'h2')!).steps[0].emits[0].payload as any;
      expect(payload.l).toBe(10);
      expect(payload.p).toBe(3);
    });
  });

  describe('rewrites → paced, untagged previous-data with rev and totalLines', () => {
    it('a refresh of an earlier line re-sends its page', () => {
      const { c, buf } = cutter(60);
      buf[3] = mk(3, 'corrected');
      const cut = c.boundary(buf, 2, 'h2')!;
      const plan = planBroadcast(cut);
      expect(plan.kind).toBe('pages');
      expect(plan.pages).toEqual([1]);
      const [emit] = plan.steps[0].emits;
      expect(emit.event).toBe('previous-data');
      expect(Object.keys(emit.payload)).toEqual(['msg', 'page', 'data', 'totalPages', 'nSesid', 'rev', 'totalLines']);
      expect(emit.payload).toEqual({
        msg: 1,
        page: 1,
        data: JSON.stringify(cut.allPages[0]),
        totalPages: 3,
        nSesid: SES,
        rev: 2,
        totalLines: 60,
      });
      expect('tab' in emit.payload).toBe(false); // untagged: never mistaken for a fetch answer
    });

    it('paces at most 20 pages per 100 ms, newest page first', () => {
      const { c, buf } = cutter(45 * 25);
      for (let i = 0; i < buf.length; i += 25) buf[i] = mk(i, 'rewritten');
      const plan = planBroadcast(c.boundary(buf, 2, 'h2')!);
      expect(plan.steps.map(s => [s.atMs, s.emits.length])).toEqual([[0, 20], [100, 20], [200, 5]]);
      expect(plan.pages[0]).toBe(45);
      expect(plan.pages[44]).toBe(1);
      expect(plan.emitCount).toBe(45);
    });

    it('a line moved across a page boundary re-sends both pages', () => {
      const { c, buf } = cutter(40);
      buf.splice(20, 0, mk(20, 'inserted'));
      const plan = planBroadcast(c.boundary(buf, 2, 'h2')!);
      expect(plan.pages).toEqual([2, 1]);
    });

    it('a page forced by the digest audit is a rewrite', () => {
      const { c, buf } = cutter(30);
      const spy = jest.spyOn(fingerprint, 'lineFingerprint').mockReturnValue(1);
      const blind = new PageCutter({ nSesid: SES });
      blind.boundary(buf, 1, 'h1');
      buf[29] = mk(29, 'collides');
      blind.audit(buf);
      const cut = blind.boundary(buf, 2, 'h2')!;
      spy.mockRestore();
      expect(planBroadcast(cut).kind).toBe('pages');
      void c;
    });
  });

  describe('shrink', () => {
    it('adds realtime-events feed-shrink, first, to the re-sent pages', () => {
      const { c, buf } = cutter(60);
      buf.length = 55;
      const plan = planBroadcast(c.boundary(buf, 2, 'h2')!);
      expect(events(plan)).toEqual([[0, 'realtime-events'], [0, 'previous-data']]);
      expect(plan.steps[0].emits[0].payload).toEqual({ type: 'feed-shrink', nSesid: SES, totalLines: 55, rev: 2 });
      expect(plan.pages).toEqual([3]);
    });

    it('a drop to a page boundary sends only feed-shrink', () => {
      const { c, buf } = cutter(60);
      buf.length = 50;
      const plan = planBroadcast(c.boundary(buf, 2, 'h2')!);
      expect(plan.kind).toBe('pages');
      expect(events(plan)).toEqual([[0, 'realtime-events']]);
    });

    it('a shrink is never sent as an append, even at the tail', () => {
      const { c, buf } = cutter(30);
      buf.length = 29;
      buf[28] = mk(28, 'edited');
      expect(planBroadcast(c.boundary(buf, 2, 'h2')!).kind).toBe('pages');
    });
  });

  describe('cloud side: broadcastCutFromRound', () => {
    const storeOf = (cut: Cut) => ({ totalLines: cut.totalLines, page: (p: number) => cut.allPages[p - 1] });

    it('a round that only appends plans the same message as the box cut', () => {
      const { c, buf, first } = cutter(30);
      buf[29] = mk(29, 'grows');
      buf.push(mk(30));
      const boxCut = c.boundary(buf, 2, 'h2')!;
      const round = { nSesid: SES, rev: 7, totalLines: 31, pages: boxCut.pages };
      const cloudCut = broadcastCutFromRound(round, storeOf(first!), 25);
      expect(cloudCut).toEqual({ nSesid: SES, nLines: 25, rev: 7, prevTotal: 30, totalLines: 31, changed: [29, 30], pages: boxCut.pages });
      const cloudPlan = planBroadcast(cloudCut);
      expect(cloudPlan.kind).toBe('append');
      expect(cloudPlan.steps[0].emits[0].payload).toEqual({ ...(planBroadcast(boxCut).steps[0].emits[0].payload as object), rev: 7 });
    });

    it('a coalesced round (several cuts) diffs against the stored pages', () => {
      const { c, buf, first } = cutter(60);
      buf[3] = mk(3, 'refresh');
      c.boundary(buf, 2, 'h2');
      buf.length = 52;
      const last = c.boundary(buf, 3, 'h3', 'G')!;
      const pages = [1, 3].map(p => ({ p, d: last.digests[p - 1], lines: last.allPages[p - 1] }));
      const cloudCut = broadcastCutFromRound({ nSesid: SES, rev: 9, totalLines: 52, pages, shrinkCause: 'G' }, storeOf(first!), 25);
      expect(cloudCut.changed).toEqual([3]);
      expect(cloudCut.shrink).toEqual({ lines: 8, cause: 'G' });
      const plan = planBroadcast(cloudCut);
      expect(plan.kind).toBe('pages');
      expect(events(plan)).toEqual([[0, 'realtime-events'], [0, 'previous-data'], [0, 'previous-data']]);
      expect(plan.pages).toEqual([3, 1]);
    });

    it('lines past the old total are always changed, and a page the store lacks counts as new', () => {
      const cut = broadcastCutFromRound(
        { nSesid: SES, rev: 1, totalLines: 3, pages: [{ p: 1, d: 'd', lines: [['a', [], 0], ['b', [], 1], ['c', [], 2]] }] },
        { totalLines: 2, page: () => undefined },
        25,
      );
      expect(cut.changed).toEqual([0, 1, 2]);
      expect(cut.shrink).toBeUndefined();
    });

    it('refuses to plan a message for a changed line outside the cut pages', () => {
      const bad: BroadcastCut = { nSesid: SES, nLines: 25, rev: 1, prevTotal: 0, totalLines: 1, changed: [0], pages: [] };
      expect(() => planBroadcast(bad)).toThrow(RangeError);
    });
  });

  describe('more than 400 changed pages → one feed-resync', () => {
    const many = (pages: number) => {
      const cut = cutter(pages * 25).first! as Cut;
      return { ...cut, changed: [0, ...cut.changed.slice(1)], prevTotal: pages * 25 } as BroadcastCut;
    };

    it('401 pages resync, 400 pages are paced over 20 ticks', () => {
      const resync = planBroadcast(many(401));
      expect(resync).toMatchObject({ kind: 'resync', emitCount: 1 });
      expect(resync.steps[0].emits[0]).toEqual({ room: ROOM, event: 'realtime-events', payload: { type: 'feed-resync', nSesid: SES, rev: 1 } });
      const paced = planBroadcast(many(400));
      expect(paced.kind).toBe('pages');
      expect(paced.steps).toHaveLength(20);
      expect(paced.steps[19].atMs).toBe(1900);
    });

    it('a resync wins over a shrink', () => {
      const cut = { ...many(401), prevTotal: 500 * 25 };
      expect(planBroadcast(cut).kind).toBe('resync');
    });

    it('limits can be tightened (tests, slow LANs)', () => {
      const { c, buf } = cutter(100);
      for (let i = 0; i < 100; i += 25) buf[i] = mk(i, 'x');
      const cut = c.boundary(buf, 2, 'h2')!;
      expect(planBroadcast(cut, { maxPagedPages: 3 }).kind).toBe('resync');
      expect(planBroadcast(cut, { pagesPerTick: 1, tickMs: 50 }).steps.map(s => s.atMs)).toEqual([0, 50, 100, 150]);
    });
  });
});
