import { Body, Controller, ForbiddenException, Get, Header, Param, Post, Query, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionService } from '../../services/session/session.service';
import { EclipseSessionService } from '../../services/eclipse-session/eclipse-session.service';
import { ActiveSessionDetailReq, ActiveSessionReq, CaseListReq, DocInfoReq, DocInfoRes, DocinfoReq, EclipseCredentialReq, EclipseSessionCreateReq, RTLogsReq, RTLogsSessionUserReq, RTLogsUserLGReq, SearchedUserListReq, ServerBuilderReq, SessionBuilderReq, SessionByCaseIdReq, SessionsByCaseIdsReq, SessionDataReq, SessionDataV2Req, SessionDeleteReq, SessionEndReq, SessionListReq, SessionStartReq, TranscriptFileReq, assignMentReq, bundleDetailSEC, caseDetailSEC, checkDuplicacySEC, checkRunningSessionReq, conectivityLog, createUserInterfaceReq, deleteConectivityLog, filedataReq, filedataRes, getConnectivityLogReq, logJoinReq, publishSEC, sectionDetailSEC, sessionDertailReq, setServerReq, synsSessionsMDL, updateTransStatusMDL, userListReq, userSesionData } from '../../interfaces/session.interface';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { query, Request, Response } from 'express';
import { FileproviderService } from '../../services/fileprovider/fileprovider.service';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';
@ApiTags('session')
@Controller('session')
export class SessionController {

    constructor(private readonly sessionService: SessionService, private readonly fileProviderService: FileproviderService,
        private readonly eclipseSessionService: EclipseSessionService) {
    }




    @MessagePattern('REALTIME-FILE-UPLOAD')
    handeAuth2(@Payload() message: any, @Ctx() context: KafkaContext) {
        console.log(`Received message for REALTIME-FILE-UPLOAD: `, message);
        // handle notification
        this.sessionService.emitMsg(message);
    }

    @Get('list')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getList(@Query() query: SessionListReq): Promise<any> {
        return await this.sessionService.getSessions(query);
    }

    @Get('sessiondata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSessiondata(@Query() query: SessionDataReq): Promise<any> {
        return await this.sessionService.getSessiondata(query);
    }

    @Get('SessionDataV2')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSessionV2(@Query() query: SessionDataV2Req): Promise<any> {
        return await this.sessionService.getSessiondataV2(query);
    }

    @Get('getSessionsByCaseId')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSessionByCaseId(@Query() query: SessionByCaseIdReq, @Req() req: Request): Promise<any> {
        // nCaseid required; the caller must be on that case or assigned to one of its sessions.
        return await this.sessionService.getSessionByCaseIdAsCaller(query, (req as RealtimeRequest).user);
    }

    /** The session lists of many cases in one request (RT Production lane); same audience rule per case. */
    @Post('getSessionsByCaseIds')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSessionsByCaseIds(@Body() body: SessionsByCaseIdsReq, @Req() req: Request): Promise<any> {
        return await this.sessionService.getSessionsByCaseIdsAsCaller(body, (req as RealtimeRequest).user);
    }

    @Get('getlivesessionbycaseid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getlivesessionbycaseid(@Query() query: SessionByCaseIdReq): Promise<any> {
        return await this.sessionService.getlivesessionbycaseid(query);
    }

    @Get('getassigned')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAssigned(@Query() query: sessionDertailReq): Promise<any> {
        return await this.sessionService.getAssignedusers(query);
    }

    @Post('sessionbuilder')
    async sessionBuilder(@Body() body: SessionBuilderReq): Promise<any> {
        console.log("sessionbuilder", body);
        return await this.sessionService.sessionBuilder(body);
    }

    @Post('sessiondelete')
    async sessiondelete(@Body() body: SessionDeleteReq): Promise<any> {
        return await this.sessionService.sessionDelete(body);
    }

    /** Create a live Bridge session and register its Eclipse routing credentials. */
    @Post('eclipse')
    async createEclipseSession(@Body() body: EclipseSessionCreateReq): Promise<any> {
        return await this.eclipseSessionService.createEclipseSession(body);
    }

