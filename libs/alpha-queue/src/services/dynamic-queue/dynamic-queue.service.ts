import { getQueueToken } from "@nestjs/bull";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { Queue } from "bull";

// dynamic-queue.service.ts
@Injectable()
export class DynamicQueueService {
  private queues: Map<string, Queue> = new Map();

  private readonly logger = new Logger('queue-service');
  constructor(
    @Inject('QUEUE_CONFIG') private config: any,
    private moduleRef: ModuleRef
  ) { }

  onModuleInit() {
    // Initialize queues based on configuration
    if (this.config.steps) {
      this.config.steps.forEach(step => {
        try {
          const queue = this.moduleRef.get<Queue>(getQueueToken(step.queue), { strict: false });
          if (queue) {
            this.logger.warn('Queue found')
            this.queues.set(step.queue, queue);

            // this.setMsgToQueue(queue)

          } else {
            this.logger.error(`Queue ${step.queue} not found in moduleRef`);
          }
        } catch (error) {
          console.error(`Error getting queue ${step.queue}:`, error.message);
        }
      });

      // this.config.steps.forEach(step => {
      //   const queue = this.moduleRef.get<Queue>(getQueueToken(step.queue));
      //   this.queues.set(step.queue, queue);
      // });

    }




  }



  // async setMsgToQueue(queue) {
  //   await queue.add({ alpha: 1 }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
  // }

  getQueue(queueName: string): Queue {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }
    return queue;
  }

  getAllQueues(): Map<string, Queue> {
    return this.queues;
  }
}