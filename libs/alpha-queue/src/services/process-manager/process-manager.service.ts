import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { EventEmitter } from 'events';
import { DynamicQueueService } from "../dynamic-queue/dynamic-queue.service";
import { LogService } from "@app/global/utility/log/log.service";
import { AlphaQueueOptions, QueueStep } from "@app/alpha-queue/interfaces/queue.interface";
import Bull from "bull";

@Injectable()
export class ProcessManager extends EventEmitter2 implements OnModuleInit, OnModuleDestroy {



  private readonly logger = new Logger('alpha-queue-process-manager');
  private activeUserTasks: Map<string, Set<{ jobId: number | string; processorType: string }>> = new Map();
  constructor(private readonly logService: LogService, private dynamicQueueService: DynamicQueueService,
    @Inject('QUEUE_CONFIG') private config: AlphaQueueOptions
  ) {
    super();
  }


  async onModuleDestroy() {
    // Cleanup all workers
  }


  async onModuleInit() {

  }

  private removeUserTask(masterId: string, task: { jobId: any; processorType: string }): void {
    const userTasks = this.activeUserTasks.get(masterId);
    if (userTasks) {
      // Remove the task by comparing both jobId and processorType
      userTasks.forEach(existingTask => {
        if (existingTask.jobId === task.jobId &&
          existingTask.processorType === task.processorType) {
          userTasks.delete(existingTask);
        }
      });

      if (userTasks.size === 0) {
        this.activeUserTasks.delete(masterId);
      }
    }
  }

  /* async executeProcessor(processorType: string, data: any, masterId: string, stepDetail: QueueStep): Promise<EventEmitter> {
     const eventEmitter = new EventEmitter();
     try {
       const queue = this.dynamicQueueService.getQueue(processorType);
 
       queue.on('completed', (job) => {
         // this.logger.warn(`Job ${processorType} with ID ${job?.id} has completed`);
         if (job.data?.id == data?.id) {
           eventEmitter.emit('complete', job.data);
           this.removeUserTask(masterId, { jobId: job?.id, processorType });
         }
       });
 
       queue.on('failed', (job, err) => {
         // this.logger.error(`Job ${processorType} with ID ${job.id} failed with error: ${err.message}`);
         if (job.data?.id == data?.id) {
           eventEmitter.emit('failed', new Error(err.message));
           this.removeUserTask(masterId, { jobId: job?.id, processorType });
         }
       });
       // cleaned 
       queue.on('error', (error) => {
         this.logger.error('An error occurred in the queue:', error);
       });
 
 
       const logPath = `queue/${this.config.nTCatid}/${masterId}/${stepDetail?.nRid}/${data?.id}`;
 
       // this.logger.warn(`adding to ${processorType} ${data?.id}`)
       const job = await queue.add({ data, step: processorType, processName: this.config.name, masterId, id: data?.id, nRid: stepDetail?.nRid, nTCatid: this.config.nTCatid, logPath }, { removeOnComplete: true, removeOnFail: true, timeout: stepDetail.timeout, attempts: 1, backoff: 1000 * 60 * 5 });
       // this.logger.log(`Pushed to  ${processorType} ${data?.id} jobid:${job?.id}`)
 
       if (!this.activeUserTasks.has(masterId)) {
         this.activeUserTasks.set(masterId, new Set());
       }
       this.activeUserTasks.get(masterId).add({
         jobId: job.id,
         processorType
       });
 
       queue.on('progress', (jobProgress, progress) => {
         // this.logger.warn(`progress ${progress?.type}`)
         if (jobProgress.id === job.id && progress?.event === 'info-event') {
           try {
             const { type, data } = progress;
             const processId = this.filterProcessId(data?.masterId)
             // this.manageReport(type, data, data?.userId, processId);
           } catch (error) {
           }
 
           // this.eventEmitter.emit(progress?.type, progress?.data);
         } else if (jobProgress.id === job.id && progress?.event === 'log-event') {
           // this.logTask(job.data, stepDetail, masterId);
         }
       });
     } catch (error) {
       this.logger.error(`Error ${processorType} ${error?.message}`)
       eventEmitter.emit('failed', new Error(error.message));
     }
 
     return eventEmitter
   }*/



