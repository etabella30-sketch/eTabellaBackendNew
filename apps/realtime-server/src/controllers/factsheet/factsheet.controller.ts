import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { fectsheetDetailReq, saveFactSheet, unshareDTO } from '../../interfaces/fact.interface';
import { FactsheetService } from '../../services/factsheet/factsheet.service';

@Controller('factsheet')
export class FactsheetController {

    constructor(private readonly factsheetService: FactsheetService) {

    }

    @Get('detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactDetail(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactDetail(query);
    }

    @Get('permissions')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getpermission(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.fetchPermission(query.nMasterid,query.nFSid);
    }

    @Get('shared')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactShared(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactShared(query);
    }

    @Get('issues')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactIssues(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactIssues(query);
    }

    @Get('contacts')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactContacts(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactContacts(query);
    }

    @Get('tasks')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactTasks(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactTasks(query);
    }

    @Get('links')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactLinks(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactLinks(query);
    }

    @Post('save')
    async submit(@Body() body: saveFactSheet): Promise<any> {
        return this.factsheetService.submit(body);
    }

    @Post('unshare')
    async unshare(@Body() body: unshareDTO): Promise<any> {
        return this.factsheetService.unshare(body);
    }

    @Post('delete')
    async delete(@Body() body: unshareDTO): Promise<any> {
        return this.factsheetService.delete(body);
    }

    
    @Get('factannotation')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactAnnotation(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactAnnotation(query);
    }
}
