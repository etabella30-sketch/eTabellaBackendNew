// Refactored TranscriptpublishService with better logging, error handling, and cleaner structure
import {
    Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { TranscriptHtmlService } from './transcript-html.service';
import { TranscriptService } from './transcript.service';
import * as fs from 'fs';
import { resolve } from 'path';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { UtilityService } from '../../utility/utility.service';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { SessionService } from '../../session/session.service';
import { getAnnotHighlightEEP } from '../../interfaces/issue.interface';
import { QueryService } from '../query/query.services';

import { promises as fsPromises } from 'fs';
import { FeedDataTranscript } from '../../interfaces/Transcript.interface';
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
        private readonly utilityService: UtilityService, // Assuming utilityService is defined elsewhere
        private conversion: ConversionJsService,
        private readonly dbLite: SqllitedbService,
        private session: SessionService,
        private readonly queryService: QueryService,
    ) { }


    async generateTranscriptDetail(body, formData, lines, theme, nUserid: string, index: number, origin: string, output: string, isSubmit: boolean = true, jPages: number[]): Promise<any> {
        debugger;

        console.log(`Generating transcript detail for user ${nUserid} with index ${index}`);
        const isPageRange = jPages?.length > 0;

        const summaryOfAnnots = [];
        const summaryOfHihglights = [];


        try {

            const dt_ant = await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: body.nCaseid, ref: 2, nUserid: nUserid, nSesid: body.nSesid || body.nSessionid, cTranscript: body.cTranscript || 'Y', isAnnotations: body.bQfact, isHighlight: body.bQmark, jHIssues: body.jHIssues || [], jIssues: body.jIssues || [] });


            if (dt_ant?.data?.length) {
                if (dt_ant.data[0].length && body.bQfact) {



                    try {
                        dt_ant.data[0].forEach(a => {
                            if (a.jCordinates?.length) {
                                a.cONote = a.jCordinates.map(a => a.text).join(' \n');
                            }
                        })
                    } catch (error) {

                    }


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
            lines = this.convertDraft(lines)
            const filterd_highlights = [];
            const qMarks = [];

            try {
                if (res.data.length) {

                    const issuedetails = res.data.length > 0 && body.bQfact ? res.data[0] : [];
                    const finalIssueDetail = [];
                    try {
                        for (let x of issuedetails) {
                            // if (x.nIDid == '2b6a879e-720c-4638-bdfe-ad7660de026e') {
                            // 25 
                            if (x.cordinates && x.cordinates.length) {
                                // console.log(`step -0.2. :nIDid = ${x.nIDid}`);
                                // const pages = [...new Set(x.cordinates.map(a => a.p) || [])];
                                // for (let p of pages) {
                                //     obj = { ...x }
                                // console.log('Page Index:', p);
                                const cordinates = x.cordinates //.filter(a => a.p == p);
                                // obj.pageIndex = p;
                                if ((body.cProtocol || 'C') == 'B') {
                                    try {
                                        let index = 0;
                                        let lnInd = 0;
                                        for (let rect of cordinates) {
                                            const [hh, mm, ss] = rect.t.split(':');
                                            const timestamp = [
                                                hh.padStart(2, '0'),
                                                mm.padStart(2, '0'),
                                                ss.padStart(2, '0')
                                            ].join(':');
                                            lnInd = lines.findIndex(a => a.timestamp == timestamp && a?.unicid == rect?.identity);

                                            if (lnInd == -1) {
                                                lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : true));
                                            }
                                            if (lnInd > -1) {
                                                try {
                                                    if (index == 0) {
                                                        // if (x.nIDid == '43eed774-634e-466f-8cce-d8e1ac9d595b')
                                                        //     console.log(`step - 0.1.${index} :nIDid = ${x.nIDid}`, rect, lines[lnInd].lineno);
                                                        rect.l = lines[lnInd].lineno;
                                                    } else {
                                                        // if (x.nIDid == '43eed774-634e-466f-8cce-d8e1ac9d595b')
                                                        //     console.log(`step - 0.2.${index} :nIDid = ${x.nIDid}`, rect, lines[lnInd].lineno);
                                                        if (cordinates[index - 1]?.l == lines[lnInd].lineno) {
                                                            rect.l = lines[lnInd].lineno + 1;
                                                        } else {
                                                            rect.l = lines[lnInd].lineno;
                                                        }
                                                        // console.log(`step - 0.2.${index} :nIDid = ${x.nIDid}`, rect?.l, lines[lnInd].lineno,'line - ',cordinates[index - 1]?.l,cordinates[index - 1]?.l == lines[lnInd].lineno);
                                                    }
                                                } catch (error) {
                                                    console.error('Error updating line - ', error);
                                                    rect.l = lines[lnInd].lineno;
                                                }
                                                rect.p = lines[lnInd].pageno;
                                            }
                                            index++;
                                        }
                                    } catch (error) {
                                        console.error('update line error - ', error)
                                    }
                                }
                                // console.log('Cordinates:', cordinates);
                                const pages = [...new Set(cordinates.map(a => a.p) || [])];

                                if (jPages?.length && !jPages.includes(Number(pages[0]))) continue;
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

                    }



                    // console.log(`step - 0.1. . finalIssueDetail ${finalIssueDetail}`);
                    const updatedCordinats = this.updateCordinates(lines, (finalIssueDetail), body);


                    res.data[0] = updatedCordinats;
                    let annothighlight = []
                    try {

                        debugger;
                        if (res.data[1].length) {

                            for (let rect of res.data[1]) {
                                // if (rect.nHid == '3c5cb854-d597-4fe5-bb8f-cb23b7af889a') {
                                // console.log(`step - 0.3. :nIDid = ${rect.nIDid}`);
                                // if(rect.cPageno =='12' && rect.cTime.substring(0, 5) =='10:06')
                                // console.log('sadfasd',rect,rect.cTime)


                                if ((body.cProtocol || 'C') == 'B') {
                                    const [hh, mm, ss] = rect.cTime.split(':');
                                    const timestamp = [
                                        hh.padStart(2, '0'),
                                        mm.padStart(2, '0'),
                                        ss.padStart(2, '0')
                                    ].join(':');
                                    // const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity || body.cTranscript == 'T') : true));

                                    // const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : true));
                                    const lnInd = lines.findIndex(a => a.timestamp == timestamp && ((a?.unicid == rect?.identity)));
                                    // console.log('Line Index:', lnInd, 'Timestamp:', timestamp, 'Rect:', rect, lines[lnInd]);
                                    if (lnInd > -1) {

                                        rect.cLineno = lines[lnInd].lineno.toString();
                                        rect.cPageno = lines[lnInd].pageno.toString();

                                        if (jPages?.length && !jPages.includes(Number(rect.cPageno))) continue;

                                        filterd_highlights.push(rect);
                                        // annothighlight.push(...rect)
                                    } else {
                                        rect.cLineno = -1;
                                    }

                                }

                                if (jPages?.length && !jPages.includes(Number(rect.cPageno))) continue;
                                qMarks.push(rect);
                                // console.log('Line:', lines[lnInd]);
                                // console.log(rect)
                                // }
                            }
                        }
                        // res.data[1] = annothighlight
                    } catch (error) {
                        console.error('\n\r\n\r\n\r\n\r ERROR ', error)
                    }
                }



            } catch (error) {

            }

            // console.log('filterd_highlights', filterd_highlights)
            // const isExists = filterd_highlights.find(a => a.nHid == '275fe2aa-d713-4962-9261-ee4450c342a9');
            // if (isExists)
            //     console.log('\n\r\n\r\n\r\n\rEXISTS ', isExists)

            const html = this.htmlService.generateHtml(formData, lines, theme, 'FST', origin, true, body, [res.data[0], filterd_highlights], summaryOfAnnots, summaryOfHihglights, isSubmit, jPages);
            const htmlFile = `t_${formData.cTransid}_${index}.html`;
            const pdfFile = `t_${formData.cTransid}_${index}.pdf`;
            await this.transService.savehtmlToFile(html, htmlFile);
            console.log(`HTML file saved as ${htmlFile}`);
            // return { msg: 1, value: `Transcript detail generated for user ${nUserid}` };

            // const outputDir = resolve(this.config.get('ASSETS'), output);
            const outputDir = './public';
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
            console.log('File generated successfully')
            return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, path: `${pdfFile}`, name: 'export.pdf' };
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


    logError(message: string, transid?: string, error?: any) {
        this.log.error(`${message}${error ? ` | ${error}` : ''}`, `${this.logTag}/${transid || 'unknown'}`);
        return { msg: -1, value: message, error: error || message };
    }

    convertToFrameWithoutNanoSec(timestamp) {
        // console.log(timestamp);
        if (!timestamp) return '';
        // Convert the timestamp into frames (assuming 30 frames per second)
        const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
        return ((hours * 3600 + minutes * 60 + seconds) * 30);
    }


    /* updateCordinates(data, res, body) {
 
         try {
 
             let Adata = []
             const heighlightData: any = res// [];
             const newdata: any = []
             heighlightData.forEach(e => {
                 const pgData = data //.filter(a => a.pageno == pg);
                 if (e.cordinates) {
                     let searchLine;
                     const length = e.cordinates.length;
                     let i = 0;
                     let lnInd = 0;
                     e.cordinates.forEach((c, index) => {
                         try {
                             i++;
 
                             const timestamp = this.convertToFrameWithoutNanoSec(c.t);
 
 
                             c.startIndex = 0;
                             c.endIndex = 0;
 
                             if (index > 0 && length > 1 && (length - 1) != index) {
                                 lnInd++;
                                 const line = pgData[lnInd].linetext || '';
                                 c.startIndex = 0;
                                 c.endIndex = line.length;
                             } else {
                                 lnInd = pgData.findIndex(a => this.convertToFrameWithoutNanoSec(a.timestamp) == timestamp && a?.unicid == c?.identity);
                                 if (lnInd == -1) {
                                     lnInd = pgData.findIndex(a => this.convertToFrameWithoutNanoSec(a.timestamp) == timestamp && (a?.unicid ? (a?.unicid == c?.identity) : true));
                                 }
                                 if (lnInd > -1) {
                                     const line = pgData[lnInd].linetext || '';
                                     let startIndex = 0, endIndex = 0;
                                     if (index > 0 && (length - 1) > index) {
                                         startIndex = 0;
                                         endIndex = line.length;
                                     } else {
                                         searchLine = c.text || this.getLineText(e.cONote, index) || '';
                                         // console.log(`step 1.${i}. Search Line: ${searchLine}`);
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
                                 }
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
     }*/


    // local equivalents of your start/end conditions, using pgData's shape
    /*  startConditionLine(x , firstCprdinate , deep = true) {
          const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
          const xTime = t2f(x.timestamp);
          const fTime = t2f(firstCprdinate.t);
  
          const xUid = x?.unicid;
          const fUid = firstCprdinate?.identity;
  
          if (deep) {
              return xTime >= fTime && (!xUid || Number(xUid) >= Number(fUid));
          } else {
              return xTime == fTime && (!xUid || Number(xUid) == Number(fUid));
          }
      }
  
      endConditionLine(x , endCordinate , deep = true) {
          const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
          const xTime = t2f(x.timestamp);
          const eTime = t2f(endCordinate.t);
  
          const xUid = x?.unicid;
          const eUid = endCordinate?.identity;
  
          if (deep) {
              return eTime >= xTime && (!xUid || Number(eUid) >= Number(xUid));
          } else {
              return eTime == xTime && (!xUid || Number(eUid) == Number(xUid));
          }
      }*/
    startCorditionIndex(firstCprdinate, pgData: { unicid: string, timestamp: string }[]): number {
        const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
        const fTime = t2f(firstCprdinate.t);
        const fUid = Number(firstCprdinate?.identity);
        let ind = pgData.findIndex(a => t2f(a.timestamp) == fTime && (!a.unicid || Number(a.unicid) == fUid));
        if (ind == -1) {
            ind = pgData.findIndex(a => t2f(a.timestamp) >= fTime && (!a.unicid || Number(a.unicid) >= fUid));
        }
        return ind;
    }

    endCorditionIndex(endCordinate, pgData: { unicid: string, timestamp: string }[]): number {
        const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
        const eTime = t2f(endCordinate.t);
        const eUid = endCordinate?.identity;
        let ind = pgData.findIndex(a => eTime == t2f(a.timestamp) && (!a.unicid || eUid == Number(a.unicid)));
        if (ind == -1) {
            ind = pgData.findIndex(a => eTime >= t2f(a.timestamp) && (!a.unicid || eUid >= Number(a.unicid)));
        }
        return ind;
    }

    updateCordinates(data, res, body) {
        try {
            const heighlightData = res;
            heighlightData.forEach(e => {
                const pgData = data;
                if (!e.cordinates || !e.cordinates.length) return;

                // first/last coordinates from the highlight
                const crd = e.cordinates // (e.ORGCordinates || e.cordinates);
                const firstC = crd[0];
                const lastC = crd[crd.length - 1];
                const isSingleLine = crd?.length == 1;
                // collect all pgData lines between first..last using your start/end logic (deep)
                const expanded = [];


                const firstCordinateIndex = this.startCorditionIndex(firstC, pgData);
                const endCordinateIndex = this.endCorditionIndex(lastC, pgData);

                if (firstCordinateIndex == -1 || endCordinateIndex == -1) return;
                for (let i = 0; i < pgData.length; i++) {
                    const line = pgData[i];

                    if (i >= firstCordinateIndex && endCordinateIndex >= i) {
                        const fullText = line.linetext || '';
                        let annotText = fullText;
                        let startIndex = 0;
                        let endIndex = 0;
                        let indexUpdate = false;


                        if (firstCordinateIndex == i) {
                            annotText = firstC.text ?? fullText;
                            const lineText = line.linetext || '';
                            const searchResult = this.utilityService.findIndices(annotText, lineText)
                            startIndex = searchResult.startIndex;
                            endIndex = isSingleLine ? searchResult.endIndex : (lineText).length;
                            indexUpdate = true;
                        }

                        if (endCordinateIndex == i) {
                            annotText = lastC.text ?? fullText;
                            const lineText = line.linetext || '';
                            const searchResult = this.utilityService.findIndices(annotText, lineText)
                            startIndex = isSingleLine ? searchResult.startIndex : 0;
                            endIndex = searchResult.endIndex;
                            indexUpdate = true;
                        }

                        if (!indexUpdate) {
                            startIndex = 0;
                            endIndex = (annotText ?? fullText).length;
                        }
                        expanded.push({
                            t: line.timestamp,
                            identity: line.unicid,
                            x: 0,
                            y: 0,
                            width: 20,
                            height: 22,
                            l: line.lineno,
                            p: line.pageno,
                            text: annotText,
                            startIndex,
                            endIndex
                        });


                    }



                    /* if (this.startConditionLine(line, firstC, true) && this.endConditionLine(line, lastC, true)) {
                         const fullText = line.linetext || '';
                         let annotText = fullText;
                         let startIndex = 0;
                         let endIndex = 0;
                         let indexUpdate = false;
 
 
                         if (this.startConditionLine(line, firstC, false)) {
                             annotText = firstC.text ?? fullText;
                             const lineText = line.linetext || '';
                             const searchResult = this.utilityService.findIndices(annotText, lineText)
                             startIndex = searchResult.startIndex;
                             endIndex = isSingleLine ? searchResult.endIndex : (lineText).length;
                             indexUpdate = true;
                         }
 
                         if (this.endConditionLine(line, lastC, false)) {
                             annotText = lastC.text ?? fullText;
                             const lineText = line.linetext || '';
                             const searchResult = this.utilityService.findIndices(annotText, lineText)
                             startIndex = isSingleLine ? searchResult.startIndex : 0;
                             endIndex = searchResult.endIndex;
                             indexUpdate = true;
                         }
 
                         if (!indexUpdate) {
                             startIndex = 0;
                             endIndex = (annotText ?? fullText).length;
                         }
                         expanded.push({
                             t: line.timestamp,
                             identity: line.unicid,
                             x: 0,
                             y: 0,
                             width: 20,
                             height: 22,
                             l: line.lineno,
                             p: line.pageno,
                             text: annotText,
                             startIndex,
                             endIndex
                         });
 
 
                     }*/
                }
                // console.log('OldCORDINATES \n\r\n\r', e.cordinates)

                // if we found a contiguous set, replace; otherwise keep original coordinates untouched
                if (expanded.length) {
                    e.cordinates = expanded;
                    // console.log('New Cordinates \n\r\n\r', e.cordinates);
                }


                if (e.nIDid == '24a4aec9-2ba9-47f1-bcb9-62cf12be0649')
                    console.log('\n\r\n\r\n\r\n\rANNOT ORG\n', e.cordinates, '\nEXPANDED \n', expanded)
            });


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
        const { nSesid, cTransid, nUserid, nCaseid, jPages } = body;
        const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: body.nCaseid, nSesid: body.nSessionid });
        const formResult = await this.db.executeRef('get_transcript_detail', body, 'transcript');
        const formData = formResult.data[0][0];
        let lines: any;
        let rawData;
        let data;


        const otherCaseData = caseData.data[0][0];
        // console.log('otherCaseData', otherCaseData)
        if (body.cTranscript == 'Y') {
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');
            data = JSON.parse(rawData);
            lines = this.convertTranscript(data)
            // lines = await this.transService.getTranscriptFiledata({ cPath: formData.cPath });
        } else if (body.cIsDemo == 'Y') {
            // body['otherCaseData'] = otherCaseData
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');
            data = JSON.parse(rawData);
            lines = this.convertTranscript(data)
        } else {
            body['otherCaseData'] = otherCaseData
            if (otherCaseData.cStatus == 'R' || otherCaseData.cStatus == 'P') { //&& otherCaseData.cProtocol == 'B'
                lines = await this.syncFeed(otherCaseData.nSesid);
                // console.log('lines', lines)
                // lines = this.convertDraft(output)
            } else {

                const inputDir = path.join('localdata', `dt_${body.nSessionid}`)// path.join(__dirname, (process.env.NODE_ENV == 'production' ? '../../data/' : '../../../data/'), 'dt_' + query.nSessionid);
                lines = this.conversion.processDirectory(inputDir);
                // lines = this.convertDraft(output)
            }
        }

        const theme = formData.cThemeid ? await this.transService.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: nUserid }) : {};
        // console.log('Step 1')
        try {
            const output = `realtime-transcripts/exports/`
            const detailRes = await this.generateTranscriptDetail(
                body, formData, lines, theme, nUserid, nUserid, origin, output, false, jPages
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
        return pages.flatMap(pageObj => {
            const pageNum = pageObj.page;
            return pageObj.data.map((lineObj, idx) => {
                // Build HH:MM:SS timestamp (ignore any extra frames)
                // const tsParts = lineObj.time.split(':').slice(0, 3)
                //     .map(s => s.padStart(2, '0'));
                // const timestamp = tsParts.join(':');

                let timestamp = ''
                if (lineObj.time) {
                    const tsParts = lineObj.time.split(':');
                    timestamp = tsParts.slice(0, 3).map(s => s.padStart(2, '0')).join(':');
                }


                // Join all the fragments of text into one line
                const linetext = lineObj.lines.join(' ');

                return {
                    lineno: idx + 1,        // reset counter per page
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid,
                };
            });
        });
    }


    convertDraft(pages) {
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





    async syncFeed(nSesid: any): Promise<FeedDataTranscript[]> {
        let feedData = []
        try {

            feedData = await this.getFeedData(nSesid)
            return feedData;
            // return feedData.sort((a, b) => a.page - b.page);

        } catch (error) {
            this.log.report(`Error in syncFeedToOffline ${error?.message}`, this.logTag, 'E');
            console.log(error);
            return feedData;
        }
    }

    async getFeedData(nSesid): Promise<FeedDataTranscript[]> {
        const feeds = await this.readFeed(nSesid)
        if (feeds?.length) return feeds;
        const pageDataLength = 25;
        const feeddata = this.session.CurrentJob?.lineBuffer || []
        try {
            if (feeddata && feeddata.length) {
                const totalpages = Math.ceil(feeddata.length / pageDataLength);
                // for (let i = 1; totalpages >= i; i++) {
                for (let i = totalpages; i >= 1; i--) {
                    // const pageData = feeddata.slice((i - 1) * pageDataLength, i * pageDataLength);
                    const pageData = [...this.getPageData(feeddata, i, pageDataLength)];
                    try {
                        const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }))
                        feeds.push({ msg: i, page: i, data: frmtData });
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
        } catch (error) {
            console.log('Error in getFeedData', error);
        }
        return feeds;
    }

    async readFeed(nSesid): Promise<FeedDataTranscript[]> {
        const feeds = []
        try {
            const folderPath = `localdata/dt_${nSesid}`; //this.getDate()
            if (!fs.existsSync(folderPath)) return feeds;
            const files = await fsPromises.readdir(folderPath);
            try {
                files.sort((a, b) => parseInt(a.replace(/\D+/g, '')) - parseInt(b.replace(/\D+/g, '')));
            } catch (error) {

            }
            for (const file of files.reverse()) {
                const pgNo = parseInt(file.replace(/\D+/g, ''));
                const filePath = path.join(folderPath, file);
                // await this.delayFN(2000)
                try {
                    let recData = await this.processFile(filePath);
                    if (typeof recData === 'string') {
                        recData = JSON.parse(recData);
                    }
                    try {
                        const frmtData = recData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }))
                        feeds.push({ msg: pgNo, page: pgNo, data: frmtData });
                    } catch (error) {
                        console.log(error);
                    }
                } catch (error) {
                }
            }
        } catch {

        }
        return feeds;
    }


    private async processFile(filePath: string): Promise<any> {
        const data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }

    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }


}
