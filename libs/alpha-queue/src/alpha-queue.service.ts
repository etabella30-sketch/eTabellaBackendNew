import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AlphaQueueOptions, queueCreateOptions, queueLog, QueueProgressSummary, QueueStep } from './interfaces/queue.interface';
import { QueueConnectionManager } from './services/connection/queue.connection.service';
import { ChannelManageService } from './services/chanel-management/chanel-manage.servce';
import { StorageManageService } from './services/storage/storage.service';
import { Channel } from 'amqplib';
import { LogService } from '@app/global/utility/log/log.service';
import { chunk } from 'lodash';
import { EventEmitter } from 'events';
import { ProcessManager } from './services/process-manager/process-manager.service';
import { dbManagerService } from './services/db/db.manager';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { BatchInsertionManager } from './services/batch-insertion/batch-insertion';


export interface QueueEvents {
    taskComplete: (data: { masterId: string; stepName: string; detail: any; queueName: string }) => void;
    taskStart: (data: { masterId: string; stepName: string; detail: any; queueName: string }) => void;
    taskAdded: (data: { masterId: string; stepName: string; detail: any; queueName: string }) => void;
    taskReport: (data: { masterId: string; stepName: string; detail: any; queueName: string }) => void;
    taskCount: (data: { masterId: string; stepName: string; detail: any; queueName: string }) => void;
    taskError: (data: { masterId: string; stepName: string; content: any; queueName: string; retryCount: number }) => void;

}

export interface IAlphaQueueService extends EventEmitter {
    on<E extends keyof QueueEvents>(event: E, listener: QueueEvents[E]): this;
    emit<E extends keyof QueueEvents>(event: E, data: Parameters<QueueEvents[E]>[0]): boolean;
}

@Injectable()
export class AlphaQueueService extends EventEmitter implements IAlphaQueueService, OnModuleInit, OnModuleDestroy {
    private readonly appName: string = `queue/${this.config.name}`;
    private MASTER_QUEUE: string = this.config.name;
    private GLOBAL_CHANNEL: Channel;
    private GLOBAL_TASKS: Map<string, { totalTasks: number; msg: any, extraParams: any }> = new Map();
    private batchInsertion: number = 1000;
    private readonly steps: QueueStep[] = [];
    private readonly logger = new Logger('alpha-queue');
    private runningInterval: any
    private globalTimeout: any;
    private GLOBAL_CONSUMER_TAG: string;
    private consumerTags: Map<string, string> = new Map();
    private subChannels: Map<string, Channel> = new Map();

    constructor(@Inject('QUEUE_CONFIG') private config: AlphaQueueOptions,
        private readonly queueConnection: QueueConnectionManager,
        private readonly chanelManageService: ChannelManageService,
        private readonly storage: StorageManageService,
        private readonly logService: LogService,
        private readonly processManager: ProcessManager,
        private readonly db: dbManagerService, private readonly datetime: DateTimeService, private readonly batchService: BatchInsertionManager) {
        super()
        this.steps = this.config.steps || [];
    }
    ////// TODO: Push to queue

