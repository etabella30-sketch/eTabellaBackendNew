import { Body, Controller, Delete, Get, Param, Post, Put, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { CheckNavigatedata, DeleteIssueCategoryParam, DeleteIssueDetailParam, GetAllFactList, GetIssueDetailsGroupedParam, GetIssueDetailsParam, GetQfactList, GetQmarkList, HighlightListParam, InsertHighlightsRequestBody, InsertIssueDetailRequestBody, IssueCategoryRequestBody, IssueListParam, IssueRequestBody, UpdateIssueDetailRequestBody, annotationsReq, catListParam, defaultSetupReq, deleteHighlightsParam, deleteHighlightsRequestBody, deleteIssueRequestBody, dynamicComboReq, getAnnotHighlightEEP, getIssueAnnotationListBody, getLastIssueMDL, isseDetailByIdBody, issuedetaillist_by_issueidBody, removeMultipleHighlightsReq, updateDetailIssueNote, updateHighlightIssueIdsReq, issueSequenceParam, IssueByidParam, claimSequenceParam, UpdateClaimRequestBody, deleteClaimRequestBody } from '../../interfaces/issue.interface';
import { IssueService } from '../../services/issue/issue.service';
import { ApiTags } from '@nestjs/swagger';


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
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueList(@Query() query: IssueListParam): Promise<any> {
    return this.issu.getIssueList(query);
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


  @Post('insertIssueDetail')
  async insertIssueDetail(@Body() body: InsertIssueDetailRequestBody): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.executeIssueDetailOperation(body, 'I');
  }

  @Post('insertHighlights')
  async insertHighlights(@Body() body: InsertHighlightsRequestBody): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.insertHighlights(body, 'I');
  }

  @Post('removemultihighlights')
  async removemultihighlights(@Body() body: removeMultipleHighlightsReq): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.removemultihighlights(body);
  }

  @Delete('deleteHighlights')
  async deleteHighlights(@Body() body: deleteHighlightsParam): Promise<any> {
    console.log('deleteHighlights', body)
    return this.issu.deleteHighlights(body, 'D');
  }


  @Get('GetHighlightList')
  @UsePipes(new ValidationPipe({ transform: true }))
  async GetHighlightList(@Query() query: HighlightListParam): Promise<any> {
    return this.issu.GetHighlightLists(query);
  }
  @Put('updateIssueDetail')
  async updateIssueDetail(@Body() body: UpdateIssueDetailRequestBody): Promise<any> {
    //fdfdg
    return this.issu.executeIssueDetailOperation(body, 'U');
  }

  @Delete('deleteIssueDetail')
  async deleteIssueDetail(@Body() body: DeleteIssueDetailParam): Promise<any> {
    return this.issu.executeIssueDetailOperation(body, 'D');
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
  async updateHighlightIssueIds(@Body() body: updateHighlightIssueIdsReq): Promise<any> {
    console.log('insertIssueDetail', body)
    return this.issu.updateHighlightIssueIds(body);
  }

  @Get('getLastIssue')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getArrengedIssue(@Query() query: getLastIssueMDL): Promise<any> {
    return this.issu.FilterLastSelecedIssued(query);
  }

  @Post('annothighlightexport')
  async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP): Promise<any> {
    return this.issu.getAnnotHighlightExport(body);
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
  async updateIssueNote(@Body() body: updateDetailIssueNote): Promise<any> {
    try {
      return await this.issu.updateIssueDetailNote(body);;
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
  async deleteMultiIssue(@Body() body: deleteIssueRequestBody): Promise<any> {
    return this.issu.deleteMultiIssue(body);
  }

  @Post('sequence')
  async issueSecquence(@Body() body: issueSequenceParam): Promise<any> {
    return this.issu.issueSequence(body);
  }

  
  @Post('claim/sequence')
  async claimSecquence(@Body() body: claimSequenceParam): Promise<any> {
    return this.issu.claimSequence(body);
  }



  @Get('issuelist_V2')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getIssueListGroup(@Query() query: IssueListParam): Promise<any> {
    return this.issu.getIssueListGroup(query);
  }

  
  @Put('updateClaimDetail')
  async updateClaimDetail(@Body() body: UpdateClaimRequestBody): Promise<any> {
    return this.issu.updateClaimDetail(body);
  }

  @Delete('deleteClaim')
  async deleteClaimDetail(@Body() body: deleteClaimRequestBody): Promise<any> {
    return this.issu.deleteClaim(body);
  }
}
