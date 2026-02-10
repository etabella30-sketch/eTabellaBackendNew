import { DbService } from '@app/global/db/pg/db.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CaseListReq, CaseListResponce, archiveCaseReq, archiveCaseRes } from '../../interfaces/admin-dashboard.interface';

@Injectable()
export class AdminDashboardService {

    constructor(private db: DbService) {

    }


    async getCaseList(body: CaseListReq): Promise<CaseListResponce> {
        body.ref = 3;
        let res = await this.db.executeRef('admindashboard', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getarchiveCase(body: CaseListReq): Promise<CaseListResponce> {
        body.ref = 3;
        let res = await this.db.executeRef('admin_archivecase', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async archiveCase(body: archiveCaseReq): Promise<archiveCaseRes> {
        let res = await this.db.executeRef('archivecase', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

}