    /* async createTask(masterId: string, nTotal:number) {
         const tasks: any[]
         if (!tasks?.length) {
             throw new Error(`No tasks faund`)
         }
 
         const queueName = this.chanelManageService.generateSubQueueName(this.MASTER_QUEUE, masterId, this.steps[0]["name"]);
         try {
 
             await this.storage.createQueueSummary(masterId, tasks?.length, this.steps);
 
 
             const channel = await this.chanelManageService.createConfirmChannel();
 
             await this.chanelManageService.createQueue(channel, this.MASTER_QUEUE, masterId, queueName)
 
             const batchSize = this.batchInsertion;
             const batches = chunk(tasks, batchSize);
             for (const batch of batches) {
                 this.logger.warn(`Addind ${batch?.length} tasks ${queueName}`)
                 this.logService.info(`Addind ${batch?.length} tasks ${queueName}`, this.appName);
                 for (const task of batch) {
                     await channel.sendToQueue(queueName, Buffer.from(JSON.stringify(task)), { persistent: true });
                 }
                 await channel.waitForConfirms();
                 this.logService.info(`Batch of ${batch.length} tasks sent successfully.`, this.appName);
             }
 
             await this.GLOBAL_CHANNEL.sendToQueue(this.MASTER_QUEUE, Buffer.from(JSON.stringify({ masterId, totalTasks: tasks?.length })), { persistent: true });
 
 
         } catch (error) {
             this.logger.error(`Error while adding tasks: ${error?.message}`);
             this.storage.deleteQueueSummary(masterId);
             this.clearQueues(masterId);
             this.logService.error(`Error while adding tasks: ${error?.message}`, this.appName);
             throw error;
         }
     }*/
    async createTask(masterId: string, totalTasks: number, extraParams: any, keepAlive: number = 0, options: queueCreateOptions = null): Promise<void> {

        if (!totalTasks || totalTasks <= 0) {
            throw new Error(`No tasks found for masterId ${masterId}`);
        }

        const steps: QueueStep[] = keepAlive ? options.steps : this.steps;
        const nTCatid: number = keepAlive ? options.nTCatid : this.config.nTCatid;
        const MASTER_QUEUE: string = keepAlive ? options.MASTER_QUEUE : this.MASTER_QUEUE;
        await this.storage.createQueueSummary(masterId, totalTasks, nTCatid, steps, keepAlive);

        try {
            const queueName = this.chanelManageService.generateSubQueueName(MASTER_QUEUE, masterId, steps[0].name);
            const channel = await this.chanelManageService.createConfirmChannel();

            await this.chanelManageService.createQueue(channel, MASTER_QUEUE, masterId, queueName);

            const batchSize = this.batchInsertion;
            const totalBatches = Math.ceil(totalTasks / batchSize);

            if (!keepAlive) {
                for (let pageNo = 1; pageNo <= totalBatches; pageNo++) {
                    const tasks = await this.db.getTasks(masterId, pageNo, batchSize);

                    this.logger.warn(`Adding ${tasks.length} tasks to ${queueName} (page ${pageNo})`);
                    this.logService.info(`Adding ${tasks.length} tasks to ${queueName} (page ${pageNo})`, this.appName);

                    for (const task of tasks) {
                        await channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ ...task })), { persistent: true }); //, ...(extraParams || {})
                    }
                    await channel.waitForConfirms();
                    this.logService.info(`Batch of ${tasks.length} tasks sent successfully for page ${pageNo}.`, this.appName);
                }
            }


            await this.GLOBAL_CHANNEL.sendToQueue(
                MASTER_QUEUE,
                Buffer.from(JSON.stringify({ masterId, totalTasks, extraParams: (extraParams || {}), keepAlive })),
                { persistent: true }
            );

            try {
                this.emitTotalTasks(extraParams, nTCatid);
                this.emit('taskAdded', { extraParams, masterId, totalTasks, nTCatid })
            } catch (error) {
            }

        } catch (error) {
            this.logger.error(`Error while adding tasks: ${error?.message}`);
            await this.storage.deleteQueueSummary(masterId, this.config.nTCatid);
            await this.clearQueues(masterId, MASTER_QUEUE);
            this.logService.error(`Error while adding tasks: ${error?.message}`, this.appName);
            throw error;
        }
    }

    // KEEP ALIVE TASK CREATION 

    async pushTask(MASTER_QUEUE: string, masterId: string, stepDetail: QueueStep, task: any, options: queueCreateOptions, retryCount: number = 0, maxRetries: number = 3): Promise<boolean> {
        const queueName = this.chanelManageService.generateSubQueueName(MASTER_QUEUE, masterId, stepDetail.name);
        try {
            await this.storage.updateKeepAlive(masterId, options.nTCatid);
            await this.storage.updateQueueProgress(masterId, stepDetail.nRid, options.nTCatid, 'adding');
            await this.GLOBAL_CHANNEL.sendToQueue(queueName, Buffer.from(JSON.stringify({ ...task })), { persistent: true });
            return true;
        } catch (error) {
            this.logger.error(`Failed to pushTask : ${error?.message}`);

            if (retryCount < maxRetries) {
                this.logger.warn(`Retrying pushTask attempt ${retryCount + 1}/${maxRetries} for queue ${queueName} in 2000ms`);
                this.logService.info(`Retrying pushTask attempt ${retryCount + 1}/${maxRetries} for queue ${queueName} in 2000ms`, this.appName);

                // Wait for 2000ms before retrying
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Recursive call with incremented retry count
                return this.pushTask(MASTER_QUEUE, masterId, stepDetail, task, options, retryCount + 1, maxRetries);
            } else {
                this.logger.error(`Max retries (${maxRetries}) reached for pushTask to queue ${queueName}`);
                this.logService.error(`Max retries (${maxRetries}) reached for pushTask to queue ${queueName}`, this.appName);
                return false;
            }
        }
    }
    /////////////TODO: clearQueue


    async clearQueues(masterId: string, MASTER_QUEUE: string) {

        try {
            this.logger.debug(`Clearing queues ${masterId}`);
            const channel = await this.chanelManageService.createChannel();
            for (let x of this.steps) {
                const queueName = this.chanelManageService.generateSubQueueName(MASTER_QUEUE, masterId, x.name);
                try {
                    await this.chanelManageService.deleteQueue(channel, queueName);
                } catch (error) {
                }
            }
        } catch (error) {
            this.logService.error(`Error while clearQueues: ${error?.message}`, this.appName);
        }

    }



    ///////////////TODO: module
    async onModuleInit() {
        try {
            await this.queueConnection.initialize();
            await this.chanelManageService.initialize();
            await this.storage.initialize();
            await this.batchService.startInsertion()
            this.setUpInterval()
            await this.createGlobalChannel()
        } catch (error) {
            this.logService.error(`Queue failed : ${error?.message}`, this.appName);
            throw new Error(`Failed : ${error?.message}`);
        }
    }
    ///////////////TODO: global queue
    async createGlobalChannel() {
        try {
            this.GLOBAL_CHANNEL = await this.chanelManageService.createChannel();
            this.logService.info('Global channel created successfully.', this.appName);
            this.setUpGlobalConsumer();
            this.GLOBAL_CHANNEL.on('error', (err) => {
                this.logService.error(`Global channel error: ${err.message}`, this.appName);
                this.scheduleGlobalQueueRecreation();
            });
            this.GLOBAL_CHANNEL.on('close', () => {
                this.logService.warn('Global channel closed, recreating...', this.appName);
                this.scheduleGlobalQueueRecreation();
            });
        } catch (error) {
            this.logService.error(`Global queue setup error: ${error?.message}`, this.appName);
            this.scheduleGlobalQueueRecreation();
        }
    }
    private scheduleGlobalQueueRecreation() {
        const delay = 2000;
        try {
            if (this.globalTimeout) {
                clearTimeout(this.globalTimeout);
            }
        } catch (error) {
        }
        this.globalTimeout = setTimeout(async () => {
            this.logService.info('Recreating global channel...', this.appName);
            await this.clearAllSubChannels();
            this.createGlobalChannel();
        }, delay);
    }

    async setUpGlobalConsumer() {


        await this.ClearOutGlobalConsumer()

        this.GLOBAL_CHANNEL.assertQueue(this.MASTER_QUEUE, {
            durable: true,
            arguments: {
                'x-message-ttl': 1000 * 60 * 60 * 24,
                'x-dead-letter-exchange': 'my-dlx'
            }
        });
        this.GLOBAL_CHANNEL.prefetch(this.config.maxUsers);
        const { consumerTag } = await this.GLOBAL_CHANNEL.consume(this.MASTER_QUEUE, async (msg) => {
            if (msg) {
                this.logger.warn(`Received ${this.MASTER_QUEUE} message: ${msg.content.toString()}`)
                this.logService.info(`Received message: ${msg.content.toString()}`, this.appName);
                try {
                    const content = JSON.parse(msg.content.toString());
                    const { masterId, totalTasks, extraParams, keepAlive } = content;
                    this.logger.verbose(`Queue started for ${masterId}`);
                    await this.storage.setActiveUser(this.MASTER_QUEUE, masterId, { totalTasks, dStartDt: this.datetime.getCurrentTime(), extraParams, keepAlive });
                    await this.storage.resetProcessingToPending(masterId);

                    this.GLOBAL_TASKS.set(masterId, { totalTasks, msg, extraParams });

                    try {
                        this.emit('taskStart', { extraParams, masterId, totalTasks, nTCatid: this.config.nTCatid })
                    } catch (error) {

                    }

                    this.setUpSubQueues(masterId, extraParams, keepAlive);

                } catch (error) {
                    this.logService.error(`Error processing ${this.MASTER_QUEUE} message: ${error.message}`, this.appName);
                    this.GLOBAL_CHANNEL.nack(msg, false, false);
                }
            }
        }, { noAck: false });
        this.GLOBAL_CONSUMER_TAG = consumerTag;
    }


    async ClearOutGlobalConsumer(): Promise<void> {
        try {
            if (this.GLOBAL_CONSUMER_TAG) {
                this.logService.info(`Found global consumer tag canceling it..`, this.appName);
                await this.GLOBAL_CHANNEL.cancel(this.GLOBAL_CONSUMER_TAG);
                this.GLOBAL_CONSUMER_TAG = null;
            }
        } catch (error) {
            this.logService.error(`error canceling global consumer tag ${error?.message}`, this.appName);
        }
    }

    private async clearSubChannel(queueName: string): Promise<void> {
        const channel = this.subChannels.get(queueName);
        if (channel) {
            try {
                await this.ClearOutSubConsumer(channel, queueName);
                await channel.close();
                this.logService.info(`Closed sub-channel for ${queueName}`, this.appName);
            } catch (err) {
                this.logService.error(`Error closing sub-channel for ${queueName}: ${err?.message}`, this.appName);
            }
            this.subChannels.delete(queueName);
        }
    }

    private async clearAllSubChannels(): Promise<void> {
        try {
            this.logService.info(`Clearing all  sub-channels `, this.appName);

            for (const [queueName, channel] of this.subChannels) {
                try {
                    await this.ClearOutSubConsumer(channel, queueName);
                    await channel.close();
                    this.logService.info(`Closed sub-channel for ${queueName}`, this.appName);
                } catch (err) {
                    this.logService.error(`Error closing sub-channel for ${queueName}: ${err.message}`, this.appName);
                }
            }
            this.subChannels.clear();
        } catch (error) {
            this.logService.error(`Error on clossing all sub-channel : ${error?.message}`, this.appName);
        }
    }

    ///////////////TODO: sub queue
    async setUpSubQueues(masterId: string, extraParams: any, keepAlive: number) {
        try {
            for (let x of [...this.steps].reverse()) {
                await this.createSubQueue(masterId, x, extraParams, keepAlive);
            }
        } catch (error) {
            this.logService.error(`Error on sub queues ${error?.message}`, this.appName);
            throw new Error(`Error on sub queues ${error?.message}`)
        }
    }

    async createSubQueue(masterId: string, x: QueueStep, extraParams: any, keepAlive: number): Promise<void> {
        const queueName = this.chanelManageService.generateSubQueueName(this.MASTER_QUEUE, masterId, x.name);
        await this.clearSubChannel(queueName);

        try {
            this.logService.info(`Creating sub queue ${queueName}`, this.appName);
            const channel = await this.chanelManageService.createChannel();
            this.subChannels.set(queueName, channel);
            channel.on('error', (err) => {
                this.logService.error(`Sub channel error ${queueName} : ${err.message}`, this.appName);
                this.recreateSubQueue(masterId, x, queueName, extraParams, keepAlive);
            });
            channel.on('close', () => {
                this.logService.warn(`Sub channel closed ${queueName}`, this.appName);
                // TODO: check if exists in redis active_user || add retry * ;
                // this.recreateSubQueue(masterId, x, queueName, extraParams);
            });
            await this.chanelManageService.createQueue(channel, this.MASTER_QUEUE, masterId, queueName);
            this.setUpConsumer(channel, masterId, queueName, x, extraParams, keepAlive);
        } catch (error) {
            this.logService.error(`Error on sub queues ${queueName} ${error?.message}`, this.appName);
            this.recreateSubQueue(masterId, x, queueName, extraParams, keepAlive);
        }
    }

    recreateSubQueue(masterId: string, x: QueueStep, queueName: string, extraParams: any, keepAlive: number) {
        this.logService.info(`Recreating sub queue ${queueName} channel...`, this.appName);
        this.createSubQueue(masterId, x, extraParams, keepAlive);
    }


    async ClearOutSubConsumer(channel: Channel, queueName: string): Promise<void> {
        try {
            const consumerTag = this.consumerTags.get(queueName);
            if (consumerTag) {
                try {
                    await channel.cancel(consumerTag);
                    this.logService.info(`Cancelled consumer for ${queueName} with tag: ${consumerTag}`, this.appName);
                    this.consumerTags.delete(queueName);
                } catch (error) {
                    this.logService.error(`Failed to cancel consumer for ${queueName}: ${error.message}`, this.appName);
                }
            } else {
                this.logService.warn(`No consumer tag found for ${queueName}`, this.appName);
            }
        } catch (error) {

        }
    }

    async setUpConsumer(channel: Channel, masterId: string, queueName: string, stepDetail: QueueStep, extraParams: any, keepAlive: number) {


        try {
            await this.ClearOutSubConsumer(channel, queueName);

            this.logger.warn(`Setting prefix ${stepDetail.concurrency} to ${queueName}`)
            channel.prefetch(stepDetail.concurrency);

            const { consumerTag } = await channel.consume(queueName, async (msg) => {
                if (msg) {
                    this.logger.warn(`Received ${queueName} message: ${msg.content.toString()}`)
                    this.logService.info(`Received message: ${msg.content.toString()}`, this.appName);
                    try {

                        const content = JSON.parse(msg.content.toString());

                        // try {
                        //     // if (stepDetail?.isMain) {
                        //     await this.storage.logTaskStart(masterId, content?.id, stepDetail.nRid);
                        //     await this.storage.addActiveTask(masterId, stepDetail?.nRid, content?.id);
                        //     // }
                        // } catch (error) {
                        // }
                        if (keepAlive)
                            await this.storage.updateKeepAlive(masterId)

                        await Promise.all([
                            // this.storage.logTaskStart(masterId, content?.id, stepDetail.nRid),
                            this.storage.insertLog(masterId, stepDetail.nRid, content?.id, 'S'),
                            this.storage.addActiveTask(masterId, stepDetail?.nRid, content?.id),
                            this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'processing')
                        ]).catch(error => {
                            this.logger.error(`Task initialization error: ${error.message}`);
                        });

                        // await this.storage.updateQueueProgress(masterId, stepDetail.nRid, 'processing');

                        try {

                            const data = await this.processManager.executeProcessor(stepDetail?.queue, { ...content, ...(extraParams || {}) }, masterId, stepDetail);

                            await this.handleComplete(channel, masterId, queueName, stepDetail, content, msg, extraParams);

                        } catch (error) {
                            this.logger.error('Executation error', error)
                            await this.handleError(channel, masterId, queueName, stepDetail, content, msg, extraParams);

                        } finally {
                            await this.checkForTaskComplete(masterId, extraParams);
                        }


                        /* // const emitter = await this.performTask(content);
                         const emitter = await this.processManager.executeProcessor(stepDetail?.queue, { ...content, ...(extraParams || {}) }, masterId, stepDetail);
                         // Handle completion
                         emitter.once('complete', async (data) => {
                             // console.log('COMPLETE MESSAGE FOR TASKS',task)
                             await this.handleComplete(channel, masterId, queueName, stepDetail, content, msg, extraParams);
                             await this.checkForTaskComplete(masterId, extraParams);
                         });
     
                         // Handle failures
                         emitter.once('failed', async (error) => {
                             // console.log('FAILED MESSAGE FOR TASKS',task)
                             await this.handleError(channel, masterId, queueName, stepDetail, content, msg, extraParams);
                             await this.checkForTaskComplete(masterId, extraParams);
                         });*/

                    } catch (error) {
                        await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'remove-process');
                        this.logService.error(`Error processing in ${queueName} message: ${error.message}`, this.appName);
                        channel.nack(msg, false, false);
                    }
                }
            }, { noAck: false });
            this.consumerTags.set(queueName, consumerTag);
        } catch (error) {
            this.logService.error(`Sub consumer error for ${queueName}: ${error.message}`, this.appName);
        }

    }


    async handleComplete(channel: Channel, masterId: string, queueName: string, stepDetail: QueueStep, detail: any, msg: any, extraParams: any): Promise<void> {
        try {
            await this.storage.deleteValue(`queue:retry:${masterId}:${queueName}`)
            await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'completed');

            const nextQueueStep = this.getNextStep(stepDetail?.name);
            this.logger.debug(`Current ${stepDetail?.name} Next step ${nextQueueStep?.name}`)
            if (nextQueueStep) {
                try {
                    const newQueueName = this.chanelManageService.generateSubQueueName(this.MASTER_QUEUE, masterId, nextQueueStep.name);
                    await this.storage.updateQueueProgress(masterId, nextQueueStep.nRid, this.config.nTCatid, 'adding');
                    await this.GLOBAL_CHANNEL.sendToQueue(newQueueName, Buffer.from(JSON.stringify(detail)), { persistent: true });
                } catch (e) {
                    throw new Error(`Failed to push to next queue ${e?.message}`);
                }
            }

            // if (stepDetail?.isMain)
            // await this.storage.logTaskEnd(masterId, detail?.id, stepDetail?.nRid, 1);
            await this.storage.insertLog(masterId, stepDetail.nRid, detail?.id, 'C');
            await this.storage.removeActiveTask(masterId, stepDetail?.nRid, detail?.id);
            channel.ack(msg)
        } catch (error) {
            throw new Error(`Failed to execute ${error?.message}`);
        }
    }



    async handleError(channel: Channel, masterId: string, queueName: string, stepDetail: QueueStep, content: any, msg: any, extraParams: any): Promise<void> {
        try {
            const totalRetryes = Number(await this.storage.getValue(`queue:retry:${masterId}:${queueName}`)) || 0;
            if (totalRetryes >= (stepDetail?.maxRetries || 3)) {
                await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'failed');
                this.logger.error(`complete after all retry ${totalRetryes}`)
                await this.storage.deleteValue(`queue:retry:${masterId}:${queueName}`)
                // if (stepDetail?.isMain)

                if (stepDetail?.onFailed > 0) {
                    try {
                        const forceQueueStep = this.getForceQueueStep(stepDetail?.onFailed);
                        this.logger.debug(`Forcing to ${forceQueueStep?.name} from step ${stepDetail?.name}`);
                        if (forceQueueStep) {
                            const newQueueName = this.chanelManageService.generateSubQueueName(this.MASTER_QUEUE, masterId, forceQueueStep.name);
                            await this.storage.updateQueueProgress(masterId, forceQueueStep.nRid, this.config.nTCatid, 'adding');
                            await this.GLOBAL_CHANNEL.sendToQueue(newQueueName, Buffer.from(JSON.stringify(content)), { persistent: true });
                        }
                        else {
                            await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'task-failed');
                        }
                    } catch (error) {
                        this.logService.error(`failed to push into forced queue ${error?.message} `, this.appName);

                        await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'task-failed');

                    }

                } else {
                    await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'task-failed');
                }
                // await this.storage.logTaskEnd(masterId, content?.id, stepDetail?.nRid, 2);
                await this.storage.insertLog(masterId, stepDetail.nRid, content?.id, 'F');
                await this.storage.removeActiveTask(masterId, stepDetail?.nRid, content?.id);
                channel.ack(msg);
            } else {
                this.logger.error(`Retrying... ${totalRetryes}`);
                await this.storage.updateQueueProgress(masterId, stepDetail.nRid, this.config.nTCatid, 'remove-process');
                await this.storage.setValue(`queue:retry:${masterId}:${queueName}`, totalRetryes + 1, 1000 * 60 * 60 * 6);
                channel.nack(msg, false, true);
            }
        } catch (error) {
            throw new Error(`Failed to execute ${error?.message}`);
        }

    }



    async checkForTaskComplete(masterId: string, extraParams: any): Promise<void> {
        try {
            const detail = await this.storage.getQueueSummary(masterId);

            const info = this.GLOBAL_TASKS.get(masterId);
            this.logger.debug(`Checking queue tasks ${masterId} completed:${detail?.completed}   failed:${detail?.failed}   total:${info?.totalTasks}`)
            if (!info) {
                this.logger.warn(`No info found for ${masterId}`)
                return;
            }
            if ((detail?.completed + detail?.failed) == info.totalTasks) {
                await this.completeGlobalTask(masterId, extraParams);
            }
        } catch (error) {
            this.logger.error(`Error in checkForTaskComplete ${error?.message}`);
            this.logService.error(`Error in checkForTaskComplete ${error?.message}`, this.appName);
        }


    }


    async completeGlobalTask(masterId: string, extraParams: any): Promise<void> {
        try {
            const info = this.GLOBAL_TASKS.get(masterId);
            if (info) {
                this.logger.verbose(`Queue drained for ${masterId}`);
                this.logService.warn(`Queue drained for ${masterId}`, this.appName);
                await this.taskDrained(masterId, extraParams);
                await this.clearQueues(masterId, this.MASTER_QUEUE);

                this.emitTotalTasks(extraParams, this.config.nTCatid);
                await this.GLOBAL_CHANNEL.ack(info.msg);
                this.GLOBAL_TASKS.delete(masterId);
            }
        } catch (error) {
            this.logger.error(`Error in completeGlobalTask ${error?.message}`);
            this.logService.error(`Error in completeGlobalTask ${error?.message}`, this.appName);
        }

    }


    //////// NEXT TASK

    getForceQueueStep(nRid: number): QueueStep | null {
        try {
            const steps: QueueStep[] = this.config.steps || [];
            // Find the index of the current step
            const currentStep = steps.find(step => step.nRid == nRid);

            // Return the next step.
            return currentStep
        } catch (error) {
            this.logService.error(`Error getting force queue step for ${nRid}: ${error.message}`, this.appName);
            return null;
        }
    }


    getNextStep(currentStepName: string): QueueStep | null {
        try {
            const steps: QueueStep[] = this.config.steps || [];
            // Find the index of the current step
            const currentIndex = steps.findIndex(step => step.name === currentStepName);

            // If the current step is not found or it's the last step, return null.
            if (currentIndex === -1 || currentIndex === steps.length - 1) {
                return null;
            }

            // Return the next step.
            return steps[currentIndex + 1];
        } catch (error) {
            this.logService.error(`Error getting next step for ${currentStepName}: ${error.message}`, this.appName);
            return null;
        }
    }

    //////////////// TEST: performTask


    async performTask(content: any): Promise<EventEmitter> {
        const eventEmitter = new EventEmitter();
        try {
            setTimeout(() => {
                // if (content.id == '1_task_1') {
                //     eventEmitter.emit('failed', { msg: -1, error: 'Failed' });
                // } else {
                eventEmitter.emit('complete', { msg: 1 });
                // }
            }, 1500);
        } catch (error) {
        }
        return eventEmitter;
    }

    //////////// GET


    async getActiveTasks(masterId: string, nRid: number): Promise<any[]> {
        try {
            const stepDetail = this.steps.find(a => a.nRid == nRid);
            if (stepDetail) {
                const data = await this.storage.getActiveTasks(masterId, stepDetail?.nRid)
                return data || [];
            } else {
                return [];
            }
        } catch (error) {
            this.logger.error(error);
            return [];
        }
    }

    async getSummary(masterId: string): Promise<QueueProgressSummary> {
        try {
            const detail = await this.storage.getQueueSummary(masterId);
            return detail || {} as QueueProgressSummary;
        } catch (error) {
            this.logger.error(error);
            return {} as QueueProgressSummary;
        }
    }

    ///////////// EVENTS
    async taskDrained(masterId: string, extraParams: any) {
        try {

            await this.storage.removeActiveUser(this.MASTER_QUEUE, masterId);
            const detail: QueueProgressSummary = await this.storage.getQueueSummary(masterId);
            try {
                await this.db.updateTasksummary(masterId, detail?.completed, detail?.failed, detail?.processDt, detail?.lastUpdated, detail?.steps);
            } catch (error) {
                this.logger.error(`saving summary failed ${error?.message}`)
                this.logService.error(`saving summary failed ${error?.message}`, this.appName)
            }

            /* try {
 
                 const allDetail: queueLog[] = await this.storage.getTaskAllLogs(masterId);
                 this.logger.warn(`Total ${allDetail?.length} tasks to save in ${masterId}`)
 
                 if (!allDetail) {
                     this.logger.error(`No log found for ${masterId}`);
                     this.logService.error(`No log found for ${masterId}`, this.appName);
                     return;
                 }
 
                 // Define a batch size. For example, 1000 logs per batch.
                 const batchSize = this.batchInsertion;
                 const batches = chunk(allDetail, batchSize);
                 for (let i = 0; i < batches.length; i++) {
                     const batch = batches[i];
                     this.logger.warn(`Processing batch ${i + 1} of ${batches.length} for masterId ${masterId}`, this.appName);
                     try {
                         await this.db.updateTaskDetail(masterId, batch);
                     } catch (error) {
                         this.logger.error(`Failed to inert batch ${i + 1} ${error?.message}`)
                         this.logService.error(`Failed to inert batch ${i + 1} ${error?.message}`, this.appName)
                     }
                 }
 
             } catch (error) {
                 this.logger.error(`saving detail failed ${error?.message}`)
                 this.logService.error(`saving detail failed ${error?.message}`, this.appName)
             }*/

            try {
                this.emit('taskComplete', { extraParams, masterId, nTCatid: this.config.nTCatid })
            } catch (error) {

            }


            try {
                await this.storage.cleanupRediskeys(masterId)
            } catch (error) {
                this.logger.error(`cleanupRediskeys failed ${error?.message}`)
                this.logService.error(`cleanupRediskeys failed ${error?.message}`, this.appName)
            }

        } catch (error) {
            this.logger.error(`saving info failed ${error?.message}`)
            this.logService.error(`saving info failed ${error?.message}`, this.appName)
        }
    }

    async onModuleDestroy() {
        try {
            clearInterval(this.runningInterval);
        } catch (error) {

        }
    }

    setUpInterval() {
        try {
            clearInterval(this.runningInterval);
        } catch (error) {
        }
        try {
            this.runningInterval = setInterval(async () => {
                const list = await this.storage.getActiveUsers();
                // this.logger.verbose(`REPORT Found total ${list?.length}`)
                list.forEach(async (a) => {
                    // const info = this.GLOBAL_TASKS.get(a?.masterId);
                    if (a) {
                        try {
                            const keepAliveTask = await this.storage.getKeepAlive(a?.masterId);
                            if (keepAliveTask) {
                                const diffInMs = this.datetime.dateDifferentWithCurrent(keepAliveTask)
                                if (diffInMs > a?.data?.keepAlive) {
                                    await this.completeGlobalTask(a.masterId, a?.data?.extraParams);
                                }
                            }

                        } catch (error) {

                        }


                        try {
                            const report = await this.storage.getQueueSummary(a?.masterId)
                            if (report) {
                                this.emit('taskReport', { nTid: Number(a?.masterId), masterId: a?.masterId, extraParams: a?.data?.extraParams, report, nTCatid: this.config.nTCatid })
                            }
                        } catch (error) {
                        }
                    }
                })
            }, (this.config.eventInterval || 3000));
        } catch (error) {
        }
    }



    async emitTotalTasks(extraParams: any, nTCatid: number) {
        try {
            const totalTasks = await this.storage.getTotalTasksCount()
            this.emit('taskCount', { nCaseid: extraParams?.nCaseid, nMasterid: extraParams?.nUserid, nTCatid: nTCatid, totalTasks })
        } catch (error) {

        }
    }

}
