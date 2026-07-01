import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { ExportS3Service } from './s3.service';

/**
 * Provides an S3Client (DigitalOcean Spaces, region sgp1) + ExportS3Service for
 * the export app. Mirrors downloadapi's s3.module so credentials/endpoint come
 * from the same DO_SPACES_* env keys.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3Client,
      useFactory: (config: ConfigService) =>
        new S3Client({
          region: 'sgp1',
          endpoint: config.get<string>('DO_SPACES_ENDPOINT'),
          forcePathStyle: config.get('DO_S3') === 'MINIO',
          credentials: {
            accessKeyId: config.get<string>('DO_SPACES_KEY'),
            secretAccessKey: config.get<string>('DO_SPACES_SECRET'),
          },
        }),
      inject: [ConfigService],
    },
    ExportS3Service,
  ],
  exports: [ExportS3Service],
})
export class ExportS3Module {}
