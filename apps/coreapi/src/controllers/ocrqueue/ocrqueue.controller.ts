import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OcrqueueService } from '../../services/ocrqueue/ocrqueue.service';
import { OCRFilelistQueue } from '../../interfaces/ocrqueue.interface';

@ApiBearerAuth('JWT')
@ApiTags('ocr')
@Controller('ocrqueue')
export class OcrqueueController {

    constructor(private readonly ocrqueueS: OcrqueueService) {
    }

    @Get('get_ocrlist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getOcrdata(@Query() query: OCRFilelistQueue): Promise<any> {
        return await this.ocrqueueS.getOcrdata(query);
    }

    @Get('get_ocrfilelist')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getOcrFiledata(@Query() query: OCRFilelistQueue): Promise<any> {
        return await this.ocrqueueS.getOcrFiledata(query);
    }

}
