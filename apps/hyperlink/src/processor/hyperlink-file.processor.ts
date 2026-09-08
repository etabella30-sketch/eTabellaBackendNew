import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { DbService } from '@app/global/db/pg/db.service';
import { HyperlinksearchService } from '../services/hyperlinksearch/hyperlinksearch.service';
import { HyperlinkBatchService } from '../services/batch/hyperlink-batch.service';
import { hyperlinkFileJob, hyperlinkFiles, hyperlinkProcess } from '../interfaces/hyperlink.interface';

/**
 * Configuration of the v2 hyperlink pipeline (ConfigService keys, defaults in
 * code; the .env files are not checked in -- add the lines to them by hand):
 *
 *   HYPERLINK_WORKERS=3            parallel python scans per process (1..5)
 *   HYPERLINK_FILE_TIMEOUT_MIN=45  per-file python kill timer (fractions ok)
 *   HYPERLINK_BATCH_TTL_SEC=172800 TTL of the batch keys, refreshed per file
 *   HYPERLINK_DONE_TTL_SEC=900     a finished batch stays visible this long
 *   HYPERLINK_STALE_MIN=90         a 'P' lock idle this long with no jobs is dead
 *   HYPERLINK_FILE_BACKOFF_MS=30000 Bull backoff before the 2nd attempt of a
 *                                  file job (only python spawn failures retry)
 *   HYPERLINK_CANCEL_POLL_MS=5000  while a python runs, poll the batch hash
 *                                  this often (5 s) and kill the child when the
 *                                  batch was cancelled / restarted (this is
 *                                  what makes cancel work across pm2 instances)
 *   HYPERLINK_DEBUG_LOG=true       append every python stdout chunk to
 *                                  ./hyperlink_test.txt (off by default)
 *   HYPERLINK_FAIR_CHUNK=100       file jobs get a priority per slice of this
 *                                  many files so batches of one class share
 *                                  the workers slice by slice (0 = FIFO)
 *   HYPERLINK_ENQUEUE_STALE_MS=15000 an orchestrator that stopped adding
 *                                  chunks this long ago is dead: its re-run
 *                                  takes the enqueue over at once
 *
 * Concurrency: Nest's @Process decorator needs a literal, so the decorator is
 * the HARD CAP (5 jobs "active" per process) and a semaphore sized by
 * HYPERLINK_WORKERS gates how many pythons actually run. Jobs waiting on the
 * semaphore hold their Bull lock (Bull keeps renewing it), which is fine:
 * they are counted as active but do no work (and re-check the batch before
 * spawning python, so a cancel / restart never wastes a scan on them).
 * The cap is PER PROCESS: ecosystem.config.js runs one hyperlink instance;
 * with N instances the effective cap is HYPERLINK_WORKERS x N.
 */
export const HYPERLINK_WORKERS_HARD_CAP = 5;

/** Wrapper for the one error that is allowed to reach Bull (python spawn failure with an attempt left). */
class SpawnRetry extends Error {
  constructor(public readonly cause: any) { super(`spawn retry: ${cause?.message || cause}`); }
}
/** Control flow: the python was killed because the batch was cancelled (no SP call, counted F 'cancelled' for the record). */
class Cancelled extends Error {
  constructor() { super('cancelled'); }
}

