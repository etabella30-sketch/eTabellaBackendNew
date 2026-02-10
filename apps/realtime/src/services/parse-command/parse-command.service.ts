import { Injectable, Logger } from '@nestjs/common';
import * as async from 'async';
import * as fs from 'fs';
import { CurrentJob } from '../../interfaces/session.interface';
import { BridgeParseService } from '../../bridge-parse/bridge-parse.service';
import { SessionService } from '../../session/session.service';
import { BridgeService } from '../bridge/bridge.service';
import { promises as fsP } from 'fs';
import { SequentialTaskQueue } from '../../classes/squential.task';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ParseCommandService {
  private readonly queue;
  private readonly logger = new Logger(ParseCommandService.name);


  isComplete: number = 0;

  commands = [];
  private mdl = {
    cmdType: null,
    data: [],
    hexCmd: '',
    startlength: 0,
    endlength: 0,
    searchString: '',
    replaceString: '',
    rStart: [],
    rEnd: [],
    isRefresh: 0
  };
  private isCmdEnded = false;
  private cmdLength = 0;
  private isData = false;
  private previousCmd = null;
  private isRefresh = 0;

  private readonly CMD_TYPES = {
    0x46: { t: 'F', l: 1 },
    0x50: { t: 'P', l: 2 },
    0x4E: { t: 'N', l: 1 },
    0x54: { t: 'T', l: 4 },
    0x44: { t: 'D', l: 0 },
    0x48: { t: 'K', l: 0 },
    0x47: { t: 'G', l: null },
    0x45: { t: 'E', l: 0 },
    0x52: { t: 'R', l: 8 },
  };

  taskQueue = new SequentialTaskQueue();



  @OnEvent('command.parser.value')
  handleCommandParseEvents(payload: any) {
    console.log('command.parser.value event received:', payload);
    this.commands = payload?.data || [];
  }
  constructor(private bridgeParseService: BridgeParseService, private readonly sessionService: SessionService, private bridge: BridgeService) {





    /*this.queue = async.queue(async (task, callback) => {
       await task();
       callback();
     }, 1);
 
     this.queue.drain(() => {
     });*/

  }



  splitCommands(incomingBuffer: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any): void {
    if (this.isComplete > 0) return;

    /* this.queue.push(async () => {
       this.parseCMD(incomingBuffer, currentSession, currentJob, sessions);
     });*/
    this.taskQueue.addTask(async () => {
      await this.parseCMD(incomingBuffer, currentSession, currentJob, sessions);
    });
  }



  async parseCMD(data: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any): Promise<any> {
    // Clear previous command state before parsing
    // this.logger.warn('Rec data for parse', ' CMD TYPE ', this.mdl?.cmdType, data);
    try {
      await this.addToLocalFile(data.toString('hex'));
    } catch (error) {

    }

    // this.logger.debug(`Length of data ${this.mdl.data?.length}`);
    try {
      this.parseCommand(data, currentSession, currentJob, sessions)
    } catch (error) {
    }

  }

  // Main function to parse command data
  private async parseCommand(data: Buffer, currentSession: any, currentJob: CurrentJob, sessions: any) {
    try {
      // this.previousCmd = null;

      data.forEach((element) => {
        // for (let element of data) {
        // Start new command
        if (element === 0x02 && !this.mdl.cmdType && !this.mdl.data.length) {
          this.setStartCMD(element);
          this.previousCmd = element;
          return;
        }

        // Global replace command handling
        if (this.mdl.cmdType === 'G') {
          this.parseGlobalReplace(element, currentSession, currentJob, sessions);
          return;
        }

        // Refresh command handling
        if (this.mdl.cmdType === 'R') {
          this.refreshCmd(element, currentSession, currentJob, sessions);
          return;
        }

        // End refresh command handling
        if (this.mdl.cmdType === 'E') {
          this.handleEndRefresh(element, currentSession, currentJob, sessions);
          return;
        }

        // Set command type
        if (!this.mdl.cmdType && this.previousCmd === 0x02) {
          // console.log('REC DATA ',data)
          // this.logger.fatal(`Seting type becouse previousCmd is 0x02 and cmdType is null`,element)
          this.previousCmd = null;
          const typeSet = this.setCmdType(element);
          if (typeSet) return;
        }

        // Handle end of command
        if (element === 0x03 && this.cmdLength === this.mdl.data.length) {
          this.manageEndCmd(element);
        } else {
          this.pushData(element);
        }

        this.commandsControl(currentSession, currentJob, sessions);
      });
      // }

      this.commands.map(a => a.data1 = (!a.cmdType ? String.fromCharCode(...a.data) : a.data))



      const logPath = `logs/s_${this.sessionService.currentSessionid}`;
      try {
        await fsP.mkdir(logPath, { recursive: true });
      } catch (error) {
      }
      this.writeToJson(`${logPath}/commands.json`, this.commands);
      // this.logger.verbose('Commands processed ', this.commands?.length);
    } catch (error) {
      this.logger.error('Error during parsing:', error);
      // cb(false);
    }
  }

  private parseGlobalReplace(element: number, currentSession: any, currentJob: CurrentJob, sessions: any) {
    try {
      this.mdl.hexCmd += this.decimalToHexString(element);
      if (
        this.mdl.startlength &&
        this.mdl.searchString.length === this.mdl.startlength &&
        this.mdl.endlength &&
        this.mdl.replaceString.length === this.mdl.endlength
      ) {
        this.commands.push({
          cmdType: 'G',
          data: [],
          hexCmd: this.mdl.hexCmd,
          searchString: this.mdl.searchString,
          replaceString: this.mdl.replaceString,
          isRefresh: this.isRefresh,
        });

        this.sendForParsing({
          cmdType: 'G',
          data: [],
          hexCmd: this.mdl.hexCmd,
          searchString: this.mdl.searchString,
          replaceString: this.mdl.replaceString,
          isRefresh: this.isRefresh,
        }, currentSession, currentJob, sessions)
        // cb({
        //   cmdType: 'G',
        //   data: [],
        //   hexCmd: this.mdl.hexCmd,
        //   searchString: this.mdl.searchString,
        //   replaceString: this.mdl.replaceString,
        //   isRefresh: this.isRefresh,
        // })
        this.clearMdl();
        this.isCmdEnded = true;
        return;
      }

      if (this.mdl.startlength === 0) {
        this.mdl.startlength = element;
      } else if (this.mdl.startlength && !this.mdl.endlength && this.mdl.searchString.length !== this.mdl.startlength) {
        this.mdl.searchString += String.fromCharCode(element);
      } else if (this.mdl.startlength && this.mdl.searchString.length === this.mdl.startlength && !this.mdl.endlength) {
        this.mdl.endlength = element;
      } else if (this.mdl.startlength && this.mdl.searchString.length === this.mdl.startlength && this.mdl.endlength) {
        this.mdl.replaceString += String.fromCharCode(element);
      }
    } catch (error) {
      this.logger.error('Error in global replace parsing:', error);
    }
  }

  private refreshCmd(element: number, currentSession: any, currentJob: CurrentJob, sessions: any) {
    this.mdl.hexCmd += this.decimalToHexString(element);
    if (this.mdl.rStart.length < 4) {
      this.mdl.rStart.push(...[element]);
      // this.mdl.rStart = [...this.mdl.rStart];
    } else if (this.mdl.rStart.length === 4 && this.mdl.rEnd.length < 4) {
      this.mdl.rEnd.push(...[element]);
    } else if (this.mdl.rStart.length === 4 && this.mdl.rEnd.length === 4) {
      this.isRefresh = 1;
      this.mdl.rStart = [...this.mdl.rStart];
      this.mdl.rEnd = [...this.mdl.rEnd];


      this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);

      this.commands.push({ ...this.mdl });


      // cb({ ...this.mdl })
      this.isCmdEnded = true;
      this.clearMdl();
    }
  }

  private handleEndRefresh(element: number, currentSession: any, currentJob: CurrentJob, sessions: any) {
    this.mdl.hexCmd += this.decimalToHexString(element);
    // this.mdl.rStart = []
    this.mdl.rStart = [...this.mdl.rStart];
    this.mdl.rEnd = [...this.mdl.rEnd];
    this.commands.push({ ...this.mdl });

    this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);
    // cb({ ...this.mdl })
    this.isCmdEnded = true;
    this.clearMdl();
    // this.isComplete++;
  }

  private setStartCMD(element: number) {
    if (this.isData) {
      this.clearMdl();
    }
    this.isData = false;
    this.isCmdEnded = false;
    this.mdl.hexCmd = this.decimalToHexString(element);
  }

  private setCmdType(element: number): boolean {
    // this.logger.verbose(`Changing the log ${element}`);
    // if (this.CMD_TYPES[element]) {
    //   this.mdl.cmdType = this.CMD_TYPES[element].t;
    //   this.cmdLength = this.CMD_TYPES[element].l;
    //   this.mdl.hexCmd += this.decimalToHexString(element);
    //   if (this.mdl.cmdType === 'R') {
    //     this.isRefresh = 1;
    //   } else if (this.mdl.cmdType === 'E') {
    //     this.isRefresh = 0;
    //   }
    //   return true;
    // }
    // return false;

    let isType = true;
    if (this.CMD_TYPES[element]) {
      this.mdl.cmdType = this.CMD_TYPES[element].t;
      this.cmdLength = this.CMD_TYPES[element].l;
      this.mdl.hexCmd += this.decimalToHexString(element);
      if (this.mdl.cmdType == 'R') {
        this.isRefresh = 1;
        this.mdl.isRefresh = 1;
      } else if (this.mdl.cmdType == 'E') {
        this.isRefresh = 0;
      }

      if (this.mdl.cmdType == 'N') {
        // this.isComplete++;
      }
      // console.log('CMD TYPE'.bgGreen, mdl.cmdType)
    } else {
      isType = false;
    }
    return isType || ['R', 'E'].includes(this.mdl.cmdType);
  }

  private manageEndCmd(element: number) {
    this.mdl.hexCmd += this.decimalToHexString(element);
    this.isCmdEnded = true;
    this.isData = false;
  }

  private pushData(element: number) {
    // this.logger.fatal('Pushing data to hex')
    if (!this.mdl.cmdType) {
      this.isData = true;
    }
    this.mdl.hexCmd += this.decimalToHexString(element);
    this.mdl.data.push(element);
  }

  private commandsControl(currentSession: any, currentJob: CurrentJob, sessions: any) {
    if (this.isCmdEnded && !this.isData) {
      this.mdl.isRefresh = this.isRefresh;
      this.mdl.rStart = [...this.mdl.rStart];
      this.mdl.rEnd = [...this.mdl.rEnd];
      this.commands.push({ ...this.mdl })
      this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);
      // cb({ ...this.mdl })
      // console.log('CMD', this.mdl)
      this.mdl.data = [];
      this.mdl.cmdType = null;
      this.mdl.hexCmd = '';
    } else if (this.isData) {
      this.mdl.isRefresh = this.isRefresh;
      this.isData = false;
      try {
        if (this.commands[this.commands.length - 1].cmdType) {
          this.commands.push({
            cmdType: null,
            data: [],
            hexCmd: ''
          })

        }
        const ForCmdnewObj = {
          data: [...(this.commands[this.commands.length - 1]["data"]), ...this.mdl.data],
          hexCmd: this.mdl.hexCmd,
          isRefresh: this.mdl.isRefresh
        }
        this.commands[this.commands.length - 1] = { ...ForCmdnewObj };
      } catch (error) {

      }
      const newObj = {
        // data: [...(this.commands[this.commands.length - 1]["data"]), ...this.mdl.data],
        data: [...this.mdl.data],
        hexCmd: this.mdl.hexCmd,
        isRefresh: this.mdl.isRefresh
      }
      // console.log('CMD-DATA', newObj)
      // cb({ ...newObj })
      this.sendForParsing({ ...newObj }, currentSession, currentJob, sessions);

      this.mdl.data = [];
      this.mdl.cmdType = null;
      this.mdl.hexCmd = '';
    }

  }

  private decimalToHexString(number: number): string {
    const hexString = number.toString(16).toUpperCase();
    return hexString.length === 1 ? '0' + hexString : hexString;
  }

  private clearMdl() {
    this.mdl = {
      cmdType: null,
      data: [],
      hexCmd: '',
      startlength: 0,
      endlength: 0,
      searchString: '',
      replaceString: '',
      rStart: [],
      rEnd: [],
      isRefresh: 0
    };
  }

  // Write data to a JSON file
  private writeToJson(path: string, arrayObject: any) {
    fs.writeFile(path, JSON.stringify(arrayObject, null, 2), 'utf8', (err) => {
      if (err) {
        this.logger.error('An error occurred while writing JSON Object to File.', err);
      } else {
        // this.logger.log('JSON file has been saved successfully.');
      }
    });
  }

  async addToLocalFile(data: any) {
    try {
      const log_msg = (data);
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
      console.log('ERROR', error);
    }

  }

  private sendForParsing(data: any, currentSession: any, currentJob: CurrentJob, sessions: any) {

    // if(data.isRefresh == 1)return;

    // 
    const hex = Buffer.from(data["hexCmd"], 'hex');
    // this.bridge.SendToParseData(hex, data, currentSession, currentJob, sessions)
    this.bridgeParseService.SendToParseData(hex, data, currentSession, currentJob, sessions)

  }
}
