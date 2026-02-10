// src/aws/s3.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    S3Client,
    CreateMultipartUploadCommand,
    GetObjectCommand,
    UploadPartCommand,
    UploadPartCopyCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    CreateMultipartUploadCommandOutput,
    GetObjectCommandOutput,
    UploadPartCommandOutput,
    UploadPartCopyCommandOutput,
    CompleteMultipartUploadCommandOutput,
    AbortMultipartUploadCommandOutput,
    GetObjectCommandInput,
    HeadObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command,
    DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { ByteRange } from '../../interfaces/part.interface';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DefaultService } from '../default/default.service';




@Injectable()
export class S3Service extends DefaultService {
    private readonly logger = new Logger(S3Service.name);
    private readonly bucket: string;
    public sourceBucket: string;
    constructor(
        private readonly s3Client: S3Client,
        private readonly config: ConfigService,
    ) {
        super()
        this.bucket = this.config.get<string>('DO_SPACES_DOWNLOAD_BUCKET_NAME');
        this.sourceBucket = this.config.get<string>('DO_SPACES_BUCKET_NAME');
    }

    /**
     * 1. Initiate a multipart upload.
     * @returns the UploadId to be used for all subsequent part uploads.
     */
    async createMultipartUpload(
        key: string,
        contentType?: string,
    ): Promise<string> {
        try {

            const cmd = new CreateMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: contentType,
            });
            const out: CreateMultipartUploadCommandOutput = await this.s3Client.send(cmd);
            if (!out.UploadId) {
                throw new Error('Failed to create multipart upload');
            }
            this.logger.log(`Started multipart upload for ${key}, uploadId=${out.UploadId}`);
            return out.UploadId;
        } catch (error) {
            this.logger.error(`Error creating multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 2. Download a byte range of an object.
     */
    async getObjectRange(
        key: string,
        rangeStart: number,
        rangeEnd: number,
    ): Promise<Buffer> {
        try {
            const cmd = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Range: `bytes=${rangeStart}-${rangeEnd}`,
            });
            const out: GetObjectCommandOutput = await this.s3Client.send(cmd);
            const stream = out.Body as Readable;
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        } catch (error) {
            this.logger.error(`Error downloading range for ${key}: ${error.message}`);
            throw error;
        }
    }

    async getObject(
        key: string): Promise<any> {
        try {
            const cmd = new GetObjectCommand({
                Bucket: this.sourceBucket,
                Key: key
            });
            const resp: GetObjectCommandOutput = await this.s3Client.send(cmd);
            return resp.Body;
        } catch (error) {
            this.logger.error(`Error getting object ${key}: ${error.message}`);
            throw error;
        }
    }


    /**
     * Generate a presigned GET URL for an object in the download bucket.
     * @param key the S3 object key (e.g. 'smallbatch9_1.tar')
     * @param expiresInSeconds how long the URL is valid, in seconds (default 7 days)
     */
    async getPresignedUrl(
        key: string
    ): Promise<string> {
        try {
            const expiresInSeconds = this.PRESIGNED_URL_EXPIRATION;
            // We point at the download bucket
            const command = new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });

            // Generate the URL
            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: expiresInSeconds,
            });

            this.logger.log(`Generated presigned URL for ${key}, expires in ${expiresInSeconds}s`);
            return url;
        } catch (error) {
            this.logger.error(`Error generating presigned URL for ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 3. Upload a single part in a multipart upload.
     * @returns the ETag for the part.
     */
    async uploadPart(
        key: string,
        uploadId: string,
        partNumber: number,
        body: Buffer | Readable | string,
    ): Promise<string> {
        try {
            const cmd = new UploadPartCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: body,
            });
            const out: UploadPartCommandOutput = await this.s3Client.send(cmd);
            if (!out.ETag) {
                throw new Error(`Failed to upload part ${partNumber}`);
            }
            this.logger.log(`Uploaded part ${partNumber} (ETag=${out.ETag})`);
            return out.ETag;
        } catch (error) {
            this.logger.error(`Error uploading part ${partNumber} for ${key}: ${error.message}`);
            throw error;
        }
    }




    /**
     * 3. Upload a single part in a multipart upload.
     * @returns the ETag for the part.
     */
    async uploadPartStream(
        key: string,
        uploadId: string,
        partNumber: number,
        body: Buffer | Readable | string,
        totalSize: number,
    ): Promise<any> {
        try {
            const cmd = new UploadPartCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: body,
                ContentLength: totalSize
            });
            this.logger.log(`Uploading part ${partNumber} for ${key}, total size: ${totalSize}`);
            return this.s3Client.send(cmd);
        } catch (error) {
            this.logger.error(`Failed to upload part ${partNumber} for ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 4. Copy an existing object (or range) into a part.
     * @param copySource e.g. 'source-bucket/source-key'
     * @param copySourceRange optional 'bytes=start-end'
     */
    async uploadPartCopy(
        key: string,
        uploadId: string,
        partNumber: number,
        copySource: string,
        copySourceRange?: string,
    ): Promise<string> {
        try {
            const cmd = new UploadPartCopyCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                CopySource: copySource,
                CopySourceRange: copySourceRange,
            });
            const out: UploadPartCopyCommandOutput = await this.s3Client.send(cmd);
            if (!out.CopyPartResult?.ETag) {
                throw new Error(`Failed to copy part ${partNumber}`);
            }
            this.logger.log(`Copied part ${partNumber} (ETag=${out.CopyPartResult.ETag})`);
            return out.CopyPartResult.ETag;
        } catch (error) {
            this.logger.error(`Failed to copy part ${partNumber} from ${copySource}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 5. Complete the multipart upload by providing all part ETags/numbers.
     */
    async completeMultipartUpload(
        key: string,
        uploadId: string,
        parts: { ETag: string; PartNumber: number }[],
    ): Promise<void> {
        try {
            const cmd = new CompleteMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: { Parts: parts },
            });
            await this.s3Client.send(cmd);
            this.logger.log(`Completed multipart upload for ${key}`);
        } catch (error) {
            this.logger.error(`Error completing multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
     * 6. Abort a multipart upload (clean up all uploaded parts).
     */
    async abortMultipartUpload(
        key: string,
        uploadId: string,
    ): Promise<void> {
        try {
            const cmd = new AbortMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
            });
            await this.s3Client.send(cmd);
            this.logger.log(`Aborted multipart upload for ${key}, uploadId=${uploadId}`);
        } catch (error) {
            this.logger.error(`Error aborting multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }

    /**
      * Downloads either the whole object or a specific byte range.
      * @param key    the object key in S3
      * @param range  optional { offset, length } to request only that slice
      */
    async downloadSlice(
        key: string,
        range?: ByteRange,
    ): Promise<Buffer> {
        try {
            const params: GetObjectCommandInput = {
                Bucket: this.sourceBucket,
                Key: key,
            };

            if (range) {
                params.Range = `bytes=${range.offset}-${range.offset + range.length - 1}`;
            }

            this.logger.log(
                `Downloading from ${key}` +
                (range ? ` bytes ${params.Range}` : ` (full object)`),
            );

            const output: GetObjectCommandOutput = await this.s3Client.send(
                new GetObjectCommand(params),
            );

            const bodyStream = output.Body as Readable;
            const chunks: Buffer[] = [];

            for await (const chunk of bodyStream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            const buffer = Buffer.concat(chunks);
            this.logger.log(`Downloaded ${buffer.length} bytes from ${key}`);
            return buffer;
        } catch (error) {
            this.logger.error(`Error downloading slice for ${key}: ${error.message}`);
            throw error;

        }

    }

    /**
     * 0. HeadObject to fetch size of object in download bucket
     */
    async headObjectSize(key: string): Promise<number> {
        try {
            const cmd = new HeadObjectCommand({ Bucket: this.bucket, Key: key });
            const out = await this.s3Client.send(cmd);
            this.logger.log(`Fetched head for ${key}: size=${out.ContentLength}`);
            return out.ContentLength ?? 0;
        } catch (error: any) {
            this.logger.error(`Error fetching head for ${key}: ${error.message}`);
            throw error;
        }
    }

    /** Delete an object from the download bucket */
    async deleteObject(key: string): Promise<void> {
        try {
            const cmd = new DeleteObjectCommand({ Bucket: this.bucket, Key: key });
            await this.s3Client.send(cmd);
            this.logger.log(`Deleted object ${key}`);
        } catch (error: any) {
            this.logger.error(`Error deleting object ${key}: ${error.message}`);
            throw error;
        }
    }



    /**
     * Recursively delete all objects under the given prefix.
     * Each AWS call is caught and logged; we also enforce a max iteration
     * count to guarantee we never loop forever.
     */
    async deleteFolder(nDPid: string): Promise<void> {
        this.logger.log(`Starting recursive delete of nDPid "${nDPid}"`);

        let continuationToken: string | undefined;
        let iteration = 0;
        const MAX_ITERATIONS = 1000;

        try {
            do {
                if (++iteration > MAX_ITERATIONS) {
                    this.logger.error(
                        `Max iterations (${MAX_ITERATIONS}) reached; aborting delete of "${nDPid}"`,
                    );
                    break;
                }

                // 1) List objects under nDPid
                let listResp;
                try {
                    listResp = await this.s3Client.send(
                        new ListObjectsV2Command({
                            Bucket: this.bucket,
                            Prefix: nDPid,
                            ContinuationToken: continuationToken,
                        }),
                    );
                } catch (err: any) {
                    this.logger.error(
                        `Error listing objects for nDPid "${nDPid}": ${err.message}`,
                    );
                    break; // bail out on list failure
                }

                const keys = (listResp.Contents || [])
                    .filter((obj) => !!obj.Key)
                    .map((obj) => ({ Key: obj.Key! }));

                // 2) If any keys, delete them in bulk
                if (keys.length) {
                    try {
                        const delResp = await this.s3Client.send(
                            new DeleteObjectsCommand({
                                Bucket: this.bucket,
                                Delete: { Objects: keys },
                            }),
                        );
                        this.logger.log(
                            `Deleted ${delResp.Deleted?.length || 0} objects in "${nDPid}"`,
                        );
                    } catch (err: any) {
                        this.logger.error(
                            `Error deleting objects for nDPid "${nDPid}": ${err.message}`,
                        );
                        break; // bail out on delete failure
                    }
                }

                // 3) Check if there’s more to page through
                continuationToken = listResp.IsTruncated
                    ? listResp.NextContinuationToken
                    : undefined;
            } while (continuationToken);

            this.logger.log(`Finished deleting all objects under "${nDPid}"`);
        } catch (err: any) {
            // Catch anything unexpected
            this.logger.error(
                `Unexpected error in deleteFolder("${nDPid}"): ${err.message}`,
                err.stack,
            );
        }
    }


}
