/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperlinkModule = void 0;
const common_1 = __webpack_require__(3);
const hyperlink_controller_1 = __webpack_require__(4);
const hyperlink_service_1 = __webpack_require__(5);
const global_1 = __webpack_require__(26);
const redis_db_service_1 = __webpack_require__(6);
const config_1 = __webpack_require__(9);
const query_builder_service_1 = __webpack_require__(24);
const db_service_1 = __webpack_require__(22);
const winston_module_1 = __webpack_require__(32);
const ioredis_1 = __webpack_require__(8);
const jwt_middleware_1 = __webpack_require__(37);
const generatehyperlink_service_1 = __webpack_require__(11);
const bull_1 = __webpack_require__(13);
const hyperlink_processor_1 = __webpack_require__(39);
const hyperlinksearch_service_1 = __webpack_require__(42);
const log_service_1 = __webpack_require__(40);
const utility_service_1 = __webpack_require__(45);
const hyperlink_index_processor_1 = __webpack_require__(47);
const kafka_shared_service_1 = __webpack_require__(46);
const event_log_service_1 = __webpack_require__(21);
const kafka_module_1 = __webpack_require__(48);
let HyperlinkModule = class HyperlinkModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(hyperlink_controller_1.HyperlinkController);
    }
};
exports.HyperlinkModule = HyperlinkModule;
exports.HyperlinkModule = HyperlinkModule = __decorate([
    (0, common_1.Module)({
        imports: [
            global_1.GlobalModule,
            kafka_module_1.KafkaModule.register('etabella-hyperlink', 'hyperlink-group'),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    redis: {
                        port: Number(config.get('REDIS_PORT')),
                        host: config.get('REDIS_IP'),
                        password: config.get('REDIS_PASSWORD'),
                    },
                }),
            }),
            bull_1.BullModule.registerQueue({
                name: 'hyperlink-queue',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'hyperlink-index-queue',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }),
            winston_module_1.WinstonConfigModule.forRoot('hyperlink')
        ],
        controllers: [hyperlink_controller_1.HyperlinkController],
        providers: [hyperlink_service_1.HyperlinkService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, config_1.ConfigService, redis_db_service_1.RedisDbService, generatehyperlink_service_1.GeneratehyperlinkService, hyperlink_processor_1.HyperLinkProcessor, hyperlink_index_processor_1.HyperLinkIndexProcessor, hyperlinksearch_service_1.HyperlinksearchService, log_service_1.LogService, utility_service_1.UtilityService, kafka_shared_service_1.KafkaGlobalService, event_log_service_1.EventLogService],
    })
], HyperlinkModule);


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("@nestjs/common");

/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperlinkController = void 0;
const common_1 = __webpack_require__(3);
const hyperlink_service_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(10);
const generatehyperlink_service_1 = __webpack_require__(11);
const hyperlink_interface_1 = __webpack_require__(14);
const microservices_1 = __webpack_require__(18);
const log_interceptor_1 = __webpack_require__(19);
const apiid_1 = __webpack_require__(25);
let HyperlinkController = class HyperlinkController {
    constructor(hyperlinkService, genHyper) {
        this.hyperlinkService = hyperlinkService;
        this.genHyper = genHyper;
    }
    async hyperlinkFiles(body) {
        return await this.genHyper.starthyperlink(body, false, body.isDeepscan || false);
    }
    handeAuth2(message, context) {
        console.log(`Received message for Index responce: `, message);
        if (message.data) {
            this.genHyper.starthyperlink(message.data, true);
        }
    }
    async indexHyperlink(body) {
        return await this.genHyper.starthyperlink(body, true);
    }
    async deepHyperlink(body) {
        return await this.genHyper.starthyperlink(body, false, true);
    }
    async getCaseList(query) {
        return await this.genHyper.getHyperLinkProgress(query);
    }
};
exports.HyperlinkController = HyperlinkController;
__decorate([
    (0, common_1.Post)('starthyperlink'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(24),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof hyperlink_interface_1.hyperlinkReq !== "undefined" && hyperlink_interface_1.hyperlinkReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], HyperlinkController.prototype, "hyperlinkFiles", null);
__decorate([
    (0, microservices_1.MessagePattern)('hyperlink-index-responce'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_e = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _e : Object]),
    __metadata("design:returntype", void 0)
], HyperlinkController.prototype, "handeAuth2", null);
__decorate([
    (0, common_1.Post)('indexhyperlink'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(24),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof hyperlink_interface_1.hyperlinkReq !== "undefined" && hyperlink_interface_1.hyperlinkReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], HyperlinkController.prototype, "indexHyperlink", null);
__decorate([
    (0, common_1.Post)('deephyperlink'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(24),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof hyperlink_interface_1.hyperlinkReq !== "undefined" && hyperlink_interface_1.hyperlinkReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], HyperlinkController.prototype, "deepHyperlink", null);
__decorate([
    (0, common_1.Get)('hyperlinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof hyperlink_interface_1.gethyperlinkReq !== "undefined" && hyperlink_interface_1.gethyperlinkReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], HyperlinkController.prototype, "getCaseList", null);
exports.HyperlinkController = HyperlinkController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('hyperlink'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof hyperlink_service_1.HyperlinkService !== "undefined" && hyperlink_service_1.HyperlinkService) === "function" ? _a : Object, typeof (_b = typeof generatehyperlink_service_1.GeneratehyperlinkService !== "undefined" && generatehyperlink_service_1.GeneratehyperlinkService) === "function" ? _b : Object])
], HyperlinkController);


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperlinkService = void 0;
const redis_db_service_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
let HyperlinkService = class HyperlinkService {
    constructor(config, redisDbService) {
        this.config = config;
        this.redisDbService = redisDbService;
        this.tempChunkPath = './assets/upload-chunks';
        this.docPath = 'doc';
        this.backupDocPath = this.config.get('COPY_PATH');
        this.redisKey = 'chunk/';
    }
    getHello() {
        return 'Hello World!';
    }
    async onModuleInit() {
        this.deleteAllRunningHyperlinkJobs();
    }
    async deleteAllRunningHyperlinkJobs() {
        this.redisDbService.deleteAllWithPrefix(`HYPERLINK/`);
    }
};
exports.HyperlinkService = HyperlinkService;
exports.HyperlinkService = HyperlinkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object])
], HyperlinkService);


