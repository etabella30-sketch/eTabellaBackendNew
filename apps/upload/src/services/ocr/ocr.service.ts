import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { promises as fs, readFileSync as readFileSync, unlinkSync, writeFileSync as writeFileSync, existsSync, mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';

import { spawn } from 'child_process';
import { resolve } from 'path';
import { UtilityService } from '../utility/utility.service';
import { VerifypdfService } from '../verifypdf/verifypdf.service';
import { UpdatefileinfoService } from '../updatefileinfo/updatefileinfo.service';
import { delay } from 'rxjs';
import { FileValidateResponse } from '../../interfaces/chunk.interface';
import { Injectable } from '@nestjs/common';
import { replaceMDL } from 'apps/coreapi/src/interfaces/upload.interface';
import { fileOcrReq, updateConvertNativeFileReq } from '../../interfaces/convert.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
// import * as AWS from 'aws-sdk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

@Injectable()
export class OcrService {
    // spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));  // e.g. 'nyc3.digitaloceanspaces.com'
    // s3 = new AWS.S3({
    //     endpoint: this.spacesEndpoint,
    //     accessKeyId: this.config.get('DO_SPACES_KEY'),  // Your DigitalOcean Spaces Access Key
    //     secretAccessKey: this.config.get('DO_SPACES_SECRET'),  // Your DigitalOcean Spaces Secret Key
    //     region: 'sgp1', // Set your region
    //     signatureVersion: 'v4',
    // });


    private readonly s3Client: S3Client;
    private readonly ocrFilePath: string = this.config.get('PY_OCR');
    private readonly ocrQueuePath: string = this.config.get('PY_OCR_QUEUE');

    pythonV = this.config.get('pythonV')

    constructor(
        private readonly db: DbService,
        private readonly utility: UtilityService,
        private readonly config: ConfigService,
        private readonly fileVerificationService: VerifypdfService,
        private readonly fileInfo: UpdatefileinfoService,
        private readonly logService: LogService,
        @InjectQueue('filecopy-process') private fileCopyQueue: Queue,
        @InjectQueue('fileocr-process') private fileocrQueue: Queue,
    ) {

        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.config.get('DO_SPACES_ENDPOINT'), // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            forcePathStyle: this.config.get('DO_S3') == 'MINIO' // Required for MinIO
        });
    }



    async OCRFile(item: any, jobDetail: any): Promise<boolean> {
        try {
            if (jobDetail && jobDetail.bIsocr) {
                let data = Object.assign(item, jobDetail)
                let res = await this.fileOcr(data);
                if (res.msg == 1) {
                    return true;
                } else {
                    false
                }
            }
        } catch (error) {
            console.error('Error ocr file:', error);
            return false;
        }
    }

    async ocrQueue(data) {
        await this.fileocrQueue.add({ cPath: data.cPath, data: data, nBundledetailid: data.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
    }



    async downloadFileToDisk(
        bucketName: string,
        fileKey: string,
        resolvedPath: string,
    ): Promise<boolean> {
        try {

            // Fetch the file from S3
            const command = new GetObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
            });

            const response = await this.s3Client.send(command);

            if (!response.Body) {
                console.error('File body is empty');
                return false;
            }

            // Convert the stream to a buffer
            const streamToBuffer = (stream: Readable): Promise<Buffer> => {
                return new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };

            const buffer = await streamToBuffer(response.Body as Readable);

            // Ensure the folder exists before writing the file
            const folderPath = resolve(resolvedPath, '..');
            if (!existsSync(folderPath)) {
                mkdirSync(folderPath, { recursive: true });
            }

            // Write the file to the specified path
            console.log('File write:', resolvedPath);
            writeFileSync(resolvedPath, buffer);
            console.log('File write success:', resolvedPath);

            return true;
        } catch (error) {
            console.error('Error downloading file to disk:', error.message);
            return false;
        }
    }


    /*
        async downloadFileToDisk(
            bucketName: string,
            fileKey: string,
            resolvedPath: string,
        ): Promise<boolean> {
            try {
                // Fetch the file from S3
                const params: AWS.S3.GetObjectRequest = {
                    Bucket: bucketName,
                    Key: fileKey,
                };
    
                const data: any = await this.s3.getObject(params).promise();
    
                if (!data.Body) {
                    return false;
                }
    
    
                // Ensure the folder exists before writing the file
                const folderPath = resolve(resolvedPath, '..');
                if (!existsSync(folderPath)) {
                    mkdirSync(folderPath, { recursive: true });
                }
    
                // Write the file to the specified folder
                // const filePath = resolve(resolvedPath, fileKey.split('/').pop());
                console.log('File write', resolvedPath)
                writeFileSync(resolvedPath, data.Body);
                console.log('File write success', resolvedPath)
                return true;
            } catch (error) {
                console.log('error', error)
                return false;
            }
        }
    
    */
    async fileOcr(body: fileOcrReq): Promise<any> {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            let data = res.data[0][0];
            data.nMasterid = body.nMasterid;
            data.identifier = body.nBundledetailid;
            data.nOcrtype = body.nOcrtype;
            await this.fileocrQueue.add({ cPath: data.cPath, data: data, nBundledetailid: data.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            return;
            data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
            data.filetype = data.cPath.split('.').pop();

            const outputPath = resolve(this.config.get('ASSETS'), data.cPath);
            let result = await this.downloadFileToDisk('etabella', data.cPath, outputPath);
            console.log('Download result', result)
            if (!result) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return;
            }
            // console.log('Processing ocr job:', data);
            let success = await this.FileOCR({ data: data });
            if (success) {
                this.utility.emit({ event: 'VERIFY-START', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid } });

                const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);
                console.log('Verification complete:', verificationResult);

                this.utility.emit({ event: 'VERIFY-SUCCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'VS' } });
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
                    nBundledetailid: data.nBundledetailid,
                    cFiletype: 'PDF',
                    isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                    cPath: data.cPath,
                    cFilesize: fileSize.toString(),
                    nPagerotation: verificationResult.pagerotation,
                    cPage: `1-${verificationResult.totalpages}`,
                    bisTranscript: false
                };

                let res = await this.db.executeRef('upload_update_convertinfo', fileInfo);
                if (res.success) {
                    await this.fileCopyQueue.add({ cPath: data.cPath }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
                }

                return {
                    msg: 1

                };
            }
            return { msg: 1 };
        } else {
            return { msg: -1, value: 'Failed to convert', error: res.error }
        }
    }


    async FileOCR(job) {
        try {
            const { identifier, nMasterid, filetype, name, cFilename } = job.data;
            console.log('Step 2:', job.data);
            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = resolve(this.config.get('ASSETS'), input);
            const outputPath = resolve(this.config.get('ASSETS'), output);

            if (!await this.fileExists(inputPath)) {
                console.error('File not found:', inputPath);
                // this.ocrToPDFFailed(job.data.nUDid ? job.data.nUDid : null, identifier, job);
                return false;

            }

            // console.log('ocr file:', inputPath, outputPath);
            delay(1000);

            this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
            const ocrResult = await this.ocrToPdf(inputPath, outputPath, job.data.nOcrtype, identifier, nMasterid, cFilename, 'file_' + identifier);

            if (!ocrResult) {
                return false;
            }

            this.utility.emit({ event: 'OCR-SUCCESS', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
            console.log('File has been ocr successfully');
            return true;
        } catch (error) {
            console.error('Error processing ocr job:', error);
            return false;
        }
    }


    async ocrToPDFFailed(nUDid, identifier, job) {
        console.log('OCR failed');
        let mdl: replaceMDL = { nUDid: nUDid, cStatus: 'OF', nMasterid: job.data.nMasterid, cName: job.data.name, cSize: job.data.size, cType: job.data.filetype };
        await this.fileInfo.replaceFIleDetail(mdl);
        this.utility.emit({ event: 'OCR-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
    }


    phrases = ['Scanning contents', 'Linearizing', 'PDF/A conversion', 'Deflating JPEGs', 'OCR', 'Recompressing JPEGs'];

    handleData(resulttype, data, identifier, nMasterid, utility, cFilename) {
        try {
            const dataString = data.toString().trim();
            // console.log('dataString', this.phrases.some(phrase => dataString.includes(phrase)));
            if (this.phrases.some(phrase => dataString.trim().includes(phrase))) {
                resulttype = this.phrases.find(phrase => dataString.includes(phrase));
            }
            // console.log('resulttype', resulttype);
            const trimmedData = dataString.trim();
            if (resulttype && trimmedData.match(/\d+%/)) {
                // console.log('OCR Progress:', trimmedData);
                let text = trimmedData.replace(/ {2}/g, ' ').replace(/[---━]+/g, ' ');
                if (!text.includes(resulttype)) {
                    text = resulttype + ' ' + text;
                }
                text = text.split(`\r`)[0];
                const splitStrings = text.split('\t');
                const lastString = splitStrings[splitStrings.length - 1];
                utility.emit({ event: 'OCR-PROGRESS', data: { identifier, nMasterid, message: lastString, filename: cFilename } });
            }
            return resulttype;
        } catch (error) {
        }
    }


    ocrToPdf(inputFile: string, outputFile: string, sharp_image, identifier: string, nMasterid: string, cFilename: string, nUPid: string): Promise<boolean> {

        this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
        console.log('Input parms', inputFile, outputFile, sharp_image, identifier, nMasterid, cFilename, nUPid)
        return new Promise((resolve, reject) => {
            let resulttype;
            const pythonProcess = spawn(this.pythonV, [this.ocrFilePath, inputFile, outputFile, sharp_image, `upload/${nUPid}/${identifier}`], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    TMP_PATH: this.config.get('TMP_PATH')
                }
            });

            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log('STDOUT:', message);
                resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility, cFilename);
            });

            pythonProcess.stderr.on('data', async (data) => {
                console.error('STDERR:', data.toString());
                resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility, cFilename);
            });

            pythonProcess.on('close', (code) => {
                this.logService.info(`Task processed - ocr close ${inputFile} to ${outputFile} code ${code}`, `upload/${nUPid}/${identifier}`);
                if (code === 0) {
                    resolve(true);
                } else {
                    resolve(false);
                    // reject(new Error(`Python process exited with code ${code}`));
                }
            });

            pythonProcess.on('error', (error) => {
                this.logService.info(`Task processed - ocr error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
                resolve(false);
                // reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }



    async OCRPDFFile(jsonData: any[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let resulttype;
            let identifier = jsonData[0][4];
            let nMasterid = jsonData[0][5];
            this.utility.emit({ event: 'OCR-START', data: { identifier: identifier, nMasterid: nMasterid, filename: jsonData[0][6] } });
            // console.log('Start file', new Date().toISOString(), jsonData);
            // console.log('Start file', new Date().toISOString());
            // console.log('ocrQueuePath', this.ocrQueuePath);

            let pythonProcess = spawn(this.pythonV, [this.ocrQueuePath, JSON.stringify(jsonData)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    TMP_PATH: this.config.get('TMP_PATH')
                }
            });
            // processData = [0, true]

            pythonProcess.stdout.on("data", (data) => {
                // console.log('stdout', data.toString().trim());
                if (data.toString().trim().match(/\d+%/)) {
                    data = data.toString().trim();
                    let id: number = data.split(' ')[0];
                    if (jsonData.find(x => x[3] == id)) {
                        if (data.toString().trim().includes(id)) {
                            let ind = jsonData.findIndex(x => x[3] == id)
                            let res = data.toString().trim().split(id)[1];
                            // console.log('res', resulttype, res, identifier, nMasterid, this.utility, jsonData[ind][6]);
                            resulttype = this.handleData(resulttype, res, identifier, nMasterid, this.utility, jsonData[ind][6]);
                        }
                    }
                }
            });

            // this.utility.emit({ event: 'OCR-START', data: { identifier: identifier, nMasterid: nMasterid, filename: jsonData[0][6] } });

            pythonProcess.stderr.on("data", (data) => {
                // console.error(`stderr: ${data.toString().trim()}`);
                // reject(new Error(`Python script error: ${data}`));
            });

            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    console.log('End file', new Date().toISOString());
                    resolve(true);
                } else {
                    console.log('Python script failed with code', code);
                    // reject(new Error(`Python script failed with code ${code}`));
                    resolve(false);
                }
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
