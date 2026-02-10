import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { batchdownloadRes } from '../interfaces/batch.interface';
import { UtilityService } from '../utility/utility.service';
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as pathModule from 'path'; // Import path module to handle paths
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
const { spawn } = require("child_process");
import * as crypto from 'crypto';
const CHUNK_SIZE = 1000;
const filepath: string = './assets/'; // Path to save the generated Excel file

@Processor('batchfile-download')
export class QueueProcessor {
    private readonly logApp: string = 'batchFile';
    private readonly pythonScriptPath: string = this.config.get<string>('BATCHFILE');
    private readonly tempDir: string = this.config.get<string>('TMP_PATH');
    constructor(private utility: UtilityService, private readonly logService: LogService, private config: ConfigService) { }
    @Process('process-task')
    async handleTask(job: Job) {
        try {
            await new Promise<void>(async (resolve, reject) => {

                this.logService.info(`Start batch process in queue for case ${job.data.nCaseid} by user ${job.data.nMasterid}`, this.logApp);

                this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: job.data.nMasterid, type: 'A', message: 'Creating batch file. Please wait...' } });
                const path = 'doc/case' + job.data.nCaseid + '/' + job.data.filename;

                this.logService.info(`Creating excel to data`, this.logApp);
                await this.createExcelFile(job.data.data, (filepath + path), job.data.column);

                this.logService.info(`Batch file created successfully for case ${job.data.nCaseid} by user ${job.data.nMasterid}`, this.logApp);
                try {
                    this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: job.data.nMasterid, data: { path: path, name: job.data.filename }, type: 'C', message: 'Batch file created. Prepare for download' } });
                } catch (error) {
                }
                resolve();
            })
            console.log('Task processed');
        } catch (error) {
            this.logService.error(`Error while creating batch file ${error}`, this.logApp);
            console.log('Task error', error);
        }
    }


    async generateData(data: any, column: string): Promise<any> {
        try {
            this.logService.info(`Generate excel file data`, this.logApp);
            const bundle = [];
            const columns = JSON.parse(`[${column}]`);
            const length = columns.length;
            columns.splice(0, 0, ['ID', 'nBundledetailid'])
            bundle.push(columns.map(e => e[0]));
            data.forEach(element => {
                bundle.push(columns.map(e => element[e[1]]));
            });
            this.logService.info(`File data Generating successfull`, this.logApp);
            return [bundle, length];
        } catch (error) {
            this.logService.info(`Error while generating excel file data`, this.logApp);
            console.log('error', error);
        }
    }



    async createExcelFile_old(bundle, path, column): Promise<batchdownloadRes> {
        console.log('Step 2', column);
        const [data, length] = await this.generateData(bundle, column);

        try {
            const ws = XLSX.utils.aoa_to_sheet(data);
            var margearray = [];
            let row = 1;
            while (true) {
                var cellAddress = `C${row}`;
                var cell = ws[cellAddress];
                var cellAddress2 = `G${row}`;
                var cell2 = ws[cellAddress2];
                if (!cell && !cell2) break;
                if (cell && cell.t && cell.t !== 'd') {
                    // const dateParts = cell.v.split('-');
                    // cell.v = new Date(+dateParts[0], +dateParts[1] - 1, +dateParts[2]);
                    // cell.t = 'd';
                    // cell.z = XLSX.SSF.get_table()[14];  // Standard date format
                }

                if (cell2 && cell2.t && cell2.t !== 's' && cell2.v !== '') {
                    cell2.t = 's';
                }
                row++;
            }
            for (let key of Object.keys(ws).filter(e => (e).includes('A'))) {
                if (!ws[key]["v"]) {
                    var ind = Object.keys(ws).filter(e => (e).includes('A')).findIndex(e => e == key);
                    var boldkey = Object.keys(ws).filter(e => (e).includes('B'))[ind]
                    margearray.push({ s: { r: ind, c: 1 }, e: { r: ind, c: length } })
                }
            }


            ws['!merges'] = margearray;
            const wb = {
                SheetNames: ["Sheet1"],
                Sheets: {
                    Sheet1: ws
                }
            };

            const directory = pathModule.dirname(path);
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true }); // Create the directory recursively
            }
            this.logService.info(`Excel ready to save.`, this.logApp);
            XLSX.writeFile(wb, path);
            this.logService.info(`File saved successfully.`, this.logApp);
            // console.log('File saved', path);
            return { msg: 1, value: 'Batch File in process success' }
        } catch (error) {
            // console.log('error', error);
            this.logService.error(`Error while creating excel : ${error}`, this.logApp);
            return { msg: -1, value: 'Batch File in process failed', error: error }
        }
    }

    private async writeDataInChunks(data: any[], filePath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(filePath);
            let index = 0;

            const writeNextChunk = () => {
                let hasMore = false;

                while (index < data.length) {
                    const chunk = JSON.stringify(data[index]) + '\n';
                    index++;

                    if (!writeStream.write(chunk)) {
                        hasMore = true;
                        break;
                    }
                }

                if (index >= data.length) {
                    writeStream.end();
                } else if (hasMore) {
                    writeStream.once('drain', writeNextChunk);
                }
            };

            writeStream.on('finish', resolve);
            writeStream.on('error', reject);

            writeNextChunk();
        });
    }

    private async cleanupTempFile(tempFilePath: string): Promise<void> {
        try {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        } catch (error) {
            this.logService.error(`Error cleaning up temp file: ${error}`, this.logApp);
        }
    }

    private generateTempFilename(): string {
        return pathModule.join(this.tempDir, crypto.randomBytes(16).toString('hex') + '.jsonl');
    }

    async createExcelFile(data: any, path: string, column: string): Promise<batchdownloadRes> {
        return new Promise(async (resolve, reject) => {
            const tempFilePath = this.generateTempFilename();

            try {
                // Write data to temp file in chunks
                await this.writeDataInChunks(data, tempFilePath);

                const pythonProcess = spawn('python', [
                    this.pythonScriptPath,
                    tempFilePath,
                    path,
                    column,
                    CHUNK_SIZE.toString()
                ]);

                let resultData = '';
                let errorData = '';

                pythonProcess.stdout.on('data', (data) => {
                    resultData += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                    this.logService.error(`Python Error: ${data}`, this.logApp);
                });

                pythonProcess.on('close', async (code) => {
                    await this.cleanupTempFile(tempFilePath);

                    if (code !== 0) {
                        this.logService.error(`Python process exited with code ${code}`, this.logApp);
                        resolve({
                            msg: -1,
                            value: 'Batch File in process failed',
                            error: errorData
                        });
                        return;
                    }

                    try {
                        const result = JSON.parse(resultData);
                        resolve(result);
                    } catch (error) {
                        resolve({
                            msg: -1,
                            value: 'Failed to parse Python output',
                            error: error.message
                        });
                    }
                });

            } catch (error) {
                await this.cleanupTempFile(tempFilePath);
                this.logService.error(`Error while creating excel: ${error}`, this.logApp);
                resolve({
                    msg: -1,
                    value: 'Batch File in process failed',
                    error: error
                });
            }
        });
    }

}