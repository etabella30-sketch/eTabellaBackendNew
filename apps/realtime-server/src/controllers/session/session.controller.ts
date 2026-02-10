import { Body, Controller, Get, Param, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionService } from '../../services/session/session.service';
import { ActiveSessionDetailReq, ActiveSessionReq, CaseListReq, DocInfoReq, DocInfoRes, DocinfoReq, RTLogsReq, RTLogsSessionUserReq, RTLogsUserLGReq, SearchedUserListReq, ServerBuilderReq, SessionBuilderReq, SessionByCaseIdReq, SessionDataReq, SessionDataV2Req, SessionDeleteReq, SessionEndReq, SessionListReq, TranscriptFileReq, assignMentReq, bundleDetailSEC, caseDetailSEC, checkDuplicacySEC, checkRunningSessionReq, conectivityLog, createUserInterfaceReq, deleteConectivityLog, filedataReq, filedataRes, getConnectivityLogReq, logJoinReq, publishSEC, sectionDetailSEC, sessionDertailReq, setServerReq, synsSessionsMDL, updateTransStatusMDL, userListReq, userSesionData } from '../../interfaces/session.interface';
import { Ctx, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
import { query, Response } from 'express';
import { FileproviderService } from '../../services/fileprovider/fileprovider.service';
@ApiTags('session')
@Controller('session')
export class SessionController {

    constructor(private readonly sessionService: SessionService, private readonly fileProviderService: FileproviderService) {
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
    async getSessionByCaseId(@Query() query: SessionByCaseIdReq): Promise<any> {
        return await this.sessionService.getSessionByCaseId(query);
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

    @Post('sessionend')
    async sessionend(@Body() body: SessionEndReq): Promise<any> {
        return await this.sessionService.sessionEnd(body);
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
    async getTranscriptfiles(@Query() query: TranscriptFileReq): Promise<any> {
        return await this.sessionService.getTranscriptfiles(query);
    }

    @Get('casedetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseDetail(@Query() query: caseDetailSEC): Promise<any> {
        return await this.sessionService.caseDetail(query);
    }

    @Get('sectiondetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getSectionDetail(@Query() query: sectionDetailSEC): Promise<any> {
        return await this.sessionService.sectionDetail(query);
    }

    @Get('bundle')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getBundleList(@Query() query: bundleDetailSEC): Promise<any> {
        return await this.sessionService.bundleDetail(query);
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
    async getRealtimeSessionData(@Query() query: userSesionData): Promise<any> {
        return await this.sessionService.getRealtimeSessionData(query);
    }


    @Post('updatetranscriptstatus')
    async updateTranscriptStatus(@Body() body: updateTransStatusMDL): Promise<any> {
        return await this.sessionService.updateTranscriptStatus(body);
    }

    @Get('docinfobytab')
    async getDocInfobyTab(@Query() query: DocInfoReq): Promise<DocInfoRes> {
        return await this.sessionService.getDocInfobyTab(query);
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
    async joiningLog(@Body() body: logJoinReq): Promise<any> {
        return await this.sessionService.joiningLog(body);
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
    async getFiledata(@Query() query: filedataReq): Promise<any> {
        return await this.sessionService.getFiledata(query);
    }


    @Get('getDocinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocinfo(@Query() query: DocinfoReq): Promise<any> {
        return await this.sessionService.getDocinfo(query);
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
