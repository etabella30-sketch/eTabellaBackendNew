import { Module } from '@nestjs/common';
import { RealtimeController } from './realtime.controller';
import { RealtimeService } from './realtime.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ParseDataService } from './parse-data/parse-data.service';
import { SocketService } from './socket/socket.service';
import { UtilityService } from './utility/utility.service';
import { TcpController } from './controllers/tcp/tcp.controller';
import { TcpService } from './tcp/tcp.service';
import { EventsGateway } from './events/events.gateway';
import { SessionService } from './session/session.service';
import { HttpModule } from '@nestjs/axios';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { WebSocketModule } from '@app/global/modules/websocket.module';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { StreamDataService } from '@app/global/utility/stream-data/stream-data.service';
import { GlobalModule } from '@app/global';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { LowdbService } from '@app/global/utility/lowdb/lowdb.service';
import { SqllitedbService } from './services/sqllitedb/sqllitedb.service';
import { SessionController } from './controllers/session/session.controller';
import { SessionbuilderService } from './services/sessionbuilder/sessionbuilder.service';
import { ConnectivityService } from './services/connectivity/connectivity.service';
import { BridgeParseService } from './bridge-parse/bridge-parse.service';
import { ParseCommandService } from './services/parse-command/parse-command.service';
import { DownloadfileService } from './services/downloadfile/downloadfile.service';
import { IssueController } from './controllers/issue/issue.controller';
import { IssueService } from './services/issue/issue.service';
import { SqliteTableCreationService } from './services/sqllitedb/sqlite-table-creation.service';
import { QueryService } from './services/query/query.services';
import { SyncService } from './services/sync/sync.service';
import { BackupService } from './services/backup/backup/backup.service';
import { BridgeService } from './services/bridge/bridge.service';
import * as fs from 'fs';
import { ConversionJsService } from './services/conversion.js/conversion.js.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SessionBackupService } from './services/session-backup/session-backup.service';
import { ExportService } from './services/export/export.service';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { CliService } from './services/cli/cli.service';
import { FeedStartService } from './services/feed-start/feed-start.service';
import { SessionStoreService } from './services/session-store/session-store.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { VerifyTabsService } from './services/verify-tabs/verify-tabs.service';
import { EmailService } from './services/email/email/email.service';
import { UuidService } from './services/uuid/uuid.service';
import { AuthController } from './controllers/auth/auth.controller';
import { AuthService } from './services/auth/auth.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { UnicIdentityService } from './utility/unic-identity/unic-identity.service';
import { TranscriptpublishService } from './services/transcript/transcript_publish.service';
import { TranscriptHtmlService } from './services/transcript/transcript-html.service';
import { ThemeCssService } from './services/transcript/theme-css.service';
import { TranscriptService } from './services/transcript/transcript.service';
import { TransferHighlightsService } from './transfer/transfer-highlights/transfer-highlights.service';
import { RhighlightsService } from './transfer/rhighlights/rhighlights.service';
import { FuzzySearchService } from './transfer/fuzzy-search/fuzzy-search.service';
import { AnnotDataService } from './transfer/annot-data/annot-data.service';
import { RapidfuzzService } from './transfer/rapidfuzz/rapidfuzz.service';
import { JsonLogService } from './services/json-log/json-log.service';
import { TransferHealthService } from './services/transfer-health/transfer-health.service';
import { ScheduleModule } from '@nestjs/schedule';
import { IdentityFixService } from './services/identity-fix/identity-fix.service';
import { FeedController } from './controllers/feed/feed.controller';
import { FeedService } from './feed/feed.service';
import { FeedDataService } from './services/feed-data/feed-data.service';

import { EventEmitterModule } from '@nestjs/event-emitter';
// Ensure the 'sqlite' folder exists
const sqliteDir = join(__dirname, 'sqlite');
if (!fs.existsSync(sqliteDir)) {
  fs.mkdirSync(sqliteDir, { recursive: true });
}


@Module({
  imports: [GlobalModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),

    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join('sqlite', 'offline-data.sqlite'),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      // Set WAL mode for better concurrency
      extra: {
        journal_mode: 'WAL', // Enable Write-Ahead Logging
        busyTimeout: 15000, // Retry up to 5 seconds if the database is busy
      },
    }),

    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const publicDir = configService.get<string>('PUBLIC_DIR') || 'public';
        console.log('\n\r\n\r\n\r TRE', publicDir);
        return [
          {
            rootPath: join(__dirname, publicDir),
            exclude: ['/api*'],
          },
        ];
      },
      inject: [ConfigService],
    })

    , HttpModule, WebSocketModule,

    WinstonConfigModule.forRoot('realtime')
  ],
  controllers: [AuthController, RealtimeController, TcpController, SessionController, IssueController, FeedController],
  providers: [RealtimeService, TcpService, UtilityService, ParseDataService, SocketService, SessionBackupService, ExportService,
    EventsGateway, SessionService, DateTimeService, SchedulerService, SavedataService, StreamDataService, LogService, QueryService, SqllitedbService, SqliteTableCreationService,
    SessionbuilderService, ConnectivityService, DownloadfileService, IssueService, SyncService, BridgeParseService, ParseCommandService, BackupService, BridgeService,
    ConversionJsService, DbService, QueryBuilderService, CliService, FeedStartService, SessionStoreService, RedisDbService,
    VerifyTabsService, EmailService, UuidService, AuthService, PasswordHashService, UnicIdentityService,
    TranscriptpublishService, TranscriptHtmlService, ThemeCssService, TranscriptService, TransferHighlightsService, RhighlightsService,
    FuzzySearchService, AnnotDataService, RapidfuzzService, JsonLogService, TransferHealthService, IdentityFixService,
    FeedService, FeedDataService],
})
export class RealtimeModule { }
