import { Injectable } from '@nestjs/common';
import { deleteFilesReq, excelReport } from '../../interfaces/export.interface';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { DbService } from '@app/global/db/pg/db.service';

@Injectable()
export class ExportsService {

    constructor(@InjectQueue('export-excel') private exportExcelQueue: Queue,private db: DbService) {

    }




    async generateExport(body: excelReport): Promise<any> {
        
        let queueRes: any = await this.exportExcelQueue.add(body, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //


        // this.mergeChunk.handleMerge({ data: body });

        console.log('Export Job added to the queue:');
        console.log('Export  Job ID:', queueRes.id);
        return { msg: 1, value: 'Generating excel report.' };

    }



    async deleteFiles(body: deleteFilesReq): Promise<any> {

        let res = await this.db.executeRef('upload_deletefiles', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to delete', error: res.error }
        }

    }


}
