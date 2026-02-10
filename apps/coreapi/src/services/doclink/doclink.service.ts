import { DbService } from '@app/global/db/pg/db.service';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { docID, docIDmulti, InsertDoc, resInsertDoc } from '../../interfaces/doc.interface';
import { query } from 'express';
import { UtilityService } from '../utility/utility.service';

@Injectable()
export class DoclinkService {

    constructor(private db: DbService, private utility: UtilityService) {

    }

    async insertDoc(body: InsertDoc): Promise<resInsertDoc> {
        let res = await this.db.executeRef('doc_insert', body,'realtime');
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || []
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            } catch (error) {
            }

            try {
                return { msg: 1, value: '   Doc inserted successfully', nDocid: res.data[0][0].nDocid };
            } catch (error) {

            }
        } else {
            return { msg: -1, value: 'Doc insert failed', error: res.error }
        }
    }


    async docDelete(body: docID): Promise<any> {
        try {
            const res = await this.db.executeRef('doc_delete', body);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Delete failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Delete failed', error: error }
        }
    }


    async docDetail(query: docIDmulti): Promise<any> {
        try {
            query["ref"] = 3;
            const res = await this.db.executeRef('doc_detail', query);
            if (res.success) {
                return res.data;
            } else {
                return { msg: -1, value: 'Fetch failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error }
        }
    }


}
