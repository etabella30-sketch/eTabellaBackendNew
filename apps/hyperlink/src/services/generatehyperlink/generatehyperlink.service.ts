import { Injectable } from '@nestjs/common';
import { cancelhyperlinkReq, gethyperlinkReq, hyperlinkBundleJob, hyperlinkProcess, hyperlinkReq } from '../../interfaces/hyperlink.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { HyperlinkBatchService } from '../batch/hyperlink-batch.service';

/**
 * Entry points of the hyperlink pipeline.
 *
 * v2 (starthyperlink / deephyperlink): one BATCH per request, locked per scope
 * (single file > bundle > whole section) through the progress key with a TTL
 * and a stale check, then one short orchestrator job on hyperlink-queue that
 * fans the files out to hyperlink-file-queue. cancelhyperlink stops a batch.
 *
 * Legacy (indexhyperlink / kafka hyperlink-index-responce): untouched, still
 * one job on hyperlink-index-queue with the old lock key shape.
 */
@Injectable()
export class GeneratehyperlinkService {

  constructor(
    private readonly redisDbService: RedisDbService,
    @InjectQueue('hyperlink-queue') private hyperlinkQueue: Queue,
    @InjectQueue('hyperlink-index-queue') private hyperlinkIndexQueue: Queue,
    @InjectQueue('hyperlink-file-queue') private fileQueue: Queue,
    private readonly batch: HyperlinkBatchService,
  ) {
    this.hyperlinkQueue.on('completed', (job) => {
      console.log(`Job with ID ${job.id} has completed`);
    });

    this.hyperlinkQueue.on('failed', (job, err) => {
      console.log(`Job with ID ${job?.id} failed with error: ${err?.message}`);
      // the orchestrator catches everything itself; what Bull fails for good
      // (stalled more than allowed / last attempt) must not leave a 'P' lock
      // behind unless the file jobs already own the batch (enqueueDone)
      const data: hyperlinkBundleJob = job?.data;
      const terminal = /stalled more than/i.test(String(err?.message)) || Number(job?.attemptsMade || 0) >= Number(job?.opts?.attempts || 1);
      if (data?.batchId && terminal) {
        // run-aware: a job of a superseded run (cancel + restart) must not fail the new batch
        this.batch.failBatch(data, `bull: ${err?.message}`, true, data.run || '').catch(e => console.log('failBatch error', e?.message));
      }
    });

    this.hyperlinkQueue.on('stalled', (job) => {
      console.log(`Job with ID ${job.id} stalled`);
    });
    this.hyperlinkQueue.on('waiting', (jobId) => {
      console.log(`Job with ID ${jobId} is waiting to be processed`);
    });
    this.hyperlinkQueue.on('active', (job, jobPromise) => {
      console.log(`Job with ID ${job.id} has started processing`);
    });

    this.hyperlinkQueue.on('paused', () => {
      console.log('The queue has been paused');
    });
    this.hyperlinkQueue.on('resumed', () => {
      console.log('The queue has been resumed');
    });
    this.hyperlinkQueue.on('removed', (job) => {
      console.log(`Job with ID ${job.id} has been removed from the queue`);
    });

    this.hyperlinkQueue.on('delayed', (jobId) => {
      console.log(`Job with ID ${jobId} is delayed`);
    });
    this.hyperlinkQueue.on('drained', () => {
      console.log('The queue has been drained (no more jobs to process)');
    });

    this.hyperlinkQueue.on('error', (error) => {
      console.error('An error occurred in the queue:', error);
    });

    // file queue: thousands of jobs per batch, so only the exceptional events
    this.fileQueue.on('failed', (job, err) => {
      console.log(`File job ${job?.id} failed with error: ${err?.message}`);
    });
    this.fileQueue.on('stalled', (job) => {
      console.log(`File job ${job?.id} stalled`);
    });
    this.fileQueue.on('error', (error) => {
      console.error('An error occurred in the file queue:', error);
    });
  }



