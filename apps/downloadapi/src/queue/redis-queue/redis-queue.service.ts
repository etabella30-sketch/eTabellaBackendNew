import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import Bull, { Queue, Job, JobOptions } from 'bull';
import * as Bull from 'bull';
@Injectable()
export class RedisQueueService implements OnModuleInit, OnModuleDestroy {

    RETRY = 3;
    RETRY_DELAY = 1000; // 1 second
    CONCURRENCY = 5;
    QUEUE_NAME: string = 'DOWNLOAD-QUEUE';
    JOB_OPTIONS: any = {};
    PRIAMRY_JOB_KEY: string;
    private customQueue: Bull.Queue;
    private readonly logger = new Logger('queue');
    private readonly redisConfig = { host: this.configService.get<string>('REDIS_IP'), port: this.configService.get<number>('REDIS_PORT'), password: this.configService.get<string>('REDIS_PASSWORD') };
    constructor(protected readonly configService: ConfigService) {

    }


    setUpConfig(obj: { key: string, primaryKey: string, jobOptions: any, concurrency: number, retry?: number, retry_delay?: number }): string {
        this.QUEUE_NAME = obj?.key; //`download:${nDPid}:queue`
        this.PRIAMRY_JOB_KEY = obj?.primaryKey; //`download:${nDPid}:queue`
        this.JOB_OPTIONS = obj?.jobOptions || {};
        this.CONCURRENCY = obj?.concurrency || this.CONCURRENCY;
        this.RETRY = obj?.retry || this.RETRY;
        this.RETRY_DELAY = obj?.retry_delay || this.RETRY_DELAY;
        return this.QUEUE_NAME;
    }


