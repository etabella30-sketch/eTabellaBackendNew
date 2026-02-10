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


    async processTask(task: any, callback: async.ErrorCallback<any>) {

        const { jobDetail, item } = task;
        try {
            this.logService.info(`Task processed  ${item?.path}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        } catch (error) {

        }
        try {
            await this.performTask(jobDetail, item);
            this.completedTasks++
        } catch (error) {
            this.logService.error(`Task process failed  ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.failedTasks++
            this.responseFile(jobDetail, 'F', item, error);

        } finally {
            this.logService.info(`Task complete  `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.pendingTasks--;
        }
    }

    private generateTasks(jobDetail, result): any[] {
        const tasks = [];
        result.forEach((item) => {
            tasks.push({ jobDetail, item });
        });
        return tasks;
    }

    async extrationIndividual(jobDetail, result): Promise<any> {

        this.logService.info(`Extration start `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
        const tasks = this.generateTasks(jobDetail, result);

        this.logService.info(`Task Generated  ${tasks?.length}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)

        // const taskWithCallback = (task, callback) => {
        //     this.processTask(task, callback);
        // };
        return new Promise((resolve, reject) => {
            if (tasks.length) {
                this.totalTasks = tasks.length;
                this.queue.push(tasks);
                this.startQueueReporting(jobDetail);
                this.queue.drain(() => {
                    this.clearLogAction();
                    this.logService.info(`All Queue Complete `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                    resolve(true);
                });

                this.queue.error((error, task) => {
                    this.clearLogAction();
                    console.error('Error executing task:', error, task);
                    this.logService.error(`Failed in queue ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                });

            } else {
                this.clearLogAction();
                resolve(false)
            }

        });
        // return true;
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


    private async performTask(jobDetail, item): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            this.zipFile;
            let entry = await this.findEntry(item.path);

            try {
                this.logService.info(`Perform task :  ${this.config.get('ASSETS')} ${item.cSavepath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            } catch (error) {

            }


            if (!item.cSavepath) {
                try {
                    this.logService.error(`Moving failed file path not found :${item.path}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                } catch (error) {

                }
                resolve(false);
            }

            let Fpath = path.resolve(this.config.get('ASSETS'), item.cSavepath);

            if (entry) {
                try {
                    this.logService.info(`Moving file :  ${Fpath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`)
                } catch (error) {

                }
                const success = await this.movefiles(entry, jobDetail, Fpath);
                if (success) {


                    let nativePath;
                    if (jobDetail.converttype == 'B') {
                        nativePath = item.cSavepath;
                    }
                    const c_status = await this.movetos3.MovingToS3(jobDetail, jobDetail.converttype, item, Fpath, jobDetail.converttype == 'C' ? item.cSavepath : null);



                    this.responseFile(jobDetail, jobDetail?.verificationResult?.isValidate ? 'C' : 'V', item);

                    if (jobDetail.converttype == 'B') {
                        // queue as required
                        await this.movetos3.MovingToS3(jobDetail, 'C', item, Fpath, nativePath, true);


                        //    this.responseFile(jobDetail, jobDetail?.verificationResult?.isValidate ? 'C' : 'V', item);

                    }



                    // Add a delay to ensure file is fully written                   
                    resolve(true);
                } else {
                    this.responseFile(jobDetail, 'F', item);
                    resolve(false);
                }
            } else {
                try {
                    this.logService.error(`Entry not found :  ${Fpath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                } catch (error) {

                }
                resolve(false)
                console.log('Entry not found');
            }


        })


        // Simulating an asynchronous task
        // await new Promise((resolve) => setTimeout(resolve, 1000));
        // console.log(`Processing item: ${JSON.stringify(item)}`);
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
            this.saveFinal(jobDetail.nJobid, jobDetail, false, movedFiles);
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

            return await this.fileInfo.finalUpdate({
                nJobid: nJobid,
                jFiles: JSON.stringify(list),
                cIsFinal: bIsFinal ? 'Y' : 'N'
            })
            // } else {
            // return await this.failedTask(nJobid, jobDetail);
            // }
        } catch (error) {

            return await this.failedTask(nJobid, jobDetail);
        }


    }



}
