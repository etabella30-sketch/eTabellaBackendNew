import { DynamicModule, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { GlobalModule } from '@app/global';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { ProcessManager } from '@app/mipl-queue/services/process-manage/process.manager';
import { QueueConnectionManager } from '@app/mipl-queue/services/queue-connection/queue-connection.manager';
import { UserQueueManager } from '@app/mipl-queue/services/user-queue/user-queue.manager';
import { DeadLetterManager } from '@app/mipl-queue/services/dead-letter/dead-letter.manager';
import { QueueProgressTracker } from '@app/mipl-queue/services/queue-progress/queue-progress.tracker';
import { MiplQueueService } from '@app/mipl-queue/services/mipl-queue/mipl-queue.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from '../queue.module';

@Module({})
export class MiplQueueModule {
  static registerAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => Promise<any> | any;
    queueName: string; 
    queueModule: any;
  }): DynamicModule {
    return {
      module: MiplQueueModule,
      imports: [
        ...(options.imports || []),
        EventEmitterModule.forRoot(),
        GlobalModule,
        WinstonConfigModule.forRoot('queue'),
        ConfigModule,
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: async (config: ConfigService) => ({
            redis: {
              port: 6379, //Number(config.get('REDIS_PORT')),
              host: 'localhost',//config.get('REDIS_IP'),
              // password: config.get('REDIS_PASSWORD'),
            }
          }),
        })
        ,QueueModule.registerQueuesAsync(options,options.useFactory()),
      ],
      providers: [
        {
          provide: 'QUEUE_CONFIG',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'RABBITMQ_CONFIG',
          useFactory: (configService: ConfigService) => ({
            host: configService.get<string>('RABBITMQ_HOST'),
            port: configService.get<string>('RABBITMQ_PORT'),
            username: configService.get<string>('RABBITMQ_USER'),
            password: configService.get<string>('RABBITMQ_PASS'),
            virtualHost: configService.get<string>('RABBITMQ_VHOST', '/'),
            heartbeat: 60,
            connectTimeout: 20000
          }),
          inject: [ConfigService],
        },
        {
          provide: 'REDIS_CONFIG',
          useFactory: (configService: ConfigService) => ({
            host: configService.get('REDIS_IP'),
            port: configService.get('REDIS_PORT'),
            password: configService.get('REDIS_PASSWORD'),
            // db: configService.get('REDIS_DB', 0),
            // keyPrefix: `queue:${options.queueName}:`,
            // connectTimeout: 10000,
            // maxRetriesPerRequest: 3
          }),
          inject: [ConfigService],
        },
        {
          provide: 'QUEUE_NAME', 
          useValue: options.queueName,
        },
        // DownloadProcessor,
        // DynamicQueueService,
        ProcessManager,
        QueueConnectionManager,
        UserQueueManager,
        DeadLetterManager,
        QueueProgressTracker,
        MiplQueueService,
        LogService,
        DateTimeService,
        {
          provide: options.queueName,
          useExisting: MiplQueueService
        }
      ],
      exports: [options.queueName
        // , DynamicQueueService
        , BullModule
      ],
    };
  }
}