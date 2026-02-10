import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { OCRFilelistQueue } from '../../interfaces/ocrqueue.interface';

@Injectable()
export class OcrqueueService {

    constructor(private db: DbService) {

    }

    async getOcrdata(query: OCRFilelistQueue): Promise<any> {
        query["ref"] = 2
        let res = await this.db.executeRef('ocr_list', query);
        if (res.success) {
            return res.data;
        } else {
            return []
        }
    }


    async getOcrFiledata(query: OCRFilelistQueue): Promise<any> {
        let res = await this.db.executeRef('ocr_filelist', query);
        if (res.success) {
            return res.data[0];
        } else {
            return []
        }
    }

}
