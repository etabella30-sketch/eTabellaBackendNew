import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import async from 'async';
import { UtilityService } from '../utility/utility.service';
import { SessionManager } from './sessionData';
import { Server } from 'socket.io';
import * as fs from 'fs';
import * as path from 'path';

import { promises as fsP } from 'fs';
import { feedPage } from '../../interfaces/feed.interface';


@Injectable()
export class FeedDataService {
  private readonly queue;
  manager = new SessionManager();
  delayofSession: number = 10;
  // current_refresh: number = 0;
  logger = new Logger(FeedDataService.name);
  constructor(@Inject('WEB_SOCKET_SERVER') private io: Server, private readonly db: RedisDbService, private log: LogService, private readonly util: UtilityService) {
    this.queue = async.queue(async (task, callback) => {
      try {
        await task();
      } catch (error) {
      }
      callback();
    }, 1);
    this.queue.drain(() => {
    });


    this.queue.push(async () => {
      await this.onInitService();
    });


  }

  checkSessionExists(sessionId) {
    return this.manager.hasSession(sessionId);
  }

  sessionTotalPages(sessionId) {
   return this.manager.getTotalPages(sessionId)
  }

  async onInitService(): Promise<boolean> {
    try {
      console.log('Initializing service and loading data from Redis...');

      // Get all session keys from Redis
      const sessionKeys = await this.db.scanKeys('session:*');
      const sessionMap: { [sessionId: string]: { [page: number]: any[] } } = {};

      for (const key of sessionKeys) {
        const [_, sessionId, page] = key.split(':'); // Extract sessionId and page number
        const pageData = await this.db.getValue(key); // Fetch page data from Redis

        if (pageData) {
          const parsedData = JSON.parse(pageData); // Parse the JSON data
          sessionMap[sessionId] = sessionMap[sessionId] || {}; // Ensure session exists
          sessionMap[sessionId][Number(page)] = parsedData; // Add page data
        }
      }

      // Populate SessionManager with loaded data
      for (const sessionId in sessionMap) {
        for (const pageNumber in sessionMap[sessionId]) {
          this.manager.setPageData(sessionId, Number(pageNumber), sessionMap[sessionId][pageNumber]);
        }
      }

      console.log('Session data successfully loaded into memory.');
    } catch (error) {
      console.error('Error during initialization:', error);
      this.log.error(`Error during initialization: ${error.message}`, `feed/global`);
      return false;
    }
    return true;
  }

  // MANGE LOCAL SESSION SETUP
  async getPage(sessionId, pageNumber): Promise<any[]> {
    try {
      if (this.manager.hasPage(sessionId, Number(pageNumber))) {
        return this.manager.getPageData(sessionId, Number(pageNumber)) || [];
      }
      // RETURN DATA FROM REDIS
      const pageData = JSON.parse(await this.db.getValue(`session:${sessionId}:${pageNumber}`) || '[]') || [];
      if (pageData?.length) {
        this.manager.setPageData(sessionId, Number(pageNumber), pageData);
      }
      return pageData
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return [];
    }
  }

