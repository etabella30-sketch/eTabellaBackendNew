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
exports.SfuModule = void 0;
const common_1 = __webpack_require__(3);
const sfu_controller_1 = __webpack_require__(4);
const sfu_service_1 = __webpack_require__(6);
const stats_controller_1 = __webpack_require__(7);
const jwt_middleware_1 = __webpack_require__(8);
const winston_module_1 = __webpack_require__(17);
const redis_db_service_1 = __webpack_require__(10);
const ioredis_1 = __webpack_require__(12);
const config_1 = __webpack_require__(13);
const log_service_1 = __webpack_require__(22);
const global_1 = __webpack_require__(24);
const query_builder_service_1 = __webpack_require__(16);
const db_service_1 = __webpack_require__(14);
const utility_service_1 = __webpack_require__(30);
const manage_controller_1 = __webpack_require__(31);
const manage_service_1 = __webpack_require__(36);
const workers_service_1 = __webpack_require__(37);
const sfu_config_service_1 = __webpack_require__(40);
let SfuModule = class SfuModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(stats_controller_1.StatsController, manage_controller_1.ManageController);
    }
};
exports.SfuModule = SfuModule;
exports.SfuModule = SfuModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule,
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            winston_module_1.WinstonConfigModule.forRoot('pagination')],
        controllers: [
            sfu_controller_1.SfuController, stats_controller_1.StatsController, manage_controller_1.ManageController
        ],
        providers: [sfu_service_1.SfuService, redis_db_service_1.RedisDbService, log_service_1.LogService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, utility_service_1.UtilityService, manage_service_1.ManageService, workers_service_1.WorkersService, sfu_config_service_1.SfuConfigService],
    })
], SfuModule);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SfuController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(5);
const sfu_service_1 = __webpack_require__(6);
let SfuController = class SfuController {
    constructor(sfuService) {
        this.sfuService = sfuService;
    }
    getHealth() {
        const stats = this.sfuService.getStats();
        return {
            status: 'ok',
            message: 'SFU service is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        };
    }
};
exports.SfuController = SfuController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Health check endpoint' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns the health status of the SFU service',
        schema: {
            type: 'object',
            properties: {
                status: { type: 'string', example: 'ok', description: 'Service status' },
                message: { type: 'string', example: 'SFU service is running', description: 'Status message' },
                timestamp: { type: 'string', example: '2025-04-19T06:00:00.000Z', description: 'Current timestamp' },
                version: { type: 'string', example: '1.0.0', description: 'Service version' },
                workers: { type: 'number', example: 4, description: 'Number of active mediasoup workers' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], SfuController.prototype, "getHealth", null);
exports.SfuController = SfuController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof sfu_service_1.SfuService !== "undefined" && sfu_service_1.SfuService) === "function" ? _a : Object])
], SfuController);


/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 6 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SfuService = void 0;
const common_1 = __webpack_require__(3);
let SfuService = class SfuService {
    getStats() {
        return {};
    }
};
exports.SfuService = SfuService;
exports.SfuService = SfuService = __decorate([
    (0, common_1.Injectable)()
], SfuService);


/***/ }),
/* 7 */
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
exports.StatsController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(5);
const sfu_service_1 = __webpack_require__(6);
let StatsController = class StatsController {
    constructor(sfuService) {
        this.sfuService = sfuService;
    }
    getStats() {
        return this.sfuService.getStats();
    }
};
exports.StatsController = StatsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get SFU statistics' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Returns current statistics about the SFU service',
        schema: {
            type: 'object',
            properties: {
                workers: { type: 'number', description: 'Number of active mediasoup workers' },
                activeWorkerIndex: { type: 'number', description: 'Index of currently active worker' },
                transports: { type: 'number', description: 'Number of active WebRTC transports' },
                producers: { type: 'number', description: 'Number of active media producers' },
                consumers: { type: 'number', description: 'Number of active media consumers' }
            }
        }
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StatsController.prototype, "getStats", null);
exports.StatsController = StatsController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('stats'),
    (0, common_1.Controller)('stats'),
    __metadata("design:paramtypes", [typeof (_a = typeof sfu_service_1.SfuService !== "undefined" && sfu_service_1.SfuService) === "function" ? _a : Object])
], StatsController);


