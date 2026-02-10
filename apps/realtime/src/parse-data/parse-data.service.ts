import { Injectable, Logger } from '@nestjs/common';
import { UtilityService } from '../utility/utility.service';
import { SessionService } from '../session/session.service';
import { CurrentJob } from '../interfaces/session.interface';
import { promises as fsP } from 'fs';
import * as fs from 'fs';
import { SequentialTaskQueue } from '../classes/squential.task';
import { Server } from 'socket.io';
import { VerifyTabsService } from '../services/verify-tabs/verify-tabs.service';
import { SocketService } from '../socket/socket.service';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';

@Injectable()
export class ParseDataService {

  public server: Server;
  public setServer(server: Server) {
    this.server = server;
  }
  private readonly logger = new Logger('caseview-parser');
  taskQueue = new SequentialTaskQueue();
  constructor(private utilityService: UtilityService,
    private readonly sessionService: SessionService, private readonly verifyTab: VerifyTabsService, private readonly socketService: SocketService,
    public savedataService: SavedataService) { }

  async parseData(incomingBuffer: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<void> {
    this.taskQueue.addTask(async () => {
      try {
        await this.parseDataQueue(incomingBuffer, currentSession, currentJob, sessions);
      } catch (error) {
        this.logger.error('Error parsing data:', error);
      }
    });
  }

  async parseDataQueue(incomingBuffer: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<void> {

    await this.addToLocalFile(incomingBuffer);

    try {
      const strBuffer = incomingBuffer.toString('ascii');
      this.utilityService.fileLog(currentSession, '\n' + Array.from(incomingBuffer).toString() + ' - ' + strBuffer, "all");

      let str = this.utilityService.replaceCustomPattern(strBuffer);

      if (this.utilityService.matchPattern(str)) {
        str = this.utilityService.pageNoReplace(str);
      }

      const modifiedBuffer = Buffer.from(str, 'ascii');

      for (let byte of modifiedBuffer) {
        if (byte !== 0x08 && byte !== 10) {
          currentJob.crLine.push(byte);
        }

        if (!currentJob.lineBuffer[currentJob.lineCount]) {
          currentJob.lineBuffer[currentJob.lineCount] = [];
        }

        let crTm = this.utilityService.getIndianTM();
        if (currentJob.lineBuffer[currentJob.lineCount] && currentJob.lineBuffer[currentJob.lineCount].length && currentJob.lineBuffer[currentJob.lineCount][0]) {
          crTm = currentJob.lineBuffer[currentJob.lineCount][0];
        }

        currentJob.lineBuffer[currentJob.lineCount] = [crTm, currentJob.crLine, currentJob.lineCount];
        this.removeExtraLines(currentJob);

        if (byte === 0x08) {
          try {
            if (currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1] != currentJob.lineCount) {
              currentJob.lineCount = currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1];
              currentJob.crLine = currentJob.lineBuffer[currentJob.lineCount][1];
            }
            this.removeExtraLines(currentJob);
          } catch (error) {
            this.logger.error('Error handling backspace:', error);
          }
          currentJob.crLine.pop();
          try {
            currentJob.globalBuffer.pop();
          } catch (error) {
            this.logger.error('Error ', error);
          }
        } else {
          try {
            currentJob.globalBuffer.push([byte, currentJob.lineCount]);
          } catch (error) {
            this.logger.error('Error ', error);
          }
        }

        if (byte == 10) {
          currentJob.crLine = [];
          currentJob.lineCount++;
        }
      }

      this.utilityService.saveData(currentJob.lineBuffer, currentSession, 'linebuffer');
      this.utilityService.saveData(currentJob.globalBuffer, currentSession, 'globalbuffer');
      let objs = {
        lineBuffer: currentJob.lineBuffer,
        lineCount: currentJob.lineCount,
        crLine: currentJob.crLine
      };
      this.utilityService.saveData(objs, currentSession, 'allsession');
    } catch (error) {
      this.logger.error('Error in parseDataQueue:', error);
    }
    await this.sendToUsers(currentJob, sessions);
  }

