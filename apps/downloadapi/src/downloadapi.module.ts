import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { DownloadapiController } from './downloadapi.controller';
import { DownloadapiService } from './downloadapi.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { GlobalModule } from '@app/global';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { LogService } from '@app/global/utility/log/log.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProcessStatusService } from './services/process-status/process-status.service';
import { BullModule } from '@nestjs/bull';
import { DownloadProcessor } from './processors/download-processor';
import { QueueListenerService } from './services/queue-listener/queue-listener.service';
import { DownloadProcessService } from './task/download-process/download-process.service';
import { ProcessDataService } from './services/process-data/process-data.service';
import { RedisService } from './util/redis/redis.service';
import { DefaultService } from './services/default/default.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { UpdateFileSizeService } from './services/batch-process/update-file-size/update-file-size.service';
import { FileSizeService } from './services/batch-process/file-size/file-size.service';
import { FileBatchService } from './services/batch-process/file-batch/file-batch.service';
import { FilePartService } from './services/batch-process/file-part/file-part.service';
import { BatchSplitService } from './services/batch-process/batch-split/batch-split.service';
import { SmallbatchService } from './task/small/smallbatch/smallbatch.service';
import { LargebatchService } from './task/large/largebatch/largebatch.service';
import { RedisQueueService } from './queue/redis-queue/redis-queue.service';
import { PartUploadService } from './task/large/part-upload/part-upload.service';
import { SmallPartUploadService } from './task/small/small-part-upload/small-part-upload.service';
import { S3Module } from './modules/s3/s3.module';
import { UploadS3Service } from './task/large/upload-s3/upload-s3.service';
import { HeaderService } from './services/header/header.service';
import { TransformNameService } from './services/transform-name/transform-name.service';
import { StreamS3Service } from './task/small/stream-s3/stream-s3.service';
import { ConfigKeyService } from './util/config-key/config-key.service';
import { FinalizeArchiverService } from './merge/finalize-archiver/finalize-archiver.service';
import { DeleteTarProcessor } from './processors/delete-processor';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { KafkaService } from './util/kafka/kafka.service';
import { GeneratePresignedUrlService } from './merge/generate-presigned-url/generate-presigned-url.service';
import { S3FileService } from './services/s3-file.service';
import { S3FileProcessor } from './processors/s3-file.processor';

@Module({
  imports: [
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
    KafkaModule.register('etabella-download-v2', 'download-group-v2'),
    GlobalModule,
    WinstonConfigModule.forRoot('download'),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          port: Number(config.get('REDIS_PORT')),
          host: config.get('REDIS_IP'),
          password: config.get('REDIS_PASSWORD'),
          // db: Number(config.get('REDIS_DB') || 0),
        },
      }),
    }),
    BullModule.registerQueue({
      name: 'download-queue',
      settings: {
        lockDuration: 1000 * 60 * 60 * 24,  // e.g. 24 hours
        stalledInterval: 30_000,   // check every 30 sec
        maxStalledCount: 3,        // retry a stalled job up to 3 times
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',  // or 'fixed'
          delay: 5_000,         // 5 seconds before 1st retry
        },
        removeOnComplete:true,
        // removeOnComplete: {
        //   age: 3600,            // keep success logs for 1 hour
        // },
        removeOnFail: {
          count: 100,           // keep last 100 failures for inspection
        },
      },
      limiter: {
        max: 1_000,
        duration: 60_000,
      },
    }),
    BullModule.registerQueue({
      name: 'delete-tar-queue',
      settings: {
        lockDuration: 1000 * 60 * 15,  // e.g. 5 minutes
        stalledInterval: 30_000,   // check every 30 sec
        maxStalledCount: 3,        // retry a stalled job up to 3 times
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',  // or 'fixed'
          delay: 5_000,         // 5 seconds before 1st retry
        },
        removeOnComplete:true,
        removeOnFail: {
          count: 100,           // keep last 100 failures for inspection
        },
      },
      limiter: {
        max: 10_000,
        duration: 60_000,
      },
    }),
    BullModule.registerQueue({
      name: 's3-file-processing',
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    S3Module
  ],
  controllers: [DownloadapiController],
  providers: [DownloadapiService,
     KafkaGlobalService, 
    LogService,
    DbService, QueryBuilderService, RedisDbService, ProcessStatusService, DownloadProcessor,
    QueueListenerService, DownloadProcessService, ProcessDataService,
    UpdateFileSizeService, RedisService, FileSizeService, FileBatchService, FilePartService,
    DefaultService, BatchSplitService, DateTimeService, SmallbatchService, LargebatchService, RedisQueueService, PartUploadService, 
    SmallPartUploadService, UploadS3Service,DeleteTarProcessor, HeaderService, TransformNameService, 
    StreamS3Service, ConfigKeyService, FinalizeArchiverService, KafkaService, GeneratePresignedUrlService, S3FileService, S3FileProcessor
  ],
})
export class DownloadapiModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(DownloadapiController);
    }
}