import { AlphaQueueOptions } from "@app/alpha-queue/interfaces/queue.interface";
import { Connection, Channel, connect, ConfirmChannel } from 'amqplib';
import { Inject, Injectable } from "@nestjs/common";
import { QueueConnectionManager } from "../connection/queue.connection.service";
import { LogService } from "@app/global/utility/log/log.service";
import { StorageManageService } from "../storage/storage.service";

@Injectable()
export class ChannelManageService {
    private readonly appName: string = `queue/${this.config.name}`;
    private connection: Connection;
    private queueDefaultOption = {
        durable: true,
        autoDelete: false,
        exclusive: false,
        arguments: {
            'x-message-ttl': 1000 * 60 * 60 * 24,//60000,
            // 'x-max-length': 1000,
            'x-dead-letter-exchange': 'my-dlx'
        }
    }
    constructor(@Inject('QUEUE_CONFIG') private readonly config: AlphaQueueOptions, private readonly queuConnection: QueueConnectionManager, private readonly logService: LogService, private storage: StorageManageService) {
    }

    initialize() {
        try {
            this.connection = this.queuConnection.getConnection();
        } catch (error) {
            throw new Error(`Error during rabbitMQ connection : ${error?.message}`);
        }
    }

    async createChannel(): Promise<Channel> {
        try {
            const channel = await this.connection.createChannel();
            return channel;
        } catch (error) {
            throw new Error(`Failed to create channel ${error.message}`);
        }
    }

    async createConfirmChannel(): Promise<ConfirmChannel> {
        try {
            const confirmChannel = await this.connection.createConfirmChannel();
            return confirmChannel;
        } catch (error) {
            throw new Error(`Failed to create channel ${error.message}`);
        }
    }


    async createQueue(channel: Channel, MASTER_QUEUE: string, masterId: string, queueName: string, options?): Promise<void> {
        try {
            channel.assertQueue(queueName, { ...this.queueDefaultOption, ...(options || {}) })
            // await this.storage.hSet(`queue:list:${MASTER_QUEUE}`, queueName, masterId);
        } catch (error) {
            this.logService.error(`Error during queue creation ${error.message}`, this.appName);
        }
    }


    async removeQueue(queueName: string) {
        // delete from rabbitMQ and  redis
    }

    async deleteQueue(channel: Channel, queueName: string): Promise<void> {
        try {
            // Optionally, you can pass options such as ifUnused or ifEmpty:
            // { ifUnused: true, ifEmpty: true }
            const result = await channel.deleteQueue(queueName);
        } catch (error) {
            this.logService.error(`Failed to delete queue "${queueName}": ${error?.message}`, this.appName);
        }
    }

    generateSubQueueName(MASTER_QUEUE: string, masterId: string, step: string) {
        return `${MASTER_QUEUE}_${masterId}_${step}`;
    }

}