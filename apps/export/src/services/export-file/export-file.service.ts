import { Injectable, Logger } from '@nestjs/common';
import { DbService } from '@app/global/db/pg/db.service';
import { UtilityService } from '../../utility/utility.service';
import * as fs from 'fs';
import * as pdfMake from 'pdfmake';
import { PDFDocument, PDFName, PDFArray, PageSizes, PDFPage } from 'pdf-lib';
const { exec, spawn } = require('child_process');
// import * as pdfjsLib from 'pdfjs-dist';
import { createWriteStream, readFileSync } from 'fs';
import * as path from 'path';
// var scaleAnnots = require("../scaleAnnots.js");
// var scaleContent = require("../scaleContent.js");

import {
    DownloadpathReq,
    ExportFilewithAnnot,
    ExportProcess,
    ExportResponse,
    removeProcess

} from '../../inerfaces/export.interface';
import { ScaleannotsService } from '../scaleannots/scaleannots.service';
import { ScalecontentService } from '../scalecontent/scalecontent.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';

// const EDIT_FILE_PATH = 'assets/pythons/export/exportfile.py';

// const fonts = {
//     Roboto: {
//         // normal: './assets/fonts/Roboto/Roboto-Regular.ttf',
//         // bold: './assets/fonts/Roboto/Roboto-Medium.ttf',
//         // italics: './assets/fonts/Roboto/Roboto-Italic.ttf',
//         // bolditalics: './assets/fonts/Roboto/Roboto-MediumItalic.ttf'
//         normal: `${this.configService.get('ASSETS')}fonts/Roboto/Roboto-Regular.ttf`,
//         bold: './assets/fonts/Roboto/Roboto-Medium.ttf',
//         italics: './assets/fonts/Roboto/Roboto-Italic.ttf',
//         bolditalics: './assets/fonts/Roboto/Roboto-MediumItalic.ttf'
//     },
// };

// const printer = new pdfMake(fonts);
type ExportQueueEntry = {
    nCaseid: number;
    nUserid: number;
    isProcessing: boolean;
    jsonData: any[];
    filesData: any[];
};

@Injectable()
export class ExportFileService {
    private readonly logger = new Logger(ExportFileService.name);
    private readonly extraWidth = 0;
    private exportProcess: any[] = [];

    pgfilepath = this.configService.get('PY_EXPPAGINATION')
    EDIT_FILE_PATH = this.configService.get('PY_EXPEDIT')
    pythonV = this.configService.get('pythonV')
    gsV = this.configService.get('gsV')

    private readonly logApp: string = 'export';
    printer;

    FILEPATH = `${this.configService.get('ASSETS')}` //'./assets/';
    constructor(
        private readonly db: DbService,
        private readonly utility: UtilityService,
        private readonly scaleannotsService: ScaleannotsService,
        private readonly ScalecontentService: ScalecontentService,
        readonly configService: ConfigService,
        private readonly logService: LogService,
        private readonly config: ConfigService
    ) {


        const A = this.configService.get('ASSETS');
        const fonts = {
            Roboto: {
                normal: `${A}fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${A}fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${A}fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${A}fonts/Roboto/Roboto-MediumItalic.ttf`
            },
            // Annotation Index redesign fonts (static instances shipped in assets/fonts).
            // Italics fall back to upright — the index design uses none.
            Inter: {
                normal: `${A}fonts/Inter/Inter-Regular.ttf`,
                bold: `${A}fonts/Inter/Inter-SemiBold.ttf`,
                italics: `${A}fonts/Inter/Inter-Regular.ttf`,
                bolditalics: `${A}fonts/Inter/Inter-SemiBold.ttf`
            },
            Lora: {
                normal: `${A}fonts/Lora/Lora-Regular.ttf`,
                bold: `${A}fonts/Lora/Lora-SemiBold.ttf`,
                italics: `${A}fonts/Lora/Lora-Regular.ttf`,
                bolditalics: `${A}fonts/Lora/Lora-SemiBold.ttf`
            },
            JetBrainsMono: {
                normal: `${A}fonts/JetBrainsMono/JetBrainsMono-Regular.ttf`,
                bold: `${A}fonts/JetBrainsMono/JetBrainsMono-SemiBold.ttf`,
                italics: `${A}fonts/JetBrainsMono/JetBrainsMono-Regular.ttf`,
                bolditalics: `${A}fonts/JetBrainsMono/JetBrainsMono-SemiBold.ttf`
            },
        };

        this.printer = new pdfMake(fonts);


    }


    async exportWithannot(body: ExportFilewithAnnot): Promise<ExportResponse> {
        try {
            this.logService.info(`Export Request ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp);
            this.logService.info(`Insert exoprting log in database for user ${body.nMasterid}`, this.logApp);
            const res = await this.db.executeRef('export_insert_data_1', body);
            if (res.success) {
                this.logService.info(`Insert exoprting log success`, this.logApp);
                return res.data[0][0];
            } else {
                this.logService.error(`Insert export data failed with error ${JSON.stringify(res?.error)}`, this.logApp);
                return { msg: -1, value: 'Insert export data failed', error: res?.error }
            }
            // throw new Error('Failed to export with annotations');
        } catch (error) {
            // this.logger.error('Error in exportWithannot', error);
            this.logService.error(`Error in exportWithannot ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, value: 'Failed to fetch', error: error.message };
        }
    }

