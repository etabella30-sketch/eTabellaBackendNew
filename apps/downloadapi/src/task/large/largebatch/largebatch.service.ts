import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LargeFileBatch, queueStatus } from '../../../interfaces/download.interface';
import { RedisQueueService } from '../../../queue/redis-queue/redis-queue.service';
import { DoneCallback, Job, Queue } from 'bull';
import { serializeBatch } from '../../../interfaces/batch.interface';
import { RedisService } from '../../../util/redis/redis.service';
import { PartUploadService } from '../part-upload/part-upload.service';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { ConfigKeyService } from 'apps/downloadapi/src/util/config-key/config-key.service';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class LargebatchService extends RedisQueueService implements OnModuleInit {
    private readonly log = new Logger('large-batch');
    constructor(private readonly redisService: RedisService, private readonly partUploadService: PartUploadService,
        // @InjectQueue('download-queue')
        // private readonly downloadQueue: Queue,
        override readonly configService: ConfigService, private readonly configKeyService: ConfigKeyService,
        private readonly logService: LogService
    ) {
        super(configService);
    }

    async startProcessing(nDPid: string, mainJob: Job, batches: LargeFileBatch[], mainQueueCallBack: any): Promise<void> {
        try {

            this.log.fatal(`🔄 Starting processing large batches for nDPid: ${nDPid} with ${batches.length} batches`);
            this.logService.info(`🔄 Starting processing large batches with ${batches?.length} batches`, `queue/${nDPid}`);
            this.setUpConfig({
                key: this.configKeyService.largeBatchQueueName(nDPid),
                // `download:${nDPid}:large-batches`
                // key: `download-batch:${nDPid}:large`,
                primaryKey: nDPid,
                jobOptions: {},
                concurrency: 2
            });

            const qyeyeData = this.serializeBatchData(batches)
            const queue = await this.inilitializeQueue();
            queue.process(this.CONCURRENCY, async (job: Job, done: DoneCallback) => {
                this.logService.info(`🔄 Processing job in queue ${this.QUEUE_NAME}`, `queue/${nDPid}`);
                this.log.log(`🔄 Processing job ${job.id} in queue ${this.QUEUE_NAME}`);
                this.startJobForBatch(nDPid, mainJob, job, batches, done);
                // await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing time
                // done();
            });

            queue.on('completed', (job: Job, result: any) => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack);

                // const startMs = job.processedOn;
                // const finishMs = job.finishedOn;
                // // this.log.log(`✅ Job ${job.id} completed successfully in queue ${this.QUEUE_NAME}`);
                // this.log.log(
                //     `Job ${job.id} ran from ${new Date(startMs).toISOString()} ` +
                //     `to ${new Date(finishMs).toISOString()}`
                // );
                // this.checkQueueDrained(nDPid, queue);
                // this.updateBatchStatus(nDPid, Number(job.id), 'completed');
            });
            queue.on('failed', (job: Job, err: Error) => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack, err);
                this.logService.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}`, `queue/${nDPid}`);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
                // this.updateBatchStatus(nDPid, Number(job.id), 'failed');
            });
            /*   queue.on('active', (job: Job) => {
                   // this.log.log(`🔄 Job ${job.id} is now active in queue ${this.QUEUE_NAME}`);
                   // this.updateBatchStatus(nDPid, Number(job.id), 'active');
               });
               queue.on('stalled', (job: Job) => {
                   // this.log.warn(`⚠️ Job ${job.id} has stalled in queue ${this.QUEUE_NAME}`);
                   // this.updateBatchStatus(nDPid, Number(job.id), 'stalled');
               });
               queue.on('waiting', (jobId: string) => {
                   // this.log.log(`🔄 Job ${jobId} is waiting in queue ${this.QUEUE_NAME}`);
                   // this.updateBatchStatus(nDPid, Number(jobId), 'waiting');
               });*/
            /*        queue.on('error', (err: Error) => {
                        this.log.error(`❗ Queue ${this.QUEUE_NAME} encountered an error: ${err.message}`);
                    });
                    queue.on('paused', () => {
                        this.log.log(`⏸️ Queue ${this.QUEUE_NAME} has been paused`);
                    });
                    queue.on('resumed', () => {
                        this.log.log(`▶️ Queue ${this.QUEUE_NAME} has been resumed`);
                    });
                    queue.on('removed', (job: Job) => {
                        this.log.log(`🗑️ Job ${job.id} has been removed from queue ${this.QUEUE_NAME}`);
                    });
                    queue.on('cleaned', (jobs: Job[], type: string) => {
                        this.log.log(`🧹 Cleaned ${jobs.length} jobs of type ${type} from queue ${this.QUEUE_NAME}`);
                    });
                    queue.on('progress', (job: Job, progress: number) => {
                        this.log.log(`🔄 Job ${job.id} is ${progress}% complete in queue ${this.QUEUE_NAME}`);
                    });
            */
            queue.once('drained', () => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
                // this.queuDrained(nDPid);
                // this.completeJobById(String(nDPid))
            });

            const isHaveJobs = await this.redisService.getBatchStatus(nDPid, 'largeBatchAdded');
            if (!isHaveJobs) {
                // TODO: remove if exists
                await this.processTasks(nDPid, qyeyeData, 'batchIndex');
                await this.redisService.updateBatchStatus(nDPid, true, 'largeBatchAdded');
            } else {
                this.logService.info(`No new jobs added to the large batch queue Existing jobs will continue processing.`, `queue/${nDPid}`);
                this.log.warn(`No new jobs added to the large batch queue for nDPid=${nDPid}. Existing jobs will continue processing.`);
            }

        } catch (error) {
            this.logService.error(`❌ Error starting large batch processing  ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error starting large batch processing for nDPid=${nDPid}: ${error.message}`);
            mainQueueCallBack(error);
            return;

        }
    }

    protected override performTask(job: Job) {

    }

    onModuleInit() {
    }

    serializeBatchData(batch: LargeFileBatch[]): serializeBatch[] {
        return batch.map((b, index) => {
            return {
                batchIndex: b.batchIndex,
                totalSize: b.totalSize || 0,
                totalParts: b.files.reduce((acc, file) => acc + (file.parts ? file.parts.length : 0), 0)
                // files: b.files.map(file => ({
                //     ...file,
                //     parts: file.parts || []
                // }))
            };
        });
    }

    /*updateBatchStatus(nDPid: number, batchIndex: number, status: queueStatus): void {
        this.redisService.updateBatchStatus(nDPid, batchIndex, status)
    }*/

    async startJobForBatch(nDPid: string, mainJob: Job, job: Job, batches: LargeFileBatch[], batchQueueCallBack: DoneCallback): Promise<void> {
        // this.log.log(`🔄 Processing job ${job.id} in queue ${this.QUEUE_NAME}`);
        const queueData = job.data as serializeBatch;
        const currentBatch = batches.find(b => b.batchIndex == queueData.batchIndex);

        if (currentBatch) {

            this.logService.info(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`, `queue/${nDPid}`);
            this.log.verbose(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`);
            await this.partUploadService.startBatch(nDPid, mainJob, currentBatch, batchQueueCallBack);

        } else {
            this.logService.info(`Batch with index ${queueData.batchIndex} not found in serialized data`, `queue/${nDPid}`);
            this.log.error(`Batch with index ${queueData.batchIndex} not found in serialized data`);
            batchQueueCallBack(new Error(`Batch with index ${queueData.batchIndex} not found in serialized data`));

        }
    }


    private async checkQueueComplete(nDPid: string, queue: Queue, mainQueueCallBack: any, err?: any): Promise<void> {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {
            // this.completeJobById(String(nDPid));


            try {
                const isBothBatchCompleted = await this.AllBatchCompleted(nDPid);
                if (isBothBatchCompleted) {
                    if (err) {
                        this.logService.error(`Error occurred while processing batches `, `queue/${nDPid}`);
                        this.log.error(`Error occurred while processing batches for nDPid=${nDPid}`, err);
                        mainQueueCallBack(err)
                    } else {
                        this.logService.info(`Completing Main Job`, `queue/${nDPid}`);

                        this.log.verbose(`Completing Main Job For nDPid=${nDPid} `);
                        mainQueueCallBack();

                    }


                } else {
                    this.logService.info(`Not all batches completed  Remaining jobs: ${remaining}`, `queue/${nDPid}`);
                    this.log.warn(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining}`);

                }

            } catch (error) {
                this.logService.error(`Error checking batch completion : ${error.message} `, `queue/${nDPid}`);
                this.log.error(`Error checking batch completion for nDPid=${nDPid}: ${error.message}`);
                mainQueueCallBack(error);
            }
            this.logService.info(`🎉 All jobs drained (queue=${this.QUEUE_NAME}).`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
            // 👇 if you need to update Redis or fire another event, do it here:
            // await this.redisService.markAllBatchesCompleted(nDPid);
        }

    }
    // protected override async queuDrained(nDPid: number, jobOptions: any = {}) {
    //     // get counts for each state in one call
    //     try {
    //         this.log.log(`🎉 All batch jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
    //     } catch (error) {
    //         this.log.error(`❌ Error checking queue status for nDPid=${nDPid}: ${error.message}`);
    //         throw error;
    //     }
    // }



    /*async completeJobById(jobId: string): Promise<void> {
        this.log.verbose(`🔄 Completing job with ID: ${jobId} in queue ${this.QUEUE_NAME}`);
        const job = await this.downloadQueue.getJob(jobId);
        if (!job) {
            this.log.error(`❌ Job with ID ${jobId} not found in queue ${this.QUEUE_NAME}`);
            throw new Error(`Job ${jobId} not found`);
        }
        // the first argument is the return value (optional)
        // the second tells Bull to removeOnComplete even if you haven't set it globally
        this.log.log(`✅ Completing job ${job.id} in queue ${this.QUEUE_NAME}`);
        await job.moveToCompleted('done', true);
    }*/

    /* async checkQueueDrained(nDPid: number, queue: Queue): Promise<void> {
         // get counts for each state in one call
         try {
             const counts = await queue.getJobCounts();
             const remaining = counts.waiting + counts.active + counts.delayed;
 
             if (remaining === 0) {
                 this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
                 // 👇 if you need to update Redis or fire another event, do it here:
                 // await this.redisService.markAllBatchesCompleted(nDPid);
             }
             /else {
                 this.log.log(
                     `⏳ Queue not empty for nDPid=${nDPid}: waiting=${counts.waiting}, ` +
                     `active=${counts.active}, delayed=${counts.delayed}`
                 );
             }*
 
         } catch (error) {
             this.log.error(`❌ Error checking queue status for nDPid=${nDPid}: ${error.message}`);
             throw error;
         }
     }*/

}