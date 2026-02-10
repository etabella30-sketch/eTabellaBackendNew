import { DynamicModule, Module } from '@nestjs/common';
import { GlobalModule } from '@app/global';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LogService } from '@app/global/utility/log/log.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { AlphaQueueService } from './alpha-queue.service';
import { QueueConnectionManager } from './services/connection/queue.connection.service';
import { ChannelManageService } from './services/chanel-management/chanel-manage.servce';
import { StorageManageService } from './services/storage/storage.service';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './modules/queue.module';
import { ProcessManager } from './services/process-manager/process-manager.service';
import { ReportQueueManager } from './services/report/report.manager';
import { dbManagerService } from './services/db/db.manager';
import { BatchInsertionManager } from './services/batch-insertion/batch-insertion';

@Module({})
export class AlphaQueueModule {
  static registerAsync(options: {
    imports?: any[];
    inject?: any[];
    useFactory: (...args: any[]) => Promise<any> | any;
    queueName: string;
    dbId: number;
  }): DynamicModule {
    return {
      module: AlphaQueueModule,
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
              port: Number(config.get('QUEUE_REDIS_PORT')),
              host: config.get('QUEUE_REDIS_IP'),
              password: config.get('QUEUE_REDIS_PASSWORD'),
              db: options.dbId || 0
            }
          }),
        })
        , QueueModule.registerQueuesAsync(options, options.useFactory()),
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
            host: configService.get('QUEUE_REDIS_IP'),
            port: configService.get('QUEUE_REDIS_PORT'),
            password: configService.get('QUEUE_REDIS_PASSWORD'),
            // db: configService.get('REDIS_DB', 0),
            // keyPrefix: `alpha:`,
            connectTimeout: 10000,
            maxRetriesPerRequest: 8
          }),
          inject: [ConfigService],
        },
        {
          provide: 'QUEUE_NAME',
          useValue: options.queueName,
        },
        LogService,
        DateTimeService,
        AlphaQueueService,
        QueueConnectionManager,
        ChannelManageService,
        StorageManageService,
        ProcessManager,
        ReportQueueManager,
        dbManagerService,
        BatchInsertionManager,
        // DbService,
        // QueryBuilderService,
        {
          provide: options.queueName,
          useExisting: AlphaQueueService
        }
      ],
      exports: [
        options.queueName
        , BullModule
      ]
    }
  }

}
