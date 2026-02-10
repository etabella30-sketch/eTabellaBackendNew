import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
const path = require('path');
import * as os from 'os';
const { spawn } = require("child_process");
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
// import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { delay } from 'rxjs';
import { downloadReq } from '../DTOs/download.dto';
import { schemaType } from '@app/global/interfaces/db.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { Agent } from 'https';
import { ConfigService } from '@nestjs/config';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { access, accessSync, createWriteStream, existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { LogService } from '@app/global/utility/log/log.service';
import { promisify } from 'util';
import { exec } from 'child_process';
import { ProcessStatusService } from './process-status/process-status.service';
import { RedisService } from '../util/redis/redis.service';
import { DownloadapiService } from '../downloadapi.service';
const execPromise = promisify(exec);

export interface FileProcessingJob {
    nDPid: string;
    cPath: string;
    nBundledetailid: string;
    outputKey?: string;
    processingType: 'text-transform' | 'image-resize' | 'custom';
    metadata?: Record<string, any>;
    nMasterid: string;
    totalFiles: number;
    cIsindex: boolean;
}

@Injectable()
export class S3FileService {
    private readonly logApp: string = 'hyperlink-download';
    private readonly logger = new Logger(S3FileService.name);
    private readonly s3Client: S3Client;
    schema: schemaType = 'download';
    bucketName = 'etabella'
    pythonV = this.configService.get('pythonV')
    editfilepath = this.configService.get('PY_LOCAL_HYPERLINK')
    editfilepath_index = this.configService.get('PY_LOCAL_HYPERLINK_INDEX')
    private S3_EXC_PATH = this.configService.get('S3_EXC_PATH');
    private S3_BUCKET_PATH = this.configService.get('S3_BUCKET_PATH');
    constructor(private readonly db: DbService, private readonly configService: ConfigService,
        @InjectQueue('s3-file-processing') private fileQueue: Queue, private readonly logService: LogService,
        private readonly processStatus: ProcessStatusService,
        private redis: RedisService, private readonly downloadapiService: DownloadapiService
    ) {
        const agent = new Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.configService.get('DO_SPACES_ENDPOINT'),   // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.configService.get('DO_SPACES_KEY'),
                secretAccessKey: this.configService.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5, // Retry up to 3 times
            retryMode: 'standard', // Use the standard retry mode
            forcePathStyle: this.configService.get('DO_S3') == 'MINIO', // Required for MinIO
            requestHandler: new NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000, // 30 seconds for connection
                socketTimeout: 60000,     // 30 seconds for socket
            }),
        });
    }




    async insertDownloadJob(body: downloadReq): Promise<{ msg: number, value: string, error?: any }> {
        this.logger.log('Inserting download job', body);

        const res = await this.db.executeRef('insert_download_process', body, this.schema);
        if (res.success) {
            try {
                if (res.data[0][0]["msg"] == 1) {

                    const isExistingJob = res.data[0][0]["isExistingJob"];
                    // if (!isExistingJob) {
                    const { totalFiles } = await this.setUpBatch(res.data[0][0]["nDPid"], body);


                    if (totalFiles <= 0) {
                        this.logger.error('No files found for the download job', body);
                        await this.processStatus.updateStatus(res.data[0][0]["nDPid"], 'F');

                        throw new InternalServerErrorException('No files found for the download job');
                    }

                    this.getFilesForDownload(res.data[0][0]["nDPid"], res.data[0][0]["totalFiles"], body);

                    // await this.redis.processSetup(res.data[0][0]["nDPid"], totalFiles);
                    // await this.pushToQueue(res.data[0][0]["nDPid"], body.nMasterid);
                    // }
                    // try {
                    //     // await this.redis.addSubscriber(res.data[0][0]["nDPid"], body.nMasterid);
                    // } catch (error) {

                    // }

                    return res.data[0][0];
                } else {
                    this.logger.error('Failed to insert download job', res.data[0]);
                    throw new InternalServerErrorException(res.data[0][0]["value"]);
                }
            } catch (error) {
                this.logger.error('Error processing insert download job response', error);
                throw new InternalServerErrorException(error.message, error.message);
            }
        } else {
            this.logger.error('Database error while inserting download job', res.error);
            throw new InternalServerErrorException(res?.error);
        }
    }

    async setUpBatch(nDPid: string, body: downloadReq): Promise<{ totalFiles: number }> {
        const function_name = 'insert_download_process_files_hyperlink';
        const res = await this.db.executeRef(function_name, { ...body, nDPid }, this.schema);
        if (res.success) {
            this.logger.log(`Batch setup for download job ${nDPid} completed successfully`);
            return { totalFiles: res.data[0][0].totalFiles };
        } else {
            this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
            throw new InternalServerErrorException('Failed to set up batch for download job', res.error);
        }

    }


    async getFilesForDownload(nDPid: string, totalFiles: number, body: downloadReq) {
        try {
            const function_name = 'get_hyperlink_jobs';
            const res = await this.db.executeRef(function_name, { ...body, nDPid }, this.schema);
            if (res.success) {
                if (res.data[0].length) {
                    this.queueMultipleFiles(nDPid, totalFiles, res.data[0])
                } else {
                    this.logger.log(`No file found for hyperlink ${nDPid}`);
                    await this.redis.processSetup(nDPid, totalFiles);
                    await this.downloadapiService.pushToQueue(nDPid, body.nMasterid);
                }

            } else {
                this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
                throw new InternalServerErrorException('Failed to set up batch for download job', res.error);
            }
        } catch (error) {
            this.logger.error('get hyperlink file data failed', body);
            await this.processStatus.updateStatus(nDPid, 'F');
            throw new InternalServerErrorException('No files found for the download job', error);
        }

    }


    // Add file processing job to queue
    async queueFileProcessing(jobData: FileProcessingJob): Promise<void> {
        try {
            await this.fileQueue.add('process-file', jobData, {
                priority: 1,
                delay: 0,
            });
            this.logger.log(`Queued file processing for: ${jobData.cPath}`);
        } catch (error) {
            this.logger.error(`Failed to queue file processing: ${error.message}`);
            throw error;
        }
    }

    // Bulk queue multiple files
    async queueMultipleFiles(nDPid: string, totalFiles: number, jobs: FileProcessingJob[]): Promise<void> {
        try {
            const queueJobs = jobs.map((jobData, index) => ({
                name: 'process-file',
                data: jobData,
                totalFiles: totalFiles,
                opts: {
                    priority: 1,
                    delay: index * 100, // Small delay between jobs
                },
            }));
            // console.log('add jobs in queue', queueJobs, jobs.length);
            await this.fileQueue.addBulk(queueJobs);
            this.logger.log(`Queued ${jobs.length} files for processing`);
        } catch (error) {
            throw new InternalServerErrorException('error while adding queue');
        }
    }

    // Download file from S3
    async downloadFile(nDPid, nID, key: string, sessionFolder: string, fileName: string): Promise<any> {
        try {
            const logApp = this.logApp + '/' + nDPid
            // const tempFilePath = sessionFolder;
            const tempFilePath = path.join(sessionFolder, fileName);

            if (!existsSync(sessionFolder)) {
                mkdirSync(sessionFolder, { recursive: true });
            }
            const command = new GetObjectCommand({
                Bucket: this.configService.get('DO_SPACES_BUCKET_NAME'),
                Key: key,
            });
            console.log('command', command)
            // const response = await this.s3Client.send(command);
            const { Body } = await this.s3Client.send(command);


            if (Body instanceof Readable) {
                console.log(`\n\rReadStream found for `);
                this.logService.info(`Donwload processing file: ${tempFilePath}`, logApp)
                const writeStream = createWriteStream(tempFilePath);
                Body.pipe(writeStream);

                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', (err) => {
                        console.error('ERROR ', err)
                        reject(err)
                    });
                });

                console.log(`File downloaded: ${tempFilePath}`);
                this.logService.info(`Donwload Success file: ${tempFilePath}`, logApp)
                // Enqueue STREAM task
                // await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });

            }

            // return new Promise((resolve, reject) => {
            //     const chunks: Buffer[] = [];
            //     stream.on('data', (chunk) => chunks.push(chunk));
            //     stream.on('error', reject);
            //     stream.on('end', () => resolve(Buffer.concat(chunks)));
            // });
        } catch (error) {
            this.logger.error(`Failed to download file ${key}: ${error.message}`);
            throw error;
        }
    }


    async fileExists(filePath: string): Promise<boolean> {
        try {
            await accessSync(filePath);
            return true;
        } catch {
            return false;
        }
    }
    // Upload file to S3
    async uploadFile(nDPid: string, nID: string, sessionFolder: string, fileName: string, outputfile: string): Promise<void> {
        try {

            const logApp = this.logApp + '/' + nDPid
            const tempFilePath = path.join(sessionFolder, fileName);
            if (this.fileExists(tempFilePath)) {
                const copyCommand = `${this.S3_EXC_PATH} sync "${tempFilePath}" ${this.S3_BUCKET_PATH}${outputfile}`;
                try {
                    await execPromise(copyCommand);
                    this.update_filepath(nDPid, nID, outputfile)
                    rmSync(tempFilePath, { force: true });
                    this.logService.log(`Upload success: ${nID}`, logApp);
                } catch (error) {
                    console.error(error);
                    this.logService.error(`Upload error: ${error.message}`, logApp);
                }

                // delay(1000)
                this.logger.log(`Successfully uploaded file: ${outputfile}`);
                this.logService.info(`Successfully uploaded file: ${outputfile}`, logApp)

            } else {

            }

        } catch (error) {
            this.logger.error(`Failed to upload file ${outputfile}: ${error.message}`);
            this.logService.info(`Failed to upload file ${outputfile}: ${error.message}`, this.logApp)
            throw error;
        }
    }

    // Process file based on type
    async hyperlinkprocessFile(nDPid:string,metadata: any, sessionFolder: string, fileName: string, outputfile, cIsindex: boolean): Promise<boolean> {
        return this.customProcessing(nDPid,metadata, sessionFolder, fileName, outputfile, cIsindex);

    }


    private async customProcessing(nDPid:string,metadata: any, sessionFolder: string, fileName: string, outputfile: string, cIsindex: boolean): Promise<boolean> {
        // Implement your custom processing logic here
        // delay(1000);

        const logApp = this.logApp + '/' + nDPid
        console.log('process file ', fileName)
        const input = path.join(sessionFolder, fileName);
        const output = path.join(sessionFolder, outputfile);
        await this.editFile(metadata, input, output, cIsindex, logApp)
        return true;
    }

    // Get queue statistics
    async getQueueStats() {
        const waiting = await this.fileQueue.getWaiting();
        const active = await this.fileQueue.getActive();
        const completed = await this.fileQueue.getCompleted();
        const failed = await this.fileQueue.getFailed();

        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
        };
    }

    // Retry failed jobs
    async retryFailedJobs(): Promise<void> {
        const failedJobs = await this.fileQueue.getFailed();
        for (const job of failedJobs) {
            await job.retry();
        }
        this.logger.log(`Retried ${failedJobs.length} failed jobs`);
    }


    async editFile(jsonData, input, output, cIsindex, logApp): Promise<boolean> {
        return new Promise((resolve, reject) => {
            // jsonData['input'] = input;
            // jsonData['output'] = output;
            // const jdata = JSON.stringify(jsonData)
            // console.log('Input output files - ', input, output)
            if (Array.isArray(jsonData)) {
                console.log('Hyperlink Data Count passed to Python:', jsonData.length);
            } else {
                console.log('Hyperlink Data passed to Python is NOT an array:', typeof jsonData);
            }

            const tmpFile = path.join(os.tmpdir(), `meta_${crypto.randomUUID()}.json`);
            writeFileSync(tmpFile, JSON.stringify(jsonData));


            const pythonProcess = spawn(this.pythonV, [(cIsindex ? this.editfilepath_index : this.editfilepath), input, output, tmpFile, cIsindex, logApp]);

            pythonProcess.stdout.on("data", (data) => {
                this.logService.info(`Responce to python file success ${data.toString().trim()}`, logApp)
                // console.log('step 3 res', data.toString().trim());
            });
            pythonProcess.stderr.on("data", (data) => {
                this.logService.info(`Responce to python file error ${data.toString().trim()}`, logApp)
                console.log(data.toString().trim())
                // print_log(`stderr: ${data.toString().trim()}`);
            });
            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    this.logService.info(`Responce to python file close with code ${code} success`, logApp)
                    console.log('step 3 res', code.toString().trim());
                    // print_log(`end file ${new Date().toISOString(), jsonData.cPath}`)
                    resolve(true);
                } else {
                    this.logService.info(`Responce to python file close with code ${code} failed`, logApp)
                    console.log('step 3 res', code.toString().trim());
                    // print_log(`Python script failed with code ${code}`);
                    // reject(new Error(`Python script failed with code ${code}`));
                    resolve(false);
                }
            });
        });
    }

    async update_filepath(nDPid: string, nBundledetailid: string, cPath: string): Promise<any> {
        try {
            const function_name = 'update_batchfile_url';
            const res = await this.db.executeRef(function_name, { nDPid, nBundledetailid, cPath }, this.schema);
            if (res.success) {
                return true
            } else {
                return false
            }
        } catch (error) {
            this.logService.log(`Upload success: ${nBundledetailid}`, this.logApp);
            console.log('error while update status', error)
        }
    }
}
