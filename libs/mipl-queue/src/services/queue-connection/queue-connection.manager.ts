import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import { Connection, Channel, connect } from 'amqplib';
import Redis from 'ioredis';
import { MiplQueueOptions, RabbitMQConfig, RedisConfig } from '../../interfaces/mipl.queue.interface';
import { LogService } from '@app/global/utility/log/log.service';

@Injectable()
export class QueueConnectionManager implements OnModuleDestroy {
    private channels: Map<string, Channel> = new Map();
    private connection: Connection;
    private redis: Redis;
    private reconnectAttempt = 0;
    private readonly RECONNECT_DELAY = 5000;
    private readonly MAX_RECONNECT_ATTEMPTS = 10;
    private readonly CHANNEL_HEALTH_CHECK_INTERVAL = 5000;
    private readonly REDIS_CONNECTION_TIMEOUT = 10000;
    private healthCheckTimer: any;
    private appName: string;
    private isInitialized = false;
    private isReconnecting = false;

    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        @Inject('RABBITMQ_CONFIG') private rabbitConfig: RabbitMQConfig,
        @Inject('REDIS_CONFIG') private redisConfig: RedisConfig,
        private readonly logService: LogService
    ) {
        this.appName = `queue/${this.config.name}`;
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            await this.setupRedis();
            await this.connectRabbitMQ();
            this.startHealthCheck();
            this.isInitialized = true;
            this.logService.info('Queue connection manager initialized successfully', this.appName);
        } catch (error) {
            this.logService.error(`Connection initialization failed: ${error?.message}`, this.appName);
            throw error;
        }
    }

    private async connectRabbitMQ(): Promise<void> {
        try {
            const { host, port, username, password, virtualHost = '/' } = this.rabbitConfig;
            const url = `amqp://${username}:${password}@${host}:${port}${virtualHost}`;

            this.connection = await connect(url, {
                heartbeat: 60,
                timeout: 20000
            });

            this.setupConnectionEventListeners();
            this.logService.info('Connected to RabbitMQ successfully', this.appName);
            this.reconnectAttempt = 0;
        } catch (error) {
            this.logService.error(`RabbitMQ connection failed: ${error?.message}`, this.appName);
            await this.handleRabbitMQReconnect();
        }
    }

    private setupConnectionEventListeners(): void {
        this.connection.on('error', async (error) => {
            this.logService.error(`RabbitMQ connection error: ${error.message}`, this.appName);
            await this.handleRabbitMQReconnect();
        });

        this.connection.on('close', async () => {
            this.logService.warn('RabbitMQ connection closed', this.appName);
            await this.handleRabbitMQReconnect();
        });
    }

    async getChannel(queueName: string): Promise<Channel> {
        if (!queueName) {
            throw new Error('Queue name is required to get a channel');
        }

        await this.ensureConnection();

        let channel = this.channels.get(queueName);
        if (!channel || !this.isChannelHealthy(channel)) {
            channel = await this.createChannelForQueue(queueName);
        }

        return channel;
    }

    private async ensureConnection(): Promise<void> {
        if (!this.connection || !this.isInitialized) {
            await this.initialize();
        }
    }

    private async createChannelForQueue(queueName: string): Promise<Channel> {
        try {
            const channel = await this.connection.createChannel();

            const prefetchCount = this.getQueueConcurrency(queueName);
            await channel.prefetch(prefetchCount);

            this.setupChannelEventListeners(channel, queueName);
            this.channels.set(queueName, channel);

            this.logService.info(`Created new channel for queue: ${queueName} with prefetch ${prefetchCount}`, this.appName);
            return channel;
        } catch (error) {
            this.logService.error(`Failed to create channel for queue ${queueName}: ${error.message}`, this.appName);
            throw error;
        }
    }

    private getQueueConcurrency(queueName: string): number {
        // Extract the base queue name without user ID
        const baseQueueName = queueName.split('_').slice(-1)[0];
        const step = this.config.steps.find(s => s.queue === baseQueueName);
        return step?.concurrency || 1;
    }

    isChannelHealthy(channel: Channel): boolean {
        try {
            if (!channel) return false;
            return typeof channel.checkQueue === 'function';
        } catch {
            return false;
        }
    }

    private setupChannelEventListeners(channel: Channel, queueName: string): void {
        channel.on('error', async (error) => {
            this.logService.error(`Channel error for queue ${queueName}: ${error.message}`, this.appName);
            await this.recreateChannel(queueName);
        });

        // channel.on('close', async () => {
        //     this.logService.warn(`Channel closed for queue ${queueName}`, this.appName);
        //     await this.recreateChannel(queueName);
        // });


        channel.on('close', async (err) => {
            // RabbitMQ passes an error object on forced closes
            console.error(err);
            const reason = err ? `Reason: ${err.message}` : 'No reason provided';
            this.logService.warn(
                `Channel closed for queue ${queueName}. ${reason}`,
                this.appName
            );

            // Check if connection is still alive
            if (this.connection?.connection) {
                this.logService.info(
                    `Connection still active, recreating channel for ${queueName}`,
                    this.appName
                );
                await this.recreateChannel(queueName);
            } else {
                this.logService.warn(
                    `Connection lost, waiting for reconnection before recreating channel for ${queueName}`,
                    this.appName
                );
            }
        });

        channel.on('return', (msg) => {
            this.logService.warn(`Message returned for queue ${queueName}: ${msg.content.toString()}`, this.appName);
        });

        // Add drain listener to handle back pressure
        channel.on('drain', () => {
            this.logService.warn(
                `Channel drain event for queue ${queueName}`,
                this.appName
            );
        });
    }

    private async recreateChannel(queueName: string): Promise<void> {
        this.channels.delete(queueName);
        try {
            if (this.connection && this.connection.connection) {
                const newChannel = await this.createChannelForQueue(queueName);
                this.channels.set(queueName, newChannel);
                this.logService.info(`Recreated channel for queue ${queueName}`, this.appName);
            }
        } catch (error) {
            this.logService.error(`Failed to recreate channel for queue ${queueName}: ${error.message}`, this.appName);
        }
    }

    private async handleRabbitMQReconnect(): Promise<void> {
        if (this.isReconnecting) return;

        this.isReconnecting = true;
        this.reconnectAttempt++;

        try {
            if (this.reconnectAttempt > this.MAX_RECONNECT_ATTEMPTS) {
                this.logService.error('Maximum reconnection attempts reached', this.appName);
                return;
            }

            const delay = Math.min(this.reconnectAttempt * 1000, this.RECONNECT_DELAY);
            this.logService.warn(
                `Attempting to reconnect to RabbitMQ in ${delay}ms... (Attempt ${this.reconnectAttempt})`,
                this.appName
            );

            await new Promise(resolve => setTimeout(resolve, delay));
            await this.connectRabbitMQ();

            // Recreate all channels after reconnection
            const queueNames = Array.from(this.channels.keys());
            this.channels.clear();

            for (const queueName of queueNames) {
                await this.createChannelForQueue(queueName);
            }
        } catch (error) {
            this.logService.error(`Reconnection failed: ${error?.message}`, this.appName);
        } finally {
            this.isReconnecting = false;
        }
    }

    private startHealthCheck(): void {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }

        this.healthCheckTimer = setInterval(async () => {
            if (this.isReconnecting) return;

            for (const [queueName, channel] of this.channels.entries()) {
                if (!this.isChannelHealthy(channel)) {
                    this.logService.warn(`Unhealthy channel detected for queue ${queueName}`, this.appName);
                    await this.recreateChannel(queueName);
                }
            }
        }, this.CHANNEL_HEALTH_CHECK_INTERVAL);
    }

    async checkConnections(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
            return;
        }

        if (!this.connection?.connection) {
            await this.handleRabbitMQReconnect();
        }

        if (this.redis.status !== 'ready') {
            await this.setupRedis();
        }
    }

    private async setupRedis(): Promise<void> {
        this.redis = new Redis({
            ...this.redisConfig,
            retryStrategy: (times) => {
                const delay = Math.min(times * 1000, this.RECONNECT_DELAY);
                this.logService.warn(`Retrying Redis connection in ${delay}ms...`, this.appName);
                return delay;
            }
        });

        this.setupRedisEventListeners();
        await this.waitForRedisConnection();
    }

    private setupRedisEventListeners(): void {
        this.redis.on('connect', () => {
            this.logService.info('Connected to Redis', this.appName);
        });

        this.redis.on('error', (error) => {
            this.logService.error(`Redis connection error: ${error?.message}`, this.appName);
        });

        this.redis.on('close', () => {
            this.logService.warn('Redis connection closed', this.appName);
        });

        this.redis.on('reconnecting', (ms) => {
            this.logService.warn(`Reconnecting to Redis in ${ms}ms...`, this.appName);
        });
    }

    private async waitForRedisConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, this.REDIS_CONNECTION_TIMEOUT);

            this.redis.once('connect', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.redis.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    getRedisClient(): Redis {
        if (!this.redis) {
            throw new Error('Redis client not initialized');
        }
        return this.redis;
    }

    async onModuleDestroy() {
        await this.shutdown();
    }

    async shutdown(): Promise<void> {
        try {
            // console.log('CLOSING CHANNELS')
            if (this.healthCheckTimer) {
                clearInterval(this.healthCheckTimer);
            }

            for (const [queueName, channel] of this.channels.entries()) {
                try {
                    await channel.close();
                } catch (error) {
                    this.logService.error(`Error closing channel for queue ${queueName}: ${error.message}`, this.appName);
                }
            }
            this.channels.clear();

            if (this.connection) {
                await this.connection.close();
            }

            if (this.redis) {
                await this.redis.quit();
            }

            this.isInitialized = false;
            this.logService.info('Queue connection manager shut down successfully', this.appName);
        } catch (error) {
            this.logService.error(`Shutdown failed: ${error?.message}`, this.appName);
            throw error;
        }
    }

    isReady(): boolean {
        return this.isInitialized &&
            this.connection?.connection &&
            !this.isReconnecting &&
            this.redis.status === 'ready';
    }

    getChannels() {
        return this.channels;
    }
}