import { Module } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { QueryBuilderService } from '@app/global/db/pg/query-builder.service';
import { ConfigService } from '@nestjs/config';
import { GlobalModule } from '@app/global';

@Module({
   imports: [GlobalModule],
   controllers: [],
   providers: [DbService, QueryBuilderService, ConfigService],
   exports: [DbService, QueryBuilderService, ConfigService],
})
export class QueueProcessModule { }