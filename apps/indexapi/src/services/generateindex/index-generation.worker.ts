
import * as pdfMake from 'pdfmake';
var fs = require('fs');

const { parentPort } = require('worker_threads');

const fonts = {
    Roboto: {
        normal: './api/controller/fonts/roboto/Roboto-Regular.ttf',
        bold: './api/controller/fonts/roboto/Roboto-Medium.ttf',
        italics: './api/controller/fonts/roboto/Roboto-Italic.ttf',
        bolditalics: './api/controller/fonts/roboto/Roboto-MediumItalic.ttf',
    },
};

const printer = new pdfMake(fonts);

// Copy the indexing function from your provided code
function indexing(casedetail, tblls, jsonData, path) {




    const generateTable = (tablelist) => {
        if (!tablelist || !tablelist.length) return null;

        return {
            table: {
                widths: [85, '*', 110, 70, 120, 50],    // Define widths for each of the 4 columns
                body: [
                    // [{ text: 'Tab', style: 'hTable' }, { text: 'Filename', style: 'hTable' }, { text: 'Date', style: 'hTable' }, { text: 'Description', style: 'hTable' }, { text: 'Exhibit no.', style: 'hTable' }, { text: 'Page', style: 'hTable' }],
                    ...tablelist.map(item => [
                        {
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
                        },
                        {

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
                        },

                        { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] },
                        { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] },
                        { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] },

                        { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
                    ])
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

    const gettable_row = (item) => {
        return [
            {
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
            },
            {

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
            },

            { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] },
            { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] },
            { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] },

            { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
        ]
    }

    const generateContent = (data) => {
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
                        widths: [85, '*', 110, 70, 120, 50],    // Define widths for each of the 4 columns
                        body: [], dontBreakRows: true
                    }
                };
                if (!filetable.length) {
                    filetable.push(tbl)
                }
                console.log('filetable', filetable)
                filetable[0]["table"]["body"].push(gettable_row(entry))

            }
            // const table = generateTable(entry.tablelist);
            // if (table) content.push(table);
        }
        if (filetable.length) {
            content.push(filetable[0])
            filetable = [];
        }

        if (tblls.length) {
            const table1 = generateTable(tblls);
            if (table1) content.push(table1);
        }

        return content;
    };

    // let totalPages;
    const docDefinition = {
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
                // {
                //     text: `${currentPage} - ${pageSize}`,
                //     alignment: 'right',
                //     margin: [0, 20, 40, 0]
                // }
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


    // const workerData = docDefinition;

    // mdl.numPages = totalPages;

    const directory = path.substring(0, path.lastIndexOf('/'));

    // Check if the directory exists, create it if it doesn't
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }


    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    pdfDoc.pipe(fs.createWriteStream(path)).on('finish', () => {
        // console.log('PDF generated successfully.');

        parentPort.postMessage({ msg: 1, totalPages: casedetail.totalPages });
        // parentPort.postMessage('PDF Generation completed');
        // insert_indexing(mdl, path, app)
    }, error => {
        parentPort.postMessage({ msg: -1 });
        // console.error('2 me', error)
        // indexingFailed(mdl, app)
    });
    pdfDoc.end();
}

parentPort.once('message', (evt) => {

    parentPort.postMessage({ msg: 1, totalPages: 2 });

    // indexing(evt.casedetail, evt.tablelist, evt.bundlelist, evt.path);
});