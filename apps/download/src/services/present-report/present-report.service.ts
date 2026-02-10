import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DownloadProcess, PresentReportReq } from '../../interfaces/download.interface';
import { LogService } from '@app/global/utility/log/log.service';
import { error } from 'console';
const path = require('path');
const archiver = require('archiver');
const async = require('async');

import * as fs from 'fs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Readable } from 'stream';
import { Agent } from 'https';
import { query, Response } from 'express';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PresentIndexService } from '../present-index/present-index.service';
const crypto = require('crypto');

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


@Injectable()
export class PresentReportService {

    private readonly s3Client: S3Client;

    filePath = this.config.get('ASSETS');
    private logApp: string = 'download';


    constructor(
        private readonly db: DbService,
        private readonly config: ConfigService,
        private readonly logService: LogService,
        private readonly PIService: PresentIndexService,
        @InjectQueue('download-queue') private readonly downloadQueue: Queue,
    ) {

        const agent = new Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),   // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5, // Retry up to 3 times
            retryMode: 'standard', // Use the standard retry mode
            forcePathStyle: this.config.get('DO_S3') == 'MINIO', // Required for MinIO
            requestHandler: new NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000, // 30 seconds for connection
                socketTimeout: 60000,     // 30 seconds for socket
            }),
        });

    }

    async downloadPresentfiles(params: PresentReportReq, res): Promise<any> {
        try {
            console.log('Download Present Report', params);
            if (!params || !params.params) {
                console.log('Invalid parameters:', params);
                return { msg: -1, value: 'Invalid parameters', error: 'Invalid parameters' };
            }
            let query = JSON.parse(atob(params.params));
            query["nMasterid"] = params.nMasterid
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_presentreport', query, 'present');

            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${error}`, logApp);
                // throw new Error('No data found for download.');
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }

            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length)
            // console.log('data.data', JSON.stringify(data.data));
            if (detail.length > 0) {
                this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                this.createZip(detail, res, logApp, query)
            } else {
                console.log('GET RES FAILED')
                this.logService.error(`No data found for download`, logApp);
                return { msg: -1, value: 'No data found for download' };
            }

        } catch (error) {
            console.error('Download error:', error.message);
            this.logService.error(`Error while Downloading,${error.message}`, this.logApp);
            res.status(500).json({ msg: -1, value: 'Failed to fetch', error: error.message });
        }
    }

    // Function to download a single file from DigitalOcean Spaces


    async downloadSingleFileFromS3(fileDetail, res, logApp?) {
        if (!logApp) {
            logApp = this.logApp
        }
        const params = {
            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'), // Your DigitalOcean Space (Bucket) name
            Key: fileDetail.cPath // The file path in the bucket
        };

        try {
            this.logService.info(`Download Streaming start ${fileDetail.cPath}`, logApp);

            // Fetch file from S3 using AWS SDK v3
            const command = new GetObjectCommand(params);
            const { Body } = await this.s3Client.send(command);

            if (Body instanceof Readable) {
                const sanitizedFilename = fileDetail.cFilename.replace(/[^\w\-.\p{L}\p{N}]/gu, '_');
                const fileExtension = fileDetail.cPath.split('.').pop();
                // const fullFilename = `${sanitizedFilename}.${fileExtension}`;

                // Check if the sanitized filename already ends with the file extension
                const hasExtension = sanitizedFilename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`);
                const fullFilename = hasExtension ? sanitizedFilename : `${sanitizedFilename}.${fileExtension}`;

                this.logService.info(`Streaming file: ${fullFilename}`, logApp);

                // Set headers for file download
                res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
                res.setHeader('Content-Type', 'application/octet-stream');

                // Pipe the S3 stream to the response
                Body.pipe(res);
            } else {
                throw new Error('File stream is not readable');
            }
        } catch (error) {
            console.error('Error downloading file from S3:', error.message);
            this.logService.error(`Error downloading file from S3: ${error.message}`, logApp);

            res.status(500).json({
                msg: -1,
                value: 'Failed to download file from S3',
                error: error.message
            });
        }
    }


    async createZip(detail, res, logApp, query?) {
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);

        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }

        let indexpath: string = ''
        try {
            const indexfileapth: string = path.join(sessionFolder, 'index.pdf');
            const result = await this.PIService.createIndexFile(query, indexfileapth, logApp)
            if (result) {
                indexpath = indexfileapth
            }
        } catch (error) {

        }

        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);


        // Variable to track cancellation
        let isCancelled = false;

        // Listen for client disconnection
        res.on('close', () => {
            try {
                console.log('Client disconnected');
                isCancelled = true;

                // Destroy the queues and stop processing
                downloadQueue.kill(); // Terminates workers and clears all tasks
                streamQueue.kill();

                archive.abort(); // Stop archiving process

                // Optionally clean up session folder
                fs.rm(sessionFolder, { recursive: true }, (err) => {
                    if (err) console.error(`Error removing session folder: ${sessionFolder}`);
                    else console.log(`Session folder removed: ${sessionFolder}`);
                });
            } catch (error) {

            }

        });


        const sessionId = `session_${crypto.randomBytes(6).toString('hex')}`;
        // Listen for completed tasks




        const streamQueue = async.queue(async (job, done) => {
            const { nBundledetailid } = job;
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }


                this.logService.log(`STREAM START: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                // Ensure the task belongs to the current session
                // console.log('COMPLETED', job.name, nBundledetailid);

                console.log('STREAMING FILE');

                const { tempFilePath, originalFileName, folderPath } = job;

                // Stream file to the archive
                const fileStream = fs.createReadStream(tempFilePath);
                archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });

                fileStream.on('end', async () => {

                    this.logService.log(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                    try {
                        if (nBundledetailid) {
                            const obj = detail.find(a => a.nBundledetailid == nBundledetailid);
                            if (obj) {
                                obj.isStreamed = true;
                            }
                        }

                        this.logService.log(`REMAIN: ${detail.filter(a => !a.isStreamed).length}`, logApp);
                        console.log('REMAIN', detail.filter(a => !a.isStreamed).length);
                        if (!detail.filter(a => !a.isStreamed).length) {
                            console.log('ALL FILE STREAMED')
                            this.logService.log(`ALL FILE STREAMED`, logApp);
                            try {
                                archive.finalize();
                            } catch (error) {

                            }

                            fs.rm(sessionFolder, { recursive: true }, (err) => {
                                if (err) {
                                    console.error(`Error removing session folder: ${sessionFolder}`);
                                }
                            });
                        }
                    } catch (error) {
                        this.logService.error(`STREAM END FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                        console.error(error)
                    }



                    // Add file to DELETE queue after streaming
                    await this.downloadQueue.add('FILEDELETE', { tempFilePath, nBundledetailid, logApp });

                })


                fileStream.on('error', (error) => {

                    this.logService.error(`STREAM FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                })
            } catch (error) {

                this.logService.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`, logApp);
            }

        }, 5)

        streamQueue.drain(() => {

        })

        const downloadQueue = async.queue(async (job, done) => {
            try {

                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }

                console.log(`DOWNLOAD START:`);
                const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid } = job;

                try {
                    this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp)
                    const getCommand = new GetObjectCommand(s3Params);
                    const { Body } = await this.s3Client.send(getCommand);

                    if (Body instanceof Readable) {
                        const writeStream = fs.createWriteStream(tempFilePath);
                        Body.pipe(writeStream);

                        await new Promise((resolve, reject) => {
                            writeStream.on('finish', resolve);
                            writeStream.on('error', reject);
                        });

                        console.log(`File downloaded: ${tempFilePath}`);
                        this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp)

                        this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid} `, logApp);
                        streamQueue.push(job);
                    }
                } catch (error) {
                    this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp)
                    console.error(`Error downloading file ${originalFileName}: ${error.message}`);
                }
            } catch (error) {
                this.logService.error(`Error downloading file  ${job?.nBundledetailid}  ${job?.originalFileName}: ${error.message}`, logApp)
                console.log(error)
            }

        }, 5)


        this.logService.info(`\n\r\n\rSTARTED: ${sessionId} `, logApp);
        this.logService.info(`\n\r\n\r TOTOAL FILES: ${detail.length} `, logApp);

        if (indexpath) {
            streamQueue.push({ sessionId, tempFilePath: indexpath, fileName: 'Index.pdf', originalFileName: 'Index.pdf', sessionFolder, folderPath: '/', nBundledetailid: 0, logApp });
        }

        for (const files of detail) {
            const fileName = files.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, files.nBundledetailid + '-' + fileName);
            const folderPath = files.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: files.cPath,
            };
            files.isStreamed = false;

            this.logService.info(`PUSH TO QUEUE: ${sessionFolder} ${zipFilename}, ${files.nBundledetailid}`, logApp);
            downloadQueue.push({ sessionId, tempFilePath, fileName, originalFileName, sessionFolder, folderPath, s3Params, nBundledetailid: files.nBundledetailid, logApp });
        }


    }

}
