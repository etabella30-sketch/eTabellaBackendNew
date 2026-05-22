import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { dashInfoReq, userCaseListReq } from '../../interfaces/user-dashboard.interface';

@Injectable()
export class UserDashboardService {


    constructor(private db: DbService) {

    }


    async getCaseList(body: userCaseListReq): Promise<any> {
        // ref=4 → SP returns [casesPage, teams, users, totalCountRow]. The
        // 4th cursor is a single { nTotalCount } row that the frontend uses
        // to display the unpaginated total. See et_dashboard.sql.
        body.ref = 4;
        let res = await this.db.executeRef('dashboard', body);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getDashInfo(query: dashInfoReq): Promise<any> {
        query.ref = 3;
        let res = await this.db.executeRef('dashboard_info', query);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


}