    async inilitializeQueue(): Promise<Bull.Queue> {
        this.logger.fatal('Initializing Redis download queue...');
        // 1. create your queue

        this.customQueue = new Bull(this.QUEUE_NAME, {
            redis: this.redisConfig,
            // Recovery tuning. Bull renews a live worker's lock automatically, so
            // lockDuration only governs how fast a DEAD worker's job is noticed;
            // maxStalledCount is how many worker deaths a job survives before it
            // is failed with "job stalled more than allowable limit" (Bull default
            // is 1 — a single deploy mid-package used to kill the job for good).
            settings: {
                lockDuration: 120_000,
                stalledInterval: 30_000,
                maxStalledCount: 3,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        });

        /* this.customQueue.process(this.CONCURRENCY, async (job: Bull.Job) => {
             // const { fileId } = job.data;
 
 
             await this.performTask(job)
 
 
             return { success: true };
         });*/

        this.customQueue.on('completed', (job, result) => {
            this.checkQueueEmpty();
            // console.log(`✅ Job ${job.id} completed:`, result);
        });
        this.customQueue.on('failed', (job, err) => {
            this.checkQueueEmpty();
            // console.error(`❌ Job ${job.id} failed:`, err.message);
        });

        return this.customQueue
    }


    async processTasks(nDPid: string, tasks: any, jobIdKey: string): Promise<void> {
        this.logger.fatal(`Processing tasks for nDPid=${nDPid} with ${tasks.length} tasks`);
        if (!tasks?.length) {
            return;
        }

        // Prepare bulk job specs
        const jobs = tasks.map(task => ({
            // optional: give each job a name, or omit to use the default
            // name: `download-${nDPid}`,
            data: { nDPid, ...task },
            opts: {
                jobId: String(task[jobIdKey]),
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            } as Bull.JobOptions,
        }));

        try {
            await this.customQueue.addBulk(jobs);
            console.log(`Enqueued ${jobs.length} download tasks for pid ${nDPid}`);
        } catch (err) {
            throw new Error(`Error pushing tasks to Redis queue: ${err.message}`);
        }
    }


    onModuleInit() {
    }



    /**
     * Wipe every job/key of `queue` (waiting, active, delayed, failed, locks).
     * Used when a batch is restarted from scratch: jobs carry a stable jobId,
     * so addBulk onto a queue that still holds the previous (dead) run's jobs
     * would silently no-op and the batch would never finish.
     * Call BEFORE registering the processor so no worker grabs a stale job.
     * Bull's obliterate pauses the queue first; resume so new jobs flow.
     */
    async resetQueue(queue: Bull.Queue): Promise<void> {
        try {
            await queue.obliterate({ force: true });
            await queue.resume();
            this.logger.warn(`Reset queue ${queue.name}`);
        } catch (err) {
            throw new Error(`Error resetting queue ${queue.name}: ${err.message}`);
        }
    }

    /**
     * Re-drive what a previous (killed/restarted) worker left in `queue`.
     * Used on the retry path where the "already added" flag blocks a fresh
     * addBulk: a job left in `failed` (e.g. "job stalled more than allowable
     * limit") is otherwise never touched again and the parent hangs until its
     * own timeout. Stalled `active` jobs are re-queued by Bull's stalled
     * checker (see maxStalledCount in inilitializeQueue); `failed` ones need an
     * explicit retry. Returns the post-recovery counts so the caller can tell
     * whether anything is left to run at all.
     */
    async recoverExistingJobs(queue: Bull.Queue): Promise<{ retried: number; remaining: number; failed: number }> {
        const failedJobs = await queue.getFailed();
        let retried = 0;
        for (const job of failedJobs) {
            try {
                await job.retry();
                retried++;
            } catch (err) {
                this.logger.error(`Could not retry failed job ${job.id} in ${queue.name}: ${err.message}`);
            }
        }
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        this.logger.warn(`Recovered ${queue.name}: retried=${retried} waiting=${counts.waiting} active=${counts.active} delayed=${counts.delayed} failed=${counts.failed}`);
        return { retried, remaining, failed: counts.failed };
    }

    protected performTask(job: Bull.Job) {
        // override this method in your service to perform the actual task
    }


    // clean up when the app shuts down
    async onModuleDestroy() {
        await this.customQueue.close();
    }




    /** Call this after each job to see if the queue is truly empty. */
    private async checkQueueEmpty() {
        const counts = await this.customQueue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {
            // this.logger.log(`🎉 All jobs drained for queue (queue=${this.QUEUE_NAME}).`);
            this.queuDrained(this.PRIAMRY_JOB_KEY, this.JOB_OPTIONS);
            // 👇 if you need to update Redis or fire another event, do it here:
            // await this.redisService.markAllBatchesCompleted(nDPid);
        }
        /*const [waiting, active, delayed] = await Promise.all([
            this.customQueue.getWaitingCount(),
            this.customQueue.getActiveCount(),
            this.customQueue.getDelayedCount(),
        ]);

        this.logger.debug(`Queue counts — waiting: ${waiting}, active: ${active}, delayed: ${delayed}`);

        if (waiting + active + delayed === 0) {
            // this.onDrain();
        }*/
    }



    protected queuDrained(PRIAMRY_JOB_KEY: string, JOB_OPTIONS: any = {}) {
        // override this method in your service to perform the actual task
    }


    async AllBatchCompleted(nDPid: string): Promise<boolean> {
        try {
            const largeQueue = new Bull(`download:${nDPid}:large-batches`, {
                redis: this.redisConfig
            });

            const smallQueue = new Bull(`download:${nDPid}:small-batches`, {
                redis: this.redisConfig
            });

            const largeCounts = await largeQueue.getJobCounts();
            const largeRemaining = largeCounts.waiting + largeCounts.active + largeCounts.delayed;

            const smallCounts = await smallQueue.getJobCounts();
            const smallRemaining = smallCounts.waiting + smallCounts.active + smallCounts.delayed;

            if (largeRemaining == 0 && smallRemaining == 0) {
                this.logger.log(`All batches completed for nDPid=${nDPid}`);
                return true;
            }
            this.logger.log(`Batches not completed for nDPid=${nDPid}: large remaining=${largeRemaining}, small remaining=${smallRemaining}`);
            return false;
        } catch (error) {
            this.logger.error(`Error initializing large batch queue for nDPid=${nDPid}: ${error.message}`);
            throw new Error(`Error checking if all batches are completed for nDPid=${nDPid}: ${error.message}`);
        }


    }


    async isJobsAlreadyAdded(): Promise<boolean> {
        try {
            const counts = await this.customQueue.getJobCounts();
            const isHaveJobs = counts.waiting + counts.active + counts.delayed + counts.failed + counts.completed;
            return isHaveJobs > 0;
        } catch (error) {
            this.logger.error(`Error checking if queue has jobs: ${error.message}`);
            throw new Error(`Error checking if queue has jobs: ${error.message}`);
        }
    }


    


}