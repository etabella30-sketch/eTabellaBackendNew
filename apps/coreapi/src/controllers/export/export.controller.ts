import { Body, Controller, Get, LoggerService, Post, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExportDataReq, ExportDeleteReq, FileDataReq, FileListResponce } from '../../interfaces/export.interface';
import { ExportService } from '../../services/export/export.service';

@ApiBearerAuth('JWT')
@ApiTags('export')
@Controller('export')
export class ExportController {
    constructor(private readonly exportFileService: ExportService) { }
    @Get('getfiledata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getFiledata(@Query() query: FileDataReq): Promise<FileListResponce[]> {
        return await this.exportFileService.getFiledata(query);
    }


    @Get('getexportdata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getExportdata(@Query() query: ExportDataReq): Promise<any> {
        return await this.exportFileService.getExportdata(query);
    }



    @Post('clearall')
    async getclearAll(@Body() body: ExportDataReq): Promise<any> {
        return await this.exportFileService.getclearAll(body);
    }

    @Post('deleteexport')
    async delete(@Body() body: ExportDeleteReq): Promise<any> {
        return await this.exportFileService.delete(body);
    }
}
