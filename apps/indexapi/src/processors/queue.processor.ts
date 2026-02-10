import { DbService } from '@app/global/db/pg/db.service';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { UtilityService } from '../utility/utility.service';
import { fileListReq } from '../interfaces/index.interface';

var fs = require('fs');
const XLSX = require('xlsx');
import * as pdfMake from 'pdfmake';

import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { PdfGenerateService } from '../services/pdf-generate/pdf-generate.service';
import { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Agent } from 'https';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';

const execPromise = promisify(exec);

const fonts = {
    Roboto: {
        normal: `${process.env.FONTS_PATH}Roboto/Roboto-Regular.ttf`,
        bold: `${process.env.FONTS_PATH}Roboto/Roboto-Medium.ttf`,
        italics: `${process.env.FONTS_PATH}Roboto/Roboto-Italic.ttf`,
        bolditalics: `${process.env.FONTS_PATH}Roboto/Roboto-MediumItalic.ttf`,
    },
};


// filePath = this.config.get('ASSETS');


@Processor('indexgenerate-download')
export class QueueProcessor {
    filepath: string = this.config.get('ASSETS'); // Path to save the generated Excel file
    private ASSETS_PATH = this.config.get('S3_SYNC_PATH');
    private S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
    private S3_EXC_PATH = this.config.get('S3_EXC_PATH');
    private BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');

