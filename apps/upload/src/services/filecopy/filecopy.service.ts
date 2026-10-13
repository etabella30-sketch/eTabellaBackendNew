import { Injectable, Logger, Optional } from '@nestjs/common';
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
import { UtilityService } from '../utility/utility.service';
import { DOCUMENT_NOTIFICATION_USERS_SQL } from '@app/permissions/share-notifications';
import { notificationUuid } from '@app/global/utility/notifications/notification-message';
import { createHash } from 'crypto';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
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
        private queueManage: QueueManageService,
        private readonly utility: UtilityService,
        @Optional() @InjectQueue('filecopy-process') private readonly notificationQueue?: Queue
        // , @InjectQueue('elastic-index-process') private elasticFileExtraction: Queue
    ) {
    }

    async copyFile(oldPath: string, convertType?: string, nativePath?: string, nBundledetailid?: string, persistFirstVersion?: boolean, nTCatid?: string, appName?: string, nUPid?: string, cFromPath?: string, makePublic?: boolean, deferSourceCleanup = false): Promise<any> {

        const fromPath = cFromPath || `${this.ASSETS_PATH}${oldPath}`;
        const toPath = `${this.S3_BUCKET_PATH}${oldPath}`

        appName = appName ? appName : this.logApp;
        try {
            // Step 1: Copy the file to the new location using the AWS CLI or s3cmd
            // makePublic: CDN-served assets (profile photos) need a public-read
            // ACL — the machine's .s3cfg default is not guaranteed to set one.
            const copyCommand = `${this.S3_EXC_PATH} put ${fromPath} ${toPath}${makePublic ? ' --acl-public' : ''}`;
            // console.log(`Executing: ${copyCommand}`);
            await execPromise(copyCommand);
            console.log(`File copied from ${fromPath}  to ${toPath}`);

            // this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp)

            this.logService.info(`File copied from ${fromPath}  to ${toPath}`, appName)
            await this.removeUpdateVersion(nBundledetailid, oldPath, appName, persistFirstVersion);
            // The merge counter finishes before conversion/OCR/storage. Only the final stored resource is ready.
            if (convertType !== 'B') await this.queueDocumentUploaded(nBundledetailid, nUPid, oldPath);
            try {
                
                // Delete the file asynchronously
                // if (convertType != 'B') {
                //     await fsp.unlink(this.ASSETS_PATH + oldPath);
                //     this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                // }
                // Delete the file asynchronously
                if (convertType != 'B' && !deferSourceCleanup) {
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
                if (convertType == 'C' && nativePath && !deferSourceCleanup) {

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
            return false;
        }

        return true;

    }

    private async queueDocumentUploaded(documentId: string | undefined, uploadId: string | undefined, path: string): Promise<void> {
        if (!notificationUuid(documentId)) return;
        if (!this.notificationQueue) return this.publishDocumentUploaded(documentId, uploadId, path);
        // Persist notification work before source cleanup, with independent retries on the existing durable queue.
        const jobId = `document-notification-${createHash('sha256').update(JSON.stringify([documentId, uploadId ?? null, path])).digest('hex')}`;
        await this.notificationQueue.add('document-notification', { documentId, uploadId, path }, {
            jobId, attempts: 8, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: true, removeOnFail: false,
        });
    }

    async publishDocumentUploaded(documentId: string | undefined, uploadId: string | undefined, path: string): Promise<void> {
        if (!notificationUuid(documentId)) return;
        try {
            const resource = await this.db.rowQuery(`SELECT d."nBundledetailid",s."nCaseid",
              coalesce(u."nUserid",latest."nUserid",d."nUpdateId",d."nCreateId") AS "actor",
              coalesce(u."nUPid",latest."nUPid") AS "uploadId"
              FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
              LEFT JOIN public."UploadMaster" u ON u."nUPid"=$2::uuid AND u."nCaseid"=s."nCaseid"
              LEFT JOIN LATERAL (SELECT um."nUserid",um."nUPid" FROM public."UploadDetail" ud
                JOIN public."UploadMaster" um ON um."nUPid"=ud."nUPid" AND um."nCaseid"=s."nCaseid"
                WHERE ud."nBundledetailid"=d."nBundledetailid" AND $2::uuid IS NULL
                ORDER BY um."dCreateDt" DESC,ud."dCreateDt" DESC,ud."nUDid" DESC LIMIT 1) latest ON true
              WHERE d."nBundledetailid"=$1::uuid AND d."cStatus"='C' AND d."cPath"=$3
                AND ($2::uuid IS NULL OR u."nUPid" IS NOT NULL)`, [documentId, notificationUuid(uploadId) ?? null, path]);
            if (!resource.success) throw new Error('Stored upload metadata is unavailable');
            const row = resource.data?.[0];
            if (!row || !notificationUuid(row.actor)) return;
            const audience = await this.db.rowQuery(DOCUMENT_NOTIFICATION_USERS_SQL, [documentId, null, row.actor]);
            if (!audience.success) throw new Error('Stored upload notification audience is unavailable');
            const effectiveUpload = notificationUuid(uploadId) ?? notificationUuid(row.uploadId);
            const operation = effectiveUpload ?? createHash('sha256').update(path).digest('hex');
            for (const user of audience.data ?? []) await this.utility.emit({
                ...user, cType: 'U', cTitle: 'File uploaded', cMsg: 'A file is now available in your case.',
                nRefuserid: row.actor, nUPid: effectiveUpload,
                cEventKey: `file-upload:${documentId}:${operation}`,
                jTarget: { type: 'document', documentId, caseId: row.nCaseid },
            }, 'notification');
        } catch (error) {
            this.logger.warn('Stored upload notification will retry before source cleanup');
            throw error;
        }
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
