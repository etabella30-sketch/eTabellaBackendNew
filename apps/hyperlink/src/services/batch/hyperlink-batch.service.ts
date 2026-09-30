import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue } from 'bull';
import { randomBytes } from 'crypto';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from '../utility/utility.service';
import { HyperlinksearchService } from '../hyperlinksearch/hyperlinksearch.service';
import { hyperlinkFailedEntry, hyperlinkFiles, hyperlinkProcess } from '../../interfaces/hyperlink.interface';

/**
 * Hyperlink batch bookkeeping (v2 orchestration, see DESIGN_V2.md §2).
 *
 * A batch = one starthyperlink request = one bundle / one file / one whole
 * section. Its state lives in Redis:
 *
 *   HYPERLINK/<master>/<case>/<section>/<scope>   progress snapshot (JSON
 *       hyperlinkProcess) -- the key the frontend already reads. While it
 *       holds cStatus 'P' the scope is running.
 *   HYPERLINK-BATCH/<batchId>                    hash: total, done, failed,
 *       cancelled, finalized, notified, enqueued, enqueueDone, owner, run,
 *       dStart. `owner` is the progress key of the admin who started the
 *       batch: the LOCK is taken on this hash (batchId has no nMasterid), so
 *       a second admin starting the same scope is rejected as well.
 *   HYPERLINK-BATCH/<batchId>/seen               set of nBundledetailid already
 *       counted (a Bull retry / stalled re-run never double counts)
 *   HYPERLINK-BATCH/<batchId>/failed             list of JSON failed entries
 *
 * Per-file accounting is ONE Lua script: SADD seen -> HINCRBY done|failed ->
 * snapshot written to the progress key (with the final C/F status and the done
 * TTL when this was the last file). Only the caller that receives fin == 1
 * finalizes (notification); the counters can never go backwards because the
 * snapshot is produced inside the same atomic script. Once the hash says
 * finalized (finish() by the orchestrator / stale check / cancel, or the Lua
 * itself) the progress key is never touched again by a file job.
 *
 * Configuration (ConfigService keys, defaults in code):
 *   HYPERLINK_BATCH_TTL_SEC  172800  TTL of every batch key, refreshed per file
 *   HYPERLINK_DONE_TTL_SEC      900  how long a finished batch stays visible
 *   HYPERLINK_STALE_MIN          90  a 'P' key not updated for this long, with
 *                                    no file jobs left in the queue, is dead
 */
@Injectable()
export class HyperlinkBatchService {
  private readonly logApp = 'hyperlink';
  /** batchId -> last socket emit (ms); emits are throttled to 1/s per batch */
  private readonly lastEmit = new Map<string, number>();

  constructor(
    private readonly config: ConfigService,
    private readonly rds: RedisDbService,
    private readonly db: DbService,
    private readonly logService: LogService,
    private readonly utility: UtilityService,
    private readonly search: HyperlinksearchService,
  ) { }

  // ---------------------------------------------------------------- config --

  private num(key: string, def: number): number {
    const v = Number(this.config.get(key));
    return Number.isFinite(v) && v > 0 ? v : def;
  }
  get batchTtlSec(): number { return this.num('HYPERLINK_BATCH_TTL_SEC', 172800); }
  get doneTtlSec(): number { return this.num('HYPERLINK_DONE_TTL_SEC', 900); }
  get staleMin(): number { return this.num('HYPERLINK_STALE_MIN', 90); }
  get workers(): number { return Math.max(1, Math.floor(this.num('HYPERLINK_WORKERS', 3))); }
  /** Bull backoff between the two attempts of a file job (only spawn failures are retried). */
  get fileBackoffMs(): number { return this.num('HYPERLINK_FILE_BACKOFF_MS', 30000); }
  /**
   * While a python runs, the file job polls the batch hash this often (default
   * 5 s) and kills the child when the batch was cancelled or superseded by a
   * new run. This is what makes cancel work across pm2 instances (the
   * in-flight registry is per process, so the instance that served
   * POST /cancelhyperlink can only kill its own pythons directly).
   */
  get cancelPollMs(): number { return this.num('HYPERLINK_CANCEL_POLL_MS', 5000); }
  /**
   * Fair share of the file queue between batches of the same priority class:
   * the file jobs of a batch are added in slices of this many files with a
   * priority that grows per slice, so a bundle started behind a large one
   * gets its first slice served after the running batch's CURRENT slice
   * instead of after its last file (Bull is FIFO within one priority).
   * 0 = strict FIFO per batch.
   */
  get fairChunk(): number {
    const v = Number(this.config.get('HYPERLINK_FAIR_CHUNK'));
    return Number.isFinite(v) && v >= 0 ? Math.floor(v) : 100;
  }
  /**
   * An orchestrator whose enqueue progress (hash.enqueueAt, refreshed per
   * chunk) is older than this is dead; a re-run of the bundle job takes the
   * enqueue over instead of waiting for it.
   */
  get enqueueStaleMs(): number { return this.num('HYPERLINK_ENQUEUE_STALE_MS', 15000); }

  /**
   * Bull priority of the file job at position `index` of a scope (lower =
   * sooner): class 1 single file / 5 bundle / 10 whole section (x 1000), plus
   * the fair-share slice number (see fairChunk) so batches of one class
   * interleave slice by slice instead of running strictly one after another.
   */
  priorityOf(body: { nBundleid?: string; nBundledetailid?: string }, index = 0): number {
    const klass = body.nBundledetailid ? 1 : body.nBundleid ? 5 : 10;
    const chunk = this.fairChunk;
    const slice = chunk > 0 ? Math.min(999, Math.floor(Math.max(0, index) / chunk)) : 0;
    return klass * 1000 + slice;
  }

  // ------------------------------------------------------------------ keys --

