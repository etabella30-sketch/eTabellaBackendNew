import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { ExportDataReq, ExportDeleteReq, FileDataReq, FileListResponce } from '../../interfaces/export.interface';

@Injectable()
export class ExportService {

    constructor(private readonly db: DbService) { }

    async getFiledata(body: FileDataReq): Promise<FileListResponce[]> {
        try {
            const res = await this.db.executeRef('export_files', body);
            if (res.success) {
                return res.data[0];
            }
            throw new Error('Failed to fetch file data');
        } catch (error) {
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }

    async getExportdata(body: ExportDataReq): Promise<any> {
        try {
            const res = await this.db.executeRef('export_grid', body);
            if (res.success) {
                return res.data[0];
            }
            throw new Error('Failed to fetch export data');
        } catch (error) {
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }


    async getclearAll(body: ExportDataReq): Promise<any> {
        try {
            const res = await this.db.executeRef('export_clear_all_exports', body);
            if (res.success) {
                return res.data[0][0];
            }
            throw new Error('Failed to clear export data');
        } catch (error) {
            return [{ msg: -1, value: 'Failed to clear export data', error: error.message }];
        }
    }

    async delete(body: ExportDeleteReq): Promise<any> {
        try {
            const res = await this.db.executeRef('export_delete_file', body);
            if (res.success) {
                return res.data[0][0];
            }
            throw new Error('Failed to delete export data');
        } catch (error) {
            return [{ msg: -1, value: 'Failed to delete export data', error: error.message }];
        }
    }



}
