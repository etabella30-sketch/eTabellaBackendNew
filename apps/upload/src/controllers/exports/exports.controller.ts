import { Body, Controller, Delete, ForbiddenException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deleteFilesReq, excelReport } from '../../interfaces/export.interface';
import { ExportsService } from '../../services/exports/exports.service';
import { DbService } from '@app/global/db/pg/db.service';
import { AuthCaller, UploadCaller, assertUploadCaseAccess, uploadRowIdsOf } from '../../auth/upload-access';

// A global admin or an active member of nCaseid only, and the upload job / upload rows named must be
// that case's (et_upload_deletefiles deletes every nUDid in jFiles, whatever case it is in).
@ApiBearerAuth('JWT')
@ApiTags('exports')
@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService, private readonly db: DbService) {
    }


    @Post('upload-report')
    async postExportfile(@Body() body: excelReport, @AuthCaller() caller: UploadCaller): Promise<any>  {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nUPids: [body.nUPid] });
        return await this.exportsService.generateExport(body);
    }

    @Delete('delete-files')
    async postDeleteFiles(@Body() body: deleteFilesReq, @AuthCaller() caller: UploadCaller): Promise<any>  {
        const nUDids = uploadRowIdsOf(body.jFiles);
        if (!nUDids) throw new ForbiddenException('You are not permitted to delete these files');
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nUDids });
        return await this.exportsService.deleteFiles(body);
    }

}