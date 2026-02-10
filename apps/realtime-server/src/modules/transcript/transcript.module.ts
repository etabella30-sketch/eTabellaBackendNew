import { GlobalModule } from '@app/global';
import { KafkaSharedModule } from '@app/global/modules/kafka-shared.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TranscriptController } from '../../controllers/transcript/transcript.controller';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { LogService } from '@app/global/utility/log/log.service';
import { TranscriptService } from '../../services/transcript/transcript.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { ExporttranscriptService } from 'apps/realtime-server/src/services/exporttranscript/exporttranscript.service';
import { UtilityService } from '../../services/utility/utility.service';
import { TranscriptHtmlService } from '../../services/transcript/transcript-html.service';
import { ThemeCssService } from '../../services/transcript/theme-css.service';
import { JwtMiddleware } from '@app/global/middleware/jwt.middleware';
import { RedisModule } from '@nestjs-modules/ioredis';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { UsersService } from '../../services/users/users.service';
import { WebSocketModule } from '@app/global/modules/websocket.module';
import { GenerateWordIndexService } from '../../services/exporttranscript/generate_word_index/generate_word_index.service';
import { TranscriptpublishService } from '../../services/transcript/transcript_publish.service';
import { VerifypdfService } from '../../services/transcript/verifypdf/verifypdf.service';
import { FileVersionService } from '../../services/transcript/file-version/file-version.service';
import { filecopyService } from '../../services/transcript/filecopy/filecopy.service';
import { ConversionJsService } from '../../services/conversion.js/conversion.js.service';
import { FeedDataService } from '../../services/feed-data/feed-data.service';
import { FactController } from '../../controllers/fact/fact.controller';
import { FactService } from '../../services/fact/fact.service';
import { DoclinkController } from '../../controllers/doclink/doclink.controller';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { FactsheetController } from '../../controllers/factsheet/factsheet.controller';
import { OpenFgaService } from '../../services/open-fga/open-fga.service';
// import { FactFgaService } from '../../services/fact-fga/fact-fga.service';
// import { DocFgaService } from '../../services/doc-fga/doc-fga.service';
// import { IssueFgaService } from '../../services/issue-fga/issue-fga.service';

@Module({
  imports: [
    GlobalModule,
    KafkaSharedModule, WebSocketModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        type: 'single',
        url: config.get('REDIS_URL'),
      }),
    }),
  ],
  controllers: [TranscriptController, FactController, DoclinkController],
  providers: [DbService, QueryBuilderService, ConfigService, LogService, TranscriptService, DateTimeService,
    ExporttranscriptService, UtilityService, TranscriptHtmlService, ThemeCssService, RedisDbService, UsersService,
    GenerateWordIndexService, TranscriptpublishService, VerifypdfService, filecopyService, FileVersionService, ConversionJsService, FeedDataService,
    FactService, 
    // FactFgaService,
     DoclinkService,
      // OpenFgaService, 
    // IssueFgaService,
    // DocFgaService
  ],
  exports: [TranscriptService, UtilityService, ConfigService,
    // OpenFgaService, 
    // IssueFgaService, 
    // DocFgaService
  ] // Exporting the provider
})
export class TranscriptModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(TranscriptController,
        FactController,
        DoclinkController,FactsheetController
      );
  }
}
