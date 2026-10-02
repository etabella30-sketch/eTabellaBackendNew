import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { RealtimeServerController } from './realtime-server.controller';
import { RealtimeServerService } from './realtime-server.service';
import { ConfigService } from '@nestjs/config';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { DbService } from '@app/global/db/pg/db.service';
import { SessionController } from './controllers/session/session.controller';
import { SessionService } from './services/session/session.service';
import { EclipseSessionService } from './services/eclipse-session/eclipse-session.service';
import { EclipseTcpIngestService } from './services/eclipse-ingest/eclipse-tcp-ingest.service';
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
import { EdgeModule } from './edge/edge.module';
import { EDGE_VIEWER_PROVIDER } from './events/edge-viewer.provider';
import {
  RealtimeAdminMiddleware,
  RealtimeAuthMiddleware,
  RealtimeServiceOrAdminMiddleware,
  RealtimeTargetUserMiddleware,
  RealtimeVenueAuthMiddleware,
} from './middleware/realtime-auth.middleware';
import {
  SERVICE_OR_ADMIN_ROUTES,
  SESSION_ADMIN_ROUTES,
  TARGET_USER_ROUTES,
  UPLOAD_ADMIN_ROUTES,
  VENUE_SESSION_ROUTES,
} from './middleware/realtime-auth.routes';

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
    
    WinstonConfigModule.forRoot('upload'),TranscriptModule,
    // RT venue edge box (spec rev 3 RS/edge); inert unless EDGE_ENABLED=1.
    EdgeModule
  ],
  controllers: [FeedController,RealtimeServerController, SessionController, IssueController, SyncController, UploadController, MarknavController, FactsheetController, FactController, CaseTupleController],
  providers: [RealtimeServerService, DbService, QueryBuilderService, ConfigService, EventsGateway,
    // Venue-box state for cloud viewers (edge-status, snapshot rev, D14 alerts); see events/edge-viewer.provider.ts.
    EDGE_VIEWER_PROVIDER,
    SessionService, EclipseSessionService, EclipseTcpIngestService, DateTimeService, SchedulerService, SocketService, StreamDataService, SavedataService, FirebaseService,
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
export class RealtimeServerModule implements NestModule {
  // Transcript/Fact/Doclink/Factsheet are wired in TranscriptModule. forRoutes() names controllers
  // and explicit routes only, so it never touches ServeStatic; main.ts installs the pre-routing
  // guards that cover the static files (HEAD refused; only the static allowlist in
  // middleware/realtime-http-surface.ts is served, every other static path answers 404).
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RealtimeAuthMiddleware)
      .exclude(...VENUE_SESSION_ROUTES, ...SERVICE_OR_ADMIN_ROUTES, ...TARGET_USER_ROUTES)
      .forRoutes(IssueController, MarknavController, FeedController, UploadController, CaseTupleController, SessionController);
    // Registered after the auth middleware above, which sets req.user for these routes.
    consumer.apply(RealtimeAdminMiddleware).forRoutes(...SESSION_ADMIN_ROUTES, ...UPLOAD_ADMIN_ROUTES);
    consumer.apply(RealtimeVenueAuthMiddleware).forRoutes(SyncController, ...VENUE_SESSION_ROUTES);
    consumer.apply(RealtimeServiceOrAdminMiddleware).forRoutes(...SERVICE_OR_ADMIN_ROUTES);
    consumer.apply(RealtimeTargetUserMiddleware).forRoutes(...TARGET_USER_ROUTES);
  }
}
