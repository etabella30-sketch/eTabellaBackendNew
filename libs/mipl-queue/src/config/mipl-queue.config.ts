import { NestFactory } from '@nestjs/core';
import { parentPort, workerData } from 'worker_threads';
import { ProcessorDiscoveryService } from '@app/mipl-queue/services/processor-discovery/processor-discovery.service';

let appContext = null;

export async function createMiplQueueOptions(CustomQueueModule: any): Promise<{ msg: number }> {
    if (!parentPort) {
        throw new Error('This module must be run as a worker thread');
    }

    try {
        if (!appContext) {
            appContext = await NestFactory.createApplicationContext(CustomQueueModule, {
                logger: ['error','warn'],
                snapshot: true
            });
            parentPort.postMessage({
                type: 'started',
                threadId: workerData.workerId

            });
            // Set up the message handler only once when creating the context
            const discoveryService = appContext.get(ProcessorDiscoveryService);
         
            // Single event listener for the worker's lifetime
            parentPort.once('close', async () => {
                if (appContext) {
                    await appContext.close();
                    appContext = null;
                }
            });

            // Single message handler for processing tasks
            parentPort.on('message', createMessageHandler(discoveryService));
        }

        return { msg: 1 };
    } catch (error) {
        console.error('Failed to initialize worker:', error);
        parentPort.postMessage({
            type: 'error',
            threadId: workerData.workerId,
            error: 'Worker initialization failed: ' + error.message
        });
        throw error;
    }
}

function createMessageHandler(discoveryService) {
    return async (message) => {
        try {
            if (message.type === 'cleanup') {
                if (global.gc) {
                    global.gc();
                }
                return;
            }

            const processorName = workerData.processorName;
            const ProcessorType = discoveryService.findProcessor(processorName);

            if (!ProcessorType) {
                parentPort.postMessage({
                    type: 'error',
                    threadId: workerData.workerId,
                    error: `Processor ${processorName} not found`
                });
                return;
            }

            const processor = appContext.get(ProcessorType);
            const result = await processor.handleTask(message.data);

            parentPort.postMessage({
                type: 'complete',
                threadId: workerData.workerId,
                jobId: message.jobId,
                result
            });
        } catch (error) {
            parentPort.postMessage({
                type: 'error',
                threadId: workerData.workerId,
                jobId: message.jobId,
                error: error.message
            });
        }
    };
}