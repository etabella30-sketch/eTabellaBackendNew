/**
 * The boundary cut (spec §6.2), run INSIDE the parser's lane.
 *
 * A 50 ms timer enqueues `boundary()` into the session's parser lane
 * (`ctx.bridgeQueue` for Bridge, `ctx.parseQueue` for CaseView) only if tasks
 * ran since the last cut; the timer never reads parser state (DET-8). The
 * boundary re-reads `ctx.job.lineBuffer` every time, fingerprints every line,
 * diffs against the committed fingerprints, canonicalises the changed pages,
 * recomputes their digests and the root, increments `rev`, and publishes an
 * immutable Cut. There are no hooks and no hints: the full scan is the
 * equality check between the buffer and the committed pages (CM2, P3).
 *
 *   changed = { floor(i/nLines)+1 | fp[i] != committedFp[i] }
 *             ∪ (n != committedN ? { floor(min(n,committedN)/nLines)+1 } : ∅)
 *             ∪ pages a digest audit found stale
 *
 * Pages are canonical (canonical.ts), immutable and shared between cuts, so a
 * consumer (LAN broadcast, uplink round builder) reads a consistent set
 * without locking (§5.2).
 *
 * nLines is per session (default 25); every page computation honours it.
 *
 * PURITY: no I/O, no clock, no timers. The caller supplies the raw position.
 */
import {
  CanonicalLine,
  CanonicalPage,
  DEFAULT_LINES_PER_PAGE,
  assertLinesPerPage,
  canonicalLine,
  canonicalPage,
  pageCount,
  pageOfIndex,
} from './canonical';
import { assertFmt, pageDigest, rootDigest } from './digest';
import { lineFingerprint } from './fingerprint';
import { EDGE_FMT, RoundPage, RoundShrink, Sha256Hex } from './protocol';

/** A changed page in a cut: page number, digest, canonical lines. */
export type CutPage = RoundPage;

/**
 * One committed boundary (spec §5.2):
 * `{rev, prevTotal, totalLines, from, rawSeqThrough, rawHashThrough, shrink?, pages, root}`
 * plus the full state at this rev (`digests`, `allPages`) for consumers that
 * need pages the cut did not touch.
 */
export interface Cut {
  readonly nSesid: string;
  readonly fmt: number;
  readonly nLines: number;
  readonly rev: number;
  /** line count before this cut */
  readonly prevTotal: number;
  /** line count after this cut */
  readonly totalLines: number;
  /** lowest changed line index (the new total for a shrink that changed no line) */
  readonly from: number;
  readonly rawSeqThrough: number;
  readonly rawHashThrough: Sha256Hex;
  readonly shrink?: RoundShrink;
  /** changed pages that still exist, ascending */
  readonly pages: readonly CutPage[];
  /** changed line indices (< totalLines), ascending; an audited page counts all its lines */
  readonly changed: readonly number[];
  /** every page number in the changed set, ascending (may include dropped pages) */
  readonly changedPages: readonly number[];
  /** pages that existed before this cut and no longer do, ascending */
  readonly droppedPages: readonly number[];
  readonly root: Sha256Hex;
  /** digest of every page after this cut (index p-1 = page p) */
  readonly digests: readonly Sha256Hex[];
  /** every canonical page after this cut (index p-1 = page p) */
  readonly allPages: readonly CanonicalPage[];
}

/** The committed state at the cutter's current rev (what a round reads). */
export interface CutterView {
  readonly nSesid: string;
  readonly fmt: number;
  readonly nLines: number;
  readonly rev: number;
  readonly totalLines: number;
  readonly root: Sha256Hex;
  readonly digests: readonly Sha256Hex[];
  readonly pages: readonly CanonicalPage[];
  readonly rawSeqThrough: number;
  readonly rawHashThrough: Sha256Hex;
  /** the most recent shrink cause seen, for the round's shrink note */
  readonly lastShrinkCause?: string;
}

/** Checkpointable cutter state (§6.2 "Checkpoint": rev, root, pageState). JSON-safe. */
export interface CutterState {
  v: 1;
  nSesid: string;
  nLines: number;
  fmt: number;
  rev: number;
  totalLines: number;
  pages: unknown[][];
  digests: Sha256Hex[];
  root: Sha256Hex;
  rawSeqThrough: number;
  rawHashThrough: Sha256Hex;
  /** pages an audit marked stale that no boundary has re-cut yet */
  forcedPages: number[];
  lastShrinkCause?: string;
}

