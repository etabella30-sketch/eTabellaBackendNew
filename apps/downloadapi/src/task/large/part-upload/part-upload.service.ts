import { LogService } from '@app/global/utility/log/log.service';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EnrichedFile, LargeFileBatch } from 'apps/downloadapi/src/interfaces/download.interface';
import { serializeParts } from 'apps/downloadapi/src/interfaces/part.interface';
import { RedisQueueService } from 'apps/downloadapi/src/queue/redis-queue/redis-queue.service';
import { DoneCallback, Job, Queue } from 'bull';
import { UploadS3Service } from '../upload-s3/upload-s3.service';
import { ConfigService } from '@nestjs/config';
import { ConfigKeyService } from 'apps/downloadapi/src/util/config-key/config-key.service';
import { RedisService } from 'apps/downloadapi/src/util/redis/redis.service';

@Injectable()
export class PartUploadService extends RedisQueueService implements OnModuleInit {
    private readonly log = new Logger('part-upload');

    constructor(private readonly logService: LogService, private readonly uploadS3: UploadS3Service,
        override readonly configService: ConfigService,
        private readonly configKeyService: ConfigKeyService,
        private readonly redisService: RedisService
    ) {
        super(configService);
    }

    async startBatch(nDPid: string, mainJob: Job, batche: LargeFileBatch, batchQueueCallBack: DoneCallback): Promise<void> {
        try {
            const tarKey = this.configKeyService.largeBatchName(nDPid, batche.batchIndex); // `batch${nDPid}_${batche.batchIndex}.tar`;

            let uploadId = await this.redisService.getUploadIdForBatch(nDPid, 'large', batche.batchIndex);
            let isAlreadyExists = true;

            if (!uploadId) {
                uploadId = await this.uploadS3.creteaUploadId(tarKey)
                isAlreadyExists = false;
            }

            const queueData = this.serializePartData(batche, uploadId, tarKey);
            this.logService.info(`🔄 Starting part upload for batch index: ${batche.batchIndex}`, `queue/${nDPid}`);
            this.log.fatal(`🔄 Starting part upload for batch with nDPid: ${nDPid} and batch index: ${batche.batchIndex}`);
            this.setUpConfig({
                // key: `download-part:large:${nDPid}-${batche.batchIndex}`,
                key: this.configKeyService.largePartQueueName(nDPid, batche.batchIndex),
                // `download:${nDPid}:large-parts-${batche.batchIndex}`
                primaryKey: nDPid,
                jobOptions: {
                    batchIndex: batche.batchIndex
                },
                concurrency: 2
            });

            const queue = await this.inilitializeQueue();
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.executePartUpload(nDPid, job, batche, queueData, done);
            });

