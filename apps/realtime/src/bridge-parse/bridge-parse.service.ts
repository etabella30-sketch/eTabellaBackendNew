import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { SessionService } from '../session/session.service';
import { UtilityService } from '../utility/utility.service';
import { CurrentJob } from '../interfaces/session.interface';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { SocketService } from '../socket/socket.service';
import { Server } from 'socket.io';
import * as fs from 'fs';
import { SqllitedbService } from '../services/sqllitedb/sqllitedb.service';
import async from 'async';
// import { ParseCommandService } from '../services/parse-command/parse-command.service';
import { promises as fsP } from 'fs';
import { SequentialTaskQueue } from '../classes/squential.task';
import { SessionStoreService } from '../services/session-store/session-store.service';
import { VerifyTabsService } from '../services/verify-tabs/verify-tabs.service';
import { QueryService } from '../services/query/query.services';
import { DbService } from '@app/global/db/pg/db.service';
import { feedFormate, logJson, searchResponse } from '../interfaces/transfer.interface';
import { TransferHighlightsService } from '../transfer/transfer-highlights/transfer-highlights.service';
import { FuzzySearchService } from '../transfer/fuzzy-search/fuzzy-search.service';
import pLimit from 'p-limit';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { IdentityFixService } from '../services/identity-fix/identity-fix.service';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class BridgeParseService implements OnApplicationBootstrap {
  private server: Server;
  public setServer(server: Server) {
    this.server = server;
  }

  private logger = new Logger('bridge-viewer');
  private readonly queue;
  formates: { key: any, value: feedFormate }[] = [{ key: `0x00`, value: 'FL' },
  { key: 0x01, value: 'QES' },
  { key: 0x02, value: 'ANS' },
  { key: 0x03, value: 'SPKR' },
  { key: 0x04, value: 'QES-CONTINUE' },
  { key: 0x05, value: 'ANS-CONTINUE' },
  { key: 0x06, value: 'SPKR-CONTINUE' },
  { key: 0x07, value: 'PRNTH' },
  { key: 0x08, value: 'CNTRD' },
  { key: 0x09, value: 'RHT-FLS' },
  { key: 0x0A, value: 'BY-LINE' },
  { key: 0x0B, value: 'BY-LINE-CONTINUE' },
  { key: 0x0C, value: 'USR-DEFIND' }];
  isChecked: boolean = false;
  isContinue: number = 0;

  isComplete: boolean = false;
  cmds: number = 0;
  // current_refresh: number = 0;
  taskQueue = new SequentialTaskQueue();


  @OnEvent('session.store.fetchmetadata')
  handleUserCreatedEvent(payload: any) {
    debugger;
    console.log(' event received:', payload);
    this.fetchSessionFeedToLocal(payload.nSesid);
  }

  @OnEvent('bridge.data.cmd.event')
  handleC(payload: any) {
    console.log('bridge.data.cmd.event event received:', payload);
    this.cmds = payload?.data || [];
  }

  constructor(private utilityService: UtilityService, private readonly sessionService: SessionService,
    public savedataService: SavedataService, private readonly socketService: SocketService,
    // private sqlLiteService: SqllitedbService,
    private readonly sessionStore: SessionStoreService,
    private readonly verifyTab: VerifyTabsService, private readonly queryService: QueryService,
    private db: DbService,
    private readonly transferHighlightsService: TransferHighlightsService,
    private readonly fuzzySearch: FuzzySearchService,
    private dateTime: DateTimeService,
    private identityFixService: IdentityFixService
    // , private readonly parseCommandService: ParseCommandService
  ) {

    /*this.queue = async.queue(async (task, callback) => {
      try {
        await task();
      } catch (error) {
      }
      callback();
    }, 1);

    this.queue.drain(() => {
      // console.log("\n All tasks have been processed", new Date());
    });*/

    // setTimeout(() => {
    //   const currentJob = {lineBuffer : []} as CurrentJob;
    //   this.splitCommands(Buffer.from('0203'), {},currentJob, {});
    // }, 5000)
  }
  // splitCommands(incomingBuffer: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any): void {

  async onApplicationBootstrap() {
    /* const isInit = await this.sessionService.reInitSessions(-1);
     if (isInit) {
       try {
         this.verifyTab.getAllCaseTabs(this.sessionService.currentSessionid);
       } catch (error) {
       }
       this.taskQueue.addTask(async () => {
         await this.fetchSessionFeedToLocal(this.sessionService.currentSessionid);
       });
     }*/
  }


  async fetchSessionFeedToLocal(nSesid: string): Promise<boolean> {
    try {
      debugger;
      // console.log('REFETCHING DAAT', nSesid, this.sessionService.sessionsList?.length)

      const sessionData = await this.sessionStore.fetchSessionMetaData(nSesid);

      // console.log('SESSION ON REDIS', sessionData)
      if (Object.keys(sessionData)?.length) {
        this.sessionService.CurrentJob = Object.assign(this.sessionService.CurrentJob, sessionData);

        const sessions = await this.sessionStore.getAllLinesForSession(nSesid);
        // console.log('SESSION LS', sessions?.length);
        // sessions.sort((a, b) => {
        //   return this.convertToFrame(a[0]) - this.convertToFrame(b[0]);
        // });

        this.sortArray(sessions);
        this.sessionService.CurrentJob.lineBuffer = sessions;
      }

    } catch (error) {
      console.log(error);
    }
    return true;
  }


  SendToParseData(incomingBuffer: Buffer, CMD_DATA: any, currentSession: any, currentJob: CurrentJob, sessions: any): void {
    // console.log('incomingBuffer', incomingBuffer,'NEW DATA=>',incomingBuffer.toString('hex'));
    // console.warn("\n Task Start", new Date());
    /*this.queue.push(async () => {
      await this.startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
      this.cmds++
      console.log(this.cmds)
      // console.log('LINE',currentJob.lineBuffer)
    });*/

    this.taskQueue.addTask(async () => {
      try {
        const startOn = new Date();
        await this.startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
        this.cmds++
        // ,`start : ${startOn} end : ${new Date()}`
        // console.log(this.cmds, 'Task ', new Date().getTime() - startOn.getTime())
        // console.log(this.cmds)
      } catch (error) {

      }
    });

  }




  async startProcess(incomingBuffer: Buffer, CMD_DATA: any, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<boolean> {

    try {
      await this.getParseCMDS(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
      return true;
    } catch (error) {
      console.error('Error processing buffer:', error);
      return false;
    }

  }


  async getParseCMDS(incomingBuffer: Buffer, CMD_DATA: any, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<any> {

    try {
      try {
        const buffer = Buffer.from(CMD_DATA["hexCmd"], 'hex');
        const CMDdata = CMD_DATA



        await this.parseDataBridge(buffer, CMDdata, currentSession, currentJob, sessions);
      } catch (error) {
        console.log('ERROR', error);

      }


    } catch (error) {
      console.log('ERROR', error);
      // resolve([]);
    }

    return true
    // })
  }

  async parseDataBridge(incomingBuffer: Buffer, CMDdata: any, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<boolean> {


    if (CMDdata.cmdType) {
      await this.handleCommand(CMDdata.cmdType, CMDdata, incomingBuffer, currentJob, currentSession, sessions);
    } else {
      for (let i = 0; incomingBuffer.length > i; i++) {
        await this.handleText(incomingBuffer[i], currentJob);
      }
    }

    try {
      currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    } catch (error) {
    }
    return true;
  }


  convertSortTimestamp(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }
  // [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];
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

      // const valA2 = a?.[5] ?? 0;
      // const valB2 = b?.[5] ?? 0;
      // if (valA2 !== valB2) return valA2 - valB2;

      // // 4th level: sort by a[9]
      // const valA9 = a?.[9] ?? 0;
      // const valB9 = b?.[9] ?? 0;
      // return valA9 - valB9;
    });

    try {
      array.map((line, index) => line[2] = index);
    } catch (error) {

    }
  }

  async handleCommand(command: string, CMDdata: any, data: Buffer, currentJob: CurrentJob, currentSession: any, sessions: any): Promise<boolean> {
    const LINES_PER_PAGE = 25; // Assuming each page has 25 lines
    // console.log('COMMAND', command);
    try {
      switch (command) {
        case 'P': // Page Number Command
          await this.finalizeLine(currentJob);
          if (data.length >= 2) {
            // console.log('Page Number Command', data, data.readUInt16LE(2));
            currentJob.currentPage = data.readUInt16LE(2); // Little-endian
            this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
          }
          break;
        case 'N': // Line Number Command
          await this.finalizeLine(currentJob);
          if (data.length >= 1) {
            const receivedLineNumber = data.readUInt8(2);


            currentJob.currentLineNumber = receivedLineNumber;
            // Calculate the actual line count based on the page number
            if (!currentJob.lineCount) {
              currentJob.lineCount = 0;
            }

            // currentJob.id = null;
            if (currentJob.isRefresh) {
              return;
            }
            // currentJob.lineCount++;
            currentJob.lineCount++;
            // const lns = (((currentJob.currentPage - 1) * 25) + receivedLineNumber)
            // currentJob.lineCount = lns > 0 ? lns - 1 : lns //Math.floor((currentJob.lineBuffer?.length - 1) / 25) + 1;
            currentJob.lineBuffer[currentJob.lineCount] = ['', [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null];
            currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);// currentJob.lineBuffer.map(item => !item ? [] : item);
            this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
          }
          break;
        case 'F':
          if (data.length >= 1) {
            const formatCode = data.readUInt8(2);
            const format = this.formates.find(f => parseInt(f.key, 16) === formatCode);
            if (format) {
              currentJob.currentFormat = format.value; // Store the format in currentJob
              currentJob.crLine = [];
              this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
            }
          }
          break;
        case 'T': // Timecode Command
          await this.finalizeLine(currentJob);
          if (data.length >= 4) {
            const hours = this.sliceDate(data.readUInt8(2));
            const minutes = this.sliceDate(data.readUInt8(3));
            const seconds = this.sliceDate(data.readUInt8(4));
            const frames = this.sliceDate(data.readUInt8(5));
            currentJob.currentTimestamp = `${hours}:${minutes}:${seconds}:${frames}`; // Store the timestamp in currentJob


            this.refreshReplaceData(currentJob);
            if (!currentJob.isRefresh) {
              try {
                currentJob.lineBuffer[currentJob.lineCount][0] = currentJob.currentTimestamp;
              } catch (error) {
              }
            }
            await this.updateLineBuffer(currentJob); // Update after deletion
            this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
          }
          break;
        case 'G': // Global Replace Command
          // await this.finalizeLine(currentJob);
          if (CMDdata.searchString) { //&& CMDdata.replaceString
            await this.replaceGlobal(currentJob, CMDdata.searchString, CMDdata.replaceString, sessions);
          }
          /*if (data.length >= 2) {
            console.log('Global Replace Command');
            const searchLength = data.readUInt8(2);
            if (data.length >= 1 + searchLength) {
              const searchString = data.toString('ascii', 1, 1 + searchLength);
              const replaceLength = data.readUInt8(3 + searchLength);
              if (data.length >= 2 + searchLength + replaceLength) {
                const replaceString = data.toString('ascii', 2 + searchLength, 2 + searchLength + replaceLength);
                this.printCommands(`GLOBAL-REPLACE : ${searchString} Rstring:${replaceString}`);
                // await this.replaceGlobal(currentJob, searchString, replaceString, sessions);
              }
            }
          }*/
          break;

        case 'R': // Refresh Command
          // console.log(data, data.toString('hex'));
          // if (data.toString('hex').length != 18) {
          //   break;
          // }


          this.sessionService.current_refresh++
          // console.log('REFRESH START', this.current_refresh, `line = ${currentJob.currentLineNumber} page = ${currentJob.currentPage}`);
          this.isContinue++;




          // currentJob.oldLineCount = currentJob.lineCount;
          this.printCommands(`Replace : ${this.isContinue} \n ${data.toString('hex')}`);


          currentJob.relaceLines = [];
          currentJob.isRefresh = true;

          if (this.sessionService.currentSessionHaveRefresh) {
            currentJob.oldLineData = [currentJob.lineCount, currentJob.currentLineNumber, currentJob.currentTimestamp, currentJob.currentFormat, currentJob.currentPage, currentJob.crLine];

            try {

              // data;
              currentJob.refreshTimeStamp = [`${this.sliceDate(data.readUInt8(2))}:${this.sliceDate(data.readUInt8(3))}:${this.sliceDate(data.readUInt8(4))}:${this.sliceDate(data.readUInt8(5))}`, `${this.sliceDate(data.readUInt8(6))}:${this.sliceDate(data.readUInt8(7))}:${this.sliceDate(data.readUInt8(8))}:${this.sliceDate(data.readUInt8(9))}`];
              this.printCommands(`Time : ${JSON.stringify(currentJob.refreshTimeStamp)}`);

              await this.RefreshLog(currentJob, `_${this.sessionService.current_refresh}`, `BEFORE-- (refresh on ${new Date().toISOString()}) \n ${currentJob.refreshTimeStamp}`)

              // console.log('REFRESH START', data, currentJob.refreshTimeStamp);
            } catch (error) {

            }
          }




          this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
          break;
        case 'E': // End Refresh Command
          // console.log('REFRESH END', this.current_refresh);
          // this.isComplete = true;



          if (this.sessionService.currentSessionHaveRefresh) {
            // try {
            //   const removeLines = currentJob.lineBuffer.filter(a => a && this.utilityService.parseTimeFormate(a[0]) > this.utilityService.parseTimeFormate(currentJob.refreshTimeStamp[0]) && this.utilityService.parseTimeFormate(currentJob.refreshTimeStamp[1]) > this.utilityService.parseTimeFormate(a[0]))
            //   await this.removedLog(currentJob, `_${this.current_refresh}`, `Removed lines -- \n ${currentJob.refreshTimeStamp}`, removeLines)
            // } catch (error) {
            //   console.log('ERROR IN REMOVED', error)
            // }

            await this.refreshLogsLines(currentJob, `_${this.sessionService.current_refresh}`)

            await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Refreshing end executing onRefreshEnd-- \n ${currentJob.refreshTimeStamp}`, [])
            if (currentJob.relaceLines?.length) {
              this.printCommands(`refresh ${this.sessionService.current_refresh} End  \n ${JSON.stringify(currentJob.relaceLines)}`);
              const pagesToRefresh = [];


              const lg_dt3 = new Date();

              await this.onRefreshEnd(currentJob);

              this.logger.debug(`Refresh End ${this.sessionService.current_refresh}`);
              // console.log('    refresh end', new Date().getTime() - lg_dt3.getTime());

            }

            try {
              if (currentJob.oldLineData.length) {
                // currentJob.lineCount = currentJob.oldLineData[0];
                // currentJob.currentLineNumber = currentJob.oldLineData[1];
                // currentJob.currentFormat = currentJob.oldLineData[3];
                // currentJob.currentPage = currentJob.oldLineData[4];
                // currentJob.crLine = currentJob.oldLineData[5];


                const lastData = currentJob.lineBuffer[currentJob.lineBuffer.length - 1];
                currentJob.lineCount = currentJob.lineBuffer.length - 1;
                currentJob.currentLineNumber = lastData[5];
                currentJob.currentTimestamp = lastData[0];
                currentJob.currentFormat = lastData[3];
                currentJob.currentPage = lastData[4];
                currentJob.crLine = lastData[1];
              }
            } catch (error) {

            }


          }



          currentJob.oldLineData = [];
          currentJob.relaceLines = [];
          currentJob.isRefresh = false;

          this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
          // console.log('', `line = ${currentJob.currentLineNumber} page = ${currentJob.currentPage}`);

          let timedeff = '';
          try {
            timedeff = `${currentJob.refreshTimeStamp} ${currentJob.refreshTimeStamp?.length ? currentJob.refreshTimeStamp?.map(this.convertToFrame) : null}`
          } catch (error) {
          }

          await this.RefreshLog(currentJob, `_${this.sessionService.current_refresh}`, `After--(On ${new Date().toISOString()}) \n ${timedeff}`)
          break;
        case 'D': // Delete (Backspace) Command
          try {
            if (!currentJob.crLine.length) {
              currentJob.lineCount = Math.abs(currentJob.lineCount - 1);
              currentJob.crLine = currentJob.lineBuffer[currentJob.lineCount][1];
            } else {
              currentJob.crLine.pop(); // Remove last character
            }
          } catch (error) {

          }

          this.refreshReplaceData(currentJob);
          await this.updateLineBuffer(currentJob);
          break;
        default:
          console.warn(`\n\r\n\rUnknown command: ${command}`);
      }
    } catch (err) {
      console.error('Error handling command:', err.message);
    }

    return true;
  }

  sliceDate(date: any) {
    try {
      return ('0000' + date.toString()).slice(-2);
    } catch (error) {
      return date;
    }

  }

  async handleText(byte: number, currentJob: CurrentJob): Promise<boolean> {
    try {
      if (byte !== 0x08) {
        if (!currentJob.crLine) {
          currentJob.crLine = [];
        }
        currentJob.crLine.push(byte);
      }
      this.refreshReplaceData(currentJob);
      await this.updateLineBuffer(currentJob);
      if (byte === 0x0A) {
        await this.finalizeLine(currentJob);
      }
    } catch (error) {
      console.log('ERROR', error);
    }
    return true;
  }

  async finalizeLine(currentJob: CurrentJob): Promise<boolean> {
    if (currentJob.crLine.length > 0) {
      await this.updateLineBuffer(currentJob);
      currentJob.crLine = [];
    }
    return true;
  }

  async updateLineBuffer(currentJob: CurrentJob): Promise<boolean> {
    if (currentJob.isRefresh) return;

    const crTm = currentJob.currentTimestamp || "0:0:0:0";
    if (!currentJob.currentTimestamp) {
      // console.log('NO TIME STAMP FOUND');
    }
    currentJob.customTimestamp = this.utilityService.getIndianTM();
    if (!currentJob.lineBuffer[currentJob.lineCount]) {
      currentJob.lineBuffer[currentJob.lineCount] = [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];
    }
    currentJob.lineBuffer[currentJob.lineCount][1] = currentJob.crLine.slice();
    // if (!currentJob.isRefresh)
    // await this.removeExtraLines(currentJob);
    if (currentJob.crLine?.length > 0) {
      if (!currentJob.globalBuffer) {
        currentJob.globalBuffer = [];
      }
      currentJob.globalBuffer.push([currentJob.crLine[currentJob.crLine.length - 1], currentJob.lineCount]);
    }
    currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    let nId;
    try {
      nId = currentJob.lineBuffer[currentJob.lineCount][6] || null;
    } catch (error) {
      nId = null;
    }
    // const lg_dt1 = new Date();

    try {

      const tabs = await this.verifyTab.verify(currentJob.lineBuffer[currentJob.lineCount][1]);
      if (tabs?.length) {
        currentJob.lineBuffer[currentJob.lineCount][7] = tabs;
      }
      if (currentJob.lineBuffer[currentJob.lineCount][0])
        currentJob.lineBuffer[currentJob.lineCount][8] = this.convertToFrame(currentJob.lineBuffer[currentJob.lineCount][0]);

    } catch (error) {

    }


    const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, nId, currentJob.lineBuffer[currentJob.lineCount]);
    // console.log('    inserted', new Date().getTime() - lg_dt1.getTime());
    try {

      if (currentJob.lineBuffer && currentJob.lineBuffer[currentJob.lineCount]?.length) { //&& currentJob.lineBuffer[currentJob.lineCount]?.length >= 6
        currentJob.lineBuffer[currentJob.lineCount][6] = id;
      }
    } catch (error) {

    }
    // currentJob.id = id;
    await this.addToLocalFile(currentJob);
    this.emitToLocalUser(currentJob);
    return true;
  }

  async removeExtraLines(currentJob: CurrentJob): Promise<boolean> {
    try {
      if ((currentJob.lineBuffer.length - 1) > currentJob.lineCount) {
        const extraLines = currentJob.lineBuffer.filter((a, index) => index > currentJob.lineCount);
        // currentJob.lineBuffer.splice(currentJob.lineCount + 1);
        if (extraLines?.length) {
          for (let i = 0; extraLines.length > i; i++) {
            // extraLines.forEach((line, index) => {
            try {
              await this.sessionStore.deleteLine(this.sessionService.currentSessionid, extraLines[i][6])
            } catch (error) {
            }
          }
        }

        // });

      }
    } catch (error) {
      console.log('ERROR', error);
    }

    return true;
  }


  async replaceGlobal(currentJob: CurrentJob, searchString: string, replaceString: string, sessions: any): Promise<boolean> {
    // console.log('Global Replace:', searchString, replaceString);
    // Track modified pages
    // const modifiedPages = new Set<number>();
    try {
      const lg_dt2 = new Date();
      for (let index = 0; currentJob.lineBuffer.length > index; index++) {
        // currentJob.lineBuffer.forEach((line, index) => {
        const line = currentJob.lineBuffer[index];
        if (line && line.length) {
          if (line[1].length > 0) {
            const lineStr = line[1].map(char => String.fromCharCode(char)).join('');
            const newLineStr = lineStr.replace(new RegExp(searchString, 'g'), replaceString);
            if (lineStr !== newLineStr) { // If there's a change in the line
              const newLine = newLineStr.split('').map(char => char.charCodeAt(0));
              currentJob.lineBuffer[index][1] = newLine;
              // Calculate the page number for the current line and mark it as modified
              const pageNo = Math.floor(index / (this.sessionService.currentSessionLines || 25)) + 1;
              // modifiedPages.add(pageNo);
              const relativeLineIndex = index % (this.sessionService.currentSessionLines || 25);
              await this.sendGlobalReplace(currentJob, currentJob.lineBuffer[index], pageNo, relativeLineIndex, index, this.sessionService.currentSessionid);


            }
          }
        }
        // });
      }
      console.log('    Global replace', new Date().getTime() - lg_dt2.getTime());
    } catch (error) {

    }
    return true;
    // console.log('Modified Pages:', modifiedPages);
    // Save the modified pages
    // modifiedPages.forEach(pageNo => {
    //   this.saveForPage(currentJob, pageNo, sessions);
    // });
  }

  async sendGlobalReplace(currentjob: CurrentJob, lineData: any, pageNo: number, lineno: number, globalIndex: number, sessionId: string): Promise<boolean> {
    const sendData = {
      line: lineData,
      nSesid: sessionId,
      page: pageNo,
      lineno: lineno
    }

    try {
      const tabs = await this.verifyTab.verify(lineData[1]);
      if (tabs?.length) {
        lineData[7] = tabs;
      }
      if (lineData[0])
        lineData[8] = this.convertToFrame(lineData[0]);

    } catch (error) {

    }

    try {
      const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, (currentjob.lineBuffer[globalIndex][6] || null), lineData);
      if (!currentjob.lineBuffer[globalIndex][6]) {
        currentjob.lineBuffer[globalIndex][6] = id;
      }

    } catch (error) {

    }


    try {
      this.server.emit("line-replace", sendData);
      /* this.socketService.sockets.forEach((socket, url) => {
         try {
           if (socket.connected) {
             socket.emit("line-replace", sendData);
           }
         } catch (error) {
         }
       })*/



      const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
      if (liveServer) {
        try {
          liveServer.emit("line-replace", sendData);
        } catch (error) {
        }
      } else {
        this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`)
      }


    } catch (error) {

    }

    return true;
  }

  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }

  refreshReplaceData(currentJob: CurrentJob) {
    if (currentJob.isRefresh) {
      if (!currentJob.relaceLines) {
        currentJob.relaceLines = [];
      }
      // [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null];
      // const ind = currentJob.relaceLines.findIndex(a => a[0] == currentJob.currentLineNumber && a[1] == currentJob.currentTimestamp);
      const ind = currentJob.relaceLines.findIndex(a => a[5] == currentJob.currentLineNumber && a[0] == currentJob.currentTimestamp);
      if (ind > -1) {
        // console.log('\x1b[34m%s\x1b[0m', 'Update', currentJob.relaceLines?.length);
        // currentJob.relaceLines[ind] = [currentJob.currentLineNumber, currentJob.currentTimestamp, currentJob.currentFormat, currentJob.crLine];
        currentJob.relaceLines[ind] = [currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null];
      } else {
        // console.log('\x1b[41m%s\x1b[0m', 'Push --', currentJob.relaceLines?.length);
        currentJob.relaceLines.push([currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null]);
      }
    }
  }

  async fetchPreviousData(clientId: string, data: any, annotations?: any, highlights?: any) {
    const feeddata = this.sessionService.CurrentJob?.lineBuffer || []
    const pageDataLength = data.totalLines || 25;
    if (feeddata && feeddata.length) {
      const totalpages = Math.ceil(feeddata.length / pageDataLength);
      // for (let i = 1; totalpages >= i; i++) {

      for (let i = totalpages; i >= 1; i--) {
        // const pageData = feeddata.slice((i - 1) * pageDataLength, i * pageDataLength);
        const pageData = this.getPageData(feeddata, i, pageDataLength);


        const aDATA = [], hDATA = [];
        try {
          if (annotations) {
            aDATA.push(...annotations.filter(a => Number(a.pageIndex) == i));
          }
          if (highlights) {
            hDATA.push(...highlights.filter(a => Number(a.cPageno) == i));
          }


        } catch (error) {

        }


        await this.delayFn(10);
        this.server.to(clientId).emit('previous-data', { msg: 1, page: i, data: JSON.stringify(pageData), totalPages: totalpages, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab, tabSessionId: data.tabSessionId });

      }





    }
  }

  async delayFn(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /*removeTimestampsInRange(timestamps, range) {
    const [startRange, endRange] = range.map(this.convertToFrame);

    return timestamps.filter(([timestamp]) => {
      const currentFrame = this.convertToFrame(timestamp);
      return currentFrame < startRange || currentFrame > endRange;
    });
  }*/
  removeTimestampsInRange(timestamps, range) {
    const [startRange, endRange] = range.map(this.convertToFrame);
    let startIndex = -1;
    let endIndex = -1;
    // console.log('RANGE', this.sessionService.refreshType)
    const removedData: any = []; // Array to store removed elements

    /*  startIndex = timestamps.findIndex(([timestamp], index) => {
        const currentFrame = this.convertToFrame(timestamp);
        let isInRange = currentFrame >= startRange && currentFrame <= endRange;
        try {
          if (this.sessionService.refreshType == 'no-first-last') {
            isInRange = currentFrame > startRange && currentFrame < endRange;
          } else if (this.sessionService.refreshType == 'no-first') {
            isInRange = currentFrame > startRange && currentFrame <= endRange;
          } else if (this.sessionService.refreshType == 'no-last') {
            isInRange = currentFrame >= startRange && currentFrame < endRange;
          }
        } catch (error) {
  
        }
        return isInRange;
      })
  
  
      endIndex = timestamps.findLastIndex(([timestamp], index) => {
        const currentFrame = this.convertToFrame(timestamp);
        let isInRange = currentFrame >= startRange && currentFrame <= endRange;
        try {
          if (this.sessionService.refreshType == 'no-first-last') {
            isInRange = currentFrame > startRange && currentFrame < endRange;
          } else if (this.sessionService.refreshType == 'no-first') {
            isInRange = currentFrame > startRange && currentFrame <= endRange;
          } else if (this.sessionService.refreshType == 'no-last') {
            isInRange = currentFrame >= startRange && currentFrame < endRange;
          }
  
  
        } catch (error) {
  
        }
        return isInRange;
      })
  
      const removedData = timestamps.slice(startIndex, endIndex + 1);
      const newData = [...timestamps.slice(0, startIndex), ...timestamps.slice(endIndex + 1)];*/
    const sInd = timestamps.findIndex(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      return currentFrame >= startRange && currentFrame <= endRange;
    })

    const lInd = timestamps.findLastIndex(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      return currentFrame >= startRange && currentFrame <= endRange;
    })

    const newData = timestamps.filter(([timestamp], index) => {
      const currentFrame = this.convertToFrame(timestamp);
      // const isInRange = currentFrame >= startRange && currentFrame <= endRange;
      let isInRange = currentFrame >= startRange && currentFrame <= endRange;
      /*  try {
          if (this.sessionService.refreshType == 'no-first-last') {
            isInRange = currentFrame > startRange && currentFrame < endRange;
          } else if (this.sessionService.refreshType == 'no-first') {
            isInRange = currentFrame > startRange && currentFrame <= endRange;
          } else if (this.sessionService.refreshType == 'no-last') {
            isInRange = currentFrame >= startRange && currentFrame < endRange;
          }
  
  
        } catch (error) {
  
        }*/
      if (lInd != sInd && lInd == index && currentFrame == endRange) {
        isInRange = false
      }

      if (((lInd - sInd) + 1) > 2 && sInd == index && currentFrame == startRange) {
        try {
          const nextData = timestamps[index + 1]
          if (nextData) {
            const nextTimeRange = this.convertToFrame(nextData[0])
            if (nextTimeRange == startRange) {
              isInRange = false
            }
          }
        } catch (error) {

        }
      }

      // Capture the start and end indices of the range
      if (isInRange) {
        try {
          if (timestamps[index][6])
            removedData.push(timestamps[index]); // Assuming unicid is at index 6  //
        } catch (error) {
          console.log(error);
        }
        if (startIndex === -1) startIndex = index;
        endIndex = index;
      }



      // if(sInd == index && currentFrame == startRange){
      //   isInRange = false
      // }




      return !isInRange // && sInd != index && lInd != index;
    });






    return {
      newData,
      removedData,
      startIndex,
      endIndex,
    };
  }

  convertToFrame(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }

  convertToFrameWithoutNanoSec(timestamp) {
    // console.log(timestamp);
    if (!timestamp) return '';
    // Convert the timestamp into frames (assuming 30 frames per second)
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30);
  }

  async onRefreshEnd(currentJob: CurrentJob): Promise<boolean> {
    try {
      if (this.sessionService.current_refresh == 90) {
        debugger;
      }
      this.sortArray(currentJob.lineBuffer);
      if (currentJob.refreshTimeStamp?.length) {
        const start = currentJob.refreshTimeStamp[0];
        const end = currentJob.refreshTimeStamp[1];

        const OldLineBuffer = [...currentJob.lineBuffer];

        // const newData = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);
        const { newData, startIndex, endIndex, removedData } = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);

        try {
          // console.log('Removed Length', removedData)
          if (removedData?.length) {
            await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Removed lines -- \n ${currentJob.refreshTimeStamp}`, removedData)
            const removedDataString = removedData.map(line => line[6])
            await this.sessionStore.removeLinesFromRedis(this.sessionService.currentSessionid, removedDataString);
          }
        } catch (error) {
          console.log(error);
        }

        this.printFeedInTxt(`total = ${currentJob.lineBuffer?.length}, new = ${currentJob.relaceLines?.length} , replaced count = ${currentJob.lineBuffer?.length - newData?.length}`)
        currentJob.lineBuffer = newData;

        const oldLength = currentJob.lineBuffer?.length
        currentJob.relaceLines.map((line, index) => line[2] = currentJob.lineBuffer.length + index);

        // console.log('Start index ', startIndex, currentJob.lineBuffer)
        let mainStartId;
        try {
          // if (startIndex == -1) {
          //   //currentJob.relaceLines 
          //   const firstTime = currentJob.relaceLines[0][0];
          //   // - GET MIN TIMESTAMP FROM REPLACELINE
          //   // - FIND == or CLOSEST TOP NEAR 
          //   // - PIC RANDOM FROM BETWEEN [1 to 100]
          // } else {
          mainStartId = currentJob.lineBuffer[startIndex - 1][6];
          // }
        } catch (error) {
          mainStartId = 0;
          try {
            await this.refreshLogs(`_Transfer`, 'annot', `\n "refresh":"${this.sessionService.current_refresh}", "error": ${error?.message} `);
          } catch (error) {
          }

          // currentJob.lineBuffer[]
        }

        try {
          if (!mainStartId && currentJob.relaceLines?.length) {
            const firstTime = currentJob.relaceLines[0][0];
            const startLine = currentJob.lineBuffer.findLast(a => this.convertToFrame(firstTime) >= this.convertToFrame(a[0]))
            if (startLine)
              mainStartId = startLine[6];
          }
        } catch (error) {
          try {
            await this.refreshLogs(`_Transfer`, 'annot', `\n "refresh":"${this.sessionService.current_refresh}", "Condition":2,"error": ${error?.message} `);
          } catch (error) {
          }
          mainStartId = 0;
        }

        /*const markedRemoved: any = [...removedData];

        for (let [index, a] of currentJob.relaceLines.entries()) {


          const previousId = markedRemoved.findLast(z => this.convertToFrame(z[0]) == this.convertToFrame(a[0]));
          if (previousId && previousId[6]) {
            a[6] = previousId[6];
          } else {
            const previousIdWithoutFram = markedRemoved.findLast(z => this.convertToFrameWithoutNanoSec(z[0]) == this.convertToFrameWithoutNanoSec(a[0]));
            if (previousIdWithoutFram && previousIdWithoutFram[6]) {
              a[6] = previousIdWithoutFram[6];
            }
          }

          if (!a[6]) {
            a[6] = (mainStartId + 1);
          }

          const rmIndex = markedRemoved.findIndex(l => l[6] == a[6]);
          if (rmIndex > -1)
            markedRemoved.splice(rmIndex, 1);

          mainStartId = a[6];

          const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, a[6], a);
          a[6] = id
          currentJob.lineBuffer.push(a);

        }*/

        // const abstractValue = Math.floor(Math.random() * 10) + 1;



        // let firstIdentity = null, lastIdentity = null, fixedIdentitys = [];
        const newValues = [];
        const finalNewLines = [];
        if (currentJob.relaceLines) {
          const rmLines: any = [...removedData];
          // identityFixService
          for (let [index, a] of currentJob.relaceLines.entries()) {
            const randomNo = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
            try {
              const tabs = await this.verifyTab.verify(a[1]);
              if (tabs?.length) {
                a[7] = tabs;
              }
              if (a[0])
                a[8] = this.convertToFrame(a[0]);
            } catch (error) {
            }

            try {
              a[9] = index;
            } catch (error) {
            }

            let nId = null;

            const previousId = rmLines.findLastIndex(z => this.convertToFrame(z[0]) == this.convertToFrame(a[0])); // OR CONDITION z[5] == a[5];

            if (previousId > -1) {
              nId = rmLines[previousId][6] || (mainStartId + randomNo);
              // fixedIdentitys.push(nId);
              newValues.push([nId, true])
              rmLines.splice(previousId, 1);
            } else {
              nId = (mainStartId + randomNo);
              newValues.push([nId])
            }
            mainStartId = nId;

            const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, nId, a);
            a[6] = id

            // if (firstIdentity == null)
            //   firstIdentity = mainStartId

            // lastIdentity = mainStartId;
            finalNewLines.push(a);
            // currentJob.lineBuffer.push(a);
          }


        }






        try {
          await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `New lines -- \n ${currentJob.refreshTimeStamp}`, currentJob.relaceLines)
        } catch (error) {

        }





        try {

          if (newValues?.length) {
            const check = this.identityFixService.validateValues(newValues);
            if (!check.ok) {
              try {
                await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Duplicate identity found in new lines -- \n ${currentJob.refreshTimeStamp}`, check?.errors || []);
              } catch (error) {
              }
              const fixed = this.identityFixService.attemptFix(newValues);
              if (fixed?.values?.length) {

                const newArray = fixed?.values || [];

                if (finalNewLines.length == newArray?.length) {
                  try {
                    await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Fixing Duplicate Lines  -- \n ${currentJob.refreshTimeStamp}`, newArray);
                  } catch (error) {
                  }

                  for (let [index, x] of finalNewLines.entries()) {
                    if (newArray[index]) {
                      if (newArray[index][0]) {
                        x[6] = newArray[index][0];
                      }
                    }
                  }

                  try {
                    await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Final FIxing -- \n ${currentJob.refreshTimeStamp}`, finalNewLines);
                  } catch (error) {

                  }


                } else {

                  try {
                    await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Duplicate Fixing lenght not match with new (New = ${finalNewLines?.length}) (Fixed = ${newArray?.lenght}) -- \n ${currentJob.refreshTimeStamp}`, fixed?.error || []);
                  } catch (error) {
                  }
                }

              }
            }
          }
        } catch (error) {
          try {
            await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Fixing Failed -- \n ${error?.message}`, []);
          } catch (error) {
          }
        }


        if (finalNewLines?.length) {
          currentJob.lineBuffer.push(...finalNewLines);
        }



        this.sortArray(currentJob.lineBuffer);



        /* if (firstIdentity != null && lastIdentity != null) {
           const firstLineInd = currentJob.lineBuffer.findIndex(a => a[6] == firstIdentity);
           const lastLineInd = currentJob.lineBuffer.findLastIndex(a => a[6] == lastIdentity);
 
           const orgFirst = firstLineInd > 0 ? firstLineInd - 1 : firstLineInd;
           const orgLast = lastLineInd == (currentJob.lineBuffer.length - 1) ? lastLineInd : (lastLineInd + 1);
 
 
           const slice = currentJob.lineBuffer.slice(orgFirst, orgLast + 1);
 
           // Turn fixedIdentitys array into a Set for quick lookup
           const fixedSet = new Set(fixedIdentitys);
 
           const values = slice.map((line, idx, arr) => {
             const identity = line[6];
             const isEdge = (idx === 0 || idx === arr.length - 1);
             const isFixed = fixedSet.has(identity);
             if (isEdge || isFixed) {
               return [identity, true];
             }
             return [identity];
           });
 
           console.log(values);
 
 
 
         }*/



        // REVALIDATE NEW LINES METHOD


        /*  if (removedData[index]) {
            nId = removedData[index][6] || (mainStartId + 1);
          } else {
            nId = (mainStartId + 1);
          }
          mainStartId = nId;*/






        const startPage = Math.ceil((startIndex + 1) / (this.sessionService.currentSessionLines || 25));

        const relaceLines = [...(currentJob?.relaceLines || [])];

        await this.SendRefreshDataToUser(currentJob, startIndex, endIndex, currentJob.relaceLines, start, end, startPage)

        await this.handleAnnotTransfer(currentJob.lineBuffer, relaceLines, startPage, start, end, removedData, OldLineBuffer);
        // await this.transferHighlightsService.transferHighlights(OldLineBuffer, removedData, relaceLines, currentJob.lineBuffer);
      }
    } catch (error) {
      console.log(error);
    }
    try {
      currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
    } catch (error) {

    }
    await this.addToLocalFile(currentJob);
    return true;
  }


  /* async performQuery(query, params) {
     try {
       const res = await this.db.rowQuery(query, params);
       if (res.success) {
         return res.data;
       } else {
         this.logger.error(res?.error);
         throw new Error(res?.error)
       }
     } catch (error) {
       this.logger.error(error?.message);
       throw new Error(error?.message)
     }
   }*/
  async performQuery(nSesid, pageno, cType, jIdentities) {
    const res = await this.db.executeRef('annottransfer_getdetail_v2', { nSesid, pageno, cType, jIdentities: JSON.stringify(jIdentities.map(String)) }, 'realtime');
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        this.logger.error(`Session end failed :${res.error} `);
        return [];
      }
    } else {
      this.logger.error(`Session end failed :${res.error} `);
      return [];
    }
  }


  async anotTransferUpdate(fun, data) {
    const res = await this.db.executeRef(fun, data, 'realtime');
    if (res.success) {
      try {
        return { msg: 1, ...res.data[0][0] };
      } catch (error) {
        this.logger.error(`Session transfer update failed :${res.error} `);
        return { msg: -1, value: res.error };
      }
    } else {
      this.logger.error(`Session transfer update failed :${res.error} `);
      return { msg: -1, value: res.error };
    }

  }

  async anotTransferInsertQuickMark(fun, data) {
    const res = await this.db.executeRef(fun, data, 'realtime');
    if (res.success) {
      try {
        return res.data[0]
      } catch (error) {
        this.logger.error(`Session end failed :${res.error} `);
        return []
      }
    } else {
      this.logger.error(`Session end failed :${res.error} `);
      return []
    }

  }

  async handleAnnotTransfer(lineBuffer, relaceLines, startPage, start, end, removedData: any, OldLineBuffer): Promise<void> {
    const total_lines = (this.sessionService?.currentSessionLines || 25);
    const transferStart = this.dateTime.getCurrentTime()
    const transferStartTm: any = new Date();
    try {
      debugger;
      const newlines = relaceLines;
      try {
        await this.transferReport(`_Transfer`, 'annot', `\n{\n "refreshCount":${this.sessionService.current_refresh},\n "start": "${transferStart}", `);
      } catch (error) {
      }
      try {
        await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` On - ${new Date().toISOString()} \n\n Annot transfer for startpage  ${startPage}\n ${start} : ${end} \n lineBuffer length : ${lineBuffer?.length} \n`);
      } catch (error) {

      }

      const startPageData = (parseInt(startPage) - 3) > 0 ? (parseInt(startPage) - 3) : 1;
      const data = await this.performQuery(this.sessionService.currentSessionid, startPageData, 'I', []); // await this.performQuery(`SELECT * FROM "RIssueDetail" where "nSessionid" = $1 and nullif("cPageno",'')::int >= $2 `, [this.sessionService.currentSessionid, (parseInt(startPage) - 1)]);
      try {
        await this.transferReport(`_Transfer`, 'annot', `\n "totalAnnots":${data?.length},`);
      } catch (error) {
      }


      if (data?.length) {



        this.logger.debug(`Annotation data for transfer on refresh ${this.sessionService.current_refresh} totalAnnots:  ${data?.length}`);


        const affectedAnnots = [];
        const finalDbUpdate = [];
        const limit = pLimit(5); // limit concurrency to 4


        // const changedAnnots = []

        const startTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: start }, 'START', 2);

        const endTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: end }, 'END', 2);
        try {
          data.map(a => a.cONote = (a.cONote?.lenght) ? a.cONote.join(' ') : a.cONote)
        } catch (error) {

        }
        const changedAnnots = data.filter(a => {
          const cordinates = a.jOCordinates || a.jCordinates || []; //a.jCordinates ||
          const isInRefresh = cordinates.findIndex(m => this.convertToFrame(m.t) >= this.convertToFrame(startTimeStamp) && this.convertToFrame(m.t) <= this.convertToFrame(endTimeStamp)) > -1 //&& this.convertToFrame(m.t) <= this.convertToFrame(end)
          return isInRefresh
        })

        try {
          await this.transferReport(`_Transfer`, 'annot', `\n "TransferingAnnots":${changedAnnots?.length},`);
        } catch (error) {
        }

        try {
          await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` Total Annots : ${data?.length}, Trasnfring Annoted ${changedAnnots?.length} \n\n `); //
        } catch (error) {
        }

        const tasks = changedAnnots.map((x) =>
          limit(async () => {


            const transferStartDetail = this.dateTime.getCurrentTime()
            const transferStartTmDetail: any = new Date();
            x.transferStartTmDetail = transferStartTmDetail;
            try {
              // await this.transferAnnotReport(`_Transfer`, 'annot', `\n{\n "refreshCount":${this.sessionService.current_refresh},\n "start": "${transferStartDetail}", `);
              await this.transferAnnotReport(`_Transfer`, 'annot', `"refreshCount":${this.sessionService.current_refresh},"nId": "${x.nId}","cType": "${x.cType}","start": "${transferStartDetail}" \n `);
            } catch (error) {
            }

            // const affectedData 

            const { updateDetail, dbObject, isNotInRefresh } = await this.performForAnnots(x, lineBuffer, total_lines, start);

            if (!isNotInRefresh && !updateDetail) {
              affectedAnnots.push({ nId: x.nId, cType: x.cType, isInActivated: true, nUserid: x.nUserid });
              finalDbUpdate.push({ nId: x.nId, cType: x.cType, isInActivated: true, nUserid: x.nUserid });
            } else {
              if (updateDetail) {
                updateDetail["isInActivated"] = false;
              }
            }
            const transferEndDetail = this.dateTime.getCurrentTime()
            const transferEndTmDetail: any = new Date();
            x.transferEndTmDetail = transferEndTmDetail;
            try {
              // await this.transferAnnotReport(`_Transfer`, 'annot', `\n "duration":${transferEndTmDetail - transferStartTmDetail},"end": "${transferEndDetail}" \n} `);"isNotInRefresh": ${isNotInRefresh ? "true" : "false"},
              await this.transferAnnotReport(`_Transfer`, 'annot', `{"refreshCount":${this.sessionService.current_refresh}, "nId": "${x.nId}", "cType": "${x.cType}", "end": "${transferEndDetail}", "duration": ${x.transferEndTmDetail - x.transferStartTmDetail} },\n `);
            } catch (error) {
            }

            if (updateDetail) {
              affectedAnnots.push(updateDetail);
            }

            if (dbObject) {
              finalDbUpdate.push(dbObject);
            }

          })
        );

        await Promise.all(tasks); // wait for all to complete
        // return affected;

        // for (let x of data) {
        //   const affectedData = await this.performForAnnots(x, lineBuffer, total_lines, start);
        //   if (affectedData) {
        //     affectedAnnots.push(affectedData);
        //   }
        // }


        if (affectedAnnots?.length) {


          if (finalDbUpdate?.length) {
            await this.updateAnnotToDb(finalDbUpdate);
          }


          this.logger.verbose(`Affected Annots updated for ${affectedAnnots?.length} `);
          try {
            await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` Affected annots \n ${affectedAnnots.map(a => a.nId).join(',')}`);
          } catch (error) {
          }
          this.annotRefrshTransfer(affectedAnnots, 'A');

        } else {
          try {
            await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` No annot affected \n`);
          } catch (error) {
          }
        }


      } else {

        try {
          this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` NO DATA TO TRANSFER \n`);
        } catch (error) {

        }
      }
    } catch (error) {
      this.logger.error(`Error for quick facts in handleAnnotTransfer:`, error);
      // console.log('ERROR IN TRANSFER', error);
    }

    try {
      const transferEndTm: any = new Date();
      await this.transferReport(`_Transfer`, 'annot', `\n "annotTransfered":"${this.dateTime.getCurrentTime()}",\n "annotDuration": ${transferEndTm - transferStartTm}, `);
    } catch (error) {
    }

    try {
      try {
        await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` On - ${new Date().toISOString()} \n\n highlight transfer for ${start} : ${end} \n lineBuffer length : ${lineBuffer?.length} \n`);
      } catch (error) {

      }

      const identities = removedData.map(a => a[6]).filter(a => a);
      // between ? and ?
      const startPageData = (parseInt(startPage) - 3) > 0 ? (parseInt(startPage) - 3) : 1;
      const data = await this.performQuery(this.sessionService.currentSessionid, startPageData, 'H', identities || []);
      if (data?.length) {
        this.logger.debug(`Quick marks for transfer on refresh ${this.sessionService.current_refresh} totalAnnots:  ${data?.length}`);

        // try {
        //   await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` Total highlights  ${data?.length} \n`);
        // } catch (error) {

        // }

        const changed_highlights = [];
        const finalDbUpdate = [];
        const limit = pLimit(5); // limit concurrency to 4





        const startTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: start }, 'START', 2);

        const endTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: end }, 'END', 2);

        const changedHighlight = data.filter(a => {
          const cordinates = a.jOCordinates || [{ t: a.cOTime || a.cTime, text: a.cONote || a.cNote, isMain: true }] || []; // [{ t: a.cOTime || a.cTime, text: a.cONote || a.cNote }];  //a.jCordinates || [{ t: a.cTime, text: a.cNote }] || [];
          const isInRefresh = cordinates.findIndex(m => this.convertToFrame(m.t) >= this.convertToFrame(startTimeStamp) && this.convertToFrame(m.t) <= this.convertToFrame(endTimeStamp)) > -1 //&& this.convertToFrame(m.t) <= this.convertToFrame(end)
          return isInRefresh
        })

        try {
          await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` Total Marks : ${data?.length}, Trasnfring Marks ${changedHighlight?.length} \n\n `); //
        } catch (error) {
        }



        const tasks = changedHighlight.map((x) =>
          limit(async () => {
            const { updateDetail, dbObject } = await this.performForHighlight(x, lineBuffer, total_lines)
            if (updateDetail) {
              changed_highlights.push(updateDetail);
            }
            if (dbObject) {
              finalDbUpdate.push(dbObject);
            }
          })
        );


        await Promise.all(tasks);


        if (changed_highlights?.length) {


          if (finalDbUpdate?.length) {
            await this.anotTransferUpdate('annottransfer_updatecordinates_quickmark_multi', { jList: JSON.stringify(finalDbUpdate) });
          }


          try {
            const maxValue = Math.max(...data.map(item => item.nHid));
            await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` Affected Quick marks updated for ${changed_highlights?.length} \n Max nHid = ${maxValue} \n affected quick marks ${changed_highlights.map(a => a.nHid).join(', ')} \n`);
          } catch (error) {
          }

          this.logger.verbose(`Affected Quick marks updated for ${changed_highlights?.length} `);
          this.annotRefrshTransfer(changed_highlights, 'H');
        } else {
          try {
            await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` No quick marks affected \n`);
          } catch (error) {
          }
        }


      } else {
        try {
          this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` NO DATA TO TRANSFER \n`);
        } catch (error) {

        }
      }

    } catch (error) {
      this.logger.error(`Error for Quick marks in handleAnnotTransfer: `, error);
    }


    try {
      const transferEndTm: any = new Date();
      await this.transferReport(`_Transfer`, 'annot', `\n "end":"${this.dateTime.getCurrentTime()}", "duration": ${transferEndTm - transferStartTm} \n},`);
    } catch (error) {
    }

  }



  /*async updateAnnotToDb(finalDbUpdate): Promise<void> {
    const batchSize = 200;

    for (let i = 0; i < finalDbUpdate.length; i += batchSize) {
      const batch = finalDbUpdate.slice(i, i + batchSize);
      await this.anotTransferUpdate('annottransfer_updatecordinates_multi', {
        jList: JSON.stringify(batch)
      });
    }
  }
*/

  async updateAnnotToDb(finalDbUpdate: any[]): Promise<void> {
    const batchSize = 200;
    const concurrency = 3; // run 4 batches concurrently
    const limit = pLimit(concurrency);
    // 1. Create batches
    const batches: any[][] = [];
    for (let i = 0; i < finalDbUpdate.length; i += batchSize) {
      batches.push(finalDbUpdate.slice(i, i + batchSize));
    }
    // 2. Create limited concurrent tasks
    const tasks = batches.map(batch =>
      limit(async () => {
        await this.anotTransferUpdate('annottransfer_updatecordinates_multi_v2', {
          jList: JSON.stringify(batch),
        });
      })
    );

    // 3. Run all batches with limited concurrency
    await Promise.all(tasks);
  }

  async performForAnnots(x, lineBuffer, total_lines, start): Promise<{ updateDetail: any, dbObject: any, isNotInRefresh?: boolean }> {


    const cordinates = x.jOCordinates || x.jCordinates || []; // || // x.jOCordinates ? JSON.parse(x.jOCordinates || '') : JSON.parse(x.jCordinates || ''); //
    /*const isInRefresh = cordinates.findIndex(m => this.convertToFrame(m.t) >= this.convertToFrame(start)) > -1 //&& this.convertToFrame(m.t) <= this.convertToFrame(end)
    if (isInRefresh) {*/
    try {
      const firstCordinate = cordinates[0];
      const lastCordinate = cordinates[cordinates.length - 1];

      const margin = 6;
      const startCordinateIndex = await this.closestTimestamp(lineBuffer, firstCordinate);
      const endCordinateIndex = await this.closestTimestamp(lineBuffer, lastCordinate);
      const firstMarginIndex = await this.marginLineIndex(lineBuffer, startCordinateIndex, 'START', margin);
      const LastMarginIndex = await this.marginLineIndex(lineBuffer, endCordinateIndex, 'END', margin);
      const marginBuffer = this.getMarginBuffer(lineBuffer, firstMarginIndex, LastMarginIndex);
      const bufferTexts = marginBuffer.map(a => ({ timestamp: a[0], index: a[2], text: (a[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '') })); //${a[0]} 

      const terms = cordinates.map(a => ({ text: (a.text || '').trim(), timestamp: a.t })) //.filter(a => a && a.trim() != '');

      const body = {
        content: bufferTexts,
        terms: terms,
        refreshCount: this.sessionService.current_refresh,
        nSesid: this.sessionService.currentSessionid,
        type: x.cType || 'A',//'A',
        nId: x.nId
      }
      try {
        const finalOutput: searchResponse[] = await this.fuzzySearch.generateNewCordinates(body);
        if (!finalOutput) throw new Error('Nothing founds');

        if (finalOutput?.length) {
          let firstLine = null;
          let firstPage = null;
          const newCordinates = [];
          finalOutput.forEach((c) => {
            const bufferValue = lineBuffer[c.index];
            const calculatedPage = (Math.floor(bufferValue[2] / total_lines) + 1);
            const pageNumber = (bufferValue[2] % (this.sessionService.currentSessionLines || 25)) + 1;
            if (!firstPage) firstPage = calculatedPage;

            if (!firstLine) firstLine = pageNumber;

            const obj = {
              t: c.timestamp,//bufferValue[0],
              debug_t: bufferValue[0],
              l: pageNumber,
              p: calculatedPage,
              text: c.text,
              oP: bufferValue[4],
              oL: bufferValue[5],
              identity: bufferValue[6],
              refreshCount: this.sessionService.current_refresh
            };
            newCordinates.push({ ...({ x: 0, y: 0, height: 20, weight: 0 }), ...obj });
          })

          // await this.anotTransferUpdate(
          //   'annottransfer_updatecordinates',
          //   {
          //     nId: x.nId,
          //     jCordinates: JSON.stringify(x.jCordinates),
          //     cONote: x.cONote,
          //     newCordinates: JSON.stringify(newCordinates),
          //     nRefresh: this.sessionService.current_refresh,
          //     // jDCordinates: JSON.stringify([]),
          //     firstPage
          //   }
          // );

          const dbObject = {
            nId: x.nId,
            cType: x.cType,
            jCordinates: (!x.jOCordinates || !x.jOCordinates?.length) ? x.jCordinates : [],
            cONote: x.cONote,
            newCordinates: newCordinates,
            nRefresh: this.sessionService.current_refresh,
            firstPage,
            firstLine,
            isInActivated: !newCordinates?.length
          }

          x.jCordinates = newCordinates;
          try {
            x.cordinates = newCordinates;
          } catch (error) {
          }


          // affectedAnnots.push(x);

          return { updateDetail: x, dbObject };


        } else {
          throw new Error('No Result found on searchrequest');
        }

      } catch (error) {
        try {
          await this.transferPyLog(`_Transfer`, 'annot', `{\n "refreshCount":${this.sessionService.current_refresh}, \n  "nId":"${x.nId}", \n "failed": "${error?.message || ''}", \n "content":${JSON.stringify(body.content)} , \n "terms": ${JSON.stringify(terms)} \n},\n`);
        } catch (error) {
        }
      }

    } catch (error) {
      this.logger.error(`Error in annot transfer for ${x.nId}`, error);

      // console
    }



    return { updateDetail: null, dbObject: null };
    /*} else {

      return { updateDetail: null, dbObject: null, isNotInRefresh: true };
    }*/
  }

  /*  async performForHighlight(x, lineBuffer, total_lines): Promise<{ updateDetail: any, dbObject: any }> {
      try {
  
  
        this.logger.verbose(`Is in refresh ${x.nHid}`);
        const margin = 2;
  
        const time = x.cOTime || x.cTime;
        const note = x.cONote || x.cNote || '';
        const lineIndex = await this.closestTimestamp(lineBuffer, { t: time });
  
        const firstMarginIndex = await this.marginLineIndex(lineBuffer, lineIndex, 'START', margin);
        const LastMarginIndex = await this.marginLineIndex(lineBuffer, lineIndex, 'END', margin);
        const marginBuffer = this.getMarginBuffer(lineBuffer, firstMarginIndex, LastMarginIndex);
        const bufferTexts = marginBuffer.map(a => a[1].map(b => String.fromCharCode(b)).join(''));
        // this.fuzzySearch.findBestMatchIndexDiffLib()
        const matchedFirstIndex = this.fuzzySearch.findBestMatchIndexDiffLib(bufferTexts, note);
  
        if (matchedFirstIndex > -1) {
          const finalBuffer = marginBuffer[matchedFirstIndex];
          const globalIndex = finalBuffer[2]
          const line = (globalIndex % (total_lines)) + 1;
          const calculatedPage = Math.floor(((globalIndex || 0)) / total_lines) + 1;
  
          const dbObject = {
            cPageno: calculatedPage,
            cLineno: line,
            cTime: finalBuffer[0],
            nHid: x.nHid,
            cNote: finalBuffer[1].map(a => String.fromCharCode(a)).join(''),
            // calculatedPage,
            // line,
            identity: finalBuffer[6],
  
            nRefresh: this.sessionService.current_refresh,
            cOLDPageno: x.cPageno,
            cOLDLineno: x.cLineno,
            cOLDTime: time,
            cOLDNote: note,
            oldidentity: x.identity
          }
  
          x.cPageno = calculatedPage;
          x.cLineno = line;
          x.cTime = finalBuffer[0];
          x.cNote = finalBuffer[1].map(a => String.fromCharCode(a)).join('');
          x.identity = finalBuffer[6];
  
          return { updateDetail: { ...x, ...{ cPageno: calculatedPage, cLineno: line, cTime: finalBuffer[0] } }, dbObject };
  
        }
  
  
      } catch (error) {
        this.logger.error(`Error for quick marks in handleAnnotTransfer:`, error);
  
  
        try {
          await this.transferPyLog(`_Transfer`, 'annot', `{\n "refreshCount":${this.sessionService.current_refresh}, \n  "nHid":"${x.nHid}", \n "failed": "${error?.message || ''}" \n },`);
        } catch (error) {
        }
      }
  
      return { updateDetail: null, dbObject: null };
    }*/

  async performForHighlight(x, lineBuffer, total_lines): Promise<{ updateDetail: any, dbObject: any }> {

    try {

      const cordinates = x.jOCordinates || [{ t: x.cOTime || x.cTime, text: x.cONote || x.cNote, isMain: true }] || []; //  [{ t: x.cOTime || x.cTime, text: x.cONote || x.cNote }]; //x.jCordinates || [{ t: x.cTime, text: x.cNote }];



      const firstCordinate = cordinates[0];
      const lastCordinate = cordinates[cordinates.length - 1];


      const margin = 3;
      const startCordinateIndex = await this.closestTimestamp(lineBuffer, firstCordinate);
      const endCordinateIndex = await this.closestTimestamp(lineBuffer, lastCordinate);
      const firstMarginIndex = await this.marginLineIndex(lineBuffer, startCordinateIndex, 'START', margin);
      const LastMarginIndex = await this.marginLineIndex(lineBuffer, endCordinateIndex, 'END', margin);
      const marginBuffer = this.getMarginBuffer(lineBuffer, firstMarginIndex, LastMarginIndex);
      const bufferTexts = marginBuffer.map(a => ({ timestamp: a[0], index: a[2], text: (a[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '') })); //${a[0]} 

      const terms = cordinates.map(a => ({ text: (a.text || '').trim(), timestamp: a.t })) //.filter(a => a && a.trim() != '');

      const body = {
        content: bufferTexts,
        terms: terms,
        refreshCount: this.sessionService.current_refresh,
        nSesid: this.sessionService.currentSessionid,
        type: 'H',
        nId: x.nHid
      }

      const finalOutput: searchResponse[] = await this.fuzzySearch.generateNewCordinates(body);
      if (!finalOutput || !finalOutput?.length) throw new Error('Nothing founds');

      // if (finalOutput?.length) {
      const newCordinates = [];
      const dbObject = {
        nHid: x.nHid,
        nRefresh: this.sessionService.current_refresh,
        cOLDPageno: x.cPageno,
        cOLDLineno: x.cLineno,
        cOLDTime: x.cOTime || x.cTime,
        cOLDNote: x.cONote || x.cNote,
        oldidentity: x.identity
      };

      // if (!x.jCordinates) {
      dbObject['jOCordinates'] = cordinates;
      // }

      let wordCount = -1;
      finalOutput.forEach((c) => {
        const bufferValue = lineBuffer[c.index];
        const calculatedPage = (Math.floor(bufferValue[2] / total_lines) + 1);
        let otext = '';
        try {
          otext = (bufferValue[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '');
        } catch (error) {
        }
        const obj = {
          t: c.timestamp,//bufferValue[0],
          // debug_t: bufferValue[0],
          // l: (bufferValue[2] % (this.sessionService.currentSessionLines || 25)) + 1,
          // p: calculatedPage,
          text: c.text,
          otext: otext,
          isMain: false,
          // oP: bufferValue[4],
          // oL: bufferValue[5],
          identity: bufferValue[6],
          refreshCount: this.sessionService.current_refresh
        };
        const newCount = c.text?.trim()?.split('')?.length || 0;
        if (newCount >= wordCount) {
          wordCount = newCount;
          newCordinates.map(a => a.isMain = false);
          obj["isMain"] = true;
          dbObject['cPageno'] = calculatedPage;
          dbObject['cLineno'] = (bufferValue[2] % (this.sessionService.currentSessionLines || 25)) + 1;
          dbObject['cTime'] = c.timestamp;
          dbObject['cNote'] = otext;
          dbObject['identity'] = bufferValue[6];
        }
        newCordinates.push(obj);
      })

      dbObject["jCordinates"] = newCordinates;

      //  const dbObject = {
      //   cPageno: calculatedPage,
      //   cLineno: line,
      //   cTime: finalBuffer[0],
      //   nHid: x.nHid,
      //   cNote: finalBuffer[1].map(a => String.fromCharCode(a)).join(''),
      //   // calculatedPage,
      //   // line,
      //   identity: finalBuffer[6],

      //   nRefresh: this.sessionService.current_refresh,
      //   cOLDPageno: x.cPageno,
      //   cOLDLineno: x.cLineno,
      //   cOLDTime: x.cTime,
      //   cOLDNote: x.cNote,
      //   oldidentity: x.identity
      // }

      // x.cPageno = calculatedPage;
      // x.cLineno = line;
      // x.cTime = finalBuffer[0];
      // x.cNote = finalBuffer[1].map(a => String.fromCharCode(a)).join('');
      // x.identity = finalBuffer[6];

      // return { updateDetail: { ...x, ...{ cPageno: calculatedPage, cLineno: line, cTime: finalBuffer[0] } }, dbObject };

      x.cPageno = dbObject['cPageno'];
      x.cLineno = dbObject['cLineno'];
      x.cTime = dbObject['cTime'];
      x.cNote = dbObject['cNote'];
      x.identity = dbObject['identity'];
      return { updateDetail: x, dbObject };
      // }

    } catch (error) {
      this.logger.error(`Error in highlight transfer for ${x.nHid}`, error);
    }

    return { updateDetail: null, dbObject: null };
  }

  getMarginBuffer(lineBuffer: any[], startIndex: number, endIndex: number) {
    try {
      if (startIndex < 0 || endIndex < 0 || startIndex >= lineBuffer.length || endIndex >= lineBuffer.length) {
        return [];
      }
      return [...lineBuffer].slice(startIndex, endIndex + 1);
    } catch (error) {
      this.logger.error(`Error in getMarginBuffer: ${error?.message}`);
      return [];
    }

  }

  async marginLineIndex(lineBuffer: any[], index: number, type: 'END' | 'START', margin = 4) {
    try {
      if (type == 'START') {
        if ((index - margin) >= 0) {
          return index - margin;
        } else {
          return 0;
        }
      } else {
        if ((index + margin) < lineBuffer.length) {
          return index + margin;
        } else {
          return lineBuffer.length - 1;
        }
      }
    } catch (error) {
      return null;
    }

  }


  async closestTimestamp(
    lineBuffer: any[],
    cordinate: any
  ): Promise<number> {
    // const targetFrames = this.convertToFrame(cordinate.t);
    // try {
    //   const startIndex = lineBuffer.findIndex(a => this.convertToFrameWithoutNanoSec(a[0]) >= this.convertToFrameWithoutNanoSec(cordinate.t)); //&& (a[6] >= firstCordinate.identity)   //&& (a[5] == firstCordinate.oL || a[6] >= firstCordinate.identity) 
    //   return startIndex;
    // } catch (error) {
    //   return null;
    // }


    const targetFrames = this.convertToFrame(cordinate.t);
    let closestIdx = 0;
    let smallestDiff = Infinity;

    for (let i = 0; i < lineBuffer.length; i++) {
      try {
        const tsString = lineBuffer[i][0];
        const frames = this.convertToFrame(tsString);
        const diff = Math.abs(frames - targetFrames);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          closestIdx = i;
        }
      } catch (error) {
      }
    }

    return closestIdx;
  }

  async closestTimestampWithMargin(
    lineBuffer: any[],
    coordinate: any,
    mode: 'START' | 'END',
    margin: number
  ): Promise<string | null> {
    const targetFrames = this.convertToFrame(coordinate.t);

    let closestIdx: number;
    if (mode === 'START') {
      // Find the last index where frame is <= target (polyfill for findLastIndex)
      const revIdx = [...lineBuffer]
        .reverse()
        .findIndex(entry => this.convertToFrame(entry[0]) <= targetFrames);
      closestIdx = revIdx === -1 ? -1 : lineBuffer.length - 1 - revIdx;
    } else {
      // mode === 'END', find the first index where frame is >= target
      closestIdx = lineBuffer.findIndex(
        entry => this.convertToFrame(entry[0]) >= targetFrames
      );
    }

    // If no valid timestamp found, default to first or last based on mode
    if (closestIdx === -1) {
      closestIdx = mode === 'START' ? 0 : lineBuffer.length - 1;
    }

    // Apply margin offset and clamp within bounds
    const marginIdx = mode === 'START'
      ? Math.max(0, closestIdx - margin)
      : Math.min(lineBuffer.length - 1, closestIdx + margin);

    // Return the timestamp string at the adjusted index
    return lineBuffer[marginIdx][0];
  }







  async transferOnTimeMargin(x, removedMarked, relaceLines, total_lines, changed_highlights): Promise<void> {
    if (this.findHighlightExistsInNew(x, removedMarked, relaceLines)) {


      let rows = relaceLines.filter(a => this.convertToFrameWithoutNanoSec(a[0]) == this.convertToFrameWithoutNanoSec(x.cTime));

      let timeDiffernce = false;
      if (!rows?.length) {
        rows = relaceLines.filter(a => this.diffInSeconds(a[0], x.cTime) == 1);
        timeDiffernce = true;
      }

      const newQuickMarks = [];


      for (let [index, r] of rows.entries()) {
        const markedIndex = removedMarked.findIndex(b => this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(r[0]));

        const globalIndex = r[2]
        const line = (globalIndex % (total_lines)) + 1;
        const calculatedPage = Math.floor(((globalIndex || 0)) / total_lines) + 1;

        newQuickMarks.push(
          {
            cNote: r[1]?.map(a => String.fromCharCode(a)).join(''),
            cPageno: calculatedPage,
            cLineno: line,
            cTime: r[0],
            oP: r[4],
            oL: r[5],
            identity: r[6],
            timeDiffernce: timeDiffernce,
            previousIdentity: markedIndex > -1 ? removedMarked[markedIndex][6] : null
          });

        if (markedIndex > -1) {
          removedMarked.splice(markedIndex, 1)
        }
      }


      await this.saveNewHighlightsd(x, changed_highlights, newQuickMarks);

    }
  }

  async saveNewHighlightsd(x, changed_highlights, newQuickMarks): Promise<void> {
    try {
      if (newQuickMarks.length) {

        const res = await this.anotTransferInsertQuickMark(
          'annottransfer_insert_ref_quickmark',
          {
            nSessionId: this.sessionService.currentSessionid,
            nHid: x.nHid,
            jNewData: JSON.stringify(newQuickMarks),
          }
        );

        try {
          if (res?.length) {
            newQuickMarks.forEach(a => {
              const nObj = res.find(m => m.identity == a.identity);
              if (nObj)
                changed_highlights.push({ ...a, ...nObj })
              // a.nHid = res.find(m => m.identity == a.identity)?.nHid || null;
            })
          }
        } catch (error) {
          this.logger.error(`Error while updating nHid in new quick marks ${error?.message}`);
        }

        // changed_highlights.push(...newQuickMarks.filter(a => a.nHid));
      }
    } catch (error) {
      this.logger.error(`Error while saving new highlights: ${error?.message}`);
    }

  }


  async findHighlightExistsInNew(x, removedMarked, relaceLines): Promise<boolean> {
    try {
      const markedIndex = removedMarked.findIndex(b => this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(x.cTime));
      const relaceIndex = relaceLines.findIndex(b =>
        this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(x.cTime) ||
        this.diffInSeconds(b[0], x.cTime) == 1
      );
      if (markedIndex > -1 && relaceIndex > -1) {
        return true;
      }
    } catch (error) {
    }
    return false;
  }


  async getHighlightInPrevious(x, OldLineBuffer): Promise<{ from: string, to: string, isHavePrevious: boolean }> {
    let from = null, to = null, isHavePrevious = false;

    try {
      const ind = OldLineBuffer.findIndex(a => this.convertToFrameWithoutNanoSec(a[0]) == this.convertToFrameWithoutNanoSec(x.cTime) && (a[6] == x.identity)); //a[5] == x.oL || 
      if (ind > -1) {
        from = OldLineBuffer[ind][0];
        if (OldLineBuffer[ind - 1]) {
          isHavePrevious = true;
          from = OldLineBuffer[ind - 1][0];
        }
        if (OldLineBuffer[ind + 1])
          to = OldLineBuffer[ind + 1][0];
      }
    } catch (error) {
    }


    return { from, to, isHavePrevious }
  }


  async annotRefrshTransfer(affectedAnnots: any[], cType: 'A' | 'H' | 'QF' | 'F' | 'D') {
    try {


      let data = [];
      if (['A', 'QF', 'F', 'D'].includes(cType)) {
        data = affectedAnnots.map(x => ({
          nId: x.nId,
          cType: x.cType,
          nHid: x.nHid,
          cONote: x.cONote,
          jCordinates: x.jCordinates,
          cPageno: x.cPageno,
          cLineno: x.cLineno,
          nUserid: x.nUserid,
          isInActivated: x.isInActivated
        }));
      } else {
        data = affectedAnnots;
      }

      const sendData = {
        nSesid: this.sessionService.currentSessionid,
        cType: cType,
        data: data || []
      }
      this.server.emit("annot-refresh-transfer", sendData);
      /*this.socketService.sockets.forEach((socket, url) => {
         try {
           if (socket.connected) {
             socket.emit("annot-refresh-transfer", sendData);
           }
         } catch (error) {
         }
       })*/


      const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
      if (liveServer) {
        try {
          liveServer.emit("annot-refresh-transfer", sendData);
        } catch (error) {
        }
      } else {
        this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`)
      }


    } catch (error) {
      console.log('ERROR IN TRANSFER', error);
    }
  }

  async SendRefreshDataToUser(currentJob, startInd, endInd, newLines, start, end, startPage) {

    const sendData = {
      nSesid: this.sessionService.currentSessionid,
      startInd: startInd,
      refreshType: this.sessionService?.refreshType,
      endInd: endInd,
      newLines: newLines || [],
      start: start,
      end: end,
      startPage,
      current_refresh: this.sessionService.current_refresh || 0
    }

    try {
      this.printRefSendCmd(`Refresh ${this.sessionService.current_refresh} send to user \n ${JSON.stringify(sendData)}`);
      await this.server.emit("feed-refresh-data", sendData);

      sendData.nSesid = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;
      /*this.socketService.sockets.forEach(async (socket, url) => {
        try {
          if (socket.connected) {
            await socket.emit("feed-refresh-data", sendData);
          }
        } catch (error) {
        }
      })*/

      const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
      if (liveServer) {
        try {
          liveServer.emit("feed-refresh-data", sendData);
        } catch (error) {
        }
      } else {
        this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`)
      }

    } catch (error) {

      this.printRefSendCmd(`Refresh ${this.sessionService.current_refresh} Failed to send`);
    }
  }

  async addToLocalFile(currentJob: CurrentJob) {
    /*new Promise(async (resolve) => {
   
       try {
         // return;
         try {
           currentJob.lineBuffer.sort((a, b) => {
             return this.utilityService.parseTimeFormate(a[0]) - this.utilityService.parseTimeFormate(b[0]);
           });
         } catch (error) {
         }
   
   
   
   
   
         const allDts = currentJob.lineBuffer.map((a, index) => (a && a.length ? ` ${a[0]}  : ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}` : 'BLANK LINE') + `\n`)
         const log_msg = `\n\r\n\r\n\n ${allDts}`;
         const logPath = `logs/s_${this.sessionService.currentSessionid}`;
         try {
           await fsP.mkdir(logPath, { recursive: true });
         } catch (error) {
         }
         fs.writeFile(`${logPath}/finaldata.txt`, log_msg + '\n', (err) => {
           // if (!currentJob.relaceLines?.length) {
           resolve(true)
           // }
           if (err) {
             console.error('Error appending to file:', err);
             // throw err;
           }
           // console.log('File updated successfully!');
         });
       } catch (error) {
         resolve(true)
         console.log('ERROR', error);
       }
   
     })*/
  }

  async transferLog(key, type, log): Promise<void> {
    try {
      const log_msg = `\n${log}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/transfer`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
    } catch (error) {
      console.log(error);
    }
  }


  async transferPyLog(key, type, log): Promise<void> {
    try {
      const log_msg = `${log}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/python`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
    } catch (error) {
      console.log(error);
    }
  }


  async transferReport(key, type, log): Promise<void> {
    try {
      const log_msg = `${log}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/report`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
    } catch (error) {
      console.log(error);
    }
  }



  async refreshLogs(key, type, log): Promise<void> {
    try {
      const log_msg = `${log}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh-log`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
    } catch (error) {
      console.log(error);
    }
  }

  async transferAnnotReport(key, type, log): Promise<void> {
    try {
      const log_msg = `${log}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/report-annot`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
    } catch (error) {
      console.log(error);
    }
  }





  async RefreshLog(currentJob, key, val): Promise<boolean> {
    try {

      this.sortArray(currentJob.lineBuffer);
      // currentJob.lineBuffer.sort((a, b) => {
      //   return this.convertToFrame(a[0]) - this.convertToFrame(b[0]);
      // });

      const allDts = currentJob.lineBuffer.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]}) :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`)
      const log_msg = `${val}  \n ${allDts} \n\n\n replacing with condition ${this.sessionService?.refreshType}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.lineBuffer?.length + '\n\n\n');
    } catch (error) {
      console.log(error);
    }
    return true;
  }


  async logForFixing(currentJob, key, val, arrayELement): Promise<boolean> {
    try {
      const allDts = arrayELement.map((a, index) => (a && a.length ? `  identity = (${a[0]})  : IsPrevious = ${a[1] ? 'True' : 'False'}` + `\n` : ''));
      const log_msg = `${val}  \n ${allDts}`;
      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
      await fsP.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n ');
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  async removedLog(currentJob, key, val, removedLines): Promise<boolean> {
    try {
      // currentJob.lineBuffer.sort((a, b) => {
      //   if (a[3] !== b[3]) {
      //     return a[3] - b[3];
      //   }
      //   return a[4] - b[4];
      // });

      this.sortArray(currentJob.lineBuffer);
      // currentJob.lineBuffer.sort((a, b) => {
      //   return this.convertToFrame(a[0]) - this.convertToFrame(b[0]);
      // });

      const allDts = removedLines.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`)
      const log_msg = `${val}  \n ${allDts}`;

      const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
      // Ensure the directory exists
      try {
        await fsP.mkdir(sessionDir, { recursive: true });
      } catch (error) {
      }
      await fsP.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n ');
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  async refreshLogsLines(currentJob, key): Promise<boolean> {
    try {

      /* currentJob.lineBuffer.sort((a, b) => {
         return this.utilityService.parseTimeFormate(a[0]) - this.utilityService.parseTimeFormate(b[0]);
       });
   
   
       const allDts = currentJob.relaceLines.map(a => (a && a.length ? `  page = ${a[4]}  : line = ${a[5]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`)
       const log_msg = ` \n\n\n LINES ---- \n ${allDts}`;
   
   
       const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
       // Ensure the directory exists  
       try {
         await fsP.mkdir(sessionDir, { recursive: true });
       } catch (error) {
       }
   
       await fsP.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.relaceLines?.length + '\n\n\n');*/
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  printFeedInTxt(log) {
    try {
      // const allDts = currentJob.lineBuffer.map(a => (a && a.length ? ` ${a[0]} :  ${String.fromCharCode(...a[1])}` : 'BLANK LINE') + `\n`)
      /* const log_msg = `\n\r\n\r\n\r\n\r\n\r\n\r\nRefresh Count  ${this.isContinue}\n ${log}`;
       fs.appendFile(`logs/s_${this.sessionService.currentSessionid}/feed_refresh.txt`, log_msg + '\n', (err) => {
         if (err) {
           console.error('Error appending to file:', err);
           // throw err;
         }
         // console.log('File updated successfully!');
       });*/
    } catch (error) {
      console.log('ERROR', error);
    }
  }

  parseTimeFormate(formate) {
    // console.log('FORMATE', formate);
    if (formate) {
      const date = new Date();
      const frmArry = formate.split(':');
      date.setHours(frmArry[0], frmArry[1], frmArry[2], frmArry[3]);
      return date;
    } else {
      return null
    }
  }

  async printRefSendCmd(data: any) {
    try {


      const sessionDir = `logs/s_${this.sessionService.currentSessionid}`;
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
        // console.log('File updated successfully!');
      });
    } catch (error) {
      // console.log('ERROR', error);
    }

  }

  printCommands(logdata: string) {
    try {
      const log_msg = `${logdata}\n\r\n\r\n\r\n`
      fs.appendFile('commands_replace.txt', log_msg + '\n', (err) => {
        if (err) {
          console.error('Error appending to file:', err);
          throw err;
        }
        // console.log('File updated successfully!');
      });
    } catch (error) {
      // console.log('ERROR', error);
    }

  }

  emitToLocalUser(currentJob: CurrentJob) {
    try {
      const total_lines = (this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25);
      if (currentJob.lineBuffer?.length) {
        const array = currentJob.lineBuffer.slice(currentJob.lineBuffer.length - 2, currentJob.lineBuffer.length) || [];
        try {
          array.map((a, index) => a[2] = (index == 0 ? currentJob.lineBuffer.length - 2 : currentJob.lineBuffer.length - 1));
        } catch (error) {
          console.log('\n\r\n\r\n\rERROR', error);
        }

        const calculatedPage = Math.floor((currentJob.lineBuffer?.length ? (currentJob.lineBuffer?.length - 1) : 0) / total_lines) + 1;

        if (array.length) {

          const sendData = {
            i: currentJob.lineCount,
            d: array,
            date: this.sessionService.currentSessionid,
            l: total_lines,
            p: calculatedPage
          }
          // console.log('SEND DATA', sendData);
          if (this.server) {
            this.server.emit("message", sendData);
          }

          if (this.socketService.sockets) {
            const sessionLiveId = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;
            sendData.date = sessionLiveId;


            const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
            if (liveServer) {
              try {
                liveServer.emit("TCP-DATA", sendData);
              } catch (error) {
              }
            } else {
              this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`)
            }

            /* this.socketService.sockets.forEach((socket, url) => {
               try {
                 if (socket.connected) {
                   socket.emit("TCP-DATA", sendData);
                 }
               } catch (error) {
               }
             });*/
          }
        }
      }
    } catch (error) {
    }

  }

  async emitRefReshPages(currentJob: CurrentJob, startPg: number) {

  }



  toSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  }
  // if (!timestamp) return '';
  // // Convert the timestamp into frames (assuming 30 frames per second)
  // const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
  // return ((hours * 3600 + minutes * 60 + seconds) * 30);

  diffInSeconds(t1, t2) {
    const s1 = this.toSeconds(t1);
    const s2 = this.toSeconds(t2);
    return Math.abs(s2 - s1);
  }


  getCurrentServerSocket(nSesid: string) {
    if (!this.sessionService.currentSessionDetail?.cUrl) {
      this.logger.error('No Server found on session', this.sessionService.currentSessionDetail)
    }
    const serverUrl = `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`;//http://${this.sessionService.currentSessionDetail?.cUrl}`
    const socket = this.socketService.sockets.get(serverUrl);
    return socket
  }


}