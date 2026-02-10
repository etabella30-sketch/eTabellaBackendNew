import { Processor, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
@Processor('export-queue')
export class exportProcessor {
  constructor(
    private config: ConfigService
  ) {

  }

  @Process({ concurrency: 5 }) //
  async handlePagination(job: Job) {
    try {
    } catch (error) {
    }
  }

}