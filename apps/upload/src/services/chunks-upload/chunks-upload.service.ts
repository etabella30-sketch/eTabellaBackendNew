import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { UploadService } from '../../upload.service';
import { ChunkStatus, MergeChunksReq, UploadJob, UploadResponce, uploadStatusSet } from '../../interfaces/chunk.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { resolve } from 'path';
import { ConfigService } from '@nestjs/config';
import { promises as fsPromises } from 'fs';
import { LogService } from '@app/global/utility/log/log.service';
import { UtilityService } from '../utility/utility.service';
import { DbService } from '@app/global/db/pg/db.service';
// import { AlphaQueueService } from '@app/alpha-queue';
import { QueueManageService } from '../queue-manage/queue-manage.service';

@Injectable()
export class ChunksUploadService {
    private chunkSet = {}
    private groupSize = 10
    private readonly tempUploadPath = this.upld.tempChunkPath;
    constructor(private readonly upld: UploadService, private readonly redisDbService: RedisDbService,
        private readonly logService: LogService,
        @InjectQueue('file-merge') private fileMergeQueue: Queue,
        @InjectQueue('sequence-file-merge') private sequenceMergeQueue: Queue,
        @InjectQueue('fileocr-process') private fileocrQueue: Queue,
        @InjectQueue('convert') private convertQueue: Queue,
        // @Inject('demo-queue') private demoQueue: AlphaQueueService,
        private config: ConfigService,
        private utility: UtilityService
        // , private db: DbService
        , private queueManage: QueueManageService
    ) {
        this.fileMergeQueue.on('error', (error) => {
            // throw new Error('Error in file merge queue: ' + error);
            // console.log(`MERGE ACTIVE JOB FOR FAILED  failed. Error: `, error);
        });
        this.fileMergeQueue.on('completed', (job, result) => {
            // console.log(`MERGE ACTIVE JOB FOR COMPLETE ${job.id} completed nUPid ${job?.data?.nUPid}. Result: ${JSON.stringify(result)}`);
            this.onDecreaseJob(job);
        });
        this.fileMergeQueue.on('failed', (job, err) => {
            // console.log(`MERGE ACTIVE JOB FOR FAILED  failed. Error: `, job, err);
            this.onDecreaseJob(job);
        });
        this.fileMergeQueue.on('active', (job) => {
            // console.log(`MERGE ACTIVE JOB FOR ACTIVE ${job.id} started processing.`);
        });
        // Monitor queue events
        this.fileMergeQueue.on('waiting', (jobId) => {
            console.log(`MERGE Job ${jobId} is waiting`);
        });
        this.fileMergeQueue.on('stalled', (job) => {
            console.log(`MERGE Job ${job.id} has stalled`);
        });
        this.fileMergeQueue.on('progress', (job, progress) => {
            console.log(`MERGE Job ${job.id} progress: ${progress}%`);
        });
        console.log('\n\r\n\r\n\r\n\rChunk upload service initialized.');

        // this.onInit();

    }



    async onModuleInit() {
        await this.clearQueue();
    }

    async onInit() {
        // let jobs = await this.fileMergeQueue.getJobs(['active', 'waiting', 'delayed', 'completed', 'failed']);
        // console.log('\n\r\n\r iunited', jobs)
    }

