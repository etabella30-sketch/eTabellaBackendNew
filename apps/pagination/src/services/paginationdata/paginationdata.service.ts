import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { getpaginationReq, getpaginationRes, paginationFileReq, paginationReq, paginationRes, stoppaginationReq } from '../../interfaces/pagination/pagination.interface';
import { UtilityService } from '../../utility/utility.service';
import { ConfigService } from '@nestjs/config';
import { LogService } from '@app/global/utility/log/log.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { PaginateService } from '../paginate/paginate.service';

const { spawn } = require("child_process");

@Injectable()
export class PaginationdataService {
    private readonly logApp: string = 'pagination';
    constructor(private db: DbService, readonly utility: UtilityService,
        readonly configService: ConfigService, private readonly logService: LogService, @InjectQueue('pagination-queue') private paginationQueue: Queue, private paginate: PaginateService) {

        this.paginationQueue.on('completed', (job) => {
            console.log(`Job with ID ${job.id} has completed`);
        });

        this.paginationQueue.on('failed', (job, err) => {
            console.log(`Job with ID ${job.id} failed with error: ${err.message}`);
        });

        this.paginationQueue.on('stalled', (job) => {
            console.log(`Job with ID ${job.id} stalled`);
        });
        this.paginationQueue.on('waiting', (jobId) => {
            console.log(`Job with ID ${jobId} is waiting to be processed`);
        });
        this.paginationQueue.on('active', (job, jobPromise) => {
            console.log(`Job with ID ${job.id} has started processing`);
        });

        this.paginationQueue.on('paused', () => {
            console.log('The queue has been paused');
        });
        this.paginationQueue.on('resumed', () => {
            console.log('The queue has been resumed');
        });
        this.paginationQueue.on('removed', (job) => {
            console.log(`Job with ID ${job.id} has been removed from the queue`);
        });

        this.paginationQueue.on('delayed', (jobId) => {
            console.log(`Job with ID ${jobId} is delayed`);
        });
        this.paginationQueue.on('drained', () => {
            console.log('The queue has been drained (no more jobs to process)');
        });

        this.paginationQueue.on('error', (error) => {
            console.error('An error occurred in the queue:', error);
        });

    }


    async getPagination(query: getpaginationReq): Promise<getpaginationRes> {
        console.log('getPagination ', this.paginate.paginationProcess)

        let ind = this.paginate.paginationProcess.findIndex(e => e.nCaseid === query.nCaseid && e["isProcess"] === true);
        console.log('getPagination index', ind)
        if (ind > -1) {
            query.nPtaskid = this.paginate.paginationProcess[ind].nPtaskid;
            let res = await this.db.executeRef('pagination_getdata', query);
            if (res.success) {
                return res.data[0];
            } else {
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } else {
            return { msg: 0, value: 'No Pagination in process' };
        }
    }


    async getPaginationData(body: paginationReq): Promise<paginationRes> {
        // this.paginationProcess = [];
        console.log('getPaginationData ', this.paginate.paginationProcess)
        this.logService.info(`Pagination request with params ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp)
        // let res = await this.db.executeRef('pagination_generatedata', body)
        let res = await this.db.executeRef(body.bIslater ? 'pagination_generate_prefix' : 'pagination_generatedata', body)

        console.log('GEN DATA ', this.paginate.paginationProcess)
        try {
            this.logService.info(`pagination_generatedata DB Function responce with  result ${res.success} by user ${body.nMasterid}`, this.logApp)
            if (res.success) {
                try {
                    this.logService.info(`Call local function processPaginationData by user ${body.nMasterid}`, this.logApp)
                    // this.processPaginationData(res, body);

                    const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res.data[0][0];
                    if (jsonData && jsonData.length == 0) {
                        return { msg: -1, value: 'No File found for Pagination' };
                    } else if (jsonData.length > 0) {
                        await this.paginationQueue.add('PAGINATION', { res: { jsonData, nCaseid, nPtaskid, jUsers, nLogid }, body }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                    }
                    // let resdata = { jsonData, nCaseid, nPtaskid, jUsers, nLogid };
                    // await this.paginate.processPaginationData(resdata, body);
                    this.logService.info(`Responce processPaginationData by user ${body.nMasterid}`, this.logApp)
                    return { msg: 1, value: 'File Pagination in process' };
                } catch (error) {
                    return { msg: -1, value: 'Failed to fetch', error: error }
                }

            } else {
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (e) {
            console.log("error", e);
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }




    async getNonpaginatedData(body: paginationFileReq): Promise<paginationRes> {
        // this.paginationProcess = [];
        this.logService.info(`Pagination request with params ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp)
        let res = await this.db.executeRef('pagination_nonpaginate_filedata', body)
        try {
            this.logService.info(`pagination_generatedata DB Function responce with  result ${res.success} by user ${body.nMasterid}`, this.logApp)
            if (res.success) {
                if (res.data[0][0]?.msg == 1) {
                    try {
                        this.logService.info(`Call local function processPaginationData by user ${body.nMasterid}`, this.logApp)
                        // this.processPaginationData(res, body);

                        const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res.data[0][0];
                        if (jsonData && jsonData.length == 0) {
                            return { msg: -1, value: 'No File found for Pagination' };
                        } else if (jsonData.length > 0) {
                            await this.paginationQueue.add('PAGINATION', { res: { jsonData, nCaseid, nPtaskid, jUsers, nLogid }, body }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                        }
                        // let resdata = { jsonData, nCaseid, nPtaskid, jUsers, nLogid };
                        // await this.paginate.processPaginationData(resdata, body);
                        this.logService.info(`Responce processPaginationData by user ${body.nMasterid}`, this.logApp)
                        return { msg: 1, value: 'File Pagination in process' };
                    } catch (error) {
                        return { msg: -1, value: 'Failed to fetch', error: error }
                    }
                } else {
                    return { msg: -1, value: res.data[0][0]?.value || 'Failed to fetch', error: res.error };
                }


            } else {
                return { msg: -1, value: 'Failed to fetch', error: res.error }
            }
        } catch (e) {
            console.log("error", e);
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async stopPaginationData(body: stoppaginationReq): Promise<paginationRes> {
        this.paginate.update_final(body.nPtaskid, body.nMasterid, 'S');
        this.paginate.paginationProcess.filter(e => e.nPtaskid === body.nPtaskid).map(e => e["isProcess"] = false);
        return { msg: 1, value: 'File Pagination in process' };
    }


}