export interface CutterOptions {
  nSesid: string;
  /** lines per page (default 25) */
  nLines?: number;
  /** page format (default EDGE_FMT) */
  fmt?: number;
  /** raw position before the first record (genesis: seq 0 and the chain's h0) */
  rawSeqThrough?: number;
  rawHashThrough?: Sha256Hex;
}

/** The parts of a feed-parse SessionContext the boundary reads (structural; no import). */
export interface LaneContext {
  job: { lineBuffer: ArrayLike<unknown> | null | undefined };
  /** why the parser last dropped lines (R..E, D10, G, backspace), if it records it */
  lastShrinkCause?: string;
}

export interface AuditResult {
  /** pages compared against their committed digest */
  checkedPages: number;
  /** pages whose fresh digest differs although no fingerprint changed (fingerprint collision) */
  mismatchedPages: number[];
}

/** Thrown when a checkpointed state does not verify. */
export class CutterStateError extends Error {
  constructor(message: string) {
    super(`edge-sync: ${message}`);
    this.name = 'CutterStateError';
  }
}

const EMPTY: readonly never[] = Object.freeze([] as never[]);

export class PageCutter {
  readonly nSesid: string;
  readonly nLines: number;
  readonly fmt: number;

  private rev = 0;
  private committedN = 0;
  private committedFp: Float64Array = new Float64Array(0);
  private committedPages: readonly CanonicalPage[] = EMPTY;
  private committedDigests: readonly Sha256Hex[] = EMPTY;
  private root: Sha256Hex;
  private rawSeqThrough: number;
  private rawHashThrough: Sha256Hex;
  private lastShrinkCause?: string;
  private readonly forced = new Set<number>();

  constructor(opts: CutterOptions) {
    if (!opts || typeof opts.nSesid !== 'string' || !opts.nSesid) {
      throw new TypeError('edge-sync: PageCutter needs an nSesid');
    }
    this.nSesid = opts.nSesid;
    this.nLines = assertLinesPerPage(opts.nLines ?? DEFAULT_LINES_PER_PAGE);
    this.fmt = assertFmt(opts.fmt ?? EDGE_FMT);
    this.rawSeqThrough = opts.rawSeqThrough ?? 0;
    this.rawHashThrough = opts.rawHashThrough ?? '';
    this.root = rootDigest(this.nSesid, 0, EMPTY);
  }

  /** Rebuild a cutter from a checkpoint; digests and root are re-verified from the pages. */
  static restore(state: CutterState): PageCutter {
    if (!state || state.v !== 1) throw new CutterStateError('unknown cutter state version');
    const cutter = new PageCutter({
      nSesid: state.nSesid,
      nLines: state.nLines,
      fmt: state.fmt,
      rawSeqThrough: state.rawSeqThrough,
      rawHashThrough: state.rawHashThrough,
    });
    const n = state.totalLines;
    if (!Number.isSafeInteger(n) || n < 0) throw new CutterStateError(`bad totalLines ${n}`);
    if (!Array.isArray(state.pages) || state.pages.length !== pageCount(n, cutter.nLines)) {
      throw new CutterStateError(`page count ${state.pages?.length} does not hold ${n} lines`);
    }
    // Re-canonicalise (idempotent on canonical pages) so the restored pages are frozen
    // JSON and positions are checked, then rebuild the fingerprints from them.
    const flat: CanonicalLine[] = [];
    state.pages.forEach((page, k) => {
      const expected = k === state.pages.length - 1 ? n - k * cutter.nLines : cutter.nLines;
      if (!Array.isArray(page) || page.length !== expected) {
        throw new CutterStateError(`page ${k + 1} holds ${page?.length} lines, expected ${expected}`);
      }
      for (const line of page) flat.push(canonicalLine(line, flat.length));
    });
    const pages: CanonicalPage[] = [];
    for (let p = 1; p <= state.pages.length; p++) pages.push(canonicalPage(flat, p, n, cutter.nLines));
    const digests = pages.map(page => pageDigest(page, cutter.fmt));
    const root = rootDigest(cutter.nSesid, n, digests);
    if (root !== state.root) throw new CutterStateError('checkpoint root does not match its pages');
    cutter.rev = state.rev;
    cutter.committedN = n;
    cutter.committedPages = Object.freeze(pages);
    cutter.committedDigests = Object.freeze(digests);
    cutter.committedFp = new Float64Array(n);
    for (let i = 0; i < n; i++) cutter.committedFp[i] = lineFingerprint(flat[i]);
    cutter.root = root;
    cutter.lastShrinkCause = state.lastShrinkCause;
    for (const p of state.forcedPages || []) cutter.forced.add(p);
    return cutter;
  }

