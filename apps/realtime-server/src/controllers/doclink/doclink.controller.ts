import { Body, Controller, Get, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { docID, docIDmulti, InsertDoc, resInsertDoc } from '../../interfaces/doc.interface';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';



@ApiBearerAuth('JWT')
@ApiTags('doclink')
@Controller('doclink')
export class DoclinkController {

    constructor(private doclinkserivce: DoclinkService) {

    }

    @Post('insertdoc')
    @UsePipes(new ValidationPipe({ transform: true }))
    async insertDoc(@Body() body: InsertDoc, @Req() req: RealtimeRequest): Promise<resInsertDoc> {
        // The create gate's 403 / 500 propagates (no try/catch here), so it is never turned into a 200.
        let res = await this.doclinkserivce.insertDoc(body, req.user);
        if (res && res.nDocid) {
            return {
                msg: 1,
                value: 'Doclink inserted successfully',
                nDocid: res["nDocid"]
            }
        } else {
            return {
                msg: -1,
                value: 'Doclink not inserted successfully. Docid not found.',
                error: res
            }
        }
    }


    @Post('docdelete')
    @UsePipes(new ValidationPipe({ transform: true }))
    async factdelete(@Body() body: docID): Promise<any> {
        try {
            const res = await this.doclinkserivce.docDelete(body);
            return res;
        } catch (error) {
            return {
                msg: 1,
                value: 'Doclink Delete Failed',
                error: error
            }
        }
    }

    @Get('docdetail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async docDetail(@Query() query: docIDmulti): Promise<any> {
        try {
            const res = await this.doclinkserivce.docDetail(query);
            return res;
        } catch (error) {
            return {
                msg: 1,
                value: 'Fetch Failed',
                error: error
            }
        }
    }


    @Get('docshared')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getDocShared(@Query() query: docID): Promise<any> {
        try {
            const res = await this.doclinkserivce.getDocShared(query);
            return res;
        } catch (error) {
            return { msg: -1, value: error.message, error: error }
        }
    }


}
