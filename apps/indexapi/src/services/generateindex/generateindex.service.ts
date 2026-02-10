import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { fileListReq, fileListRes } from '../../interfaces/index.interface';
import { Worker } from 'worker_threads';
var fs = require('fs');

import * as pdfMake from 'pdfmake';
import { UtilityService } from '../../utility/utility.service';

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
export class GenerateindexService {
    constructor(private db: DbService, private readonly utility: UtilityService) {
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
        console.log('step 2');
        debugger;
        var numPages: number;
        let docDefinition = {};
        try {

            // console.log('indexing', body.column)
            const columnsArray = JSON.parse(`[${body.column}]`);

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

            const generateTable = (tablelist) => {
                if (!tablelist || !tablelist.length) return null;

                return {
                    table: {
                        widths: columnWidths,    // Define widths for each of the 4 columns
                        body: [
                            // [{ text: 'Tab', style: 'hTable' }, { text: 'Filename', style: 'hTable' }, { text: 'Date', style: 'hTable' }, { text: 'Description', style: 'hTable' }, { text: 'Exhibit no.', style: 'hTable' }, { text: 'Page', style: 'hTable' }],
                            ...tablelist.map(item => columnsArray.map(e => e[1]).map(key => gettable_row_bykey(item, key)))
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

            const gettable_row_bykey = (item, key) => {
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

            const gettable_row = (item) => {
                return columnsArray.map(e => e[1]).map(key => gettable_row_bykey(item, key))
            }

            const generateContent = (data) => {
                console.log('step 2.1.2');
                // console.log('casedetail', casedetail)
                const content = [];
                content.push([
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
                                x2: 520, // width of A4 paper in points
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
                                x2: 520, // width of A4 paper in points
                                y2: 10,
                                lineWidth: 0.3, lineColor: '#c2c2c2'
                            }
                        ],
                        // hLineColor: function (i, node) {
                        //     return '#a9aeb8';
                        // }
                    }, { text: '', pageBreak: 'after' }
                    // ... you can add more long dashes as needed.
                ]);
                var filetable = [];
                for (const entry of data) {

                    if (!entry.nBundledetailid) {
                        if (filetable.length) {
                            content.push(filetable[0])
                            filetable = [];
                        }
                        content.push({
                            table: {
                                widths: ['*'],
                                body: [[
                                    { text: entry.sub_info || '', fontSize: 12, style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }
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
                        filetable[0]["table"]["body"].push(gettable_row(entry))

                    }
                    // const table = generateTable(entry.tablelist);
                    // if (table) content.push(table);
                }
                try {
                    if (filetable.length) {
                        // console.log('filetable');
                        content.push(filetable[0])
                        filetable = [];
                    }

                    if (tblls.length) {
                        // console.log('tblls', tblls);
                        const table1 = generateTable(tblls);
                        if (table1) content.push(table1);
                    }
                } catch (error) {
                    console.log(error);

                }

                return content;
            };
            console.log('step 2.2');
            // let totalPages;
            docDefinition = {
                header: function (currentPage, pageCount) {
                    if (currentPage === 1) {
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
                },
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10], // [left, top, right, bottom]
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return null; // No header for first page
                    }
                    return [
                        {
                            table: {
                                widths: columnWidths,
                                body: tableBody
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
                },


                content: [generateContent(jsonData)],
                styles: {
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
            };


        } catch (error) {
            console.log('1 me', error)
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


            const result = await this.generatePdf(casedetail, printer, docDefinition, path);
            cb(result);

            // const pdfDoc = printer.createPdfKitDocument(docDefinition);
            // pdfDoc.pipe(fs.createWriteStream(path)).on('finish', () => {
            //     console.log('PDF generated successfully.');

            //     // parentPort.postMessage({ msg: 1, totalPages: casedetail.totalPages });
            //     // parentPort.postMessage('PDF Generation completed');
            //     // insert_indexing(mdl, path, app)
            //     // this.insertIndexing(body, path)
            //     cb({ msg: 1, pNo: casedetail.totalPages });
            //     // return { msg: 1, pNo: casedetail.totalPages }
            // }, error => {
            //     console.log('step 5');
            //     console.error('2 me', error)
            //     cb({ msg: -1, error: error });
            //     // return { msg: -1, error: error }
            //     // parentPort.postMessage({ msg: -1 });
            //     // indexingFailed(mdl, app)
            // });
            // console.log('step 4');
            // // parentPort.postMessage('PDF Generation completed');
            // pdfDoc.end();
        } catch (error) {
            console.log('3 me', error)
            cb({ msg: -1, error: error });
            // return { msg: -1, error: error }
        }
    }

    async generatePdf(casedetail, printer, docDefinition: any, path: string): Promise<{ msg: number, pNo?: number, error?: any }> {
        // return new Promise((resolve, reject) => {
        //     const pdfDoc = printer.createPdfKitDocument(docDefinition);

        //     pdfDoc.pipe(fs.createWriteStream(path))
        //         .on('finish', () => {
        //             console.log('PDF generated successfully.');
        //             resolve({ msg: 1, pNo: casedetail.totalPages });
        //         })
        //         .on('error', (error) => {
        //             console.error('Error generating PDF', error);
        //             reject({ msg: -1, error });
        //         });

        //     pdfDoc.end();
        // });
        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
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
            } catch (error) {
                console.log(error);
                console.error('Error generating PDF', error);
            }
        });

    }


}
