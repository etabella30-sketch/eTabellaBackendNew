import { Injectable, Logger } from '@nestjs/common';
import { RtpCapabilities } from 'mediasoup/node/lib/rtpParametersTypes';
import { connectTransportReq, consumeReq, joinReq, produceReq, returnTransport, rooms } from '../../interfaces/manage.interface';
import { WorkersService } from '../workers/workers.service';
import { SfuConfigService } from '../sfu-config/sfu-config.service';
import type { WebRtcTransport, Consumer } from 'mediasoup/node/lib/types';

@Injectable()
export class ManageService {

    private logger = new Logger('manage-service');

    rooms: rooms = {};
    constructor(private readonly workersService: WorkersService, private readonly sfuConfig: SfuConfigService) {

    }


    async join(body: joinReq): Promise<{ msg: 1 | -1, rtpCapabilities: RtpCapabilities, producerId: string, error?: string }> {
        debugger;
        const { nPresentid, isPresenter, nMasterid } = body;
        this.logger.log(`join request for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
        try {
            // if (isPresenter && this.rooms[nPresentid]) {
            //     return { msg: -1, error: 'Screen sharing already exists for this', rtpCapabilities: null, producerId: null }
            // }
            const { worker, index } = this.workersService.getFreeWorker(this.rooms); // this will find free/least loaded worker
            if (!worker) {
                this.logger.error('No free workers available');
                return { msg: -1, error: 'No free workers available', rtpCapabilities: null, producerId: null }
            }


            await this.cleanUpRoom(nPresentid, nMasterid, isPresenter); // this will clean up the room if it exists
            this.logger.log(`Using worker index: ${index} for presentation id: ${nPresentid}`);

            if (!this.rooms[nPresentid]) {
                this.logger.log(`Creating new router for presentation id: ${nPresentid} on worker index: ${index}`);
                const router = await worker.createRouter({ mediaCodecs: this.sfuConfig.mediaCodecs }); // this will create a new router for the worker
                this.rooms[nPresentid] = { workerindex: index, router, producer: null, producerTransport: null, consumers: {}, transports: {} };
            }
            const rtpCapabilities = this.rooms[nPresentid]?.router?.rtpCapabilities;
            return { msg: 1, rtpCapabilities, producerId: this.rooms[nPresentid].producer?.id || null };
        } catch (error) {
            this.logger.error(`Error in join method: ${error.message}`, error.stack);
            return { msg: -1, error: error.message, rtpCapabilities: null, producerId: null }
        }
    }


    async cleanUpRoom(nPresentid: string, nMasterid: string, isPresenter: boolean): Promise<void> {
        try {
            const room = this.rooms[nPresentid];
            if (!room) return;

            if (isPresenter) {
                // 🔥 Clean up all transports
                for (const [key, transport] of Object.entries(room.transports)) {
                    try {
                        await (transport as WebRtcTransport).close();  // 👈 cast to proper type
                        this.logger.log(`Closed transport: ${key}`);
                    } catch (err) {
                        this.logger.error(`Error closing transport (${key}): ${err.message}`, err.stack);
                    }
                }

                // 🔥 Clean up all consumers
                for (const [key, consumer] of Object.entries(room.consumers)) {
                    try {
                        await (consumer as Consumer).close();  // 👈 cast to proper type
                        this.logger.log(`Closed consumer: ${key}`);
                    } catch (err) {
                        this.logger.error(`Error closing consumer (${key}): ${err.message}`, err.stack);
                    }
                }


                // 🔥 Close producer if exists
                if (room.producer) {
                    try {
                        await room.producer.close();
                        this.logger.log(`Closed producer`);
                    } catch (err) {
                        this.logger.error(`Error closing producer: ${err.message}`, err.stack);
                    }
                }

                // 🔥 Reset the room entirely (but keep router & worker index)
                room.producer = null;
                room.producerTransport = null;
                room.transports = {};
                room.consumers = {};
            } else {
                // 👤 Clean up viewer-specific resources only
                const transportKey = `${nMasterid}-viewer`;
                const consumerKey = `${nMasterid}`;

                // Viewer transport
                const transport = room.transports[transportKey];
                if (transport) {
                    try {
                        await transport.close();
                        this.logger.log(`Closed viewer transport: ${transportKey}`);
                    } catch (err) {
                        this.logger.error(`Error closing viewer transport (${transportKey}): ${err.message}`, err.stack);
                    }
                    delete room.transports[transportKey];
                }

                // Viewer consumer
                const consumer = room.consumers[consumerKey];
                if (consumer) {
                    try {
                        await consumer.close();
                        this.logger.log(`Closed viewer consumer: ${consumerKey}`);
                    } catch (err) {
                        this.logger.error(`Error closing viewer consumer (${consumerKey}): ${err.message}`, err.stack);
                    }
                    delete room.consumers[consumerKey];
                }
            }

            // ✅ Optional: clean up entire room if truly empty (no presenter and no viewers)
            if (
                !room.producer &&
                Object.keys(room.transports).length === 0 &&
                Object.keys(room.consumers).length === 0
            ) {
                delete this.rooms[nPresentid];
                this.logger.log(`Room ${nPresentid} fully cleaned up`);
            }

        } catch (error) {
            this.logger.error(`Error in cleanUpRoom: ${error.message}`, error.stack);
        }
    }

    async createTransport(body: joinReq,host:string): Promise<{ msg: 1 | -1, transport: returnTransport | null, error?: string }> {
        const { nPresentid, isPresenter, nMasterid } = body;
        try {
            this.logger.log(`createTransport request for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
            const room = this.rooms[nPresentid];

            if (!room) {
                this.logger.error(`No room found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No room found', transport: null };
            }
            const options = this.sfuConfig.getTransportOptions(host);
            this.logger.verbose(`Transport Options: `,options);
            // Create a new transport for the room
            const transport = await room.router.createWebRtcTransport(options); //this.sfuConfig.transportOptions
            // Dynamic bitrate adaptation
            transport.on('icestatechange', (iceState) => {
                if (iceState === 'connected') {
                    // Increase bitrate once connected
                    transport.setMaxIncomingBitrate(2000000); // 2Mbps
                }
            });

            if (isPresenter) {
                try {
                    const minBitrate = this.sfuConfig.minimumAvailableOutgoingBitrate || 1000000;
                    await transport.setMinOutgoingBitrate(minBitrate);
                    await transport.setMaxOutgoingBitrate(this.sfuConfig.maxOutgoingBitrate); // 30 Mbps for ultra-high quality (exceeds our 20 Mbps minimum)
                } catch (error) {
                }
            } else {
                const maxBitrate = this.sfuConfig.maxIncomingBitrate;
                await transport.setMaxIncomingBitrate(maxBitrate);
            }

            room.transports[`${nMasterid}-${isPresenter ? 'presenter' : 'viewer'}`] = transport;
            this.logger.log(`Created transport for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
            return {
                msg: 1,
                transport: {
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                    // sctpParameters: transport.sctpParameters
                },
                error: null
            };
        } catch (error) {
            this.logger.error(`Error in createTransport method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message, transport: null };
        }
    }


    async connectTransport(body: connectTransportReq): Promise<{ msg: 1 | -1, error?: string }> {
        const { nPresentid, isPresenter, nMasterid, dtlsParameters } = body;
        try {
            this.logger.log(`connectTransport request for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
            const room = this.rooms[nPresentid];
            if (!room) {
                this.logger.error(`No room found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No room found' };
            }
            const transport = room?.transports[`${nMasterid}-${isPresenter ? 'presenter' : 'viewer'}`];
            await transport.connect({ dtlsParameters });
            this.logger.log(`Connected transport for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
            return { msg: 1, error: null };
        } catch (error) {
            this.logger.error(`Error in connectTransport method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message };
        }
    }

    async produce(body: produceReq): Promise<{ msg: 1 | -1, error?: string, id?: string }> {
        const { nPresentid, nMasterid, rtpParameters, kind } = body;
        try {
            this.logger.log(`produce request for presentation id: ${nPresentid}`);
            const room = this.rooms[nPresentid];
            if (!room) {
                this.logger.error(`No room found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No room found', id: null };
            }

            const transport = room.transports[`${nMasterid}-presenter`];

            const producer = await transport.produce({
                kind,
                rtpParameters,
                ...this.sfuConfig.transportProducerOptions
            });

            room.producer = producer;
            room.producerTransport = transport;

            this.logger.log(`Produced for presentation id: ${nPresentid} `);
            return { msg: 1, error: null, id: producer.id };
        } catch (error) {
            this.logger.error(`Error in produce method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message, id: null };
        }
    }


    async consume(body: consumeReq): Promise<{ msg: 1 | -1, error?: string, consumer?: { id: string, producerId: string, kind: string, rtpParameters: any } }> {
        const { nPresentid, nMasterid, rtpCapabilities } = body;
        try {
            this.logger.log(`consume request for presentation id: ${nPresentid} by master id: ${nMasterid}`);
            const room = this.rooms[nPresentid];
            if (!room) {
                this.logger.error(`No room found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No room found', consumer: null };
            }
            const transport = room.transports[`${nMasterid}-viewer`];
            const router = room.router;
            if (!transport) {
                this.logger.error(`No transport found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No transport found', consumer: null };
            }
            if (!router.canConsume({ producerId: room.producer.id, rtpCapabilities })) {
                return { msg: -1, error: 'Cannot consume', consumer: null };
            }
            const consumer = await transport.consume({
                producerId: room.producer.id,
                rtpCapabilities,
                paused: false,
                preferredLayers: { spatialLayer: 2, temporalLayer: 2 },
                bufferSize: 8 // Add a larger buffer for stability during movement
            });

            this.logger.verbose(`Consumer type  ${consumer.type} `);
            // Monitor consumer score to determine quality
            // Monitor consumer score to determine quality
            // Disable dynamic quality adaptation to prevent blurry video during movement
            consumer.on('score', async (score) => {
                try {
                    const producerScore = score.producerScore;
                    const consumerScore = score.score;
                    
                    this.logger.verbose(
                        `Consumer score for user ${nMasterid}: ${consumerScore}, producerScore: ${producerScore}`
                    );
                    
                    // Always maintain highest quality for screen sharing
                    // Only drop quality in extremely poor network conditions (below 3)
                    if (consumerScore < 3) {
                        this.logger.warn(`Very poor network conditions for user ${nMasterid}, score: ${consumerScore}`);
                    } else {
                        // Force highest quality to prevent blur during movement
                        await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
                    }
                } catch (error) {
                    this.logger.error(`Error in consumer score event: ${error.message}`, error.stack);
                }
            });

            await consumer.setPreferredLayers({
                spatialLayer: 2, // Highest resolution
                temporalLayer: 2 // Highest frame rate
            });


            // Add to your consumer setup
            let lastKeyFrameRequest = Date.now();

            // Monitor consumer stats
            consumer.on('layerschange', async (layers) => {
                // Request a keyframe when layers change
                // const now = Date.now();
                // if (now - lastKeyFrameRequest > 2000) { // No more than once every 2 seconds
                //     await consumer.requestKeyFrame();
                //     lastKeyFrameRequest = now;
                // }
            });



            room.consumers[nMasterid] = consumer;
            this.logger.log(`Consumed for presentation id: ${nPresentid} by master id: ${nMasterid}`);

            setTimeout(async () => {
                await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
            }, 500);

            return {
                msg: 1, error: null, consumer: {
                    id: consumer.id,
                    producerId: room.producer.id,
                    kind: consumer.kind,
                    rtpParameters: consumer.rtpParameters
                }
            };
        } catch (error) {
            this.logger.error(`Error in consume method: ${error.message} by master id : ${nMasterid}`, error.stack);
            return { msg: -1, error: error?.message, consumer: null };
        }
    }



}
