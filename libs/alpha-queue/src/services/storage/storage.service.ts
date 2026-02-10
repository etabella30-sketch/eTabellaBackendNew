import { AlphaQueueOptions, queueLog, QueueProgressSummary, QueueStep } from "@app/alpha-queue/interfaces/queue.interface";
import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { QueueConnectionManager } from "../connection/queue.connection.service";
import { LogService } from "@app/global/utility/log/log.service";
import { DateTimeService } from "@app/global/utility/date-time/date-time.service";
import { logList } from "@app/alpha-queue/interfaces/queue-log.interface";

@Injectable()
export class StorageManageService {

    private redis: Redis;
    private readonly appName: string = `queue/${this.config.name}`;

    private readonly logger = new Logger('alpha-queue');
    constructor(@Inject('QUEUE_CONFIG') private readonly config: AlphaQueueOptions, private readonly queuConnection: QueueConnectionManager, private readonly logService: LogService, private readonly datetime: DateTimeService) {
    }

    async initialize() {
        try {
            this.redis = this.queuConnection.getRedisClient();
        } catch (error) {
            this.logService.error(`Error in redis ${error?.message}`, this.appName)
            throw new Error(`Error during redis : ${error?.message}`);
        }


        // setTimeout(async () => {
        //     this.logger.verbose('GETTING DATA');
        //     const data = await this.getHashLog();
        //     this.logger.verbose('LOG DATA', data)
        // }, 5000);
    }


    ////// REDIS COMMON SET

    async setValue(key: string, value: any, expirationInSeconds?: number): Promise<void> {
        try {
            if (expirationInSeconds) {
                // Set the key with an expiration time.
                await this.redis.set(key, value, 'EX', expirationInSeconds);
            } else {
                // Set the key without expiration.
                await this.redis.set(key, value);
            }
        } catch (error) {
            // Log the error and rethrow it.
            // Replace with your logging solution if available.
            console.error(`Error setting value for key "${key}": ${error.message}`);
        }
    }


    async getValue(key: string): Promise<any> {
        try {
            return await this.redis.get(key);
        } catch (error) {
            console.error(`Error getting value for key "${key}": ${error.message}`);
        }
    }

    async deleteValue(...keys: string[]): Promise<void> {
        try {
            const result = await this.redis.del(...keys);
            // Optionally, you could log the number of keys deleted.
        } catch (error) {
            console.error(`Error deleting keys "${keys.join(', ')}": ${error.message}`);
        }
    }



    async hSet(hashKey: string, field: string, value: string): Promise<boolean> {
        const result = await this.redis.hsetnx(hashKey, field, value);
        return result === 1;
    }

    async removehSet(hashKey: string, field: string): Promise<boolean> {
        const result = await this.redis.hdel(hashKey, field);
        return result > 0;
    }

    //////////////ACTIVE USERS

    async setActiveUser(MASTER_QUEUE: string, masterId: string, userData: any): Promise<boolean> {
        try {
            const key = `queue:tasks:${this.config.nTCatid}:active_users`;
            const value = JSON.stringify(userData);
            // hsetnx sets the field only if it does not already exist.
            const result = await this.redis.hsetnx(key, masterId, value);
            // Set or update the expiration time for the entire hash key to 24 hours (86400 seconds)
            await this.redis.expire(key, 86400);
            return result === 1;
        } catch (error) {
            this.logger.error(error);
            this.logService.error(`Error during setActive user ${error?.message}`, this.appName);
        }
    }

    async removeActiveUser(MASTER_QUEUE: string, masterId: string): Promise<boolean> {
        try {
            const key = `queue:tasks:${this.config.nTCatid}:active_users`;
            const result = await this.redis.hdel(key, masterId);
            return result > 0;
        } catch (error) {
            this.logger.error(error);
            this.logService.error(`Error during removeActive user ${error?.message}`, this.appName);
        }
        return true;
    }
    async getActiveUsers(): Promise<{ masterId: string; data: any }[]> {
        try {
            const key = `queue:tasks:${this.config.nTCatid}:active_users`;
            // Fetch all fields and values from the hash
            const users = await this.redis.hgetall(key);
            // Convert Redis response to array of objects with parsed JSON
            return Object.entries(users).map(([masterId, data]) => ({
                masterId,
                data: JSON.parse(data),
            }));
        } catch (error) {
            this.logger.error(error);
            this.logService.error(`Error fetching active users: ${error?.message}`, this.appName);
            return [];
        }
    }

