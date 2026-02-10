import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'worker_threads';
import { join } from 'path';
import { EventEmitter } from 'events';
import { LogService } from '@app/global/utility/log/log.service';
import { MiplQueueOptions } from '@app/mipl-queue/interfaces/mipl.queue.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface WorkerInfo {
    worker: Worker;
    busy: boolean;
    currentTask?: {
        userId: string;
        taskId: string;
    };
}

@Injectable()
export class ProcessManager extends EventEmitter2 implements OnModuleInit, OnModuleDestroy {

    private readonly logger = new Logger('mipl-queue');
    private workers: Map<string, WorkerInfo[]> = new Map();
    private activeUserTasks: Map<string, Set<string>> = new Map();
    private isInitialized = false;
    private appName: string = '';
    private workerInilizeBatch: number = 3;
    constructor(
        @Inject('QUEUE_CONFIG') private readonly config: MiplQueueOptions,
        private readonly logService: LogService,
        private readonly eventEmitter: EventEmitter2
    ) {
        super();
        this.appName = `queue/${this.config.name}`;
    }


    async initializeWorkers(): Promise<void> {
        if (this.isInitialized) return;
        this.logger.log('Initialize workers');

        try {
            for (const step of this.config.steps) {
                this.logger.warn(`worker ${step.queue}`);
                const workersNeeded = this.config.maxUsers * step.concurrency;
                const workersList: WorkerInfo[] = [];
                const BATCH_SIZE = this.config.parallelWorkersCreation || this.workerInilizeBatch; // Number of workers to create simultaneously

                for (let i = 0; i < workersNeeded; i += BATCH_SIZE) {
                    const batchPromises = [];
                    const batchSize = Math.min(BATCH_SIZE, workersNeeded - i);

                    for (let j = 0; j < batchSize; j++) {
                        const workerIndex = i + j;
                        this.logger.warn(`Creating worker for ${step.queue} index: ${workerIndex}`);

                        const workerPromise = this.createWorker(step.queue, workerIndex)
                            .then(worker => {
                                const workerInfo: WorkerInfo = {
                                    worker,
                                    busy: false
                                };
                                this.setupWorkerEventHandlers(worker, step.queue, workerIndex);
                                return { index: workerIndex, workerInfo };
                            })
                            .catch(error => {
                                this.logService.error(
                                    `Failed to create worker ${step.queue} i:${workerIndex}: ${error.message}`,
                                    this.appName
                                );
                                this.logger.error(`Failed to create worker ${step.queue} i:${workerIndex}: ${error.message}`)
                                this.handleWorkerError(step.queue, workerIndex);
                                return null;
                            });

                        batchPromises.push(workerPromise);
                    }

                    // Wait for current batch to complete
                    const results = await Promise.allSettled(batchPromises);

                    // Process successful worker creations
                    results.forEach(result => {
                        if (result.status === 'fulfilled' && result.value) {
                            workersList[result.value.index] = result.value.workerInfo;
                        }
                    });

                    // Optional: Add a small delay between batches to prevent system overload
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Filter out any null entries from failed worker creations
                const finalWorkersList = workersList.filter(Boolean);
                this.workers.set(step.queue, finalWorkersList);

                this.logger.log(`Initialized ${finalWorkersList.length} workers for ${step.queue}`)
                this.logService.info(
                    `Initialized ${finalWorkersList.length} workers for ${step.queue}`,
                    this.appName
                );
            }

            this.isInitialized = true;
        } catch (error) {
            this.logService.error(
                `Failed to initialize workers: ${error.message}`,
                this.appName
            );
            throw error;
        }
    }


    /*
        async initializeWorkers(): Promise<void> {
            if (this.isInitialized) return;
            console.log('Initialize workers')
            try {
                for (const step of this.config.steps) {
                    console.log('worker ', step.queue)
                    const workersNeeded = this.config.maxUsers * step.concurrency;
                    const workersList: WorkerInfo[] = [];
    
                    for (let i = 0; i < workersNeeded; i++) {
                        console.log('Creating worker for ', step.queue)
                        try {
                            const worker = await this.createWorker(step.queue, i);
    
                            workersList.push({
                                worker,
                                busy: false
                            });
    
                            this.setupWorkerEventHandlers(worker, step.queue, i);
                        } catch (error) {
                            this.logService.error(
                                `Failed to create worker ${step.queue}  i:${i}: ${error.message}`,
                                this.appName
                            );
                            this.handleWorkerError(step.queue, i);
                        }
    
                    }
    
                    this.workers.set(step.queue, workersList);
                    this.logService.info(
                        `Initialized ${workersNeeded} workers for ${step.queue}`,
                        this.appName
                    );
                }
    
                this.isInitialized = true;
            } catch (error) {
                this.logService.error(
                    `Failed to initialize workers: ${error.message}`,
                    this.appName
                );
                throw error;
            }
        }*/


    async createWorker(queue, i): Promise<Worker> {

        return new Promise((resolve, reject) => {
            try {
                const worker = new Worker(join(__dirname, 'main.js'), {
                    workerData: {
                        processorName: queue,
                        workerId: `${queue}-${i}`,
                        isProcessor: true
                    }
                });
                // Wait for worker to be online
                // worker.once('online', () => {
                //     this.logger.log('WORKER IS ONLINE')
                //     // Worker is now running and ready to receive messages
                //     resolve(worker);
                // });
                worker.once('message', (message: any) => {
                    if (message.type === 'started') {
                        this.logger.log('WORKER IS STARTED')
                        resolve(worker);
                    }
                })
            } catch (error) {
                this.logService.error(
                    `Worker ${queue}-${i} error: ${error.message}`,
                    this.appName
                );
                reject(error);
            }
        })


    }

    private setupWorkerEventHandlers(worker: Worker, queueType: string, index: number): void {
        worker.on('message', (message: any) => {
            if (message.type === 'complete') {
                this.handleTaskComplete(message, queueType, index);
            } else if (message.type === 'error') {
                this.handleTaskError(message, queueType, index);
            }
        });

        worker.once('error', (error) => {
            this.logService.error(
                `Worker ${queueType}-${index} error: ${error.message}`,
                this.appName
            );
            this.handleWorkerError(queueType, index);
        });

        worker.once('exit', (code) => {
            if (code !== 0) {
                this.logService.debug(
                    `Worker ${queueType}-${index} exited with code ${code}`,
                    this.appName
                );
            }
        });
    }


    private async handleWorkerError(queueType: string, index: number) {
        try {
            const workersList = this.workers.get(queueType);
            const workerInfo = workersList?.[index];

            if (workerInfo) {
                try {
                    try {
                        await workerInfo.worker.terminate();
                    } catch (error) {

                    }

                    const newWorker = await this.createWorker(queueType, index);

                    // new Worker(join(__dirname, 'main.js'), {
                    //     workerData: {
                    //         processorName: queueType,
                    //         workerId: `${queueType}-${index}`,
                    //         isProcessor: true
                    //     }
                    // });

                    workerInfo.worker = newWorker;
                    workerInfo.busy = false;
                    workerInfo.currentTask = undefined;

                    this.setupWorkerEventHandlers(newWorker, queueType, index);

                    this.logService.info(
                        `Successfully recreated worker ${queueType}-${index} after error`,
                        this.appName
                    );
                } catch (recreateError) {
                    this.logService.error(
                        `Failed to recreate worker ${queueType}-${index}: ${recreateError.message}`,
                        this.appName
                    );
                }
            }

            // for (const [queueType, workersList] of this.workers.entries()) {
            //     for (const workerInfo of workersList) {
            // setInterval(() => {
            //     process.send('TASK', { TAJ: 'SS' })
            // }, 1000);

            //     }
            // }







        } catch (error) {
            this.logService.error(
                `Error handling worker error: ${error.message}`,
                this.appName
            );
        }
    }
    private handleTaskComplete(message: any, queueType: string, index: number) {
        const { userId, taskId, result, threadId } = message;
        const eventEmitter = new EventEmitter();

        // Complete task handling
        eventEmitter.emit('complete', result);
        this.removeUserTask(userId, taskId);

        const workerInfo = this.workers.get(queueType)?.find(w => w.worker.threadId === threadId);
        if (workerInfo) {
            workerInfo.busy = false;
            workerInfo.currentTask = undefined;
        }
    }

    private handleTaskError(message: any, queueType: string, index: number) {
        const eventEmitter = new EventEmitter();
        const error = new Error(message.error);
        eventEmitter.emit('failed', error);

        // Handle error logging and worker cleanup
        this.logService.error(`Worker ${queueType}-${index} failed: ${message.error}`, this.appName);
    }

    async executeProcessor(processorType: string, data: any, userId: string): Promise<EventEmitter> {
        const eventEmitter = new EventEmitter();
        const workersList = this.workers.get(processorType);

        if (!workersList) {
            eventEmitter.emit('failed', new Error(`No workers found for ${processorType}`));
            return eventEmitter;
        }

        const availableWorker = workersList.find(w => !w.busy);
        if (!availableWorker) {
            eventEmitter.emit('failed', new Error(`No available workers for ${processorType}`));
            return eventEmitter;
        }

        const taskId = `${processorType}-${Date.now()}`;

        if (!this.activeUserTasks.has(userId)) {
            this.activeUserTasks.set(userId, new Set());
        }
        this.activeUserTasks.get(userId).add(taskId);

        availableWorker.busy = true;
        availableWorker.currentTask = { userId, taskId };

        // Create message handler
        const messageHandler = (message: any) => {
            if (message.type === 'complete') {
                eventEmitter.emit('complete', message.result);
                cleanup();
            } else if (message.type === 'error') {
                eventEmitter.emit('failed', new Error(message.error));
                cleanup();
            } else if (message.type == 'events') {
                // eventEmitter.emit('events', message?.body);
                this.eventEmitter.emit(message?.body?.type, message?.body?.data);
                return;
            }
            // Clean up after task completion
        };

        availableWorker.worker.on('message', messageHandler);

        // Cleanup function to remove listener
        const cleanup = () => {
            try {
                availableWorker.worker.removeListener('message', messageHandler);
            } catch (error) {
            }
            this.removeUserTask(userId, taskId);
            availableWorker.busy = false;
            availableWorker.currentTask = undefined;
        };

        // console.log('PUSH MESSAGE',data);
        availableWorker.worker.postMessage({
            data,
            jobId: taskId
        });

        /*const timeoutId = setTimeout(() => {
            eventEmitter.emit('failed', new Error('Task execution timed out'));
            cleanup();
        }, 300000); // 5 minutes timeout*/

        return eventEmitter;
    }

    async forceStopUserTasks(userId: string): Promise<void> {
        this.logService.warn(`Force stopping tasks for user ${userId}`, this.appName);

        try {
            // for (const [queueType, workersList] of this.workers) {
            //     for (const workerInfo of workersList) {
            //         if (workerInfo.currentTask?.userId === userId) {
            //             await workerInfo.worker.terminate();

            //             const newWorker =  await this.createWorker(queueType, index);
            //             //  new Worker(join(__dirname, 'main.js'), {
            //             //     workerData: {
            //             //         processorName: queueType,
            //             //         workerId: workerInfo.currentTask.taskId,
            //             //         isProcessor: true
            //             //     }
            //             // });

            //             workerInfo.worker = newWorker;
            //             workerInfo.busy = false;
            //             workerInfo.currentTask = undefined;

            //             this.setupWorkerEventHandlers(newWorker, queueType, 0);
            //         }
            //     }
            // }
            for (const [queueType, workersList] of this.workers) {
                for (let index = 0; index < workersList.length; index++) {
                    const workerInfo = workersList[index];
                    if (workerInfo.currentTask?.userId === userId) {
                        await workerInfo.worker.terminate();

                        const newWorker = await this.createWorker(queueType, index);

                        workerInfo.worker = newWorker;
                        workerInfo.busy = false;
                        workerInfo.currentTask = undefined;

                        this.setupWorkerEventHandlers(newWorker, queueType, index);
                    }
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

    // Other methods remain the same
    private removeUserTask(userId: string, taskId: string): void {
        const userTasks = this.activeUserTasks.get(userId);
        if (userTasks) {
            userTasks.delete(taskId);
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

            for (const [queueType, workersList] of this.workers.entries()) {
                for (const workerInfo of workersList) {

                    if (!this.config.preloadWorkers) {
                        try {
                            try {
                                workerInfo.worker.removeAllListeners();
                            } catch (error) {
                            }
                            await workerInfo.worker.terminate();
                        } catch (error) {
                        }
                    } else {
                        // if (!workerInfo.busy) {
                        try {
                            // Send a cleanup signal to the worker
                            workerInfo.worker.postMessage({ type: 'cleanup' });
                            // Optionally force garbage collection if --expose-gc flag is enabled
                            if (global.gc) {
                                global.gc();
                            }
                        } catch (error) {
                        }
                        // }
                    }

                }
            }



            if (!this.config.preloadWorkers) {
                try {
                    this.workers.clear();
                    this.activeUserTasks.clear();
                } catch (error) {
                }
                this.isInitialized = false;
            }

        } catch (error) {
            this.logService.error(
                `Failed to cleanup worker memory: ${error.message}`,
                this.appName
            );
        }

        /*
        this.logService.info('Cleaning up workers', this.appName);
        for (const workersList of this.workers.values()) {
            await Promise.all(
                workersList.map(async (workerInfo) => {
                    await workerInfo.worker.terminate();
                })
            );
        }
        this.workers.clear();
        this.isInitialized = false;*/
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

        const taskIds = Array.from(userTasks);
        const processors = taskIds.map(id => id.split('-')[0]);

        return {
            taskCount: userTasks.size,
            taskIds,
            processors: [...new Set(processors)]
        };
    }

    async onModuleInit() {
        if (this.config.preloadWorkers) {
            await this.initializeWorkers();
        }
    }
}