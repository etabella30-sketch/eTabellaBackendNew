import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from '../../services/common/common.service';
import { ComboCodeReq, ComboCodeRes, IssuelistReq, IssuelistRes, UserlistReq, UserlistRes, annotReq, annotRes, getcoloridMDL } from '../../interfaces/common';


@ApiBearerAuth('JWT')
@ApiTags('common')
@Controller('common')
export class CommonController {


    constructor(private readonly commonService: CommonService) {
    }

    @Get('getcode')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getCode(@Query() query: ComboCodeReq): Promise<ComboCodeRes[]> {
        return await this.commonService.getcCodeMaster(query);
    }

    @Get('getissuelist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getIssuelist(@Query() query: IssuelistReq): Promise<IssuelistRes[]> {
        return await this.commonService.getIssuelist(query);
    }


    @Get('myteamusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getMyteamusers(@Query() query: UserlistReq): Promise<UserlistRes[]> {
        return await this.commonService.getMyteamusers(query);
    }


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