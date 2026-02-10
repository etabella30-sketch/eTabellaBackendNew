import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { GenerateindexController } from '../controllers/generateindex/generateindex.controller';
import { GenerateindexService } from '../services/generateindex/generateindex.service';
import { IndexDataService } from '../services/generateindex/indexdata.service';
import { UtilityService } from '../utility/utility.service';
import { IndexFinalService } from '../services/generateindex/indexfinal.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { SharedModule } from './shared/shared.module';
import { PdfGenerateService } from '../services/pdf-generate/pdf-generate.service';
import { QueueProcessor } from '../processors/queue.processor';

@Module({
    imports: [SharedModule,
        //  KafkaSharedModule
        KafkaModule.register('etabella-indexapi', 'indexapi-group')
        , BullModule.forRootAsync({
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
        })],
    controllers: [GenerateindexController],
    providers: [GenerateindexService, UtilityService, IndexDataService, IndexFinalService, ConfigService, LogService,
        EventLogService, PdfGenerateService, QueueProcessor]
})
export class GenerateindexModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(GenerateindexController);
    }

}
