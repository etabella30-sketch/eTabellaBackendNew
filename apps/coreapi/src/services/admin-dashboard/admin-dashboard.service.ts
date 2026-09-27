import { DbService } from '@app/global/db/pg/db.service';
import { ForbiddenException, Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { CaseCountReq, CaseCountResponce, CaseListReq, CaseListResponce, RtSimSourceReq, RtSimSourceRes, RtSimSourceSetReq, archiveCaseReq, archiveCaseRes } from '../../interfaces/admin-dashboard.interface';

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



    async getCaseListCount(body: CaseCountReq): Promise<CaseCountResponce> {
        let res = await this.db.executeRef('admindashboard_count', body);
        if (res.success) {
            return res.data[0][0];
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

    /**
     * The one case whose documents RT Simulation (RT demo) links open from.
     * The SP re-checks UserMaster.isAdmin: the middleware's admin flag is a
     * sign-in-time copy, so a demoted admin is refused here straight away.
     */
    async getRtSimSource(query: RtSimSourceReq): Promise<RtSimSourceRes> {
        const res = await this.db.executeRef('rt_sim_source_get', { nMasterid: query.nMasterid });
        if (!res.success) return { msg: -1, value: 'Failed to fetch', error: res.error };
        return this.refuseNonAdmin(res.data?.[0]?.[0]) ?? { msg: 1, nCaseid: null };
    }

    /** Turn a case on (it replaces any other source) or off (clears it only while it is still this case). */
    async setRtSimSource(body: RtSimSourceSetReq): Promise<RtSimSourceRes> {
        const res = await this.db.executeRef('rt_sim_source_set', {
            nCaseid: body.nCaseid,
            bEnabled: body.bEnabled,
            nMasterid: body.nMasterid,
        });
        if (!res.success) return { msg: -1, value: 'Failed to save', error: res.error };
        return this.refuseNonAdmin(res.data?.[0]?.[0]) ?? { msg: -1, value: 'Failed to save' };
    }

    private refuseNonAdmin(row: RtSimSourceRes | undefined): RtSimSourceRes | undefined {
        if (row && Number(row.msg) === -1 && row.value === 'Admin rights required') {
            throw new ForbiddenException('Admin rights required');
        }
        return row;
    }

}
