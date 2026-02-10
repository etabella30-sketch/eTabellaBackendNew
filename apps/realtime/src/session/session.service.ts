import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

import * as moment from 'moment-timezone';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { UtilityService } from '../utility/utility.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { Server } from 'socket.io';
import { promises as fs } from 'fs';
import * as fso from 'fs';
import { promisify } from 'util';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { SqllitedbService } from '../services/sqllitedb/sqllitedb.service';
import { CurrentJob, currentSessionDetail, DocinfoReq, filedataReq, filedataRes } from '../interfaces/session.interface';
import { userSesionData } from '../interfaces/session.interface';
import { IssueService } from '../services/issue/issue.service';
import { LogService } from '@app/global/utility/log/log.service';
import { DbService } from '@app/global/db/pg/db.service';
import { UnicIdentityService } from '../utility/unic-identity/unic-identity.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { VerifyTabsService } from '../services/verify-tabs/verify-tabs.service';
import { SessionStoreService } from '../services/session-store/session-store.service';


@Injectable()
export class SessionService implements OnApplicationBootstrap {

    private server: Server;
    public setServer(server: Server) {
        this.server = server;
    }

    public sessionsList = [];
    public currentSessionid: string = null;
    public currentSessionDetail: currentSessionDetail = {} as currentSessionDetail;
    public currentSessionLines = 0;
    public currentSessionHaveRefresh = true;
    public nUserid = null;
    public CurrentJob: CurrentJob = this.reInitVariables();
    // public CurrentJob = this.reInitVariables();
    private readFileAsync = promisify(fso.readFile);
    protocol: any = 'C';
    caseTabs: any = [];

    current_refresh: number = 0;
    refreshType: 'all' | 'no-first-last' | 'no-first' | 'no-last' = 'all';
    private readonly schema: schemaType = 'realtime';
    private logger = new Logger('sync-service')
    constructor(private httpService: HttpService, @Inject('WEB_SOCKET_SERVER') private ios: Server, private dt: DateTimeService, private utility: UtilityService,
        private schedulerService: SchedulerService, private config: ConfigService, private dblite: SqllitedbService,
        private issueService: IssueService, private log: LogService, private db: DbService, private unicIdentity: UnicIdentityService,
        private readonly verifytab: VerifyTabsService) {
        //  private readonly sessionStore: SessionStoreService


        // setInterval(() => {
        //     console.log(this.protocol, 'Current session id', this.currentSessionid);
        //   }, 1000);


    }
    async onApplicationBootstrap() {
        // this.reInitSessions(-1)
        // this.loadActiveSessionDetail();
    }

    async reInitSessions(flgs): Promise<boolean> {
        // try {
        // let obj = await this.utility.readJsonFromFile('userid.json');
        // if (obj && obj.cUnicuserid) {
        /*   try {
               this.logger.verbose('Initilizing session')
               // this.nUserid = obj.nUserid
               let sessionsData: any = await this.getTodaySessions({ dDate: this.dt.getCurrentTime() });
               if (sessionsData && sessionsData.length > 0) {
                   this.sessionsList = [];
                   this.sessionsList = sessionsData;
                   this.sessionsList.map(a => a.dStartDt = moment(a.dStartDt).utc().toDate());
                   let newId = this.utility.findCurrentSessionId(this.sessionsList)
                   newId = this.getCurrentSession();
                   if (this.currentSessionid != newId) {
                       await this.checkForSessionChange(newId);
                       this.ios["server"].emit('session-change', { msg: 1 });
   
                       // this.allCurrentSessionData(newId);
   
                   }
                   this.currentSessionid = newId;
                   this.logger.verbose(`Current SessionId is ${this.currentSessionid}`)
                   this.protocol = this.getCurrentSessionProtocol(newId);
   
                   if (flgs == -1 && this.currentSessionid) {
                       return true;
                   }
               } else {
                   // console.log('Faild to get session data', this.currentSessionid);
               }
           } catch (error) {
               this.logger.error('Failed to fetch sessions:', error);
           }
           // }
           // } catch (error) {
   
           // }*/
        return false;

    }





