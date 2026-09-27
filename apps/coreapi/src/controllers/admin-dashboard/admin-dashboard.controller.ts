import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from '../../services/admin-dashboard/admin-dashboard.service';
import { CaseCountReq, CaseCountResponce, CaseListReq, CaseListResponce, RtSimSourceReq, RtSimSourceRes, RtSimSourceSetReq, archiveCaseReq, archiveCaseRes } from '../../interfaces/admin-dashboard.interface';
import { IsAdmin } from '@app/global/decorator/isadmin';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('admin-dashboard')
@Controller('admin-dashboard')
export class AdminDashboardController {

    constructor(private readonly admindashboardService: AdminDashboardService) {
        console.log('\n\r\n\r\n\r\n\r\n\rAdminDashboardController initialized.')
    }

    @Get('caselist')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(43)
    async getCaseList(@Query() query: CaseListReq): Promise<CaseListResponce> {
        return await this.admindashboardService.getCaseList(query);
    }



    @Get('caselistcount')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseListCount(@Query() query: CaseCountReq): Promise<CaseCountResponce> {
        return await this.admindashboardService.getCaseListCount(query);
    }


    @Get('archiveCase')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getArchiveCase(@Query() query: CaseListReq): Promise<CaseListResponce> {
        return await this.admindashboardService.getarchiveCase(query);
    }


    @Post('updatearchiveCase')
    async archiveCase(@Body() body: archiveCaseReq): Promise<archiveCaseRes> {
        return await this.admindashboardService.archiveCase(body);
    }

    /** RT Simulation document source (super admin; the module's AdminMiddleware gates it). */
    @Get('rtsimsource')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getRtSimSource(@Query() query: RtSimSourceReq): Promise<RtSimSourceRes> {
        return await this.admindashboardService.getRtSimSource(query);
    }

    @Post('rtsimsource')
    async setRtSimSource(@Body() body: RtSimSourceSetReq): Promise<RtSimSourceRes> {
        return await this.admindashboardService.setRtSimSource(body);
    }



}
