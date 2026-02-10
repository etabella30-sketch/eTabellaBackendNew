import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import { pipeline } from 'stream';
import { UploadService } from '../../upload.service';
import { ConfigService } from '@nestjs/config';

import { exec } from 'child_process';
import { promisify } from 'util';
import { LogService } from '@app/global/utility/log/log.service';

import * as fsp from 'fs/promises';
import { DbService } from '@app/global/db/pg/db.service';
import { FileVersionService } from '../file-version/file-version.service';
import { QueueManageService } from '../queue-manage/queue-manage.service';
// import { Queue } from 'bull';
// import { InjectQueue } from '@nestjs/bull';
const execPromise = promisify(exec);

const pipelineAsync = promisify(pipeline);

@Injectable()
export class filecopyService {
    private ASSETS_PATH = this.config.get('S3_SYNC_PATH');
    private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
    private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
    private PYTHON_V = this.config.get('pythonV');
    private readonly logApp: string = 'upload/copyfiles';
    private readonly logger = new Logger('file-copy');
    constructor(private upload: UploadService, private config: ConfigService, private readonly logService: LogService, private db: DbService, private fileVersion: FileVersionService,
        private queueManage: QueueManageService
        // , @InjectQueue('elastic-index-process') private elasticFileExtraction: Queue
    ) {
    }

