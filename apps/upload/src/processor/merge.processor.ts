import { createReadStream, createWriteStream, promises as fsPromises } from 'fs';
import { join, resolve } from 'path';
import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { UploadService } from '../upload.service';
import { VerifypdfService } from '../services/verifypdf/verifypdf.service';
import { UpdatefileinfoService } from '../services/updatefileinfo/updatefileinfo.service';
import { FilesystemService } from '@app/global/utility/filesystem/filesystem.service';
import { ConfigService } from '@nestjs/config';
import { FileValidateResponse } from '../interfaces/chunk.interface';
import { saveFileInfoReq, startJob } from '../interfaces/upload.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { UtilityService } from '../services/utility/utility.service';
import { LogService } from '@app/global/utility/log/log.service';

@Processor('file-merge')
export class MergeProcessor {
  private readonly logApp: string = 'upload';
  constructor(
    private readonly upld: UploadService,
    private readonly fileVerificationService: VerifypdfService,
    private filesystemService: FilesystemService,
    private config: ConfigService,
    private readonly fileInfo: UpdatefileinfoService, private readonly rds: RedisDbService,
    private readonly logService: LogService,
    // @InjectQueue('file-merge') private fileMergeQueue: Queue,
    @InjectQueue('unzip-process') private UnzipQueue: Queue,
    private readonly utility: UtilityService,
    @InjectQueue('filecopy-process') private fileCopyQueue: Queue,
    @InjectQueue('snap-process') private snapQueue: Queue,
    @InjectQueue('fileocr-process') private fileocrQueue: Queue,
    @InjectQueue('convert') private convertQueue: Queue,
    @InjectQueue('convert-email') private convertEmailQueue: Queue,
    @InjectQueue('delete-files') private fileDeleteQueue: Queue,
    
    // private readonly fileMergeQueue: Queue<any>,
  ) {

    this.setupQueueListeners();
  }

  private setupQueueListeners() {

    // this.fileMergeQueue.on('completed', (job, result) => {
    //   console.log(`ACTIVE JOB FOR COMPLETE ${job.id} completed. Result: ${JSON.stringify(result)}`);
    // });

    // this.fileMergeQueue.on('failed', (job, err) => {
    //   console.log(`ACTIVE JOB FOR FAILED ${job.id} failed. Error: ${err.message}`);
    // });

    // this.fileMergeQueue.on('active', (job) => {
    //   console.log(`ACTIVE JOB FOR ACTIVE ${job.id} started processing.`);
    // });


    // this.fileMergeQueue.on('drained', () => {
    //   console.log('\n\r\n\rQueue has been drained. All jobs completed.');
    //   // Perform any necessary actions or cleanup here
    // });
  }

