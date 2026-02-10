import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { CaseCreationResonce, CaseDeleteReq, CaseDeleteRes, CaseDetailReq, CaseDetailResponce, CaseModal, NotificationDelete, NotificationReq } from '../../interfaces/case.interface';
import { FilesystemService } from '@app/global/utility/filesystem/filesystem.service';

@Injectable()
export class CaseService {

    constructor(private db: DbService, public fs: FilesystemService) {

    }


    async casebuilder(body: CaseModal): Promise<CaseCreationResonce> {
        let res = await this.db.executeRef('admin_insertupdate_case', body);
        if (res.success) {
            if (body.permission == 'N') {
                await this.fs.createDirectoryHierarchy('doc/case' + res.data[0][0]["nCaseid"])
            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async getCaseDetail(body: CaseDetailReq): Promise<CaseDetailResponce> {
        let res = await this.db.executeRef('admin_case_getdetail', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getCaseinfo(body: CaseDetailReq): Promise<CaseDetailResponce> {
        let res = await this.db.executeRef('admin_case_getinfo', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async deleteCase(body: CaseDeleteReq): Promise<CaseDeleteRes> {
        let res = await this.db.executeRef('admin_case_delete', body);
        if (res.success) {
            // call another service for 
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getNotification(body: NotificationReq): Promise<any> {
        let res = await this.db.executeRef('notification_list', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async syncNotification(body: NotificationReq): Promise<any> {
        let res = await this.db.executeRef('notification_sync', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async clearAllNotitfiactions(body: NotificationDelete): Promise<any> {
        let res = await this.db.executeRef('notification_delete', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

}