/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(7);
const ioredis_2 = __webpack_require__(8);
let RedisDbService = class RedisDbService {
    constructor(redis) {
        this.redis = redis;
        this.EXPIRY_TIME_IN_SECONDS = 86400;
        this.attachRedisEventListeners();
    }
    attachRedisEventListeners() {
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
    async setValue(key, value, expirationInSeconds) {
        await this.redis.set(key, value);
        if (expirationInSeconds)
            await this.redis.set(key, value, 'EX', expirationInSeconds);
    }
    async setValueMulti(key1, key2, data, expirationInSeconds) {
        await this.redis
            .multi()
            .set(key2, JSON.stringify(data))
            .sadd(key1, key2)
            .exec();
    }
    async getValue(key) {
        return await this.redis.get(key);
    }
    async getKeys(key) {
        return await this.redis.keys(key);
    }
    async deleteValue(...key) {
        let rs = await this.redis.del(key);
    }
    async deleteValueMulti(userSetKey, keys) {
        await this.redis
            .multi()
            .del(...keys)
            .srem(userSetKey, ...keys)
            .exec();
    }
    async deleteList(key) {
        await this.redis.del(key);
    }
    async pushAndTrimList(key, value, expiration) {
        await this.redis.lpush(key, value);
        await this.redis.ltrim(key, 0, 9);
        if (expiration)
            await this.redis.expire(key, expiration);
    }
    async rpush(key, value, expiration) {
        const existingValues = await this.redis.lrange(key, 0, -1);
        if (!existingValues.includes(value.toString())) {
            await this.redis.rpush(key, value);
            if (expiration) {
                await this.redis.expire(key, expiration);
            }
        }
        else {
            console.log(`Value "${value}" already exists in the list "${key}". Skipping push.`);
        }
    }
    async getsmembers(key) {
        return await this.redis.smembers(key);
    }
    async getMaxFromList(key) {
        const list = await this.redis.lrange(key, 0, -1);
        const numbers = list.map(Number);
        return Math.max(...numbers);
    }
    async getMinFromList(key) {
        const list = await this.redis.lrange(key, 0, -1);
        const numbers = list.map(Number);
        return Math.min(...numbers);
    }
    async clearAllData() {
        console.log('\n\r\n\rclear all data ');
        await this.redis.flushall();
    }
    async getAllValuesWithPrefix(prefix) {
        try {
            const keys = await this.redis.keys(`${prefix}*`);
            if (keys.length === 0) {
                return [];
            }
            const values = await Promise.all(keys.map(key => this.redis.get(key)));
            return values.map(value => JSON.parse(value));
        }
        catch (error) {
            return [];
        }
    }
    async deleteAllWithPrefix(prefix) {
        try {
            const keys = await this.redis.keys(`${prefix}*`);
            if (keys.length > 0) {
                await this.redis.del(...keys);
                console.log(`Deleted ${keys.length} keys with prefix ${prefix}`);
            }
            else {
                console.log(`No keys found with prefix ${prefix}`);
            }
        }
        catch (error) {
            console.log(`Failed to delete keys with prefix `, error);
        }
    }
    async pushToSAdd(key, hash) {
        return await this.redis.sadd(key, hash);
    }
    async keyExists(key) {
        return await this.redis.exists(key);
    }
    async getChunkObject(identifier, chunkObj, groupSize) {
        if (chunkObj)
            return chunkObj;
        const obj = await this.getValue(`file:${identifier}`);
        return obj ? JSON.parse(obj) : { maxChunk: groupSize, path: '' };
    }
    async setChunkObject(identifier, chunkObj) {
        const key = `file:${identifier}`;
        await this.redis.set(key, JSON.stringify(chunkObj), 'EX', 24 * 3600);
    }
    async getChunkArray(identifier) {
        const array = await this.getValue(`file:records:${identifier}`);
        return array ? JSON.parse(array) : [];
    }
    async setChunkArray(identifier, chunkArray) {
        const key = `file:records:${identifier}`;
        await this.redis.set(key, JSON.stringify(chunkArray || []), 'EX', 24 * 3600);
    }
    async deleteChunks(identifier) {
        this.deleteValue(`file:records:${identifier}`);
        this.deleteValue(`file:${identifier}`);
    }
    async countInc(key) {
        const count = await this.redis.incr(key);
        await this.redis.expire(key, this.EXPIRY_TIME_IN_SECONDS);
        return count;
    }
    async countDec(key) {
        const count = await this.redis.decr(key);
        await this.redis.expire(key, this.EXPIRY_TIME_IN_SECONDS);
        return count;
    }
    async count(key) {
        const count = await this.redis.get(key);
        return count ? parseInt(count, 10) : 0;
    }
    async addUser(presentId, userId, socketId) {
        const key = `presentation:${presentId}:users`;
        await this.redis.hset(key, `user:${userId}`, socketId);
    }
    async removeUser(userId, presentId) {
        const userField = `user:${userId}`;
        if (presentId) {
            const key = `presentation:${presentId}:users`;
            await this.redis.hdel(key, userField);
        }
        else {
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
    async getAllUserIds(presentId) {
        const key = `presentation:P${presentId}:users`;
        const result = await this.redis.hkeys(key);
        return result.map((field) => String(field.replace('user:', ''))) || [];
    }
    async getSocketId(presentId, userId) {
        const key = `presentation:${presentId}:users`;
        return await this.redis.hget(key, `user:${userId}`);
    }
    async getAllPresentationsByUser(userId) {
        const userField = `user:${userId}`;
        const pattern = 'presentation:*:users';
        let cursor = '0';
        const presentIds = [];
        do {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            for (const key of keys) {
                const exists = await this.redis.hexists(key, userField);
                if (exists) {
                    const match = key.match(/presentation:(P\d+):users/);
                    if (match && match[1]) {
                        presentIds.push(match[1]);
                    }
                }
            }
            cursor = nextCursor;
        } while (cursor !== '0');
        return presentIds;
    }
    async hasKey(key) {
        const keys = await this.redis.keys(key);
        return keys.length > 0;
    }
    async getAllValues(keyPattern) {
        try {
            const keys = await this.scanKeys(keyPattern);
            const pages = await Promise.all(keys.map(async (key) => {
                const value = await this.redis.get(key);
                const pageNumber = key.split(':').pop();
                return { pageNumber, value };
            }));
            const result = pages.reduce((acc, { pageNumber, value }) => {
                acc[pageNumber] = JSON.parse(value);
                return acc;
            }, {});
            return result;
        }
        catch (error) {
            console.log(error);
        }
        return null;
    }
    async deleteSessionPages(sessionId, pageLimit) {
        try {
            const keys = await this.scanKeys(`session:${sessionId}:*`);
            const keysToDelete = keys.filter((key) => {
                const pageNumber = parseInt(key.split(':').pop(), 10);
                return pageNumber > pageLimit;
            });
            if (keysToDelete.length > 0) {
                await this.redis.del(...keysToDelete);
                console.log(`Deleted keys: ${keysToDelete.join(', ')}`);
            }
            else {
            }
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async scanKeys(pattern) {
        let cursor = '0';
        const keys = [];
        try {
            do {
                const [newCursor, matches] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '100');
                cursor = newCursor;
                keys.push(...matches);
            } while (cursor !== '0');
        }
        catch (error) {
            console.log(error);
        }
        return keys;
    }
};
exports.RedisDbService = RedisDbService;
exports.RedisDbService = RedisDbService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, ioredis_2.InjectRedis)()),
    __metadata("design:paramtypes", [typeof (_a = typeof ioredis_1.Redis !== "undefined" && ioredis_1.Redis) === "function" ? _a : Object])
], RedisDbService);