/** Minimal counting semaphore (FIFO). */
export class Semaphore {
  private queue: (() => void)[] = [];
  private active = 0;
  constructor(public readonly size: number) { }
  async acquire(): Promise<void> {
    if (this.active < this.size) { this.active++; return; }
    await new Promise<void>(resolve => this.queue.push(resolve));
    this.active++;
  }
  release(): void {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
  get running(): number { return this.active; }
}

/**
 * hyperlink-file-queue handler: scans ONE file (DESIGN_V2.md §3, "File job").
 *
 *   1. batch cancelled -> return without counting
 *   2. python via HyperlinksearchService (strict result contract, kill timer,
 *      registered for cancel)
 *   3. SP hyperlink_update_documents(_v2) with C/F; an SP failure makes the
 *      file F ("sp: ...") even when the scan was OK
 *   4. atomic accounting (Lua) -> snapshot -> throttled socket event
 *   5. the call that completes the batch finalizes it (notification)
 *
 * Nothing escapes uncounted: every unexpected throw is counted as F. The only
 * rethrow is a python that could not be SPAWNED while an attempt is left --
 * no scan work happened, so Bull's retry (attempts 2, backoff
 * HYPERLINK_FILE_BACKOFF_MS) is safe; on the last attempt it is counted as F.
 * Whatever Bull itself fails for good (last attempt threw outside the
 * handler, or the job stalled more than maxStalledCount times because the
 * worker died repeatedly while it was in flight) is counted as F by the
 * queue's `failed` listener, so a batch always reaches a terminal state.
 */
@Processor('hyperlink-file-queue')
export class HyperLinkFileProcessor implements OnModuleInit {
  private readonly logApp = 'hyperlink';
  private readonly sem: Semaphore;

  constructor(
    private readonly config: ConfigService,
    private readonly db: DbService,
    private readonly logService: LogService,
    private readonly search: HyperlinksearchService,
    private readonly batch: HyperlinkBatchService,
    @InjectQueue('hyperlink-file-queue') private readonly fileQueue: Queue,
  ) {
    this.sem = new Semaphore(Math.min(HYPERLINK_WORKERS_HARD_CAP, this.batch.workers));
    this.fileQueue.on('failed', (job: Job<hyperlinkFileJob>, err: Error) => {
      this.onBullFailed(job, err).catch(e => this.logService.info(`failed-listener error for ${job?.id}: ${e?.message}`, this.logApp));
    });
  }

  /** Startup: only log the batches Redis still shows as running. */
  async onModuleInit(): Promise<void> {
    try {
      const running = await this.batch.listRunning();
      if (running.length) {
        this.logService.info(`Hyperlink batches marked running at startup: ${running.map(r => `${r.batchId} ${r.nCompleted + r.nFailed}/${r.nTotal}`).join(', ')}`, this.logApp);
      }
      this.logService.info(`Hyperlink file worker ready: ${this.sem.size} parallel scan(s) (cap ${HYPERLINK_WORKERS_HARD_CAP})`, this.logApp);
    } catch (error) { /* logging only */ }
  }

  get workers(): number { return this.sem.size; }

  @Process({ concurrency: HYPERLINK_WORKERS_HARD_CAP })
  async handleFile(job: Job<hyperlinkFileJob>): Promise<void> {
    await this.sem.acquire();
    try {
      await this.processFile(job);
    } finally {
      this.sem.release();
    }
  }

  /**
   * Bull's terminal failure of a file job (no attempt left, or stalled more
   * than allowed): count it as F so the batch can finish. The seen set makes
   * this a no-op for a job that was already counted.
   */
  private async onBullFailed(job: Job<hyperlinkFileJob>, err: Error): Promise<void> {
    const data = job?.data;
    if (!data || !data.batchId || !data.file || !data.jobData) return;
    const msg = String(err?.message || err || 'unknown');
    const attempts = Number(job.opts?.attempts || 1);
    const terminal = /stalled more than/i.test(msg) || Number(job.attemptsMade || 0) >= attempts;
    if (!terminal) return;
    this.logService.info(`file job ${job.id} failed for good in Bull (${msg}), counting it as F`, this.logApp);
    const acc = await this.batch.account(data.batchId, data.run, data.progressKey, data.jobData, data.file, 'F', `bull: ${msg}`.slice(0, 300));
    await this.batch.afterAccount(acc, data.batchId, data.progressKey);
    // Bull's stalled-for-good path ignores removeOnFail: drop the job so the
    // failed set does not accumulate (it is accounted, nothing re-runs it)
    if (/stalled more than/i.test(msg) && typeof job.remove === 'function') {
      try { await job.remove(); } catch (error) { /* already gone */ }
    }
  }