    async checkExistingChunks(identifier: string, nUPid: string, nCaseid: string, cPath: string, cTotal: string): Promise<ChunkStatus> {
        let MaxChunks = -1;
        try {
            MaxChunks = await this.redisDbService.getMaxFromList(this.upld.redisKey + identifier);
            MaxChunks = isNaN(MaxChunks) ? -1 : MaxChunks;
            MaxChunks = (MaxChunks - 10) > 0 ? (MaxChunks - 10) : 0
        } catch (error) {
            console.error('Error fetching max chunks:', error);
        }

        const finalPath = resolve(this.config.get('ASSETS'), 'doc', `case${nCaseid}`);

        try {
            await fsPromises.mkdir(finalPath, { recursive: true });
        } catch (error) {
            console.error("Error creating directory:", error);
        }

        /* this.redisDbService.setValue(`file:${identifier}`, JSON.stringify({
             "maxChunk": MaxChunks >= 0 ? MaxChunks : 0,
             "totalChunks": parseInt(cTotal),
             "path": cPath
         }), 24 * 3600);
 
         if (!this.chunkSet[identifier]) {
             this.chunkSet[identifier] = await this.redisDbService.getChunkSet(identifier)
         }*/

        try {
            this.chunkSet[`obj_${identifier}`] = await this.redisDbService.getChunkObject(identifier, this.chunkSet[`obj_${identifier}`], this.groupSize);
            this.chunkSet[`obj_${identifier}`].path = cPath;
        } catch (error) {
            this.logService.error(`Failed to get chunk obj ${error} `, `upload/${nUPid}/${identifier}`);
        }


        this.logService.info(`chunk OBJECT ${JSON.stringify(this.chunkSet[`obj_${identifier}`])}`, `upload/${nUPid}/${identifier}`);

        try {
            this.chunkSet[identifier] = await this.redisDbService.getChunkArray(identifier);
        } catch (error) {
            this.logService.error(`Failed to get chunk array ${error} `, `upload/${nUPid}/${identifier}`);
        }


        await this.redisDbService.setChunkObject(identifier, this.chunkSet[`obj_${identifier}`]);

        this.logService.info(`File Upload Started  \n totalChunks=${parseInt(cTotal)}, path=${cPath}`, `upload/${nUPid}/${identifier}`);
        return { max: MaxChunks, msg: 1 };
    }

    async saveChunk(file: Express.Multer.File, body: any): Promise<UploadResponce> {
        debugger;
        if (!file || !body.identifier || !body.chunkNumber) {
            return { m: -1, i: body.chunkNumber };
        }

        this.logService.info(`chunk receive ${body.chunkNumber}`, `upload/${body.nUPid}/${body.identifier}`);

        this.redisDbService.pushAndTrimList(this.upld.redisKey + body.identifier, parseInt(body.chunkNumber), 48 * 3600); //, 

        const chunkNumber = parseInt(body.chunkNumber);
        const fileId = body.identifier;

        if (!this.chunkSet[fileId]) {
            this.chunkSet[fileId] = await this.redisDbService.getChunkArray(fileId)
        }

        if (!this.chunkSet[fileId].includes(chunkNumber))
            this.chunkSet[fileId].push(chunkNumber)

        this.manageArrayForMerge(fileId, body);

        /*  if (!this.chunkSet[fileId]) {
              this.chunkSet[fileId] = await this.redisDbService.getChunkSet(fileId)
          }
  
          this.redisDbService.addChunkToSet(fileId, chunkNumber);
  
          if (!this.chunkSet[fileId].includes(chunkNumber))
              this.chunkSet[fileId].push(chunkNumber)
  
  
          // let chunkSet = await this.redisDbService.getChunkSet(fileId);
  
          this.chunkSet[fileId].sort((a, b) => a - b);
          if (this.chunkSet[fileId].length >= this.groupSize) {
              const start = this.chunkSet[fileId][0];
              const end = this.getEndChunk(this.chunkSet[fileId], start, this.groupSize);
              this.chunkSet[fileId] = [];
  
              const chunkObj = JSON.parse(await this.redisDbService.getValue(`file:${fileId}`));
              chunkObj.maxChunk = end;
              this.redisDbService.setValue(`file:${fileId}`, JSON.stringify(chunkObj), 24 * 3600);
  
              // console.log(`Merge chunk`, start, end)
  
              await this.sequenceMergeQueue.add({ body: null, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
  
  
          }*/

        return { m: 1, i: body.chunkNumber };
    }

