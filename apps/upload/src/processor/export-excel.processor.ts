import { join, resolve } from 'path';
import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { DbService } from '@app/global/db/pg/db.service';
import * as ExcelJS from 'exceljs';

import * as fs from 'fs';
import * as path from 'path';
import { exportSummary } from '../interfaces/export.interface';
import { UtilityService } from '../services/utility/utility.service';

@Processor('export-excel')
export class ExportExcelProcessor {

  public tempFilePath = './assets/export-excel';
  constructor(private db: DbService, private readonly utility: UtilityService
  ) {

    this.setupQueueListeners();
  }

  private setupQueueListeners() {

  }

  @Process({ concurrency: 5 }) //
  async handleExport(job: Job) {
    try {
      debugger;
      console.log('ExportExcelProcessor', job.data)
      let sendParams = job.data;
      sendParams.ref = 2;
      let res = await this.db.executeRef('upload_report_detail_export', sendParams);
      if (res.success) {

        const exportSummary: exportSummary = res.data[0][0];
        const exportData: any = res.data[1];

        console.log('exportData', exportData.length)
        if (exportData.length) {

          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Data');
          let Columns = [];
          Object.keys(exportData[0]).forEach((key, index) => {
            Columns.push({ header: key, key: key, width: key == 'File name' ? 40 : 20 })
          })

          worksheet.columns = Columns;
          worksheet.addRows(exportData);

          // const buffer = await workbook.xlsx.writeBuffer();


          // Define the file path
          const filePath = path.resolve(this.tempFilePath, `case${job.data.nCaseid}/${exportSummary.cUnicid}.xlsx`);

          // Ensure the directory exists
          if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
          }

          // Write the file to the directory
          await workbook.xlsx.writeFile(filePath);

          console.log('Export successfully', filePath)
          //success
          this.utility.emit({ event: 'EXPORT-SUCCESS', data: { nUPid: job.data.nUPid, cPath: `export-excel/case${job.data.nCaseid}/${exportSummary.cUnicid}.xlsx`, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');

        } else {
          this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
          // failed
        }

      } else {
        this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
        // failed
      }
    } catch (error) {
      // failed
      this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
    }


  }



}
