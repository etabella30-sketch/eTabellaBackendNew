import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { hyperlinkBundleJob, hyperlinkFileJob, hyperlinkFiles, hyperlinkProcess, hyperlinkReq } from '../interfaces/hyperlink.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { HyperlinkBatchService } from '../services/batch/hyperlink-batch.service';
import * as fs from 'fs';
import { promises as fsp } from 'fs';

/**
 * hyperlink-queue handler = the ORCHESTRATOR of one batch (v2, DESIGN_V2.md §3).
 *
 * It runs for seconds: loads the file list, writes the deep-scan terms file,
 * records `total` in the batch hash, writes the first snapshot (nTotal, 'P')
 * and fans one job per file out to hyperlink-file-queue (see
 * HyperLinkFileProcessor). Nothing here scans a file, so a Bull timeout /
 * retry / stalled re-run of this job is harmless: the enqueue is claimed once
 * per batch (HSETNX) and every file job id is unique per run, so a second
 * orchestrator run of the same batch adds nothing. The first snapshot is
 * written BEFORE any file job exists (guarded Lua), so it can never overwrite
 * a final snapshot.
 *
 * Failure of any step (SP throws, nothing usable returned) marks the batch
 * 'F' with the reason, sends the "Hyperlink failed" notification and leaves
 * the progress key with the done TTL -- the lock can never survive an
 * exception (catch + finally safety net). A permanent Bull failure of this
 * job (stalled twice) is handled by the queue's `failed` listener in
 * GeneratehyperlinkService.
 */
@Processor('hyperlink-queue')
export class HyperLinkProcessor {
  private readonly logApp: string = 'hyperlink';
  /** file jobs are added in chunks of this size */
  static readonly ADD_CHUNK = 500;

  constructor(
    private config: ConfigService, private readonly db: DbService,
    private readonly logService: LogService,
    private readonly batch: HyperlinkBatchService,
    @InjectQueue('hyperlink-file-queue') private readonly fileQueue: Queue,
  ) { }