/***/ }),
/* 8 */
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
const jwt = __webpack_require__(9);
const redis_db_service_1 = __webpack_require__(10);
const config_1 = __webpack_require__(13);
const db_service_1 = __webpack_require__(14);
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
/* 9 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 10 */
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
const ioredis_1 = __webpack_require__(11);
const ioredis_2 = __webpack_require__(12);
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
/* 11 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(15);
const query_builder_service_1 = __webpack_require__(16);
const config_1 = __webpack_require__(13);
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
/* 15 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 16 */
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
/* 17 */
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
const nest_winston_1 = __webpack_require__(18);
const winston = __webpack_require__(19);
const fs = __webpack_require__(20);
const path = __webpack_require__(21);
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
/* 18 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("path");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(19);
const nest_winston_1 = __webpack_require__(18);
const winston = __webpack_require__(19);
const fs = __webpack_require__(20);
const path = __webpack_require__(21);
const moment = __webpack_require__(23);
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
/* 23 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 24 */
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
__exportStar(__webpack_require__(25), exports);
__exportStar(__webpack_require__(26), exports);


/***/ }),
/* 25 */
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
const global_service_1 = __webpack_require__(26);
const config_1 = __webpack_require__(13);
const scheduler_service_1 = __webpack_require__(27);
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
/* 26 */
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
/* 27 */
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
const moment = __webpack_require__(28);
const schedule = __webpack_require__(29);
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
/* 28 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 30 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    getTransportKey(nPresentid, nUserid, isProducer) {
        return `${nPresentid}|${nUserid}|${isProducer ? 'producer' : 'consumer'}`;
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)()
], UtilityService);


/***/ }),
/* 31 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ManageController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(5);
const manage_interface_1 = __webpack_require__(32);
const manage_service_1 = __webpack_require__(36);
let ManageController = class ManageController {
    constructor(manageService) {
        this.manageService = manageService;
    }
    async requestToJoin(body) {
        return await this.manageService.join(body);
    }
    async createTransport(body, req) {
        return await this.manageService.createTransport(body, req.headers["host"]);
    }
    async connectTransport(body) {
        return await this.manageService.connectTransport(body);
    }
    async produce(body) {
        return await this.manageService.produce(body);
    }
    async consume(body) {
        return await this.manageService.consume(body);
    }
};
exports.ManageController = ManageController;
__decorate([
    (0, common_1.Post)('join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof manage_interface_1.joinReq !== "undefined" && manage_interface_1.joinReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ManageController.prototype, "requestToJoin", null);
__decorate([
    (0, common_1.Post)('create-transport'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof manage_interface_1.createTransportReq !== "undefined" && manage_interface_1.createTransportReq) === "function" ? _d : Object, typeof (_e = typeof Request !== "undefined" && Request) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], ManageController.prototype, "createTransport", null);
__decorate([
    (0, common_1.Post)('connect-transport'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof manage_interface_1.connectTransportReq !== "undefined" && manage_interface_1.connectTransportReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], ManageController.prototype, "connectTransport", null);
__decorate([
    (0, common_1.Post)('produce'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof manage_interface_1.produceReq !== "undefined" && manage_interface_1.produceReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], ManageController.prototype, "produce", null);
__decorate([
    (0, common_1.Post)('consume'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof manage_interface_1.consumeReq !== "undefined" && manage_interface_1.consumeReq) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], ManageController.prototype, "consume", null);
exports.ManageController = ManageController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('manage'),
    (0, common_1.Controller)('manage'),
    __metadata("design:paramtypes", [typeof (_a = typeof manage_service_1.ManageService !== "undefined" && manage_service_1.ManageService) === "function" ? _a : Object])
], ManageController);


/***/ }),
/* 32 */
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
exports.consumeReq = exports.produceReq = exports.connectTransportReq = exports.createTransportReq = exports.joinReq = void 0;
const swagger_1 = __webpack_require__(5);
const class_validator_1 = __webpack_require__(33);
const is_uuid_nullable_decorator_1 = __webpack_require__(34);
class commonRequest {
}
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], commonRequest.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], commonRequest.prototype, "nMasterid", void 0);
class joinReq extends commonRequest {
}
exports.joinReq = joinReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'isPresenter' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], joinReq.prototype, "isPresenter", void 0);
class createTransportReq extends commonRequest {
}
exports.createTransportReq = createTransportReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'isPresenter' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], createTransportReq.prototype, "isPresenter", void 0);
class connectTransportReq extends commonRequest {
}
exports.connectTransportReq = connectTransportReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'isPresenter' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], connectTransportReq.prototype, "isPresenter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'transportId' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], connectTransportReq.prototype, "dtlsParameters", void 0);
class produceReq extends commonRequest {
}
exports.produceReq = produceReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'transportId' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], produceReq.prototype, "kind", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'transportId' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], produceReq.prototype, "rtpParameters", void 0);
class consumeReq extends commonRequest {
}
exports.consumeReq = consumeReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'transportId' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], consumeReq.prototype, "rtpCapabilities", void 0);


