import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as os from 'os';
import { createWorker } from 'mediasoup';
import type { Worker, Router, WebRtcTransport, RtpCodecCapability, RtpCapabilities, RtpParameters, MediaKind, Producer, Consumer } from 'mediasoup/node/lib/types';
import { rooms } from '../../interfaces/manage.interface';

@Injectable()
export class WorkersService implements OnModuleInit {
    private workers: any[] = []; // Array to hold worker instances
    private logger = new Logger('worker-service');

    async onModuleInit() {
        this.logger.log('WorkersService initialized');
        const numCores = os.cpus().length;
        const numWorkers = Math.max(1, Math.min(numCores - 1, 4));

        this.workers = [];
        for (let i = 0; i < numWorkers; i++) {
            try {
                const worker = await this.createWorkerWithRouter(i);
                this.workers.push(worker);
            } catch (error) {
                this.logger.error(`Error creating worker: ${error.message}`);
            }
        }
        this.logger.warn(`WorkersService initialized with workers: ${this.workers?.length} , system cors : ${numCores}`);
    }


    private async createWorkerWithRouter(index: number): Promise<Worker> {
        try {
            const worker = await createWorker({      
                rtcMinPort: 10000,
                rtcMaxPort: 10100,
                logLevel: 'warn',
                logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
            });
            // Handle worker exit
            worker.on('died', () => {
                this.logger.error(`Worker died unexpectedly, recreating...`);
                this.handleWorkerDied(index);
            });
            return worker;
        } catch (error) {
            this.logger.error(`Error creating worker and router: ${error.message}`);
            throw error;
        }
    }

    private async handleWorkerDied(index: number) {
        try {
            // Find the index of the dead worker
            this.logger.warn(`Worker at index ${index} died, replacing...`);
            // Create a new worker and router
            // TODO: Add logic to handle the router and transports for the new worker
            const worker = await this.createWorkerWithRouter(index);
            this.workers[index] = worker;
            this.logger.log(`Successfully replaced dead worker at index ${index}`);
        } catch (error) {
            this.logger.error(`Error handling worker death: ${error.message}`, error.stack);
        }
    }


    getFreeWorker(rooms: rooms): { worker: Worker; index: number } {
        if (!this.workers || this.workers.length === 0) return null;
        // Step 1: Count assigned rooms per worker index
        const usage = new Map<number, number>();
        // Initialize all to 0
        this.workers.forEach((_, i) => usage.set(i, 0));
        // Count usage from current rooms
        for (const roomId in rooms) {
            const index = rooms[roomId].workerindex;
            usage.set(index, (usage.get(index) || 0) + 1);
        }
        // Step 2: Find worker index with least usage
        let minCount = Infinity;
        let selectedIndex = 0;
        for (const [index, count] of usage.entries()) {
            if (count < minCount) {
                minCount = count;
                selectedIndex = index;
            }
        }
        return { worker: this.workers[selectedIndex], index: selectedIndex };
    }

}
