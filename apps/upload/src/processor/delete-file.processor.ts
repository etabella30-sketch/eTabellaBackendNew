import { Processor, Process } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as fs from 'fs/promises';
import { LogService } from '@app/global/utility/log/log.service';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Processor('delete-files')
export class deleteFilesProcessor {
  assets: string = this.config.get('ASSETS');
  private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
  private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
  logApp: string = 'delete';
  constructor(private readonly config: ConfigService, private logger: LogService) { }


  @Process({ concurrency: 5 })
  async handleDeleteFiles(job: Job) {
    const { jFiles } = job.data; // jFiles is an array of file paths

    this.logger.info(`deleting files total : ${jFiles.length}`, this.logApp);
    // Iterate over each file path and attempt to delete it
    for (const filePath of jFiles) {
      try {
        // Delete the file asynchronously
        await fs.unlink(this.assets + filePath);
        this.logger.info(`Successfully deleted file: ${filePath}`, this.logApp);
      } catch (error) {
        // Log any errors encountered during deletion
        if (error.code === 'ENOENT') {
          // Handle the case where the file doesn't exist
          this.logger.info(`File not found, skipping deletion: ${filePath}`, this.logApp);
        } else {
          // Log other errors
          this.logger.error(`Error deleting file: ${filePath}`, this.logApp);
        }
      }



      // Delete from S3
      try {
        const s3FilePath = `${this.S3_BUCKET_PATH}${filePath}`;
        const command = `${this.S3_EXC_PATH} del ${s3FilePath}`;
        const { stdout, stderr } = await execAsync(command);

        if (stdout) {
          this.logger.info(`S3 deletion stdout: ${stdout}`, this.logApp);
        }
        if (stderr) {
          this.logger.warn(`S3 deletion stderr: ${stderr}`, this.logApp);
        }

        this.logger.info(`Successfully deleted S3 file: ${s3FilePath}`, this.logApp);
      } catch (error) {
        this.logger.error(`Error deleting S3 file: ${filePath}`, this.logApp);
      }



    }
  }



}
