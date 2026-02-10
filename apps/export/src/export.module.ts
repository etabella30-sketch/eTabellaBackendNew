import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ExportFileController } from './controllers/export-file/export-file.controller';
import { ExportFileService } from './services/export-file/export-file.service';
import { CommonModule } from 'apps/coreapi/src/modules/common/common.module';
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

@Module({
  imports: [
    // KafkaSharedModule,
    KafkaModule.register('etabella-export', 'export-group'),
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
  })

  ],
  controllers: [ExportController, ExportFileController],
  providers: [ExportService, ExportFileService, KafkaGlobalService, UtilityService, ScaleannotsService, ScalecontentService,
    LogService,exportProcessor
  ],
})
export class ExportModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(ExportFileController);
  }
}
