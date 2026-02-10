import { Injectable } from '@nestjs/common';
import { UtilityService } from '../../utility/utility.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { DbService } from '@app/global/db/pg/db.service';
import { promises as fs, createReadStream, createWriteStream, existsSync, mkdirSync, rm } from 'fs';
const { spawn } = require("child_process");
const async = require('async');
const path = require('path');
import { S3Client, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from 'stream';
import { Agent } from 'https';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { promisify } from 'util';
import { exec } from 'child_process';
const execPromise = promisify(exec);


@Injectable()
export class PaginateService {


  private readonly logApp: string = 'pagination';
  paginationProcess = [];
  ptaskProcess = [];
  editfilepath = this.configService.get('PY_PAGINATION')
  catchFile = this.configService.get('PY_FILE_CATCH')
  pythonV = this.configService.get('pythonV')


  private DO_SPACES_BUCKET_NAME = this.configService.get('DO_SPACES_BUCKET_NAME');
  private ASSETS_PATH = this.configService.get('S3_SYNC_PATH');
  private S3_BUCKET_PATH = this.configService.get('S3_BUCKET_PATH');
  private S3_EXC_PATH = this.configService.get('S3_EXC_PATH');
  private s3_SPACES_ENDPOINT = this.configService.get('DO_SPACES_ENDPOINT');

  private readonly s3Client: S3Client;
  constructor(private db: DbService, readonly utility: UtilityService,
    readonly configService: ConfigService, private readonly logService: LogService,
    @InjectQueue('pagination-queue') private readonly deletefileQueue: Queue) {

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




  async processPaginationData(res, body): Promise<any> {
    return new Promise(async (resolve, reject) => {

      try {
        await fs.mkdir(this.configService.get('ASSETS') + 'temp', { recursive: true });
        console.log(`Directory created or already exists `);
      } catch (error) {
        console.error(`Failed to create directory: ${error.message}`);
      }

      // console.log('processPaginationData', res, body)
      const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res;
      // console.log(jsonData, nCaseid, nPtaskid, jUsers, nLogid)
      this.logService.info(`Pagination start with data length ${jsonData?.length} by user ${body.nMasterid}`, this.logApp)
      try {
        if (!this.paginationProcess.find(e => e.nCaseid === nCaseid && e["isProcess"] === true)) {
          this.logService.info(`Already Pagination data not  found for selected case by user ${body.nMasterid}`, this.logApp)
          this.paginationProcess.push({ "nPtaskid": nPtaskid, "isProcess": true, nCaseid: nCaseid, jsonData: jsonData, jUsers: jUsers, nLogid: nLogid });
          // console.log('getPagination', this.paginationProcess)
          this.logService.info(`Pagination data added in queue by user ${body.nMasterid}`, this.logApp)

          this.processJsonData(this.paginationProcess.find(e => e.nPtaskid === nPtaskid)["jsonData"], nPtaskid, body.nMasterid, nLogid, nCaseid)
            .then(() => {
              try {
                // var ind = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                // // this.update_final(nPtaskid, body.nMasterid, 'C');
                // this.paginationProcess.splice(ind, 1);
              } catch (error) {

              }
              resolve(true)
            })
            .catch((error) => {
              try {
                var ind = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                // this.update_final(nPtaskid, body.nMasterid, 'F');
                this.paginationProcess.splice(ind, 1);
                this.logService.error(`Pagination Failed with error ${error} by user ${body.nMasterid}`, this.logApp)
              } catch (error) {

              }
              resolve(false);
              // console.log("Error:", error);
            });
        } else {
          this.logService.info(`Already Pagination data length found for selected case by user ${body.nMasterid}`, this.logApp)
          this.logService.info(`Pagination data added in queue by user ${body.nMasterid}`, this.logApp)
          this.paginationProcess.filter(e => e["isProcess"] === true && e.nCaseid === nCaseid).map(e => {
            jsonData.map(x => { x["nNPtaskid"] = nPtaskid, x["nLogid"] = nLogid })
            Array.prototype.splice.apply(e.jsonData, [e.jsonData.length, 0].concat(jsonData));
            this.add_inqueue(nPtaskid, e.nPtaskid);
          });
          resolve(true);
          // console.log(this.paginationProcess.find(e => e.nCaseid === nCaseid && e["isProcess"] === true));
        }
      } catch (e) {
        resolve(false);
        this.logService.error(`Pagination Failed with error ${e} by user ${body.nMasterid}`, this.logApp)
        console.log("error", e);
      }
    })

  }





  add_inqueue(nPtaskid, nQPtaskid) {
    let res = this.db.executeRef('pagination_add_queue', { nPtaskid: nPtaskid, nQPtaskid: nQPtaskid })
  }

  async processJsonData(jsonData, nPtaskid, nMasterid, nLogid, nCaseid): Promise<any> {
    try {
      let logApp = `${this.logApp}/${nMasterid}/${nPtaskid}`
      this.ptaskProcess.push({ t: nPtaskid, c: nCaseid, S: false });
      this.downloadfile(nPtaskid, nMasterid, nLogid, jsonData, logApp)
      // for (const [index, element] of jsonData.entries()) {
      //   await new Promise<void>((resolve, reject) => {
      //     this.logService.info(`Pagination start from queue ${index}/${jsonData.length} file path ${JSON.stringify(element)} for ${nMasterid}`, this.logApp)
      //     this.editFile(element, (flag) => {
      //       this.logService.info(`Pagination End from queue ${index}/${jsonData.length} file path ${JSON.stringify(element)} for ${nMasterid}`, this.logApp)
      //       this.update_progress(nPtaskid, nMasterid, nLogid, element, flag ? 'C' : 'F')
      //       console.log(index, jsonData.length)
      //       resolve();
      //     });

      //   });

      //   if (this.paginationProcess.find(e => e.nPtaskid === nPtaskid) && !this.paginationProcess.find(e => e.nPtaskid === nPtaskid)["isProcess"]) {
      //     console.log('break', nPtaskid)
      //     break;
      //   }
      // }
    } catch (error) {

    }
    return true;
  }


  async purgeCdnCache(fileKey: string, nID, logApp): Promise<void> {

    spawn(this.pythonV, [this.editfilepath, fileKey]);
  }

  async downloadfile(nPtaskid, nMasterid, nLogid, jsonData, logApp) {
    let isCancelled = false;

    this.logService.log(`DOWNLOAD FILE METHOD  : ${nPtaskid}`, logApp);
    const assetsFolder = path.join(__dirname, 'assets');
    const sessionFolder = path.join(assetsFolder, `session_${nPtaskid}`);

    const copyfileProcess = async.queue(async (job, done) => {
      const { nID, cPath } = job.element;
      const { tempFilePath, originalFileName, sessionFolder, nPtaskid } = job;
      if (isCancelled) {
        console.log('Skipping stream processing due to cancellation');

        let int = this.paginationProcess.findIndex(e => e.nPtaskid == nPtaskid)
        if (int != -1) {
          this.paginationProcess.splice(int, 1);
        }
        rm(sessionFolder, { recursive: true }, (err) => {
          if (err) {
            console.error(`Error removing session folder: ${sessionFolder}`);
          }
        });
        return;
      }
      this.logService.log(`Upload Start: ${nID}`, logApp);
      const copyCommand = `${this.S3_EXC_PATH} sync ${sessionFolder}/${originalFileName} ${this.S3_BUCKET_PATH}${cPath}`;
      try {
        await execPromise(copyCommand);
        this.logService.log(`Upload success: ${nID}`, logApp);
      } catch (error) {
        console.error(error);

        this.logService.error(`Upload error: ${error.message}`, logApp);
      }
      const lastVersion = await this.removeOldVersion(cPath)


      // try {
      //   this.purgeCdnCache(`${cPath}`, nID, logApp)
      // } catch (error) {

      // }

      this.logService.log(`update progress C : ${nID}`, logApp);
      this.update_progress(nPtaskid, nMasterid, nLogid, job.element, 'C', lastVersion)
      await this.deletefileQueue.add('FILEDELETE', { tempFilePath: `${sessionFolder}/${originalFileName}`, nID, logApp });
      const obj = jsonData.find(a => a.nID === nID);
      if (obj) {
        obj['isUpload'] = true;
      }
      // console.log('REMAIN', jsonData && jsonData.length ? jsonData.filter(a => !a.isUpload).length : 0);

      this.logService.log(`Upload END: ${nID} REMAIN ${jsonData && jsonData.length ? jsonData.filter(a => !a.isUpload).length : 0}`, logApp);
      if (!jsonData || !jsonData.filter(a => !a.isUpload).length) {
        console.log('ALL FILE Uploaded')
        this.logService.log(`ALL FILE Uploaded`, logApp);
        rm(sessionFolder, { recursive: true }, (err) => {
          if (err) {
            console.error(`Error removing session folder: ${sessionFolder}`);
          }
        });
      }

    }, 3)

    copyfileProcess.drain((job) => {
      // this.update_final(nPtaskid, nMasterid, 'C')

    })


    const paginationTask = async.queue(async (job, done) => {
      const { nID } = job.element;
      try {
        if (isCancelled) {
          console.log('Skipping stream processing due to cancellation');
          let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid)
          if (int !== -1) {
            this.paginationProcess.splice(int, 1);
          }
          return;
        }


        this.logService.log(`PAGINATION START: ${nID} REMAIN ASYNC QUEUE: ${paginationTask?.length()}`, logApp);
        try {
          console.log('PAGINATION FILE');

          const { tempFilePath, originalFileName, sessionFolder, nPtaskid } = job;
          const element = jsonData.find(a => a.nID === nID);
          const index = jsonData.findIndex(a => a.nID === nID);

          if (this.paginationProcess.find(e => e.nPtaskid === nPtaskid && e["isProcess"] === false)) {
            isCancelled = true
          }

          let flag: boolean = await this.editFile(element, tempFilePath, `${sessionFolder}/${originalFileName}`, logApp)
          const obj = jsonData.find(a => a.nID === nID);
          if (obj) {
            obj['isPaginate'] = true;
          }
          this.logService.log(`PAGINATION END: ${nID} with STATUS ${flag} REMAIN ASYNC QUEUE: ${jsonData && jsonData.length ? jsonData.filter(a => !a.isPaginate).length : 0}`, logApp);

          if (flag) {
            this.deletefileQueue.add('FILEDELETE', { tempFilePath, nID, logApp });
            copyfileProcess.push(job)
          } else {
            if (obj) {
              obj['isUpload'] = true;
            }
            this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F')
            this.deletefileQueue.add('FILEDELETE', { tempFilePath, nID, logApp });
            // await this.deletefileQueue.add('FILEDELETE', { tempFilePath: `${sessionFolder}/${originalFileName}`, nID, logApp });
          }
          // if (index == jsonData.length - 1) {
          //   this.update_final(nPtaskid, nMasterid, 'C')
          // }


        } catch (error) {
          // this.update_final(nPtaskid, nMasterid, 'F')
        }
      } catch (error) {

        this.logService.error(`STREAM ERROR: ${nID} ${error?.message}`, logApp);
      }

    }, 3)

    paginationTask.drain(() => {

    })



    const downloadQueue = async.queue(async (job, done) => {
      const { s3Params, tempFilePath, originalFileName, nPtaskid } = job;
      const { nID } = job.element;
      const element = jsonData.find(a => a.nID === nID);
      try {

        if (isCancelled) {
          console.log('Skipping stream processing due to cancellation');
          let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid)
          if (int !== -1) {
            this.paginationProcess.splice(int, 1);
          }
          return;
        }

        console.log(`DOWNLOAD START:`);
        if (this.paginationProcess.find(e => e.nPtaskid === nPtaskid && e["isProcess"] === false)) {
          isCancelled = true
        }


        // const data = await this.db.executeRef('download_getdata', query);


        try {
          this.logService.log(`DOWNLOAD START ${nID}  ${tempFilePath}`, logApp)
          console.log(`\n Params `, s3Params);
          const getCommand = new GetObjectCommand(s3Params);
          const { Body } = await this.s3Client.send(getCommand);

          if (Body instanceof Readable) {
            console.log(`\n\rReadStream found for `);
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
            this.logService.log(`DOWNLOAD COMPLETE ${nID} ${tempFilePath}`, logApp)
            // Enqueue STREAM task
            // await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });

            this.logService.log(`ON COMPLETE PUSH TO PAGINATION: ${nID} `, logApp);
            // streamQueue.push(job);
            paginationTask.push(job)
          }
        } catch (error) {
          this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F')
          this.logService.error(`Error downloading file  ${nID}  ${originalFileName}: ${error.message}`, logApp)
          console.error(`Error downloading file ${originalFileName}: ${error.message}`);
          //   throw error;
        }
      } catch (error) {
        this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F')
        this.logService.error(`Error downloading file  ${job?.nID}  ${job?.originalFileName}: ${error.message}`, logApp)
        console.log(error)
      }

    }, 2)


    if (!existsSync(sessionFolder)) {
      mkdirSync(sessionFolder, { recursive: true });
    }

    // console.log('File data', JSON.stringify(jsonData))

    for (const [index, element] of jsonData.entries()) {
      this.logService.info(`Pagination start from queue ${index}/${jsonData.length} file path ${JSON.stringify(element)} for ${nMasterid}`, logApp)

      const fileName = element.cPath.substring(element.cPath.lastIndexOf('/') + 1);
      const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const tempFilePath = path.join(sessionFolder, element.nID + '-' + fileName);
      try {
        if (element.cFVer && element.cFVer != 'null') {
          element.cFVer = await this.getFirstVersion(element.cPath)
          try {
            this.db.executeRef('upload_update_fver', { cFVer: element.cFVer, nBundledetailid: element.nID });
          } catch (error) { }
        }
      } catch (error) {

      }

      console.log('element', element)
      const s3Params = {
        Bucket: this.configService.get('DO_SPACES_BUCKET_NAME'),
        Key: element.cPath,
        VersionId: element.cFVer || 'null'
      };
      console.log('s3Params param for download', JSON.stringify(s3Params));
      // console.log(`DOWNLOAD START:${nPtaskid} `, nMasterid, nLogid, s3Params, originalFileName, tempFilePath);
      if (!element.cTab || element.cTab === '') {
        element['isUpload'] = true;
        this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F')
      } else {
        downloadQueue.push({ nPtaskid, nMasterid, nLogid, element, s3Params, originalFileName, tempFilePath, sessionFolder });
      }


      // if (this.paginationProcess.find(e => e.nPtaskid == nPtaskid) && !this.paginationProcess.find(e => e.nPtaskid == nPtaskid)["isProcess"]) {
      //   console.log('break', nPtaskid)
      //   break;
      // }
    }
  }

  async getFirstVersion(fileKey: string) {
    try {
      const bucketName = this.DO_SPACES_BUCKET_NAME;
      const s3Endpoint = this.s3_SPACES_ENDPOINT;

      // Run the AWS CLI command to list all versions of the file
      const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
      console.log(`Fetching versions for: ${fileKey} ${getVersionCommand}`);

      const { stdout } = await execPromise(getVersionCommand);
      const response = JSON.parse(stdout);

      if (response.Versions && response.Versions.length > 0) {
        // Sort versions by `LastModified` (oldest first)
        const sortedVersions = response.Versions.sort((a, b) =>
          new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
        );

        const firstVersion = sortedVersions[0]; // First uploaded version
        console.log(`🆔 First File Version ID: ${firstVersion.VersionId}`);
        this.logService.info(`First File Version ID: ${firstVersion.VersionId}`, this.logApp);
        return firstVersion.VersionId;
      } else {
        console.log("❌ No versions found.");
        this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching file versions:", error);
      this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
    }
    return null
  }


  async editFile(jsonData, input, output, logApp): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // print_log(`Start file ${new Date().toISOString(), jsonData.cPath}`)
      this.logService.info(`Push to python file`, logApp)
      jsonData['input'] = input;
      jsonData['output'] = output;
      console.log('Input output files - ', input, output)
      const pythonProcess = spawn(this.pythonV, [this.editfilepath, JSON.stringify(jsonData), logApp]);

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
          // console.log('step 3 res', code.toString().trim());
          // print_log(`Python script failed with code ${code}`);
          // reject(new Error(`Python script failed with code ${code}`));
          resolve(false);
        }
      });
    });
  }


  async update_progress(nPtaskid, nMasterid, nLogid, mdl, flag, lastVersion?): Promise<any> {
    console.log('UPDATING PROGRESS', flag)
    try {

      let res = await this.db.executeRef('pagination_update_progress', { nMasterid: nMasterid, nPtaskid: nPtaskid, nQPtaskid: (mdl["nNPtaskid"] ? mdl["nNPtaskid"] : null), nID: mdl.nID, cStatus: flag, isComplete: false, cRefpage: mdl["cRefpage"], cLVer: lastVersion });
      if (res.data && res.data.length) {
        let data = res.data[0]
        var obj = {
          nID: mdl.nID,
          nPtaskid: nPtaskid,
          nNPtaskid: mdl["nNPtaskid"],
          comp_progres: data[0]["comp_progres"],
          total_prog: data[0]["total_prog"],
          cType: 'P', // process
          cRefpage: mdl["cRefpage"], // process
          jPagination: mdl["jPagination"], // process
          cStatus: data[0]["cStatus"],
          nCaseid: data[0]["nCaseid"],
        };

        if (data[0]["comp_progres"] === data[0]["total_prog"]) {
          this.update_final(nPtaskid, nMasterid, 'C')
          let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid)
          this.paginationProcess.splice(int, 1);
        }
        if (data[0]["cStatus"] === 'S') {
          console.log('Stop pagination -', nPtaskid)
          let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid)
          if (int > -1)
            this.paginationProcess[int]["isProcess"] = false;
        }

        for (let user of data[0].jUsers) {
          this.utility.emit({ event: 'PAGINATION-PROGRESS', data: { identifier: '', nMasterid: user, data: obj } });
        }
      }
      const data = { nPtaskid: nPtaskid, nNPtaskid: mdl["nNPtaskid"], nLogid: mdl["nLogid"] ? mdl["nLogid"] : nLogid, cStatus: flag, "nBundledetailid": mdl.nID }
      this.insertLog(nMasterid, data, flag)
      return res.data[0]
      // for (let user of data[0].jUsers) {
      //     this.utility.emit({ event: 'PAGINATION-PROGRESS', data: { identifier: '', nMasterid: nMasterid, data: obj } });
      // }
    } catch (error) {
      console.error(error);
    }


  }

  async update_final(nPtaskid, nMasterid, flag) {

    let res = await this.db.executeRef('pagination_update_progress', { nPtaskid: nPtaskid, cStatus: flag, isComplete: flag === 'S' ? false : true, isStop: flag === 'S' ? true : false });
    // let res = await this.db.executeRef('pagination_update_progress', { nPtaskid: nPtaskid, cStatus: flag, isComplete: true });

    if (res.data && res.data.length) {
      let data = res.data[0]
      //  console.log('EXPORT-PROGRESS', data[0])
      try {
        var obj = {
          rec_type: 'PAGINATION-PROGRESS',
          nPtaskid: nPtaskid,
          cType: 'F', // final
          cStatus: data[0]["cStatus"],
          nUserid: nMasterid,
          nCaseid: data[0]["nCaseid"],
        };
        for (let user of data[0].jUsers) {
          this.utility.emit({ event: 'PAGINATION-PROGRESS', data: { identifier: '', nMasterid: user, data: obj } });
        }
        this.sendNotification(data[0]["nCaseid"], nMasterid, true)
        let int = this.paginationProcess.findIndex(e => e.nPtaskid == nPtaskid)
        this.paginationProcess.splice(int, 1);
      } catch (error) {

        console.log('final PAGINATION-PROGRESS', error)

      }
    }
  }


  async insertLog(nMasterid, data, flag, jOther?) {
    let origin = this.configService.get('ORIGIN');
    data = data ? data : {};
    data['O'] = origin;
    try {
      const log_data = {
        "nLCatid": flag === 'C' ? 54 : 53,
        "nMasterid": nMasterid,
        "jData": data,
      }
      await this.db.executeRef('log_insert', log_data);
    } catch (error) {

    }
  }


  async sendNotification(nCaseid: any, nMasterid: string, status: boolean) {
    if (!nCaseid) return;
    this.logService.info(`Notification send for ${nCaseid}`, `pagination/notification`);
    try {
      const users = await this.getUploadUser(nCaseid);
      if (users?.length) {
        users.forEach(a => {
          a.cTitle = `Pagination ${status ? 'successful' : 'failed'} `;
          a.cMsg = `Pagination ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
          a.nRefuserid = nMasterid
          this.utility.emit(a, `notification`);
        })
      }
    } catch (error) {
      console.log(error);
    }
  }


  async getUploadUser(nCaseid: string): Promise<any[]> {
    try {
      let res = await this.db.executeRef('notifications_caseusers', { nCaseid: nCaseid })
      if (res.success) {
        return res.data[0];
      } else {
        return [];
      };
    } catch (error) {

    }

  }

  async removeOldVersion(s3Path: string): Promise<string> {
    try {
      console.log('Fetching veriosn', s3Path)
      if (!s3Path) {
        this.logService.error(`${s3Path} not found for update version`, this.logApp)
        return;
      }
      const sortedVersions = await this.getAllVersion(s3Path);
      const versions = sortedVersions.filter(e => !e.IsLatest).map(e => e.VersionId); // First uploaded version
      console.log(`🆔 File Version ID: ${versions}`);
      this.logService.info(`File Version ID: ${versions}`, this.logApp);
      if (!versions || !versions.length) {
        this.logService.error(`${s3Path} version not found`, this.logApp)
        return;
      }
      // let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
      console.log('versions', versions)
      versions.forEach((element, index) => {
        if (versions.length != (index + 1)) {
          this.deleteSpecificVersion(element, s3Path)
        }
      });
      return sortedVersions.filter(e => e.IsLatest).map(e => e.VersionId)[0];
    } catch (error) {

    }
  }

  async deleteSpecificVersion(versionId, s3Path) {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.DO_SPACES_BUCKET_NAME,
        Key: s3Path,
        VersionId: versionId
      });

      const response = await this.s3Client.send(deleteCommand);
      console.log(`Version ${versionId} deleted successfully!`);
      return response;
    } catch (error) {
      console.error('Error deleting version:', error);
      throw error;
    }
  }

  async getAllVersion(fileKey: string): Promise<any[] | null> {
    try {
      const bucketName = this.DO_SPACES_BUCKET_NAME;
      const s3Endpoint = this.s3_SPACES_ENDPOINT;

      // Run the AWS CLI command to list all versions of the file
      const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
      console.log(`Fetching versions for: ${fileKey}`);

      const { stdout } = await execPromise(getVersionCommand);
      const response = JSON.parse(stdout);

      if (response.Versions && response.Versions.length > 0) {
        // Sort versions by `LastModified` (oldest first)
        const sortedVersions = response.Versions;

        // .sort((a, b) =>
        //   new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime()
        // );
        return sortedVersions;
      } else {
        console.log("❌ No versions found.");
        this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
        return null
      }
    } catch (error) {
      console.error("❌ Error fetching file versions:", error);
      this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
    }
    return null
  }


}
