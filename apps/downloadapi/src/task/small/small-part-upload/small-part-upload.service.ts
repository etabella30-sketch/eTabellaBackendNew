import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SmallFileBatch, SmallFilePart } from 'apps/downloadapi/src/interfaces/download.interface';
import { serializeSmallParts } from 'apps/downloadapi/src/interfaces/part.interface';
import { RedisQueueService } from 'apps/downloadapi/src/queue/redis-queue/redis-queue.service';
import { DoneCallback, Job, Queue } from 'bull';
import { UploadS3Service } from '../../large/upload-s3/upload-s3.service';
import { StreamS3Service } from '../stream-s3/stream-s3.service';
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'apps/downloadapi/src/util/redis/redis.service';
import { ConfigKeyService } from 'apps/downloadapi/src/util/config-key/config-key.service';

@Injectable()
export class SmallPartUploadService extends RedisQueueService implements OnModuleInit {

    private readonly log = new Logger('small-part-upload');

    constructor(private readonly uploadS3: UploadS3Service, private readonly streamS3: StreamS3Service, private readonly logService: LogService,
        override readonly configService: ConfigService,
        private readonly redisService: RedisService, private readonly configKeyService: ConfigKeyService
    ) {
        super(configService);
    }

    async startBatch(nDPid: string, mainJob: Job, batche: SmallFileBatch, batchQueueCallBack: DoneCallback): Promise<void> {
        try {
            this.log.fatal(`🔄 Starting part upload for batch with nDPid: ${nDPid} and batch index: ${batche.batchIndex} and size : ${batche.totalSize} `);

            this.logService.info(`🔄 Starting part upload for batch batch index: ${batche.batchIndex} and size : ${batche.totalSize} `, `queue/${nDPid}`);
            const tarKey = this.configKeyService.smallBatchName(nDPid, batche.batchIndex);// `smallbatch${nDPid}_${batche.batchIndex}.tar`;



            let uploadId = await this.redisService.getUploadIdForBatch(nDPid, 'small', batche.batchIndex);
            let isAlreadyExists = true;

            if (!uploadId) {
                uploadId = await this.uploadS3.creteaUploadId(tarKey)
                isAlreadyExists = false;
            }

            const queueData: serializeSmallParts[] = this.serializePartData(batche, uploadId, tarKey);
            this.setUpConfig({
                // key: `download-part:small:${nDPid}-${batche.batchIndex}`,
                //  `download:${nDPid}:small-parts-${batche.batchIndex}`
                key: this.configKeyService.smallPartQueueName(nDPid, batche.batchIndex),
                primaryKey: nDPid,
                jobOptions: {
                    batchIndex: batche.batchIndex
                },
                concurrency: 2
            });

            const queue = await this.inilitializeQueue();
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.executePartUpload(nDPid, queueData, job, batche, done);
            });

