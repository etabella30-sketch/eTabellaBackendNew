import { DbService } from '@app/global/db/pg/db.service';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ActiveSessionDetailReq, ActiveSessionReq, CaseListReq, DocInfoReq, DocInfoRes, DocinfoReq, RTLogsReq, RTLogsSessionUserReq, RTLogsUserLGReq, SearchedUserListReq, ServerBuilderReq, SessionBuilderReq, SessionByCaseIdReq, SessionDataReq, SessionDataV2Req, SessionDeleteReq, SessionListReq, TranscriptFileReq, assignMentReq, bundleDetailSEC, caseDetailSEC, createUserInterfaceReq, filedataReq, filedataRes, logJoinReq, publishSEC, sectionDetailSEC, sessionDertailReq, setServerReq, synsSessionsMDL, updateTransStatusMDL, userListReq, userSesionData } from '../../interfaces/session.interface';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { SchedulerService } from '@app/global/utility/scheduler/scheduler.service';
import { FirebaseService } from '../firebase/firebase.service';
import { Server } from 'socket.io';
import { UsersService } from '../users/users.service';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fss } from 'fs';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import { IssueService } from '../issue/issue.service';
import { AnnotTransferService } from '../annot-transfer/annot-transfer.service';
import { query } from 'express';
import * as ExcelJS from 'exceljs';
import { FeedDataService } from '../feed-data/feed-data.service';
import { schemaType } from '@app/global/interfaces/db.interface';


@Injectable()
export class SessionService implements OnApplicationBootstrap {

    public tempFilePath = './assets/export-excel';
    private readFileAsync = promisify(fs.readFile);

    private realtimeSchema: schemaType = 'realtime';
    constructor(private db: DbService, public dateTimeService: DateTimeService, private annotTransfer: AnnotTransferService, @Inject('WEB_SOCKET_SERVER') private ios: Server, public schedulerService: SchedulerService, private firebaseService: FirebaseService, private user: UsersService,
        private readonly config: ConfigService, private issueService: IssueService, private feedData: FeedDataService) {

    }

