// src/modules/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from '../../shared/shared.module';

@Global()
@Module({
    imports: [ConfigModule, SharedModule],
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                return {
                    port: Number(configService.get('REDIS_PORT')),
                    host: configService.get('REDIS_IP'),
                    password: configService.get('REDIS_PASSWORD'),
                    // Redis persistence configuration
                    // save: '900 1 300 10 60 10000',
                    // dbfilename: 'dump.rdb',
                    // appendonly: 'yes',
                    // appendfsync: 'everysec',
                    // 'auto-aof-rewrite-percentage': 100,
                    // 'auto-aof-rewrite-min-size': '64mb',

                    // Redis persistence configuration
                    dir: configService.get('REDIS_DB_DIR'),  // Custom drive path
                    dbfilename: configService.get('REDIS_DB_FILE'),// 'custom-dump.rdb',
                    appendonly: 'yes',
                    appendfilename: 'custom-appendonly.aof',
                    appendfsync: 'everysec',
                };
            },
            inject: [ConfigService],
        },
    ]
})
export class RedisCacheModule { }