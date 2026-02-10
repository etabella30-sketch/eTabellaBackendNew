import { Inject, Injectable, Logger, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter } from 'events';
import { LogService } from '@app/global/utility/log/log.service';
import { MiplQueueOptions } from '@app/mipl-queue/interfaces/mipl.queue.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DynamicQueueService } from '../dynamic-queue/dynamic-queue.service';
import { QueueProgressTracker } from '../queue-progress/queue-progress.tracker';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';

@Injectable()
export class ProcessManager extends EventEmitter2 implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger('mipl-queue');
    // private activeUserTasks: Map<string, Set<any>> = new Map();
    private activeUserTasks: Map<string, Set<{ jobId: number | string; processorType: string }>> = new Map();

    private appName: string = '';
    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        private readonly logService: LogService,
        private readonly eventEmitter: EventEmitter2,
        private dynamicQueueService: DynamicQueueService,
        private readonly progressTracker: QueueProgressTracker,
        private readonly datetime: DateTimeService
        // @InjectQueue('hyperlink-queue') private hyperlinkQueue: Queue, 
    ) {
        super();
        this.appName = `queue/${this.config.name}`;
    }

    async initializeWorkers(): Promise<void> {

    }

    async forceStopUserTasks(userId: string): Promise<void> {
        this.logService.warn(`Force stopping tasks for user ${userId}`, this.appName);
        try {
            const userTasks = this.activeUserTasks.get(userId);
            if (userTasks) {
                // Remove the task by comparing both jobId and processorType
                userTasks.forEach(async (existingTask) => {
                    try {
                        await this.deleteJobFromQueue(existingTask.processorType, existingTask.jobId)
                    } catch (error) {
                    }
                    userTasks.delete(existingTask);
                });
                if (userTasks.size === 0) {
                    this.activeUserTasks.delete(userId);
                }
            }

            this.activeUserTasks.delete(userId);
          
        } catch (error) {
            this.logService.error(
                `Error stopping tasks for user ${userId}: ${error.message}`,
                this.appName
            );
        }
    }

    private removeUserTask(userId: string, task: { jobId: any; processorType: string }): void {
        const userTasks = this.activeUserTasks.get(userId);
        if (userTasks) {
            // Remove the task by comparing both jobId and processorType
            userTasks.forEach(existingTask => {
                if (existingTask.jobId === task.jobId &&
                    existingTask.processorType === task.processorType) {
                    userTasks.delete(existingTask);
                }
            });

            if (userTasks.size === 0) {
                this.activeUserTasks.delete(userId);
            }
        }
    }

    async onModuleDestroy() {
        // Cleanup all workers
        await this.cleanupWorkers();
    }

    async cleanupWorkers(): Promise<void> {
        this.logger.warn('Cleaning up workers')
        try {
            this.activeUserTasks.clear();
        } catch (error) {
            this.logService.error(
                `Failed to cleanup worker memory: ${error.message}`,
                this.appName
            );
        }
    }

    async getActiveTasksInfo(userId: string): Promise<{
        taskCount: number;
        taskIds: string[];
        processors: string[];
    }> {
        const userTasks = this.activeUserTasks.get(userId);
        if (!userTasks) {
            return { taskCount: 0, taskIds: [], processors: [] };
        }

        const tasks = Array.from(userTasks);
        return {
            taskCount: userTasks.size,
            taskIds: tasks.map(task => String(task.jobId)),
            processors: tasks.map(task => task.processorType)
        };
    }

    async onModuleInit() {

    }

    async deleteJobFromQueue(processorType: string, jobId: string | number): Promise<void> {
        const queue = this.dynamicQueueService.getQueue(processorType);
        try {
            const job = await queue.getJob(jobId);
            if (job) {
                await job.remove();
            } else {
                throw new NotFoundException(`Job with ID ${jobId} not found in queue ${processorType}`);
            }
        } catch (error) {
            throw new Error(`Failed to delete job ${jobId} from queue ${processorType}: ${error.message}`);
        }
    }

    async executeProcessor(processorType: string, data: any, userId: string): Promise<EventEmitter> {
        const eventEmitter = new EventEmitter();
        try {
            const queue = this.dynamicQueueService.getQueue(processorType);

            queue.on('completed', (job) => {
                this.logger.warn(`Job ${processorType} with ID ${job?.id} has completed`);
                if (job.data?.id == data?.id) {
                    eventEmitter.emit('complete', job.data);
                    this.removeUserTask(userId, { jobId: job?.id, processorType });
                }
            });
            queue.on('failed', (job, err) => {
                this.logger.error(`Job ${processorType} with ID ${job.id} failed with error: ${err.message}`);
                if (job.data?.id == data?.id) {
                    eventEmitter.emit('failed', new Error(err.message));
                    this.removeUserTask(userId, { jobId: job?.id, processorType });
                }
            });
            // this.eventEmitter.emit(message?.body?.type, message?.body?.data);
            queue.on('error', (error) => {
                this.logger.error('An error occurred in the queue:', error);
            });

            this.logger.warn(`adding to ${processorType} ${data?.id}`)
            const job = await queue.add(data, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            // this.logger.log(`Pushed to  ${processorType} ${data?.id} jobid:${job?.id}`)

            if (!this.activeUserTasks.has(userId)) {
                this.activeUserTasks.set(userId, new Set());
            }
            this.activeUserTasks.get(userId).add({
                jobId: job.id,
                processorType
            });

            queue.on('progress', (jobProgress, progress) => {
                this.logger.warn(`progress ${progress?.type}`)
                if (jobProgress.id === job.id && progress?.event === 'info-event') {
                    try {
                        const { type, data } = progress;
                        const processId = this.filterProcessId(data?.userId)
                        this.manageReport(type, data, data?.userId, processId);
                    } catch (error) {

                    }

                    // this.eventEmitter.emit(progress?.type, progress?.data);
                }
            });
        } catch (error) {
            this.logger.error(`Error ${processorType} ${error?.message}`)
            eventEmitter.emit('failed', new Error(error.message));
        }

        return eventEmitter;
    }

    getProcessName(type: string) {
        return this.config.steps?.find(a => a.queue == type)?.name || '';
    }

    filterProcessId(userId: string): number {
        return Number(userId?.replace(/\D/g, '') || '0');
    }


    async manageReport(type: string, data: any, userId: string, processId: number) {
        const processName = this.getProcessName(type);
        try {
            this.logService.report(`${processName} ${data?.EventType} for ${data?.data?.nBundledetailid} ${data?.error || ''}`, `${this.config.name}/${processId}/${data?.data?.nBundledetailid || 0}`);
            if (data?.EventType == 'START') {
                this.updateTaskProgress(processId, processName, data?.data?.nBundledetailid);
            } else {
                this.deleteTaskProgress(processId, data?.data?.nBundledetailid);
            }
        } catch (error) {
        }

        try {
            this.menageTaskLog(processId, processName, data?.EventType, data?.data || {})
        } catch (error) {
        }
    }

    async updateTaskProgress(processId: number, process: string, nBundledetailid: number) {
        if (!nBundledetailid) return;
        await this.progressTracker.updateTaskProgress(`${this.config.name}:${processId}:PROGESS:${nBundledetailid}`, process);
    }

    async deleteTaskProgress(processId: number, nBundledetailid: number) {
        if (!nBundledetailid) return; // Ensure valid ID is provided
        try {
            const key = `${this.config.name}:${processId}:PROGESS:${nBundledetailid}`;
            await this.progressTracker.deleteValue(key);
            this.logger.warn(`Deleting`, key)
        } catch (error) {
            this.logger.error(`Failed to delete task progress for ${nBundledetailid}`, error);
        }
    }

    async menageTaskLog(processId: number, processName: string, EventType: string, data: any) {
        try {
            if (!processId || !data?.nBundledetailid) return;
            const mainKey = `${this.config.name}:${processId}:${data?.nBundledetailid}`;
            await this.progressTracker.updateInfo(mainKey, `${processName}:${EventType}`, this.datetime.getCurrentTime(), 86400);
        } catch (error) {
            this.logger.error('error : ', error);
        }
    }

}