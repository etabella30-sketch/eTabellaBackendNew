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
exports.PaginationModule = void 0;
const common_1 = __webpack_require__(3);
const pagination_controller_1 = __webpack_require__(4);
const pagination_service_1 = __webpack_require__(5);
const global_1 = __webpack_require__(6);
const paginationdata_module_1 = __webpack_require__(13);
const winston_module_1 = __webpack_require__(53);
const kafka_module_1 = __webpack_require__(49);
let PaginationModule = class PaginationModule {
};
exports.PaginationModule = PaginationModule;
exports.PaginationModule = PaginationModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule, paginationdata_module_1.PaginationdataModule,
            kafka_module_1.KafkaModule.register('etabella-pagination', 'pagination-group'),
            winston_module_1.WinstonConfigModule.forRoot('pagination')
        ],
        controllers: [pagination_controller_1.PaginationController],
        providers: [pagination_service_1.PaginationService],
    })
], PaginationModule);


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
exports.PaginationController = void 0;
const common_1 = __webpack_require__(3);
const pagination_service_1 = __webpack_require__(5);
let PaginationController = class PaginationController {
    constructor(paginationService) {
        this.paginationService = paginationService;
    }
    getHello() {
        return this.paginationService.getHello();
    }
};
exports.PaginationController = PaginationController;
exports.PaginationController = PaginationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof pagination_service_1.PaginationService !== "undefined" && pagination_service_1.PaginationService) === "function" ? _a : Object])
], PaginationController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginationService = void 0;
const common_1 = __webpack_require__(3);
let PaginationService = class PaginationService {
    constructor() { }
    async onModuleInit() {
    }
    getHello() {
        return 'Hello World!';
    }
};
exports.PaginationService = PaginationService;
exports.PaginationService = PaginationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaginationService);


/***/ }),
/* 6 */
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
__exportStar(__webpack_require__(7), exports);
__exportStar(__webpack_require__(8), exports);


