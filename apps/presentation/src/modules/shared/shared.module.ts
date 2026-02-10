import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';


@Module({
    imports: [
        KafkaModule.register('etabella-presentation', 'presentation-group'),
        RedisModule.forRootAsync({
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                type: 'single',
                url: config.get('REDIS_URL'),
            }),
        }),
    ],
    controllers: [],
    providers: [DbService, QueryBuilderService, RedisDbService
        ,KafkaGlobalService
    ],
    exports: [DbService, RedisDbService
        ,KafkaGlobalService

    ]
})
export class SharedModule { }