/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 34 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(35);
const class_validator_1 = __webpack_require__(33);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 36 */
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
exports.ManageService = void 0;
const common_1 = __webpack_require__(3);
const workers_service_1 = __webpack_require__(37);
const sfu_config_service_1 = __webpack_require__(40);
let ManageService = class ManageService {
    constructor(workersService, sfuConfig) {
        this.workersService = workersService;
        this.sfuConfig = sfuConfig;
        this.logger = new common_1.Logger('manage-service');
        this.rooms = {};
    }
    async join(body) {
        debugger;
        const { nPresentid, isPresenter, nMasterid } = body;
        this.logger.log(`join request for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
        try {
            const { worker, index } = this.workersService.getFreeWorker(this.rooms);
            if (!worker) {
                this.logger.error('No free workers available');
                return { msg: -1, error: 'No free workers available', rtpCapabilities: null, producerId: null };
            }
            await this.cleanUpRoom(nPresentid, nMasterid, isPresenter);
            this.logger.log(`Using worker index: ${index} for presentation id: ${nPresentid}`);
            if (!this.rooms[nPresentid]) {
                this.logger.log(`Creating new router for presentation id: ${nPresentid} on worker index: ${index}`);
                const router = await worker.createRouter({ mediaCodecs: this.sfuConfig.mediaCodecs });
                this.rooms[nPresentid] = { workerindex: index, router, producer: null, producerTransport: null, consumers: {}, transports: {} };
            }
            const rtpCapabilities = this.rooms[nPresentid]?.router?.rtpCapabilities;
            return { msg: 1, rtpCapabilities, producerId: this.rooms[nPresentid].producer?.id || null };
        }
        catch (error) {
            this.logger.error(`Error in join method: ${error.message}`, error.stack);
            return { msg: -1, error: error.message, rtpCapabilities: null, producerId: null };
        }
    }
    async cleanUpRoom(nPresentid, nMasterid, isPresenter) {
        try {
            const room = this.rooms[nPresentid];
            if (!room)
                return;
            if (isPresenter) {
                for (const [key, transport] of Object.entries(room.transports)) {
                    try {
                        await transport.close();
                        this.logger.log(`Closed transport: ${key}`);
                    }
                    catch (err) {
                        this.logger.error(`Error closing transport (${key}): ${err.message}`, err.stack);
                    }
                }
                for (const [key, consumer] of Object.entries(room.consumers)) {
                    try {
                        await consumer.close();
                        this.logger.log(`Closed consumer: ${key}`);
                    }
                    catch (err) {
                        this.logger.error(`Error closing consumer (${key}): ${err.message}`, err.stack);
                    }
                }
                if (room.producer) {
                    try {
                        await room.producer.close();
                        this.logger.log(`Closed producer`);
                    }
                    catch (err) {
                        this.logger.error(`Error closing producer: ${err.message}`, err.stack);
                    }
                }
                room.producer = null;
                room.producerTransport = null;
                room.transports = {};
                room.consumers = {};
            }
            else {
                const transportKey = `${nMasterid}-viewer`;
                const consumerKey = `${nMasterid}`;
                const transport = room.transports[transportKey];
                if (transport) {
                    try {
                        await transport.close();
                        this.logger.log(`Closed viewer transport: ${transportKey}`);
                    }
                    catch (err) {
                        this.logger.error(`Error closing viewer transport (${transportKey}): ${err.message}`, err.stack);
                    }
                    delete room.transports[transportKey];
                }
                const consumer = room.consumers[consumerKey];
                if (consumer) {
                    try {
                        await consumer.close();
                        this.logger.log(`Closed viewer consumer: ${consumerKey}`);
                    }
                    catch (err) {
                        this.logger.error(`Error closing viewer consumer (${consumerKey}): ${err.message}`, err.stack);
                    }
                    delete room.consumers[consumerKey];
                }
            }
            if (!room.producer &&
                Object.keys(room.transports).length === 0 &&
                Object.keys(room.consumers).length === 0) {
                delete this.rooms[nPresentid];
                this.logger.log(`Room ${nPresentid} fully cleaned up`);
            }
        }
        catch (error) {
            this.logger.error(`Error in cleanUpRoom: ${error.message}`, error.stack);
        }
    }
    async createTransport(body, host) {
        const { nPresentid, isPresenter, nMasterid } = body;
        try {
            this.logger.log(`createTransport request for presentation id: ${nPresentid} , isPresenter: ${isPresenter}`);
            const room = this.rooms[nPresentid];
            if (!room) {
                this.logger.error(`No room found for presentation id: ${nPresentid}`);
                return { msg: -1, error: 'No room found', transport: null };
            }
            const options = this.sfuConfig.getTransportOptions(host);
            this.logger.verbose(`Transport Options: `, options);
            const transport = await room.router.createWebRtcTransport(options);
            transport.on('icestatechange', (iceState) => {
                if (iceState === 'connected') {
                    transport.setMaxIncomingBitrate(2000000);
                }
            });
            if (isPresenter) {
                try {
                    const minBitrate = this.sfuConfig.minimumAvailableOutgoingBitrate || 1000000;
                    await transport.setMinOutgoingBitrate(minBitrate);
                    await transport.setMaxOutgoingBitrate(this.sfuConfig.maxOutgoingBitrate);
                }
                catch (error) {
                }
            }
            else {
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
                },
                error: null
            };
        }
        catch (error) {
            this.logger.error(`Error in createTransport method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message, transport: null };
        }
    }
    async connectTransport(body) {
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
        }
        catch (error) {
            this.logger.error(`Error in connectTransport method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message };
        }
    }
    async produce(body) {
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
        }
        catch (error) {
            this.logger.error(`Error in produce method: ${error.message}`, error.stack);
            return { msg: -1, error: error?.message, id: null };
        }
    }
    async consume(body) {
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
                bufferSize: 8
            });
            this.logger.verbose(`Consumer type  ${consumer.type} `);
            consumer.on('score', async (score) => {
                try {
                    const producerScore = score.producerScore;
                    const consumerScore = score.score;
                    this.logger.verbose(`Consumer score for user ${nMasterid}: ${consumerScore}, producerScore: ${producerScore}`);
                    if (consumerScore < 3) {
                        this.logger.warn(`Very poor network conditions for user ${nMasterid}, score: ${consumerScore}`);
                    }
                    else {
                        await consumer.setPreferredLayers({ spatialLayer: 2, temporalLayer: 2 });
                    }
                }
                catch (error) {
                    this.logger.error(`Error in consumer score event: ${error.message}`, error.stack);
                }
            });
            await consumer.setPreferredLayers({
                spatialLayer: 2,
                temporalLayer: 2
            });
            let lastKeyFrameRequest = Date.now();
            consumer.on('layerschange', async (layers) => {
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
        }
        catch (error) {
            this.logger.error(`Error in consume method: ${error.message} by master id : ${nMasterid}`, error.stack);
            return { msg: -1, error: error?.message, consumer: null };
        }
    }
};
exports.ManageService = ManageService;
exports.ManageService = ManageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof workers_service_1.WorkersService !== "undefined" && workers_service_1.WorkersService) === "function" ? _a : Object, typeof (_b = typeof sfu_config_service_1.SfuConfigService !== "undefined" && sfu_config_service_1.SfuConfigService) === "function" ? _b : Object])
], ManageService);


/***/ }),
/* 37 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkersService = void 0;
const common_1 = __webpack_require__(3);
const os = __webpack_require__(38);
const mediasoup_1 = __webpack_require__(39);
let WorkersService = class WorkersService {
    constructor() {
        this.workers = [];
        this.logger = new common_1.Logger('worker-service');
    }
    async onModuleInit() {
        this.logger.log('WorkersService initialized');
        const numCores = os.cpus().length;
        const numWorkers = Math.max(1, Math.min(numCores - 1, 4));
        this.workers = [];
        for (let i = 0; i < numWorkers; i++) {
            try {
                const worker = await this.createWorkerWithRouter(i);
                this.workers.push(worker);
            }
            catch (error) {
                this.logger.error(`Error creating worker: ${error.message}`);
            }
        }
        this.logger.warn(`WorkersService initialized with workers: ${this.workers?.length} , system cors : ${numCores}`);
    }
    async createWorkerWithRouter(index) {
        try {
            const worker = await (0, mediasoup_1.createWorker)({
                rtcMinPort: 10000,
                rtcMaxPort: 10100,
                logLevel: 'warn',
                logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp']
            });
            worker.on('died', () => {
                this.logger.error(`Worker died unexpectedly, recreating...`);
                this.handleWorkerDied(index);
            });
            return worker;
        }
        catch (error) {
            this.logger.error(`Error creating worker and router: ${error.message}`);
            throw error;
        }
    }
    async handleWorkerDied(index) {
        try {
            this.logger.warn(`Worker at index ${index} died, replacing...`);
            const worker = await this.createWorkerWithRouter(index);
            this.workers[index] = worker;
            this.logger.log(`Successfully replaced dead worker at index ${index}`);
        }
        catch (error) {
            this.logger.error(`Error handling worker death: ${error.message}`, error.stack);
        }
    }
    getFreeWorker(rooms) {
        if (!this.workers || this.workers.length === 0)
            return null;
        const usage = new Map();
        this.workers.forEach((_, i) => usage.set(i, 0));
        for (const roomId in rooms) {
            const index = rooms[roomId].workerindex;
            usage.set(index, (usage.get(index) || 0) + 1);
        }
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
};
exports.WorkersService = WorkersService;
exports.WorkersService = WorkersService = __decorate([
    (0, common_1.Injectable)()
], WorkersService);


/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("mediasoup");

/***/ }),
/* 40 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SfuConfigService = void 0;
const common_1 = __webpack_require__(3);
let SfuConfigService = class SfuConfigService {
    constructor() {
        this.mediaCodecs = [
            {
                kind: 'video',
                mimeType: 'video/VP8',
                preferredPayloadType: 96,
                clockRate: 90000,
                parameters: {
                    'x-google-start-bitrate': 10000,
                    'x-google-max-bitrate': 20000,
                    'x-google-min-bitrate': 5000
                }
            },
            {
                kind: 'video',
                mimeType: 'video/VP9',
                preferredPayloadType: 98,
                clockRate: 90000,
                parameters: {
                    'profile-id': 2,
                    'x-google-start-bitrate': 8000,
                    'x-google-max-bitrate': 15000
                }
            },
            {
                kind: 'video',
                mimeType: 'video/h264',
                preferredPayloadType: 100,
                clockRate: 90000,
                parameters: {
                    'packetization-mode': 1,
                    'profile-level-id': '640032',
                    'level-asymmetry-allowed': 1,
                    'x-google-start-bitrate': 8000,
                    'x-google-max-bitrate': 15000,
                    'x-google-min-bitrate': 2000
                }
            },
            {
                kind: 'audio',
                mimeType: 'audio/opus',
                preferredPayloadType: 102,
                clockRate: 48000,
                channels: 2
            }
        ];
        this.transportOptions = {
            listenIps: [],
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
            initialAvailableOutgoingBitrate: 100000000,
            minimumAvailableOutgoingBitrate: 25000000,
            enableSctp: false
        };
        this.maxIncomingBitrate = 200000000;
        this.minimumAvailableOutgoingBitrate = 25000000;
        this.maxOutgoingBitrate = 35000000;
        this.transportProducerOptions = {
            enableSsrc: true,
            encodings: [
                {
                    maxBitrate: 15000000,
                    scaleResolutionDownBy: 1.0,
                    adaptivePtime: false,
                    priority: 'high'
                }
            ]
        };
    }
    getTransportOptions(host) {
        const env = process.env.ENVIORNMENT || 'legal';
        let listenIp = { ip: '127.0.0.1', announcedIp: null };
        if (env == 'localdocker') {
            listenIp = { ip: '0.0.0.0', announcedIp: '127.0.0.1' };
        }
        else if (env == 'legal') {
            listenIp = { ip: '0.0.0.0', announcedIp: '45.77.47.235' };
        }
        else if (env == 'tech') {
            listenIp = { ip: '0.0.0.0', announcedIp: '68.183.90.247' };
        }
        else if (env == 'com') {
            listenIp = { ip: '0.0.0.0', announcedIp: '139.180.153.126' };
        }
        this.transportOptions.listenIps[0] = listenIp;
        if (env == 'localdocker') {
            this.transportOptions.listenIps[0].announcedIp = host == 'localhost' ? '127.0.0.1' : host;
            this.transportOptions.listenIps[0].ip = '0.0.0.0';
        }
        console.log('Transport Options:', this.transportOptions);
        return this.transportOptions;
    }
};
exports.SfuConfigService = SfuConfigService;
exports.SfuConfigService = SfuConfigService = __decorate([
    (0, common_1.Injectable)()
], SfuConfigService);


/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 42 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HttpErrorFilter = void 0;
const common_1 = __webpack_require__(3);
let HttpErrorFilter = class HttpErrorFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : 500;
        const exceptionResponse = exception instanceof common_1.HttpException ? exception.getResponse() : { error: exception?.message || 'Internal Server Error' };
        try {
            response
                .status(status)
                .json({
                statusCode: status,
                message: exceptionResponse.error || exceptionResponse.message || 'An error occurred',
                detailedError: JSON.stringify(exceptionResponse) || 'An error occurred',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            response
                .status(status)
                .json({
                statusCode: status,
                message: 'An error occurred',
                detailedError: exception?.message || 'An error occurred',
                timestamp: new Date().toISOString(),
            });
        }
    }
};
exports.HttpErrorFilter = HttpErrorFilter;
exports.HttpErrorFilter = HttpErrorFilter = __decorate([
    (0, common_1.Catch)()
], HttpErrorFilter);


/***/ }),
/* 44 */
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
const sfu_module_1 = __webpack_require__(2);
const config_1 = __webpack_require__(13);
const compression = __webpack_require__(41);
const cookieParser = __webpack_require__(42);
const exception_1 = __webpack_require__(43);
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(5);
const dotenv = __webpack_require__(44);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(sfu_module_1.SfuModule);
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    app.use(compression());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Etabella SFU API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/presentation' : '')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new exception_1.HttpErrorFilter());
    const configService = app.get(config_1.ConfigService);
    await app.listen(configService.get('PORT_SFU'));
}
bootstrap();

})();

/******/ })()
;