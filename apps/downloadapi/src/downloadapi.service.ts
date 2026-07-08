import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, InternalServerErrorException, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { deleteJobReq, downloadJobReq, downloadJobsListReq, downloadReq, getUrlReq, retryJobReq, StopJobReq } from './DTOs/download.dto';
import { schemaType } from '@app/global/interfaces/db.interface';
import { ProcessStatusService } from './services/process-status/process-status.service';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { downloadQueuePayload } from './interfaces/download.interface';
import { ProcessDataService } from './services/process-data/process-data.service';
import { RedisService } from './util/redis/redis.service';
import { LogService } from '@app/global/utility/log/log.service';
import { S3Service } from './services/s3/s3.service';

@Injectable()
export class DownloadapiService implements OnApplicationShutdown, OnApplicationBootstrap {
  schema: schemaType = 'download';
  private readonly logger = new Logger('downlaod-service');
  constructor(private readonly db: DbService, private readonly processStatus: ProcessStatusService,
    @InjectQueue('download-queue') private downloadQueue: Queue,
    private processData: ProcessDataService, private redis: RedisService,
    private logService: LogService,
    private readonly s3Service: S3Service,
    @InjectQueue('delete-tar-queue') private deleteTarQueue: Queue
  ) {
  }

  async startDownloadJob(body: downloadJobReq): Promise<{ msg: number, value: string, error?: any }> {
    this.logger.log('Start download job', body);
    await this.pushToQueue(body.jobId, body.nMasterid);
    return { msg: 1, value: 'Download job started successfully' };
  }


  async insertDownloadJob(body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
    this.logger.log('Inserting download job', body);

    const res = await this.db.executeRef('insert_download_process', body, this.schema);
    if (res.success) {
      try {
        if (res.data[0][0]["msg"] == 1) {

          const isExistingJob = res.data[0][0]["isExistingJob"];
          if (!isExistingJob) {
            await this.applyPackageName(res.data[0][0]["nDPid"], body.cZipname);
            const { totalFiles } = await this.setUpBatch(res.data[0][0]["nDPid"], body);


            if (totalFiles <= 0) {
              this.logger.error('No files found for the download job', body);
              await this.processStatus.updateStatus(res.data[0][0]["nDPid"], 'F');
              throw new InternalServerErrorException('No files found for the download job');
            }


            await this.redis.processSetup(res.data[0][0]["nDPid"], totalFiles);
            await this.pushToQueue(res.data[0][0]["nDPid"], body.nMasterid);
          }
          try {
            await this.redis.addSubscriber(res.data[0][0]["nDPid"], body.nMasterid);
          } catch (error) {

          }

          return res.data[0][0];
        } else {
          this.logger.error('Failed to insert download job', res.data[0]);
          throw new InternalServerErrorException(res.data[0][0]["value"]);
        }
      } catch (error) {
        this.logger.error('Error processing insert download job response', error);
        throw new InternalServerErrorException(error.message, error.message);
      }
    } else {
      this.logger.error('Database error while inserting download job', res.error);
      throw new InternalServerErrorException(res?.error);
    }
  }


