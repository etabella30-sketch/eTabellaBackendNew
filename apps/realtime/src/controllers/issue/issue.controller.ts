import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  DeleteIssueCategoryParam, DeleteIssueDetailParam, HighlightListParam, InsertHighlightsRequestBody,
  InsertIssueDetailRequestBody, IssueCategoryRequestBody, IssueListParam, IssueRequestBody, UpdateIssueDetailRequestBody, annotationsReq, catListParam, defaultSetupReq, deleteHighlightsParam,
  deleteHighlightsRequestBody, deleteIssueRequestBody, dynamicComboReq, getAnnotHighlightEEP, getIssueAnnotationListBody, getLastIssueMDL, isseDetailByIdBody,
  issuedetaillist_by_issueidBody, removeMultipleHighlightsReq, updateDetailIssueNote, updateHighlightIssueIdsReq
} from '../../interfaces/issue.interface';
import { IssueService } from '../../services/issue/issue.service';
import { ApiTags } from '@nestjs/swagger';
import { ExportService } from '../../services/export/export.service';
import { TranscriptpublishService } from '../../services/transcript/transcript_publish.service';
import { Request } from 'express';


@ApiTags('Issue')
@Controller('issue')
export class IssueController {
  constructor(private readonly issu: IssueService, private exportService: ExportService,
    private transcriptP: TranscriptpublishService
  ) {
  }



  @Post('insertCategory')
  async insertIssueCategory(@Body() body: IssueCategoryRequestBody): Promise<any> {
    return this.issu.handleIssueCategory(body, 'I');
  }

  @Put('updateCategory')
  async updateIssueCategory(@Body() body: IssueCategoryRequestBody): Promise<any> {
    return this.issu.handleIssueCategory(body, 'U');
  }

  @Delete('deleteCategory')
  async deleteIssueCategory(@Body() body: DeleteIssueCategoryParam): Promise<any> {
    console.log('deleteCategory')
    return this.issu.deleteIssueCategory(body);
  }

  @Get('getIssueCategorylist')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getList(@Query() query: catListParam): Promise<any> {
    return await this.issu.getIssueCategory(query);
  }







  @Post('insertIssue')
  async insertIssue(@Body() body: IssueRequestBody): Promise<any> {
    return this.issu.handleIssue(body, 'I');
  }

  @Put('updateIssue')
  async updateIssue(@Body() body: IssueRequestBody): Promise<any> {
    return this.issu.handleIssue(body, 'U');
  }

  @Delete('deleteIssue')
  async deleteIssue(@Body() body: deleteIssueRequestBody): Promise<any> {
    return this.issu.deleteIssue(body);
  }

  @Get('issuelist')
  async getIssueList(@Query() query: IssueListParam): Promise<any> {
    return this.issu.getIssueList(query);
  }





  @Post('insertIssueDetail')
  async insertIssueDetail(@Body() body: InsertIssueDetailRequestBody): Promise<any> {
    // console.log('insertIssueDetail', body)
    // return this.issu.insertIssueDetail(body);
    return this.issu.executeIssueDetailOperation(body, 'I');
  }
  @Put('updateIssueDetail')
  async updateIssueDetail(@Body() body: UpdateIssueDetailRequestBody): Promise<any> {
    //fdfdg
    // return this.issu.updateIssueDetail(body);
    return this.issu.executeIssueDetailOperation(body, 'U');
  }

  @Delete('deleteIssueDetail')
  async deleteIssueDetail(@Body() body: DeleteIssueDetailParam): Promise<any> {
    // return this.issu.deleteIssueDetail(body);
    return this.issu.executeIssueDetailOperation(body, 'D');
  }

  @Get('getIssueDetailByIssueId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueDetailbyIsuseid(@Query() query: issuedetaillist_by_issueidBody): Promise<any> {
    return this.issu.getIssueDetailby_issue_id(query);
  }

  @Get('getIssueDetailById')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueDetailById(@Query() query: isseDetailByIdBody): Promise<any> {
    return this.issu.getIssueDetailById(query);
  }





  @Post('insertHighlights')
  async insertHighlights(@Body() body: InsertHighlightsRequestBody): Promise<any> {

    return this.issu.insertHighlights(body, 'I');
  }

  @Post('removemultihighlights')
  async removemultihighlights(@Body() body: removeMultipleHighlightsReq): Promise<any> {

    return this.issu.removemultihighlights(body);
  }

  @Post('updateHighlightIssueIds')
  async updateHighlightIssueIds(@Body() body: updateHighlightIssueIdsReq): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.updateHighlightIssueIds(body);
  }


  @Delete('deleteHighlights')
  async deleteHighlights(@Body() body: deleteHighlightsParam): Promise<any> {
    console.log('deleteHighlights', body)
    // return this.issu.deleteHighlights(body);
    return this.issu.deleteHighlights(body, 'D');
  }


  @Get('GetHighlightList')
  @UsePipes(new ValidationPipe({ transform: true }))
  async GetHighlightList(@Query() query: HighlightListParam): Promise<any> {
    return this.issu.GetHighlightLists(query);
  }



  @Get('getLastIssue')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getArrengedIssue(@Query() query: getLastIssueMDL): Promise<any> {
    return this.issu.FilterLastSelecedIssued(query);
  }













  @Get('getIssueAnnotationList')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueAnnotationList(@Query() query: getIssueAnnotationListBody): Promise<any> {
    return this.issu.getIssueAnnotationList(query);
  }

  @Post('annothighlightexport')
  // async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP): Promise<any> {
  //   return this.transcriptP.getAnnotHighlightExport(body);
  // }
  async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP, @Req() req: Request): Promise<any> {

    const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
    const isLocal = host?.includes('localhost') || host?.startsWith('192.');
    const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
    return this.transcriptP.getAnnotHighlightExport(body, origin);
  }





  @Get('dynamiccombo')
  @UsePipes(new ValidationPipe({ transform: true }))
  async dynamiccombo(@Query() query: dynamicComboReq): Promise<any> {
    return await this.issu.getcCodeMaster(query);
  }

  @Post('deletedemoissuedetail')
  async deletedemoissuedetail(@Body() body: any): Promise<any> {
    console.log('deleteCategory')
    return this.issu.deleteDemoIssueDetails(body);
  }

  @Post('getannotationofpages')
  async getAnnotationOfPages(@Body() body: getIssueAnnotationListBody): Promise<any> {
    return this.issu.etRealtimeGetIssueAnnotationHighlight(body);
  }



  @Post('setdefault')
  async serverBuilder(@Body() body: defaultSetupReq): Promise<any> {
    try {

      return await this.issu.updateIssueDetail(body);;
      // const res = await this.issu.updateSessionDetail(body.nSesid, body.nUserid, body.cFlag, JSON.parse(body.jDefault), body.nLID);
      // return res;
    } catch (error) {
      return { msg: -1, error: error.message };
    }

  }



  @Post('update/issuedetail/note')
  async updateIssueNote(@Body() body: updateDetailIssueNote): Promise<any> {
    try {
      return await this.issu.updateIssueDetailNote(body);;
    } catch (error) {
      return { msg: -1, error: error.message };
    }

  }



  @Get('versions')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueVersions(@Query() query: isseDetailByIdBody): Promise<any> {
    return this.issu.getIssueVersions(query);
  }



  @Get('issuedetail/annotations')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueAnnots(@Query() query: annotationsReq): Promise<any> {
    return this.issu.getIssueDetail(query);
  }




}
