import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportFileController } from './controllers/export-file/export-file.controller';
import { ExportFileService } from './services/export-file/export-file.service';
import { CommonModule } from 'apps/coreapi/src/modules/common/common.module';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { TEAM_USERS_LEGACY_SHAPES } from '@app/rt-features/team-users';
import { GlobalModule } from '@app/global';
import { SharedModule } from 'apps/authapi/src/shared/shared.module';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { UtilityService } from './utility/utility.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { ScaleannotsService } from './services/scaleannots/scaleannots.service';
import { ScalecontentService } from './services/scalecontent/scalecontent.service';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { exportProcessor } from './processor/pagination.processor';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExportS3Module } from './services/s3/s3.module';
import { DataExportController } from './controllers/data-export/data-export.controller';
import { DataExportService } from './services/data-export/data-export.service';
import { DataExportProcessor } from './processor/data-export.processor';
import { DataExportRenderer } from './services/data-export/renderers.service';
import { DownloadAuthMiddleware } from 'apps/download/src/auth/download-auth.middleware';
import { DownloadTicketController } from 'apps/download/src/controllers/downloadticket/downloadticket.controller';

@Module({
  imports: [
    // KafkaSharedModule,
    KafkaModule.register('etabella-export', 'export-group'),
    // CommonModule mounts the shared team-users route; its kernel ports come from here (shared-libraries plan Phase 5).
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: TEAM_USERS_LEGACY_SHAPES }) }),
     SharedModule, CommonModule, GlobalModule,
    WinstonConfigModule.forRoot('fileexport'),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
          redis: {
              port: Number(config.get('REDIS_PORT')),
              host: config.get('REDIS_IP'),
              password: config.get('REDIS_PASSWORD'),
          }, //as RedisOptions
      }),
  }),
  BullModule.registerQueue({
      name: 'export-queue',
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
      name: 'data-export',
      defaultJobOptions: { removeOnComplete: true, removeOnFail: 50, attempts: 2 },
      limiter: { max: 200, duration: 60000 },
  }),
  ExportS3Module,

  ],
  controllers: [ExportController, ExportFileController, DataExportController, DownloadTicketController],
  providers: [ExportService, ExportFileService, KafkaGlobalService, UtilityService, ScaleannotsService, ScalecontentService,
    LogService,exportProcessor,
    DataExportService, DataExportProcessor, DataExportRenderer
  ],
})
export class ExportModule implements NestModule {
  // GET /download (ExportController, the export-file stream) used to be left off this list, so it
  // streamed any file under ./assets to anyone. It now takes the download app's sign-in: the bearer
  // token, a ?dlt= download ticket (an <a href> download cannot send the header, and the
  // access_token cookie is host-only), or the cookie. What the caller may read is checked in
  // ExportController (auth/export-access.ts).
  // GET /download/ticket hands out those tickets, to a bearer session only (the download app's
  // controller; a ticket from either app works on both, they share the key).
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(ExportFileController, DataExportController, DownloadTicketController);
    consumer
      .apply(DownloadAuthMiddleware)
      .forRoutes(ExportController);
  }
}
