import { canonicalPages, pageCount } from './canonical';
import { Cut, CutterStateError, PageCutter } from './cutter';
import { pageDigest, rootDigest } from './digest';
import * as fingerprint from './fingerprint';

const SES = '8d1f0c2e-1111-4a4a-9b9b-000000000001';
const codes = (s: string) => Array.from(s, c => c.charCodeAt(0));
const mk = (i: number, text = `line ${i}`) => ['10:00:00', codes(text), i, 'FL', 1, (i % 25) + 1, (i + 1) * 1e6, null, null, null];
const buffer = (n: number) => Array.from({ length: n }, (_, i) => mk(i));
const H = (seq: number) => `h${seq}`;

/** The cut must always equal a full canonicalisation of the buffer (P3). */
function expectMatchesBuffer(cutter: PageCutter, buf: unknown[]) {
  const pages = canonicalPages(buf, cutter.nLines);
  const digests = pages.map(p => pageDigest(p));
  const view = cutter.view();
  expect(view.totalLines).toBe(buf.length);
  expect(view.pages).toEqual(pages);
  expect(view.digests).toEqual(digests);
  expect(view.root).toBe(rootDigest(SES, buf.length, digests));
}

describe('PageCutter (spec §6.2)', () => {
  it('does nothing on an empty buffer', () => {
    const cutter = new PageCutter({ nSesid: SES });
    expect(cutter.boundary([], 0, H(0))).toBeNull();
    expect(cutter.currentRev).toBe(0);
    expect(cutter.view().root).toBe(rootDigest(SES, 0, []));
  });

  describe('append-only', () => {
    it('cuts the new lines and their pages, rev 1', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(30);
      const cut = cutter.boundary(buf, 12, H(12))!;
      expect(cut.rev).toBe(1);
      expect(cut.prevTotal).toBe(0);
      expect(cut.totalLines).toBe(30);
      expect(cut.from).toBe(0);
      expect(cut.changed).toEqual(Array.from({ length: 30 }, (_, i) => i));
      expect(cut.changedPages).toEqual([1, 2]);
      expect(cut.pages.map(p => [p.p, p.lines.length])).toEqual([[1, 25], [2, 5]]);
      expect(cut.droppedPages).toEqual([]);
      expect(cut.shrink).toBeUndefined();
      expect(cut.rawSeqThrough).toBe(12);
      expect(cut.rawHashThrough).toBe('h12');
      expect(cut.pages[0].d).toBe(pageDigest(cut.pages[0].lines));
      expectMatchesBuffer(cutter, buf);
    });

    it('a growing last line and a new line touch only the tail (from = prevTotal - 1)', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(30);
      cutter.boundary(buf, 1, H(1));
      buf[29] = mk(29, 'line 29 and more');
      buf.push(mk(30));
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.rev).toBe(2);
      expect(cut.prevTotal).toBe(30);
      expect(cut.totalLines).toBe(31);
      expect(cut.from).toBe(29);
      expect(cut.changed).toEqual([29, 30]);
      expect(cut.changedPages).toEqual([2]);
      expect(cut.pages.map(p => p.p)).toEqual([2]);
      expectMatchesBuffer(cutter, buf);
    });

    it('an append that crosses into a new page cuts both pages', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(24);
      cutter.boundary(buf, 1, H(1));
      buf.push(mk(24), mk(25));
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.changed).toEqual([24, 25]);
      expect(cut.changedPages).toEqual([1, 2]);
      expectMatchesBuffer(cutter, buf);
    });

    it('returns null and keeps rev when nothing changed, even if the parser rewrote [2] in place or replaced the array', () => {
      const cutter = new PageCutter({ nSesid: SES });
      let buf: any[] = buffer(10);
      cutter.boundary(buf, 1, H(1));
      buf[8][2] = 9; // bridge emitToLocalUser rewrites [2] on the shared tuple
      expect(cutter.boundary(buf, 2, H(2))).toBeNull();
      buf = buf.map(line => [...line]); // DET-8: the buffer object is replaced per keystroke
      expect(cutter.boundary(buf, 3, H(3))).toBeNull();
      expect(cutter.currentRev).toBe(1);
      expect(cutter.view().rawSeqThrough).toBe(1); // a no-op boundary commits nothing
    });
  });

  describe('refresh rewriting earlier lines', () => {
    it('cuts only the rewritten page, from the first rewritten index', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(60);
      cutter.boundary(buf, 1, H(1));
      buf[3] = mk(3, 'corrected');
      buf[7] = mk(7, 'also corrected');
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.from).toBe(3);
      expect(cut.changed).toEqual([3, 7]);
      expect(cut.changedPages).toEqual([1]);
      expect(cut.totalLines).toBe(60);
      expect(cut.digests[1]).toBe(cut.allPages[1] && pageDigest(cut.allPages[1]));
      expectMatchesBuffer(cutter, buf);
    });

    it('strips page-frame atoms in the canonical text', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = [mk(0, 'A\x0F26JAN240B')];
      const cut = cutter.boundary(buf, 1, H(1))!;
      expect(cut.pages[0].lines[0][1]).toEqual(codes('AB'));
    });
  });

  describe('a line moved across a page boundary', () => {
    it('an insertion at index 20 shifts lines 20.. across pages 1 and 2', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf: unknown[] = buffer(30);
      cutter.boundary(buf, 1, H(1));
      buf.splice(20, 0, mk(20, 'inserted'));
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.from).toBe(20);
      expect(cut.totalLines).toBe(31);
      expect(cut.changed).toEqual(Array.from({ length: 11 }, (_, k) => 20 + k));
      expect(cut.changedPages).toEqual([1, 2]);
      // The old line 24 is now the first line of page 2, at position 25.
      expect(cut.allPages[1][0][1]).toEqual(codes('line 24'));
      expect(cut.allPages[1][0][2]).toBe(25);
      expectMatchesBuffer(cutter, buf);
    });

    it('a deletion at index 24 pulls line 25 back onto page 1 and shrinks by one', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf: unknown[] = buffer(30);
      cutter.boundary(buf, 1, H(1));
      buf.splice(24, 1);
      const cut = cutter.boundary(buf, 2, H(2), 'R..E')!;
      expect(cut.shrink).toEqual({ lines: 1, cause: 'R..E' });
      expect(cut.changedPages).toEqual([1, 2]);
      expect(cut.allPages[0][24][1]).toEqual(codes('line 25'));
      expect(cut.allPages[0][24][2]).toBe(24);
      expectMatchesBuffer(cutter, buf);
    });
  });

  describe('shrink', () => {
    it('a tail drop to a page boundary drops the page and re-cuts nothing', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(60);
      cutter.boundary(buf, 1, H(1));
      buf.length = 50;
      const cut = cutter.boundary(buf, 2, H(2), 'D10')!;
      expect(cut.prevTotal).toBe(60);
      expect(cut.totalLines).toBe(50);
      expect(cut.shrink).toEqual({ lines: 10, cause: 'D10' });
      expect(cut.changed).toEqual([]);
      expect(cut.from).toBe(50);
      expect(cut.changedPages).toEqual([3]);
      expect(cut.pages).toEqual([]);
      expect(cut.droppedPages).toEqual([3]);
      expect(cut.digests).toHaveLength(2);
      expect(cutter.view().lastShrinkCause).toBe('D10');
      expectMatchesBuffer(cutter, buf);
    });

    it('a tail drop inside a page re-cuts that page', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(60);
      cutter.boundary(buf, 1, H(1));
      buf.length = 55;
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.shrink).toEqual({ lines: 5 });
      expect(cut.pages.map(p => [p.p, p.lines.length])).toEqual([[3, 5]]);
      expect(cut.droppedPages).toEqual([]);
      expectMatchesBuffer(cutter, buf);
    });

    it('shrinking to nothing leaves the empty root', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(3);
      cutter.boundary(buf, 1, H(1));
      const cut = cutter.boundary([], 2, H(2))!;
      expect(cut.totalLines).toBe(0);
      expect(cut.droppedPages).toEqual([1]);
      expect(cut.root).toBe(rootDigest(SES, 0, []));
    });
  });

  describe('lines per page other than 25', () => {
    it.each([10, 30, 1])('pages by %i lines', nLines => {
      const cutter = new PageCutter({ nSesid: SES, nLines });
      const buf = buffer(23);
      const first = cutter.boundary(buf, 1, H(1))!;
      expect(first.allPages.map(p => p.length)).toEqual(canonicalPages(buf, nLines).map(p => p.length));
      expect(first.nLines).toBe(nLines);
      buf[12] = mk(12, 'fixed');
      const cut = cutter.boundary(buf, 2, H(2))!;
      expect(cut.changedPages).toEqual([Math.floor(12 / nLines) + 1]);
      expect(cut.digests).toHaveLength(pageCount(23, nLines));
      expectMatchesBuffer(cutter, buf);
    });

    it('rejects a bad page size, session or fmt', () => {
      expect(() => new PageCutter({ nSesid: SES, nLines: 0 })).toThrow(RangeError);
      expect(() => new PageCutter({ nSesid: '' })).toThrow(TypeError);
      expect(() => new PageCutter({ nSesid: SES, fmt: 9 })).toThrow(/unsupported page format/);
    });
  });

  describe('root stability', () => {
    it('the same transcript has the same root, whatever path led there', () => {
      const a = new PageCutter({ nSesid: SES });
      const b = new PageCutter({ nSesid: SES });
      const bufA = buffer(40);
      a.boundary(bufA, 1, H(1));
      const bufB = buffer(10);
      b.boundary(bufB, 1, H(1));
      bufB.push(...buffer(40).slice(10));
      bufB[5] = mk(5, 'typo');
      b.boundary(bufB, 2, H(2));
      bufB[5] = mk(5);
      b.boundary(bufB, 3, H(3));
      expect(b.view().root).toBe(a.view().root);
      expect(b.view().digests).toEqual(a.view().digests);
      expect(b.currentRev).toBe(3);
    });

    it('a change and its revert restore the root under a new rev', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(30);
      const before = cutter.boundary(buf, 1, H(1))!.root;
      buf[2] = mk(2, 'changed');
      const changed = cutter.boundary(buf, 2, H(2))!;
      buf[2] = mk(2);
      const reverted = cutter.boundary(buf, 3, H(3))!;
      expect(changed.root).not.toBe(before);
      expect(reverted.root).toBe(before);
      expect(reverted.rev).toBe(3);
    });
  });

  it('cuts are immutable and survive later buffer mutation', () => {
    const cutter = new PageCutter({ nSesid: SES });
    const buf: any[] = buffer(5);
    const cut = cutter.boundary(buf, 1, H(1))!;
    buf[0][1].push(33);
    buf[0] = mk(0, 'other');
    expect(cut.allPages[0][0][1]).toEqual(codes('line 0'));
    expect(Object.isFrozen(cut)).toBe(true);
    expect(Object.isFrozen(cut.pages)).toBe(true);
    expect(Object.isFrozen(cut.allPages[0])).toBe(true);
    expect(() => (cut.allPages[0] as any[]).push([])).toThrow();
    const next = cutter.boundary(buf, 2, H(2))!;
    expect(next.allPages[1]).toBe(cut.allPages[1]); // untouched pages are shared, not copied
  });

  it('boundaryFromContext re-reads ctx.job.lineBuffer every time (DET-8) and takes ctx.lastShrinkCause', () => {
    const cutter = new PageCutter({ nSesid: SES });
    const ctx: { job: { lineBuffer: unknown[] | null }; lastShrinkCause?: string } = { job: { lineBuffer: buffer(10) } };
    expect(cutter.boundaryFromContext(ctx, 1, H(1))!.totalLines).toBe(10);
    ctx.job.lineBuffer = buffer(8); // the parser replaced the array
    ctx.lastShrinkCause = 'backspace';
    expect(cutter.boundaryFromContext(ctx, 2, H(2))!.shrink).toEqual({ lines: 2, cause: 'backspace' });
    ctx.job.lineBuffer = null;
    expect(cutter.boundaryFromContext(ctx, 3, H(3))!.totalLines).toBe(0);
  });

  it('holes and missing tuples become filler rows', () => {
    const cutter = new PageCutter({ nSesid: SES });
    const buf: unknown[] = [];
    buf[2] = mk(2);
    const cut = cutter.boundary(buf, 1, H(1))!;
    expect(cut.allPages[0].slice(0, 2)).toEqual([['00:00:00:00', [], 0], ['00:00:00:00', [], 1]]);
  });

  describe('audit (fingerprint collisions)', () => {
    afterEach(() => jest.restoreAllMocks());

    it('finds a page whose fingerprints collided and forces it into the next cut', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(30);
      cutter.boundary(buf, 1, H(1));
      const spy = jest.spyOn(fingerprint, 'lineFingerprint').mockReturnValue(1);
      const blind = new PageCutter({ nSesid: SES });
      blind.boundary(buf, 1, H(1));
      buf[3] = mk(3, 'collides');
      expect(blind.boundary(buf, 2, H(2))).toBeNull(); // every fingerprint is 1: missed
      const audit = blind.audit(buf);
      expect(audit.mismatchedPages).toEqual([1]);
      expect(audit.checkedPages).toBe(2);
      const cut = blind.boundary(buf, 3, H(3))!;
      expect(cut.changedPages).toEqual([1]);
      expect(cut.changed).toEqual(Array.from({ length: 25 }, (_, i) => i));
      expect(cut.from).toBe(0);
      spy.mockRestore();
      expect(blind.view().digests).toEqual(cutter.boundary(buf, 2, H(2))!.digests);
    });

    it('skips pages with pending changes and reports a clean audit', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(60);
      cutter.boundary(buf, 1, H(1));
      expect(cutter.audit(buf)).toEqual({ checkedPages: 3, mismatchedPages: [] });
      buf[30] = mk(30, 'pending');
      buf.push(mk(60));
      expect(cutter.audit(buf)).toEqual({ checkedPages: 1, mismatchedPages: [] });
    });
  });

  describe('hello resume', () => {
    it('advanceRev jumps past what the cloud applied: max(rev, appliedRev) + 1', () => {
      const cutter = new PageCutter({ nSesid: SES });
      const buf = buffer(3);
      cutter.boundary(buf, 1, H(1));
      expect(cutter.advanceRev(10)).toBe(11);
      expect(cutter.view().rev).toBe(11);
      expect(cutter.advanceRev(4)).toBe(12);
      buf.push(mk(3));
      expect(cutter.boundary(buf, 2, H(2))!.rev).toBe(13);
      expect(cutter.advanceRev(NaN)).toBe(14);
    });
  });

  describe('checkpoint', () => {
    function cutTo(n: number) {
      const cutter = new PageCutter({ nSesid: SES, nLines: 10 });
      const buf = buffer(n);
      cutter.boundary(buf, 5, H(5), 'G');
      return { cutter, buf };
    }

    it('restores to the same state, with fingerprints that match the live buffer', () => {
      const { cutter, buf } = cutTo(23);
      const state = JSON.parse(JSON.stringify(cutter.exportState()));
      const restored = PageCutter.restore(state);
      expect(restored.view()).toEqual(cutter.view());
      expect(restored.boundary(buf, 6, H(6))).toBeNull();
      buf[22] = mk(22, 'next');
      const a = restored.boundary(buf, 7, H(7)) as Cut;
      const b = cutter.boundary(buf, 7, H(7)) as Cut;
      expect(a.root).toBe(b.root);
      expect(a.changed).toEqual(b.changed);
      expect(a.rev).toBe(b.rev);
    });

    it('keeps forced pages across a checkpoint', () => {
      const { cutter } = cutTo(23);
      (cutter as any).forced.add(2);
      expect(cutter.exportState().forcedPages).toEqual([2]);
      expect(PageCutter.restore(cutter.exportState()).exportState().forcedPages).toEqual([2]);
    });

    it('refuses a checkpoint that does not verify', () => {
      const { cutter } = cutTo(23);
      const good = cutter.exportState();
      expect(() => PageCutter.restore({ ...good, root: 'x'.repeat(64) })).toThrow(CutterStateError);
      expect(() => PageCutter.restore({ ...good, totalLines: 24 })).toThrow(CutterStateError);
      expect(() => PageCutter.restore({ ...good, pages: good.pages.slice(0, 2) })).toThrow(CutterStateError);
      const tampered = JSON.parse(JSON.stringify(good));
      tampered.pages[0][3][1] = codes('forged');
      expect(() => PageCutter.restore(tampered)).toThrow(/root does not match/);
      expect(() => PageCutter.restore({ ...good, v: 2 } as any)).toThrow(CutterStateError);
    });
  });
});
