import { Body, Controller, Get, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { FactTeamUsersReq, fectsheetDetailReq, saveFactSheet, unshareDTO } from '../../interfaces/fact.interface';
import { FactsheetService } from '../../services/factsheet/factsheet.service';
import { MarkWrite } from '../../interceptors/mark-write.interceptor';

@Controller('factsheet')
export class FactsheetController {

    constructor(private readonly factsheetService: FactsheetService) {

    }

    @Get('teamusers')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTeamUsers(@Query() query: FactTeamUsersReq): Promise<any[]> {
        return this.factsheetService.getTeamUsers(query);
    }

    @Get('detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactDetail(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactDetail(query);
    }

    @Get('permissions')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getpermission(@Query() query: fectsheetDetailReq): Promise<any> {
        // The row names the fact's owner: only for a caller who may view the fact.
        return this.factsheetService.fetchPermissionForCaller(query.nMasterid, query.nFSid);
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

    // @MarkWrite (live mark sync, user decision 2026-10-05): the fact's audience before and after the write is told
    // that the marks of its session changed; a share change reaches the people added AND the people removed.
    @Post('save')
    @MarkWrite({ kind: 'F', op: 'update', idFrom: 'body.nFSid' })
    async submit(@Body() body: saveFactSheet): Promise<any> {
        return this.factsheetService.submit(body);
    }

    // "Remove from my list": passed on only when it took the caller off the fact's audience (op 'unshare'); the SP
    // answers msg 1 even when it removed nothing.
    @Post('unshare')
    @MarkWrite({ kind: 'F', op: 'unshare', idFrom: 'body.nFSid' })
    async unshare(@Body() body: unshareDTO): Promise<any> {
        return this.factsheetService.unshare(body);
    }

    @Post('delete')
    @MarkWrite({ kind: 'F', op: 'delete', idFrom: 'body.nFSid' })
    async delete(@Body() body: unshareDTO): Promise<any> {
        return this.factsheetService.delete(body);
    }

    
    @Get('factannotation')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFactAnnotation(@Query() query: fectsheetDetailReq): Promise<any> {
        return this.factsheetService.getFactAnnotation(query);
    }
}
