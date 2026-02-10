import { Processor, Process } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import * as fs from 'fs/promises';
import { LogService } from '@app/global/utility/log/log.service';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DbService } from '@app/global/db/pg/db.service';
const execPromise = promisify(exec);

const execAsync = promisify(exec);

@Processor('copy-files')
export class copyFilesProcessor {
  assets: string = this.config.get('ASSETS');
  private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
  private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
  private s3_SPACES_ENDPOINT = this.config.get('DO_SPACES_ENDPOINT');
  private DO_SPACES_BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');

  logApp: string = 'copyfile';
  constructor(private readonly config: ConfigService, private logger: LogService,
    private db: DbService,
  ) { }


  @Process({ concurrency: 5 })
  async handleCopyFiles(job: Job) {
    const { jFiles } = job.data; // jFiles is an array of file paths

    this.logger.info(`Coping files total : ${jFiles.length}`, this.logApp);
    // Iterate over each file path and attempt to copy it
    for (const item of jFiles) {
      // Copy from S3
      const s3FilePath = `${this.S3_BUCKET_PATH}${item.cPath} ${this.S3_BUCKET_PATH}${item.cToPath}`;
      const command = `${this.S3_EXC_PATH} cp ${s3FilePath} `;
      try {
        const { stdout, stderr } = await execAsync(command);

        if (stdout) {
          this.logger.info(`S3 copy stdout: ${stdout}`, this.logApp);
        }
        if (stderr) {
          this.logger.warn(`S3 copy stderr: ${stderr}`, this.logApp);
        }
        this.updateFileVersion(item.nBundledetailid, item.cToPath)
        this.logger.info(`Successfully copy S3 file: ${s3FilePath}`, this.logApp);
      } catch (error) {
        console.log(`Error Coping S3 file: ${command} - ${error?.message}`)
        this.logger.error(`Error copy S3 file: ${item.cToPath} - ${error?.message}`, this.logApp);
      }
    }
  }

  async updateFileVersion(nBundledetailid, s3Path: string): Promise<void> {
    try {
      console.log('Fetching veriosn', s3Path, nBundledetailid)
      if (!nBundledetailid) {
        this.logger.error('nBundledetailid not found for update version', this.logApp)
        return;
      }
      const version = await this.getFirstVersion(s3Path);
      if (!version) {

        this.logger.error('nBundledetailid version not found', this.logApp)
        return;
      }
      let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
      if (res.success) {
      } else {
        this.logger.error(res.error, this.logApp)
      }
    } catch (error) {

    }
  }

  async getFirstVersion(fileKey: string): Promise<string | null> {
    try {
      const bucketName = this.DO_SPACES_BUCKET_NAME;
      const s3Endpoint = this.s3_SPACES_ENDPOINT;

      // Run the AWS CLI command to list all versions of the file
      const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
      console.log(`Fetching versions for: ${fileKey} ${getVersionCommand}`);

      const { stdout } = await execPromise(getVersionCommand);
      const response = JSON.parse(stdout);

      if (response.Versions && response.Versions.length > 0) {
        // Sort versions by `LastModified` (oldest first)
        const sortedVersions = response.Versions.sort((a, b) =>
          new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
        );

        const firstVersion = sortedVersions[0]; // First uploaded version
        console.log(`🆔 First File Version ID: ${firstVersion.VersionId}`);
        this.logger.info(`First File Version ID: ${firstVersion.VersionId}`, this.logApp);
        return firstVersion.VersionId;
      } else {
        console.log("❌ No versions found.");
        this.logger.info(`No versions found for file: ${fileKey}`, this.logApp);
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching file versions:", error);
      this.logger.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
    }
    return null
  }



}
