import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NativefileconvertService } from '../../services/nativefileconvert/nativefileconvert.service';
import { convertFileMulti, convertQueue, fileConvertReq, fileURLReq } from '../../interfaces/convert.interface';
import { ConvertService } from '../../services/convert/convert.service';
import { EmailService } from '../../services/convert/email/email.service';

@ApiTags('nativefileconvert')
@Controller('fileconvert')
export class FileconvertController {
    constructor(private readonly ncfService: ConvertService,
        private readonly emailS: EmailService
    ) { }


    @Post('convertfile')
    async postExportfile(@Body() body: fileConvertReq): Promise<any> {
        return await this.ncfService.fileConvert(body);
    }



    @Post('email_parse')
    async emailParse(@Body() body: fileConvertReq): Promise<any> {
        return await this.emailS.emailParse(body);
    }


    @Get('get-file-url')
    async getfileurl(@Query() body: fileURLReq): Promise<any> {
        const url = await this.emailS.getSignedUrl(body.cPath);
        return { url };
    }


    @Post('convertfile_multi')
    async convertfile_multi(@Body() body: convertFileMulti): Promise<any> {
        return await this.ncfService.convertfile_multi(body);
    }

    @Get('convertlength')
    async getQueueLength(@Query() query: convertQueue): Promise<{ queueLength: number }> {
        const queueLength = await this.ncfService.getQueueLength(query.nCaseid);
        return { queueLength };
    }


}
