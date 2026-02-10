import { Injectable } from '@nestjs/common';
import { getAnnotHighlightEEP } from '../../interfaces/issue.interface';
import * as fs from 'fs';
import * as path from 'path';
import { exportRes } from '../../interfaces/export.interface';
import { UtilityService } from '../utility/utility.service';
import * as puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import * as fss from 'fs-extra';
import { exec } from 'child_process';
import { ConversionJsService } from '../conversion.js/conversion.js.service';
import { DbService } from '@app/global/db/pg/db.service';
// import * as wkhtmltopdf from 'wkhtmltopdf';

import { promisify } from 'util';
import { FeedDataService } from '../feed-data/feed-data.service';
// Convert exec to use promises for easier async/await syntax
const execAsync = promisify(exec);

@Injectable()
export class ExportService {
  exportPath: string = `${this.config.get('REALTIME_PATH')}exports/`;
  constructor(private readonly utilityService: UtilityService, private config: ConfigService, private conversion: ConversionJsService, private db: DbService, private feedData: FeedDataService) {
    this.intitData()
  }

  async intitData() {
    try {
      await fss.ensureDir(this.exportPath);
    } catch (error) {
    }
  }

  async exportFile(query: getAnnotHighlightEEP, res: any): Promise<exportRes> {
    debugger;
    console.log('Data retrieved successfully:', res);
    try {

      const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: query.nCaseid, nSesid: query.nSessionid });
      // console.log('caseData:', caseData, JSON.stringify(caseData.data))

      if (!caseData.success) {
        return { msg: -1, value: 'No case data found!' };
      }

