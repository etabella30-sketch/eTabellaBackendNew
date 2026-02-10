import { Injectable } from '@nestjs/common';
import { gethyperlinkReq, hyperlinkProcess, hyperlinkReq } from '../../interfaces/hyperlink.interface';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class GeneratehyperlinkService {

  constructor(private readonly redisDbService: RedisDbService, @InjectQueue('hyperlink-queue') private hyperlinkQueue: Queue, @InjectQueue('hyperlink-index-queue') private hyperlinkIndexQueue: Queue) {
    this.hyperlinkQueue.on('completed', (job) => {
      console.log(`Job with ID ${job.id} has completed`);
    });

    this.hyperlinkQueue.on('failed', (job, err) => {
      console.log(`Job with ID ${job.id} failed with error: ${err.message}`);
    });

    this.hyperlinkQueue.on('stalled', (job) => {
      console.log(`Job with ID ${job.id} stalled`);
    });
    this.hyperlinkQueue.on('waiting', (jobId) => {
      console.log(`Job with ID ${jobId} is waiting to be processed`);
    });
    this.hyperlinkQueue.on('active', (job, jobPromise) => {
      console.log(`Job with ID ${job.id} has started processing`);
    });
    
    this.hyperlinkQueue.on('paused', () => {
      console.log('The queue has been paused');
    });
    this.hyperlinkQueue.on('resumed', () => {
      console.log('The queue has been resumed');
    });
    this.hyperlinkQueue.on('removed', (job) => {
      console.log(`Job with ID ${job.id} has been removed from the queue`);
    });
    
    this.hyperlinkQueue.on('delayed', (jobId) => {
      console.log(`Job with ID ${jobId} is delayed`);
    });
    this.hyperlinkQueue.on('drained', () => {
      console.log('The queue has been drained (no more jobs to process)');
    });
    
    this.hyperlinkQueue.on('error', (error) => {
      console.error('An error occurred in the queue:', error);
    });
    
  }



  async starthyperlink(body: hyperlinkReq, isIndex: boolean, isDeepscan?: boolean): Promise<any> {
    console.log('Hyperlink req', body)

    if (!body.nSectionid) {
      return { msg: -1, value: 'nSectionid is required' };
    }

    const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}/${body.nSectionid}/${body.nBundledetailid || null}`;
    const dataHyperlink = await this.redisDbService.getValue(name);

    if (dataHyperlink) {
      return { msg: -1, value: 'Hyperling already in progress' };
    }

    const obj: hyperlinkProcess = {
      queueName: name,
      nCaseid: body.nCaseid,
      nSectionid: body.nSectionid,
      nMasterid: body.nMasterid,
      nBundledetailid: body.nBundledetailid,
      nBundleid: body.nBundleid,
      cType: body.cType,
      nTotal: 0,
      nCompleted: 0,
      nFailed: 0,
      cStatus: 'P',
      cKeeptype: body.cKeeptype || 'R',
      isDeepscan: isDeepscan
    };
    try {

      if (isIndex)
        await this.hyperlinkIndexQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
      else
        await this.hyperlinkQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });

      // if (!isIndex && !isDeepscan)
      //   await this.hyperlinkQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
      // else if (isIndex && !isDeepscan)
      //   await this.hyperlinkIndexQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //
      // else if (isDeepscan)
      //   await this.hyperlinkQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }); //

      await this.redisDbService.setValue(name, JSON.stringify(obj));
      return { msg: 1, value: 'Hyperlink process started', data: obj };
    } catch (error) {
      return { msg: -1, value: 'Failed to start hyperlink process', error: error.message };

    }
  }








  async getHyperLinkProgress(body: gethyperlinkReq) {
    const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}`;
    const dataHyperlinkList = await this.redisDbService.getAllValuesWithPrefix(name) || [];
    console.log(name, dataHyperlinkList)
    if (dataHyperlinkList && dataHyperlinkList.length) {
      return { msg: 1, value: dataHyperlinkList };
    } else {
      return { msg: -1, value: 'Hyperling not in progress' };
    }
  }


}
