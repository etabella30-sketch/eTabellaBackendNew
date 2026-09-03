import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { batchdownloadRes } from '../interfaces/batch.interface';
import { UtilityService } from '../utility/utility.service';
const XLSX = require('xlsx');
import * as fs from 'fs';
import * as pathModule from 'path'; // Import path module to handle paths
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { spawn } from 'child_process';
import * as crypto from 'crypto';
const CHUNK_SIZE = 1000;
const FAILURE_CODE_PATTERN = /\[(BATCH_[A-Z0-9_]+)\]/;

@Processor('batchfile-download')
export class QueueProcessor {
    private readonly logApp: string = 'batchFile';
    private readonly pythonScriptPath: string = this.config.get<string>('BATCHFILE');
    private readonly assetsPath: string = this.config.get<string>('ASSETS') || './assets/';
    private readonly tempDir: string = this.config.get<string>('TMP_PATH') || pathModule.join(this.assetsPath, 'temp');
    private readonly pythonCommand: string = this.config.get<string>('pythonV') || 'python';
    constructor(
        private utility: UtilityService,
        private readonly logService: LogService,
        private config: ConfigService
    ) {}

    @Process('process-task')
    async handleTask(job: Job) {
        try {
            this.logService.info(`Start batch process in queue for case ${job.data.nCaseid} by user ${job.data.nMasterid}`, this.logApp);
            this.utility.emit({
                event: 'BATCH-PROGRESS',
                data: {
                    identifier: '',
                    nMasterid: job.data.nMasterid,
                    type: 'A',
                    message: 'Creating batch file. Please wait...'
                }
            });

            const filename = pathModule.basename(job.data.filename);
            const relativePath = pathModule.posix.join('doc', `case${job.data.nCaseid}`, filename);
            const outputPath = pathModule.join(this.assetsPath, ...relativePath.split('/'));

            this.logService.info(`Creating excel data`, this.logApp);
            const result = await this.createExcelFile(job.data.data, outputPath, job.data.column);
            if (Number(result?.msg) !== 1) {
                throw new Error(result?.error || result?.value || 'Batch file generation failed');
            }

            this.logService.info(`Batch file created successfully for case ${job.data.nCaseid} by user ${job.data.nMasterid}`, this.logApp);
            this.utility.emit({
                event: 'BATCH-PROGRESS',
                data: {
                    identifier: '',
                    nMasterid: job.data.nMasterid,
                    data: { path: relativePath, name: filename },
                    type: 'C',
                    message: 'Batch file created. Prepare for download'
                }
            });

            return result;
        } catch (error) {
            const errorDetail = this.getErrorDetail(error);
            const failureCode = this.getFailureCode(errorDetail);
            this.logService.error(`[${failureCode}] Error while creating batch file: ${errorDetail}`, this.logApp);
            console.error(`[batchFile][${failureCode}] ${errorDetail}`);
            this.utility.emit({
                event: 'BATCH-PROGRESS',
                data: {
                    identifier: '',
                    nMasterid: job.data.nMasterid,
                    type: 'F',
                    message: this.getUserFailureMessage(failureCode)
                }
            });
            throw error;
        }
    }

    private getErrorDetail(error: unknown): string {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }

    private getFailureCode(errorDetail: string): string {
        return errorDetail.match(FAILURE_CODE_PATTERN)?.[1] || 'BATCH_UNKNOWN';
    }

    private getUserFailureMessage(code: string): string {
        const messages: Record<string, string> = {
            BATCH_CONFIG_SCRIPT_MISSING: 'Server is missing the batch generator configuration.',
            BATCH_TEMP_PATH_INVALID: 'Server batch temporary-folder configuration is invalid.',
            BATCH_TEMP_DIR_UNWRITABLE: 'Server cannot write to the batch temporary folder.',
            BATCH_TEMP_WRITE_FAILED: 'Server could not prepare the batch data file.',
            BATCH_OUTPUT_DIR_UNWRITABLE: 'Server cannot write to the batch output folder.',
            BATCH_PYTHON_SCRIPT_NOT_FOUND: 'Server batch generator script was not found.',
            BATCH_PYTHON_SCRIPT_UNREADABLE: 'Server batch generator script is not readable.',
            BATCH_PYTHON_NOT_FOUND: 'Python is not installed or not available to the batch service.',
            BATCH_PYTHON_START_FAILED: 'Server could not start the Python batch generator.',
            BATCH_PYTHON_DEPENDENCY_MISSING: 'A required server Python package is missing.',
            BATCH_PYTHON_CONTRACT_MISMATCH: 'Server batch generator version does not match the backend version.',
            BATCH_PYTHON_EXIT: 'Server Python batch generator exited with an error.',
            BATCH_PYTHON_INVALID_OUTPUT: 'Server Python batch generator returned an invalid response.',
            BATCH_GENERATOR_FAILED: 'Server batch generator could not create the Excel file.',
            BATCH_DATA_INVALID: 'Server received invalid data for batch generation.'
        };

        return `${messages[code] || 'Batch file creation failed.'} [${code}]`;
    }

    private createFailure(code: string, detail?: unknown): batchdownloadRes {
        const errorDetail = detail === undefined ? '' : this.getErrorDetail(detail).trim().slice(0, 2000);
        return {
            msg: -1,
            value: 'Batch File in process failed',
            error: `[${code}]${errorDetail ? ` ${errorDetail}` : ''}`
        };
    }