  @Process({ concurrency: 5 })
  async handleHyperlink(job: Job<hyperlinkBundleJob>) {
    // the run token fixes WHICH run of the scope this job belongs to: after a
    // cancel + restart the hash carries a new token and this job must do
    // nothing at all (the new run owns the batch)
    const { run: jobRun, ...rest } = job.data || ({} as hyperlinkBundleJob);
    const jobData: hyperlinkProcess = rest as hyperlinkProcess;
    const batchId = jobData.batchId;
    const progressKey = jobData.queueName;
    console.log('\n\r\n\rProcessing hyperlink for ', jobData);
    this.logService.info(`Processing hyperlink batch ${batchId} (${progressKey}), attempt ${job.attemptsMade + 1}`, this.logApp);

    let enqueueClaimed = false;
    let settled = false;   // true once the batch reached a terminal state or the file jobs own it
    let run = jobRun || '';
    try {
      const hash = await this.batch.getBatch(batchId);
      if (!hash?.run) {
        // starthyperlink always creates the hash before adding this job; a
        // missing hash means the batch was cancelled/expired meanwhile.
        this.logService.info(`Batch ${batchId} has no hash (cancelled or expired), nothing to do`, this.logApp);
        settled = true;
        return;
      }
      if (!run) run = hash.run;   // job added without a token (older starthyperlink): adopt the current run
      if (hash.run !== run) {
        this.logService.info(`Batch ${batchId}: hash belongs to run ${hash.run}, this job is run ${run}; superseded, nothing to do`, this.logApp);
        settled = true;
        return;
      }
      if (hash.cancelled === '1' || hash.finalized === '1') { settled = true; return; }

      // 1. files (SP hyperlink_getfiles, unchanged)
      const files = await this.getHyperlinkfiles({
        nBundledetailid: jobData.nBundledetailid, nBundleid: jobData.nBundleid, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid,
        cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false,
      } as hyperlinkReq);
      if (!Array.isArray(files)) throw new Error('hyperlink_getfiles returned no usable file list');
      // one job per DISTINCT file: Bull dedupes by job id, so a duplicate row
      // would otherwise leave `total` unreachable
      const seenIds = new Set<string>();
      const usable = files.filter(f => f && f.nBundledetailid && !seenIds.has(f.nBundledetailid) && seenIds.add(f.nBundledetailid));
      this.logService.info(`File length ${usable.length} for batch ${batchId}`, this.logApp);

      // 2. deep scan terms file (per section; a concurrent batch of the same
      //    section rewrites the same content, which is acceptable)
      const searchTermsPath = `${this.config.get('HYPERLINK_DB_PATH')}/search_terms${jobData.nSectionid}.txt`;
      if (jobData.isDeepscan) {
        await this.fetchHyperlinksTerms(jobData, searchTermsPath);
      }

      // 3. claim the enqueue exactly once per batch RUN (the SP above may
      //    have taken seconds: a cancel + restart meanwhile gave the hash a
      //    new run token, in which case this job is stale and must not touch
      //    the batch)
      const claim = await this.batch.claimEnqueue(batchId, usable.length, run);
      if (claim === 'stale') {
        this.logService.info(`Batch ${batchId}: superseded by a newer run while loading files, nothing to do`, this.logApp);
        settled = true;
        return;
      }
      if (claim === 'done') {
        this.logService.info(`Batch ${batchId} already enqueued by an earlier run, skipping`, this.logApp);
        settled = true;
        return;
      }
      if (claim === 'inflight') {
        // another run of this orchestrator claimed the enqueue: alive while
        // hash.enqueueAt (stamped per chunk) keeps moving. This is normally
        // the stalled re-run of a bundle job whose process died mid-enqueue:
        // once enqueueAt is older than HYPERLINK_ENQUEUE_STALE_MS take the
        // enqueue over at once (job ids of the same run dedupe, files already
        // counted are left out below, the seen set makes any double count a
        // no-op); a live concurrent enqueue is waited for (30 s at most).
        const staleMs = this.batch.enqueueStaleMs;
        let takeover = false;
        for (let i = 0; i < 60; i++) {
          const h = await this.batch.getBatch(batchId);
          if (!h || h.run !== run) { settled = true; return; }   // superseded meanwhile
          if (h.enqueueDone === '1' || h.finalized === '1') {
            this.logService.info(`Batch ${batchId} enqueued by a concurrent run, skipping`, this.logApp);
            settled = true;
            return;
          }
          const at = Number(h.enqueueAt || 0);
          if (!at || Date.now() - at > staleMs) { takeover = true; break; }
          await new Promise(r => setTimeout(r, 500));
        }
        this.logService.info(`Batch ${batchId}: concurrent enqueue ${takeover ? 'stopped moving (dead orchestrator)' : 'never finished'}, re-adding`, this.logApp);
      }
      enqueueClaimed = true;

      const base = this.batch.baseOf(jobData);
      base.batchId = batchId;
      // a re-add after a dead orchestrator: leave out the files already counted
      let toAdd = usable;
      if (claim !== 'first') {
        const seen = new Set(await this.batch.seenIds(batchId));
        if (seen.size) toAdd = usable.filter(f => !seen.has(f.nBundledetailid));
        this.logService.info(`Batch ${batchId}: re-adding ${toAdd.length} of ${usable.length} file job(s) (${seen.size} already counted)`, this.logApp);
      }
      if (usable.length === 0) {
        // nothing to scan: finish as C right away
        await this.batch.markEnqueueDone(batchId, run);
        const snap: hyperlinkProcess = { ...jobData, nTotal: 0, nCompleted: 0, nFailed: 0, jFailed: [], nFailedTruncated: false };
        await this.batch.finish(snap, 'C');
        settled = true;
        await this.batch.sendNotification(jobData.nCaseid, jobData.nMasterid, 'Hyperlink Successful', null);
        this.logService.info(`Batch ${batchId}: no files, finished`, this.logApp);
        return;
      }

      // 4. first snapshot BEFORE any file job exists: nTotal, counters from
      //    the hash, 'P' (the Lua refuses once the batch is finished /
      //    cancelled / owned by a newer run, so a final snapshot is never
      //    overwritten). The re-add path only writes it while the key still
      //    shows nTotal 0 (the popup filters those out).
      const first: hyperlinkProcess = { ...jobData, batchId, nTotal: usable.length, nCompleted: 0, nFailed: 0, cStatus: 'P', jFailed: [], nFailedTruncated: false };
      await this.batch.writeSnapshotIfRunning(first, this.batch.batchTtlSec, true, run, claim !== 'first');

      // 5. one job per file; a single-file request is served before the
      //    files of running bundles (Bull priority, lower = sooner) and
      //    batches of one class share the workers slice by slice
      //    (HYPERLINK_FAIR_CHUNK)
      const opts = {
        attempts: 2,
        backoff: { type: 'fixed' as const, delay: this.batch.fileBackoffMs },
        removeOnComplete: true,
        removeOnFail: true,
      };
      for (let i = 0; i < toAdd.length; i += HyperLinkProcessor.ADD_CHUNK) {
        const chunk = toAdd.slice(i, i + HyperLinkProcessor.ADD_CHUNK);
        // the expected set first (cancel drains by these ids; the overlap
        // check reads them); a run that lost the hash meanwhile stops here
        if (!await this.batch.recordJobs(batchId, run, chunk.map(f => f.nBundledetailid))) {
          this.logService.info(`Batch ${batchId}: superseded by a newer run during enqueue, stopping`, this.logApp);
          settled = true;
          return;
        }
        await this.fileQueue.addBulk(chunk.map((file, j) => ({
          data: <hyperlinkFileJob>{ batchId, run, progressKey, file: { nBundledetailid: file.nBundledetailid, cFilename: file.cFilename, cPath: file.cPath }, jobData: base, searchTermsPath },
          opts: { ...opts, jobId: this.batch.fileJobId(batchId, run, file.nBundledetailid), priority: this.batch.priorityOf(jobData, i + j) },
        })));
      }
      const handedOver = await this.batch.markEnqueueDone(batchId, run);
      settled = true;
      this.logService.info(`Batch ${batchId}: ${usable.length} file job(s) enqueued${handedOver ? '' : ' (batch superseded meanwhile, jobs will be skipped)'}`, this.logApp);
    } catch (error) {
      console.log('Error in hyperlink', error);
      this.logService.info(`Error in hyperlink batch ${batchId}: ${error?.message}`, this.logApp);
      await this.batch.failBatch(jobData, `orchestrator: ${error?.message || error}`, false, run);
      settled = true;
    } finally {
      // safety net: never leave a 'P' lock behind when this job did not hand
      // the batch over to the file jobs
      if (!settled) {
        try { await this.batch.failBatch(jobData, enqueueClaimed ? 'orchestrator aborted during enqueue' : 'orchestrator aborted', false, run); } catch (e) { /* logged inside */ }
      }
    }
  }

  async getHyperlinkfiles(query: hyperlinkReq): Promise<hyperlinkFiles[]> {
    query["ref"] = 2;
    let res = await this.db.executeRef('hyperlink_getfiles', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  async getHyperlinkSearchTerms(query: any): Promise<any> {
    let res = await this.db.executeRef('hyperlink_searchterms', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  async fetchHyperlinksTerms(jobData: hyperlinkProcess, searchTermsPath: string): Promise<any> {

    let res = await this.getHyperlinkSearchTerms({ nCaseid: jobData.nCaseid, nMasterid: jobData.nMasterid, nSectionid: jobData.nSectionid, cType: jobData.cType || 'E' })
    console.log('\n\r\n\rData Of  terms', res);
    if (res?.length) {
      console.log('creating search terms file');
      // Check if the file exists and delete it if it does
      if (fs.existsSync(searchTermsPath)) {
        fs.unlinkSync(searchTermsPath);
      }
      const search_terms = res.flatMap((a) => {
        if (!a.cTerm) return [];
        return a.cTerm.split(',').map(t => t.trim()).filter(t => t.length > 0);
      });
      await fsp.writeFile(searchTermsPath, search_terms.join('\n'));
      console.log('File Written');
    }
    return true;
  }
}
