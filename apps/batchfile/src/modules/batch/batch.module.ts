import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SharedModule } from 'apps/authapi/src/shared/shared.module';
import { UtilityService } from '../../utility/utility.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BatchService } from '../../services/batch/batch.service';
import { BatchController } from '../../controllers/batch/batch.controller';
import { LogService } from '@app/global/utility/log/log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';

@Module({
    imports: [SharedModule,
        //  KafkaSharedModule,
     KafkaModule.register('etabella-batch', 'batch-group'),
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
        })],
    controllers: [BatchController],
    providers: [BatchService, UtilityService, ConfigService,LogService]
})
export class BatchModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(BatchController);
    }

}
