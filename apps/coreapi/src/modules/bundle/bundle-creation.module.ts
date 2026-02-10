import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BundleCreationController } from '../../controllers/bundle/bundle-creation.controller';
import { BundleCreationService } from '../../services/bundle/bundle-creation.service';
import { SharedModule } from '../../shared/shared.module';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { BundlesController } from '../../controllers/bundle/bundles.controller';
import { AssignController } from '../../controllers/assign/assign.controller';
import { AssignService } from '../../services/assign/assign.service';
import { ExportController } from '../../controllers/export/export.controller';
import { ExportService } from '../../services/export/export.service';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { deleteFilesProcessor } from '../../processor/delete-file.processor';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { RedisCacheService } from '../../services/redis-cache/redis-cache/redis-cache.service';
import { RedisCacheModule } from '../redis/redis.module';
import { copyFilesProcessor } from '../../processor/copy-file.processor';
@Module({
    imports: [
        SharedModule,
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                redis: {
                    port: Number(config.get('REDIS_PORT')),
                    host: config.get('REDIS_IP'),
                    password: config.get('REDIS_PASSWORD'),

                    // Redis persistence configuration
                    dir: config.get('REDIS_DB_DIR'),  // Custom drive path
                    dbfilename: config.get('REDIS_DB_FILE'),// 'custom-dump.rdb',
                    appendonly: 'yes',
                    appendfilename: 'custom-appendonly.aof',
                    appendfsync: 'everysec',
                }, //as RedisOptions
            }),
        }),

        BullModule.registerQueue({
            name: 'delete-files',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
            },
            limiter: {
                max: 1000, // Maximum number of jobs to keep in Redis
                duration: 60000, // Time window in milliseconds (e.g., 1 minute)
            },
        }), BullModule.registerQueue({
            name: 'copy-files',
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
            },
            limiter: {
                max: 1000, // Maximum number of jobs to keep in Redis
                duration: 60000, // Time window in milliseconds (e.g., 1 minute)
            },
        }),
        WinstonConfigModule.forRoot('coreapi')
    ],
    controllers: [BundlesController, BundleCreationController, AssignController, ExportController],
    providers: [BundleCreationService, AssignService, ExportService, deleteFilesProcessor, copyFilesProcessor, LogService, RedisCacheService]
})
export class BundleCreationModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(JwtMiddleware)
            .forRoutes(BundlesController, BundleCreationController, AssignController, ExportController);
    }
}