    async addActiveTask(masterId: string, nRid: number, taskId: string): Promise<void> {
        try {
            if (!taskId) return;
            const key = `queue:active:${masterId}:${nRid}:active_tasks`;
            const value = this.datetime.getCurrentTime();
            await this.redis.pipeline()
                .hset(key, taskId, value)
                .expire(key, 4 * 60 * 60) // Set expiration to 4 hours
                .exec();
        } catch (error) {
            this.logger.error(`Error adding active task ${taskId}: ${error.message}`);
        }
    }

    async removeActiveTask(masterId: string, nRid: number, taskId: string): Promise<void> {
        try {
            if (!taskId) return;
            const key = `queue:active:${masterId}:${nRid}:active_tasks`;
            await this.redis.hdel(key, taskId);
        } catch (error) {
            this.logger.error(`Error removing active task ${taskId}: ${error.message}`);
        }
    }

    async getActiveTasks(masterId: string, nRid: number): Promise<string[]> {
        try {
            const key = `queue:active:${masterId}:${nRid}:active_tasks`;
            const activeTaskIds = await this.redis.hkeys(key);
            return activeTaskIds;
        } catch (error) {
            this.logger.error(`Error retrieving active tasks for masterId ${masterId}: ${error.message}`);
        }
    }


    async createQueueSummary(masterId: string, totalTasks: number, nTCatid: number, steps: QueueStep[], keepAlive: number): Promise<boolean> {
        try {
            const summaryKey = `queue:summary:${nTCatid}:${masterId}`;
            const summary: Record<string, any> = {
                total: totalTasks,
                completed: 0,
                failed: 0,
            };
            steps.forEach((step, index) => {
                const pending = (index === 0 && !keepAlive) ? totalTasks : 0;
                summary[`${step.nRid}:complete`] = 0;
                summary[`${step.nRid}:failed`] = 0;
                summary[`${step.nRid}:pending`] = pending;
                summary[`${step.nRid}:processing`] = 0;
                summary[`${step.nRid}:total`] = pending;
            });
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .expire(summaryKey, 86400)
                .exec();

            this.logger.log(summaryKey, summary)
            return true;
        } catch (error) {
            this.logger.error(error)
            throw new Error(`Error during creating Summary: ${error.message}`);
        }
    }


    async deleteQueueSummary(masterId: string, nTCatid: number): Promise<boolean> {
        try {
            const summaryKey = `queue:summary:${nTCatid}:${masterId}`;
            const result = await this.redis.del(summaryKey);
            return result > 0;
        } catch (error) {
        }
    }

    isLastStep(nRid: number) {
        try {
            const steps = this.config.steps || [];
            const ind = steps.findIndex(a => a.nRid == nRid);
            return ind == (steps?.length - 1);
        } catch (error) {
            this.logService.error(`Error  ${error?.message}`, this.appName);

            return false;
        }
    }

