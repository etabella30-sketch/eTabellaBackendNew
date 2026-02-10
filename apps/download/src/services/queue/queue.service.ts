import { Injectable } from '@nestjs/common';
import * as Bull from 'bull';
import { fork } from 'child_process';

@Injectable()
export class QueueService {
  private queues: Map<string, Bull.Queue> = new Map();
  private workers: Map<string, any> = new Map();

  createQueue(queueName: string): Bull.Queue {
    if (this.queues.has(queueName)) {
      return this.queues.get(queueName);
    }

    const queue = new Bull(queueName, {
      redis: {
        port: Number(process.env.REDIS_PORT),
        host: process.env.REDIS_IP,
        password: process.env.REDIS_PASSWORD,
      },
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    });

    this.queues.set(queueName, queue);

    // Spawn a worker process for this queue
    this.spawnWorker(queueName);

    return queue;
  }

  private spawnWorker(queueName: string): void {
    if (this.workers.has(queueName)) {
      console.log(`Worker already exists for queue: ${queueName}`);
      return;
    }

    const workerProcess = fork('./download.worker.js', [queueName]);
    this.workers.set(queueName, workerProcess);

    workerProcess.on('exit', (code) => {
      console.log(`Worker for queue ${queueName} exited with code ${code}`);
      this.workers.delete(queueName);
    });

    console.log(`Worker process spawned for queue: ${queueName}`);
  }

  deleteQueue(queueName: string): void {
    const queue = this.queues.get(queueName);
    const worker = this.workers.get(queueName);

    if (worker) {
      worker.kill(); // Terminate worker process
      this.workers.delete(queueName);
    }

    if (queue) {
      queue.close();
      this.queues.delete(queueName);
    }
  }
}