    /** Super admin only (RealtimeAdminMiddleware via SESSION_ADMIN_ROUTES, re-checked here):
     *  the Eclipse username + password of a session that still has a live route. */
    @Get('eclipse/credential')
    @Header('Cache-Control', 'no-store')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getEclipseCredential(@Query() query: EclipseCredentialReq, @Req() req: Request): Promise<any> {
        const user = (req as RealtimeRequest).user;
        if (!user?.isAdmin) throw new ForbiddenException('Admin rights required');
        return await this.eclipseSessionService.revealEclipseCredential(query.nSesid, user.userId);
    }

    @Post('sessionend')
    async sessionend(@Body() body: SessionEndReq): Promise<any> {
        return await this.sessionService.sessionEnd(body);
    }

    // Notification-only endpoint. Local script POSTs here after creating a
    // session in its own SQLite (the live DB doesn't get the row — local
    // owns the session record). The service emits an `on-notification`
    // {cStatus:'R'} so live clients viewing this case can flip their
    // sidenav RT badge to "Live" without a page refresh.
    @Post('sessionstart')
    async sessionstart(@Body() body: SessionStartReq): Promise<any> {
        return await this.sessionService.sessionStart(body);
    }

    @Post('setserver')
    async setServer(@Body() body: setServerReq): Promise<any> {
        return await this.sessionService.setServer(body);
    }

    @Get('todaysessions')
    async toSessions(@Query() query: any): Promise<any> {
        return await this.sessionService.getTodaySessions(query);
    }

    @Get('todayservers')
    async toServers(@Query() query: any): Promise<any> {
        return await this.sessionService.getTodayServers(query);
    }

    @Get('servers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getServers(@Query() query: any): Promise<any> {
        return await this.sessionService.getServers(query);
    }

    @Post('serverbuilder')
    async serverBuilder(@Body() body: ServerBuilderReq): Promise<any> {
        return await this.sessionService.serverBuilder(body);
    }

    @Post('CreateUser')
    async CreateUser(@Body() body: createUserInterfaceReq): Promise<any> {
        return await this.sessionService.postCreateUsers(body);
    }

    @Get('teamsusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTeamusers(@Query() query: userListReq): Promise<any> {
        return await this.sessionService.getTeamusers(query);
    }

    @Get('searchusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSearchUsers(@Query() query: SearchedUserListReq): Promise<any> {
        return await this.sessionService.getSearchUsers(query);
    }


    @Post('assign')
    async assignMent(@Body() body: assignMentReq): Promise<any> {
        return await this.sessionService.assignMent(body);
    }

    @Post('insertConnetivityLog')
    async insertConnectivityLog(@Body() body: conectivityLog): Promise<any> {
        return await this.sessionService.insertConnectivityLog(body);
    }

    @Get('getConnectivityLog')
    async getConnectivityLog(@Query() query: getConnectivityLogReq): Promise<any> {
        return await this.sessionService.getConnectivityLog(query);
    }

    @Post('checkforrunningsession')
    async checrunningsession(@Body() body: checkRunningSessionReq): Promise<any> {
        return await this.sessionService.checkrunningSessions(body);
    }

    @Post('deleteConnetivityLog')
    async deleteConnectivityLog(@Body() body: deleteConectivityLog): Promise<any> {
        return await this.sessionService.insertConnectivityLog(body);
    }


    @Get('caselist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseList(@Query() query: CaseListReq): Promise<any> {
        return await this.sessionService.getCaseList(query);
    }


    @Get('transcriptfiles')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTranscriptfiles(@Query() query: TranscriptFileReq, @Req() req: Request): Promise<any> {
        // Lists nCaseid's transcript-section files: global admin or a member of the case.
        return await this.sessionService.getTranscriptfilesAsCaller(query, (req as RealtimeRequest).user);
    }

    @Get('casedetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseDetail(@Query() query: caseDetailSEC, @Req() req: Request): Promise<any> {
        // Case-scoped reads here and below: global admin or a member of the case.
        return await this.sessionService.caseDetailAsCaller(query, (req as RealtimeRequest).user);
    }

