import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, HttpStatus, Post, Query, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { TranscriptService } from '../../services/transcript/transcript.service';
import { CaseComboRequest, DeleteTranscript, DwdpathReq, fileHTMLRequest, fileJSONRequest, GenerateIndexDto, GenerateTranscriptDto, SessionComboRequest, ThemeBuilder, ThemeConfig, ThemeDetailRequest, ThemeRequest, ThemeResonce, TranscriptBuilder, TranscriptDetailRequest, TranscriptFieldRequest, TranscriptFormDataDto, TranscriptLineDto, TranscriptPublishReq, TranscriptRequest,getAnnotHighlightEEP } from '../../interfaces/Transcript.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExporttranscriptService } from 'apps/realtime-server/src/services/exporttranscript/exporttranscript.service';
import { Response } from 'express';
import { GenerateWordIndexService } from '../../services/exporttranscript/generate_word_index/generate_word_index.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TranscriptpublishService } from '../../services/transcript/transcript_publish.service';
import { DbService } from '@app/global/db/pg/db.service';
import { assertCallerCanSeeSessions, callerCanListCaseSessions } from '../../services/session/session-access-gate';
import type { RealtimeRequest } from '../../middleware/realtime-auth.middleware';
import { callerCanReadTranscriptFile, callerCanSeeTranscript, callerIsTranscriptAdmin, visibleTranscriptRows } from '../../services/transcript/transcript-access';

/*
 * transcript/* reads: a produced transcript is readable by the token user when they can see the
 * session it is published to (transcript-access.ts; global admins: everything). Refusals use each
 * route's own "not found" answer rather than a 403, so the legacy transcript viewer (feed-display,
 * which also runs on /individual/doc where the legacy interceptor turns a 403 into a redirect to the
 * dashboard) just shows no cover page, and nothing says whether the transcript exists.
 */
const TRANSCRIPT_DETAIL_NOT_FOUND = Object.freeze({ msg: -1, value: 'Failed to fetch' });
const TRANSCRIPT_FILE_NOT_FOUND = Object.freeze({ msg: -1, message: 'Error reading transcript file' });
const TRANSCRIPT_SUMMARY_NOT_FOUND = Object.freeze({ msg: -1, value: 'Error processing transcript file', error: 'Could not read the transcript file' });
const TRANSCRIPT_HTML_NOT_FOUND = Object.freeze({ msg: -1, value: 'Failed to generate HTML', error: 'File does not exist at server' });
@ApiBearerAuth('JWT')
@ApiTags('transcript')
@Controller('transcript')
export class TranscriptController {

    constructor(private readonly trascriptService: TranscriptService, private exportS: ExporttranscriptService,
        private wordIndexS: GenerateWordIndexService, private readonly config: ConfigService,
        private readonly trascriptpublishService: TranscriptpublishService,
        private readonly db: DbService

    ) {

    }


    @Post('transcript_builder')
    async transcriptBuilder(@Body() body: TranscriptBuilder): Promise<any> {
        const res: any = await this.trascriptService.transcriptbuilder(body);
        const inserted_id = res.inserted_id;
        const cMasterid = null; // Assuming cMasterid is not used in this context
        await this.generateTranscriptHtml(inserted_id, cMasterid);
        return res;
    }

    @Post('theme_builder')
    async themeBuilder(@Body() body: ThemeBuilder): Promise<any> {
        return await this.trascriptService.themebuilder(body);
    }


    @Post('convert_txtfile_to_json')
    async ConvertTextToJosn(@Body() query: fileJSONRequest): Promise<any> {
        return await this.trascriptService.ConvertTextToJosn(query);
    }

    @Get('get_transcripts')
    @UsePipes(new ValidationPipe({ transform: true }))
    async gettranscripts(@Query() query: TranscriptRequest, @Req() req: Request): Promise<ThemeResonce> {
        const res: any = await this.trascriptService.getTranscripts(query);
        // Only transcripts published to a session the caller can see (admins: every row).
        return Array.isArray(res) ? await visibleTranscriptRows(this.db, (req as RealtimeRequest).user, res) as any : res;
    }

    @Get('get_transcript_detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async gettranscriptDetail(@Query() query: TranscriptDetailRequest, @Req() req: Request): Promise<ThemeResonce> {
        if (!(await callerCanSeeTranscript(this.db, (req as RealtimeRequest).user, query?.cTransid))) return { ...TRANSCRIPT_DETAIL_NOT_FOUND } as any;
        return await this.trascriptService.gettranscriptDetail(query);
    }

    @Get('get_theme')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTheme(@Query() query: ThemeRequest): Promise<any> {
        return await this.trascriptService.getTheme(query);
    }


    @Get('session_combo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async sessionCombo(@Query() query: SessionComboRequest, @Req() req: Request): Promise<any> {
        // nCaseid's sessions: the session/getSessionsByCaseId audience (admin, case team, or assigned to one of them).
        if (!(await callerCanListCaseSessions(this.db, (req as RealtimeRequest).user, query?.nCaseid))) return [];
        return await this.trascriptService.sessionCombo(query);
    }



    @Get('case_combo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async caseCombo(@Query() query: CaseComboRequest, @Req() req: Request): Promise<any> {
        // Every case in the system: global admins only (RT Production publish picker).
        if (!callerIsTranscriptAdmin((req as RealtimeRequest).user)) return [];
        return await this.trascriptService.case_combo(query);
    }




    @Get('get_theme_detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getThemeDetail(@Query() query: ThemeDetailRequest): Promise<any> {
        return await this.trascriptService.getThemeDetail(query);
    }


