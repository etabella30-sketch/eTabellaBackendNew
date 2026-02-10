import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { pipeline } from 'stream';
import { ConfigService } from '@nestjs/config';

import { exec } from 'child_process';
import { promisify } from 'util';
import { LogService } from '@app/global/utility/log/log.service';

import * as fsp from 'fs/promises';
import { DbService } from '@app/global/db/pg/db.service';
import { FileVersionService } from '../file-version/file-version.service';
const execPromise = promisify(exec);

const pipelineAsync = promisify(pipeline);

@Injectable()
export class filecopyService {
    private ASSETS_PATH = this.config.get('S3_SYNC_PATH');
    private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
    private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
    private readonly logApp: string = 'realtime/copyfiles';
    constructor( private config: ConfigService, private readonly logService: LogService, private db: DbService, private fileVersion: FileVersionService) {

    }

    async copyFile(oldPath: string, nBundledetailid?: string): Promise<any> {
        try {
            console.log('copyFile called with oldPath:', oldPath, 'nBundledetailid:', nBundledetailid);
            // Step 1: Copy the file to the new location using the AWS CLI or s3cmd
            const copyCommand = `${this.S3_EXC_PATH} sync ${this.ASSETS_PATH}${oldPath} ${this.S3_BUCKET_PATH}${oldPath}`;
            console.log(`Executing: ${copyCommand}`);
            await execPromise(copyCommand);
            console.log(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`);
            this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp)
            // Step 2: Delete the original file from the source
            // await delete(oldPath)
            console.log(`update version for ${nBundledetailid}`);
            await this.removeAllOldversion(nBundledetailid, `${oldPath}`);
            await this.updateFileVersion(nBundledetailid, `${oldPath}`);
            try {


                    await fsp.unlink(this.ASSETS_PATH + oldPath);
                    this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
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
        } catch (error) {
            console.error('Error during file move:', error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, this.logApp)
        }


        return true;

    }

    async removeAllOldversion(nBundledetailid, s3Path) {
        try {
            console.log('Fetching veriosn', s3Path, nBundledetailid)
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp)
                return;
            }
            await this.fileVersion.removeOldVersion(s3Path);
            return
        } catch (error) {

        }
    }



    async updateFileVersion(nBundledetailid, s3Path: string): Promise<void> {
        try {
            console.log('Fetching veriosn', s3Path, nBundledetailid)
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp)
                return;
            }
            const version = await this.fileVersion.getFirstVersion(s3Path);
            if (!version) {

                this.logService.error('nBundledetailid version not found', this.logApp)
                return;
            }
            let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
            if (res.success) {
            } else {
                this.logService.error(res.error, this.logApp)
            }
        } catch (error) {

        }
    }
}
