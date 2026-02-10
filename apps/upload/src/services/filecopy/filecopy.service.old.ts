import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { pipeline } from 'stream';
import { UploadService } from '../../upload.service';
import { ConfigService } from '@nestjs/config';

import { exec } from 'child_process';
import { promisify } from 'util';
import { LogService } from '@app/global/utility/log/log.service';

import * as fsp from 'fs/promises';
const execPromise = promisify(exec);

const pipelineAsync = promisify(pipeline);

@Injectable()
export class filecopyService {
    private ASSETS_PATH = this.config.get('S3_SYNC_PATH');
    private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
    private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
    private PYTHON_V = this.config.get('pythonV');
    private readonly logApp: string = 'upload/copyfiles';
    constructor(private upload: UploadService, private config: ConfigService, private readonly logService: LogService) {

    }

    async copyFile(oldPath: string, convertType?: string, nativePath?: string): Promise<any> {
        try {
            // Step 1: Copy the file to the new location using the AWS CLI or s3cmd
            const copyCommand = `${this.S3_EXC_PATH} sync ${this.ASSETS_PATH}${oldPath} ${this.S3_BUCKET_PATH}${oldPath}`;
            console.log(`Executing: ${copyCommand}`);
            await execPromise(copyCommand);
            console.log(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`);
            this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp)
            // Step 2: Delete the original file from the source
            // await delete(oldPath)
            try {
                // Delete the file asynchronously
                if (convertType != 'B') {
                    await fsp.unlink(this.ASSETS_PATH + oldPath);
                    this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                }
            } catch (error) {
                // Log any errors encountered during deletion
                if (error.code === 'ENOENT') {
                    // Handle the case where the file doesn't exist
                    this.logService.info(`File not found, skipping deletion: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                } else {
                    // Log other errors
                    this.logService.error(`Error deleting file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                }
            }

            try {
                if (convertType == 'C' && nativePath) {
                    await fsp.unlink(this.ASSETS_PATH + nativePath);
                    this.logService.info(`Successfully deleted native file: ${this.ASSETS_PATH + nativePath}`, this.logApp);
                }
            } catch (error) {

            }


            // if queue
            //     update in db

        } catch (error) {
            console.error('Error during file move:', error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, this.logApp)
        }


        return true;
       
    }

}
