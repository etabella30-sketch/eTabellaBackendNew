import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class S3Service {
  private s3Client: S3Client;
  private readonly APP_NAME = 'S3Service';

  constructor(
    private readonly configService: ConfigService,
    private readonly logService: LogService
  ) {

    this.s3Client = new S3Client({
      region: 'sgp1', // Set your DigitalOcean region
      endpoint: this.configService.get('DO_SPACES_ENDPOINT'), // e.g., 'https://nyc3.digitaloceanspaces.com'
      credentials: {
        accessKeyId: this.configService.get('DO_SPACES_KEY'),
        secretAccessKey: this.configService.get('DO_SPACES_SECRET'),
      },
      forcePathStyle: this.configService.get('DO_S3') == 'MINIO' // Required for MinIO
    });
  }

  /**
   * Uploads a file to the configured S3 bucket.
   * @param filePath Path to the file to be uploaded.
   * @param destinationKey Key (path) under which the file will be stored in the bucket.
   * @returns Promise<string> The URL of the uploaded file.
   */
  async uploadFile(filePath: string, destinationKey: string): Promise<string> {
    const bucketName = this.configService.get<string>('S3_BUCKET_NAME');

    if (!fs.existsSync(filePath)) {
      const errorMessage = `File not found: ${filePath}`;
      this.logService.error(errorMessage, this.APP_NAME);
      throw new Error(errorMessage);
    }

    const fileStream = fs.createReadStream(filePath);
    const fileName = path.basename(filePath);

    try {
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: fileStream,
        ContentType: this.getContentType(fileName), // Optional: Set Content-Type based on file extension.
      });

      await this.s3Client.send(command);

      const fileUrl = `https://${bucketName}.s3.${this.configService.get<string>('AWS_REGION')}.amazonaws.com/${destinationKey}`;

      this.logService.info(`File uploaded successfully: ${fileUrl}`, this.APP_NAME);
      return fileUrl;
    } catch (error) {
      const errorMessage = `Failed to upload file to S3: ${error.message}`;
      this.logService.error(errorMessage, this.APP_NAME);
      throw new Error(errorMessage);
    }
  }

  /**
   * Determines the content type of a file based on its extension.
   * @param fileName Name of the file.
   * @returns Content type as a string.
   */
  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.txt':
        return 'text/plain';
      case '.json':
        return 'application/json';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.pdf':
        return 'application/pdf';
      case '.backup':
        return 'application/octet-stream';
      default:
        return 'application/octet-stream';
    }
  }
}
