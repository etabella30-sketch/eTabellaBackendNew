import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { assignMentReq, login, logSessionReq, ServerBuilderReq, SessionBuilderReq, SessionByCaseIdReq, SessionDataV2Req, sessionDelete, sessionEnd } from '../../interfaces/session.interface';
import { UtilityService } from '../../utility/utility.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ConnectivityService } from '../connectivity/connectivity.service';
import { promises as fs } from 'fs';
import * as path from 'path';
import { SessionService } from '../../session/session.service';


import { SyncService } from '../sync/sync.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import * as moment from 'moment';  // Make sure to install moment if it's not already installed
import { IssueService } from '../issue/issue.service';
import { SessionBackupService } from '../session-backup/session-backup.service';
import { LogService } from '@app/global/utility/log/log.service';
import { SessionStoreService } from '../session-store/session-store.service';
import { VerifyTabsService } from '../verify-tabs/verify-tabs.service';
import { DbService } from '@app/global/db/pg/db.service';
import { UnicIdentityService } from '../../utility/unic-identity/unic-identity.service';
import { schemaType } from '@app/global/interfaces/db.interface';
@Injectable()
export class SessionbuilderService implements OnModuleInit {

  // nUserid: any | null = null;
  userInfoFile: string = 'authuser.json';
  sessionInterval: any;
  private readonly logApplication: string = 'realtime/session';
  private logger = new Logger('sync-service')
  private readonly schema: schemaType = 'realtime';
  constructor(private readonly dbLite: SqllitedbService, private session: SessionService, private connectivity: ConnectivityService,
    private readonly utility: UtilityService, private httpService: HttpService, private config: ConfigService,
    private syncService: SyncService, private schedulerService: SchedulerService, private issue: IssueService
    , private sb: SessionBackupService, private log: LogService, private sessionStore: SessionStoreService, private verifyTab: VerifyTabsService,
    private db: DbService, private unicIdentity: UnicIdentityService
  ) {


    try {
      clearInterval(this.sessionInterval)
    } catch (error) {
    }
    this.sessionInterval = setInterval(async () => {
      this.log.info(`Sync `, `realtime/sync`);
      // console.log('STATUS',this.connectivity.online)
      // await this.syncSessionData();
      // await this.syncFeedData();
      await this.syncService.pushData();
    }, 1000 * 10);

  }

  async onModuleInit() {
    // const res = await this.getRefReshType();
  }
  /* async getLogSession(body: any): Promise<any> {
     // console.log('ASK SESSION ID')
     const data = await this.dbLite.getCustomQuery('select * from logsession ', []);
     if (data?.length) {
       return { msg: 1, cSession: data[0]["cSession"] };
     }
     return { msg: -1 };
   }*/

  async getlivesessionbycaseid(body: any): Promise<any> {
    // console.log('ASK SESSION ID')
    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();

    const res = await this.db.executeRef('live_sessions', { cSessionUnicId }, this.schema);
    if (res.success) {
      try {
        return { msg: 1, ...res.data[0][0] };
      } catch (error) {
        this.logger.error(`Session end failed :${res.error} `);
        return { msg: -1, value: res.error };
      }
    } else {
      this.logger.error(`Session end failed :${res.error} `);
      return { msg: -1, value: res.error };
    }

    /*  const data = await this.dbLite.getCustomQuery('select * from sessions where cStatus = ?  order by id desc limit 1 ', ['C']);
      if (data?.length) {
        return { msg: 1, nSesid: data[0]["id"] };
      }
      return { msg: -1 };*/
  }


  /* async login(body: login): Promise<any> {
     // this.nUserid = null;
     const data = await this.dbLite.get('users', 'LOWER(cEmail) = ?', [body.cEmail.toLowerCase()]);
     if (data.length) {
       this.log.info(`Login `, 'realtime/auth');
 
       // this.nUserid = data[0].id;
       // data[0]["nUserid"] = this.nUserid;
       // this.nUserid = data[0].nUserid;
       this.saveUserInfo(data[0]);
       try {
         await this.utility.saveJsonToFile({ nUserid: data[0].nUserid, cUnicuserid: data[0].nUserid }, 'userid.json');
       } catch (error) {
 
       }
       try {
         this.issue.joiningLog({ nUserid: data[0].nUserid, nSesid: null, cStatus: 'LG', cSource: 'O' })
       } catch (error) {
 
       }
       return { msg: 1, value: 'User already exists', nUserid: data[0].nUserid, userDetail: data, isAdmin: data[0].isAdmin };
     } else {
       return { msg: -1, value: 'User not found' };
 
     }
   }
 
   async saveUserInfo(userinfo) {
     await this.utility.saveJsonToFile(userinfo, this.userInfoFile);
   }*/

  // async getUserid(): Promise<any | null> {
  //   if (!this.nUserid) {
  //     const userinfo = await this.utility.readJsonFromFile(this.userInfoFile);
  //     if (userinfo && userinfo.nUserid) {
  //       this.nUserid = userinfo.nUserid;
  //     } else {
  //       this.nUserid = null;
  //     }
  //     return this.nUserid || null;
  //   } else {
  //     return this.nUserid;
  //   };
  // }

