import { Injectable } from '@nestjs/common';
import async from 'async';
import { CurrentJob } from '../../interfaces/session.interface';
import * as fs from 'fs';
import { promises as fsP } from 'fs';
@Injectable()
export class BridgeService {
  //[timestamp, data, formate, page, line,[refresh numbers],isBlank,lineCount]
  formates: any = [{ key: `0x00`, value: 'FL' },
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
  isPageGotPageNumber: boolean = false;
  private readonly queue;
  resetLine = (currentJob: CurrentJob) => {
    currentJob.crLine = [];
  }
  sliceDate = (date: any) => {
    try {
      return ('0000' + date.toString()).slice(-2);
    } catch (error) {
      return date;
    }
  }
  /*onBackSpace = (currentJob: CurrentJob) => {
    try {
      const ind = currentJob.lineBuffer.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
      if (ind > -1) {
        if (currentJob.lineBuffer[ind][1]?.length) {
          currentJob.lineBuffer[ind][1].pop();
        } else {
          let isMatched = false;
          if (currentJob.currentLineNumber > 1) {
            currentJob.currentLineNumber--;
            isMatched = true;
          } else if (currentJob.currentLineNumber == 1 && currentJob.currentPage > 1) {
            currentJob.currentPage--;
            currentJob.currentLineNumber = 25;
            isMatched = true;
          }
          if (isMatched) {
            const ind = currentJob.lineBuffer.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
            if (ind > -1) {
              currentJob.lineBuffer[ind][1].pop();
            }
          }
        }
      }
    } catch (error) {
      console.log(error)
      return;
    }
  }*/
  onBackSpace = (currentJob: CurrentJob) => {
    try {
      // Find the index of the line buffer entry based on current line and page
      let ind = currentJob.lineBuffer.findIndex(
        (a) => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage
      );
      // If the index is found and there's content to pop in line buffer
      if (ind > -1 && currentJob.lineBuffer[ind][1]?.length) {
        currentJob.lineBuffer[ind][1].pop();
        return;
      }
      // If the current line is the first one and we need to move up a page
      if (currentJob.currentLineNumber == 1 && currentJob.currentPage > 1) {
        currentJob.currentPage--;
        currentJob.currentLineNumber = 25;
      }
      // Otherwise, move to the previous line if possible
      else if (currentJob.currentLineNumber > 1) {
        currentJob.currentLineNumber--;
      } else {
        return; // Exit if no previous line or page is available
      }
      // Recompute the index after adjusting line and page numbers
      ind = currentJob.lineBuffer.findIndex(
        (a) => a[4] === currentJob.currentLineNumber && a[3] === currentJob.currentPage
      );
      // If valid index, pop the last element in the adjusted line buffer
      if (ind > -1 && currentJob.lineBuffer[ind][1]?.length) {
        currentJob.lineBuffer[ind][1].pop();
      }

    } catch (error) {
      console.log(error);
    }
  };


  convertToFrame = (timestamp) => {
    if (!timestamp) return '';
    const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
    return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
  }
  backupCurrentState = (currentJob: CurrentJob) => {
    // currentJob.refreshBefour = [...currentJob.lineBuffer];
    this.current_refresh++
    this.isRefresh = true;
    this.isPageGotPageNumber = false;
    currentJob.oldLineData = [currentJob.currentTimestamp, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber];
    currentJob.relaceLines = [];
  }
  restoreCurrentState = (currentJob: CurrentJob) => {
    this.isRefresh = false;
    this.isPageGotPageNumber = false;
    try {
      const x = currentJob.oldLineData;
      if (currentJob.oldLineData?.length) {
        currentJob.currentTimestamp = x[0];
        currentJob.currentFormat = x[1];
        currentJob.currentPage = x[2];
        currentJob.currentLineNumber = x[3];
      }

    } catch (error) {
      console.log(error);
    }

    // currentJob.refreshBefour = [];
    currentJob.relaceLines = [];
  }
  emitData = (currentJob: CurrentJob, type: string) => {
    //emit user from here
  }
  cmds: number = 0;
  current_refresh: number = 0;
  isRefresh: boolean = false;
  constructor() {
    this.queue = async.queue(async (task, callback) => {
      await task();
      callback();
    }, 1);

    this.queue.drain(() => {
      // console.log("\n All tasks have been processed", new Date());

    });
  }

  SendToParseData(incomingBuffer: Buffer, CMD_DATA: any, currentSession: any, currentJob: CurrentJob, sessions: any): void {
    this.queue.push(async () => {
      await this.startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
    });
  }


  async startProcess(incomingBuffer: Buffer, CMD_DATA: any, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<boolean> {

    this.cmds++;
    console.log(this.cmds);
    try {
      const buffer = Buffer.from(CMD_DATA["hexCmd"], 'hex');
      const CMDdata = CMD_DATA
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
    } catch (error) {
      console.log(error);
    }


    await this.saveData(currentJob);
    return true;
  }




  async handleCommand(command: string, CMDdata: any, data: Buffer, currentJob: CurrentJob, currentSession: any, sessions: any): Promise<boolean> {
    try {
      console.log(command);
      switch (command) {
        case 'P':
          if (data.length >= 2) {
            currentJob.currentPage = data.readUInt16LE(2);
            if (this.isRefresh)
              this.isPageGotPageNumber = true;
          }
          break;
        case 'N':
          if (data.length >= 1) {
            const receivedLineNumber = data.readUInt8(2);
            currentJob.currentLineNumber = receivedLineNumber;
            // currentJob.lineCount = ((currentJob.lineCount ? currentJob.lineCount : 0) + 1);
            // currentJob.lineCount = (((currentJob.currentPage || 1) - 1) * 25) + receivedLineNumber;
            // console.log('Line ', currentJob.currentLineNumber)
          }
          break;
        case 'F':
          if (data.length >= 1) {
            const formatCode = data.readUInt8(2);
            const format = this.formates.find(f => parseInt(f.key, 16) === formatCode);
            if (format) {
              currentJob.currentFormat = format.value;
            }
          }
          break;
        case 'T':
          if (data.length >= 4) {
            const hours = this.sliceDate(data.readUInt8(2));
            const minutes = this.sliceDate(data.readUInt8(3));
            const seconds = this.sliceDate(data.readUInt8(4));
            const frames = this.sliceDate(data.readUInt8(5));
            currentJob.currentTimestamp = `${hours}:${minutes}:${seconds}:${frames}`;
          }
          break;
        case 'G':
          // Pending
          break;
        case 'R':
          // Pending
          this.backupCurrentState(currentJob);
          currentJob.refreshTimeStamp = [`${this.sliceDate(data.readUInt8(2))}:${this.sliceDate(data.readUInt8(3))}:${this.sliceDate(data.readUInt8(4))}:${this.sliceDate(data.readUInt8(5))}`, `${this.sliceDate(data.readUInt8(6))}:${this.sliceDate(data.readUInt8(7))}:${this.sliceDate(data.readUInt8(8))}:${this.sliceDate(data.readUInt8(9))}`];
          await this.RefreshLog(currentJob, `_${this.current_refresh}`, `BEFOUR-- \n ${currentJob.refreshTimeStamp}`)
          await this.refreshLines(currentJob, data);

          break;
        case 'E':


          await this.checkForReplace(currentJob);

          await this.refreshLogsLines(currentJob, `_${this.current_refresh}`)
          await this.RefreshLog(currentJob, `_${this.current_refresh}`, 'AFTER-- ')
          // await this.handleRefreshEnd(currentJob);
          this.restoreCurrentState(currentJob)
          // Pending
          break;
        case 'D':
          this.onBackSpace(currentJob)
          break;
        default:
        // Unknow command
      }
    } catch (error) {
      console.log(error);
    }

    return true;
  }


  async handleText(byte: number, currentJob: CurrentJob): Promise<boolean> {
    try {
      if (byte !== 0x08) {
        let ind = currentJob.lineBuffer.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
        // let ind = currentJob.lineBuffer.findIndex(a => a[6] == currentJob.lineCount);
        if (ind == -1) {
          currentJob.lineBuffer.push(['', [], 'FL', currentJob.currentPage, currentJob.currentLineNumber, []])
          ind = currentJob.lineBuffer?.length - 1;
        }
        let obj = currentJob.lineBuffer[ind];
        if (!obj) {
          obj = ['', [], 'FL', 0, 0, [], false];
        }
        obj[0] = currentJob.currentTimestamp || '00:00:00:00';
        obj[1] = [...obj[1], byte];
        obj[2] = currentJob.currentFormat || 'FL';

        if (this.isRefresh)
          obj[5] = [...new Set([...obj[5], this.current_refresh])];
        // obj[3] = currentJob.currentPage || 1;
        // obj[4] = currentJob.currentLineNumber || 1;
        currentJob.lineBuffer[ind] = obj;

        this.bindRefreshData(currentJob, obj)

      };
    } catch (error) {
      console.log(error);
    }

    return true;
  }


  bindRefreshData(currentJob, obj) {
    try {
      let ind = currentJob.relaceLines.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
      if (ind == -1) {
        currentJob.relaceLines.push(obj)
      } else {
        currentJob.relaceLines[ind] = obj;
      }
    } catch (error) {
      console.log(error);
    }

  }

  async refreshLines(currentJob: CurrentJob, data: Buffer): Promise<boolean> {
    try {
      await this.printRefreshTime(currentJob);
      const start = currentJob.refreshTimeStamp[0];
      const end = currentJob.refreshTimeStamp[1];
      const [startRange, endRange] = [start, end].map((time) => this.convertToFrame(time));
      let isChange = false;
      currentJob.lineBuffer = currentJob.lineBuffer.map((a) => {
        const currentFrame = this.convertToFrame(a[0]);
        if (startRange <= currentFrame && endRange >= currentFrame) {
          if (!isChange) {
            isChange = true;
            currentJob.currentPage = a[3];
          }
          // return a;
          // return [a[0], a[1], a[2], a[3], a[4], [...a[5], this.current_refresh], true, a[6]];
          return [a[0], [], 'FL', a[3], a[4], [...a[5], this.current_refresh], true];
        }
        return a;
      });
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  /* async refreshLines(currentJob: CurrentJob, data: Buffer): Promise<boolean> {
     try {
       const start = currentJob.refreshTimeStamp[0];
       const end = currentJob.refreshTimeStamp[1];
       const [startRange, endRange] = [start, end].map((time) => this.convertToFrame(time));
       let isChange = false;
 
       // Filter lines that do not fall within the start and end range
       currentJob.lineBuffer = currentJob.lineBuffer.filter((a) => {
         const currentFrame = this.convertToFrame(a[0]);
         const shouldRemove = startRange <= currentFrame && endRange >= currentFrame;
 
         // Set the current page based on the first matching line to be removed
         if (shouldRemove && !isChange) {
           isChange = true;
           currentJob.currentPage = a[3];
         }
 
         return !shouldRemove; // Keep only lines outside the specified range
       });
 
       // Re-arrange page and line numbers after removal
       let currentPage = 1;
       let lineNumber = 1;
       const linesPerPage = 25; // Adjust this if lines per page are dynamic
 
       currentJob.lineBuffer = currentJob.lineBuffer.map((line, index) => {
         // Adjust page and line numbers
         if (lineNumber > linesPerPage) {
           currentPage++;
           lineNumber = 1;
         }
         const updatedLine = [line[0], line[1], line[2], currentPage, lineNumber, line[5]];
         lineNumber++; // Increment line number for next line
         return updatedLine;
       });
 
       return true;
     } catch (error) {
       console.log(error);
       return false;
     }
   }*/
  /* async refreshLines(currentJob: CurrentJob, data: Buffer): Promise<boolean> {
     try {
       await this.printRefreshTime(currentJob);
       const start = currentJob.refreshTimeStamp[0];
       const end = currentJob.refreshTimeStamp[1];
       const [startRange, endRange] = [start, end].map((time) => this.convertToFrame(time));
       let isChange = false;
 
       // Filter out lines that fall within the start and end range
       currentJob.lineBuffer = currentJob.lineBuffer.filter((a) => {
         const currentFrame = this.convertToFrame(a[0]);
 
         // Remove the line if it falls within the range
         if (startRange <= currentFrame && endRange >= currentFrame) {
           // Set current page based on the first matched line (if needed)
           if (!isChange) {
             isChange = true;
             currentJob.currentPage = a[3];
           }
           return false; // Exclude this line
         }
         return true; // Keep this line
       });
 
       return true;
     } catch (error) {
       console.log(error);
       return false;
     }
   }*/


  async saveData(currentJob: CurrentJob): Promise<boolean> {
    try {
      // console.log(currentJob.lineBuffer);
      currentJob.lineBuffer.sort((a, b) => {
        if (a[3] !== b[3]) {
          return a[3] - b[3];
        }
        return a[4] - b[4];
      });
      const allDts = currentJob.lineBuffer.map(a => (a && a.length ? ` ${a[5]?.length ? JSON.stringify(a[5]) : ''}  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}` : 'BLANK LINE') + `\n`)
      const log_msg = `\n ${allDts}`;
      await fsP.writeFile('finaldata.txt', log_msg + '\n length = ' + currentJob.lineBuffer?.length);
      


      const allDts2 = currentJob.lineBuffer.map(a => (a && a.length ? `page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}` : 'BLANK LINE') + `\n`)
      const log_msg2 = `\n ${allDts2}`;
      await fsP.writeFile('finaldata_plan.txt', log_msg2 + '\n length = ' + currentJob.lineBuffer?.length);


    } catch (error) {
      console.log(error);
    }
    return true;
  }



  /*async handleRefreshEnd(currentJob: CurrentJob): Promise<boolean> {
    try {
      let feedlist = currentJob.lineBuffer;

      // Step 1: Filter out rows where isBlank is true
      feedlist = feedlist.filter(row => !row[5]); // Assumes isBlank is at index 5

      // Step 2: Rearrange page and line numbers after deletion
      let currentPage = 1;
      let currentLine = 1;
      const linesPerPage = 25; // Set this as per your dynamic line count

      feedlist = feedlist.map((row, index) => {
        // Update page and line numbers
        row[3] = currentPage; // Set page number (Assumes page is at index 3)
        row[4] = currentLine; // Set line number (Assumes line is at index 4)

        // Increment line and handle page overflow
        currentLine += 1;
        if (currentLine > linesPerPage) {
          currentPage += 1;
          currentLine = 1;
        }

        return row;
      });

      // Update the currentJob's lineBuffer with the rearranged list
      currentJob.lineBuffer = feedlist;

    } catch (error) {
      console.log(error);
    }

    return true;
  }*/


  async RefreshLog(currentJob, key, val): Promise<boolean> {
    try {
      currentJob.lineBuffer.sort((a, b) => {
        if (a[3] !== b[3]) {
          return a[3] - b[3];
        }
        return a[4] - b[4];
      });
      const allDts = currentJob.lineBuffer.map(a => (a && a.length ? `  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ${a[5]?.length ? JSON.stringify(a[5]) : ''} ` : 'BLANK LINE') + `\n`)
      const log_msg = `${val}  \n ${allDts}`;
      await fsP.appendFile(`logs/refresh/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.lineBuffer?.length + '\n\n\n');
    } catch (error) {
      console.log(error);
    }
    return true;
  }



  async refreshLogsLines(currentJob, key): Promise<boolean> {
    try {
      currentJob.relaceLines.sort((a, b) => {
        if (a[3] !== b[3]) {
          return a[3] - b[3];
        }
        return a[4] - b[4];
      });
      const allDts = currentJob.relaceLines.map(a => (a && a.length ? `  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ${a[5]?.length ? JSON.stringify(a[5]) : ''}  ` : 'BLANK LINE') + `\n`)
      const log_msg = ` \n\n\n ${this.isPageGotPageNumber ? 'Page number found in refresh ' : 'Page Number not found in refresh'} ${currentJob.currentPage} \n\n\n LINES ---- \n ${allDts}`;
      await fsP.appendFile(`logs/refresh/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.relaceLines?.length + '\n\n\n');
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  removeTimestampsInRange(timestamps, range) {
    const [startRange, endRange] = range.map(this.convertToFrame);
    return timestamps.filter(([timestamp]) => {
      const currentFrame = this.convertToFrame(timestamp);
      return !(currentFrame >= startRange && endRange >= currentFrame)  //currentFrame < startRange || currentFrame > endRange;
    });
  }

  async checkForReplace(currentJob): Promise<boolean> {
    if (this.current_refresh == 4) {
      debugger;
    }
    const start = currentJob.refreshTimeStamp[0];
    const end = currentJob.refreshTimeStamp[1];
    const newData = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);
    await this.printFeedInTxt(`total = ${currentJob.lineBuffer?.length}, new = ${currentJob.relaceLines?.length} , replaces = ${currentJob.lineBuffer?.length - newData?.length} , isMore=${currentJob.relaceLines?.length > (currentJob.lineBuffer?.length - newData?.length)}`)
    return true;
  }

  async printFeedInTxt(log): Promise<boolean> {
    try {
      const log_msg = `\n\r\n\r\n\r\n\r\n\r\n\r\nRefresh Count  ${this.current_refresh}\n ${log}`;
      await fsP.appendFile('feed_refresh.txt', log_msg + '\n');
    } catch (error) {
      console.log('ERROR', error);
    }
    return true;
  }


  async printRefreshTime(currentJob: CurrentJob): Promise<boolean> {
    try {
      const start = currentJob.refreshTimeStamp[0];
      const end = currentJob.refreshTimeStamp[1];
      const log_msg = `["${start}","${end}"],`;
      await fsP.appendFile('feed_refresh_times.txt', log_msg + '\n');
    } catch (error) {
      console.log('ERROR', error);
    }
    return true;
  }


}