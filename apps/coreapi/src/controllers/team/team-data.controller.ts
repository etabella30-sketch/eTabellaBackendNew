import { Controller, Get, Query, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CaseTeamReq, CaseUserInfoReq, CaseUserInfoRes, CaseUserReq, RoleListRes, TeamColorReq, TeamComboRes, TimeZoneRes, UserListRes, assignedUsersReq, assignedUsersRes, checkEmailReq, teamListResonce } from '../../interfaces/team.interface';
import { TeamDataService } from '../../services/team/team-data/team-data.service';
import { TeamcolorRes } from '../../interfaces/team-setup.interface';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('team-data')
@Controller('team-data')
export class TeamDataController {

    constructor(private readonly teamService: TeamDataService) {
    }

    @Get('teamlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    @UseInterceptors(LogInterceptor)
    @ApiId(47)
    async getTeams(@Query() query: CaseTeamReq): Promise<any> {
        return await this.teamService.getCaseTeams(query);
    }

    @Get('userlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getUsers(@Query() query: CaseUserReq): Promise<UserListRes> {
        return await this.teamService.getAllusers(query);
    }



    @Get('assignedusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAssigned(@Query() query: assignedUsersReq): Promise<assignedUsersRes> {
        return await this.teamService.getAssignees(query);
    }

    @Get('rolelist')
    async getRoles(): Promise<RoleListRes> {
        return await this.teamService.getRoles();
    }

    @Get('teamcombo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCaseCombo(@Query() query: CaseTeamReq): Promise<TeamComboRes> {
        return await this.teamService.getCaseCombo(query);
    }

    @Get('timezone')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTimeZone(): Promise<TimeZoneRes> {
        return await this.teamService.getTimeZone();
    }

    @Get('getuserdetail')
    @UseInterceptors(LogInterceptor)
    @ApiId(52)
    @UsePipes(new ValidationPipe({ transform: true }))
    async getUserDetail(@Query() query: CaseUserInfoReq): Promise<CaseUserInfoRes> {
        return await this.teamService.getUserDetail(query);
    }


    @Get('teamcolor')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTeamcolor(@Query() query: TeamColorReq): Promise<TeamcolorRes> {
        return await this.teamService.getTeamcolor(query);
    }

    @Get('checkemail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCheckEmail(@Query() query: checkEmailReq): Promise<UserListRes> {
        return await this.teamService.getCheckEmail(query);
    }

}
