import { Injectable } from '@nestjs/common';
import { getAnnotHighlightEEP } from '../../interfaces/issue.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import * as fss from 'fs-extra';
import { exec, execFile } from 'child_process';
import { log } from 'console';
// import * as wkhtmltopdf from 'wkhtmltopdf';

const wkhtmltopdfPath = path.resolve('assets/libs/wkhtmltox/bin', 'wkhtmltopdf.exe');

import { promisify } from 'util';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { UtilityService } from '../../utility/utility.service';
import { exportRes } from '../../interfaces/export.interface';
import { QueryService } from '../query/query.services';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { parse, format, isValid } from 'date-fns';
import { LogService } from '@app/global/utility/log/log.service';
import { SessionStoreService } from '../session-store/session-store.service';
import { SessionService } from '../../session/session.service';
// import { SessionBackupService } from '../session-backup/session-backup.service';

// Convert exec to use promises for easier async/await syntax
const execAsync = promisify(exec);

@Injectable()
export class ExportService {
  exportPath: string = `${this.config.get('REALTIME_PATH')}exports/`;
  private readonly logApplication: string = 'realtime/export';
  constructor(private readonly utilityService: UtilityService, private config: ConfigService,
    private session: SessionService,
    private conversion: ConversionJsService, private readonly dbLite: SqllitedbService, private readonly queryService: QueryService,
    private log: LogService
    // ,private sessionStore:SessionStoreService
    //  ,private sb:SessionBackupService
  ) {
    this.intitData()
  }

  async intitData() {
    try {
      await fss.ensureDir(this.exportPath);
    } catch (error) {
    }
  }



  async getAnnotHighlightExport(query: getAnnotHighlightEEP): Promise<any> {
    const { nSessionid, nCaseid, nUserid, cTranscript = 'N', jIssues = [], jPages = [] } = query;

    const issuesJson = JSON.stringify(jIssues);
    const pagesJson = JSON.stringify(jPages);

    // First query: Issue summary details
    const { query: ref1Query } = this.queryService.getAnnotHighlightExport_RID_Query();

    const ref1Params = [
      cTranscript,
      cTranscript,
      nCaseid,
      nSessionid,
      nUserid,
      issuesJson,
      issuesJson,
      pagesJson,
      pagesJson,
    ];

    const ref1 = await this.dbLite.getCustomQuery(ref1Query, ref1Params);

    try {
      ref1.map(a => a.cordinates = (a.cordinates ? JSON.parse(a.cordinates) : []));
    } catch (error) {

    }
    // Second query: Highlights and issue groups
    const { query: ref2Query } = this.queryService.getAnnotHighlightExport_RH_Query();

    const ref2Params = [
      cTranscript,
      cTranscript,
      nSessionid,
      nUserid,
      nCaseid,
      nUserid,
      nSessionid,
      issuesJson,
      issuesJson,
      pagesJson,
      pagesJson,
    ];

    const ref2 = await this.dbLite.getCustomQuery(ref2Query, ref2Params);

    const data = await this.exportFile(query, [ref1, ref2]);
    return data;

    // return { ref1, ref2 };
  }

  async getCaseDetail(nCaseid: string, nSesid: string): Promise<any> {


    const query = this.queryService.getCaseDetail();

    // const ls = await this.dbLite.getCustomQuery(`select * from CaseDetail where nCaseid = ?`, [nCaseid]);

    // let sessionDetail = {};
    // const sd = await this.dbLite.getCustomQuery(`select * from sessions where id = ?`, [nSesid]);
    // if(sd?.length){
    //   sessionDetail = sd[0];
    // }

    let ls = await this.dbLite.getCustomQuery(query, [nSesid, nCaseid]);

    try {
      ls = ls.map(record => {
        const dStartDtStr = record.dStartDt;

        // Parse the date string. Assuming the format is 'YYYY-MM-DDTHH:MM AM/PM'
        const parsedDate = parse(dStartDtStr, "yyyy-MM-dd'T'hh:mm a", new Date());

        // Check if parsing was successful
        if (!isValid(parsedDate)) {
          // Handle invalid date
          record.dDay = null;
          record.dSessionDt = null;
        } else {
          // Format day of the week
          record.dDay = format(parsedDate, 'EEEE'); // e.g., 'Wednesday'

          // Format date as 'dd MMM yyyy'
          record.dSessionDt = format(parsedDate, 'dd MMM yyyy'); // e.g., '06 Nov 2024'
        }

        // Optionally, remove the original dStartDt if not needed
        // delete record.dStartDt;

        return record;
      });
    } catch (error) {

    }



    if (ls.length) {
      return ls[0]
    } else {
      return {}
    }
  }

