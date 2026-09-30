import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OcrService } from '../../services/ocr/ocr.service';
import { fileOcrReq, folderOcrReq } from '../../interfaces/convert.interface';

@ApiTags('fileocr')
@Controller('ocr')
export class OcrController {

    constructor(private readonly ncfService: OcrService) { }


    @Post('ocrfile')
    async postExportfile(@Body() body: fileOcrReq): Promise<any> {
        return await this.ncfService.fileOcr(body);
    }


    @Post('ocrfile_multi')
    async ocrFolder(@Body() body: folderOcrReq): Promise<any> {
        return await this.ncfService.folderOcr(body);
    }

}
