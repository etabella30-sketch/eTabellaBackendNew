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



            // A batch always starts from scratch. If a previous worker died
            // mid-batch (deploy / pm2 restart), the part ETags it collected lived
            // only in that process, so its multipart upload can never be
            // completed: abort it, mint a fresh uploadId and re-run every part
            // (S3→S3 copies, cheap). The part queue is wiped below for the same
            // reason — re-adding onto the dead run's jobs would be a silent no-op.
            const staleUploadId = await this.redisService.getUploadIdForBatch(nDPid, 'small', batche.batchIndex);
            if (staleUploadId) {
                this.logService.error(`Batch ${batche.batchIndex} has a stale upload ${staleUploadId} from a previous run — aborting and restarting the batch`, `queue/${nDPid}`);
                this.log.warn(`Stale upload ${staleUploadId} for nDPid=${nDPid}, batchIndex=${batche.batchIndex} — aborting and restarting the batch`);
                await this.uploadS3.abortUpload(nDPid, tarKey, staleUploadId);
            }
            const uploadId = await this.uploadS3.creteaUploadId(tarKey);

            const queueData: serializeSmallParts[] = this.serializePartData(batche, uploadId, tarKey);
            this.setUpConfig({
                // key: `download-part:small:${nDPid}-${batche.batchIndex}`,
                //  `download:${nDPid}:small-parts-${batche.batchIndex}`
                key: this.configKeyService.smallPartQueueName(nDPid, batche.batchIndex),
                primaryKey: nDPid,
                jobOptions: {
                    batchIndex: batche.batchIndex
                },
                // Perf: was 2 — the small-file tar parts are the hot path for
                // many-doc packages (tunable via DOWNLOAD_PART_CONCURRENCY).
                concurrency: Number(this.configService.get('DOWNLOAD_PART_CONCURRENCY')) || 6
            });

            const queue = await this.inilitializeQueue();
            await this.resetQueue(queue);
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.executePartUpload(nDPid, queueData, job, batche, done);
            });

            queue.on('completed', async (job) => {

                try {
                    const total = await this.redisService.completeRefreshCount(nDPid);
                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', completedParts: total });
                } catch (error) {
                    this.logService.error(`❌ Error reporting progress batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error reporting progress for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
                // this.log.log(`✅ Job ${job.id} completed successfully in queue ${this.QUEUE_NAME}`);
            });

            queue.on('failed', async (job, err) => {
                // The uploadId mapping is deliberately kept on failure so a retry
                // can abort the stale multipart upload before starting over.
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack, err);
                this.logService.error(`❌ Job failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            });

            queue.on('drained', () => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
                // batchQueueCallBack();
            });



            // Track the uploadId BEFORE the first part can land, and keep it until
            // the tar is completed (see checkQueueComplete) so a restart finds it.
            await this.redisService.addActiveBatch(nDPid, 'small', batche.batchIndex, uploadId);
            await this.processTasks(nDPid, queueData, 'identifier');

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





    private async checkQueueComplete(nDPid: string, queue: Queue, queueData: serializeSmallParts[], tarKey: string, uploadId: string, batchIndex: number, batchQueueCallBack: DoneCallback, err?: any): Promise<void> {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;

        if (remaining === 0) {
            // A permanently failed part (attempts exhausted) has no ETag, so the
            // tar can't be completed. Fail the batch; the uploadId mapping is
            // kept so the retry aborts this upload and rebuilds the batch.
            const failure = err || (counts.failed > 0
                ? new Error(`${counts.failed} part(s) permanently failed in ${this.QUEUE_NAME}`)
                : undefined);
            if (failure) {
                this.logService.error(`❌ Batch ${batchIndex} not completed: ${failure.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Batch ${batchIndex} not completed for nDPid=${nDPid}, tarKey=${tarKey}: ${failure.message}`);
                batchQueueCallBack(failure);
                return;
            }
            this.logService.info(`All jobs completed . Remaining jobs: ${remaining}`, `queue/${nDPid}`);
            this.log.verbose(`🔄 All jobs processed for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}. Completing multipart upload...`);
            try {
                // const ETag = await this.uploadS3.endOfArchive(nDPid, tarKey, uploadId, (queueData?.length + 1));
                await this.uploadS3.completeMultipartUpload(nDPid, tarKey, uploadId, queueData); //,{ partNumnber: queueData?.length + 1, ETag }
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'small', batchIndex);
                } catch (error) {
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batchIndex}: ${error.message}`);
                }
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