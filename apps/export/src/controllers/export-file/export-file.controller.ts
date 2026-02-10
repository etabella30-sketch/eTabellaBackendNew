import { Body, Controller, Get, Post, Query, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExportFileService } from '../../services/export-file/export-file.service';
import { DownloadpathReq, ExportDataReq, ExportFilewithAnnot, ExportProcess, ExportResponse, FileDataReq, FileListResponce, RetryExport } from '../../inerfaces/export.interface';

@ApiBearerAuth('JWT')
@ApiTags('export')
@Controller('export-file')
export class ExportFileController {

    constructor(private readonly exportFileService: ExportFileService) { }


    @Get('startexportfile')
    @UsePipes(new ValidationPipe({ transform: true }))
    async startExportfile(@Query() query: ExportProcess): Promise<any> {
        return await this.exportFileService.startExportProcess(query);
    }





    @Post('exportwithannot')
    @UsePipes(new ValidationPipe({ transform: true }))
    async exportWithannot(@Body() body: ExportFilewithAnnot): Promise<ExportResponse> {
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
        try {
            this.exportFileService.startExportProcess({ bIsRetry: true, nExportid: body.nExportid, nMasterid: body.nMasterid });
        } catch (e) {
            console.log(e);
            return { msg: -1, value: e.message, nExportid: body.nExportid };
        }
        return { msg: 1, value: 'Export in Process', nExportid: body.nExportid };
    }

}
