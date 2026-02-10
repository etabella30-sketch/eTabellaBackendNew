import { Module } from '@nestjs/common';
import { SocketAppController } from './socket-app.controller';
import { SocketAppService } from './socket-app.service';
import { EventsGateway } from './events/events.gateway';
import { RedisModule } from '@nestjs-modules/ioredis';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { ConfigService } from '@nestjs/config';
import { WsJwtGuard } from './guards/ws.guard';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { GlobalModule } from '@app/global';
import { UploadService } from './services/upload/upload.service';
import { WebSocketModule } from '@app/global/modules/websocket.module';
import { UsersService } from './services/users/users.service';
import { SocketController } from './controllers/socket.controller';
import { IndexService } from './services/index/index.service';
import { PaginationService } from './services/pagination/pagination.service';
import { BatchfileService } from './services/batchfile/batchfile.service';
import { ExportService } from './services/export/export.service';
import { NotificationController } from './controllers/notification/notification.controller';
import { NotificationService } from './services/notification/notification.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { PresentController } from './controllers/present/present.controller';
import { PresentService } from './services/present/present.service';
import { RealtimeService } from './services/realtime/realtime.service';

@Module({
  imports: [
    KafkaModule.register('etabella-socket', 'socket-group'),
     WebSocketModule, GlobalModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
    WinstonConfigModule.forRoot('upload')
  ],
  controllers: [SocketAppController, SocketController, NotificationController, PresentController
  ],
  providers: [SocketAppService, WsJwtGuard, EventsGateway, DbService, QueryBuilderService, ConfigService, RedisDbService, LogService, UploadService,
    UsersService, IndexService, PaginationService, BatchfileService, ExportService, NotificationService, PresentService,RealtimeService],
})
export class SocketAppModule { }
