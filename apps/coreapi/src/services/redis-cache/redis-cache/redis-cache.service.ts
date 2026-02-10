import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Injectable } from '@nestjs/common';
import { BundleDetailReq } from 'apps/coreapi/src/interfaces/bundle.interface';
import { BundleCreationService } from '../../bundle/bundle-creation.service';
import { DbService } from '@app/global/db/pg/db.service';

@Injectable()
export class RedisCacheService {

    private readonly CACHE_DURATION = 3600;
    constructor(private readonly rds: RedisDbService, private db: DbService
    ) { }


    private generateBDKey(request: BundleDetailReq, fun: string): string {
        return `caseuser:${request.nMasterid}:section:${request.nSectionid}:request:${JSON.stringify({ fun: fun, request: request })}`;
    }


    private generateUserSetKey(nMasterid: number): string {
        return `caseuser:${nMasterid}:request`;
    }


    async setCache(fun: string, request: any, data: any, genKeyfn: string): Promise<void> {
        const bundleKey = this[genKeyfn](request, fun);
        const userSetKey = this.generateUserSetKey(request.nMasterid);

        try {
            await this.rds.setValueMulti(
                userSetKey, bundleKey,
                JSON.stringify(data)
            );
        } catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }


    async getCache(fun: string, request: any, genKeyfn: string): Promise<any | null> {
        try {
            const key = this[genKeyfn](request, fun);
            const data = await this.rds.getValue(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }


    private parseKeyToParams(key: string): Promise<any> {
        // Extract the JSON portion
        const jsonString = key.substring(key.indexOf('{'));
        console.log('Extracted JSON:', jsonString);

        // Parse the JSON
        const parsedData = JSON.parse(jsonString);
        const params = {
            fun: parsedData.fun,
            params: parsedData.request,
        };
        return Promise.resolve(params);
    }

    async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async updateCache(request: any, funs: string[]): Promise<void> {
        try {
            // Pattern to match all users' keys for this section
            const pattern = `caseuser:*:*`;
            // Find all keys matching this pattern
            const keys = await this.rds.getKeys(pattern);
            const validKeys = funs.length ? keys.filter(e => funs.some(fun => e.includes(fun))) : keys;
            // Get unique user set keys
            const userSetKeys = [...new Set(
                validKeys.map(key => {
                    const parts = key.split(':');
                    return this.generateUserSetKey(parseInt(parts[1]));
                })
            )];
            if (validKeys.length > 0) {
                // First delete all existing keys
                await this.rds.deleteValueMulti(userSetKeys, keys);
                return
                await this.rds.setValueMulti(validKeys, userSetKeys, []);
                // Then refresh data for each key
                await Promise.all(validKeys.map(async (key: string, index: number) => {
                    try {
                        // Get params from key
                        await this.delay(index * 100);
                        const query = await this.parseKeyToParams(key);
                        // Get fresh data

                        let res = await this.db.executeRef(query.fun, query.params);
                        if (res.success) {
                            res = res.data[0];
                        } else {
                            return { msg: -1, value: 'Failed to fetch', error: res.error }
                        }
                        // Get user set key for this specific key
                        const userSetKey = this.generateUserSetKey(query.params.nMasterid);
                        // Set new data
                        await this.rds.setValueMulti(
                            userSetKey,
                            key,
                            JSON.stringify(res)
                        );
                    } catch (error) {
                        console.error(`Error refreshing key ${key}:`, error);
                    }
                }));
            }
        } catch (error) {
            console.error('Redis update bundle cache error:', error);
            // throw error;
        }
    }



}
