import { DbService } from '@app/global/db/pg/db.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { uploadStatusSet } from '../../interfaces/chunk.interface';
// import { AlphaQueueService } from '@app/alpha-queue';
import { schemaType } from '@app/global/interfaces/db.interface';
import { queueCreateOptions } from 'libs/alpha-queue/src/interfaces/queue.interface';



@Injectable()
export class QueueManageService {
  elasticOptions: queueCreateOptions = {
    nTCatid: 6, MASTER_QUEUE: 'pdfextraction',
    steps: [
      { nRid: 8, name: 'DOWNLOAD', queue: 'download-document-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5 },
      { nRid: 9, name: 'EXTRACTION', queue: 'elastic-index-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5, isMain: true, onFailed: 1 },
      { nRid: 10, name: 'DELETE', queue: 'delete-document-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5 }
    ]
  };

  schema: schemaType = 'task'
  private readonly logger = new Logger('file-copy-queue');
  constructor(
    private db: DbService
    //, @Inject('demo-queue') private demoQueue: AlphaQueueService
  ) {

  }




  async createElasticTask(body: uploadStatusSet): Promise<boolean> {
    try {
      /*const res = await this.db.executeRef('elasticsearch_upload_insert_tasks', body, this.schema);
      if (res.success) {
        const data = res.data[0][0];
        if (data.msg == 1) {
          this.logger.warn('Craeting task for ', data);
          await this.demoQueue.createTask(data.nTid, data.nTotal, { nUpid: body.nUPid, nUserid: body.nMasterid, nCaseid: data?.nCaseid }, data.keepAlive, this.elasticOptions);
        }
      }*/
      return true;
    } catch (error) {
      return false;
    }
  }



  async insertTask(nBundledetailid: string, nUPid: string, cPath: string): Promise<boolean> {
    try {
      const res = await this.db.executeRef('elasticsearch_upload_add_task', { nBundledetailid, nUPid }, this.schema);
      if (res.success) {
        const data = res.data[0][0];
        if (data.msg == 1) {
          this.logger.warn(`Pushin into queue `, { ...data, nBundledetailid, nUPid, cPath })
          // await this.demoQueue.pushTask(this.elasticOptions.MASTER_QUEUE, String(data.nTid), this.elasticOptions.steps[0], { ...data, id: nBundledetailid, nBDid: nBundledetailid, nUPid, cPath }, this.elasticOptions);
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  // et_elasticsearch_upload_add_task

}