  async exportFile(query: getAnnotHighlightEEP, res: any): Promise<exportRes> {
    debugger;
    console.log('Data retrieved successfully:', res);

    this.log.report(`Export start ${JSON.stringify(query)}`, this.logApplication);
    try {

      const caseData = await this.getCaseDetail(query.nCaseid, query.nSessionid)// await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: query.nCaseid, nSesid: query.nSessionid });
      // console.log('caseData:', caseData, JSON.stringify(caseData.data))

      // if (!caseData.success) {
      //   return { msg: -1, value: 'No case data found!' };
      // }

      const otherCaseData = caseData //.data[0][0];
      // console.log('CaseDetail', otherCaseData)
      let rawData;
      let data = [];
      if (query.cTranscript == 'Y' || query.cIsDemo == 'Y') {
        rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${query.cIsDemo == 'Y' ? 'demo-stream' : 's_' + query.nSessionid}.json`), 'utf8');
        data = JSON.parse(rawData);
      } else {

        if (caseData.cStatus == 'R' && caseData.cProtocol == 'B') {
          const output = await this.syncFeedToOffline(caseData.nSesid);
          data = output
        } else {
          const inputDir = path.join('localdata', `dt_${query.nSessionid}`)// path.join(__dirname, (process.env.NODE_ENV == 'production' ? '../../data/' : '../../../data/'), 'dt_' + query.nSessionid);
          console.log('PROCESS DIRE', inputDir)
          const output = this.conversion.processDirectory(inputDir);
          data = output
        }

      }
      // coverParam.cTranscript = query.cTranscript;

      try {
        if (res.length) {
          const updatedCordinats = this.updateCordinates(data, (res.length > 0 ? res[0] : []), query.cTranscript);
          res[0] = updatedCordinats;
        }
      } catch (error) {
        this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');

      }

      const summaryOfAnnots = [];
      const summaryOfHihglights = [];


      try {


        const queryforSummaryH = this.queryService.getAnnotIssueSummaryQuery();

        const ref1 = query.bQfact ? await this.dbLite.getCustomQuery(queryforSummaryH, [query.cTranscript || 'N', query.nCaseid, query.nSessionid, query.nUserid]) : [];


        const queryforSummaryM = this.queryService.getHighlightGroupQuery();

        const ref2 = query.bQmark ? await this.dbLite.getCustomQuery(queryforSummaryM, [query.cTranscript || 'N', query.cTranscript || 'N', query.nSessionid, query.nUserid, query.nUserid, query.nSessionid]) : [];

        const dt_ant = { data: [ref1, ref2] };  //await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: query.nCaseid, ref: 2, nUserid: query.nUserid, nSesid: query.nSessionid, cTranscript: query.cTranscript || 'N', isAnnotations: query.bQfact || false, isHighlight: query.bQmark || false });

        if (dt_ant?.data?.length) {
          if (dt_ant.data[0].length) {
            summaryOfAnnots.push({ title: 'Q fact', data: dt_ant.data[0] });
          }

          if (dt_ant.data[1].length) {

            const groupData = [];

            dt_ant.data[1].forEach((item) => {
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
        this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
      }
      // console.log('summaryOfAnnots:', summaryOfAnnots)
      // const data = JSON.parse(rawData);
      const htmlContent = await this.generateHtmlContent(query, data, res, query.bTimestamp, (query.bCoverpg ? { CaseName: query.cCasename, ExportBy: query.cUsername, cTranscript: query.cTranscript } : null), otherCaseData, summaryOfAnnots, summaryOfHihglights);
      fs.writeFileSync(path.join(this.exportPath, `output${query.nSessionid}.html`), htmlContent);

      this.log.report(`html generate successfully!`, this.logApplication);
      console.log('HTML generated successfully!');

      // const Filepath = await this.generatePdf(query);
      const Filepath = await this.generatePdfWithWkhtml(query);
      this.log.report(`Export complete`, this.logApplication);
      return { msg: 1, path: Filepath, name: 'export.pdf' };
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
      console.log('\n\r ERROR', error)
      return { msg: -1 };
    }

  }

  checkForPages(page, query: getAnnotHighlightEEP) {
    try {
      return !query.jPages.length || (query.jPages.length && query.jPages.includes(page));
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
      return true;
    }
  }

  generateHtmlContent(query: getAnnotHighlightEEP, data: any, res: any, showTimeStamps: boolean, coverParam: any, x: any, summaryOfAnnots, summaryOfHihglights): string {
    try {

      const date = new Date();
      const options: any = { year: 'numeric', month: 'short', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);

      const htmlTemplatePath = path.join(this.exportPath, 'htmlTemplate.html');
      const issueAnnots = (res && res.length && query.bQfact) ? res[0] : []; // bQfact
      //console.log('issueAnnots',issueAnnots)
      const highlights = (res && res.length && query.bQmark) ? res[1] : []; //
      let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf-8');
      let coverContent = `<td class="main-content">
              <h1 class="case-name">${coverParam.CaseName}</h1>
              <p class="document-type">${x.cCasename}</p>
              <p class="document-info">
                <span style="font-size: 12px; line-height: 6px"></span>
              </p>
              <div class="spacer"></div>
              <p class="export-info">
                Exported on: ${formattedDate} <br /> By ${coverParam.ExportBy} <br>
              </p>
            </td>`;


      let mainContent = '';
      htmlContent = htmlContent.replace('<td class="main-content replacable-content"></td>', coverContent);
      let currentPage = data[0].page;
      let pgIndexs = 0;

      // mainContent += `<a class="titlepage page page-break" href="#page-6">GO TO PAGE 6</a>`;


      mainContent += `<div class="titlepage page page-break">
    <div class="maindivider"></div>
    <p class="text-1">${x?.cIndexheader || ''}
    </p>
    <div class="divider"></div>
    <div class="sidespace">


      <p class="text-start betweeen capitalize">Between</p>
      <p>
        <span>${x?.cClaimant || ''}</span>
      </p>
      <p class="text-end">Claimant</p>
      <p>-&nbsp;&nbsp;and&nbsp;&nbsp;-</p>
      <p>${x?.cRespondent || ''}</p>
      <p class="text-end">Respondent</p>
      <div class="spacer"></div>
      <div class="divider"></div>
      <p>-&nbsp;&nbsp;before&nbsp;&nbsp;- </p>
      <p>${x?.cName || ''}
      </p>
      <p>${x?.dDay}, ${x?.dSessionDt}
      </p>

      <div class="divider"></div>

      <div class="text-start msg">
        <p>${x?.cTClaimant || ''}
        </p>
        <p>${x?.cTRespondent || ''}
        </p>
      </div>
    </div>
    <p class="text-center transriptby">
      Transcript produced by lloydmichaux.com<br />
    </p>
    <div class="maindivider"></div>
  </div>
`

      mainContent += this.bindIssuesIndex(summaryOfAnnots);
      mainContent += this.bindHighlightsIndex(summaryOfHihglights);


      data.forEach(ls => {

        if (this.checkForPages(ls.page, query)) {
          pgIndexs++;
          currentPage = ls.page;

          const curPageData = issueAnnots.filter(i => i.pageIndex == currentPage);
          mainContent += `
        <div class="page page-break">

        <table class="page-header" name="page-${currentPage}" id="page-${currentPage}">
          <tr>
            <td class="head-left">
              <p>${x?.cCasename}</p>
            </td>
            <td class="head-right">
             <p class="text-end">${x?.cName}</p>
             <p class="text-end">${x?.dSessionDt}</p>
            </td>
          </tr>
        </table>
        <header class="data-header">Page No. ${currentPage}</header>`

          // mainContent += `<a name="page-${currentPage}" id="page-${currentPage}"></a>`;

          if (query.bPagination) {
            mainContent += `<span class="pagination">${coverParam.CaseName}-${pgIndexs}</span>`
          }

          // mainContent += `<main class="${showTimeStamps ? '' : 'no-timestamp'}">`;
          mainContent += `    <table class="line-table">`
          if (ls && ls.data) {
            ls.data.forEach((item, index) => {
              let linetext = item.lines.join('');
              let startIndex = 0, endIndex = 0;
              if (curPageData.length > 0) {
                let matchingLine = this.utilityService.findFirstMatchingLine(curPageData, index + 1);

                if (matchingLine && linetext && matchingLine.text) {
                  startIndex = matchingLine.startIndex;
                  endIndex = matchingLine.endIndex;
                  const color = matchingLine.color;
                  linetext = linetext.slice(0, startIndex) +
                    `<span style="background:${color}">` +
                    linetext.slice(startIndex, endIndex) +
                    '</span>' +
                    linetext.slice(endIndex);
                }
              }

              item.linetext = linetext;
              const currentLinedata = highlights.find(a => (a && a.cPageno == currentPage && a.cLineno == (index + 1)));


              mainContent += `     <tr style="background:${currentLinedata ? `#${currentLinedata.cColor}` : 'white'}">
                                   <td class="line-no" style="background:${currentLinedata ? `#${currentLinedata.cColor}` : '#eeeeee'}">
                                     <span>${index + 1}</span>
                                    ${showTimeStamps ? `<span>${item.time}</span>` : ''} 
                                   </td>
                                   <td class="line-text">${item.linetext}</td>
                                 </tr>`

              // mainContent += `
              //   <div class="line" style="background-color:${currentLinedata ? `#${currentLinedata.cColor}` : 'white'}">
              //     <div class="line-no" style="background-color:${currentLinedata ? `#${currentLinedata.cColor}` : '#eeeeee'}">
              //       <span>${index + 1}</span>
              //       ${showTimeStamps ? '<span>' + item.time + '</span>' : ''}
              //     </div>
              //     <span class="line-text">${item.linetext}</span>
              //   </div>`;
            });
          }
          mainContent += `</table>`;

