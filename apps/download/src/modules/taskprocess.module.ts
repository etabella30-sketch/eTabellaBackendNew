import { Module } from '@nestjs/common';
import { QueueModule } from './queue.module';
import { DownloadProcessor } from '../processor/download.process';
import { DeleteProcessor } from '../processor/filedelete.process';
import { S3ClientService } from '../services/s3-client/s3-client.service';
import { LogService } from '@app/global/utility/log/log.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { IndexfileService } from '../services/indexfile/indexfile.service';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { UtilityService } from '../utility/utility.service';
import { SharedModule } from '../shared/shared.module';
import { KafkaModule } from '@app/global/modules/kafka.module';
import { IndexGenerationProcessor } from '../processor/indexgeneration.process';

@Module({
  imports: [SharedModule, QueueModule, EventEmitterModule,
    KafkaModule.register('etabella-download', 'download-group'),
  ],
  providers: [DownloadProcessor, DeleteProcessor, S3ClientService, LogService, IndexfileService, DbService, QueryBuilderService, UtilityService,
    IndexGenerationProcessor
  ],
  exports: [S3ClientService]
})
export class TaskProcessorModule { }
