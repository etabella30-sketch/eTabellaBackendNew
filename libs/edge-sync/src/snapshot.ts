/**
 * The shared `previous-data` snapshot builder (spec §5.8 "Snapshots", ledger
 * D11 + D12).
 *
 * One pure helper turns stored pages + {nSesid, tab, qFacts, qMarks} into the
 * `previous-data` payloads a viewer's `fetch-data` receives. The cloud memory
 * path (apps/realtime-server feed-data.service.ts streamSessionData) and the
 * box LAN gateway both use it, so a room reader and a remote reader get the
 * same pages in the same order. The disk path in libs/global
 * (stream-data.service.ts, shared with the legacy apps/realtime lane) is
 * untouched; it already sends newest-first.
 *
 * Every payload field is byte-identical to what streamSessionData emits today
 * (feed-data.service.ts:536-571):
 *   { msg: 1, page, data: JSON.stringify(page || []), totalPages, nSesid, a, h, tab }
 * with `totalPages` = the number of pages held (not the highest page number),
 * `a` = the qFacts whose pageIndex is the page, `h` = the qMarks whose cPageno
 * is the page (one try around both, as today: a throw leaves the rest empty).
 *
 * The one intended change (D12): pages go out NEWEST-FIRST, by an explicit
 * numeric sort on the page number (highest first). Today's memory path sorts
 * `[key, value]` pairs with Number(pair) = NaN, a no-op that left them
 * ascending. Keys that are not numbers keep their relative order after every
 * numbered page.
 *
 * The caller emits each payload to the asking socket, yields to the event loop
 * between pages (setImmediate, no timer), then sends `previous-data-end`
 * (snapshotEnd). An optional `rev` (D20) is appended to every payload only
 * when given, so the default output stays byte-identical.
 *
 * PURITY: no I/O.
 */

/** One `previous-data` payload of a fetch-data snapshot. */
export interface PreviousDataPayload {
  msg: 1;
  page: number;
  data: string;
  totalPages: number;
  nSesid: string;
  a: unknown[];
  h: unknown[];
  tab: unknown;
  rev?: number;
}

/** Payload of `previous-data-end`: every page there was has been sent. */
export interface PreviousDataEndPayload {
  nSesid: string;
  tab: unknown;
}

/** Pages keyed by page number: a Map (box) or the memory store's record (cloud). */
export type SnapshotPages =
  | ReadonlyMap<number | string, readonly unknown[] | null | undefined>
  | Readonly<Record<string, readonly unknown[] | null | undefined>>;

export interface SnapshotOptions {
  nSesid: string;
  /** the fetch token the viewer sent (echoed on every page) */
  tab?: unknown;
  /** quick facts of the session (filtered per page by pageIndex) */
  qFacts?: readonly any[] | null;
  /** quick marks of the session (filtered per page by cPageno) */
  qMarks?: readonly any[] | null;
  /** D20: tag every page with the store's rev (omit for today's exact payload) */
  rev?: number;
}

/** Build the snapshot payloads, newest page first. Empty input → []. */
export function buildSnapshot(pages: SnapshotPages, opts: SnapshotOptions): PreviousDataPayload[] {
  const entries: Array<[string | number, readonly unknown[] | null | undefined]> =
    pages instanceof Map ? [...pages.entries()] : Object.entries((pages || {}) as Record<string, readonly unknown[]>);
  if (!entries.length) return [];
  entries.sort(newestFirst);

  const qFacts = opts.qFacts as any[] | null | undefined;
  const qMarks = opts.qMarks as any[] | null | undefined;
  const out: PreviousDataPayload[] = [];
  for (const x of entries) {
    const pg = Number(x[0]);
    const pageData = x[1] || [];
    const aDATA: unknown[] = [];
    const hDATA: unknown[] = [];
    try {
      if (qFacts) {
        aDATA.push(...qFacts.filter(a => Number(a.pageIndex) === pg));
      }
      if (qMarks) {
        hDATA.push(...qMarks.filter(a => Number(a.cPageno) === pg));
      }
    } catch (error) {
      // as today: a malformed fact/mark list leaves this page's a/h as far as they got
    }
    const payload: PreviousDataPayload = {
      msg: 1,
      page: pg,
      data: JSON.stringify(pageData || []),
      totalPages: entries.length,
      nSesid: opts.nSesid,
      a: aDATA,
      h: hDATA,
      tab: opts.tab,
    };
    if (opts.rev !== undefined) payload.rev = opts.rev;
    out.push(payload);
  }
  return out;
}

/** The `previous-data-end` payload for a fetch. */
export function snapshotEnd(nSesid: string, tab: unknown): PreviousDataEndPayload {
  return { nSesid, tab };
}

/** Box pages (index p-1 = page p) as the Map buildSnapshot takes. */
export function pagesFromList(allPages: readonly (readonly unknown[])[]): Map<number, readonly unknown[]> {
  const map = new Map<number, readonly unknown[]>();
  allPages.forEach((page, k) => map.set(k + 1, page));
  return map;
}

function newestFirst(x: [string | number, unknown], y: [string | number, unknown]): number {
  const a = Number(x[0]);
  const b = Number(y[0]);
  const aNaN = Number.isNaN(a);
  const bNaN = Number.isNaN(b);
  if (aNaN || bNaN) return aNaN === bNaN ? 0 : aNaN ? 1 : -1;
  return b - a;
}