  @Process({ concurrency: 2 }) //
  async handleMerge(job: Job) {

    // console.log('JOB MERGE FOR DOC : ', job.data.identifier);
    const nUPid = job.data.nUPid;
    this.logService.info(`Final process start`, `upload/${nUPid}/${job.data.identifier}`)
    let mergeSuccess = true;
    const { identifier, totalChunks, nCaseid, filetype, name, nUDid } = job.data;
    const chunksPath = join(this.upld.tempChunkPath, identifier);
    const dirPath = `${this.upld.docPath}/case${nCaseid}`;
    const dirFile = `${dirPath}/${name}.${filetype}`;
    const outputPath = resolve(this.config.get('ASSETS'), dirFile);
    await this.filesystemService.createDirectoryHierarchy(dirPath);

    /*  const writeStream = createWriteStream(outputPath);
      // Sequentially add chunks to the write stream
      for (let i = 0; i < totalChunks; i++) {
        // console.log('Merging chunks...', i);
        const chunkPath = join(chunksPath, `${i}`);
        try {
          await new Promise<void>((resolve, reject) => {
            const readStream = createReadStream(chunkPath);
            readStream.on('error', (error) => {
  
              try {
                this.logService.error(`error reading chunk : nUDid=${nUDid} ${identifier} : ${JSON.stringify(error)}`, this.logApp)
              } catch (error) {
                this.logService.error(`error reading chunk : nUDid=${nUDid}  ${identifier} `, this.logApp)
              }
              console.error('Error reading chunk:', error);
              writeStream.destroy();
              reject(error);
            });
            readStream.pipe(writeStream, { end: false });
            readStream.on('end', () => {
              resolve();
            });
          });
        } catch (error) {
          mergeSuccess = false;
  
          try {
            this.logService.error(`MERGING-FAILED : nUDid=${nUDid} ${identifier} : ${JSON.stringify(error)}`, this.logApp)
          } catch (error) {
          }
          this.utility.emit({ event: 'MERGING-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
        }
      }*/

    /*writeStream.on('error', (error) => {

      try {
        this.logService.error(`MERGING-FAILED  Error writing file : nUDid=${nUDid} ${identifier} : ${JSON.stringify(error)}`, this.logApp)
      } catch (error) {
      }
      mergeSuccess = false;
      console.error('Error writing file:', error);
      this.utility.emit({ event: 'MERGING-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
    });*/

    if (!mergeSuccess) {
      /*writeStream.destroy();*/
      await this.deleteChunks(chunksPath, identifier);
      return;
    }

    /*   writeStream.on('finish', async () => {*/

    try {
      this.logService.info(`file merged  : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`)
    } catch (error) {
    }
    this.utility.emit({ event: 'FILE-MERGED', data: { identifier, nMasterid: job.data.nMasterid } });
    if (filetype.toUpperCase() === 'ZIP') {


      // console.log('File is a ZIP, skipping verification.');

      const jobObj: startJob = {
        nUDid: nUDid,
        nMasterid: job.data.nMasterid,
        cPath: dirFile,
        nCaseid: job.data.nCaseid,
        nSectionid: job.data.nSectionid,
        nBundleid: job.data.nBundleid,
        identifier: identifier,
        bIsconvert: job.data.bIsconvert,
        converttype: job.data.converttype,
        bIsocr: job.data.bIsocr,
        nOcrtype: job.data.nOcrtype
      }

      let res = await this.fileInfo.jobStart(jobObj)
      if (res.msg == 1) {

        try {
          this.logService.info(`zip process : nUDid=${nUDid} nJobid=${res.nJobid}`, `upload/${nUPid}/${job.data.identifier}`)
        } catch (error) {
        }
        this.utility.emit({ event: 'ZIP-PROCESS', data: { identifier, nMasterid: job.data.nMasterid, nJobid: res.nJobid } });
        await this.UnzipQueue.add({ nJobid: res.nJobid, identifier: job.data.identifier, nUPid, nUDid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: 1000 * 60 * 5 });
      } else {

        try {
          this.logService.error(`zip failed : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`)
        } catch (error) {
        }

        this.utility.emit({ event: 'ZIP-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
      }

      await this.deleteChunks(chunksPath, identifier);

      return;
    }

    // console.log('All chunks merged, now verifying...');
    const verificationResult: FileValidateResponse = await this.fileVerificationService.verifyFile(outputPath);
    // console.log('Verification complete:', verificationResult);
    this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.nMasterid } });

    try {
      this.logService.info(`VERIFY-CPOMPLETE : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`)
    } catch (error) {
    }


    const fileInfo: saveFileInfoReq = {
      nUDid: nUDid,
      nMasterid: job.data.nMasterid,
      cFilename: job.data.cFilename,
      nSectionid: job.data.nSectionid,
      nBundleid: job.data.nBundleid,
      nBundledetailid: job.data.nBundledetailid,
      cFiletype: filetype,
      isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
      cPath: dirFile,
      cFilesize: job.data.filesize.toString(),
      nPagerotation: verificationResult.pagerotation,
      cPage: `1-${verificationResult.totalpages}`,
      bisTranscript: (job.data.bisTranscript ? job.data.bisTranscript : false),
    };

    // console.log('\n\r\n\r Update file info', fileInfo)

