import { Body, Controller, Get, Post, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminDashboardService } from '../../services/admin-dashboard/admin-dashboard.service';
import { CaseListReq, CaseListResponce, archiveCaseReq, archiveCaseRes } from '../../interfaces/admin-dashboard.interface';
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



    @Get('archiveCase')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getArchiveCase(@Query() query: CaseListReq): Promise<CaseListResponce> {
        return await this.admindashboardService.getarchiveCase(query);
    }


    @Post('updatearchiveCase')
    async archiveCase(@Body() body: archiveCaseReq): Promise<archiveCaseRes> {
        return await this.admindashboardService.archiveCase(body);
    }



}
