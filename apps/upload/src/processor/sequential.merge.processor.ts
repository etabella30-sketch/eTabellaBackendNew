import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { UploadService } from '../upload.service';
import { LogService } from '@app/global/utility/log/log.service';

@Processor('sequence-file-merge')
export class SequenceMergeProcessor {
  constructor(
    private readonly upld: UploadService,
    private readonly logService: LogService,
    @InjectQueue('file-specific-merge') private readonly fileMergeQueue: Queue
  ) {
    console.log('SequenceMergeProcessor initialized');
  }

  @Process({ concurrency: 5 })
  async handleFileMerge(job: Job) {
    try {
      const { fileId, nUPid, startChunk, endChunk, body, path } = job.data;
      // console.log(`Processing file ${fileId}`);


      this.logService.info(`Sequence Merge Started for chunks ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);
      // Add job to the file-specific-merge queue for sequential merging
      await this.fileMergeQueue.add('merge', { body, fileId, nUPid, startChunk, endChunk, path });
      // console.log(`Added merging job for file ${fileId}`);
    } catch (error) {

    }
  }
}
