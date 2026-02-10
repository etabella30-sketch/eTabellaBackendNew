import { Injectable } from '@nestjs/common';

import { promises as fs } from 'fs';
import * as path from 'path';

@Injectable()
export class SavedataService {
  // Add your methods and logic here

  private getSessionState(nSisid: number, sessions) {
    if (!sessions.has(nSisid)) {
      sessions.set(nSisid, {
        sessionDate: '',
        currentPageData: [],
        pageNumber: 1,
      });
    }
    return sessions.get(nSisid);
  }

  public async saveData(msg: any, sessions, folerName: string, calculatedPage: any, currentSessionLines?: number) {
    if (!currentSessionLines) {
      currentSessionLines = 25;
    }
    if (!msg || !msg.d || !msg.d.length) return;
    try {
      // console.log('\n\r\n\rSAVE DATA',msg,sessions,folerName,currentSessionLines)
      let sessionState = this.getSessionState(msg.date, sessions);
      // let calculatedPage = Math.floor(msg.d[msg.d.length - 1][2] / currentSessionLines) + 1;

      // console.log('\n\r\n\rCALC PAGE',calculatedPage,sessionState.pageNumber)
      if (calculatedPage !== sessionState.pageNumber) {
        this.writeJSONToFile(sessionState.currentPageData, `./${folerName}/dt_${msg.date}/page_${sessionState.pageNumber}.json`)
        sessionState.currentPageData = [];
        console.log('\n\r\n\rCLEARING OLS DATA for page')
        sessionState.pageNumber = calculatedPage;
      }
      this.pushDataToArray(msg, sessionState, folerName, currentSessionLines);
    } catch (error) {
      console.log('error at saveData', error);
    }

  }

  public async saveLostData(data: any, pageNumber: any, sessionId: number) {
    try {
      if (sessionId && data && pageNumber) {
        this.writeJSONToFile(data, `./data/dt_${sessionId}/page_${pageNumber}.json`);
      }
    } catch (error) {
      console.log('error at saveLostData', error);
    }
  }

  private pushDataToArray(msg: any, sessionState: any, folerName: string, currentSessionLines: number) {
    let crLine;
    for (let y of msg.d) {
      if (y.length && y[2] !== undefined) {
        let vl: any = (y[2] / currentSessionLines) + 1;
        let tmpPg = parseInt(vl)
        if (tmpPg == sessionState.pageNumber) {
          let vl2: any = ((y[2] % currentSessionLines));
          crLine = parseInt(vl2);
          sessionState.currentPageData[crLine] = y;
        }
      }
    }
    this.writeJSONToFile(sessionState.currentPageData, `./${folerName}/dt_${msg.date}/page_${sessionState.pageNumber}.json`)
  }

  async writeJSONToFile(obj, filePath) {
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
  }

  public async saveDataFinal(data: any, sessions: any, folderName: string, pageNumber: number, currentSessionLines?: number) {
    try {
      if (data && folderName && pageNumber) {
        const sessionId = data.date;
        const filePath = `./${folderName}/dt_${sessionId}/page_${pageNumber}.json`;
        await this.writeJSONToFile(data, filePath);
      }
    } catch (error) {
      console.log('error at saveDataFinal', error);
    }
  }
}