/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GeneratehyperlinkService = void 0;
const common_1 = __webpack_require__(3);
const redis_db_service_1 = __webpack_require__(6);
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(13);
let GeneratehyperlinkService = class GeneratehyperlinkService {
    constructor(redisDbService, hyperlinkQueue, hyperlinkIndexQueue) {
        this.redisDbService = redisDbService;
        this.hyperlinkQueue = hyperlinkQueue;
        this.hyperlinkIndexQueue = hyperlinkIndexQueue;
        this.hyperlinkQueue.on('completed', (job) => {
            console.log(`Job with ID ${job.id} has completed`);
        });
        this.hyperlinkQueue.on('failed', (job, err) => {
            console.log(`Job with ID ${job.id} failed with error: ${err.message}`);
        });
        this.hyperlinkQueue.on('stalled', (job) => {
            console.log(`Job with ID ${job.id} stalled`);
        });
        this.hyperlinkQueue.on('waiting', (jobId) => {
            console.log(`Job with ID ${jobId} is waiting to be processed`);
        });
        this.hyperlinkQueue.on('active', (job, jobPromise) => {
            console.log(`Job with ID ${job.id} has started processing`);
        });
        this.hyperlinkQueue.on('paused', () => {
            console.log('The queue has been paused');
        });
        this.hyperlinkQueue.on('resumed', () => {
            console.log('The queue has been resumed');
        });
        this.hyperlinkQueue.on('removed', (job) => {
            console.log(`Job with ID ${job.id} has been removed from the queue`);
        });
        this.hyperlinkQueue.on('delayed', (jobId) => {
            console.log(`Job with ID ${jobId} is delayed`);
        });
        this.hyperlinkQueue.on('drained', () => {
            console.log('The queue has been drained (no more jobs to process)');
        });
        this.hyperlinkQueue.on('error', (error) => {
            console.error('An error occurred in the queue:', error);
        });
    }
    async starthyperlink(body, isIndex, isDeepscan) {
        console.log('Hyperlink req', body);
        if (!body.nSectionid) {
            return { msg: -1, value: 'nSectionid is required' };
        }
        const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}/${body.nSectionid}/${body.nBundledetailid || null}`;
        const dataHyperlink = await this.redisDbService.getValue(name);
        if (dataHyperlink) {
            return { msg: -1, value: 'Hyperling already in progress' };
        }
        const obj = {
            queueName: name,
            nCaseid: body.nCaseid,
            nSectionid: body.nSectionid,
            nMasterid: body.nMasterid,
            nBundledetailid: body.nBundledetailid,
            nBundleid: body.nBundleid,
            cType: body.cType,
            nTotal: 0,
            nCompleted: 0,
            nFailed: 0,
            cStatus: 'P',
            cKeeptype: body.cKeeptype || 'R',
            isDeepscan: isDeepscan
        };
        try {
            if (isIndex)
                await this.hyperlinkIndexQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            else
                await this.hyperlinkQueue.add(obj, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            await this.redisDbService.setValue(name, JSON.stringify(obj));
            return { msg: 1, value: 'Hyperlink process started', data: obj };
        }
        catch (error) {
            return { msg: -1, value: 'Failed to start hyperlink process', error: error.message };
        }
    }
    async getHyperLinkProgress(body) {
        const name = `HYPERLINK/${body.nMasterid}/${body.nCaseid}`;
        const dataHyperlinkList = await this.redisDbService.getAllValuesWithPrefix(name) || [];
        console.log(name, dataHyperlinkList);
        if (dataHyperlinkList && dataHyperlinkList.length) {
            return { msg: 1, value: dataHyperlinkList };
        }
        else {
            return { msg: -1, value: 'Hyperling not in progress' };
        }
    }
};
exports.GeneratehyperlinkService = GeneratehyperlinkService;
exports.GeneratehyperlinkService = GeneratehyperlinkService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_2.InjectQueue)('hyperlink-queue')),
    __param(2, (0, bull_2.InjectQueue)('hyperlink-index-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _a : Object, typeof (_b = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _b : Object, typeof (_c = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _c : Object])
], GeneratehyperlinkService);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

/***/ }),
/* 14 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.searchedResult = exports.hyperlinkFiles = exports.hyperlinkProcess = exports.gethyperlinkReq = exports.hyperlinkReq = void 0;
const swagger_1 = __webpack_require__(10);
const class_validator_1 = __webpack_require__(15);
const is_uuid_nullable_decorator_1 = __webpack_require__(16);
class hyperlinkReq {
}
exports.hyperlinkReq = hyperlinkReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundledetailid must be a UUID string', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a UUID string', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a UUID string', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nCaseid must be a UUID string', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Tab or Exhibitno', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Keeptype', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "cKeeptype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Without {}', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], hyperlinkReq.prototype, "isDeepscan", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkReq.prototype, "nMasterid", void 0);
class gethyperlinkReq {
}
exports.gethyperlinkReq = gethyperlinkReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nCaseid must be a UUID string', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], gethyperlinkReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], gethyperlinkReq.prototype, "nMasterid", void 0);
class hyperlinkProcess {
}
exports.hyperlinkProcess = hyperlinkProcess;
class hyperlinkFiles {
}
exports.hyperlinkFiles = hyperlinkFiles;
class searchedResult {
}
exports.searchedResult = searchedResult;


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 16 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(17);
const class_validator_1 = __webpack_require__(15);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 19 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogInterceptor = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const operators_1 = __webpack_require__(20);
const event_log_service_1 = __webpack_require__(21);
let LogInterceptor = class LogInterceptor {
    constructor(logManageService, reflector) {
        this.logManageService = logManageService;
        this.reflector = reflector;
    }
    intercept(context, next) {
        debugger;
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl } = request;
        const userAgent = request.get('User-Agent') || '';
        const apiId = this.reflector.get('apiId', context.getHandler()) || 0;
        const reqObj = (['POST', 'PUT', 'DELETE', 'UPDATE'].includes(method) ? request.body : request.query);
        return next.handle().pipe((0, operators_1.tap)(async () => {
            try {
                const mdl = { nLCatid: apiId, nMasterid: reqObj.nMasterid, jData: reqObj };
                delete mdl.jData?.nMasterid;
                await this.logManageService.insertLog(mdl);
            }
            catch (error) {
                console.error('Error inserting log:', error);
            }
        }));
    }
};
exports.LogInterceptor = LogInterceptor;
exports.LogInterceptor = LogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof event_log_service_1.EventLogService !== "undefined" && event_log_service_1.EventLogService) === "function" ? _a : Object, typeof (_b = typeof core_1.Reflector !== "undefined" && core_1.Reflector) === "function" ? _b : Object])
], LogInterceptor);


/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("rxjs/operators");

/***/ }),
/* 21 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventLogService = void 0;
const db_service_1 = __webpack_require__(22);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
let EventLogService = class EventLogService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
    }
    async insertLog(data) {
        let origin = this.config.get('ORIGIN');
        data.jData = data.jData ? data.jData : {};
        data.jData['O'] = origin;
        let res = await this.db.executeRef('log_insert', data);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to insert log', error: res.error };
        }
    }
};
exports.EventLogService = EventLogService;
exports.EventLogService = EventLogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], EventLogService);


/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(23);
const query_builder_service_1 = __webpack_require__(24);
const config_1 = __webpack_require__(9);
let DbService = class DbService {
    constructor(queryBuilder, configService) {
        this.queryBuilder = queryBuilder;
        this.configService = configService;
        this.logger = new common_1.Logger('query');
        let cfg = {
            user: this.configService.get('DB_USERNAME'),
            host: this.configService.get('DB_HOST'),
            database: this.configService.get('DB_DATABASE'),
            password: this.configService.get('DB_PASSWORD'),
            port: this.configService.get('DB_PORT'),
            max: this.configService.get('DB_MAX'),
            idleTimeoutMillis: this.configService.get('DB_TIMEOUT')
        };
        const sslConnection = this.configService.get('DB_SSL');
        this.logger.log('\n\r\n\r\n\r\n\r\n SSL CONNET', sslConnection > 0 ? 'Y' : 'N');
        if (sslConnection > 0) {
            cfg.ssl = {
                rejectUnauthorized: false,
            };
        }
        this.pool = new pg_1.Pool(cfg);
        this.pool.on('error', (err, client) => {
            this.logger.error('Unexpected error on idle client', err);
            process.exit(-1);
        });
    }
    async rowQuery(text, params) {
        try {
            const start = Date.now();
            const res = await this.pool.query(text, params);
            return { success: true, data: res?.rows || [] };
        }
        catch (error) {
            this.logger.error('Error executing query', { text, error: error.message });
            return { success: false, error: error.message };
        }
    }
    async query(text, params) {
        try {
            const start = Date.now();
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            return { success: true, data: res.filter(m => m.command == 'FETCH').map(a => a.rows) };
        }
        catch (error) {
            this.logger.error('Error executing query', { text, error: error.message });
            return { success: false, error: error.message };
        }
    }
    async executeRef(fun_name, params, schema) {
        try {
            let refs = params.ref ? params.ref : 1;
            delete params.ref;
            let query = await this.queryBuilder.buildQuery(params, fun_name, refs, schema);
            let responce = await this.query(query);
            return responce;
        }
        catch (error) {
            return { success: false, error: error };
        }
    }
};
exports.DbService = DbService;
exports.DbService = DbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof query_builder_service_1.QueryBuilderService !== "undefined" && query_builder_service_1.QueryBuilderService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], DbService);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 24 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueryBuilderService = exports.PrefixType = void 0;
const common_1 = __webpack_require__(3);
var PrefixType;
(function (PrefixType) {
    PrefixType["Number"] = "n";
    PrefixType["Boolean"] = "b";
    PrefixType["Date"] = "d";
    PrefixType["Character"] = "c";
    PrefixType["Json"] = "j";
})(PrefixType || (exports.PrefixType = PrefixType = {}));
let QueryBuilderService = class QueryBuilderService {
    constructor() {
        this.logger = new common_1.Logger('query');
    }
    setNullValues(model) {
        Object.keys(model).forEach((key) => {
            const prefix = key[0];
            const value = model[key];
            switch (prefix) {
                case PrefixType.Number:
                    model[key] = value;
                    break;
                case PrefixType.Boolean:
                    break;
                case PrefixType.Date:
                    if (value) {
                        let date = new Date(value);
                        if (date.getFullYear() < 0) {
                            date.setFullYear(-date.getFullYear());
                            model[key] = date;
                        }
                    }
                    break;
                case PrefixType.Character:
                    model[key] = value || '';
                    break;
                case PrefixType.Json:
                    model[key] = value ? ((typeof value) == 'string' ? value : JSON.stringify(value).replace(/'/g, "''")) : null;
                    break;
                default:
                    if (Array.isArray(value) && !key.includes('detail')) {
                        model[key] = value ? value.toString() : '';
                    }
                    else if (!Array.isArray(value)) {
                        model[key] = value || '';
                    }
                    break;
            }
        });
        return model;
    }
    buildQuery(model, apiFunction, refs, schema) {
        let qr = '';
        try {
            let prs1 = '';
            let prs2 = '';
            for (let i = 1; i <= refs; i++) {
                prs1 += `${i > 1 ? ',' : ''}'r${i}'`;
                prs2 += `;fetch all in "r${i}"`;
            }
            const cleanedModel = this.setNullValues({ ...model });
            delete cleanedModel.$$hashKey;
            const modelString = JSON.stringify(cleanedModel).replace(/'/g, "''");
            qr = `select * from ${schema || 'public'}.et_${apiFunction} ('${modelString}',${prs1})${prs2};`;
        }
        catch (error) {
            this.logger.error(error);
        }
        this.print_query(qr);
        return qr;
    }
    print_query(query) {
        this.logger.log(query);
    }
};
exports.QueryBuilderService = QueryBuilderService;
exports.QueryBuilderService = QueryBuilderService = __decorate([
    (0, common_1.Injectable)()
], QueryBuilderService);


/***/ }),
/* 25 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ApiId = void 0;
const common_1 = __webpack_require__(3);
const ApiId = (apiId) => {
    return (target, key, descriptor) => {
        (0, common_1.SetMetadata)('apiId', apiId)(target, key, descriptor);
    };
};
exports.ApiId = ApiId;


/***/ }),
/* 26 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(27), exports);
__exportStar(__webpack_require__(28), exports);


/***/ }),
/* 27 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(28);
const config_1 = __webpack_require__(9);
const scheduler_service_1 = __webpack_require__(29);
let GlobalModule = class GlobalModule {
};
exports.GlobalModule = GlobalModule;
exports.GlobalModule = GlobalModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: `.env.${process.env.NODE_ENV}`,
                ignoreEnvFile: process.env.NODE_ENV === 'production',
            })],
        providers: [global_service_1.GlobalService, scheduler_service_1.SchedulerService],
        exports: [global_service_1.GlobalService],
    })
], GlobalModule);


/***/ }),
/* 28 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GlobalService = void 0;
const common_1 = __webpack_require__(3);
let GlobalService = class GlobalService {
};
exports.GlobalService = GlobalService;
exports.GlobalService = GlobalService = __decorate([
    (0, common_1.Injectable)()
], GlobalService);


/***/ }),
/* 29 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SchedulerService = void 0;
const common_1 = __webpack_require__(3);
const moment = __webpack_require__(30);
const schedule = __webpack_require__(31);
let SchedulerService = class SchedulerService {
    constructor() {
        this.jobs = [];
    }
    scheduleTask(TaskId, dateTimeStr, task) {
        console.log('befour', dateTimeStr);
        if (this.isJobScheduled(TaskId)) {
            console.log(`A job for TaskId ${TaskId} is already scheduled.`);
            return this.getJobsByTaskId(TaskId)[0].jobId;
        }
        const date = this.convertToDateTime(dateTimeStr);
        const jobId = `job-${TaskId}-${new Date().getTime()}`;
        const job = schedule.scheduleJob(jobId, date, () => {
            console.log(`Executing task for user ${TaskId} at ${date}`);
            task();
            this.removeJob(jobId);
        });
        this.jobs.push({ jobId, TaskId, job });
        console.log(`Scheduled job ${jobId} for user ${TaskId} at ${date}`);
        return jobId;
    }
    convertToDateTime(dateTimeStr) {
        const dateTime = moment(dateTimeStr, 'YYYY-MM-DD HH:mm:ss').toDate();
        if (!dateTime.getTime()) {
            throw new Error('Invalid date format');
        }
        return dateTime;
    }
    isJobScheduled(TaskId) {
        return this.jobs.some(job => job.TaskId === TaskId);
    }
    removeJob(jobId) {
        this.jobs = this.jobs.filter(job => job.jobId !== jobId);
        console.log(`Job ${jobId} removed from schedule.`);
    }
    getJobsByTaskId(TaskId) {
        return this.jobs.filter(job => job.TaskId === TaskId);
    }
    cancelJob(jobId) {
        const jobIndex = this.jobs.findIndex(job => job.jobId === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex].job.cancel();
            this.jobs.splice(jobIndex, 1);
            console.log(`Job ${jobId} canceled.`);
        }
        else {
            console.log(`Job ${jobId} not found.`);
        }
    }
    setTimezone(timezone) {
        console.log(`Setting timezone to ${timezone}`);
    }
};
exports.SchedulerService = SchedulerService;
exports.SchedulerService = SchedulerService = __decorate([
    (0, common_1.Injectable)()
], SchedulerService);


/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 32 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WinstonConfigModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WinstonConfigModule = void 0;
const common_1 = __webpack_require__(3);
const nest_winston_1 = __webpack_require__(33);
const winston = __webpack_require__(34);
const fs = __webpack_require__(35);
const path = __webpack_require__(36);
let WinstonConfigModule = WinstonConfigModule_1 = class WinstonConfigModule {
    static forRoot(appName) {
        const logDir = path.join('logs', appName);
        fs.mkdirSync(logDir, { recursive: true });
        return {
            module: WinstonConfigModule_1,
            imports: [
                nest_winston_1.WinstonModule.forRoot({
                    transports: [
                        new winston.transports.Console({
                            level: 'info',
                            format: winston.format.combine(winston.format.timestamp(), winston.format.colorize(), winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`))
                        })
                    ],
                }),
            ],
            exports: [nest_winston_1.WinstonModule],
        };
    }
};
exports.WinstonConfigModule = WinstonConfigModule;
exports.WinstonConfigModule = WinstonConfigModule = WinstonConfigModule_1 = __decorate([
    (0, common_1.Module)({})
], WinstonConfigModule);


