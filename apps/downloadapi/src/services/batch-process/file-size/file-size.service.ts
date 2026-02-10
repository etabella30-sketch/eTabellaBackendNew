import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'https';
import pLimit from 'p-limit';
import { FilePartService } from '../file-part/file-part.service';
import { DefaultService } from '../../default/default.service';
import { EnrichedFile, filesdetail } from 'apps/downloadapi/src/interfaces/download.interface';

@Injectable()
export class FileSizeService extends DefaultService {

  private readonly logger = new Logger(FileSizeService.name);
  private readonly s3: S3Client;
  private readonly concurrency = this.S3_SIZE_CONCURRENCY;

  constructor(private readonly config: ConfigService, private readonly filePartService: FilePartService) {
    super();
    const httpsAgent = new Agent(this.S3_AGGENT);
    this.s3 = new S3Client({
      region: this.config.get('DO_SPACES_REGION'),
      endpoint: this.config.get('DO_SPACES_ENDPOINT'),
      credentials: {
        accessKeyId: this.config.get('DO_SPACES_KEY'),
        secretAccessKey: this.config.get('DO_SPACES_SECRET'),
      },
      //   s3ForcePathStyle: true,
      requestHandler: new NodeHttpHandler({ httpsAgent, ...this.S3_REQUEST_HEANDLER }),
    });
  }

  /**
   * Fetch sizes and exists flags for a list of files
   */
  async getFileSizes(files: filesdetail[]): Promise<EnrichedFile[]> {
    this.logger.log(`Fetching sizes for ${files.length} files`);
    const limit = pLimit(this.concurrency);

    const enriched = await Promise.all(
      files.map(file =>
        limit(async () => {
          let size = 0;
          let isExists = true;
          try {
            const head = await this.s3.send(
              new HeadObjectCommand({
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: file.cPath,
              }),
            );
            size = head.ContentLength ?? 0;
          } catch (err: any) {
            const code = err.name || err.$metadata?.httpStatusCode;
            if (code === 'NotFound' || code === 404) {
              isExists = false;
              this.logger.warn(`File not found: ${file.cPath}`);
            } else {
              throw err;
            }
          }
          return { ...file, size, isExists } as EnrichedFile;
        }),
      ),
    );

    this.logger.log(`Fetched sizes for ${enriched.length} files`);
    return enriched;
  }

}
