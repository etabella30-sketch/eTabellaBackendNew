import { Module } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { UtilityService } from '../services/utility/utility.service';
import { EventLogService } from '@app/global/utility/event-log/event-log.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { OpenFgaService } from '@app/global/open-fga/open-fga.service';

@Module({
    imports: [
        // KafkaSharedModule,
     KafkaModule.register('etabella-coreapi', 'coreapi-group'),
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                type: 'single',
                url: config.get('REDIS_URL'),
            }),
        })
    ],
    controllers: [],
    providers: [DbService, QueryBuilderService, RedisDbService,UtilityService,EventLogService
        // ,OpenFgaService
    ],
    exports: [DbService, RedisDbService,UtilityService,EventLogService
        // ,OpenFgaService
    ]
})
export class SharedModule {

}