    async onApplicationBootstrap() {
        // console.log('Session initing')
        let res = await this.db.executeRef('realtime_upcomming_sessions', {});
        if (res.success) {
            // for (let x of res.data[0]) {
            //     this.setSchedular(x)
            // }
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getSessions(body: SessionListReq): Promise<any> {
        // body.dDate = this.dateTimeService.getCurrentTime();
        let res = await this.db.executeRef('realtime_sessionlist', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getSessiondata(body: SessionDataReq): Promise<any> {
        let res = await this.db.executeRef('realtime_sessiondata', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getSessiondataV2(body: SessionDataV2Req): Promise<any> {
        debugger;
        let res = await this.db.executeRef('realtime_sessiondata', body);
        if (res.success) {

            try {
                if (res.data[0].length) {
                    const obj = await this.getFilesCount(body.nSesid)
                    res.data[0][0] = { ...res.data[0][0], maxNumber: obj.maxNumber, pageRes: obj.pageRes }
                }
            } catch (error) {
            }

            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }




    async getFilesCount(nSesid): Promise<any> {
        try {
            if (!nSesid) {
                return { pageRes: null, maxNumber: 0 };
            }
            const folderPath = `data/dt_${nSesid}`;
            const files = await fsPromises.readdir(folderPath);
            const maxNumber = files.reduce((max, file) => {
                const num = parseInt(file.replace(/\D+/g, ''), 10);
                return num > max ? num : max;
            }, 0);

            const filePath = path.join(folderPath, `page_${maxNumber}.json`);

            const pageRes = await this.processFile(filePath);

            console.log(`The maximum folder number is: ${maxNumber}`);
            return { maxNumber, pageRes };
        } catch (error) {
            console.error(`Error reading directory: ${error.message}`);
        }
        return { pageRes: null, maxNumber: 0 };
    }


    private async processFile(filePath: string): Promise<string> {
        const data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }



    async getSessionByCaseId(body: SessionByCaseIdReq): Promise<any> {
        let res = await this.db.executeRef('realtime_combo_sessionlist', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch realtime_combo_sessionlist', error: res.error }
        }
    }


    async getlivesessionbycaseid(body: SessionByCaseIdReq): Promise<any> {
        let res = await this.db.executeRef('realtime_livesession_bycaseid', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch realtime_combo_sessionlist', error: res.error }
        }
    }





    async getAssignedusers(body: sessionDertailReq): Promise<any> {
        let res = await this.db.executeRef('realtime_assignedusers', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async sessionBuilder(body: SessionBuilderReq): Promise<any> {
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {



            try {
                if (res.data[0][0]["dDate"]) {
                    this.sessionSchedular(res.data[0][0]);
                }

            } catch (error) {
            }
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async sessionDelete(body: SessionDeleteReq): Promise<any> {
        body.permission = 'D';
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {


            try {
                this.schedulerService.cancelJob(res.data[0][0].nSesid);
                this.schedulerService.cancelJob(`END_${res.data[0][0].nSesid}`);
                //     for (let x of res.data[0]) {
                //         this.setSchedular(x)
                //     }
            } catch (error) {
            }


            // try {
            //     for (let x of res.data[0]) {
            //         this.setSchedular(x)
            //     }
            // } catch (error) {
            // }
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async sessionEnd(body: SessionDeleteReq): Promise<any> {
        body.permission = 'C';
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {

            try {
                this.schedulerService.cancelJob(res.data[0][0].nSesid);
                this.schedulerService.cancelJob(`END_${res.data[0][0].nSesid}`);
                //     for (let x of res.data[0]) {
                //         this.setSchedular(x)
                //     }
            } catch (error) {
            }
            this.feedData.sessionEnd(body.nSesid);
            try {
                this.ios["server"].emit('on-notification', { msg: 1, nSesid: res.data[0][0]["nSesid"], cStatus: 'E' });
            } catch (error) {
            }

            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async setServer(body: setServerReq): Promise<any> {
        let res = await this.db.executeRef('realtime_setserver', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async setSchedular(mdl) {
        // Schedule a new task
        // const jobId = this.schedulerService.scheduleTask(mdl.nSesid, mdl.dStartDt, async () => {
        //     let res = await this.db.executeRef('realtime_onnewtask_start', { nSesid: mdl.nSesid, cUnicuserid: mdl.cUnicuserid });
        //     if (res.success) {

        //     } else {

        //     }
        // });
    }


    async getServers(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_serverslist', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async serverBuilder(body: ServerBuilderReq): Promise<any> {
        let res = await this.db.executeRef('realtime_insertupdate_servers', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async postCreateUsers(body: createUserInterfaceReq): Promise<any> {
        let res = await this.db.executeRef('insert_rtusers', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch insert_rtusers', error: res.error }
        }
    }



    async getTeamusers(body: userListReq): Promise<any> {
        let res = await this.db.executeRef('realtime_userlist', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }




    async getSearchUsers(body: SearchedUserListReq): Promise<any> {
        let res = await this.db.executeRef('realtime_users_search', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }





    async assignMent(body: assignMentReq): Promise<any> {
        let res = await this.db.executeRef('realtime_assignment', body);
        if (res.success) {
            console.log('ASSIGNED', res);
            // this.setNotifcation(res.data[0]);

            this.sessionSchedular(res.data[0][0]);

            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    sessionSchedular(mdl) {
        try {
            if (mdl.nSesid) {
                this.schedulerService.cancelJob(mdl.nSesid);
                this.schedulerService.cancelJob(`END_${mdl.nSesid}`);
                const jobId = this.schedulerService.scheduleTask(mdl.nSesid, mdl.dDate, async () => {
                    try {
                        console.log('Checking running session')
                        this.checkrunningSessions({ nSesid: mdl.nSesid });
                    } catch (error) {
                    }
                })
                const job2Id = this.schedulerService.scheduleTask(`END_${mdl.nSesid}`, mdl.dEnddt, async () => {
                    try {
                        console.log('Ending session')
                        this.sessionEnd({ nSesid: mdl.nSesid, permission: 'C' });

                        // this.ios["server"].emit('on-notification', { msg: 1, nSesid: res.data[0][0]["nSesid"], cStatus: 'E' });
                    } catch (error) {
                    }
                })

            }
        } catch (error) {

        }
    }


    async getTodaySessions(body: any): Promise<any> {
        console.log('\n\n\n\n getTodaySessions realtime_todays_sessions', body)
        let res = await this.db.executeRef('realtime_todays_sessions', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getTodayServers(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_connection_servers', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async insertConnectivityLog(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_insertupdate_rtconnectivitylogs', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }
    async deleteConnectivityLog(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_insertupdate_rtconnectivitylogs', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async checkrunningSessions(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_update_running_session', body);
        if (res.success) {

            try {
                this.ios["server"].emit('on-notification', { msg: 1, nSesid: res.data[0][0]["nSesid"] });

            } catch (error) {

            }
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getConnectivityLog(body: any): Promise<any> {
        let res = await this.db.executeRef('realtime_get_connectivityLogs', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async setNotifcation(data) {
        try {

            let res = await this.db.executeRef('realtime_notification_users', { nSesid: data[0].nSesid });

            if (res.data[0].length > 0) {
                for (let x of res.data[0]) {
                    x.isRealtime = true;
                    this.firebaseService.emit(x)
                }
            }
        } catch (error) {

        }
    }


    async getCaseList(body: CaseListReq): Promise<any> {
        // body.dDate = this.dateTimeService.getCurrentTime();
        let res = await this.db.executeRef('realtime_caselist', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getTranscriptfiles(body: TranscriptFileReq): Promise<any> {
        // body.dDate = this.dateTimeService.getCurrentTime();
        let res = await this.db.executeRef('realtime_transcriptfiles', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }




    async caseDetail(query: caseDetailSEC): Promise<any> {
        let res = await this.db.executeRef('upload_getcasedetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async sectionDetail(query: sectionDetailSEC): Promise<any> {
        let res = await this.db.executeRef('upload_getsectiondetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async bundleDetail(query: bundleDetailSEC): Promise<any> {
        let res = await this.db.executeRef('upload_getbundledetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async checkForDuplicate(body: bundleDetailSEC): Promise<any> {
        let res = await this.db.executeRef('upload_checkduplicacy', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async publishFile(body: publishSEC): Promise<any> {
        let res = await this.db.executeRef('upload_filestatus', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async emitMsg(value: any) {
        let User = await this.user.getUserSocket(value.data.nMasterid);
        if (User) {
            console.log('Sending message to user', User, value);
            this.ios["server"].to(User).emit("upload-messages", value);
        } else {
            console.log('Enable to send user not found', value)
            //error to send user not found
        }
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
        debugger;
        const path = `${this.config.get('REALTIME_PATH')}s_${mdl.nSesid}.json`;
        try {
            if (!fs.existsSync(path)) {
                return { msg: -1 }
            }
            const data = await this.readJsonFromFile(path);

            if (data.length) {

                const annotations = await this.issueService.getAnnotationOfPages({ nSessionid: mdl.nSesid, nUserid: mdl.nUserid, nCaseid: mdl.nCaseid, cTranscript: 'A' });
                // console.log('\n\n\n\n\n annotations', annotations, '\n\n\n\n\n\n');
                debugger;

                try {


                    const issuedetails = annotations[0] || [];
                    const hyperlinks = annotations[1] || [];

                    const finalIssueDetail = [];


                    try {

                        for (let x of issuedetails) {
                            if (x.cordinates && x.cordinates.length) {
                                const obj = { ...x };
                                const pages = [...new Set(x.cordinates.map(a => a.p) || [])];
                                for (let p of pages) {
                                    const cordinates = x.cordinates.filter(a => a.p == p);
                                    obj.pageIndex = p;
                                    obj.cordinates = cordinates;
                                    finalIssueDetail.push({ ...obj });
                                }
                            }
                        }
                    } catch (error) {

                    }




                    if (finalIssueDetail?.length || hyperlinks?.length) {
                        for (let x of data) {
                            x.hyperlinks = [];
                            x.annotations = [];
                            if (finalIssueDetail.length) {
                                x.annotations.push(...finalIssueDetail.filter(a => a.pageIndex == x.page));
                            }
                            if (hyperlinks.length) {
                                x.hyperlinks.push(...hyperlinks.filter(a => a.cPageno == x.page));
                            }
                        }
                    }
                } catch (error) {

                }

            }

            return { msg: 1, data }
        } catch (error) {
        }
        return { msg: -1 }
    }

    async updateTranscriptStatus(body: updateTransStatusMDL): Promise<any> {
        if (body.cFlag == 'P') {
            console.log('Starting transfer', body);
            try {
                const filePath = `${this.config.get('ASSETS')}doc/case${body.nCaseid}/s_${body.nSesid}.TXT`;
                if (!fs.existsSync(filePath)) {
                    return { msg: -1, value: 'File Not found', filePath: filePath }
                }

                const resolvedPath = path.resolve(this.config.get('ANNOT_TRANSFER_DIR'));
                if (!fs.existsSync(resolvedPath)) {
                    fs.mkdirSync(resolvedPath, { recursive: true });
                }


                const resolvedPath2 = path.resolve(this.config.get('REALTIME_PATH'));
                if (!fs.existsSync(resolvedPath2)) {
                    fs.mkdirSync(resolvedPath2, { recursive: true });
                }

                await this.annotTransfer.startTransfer(body.nSesid, filePath, body.cProtocol);

            } catch (error) {
                console.log('Error-', error);
                return { msg: -1, value: 'File Not found', error: error }
            }

        }
        let res = await this.db.executeRef('realtime_transcript_upload_status', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async getDocInfobyTab(query: DocInfoReq): Promise<DocInfoRes> {
        let res = await this.db.executeRef('realtime_docinfo_by_tab', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async syncSessionData(query: synsSessionsMDL): Promise<any> {
        let res = await this.db.executeRef('realtime_sync_sessions', query);
        if (res.success) {
            try {
                const listOfSessions = res.data[0][0]["jUpdatedSessions"] || [];
                if (listOfSessions && listOfSessions.length) {
                    for (let x of listOfSessions) {
                        if (x.cRStatus == 'C') {
                            console.log('SESSION COMPLETE ')
                            this.feedData.sessionEnd(x.nSesid);
                            try {
                                this.schedulerService.cancelJob(x.nSesid);
                                this.schedulerService.cancelJob(`END_${x.nSesid}`);
                            } catch (error) {
                            }
                            try {
                                this.ios["server"].emit('on-notification', { msg: 1, nSesid: x.nSesid, cStatus: 'E' });
                            } catch (error) {
                            }

                        } else {

                            this.sessionSchedular(x);
                        }
                    }
                }
            } catch (error) {
            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getallusers(query: any): Promise<any> {
        let res = await this.db.executeRef('realtime_sync_allusers', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async syncFeedData(body: any): Promise<any> {
        // console.log('Data Rec', body)

        try {
            if (body.nSesid) {
                const folderPath = `data/dt_${body.nSesid}`;
                await fss.mkdir(folderPath, { recursive: true });
                const data = body.jData || [];
                for (const [fileName, fileData] of data) {
                    if (fileName.endsWith('.json')) {
                        const filePath = path.join(folderPath, fileName);
                        const fileContent = JSON.stringify(fileData, null, 2); // Pretty print JSON with 2-space indentation
                        await fss.writeFile(filePath, fileContent, 'utf-8');
                    }
                }

                console.log('Files written successfully');
            }
        } catch (error) {
            console.log('Error', error);
        }

        return { msg: 1, value: 'Success' }
    }


    async joiningLog(body: logJoinReq): Promise<any> {
        let res = await this.db.executeRef('realtime_insertlog', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch insert_rtusers', error: res.error }
        }
    }



    async getRtsessions(body: RTLogsReq): Promise<any> {
        let res = await this.db.executeRef('realtime_sessions_bycaseid', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error }
        }
    }


    async getRTSessionUsers(body: RTLogsSessionUserReq): Promise<any> {
        let res = await this.db.executeRef('realtime_sessions_users_bycaseid', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error }
        }
    }

    async getRTlogs(body: RTLogsUserLGReq): Promise<any> {
        let res = await this.db.executeRef('realtime_logs_list', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error }
        }
    }



    async exportLogExcel(body: RTLogsReq): Promise<any> {
        let res = await this.db.executeRef('realtime_export_logs', body);
        if (res.success) {
            const ExportData = res.data[0] || [];
            if (ExportData?.length) {

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Data');
                let Columns = [];
                Object.keys(ExportData[0]).forEach((key, index) => {
                    Columns.push({ header: key, key: key, width: key == 'File name' ? 40 : 20 })
                })
                worksheet.columns = Columns;
                worksheet.addRows(ExportData);
                // const buffer = await workbook.xlsx.writeBuffer();
                // Define the file path
                const filePath = path.resolve(this.tempFilePath, `case${body.nCaseid}/logs-report.xlsx`);
                // Ensure the directory exists
                const exportFilePath = `export-excel/case${body.nCaseid}/logs-report.xlsx`;
                if (!fs.existsSync(path.dirname(filePath))) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                // Write the file to the directory
                await workbook.xlsx.writeFile(filePath);
                return { msg: 1, value: 'Exported', path: exportFilePath };
            }
            return { msg: -1, value: 'Log not found for export' };
        } else {
            return { msg: -1, value: 'Failed to export ', error: res.error }
        }
    }




    async getFiledata(body: filedataReq): Promise<filedataRes> {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getDocinfo(query: DocinfoReq): Promise<any> {
        let res = await this.db.executeRef('individual_doc_info', query);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }


    async getActiveSession(query: ActiveSessionReq): Promise<any> {
        let res = await this.db.executeRef('realtime_get_active_session', query, this.realtimeSchema);
        if (res.success) {
            try {
                return res.data[0][0];
            } catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error }
            }
        } else {
            return { msg: -1, value: 'Failed ', error: res.error }
        }
    }

    async getActiveSessionDetail(query: ActiveSessionDetailReq): Promise<any> {
        const res = await this.db.executeRef('realtime_sessiondata', query, this.realtimeSchema);
        if (res.success) {
            try {
                if (res.data[0].length) {
                    const obj = await this.getFilesCount(res.data[0][0].nSesid)
                    res.data[0][0] = { ...res.data[0][0], maxNumber: obj.maxNumber, pageRes: obj.pageRes }
                }
            } catch (error) {
            }

            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }

    }

}
