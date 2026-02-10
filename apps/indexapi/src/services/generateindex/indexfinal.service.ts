import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { fileListReq, fileListRes } from '../../interfaces/index.interface';
import { UtilityService } from '../../utility/utility.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { LogService } from '@app/global/utility/log/log.service';


@Injectable()
export class IndexFinalService {

    private readonly logApp: string = 'indexing';
    constructor(private db: DbService, private readonly utility: UtilityService,
        @InjectQueue('indexgenerate-download') private taskQueue: Queue
        , private readonly logService: LogService) {
        // console.log('step 0', __dirname);


        this.taskQueue.on('completed', async (job, result) => {
            console.log(`ACTIVE JOB FOR COMPLETE ${job} completed `);
            // this.onDecreaseJob(job);
            if (global.gc) {
                global.gc();
            }
        });
    }

    async getIndexData(body: fileListReq): Promise<fileListRes> {

        body["ref"] = 3
        this.logService.info(`Generate index Request for   case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        // this.logService.info(`Request for get Data  case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        // this.db.executeRef('index_getfiles', body).then(async (res) => {
        //     try {
        //         this.logService.info(`GetData reponce success add in queue case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        //         const [casedetail, bundlelist, tablelist] = res.data;
        //         const path = `doc/case${body.nCaseid}/index_${body.nSectionid}_${new Date().getTime()}.pdf`;
        //         let obj = { casedetail: casedetail[0], tablelist: tablelist, bundlelist: bundlelist, path: path, body: body };
        //         this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
        //         await this.taskQueue.add('process-indexing', obj, {
        //             attempts: 5, // Retry up to 5 times
        //             backoff: {
        //                 type: 'exponential', // Use exponential backoff strategy
        //                 delay: 1000, // Start with a 1-second delay
        //             },
        //         });
        //         this.logService.info(`Added in queue successfully`, this.logApp)
        //     } catch (error) {
        //         console.log(error);
        //         this.logService.error(`Indexing failed with error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        //         this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
        //         return { msg: -1, value: 'Failed to fetch data', error: error };
        //     }
        // }, (error) => {
        //     this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp)
        //     this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
        //     return { msg: -1, value: 'Failed to fetch data', error: error };
        // })
        let obj = { body: body };
        await this.taskQueue.add('process-indexing', obj, {
            attempts: 5, // Retry up to 5 times
            backoff: {
                type: 'exponential', // Use exponential backoff strategy
                delay: 1000, // Start with a 1-second delay
            },
        });
        this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });

        return { msg: 1, value: 'File Indexing in process' };

    }



}