  async getSessionById(body: SessionDataV2Req) {
    const res = await this.db.executeRef('sessiondata', body, this.schema);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        this.logger.error(`Session end failed :${res.error} `);
        return []
      }
    } else {
      this.logger.error(`Session end failed :${res.error} `);
      return []
    }
  }

  /* async getSessionById(body: SessionDataV2Req) {
     debugger;
     const list = await this.dbLite.get('sessions', 'id = ?', [body.nSesid]);
     list.map(a => a.nSesid = a.id)
     list.map(a => a.cStatus = (a.id == this.session?.currentSessionid ? 'R' : a.cStatus))
     try {
       if (list.length) {
         const cProtocol = list[0]["cProtocol"];
         const nLines = list[0]["nLines"] || 25;
         const obj = await this.getFilesCount(body.nSesid, cProtocol, nLines)
         let totaIssues = 0;
         try {
           const issues = await this.dbLite.get('RIssueMaster', `(nUserid = ? or nUserid = 0) and coalesce(nCaseid,'') = coalesce(?,'')`, [body.nUserid, list[0].nCaseid]);
           if (issues?.length) {
             totaIssues = issues.length;
           }
         } catch (error) {
 
         }
 
         const defaultIssue = { cDefHIuuses: null, nLID: null, cColor: null };
         const defaultAnnotIssue = { cDefIssues: null, nLIid: null, cAColor: null };
 
         try {
 
           const sessionDetail = await this.dbLite.get('RSessionDetail', 'nSesid = ? and nUserid = ?', [body.nSesid, body.nUserid]);
 
           if (sessionDetail?.length) {
             // console.log('\n\r\n\rSession detail:', sessionDetail);
             try {
               defaultIssue.cDefHIuuses = JSON.parse(sessionDetail[0]["cDefHIssues"] || '[]');
               defaultIssue.nLID = sessionDetail[0]["nLID"];
               if (defaultIssue.cDefHIuuses?.length) {
                 const defaultlist = await this.dbLite.getCustomQuery(`select * from RIssueMaster where nIid in (${defaultIssue.cDefHIuuses.map(a => `'${a.nIid}'`).join(',')})`, []);
                 defaultIssue.cDefHIuuses = defaultIssue.cDefHIuuses.filter(item =>
                   defaultlist.some(listItem => listItem.nIid == item.nIid)
                 );
                 if (defaultIssue.cDefHIuuses?.length) {
                   // defaultIssue.cDefHIuuses.sort((a, b) => a.nIid - b.nIid);
                   defaultIssue.nLID = defaultIssue.cDefHIuuses[0]["nIid"];
                 } else {
                   defaultIssue.nLID = null;
                 }
               } else {
                 defaultIssue.nLID = null;
               }
             } catch (error) {
             }
 
             try {
               defaultAnnotIssue.cDefIssues = JSON.parse(sessionDetail[0]["cDefIssues"] || '[]');
               defaultAnnotIssue.nLIid = sessionDetail[0]["nLIid"];
               if (defaultAnnotIssue.cDefIssues?.length) {
                 const defaultlist = await this.dbLite.getCustomQuery(`select * from RIssueMaster where nIid in (${defaultAnnotIssue.cDefIssues.map(a => `'${a.nIid}'`).join(',')})`, []);
                 defaultAnnotIssue.cDefIssues = defaultAnnotIssue.cDefIssues.filter(item =>
                   defaultlist.some(listItem => listItem.nIid == item.nIid)
                 );
                 if (defaultAnnotIssue.cDefIssues?.length) {
                   // defaultIssue.cDefHIuuses.sort((a, b) => a.nIid - b.nIid);
                   defaultAnnotIssue.nLIid = defaultAnnotIssue.cDefIssues[0]["nIid"];
                 } else {
                   defaultAnnotIssue.nLIid = null;
                 }
               }
             } catch (error) {
             }
 
             try {
               if (defaultIssue.nLID) {
                 const issues = await this.dbLite.get('RIssueMaster', '(nUserid = ? or nUserid = 0) and nCaseid = ? and nIid = ?', [body.nUserid, list[0].nCaseid, defaultIssue.nLID]); //.map(a => a.nIid).join(',')
                 if (issues?.length) {
                   defaultIssue.cColor = issues[0]["cColor"];
                 }
               }
 
               if (defaultAnnotIssue.nLIid) {
                 const issuesAnnot = await this.dbLite.get('RIssueMaster', 'nIid = ?', [defaultAnnotIssue.nLIid]); //.map(a => a.nIid).join(',')
                 if (issuesAnnot?.length) {
                   defaultAnnotIssue.cAColor = issuesAnnot[0]["cColor"];
                 } else {
                   defaultAnnotIssue.nLIid = null;
                 }
               }
 
 
 
               if (!defaultIssue.cColor) {
                 const issues = await this.dbLite.get('RIssueMaster', '(nUserid = ? or nUserid = 0) and nCaseid = ? and nIid = ?', [body.nUserid, list[0].nCaseid, defaultIssue.cDefHIuuses[defaultIssue.cDefHIuuses.length - 1]["nIid"]]); //.map(a => a.nIid).join(',')
                 if (issues?.length) {
                   defaultIssue.cColor = issues[0]["cColor"];
                 }
               }
 
 
             } catch (error) {
             }
 
 
           }
 
           if (!defaultIssue.nLID) {
             const issues = await this.dbLite.get('RIssueMaster', 'nUserid = 0 and nCaseid = ? ', [list[0].nCaseid]);
             if (issues?.length) {
               defaultIssue.cDefHIuuses = [{ nIid: issues[0]["nIid"] }];
               defaultIssue.cColor = issues[0]["cColor"];
               defaultIssue.nLID = issues[0]["nIid"];
             }
           }
 
         } catch (error) {
           console.log('Error in getting session by id:', error);
         }
         list[0] = { ...list[0], maxNumber: obj.maxNumber, pageRes: obj.pageRes, totaIssues, ...defaultIssue, ...defaultAnnotIssue }
       }
     } catch (error) {
       console.log('Error in getting session by id:', error);
     }
     return list;
   }*/

  /*async reFetchSessionDetail(body): Promise<any> {
    // console.log('Re-fetching session detail');
    if (!this.connectivity.online) return { msg: -1, value: 'No internet connection' };
    try {
      if (!body.nCaseid)
        await this.syncSessionData();
      await this.syncService.syncCaseUsers(body.nSesid);
    } catch (error) {
    }
    return { msg: 1, value: 'Session detail fetched' };
  }*/

  async getFilesCount(nSesid, cProtocol, nLines): Promise<any> {

    try {
      /*if (cProtocol == 'B') {

        const data: any[] = await this.dbLite.getCustomQuery(`select count(*) as total from feed where nSesid = ?`, [nSesid]);
        if (data?.length) {
          const total = data[0]["total"] || 0;
          const pages = Math.ceil(total / nLines);

          return { pageRes: null, maxNumber: pages };
        }

      } else {*/

      const folderPath = `localdata/dt_${nSesid}`;
      try {
        await fs.access(folderPath); // Check if the folder is accessible
      } catch (error) {
        if (this.session.currentSessionid == nSesid) {
          if (this.session.CurrentJob?.lineBuffer?.length) {
            const total = this.session.CurrentJob?.lineBuffer?.length
            const pages = Math.ceil(total / nLines);
            return { pageRes: null, maxNumber: pages };
          }
        }
      }


      const files = await fs.readdir(folderPath);


      const maxNumber = files.reduce((max, file) => {
        const num = parseInt(file.replace(/\D+/g, ''), 10);
        return num > max ? num : max;
      }, 0);

      const filePath = path.join(folderPath, `page_${maxNumber}.json`);

      const pageRes = await this.processFile(filePath);

      // console.log(`The maximum folder number is: ${maxNumber}`);
      return { maxNumber, pageRes };
      // }
    } catch (error) {
      // console.error(`Error reading directory: ${error.message}`);
    }
    return { pageRes: null, maxNumber: 0 };
  }

  private async processFile(filePath: string): Promise<string> {
    const data = await fs.readFile(filePath, { encoding: 'utf8' });
    return data;
  }

  async sessionEnd(body: sessionEnd): Promise<any> {
    debugger;
    await this.sessionStore.saveSession(body.nCaseid, body.nSesid);

    const res = await this.db.executeRef('sessions_manage_status', { nSesid: body.nSesid, cStatus: 'C' }, this.schema);
    if (res.success) {
      try {
        await this.makePostRequest('sessionend', { nSesid: body.nSesid, permission: 'C' });
        // this.session.reInitSessions(1)
        this.session.loadActiveSessionDetail(res.data[0][0]["nCaseid"]);
        return res.data[0][0];
      } catch (error) {
        this.logger.error(`Session end failed :${res.error} `);
        return { msg: -1, value: res.error };
      }
    } else {
      this.logger.error(`Session end failed :${res.error} `);
      return { msg: -1, value: res.error };
    }


  }

  /* async sessionEnd(body: sessionEnd): Promise<any> {
     try {
       this.log.info(`Session End nSesid:${body.nSesid} `, this.logApplication);
       const mdl = {
         cStatus: 'C',
         isSynced: 0
       }
 
 
       await this.sessionStore.saveSession(body.nSesid);
       await this.dbLite.update('sessions', mdl, 'id = ?', [body.nSesid]);
       this.session.reInitSessions(1)
       return { msg: 1, value: 'Session ended' };
 
     } catch (error) {
       this.log.error(`Session End failed :${body.nSesid} ${error?.message} `, this.logApplication);
       console.log(error);
       return { msg: -1, value: 'Session ended failed' };
     }
 
   }*/

  async sessionCreation(body: SessionBuilderReq): Promise<any> {
    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
    const dt = body.dStartDt.replace('T', ' ');
    const timezone = moment.tz.guess();
    const parsedDateString = moment.tz(dt, 'YYYY-MM-DD hh:mm:ss A', timezone).format('YYYY-MM-DD HH:mm:ss');
    const res = await this.db.executeRef('sessions_builder', { ...body, cSessionUnicId, cTimezone: timezone }, this.schema);
    if (res.success) {
      try {
        const obj = res.data[0][0] || {};
        if (obj.msg == 1) {
          await this.setupScheduler(obj.nCaseid, obj.nSesid, parsedDateString);
        }

        // this.session.reInitSessions(1);
        this.session.loadActiveSessionDetail(res.data[0][0]["nCaseid"]);
        return obj;
      } catch (error) {
        this.logger.error(`Session Builder failed :${res.error} `);
        return { msg: -1, value: res.error };
      }
    } else {
      this.logger.error(`Session Builder failed :${res.error} `);
      return { msg: -1, value: res.error };
    }

  }


  async setupScheduler(nCaseid: string, nSesid: string, parsedDateString: string): Promise<void> {
    this.logger.verbose(`Seting up schedular: ${nSesid},${parsedDateString}`);
    try {
      await this.schedulerService.cancelJob(nSesid);
    } catch (error) {
    }

    try {
      await this.schedulerService.removeJob(nSesid);
    } catch (error) {
    }

    this.schedulerService.scheduleTask(nSesid, parsedDateString, async () => {
      this.logger.verbose(`Session Start session: ${nSesid} and Case:${nCaseid}`);
      // this.sessionSer
      const mdl = {
        cStatus: 'R', nSesid
      }
      await this.db.executeRef('sessions_manage_status', mdl, this.schema);


      // await this.session.reInitSessions(1)
      await this.session.loadActiveSessionDetail(nCaseid, nSesid);
    })
  }

  /*
    async sessionCreation(body: SessionBuilderReq): Promise<any> {
  
    
  
      console.log('Session Creation:', body);
      this.log.info(`Session Creation  ${body.cName}  ${body.dStartDt}`, this.logApplication);
      let status = 'P';
      const dt = body.dStartDt.replace('T', ' ');
      const timezone = moment.tz.guess();
      const parsedDateString = moment.tz(dt, 'YYYY-MM-DD hh:mm:ss A', timezone).format('YYYY-MM-DD HH:mm:ss');
  
  
      try {
  
        const currentDateTime = moment.tz(new Date(), timezone).format('YYYY-MM-DD HH:mm:ss');
  
        if (currentDateTime > parsedDateString) {
          status = 'R';
        }
  
  
      } catch (error) {
        console.log(error);
        status = 'P';
      }
  
      const mdl = {
        nUserid: body.nUserid,
        nSesid: null,
        nRTSid: null,
        cName: body.cName,
        cUnicuserid: body.cUnicuserid,
        cCaseno: body.cCaseno,
        dStartDt: body.dStartDt,
        nDays: body.nDays,
        nLines: body.nLines,
        nPageno: body.nPageno,
        nLSesid: null,
        cTimezone: this.utility.getCurrentTimezone(),
        cStatus: status,
        cProtocol: body.cProtocol,
        bRefresh: body.bRefresh,
        nCaseid: null
      };
      let nSesid = null;
      if (body.nSesid) {
        nSesid = body.nSesid;
        const list = await this.dbLite.get('sessions', 'id = ?', [body.nSesid]);
        if (list && list.length) {
  
          mdl.nLSesid = list[0]["nLSesid"];
          mdl.nRTSid = list[0]["nRTSid"] || 0;
          await this.dbLite.update('sessions', mdl, 'id = ?', [body.nSesid]);
          this.syncSessionData();
        } else {
          nSesid = await this.dbLite.insert('sessions', mdl);
        }
      } else {
        nSesid = await this.dbLite.insert('sessions', mdl);
      }
  
      this.log.info(`Session Created  ${nSesid} `, this.logApplication);
  
  
  
      try {
        await this.syncSessionData();
        await this.syncService.syncCaseUsers(nSesid);
      } catch (error) {
  
      }
  
      try {
        await this.createDefaultIssues(nSesid);
      } catch (error) {
  
      }
  
      try {
  
        this.schedulerService.scheduleTask(nSesid.toString(), parsedDateString, async () => {
          try {
            console.log('\n\r\n\r\n\r\n\r\n\r\n\rSession Start task:', nSesid);
            this.log.info(`Session Started  ${nSesid} `, this.logApplication);
  
            this.session.current_refresh = 0;
            const mdl = {
              cStatus: 'R',
              isSynced: 0
            }
            await this.dbLite.update('sessions', mdl, 'id = ?', [nSesid]);
  
          } catch (error) {
  
          }
  
          try {
            this.verifyTab.clearTabs();
            this.verifyTab.getAllCaseTabs(nSesid);
          } catch (error) {
  
          }
  
  
        });
  
      } catch (error) {
  
      }
      return [{ msg: 1, value: 'Saved', nSesid: nSesid }];
    }*/

  async serverBuilder(body: ServerBuilderReq): Promise<any> {
    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();

    const res = await this.db.executeRef('server_builder', { ...body, cSessionUnicId }, this.schema);
    if (res.success) {
      try {
        return res.data[0][0];
      } catch (error) {
        this.logger.error(`Server Builder failed :${res.error} `);
        return { msg: -1, value: res.error };
      }
    } else {
      this.logger.error(`Server Builder failed :${res.error} `);
      return { msg: -1, value: res.error };
    }
  }

  /*async serverBuilder(body: ServerBuilderReq): Promise<any> {


    const mdl = {
      nUserid: body.nUserid,
      cName: body.cName,
      cUrl: body.cUrl,
      nPort: body.nPort
    };

    this.log.info(`Server Builder  ${body.cUrl + ':' + body.nPort} `, this.logApplication);
    let nRTSid = null;
    if (body.nRTSid) {
      nRTSid = body.nRTSid;
      const list = await this.dbLite.get('servers', 'id = ?', [body.nRTSid]);
      if (list && list.length) {
        await this.dbLite.update('servers', mdl, 'id = ?', [body.nRTSid]);
      } else {
        nRTSid = await this.dbLite.insert('servers', mdl);
      }
    } else {
      nRTSid = await this.dbLite.insert('servers', mdl);
    }
    return { msg: 1, value: 'Saved', nRTSid: nRTSid };
  }*/

  async sessionList(body): Promise<any> {
    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
    const res = await this.db.executeRef('sessions', { cSessionUnicId, nUserid: body.nUserid, nCaseid: body.nCaseid }, this.schema);
    if (res.success) {
      if (res.data[0]?.length) {
        this.session.loadActiveSessionDetail(body.nCaseid);
      }
      return res.data[0] || [];
    } else {
      this.logger.error(`Session List failed :${res.error} `);
      return [];
    }

    /*   const list = await this.dbLite.get('sessions');
       list.map(a => a.nSesid = a.id);
       list.filter(a => a.dStartDt.toString().includes('AM') || a.dStartDt.toString().includes('PM')).map(a => a.dStartDt = this.utility.convertToProperDateFormat(a.dStartDt));
   
   
       try {
         const servers = await this.dbLite.get('servers');
         if (servers.length) {
           list.forEach(a => {
             const serObj = servers.find(b => b.id == a.nRTSid);
             if (serObj) {
               a.cUrl = serObj.cUrl;
               a.nPort = serObj.nPort;
             }
           })
   
         }
       } catch (error) {
   
       }
   
       try {
   
         return (list || []).reverse();
       } catch (error) {
         return list || []
       }
   */
  }

  async sessionServers(body): Promise<any> {
    // const nUserid = await this.getUserid();
    // if (!nUserid) {
    //   return { msg: -1, value: 'User not found' };
    // }   
    // const list = await this.dbLite.get('servers');
    // list.map(a => a.nRTSid = a.id);
    // return list || [];



    const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
    const res = await this.db.executeRef('servers', { cSessionUnicId, nUserid: body.nUserid }, this.schema);
    if (res.success) {
      return res.data[0] || [];
    } else {
      this.logger.error(`Server List failed :${res.error} `);
      return [];
    }

  }

  async sessionAssign(body: assignMentReq): Promise<any> {

    const res = await this.db.executeRef('assign_servers', body, this.schema);
    if (res.success) {
      try {
        return res.data[0][0] || [];
      } catch (error) {
        this.logger.error(`Session List failed :${res.error} `);
        return { msg: -1, value: res.error };
      }

    } else {
      this.logger.error(`Session List failed :${res.error} `);
      return { msg: -1, value: res.error };
    }
    // const nSesid = body.nSesid;
    // const mdl = {
    //   nSesid: nSesid,
    //   cUsers: body.jUserid
    // };
    // const nAssignid = await this.dbLite.insert('assignment', mdl);
    // if (!nAssignid) {
    //   return { msg: -1, value: 'Assignment failed' };
    // }
    // await this.dbLite.update('sessions', { nRTSid: body.nRTSid }, 'id = ?', [nSesid]);

    // this.syncSessionData();
    // return { msg: 1, value: 'Assigned' };
  }
  async deleteSession(body: sessionDelete): Promise<any> {
    const nSesid = body.nSesid;
    const res = await this.db.executeRef('sessions_builder', { nSesid, permission: 'D' }, this.schema);
    if (res.success) {
      try {


        try {
          await this.schedulerService.cancelJob(nSesid);
        } catch (error) {
        }

        try {
          await this.schedulerService.removeJob(nSesid);
        } catch (error) {
        }


        return res.data[0][0] || [];

      } catch (error) {
        this.logger.error(`Session List failed :${res.error} `);
        return { msg: -1, value: res.error };
      }

    } else {
      this.logger.error(`Session List failed :${res.error} `);
      return { msg: -1, value: res.error };
    }
  }
  /* async deleteSession(body: sessionDelete): Promise<any> {
     const nSesid = body.nSesid;
     this.log.info(`Session delete  ${body.nSesid} `, this.logApplication);
 
     const list = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
     if (list.length) {
       const mdl = {
         nSesid: nSesid,
         nLSesid: list[0].nLSesid
       };
       const nAssignid = await this.dbLite.insert('deletesessions', mdl);
       if (!nAssignid) {
         return { msg: -1, value: 'Delete failed' };
       }
       await this.dbLite.delete('sessions', 'id = ?', [nSesid]);
       return { msg: 1, value: 'Deleted' };
     } else {
       return { msg: -1, value: 'failed to delete' };
     }
   }*/


  /*
    async syncSessionData(): Promise<any> {
  
      if (!this.connectivity.online) return;
  
      const users = []// await this.dbLite.get('users') || [];
      const servers = await this.dbLite.get('servers') || [];
  
      const sessions = await this.dbLite.get('sessions', 'isSynced = ?', [0]) || [];
  
  
      try {
        sessions.filter(a => a.dStartDt.toString().includes('AM') || a.dStartDt.toString().includes('PM')).map(a => a.dStartDt = this.utility.convertToProperDateFormat(a.dStartDt));
      } catch (error) {
  
      }
  
      const deletesessions = await this.dbLite.get('deletesessions') || [];
  
      const jSessions = [];
      sessions.forEach((a) => {
        const obj = { nId: a.id, nSesid: a.nLSesid, nCaseid: a.nCaseid || 0, nRTSid: a.nRTSid, cCaseno: a.cCaseno, nUserid: a.nUserid, cName: a.cName, cUnicuserid: a.cUnicuserid, dStartDt: a.dStartDt, nDays: a.nDays, nLines: a.nLines, nPageno: a.nPageno, cTimezone: a.cTimezone, cRStatus: a.cStatus, cProtocol: a.cProtocol };
        jSessions.push(obj);
      })
      const jUsers = users.map((a) => ({ cEmail: a.cEmail, nId: a.id }));
      const jServers = servers.map((a) => ({ nId: a.id, nUserid: a.nUserid, cName: a.cName, cUrl: a.cUrl, nPort: a.nPort }));
  
      const jDeleted = deletesessions.map((a) => ({ nId: a.id, nSesid: a.nLSesid }));
  
      if (!jSessions.length && !jDeleted.length) return;
      const mdl = {
        jSessions: JSON.stringify(jSessions || []),
        jUsers: JSON.stringify(jUsers || []),
        jServers: JSON.stringify(jServers || []),
        jDeleted: JSON.stringify(jDeleted || [])
      }
  
      const res = await this.makePostRequest('synssessions', mdl);
      if (res.msg == 1) {
        const updateSessions = res.jUpdatedSessions || [];
  
        if (updateSessions && updateSessions.length) {
          updateSessions.forEach(async (a) => {
            await this.dbLite.update('sessions', { nLSesid: a.nSesid, isSynced: 1, nCaseid: (a.nCaseid || 1) }, 'id = ?', [a.nId]);
            try {
              if (this.session.currentSessionid == a.nId) {
                this.verifyTab.getAllCaseTabs(a.nId);
              }
            } catch (error) {
  
            }
            try {
              if (a.nCaseid) {
                // CaseDetail
                const ls = await this.dbLite.getCustomQuery(`select nCaseid from CaseDetail where nCaseid = ?`, [a.nCaseid]);
                if (!ls?.length) {
                  const mapModel = {
                    nCaseid: a.nCaseid,
                    cCasename: a.cCasename,
                    cCaseno: a.cCaseno,
                    cClaimant: a.cClaimant,
                    cRespondent: a.cRespondent,
                    cIndexheader: a.cIndexheader,
                    cDesc: a.cDesc,
                    cTClaimant: a.cTClaimant,
                    cTRespondent: a.cTRespondent
                  };
                  await this.dbLite.insert('CaseDetail', mapModel);
                } else {
                  const updateFields = {
                    cCasename: a.cCasename,
                    cCaseno: a.cCaseno,
                    cClaimant: a.cClaimant,
                    cRespondent: a.cRespondent,
                    cIndexheader: a.cIndexheader,
                    cDesc: a.cDesc,
                    cTClaimant: a.cTClaimant,
                    cTRespondent: a.cTRespondent
                  };
                  await this.dbLite.update('CaseDetail', updateFields, 'nCaseid = ?', [a.nCaseid]);
                }
  
                // c."cCasename",c."cCaseno",c."cClaimant",c."cRespondent",c."cIndexheader",c."cDesc",c."cTClaimant",c."cTRespondent"
              }
  
            } catch (error) {
  
            }
  
          });
        }
  
        try {
          if (jDeleted && jDeleted.length) {
            jDeleted.forEach(async (a) => {
              await this.dbLite.delete('deletesessions', 'id = ?', [a.nId]);
            });
          }
        } catch (error) {
        }
  
        this.session.reInitSessions(1);
      } else {
  
      }
  
      return res;
    }
  
  
  
  
    async syncFeedData(): Promise<any> {
      try {
        if (!this.connectivity.online) return;
        // const sessions = await this.dbLite.get('sessions', 'isSynced = ? ', [1]) || [];
        const sessions = await this.dbLite.get('sessions', 'isSynced = ? and isFeedSynced = ?', [1, 0]) || [];
        sessions.filter(a => a.dStartDt.toString().includes('AM') || a.dStartDt.toString().includes('PM')).map(a => a.dStartDt = this.utility.convertToProperDateFormat(a.dStartDt));
        // const todaysSessions = sessions.filter(a => new Date(a.dStartDt).getDate() == new Date().getDate()) || [];
        const todaysSessions = sessions.filter(a => moment(a.dStartDt).format('YYYY-MM-DD') == moment().format('YYYY-MM-DD')) || [];
        // console.log('Syncing feed data', sessions.length,todaysSessions.length);
        if (todaysSessions.length) {
          for (let i = 0; i < todaysSessions.length; i++) {
            // console.log('Syncing feed data for session:', todaysSessions[i].id);
            if (todaysSessions[i].nLSesid) {
  
              const mnInd = this.session.sessionsList.findIndex(a => a.id == todaysSessions[i]["id"]);
  
              // if (this.session.sessionsList["isFeedSynced"] != 1) {
              console.log('Syncing feed data for session:', todaysSessions[i].id);
              const data = await this.readFiles(todaysSessions[i].id, todaysSessions[i].cProtocol);
              // console.log('session Data:', todaysSessions[i].id, data.length);
              if (data.length) {
                const res = await this.makePostRequest('syncfeeddata', { nSesid: todaysSessions[i].nLSesid, jData: data });
                if (res && res.msg == 1) {
                  if (todaysSessions[i]["cStatus"] == 'C') {
                    await this.dbLite.update('sessions', { isFeedSynced: 1 }, 'id = ?', [todaysSessions[i].id]);
                  }
                }
              } else {
                this.session.sessionsList["isFeedSynced"] = 1;
                await this.dbLite.update('sessions', { isFeedSynced: 1 }, 'id = ?', [todaysSessions[i].id]);
              }
  
              // }
  
  
  
            }
          }
        }
      } catch (error) {
      }
    }
  
    async readFiles(nSesid: string, cProtocol: string): Promise<any[]> {
      try {
  
        const data = [];
  
        if (cProtocol == 'B') {
          const feeddata = await this.dbLite.fetchFeed('nSesid = ?', [nSesid]);
          const pageDataLength = 25;
  
          if (feeddata && feeddata.length) {
            const totalpages = Math.ceil(feeddata.length / pageDataLength);
  
            // for (let i = 1; totalpages >= i; i++) {
            for (let i = totalpages; i >= 1; i--) {
              // const pageData = feeddata.slice((i - 1) * pageDataLength, i * pageDataLength);
              const pageData = this.getPageData(feeddata, i, pageDataLength);
  
              data.push([`page${i}.json`, pageData]);
            }
          }
        } else {
          const folderPath = `localdata/dt_${nSesid}`;
          await fs.access(folderPath);
          const files = await fs.readdir(folderPath) || [];
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(folderPath, file);
              const fileContent = await fs.readFile(filePath, 'utf-8');
              data.push([file, JSON.parse(fileContent)]);
            }
          }
          return data;
        }
  
  
        return data;
      } catch (error) {
        return [];
      }
    }*/


  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }


  async makePostRequest(apipath: string, body: any): Promise<any> {
    try {
      this.logger.warn(`Making post request to ${apipath} `);
      const url = new URL(this.config.get('LIVE_SERVER') + '/session/' + apipath);
      const response = await firstValueFrom(
        this.httpService.post(url.toString(), body)
      );
      return response.data ? response.data : { msg: -1, value: 'Failed' };
    } catch (error) {
      this.logger.error(`Error in makePostRequest for ${apipath} : `, error?.message);
      this.logger.verbose(` body : `, body);
      // console.error('Failed to post data to:', apipath, error?.message);
      return { msg: -1, value: 'Failed' };
    }
  }

  async syncUsers(): Promise<any> {
    try {
      // console.log('\n\r\n\r\n\rGetUsers', new Date());
      // const savedusers: any = this.dbLite.get('users') || [];
      // if (!savedusers.length) {
      //   // console.log('\n\r\n\r\n\rUSER LENGTH', new Date());
      //   return await this.syncUserData();
      // }
    } catch (error) {
    }
  }

  async syncUserData(): Promise<any> {
    return { msg: -1, value: 'Failed' };
    // // console.log('\n\r\n\r\n\r START FETCHING', new Date());
    // const users = await this.makePostRequest('getallusers', {}) || [];
    // // console.log('\n\r\n\r\n\r Fetch users', users);
    // if (users && users.length) {
    //   await this.dbLite.truncate('users');
    //   await this.dbLite.insertMany('users', users.map((a) => ({ cFname: a.cFname, cLname: a.cLname, cEmail: a.cEmail, nUserid: a.nUserid, cIsvarify: 'Y' })));
    //   return { msg: 1, value: 'Success' };
    // } else {
    //   return { msg: -1, value: 'Failed' };
    // }
  }

  async getSessionByCaseId(query: SessionByCaseIdReq): Promise<any> {
    return await this.sessionList(query);
    // try {
    //   const sessions = await this.dbLite.get('sessions');
    //   try {
    //     sessions.filter(a => a.dStartDt.toString().includes('AM') || a.dStartDt.toString().includes('PM')).map(a => a.dStartDt = this.utility.convertToProperDateFormat(a.dStartDt));
    //   } catch (error) {
    //   }
    //   return sessions;
    // } catch (error) {
    //   return [];
    // }
  }
  async updateTrascriptStatus(body, status) {
    await this.db.executeRef('update_transcript_status', { isTranscript: status == 1 ? true : false, nSesid: body.nSesid }, this.schema);
    // await this.dbLite.update('sessions', { isTranscript: status == 1 ? 1 : 0 }, 'nLSesid = ?', [body.nSesid]);
  }

  /* async updateSessionFeedSyncStatus(id) {
     if (id) {
       try {
         const ind = this.session.sessionsList.findIndex(a => a.id == id); // && a.isFeedSynced != 0
         // console.log('\n\r CHECK', id,ind);
         if (ind > -1) {
           this.session.sessionsList[ind].isFeedSynced = 0;
           try {
             await this.dbLite.update('sessions', { isFeedSynced: 0 }, 'id = ?', [id]);
           } catch (error) {
           }
         }
       } catch (error) {
       }
     }
   }*/

  /* async createDefaultIssues(nSesid) {
     try {
 
       const sessionn = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
       if (!sessionn?.length) return;
 
       const nCaseid = sessionn[0]["nCaseid"];
       if (!nCaseid) return;
 
       const issuesCat = await this.dbLite.get('IssueCategory', 'nUserid = ? and nCaseid = ?', [0, nCaseid]);
       if (!issuesCat?.length) {
         const mdl = {
           nRefICid: 0,
           nCaseid: nCaseid,
           cCategory: 'Unassigned',
           nUserid: 0,
           dCreateDt: new Date().toISOString(),
           cICtype: 'U',
           nOICid: 0,
           isSynced: 0
         }
         await this.dbLite.insert('IssueCategory', mdl);
       }
 
       const issues = await this.dbLite.get('RIssueMaster', 'nUserid = ? and nCaseid = ?', [0, nCaseid]);
       if (!issues?.length) {
 
         const category = await this.dbLite.get('IssueCategory', 'nUserid = ? and nCaseid = ?', [0, nCaseid]);
         const nICid = category[0]["nICid"]
 
         const mdl = {
           cIName: 'Unassigned',
           cColor: 'e9e90e',
           nICid: nICid,
           dCreateDt: new Date().toISOString(),
           nUserid: 0,
           nCaseid: nCaseid
         }
         await this.dbLite.insert('RIssueMaster', mdl);
       }
     } catch (error) {
       console.log(error);
     }
   }*/

  // async postSessionData(mdl): Promise<any> {
  //   try {
  //     const url = new URL(this.config.get('LIVE_SERVER') + '/session/synssessions');
  //     const requestBody = mdl;
  //     const response = await firstValueFrom(
  //       this.httpService.post(url.toString(), requestBody)
  //     );
  //     return response.data ? response.data : { msg: -1, value: 'Failed' };
  //   } catch (error) {
  //     console.error('Failed to post data to: /session/synssessions', error);
  //     return { msg: -1, value: 'Failed' };
  //   }
  // }


  async getRefReshType(): Promise<any> {
    /*  try {
        const data = await this.dbLite.getCustomQuery(`select cType from refreshtype where id = 1 limit 1`, []);
        this.session.refreshType = data?.length ? data[0]["cType"] : 'all';
        return { msg: 1, cType: this.session.refreshType };
      } catch (error) {
        console.log(error);
        return { msg: -1 };
      }*/
  }


  async setRefreshtype(param: any): Promise<any> {
    /*  try {
        const res = await this.dbLite.getCustomQuery('update refreshtype set cType = ? where id = 1', [param.cType]);
        this.session.refreshType = param.cType;
        return { msg: 1 };
      } catch (error) {
        return { msg: -1 }
      }*/
  }


  async settimezone(param: { cTimezone: string }) {
    if (param.cTimezone)
      this.schedulerService.setTimezone(param.cTimezone);
  }
}