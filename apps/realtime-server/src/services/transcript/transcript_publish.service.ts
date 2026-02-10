// Refactored TranscriptpublishService with better logging, error handling, and cleaner structure
import {
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { TranscriptHtmlService } from './transcript-html.service';
import { TranscriptService } from './transcript.service';
import { KafkaGlobalService } from '@app/global/utility/kafka/kafka.shared.service';
import { VerifypdfService } from './verifypdf/verifypdf.service';
import { filecopyService } from './filecopy/filecopy.service';
import * as fs from 'fs';
import { resolve } from 'path';
import * as path from 'path';
import { spawn } from 'child_process';
import * as puppeteer from 'puppeteer';
import { TranscriptPublishReq, FileValidateResponse, getAnnotHighlightEEP } from '../../interfaces/Transcript.interface';
import { UtilityService } from '../utility/utility.service';
import { bool } from 'aws-sdk/clients/signer';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { FeedDataService } from '../feed-data/feed-data.service';

@Injectable()
export class TranscriptpublishService {
    private readonly logTag = 'realtime/transcript';
    private browser: puppeteer.Browser = null;
    constructor(
        private readonly config: ConfigService,
        private readonly db: DbService,
        private readonly log: LogService,
        private readonly htmlService: TranscriptHtmlService,
        private readonly transService: TranscriptService,
        private readonly kafka: KafkaGlobalService,
        private readonly verifier: VerifypdfService,
        private readonly copier: filecopyService,
        private readonly utilityService: UtilityService, // Assuming utilityService is defined elsewhere
        private conversion: ConversionJsService,
        private feedData: FeedDataService
    ) { }

    async transcriptPublish(body: TranscriptPublishReq, origin: string): Promise<any> {
        const { cPath, cTransid, nSesid } = body;
        const basePath = this.config.get('REALTIME_PATH');
        const filePath = basePath + cPath;
        const jsonPath = filePath.replace(/\.[^/.]+$/, '.json');
        const PathTEXT = filePath.replace(/\.[^/.]+$/, '.TXT');
        const sessionPathTEXT = basePath + 's_' + nSesid + '.TXT';

        if (!cPath || !cTransid) return this.logError('Missing cPath or cTransid', cTransid);
        if (!fs.existsSync(filePath)) return this.logError(`Transcript file not found: ${filePath}`, cTransid);
        if (!fs.existsSync(jsonPath)) return this.logError(`Transcript JSON not found: ${jsonPath}`, cTransid);

        if (!body?.isIgnoreErr) {
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (!Array.isArray(jsonData) || jsonData.length === 0)
                return this.logError('Transcript JSON is empty or malformed', cTransid);

            const errors = jsonData.filter(e => e.lineno && !e.timestamp && e.linetext && !e.isIndex);
            if (errors.length > 0) {
                const errLines = errors.slice(0, 10).map(e => `Page: ${e.pageno}, Line: ${e.lineno}`).join(', ');
                const message = `Missing timestamps or text in: ${errLines}${errors.length > 10 ? `... and ${errors.length - 10} more.` : ''}`;
                return this.logError(message, cTransid);
            }
        }

        try {
            console.log(`Publishing transcript: ${PathTEXT} - ${sessionPathTEXT}`);

            fs.copyFile(PathTEXT, sessionPathTEXT, (err) => {
                if (err) throw err;
                console.log('File copied successfully');
            });

            const transferResult = await this.transferAnnotations(filePath, body.nSesid, cTransid);
            if (transferResult.msg !== 1) return this.logError('Annotation transfer failed', cTransid);


            const publishResult = await this.db.executeRef('transcript_publish', body, 'transcript');
            if (!publishResult.success) return this.logError('DB publish failed', cTransid, publishResult.error);


            this.generateUserTranscript(body, origin);
            // if (generateResult.msg !== 1) return generateResult;

            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'P', message: 'File export for users' } }
            });
            return publishResult.data[0][0];
            // return { msg: 1, value: 'Transcript published successfully' };
        } catch (err) {
            return this.logError(`Unexpected error: ${err.message}`, cTransid);
        }
    }

    async transferAnnotations(filePath: string, nSesid: string, cTransid: string): Promise<any> {
        this.log.info(`Starting annotation transfer for: ${filePath}`, this.logTag);
        const args = [
            this.config.get('PY_ANNOT_TRANSFER_BY_TRANSCRIPT'),
            nSesid,
            filePath,
            this.config.get('REALTIME_PATH'),
            this.config.get('DB_DATABASE'),
            this.config.get('DB_USERNAME'),
            this.config.get('DB_PASSWORD'),
            this.config.get('DB_HOST'),
            this.config.get('DB_PORT'),
        ];

        console.log(`\n\r\n\rTransfring annots with python \n\r\n\r ${this.config.get('pythonV')} ${args.join(' ')}`);

        return new Promise(resolve => {
            const proc = spawn(this.config.get('pythonV'), args);
            let output = '';
            proc.stdout.on('data', (data) => {
                output += data.toString()
                console.log(data.toString(), `${this.logTag}/${cTransid}`);
            });
            proc.stderr.on('data', (data) => {
                this.log.error(data.toString(), `${this.logTag}/${cTransid}`)
                console.error(data.toString(), `${this.logTag}/${cTransid}`)
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    this.log.info('Annotation transfer complete', `${this.logTag}/${cTransid}`);
                    resolve({ msg: 1 });
                } else {
                    this.log.error(`Python exited with code ${code}`, `${this.logTag}/${cTransid}`);
                    resolve({ msg: -1 });
                }
            });
        });
    }

    async generateUserTranscript(body: any, origin: string) {
        const { nSesid, cTransid, nMasterid, nCaseid } = body;
        const usersResult = await this.db.executeRef('teams_users', { nCaseid }, 'transcript');
        const formResult = await this.db.executeRef('get_transcript_detail', body, 'transcript');
        let formData = formResult.data[0][0];
        formData.cPath = nSesid ? `s_${nSesid}.json` : formData.cPath;
        // const lines = await this.transService.getTranscriptFiledata({ cPath: formData.cPath });
        console.log('\n\r\n\r\n\r\n\r\n\rPUBLUIC PATH TRANS', formData.cPath)
        let pages = await this.transService.getTranscriptFiledata({ cPath: formData.cPath });
        const lines = this.transformPagesToLines(pages)
        const theme = formData.cThemeid ? await this.transService.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid }) : {};

        try {
            const results: any[] = [];
            const users =  usersResult.data[0];

            for (let index = 0; index < users.length; index++) {
                const user = users[index];

                // if (user.nUserid === '473738f5-6653-4ecd-b917-ee76a1f9ca25') {
                    // Optional delay between each execution
                    // await new Promise(res => setTimeout(res, 500));

                    this.emitMsg({
                        event: 'PUBLISH-TRANSCRIPT',
                        data: {
                            identifier: '',
                            nMasterid,
                            data: {
                                status: 'P',
                                message: `User ${index + 1}/${users.length}`
                            }
                        }
                    });

                    console.log(`user ${user.nUserid} for detail generation index ${index}`);

                    const output = `doc/case${body.nCaseid}`
                    body['bQmark'] = true;
                    body['bQfact'] = true;
                    const detailRes = await this.generateTranscriptDetail(
                        body, formData, lines, theme, user.nUserid, index, origin, output
                    );

                    if (detailRes.msg === -1) {
                        this.log.error(
                            `generateTranscriptDetail failed for user ${user.nUserid}: ${detailRes.value}`,
                            `${this.logTag}/${body.cTransid}`
                        );
                        results.push(detailRes); // track the error
                    } else {
                        results.push({ msg: 1 });
                    }
                // } else {
                //     results.push({ msg: 0 }); // skipped
                // }
            }

            // Check if any failed
            const anyFailed = results.some(res => res.msg === -1);
            if (anyFailed) {
                return {
                    msg: -1,
                    value: 'One or more transcript generations failed',
                    results
                };
            }

            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: {
                    identifier: '',
                    nMasterid,
                    data: {
                        status: 'S',
                        message: 'Published for all users'
                    }
                }
            });

            return { msg: 1, value: 'User transcripts generated successfully' };
        } catch (error) {
            this.log.error(`Error generating user transcripts: ${error.message}`, `${this.logTag}/${cTransid}`);


            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: {
                    identifier: '',
                    nMasterid,
                    data: {
                        status: 'F',
                        message: `Publishe Failed Error:${error.message}`
                    }
                }
            });
            return { msg: -1, value: `Error generating user transcripts: ${error.message}` };
        }

    }

    async generateTranscriptDetail(body, formData, lines, theme, nUserid: string, index: number, origin: string, output: string, isSubmit: boolean = true): Promise<any> {
        debugger;

        console.log(`Generating transcript detail for user ${nUserid} with index ${index}`);

        const summaryOfAnnots = [];
        const summaryOfHihglights = [];


        try {

            const dt_ant = await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: body.nCaseid, ref: 2, nUserid: nUserid, nSesid: body.nSesid || body.nSessionid, cTranscript: body.cTranscript || 'Y', isAnnotations: body.bQfact, isHighlight: body.bQmark, jHIssues: body.jHIssues || [], jIssues: body.jIssues || [] });


            if (dt_ant?.data?.length) {
                if (dt_ant.data[0].length && body.bQfact) {

                    const issues = [];
                    summaryOfAnnots.push({ title: 'Q fact', data: dt_ant.data[0]?.filter(e => e.pageIndex || e.cPageno) || [] });
                }

                if (dt_ant.data[1].length && body.bQmark) {

                    const groupData = [];

                    dt_ant.data[1].filter(e => e.cPageno || e.pageIndex).forEach((item) => {
                        const idx = groupData.findIndex(a => a.nGroupid == item.nGroupid);
                        if (idx > -1) {
                            groupData[idx].data.push(item);
                        } else {
                            groupData.push({ nGroupid: item.nGroupid, data: [item] });
                        }
                    })
                    summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
                }
            }

        } catch (error) {
        }
        let query = {
            nUserid: nUserid,
            nCaseid: body.nCaseid,
            cPath: body.cPath,
            nSessionid: body.nSesid || body.nSessionid,
            bQfact: true,
            bQmark: true,
            jHIssues: body.jHIssues || [],
            jIssues: body.jIssues || [],
            cTranscript: body.cTranscript || 'Y',
        }
        query['ref'] = 2;
        const res = await this.db.executeRef('realtime_get_issue_annotation_highlight_export', query);
        if (res.success) {



            try {
                if (res.data.length) {

                    const issuedetails = res.data.length > 0 && body.bQfact ? res.data[0] : [];
                    const finalIssueDetail = [];
                    try {
                        for (let x of issuedetails) {
                            // if (x.nIDid == '2b6a879e-720c-4638-bdfe-ad7660de026e') {
                            // 25 
                            if (x.cordinates && x.cordinates.length) {
                                console.log(`step -0.2. :nIDid = ${x.nIDid}`);
                                // const pages = [...new Set(x.cordinates.map(a => a.p) || [])];
                                // for (let p of pages) {
                                //     obj = { ...x }
                                // console.log('Page Index:', p);
                                const cordinates = x.cordinates //.filter(a => a.p == p);
                                // obj.pageIndex = p;
                                if ((body.cProtocol || 'C') == 'B') {
                                    try {
                                        for (let rect of cordinates) {
                                            const [hh, mm, ss] = rect.t.split(':');
                                            const timestamp = [
                                                hh.padStart(2, '0'),
                                                mm.padStart(2, '0'),
                                                ss.padStart(2, '0')
                                            ].join(':');

                                            const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : body?.cTranscript == 'Y' ? a.lineno == rect.l : true));
                                            // const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : true));

                                            if (lnInd > -1) {
                                                rect.l = lines[lnInd].lineno;
                                                rect.p = lines[lnInd].pageno;
                                            }
                                        }
                                    } catch (error) {
                                        console.error('update line error - ', error)
                                    }
                                }
                                // console.log('Cordinates:', cordinates);
                                const pages = [...new Set(cordinates.map(a => a.p) || [])];
                                for (let p of pages) {
                                    const obj = { ...x }
                                    obj.pageIndex = p;
                                    obj.cordinates = cordinates.filter(a => a.p == p);
                                    finalIssueDetail.push({ ...obj });
                                }
                                // }
                            }
                            // }
                        }
                    } catch (error) {
                        console.error('cordinate error', error)
                    }

                    // console.log(finalIssueDetail, issuedetails.length);


                    let updatedCordinats = [];
                    try {
                        updatedCordinats = this.updateCordinates(lines, (finalIssueDetail), body);
                    } catch (error) {
                        console.error('Error updating coordinates:', error);
                        updatedCordinats = [];
                    }


                    res.data[0] = updatedCordinats;

                    try {
                        if (res.data[1].length) {
                            for (let rect of res.data[1]) {
                                // console.log(rect)
                                const [hh, mm, ss] = rect.cTime.split(':');
                                const timestamp = [
                                    hh.padStart(2, '0'),
                                    mm.padStart(2, '0'),
                                    ss.padStart(2, '0')
                                ].join(':');
                                // const lnInd = lines.findIndex(a => a?.timestamp == timestamp && (a?.unicid == rect?.identity || body?.cTranscript));
                                const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid && body?.cTranscript != 'Y' ? (a?.unicid == rect?.identity) : body?.cTranscript == 'Y' ? a.lineno == rect.cLineno : true));

                                if (rect.nHid == '89a8029e-e0e2-4175-8855-ac790b266370') {
                                    console.log('\n\r\n\r\n\r\n\r\n\r\n\r HIGHLIGH TRANSFRING');

                                    const lineFind = lines.find(a => a.timestamp == timestamp && (a?.unicid && body?.cTranscript != 'Y' ? (a?.unicid == rect?.identity) : body?.cTranscript == 'Y' ? a.lineno == rect.cLineno : true));
                                    console.log('Line', lineFind);
                                }
                                if (lnInd > -1) {
                                    rect.cLineno = lines[lnInd].lineno;
                                    rect.cPageno = lines[lnInd].pageno;
                                    
                                }
                                // console.log(rect)
                            }
                        }
                    } catch (error) {

                    }
                }
            } catch (error) {

            }
            // console.log('body', body);
            const html = this.htmlService.generateHtml(formData, lines, theme, 'FST', origin, true, body, res.data, summaryOfAnnots, summaryOfHihglights, isSubmit);
            const htmlFile = `t_${formData.cTransid}_${index}.html`;
            const pdfFile = `t_${formData.cTransid}_${index}.pdf`;
            await this.transService.savehtmlToFile(html, htmlFile);

            // return { msg: 1, value: `Transcript detail generated for user ${nUserid}` };

            const outputDir = resolve(this.config.get('ASSETS'), output);
            if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = resolve(outputDir, pdfFile);
            let cPgsize = 'A4';
            if (isSubmit) {
                cPgsize = (body.cPgsize ? body.cPgsize : 'A4')
            }
            const pdfGenerated = await this.generatePdf(`${this.config.get('REALTIME_PATH')}exports/${htmlFile}`, outputPath, cPgsize);

            if (!pdfGenerated) {
                fs.unlinkSync(`${this.config.get('REALTIME_PATH')}exports/${htmlFile}`); // Delete the HTML file after PDF generation
                this.logError('PDF generation failed', formData.cTransid);
                return { msg: -1, value: 'PDF generation failed' };
            }

            if (isSubmit) {
                const validation: FileValidateResponse = await this.verifier.verifyFile(outputPath);
                const stats = await fs.promises.stat(outputPath);
                const fileMeta = {
                    nSesid: body.nSesid || body.nSessionid,
                    nCaseid: body.nCaseid,
                    nUserid,
                    cPath: `${output}/${pdfFile}`,
                    cName: `${formData.cCDay}.pdf`,
                    cPage: `1-${validation.totalpages}`,
                    cFilesize: stats.size,
                };

                const dbRes = await this.db.executeRef('transcript_insert_file', fileMeta, 'transcript');
                console.log(`dbRes ${JSON.stringify(dbRes)}`);
                if (dbRes) await this.copier.copyFile(fileMeta.cPath, dbRes.data[0][0].nBundledetailid);
                return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, data: dbRes };
            } else {
                return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, path: `${pdfFile}`, name: 'export.pdf' };
            }
            // return { msg: 1, value: `Transcript detail generated for user ${nUserid}` };
        }
        else {
            return { msg: -1, value: 'Failed to handle realtime_filter_last_issue', error: res.error };
        }
    }


    // async generatePdf(inputHtmlPath: string, outputPdfPath: string, cPgsize: any): Promise<boolean> {
    //     try {
    //         if (!fs.existsSync(inputHtmlPath)) return false;

    //         // if (!this.browser) {
    //         const browser = await puppeteer.launch({
    //             headless: true,
    //             args: [
    //                 '--no-sandbox',
    //             ],
    //             timeout: 1000,
    //             protocolTimeout: 120_000
    //         });
    //         // }

    //         const page = await browser.newPage();
    //         // const fileUrl = `file://${inputHtmlPath}`;
    //         const fileUrl = `file://D:/api/etabella-nestjs/${inputHtmlPath}`;
    //         // const fileUrl = `file://C:/project/etabella-nestjs/${inputHtmlPath}`;
    //         await page.goto(fileUrl);

    //         await page.pdf({ path: outputPdfPath, format: (cPgsize ? cPgsize : 'A4'), printBackground: false });
    //         await page.close(); // ✅ only close the page, not the browser
    //         // unsync html file deletion
    //         fs.unlinkSync(inputHtmlPath); // Delete the HTML file after PDF generation
    //         await browser.close();
    //         return true;
    //     } catch (err) {
    //         this.log.error(`PDF generation error: ${err}`, this.logTag);
    //         return false;
    //     }
    // }



    async generatePdf(inputHtmlPath: string, outputPdfPath: string, cPgsize: any): Promise<boolean> {
        // 1. Turn your (possibly relative) inputHtmlPath into an absolute path
        const htmlAbsolutePath = path.resolve(inputHtmlPath);

        // 2. Convert backslashes to forward‐slashes, and prefix with three slashes
        const fileUrl = 'file:///' + htmlAbsolutePath.split(path.sep).join('/');
        if (!fs.existsSync(htmlAbsolutePath)) {
            this.log.error(`HTML file not found: ${htmlAbsolutePath}`, this.logTag);
            return false;
        }

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
            timeout: 1000,
            protocolTimeout: 120000
        });

        const page = await browser.newPage();
        // wait until everything’s loaded (you can adjust waitUntil if needed)
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });

        await page.pdf({
            path: outputPdfPath,
            format: cPgsize || 'A4',
            printBackground: true,   // often better to include backgrounds
        });

        await page.close();
        // fs.unlinkSync(htmlAbsolutePath);  // remove the HTML
        await browser.close();
        return true;
    }

    emitMsg(value: any) {
        this.kafka.sendMessage('realtime-response', value);
    }

    logError(message: string, transid?: string, error?: any) {
        this.log.error(`${message}${error ? ` | ${error}` : ''}`, `${this.logTag}/${transid || 'unknown'}`);
        return { msg: -1, value: message, error: error || message };
    }



    updateCordinates(data, res, body) {

        try {

            let Adata = []
            const heighlightData: any = res// [];
            const newdata: any = []
            heighlightData.forEach(e => {
                console.log(`step 0. ${e.nIDid}.`);
                // const pg = e.pageIndex;
                debugger;
                const pgData = data //.filter(a => a.pageno == pg);
                // console.log('pgData', pgData[0])
                if (e.cordinates) {
                    let searchLine;
                    const length = e.cordinates.length;
                    let i = 0;
                    e.cordinates.forEach((c, index) => {
                        try {
                            i++;
                            // console.log('Cordinate:', c,pg,data.length,pgData[c.l - 1]);
                            const [hh, mm, ss] = c.t.split(':');
                            const timestamp = [
                                hh.padStart(2, '0'),
                                mm.padStart(2, '0'),
                                ss.padStart(2, '0')
                            ].join(':');
                            const lnInd = pgData.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == c?.identity) : body?.cTranscript == 'Y' ? a.lineno == c.l : true));
                            // const lnInd = pgData.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == c?.identity) : true));
                            if (lnInd > -1) {
                                const line = pgData[lnInd].linetext || '';
                                let startIndex = 0, endIndex = 0;
                                if (index > 0 && (length - 1) > index) {
                                    startIndex = 0;
                                    endIndex = line.length;
                                } else {
                                    searchLine = c.text || this.getLineText(e.cONote, index) || '';
                                    console.log(`step 1.${i}. Search Line: ${searchLine}`);
                                    ({ startIndex, endIndex } = this.utilityService.findIndices(searchLine, line));
                                }
                                if (index == 0 && length > 1) {
                                    endIndex = line.length;
                                }
                                if ((length - 1) == index && length > 1) {
                                    startIndex = 0;
                                }

                                c.startIndex = startIndex;
                                c.endIndex = endIndex;
                                if (!c.text) {
                                    c.text = searchLine
                                }
                            } else {
                                c.startIndex = 0;
                                c.endIndex = 0;
                            }
                        } catch (error) {
                            console.error('Error in updateCordinates:', error)
                        }
                    })
                }
            })
            return heighlightData;
        } catch (error) {
            console.error('Error in updateCordinates:', error);
            return res;

        }
    }


    getLineText(note, index) {
        try {
            note = note || '';
            note = this.replaceDoubleNewlines(note);
            return note.split('\n')[index];
        } catch (error) {
            return '';
        }
    }

    replaceDoubleNewlines(input) {
        return input.replace(/\n\n/g, '\n');
    }


    async getAnnotHighlightExport(query: getAnnotHighlightEEP, origin: string): Promise<any> {
        const res = await this.db.executeRef('get_transcript_by_sesid', query, 'transcript');
        if (res.success) {
            try {
                if (res.data[0][0].msg == 1) {
                    query['cTransid'] = res.data[0][0].cTransid;
                    query['cProtocol'] = res.data[0][0].cProtocol || 'C';
                    // console.log(JSON.stringify(query))
                    const result = await this.getExportDataTranscript(query, origin)
                    return result;
                } else if (query.cTranscript != 'Y' || query.cIsDemo == 'Y') {
                    query['cProtocol'] = res.data[0][0].cProtocol || 'C';
                    query['cTransid'] = '39ce7608-e7ed-46e2-995c-bac91732e6fc';
                    const result = await this.getExportDataTranscript(query, origin)
                    return result;
                } else {
                    return res.data[0][0]
                }

            } catch (error) {
                console.log('Error ', error)
                return { msg: -1, value: 'Failed to export', error: error };
            }
        } else {
            return { msg: -1, value: 'Failed to export', error: res.error };
        }
    }



    async getExportDataTranscript(body: any, origin: string): Promise<any> {
        const { nSesid, cTransid, nMasterid, nCaseid } = body;
        const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: body.nCaseid, nSesid: body.nSessionid });
        const formResult = await this.db.executeRef('get_transcript_detail', body, 'transcript');
        let formData = formResult.data[0][0];
        formData.cPath = formResult.data[0][0]?.nSesid ? `s_${formResult.data[0][0]?.nSesid}.json` : formData.cPath;
        let lines: any;
        let rawData;
        let data;


        const otherCaseData = caseData.data[0][0];
        if (body.cTranscript == 'Y') {
            let pages = await this.transService.getTranscriptFiledata({ cPath: formData.cPath });
            lines = this.transformPagesToLines(pages)
            // console.log('lines',lines)
        } else if (body.cIsDemo == 'Y') {
            body['otherCaseData'] = otherCaseData
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');

            data = JSON.parse(rawData);
            lines = this.convertTranscript(data)
        } else {
            body['otherCaseData'] = otherCaseData
            if (otherCaseData.cStatus == 'R') { //&& otherCaseData.cProtocol == 'B'
                const output = await this.syncFeedToOffline(otherCaseData.nSesid);
                lines = this.convertTranscript(output)
            } else {
                const inputDir = path.join('data', `dt_${body.nSessionid}`)// path.join(__dirname, (process.env.NODE_ENV == 'production' ? '../../data/' : '../../../data/'), 'dt_' + query.nSessionid);
                console.log('PROCESS DIRE', inputDir)
                const output = this.conversion.processDirectory(inputDir);
                lines = this.convertTranscript(output)

            }
        }

        const theme = formData.cThemeid ? await this.transService.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid }) : {};
        console.log('Step 1')
        try {
            const output = `realtime-transcripts/exports/`
            const detailRes = await this.generateTranscriptDetail(
                body, formData, lines, theme, nMasterid, nMasterid, origin, output, false
            );

            if (detailRes.msg === -1) {
                console.log('Export failed', detailRes)
                return { msg: -1, value: 'Export failed', };
            } else {
                return detailRes;
            }
        } catch (error) {
            return { msg: -1, value: `Error generating user transcripts: ${error.message}` };
        }

    }

    convertTranscript(pages) {
        const result = [];

        pages.forEach(pageObj => {
            const pageNum = pageObj.page;

            pageObj.data.forEach(lineObj => {
                // extract and format the timestamp (drop the last “frames” part)
                const [hh, mm, ss] = lineObj.time.split(':');
                const timestamp = [
                    hh.padStart(2, '0'),
                    mm.padStart(2, '0'),
                    ss.padStart(2, '0')
                ].join(':');

                // join multiple lines into one string (you could also keep them separate)
                const linetext = lineObj.lines.join(' ');

                result.push({
                    lineno: lineObj.lineIndex,
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid,

                });
            });
        });

        return result;
    }



    async syncFeedToOffline(nSesid: string): Promise<any> {
        const feedData = []
        try {
            const sessionId = nSesid;
            try {
                const sessionData = await this.feedData.readSessionData(sessionId);
                const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))

                if (!pages?.length) return;

                for (let x of pages) {
                    const pg = Number(x[0]);
                    const pageData = x[1] || [];
                    const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }))
                    feedData.push({ msg: pg, page: pg, data: frmtData });
                }

            } catch (error) {
                console.error('error - ', error);
            }

            return feedData.sort((a, b) => a.page - b.page);

        } catch (error) {
            console.error('error - ', error);
            return feedData;
        }
    }

    toTimestamp(hmsLike) {
        const parts = String(hmsLike ?? '').split(':');
        const [hh = '0', mm = '0', ss = '0'] = parts; // ignores frames if present
        const pad2 = v => String(v).padStart(2, '0');
        return [pad2(hh), pad2(mm), pad2(ss)].join(':');
    }

    /** Join a line array into one string, normalizing whitespace. */
    joinLines(lines) {
        if (Array.isArray(lines)) {
            return lines.join(' ').replace(/\s+/g, ' ').trim();
        }
        return String(lines ?? '').replace(/\s+/g, ' ').trim();
    }

    /**
     * Core transformer: pages[] -> result[]
     */
    transformPagesToLines(pages) {
        const result = [];

        (pages || []).forEach(pageObj => {
            const pageNum = pageObj.page; // use your exact field name

            (pageObj.data || []).forEach((lineObj,index) => {
                // extract and format the timestamp (drop the last “frames” part)
                const timestamp = this.toTimestamp(lineObj.time);

                // join multiple lines into one string
                const linetext = this.joinLines(lineObj.lines);

                result.push({
                    lineno: index + 1, //  lineObj.lineIndex,
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid ?? null,
                });
            });
        });

        return result;
    }

}