    async manageArrayForMerge(fileId: string, body: any) {
        this.chunkSet[fileId].sort((a, b) => a - b);
        // fetch object of upload
        this.chunkSet[`obj_${fileId}`] = await this.redisDbService.getChunkObject(fileId, this.chunkSet[`obj_${fileId}`], this.groupSize);
        const obj = this.chunkSet[`obj_${fileId}`];

        const filterd = (this.chunkSet[fileId].filter(a => obj.maxChunk > a));


        this.redisDbService.setChunkArray(fileId, this.chunkSet[fileId]);

        if (filterd.length >= this.groupSize) {

            this.logService.info(`Filtered ,GROUP:${obj.maxChunk} ${JSON.stringify(filterd)}`, `upload/${body.nUPid}/${body.identifier}`);
            this.chunkSet[fileId] = this.chunkSet[fileId].filter(a => a >= obj.maxChunk); //this.removeFirstSequence(this.chunkSet[fileId]); 
            this.logService.info(`REMAIN ,GROUP:${obj.maxChunk} ${JSON.stringify(this.chunkSet[fileId])}`, `upload/${body.nUPid}/${body.identifier}`);

            this.chunkSet[`obj_${fileId}`].maxChunk = obj.maxChunk + this.groupSize;
            this.redisDbService.setChunkObject(fileId, this.chunkSet[`obj_${fileId}`]);
            this.redisDbService.setChunkArray(fileId, this.chunkSet[fileId]);

            const start = this.getMinChunk(filterd);
            const end = this.getMaxChunk(filterd);

            await this.sequenceMergeQueue.add({ body: null, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid, path: this.chunkSet[`obj_${fileId}`].path }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });


        }

    }
    /*
        private getEndChunk(chunkSet: number[], startChunk: number, groupSize: number): number {
            if (!chunkSet.length) return 0;
            if (chunkSet.length > groupSize) {
                return startChunk + groupSize - 1;
            } else {
                return chunkSet[chunkSet.length - 1];
            }
        }*/

    getMinChunk(arr) {
        return Math.min(...arr);
    }

    getMaxChunk(arr) {
        if (!arr.length) return null;
        // return Math.max(...arr);
        // Sort the array first
        arr.sort((a, b) => a - b);

        // Initialize variables to track the maximum sequence
        let maxSeq = arr[0];

        // Loop through the sorted array
        for (let i = 1; i < arr.length; i++) {
            // If current element is one more than the previous, it's sequential
            if (arr[i] === arr[i - 1] + 1) {
                maxSeq = arr[i];
            } else {
                // Sequence is broken, stop the search
                break;
            }
        }

        return maxSeq;
    }

    removeFirstSequence(arr) {
        // Sort a copy of the array to find the sequence without altering the original
        const sortedArr = [...arr].sort((a, b) => a - b);

        // Find the first sequential series
        const sequence = [sortedArr[0]];
        for (let i = 1; i < sortedArr.length; i++) {
            if (sortedArr[i] === sortedArr[i - 1] + 1) {
                sequence.push(sortedArr[i]);
            } else {
                break;
            }
        }

        // Filter out only the elements in the identified sequence from the original array
        const result = arr.filter(num => !sequence.includes(num));

        return result;
    }

    async completeUpload(body: MergeChunksReq) {
        console.log('UPLOAD COMPLETE');
        const fileId = body.identifier;

        if (!this.chunkSet[fileId])
            this.chunkSet[fileId] = await this.redisDbService.getChunkArray(fileId);

        this.chunkSet[fileId].sort((a, b) => a - b);

        // await this.redisDbService.deleteChunks(fileId)

        const start = this.getMinChunk(this.chunkSet[fileId]);
        const end = this.getMaxChunk(this.chunkSet[fileId]);


        try {
            await this.sequenceMergeQueue.add({ body: body, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid, path: this.chunkSet[`obj_${fileId}`].path }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        } catch (error) {

        }
        try {
            const total = await this.redisDbService.countInc(`task:${body.nUPid}:count`);
            this.logService.info(`INC ${body.nUPid} COUNT ${total}`, `upload/notification`);

        } catch (error) {

        }
        try {
            this.redisDbService.deleteChunks(fileId);
        } catch (error) {
        }

        try {
            delete this.chunkSet[`obj_${fileId}`];
            delete this.chunkSet[fileId];
        } catch (error) {
        }
        /* const fileId = body.identifier;
         const start = this.chunkSet[fileId][0];
         const end = this.getEndChunk(this.chunkSet[fileId], start, this.groupSize);
         this.chunkSet[fileId] = [];
         const chunkObj = JSON.parse(await this.redisDbService.getValue(`file:${fileId}`));
         chunkObj.maxChunk = end;
         this.redisDbService.setValue(`file:${fileId}`, JSON.stringify(chunkObj), 24 * 3600);
 
         delete this.chunkSet[fileId];
         await this.sequenceMergeQueue.add({ body: body, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
 
         this.logService.info(`upload complete `, `upload/${body.nUPid}/${fileId}`);*/
        return { msg: 1, value: 'Merge started...' };
    }

    async clearQueue() {
        await this.fileMergeQueue.clean(0, 'completed');
        await this.fileMergeQueue.clean(0, 'wait');
        await this.fileMergeQueue.clean(0, 'active');
        await this.fileMergeQueue.clean(0, 'delayed');
        await this.fileMergeQueue.clean(0, 'failed');

        await this.fileocrQueue.clean(0, 'completed');
        await this.fileocrQueue.clean(0, 'wait');
        await this.fileocrQueue.clean(0, 'active');
        await this.fileocrQueue.clean(0, 'delayed');
        await this.fileocrQueue.clean(0, 'failed');

        await this.convertQueue.clean(0, 'completed');
        await this.convertQueue.clean(0, 'wait');
        await this.convertQueue.clean(0, 'active');
        await this.convertQueue.clean(0, 'delayed');
        await this.convertQueue.clean(0, 'failed');

        console.log('All jobs cleared.');
    }

    async setUploadStatus(body: uploadStatusSet) {
        try {
            if (body.nTotal && body.nUPid) {
                this.redisDbService.setValue(`file:status:${body.nUPid}`, JSON.stringify(body), 24 * 3600);
            }
        } catch (error) {
        }

        // const res = await this.queueManage.createElasticTask(body);

        return { msg:1 } // res ? 1 : -1
    }

    async uploadJob(body: UploadJob) {

        try {
            const list = body.jUPids;
            list.forEach(async (e) => {
                // e.cStatus = 'C';
                if (e.nTotal && e.nUPid) {
                    // this.redisDbService.setValue(`file:status:${e.nUPid}`, JSON.stringify(body), 24 * 3600);
                    this.redisDbService.deleteValue(`file:status:${e.nUPid}`);
                    const count = await this.redisDbService.count(`task:${e.nUPid}:count`);
                    this.logService.info(`UPLOAD JOB ${e.nUPid} COUNT ${count}`, `upload/notification`);
                    if (count == 0) {
                        this.sendNotificationForUpload(e.nUPid, body.nMasterid);
                    }
                }
            })
        } catch (error) {

        }

        return { msg: 1 }
    }




    async onDecreaseJob(job) {
        try {
            const nUPid = job.data.nUPid;
            // Decrement the Redis counter for this `taskid`
            if (nUPid) {
                const remainingJobs = await this.redisDbService.countDec(`task:${nUPid}:count`);
                this.logService.info(`DEC ${nUPid}  COUNT ${remainingJobs}`, `upload/notification`);
                // console.log('COUNTER', nUPid, remainingJobs)
                if (remainingJobs === 0) {
                    const status = await this.redisDbService.getValue(`file:status:${nUPid}`);
                    if (!status) {
                        this.sendNotificationForUpload(nUPid, job.data.nMasterid);
                    }
                }
            }
        } catch (error) {
        }
    }


    async sendNotificationForUpload(nUPid: string, nMasterid: string) {
        if (!nUPid) return;
        this.logService.report(`Notification send for ${nUPid}`, `upload/notification/${nUPid}`);
        try {
            await this.redisDbService.deleteChunks(`task:${nUPid}:count`);
        } catch (error) {
        }
        try {
            const users = await this.utility.getUploadUser(nUPid);
            this.logService.report(`Users for notification ${(users?.length)}`, `upload/notification/${nUPid}`);
            if (users?.length) {
                users.forEach(a => {
                    this.logService.report(`Notify to ${(a.nUserid)}`, `upload/notification/${nUPid}`);
                    a["nRefuserid"] = nMasterid
                    this.utility.emit(a, `notification`);
                })
            }
            await this.redisDbService.deleteValue(`task:${nUPid}:count`)
        } catch (error) {
            this.logService.report(`FAILED  ${(error.message)}`, `upload/notification/${nUPid}`, 'E');
            console.log(error);
        }
    }



}