// mipl-queue.service.ts

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { LogService } from '@app/global/utility/log/log.service';
import { MiplQueueOptions, QueueProgressSummary, queueTaskList } from '../../interfaces/mipl.queue.interface';
import { QueueConnectionManager } from '../queue-connection/queue-connection.manager';
import { UserQueueManager } from '../user-queue/user-queue.manager';
import { QueueProgressTracker } from '../queue-progress/queue-progress.tracker';
import { DeadLetterManager } from '../dead-letter/dead-letter.manager';

@Injectable()
export class MiplQueueService implements OnModuleInit {
    private readonly appName: string;

    constructor(
        @Inject('QUEUE_CONFIG') private config: MiplQueueOptions,
        private readonly connectionManager: QueueConnectionManager,
        private readonly userQueueManager: UserQueueManager,
        private readonly progressTracker: QueueProgressTracker,
        private readonly deadLetterManager: DeadLetterManager,
        private readonly globalEventEmitter: EventEmitter2,
        private readonly logService: LogService
        // @Inject('QUEUE_NAME') queueName: string
    ) {
        this.appName = `queue/${this.config.name}`;
        this.config.maxUsers = this.config.maxUsers || 3;


    }
    async onModuleInit() {
        try {
            this.logService.info('Initializing queue module...', this.appName);

            // Initialize connections and setup
            await this.connectionManager.initialize();
            await this.progressTracker.initialize();
            await this.deadLetterManager.initialize();
            await this.userQueueManager.initialize();

            this.logService.info('Queue module initialized successfully', this.appName);
        } catch (error) {
            this.logService.error(`Queue module initialization failed: ${error?.message}`, this.appName);
            throw error; // Let NestJS handle the error
        }
    }

    async onApplicationShutdown() {
        try {
            this.logService.info('Shutting down queue module...', this.appName);
            await this.connectionManager.shutdown();
            this.logService.info('Queue module shutdown complete', this.appName);
        } catch (error) {
            this.logService.error(`Queue module shutdown failed: ${error?.message}`, this.appName);
            throw error;
        }
    }
    private generateRandomId() {
        return Math.floor(Math.random() * 900000000000) + 100000000000;
    }
    async generateTasksForQueue(userId: string, tasks: any[]): Promise<queueTaskList[]> {

        try {
            this.logService.info(`Generating tasks for user ${userId}`, this.appName);

            return tasks.map(a => { return { id: `${a.id}:${this.generateRandomId()}`, data: a } }); //processName: this.config.name, 

        } catch (error) {
            this.logService.error(`Failed to generate tasks for user ${userId}: ${error?.message}`, this.appName);

            return [];
        }

    }

    async addTasks(userId: string, ls: any[]) {
        await this.connectionManager.checkConnections();
        this.logService.info(`Adding ${ls.length} tasks for user ${userId}`, this.appName);

        try {
            const tasks: queueTaskList[] = await this.generateTasksForQueue(userId, ls);

            // Initialize progress tracking
            await this.progressTracker.initializeQueueProgress(userId, tasks.length);

            // Add tasks to queue
            await this.userQueueManager.addTasksToQueue(userId, tasks);

            const activeCount = await this.userQueueManager.getActiveUsersCount();

            return {
                success: true,
                message: `Added ${tasks.length} tasks for user ${userId}`,
                queued: activeCount >= this.config.maxUsers
            };
        } catch (error) {
            this.logService.error(`Failed to add tasks for user ${userId}: ${error?.message}`, this.appName);
            throw new Error(`Failed to add tasks: ${error?.message}`);
        }
    }

    async getQueueStatus() {
        try {
            const status = await this.userQueueManager.getQueueStatus();
            const deadLetterStatus = await this.deadLetterManager.getStatus();

            return {
                ...status,
                deadLetter: deadLetterStatus
            };
        } catch (error) {
            this.logService.error(`Failed to get queue status: ${error?.message}`, this.appName);
            throw error;
        }
    }

    async getQueueSummary(userId: string): Promise<QueueProgressSummary | null> {
        try {
            return await this.progressTracker.getQueueSummary(userId);
        } catch (error) {
            this.logService.error(
                `Failed to get queue summary for user ${userId}: ${error?.message}`,
                this.appName
            );
            throw error;
        }
    }


    async stopQueue(userId: string) {
        try {
            this.logService.log(
                `Stoping queue for ${userId}`,
                this.appName
            );
            await this.userQueueManager.forceStopUser(userId);
        } catch (error) {
            this.logService.error(
                `Failed to stop queue for user ${userId}: ${error?.message}`,
                this.appName
            );
        }
    }


    async getActiveTasks(userId: string) {
        try {
            const data = await this.userQueueManager.getUnackedMessages(userId);
            return data
        } catch (error) {
            return [];
        }

    }


    async getSummary(userId: string):Promise<any> {

        try {
            const data = await this.userQueueManager.getReportByUserId(userId);
            return data
        } catch (error) {
            return [];
        }
    }

}