import { Module } from '@nestjs/common';

import { RealtimeServerController } from './realtime-server.controller';
import { RealtimeServerService } from './realtime-server.service';
import { ConfigService } from '@nestjs/config';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { SessionController } from './controllers/session/session.controller';
import { SessionService } from './services/session/session.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { SocketService } from './socket/socket.service';
import { EventsGateway } from './events/events.gateway';
import { WebSocketModule } from '@app/global/modules/websocket.module';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { FirebaseService } from './services/firebase/firebase.service';
import { IssueController } from './controllers/issue/issue.controller';
import { IssueService } from './services/issue/issue.service';
import { UsersService } from './services/users/users.service';
import { AnnotTransferService } from './services/annot-transfer/annot-transfer.service';
import { ExportService } from './services/export/export.service';
import { UtilityService } from './services/utility/utility.service';
import { ConversionJsService } from './services/conversion.js/conversion.js.service';
import { FileproviderService } from './services/fileprovider/fileprovider.service';
import { SyncController } from './controllers/sync/sync.controller';
import { SyncService } from './services/sync/sync.service';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { KafkaSharedModule } from '@app/global/modules/kafka-shared.module';
import { UploadController } from './controllers/upload/upload.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FeedDataService } from './services/feed-data/feed-data.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { GlobalModule } from '@app/global';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { TranscriptModule } from './modules/transcript/transcript.module';
import { FeedController } from './controllers/feed/feed.controller';
import { FeedService } from './feed/feed.service';
import { MarknavController } from './controllers/marknav/marknav.controller';
import { MarknavService } from './services/marknav/marknav.service';
import { MarksService } from './services/marks/marks.service';
import { FactsheetController } from './controllers/factsheet/factsheet.controller';
import { FactsheetService } from './services/factsheet/factsheet.service';
// import { IssueFgaService } from './services/issue-fga/issue-fga.service';
// import { FactFgaService } from './services/fact-fga/fact-fga.service';
import { OpenFgaService } from './services/open-fga/open-fga.service';
import { FactController } from './controllers/fact/fact.controller';
import { FactService } from './services/fact/fact.service';
import { CaseTupleController } from './controllers/case-tuple/case-tuple.controller';
import { CaseTupleService } from './services/case-tuple/case-tuple.service';
// import { DocFgaService } from './services/doc-fga/doc-fga.service';
import { SessionJobService } from './services/session-job/session-job.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    GlobalModule,
    ScheduleModule.forRoot(),
    KafkaSharedModule,
    // KafkaModule.register('etabella-realtimeserver', 'realtimeserver-group'),
    WebSocketModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'assets'),
      serveStaticOptions: { index: false },
    }),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
    
    WinstonConfigModule.forRoot('upload'),TranscriptModule
  ],
  controllers: [FeedController,RealtimeServerController, SessionController, IssueController, SyncController, UploadController, MarknavController, FactsheetController, FactController, CaseTupleController],
  providers: [RealtimeServerService, DbService, QueryBuilderService, ConfigService, EventsGateway,
    SessionService, DateTimeService, SchedulerService, SocketService, StreamDataService, SavedataService, FirebaseService, 
    IssueService, 
    // IssueFgaService, 
    FactService, 
    // FactFgaService, 
    // OpenFgaService,
     UsersService, AnnotTransferService, ExportService, UtilityService, ConversionJsService, FileproviderService, SyncService, FeedDataService,
    RedisDbService,LogService,TranscriptModule, FeedService, MarknavService, MarksService, FactsheetService, CaseTupleService, SessionJobService
    // , DocFgaService
  ],
  exports: [] // Exporting the provider
})
export class RealtimeServerModule { }