    reInitVariables() {
        console.log('Clearing session')
        return {
            id: null,
            ind: 0,
            globalBuffer: [],
            lineBuffer: [],
            crLine: [],
            lineCount: 0,
            timestamps: [],
            currentPage: 1,
            LastKey: null,
            relaceLines: [],
            currentLineNumber: 1
        };
    }
    async allCurrentSessionData(id) {
        /* console.log('\n\r\n\r\n\r Fetching current');
         this.reInitVariables();
         try {
 
             const isFeedExists = await this.issueService.isFeedExistForSession(id);
             if (isFeedExists) {
                 const feeddata = await this.dblite.fetchFeed('nSesid = ?', [id]);
                 this.CurrentJob.lineBuffer = feeddata || [];
                 this.CurrentJob.crLine = this.CurrentJob.lineBuffer[this.CurrentJob.lineBuffer.length - 1] || [];
                 this.CurrentJob.lineCount = this.CurrentJob.lineBuffer.length - 1 || 0;
             } else {
                 this.getLastPageData(id).then(async (data) => {
                     if (data && data.d) {
                         this.CurrentJob.lineBuffer = data.d.lineBuffer || [];
                         this.CurrentJob.crLine = data.d.crLine || [];
                         this.CurrentJob.lineCount = data.d.lineCount || 0;
                         let global = await this.readGlobalFile(id)
                         if (global && global.d && global.d.length) {
                             this.CurrentJob.globalBuffer = global.d || [];
                         }
 
                     }
                 });
             }
         } catch (error) {
 
         }
         return;*/

    }