  async setPage(sessionId, pageNumber, Data: any[]): Promise<boolean> {
    try {
      this.manager.setPageData(sessionId, Number(pageNumber), Data);
      //SET DATA TO REDIS HERE
      await this.db.setValue(`session:${sessionId}:${pageNumber}`, JSON.stringify([...Data]), 48 * 3600);
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return true;
  }


  // RECEIVED DATA HERE
  feedReceive(msg: any) {
    try {
      const nSesid = msg?.date;
      if (!nSesid) {
        this.log.error(`Session id not found`, `feed/${0}`);
        return
      };
    } catch (error) {

    }

    this.queue.push(async () => {
      await this.addLiveFeedData(msg);
    });
  }

  refreshReceive(msg: any) {
    try {

      const nSesid = msg?.nSesid;
      if (!nSesid) {
        this.log.error(`Session id not found`, `feed/${0}`);
        return
      };
    } catch (error) {

    }
    try {
      this.printRecRefresh(msg, `Refresh data receive ${JSON.stringify(msg)} `);
    } catch (error) {

    }

    this.queue.push(async () => {
      await this.saveRefreshData(msg);
    });
  }

  async printRecRefresh(msg: any, data: any) {
    try {
      const sessionDir = `logs/s_${msg.nSesid}`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      const log_msg = `${data}n\r\n\r\n`
      fs.appendFile(`${sessionDir}/refreshcmd.txt`, log_msg + '\n', (err) => {
        if (err) {
          console.error('Error appending to file:', err);
          throw err;
        }
        console.log('File updated successfully!');
      });
    } catch (error) {
      // console.log('ERROR', error);
    }

  }


  // MANAGE FEEDS HERE
  async addLiveFeedData(res: any): Promise<boolean> {
    try {
      const parsedData = res.d || [];
      const formattedData = parsedData
        .map(item => [
          item[0] || "00:00:00:00",
          item[1] || [],
          item[2],
          item[3],
          item[4],
          item[5],
          item[6],
          item[7] || [],
          item[8] || 0
        ])
        .filter(item => item[2] > -1); // Filter valid items

      await this.updateFeedData(formattedData, res);

    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
    }
    return true;
  }

  async updateFeedData(formattedData: any, res): Promise<boolean> {
    try {
      const lineNo = 25;
      for (const item of formattedData) {
        const pageIndex = Math.floor(item[2] / lineNo);
        const lineIndex = item[2] % lineNo;
        // Retrieve existing page data or initialize as an empty array
        let page = (await this.getPage(res.date, pageIndex + 1)) || [];
        // Update the specific line index
        page[lineIndex] = item;
        // Ensure no undefined entries in the page
        page = page.map((entry, index) =>
          entry ?? ['00:00:00:00', [], index]
        );
        // Save updated data
        await this.setPage(res.date, pageIndex + 1, page);
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
    }
    return;
  }


  // MANAGE REFRESH DATA
  // FIXME: It should only refresh data after that page
  async saveRefreshData(msg): Promise<boolean> {
    msg.current_refresh = msg?.current_refresh || 0;

    // if (this.current_refresh > 1) return;;
    debugger;
    try {
      // Read session data and remove specified timestamps
      const sessiondata = await this.getSessionAllData(msg.nSesid);
      this.util.sortArray(sessiondata);

      await this.logOfData(msg.nSesid, `Refresh timestamp ${[msg.start, msg.end].join(' ')}`, [], msg.current_refresh);

      await this.logOfData(msg.nSesid, `Befour ${msg.current_refresh}`, sessiondata, msg.current_refresh);

      let { newData, removedData } = this.util.removeTimestampsInRange(sessiondata, [msg.start, msg.end], msg?.refreshType)


      await this.logOfData(msg.nSesid, `Removed lines \n `, removedData, msg.current_refresh);
      // Add new lines if provided
      if (msg.newLines?.length) newData.push(...msg.newLines);

      await this.logOfData(msg.nSesid, `\n\n New lines \n `, msg.newLines || [], msg.current_refresh);
      // Sort data by frame
      // newData.sort((a, b) => this.util.convertToFrame(a[0]) - this.util.convertToFrame(b[0]));

      this.util.sortArray(newData);
      // Split data into pages and save
      const pageSize = 25;
      const totalPages = Math.ceil(newData.length / pageSize);

      for (let i = 0; i < totalPages; i++) {
        const pageData = newData.slice(i * pageSize, (i + 1) * pageSize);
        const pageNumber = i + 1;

        // Save page data
        await this.setPage(msg.nSesid, pageNumber, pageData);
      }

      await this.logOfData(msg.nSesid, `After ${msg.current_refresh}`, newData, msg.current_refresh);

      // TODO: REMOVE EXTRA PAGES IF EXISTS
      await this.deleteExtraPages(msg.nSesid, totalPages)
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${msg.nSesid}`);
    }
    return true;
  }






  async logOfData(nSesid, val, feedlist, current_refresh): Promise<boolean> {
    try {

      this.util.sortArray(feedlist);

      const allDts = feedlist.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`)
      const log_msg = `${val}  \n ${allDts}`;

      const sessionDir = `logs/s_${nSesid}/refresh`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/refreshlog_${current_refresh}.txt`, log_msg + '\n ');
    } catch (error) {
      console.log(error);
    }
    return true;
  }






  async deleteExtraPages(sessionId, maxPage): Promise<boolean> {
    try {
      const pages = Object.keys(await this.readSessionData(sessionId));
      for (let x of pages) {
        if (Number(x) > maxPage) {
          await this.manager.deletePageData(sessionId, Number(x));
        }
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    try {
      await this.db.deleteSessionPages(sessionId, maxPage);
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return true;
  }

  async getSessionAllData(sessionId: string): Promise<any[]> {
    try {
      const sessionData = await this.readSessionData(sessionId);
      if (sessionData) {
        return Object.values(sessionData).flat();
      }
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return [];
  }


  /*async readSessionData(sessionId: string): Promise<{ [page: number]: any[] }> {
    try {
      let Obj = {};
      if (this.manager.hasSession(sessionId)) {
        Obj = await this.manager.getSessionData(sessionId);
      };
      // Fetch from Redis
      if (!Obj || !Object.keys(Obj).length) {
        const data = await this.db.getAllValues(`session:${sessionId}:*`);
        if (data) {
          Obj = data;
        }
      }
      return Obj
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }
    return {};
  }*/

  async readSessionData(sessionId: string): Promise<{ [page: number]: any[] }> {
    try {
      let sessionData: { [page: number]: any[] } = {};

      // Check if session data exists in memory
      if (this.manager.hasSession(sessionId)) {
        sessionData = await this.manager.getSessionData(sessionId);
      }

      // If memory data is not found, fetch from Redis
      if (!sessionData || Object.keys(sessionData).length === 0) {
        const redisData = await this.db.getAllValues(`session:${sessionId}:*`);
        if (redisData) {
          sessionData = redisData;
        }
      }

      return sessionData;
    } catch (error) {
      console.log(error);
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return {};
    }
  }


  // STREAM DATA FOR PREVIOUS
  async streamSessionData(socketId, body, qFacts: any[], qMarks: any[]) {
    const sessionId = body?.nSesid;
    try {
      const sessionData = await this.readSessionData(sessionId);
      const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))

      this.logger.verbose(`(LOCAL-SESSION) There are ${pages?.length} files in the directory.`)
      if (!pages?.length) return;

      for (let x of pages) {
        const pg = Number(x[0]);
        const pageData = x[1] || [];
        const aDATA = [], hDATA = [];
        try {
          if (qFacts) {
            aDATA.push(...qFacts.filter(a => Number(a.pageIndex) == pg));
          }
          if (qMarks) {
            hDATA.push(...qMarks.filter(a => Number(a.cPageno) == pg));
          }
        } catch (error) {
          console.log(error);
          this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
        this.io["server"].to(socketId).emit('previous-data', { msg: 1, page: pg, data: JSON.stringify(pageData || []), totalPages: pages.length, nSesid: sessionId, a: aDATA, h: hDATA, tab: body?.tab });

        await this.util.delay(this.delayofSession)
      }
    } catch (error) {
      console.log(error);


      this.logger.error(`Error`, error?.message)
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
    }

  }





  async getSessionPagesData(nSesid: string, reqPages: number[]): Promise<{ total: number, feed: feedPage[] }> {
    const sessionId = nSesid;
    try {
      const sessionData = await this.readSessionData(sessionId);
      const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))
      if (!pages?.length) return { total: 0, feed: [] };
      const finalPages = pages.filter(a => reqPages.includes(Number(a[0])))
      const result = [];
      for (let x of finalPages) {
        const page = Number(x[0]);
        const data = x[1] || [];
        result.push({ page, data });
      }
      return { total: pages?.length, feed: result };
    } catch (error) {
      this.logger.error(`Error`, error?.message)
      this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
      return { total: 0, feed: [] };
    }

  }




  // ON SESSION END
  async sessionEnd(sessionId: string): Promise<void> {
    try {
      // Get all session data from memory and Redis
      const sessionData = await this.readSessionData(sessionId);

      if (!sessionData || Object.keys(sessionData).length === 0) {
        console.log(`No data found for session ${sessionId}`);
        this.log.error(`No data found for session ${sessionId}`, `feed/${sessionId}`);
        return;
      }

      // Define the base directory for the session
      const baseDir = path.resolve(`data/dt_${sessionId}`);

      // Ensure the directory exists
      if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
      }

      // Write each page's data to a separate JSON file
      for (const page in sessionData) {
        const filePath = path.join(baseDir, `page_${page}.json`);
        const pageData = sessionData[page];

        // Save page data to JSON file
        await fs.promises.writeFile(filePath, JSON.stringify(pageData, null, 2), 'utf-8');
        console.log(`Saved page ${page} of session ${sessionId} to ${filePath}`);
      }

      // Remove session data from memory
      this.manager.deletePageData(sessionId, -1); // Pass -1 to clear all pages
      console.log(`Session ${sessionId} data cleared from memory.`);

      // Delete all pages of the session from Redis
      await this.db.deleteSessionPages(sessionId, 0); // Infinity ensures all pages are deleted
      console.log(`Session ${sessionId} data cleared from Redis.`);
    } catch (error) {
      console.error(`Error handling session end for session ${sessionId}:`, error);
      this.log.error(`Error handling session end: ${error.message}`, `feed/${sessionId}`);
    }
  }

}