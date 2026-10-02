/**
 * DET-12 (spec rt-local-edge-spec.md §6.1): start a parser context from pages
 * instead of from the raw bytes, for failover, re-binding and a parser-version
 * change. Rev 3: its failover and re-bind uses are Phase 4 (D1); its
 * recovery-time uses (§6.2 steps 2 and 4) are open for v1 (O-1), and the v1
 * build default is "no REBASE anywhere" (build-decisions O-1). It is here, pure
 * and tested, for the phase that wires it; nothing calls it yet.
 *
 * What the context holds afterwards:
 *  - lineBuffer: deep, mutable copies of the pages' lines in order (canonical
 *    pages are frozen; the parser writes into tuples);
 *  - the cursor on the last line: lineCount = last index; crLine = a COPY of
 *    the last line's text, so the next keystrokes extend that line instead of
 *    overwriting it; timecode, format, CAT page and CAT line from that line;
 *  - fresh framing; any refresh window closed;
 *  - issuedIds = every [6] in the pages plus `anchorIds` (ids LAN marks still
 *    point at, though their lines are gone), so none is ever issued again;
 *    idSeq = floor(max(issuedIds) / 1e6) + 1 (0 when there is none);
 *  - CaseView: globalBuffer rebuilt from the text, so a backspace after the
 *    rebase steps back exactly as it would after the same text typed cleanly
 *    (a live buffer can differ after a backspace across a break, a quirk the
 *    pages do not record).
 * The caller journals REBASE_BEGIN / REBASE_END and takes a synchronous
 * checkpoint straight after (spec §6.2); the lib does no I/O. Run it in-lane
 * (enqueueBoundary) so no queued chunk work interleaves.
 */
import { createFramingState, SessionContext } from './session-context';
import { LINE_ID_STRIDE } from './line-ids';
import { copyTuple } from './tuple-copy';

export interface RebaseResult {
  lines: number;
  idSeq: number;
  issuedIds: number;
}

const isId = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v !== 0;

export function rebaseContext(ctx: SessionContext, pages: ReadonlyArray<ReadonlyArray<unknown>>, anchorIds: ReadonlyArray<number> = []): RebaseResult {
  const job = ctx.job;
  const buffer: any[] = [];
  for (const page of pages || []) {
    for (const line of page || []) buffer.push(Array.isArray(line) ? copyTuple(line) : []);
  }

  job.lineBuffer = buffer;
  job.lineCount = Math.max(0, buffer.length - 1);
  const last = buffer.length ? buffer[buffer.length - 1] : null;
  job.crLine = Array.isArray(last) && Array.isArray(last[1]) ? last[1].slice() : [];
  if (Array.isArray(last) && last.length) {
    job.currentTimestamp = last[0] ?? null;
    if (ctx.protocol === 'B') {
      job.currentFormat = last[3] ?? null;
      job.currentPage = last[4] ?? job.currentPage;
      job.currentLineNumber = last[5] ?? job.currentLineNumber;
    }
  }

  // a fresh framing state and no open refresh window
  ctx.framing = createFramingState();
  job.isRefresh = false;
  job.relaceLines = [];
  job.refreshTimeStamp = [];
  job.oldLineData = [];
  (job as any).frameCarry = '';

  // CaseView: the backspace path reads globalBuffer ([byte, line index] per
  // surviving typed byte, the line break included)
  job.globalBuffer = [];
  if (ctx.protocol === 'C') {
    buffer.forEach((line, i) => {
      const text = Array.isArray(line) && Array.isArray(line[1]) ? line[1] : [];
      for (const c of text) job.globalBuffer.push([c, i]);
      if (i < buffer.length - 1) job.globalBuffer.push([10, i]);
    });
  }

  // DET-3 ids: nothing in the pages, and no anchor, is ever issued again
  const issued = new Set<number>();
  for (const line of buffer) if (Array.isArray(line) && isId(line[6])) issued.add(line[6]);
  for (const id of anchorIds || []) if (isId(id)) issued.add(id);
  let max = 0;
  for (const id of issued) if (id > max) max = id;
  job.issuedIds = issued;
  job.idSeq = issued.size ? Math.floor(max / LINE_ID_STRIDE) + 1 : 0;

  return { lines: buffer.length, idSeq: job.idSeq, issuedIds: issued.size };
}
