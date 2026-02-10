import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { S3ClientService } from '../services/s3-client/s3-client.service';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import * as fs from 'fs';
import { LogService } from '@app/global/utility/log/log.service';
// test
@Processor('download-queue')
export class DownloadProcessor {
    constructor(private readonly s3: S3ClientService, private logService: LogService) { }

    @Process({ name: 'DOWNLOAD', concurrency: 5 })
    async handleDownload(job: Job) {
        const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid, query } = job.data;
        console.log(`DOWNLOAD START: ${tempFilePath}`);
        try {
            this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp)
            const getCommand = new GetObjectCommand(s3Params);
            const { Body } = await this.s3.s3Client.send(getCommand);

            if (Body instanceof Readable) {
                const writeStream = fs.createWriteStream(tempFilePath);
                Body.pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });

                console.log(`File downloaded: ${tempFilePath}`);
                this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp)
                // Enqueue STREAM task
                await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });
            }
        } catch (error) {
            this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp)
            console.error(`Error downloading file ${originalFileName}: ${error.message}`);
            //   throw error;
        }
    }
}
