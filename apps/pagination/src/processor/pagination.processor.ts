import { Processor, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PaginateService } from '../services/paginate/paginate.service';

@Processor('pagination-queue')
export class paginationProcessor {
  constructor(
    private config: ConfigService, private paginate: PaginateService
  ) {

  }

  @Process({ name: 'PAGINATION', concurrency: 5 })
  async handlePagination(job: Job) {
    try {
      await this.paginate.processPaginationData(job.data.res, job.data.body);
    } catch (error) {
    }
  }

}