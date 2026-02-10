import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { CaseService } from '../../services/case/case.service';
import { CaseCreationResonce, CaseDeleteReq, CaseDeleteRes, CaseDetailReq, CaseDetailResponce, CaseModal, NotificationDelete, NotificationReq } from '../../interfaces/case.interface';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('Case')
@Controller('case')
export class CaseController {
    constructor(private readonly caseService: CaseService) {
    }



    @Post('casebuilder')
    async casebuilder(@Body() body: CaseModal): Promise<CaseCreationResonce> {
        return await this.caseService.casebuilder(body);
    }

    @Get('casedetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(9)
    async getCaseDetail(@Query() query: CaseDetailReq): Promise<CaseDetailResponce> {
        return await this.caseService.getCaseDetail(query);
    }


    @Get('caseinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseinfo(@Query() query: CaseDetailReq): Promise<CaseDetailResponce> {
        return await this.caseService.getCaseDetail(query);
    }

    @Post('casedelete')
    async deleteCase(@Body() body: CaseDeleteReq): Promise<CaseDeleteRes> {
        return await this.caseService.deleteCase(body);
    }




    @Get('notifications')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getNotificationList(@Query() query: NotificationReq): Promise<CaseDetailResponce> {
        return await this.caseService.getNotification(query);
    }

    @Get('syncnotifications')
    @UsePipes(new ValidationPipe({ transform: true }))
    async syncNotificationList(@Query() query: NotificationReq): Promise<CaseDetailResponce> {
        return await this.caseService.syncNotification(query);
    }

    @Post('notification/delete')
    async clearAllNotitfiactions(@Body() body: NotificationDelete): Promise<any> {
        return await this.caseService.clearAllNotitfiactions(body);
    }


}