    async getLastPageData(sesid): Promise<any> {
        /* try {
             const files = await fs.readdir(`data/dt_${sesid}`);
             const jsonFiles = files.filter(file => file.endsWith('.json'));
 
             // Determine the last page number
             const lastPageNumber = jsonFiles
                 .map(file => parseInt(file.match(/(\d+)/)?.[0] || '0'))
                 .reduce((max, num) => num > max ? num : max, 0);
 
             if (lastPageNumber === 0) {
                //  throw new Error('No valid JSON files found');
             }
 
             // Construct the file name and read it
             const lastPageFile = `page_${lastPageNumber}.json`;
             const data = await fs.readFile(path.join(`data/dt_${sesid}`, lastPageFile), 'utf8');
             return {d:JSON.parse(data),p:lastPageNumber};
         } catch (error) {
             console.log('Failed to read last page data:', error);
             return {d:[],p:0};
         }*/
        try {
            const lastPageFile = `allsession.json`;
            const data = await fs.readFile(path.join(`data/sessions${sesid}`, lastPageFile), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }


    async readGlobalFile(sesid): Promise<any> {
        try {
            const lastPageFile = `globalbuffer.json`;
            const data = await fs.readFile(path.join(`data/sessions${sesid}`, lastPageFile), 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }



    async getUserid(): Promise<any> {
        /* if (!this.nUserid) {
             let obj = await this.utility.readJsonFromFile('userid.json');
             if (obj && obj.nUserid) {
                 this.nUserid = obj.nUserid;
             }
         }*/

        return this.nUserid;
    }

    setRunningId() {

        /*let now = moment(this.dt.getCurrentTime());
        let running = this.sessionsList.filter(a => a.dStartDt < now);
        if (running.length > 0) {
            running.sort((a, b) => b.dStartDt - a.dStartDt);
            this.currentSessionid = running[0].nSesid;
            this.logger.verbose(`Current SessionId is ${this.currentSessionid}`)
        }*/
    }


    public getCurrentSession() {
        // console.log('Current session id', this.currentSessionid)
        // let ids = this.utility.findCurrentSessionId(this.sessionsList)
        // // console.log('\n\r IDS ', ids);
        // let ojs = this.sessionsList.find(a => a.nSesid == this.currentSessionid);
        // if (ojs) {
        //     this.currentSessionLines = ojs.nLines;
        //     this.currentSessionHaveRefresh = ojs.bRefresh
        // }
        return this.currentSessionid; //ids;
    }





    public getCurrentSessionProtocol(id: string) {
        let ojs = this.sessionsList.find(a => a.nSesid == id);
        if (ojs) {
            return ojs?.cProtocol;
        }
        return ''
    }

    async getTodaySessions(params?: any): Promise<any> {
        try {


            const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
            const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);

            if (res?.success) {
                const list = res.data[0];
                if (list && list.length) {
                    for (const session of list) {
                        if (session.dStartDt.toString().includes('AM') || session.dStartDt.toString().includes('PM')) {
                            session.dStartDt = this.utility.convertToProperDateFormat(session.dStartDt);
                        };

                    }
                    return list;

                }

                return [];

            } else {
                this.logger.error('Failed to fetch sessions:', res.error);
                return [];
            }




        } catch (error) {
            console.error('Failed to fetch data:');
            return [];
        }
    }



    async getSessionsServers(nCaseid: string): Promise<any> {
        try {

            const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
            const res = await this.db.executeRef('session_servers', { cSessionUnicId, nCaseid }, this.schema);
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

            /* 
              const query = `select * from sessions s join servers t on t.id = s.nRTSid where s.cStatus != ?  `
              const list = await this.dblite.getCustomQuery(query, ['C'])
  
              return list;*/


        } catch (error) {
            console.error('Failed to fetch data for : /session/todayservers');
            return [];
        }
    }


    async postCreateUsers(cUnicuserid: any): Promise<any> {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/session/CreateUser');
            // console.log('url', url.toString(), cUnicuserid, 'cUnicuserid')
            // Prepare the request body
            const requestBody = { cUnicuserid };

            const response = await firstValueFrom(
                this.httpService.post(url.toString(), requestBody)
            );
            return response.data;

        } catch (error) {
            console.error('Failed to post data to: /session/createUser', error?.message);
            return [];
        }
    }
    async insertConnectivityLog(param: any): Promise<any> {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/session/insertConnetivityLog');
            // console.log('url', url.toString(), 'param', param)
            // Prepare the request body
            const requestBody = param;

            const response = await firstValueFrom(
                this.httpService.post(url.toString(), requestBody)
            );
            return response.data;

        } catch (error) {

            console.error('Failed to post data to: /session/insertConnetivityLog');
            return [];
        }
    }

    async checkForSessionChange(id): Promise<any> {
        try {
            // let obj = await this.utility.readJsonFromFile('userid.json');
            // if (obj && obj.cUnicuserid) {
            //     console.log('Clearing current job')
            //     return;

            // }
            this.CurrentJob = this.reInitVariables();

            return [];
        } catch (error) {
            console.error('Failed to post data to: /session/insertConnetivityLog');
            return [];
        }
    }


    async makeGetRequest(url: string, params: { [key: string]: any }): Promise<any> {
        try {
            const dynamicUrl = new URL(url);

            // Append parameters to the URL
            Object.keys(params).forEach(key => dynamicUrl.searchParams.append(key, params[key]));
            // console.log('GET request to URL:', dynamicUrl.toString(), 'with params:', params);

            const response = await firstValueFrom(
                this.httpService.get(dynamicUrl.toString())
            );
            // console.log('Response:', response.data); // Log the response
            return response.data;

        } catch (error) {
            console.error('Failed to get data from:', url, error);
            return { error: 'Failed to fetch data', details: error.message };
        }
    }



    async makePostRequest(url: string, body: { [key: string]: any }): Promise<any> {
        try {
            // console.log('POST request to URL:', url, 'with body:', body);

            const response = await firstValueFrom(
                this.httpService.post(url.toString(), body, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': '*/*'
                    }
                })
            );
            return response.data;

        } catch (error) {
            console.error('Failed to post data to:', url, error?.message);
            return { error: 'Failed to post data', details: error.message };
        }
    }


    getLiveId(sessionId) {
        const obj = this.sessionsList.find(a => a.id == sessionId)
        if (obj) {
            return obj.nLSesid;
        }
        return 0;
    }

    async readJsonFromFile(filePath: string): Promise<any> {
        try {
            // Read file content
            const fileContent = await this.readFileAsync(filePath, 'utf8');

            // Parse JSON string to an object
            return JSON.parse(fileContent);
        } catch (error) {
            // console.error('Error reading JSON from file:', error);
            return null;
        }
    }

    async getRealtimeSessionData(mdl: userSesionData) {

        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);
        if (!res?.success) {
            return { msg: -1, value: 'Failed to fetch sessions', error: res.error };
        }
        const sessionls = res.data[0] || [];
        if (!sessionls?.length) {
            return { msg: -1, value: "Session Not Synced" };
        }

        const nSesid = sessionls[0]["nSesid"];

        const path = `${this.config.get('TRANS_LOCAL_PATH')}s_${nSesid}.json`;
        try {
            if (!fso.existsSync(path)) {
                return { msg: -1 }
            }
            const data = await this.readJsonFromFile(path);

            // if (data.length) {

            //     const annotations = await this.issueService.getAnnotationOfPages({ nSessionid: mdl.nSesid, nUserid: mdl.nUserid, nCaseid: mdl.nCaseid, cTranscript: 'A' });
            //     console.log('\n\n\n\n\n annotations', annotations, '\n\n\n\n\n\n');
            //     debugger;

            //     try {
            //         if (annotations[0].length || annotations[1].length) {
            //             for (let x of data) {
            //                 x.hyperlinks = [];
            //                 x.annotations = [];
            //                 if (annotations[0].length) {
            //                     x.annotations.push(...annotations[0].filter(a => Number(a.pageIndex) == x.page));
            //                 }
            //                 if (annotations[1].length) {
            //                     x.hyperlinks.push(...annotations[1].filter(a => Number(a.cPageno) == x.page));
            //                 }
            //             }
            //         }
            //     } catch (error) {

            //     }

            // }

            return { msg: 1, data }
        } catch (error) {
        }
        return { msg: -1 }
    }




    async getFiledata(body: filedataReq): Promise<filedataRes> {
        try {

            let res = await this.db.executeRef('get_filedata', body);
            if (res?.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Failed to fetch', error: error?.message };
        }
    }


    async getDocinfo(query: DocinfoReq): Promise<any> {
        let res = await this.db.executeRef('individual_doc_info', query);
        if (res?.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }



    async loadActiveSessionDetail(nCaseid: string, nSesid: string = null) {

        debugger;

        if (!nCaseid) {
            this.logger.error('nCaseid not found ')
            this.logger.verbose(`\n\n\ ACTIVE SESSION DETAIL id:${this.currentSessionid}, lines:${this.currentSessionLines}, protocol: ${this.protocol} \n\r`)
            return;
        }
        try {
            const detail = await this.getSessionDetail(nCaseid);
            this.utility.emitEvent('socket.server.connect', { nCaseid: nCaseid });
            if (detail) {
                if (detail.nSesid != this.currentSessionid) {

                    this.currentSessionDetail = detail;

                    this.logger.verbose(`Changing session oldSession :${this.currentSessionid}`)
                    this.protocol = this.getCurrentSessionProtocol(detail.nSesid);

                    this.logger.fatal('Session Detail', this.currentSessionDetail);
                    this.CurrentJob = this.reInitVariables();
                    this.checkForSessionChange(detail.nSesid);
                    this.utility.emitEvent('command.parser.value', { data: [] });
                    this.utility.emitEvent('bridge.data.cmd.event', { data: [] });
                    // this.CommandParserService.commands = [];
                    // this.BridgeParseService.cmds = 0;

                    this.current_refresh = 0;
                    this.currentSessionid = detail.nSesid;
                    this.logger.verbose(`Current SessionId is ${this.currentSessionid}`)

                    this.currentSessionid = detail.nSesid;
                    this.currentSessionLines = detail.nLines || 25;
                    this.protocol = detail.cProtocol || 'C';
                    this.currentSessionHaveRefresh = true;

                    this.server.emit('session-change', { msg: 1 });


                    if (this.protocol == 'B' && this.currentSessionid) {
                        try {
                            this.verifytab.clearTabs();
                            await this.verifytab.getAllCaseTabs(this.currentSessionid);
                        } catch (error) {
                        }

                        await this.fetchSessionFeedToLocal(this.currentSessionid);
                    }
                    // this.fetchAllServerDetail(data?.nCaseid);
                }
            } else {
                this.logger.error('No running session found')
                this.currentSessionid = null;
                // this.currentSessionDetail = null;
            }
            // return 
        } catch (error) {
            this.logger.error('Failed to load current session', error);
        }

        this.logger.verbose(`\n\n\ ACTIVE SESSION DETAIL id:${this.currentSessionid}, lines:${this.currentSessionLines}, protocol: ${this.protocol} \n\r`)
        // this.currentSessionid = 
    }


    async getSessionDetail(nCaseid: string, nSesid: string = null) {
        let res = await this.db.executeRef('current_active_session', { nCaseid, nSesid }, 'realtime'); //nSesid,
        if (res?.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return null
            }

        } else {
            return null
        }
    }


    async fetchSessionFeedToLocal(nSesid: string): Promise<boolean> {
        try {
            this.utility.emitEvent('session.store.fetchmetadata', { nSesid });
            // const sessionData = await this.sessionStore.fetchSessionMetaData(nSesid);
            // if (Object.keys(sessionData)?.length) {
            //     this.CurrentJob = Object.assign(this.CurrentJob, sessionData);
            //     const sessions = await this.sessionStore.getAllLinesForSession(nSesid);
            //     this.utility.sortArray(sessions);
            //     this.CurrentJob.lineBuffer = sessions;
            // }
        } catch (error) {
            console.log(error);
        }
        return true;
    }



}