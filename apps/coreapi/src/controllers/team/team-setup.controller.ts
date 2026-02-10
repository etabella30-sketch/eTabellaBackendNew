/* eslint-disable prettier/prettier */
import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { TeamSetupService } from '../../services/team/team-setup/team-setup.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TeamBuilderReq, TeamBuilderRes, UserBuilderReq, UserBuilderRes, teamSetup, teamSetupRes,UserDeleteReq,UserDeleteRes, TeamDeleteReq, TeamDeleteRes } from '../../interfaces/team-setup.interface';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('team-setup')
@Controller('team-setup')
export class TeamSetupController {

    constructor(private readonly teamService: TeamSetupService){ 
    }


    @Post('teambuilder')
    async caseBuilder(@Body() body: TeamBuilderReq): Promise<TeamBuilderRes> {
        return await this.teamService.caseBuilder(body);
    }


    @Post('teamdelete')
    async teamdelete(@Body() body: TeamDeleteReq): Promise<TeamDeleteRes> {
        return await this.teamService.deleteTeam(body);
    }

    @Post('userbuilder')
    async buildUser(@Body() body: UserBuilderReq): Promise<UserBuilderRes> {
        return await this.teamService.userBuilder(body);
    }


    @Post('assignteam')
    @UseInterceptors(LogInterceptor)
    @ApiId(12)
    async assignTeam(@Body() body: teamSetup): Promise<teamSetupRes> {
        return await this.teamService.teamAssignment(body);
    }
    @Post('userdelete')
    async deleteUser(@Body() body: UserDeleteReq): Promise<UserDeleteRes> {
        return await this.teamService.deleteUser(body);
    }
    
}
