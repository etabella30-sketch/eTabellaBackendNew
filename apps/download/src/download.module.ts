import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DownloadController } from './download.controller';
import { DownloadService } from './download.service';
import { GlobalModule } from '@app/global';
import { CommonModule } from 'apps/coreapi/src/modules/common/common.module';
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
    CommonModule, GlobalModule,
    WinstonConfigModule.forRoot('download')],
  controllers: [DownloadController, DownloadfileController],
  providers: [KafkaGlobalService, DownloadService, DownloadfileService, LogService, EventLogService, QueueService, QueueRegistrationService,
    PresentReportService, PresentIndexService, UtilityService
    // ,DownloadProcessor
    // , S3ClientService
  ],
})
export class DownloadModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(JwtMiddleware)
  //     .forRoutes(DownloadfileController);
  // }
}