    let res = await this.fileInfo.updateFileInfo(fileInfo)
    let isComplete = false;
    this.logService.info(`File update info ${JSON.stringify(res)}  bIsconvert:${job.data.bIsconvert} ,converttype:${job.data.converttype} ,bIsocr:${job.data.bIsocr}`, `upload/${nUPid}/${job.data.identifier}`);
    if (res.msg == 1) {
      isComplete = true;
      try {
        if (res && res['cOldpath'] && res['cOldpath'] != '') {
          this.logService.info(`Delete Old file  : nUDid=${nUDid} - ${res['cOldpath']}`, `upload/${nUPid}/${job.data.identifier}`);
          this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] })
        }
      } catch (error) {
        console.log('Error in fileDeleteQueue:', error)
      }
      // success responce
      try {
        if (!nUPid) {
          this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
          await this.deleteChunks(chunksPath, identifier);
          return;
        }
      } catch (error) {

      }


      if (isComplete) {
        if (job.data.bIsconvert && job.data.converttype != 'N') {
          if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'zip'].includes(filetype.toLowerCase())) {

            let data = { "nMasterid": job.data.nMasterid, "nBundledetailid": res.nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
            try {
              await this.fileInfo.convertLog(data)
            } catch (error) {
            }

            await this.convertQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: job.data.converttype == 'C' ? res.nBundledetailid : null }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
          }
        } else if (job.data.bIsocr && (/\.(pdf)$/i.test(dirFile))) {
          await this.fileocrQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        }


        if (['msg'].includes(filetype.toLowerCase())) {
          let data = { "nMasterid": job.data.nMasterid, "nBundledetailid": res.nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
          try {
            if (job.data.bIsconvert && job.data.converttype != 'N') {
              await this.fileInfo.convertLog(data)
            }
          } catch (error) {
          }

          await this.convertEmailQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        }
        // console.log('Continue to copy file');
        if (!(job.data.bIsocr && (/\.(pdf)$/i.test(dirFile))) && (!job.data.bIsconvert || (job.data.bIsconvert && job.data.converttype != 'C'))) {
          this.logService.info(`Adding to queue at  `, `upload/${nUPid}/${job.data.identifier}`);
          // await this.elasticFileExtraction.add({ data: { cPath: dirFile, nBundledetailid: res.nBundledetailid, nBundleid: job.data.nBundleid, nSectionid: job.data.nSectionid, nCaseid, fileAvailable: true } }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
          await this.fileCopyQueue.add({ cPath: dirFile, converttype: job.data.converttype, nBundledetailid: res.nBundledetailid ,nUPid}, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
          await this.snapQueue.add({ cPath: dirFile, nCaseid: nCaseid, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
        }
        // if (job.data.bIsconvert && job.data.converttype != 'N') {
        //   return true;
        // }
      }

      try {
        this.logService.info(`FILE-INSERT-COMPLETE : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`)
      } catch (error) {
      }

      this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
      if (job.data.bisTranscript) {
        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
      }
    } else {
      isComplete = false;

      try {
        this.logService.error(`FILE-INSERT-Failed : nUDid=${nUDid} ERROR : ${JSON.stringify(res)}`, `upload/${nUPid}/${job.data.identifier}`);
      } catch (error) {
      }

      this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.nMasterid, msg: -1 } });
      if (job.data.bisTranscript) {
        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
      }
    }


    /*  // console.log('Process completed.');
    });

    writeStream.end();*/
    await this.deleteChunks(chunksPath, identifier);
  }


  /*private async clearBullData(job: Job) {
    const keys = [
      // Add the Redis keys used by Bull here
      `bull:${this.fileMergeQueue.name}:completed`,
      `bull:${this.fileMergeQueue.name}:delayed`,
      `bull:${this.fileMergeQueue.name}:wait`,
      `bull:${this.fileMergeQueue.name}:active`,
      `bull:${this.fileMergeQueue.name}:failed`,
      // ...
    ];

    for (const key of keys) {
      await this.rds.deleteList(key);
    }
  }*/

  async deleteChunks(chunksPath: string, identifier: String): Promise<any> {
    try {
      // console.log('\n\r\n\rRemove redis shorted lits', this.upld.redisKey + identifier);
      this.rds.deleteList(this.upld.redisKey + identifier);

      try {

        // this.rds.deleteValue(`file:${identifier}`);
        this.rds.deleteChunks(identifier)
      } catch (error) {

      }

      await fsPromises.rm(chunksPath, { recursive: true });
      // console.log('File Deleted')
    } catch (error) {
      console.error('Failed to delete chunk directory:', error);
    }
  }

}