    async copyFile(oldPath: string, convertType?: string, nativePath?: string, nBundledetailid?: string, persistFirstVersion?: boolean, nTCatid?: string, appName?: string, nUPid?: string, cFromPath?: string): Promise<any> {

        const fromPath = cFromPath || `${this.ASSETS_PATH}${oldPath}`;
        const toPath = `${this.S3_BUCKET_PATH}${oldPath}`

        appName = appName ? appName : this.logApp;
        try {
            // Step 1: Copy the file to the new location using the AWS CLI or s3cmd
            const copyCommand = `${this.S3_EXC_PATH} put ${fromPath} ${toPath}`;
            // console.log(`Executing: ${copyCommand}`);
            await execPromise(copyCommand);
            console.log(`File copied from ${fromPath}  to ${toPath}`);

            // this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp)

            this.logService.info(`File copied from ${fromPath}  to ${toPath}`, appName)
            await this.removeUpdateVersion(nBundledetailid, oldPath, appName, persistFirstVersion);
            try {
                
                // Delete the file asynchronously
                // if (convertType != 'B') {
                //     await fsp.unlink(this.ASSETS_PATH + oldPath);
                //     this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                // }
                // Delete the file asynchronously
                if (convertType != 'B') {
                    try {
                        if (this.isPdfFile(oldPath)) {
                            // this.logger.warn('Moving pdf file for elastic search queue', nBundledetailid)
                            // await this.queueManage.insertTask(nBundledetailid, nUPid, oldPath)
                            // this.queueManage.pushTask(,{})
                            // await this.elasticFileExtraction.add({ data: { cPath: this.ASSETS_PATH + oldPath, ...versionDetail, fileAvailable: true } }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 2 });
                            // this.logService.info(`File move to elasticfile extraction: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                        }
                    } catch (error) {
                        this.logService.error(` failed to move elasticfile extraction: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                    }
                    // } else {

                    await fsp.unlink(this.ASSETS_PATH + oldPath);
                    this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, appName);
                }
            } catch (error) {
                // Log any errors encountered during deletion
                if (error.code === 'ENOENT') {
                    // Handle the case where the file doesn't exist

                    this.logService.error(`File not found, skipping deletion: ${this.ASSETS_PATH + oldPath}`, appName);

                } else {
                    // Log other errors

                    this.logService.error(`Error deleting file: ${this.ASSETS_PATH + oldPath}`, appName);

                }
            }

            try {
                if (convertType == 'C' && nativePath) {

                    await fsp.unlink(this.ASSETS_PATH + nativePath);

                    this.logService.info(`Successfully deleted native file: ${this.ASSETS_PATH + nativePath}`, appName);
                }
            } catch (error) {

            }

            // if queue
            //     update in db

        } catch (error) {
            console.error('Error during file move:', error);

            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, appName)

            // throw new Error(error.message);
        }

        return true;

    }

    async removeAllOldversion(nBundledetailid, s3Path, persistFirstVersion?: boolean) {
        try {
            // console.log('Fetching veriosn', s3Path, nBundledetailid)
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp)
                return;
            }
            await this.fileVersion.removeOldVersion(s3Path, persistFirstVersion);
            return
        } catch (error) {

        }
    }



    async updateFileVersion(nBundledetailid, s3Path: string, nTCatid?: string): Promise<any> {
        try {
            // console.log('Fetching veriosn', s3Path, nBundledetailid)
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp)
                return;
            }
            const version = await this.fileVersion.getFirstVersion(s3Path);
            if (!version) {
                this.logService.error('nBundledetailid version not found', this.logApp)
                return { msg: -1 };
            }
            let res = await this.db.executeRef('upload_update_version', { version: version, nBundledetailid, nTCatid });
            if (res.success) {
                return res.data[0][0];
            } else {
                this.logService.error(res.error, this.logApp)
                return { msg: -1 };
            }
        } catch (error) {

            return { msg: -1 };
        }
    }

    async removeUpdateVersion(nBundledetailid: string, s3Path: string, appName: string, persistFirstVersion?: boolean): Promise<void> {
        try {
            // console.log('Fetching veriosn', s3Path, nBundledetailid)
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', appName)
                return;
            }

            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, appName)
                return;
            }

            try {
                const versions = await this.fileVersion.getAllVersions(s3Path);


                this.logService.info(`Total number of version are ${versions.length}`, appName)

                this.logger.verbose('Version length', versions.length);
                        
                if (!versions || !versions.length) {
                    this.logService.error(`${s3Path} version not found`, appName)
                    return;
                }

                const fVersion = versions[0];

                const lVersion = this.getMaxVersion(versions)

                try {
                    let res = await this.db.executeRef('upload_update_version', { cLVer: lVersion?.VersionId || null ,cFVer: fVersion?.VersionId, nBundledetailid });
                    if (res.success) {
                        if (res.data[0].length) {
                            this.logger.verbose(`$File Version Updateed for ${nBundledetailid}`);
                            this.logService.info(`File Version Updateed for ${nBundledetailid}`, appName);
                        }
                    } else {
                        this.logger.verbose(`$File Version Update failed for ${nBundledetailid}`);
                        this.logService.error(res.error, appName)
                    }
                } catch (error) {
                    this.logger.error(`${error.message}${nBundledetailid}`);
                    this.logService.error(error.message, appName)
                    
                }

                const trash_versions = this.getTrashVersions(versions) || [];

            


                if(trash_versions.length == 0){
                    this.logger.verbose(`No version Found for ${nBundledetailid}`);
                    this.logService.info(`No version that will be deleted of ${nBundledetailid}`, appName)
                    return
                }

                const remainingVersionsIds = trash_versions.map(e => e?.VersionId) || []; // First uploaded version


            this.logger.verbose('remainingVersionsIds', remainingVersionsIds);

            this.logService.info(`Number of versions that will be deleted of ${nBundledetailid} are ${remainingVersionsIds.length}`, appName)

            await Promise.all(
                remainingVersionsIds.map(async (versionId) => {
                    await this.deleteWithRetry(versionId, s3Path, appName);
                })
            );
            this.logService.info(`All deletions attempted for ${nBundledetailid}`, appName);

            } catch (error) {
                
            this.logService.error('Error in handleFileVersion: ' + error, appName)
            }

        } catch (error) {
            this.logService.error('Error in remove and Update Version: ' + error, appName)

        }


    }


    isPdfFile(path) {
        try {
            return path.split('.').pop().toLowerCase() == 'pdf'
        } catch (error) {
            return false
        }
    }


    getMaxVersion(versions: any[]): any | null {
        try {
            return versions.length > 1 ? versions[versions.length - 1] : null;
        } catch (error) {
            return null;
        }
    }


    getTrashVersions(versions: any[]): any[] {
        try {
            return versions.slice(1, -1);   
        } catch (error) {
            return []
        }
    }

    async  deleteWithRetry(versionId: string, s3Path: string, appName: string, retry = 0, maxRetries = 5) {
        try {
            await this.fileVersion.deleteSpecificVersion(versionId, s3Path);
            this.logService.info(`Version ${versionId} deleted successfully`, appName);
        } catch (error) {
            if (retry >= maxRetries) {
                this.logService.error(`Failed to delete version ${versionId} after ${maxRetries} attempts`, appName);
                return;
            }
            this.logService.info(`Retrying delete for version ${versionId} (Attempt ${retry + 1})`, appName);
    
            // Exponential backoff before retrying
            // await new Promise((resolve) => setTimeout(resolve, 2 ** retry * 1000)); // 1s, 2s, 4s, 8s, etc.
            await this.deleteWithRetry(versionId, s3Path,appName, retry + 1, maxRetries);
        }
    }
}
