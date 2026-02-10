import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HyperlinkController } from './hyperlink.controller';
import { HyperlinkService } from './hyperlink.service';
import { GlobalModule } from '@app/global';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { RedisModule } from '@nestjs-modules/ioredis';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { GeneratehyperlinkService } from './services/generatehyperlink/generatehyperlink.service';
import { BullModule } from '@nestjs/bull';
import { HyperLinkProcessor } from './processor/hyperlink.processor';
import { HyperlinksearchService } from './services/hyperlinksearch/hyperlinksearch.service';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from './services/utility/utility.service';
import { HyperLinkIndexProcessor } from './processor/hyperlink.index.processor';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';

@Module({
  imports: [
    GlobalModule,
    KafkaModule.register('etabella-hyperlink', 'hyperlink-group'),
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
              groupId: 'hyperlink-group',
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
    // KafkaSharedModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
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
      name: 'hyperlink-queue',
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
      name: 'hyperlink-index-queue',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
      limiter: {
        max: 1000, // Maximum number of jobs to keep in Redis
        duration: 60000, // Time window in milliseconds (e.g., 1 minute)
      },
    }),
    WinstonConfigModule.forRoot('hyperlink')],
  controllers: [HyperlinkController],
  providers: [HyperlinkService, DbService, QueryBuilderService, ConfigService, RedisDbService, GeneratehyperlinkService,HyperLinkProcessor,HyperLinkIndexProcessor, HyperlinksearchService,LogService,UtilityService,KafkaGlobalService, EventLogService],
})
export class HyperlinkModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(HyperlinkController);
  }
}
