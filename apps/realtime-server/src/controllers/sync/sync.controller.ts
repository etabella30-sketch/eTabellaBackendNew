import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SyncService } from '../../services/sync/sync.service';
import { pushDeleteData, pushHighlightData, pushIssueData, pushIssueDetailData, pushLogData, sessionDetailSql, sessionsUsers } from '../../interfaces/sync.interface';
@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {

  }

  @Post('pushissue')
  async pushIssue(@Body() body: pushIssueData): Promise<any> {
      return await this.syncService.updateIssues(body);
  }

  @Post('pushdetail')
  async pushdetail(@Body() body: pushIssueDetailData): Promise<any> {
      return await this.syncService.updateIssuesDetail(body);
  }

  @Post('pushhighlights')
  async pushhighlights(@Body() body: pushHighlightData): Promise<any> {
      return await this.syncService.updateHighlights(body);
  }


  @Post('pushdelete')
  async pushdelete(@Body() body: pushDeleteData): Promise<any> {
      return await this.syncService.DeleteData(body);
  }


  @Post('pushrtlogs')
  async pushrtlogs(@Body() body: pushLogData): Promise<any> {
      return await this.syncService.PushLogData(body);
  }
  

  @Post('sessionusers')
  async sessionusers(@Body() body: sessionsUsers): Promise<any> {
      return await this.syncService.sessionusers(body);
  }

  

  @Post('codemastersdata')
  async codemastersdata(@Body() body: any): Promise<any> {
      return await this.syncService.codemastersdata(body);
  }


  

  @Post('pushsessiondetail')
  async sessionDetail(@Body() body: sessionDetailSql): Promise<any> {
      return await this.syncService.sessionDetail(body);
  }


}
