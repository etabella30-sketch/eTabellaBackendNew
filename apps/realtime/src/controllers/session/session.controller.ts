import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { SessionbuilderService } from '../../services/sessionbuilder/sessionbuilder.service';
import { assignMentReq, DocinfoReq, filedataReq, login, logSessionReq, ServerBuilderReq, SessionBuilderReq, SessionByCaseIdReq, SessionDataV2Req, sessionDelete, sessionEnd, userSesionData } from '../../interfaces/session.interface';
import { ApiTags } from '@nestjs/swagger';
import * as moment from 'moment-timezone';
import { DownloadfileService } from '../../services/downloadfile/downloadfile.service';
import { SessionService } from '../../session/session.service';
import { SyncService } from '../../services/sync/sync.service';
import { EmailService } from '../../services/email/email/email.service';
import { EmailparseReq } from '../../interfaces/common';
import { SocketService } from '../../socket/socket.service';

// @ApiBearerAuth('JWT')
@ApiTags('session')
@Controller('')
export class SessionController {

  constructor(private sb: SessionbuilderService, private dwn: DownloadfileService, 
    private session: SessionService, private syncService: SyncService, private emailService: EmailService,private socketService:SocketService) { }

  @Get('timezone')
  async gettimezone(): Promise<any> {
    const timezone = moment.tz.guess();
    return { msg: 1, timezone };
  }


 /* @Get('log/sessionid')
  async logSession(@Query() query: any): Promise<any> {
    return await this.sb.getLogSession(query);

  }*/


  @Get('getlivesessionbycaseid')
  async getlivesessionbycaseid(@Query() query: SessionByCaseIdReq): Promise<any> {
    return await this.sb.getlivesessionbycaseid(query);
  }

  // @Post('auth/signinrt')
  // async login(@Body() body: login): Promise<any> {
  //   const res = await this.sb.login(body);
  //   return res;
  // }

  @Post('session/sessionbuilder')
  async sessionBuilder(@Body() body: SessionBuilderReq): Promise<any> {
    const res = await this.sb.sessionCreation(body);
    return res;
  }


  @Post('session/sessionend')
  async endSession(@Body() body: sessionEnd): Promise<any> {
    const res = await this.sb.sessionEnd(body);
    return res;
  }



  @Get('session/sessiondatav2')
  async sessionDataV2(@Query() body: SessionDataV2Req): Promise<any> {
    const res = await this.sb.getSessionById(body);
    return res;
  }

  @Post('session/serverbuilder')
  async serverBuilder(@Body() body: ServerBuilderReq): Promise<any> {
    const res = await this.sb.serverBuilder(body);
    return res;
  }

  @Get('session/list')
  async sessionList(@Query() body: any): Promise<any> {
    const res = await this.sb.sessionList(body);
    return res;
  }


  @Get('session/servers')
  async sessionServers(@Query() body: any): Promise<any> {
    const res = await this.sb.sessionServers(body);
    return res;
  }



  @Get('session/servers/connected')
  async getActiveSession(@Query() body: any): Promise<any> {
    const res = await this.socketService.getConnectedServers();
    return res;
  }




  @Post('session/assign')
  async sessionAssign(@Body() body: assignMentReq): Promise<any> {
    const res = await this.sb.sessionAssign(body);
    return res;
  }




  @Post('session/sessiondelete')
  async deleteSession(@Body() body: sessionDelete): Promise<any> {
    const res = await this.sb.deleteSession(body);
    return res;
  }




  // @Post('syncsessiondata')
  // async syncsessiondata(@Body() body: any): Promise<any> {
  //   const res = await this.sb.syncSessionData();
  //   return res;
  // }


  // @Post('syncfeeddata')
  // async syncfeeddata(@Body() body: any): Promise<any> {
  //   const res = await this.sb.syncFeedData();
  //   return res;
  // }

  @Post('syncuserdata')
  async syncUserData(@Body() body: any): Promise<any> {
    const res = await this.sb.syncUserData();
    return res;
  }

  @Get('session/getSessionsByCaseId')
  async getSessionByCaseId(@Query() query: SessionByCaseIdReq): Promise<any> {
    return await this.sb.getSessionByCaseId(query);
  }

  @Post('session/transcriptsync')
  async sysncTranscript(@Body() body: any): Promise<any> {
    // return await this.dwn.DownloadFileToLocal(body);
    try {
      const result = await this.dwn.DownloadFileToLocal(body);
      console.log('Download result', result);
      await this.sb.updateTrascriptStatus(body, result.msg);
      return { message: result };
    } catch (error) {
      return { error: error.message };
    }
  }

  @Get('session/realtimedatabysesid')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getRealtimeSessionData(@Query() query: userSesionData): Promise<any> {
    return await this.session.getRealtimeSessionData(query);
  }

  // @Post('session/refetchusers')
  // async refetchUsers(@Body() body: any): Promise<any> {
  //   return await this.sb.reFetchSessionDetail(body);
  // }


  @Get('session/filedata')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getFiledata(@Query() query: filedataReq): Promise<any> {
    return await this.session.getFiledata(query);
  }


  @Get('session/getDocinfo')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getDocinfo(@Query() query: DocinfoReq): Promise<any> {
    return await this.session.getDocinfo(query);
  }


  @Get('session/getemailparse')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getemailparse(@Query() query: EmailparseReq): Promise<any> {
    return await this.emailService.getemailparse(query);
  }

  @Get('session/getrefreshtype')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getrefreshtype(@Query() query: any): Promise<any> {
    return await this.sb.getRefReshType();
  }

  @Post('session/setrefreshtype')
  async setRefreshtype(@Body() body: any): Promise<any> {
    return this.sb.setRefreshtype(body);
  }

  @Post('session/settimezone')
  async settimezone(@Body() body: any): Promise<any> {
    return this.sb.settimezone(body);
  }

}