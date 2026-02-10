import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { DoneCallback, Job } from 'bull';
import { DeleteTarPayload } from '../interfaces/delete-tar.interface';
import { S3Service } from '../services/s3/s3.service';

@Processor('delete-tar-queue')
export class DeleteTarProcessor {
    private readonly logger = new Logger(DeleteTarProcessor.name);

    constructor(private readonly s3Service: S3Service) { }

    @Process({ concurrency: 5 })
    async handleDeleteTarQueue(job: Job<DeleteTarPayload>) {
        const { tarPath, isJobDelete, nDPid } = job.data;

        try {
            if (isJobDelete)
                await this.s3Service.deleteFolder(nDPid);
            else
                await this.s3Service.deleteObject(tarPath);
            this.logger.log(`Successfully deleted tar: ${tarPath}`);
        } catch (error: any) {
            this.logger.error(`Failed to delete tar ${tarPath}: ${error.message}`);
            // Re-throw to mark job as failed/retry
            throw error;
        }


        this.logger.log(`All tar files deleted for job ${job.id}`);
    }
}