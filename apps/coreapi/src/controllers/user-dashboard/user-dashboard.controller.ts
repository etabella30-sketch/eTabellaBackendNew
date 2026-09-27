import { Controller, Get, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserDashboardService } from '../../services/user-dashboard/user-dashboard.service';
import { activityFeedReq, dashInfoReq, userCaseListReq } from '../../interfaces/user-dashboard.interface';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('user-dashboard')
@Controller('user-dashboard')
export class UserDashboardController {

    constructor(private readonly userdashboardService: UserDashboardService){ 
    }


    @Get('caselist')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(44)
    async getCaseList(@Query() query: userCaseListReq): Promise<any> {
        return await this.userdashboardService.getCaseList(query);
    }


    /** The dashboard's Activity feed across the caller's cases (newest first, paged by cursor). */
    @Get('activity')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getActivity(@Query() query: activityFeedReq): Promise<any> {
        return await this.userdashboardService.getActivity(query);
    }


    @Get('dashinfo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDashInfo(@Query() query: dashInfoReq): Promise<any> {
        return await this.userdashboardService.getDashInfo(query);
    }




}
