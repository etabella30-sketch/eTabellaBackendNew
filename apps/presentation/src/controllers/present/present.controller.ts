import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { colorChangeHighlightReq, deleteHighlightReq, getPresentDetailReq, getRunningScreenShareReq, getShareLinkListByPresenterReq, getShareLinkListReq, joinRequestReq, managePresentStatusReq, managePresentUserReq, manageUserReq, onlineUserReq, persentHighlightsReq, persentManageDocReq, presentDocPositionReq, presentToolReq, presetnTabsReq, remarksInsertReq, SaveHighlightReq, shareLinkReq, unsaveHighlightsReq } from '../../interfaces/setup/present.interface';
import { PresentService } from '../../services/present/present.service';

@ApiBearerAuth('JWT')
@ApiTags('present')
@Controller('present')
export class PresentController {
  private readonly allowedDomains = ['etabella.com', 'etabella.legal', 'localhost:4200'];
  private readonly defaultDomain = 'etabella.com';
  constructor(private readonly presentService: PresentService) {
  }

  @Get('individual/detail')
  async getPresentDetail(@Query() query: presetnTabsReq): Promise<any> {
    return await this.presentService.getPresentDetail(query);
  }

  @Post('individual/request/join')
  async requestToJoin(@Body() body: joinRequestReq): Promise<any> {
    return await this.presentService.requestToJoin(body);
  }
  @Post('individual/joined')
  async userJoined(@Body() body: joinRequestReq): Promise<any> {
    return await this.presentService.userJoined(body);
  }

  @Get('tool/detail')
  async getPresentToolDetail(@Query() query: presentToolReq): Promise<any> {
    return await this.presentService.getPresentToolDetail(query);
  }

  @Get('tool/users')
  async getPresentUsers(@Query() query: presentToolReq): Promise<any> {
    return await this.presentService.getPresentUsers(query);
  }

  @Post('tool/manage/user')
  async manageUser(@Body() body: managePresentUserReq, @Req() req: Request): Promise<any> {
    const domain = this.getDomain(req);
    return await this.presentService.managePresentUser(body, domain);
  }

  @Post('tool/manage/status')
  async manageStatus(@Body() body: managePresentStatusReq, @Req() req: Request): Promise<any> {
    const domain = this.getDomain(req);
    return await this.presentService.managePresentStatus(body, domain);
  }

  @Post('tool/manage/request')
  async manageUserReq(@Body() body: manageUserReq): Promise<any> {
    return await this.presentService.manageUserRequest(body);
  }

  @Post('end')
  async endPresentation(@Body() body: managePresentStatusReq): Promise<any> {
    return await this.presentService.endPresentation(body);
  }

  @Get('nav/tabs')
  async getTabs(@Query() query: presetnTabsReq): Promise<any> {
    return await this.presentService.getTabs(query);
  }


  @Get('highlight/list')
  async highlights(@Query() query: persentHighlightsReq): Promise<any> {
    return await this.presentService.getPresentHighlights(query);
  }

  @Post('highlight/save')
  async highlightSave(@Body() body: SaveHighlightReq): Promise<any> {
    return await this.presentService.saveHighlight(body);
  }


  @Post('highlight/delete')
  async highlightDelete(@Body() body: deleteHighlightReq): Promise<any> {
    return await this.presentService.deleteHighlight(body);
  }


  @Post('highlight/color/change')
  async highlightColorChange(@Body() body: colorChangeHighlightReq): Promise<any> {
    return await this.presentService.updateHighlightColor(body);
  }




  @Post('highlight/unsave')
  async unsavePresentHighlights(@Body() body: unsaveHighlightsReq): Promise<any> {
    return await this.presentService.unsaveHighlights(body);
  }

  @Get('doc/position')
  async getPresentDocPosition(@Query() query: presentDocPositionReq): Promise<any> {
    return await this.presentService.getPresentDocPosition(query);
  }



  @Post('manage/docs')
  async presentManageDocs(@Body() body: persentManageDocReq): Promise<any> {
    return await this.presentService.manageDocs(body);
  }

  @Get('online/users')
  async getOnlineUsers(@Query() query: onlineUserReq): Promise<any> {
    return await this.presentService.getOnlineUsers(query);
  }




  @Post('share/links')
  async shareLinks(@Body() body: shareLinkReq): Promise<any> {
    return await this.presentService.shareLinks(body);
  }


  @Get('share/links/list')
  async getSharedLinksList(@Query() query: getShareLinkListReq): Promise<any> {
    return await this.presentService.getSharedLinksList(query);
  }


  @Get('share/links/sharedbypresenter')
  async getShareByPresenterLinks(@Query() query: getShareLinkListByPresenterReq): Promise<any> {
    return await this.presentService.getShareByPresenterLinks(query);
  }


  @Get('remark/list')
  async getRemarkList(@Query() query: any): Promise<any> {
    return await this.presentService.getRemarkList(query);
  }

  @Post('remark/insert')
  async insertRemarks(@Body() body: remarksInsertReq): Promise<any> {
    return await this.presentService.insertRemark(body);
  }

  @Get('running/screenshare')
  async getRunningScreeShare(@Query() query: getRunningScreenShareReq): Promise<any> {
    return await this.presentService.getRunningScreeShare(query);
  }



  @Get('detail')
  async getPresentationDetail(@Query() query: getPresentDetailReq): Promise<any> {
    return await this.presentService.getPresentDetailOnRefresh(query);
  }


  @Get('turn/config')
  async getTurnConfig(): Promise<any> {
    return await this.presentService.getTurnConfig();
  }

  getDomain(req: Request): string {
    try {
      // Extract host and origin from request headers
      const host = req.headers['host']; // e.g., etabella.com:3000
      const origin = req.headers['origin']; // e.g., http://etabella.com

      // Determine the domain
      let domain = '';
      if (host) {
        domain = host.split(':')[0]; // Remove port if present
      } else if (origin) {
        // Remove the protocol (http:// or https://) and path if present
        domain = origin.replace(/^https?:\/\//, '').split('/')[0];
      }

      // Validate the domain against allowed domains
      if (this.allowedDomains.includes(domain)) {
        return domain;
      }

      // Default to predefined domain if no match is found
      return this.defaultDomain;
    } catch (error) {
      console.error('Error determining domain:', error.message);

      // Return the default domain to ensure API doesn't get stuck
      return this.defaultDomain;
    }
  }


  @Get('test')
  getHello(): any {
    return { msg: 1 }
  }
}