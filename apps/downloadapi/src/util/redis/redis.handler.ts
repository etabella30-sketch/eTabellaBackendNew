import { LogService } from "@app/global/utility/log/log.service";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export class RedisHandler {

    public redis: Redis;
    private readonly RECONNECT_DELAY = 5000;
    private readonly MAX_RECONNECT_ATTEMPTS = 10;
    private readonly CHANNEL_HEALTH_CHECK_INTERVAL = 5000;
    private readonly REDIS_CONNECTION_TIMEOUT = 10000;
    private readonly appName: string = `redishandler`;
    constructor(protected logService: LogService, protected config: ConfigService) {
        this.init();
    }



    private async init(): Promise<void> {
        try {
            await this.setupRedis();
        } catch (error) {
            this.logService.error(`Failed to initialize Redis: ${error.message}`, this.appName);
        }
    }




    public async setupRedis(): Promise<void> {
        this.redis = new Redis({
            host: this.config.get<string>('REDIS_IP', '127.0.0.1'),
            port: Number(this.config.get<number>('REDIS_PORT', 6379)),
            password: this.config.get<string>('REDIS_PASSWORD', ''),
            db: this.config.get<number>('REDIS_DB', 0),
            connectTimeout: this.REDIS_CONNECTION_TIMEOUT,
            maxRetriesPerRequest: 8,
            retryStrategy: (times) => {
                if (times > this.MAX_RECONNECT_ATTEMPTS) {
                    this.logService.error("Max reconnect attempts reached. Giving up...", this.appName);
                    return null;
                }
                const delay = Math.min(times * 1000, this.RECONNECT_DELAY);
                this.logService.warn(`Retrying Redis connection in ${delay}ms...`, this.appName);
                return delay;
            }
        });

        this.setupRedisEventListeners();
        await this.waitForRedisConnection();
    }

    private setupRedisEventListeners(): void {
        this.redis.on('connect', () => {
            this.logService.info('Connected to Redis', this.appName);
        });

        this.redis.on('error', (error) => {
            this.logService.error(`Redis connection error: ${error?.message}`, this.appName);
        });

        this.redis.on('close', () => {
            this.logService.warn('Redis connection closed', this.appName);
        });

        this.redis.on('reconnecting', (ms) => {
            this.logService.warn(`Reconnecting to Redis in ${ms}ms...`, this.appName);
        });
    }

    private async waitForRedisConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, this.REDIS_CONNECTION_TIMEOUT);

            this.redis.once('connect', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.redis.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }



}