  private async processFile(job: Job<hyperlinkFileJob>): Promise<void> {
    const data = job.data;
    const { batchId, run, progressKey, file, jobData, searchTermsPath } = data;
    if (!batchId || !file || !jobData) {
      this.logService.info(`file job ${job.id} has no usable data, dropped`, this.logApp);
      return;
    }

    let outcome: 'C' | 'F' = 'C';
    let reason: string | undefined;
    try {
      // 1. pre-check BEFORE any python: cancelled -> nothing to do (the
      //    cancel path owns the final snapshot); hash owned by a newer run
      //    (cancel + restart while this job was parked) -> nothing to do;
      //    already counted (retry / stalled re-run after the accounting) ->
      //    nothing to do. A Redis blip here is not a reason to fail the file.
      try {
        const pre = await this.batch.precheckFile(batchId, run, file.nBundledetailid);
        if (pre !== 'go') {
          if (pre === 'stale') this.logService.info(`file job ${job.id}: superseded run, skipped before python`, this.logApp);
          else if (pre === 'seen') this.logService.info(`file job ${job.id}: already counted, skipped before python`, this.logApp);
          else this.logService.info(`file job ${job.id}: batch finished / cancelled, skipped before python`, this.logApp);
          // 'recover': the batch is finalized but not notified -- the process
          // died between the finalizing Lua and finalize() and THIS job is
          // its stalled re-run; complete the lost finalize here
          if (pre === 'recover') {
            try { await this.batch.recoverLostFinalize(batchId, progressKey); } catch (e) { /* the next look recovers it */ }
          }
          return;
        }
      } catch (redisError) {
        this.logService.info(`precheck failed for ${batchId} (${redisError?.message}), scanning anyway`, this.logApp);
      }
      // 2. python. While it runs the batch hash is polled: a cancel served by
      //    ANOTHER pm2 instance (or a restart of the scope) kills this child
      //    too -- the in-flight registry is per process.
      let scan: { ok: boolean; code: number; reason?: string };
      const poll = setInterval(() => {
        this.batch.isSuperseded(batchId, run).then(gone => {
          if (!gone) return;
          // keep polling until the child is actually signalled: it may not
          // be registered yet (spawn still ahead) on this tick
          if (this.search.killFile(batchId, file.nBundledetailid, run)) {
            clearInterval(poll);
            this.logService.info(`python of ${file.nBundledetailid} killed: batch ${batchId} cancelled / superseded`, this.logApp);
          }
        }).catch(() => { /* Redis blip: try again on the next tick */ });
      }, this.batch.cancelPollMs);
      try {
        scan = await this.search.createHyperlinkFile(file, jobData, searchTermsPath, batchId, run);
      } catch (spawnError) {
        const attemptsLeft = (job.attemptsMade + 1) < Number(job.opts?.attempts || 1);
        if (attemptsLeft) {
          this.logService.info(`python could not be started for ${file.nBundledetailid} (${spawnError?.message}), letting Bull retry`, this.logApp);
          throw new SpawnRetry(spawnError);   // no scan work happened: retry is safe
        }
        scan = { ok: false, code: -2, reason: `spawn: ${spawnError?.message || spawnError}` };
      } finally {
        clearInterval(poll);
      }
      if (!scan.ok) {
        outcome = 'F';
        reason = scan.reason || `exit ${scan.code}`;
        this.logService.info(`Hyperlink failed for ${file.nBundledetailid},${file.cFilename}: ${reason}`, this.logApp);
      } else {
        this.logService.info(`Hyperlink created for ${file.nBundledetailid},${file.cFilename}`, this.logApp);
      }
      if (!scan.ok && /:\s*cancelled$/.test(String(scan.reason || ''))) {
        // the python was killed by a cancel / restart of the batch: the file
        // is "not done", not a failed hyperlink run -- keep its DB status,
        // count it for the record only (the cancel path owns the snapshot)
        reason = 'cancelled';
        this.logService.info(`file ${file.nBundledetailid} of ${batchId} cancelled while scanning, DB status left untouched`, this.logApp);
        throw new Cancelled();
      }
      // 3. stored procedure (C or F as today); a failing SP fails the file
      const sp = await this.updateHyperlinksForFile(file, jobData, outcome, run);
      if (!sp.ok) {
        if (outcome === 'C') reason = `sp: ${sp.reason}`;
        outcome = 'F';
        this.logService.info(`SP failed for ${file.nBundledetailid}: ${sp.reason}`, this.logApp);
      }
    } catch (error) {
      if (error instanceof SpawnRetry) throw error.cause;   // the only throw allowed to reach Bull
      if (!(error instanceof Cancelled)) {
        outcome = 'F';
        reason = `error: ${error?.message || error}`;
      }
    }

    // 4. atomic accounting + snapshot. A Redis error here is retried a few
    //    times before it reaches Bull (whose retry would run python again):
    //    the file is logged as uncounted in that case.
    let acc: Awaited<ReturnType<HyperlinkBatchService['account']>>;
    try {
      acc = await this.withRetry(() => this.batch.account(batchId, run, progressKey, jobData, file, outcome, reason), `account ${file.nBundledetailid}`);
    } catch (error) {
      this.logService.info(`file ${file.nBundledetailid} of ${batchId} is UNCOUNTED (${error?.message}); Bull will retry the job`, this.logApp);
      throw error;
    }
    if (acc.counted === -1) {
      this.logService.info(`file job ${job.id} belongs to an older run of ${batchId}, ignored`, this.logApp);
      return;
    }
    // 5. progress event (throttled) or, exactly once, the finalization
    //    (finalize() emits the final snapshot unthrottled); a retry that
    //    finds the file already counted recovers a lost finalize
    try {
      await this.withRetry(() => this.batch.afterAccount(acc, batchId, progressKey), `afterAccount ${file.nBundledetailid}`);
    } catch (error) {
      // counted already: never rethrow (Bull would re-run python for a counted file)
      this.logService.info(`afterAccount failed for ${file.nBundledetailid} of ${batchId}: ${error?.message}`, this.logApp);
    }
  }

