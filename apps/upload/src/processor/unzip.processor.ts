import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { UpdatefileinfoService } from '../services/updatefileinfo/updatefileinfo.service';
import { jobDetail } from '../interfaces/unzip.interface';
// import { ZipService } from '../services/zip/zip.service';
import { UtilityService } from '../services/utility/utility.service';
import { Inject, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef, REQUEST } from '@nestjs/core';
import { ZipService } from '../services/zip/zip.service';
import { LogService } from '@app/global/utility/log/log.service';
import * as fs from 'fs/promises';
import { ConfigService } from '@nestjs/config';


@Processor('unzip-process')
export class UnzipProcessor implements OnApplicationShutdown {
  start: Date = new Date();
  end: Date;
  // private readonly logApp: string = 'upload';
  constructor(private readonly fileInfo: UpdatefileinfoService,
    //  private readonly zip: ZipService, 
    // @Inject(REQUEST) private readonly zipServiceFactory: () => ZipService,
    private readonly utility: UtilityService, private readonly moduleRef: ModuleRef
    , private readonly logService: LogService,
    private readonly config: ConfigService
  ) {
  }

  onApplicationShutdown(signal?: string) {
    console.log(`Shutting down unzip processor on signal: ${signal}`);
    // Close any open resources or perform other cleanup tasks
    try {
      // if (zipService.zipFile) {
      //   zipService.zipFile.close();
      // }
    } catch (error) {
      console.log('Error closing zip file', error);
    }
    // zipService.clearLogAction();
  }

  @Process({ concurrency: 5 })
  async handleUnzip(job: Job) {


    const zipService = await this.moduleRef.create(ZipService);
    // const zipService = this.zipServiceFactory();
    const { nJobid, identifier, nUPid, nUDid } = job.data;

    this.logService.info(`Unzipping job... ${nJobid}`, `upload/${nUPid}/${identifier}`);
    console.log('Unzipping job...', nJobid);
    const jobDetail: jobDetail = await this.fileInfo.getJobDetail(nJobid); // Unzip the file
    jobDetail.nUPid = nUPid;
    jobDetail.nUDid = nUDid;
    try {

      this.utility.emit({ event: 'ZIP-DETAIL', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
      try {
        this.logService.info(`ZIP-DETAIL identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {

      }
      console.log('Open zip file', new Date());
      const ResFromOpenZip = await zipService.openZipFile(jobDetail.cPath); // open the zip file
      if (!ResFromOpenZip) {
        try {
          this.sendNotification(jobDetail, false);
          this.logService.error(`ZIP-OPEN-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
        } catch (error) {
        }
        this.utility.emit({ event: 'ZIP-OPEN-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });

        zipService.failedTask(nJobid, jobDetail);
        console.log('Error opening zip file'); // log error
        return;
      }

      console.log('Read zip file', new Date());
      try {
        zipService.files = await zipService.readFiles(); // read file entries  
      } catch (error) {

        try {
          this.sendNotification(jobDetail, false);
          this.logService.error(`ZIP-READ-failed : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
        } catch (error) {
        }
      }


      try {
        this.logService.info(`ZIP-READ-SUCCESS : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }
      this.utility.emit({ event: 'ZIP-READ-SUCCESS', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });

      console.log('Read zip file', zipService.files.length);

      await zipService.formateData(zipService.files); // format the data

      try {
        this.logService.info(`ZIP-FORMATE-SUCCESS : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }
      this.utility.emit({ event: 'ZIP-FORMATE-SUCCESS', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
      console.log('Zip result length', zipService.result.length);

      if (!zipService.result.length) {
        zipService.failedTask(nJobid, jobDetail);

        try {
          this.logService.error(`ZIP-NO-FORMATES : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
        } catch (error) {
        }
        this.utility.emit({ event: 'ZIP-NO-FORMATES', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
        console.log('No files found in zip result'); // no files in zip; process complete;
        return;
      }

      const responce = await this.fileInfo.saveBundle(jobDetail, zipService.result);

      if (!responce.length) {
        zipService.failedTask(nJobid, jobDetail);
        try {
          this.logService.error(`ZIP-BUNDLE-SAVE-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
        } catch (error) {
        }
        this.utility.emit({ event: 'ZIP-BUNDLE-SAVE-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
        console.log('No files found in responce'); // no files in zip; process complete;
        return;
      }

      try {
        this.logService.info(`ZIP-BUNDLE-SAVE : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }
      this.utility.emit({ event: 'ZIP-BUNDLE-SAVE', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });

      zipService.totalTasks = responce.length;
      zipService.sendReport(jobDetail)


      try {
        this.logService.info(`Files found in zip : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid} length : ${responce.length}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }
      console.log('Files found in zip:', responce.length); // log number of files found
      // Process each file
      let resOfExtraction = await zipService.extrationIndividual(jobDetail, responce); // move files to destination
      if (!resOfExtraction) {

        try {
          this.logService.error(`failed at extraction : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}  no extraition found`, `upload/${nUPid}/${identifier}`)
        } catch (error) {
        }
        zipService.failedTask(nJobid, jobDetail);
        console.log('failed at extraction'); // no files in zip; process complete;
        return;
      }


      try {
        zipService.zipFile.close();
      } catch (error) {

      }
      await zipService.saveFinal(nJobid, jobDetail, true);




      console.log('All files extracted successfully!', this.start, this.end = new Date(), zipService.movedFiles.length); // log success
      try {
        this.logService.info(`All files extracted successfully : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }



      this.utility.emit({ event: 'ZIP-COMPLETE', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });

      this.sendNotification(jobDetail, true);
      const zippath = `${this.config.get('ASSETS')}${jobDetail.cPath}`

      try {
        // Delete the file asynchronously
        await fs.unlink(zippath);
        this.logService.info(`Successfully deleted file: ${zippath}`, `upload/${nUPid}/${identifier}`);
      } catch (error) {
        // Log any errors encountered during deletion
        if (error.code === 'ENOENT') {
          // Handle the case where the file doesn't exist
          this.logService.info(`File not found, skipping deletion: ${zippath}`, `upload/${nUPid}/${identifier}`);
        } else {
          // Log other errors
          this.logService.error(`Error deleting file: ${zippath}`, `upload/${nUPid}/${identifier}`);
        }
      }
    } catch (error) {
      this.sendNotification(jobDetail, false);
      try {
        this.logService.error(`ZIP-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid} ${error.message}`, `upload/${nUPid}/${identifier}`)
      } catch (error) {
      }
      this.utility.emit({ event: 'ZIP-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
      console.log('error at final ', error); // log error
      zipService.failedTask(nJobid, jobDetail);
    }



  }



  async sendNotification(jobDetail, status: boolean) {
    // try {
    //   const users = await this.utility.getUploadUser(jobDetail.nUPid);
    //   if (users?.length) {
    //     users.forEach(a => {
    //       a.cTitle = `Zip extract ${status ? 'successful' : 'Failed'}`
    //       a.cMsg = `${jobDetail.cName} extract ${status ? 'successful' : 'Failed'}`
    //       a.nRefuserid = jobDetail.nUserid;
    //       this.utility.emit(a, `notification`);
    //     })
    //   }
    // } catch (error) {
    //   console.log(error);
    // }
  }



}