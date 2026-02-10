import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { PaginationdataController } from '../../controllers/paginationdata/paginationdata.controller';
import { PaginationdataService } from '../../services/paginationdata/paginationdata.service';
import { UtilityService } from '../../utility/utility.service';
import { LogService } from '@app/global/utility/log/log.service';
import { paginationProcessor } from '../../processor/pagination.processor';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaginateService } from '../../services/paginate/paginate.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { SharedModule } from '../shared/shared.module';
import { CaseAdminMiddleware } from '@app/global/middleware/case.admin.middleware';
import { DeleteProcessor } from '../../processor/filedelete.process';

@Module({
    imports: [SharedModule, KafkaModule.register('etabella-pagination', 'pagination-group'),

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
            name: 'pagination-queue',
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
    controllers: [PaginationdataController],
    providers: [PaginationdataService, UtilityService, LogService, paginationProcessor, PaginateService, DeleteProcessor]
})
export class PaginationdataModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(PaginationdataController),
            consumer
                .apply(CaseAdminMiddleware)
                .forRoutes(
                    { path: 'paginationdata/getpagination', method: RequestMethod.ALL },
                );;
    }

}
