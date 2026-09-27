import { Body, Controller, Get, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExportFileService } from '../../services/export-file/export-file.service';
import { DownloadpathReq, ExportDataReq, ExportFilewithAnnot, ExportProcess, ExportResponse, FileDataReq, FileListResponce, RetryExport } from '../../inerfaces/export.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { assertCaseAccess } from 'apps/download/src/auth/download-access';
import { assertCanRerunExport, assertExportFilesInCase } from '../../auth/export-access';

// Every route here runs behind JwtMiddleware (export.module.ts), which puts the caller's id in
// nMasterid. The export's case (ExportMaster.nCaseid) is what GET /download checks later, so an
// export may only be made of the caller's case and of documents in it, and only its creator may
// re-run it.
@ApiBearerAuth('JWT')
@ApiTags('export')
@Controller('export-file')
export class ExportFileController {

    constructor(private readonly exportFileService: ExportFileService, private readonly db: DbService) { }


    @Get('startexportfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    async startExportfile(@Query() query: ExportProcess): Promise<any> {
        await assertCanRerunExport(this.db, query.nMasterid, query.nExportid);
        return await this.exportFileService.startExportProcess(query);
    }





    @Post('exportwithannot')
    @UsePipes(new ValidationPipe({ transform: true }))
    async exportWithannot(@Body() body: ExportFilewithAnnot): Promise<ExportResponse> {
        // et_export_insert_data_1 stores the client's nCaseid as the export's case and takes jFiles by
        // id from any case: without these a member of one case could export (then download) another's.
        await assertCaseAccess(this.db, body.nMasterid, body.nCaseid);
        await assertExportFilesInCase(this.db, body.nCaseid, body.jFiles);
        let res: ExportResponse = await this.exportFileService.exportWithannot(body);
        try {
            this.exportFileService.startExportProcess({ nExportid: res.nExportid, nMasterid: body.nMasterid });
        } catch (e) {
            console.log(e);
        }
        return { msg: 1, value: 'Export in Process', nExportid: res.nExportid };
    }


    @Post('retryexport')
    @UsePipes(new ValidationPipe({ transform: true }))
    async retryExport(@Body() body: RetryExport): Promise<ExportResponse> {
        await assertCanRerunExport(this.db, body.nMasterid, body.nExportid);
        try {
            this.exportFileService.startExportProcess({ bIsRetry: true, nExportid: body.nExportid, nMasterid: body.nMasterid });
        } catch (e) {
            console.log(e);
            return { msg: -1, value: e.message, nExportid: body.nExportid };
        }
        return { msg: 1, value: 'Export in Process', nExportid: body.nExportid };
    }

}
