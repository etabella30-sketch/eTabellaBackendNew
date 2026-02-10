import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { UtilityService } from '../../utility/utility.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { batchColumnReq, batchDwdpathReq, batchLogDetailReq, batchLogReq, batchLogRes, batchUploadReq, batchdownloadReq, batchdownloadRes } from '../../interfaces/batch.interface';
import * as path from 'path';
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
const XLSX = require('xlsx');
@Injectable()
export class BatchService {

    filepath: string = this.config.get<string>('ASSETS'); // './assets/'; // Path to save the generated Excel file

    private readonly logApp: string = 'batchFile';
    constructor(private db: DbService, private readonly utility: UtilityService, private readonly logService: LogService,
        private rds: RedisDbService,
        @InjectQueue('batchfile-download') private taskQueue: Queue, private config: ConfigService
    ) {

    }

    async getfiledata(body: batchdownloadReq): Promise<batchdownloadRes> {
        // body["ref"] = 2;
        console.log('Creating batch file', body)
        this.logService.info(`Fatch file Request for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        this.logService.info(`Request for get Data  case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        await this.rds.setValue(`batch_download:${body.nMasterid}:${body.nCaseid}`, JSON.stringify({ nSectionid: body.nSectionid, cBundleids: body.cBundleids, cFilename: body.cFilename, column: body.column }), 24 * 3600);
        this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
        this.logService.info(`Added in queue successfully`, this.logApp)
        return { msg: 1, value: 'Batch File in process ' };
        return;
        this.db.executeRef('batchfile_getdata', body).then(async (res) => {
            try {
                if (res.success) {
                    this.logService.info(`GetData reponce success add in queue case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                    const obj = {
                        "data": res.data[0],
                        "filename": body.cFilename,
                        column: body.column,
                        nCaseid: body.nCaseid,
                        nMasterid: body.nMasterid
                    }
                    // console.log('getfiledata', res.data);
                    this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
                    await this.taskQueue.add('process-task', obj);
                    this.logService.info(`Added in queue successfully`, this.logApp)
                    return { msg: 1, value: 'Batch File in process' };
                } else {
                    this.logService.error(`Batch creation failed with error ${JSON.stringify(res?.error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
                    this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    return { msg: -1, value: 'Failed to fetch', error: res?.error }
                }
            } catch (error) {
                this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
                this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                return { msg: -1, value: 'Failed to fetch', error: error }
            }
        }, (error) => {
            this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
            this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
            return { msg: -1, value: 'Failed to fetch data', error: error };
        })
        this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'FD', message: 'Fatching data. Please wait...' } });
        return { msg: 1, value: 'Batch file generating' }
    }

    async getFilecolumn(body: batchColumnReq): Promise<batchdownloadRes> {
        let res = await this.db.executeRef('batchfile_columns', body)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res?.error }
        }
    }

    async getUploadedFileCols(query: batchDwdpathReq): Promise<batchdownloadRes> {
        const filename: string = query.cPath;
        const filePath = path.join(this.filepath, filename);
        let res: batchdownloadRes = await this.uploadFileCols(filePath);
        try {
            return res;
        } catch (e) {
            return { msg: -1, value: 'Failed to fetch', error: e }
        }
    }


    async uploadfiledata(body: batchUploadReq): Promise<batchdownloadRes> {
        let path = this.filepath + body.cPath;
        try {

            this.logService.info(`Fatch file upload request Request File path is ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            this.logService.info(`Read excel file from path ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            let res: batchdownloadRes = await this.readExceldata(path);
            this.logService.info(`Read excel file success`, this.logApp);
            if (res && res["data"] && res["data"].length > 0) {
                body["filedata"] = JSON.stringify(res["data"]);
                this.logService.info(`Ready to update in table`, this.logApp);
                let res2 = await this.db.executeRef('batchfile_update', body)
                try {
                    if (res2.success) {
                        this.logService.info(`Data updated to file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                        return { msg: 1, value: 'Batch file uploaded' }
                    } else {
                        this.logService.info(`Data updation failed to file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                        return { msg: -1, value: 'Failed to upload', error: res2.error }
                    }
                } catch (error) {
                    this.logService.error(`Error in database file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} \n error: ${error} `, this.logApp);
                    return { msg: -1, value: 'Failed to upload', error: res2.error }
                }
            } else {
                this.logService.info(`No data found in file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} `, this.logApp);
                return { msg: -1, value: 'Failed to upload', error: 'No data found' }
            }
        } catch (error) {
            this.logService.error(`Error in while reading file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} \n error: ${error} `, this.logApp);
            return { msg: -1, value: 'Failed to upload', error: error }
        }


        let res = await this.db.executeRef('batchfile_upload', body)
        try {
            if (res.success) {
                return { msg: 1, value: 'Batch file uploaded' }
            } else {
                return { msg: -1, value: 'Failed to upload', error: res.error }
            }
        } catch (e) {
            return { msg: -1, value: 'Failed to upload', error: res.error }
        }
    }


    downloadFile(query: batchDwdpathReq, res: any) {
        console.log('Download batch file req', query)
        const fileuri: string = query.cPath;
        const filePath = path.join(this.filepath, fileuri);
        this.logService.info(`Download file by user ${query.nMasterid}`, this.logApp);
        res.download(filePath, fileuri, (err) => {
            if (err) {
                this.logService.info(`Error while download file ${err}`, this.logApp);
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        });
    }



    async uploadFileCols(file): Promise<batchdownloadRes> {
        const workbook = XLSX.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const headers = this.getHeaders(worksheet);
        return { msg: 1, data: headers };
    }

    private getHeaders(worksheet): string[] {
        const headers = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const firstRow = range.s.r;
        for (let col = range.s.c; col <= range.e.c; ++col) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: firstRow, c: col })];
            const header = cell ? cell.v : `UNKNOWN ${col}`;
            headers.push(header);
        }
        return headers;
    }

    async readExceldata(path): Promise<any> {
        try {
            const workbook = XLSX.readFile(path);
            const firstWorksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstWorksheetName];
            // Parse the worksheet to get an array of objects.
            // Each object corresponds to a row in the Excel file.
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            for (let x of jsonData.filter(e => e["Date"] && e["Date"] != '')) {
                x["Date"] = this.parseDate(x["Date"]);
            }
            return { data: jsonData };
        } catch (error) {
            console.error('readExceldata', error)
            this.logService.error(`Error while read excel file ${path} : ${error}`, this.logApp);
            return { data: null }
        }
    }

    parseDate(input: string | number) {
        // Check if the input is already in a date format (dd-mm-yyyy or yyyy-mm-dd)
        if (typeof input === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(input)) {
            return input; // Already in date format, return as is
        }

        if (typeof input === 'number' && input > 1900 && input < 9999) {
            return input.toString(); // Return the year as a string
        }

        // Check if the input is a simple year (like 2023)
        // if (typeof input === 'number' && (/^\d{4}$/.test(input) && Number(input) > 1900)) {
        //     console.log('step 1', input);
        //     return input.toString(); // Return the year as a string
        // }

        // If the input is in Excel serial number format, convert it to a date
        if (typeof input === 'number') {
            const jsDate = new Date((input - (25567 + 2)) * 86400 * 1000);
            const day = String(jsDate.getDate()).padStart(2, '0');
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const year = jsDate.getFullYear();

            // Return the date in dd-mm-yyyy format
            return `${day}-${month}-${year}`;
        }

        // Fallback to return the input as is for any other cases
        return input;
    }



    async getBatchlog(body: batchLogReq): Promise<batchLogRes> {
        let res = await this.db.executeRef('batchfile_log_summery', body)
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getBatchlogDetail(body: batchLogDetailReq): Promise<any> {
        body["ref"] = 3;
        let res = await this.db.executeRef('batchfile_log_detail', body)
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

}
