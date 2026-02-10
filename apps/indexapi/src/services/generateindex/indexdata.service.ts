import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { fileListReq, fileListRes } from '../../interfaces/index.interface';
import pdfParser from 'pdf-parse';
var fs = require('fs');

import * as pdfMake from 'pdfmake';
import { UtilityService } from '../../utility/utility.service';
import { ConfigService } from '@nestjs/config';

const fonts = {
    Roboto: {
        normal:  `${process.env.FONTS_PATH}Roboto/Roboto-Regular.ttf`,
        bold: `${process.env.FONTS_PATH}Roboto/Roboto-Medium.ttf`,
        italics: `${process.env.FONTS_PATH}Roboto/Roboto-Italic.ttf`,
        bolditalics: `${process.env.FONTS_PATH}Roboto/Roboto-MediumItalic.ttf`,
    },
};


const printer = new pdfMake(fonts);

@Injectable()
export class IndexDataService {
    constructor(private db: DbService, private readonly utility: UtilityService,private config: ConfigService) {
        // console.log('step 0', __dirname);
    }

    async getIndexData(body: fileListReq): Promise<fileListRes> {
        body["ref"] = 3
        let res = this.db.executeRef('index_getfiles', body).then(async (res) => {
            debugger;
            const casedetail = res.data[0];
            const bundlelist = res.data[1];
            const tablelist = res.data[2];
            const path = `doc/case${body.nCaseid}/index_${body.nSectionid}_${new Date().getTime()}.pdf`;

            this.indexing(body, casedetail[0], tablelist, bundlelist, ('./assets/' + path), (file_res) => {

                console.log('step 6', file_res);
                if (file_res.msg == 1) {

                    this.insertIndexing(body, path, file_res.pNo)
                } else {

                }
            });
        }, (error) => {
            return { msg: -1, value: 'Failed to fetch data', error: error };
        })
        return { msg: 1, value: 'File Indexing in process' };
    }


