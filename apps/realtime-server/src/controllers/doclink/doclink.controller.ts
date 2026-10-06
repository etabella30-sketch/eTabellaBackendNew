import { Body, Controller, Get, HttpException, Post, Query, Req, UsePipes, ValidationPipe } from '@nestjs/common';
import { DoclinkService } from '../../services/doclink/doclink.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { docID, docIDmulti, InsertDoc, resInsertDoc } from '../../interfaces/doc.interface';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';
import { MarkWrite } from '../../interceptors/mark-write.interceptor';



@ApiBearerAuth('JWT')
@ApiTags('doclink')
@Controller('doclink')
export class DoclinkController {

    constructor(private doclinkserivce: DoclinkService) {

    }

    // @MarkWrite (live mark sync, user decision 2026-10-05): the DocLink's author and share recipients are told that
    // the marks of its session changed.
    @Post('insertdoc')
    @MarkWrite({ kind: 'D', op: 'insert', idFrom: 'reply.nDocid' })
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
    @MarkWrite({ kind: 'D', op: 'delete', idFrom: 'body.nDocid' })
    @UsePipes(new ValidationPipe({ transform: true }))
    async factdelete(@Body() body: docID, @Req() req: RealtimeRequest): Promise<any> {
        try {
            // The owner gate's 403 / 500 propagates; any other failure is a msg -1 row (it answered msg 1 before Phase 8).
            const res = await this.doclinkserivce.docDelete(body, req?.user);
            return res;
        } catch (error) {
            if (error instanceof HttpException) throw error;
            return {
                msg: -1,
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