/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 36 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(38);
const redis_db_service_1 = __webpack_require__(6);
const config_1 = __webpack_require__(9);
const db_service_1 = __webpack_require__(22);
let JwtMiddleware = class JwtMiddleware {
    constructor(rds, config, db) {
        this.rds = rds;
        this.config = config;
        this.db = db;
    }
    async use(req, res, next) {
        console.log(`[JWT-MW] ===== REQUEST ${req.method} ${req.originalUrl} =====`);
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
        if (!token) {
            return res.status(403).json({ message: 'A token is required for authentication' });
        }
        let decoded;
        try {
            decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
                req.body.nMasterid = decoded.userId;
            }
            else if (req.method === 'GET') {
                req.query.nMasterid = decoded.userId;
            }
        }
        catch (err) {
            if (err && err.name == 'TokenExpiredError') {
                try {
                    let origin = this.config.get('ORIGIN');
                    let jOther = { O: origin };
                    decoded = jwt.decode(token);
                    let mdl = {
                        "nLCatid": 4, "nMasterid": decoded.userId, cRemark: `${err?.message} at ${err?.expiredAt}`, "cType": 'O',
                        "jData": jOther
                    };
                    await this.db.executeRef('log_insert', mdl);
                    this.rds.deleteValue(`user/${decoded.userId}`);
                }
                catch (error) {
                    console.log(`User logout ${error}`);
                }
            }
            else {
                try {
                    let origin = this.config.get('ORIGIN');
                    let jOther = { O: origin };
                    decoded = jwt.decode(token);
                    let log_data = { "nLCatid": 4, "nMasterid": decoded.userId, cRemark: err && err.message ? err.message : `${JSON.stringify(err).substring(0, 200)}`, "cType": 'O', "jData": jOther };
                    await this.db.executeRef('log_insert', log_data);
                    this.rds.deleteValue(`user/${decoded.userId}`);
                }
                catch (error) {
                    console.log(`User logout ${error}`);
                }
            }
            return res.status(401).json({ message: 'Invalid Token' });
        }
        try {
            let dataUSR = await this.rds.getValue(`user/${decoded.userId}`);
            let objs = JSON.parse(dataUSR);
            if (objs.id != decoded.broweserId) {
                console.log(`[JWT-MW] BrowserId mismatch for user ${decoded.userId} — token: ${decoded.broweserId}, redis: ${objs.id}`);
                let origin = this.config.get('ORIGIN');
                let jOther = { O: origin };
                let log_data = { "nLCatid": 3, "nMasterid": decoded.userId, cRemark: 'Browser id not Match', "cType": 'O', "jData": jOther };
                await this.db.executeRef('log_insert', log_data);
                return res.status(401).json({ message: 'Old Token' });
            }
            req['isAdmin'] = objs.a || false;
        }
        catch (error) {
            return res.status(401).json({ message: 'Old Token' });
        }
        next();
    }
};
exports.JwtMiddleware = JwtMiddleware;
exports.JwtMiddleware = JwtMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _c : Object])
], JwtMiddleware);


