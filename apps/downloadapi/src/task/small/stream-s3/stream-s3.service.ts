import { LogService } from '@app/global/utility/log/log.service';
import { Injectable, Logger } from '@nestjs/common';
import { EnrichedFile, SmallFileBatch, SmallFilePart } from 'apps/downloadapi/src/interfaces/download.interface';
import { serializeSmallParts } from 'apps/downloadapi/src/interfaces/part.interface';
import { HeaderService } from 'apps/downloadapi/src/services/header/header.service';
import { S3Service } from 'apps/downloadapi/src/services/s3/s3.service';
import { TransformNameService } from 'apps/downloadapi/src/services/transform-name/transform-name.service';
import { PassThrough } from 'stream';
import { posix as pathPosix } from 'path';

@Injectable()
export class StreamS3Service {
    private readonly log = new Logger(StreamS3Service.name);

    constructor(
        private readonly headerService: HeaderService,
        private readonly transformName: TransformNameService,
        private readonly s3: S3Service,
        private readonly logService: LogService
    ) { }

    async streamFileToS3(nDPid: string, queueData: serializeSmallParts, part: SmallFilePart, batch: SmallFileBatch, isLastPart: boolean): Promise<string> {
        this.log.log(`🔄 Streaming file to S3 for nDPid: ${nDPid}, part: ${part.partNumber}, isLastPart: ${isLastPart}`);
        const pass = new PassThrough();

        try {
            const files: EnrichedFile[] = part.files;
            if (!files || !files?.length) {
                this.logService.error(`❌ No files found  part: ${part.partNumber}`, `queue/${nDPid}`);
                pass.destroy(new Error(`No files found for nDPid: ${nDPid} and part: ${part.partNumber}`));
                this.log.error(`❌ No files found for nDPid: ${nDPid} and part: ${part.partNumber}`);
                throw new Error(`No files found for nDPid: ${nDPid} and part: ${part.partNumber}`);
            }

            // Calculate content length more accurately
            let contentLength = 0;
            for (const file of part.files) {
                const destination = this.transformName.sanitizeDestination(file.cFilename, file.foldername);
                const headers = this.headerService.createHeaderWithLongLink(destination, Number(file.size));

                // Add header(s) length
                contentLength += headers.reduce((sum, header) => sum + header.length, 0);

                // Add file data length
                const dataSize = Number(file.size);
                contentLength += dataSize;

                // Add padding
                const padSize = (512 - (dataSize % 512)) % 512;
                contentLength += padSize;
            }

            if (isLastPart) {
                contentLength += 1024; // final tar trailer
            }

            const uploadPromise = this.s3.uploadPartStream(queueData.tarKey, queueData.uploadId, queueData.partNumber, pass, Number(contentLength));

            await this.getStreamFromFiles(nDPid, batch, files, pass, part.partNumber);

            if (isLastPart) {
                this.log.verbose(`🔄 Writing end of archive for nDPid: ${nDPid}, part: ${part.partNumber}`);
                pass.write(Buffer.alloc(1024));
            }

            pass.end();
            this.logService.info(`🔄 Waiting for upload to complete part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Waiting for upload to complete for nDPid: ${nDPid}, part: ${part.partNumber}`);
            const { ETag } = await uploadPromise;
            this.log.log(`✅ Successfully uploaded part ${part.partNumber} for nDPid: ${nDPid}, ETag: ${ETag}`);
            this.logService.info(`✅ Successfully uploaded part ${part.partNumber}  ETag: ${ETag}`, `queue/${nDPid}`);

            return ETag;
        } catch (error) {
            this.logService.error(`❌ Error streaming file to S3  part: ${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error streaming file to S3 for nDPid: ${nDPid}, part: ${part.partNumber}: ${error.message}`);
            pass.destroy(error);
            throw error;
        }
    }

    private async getStreamFromFiles(nDPid: string, batch: SmallFileBatch, files: EnrichedFile[], pass: PassThrough, partNumber: number): Promise<void> {
        this.log.log(`🔄 Getting stream from files: ${files.map(file => file.cFilename).join(', ')}`);

        try {
            for (const file of files) {
                const source = file.cPath;
                const destination = this.transformName.sanitizeDestination(file.cFilename, file.foldername);

                this.logService.report(
                    `{ part: ${partNumber}, nBundledetailid: "${file.nBundledetailid}", "file": "${file.cFilename}", "foldername": "${file.foldername}", "destination": "${destination}" },`,
                    `queue/${nDPid}/smallbatch_${batch.batchIndex}`
                );

                this.log.warn(`🔄 part=${partNumber} Streaming file ${file.cFilename} from ${source} to ${destination} size: ${Number(file.size)}`);

                // Create headers (may include PAX header for long filenames)
                const headers = this.headerService.createHeaderWithLongLink(destination, Number(file.size));

                // Write all headers
                for (const header of headers) {
                    pass.write(header);
                }

                // Stream file content
                const body = await this.s3.getObject(source);
                for await (const chunk of body) {
                    pass.write(chunk);
                }

                // Add padding to align to 512-byte boundary
                const fileSize = Number(file.size);
                const padSize = (512 - (fileSize % 512)) % 512;
                if (padSize > 0) {
                    pass.write(Buffer.alloc(padSize));
                }
            }
        } catch (error) {
            this.logService.error(`❌ Error getting stream from files: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error getting stream from files: ${error.message}`);
            throw error;
        }
    }

}