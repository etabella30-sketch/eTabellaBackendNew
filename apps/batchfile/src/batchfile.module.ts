import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BatchfileController } from './batchfile.controller';
import { BatchfileService } from './batchfile.service';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { UtilityService } from './utility/utility.service';
import { GlobalModule } from '@app/global';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueProcessor } from './processors/queue.processor';
import { BatchModule } from './modules/batch/batch.module';
import { BatchController } from './controllers/batch/batch.controller';
import { BatchService } from './services/batch/batch.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { LogService } from '@app/global/utility/log/log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';

@Module({
  imports: [GlobalModule,
    //  KafkaSharedModule,
    KafkaModule.register('etabella-batch', 'batch-group'),
    BatchModule,
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
      name: 'batchfile-download',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    WinstonConfigModule.forRoot('indexing')
  ],
  controllers: [BatchfileController],
  providers: [BatchfileService],
})
export class BatchfileModule {
}