    async insertIndexing(body: fileListReq, pdfPath: string, nPage) {
        console.log('step 7', pdfPath);
        let res = await this.db.executeRef('index_fileupdate', { cPath: pdfPath, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nPage: nPage });
        if (res.success) {
            try {
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid } });

            } catch (error) {

            }
            return { msg: 1, value: 'Indexing successful' };
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    // async indexing(casedetail, tblls, jsonData, path): Promise<any> {
    async indexing(body, casedetail, tblls, jsonData, path, cb) {
        // console.log('indexing', body.column)
        let docDefinition = {};
        const isCoverpg = body.bCoverpg;
        const isIndexpg = body.bIndexpg;
        try {

            const columnsArray = JSON.parse(`[${body.column}]`);

            columnsArray.map(col => ({
                text: col[0],
                fillColor: '#000000',
                color: 'white',
                fontSize: 10,
                alignment: 'center',
                margin: [0, 7, 0, 7]
            }))
            console.log('step 2.1');
            const columnWidths = columnsArray.map(e => e[2]);
            console.log('step 2.2');

            const headerContent = this.getHeaderContent(casedetail);

            const content = this.generateContent(columnWidths, columnsArray, jsonData, tblls);

            // getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount)
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, isIndexpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg),
                content: content,
                styles: this.getStyles(),
            };


        } catch (error) {
            console.log(error);
            return { msg: -1, error: error };
        }
        // const workerData = docDefinition;
        console.log('step 3');


        try {

            const directory = path.substring(0, path.lastIndexOf('/'));

            // Check if the directory exists, create it if it doesn't
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            console.log('step 3.1');


            const result = await this.generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path);
            cb(result);
        } catch (error) {
            console.log(error);
            cb({ msg: -1, error: error });
            // return { msg: -1, error: error }
        }
    }


    getHeaderContent(casedetail) {
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
    }

    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key))
    }


    generateTable(columnsArray, tablelist) {
        if (!tablelist || !tablelist.length) return null;

        return {
            table: {
                widths: [85, '*', 110, 70, 120, 50],    // Define widths for each of the 6 columns
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
    };

    gettable_row_bykey(item, key) {
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
    }

    generateContent(columnWidths, columnsArray, data, tblls) {
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

        if (tblls.length) {
            const table1 = this.generateTable(columnsArray, tblls);
            if (table1) content.push(table1);
        }

        return content;
    }




    getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount) {
        if (currentPage === 1 && isCoverpg) {
            return null; // No header for first page
        }
        if (currentPage === 2 && isIndexpg) {
            return [{
                margin: [40, 20, 40, 0], // global margin for header
                columns: [
                    {
                        text: `Index of Hearing Bundle Documents`,
                        alignment: 'left',
                        fontSize: 12, bold: true,
                    }, {
                        text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                        alignment: 'right', bold: true,
                    }]
            }];
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
    }

    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg) {
        if (isCoverpg && currentPage === 1) {
            return null;
        }
        if (isIndexpg && currentPage === 2) {
            return this.getIndexPageBackground(pageSize);
        }
        return [
            {
                table: {
                    widths: [85, '*', 110, 70, 120, 50],
                    body: [
                        [
                            { text: 'Tab', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Exhibit no.', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Document title', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Date', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Description', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Page', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                        ]
                    ]
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
    }

    getIndexPageBackground(pageSize) {
        return [{
            table: {
                widths: [100, '*'],
                body: [
                    [
                        { text: 'Bundle', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] },
                        { text: 'Description', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] }
                    ]
                ]
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
            },
            padding: [0, 20, 0, 20],
            margin: [40, 40, 40, 0]
        }]; // No header for first page
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


    async generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition: any, path: string): Promise<{ msg: number, pNo?: number, error?: any }> {
        debugger;
        return new Promise((resolve, reject) => {
            const headerContent = [];
            try {

                const directory = path.substring(0, path.lastIndexOf('/'));

                // Check if the directory exists, create it if it doesn't
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }

                const tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];
                tempPdfDoc.on('data', chunk => chunks.push(chunk));
                tempPdfDoc.on('end', async () => {
                    const result = Buffer.concat(chunks);
                    // const pageNumbers = await this.getBundlePageNumbers(result, jsonData);

                    // Second Pass: Create the final document with TOC including page numbers
                    let toc = [];
                    let finalContent = [];

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

                    toc.push({ text: '', pageBreak: 'after' }); // Add a page break after the table of contents

                    if (isCoverpg && isIndexpg) {
                        finalContent = [
                            ...headerContent,
                            ...toc,
                            ...docDefinition.content
                        ];
                    } else if (isCoverpg) {
                        finalContent = [
                            ...headerContent,
                            ...docDefinition.content
                        ];
                    } else if (isIndexpg) {
                        finalContent = [
                            ...toc,
                            ...docDefinition.content
                        ];
                    } else {
                        finalContent = [
                            ...docDefinition.content
                        ];
                    }


                    const finalDocDefinition = {
                        header: docDefinition.header,
                        pageSize: 'A4',
                        pageMargins: [40, 80, 40, 10],
                        background: docDefinition.background,
                        styles: docDefinition.styles,
                        content: finalContent,
                    };

                    const pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                    const writeStream = fs.createWriteStream(path);

                    writeStream.on('finish', () => {
                        console.log('PDF generated successfully.');
                        resolve({ msg: 1, pNo: casedetail.totalPages });
                    });

                    writeStream.on('error', (error) => {
                        console.error('Error generating PDF', error);
                        reject({ msg: -1, error });
                    });

                    pdfDoc.pipe(writeStream);
                    pdfDoc.end();
                });
                tempPdfDoc.end();
            } catch (error) {
                console.log(error);
            }
        });

    }


    getBundlePageNumbers(pdfBuffer, data) {
        const pageNumbers = [];

        return pdfParser(pdfBuffer).then(res => {
            const numPages = res.numpages;
            const textByPage = res.text.split('\n\n').map(pageText => pageText.split('\n'));
            let currentPage = 0;

            data.forEach((bundle, bundleIndex) => {
                let found = false;
                for (let i = currentPage; i < numPages; i++) {
                    if (textByPage[i].some(textLine => textLine.includes(bundle.sub_info))) {
                        pageNumbers.push(i + 1); // Page numbers are 1-based
                        currentPage = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    pageNumbers.push(null);
                }
            });

            return pageNumbers;
        });
    }

}
