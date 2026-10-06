import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { DownloadAuthMiddleware } from './auth/download-auth.middleware';
import { DownloadTicketController } from './controllers/downloadticket/downloadticket.controller';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { GlobalModule } from '@app/global';
import { CommonModule } from 'apps/coreapi/src/modules/common/common.module';
import { CloudPlatformModule, LegacyEnvelope } from '@app/platform-cloud';
import { TEAM_USERS_LEGACY_SHAPES } from '@app/rt-features/team-users';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { DownloadfileController } from './controllers/downloadfile/downloadfile.controller';
import { DownloadfileService } from './services/downloadfile/downloadfile.service';
import { SharedModule } from './shared/shared.module';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3ClientService } from './services/s3-client/s3-client.service';
import { TaskProcessorModule } from './modules/taskprocess.module';
import { QueueModule } from './modules/queue.module';
import { QueueService } from './services/queue/queue.service';
import { QueueRegistrationService } from './services/queue-registration/queue-registration.service';
import { PresentReportService } from './services/present-report/present-report.service';
import { PresentIndexService } from './services/present-index/present-index.service';
import { UtilityService } from './utility/utility.service';

@Module({
  imports: [SharedModule, QueueModule, TaskProcessorModule,
    KafkaModule.register('etabella-download', 'download-group'),
    // CommonModule mounts the shared team-users route; its kernel ports come from here (shared-libraries plan Phase 5).
    CloudPlatformModule.forRoot({ envelope: new LegacyEnvelope({ legacyShape: TEAM_USERS_LEGACY_SHAPES }) }),
    CommonModule, GlobalModule,
    WinstonConfigModule.forRoot('download')],
  controllers: [DownloadController, DownloadfileController, DownloadTicketController],
  providers: [KafkaGlobalService, DownloadService, DownloadfileService, LogService, EventLogService, QueueService, QueueRegistrationService,
    PresentReportService, PresentIndexService, UtilityService
    // ,DownloadProcessor
    // , S3ClientService
  ],
})
export class DownloadModule implements NestModule {
  // Every file route needs a signed-in caller (bearer token, a ?dlt= download ticket, or the
  // access_token cookie; see DownloadAuthMiddleware) - it used to be commented out, so GET
  // /download?cPath= streamed any object in the bucket to anyone. What each caller may read is
  // checked in DownloadfileController (auth/download-access.ts).
  // Tickets are handed out only to a bearer session, via the shared JwtMiddleware alone.
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(DownloadAuthMiddleware)
      .forRoutes(DownloadfileController);
    consumer
      .apply(JwtMiddleware)
      .forRoutes(DownloadTicketController);
  }
}