  /* async executeProcessor(processorType: string, data: any, masterId: string, stepDetail: QueueStep): Promise<any> {
 
 
     return new Promise(async (resolve, reject) => {
 
       try {
         const queue = this.dynamicQueueService.getQueue(processorType);
 
         queue.on('completed', (job) => {
           // this.logger.warn(`Job ${processorType} with ID ${job?.id} has completed`);
           if (job.data?.id == data?.id) {
             this.removeUserTask(masterId, { jobId: job?.id, processorType });
             resolve(job.data)
           }
         });
 
         queue.on('failed', (job, err) => {
           // this.logger.error(`Job ${processorType} with ID ${job.id} failed with error: ${err.message}`);
           if (job.data?.id == data?.id) {
             this.removeUserTask(masterId, { jobId: job?.id, processorType });
             reject(err.message)
           }
         });
         // cleaned 
         queue.on('error', (error) => {
           this.logger.error('An error occurred in the queue:', error);
         });
 
 
         const logPath = `queue/${this.config.nTCatid}/${masterId}/${stepDetail?.nRid}/${data?.id}`;
 
         // this.logger.warn(`adding to ${processorType} ${data?.id}`)
         const job = await queue.add({ data, step: processorType, processName: this.config.name, masterId, id: data?.id, nRid: stepDetail?.nRid, nTCatid: this.config.nTCatid, logPath }, { removeOnComplete: true, removeOnFail: true, timeout: stepDetail.timeout, attempts: 1, backoff: 1000 * 60 * 5 });
         // this.logger.log(`Pushed to  ${processorType} ${data?.id} jobid:${job?.id}`)
 
         if (!this.activeUserTasks.has(masterId)) {
           this.activeUserTasks.set(masterId, new Set());
         }
         this.activeUserTasks.get(masterId).add({
           jobId: job.id,
           processorType
         });
 
         queue.on('progress', (jobProgress, progress) => {
           // this.logger.warn(`progress ${progress?.type}`)
           if (jobProgress.id === job.id && progress?.event === 'info-event') {
             try {
               const { type, data } = progress;
               const processId = this.filterProcessId(data?.masterId)
               // this.manageReport(type, data, data?.userId, processId);
             } catch (error) {
             }
 
             // this.eventEmitter.emit(progress?.type, progress?.data);
           } else if (jobProgress.id === job.id && progress?.event === 'log-event') {
             // this.logTask(job.data, stepDetail, masterId);
           }
         });
       } catch (error) {
         this.logger.error(`Error ${processorType} ${error?.message}`)
         reject(error.message)
       }
     });
 
 
   }*/


  async executeProcessor(processorType: string, data: any, masterId: string, stepDetail: QueueStep): Promise<any> {
    this.logger.verbose(`Adding to bull queue ${processorType}`)
    const queue = this.dynamicQueueService.getQueue(processorType);
    // const logPath = `queue/${this.config.nTCatid}/${masterId}/${stepDetail?.nRid}/${data?.id}`;
    const logPath = `queue-report/${this.config.nTCatid}/${masterId}/${stepDetail?.nRid}/${data?.id}`;

    return new Promise((resolve, reject) => {

      const cleanup = (jobId: number | string | null) => {
        queue.removeListener('completed', completeHandler);
        queue.removeListener('failed', failureHandler);
        queue.removeListener('progress', progressHandler);
        if (jobId) {
          this.removeUserTask(masterId, { jobId, processorType });
        }
      };

      const completeHandler = (completedJob: Bull.Job) => {
        this.logger.verbose(`TASK COMPLETE OF ${data?.id}`)
        if (completedJob.data?.id === data?.id) {
          cleanup(completedJob.id);
          resolve(completedJob.data);
        }
      };

      const failureHandler = (failedJob: Bull.Job, err: Error) => {
        this.logger.error(`TASK FAILED OF ${data?.id}`)
        if (failedJob.data?.id === data?.id) {
          cleanup(failedJob.id);
          reject(new Error(err.message));
        }
      };

      const progressHandler = (jobProgress: Bull.Job, progress: any) => {
        this.logger.verbose(`TASK process ${data?.id}`)
        if (jobProgress.id && progress?.event === 'info-event') {
          const { type, data } = progress;
          // const processId = this.filterProcessId(data?.masterId);
          // Handle progress updates if needed
        }

      };

      queue.on('completed', completeHandler);
      queue.on('failed', failureHandler);
      queue.on('progress', progressHandler);

      queue.add(
        {
          data,
          step: processorType,
          processName: this.config.name,
          masterId,
          id: data?.id,
          nRid: stepDetail?.nRid,
          nTCatid: this.config.nTCatid,
          logPath
        },
        {
          removeOnComplete: true,
          removeOnFail: true,
          timeout: stepDetail.timeout,
          attempts: 1,
          backoff: 1000 * 60 * 5
        }
      )
      .then(async (job) => {
        // await this.redis.sadd('activeJobs', job.id.toString()); // Store job ID in Redis
        this.logger.verbose(`Added to queue with ID: ${job.id}`);
      }).catch(error => {
        cleanup(null);
        this.logger.error(`Failed to add job: ${error.message}`)
        reject(new Error(`Failed to add job: ${error.message}`));
      });
      this.logger.verbose(`Addedtoqueue`)
      setTimeout(() => {
        cleanup(null);
        this.logger.error(`Job processing timeout`)
        reject(new Error('Job processing timeout'));
      }, stepDetail.timeout || 3600000);
    });
  }



  filterProcessId(masterId: string): number {
    return Number(masterId?.replace(/\D/g, '') || '0');
  }

}