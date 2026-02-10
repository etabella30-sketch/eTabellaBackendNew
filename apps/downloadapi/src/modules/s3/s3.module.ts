import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3Service } from '../../services/s3/s3.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3Client,
      useFactory: (config: ConfigService) => {
        return new S3Client({
          region: 'sgp1',
          endpoint: config.get<string>('DO_SPACES_ENDPOINT'),
          credentials: {
            accessKeyId: config.get<string>('DO_SPACES_KEY'),
            secretAccessKey: config.get<string>('DO_SPACES_SECRET'),
          },
        });
      },
      inject: [ConfigService],
    },
    S3Service,
  ],
  exports: [S3Service],
})

export class S3Module {}