    private classifyPythonFailure(output: string): string {
        const normalizedOutput = output.toLowerCase();
        if (normalizedOutput.includes('usage:') || normalizedOutput.includes('unrecognized arguments')) {
            return 'BATCH_PYTHON_CONTRACT_MISMATCH';
        }
        if (normalizedOutput.includes('no module named') || normalizedOutput.includes('modulenotfounderror')) {
            return 'BATCH_PYTHON_DEPENDENCY_MISSING';
        }
        return 'BATCH_PYTHON_EXIT';
    }

    async generateData(data: any, column: string): Promise<any> {
        try {
            this.logService.info(`Generate excel file data`, this.logApp);
            const bundle = [];
            const columns = JSON.parse(`[${column}]`);
            const length = columns.length;
            columns.splice(0, 0, ['ID', 'nBundledetailid']);
            bundle.push(columns.map((e) => e[0]));
            data.forEach((element) => {
                bundle.push(columns.map((e) => element[e[1]]));
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
            for (let key of Object.keys(ws).filter((e) => e.includes('A'))) {
                if (!ws[key]['v']) {
                    var ind = Object.keys(ws)
                        .filter((e) => e.includes('A'))
                        .findIndex((e) => e == key);
                    var boldkey = Object.keys(ws).filter((e) => e.includes('B'))[ind];
                    margearray.push({ s: { r: ind, c: 1 }, e: { r: ind, c: length } });
                }
            }

            ws['!merges'] = margearray;
            const wb = {
                SheetNames: ['Sheet1'],
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
            return { msg: 1, value: 'Batch File in process success' };
        } catch (error) {
            // console.log('error', error);
            this.logService.error(`Error while creating excel : ${error}`, this.logApp);
            return { msg: -1, value: 'Batch File in process failed', error: error };
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
        let tempFilePath: string;
        try {
            if (!this.pythonScriptPath) {
                return this.createFailure('BATCH_CONFIG_SCRIPT_MISSING', 'BATCHFILE is not configured');
            }
            if (process.platform !== 'win32' && /^[A-Za-z]:[\\/]/.test(this.tempDir)) {
                return this.createFailure('BATCH_TEMP_PATH_INVALID', `TMP_PATH is not valid for ${process.platform}`);
            }
            if (!Array.isArray(data)) {
                return this.createFailure('BATCH_DATA_INVALID', 'Generator data must be an array');
            }
            if (!fs.existsSync(this.pythonScriptPath)) {
                return this.createFailure('BATCH_PYTHON_SCRIPT_NOT_FOUND', this.pythonScriptPath);
            }

            try {
                await fs.promises.access(this.pythonScriptPath, fs.constants.R_OK);
            } catch (error) {
                return this.createFailure('BATCH_PYTHON_SCRIPT_UNREADABLE', error);
            }

            try {
                await fs.promises.mkdir(this.tempDir, { recursive: true });
                await fs.promises.access(this.tempDir, fs.constants.W_OK);
            } catch (error) {
                return this.createFailure('BATCH_TEMP_DIR_UNWRITABLE', error);
            }

            const outputDirectory = pathModule.dirname(path);
            try {
                await fs.promises.mkdir(outputDirectory, { recursive: true });
                await fs.promises.access(outputDirectory, fs.constants.W_OK);
            } catch (error) {
                return this.createFailure('BATCH_OUTPUT_DIR_UNWRITABLE', error);
            }

            tempFilePath = this.generateTempFilename();
            try {
                await this.writeDataInChunks(data, tempFilePath);
            } catch (error) {
                return this.createFailure('BATCH_TEMP_WRITE_FAILED', error);
            }

            return await new Promise<batchdownloadRes>((resolve) => {
                const pythonProcess = spawn(this.pythonCommand, [this.pythonScriptPath, tempFilePath, path, column, CHUNK_SIZE.toString()]);

                let resultData = '';
                let errorData = '';
                let settled = false;
                const finish = (result: batchdownloadRes) => {
                    if (!settled) {
                        settled = true;
                        resolve(result);
                    }
                };

                pythonProcess.stdout.on('data', (data) => {
                    resultData += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    errorData += data.toString();
                    this.logService.error(`Python Error: ${data}`, this.logApp);
                });

                pythonProcess.on('error', (error) => {
                    this.logService.error(`Failed to start Python process: ${error}`, this.logApp);
                    const code = (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'BATCH_PYTHON_NOT_FOUND' : 'BATCH_PYTHON_START_FAILED';
                    finish(this.createFailure(code, error));
                });

                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        const diagnosticOutput = `${errorData}\n${resultData}`.trim();
                        const failureCode = this.classifyPythonFailure(diagnosticOutput);
                        this.logService.error(`[${failureCode}] Python process exited with code ${code}: ${diagnosticOutput}`, this.logApp);
                        finish(this.createFailure(failureCode, diagnosticOutput || `Exit code ${code}`));
                        return;
                    }

                    try {
                        const result = JSON.parse(resultData);
                        if (Number(result?.msg) !== 1) {
                            finish(this.createFailure('BATCH_GENERATOR_FAILED', result?.error || result?.value));
                            return;
                        }
                        finish(result);
                    } catch (error) {
                        finish(this.createFailure('BATCH_PYTHON_INVALID_OUTPUT', `${this.getErrorDetail(error)}; output=${resultData.slice(0, 500)}`));
                    }
                });
            });
        } catch (error) {
            this.logService.error(`Error while creating excel: ${error}`, this.logApp);
            return this.createFailure('BATCH_UNKNOWN', error);
        } finally {
            if (tempFilePath) {
                await this.cleanupTempFile(tempFilePath);
            }
        }
    }
}
