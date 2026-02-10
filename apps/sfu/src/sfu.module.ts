import { MiddlewareConsumer, Module } from '@nestjs/common';
import { SfuController } from './sfu.controller';
import { SfuService } from './sfu.service';
import { StatsController } from './controllers/stats/stats.controller';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { GlobalModule } from '@app/global';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { UtilityService } from './services/utility/utility.service';
import { ManageController } from './controllers/manage/manage.controller';
import { ManageService } from './services/manage/manage.service';
import { WorkersService } from './services/workers/workers.service';
import { SfuConfigService } from './services/sfu-config/sfu-config.service';

@Module({
  imports: [GlobalModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
    WinstonConfigModule.forRoot('pagination')
  ],
  controllers: [
    SfuController, StatsController, ManageController
  ],
  providers: [SfuService, RedisDbService, LogService, DbService, QueryBuilderService, UtilityService, ManageService, WorkersService, SfuConfigService],
})
export class SfuModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(StatsController, ManageController);
  }
}