    async updateQueueProgress(masterId: string, nRid: number, nTCatid: number, status: 'completed' | 'failed' | 'task-failed' | 'processing' | 'adding' | 'remove-process'): Promise<void> {
        const multi = this.redis.multi();
        try {
            const summaryKey = `queue:summary:${nTCatid}:${masterId}`;
            switch (status) {
                case 'completed':
                    await this.handleCompletedStatus(multi, summaryKey, nRid);
                    break;
                case 'failed':
                    await this.handleFailedStatus(multi, summaryKey, nRid);
                    break;
                case 'task-failed':
                    await this.handleTaskFailedStatus(multi, summaryKey, nRid);
                    break;
                case 'processing':
                    await this.handleProcessingStatus(multi, summaryKey, nRid);
                    break;
                case 'adding':
                    await this.handleAddingStatus(multi, summaryKey, nRid);
                    break;
                case 'remove-process':
                    await this.handleRemoveProcessStatus(multi, summaryKey, nRid);
                    break;
                // case 'sub-queue-start':
                //     await this.handleSubQueueProcessStart(multi, summaryKey, nRid);
                //     break;
                // case 'sub-queue-last-update':
                //     await this.handleSubQueueProcessEnd(multi, summaryKey, nRid);
                //     break;

            }

            multi.hset(summaryKey, 'last_updated', this.datetime.getCurrentTime());
            await multi.exec();

        } catch (error) {
            this.logService.error(`Error in prgress update ${error?.message}`, this.appName)
        }
    }


    private async handleCompletedStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        const isLast = this.isLastStep(nRid)
        multi
            .hincrby(progressKey, `${nRid}:complete`, 1)
            .hincrby(progressKey, `${nRid}:processing`, -1)
            .hset(progressKey, `${nRid}:lastDt`, this.datetime.getCurrentTime());