  /** 3 attempts (0 / 250 / 1000 ms) for the Redis calls that must not reach Bull lightly. */
  private async withRetry<T>(fn: () => Promise<T>, what: string): Promise<T> {
    const delays = [250, 1000];
    for (let i = 0; ; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i >= delays.length) throw error;
        this.logService.info(`${what}: ${error?.message}, retry ${i + 1}`, this.logApp);
        await new Promise(r => setTimeout(r, delays[i]));
      }
    }
  }

  /**
   * SP hyperlink_update_documents(_v2). Returns {ok:false, reason} when the
   * call throws, reports success:false or does not answer msg 1.
   */
  async updateHyperlinksForFile(file: hyperlinkFiles, jobData: hyperlinkProcess, cStatus: 'C' | 'F', run?: string): Promise<{ ok: boolean; reason?: string; msg?: number }> {
    try {
      const param = {
        nMasterid: jobData.nMasterid,
        nSectionid: jobData.nSectionid,
        nBundledetailid: file.nBundledetailid,
        cType: jobData.cType,
        cStatus: cStatus,
        cPath: this.search.csvPathFor(file, jobData.batchId, this.config.get('HYPERLINK_DB_PATH'), run),
        cKeeptype: jobData.cKeeptype || 'R'
      }
      // Smart scan matches through the v2 stored procedure (exhibit exact ->
      // folder exact -> zero-padding tolerant passes, folder links carry
      // linktype 'F'); the legacy options keep the original procedure.
      const spName = jobData.isSmartscan ? 'hyperlink_update_documents_v2' : 'hyperlink_update_documents';
      const res = await this.db.executeRef(spName, param);
      if (!res || !res.success) return { ok: false, reason: `${spName} success:false` };
      let row: any = null;
      try { row = res.data[0][0]; } catch (error) { row = null; }
      const msg = Number(row?.msg);
      if (msg !== 1) return { ok: false, reason: `${spName} msg ${row ? row.msg : 'none'}`, msg };
      return { ok: true, msg };
    } catch (error) {
      console.log('Error in updateHyperlinksForFile', error);
      return { ok: false, reason: String(error?.message || error).slice(0, 200) };
    }
  }
}
