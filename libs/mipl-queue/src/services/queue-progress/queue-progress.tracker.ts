import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { Pipeline } from 'ioredis';
import { MiplQueueOptions, QueueProgressSummary } from '../../interfaces/mipl.queue.interface';
import { LogService } from '@app/global/utility/log/log.service';
import { QueueConnectionManager } from '../queue-connection/queue-connection.manager';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';

@Injectable()
export class QueueProgressTracker {
    private appName = 'queue/progress-tracker';
    private readonly logger = new Logger('progress-tracker');
    private readonly PROGRESS_EXPIRY = 24 * 60 * 60; // 24 hours in seconds
    private redis: Redis;

    private isInitialized = false;
    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        private readonly connectionManager: QueueConnectionManager,
        private readonly logService: LogService, private datetime: DateTimeService
    ) {
        this.appName = `queue/${this.config.name}`;
    }


    async initialize(): Promise<void> {
        try {
            this.redis = this.connectionManager.getRedisClient();
            this.isInitialized = true;
            this.logService.info('Progress tracker initialized successfully', this.appName);
        } catch (error) {
            this.logService.error(`Failed to initialize progress tracker: ${error?.message}`, this.appName);
            throw error;
        }
    }

    private async ensureInitialized(): Promise<void> {
        if (!this.isInitialized || !this.redis) {
            await this.initialize();
        }
    }

    async initializeQueueProgress(userId: string, totalTasks: number): Promise<void> {
        await this.ensureInitialized();

        const progressKey = this.getProgressKey(userId);

        const initialProgress = {
            'total_tasks': totalTasks,
            'total_completed': 0,
            'total_failed': 0,
            'start_time': this.datetime.getCurrentTime(),
            'last_updated': this.datetime.getCurrentTime()
        };

        try {
            const multi = this.redis.multi();
            if (!multi) {
                throw new Error('Failed to create Redis transaction');
            }

            // Initialize base progress metrics
            multi.hmset(progressKey, initialProgress);

            // Initialize step-specific metrics
            this.config.steps.forEach(step => {
                const stepMetrics = {
                    [`${step.queue}:completed`]: 0,
                    [`${step.queue}:failed`]: 0,
                    [`${step.queue}:pending`]: totalTasks,
                    [`${step.queue}:processing`]: 0
                };
                multi.hmset(progressKey, stepMetrics);
            });

            multi.expire(progressKey, this.PROGRESS_EXPIRY);

            const results = await multi.exec();
            if (!results) {
                throw new Error('Failed to execute Redis transaction');
            }

            this.logService.info(
                `Initialized progress tracking for user ${userId} with ${totalTasks} tasks`,
                this.appName
            );
        } catch (error) {
            this.logService.error(
                `Failed to initialize progress tracking for user ${userId}: ${error?.message}`,
                this.appName
            );
            throw new Error(`Progress initialization failed: ${error?.message}`);
        }
    }

    async updateQueueProgress(
        userId: string,
        queueType: string,
        status: 'completed' | 'failed' | 'processing'
    ): Promise<void> {
        const progressKey = this.getProgressKey(userId);

        try {
            const multi = this.redis.multi();

            switch (status) {
                case 'completed':
                    await this.handleCompletedStatus(multi, progressKey, queueType);
                    break;
                case 'failed':
                    await this.handleFailedStatus(multi, progressKey, queueType);
                    break;
                case 'processing':
                    await this.handleProcessingStatus(multi, progressKey, queueType);
                    break;
            }

            multi.hset(progressKey, 'last_updated', this.datetime.getCurrentTime());
            await multi.exec();

            this.logService.info(
                `Updated ${status} status for user ${userId}, queue ${queueType}`,
                this.appName
            );
        } catch (error) {
            this.logService.error(
                `Failed to update progress for user ${userId}: ${error?.message}`,
                this.appName
            );
            throw new Error(`Progress update failed: ${error?.message}`);
        }
    }

    private async handleCompletedStatus(
        multi: any,
        progressKey: string,
        queueType: string
    ): Promise<void> {
        multi
            .hincrby(progressKey, `${queueType}:completed`, 1)
            .hincrby(progressKey, `${queueType}:processing`, -1)
            // .hincrby(progressKey, `${queueType}:pending`, -1)
            .hincrby(progressKey, 'total_completed', 1);
    }

    private async handleFailedStatus(
        multi: any,
        progressKey: string,
        queueType: string
    ): Promise<void> {
        multi
            .hincrby(progressKey, `${queueType}:failed`, 1)
            .hincrby(progressKey, `${queueType}:processing`, -1)
            // .hincrby(progressKey, `${queueType}:pending`, -1)
            .hincrby(progressKey, 'total_failed', 1);
    }

    private async handleProcessingStatus(
        multi: any,
        progressKey: string,
        queueType: string
    ): Promise<void> {
        multi
            .hsetnx(progressKey, 'process_dt', this.datetime.getCurrentTime())  // Only sets if key doesn't exist
            .hincrby(progressKey, `${queueType}:processing`, 1)
            .hincrby(progressKey, `${queueType}:pending`, -1);
    }

    async getQueueSummary(userId: string): Promise<QueueProgressSummary | null> {
        const progressKey = this.getProgressKey(userId);

        try {
            const progressData = await this.redis.hgetall(progressKey);

            if (!progressData || Object.keys(progressData).length === 0) {
                return null;
            }

            return this.formatQueueSummary(progressData);
        } catch (error) {
            this.logService.error(
                `Failed to retrieve progress summary for user ${userId}: ${error?.message}`,
                this.appName
            );
            return {} as QueueProgressSummary | null;
            // throw new Error(`Unable to retrieve progress summary: ${error?.message}`);
        }
    }

    private formatQueueSummary(progressData: Record<string, string>): QueueProgressSummary {
        try {
            const summary: QueueProgressSummary = {
                totalTasks: parseInt(progressData.total_tasks),
                completed: parseInt(progressData.total_completed),
                failed: parseInt(progressData.total_failed),
                pending: parseInt(progressData.total_tasks) -
                    parseInt(progressData.total_completed) -
                    parseInt(progressData.total_failed),
                startTime: progressData.start_time,
                lastUpdated: progressData.last_updated,
                processTime: progressData.process_dt,
                steps: {}
            };

            this.config.steps.forEach(step => {
                summary.steps[step.queue] = {
                    completed: parseInt(progressData[`${step.queue}:completed`]) || 0,
                    failed: parseInt(progressData[`${step.queue}:failed`]) || 0,
                    pending: parseInt(progressData[`${step.queue}:pending`]) || 0,
                    processing: parseInt(progressData[`${step.queue}:processing`]) || 0
                };
            });

            return summary;
        } catch (error) {

            this.logService.error(`Failed to formatQueueSummary: ${error?.message}`, this.appName);
            return {} as QueueProgressSummary
        }

    }

    private getProgressKey(userId: string): string {
        return `queue:${this.config.name}:${userId}`;
    }





    async updateTaskProgress(taskId: string, status: string, progress?: string) {
        try {
            const key = `${taskId}`;
            const pipeline = this.redis.multi();

            // Get current status first to avoid redundant writes
            const currentStatus = await this.redis.hget(key, 'status');

            // Only update if the status has changed
            if (currentStatus !== status) {
                pipeline.hset(key, 'status', status);
            }

            // If progress is provided, update it
            if (progress) {
                pipeline.hset(key, 'progress', progress);
            }

            // Set an expiry to prevent memory overload (24 hours)
            pipeline.expire(key, 86400);

            await pipeline.exec(); // Execute all commands in one request 
        } catch (error) {

        }
    }


    async deleteValue(...key: any): Promise<void> {
        let rs = await this.redis.del(key);
    }



    async updateInfo(mainKey: string, key: string, value: string, ttl?: number): Promise<any> {
        try {
            const multi = this.redis.multi().hset(mainKey, key, value);
            if (ttl && ttl > 0) {
                multi.expire(mainKey, ttl);
            }
            await multi.exec();
        } catch (error) {
            this.logger.error('Redis updateInfo error:', error);
        }
    }

}