      const otherCaseData = caseData.data[0][0];
      // console.log('CaseDetail', otherCaseData)
      let rawData;
      let data;
      if (query.cTranscript == 'Y' || query.cIsDemo == 'Y') {
        rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${query.cIsDemo == 'Y' ? 'demo-stream' : 's_' + query.nSessionid}.json`), 'utf8');
        data = JSON.parse(rawData);
      } else {


        if (otherCaseData.cStatus == 'R') { //&& otherCaseData.cProtocol == 'B'
          const output = await this.syncFeedToOffline(otherCaseData.nSesid);
          data = output
        } else {
          const inputDir = path.join('data', `dt_${query.nSessionid}`)// path.join(__dirname, (process.env.NODE_ENV == 'production' ? '../../data/' : '../../../data/'), 'dt_' + query.nSessionid);
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

      }

      const summaryOfAnnots = [];
      const summaryOfHihglights = [];


      try {

        const dt_ant = await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: query.nCaseid, ref: 2, nUserid: query.nUserid, nSesid: query.nSessionid, cTranscript: query.cTranscript || 'N', isAnnotations: query.bQfact || false, isHighlight: query.bQmark || false });

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
      }
      // console.log('summaryOfAnnots:', summaryOfAnnots)
      // const data = JSON.parse(rawData);
      const htmlContent = await this.generateHtmlContent(query, data, res, query.bTimestamp, (query.bCoverpg ? { CaseName: query.cCasename, ExportBy: query.cUsername, cTranscript: query.cTranscript } : null), otherCaseData, summaryOfAnnots, summaryOfHihglights);
      fs.writeFileSync(path.join(this.exportPath, `output${query.nSessionid}.html`), htmlContent);

      console.log('HTML generated successfully!');

      // const Filepath = await this.generatePdf(query);
      const Filepath = await this.generatePdfWithWkhtml(query);

      return { msg: 1, path: Filepath, name: 'export.pdf' };
    } catch (error) {
      console.log('\n\r ERROR', error)
      return { msg: -1 };
    }

  }

  checkForPages(page, query: getAnnotHighlightEEP) {
    try {
      return !query.jPages.length || (query.jPages.length && query.jPages.includes(page));
    } catch (error) {
      return true;
    }
  }

  generateHtmlContent(query: getAnnotHighlightEEP, data: any, res: any, showTimeStamps: boolean, coverParam: any, x: any, summaryOfAnnots, summaryOfHihglights): string {
    const date = new Date();
    const options: any = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const htmlTemplatePath = path.join(this.exportPath, 'htmlTemplate.html');
    const issueAnnots = (res && res.length) ? res[0] : [];
    //console.log('issueAnnots',issueAnnots)
    const highlights = (res && res.length) ? res[1] : [];
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
    <pre class="text-1">${x?.cIndexheader || ''}
    </pre>
    <div class="divider"></div>
    <div class="sidespace">


      <p class="text-start betweeen uppercase">Between:</p>
      <p>
        <span>${x?.cClaimant || ''}</span>
      </p>
      <p class="text-end">Claimant</p>
      <p>-&nbsp;&nbsp;and&nbsp;&nbsp;-</p>
      <pre>${x?.cRespondent || ''}</pre>
      <p class="text-end">Respondent</p>
      <div class="spacer"></div>
      <div class="divider"></div>
      <p>-&nbsp;&nbsp;before&nbsp;&nbsp;- </p>
      <pre>${x?.cName || ''}
      </pre>
      <p>${x?.dDay}, ${x?.dSessionDt}
      </p>

      <div class="divider"></div>

     
    </div>
    <p class="text-center transriptby">
      Transcript produced by lloydmichaux.com<br />
    </p>
    <div class="maindivider"></div>
  </div>
`
    // <div class="text-start msg">
    // <pre>${x?.cTClaimant || ''}
    // </pre>
    // <pre>${x?.cTRespondent || ''}
    // </pre>
    // </div>

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

        console.log('----MAIN DATA----', ls.data)
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


            mainContent += `     <tr style="background:${currentLinedata ? `#${currentLinedata.cColor}` : 'white'}" class="line-${item.formate}">
                                   <td class="line-no" style="background:${currentLinedata ? `#${currentLinedata.cColor}` : '#eeeeee'}">
                                     <span>${index + 1}</span>
                                    ${showTimeStamps ? `<span>${item.time}</span>` : ''} 
                                   </td>
                                   <td class="line-text"><span> ${item.linetext}<span></td>
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
    }
    /*   const exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
   
       let htmlFilePath;
       if (process.env.NODE_ENV === 'production') {
         htmlFilePath = path.join(exportPath, `output${query.nSessionid}.html`);
       } else {
         htmlFilePath = path.join(__dirname, '../../../', exportPath, `output${query.nSessionid}.html`);
       }
   
       const pdfFilePath = `${exportPath}s_${query.nSessionid}.pdf`;
   
       return new Promise((resolve, reject) => {
         // Read the HTML content
         const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
   
         // Convert HTML to PDF
         wkhtmltopdf(htmlContent, {
           output: pdfFilePath,
           pageSize: query.cPgsize || 'A4',
           printMediaType: true,
         }, (err) => {
           if (err) {
             console.error('Error generating PDF:', err);
             reject(err);
           } else {
             console.log('PDF generated successfully:', pdfFilePath);
             resolve(pdfFilePath);
           }
         });
       });*/
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





  async syncFeedToOffline(nSesid: string): Promise<any> {
    const feedData = []
    try {
      debugger;


      debugger;
      const sessionId = nSesid;
      try {
        const sessionData = await this.feedData.readSessionData(sessionId);
        const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b))

        if (!pages?.length) return;

        for (let x of pages) {
          const pg = Number(x[0]);
          const pageData = x[1] || [];
          const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])] }))
          feedData.push({ msg: pg, page: pg, data: frmtData });
        }

      } catch (error) {
        console.log(error);
      }

      /*
            const list = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
            list.map(a => a.nSesid = a.id)
            if (!list.length) return feedData;
            const sessionDetail: any = list[0]
      
            if (!sessionDetail) return false;
            if (sessionDetail.cProtocol == 'C') return true;
      
      
            const feeddata = this.session.CurrentJob?.lineBuffer || [] //await this.sqlLiteService.fetchFeed('nSesid = ?', [data.nSesid]);
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
      console.log(error);
      return feedData;
    }
  }

}
