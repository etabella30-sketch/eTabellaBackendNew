import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { Logger } from 'winston';
import { DownloadProcess, IndexGenerationJob } from '../../interfaces/download.interface';
// import * as AWS from 'aws-sdk';
import { LogService } from '@app/global/utility/log/log.service';
const path = require('path');
const archiver = require('archiver');
const async = require('async');

import * as fs from 'fs';
import { S3Client, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Readable } from 'stream';
import { Agent } from 'https';
import axios from 'axios';
import { Response } from 'express';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { QueueService } from '../queue/queue.service';
import { QueueRegistrationService } from '../queue-registration/queue-registration.service';
import { IndexfileService } from '../indexfile/indexfile.service';
const crypto = require('crypto');

// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class DownloadfileService {

    private readonly s3Client: S3Client;

    filePath = this.config.get('ASSETS');
    private logApp: string = 'download';

    // Configure AWS SDK for DigitalOcean Spaces
    // spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));  // e.g. 'nyc3.digitaloceanspaces.com'
    // s3 = new AWS.S3({
    //     endpoint: this.spacesEndpoint,
    //     accessKeyId: this.config.get('DO_SPACES_KEY'),  // Your DigitalOcean Spaces Access Key
    //     secretAccessKey: this.config.get('DO_SPACES_SECRET'),  // Your DigitalOcean Spaces Secret Key
    // });

    logger = new Logger('download')
    constructor(
        private readonly db: DbService,
        private readonly config: ConfigService,
        private readonly logService: LogService,
        // private readonly indexfileService: IndexfileService,
        @InjectQueue('download-queue') private readonly downloadQueue: Queue,
        @InjectQueue('index-generation') private readonly indexGenerationQueue: Queue
        // @InjectQueue('download-queue') private downloadQueue: Queue
    ) {
        /* this.downloadQueue.on('completed', (job) => {
             if (job.name === 'DOWNLOAD') {
                 const { sessionId: jobSessionId, nBundledetailid, logApp } = job.data;
                 this.logService.log(`COMPELETE EVENT TO SERVICE SIDE: ${nBundledetailid} `, logApp);
             }
         });*/

        /*  this.downloadQueue.on('completed', (job) => {
          console.log(`Job with ID ${job.id} has completed`);
        });
    
        this.downloadQueue.on('failed', (job, err) => {
          console.log(`Job with ID ${job.id} failed with error: ${err.message}`);
        });
    
        this.downloadQueue.on('stalled', (job) => {
          console.log(`Job with ID ${job.id} stalled`);
        });
        this.downloadQueue.on('waiting', (jobId) => {
          console.log(`Job with ID ${jobId} is waiting to be processed`);
        });
        this.downloadQueue.on('active', (job, jobPromise) => {
          console.log(`Job with ID ${job.id} has started processing`);
        });
        
        this.downloadQueue.on('paused', () => {
          console.log('The queue has been paused');
        });
        this.downloadQueue.on('resumed', () => {
          console.log('The queue has been resumed');
        });
        this.downloadQueue.on('removed', (job) => {
          console.log(`Job with ID ${job.id} has been removed from the queue`);
        });
        
        this.downloadQueue.on('delayed', (jobId) => {
          console.log(`Job with ID ${jobId} is delayed`);
        });
        this.downloadQueue.on('drained', () => {
          console.log('The queue has been drained (no more jobs to process)');
        });
        
        this.downloadQueue.on('error', (error) => {
          console.error('An error occurred in the queue:', error);
        });
  */

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

    async downloadfiles(query: DownloadProcess, res): Promise<any> {
        try {
            console.log('Download request:', query);
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_getdata', query);

            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${data}`, logApp);
                // throw new Error('No data found for download.');
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }

            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length)
            // console.log('data.data', JSON.stringify(data.data));
            if (detail.length > 0) {
                if (detail.length === 1 && detail[0].cFilename) {
                    // Single file download
                    this.logService.info(`Download single file from S3 ${JSON.stringify(detail[0])}`, logApp);
                    return this.downloadSingleFileFromS3(detail[0], res, logApp);
                } else {
                    // Multiple files to ZIP  
                    console.log('Step 1')
                    this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                    return this.externalfiles(detail, res, logApp, query);
                }
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



    // async downloadSingleFileFromS3_old(fileDetail, res) {
    //     const params = {
    //         Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),  // Your DigitalOcean Space (Bucket) name
    //         Key: fileDetail.cPath  // The file path in the bucket
    //     };
    //     try {
    //         this.logService.info(` Download Streaming start ${fileDetail.cPath}`, this.logApp);
    //         const fileStream = this.s3.getObject(params).createReadStream();
    //         const sanitizedFilename = fileDetail.cFilename.replace(/[^\w\-.\p{L}\p{N}]/gu, '_');

    //         console.log(`${fileDetail.cFilename + '.' + fileDetail.cPath.split('.').pop()}`)

    //         res.setHeader('Content-Disposition', `attachment; filename=${sanitizedFilename + '.' + fileDetail.cPath.split('.').pop()}`);
    //         fileStream.pipe(res);

    //     } catch (error) {
    //         console.error('Error downloading file from S3:', error.message);
    //         this.logService.error(`Error downloading file from S3: ${error.message}`, this.logApp);
    //         return { msg: -1, value: 'Failed to download file from S3', error: error.message };
    //         // throw new Error('Failed to download file from S3');
    //     }
    // }


    async externalfiles(detail, res, logApp, query?) {
        this.createZip(detail, res, logApp, query)
        /*
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);

        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }

        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';
        this.logService.info(`Download and ZIP Streaming start in folder: ${sessionFolder} ${zipFilename}`, logApp);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

        try {
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(res);

            const streamQueue = async.queue(async (task, done) => {
                const { tempFilePath, originalFileName, folderPath } = task;

                try {
                    // Stream file to ZIP archive
                    const fileStream = fs.createReadStream(tempFilePath);

                    await new Promise<void>((resolve, reject) => {

                        if (folderPath !== '/' && !folders.includes(folderPath)) {
                            this.logService.info(`Adding folder to ZIP: ${folderPath}`, logApp);
                            folders.push(folderPath);
                            archive.append('', { name: folderPath + '/' });
                        }

                        archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });
                        this.logService.info(`Adding file to ZIP: ${originalFileName}`, logApp);
                        // archive.append(fileStream, { name: originalFileName });

                        fileStream.on('end', () => {
                            this.logService.info(`File streaming completed: ${originalFileName}`, logApp);
                            // resolve(); // Resolve the promise when file streaming is done
                            // Delete the file after streaming is complete
                            setTimeout(() => {
                                fs.unlink(tempFilePath, (err) => {
                                    if (err) {
                                        this.logService.error(`Failed to delete temp file: ${tempFilePath}`, logApp);
                                        reject(err);
                                    } else {
                                        this.logService.info(`Temp file deleted: ${tempFilePath}`, logApp);
                                        resolve();
                                    }
                                });
                            }, 100);
                        });

                        fileStream.on('error', (error) => {
                            this.logService.error(`Error streaming file: ${originalFileName}, ${error.message}`, logApp);
                            reject(error); // Reject the promise on streaming error
                        });


                        // Ensure file is deleted only after streaming is complete
                        // archive.on('entry', (entry) => {
                        //     this.logService.info(`Entry For Temp file: ${tempFilePath}`, logApp);
                        //     if (entry.name === path.posix.join(folderPath, originalFileName)) {
                        //         fs.unlink(tempFilePath, (err) => {
                        //             if (err) {
                        //                 this.logService.error(`Failed to delete temp file: ${tempFilePath}`, logApp);
                        //             } else {
                        //                 this.logService.info(`Temp file deleted: ${tempFilePath}`, logApp);
                        //             }
                        //         });
                        //     }
                        // });
                    });
                } catch (error) {
                    this.logService.error(`Error streaming file ${originalFileName}: ${error.message}`, logApp);
                } finally {
                    done(); // Notify the queue that the task is complete
                }
            }, 10); // Concurrency for ZIP streaming

            const downloadQueue = async.queue(async (task, done) => {
                const { s3Params, tempFilePath, originalFileName, folderPath } = task;

                try {
                    // Download file from S3 to local path
                    const getCommand = new GetObjectCommand(s3Params);
                    const { Body } = await this.s3Client.send(getCommand);

                    if (Body instanceof Readable) {
                        const writeStream = fs.createWriteStream(tempFilePath);
                        Body.pipe(writeStream);

                        writeStream.on('error', (err) => {
                            console.error(`Stream error: ${err.message}`)
                            this.logService.info(`Stream error: ${err}`, logApp);
                            // throw new Error(`Stream error: ${err.message}`);
                        });
                        await new Promise((resolve, reject) => {
                            writeStream.on('finish', resolve);
                            writeStream.on('error', reject);
                        });

                        this.logService.info(`File downloaded: ${tempFilePath}`, logApp);

                        // Enqueue file for streaming after download completes
                        streamQueue.push({ tempFilePath, originalFileName, folderPath });
                    } else {
                        throw new Error(`Failed to retrieve file stream from S3`);
                    }
                } catch (error) {
                    this.logService.error(`Error downloading file ${originalFileName}: ${error}`, logApp);
                } finally {
                    done(); // Notify the queue that the task is complete
                }
            }, 10); // Concurrency for downloading files

            // Enqueue files for downloading
            for (const files of detail) {
                let fileName = files.cFilename;
                const folderPath = files.foldername || '/';
                // Ensure the file name includes an extension
                const fileExtension = path.extname(files.cPath); // Get the extension from cPath
                if (!fileName.endsWith(fileExtension)) {
                    fileName += fileExtension; // Append the extension if missing or mismatched
                }

                const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                const tempFilePath = path.join(sessionFolder, originalFileName);

                if (files.cPath) {
                    const s3Params = {
                        Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                        Key: files.cPath,
                    };

                    downloadQueue.push({ s3Params, tempFilePath, originalFileName, folderPath });
                }
            }

            // Wait for all downloads to complete
            downloadQueue.drain(() => {
                this.logService.info(`All files downloaded.`, logApp);

                // Wait for all streaming tasks to finish
                streamQueue.drain(() => {
                    archive.finalize();

                    archive.on('end', () => {
                        fs.rm(sessionFolder, { recursive: true }, (err) => {
                            if (err) {
                                this.logService.error(`Error removing session folder: ${sessionFolder}`, logApp);
                            } else {
                                this.logService.info(`Session folder removed: ${sessionFolder}`, logApp);
                            }
                        });
                    });
                });
            });
        } catch (error) {
            this.logService.error(`Error during ZIP processing: ${error.message}`, logApp);
            res.status(500).send('Failed to process files');
        }
*/

    }


    async downloadFileWithAxios(
        url: string,
        destPath: string,
        logger: any,
        retryCount = 3
    ): Promise<void> {
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                // Ensure folder exists
                fs.mkdirSync(path.dirname(destPath), { recursive: true });

                const response = await axios.get(url, {
                    responseType: 'stream',
                    timeout: 60000,
                });

                await new Promise<void>((resolve, reject) => {
                    const writer = fs.createWriteStream(destPath);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                return;
            } catch (err) {
                logger?.warn?.(`Download attempt ${attempt} failed: ${err.message}`);
                if (attempt === retryCount) throw err;
            }
        }
    }


    async createZip(detail, res, logApp, query?) {
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);

        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }


        let indexpath: string = '';
        let indexFileGenerating = false;
        let indexFileGenerated = false;
        let indexFilePromise = null;

        // Start index file generation asynchronously
        // try {
        //     if (query.nDTaskid || query.nDTaskid == 0) {
        //         const indexfileapth: string = path.join(sessionFolder, 'index.pdf');
        //         indexFileGenerating = true;
        //         this.logService.log(`INDEX GENERATION STARTED`, logApp);

        //         // Create promise but don't await it
        //         indexFilePromise = this.indexfileService.createIndexFile(query, indexfileapth, logApp)
        //             .then((result) => {
        //                 if (result) {
        //                     indexpath = indexfileapth;
        //                     indexFileGenerated = true;
        //                     indexFileGenerating = false;
        //                     this.logService.log(`INDEX GENERATION COMPLETED`, logApp);
        //                     return true;
        //                 }
        //                 return false;
        //             })
        //             .catch((error) => {
        //                 indexFileGenerating = false;
        //                 indexFileGenerated = false;
        //                 this.logService.error(`INDEX GENERATING FAILED - ${error}`, logApp);
        //                 return false;
        //             });
        //     }
        // } catch (error) {
        //     indexFileGenerating = false;
        //     this.logService.error(`Error starting index file generation: ${error?.message}`, logApp);
        // }


        try {
            const fids = (query.jFiles).replace('{', '').replace('}', '');
            const folderids = (query.jFolders).replace('{', '').replace('}', '');
            if ((query.nDTaskid || query.nDTaskid == 0) && (query.jFiles.replace(/[{}]/g, '').length && !query.jFolders.replace(/[{}]/g, '').length)) {
                const indexfileapth: string = path.join(sessionFolder, 'index.pdf');
                indexFileGenerating = true;
                this.logService.log(`INDEX GENERATION QUEUED folders ${query.jFiles.replace(/[{}]/g, '')} - files ${query.jFolders.replace(/[{}]/g, '')} `, logApp);

                const jobId = `index_${crypto.randomBytes(6).toString('hex')}`;

                // Add the job to the queue
                const job = await this.indexGenerationQueue.add('generate', {
                    query,
                    outputPath: indexfileapth,
                    logApp,
                    jobId
                }, {
                    jobId,
                    removeOnComplete: true,
                    removeOnFail: true,
                    timeout: 60000 * 5 // 5 minutes timeout
                });

                // Create a promise that resolves when the job completes
                indexFilePromise = job.finished()
                    .then((result) => {
                        if (result && result.success) {
                            indexpath = indexfileapth;
                            indexFileGenerated = true;
                            indexFileGenerating = false;
                            this.logService.log(`INDEX GENERATION COMPLETED`, logApp);
                            return true;
                        }
                        return false;
                    })
                    .catch((error) => {
                        indexFileGenerating = false;
                        indexFileGenerated = false;
                        this.logService.error(`INDEX GENERATING FAILED - ${error}`, logApp);
                        return false;
                    });
            }
        } catch (error) {
            indexFileGenerating = false;
            this.logService.error(`Error queuing index file generation: ${error?.message}`, logApp);
        }

        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

        const archive = archiver('zip', { zlib: { level: 9 } });



        // Variable to track cancellation
        let isCancelled = false;
        const controller = new AbortController();


        const sessionId = `session_${crypto.randomBytes(6).toString('hex')}`;
        // Listen for completed tasks

        const activeReadStreams = new Set<fs.ReadStream>();
        const activeWriteStreams = new Set<fs.WriteStream>();


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
                activeReadStreams.add(fileStream);

                fileStream.on('end', async () => {
                    this.logger.warn(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`);
                    this.logService.log(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                    try {
                        activeReadStreams.delete(fileStream)
                    } catch (error) {

                    }
                    try {
                        if (nBundledetailid) {
                            const obj = detail.find(a => a.nBundledetailid == nBundledetailid);
                            if (obj) {
                                obj.isStreamed = true;
                            }
                        }

                        const remainingFiles = detail.filter(a => !a.isStreamed).length;
                        this.logService.log(`REMAIN: ${remainingFiles}`, logApp);
                        console.log('REMAIN', remainingFiles);

                        // If all files are streamed, check the status of index file generation
                        if (remainingFiles === 0) {
                            // If index file is being generated, wait for it
                            if (indexFileGenerating && indexFilePromise) {
                                this.logService.log(`WAITING FOR INDEX FILE TO COMPLETE`, logApp);
                                console.log('WAITING FOR INDEX FILE TO COMPLETE');

                                // Wait for index file to complete with a timeout
                                const timeoutPromise = new Promise((resolve) => {
                                    setTimeout(() => resolve(false), 60000); // 1 minute timeout
                                });

                                const indexResult = await Promise.race([indexFilePromise, timeoutPromise]);

                                if (indexResult === false && indexFileGenerating) {
                                    // Timeout occurred, proceeding without index
                                    this.logService.log(`INDEX GENERATION TIMED OUT, PROCEEDING WITHOUT INDEX`, logApp);
                                    console.log('INDEX GENERATION TIMED OUT, PROCEEDING WITHOUT INDEX');

                                    try {
                                        archive.finalize();
                                    } catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                } else if (indexFileGenerated && indexpath) {
                                    // Index generated successfully
                                    this.logService.log(`INDEX FILE COMPLETED, NOW STREAMING`, logApp);
                                    console.log('INDEX FILE COMPLETED, NOW STREAMING');

                                    const indexFileStream = fs.createReadStream(indexpath);
                                    archive.append(indexFileStream, { name: 'Index.pdf' });

                                    indexFileStream.on('end', () => {
                                        this.logService.log(`INDEX FILE STREAMED`, logApp);
                                        console.log('INDEX FILE STREAMED');

                                        // Finalize after index file is streamed
                                        try {
                                            archive.finalize();
                                        } catch (error) {
                                            this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                        }
                                    });

                                    indexFileStream.on('error', (error) => {
                                        this.logService.error(`INDEX FILE STREAM FAILED: ${error?.message}`, logApp);

                                        // Finalize anyway if index streaming fails
                                        try {
                                            archive.finalize();
                                        } catch (finalizationError) {
                                            this.logService.error(`Error finalizing archive: ${finalizationError?.message}`, logApp);
                                        }
                                    });
                                } else {
                                    // Index generation completed but failed or wasn't needed
                                    console.log('FINALIZING WITHOUT INDEX');
                                    this.logService.log(`FINALIZING WITHOUT INDEX`, logApp);

                                    try {
                                        archive.finalize();
                                    } catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                }
                            }
                            // If index file is already generated
                            else if (indexFileGenerated && indexpath) {
                                this.logService.log(`STREAMING INDEX FILE`, logApp);
                                console.log('STREAMING INDEX FILE');

                                const indexFileStream = fs.createReadStream(indexpath);
                                archive.append(indexFileStream, { name: 'Index.pdf' });

                                indexFileStream.on('end', () => {
                                    this.logService.log(`INDEX FILE STREAMED`, logApp);
                                    console.log('INDEX FILE STREAMED');

                                    // Finalize after index file is streamed
                                    try {
                                        archive.finalize();
                                    } catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                });

                                indexFileStream.on('error', (error) => {
                                    this.logService.error(`INDEX FILE STREAM FAILED: ${error?.message}`, logApp);

                                    // Finalize anyway if index streaming fails
                                    try {
                                        archive.finalize();
                                    } catch (finalizationError) {
                                        this.logService.error(`Error finalizing archive: ${finalizationError?.message}`, logApp);
                                    }
                                });
                            }
                            // No index file or not requested
                            else {
                                console.log('ALL FILES STREAMED WITHOUT INDEX');
                                this.logService.log(`ALL FILES STREAMED WITHOUT INDEX`, logApp);

                                // Finalize if no index file
                                try {
                                    archive.finalize();
                                } catch (error) {
                                    this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                }
                            }

                            // Clean up session folder after archive is finalized
                            archive.on('end', () => {
                                fs.rm(sessionFolder, { recursive: true }, (err) => {
                                    if (err) {
                                        console.error(`Error removing session folder: ${sessionFolder}`);
                                    } else {
                                        console.log(`Session folder removed: ${sessionFolder}`);
                                    }
                                });
                            });
                        }
                    } catch (error) {
                        this.logService.error(`STREAM END FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                        console.error(error);
                    }

                    // Add file to DELETE queue after streaming
                    await this.downloadQueue.add('FILEDELETE', { tempFilePath, nBundledetailid, logApp });
                });



                fileStream.on('error', (error) => {
                    try {
                        activeReadStreams.delete(fileStream)
                    } catch (error) {

                    }
                    this.logger.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`);
                    this.logService.error(`STREAM FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                })
                archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });
            } catch (error) {

                this.logService.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`, logApp);
            }

        }, 5)

        streamQueue.drain(() => {

        })

        /* const downloadQueue = async.queue(async (job, done) => {
             const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid, cdnUrl } = job;
 
             try {
                 if (isCancelled) {
                     this.logger.warn(`Skipping stream processing due to cancellation`);
                     return;
                 }
 
                 this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp);
 
                 try {
                     // cdnUrl expected in job → fallback logic can be added if needed
                     await this.downloadFileWithAxios(cdnUrl, tempFilePath, this.logger);
 
                     this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp);
 
                     // Enqueue for streaming
                     this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid}`, logApp);
                     streamQueue.push(job);
                 } catch (error) {
                     this.logService.error(
                         `Error downloading file ${nBundledetailid} ${originalFileName}: ${error.message}`,
                         logApp,
                     );
 
                     fs.writeFileSync(tempFilePath, Buffer.alloc(0)); // Create empty placeholder file
                     streamQueue.push(job); // Still push to next stage
                 }
             } catch (error) {
                 this.logService.error(
                     `Unexpected error in downloadQueue for ${job?.nBundledetailid} ${job?.originalFileName}: ${error.message}`,
                     logApp,
                 );
             }
         }, 5);*/
        const downloadQueue = async.queue(async (job, done) => {
            try {

                if (isCancelled) {
                    this.logger.warn(`Skipping stream processing due to cancellation`);
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }

                console.log(`DOWNLOAD START:`);
                const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid } = job;

                // const data = await this.db.executeRef('download_getdata', query);


                try {
                    this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp)

                    // const getCommand = new GetObjectCommand(s3Params);
                    // const { Body } = await this.s3Client.send(getCommand);

                    const { Body } = await this.s3Client.send(
                        new GetObjectCommand(s3Params),
                        { abortSignal: controller.signal }
                    );

                    if (Body instanceof Readable) {
                        const writeStream = fs.createWriteStream(tempFilePath);
                        activeWriteStreams.add(writeStream);
                        // Body.pipe(writeStream);

                        // await new Promise((resolve, reject) => {
                        //     writeStream.on('finish', resolve);
                        //     writeStream.on('error', reject);
                        // });
                        // remove from the set once done
                        writeStream.once('finish', () => activeWriteStreams.delete(writeStream));
                        writeStream.once('error', () => activeWriteStreams.delete(writeStream));

                        // 5) Pipe and await completion
                        await new Promise<void>((resolve, reject) => {
                            Body.pipe(writeStream)
                                .once('finish', resolve)
                                .once('error', reject);
                        });


                        console.log(`File downloaded: ${tempFilePath}`);
                        this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp)
                        // Enqueue STREAM task
                        // await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });

                        this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid} `, logApp);
                        streamQueue.push(job);
                    }
                } catch (error) {
                    this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp)
                    console.error(`Error downloading file ${originalFileName}: ${error.message}`);
                    //fs.writeFileSync(tempFilePath, '');
                    fs.writeFileSync(tempFilePath, Buffer.alloc(0));

                    streamQueue.push(job);
                    //   throw error;
                }
            } catch (error) {
                this.logService.error(`Error downloading file  ${job?.nBundledetailid}  ${job?.originalFileName}: ${error.message}`, logApp)
                console.log(error)
            }

        }, 5)

        /*this.downloadQueue.on('completed', async (job) => {
            // console.log('COMPLETED', job.name)
    
            const { sessionId: jobSessionId, nBundledetailid } = job.data;
    
            if (jobSessionId === sessionId) {
                if (job.name === 'DOWNLOAD') {
                    this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid} `, logApp);
                    streamQueue.push(job.data);
                }
            }
        });*/




        // Listen for client disconnection
        res.on('close', () => {
            try {

                this.logger.warn('Client disconnected');
                isCancelled = true;

                // this.logger.warn('destroing s3Client');
                // this.s3Client.destroy();


                if (indexFileGenerating && query.nDTaskid) {
                    this.indexGenerationQueue.getJob(`index_${query.nDTaskid}`)
                        .then(job => job?.remove())
                        .catch(err => this.logger.error(`Error removing index job: ${err.message}`));
                }
                this.logger.warn('Removing all listeners');
                try {
                    archive.removeAllListeners();
                } catch (error) {
                    this.logger.error(`Error removing archive listeners: ${error.message}`);
                }
                try {
                    res.removeAllListeners();
                } catch (error) {
                    this.logger.error(`Error removing response listeners: ${error.message}`);
                }


                try {

                    this.logger.warn('aborting axios request from controller');
                    controller.abort();  // only cancels *this* download

                } catch (error) {

                }
                this.logger.warn('Aborting archive');
                archive.abort(); // Stop archiving process



                try {
                    this.logger.warn('Destroying all active write streams');
                    // Destroy all active write streams
                    for (const ws of activeWriteStreams) {
                        ws.destroy();
                    }
                    activeWriteStreams.clear();

                } catch (error) {
                    this.logger.error(`Error destroying write streams: ${error.message}`);
                }

                try {
                    this.logger.warn('Destroying all active read streams');
                    // destroy all active read streams
                    for (const rs of activeReadStreams) {
                        rs.destroy();
                    }
                    activeReadStreams.clear();
                } catch (error) {
                    this.logger.error(`Error destroying read streams: ${error.message}`);
                }


                try {

                    // Destroy the queues and stop processing
                    downloadQueue.kill(); // Terminates workers and clears all tasks
                    // downloadQueue.removeAllListeners();

                } catch (error) {
                    this.logger.error(`Error killing download queue: ${error.message}`);
                }

                try {

                    streamQueue.kill();
                    // streamQueue.removeAllListeners();
                } catch (error) {
                    this.logger.error(`Error killing stream queue: ${error.message}`);
                }

                // Optionally clean up session folder
                fs.rm(sessionFolder, { recursive: true }, (err) => {
                    if (err) console.error(`Error removing session folder: ${sessionFolder}`);
                    else console.log(`Session folder removed: ${sessionFolder}`);
                });
            } catch (error) {
                this.logger.error(`Error during client disconnection: ${error.message}`);
            }

        });




        archive.pipe(res);
        this.logService.info(`\n\r\n\rSTARTED: ${sessionId} `, logApp);
        this.logService.info(`\n\r\n\r TOTOAL FILES: ${detail.length} `, logApp);

        // if (indexpath) {
        //     streamQueue.push({ sessionId, tempFilePath: indexpath, fileName: 'Index.pdf', originalFileName: 'Index.pdf', sessionFolder, folderPath: '/', nBundledetailid: 0, logApp });
        // }

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
            // Enqueue a download task
            // console.log('PUSHING TO QUEUE', files.nBundledetailid)

            this.logService.info(`PUSH TO QUEUE: ${sessionFolder} ${zipFilename}, ${files.nBundledetailid}`, logApp);
            // await this.downloadQueue.add('DOWNLOAD', { sessionId, tempFilePath, fileName, originalFileName, sessionFolder, folderPath, s3Params, nBundledetailid: files.nBundledetailid, logApp }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            downloadQueue.push({ sessionId, tempFilePath, fileName, originalFileName, sessionFolder, folderPath, s3Params, nBundledetailid: files.nBundledetailid, logApp });
        }






    }
    /* async createZip(detail, res, logApp) {
         console.log('\n\r\n\r\n\r ZIP START DOWNLOAD')
         const folders = [];
         const assetsFolder = path.join(__dirname, 'assets');
         const sessionId = `session_${crypto.randomBytes(6).toString('hex')}`;
         const sessionFolder = path.join(assetsFolder, sessionId);
 
         if (!fs.existsSync(sessionFolder)) {
             fs.mkdirSync(sessionFolder, { recursive: true });
         }
 
         const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';
 
         res.setHeader('Content-Type', 'application/zip');
         res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
 
         const archive = archiver('zip', { zlib: { level: 9 } });
         archive.pipe(res);
 
         const taskQueueName = `download-queue-${sessionId}`;
         console.log('STARTED')
         const taskQueue = this.queueService.createQueue(taskQueueName);
 
         const streamQueue = async.queue(async (job, done) => {
             const { tempFilePath, originalFileName, folderPath, nBundledetailid } = job;
 
             try {
                 const fileStream = fs.createReadStream(tempFilePath);
                 archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });
 
                 fileStream.on('end', async () => {
                     await taskQueue.add('FILEDELETE', { tempFilePath, nBundledetailid, logApp });
                 });
 
                 fileStream.on('error', (error) => {
                     console.error(`Error streaming file ${nBundledetailid}:`, error.message);
                 });
             } catch (error) {
                 console.error(`Error in streaming task ${nBundledetailid}:`, error.message);
             }
         }, 5);
 
         taskQueue.on('completed', async (job) => {
             console.log('on completed')
             if (job.name === 'DOWNLOAD') {
                 streamQueue.push(job.data);
             }
             const activeJobs = await taskQueue.getActiveCount();
             if (activeJobs === 0) {
                 console.log('COMPLETE')
                 archive.finalize();
                 fs.rm(sessionFolder, { recursive: true }, (err) => {
                     if (err) {
                         console.error(`Error removing session folder: ${sessionFolder}`);
                     }
                     // Cleanup the queue after all tasks are done
                     this.queueService.deleteQueue(taskQueueName);
                 });
             }
         });
 
         for (const file of detail) {
             const fileName = file.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
             const tempFilePath = path.join(sessionFolder, file.nBundledetailid + '-' + fileName);
             const folderPath = file.foldername || '/';
             const s3Params = {
                 Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                 Key: file.cPath,
             };
             console.log('PUSH TO QUEUE')
 
             await taskQueue.add('DOWNLOAD', {
                 sessionId,
                 tempFilePath,
                 fileName,
                 folderPath,
                 s3Params,
                 nBundledetailid: file.nBundledetailid,
                 logApp
             });
         }
     }*/
    /*async createZip(detail, res, logApp) {
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);
    
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }
    
        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';
    
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
    
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
    
        const dynamicQueueName = `download-queue-${crypto.randomBytes(6).toString('hex')}`;
        const newQueue = await this.queueRegistrationService.registerQueue(dynamicQueueName);
    
        // Register the processor before adding jobs
        newQueue.process('DOWNLOAD', 5, async (job) => {
            console.log(`DOWNLOAD START`);
            const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid } = job.data;
    
            try {
                // Simulate the download process
                console.log(`File downloaded: ${tempFilePath}`);
                // If actual downloading is needed, uncomment and implement it
                // const getCommand = new GetObjectCommand(s3Params);
                // const { Body } = await this.s3.s3Client.send(getCommand);
                // if (Body instanceof Readable) {
                //     const writeStream = fs.createWriteStream(tempFilePath);
                //     Body.pipe(writeStream);
    
                //     await new Promise((resolve, reject) => {
                //         writeStream.on('finish', resolve);
                //         writeStream.on('error', reject);
                //     });
    
                //     await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });
                // }
            } catch (error) {
                console.error(`Error downloading file ${originalFileName}: ${error.message}`);
            }
        });
    
        // Add jobs to the queue after the processor is registered
        for (const file of detail) {
            const fileName = file.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, file.nBundledetailid + '-' + fileName);
            const folderPath = file.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: file.cPath,
            };
            console.log('PUSH TO QUEUE');
            await newQueue.add('DOWNLOAD', { s3Params, tempFilePath, fileName, folderPath, logApp, nBundledetailid: file.nBundledetailid });
        }
    
        // Optionally close the queue after use
        await newQueue.close();
    }*/




    async externalfiles_V2(detail: any[], res: any) {
        const retryLimit = 3;
        const zipFilename = (detail[0]["filename"] ? detail[0]["filename"] : new Date().toISOString()) + '.zip';
        const zipFilePath = path.join(__dirname, zipFilename); // Save the ZIP file in the current directory
        this.logService.info(`Download Zip ${zipFilename}`, this.logApp);

        // Create a write stream for the ZIP file
        // const output = createWriteStream(zipFilePath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Pipe archive to the output file
        archive.pipe(res);

        try {
            for (const file of detail) {
                const folderPath = file.foldername || '/';
                const fileName = file.cFilename;
                const archivePath = path.join(folderPath, fileName).replace(/\\/g, '/');
                const s3Params = {
                    Bucket: process.env.DO_SPACES_BUCKET_NAME,
                    Key: file.cPath,
                };

                console.log(`Start processing file: ${fileName}`);

                for (let attempt = 1; attempt <= retryLimit; attempt++) {
                    try {
                        // Validate file existence and get metadata
                        const headCommand = new HeadObjectCommand(s3Params);
                        const { ContentLength } = await this.s3Client.send(headCommand);
                        console.log(`File size: ${ContentLength} bytes for ${fileName}`);

                        // Fetch and stream the file
                        const getCommand = new GetObjectCommand(s3Params);
                        const { Body } = await this.s3Client.send(getCommand);

                        if (Body) {
                            const stream = Body as Readable;

                            stream.on('error', (err) => {
                                console.error(`Stream error: ${err.message}`)
                                // throw new Error(`Stream error: ${err.message}`);
                            });

                            archive.append(stream, { name: archivePath });
                            console.log(`Added file to archive: ${fileName}`);
                            break; // Exit retry loop on success
                        } else {
                            console.warn(`Empty body for file: ${fileName}`);
                        }
                    } catch (error) {
                        if (attempt < retryLimit) {
                            const backoff = Math.pow(2, attempt) * 1000;
                            console.warn(`Retrying file: ${fileName} (Attempt ${attempt}) after ${backoff / 1000} seconds...`);
                            await new Promise((resolve) => setTimeout(resolve, backoff));
                            continue; // Retry
                        }

                        console.error(`Failed to process file: ${fileName} - ${error.message}`);
                    }
                }

                // Delay to reduce server load between files
                await new Promise((resolve) => setTimeout(resolve, 500)); // 500ms delay between file processing
            }

            await archive.finalize(); // Finalize the archive

            // Wait for the ZIP to finish saving
            // output.on('close', () => {
            //     console.log(`ZIP file created successfully: ${zipFilePath}`);

            //     // Serve the ZIP file to the client
            //     res.download(zipFilePath, zipFilename, (err) => {
            //         if (err) {
            //             console.error(`Error sending ZIP file to client: ${err.message}`);
            //             res.status(500).send('Error sending ZIP file');
            //         }

            //         // Optionally delete the ZIP file after serving
            //         fs.unlink(zipFilePath, (err) => {
            //             if (err) console.error(`Error deleting ZIP file ${zipFilePath}: ${err.message}`);
            //         });
            //     });
            // });
        } catch (err) {
            console.error('Error creating ZIP archive:', err.message);
            res.status(500).send('Error creating ZIP file');
        }

    }


    private readonly pythonApiUrl = 'http://localhost:5020/download'; // Flask API URL

    async externalfiles_python(detail: any[], res: Response, logApp) {
        try {

            // Dynamically import node-fetch
            const fetch = (await import('node-fetch')).default;

            const response = await fetch(this.pythonApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: detail }),
            });

            if (!response.ok) {
                throw new Error(`Python API returned status: ${response.status}`);
            }

            const nodeStream = Readable.from(response.body);

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=files.zip');

            nodeStream.pipe(res);
        } catch (error) {
            console.error('Error calling Python API:', error.message);
            res.status(500).send('Error creating ZIP file');
        }
    }



    async externalfiles_v1(detail, res) {

        // console.log('Step 2')
        const folders = [];
        const zipFilename = (detail[0]["filename"] ? detail[0]["filename"] : new Date().toISOString()) + '.zip';

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);




        const retryLimit = 3;

        try {
            for (const file of detail) {
                const folderPath = file.foldername || '/';
                const fileName = file.cFilename;
                const archivePath = path.join(folderPath, fileName).replace(/\\/g, '/');
                const s3Params = {
                    Bucket: process.env.DO_SPACES_BUCKET_NAME,
                    Key: file.cPath,
                };

                const fileURL = new URL(
                    `https://etabella.sgp1.digitaloceanspaces.com/${file.cPath}`
                );

                console.log(`Start processing file: ${fileName}`);
                console.log(`S3 URL: ${fileURL.toString()}`);

                const startTime = new Date();

                for (let attempt = 1; attempt <= retryLimit; attempt++) {
                    try {
                        // Validate file existence
                        const headCommand = new HeadObjectCommand(s3Params);
                        await this.s3Client.send(headCommand);

                        // Fetch and append to archive
                        const getCommand = new GetObjectCommand(s3Params);
                        const { Body } = await this.s3Client.send(getCommand);

                        if (Body) {
                            const stream = Body as Readable; // Cast Body to Node.js Readable stream
                            stream.on('error', (err) => {
                                console.error(`Stream error for file: ${fileName} - (URL: ${fileURL}): ${file.cPath} - ${err.message}`, err);
                                archive.emit('warning', err);
                            });

                            archive.append(stream, { name: archivePath });
                            await new Promise((resolve) => setTimeout(resolve, 500)); // Delay 500ms between files

                        } else {
                            console.warn(`Empty body for file: ${fileName} (URL: ${fileURL}): ${file.cPath}`);
                        }

                        break; // Exit retry loop on success
                    } catch (error) {
                        if (error.code === 'ECONNRESET' && attempt < retryLimit) {
                            console.warn(`Retrying file: ${fileName} (URL: ${fileURL}): (Attempt ${attempt})`);
                            continue; // Retry the download
                        }
                        console.error(`Error processing file ${fileName} (URL: ${fileURL}): ${error.message}`);
                        break; // Exit retry loop on failure
                    }
                }

                const endTime = new Date();
                console.log(`File: ${fileName} - Start Time: ${startTime.toISOString()}, End Time: ${endTime.toISOString()}`);
            }

            archive.finalize();
        } catch (err) {
            console.error('Error creating ZIP archive:', err.message);
            res.status(500).send('Error creating ZIP file');
        }
    }



    async pushToQueue(detail, sessionFolder) {
        for (const files of detail) {
            const fileName = files.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, fileName);
            const folderPath = files.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: files.cPath,
            };

            // Enqueue a download task
            // await this.downloadQueue.add('DOWNLOAD', { tempFilePath, fileName, folderPath, s3Params }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });

        }

    }


    async downloadfilesWithHyperLink(query: DownloadProcess, res): Promise<any> {
        try {
            console.log('Download request:', query);
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_with_linkfiles', query);

            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${data}`, logApp);
                // throw new Error('No data found for download.');
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }

            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length)
            // console.log('data.data', JSON.stringify(data.data));
            if (detail.length > 0) {
                if (detail.length === 1 && detail[0].cFilename) {
                    // Single file download
                    this.logService.info(`Download single file from S3 ${JSON.stringify(detail[0])}`, logApp);
                    return this.downloadSingleFileFromS3(detail[0], res, logApp);
                } else {
                    // Multiple files to ZIP  
                    console.log('Step 1')
                    this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                    return this.externalfiles(detail, res, logApp);
                }
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

    async getApproximateSize(query: DownloadProcess): Promise<any> {
        const res = await this.db.executeRef('get_approximate_size', query, 'download');

        if (!res.success || !res.data || res.data.length === 0) {
            return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
        }

        return { msg: 1, size: res.data[0][0]["cFinalSize"],isValidForStream: res.data[0][0]["isValidForStream"]}
    }

}
