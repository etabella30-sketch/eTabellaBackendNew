import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { DynamicQueueService } from '../services/dynamic-queue/dynamic-queue.service';

interface QueueStep {
  queue: string;
  concurrency?: number;
  maxRetries?: number;
  options?: {
    timeout: number;
  };
}

interface QueueConfig {
  name?: string;
  steps: QueueStep[];
  maxUsers?: number;
  preloadWorkers?: boolean;
  parallelWorkersCreation?: number;
}
@Module({})
export class QueueModule {
  static async registerQueuesAsync(DirectOptions,options: any): Promise<any> {
    // const data = 
    const queueConfig: QueueConfig = await options
    // console.log('Queue Configuration:', queueConfig);

    const steps = queueConfig.steps || [];

    // Include both the main queue name and step queues
    const queueNames = new Set<string>([
      ...steps.map(step => step.queue)
    ]);

    console.log('Registering queues:', Array.from(queueNames));

    const queueModules = steps.map((queue) =>
      BullModule.registerQueue({
        name: queue.queue,
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: true,
        },
        limiter: {
          max: 1000, // Max jobs in Redis
          duration: 60000, // 1-minute window
        },
      }),
    );

    return {
      module: QueueModule,
      imports: [
        BullModule.forRoot({}), // Ensure BullModule is properly initialized
        ...queueModules
      ],
      providers: [{
        provide: 'QUEUE_CONFIG',
        useFactory: DirectOptions.useFactory,
        inject: DirectOptions.inject || [],
      }, DynamicQueueService],
      exports: [BullModule, ...queueModules, DynamicQueueService],
    };
    // return {
    //   module: QueueModule,
    //   imports: queueModules,
    //   exports: queueModules,
    // };
  }


}