    @Get('summary')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTranscriptSummary(@Query() query: fileJSONRequest, @Req() req: Request): Promise<any> {
        console.log('query', query);
        if (!(await callerCanReadTranscriptFile(this.db, (req as RealtimeRequest).user, query?.cPath))) return { ...TRANSCRIPT_SUMMARY_NOT_FOUND };
        return await this.trascriptService.getTranscriptSummary(query)
    }


    @Get('filedata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTranscriptFiledata(@Query() query: fileJSONRequest, @Req() req: Request): Promise<any> {
        console.log('query', query);
        if (!(await callerCanReadTranscriptFile(this.db, (req as RealtimeRequest).user, query?.cPath))) return { ...TRANSCRIPT_FILE_NOT_FOUND };
        return await this.trascriptService.getTranscriptFiledata(query)
    }


    @Post('publish')
    async transcriptPublish(@Body() body: TranscriptPublishReq, @Req() req: Request): Promise<any> {
        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');

        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        const res: any = await this.trascriptpublishService.transcriptPublish(body, origin);
        return res;
    }

    @Post('html-file-to-doc-stream')
    async convertAndStreamDoc(
        @Body('filePath') filePath: string, @Body('nMasterid') nMasterid: string, @Body('cTransid') cTransid: string,
        // @Res({ passthrough: true }) res: Response,
        @Req() req: Request
    ) {
        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');

        const origin = isLocal ? `${__dirname}` : `${req.protocol}://${host}`;
        console.log('filePath', filePath, 'nMasterid', nMasterid);
        // const streamableFile = await this.exportS.htmlFileToDocStream(filePath);

        // res.set({
        //     'Content-Type': 'application/msword',
        //     'Content-Disposition': 'attachment; filename="converted.doc"',
        // });

        // return streamableFile;
        return await this.exportS.htmlFileToDocStream(nMasterid, filePath, cTransid, origin);
    }



    @Post('generate-file-index')
    @HttpCode(200)
    async generate(@Body() dto: GenerateIndexDto, @Res() res: Response) {
        const pdfBuffer = await this.wordIndexS.generateIndex(dto.cPath, dto.cTransid);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="index.pdf"',
        });
        res.send(pdfBuffer);
    }


    async generateTranscriptHtml(cTransid: string, nMasterid: string) {
        const formData: any = await this.trascriptService.gettranscriptDetail({ cTransid: cTransid, nMasterid: nMasterid });
        const TranscriptLineDto = await this.trascriptService.getTranscriptFiledata({ cPath: formData.cPath, nMasterid: nMasterid });
        const GenerateTranscriptDto = {
            formData: formData,
            lines: TranscriptLineDto,
            isFullSize: true
        }
        await this.trascriptService.generateTranscript(GenerateTranscriptDto);
    }


    @Get('html-file')
    async getTranscriptHtmlFile(@Query() formData: fileHTMLRequest, @Req() req: Request): Promise<{ msg: number, value?: string, error?: any, base64?: string }> {
        // Renders (and caches in exports/) the transcript named by cTransid; its file comes from the DB row.
        if (!(await callerCanSeeTranscript(this.db, (req as RealtimeRequest).user, formData?.cTransid))) return { ...TRANSCRIPT_HTML_NOT_FOUND };

        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');

        // On localhost, pass empty origin so generated `<img src="${origin}/assets/...">`
        // becomes a root-relative path (`/assets/...`). Angular serves the image from its
        // own origin when the HTML is bound via [innerHTML]. Passing `process.cwd()` used
        // to produce a Windows file path like `D:/...` — unusable from a browser context.
        const origin = isLocal ? '' : `${req.protocol}://${host}`;
        const res = await this.trascriptService.getHTMLfile(formData, origin);
        return res;
    }


    @Get('html')
    async getTranscriptHtml(@Query() formData: TranscriptBuilder, @Req() req: Request): Promise<{ base64: string }> {
        // Renders the file at REALTIME_PATH + cPath. The route has no "not found" answer (a missing file
        // is a 500) and only the admin transcript builder calls it, so a refusal is a 403.
        if (!(await callerCanReadTranscriptFile(this.db, (req as RealtimeRequest).user, (formData as any)?.cPath))) {
            throw new ForbiddenException('You are not permitted to read this transcript');
        }
        const res = await this.trascriptService.getHtmlToData(formData);
        return res;
    }

    @Get('download')
    async downloadFile(@Query() query: DwdpathReq, @Res() res: Response) {
        console.log('cPath:', query.cPath);
        return await this.exportS.downloadFile(query.cPath, res);
    }


    @Get('get_field_data')
    @UsePipes(new ValidationPipe({ transform: true }))
    async get_field_data(@Query() query: TranscriptFieldRequest, @Req() req: Request): Promise<ThemeResonce> {
        // Distinct values of any Transcripts column over every transcript: global admins only.
        if (!callerIsTranscriptAdmin((req as RealtimeRequest).user)) return [] as any;
        return await this.trascriptService.get_field_data(query);
    }

    @Delete('delete')
    async deleteTranscript(@Body() body: DeleteTranscript) {
        return await this.trascriptService.deleteTranscript(body);
    }


    @Post('annothighlightexport')
    async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP, @Req() req: Request): Promise<any> {
        // The export reads the transcript / feed of nSessionid and nSesid and prints nCaseid's name:
        // 403 unless the token user can see those sessions (socket membership rule) and they belong
        // to nCaseid.
        await assertCallerCanSeeSessions(this.db, (req as RealtimeRequest).user, [body?.nSessionid, body?.nSesid], body?.nCaseid);

        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        return this.trascriptpublishService.getAnnotHighlightExport(body,origin);
    }

}
