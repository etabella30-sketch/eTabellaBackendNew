import { LogService } from '@app/global/utility/log/log.service';
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';

@Injectable()
export class PdfGenerateService {
    private readonly CHUNK_SIZE = 50 * 1024 * 1024; // 50MB

    constructor(private readonly logService: LogService) { }

    async generatePdf(
        isCoverpg: boolean,
        isIndexpg: boolean,
        jsonData: any[],
        casedetail: any,
        printer: any,
        docDefinition: any,
        path: string, logApp: string
    ): Promise<{ msg: number, pNo?: number, error?: any }> {
        let resources = { tempPdfDoc: null, pdfDoc: null, writeStream: null };
        const tmpDir = `${os.tmpdir()}/pdf-${Date.now()}`;
        let currentChunkSize = 0;
        // this.checkMemory()
        try {
            await fs.promises.mkdir(tmpDir, { recursive: true });
            await this.ensureDirectoryExists(path);

            return await new Promise((resolve, reject) => {
                const tempFile = `${tmpDir}/temp.pdf`;
                const tempStream = fs.createWriteStream(tempFile);

                resources.tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                resources.tempPdfDoc.pipe(tempStream);

                tempStream.on('finish', async () => {
                    const finalContent = this.buildFinalContent(
                        isCoverpg, isIndexpg, jsonData, casedetail, docDefinition, logApp
                    );

                    resources.pdfDoc = printer.createPdfKitDocument({
                        ...docDefinition,
                        content: finalContent
                    });
                    // this.checkMemory()
                    resources.writeStream = fs.createWriteStream(path);
                    const readStream = fs.createReadStream(tempFile, { highWaterMark: 64 * 1024 });

                    readStream.on('data', chunk => {
                        currentChunkSize += chunk.length;
                        if (currentChunkSize >= this.CHUNK_SIZE) {
                            if (global.gc) global.gc();
                            currentChunkSize = 0;
                        }
                    });

                    resources.writeStream.on('finish', () => {
                        // this.checkMemory()
                        resolve({ msg: 1, pNo: casedetail.totalPages });
                    });

                    resources.pdfDoc.pipe(resources.writeStream);
                    resources.pdfDoc.end();
                });

                resources.tempPdfDoc.end();
            });

        } catch (error) {
            return { msg: -1, error };
        } finally {
            await this.cleanupResources(resources);
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
        }

    }


    private async cleanupResources(resources: any): Promise<void> {
        for (const resource of Object.values(resources)) {
            if ((resource as any)?.removeAllListeners) {
                (resource as any).removeAllListeners();
            }
            if ((resource as any)?.end) {
                (resource as any).end();
            }
            if ((resource as any)?.destroy) {
                (resource as any).destroy();
            }
        }

        Object.keys(resources).forEach(key => {
            resources[key] = null;
        });

        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 100));
            global.gc();
        }
    }

    private buildFinalContent(
        isCoverpg: boolean,
        isIndexpg: boolean,
        jsonData: any[],
        casedetail: any,
        docDefinition: any,
        logApp: string
    ): any[] {
        const headerContent = isCoverpg ? [this.getHeaderContent(casedetail, logApp)] : [];
        const toc = isIndexpg ? this.buildTableOfContents(jsonData) : [];

        if (isCoverpg && isIndexpg) {
            return [...headerContent, ...toc, ...docDefinition.content];
        } else if (isCoverpg) {
            return [...headerContent, ...docDefinition.content];
        } else if (isIndexpg) {
            return [...toc, ...docDefinition.content];
        }
        return [...docDefinition.content];
    }


    private async ensureDirectoryExists(path: string): Promise<void> {
        const directory = path.substring(0, path.lastIndexOf('/'));
        await fs.promises.mkdir(directory, { recursive: true });
    }



    getHeaderContent(casedetail, logApp) {
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
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, logApp);
        }
    }

    private buildTableOfContents(jsonData: any[]): any[] {
        const tableBody = jsonData
            .filter(entry => !entry.nBundledetailid && !entry.nParentBundleid)
            .map((entry, bundleIndex) => ([
                {
                    text: entry.cBundletag || '',
                    fontSize: 12,
                    border: [true, true, true, true],
                    color: 'blue',
                    borderColor: ['#000000', '#000000', '#000000', '#000000'],
                    padding: [5, 0, 5, 0],
                    linkToDestination: `bundle_${bundleIndex}`
                },
                {
                    text: entry.sub_info || '',
                    fontSize: 12,
                    border: [true, true, true, true],
                    borderColor: ['#000000', '#000000', '#000000', '#000000'],
                    padding: [5, 0, 5, 0]
                }
            ]));

        const toc = [];
        if (tableBody.length) {
            toc.push({
                table: {
                    widths: [100, '*'],
                    body: tableBody
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000',
                    paddingLeft: () => 5,
                    paddingRight: () => 5,
                    paddingTop: () => 2,
                    paddingBottom: () => 2
                },
                margin: [0, -10, 0, 0]
            });
        }

        toc.push({ text: '', pageBreak: 'after' });
        return toc;
    }

    checkMemory() {
        try {
            const memoryUsage = process.memoryUsage();
            console.log('Memory usage:', {
                rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
                arrayBuffers: (memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
            });

        } catch (error) {
            console.error('Error while monitoring memory:', error);
        }

    }
}
