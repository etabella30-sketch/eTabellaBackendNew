import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { saveConvertFileInfoReq, saveFileInfoReq, startJob } from '../../interfaces/upload.interface';
import { jobDetail } from '../../interfaces/unzip.interface';
import { replaceMDL } from 'apps/coreapi/src/interfaces/upload.interface';
import { convertFileMulti, fileConvertReq } from '../../interfaces/convert.interface';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class UpdatefileinfoService {

    constructor(private db: DbService) {

    }

    async updateFileInfo(body: saveFileInfoReq): Promise<any> {
        let res = await this.db.executeRef('upload_updatefileinfo', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async jobStart(body: startJob): Promise<any> {
        let res = await this.db.executeRef('upload_unzip', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async getJobDetail(nJobid: string): Promise<any> {
        let res = await this.db.executeRef('upload_getjobdetail', { nJobid: nJobid });
        if (res.success) {
            if (res.data[0].length) {
                return res.data[0][0];
            }
            return { msg: -1, value: 'No job id found' }
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async saveBundle(jobDetail: jobDetail, result: any[]) {
        let res = await this.db.executeRef('upload_unzip_extractation', { ...jobDetail, jFolders: JSON.stringify(result) });
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async finalUpdate(detail: any) {
        let res = await this.db.executeRef('upload_unzip_update_bundledetail', detail);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async jobFailed(nJobid: string) {
        let res = await this.db.executeRef('upload_job_failed', { nJobid: nJobid, cStatus: 'F' });
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
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


    async updateConvertFileInfo(body: saveConvertFileInfoReq): Promise<any> {
        let res = await this.db.executeRef('upload_update_convertinfo', body);
        if (res.success) {

            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }





    async get_filedata(body: fileConvertReq): Promise<any> {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async updateFilePathInfo(body: any) {
        let res = await this.db.executeRef('upload_update_filepath', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async OcrUpdate(body: any) {
        let res = await this.db.executeRef('ocr_update', body);
        console.log(res)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }
    async convertLog(body: any) {
        let res = await this.db.executeRef('convert_log', body);
        console.log(res)
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }

    async converStatus(body: any) {
        let res = await this.db.executeRef('convert_status', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }


    async convert_fileDataMulti(body: convertFileMulti): Promise<any> {
        let res = await this.db.executeRef('convert_files_byids', body);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to update', error: res.error }
        }
    }
}
