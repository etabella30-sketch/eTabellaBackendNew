import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import { UtilityService } from '../utility/utility.service';
import { ParseDataService } from '../parse-data/parse-data.service';
import { Server } from 'socket.io';
import { SessionService } from '../session/session.service';
import { SocketService } from '../socket/socket.service';
import { SavedataService } from '@app/global/utility/savedata/savedata.service';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { ConnectivityService } from '../services/connectivity/connectivity.service';
import { SessionbuilderService } from '../services/sessionbuilder/sessionbuilder.service';
import { BridgeParseService } from '../bridge-parse/bridge-parse.service';
import { CurrentJob } from '../interfaces/session.interface';
import { ParseCommandService } from '../services/parse-command/parse-command.service';
import { promises as fs } from 'fs';
import { join } from 'path';
import { BridgeService } from '../services/bridge/bridge.service';
import { VerifyTabsService } from '../services/verify-tabs/verify-tabs.service';

@Injectable()
export class TcpService {
    connectivity_LOG = [];
    timeReconnect = 3000
    feed_received: boolean = false;
    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }
    private client: net.Socket;
    private portNo: number = parseInt(this.config.get('TCP_PORT') || "0", 10);
    private tcpServer: any = this.config.get('TCP_SERVER');
    private connectToServer: () => void;
    private localFileName = 'localserver.json';
    public sessions = new Map<number, { sessionDate: string; currentPageData: any[]; pageNumber: number }>();
    intervalOfconnect: any;
    current_status: boolean = false;
    private readonly logApplication: string = 'realtime';
    private logger = new Logger('tcp');
    constructor(
        private readonly parserService: ParseDataService,
        private readonly utilityService: UtilityService,
        private readonly sessionService: SessionService,
        private readonly socketService: SocketService,
        public savedataService: SavedataService,
        private utility: UtilityService,
        private dateTimeService: DateTimeService,
        private config: ConfigService, private log: LogService, private connectivityService: ConnectivityService,
        private sessionBuilder: SessionbuilderService, private BridgeParseService: BridgeParseService, private CommandParserService: ParseCommandService
        , private bridge: BridgeService,
        private readonly verifyTab: VerifyTabsService
    ) {

        this.connectToServer = async () => {
            this.emitConnectionStatus(false);
            this.logger.fatal(`TCP Conneting to server`);
            this.log.report(`TCP Conneting to server`, `${this.logApplication}/tcp`);
            // console.log('TCP Conneting to server', this.logApplication, this.sessionService.sessionsList);
            try {
                clearTimeout(this.intervalOfconnect);
                this.intervalOfconnect = null;
                this.feed_received = false;
            } catch (error) {

            }
            // try {
            //     if (this.sessionService.sessionsList.length == 0) {
            //         // console.log('No sessions found');
            //         this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);
            //         this.logger.error(`Failed TCP connection session: Session not found `)
            //         return;
            //     }
            // } catch (error) {

            // }


            try {
                // console.log("Connecting to server");

                let Localdata = await this.utilityService.readJsonFromFile(this.localFileName);
                if (Localdata) {
                    this.portNo = parseInt(Localdata.port || "0", 10);
                    this.tcpServer = Localdata.ip;
                    // this.protocol = Localdata.protocol;
                } else {
                    // this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);
                    // console.log("Localdata not found, Connection failed");
                    return;
                }
                this.set_log(0, 'Attempting to connect to server ' + this.tcpServer + ':' + this.portNo);
                this.log.report('Attempting to connect to server ' + this.tcpServer + ':' + this.portNo, `${this.logApplication}/tcp`)

                try {
                    if (this.client) {
                        this.client.destroy();  // Ensures the client connection is immediately closed
                        return;
                    }

                } catch (error) {

                }

                this.client = new net.Socket();
                this.client.connect(this.portNo, this.tcpServer, () => {
                    this.logger.warn(`TCP CONNECTED ${this.tcpServer + ':' + this.portNo}`)
                    this.emitConnectionStatus(true);
                    this.log.report(`TCP CONNECTED ${this.tcpServer + ':' + this.portNo}`, `${this.logApplication}/tcp`)
                    this.set_log(1, 'Connected to server');
                    // this.sessionService.reInitSessions(4);
                });

                this.client.on('data', (data) => {
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    } catch (error) {

                    }
                    this.set_log(4, 'Feed received from server');
                    let sesid = this.sessionService.getCurrentSession();
                    if (sesid != this.sessionService.currentSessionid) {
                        // this.sessionService.loadActiveSessionDetail(null,)
                        // this.logger.verbose(`Changing session oldSession :${this.sessionService.currentSessionid}`)
                        // this.sessionService.protocol = this.sessionService.getCurrentSessionProtocol(sesid);
                        // this.server.emit('session-change', { msg: 1 });
                        // this.sessionService.CurrentJob = this.sessionService.reInitVariables();
                        // this.sessionService.checkForSessionChange(sesid);
                        // this.CommandParserService.commands = [];
                        // this.BridgeParseService.cmds = 0;
                        // // this.BridgeParseService.current_refresh = 0;
                        // this.sessionService.current_refresh = 0;
                        // this.sessionService.currentSessionid = sesid;
                        // this.logger.verbose(`Current SessionId is ${this.sessionService.currentSessionid}`)
                    }
                    if (this.sessionService.protocol == 'C') {
                        this.parserService.parseData(data, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
                        try {
                            if (false) {
                                console.log('CurrentJob\n\r', JSON.stringify({
                                    crLine: this.sessionService.CurrentJob.crLine,
                                    // lineBuffer: this.sessionService.CurrentJob.lineBuffer,
                                    lineCount: this.sessionService.CurrentJob.lineCount,
                                    currentPage: this.sessionService.CurrentJob.currentPage,
                                    currentLineNumber: this.sessionService.CurrentJob.currentLineNumber,
                                    currentTimestamp: this.sessionService.CurrentJob.currentTimestamp,
                                    customTimestamp: this.sessionService.CurrentJob.customTimestamp,
                                    currentFormat: this.sessionService.CurrentJob.currentFormat,
                                    isRefresh: this.sessionService.CurrentJob.isRefresh,

                                }));
                                // console.log('CurrentJob\n\r', this.sessionService.CurrentJob.lineBuffer);
                                console.log('line buffer\n\r', JSON.stringify(this.sessionService.CurrentJob.lineBuffer));
                            }
                        } catch (error) {

                        }
                        // this.sessionBuilder.updateSessionFeedSyncStatus(this.sessionService.currentSessionid)

                        // this.emit_to_local_users();
                        // this.emit_to_users();
                    } else if (this.sessionService.protocol == 'B') {
                        this.CommandParserService.splitCommands(data, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
                        return;
                    }

                });
                this.client.on('end', (data) => {
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP ENDS `, `${this.logApplication}/tcp`)
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    } catch (error) {

                    }

                });
                this.client.on('close', () => {
                    this.logger.error(`TCP Close`)
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP CLOSED `, `${this.logApplication}/tcp`)
                    this.set_log(2, 'Connection closed');
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    } catch (error) {

                    }
                    this.client = null;
                    this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);  // Reconnect after a delay
                    // console.log('Connection closed');
                });

                this.client.on('error', (error) => {
                    this.logger.error(`TCP Error `, error?.message)
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP ERROR ${error?.message}`, `${this.logApplication}/tcp`, 'E')
                    this.set_log(3, `Connection failed ${error}`);
                    // console.error('Socket error:', error.message);
                    // this.client.destroy();  // Ensure socket is cleaned up
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    } catch (error) {

                    }
                    this.client = null;
                    this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);  // Reconnect after a delay
                });

            } catch (error) {
                this.set_log(3, `Connection failed ${error}`);
                // conso/le.log('CONNECTION FAILED:', error);
            }
        };
        this.connectToServer();
    }

    reconnectFn() {
        this.log.report(`TCP reconnect`, `${this.logApplication}/tcp`)
        // if (this.client) {
        //     this.log.info(`TCP DESTROYED : ${this.client.destroyed ? true : false}`);
        //     if (this.client.destroyed) {
        this.connectToServer();
        //     }
        // }
    }
    destroyPrevious() {
        return new Promise((resolve, reject) => {
            if (this.client.destroyed) {
                resolve(1);
                return;
            }
            this.client.on('close', () => {
                resolve(2);
            });
            this.client.on('end', () => {
                resolve(3);
            });
            this.client.on('error', () => {
                resolve(4);
            });
            this.client.destroy();
            // this.client = null;
        })
    }

    public async reconnectServer() {
        this.log.report(`TCP reconnectServer()`, `${this.logApplication}/tcp`)
        this.connectToServer();
    }

    /*async emit_to_users() {
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
                        this.socketService.sockets.forEach((socket, url) => {
                            try {
                                if (socket.connected) {
                                    socket.emit("TCP-DATA", datas);
                                    // console.log(`Data sent to socket at ${url}`);
                                } else {
                                    this.utility.markFailedPage(datas, this.sessionService.currentSessionid);
                                    // console.log(`Socket at ${url} is not connected.`);
                                }
                            } catch (error) {
                                // console.log(`Failed to send data to socket at ${url}: ${error}`);
                            }

                        });
                    }


                    // if (this.socketService.curremtSocket) {
                    //     this.socketService.curremtSocket.emit("TCP-DATA", datas);

                    // }
                    // Math.floor(msg.d[msg.d.length - 1][2] / currentSessionLines) + 1;

                    this.savedataService.saveData(localdatas, this.sessions, 'localdata', calculatedPage, this.sessionService.currentSessionLines);
                } catch (error) {
                    // console.log('Error sending data to socket', error);

                }
            }
        }
    }*/

    async emit_to_local_users() {
        if (this.sessionService.CurrentJob.lineBuffer.length) {
            let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];

            try {
                for (let x of array) {
                    let tabs = await this.verifyTab.verify(x[1]);
                    // console.log('tabs', tabs);
                    x[7] = tabs;
                }
            } catch (error) {

            }
            if (array.length) {
                this.server.emit("message", {
                    i: this.sessionService.CurrentJob.lineCount,
                    d: array,
                    date: this.sessionService.currentSessionid
                });
            }
        }
    }


    insert_log(log) {
        //  this.connectivity_LOG.push(log);
    }
    async set_log(type, message) {
        let types = ['Attempt', 'Connected', 'Disconnected', 'Error', 'Feed', 'Success'];

        if (type == 4 && !this.feed_received)
            this.feed_received = true;
        else if (type == 4 && this.feed_received)
            return;
        else if ([0, 1, 2, 3, 5].includes(type) && this.feed_received)
            this.feed_received = false;
        // console.log('this.sessionService.nUserid = ', this.sessionService.nUserid);

        let userid = await this.sessionService.getUserid();
        let log: any = { nId: type, date: this.dateTimeService.getCurrentTime(), message: message, nUserid: userid, nLogid: 0, cPermission: "I" };
        // console.log('log', log);
        this.insert_log(log);


        if (!this.connectivityService.online) {
            log.nLogid = Math.random() * 10;
            log.dDt = log.date;
            log.cMsg = log.message;
            this.server.emit("log-data", log);
            return;
        }
        try {
            // let data = await this.sessionService.insertConnectivityLog(log);

            // if (data && data.length) {
            //     log.nLogid = data[0].nLogid;
            // }
        } catch (error) {

        }


        log.dDt = log.date;
        log.cMsg = log.message;
        this.server.emit("log-data", log);
    }


    emitConnectionStatus(status) {
        this.current_status = status;
        if (this.server) {
            this.server.emit("tcp-connection-status", { status: status });
        }
    }




    async readJsonAndSendData(body: any) {

        const data = await this.getJsonData(body.cCmd)

        const list = body.nLength ? data.splice(0, body.nLength) : data;


        let sesid = this.sessionService.getCurrentSession();
        // if (sesid != this.sessionService.currentSessionid) {
        this.sessionService.protocol = this.sessionService.getCurrentSessionProtocol(sesid);

        this.sessionService.CurrentJob = this.sessionService.reInitVariables();
        this.sessionService.checkForSessionChange(sesid);
        // }



        for (let x of list) {
            await this.delayFn(body.nDelay)
            let hex;
            if (x.cmdType) {
                hex = Buffer.from(x.hexCmd, 'hex');
            } else {
                hex = Buffer.from(x.data) // x.data.map(num => num.toString(16).padStart(2, '0')).join('');
                // console.log(hex.length)
                x["hexCmd"] = hex
            }
            // this.bridge.SendToParseData(hex, x, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions)
            this.BridgeParseService.SendToParseData(hex, x, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions)
            // this.CommandParserService.splitCommands(data, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
        }

        return { msg: 1, body, data: data.splice(0, body.nLength) }
    }



    async getJsonData(file): Promise<any> {
        // console.log('Getting json file')
        const filePath = join(this.config.get('ASSETS'), (file || 'cmd.json')); // Adjust the path as per your file location

        // console.log('path', filePath)
        const fileContent = await fs.readFile(filePath, 'utf8');

        // console.log('File conenct rec')
        return JSON.parse(fileContent);
    }


    async delayFn(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}