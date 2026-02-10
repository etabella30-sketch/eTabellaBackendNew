import { Module } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';

@Module({
    imports: [
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                type: 'single',
                url: config.get('REDIS_URL'),
            }),
        }),
    ],
    controllers: [],
    providers: [DbService, QueryBuilderService, RedisDbService],
    exports: [DbService, RedisDbService]
})
export class SharedModule {

}