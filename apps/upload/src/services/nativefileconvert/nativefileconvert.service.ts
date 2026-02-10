import { Injectable } from '@nestjs/common';
import { fileConvertReq, updateConvertNativeFileReq } from '../../interfaces/convert.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { VerifypdfService } from '../verifypdf/verifypdf.service';
import { ConfigService } from '@nestjs/config';

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import { resolve } from 'path';
import { FileValidateResponse } from '../../interfaces/chunk.interface';
import { UtilityService } from '../utility/utility.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class NativefileconvertService {
    private readonly convertFilePath: string = this.config.get('PY_CONVERT');
    private readonly pythonV: string = this.config.get('pythonV');

    constructor(private db: DbService,
        private readonly config: ConfigService,
        private readonly fileVerificationService: VerifypdfService,
        private readonly utility: UtilityService,
        @InjectQueue('filecopy-process') private fileCopyQueue: Queue,
    ) {

    }


    async fileConvert(body: fileConvertReq): Promise<any> {

        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            let data = res.data[0][0];
            data.nMasterid = body.nMasterid;
            data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
            data.filetype = data.cPath.split('.').pop();
            this.handleConvert(res.data[0][0]);
            return { msg: 1 };
        } else {
            return { msg: -1, value: 'Failed to convert', error: res.error }
        }
    }



    async handleConvert(data: any) {
        try {
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'P' } });
            const { filetype, name, nBundledetailid } = data;

            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = resolve(this.config.get('ASSETS'), input);
            const outputPath = resolve(this.config.get('ASSETS'), output);

            if (!await this.fileExists(inputPath)) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                console.error('File not found:', inputPath);
                return false;
            }

            console.log('Converting file:', inputPath, outputPath);
            const conversionResult = await this.convertToPdf(inputPath, outputPath, data);

            if (!conversionResult) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return false;
            }

            console.log('File has been converted successfully');

            if (!await this.fileExists(outputPath)) {
                return false;
            }

            await fs.rm(inputPath, { recursive: true });
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'V' } });
            const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);
            console.log('Verification complete:', verificationResult);

            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'VS' } });

            // Get the file size
            const stats = await fs.stat(outputPath);
            const fileSize = stats.size;


            let filename = data.cFilename;
            filename = filename.replace(/\.[^/.]+$/, '.pdf');

            const fileInfo: updateConvertNativeFileReq = {
                nMasterid: data.nMasterid,
                cFilename: filename,
                nSectionid: null,
                nBundleid: null,
                nBundledetailid: nBundledetailid,
                cFiletype: 'PDF',
                isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                cPath: output,
                cFilesize: fileSize.toString(),
                nPagerotation: verificationResult.pagerotation,
                cPage: `1-${verificationResult.totalpages}`,
                bisTranscript: false
            };


            let res = await this.db.executeRef('upload_update_convertinfo', fileInfo);
            if (res.success) {
                await this.fileCopyQueue.add({ cPath: output,nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'S', cPath: output, cFilename: filename, cFiletype: 'PDF', cPage: `1-${verificationResult.totalpages}` } });
            } else {

            }
        } catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
    }

    convertToPdf(inputFile: string, outputFile: string, filedata): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonV, [this.convertFilePath, inputFile, outputFile]);

            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log('STDOUT:', message);
                if (message.startsWith('Progress:')) {
                    console.log('Progress:', message.split(' ')[1]);
                    this.utility.emit({ event: 'CONVERTING-PROGRESS', data: { nBundledetailid: filedata.nBundledetailid, nMasterid: filedata.nMasterid, cStatus: 'I', nProgress: message.split(' ')[1] } });
                }
            });

            pythonProcess.stderr.on('data', (data) => {
                console.error('STDERR:', data.toString());
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                } else {
                    reject(new Error(`Python process exited with code ${code}`));
                }
            });

            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

}