    assets: string = this.config.get('ASSETS');
    private readonly logApp: string = 'indexing';
    private readonly s3Client: S3Client;
    constructor(private utility: UtilityService, private db: DbService, private config: ConfigService
        , private readonly logService: LogService, private readonly pdfGenerateS: PdfGenerateService
    ) {
        const agent = new Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new S3Client({
            region: 'sgp1', // Set your DigitalOcean region
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),   // e.g., 'https://nyc3.digitaloceanspaces.com'
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5, // Retry up to 3 times
            retryMode: 'standard', // Use the standard retry mode
            forcePathStyle: this.config.get('DO_S3') == 'MINIO', // Required for MinIO
            requestHandler: new NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000, // 30 seconds for connection
                socketTimeout: 60000,     // 30 seconds for socket
            }),
        });
    }
    @Process('process-indexing')
    async handleTask(job: Job) {

        const { nCaseid, nSectionid, nMasterid } = job.data.body
        try {
            await new Promise<void>(async (resolve, reject) => {
                try {
                    console.log('STARTED FROM HERE')
                    const path = `doc/case${nCaseid}/index_${nSectionid}_${new Date().getTime()}.pdf`;
                    console.log('step 1.1')
                    let data = await this.getIndexData(job.data.body)
                    console.log('step 1.1')
                    if (data && data?.msg && data?.msg == -1) {
                        this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    }
                    this.logService.info(`Indexing start for caseId ${nCaseid} by userId ${nMasterid}`, this.logApp);
                    console.log('Task processed 0');
                    this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'A', message: 'Data analyzing for generate PDF. Please wait...' } });

                    let [casedetail] = [data.casedetail];
                    this.indexing(data, job.data.body, path, async (file_res) => {
                        if (file_res.msg == 1) {

                            try {
                                await this.uploadFileToS3(path);
                                this.logService.info(`Insert to data base for ${nCaseid} by userId ${nMasterid}`, this.logApp);
                                if (casedetail?.oldPath) {
                                    this.unsyncOldfile(casedetail?.oldPath)
                                }
                                this.insertIndexing(job.data.body, path, file_res.pNo)
                                this.logService.info(`Indexing Created successfully for ${nCaseid} by userId ${nMasterid}`, this.logApp);

                                resolve();
                            } catch (error) {
                                console.log(error);
                                this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
                                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });

                                resolve();
                            }

                        } else {
                            resolve();
                            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to generate index. Please try again.' } });
                        }
                        data = null;
                    });
                } catch (error) {
                    console.log(error);
                    this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
                    this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    resolve();
                }
            })
            if (global.gc) {
                global.gc();
            }
            console.log('Task processed 1');
        } catch (error) {
            console.log('Task error', error);
            this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
        }
    }



    async getIndexData(body: fileListReq): Promise<any> {
        body["ref"] = 3

        this.logService.info(`Generate index Request for   case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        this.logService.info(`Request for get Data  case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        try {
            const res = await this.db.executeRef('index_getfiles', body)
            try {
                this.logService.info(`GetData reponce success add in queue case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
                const [casedetail, bundlelist, tablelist] = res.data;
                let obj = { casedetail: casedetail[0], tablelist: tablelist, bundlelist: bundlelist };
                // this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });

                return obj
                // await this.taskQueue.add('process-indexing', obj, {
                //     attempts: 5, // Retry up to 5 times
                //     backoff: {
                //         type: 'exponential', // Use exponential backoff strategy
                //         delay: 1000, // Start with a 1-second delay
                //     },
                // });
            } catch (error) {
                console.log(error);
                this.logService.error(`Indexing failed with error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                return { msg: -1, value: 'Failed to fetch data', error: error };
            }
        }
        catch (error) {
            this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
            return { msg: -1, value: 'Failed to fetch data', error: error };
        }

    }


    async insertIndexing(body: fileListReq, pdfPath: string, nPage) {
        let res = await this.db.executeRef('index_fileupdate', { cPath: pdfPath, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nPage: nPage, cFilename: body.cFilename });
        if (res.success) {
            try {
                console.log('step 7', res.data[0]);
                // 
                // this.utility.emit({ event: 'hyperlink-index-responce', data: { nMasterid: body.nMasterid, nBundledetailid: res.data[0][0]["nBundledetailid"], nCaseid: body.nCaseid, nSectionid: body.nSectionid, cType: body.cHyperlinktype, cKeeptype: "R", isDeepscan: false } }, 'hyperlink-index-responce');
                this.sendNotification(body.nCaseid, body.nMasterid, true, res.nBundledetailid)
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, nBundledetailid: res.data[0][0]["nBundledetailid"], cName: res.data[0][0]["cName"], type: 'C' } });
            } catch (error) {

            }
            return { msg: 1, value: 'Indexing successful' };
        } else {
            this.sendNotification(body.nCaseid, body.nMasterid, false)
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F' } });
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }

    // async indexing(casedetail, tblls, jsonData, path): Promise<any> {
    async indexing(data, body, filepath, cb) {

        const printer = new pdfMake(fonts);

        this.logService.info(`Indexing start create HTML using pdfMake for caseId ${body.nCaseid} by userId ${body.nMasterid}`, this.logApp);

        let [casedetail, tblls, jsonData, path] = [data.casedetail, data.tablelist, data.bundlelist, this.filepath + filepath];
        console.log('step 2', casedetail);
        let docDefinition = {};
        const isCoverpg = body.bCoverpg;
        const isIndexpg = body.bIndexpg;
        let content;
        try {

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
            // columnsArray.map(e => { if (e[1] == 'cTab') { e[2] = 100 } });
            const columnWidths = columnsArray.map(e => e[2]);
            console.log('step 2.2');

            content = this.generateContent(columnWidths, columnsArray, jsonData, tblls);
            console.log('step 2.3');
            // getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount)
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, isIndexpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, tableBody, currentPage, pageSize, isCoverpg, isIndexpg),
                content: content,
                styles: this.getStyles(),
            };
            console.log('step 2.4');

        } catch (error) {
            console.log('3 ', error)
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, this.logApp);
            cb({ msg: -1, error: error });
        }
        // const workerData = docDefinition;


        try {
            console.log('step 2.5');
            const directory = path.substring(0, path.lastIndexOf('/'));

            // Check if the directory exists, create it if it doesn't
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            console.log('step 2.6');
            // console.log('step 3.1');
            this.logService.info(`Generate HTML Start`, this.logApp);
            const result = await this.generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path);
            docDefinition = null;
            casedetail = null;
            jsonData = null;
            tblls = null
            content = null;
            this.logService.info(`Generate HTML ${result ? 'success' : 'failed'}`, this.logApp);
            console.log('step 2.7');
            console.log('step 2.8', result);


            // Clear printer cache if available
            if (printer?.cache) printer.cache.clear();

            // Release file handles
            await fs.promises.open(path, 'r').then(fd => fd.close());

            cb(result);
        } catch (error) {
            console.log('3 me', error)
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, this.logApp);

            // Clear printer cache if available
            if (printer?.cache) printer.cache.clear();

            // // Release file handles
            // await fs.promises.open(path, 'r').then(fd => fd.close());

            cb({ msg: -1, error: error });
            // return { msg: -1, error: error }
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
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }

    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key))
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
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    };

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
                            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                            linkToDestination: `bd_${item.nBundledetailid}`,
                            decoration: 'underline',
                        } //,
                        // {
                        //     text: (item.cTab ? (`ALPHA$-${'RD8UY'}-${item.nBundledetailid}`) : ''),
                        //     fontSize: 2,
                        //     decoration: 'underline',
                        //     color: '#ffffff',
                        //     style: 'tableRowEven',
                        // }
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
            } else if (key == 'cAuthor') {
                return { text: item.cAuthor, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] }
            }
        } catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }

    }

    generateContent(columnWidths, columnsArray, data, tblls) {
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

            if (tblls.length) {
                const table1 = this.generateTable(columnWidths, columnsArray, tblls);
                if (table1) content.push(table1);
            }

            return content;
        } catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }

    }




    getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount) {
        try {
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
        } catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }

    }

    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg) {
        try {
            if (isCoverpg && currentPage === 1) {
                return null;
            }
            if (isIndexpg && currentPage === 2) {
                return this.getIndexPageBackground(pageSize);
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
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }

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

        return new Promise((resolve, reject) => {
            const headerContent = [];
            try {
                console.log('START GENERATION')
                const directory = path.substring(0, path.lastIndexOf('/'));

                // Check if the directory exists, create it if it doesn't
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }

                // let tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                let pdfDoc;
                let writeStream;
                // let chunks = [];
                // tempPdfDoc.on('data', (chunk) => {
                //     console.log('PDF data chunk received')
                //     chunks.push(chunk)
                // });
                // console.log('PDF data chank lenght.', chunks.length);
                // tempPdfDoc.on('end', async () => {
                console.log('PDF generation end process.')
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
                console.log('Step 2');

                const finalDocDefinition = {
                    header: docDefinition.header,
                    pageSize: 'A4',
                    pageMargins: [40, 80, 40, 10],
                    background: docDefinition.background,
                    styles: docDefinition.styles,
                    content: finalContent,
                };

                console.log('Step 3', docDefinition.header);

                pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                console.log('Step createPdfKitDocument')
                this.logService.info(`Generate HTML success`, this.logApp);
                this.logService.info(`Creating PDF `, this.logApp);
                console.log('Creating PDF ', path);

                writeStream = fs.createWriteStream(path);

                writeStream.on('finish', () => {
                    console.log('PDF generated successfully.');
                    this.logService.info(`PDF generated successfully.`, this.logApp);
                    resolve({ msg: 1, pNo: casedetail.totalPages });
                });

                writeStream.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.log('Error generating PDF', error);
                    this.logService.error(`Error generating PDF ${JSON.stringify(error)}`, this.logApp);
                    resolve({ msg: -1, error });
                });
                // pdfDoc.on('data', (chunk) => console.log('pdfDoc PDF data chunk received'));
                pdfDoc.on('end', () => {
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
                //     this.cleanup(pdfDoc, writeStream, tempPdfDoc);
                //     console.error('PDF generation error:', error)
                // });
                // tempPdfDoc.end();
                try {
                    // this.cleanup(pdfDoc, writeStream, tempPdfDoc);
                    // this.cleanupMemory(chunks);
                    // chunks = []
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
                this.logService.error(`Generate HTML error ${JSON.stringify(error)}`, this.logApp);
                reject({ msg: -1, value: 'Indexing Failed' });
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


    async uploadFileToS3(oldPath: string): Promise<any> {
        try {
            // Step 1: Copy the file to the new location using the AWS CLI or s3cmd

            this.logService.info(`Send file local to object storage`, this.logApp);
            const copyCommand = `${this.S3_EXC_PATH} sync ${this.ASSETS_PATH}${oldPath} ${this.S3_BUCKET_PATH}${oldPath}`;
            console.log(`Executing: ${copyCommand}`);
            this.logService.info(`Executing command ${copyCommand}`, this.logApp);
            await execPromise(copyCommand);
            console.log(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`);
            this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp);
            return true;
        } catch (error) {
            console.log(error);
            // console.error('Error during file move:', error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, this.logApp);
            return false;
        }
    }





    async sendNotification(nCaseid: any, nMasterid: string, status: boolean, nBundledetailid?: string) {
        if (!nCaseid) return;
        this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `Index generate ${status ? 'successful' : 'failed'} `;
                    a.cMsg = `Index generate ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
                    a.nBundledetailid = nBundledetailid
                    a.nRefuserid = nMasterid
                    this.utility.emit(a, `notification`);
                })
            }
        } catch (error) {
            console.log(error);
        }
    }


    async getUploadUser(nCaseid: string): Promise<any[]> {
        try {
            let res = await this.db.executeRef('notifications_caseusers', { nCaseid: nCaseid })
            if (res.success) {
                return res.data[0];
            } else {
                return [];
            };
        } catch (error) {

        }

    }

    async unsyncOldfile(filePath) {
        // Iterate over each file path and attempt to delete it
        try {
            // Delete the file asynchronously
            await fs.unlink(this.assets + filePath);
            this.logService.info(`Successfully deleted file: ${filePath}`, this.logApp);
        } catch (error) {
            // Log any errors encountered during deletion
            if (error.code === 'ENOENT') {
                // Handle the case where the file doesn't exist
                this.logService.info(`File not found, skipping deletion: ${filePath}`, this.logApp);
            } else {
                // Log other errors
                this.logService.error(`Error deleting file: ${filePath}`, this.logApp);
            }
        }




        // 2. Delete All Versions from S3
        try {
            const listCommand = new ListObjectVersionsCommand({
                Bucket: this.BUCKET_NAME,
                Prefix: filePath.startsWith("/") ? filePath.slice(1) : filePath,
            });

            const versionData = await this.s3Client.send(listCommand);

            if (!versionData.Versions || versionData.Versions.length === 0) {
                this.logService.info(`No versions found for S3 file: ${filePath}`, this.logApp);
                return;
            }

            // Prepare deletion request
            const deleteParams = {
                Bucket: this.BUCKET_NAME,
                Delete: {
                    Objects: versionData.Versions.map((v) => ({
                        Key: filePath,
                        VersionId: v.VersionId,
                    })),
                },
            };

            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            await this.s3Client.send(deleteCommand);

            this.logService.info(`Successfully deleted all versions of S3 file: ${filePath}`, this.logApp);
        } catch (error) {
            this.logService.error(`Error deleting S3 file versions: ${filePath}`, error.stack);
        }
    }


}