  /** Current rev (0 before the first cut). */
  get currentRev(): number {
    return this.rev;
  }

  get totalLines(): number {
    return this.committedN;
  }

  /**
   * Run one boundary over the parser's line buffer. Returns the new Cut, or
   * null when nothing changed (rev is then not incremented).
   *
   * `rawSeqThrough`/`rawHashThrough` are the journal position processed by the
   * lane so far; `shrinkCause` is recorded when the line count drops.
   */
  boundary(buf: ArrayLike<unknown>, rawSeqThrough: number, rawHashThrough: Sha256Hex, shrinkCause?: string): Cut | null {
    const nLines = this.nLines;
    const prevTotal = this.committedN;
    const n = buf.length;
    const fp = new Float64Array(n);
    const changed: number[] = [];
    const changedPages = new Set<number>();
    for (let i = 0; i < n; i++) {
      const f = lineFingerprint(buf[i]);
      fp[i] = f;
      if (i >= prevTotal || f !== this.committedFp[i]) {
        changed.push(i);
        changedPages.add(pageOfIndex(i, nLines));
      }
    }
    if (n !== prevTotal) changedPages.add(pageOfIndex(Math.min(n, prevTotal), nLines));

    const newPageCount = pageCount(n, nLines);
    const oldPageCount = this.committedPages.length;
    // Pages an audit marked stale join the cut with every line they hold.
    let forcedLines = false;
    for (const p of this.forced) {
      if (p > newPageCount) continue;
      changedPages.add(p);
      const end = Math.min(p * nLines, n);
      for (let i = (p - 1) * nLines; i < end; i++) changed.push(i);
      forcedLines = true;
    }
    if (!changedPages.size) return null;
    if (forcedLines) dedupeSortedInPlace(changed);

    const sortedPages = [...changedPages].sort((a, b) => a - b);
    const pages = this.committedPages.slice(0, newPageCount);
    const digests = this.committedDigests.slice(0, newPageCount);
    const cutPages: CutPage[] = [];
    for (const p of sortedPages) {
      if (p > newPageCount) continue;
      const page = canonicalPage(buf, p, n, nLines);
      const d = pageDigest(page, this.fmt);
      pages[p - 1] = page;
      digests[p - 1] = d;
      cutPages.push(Object.freeze({ p, d, lines: page }));
    }
    const droppedPages: number[] = [];
    for (let p = newPageCount + 1; p <= oldPageCount; p++) droppedPages.push(p);

    this.rev += 1;
    const root = rootDigest(this.nSesid, n, digests);
    const shrink: RoundShrink | undefined =
      n < prevTotal ? Object.freeze(shrinkCause ? { lines: prevTotal - n, cause: shrinkCause } : { lines: prevTotal - n }) : undefined;
    let from = changed.length ? changed[0] : Number.POSITIVE_INFINITY;
    if (n !== prevTotal) from = Math.min(from, Math.min(n, prevTotal));
    if (from === Number.POSITIVE_INFINITY) from = n;

    this.committedFp = fp;
    this.committedN = n;
    this.committedPages = Object.freeze(pages);
    this.committedDigests = Object.freeze(digests);
    this.root = root;
    this.rawSeqThrough = rawSeqThrough;
    this.rawHashThrough = rawHashThrough;
    if (shrink && shrinkCause) this.lastShrinkCause = shrinkCause;
    this.forced.clear();

    const cut: Cut = {
      nSesid: this.nSesid,
      fmt: this.fmt,
      nLines,
      rev: this.rev,
      prevTotal,
      totalLines: n,
      from,
      rawSeqThrough,
      rawHashThrough,
      ...(shrink ? { shrink } : {}),
      pages: Object.freeze(cutPages),
      changed: Object.freeze(changed),
      changedPages: Object.freeze(sortedPages),
      droppedPages: Object.freeze(droppedPages),
      root,
      digests: this.committedDigests,
      allPages: this.committedPages,
    };
    return Object.freeze(cut);
  }