  /** scope of a request: single file > bundle > whole section */
  scopeOf(body: { nBundleid?: string; nBundledetailid?: string }): string {
    return body.nBundledetailid || body.nBundleid || 'all';
  }
  batchIdFor(body: { nCaseid: string; nSectionid: string; nBundleid?: string; nBundledetailid?: string }): string {
    return `${body.nCaseid}:${body.nSectionid}:${this.scopeOf(body)}`;
  }
  progressKeyFor(body: { nMasterid?: string; nCaseid: string; nSectionid: string; nBundleid?: string; nBundledetailid?: string }): string {
    return `HYPERLINK/${body.nMasterid}/${body.nCaseid}/${body.nSectionid}/${this.scopeOf(body)}`;
  }
  /** every progress key of a section, any admin, any scope */
  sectionKeyPattern(body: { nCaseid: string; nSectionid: string }): string {
    return `HYPERLINK/*/${body.nCaseid}/${body.nSectionid}/*`;
  }
  hashKey(batchId: string): string { return `HYPERLINK-BATCH/${batchId}`; }
  seenKey(batchId: string): string { return `HYPERLINK-BATCH/${batchId}/seen`; }
  failedKey(batchId: string): string { return `HYPERLINK-BATCH/${batchId}/failed`; }
  /**
   * Set of the nBundledetailid the current run enqueued (written right before
   * each addBulk chunk). It is the batch's EXPECTED set: cancel removes the
   * file jobs by id from it (no keyspace SCAN) and the overlap check answers
   * "does this running bundle contain file X" from it.
   */
  jobsKey(batchId: string): string { return `HYPERLINK-BATCH/${batchId}/jobs`; }
  private batchKeys(batchId: string): string[] { return [this.hashKey(batchId), this.seenKey(batchId), this.failedKey(batchId), this.jobsKey(batchId)]; }
  /** Bull job id of a file job; the run token keeps two runs of one scope apart. */
  fileJobId(batchId: string, run: string, nBundledetailid: string): string { return `${batchId}:${run}:${nBundledetailid}`; }
  /** prefix shared by every file job of a batch (any run) */
  fileJobPrefix(batchId: string): string { return `${batchId}:`; }

  // ------------------------------------------------------------- snapshots --

