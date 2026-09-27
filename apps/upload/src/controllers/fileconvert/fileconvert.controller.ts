import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NativefileconvertService } from '../../services/nativefileconvert/nativefileconvert.service';
import { convertFileMulti, convertQueue, fileConvertReq, fileURLReq } from '../../interfaces/convert.interface';
import { ConvertService } from '../../services/convert/convert.service';
import { EmailService } from '../../services/convert/email/email.service';
import { DbService } from '@app/global/db/pg/db.service';
import { AuthCaller, UploadCaller, assertCanReadObjectKey, assertUploadCaseAccess } from '../../auth/upload-access';

// Every route acts on a case: the caller must be a global admin or an active member of it, and the
// document / section named must be in it (get_filedata and convert_files_byids read any id).
@ApiTags('nativefileconvert')
@Controller('fileconvert')
export class FileconvertController {
    constructor(private readonly ncfService: ConvertService,
        private readonly emailS: EmailService,
        private readonly db: DbService,
    ) { }


    @Post('convertfile')
    async postExportfile(@Body() body: fileConvertReq, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nBundledetailids: [body.nBundledetailid] });
        return await this.ncfService.fileConvert(body);
    }



    @Post('email_parse')
    async emailParse(@Body() body: fileConvertReq, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nBundledetailids: [body.nBundledetailid] });
        return await this.emailS.emailParse(body);
    }


    // Presigns a Spaces key: only `doc/case<uuid>/...` keys of a case the caller may use.
    @Get('get-file-url')
    async getfileurl(@Query() body: fileURLReq, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertCanReadObjectKey(this.db, caller.userId, body.cPath);
        const url = await this.emailS.getSignedUrl(body.cPath);
        return { url };
    }


    @Post('convertfile_multi')
    async convertfile_multi(@Body() body: convertFileMulti, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nSectionid: body.nSectionid });
        return await this.ncfService.convertfile_multi(body);
    }

    @Get('convertlength')
    async getQueueLength(@Query() query: convertQueue, @AuthCaller() caller: UploadCaller): Promise<{ queueLength: number }> {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: query.nCaseid });
        const queueLength = await this.ncfService.getQueueLength(query.nCaseid);
        return { queueLength };
    }


}
