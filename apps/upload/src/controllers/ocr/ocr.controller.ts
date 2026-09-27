import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OcrService } from '../../services/ocr/ocr.service';
import { fileOcrReq, folderOcrReq } from '../../interfaces/convert.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { AuthCaller, UploadCaller, assertDocumentAccess, assertUploadCaseAccess } from '../../auth/upload-access';

// OCR rewrites a case's documents: a global admin or an active member of the document's case only
// (get_filedata and convert_files_byids read any id they are given).
@ApiTags('fileocr')
@Controller('ocr')
export class OcrController {

    constructor(private readonly ncfService: OcrService, private readonly db: DbService) { }


    @Post('ocrfile')
    async postExportfile(@Body() body: fileOcrReq, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertDocumentAccess(this.db, caller.userId, body.nBundledetailid);
        return await this.ncfService.fileOcr(body);
    }


    @Post('ocrfile_multi')
    async ocrFolder(@Body() body: folderOcrReq, @AuthCaller() caller: UploadCaller): Promise<any> {
        await assertUploadCaseAccess(this.db, caller.userId, { nCaseid: body.nCaseid, nSectionid: body.nSectionid });
        return await this.ncfService.folderOcr(body);
    }

}