            queue.on('completed', async (job) => {
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'large', batche.batchIndex);
                    const total = await this.redisService.completeRefreshCount(nDPid);

                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', completedParts: total });
                } catch (error) {
                    this.logService.error(`❌ Error removing active batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack);
                // this.log.log(`✅ Job ${job.id} completed successfully in queue ${this.QUEUE_NAME}`);
            });

            queue.on('failed', async (job, err) => {
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'large', batche.batchIndex);
                } catch (error) {
                    this.logService.error(`❌ Error removing active batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack, err);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
                this.logService.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
            });

            queue.on('drained', () => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
                // batchQueueCallBack();
            });

            if (!isAlreadyExists) {
                // TODO: remove if exists
                await this.processTasks(nDPid, queueData, 'identifier');
                await this.redisService.addActiveBatch(nDPid, 'large', batche.batchIndex, uploadId);
            } else {
                this.logService.info(`🔄 Jobs already added  batchIndex=${batche.batchIndex}, uploadId ${uploadId}. Skipping re-adding jobs.`, `queue/${nDPid}`);
                //TODO: RESTART ALL ACTIVE JOBS HERE
                this.log.log(`🔄 Jobs already added for nDPid=${nDPid}, batchIndex=${batche.batchIndex}, uploadId ${uploadId}. Skipping re-adding jobs.`);
            }

        } catch (error) {

            this.logService.error(`❌ Error in partQueue batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error in partQueue for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
            // Handle the error appropriately, e.g., notify the user or log it
            batchQueueCallBack(error);
            return;
        }
    }

    onModuleInit() {
    }




    serializePartData(batch: LargeFileBatch, uploadId: string, tarKey: string): serializeParts[] {
        this.log.log(`Serializing part data for batch index: ${batch.batchIndex}`);
        const result: serializeParts[] = [];
        for (const file of batch.files) {
            // if there are no parts for this file, skip it
            if (!file.parts?.length) {
                continue;
            }
            for (const part of file.parts) {
                result.push({
                    partNumber: part.partNumber,
                    type: part.type,
                    copyRange: part.copyRange,
                    dataRange: part.dataRange,
                    nBundledetailid: file.nBundledetailid,
                    identifier: `${batch.batchIndex}-${part.partNumber}`,
                    uploadId,
                    tarKey
                });
            }
        }
        return result;
    }






    private async checkQueueComplete(nDPid: string, queue: Queue, queueData: serializeParts[], tarKey: string, uploadId: string, batchQueueCallBack: DoneCallback, err?: any): Promise<void> {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {
            this.logService.info(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
            try {
                const ETag = await this.uploadS3.endOfArchive(nDPid, tarKey, uploadId, (queueData?.length + 1));
                await this.uploadS3.completeMultipartUpload(nDPid, tarKey, uploadId, queueData, { partNumnber: queueData?.length + 1, ETag });
            } catch (error) {
                this.logService.error(`❌ Error completing multipart upload tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}.`, `queue/${nDPid}`);
                this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
                batchQueueCallBack(err)
                return
            }
            try {
                err ? batchQueueCallBack(err) : batchQueueCallBack();
            } catch (error) {
                this.logService.error(`❌ Error in batchQueueCallBack : ${error.message}.`, `queue/${nDPid}`);
                this.log.error(`❌ Error in batchQueueCallBack for nDPid=${nDPid}: ${error.message}`);
                // Handle the error appropriately, e.g., notify the user or log it
            }
        }

    }

    /*protected override async queuDrained(nDPid: string, jobOptions: { batchIndex: number }) {
        // get counts for each state in one call
        try {
            this.log.log(`🎉 All parts jobs drained for nDPid=${nDPid} batch ${jobOptions.batchIndex} (queue=${this.QUEUE_NAME}).`);
        } catch (error) {
            this.log.error(`❌ Error checking queue status for nDPid=${nDPid}: ${error.message}`);
            throw error;
        }
    }*/


    async executePartUpload(nDPid: string, job: any, batch: LargeFileBatch, queueData: serializeParts[], done: DoneCallback) {
        const currentQueueData: serializeParts = job.data;
        // this.log.verbose(`Processing part upload for batch index: ${currentQueueData.batchIndex}`);
        // Implement the logic to handle the part upload job
        // This could involve uploading parts to a storage service, etc.
        // For now, we will just log the job data

        this.logService.info(`Processing part upload job for batch ${batch.batchIndex} `, `queue/${nDPid}`);
        this.log.log(`Processing part upload job for batch ${batch.batchIndex} with Job ID: ${job.id}`);
        // this.log.log(`Job data:`, currentQueueData);
        const fileDetail: EnrichedFile = batch.files.find(file => file.nBundledetailid == currentQueueData.nBundledetailid);

        // Simulate part upload processing
        this.logService.report(`{ part: ${currentQueueData.partNumber},nDPid: ${nDPid}, nBundledetailid: ${currentQueueData.nBundledetailid} },`, `queue/${nDPid}/batch_${batch.batchIndex}`);

        try {
            const ETag = await this.uploadS3.uploadParts(nDPid, currentQueueData, fileDetail);
            const partDetail = queueData.find(part => part.partNumber == currentQueueData.partNumber);
            partDetail.ETag = ETag;
            done();
        } catch (error) {
            this.logService.error(`❌ Error processing part upload batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error processing part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`);
            done(error);
        }
        // await new Promise(resolve => setTimeout(resolve, 50));

    }





}