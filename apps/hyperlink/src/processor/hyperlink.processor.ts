import { Processor, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { hyperlinkFiles, hyperlinkProcess, hyperlinkReq } from '../interfaces/hyperlink.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { HyperlinksearchService } from '../services/hyperlinksearch/hyperlinksearch.service';
import { UtilityService } from '../services/utility/utility.service';
import * as fs from 'fs';
import { promises as fsp } from 'fs';
import * as path from 'path';

@Processor('hyperlink-queue')
export class HyperLinkProcessor {
  private readonly logApp: string = 'hyperlink';
  constructor(
    private config: ConfigService, private readonly rds: RedisDbService, private readonly db: DbService,
    private readonly logService: LogService, private hyperlinksearchService: HyperlinksearchService, private readonly utility: UtilityService
  ) {

  }

  @Process({ concurrency: 5 }) //
  async handleHyperlink(job: Job) {
    const jobData: hyperlinkProcess = job.data;
    console.log('\n\r\n\rProcessing hyperlink for ', jobData);
    this.logService.info(`Processing hyperlink for ${jobData.queueName}`, this.logApp);
    const files: hyperlinkFiles[] = await this.getHyperlinkfiles({ nBundledetailid: jobData.nBundledetailid,nBundleid: jobData.nBundleid, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });
    this.logService.info(`File length ${files.length}`, this.logApp);
    jobData.nTotal = files.length;
    this.sendUploadResponce(jobData);

    const searchTermsPath = `${this.config.get('HYPERLINK_DB_PATH')}/search_terms${jobData.nSectionid}.txt`;
    if (jobData.isDeepscan) {
      await this.fetchHyperlinksTerms(jobData, searchTermsPath);
    }


    try {
      console.log('searchTermsPath', files.length);
      for (let x of files) {
        try {
          const res = await this.hyperlinksearchService.createHyperlinkFile(x, jobData, searchTermsPath);
          if (res) {
            this.logService.info(`Hyperlink created for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
            await this.updateHyperlinksForFile(x, jobData, 'C');
            jobData.nCompleted++;
          } else {
            this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
            await this.updateHyperlinksForFile(x, jobData, 'F');
            jobData.nFailed++;
          }
        } catch (error) {
          this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
          await this.updateHyperlinksForFile(x, jobData, 'F');
          jobData.nFailed++;
        }

        this.sendUploadResponce(jobData);
      }
      jobData.cStatus = 'C';
      let nBundledetailid = files.length == 1 ? files[0].nBundledetailid : null
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, true, nBundledetailid);
    } catch (error) {
      console.log('Error in hyperlink', error);
      jobData.cStatus = 'F';
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
      this.logService.info(`Error in hyperlink  ${jobData.queueName}`, this.logApp);
    }

    this.sendUploadResponce(jobData);
    this.logService.info(`Hyperlink Complete for  ${jobData.queueName}`, this.logApp);



    this.removeRediskey(jobData.queueName);




  }

  async getHyperlinkfiles(query: hyperlinkReq): Promise<any> {
    query["ref"] = 2;
    let res = await this.db.executeRef('hyperlink_getfiles', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  async getHyperlinkSearchTerms(query: any): Promise<any> {
    let res = await this.db.executeRef('hyperlink_searchterms', query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }

  removeRediskey(name) {
    try {
      this.rds.deleteValue(name);
    } catch (error) {
    }
  }

  async updateHyperlinksForFile(file: hyperlinkFiles, jobData: hyperlinkProcess, cStatus: 'C' | 'F'): Promise<any> {
    try {
      const param = {
        nMasterid: jobData.nMasterid,
        nSectionid: jobData.nSectionid,
        nBundledetailid: file.nBundledetailid,
        cType: jobData.cType,
        cStatus: cStatus,
        cPath: (`${this.config.get('HYPERLINK_DB_PATH')}/search_results${file.nBundledetailid}.csv`),
        cKeeptype: jobData.cKeeptype || 'R'
      }
      // return;
      let res = await this.db.executeRef('hyperlink_update_documents', param);
      if (res.success) {
        try {
          return res.data[0][0];
        } catch (error) {
          return { msg: -1 };
        }
      } else {
        return { msg: -1 };
      }
    } catch (error) {
      console.log('Error in updateHyperlinksForFile', error);
      return { msg: -1 };
    }

  }


  sendUploadResponce(jobData: hyperlinkProcess) {
    this.rds.setValue(jobData.queueName, JSON.stringify(jobData));
    this.utility.emit({ event: 'HYPERLINK-RESPONCE', data: jobData });
  }



  async fetchHyperlinksTerms(jobData: hyperlinkProcess, searchTermsPath: string): Promise<any> {

    let res = await this.getHyperlinkSearchTerms({ nCaseid: jobData.nCaseid, nMasterid: jobData.nMasterid, nSectionid: jobData.nSectionid, cType: jobData.cType || 'E' })
    console.log('\n\r\n\rData Of  terms', res);
    if (res?.length) {
      console.log('creating search terms file');
      // Check if the file exists and delete it if it does
      if (fs.existsSync(searchTermsPath)) {
        fs.unlinkSync(searchTermsPath);
      }
      // const data = res.map((a) => ([a.cTerm, a.nBundledetailid])) || [];
      // console.log('search terms length', data.length);
      // // Create a new JSON file
      // fs.writeFileSync(searchTermsPath, JSON.stringify(data, null, 2));


      // const tempFilePath = path.join(this.config.get('HYPERLINK_OUTPUT_PATH'), `tempSearchTerms.txt`);
      const search_terms = res.map((a) => a.cTerm);
      await fsp.writeFile(searchTermsPath, search_terms.join('\n'));
      console.log('File Written');
    }
    return true;
  }



  async sendNotification(nCaseid: any, nMasterid: string, status: boolean, nBundledetailid?: string) {
    if (!nCaseid) return;
    this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
    try {
      const users = await this.getUploadUser(nCaseid);
      if (users?.length) {
        users.forEach(a => {
          a.cTitle = `Hyperlink`;
          a.cMsg = `Hyperlink ${status ? 'Successful' : 'false'} | Case no. ${a.cCaseno}`;
          a.nBundledetailid = nBundledetailid;
          a.nRefuserid = nMasterid;
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

}