/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 39 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperLinkProcessor = void 0;
const bull_1 = __webpack_require__(13);
const bull_2 = __webpack_require__(12);
const config_1 = __webpack_require__(9);
const redis_db_service_1 = __webpack_require__(6);
const log_service_1 = __webpack_require__(40);
const db_service_1 = __webpack_require__(22);
const hyperlinksearch_service_1 = __webpack_require__(42);
const utility_service_1 = __webpack_require__(45);
const fs = __webpack_require__(35);
const fs_1 = __webpack_require__(35);
let HyperLinkProcessor = class HyperLinkProcessor {
    constructor(config, rds, db, logService, hyperlinksearchService, utility) {
        this.config = config;
        this.rds = rds;
        this.db = db;
        this.logService = logService;
        this.hyperlinksearchService = hyperlinksearchService;
        this.utility = utility;
        this.logApp = 'hyperlink';
    }
    async handleHyperlink(job) {
        const jobData = job.data;
        console.log('\n\r\n\rProcessing hyperlink for ', jobData);
        this.logService.info(`Processing hyperlink for ${jobData.queueName}`, this.logApp);
        const files = await this.getHyperlinkfiles({ nBundledetailid: jobData.nBundledetailid, nBundleid: jobData.nBundleid, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });
        this.logService.info(`File length ${files.length}`, this.logApp);
        jobData.nTotal = files.length;
        this.sendUploadResponce(jobData);
        const searchTermsPath = `${this.config.get('HYPERLINK_DB_PATH')}/search_terms${jobData.nSectionid}.txt`;
        if (jobData.isDeepscan) {
            await this.fetchHyperlinksTerms(jobData, searchTermsPath);
        }
        try {
            console.log('searchTermsPath', files.length);
            for (let x of files) {
                try {
                    const res = await this.hyperlinksearchService.createHyperlinkFile(x, jobData, searchTermsPath);
                    if (res) {
                        this.logService.info(`Hyperlink created for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
                        await this.updateHyperlinksForFile(x, jobData, 'C');
                        jobData.nCompleted++;
                    }
                    else {
                        this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
                        await this.updateHyperlinksForFile(x, jobData, 'F');
                        jobData.nFailed++;
                    }
                }
                catch (error) {
                    this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
                    await this.updateHyperlinksForFile(x, jobData, 'F');
                    jobData.nFailed++;
                }
                this.sendUploadResponce(jobData);
            }
            jobData.cStatus = 'C';
            let nBundledetailid = files.length == 1 ? files[0].nBundledetailid : null;
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, true, nBundledetailid);
        }
        catch (error) {
            console.log('Error in hyperlink', error);
            jobData.cStatus = 'F';
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
            this.logService.info(`Error in hyperlink  ${jobData.queueName}`, this.logApp);
        }
        this.sendUploadResponce(jobData);
        this.logService.info(`Hyperlink Complete for  ${jobData.queueName}`, this.logApp);
        this.removeRediskey(jobData.queueName);
    }
    async getHyperlinkfiles(query) {
        query["ref"] = 2;
        let res = await this.db.executeRef('hyperlink_getfiles', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [];
            }
        }
        else {
            return [];
        }
    }
    async getHyperlinkSearchTerms(query) {
        let res = await this.db.executeRef('hyperlink_searchterms', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [];
            }
        }
        else {
            return [];
        }
    }
    removeRediskey(name) {
        try {
            this.rds.deleteValue(name);
        }
        catch (error) {
        }
    }
    async updateHyperlinksForFile(file, jobData, cStatus) {
        try {
            const param = {
                nMasterid: jobData.nMasterid,
                nSectionid: jobData.nSectionid,
                nBundledetailid: file.nBundledetailid,
                cType: jobData.cType,
                cStatus: cStatus,
                cPath: (`${this.config.get('HYPERLINK_DB_PATH')}/search_results${file.nBundledetailid}.csv`),
                cKeeptype: jobData.cKeeptype || 'R'
            };
            let res = await this.db.executeRef('hyperlink_update_documents', param);
            if (res.success) {
                try {
                    return res.data[0][0];
                }
                catch (error) {
                    return { msg: -1 };
                }
            }
            else {
                return { msg: -1 };
            }
        }
        catch (error) {
            console.log('Error in updateHyperlinksForFile', error);
            return { msg: -1 };
        }
    }
    sendUploadResponce(jobData) {
        this.rds.setValue(jobData.queueName, JSON.stringify(jobData));
        this.utility.emit({ event: 'HYPERLINK-RESPONCE', data: jobData });
    }
    async fetchHyperlinksTerms(jobData, searchTermsPath) {
        let res = await this.getHyperlinkSearchTerms({ nCaseid: jobData.nCaseid, nMasterid: jobData.nMasterid, nSectionid: jobData.nSectionid, cType: jobData.cType || 'E' });
        console.log('\n\r\n\rData Of  terms', res);
        if (res?.length) {
            console.log('creating search terms file');
            if (fs.existsSync(searchTermsPath)) {
                fs.unlinkSync(searchTermsPath);
            }
            const search_terms = res.flatMap((a) => {
                if (!a.cTerm)
                    return [];
                return a.cTerm.split(',').map(t => t.trim()).filter(t => t.length > 0);
            });
            await fs_1.promises.writeFile(searchTermsPath, search_terms.join('\n'));
            console.log('File Written');
        }
        return true;
    }
    async sendNotification(nCaseid, nMasterid, status, nBundledetailid) {
        if (!nCaseid)
            return;
        this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `Hyperlink`;
                    a.cMsg = `Hyperlink ${status ? 'Successful' : 'false'} | Case no. ${a.cCaseno}`;
                    a.nBundledetailid = nBundledetailid;
                    a.nRefuserid = nMasterid;
                    this.utility.emit(a, `notification`);
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async getUploadUser(nCaseid) {
        try {
            let res = await this.db.executeRef('notifications_caseusers', { nCaseid: nCaseid });
            if (res.success) {
                return res.data[0];
            }
            else {
                return [];
            }
            ;
        }
        catch (error) {
        }
    }
};
exports.HyperLinkProcessor = HyperLinkProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], HyperLinkProcessor.prototype, "handleHyperlink", null);
exports.HyperLinkProcessor = HyperLinkProcessor = __decorate([
    (0, bull_1.Processor)('hyperlink-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof hyperlinksearch_service_1.HyperlinksearchService !== "undefined" && hyperlinksearch_service_1.HyperlinksearchService) === "function" ? _e : Object, typeof (_f = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _f : Object])
], HyperLinkProcessor);


/***/ }),
/* 40 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(34);
const nest_winston_1 = __webpack_require__(33);
const winston = __webpack_require__(34);
const fs = __webpack_require__(35);
const path = __webpack_require__(36);
const moment = __webpack_require__(41);
let LogService = class LogService {
    constructor(defaultLogger) {
        this.defaultLogger = defaultLogger;
        this.loggers = new Map();
    }
    createLogger(topic, appName) {
        try {
            const date = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
            const logDir = path.join('logs', date, appName);
            fs.mkdirSync(logDir, { recursive: true });
            const transport = new winston.transports.File({
                filename: path.join(logDir, `${topic}.log`),
                level: 'info',
                format: winston.format.combine(winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }), winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)),
            });
            return winston.createLogger({
                level: 'info',
                format: winston.format.combine(winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss',
                }), winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)),
                transports: [transport],
            });
        }
        catch (error) {
            this.defaultLogger.error(`Failed to create logger for topic ${topic} in app ${appName}: ${error.message}`);
            throw error;
        }
    }
    getLogger(topic, appName) {
        try {
            const loggerKey = `${appName}-${topic}`;
            const currentDate = moment().tz('Asia/Kolkata').format('YYYY-MM-DD');
            if (!this.loggers.has(loggerKey) || this.loggers.get(loggerKey).date !== currentDate) {
                const logger = this.createLogger(topic, appName);
                this.loggers.set(loggerKey, { logger, date: currentDate });
            }
            return this.loggers.get(loggerKey).logger;
        }
        catch (error) {
            this.defaultLogger.error(`Failed to get logger for topic ${topic} in app ${appName}: ${error.message}`);
            throw error;
        }
    }
    log(value, appName) {
        try {
            const topic = 'log';
            const logger = this.getLogger(topic, appName);
            logger.info(value);
        }
        catch (error) {
            this.defaultLogger.error(`Failed to log message: ${error.message}`);
        }
    }
    info(value, appName) {
        try {
            const topic = 'info';
            const logger = this.getLogger(topic, appName);
            logger.info(value);
        }
        catch (error) {
            this.defaultLogger.error(`Failed to log info message: ${error.message}`);
        }
    }
    error(value, appName) {
        try {
            const topic = 'error';
            const logger = this.getLogger(topic, appName);
            logger.error(value);
        }
        catch (error) {
            this.defaultLogger.error(`Failed to log error message: ${error.message}`);
        }
    }
    warn(value, appName) {
        try {
            const topic = 'warn';
            const logger = this.getLogger(topic, appName);
            logger.warn(value);
        }
        catch (error) {
            this.defaultLogger.error(`Failed to log warn message: ${error.message}`);
        }
    }
    debug(value, appName) {
        try {
            const topic = 'debug';
            const logger = this.getLogger(topic, appName);
            logger.debug(value);
        }
        catch (error) {
            this.defaultLogger.error(`Failed to log debug message: ${error.message}`);
        }
    }
    report(message, appName, type) {
        try {
            if (!type)
                type = 'I';
            const logger = this.getLogger('combined', appName);
            if (type === 'E') {
                logger.error(`ERROR: ${message}`);
            }
            else if (type === 'I') {
                logger.info(`INFO: ${message}`);
            }
            else {
                logger.warn(`Unknown log type specified for report: ${type}`);
            }
        }
        catch (error) {
            this.defaultLogger.error(`Failed to report message: ${error.message}`);
        }
    }
};
exports.LogService = LogService;
exports.LogService = LogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(nest_winston_1.WINSTON_MODULE_PROVIDER)),
    __metadata("design:paramtypes", [typeof (_a = typeof winston_1.Logger !== "undefined" && winston_1.Logger) === "function" ? _a : Object])
], LogService);


/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 42 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperlinksearchService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(43);
const config_1 = __webpack_require__(9);
const fs_1 = __webpack_require__(35);
const fs_original = __webpack_require__(35);
const path = __webpack_require__(36);
const uuid_1 = __webpack_require__(44);
let HyperlinksearchService = class HyperlinksearchService {
    constructor(config) {
        this.config = config;
    }
    async createHyperlinkFile(fileinfo, jobData, searchTermsPath) {
        const outputPath = this.config.get('HYPERLINK_OUTPUT_PATH');
        try {
            await fs_1.promises.access(outputPath);
        }
        catch (error) {
            await fs_1.promises.mkdir(outputPath, { recursive: true });
        }
        const csvFilepath = path.join(outputPath, `search_results${fileinfo.nBundledetailid}.csv`);
        const pdfPath = (fileinfo.cPath);
        try {
            try {
                await fs_1.promises.access(this.config.get('TEMP_PATH'));
            }
            catch (error) {
                await fs_1.promises.mkdir(this.config.get('TEMP_PATH'), { recursive: true });
            }
            const tempPath = path.join(this.config.get('TEMP_PATH'), `temp_${(fileinfo.nBundledetailid || new Date().getTime().toString())}.pdf`);
            const params = [
                this.config.get((jobData.isDeepscan ? 'PY_HYPERLINK_DEEP' : 'PY_HYPERLINK')),
                pdfPath,
                (jobData.isDeepscan ? searchTermsPath : fileinfo.nBundledetailid),
                csvFilepath,
                fileinfo.nBundledetailid,
                this.config.get('DO_SPACES_BUCKET_NAME'),
                this.config.get('DO_SPACES_KEY'),
                this.config.get('DO_SPACES_SECRET'),
                this.config.get('DO_SPACES_ENDPOINT'),
                tempPath
            ];
            console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), params, {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    DB_DATABASE: this.config.get('DB_DATABASE'),
                    DB_USERNAME: this.config.get('DB_USERNAME'),
                    DB_PASSWORD: this.config.get('DB_PASSWORD'),
                    DB_HOST: this.config.get('DB_HOST'),
                    DB_PORT: this.config.get('DB_PORT')
                },
            });
            pythonProcess.stdout.on('data', (data) => {
                console.log('\n\r\n\r\n\r\n\rINFO:', data.toString());
                const log_msg = data.toString();
                fs_original.appendFile('hyperlink_test.txt', log_msg + '\n', (err) => {
                    if (err) {
                        console.error('Error appending to file:', err);
                        throw err;
                    }
                    console.log('File updated successfully!');
                });
            });
            pythonProcess.stderr.on('data', (data) => {
                console.log('\n\r\n\r\n\r\n\rERROR:', data.toString());
            });
            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.error('ERROR:', err);
                    reject(err);
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Python process exited with code ${code}`);
                        resolve(false);
                        return;
                    }
                    resolve(true);
                });
            });
        }
        catch (error) {
            console.error('ERROR:', error);
            return false;
        }
    }
    async createIndexHyperlinkFile(fileinfo, jobData, tempFilePath, searchResults, search_termsWithbundle) {
        console.log('CREATING INDEX');
        const filterdata = [];
        const pdfPath = fileinfo.cPath;
        try {
            const tempPath = path.join(this.config.get('TEMP_PATH'), `temp_${(fileinfo.nBundledetailid || new Date().getTime().toString())}.pdf`);
            const params = [
                this.config.get('PY_HYPERLINK_INDEX'),
                pdfPath,
                tempFilePath,
                'A',
                'B',
                this.config.get('DO_SPACES_BUCKET_NAME'),
                this.config.get('DO_SPACES_KEY'),
                this.config.get('DO_SPACES_SECRET'),
                this.config.get('DO_SPACES_ENDPOINT'),
                tempPath
            ];
            console.log(params);
            console.log('INFO:', 'Python command:', this.config.get('pythonV'), params.join(' '));
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), params, {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    DB_DATABASE: this.config.get('DB_DATABASE'),
                    DB_USERNAME: this.config.get('DB_USERNAME'),
                    DB_PASSWORD: this.config.get('DB_PASSWORD'),
                    DB_HOST: this.config.get('DB_HOST'),
                    DB_PORT: this.config.get('DB_PORT')
                },
            });
            pythonProcess.stdout.on('data', (data) => {
                try {
                    let rows = data.toString("utf8").split("TOEND");
                    l1: for (let x of rows) {
                        let obj = {};
                        if (x.includes("PAGENO")) {
                            let array = x.split(",");
                            l2: for (let y of array) {
                                if (y.includes("PAGENO")) {
                                    obj.page = parseInt(y.split(":")[1]);
                                }
                                else if (y.includes("Term:")) {
                                    obj.cTerm = y.split(":")[1].trim();
                                }
                                else if (y.includes("x:")) {
                                    obj.x = parseFloat(y.split(":")[1]);
                                }
                                else if (y.includes("y:")) {
                                    obj.y = parseFloat(y.split(":")[1]);
                                }
                                else if (y.includes("x1:")) {
                                    obj.width = parseFloat(y.split(":")[1]) - obj.x;
                                }
                                else if (y.includes("y1:")) {
                                    obj.height = parseFloat(y.split(":")[1]) - obj.y;
                                    obj.y = obj.y + obj.height;
                                }
                                else if (y.includes("pref:")) {
                                    obj.prefix = y.split(":")[1].trim();
                                }
                                else if (y.includes("Hword:")) {
                                    try {
                                        if (y.includes("-")) {
                                            obj.redirectpage = parseInt(y
                                                .split(":")[1]
                                                .split("-")[y.split(":")[1].split("-").length - 1].trim());
                                        }
                                    }
                                    catch (error) { }
                                }
                                else if (y.includes("TOEND")) {
                                    break l2;
                                }
                            }
                        }
                        if (Object.keys(obj).length) {
                            if (filterdata.findIndex((a) => a.x == obj.x && a.y == obj.y && a.page == obj.page) == -1) {
                                filterdata.push(obj);
                            }
                        }
                    }
                }
                catch (error) {
                    console.log('ERROR:', error);
                }
            });
            return new Promise((resolve, reject) => {
                pythonProcess.stderr.on('data', (data) => {
                    console.log(`stderr: ${data}`);
                    searchResults = [];
                    resolve(false);
                });
                pythonProcess.on('error', (err) => {
                    console.log('ERROR:', err);
                    reject(err);
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`Python process exited with code ${code}`);
                        resolve(false);
                        return;
                    }
                    if (filterdata && filterdata.length) {
                        for (let rowobject of filterdata) {
                            try {
                                if (rowobject) {
                                    if (!rowobject.cTerm) {
                                        rowobject.cTerm = '';
                                    }
                                    if (!rowobject.cTerm.includes("ALPHA$-")) {
                                        let bd_id = null;
                                        try {
                                            let ls_obj = search_termsWithbundle.find((a) => a.cTerm == rowobject.cTerm);
                                            if (ls_obj) {
                                                bd_id = ls_obj.nBundledetailid;
                                            }
                                            if (rowobject.prefix && rowobject.prefix != 'None') {
                                                let neid = rowobject.prefix.replace(`ALPHA$-${rowobject.cTerm}-`, '');
                                                if (neid) {
                                                    bd_id = neid;
                                                }
                                            }
                                        }
                                        catch (error) { }
                                        let ojs = {
                                            page: rowobject.page,
                                            type: "strikeout",
                                            uuid: (0, uuid_1.v4)(),
                                            tab: rowobject.cTerm,
                                            rects: [
                                                {
                                                    x: rowobject.x,
                                                    y: rowobject.y,
                                                    width: rowobject.width,
                                                    height: rowobject.height,
                                                    bundledetailid: bd_id,
                                                    redirectpage: rowobject.redirectpage || 1,
                                                },
                                            ]
                                        };
                                        searchResults.push(ojs);
                                    }
                                    else {
                                        if (searchResults.length) {
                                            try {
                                                let neid = rowobject.cTerm.split("-")[rowobject.cTerm.split("-").length - 1];
                                                if (neid) {
                                                    searchResults[searchResults.length - 1]["bundledetailid"] = neid;
                                                }
                                            }
                                            catch (error) { }
                                        }
                                    }
                                }
                            }
                            catch (error) {
                            }
                        }
                    }
                    resolve(true);
                });
            });
        }
        catch (error) {
            console.log('ERROR:', error);
            return false;
        }
    }
};
exports.HyperlinksearchService = HyperlinksearchService;
exports.HyperlinksearchService = HyperlinksearchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], HyperlinksearchService);


