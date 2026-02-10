import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ProcessStatusService } from '../process-status/process-status.service';
import { downloadQueuePayload } from '../../interfaces/download.interface';
import { RedisService } from '../../util/redis/redis.service';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class QueueListenerService implements OnModuleInit {
    private readonly logger = new Logger('listener-service');

    constructor(
        @InjectQueue('download-queue')
        private readonly downloadQueue: Queue, private readonly processStatus: ProcessStatusService,
        private readonly redisService: RedisService, private readonly logService: LogService
    ) { }

    onModuleInit() {
        this.downloadQueue.on('completed', async (job: Job) => {
            this.logger.fatal(`Job ${job.id} completed`);
            this.logService.warn(`Job ${job.id} completed`, `queue/${job.id}`);
            try {
                // const payload: downloadQueuePayload = job.data;
                await this.processStatus.updateStatus(String(job.id), 'C');
                await this.redisService.updateQueueStatus(String(job.id), 'completed');
            } catch (error) {
                this.logger.error(`Error processing completed job ${job.id}`, error);
                this.logService.error(`Error processing completed job ${job.id}`, `queue/${job.id}`);
            }
        });

        this.downloadQueue.on('failed', async (job: Job, err: Error) => {
            try {
                // this.logger.error(`Job ${job.id} failed: ${err.message}`);
                const { attemptsMade, opts: { attempts = 0 } } = job;
                const isFinal = attemptsMade >= attempts;

                await this.redisService.retryAttempts(String(job.id));
                if (isFinal) {
                    this.logService.error(`Job ${job.id} permanently failed after ${attemptsMade} attempts: ${err.message}`, `queue/${job.id}`);
                    this.logger.error(
                        `Job ${job.id} permanently failed after ${attemptsMade} attempts: ${err.message}`
                    );
                    // const payload: downloadQueuePayload = job.data;
                    await this.processStatus.updateStatus(String(job.id), 'F');
                    // ...do your “give-up” logic here...
                    await this.redisService.updateQueueStatus(String(job.id), 'failed');
                } else {
                    this.logger.warn(
                        `Job ${job.id} attempt ${attemptsMade}/${attempts} failed: ${err.message}`
                    );
                    this.logService.error(`Job ${job.id} attempt ${attemptsMade}/${attempts} failed: ${err.message}`, `queue/${job.id}`);
                }
            } catch (error) {

            }

        });

        this.downloadQueue.on('stalled', async (job: Job) => {
            this.logger.warn(`Job ${job.id} stalled`);
            this.logService.warn(`Job ${job.id} stalled`, `queue/${job.id}`);
            try {
                // const payload: downloadQueuePayload = job.data;
                await this.redisService.updateQueueStatus(String(job.id), 'stalled');
            } catch (error) {
                this.logger.error(`Error processing stalled job ${job.id}`, error);
            }
        });

        // this.downloadQueue.on('waiting', async (jobId: string) => {
        //     this.logger.verbose(`Job ${jobId} is waiting`);
        //     try {
        //         await this.processStatus.updateStatus(String(jobId), 'W')
        //         await this.redisService.updateQueueStatus((jobId), 'waiting');
        //     } catch (error) {
        //         this.logger.error(`Error processing waiting job ${jobId}`, error);
        //     }
        // });
        // Fires as soon as the job is enqueued—before any worker can pick it up.
        this.downloadQueue.on('global:waiting', async (jobId: string) => {

            try {

                this.logService.warn(`Job ${jobId} waiting`, `queue/${jobId}`);
                // await this.processStatus.updateStatus(String(jobId), 'W')
                await this.redisService.updateQueueStatus((jobId), 'waiting');
            } catch (error) {
                this.logger.error(`Error processing waiting job ${jobId}`, error);
            }

        });

        this.downloadQueue.on('active', async (job: Job) => {
            this.logger.verbose(`Job ${job.id} active`);
            try {
                this.logService.warn(`Job ${job.id} active`, `queue/${job.id}`);

                // const { nDPid } = job.data as downloadQueuePayload;
                await this.processStatus.updateStatus(String(job.id), 'A')
                await this.redisService.updateQueueStatus(String(job.id), 'active');
            } catch (error) {
                this.logger.error(`Error processing job ${job.id} data`, error);
            }
        });

        this.downloadQueue.on('paused', () => {
            this.logger.log('Queue paused');
        });

        this.downloadQueue.on('resumed', () => {
            this.logger.log('Queue resumed');
        });

        this.downloadQueue.on('removed', async (job: Job) => {
            this.logger.log(`Job ${job.id} removed`);
            try {
                this.logService.warn(`Job ${job.id} removed`, `queue/${job.id}`);
                // const payload: downloadQueuePayload = job.data;
                await this.redisService.updateQueueStatus(String(job.id), 'removed');
            } catch (error) {
                this.logger.error(`Error processing removed job ${job.id}`, error);
            }
        });

        this.downloadQueue.on('delayed', async (job: Job) => {
            this.logger.log(`Job ${job.id} delayed`);
            try {
                
                this.logService.warn(`Job ${job.id} delayed`, `queue/${job.id}`);
                // const payload: downloadQueuePayload = job.data;
                await this.redisService.updateQueueStatus(String(job.id), 'delayed');
            } catch (error) {
                this.logger.error(`Error processing delayed job ${job.id}`, error);
            }

        });

        this.downloadQueue.on('drained', () => {
            this.logger.verbose('Queue drained');
        });

        this.downloadQueue.on('error', (err: Error) => {
            this.logger.error('Queue error', err);
        });


        this.downloadQueue.on('progress', (job: Job, progress: any) => {
            this.logger.verbose(`Progress Report for ${job.id}`, progress);
            try {
                if (progress.event == 'DOWNLOAD-PROGRESS') {
                    const jobData: downloadQueuePayload = job.data as downloadQueuePayload;
                    const obj = { nMasterid: jobData.nMasterid };

                    if (progress?.completedParts) {
                        obj['completedParts'] = progress.completedParts;
                    }

                    if (progress?.totalParts) {
                        obj['totalParts'] = progress.totalParts;
                    }

                    if (progress?.actionStatus) {
                        obj['actionStatus'] = progress.actionStatus;
                    }

                    if (progress?.MergeCompletedParts) {
                        obj['MergeCompletedParts'] = progress.MergeCompletedParts;
                    }

                    if (progress?.MergeTotalParts) {
                        obj['MergeTotalParts'] = progress.MergeTotalParts;
                    }

                    if (progress?.totalSize) {
                        obj['totalSize'] = progress.totalSize;
                    }

                    this.processStatus.progressReport(progress.event, String(job.id), obj);
                }
            } catch (error) {
                this.logger.error(`Error processing progress report for job ${job.id}`, error);
            }


        });


    }
}