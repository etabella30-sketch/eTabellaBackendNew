import { Processor, Process, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
const path = require('path');
import { FileProcessingJob, S3FileService } from '../services/s3-file.service';
import { ConfigService } from '@nestjs/config';
const async = require('async');
import { rm } from 'fs/promises';
import { RedisService } from '../util/redis/redis.service';
import { DownloadapiService } from '../downloadapi.service';

@Processor('s3-file-processing')
export class S3FileProcessor {
    private readonly logger = new Logger(S3FileProcessor.name);

    constructor(private readonly s3FileService: S3FileService, private readonly configService: ConfigService, private redis: RedisService, private readonly downloadapiService: DownloadapiService) { }

    @Process({ name: 'process-file', concurrency: 3 })
    async processFile(job: Job<FileProcessingJob>) {
        const { nMasterid, cPath, nBundledetailid, outputKey, processingType, metadata, nDPid, cIsindex } = job.data;
        try {
            // console.log('Starting processing for file', job)
            // const totalFiles = job.totalFiles
            // Update job progress
            await job.progress(3);
            console.log()
            this.logger.log(`Starting processing for file: ${cPath}`);

            // Step 1: Download file from S3
            await job.progress(3);

            // const assetsFolder = path.join(__dirname, 'assets');
            const assetsFolder = this.configService.get('ASSETS')
            const sessionFolder = path.join(assetsFolder, `session_${nDPid}`);
            const fileName = cPath.substring(cPath.lastIndexOf('/') + 1);
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');

            await this.s3FileService.downloadFile(nDPid, nBundledetailid, cPath, sessionFolder, fileName);
            // this.logger.log(`Downloaded file: ${cPath} (${fileBuffer.length} bytes)`);

            // Step 2: Process the file
            await job.progress(3);
            const outputfile = nBundledetailid + '_' + fileName;
            await this.s3FileService.hyperlinkprocessFile(nDPid, metadata, sessionFolder, fileName, outputfile, cIsindex);
            this.logger.log(`Processed file: ${cPath}`);

            // Step 3: Upload processed file back to S3
            await job.progress(3);
            const finalKey = `hyperlink/session_${nDPid}/${fileName}`;
            await this.s3FileService.uploadFile(
                nDPid, nBundledetailid, sessionFolder, outputfile, finalKey
            );
            // Complete the job
            await job.progress(10);
            this.logger.log(`Successfully processed and uploaded: ${finalKey}`);

            const active = await job.queue.getActiveCount();
            const waiting = await job.queue.getWaitingCount();
            console.log('active', active)
            console.log('waiting', waiting)
            if (active + waiting === 0) {
                await rm(sessionFolder, { recursive: true, force: true });
                this.logger.log(`Cleaned up session folder: ${sessionFolder}`);
            }

            return {
                originalKey: cPath,
                processedKey: finalKey,
                originalSize: 0,
                // processedSize: processedBuffer.length,
                processingType,
            };



        } catch (error) {
            this.logger.error(`Failed to process file ${cPath}: ${error.message}`);
            throw error;
        }
    }

    @OnQueueCompleted()
    async handleJobComplete(job: Job<FileProcessingJob>) {
        const { nDPid, totalFiles, nMasterid } = job.data;
        const assetsFolder = this.configService.get('ASSETS');
        const sessionFolder = path.join(assetsFolder, `session_${nDPid}`);

        // ✅ Only delete when the last job in that batch has finished
        const completed = await job.queue.getCompletedCount();
        const active = await job.queue.getActiveCount();
        const waiting = await job.queue.getWaitingCount();
        console.log('active', active)
        console.log('waiting', waiting)
        console.log('completed', waiting)
        // if (completed >= totalFiles) {

        if (active + waiting === 0) {
            await this.redis.processSetup(nDPid, totalFiles);
            await this.downloadapiService.pushToQueue(nDPid, nMasterid);

            await rm(sessionFolder, { recursive: true, force: true });
            this.logger.log(`Cleaned up session folder: ${sessionFolder}`);
        }
        // }
    }

}