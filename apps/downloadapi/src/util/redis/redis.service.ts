import { Injectable, Logger } from '@nestjs/common';
import { RedisHandler } from './redis.handler';
import { LogService } from '@app/global/utility/log/log.service';
import { ConfigService } from '@nestjs/config';
import { actionStatus, batchStatus, LargeFileBatch, queueStatus, QueueSummary, SmallFileBatch } from '../../interfaces/download.interface';
import { DateTimeService } from '@app/global/utility/date-time/date-time.service';
import { ConfigKeyService } from '../config-key/config-key.service';
import { Job } from 'bull';

@Injectable()
export class RedisService extends RedisHandler {
    private processKey = 'download';
    private readonly logger = new Logger('redis-service');
    constructor(public logService: LogService, public config: ConfigService, private readonly date: DateTimeService, private readonly configKeyService: ConfigKeyService) {
        super(logService, config)
    }



    async processSetup(nDPid: string, totalFiles: number): Promise<void> {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            // Additional setup logic can be added here if needed
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary: Record<string, any> = {
                total: totalFiles,
                created: this.date.getCurrentTime(),
                completedParts: 0,
                totalParts: 0,
                MergeCompletedParts: 0,
                MergeTotalParts: 0,
                attempts: 0
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }

    }


    /**
     * Increment MergeCompletedParts by 1 and return the new value.
     * Throws if Redis fails.
     */
    async retryAttempts(nDPid: string): Promise<number> {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            const newCount = await this.redis.hincrby(summaryKey, 'attempts', 1);
            this.logger.log(`MergeCompletedParts for NDP ID=${nDPid} → ${newCount}`);
            return newCount;
        } catch (err) {
            this.logger.error(
                `Error incrementing MergeCompletedParts for NDP ID=${nDPid}: ${err.message}`,
                err.stack,
            );
            // throw err;
        }
    }



    /**
     * Add a single subscriber to an existing run—but only if they're not already subscribed.
     * @returns true if the user was newly added, false if they were already in the set
     */
    async addSubscriber(nDPid: string, userId: string): Promise<boolean> {
        const key = `${this.processKey}:${nDPid}:subscribers`;

        try {
            // check membership (returns 1 if present, 0 if not)
            const isMember = await this.redis.sismember(key, userId);
            if (isMember) {
                this.logger.verbose(`User ${userId} is already subscribed to ${nDPid}`);
                return false;
            }

            // not present → add them
            await this.redis.sadd(key, userId);
            this.logger.log(`Added subscriber ${userId} for NDP ID ${nDPid}`);
            return true;
        } catch (error) {
            this.logger.error(`Error adding subscriber for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Get all subscribers (user-IDs) for a run.
     */
    async getSubscribers(nDPid: string): Promise<string[]> {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            return this.redis.smembers(key);
        } catch (error) {
            this.logger.error(`Error getting subscribers for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Remove a single subscriber from a run.
     */
    async removeSubscriber(nDPid: string, userId: string): Promise<void> {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            await this.redis.srem(key, userId);
        } catch (error) {
            this.logger.error(`Error removing subscriber ${userId} for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * (Optional) Clear *all* subscribers for a run.
     */
    async clearSubscribers(nDPid: string): Promise<void> {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            await this.redis.del(key);
        } catch (error) {
            this.logger.error(`Error clearing subscribers for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }







    async setupBatchSizes(nDPid: string, smallBatchs: number, largeBatches: number): Promise<void> {

        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            // Additional setup logic can be added here if needed
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary: Record<string, any> = {
                smallBatchs: smallBatchs || 0,
                largeBatches: largeBatches || 0,
                lastUpdated: this.date.getCurrentTime()
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async updateActionStatus(nDPid: string, mainJob: Job, actionStatus: actionStatus): Promise<void> {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            // Additional setup logic can be added here if needed
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary: Record<string, any> = {
                actionStatus: actionStatus,
                lastUpdated: this.date.getCurrentTime()
            };
            if (actionStatus == 'FINAL-MEARGING') {
                summary.isAllPartsUploaded = true;
            }
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();

            try {
                await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', actionStatus })
            } catch (error) {
                this.logger.error(`Error updating job progress for NDP ID ${nDPid}: ${error.message}`, error.stack);
            }

        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async updateQueueStatus(nDPid: string, queueStatus: queueStatus): Promise<void> {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            // Additional setup logic can be added here if needed
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary: Record<string, any> = {
                queueStatus: queueStatus,
                lastUpdated: this.date.getCurrentTime()
            };
            if (queueStatus == 'active') {
                summary.dStartDt = this.date.getCurrentTime();
            }
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async updateBatchStatus(nDPid: string, value: boolean, key: 'largeBatchAdded' | 'smallBatchAdded'): Promise<void> {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            // Additional setup logic can be added here if needed
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary: Record<string, any> = {
                [key]: value,
                lastUpdated: this.date.getCurrentTime()
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }


    async getBatchStatus(nDPid: string, key: 'largeBatchAdded' | 'smallBatchAdded'): Promise<boolean> {
        try {
            this.logger.log(`Getting batch status for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const status = await this.redis.hget(summaryKey, key);
            return status === 'true'; // Convert string to boolean
        } catch (error) {
            this.logger.error(`Error getting batch status for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }



    /** 1. Map batchId → uploadId in the hash */
    async addActiveBatch(
        nDPid: string,
        batch: 'small' | 'large',
        batchId: number,
        uploadId: string,
    ): Promise<void> {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            await this.redis.hset(key, batchId.toString(), uploadId);
            this.logger.log(`Mapped active batch ${batchId} → uploadId ${uploadId} in ${key}`);
        } catch (error) {
            this.logger.error(`Error adding active batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /** 2. Remove the batchId field from the hash */
    async removeActiveBatch(
        nDPid: string,
        batch: 'small' | 'large',
        batchId: number,
    ): Promise<void> {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            await this.redis.hdel(key, batchId.toString());
            this.logger.log(`Removed mapping for batch ${batchId} in ${key}`);
        } catch (error) {
            this.logger.error(`Error removing active batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /** 3. Check & return the uploadId for a batchId (or null if not found) */
    async getUploadIdForBatch(
        nDPid: string,
        batch: 'small' | 'large',
        batchId: number,
    ): Promise<string | null> {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            const uploadId = await this.redis.hget(key, batchId.toString());
            if (uploadId) {
                this.logger.log(`Found uploadId ${uploadId} for batch ${batchId} in ${key}`);
                return uploadId;
            }
            this.logger.log(`No active upload for batch ${batchId} in ${key}`);
            return null;
        } catch (error) {
            this.logger.error(`Error getting uploadId for batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }

    }



    async updateTotalPartsCount(nDPid: string, totalParts: number, totalSize: number): Promise<void> {
        try {
            this.logger.log(`Setting total parts for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            await this.redis.hset(summaryKey, {
                // completedParts: '0',
                totalParts: totalParts.toString(),
                totalSize: totalSize?.toString(),
            });
            // await this.redis.hset(summaryKey, 'totalParts', totalParts.toString());
            this.logger.log(`Total parts set to ${totalParts} for NDP ID: ${nDPid}`);
        } catch (error) {
            this.logger.error(`Error setting total parts for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }


    /* async completeRefreshCount(nDPid: string): Promise<void> {
         try {
             const summaryKey = `${this.processKey}:${nDPid}:summary`;
             this.redis.multi().hincrby(summaryKey, `completedParts`, 1).exec();
         } catch (error) {
             this.logger.error(`Error completing refresh count for NDP ID ${nDPid}: ${error.message}`, error.stack);
             // throw error;
         }
     }*/

    async completeRefreshCount(nDPid: string): Promise<number> {
        try {
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            // This returns the new value
            const newCount = await this.redis.hincrby(summaryKey, 'completedParts', 1);
            return newCount;
        } catch (error) {
            this.logger.error(
                `Error completing refresh count for NDP ID ${nDPid}: ${error.message}`,
                error.stack,
            );
            throw error;
        }
    }

    async getQueueSummary(nDPid: string): Promise<QueueSummary> {
        try {
            this.logger.log(`Getting queue summary for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = await this.redis.hgetall(summaryKey);
            if (!summary) {
                this.logger.warn(`No summary found for NDP ID: ${nDPid}`);
                return null;
            }
            // Convert string values to appropriate types
            return {
                total: parseInt(summary?.total, 10),
                created: summary?.created,
                lastUpdated: summary?.lastUpdated || this.date.getCurrentTime(),
                completedParts: parseInt(summary?.completedParts, 10),
                totalParts: parseInt(summary?.totalParts, 10),
                actionStatus: summary?.actionStatus as actionStatus,
                queueStatus: summary?.queueStatus as queueStatus,
                smallBatchs: parseInt(summary?.smallBatchs, 10) || 0,
                largeBatches: parseInt(summary?.largeBatches, 10) || 0,
                smallBatchAdded: summary?.smallBatchAdded === 'true',
                largeBatchAdded: summary?.largeBatchAdded === 'true',
                isAllPartsUploaded: summary?.isAllPartsUploaded === 'true' || false, // Default to false if not set
                MergeCompletedParts: parseInt(summary?.MergeCompletedParts, 10) || 0,
                MergeTotalParts: parseInt(summary?.MergeTotalParts, 10) || 0,
                dStartDt: summary?.dStartDt || null, // Optional field
                totalSize: parseInt(summary?.totalSize, 10) || 0
            };
        } catch (error) {
            this.logger.error(`Error getting queue summary for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }

    }

    /*
        async addActiveBatch(
            nDPid: number,
            batch: 'small' | 'large',
            batchId: number,
        ): Promise<void> {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            try {
                await this.redis.sadd(key, batchId.toString());
                this.logger.log(`Added active batch ${batchId} → ${key}`);
            } catch (error) {
                this.logger.error(
                    `Error adding active batch ${batchId} for NDP ${nDPid}: ${error.message}`,
                );
                throw error;
            }
        }
    
        async removeActiveBatch(
            nDPid: number,
            batch: 'small' | 'large',
            batchId: number,
        ): Promise<void> {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            try {
                await this.redis.srem(key, batchId.toString());
                this.logger.log(`Removed active batch ${batchId} ← ${key}`);
            } catch (error) {
                this.logger.error(
                    `Error removing active batch ${batchId} for NDP ${nDPid}: ${error.message}`,
                );
                throw error;
            }
        }
    
        async isActiveBatch(
            nDPid: number,
            batch: 'small' | 'large',
            batchId: number,
        ): Promise<boolean> {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            try {
                const isMember = await this.redis.sismember(key, batchId.toString());
                return isMember === 1;
            } catch (error) {
                this.logger.error(
                    `Error checking active batch ${batchId} for NDP ${nDPid}: ${error.message}`,
                );
                throw error;
            }
        }
    */



    /*async setupBatchSummary(nDPid: number, batchType: 'small' | 'large', batchId: number, totalSize: number, totalParts: number): Promise<void> {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}, Batch ID: ${batchId}`);
            // Additional setup logic can be added here if needed
            const batchKey = `${this.processKey}:${nDPid}:batchs:summary:${batchType}:${batchId}`;
            const batchSummary: Record<string, any> = {
                completedParts: 0,
                currentPart: 0,
                totalParts: totalParts,
                totalSize: totalSize,
                status: 'waiting',
                created: this.date.getCurrentTime()
            };
            await this.redis.pipeline()
                .hmset(batchKey, batchSummary)
                .exec();
        } catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}, Batch ID ${batchId}: ${error.message}`, error.stack);
            throw error;
        }
    }*/
    /*
        async setupBatchSummary(nDPid: number, batchType: 'small' | 'large', allBatches: LargeFileBatch[] | SmallFileBatch[]): Promise<void> {
            // Combine large & small batches
            const pipeline = this.redis.pipeline();
            for (const batch of allBatches) {
                const key = `${this.processKey}:${nDPid}:batches:summary:${batchType}:${batch.batchIndex}`;
                pipeline.hset(key, {
                    completedParts: 0,
                    currentPart: 0,
                    totalParts: batch.totalParts,
                    totalSize: batch.totalSize,
                    status: 'waiting',
                    created: this.date.getCurrentTime(),
                });
                pipeline.expire(key, 60 * 60 * 24); // expire in 24 h
            }
            await pipeline.exec();
            this.logger.log(`Initialized ${allBatches.length} batch summaries for nDPid=${nDPid}`);
        }
    
    
        async updateBatchStatus(nDPid: number, batchId: number, status: queueStatus): Promise<void> {
            try {
                // this.logger.log(`Updating batch status for NDP ID: ${nDPid}, Batch ID: ${batchId}, Status: ${status}`);
                const batchKey = `${this.processKey}:${nDPid}:batches:summary:${batchId}`;
                const batchSummary: Record<string, any> = {
                    status: status,
                    lastUpdated: this.date.getCurrentTime()
                };
                await this.redis.pipeline()
                    .hmset(batchKey, batchSummary)
                    .exec();
            } catch (error) {
                this.logger.error(`Error updating batch status for NDP ID ${nDPid}, Batch ID ${batchId}: ${error.message}`, error.stack);
                throw error;
            }
        }*/


    /** Initialize both MergeCompletedParts = 0 and MergeTotalParts = totalParts */
    async finalMergeTotalPartsCount(nDPid: string, totalParts: number): Promise<void> {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            // Combine into a single HSET
            await this.redis.hset(summaryKey, {
                MergeCompletedParts: '0',
                MergeTotalParts: totalParts.toString(),
            });
            this.logger.log(`Initialized merge parts for NDP ID=${nDPid}: total=${totalParts}`);
        } catch (err) {
            this.logger.error(
                `Error initializing merge parts for NDP ID=${nDPid}: ${err.message}`,
                err.stack,
            );
            // throw err;
        }
    }

    /**
     * Increment MergeCompletedParts by 1 and return the new value.
     * Throws if Redis fails.
     */
    async finalMergeCompleteRefreshCount(nDPid: string): Promise<number> {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            const newCount = await this.redis.hincrby(summaryKey, 'MergeCompletedParts', 1);
            this.logger.log(`MergeCompletedParts for NDP ID=${nDPid} → ${newCount}`);
            return newCount;
        } catch (err) {
            this.logger.error(
                `Error incrementing MergeCompletedParts for NDP ID=${nDPid}: ${err.message}`,
                err.stack,
            );
            // throw err;
        }
    }



}