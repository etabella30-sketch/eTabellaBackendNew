import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { HelpcenterService } from '../../services/helpcenter/helpcenter.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetCommonTopicsReq, GetFaqListReq, GetKeyWordReq, GetModuleListReq, GetSubModuleListReq, InsertFeedbackReq, ModuleDetailReq, ModuleIUReq, SearchKeyReq, SubModuleDetailReq, SubModuleIUReq } from '../../interfaces/helpcenter.interface';

@ApiBearerAuth('JWT')
@ApiTags('helpcenter')
@Controller('helpcenter')
export class HelpcenterController {
    constructor(private readonly helpCenterService: HelpcenterService) { }

    @Get('getkeywords')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getkeywords(@Query() query: GetKeyWordReq): Promise<any> {
        return await this.helpCenterService.getkeywords(query);
    }

    @Get('getcommontopics')
    @UsePipes(new ValidationPipe({ transform: true }))
    async commonTopics(@Query() query: GetCommonTopicsReq): Promise<any> {
        return await this.helpCenterService.commonTopics(query);
    }

    @Get('getmodulelist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async moduleList(@Query() query: GetModuleListReq): Promise<any> {
        return await this.helpCenterService.moduleList(query);
    }

    @Get('getsubmodulelist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async subModuleList(@Query() query: GetSubModuleListReq): Promise<any> {
        return await this.helpCenterService.subModuleList(query);
    }

    @Get('getfaqlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async faqlist(@Query() query: GetFaqListReq): Promise<any> {
        return await this.helpCenterService.faqlist(query);
    }

    @Post('insertfeedback')
    async insertfeedback(@Body() body: InsertFeedbackReq): Promise<any> {
        return await this.helpCenterService.insertfeedback(body);
    }

    @Post('module_iu')
    async moduleIU(@Body() body: ModuleIUReq): Promise<any> {
        return await this.helpCenterService.moduleIU(body);
    }

    @Post('sub_module_iu')
    async subModuleIU(@Body() body: SubModuleIUReq): Promise<any> {
        return await this.helpCenterService.subModuleIU(body);
    }
    
    @Get('module_detail')
    async moduleDetail(@Query() query: ModuleDetailReq): Promise<any> {
        return await this.helpCenterService.moduleDetail(query);
    }

    @Get('sub_module_detail')
    async subModuleDetail(@Query() query: SubModuleDetailReq): Promise<any> {
        return await this.helpCenterService.subModuleDetail(query);
    }

    @Post('search_key')
    async searchKey(@Body() body: SearchKeyReq): Promise<boolean> {
        return await this.helpCenterService.searchKey(body);
    }
    
}