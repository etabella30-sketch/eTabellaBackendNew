import { Module } from '@nestjs/common';
import { PaginationController } from './pagination.controller';
import { PaginationService } from './pagination.service';
import { GlobalModule } from '@app/global';
import { PaginationdataService } from './services/paginationdata/paginationdata.service';
import { PaginationdataModule } from './modules/paginationdata/paginationdata.module';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { UtilityService } from './utility/utility.service';
import { LogService } from '@app/global/utility/log/log.service';
import { WinstonConfigModule } from '@app/global/modules/winston.module';
import { KafkaModule } from '@app/global/modules/kafka.module';

@Module({
  imports: [GlobalModule, PaginationdataModule,
    // KafkaSharedModule,

    KafkaModule.register('etabella-pagination', 'pagination-group'),
    WinstonConfigModule.forRoot('pagination')
  ],
  controllers: [PaginationController],
  providers: [PaginationService],
})
export class PaginationModule { }