    async startExportProcess(body: ExportProcess): Promise<any> {
        try {
            this.logService.info(`get exoprting data form database for user ${body.nMasterid}`, this.logApp);
            this.logger.verbose(`get exoprting data form database for user ${body.nMasterid}`);
            const res = await this.db.executeRef('export_get_data_1', body);
            if (res.success) {
                this.logService.info(`Get export data success`, this.logApp);
                if (!res.data || !res.data.length || !res.data[0] || !res.data[0].length) {
                    this.logService.error(`No date found`, this.logApp);
                    this.logger.error(`No date found`);
                    return { msg: -1, value: 'No date found' };
                }
                this.logService.info(`Start export data`, this.logApp);
                this.logger.verbose(`Start export data`);
                await this.processExportData(res, body);
                return { msg: 1, value: 'Export in Process' };
            } else {
                this.logService.error(`Exporting failed with database error ${JSON.stringify(res?.error)}`, this.logApp);
                this.logger.error(`Exporting failed with database error ${JSON.stringify(res?.error)}`);
                return { msg: -1, value: 'Exporting failed' };
            }

            // throw new Error('Failed to start export process');
        } catch (error) {
            // this.logger.error('Error in startExportProcess', error);
            this.logService.error(`Error in startExportProcess ${JSON.stringify(error)} `, this.logApp);
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }

    /* private async processExportData(res: any, body: ExportProcess): Promise<void> {
 
         const { nCaseid, nExportid, nUserid } = res.data[0][0];
         const jsonData = res.data[0];
 
         try {
             if (!this.exportProcess.find(e => e.nCaseid === nCaseid && e.isProcess === true)) {
                 this.exportProcess.push({ nExportid, isProcess: true, nCaseid, jsonData, nUserid });
 
                 this.logService.info(`File added in queue`, this.logApp);
                 await this.processJsonData(jsonData, nExportid, body.nMasterid);
                 // await this.updateFinal(nExportid, body.nMasterid, 'C');
                 this.exportProcess = this.exportProcess.filter(e => e.nExportid !== nExportid);
             } else {
                 const existingProcess = this.exportProcess.find(e => e.isProcess === true && e.nCaseid === nCaseid);
                 if (existingProcess) {
                     jsonData.forEach(x => x.nExportid = nExportid);
                     this.logService.info(`File added in queue (jsonData)`, this.logApp);
                     existingProcess.jsonData.push(...jsonData);
                 }
             }
         } catch (error) {
            //  this.logger.error('Error in processExportData', error);
 
             this.logService.error(`Error in processExportData ${JSON.stringify(error)}`, this.logApp);
             // await this.updateFinal(nExportid, body.nMasterid, 'F');
             this.exportProcess = this.exportProcess.filter(e => e.nExportid !== nExportid);
         }
     }*/

    private async processJsonData(jsonData: any[], nExportid: number, nMasterid: string): Promise<void> {
        for (const [index, element] of jsonData.entries()) {
            this.logService.info(`Annotation process start for file ${JSON.stringify(element)}`, this.logApp);
            await this.editFile(jsonData, index, nExportid, nMasterid, element);
            if (this.exportProcess.find(e => e.nExportid === nExportid && !e.isProcess)) {
                break;
            }
        }
    }

    async getProcessQueue(): Promise<any> {
        try {
            return this.exportProcess.map(a => ({ nCaseid: a.nCaseid, nUserid: a.nUserid, isProcessing: a.isProcessing, jsonData: a.jsonData?.length })); // Return only relevant fields    
        } catch (error) {
            return { msg: -1, value: 'Failed to fetch process queue', error: error.message };
        }

    }

    async removeProcess(body: removeProcess): Promise<any> {
        try {
            this.exportProcess = this.exportProcess.filter(entry => entry.nExportid !== body.nExportid);
            this.logService.info(`Removed export process for ID ${body.nExportid}`, this.logApp);
            return { msg: 1, value: 'Process removed successfully' };
        } catch (error) {
            this.logService.error(`Error in removeProcess ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, value: 'Failed to remove process', error: error.message };
        }
    }



    // 2) Replace your old processExportData with this:
    private async processExportData(res: any, body: ExportProcess): Promise<void> {
        const { nCaseid, nExportid, nUserid } = res.data[0][0];

        // Find or create the queue bucket
        let entry = this.exportProcess.find(e => e.nCaseid === nCaseid);
        if (!entry) {
            entry = { nCaseid, nUserid, isProcessing: false, jsonData: [], filesData: [], nExportid };
            this.exportProcess.push(entry);
        }

        // Stamp and enqueue
        const incoming = res.data[0].map(item => ({ ...item, nExportid }));
        entry.jsonData.push(...incoming);
        entry.filesData.push(...incoming);
        this.logService.info(`File added in queue (${incoming.length} items)`, this.logApp);
        this.logger.verbose(`File added in queue (${incoming.length} items)`);

        // If nobody is processing, start the drain
        if (!entry.isProcessing) {
            entry.isProcessing = true;
            try {
                await this.drainQueue(entry, body.nMasterid);
            } catch (err) {
                this.logService.error(`Error draining export queue for case ${nCaseid}: ${err}`, this.logApp);
                this.logger.error(`Error draining export queue for id ${nExportid}: ${err}`);
            } finally {
                // Remove the entry when done
                this.logger.verbose(`Removing export queue entry for id ${nExportid} and userid ${nUserid}.`);
                this.exportProcess = this.exportProcess.filter(e => e !== entry);
            }
        }
    }

    // 3) Add this new helper to actually consume the queue
    private async drainQueue(entry: ExportQueueEntry, nMasterid: string): Promise<void> {
        let idx = 0;
        while (entry.jsonData.length) {
            const element = entry.jsonData.shift()!;
            this.logService.info(
                `Annotation process start for file #${idx} → ${JSON.stringify(element)}`,
                this.logApp
            );
            // this.logger.verbose(`Annotation process start for file #${idx} → ${JSON.stringify(element)}`);
            // now we pass the same signature as before, including index
            await this.editFile(
                entry.filesData,   // the remaining list (used by completeFile, etc.)
                idx,              // <-- our index
                element.nExportid,
                nMasterid,
                element
            );

            idx++;
        }
    }

    async completeFile(jsonData, mdl, nMasterid, jResponce) {

        this.logService.info(`Complete File ${jsonData.length} ${JSON.stringify(jsonData)}`, 'checkfile');

        mdl.isComplete = true;
        try {
            // console.log('Complete File', jsonData.length, mdl?.cStatus);
            if (jsonData.length > 0) {
                let i = jsonData.findIndex(a => !a.isComplete);

                this.logService.info(`i ${i}`, 'checkfile');

                this.logService.info(`mdl ${JSON.stringify(mdl)}`, 'checkfile');

                // console.log('Complete File 1', i);
                await this.updateProgress(mdl.nExportid, mdl.nUserid, mdl, mdl.cStatus);
                if (i == -1 || mdl.cType == 'M' || mdl.cType == 'S') {
                    // console.log('Complete File 2', mdl.cType);
                    if (mdl.cType == 'S') {// && dtl.exportlist.length > 1
                        // console.log('Complete File 4', mdl.bPagination);


                        // // console.log('Complete File 3', jsonData.findIndex(a => a.cStatus != 'C' && a.cStatus != 'F'));
                        // if (jsonData.findIndex(a => a.cStatus != 'C' && a.cStatus != 'F') == -1) {
                        //     this.logService.info(`MERGING ${mdl.nExportid}`, 'checkfile');
                        //     // console.log('MERGING')
                        //     this.mergePdf(jsonData, nMasterid);
                        // }
                        const exportGroups: any = jsonData.reduce((acc, item) => {
                            if (!acc[item.nExportid]) {
                                acc[item.nExportid] = [];
                            }
                            acc[item.nExportid].push(item);
                            return acc;
                        }, {} as Record<number, any[]>);

                        this.logService.info(`exportGroups ${JSON.stringify(exportGroups)}`, 'checkfile');

                        for (const [exportId, items] of Object.entries(exportGroups)) {

                            if ((items as any[]).every(a => a.isMerged)) {
                                this.logService.info(`Already merged exportId ${exportId}, skipping`, 'checkfile');
                                continue;
                            }

                            const allDone = (items as any[]).every(a => ['C', 'F'].includes(a.cStatus));
                            if (allDone) {
                                const completedFiles = (items as any[]).filter(a => ['C', 'F'].includes(a.cStatus));
                                if (completedFiles.length > 0) {
                                    this.logService.info(`MERGING exportId ${exportId}`, 'checkfile');
                                    this.mergePdf(completedFiles, nMasterid);
                                    (items as any[]).forEach(a => a.isMerged = true);
                                } else {
                                    this.logService.warn(`No completed files to merge for exportId ${exportId}`, 'checkfile');
                                }
                            }
                            // else {
                            //     const pending = (items as any[]).filter(a => a.cStatus !== 'C' && a.cStatus !== 'F');
                            //     this.logService.warn(`Skipping merge for exportId ${exportId} due to pending files: ${JSON.stringify(pending)}`, 'checkfile');
                            // }
                        }


                        return;
                    } else {
                        // console.log('Complete File 4', mdl.bPagination);
                        if (mdl.bPagination) {
                            let newPath = mdl.finalPath.replace('.pdf', '_1.pdf');
                            let res = await this.paginationReq(mdl.finalPath, newPath)
                            if (res.status == 'ok') {
                                mdl.finalPath = newPath;
                            }
                        }
                        const body = { nEDid: mdl.nEDid, nExportid: mdl.nExportid, nUserid: mdl.nUserid, cPath: mdl.finalPath };
                        let data = await this.db.executeRef('export_file_complete', body);
                        this.emitMessage(mdl, data.data[0][0], mdl.finalPath, nMasterid, 100, 100);
                    }
                }
            }
        } catch (error) {
            console.error('Error in completeFile', error);
        }
    }

    async paginationReq(filePath, newPath): Promise<any> {
        let jsondata = { cPath: filePath, cNewpath: newPath, cRefpage: '1-1', jPagination: { "bc": "#fff", "cb": "#ffffff00", "fc": "#000", "fs": "16", "ft": "arial", "isHide": false, "position": "BR" } };
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonV, [this.pgfilepath, JSON.stringify(jsondata)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    ASSETS: this.config.get('ASSETS'),
                    ROOT_PATH: this.config.get('ROOT_PATH'),

                    DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
                    DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
                    DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
                    DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),

                    DO_TOKEN: this.config.get('DO_TOKEN'),
                    DO_CDN_ID: this.config.get('DO_CDN_ID')
                },
            });

            pythonProcess.stdout.on('data', (data) => {
                this.logger.log(`Python stdout: ${data}`);
            });

            pythonProcess.stderr.on('data', (data) => {
                this.logger.error(`Python stderr: ${data}`);
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.log(`Python script exited with code ${code}`);
                    resolve({ status: 'ok' });
                } else {
                    this.logger.error(`Python script exited with code ${code}`);
                    // reject(new Error(`Python script failed with code ${code}`));
                    resolve({ status: '' });
                }
            });


        });
    }


    async mergePdf(exportlist, nMasterid) {
        try {
            // console.log('MERGE-PDF 1 ', exportlist?.length)
            if (exportlist.length > 1) {
                var svPth = this.FILEPATH + 'export/ex' + exportlist[0].nExportid;

                let gsCommand = `${this.gsV} -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=${svPth}/final.pdf -dIncludeAnnotations=true -dIncludeDocRights=false`;
                // /home/etabella/apiportal/public/export/modified.pdf /home/etabella/apiportal/public/export/modified2.pdf /home/etabella/apiportal/public/export/modified3.pdf
                // gswin64c -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=final.pdf -dIncludeAnnotations=true -dIncludeDocRights=false /home/etabella/apiportal/public/export/modified.pdf /home/etabella/apiportal/public/export/modified2.pdf /home/etabella/apiportal/public/export/modified3.pdf
                // console.log('MERGE-PDF 2 ', gsCommand)
                if (!fs.existsSync(svPth)) {
                    fs.mkdirSync(svPth);

                    // console.log(`Directory '${svPth}' created successfully.`);
                } else {
                    // console.log(`Directory '${svPth}' already exists.`);
                }
                // console.log('MERGE-PDF 3 ')
                for (let x of exportlist) {
                    if (x.cStatus == 'C') {
                        await new Promise((resolve, reject) => {
                            var path = this.FILEPATH + x.finalPath;
                            fs.access(path, fs.constants.F_OK, (err) => {
                                if (err) {
                                    console.log('File does not exist');
                                } else {
                                    console.log('File exists');
                                    gsCommand = gsCommand + ' ' + path;
                                }
                                resolve({ status: 'ok' });
                            });
                        });
                    }
                }

                // console.log('MERGE FILE 3'.bgGreen, gsCommand);



                exec(gsCommand, async (error, stdout, stderr) => {
                    // console.log('data:', typeof stdout, stdout)
                    if (error) {
                        console.error(`stderr: ${error}`);
                        return;
                    }
                    let path = 'export/ex' + exportlist[0].nExportid + '/final.pdf'
                    if (exportlist[0].bPagination) {
                        let newPath = 'export/ex' + exportlist[0].nExportid + '/final_1.pdf';
                        let res = await this.paginationReq(path, newPath)
                        if (res.status == 'ok') {
                            path = newPath;
                        }
                    }

                    const body = { nExportid: exportlist[0].nExportid, cPath: path };
                    let data = await this.db.executeRef('export_update_single_pdf', body);

                    this.emitMessage(exportlist[0], data.data[0][0], path, nMasterid, 100, 100);

                    console.log('\n\r\n\rCOMPLERE MERGED');

                })
            } else {
                if (exportlist[0].bPagination) {
                    let newPath = exportlist[0].finalPath.replace('.pdf', '_1.pdf');
                    let res = await this.paginationReq(exportlist[0].finalPath, newPath)
                    if (res.status == 'ok') {
                        exportlist[0].finalPath = newPath;
                    }
                }

                const body = { nExportid: exportlist[0].nExportid, cPath: exportlist[0]["finalPath"] };
                let data = await this.db.executeRef('export_update_single_pdf', body);
                this.emitMessage(exportlist[0], data.data[0][0], exportlist[0]["finalPath"], nMasterid, 100, 100);

            }

        } catch (error) {
            console.log('Error in mergePdf', error);

        }


    }

    emitMessage(mdl, data, path, nMasterid, comp_progres, total_prog) {
        // console.log('Emit Message', mdl, data, path, nMasterid, comp_progres, total_prog);
        try {

            // console.log('Emit Message', JSON.stringify(mdl), JSON.stringify(data), path, nMasterid, comp_progres, total_prog);
            const obj = {
                nExportid: mdl.nExportid,
                nEDid: mdl.nEDid,
                total_prog: total_prog,
                comp_progres: comp_progres,
                finalPath: path ? path : '',
                cType: mdl.cType,
                cStatus: data.cStatus,
                nCaseid: data.nCaseid,
            };
            // console.log('Emit Message', obj, data);
            this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
        } catch (error) {

        }
    }



    private async editFile(list: any, index: number, nExportid: number, nMasterid: string, jsonData: any): Promise<void> {

        this.logService.info(`Use python file for annotaion `, this.logApp);
        this.logger.verbose(`Use python file for annotaion`);
        this.updateProgress(nExportid, nMasterid, jsonData, 'S');
        return await new Promise((resolve, reject) => {

            const pythonProcess = spawn(this.pythonV, [this.EDIT_FILE_PATH, JSON.stringify(jsonData)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    ASSETS: this.config.get('ASSETS'),
                    ROOT_PATH: this.config.get('ROOT_PATH'),

                    DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
                    DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
                    DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
                    DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),

                    DO_TOKEN: this.config.get('DO_TOKEN'),
                    DO_CDN_ID: this.config.get('DO_CDN_ID')
                }
            });

            pythonProcess.stdout.on('data', (data) => {
                this.logService.log(`Python stdout: ${data.toString().trim()}`, this.logApp);
                // this.logger.verbose(`Python stdout: ${data.toString().trim()}`);

                // this.logger.log(`Python stdout: ${data}`);
                // console.log(data.toString().trim());
            });

            pythonProcess.stderr.on('data', (data) => {
                this.logService.error(`Python stderr: ${data.toString().trim()}`, this.logApp);
                // this.logger.error(`Python stderr: ${data}`);
                // console.log(data.toString().trim());
            });

            pythonProcess.on('close', async (code) => {
                try {
                    if (code === 0) {
                        this.logService.log(`Python script exited with code ${code}`, this.logApp);
                        console.log(`Python script exited with code ${code}`);
                        jsonData['folder'] = 'ed' + jsonData.nEDid;
                        await this.startIndexing(index, nExportid, nMasterid, jsonData);
                        console.log('Indexing completed');
                        // this.logger.log(`Python script exited with code ${code}`);
                        await this.completeFile(list, jsonData, nMasterid, {});
                        console.log('File completed');
                        // await this.updateProgress(nExportid, nMasterid, jsonData, 'C');
                        console.log('Progress updated');
                        // resolve();
                    } else {
                        this.logService.error(`Python script exited with code ${code}`, this.logApp);
                        this.logger.error(`Python script exited with code ${code}`);
                        jsonData.cStatus = 'F';
                        await this.completeFile(list, jsonData, nMasterid, { code });
                        await this.updateProgress(nExportid, nMasterid, jsonData, 'F');
                        // resolve();
                        // reject(new Error(`Python script failed with code ${code}`));
                    }
                } catch (error) {
                    await this.updateProgress(nExportid, nMasterid, jsonData, 'F');
                }
                resolve();
            });
        });


    }

    private async updateProgress(nExportid: number, nMasterid: string, mdl: any, flag: string): Promise<void> {

        try {
            // console.log('Update status - ', flag);
            const res = await this.db.executeRef('export_update_progress_1', {
                nMasterid,
                nExportid,
                nEDid: mdl.nEDid,
                cPath: mdl.cPath,
                cStatus: flag,
                isComplete: false
            });

            if (res.data && res.data.length) {
                const data = res.data[0][0];
                // console.log('Update status - data', data);
                const obj = {
                    nID: mdl.nID,
                    nExportid,
                    comp_progres: data?.comp_progres,
                    total_prog: data.total_prog,
                    cType: data.cType,
                    nEDid: mdl.nEDid,
                    cStatus: data.cStatus,
                    nCaseid: data.nCaseid,
                };
                this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
            }
        } catch (error) {
            this.logger.error('Error in updateProgress', error);
            this.logService.error(`Error in updateProgress ${JSON.stringify(error)} `, this.logApp);
        }
    }

    // ... (other methods like startIndexing, createIndexPages, createFactsheetPdf, etc.)



    private async startIndexing(indexs: number, nExportid: number, nMasterid: string, mdl: any): Promise<any> {
        try {
            this.logService.log(`Start indexing for file `, this.logApp);
            mdl.factsheets_array = [];
            // console.log('Step 1', mdl);
            const isCover = this.determineIsCover(mdl, indexs);
            // console.log('Step 1.1');
            await this.processFactsheets(mdl);
            // console.log('Step 1.2');
            await this.createIndexPages(mdl, isCover, `${this.FILEPATH}export/${mdl.folder}/indx.pdf`);
            // console.log('Step 1.3');
            await this.createFactsheetPdfs(mdl);

            this.logger.log('PDF created successfully.');

            await this.updateProgress(nExportid, nMasterid, mdl, 'I');
            await this.mergeIndexPages(mdl, nExportid, nMasterid);
            // return { msg: 1 };
        } catch (err) {
            this.logger.error('Error in startIndexing', err);
            this.logService.error(`Error in startIndexing ${JSON.stringify(err)} `, this.logApp);
            throw err;
            // return { msg: -1, error: err.message }
        }
        Promise.resolve();
    }

    private determineIsCover(mdl: any, indexs: number): string {
        try {
            if (mdl.cType === 'S') {
                return (mdl.bCoverpg && indexs === 0) ? 'Y' : 'N';
            }
            this.logService.log(`Check Cover page ${mdl.bCoverpg}`, this.logApp);
            return mdl.bCoverpg ? 'Y' : 'N';
        } catch (error) {
            this.logger.error('Error in determineIsCover', error);
        }
    }

    private async processFactsheets(mdl: any): Promise<void> {
        try {
            this.logService.log(`Get fact sheet data `, this.logApp);
            if (mdl.allfacts?.length && mdl.isFactsheet) {
                mdl.factsheets_array = mdl.allfacts.map(x => ({
                    isTask: mdl.isTask ? 'Y' : 'N',
                    nFSid: x
                }));
            }
        } catch (error) {
            this.logService.error(`Error while geting factsheet data`, this.logApp);
        }
    }

    private async createFactsheetPdfs(mdl: any): Promise<void> {
        const createPdfPromises = mdl.factsheets_array.map(async (item) => {
            const tempPath = `${this.FILEPATH}export/${mdl.folder}/factsheet${item.nFSid}.pdf`;
            await this.createFactsheetPdf(mdl, item, tempPath);
        });

        await Promise.all(createPdfPromises);
    }

    private async mergeIndexPages(mdl: any, nExportid: number, nMasterid: string): Promise<void> {
        try {
            this.logger.log('Starting index pages merge');

            const firstPDF = await this.loadPDF(this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf');
            const secondPDF = await this.loadPDF(this.FILEPATH + 'export/' + mdl.folder + '/new_pdf.pdf');
            if (firstPDF.msg == 1) {
                mdl.indexpagescount = firstPDF.pdf.getPageCount();
            } else {
                mdl.indexpagescount = 0
            }

            const mergedPDF = await PDFDocument.create();
            if (firstPDF.msg == 1) {
                console.log('Step 0');
                await this.copyPagesToMergedPDF(mergedPDF, firstPDF.pdf);
            }
            console.log('Step 0.2');
            await this.copySelectedPagesToMergedPDF(mergedPDF, secondPDF.pdf, mdl);
            console.log('Step 0.4');
            let pages = mergedPDF.getPageCount();
            console.log('Step 0.4.0', pages);
            await this.addFactsheetPages(mergedPDF, mdl, pages);
            console.log('Step 0.5');

            await this.scalePagesAndAnnotations(mergedPDF, mdl);

            console.log('Step 0.6');
            const mergedPDFData = await mergedPDF.save();
            await this.saveMergedPDF(mergedPDFData, mdl);

            console.log('Step 0.7');
            await this.updateProgress(nExportid, nMasterid, mdl, 'M');
            this.logger.log('Reading content');
            await this.readContent(mergedPDF, mdl, mdl.indexpagescount, nExportid, nMasterid);
            this.logger.log('Reading content success');
            Promise.resolve();
        } catch (error) {
            this.logger.error('Error in mergeIndexPages', error);
            throw error;
        }
    }

    private async loadPDF(path: string): Promise<{ msg: number, pdf: PDFDocument }> {
        if (!fs.existsSync(path)) {
            this.logger.error(`File not found: ${path}`);
            return { msg: -1, pdf: null };
        };
        const pdfData = await readFileSync(path);
        const pdf = await PDFDocument.load(pdfData, { ignoreEncryption: true });
        return { msg: 1, pdf };
    }

    private async copyPagesToMergedPDF(mergedPDF: PDFDocument, sourcePDF: PDFDocument): Promise<void> {
        console.log('Step 0.1');
        const pages = await mergedPDF.copyPages(sourcePDF, sourcePDF.getPageIndices());
        pages.forEach(page => mergedPDF.addPage(page));
        return Promise.resolve();
    }

    private async copySelectedPagesToMergedPDF(mergedPDF: PDFDocument, sourcePDF: PDFDocument, mdl: any): Promise<void> {
        console.log('Step 0.3');
        const pages = await mergedPDF.copyPages(sourcePDF, sourcePDF.getPageIndices());
        const selectedPages = mdl.isAllpage ? pages : this.getSelectedPages(pages, mdl.jPages);
        selectedPages.forEach(page => mergedPDF.addPage(page));
        return Promise.resolve();
    }

    private getSelectedPages(pages: PDFPage[], jPages: number[]): PDFPage[] {
        // const selectedIndices = this.getPages(jPages);
        return pages.filter((_, index) => jPages.includes(index + 1));
    }

    private async addFactsheetPages(mergedPDF: PDFDocument, mdl: any, startPage: number): Promise<void> {
        try {
            if (!mdl.factsheets_array?.length) return;

            for (const item of mdl.factsheets_array) {
                const factsheetPDF = await this.loadPDF(this.FILEPATH + `export/${mdl.folder}/factsheet${item.nFSid}.pdf`);
                const factsheetPages = await mergedPDF.copyPages(factsheetPDF.pdf, factsheetPDF.pdf.getPageIndices());
                item.startpg = startPage;
                factsheetPages.forEach(page => {
                    mergedPDF.addPage(page);
                    startPage++;
                });
            }
            Promise.resolve();

        } catch (error) {
            console.log('Error in addFactsheetPages', error);
        }
    }

    private async scalePagesAndAnnotations(mergedPDF: PDFDocument, mdl: any): Promise<void> {
        try {
            const [fnl_width, fnl_height] = PageSizes[mdl.cPgsize || 'A4'];
            const pages = mergedPDF.getPages();

            pages.forEach(page => {
                const { width: pageWidth, height: pageHeight } = page.getSize();
                // const { scaleX, scaleY } = this.calculateScaleFactors(pageWidth, pageHeight, fnl_width, fnl_height);

                // this.scalecontentService.scaleContent(page, scaleX, scaleY);
                // page.setSize(pageWidth > pageHeight ? fnl_height : fnl_width, pageWidth > pageHeight ? fnl_width : fnl_height);
                // this.scaleannotsService.scaleAnnots(page, scaleX, scaleY);
            });
        } catch (error) {

        }
        Promise.resolve();
    }

    private calculateScaleFactors(pageWidth: number, pageHeight: number, fnl_width: number, fnl_height: number): { scaleX: number, scaleY: number } {
        if (pageWidth > pageHeight) {
            return {
                scaleX: (pageWidth - this.extraWidth) / fnl_width,
                scaleY: (pageHeight + this.extraWidth) / fnl_height
            };
        } else {
            return {
                scaleX: fnl_width / pageWidth,
                scaleY: fnl_height / pageHeight
            };
        }
    }

    private async saveMergedPDF(mergedPDFData: Uint8Array, mdl: any): Promise<void> {
        const directoryPath = this.FILEPATH + 'export';
        await fs.mkdirSync(directoryPath, { recursive: true });
        await fs.writeFileSync(directoryPath + '/' + mdl.folder + '/modified_linked.pdf', mergedPDFData);
        Promise.resolve();
    }



    generateHighlightTables(mdl: any, data: any, isCover: string) {
        let fact = [];
        let doc = [];
        let web = [];
        let Qfact = [];
        try {
            if (mdl.bQfact) {
                Qfact = this.generateHighlight(data?.factlinks?.filter(link => link.cFType === 'QF') || [], 'QF', isCover == 'Y');
            }
            if (mdl.bFact) {
                fact = this.generateHighlight(data?.factlinks?.filter(link => link.cFType === 'F') || [], 'F', isCover == 'Y' || (mdl.bQfact && data?.factlinks?.filter(link => link?.cFType === 'QF')?.length));
            }
            if (mdl.bDoc) {
                doc = this.generateHighlight(data.doclinks, 'D', isCover == 'Y' || ((mdl.bFact || mdl.bQfact) && data?.factlinks?.length));
            }
            // if (mdl.bWeb) {
            //     web = this.generateHighlight(data.weblinks, 'W', isCover == 'Y' || (mdl.bDoc && data?.doclinks?.length) || ((mdl.bFact || mdl.bQfact) && data?.factlinks?.length));
            // }
        }
        catch (error) {
            this.logger.error('Error in generateHighlightTables', error);
        }
        return [...Qfact, ...fact, ...doc, ...web];
    }



    async createIndexPages(mdl: any, isCover: string, path: string): Promise<any> {
        try {
            this.logger.verbose(`Creating index page`);
            this.logService.log(`Creating index page `, this.logApp);
            const data = await this.db.executeRef('preview_document_list_1', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid, nExportid: mdl.nExportid });
            const { cUsername: username, factlinks: highlightlist, casedetail: [casedetail], factsheet: factslist } = data.data[0][0];

            let docDefinition = {};
            const idxRoot = data.data[0][0];
            const counts = {
                qfact: (idxRoot?.factlinks || []).filter((l: any) => l.cFType === 'QF').length,
                fact: (idxRoot?.factlinks || []).filter((l: any) => l.cFType === 'F').length,
                link: (idxRoot?.doclinks || []).length,
            };
            const enabled = { qfact: !!mdl.bQfact, fact: !!mdl.bFact, link: !!mdl.bDoc };
            const highlights = this.generateHighlightTables(mdl, idxRoot, isCover);
            // First section flows under the title block (drop its leading page break);
            // later sections keep starting on a fresh page.
            if (highlights.length && (highlights[0] as any)?.pageBreak === 'after') highlights.shift();
            if (highlights.length && isCover === 'Y') {
                docDefinition = {
                    pageSize: mdl.cPgsize || 'A4',
                    // 0.6in side margins; top/bottom leave room for the running header/footer.
                    pageMargins: [43, 66, 43, 48],
                    defaultStyle: { font: 'Inter', fontSize: 10, color: '#12233f', lineHeight: 1.2 },
                    header: (_cp: number, _pc: number, ps: any) => this.idxRunningHeader(casedetail, ps),
                    footer: () => this.idxRunningFooter(casedetail),
                    content: [
                        this.idxTitleBlock(casedetail, username, counts, enabled),
                        ...highlights,
                        // ...this.generateAppendix(factslist)
                    ],
                    styles: this.getDocumentStyles(),
                }


                return new Promise((resolve, reject) => {
                    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
                    pdfDoc.pipe(createWriteStream(path))
                        .on('finish', () => {
                            this.logService.log(`Creating index page successfully`, this.logApp);
                            resolve({ msg: 1 })
                        })
                        .on('error', error => {
                            this.logService.log(`Rejcet Error in createIndexPages ${JSON.stringify(error)} `, this.logApp);
                            reject({ msg: -1, error })
                        });
                    pdfDoc.end();
                });
            } else {
                return { msg: 1 }
            }
        } catch (error) {
            this.logger.error('Error in createIndexPages', error);
            this.logService.error(`Error in createIndexPages ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, error };
        }
    }

    private generateCoverPage(casedetail: any, username: string, isCover: string): any {
        if (isCover !== 'Y') return [];
        try {
            var content = [{
                "columns": [
                    {
                        "width": 120,
                        "stack": [
                            {
                                "canvas": [
                                    {
                                        "type": "rect",
                                        "x": 0,
                                        "y": 0,
                                        "w": 90,
                                        "h": 350,
                                        "color": "#ff3d00"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "width": 420,
                        "stack": [
                            { "text": "", "style": "topHeader" },
                            {
                                "text": casedetail?.cCasename,
                                "style": "header"
                            },
                            {
                                "text": casedetail?.cDesc,
                                "margin": [0, 5, 0, 0],
                                "color": "#4f4f4f",
                                "fontSize": 12
                            },
                            {
                                "text": casedetail?.cCaseno,
                                "margin": [0, 10, 0, 10],
                                "color": "#6f6f6f",
                                "fontWeight": 200,
                            },
                            {
                                "text": "Exported on: " + casedetail?.dExportdt,
                                "style": "boldText",
                                "margin": [0, 5, 0, 0],
                                "color": "#4f4f4f"
                            },
                            {
                                "text": "By " + username,
                                "style": "boldText",
                                "margin": [0, 5, 0, 0],
                                "color": "#4f4f4f"
                            }
                        ]
                    }
                ]
            }, {
                "stack":
                    [{
                        "image": `${this.configService.get('ASSETS')}icon/logo.png`,
                        "width": 90, // Adjust as per your requirement
                        "margin": [12, 0, 0, 15],
                    }],
                "absolutePosition": { "x": 440.28, "y": 680.89 },
                // "width": 400,
            }]
            return content
        } catch (error) {
            this.logService.error(`Error in generateCoverPage ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private generateHighlight(data: any[], type: string, isPBreak: boolean = true): any[] {
        try {
            if (!data.length) return [];
            const section = [
                this.idxSectionHead(type, data.length),
                ...(type === 'D' ? [this.idxGroupBand()] : []),
                this.idxTableHead(type),
                this.idxRowsTable(data, type),
            ];
            // Each mark category starts on a fresh index page (legacy pagination).
            return isPBreak ? [{ text: '', pageBreak: 'after' }, ...section] : section;
        } catch (error) {
            this.logService.error(`Error in generateHighlight ${JSON.stringify(error)} `, this.logApp);
        }
    }

    /* ============================ Annotation Index redesign ============================
     * The index cover/section/row visuals below implement the "Annotation Index"
     * Claude Design (navy/blue legal-bundle layout) in pdfmake. Data comes from the
     * same helpers as before (genlinkpage/getFacttext/getlinkdocs/getFilenames); only
     * presentation changed. pdfmake can't do CSS gradients or rounded table corners,
     * so gradients → solid navy and radii → square/svg where it matters.
     * ---------------------------------------------------------------------------- */

    // ---- design tokens ----
    private readonly IDX = {
        navy: '#002f64', ink: '#12233f', ink2: '#2a3a55', mute: '#5b6b85', mute2: '#8b99b2',
        line: '#e1eaf6', line2: '#eef3fb', paper: '#f6f9ff', thead: '#eef2f8',
        accent: '#0066ff', link: '#c2570f', rowAlt: '#fbfcfe',
    };
    // per-type accent (used when a row carries no issue colour)
    private idxTypeTone(type: string): string {
        return type === 'QF' ? '#6b4fd8' : type === 'F' ? '#1c7a4b' : type === 'D' ? '#0066ff' : '#8090a8';
    }
    private idxSectionName(type: string): string {
        return type === 'F' ? 'Facts' : type === 'QF' ? 'qFact' : type === 'D' ? 'DocLinks' : 'Web Links';
    }
    private idxSectionDesc(type: string): string {
        return type === 'QF' ? 'Quick captures from the source document'
            : type === 'F' ? 'Pleaded facts with issue tags'
                : type === 'D' ? 'Passages linked to destination documents'
                    : 'External web references';
    }
    private idxColWidths(type: string): any[] {
        if (type === 'D') return [44, 30, '*', 96, 118];
        if (type === 'W') return [48, 34, '*', 150];
        return [48, 34, '*'];
    }
    /** Row tone = the mark's assigned ISSUE colour. Tries the several shapes the SP
     *  might return it in (issuelist[].cClr, or a direct colour column), else the
     *  per-type accent. A valid colour is a 6-hex string (with/without '#'). */
    private idxRowTone(item: any, type: string): string {
        const cands = [
            item?.issuelist?.[0]?.cClr, item?.issuelist?.[0]?.cColor,
            item?.cClr, item?.cColor, item?.color, item?.jLinktype?.color, item?.jLinktype?.clr,
        ];
        for (const c of cands) {
            if (typeof c !== 'string') continue;
            const hex = c.replace('#', '');
            if (/^[0-9a-fA-F]{6}/.test(hex)) return '#' + hex.substring(0, 6);
        }
        return this.idxTypeTone(type);
    }

    /** The mark's START page (a single number). genlinkpage renders `start–end` which
     *  for highlights is the whole-doc range (end = last page) → "1-21". The real page
     *  is the start (or the first entry of a page list). */
    private idxPageStart(item: any): string {
        const jl = item?.jLinktype;
        if (jl?.pages?.length) return String(jl.pages[0]);
        if (jl && jl.start != null && String(jl.start) !== '') return String(jl.start);
        if (item?.nPage != null && String(item.nPage) !== '') return String(item.nPage);
        if (item?.cPage != null && String(item.cPage) !== '') return String(item.cPage);
        return '';
    }
    /** Display page: a page list (H marks) or the single start page — never the range. */
    private idxPageText(item: any): string {
        const jl = item?.jLinktype;
        if (jl?.pages?.length) return jl.pages.join(', ');
        return this.idxPageStart(item) || '—';
    }
    /** Mix a hex colour toward white by `amt` (0..1) → a light tint. */
    private idxTint(hex: string, amt: number = 0.88): string {
        try {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
            const mix = (x: number) => Math.round(x + (255 - x) * amt);
            const to2 = (x: number) => x.toString(16).padStart(2, '0');
            return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
        } catch { return '#eef2f8'; }
    }

    // ---- svg glyphs (no text-in-svg except the small PDF badge) ----
    // The real eTabella brand mark (app reader header `/colorlogo.svg`) — orange→amber
    // gradient rounded square with the open-book "2.0" glyph. pdfmake's svg-to-pdfkit
    // renders the gradient + clipPath + paths correctly (verified).
    private idxLogoSvg(): string {
        return `<svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2316_303)">
<path d="M24.169 1H7.027C3.69838 1 1 3.69838 1 7.027V24.169C1 27.4976 3.69838 30.196 7.027 30.196H24.169C27.4976 30.196 30.196 27.4976 30.196 24.169V7.027C30.196 3.69838 27.4976 1 24.169 1Z" fill="url(#paint0_linear_2316_303)" stroke="#FF3D00" stroke-width="0.804"/>
<path d="M7 24.2133C7 23.9162 7.23843 23.6772 7.53466 23.6772C7.83089 23.6772 8.06933 23.9162 8.06933 24.2133C8.06933 24.5104 7.83089 24.7495 7.53466 24.7495C7.23843 24.7495 7 24.5104 7 24.2133Z" fill="white"/>
<path d="M12.314 24.2133C12.314 23.9162 12.5524 23.6772 12.8486 23.6772C13.1449 23.6772 13.3833 23.9162 13.3833 24.2133C13.3833 24.5104 13.1449 24.7495 12.8486 24.7495C12.5524 24.7495 12.314 24.5104 12.314 24.2133Z" fill="white"/>
<path d="M17.6282 24.2133C17.6282 23.9162 17.8666 23.6772 18.1628 23.6772C18.4591 23.6772 18.6975 23.9162 18.6975 24.2133C18.6975 24.5104 18.4591 24.7495 18.1628 24.7495C17.8666 24.7495 17.6282 24.5104 17.6282 24.2133Z" fill="white"/>
<path d="M22.939 24.2133C22.939 23.9162 23.1774 23.6772 23.4736 23.6772C23.7699 23.6772 24.0083 23.9162 24.0083 24.2133C24.0083 24.5104 23.7699 24.7495 23.4736 24.7495C23.1774 24.7495 22.939 24.5104 22.939 24.2133Z" fill="white"/>
<path d="M22.0428 13.954C22.1222 13.7837 22.162 13.6098 22.162 13.4323C22.162 13.0664 22.0355 12.773 21.7827 12.552C21.5298 12.331 21.1902 12.2224 20.7639 12.2224C20.3376 12.2224 19.9836 12.3455 19.7307 12.5955C19.4778 12.8454 19.3514 13.186 19.3514 13.6171V13.6424H20.2654V13.5953C20.2654 13.3961 20.3087 13.2476 20.3954 13.1425C20.4821 13.0374 20.6086 12.9867 20.7711 12.9867C20.9084 12.9867 21.0168 13.0302 21.1035 13.1135C21.1866 13.1968 21.2299 13.3055 21.2299 13.4396C21.2299 13.5265 21.2046 13.6207 21.1541 13.7185C21.1035 13.8163 21.0276 13.9286 20.9229 14.0518L19.2141 16.0805H22.1222V15.269H20.959L21.6454 14.5119C21.8296 14.309 21.9597 14.1242 22.0392 13.954H22.0428Z" fill="white"/>
<path d="M22.8012 15.2799C22.7 15.3813 22.6531 15.5045 22.6531 15.653C22.6531 15.8015 22.7037 15.9247 22.8048 16.0297C22.906 16.1348 23.0288 16.1819 23.1733 16.1819C23.3178 16.1819 23.4478 16.1312 23.549 16.0297C23.6501 15.9283 23.7007 15.8015 23.7007 15.653C23.7007 15.5045 23.6501 15.3813 23.549 15.2799C23.4478 15.1784 23.3214 15.1277 23.1733 15.1277C23.0252 15.1277 22.9023 15.1784 22.8012 15.2799Z" fill="white"/>
<path d="M26.3705 12.7513C26.1176 12.3999 25.7636 12.2224 25.312 12.2224C24.8604 12.2224 24.5136 12.3962 24.2535 12.7476C23.997 13.099 23.8669 13.5808 23.8669 14.1967C23.8669 14.8125 23.997 15.298 24.2535 15.6494C24.51 16.0008 24.864 16.1783 25.312 16.1783C25.7599 16.1783 26.1104 16.0044 26.3669 15.6602C26.6233 15.3161 26.7498 14.8379 26.7498 14.2329C26.7498 13.5953 26.6233 13.099 26.3705 12.7476V12.7513ZM25.6732 15.1132C25.5974 15.3052 25.4745 15.403 25.312 15.403C25.1494 15.403 25.0194 15.3052 24.9435 15.1132C24.8676 14.9212 24.8279 14.6169 24.8279 14.2003C24.8279 13.7837 24.8676 13.4758 24.9435 13.2838C25.0194 13.0918 25.1422 12.9976 25.312 12.9976C25.4818 12.9976 25.5974 13.0954 25.6732 13.291C25.7491 13.4867 25.7888 13.791 25.7888 14.2003C25.7888 14.6097 25.7491 14.9212 25.6732 15.1132Z" fill="white"/>
<path d="M22.3643 17.928C22.3643 17.928 18.8962 17.6527 16.7106 19.2974V10.8494C16.7106 10.8494 17.7619 9.36411 22.3643 9.24818V11.2696H24.0081V7.13618C24.0081 7.13618 18.7554 6.70509 15.504 9.13951C12.2527 6.70509 7 7.13618 7 7.13618V19.9857C12.3286 19.6307 15.504 22.1086 15.504 22.1086C15.504 22.1086 18.6795 19.6343 24.0081 19.9857V17.2071H22.3643V17.9244V17.928ZM14.2938 19.2938C12.1118 17.6527 8.64011 17.9244 8.64011 17.9244V9.24818C13.2389 9.36411 14.2938 10.8494 14.2938 10.8494V19.2938Z" fill="white"/>
</g>
<defs>
<linearGradient id="paint0_linear_2316_303" x1="0.598" y1="0.598" x2="30.598" y2="30.598" gradientUnits="userSpaceOnUse">
<stop stop-color="#FF3D00"/>
<stop offset="0.786" stop-color="#FF7A00"/>
<stop offset="0.984" stop-color="#FF7A00"/>
</linearGradient>
<clipPath id="clip0_2316_303">
<rect width="31" height="31" fill="white"/>
</clipPath>
</defs>
</svg>`;
    }
    // Per-type mark glyph (24-viewBox) matching the reader's own gutter icons:
    // QFact = doc + lines + arrow + sparkle (the reader's inline SVG), Fact = ⊕ list,
    // DocLink = two stacked docs + dashed link (mirrors icon/linksicon/{qfact,fact,doc}).
    // Used in BOTH the section head (white) and the Level chip (tone) so they match.
    private idxTypeIconPath(type: string): string {
        return type === 'QF'
            ? `<path d="M13.5 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21H12"/><path d="M8 8h4.5M8 11.5h3"/><path d="m12 15 2 2-2 2"/><path d="M18.4 12.6l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75z"/>`
            : type === 'F'
                ? `<circle cx="6" cy="7" r="3.1"/><path d="M6 5.5v3M4.5 7h3"/><path d="M12.5 5.5h7.5M12.5 9.5h7.5M12.5 13.5h5"/>`
                : type === 'D'
                    ? `<rect x="4" y="3.6" width="15.5" height="5.6" rx="1.3"/><rect x="4" y="14.8" width="15.5" height="5.6" rx="1.3"/><path d="M5.6 12h2.2M10 12h2.2M14.4 12h2.2"/>`
                    : `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>`;
    }
    private idxSectionIconSvg(type: string): string {
        // Icon inside a translucent rounded chip (matches the design's section head).
        return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect width="26" height="26" rx="7" fill="#ffffff" fill-opacity="0.16"/><g transform="translate(5 5) scale(0.667)" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${this.idxTypeIconPath(type)}</g></svg>`;
    }
    private idxLevelChipSvg(tone: string, type: string): string {
        // Circle bg = light tint of the issue colour (colour hint); glyph = dark ink so
        // it stays visible even for pale issues (yellow) where a tone-coloured glyph
        // vanished. The issue colour still reads via the tint + the row's left border.
        const tint = this.idxTint(tone, 0.84);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11.5" fill="${tint}"/><g transform="translate(4 4) scale(0.667)" fill="none" stroke="${this.IDX.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.idxTypeIconPath(type)}</g></svg>`;
    }
    private idxDotSvg(tone: string): string {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"><circle cx="4.5" cy="4.5" r="4.5" fill="${tone}"/></svg>`;
    }
    private idxPdfBadgeSvg(): string {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="18"><rect width="15" height="18" rx="2" fill="#e8453a"/><text x="7.5" y="14.5" fill="#ffffff" font-size="5.5" font-weight="800" text-anchor="middle" font-family="Arial">PDF</text></svg>`;
    }

    // ---- running header / footer ----
    private idxRunningHeader(casedetail: any, pageSize?: any): any {
        // content width = page width minus the 43pt side margins (both sides).
        const lineW = Math.max(0, (pageSize?.width || 595.28) - 86);
        return {
            margin: [43, 22, 43, 0],
            stack: [
                {
                    columns: [
                        { svg: this.idxLogoSvg(), width: 21 },
                        { text: 'eTabella', bold: true, fontSize: 12, color: this.IDX.navy, width: 'auto', margin: [7, 5, 0, 0] },
                        { text: 'LEGAL', bold: true, fontSize: 7.5, color: this.IDX.mute2, characterSpacing: 1.2, width: 'auto', margin: [6, 8, 0, 0] },
                        { text: [{ text: 'Case ', color: this.IDX.mute }, { text: `${casedetail?.cCaseno || ''}`, bold: true, color: this.IDX.navy }], fontSize: 8.5, alignment: 'right', margin: [0, 8, 0, 0] },
                    ],
                    columnGap: 6,
                },
                // Straight full-width navy rule directly below the logo/header row.
                { canvas: [{ type: 'line', x1: 0, y1: 8, x2: lineW, y2: 8, lineWidth: 1.5, lineColor: this.IDX.navy }] },
            ],
        };
    }
    private idxRunningFooter(casedetail: any): any {
        return {
            margin: [43, 8, 43, 0],
            table: {
                widths: ['*', 'auto'],
                body: [[
                    { text: [{ text: `${casedetail?.cCasename || ''}`, bold: true, color: this.IDX.mute }, { text: '  ·  Annotation Index', color: this.IDX.mute2 }], fontSize: 8, border: [false, false, false, false] },
                    { text: `Generated ${casedetail?.dExportdt || ''}  ·  Confidential — Legal Work Product`, fontSize: 8, color: this.IDX.mute2, alignment: 'right', border: [false, false, false, false] },
                ]],
            },
            layout: {
                hLineWidth: (i: number) => i === 0 ? 1 : 0,
                vLineWidth: () => 0,
                hLineColor: () => this.IDX.line,
                paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 7, paddingBottom: () => 0,
            },
        };
    }

    // ---- title block ----
    private idxMetaItem(label: string, value: string): any {
        return {
            width: '*',
            stack: [
                { text: (label || '').toUpperCase(), color: this.IDX.mute2, bold: true, fontSize: 7.5, characterSpacing: 0.6 },
                { text: value || '—', color: this.IDX.ink2, bold: true, fontSize: 10.5, margin: [0, 2, 0, 0] },
            ],
        };
    }
    // Rounded pill (SVG — pdfmake tables can't round corners): label + count, no dot.
    private idxSummaryPill(label: string, count: number, _tone: string): any {
        const lw = Math.ceil(label.length * 5.7);
        const cw = Math.ceil(String(count).length * 6.5);
        const W = 12 + lw + 8 + cw + 12;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="26"><rect x="0.6" y="0.6" width="${(W - 1.2).toFixed(1)}" height="24.8" rx="12.4" fill="${this.IDX.paper}" stroke="#c7d5ea" stroke-width="1"/><text x="12" y="16.6" font-size="10.5" font-weight="bold" fill="${this.IDX.ink2}">${label}</text><text x="${12 + lw + 8}" y="16.6" font-size="10.5" font-weight="bold" fill="${this.IDX.navy}">${String(count)}</text></svg>`;
        return { svg, width: W };
    }
    private idxTitleBlock(casedetail: any, username: string, counts: any, enabled: any): any {
        const pills: any[] = [];
        if (enabled?.qfact) pills.push(this.idxSummaryPill('qFact', counts.qfact, this.idxTypeTone('QF')));
        if (enabled?.fact) pills.push(this.idxSummaryPill('Facts', counts.fact, this.idxTypeTone('F')));
        if (enabled?.link) pills.push(this.idxSummaryPill('DocLinks', counts.link, this.idxTypeTone('D')));
        // Real case/matter names can be very long (full legal titles) — clip so the
        // 3-up meta grid stays 1–2 lines instead of wrapping the whole page down.
        const clip = (s: string, n: number) => { const t = (s || '').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
        const caseName = clip(casedetail?.cCasename || '', 46);
        const meta: any[] = [
            this.idxMetaItem('Case', `${casedetail?.cCaseno || ''}${caseName ? ' · ' + caseName : ''}`),
            this.idxMetaItem('Matter', clip(casedetail?.cDesc || casedetail?.cCasename || '', 52)),
            this.idxMetaItem('Exported by', `${username || ''}${casedetail?.dExportdt ? ' · ' + casedetail.dExportdt : ''}`),
        ];
        return {
            stack: [
                { text: 'EXPORTED WITH ANNOTATIONS', color: this.IDX.accent, bold: true, fontSize: 8, characterSpacing: 1.3, margin: [0, 4, 0, 8] },
                { text: 'Annotation Index', font: 'Lora', bold: true, fontSize: 28, color: this.IDX.navy, margin: [0, 0, 0, 12] },
                { columns: meta, columnGap: 18, margin: [0, 0, 0, 16] },
                // Trailing '*' spacer packs the auto-width pills tight to the left.
                ...(pills.length ? [{ columns: [...pills, { text: '', width: '*' }], columnGap: 8, margin: [0, 0, 0, 6] }] : []),
            ],
            margin: [0, 0, 0, 18],
        };
    }

    // ---- section head + column-group band + table head ----
    private idxSectionHead(type: string, count: number): any {
        const navy = this.IDX.navy;
        return {
            table: {
                widths: ['auto', 'auto', '*'],
                body: [[
                    {
                        columns: [
                            { svg: this.idxSectionIconSvg(type), width: 26 },
                            { text: this.idxSectionName(type), bold: true, fontSize: 13.5, color: '#ffffff', margin: [9, 7, 0, 0] },
                        ],
                        fillColor: navy, border: [false, false, false, false], margin: [4, 5, 0, 5],
                    },
                    { text: String(count), font: 'JetBrainsMono', bold: true, fontSize: 9.5, color: '#ffffff', alignment: 'center', fillColor: navy, border: [false, false, false, false], margin: [8, 9, 8, 3] },
                    { text: this.idxSectionDesc(type), color: '#cfe0fb', fontSize: 9, alignment: 'right', fillColor: navy, border: [false, false, false, false], margin: [0, 10, 8, 3] },
                ]],
            },
            layout: { defaultBorder: false, paddingLeft: () => 8, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 0],
        };
    }
    private idxGroupBand(): any {
        return {
            table: {
                widths: [44 + 30 + 1, '*'],
                body: [[
                    { text: 'SOURCE DOC', color: this.IDX.mute2, bold: true, fontSize: 7.5, characterSpacing: 1, fillColor: '#ffffff', border: [true, false, false, false], borderColor: [this.IDX.line, '', '', ''], margin: [12, 6, 0, 3] },
                    { text: 'DESTINATION DOC', color: this.IDX.accent, bold: true, fontSize: 7.5, characterSpacing: 1, fillColor: '#ffffff', border: [true, false, true, false], borderColor: [this.IDX.line, '', this.IDX.line, ''], margin: [12, 6, 0, 3] },
                ]],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
        };
    }
    private idxTableHead(type: string): any {
        const cells = [
            { text: 'Page', style: 'idxTh' },
            { text: 'Level', style: 'idxTh', alignment: 'center' },
            { text: 'Source Text', style: 'idxTh' },
        ];
        if (type === 'D') { cells.push({ text: '[ Bundle | Tab | Page ]', style: 'idxTh' } as any); cells.push({ text: 'Doc title', style: 'idxTh' } as any); }
        else if (type === 'W') { cells.push({ text: 'Link URL', style: 'idxTh' } as any); }
        return {
            table: { widths: this.idxColWidths(type), body: [cells.map(c => ({ ...c, fillColor: this.IDX.thead, border: [false, false, false, false] }))] },
            layout: {
                hLineWidth: (i: number) => i === 0 ? 1 : 0, hLineColor: () => this.IDX.line, vLineWidth: () => 0,
                paddingLeft: () => 12, paddingRight: () => 12, paddingTop: () => 6, paddingBottom: () => 6,
            },
        };
    }

    // ---- rows ----
    private idxSourceCell(item: any, type: string, tone: string): any {
        const raw0 = item.text
            ? item.text
            : (Array.isArray(item.jTexts) ? item.jTexts.filter(Boolean).join(' ') : (item.jTexts || '-'));
        // Collapse stored line breaks / runs of whitespace so the passage flows as one
        // clean paragraph instead of breaking mid-sentence at the original PDF line ends.
        const raw = String(raw0).replace(/\s+/g, ' ').trim() || '-';
        // Highlight-band style: DARK readable text on a light tint of the issue colour
        // (like the actual highlighter), with the TRUE colour kept on the left border
        // + level chip. Pale issues (yellow) stay legible instead of vanishing on white.
        const inner: any[] = [{ text: raw, color: this.IDX.ink, fontSize: 9, lineHeight: 1.3 }];
        const iss = item?.issuelist?.[0];
        if (iss?.cIssue) {
            inner.push({
                columns: [
                    { svg: this.idxDotSvg(tone), width: 7, margin: [0, 2, 0, 0] },
                    { text: iss.cIssue, color: this.IDX.mute, fontSize: 8, margin: [4, 0, 0, 0] },
                ], margin: [0, 5, 0, 0],
            });
        }
        return {
            table: { widths: ['*'], body: [[{ stack: inner, fillColor: this.idxTint(tone, 0.80), border: [false, false, false, false], margin: [11, 4, 9, 4] }]] },
            layout: {
                hLineWidth: () => 0, vLineWidth: (i: number) => i === 0 ? 3 : 0, vLineColor: () => tone,
                paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
            },
        };
    }
    private idxRowsTable(data: any[], type: string): any {
        try {
            if (!data || !data.length) return { text: '' };
            const body = data.map(item => {
                const tone = this.idxRowTone(item, type);
                const row: any[] = [
                    { stack: [{ text: this.idxPageText(item), linkToPage: this.getPageno(this.idxPageStart(item)), color: this.IDX.link, decoration: 'underline', destination: { fit: true } }], font: 'JetBrainsMono', fontSize: 9, alignment: 'left', border: [false, false, false, false], margin: [0, 1, 0, 0] },
                    { svg: this.idxLevelChipSvg(tone, type), width: 24, alignment: 'center', border: [false, false, false, false], margin: [0, 0, 0, 0] },
                    { ...this.idxSourceCell(item, type, tone), border: [false, false, false, false] },
                ];
                if (type === 'D') {
                    row.push({ stack: this.getlinkdocs(item.jFiles), font: 'JetBrainsMono', fontSize: 8.5, color: this.IDX.navy, border: [true, false, false, false], borderColor: [this.IDX.line, '', '', ''], margin: [8, 1, 0, 0] });
                    row.push({ columns: [{ svg: this.idxPdfBadgeSvg(), width: 15 }, { stack: this.getFilenames(item.jFiles), fontSize: 9, color: this.IDX.ink2, margin: [6, 0, 0, 0] }], border: [false, false, false, false], margin: [4, 1, 0, 0] });
                } else if (type === 'W') {
                    row.push({ text: item.cUrl, link: item.cUrl, color: this.IDX.accent, decoration: 'underline', fontSize: 8.5, border: [false, false, false, false], margin: [4, 2, 0, 0] });
                }
                return row;
            });
            return {
                table: { widths: this.idxColWidths(type), body, dontBreakRows: true },
                layout: {
                    fillColor: (rowIndex: number) => rowIndex % 2 === 1 ? this.IDX.rowAlt : '#ffffff',
                    hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? 1 : 1,
                    hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? this.IDX.line : this.IDX.line2,
                    vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length) ? 1 : 0,
                    vLineColor: () => this.IDX.line,
                    paddingLeft: () => 12, paddingRight: () => 12, paddingTop: () => 9, paddingBottom: () => 9,
                },
                margin: [0, 0, 0, 6],
            };
        } catch (error) {
            this.logService.error(`Error in idxRowsTable ${JSON.stringify(error)} `, this.logApp);
            return { text: '' };
        }
    }
    // ========================== end Annotation Index redesign ==========================

    private generateAppendix(data: any[]): any[] {
        try {

            if (!data.length) return [];

            return [
                { text: '', pageBreak: 'after' },
                this.createIndexHeader('Appendix'),
                // this.createAppendixTableHeader(),
                this.createAppendixTable(data)
            ];
        } catch (error) {
            this.logService.error(`Error in generateAppendix ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private createIndexHeader(title: string): any {
        try {
            return {
                table: {
                    widths: ['*'],
                    body: [
                        [{ text: 'Index', style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }],
                        [{ text: title, style: ['annotHead'], border: [false, false, false, false] }]
                    ],
                }
            };

        } catch (error) {
            this.logService.error(`Error in createIndexHeader ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private createTableHeader(type: string): any {
        try {
            return {
                "layout": 'noBorders', // Optional: Removes borders from the table
                margin: [10, 0, 10, 10],
                "table": {
                    "widths": ['50%', '50%'], // Equal width for both columns
                    "body": [
                        [
                            { "text": "Source Doc", fontSize: 10, color: '#4f4f4f' },
                            { "text": `${type == 'W' ? '' : 'Destination Doc'}`, fontSize: 10, color: '#4f4f4f' }
                        ]
                        // Add more rows as needed
                    ]
                },

            };

        } catch (error) {

            this.logService.error(`Error in createTableHeader ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private createAnnotationsTable(data: any[], type: string): any {
        try {
            let content = [];
            if (data.length) {
                content.push({
                    "layout": 'noBorders', // Optional: use this to style the table borders as needed
                    "table": {
                        "widths": ['10%', '10%', '30%', `${type == 'W' ? '50%' : '20%'}`, `${type == 'W' ? '0%' : '30%'}`],// Adjust widths as needed
                        "body": [
                            [
                                { "text": "Page", "style": "tableHeader2", "alignment": "start", fillColor: '#c2c2c2', color: '#4f4f4f', margin: [3, 6, 6, 3] },
                                { "text": "Level", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Source Text", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": `${type == 'W' ? 'Link URL' : '[ Bundle | Tab | Page ]'}`, "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": `${type == 'W' ? '' : 'Doc title'}`, "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' }
                            ],
                        ]
                    }, "margin": [10, 0, 10, 0]
                });

                if (type == 'W') {
                    const table1 = this.annotationsWebTable(data);
                    if (table1) content.push(table1);
                }
                else {

                    const table1 = this.annotationsTable(data);
                    if (table1) content.push(table1);
                }
            }
            return content
        } catch (error) {
            this.logService.error(`Error in createAnnotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private annotationsTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length) return null;
            return {
                table: {
                    "widths": ['10%', '10%', '30%', '20%', '30%'],  // Define widths for each of the 4 columns
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: this.genlinkpage(item),
                                style: 'tableRowEven',
                                alignment: 'start',
                                margin: [0, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": item?.jLinktype?.type == 'F' ? `${this.configService.get('ASSETS')}icon/file.png` : item?.jLinktype?.type == 'P' ? `${this.configService.get('ASSETS')}icon/pagefile.png` : `${this.configService.get('ASSETS')}icon/highlight.png`,
                                        "width": 10, // Adjust as per your requirement
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        table: {
                                            widths: ['*'],
                                            body: [[
                                                {
                                                    text: item.text
                                                        ? item.text
                                                        : (item.jTexts?.length ? this.getFacttext(item.jTexts) : '-'),

                                                    // visual formatting – cell-level properties
                                                    fillColor: '#ffffff',        // try a visible colour first
                                                    fontSize: 5,
                                                    margin: [0, 0, 0, 0],       // inside padding

                                                    // optional – remove borders if you don’t want the grid lines
                                                    border: [false, false, false, false]
                                                }
                                            ]]
                                        },
                                        // kill the default row lines if you want a clean block of colour
                                        layout: {
                                            defaultBorder: false,
                                            paddingLeft: () => 5,
                                            paddingRight: () => 5,
                                            paddingTop: () => 5,
                                            paddingBottom: () => 5
                                        }
                                    },
                                    {
                                        columns: item.nFSid > 0 ? [
                                            {
                                                // text: `FACT_BUTTON${item.nFSid}`,
                                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                                                    <rect width="80" height="30"  fill="white" stroke="#c2c2c2" stroke-width="1" rx="8" ry="8"/>
                                                    <image href="${this.configService.get('ASSETS')}icon/linksicon/fact.png" x="10" y="9" height="10" width="10" />
                                                    <text x="5" y="19" fill="#ffffff" fill-opacity="0.1" style="font-size:10px">FACT_BUTTON${item.nFSid}</text>
                                                    <text x="25" y="18" fill="#4f4f4f" style="font-size:10px">Fact Sheet</text>
                                                </svg>`,
                                                style: 'tableRowEven', "margin": [0, 0, 0, 0],
                                            }
                                        ] : [],
                                        // border: [true, true, true, true],
                                        // borderColor: ['#4f4f4f', '#4f4f4f', '#4f4f4f', '#4f4f4f'],
                                        padding: [5, 5, 0, 0],
                                        "margin": [5, 10, 0, 0], border: [true, true, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'],
                                        "link": `FACT_BUTTON${item.nFSid}`,
                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getlinkdocs(item.jFiles), style: 'tableRowEven', alignment: 'left',
                                margin: [0, 3, 0, 0],
                                border: [false, false, false, false],
                                borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getFilenames(item.jFiles),
                                margin: [0, 0, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#f1f1f1', alignment: 'left'
                            }
                        ])
                    ],
                    dontBreakRows: true
                },
                margin: [10, 10, 10, 10],
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    }
                }
            };
        } catch (error) {


            this.logger.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);

            this.logService.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    };



    private annotationsWebTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length) return null;
            return {
                table: {
                    "widths": ['10%', '10%', '30%', '20%', '30%'],  // Define widths for each of the 4 columns
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: this.genlinkpage(item),
                                style: 'tableRowEven',
                                alignment: 'start',
                                margin: [0, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": item.jLinktype?.type == 'F' ? `${this.configService.get('ASSETS')}icon/file.png` : item.jLinktype?.type == 'P' ? `${this.configService.get('ASSETS')}icon/pagefile.png` : `${this.configService.get('ASSETS')}icon/highlight.png`,
                                        "width": 10, // Adjust as per your requirement
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        table: {
                                            widths: ['*'],
                                            body: [[
                                                {
                                                    text: item.text
                                                        ? item.text
                                                        : (item.jTexts?.length ? this.getFacttext(item.jTexts) : '-'),

                                                    // visual formatting – cell-level properties
                                                    fillColor: '#ffffff',        // try a visible colour first
                                                    fontSize: 5,
                                                    margin: [0, 0, 0, 0],       // inside padding
                                                    // optional – remove borders if you don’t want the grid lines
                                                    border: [false, false, false, false]
                                                }
                                            ]]
                                        },
                                        // kill the default row lines if you want a clean block of colour
                                        layout: {
                                            defaultBorder: false,
                                            paddingLeft: () => 5,
                                            paddingRight: () => 5,
                                            paddingTop: () => 5,
                                            paddingBottom: () => 5
                                        }
                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                text: item.cUrl,
                                link: item.cUrl,
                                color: 'blue',
                                decoration: 'underline',
                                fontSize: 8,
                                "margin": [5, 10, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#f1f1f1', alignment: 'left'
                            }
                        ])
                    ],
                    dontBreakRows: true
                },
                margin: [10, 10, 10, 10],
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    }
                }
            };
        } catch (error) {
            this.logger.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
            this.logService.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    };



    getFilenames(data) {
        try {
            if (!data || !data.length) return [];
            var content = []
            for (let item of data) {
                content.push({ text: item.cFilename, style: 'tableRowEven', border: [false, false, false, false], alignment: 'left', margin: [0, 3, 0, 3] })
            }
            return content;
        } catch (error) {
            this.logService.error(`Error in getFilenames ${JSON.stringify(error)} `, this.logApp);

        }
    }

    private createAppendixTableHeader(): any {
        // Implement appendix table header creation
    }

    private createAppendixTable(data: any[]): any {
        try {
            let content = [];
            if (data.length) {
                content.push({
                    "layout": 'noBorders', // Optional: use this to style the table borders as needed
                    "table": {
                        "widths": ['10%', '5%', '55%', '15%', '15%'],// Adjust widths as needed
                        "body": [
                            [
                                { "text": "Page", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', margin: [5, 6, 6, 5], color: '#4f4f4f' },
                                { "text": "Level", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Fact Text", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Issues", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Authors", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' }
                            ],
                        ]
                    }, "margin": [10, 0, 10, 0]
                });
                const table1 = this.appendixTable(data);
                if (table1) content.push(table1);
            }
            return content;
        } catch (error) {
            this.logService.error(`Error in createAppendixTable ${JSON.stringify(error)} `, this.logApp);
        }
    }


    appendixTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length) return null;
            return {
                table: {
                    "widths": ['10%', '5%', '55%', '15%', '15%'],  // Define widths for each of the 4 columns
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: [
                                    {
                                        text: item.cPage,
                                        linkToPage: this.getPageno(item.cPage),
                                        style: 'tableRowEven',
                                        color: '#ff3d00', "decoration": "underline"
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'left',
                                margin: [5, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": `${this.configService.get('ASSETS')}icon/file.png`,
                                        "width": 10, // Adjust as per your requirement
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },

                            {
                                stack: [
                                    {
                                        text: item.cType == 'M' ? item.cFact : this.getFacttext(item.jTexts),
                                        style: 'tableRowEven', margin: [0, 10, 0, 0]
                                    },
                                    {
                                        columns: item.nFSid > 0 ? [
                                            {
                                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                                                    <rect width="80" height="30"  fill="white" stroke="#c2c2c2" stroke-width="1" rx="8" ry="8"/>
                                                    <image href="${this.configService.get('ASSETS')}icon/linksicon/fact.png" x="10" y="9" height="10" width="10" />
                                                    <text x="5" y="19" fill="#ffffff" fill-opacity="0.1" style="font-size:10px">FACT_BUTTON${item.nFSid}</text>
                                                    <text x="25" y="18" fill="#4f4f4f" style="font-size:10px">Fact Sheet</text>
                                                </svg>`,
                                                // style: 'tableRowEven', "margin": [5, 0, 0, 0],
                                            }
                                        ] : [],
                                        // border: [true, true, true, true],
                                        // borderColor: ['#4f4f4f', '#4f4f4f', '#4f4f4f', '#4f4f4f'],
                                        padding: [5, 5, 0, 0],
                                        "margin": [5, 10, 0, 0], border: [true, true, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'],
                                        "link": `FACT_BUTTON ${item.nFSid}`,

                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: [
                                    this.getIssues(item.issuelist)], style: 'tableRowEven', alignment: 'left', margin: [0, 0, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getContacts(item.jContact),
                                margin: [0, 0, 0, 0], border: [false, false, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#fafafa'
                            }
                        ])
                    ],
                    dontBreakRows: true, "margin": [10, 0, 10, 0]
                },
                margin: [10, 0, 10, 0],
                layout: 'noBorders'
            };
        } catch (error) {
            this.logService.error(`Error in appendixTable ${JSON.stringify(error)} `, this.logApp);
        }
    };

    getIssues(data) {
        try {
            if (!data || !data.length) return [];
            var content = []
            for (let item of data) {
                content.push({
                    columns: [
                        {
                            // "svg": `<svg xmlns='./api/controller/exportPdf/bar/svg' width='10' height='10'><line x1='5' y1='0' x2='5' y2='10' style='stroke:${item.cClr.substring(0, 7)}; stroke-width:2' /></svg>` },
                            "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="12">
                        <line x1='5' y1='0' x2='5' y2='10' style='stroke:${item.cClr.substring(0, 7)}; stroke-width:2' />
                        <text x="10" y="8" fill="#4f4f4f" style="font-size:10px">${item.cIssue}</text>
                    </svg>`,
                            margin: [0, 10, 0, 0]
                        },
                    ]
                })
            }
            return content;
        } catch (error) {
            this.logService.error(`Error in getIssues ${JSON.stringify(error)} `, this.logApp);
        }
    }

    getContacts(data) {
        try {
            if (!data || !data.length) return [];
            var content = []
            for (let item of data) {
                content.push({
                    columns: [this.imageSection(item),
                    ]
                })
            }
            return content;
        } catch (error) {
            this.logService.error(`Error in getContacts ${JSON.stringify(error)} `, this.logApp);
        }
    }
    imageSection(item) {
        try {
            var dynamicImageLink = item.cProfile;
            var result = dynamicImageLink && dynamicImageLink != '' ?
                [{
                    // "image": `./public/img/${dynamicImageLink}`,
                    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                        <defs>
                            <clipPath id="circleView">
                                <circle cx="15" cy="15" r="15" fill="#ffffff"/>
                            </clipPath>
                        </defs>
                        <circle cx="15" cy="15" r="15" fill="white" clip-path="url(#circleView)"/>
                        <image href="./public/img/${dynamicImageLink}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                    </svg>`,
                    "width": 30,
                    margin: [0, 6, 0, 6]
                }]
                :
                [{
                    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                        <circle cx="15" cy="15" r="15" fill="#b0c4de"/>
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10" font-family="Arial, sans-serif" >${this.getUserinit(item)}</text>
                    </svg>`,
                    "width": 30,
                    margin: [0, 6, 0, 6]
                }]
            return result;
        } catch (error) {
            this.logService.error(`Error in imageSection ${JSON.stringify(error)} `, this.logApp);
        }
    }

    getFacttext(data) {
        try {
            if (!data || !data.length) return [];
            var content = []
            for (let item of data) {
                content.push({ text: item, border: [false, false, false, false], alignment: 'left', margin: [5, 5, 5, 5], fillColor: '#ffffff', fontSize: 10, color: '#4f4f4f' })
            }
            return content;
        } catch (error) {
            this.logService.error(`Error in imageSection ${JSON.stringify(error)} `, this.logApp);
        }

    }

    private getDocumentStyles(): any {
        try {
            return {
                header: { fontSize: 24, color: "#ff3d00", fontWeight: 400, lineHeight: 1.2, letterSpacing: 0.2 },
                subheader: { bold: true },
                boldText: { bold: true },
                topHeader: { fontSize: 14, bold: true, margin: [0, 190, 0, 20], alignment: "center" },
                linkStyle: { fontSize: 10, color: "#ff3d00" },
                header2: { fontSize: 18, color: "#ffffff", lineHeight: 1.2, letterSpacing: 0.2 },
                hTable: { bold: true, fontSize: 16, padding: [5, 0, 5, 0], margin: [20, 10, 0, 10] },
                annotHead: { bold: true, fontSize: 14, padding: [5, 0, 5, 0], margin: [20, 10, 0, 5], color: '#4f4f4f' },
                tableHeader: { fontSize: 12, color: '#4f4f4f', margin: [25, 0, 0, 10] },
                contentBackground: { fillColor: '#4f4f4f', color: '#ffffff' },
                // Neutralized for the Annotation Index redesign (was a grey fill) — the
                // data helpers (genlinkpage/getlinkdocs/getFilenames) tag rows with this
                // style; explicit per-node colours in the new row builders win over it.
                tableRowEven: { fontSize: 9, color: '#2a3a55' },
                tableHeader2: { fontSize: 8, margin: [0, 5, 0, 5], fillColor: '#6f6f6f' },
                tableContent: { fontSize: 10, margin: [0, 5, 0, 5] },
                // Annotation Index table-header cell.
                idxTh: { bold: true, fontSize: 8.5, color: '#5b6b85', characterSpacing: 0.3 },
            };
        } catch (error) {
            this.logService.error(`Error in getDocumentStyles ${JSON.stringify(error)} `, this.logApp);
        }
    }

    async createFactsheetPdf(mdl, item, path): Promise<any> {

        // bIsTranscipt drives the et_factsheet_detail SP to return the
        // published-view (page, line) — i.e., nTPage/nTLine written by run3.py
        // during transferAnnotations — instead of the draft nPage/nLine.
        // Falls back to false when the export job model doesn't carry the
        // flag (back-compat with non-transcript exports).
        let res = await this.db.executeRef('factsheet_detail', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid, nFSid: item.nFSid, bIsTranscipt: mdl?.bIsTranscipt ?? false });

        try {

            var bundle_detail = res[0]["bundle_detail"][0];
            var curretfact = res[0]["fact_detail"][0];
            var issue_ls = res[0]["issue_ls"] ? res[0]["issue_ls"] : [];
            var task_ls = res[0]["task_ls"] ? res[0]["task_ls"] : [];
            var contact_ls = res[0]["contact_ls"] ? res[0]["contact_ls"] : [];
            var filelist = res[0]["filelist"] ? res[0]["filelist"] : [];
            var user_list = res[0]["user_list"] ? res[0]["user_list"] : [];

            const generateCurretfact = (curretfact) => {
                if (!curretfact.jTexts || !curretfact.jTexts.length) {
                    return [];
                }
                var content = []
                if (curretfact.jTexts && curretfact.jTexts.length) {
                    var detail = {
                        style: 'tableExample',
                        table: {
                            widths: ['*'],
                            body: [...curretfact.jTexts.map(item =>
                                [
                                    {
                                        text: item,
                                        alignment: 'left',
                                        color: '#4f4f4f',
                                        fillColor: '#fafafa',
                                        margin: [10, 5, 5, 10]
                                    },
                                ])
                            ]
                        },
                        layout: 'noBorders'
                    }
                    content.push(detail)
                    return content
                } else
                    return [];
            }

            const fetDatetype = (curretfact) => {
                if (curretfact["jDate"] && curretfact["jDate"]["tpy"] && curretfact["jDate"]["tpy"] != 'Between' && curretfact["jDate"]["tpy"] != 'From to') {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["tpy"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    })
                }
                else if (curretfact["jDate"] && curretfact["jDate"]["tpy"] && (curretfact["jDate"]["tpy"] == 'Between' || curretfact["jDate"]["tpy"] == 'From to')) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["tpy"]} to `,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    })
                }
                if (curretfact["jDate"] && curretfact["jDate"]["dt1"]) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["dt1"]} ${curretfact["jDate"]["tm1"]} ${curretfact["jDate"]["gear1"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    })
                }
                if (curretfact["jDate"] && curretfact["jDate"]["dt2"]) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["dt2"]} ${curretfact["jDate"]["tm2"]} ${curretfact["jDate"]["gear2"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    })
                }
            }
            function toLowercaseAndRemoveSpaces(str) {
                return str.toLowerCase().replace(/\s+/g, '');
            }
            const getIssueSubls = (subitem) => {
                var content = [];
                var isuclr = subitem.cClr.substr(0, 7);
                var impactimage = subitem.cImpact ? './public/img/impact/' + toLowercaseAndRemoveSpaces(subitem.cImpact) + '.png' : '';
                content.push({
                    stack: [
                        {
                            svg: `<svg width="3px" height="10px" xmlns="http://www.w3.org/2000/svg">
                                     <rect x="0" y="0" width="3" height="10" rx="1" ry="1" fill="${isuclr}" />
                                  </svg>`,
                            fit: [3, 10],
                        },
                        {
                            text: subitem.cIssue,
                            alignment: 'left',
                            color: '#4f4f4f',
                            margin: [10, -12, 0, 0]
                        }
                    ],
                    alignment: 'start',
                    color: '#4f4f4f',
                    margin: [0, 10, 0, 10],
                }),

                    content.push({
                        text: subitem.cRelevance ? subitem.cRelevance : '-',
                        alignment: 'start',
                        fontSize: 10,
                        margin: [0, 10, 0, 10],
                    }),

                    content.push({
                        columns: [
                            // {
                            //     image: './public/img/impact/forus.svg',
                            //     width: 10, 
                            //     height: 10, 
                            //     alignment: 'left'
                            // },
                            {
                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                    <image href="${impactimage}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                </svg>`,
                                "width": impactimage ? 15 : 0,
                                alignment: 'center',
                                margin: [0, 0, 0, 0]
                            },
                            {
                                text: subitem.cImpact ? subitem.cImpact : '-',
                                alignment: 'left',
                                color: '#4f4f4f',
                                width: 'auto',
                                fontSize: 10,
                                margin: [-15, 2, 0, 0]
                            }
                        ],
                        margin: [0, 10, 0, 10],
                    })
                return content;
            }

            const getFactIssues = (issue) => {

                if (!issue || !issue.length) { return [] };
                var content = []
                content.push({
                    text: 'Issues',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10]
                })
                var detail = {
                    style: 'tableExample',
                    table: {
                        widths: ['*', 100, 100],
                        body: [[{
                            text: `Claim: ${issue[0].cCategory}`,
                            alignment: 'left',
                            color: '#4f4f4f',
                        },
                        {
                            text: 'Relevance',
                            alignment: 'left',
                            color: '#4f4f4f',
                        },
                        {
                            text: 'Impact',
                            alignment: 'left',
                            color: '#4f4f4f',
                        }],

                        ...issue.filter(item => item.sublist && item.sublist.length).map(item => {

                            for (let subitem of item.sublist) {
                                var ls = getIssueSubls(subitem)
                                return ls;
                            }
                        })
                        ]
                    },
                    layout: 'noBorders'
                };
                content.push(detail)
                return content;
            }

            let generatefactBox = () => {
                var content = []
                content.push({
                    text: 'Fact Box',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10],
                })

                if (curretfact?.cType == 'M') {

                    content.push({
                        style: 'tableExample',
                        table: {
                            widths: ['*'],
                            body: [
                                {
                                    text: curretfact.cFact ? curretfact.cFact : '',
                                    alignment: 'left',
                                    color: '#4f4f4f',
                                    fillColor: '#fafafa',
                                    margin: [5, 5, 5, 5]
                                }
                            ]
                        },
                        layout: 'noBorders'
                    })
                } else {

                    if (curretfact.jTexts && curretfact.jTexts.length) {
                        var detail = {
                            style: 'tableExample',
                            table: {
                                widths: ['*'],
                                body: [...curretfact.jTexts.map(item =>
                                    [
                                        {
                                            text: item.txt,
                                            alignment: 'left',
                                            color: '#4f4f4f',
                                            fillColor: '#fafafa',
                                            margin: [10, 5, 5, 10]
                                        },
                                    ])
                                ]
                            },
                            layout: 'noBorders'
                        }
                        content.push(detail)
                    }
                }
                return content
            }


            let generateContact = () => {

                if (!contact_ls || !contact_ls.length) { return [] };
                var content = []
                content.push({
                    text: 'Contacts',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10],
                })

                content.push({
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 5,
                            x2: 530, // The length of the line; you may need to adjust this depending on your page width
                            y2: 5,
                            lineWidth: 1,
                            lineColor: '#c2c2c2', // The color of the line, set to a light grey
                        }
                    ],
                    margin: [0, 5, 0, 15] // Add some space before and after the line
                })

                let imageSection = (item) => {
                    var dynamicImageLink = item.cProfile;
                    var result = dynamicImageLink && dynamicImageLink != '' ?
                        [{
                            // "image": `./public/img/${dynamicImageLink}`,
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                            <defs>
                                <clipPath id="circleView">
                                    <circle cx="15" cy="15" r="15" fill="#ffffff"/>
                                </clipPath>
                            </defs>
                            <circle cx="15" cy="15" r="15" fill="white" clip-path="url(#circleView)"/>
                            <image href="./public/img/${dynamicImageLink}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                        </svg>`,
                            "width": 30,
                            margin: [0, 6, 0, 6]
                        }]
                        :
                        [{
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                            <circle cx="15" cy="15" r="15" fill="#b0c4de"/>
                            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10" font-family="Arial, sans-serif" >${this.getUserinit(item)}</text>
                        </svg>`,
                            "width": 30,
                            margin: [0, 6, 0, 6]
                        }]
                    return result;
                }

                content.push({
                    style: 'tableExample',
                    table: {
                        widths: [40, '*'],
                        body: [...contact_ls.map(item =>
                            [
                                imageSection(item),
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [
                                                { text: `${item.cFname} ${item.cLname}`, style: 'subHeader' },

                                            ],
                                            [
                                                { text: `${item.cEmail}`, style: 'smallText' }
                                            ]
                                        ],
                                    },
                                    layout: 'noBorders'
                                }
                            ]
                        )
                        ]
                    },
                    layout: 'noBorders'
                });

                return content
            }
            let generateTasks = () => {
                if (!task_ls.length) { return [] };
                var content = []
                content.push({
                    text: 'Tasks',
                    style: 'subHeader'
                });
                content.push({
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 5,
                            x2: 530, // The length of the line; you may need to adjust this depending on your page width
                            y2: 5,
                            lineWidth: 1,
                            lineColor: '#c2c2c2', // The color of the line, set to a light grey
                        }
                    ],
                    margin: [0, 5, 0, 15] // Add some space before and after the line
                });

                content.push(...task_ls.map(item => ([{
                    style: '',
                    table: {
                        widths: ['*'],
                        body: [
                            [
                                {
                                    text: item.cSubject, // Empty cell to align with the image cell above
                                    style: 'smallText',
                                    fillColor: '#f1f1f1',
                                    color: '#202020',
                                    margin: [10, 10, 10, 10], // Adjust the margin as needed
                                    bold: true
                                }
                            ],
                        ],
                    },
                    layout: 'noBorders'
                },
                {
                    // This adds vertical space after the header
                    text: '',
                    margin: [0, 5]
                },
                ])
                ))


                return content


            }

            const docDefinition = {
                pageSize: mdl.cPgsize || 'A4',
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return null; // No header for first page
                    }
                    return [
                        { text: 'Appendix', style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }

                    ];
                },
                content: [
                    {
                        text: 'Fact Sheet',
                        style: 'header'
                    },
                    {
                        style: 'box',
                        table: {
                            widths: ['*'],
                            body: [
                                [{
                                    stack: [
                                        {
                                            style: '',
                                            table: {
                                                widths: ['*'],
                                                body: [
                                                    [
                                                        {
                                                            text: 'Source File', // Empty cell to align with the image cell above
                                                            style: 'smallText',
                                                            fillColor: '#fafafa',
                                                            margin: [10, 5, 10, 0], // Adjust the margin as needed
                                                            bold: true
                                                        }
                                                    ],
                                                ],
                                            },
                                            layout: 'noBorders'
                                        },
                                        {
                                            style: 'tableExample',
                                            table: {
                                                widths: [50, '*'],
                                                body: [
                                                    [
                                                        {
                                                            svg: `<svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                     <path d="M9.47929 0.000112119C9.8952 0.00682026 10.2655 0.268438 10.409 0.660194L15.2134 13.7625L13.6531 15.351L13.0252 13.6405H5.50404L3.76261 18.1389C3.66618 18.388 3.47476 18.5886 3.23045 18.6965C2.98614 18.8045 2.70896 18.8109 2.45989 18.7145C2.21081 18.6181 2.01024 18.4266 1.90231 18.1823C1.79437 17.938 1.7879 17.6608 1.88433 17.4118L3.87531 12.2693L3.87933 12.2586L8.53076 0.630678C8.60664 0.442046 8.73789 0.280829 8.90722 0.168266C9.07654 0.0557037 9.27599 -0.0029224 9.47929 0.000112119ZM9.42428 3.81839L6.29963 11.6267H12.2873L9.42428 3.81839Z" fill="#4F4F4F"/>
                                                     <path d="M22.0168 12.8213L21.8437 12.6791L21.8397 12.6764C21.2555 12.2408 20.5341 12.0298 19.8072 12.082C19.0803 12.1342 18.3965 12.4462 17.8805 12.9608L12.7783 18.1529C12.4617 18.4736 12.2309 18.8627 12.1035 19.2866L11.3159 21.9055C10.6027 22.0172 9.87619 22.014 9.16396 21.8961C9.15654 21.8949 9.14951 21.892 9.14337 21.8876C9.13724 21.8833 9.13217 21.8776 9.12855 21.871C9.12494 21.8644 9.12286 21.8571 9.12249 21.8496C9.12211 21.8421 9.12345 21.8346 9.1264 21.8277L9.17603 21.7203C9.26458 21.5365 9.41753 21.2092 9.46851 20.8724C9.49534 20.6846 9.50473 20.4243 9.40277 20.1479C9.29753 19.8613 9.09786 19.6191 8.8366 19.461C8.40192 19.1927 7.86124 19.1726 7.39704 19.1994C6.93223 19.2335 6.47016 19.298 6.01382 19.3926C5.39398 19.5134 4.80501 19.7911 4.21738 20.0674C3.4446 20.4324 2.6745 20.7946 1.84135 20.7946C1.54217 20.7946 1.25506 20.7463 0.985391 20.6551C0.82037 20.6001 0.63925 20.7342 0.680841 20.9033C0.757313 21.2092 0.898185 21.6237 1.20676 21.943C1.39393 22.1386 1.63215 22.2779 1.89441 22.345C2.15668 22.4121 2.43249 22.4044 2.6906 22.3227C4.64133 21.7512 5.93734 21.4399 6.77989 21.2991C6.95698 21.2695 7.08846 21.4466 7.0348 21.6184C6.95027 21.8867 6.82953 22.3938 7.08041 22.9063C7.35142 23.4645 7.88539 23.6979 8.34691 23.7918C9.88039 24.1084 11.2046 24.0668 12.8226 23.6415C12.894 23.6298 12.9644 23.6128 13.0332 23.5906L13.1902 23.5409C13.4196 23.4738 13.6557 23.4001 13.8999 23.3182C13.9364 23.3064 13.9723 23.2925 14.0072 23.2766L15.8681 22.6742C16.3216 22.5267 16.7307 22.2771 17.0581 21.943L22.1496 16.7644C23.2041 15.6897 23.2001 14.0341 22.1737 12.9729L22.0168 12.8213Z" fill="#4F4F4F"/>

                                                 </svg>`,
                                                            // image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAAAXNSR0IArs4c6QAAAQ5JREFUOE+tlTESRDAUQL9KoTBDpzYqN9C4gVM4gAvlBE6gVKhSKo2O0oyCGVV2kp3MWkkka6My4j//5z8/DsaYBEEAruvCP9dxHLAsCzjjOBJ6E8cx+L7/iLmuKwzDADQxZ5om4nkee/AEymE0dtu2NzCKIjgvmGZ6jZnn+QOktf4Clb0rAE2hqg9LgTroXRVKoAqq2xIGzPOc1HUNYRgKypwBdFFnAgMihEiSJJBlmdRBDqWLOq0YsGkasu87FEVhB9i2LcEYQ1VVdkru+550XQdlWX4BZQ0waooMeBeo1eZasi6LO0+FppjA+L4ofz2uTZqmWs+uXZMOByo2QogNR51nMq+E8WV9wNo+Al55K038ohH5XgAAAABJRU5ErkJggg==',
                                                            width: 20,
                                                            style: 'tableImage',
                                                            fillColor: '#fafafa',
                                                            margin: [0, 10, 0, 10],
                                                        },
                                                        {
                                                            stack: [
                                                                { text: bundle_detail.cFilename, style: 'smallText', bold: true },
                                                                {


                                                                    text: [`[ ${(bundle_detail.cTab ? bundle_detail.cTab : '-')} | ${bundle_detail.cBundletag ? bundle_detail.cBundletag :
                                                                        '–'} | `, {
                                                                        text: `${(curretfact && curretfact.jLinktype && curretfact.jLinktype.typ ==
                                                                            'P') ? curretfact && curretfact.jLinktype && curretfact.jLinktype.val && curretfact.jLinktype.val.frm + '–' + curretfact.jLinktype.val.to :
                                                                            curretfact?.cPage}`,
                                                                        "linkToPage": this.getPageno((curretfact && curretfact.jLinktype && curretfact.jLinktype.typ ==
                                                                            'P') ? curretfact && curretfact.jLinktype && curretfact.jLinktype.val && curretfact.jLinktype.val.frm + '–' + curretfact.jLinktype.val.to :
                                                                            curretfact?.cPage),
                                                                        style: 'tableRowEven',
                                                                        color: '#ff3d00', "decoration": "underline"
                                                                    }, ` ]`],
                                                                    style: 'smallText',
                                                                    margin: [0, 3, 0, 3]

                                                                    // text: `[ ${bundle_detail && bundle_detail.cTab ? bundle_detail.cTab : '–'} | ${bundle_detail && bundle_detail.cTab ? bundle_detail.cTab : '–'} | ${(curretfact && curretfact.jLinktype && curretfact.jLinktype.typ ==
                                                                    //     'P') ? curretfact && curretfact.jLinktype && curretfact.jLinktype.val && curretfact.jLinktype.val.frm + '–' + curretfact.jLinktype.val.to :
                                                                    //     curretfact?.cPage} ]`, style: 'smallText', margin: [0, 3, 0, 3]
                                                                },
                                                                { text: `Exhibit No – ${bundle_detail && bundle_detail.cExhibitno ? bundle_detail.cExhibitno : '–'}`, style: 'smallText' }
                                                            ],
                                                            margin: [0, 10, 0, 10],
                                                            fillColor: '#fafafa' // Apply fillColor to individual cell
                                                        }
                                                    ]
                                                    // Adding a new row with "Source File" text

                                                ],
                                            },
                                            layout: 'noBorders'
                                        },
                                        {
                                            text: 'Source Text',
                                            style: 'subHeader',
                                            margin: [0, 10, 0, 10]
                                        },
                                        generateCurretfact(curretfact),
                                        {
                                            text: `Time Zone ${curretfact.cTimezone ? curretfact.cTimezone : ''}`,
                                            style: 'contentText',
                                            margin: [0, 3, 5, 3],
                                            fontSize: 10
                                        },
                                        fetDatetype(curretfact),

                                        getFactIssues(issue_ls),
                                        {
                                            canvas: [
                                                {
                                                    type: 'line',
                                                    x1: 0,
                                                    y1: 5,
                                                    x2: 530, // The length of the line; you may need to adjust this depending on your page width
                                                    y2: 5,
                                                    lineWidth: 1,
                                                    lineColor: '#c2c2c2', // The color of the line, set to a light grey
                                                }
                                            ],
                                            margin: [0, 10, 0, 10] // Add some space before and after the line
                                        },
                                        generatefactBox(),
                                        generateContact(),
                                        generateTasks()

                                    ],
                                    margin: [20, 20, 20, 20], // Equivalent to padding in CSS
                                }]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        margin: [10, 10, 10, 10],
                        color: '#202020'
                    },
                    subHeader: {
                        fontSize: 12,
                        bold: true,
                        color: '#202020'
                    },
                    contentText: {
                        fontSize: 12,
                        color: '#4f4f4f'
                    },
                    smallText: {
                        fontSize: 10,
                        color: '#4f4f4f'
                    },
                    tableExample: {
                        margin: [0, 0, 0, 15]
                    },
                    tableImage: {
                        alignment: 'center'
                    },
                    box: {
                        margin: [10, 10, 10, 10]
                    }
                },
                defaultStyle: {
                    columnGap: 20
                },
                pageMargins: [0, 0, 0, 0]
            };
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe(createWriteStream(path));

            pdfDoc.pipe(createWriteStream(path)).on('finish', () => {
                return { msg: 1 };
            }, error => {
                return { msg: -1, error: error };
            });
            pdfDoc.end();

        } catch (error) {
            // console.error(error)

            this.logService.error(`Error in createFactsheetPdf ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, error: error };
        }
    }

    // mergedPDF, mdl, mdl.indexpagescount, nExportid, nMasterid 
    async readContent(pdfDoc, mdl, numPages, nExportid, nMasterid): Promise<void> {
        try {
            const pdfPath = this.FILEPATH + 'export/' + mdl.folder + '/modified_linked.pdf';
            const indexFpath = this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf';
            let pageCount = 0;
            if (fs.existsSync(indexFpath)) {
                const firstPDFDATA = await fs.readFileSync(indexFpath);
                const firstPDF = await PDFDocument.load(firstPDFDATA, { ignoreEncryption: true });
                pageCount = firstPDF.getPageCount();
            }
            const annotations = [];
            const pdfjsLib = await import('pdfjs-dist');
            const loadingTask = pdfjsLib.getDocument(pdfPath);
            await loadingTask.promise
                .then((doc) => {

                    let lastPromise = doc.getMetadata().then(() => { });

                    const loadPage = async (pageNum) => {
                        const page = await doc.getPage(pageNum);
                        const viewport = page.getViewport({ scale: 1.0 });

                        const textContent = await page.getTextContent();
                        await this.processTextContent(textContent, mdl, pageNum, page);

                        const annotation = await page.getAnnotations();
                        const links = annotation.filter((ann) => ann.subtype === 'Link');
                        links.filter((ann) => !ann.url && ann.dest).forEach((item) => {
                            if (Array.isArray(item.dest)) {
                                item.dest[0] = parseInt(item.dest[0]) + pageCount;
                            }
                        });

                        annotations.push({ page: pageNum, annotation: links });

                        return { textContent, annotation };
                    };

                    for (let i = 1; i <= numPages; i++) {
                        console.log('Step 2.' + i);
                        lastPromise = lastPromise.then(loadPage.bind(null, i));
                    }
                    return lastPromise;

                })
                .then(
                    async () => {
                        console.log('Step 3');
                        console.log('# End of Document');
                        await this.finalizeDocument(pdfDoc, annotations, mdl, nExportid, nMasterid);
                        Promise.resolve();
                    },
                    (err) => {
                        console.error('Error: ' + err);
                        Promise.resolve();
                    },
                );
        } catch (error) {
            this.logService.error(`Error in readContent ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private async finalizeDocument(pdfDoc, annotations, mdl, nExportid, nMasterid) {
        await new Promise(async (resolve) => {
            await this.updateProgress(nExportid, nMasterid, mdl, 'R');

            this.applyInternalLink(pdfDoc, annotations, mdl, async (rs) => {
                await this.updateProgress(nExportid, nMasterid, mdl, 'U');
                resolve({ msg: 1 });
            });
        });

        const pdfBytes = await pdfDoc.save();
        mdl.finalPath = 'export/' + mdl.folder + '/modified.pdf';
        mdl.cStatus = 'C';

        const directoryPath = path.join(this.FILEPATH, mdl.finalPath);
        await fs.writeFileSync(directoryPath, pdfBytes);
        console.log('File saved');

        await this.cleanupFiles(mdl.folder);
    }

    private processTextContent(content, mdl, pageNum, page): Promise<void> {
        try {
            console.log('Step 2.2');
            const arrayFiltered = content.items.filter((item) => item.str.includes('FACT_BUTTON'));
            arrayFiltered.forEach((k) => {
                const strings = k;
                if (strings) {
                    console.log('Step 2.3');
                    const transformArray = strings['transform'];
                    const x = transformArray[4];
                    const y = transformArray[5];
                    const nFSid = parseInt(strings.str.replace('FACT_BUTTON', ''));
                    if (mdl.factsheets_array && mdl.factsheets_array.length) {
                        const ojs = mdl.factsheets_array.find((a) => a.nFSid === nFSid);
                        if (ojs) {
                            if (!ojs.positions) {
                                ojs.positions = [];
                            }
                            ojs.positions.push({
                                x: x,
                                y: y,
                                topage: pageNum,
                                viewport: page.getViewport({ scale: 1 }),
                                height: k.height,
                                width: k.width,
                            });
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error on getTextContent', error);
        }

        try {
            const indexArrayFiltered = content.items.filter((item) => item.str.includes('PG$-'));
            if (!mdl.indexpagesls) {
                mdl.indexpagesls = [];
            }
            if (indexArrayFiltered) {
                indexArrayFiltered.forEach((k) => {
                    const strings = k;
                    if (strings) {
                        const transformArray = strings['transform'];
                        const x = transformArray[4];
                        const y = transformArray[5];
                        const pgs: any = parseInt(strings.str.replace('PG$-', ''));
                        mdl.indexpagesls.push({
                            x: x,
                            y: y,
                            topage: pageNum,
                            viewport: page.getViewport({ scale: 1 }),
                            height: k.height,
                            width: k.width,
                            startpg: parseInt(pgs ? pgs : 0),
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error on getTextContent index', error);
        }

        page.cleanup();
        return Promise.resolve();
    }

    private async applyInternalLink(pdfDoc, annotations, mdl, cb) {
        // const firstPDFDATA = await fs.readFileSync(this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf');
        // const firstPDF = await PDFDocument.load(firstPDFDATA, { ignoreEncryption: true });
        // const pageCount = firstPDF.getPageCount();
        const pagelist = pdfDoc.getPages();

        const appendAnnotationsToPage = (page, newAnnotations) => {
            const existingAnnotations = page.node.get(PDFName.of('Annots'));

            if (existingAnnotations instanceof PDFArray) {
                newAnnotations.forEach(annotation => {
                    existingAnnotations.push(annotation);
                });
            } else {
                page.node.set(PDFName.of('Annots'), pdfDoc.context.obj(newAnnotations));
            }
        };
        const updatePageExistingAnnotation = (objs) => {
            objs['Type'] = 'Annot';
            const borderColor = new Uint8ClampedArray(objs.borderColor);
            const color = new Uint8ClampedArray(objs.borderColor);
            if (objs.dest) {
                return pdfDoc.context.register(
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: objs.rect,
                        Border: Array.from(borderColor),
                        C: Array.from(color),
                        Dest: objs.dest,
                    }),
                );
            } else if (objs.url) {
                return pdfDoc.context.register(
                    pdfDoc.context.obj({
                        Type: 'Annot',
                        Subtype: 'Link',
                        Rect: objs.rect,
                        Border: Array.from(borderColor),
                        C: Array.from(color),
                        Url: objs.url,
                    }),
                );
            }
        };

        const createPageLinkAnnotation = (pageRef, viewport, x, y, mn) =>
            pdfDoc.context.register(
                pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: [x, y - mn.height, x + mn.width, y - mn.height + mn.height * 2],
                    Border: [0, 0, 2],
                    C: [0, 0, 1],
                    Dest: [pageRef, 'XYZ', null, null, null],
                }),
            );

        mdl.internallinks = [];
        if (mdl.factsheets_array && mdl.factsheets_array.length) {
            for (const ls of mdl.factsheets_array) {
                if (ls.startpg && pagelist.length >= ls.startpg) {
                    if (ls.positions && ls.positions.length) {
                        for (const mn of ls.positions) {
                            if (mn.x) {
                                const link = createPageLinkAnnotation(pagelist[ls.startpg - 1].ref, mn.viewport, mn.x, mn.y, mn);
                                const linkarray = [link];
                                appendAnnotationsToPage(pagelist[mn.topage - 1], linkarray);
                            }
                        }
                    }
                }
            }
        }

        if (annotations && annotations.length) {
            for (const mn of annotations) {
                const linkarray = [];
                for (const item of mn.annotation) {
                    linkarray.push(updatePageExistingAnnotation(item));
                }
                appendAnnotationsToPage(pagelist[mn.page - 1], linkarray);
            }
        }

        cb(true);
    }

    private async cleanupFiles(folder) {
        try {
            const folderPath = path.join(this.FILEPATH, 'export', folder);

            const files = await fs.readdirSync(folderPath);
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                if (file !== 'modified.pdf') {
                    await fs.unlinkSync(filePath);
                }
            }
        } catch (error) {
            this.logService.error(`Error in readContent ${JSON.stringify(error)} `, this.logApp);
        }
    }


    // ... (other helper methods)


    getPages(val) {
        var ary = [];
        var fnl = [];
        if (val) {
            try {
                var subar = val.split(',');
                for (let x of subar) {
                    if (x.includes('-')) {
                        var sbArray = Array.from({ length: parseInt(x.split('-')[1]) - parseInt(x.split('-')[0]) + 1 }, (v, k) => k + parseInt(x.split('-')[0]));
                        ary = ary.concat(sbArray);
                    } else {
                        ary.push(parseInt(x));
                    }
                }
                for (let y of ary) {
                    if (fnl.findIndex(a => a == y) == -1) {
                        fnl.push(y);
                    }
                }
            } catch (error) {
            }
        }
        return fnl;
    }

    getPageno(pg) {
        try {
            if (pg) {
                if (pg.includes('-')) {
                    return pg.split('-')[0];
                } else if (pg.split(',')) {
                    return pg.split(',')[0];
                } else {
                    return pg;
                }
            }
        } catch (error) {
        }
        return 0;
    }
    getUserinit(x) {
        try {
            var f1 = '';
            var f2 = '';
            if (x.cFname && x.cFname != '') {
                f1 = x.cFname.substring(0, 1).toUpperCase()
            }
            if (x.cLname && x.cLname != '') {
                f2 = x.cLname.substring(0, 1).toUpperCase()
            }

            return f1 + f2;
        } catch (error) {
            return '';
        }
    }



    genlinkpage(item: any) {
        let pages = [];
        if (item.jLinktype) {
            if (item.jLinktype?.type == 'H' || item.jLinktype?.mode == 'H') {

                item.jLinktype.pages.forEach(page => {
                    pages.push({
                        text: page,
                        linkToPage: page,
                        style: 'tableRowEven',
                        color: '#ff3d00', "decoration": "underline",
                        destination: { fit: true }
                    })
                    if (item.jLinktype.pages.length > 1 && item.jLinktype.pages.indexOf(page) < item.jLinktype.pages.length - 1) {
                        pages.push({
                            text: ',',
                        })
                    }
                });
            }
            else {
                pages.push({
                    text: item.jLinktype.start + '–' + item.jLinktype.end,
                    linkToPage: item.jLinktype.start,
                    style: 'tableRowEven',
                    color: '#ff3d00', "decoration": "underline",
                    destination: { fit: true }
                })
            }
        }
        else {
            pages.push({
                text: item.cPage,
                linkToPage: this.getPageno(item.cPage),
                style: 'tableRowEven',
                color: '#ff3d00', "decoration": "underline",
                destination: { fit: true }
            })
        }
        return pages;
    }



    getlinkdocs(files: any) {
        let content = [];
        if (files.length) {
            files.forEach(item => {
                content.push({
                    text: [`[ ${(item.cTab ? item.cTab : '-')} | ${item.cBundletag ? item.cBundletag :
                        '–'} | `, {
                        text: this.genlinkpage(item),
                        style: 'tableRowEven',
                        color: '#ff3d00', "decoration": "underline"
                    }, ` ]`],
                    style: 'tableRowEven',
                    fontSize: 9,
                    alignment: 'left',
                    margin: [0, 3, 0, 3]
                })
                content.push({
                    text: `Exhibit No. ${item.cExhibitno ? item.cExhibitno : ''}`,
                    fontSize: 9,
                    style: 'tableRowEven',
                })
            });
        }
        return content;
    }




}