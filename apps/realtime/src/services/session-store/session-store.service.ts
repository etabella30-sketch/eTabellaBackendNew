import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { promises as fs } from 'fs';
import { SessionService } from '../../session/session.service';
import { CurrentJob } from '../../interfaces/session.interface';
import { UtilityService } from '../../utility/utility.service';
import * as path from 'path';
import Redis from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionStoreService {

  private readonly logger = new Logger(SessionStoreService.name);
  private readonly intervalTime = 5 * 60 * 1000; // 5 minutes
  private readonly sessionData = new Map<number, any>(); // Mock session data structure
  private intervalId: NodeJS.Timeout;

  constructor(private readonly session: SessionService, private utilityService: UtilityService, @InjectRedis() private readonly redis: Redis) {

  }

  onModuleInit() {
  }

  onModuleDestroy() {
  }


  convertSortTimestamp(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }
  sortArray(array) {
    // array.sort((a, b) => {
    //     return this.convertToFrame(a[0]) - this.convertToFrame(b[0]);
    //   });
    array.sort((a, b) => {
      const frameA: any = this.convertSortTimestamp(a?.[0] ?? 0);
      const frameB: any = this.convertSortTimestamp(b?.[0] ?? 0);
      if (frameA !== frameB) return frameA - frameB;

      // 2nd level: sort by a[4]
      // const valA4 = a?.[4] ?? 0;
      // const valB4 = b?.[4] ?? 0;
      // if (valA4 !== valB4) return valA4 - valB4;

      const valA2 = a?.[6] ?? 0;
      const valB2 = b?.[6] ?? 0;
      if (valA2 !== valB2) return valA2 - valB2;
      // // 3rd level: sort by a[2]
      // const valA2 = a?.[2] ?? 0;
      // const valB2 = b?.[2] ?? 0;
      // if (valA2 !== valB2) return valA2 - valB2;

      // // 4th level: sort by a[9]
      // const valA9 = a?.[9] ?? 0;
      // const valB9 = b?.[9] ?? 0;
      // return valA9 - valB9;
    });
  }
  async saveSession(nCaseid: string, nSesid: string) {
    debugger;
    const savePromises = [];
    const currentJob: CurrentJob = this.session.CurrentJob;
    this.sortArray(currentJob.lineBuffer);
    // currentJob.lineBuffer.sort((a, b) => {
    //   return this.utilityService.parseTimeFormate(a[0]) - this.utilityService.parseTimeFormate(b[0]);
    // });
    const sessionDetail: any = await this.session.getSessionDetail(nCaseid, nSesid) //this.session.sessionsList.find(a => a.nSesid == nSesid);
    if (!sessionDetail) return false;
    if (sessionDetail.cProtocol == 'C') return true;
    const savePath = `localdata/dt_${nSesid}`;
    try {
      await fs.mkdir(savePath, { recursive: true });
    } catch (error) {
    }

    try {
      const feeddata = currentJob.lineBuffer
      const pageDataLength = sessionDetail.nLines || 25;
      if (feeddata && feeddata.length) {
        const totalpages = Math.ceil(feeddata.length / pageDataLength);
        for (let i = totalpages; i >= 1; i--) {
          const pageData = this.getPageData(feeddata, i, pageDataLength);
          const savePromise = fs
            .writeFile(`${savePath}/page_${i}.json`, JSON.stringify(pageData, null, 2))
            .then(() => {
              this.logger.log(`Session ${nSesid} saved to page ${i}`);
            })
            .catch((error) => {
              this.logger.error(`Error saving session ${nSesid}:`, error);
            });
          savePromises.push(savePromise);
        }
      }
      await Promise.all(savePromises);
    } catch (error) {

    }

    try {
      await this.deleteAllLinesForFeed(nSesid)
    } catch (error) {
    }

    try {
      await this.redis.del(`session:job:${nSesid}`);
    } catch (error) {
    }

  }

  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }


  // REDIS OPERATIONS


  async saveMetaData(nSesid: any, currentJob: CurrentJob): Promise<boolean> {
    try {
      if (!nSesid) return;
      const obj = {
        lineCount: currentJob.lineCount,
        currentLineNumber: currentJob.currentLineNumber,
        currentTimestamp: currentJob.currentTimestamp,
        currentFormat: currentJob.currentFormat,
        currentPage: currentJob.currentPage,
        oldLineData: currentJob.oldLineData,
        relaceLines: currentJob.relaceLines,
        isRefresh: currentJob.isRefresh,
        refreshTimeStamp: currentJob.refreshTimeStamp
      };
      const key = `session:job:${nSesid}`;
      const value = JSON.stringify(obj);
      await this.redis.set(key, value);
    } catch (error) {
      console.log(error);
    }
    return true;
  }



  async fetchSessionMetaData(nSesid: string): Promise<any> {
    try {

      if(!nSesid) return {};
      const values = await this.redis.get(`session:job:${nSesid}`);

      return values ? JSON.parse(values) : {}
    } catch (error) {

    }
    return {};
  }


  /**
   * Save a line to Redis.
   * @param nSesid - Feed ID.
   * @param unicid - Unique line ID.
   * @param lineData - The line data to save.
   * @returns {Promise<boolean>} - Whether the data was saved.
   */
  async saveLine(nSesid: any, unicid: number, lineData: any): Promise<number> {
    try {
      if (!unicid) {
        unicid = Number(process.hrtime.bigint().toString()); // uuidv4();
        if (!lineData[6])
          lineData[6] = unicid;
      }

      const key = `feed:${nSesid}:${unicid}`;
      const value = JSON.stringify(lineData);

      // SET will insert if the key doesn't exist or update if it does
      await this.redis.set(key, value);

      // console.log(`Key ${key} has been inserted/updated`);
      return unicid;
    } catch (error) {
      console.error('Error saving line to Redis:', error);
      return unicid;
    }
  }


  /**
   * Delete a line from Redis.
   * @param nSesid - Feed ID.
   * @param unicid - Unique line ID.
   * @returns {Promise<boolean>} - Whether the deletion was successful.
   */
  async deleteLine(nSesid: any, unicid: number): Promise<boolean> {
    try {
      const key = `feed:${nSesid}:${unicid}`;
      const deletedCount = await this.redis.del(key);
      return deletedCount > 0;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  /**
   * Delete all lines for a specific nSesid.
   * @param nSesid - Feed ID.
   * @returns {Promise<number>} - Count of deleted keys.
   */
  async deleteAllLinesForFeed(nSesid: any): Promise<number> {
    try {
      const keys = await this.redis.keys(`feed:${nSesid}:*`);
      if (keys.length > 0) {
        const deletedCount = await this.redis.del(...keys);
        return deletedCount;
      }
      return 0;
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  /**
   * Retrieve a line from Redis.
   * @param nSesid - Feed ID.
   * @param unicid - Unique line ID.
   * @returns {Promise<any | null>} - The retrieved line data, or null if not found.
   */
  async getLine(nSesid: string, unicid: number): Promise<any | null> {
    const key = `feed:${nSesid}:${unicid}`;
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  /**
   * Retrieve all data for a specific session.
   * @param nSesid - The session ID.
   * @returns {Promise<any[]>} - An array of all lines for the session.
   */
  async getAllLinesForSession(nSesid: any): Promise<any[]> {
    try {
      if(!nSesid) return [];
      // Find all keys for the session
      const keys = await this.redis.keys(`feed:${nSesid}:*`);
      if (keys.length === 0) {
        return []; // No data found
      }
      // Retrieve all values for the session keys
      const values = await this.redis.mget(...keys);

      // Parse the values into JSON objects
      const parsedValues = values.map((value) => JSON.parse(value || '[]'));

      return parsedValues;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async removeLinesFromRedis(nSesid: any, removedData: any[]): Promise<void> {
    try {
      if (removedData.length === 0) {
        console.log('No keys to remove from Redis.');
        return;
      }

      // Build the Redis keys for the removed data
      const keysToDelete = removedData.map((a) => `feed:${nSesid}:${a}`);
      // console.log('REMOVING KEYS', keysToDelete)
      // Remove all keys from Redis in one operation
      const deletedCount = await this.redis.del(...keysToDelete);

      // console.log(`Successfully removed ${deletedCount} keys from Redis.`);
    } catch (error) {
      console.error('Error while removing lines from Redis:', error);
    }
  }
}