            queue.on('completed', async (job) => {

                try {
                    await this.redisService.removeActiveBatch(nDPid, 'small', batche.batchIndex);
                    const total = await this.redisService.completeRefreshCount(nDPid);
                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', completedParts: total });
                } catch (error) {
                    this.logService.error(`❌ Error removing active batch batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack);
                // this.log.log(`✅ Job ${job.id} completed successfully in queue ${this.QUEUE_NAME}`);
            });

            queue.on('failed', async (job, err) => {
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'small', batche.batchIndex);
                } catch (error) {
                    this.logService.error(`❌ Error removing active batch batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack);
                this.logService.error(`❌ Job failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            });

            queue.on('drained', () => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
                // batchQueueCallBack();
            });



            if (!isAlreadyExists) {
                await this.processTasks(nDPid, queueData, 'identifier');
                await this.redisService.addActiveBatch(nDPid, 'small', batche.batchIndex, uploadId);
            } else {
                this.logService.info(`🔄 Jobs already added batchIndex=${batche.batchIndex}. Skipping re-adding jobs.`, `queue/${nDPid}`);
                //TODO: RESTART ALL ACTIVE JOBS HERE
                this.log.log(`🔄 Jobs already added for nDPid=${nDPid}, batchIndex=${batche.batchIndex}. Skipping re-adding jobs.`);
            }

        } catch (error) {
            this.logService.error(`❌ Error in partQueue batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error in partQueue for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
            // Handle the error appropriately, e.g., notify the user or log it
            batchQueueCallBack(error);
            return;
        }

    }



    serializePartData(batch: SmallFileBatch, uploadId: string, tarKey: string): serializeSmallParts[] {
        this.log.log(`Serializing part data for batch index: ${batch.batchIndex}`);
        const result: serializeSmallParts[] = [];

        for (const part of batch.parts) {
            result.push({
                partNumber: part.partNumber,
                identifier: `${batch.batchIndex}-${part.partNumber}`,
                uploadId,
                tarKey
            });
        }

        return result;
    }





    private async checkQueueComplete(nDPid: string, queue: Queue, queueData: serializeSmallParts[], tarKey: string, uploadId: string, batchQueueCallBack: DoneCallback): Promise<void> {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {
            this.logService.info(`All jobs completed . Remaining jobs: ${remaining}`, `queue/${nDPid}`);
            this.log.verbose(`🔄 All jobs processed for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}. Completing multipart upload...`);
            try {
                // const ETag = await this.uploadS3.endOfArchive(nDPid, tarKey, uploadId, (queueData?.length + 1));
                await this.uploadS3.completeMultipartUpload(nDPid, tarKey, uploadId, queueData); //,{ partNumnber: queueData?.length + 1, ETag }
            } catch (error) {
                this.logService.error(`❌ Error completing multipart upload  tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
                batchQueueCallBack(error)
                return
            }

            try {
                batchQueueCallBack();
            } catch (error) {
                this.logService.error(`❌ Error in batchQueueCallBack : ${error.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Error in batchQueueCallBack for nDPid=${nDPid}: ${error.message}`);
                // Handle the error appropriately, e.g., notify the user or log it
            }
            this.logService.info(`✅ Successfully completed multipart upload  tarKey=${tarKey}, uploadId=${uploadId}`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
        }

    }

    async executePartUpload(nDPid: string, queueData: serializeSmallParts[], job: any, batch: SmallFileBatch, done: DoneCallback) {
        const currentQueueData: serializeSmallParts = job.data;
        // this.log.verbose(`Processing part upload for batch index: ${currentQueueData.batchIndex}`);
        // Implement the logic to handle the part upload job
        // This could involve uploading parts to a storage service, etc.
        // For now, we will just log the job data

        this.log.log(`Processing small part ${currentQueueData.partNumber} upload job for batch ${batch.batchIndex} with Job ID: ${job.id}`);
        // this.log.log(`Job data:`, currentQueueData);

        // Simulate part upload processing
        this.logService.info(`{ part: ${currentQueueData.partNumber},nDPid: ${nDPid}, "isSmall":true`, `queue/${nDPid}/smallbatch_${batch.batchIndex}`);

        try {
            const part: SmallFilePart = batch.parts.find(file => file.partNumber == currentQueueData.partNumber);
            if (!part) {
                this.logService.error(`❌ Part with number ${currentQueueData.partNumber} not found in batch ${batch.batchIndex}`, `queue/${nDPid}`);
                this.log.error(`❌ Part with number ${currentQueueData.partNumber} not found in batch ${batch.batchIndex}`);
                done(new Error(`Part not found: ${currentQueueData.partNumber}`));
                return;
            }
            this.log.verbose(`🔄 Processing small part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${part.partNumber}, partSize=${part.totalSize}, partFiles=${part.files?.length}`);

            const isItLastPart = part.partNumber === batch.parts?.length;

            const ETag = await this.streamS3.streamFileToS3(nDPid, currentQueueData, part, batch, isItLastPart);
            const partDetail = queueData.find(part => part.partNumber == currentQueueData.partNumber);
            partDetail.ETag = ETag;
            this.log.log(`✅ Successfully processed small part ${part.partNumber} upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}, ETag=${ETag}`);
            done();
        } catch (error) {
            this.logService.error(`❌ Error processing small part upload  batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error processing small part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`);
            done(error);
        }
        // await new Promise(resolve => setTimeout(resolve, 50));



        // Simulate part upload processing
        // this.logService.info(`{ part: ${queueData.partNumber},nDPid: ${nDPid}, nBundledetailid: ${queueData.nBundledetailid} },`, `download-queue/process_${nDPid}/small_batch_${batch.batchIndex}`);
        // await new Promise(resolve => setTimeout(resolve, 50));

        // done();
    }


}