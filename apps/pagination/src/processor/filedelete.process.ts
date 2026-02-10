import { LogService } from '@app/global/utility/log/log.service';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import * as fs from 'fs';


@Processor('pagination-queue')
export class DeleteProcessor {
  constructor(private logService: LogService) { }
  @Process({ name: 'FILEDELETE', concurrency: 5 })
  async handleDelete(job: Job) {
    const { tempFilePath, nID, logApp } = job.data;

    try {
      fs.unlink(tempFilePath, (err) => {
        if (err) {
          this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nID} . ${err?.message}`, logApp)
          console.error(`Failed to delete temp file: ${tempFilePath}`);
          // throw err;
        } else {
          this.logService.warn(`FILE DELETED ${tempFilePath}  ${nID}`, logApp)
          // console.log(`Temp file deleted: ${tempFilePath}`);
        }
      });
    } catch (error) {
      this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nID} . ${error.message}`, logApp)
      console.error(`Error deleting temp file: ${tempFilePath}. ${error.message}`);
      // throw error;
    }
  }
}
