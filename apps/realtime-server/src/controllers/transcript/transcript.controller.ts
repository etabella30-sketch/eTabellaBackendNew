import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, Query, Req, Res, UsePipes, ValidationPipe } from '@nestjs/common';
import { TranscriptService } from '../../services/transcript/transcript.service';
import { CaseComboRequest, DeleteTranscript, DwdpathReq, fileHTMLRequest, fileJSONRequest, GenerateIndexDto, GenerateTranscriptDto, SessionComboRequest, ThemeBuilder, ThemeConfig, ThemeDetailRequest, ThemeRequest, ThemeResonce, TranscriptBuilder, TranscriptDetailRequest, TranscriptFieldRequest, TranscriptFormDataDto, TranscriptLineDto, TranscriptPublishReq, TranscriptRequest,getAnnotHighlightEEP } from '../../interfaces/Transcript.interface';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ExporttranscriptService } from 'apps/realtime-server/src/services/exporttranscript/exporttranscript.service';
import { Response } from 'express';
import { GenerateWordIndexService } from '../../services/exporttranscript/generate_word_index/generate_word_index.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { TranscriptpublishService } from '../../services/transcript/transcript_publish.service';
@ApiBearerAuth('JWT')
@ApiTags('transcript')
@Controller('transcript')
export class TranscriptController {

    constructor(private readonly trascriptService: TranscriptService, private exportS: ExporttranscriptService,
        private wordIndexS: GenerateWordIndexService, private readonly config: ConfigService,
        private readonly trascriptpublishService: TranscriptpublishService

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
    async gettranscripts(@Query() query: TranscriptRequest): Promise<ThemeResonce> {
        return await this.trascriptService.getTranscripts(query);
    }

    @Get('get_transcript_detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async gettranscriptDetail(@Query() query: TranscriptDetailRequest): Promise<ThemeResonce> {
        return await this.trascriptService.gettranscriptDetail(query);
    }

    @Get('get_theme')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTheme(@Query() query: ThemeRequest): Promise<any> {
        return await this.trascriptService.getTheme(query);
    }


    @Get('session_combo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async sessionCombo(@Query() query: SessionComboRequest): Promise<any> {
        return await this.trascriptService.sessionCombo(query);
    }



    @Get('case_combo')
    @UsePipes(new ValidationPipe({ transform: true }))
    async caseCombo(@Query() query: CaseComboRequest): Promise<any> {
        return await this.trascriptService.case_combo(query);
    }




    @Get('get_theme_detail')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getThemeDetail(@Query() query: ThemeDetailRequest): Promise<any> {
        return await this.trascriptService.getThemeDetail(query);
    }


    @Get('summary')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTranscriptSummary(@Query() query: fileJSONRequest): Promise<any> {
        console.log('query', query);
        return await this.trascriptService.getTranscriptSummary(query)
    }


    @Get('filedata')
    @UsePipes(new ValidationPipe({ transform: true }))
    async getTranscriptFiledata(@Query() query: fileJSONRequest): Promise<any> {
        console.log('query', query);
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

        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');

        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        const res = await this.trascriptService.getHTMLfile(formData, origin);
        return res;
    }


    @Get('html')
    async getTranscriptHtml(@Query() formData: TranscriptBuilder): Promise<{ base64: string }> {
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
    async get_field_data(@Query() query: TranscriptFieldRequest): Promise<ThemeResonce> {
        return await this.trascriptService.get_field_data(query);
    }

    @Delete('delete')
    async deleteTranscript(@Body() body: DeleteTranscript) {
        return await this.trascriptService.deleteTranscript(body);
    }


    @Post('annothighlightexport')
    async getAnnotHighlightExport(@Body() body: getAnnotHighlightEEP, @Req() req: Request): Promise<any> {

        const host = req.get('host'); // e.g., 'localhost:3000' or 'example.com'
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        return this.trascriptpublishService.getAnnotHighlightExport(body,origin);
    }

}
