import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { serializeSmallBatch } from 'apps/downloadapi/src/interfaces/batch.interface';
import { SmallFileBatch } from 'apps/downloadapi/src/interfaces/download.interface';
import { RedisQueueService } from 'apps/downloadapi/src/queue/redis-queue/redis-queue.service';
import { DoneCallback, Job, Queue } from 'bull';
import { SmallPartUploadService } from '../small-part-upload/small-part-upload.service';
import { ConfigService } from '@nestjs/config';
import { ConfigKeyService } from 'apps/downloadapi/src/util/config-key/config-key.service';
import { RedisService } from 'apps/downloadapi/src/util/redis/redis.service';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class SmallbatchService extends RedisQueueService implements OnModuleInit {

    constructor(private readonly smallPartUploadService: SmallPartUploadService,
        override readonly configService: ConfigService, private readonly configKeyService: ConfigKeyService,
        private readonly redisService: RedisService,
        private readonly logService: LogService
    ) {
        super(configService);
    }

    private readonly log = new Logger('small-batch');
    async startProcessing(nDPid: string, mainJob: Job, batches: SmallFileBatch[], mainQueueCallBack: any): Promise<void> {
        this.log.fatal(`🔄 Starting processing small batches for nDPid: ${nDPid} with ${batches.length} batches`);
        this.logService.info(`🔄 Starting processing small batches for with ${batches.length} batches`, `queue/${nDPid}`);
        this.setUpConfig({
            // key: `download-batch:${nDPid}:small`,
            key: this.configKeyService.smallBatchQueueName(nDPid),
            // `download:${nDPid}:small-batches`
            primaryKey: nDPid,
            jobOptions: {},
            concurrency: 2
        });


        const qyeyeData = this.serializeBatchData(batches)

        if (!qyeyeData?.length) {
            this.logService.error(`No valid batch data found for nDPid=${nDPid}. Skipping queue processing.`, `queue/${nDPid}`);
            this.log.error(`No valid batch data found for nDPid=${nDPid}. Skipping queue processing.`);
            mainQueueCallBack();
            return;
        }

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
        });

        queue.on('failed', (job: Job, err: Error) => {
            this.checkQueueComplete(nDPid, queue, mainQueueCallBack, err);
            this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            this.logService.error(`❌ Job failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
            // this.updateBatchStatus(nDPid, Number(job.id), 'failed');
        });

        queue.once('drained', () => {
            this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
            // this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
            // this.completeJobById(String(nDPid))
        });

        // const isHaveJobs = this.isJobsAlreadyAdded();

        // if (!isHaveJobs) {
        // } else {
        //     this.log.warn(`No new jobs added to the queue for nDPid=${nDPid}. Existing jobs will continue processing.`);
        // }

        const isHaveJobs = await this.redisService.getBatchStatus(nDPid, 'smallBatchAdded');
        if (!isHaveJobs) {
            // TODO: remove if exists
            await this.processTasks(nDPid, qyeyeData, 'batchIndex');
            await this.redisService.updateBatchStatus(nDPid, true, 'smallBatchAdded');
        } else {
            this.logService.info(`No new jobs added to the small batch queue  Existing jobs will continue processing.`, `queue/${nDPid}`);
            this.log.warn(`No new jobs added to the small batch queue for nDPid=${nDPid}. Existing jobs will continue processing.`);
        }

    }

    serializeBatchData(batch: SmallFileBatch[]): serializeSmallBatch[] {
        return batch.map((b, index) => {
            return {
                batchIndex: b.batchIndex,
                totalSize: b.totalSize || 0,
                totalParts: b.parts?.length || 0
            };
        }).filter(b => b.totalSize > 0 && b.totalParts > 0);
    }


    onModuleInit() {
    }
    private async checkQueueComplete(nDPid: string, queue: Queue, mainQueueCallBack: any, err?: any): Promise<void> {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {




            try {
                const isBothBatchCompleted = await this.AllBatchCompleted(nDPid);
                if (isBothBatchCompleted) {
                    if (err) {
                        this.log.error(`Error occurred while processing batches for nDPid=${nDPid}`, err);

                        this.logService.error(`Error occurred while processing small batches `, `queue/${nDPid}`);
                        mainQueueCallBack(err)
                    } else {
                        this.logService.info(`Completing Main Job in small`, `queue/${nDPid}`);
                        this.log.verbose(`Completing Main Job For nDPid=${nDPid} `);
                        mainQueueCallBack();
                    }

                } else {
                    this.logService.info(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining} `, `queue/${nDPid}`);
                    this.log.warn(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining}`);
                }
            } catch (error) {
                this.logService.error(`Error checking batch completion`, `queue/${nDPid}`);
                this.log.error(`Error checking batch completion for nDPid=${nDPid}: ${error.message}`);
                mainQueueCallBack(error);
            }
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
        }

    }


    async startJobForBatch(nDPid: string, mainJob: Job, job: Job, batches: SmallFileBatch[], batchQueueCallBack: DoneCallback): Promise<void> {
        // this.log.log(`🔄 Processing job ${job.id} in queue ${this.QUEUE_NAME}`);
        const queueData = job.data as serializeSmallBatch;
        const currentBatch = batches.find(b => b.batchIndex == queueData.batchIndex);

        if (currentBatch) {
            this.logService.info(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts} `, `queue/${nDPid}`);
            this.log.verbose(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`);
            await this.smallPartUploadService.startBatch(nDPid, mainJob, currentBatch, batchQueueCallBack);
            //  await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
            //  batchQueueCallBack();
        } else {
            this.logService.error(`Batch with index ${queueData.batchIndex} not found in serialized data`, `queue/${nDPid}`);
            this.log.error(`Batch with index ${queueData.batchIndex} not found in serialized data`);
            batchQueueCallBack(new Error(`Batch with index ${queueData.batchIndex} not found in serialized data`));
            // throw new Error(`Processing of large batch ${queueData.batchIndex} is not found in serialized data`);
            // Here you would implement the logic to process the batch, e.g., uploading files to
        }
        // await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing time
        // return { success: true };
        // done()
    }

}
