import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from '../../services/common/common.service';
import { IssuelistReq, IssuelistRes, annotReq, annotRes, getcoloridMDL } from '../../interfaces/common';


@ApiBearerAuth('JWT')
@ApiTags('common')
@Controller('common')
export class CommonController {


    constructor(private readonly commonService: CommonService) {
    }

    // GET getcode (the code tables) moved to @app/rt-features/code-tables (CoreCodeTableController, mounted by
    // CommonModule), Phase 10 of the shared-libraries plan.

    @Get('getissuelist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIssuelist(@Query() query: IssuelistReq): Promise<IssuelistRes[]> {
        return await this.commonService.getIssuelist(query);
    }


    // GET myteamusers moved to @app/rt-features/team-users (CoreTeamUsersController, mounted by CommonModule),
    // Phase 5 of the shared-libraries plan.


    @Get('getannotations')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getAnnotations(@Query() query: annotReq): Promise<any> {
        return await this.commonService.getAnnotations(query);
    }



    @Get('getcolorid')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getArrengedIssue(@Query() query: getcoloridMDL): Promise<any> {
        return this.commonService.getcolorid(query);
    }




}