import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ChunksUploadService } from './services/chunks-upload/chunks-upload.service';
import { UtilityService } from './services/utility/utility.service';
import { ChunkManagementController } from './controllers/chunk-management/chunk-management.controller';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';
import { BullModule } from '@nestjs/bull';
import { MergeProcessor } from './processor/merge.processor';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { JwtStrategy } from '@app/global/utility/jwt/jwt.strategy';
import { GlobalModule } from '@app/global';
import { VerifypdfService } from './services/verifypdf/verifypdf.service';
// import { FileVerificationProcessor } from './processor/file-verification.processor';
import { UpdatefileinfoService } from './services/updatefileinfo/updatefileinfo.service';
import { FilesystemService } from '@app/global/utility/filesystem/filesystem.service';
import { ZipService } from './services/zip/zip.service';
import { UnzipProcessor } from './processor/unzip.processor';
import { RealtimeUploadController } from './controllers/realtime-upload/realtime-upload.controller';
import { ExportsController } from './controllers/exports/exports.controller';
import { ExportsService } from './services/exports/exports.service';
import { ExportExcelProcessor } from './processor/export-excel.processor';
import { filecopyService } from './services/filecopy/filecopy.service';
import { FileCopyProcessor } from './processor/copy-file.processor';
import { LogService } from '@app/global/utility/log/log.service';
import { ConvertProcessor } from './processor/convert.processor';
import { FileconvertController } from './controllers/fileconvert/fileconvert.controller';
import { NativefileconvertService } from './services/nativefileconvert/nativefileconvert.service';
import { OcrProcessor } from './processor/ocrread.processor';
import { OcrService } from './services/ocr/ocr.service';
import { ConvertService } from './services/convert/convert.service';
import { OcrController } from './controllers/ocr/ocr.controller';
import { SnapProcessor } from './processor/snap.processor';
import { SnapService } from './services/snap/snap.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { SequenceMergeProcessor } from './processor/sequential.merge.processor';
import { FileMergeProcessor } from './processor/file.specify.merge.processor';
import { MovetoS3Service } from './services/moveto-s3/moveto-s3.service';
import { ConvertEmailProcessor } from './processor/convert_email.processor';
import { EmailService } from './services/convert/email/email.service';
import { ProfileController } from './controllers/profile/profile.controller';
import { ProfileService } from './services/profile/profile.service';
import { HelpcenterService } from './services/helpcenter/helpcenter.service';
import { FileVersionService } from './services/file-version/file-version.service';
import { deleteFilesProcessor } from './processor/delete-file.processor';
import { HelpcenterController } from './controllers/helpcenter/helpcenter.controller';
import { QueueProcessModule } from './modules/queue-process.module';
import { QueueManageService } from './services/queue-manage/queue-manage.service';
import { chunkDestination, chunkFilename } from './utility/upload-paths';
import { UploadCallerMiddleware } from './auth/upload-caller.middleware';

/** Every HTTP controller of the upload app; all of them sit behind JwtMiddleware (configure()). */
const UPLOAD_CONTROLLERS = [UploadController, ChunkManagementController, RealtimeUploadController, ExportsController, FileconvertController, OcrController, ProfileController, HelpcenterController];

@Module({
  imports: [
    GlobalModule,
    KafkaModule.register('etabella-upload', 'upload-group'),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
    MulterModule.register({
      // The form's identifier / chunkNumber name the chunk's folder and file: both are checked
      // here (multer runs before the controller) and kept strictly inside the chunk root.
      storage: multer.diskStorage({
        destination: chunkDestination,
        filename: chunkFilename,
      })
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        redis: {
          port: Number(config.get('REDIS_PORT')),
          host: config.get('REDIS_IP'),
          password: config.get('REDIS_PASSWORD'),
          db:2
        }, //as RedisOptions
      }),
    }),

    BullModule.registerQueue({
      name: 'file-merge',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),

    /*  BullModule.registerQueue({
        name: 'sequence-file-merge',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        limiter: {
          max: 1000, // Maximum number of jobs to keep in Redis
          duration: 60000, // Time window in milliseconds (e.g., 1 minute)
        },
      }),*/
    BullModule.registerQueue(
      {
        name: 'sequence-file-merge',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        limiter: {
          max: 1000,
          duration: 60000,
        },
      },
      {
        name: 'file-specific-merge',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        limiter: {
          max: 1000,
          duration: 60000,
        },
      }
    ),
    BullModule.registerQueue({
      name: 'unzip-process',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'export-excel',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'filecopy-process',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'convert',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'convert-email',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }), BullModule.registerQueue({
      name: 'fileocr-process',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'snap-process',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }), BullModule.registerQueue({
      name: 'delete-files',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    BullModule.registerQueue({
      name: 'elastic-index-process',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    /*  BullModule.registerQueue({
        name: 'convert-zip',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        limiter: {
          max: 1000, // Maximum number of jobs to keep in Redis
          duration: 60000, // Time window in milliseconds (e.g., 1 minute)
        },
      }), */
    WinstonConfigModule.forRoot('upload')/*,
    AlphaQueueModule.registerAsync({
      imports: [ConfigModule,QueueProcessModule],
      inject: [ConfigService],
      queueName: 'demo-queue',
      dbId: 0,
      useFactory: async (configService: ConfigService) => ({
        name: 'demoqueue',
        nTCatid: 0,
        steps: [],
        maxUsers: 0,
        eventInterval: 3000
      }),
    })*/
  ],
  controllers: UPLOAD_CONTROLLERS,
  providers: [UploadService, DbService, QueryBuilderService, ConfigService, RedisDbService,
    ChunksUploadService, UtilityService, MergeProcessor, UnzipProcessor, JwtStrategy, VerifypdfService, UpdatefileinfoService, FilesystemService, ExportsService, ExportExcelProcessor,
    FileCopyProcessor, filecopyService, LogService,
    ConvertProcessor, NativefileconvertService, OcrProcessor, OcrService, ConvertService, SnapProcessor,
    SnapService, SequenceMergeProcessor, FileMergeProcessor, MovetoS3Service, ConvertEmailProcessor, EmailService, ProfileService,
    FileVersionService, deleteFilesProcessor, HelpcenterService, QueueManageService

  ],
})
export class UploadModule implements NestModule {

  configure(consumer: MiddlewareConsumer) {
    // Every route of every controller needs a signed-in session, a new route included by default.
    // No route has a legitimate caller without one: the legacy app, the new app and the venue apps
    // all send `Authorization: Bearer` (the venue's is the user's cloud cJwt). Swagger and its
    // /swagger-json (the Docker healthcheck) are not controller routes and stay open.
    // Nest middleware runs before interceptors, so FileInterceptor (multer) never sees an
    // unauthenticated request and writes nothing for it.
    // UploadCallerMiddleware then records the token user on the request (req.uploadCaller): multer
    // replaces req.body, so the nMasterid JwtMiddleware wrote there is gone on multipart routes. It
    // also hands multer the chunk gate (only the user who opened an upload may add chunks to it).
    consumer
      .apply(JwtMiddleware, UploadCallerMiddleware)
      .forRoutes(...UPLOAD_CONTROLLERS);
  }
}

