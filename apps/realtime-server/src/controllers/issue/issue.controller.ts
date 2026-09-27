import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { CheckNavigatedata, DeleteIssueCategoryParam, DeleteIssueDetailParam, GetAllFactList, GetIssueDetailsGroupedParam, GetIssueDetailsParam, GetQfactList, GetQmarkList, HighlightListParam, InsertHighlightsRequestBody, InsertIssueDetailRequestBody, IssueCategoryRequestBody, IssueListParam, IssueRequestBody, UpdateIssueDetailRequestBody, annotationsReq, catListParam, defaultSetupReq, deleteHighlightsParam, deleteHighlightsRequestBody, deleteIssueRequestBody, dynamicComboReq, getAnnotHighlightEEP, getIssueAnnotationListBody, getLastIssueMDL, isseDetailByIdBody, issuedetaillist_by_issueidBody, removeMultipleHighlightsReq, updateDetailIssueNote, updateHighlightIssueIdsReq, issueSequenceParam, IssueByidParam, claimSequenceParam, qfactSequenceParam, qfactClaimSequenceParam, UpdateClaimRequestBody, deleteClaimRequestBody } from '../../interfaces/issue.interface';
import { IssueService } from '../../services/issue/issue.service';
import { ApiTags } from '@nestjs/swagger';
import { RealtimeRequest } from '../../middleware/realtime-auth.middleware';

/**
 * The acting user for the SPs that check ownership: the JWT user RealtimeAuthMiddleware put on the
 * request. Undefined (middleware not wired) makes IssueService refuse with msg -1.
 */
function callerOf(req: RealtimeRequest): string | undefined {
  return req?.user?.userId || undefined;
}


@ApiTags('Issue')
@Controller('issue')
export class IssueController {
  constructor(private readonly issu: IssueService) {
  }


  @Get('getIssueCategorylist')
  async getList(@Query() query: catListParam): Promise<any> {
    return await this.issu.getIssueCategory(query);
  }

  @Get('getissuedetails')
  async getIssueDetails(@Query() query: GetIssueDetailsParam): Promise<any> {
    return this.issu.getIssueDetails(query);
  }



  @Post('getIssueAnnot')
  async getIssueDetailsAnnot(@Body() body: GetIssueDetailsGroupedParam): Promise<any> {
    return this.issu.getIssueDetailsAnnot(body);
  }

  @Post('insertIssue')
  async insertIssue(@Body() body: IssueRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.handleIssue(body, 'I', callerOf(req));
  }

  @Put('updateIssue')
  async updateIssue(@Body() body: IssueRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.handleIssue(body, 'U', callerOf(req));
  }

  @Delete('deleteIssue')
  async deleteIssue(@Body() body: deleteIssueRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.deleteIssue(body, callerOf(req));
  }

  @Get('issuelist')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueList(@Query() query: IssueListParam): Promise<any> {
    return this.issu.getIssueList(query);
  }

  @Post('insertCategory')
  async insertIssueCategory(@Body() body: IssueCategoryRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.handleIssueCategory(body, 'I', callerOf(req));
  }

  @Put('updateCategory')
  async updateIssueCategory(@Body() body: IssueCategoryRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.handleIssueCategory(body, 'U', callerOf(req));
  }

  @Delete('deleteCategory')
  async deleteIssueCategory(@Body() body: DeleteIssueCategoryParam, @Req() req: RealtimeRequest): Promise<any> {
    console.log('deleteCategory')
    return this.issu.deleteIssueCategory(body, callerOf(req));
  }


  @Post('insertIssueDetail')
  async insertIssueDetail(@Body() body: InsertIssueDetailRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.executeIssueDetailOperation(body, 'I', callerOf(req));
  }

  @Post('insertHighlights')
  async insertHighlights(@Body() body: InsertHighlightsRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    console.log('insertIssueDetail', body)
    // The whole token user (id and admin flag): the quick mark gate checks session visibility.
    return this.issu.insertHighlights(body, 'I', req?.user);
  }

