import { Injectable, Logger } from '@nestjs/common';
import { S3Service } from '../../services/s3/s3.service';
import { ProcessDataService } from '../../services/process-data/process-data.service';

@Injectable()
export class GeneratePresignedUrlService {

    private readonly logger = new Logger(GeneratePresignedUrlService.name);
    constructor(private readonly s3Service: S3Service, private readonly dataService: ProcessDataService) {

    }

    async updatePresignedUrl(nDPid: string, finalKey: string): Promise<void> {

        try {
            // Generate a presigned URL for the final archive
            const presignedUrl = await this.s3Service.getPresignedUrl(finalKey);
            // presignedUrl
            this.dataService.updatePresignUrl(nDPid, presignedUrl)
        } catch (error) {
            this.logger.error(`Error updating presigned URL for nDPid=${nDPid}: ${error.message}`, error.stack);
            throw error; // Rethrow the error to be handled by the caller
        }

    }


}
