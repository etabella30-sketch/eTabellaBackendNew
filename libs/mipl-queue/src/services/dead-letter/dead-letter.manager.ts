import { Injectable, Inject } from '@nestjs/common';
import { Channel } from 'amqplib';
import Redis from 'ioredis';
import { MiplQueueOptions, DeadLetterConfig, DeadLetterStatus } from '../../interfaces/mipl.queue.interface';
import { LogService } from '@app/global/utility/log/log.service';
import { QueueConnectionManager } from '../queue-connection/queue-connection.manager';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';

@Injectable()
export class DeadLetterManager {
    private appName = 'queue/dead-letter-manager';
    private redis: Redis;
    private deadLetterConfig: DeadLetterConfig | null = null;
    private readonly MAX_RETENTION_PERIOD = 24 * 60 * 60 * 1000;
    private readonly MAX_QUEUE_LENGTH = 10000;

    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        private readonly connectionManager: QueueConnectionManager,
        private readonly logService: LogService,
        private readonly datetime: DateTimeService
    ) {
        this.appName = `queue/${this.config.name}`;
    }



    async initialize(): Promise<void> {
        this.redis = this.connectionManager.getRedisClient();
        await this.setupDeadLetterQueue();
    }

    private async getDeadLetterChannel(): Promise<Channel> {
        return await this.connectionManager.getChannel('dead-letter');
    }

    private async setupDeadLetterQueue(): Promise<void> {
        if (this.deadLetterConfig) {
            return;
        }

        try {
            const channel = await this.getDeadLetterChannel();
            const deadLetterExchange = `${this.config.name}-dead-letter-exchange`;
            const deadLetterQueue = `${this.config.name}-dead-letter-queue`;
            const deadLetterRoutingKey = `${this.config.name}-dead-letter`;

            await channel.assertExchange(deadLetterExchange, 'direct', {
                durable: true,
                autoDelete: false
            });

            await channel.assertQueue(deadLetterQueue, {
                durable: true,
                arguments: {
                    'x-message-ttl': this.MAX_RETENTION_PERIOD,
                    'x-max-length': this.MAX_QUEUE_LENGTH
                }
            });

            await channel.bindQueue(deadLetterQueue, deadLetterExchange, deadLetterRoutingKey);

            this.deadLetterConfig = {
                exchange: deadLetterExchange,
                queue: deadLetterQueue,
                routingKey: deadLetterRoutingKey
            };

            this.logService.info('Dead Letter Queue setup complete', this.appName);
        } catch (error) {
            this.logService.error(`Failed to setup Dead Letter Queue: ${error?.message}`, this.appName);
            throw error;
        }
    }

    async moveToDeadLetter(task: any, error: Error, originalQueue: string): Promise<void> {
        try {
            if (!this.deadLetterConfig) {
                await this.setupDeadLetterQueue();
            }

            const channel = await this.getDeadLetterChannel();
            const deadLetterMessage = {
                task,
                error: error?.message || 'Unknown error',
                originalQueue,
                failedAt: this.datetime.getCurrentTime(),
                retryCount: task.retryCount || 0,
                metadata: {
                    processId: task.processId,
                    userId: task.userId,
                    originalTimestamp: task.timestamp
                }
            };

            await channel.publish(
                this.deadLetterConfig.exchange,
                this.deadLetterConfig.routingKey,
                Buffer.from(JSON.stringify(deadLetterMessage)),
                {
                    persistent: true,
                    headers: {
                        'x-error-type': error.name,
                        'x-original-queue': originalQueue,
                        'x-failed-at': this.datetime.getCurrentTime()
                    }
                }
            );

            await this.updateFailureMetrics(originalQueue, deadLetterMessage);
            this.logService.info(`Moved failed task ${task.id} to Dead Letter Queue`, this.appName);
        } catch (error) {
            this.logService.error(`Failed to move task to Dead Letter Queue: ${error?.message}`, this.appName);
            throw error;
        }
    }


    private async updateFailureMetrics(queueName: string, message: any): Promise<void> {
        const multi = this.redis.multi();

        multi.hincrby('failed_tasks_count', queueName, 1)
            .lpush('recent_failures', JSON.stringify(message))
            .ltrim('recent_failures', 0, 99)
            .hincrby('failure_patterns', message.error, 1);

        await multi.exec();
    }


    async getDeadLetterStats(): Promise<any> {
        try {
            if (!this.deadLetterConfig) {
                await this.setupDeadLetterQueue();
            }

            const channel = await this.getDeadLetterChannel();
            const [queueInfo, failurePatterns, recentFailures] = await Promise.all([
                channel.checkQueue(this.deadLetterConfig.queue),
                this.redis.hgetall('failure_patterns'),
                this.redis.lrange('recent_failures', 0, 9)
            ]);

            const stats = {
                queueStats: {
                    messageCount: queueInfo.messageCount,
                    consumerCount: queueInfo.consumerCount,
                    name: this.deadLetterConfig.queue,
                    exchange: this.deadLetterConfig.exchange
                },
                failurePatterns: this.formatFailurePatterns(failurePatterns),
                recentFailures: recentFailures.map(f => JSON.parse(f))
            };

            this.logService.info(
                `Retrieved dead letter stats: ${queueInfo.messageCount} messages pending`,
                this.appName
            );

            return stats;
        } catch (error) {
            this.logService.error(
                `Failed to get dead letter stats: ${error?.message}`,
                this.appName
            );
            throw new Error(`Unable to retrieve dead letter statistics: ${error?.message}`);
        }
    }


    private formatFailurePatterns(patterns: Record<string, string>): Array<{
        error: string;
        count: number;
        percentage: number;
    }> {
        const total = Object.values(patterns)
            .reduce((sum, count) => sum + parseInt(count), 0);

        return Object.entries(patterns).map(([error, count]) => ({
            error,
            count: parseInt(count),
            percentage: total ? (parseInt(count) / total) * 100 : 0
        }));
    }

    async reprocessDeadLetters(criteria?: any): Promise<number> {
        try {
            if (!this.deadLetterConfig) {
                await this.setupDeadLetterQueue();
            }

            const channel = await this.getDeadLetterChannel();
            let reprocessedCount = 0;

            // Consume messages from the dead letter queue
            const consumeResult = await new Promise<number>((resolve, reject) => {
                channel.consume(this.deadLetterConfig.queue, async (msg) => {
                    if (!msg) {
                        resolve(reprocessedCount);
                        return;
                    }

                    try {
                        const deadLetterMessage = JSON.parse(msg.content.toString());

                        if (this.shouldReprocess(deadLetterMessage, criteria)) {
                            const targetQueueChannel = await this.connectionManager.getChannel(
                                deadLetterMessage.originalQueue
                            );

                            await this.reprocessMessage(deadLetterMessage, targetQueueChannel);
                            await channel.ack(msg);
                            reprocessedCount++;
                        } else {
                            // If message doesn't match criteria, nack it back to queue
                            await channel.nack(msg, false, true);
                        }
                    } catch (error) {
                        this.logService.error(
                            `Error processing dead letter message: ${error?.message}`,
                            this.appName
                        );
                        await channel.nack(msg, false, false);
                    }
                }, { noAck: false });

                // Set a timeout to end consumption after reasonable period
                setTimeout(() => {
                    resolve(reprocessedCount);
                }, 30000); // 30 second timeout
            });

            this.logService.info(
                `Reprocessed ${reprocessedCount} messages from dead letter queue`,
                this.appName
            );

            return consumeResult;
        } catch (error) {
            this.logService.error(
                `Failed to reprocess dead letters: ${error?.message}`,
                this.appName
            );
            throw new Error(`Dead letter reprocessing failed: ${error?.message}`);
        }
    }


    private shouldReprocess(message: any, criteria?: any): boolean {
        if (!criteria) {
            return true;
        }
        return Object.entries(criteria).every(([key, value]) => message[key] === value);
    }

    private async reprocessMessage(deadLetterMessage: any, channel: Channel): Promise<void> {
        const { task, originalQueue } = deadLetterMessage;

        try {
            // Verify queue exists before attempting to reprocess
            await channel.checkQueue(originalQueue);

            await channel.sendToQueue(
                originalQueue,
                Buffer.from(JSON.stringify({
                    ...task,
                    reprocessed: true,
                    originalError: deadLetterMessage.error,
                    reprocessedAt: this.datetime.getCurrentTime()
                })),
                {
                    persistent: true,
                    headers: {
                        'x-reprocessed': 'true',
                        'x-original-error': deadLetterMessage.error,
                        'x-original-failed-at': deadLetterMessage.failedAt,
                        'x-reprocess-time': this.datetime.getCurrentTime(),
                        'x-retry-count': (task.retryCount || 0) + 1
                    }
                }
            );

            await this.updateReprocessingMetrics(originalQueue, deadLetterMessage);

            this.logService.info(
                `Successfully reprocessed task ${task.id} back to queue ${originalQueue}`,
                this.appName
            );
        } catch (error) {
            this.logService.error(
                `Failed to reprocess message to queue ${originalQueue}: ${error?.message}`,
                this.appName
            );
            throw error;
        }
    }

    private async updateReprocessingMetrics(queueName: string, message: any): Promise<void> {
        const multi = this.redis.multi();

        multi
            .hincrby('reprocessed_tasks_count', queueName, 1)
            .lpush('reprocessing_history', JSON.stringify({
                taskId: message.task.id,
                originalQueue: queueName,
                originalError: message.error,
                reprocessedAt: this.datetime.getCurrentTime()
            }))
            .ltrim('reprocessing_history', 0, 99);

        await multi.exec();
    }

    async getStatus(): Promise<DeadLetterStatus> {
        try {
            if (!this.deadLetterConfig) {
                await this.setupDeadLetterQueue();
            }

            const channel = await this.getDeadLetterChannel();
            const [queueInfo, failurePatterns, recentFailures] = await Promise.all([
                channel.checkQueue(this.deadLetterConfig.queue),
                this.redis.hgetall('failure_patterns'),
                this.redis.lrange('recent_failures', 0, 9)
            ]);

            return {
                queueStats: {
                    messageCount: queueInfo.messageCount,
                    consumerCount: queueInfo.consumerCount
                },
                failurePatterns: this.formatFailurePatterns(failurePatterns),
                recentFailures: recentFailures.map(f => JSON.parse(f))
            };
        } catch (error) {
            this.logService.error(`Failed to get dead letter status: ${error?.message}`, this.appName);
            throw error;
        }
    }




}