    @Get('sectiondetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSectionDetail(@Query() query: sectionDetailSEC, @Req() req: Request): Promise<any> {
        return await this.sessionService.sectionDetailAsCaller(query, (req as RealtimeRequest).user);
    }

    @Get('bundle')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleList(@Query() query: bundleDetailSEC, @Req() req: Request): Promise<any> {
        return await this.sessionService.bundleDetailAsCaller(query, (req as RealtimeRequest).user);
    }

    @Post('checkduplicacy')
    async teamdelete(@Body() body: checkDuplicacySEC): Promise<any> {
        return await this.sessionService.checkForDuplicate(body);
    }

    @Post('publishfile')
    async publishFile(@Body() body: publishSEC): Promise<any> {
        return await this.sessionService.publishFile(body);
    }

    @Get('realtimedatabysesid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getRealtimeSessionData(@Query() query: userSesionData, @Req() req: Request): Promise<any> {
        // The whole transcript of nSesid: only for a session the token user can see.
        return await this.sessionService.getRealtimeSessionDataAsCaller(query, (req as RealtimeRequest).user);
    }


    @Post('updatetranscriptstatus')
    async updateTranscriptStatus(@Body() body: updateTransStatusMDL): Promise<any> {
        return await this.sessionService.updateTranscriptStatus(body);
    }

    @Get('docinfobytab')
    async getDocInfobyTab(@Query() query: DocInfoReq, @Req() req: Request): Promise<DocInfoRes> {
        // Same by-tab file lookup as filedata: global admin or a member of nCaseid.
        return await this.sessionService.getDocInfobyTabAsCaller(query, (req as RealtimeRequest).user);
    }


    @Post('synssessions')
    async syncSessions(@Body() body: synsSessionsMDL): Promise<any> {
        return await this.sessionService.syncSessionData(body);
    }

    @Post('syncfeeddata')
    async syncfeeddata(@Body() body: any): Promise<any> {
        return await this.sessionService.syncFeedData(body);
    }

    @Post('getallusers')
    async getallusers(@Body() body: any): Promise<any> {
        return await this.sessionService.getallusers(body);
    }

    @Get('synctranscriptfile')
    getFile(@Query('query') query: any, @Res() res: Response): void {
        console.log('DownloadFileToLocal Reqested', query);
        this.fileProviderService.provideFile(query, res);
    }

    @Post('log/join')
    async joiningLog(@Body() body: logJoinReq, @Req() req: Request): Promise<any> {
        // Only for a session the token user can see (same rule as the socket session rooms).
        return await this.sessionService.joiningLogAsCaller(body, (req as RealtimeRequest).user);
    }

    @Get('rt/logs/session')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getRTSessions(@Query() query: RTLogsReq): Promise<any> {
        return await this.sessionService.getRtsessions(query);
    }

    @Get('rt/logs/session/users')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSessionUsers(@Query() query: RTLogsSessionUserReq): Promise<any> {
        return await this.sessionService.getRTSessionUsers(query);
    }

    @Get('rt/logs')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getRtLogs(@Query() query: RTLogsUserLGReq): Promise<any> {
        return await this.sessionService.getRTlogs(query);
    }

    @Post('rt/logs/export')
    async export(@Body() body: RTLogsReq): Promise<any> {
        return await this.sessionService.exportLogExcel(body);
    }

    @Get('filedata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFiledata(@Query() query: filedataReq, @Req() req: Request): Promise<any> {
        return await this.sessionService.getFiledataAsCaller(query, (req as RealtimeRequest).user);
    }


    @Get('getDocinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocinfo(@Query() query: DocinfoReq, @Req() req: Request): Promise<any> {
        return await this.sessionService.getDocinfoAsCaller(query, (req as RealtimeRequest).user);
    }


    @Get('activesession')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getActiveSession(@Query() query: ActiveSessionReq): Promise<any> {
        return await this.sessionService.getActiveSession(query);
    }


    @Get('activesession/detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getActiveSessionDetail(@Query() query: ActiveSessionDetailReq): Promise<any> {
        return await this.sessionService.getActiveSessionDetail(query);
    }

}
