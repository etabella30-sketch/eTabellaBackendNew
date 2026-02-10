import { Body, Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { AssignService } from '../../services/assign/assign.service';
import { AssignBundlesReq, AssignBundlesRes, assigncontactReq, AssignCustomBundlesReq, assignTagReq, assignTaskReq, checkAssignBundleExistsReq, FileMetadataReq, unassignContactReq, unassignTagReq, unassignTaskReq, ViewBundlesReq, ViewContactReq, ViewTaskReq } from '../../interfaces/assign.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogInterceptor } from '@app/global/interceptor/log.interceptor';
import { ApiId } from '@app/global/decorator/apiid';

@ApiBearerAuth('JWT')
@ApiTags('assign')
@Controller('assign')
export class AssignController {

    constructor(private readonly assignService: AssignService) {
    }



    @Post('bundlesassignment')
    async bundlesAssignment(@Body() body: AssignBundlesReq): Promise<AssignBundlesRes> {
        console.log("alok", body);
        return await this.assignService.bundlesAssignment(body);
    }


    @Post('custombundlesassignment')
    async custombundlesAssignment(@Body() body: AssignCustomBundlesReq): Promise<AssignBundlesRes> {
        return await this.assignService.custombundlesAssignment(body);
    }

    @Post('bundlesunassignment')
    async bundlesUnAssignment(@Body() body: AssignBundlesReq): Promise<AssignBundlesRes> {
        return await this.assignService.bundlesUnAssignment(body);
    }


    @Post('assignContact')
    @UseInterceptors(LogInterceptor)
    @ApiId(59)
    async assignContact(@Body() body: assigncontactReq): Promise<any> {
        return await this.assignService.assignContact(body);
    }


    @Post('assigntask')
    @UseInterceptors(LogInterceptor)
    @ApiId(84)
    async assigntask(@Body() body: assignTaskReq): Promise<any> {
        return await this.assignService.assignTask(body);
    }
    @Post('assigntag')
    @UseInterceptors(LogInterceptor)
    @ApiId(64)
    async assigtag(@Body() body: assignTagReq): Promise<any> {
        return await this.assignService.assignTag(body);
    }

    @Post('unassigntag')
    @UseInterceptors(LogInterceptor)
    @ApiId(83)
    async unassigtag(@Body() body: unassignTagReq): Promise<any> {
        return await this.assignService.unassignTag(body);
    }



    @Post('unassigntask')
    @UseInterceptors(LogInterceptor)
    @ApiId(68)
    async unassigtask(@Body() body: unassignTaskReq): Promise<any> {
        return await this.assignService.unassignTask(body);
    }



    @Post('unassigncontact')
    @UseInterceptors(LogInterceptor)
    @ApiId(82)
    async unassigcontact(@Body() body: unassignContactReq): Promise<any> {
        return await this.assignService.unassignContact(body);
    }


    @Get('viewcustombundle')
    async viewCustombundle(@Query() query: ViewBundlesReq): Promise<any> {
        return await this.assignService.viewCustombundle(query);
    }


    @Get('viewcontact')
    async viewcontact(@Query() query: ViewContactReq): Promise<any> {
        return await this.assignService.viewcontact(query);
    }


    @Get('viewTask')
    async viewTask(@Query() query: ViewTaskReq): Promise<any> {
        return await this.assignService.viewtask(query);
    }


    @Get('viewtag')
    async viewtag(@Query() query: ViewContactReq): Promise<any> {
        return await this.assignService.viewTag(query);
    }


    @Get('checkassignbundleexists')
    async checkCustomBundle(@Query() query: checkAssignBundleExistsReq): Promise<any> {
        return await this.assignService.checkCustomBundle(query);
    }



    @Get('file_metadata')
    async file_metadata(@Query() query: FileMetadataReq): Promise<any> {
        return await this.assignService.file_metadata(query);
    }



}