        if (isLast)
            multi.hincrby(progressKey, `completed`, 1)
    }

    private async handleFailedStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        const isLast = this.isLastStep(nRid)
        multi
            .hincrby(progressKey, `${nRid}:failed`, 1)
            .hincrby(progressKey, `${nRid}:processing`, -1)
            .hset(progressKey, `${nRid}:lastDt`, this.datetime.getCurrentTime());
        // if (isLast)
        // multi.hincrby(progressKey, `failed`, 1)
    }

    private async handleTaskFailedStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        multi.hincrby(progressKey, `failed`, 1)
    }

    private async handleProcessingStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        multi
            .hsetnx(progressKey, 'process_dt', this.datetime.getCurrentTime())
            .hincrby(progressKey, `${nRid}:processing`, 1)
            .hincrby(progressKey, `${nRid}:pending`, -1)
            .hsetnx(progressKey, `${nRid}:startDt`, this.datetime.getCurrentTime());
    }

    private async handleRemoveProcessStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        multi
            .hsetnx(progressKey, 'process_dt', this.datetime.getCurrentTime())
            .hincrby(progressKey, `${nRid}:processing`, -1)
            .hincrby(progressKey, `${nRid}:pending`, 1);
    }


    private async handleAddingStatus(
        multi: any,
        progressKey: string,
        nRid: number
    ): Promise<void> {
        multi
            .hsetnx(progressKey, 'process_dt', this.datetime.getCurrentTime())
            .hincrby(progressKey, `${nRid}:total`, 1)
            .hincrby(progressKey, `${nRid}:pending`, 1);
    }


    // private async handleSubQueueProcessStart(
    //     multi: any,
    //     progressKey: string,
    //     nRid: number
    // ): Promise<void> {
    //     multi
    //         .hsetnx(progressKey, `${nRid}:startDt`, this.datetime.getCurrentTime());
    // }



    // private async handleSubQueueProcessEnd(
    //     multi: any,
    //     progressKey: string,
    //     nRid: number
    // ): Promise<void> {
    //     multi
    //         .hset(progressKey, `${nRid}:lastupdate`, this.datetime.getCurrentTime());
    // }

    async resetProcessingToPending(masterId: string): Promise<void> {
        const summaryKey = `queue:summary:${this.config.nTCatid}:${masterId}`;
        try {
            const summary = await this.redis.hgetall(summaryKey);
            if (!summary || Object.keys(summary).length === 0) {
                this.logger.warn(`No summary found for masterId ${masterId}`)
                this.logService.warn(`No summary found for masterId ${masterId}`, this.appName);
                return;
            }

            const multi = this.redis.multi();

            this.config.steps.forEach(step => {
                const fieldProcessing = `${step.nRid}:processing`;
                const fieldPending = `${step.nRid}:pending`;

                const processingCount = parseInt(summary[fieldProcessing] || '0', 10);

                if (processingCount > 0) {
                    multi.hincrby(summaryKey, fieldPending, processingCount);
                    multi.hset(summaryKey, fieldProcessing, 0);
                }
            });

            await multi.exec();
            this.logService.info(`Reset processing to pending for masterId ${masterId}`, this.appName);
        } catch (error) {
            this.logger.error(error);
            this.logService.error(
                `Error resetting processing to pending for masterId ${masterId}: ${error.message}`,
                this.appName
            );
        }
    }

    private formatQueueSummary(progressData: Record<string, string>): QueueProgressSummary {
        try {
            const summary: QueueProgressSummary = {
                total: parseInt(progressData.total || '0'),
                completed: parseInt(progressData.completed || '0'),
                failed: parseInt(progressData.failed || '0'),
                lastUpdated: progressData.last_updated,
                processDt: progressData.process_dt,
                steps: {}
            };

            this.config.steps.forEach(step => {
                summary.steps[step.nRid] = {
                    complete: parseInt(progressData[`${step.nRid}:complete`] || '0') || 0,
                    failed: parseInt(progressData[`${step.nRid}:failed`] || '0') || 0,
                    pending: parseInt(progressData[`${step.nRid}:pending`] || '0') || 0,
                    processing: parseInt(progressData[`${step.nRid}:processing`] || '0') || 0,
                    total: parseInt(progressData[`${step.nRid}:total`] || '0') || 0,
                    startDt: progressData[`${step.nRid}:startDt`],
                    lastDt: progressData[`${step.nRid}:lastDt`]
                };
            });

            return summary;
        } catch (error) {
            this.logService.error(`Failed to formatQueueSummary: ${error?.message}`, this.appName);
            return {} as QueueProgressSummary;
        }
    }



    async getQueueSummary(masterId: string): Promise<QueueProgressSummary | null> {
        const progressKey = `queue:summary:${this.config.nTCatid}:${masterId}`;
        try {
            const progressData = await this.redis.hgetall(progressKey);
            if (!progressData || Object.keys(progressData).length === 0) {
                return null;
            }
            return this.formatQueueSummary(progressData);
        } catch (error) {
            this.logService.error(
                `Failed to retrieve progress summary for masterId ${masterId}: ${error?.message}`,
                this.appName
            );
            return null;
        }
    }

    /*
        async logTaskStart(masterId: string, taskId: string, nRid: number): Promise<void> {
            try {
                if (!taskId) {
                    this.logger.error(`Task id not found for ${masterId} nRid:${nRid}`)
                    this.logService.error(`Task id not found for ${masterId} nRid:${nRid}`, this.appName);
                    return;
                }
                const key = `queue:log:${masterId}:${taskId}`;
                const startDt = this.datetime.getCurrentTime();
                const logData = {
                    id: taskId,
                    [`${nRid}:startdt`]: startDt
                };
                await this.redis.hmset(key, logData);
                await this.redis.expire(key, 7 * 24 * 60 * 60);
            } catch (error) {
                this.logger.error(`Error logging start for task ${taskId}: ${error.message}`);
            }
        }
    
    
    
        async logTaskEnd(masterId: string, taskId: string, nRid: number, status: 0 | 1 | 2): Promise<void> {
            try {
                if (!taskId) {
                    this.logger.error(`Task id not found for ${masterId}`);
                    this.logService.error(`Task id not found for ${masterId}`, this.appName);
                    return;
                }
    
                const key = `queue:log:${masterId}:${taskId}`;
                const endDt = this.datetime.getCurrentTime();
    
                // Store the end time and status
                await this.redis.hmset(key, {
                    [`${nRid}:enddt`]: endDt,
                    [`${nRid}:status`]: status
                });
    
            } catch (error) {
                this.logger.error(`Error logging end for task ${taskId}: ${error.message}`);
            }
        }
    
    
        async getTaskAllLogs(masterId: string): Promise<queueLog[]> {
            try {
                const pattern = `queue:log:${masterId}:*`;
                const keys = await this.redis.keys(pattern);
    
                if (!keys || keys.length === 0) {
                    this.logger.debug(`No logs found for masterId ${masterId}`);
                    return [];
                }
    
                const pipeline = this.redis.pipeline();
                keys.forEach(key => pipeline.hgetall(key));
                const results = await pipeline.exec();
    
                const logs: queueLog[] = [];
    
                keys.forEach((key, index) => {
                    const [error, data]: any = results[index];
    
                    if (error) {
                        this.logger.error(`Error retrieving log for key ${key}: ${error.message}`);
                        return;
                    }
    
                    const taskId = key.split(':').pop(); // Extract taskId from key
    
                    Object.keys(data).forEach(field => {
                        const match = field.match(/^(\d+):(startdt|enddt|status)$/);
                        if (match) {
                            const [, nRid, fieldType] = match;
                            let entry = logs.find(e => e.id === taskId && e.nRid === Number(nRid));
                            if (!entry) {
                                entry = { id: taskId, nRid: Number(nRid), startdt: null, enddt: null, status: 0 };
                                logs.push(entry);
                            }
                            entry[fieldType] = fieldType === "status" ? Number(data[field]) : data[field];
                        }
                    });
                });
    
                return logs;
            } catch (error) {
                this.logger.error(`Error retrieving task logs for masterId ${masterId}: ${error.message}`);
                return [];
            }
        }*/



    async cleanupRediskeys(masterId: string): Promise<void> {
        try {
            // Define the pattern for keys that you want to delete.
            const keysToDelete: string[] = [];
            /*const pattern = `queue:log:${masterId}:*`;

            // Use SCAN to iterate over keys matching the pattern.
            let cursor = '0';
            do {
                // SCAN returns a two-element array: [newCursor, keys]
                const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = newCursor;
                keysToDelete.push(...keys);
            } while (cursor !== '0');*/

            // Also add the explicit keys that do not use wildcards.
            keysToDelete.push(`queue:log:${masterId}`);
            keysToDelete.push(`queue:summary:${this.config.nTCatid}:${masterId}`);

            if (keysToDelete.length > 0) {
                // Use a pipeline to delete keys in a batch.
                const pipeline = this.redis.pipeline();
                keysToDelete.forEach(key => pipeline.del(key));
                const results = await pipeline.exec();
                this.logger.log(`Deleted keys: ${keysToDelete.join(', ')}`);
            } else {
                this.logger.log(`No keys to delete for masterId ${masterId}`);
            }
        } catch (error) {
            this.logger.error(`Error cleaning up Redis keys for masterId ${masterId}: ${error.message}`);

        }
    }

    async getTotalTasksCount(): Promise<number> {
        try {
            const keys = await this.redis.keys(`queue:summary:${this.config.nTCatid}:*`);
            return keys?.length;
        } catch (error) {
            return 0;
        }
    }

    /// LOG

    async insertLog(nTid: string, nRid: number, nBDid: string, status: 'P' | 'S' | 'F' | 'C'): Promise<boolean> {
        try {
            const key = `queue:log:${this.config.name}:${nTid}:${nRid}`;
            const field = `${nBDid}:${status}`;
            await this.redis.hsetnx(key, field, this.datetime.getCurrentTime());
            return true;
        } catch (error) {
            this.logger.error('Error inserting log:', error);
            this.logService.error(`Error inserting log: ${error?.message}`, this.appName);
        }
    }

    async getHashLog(): Promise<logList[]> {
        try {
            const pattern = `queue:log:${this.config.name}:*`;
            const keys = await this.redis.keys(pattern);
            const result = [];

            if (keys.length > 0) {
                const multi = this.redis.multi();
                keys.forEach(key => multi.hgetall(key));
                const responses = await multi.exec();

                responses.forEach((response, index) => {
                    if (!response[1]) return;

                    // Extract nTid and nRid from the key
                    const key = keys[index];
                    const keyParts = key.split(':');
                    const nTid = keyParts[3]; // Extract nTid
                    const nRid = parseInt(keyParts[4]); // Extract nRid

                    const hashData = response[1];
                    Object.entries(hashData).forEach(([field, date]) => {
                        const [nBDid, value] = field.split(':');
                        result.push({
                            nTid,
                            nRid,
                            nBDid: nBDid,
                            value: value as 'P' | 'S' | 'F' | 'C',
                            date
                        });
                    });
                });
            }

            return result;

        } catch (error) {
            this.logger.error('Error getting hash logs:', error);
            this.logService.error(`Error getting hash logs: ${error?.message}`, this.appName);
            return [];
        }
    }


    async hasAnyHashLog(): Promise<boolean> {
        try {
            const pattern = `queue:log:${this.config.name}:*:*`;
            // Get just one key that matches the pattern with COUNT 1
            let cursor = '0';
            const [newCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            // const [, keys] = await this.redis.scan(
            //     '0',
            //     'MATCH',
            //     pattern,
            //     'COUNT',
            //     1
            // );
            // If we found at least one key, return true
            return keys.length > 0;
        } catch (error) {
            this.logger.error('Error checking hash logs:', error);
            this.logService.error(`Error checking hash logs: ${error?.message}`, this.appName);
            return false;
        }
    }



    /*  // Add to StorageManageService
      async deleteProcessedFields(processedList: logList[]): Promise<void> {
          try {
              const multi = this.redis.multi();
  
              // Group by key to minimize Redis operations
              const keyFieldsMap = new Map<string, string[]>();
  
              processedList.forEach(item => {
                  const key = `queue:log:${this.config.name}:${item.nTid}:${item.nRid}`;
                  const field = `${item.nBDid}:${item.value}`;
  
                  if (!keyFieldsMap.has(key)) {
                      keyFieldsMap.set(key, []);
                  }
                  keyFieldsMap.get(key)?.push(field);
              });
  
              // Add hdel commands to multi
              for (const [key, fields] of keyFieldsMap.entries()) {
                  multi.hdel(key, ...fields);
              }
  
              await multi.exec();
  
          } catch (error) {
              this.logger.error('Error deleting processed fields:', error);
              this.logService.error(`Error deleting processed fields: ${error?.message}`, this.appName);
          }
      }*/

    async deleteProcessedFields(processedList: logList[]): Promise<void> {
        try {
            const BATCH_SIZE = 100; // Optimal batch size for Redis operations
            const keyFieldsMap = new Map<string, string[]>();

            // Group fields by their keys
            processedList.forEach(item => {
                const key = `queue:log:${this.config.name}:${item.nTid}:${item.nRid}`;
                const field = `${item.nBDid}:${item.value}`;

                if (!keyFieldsMap.has(key)) {
                    keyFieldsMap.set(key, []);
                }
                keyFieldsMap.get(key)?.push(field);
            });

            // Process deletes in batches
            for (const [key, fields] of keyFieldsMap.entries()) {
                // Split fields into batches
                for (let i = 0; i < fields.length; i += BATCH_SIZE) {
                    const batchFields = fields.slice(i, i + BATCH_SIZE);
                    await this.redis.hdel(key, ...batchFields);
                }
            }

        } catch (error) {
            this.logger.error('Error deleting processed fields:', error);
            this.logService.error(`Error deleting processed fields: ${error?.message}`, this.appName);
        }
    }

    async updateKeepAlive(masterId: string, nTCatid?: number) {
        try {
            const key = `queue:keepalive:${nTCatid || this.config.nTCatid}`;
            const field = `${masterId}`;
            await this.redis.hset(key, field, this.datetime.getCurrentTime());
            await this.redis.expire(key, 60);
        } catch (error) {
        }
    }

    async getKeepAlive(masterId: string): Promise<string | null> {
        try {
            const key = `queue:keepalive:${this.config.nTCatid}`;
            const field = `${masterId}`;
            const value = await this.redis.hget(key, field);
            return value ?? null;
        } catch (error) {
            return null;
        }
    }

}