/***/ }),
/* 7 */
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
const global_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(9);
const scheduler_service_1 = __webpack_require__(10);
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
/* 8 */
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
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 10 */
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
const moment = __webpack_require__(11);
const schedule = __webpack_require__(12);
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
/* 11 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 13 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginationdataModule = void 0;
const common_1 = __webpack_require__(3);
const jwt_middleware_1 = __webpack_require__(14);
const paginationdata_controller_1 = __webpack_require__(22);
const paginationdata_service_1 = __webpack_require__(23);
const utility_service_1 = __webpack_require__(24);
const log_service_1 = __webpack_require__(27);
const pagination_processor_1 = __webpack_require__(48);
const bull_1 = __webpack_require__(34);
const config_1 = __webpack_require__(9);
const paginate_service_1 = __webpack_require__(35);
const kafka_module_1 = __webpack_require__(49);
const shared_module_1 = __webpack_require__(50);
const case_admin_middleware_1 = __webpack_require__(51);
const filedelete_process_1 = __webpack_require__(52);
let PaginationdataModule = class PaginationdataModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(paginationdata_controller_1.PaginationdataController),
            consumer
                .apply(case_admin_middleware_1.CaseAdminMiddleware)
                .forRoutes({ path: 'paginationdata/getpagination', method: common_1.RequestMethod.ALL });
        ;
    }
};
exports.PaginationdataModule = PaginationdataModule;
exports.PaginationdataModule = PaginationdataModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule, kafka_module_1.KafkaModule.register('etabella-pagination', 'pagination-group'),
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
                name: 'pagination-queue',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            })],
        controllers: [paginationdata_controller_1.PaginationdataController],
        providers: [paginationdata_service_1.PaginationdataService, utility_service_1.UtilityService, log_service_1.LogService, pagination_processor_1.paginationProcessor, paginate_service_1.PaginateService, filedelete_process_1.DeleteProcessor]
    })
], PaginationdataModule);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(15);
const redis_db_service_1 = __webpack_require__(16);
const config_1 = __webpack_require__(9);
const db_service_1 = __webpack_require__(19);
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
/* 15 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 16 */
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
const ioredis_1 = __webpack_require__(17);
const ioredis_2 = __webpack_require__(18);
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
/* 17 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

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
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(20);
const query_builder_service_1 = __webpack_require__(21);
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
/* 20 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 21 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginationdataController = void 0;
const common_1 = __webpack_require__(3);
const paginationdata_service_1 = __webpack_require__(23);
const pagination_interface_1 = __webpack_require__(43);
const swagger_1 = __webpack_require__(44);
let PaginationdataController = class PaginationdataController {
    constructor(paginationService) {
        this.paginationService = paginationService;
    }
    async getPagination(query) {
        return await this.paginationService.getPagination(query);
    }
    async generatePagination(body) {
        return await this.paginationService.getPaginationData(body);
    }
    async genPaginationFile(body) {
        return await this.paginationService.getNonpaginatedData(body);
    }
    async stopPagination(body) {
        return await this.paginationService.stopPaginationData(body);
    }
};
exports.PaginationdataController = PaginationdataController;
__decorate([
    (0, common_1.Get)('getpagination'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof pagination_interface_1.getpaginationReq !== "undefined" && pagination_interface_1.getpaginationReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], PaginationdataController.prototype, "getPagination", null);
__decorate([
    (0, common_1.Post)('pagination'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof pagination_interface_1.paginationReq !== "undefined" && pagination_interface_1.paginationReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], PaginationdataController.prototype, "generatePagination", null);
__decorate([
    (0, common_1.Post)('paginationNonPaginated'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof pagination_interface_1.paginationFileReq !== "undefined" && pagination_interface_1.paginationFileReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], PaginationdataController.prototype, "genPaginationFile", null);
__decorate([
    (0, common_1.Post)('stoppagination'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof pagination_interface_1.stoppaginationReq !== "undefined" && pagination_interface_1.stoppaginationReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], PaginationdataController.prototype, "stopPagination", null);
exports.PaginationdataController = PaginationdataController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('paginationdata'),
    (0, common_1.Controller)('paginationdata'),
    __metadata("design:paramtypes", [typeof (_a = typeof paginationdata_service_1.PaginationdataService !== "undefined" && paginationdata_service_1.PaginationdataService) === "function" ? _a : Object])
], PaginationdataController);


/***/ }),
/* 23 */
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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginationdataService = void 0;
const db_service_1 = __webpack_require__(19);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(24);
const config_1 = __webpack_require__(9);
const log_service_1 = __webpack_require__(27);
const bull_1 = __webpack_require__(33);
const bull_2 = __webpack_require__(34);
const paginate_service_1 = __webpack_require__(35);
const { spawn } = __webpack_require__(36);
let PaginationdataService = class PaginationdataService {
    constructor(db, utility, configService, logService, paginationQueue, paginate) {
        this.db = db;
        this.utility = utility;
        this.configService = configService;
        this.logService = logService;
        this.paginationQueue = paginationQueue;
        this.paginate = paginate;
        this.logApp = 'pagination';
        this.paginationQueue.on('completed', (job) => {
            console.log(`Job with ID ${job.id} has completed`);
        });
        this.paginationQueue.on('failed', (job, err) => {
            console.log(`Job with ID ${job.id} failed with error: ${err.message}`);
        });
        this.paginationQueue.on('stalled', (job) => {
            console.log(`Job with ID ${job.id} stalled`);
        });
        this.paginationQueue.on('waiting', (jobId) => {
            console.log(`Job with ID ${jobId} is waiting to be processed`);
        });
        this.paginationQueue.on('active', (job, jobPromise) => {
            console.log(`Job with ID ${job.id} has started processing`);
        });
        this.paginationQueue.on('paused', () => {
            console.log('The queue has been paused');
        });
        this.paginationQueue.on('resumed', () => {
            console.log('The queue has been resumed');
        });
        this.paginationQueue.on('removed', (job) => {
            console.log(`Job with ID ${job.id} has been removed from the queue`);
        });
        this.paginationQueue.on('delayed', (jobId) => {
            console.log(`Job with ID ${jobId} is delayed`);
        });
        this.paginationQueue.on('drained', () => {
            console.log('The queue has been drained (no more jobs to process)');
        });
        this.paginationQueue.on('error', (error) => {
            console.error('An error occurred in the queue:', error);
        });
    }
    async getPagination(query) {
        console.log('getPagination ', this.paginate.paginationProcess);
        let ind = this.paginate.paginationProcess.findIndex(e => e.nCaseid === query.nCaseid && e["isProcess"] === true);
        console.log('getPagination index', ind);
        if (ind > -1) {
            query.nPtaskid = this.paginate.paginationProcess[ind].nPtaskid;
            let res = await this.db.executeRef('pagination_getdata', query);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        else {
            return { msg: 0, value: 'No Pagination in process' };
        }
    }
    async getPaginationData(body) {
        console.log('getPaginationData ', this.paginate.paginationProcess);
        this.logService.info(`Pagination request with params ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp);
        let res = await this.db.executeRef(body.bIslater ? 'pagination_generate_prefix' : 'pagination_generatedata', body);
        console.log('GEN DATA ', this.paginate.paginationProcess);
        try {
            this.logService.info(`pagination_generatedata DB Function responce with  result ${res.success} by user ${body.nMasterid}`, this.logApp);
            if (res.success) {
                try {
                    this.logService.info(`Call local function processPaginationData by user ${body.nMasterid}`, this.logApp);
                    const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res.data[0][0];
                    if (jsonData && jsonData.length == 0) {
                        return { msg: -1, value: 'No File found for Pagination' };
                    }
                    else if (jsonData.length > 0) {
                        await this.paginationQueue.add('PAGINATION', { res: { jsonData, nCaseid, nPtaskid, jUsers, nLogid }, body }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                    }
                    this.logService.info(`Responce processPaginationData by user ${body.nMasterid}`, this.logApp);
                    return { msg: 1, value: 'File Pagination in process' };
                }
                catch (error) {
                    return { msg: -1, value: 'Failed to fetch', error: error };
                }
            }
            else {
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (e) {
            console.log("error", e);
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getNonpaginatedData(body) {
        this.logService.info(`Pagination request with params ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp);
        let res = await this.db.executeRef('pagination_nonpaginate_filedata', body);
        try {
            this.logService.info(`pagination_generatedata DB Function responce with  result ${res.success} by user ${body.nMasterid}`, this.logApp);
            if (res.success) {
                if (res.data[0][0]?.msg == 1) {
                    try {
                        this.logService.info(`Call local function processPaginationData by user ${body.nMasterid}`, this.logApp);
                        const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res.data[0][0];
                        if (jsonData && jsonData.length == 0) {
                            return { msg: -1, value: 'No File found for Pagination' };
                        }
                        else if (jsonData.length > 0) {
                            await this.paginationQueue.add('PAGINATION', { res: { jsonData, nCaseid, nPtaskid, jUsers, nLogid }, body }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                        }
                        this.logService.info(`Responce processPaginationData by user ${body.nMasterid}`, this.logApp);
                        return { msg: 1, value: 'File Pagination in process' };
                    }
                    catch (error) {
                        return { msg: -1, value: 'Failed to fetch', error: error };
                    }
                }
                else {
                    return { msg: -1, value: res.data[0][0]?.value || 'Failed to fetch', error: res.error };
                }
            }
            else {
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (e) {
            console.log("error", e);
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async stopPaginationData(body) {
        this.paginate.update_final(body.nPtaskid, body.nMasterid, 'S');
        this.paginate.paginationProcess.filter(e => e.nPtaskid === body.nPtaskid).map(e => e["isProcess"] = false);
        return { msg: 1, value: 'File Pagination in process' };
    }
};
exports.PaginationdataService = PaginationdataService;
exports.PaginationdataService = PaginationdataService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_2.InjectQueue)('pagination-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object, typeof (_f = typeof paginate_service_1.PaginateService !== "undefined" && paginate_service_1.PaginateService) === "function" ? _f : Object])
], PaginationdataService);


/***/ }),
/* 24 */
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
const kafka_shared_service_1 = __webpack_require__(25);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'pagination-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


/***/ }),
/* 25 */
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
const microservices_1 = __webpack_require__(26);
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
/* 26 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 27 */
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
const winston_1 = __webpack_require__(28);
const nest_winston_1 = __webpack_require__(29);
const winston = __webpack_require__(28);
const fs = __webpack_require__(30);
const path = __webpack_require__(31);
const moment = __webpack_require__(32);
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
/* 28 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

/***/ }),
/* 35 */
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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PaginateService = void 0;
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(24);
const config_1 = __webpack_require__(9);
const log_service_1 = __webpack_require__(27);
const db_service_1 = __webpack_require__(19);
const fs_1 = __webpack_require__(30);
const { spawn } = __webpack_require__(36);
const async = __webpack_require__(37);
const path = __webpack_require__(31);
const client_s3_1 = __webpack_require__(38);
const stream_1 = __webpack_require__(39);
const https_1 = __webpack_require__(40);
const node_http_handler_1 = __webpack_require__(41);
const bull_1 = __webpack_require__(34);
const bull_2 = __webpack_require__(33);
const util_1 = __webpack_require__(42);
const child_process_1 = __webpack_require__(36);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
let PaginateService = class PaginateService {
    constructor(db, utility, configService, logService, deletefileQueue) {
        this.db = db;
        this.utility = utility;
        this.configService = configService;
        this.logService = logService;
        this.deletefileQueue = deletefileQueue;
        this.logApp = 'pagination';
        this.paginationProcess = [];
        this.ptaskProcess = [];
        this.editfilepath = this.configService.get('PY_PAGINATION');
        this.catchFile = this.configService.get('PY_FILE_CATCH');
        this.pythonV = this.configService.get('pythonV');
        this.DO_SPACES_BUCKET_NAME = this.configService.get('DO_SPACES_BUCKET_NAME');
        this.ASSETS_PATH = this.configService.get('S3_SYNC_PATH');
        this.S3_BUCKET_PATH = this.configService.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.configService.get('S3_EXC_PATH');
        this.s3_SPACES_ENDPOINT = this.configService.get('DO_SPACES_ENDPOINT');
        const agent = new https_1.Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new client_s3_1.S3Client({
            region: 'sgp1',
            endpoint: this.configService.get('DO_SPACES_ENDPOINT'),
            credentials: {
                accessKeyId: this.configService.get('DO_SPACES_KEY'),
                secretAccessKey: this.configService.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5,
            retryMode: 'standard',
            forcePathStyle: this.configService.get('DO_S3') == 'MINIO',
            requestHandler: new node_http_handler_1.NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000,
                socketTimeout: 60000,
            }),
        });
    }
    async processPaginationData(res, body) {
        return new Promise(async (resolve, reject) => {
            try {
                await fs_1.promises.mkdir(this.configService.get('ASSETS') + 'temp', { recursive: true });
                console.log(`Directory created or already exists `);
            }
            catch (error) {
                console.error(`Failed to create directory: ${error.message}`);
            }
            const { jsonData, nCaseid, nPtaskid, jUsers, nLogid } = res;
            this.logService.info(`Pagination start with data length ${jsonData?.length} by user ${body.nMasterid}`, this.logApp);
            try {
                if (!this.paginationProcess.find(e => e.nCaseid === nCaseid && e["isProcess"] === true)) {
                    this.logService.info(`Already Pagination data not  found for selected case by user ${body.nMasterid}`, this.logApp);
                    this.paginationProcess.push({ "nPtaskid": nPtaskid, "isProcess": true, nCaseid: nCaseid, jsonData: jsonData, jUsers: jUsers, nLogid: nLogid });
                    this.logService.info(`Pagination data added in queue by user ${body.nMasterid}`, this.logApp);
                    this.processJsonData(this.paginationProcess.find(e => e.nPtaskid === nPtaskid)["jsonData"], nPtaskid, body.nMasterid, nLogid, nCaseid)
                        .then(() => {
                        try {
                        }
                        catch (error) {
                        }
                        resolve(true);
                    })
                        .catch((error) => {
                        try {
                            var ind = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                            this.paginationProcess.splice(ind, 1);
                            this.logService.error(`Pagination Failed with error ${error} by user ${body.nMasterid}`, this.logApp);
                        }
                        catch (error) {
                        }
                        resolve(false);
                    });
                }
                else {
                    this.logService.info(`Already Pagination data length found for selected case by user ${body.nMasterid}`, this.logApp);
                    this.logService.info(`Pagination data added in queue by user ${body.nMasterid}`, this.logApp);
                    this.paginationProcess.filter(e => e["isProcess"] === true && e.nCaseid === nCaseid).map(e => {
                        jsonData.map(x => { x["nNPtaskid"] = nPtaskid, x["nLogid"] = nLogid; });
                        Array.prototype.splice.apply(e.jsonData, [e.jsonData.length, 0].concat(jsonData));
                        this.add_inqueue(nPtaskid, e.nPtaskid);
                    });
                    resolve(true);
                }
            }
            catch (e) {
                resolve(false);
                this.logService.error(`Pagination Failed with error ${e} by user ${body.nMasterid}`, this.logApp);
                console.log("error", e);
            }
        });
    }
    add_inqueue(nPtaskid, nQPtaskid) {
        let res = this.db.executeRef('pagination_add_queue', { nPtaskid: nPtaskid, nQPtaskid: nQPtaskid });
    }
    async processJsonData(jsonData, nPtaskid, nMasterid, nLogid, nCaseid) {
        try {
            let logApp = `${this.logApp}/${nMasterid}/${nPtaskid}`;
            this.ptaskProcess.push({ t: nPtaskid, c: nCaseid, S: false });
            this.downloadfile(nPtaskid, nMasterid, nLogid, jsonData, logApp);
        }
        catch (error) {
        }
        return true;
    }
    async purgeCdnCache(fileKey, nID, logApp) {
        spawn(this.pythonV, [this.editfilepath, fileKey]);
    }
    async downloadfile(nPtaskid, nMasterid, nLogid, jsonData, logApp) {
        let isCancelled = false;
        this.logService.log(`DOWNLOAD FILE METHOD  : ${nPtaskid}`, logApp);
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${nPtaskid}`);
        const copyfileProcess = async.queue(async (job, done) => {
            const { nID, cPath } = job.element;
            const { tempFilePath, originalFileName, sessionFolder, nPtaskid } = job;
            if (isCancelled) {
                console.log('Skipping stream processing due to cancellation');
                let int = this.paginationProcess.findIndex(e => e.nPtaskid == nPtaskid);
                if (int != -1) {
                    this.paginationProcess.splice(int, 1);
                }
                (0, fs_1.rm)(sessionFolder, { recursive: true }, (err) => {
                    if (err) {
                        console.error(`Error removing session folder: ${sessionFolder}`);
                    }
                });
                return;
            }
            this.logService.log(`Upload Start: ${nID}`, logApp);
            const copyCommand = `${this.S3_EXC_PATH} sync ${sessionFolder}/${originalFileName} ${this.S3_BUCKET_PATH}${cPath}`;
            try {
                await execPromise(copyCommand);
                this.logService.log(`Upload success: ${nID}`, logApp);
            }
            catch (error) {
                console.error(error);
                this.logService.error(`Upload error: ${error.message}`, logApp);
            }
            const lastVersion = await this.removeOldVersion(cPath);
            this.logService.log(`update progress C : ${nID}`, logApp);
            this.update_progress(nPtaskid, nMasterid, nLogid, job.element, 'C', lastVersion);
            await this.deletefileQueue.add('FILEDELETE', { tempFilePath: `${sessionFolder}/${originalFileName}`, nID, logApp });
            const obj = jsonData.find(a => a.nID === nID);
            if (obj) {
                obj['isUpload'] = true;
            }
            this.logService.log(`Upload END: ${nID} REMAIN ${jsonData && jsonData.length ? jsonData.filter(a => !a.isUpload).length : 0}`, logApp);
            if (!jsonData || !jsonData.filter(a => !a.isUpload).length) {
                console.log('ALL FILE Uploaded');
                this.logService.log(`ALL FILE Uploaded`, logApp);
                (0, fs_1.rm)(sessionFolder, { recursive: true }, (err) => {
                    if (err) {
                        console.error(`Error removing session folder: ${sessionFolder}`);
                    }
                });
            }
        }, 3);
        copyfileProcess.drain((job) => {
        });
        const paginationTask = async.queue(async (job, done) => {
            const { nID } = job.element;
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                    if (int !== -1) {
                        this.paginationProcess.splice(int, 1);
                    }
                    return;
                }
                this.logService.log(`PAGINATION START: ${nID} REMAIN ASYNC QUEUE: ${paginationTask?.length()}`, logApp);
                try {
                    console.log('PAGINATION FILE');
                    const { tempFilePath, originalFileName, sessionFolder, nPtaskid } = job;
                    const element = jsonData.find(a => a.nID === nID);
                    const index = jsonData.findIndex(a => a.nID === nID);
                    if (this.paginationProcess.find(e => e.nPtaskid === nPtaskid && e["isProcess"] === false)) {
                        isCancelled = true;
                    }
                    let flag = await this.editFile(element, tempFilePath, `${sessionFolder}/${originalFileName}`, logApp);
                    const obj = jsonData.find(a => a.nID === nID);
                    if (obj) {
                        obj['isPaginate'] = true;
                    }
                    this.logService.log(`PAGINATION END: ${nID} with STATUS ${flag} REMAIN ASYNC QUEUE: ${jsonData && jsonData.length ? jsonData.filter(a => !a.isPaginate).length : 0}`, logApp);
                    if (flag) {
                        this.deletefileQueue.add('FILEDELETE', { tempFilePath, nID, logApp });
                        copyfileProcess.push(job);
                    }
                    else {
                        if (obj) {
                            obj['isUpload'] = true;
                        }
                        this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F');
                        this.deletefileQueue.add('FILEDELETE', { tempFilePath, nID, logApp });
                    }
                }
                catch (error) {
                }
            }
            catch (error) {
                this.logService.error(`STREAM ERROR: ${nID} ${error?.message}`, logApp);
            }
        }, 3);
        paginationTask.drain(() => {
        });
        const downloadQueue = async.queue(async (job, done) => {
            const { s3Params, tempFilePath, originalFileName, nPtaskid } = job;
            const { nID } = job.element;
            const element = jsonData.find(a => a.nID === nID);
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                    if (int !== -1) {
                        this.paginationProcess.splice(int, 1);
                    }
                    return;
                }
                console.log(`DOWNLOAD START:`);
                if (this.paginationProcess.find(e => e.nPtaskid === nPtaskid && e["isProcess"] === false)) {
                    isCancelled = true;
                }
                try {
                    this.logService.log(`DOWNLOAD START ${nID}  ${tempFilePath}`, logApp);
                    console.log(`\n Params `, s3Params);
                    const getCommand = new client_s3_1.GetObjectCommand(s3Params);
                    const { Body } = await this.s3Client.send(getCommand);
                    if (Body instanceof stream_1.Readable) {
                        console.log(`\n\rReadStream found for `);
                        const writeStream = (0, fs_1.createWriteStream)(tempFilePath);
                        Body.pipe(writeStream);
                        await new Promise((resolve, reject) => {
                            writeStream.on('finish', resolve);
                            writeStream.on('error', (err) => {
                                console.error('ERROR ', err);
                                reject(err);
                            });
                        });
                        console.log(`File downloaded: ${tempFilePath}`);
                        this.logService.log(`DOWNLOAD COMPLETE ${nID} ${tempFilePath}`, logApp);
                        this.logService.log(`ON COMPLETE PUSH TO PAGINATION: ${nID} `, logApp);
                        paginationTask.push(job);
                    }
                }
                catch (error) {
                    this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F');
                    this.logService.error(`Error downloading file  ${nID}  ${originalFileName}: ${error.message}`, logApp);
                    console.error(`Error downloading file ${originalFileName}: ${error.message}`);
                }
            }
            catch (error) {
                this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F');
                this.logService.error(`Error downloading file  ${job?.nID}  ${job?.originalFileName}: ${error.message}`, logApp);
                console.log(error);
            }
        }, 2);
        if (!(0, fs_1.existsSync)(sessionFolder)) {
            (0, fs_1.mkdirSync)(sessionFolder, { recursive: true });
        }
        for (const [index, element] of jsonData.entries()) {
            this.logService.info(`Pagination start from queue ${index}/${jsonData.length} file path ${JSON.stringify(element)} for ${nMasterid}`, logApp);
            const fileName = element.cPath.substring(element.cPath.lastIndexOf('/') + 1);
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, element.nID + '-' + fileName);
            try {
                if (element.cFVer && element.cFVer != 'null') {
                    element.cFVer = await this.getFirstVersion(element.cPath);
                    try {
                        this.db.executeRef('upload_update_fver', { cFVer: element.cFVer, nBundledetailid: element.nID });
                    }
                    catch (error) { }
                }
            }
            catch (error) {
            }
            console.log('element', element);
            const s3Params = {
                Bucket: this.configService.get('DO_SPACES_BUCKET_NAME'),
                Key: element.cPath,
                VersionId: element.cFVer || 'null'
            };
            console.log('s3Params param for download', JSON.stringify(s3Params));
            if (!element.cTab || element.cTab === '') {
                element['isUpload'] = true;
                this.update_progress(nPtaskid, nMasterid, nLogid, element, 'F');
            }
            else {
                downloadQueue.push({ nPtaskid, nMasterid, nLogid, element, s3Params, originalFileName, tempFilePath, sessionFolder });
            }
        }
    }
    async getFirstVersion(fileKey) {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey} ${getVersionCommand}`);
            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);
            if (response.Versions && response.Versions.length > 0) {
                const sortedVersions = response.Versions.sort((a, b) => new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime());
                const firstVersion = sortedVersions[0];
                console.log(`🆔 First File Version ID: ${firstVersion.VersionId}`);
                this.logService.info(`First File Version ID: ${firstVersion.VersionId}`, this.logApp);
                return firstVersion.VersionId;
            }
            else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                return null;
            }
        }
        catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
        }
        return null;
    }
    async editFile(jsonData, input, output, logApp) {
        return new Promise((resolve, reject) => {
            this.logService.info(`Push to python file`, logApp);
            jsonData['input'] = input;
            jsonData['output'] = output;
            console.log('Input output files - ', input, output);
            const pythonProcess = spawn(this.pythonV, [this.editfilepath, JSON.stringify(jsonData), logApp]);
            pythonProcess.stdout.on("data", (data) => {
                this.logService.info(`Responce to python file success ${data.toString().trim()}`, logApp);
            });
            pythonProcess.stderr.on("data", (data) => {
                this.logService.info(`Responce to python file error ${data.toString().trim()}`, logApp);
                console.log(data.toString().trim());
            });
            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    this.logService.info(`Responce to python file close with code ${code} success`, logApp);
                    console.log('step 3 res', code.toString().trim());
                    resolve(true);
                }
                else {
                    this.logService.info(`Responce to python file close with code ${code} failed`, logApp);
                    resolve(false);
                }
            });
        });
    }
    async update_progress(nPtaskid, nMasterid, nLogid, mdl, flag, lastVersion) {
        console.log('UPDATING PROGRESS', flag);
        try {
            let res = await this.db.executeRef('pagination_update_progress', { nMasterid: nMasterid, nPtaskid: nPtaskid, nQPtaskid: (mdl["nNPtaskid"] ? mdl["nNPtaskid"] : null), nID: mdl.nID, cStatus: flag, isComplete: false, cRefpage: mdl["cRefpage"], cLVer: lastVersion });
            if (res.data && res.data.length) {
                let data = res.data[0];
                var obj = {
                    nID: mdl.nID,
                    nPtaskid: nPtaskid,
                    nNPtaskid: mdl["nNPtaskid"],
                    comp_progres: data[0]["comp_progres"],
                    total_prog: data[0]["total_prog"],
                    cType: 'P',
                    cRefpage: mdl["cRefpage"],
                    jPagination: mdl["jPagination"],
                    cStatus: data[0]["cStatus"],
                    nCaseid: data[0]["nCaseid"],
                };
                if (data[0]["comp_progres"] === data[0]["total_prog"]) {
                    this.update_final(nPtaskid, nMasterid, 'C');
                    let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                    this.paginationProcess.splice(int, 1);
                }
                if (data[0]["cStatus"] === 'S') {
                    console.log('Stop pagination -', nPtaskid);
                    let int = this.paginationProcess.findIndex(e => e.nPtaskid === nPtaskid);
                    if (int > -1)
                        this.paginationProcess[int]["isProcess"] = false;
                }
                for (let user of data[0].jUsers) {
                    this.utility.emit({ event: 'PAGINATION-PROGRESS', data: { identifier: '', nMasterid: user, data: obj } });
                }
            }
            const data = { nPtaskid: nPtaskid, nNPtaskid: mdl["nNPtaskid"], nLogid: mdl["nLogid"] ? mdl["nLogid"] : nLogid, cStatus: flag, "nBundledetailid": mdl.nID };
            this.insertLog(nMasterid, data, flag);
            return res.data[0];
        }
        catch (error) {
            console.error(error);
        }
    }
    async update_final(nPtaskid, nMasterid, flag) {
        let res = await this.db.executeRef('pagination_update_progress', { nPtaskid: nPtaskid, cStatus: flag, isComplete: flag === 'S' ? false : true, isStop: flag === 'S' ? true : false });
        if (res.data && res.data.length) {
            let data = res.data[0];
            try {
                var obj = {
                    rec_type: 'PAGINATION-PROGRESS',
                    nPtaskid: nPtaskid,
                    cType: 'F',
                    cStatus: data[0]["cStatus"],
                    nUserid: nMasterid,
                    nCaseid: data[0]["nCaseid"],
                };
                for (let user of data[0].jUsers) {
                    this.utility.emit({ event: 'PAGINATION-PROGRESS', data: { identifier: '', nMasterid: user, data: obj } });
                }
                this.sendNotification(data[0]["nCaseid"], nMasterid, true);
                let int = this.paginationProcess.findIndex(e => e.nPtaskid == nPtaskid);
                this.paginationProcess.splice(int, 1);
            }
            catch (error) {
                console.log('final PAGINATION-PROGRESS', error);
            }
        }
    }
    async insertLog(nMasterid, data, flag, jOther) {
        let origin = this.configService.get('ORIGIN');
        data = data ? data : {};
        data['O'] = origin;
        try {
            const log_data = {
                "nLCatid": flag === 'C' ? 54 : 53,
                "nMasterid": nMasterid,
                "jData": data,
            };
            await this.db.executeRef('log_insert', log_data);
        }
        catch (error) {
        }
    }
    async sendNotification(nCaseid, nMasterid, status) {
        if (!nCaseid)
            return;
        this.logService.info(`Notification send for ${nCaseid}`, `pagination/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `Pagination ${status ? 'successful' : 'failed'} `;
                    a.cMsg = `Pagination ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
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
    async removeOldVersion(s3Path) {
        try {
            console.log('Fetching veriosn', s3Path);
            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, this.logApp);
                return;
            }
            const sortedVersions = await this.getAllVersion(s3Path);
            const versions = sortedVersions.filter(e => !e.IsLatest).map(e => e.VersionId);
            console.log(`🆔 File Version ID: ${versions}`);
            this.logService.info(`File Version ID: ${versions}`, this.logApp);
            if (!versions || !versions.length) {
                this.logService.error(`${s3Path} version not found`, this.logApp);
                return;
            }
            console.log('versions', versions);
            versions.forEach((element, index) => {
                if (versions.length != (index + 1)) {
                    this.deleteSpecificVersion(element, s3Path);
                }
            });
            return sortedVersions.filter(e => e.IsLatest).map(e => e.VersionId)[0];
        }
        catch (error) {
        }
    }
    async deleteSpecificVersion(versionId, s3Path) {
        try {
            const deleteCommand = new client_s3_1.DeleteObjectCommand({
                Bucket: this.DO_SPACES_BUCKET_NAME,
                Key: s3Path,
                VersionId: versionId
            });
            const response = await this.s3Client.send(deleteCommand);
            console.log(`Version ${versionId} deleted successfully!`);
            return response;
        }
        catch (error) {
            console.error('Error deleting version:', error);
            throw error;
        }
    }
    async getAllVersion(fileKey) {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey}`);
            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);
            if (response.Versions && response.Versions.length > 0) {
                const sortedVersions = response.Versions;
                return sortedVersions;
            }
            else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                return null;
            }
        }
        catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
        }
        return null;
    }
};
exports.PaginateService = PaginateService;
exports.PaginateService = PaginateService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_1.InjectQueue)('pagination-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _e : Object])
], PaginateService);


/***/ }),
/* 36 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 37 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("stream");

/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("@aws-sdk/node-http-handler");

/***/ }),
/* 42 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 43 */
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
exports.stoppaginationReq = exports.paginationRes = exports.paginationFileReq = exports.paginationReq = exports.getpaginationReq = exports.jPaginationobj = void 0;
const swagger_1 = __webpack_require__(44);
const class_validator_1 = __webpack_require__(45);
const is_uuid_nullable_decorator_1 = __webpack_require__(46);
class jPaginationobj {
}
exports.jPaginationobj = jPaginationobj;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#fff', description: 'Background color' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jPaginationobj.prototype, "bc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '#000', description: 'Font color' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jPaginationobj.prototype, "fc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '16', description: 'Font size' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jPaginationobj.prototype, "fs", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'arial', description: 'Font type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jPaginationobj.prototype, "ft", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Hide pagination' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], jPaginationobj.prototype, "isHide", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BR', description: 'Position of pagination' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jPaginationobj.prototype, "position", void 0);
class getpaginationReq {
}
exports.getpaginationReq = getpaginationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getpaginationReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getpaginationReq.prototype, "nPtaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getpaginationReq.prototype, "nMasterid", void 0);
class paginationReq {
}
exports.paginationReq = paginationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1-1', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof String !== "undefined" && String) === "function" ? _a : Object)
], paginationReq.prototype, "cRefpage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: { "bc": "#fff", "fc": "#000", "fs": "16", "ft": "arial", "isHide": false, "position": "BR" }, description: '', required: false }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], paginationReq.prototype, "jPagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'is apply to all', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], paginationReq.prototype, "bApplyall", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'is cover page', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], paginationReq.prototype, "bPagedefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'is cover page', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], paginationReq.prototype, "bIslater", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1-1', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_b = typeof String !== "undefined" && String) === "function" ? _b : Object)
], paginationReq.prototype, "cStartPrefix", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationReq.prototype, "nMasterid", void 0);
class paginationFileReq {
}
exports.paginationFileReq = paginationFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationFileReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationFileReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], paginationFileReq.prototype, "nMasterid", void 0);
class paginationRes {
}
exports.paginationRes = paginationRes;
class stoppaginationReq {
}
exports.stoppaginationReq = stoppaginationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "a1b2c3d4-e5f6-7890-abcd-1234567890ab", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], stoppaginationReq.prototype, "nPtaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], stoppaginationReq.prototype, "nMasterid", void 0);


/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 45 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(47);
const class_validator_1 = __webpack_require__(45);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 47 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 48 */
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
exports.paginationProcessor = void 0;
const bull_1 = __webpack_require__(34);
const bull_2 = __webpack_require__(33);
const config_1 = __webpack_require__(9);
const paginate_service_1 = __webpack_require__(35);
let paginationProcessor = class paginationProcessor {
    constructor(config, paginate) {
        this.config = config;
        this.paginate = paginate;
    }
    async handlePagination(job) {
        try {
            await this.paginate.processPaginationData(job.data.res, job.data.body);
        }
        catch (error) {
        }
    }
};
exports.paginationProcessor = paginationProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'PAGINATION', concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], paginationProcessor.prototype, "handlePagination", null);
exports.paginationProcessor = paginationProcessor = __decorate([
    (0, bull_1.Processor)('pagination-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof paginate_service_1.PaginateService !== "undefined" && paginate_service_1.PaginateService) === "function" ? _b : Object])
], paginationProcessor);


/***/ }),
/* 49 */
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
const microservices_1 = __webpack_require__(26);
const kafka_shared_service_1 = __webpack_require__(25);
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
/* 50 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SharedModule = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(19);
const query_builder_service_1 = __webpack_require__(21);
const ioredis_1 = __webpack_require__(18);
const redis_db_service_1 = __webpack_require__(16);
const config_1 = __webpack_require__(9);
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
        ],
        controllers: [],
        providers: [db_service_1.DbService, query_builder_service_1.QueryBuilderService, redis_db_service_1.RedisDbService],
        exports: [db_service_1.DbService, redis_db_service_1.RedisDbService]
    })
], SharedModule);


/***/ }),
/* 51 */
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
exports.CaseAdminMiddleware = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(19);
let CaseAdminMiddleware = class CaseAdminMiddleware {
    constructor(db) {
        this.db = db;
        this.body = ['POST', 'PUT', 'DELETE'];
        this.query = ['GET'];
        this.getParams = (req) => {
            if (this.body.includes(req.method))
                return req.body;
            else
                return req.query;
        };
    }
    async use(req, res, next) {
        const mdl = this.getParams(req);
        const nCaseid = mdl['nCaseid'], nMasterid = mdl['nMasterid'], isAdmin = req['isAdmin'];
        if (!isAdmin) {
            const lng = await this.db.rowQuery(`SELECT 1 FROM "TeamRelation" where "nCaseid" = '${nCaseid}' and "nUserid" = '${nMasterid}' and "nRoleid" = '8632ee5c-e854-411c-b83d-c21656ad39ac'`);
            if (!lng?.success || !lng?.data?.length) {
                return res.status(403).json({ message: 'Case Admin rights required' });
            }
        }
        next();
    }
};
exports.CaseAdminMiddleware = CaseAdminMiddleware;
exports.CaseAdminMiddleware = CaseAdminMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], CaseAdminMiddleware);


/***/ }),
/* 52 */
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
exports.DeleteProcessor = void 0;
const log_service_1 = __webpack_require__(27);
const bull_1 = __webpack_require__(34);
const bull_2 = __webpack_require__(33);
const fs = __webpack_require__(30);
let DeleteProcessor = class DeleteProcessor {
    constructor(logService) {
        this.logService = logService;
    }
    async handleDelete(job) {
        const { tempFilePath, nID, logApp } = job.data;
        try {
            fs.unlink(tempFilePath, (err) => {
                if (err) {
                    this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nID} . ${err?.message}`, logApp);
                    console.error(`Failed to delete temp file: ${tempFilePath}`);
                }
                else {
                    this.logService.warn(`FILE DELETED ${tempFilePath}  ${nID}`, logApp);
                }
            });
        }
        catch (error) {
            this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nID} . ${error.message}`, logApp);
            console.error(`Error deleting temp file: ${tempFilePath}. ${error.message}`);
        }
    }
};
exports.DeleteProcessor = DeleteProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'FILEDELETE', concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DeleteProcessor.prototype, "handleDelete", null);
exports.DeleteProcessor = DeleteProcessor = __decorate([
    (0, bull_1.Processor)('pagination-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object])
], DeleteProcessor);


/***/ }),
/* 53 */
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
const nest_winston_1 = __webpack_require__(29);
const winston = __webpack_require__(28);
const fs = __webpack_require__(30);
const path = __webpack_require__(31);
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
/* 54 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(26);
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
/* 55 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 57 */
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
/* 58 */
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
const pagination_module_1 = __webpack_require__(2);
const kafka_config_1 = __webpack_require__(54);
const compression = __webpack_require__(55);
const cookieParser = __webpack_require__(56);
const swagger_1 = __webpack_require__(44);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(57);
const config_1 = __webpack_require__(9);
const dotenv = __webpack_require__(58);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(pagination_module_1.PaginationModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('pagination-group'));
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
        .setTitle('Etabella Pagination API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/pagination' : '')
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
    console.log('\n\r\n\r\n\r PORT_PAGINATIONAPI: ', configService.get('PORT_PAGINATIONAPI'), '\n\r\n\r\n\r');
    await app.listen(configService.get('PORT_PAGINATIONAPI'));
}
bootstrap();

})();

/******/ })()
;