/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 45 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(46);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'hyperlink-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


/***/ }),
/* 46 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(18);
let KafkaGlobalService = class KafkaGlobalService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    async onModuleInit() {
        console.log('Connected to kafka service');
        await this.kafka.connect();
    }
    async sendMessage(topic, data) {
        this.kafka.emit(topic, data);
        return true;
    }
};
exports.KafkaGlobalService = KafkaGlobalService;
exports.KafkaGlobalService = KafkaGlobalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('KAFKA_SERVICE')),
    __metadata("design:paramtypes", [typeof (_a = typeof microservices_1.ClientKafka !== "undefined" && microservices_1.ClientKafka) === "function" ? _a : Object])
], KafkaGlobalService);


/***/ }),
/* 47 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HyperLinkIndexProcessor = void 0;
const bull_1 = __webpack_require__(13);
const bull_2 = __webpack_require__(12);
const config_1 = __webpack_require__(9);
const redis_db_service_1 = __webpack_require__(6);
const log_service_1 = __webpack_require__(40);
const db_service_1 = __webpack_require__(22);
const hyperlinksearch_service_1 = __webpack_require__(42);
const utility_service_1 = __webpack_require__(45);
const fs_1 = __webpack_require__(35);
const path = __webpack_require__(36);
let HyperLinkIndexProcessor = class HyperLinkIndexProcessor {
    constructor(config, rds, db, logService, hyperlinksearchService, utility) {
        this.config = config;
        this.rds = rds;
        this.db = db;
        this.logService = logService;
        this.hyperlinksearchService = hyperlinksearchService;
        this.utility = utility;
        this.logApp = 'hyperlink';
    }
    async handleHyperlink(job) {
        debugger;
        const jobData = job.data;
        this.sendUploadResponce(jobData);
        console.log('Processing hyperlink for ', jobData.queueName);
        this.logService.info(`Processing hyperlink for ${jobData.queueName}`, this.logApp);
        const files = await this.getHyperlinkfiles({ nBundledetailid: jobData.nBundledetailid, nBundleid: null, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });
        const search_terms = [];
        const search_termsWithbundle = [];
        try {
            const res = await this.getTerms({ nBundledetailid: jobData.nBundledetailid, nBundleid: null, nSectionid: jobData.nSectionid, nCaseid: jobData.nCaseid, cType: jobData.cType, nMasterid: jobData.nMasterid, cKeeptype: jobData.cKeeptype || 'R', isDeepscan: jobData.isDeepscan || false });
            if (res.length) {
                search_terms.push(...(res[0] || []).flatMap(x => {
                    if (!x.cTerm)
                        return [];
                    return x.cTerm.split(',').map(t => t.trim()).filter(t => t.length > 0);
                }));
                search_termsWithbundle.push(...(res[1] || []).flatMap(x => {
                    if (!x.cTerm)
                        return [x];
                    const terms = x.cTerm.split(',').map(t => t.trim()).filter(t => t.length > 0);
                    if (terms.length <= 1)
                        return [x];
                    return terms.map(term => ({ ...x, cTerm: term }));
                }));
            }
        }
        catch (error) {
            console.log('Error in getting search terms', error);
            this.logService.info(`Processing hyperlink index error ${jobData.queueName}`, this.logApp);
            jobData.cStatus = 'F';
            this.sendUploadResponce(jobData);
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
            return;
        }
        if (!search_terms.length) {
            console.log('No search term result found');
            this.logService.info(`No search term result found ${jobData.queueName}`, this.logApp);
            jobData.cStatus = 'C';
            this.sendUploadResponce(jobData);
            ;
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, true);
            return;
        }
        const outputPath = this.config.get('HYPERLINK_OUTPUT_PATH');
        console.log('Find output path', outputPath);
        try {
            await fs_1.promises.access(outputPath);
        }
        catch (error) {
            await fs_1.promises.mkdir(outputPath, { recursive: true });
        }
        console.log('Directory access', outputPath, files.length);
        this.logService.info(`File length ${files.length}`, this.logApp);
        jobData.nTotal = files.length;
        console.log('Send upload responce');
        this.sendUploadResponce(jobData);
        try {
            console.log('searchTermsPath', files.length);
            for (let x of files) {
                const tempFilePath = path.join(this.config.get('HYPERLINK_OUTPUT_PATH'), `tempSearchTerms${x.nBundledetailid}.txt`);
                await fs_1.promises.writeFile(tempFilePath, search_terms.join('\n'));
                const searchResults = [];
                const res = await this.hyperlinksearchService.createIndexHyperlinkFile(x, jobData, tempFilePath, searchResults, search_termsWithbundle);
                if (res) {
                    this.logService.info(`Hyperlink created for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
                    await this.updateHyperlinksForFile(x, jobData, 'C', searchResults);
                    jobData.nCompleted++;
                }
                else {
                    this.logService.info(`Hyperlink failed for ${x.nBundledetailid},${x.cFilename}`, this.logApp);
                    await this.updateHyperlinksForFile(x, jobData, 'F', searchResults);
                    jobData.nFailed++;
                }
                this.sendUploadResponce(jobData);
            }
            jobData.cStatus = 'C';
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, true);
        }
        catch (error) {
            jobData.cStatus = 'F';
            this.logService.info(`Error in hyperlink  ${jobData.queueName}`, this.logApp);
            this.sendNotification(jobData.nCaseid, jobData.nMasterid, false);
        }
        this.sendUploadResponce(jobData);
        this.logService.info(`Hyperlink Complete for  ${jobData.queueName}`, this.logApp);
        this.removeRediskey(jobData.queueName);
    }
    async getHyperlinkfiles(query) {
        query["ref"] = 2;
        let res = await this.db.executeRef('hyperlink_getfiles', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [];
            }
        }
        else {
            return [];
        }
    }
    async getTerms(query) {
        query["ref"] = 2;
        let res = await this.db.executeRef('hyperlink_index_searchterms', query);
        if (res.success) {
            try {
                return res.data;
            }
            catch (error) {
                return [];
            }
        }
        else {
            return [];
        }
    }
    removeRediskey(name) {
        try {
            this.rds.deleteValue(name);
        }
        catch (error) {
        }
    }
    async updateHyperlinksForFile(file, jobData, cStatus, searchResults) {
        const param = {
            nMasterid: jobData.nMasterid,
            nSectionid: jobData.nSectionid,
            nBundledetailid: file.nBundledetailid,
            cType: jobData.cType,
            cStatus: cStatus,
            jAnnotations: JSON.stringify(searchResults || []),
            cKeeptype: jobData.cKeeptype || 'R'
        };
        let res = await this.db.executeRef('hyperlink_update_documents_index', param);
        if (res.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                return { msg: -1 };
            }
        }
        else {
            return { msg: -1 };
        }
    }
    sendUploadResponce(jobData) {
        this.rds.setValue(jobData.queueName, JSON.stringify(jobData));
        this.utility.emit({ event: 'HYPERLINK-RESPONCE', data: jobData });
    }
    async sendNotification(nCaseid, nMasterid, status) {
        if (!nCaseid)
            return;
        this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `Hyperlink`;
                    a.cMsg = `Hyperlink ${status ? 'Successful' : 'false'} | Case no. ${a.cCaseno}`;
                    a.nRefuserid = nMasterid;
                    this.utility.emit(a, `notification`);
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async getUploadUser(nCaseid) {
        try {
            let res = await this.db.executeRef('notifications_caseusers', { nCaseid: nCaseid });
            if (res.success) {
                return res.data[0];
            }
            else {
                return [];
            }
            ;
        }
        catch (error) {
        }
    }
};
exports.HyperLinkIndexProcessor = HyperLinkIndexProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], HyperLinkIndexProcessor.prototype, "handleHyperlink", null);
exports.HyperLinkIndexProcessor = HyperLinkIndexProcessor = __decorate([
    (0, bull_1.Processor)('hyperlink-index-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof hyperlinksearch_service_1.HyperlinksearchService !== "undefined" && hyperlinksearch_service_1.HyperlinksearchService) === "function" ? _e : Object, typeof (_f = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _f : Object])
], HyperLinkIndexProcessor);


/***/ }),
/* 48 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KafkaModule_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaModule = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(18);
const kafka_shared_service_1 = __webpack_require__(46);
const config_1 = __webpack_require__(9);
let KafkaModule = KafkaModule_1 = class KafkaModule {
    static register(clientId, groupId) {
        return {
            module: KafkaModule_1,
            imports: [
                microservices_1.ClientsModule.registerAsync([
                    {
                        name: 'KAFKA_SERVICE',
                        useFactory: async (configService) => ({
                            transport: microservices_1.Transport.KAFKA,
                            options: {
                                client: {
                                    clientId: clientId,
                                    brokers: [configService.get('KAFKA_HOST')],
                                },
                                consumer: {
                                    groupId: groupId,
                                },
                                producer: {
                                    allowAutoTopicCreation: true,
                                    retry: {
                                        initialRetryTime: 300,
                                        retries: 10,
                                    }
                                },
                            },
                        }),
                        inject: [config_1.ConfigService],
                    },
                ]),
            ],
            providers: [kafka_shared_service_1.KafkaGlobalService],
            exports: [microservices_1.ClientsModule, kafka_shared_service_1.KafkaGlobalService],
        };
    }
};
exports.KafkaModule = KafkaModule;
exports.KafkaModule = KafkaModule = KafkaModule_1 = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
    })
], KafkaModule);


/***/ }),
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(18);
function createKafkaOptions(groupId) {
    const brokers = [process.env.KAFKA_HOST || '103.253.145.78:9092'];
    console.log('Kafka brokers:', brokers);
    return {
        transport: microservices_1.Transport.KAFKA,
        options: {
            client: {
                brokers: brokers,
            },
            consumer: {
                groupId: groupId,
            },
            producer: {
                allowAutoTopicCreation: true,
                retry: {
                    initialRetryTime: 300,
                    retries: 10,
                },
            },
        },
    };
}


/***/ }),
/* 50 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 51 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 52 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it uses a non-standard name for the exports (exports).
(() => {
var exports = __webpack_exports__;

Object.defineProperty(exports, "__esModule", ({ value: true }));
const core_1 = __webpack_require__(1);
const hyperlink_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const kafka_config_1 = __webpack_require__(49);
const swagger_1 = __webpack_require__(10);
const compression = __webpack_require__(50);
const cookieParser = __webpack_require__(51);
const dotenv = __webpack_require__(52);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(hyperlink_module_1.HyperlinkModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('hyperlink-group'));
    await app.startAllMicroservices();
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    app.use(compression());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Etabella Core API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/hyperlink' : '')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(process.env.PORT_HYPERLINK);
}
bootstrap();

})();

/******/ })()
;