import { Injectable } from '@nestjs/common';
import { SessionService } from '../../session/session.service';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class SessionBackupService {
  constructor(
    private readonly session:SessionService,
    private dblite: SqllitedbService){

  }

  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }


  async syncFeedToOffline(nSesid: any): Promise<any> {
    try {
      const sessionDetail:any = [] // this.session.sessionsList.find(a => a.nSesid == nSesid);
      if (!sessionDetail) return false;

      if (sessionDetail.cProtocol == 'C') return true;

      const savePath = `localdata/dt_${nSesid}`;

      const feeddata = await this.dblite.fetchFeed('nSesid = ?', [nSesid]);
      const pageDataLength = sessionDetail.nLines || 25;
      if (feeddata && feeddata.length) {
        const totalpages = Math.ceil(feeddata.length / pageDataLength);
        for (let i = totalpages; i >= 1; i--) {
          const pageData = this.getPageData(feeddata, i, pageDataLength);
          await this.writeJSONToFile(pageData, `${savePath}/page_${i}.json`);
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async writeJSONToFile(obj, filePath): Promise<any> {
    try {
      const fullPath = path.resolve(filePath);
      const dirPath = path.dirname(fullPath);
      await fs.mkdir(dirPath, { recursive: true });
      const jsonData = JSON.stringify(obj, null, 2);
      await fs.writeFile(fullPath, jsonData);
      // console.log("JSON successfully written to", fullPath);
    } catch (err) {
      console.error("Error writing file:", err);
    }
    return true;
  }

}
