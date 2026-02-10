import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';

@Injectable()
export class DownloadexcelService {
    filepath: string = this.config.get<string>('ASSETS');
    constructor(private config: ConfigService) { }

    async generateExcel(nCaseid: number, data): Promise<string> {
        const column = [
            { header: "Bundle", key: "cBundletag" },
            { header: "Tab", key: "cTab" },
            { header: "Name", key: "cFilename" },
            { header: "Date", key: "dIntrestDt" },
            { header: "Description", key: "cDesc" },
            { header: "Page", key: "cRefpage" },
            { header: "Exhibit", key: "cExhibitno" },
            { header: "Status", key: "cPaginated" }
        ];
        const dirPath = `${this.config.get<string>('ASSETS')}doc/case${nCaseid}/`
        if (!fs.existsSync(dirPath)) {
            // Create the directory recursively if it doesn't exist
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Directory created: ${dirPath}`);
        } else {
            console.log(`Directory already exists: ${dirPath}`);
        }
        const cPath = `doc/case${nCaseid}/Pagination_${new Date().getTime()}.xlsx`;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        worksheet.columns = column;
        worksheet.addRows(data);
        return new Promise((resolve, reject) => {
            workbook.xlsx.writeFile(`${this.filepath}${cPath}`)
                .then(() => {
                    resolve(cPath);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }
}