  /**
   * The §6.2 boundary task as the lane runs it: re-read `ctx.job.lineBuffer`
   * (the parser replaces the array per keystroke, DET-8; never cache it) and
   * cut it. Enqueue this on ctx.bridgeQueue (Bridge) or ctx.parseQueue
   * (CaseView) so it runs after every chunk journaled through rawSeqThrough.
   */
  boundaryFromContext(ctx: LaneContext, rawSeqThrough: number, rawHashThrough: Sha256Hex): Cut | null {
    return this.boundary(ctx.job.lineBuffer || [], rawSeqThrough, rawHashThrough, ctx.lastShrinkCause);
  }

  /**
   * Digest audit (§6.2 "Audit", every 60 s and at every E and end; in-lane).
   * Recomputes the digest of every committed page whose lines all still have
   * their committed fingerprint, from a full canonicalisation of the buffer,
   * and compares it with the committed digest. A mismatch can only be a
   * fingerprint collision: the page is marked dirty so the next boundary
   * re-cuts it. The caller journals INCIDENT{AUDIT_MISMATCH} when
   * `mismatchedPages` is not empty. Pages with pending changes are skipped:
   * the next boundary cuts them anyway.
   */
  audit(buf: ArrayLike<unknown>): AuditResult {
    const nLines = this.nLines;
    const n = buf.length;
    const committedN = this.committedN;
    // The page holding the old/new end is pending whenever the count changed.
    const boundaryPage = n !== committedN ? pageOfIndex(Math.min(n, committedN), nLines) : 0;
    const mismatchedPages: number[] = [];
    let checkedPages = 0;
    for (let p = 1; p <= this.committedPages.length; p++) {
      if (p === boundaryPage || p > pageCount(n, nLines)) continue;
      const start = (p - 1) * nLines;
      const end = Math.min(p * nLines, committedN);
      let pending = false;
      for (let i = start; i < end; i++) {
        if (lineFingerprint(buf[i]) !== this.committedFp[i]) {
          pending = true;
          break;
        }
      }
      if (pending) continue;
      checkedPages += 1;
      const fresh = pageDigest(canonicalPage(buf, p, committedN, nLines), this.fmt);
      if (fresh !== this.committedDigests[p - 1]) {
        mismatchedPages.push(p);
        this.forced.add(p);
      }
    }
    return { checkedPages, mismatchedPages };
  }

  /**
   * Hello resume (§5.5, §4.7): `rev = max(rev, appliedRev) + 1`, so the next
   * round (and every later cut) is newer than anything the cloud applied.
   * Call only after the lineage checks pass. Returns the new rev.
   */
  advanceRev(appliedRev: number): number {
    const applied = Number.isFinite(appliedRev) ? appliedRev : 0;
    this.rev = Math.max(this.rev, applied) + 1;
    return this.rev;
  }

  /** The committed state at the current rev. */
  view(): CutterView {
    return Object.freeze({
      nSesid: this.nSesid,
      fmt: this.fmt,
      nLines: this.nLines,
      rev: this.rev,
      totalLines: this.committedN,
      root: this.root,
      digests: this.committedDigests,
      pages: this.committedPages,
      rawSeqThrough: this.rawSeqThrough,
      rawHashThrough: this.rawHashThrough,
      ...(this.lastShrinkCause ? { lastShrinkCause: this.lastShrinkCause } : {}),
    });
  }

  /** Checkpoint payload (JSON-safe; fingerprints are rebuilt on restore). */
  exportState(): CutterState {
    return {
      v: 1,
      nSesid: this.nSesid,
      nLines: this.nLines,
      fmt: this.fmt,
      rev: this.rev,
      totalLines: this.committedN,
      pages: this.committedPages as unknown[][],
      digests: [...this.committedDigests],
      root: this.root,
      rawSeqThrough: this.rawSeqThrough,
      rawHashThrough: this.rawHashThrough,
      forcedPages: [...this.forced].sort((a, b) => a - b),
      ...(this.lastShrinkCause ? { lastShrinkCause: this.lastShrinkCause } : {}),
    };
  }
}

function dedupeSortedInPlace(arr: number[]): void {
  arr.sort((a, b) => a - b);
  let w = 0;
  for (let r = 0; r < arr.length; r++) {
    if (r === 0 || arr[r] !== arr[r - 1]) arr[w++] = arr[r];
  }
  arr.length = w;
}
