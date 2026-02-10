import { Processor, Process } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { hyperlinkFiles, hyperlinkProcess, hyperlinkReq } from '../interfaces/hyperlink.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { HyperlinksearchService } from '../services/hyperlinksearch/hyperlinksearch.service';
import { UtilityService } from '../services/utility/utility.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import { jobDetail } from 'apps/upload/src/interfaces/unzip.interface';

@Processor('hyperlink-index-queue')
export class HyperLinkIndexProcessor {
  private readonly logApp: string = 'hyperlink';
  constructor(
    private config: ConfigService, private readonly rds: RedisDbService, private readonly db: DbService,
    private readonly logService: LogService, private hyperlinksearchService: HyperlinksearchService, private readonly utility: UtilityService
  ) {

  }

  @Process({ concurrency: 5 }) //
  async handleHyperlink(job: Job) {
    debugger;
    const jobData: hyperlinkProcess = job.data;


    this.sendUploadResponce(jobData);
    console.log('Processing hyperlink for ', jobData.queueName);
    this.logService.info(`Processing hyperlink for ${jobData.queueName}`, this.logApp);
    const files: hyperlinkFiles[] = await this.getHyperlinkfiles({ nBundledetailid: jobData.nBundledetailid, nBundleid: null, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });

    const search_terms = [];
    const search_termsWithbundle = []
    try {

      const res = await this.getTerms({ nBundledetailid: jobData.nBundledetailid, nBundleid: null, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });
      // console.log('Search terms', res);
      if (res.length) {
        search_terms.push(...(res[0] || []).map(x => x.cTerm));
        search_termsWithbundle.push(...res[1] || []);
      }
    } catch (error) {
      console.log('Error in getting search terms', error);
      this.logService.info(`Processing hyperlink index error ${jobData.queueName}`, this.logApp);
      jobData.cStatus = 'F';
      this.sendUploadResponce(jobData);
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
      return;
    }
    // console.log('Setp next for term', search_terms);

    if (!search_terms.length) {
      console.log('No search term result found');
      this.logService.info(`No search term result found ${jobData.queueName}`, this.logApp);
      jobData.cStatus = 'C';
      this.sendUploadResponce(jobData);;
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, true);
      return;
    }

    // console.log('Check for output path');



    const outputPath = this.config.get('HYPERLINK_OUTPUT_PATH')

    console.log('Find output path', outputPath);
    try {
      await fs.access(outputPath);
    } catch (error) {
      await fs.mkdir(outputPath, { recursive: true });
    }

    console.log('Directory access', outputPath, files.length);


    this.logService.info(`File length ${files.length}`, this.logApp);
    jobData.nTotal = files.length;
    console.log('Send upload responce');
    this.sendUploadResponce(jobData);

    try {
      console.log('searchTermsPath', files.length);
      for (let x of files) {

        const tempFilePath = path.join(this.config.get('HYPERLINK_OUTPUT_PATH'), `tempSearchTerms${x.nBundledetailid}.txt`);

        await fs.writeFile(tempFilePath, search_terms.join('\n'));

        const searchResults = [];
        // console.log('Process start')
        const res = await this.hyperlinksearchService.createIndexHyperlinkFile(x, jobData, tempFilePath, searchResults, search_termsWithbundle);
        // console.log('\n\r\n\rRESULT',JSON.stringify(searchResults));
        if (res) {
          this.logService.info(`Hyperlink created for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
          await this.updateHyperlinksForFile(x, jobData, 'C', searchResults);
          jobData.nCompleted++;
        } else {
          this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
          await this.updateHyperlinksForFile(x, jobData, 'F', searchResults);
          jobData.nFailed++;
        }
        this.sendUploadResponce(jobData);
      }
      jobData.cStatus = 'C';
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, true);
    } catch (error) {
      jobData.cStatus = 'F';
      this.logService.info(`Error in hyperlink  ${jobData.queueName}`, this.logApp);
      this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
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



  async getTerms(query: hyperlinkReq): Promise<any> {
    query["ref"] = 2;
    let res = await this.db.executeRef('hyperlink_index_searchterms', query);
    if (res.success) {
      try {
        return res.data;
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

  async updateHyperlinksForFile(file: hyperlinkFiles, jobData: hyperlinkProcess, cStatus: 'C' | 'F', searchResults: any[]): Promise<any> {
    const param = {
      nMasterid: jobData.nMasterid,
      nSectionid: jobData.nSectionid,
      nBundledetailid: file.nBundledetailid,
      cType: jobData.cType,
      cStatus: cStatus,
      jAnnotations: JSON.stringify(searchResults || []),
      cKeeptype: jobData.cKeeptype || 'R'
    }
    // this.logService.info(JSON.stringify(param), this.logApp);
    let res = await this.db.executeRef('hyperlink_update_documents_index', param);
    if (res.success) {
      try {
        return res.data[0][0];
      } catch (error) {
        return { msg: -1 };
      }
    } else {
      return { msg: -1 };
    }
  }


  sendUploadResponce(jobData: hyperlinkProcess) {
    this.rds.setValue(jobData.queueName, JSON.stringify(jobData));
    this.utility.emit({ event: 'HYPERLINK-RESPONCE', data: jobData });
  }

  async sendNotification(nCaseid: any, nMasterid: string, status: boolean) {
    if (!nCaseid) return;
    this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
    try {
      const users = await this.getUploadUser(nCaseid);
      if (users?.length) {
        users.forEach(a => {
          a.cTitle = `Hyperlink`;
          a.cMsg = `Hyperlink ${status ? 'Successful' : 'false'} | Case no. ${a.cCaseno}`;
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
