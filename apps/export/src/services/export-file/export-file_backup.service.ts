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
    ExportResponse

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

@Injectable()
export class ExportFileService {
    private readonly logger = new Logger(ExportFileService.name);
    private readonly extraWidth = 100;
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


        const fonts = {
            Roboto: {
                // normal: './assets/fonts/Roboto/Roboto-Regular.ttf',
                // bold: './assets/fonts/Roboto/Roboto-Medium.ttf',
                // italics: './assets/fonts/Roboto/Roboto-Italic.ttf',
                // bolditalics: './assets/fonts/Roboto/Roboto-MediumItalic.ttf'
                normal: `${this.configService.get('ASSETS')}fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${this.configService.get('ASSETS')}fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${this.configService.get('ASSETS')}fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${this.configService.get('ASSETS')}fonts/Roboto/Roboto-MediumItalic.ttf`
            },
        };

        this.printer = new pdfMake(fonts);


    }


    async exportWithannot(body: ExportFilewithAnnot): Promise<ExportResponse> {
        try {
            this.logService.info(`Export Request ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp);
            this.logService.info(`Insert exoprting log in database for user ${body.nMasterid}`, this.logApp);
            const res = await this.db.executeRef('export_insert_data', body);
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
            const res = await this.db.executeRef('export_get_data', body);
            if (res.success) {
                this.logService.info(`Get export data success`, this.logApp);
                if (!res.data || !res.data.length || !res.data[0] || !res.data[0].length) {
                    this.logService.error(`No date found`, this.logApp);
                    return { msg: -1, value: 'No date found' };
                }
                this.logService.info(`Start export data`, this.logApp);
                await this.processExportData(res, body);
                return { msg: 1, value: 'Export in Process' };
            } else {
                this.logService.error(`Exporting failed with database error ${JSON.stringify(res?.error)}`, this.logApp);
                return { msg: -1, value: 'Exporting failed' };
            }

            // throw new Error('Failed to start export process');
        } catch (error) {
            // this.logger.error('Error in startExportProcess', error);
            this.logService.error(`Error in startExportProcess ${JSON.stringify(error)} `, this.logApp);
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }

    private async processExportData(res: any, body: ExportProcess): Promise<void> {

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
                    this.logService.info(`File added in queue`, this.logApp);
                    existingProcess.jsonData.push(...jsonData);
                }
            }
        } catch (error) {
            // this.logger.error('Error in processExportData', error);

            this.logService.error(`Error in processExportData ${JSON.stringify(error)}`, this.logApp);
            // await this.updateFinal(nExportid, body.nMasterid, 'F');
            this.exportProcess = this.exportProcess.filter(e => e.nExportid !== nExportid);
        }
    }

    private async processJsonData(jsonData: any[], nExportid: number, nMasterid: string): Promise<void> {
        for (const [index, element] of jsonData.entries()) {
            this.logService.info(`Annotation process start for file ${JSON.stringify(element)}`, this.logApp);
            await this.editFile(jsonData, index, nExportid, nMasterid, element);
            if (this.exportProcess.find(e => e.nExportid === nExportid && !e.isProcess)) {
                break;
            }
        }
    }

    async completeFile(jsonData, mdl, nMasterid, jResponce) {
        mdl.isComplete = true;
        try {
            console.log('Complete File', jsonData.length, mdl?.cStatus);
            if (jsonData.length > 0) {
                let i = jsonData.findIndex(a => !a.isComplete);
                console.log('Complete File 1', i);
                this.updateProgress(mdl.nExportid, mdl.nUserid, mdl, mdl.cStatus);
                if (i == -1) {
                    console.log('Complete File 2', mdl.cType);
                    if (mdl.cType == 'S') {// && dtl.exportlist.length > 1
                        console.log('Complete File 4', mdl.bPagination);

                        console.log('Complete File 3', jsonData.findIndex(a => a.cStatus != 'C' && a.cStatus != 'F'));
                        if (jsonData.findIndex(a => a.cStatus != 'C' && a.cStatus != 'F') == -1) {
                            console.log('MERGING')
                            this.mergePdf(jsonData, nMasterid);
                        }
                        return;
                    } else {
                        console.log('Complete File 4', mdl.bPagination);
                        if (mdl.bPagination) {
                            let newPath = mdl.finalPath.replace('.pdf', '_1.pdf');
                            let res = await this.paginationReq(mdl.finalPath, newPath)
                            if (res.status == 'ok') {
                                mdl.finalPath = newPath;
                            }
                        }
                        const body = { nEDid: mdl.nEDid, nExportid: mdl.nExportid, nUserid: mdl.nUserid, cPath: mdl.finalPath };
                        let data = await this.db.executeRef('export_file_complete', body);
                        this.emitMessage(mdl, data, mdl.finalPath, nMasterid, 100, 100);
                    }
                }
            }
        } catch (error) {

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
            console.log('MERGE-PDF 1 ', exportlist?.length)
            if (exportlist.length > 1) {
                var svPth = this.FILEPATH + 'export/ex' + exportlist[0].nExportid;

                let gsCommand = `${this.gsV} -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=${svPth}/final.pdf -dIncludeAnnotations=true -dIncludeDocRights=false`;
                // /home/etabella/apiportal/public/export/modified.pdf /home/etabella/apiportal/public/export/modified2.pdf /home/etabella/apiportal/public/export/modified3.pdf
                // gswin64c -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=final.pdf -dIncludeAnnotations=true -dIncludeDocRights=false /home/etabella/apiportal/public/export/modified.pdf /home/etabella/apiportal/public/export/modified2.pdf /home/etabella/apiportal/public/export/modified3.pdf
                console.log('MERGE-PDF 2 ', gsCommand)
                if (!fs.existsSync(svPth)) {
                    fs.mkdirSync(svPth);

                    console.log(`Directory '${svPth}' created successfully.`);
                } else {
                    console.log(`Directory '${svPth}' already exists.`);
                }
                console.log('MERGE-PDF 3 ')
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

                    this.emitMessage(exportlist[0], data, path, nMasterid, 100, 100);


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

                this.emitMessage(exportlist[0], data, exportlist[0]["finalPath"], nMasterid, 100, 100);

            }

        } catch (error) {
            console.log('Error in mergePdf', error);

        }


    }

    emitMessage(mdl, data, path, nMasterid, comp_progres, total_prog) {
        // console.log('Emit Message', mdl, data, path, nMasterid, comp_progres, total_prog);
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
        this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
    }



    private async editFile(list: any, index: number, nExportid: number, nMasterid: string, jsonData: any): Promise<void> {

        this.logService.info(`Use python file for annotaion `, this.logApp);
        this.updateProgress(nExportid, nMasterid, jsonData, 'S');
        return new Promise((resolve, reject) => {






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
                // this.logger.log(`Python stdout: ${data}`);
                console.log(data.toString().trim());
            });

            pythonProcess.stderr.on('data', (data) => {
                this.logService.error(`Python stderr: ${data.toString().trim()}`, this.logApp);
                // this.logger.error(`Python stderr: ${data}`);
                console.log(data.toString().trim());
            });

            pythonProcess.on('close', async (code) => {
                console.log('On Py Close', code);
                if (code === 0) {
                    this.logService.log(`Python script exited with code ${code}`, this.logApp);
                    jsonData['folder'] = 'ed' + jsonData.nEDid;
                    await this.startIndexing(index, nExportid, nMasterid, jsonData);

                    // this.logger.log(`Python script exited with code ${code}`);
                    await this.updateProgress(nExportid, nMasterid, jsonData, 'C');
                    await this.completeFile(list, jsonData, nMasterid, {});
                    resolve();
                } else {
                    this.logService.error(`Python script exited with code ${code}`, this.logApp);
                    await this.updateProgress(nExportid, nMasterid, jsonData, 'F');
                    // this.logger.error(`Python script exited with code ${code}`);
                    jsonData.cStatus = 'F';
                    await this.completeFile(list, jsonData, nMasterid, { code });
                    resolve();
                    // reject(new Error(`Python script failed with code ${code}`));
                }
            });
        });
    }

    private async updateProgress(nExportid: number, nMasterid: string, mdl: any, flag: string): Promise<void> {
        console.log('Update status - ', flag);
        const res = await this.db.executeRef('export_update_progress', {
            nMasterid,
            nExportid,
            nEDid: mdl.nEDid,
            cPath: mdl.cPath,
            cStatus: flag,
            isComplete: false
        });

        if (res.data && res.data.length) {
            const data = res.data[0][0];
            const obj = {
                nID: mdl.nID,
                nExportid,
                comp_progres: data.comp_progres,
                total_prog: data.total_prog,
                cType: data.cType,
                cStatus: data.cStatus,
                nCaseid: data.nCaseid,
            };
            this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
        }
    }

    // ... (other methods like startIndexing, createIndexPages, createFactsheetPdf, etc.)



    private async startIndexing(indexs: number, nExportid: number, nMasterid: string, mdl: any): Promise<void> {
        try {
            this.logService.log(`Start indexing for file `, this.logApp);
            mdl.factsheets_array = [];
            // console.log('Step 1');
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
        } catch (error) {
            this.logger.error('Error in startIndexing', error);
            throw error;
        }
        Promise.resolve();
    }

    private determineIsCover(mdl: any, indexs: number): string {
        if (mdl.cType === 'S') {
            return (mdl.isCover && indexs === 0) ? 'Y' : 'N';
        }
        this.logService.log(`Check Cover page ${mdl.isCover}`, this.logApp);
        return mdl.isCover ? 'Y' : 'N';
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

            mdl.indexpagescount = firstPDF.getPageCount();

            const mergedPDF = await PDFDocument.create();
            console.log('Step 0');
            await this.copyPagesToMergedPDF(mergedPDF, firstPDF);
            console.log('Step 0.2');
            await this.copySelectedPagesToMergedPDF(mergedPDF, secondPDF, mdl);
            console.log('Step 0.4');
            let pages = mergedPDF.getPageCount();
            await this.addFactsheetPages(mergedPDF, mdl, pages);

            await this.scalePagesAndAnnotations(mergedPDF, mdl);

            const mergedPDFData = await mergedPDF.save();
            await this.saveMergedPDF(mergedPDFData, mdl);

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

    private async loadPDF(path: string): Promise<PDFDocument> {
        const pdfData = await readFileSync(path);
        return await PDFDocument.load(pdfData, { ignoreEncryption: true });
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
        debugger
        const selectedPages = mdl.isAllpage ? pages : this.getSelectedPages(pages, mdl.jPages);
        selectedPages.forEach(page => mergedPDF.addPage(page));
        return Promise.resolve();
    }

    private getSelectedPages(pages: PDFPage[], jPages: number[]): PDFPage[] {
        // const selectedIndices = this.getPages(jPages);
        return pages.filter((_, index) => jPages.includes(index + 1));
    }

    private async addFactsheetPages(mergedPDF: PDFDocument, mdl: any, startPage: number): Promise<void> {
        if (!mdl.factsheets_array?.length) return;

        for (const item of mdl.factsheets_array) {
            const factsheetPDF = await this.loadPDF(this.FILEPATH + `export/${mdl.folder}/factsheet${item.nFSid}.pdf`);
            const factsheetPages = await mergedPDF.copyPages(factsheetPDF, factsheetPDF.getPageIndices());
            item.startpg = startPage;
            factsheetPages.forEach(page => {
                mergedPDF.addPage(page);
                startPage++;
            });
        }
        Promise.resolve();
    }

    private async scalePagesAndAnnotations(mergedPDF: PDFDocument, mdl: any): Promise<void> {
        try {
            const [fnl_width, fnl_height] = PageSizes[mdl.cSize || 'A4'];
            const pages = mergedPDF.getPages();

            pages.forEach(page => {
                const { width: pageWidth, height: pageHeight } = page.getSize();
                const { scaleX, scaleY } = this.calculateScaleFactors(pageWidth, pageHeight, fnl_width, fnl_height);

                // this.scalecontentService.scaleContent(page, scaleX, scaleY);
                page.setSize(pageWidth > pageHeight ? fnl_height : fnl_width, pageWidth > pageHeight ? fnl_width : fnl_height);
                this.scaleannotsService.scaleAnnots(page, scaleX, scaleY);
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

    async createIndexPages(mdl: any, isCover: string, path: string): Promise<any> {
        try {
            this.logService.log(`Creating index page `, this.logApp);
            const data = await this.db.executeRef('preview_document_list', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid });
            const { cUsername: username, factlinks: highlightlist, casedetail: [casedetail], factsheet: factslist } = data.data[0][0];

            const docDefinition = {
                pageSize: 'A4',
                content: [
                    this.generateCoverPage(casedetail, username),
                    ...this.generateHighlight(highlightlist),
                    // ...this.generateAppendix(factslist)
                ],
                styles: this.getDocumentStyles(),
                pageMargins: [0, 0, 0, 0]
            };

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
        } catch (error) {
            // this.logger.error('Error in createIndexPages', error);
            this.logService.error(`Error in createIndexPages ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, error };
        }
    }

    private generateCoverPage(casedetail: any, username: string): any {
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
                    }, {
                        "text": "Powered by eTabella.legal",
                        "link": "https://etabella.legal",
                        "alignment": "right",
                        "margin": [0, 0, 40, 30], // Adjust margin to place closer to the bottom right
                        "style": "linkStyle"
                    }],
                "absolutePosition": { "x": 440.28, "y": 655.89 },
                // "width": 400,
            }]
            return content
        } catch (error) {
            this.logService.error(`Error in generateCoverPage ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private generateHighlight(data: any[]): any[] {
        try {
            if (!data.length) return [];

            return [
                { text: '', pageBreak: 'after' },
                this.createIndexHeader('Annotations'),
                this.createTableHeader(),
                this.createAnnotationsTable(data)
            ];

        } catch (error) {
            this.logService.error(`Error in generateHighlight ${JSON.stringify(error)} `, this.logApp);
        }
    }

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

    private createTableHeader(): any {
        try {
            return {
                "layout": 'noBorders', // Optional: Removes borders from the table
                margin: [10, 0, 10, 10],
                "table": {
                    "widths": ['50%', '50%'], // Equal width for both columns
                    "body": [
                        [
                            { "text": "Source Doc", fontSize: 10, color: '#4f4f4f' },
                            { "text": "Destination Doc", fontSize: 10, color: '#4f4f4f' }
                        ]
                        // Add more rows as needed
                    ]
                },

            };

        } catch (error) {

            this.logService.error(`Error in createTableHeader ${JSON.stringify(error)} `, this.logApp);
        }
    }

    private createAnnotationsTable(data: any[]): any {
        try {
            let content = [];
            if (data.length) {
                content.push({
                    "layout": 'noBorders', // Optional: use this to style the table borders as needed
                    "table": {
                        "widths": ['10%', '10%', '30%', '20%', '30%'],// Adjust widths as needed
                        "body": [
                            [
                                { "text": "Page", "style": "tableHeader2", "alignment": "start", fillColor: '#c2c2c2', color: '#4f4f4f', margin: [3, 6, 6, 3] },
                                { "text": "Level", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Source Text", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "[ Bundle | Tab | Page ]", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Doc title", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' }
                            ],
                        ]
                    }, "margin": [10, 0, 10, 0]
                });
                const table1 = this.annotationsTable(data);
                if (table1) content.push(table1);
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
                                stack: [
                                    {
                                        text: item.cPage,
                                        linkToPage: this.getPageno(item.cPage),
                                        style: 'tableRowEven',
                                        color: '#ff3d00', "decoration": "underline"
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'start',
                                margin: [0, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {

                                stack: [
                                    {
                                        "image": !item.isHighlight ? `${this.configService.get('ASSETS')}icon/file.png` : `${this.configService.get('ASSETS')}icon/highlight.png`,
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
                                        text: item.text ? item.text : item.jTexts && item.jTexts.length ? this.getFacttext(item.jTexts) : '-',
                                        style: 'tableRowEven', margin: [0, 10, 0, 0]
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
                                stack: [{
                                    text: [`[ ${(item.cTab ? item.cTab : '-')} | ${item.cBundletag ? item.cBundletag :
                                        '–'} | `, {
                                        text: `${(item.jLinktype && item.jLinktype?.typ == 'P') ? item.jLinktype?.val?.frm + '–' +
                                            item.jLinktype?.val?.to : item.cPage}`,
                                        "linkToPage": this.getPageno((item.jLinktype && item.jLinktype?.typ
                                            == 'P') ? item.jLinktype?.val?.frm + '–' +
                                        item.jLinktype?.val?.to : item.cPage),
                                        style: 'tableRowEven',
                                        color: '#ff3d00', "decoration": "underline"
                                    }, ` ]`],
                                    style: 'tableRowEven',
                                    fontSize: 9,
                                    alignment: 'left',
                                    margin: [0, 3, 0, 3]
                                },

                                    , {
                                    text: `Exhibit No. ${item.cExhibitno ? item.cExhibitno : ''}`,
                                    fontSize: 9,
                                    style: 'tableRowEven',
                                }], style: 'tableRowEven', alignment: 'left',
                                margin: [0, 3, 0, 0],
                                border: [false, false, false, false],
                                borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getFilenames(item.jFiles),
                                margin: [0, 0, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#fafafa', alignment: 'left'
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
                tableRowEven: { fontSize: 10, color: '#6f6f6f', fillColor: '#fafafa' },
                tableHeader2: { fontSize: 8, margin: [0, 5, 0, 5], fillColor: '#6f6f6f' },
                tableContent: { fontSize: 10, margin: [0, 5, 0, 5] }
            };
        } catch (error) {
            this.logService.error(`Error in getDocumentStyles ${JSON.stringify(error)} `, this.logApp);
        }
    }

    async createFactsheetPdf(mdl, item, path): Promise<any> {

        let res = await this.db.executeRef('factsheet_detail', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid, nFSid: item.nFSid });

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
                pageSize: 'A4',
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

            const firstPDFDATA = await fs.readFileSync(this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf');
            const firstPDF = await PDFDocument.load(firstPDFDATA, { ignoreEncryption: true });
            const pageCount = firstPDF.getPageCount();
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
            this.updateProgress(nExportid, nMasterid, mdl, 'R');

            this.applyInternalLink(pdfDoc, annotations, mdl, (rs) => {
                this.updateProgress(nExportid, nMasterid, mdl, 'U');
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
        const firstPDFDATA = await fs.readFileSync(this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf');
        const firstPDF = await PDFDocument.load(firstPDFDATA, { ignoreEncryption: true });
        const pageCount = firstPDF.getPageCount();
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



}