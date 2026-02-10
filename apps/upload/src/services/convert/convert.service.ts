import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerifypdfService } from '../verifypdf/verifypdf.service';
import { UpdatefileinfoService } from '../updatefileinfo/updatefileinfo.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { resolve } from 'path';
import {
    promises as fs, readFileSync as readFileSync, unlinkSync, writeFileSync as writeFileSync, existsSync, mkdirSync
} from 'fs';
import { spawn } from 'child_process';


import { FileValidateResponse } from '../../interfaces/chunk.interface';
import { saveConvertFileInfoReq, saveFileInfoReq } from '../../interfaces/upload.interface';
import { UtilityService } from '../utility/utility.service';
import { filecopyService } from '../filecopy/filecopy.service';
import { convertFileMulti, EmailparseReq, FileAttachment, fileConvertReq, updateConvertNativeFileReq } from '../../interfaces/convert.interface';
import MsgReader from '../../../../../assets/libs/msglib/MsgReader';
import { decompressRTF } from '@kenjiuno/decompressrtf';
import { deEncapsulateSync } from 'rtf-stream-parser';
import * as iconvLite from 'iconv-lite';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import { LogService } from '@app/global/utility/log/log.service';
// import * as AWS from 'aws-sdk';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { EmailService } from './email/email.service';
import { error } from 'console';

@Injectable()
export class ConvertService {
    // spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));  // e.g. 'nyc3.digitaloceanspaces.com'
    // s3 = new AWS.S3({
    //     endpoint: this.spacesEndpoint,
    //     accessKeyId: this.config.get('DO_SPACES_KEY'),  // Your DigitalOcean Spaces Access Key
    //     secretAccessKey: this.config.get('DO_SPACES_SECRET'),  // Your DigitalOcean Spaces Secret Key
    //     region: 'sgp1', // Set your region
    //     signatureVersion: 'v4',
    // });

