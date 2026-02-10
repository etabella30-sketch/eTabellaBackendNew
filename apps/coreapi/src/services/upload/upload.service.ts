import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { bundleDetailMDL, caseDetailMDL, clearCompleteMDL, ocrdataMDL, replaceMDL, sectionDetailMDL, uploadDetailMDL, uploadSummaryMDL } from '../../interfaces/upload.interface';

@Injectable()
export class UploadService {


    constructor(private db: DbService) {

    }

    async caseDetail(query: caseDetailMDL): Promise<any> {
        let res = await this.db.executeRef('upload_getcasedetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async sectionDetail(query: sectionDetailMDL): Promise<any> {
        let res = await this.db.executeRef('upload_getsectiondetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async bundleDetail(query: bundleDetailMDL): Promise<any> {
        let res = await this.db.executeRef('upload_getbundledetail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async checkForDuplicate(body: bundleDetailMDL): Promise<any> {
        let res = await this.db.executeRef('upload_checkduplicacy', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async getUploadSummary(query: uploadSummaryMDL): Promise<any> {
        let res = await this.db.executeRef('upload_report_summary', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async getUploadFiltered(query: uploadSummaryMDL): Promise<any> {
        let res = await this.db.executeRef('upload_report_filter', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async getUploadetail(query: uploadDetailMDL): Promise<any> {
        let res = await this.db.executeRef('upload_report_detail', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }




    async replaceFIleDetail(body: replaceMDL): Promise<any> {
        let res = await this.db.executeRef('upload_replacefile', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }



    async clearCompleted(body: clearCompleteMDL): Promise<any> {
        let res = await this.db.executeRef('upload_clearcompletes', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }

    async ocrdata(body: ocrdataMDL): Promise<any> {
        body["ref"] = 2
        let res = await this.db.executeRef('ocr_data', body);
        if (res.success) {
            return res.data;
        } else {
            return []
        }
    }



}