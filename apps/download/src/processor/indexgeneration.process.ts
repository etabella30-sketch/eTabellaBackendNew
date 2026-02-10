import { LogService } from '@app/global/utility/log/log.service';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { IndexfileService } from '../services/indexfile/indexfile.service';
import { IndexGenerationJob } from '../interfaces/download.interface';
// src/index-generation/index-generation.interface.ts


@Processor('index-generation')
export class IndexGenerationProcessor {
  constructor(private readonly indexFileService: IndexfileService, private logService: LogService) { }
  @Process({ name: 'generate', concurrency: 5 })
  async handleGeneration(job: Job<IndexGenerationJob>) {
    console.log('Processing job:', job.data);
    const { logApp } = job.data;
    this.logService.warn(`Processing job ${job.id} - Index generation for task ${job.data.query.nDTaskid}`, logApp)

    try {
      const result = await this.indexFileService.createIndexFile(
        job.data.query,
        job.data.outputPath,
        job.data.logApp
      );



      this.logService.warn(`Completed job ${job.id} - Index generation successful`, logApp)
      return { success: true, result };
    } catch (error) {
      this.logService.warn(`Failed job ${job.id} - Index generation failed: ${error.message}`, logApp)
      throw error; // This will trigger job retry if attempts remain
    }
  }
}
