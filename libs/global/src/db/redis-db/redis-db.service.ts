import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class RedisDbService {
  EXPIRY_TIME_IN_SECONDS = 86400; // 24 hours
  constructor(@InjectRedis() private readonly redis: Redis) {
    // this.clearAllData();
    this.attachRedisEventListeners();
  }

  private attachRedisEventListeners(): void {
    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redis.on('ready', () => {
      console.log('Redis is ready to accept commands');
    });

    this.redis.on('error', (error) => {
      console.log(`Redis error: ${error}`);
    });

    this.redis.on('reconnecting', () => {
      console.log('Reconnecting to Redis');
    });

    this.redis.on('end', () => {
      console.log('Redis connection has ended');
    });

    this.redis.on('command', (command) => {
      console.log(`Command executed: ${command.name} ${command.args.join(' ')}`);
    });
  }
  async setValue(key: string, value: any, expirationInSeconds?: any): Promise<void> {
    await this.redis.set(key, value);
    if (expirationInSeconds)
      await this.redis.set(key, value, 'EX', expirationInSeconds);
  }

  async setValueMulti(key1: string, key2, data: any, expirationInSeconds?: any): Promise<void> {
    await this.redis
      .multi()
      // Store the bundle data with expiration
      .set(key2, JSON.stringify(data))
      // Add the bundle key to user's set
      .sadd(key1, key2)
      .exec();
  }


  async getValue(key: string): Promise<any> {
    return await this.redis.get(key);
  }

  async getKeys(key: string): Promise<any> {
    return await this.redis.keys(key);
  }

  async deleteValue(...key: any): Promise<void> {
    let rs = await this.redis.del(key);
  }

  async deleteValueMulti(userSetKey, keys: string[]): Promise<void> {
    await this.redis
      .multi()
      .del(...keys)  // Delete the bundle keys
      .srem(userSetKey, ...keys)  // Remove from user's set
      .exec();
  }

  async deleteList(key: string): Promise<any> {
    await this.redis.del(key);
  }
  async pushAndTrimList(key: string, value: number, expiration?: number): Promise<void> {
    await this.redis.lpush(key, value);
    await this.redis.ltrim(key, 0, 9); // Keep only the last 10 items
    if (expiration)
      await this.redis.expire(key, expiration); // Set the expiration
  }

  async rpush(key: string, value: any, expiration?: number): Promise<void> {
    // await this.redis.rpush(key, value);
    const existingValues = await this.redis.lrange(key, 0, -1); // Get all values in the list
    if (!existingValues.includes(value.toString())) {
      // Only push the value if it does not already exist
      await this.redis.rpush(key, value);

      // Optionally set an expiration time if provided
      if (expiration) {
        await this.redis.expire(key, expiration);
      }
    } else {
      console.log(`Value "${value}" already exists in the list "${key}". Skipping push.`);
    }
  }

  async getsmembers(key: string): Promise<any> {
    return await this.redis.smembers(key)
  }

  async getMaxFromList(key: string): Promise<number> {
    const list = await this.redis.lrange(key, 0, -1);
    const numbers = list.map(Number);
    return Math.max(...numbers);
  }

  async getMinFromList(key: string): Promise<number> {
    const list = await this.redis.lrange(key, 0, -1);
    const numbers = list.map(Number);
    return Math.min(...numbers);
  }

  async clearAllData(): Promise<void> {
    console.log('\n\r\n\rclear all data ')
    await this.redis.flushall();
  }

  async getAllValuesWithPrefix(prefix: string): Promise<any[]> {
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length === 0) {
        return [];
      }
      const values = await Promise.all(keys.map(key => this.redis.get(key)));
      return values.map(value => JSON.parse(value));
    } catch (error) {
      return [];
    }
  }

  async deleteAllWithPrefix(prefix: string): Promise<void> {
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Deleted ${keys.length} keys with prefix ${prefix}`);
      } else {
        console.log(`No keys found with prefix ${prefix}`);
      }
    } catch (error) {
      console.log(`Failed to delete keys with prefix `, error);
    }
  }

  async pushToSAdd(key: string, hash: any): Promise<any> {
    return await this.redis.sadd(key, hash);
  }
  async keyExists(key: string): Promise<any> {
    return await this.redis.exists(key);
  }


  /* async pushToHSet(key: string, chunkNumber: any, filePath: string): Promise<any> {
     return await this.redis.hset(key, chunkNumber, filePath);
   }
 
 
   async pushToSAdd(key: string, hash: any): Promise<any> {
     return await this.redis.sadd(key, hash);
   }
 
 
   async getChunkSet(key: string, chunkNumber: any, filePath: string): Promise<any> {
     return (await this.redis.smembers(key)).map(Number).sort((a, b) => a - b);
   }
 
 
 
   async addToSetIfNotExists(key: string, value: number): Promise<void> {
     // SADD only adds the value if it does not already exist in the set
     const result = await this.redis.sadd(key, value);
     if (result === 1) {
       console.log(`Value ${value} added to ${key}`);
     } else {
       console.log(`Value ${value} already exists in ${key}`);
     }
   }
 
 
   async getSetAsArray(key: string): Promise<number[]> {
     const setMembers = await this.redis.smembers(key);
     return setMembers.map(Number); // Convert string values to numbers
   }*/
  // In redis-db.service.ts

  /*async addChunkToSet(identifier: string, chunkNumber: number) {
    const key = `chunkSet:${identifier}`;
    const currentSet = await this.getChunkSet(identifier);
    if (!currentSet.includes(chunkNumber)) {
      currentSet.push(chunkNumber);
      // currentSet.sort((a, b) => a - b);
      await this.redis.set(key, JSON.stringify(currentSet), 'EX', 24 * 3600);
    }
    return currentSet;
  }


  async getChunkSet(identifier: string): Promise<number[]> {
    const key = `chunkSet:${identifier}`;
    const data = await this.redis.get(key);
    const chunkSet = data ? JSON.parse(data) : [];

    // Return sorted chunkSet
    return chunkSet //.sort((a, b) => a - b);
  }

  async resetChunkSet(identifier: string) {
    const key = `chunkSet:${identifier}`;
    await this.redis.del(key);
  }*/
  /*
    async addChunkToSet(identifier: string, chunkNumber: number): Promise<void> {
      const key = `chunkSet:${identifier}`;
      await this.redis.zadd(key, chunkNumber, chunkNumber.toString());
      await this.redis.expire(key, 24 * 3600);
    }
  
    // Get all chunks in sorted set as an array of numbers
    async getChunkSet(identifier: string): Promise<number[]> {
      const key = `chunkSet:${identifier}`;
      const chunkSet = await this.redis.zrange(key, 0, -1);
      return chunkSet.map(Number); // Convert to an array of numbers
    }
  
    // Remove chunks from the set within a specific range
    async removeChunksFromSet(identifier: string, startChunk: number, endChunk: number): Promise<void> {
      const key = `chunkSet:${identifier}`;
      const pipeline = this.redis.pipeline();
      for (let chunk = startChunk; chunk <= endChunk; chunk++) {
        pipeline.zrem(key, chunk.toString());
      }
      await pipeline.exec(); // Execute pipeline to remove all specified chunks
    }
  */




  async getChunkObject(identifier: string, chunkObj: any, groupSize: number): Promise<any> {
    if (chunkObj) return chunkObj;
    const obj: any = await this.getValue(`file:${identifier}`);
    return obj ? JSON.parse(obj) : { maxChunk: groupSize, path: '' }
  }


  async setChunkObject(identifier: string, chunkObj: any) {
    const key = `file:${identifier}`;
    await this.redis.set(key, JSON.stringify(chunkObj), 'EX', 24 * 3600);
  }




  async getChunkArray(identifier: string): Promise<any[]> {
    const array: any = await this.getValue(`file:records:${identifier}`);
    return array ? JSON.parse(array) : []
  }


  async setChunkArray(identifier: string, chunkArray: number[]) {
    const key = `file:records:${identifier}`;
    await this.redis.set(key, JSON.stringify(chunkArray || []), 'EX', 24 * 3600);
  }



  async deleteChunks(identifier: any) {
    this.deleteValue(`file:records:${identifier}`);
    this.deleteValue(`file:${identifier}`);
  }



  async countInc(key: string): Promise<any> {
    const count = await this.redis.incr(key);
    // Set expiry to 24 hours from the last increment
    await this.redis.expire(key, this.EXPIRY_TIME_IN_SECONDS);
    return count;
  }

  async countDec(key: string): Promise<any> {
    const count = await this.redis.decr(key);
    // Set expiry to 24 hours from the last decrement
    await this.redis.expire(key, this.EXPIRY_TIME_IN_SECONDS);
    return count;
  }

  async count(key: string): Promise<number> {
    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }



  ///////////// PRESENTATION



  // 1. Add a user to a presentation
  async addUser(presentId: string, userId: string, socketId: string): Promise<void> {
    const key = `presentation:${presentId}:users`;
    await this.redis.hset(key, `user:${userId}`, socketId);
  }

  // 2. Remove a user from presentations
  async removeUser(userId: string, presentId?: string): Promise<void> {
    const userField = `user:${userId}`;
    if (presentId) {
      // Remove user from a specific presentation
      const key = `presentation:${presentId}:users`;
      await this.redis.hdel(key, userField);
    } else {
      // Remove user from all presentations
      const pattern = 'presentation:*:users';
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        for (const key of keys) {
          const exists = await this.redis.hexists(key, userField);
          if (exists) {
            await this.redis.hdel(key, userField);
            console.log(`Removed user ${userId} from ${key}`);
          }
        }
        cursor = nextCursor;
      } while (cursor !== '0');
    }
  }


  // 3. Get all user IDs for a presentation
  async getAllUserIds(presentId: string): Promise<string[]> {
    const key = `presentation:P${presentId}:users`;
    const result = await this.redis.hkeys(key);
    return result.map((field) => String(field.replace('user:', ''))) || [];
  }

  // 4. Get the socket ID for a user by presentation ID and user ID
  async getSocketId(presentId: string, userId: string): Promise<string | null> {
    const key = `presentation:${presentId}:users`;
    return await this.redis.hget(key, `user:${userId}`);
  }


  async getAllPresentationsByUser(userId: string): Promise<string[]> {
    const userField = `user:${userId}`;
    const pattern = 'presentation:*:users';
    let cursor = '0';
    const presentIds: string[] = []; // Use string[] to handle IDs like "P54"

    do {
      // Scan for matching keys
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      for (const key of keys) {
        // Check if the user exists in the hash
        const exists = await this.redis.hexists(key, userField);
        if (exists) {
          // Extract the presentation ID from the key and add to the list
          const match = key.match(/presentation:(P\d+):users/); // Updated regex for "P<number>"
          if (match && match[1]) {
            presentIds.push(match[1]); // Store the full ID, e.g., "P54"
          }
        }
      }
      cursor = nextCursor;
    } while (cursor !== '0');

    return presentIds;
  }


  // `session:${sessionId}:*`
  async hasKey(key: string): Promise<boolean> {
    const keys = await this.redis.keys(key);
    return keys.length > 0;
  }

  // `session:${sessionId}:*`
  // async getAllValues(key: string) {
  //   const keys = await this.redis.keys(key);
  //   const pages = await Promise.all(keys.map((key) => this.redis.get(key)));
  //   return pages.map((page) => (page));
  // }


  async getAllValues(keyPattern: string): Promise<any> {
    try {
      // const keys = await this.redis.keys(keyPattern); // Get all keys matching the pattern
      const keys = await this.scanKeys(keyPattern);

      const pages = await Promise.all(
        keys.map(async (key) => {
          const value = await this.redis.get(key); // Get the data for each key
          const pageNumber = key.split(':').pop(); // Extract the page number from the key
          return { pageNumber, value }; // Return both page number and data
        }),
      );

      // Convert the array into an object with page numbers as keys
      const result = pages.reduce((acc, { pageNumber, value }) => {
        acc[pageNumber] = JSON.parse(value); // Parse the value and add it to the result
        return acc;
      }, {});

      return result;
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  async deleteSessionPages(sessionId: any, pageLimit: number): Promise<boolean> {
    // Get all keys for the session
    try {
      // const keys = await this.redis.keys(`session:${sessionId}:*`);
      const keys = await this.scanKeys(`session:${sessionId}:*`);
      // Filter keys where the page number is greater than the limit
      const keysToDelete = keys.filter((key) => {
        const pageNumber = parseInt(key.split(':').pop(), 10); // Extract page number
        return pageNumber > pageLimit;
      });
      // Delete the filtered keys
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
        console.log(`Deleted keys: ${keysToDelete.join(', ')}`);
      } else {
        // console.log(`No keys found with page number > ${pageLimit}`);
      }
    } catch (error) {
      console.log(error);
    }
    return true;
  }

  async scanKeys(pattern: string): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];
    try {
      do {
        // Pass MATCH and COUNT as arguments
        const [newCursor, matches] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
        cursor = newCursor;
        keys.push(...matches);
      } while (cursor !== '0');

    } catch (error) {
      console.log(error);

    }

    return keys;
  }

}
