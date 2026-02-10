// services/user-queue.manager.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MiplQueueOptions } from '../../interfaces/mipl.queue.interface';
import { LogService } from '@app/global/utility/log/log.service';
import { QueueConnectionManager } from '../queue-connection/queue-connection.manager';
import { DeadLetterManager } from '../dead-letter/dead-letter.manager';
import { QueueProgressTracker } from '../queue-progress/queue-progress.tracker';
import { ProcessManager } from '../process-manage/process.manager';
import { queueModel } from '@app/mipl-queue/interfaces/event.interface';

@Injectable()
export class UserQueueManager {

    private readonly logger = new Logger('mipl-queue');
    private readonly appName: string;
    private redis: Redis;
    private hasActiveWorkers = false;
    private queueChannels: Map<string, Channel> = new Map();

    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        private readonly connectionManager: QueueConnectionManager,
        private readonly processManager: ProcessManager,
        private readonly eventEmitter: EventEmitter2,
        private readonly logService: LogService,
        private readonly deadLetterManager: DeadLetterManager,
        private readonly progressTracker: QueueProgressTracker
    ) {
        this.appName = `queue/${this.config.name}`;
    }

    async initialize(): Promise<void> {
        this.redis = this.connectionManager.getRedisClient();
        await this.setupMasterQueue();
    }


    private async getChannelForQueue(queueName: string): Promise<Channel> {
        try {
            if (!queueName) {
                throw new Error('Queue name is required');
            }
            return await this.connectionManager.getChannel(queueName);
        } catch (error) {
            this.logService.error(`Failed to get channel for queue ${queueName}: ${error.message}`, this.appName);
            throw error;
        }
    }



    private async setupMasterQueue(): Promise<void> {
        try {
            const masterQueue = `${this.config.name}_master`;
            const channel = await this.getChannelForQueue(masterQueue);

            await channel.assertQueue(masterQueue, { durable: true });
            await channel.prefetch(this.config.maxUsers);

            channel.consume(masterQueue, async (msg) => {
                if (!msg) return;

                const userId = msg.content.toString();
                this.logService.info(`Master queue received user: ${userId}`, this.appName);

                try {
                    await this.handleNewUser(userId, msg, channel);
                } catch (error) {
                    this.logService.error(`Error handling user ${userId}: ${error?.message}`, this.appName);
                    await this.removeActiveUser(userId);
                    channel.nack(msg, false, true);
                }
            });

            this.logService.info('Master queue setup complete', this.appName);
        } catch (error) {
            this.logService.error(`Master queue setup failed: ${error?.message}`, this.appName);
        }
    }

    private async handleNewUser(userId: string, msg: any, masterChannel: Channel): Promise<void> {
        const activeCount = await this.getActiveUsersCount();

        if (activeCount >= this.config.maxUsers) {
            // this.logService.warn(
            //     `Max users reached (${this.config.maxUsers}), queuing user ${userId}`,
            //     this.appName
            // );
            masterChannel.nack(msg, false, true);
            return;
        }

        await this.addActiveUser(userId);
        this.logService.info(`Setting up queues for user ${userId}`, this.appName);
        await this.setupUserQueues(userId);
        masterChannel.ack(msg);
    }

    async addTasksToQueue(userId: string, tasks: any[]): Promise<void> {
        try {
            if (!this.hasActiveWorkers) {
                await this.processManager.initializeWorkers();
                this.hasActiveWorkers = true;
            }
            this.logger.log(`ADDING TASKS TO QUEUE`)
            const masterQueue = `${this.config.name}_master`;
            const masterChannel = await this.getChannelForQueue(masterQueue);

            await masterChannel.assertQueue(masterQueue, { durable: true });
            await masterChannel.sendToQueue(masterQueue, Buffer.from(userId));

            const firstQueue = `${userId}_${this.config.steps[0].queue}`;
            const firstQueueChannel = await this.getChannelForQueue(firstQueue);

            await firstQueueChannel.assertQueue(firstQueue, { durable: true });

            for (const task of tasks) {
                await firstQueueChannel.sendToQueue(
                    firstQueue,
                    Buffer.from(JSON.stringify(task)),
                    { persistent: true }
                );
            }

            await this.redis.set(`user:${userId}:taskCount`, tasks.length);
        } catch (error) {
            this.logService.error(`Failed to add tasks for user ${userId}: ${error.message}`, this.appName);
            throw error;
        }
    }


    private async setupUserQueues(userId: string): Promise<void> {
        for (const step of this.config.steps) {
            const queueName = `${userId}_${step.queue}`;
            const channel = await this.getChannelForQueue(queueName);

            await channel.assertQueue(queueName, { durable: true });
            await channel.prefetch(step.concurrency);
            await this.setupQueueConsumer(userId, step.queue, channel);
        }
    }


    private async setupQueueConsumer(userId: string, type: string, channel: Channel): Promise<void> {
        const queueName = `${userId}_${type}`;

        channel.consume(queueName, async (msg) => {
            if (!msg) return;

            try {
                const messageContent = JSON.parse(msg.content.toString());
                const task = {
                    ...messageContent,
                    retryCount: messageContent.retryCount || 0,
                    userId,
                    processName: this.config.name,
                    step: type
                };

                this.logService.info(`Processing task ${task.id} in queue ${queueName}`, this.appName);
                await this.progressTracker.updateQueueProgress(userId, type, 'processing');

                /* this.eventEmitter.emit('queueUpdate', {
                     type: 'taskUpdate',
                     userId,
                     queueType: type,
                     status: 'processing',
                     taskId: task.id
                 });*/
                ////////////////



                //  await new Promise((resolve, reject) => {
                //      setTimeout(() => {
                //          resolve(1)
                //      }, 500);
                //  })
             
                //  await this.handleTaskCompletion(userId, type, task, channel, msg);

                const emitter = await this.processManager.executeProcessor(type, task, userId);

                // Handle completion
                emitter.once('complete', async () => {
                    // console.log('COMPLETE MESSAGE FOR TASKS',task)
                    try {
                        await this.handleTaskCompletion(userId, type, task, channel, msg);
                    } catch (error) {
                        await this.handleProcessingError(userId, type, msg, error, channel);
                    }
                });

                // Handle failures
                emitter.once('failed', async (error) => {
                    // console.log('FAILED MESSAGE FOR TASKS',task)
                    this.logService.error(
                        `Processing failed for task ${task.id}: ${error?.message}`,
                        this.appName
                    );
                    await this.handleProcessingError(userId, type, msg, error, channel);
                });

            } catch (error) {
                this.logService.error(
                    `Processing failed for task ${queueName}: ${error?.message}`,
                    this.appName
                );
                await this.handleProcessingError(userId, type, msg, error, channel);
            }
        });
    }


    private async handleTaskCompletion(
        userId: string,
        type: string,
        task: any,
        channel: Channel,
        msg: any
    ): Promise<void> {
        try {
            await this.progressTracker.updateQueueProgress(userId, type, 'completed');

            /*  this.eventEmitter.emit('queueUpdate', {
                  type: 'taskUpdate',
                  userId,
                  queueType: type,
                  status: 'completed',
                  taskId: task.id
              });*/

            const nextQueue = this.getNextQueue(type);
            if (nextQueue) {
                await this.moveToNextQueue(userId, nextQueue, task);
            } else {
                await this.checkTaskCompletion(userId);
            }

            await channel.ack(msg);
        } catch (error) {
            this.logService.error(
                `Completion handling failed for task ${task.id}: ${error?.message}`,
                this.appName
            );
            throw error;
        }
    }

    private getNextQueue(currentQueue: string): string | null {
        const currentIndex = this.config.steps.findIndex(s => s.queue === currentQueue);
        return currentIndex < this.config.steps.length - 1 ?
            this.config.steps[currentIndex + 1].queue : null;
    }


    private async moveToNextQueue(userId: string, nextQueue: string, task: any): Promise<void> {
        const nextQueueName = `${userId}_${nextQueue}`;
        try {
            const channel = await this.getChannelForQueue(nextQueueName);
            await channel.assertQueue(nextQueueName, { durable: true });

            await channel.sendToQueue(
                nextQueueName,
                Buffer.from(JSON.stringify(task)),
                {
                    persistent: true,
                    messageId: task.id,
                    timestamp: Date.now(),
                    headers: {
                        userId,
                        previousQueue: task.step,
                        retryCount: task.retryCount || 0
                    }
                }
            );

            this.logService.info(
                `Moved task ${task.id} to next queue ${nextQueueName}`,
                this.appName
            );
        } catch (error) {
            this.logService.error(
                `Failed to move task to next queue ${nextQueueName}: ${error?.message}`,
                this.appName
            );
            throw error;
        }
    }

    async getActiveUsersCount(): Promise<number> {
        return await this.redis.scard(`${this.config.name}_active_users`);
    }

    private async addActiveUser(userId: string): Promise<void> {
        await this.redis.sadd(`${this.config.name}_active_users`, userId);
    }

    private async removeActiveUser(userId: string): Promise<void> {
        await this.redis.srem(`${this.config.name}_active_users`, userId);
    }

    async getQueueStatus(): Promise<any> {
        const status = {};
        try {
            for (const step of this.config.steps) {
                const queueName = `${this.config.name}_${step.queue}`;
                try {
                    const channel = await this.getChannelForQueue(queueName);
                    const queueInfo = await channel.checkQueue(queueName);

                    status[step.queue] = {
                        messageCount: queueInfo.messageCount,
                        consumerCount: queueInfo.consumerCount,
                        maxRetries: step.maxRetries,
                        concurrency: step.concurrency
                    };
                } catch (error) {
                    if (!error.message.includes('NOT_FOUND')) {
                        this.logService.error(
                            `Failed to get status for queue ${queueName}: ${error?.message}`,
                            this.appName
                        );
                    }
                    status[step.queue] = {
                        messageCount: 0,
                        consumerCount: 0,
                        maxRetries: step.maxRetries,
                        concurrency: step.concurrency,
                        error: error.message
                    };
                }
            }
            return status;
        } catch (error) {
            this.logService.error(`Failed to get queue status: ${error?.message}`, this.appName);
            throw error;
        }
    }


    // Add these methods to the UserQueueManager class

    private async checkTaskCompletion(userId: string): Promise<void> {
        const completedTasks: any = await this.redis.incr(`user:${userId}:completed`);
        const totalTasks = await this.redis.get(`user:${userId}:taskCount`);

        this.logService.info(
            `Task completion check for user ${userId}: completed: ${completedTasks}/${totalTasks}`,
            this.appName
        );

        if (parseInt(completedTasks) >= parseInt(totalTasks)) {
            this.logService.info(`All tasks completed for user ${userId}`, this.appName);
            await this.cleanupUserResources(userId);

            // Emit completion event
            /* this.eventEmitter.emit('queueUpdate', {
                 type: 'userComplete',
                 userId,
                 totalProcessed: totalTasks
             });*/
        }
    }


    private async cleanupUserResources(userId: string): Promise<void> {
        try {
            this.logService.info(`Starting cleanup for user ${userId}`, this.appName);

            for (const step of this.config.steps) {
                const queueName = `${userId}_${step.queue}`;
                try {
                    const channel = await this.getChannelForQueue(queueName);
                    await channel.deleteQueue(queueName);
                    this.logService.info(`Deleted queue ${queueName}`, this.appName);
                } catch (error) {
                    if (!error.message.includes('NOT_FOUND')) {
                        this.logService.error(
                            `Failed to delete queue ${queueName}: ${error?.message}`,
                            this.appName
                        );
                    }
                }
            }

            this.cleanUpUser(userId);
            this.logService.info(`Completed cleanup for user ${userId}`, this.appName);
        } catch (error) {
            this.logService.error(
                `Error during cleanup for user ${userId}: ${error?.message}`,
                this.appName
            );
        }
    }



    private async handleProcessingError(
        userId: string,
        type: string,
        msg: any,
        error: Error,
        channel: Channel
    ): Promise<void> {
        try {
            const task = JSON.parse(msg.content.toString());
            const retryCount = (task.retryCount || 0) + 1;
            const step = this.config.steps.find(s => s.queue === type);

            if (!step) {
                this.logService.error(
                    `Invalid queue type ${type} for user ${userId}`,
                    this.appName
                );
                try {
                    await channel.ack(msg);
                } catch (ackError) {
                    this.logService.warn(
                        `Failed to acknowledge message: ${ackError.message}`,
                        this.appName
                    );
                }
                return;
            }

            if (retryCount <= step.maxRetries) {
                await this.handleRetry(userId, type, task, retryCount, msg, channel);
            } else {
                await this.handleMaxRetriesExceeded(userId, type, task, error, msg, channel);
            }
        } catch (error) {
            this.logService.error(
                `Error handling processing error: ${error.message}`,
                this.appName
            );
        }
    }

    private async handleRetry(
        userId: string,
        type: string,
        task: any,
        retryCount: number,
        msg: any,
        channel: Channel
    ): Promise<void> {
        try {
            const queueName = `${userId}_${type}`;
            const updatedTask = { ...task, retryCount };
            const retryDelay = Math.min(1000 * Math.pow(2, retryCount - 1), 30000);

            try {
                await channel.checkQueue(queueName);
            } catch (error) {
                if (error.message.includes('NOT_FOUND')) {
                    this.logService.warn(
                        `Queue ${queueName} no longer exists, skipping retry`,
                        this.appName
                    );
                    return;
                }
                throw error;
            }

            await channel.nack(msg, false, false);

            setTimeout(async () => {
                try {
                    const retryChannel = await this.getChannelForQueue(queueName);
                    await retryChannel.assertQueue(queueName, { durable: true });
                    await retryChannel.sendToQueue(
                        queueName,
                        Buffer.from(JSON.stringify(updatedTask)),
                        { persistent: true }
                    );

                    this.logService.info(
                        `Scheduled retry ${retryCount} for task ${task.id} in ${retryDelay}ms`,
                        this.appName
                    );
                } catch (error) {
                    this.logService.error(
                        `Failed to schedule retry for task ${task.id}: ${error.message}`,
                        this.appName
                    );
                    await this.handleMaxRetriesExceeded(userId, type, task, error, msg, channel);
                }
            }, retryDelay);
        } catch (error) {
            this.logService.error(
                `Error in handleRetry for task ${task.id}: ${error.message}`,
                this.appName
            );
            await this.handleMaxRetriesExceeded(userId, type, task, error, msg, channel);
        }
    }

    private async handleMaxRetriesExceeded(
        userId: string,
        type: string,
        task: any,
        error: Error,
        msg: any,
        channel: Channel
    ): Promise<void> {
        try {
            this.logService.error(
                `Max retries exceeded for task ${task.id} in queue ${type}`,
                this.appName
            );

            await this.progressTracker.updateQueueProgress(userId, type, 'failed');

            /* this.eventEmitter.emit('queueUpdate', {
                 type: 'taskUpdate',
                 userId,
                 queueType: type,
                 status: 'failed',
                 taskId: task.id,
                 error: error.message
             });*/

            try {
                const deadLetterChannel = await this.getChannelForQueue('dead-letter');
                await this.deadLetterManager.moveToDeadLetter(task, error, `${userId}_${type}`);
            } catch (dlqError) {
                this.logService.error(
                    `Failed to move to dead letter queue: ${dlqError.message}`,
                    this.appName
                );
            }

            try {
                await channel.ack(msg);
            } catch (ackError) {
                this.logService.warn(
                    `Failed to acknowledge message: ${ackError.message}`,
                    this.appName
                );
            }

            await this.checkTaskCompletion(userId);
        } catch (error) {
            this.logService.error(
                `Error in handleMaxRetriesExceeded: ${error.message}`,
                this.appName
            );
        }
    }


    async forceStopUser(userId: string): Promise<void> {
        try {
            const activeTasksInfo = await this.processManager.getActiveTasksInfo(userId);
            this.logService.warn(
                `Force stopping user ${userId} with ${activeTasksInfo.taskCount} active tasks`,
                this.appName
            );

            await this.processManager.forceStopUserTasks(userId);

            // Clean up all user queues
            for (const step of this.config.steps) {
                const queueName = `${userId}_${step.queue}`;
                try {
                    const channel = await this.getChannelForQueue(queueName);
                    await channel.purgeQueue(queueName);
                    await channel.deleteQueue(queueName, {
                        ifEmpty: false,
                        ifUnused: false
                    });
                    this.logService.info(`Deleted queue ${queueName}`, this.appName);
                } catch (error) {
                    this.logService.error(
                        `Failed to delete queue ${queueName}: ${error?.message}`,
                        this.appName
                    );
                }
            }

            // Clean up Redis keys
            this.cleanUpUser(userId);

            this.logService.info(
                `Force stop completed for user ${userId}. Cleaned up ${activeTasksInfo.taskCount} tasks`,
                this.appName
            );
        } catch (error) {
            this.logService.error(
                `Error during force stop for user ${userId}: ${error?.message}`,
                this.appName
            );
            throw error;
        }
    }

    /*
        // Add these helper methods to UserQueueManager
        private async cancelUserConsumers(userId: string): Promise<void> {
            try {
                for (const step of this.config.steps) {
                    const queueName = `${userId}_${step.queue}`;
                    try {
                        const channel = await this.getChannelForQueue(queueName);
                        await channel.cancel(queueName);
                        this.logService.info(`Cancelled consumers for queue ${queueName}`, this.appName);
                    } catch (error) {
                        if (!error.message.includes('NOT_FOUND')) {
                            this.logService.warn(
                                `Failed to cancel consumers for queue ${queueName}: ${error?.message}`,
                                this.appName
                            );
                        }
                    }
                }
            } catch (error) {
                this.logService.error(
                    `Error canceling consumers for user ${userId}: ${error?.message}`,
                    this.appName
                );
            }
        }*/

    private async cleanupUserRedisKeys(userId: string): Promise<void> {
        const keysToDelete = [
            `user:${userId}:completed`,
            `user:${userId}:taskCount`,
            // `queue:${this.config.name}:${userId}`
        ];

        await this.redis.del(...keysToDelete);
        await this.removeActiveUser(userId);
    }

    /*private async verifyQueuesDeleted(userId: string): Promise<void> {
        for (const step of this.config.steps) {
            const queueName = `${userId}_${step.queue}`;
            try {
                // Try to check queue - this should throw an error if queue doesn't exist
                await this.channel.checkQueue(queueName);
                // If we get here, queue still exists - try to force delete
                this.logService.warn(
                    `Queue ${queueName} still exists after deletion, attempting force cleanup`,
                    this.appName
                );
                await this.channel.deleteQueue(queueName, {
                    ifEmpty: false,
                    ifUnused: false
                });
            } catch (error) {
                // Queue not found error is expected and good
                if (error.message.includes('NOT_FOUND')) {
                    this.logService.debug(
                        `Verified queue ${queueName} is deleted`,
                        this.appName
                    );
                } else {
                    this.logService.error(
                        `Error verifying queue deletion for ${queueName}: ${error?.message}`,
                        this.appName
                    );
                }
            }
        }
    }*/


    async cleanUpUser(userId): Promise<void> {

        // SEND PROFRESS REPORT WITH QUEUE
        try {
            const report = await this.progressTracker.getQueueSummary(userId);
            this.globalQueueEmit('queue-complete', { queueName: userId, report });
        } catch (error) {

        }

        await this.cleanupUserRedisKeys(userId);
        const activeCount = await this.getActiveUsersCount();


        if (!activeCount) {
            await this.processManager.cleanupWorkers();
            this.globalQueueEmit('queue-drain', { queueName: userId });
            this.hasActiveWorkers = false;
        }
    }


    globalQueueEmit(type: 'queue-drain' | 'queue-complete', data: queueModel) {
        this.eventEmitter.emit(type, data);
    }



    async getUnackedMessages(userId: string): Promise<any[]> {
        try {
            const unackedMessages = [];

            // Check each queue type for the user
            for (const step of this.config.steps) {
                const queueName = `${userId}_${step.queue}`;

                // Get existing channel if available
                const channels = this.connectionManager.getChannels();
                const channel = channels.get(queueName);

                // Only proceed if channel exists
                if (channel && this.connectionManager.isChannelHealthy(channel)) {
                    try {
                        // Get queue info
                        const queueInfo = await channel.checkQueue(queueName);

                        // Get unacked count
                        const unackedCount = queueInfo.messageCount - queueInfo.consumerCount;

                        if (unackedCount > 0) {
                            // Get messages that are being processed (unacked)
                            const message = await channel.get(queueName, { noAck: true });

                            if (message) {
                                const content = JSON.parse(message.content.toString());
                                unackedMessages.push({
                                    queueType: step.queue,
                                    taskId: content.taskId || content.id,
                                    data: content,
                                    startTime: message.properties.timestamp
                                });
                            }
                        }
                    } catch (error) {
                        this.logger.error(error);
                        if (!error.message.includes('NOT_FOUND')) {
                            this.logService.error(
                                `Error getting unacked messages for queue ${queueName}: ${error.message}`,
                                this.appName
                            );
                        }
                    }
                }
            }

            return unackedMessages;
        } catch (error) {
            this.logger.error(error);
            this.logService.error(
                `Failed to get unacked messages for user ${userId}: ${error.message}`,
                this.appName
            );
            throw error;
        }
    }



    async getReportByUserId(userId: string) {
        try {
            const report = await this.progressTracker.getQueueSummary(userId);
            if (report)
                return report
        } catch (error) {
        }
        return {}
    }
}