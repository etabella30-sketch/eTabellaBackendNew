import { Injectable, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as yauzl from 'yauzl';
import { v4 as uuidv4 } from 'uuid';
import * as async from 'async';
import * as fs from 'fs';
import { Stream } from 'stream';
import * as path from 'path';
import { VerifypdfService } from '../verifypdf/verifypdf.service';
import { FileValidateResponse } from '../../interfaces/chunk.interface';
import { UpdatefileinfoService } from '../updatefileinfo/updatefileinfo.service';
import { UtilityService } from '../utility/utility.service';
import { jobDetail } from '../../interfaces/unzip.interface';
import { delay } from 'rxjs';
import { LogService } from '@app/global/utility/log/log.service';
import { ConvertService } from '../convert/convert.service';
import { OcrService } from '../ocr/ocr.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { filecopyService } from '../filecopy/filecopy.service';
import { error } from 'console';
import { MovetoS3Service } from '../moveto-s3/moveto-s3.service';
import { resolveUploadDocPath } from '../../utility/upload-paths';

@Injectable()
export class ZipService {
    public zipFile: any;
    private queue: async.QueueObject<any>;
    public result: any = [];
    public files: any[] = [];
    public movedFiles = [];

    public totalTasks: number = 0;
    private completedTasks: number = 0;
    private failedTasks: number = 0;
    private pendingTasks: number = 0;
    intervalOfqueue: any;
    // private readonly logApp: string = 'upload';
    zipUpdateBatch: number = this.config.get<number>('ZIP_STATUS_UPDATE_BATCH') || 200;
    constructor(private config: ConfigService, private readonly fileVerificationService: VerifypdfService, private readonly fileInfo: UpdatefileinfoService,
        private readonly utility: UtilityService, private readonly logService: LogService,
        private readonly convertService: ConvertService,
        private readonly ocrService: OcrService, private fileService: filecopyService,
        @InjectQueue('filecopy-process') private fileCopyQueue: Queue, private movetos3: MovetoS3Service
    ) {
        this.queue = async.queue(this.processTask.bind(this), 5)
    }

    openZipFile(zipPath: string): Promise<any> {
        return new Promise((resolve, reject) => {
            yauzl.open(`${this.config.get('ASSETS')}${zipPath}`, { lazyEntries: true, autoClose: false }, (err, zipfl) => {
                if (err) {
                    resolve(false);
                    return;
                }
                this.zipFile = zipfl;
                resolve(true);
            });
        });
    }

    async readFiles(): Promise<any> {
        let folders = [];
        let files = [];
        return new Promise((resolve, reject) => {
            this.zipFile.readEntry();
            this.zipFile.on('entry', (entry) => {
                if (/\/$/.test(entry.fileName)) {
                    // folders.push(entry.fileName);
                } else {
                    files.push({ path: entry.fileName, entry: entry });
                }
                this.zipFile.readEntry();
            });
            this.zipFile.on('end', () => {
                resolve(files);
            });
            this.zipFile.on('error', reject);
        });
    }

    async formateData(res: any[]): Promise<any[]> {
        let idCounter = 1;
        let result: any[] = [];
        const itemsMap = new Map();

        try {
            res.forEach((e) => {
                let path = e.path;
                const components = path.split('/');
                let parentId = null;
                components.forEach((component, index) => {
                    const isLastComponent = index === components.length - 1;
                    const isFolder = !isLastComponent;
                    let itemKey = `${parentId}-${component}`;

                    if (!itemsMap.has(itemKey)) {
                        itemsMap.set(itemKey, idCounter);
                        let prtId = null;
                        if (parentId) {
                            let ojs = result.find((m) => m.ids == parentId);
                            if (ojs) {
                                prtId = ojs.id;
                            }
                        }
                        result.push({
                            id: uuidv4(),
                            ids: idCounter,
                            isFolder: isFolder,
                            name: component,
                            parentId: prtId,
                            path: path,
                        });
                        idCounter++;
                    }
                    parentId = itemsMap.get(itemKey);
                });
            });
        } catch (error) {
            console.log('Error at reading formate file');
            // Handle error if needed
        }

        this.result = result;
        return result;
    }


    async processTask(task: any) {

        const { jobDetail, item, checkpoint } = task;
        try {
            this.logService.info(`Task processed  ${item?.path}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        } catch (error) {

        }
        try {
            if (!await this.performTask(jobDetail, item, checkpoint)) {
                throw new Error('ZIP entry could not be stored');
            }
            this.completedTasks++
        } catch (error) {
            this.logService.error(`Task process failed  ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.failedTasks++
            await this.responseFile(jobDetail, 'F', item, error);
            throw error;

        } finally {
            this.logService.info(`Task complete  `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.pendingTasks--;
        }
    }

    private generateTasks(jobDetail, result, checkpoint?): any[] {
        const tasks = [];
        result.forEach((item) => {
            if (!item._zipComplete) tasks.push({ jobDetail, item, checkpoint });
        });
        return tasks;
    }

    async extrationIndividual(jobDetail, result, checkpoint?: () => Promise<void>): Promise<any> {

        this.logService.info(`Extration start `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
        this.completedTasks = result.filter(item => item._zipComplete).length;
        this.failedTasks = 0;
        this.movedFiles = result.filter(item => item._zipComplete);
        const tasks = this.generateTasks(jobDetail, result, checkpoint);

        this.logService.info(`Task Generated  ${tasks?.length}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)

        if (!result.length) return false;
        if (!tasks.length) return true;
        this.totalTasks = result.length;
        this.pendingTasks = tasks.length;
        this.startQueueReporting(jobDetail);
        try {
            // Wait for running entries before closing the archive or retrying the Bull job.
            const outcomes = await Promise.allSettled(tasks.map(task => this.queue.pushAsync(task)));
            const failed = outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult;
            if (failed) throw failed.reason;
            this.logService.info(`All Queue Complete `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            return true;
        } finally {
            this.clearLogAction();
        }
    }

    clearLogAction(): void {
        clearInterval(this.intervalOfqueue);
    }

    startQueueReporting(jobDetail: jobDetail): void {
        this.clearLogAction();
        this.intervalOfqueue = setInterval(() => {
            this.sendReport(jobDetail);
            // console.log('Total tasks:', this.totalTasks);
            // console.log('Completed tasks:', this.completedTasks);
            // console.log('Failed tasks:', this.failedTasks);
            // console.log('Pending tasks:', this.pendingTasks);
        }, 5000);
    }


    sendReport(jobDetail: jobDetail) {
        try {
            this.logService.info(`ZIP-REPORT : identifier: ${jobDetail.identifier}, ${jobDetail.nJobid}, nMasterid: ${jobDetail.nUserid}   otalTasks: ${this.totalTasks}, completedTasks: ${this.completedTasks}, failedTasks: ${this.failedTasks}, pendingTasks: ${this.pendingTasks}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
        } catch (error) {
        }
        this.utility.emit({ event: 'ZIP-REPORT', data: { identifier: jobDetail.identifier, nJobid: jobDetail.nJobid, nMasterid: jobDetail.nUserid, totalTasks: this.totalTasks, completedTasks: this.completedTasks, failedTasks: this.failedTasks, pendingTasks: this.pendingTasks } });

    }

    async failedTask(nJobid: string, jobDetail: jobDetail): Promise<any> {
        // update failed tasks to db
        console.log('Failed task ', nJobid);

        try {
            this.logService.info(`Failed task :  ${nJobid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
        } catch (error) {
            console.log(error);
        }
        try {
            this.zipFile.close();
        } catch (error) {
            console.log('Failed to close zip file', error);
        }
        await this.fileInfo.jobFailed(nJobid);
        return true;
    }


    private async performTask(jobDetail, item, checkpoint?: () => Promise<void>): Promise<boolean> {
        const entry = await this.findEntry(item.path);
        const extractionPath = item._zipExtractionPath || item.cSavepath;
        // Keep the ZIP entry's native path separate from a checkpointed conversion path.
        const Fpath = resolveUploadDocPath(this.config.get('ASSETS'), extractionPath);
        if (!Fpath) {
            if (extractionPath) {
                this.logService.error(`Refused unsafe extraction path`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                await this.responseFile(jobDetail, 'F', item);
            }
            return false;
        }
        if (!entry) return false;
        if (!await this.movefiles(entry, jobDetail, Fpath)) {
            await this.responseFile(jobDetail, 'F', item);
            return false;
        }
        item._zipExtractionPath = extractionPath;
        // A converted source is retained on a failed copy. If a process stopped after cleanup,
        // regenerate that source while retaining its checkpointed resource ID.
        const convertedPath = resolveUploadDocPath(this.config.get('ASSETS'), item.cSavepath);
        if (!convertedPath) {
            await this.responseFile(jobDetail, 'F', item);
            return false;
        }
        if (item.cSavepath !== extractionPath && !fs.existsSync(convertedPath)) {
            item.cSavepath = extractionPath;
        }
        const storedSourcePath = item.cSavepath === extractionPath ? Fpath : convertedPath;
        const nativePath = jobDetail.converttype === 'B' || jobDetail.converttype === 'C' ? extractionPath : null;
        if (jobDetail.converttype !== 'B' || !item._zipNativeCopied) {
            if (!await this.movetos3.MovingToS3(jobDetail, jobDetail.converttype, item, storedSourcePath, nativePath, false, checkpoint)) {
                throw new Error('ZIP entry storage or notification admission failed');
            }
            if (jobDetail.converttype === 'B') {
                item._zipNativeCopied = true;
                if (checkpoint) await checkpoint();
            }
        }
        if (jobDetail.converttype === 'B') {
            if (!await this.movetos3.MovingToS3(jobDetail, 'C', item, storedSourcePath, nativePath, true, checkpoint)) {
                throw new Error('ZIP converted entry storage or notification admission failed');
            }
        }
        await this.responseFile(jobDetail, jobDetail?.verificationResult?.isValidate ? 'C' : 'V', item);
        item._zipComplete = true;
        if (checkpoint) await checkpoint();
        return true;
    }


    async wait(tm): Promise<boolean> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, tm);
        });
    }


    async movefiles(entry: any, jobDetail: jobDetail, outputDirectory: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.zipFile.openReadStream(entry, (err: Error, readStream: Stream) => {
                if (err) {
                    try {
                        this.logService.error(`(openReadStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                    } catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                    return;
                }

                const writeStream = fs.createWriteStream(outputDirectory);

                readStream.pipe(writeStream);

                writeStream.on('close', () => {
                    resolve(true);
                });

                readStream.on('error', (err: Error) => {
                    try {
                        this.logService.error(`(readStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                    } catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                });

                writeStream.on('error', (err: Error) => {
                    try {
                        this.logService.error(`(writeStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                    } catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                });
            });
        });
    }

    async findEntry(path: any): Promise<any> {
        let res = this.files.find((a) => a.path.toLowerCase() === path.toLowerCase());
        return res ? res.entry : false;
    }


    async responseFile(jobDetail: jobDetail, status: string, item: any, error?: any) {
        console.log(`File move ${status == 'C' ? 'completed' : 'failed'}`, error);
        this.movedFiles.push(Object.assign(item, { cStatus: status }));

        try {
            this.logService.info(`File move ${status == 'C' ? 'completed' : 'failed'} ${this.completedTasks}/${this.totalTasks} , ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
        } catch (error) {

        }
        if (this.movedFiles?.length >= this.zipUpdateBatch) {
            const movedFiles = [...this.movedFiles];
            this.movedFiles = [];
            await this.saveFinal(jobDetail.nJobid, jobDetail, false, movedFiles);
        }

    }


    async saveFinal(nJobid: string, jobDetail: jobDetail, bIsFinal: boolean, movedFiles?: any[]) {

        // let list = this.movedFiles.map(({ nBundledetailid, cStatus, isValidate, totalpages, totalsizeoffile, pagerotation }) => ({ nBundledetailid, cStatus, isValidate, totalpages, totalsizeoffile, pagerotation }))
        try {

            const files = movedFiles || this.movedFiles;

            let listdata = files.map((e) => {
                return {
                    nBundledetailid: e.nBundledetailid,
                };
            });


            let list = files.map((e) => {
                return {
                    nBundledetailid: e.nBundledetailid,
                    status: e.status,
                    isValidate: e.isValidate,
                    totalpages: e.totalpages,
                    totalsizeoffile: e.totalsizeoffile,
                    pagerotation: e.pagerotation ? e.pagerotation : "0"
                };
            });

            const result = await this.fileInfo.finalUpdate({
                nJobid: nJobid,
                jFiles: JSON.stringify(list),
                cIsFinal: bIsFinal ? 'Y' : 'N'
            });
            if (result?.msg === -1) throw new Error('ZIP final status could not be saved');
            return result;
            // } else {
            // return await this.failedTask(nJobid, jobDetail);
            // }
        } catch (error) {

            throw error;
        }


    }



}