  @Post('removemultihighlights')
  async removemultihighlights(@Body() body: removeMultipleHighlightsReq, @Req() req: RealtimeRequest): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.removemultihighlights(body, callerOf(req));
  }

  @Delete('deleteHighlights')
  async deleteHighlights(@Body() body: deleteHighlightsParam, @Req() req: RealtimeRequest): Promise<any> {
    console.log('deleteHighlights', body)
    return this.issu.deleteHighlights(body, 'D', callerOf(req));
  }


  @Get('GetHighlightList')
  @UsePipes(new ValidationPipe({ transform: true }))
  async GetHighlightList(@Query() query: HighlightListParam): Promise<any> {
    return this.issu.GetHighlightLists(query);
  }
  @Put('updateIssueDetail')
  async updateIssueDetail(@Body() body: UpdateIssueDetailRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    //fdfdg
    return this.issu.executeIssueDetailOperation(body, 'U', callerOf(req));
  }

  @Delete('deleteIssueDetail')
  async deleteIssueDetail(@Body() body: DeleteIssueDetailParam, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.executeIssueDetailOperation(body, 'D', callerOf(req));
  }





  /////////////////////////// new API for issue details

  @Get('getIssueDetailByIssueId')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueDetailbyIsuseid(@Query() query: issuedetaillist_by_issueidBody): Promise<any> {
    return this.issu.getIssueDetailby_issue_id(query);
  }

  @Get('getIssueAnnotationList')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueAnnotationList(@Query() query: getIssueAnnotationListBody): Promise<any> {
    return this.issu.getIssueAnnotationList(query);
  }

  @Get('getIssueDetailById')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueDetailById(@Query() query: isseDetailByIdBody): Promise<any> {
    return this.issu.getIssueDetailById(query);
  }

  @Get('dynamiccombo')
  @UsePipes(new ValidationPipe({ transform: true }))
  async dynamiccombo(@Query() query: dynamicComboReq): Promise<any> {
    return await this.issu.getcCodeMaster(query);
  }

  @Post('updateHighlightIssueIds')
  async updateHighlightIssueIds(@Body() body: updateHighlightIssueIdsReq, @Req() req: RealtimeRequest): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.updateHighlightIssueIds(body, callerOf(req));
  }

  @Get('getLastIssue')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getArrengedIssue(@Query() query: getLastIssueMDL): Promise<any> {
    return this.issu.FilterLastSelecedIssued(query);
  }

  @Post('annothighlightexport')
  async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP, @Req() req: RealtimeRequest): Promise<any> {
    // 403 unless the token user can see nSessionid and it belongs to nCaseid (see IssueService).
    return this.issu.getAnnotHighlightExport(body, req?.user);
  }

  @Post('getannotationofpages')
  async getAnnotationOfPages(@Body() body: getIssueAnnotationListBody): Promise<any> {
    return this.issu.getAnnotationOfPages(body);
  }



  @Post('deletedemoissuedetail')
  async deletedemoissuedetail(@Body() body: any): Promise<any> {
    console.log('deleteCategory')
    return this.issu.deleteDemoIssueDetails(body);
  }



  @Post('setdefault')
  async serverBuilder(@Body() body: defaultSetupReq): Promise<any> {
    try {
      return await this.issu.updateIssueDetail(body);;
    } catch (error) {
      return { msg: -1, error: error.message };
    }

  }



  @Post('update/issuedetail/note')
  async updateIssueNote(@Body() body: updateDetailIssueNote, @Req() req: RealtimeRequest): Promise<any> {
    try {
      return await this.issu.updateIssueDetailNote(body, callerOf(req));
    } catch (error) {
      return { msg: -1, error: error.message };
    }

  }



  @Get('issuedetail/annotations')
  async getIssueAnnots(@Query() query: annotationsReq): Promise<any> {
    return this.issu.getIssueDetail(query);
  }

  @Get('qfacts/list')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQfactList(@Query() query: GetQfactList): Promise<any> {
    return await this.issu.getQfactList(query);
  }

  @Get('qmarks/list')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQmarkList(@Query() query: GetQmarkList): Promise<any> {
    return await this.issu.getQmarkList(query);
  }

  @Get('all/facts/list')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAllFactList(@Query() query: GetAllFactList): Promise<any> {
    return await this.issu.getAllFactList(query);
  }

  @Get('navigate/checkdata')
  @UsePipes(new ValidationPipe({ transform: true }))
  async checkNavigatedata(@Query() query: CheckNavigatedata): Promise<any> {
    return this.issu.checkNavigatedata(query);
  }

  @Get('detail')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssuebyid(@Query() query: IssueByidParam): Promise<any> {
    return this.issu.getIssuebyid(query);
  }

  @Delete('delete/multi/issue')
  async deleteMultiIssue(@Body() body: deleteIssueRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.deleteMultiIssue(body, callerOf(req));
  }

  @Post('sequence')
  async issueSecquence(@Body() body: issueSequenceParam): Promise<any> {
    return this.issu.issueSequence(body);
  }

  
  @Post('claim/sequence')
  async claimSecquence(@Body() body: claimSequenceParam): Promise<any> {
    return this.issu.claimSequence(body);
  }


  @Post('qfact/sequence')
  async qfactSecquence(@Body() body: qfactSequenceParam): Promise<any> {
    return this.issu.qfactSequence(body);
  }


  @Post('qfact/claim/sequence')
  async qfactClaimSecquence(@Body() body: qfactClaimSequenceParam): Promise<any> {
    return this.issu.qfactClaimSequence(body);
  }



  @Get('issuelist_V2')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueListGroup(@Query() query: IssueListParam): Promise<any> {
    return this.issu.getIssueListGroup(query);
  }

  
  @Put('updateClaimDetail')
  async updateClaimDetail(@Body() body: UpdateClaimRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.updateClaimDetail(body, callerOf(req));
  }

  @Delete('deleteClaim')
  async deleteClaimDetail(@Body() body: deleteClaimRequestBody, @Req() req: RealtimeRequest): Promise<any> {
    return this.issu.deleteClaim(body, callerOf(req));
  }
}