    private readonly s3Client: S3Client;
    private ports = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011',
        '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021',
        '2022', '2023', '2024', '2025', '2026'
    ]; // Array of listener ports
    private currentPortIndex = 0;

    private readonly convertFilePath: string = this.config.get('PY_CONVERT');
    private readonly pythonV: string = this.config.get('pythonV');

    saveDir = 'doc/';
    constructor(
        private readonly utility: UtilityService,
        private readonly config: ConfigService,
        private readonly fileVerificationService: VerifypdfService,
        private readonly fileInfo: UpdatefileinfoService,
        private readonly logService: LogService,
        private readonly filecopyService: filecopyService,
        private readonly emailS: EmailService,
        @InjectQueue('convert') private convertQueue: Queue,
        @InjectQueue('convert-email') private convertEmailQueue: Queue,
        @InjectQueue('delete-files') private fileDeleteQueue: Queue,
    ) {

        const startfrom = this.config.get<string>('CONVERT_START_PORT');
        const lenght = this.config.get<string>('CONVERT_PORT_LENGTH');

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






    async fileConvert(body: fileConvertReq): Promise<any> {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.nCaseid = body.nCaseid
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();
        this.handleConvert(data);
        return { msg: 1 };
    }



    async handleConvert(data: any) {
        try {

            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'P' } });
            const { filetype, name, nBundledetailid, nMasterid } = data;
            this.convertLog(nMasterid, nBundledetailid, 0, 'P');

            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = resolve(this.config.get('ASSETS'), input);
            const outputPath = resolve(this.config.get('ASSETS'), output);
            console.log('download file', inputPath)
            let result = await this.downloadFileToDisk('etabella', input, inputPath);
            console.log('Download result', result)
            if (!result) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                this.convertLog(nMasterid, nBundledetailid, 0, 'F', 'File Download Failed');
                return;
            }
            console.log('Download result', result)
            if (!await this.fileExists(inputPath)) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                this.convertLog(nMasterid, nBundledetailid, null, 'F', 'File not found');
                console.error('File not found:', inputPath);
                return false;
            }

            console.log('Converting file:', inputPath, outputPath);
            // identifier, nMasterid, cFilename, nUPid
            const conversionResult = await this.convertFile(data.nBundledetailid, inputPath, outputPath, data.nBundledetailid, data.nMasterid, data.nCaseid, { nBundledetailid, nUDid: null, cPath: data.cPath, nSectionid: data.nSectionid });

            if (!conversionResult) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return false;
            }

            console.log('File has been converted successfully');

            if (!await this.fileExists(outputPath)) {
                console.log('File not Exist at', outputPath);
                return false;
            }
            try {
                await fs.rm(inputPath, { recursive: true });
            } catch (e) { }
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


            let res = await this.fileInfo.updateConvertFileInfo(fileInfo)
            console.log('result', res);
            if (res) {
                try {
                    if (res && res['cOldpath'] && res['cOldpath'] != '') {
                        this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] })
                    }
                } catch (error) {
                    console.log('Error in fileDeleteQueue:', error)
                }
                // await this.fileCopyQueue.add({ cPath: output }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'S', cPath: output, cFilename: filename, cFiletype: 'PDF', cPage: `1-${verificationResult.totalpages}` } });
            } else {

            }
        } catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
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
        async downloadFileToDisk_old(
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


    async filedataProcess(item1, item, nBundledetailid, outputPath, output, isValidUpdate, isConvert = true) {
        // console.log()
        const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);
        // console.log('Verification completed:', verificationResult, item);


        // Get the file size
        const stats = await fs.stat(outputPath);
        const fileSize = stats.size;


        let filename = item.cFilename || item.name;
        if (isConvert) {
            filename = filename.replace(/\.[^/.]+$/, '.pdf');
        }
        const fileInfo: saveConvertFileInfoReq = {
            nMasterid: item.nUserid,
            cFilename: filename,
            nSectionid: item.nSectionid,
            nBundleid: item.nParentbundleid,
            nBundledetailid: nBundledetailid,
            cFiletype: isConvert ? 'PDF' : output.split('.').pop()?.toUpperCase(),
            isValidate: isValidUpdate ? verificationResult.isValidate ? verificationResult.isValidate : false : false,
            cPath: output,
            cFilesize: fileSize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: (item.bisTranscript ? item.bisTranscript : false),
        };

        let res = await this.fileInfo.updateConvertFileInfo(fileInfo)

        // console.log('result 2', res);
        let isComplete = false;
        if (res.msg == 1) {

            try {
                if (res && res['cOldpath'] && res['cOldpath'] != '') {
                    this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] })
                }
            } catch (error) {
                // console.log('Error in fileDeleteQueue:', error)
            }
            // console.log(res);
            item1.nNewBundledetailid = res.nBundledetailid;
            item1.cSavepath = output;
            // await this.fileCopyQueue.add({ cPath: output }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
            // if (!job.data.data.bIsocr)
            //     await this.fileService.copyFile(output);
            isComplete = true;
        } else {
            isComplete = false;
        }
    }
    async convertFile(nBundledetailid: string, inputFile: string, outputFile: string, identifier: string, nMasterid: string, nCaseid: string, filedata: any): Promise<boolean> {
        if (!(/\.(msg)$/i.test(inputFile.toLowerCase()))) {
            const res = await this.convertToPdf(inputFile, outputFile, identifier, nMasterid, filedata.cFilename, filedata.nUPid, { nBundledetailid, nUDid: filedata.nUDid });
            return res;
        }
        else {
            let res = await this.convertEmail(nCaseid, nBundledetailid, inputFile, outputFile, filedata)
            return res;
        }
    }

    async convertToPdf(inputFile: string, outputFile: string, identifier, nMasterid, cFilename, nUPid, cnvdata): Promise<boolean> {
        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'S');
        try {
            const port = await this.getNextPort();
            return new Promise((resolve, reject) => {
                const pythonProcess = spawn(this.pythonV, [this.convertFilePath, inputFile, outputFile, port, nUPid ? nUPid : identifier]);

                pythonProcess.stdout.on('data', (data) => {
                    // console.log('STDOUT:', data.toString());
                    const message = data.toString().trim();
                    console.log('STDOUT:', message);
                    if (message.startsWith('Progress:')) {
                        this.utility.emit({ event: 'CONVERTING-PROGRESS', data: { identifier, nMasterid, nCaseid: cnvdata.nCaseid, nProgress: message.split(' ')[1], filename: cFilename } });
                    }
                });

                pythonProcess.stderr.on('data', (data) => {
                    try {

                        console.error('STDERR:', data.toString());
                    } catch (error) {
                        console.error(error);
                    }
                });

                pythonProcess.on('close', (code) => {
                    this.logService.info(`Task processed - convert close ${inputFile} to ${outputFile} code ${code}`, `upload/${nUPid}/${identifier}`);
                    pythonProcess.kill('SIGKILL');
                    if (code === 0) {
                        console.log('Convert Success')
                        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'C');
                        resolve(true);
                    } else {
                        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'F');
                        console.log('Convert Failed')
                        resolve(false);
                        // reject(new Error(`Python process exited with code ${code}`));
                    }
                });

                pythonProcess.on('error', (error) => {
                    this.logService.info(`Task processed - convert error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
                    this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'F', error.toString());
                    resolve(false);
                    // reject(new Error(`Failed to start Python process: ${error.message}`));
                });
            });
        } catch (error) {

            this.logService.info(`Task processed - convert error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
            console.log('convert error', error)
            return false
        }
    }



    private getNextPort(): string {
        const port = this.ports[this.currentPortIndex];
        this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
        return port;
    }


    convertLog(nMasterid, nBundledetailid, nUDid, cStatus, cMessage = '') {
        let data = { "nMasterid": nMasterid, "nBundledetailid": nBundledetailid, "nUDid": nUDid, cStatus: cStatus };
        this.fileInfo.convertLog(data)
    }


    async convertEmail(
        nCaseid: string,
        nId: string,
        inputFile: string,
        outputFile: string,
        filedata: any
    ): Promise<boolean> {
        console.log('Step 2');

        this.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'S');
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        let dirPath = `doc/case${nCaseid}`;
        const data = { dirPath: dirPath, cPath: filedata.cPath, cOutputpath: outputFile, nId: nId, nCaseid: nCaseid, nSectionid: filedata.nSectionid, nMasterid: filedata.nMasterid };
        const result = await this.emailS.getemailparse(data, filedata.converttype);
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        return result
        // Check if parsing was successful
        // if (files && files.msg === 1) {
        //     const filename = filedata.cFilename.substring(0, filedata.cFilename.lastIndexOf('.'));
        //     try {
        //         const dirPath = ``; // `${this.upld.docPath}/case${nCaseid}/`;

        //         // Process attachments if any (Concurrently)
        //         if (files.attechments && files.attechments.length) {

        //             this.logService.info(`Task processed - convert Email add attachment ${inputFile} to ${outputFile} attechments ${files.attechments.length}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        //             console.log('Attachments:', files.attechments);

        //             // Use Promise.all to process all attachments concurrently
        //             await Promise.all(
        //                 files.attechments.map(async (attachment) => {
        //                     // console.log('Data type:', attachment.data.dataType);
        //                     if (attachment.data.dataType === 'attachment' && !attachment.data.attachmentHidden) {
        //                         // Verify the attachment file
        //                         const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(
        //                             `${this.saveDir}${attachment.cPath}`
        //                         );
        //                         // console.log('Verification complete:', verificationResult);

        //                         // Construct file information
        //                         const fileInfo: saveFileInfoReq = {
        //                             nUDid: 0,
        //                             nMasterid: filedata.nMasterid,
        //                             cFilename: `${filename}_${attachment.data.fileName}`,
        //                             nSectionid: filedata.nSectionid,
        //                             nBundleid: filedata.nBundleid,
        //                             nBundledetailid: 0,
        //                             cFiletype: attachment.cPath.split('.').pop().toUpperCase(),
        //                             isValidate: verificationResult.isValidate || false,
        //                             cPath: `${attachment.cPath}`,
        //                             cFilesize: null,
        //                             nPagerotation: verificationResult.pagerotation,
        //                             cPage: `1-${verificationResult.totalpages}`,
        //                             bisTranscript: false,
        //                         };

        //                         const fileres = await this.fileInfo.updateConvertFileInfo(fileInfo);
        //                         if (fileres.msg && fileres.msg === 1) {
        //                             await this.fileCopyQueue.add(
        //                                 { cPath: `${attachment.cPath}` },
        //                                 { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }
        //                             );
        //                         } else {
        //                             console.error('Failed to update file info for attachment:', attachment.cFilename);
        //                         }
        //                     }
        //                 })
        //             );

        //             // Handle non-attachment files
        //             files.attechments.forEach((element) => {
        //                 if (element.data.dataType !== 'attachment') {
        //                     unlinkSync(`${this.config.get('ASSETS')}/${element.cPath}`);
        //                 }
        //             });
        //         }
        //         console.log('Step 4.2')
        //         this.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'C');
        //         return true;
        //     } catch (error) {
        //         console.error('convertEmail error:', error);
        //         this.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'F', error);
        //         this.logService.info(`Task processed - convert Email error ${inputFile} to ${outputFile}  ${error}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        //         return false;
        //     }
        // } else {
        //     console.log('Step 4.3')
        //     this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier: filedata.identifier, nMasterid: filedata.nUserid, nProgress: 0, filename: filedata.cFilename } });
        //     // Return false if no files or parsing was unsuccessful
        //     return false;
        // }
    }


    async getemailparse(body: EmailparseReq): Promise<any> {
        console.log('Step 3');
        let filePath = body.cPath;
        let cOutputpath = body.cOutputpath;
        let nBid = body?.nId;
        let nCaseid = body.nCaseid;
        try {
            console.log(filePath, cOutputpath)
            // console.log('Step 3.1');
            // const fileData = await this.downloadFileFromS3(filePath);
            const fileData = readFileSync(filePath)
            const reader = new MsgReader(fileData);
            const msgData: any = reader.getFileData();

            let rtfBody = '';
            if (msgData.compressedRtf) {
                rtfBody = Buffer.from(decompressRTF(msgData.compressedRtf)).toString();
            }

            let resultText: any = '';
            if (rtfBody) {
                const result = deEncapsulateSync(rtfBody, { decode: iconvLite.decode });
                resultText = result?.text || '';
            }


            // const dirpath = `${this.saveDir}case_${nCaseid}`;

            const dirPath = `${this.saveDir}case${nCaseid}/`;
            let attechments: FileAttachment[] = [];
            try {
                attechments = await this.saveAttachment(msgData, reader, dirPath)
            } catch (error) {
                console.error(`Error saving attachments: ${error}`);
            }
            // console.log('attachments', attechments)
            resultText = this.replaceHtmlImg(resultText, attechments, dirPath);

            const email = {
                from: { name: msgData.senderName, email: msgData.sentRepresentinmtpAddress || msgData.lastModifierName || msgData.inetAcctName },
                to: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'to').map((r) => { return { name: r.name, email: r.smtpAddress || r.email } }) : [],
                cc: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'cc').map((r) => { return { name: r.name, email: r.smtpAddress || r.email } }) : [],
                subject: msgData.subject || 'No Subject',
                body: resultText || 'No Body Available', // Fallback to default if no body is available
                attachments: msgData.attachments ? attechments : [],
                date: msgData.creationTime || 'Unknown Date',
            };
            // console.log('\n\n\n\n\n\n attechments', attechments)
            attechments = email.attachments;
            const emailHtml = this.createEmailHtml(email, attechments)

            // Define output PDF path
            // const pdfOutputPath = `${cOutputpath}/email_${nCaseid}.pdf`;

            // Generate the PDF from HTML
            console.log('Step 3.2');
            let result = await this.createPdfFromHtml(emailHtml, cOutputpath);
            console.log('Step 3.3');
            // console.log('Email genera');
            if (result) {
                return { msg: 1, email: email, attechments };
            } else {
                return { msg: -1, error: `Error While generate pdf` };
            }
        } catch (error) {
            console.error('Error reading .msg file:', error.message);
            return { msg: -1, error: `Error reading .msg file: ${error.message}` };
        }
    }


    async saveAttachment(msgData, reader, dirpath): Promise<FileAttachment[]> {
        console.log('\n\n\n dirpath ', dirpath, '\n\n\n\n')
        let attechments: FileAttachment[] = [];
        try {
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = await reader.getAttachment(attachment);
                console.log('attachment', attachment)
                let cPath = `${dirpath}ac_${new Date().getTime()}.${attachment.fileName.split('.').pop().toUpperCase()}`
                attechments.push({ cFilename: attachment.fileName, cPath: cPath, dataType: attachment.dataType, data: attachment || null, })
                if (attachment_file.content) { // Check if content is valid
                    writeFileSync(`${this.config.get('ASSETS')}/${cPath}`, attachment_file.content);
                    // let s3Key = `${dirpath}/${cPath}`;
                    // try {
                    //   // Upload attachment to S3
                    //   await this.s3.putObject({
                    //     Bucket: this.config.get('DO_SPACES_BUCKET_NAME'), // Your bucket name
                    //     Key: s3Key, // The file path in the bucket
                    //     Body: attachment_file.content,
                    //     ContentType: attachment.mimeType || 'application/octet-stream', // Set content type if available
                    //     ACL: 'public-read' // Set ACL as needed (e.g., 'public-read' for public access)
                    //   }).promise();
                    //   console.log(`Attachment uploaded to S3: ${s3Key}`);
                    // } catch (uploadError) {
                    //   console.error(`Failed to upload attachment to S3: ${s3Key}`, uploadError);
                    // }
                } else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            });
        } catch (error) {

        }

        // console.log('return', attechments);
        return attechments;
        // Iterate over each attachment and save it to S3
    }

    replaceHtmlImg(htmlContent, attechments, attachmentsDir) {
        try {
            let assetsPath = this.config.get('ASSETS');
            // Load the HTML content using Cheerio
            const $ = cheerio.load(htmlContent);

            $('style').remove();
            // Replace the `src` attribute of all `img` tags
            $('img').each(function () {
                const originalSrc = $(this).attr('src');
                try {
                    if (originalSrc && originalSrc.startsWith('cid:')) {
                        // Extract the filename from `cid:`
                        const imageName = originalSrc.split('cid:')[1].split('@')[0];
                        const path = attechments.find(e => e.data.pidContentId == imageName || e.cFilename == imageName)
                        // console.log('imageName', imageName, path)
                        // Define the new file path (assuming the saved files have the same name as `imageName`)
                        if (path) {
                            const newSrc = `${assetsPath}${path.cPath}`;
                            $(this).attr('src', newSrc);
                            console.log(`Replaced ${originalSrc} with ${newSrc}`);
                        }

                        // Set the new `src` attribute
                    }
                } catch (error) {

                }
                // Check if the `src` attribute has a `cid:` format
            });
            return $.html();
        } catch (error) {
            console.error('error', error)
            return '';
        }
    }

    createEmailHtml(email, attachments) {
        return `
      <div class="h-full overflow-auto w-full p-3 bg-[#f1f1f1]">
        <div class="email-container">
          <div type="cite">
            <div class="d-flex flex-column gap-2">
              <div>
                <b>From: </b>
                <span class="emailparent">
                  ${email?.from?.name}
                    <a href="mailto:${email?.from?.email}">${email?.from?.email}</a>    
                </span>
              </div>
              
              <div>
                <b>To: </b>
                ${email.to.map((recipient, index) => `
                  <span class="emailparent">
                    ${recipient.name}  <a href="mailto:${recipient.email}">${recipient.email}</a>
                  </span>
                  ${index !== email.to.length - 1 ? ', ' : ''}
                `).join('')}
              </div>

              <div>
                <b>CC: </b>
                ${email.cc.map((recipient, index) => `
                  <span class="emailparent">
                    ${recipient.name}                     
                      <a href="mailto:${recipient.email}">${recipient.email}</a> 
                  </span>
                  ${index !== email.cc.length - 1 ? ', ' : ''}
                `).join('')}
              </div>

              <div>
                <b>Subject: </b>
                <span class="emailparent">${email.subject}</span>
              </div>
            </div>
          </div>

          <hr class="my-4">
          <div class="email-body">${email.body}</div>
        </div>
      </div>
    `;
    }

    getFileExtension(filename: string): string {
        return filename.split('.').pop();
    }


    async createPdfFromHtml(emailHtml: string, outputPath: string): Promise<boolean> {
        let browser;
        const htmlFilePath = `${this.config.get('TMP_PATH')}/temp_${new Date().getTime()}.html`
        writeFileSync(htmlFilePath, emailHtml);
        try {
            // Specify the path to the Chrome executable
            // const executablePath = this.config.get('CHROME_PATH');

            // browser = await puppeteer.launch({
            //     executablePath,
            //     args: [
            //         '--no-sandbox',
            //         '--disable-setuid-sandbox',
            //         '--disable-web-security', // Disable web security for cross-origin images
            //         '--allow-running-insecure-content' // Allow insecure content if images are HTTP
            //     ],
            // });

            try {
                browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security', // Disable web security for cross-origin images
                        '--allow-running-insecure-content', // Allow insecure content if images are HTTP
                    ],
                });
            } catch (launchError) {
                console.error('Error launching Puppeteer:', launchError.stack || launchError.message);
                return false; // Return false if Puppeteer launch fails
            }

            const page = await browser.newPage();

            // Set the HTML content
            // await page.setContent(emailHtml, { waitUntil: 'networkidle2' });

            const encodedPath = encodeURI(`file://${htmlFilePath}`);
            await page.goto(encodedPath, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            const outputDir = path.dirname(outputPath);
            await fs.mkdir(outputDir, { recursive: true });

            // Generate the PDF
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '2cm',
                    right: '1.5cm',   // Right margin
                    bottom: '1.5cm',
                    left: '2cm',    // Left margin
                }
            });

            unlinkSync(htmlFilePath);

            console.log('PDF created successfully:', outputPath);
            return true
        } catch (error) {
            console.error('Error creating PDF:', error);
            return false
        } finally {
            if (browser) {
                await browser.close();
                return true
            }
        }

    }

    async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }



    async convertfile_multi(body: convertFileMulti): Promise<any> {
        try {
            const data = await this.fileInfo.convert_fileDataMulti(body);



            if (!data || !data.length) {
                return {
                    msg: 0,
                    value: 'No files found',
                    error: 'Files not found in the system'
                };
            }

            const convertPromises = data.map(async (item) => {
                // Enrich item with body data
                const enrichedItem = {
                    ...item,
                    nMasterid: body.nMasterid,
                    nCaseid: body.nCaseid,
                    converttype: body.cConvertType,
                    bMetadata: body.bMetadata,
                    name: item.cPath.split('/').pop().replace(`.${item.cPath.split('.').pop()}`, ''),
                    filetype: item.cPath.split('.').pop()?.toLowerCase() || ''
                };

                // Log conversion attempt
                const logData = {
                    nMasterid: body.nMasterid,
                    nBundledetailid: item.nBundledetailid,
                    nUDid: 0,
                    cStatus: 'P'
                };

                try {
                    await this.fileInfo.convertLog(logData);
                } catch (error) {
                    console.error(`Failed to log conversion for bundle ${item.nBundledetailid}:`, error);
                }

                // Process based on file type
                const queueOptions = {
                    removeOnComplete: true,
                    removeOnFail: true,
                    timeout: 1000 * 60 * 60, // 1 hour
                    attempts: 3,
                    backoff: 1000 * 60 * 5  // 5 minutes
                };

                const jobData = {
                    cPath: item.cPath,
                    nCaseid: body.nCaseid,
                    data: enrichedItem,
                    nBundledetailid: item.nBundledetailid
                };

                if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg',
                    'png', 'bmp', 'gif', 'tiff', 'zip'].includes(enrichedItem.filetype)) {
                    console.log('doc add in queue')
                    await this.convertQueue.add(jobData, queueOptions);
                } else if (['msg'].includes(enrichedItem.filetype.toLowerCase())) {
                    console.log('Email add in queue')
                    await this.convertEmailQueue.add(jobData, queueOptions);
                } else {
                    console.warn(`Unsupported file type: ${enrichedItem.filetype}`);
                }
            });

            // Wait for all files to be queued
            await Promise.all(convertPromises);

            return {
                msg: 1,
                value: `${data.length} file(s) queued for conversion`,
                error: null
            };

        } catch (error) {
            console.error('File conversion error:', error);
            return {
                msg: 0,
                value: 'File conversion failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    async getQueueLength(nCaseid: string): Promise<number> {
        // Get the total number of jobs in the queue (waiting + active + delayed, etc.)
        // let jobCounts = await this.convertQueue.getJobCounts();
        // let jobCounts2 = await this.convertEmailQueue.getJobCounts();
        // return (jobCounts.waiting ? jobCounts.waiting : 0) + (jobCounts2.waiting ? jobCounts2.waiting : 0); // Number of jobs waiting in the queue
        // Fetch all waiting jobs
        const jobs = await this.convertQueue.getJobs(['waiting', 'active', 'delayed']);
        let jobs2 = await this.convertEmailQueue.getJobs(['waiting', 'active', 'delayed']);

        const filteredJobs = jobs && jobs.length ? jobs.filter((job) => job.data.nCaseid === nCaseid) : [];
        const filteredJobs2 = jobs2 && jobs2.length ? jobs2.filter((job) => job.data.nCaseid === nCaseid) : [];

        return (filteredJobs.length ? filteredJobs.length : 0) + (filteredJobs2.length ? filteredJobs2.length : 0); // Number of jobs waiting in the queue
        // Fetch all waiting jobs
    }


}
