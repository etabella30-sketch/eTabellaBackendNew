import { DbService } from '@app/global/db/pg/db.service';
import { LogService } from '@app/global/utility/log/log.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
var fs = require('fs');

import * as pdfMake from 'pdfmake';
import { UtilityService } from '../../utility/utility.service';

@Injectable()
export class IndexfileService {
    column = '["Tab","cTab",70],["Name","cFilename","*"],["Date","dIntrestDt",70],["Description","cDescription",80],["Page","cRefpage",40],["Exhibit","cExhibitno",75]';
    filepath: string = this.config.get('ASSETS'); // Path to save the generated Excel file
    fonts = {
        Roboto: {
            normal: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Regular.ttf`,
            bold: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Medium.ttf`,
            italics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Italic.ttf`,
            bolditalics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-MediumItalic.ttf`,
        },
    };
    constructor(private readonly db: DbService,
        private readonly logService: LogService, private readonly config: ConfigService, private utility: UtilityService,) { }


    async createIndexFile(query, indexfileapth: string, logApp): Promise<boolean> {
        try {
            query["ref"] = 2;
            this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: query.nMasterid, type: 'P', message: 'Fatching data.' } });
            const data = await this.db.executeRef('download_index_data', query);
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.error(`Error while get INDEX Data ${data}`, logApp);
                return false;
            }

            this.logService.info(`Get Index Data reponce success`, logApp);
            const [casedetail, bundlelist] = data.data;
            let obj = { casedetail: casedetail[0], bundlelist: bundlelist };

            if (bundlelist.length > 0) {
                return await this.generateIndexfile(obj, query, indexfileapth, logApp)
            } else {
                return false
            }
        } catch (error) {
            this.logService.info(`Error while generate index file ${error} ${query}`, logApp);
            return false
        }
    }


    async generateIndexfile(data, body, path, logApp): Promise<boolean> {
        const { nCaseid, nMasterid } = body;

        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'P', message: 'Data analysis in process.' } });
        return await new Promise<boolean>(async (resolve, reject) => {
            this.indexing(data, body, path, logApp, async (file_res) => {
                if (file_res.msg == 1) {

                    try {
                        this.logService.info(`Indexing Created successfully for ${nCaseid} by userId ${nMasterid}`, logApp);
                        resolve(true);
                    } catch (error) {
                        console.log(error);
                        this.logService.error(`Indexing Failed with error ${error}`, logApp);
                        resolve(false);
                    }

                } else {
                    resolve(false);
                }
                data = null;
            });
        })
    }

    async indexing(data, body, filepath, logApp, cb) {

        const printer = new pdfMake(this.fonts);

        this.logService.info(`Indexing start create HTML using pdfMake for caseId ${body.nCaseid} by userId ${body.nMasterid}`, logApp);

        let [casedetail, jsonData, path] = [data.casedetail, data.bundlelist, filepath];
        console.log('step 2', casedetail);
        let docDefinition = {};
        const isCoverpg = true;
        let content;
        try {
            const columnsArray = JSON.parse(`[${this.column}]`);
            const tableBody = [
                columnsArray.map(col => ({
                    text: col[0],
                    fillColor: '#000000',
                    color: 'white',
                    fontSize: 10,
                    alignment: 'center',
                    margin: [0, 7, 0, 7]
                }))
            ];
            console.log('step 2.1');
            const columnWidths = columnsArray.map(e => e[2]);
            console.log('step 2.2');

            content = this.generateContent(columnWidths, columnsArray, jsonData);
            console.log('step 2.3');
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, tableBody, currentPage, pageSize, isCoverpg),
                content: content,
                styles: this.getStyles(),
            };
            console.log('step 2.4');

        } catch (error) {
            console.log('3 ', error)
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);
            cb({ msg: -1, error: error });
        }
        // const workerData = docDefinition;


        try {
            console.log('step 2.5');
            const directory = path.substring(0, path.lastIndexOf('/'));

            console.log('step 2.6');
            // console.log('step 3.1');
            this.logService.info(`Generate HTML Start ${docDefinition}`, logApp);
            const result = await this.generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition, path, body.nMasterid, logApp);
            if (result) {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'C', message: 'Generating PDF.' } });
            } else {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'PDF Generating Failed.' } });
            }
            docDefinition = null;
            casedetail = null;
            jsonData = null;
            content = null;
            this.logService.info(`Generate HTML ${result ? 'success' : 'failed'}`, logApp);
            console.log('step 2.7');
            console.log('step 2.8', result);


            // Clear printer cache if available
            if (printer?.cache) printer.cache.clear();

            // Release file handles
            await fs.promises.open(path, 'r').then(fd => fd.close());

            cb(result);
        } catch (error) {
            console.log('3 me', error)
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);

            // Clear printer cache if available
            if (printer?.cache) printer.cache.clear();

            // // Release file handles
            // await fs.promises.open(path, 'r').then(fd => fd.close());

            cb({ msg: -1, error: error });
            // return { msg: -1, error: error }
        }
    }


    generateContent(columnWidths, columnsArray, data) {
        try {
            const content = [];

            var filetable = [];
            data.forEach((entry, bundleIndex) => {
                if (!entry.nBundledetailid) {
                    if (filetable.length) {
                        content.push(filetable[0])
                        filetable = [];
                    }
                    content.push({
                        table: {
                            widths: ['*'],
                            body: [[
                                {
                                    text: entry.sub_info || '', fontSize: 12, style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], id: `bundle_${bundleIndex}`
                                }
                            ]], dontBreakRows: true
                        },
                        layout: {
                            hLineWidth: function () { return 2; },
                            vLineWidth: function () { return 0; },
                            hLineColor: function () { return 'white'; },
                            vLineColor: function () { return 'white'; },
                            paddingLeft: function () { return 5; },
                            paddingRight: function () { return 5; },
                            paddingTop: function () { return 0; },
                            paddingBottom: function () { return 0; }
                        }
                    });
                } else {
                    var tbl = {
                        table: {
                            widths: columnWidths,    // Define widths for each of the 4 columns
                            body: [], dontBreakRows: true
                        }
                    };
                    if (!filetable.length) {
                        filetable.push(tbl)
                    }
                    filetable[0]["table"]["body"].push(this.gettable_row(columnsArray, entry))

                }
            });
            if (filetable.length) {
                content.push(filetable[0]);
                filetable = [];
            }

            return content;
        } catch (error) {
            console.log(error);
        }

    }


    generateTable(columnWidths, columnsArray, tablelist) {
        try {
            if (!tablelist || !tablelist.length) return null;

            return {
                table: {
                    widths: columnWidths,    // Define widths for each of the 6 columns
                    body: [
                        ...tablelist.map(item => this.gettable_row(columnsArray, item))
                    ],
                    dontBreakRows: true
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    }
                }
            };
        } catch (error) {
            console.log(error);
        }
    };


    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key))
    }

    gettable_row_bykey(item, key) {
        try {
            if (key == 'cTab') {
                return {
                    // text: item.cTab,
                    // link: 'BDRF_' || item.nBundledetailid,
                    stack: [
                        {
                            text: item.cTab,
                            style: 'tableRowEven',
                            color: 'blue',
                            border: [false, false, true, true],
                            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                        },
                        {
                            text: (item.cTab ? (`ALPHA$-${'RD8UY'}-${item.nBundledetailid}`) : ''),
                            fontSize: 2,
                            color: '#ffffff',
                            style: 'tableRowEven',
                        }
                    ],
                    style: 'tableRowEven',
                    border: [false, false, true, true],
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    alignment: 'center',
                    margin: [0, 3, 0, 3],
                }
            } else if (key == 'cExhibitno') {
                return {
                    stack: [
                        {
                            text: item.cExhibitno,
                            style: 'tableRowEven',
                            border: [false, false, false, false],
                            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                        },
                        {
                            text: (item.cExhibitno ? (`ALPHA$-${'RDEXUY'}-${item.nBundledetailid}`) : ''),
                            fontSize: 2,
                            color: '#ffffff', // This text will be half transparent
                            style: 'tableRowEven',
                        }
                    ],
                    style: 'tableRowEven',
                    border: [false, false, true, true],
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    alignment: 'center',
                    margin: [0, 3, 0, 3],
                }
            } else if (key == 'cFilename') {
                return { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] }
            } else if (key == 'dIntrestDt') {
                return { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            } else if (key == 'cDescription') {
                return { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            } else if (key == 'cRefpage') {
                return { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            } else if (key == 'kind') {
                return { text: item.kind, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            } else if (key == 'cBundletag') {
                return { text: item.cBundletag, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            }
        } catch (error) {
            console.log(error);
        }

    }



    getHeader(isCoverpg, currentPage, casedetail, pageCount) {
        try {
            if (currentPage === 1 && isCoverpg) {
                return null; // No header for first page
            }
            casedetail.totalPages = pageCount;
            return [{
                margin: [40, 20, 40, 0], // global margin for header
                columns: [
                    {
                        text: `Case No. ${casedetail.cCaseno}`,
                        alignment: 'left',
                        fontSize: 12, bold: true,
                    }, {
                        text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                        alignment: 'right', bold: true,
                    }]
            }];
        } catch (error) {
            console.log(error);
        }

    }

    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg) {
        try {
            if (isCoverpg && currentPage === 1) {
                return null;
            }
            return [
                {
                    table: {
                        widths: columnWidths,
                        body: columnsArray
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return 1;
                        },
                        hLineColor: function (i, node) {
                            return '#FFFFFF';
                        },
                        vLineColor: function (i, node) {
                            return '#FFFFFF';
                        }
                    },
                    padding: [0, 20, 0, 20],
                    margin: [40, 40, 40, 0]
                }
            ];
        } catch (error) {
            console.log(error);
        }

    }

    getStyles() {
        return {
            hIndex: {
                bold: true,
                fontSize: 16,
                padding: [5, 0, 5, 0],  // Background color
                margin: [0, 5, 0, 5],
            },
            hTable: {
                bold: true,
                fontSize: 16,
                fillColor: '#A9AEB8',
                padding: [5, 0, 5, 0],  // Background color
                margin: [0, 10, 0, 10],
            },
            contentBackground: {
                fillColor: '#a9aeb8'  // Gray background color for content
            },
            tableRowEven: {
                fillColor: '#EFF1F4',
                fontSize: 10,  // Light gray color for even rows,
                borderColor: ['#FF000000', '#00FF0000', '#0000FF00', '#FFFF0000']
            }
        }
    }

    getHeaderContent(casedetail) {
        try {
            return [
                { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
                { text: casedetail.cIndexheader, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
                { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
                { text: casedetail.cClaimant, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Claimant', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
                { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
                { text: casedetail.cRespondent, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Respondent', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ]
                },
                { text: 'INDEX OF HEARING BUNDLE DOCUMENTS', alignment: 'center', fontSize: 12, bold: true, margin: [0, 35, 0, 35] },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ],
                },
                { text: '', pageBreak: 'after' }
            ];
        } catch (error) {
            console.log(error);
        }
    }

    async generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition: any, path: string, nMasterid, logApp): Promise<{ msg: number, pNo?: number, error?: any }> {

        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'P', message: 'Generating PDF.' } });
        return new Promise((resolve, reject) => {
            let headerContent = [];
            try {
                console.log('START GENERATION')
                const directory = path.substring(0, path.lastIndexOf('/'));



                // let tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                let pdfDoc;
                let writeStream;
                // let chunks = [];
                // tempPdfDoc.on('data', (chunk) => {
                //     // console.log('PDF data chunk received')
                //     chunks.push(chunk)
                // });
                // console.log('PDF data chank lenght.', chunks.length);
                // tempPdfDoc.on('end', async () => {
                // console.log('PDF generation completed successfully.')
                // const result = Buffer.concat(chunks);
                let toc = [];
                let finalContent = [];
                console.log('Set Header');
                headerContent.push(this.getHeaderContent(casedetail));
                let tableBody = [];
                jsonData.forEach((entry, bundleIndex) => {
                    if (!entry.nBundledetailid && !entry.nParentBundleid) {
                        tableBody.push([
                            { text: entry.cBundletag || '', fontSize: 12, border: [true, true, true, true], color: 'blue', borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0], linkToDestination: `bundle_${bundleIndex}` },
                            { text: entry.sub_info || '', fontSize: 12, border: [true, true, true, true], borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0] }
                        ]);
                    }
                });
                console.log('Set Header Success', tableBody.length);
                if (tableBody.length) {
                    toc.push({
                        table: {
                            widths: [100, '*'],
                            body: tableBody
                        },
                        layout: {
                            hLineWidth: function () { return 0.5; },
                            vLineWidth: function () { return 0.5; },
                            hLineColor: function () { return '#000000'; },
                            vLineColor: function () { return '#000000'; },
                            paddingLeft: function () { return 5; },
                            paddingRight: function () { return 5; },
                            paddingTop: function () { return 2; },
                            paddingBottom: function () { return 2; }
                        }, margin: [0, -10, 0, 0]
                    });
                }

                toc.push({ text: '', pageBreak: 'after' }); // Add a page break after the table of contents
                console.log('Step 1');
                if (isCoverpg) {
                    // finalContent = [
                    //     ...headerContent,
                    //     ...docDefinition.content
                    // ];
                    docDefinition.content.unshift(...headerContent);
                    finalContent = docDefinition.content;
                } else {
                    finalContent = docDefinition.content
                }
                console.log('Step 2');

                let finalDocDefinition = {
                    header: docDefinition.header,
                    pageSize: 'A4',
                    pageMargins: [40, 80, 40, 10],
                    background: docDefinition.background,
                    styles: docDefinition.styles,
                    content: finalContent,
                };

                console.log('Step 3', docDefinition.header);

                pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                finalDocDefinition = null;
                finalContent = null;
                jsonData = null;
                headerContent  = null;
                console.log('Step createPdfKitDocument')
                this.logService.info(`Generate HTML success`, logApp);
                this.logService.info(`Creating PDF `, logApp);
                console.log('Creating PDF ', path);

                writeStream = fs.createWriteStream(path);

                writeStream.on('finish', () => {
                    console.log('PDF generated successfully.');
                    this.logService.info(`PDF generated successfully.`, logApp);
                    this.cleanup(pdfDoc, writeStream, null); // ✅ Clean up on error
                    resolve({ msg: 1, pNo: casedetail.totalPages });
                });

                writeStream.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.log('Error generating PDF', error);
                    this.logService.error(`Error generating PDF ${JSON.stringify(error)}`, logApp);
                    this.cleanup(pdfDoc, writeStream, null); // ✅ Only clean up after success
                    resolve({ msg: -1, error });
                });
                // pdfDoc.on('data', (chunk) => console.log('pdfDoc PDF data chunk received'));
                pdfDoc.on('end', () => {
                    if (global.gc) {
                        global.gc(); // ⚠️ Only for debugging! Do NOT keep in prod
                    }
                    console.log('pdfDoc PDF generation completed successfully.')
                });
                pdfDoc.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.error('pdfDoc PDF generation error:', error)
                });
                pdfDoc.pipe(writeStream);
                pdfDoc.end();
                // });
                // tempPdfDoc.on('error', (error) => {
                // this.cleanup(pdfDoc, writeStream, null);
                //     console.error('PDF generation error:', error)
                // });
                // tempPdfDoc.end();
                try {
                    // this.cleanup(pdfDoc, writeStream, tempPdfDoc);
                    // chunks = []
                    // this.cleanupMemory(chunks);
                    pdfDoc = null;
                    writeStream = null;
                    // tempPdfDoc = null;
                } catch (error) {
                    console.log(error);
                }
                // tempPdfDoc.removeAllListeners();
            } catch (error) {
                console.log(error);
                // console.error('Error generating PDF', error);
                this.logService.error(`Generate HTML error ${JSON.stringify(error)}`, logApp);
                reject({ msg: -1, value: 'Indexing successful' });
            }
        });

    }

    private cleanupMemory(chunks: Buffer[]): void {
        chunks.length = 0;
        if (global.gc) global.gc();
    }

    private cleanup(pdfDoc: any, writeStream: any, tempPdfDoc?: any): void {
        try {
            if (pdfDoc) {
                console.log('clean pdfDoc')
                pdfDoc.removeAllListeners();
            }
            if (writeStream) {
                console.log('clean writeStream')
                writeStream.removeAllListeners();
            }
            if (tempPdfDoc) {
                console.log('clean tempPdfDoc')
                tempPdfDoc.removeAllListeners();
            }
        } catch (error) {
            console.log(error);
        }
        if (global.gc) global.gc();
    }


}
