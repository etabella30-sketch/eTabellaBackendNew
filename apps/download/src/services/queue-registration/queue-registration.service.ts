import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as Bull from 'bull';

@Injectable()
export class QueueRegistrationService {
  private registeredQueues: Map<string, Queue> = new Map();

  async registerQueue(queueName: string): Promise<Queue> {
    if (this.registeredQueues.has(queueName)) {
      return this.registeredQueues.get(queueName)!; // Return existing queue
    }

    const queue = new Bull(queueName, {
      redis: {
        host: 'localhost', // Update with your Redis host
        port: 6379,        // Update with your Redis port
      },
    });

    this.registeredQueues.set(queueName, queue);
    return queue;
  }

  async unregisterQueue(queueName: string): Promise<void> {
    const queue = this.registeredQueues.get(queueName);
    if (queue) {
      await queue.close();
      this.registeredQueues.delete(queueName);
    }
  }

  getQueue(queueName: string): Queue | undefined {
    return this.registeredQueues.get(queueName);
  }
}