          mainContent += `
                       <table class="page-header data-footer ">
                         <tr>
                           <td colspan="2">
                             <div class="maindivider"></div>
                           </td>
                         </tr>
                         <tr>
                           <td class="head-left">
                             <p>Lloyd Michaux (ask@lloydmichaux.com)</p>
                             <p>Asia-Pacific | Middle East | India</p>
                           </td>
                           <td class="head-right">
                             <p class="text-end">Daily Transcript Service</p>
                           </td>
                         </tr>
                       </table>
                      `;

          mainContent += `</div>`;

        }


      });

      // mainContent += `
      //   </main>
      // </div>`;

      htmlContent = htmlContent.replace('<div id="main-content-placeholder"></div>', mainContent + '</body></html>');

      return htmlContent;
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
    }

    return '';
  }


  bindIssuesIndex(summaryOfAnnots) {
    let mainContent = '';
    if (summaryOfAnnots?.length) {
      summaryOfAnnots.forEach((item) => {
        mainContent += `  <div class="page page-break p-0">
                            <div class="anothead mb-3">Index</div>
                            <div class="heading">${item?.title}</div>
                                <div class="p-3">
                                <div class="tabhead">
                                  <div class="pageno">Page</div>
                                  <div class="source">Source text</div>
                                  <div class="note">Note</div>
                                  <div class="issue">Issues</div>
                                </div>
                                `
        if (item.data?.length) {
          item.data.forEach((annot) => {

            mainContent += `
                                                  <div class="tabbody">
                                                     <div class="pageno" ><a href="#page-${annot.pageIndex}">${annot.pageIndex}</a></div>
                                                     <div class="source">${annot.cONote || ''}</div>
                                                     <div class="note">${annot.cNote || ''}</div>`

            mainContent += this.bindAllIssues(annot);


            mainContent += `</div>`
          })
        }
        mainContent += `</div>`
      })
    }
    return mainContent;
  }



  bindHighlightsIndex(summaryOfHihglights) {
    let mainContent = '';
    try {
      if (summaryOfHihglights?.length) {
        summaryOfHihglights.forEach((item) => {
          mainContent += ` <div class="page page-break p-0">
                            <div class="anothead mb-3">Index</div>
                            <div class="heading">${item?.title}</div>
                                <div class="p-3">
                                <div class="tabhead">
                                  <div class="pageno">Page</div>
                                  <div class="source">Source text</div>
                                  <div class="note">Note</div>
                                  <div class="issue">Issues</div>
                                </div>`

          item.data.forEach((group) => {
            mainContent += ` <div class="tabbody">`
            const sortedArray = group?.data.sort((a, b) => parseInt(a.cLineno || "0") - parseInt(b.cLineno || "0"));

            const page = [...new Set(sortedArray.map(a => a.cPageno))][0];
            const text = sortedArray.map(a => a.cNote || '').join('<br /> ');
            const issues = sortedArray[0] || {};

            //page no          
            mainContent +=
              ` <div class="pageno" >
                                       <a  href="#page-${page}">${page || ''}</a>
                                   </div>`;

            //text
            mainContent +=
              `<div class="source">
                                   ${text || ''}
                                 </div>`;

            mainContent += `<div class="note"></div>`;
            //issues
            mainContent += this.bindAllIssues(issues);
            mainContent += `</div>`

          })


          mainContent += `</div>`
        })
      }
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
      console.log('Error in bindHighlightsIndex:', error)
    }
    return mainContent;

  }

  bindAllIssues(annot) {
    let mainContent = '';
    mainContent += `<div class="issue">`;

    try {
      if (annot?.issues?.length) {
        annot.issues.forEach((issue) => {
          mainContent +=
            ` <div class="issuewrap">
                  <div class="name"> <span class="issuebar" style="background:#${issue.cColor} !important"></span> <span class="text">${issue.cIName}</span> </div>`;

          if (issue?.cRel) {
            mainContent += `<div class="rel"> <span class="relspn">${issue.cRel}</span> </div>`;
          }

          if (issue?.cImp) {
            mainContent += `
                      <div class="impact"><img width="20px" src="https://etabella.tech/docs/impacts/${issue.nImpactid}.png"> </div>
                     `;
          }

          mainContent += `</div>`;
          // issue.nImpactid  issue.nRelid   issue.cImp  issue.cRel
        });
      }
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');

    }

    mainContent += `</div>`;
    return mainContent;
  }
  async generatePdf(query: getAnnotHighlightEEP): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // Add these arguments
      timeout: 60000,
    });
    const page = await browser.newPage();
    let filePath;
    if (process.env.NODE_ENV == 'production') {
      filePath = path.join(this.exportPath, `output${query.nSessionid}.html`);
    } else {
      filePath = path.join(__dirname, '../../../', this.exportPath, `output${query.nSessionid}.html`);
    }

    const fileUrl = `file://${filePath}`;
    console.log('\n\r\n\rfilePath:', fileUrl)
    await page.goto(fileUrl, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const pdfname = `s_${query.nSessionid}.pdf`
    const PDFpath = `${this.exportPath}${pdfname}`;
    console.log('PDFpath:', PDFpath, 'SAVING PDF')
    const opts: any = {
      path: PDFpath, format: (query.cPgsize ? query.cPgsize : 'A4'), printBackground: true
      // ,  displayHeaderFooter: false, // Ensure header/footer don’t interfere with anchor links
      // , landscape: (query.cOrientation == 'P' ? false : true)
    }
    let res = await page.pdf(opts);
    console.log('PDF saved successfully!')
    await browser.close();
    console.log('PDF generated successfully!');
    return pdfname;
  }

  async generatePdfWithWkhtml(query: getAnnotHighlightEEP): Promise<string> {
    try {


      const exportPath = `${this.config.get('REALTIME_PATH')}exports/`;

      let htmlFilePath;
      if (process.env.NODE_ENV === 'production') {
        htmlFilePath = path.join(exportPath, `output${query.nSessionid}.html`);
      } else {
        htmlFilePath = path.join(__dirname, '../../../', exportPath, `output${query.nSessionid}.html`);
      }

      const pdfFilePath = `./public/s_${query.nSessionid}.pdf`;


      // Define your wkhtmltopdf command
      // const command = `wkhtmltopdf --enable-local-file-access --page-size A4 --margin-top 0 --margin-bottom 0 --margin-left 0 --margin-right 0 --print-media-type ${htmlFilePath} ${pdfFilePath}`;

      // Execute the command asynchronously
      // await execAsync(command);



      const htmlContent = await fs.readFileSync(htmlFilePath, 'utf8');


      const data = await this.generatePDF(htmlContent, pdfFilePath)

      const PDFpath = `s_${query.nSessionid}.pdf`;
      console.log('PDFpath:', PDFpath, 'SAVING PDF', data)
      this.log.report(`PDF Saved `, this.logApplication);
      // If successful, return true
      return PDFpath;
    } catch (error) {
      this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
      // Handle any errors here
      console.error('Error during PDF conversion:', error);
      return '';
    }
    /*try {


      const exportPath = `${this.config.get('REALTIME_PATH')}exports/`;

      let htmlFilePath;
      if (process.env.NODE_ENV === 'production') {
        htmlFilePath = path.join(exportPath, `output${query.nSessionid}.html`);
      } else {
        htmlFilePath = path.join(__dirname, '../../../', exportPath, `output${query.nSessionid}.html`);
      }

      const pdfFilePath = `${exportPath}s_${query.nSessionid}.pdf`;


      // Define your wkhtmltopdf command
      const command = `wkhtmltopdf --enable-local-file-access --page-size A4 --margin-top 0 --margin-bottom 0 --margin-left 0 --margin-right 0 --print-media-type ${htmlFilePath} ${pdfFilePath}`;

      // Execute the command asynchronously
      await execAsync(command);

      const PDFpath = `s_${query.nSessionid}.pdf`;
      console.log('PDFpath:', PDFpath, 'SAVING PDF')
      // If successful, return true
      return PDFpath;
    } catch (error) {
      // Handle any errors here
      console.error('Error during PDF conversion:', error);
      return '';
    }*/
  }



  async generatePDF(htmlContent, outputPath): Promise<any> {
    return new Promise((resolve, reject) => {
      // Configure wkhtmltopdf options
      const options = [
        '--page-size', 'A4',
        '--margin-top', '0',
        '--margin-bottom', '0',
        '--margin-left', '0',
        '--margin-right', '0',
        '--print-media-type',
        '-', // Read HTML content from stdin
        outputPath
      ];

      // Use execFile to run wkhtmltopdf with the specified options
      const child = execFile(wkhtmltopdfPath, options, (error, stdout, stderr) => {
        if (error) {
          this.log.report(`Error in generatePDF ${error?.message}`, this.logApplication, 'E');
          reject(`Error: ${error.message}`);
        } else {
          resolve(`PDF created at: ${outputPath}`);
        }
      });

      // Write HTML content to stdin for wkhtmltopdf to process
      child.stdin.write(htmlContent);
      child.stdin.end();
    });
  }


  updateCordinates(data, res, cTranscript) {

    let Adata = []
    const heighlightData: any = res// [];
    // try {
    //   if (res.length) {
    //     // Adata = annotations[0].map(a => a.cordinates).flat()
    //     Adata = res.map(a => { return (a && a.cordinates && a.cordinates != "NULL" && a.cordinates.length) ? a.cordinates.map(b => ({ ...b, color: a.color, nICount: a.nICount, nIDid: a.nIDid })) : [] }).flat()
    //     for (let y of Adata) {
    //       let inds = heighlightData.findIndex(a => a.pageIndex == y.p && a.nIDid == y.nIDid)
    //       if (inds > -1) {
    //         heighlightData[inds]["cordinates"].push({ height: y.height, l: y.l, p: y.p, t: y.t, text: y.text, width: y.width, x: y.x, y: y.y });
    //       } else {
    //         heighlightData.push(
    //           {
    //             color: y.color,
    //             nICount: y.nICount,
    //             nIDid: y.nIDid,
    //             pageIndex: y.p,
    //             cordinates: [{ height: y.height, l: y.l, p: y.p, t: y.t, text: y.text, width: y.width, x: y.x, y: y.y }]
    //           }
    //         )
    //       }

    //     }
    //   }
    // } catch (error) {
    //   console.log('\n\r\n\r\n\rError in highlight', error)
    // }



    heighlightData.forEach(e => {
      const pg = e.pageIndex;
      const pgData = data.find(a => a.page == pg)?.data;
      if (e.cordinates) {
        let searchLine;
        const length = e.cordinates.length;
        // console.log('\n\n\n statred updae cordinates for : pg = ', pg, 'nIDid = ', e.nIDid)
        e.cordinates.forEach((c, index) => {
          // console.log('c = ', c);
          try {
            const line = pgData[c.l - 1].lines.join(' ');
            let startIndex = 0, endIndex = 0;
            if (index > 0 && (length - 1) > index) {
              // console.log('step 1.1')
              startIndex = 0;
              endIndex = line.length;
            } else {
              if (index == 4) {

                // console.log('step 1.2', index, e.cONote.split('\n'))
                // console.log('e.cONote ', JSON.stringify(e.cONote))
              }
              //searchLine =cTranscript=='Y' ? (c.text || this.getLineText(e.cONote, index) || '') : (this.getLineText(e.cONote, index) || '');
              searchLine = c.text || this.getLineText(e.cONote, index) || '';

              if (true) {
                //console.log('searchLine = ', searchLine,'line = ',line)

              }
              ({ startIndex, endIndex } = this.utilityService.findIndices(searchLine, line));




              // console.log('findindices startIndex:', startIndex, 'endIndex:', endIndex)
            }
            if (index == 0 && length > 1) {
              // console.log('step 1.3')
              endIndex = line.length;
            }
            if ((length - 1) == index && length > 1) {
              // console.log('step 1.4')
              startIndex = 0;
            }

            c.startIndex = startIndex;
            c.endIndex = endIndex;
            if (!c.text) {
              c.text = searchLine
            }
            // console.log('updated startIndex:', startIndex, 'endIndex:', endIndex)
          } catch (error) {
            this.log.report(`Error in updateCordinates ${error?.message}`, this.logApplication, 'E');
            console.log('Error in updateCordinates:', error)
          }

        })
      }



    })
    return res;
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


  async syncFeedToOffline(nSesid: any): Promise<any> {
    const feedData = []
    try {
      debugger;

      const list = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
      list.map(a => a.nSesid = a.id)
      if (!list.length) return feedData;
      const sessionDetail: any = list[0]

      if (!sessionDetail) return false;
      if (sessionDetail.cProtocol == 'C') return true;


      const feeddata = this.session.CurrentJob?.lineBuffer || [] //await this.sqlLiteService.fetchFeed('nSesid = ?', [data.nSesid]);
      const pageDataLength = sessionDetail.nLines || 25;
      // if (feeddata && feeddata.length) {
      //   const totalpages = Math.ceil(feeddata.length / pageDataLength);
      //   // for (let i = 1; totalpages >= i; i++) {
      //   for (let i = totalpages; i >= 1; i--) {
      //     // const pageData = feeddata.slice((i - 1) * pageDataLength, i * pageDataLength);
      //     const pageData = this.getPageData(feeddata, i, pageDataLength);

      //   }
      // }


      if (feeddata && feeddata.length) {
        const totalpages = Math.ceil(feeddata.length / pageDataLength);
        for (let i = totalpages; i >= 1; i--) {
          const pageData = this.getPageData(feeddata, i, pageDataLength);
          try {
            const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])] }))
            feedData.push({ msg: i, page: i, data: frmtData });
          } catch (error) {
            console.log(error);
          }
        }
      }


      /*  const feeddata = await this.dbLite.fetchFeed('nSesid = ?', [nSesid]);
        const pageDataLength = sessionDetail.nLines || 25;
        if (feeddata && feeddata.length) {
          const totalpages = Math.ceil(feeddata.length / pageDataLength);
          for (let i = totalpages; i >= 1; i--) {
            const pageData = this.getPageData(feeddata, i, pageDataLength);
            try {
              const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])] }))
              feedData.push({ msg: i, page: i, data: frmtData });
            } catch (error) {
              console.log(error);
            }
          }
        }
        */

        return feedData.sort((a, b) => a.page - b.page);

    } catch (error) {
      this.log.report(`Error in syncFeedToOffline ${error?.message}`, this.logApplication, 'E');
      console.log(error);
      return feedData;
    }
  }



  getPageData(data, pageNumber, linesPerPage = 25) {
    const startIndex = (pageNumber - 1) * linesPerPage;
    const endIndex = pageNumber * linesPerPage;
    return data.slice(startIndex, endIndex);
  }

}