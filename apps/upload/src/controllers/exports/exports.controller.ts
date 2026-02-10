import { Body, Controller, Delete, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { deleteFilesReq, excelReport } from '../../interfaces/export.interface';
import { ExportsService } from '../../services/exports/exports.service';

@ApiBearerAuth('JWT')
@ApiTags('exports')
@Controller('exports')
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) {
    }

    
    @Post('upload-report')
    async postExportfile(@Body() body: excelReport): Promise<any>  { 
        return await this.exportsService.generateExport(body);
    }

    @Delete('delete-files')
    async postDeleteFiles(@Body() body: deleteFilesReq): Promise<any>  { 
        return await this.exportsService.deleteFiles(body);
    }

}