  async starthyperlink(body: hyperlinkReq, isIndex: boolean, isDeepscan?: boolean, isSmartscan?: boolean): Promise<any> {
    console.log('Hyperlink req', body)

    if (!body.nSectionid) {
      return { msg: -1, value: 'nSectionid is required' };
    }

    // ---- legacy index path: exactly as before ------------------------------
    if (isIndex) {
      const HYPERLINK_JOB_TIMEOUT_MS = 1000 * 60 * 60 * 12;
      const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}/${body.nSectionid}/${body.nBundledetailid || null}`;
      const dataHyperlink = await this.redisDbService.getValue(name);
      if (dataHyperlink) {
        // the key is shared with the v2 single-file scope, which keeps its
        // final C/F/X snapshot for the done TTL: only a running one blocks
        let running = true;
        try { const cur = JSON.parse(dataHyperlink); running = !cur || !cur.cStatus || cur.cStatus === 'P'; } catch (error) { running = true; }
        if (running) return { msg: -1, value: 'Hyperling already in progress' };
      }
      const legacy: hyperlinkProcess = {
        queueName: name, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nMasterid: body.nMasterid,
        nBundledetailid: body.nBundledetailid, nBundleid: body.nBundleid, cType: body.cType,
        nTotal: 0, nCompleted: 0, nFailed: 0, cStatus: 'P', cKeeptype: body.cKeeptype || 'R',
        isDeepscan: isDeepscan, isSmartscan: isSmartscan || false,
      };
      try {
        await this.hyperlinkIndexQueue.add(legacy, { removeOnComplete: true, removeOnFail: true, timeout: HYPERLINK_JOB_TIMEOUT_MS, attempts: 3, backoff: 1000 * 60 * 5 });
        await this.redisDbService.setValue(name, JSON.stringify(legacy));
        return { msg: 1, value: 'Hyperlink process started', data: legacy };
      } catch (error) {
        return { msg: -1, value: 'Failed to start hyperlink process', error: error.message };
      }
    }

    // ---- v2 batch path -------------------------------------------------------
    // the lock check + batch creation of one section run one at a time (a
    // bundle and one of its files requested in the same instant must not
    // both pass the overlap check)
    const sectionToken = await this.batch.lockSection(body);
    if (!sectionToken) {
      return { msg: -1, value: 'Hyperling already in progress' };
    }
    try {
      return await this.startBatch(body, isDeepscan, isSmartscan);
    } finally {
      await this.batch.unlockSection(body, sectionToken);
    }
  }

  /** v2: lock / stale / overlap checks, batch creation and the orchestrator job (called under the section mutex). */
  private async startBatch(body: hyperlinkReq, isDeepscan?: boolean, isSmartscan?: boolean): Promise<any> {
    const batchId = this.batch.batchIdFor(body);
    const name = this.batch.progressKeyFor(body);
    let staleReleased = false;

    // 1. the same scope, started by this or by any other admin (hash.owner)
    const current = await this.batch.findRunning(batchId, name);
    if (current) {
      if (await this.batch.isStale(current, this.fileQueue, this.hyperlinkQueue, this.hyperlinkIndexQueue)) {
        // dead batch (worker crash before finalize): release it and go on
        console.log(`Hyperlink batch ${current.batchId || batchId} is stale (last update ${current.dUpdate}), releasing`);
        await this.batch.finish(current, 'F', 'stale');
        staleReleased = true;
      } else {
        return { msg: -1, value: 'Hyperling already in progress', data: current };
      }
    }
    // 2. overlapping scopes of the section (whole section vs bundle / file,
    //    bundle vs one of its files): the same file must not be scanned by
    //    two batches at once
    const conflicts = await this.batch.findConflicts(body, batchId, this.fileQueue, this.hyperlinkQueue);
    if (conflicts.length) {
      return { msg: -1, value: 'Hyperling already in progress', data: conflicts[0] };
    }

    const obj: hyperlinkProcess = {
      queueName: name,
      nCaseid: body.nCaseid,
      nSectionid: body.nSectionid,
      nMasterid: body.nMasterid,
      nBundledetailid: body.nBundledetailid,
      nBundleid: body.nBundleid,
      cType: body.cType,
      nTotal: 0,
      nCompleted: 0,
      nFailed: 0,
      cStatus: 'P',
      cKeeptype: body.cKeeptype || 'R',
      isDeepscan: !!isDeepscan,
      isSmartscan: !!isSmartscan,
      batchId,
    };
    // lock + hash first (the orchestrator expects the hash), then the job
    const run = await this.batch.createBatch(obj);
    if (!run) {
      return { msg: -1, value: 'Hyperling already in progress' };
    }
    try {
      // the job carries the run token so an orchestrator that starts (or is
      // still loading files) after a cancel + restart knows it is superseded
      const bundleJob: hyperlinkBundleJob = { ...obj, run };
      await this.hyperlinkQueue.add(bundleJob, { removeOnComplete: true, removeOnFail: true, attempts: 1 });
      return { msg: 1, value: 'Hyperlink process started', data: obj, ...(staleReleased ? { staleReleased: true } : {}) };
    } catch (error) {
      // never leave the lock behind when the job could not be queued
      try { await this.batch.finish(obj, 'F', `queue: ${error?.message}`); } catch (e) { /* best effort */ }
      return { msg: -1, value: 'Failed to start hyperlink process', error: error.message };
    }
  }

  /**
   * POST /cancelhyperlink: same scope rule as starthyperlink. Idempotent; the
   * batch hash carries the owner key, so any admin of the case can cancel.
   */
  async cancelhyperlink(body: cancelhyperlinkReq): Promise<any> {
    if (!body.nSectionid || !body.nCaseid) {
      return { msg: -1, value: 'nCaseid and nSectionid are required' };
    }
    const batchId = this.batch.batchIdFor(body);
    return await this.batch.cancel(batchId, this.fileQueue);
  }



  async getHyperLinkProgress(body: gethyperlinkReq) {
    const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}`;
    const dataHyperlinkList = await this.redisDbService.getAllValuesWithPrefix(name) || [];
    console.log(name, dataHyperlinkList)
    if (dataHyperlinkList && dataHyperlinkList.length) {
      return { msg: 1, value: dataHyperlinkList };
    } else {
      return { msg: -1, value: 'Hyperling not in progress' };
    }
  }


}
