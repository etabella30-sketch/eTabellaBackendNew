import { Injectable, Logger } from '@nestjs/common';
import { DoneCallback, Job, Queue } from 'bull';
import { LargeFileBatch, ProcessJobDetail, SmallFileBatch } from '../../interfaces/download.interface';
import { CopyPartDetail, tarList } from '../../interfaces/merge-tar.interface';
import { ConfigKeyService } from '../../util/config-key/config-key.service';
import { S3Service } from '../../services/s3/s3.service';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { DeleteTarPayload } from '../../interfaces/delete-tar.interface';
import { RedisService } from '../../util/redis/redis.service';
import { GeneratePresignedUrlService } from '../generate-presigned-url/generate-presigned-url.service';
import { DefaultService } from '../../services/default/default.service';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class FinalizeArchiverService extends DefaultService {
    private readonly logger = new Logger(FinalizeArchiverService.name);
    private readonly downloadBucket: string;

    private readonly MAX_COPY_PART_SIZE = this.MAX_COPY_PART_SIZE_IN_FINAL_MEARGE; // 5 GiB
    private readonly CONCURRENCY = this.CONCURRENCY_IN_FINAL_MEARGE;

    constructor(
        private readonly configKeyService: ConfigKeyService,
        private readonly s3Service: S3Service,
        private readonly configService: ConfigService,
        @InjectQueue('delete-tar-queue') private deleteTarQueue: Queue,
        private readonly redisService: RedisService,
        private readonly generatePresignedUrlService: GeneratePresignedUrlService,
        private readonly logService: LogService
    ) {
        super();
        this.downloadBucket = this.configService.get<string>('DO_SPACES_DOWNLOAD_BUCKET_NAME');
    }

    async finalizeArchive(
        nDPid: string,
        mainJob: Job,
        mainQueueCallBack: DoneCallback,
        largeBatches: LargeFileBatch[],
        smallBatches: SmallFileBatch[],
        jobDetail: ProcessJobDetail
    ): Promise<void> {
        // TODO: DELETE EXISTING ARCHIVE IF EXISTS
        const finalKey = this.configKeyService.finalArchiveName(nDPid, jobDetail?.cZipname);
        this.logService.log(`Finalizing archive for nDPid=${nDPid}, finalKey=${finalKey}`, `queue/${nDPid}`);
        try {
            this.redisService.updateActionStatus(nDPid, mainJob, 'FINAL-MEARGING');
        } catch (error) {
            this.logService.error(`Error updating action status : ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error updating action status for nDPid=${nDPid}: ${error.message}`, error.stack);
            mainQueueCallBack(error);
            return;
        }

        try {
            await this.clearExistingArchive(finalKey);
        } catch (error) {
            this.logService.error(`Error clearing existing archive for nDPid=${nDPid}: ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error clearing existing archive for nDPid=${nDPid}: ${error.message}`, error.stack);
        }

        const mergeItems: tarList[] = await this.getMergeBatchJob(nDPid, largeBatches, smallBatches);
        const keysToMerge = mergeItems.map(item => item.name);
        this.logger.verbose(`Merging [${keysToMerge.join(', ')}] → ${finalKey}`);
        this.logService.info(`Merging [${keysToMerge.join(', ')}] → ${finalKey}`, `queue/${nDPid}`);
        let uploadId;
        try {
            uploadId = await this.s3Service.createMultipartUpload(finalKey);
            const plan = await this.buildCopyPlan(keysToMerge);
            await this.redisService.finalMergeTotalPartsCount(nDPid, plan?.length || 0);

            await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', MergeTotalParts: plan?.length || 0 });

            const parts = await this.executeCopyPlan(nDPid, plan, finalKey, uploadId, mainJob);
            await this.s3Service.completeMultipartUpload(finalKey, uploadId, parts);
            await this.generatePresignedUrlService.updatePresignedUrl(nDPid, finalKey);
            await this.moveToDeleteTars(keysToMerge);
            this.logger.log(`Final archive created: ${finalKey}`);
            this.logService.info(`Final archive created: ${finalKey}`, `queue/${nDPid}`);
            mainQueueCallBack(null, { finalKey });
        } catch (error: any) {
            await this.abortArchiveCreation(nDPid, finalKey, uploadId);
            this.logger.error(`Error finalizing archive: ${error.message}`, error.stack);
            this.logService.error(`Error finalizing archive : ${error.message}`, `queue/${nDPid}`);
            mainQueueCallBack(error);
        }

        /*try {
            if (keysToMerge.length === 1) {
                const srcKey = keysToMerge[0];
                const uploadId = await this.s3Service.createMultipartUpload(finalKey);
                const eTag = await this.s3Service.uploadPartCopy(
                    finalKey,
                    uploadId,
                    1,
                    `${this.downloadBucket}/${srcKey}`
                );
                await this.s3Service.completeMultipartUpload(finalKey, uploadId, [{ ETag: eTag, PartNumber: 1 }]);
                this.logger.log(`Final archive copied: ${finalKey}`);


                await this.generatePresignedUrlService.updatePresignedUrl(nDPid, finalKey);

                await this.moveToDeleteTars(keysToMerge);

                mainQueueCallBack(null, { finalKey });
                return;
            }

            const uploadId = await this.s3Service.createMultipartUpload(finalKey);
            const parts: { ETag: string; PartNumber: number }[] = [];
            let partNumber = 1;

            for (let i = 0; i < keysToMerge.length - 1; i++) {
                const key = keysToMerge[i];
                const size = (await this.s3Service.headObjectSize(key)) - 1024;
                if (size <= 0) continue;
                const eTag = await this.s3Service.uploadPartCopy(
                    finalKey,
                    uploadId,
                    partNumber,
                    `${this.downloadBucket}/${key}`,
                    `bytes=0-${size - 1}`
                );
                parts.push({ ETag: eTag, PartNumber: partNumber });
                partNumber++;
            }

            const lastKey = keysToMerge[keysToMerge.length - 1];
            const lastETag = await this.s3Service.uploadPartCopy(
                finalKey,
                uploadId,
                partNumber,
                `${this.downloadBucket}/${lastKey}`
            );
            parts.push({ ETag: lastETag, PartNumber: partNumber });

            await this.s3Service.completeMultipartUpload(finalKey, uploadId, parts);

            await this.generatePresignedUrlService.updatePresignedUrl(nDPid, finalKey);

            await this.moveToDeleteTars(keysToMerge);


            this.logger.log(`Final archive created: ${finalKey}`);
            mainQueueCallBack(null, { finalKey });
        } catch (error: any) {
            this.logger.error(`Error finalizing archive: ${error.message}`, error.stack);
            mainQueueCallBack(error);
        }*/
    }

    private async abortArchiveCreation(nDPid: string, finalKey: string, uploadId: string): Promise<void> {
        try {
            await this.s3Service.abortMultipartUpload(finalKey, uploadId);

            this.logService.info(`Multipart upload aborted for nDPid=${nDPid} with uploadId=${uploadId}`, `queue/${nDPid}`);
            this.logger.warn(`Multipart upload aborted for nDPid=${nDPid} with uploadId=${uploadId}`);
        } catch (error) {
            this.logService.error(`Error aborting multipart upload  ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error aborting multipart upload for nDPid=${nDPid}: ${error.message}`, error.stack);
        }
    }

    private async buildCopyPlan(keys: string[]): Promise<CopyPartDetail[]> {
        const plan: CopyPartDetail[] = [];
        let partNumber = 1;
        for (const key of keys) {
            const fullSize = await this.s3Service.headObjectSize(key);
            const trimmed = fullSize - 1024;
            let offset = 0;
            while (offset < trimmed) {
                const chunkSize = Math.min(trimmed - offset, this.MAX_COPY_PART_SIZE);
                const start = offset;
                const end = offset + chunkSize - 1;
                plan.push({
                    partNumber: partNumber++,
                    key,
                    copySource: `/${this.downloadBucket}/${key}`,
                    copySourceRange: `bytes=${start}-${end}`,
                });
                offset += chunkSize;
            }
        }
        return plan;
    }


    private async executeCopyPlan(
        nDPid: string,
        plan: CopyPartDetail[],
        finalKey: string,
        uploadId: string,
        mainJob: Job
    ): Promise<{ ETag: string; PartNumber: number }[]> {
        const completed: { ETag: string; PartNumber: number }[] = [];
        for (let i = 0; i < plan.length; i += this.CONCURRENCY) {
            const batch = plan.slice(i, i + this.CONCURRENCY);
            const results = await Promise.all(
                batch.map(async part => {
                    this.logger.verbose(`Copying part ${part.partNumber}/${plan.length}`);
                    const ETag = await this.s3Service.uploadPartCopy(
                        finalKey,
                        uploadId,
                        part.partNumber,
                        part.copySource,
                        part.copySourceRange
                    );
                    // increment completed count
                    const MergeCompletedParts = await this.redisService.finalMergeCompleteRefreshCount(nDPid);
                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', MergeCompletedParts });
                    return { ETag, PartNumber: part.partNumber };
                })
            );
            completed.push(...results);
        }
        return completed.sort((a, b) => a.PartNumber - b.PartNumber);
    }

    private async getMergeBatchJob(
        nDPid: string,
        largeBatches: LargeFileBatch[],
        smallBatches: SmallFileBatch[],
    ): Promise<tarList[]> {
        const list: tarList[] = [];
        for (const batch of largeBatches || []) {
            list.push({ name: this.configKeyService.largeBatchName(nDPid, batch.batchIndex), size: batch.totalSize, type: 'large', batchIndex: batch.batchIndex });
        }
        for (const batch of smallBatches || []) {
            list.push({ name: this.configKeyService.smallBatchName(nDPid, batch.batchIndex), size: batch.totalSize, type: 'small', batchIndex: batch.batchIndex });
        }
        return list;
    }



    private async moveToDeleteTars(keys: string[]): Promise<void> {
        /*try {
            if (!keys.length) {
                this.logger.warn('No tar keys provided for bulk delete');
                return;
            }

            const jobs = keys.map((tarPath) => ({
                data: { tarPath } as DeleteTarPayload,
                opts: {
                    attempts: 3,
                    backoff: 5000,     // 5 seconds fixed backoff
                },
            }));

            await this.deleteTarQueue.addBulk(jobs);
            this.logger.log(`Enqueued ${jobs.length} delete‐tar jobs in bulk`);
        } catch (error) {
            this.logger.error(`Error moving tar files to delete queue: ${error.message}`, error.stack);
        }*/




    }


    private async clearExistingArchive(finalKey: string): Promise<void> {
        try {
            // HEAD → throws if missing
            await this.s3Service.headObjectSize(finalKey);
            this.logger.log(`Existing archive found, deleting before re-create: ${finalKey}`);
            
            await this.s3Service.deleteObject(finalKey);
            this.logger.log(`Deleted existing archive: ${finalKey}`);
        } catch (err: any) {
            // If it wasn’t there (404), carry on; otherwise bubble up
            if (err.$metadata?.httpStatusCode !== 404) {
                this.logger.error(`Error deleting existing archive ${finalKey}: ${err.message}`, err.stack);
                throw new Error(`Failed to delete existing archive: ${err.message}`);
            }
        }
    }


}