  private removeExtraLines(currentJob: CurrentJob): void {
    try {
      if ((currentJob.lineBuffer.length - 1) > currentJob.lineCount) {
        currentJob.lineBuffer.splice(currentJob.lineCount + 1);
      }
    } catch (error) {
      this.logger.error('Error removing extra lines:', error);
    }
  }

  async addToLocalFile(incomingBuffer: any) {
    try {
      const log_msg = (incomingBuffer.toString('hex'));
      // console.log('DATA TO WRITE',log_msg)
      const logPath = `logs/s_${this.sessionService.currentSessionid}`
      try {
        await fsP.mkdir(logPath, { recursive: true });
      } catch (error) {
      }
      fs.appendFile(`${logPath}/cmds.txt`, log_msg + '\n', (err) => {
        if (err) {
          console.error('Error appending to file:', err);
        }
        // console.log('File updated successfully!');
      });
    } catch (error) {
      this.logger.error('Error adding to local file:', error);
    }
  }






  async sendToUsers(CurrentJob: CurrentJob, sessions: any): Promise<void> {

    try {
      if (CurrentJob?.lineBuffer?.length) {
        let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];
        try {
          for (let x of array) {
            let tabs = await this.verifyTab.verify(x[1]);
            x[7] = tabs;
          }
        } catch (error) {

        }
        if (array?.length) {
          this.server.emit("message", {
            i: this.sessionService.CurrentJob.lineCount,
            d: array,
            date: this.sessionService.currentSessionid
          });
        }
      }

    } catch (error) {
      this.logger.error('Error sending to local users:', error);
    }

    try {

      const sessionLiveId = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;

      if (this.sessionService.CurrentJob.lineBuffer.length) {
        let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];
        if (array.length) {

          try {
            for (let x of array) {
              let tabs = await this.verifyTab.verify(x[1]);
              // console.log('tabs', tabs);
              x[7] = tabs;
            }
          } catch (error) {

          }

          try {
            let calculatedPage = Math.floor(array[array.length - 1][2] / (this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25)) + 1;
            let datas = {// message
              i: this.sessionService.CurrentJob.lineCount,
              d: array,
              date: sessionLiveId,
              l: this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25,
              p: calculatedPage
            }
            let localdatas = {// message
              i: this.sessionService.CurrentJob.lineCount,
              d: array,
              date: this.sessionService.currentSessionid,
              l: this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25,
              p: calculatedPage
            }
            if (this.socketService.sockets && this.socketService.sockets) {
              /*this.socketService.sockets.forEach((socket, url) => {
                try {
                  if (socket.connected) {
                    socket.emit("TCP-DATA", datas);
                    // console.log(`Data sent to socket at ${url}`);
                  } else {
                    // this.utility.markFailedPage(datas, this.sessionService.currentSessionid);
                    // console.log(`Socket at ${url} is not connected.`);
                  }
                } catch (error) {
                  // console.log(`Failed to send data to socket at ${url}: ${error}`);
                }
              });*/

              const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
              if (liveServer) {
                try {
                  liveServer.emit("TCP-DATA", datas);
                } catch (error) {
                }
              } else {
                this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`)
              }

            }
            
            await this.savedataService.saveDataFinal(localdatas, sessions, 'localdata', calculatedPage, this.sessionService.currentSessionLines);
          } catch (error) {
            // console.log('Error sending data to socket', error);

          }
        }
      }

    } catch (error) {
      this.logger.error('Error in sendToUsers:', error);
    }


  }


  getCurrentServerSocket(nSesid: string) {
    const serverUrl = `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`;//http://${this.sessionService.currentSessionDetail?.cUrl}`
    const socket = this.socketService.sockets.get(serverUrl);
    return socket
  }



}