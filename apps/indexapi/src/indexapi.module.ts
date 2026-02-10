import { GlobalModule } from '@app/global';
import { Module } from '@nestjs/common';
import { IndexapiController } from './indexapi.controller';
import { IndexapiService } from './indexapi.service';
import { GenerateindexModule } from './modules/generateindex.module';
import { BatchModule } from 'apps/batchfile/src/modules/batch/batch.module';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { KafkaModule } from '@app/global/modules/kafka.module';

@Module({
  imports: [GlobalModule, IndexModule,
    //  KafkaSharedModule,
    KafkaModule.register('etabella-indexapi', 'indexapi-group'),
    /* ClientsModule.registerAsync([
         {
           name: 'KAFKA_SERVICE',
           imports: [ConfigModule], // Import ConfigModule to use ConfigService
           inject: [ConfigService], // Inject ConfigService
           useFactory: (configService: ConfigService) => ({
             transport: Transport.KAFKA,
             // options: {
             //   client: {
             //     brokers: [configService.get('KAFKA_HOST') || 'localhost:9092'], // Use environment variable
             //   },
             //   // consumer: {
             //   //   groupId: configService.get('KAFKA_GROUP_ID') || 'default-group', // Use environment variable
             //   // },
             // },
             options: {
               client: {
                 brokers: [configService.get('KAFKA_HOST') || 'localhost:9092'], // Use environment variable
               },
               consumer: {
                 groupId: 'index-group',
               },
               producer: {
                 allowAutoTopicCreation: true,
                 retry: {
                   initialRetryTime: 300,
                   retries: 10,
                 },
               },
             }
           }),
         },
       ]),*/
    GenerateindexModule, BatchModule,
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
      name: 'indexgenerate-download',
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
  controllers: [IndexapiController],
  providers: [IndexapiService],
})
export class IndexModule { }
