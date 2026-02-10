import { LogService } from '@app/global/utility/log/log.service';
import { Injectable, Logger } from '@nestjs/common';
import { EnrichedFile } from 'apps/downloadapi/src/interfaces/download.interface';
import { ByteRange, serializeParts, serializeSmallParts } from 'apps/downloadapi/src/interfaces/part.interface';
import { HeaderService } from 'apps/downloadapi/src/services/header/header.service';
import { S3Service } from 'apps/downloadapi/src/services/s3/s3.service';
import { TransformNameService } from 'apps/downloadapi/src/services/transform-name/transform-name.service';

@Injectable()
export class UploadS3Service {
    private readonly log = new Logger(UploadS3Service.name);
    constructor(private readonly s3: S3Service,
        private readonly headerService: HeaderService,
        private readonly transformName: TransformNameService,
        private readonly logService: LogService) {


    }



    async creteaUploadId(tarKey: string): Promise<string> {
        return await this.s3.createMultipartUpload(tarKey, `application/x-tar`);
    }


    async uploadParts(nDPid: string, part: serializeParts, fileDetail: EnrichedFile): Promise<string> {
        try {
            this.logService.info(`🔄 Uploading first part file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Uploading first part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`);
            if (part.type == 'FIRST') {
                return await this.uploadFirstPart(nDPid, part, fileDetail);
            } else if (part.type == 'MIDDLE_COPY') {
                return await this.uploadMiddleParts(nDPid, part, fileDetail);
            } else if (part.type == 'LAST') {
                return await this.uploadLastPart(nDPid, part, fileDetail);
            } else {
                this.logService.error(`❌ Invalid part type file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${part.type}`, `queue/${nDPid}`);
                this.log.error(`❌ Invalid part type for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${part.type}`);
            }
        } catch (error) {
            this.logService.error(`❌ Error uploading part file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error uploading part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            throw error;
        }
    }


    async endOfArchive(nDPid: string, tarKey: string, uploadId: string, lastPart: number): Promise<string> {
        try {
            const ETag = await this.s3.uploadPart(tarKey, uploadId, lastPart, Buffer.alloc(1024));
            return ETag;
        } catch (error) {
            this.logService.error(`❌ Error completing multipart upload  tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
            throw error;
        }
    }




    async completeMultipartUpload(nDPid: string, tarKey: string, uploadId: string, parts: serializeParts[] | serializeSmallParts[], endPart?: { partNumnber: number, ETag: string }): Promise<void> {

        try {
            const partETags = parts.map(part => ({
                ETag: part.ETag,
                PartNumber: part.partNumber
            }));
            if (endPart) {
                partETags.push({
                    ETag: endPart.ETag,
                    PartNumber: endPart.partNumnber
                });
            }
            await this.s3.completeMultipartUpload(tarKey, uploadId, partETags);
            this.log.log(`✅ Successfully completed multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}`);
            this.logService.info(`✅ Successfully completed multipart upload for  tarKey=${tarKey}, uploadId=${uploadId}`, `queue/${nDPid}`);
        } catch (error) {
            this.logService.error(`❌ Error completing multipart upload for tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
            throw error;
        }


    }



    async uploadFirstPart(nDPid, part: serializeParts, fileDetail: EnrichedFile): Promise<string> {
        try {
            const source = fileDetail.cPath;
            const destination = this.transformName.sanitizeDestination(fileDetail.cFilename, fileDetail.foldername); //`${fileDetail.foldername}/${fileDetail.cFilename}`

            // this.log.fatal(`🔄 Uploading first part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}, destination: ${destination}`);

            const slice = await this.s3.downloadSlice(source, part.dataRange);
            const headers = this.headerService.createHeaderWithLongLink(destination, Number(fileDetail.size));
            // const header = this.headerService.createHeader(destination, Number(fileDetail.size)) //{ path: destination }
            const body = Buffer.concat([...headers, slice]); //[header, slice]
            const ETag = await this.s3.uploadPart(part.tarKey, part.uploadId, part.partNumber, body);
            this.logService.info(`✅ Successfully uploaded first part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`, `queue/${nDPid}`);
            this.log.log(`✅ Successfully uploaded first part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`);
            return ETag;
        } catch (error) {
            this.logService.error(`❌ Error uploading first part file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error uploading first part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            throw error;
        }
    }

    async uploadMiddleParts(nDPid: string, part: serializeParts, fileDetail: EnrichedFile): Promise<string> {
        try {
            this.logService.info(`🔄 Uploading middle part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Uploading middle part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`);
            const source = fileDetail.cPath;
            const ETag = await this.s3.uploadPartCopy(part.tarKey, part.uploadId, part.partNumber, `${this.s3.sourceBucket}/${source}`, part.copyRange);
            this.log.log(`✅ Successfully uploaded middle part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`);
            this.logService.info(`✅ Successfully uploaded middle part for file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`, `queue/${nDPid}`);
            return ETag;
        } catch (error) {
            this.log.error(`❌ Error uploading middle part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            this.logService.error(`❌ Error uploading middle part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            throw error;
        }
    }

    async uploadLastPart(nDPid: string, part: serializeParts, fileDetail: EnrichedFile): Promise<string> {
        try {
            const source = fileDetail.cPath;
            const slice = await this.s3.downloadSlice(source, part.dataRange);
            const pad = Buffer.alloc((512 - (Number(fileDetail.size) % 512)) % 512);
            const body = Buffer.concat([slice, pad]);
            const ETag = await this.s3.uploadPart(part.tarKey, part.uploadId, part.partNumber, body);
            return ETag;
        } catch (error) {
            this.log.error(`❌ Error uploading last part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            this.logService.error(`❌ Error uploading last part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            throw error;
        }
    }





}