  async readSnapshot(progressKey: string): Promise<hyperlinkProcess | null> {
    try {
      const raw = await this.rds.getValue(progressKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  /** Write a snapshot with the given TTL and push it to the frontend (forced emit). */
  async writeSnapshot(snapshot: hyperlinkProcess, ttlSec: number, emit = true): Promise<hyperlinkProcess> {
    snapshot.dUpdate = new Date().toISOString();
    await this.rds.setValue(snapshot.queueName, JSON.stringify(snapshot), ttlSec);
    if (emit) this.emitSnapshot(snapshot, true);
    return snapshot;
  }

  /**
   * KEYS: progressKey, hash, failedList   ARGV: body, ttl, run, onlyIfEmpty
   * SET the progress key only while the batch is still running: the hash still
   * belongs to `run`, is neither finalized nor cancelled and the key (if any)
   * still says 'P'. The counters of the body are replaced by the hash's
   * done/failed so a late write can never make the popup go backwards. With
   * onlyIfEmpty == '1' the write is skipped once the key already shows a
   * total (used by the orchestrator's re-add path). Returns the written body
   * or '' when nothing was written.
   */
  private static readonly WRITE_IF_RUNNING_LUA = `
local run = redis.call('HGET', KEYS[2], 'run')
if ARGV[3] ~= '' and (not run or run ~= ARGV[3]) then return '' end
if redis.call('HGET', KEYS[2], 'finalized') == '1' or redis.call('HGET', KEYS[2], 'cancelled') == '1' then return '' end
local v = redis.call('GET', KEYS[1])
if v then
  local ok, cur = pcall(cjson.decode, v)
  if ok and type(cur) == 'table' then
    if cur.cStatus ~= 'P' then return '' end
    if ARGV[4] == '1' and tonumber(cur.nTotal or 0) > 0 then return '' end
  end
end
local snap = cjson.decode(ARGV[1])
snap.nCompleted = tonumber(redis.call('HGET', KEYS[2], 'done') or '0') or 0
local f = tonumber(redis.call('HGET', KEYS[2], 'failed') or '0') or 0
snap.nFailed = f
snap.jFailed = nil
snap.nFailedTruncated = nil
local list = redis.call('LRANGE', KEYS[3], 0, -1)
local rev = {}
for i = #list, 1, -1 do rev[#rev + 1] = list[i] end
local trunc = 'false'
if f > 200 then trunc = 'true' end
local body = string.sub(cjson.encode(snap), 1, -2) .. ',"jFailed":[' .. table.concat(rev, ',') .. '],"nFailedTruncated":' .. trunc .. '}'
redis.call('SET', KEYS[1], body, 'EX', tonumber(ARGV[2]))
return body`;

  /**
   * Snapshot write that is a no-op once the batch is finished / cancelled /
   * taken over by a newer run (returns false then). Counters and the failed
   * list come from the batch keys, not from the caller.
   */
  async writeSnapshotIfRunning(snapshot: hyperlinkProcess, ttlSec: number, emit = true, run = '', onlyIfEmpty = false): Promise<boolean> {
    snapshot.dUpdate = new Date().toISOString();
    const body = String(await this.rds.eval(HyperlinkBatchService.WRITE_IF_RUNNING_LUA,
      [snapshot.queueName, this.hashKey(snapshot.batchId), this.failedKey(snapshot.batchId)],
      [JSON.stringify(snapshot), ttlSec, run, onlyIfEmpty ? '1' : '0']) || '');
    if (!body) return false;
    let written: hyperlinkProcess = snapshot;
    try { written = JSON.parse(body); } catch (error) { written = snapshot; }
    if (emit) this.emitSnapshot(written, true);
    return true;
  }

  /** Socket event HYPERLINK-RESPONCE, throttled to one per second per batch unless forced. */
  emitSnapshot(snapshot: hyperlinkProcess, force = false): boolean {
    const id = snapshot.batchId || snapshot.queueName;
    const now = Date.now();
    const last = this.lastEmit.get(id) || 0;
    if (!force && now - last < 1000) return false;
    if (this.lastEmit.size > 500) {
      // batches that never reached a terminal state in this process: drop stale throttle entries
      for (const [k, t] of this.lastEmit) if (now - t > 3600000) this.lastEmit.delete(k);
    }
    this.lastEmit.set(id, now);
    try {
      this.utility.emit({ event: 'HYPERLINK-RESPONCE', data: snapshot });
    } catch (error) {
      this.logService.info(`emit failed for ${snapshot.queueName}: ${error?.message}`, this.logApp);
    }
    return true;
  }

  // ------------------------------------------------------------ lifecycle --

  /**
   * Short per-section mutex around starthyperlink's check-then-create: two
   * overlapping requests of one section arriving in the same instant (a
   * bundle and one of its files, from any instance) would otherwise both pass
   * the overlap check before either progress key exists. SET NX PX; the
   * caller releases it right after createBatch. Returns the token or null
   * when the section stayed busy for `waitMs`.
   */
  sectionLockKey(body: { nCaseid: string; nSectionid: string }): string { return `HYPERLINK-SECTION-LOCK/${body.nCaseid}/${body.nSectionid}`; }

  async lockSection(body: { nCaseid: string; nSectionid: string }, waitMs = 3000, ttlMs = 10000): Promise<string | null> {
    const key = this.sectionLockKey(body);
    const token = randomBytes(6).toString('hex');
    const deadline = Date.now() + waitMs;
    for (; ;) {
      const got = await this.rds.eval(`return redis.call('SET', KEYS[1], ARGV[1], 'NX', 'PX', ARGV[2])`, [key], [token, ttlMs]);
      if (got) return token;
      if (Date.now() >= deadline) return null;
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async unlockSection(body: { nCaseid: string; nSectionid: string }, token: string): Promise<void> {
    try {
      await this.rds.eval(`if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0`, [this.sectionLockKey(body)], [token]);
    } catch (error) { /* the PX TTL releases it */ }
  }

  /**
   * The snapshot that currently holds the batch, if any: the caller's own
   * progress key, or the key of whichever admin started the batch (hash.owner).
   */
  async findRunning(batchId: string, myKey: string): Promise<hyperlinkProcess | null> {
    const mine = await this.readSnapshot(myKey);
    if (mine && mine.cStatus === 'P') return mine;
    const hash = await this.getBatch(batchId);
    if (hash && hash.owner && hash.owner !== myKey && hash.finalized !== '1') {
      const theirs = await this.readSnapshot(hash.owner);
      if (theirs && theirs.cStatus === 'P') return theirs;
    }
    return null;
  }

  /**
   * Running batches of the same section whose files overlap with a request:
   * the whole section vs anything, a bundle vs one of its files (either way,
   * when the request / snapshot carries nBundleid), the same file. Legacy
   * index keys (no batchId) are ignored. Stale ones are released, not reported.
   */
  async findConflicts(body: { nCaseid: string; nSectionid: string; nBundleid?: string; nBundledetailid?: string }, batchId: string, fileQueue: Queue, bundleQueue?: Queue): Promise<hyperlinkProcess[]> {
    const out: hyperlinkProcess[] = [];
    const myScope = this.scopeOf(body);
    let keys: string[] = [];
    try { keys = await this.rds.scanKeys(this.sectionKeyPattern(body)); } catch (error) { keys = []; }
    for (const k of keys) {
      const s = await this.readSnapshot(k);
      if (!s || s.cStatus !== 'P' || !s.batchId) continue;
      const theirScope = this.scopeOf(s);
      let overlap = s.batchId === batchId || theirScope === 'all' || myScope === 'all';
      if (!overlap && s.nBundleid && body.nBundleid && s.nBundleid === body.nBundleid) overlap = true;      // bundle vs one of its files
      if (!overlap && s.nBundledetailid && body.nBundledetailid && s.nBundledetailid === body.nBundledetailid) overlap = true;
      // a single-file request that does not say which bundle the file belongs
      // to (the frontend's bundlemanagement passes nBundleid null for single
      // files, so this is the normal case): ask the running bundle's expected set;
      // while that bundle is still loading its files (set not complete) be
      // conservative rather than scan the file twice at once
      if (!overlap && body.nBundledetailid && !body.nBundleid && s.nBundleid && !s.nBundledetailid) {
        overlap = (await this.expectsFile(s.batchId, body.nBundledetailid)) !== 'no';
      }
      // the reverse: a running single-file batch that did not say its bundle
      // vs a bundle request of the section -> conservative conflict
      if (!overlap && s.nBundledetailid && !s.nBundleid && body.nBundleid && !body.nBundledetailid) overlap = true;
      if (!overlap) continue;
      if (await this.isStale(s, fileQueue, bundleQueue)) {
        this.logService.info(`Hyperlink batch ${s.batchId} is stale (last update ${s.dUpdate}), releasing`, this.logApp);
        console.log(`Hyperlink batch ${s.batchId} is stale (last update ${s.dUpdate}), releasing`);
        await this.finish(s, 'F', 'stale');
        continue;
      }
      out.push(s);
    }
    return out;
  }

  /**
   * KEYS: progressKey, hash, seen, failed   ARGV: snapshotJson, ttl, run, nowIso
   * Take the batch lock atomically: refused (0) when the caller's key or the
   * key of the admin who owns the batch (hash.owner) still says 'P'.
   * Otherwise the progress key is written, the accounting keys reset and the
   * hash re-created with a new run token.
   */
  private static readonly ACQUIRE_LUA = `
local function running(k)
  local v = redis.call('GET', k)
  if not v then return false end
  local ok, cur = pcall(cjson.decode, v)
  return ok and type(cur) == 'table' and cur.cStatus == 'P'
end
if running(KEYS[1]) then return 0 end
local owner = redis.call('HGET', KEYS[2], 'owner')
if owner and owner ~= KEYS[1] and redis.call('HGET', KEYS[2], 'finalized') ~= '1' and running(owner) then return 0 end
redis.call('SET', KEYS[1], ARGV[1], 'EX', tonumber(ARGV[2]))
redis.call('DEL', KEYS[2], KEYS[3], KEYS[4], KEYS[5])
redis.call('HMSET', KEYS[2], 'total', '0', 'done', '0', 'failed', '0', 'cancelled', '0', 'owner', KEYS[1], 'run', ARGV[3], 'dStart', ARGV[4])
redis.call('EXPIRE', KEYS[2], tonumber(ARGV[2]))
return 1`;

  /**
   * Create a batch: lock (progress key 'P' + hash), reset the accounting
   * keys, write the hash. Returns the run token or null when the scope is
   * already running (by any admin).
   */
  async createBatch(snapshot: hyperlinkProcess): Promise<string | null> {
    const batchId = snapshot.batchId;
    const run = randomBytes(6).toString('hex');
    const nowIso = new Date().toISOString();
    snapshot.cStatus = 'P';
    snapshot.nTotal = 0; snapshot.nCompleted = 0; snapshot.nFailed = 0;
    snapshot.dStart = nowIso; snapshot.dUpdate = nowIso;
    snapshot.jFailed = []; snapshot.nFailedTruncated = false;
    // NOTE: `enqueued`, `enqueueDone`, `finalized` and `notified` are claimed
    // with HSETNX later on, so the Lua must NOT pre-populate them.
    const got = await this.rds.eval(HyperlinkBatchService.ACQUIRE_LUA,
      [snapshot.queueName, ...this.batchKeys(batchId)],
      [JSON.stringify(snapshot), this.batchTtlSec, run, nowIso]);
    if (Number(got) !== 1) return null;
    this.lastEmit.delete(batchId);
    return run;
  }

  async getBatch(batchId: string): Promise<Record<string, string>> {
    return await this.rds.hgetall(this.hashKey(batchId));
  }

  async isCancelled(batchId: string): Promise<boolean> {
    return (await this.rds.hget(this.hashKey(batchId), 'cancelled')) === '1';
  }

  /**
   * Orchestrator step: claim the enqueue for `run`. Returns 'first' for the
   * run that has to enqueue, 'done' when a previous orchestrator run of the
   * SAME batch run already enqueued everything (or the batch is finished),
   * 'inflight' when another orchestrator run is enqueueing right now, or
   * 'stale' when the hash meanwhile belongs to a newer run of the scope
   * (cancel + restart while this orchestrator was inside hyperlink_getfiles):
   * the caller must then do nothing at all -- the new run owns the batch.
   */
  async claimEnqueue(batchId: string, total: number, run: string): Promise<'first' | 'done' | 'inflight' | 'stale'> {
    const claimed = await this.rds.eval(
      `local run = redis.call('HGET', KEYS[1], 'run')
       if not run or run ~= ARGV[2] then return 3 end
       if redis.call('HGET', KEYS[1], 'finalized') == '1' or redis.call('HGET', KEYS[1], 'cancelled') == '1' then return 2 end
       if redis.call('HSETNX', KEYS[1], 'enqueued', '1') == 1 then redis.call('HSET', KEYS[1], 'total', ARGV[1]); redis.call('HSET', KEYS[1], 'enqueueAt', ARGV[3]); return 1 end
       if redis.call('HGET', KEYS[1], 'enqueueDone') == '1' then return 2 end
       return 0`,
      [this.hashKey(batchId)], [total, run, Date.now()]);
    const n = Number(claimed);
    return n === 1 ? 'first' : n === 2 ? 'done' : n === 3 ? 'stale' : 'inflight';
  }
  /**
   * Record the file ids of a chunk BEFORE its addBulk (the expected set). A
   * no-op when the hash meanwhile belongs to another run.
   */
  async recordJobs(batchId: string, run: string, ids: string[]): Promise<boolean> {
    if (!ids.length) return true;
    // a batch that reached a terminal state meanwhile (cancel during the
    // enqueue) keeps the done TTL: never re-arm the 48 h TTL on it
    return Number(await this.rds.eval(
      `if redis.call('HGET', KEYS[1], 'run') ~= ARGV[1] then return 0 end
       redis.call('SADD', KEYS[2], unpack(ARGV, 5))
       local ttl = tonumber(ARGV[2])
       if redis.call('HGET', KEYS[1], 'finalized') == '1' or redis.call('HGET', KEYS[1], 'cancelled') == '1' then ttl = tonumber(ARGV[3]) end
       redis.call('EXPIRE', KEYS[2], ttl)
       redis.call('HSET', KEYS[1], 'enqueueAt', ARGV[4])
       return 1`,
      [this.hashKey(batchId), this.jobsKey(batchId)], [run, this.batchTtlSec, this.doneTtlSec, Date.now(), ...ids])) === 1;
  }

  /** nBundledetailid already counted by this batch (any outcome). */
  async seenIds(batchId: string): Promise<string[]> {
    try { return (await this.rds.getsmembers(this.seenKey(batchId))) || []; } catch (error) { return []; }
  }

  /**
   * Does the running batch contain this file? 'yes' / 'no' from the expected
   * set once the orchestrator handed over (enqueueDone); 'unknown' while the
   * files are still being loaded / enqueued (callers treat it as a conflict).
   */
  async expectsFile(batchId: string, nBundledetailid: string): Promise<'yes' | 'no' | 'unknown'> {
    const n = Number(await this.rds.eval(
      `if redis.call('HGET', KEYS[1], 'enqueueDone') ~= '1' then return 2 end
       return redis.call('SISMEMBER', KEYS[2], ARGV[1])`,
      [this.hashKey(batchId), this.jobsKey(batchId)], [nBundledetailid]));
    return n === 1 ? 'yes' : n === 0 ? 'no' : 'unknown';
  }

  /**
   * Hand the batch over to the file jobs; a no-op when the hash belongs to a
   * newer run. A batch that finished / was cancelled before the last addBulk
   * reply came back keeps its done TTL (the 48 h TTL is never re-armed).
   */
  async markEnqueueDone(batchId: string, run: string): Promise<boolean> {
    const ok = Number(await this.rds.eval(
      `if redis.call('HGET', KEYS[1], 'run') ~= ARGV[1] then return 0 end
       redis.call('HSET', KEYS[1], 'enqueueDone', '1')
       if redis.call('HGET', KEYS[1], 'finalized') ~= '1' and redis.call('HGET', KEYS[1], 'cancelled') ~= '1' then
         redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
       end
       return 1`,
      [this.hashKey(batchId)], [run, this.batchTtlSec])) === 1;
    return ok;
  }

  /**
   * KEYS: hash, seen   ARGV: run, nBundledetailid
   * File job pre-check BEFORE any python is spawned: 0 go, 1 the hash belongs
   * to another run (or is gone), 2 cancelled / finished, 3 this file was
   * already counted (Bull retry / stalled re-run after the accounting),
   * 4 finalized but NOT notified: the process died between the finalizing
   * accounting Lua and finalize() -- the caller recovers the lost finalize.
   */
  private static readonly PRECHECK_LUA = `
local run = redis.call('HGET', KEYS[1], 'run')
if not run or run ~= ARGV[1] then return 1 end
if redis.call('HGET', KEYS[1], 'cancelled') == '1' then return 2 end
if redis.call('HGET', KEYS[1], 'finalized') == '1' then
  if redis.call('HGET', KEYS[1], 'notified') ~= '1' then return 4 end
  return 2
end
if redis.call('SISMEMBER', KEYS[2], ARGV[2]) == 1 then return 3 end
return 0`;

  async precheckFile(batchId: string, run: string, nBundledetailid: string): Promise<'go' | 'stale' | 'cancelled' | 'seen' | 'recover'> {
    const n = Number(await this.rds.eval(HyperlinkBatchService.PRECHECK_LUA, [this.hashKey(batchId), this.seenKey(batchId)], [run, nBundledetailid]));
    return n === 0 ? 'go' : n === 1 ? 'stale' : n === 2 ? 'cancelled' : n === 4 ? 'recover' : 'seen';
  }

  /** true when the batch was cancelled or its hash now belongs to another run (or is gone): a running python of `run` is wasted work. */
  async isSuperseded(batchId: string, run: string): Promise<boolean> {
    const hash = await this.getBatch(batchId);
    return !hash || !hash.run || hash.run !== run || hash.cancelled === '1';
  }

  // ----------------------------------------------------------- accounting --

  /**
   * KEYS: hash, seen, failedList, progressKey, jobs
   * ARGV: id, outcome, failedJson, ttl, baseJson, nowIso, doneTtl, run
   * Returns {counted, done, failed, total, fin, snapshotJson}
   *   counted -1: this job belongs to another run of the scope (ignored)
   *   counted  0: already counted (retry / stalled re-run) -> nothing changed
   *   fin      1: this call completed the batch; the progress key already
   *               carries the final C/F status with the done TTL
   * A batch that is already finalized (orchestrator failure, stale release)
   * still counts the file (for the record) but never rewrites the progress
   * key; a CANCELLED batch counts it and refreshes the counters / failed list
   * of its 'X' snapshot (status and done TTL unchanged) so the popup shows
   * the files that finished after the cancel. The keys get the done TTL.
   */
  private static readonly ACCOUNT_LUA = `
local run = redis.call('HGET', KEYS[1], 'run')
if not run or run ~= ARGV[8] then return {-1, 0, 0, 0, 0, ''} end
local counted = redis.call('SADD', KEYS[2], ARGV[1])
if counted == 1 then
  if ARGV[2] == 'F' then
    redis.call('HINCRBY', KEYS[1], 'failed', 1)
    if ARGV[3] ~= '' then
      redis.call('LPUSH', KEYS[3], ARGV[3])
      redis.call('LTRIM', KEYS[3], 0, 199)
    end
  else
    redis.call('HINCRBY', KEYS[1], 'done', 1)
  end
end
local d = tonumber(redis.call('HGET', KEYS[1], 'done') or '0') or 0
local f = tonumber(redis.call('HGET', KEYS[1], 'failed') or '0') or 0
local t = tonumber(redis.call('HGET', KEYS[1], 'total') or '0') or 0
local cancelled = (redis.call('HGET', KEYS[1], 'cancelled') == '1')
local finalizedBefore = (redis.call('HGET', KEYS[1], 'finalized') == '1')
local fin = 0
if counted == 1 and (not cancelled) and (not finalizedBefore) and t > 0 and d + f >= t then
  redis.call('HSET', KEYS[1], 'finalized', '1')
  fin = 1
end
local ttl = tonumber(ARGV[4])
if fin == 1 or finalizedBefore or cancelled then ttl = tonumber(ARGV[7]) end
redis.call('EXPIRE', KEYS[1], ttl)
redis.call('EXPIRE', KEYS[2], ttl)
if redis.call('EXISTS', KEYS[3]) == 1 then redis.call('EXPIRE', KEYS[3], ttl) end
if redis.call('EXISTS', KEYS[5]) == 1 then redis.call('EXPIRE', KEYS[5], ttl) end
if counted == 1 and cancelled then
  -- a file that finished after the cancel: keep the popup's X snapshot
  -- accurate (counters + failed list) without changing its status / TTL
  local v = redis.call('GET', KEYS[4])
  if v then
    local ok, cur = pcall(cjson.decode, v)
    if ok and type(cur) == 'table' and cur.cStatus == 'X' then
      cur.nCompleted = d
      cur.nFailed = f
      if t > (tonumber(cur.nTotal or 0) or 0) then cur.nTotal = t end
      cur.dUpdate = ARGV[6]
      cur.jFailed = nil
      cur.nFailedTruncated = nil
      local xl = redis.call('LRANGE', KEYS[3], 0, -1)
      local xr = {}
      for i = #xl, 1, -1 do xr[#xr + 1] = xl[i] end
      local xt = 'false'
      if f > 200 then xt = 'true' end
      local xb = string.sub(cjson.encode(cur), 1, -2) .. ',"jFailed":[' .. table.concat(xr, ',') .. '],"nFailedTruncated":' .. xt .. '}'
      local left = redis.call('TTL', KEYS[4])
      if left <= 0 or left > tonumber(ARGV[7]) then left = tonumber(ARGV[7]) end
      redis.call('SET', KEYS[4], xb, 'EX', left)
      return {counted, d, f, t, fin, xb}
    end
  end
end
if counted == 0 or cancelled or finalizedBefore then return {counted, d, f, t, fin, ''} end
local snap = cjson.decode(ARGV[5])
snap.nTotal = t
snap.nCompleted = d
snap.nFailed = f
snap.dUpdate = ARGV[6]
snap.cStatus = 'P'
if fin == 1 then
  if f > 0 then snap.cStatus = 'F' else snap.cStatus = 'C' end
end
snap.jFailed = nil
snap.nFailedTruncated = nil
local list = redis.call('LRANGE', KEYS[3], 0, -1)
local rev = {}
for i = #list, 1, -1 do rev[#rev + 1] = list[i] end
local body = cjson.encode(snap)
local trunc = 'false'
if f > 200 then trunc = 'true' end
body = string.sub(body, 1, -2) .. ',"jFailed":[' .. table.concat(rev, ',') .. '],"nFailedTruncated":' .. trunc .. '}'
local keyTtl = tonumber(ARGV[4])
if fin == 1 then keyTtl = tonumber(ARGV[7]) end
redis.call('SET', KEYS[4], body, 'EX', keyTtl)
return {counted, d, f, t, fin, body}`;

  /** Base of the per-file snapshot: the batch's hyperlinkProcess without counters / failed list. */
  baseOf(jobData: hyperlinkProcess): hyperlinkProcess {
    const { nTotal, nCompleted, nFailed, jFailed, nFailedTruncated, ...base } = jobData as any;
    return base as hyperlinkProcess;
  }

  /**
   * Count one file exactly once and refresh the progress snapshot atomically.
   * `reason` is only stored for outcome 'F' (capped at 300 chars).
   */
  async account(batchId: string, run: string, progressKey: string, base: hyperlinkProcess, file: hyperlinkFiles, outcome: 'C' | 'F', reason?: string)
    : Promise<{ counted: number; done: number; failed: number; total: number; fin: boolean; snapshot: hyperlinkProcess | null }> {
    const entry: hyperlinkFailedEntry | null = outcome === 'F'
      ? { nBundledetailid: file.nBundledetailid, cFilename: file.cFilename, cReason: String(reason || 'unknown').slice(0, 300) }
      : null;
    const res: any[] = await this.rds.eval(HyperlinkBatchService.ACCOUNT_LUA,
      [this.hashKey(batchId), this.seenKey(batchId), this.failedKey(batchId), progressKey, this.jobsKey(batchId)],
      [file.nBundledetailid, outcome, entry ? JSON.stringify(entry) : '', this.batchTtlSec, JSON.stringify(this.baseOf(base)), new Date().toISOString(), this.doneTtlSec, run]);
    const [counted, done, failed, total, fin, body] = res;
    let snapshot: hyperlinkProcess | null = null;
    if (body) { try { snapshot = JSON.parse(body); } catch (error) { snapshot = null; } }
    return { counted: Number(counted), done: Number(done), failed: Number(failed), total: Number(total), fin: Number(fin) === 1, snapshot };
  }

  /**
   * After an accounting call: finalize exactly once. `fin` callers finalize
   * directly; a call that found the file already counted (retry after a crash
   * between the finalizing Lua and the notification) recovers the lost
   * finalize when the hash is finalized, not cancelled and not yet notified.
   */
  async afterAccount(acc: { counted: number; fin: boolean; snapshot: hyperlinkProcess | null }, batchId: string, progressKey: string): Promise<void> {
    if (acc.counted === -1) return;
    if (acc.fin && acc.snapshot) { await this.finalize(acc.snapshot); return; }
    if (acc.counted === 1) { if (acc.snapshot) this.emitSnapshot(acc.snapshot, false); return; }
    await this.recoverLostFinalize(batchId, progressKey);
  }

  /**
   * The process died between the finalizing accounting Lua (hash finalized,
   * final C/F snapshot written) and finalize() (notification + final socket
   * event): whoever looks at the batch next -- the stalled re-run of that
   * file job, which the pre-check turns away, or a retry that finds the file
   * already counted -- completes the finalize. Returns true when it did.
   */
  async recoverLostFinalize(batchId: string, progressKey: string): Promise<boolean> {
    const hash = await this.getBatch(batchId);
    if (!hash || hash.finalized !== '1' || hash.cancelled === '1' || hash.notified === '1') return false;
    const snap = await this.readSnapshot(progressKey);
    if (!snap || snap.cStatus === 'P') return false;
    this.logService.info(`Hyperlink batch ${batchId}: finalize was lost (finalized, not notified), recovering`, this.logApp);
    await this.finalize(snap);
    return true;
  }

  /**
   * Terminal state written by the orchestrator (empty batch, getfiles
   * failure), the stale check or cancel: status C/F/X with the done TTL.
   * finalized keeps a late file job from finalizing a second time, notified
   * from notifying again, and cancelled (F/X) makes stragglers skip python.
   */
  async finish(snapshot: hyperlinkProcess, cStatus: 'C' | 'F' | 'X', reason?: string): Promise<hyperlinkProcess> {
    const batchId = snapshot.batchId;
    if (batchId) {
      await this.rds.hset(this.hashKey(batchId), { finalized: 1, notified: 1, ...(cStatus !== 'C' ? { cancelled: 1 } : {}) });
      for (const k of this.batchKeys(batchId)) await this.rds.expire(k, this.doneTtlSec);
    }
    snapshot.cStatus = cStatus;
    if (reason) {
      snapshot.jFailed = [...(snapshot.jFailed || []), { nBundledetailid: null, cFilename: null, cReason: String(reason).slice(0, 300) }].slice(-200);
    }
    const out = await this.writeSnapshot(snapshot, this.doneTtlSec, true);
    this.lastEmit.delete(batchId || snapshot.queueName);
    return out;
  }

  /**
   * KEYS: hash   ARGV: run ('' = any), onlyBeforeEnqueueDone ('1'/'0')
   * Claim the failure of a batch atomically: 0 when the hash belongs to
   * another run, is already finalized (a file job finalized C/F meanwhile, or
   * a cancel) or -- with the flag -- was handed over to the file jobs; 1 when
   * this caller now owns the terminal state.
   */
  private static readonly FAIL_CLAIM_LUA = `
local run = redis.call('HGET', KEYS[1], 'run')
if ARGV[1] ~= '' and run and run ~= ARGV[1] then return 0 end
if ARGV[2] == '1' and redis.call('HGET', KEYS[1], 'enqueueDone') == '1' then return 0 end
if redis.call('HSETNX', KEYS[1], 'finalized', '1') == 0 then return 0 end
redis.call('HSET', KEYS[1], 'notified', '1')
redis.call('HSET', KEYS[1], 'cancelled', '1')
return 1`;

  /**
   * Mark a batch that could not be started / handed over as F (reason,
   * "Hyperlink failed" notification, done TTL). No-op when the batch already
   * reached a terminal state (finalized / notified by a file job or a cancel),
   * when its hash meanwhile belongs to a newer run (`run` given) or, with
   * `onlyBeforeEnqueueDone`, when the file jobs already own the batch.
   */
  async failBatch(jobData: hyperlinkProcess, reason: string, onlyBeforeEnqueueDone = false, run = ''): Promise<boolean> {
    try {
      if (jobData.batchId) {
        const claimed = Number(await this.rds.eval(HyperlinkBatchService.FAIL_CLAIM_LUA, [this.hashKey(jobData.batchId)], [run, onlyBeforeEnqueueDone ? '1' : '0'])) === 1;
        if (!claimed) return false;
      }
      const snap = (await this.readSnapshot(jobData.queueName)) || { ...jobData };
      if (snap.cStatus === 'P' || !snap.cStatus) {
        snap.nTotal = snap.nTotal || 0; snap.nCompleted = snap.nCompleted || 0; snap.nFailed = snap.nFailed || 0;
        snap.batchId = snap.batchId || jobData.batchId;
        await this.finish(snap as hyperlinkProcess, 'F', reason);
        await this.sendNotification(jobData.nCaseid, jobData.nMasterid, 'Hyperlink failed', null);
        return true;
      }
    } catch (error) {
      this.logService.info(`Could not mark batch ${jobData.batchId} failed: ${error?.message}`, this.logApp);
    }
    return false;
  }

  /** Called with the final snapshot: notification + final emit, exactly once per batch (HSETNX notified). */
  async finalize(snapshot: hyperlinkProcess): Promise<void> {
    const batchId = snapshot.batchId;
    if (batchId) {
      const first = Number(await this.rds.eval(`return redis.call('HSETNX', KEYS[1], 'notified', '1')`, [this.hashKey(batchId)], [])) === 1;
      if (!first) return;
    }
    this.emitSnapshot(snapshot, true);
    this.lastEmit.delete(batchId || snapshot.queueName);
    for (const k of this.batchKeys(batchId)) {
      try { await this.rds.expire(k, this.doneTtlSec); } catch (error) { /* best effort */ }
    }
    const text = snapshot.nFailed > 0 ? `Hyperlink completed with ${snapshot.nFailed} failure(s)` : 'Hyperlink Successful';
    // as before: a batch of exactly one file names that file in the
    // notification, also when it was requested as a bundle / section
    let nBundledetailid: string | null = null;
    if (snapshot.nTotal === 1) {
      nBundledetailid = snapshot.nBundledetailid || null;
      if (!nBundledetailid && batchId) {
        try { const ids = await this.rds.getsmembers(this.jobsKey(batchId)); if (ids?.length === 1) nBundledetailid = ids[0]; } catch (error) { /* optional */ }
      }
    }
    await this.sendNotification(snapshot.nCaseid, snapshot.nMasterid, text, nBundledetailid);
    this.logService.info(`Hyperlink batch ${batchId} finished ${snapshot.cStatus}: ${snapshot.nCompleted}/${snapshot.nTotal} done, ${snapshot.nFailed} failed`, this.logApp);
  }

  // --------------------------------------------------------------- cancel --

  /**
   * KEYS: hash. Claims the cancel as the FIRST Redis call of cancel() so no
   * file job can start a scan after the request was received. Returns
   * {claimed, owner}: claimed -1 no batch, 0 already finalized (finished or
   * cancelled), 1 cancelled now.
   */
  private static readonly CANCEL_LUA = `
if redis.call('EXISTS', KEYS[1]) == 0 then return {-1, ''} end
local owner = redis.call('HGET', KEYS[1], 'owner') or ''
local run = redis.call('HGET', KEYS[1], 'run') or ''
if redis.call('HGET', KEYS[1], 'finalized') == '1' then return {0, owner, run} end
redis.call('HSET', KEYS[1], 'cancelled', '1')
redis.call('HSET', KEYS[1], 'finalized', '1')
redis.call('HSET', KEYS[1], 'notified', '1')
return {1, owner, run}`;

  /**
   * POST /cancelhyperlink. Marks the batch cancelled (file jobs that have not
   * started return without counting), removes the waiting / delayed file
   * jobs, kills the in-flight pythons of the batch and writes the final 'X'
   * snapshot with the done TTL. Idempotent for a cancelled batch; a batch
   * that already finished (C/F) is left untouched (msg -1).
   */
  async cancel(batchId: string, fileQueue: Queue): Promise<{ msg: number; value: string; data?: hyperlinkProcess; removed?: number; killed?: number }> {
    const res: any[] = await this.rds.eval(HyperlinkBatchService.CANCEL_LUA, [this.hashKey(batchId)], []);
    const claimedCode = Number(res?.[0]);
    const progressKey = String(res?.[1] || '');
    // The run token captured at claim time scopes the drain and the kills: a
    // restart of the same scope that lands while this cancel is still draining
    // creates a NEW run (new hash run, new job ids), which must be left alone.
    const run = String(res?.[2] || '') || undefined;
    if (claimedCode === -1 || !progressKey) return { msg: -1, value: 'No hyperlink batch found' };
    let snapshot = await this.readSnapshot(progressKey);
    const claimed = claimedCode === 1;
    if (!claimed) {
      if (snapshot && snapshot.cStatus === 'X') {
        // already cancelled: drain again (idempotent), report the snapshot
        const removed = await this.drainFileJobs(batchId, fileQueue, run);
        const killed = this.search.killBatch(batchId, run);
        return { msg: 1, value: 'Hyperlink cancelled', data: snapshot, removed, killed };
      }
      return { msg: -1, value: 'Hyperlink not running', ...(snapshot ? { data: snapshot } : {}) };
    }
    if (!snapshot) {
      // hash without a progress key (expired): stop the work, write no ghost key
      const removed = await this.drainFileJobs(batchId, fileQueue, run);
      const killed = this.search.killBatch(batchId, run);
      this.logService.info(`Hyperlink batch ${batchId} cancelled without a progress key: ${removed} job(s) removed, ${killed} python(s) killed`, this.logApp);
      return { msg: 1, value: 'Hyperlink cancelled', removed, killed };
    }
    snapshot.batchId = snapshot.batchId || batchId;
    // status X first so the popup flips immediately, the drain may take a moment
    snapshot = await this.finish(snapshot, 'X');
    const removed = await this.drainFileJobs(batchId, fileQueue, run);
    const killed = this.search.killBatch(batchId, run);
    // counters may have moved while draining (in-flight files finishing):
    // re-snapshot atomically from the hash (files that finish later refresh
    // the X snapshot themselves, see ACCOUNT_LUA)
    snapshot = (await this.refreshCancelledSnapshot(progressKey, batchId)) || snapshot;
    this.emitSnapshot(snapshot, true);
    this.logService.info(`Hyperlink batch ${batchId} cancelled: ${removed} waiting job(s) removed, ${killed} python(s) killed`, this.logApp);
    // the one notification of a cancelled batch (a finalize can no longer
    // happen: the cancel claimed `finalized` + `notified` atomically above)
    await this.sendNotification(snapshot.nCaseid, snapshot.nMasterid, 'Hyperlink cancelled', null);
    return { msg: 1, value: 'Hyperlink cancelled', data: snapshot, removed, killed };
  }

  /**
   * KEYS: progressKey, hash, failedList   ARGV: nowIso, doneTtl
   * Rewrite the counters / failed list of an 'X' snapshot from the hash in one
   * step (status and done TTL unchanged). Returns the body or '' when the key
   * is not an X snapshot.
   */
  private static readonly REFRESH_X_LUA = `
local v = redis.call('GET', KEYS[1])
if not v then return '' end
local ok, cur = pcall(cjson.decode, v)
if not ok or type(cur) ~= 'table' or cur.cStatus ~= 'X' then return '' end
local d = tonumber(redis.call('HGET', KEYS[2], 'done') or '0') or 0
local f = tonumber(redis.call('HGET', KEYS[2], 'failed') or '0') or 0
local t = tonumber(redis.call('HGET', KEYS[2], 'total') or '0') or 0
cur.nCompleted = d
cur.nFailed = f
if t > (tonumber(cur.nTotal or 0) or 0) then cur.nTotal = t end
cur.dUpdate = ARGV[1]
cur.jFailed = nil
cur.nFailedTruncated = nil
local list = redis.call('LRANGE', KEYS[3], 0, -1)
local rev = {}
for i = #list, 1, -1 do rev[#rev + 1] = list[i] end
local trunc = 'false'
if f > 200 then trunc = 'true' end
local body = string.sub(cjson.encode(cur), 1, -2) .. ',"jFailed":[' .. table.concat(rev, ',') .. '],"nFailedTruncated":' .. trunc .. '}'
local left = redis.call('TTL', KEYS[1])
if left <= 0 or left > tonumber(ARGV[2]) then left = tonumber(ARGV[2]) end
redis.call('SET', KEYS[1], body, 'EX', left)
return body`;

  async refreshCancelledSnapshot(progressKey: string, batchId: string): Promise<hyperlinkProcess | null> {
    const body = String(await this.rds.eval(HyperlinkBatchService.REFRESH_X_LUA,
      [progressKey, this.hashKey(batchId), this.failedKey(batchId)], [new Date().toISOString(), this.doneTtlSec]) || '');
    if (!body) return null;
    try { return JSON.parse(body); } catch (error) { return null; }
  }

  /**
   * Remove every not-yet-active file job of the batch from the queue; returns
   * the count. Primary path: the ids come from the batch's own expected set
   * minus the files already counted (SDIFF jobs seen, O(batch size), no
   * keyspace SCAN); each is fetched and removed by id -- Bull refuses a
   * locked (active) job, those see the cancelled flag themselves. Fallback
   * when the expected set is missing (expired / batch older than this
   * code): page through waiting / delayed / paused, COLLECT the batch's jobs
   * first, then remove them (removals never shift the pages being read).
   */
  async drainFileJobs(batchId: string, fileQueue: Queue, runToDrain?: string): Promise<number> {
    let removed = 0;
    try {
      const hash = await this.getBatch(batchId);
      // Only the given run is drained (its job ids carry the token). Without
      // one, the hash's current run is used. The jobs set belongs to the
      // hash's current run, so it is only consulted when that is the run
      // being drained; otherwise the list fallback below is used.
      const run = runToDrain || hash?.run;
      if (run && (!runToDrain || runToDrain === hash?.run) && await this.rds.exists(this.jobsKey(batchId))) {
        const pending: string[] = await this.rds.sdiff(this.jobsKey(batchId), this.seenKey(batchId));
        const PAR = 25;
        for (let i = 0; i < pending.length; i += PAR) {
          const slice = pending.slice(i, i + PAR);
          const results = await Promise.all(slice.map(async id => {
            try {
              const job = await fileQueue.getJob(this.fileJobId(batchId, run, id));
              if (!job) return 0;
              await job.remove();
              return 1;
            } catch (error) { return 0; }   // locked (active) or gone meanwhile
          }));
          for (const r of results) removed += r;
        }
        return removed;
      }
    } catch (error) {
      this.logService.info(`draining ${batchId} by id failed: ${error?.message}`, this.logApp);
    }
    // fallback: page the queue lists (O(queue size)); Bull's pattern remover
    // is NOT used (it SCANs the whole keyspace)
    const prefix = runToDrain ? `${this.fileJobPrefix(batchId)}${runToDrain}:` : this.fileJobPrefix(batchId);
    const PAGE = 500, MAX_PAGES = 40;
    try {
      const mine: Job[] = [];
      for (let page = 0; page < MAX_PAGES; page++) {
        const jobs = await fileQueue.getJobs(['waiting', 'delayed', 'paused'], page * PAGE, page * PAGE + PAGE - 1);
        for (const j of jobs) if (j && String(j.id).startsWith(prefix)) mine.push(j);
        if (jobs.length < PAGE) break;
      }
      for (const j of mine) {
        try { await j.remove(); removed++; } catch (error) { /* locked (active) or gone */ }
      }
    } catch (error) {
      this.logService.info(`draining ${batchId} by list failed: ${error?.message}`, this.logApp);
    }
    return removed;
  }

  // ---------------------------------------------------------------- stale --

  /**
   * A 'P' snapshot whose dUpdate is older than HYPERLINK_STALE_MIN, whose hash
   * says done + failed < total (or is gone), whose orchestrator job is not on
   * the bundle queue any more and whose file jobs are nowhere in the file
   * queue is dead (worker crash before finalize). The caller marks it F.
   *
   * The file jobs are looked up BY ID from the batch's own expected set
   * (jobs minus seen, up to 200 of them): independent of how many foreign
   * jobs are queued. Paging through the queue lists is only the fallback for
   * a batch without an expected set (older than this code).
   *
   * A LEGACY index snapshot (no batchId: the index queue shares the
   * single-file key shape) carries no timestamp; it is alive while its job
   * is on the index queue and never stale when that queue is not given.
   */
  async isStale(snapshot: hyperlinkProcess, fileQueue: Queue, bundleQueue?: Queue, indexQueue?: Queue): Promise<boolean> {
    if (!snapshot || snapshot.cStatus !== 'P') return false;
    const batchId = snapshot.batchId || '';
    if (!batchId) {
      if (!indexQueue) return false;
      try {
        const jobs = await indexQueue.getJobs(['active', 'waiting', 'delayed', 'paused'], 0, 999);
        return !jobs.some(j => j && j.data && j.data.queueName === snapshot.queueName);
      } catch (error) { return false; }
    }
    const updated = Date.parse(snapshot.dUpdate || snapshot.dStart || '') || 0;
    if (Date.now() - updated < this.staleMin * 60 * 1000) return false;
    const hash = await this.getBatch(batchId);
    if (hash && Number(hash.total || 0) > 0 && Number(hash.done || 0) + Number(hash.failed || 0) >= Number(hash.total)) {
      // everything counted but never finalized (finalizer crashed): dead too
      return true;
    }
    // the orchestrator has not handed over yet: alive while its job is still on the bundle queue
    if (hash && hash.enqueueDone !== '1' && bundleQueue) {
      try {
        const jobs = await bundleQueue.getJobs(['active', 'waiting', 'delayed', 'paused'], 0, 999);
        if (jobs.some(j => j && j.data && j.data.batchId === batchId)) return false;
      } catch (error) { /* fall through to the file queue check */ }
    }
    // the batch's own pending ids, looked up directly
    if (hash?.run && await this.rds.exists(this.jobsKey(batchId))) {
      const pending: string[] = await this.rds.sdiff(this.jobsKey(batchId), this.seenKey(batchId));
      if (!pending.length) return true;
      const sample = pending.slice(0, 200);
      const PAR = 25;
      for (let i = 0; i < sample.length; i += PAR) {
        const found = await Promise.all(sample.slice(i, i + PAR).map(id => fileQueue.getJob(this.fileJobId(batchId, hash.run, id)).catch(() => null)));
        if (found.some(j => !!j)) return false;
      }
      return true;
    }
    // fallback: any file job of the batch still in the queue -> alive (scan up to 5000 jobs)
    const prefix = this.fileJobPrefix(batchId);
    let scanned = 0;
    for (let page = 0; page < 10; page++) {
      const jobs = await fileQueue.getJobs(['active', 'waiting', 'delayed', 'paused'], page * 500, page * 500 + 499);
      if (jobs.some(j => j && String(j.id).startsWith(prefix))) return false;
      scanned += jobs.length;
      if (jobs.length < 500) break;
    }
    if (scanned >= 5000) {
      // the queue is too busy to be sure; be conservative and keep the lock
      this.logService.info(`stale check for ${batchId}: > 5000 jobs queued and no expected set, keeping the lock`, this.logApp);
      return false;
    }
    return true;
  }

  /** Batches still marked running (for the startup log). */
  async listRunning(): Promise<hyperlinkProcess[]> {
    const out: hyperlinkProcess[] = [];
    try {
      const keys = await this.rds.scanKeys('HYPERLINK/*');
      for (const k of keys) {
        const s = await this.readSnapshot(k);
        if (s && s.cStatus === 'P') out.push(s);
      }
    } catch (error) { /* best effort */ }
    return out;
  }

  // -------------------------------------------------------- notifications --

  /** Case-wide notification (same payload as the legacy processor). */
  async sendNotification(nCaseid: string, nMasterid: string, text: string, nBundledetailid?: string): Promise<void> {
    if (!nCaseid) return;
    this.logService.info(`Notification send for ${nCaseid}: ${text}`, `index/notification`);
    try {
      const users = await this.getUploadUser(nCaseid);
      if (users?.length) {
        users.forEach(a => {
          a.cTitle = `Hyperlink`;
          a.cMsg = `${text} | Case no. ${a.cCaseno}`;
          a.nBundledetailid = nBundledetailid;
          a.nRefuserid = nMasterid;
          this.utility.emit(a, `notification`);
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getUploadUser(nCaseid: string): Promise<any[]> {
    try {
      const res = await this.db.executeRef('notifications_caseusers', { nCaseid });
      return res.success ? res.data[0] : [];
    } catch (error) {
      return [];
    }
  }
}
