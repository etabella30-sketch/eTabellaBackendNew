import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { DoneCallback, Job } from 'bull';
import { downloadQueuePayload } from '../interfaces/download.interface';
import { DownloadProcessService } from '../task/download-process/download-process.service';

@Processor('download-queue')
export class DownloadProcessor {
    private readonly logger = new Logger('download-processor');
    constructor(private readonly downloadProcessService: DownloadProcessService) {

    }

    @Process({ concurrency: 5 })
    async handleDownload(job: Job, done: DoneCallback) {
        const payload: downloadQueuePayload = job.data;
        // Implement the logic to handle the download job
        // This could involve downloading files, processing data, etc.
        // For now, we will just log the job data
        this.logger.log(`Processing download job with ID: ${job.id}`);
        this.logger.log(`Job data:`, payload);

        try {
            await this.downloadProcessService.startDownload(payload, job, done);
        } catch (error) {
            done(error);
        }


        // done();

    }
}
