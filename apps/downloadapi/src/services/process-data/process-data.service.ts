import { DbService } from '@app/global/db/pg/db.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { Injectable, Logger } from '@nestjs/common';
import { filesdetail, ProcessJobDetail, UpdateFileSizePayload } from '../../interfaces/download.interface';

@Injectable()
export class ProcessDataService {
    schema: schemaType = 'download';
    private readonly logger = new Logger('data-service')
    constructor(private readonly db: DbService) { }

    async getProcessJobDetail(nDPid: string): Promise<ProcessJobDetail> {
        this.logger.log(`Fetching job data for nDPid: ${nDPid}`);
        const res = await this.db.executeRef('process_detail', { nDPid }, this.schema);
        if (res.success) {
            try {
                return res.data[0][0] as ProcessJobDetail;
            } catch (error) {
                this.logger.error('Error processing fetching download job response', error);
                throw new Error('Failed to fetch process job detail');
            }
        } else {
            this.logger.error('Database error while fetching download job', res.error);
            throw new Error(res?.error);
        }
    }

    async getFiles(nDPid: string): Promise<filesdetail[]> {
        this.logger.log(`Fetching job files for  ${nDPid}`);
        const res = await this.db.executeRef('files', { nDPid }, this.schema);
        if (res.success) {
            try {
                return res.data[0];
            } catch (error) {
                this.logger.error('Error processing fetching download job files response', error);
                throw new Error('Failed to fetch files');
            }
        } else {
            this.logger.error('Database error while fetching download files', res.error);
            throw new Error(res?.error);
        }
    }

    async updateFileSizeBatch(nDPid: string, files: UpdateFileSizePayload[], bIsLast: boolean): Promise<void> {
        this.logger.log(`Updating file sizes for nDPid: ${nDPid}`);
        const res = await this.db.executeRef('update_size_batches', { nDPid, jBatch: JSON.stringify(files), bIsLast }, this.schema);
        if (res.success) {
            this.logger.log(`Successfully updated file sizes for nDPid: ${nDPid}`);
        } else {
            this.logger.error('Database error while updating file sizes', res.error);
            throw new Error(res?.error);
        }
    }

    async updatePresignUrl(nDPid: string, cUrl: string): Promise<boolean> {
        this.logger.log(`Updating presigned url  ${nDPid} with url: ${cUrl}`);
        const res = await this.db.executeRef('update_presign_url', { nDPid, cUrl }, this.schema);
        if (res.success) {
            try {
                return true;
            } catch (error) {
                this.logger.error('Error processing fetching download job files response', error);
                throw new Error('Failed to fetch files');
            }
        } else {
            this.logger.error('Database error while fetching download files', res.error);
            throw new Error(res?.error);
        }
    }

}