  /**
   * Caller-supplied package display name → ProcessMaster."cZipname" (drives
   * both the Outputs-list row name and the final archive filename via
   * finalArchiveName). Sanitized here; blank/absent keeps the SP default
   * (case name at list time). Never overwrites an existing name.
   */
  async applyPackageName(nDPid: string, cZipname?: string): Promise<void> {
    const name = String(cZipname ?? '').replace(/[^\w \-().]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
    if (!nDPid || !name) return;
    try {
      await this.db.rowQuery(
        'update download."ProcessMaster" set "cZipname" = $2 where "nDPid" = $1 and coalesce("cZipname", \'\') = \'\'',
        [nDPid, name],
      );
    } catch (error) {
      this.logger.error(`Failed to set package name for ${nDPid}`, error); // non-fatal
    }
  }

  async pushToQueue(nDPid: string, nMasterid: string): Promise<void> {
    try {
      this.logger.log(`Pushing download job ${nDPid} to queue`);
      const payload: downloadQueuePayload = { nDPid, nMasterid };
      await this.downloadQueue.add(payload, { jobId: String(nDPid), removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: { type: 'fixed', delay: 1000 * 3 } }); //, delay: 20 * 1000 
      // For now, we will just log the action
      this.logger.log(`Download job ${nDPid}  pushed to queue successfully`);
    } catch (error) {
      this.logger.error(`Error pushing download job ${nDPid}  to queue`, error);
      this.processStatus.updateStatus(nDPid, 'F')
    }
  }


  async setUpBatch(nDPid: string, body: downloadReq): Promise<{ totalFiles: number }> {
    const function_name = body.isHyperlink ? 'insert_download_process_files_hyperlink' : 'insert_download_process_files';
    const res = await this.db.executeRef(function_name, { ...body, nDPid }, this.schema);
    if (res.success) {
      this.logger.log(`Batch setup for download job ${nDPid} completed successfully`);
      return { totalFiles: res.data[0][0].totalFiles };
    } else {
      this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
      throw new InternalServerErrorException('Failed to set up batch for download job', res.error);
    }

  }


  async onApplicationBootstrap() {
    // 1. Grab all stuck “active” jobs …
    try {
      let stuck: Job[] = await this.downloadQueue.getJobs(['active']);

      if (!stuck.length) {
        this.logger.log('No active jobs to recover');
        return;
      }

      // 2. Sort by original enqueue time (ascending)
      stuck = stuck.sort((a, b) => a.timestamp - b.timestamp);

      this.logger.log(`Recovering ${stuck.length} stuck job(s) in order…`);
      // 3. Fail→retry each, one at a time
      for (const job of stuck) {
        this.logger.log(` ↪ re-queuing job ${job.id} (created @ ${new Date(job.timestamp).toISOString()})`);
        // this moves it to failed, increments its attempt count, then re-queues
        // await job.moveToFailed(new Error('Recover on restart'), false);
        // await job.releaseLock();
        await job.moveToFailed({ message: 'Recover on restart' }, true);
        // or simply:
        // await job.retry();
        // —— or you can use —— await job.retry();
      }
    } catch (error) {
      this.logger.error('Error during application bootstrap', error);

    }

  }


  async onApplicationShutdown(signal?: string) {
    console.log('🔔 Shutting down, closing download-queue …');
    // This will wait for any running jobs to finish or mark them stalled,
    // then release locks so they can be re-processed on next start.
    await this.downloadQueue.close();
  }



  async getDownloadJobs(query: downloadJobsListReq): Promise<any[]> {
    this.logger.log('Fetching download jobs', query);
    try {

      const res = await this.db.executeRef('get_download_jobs', query, this.schema);
      if (res.success) {
        const jobs = res.data[0];

        for (const job of jobs) {
          try {
            if (job.cStatus != 'C') {
              const jobSummary = await this.redis.getQueueSummary(job.nDPid);
              job.totalFiles = jobSummary?.total || 0;
              job.lastUpdated = jobSummary?.lastUpdated;
              job.queueStatus = jobSummary?.queueStatus;
              job.totalParts = Number(jobSummary?.totalParts || 0);
              job.completedParts = Number(jobSummary?.completedParts || 0);
              job.actionStatus = jobSummary?.actionStatus;

              job.MergeCompletedParts = Number(jobSummary?.MergeCompletedParts || 0);
              job.MergeTotalParts = Number(jobSummary?.MergeTotalParts || 0);


              if (!job.dStartDt && jobSummary?.dStartDt) {
                job.dStartDt = jobSummary?.dStartDt || null;
              }


              if (!job.totalSize && jobSummary?.totalSize) {
                job.totalSize = jobSummary?.totalSize || 0;
              }

            }
          } catch (error) {
            this.logger.error(`Error fetching queue summary for job ${job.nDPid}`, error);
          }
        }


        return res.data[0];
      } else {
        this.logger.error('Failed to fetch download jobs', res.error);
        throw new InternalServerErrorException(res.error);
      }
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }


  async getDownloadUrl(query: getUrlReq): Promise<{ cUrl: string }> {
    this.logger.log('Fetching download job presigned url', query);
    try {
      // 1) Validate the job exists and is ready (the SP returns a stored cUrl
      //    marker written at completion). Keeps the existing readiness/existence
      //    semantics — but we do NOT hand out that stored value.
      const res = await this.db.executeRef('get_download_presigned_url', query, this.schema);
      if (!res.success) {
        this.logger.error('Failed to fetch download job', res.error);
        throw new InternalServerErrorException(res.error);
      }
      if (!res.data?.[0]?.[0]?.["cUrl"]) {
        this.logger.error('No download available for the given nDPid', query.nDPid);
        throw new InternalServerErrorException('No presigned URL found for the given nDPid');
      }

      // 2) Mint a FRESH short-TTL URL from the actual object key. Never return
      //    the long-lived stored URL. If the archive has been lifecycle-expired
      //    or deleted, the key won't resolve → surface a regenerate-able error.
      const key = await this.s3Service.resolveArchiveKey(query.nDPid);
      if (!key) {
        this.logger.warn(`Archive for nDPid=${query.nDPid} is no longer available (expired/deleted).`);
        throw new InternalServerErrorException('This download has expired. Please regenerate it.');
      }
      const cUrl = await this.s3Service.getPresignedUrl(key);
      return { cUrl };
    } catch (error) {
      throw new InternalServerErrorException(error?.message);
    }
  }


  /* async retryFailedJob(
     body: retryJobReq
   ): Promise<{ msg: number; value: string; error?: any }> {
     try {
       // 1) your DB‐side setup
       const dbRes = await this.db.executeRef('process_retry', body, this.schema);
       if (!dbRes.success) {
         this.logger.error(`DB setup failed for nDPid=${body.nDPid}`, dbRes.error);
         return { msg: -1, value: 'Failed to retry', error: dbRes.error };
       }
       const value = dbRes.data?.[0]?.[0]?.value ?? '';
 
       // 2) try to fetch the job by its ID
       const job = await this.downloadQueue.getJob(body.nDPid);
 
       if (job) {
         const state = await job.getState();
 
         if (state === 'failed') {
           // 3a) clean retry
           await job.retry();
           this.logger.log(`Retried failed job id=${job.id} for nDPid=${body.nDPid}`);
           return { msg: 1, value };
         }
 
         if (['active', 'waiting', 'delayed'].includes(state)) {
           // 3b) it’s stuck or in flight—remove & re-queue
           this.logger.warn(
             `Job id=${job.id} for nDPid=${body.nDPid} is in state=${state}. Removing & re-enqueueing.`
           );
           await job.remove();
         } else {
           // 3c) any other state (completed, etc.)—treat similarly
           this.logger.warn(
             `Job id=${job.id} for nDPid=${body.nDPid} is in state=${state}. Re-enqueueing fresh job.`
           );
         }
       } else {
         // 4) never existed → fresh enqueue
         this.logger.warn(`No job found for nDPid=${body.nDPid}. Enqueueing new job.`);
       }
 
       // 5) (re)enqueue a fresh job with the same jobId so next getJob() will find it
       await this.downloadQueue.add(
         'download',               // ← replace with your named processor if you use named jobs
         { nDPid: body.nDPid },    // ← payload shape your processor expects
         { jobId: body.nDPid }     // so that getJob(body.nDPid) will retrieve this one
       );
       return { msg: 1, value };
 
     } catch (err) {
       this.logger.error(
         `Error in retryFailedJob for nDPid=${body.nDPid}`,
         (err as Error).stack || err
       );
       return { msg: -1, value: 'Failed to retry', error: (err as Error).message || err };
     }
   }*/
  /**
   * Mark the job as failed so that Bull will re-enqueue it according to
   * its `attempts`/`backoff` settings on next tick.
   */
  async retryFailedJob(
    body: retryJobReq
  ): Promise<{ msg: number; value?: string; error?: any }> {
    try {
      // First, do your DB setup as before
      const dbRes = await this.db.executeRef('process_retry', body, this.schema);
      if (!dbRes.success) {
        this.logger.error(`DB setup failed for nDPid=${body.nDPid}`, dbRes.error);
        return { msg: -1, error: dbRes.error };
      }
      const value = dbRes.data?.[0]?.[0]?.value ?? '';

      // Fetch the job by its jobId
      const job = await this.downloadQueue.getJob(body.nDPid);
      if (!job) {
        this.logger.warn(`No job found for nDPid=${body.nDPid}`);
        return { msg: -1, error: 'Job not found' };
      }

      const state = await job.getState();
      this.logger.log(`Job id=${job.id} is in state="${state}", moving to failed…`);

      // Mark it as failed. 
      // Pass removeOnFail=false so Bull keeps the job in the failed list,
      // then immediately schedules a retry if attempts remain.
      await job.moveToFailed(
        new Error('Recover on restart'),
      /* removeOnFail */ false,
      );
      // await this.downloadQueue.retryJob(body.nDPid);

      this.logger.log(`Job id=${job.id} marked failed; will retry per backoff rules`);
      return { msg: 1, value };
    } catch (err) {
      try {
        await this.stopAndRemoveJob({ nDPid: body.nDPid });
      } catch (error) {
        this.logger.error(
          `Error stopping job for nDPid=${body.nDPid} during retryFailedJob
          `,
          (error as Error).stack || error
        );
      }

      try {
        await this.pushToQueue(body.nDPid, body.nMasterid);
        this.logger.log(`Re-queued job for nDPid=${body.nDPid}`);
      } catch (error) {
        this.logger.error(
          `Error re-queuing job for nDPid=${body.nDPid} during retryFailedJob`,
          (error as Error).stack || error
        );
      }
      this.logger.error(
        `Error in failAndRecoverJob for nDPid=${body.nDPid}`,
        (err as Error).stack || err
      );
      return { msg: -1, error: (err as Error).message || err };
    }
  }

  async stopAndRemoveJob(
    body: StopJobReq
  ): Promise<{ msg: 1 | -1; error?: any }> {
    try {
      // 1) look up the job by its ID (nDPid)
      const job = await this.downloadQueue.getJob(body.nDPid);
      if (!job) {
        this.logger.warn(`Job not found for nDPid=${body.nDPid}`);
        return { msg: -1, error: 'Job not found' };
      }

      // 2) if it’s actively processing, mark it as failed (so your processors stop)
      const state = await job.getState();
      this.logger.log(`Job id=${job.id} is in state="${state}"`);
      if (state === 'active') {
        await job.moveToFailed(
          new Error('Stopped by user request'),
        /* ignoreLock */ false
        );
        this.logger.log(`Marked job id=${job.id} as failed`);
      }

      // 3) now remove it directly from the queue—this won’t error if it’s already gone
      await this.downloadQueue.removeJobs(body.nDPid);
      this.logger.log(`Completely removed job id=${body.nDPid} from queue`);

      return { msg: 1 };
    } catch (err) {
      this.logger.error(
        `Error stopping/removing job for nDPid=${body.nDPid}`,
        (err as Error).stack || err
      );
      return { msg: -1, error: (err as Error).message || err };
    }
  }

  // async retryFailedJob(body: retryJobReq): Promise<{ msg: number, value: string, error?: any }> {
  //   try {
  //     const res = await this.db.executeRef('process_retry', body, this.schema);
  //     if (res.success) {
  //       const targetJobs: Job = await this.downloadQueue.getJob(body.nDPid);

  //       if (!targetJobs) {
  //         this.logger.warn(`No failed job found for nDPid ${body.nDPid}`);
  //         return { msg: -1, value: 'Failed to retry', error: 'No failed job found for the given nDPid' };
  //       } else {
  //         await targetJobs.retry();
  //         this.logger.log(`Retried job ${body?.nDPid}`);
  //       }
  //       return { msg: 1, value: res.data[0][0]["value"] };
  //     } else {
  //       this.logger.error(`Failed to set up batch for download job ${body?.nDPid}`, res.error);
  //       return { msg: -1, value: 'Failed to retry', error: res?.error || 'Failed to retry jobs' };
  //     }
  //   } catch (error) {
  //     this.logger.error(`Error retrying jobs for nDPid ${body?.nDPid}`, error);
  //     return { msg: -1, value: 'Failed to retry', error: error?.message || 'Failed to retry jobs' };
  //   }
  // }

  async deleteJob(body: deleteJobReq): Promise<any> {

    const res = await this.db.executeRef('delete', body, this.schema);
    if (res.success) {

      try {
        // A deleted output must never leave bytes behind in Spaces. Always clear
        // the job's <nDPid>/ folder in the downloads bucket — deleteFolder is
        // idempotent and per-job scoped, so it's safe even when the SP didn't flag
        // isNeedToClear. Previously that flag was the ONLY trigger, so packages
        // whose SP didn't set it left their tar lingering in S3 after "Delete".
        await this.deleteTarQueue.add({ isJobDelete: true, nDPid: body.nDPid }, {
          jobId: body.nDPid, removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: { type: 'fixed', delay: 1000 * 2 }
        });
        return { msg: 1, value: res.data[0][0]["value"] };
      } catch (error) {
        this.logger.error(`Error adding job to deleteTarQueue for nDPid ${body.nDPid}`, error);
        return { msg: -1, value: 'Failed to delete job', error: error.message || 'Failed to delete job' };
      }

    } else {
      return new InternalServerErrorException(res.error);
    }

  }


}