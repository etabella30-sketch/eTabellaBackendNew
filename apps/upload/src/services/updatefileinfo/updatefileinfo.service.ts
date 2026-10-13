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

    /** Redis admission must succeed before the ZIP's newly created database resources commit. */
    async saveBundleWithCheckpoint(detail: jobDetail, entries: any[], checkpoint: (rows: any[]) => Promise<void>): Promise<any[]> {
        const result = await this.db.saveAtomically(async () => {
            const rows = await this.saveBundle(detail, entries);
            if (!Array.isArray(rows) || !rows.length || rows.some(row => !row.nBundledetailid || !row.cSavepath)
                || new Set(rows.map(row => row.nBundledetailid)).size !== rows.length) {
                throw new Error('ZIP document rows could not be saved');
            }
            await checkpoint(rows);
            return rows;
        });
        if (!Array.isArray(result)) throw new Error('ZIP document rows could not be committed');
        return result;
    }

    /** A Redis snapshot can survive a process stop before its database transaction commits. */
    async validateZipExtraction(detail: jobDetail, entries: any[]): Promise<boolean> {
        const scope = await this.db.rowQuery(`SELECT j."nJobid"
          FROM public."JobMaster" j JOIN public."UploadDetail" ud ON ud."nUDid"=j."nUDid"
          JOIN public."UploadMaster" um ON um."nUPid"=ud."nUPid"
          JOIN public."SectionMaster" s ON s."nSectionid"=j."nSectionid"
          WHERE j."nJobid"=$1::uuid AND j."nUDid"=$2::uuid AND um."nUPid"=$3::uuid
            AND j."nCaseid"=$4::uuid AND j."nUserid"=$5::uuid AND j."nSectionid"=$6::uuid
            AND j."nBundleid" IS NOT DISTINCT FROM $7::uuid AND j."cPath"=$8 AND j."identifier"=$9
            AND um."nUserid"=j."nUserid" AND um."nCaseid"=j."nCaseid" AND s."nCaseid"=j."nCaseid"`,
          [detail.nJobid, detail.nUDid, detail.nUPid, detail.nCaseid, detail.nUserid, detail.nSectionid,
            detail.nBundleid ?? null, detail.cPath, detail.identifier]);
        if (!scope.success || scope.data?.length !== 1) throw new Error('ZIP upload identity is unavailable');
        const ids = entries.map(entry => entry.nBundledetailid);
        if (!ids.length || ids.some(id => !id) || new Set(ids).size !== ids.length) {
            throw new Error('ZIP resource identity is ambiguous');
        }
        const resources = await this.db.rowQuery(`SELECT d."nBundledetailid",d."nCreateId",d."nSectionid",
            d."nBundleid",d."cPath",d."cStatus",s."nCaseid"
          FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
          WHERE d."nBundledetailid"=ANY($1::uuid[])`, [ids]);
        if (!resources.success) throw new Error('ZIP resource identity is unavailable');
        if (!resources.data?.length) return false; // The first transaction rolled back; no resource was committed.
        if (resources.data.length !== entries.length) throw new Error('ZIP resource checkpoint is incomplete');
        for (const entry of entries) {
            const row = resources.data.find(resource => resource.nBundledetailid === entry.nBundledetailid);
            const nativePath = entry._zipExtractionPath || entry.cSavepath;
            const pdfPath = nativePath?.replace(/\.[^/.]+$/, '.pdf');
            if (!row || row.nCreateId !== detail.nUserid || row.nCaseid !== detail.nCaseid
                || row.nSectionid !== detail.nSectionid || (row.nBundleid ?? null) !== (entry.nParentbundleid ?? null)
                || !['P', 'C', 'V'].includes(row.cStatus) || ![nativePath, pdfPath].includes(row.cPath)) {
                throw new Error('ZIP resource checkpoint does not match its upload');
            }
        }
        return true;
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

    /** Recover a document saved before a conversion worker could checkpoint its resolved ID in Redis. */
    async findConvertedDocument(body: Pick<saveFileInfoReq, 'cPath' | 'nSectionid' | 'nBundleid' | 'nMasterid'>, caseId: string): Promise<any | null> {
        const result = await this.db.rowQuery(`SELECT d.*,1::integer AS msg
          FROM public."BundleDetail" d JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
          WHERE d."cPath"=$1 AND s."nCaseid"=$2::uuid AND d."nSectionid"=$3::uuid
            AND d."nBundleid" IS NOT DISTINCT FROM $4::uuid AND d."nCreateId"=$5::uuid
            AND d."cStatus" IN ('C','V')`, [body.cPath, caseId, body.nSectionid, body.nBundleid ?? null, body.nMasterid]);
        if (!result.success) throw new Error('Converted document identity is unavailable');
        if ((result.data?.length ?? 0) > 1) throw new Error('Converted document identity is ambiguous');
        return result.data?.[0] ?? null;
    }

    async findUploadDocument(uploadDetailId: string, uploadId: string, caseId: string, actor: string): Promise<string> {
        const result = await this.db.rowQuery(`SELECT d."nBundledetailid"
          FROM public."UploadDetail" ud JOIN public."UploadMaster" um ON um."nUPid"=ud."nUPid"
          JOIN public."BundleDetail" d ON d."nBundledetailid"=ud."nBundledetailid"
          JOIN public."SectionMaster" s ON s."nSectionid"=d."nSectionid"
          WHERE ud."nUDid"=$1::uuid AND um."nUPid"=$2::uuid AND um."nCaseid"=$3::uuid
            AND s."nCaseid"=um."nCaseid" AND um."nUserid"=$4::uuid`, [uploadDetailId, uploadId, caseId, actor]);
        if (!result.success || result.data?.length !== 1 || !result.data[0]?.nBundledetailid) {
            throw new Error('Original upload document identity is unavailable');
        }
        return result.data[0].nBundledetailid;
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
