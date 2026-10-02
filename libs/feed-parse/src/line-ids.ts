/**
 * DET-3 (spec rt-local-edge-spec.md §6.1): one line-id allocator, owned by
 * the lib. Before DET-3 the [6] line id came from the sink (`saveLine`
 * returned `id || nextId++`, restarting at 1 in every process) and a refresh
 * replacement line got `previous id + Math.random()` in [200, 1000]. So the
 * ids depended on the sink and on chance: two replays of one feed disagreed,
 * replacement ids collided with later sequential ids (two lines sharing one
 * [6]), and because sortArray breaks a timecode tie on [6], the ORDER of two
 * lines sharing a timecode could change from one run to the next.
 *
 * Now:
 *  - a new line gets `++job.idSeq * LINE_ID_STRIDE`, skipping any id already
 *    issued (allocLineId);
 *  - a refresh replacement line keeps the same-frame reuse rule (it takes the
 *    removed line's id) and otherwise gets
 *    `previous id + seededOffset(hash(nSesid, refreshCounter, index))`, an
 *    offset in [200, 1000], probed forward past every id already issued
 *    (allocRefreshId);
 *  - after every refresh, idSeq = max(idSeq, floor(maxIssued / 1e6) + 1), so
 *    a later new line's id exceeds every earlier id (ratchetIdSeq);
 *  - job.issuedIds holds every id ever issued in the lineage and travels with
 *    the job in every checkpoint. The sink's saveLine return value is ignored.
 *
 * Ids of sessions created before this change are small integers, below 1e6;
 * a restored buffer seeds issuedIds from its lines (ensureLineIdState), so the
 * probe steps over them.
 *
 * PURITY: no clock, no randomness, no I/O.
 */
import { FeedJob, SessionContext } from './session-context';

/** The stride between two new lines' ids (spec §6.1 DET-3). */
export const LINE_ID_STRIDE = 1e6;
/** The seeded offset range of a refresh replacement id above the previous line's id. */
export const REFRESH_OFFSET_MIN = 200;
export const REFRESH_OFFSET_MAX = 1000;

const isId = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v !== 0;

/** The highest id in the set, 0 when empty. */
function maxIssued(ids: Set<number>): number {
  let max = 0;
  for (const id of ids) if (id > max) max = id;
  return max;
}

/** True for a Set from any realm (v8.deserialize, a vm context or a worker can hand back a Set that fails instanceof). */
function isSetLike(v: unknown): v is Set<unknown> {
  return v instanceof Set || Object.prototype.toString.call(v) === '[object Set]';
}

/**
 * Makes sure the job carries a usable allocator state: an issuedIds Set and
 * an idSeq. A Set restored from a checkpoint (v8 structured clone) is kept
 * with every id in it, whatever realm it came from; an array becomes a Set;
 * anything else (a checkpoint restored through JSON turns a Set into {}, an
 * older checkpoint has none) starts empty.
 * When nothing was issued yet but the buffer already holds ids (a buffer
 * rehydrated from stored pages, a pre-DET-3 checkpoint), those ids are taken
 * as issued and idSeq moves to the smallest value whose next id,
 * (idSeq + 1) * 1e6, is above all of them, so no restored id is ever issued
 * again and a restored idSeq that is already past them is left exactly as it
 * was (a recovered lane must allocate what the uninterrupted one would).
 */
export function ensureLineIdState(job: FeedJob): void {
  const prior = job.issuedIds as unknown;
  if (!(prior instanceof Set)) {
    job.issuedIds = new Set<number>(isSetLike(prior) || Array.isArray(prior) ? [...(prior as Iterable<unknown>)].filter(isId) : []);
  }
  if (!Number.isSafeInteger(job.idSeq) || (job.idSeq as number) < 0) job.idSeq = 0;
  if (job.issuedIds!.size === 0 && Array.isArray(job.lineBuffer) && job.lineBuffer.length) {
    for (const line of job.lineBuffer) {
      if (Array.isArray(line) && isId(line[6])) job.issuedIds!.add(line[6]);
    }
    if (job.issuedIds!.size) {
      const floor = Math.floor(maxIssued(job.issuedIds!) / LINE_ID_STRIDE);
      if ((job.idSeq as number) < floor) job.idSeq = floor;
    }
  }
}

/** DET-3: the id of a new line. */
export function allocLineId(ctx: SessionContext): number {
  const job = ctx.job;
  ensureLineIdState(job);
  let id: number;
  do {
    job.idSeq = (job.idSeq as number) + 1;
    id = job.idSeq * LINE_ID_STRIDE;
  } while (job.issuedIds!.has(id));
  job.issuedIds!.add(id);
  return id;
}

/** FNV-1a, 32 bit: a stable string hash (the seed of a refresh offset). */
export function fnv1a32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** DET-3: the offset in [200, 1000] of replacement line `index` of refresh `refreshCounter` (was Math.random). */
export function seededOffset(nSesid: string, refreshCounter: number, index: number): number {
  const span = REFRESH_OFFSET_MAX - REFRESH_OFFSET_MIN + 1;
  return REFRESH_OFFSET_MIN + (fnv1a32(`${nSesid}|${refreshCounter}|${index}`) % span);
}

/**
 * DET-3: the id of refresh replacement line `index` that does not reuse a
 * removed line's id: `prevId + seededOffset(...)`, probed forward past every
 * issued id. `prevId` is the id of the line before it (the line before the
 * window, or the previous replacement line). When there is no usable previous
 * id (the window starts before every line, so the previous "line" is the
 * empty line-0 slot), the line gets a new line's id instead, exactly as the
 * sink's `id || nextId++` used to give it the next sequential id.
 */
export function allocRefreshId(ctx: SessionContext, prevId: unknown, index: number): number {
  const job = ctx.job;
  ensureLineIdState(job);
  if (typeof prevId !== 'number' || !Number.isFinite(prevId)) return allocLineId(ctx);
  let id = prevId + seededOffset(ctx.nSesid, ctx.refreshCounter, index);
  while (job.issuedIds!.has(id)) id++;
  job.issuedIds!.add(id);
  return id;
}

/** Records an id as issued (an id IdentityFix chose). Returns false when it was issued before. */
export function noteIssuedId(job: FeedJob, id: number): boolean {
  ensureLineIdState(job);
  if (job.issuedIds!.has(id)) return false;
  job.issuedIds!.add(id);
  return true;
}

/** DET-3: after a refresh, idSeq = max(idSeq, floor(maxIssued / 1e6) + 1) (spec §6.1, literally). */
export function ratchetIdSeq(job: FeedJob): void {
  if (!isSetLike(job.issuedIds) || !job.issuedIds.size) return;
  const floor = Math.floor(maxIssued(job.issuedIds as Set<number>) / LINE_ID_STRIDE) + 1;
  if (!Number.isSafeInteger(job.idSeq) || (job.idSeq as number) < floor) job.idSeq = floor;
}
