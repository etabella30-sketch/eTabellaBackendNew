/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */,
/* 1 */
/***/ ((module) => {

module.exports = require("@nestjs/core");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

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
/* 5 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(9);
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
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexModule = void 0;
const global_1 = __webpack_require__(12);
const common_1 = __webpack_require__(3);
const indexapi_controller_1 = __webpack_require__(18);
const indexapi_service_1 = __webpack_require__(19);
const generateindex_module_1 = __webpack_require__(20);
const batch_module_1 = __webpack_require__(64);
const bull_1 = __webpack_require__(38);
const config_1 = __webpack_require__(10);
const winston_module_1 = __webpack_require__(70);
const kafka_module_1 = __webpack_require__(53);
let IndexModule = class IndexModule {
};
exports.IndexModule = IndexModule;
exports.IndexModule = IndexModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule, IndexModule,
            kafka_module_1.KafkaModule.register('etabella-indexapi', 'indexapi-group'),
            generateindex_module_1.GenerateindexModule, batch_module_1.BatchModule,
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
                name: 'indexgenerate-download',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }),
            winston_module_1.WinstonConfigModule.forRoot('indexing')],
        controllers: [indexapi_controller_1.IndexapiController],
        providers: [indexapi_service_1.IndexapiService],
    })
], IndexModule);


/***/ }),
/* 12 */
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
__exportStar(__webpack_require__(13), exports);
__exportStar(__webpack_require__(14), exports);


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
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(14);
const config_1 = __webpack_require__(10);
const scheduler_service_1 = __webpack_require__(15);
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
/* 14 */
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
/* 15 */
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
const moment = __webpack_require__(16);
const schedule = __webpack_require__(17);
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
/* 16 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 18 */
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
exports.IndexapiController = void 0;
const common_1 = __webpack_require__(3);
const indexapi_service_1 = __webpack_require__(19);
let IndexapiController = class IndexapiController {
    constructor(indexService) {
        this.indexService = indexService;
    }
};
exports.IndexapiController = IndexapiController;
exports.IndexapiController = IndexapiController = __decorate([
    (0, common_1.Controller)('index'),
    __metadata("design:paramtypes", [typeof (_a = typeof indexapi_service_1.IndexapiService !== "undefined" && indexapi_service_1.IndexapiService) === "function" ? _a : Object])
], IndexapiController);


/***/ }),
/* 19 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexapiService = void 0;
const common_1 = __webpack_require__(3);
let IndexapiService = class IndexapiService {
    async onModuleInit() {
    }
    getHello() {
        return 'Invalid request found!';
    }
};
exports.IndexapiService = IndexapiService;
exports.IndexapiService = IndexapiService = __decorate([
    (0, common_1.Injectable)()
], IndexapiService);


/***/ }),
/* 20 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenerateindexModule = void 0;
const common_1 = __webpack_require__(3);
const jwt_middleware_1 = __webpack_require__(21);
const generateindex_controller_1 = __webpack_require__(29);
const generateindex_service_1 = __webpack_require__(49);
const indexdata_service_1 = __webpack_require__(51);
const utility_service_1 = __webpack_require__(35);
const indexfinal_service_1 = __webpack_require__(34);
const bull_1 = __webpack_require__(38);
const config_1 = __webpack_require__(10);
const log_service_1 = __webpack_require__(39);
const event_log_service_1 = __webpack_require__(47);
const kafka_module_1 = __webpack_require__(53);
const shared_module_1 = __webpack_require__(54);
const pdf_generate_service_1 = __webpack_require__(55);
const queue_processor_1 = __webpack_require__(57);
let GenerateindexModule = class GenerateindexModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(generateindex_controller_1.GenerateindexController);
    }
};
exports.GenerateindexModule = GenerateindexModule;
exports.GenerateindexModule = GenerateindexModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule,
            kafka_module_1.KafkaModule.register('etabella-indexapi', 'indexapi-group'),
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
                name: 'indexgenerate-download',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            })],
        controllers: [generateindex_controller_1.GenerateindexController],
        providers: [generateindex_service_1.GenerateindexService, utility_service_1.UtilityService, indexdata_service_1.IndexDataService, indexfinal_service_1.IndexFinalService, config_1.ConfigService, log_service_1.LogService,
            event_log_service_1.EventLogService, pdf_generate_service_1.PdfGenerateService, queue_processor_1.QueueProcessor]
    })
], GenerateindexModule);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(22);
const redis_db_service_1 = __webpack_require__(23);
const config_1 = __webpack_require__(10);
const db_service_1 = __webpack_require__(26);
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
/* 22 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(24);
const ioredis_2 = __webpack_require__(25);
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
/* 24 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 26 */
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
const pg_1 = __webpack_require__(27);
const query_builder_service_1 = __webpack_require__(28);
const config_1 = __webpack_require__(10);
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
/* 27 */
/***/ ((module) => {

module.exports = require("pg");

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
/* 29 */
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
exports.GenerateindexController = void 0;
const common_1 = __webpack_require__(3);
const index_interface_1 = __webpack_require__(30);
const swagger_1 = __webpack_require__(2);
const indexfinal_service_1 = __webpack_require__(34);
const log_interceptor_1 = __webpack_require__(45);
const apiid_1 = __webpack_require__(48);
let GenerateindexController = class GenerateindexController {
    constructor(indexFinal) {
        this.indexFinal = indexFinal;
    }
    async getIndexData(body) {
        return await this.indexFinal.getIndexData(body);
    }
    checkMemory() {
        try {
            setInterval(() => {
                const memoryUsage = process.memoryUsage();
                console.log('Memory usage:', {
                    rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                    heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                    heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                    external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
                    arrayBuffers: (memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
                });
            }, 5000);
        }
        catch (error) {
            console.error('Error while monitoring memory:', error);
        }
    }
};
exports.GenerateindexController = GenerateindexController;
__decorate([
    (0, common_1.Post)('indexdata'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(30),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof index_interface_1.fileListReq !== "undefined" && index_interface_1.fileListReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], GenerateindexController.prototype, "getIndexData", null);
exports.GenerateindexController = GenerateindexController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('generateindex'),
    (0, common_1.Controller)('generateindex'),
    __metadata("design:paramtypes", [typeof (_a = typeof indexfinal_service_1.IndexFinalService !== "undefined" && indexfinal_service_1.IndexFinalService) === "function" ? _a : Object])
], GenerateindexController);


/***/ }),
/* 30 */
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
exports.fileListRes = exports.updateIndexReq = exports.fileListReq = void 0;
const swagger_1 = __webpack_require__(2);
const class_transformer_1 = __webpack_require__(31);
const class_validator_1 = __webpack_require__(32);
const is_uuid_nullable_decorator_1 = __webpack_require__(33);
class fileListReq {
}
exports.fileListReq = fileListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileListReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'T', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileListReq.prototype, "cHyperlinktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Master Bundle', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileListReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["Tab","cTab",80],["Name","cFilename","*"],["Date","dIntrestDt",75],["Description","cDescription",80],["Page","cRefpage",40],["Exhibit","cExhibitno",75]', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileListReq.prototype, "column", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Cover page' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], fileListReq.prototype, "bCoverpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Index page' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], fileListReq.prototype, "bIndexpg", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileListReq.prototype, "nMasterid", void 0);
class updateIndexReq {
}
exports.updateIndexReq = updateIndexReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateIndexReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateIndexReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'doc/Case22/index.pdf', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateIndexReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nPage must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], updateIndexReq.prototype, "nPage", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], updateIndexReq.prototype, "nMasterid", void 0);
class fileListRes {
}
exports.fileListRes = fileListRes;


/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(31);
const class_validator_1 = __webpack_require__(32);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 34 */
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexFinalService = void 0;
const db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(35);
const bull_1 = __webpack_require__(37);
const bull_2 = __webpack_require__(38);
const log_service_1 = __webpack_require__(39);
let IndexFinalService = class IndexFinalService {
    constructor(db, utility, taskQueue, logService) {
        this.db = db;
        this.utility = utility;
        this.taskQueue = taskQueue;
        this.logService = logService;
        this.logApp = 'indexing';
        this.taskQueue.on('completed', async (job, result) => {
            console.log(`ACTIVE JOB FOR COMPLETE ${job} completed `);
            if (global.gc) {
                global.gc();
            }
        });
    }
    async getIndexData(body) {
        body["ref"] = 3;
        this.logService.info(`Generate index Request for   case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        let obj = { body: body };
        await this.taskQueue.add('process-indexing', obj, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
        this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
        return { msg: 1, value: 'File Indexing in process' };
    }
};
exports.IndexFinalService = IndexFinalService;
exports.IndexFinalService = IndexFinalService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_2.InjectQueue)('indexgenerate-download')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object])
], IndexFinalService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(36);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        console.log('Emited to kafka', data);
        this.kafka.sendMessage((topic ? topic : 'index-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(9);
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
/* 37 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(40);
const nest_winston_1 = __webpack_require__(41);
const winston = __webpack_require__(40);
const fs = __webpack_require__(42);
const path = __webpack_require__(43);
const moment = __webpack_require__(44);
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
/* 40 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 42 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("moment-timezone");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogInterceptor = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const operators_1 = __webpack_require__(46);
const event_log_service_1 = __webpack_require__(47);
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
/* 46 */
/***/ ((module) => {

module.exports = require("rxjs/operators");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventLogService = void 0;
const db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(10);
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
/* 48 */
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
/* 49 */
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
exports.GenerateindexService = void 0;
const db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
var fs = __webpack_require__(42);
const pdfMake = __webpack_require__(50);
const utility_service_1 = __webpack_require__(35);
const fonts = {
    Roboto: {
        normal: `${process.env.FONTS_PATH}Roboto/Roboto-Regular.ttf`,
        bold: `${process.env.FONTS_PATH}Roboto/Roboto-Medium.ttf`,
        italics: `${process.env.FONTS_PATH}Roboto/Roboto-Italic.ttf`,
        bolditalics: `${process.env.FONTS_PATH}Roboto/Roboto-MediumItalic.ttf`,
    },
};
const printer = new pdfMake(fonts);
let GenerateindexService = class GenerateindexService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
    }
    async getIndexData(body) {
        body["ref"] = 3;
        let res = this.db.executeRef('index_getfiles', body).then(async (res) => {
            debugger;
            const casedetail = res.data[0];
            const bundlelist = res.data[1];
            const tablelist = res.data[2];
            const path = `doc/case${body.nCaseid}/index_${body.nSectionid}_${new Date().getTime()}.pdf`;
            this.indexing(body, casedetail[0], tablelist, bundlelist, ('./assets/' + path), (file_res) => {
                console.log('step 6', file_res);
                if (file_res.msg == 1) {
                    this.insertIndexing(body, path, file_res.pNo);
                }
                else {
                }
            });
        }, (error) => {
            return { msg: -1, value: 'Failed to fetch data', error: error };
        });
        return { msg: 1, value: 'File Indexing in process' };
    }
    async insertIndexing(body, pdfPath, nPage) {
        console.log('step 7', pdfPath);
        let res = await this.db.executeRef('index_fileupdate', { cPath: pdfPath, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nPage: nPage });
        if (res.success) {
            try {
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid } });
            }
            catch (error) {
            }
            return { msg: 1, value: 'Indexing successful' };
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async indexing(body, casedetail, tblls, jsonData, path, cb) {
        console.log('step 2');
        debugger;
        var numPages;
        let docDefinition = {};
        try {
            const columnsArray = JSON.parse(`[${body.column}]`);
            const tableBody = [
                columnsArray.map(col => ({
                    text: col[0],
                    fillColor: '#000000',
                    color: 'white',
                    fontSize: 10,
                    alignment: 'center',
                    margin: [0, 7, 0, 7]
                }))
            ];
            console.log('step 2.1');
            const columnWidths = columnsArray.map(e => e[2]);
            const generateTable = (tablelist) => {
                if (!tablelist || !tablelist.length)
                    return null;
                return {
                    table: {
                        widths: columnWidths,
                        body: [
                            ...tablelist.map(item => columnsArray.map(e => e[1]).map(key => gettable_row_bykey(item, key)))
                        ],
                        dontBreakRows: true
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 2 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                        }
                    }
                };
            };
            const gettable_row_bykey = (item, key) => {
                if (key == 'cTab') {
                    return {
                        stack: [
                            {
                                text: item.cTab,
                                style: 'tableRowEven',
                                color: 'blue',
                                border: [false, false, true, true],
                                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                            },
                            {
                                text: (item.cTab ? (`ALPHA$-${'RD8UY'}-${item.nBundledetailid}`) : ''),
                                fontSize: 2,
                                color: '#ffffff',
                                style: 'tableRowEven',
                            }
                        ],
                        style: 'tableRowEven',
                        border: [false, false, true, true],
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                        alignment: 'center',
                        margin: [0, 3, 0, 3],
                    };
                }
                else if (key == 'cExhibitno') {
                    return {
                        stack: [
                            {
                                text: item.cExhibitno,
                                style: 'tableRowEven',
                                border: [false, false, false, false],
                                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                            },
                            {
                                text: (item.cExhibitno ? (`ALPHA$-${'RDEXUY'}-${item.nBundledetailid}`) : ''),
                                fontSize: 2,
                                color: '#ffffff',
                                style: 'tableRowEven',
                            }
                        ],
                        style: 'tableRowEven',
                        border: [false, false, true, true],
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                        alignment: 'center',
                        margin: [0, 3, 0, 3],
                    };
                }
                else if (key == 'cFilename') {
                    return { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] };
                }
                else if (key == 'dIntrestDt') {
                    return { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
                }
                else if (key == 'cDescription') {
                    return { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
                }
                else if (key == 'cRefpage') {
                    return { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
                }
                else if (key == 'kind') {
                    return { text: item.kind, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
                }
                else if (key == 'cBundletag') {
                    return { text: item.cBundletag, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
                }
            };
            const gettable_row = (item) => {
                return columnsArray.map(e => e[1]).map(key => gettable_row_bykey(item, key));
            };
            const generateContent = (data) => {
                console.log('step 2.1.2');
                const content = [];
                content.push([
                    { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
                    { text: casedetail.cIndexheader, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
                    { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
                    { text: casedetail.cClaimant, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                    { text: 'Claimant', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
                    { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
                    { text: casedetail.cRespondent, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                    { text: 'Respondent', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 10,
                                x2: 520,
                                y2: 10,
                                lineWidth: 0.3,
                                lineColor: '#c2c2c2'
                            }
                        ]
                    },
                    { text: 'INDEX OF HEARING BUNDLE DOCUMENTS', alignment: 'center', fontSize: 12, bold: true, margin: [0, 35, 0, 35] },
                    {
                        canvas: [
                            {
                                type: 'line',
                                x1: 0,
                                y1: 10,
                                x2: 520,
                                y2: 10,
                                lineWidth: 0.3, lineColor: '#c2c2c2'
                            }
                        ],
                    }, { text: '', pageBreak: 'after' }
                ]);
                var filetable = [];
                for (const entry of data) {
                    if (!entry.nBundledetailid) {
                        if (filetable.length) {
                            content.push(filetable[0]);
                            filetable = [];
                        }
                        content.push({
                            table: {
                                widths: ['*'],
                                body: [[
                                        { text: entry.sub_info || '', fontSize: 12, style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }
                                    ]], dontBreakRows: true
                            },
                            layout: {
                                hLineWidth: function () { return 2; },
                                vLineWidth: function () { return 0; },
                                hLineColor: function () { return 'white'; },
                                vLineColor: function () { return 'white'; },
                                paddingLeft: function () { return 5; },
                                paddingRight: function () { return 5; },
                                paddingTop: function () { return 0; },
                                paddingBottom: function () { return 0; }
                            }
                        });
                    }
                    else {
                        var tbl = {
                            table: {
                                widths: columnWidths,
                                body: [], dontBreakRows: true
                            }
                        };
                        if (!filetable.length) {
                            filetable.push(tbl);
                        }
                        filetable[0]["table"]["body"].push(gettable_row(entry));
                    }
                }
                try {
                    if (filetable.length) {
                        content.push(filetable[0]);
                        filetable = [];
                    }
                    if (tblls.length) {
                        const table1 = generateTable(tblls);
                        if (table1)
                            content.push(table1);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                return content;
            };
            console.log('step 2.2');
            docDefinition = {
                header: function (currentPage, pageCount) {
                    if (currentPage === 1) {
                        return null;
                    }
                    casedetail.totalPages = pageCount;
                    return [{
                            margin: [40, 20, 40, 0],
                            columns: [
                                {
                                    text: `Case No. ${casedetail.cCaseno}`,
                                    alignment: 'left',
                                    fontSize: 12, bold: true,
                                }, {
                                    text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                                    alignment: 'right', bold: true,
                                }
                            ]
                        }];
                },
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return null;
                    }
                    return [
                        {
                            table: {
                                widths: columnWidths,
                                body: tableBody
                            },
                            layout: {
                                hLineWidth: function (i, node) {
                                    return (i === 0 || i === node.table.body.length) ? 0 : 1;
                                },
                                vLineWidth: function (i, node) {
                                    return 1;
                                },
                                hLineColor: function (i, node) {
                                    return '#FFFFFF';
                                },
                                vLineColor: function (i, node) {
                                    return '#FFFFFF';
                                }
                            },
                            padding: [0, 20, 0, 20],
                            margin: [40, 40, 40, 0]
                        }
                    ];
                },
                content: [generateContent(jsonData)],
                styles: {
                    hTable: {
                        bold: true,
                        fontSize: 16,
                        fillColor: '#A9AEB8',
                        padding: [5, 0, 5, 0],
                        margin: [0, 10, 0, 10],
                    },
                    contentBackground: {
                        fillColor: '#a9aeb8'
                    },
                    tableRowEven: {
                        fillColor: '#EFF1F4',
                        fontSize: 10,
                        borderColor: ['#FF000000', '#00FF0000', '#0000FF00', '#FFFF0000']
                    }
                }
            };
        }
        catch (error) {
            console.log('1 me', error);
            return { msg: -1, error: error };
        }
        console.log('step 3');
        try {
            const directory = path.substring(0, path.lastIndexOf('/'));
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            console.log('step 3.1');
            const result = await this.generatePdf(casedetail, printer, docDefinition, path);
            cb(result);
        }
        catch (error) {
            console.log('3 me', error);
            cb({ msg: -1, error: error });
        }
    }
    async generatePdf(casedetail, printer, docDefinition, path) {
        return new Promise((resolve, reject) => {
            try {
                const pdfDoc = printer.createPdfKitDocument(docDefinition);
                const writeStream = fs.createWriteStream(path);
                writeStream.on('finish', () => {
                    console.log('PDF generated successfully.');
                    resolve({ msg: 1, pNo: casedetail.totalPages });
                });
                writeStream.on('error', (error) => {
                    console.error('Error generating PDF', error);
                    reject({ msg: -1, error });
                });
                pdfDoc.pipe(writeStream);
                pdfDoc.end();
            }
            catch (error) {
                console.log(error);
                console.error('Error generating PDF', error);
            }
        });
    }
};
exports.GenerateindexService = GenerateindexService;
exports.GenerateindexService = GenerateindexService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], GenerateindexService);


/***/ }),
/* 50 */
/***/ ((module) => {

module.exports = require("pdfmake");

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexDataService = void 0;
const db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const pdf_parse_1 = __webpack_require__(52);
var fs = __webpack_require__(42);
const pdfMake = __webpack_require__(50);
const utility_service_1 = __webpack_require__(35);
const config_1 = __webpack_require__(10);
const fonts = {
    Roboto: {
        normal: `${process.env.FONTS_PATH}Roboto/Roboto-Regular.ttf`,
        bold: `${process.env.FONTS_PATH}Roboto/Roboto-Medium.ttf`,
        italics: `${process.env.FONTS_PATH}Roboto/Roboto-Italic.ttf`,
        bolditalics: `${process.env.FONTS_PATH}Roboto/Roboto-MediumItalic.ttf`,
    },
};
const printer = new pdfMake(fonts);
let IndexDataService = class IndexDataService {
    constructor(db, utility, config) {
        this.db = db;
        this.utility = utility;
        this.config = config;
    }
    async getIndexData(body) {
        body["ref"] = 3;
        let res = this.db.executeRef('index_getfiles', body).then(async (res) => {
            debugger;
            const casedetail = res.data[0];
            const bundlelist = res.data[1];
            const tablelist = res.data[2];
            const path = `doc/case${body.nCaseid}/index_${body.nSectionid}_${new Date().getTime()}.pdf`;
            this.indexing(body, casedetail[0], tablelist, bundlelist, ('./assets/' + path), (file_res) => {
                console.log('step 6', file_res);
                if (file_res.msg == 1) {
                    this.insertIndexing(body, path, file_res.pNo);
                }
                else {
                }
            });
        }, (error) => {
            return { msg: -1, value: 'Failed to fetch data', error: error };
        });
        return { msg: 1, value: 'File Indexing in process' };
    }
    async insertIndexing(body, pdfPath, nPage) {
        console.log('step 7', pdfPath);
        let res = await this.db.executeRef('index_fileupdate', { cPath: pdfPath, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nPage: nPage });
        if (res.success) {
            try {
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid } });
            }
            catch (error) {
            }
            return { msg: 1, value: 'Indexing successful' };
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async indexing(body, casedetail, tblls, jsonData, path, cb) {
        let docDefinition = {};
        const isCoverpg = body.bCoverpg;
        const isIndexpg = body.bIndexpg;
        try {
            const columnsArray = JSON.parse(`[${body.column}]`);
            columnsArray.map(col => ({
                text: col[0],
                fillColor: '#000000',
                color: 'white',
                fontSize: 10,
                alignment: 'center',
                margin: [0, 7, 0, 7]
            }));
            console.log('step 2.1');
            const columnWidths = columnsArray.map(e => e[2]);
            console.log('step 2.2');
            const headerContent = this.getHeaderContent(casedetail);
            const content = this.generateContent(columnWidths, columnsArray, jsonData, tblls);
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, isIndexpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg),
                content: content,
                styles: this.getStyles(),
            };
        }
        catch (error) {
            console.log(error);
            return { msg: -1, error: error };
        }
        console.log('step 3');
        try {
            const directory = path.substring(0, path.lastIndexOf('/'));
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            console.log('step 3.1');
            const result = await this.generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path);
            cb(result);
        }
        catch (error) {
            console.log(error);
            cb({ msg: -1, error: error });
        }
    }
    getHeaderContent(casedetail) {
        return [
            { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
            { text: casedetail.cIndexheader, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
            { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
            { text: casedetail.cClaimant, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
            { text: 'Claimant', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
            { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
            { text: casedetail.cRespondent, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
            { text: 'Respondent', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 10,
                        x2: 520,
                        y2: 10,
                        lineWidth: 0.3,
                        lineColor: '#c2c2c2'
                    }
                ]
            },
            { text: 'INDEX OF HEARING BUNDLE DOCUMENTS', alignment: 'center', fontSize: 12, bold: true, margin: [0, 35, 0, 35] },
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 0,
                        y1: 10,
                        x2: 520,
                        y2: 10,
                        lineWidth: 0.3,
                        lineColor: '#c2c2c2'
                    }
                ],
            },
            { text: '', pageBreak: 'after' }
        ];
    }
    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key));
    }
    generateTable(columnsArray, tablelist) {
        if (!tablelist || !tablelist.length)
            return null;
        return {
            table: {
                widths: [85, '*', 110, 70, 120, 50],
                body: [
                    ...tablelist.map(item => this.gettable_row(columnsArray, item))
                ],
                dontBreakRows: true
            },
            layout: {
                hLineWidth: function (i, node) {
                    return (i === 0 || i === node.table.body.length) ? 2 : 1;
                },
                vLineWidth: function (i, node) {
                    return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                }
            }
        };
    }
    ;
    gettable_row_bykey(item, key) {
        if (key == 'cTab') {
            return {
                stack: [
                    {
                        text: item.cTab,
                        style: 'tableRowEven',
                        color: 'blue',
                        border: [false, false, true, true],
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                    },
                    {
                        text: (item.cTab ? (`ALPHA$-${'RD8UY'}-${item.nBundledetailid}`) : ''),
                        fontSize: 2,
                        color: '#ffffff',
                        style: 'tableRowEven',
                    }
                ],
                style: 'tableRowEven',
                border: [false, false, true, true],
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                alignment: 'center',
                margin: [0, 3, 0, 3],
            };
        }
        else if (key == 'cExhibitno') {
            return {
                stack: [
                    {
                        text: item.cExhibitno,
                        style: 'tableRowEven',
                        border: [false, false, false, false],
                        borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                    },
                    {
                        text: (item.cExhibitno ? (`ALPHA$-${'RDEXUY'}-${item.nBundledetailid}`) : ''),
                        fontSize: 2,
                        color: '#ffffff',
                        style: 'tableRowEven',
                    }
                ],
                style: 'tableRowEven',
                border: [false, false, true, true],
                borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                alignment: 'center',
                margin: [0, 3, 0, 3],
            };
        }
        else if (key == 'cFilename') {
            return { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] };
        }
        else if (key == 'dIntrestDt') {
            return { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
        }
        else if (key == 'cDescription') {
            return { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
        }
        else if (key == 'cRefpage') {
            return { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
        }
        else if (key == 'kind') {
            return { text: item.kind, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
        }
        else if (key == 'cBundletag') {
            return { text: item.cBundletag, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
        }
    }
    generateContent(columnWidths, columnsArray, data, tblls) {
        const content = [];
        var filetable = [];
        data.forEach((entry, bundleIndex) => {
            if (!entry.nBundledetailid) {
                if (filetable.length) {
                    content.push(filetable[0]);
                    filetable = [];
                }
                content.push({
                    table: {
                        widths: ['*'],
                        body: [[
                                {
                                    text: entry.sub_info || '', fontSize: 12, style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], id: `bundle_${bundleIndex}`
                                }
                            ]], dontBreakRows: true
                    },
                    layout: {
                        hLineWidth: function () { return 2; },
                        vLineWidth: function () { return 0; },
                        hLineColor: function () { return 'white'; },
                        vLineColor: function () { return 'white'; },
                        paddingLeft: function () { return 5; },
                        paddingRight: function () { return 5; },
                        paddingTop: function () { return 0; },
                        paddingBottom: function () { return 0; }
                    }
                });
            }
            else {
                var tbl = {
                    table: {
                        widths: columnWidths,
                        body: [], dontBreakRows: true
                    }
                };
                if (!filetable.length) {
                    filetable.push(tbl);
                }
                filetable[0]["table"]["body"].push(this.gettable_row(columnsArray, entry));
            }
        });
        if (filetable.length) {
            content.push(filetable[0]);
            filetable = [];
        }
        if (tblls.length) {
            const table1 = this.generateTable(columnsArray, tblls);
            if (table1)
                content.push(table1);
        }
        return content;
    }
    getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount) {
        if (currentPage === 1 && isCoverpg) {
            return null;
        }
        if (currentPage === 2 && isIndexpg) {
            return [{
                    margin: [40, 20, 40, 0],
                    columns: [
                        {
                            text: `Index of Hearing Bundle Documents`,
                            alignment: 'left',
                            fontSize: 12, bold: true,
                        }, {
                            text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                            alignment: 'right', bold: true,
                        }
                    ]
                }];
        }
        casedetail.totalPages = pageCount;
        return [{
                margin: [40, 20, 40, 0],
                columns: [
                    {
                        text: `Case No. ${casedetail.cCaseno}`,
                        alignment: 'left',
                        fontSize: 12, bold: true,
                    }, {
                        text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                        alignment: 'right', bold: true,
                    }
                ]
            }];
    }
    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg) {
        if (isCoverpg && currentPage === 1) {
            return null;
        }
        if (isIndexpg && currentPage === 2) {
            return this.getIndexPageBackground(pageSize);
        }
        return [
            {
                table: {
                    widths: [85, '*', 110, 70, 120, 50],
                    body: [
                        [
                            { text: 'Tab', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Exhibit no.', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Document title', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Date', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Description', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                            { text: 'Page', fillColor: '#000000', color: 'white', fontSize: 10, alignment: 'center', margin: [0, 7, 0, 7] },
                        ]
                    ]
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 0 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return 1;
                    },
                    hLineColor: function (i, node) {
                        return '#FFFFFF';
                    },
                    vLineColor: function (i, node) {
                        return '#FFFFFF';
                    }
                },
                padding: [0, 20, 0, 20],
                margin: [40, 40, 40, 0]
            }
        ];
    }
    getIndexPageBackground(pageSize) {
        return [{
                table: {
                    widths: [100, '*'],
                    body: [
                        [
                            { text: 'Bundle', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] },
                            { text: 'Description', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: function () { return 0.5; },
                    vLineWidth: function () { return 0.5; },
                    hLineColor: function () { return '#000000'; },
                    vLineColor: function () { return '#000000'; },
                    paddingLeft: function () { return 5; },
                    paddingRight: function () { return 5; },
                    paddingTop: function () { return 2; },
                    paddingBottom: function () { return 2; }
                },
                padding: [0, 20, 0, 20],
                margin: [40, 40, 40, 0]
            }];
    }
    getStyles() {
        return {
            hIndex: {
                bold: true,
                fontSize: 16,
                padding: [5, 0, 5, 0],
                margin: [0, 5, 0, 5],
            },
            hTable: {
                bold: true,
                fontSize: 16,
                fillColor: '#A9AEB8',
                padding: [5, 0, 5, 0],
                margin: [0, 10, 0, 10],
            },
            contentBackground: {
                fillColor: '#a9aeb8'
            },
            tableRowEven: {
                fillColor: '#EFF1F4',
                fontSize: 10,
                borderColor: ['#FF000000', '#00FF0000', '#0000FF00', '#FFFF0000']
            }
        };
    }
    async generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path) {
        debugger;
        return new Promise((resolve, reject) => {
            const headerContent = [];
            try {
                const directory = path.substring(0, path.lastIndexOf('/'));
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }
                const tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                const chunks = [];
                tempPdfDoc.on('data', chunk => chunks.push(chunk));
                tempPdfDoc.on('end', async () => {
                    const result = Buffer.concat(chunks);
                    let toc = [];
                    let finalContent = [];
                    headerContent.push(this.getHeaderContent(casedetail));
                    let tableBody = [];
                    jsonData.forEach((entry, bundleIndex) => {
                        if (!entry.nBundledetailid && !entry.nParentBundleid) {
                            tableBody.push([
                                { text: entry.cBundletag || '', fontSize: 12, border: [true, true, true, true], color: 'blue', borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0], linkToDestination: `bundle_${bundleIndex}` },
                                { text: entry.sub_info || '', fontSize: 12, border: [true, true, true, true], borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0] }
                            ]);
                        }
                    });
                    toc.push({
                        table: {
                            widths: [100, '*'],
                            body: tableBody
                        },
                        layout: {
                            hLineWidth: function () { return 0.5; },
                            vLineWidth: function () { return 0.5; },
                            hLineColor: function () { return '#000000'; },
                            vLineColor: function () { return '#000000'; },
                            paddingLeft: function () { return 5; },
                            paddingRight: function () { return 5; },
                            paddingTop: function () { return 2; },
                            paddingBottom: function () { return 2; }
                        }, margin: [0, -10, 0, 0]
                    });
                    toc.push({ text: '', pageBreak: 'after' });
                    if (isCoverpg && isIndexpg) {
                        finalContent = [
                            ...headerContent,
                            ...toc,
                            ...docDefinition.content
                        ];
                    }
                    else if (isCoverpg) {
                        finalContent = [
                            ...headerContent,
                            ...docDefinition.content
                        ];
                    }
                    else if (isIndexpg) {
                        finalContent = [
                            ...toc,
                            ...docDefinition.content
                        ];
                    }
                    else {
                        finalContent = [
                            ...docDefinition.content
                        ];
                    }
                    const finalDocDefinition = {
                        header: docDefinition.header,
                        pageSize: 'A4',
                        pageMargins: [40, 80, 40, 10],
                        background: docDefinition.background,
                        styles: docDefinition.styles,
                        content: finalContent,
                    };
                    const pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                    const writeStream = fs.createWriteStream(path);
                    writeStream.on('finish', () => {
                        console.log('PDF generated successfully.');
                        resolve({ msg: 1, pNo: casedetail.totalPages });
                    });
                    writeStream.on('error', (error) => {
                        console.error('Error generating PDF', error);
                        reject({ msg: -1, error });
                    });
                    pdfDoc.pipe(writeStream);
                    pdfDoc.end();
                });
                tempPdfDoc.end();
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    getBundlePageNumbers(pdfBuffer, data) {
        const pageNumbers = [];
        return (0, pdf_parse_1.default)(pdfBuffer).then(res => {
            const numPages = res.numpages;
            const textByPage = res.text.split('\n\n').map(pageText => pageText.split('\n'));
            let currentPage = 0;
            data.forEach((bundle, bundleIndex) => {
                let found = false;
                for (let i = currentPage; i < numPages; i++) {
                    if (textByPage[i].some(textLine => textLine.includes(bundle.sub_info))) {
                        pageNumbers.push(i + 1);
                        currentPage = i;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    pageNumbers.push(null);
                }
            });
            return pageNumbers;
        });
    }
};
exports.IndexDataService = IndexDataService;
exports.IndexDataService = IndexDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], IndexDataService);


/***/ }),
/* 52 */
/***/ ((module) => {

module.exports = require("pdf-parse");

/***/ }),
/* 53 */
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
const microservices_1 = __webpack_require__(9);
const kafka_shared_service_1 = __webpack_require__(36);
const config_1 = __webpack_require__(10);
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
/* 54 */
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
const db_service_1 = __webpack_require__(26);
const query_builder_service_1 = __webpack_require__(28);
const ioredis_1 = __webpack_require__(25);
const redis_db_service_1 = __webpack_require__(23);
const config_1 = __webpack_require__(10);
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
/* 55 */
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
exports.PdfGenerateService = void 0;
const log_service_1 = __webpack_require__(39);
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(42);
const os = __webpack_require__(56);
let PdfGenerateService = class PdfGenerateService {
    constructor(logService) {
        this.logService = logService;
        this.CHUNK_SIZE = 50 * 1024 * 1024;
    }
    async generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path, logApp) {
        let resources = { tempPdfDoc: null, pdfDoc: null, writeStream: null };
        const tmpDir = `${os.tmpdir()}/pdf-${Date.now()}`;
        let currentChunkSize = 0;
        try {
            await fs.promises.mkdir(tmpDir, { recursive: true });
            await this.ensureDirectoryExists(path);
            return await new Promise((resolve, reject) => {
                const tempFile = `${tmpDir}/temp.pdf`;
                const tempStream = fs.createWriteStream(tempFile);
                resources.tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                resources.tempPdfDoc.pipe(tempStream);
                tempStream.on('finish', async () => {
                    const finalContent = this.buildFinalContent(isCoverpg, isIndexpg, jsonData, casedetail, docDefinition, logApp);
                    resources.pdfDoc = printer.createPdfKitDocument({
                        ...docDefinition,
                        content: finalContent
                    });
                    resources.writeStream = fs.createWriteStream(path);
                    const readStream = fs.createReadStream(tempFile, { highWaterMark: 64 * 1024 });
                    readStream.on('data', chunk => {
                        currentChunkSize += chunk.length;
                        if (currentChunkSize >= this.CHUNK_SIZE) {
                            if (global.gc)
                                global.gc();
                            currentChunkSize = 0;
                        }
                    });
                    resources.writeStream.on('finish', () => {
                        resolve({ msg: 1, pNo: casedetail.totalPages });
                    });
                    resources.pdfDoc.pipe(resources.writeStream);
                    resources.pdfDoc.end();
                });
                resources.tempPdfDoc.end();
            });
        }
        catch (error) {
            return { msg: -1, error };
        }
        finally {
            await this.cleanupResources(resources);
            await fs.promises.rm(tmpDir, { recursive: true, force: true });
        }
    }
    async cleanupResources(resources) {
        for (const resource of Object.values(resources)) {
            if (resource?.removeAllListeners) {
                resource.removeAllListeners();
            }
            if (resource?.end) {
                resource.end();
            }
            if (resource?.destroy) {
                resource.destroy();
            }
        }
        Object.keys(resources).forEach(key => {
            resources[key] = null;
        });
        if (global.gc) {
            global.gc();
            await new Promise(resolve => setTimeout(resolve, 100));
            global.gc();
        }
    }
    buildFinalContent(isCoverpg, isIndexpg, jsonData, casedetail, docDefinition, logApp) {
        const headerContent = isCoverpg ? [this.getHeaderContent(casedetail, logApp)] : [];
        const toc = isIndexpg ? this.buildTableOfContents(jsonData) : [];
        if (isCoverpg && isIndexpg) {
            return [...headerContent, ...toc, ...docDefinition.content];
        }
        else if (isCoverpg) {
            return [...headerContent, ...docDefinition.content];
        }
        else if (isIndexpg) {
            return [...toc, ...docDefinition.content];
        }
        return [...docDefinition.content];
    }
    async ensureDirectoryExists(path) {
        const directory = path.substring(0, path.lastIndexOf('/'));
        await fs.promises.mkdir(directory, { recursive: true });
    }
    getHeaderContent(casedetail, logApp) {
        try {
            return [
                { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
                { text: casedetail.cIndexheader, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
                { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
                { text: casedetail.cClaimant, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Claimant', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
                { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
                { text: casedetail.cRespondent, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Respondent', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ]
                },
                { text: 'INDEX OF HEARING BUNDLE DOCUMENTS', alignment: 'center', fontSize: 12, bold: true, margin: [0, 35, 0, 35] },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ],
                },
                { text: '', pageBreak: 'after' }
            ];
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, logApp);
        }
    }
    buildTableOfContents(jsonData) {
        const tableBody = jsonData
            .filter(entry => !entry.nBundledetailid && !entry.nParentBundleid)
            .map((entry, bundleIndex) => ([
            {
                text: entry.cBundletag || '',
                fontSize: 12,
                border: [true, true, true, true],
                color: 'blue',
                borderColor: ['#000000', '#000000', '#000000', '#000000'],
                padding: [5, 0, 5, 0],
                linkToDestination: `bundle_${bundleIndex}`
            },
            {
                text: entry.sub_info || '',
                fontSize: 12,
                border: [true, true, true, true],
                borderColor: ['#000000', '#000000', '#000000', '#000000'],
                padding: [5, 0, 5, 0]
            }
        ]));
        const toc = [];
        if (tableBody.length) {
            toc.push({
                table: {
                    widths: [100, '*'],
                    body: tableBody
                },
                layout: {
                    hLineWidth: () => 0.5,
                    vLineWidth: () => 0.5,
                    hLineColor: () => '#000000',
                    vLineColor: () => '#000000',
                    paddingLeft: () => 5,
                    paddingRight: () => 5,
                    paddingTop: () => 2,
                    paddingBottom: () => 2
                },
                margin: [0, -10, 0, 0]
            });
        }
        toc.push({ text: '', pageBreak: 'after' });
        return toc;
    }
    checkMemory() {
        try {
            const memoryUsage = process.memoryUsage();
            console.log('Memory usage:', {
                rss: (memoryUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
                heapTotal: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
                heapUsed: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
                external: (memoryUsage.external / 1024 / 1024).toFixed(2) + ' MB',
                arrayBuffers: (memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
            });
        }
        catch (error) {
            console.error('Error while monitoring memory:', error);
        }
    }
};
exports.PdfGenerateService = PdfGenerateService;
exports.PdfGenerateService = PdfGenerateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object])
], PdfGenerateService);


/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 57 */
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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueProcessor = void 0;
const db_service_1 = __webpack_require__(26);
const bull_1 = __webpack_require__(38);
const bull_2 = __webpack_require__(37);
const utility_service_1 = __webpack_require__(35);
var fs = __webpack_require__(42);
const XLSX = __webpack_require__(58);
const pdfMake = __webpack_require__(50);
const child_process_1 = __webpack_require__(59);
const util_1 = __webpack_require__(60);
const config_1 = __webpack_require__(10);
const log_service_1 = __webpack_require__(39);
const pdf_generate_service_1 = __webpack_require__(55);
const client_s3_1 = __webpack_require__(61);
const https_1 = __webpack_require__(62);
const node_http_handler_1 = __webpack_require__(63);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const fonts = {
    Roboto: {
        normal: `${process.env.FONTS_PATH}Roboto/Roboto-Regular.ttf`,
        bold: `${process.env.FONTS_PATH}Roboto/Roboto-Medium.ttf`,
        italics: `${process.env.FONTS_PATH}Roboto/Roboto-Italic.ttf`,
        bolditalics: `${process.env.FONTS_PATH}Roboto/Roboto-MediumItalic.ttf`,
    },
};
let QueueProcessor = class QueueProcessor {
    constructor(utility, db, config, logService, pdfGenerateS) {
        this.utility = utility;
        this.db = db;
        this.config = config;
        this.logService = logService;
        this.pdfGenerateS = pdfGenerateS;
        this.filepath = this.config.get('ASSETS');
        this.ASSETS_PATH = this.config.get('S3_SYNC_PATH');
        this.S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.config.get('S3_EXC_PATH');
        this.BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');
        this.assets = this.config.get('ASSETS');
        this.logApp = 'indexing';
        const agent = new https_1.Agent({ keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 });
        this.s3Client = new client_s3_1.S3Client({
            region: 'sgp1',
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            maxAttempts: 5,
            retryMode: 'standard',
            forcePathStyle: this.config.get('DO_S3') == 'MINIO',
            requestHandler: new node_http_handler_1.NodeHttpHandler({
                httpsAgent: agent,
                connectionTimeout: 60000,
                socketTimeout: 60000,
            }),
        });
    }
    async handleTask(job) {
        const { nCaseid, nSectionid, nMasterid } = job.data.body;
        try {
            await new Promise(async (resolve, reject) => {
                try {
                    console.log('STARTED FROM HERE');
                    const path = `doc/case${nCaseid}/index_${nSectionid}_${new Date().getTime()}.pdf`;
                    console.log('step 1.1');
                    let data = await this.getIndexData(job.data.body);
                    console.log('step 1.1');
                    if (data && data?.msg && data?.msg == -1) {
                        this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    }
                    this.logService.info(`Indexing start for caseId ${nCaseid} by userId ${nMasterid}`, this.logApp);
                    console.log('Task processed 0');
                    this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'A', message: 'Data analyzing for generate PDF. Please wait...' } });
                    let [casedetail] = [data.casedetail];
                    this.indexing(data, job.data.body, path, async (file_res) => {
                        if (file_res.msg == 1) {
                            try {
                                await this.uploadFileToS3(path);
                                this.logService.info(`Insert to data base for ${nCaseid} by userId ${nMasterid}`, this.logApp);
                                if (casedetail?.oldPath) {
                                    this.unsyncOldfile(casedetail?.oldPath);
                                }
                                this.insertIndexing(job.data.body, path, file_res.pNo);
                                this.logService.info(`Indexing Created successfully for ${nCaseid} by userId ${nMasterid}`, this.logApp);
                                resolve();
                            }
                            catch (error) {
                                console.log(error);
                                this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
                                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                                resolve();
                            }
                        }
                        else {
                            resolve();
                            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to generate index. Please try again.' } });
                        }
                        data = null;
                    });
                }
                catch (error) {
                    console.log(error);
                    this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
                    this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    resolve();
                }
            });
            if (global.gc) {
                global.gc();
            }
            console.log('Task processed 1');
        }
        catch (error) {
            console.log('Task error', error);
            this.logService.error(`Indexing Failed with error ${error}`, this.logApp);
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: job.data.body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
        }
    }
    async getIndexData(body) {
        body["ref"] = 3;
        this.logService.info(`Generate index Request for   case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        this.logService.info(`Request for get Data  case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        try {
            const res = await this.db.executeRef('index_getfiles', body);
            try {
                this.logService.info(`GetData reponce success add in queue case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                const [casedetail, bundlelist, tablelist] = res.data;
                let obj = { casedetail: casedetail[0], tablelist: tablelist, bundlelist: bundlelist };
                return obj;
            }
            catch (error) {
                console.log(error);
                this.logService.error(`Indexing failed with error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                return { msg: -1, value: 'Failed to fetch data', error: error };
            }
        }
        catch (error) {
            this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
            return { msg: -1, value: 'Failed to fetch data', error: error };
        }
    }
    async insertIndexing(body, pdfPath, nPage) {
        let res = await this.db.executeRef('index_fileupdate', { cPath: pdfPath, nCaseid: body.nCaseid, nSectionid: body.nSectionid, nPage: nPage, cFilename: body.cFilename });
        if (res.success) {
            try {
                console.log('step 7', res.data[0]);
                this.sendNotification(body.nCaseid, body.nMasterid, true, res.nBundledetailid);
                this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, nBundledetailid: res.data[0][0]["nBundledetailid"], cName: res.data[0][0]["cName"], type: 'C' } });
            }
            catch (error) {
            }
            return { msg: 1, value: 'Indexing successful' };
        }
        else {
            this.sendNotification(body.nCaseid, body.nMasterid, false);
            this.utility.emit({ event: 'INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F' } });
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async indexing(data, body, filepath, cb) {
        const printer = new pdfMake(fonts);
        this.logService.info(`Indexing start create HTML using pdfMake for caseId ${body.nCaseid} by userId ${body.nMasterid}`, this.logApp);
        let [casedetail, tblls, jsonData, path] = [data.casedetail, data.tablelist, data.bundlelist, this.filepath + filepath];
        console.log('step 2', casedetail);
        let docDefinition = {};
        const isCoverpg = body.bCoverpg;
        const isIndexpg = body.bIndexpg;
        let content;
        try {
            const columnsArray = JSON.parse(`[${body.column}]`);
            const tableBody = [
                columnsArray.map(col => ({
                    text: col[0],
                    fillColor: '#000000',
                    color: 'white',
                    fontSize: 10,
                    alignment: 'center',
                    margin: [0, 7, 0, 7]
                }))
            ];
            console.log('step 2.1');
            const columnWidths = columnsArray.map(e => e[2]);
            console.log('step 2.2');
            content = this.generateContent(columnWidths, columnsArray, jsonData, tblls);
            console.log('step 2.3');
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, isIndexpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, tableBody, currentPage, pageSize, isCoverpg, isIndexpg),
                content: content,
                styles: this.getStyles(),
            };
            console.log('step 2.4');
        }
        catch (error) {
            console.log('3 ', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, this.logApp);
            cb({ msg: -1, error: error });
        }
        try {
            console.log('step 2.5');
            const directory = path.substring(0, path.lastIndexOf('/'));
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            console.log('step 2.6');
            this.logService.info(`Generate HTML Start`, this.logApp);
            const result = await this.generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path);
            docDefinition = null;
            casedetail = null;
            jsonData = null;
            tblls = null;
            content = null;
            this.logService.info(`Generate HTML ${result ? 'success' : 'failed'}`, this.logApp);
            console.log('step 2.7');
            console.log('step 2.8', result);
            if (printer?.cache)
                printer.cache.clear();
            await fs.promises.open(path, 'r').then(fd => fd.close());
            cb(result);
        }
        catch (error) {
            console.log('3 me', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, this.logApp);
            if (printer?.cache)
                printer.cache.clear();
            cb({ msg: -1, error: error });
        }
    }
    getHeaderContent(casedetail) {
        try {
            return [
                { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
                { text: casedetail.cIndexheader, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
                { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
                { text: casedetail.cClaimant, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Claimant', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
                { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
                { text: casedetail.cRespondent, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Respondent', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ]
                },
                { text: 'INDEX OF HEARING BUNDLE DOCUMENTS', alignment: 'center', fontSize: 12, bold: true, margin: [0, 35, 0, 35] },
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 10,
                            x2: 520,
                            y2: 10,
                            lineWidth: 0.3,
                            lineColor: '#c2c2c2'
                        }
                    ],
                },
                { text: '', pageBreak: 'after' }
            ];
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key));
    }
    generateTable(columnWidths, columnsArray, tablelist) {
        try {
            if (!tablelist || !tablelist.length)
                return null;
            return {
                table: {
                    widths: columnWidths,
                    body: [
                        ...tablelist.map(item => this.gettable_row(columnsArray, item))
                    ],
                    dontBreakRows: true
                },
                layout: {
                    hLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function (i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    }
                }
            };
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    ;
    gettable_row_bykey(item, key) {
        try {
            if (key == 'cTab') {
                return {
                    stack: [
                        {
                            text: item.cTab,
                            style: 'tableRowEven',
                            color: 'blue',
                            border: [false, false, true, true],
                            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                            linkToDestination: `bd_${item.nBundledetailid}`,
                            decoration: 'underline',
                        }
                    ],
                    style: 'tableRowEven',
                    border: [false, false, true, true],
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    alignment: 'center',
                    margin: [0, 3, 0, 3],
                };
            }
            else if (key == 'cExhibitno') {
                return {
                    stack: [
                        {
                            text: item.cExhibitno,
                            style: 'tableRowEven',
                            border: [false, false, false, false],
                            borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff']
                        },
                        {
                            text: (item.cExhibitno ? (`ALPHA$-${'RDEXUY'}-${item.nBundledetailid}`) : ''),
                            fontSize: 2,
                            color: '#ffffff',
                            style: 'tableRowEven',
                        }
                    ],
                    style: 'tableRowEven',
                    border: [false, false, true, true],
                    borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'],
                    alignment: 'center',
                    margin: [0, 3, 0, 3],
                };
            }
            else if (key == 'cFilename') {
                return { text: item.cFilename, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], margin: [0, 3, 0, 3] };
            }
            else if (key == 'dIntrestDt') {
                return { text: item.dIntrestDt, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
            else if (key == 'cDescription') {
                return { text: item.cDescription, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
            else if (key == 'cRefpage') {
                return { text: item.cRefpage, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
            else if (key == 'kind') {
                return { text: item.kind, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
            else if (key == 'cBundletag') {
                return { text: item.cBundletag, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
            else if (key == 'cAuthor') {
                return { text: item.cAuthor, style: 'tableRowEven', border: [false, false, true, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], alignment: 'center', margin: [0, 3, 0, 3] };
            }
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    generateContent(columnWidths, columnsArray, data, tblls) {
        try {
            const content = [];
            var filetable = [];
            data.forEach((entry, bundleIndex) => {
                if (!entry.nBundledetailid) {
                    if (filetable.length) {
                        content.push(filetable[0]);
                        filetable = [];
                    }
                    content.push({
                        table: {
                            widths: ['*'],
                            body: [[
                                    {
                                        text: entry.sub_info || '', fontSize: 12, style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'], id: `bundle_${bundleIndex}`
                                    }
                                ]], dontBreakRows: true
                        },
                        layout: {
                            hLineWidth: function () { return 2; },
                            vLineWidth: function () { return 0; },
                            hLineColor: function () { return 'white'; },
                            vLineColor: function () { return 'white'; },
                            paddingLeft: function () { return 5; },
                            paddingRight: function () { return 5; },
                            paddingTop: function () { return 0; },
                            paddingBottom: function () { return 0; }
                        }
                    });
                }
                else {
                    var tbl = {
                        table: {
                            widths: columnWidths,
                            body: [], dontBreakRows: true
                        }
                    };
                    if (!filetable.length) {
                        filetable.push(tbl);
                    }
                    filetable[0]["table"]["body"].push(this.gettable_row(columnsArray, entry));
                }
            });
            if (filetable.length) {
                content.push(filetable[0]);
                filetable = [];
            }
            if (tblls.length) {
                const table1 = this.generateTable(columnWidths, columnsArray, tblls);
                if (table1)
                    content.push(table1);
            }
            return content;
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    getHeader(isIndexpg, isCoverpg, currentPage, casedetail, pageCount) {
        try {
            if (currentPage === 1 && isCoverpg) {
                return null;
            }
            if (currentPage === 2 && isIndexpg) {
                return [{
                        margin: [40, 20, 40, 0],
                        columns: [
                            {
                                text: `Index of Hearing Bundle Documents`,
                                alignment: 'left',
                                fontSize: 12, bold: true,
                            }, {
                                text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                                alignment: 'right', bold: true,
                            }
                        ]
                    }];
            }
            casedetail.totalPages = pageCount;
            return [{
                    margin: [40, 20, 40, 0],
                    columns: [
                        {
                            text: `Case No. ${casedetail.cCaseno}`,
                            alignment: 'left',
                            fontSize: 12, bold: true,
                        }, {
                            text: 'Page: ' + (parseInt(currentPage) - 1).toString() + ' of ' + (parseInt(pageCount) - 1).toString(),
                            alignment: 'right', bold: true,
                        }
                    ]
                }];
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg, isIndexpg) {
        try {
            if (isCoverpg && currentPage === 1) {
                return null;
            }
            if (isIndexpg && currentPage === 2) {
                return this.getIndexPageBackground(pageSize);
            }
            return [
                {
                    table: {
                        widths: columnWidths,
                        body: columnsArray
                    },
                    layout: {
                        hLineWidth: function (i, node) {
                            return (i === 0 || i === node.table.body.length) ? 0 : 1;
                        },
                        vLineWidth: function (i, node) {
                            return 1;
                        },
                        hLineColor: function (i, node) {
                            return '#FFFFFF';
                        },
                        vLineColor: function (i, node) {
                            return '#FFFFFF';
                        }
                    },
                    padding: [0, 20, 0, 20],
                    margin: [40, 40, 40, 0]
                }
            ];
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Generate HTML  error ${JSON.stringify(error)}`, this.logApp);
        }
    }
    getIndexPageBackground(pageSize) {
        return [{
                table: {
                    widths: [100, '*'],
                    body: [
                        [
                            { text: 'Bundle', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] },
                            { text: 'Description', fillColor: '#E19686', color: 'black', fontSize: 10, alignment: 'left', margin: [0, 7, 0, 7], padding: [5, 0, 5, 0] }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: function () { return 0.5; },
                    vLineWidth: function () { return 0.5; },
                    hLineColor: function () { return '#000000'; },
                    vLineColor: function () { return '#000000'; },
                    paddingLeft: function () { return 5; },
                    paddingRight: function () { return 5; },
                    paddingTop: function () { return 2; },
                    paddingBottom: function () { return 2; }
                },
                padding: [0, 20, 0, 20],
                margin: [40, 40, 40, 0]
            }];
    }
    getStyles() {
        return {
            hIndex: {
                bold: true,
                fontSize: 16,
                padding: [5, 0, 5, 0],
                margin: [0, 5, 0, 5],
            },
            hTable: {
                bold: true,
                fontSize: 16,
                fillColor: '#A9AEB8',
                padding: [5, 0, 5, 0],
                margin: [0, 10, 0, 10],
            },
            contentBackground: {
                fillColor: '#a9aeb8'
            },
            tableRowEven: {
                fillColor: '#EFF1F4',
                fontSize: 10,
                borderColor: ['#FF000000', '#00FF0000', '#0000FF00', '#FFFF0000']
            }
        };
    }
    async generatePdf(isCoverpg, isIndexpg, jsonData, casedetail, printer, docDefinition, path) {
        return new Promise((resolve, reject) => {
            const headerContent = [];
            try {
                console.log('START GENERATION');
                const directory = path.substring(0, path.lastIndexOf('/'));
                if (!fs.existsSync(directory)) {
                    fs.mkdirSync(directory, { recursive: true });
                }
                let pdfDoc;
                let writeStream;
                console.log('PDF generation end process.');
                let toc = [];
                let finalContent = [];
                console.log('Set Header');
                headerContent.push(this.getHeaderContent(casedetail));
                let tableBody = [];
                jsonData.forEach((entry, bundleIndex) => {
                    if (!entry.nBundledetailid && !entry.nParentBundleid) {
                        tableBody.push([
                            { text: entry.cBundletag || '', fontSize: 12, border: [true, true, true, true], color: 'blue', borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0], linkToDestination: `bundle_${bundleIndex}` },
                            { text: entry.sub_info || '', fontSize: 12, border: [true, true, true, true], borderColor: ['#000000', '#000000', '#000000', '#000000'], padding: [5, 0, 5, 0] }
                        ]);
                    }
                });
                console.log('Set Header Success', tableBody.length);
                if (tableBody.length) {
                    toc.push({
                        table: {
                            widths: [100, '*'],
                            body: tableBody
                        },
                        layout: {
                            hLineWidth: function () { return 0.5; },
                            vLineWidth: function () { return 0.5; },
                            hLineColor: function () { return '#000000'; },
                            vLineColor: function () { return '#000000'; },
                            paddingLeft: function () { return 5; },
                            paddingRight: function () { return 5; },
                            paddingTop: function () { return 2; },
                            paddingBottom: function () { return 2; }
                        }, margin: [0, -10, 0, 0]
                    });
                }
                toc.push({ text: '', pageBreak: 'after' });
                console.log('Step 1');
                if (isCoverpg && isIndexpg) {
                    finalContent = [
                        ...headerContent,
                        ...toc,
                        ...docDefinition.content
                    ];
                }
                else if (isCoverpg) {
                    finalContent = [
                        ...headerContent,
                        ...docDefinition.content
                    ];
                }
                else if (isIndexpg) {
                    finalContent = [
                        ...toc,
                        ...docDefinition.content
                    ];
                }
                else {
                    finalContent = [
                        ...docDefinition.content
                    ];
                }
                console.log('Step 2');
                const finalDocDefinition = {
                    header: docDefinition.header,
                    pageSize: 'A4',
                    pageMargins: [40, 80, 40, 10],
                    background: docDefinition.background,
                    styles: docDefinition.styles,
                    content: finalContent,
                };
                console.log('Step 3', docDefinition.header);
                pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                console.log('Step createPdfKitDocument');
                this.logService.info(`Generate HTML success`, this.logApp);
                this.logService.info(`Creating PDF `, this.logApp);
                console.log('Creating PDF ', path);
                writeStream = fs.createWriteStream(path);
                writeStream.on('finish', () => {
                    console.log('PDF generated successfully.');
                    this.logService.info(`PDF generated successfully.`, this.logApp);
                    resolve({ msg: 1, pNo: casedetail.totalPages });
                });
                writeStream.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.log('Error generating PDF', error);
                    this.logService.error(`Error generating PDF ${JSON.stringify(error)}`, this.logApp);
                    resolve({ msg: -1, error });
                });
                pdfDoc.on('end', () => {
                    console.log('pdfDoc PDF generation completed successfully.');
                });
                pdfDoc.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.error('pdfDoc PDF generation error:', error);
                });
                pdfDoc.pipe(writeStream);
                pdfDoc.end();
                try {
                    pdfDoc = null;
                    writeStream = null;
                }
                catch (error) {
                    console.log(error);
                }
            }
            catch (error) {
                console.log(error);
                this.logService.error(`Generate HTML error ${JSON.stringify(error)}`, this.logApp);
                reject({ msg: -1, value: 'Indexing Failed' });
            }
        });
    }
    cleanupMemory(chunks) {
        chunks.length = 0;
        if (global.gc)
            global.gc();
    }
    cleanup(pdfDoc, writeStream, tempPdfDoc) {
        try {
            if (pdfDoc) {
                console.log('clean pdfDoc');
                pdfDoc.removeAllListeners();
            }
            if (writeStream) {
                console.log('clean writeStream');
                writeStream.removeAllListeners();
            }
            if (tempPdfDoc) {
                console.log('clean tempPdfDoc');
                tempPdfDoc.removeAllListeners();
            }
        }
        catch (error) {
            console.log(error);
        }
        if (global.gc)
            global.gc();
    }
    async uploadFileToS3(oldPath) {
        try {
            this.logService.info(`Send file local to object storage`, this.logApp);
            const copyCommand = `${this.S3_EXC_PATH} sync ${this.ASSETS_PATH}${oldPath} ${this.S3_BUCKET_PATH}${oldPath}`;
            console.log(`Executing: ${copyCommand}`);
            this.logService.info(`Executing command ${copyCommand}`, this.logApp);
            await execPromise(copyCommand);
            console.log(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`);
            this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp);
            return true;
        }
        catch (error) {
            console.log(error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, this.logApp);
            return false;
        }
    }
    async sendNotification(nCaseid, nMasterid, status, nBundledetailid) {
        if (!nCaseid)
            return;
        this.logService.info(`Notification send for ${nCaseid}`, `index/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `Index generate ${status ? 'successful' : 'failed'} `;
                    a.cMsg = `Index generate ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
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
    async unsyncOldfile(filePath) {
        try {
            await fs.unlink(this.assets + filePath);
            this.logService.info(`Successfully deleted file: ${filePath}`, this.logApp);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logService.info(`File not found, skipping deletion: ${filePath}`, this.logApp);
            }
            else {
                this.logService.error(`Error deleting file: ${filePath}`, this.logApp);
            }
        }
        try {
            const listCommand = new client_s3_1.ListObjectVersionsCommand({
                Bucket: this.BUCKET_NAME,
                Prefix: filePath.startsWith("/") ? filePath.slice(1) : filePath,
            });
            const versionData = await this.s3Client.send(listCommand);
            if (!versionData.Versions || versionData.Versions.length === 0) {
                this.logService.info(`No versions found for S3 file: ${filePath}`, this.logApp);
                return;
            }
            const deleteParams = {
                Bucket: this.BUCKET_NAME,
                Delete: {
                    Objects: versionData.Versions.map((v) => ({
                        Key: filePath,
                        VersionId: v.VersionId,
                    })),
                },
            };
            const deleteCommand = new client_s3_1.DeleteObjectsCommand(deleteParams);
            await this.s3Client.send(deleteCommand);
            this.logService.info(`Successfully deleted all versions of S3 file: ${filePath}`, this.logApp);
        }
        catch (error) {
            this.logService.error(`Error deleting S3 file versions: ${filePath}`, error.stack);
        }
    }
};
exports.QueueProcessor = QueueProcessor;
__decorate([
    (0, bull_1.Process)('process-indexing'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], QueueProcessor.prototype, "handleTask", null);
exports.QueueProcessor = QueueProcessor = __decorate([
    (0, bull_1.Processor)('indexgenerate-download'),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof pdf_generate_service_1.PdfGenerateService !== "undefined" && pdf_generate_service_1.PdfGenerateService) === "function" ? _e : Object])
], QueueProcessor);


/***/ }),
/* 58 */
/***/ ((module) => {

module.exports = require("xlsx");

/***/ }),
/* 59 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 60 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 61 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 63 */
/***/ ((module) => {

module.exports = require("@aws-sdk/node-http-handler");

/***/ }),
/* 64 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(65);
const utility_service_1 = __webpack_require__(66);
const jwt_middleware_1 = __webpack_require__(21);
const bull_1 = __webpack_require__(38);
const config_1 = __webpack_require__(10);
const batch_service_1 = __webpack_require__(67);
const batch_controller_1 = __webpack_require__(68);
const log_service_1 = __webpack_require__(39);
const kafka_module_1 = __webpack_require__(53);
let BatchModule = class BatchModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(batch_controller_1.BatchController);
    }
};
exports.BatchModule = BatchModule;
exports.BatchModule = BatchModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule,
            kafka_module_1.KafkaModule.register('etabella-batch', 'batch-group'),
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    redis: {
                        port: Number(config.get('REDIS_PORT')),
                        host: config.get('REDIS_IP'),
                        password: config.get('REDIS_PASSWORD'),
                        db: 2
                    },
                }),
            }),
            bull_1.BullModule.registerQueue({
                name: 'batchfile-download',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            })],
        controllers: [batch_controller_1.BatchController],
        providers: [batch_service_1.BatchService, utility_service_1.UtilityService, config_1.ConfigService, log_service_1.LogService]
    })
], BatchModule);


/***/ }),
/* 65 */
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
const db_service_1 = __webpack_require__(26);
const query_builder_service_1 = __webpack_require__(28);
const ioredis_1 = __webpack_require__(25);
const redis_db_service_1 = __webpack_require__(23);
const config_1 = __webpack_require__(10);
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
/* 66 */
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
const kafka_shared_service_1 = __webpack_require__(36);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'batchfile-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


/***/ }),
/* 67 */
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
exports.BatchService = void 0;
const db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(66);
const bull_1 = __webpack_require__(38);
const bull_2 = __webpack_require__(37);
const path = __webpack_require__(43);
const moment = __webpack_require__(16);
const log_service_1 = __webpack_require__(39);
const config_1 = __webpack_require__(10);
const redis_db_service_1 = __webpack_require__(23);
const XLSX = __webpack_require__(58);
let BatchService = class BatchService {
    constructor(db, utility, logService, rds, taskQueue, config) {
        this.db = db;
        this.utility = utility;
        this.logService = logService;
        this.rds = rds;
        this.taskQueue = taskQueue;
        this.config = config;
        this.filepath = this.config.get('ASSETS');
        this.logApp = 'batchFile';
    }
    async getfiledata(body) {
        console.log('Creating batch file', body);
        this.logService.info(`Fatch file Request for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        this.logService.info(`Request for get Data  case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
        await this.rds.setValue(`batch_download:${body.nMasterid}:${body.nCaseid}`, JSON.stringify({ nSectionid: body.nSectionid, cBundleids: body.cBundleids, cFilename: body.cFilename, column: body.column }), 24 * 3600);
        this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
        this.logService.info(`Added in queue successfully`, this.logApp);
        return { msg: 1, value: 'Batch File in process ' };
        return;
        this.db.executeRef('batchfile_getdata', body).then(async (res) => {
            try {
                if (res.success) {
                    this.logService.info(`GetData reponce success add in queue case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                    const obj = {
                        "data": res.data[0],
                        "filename": body.cFilename,
                        column: body.column,
                        nCaseid: body.nCaseid,
                        nMasterid: body.nMasterid
                    };
                    this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'Q', message: 'Added in queue. Please wait...' } });
                    await this.taskQueue.add('process-task', obj);
                    this.logService.info(`Added in queue successfully`, this.logApp);
                    return { msg: 1, value: 'Batch File in process' };
                }
                else {
                    this.logService.error(`Batch creation failed with error ${JSON.stringify(res?.error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                    this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                    return { msg: -1, value: 'Failed to fetch', error: res?.error };
                }
            }
            catch (error) {
                this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
                return { msg: -1, value: 'Failed to fetch', error: error };
            }
        }, (error) => {
            this.logService.error(`GetData reponce error ${JSON.stringify(error)} case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'Failed to fatch data. Please try again.' } });
            return { msg: -1, value: 'Failed to fetch data', error: error };
        });
        this.utility.emit({ event: 'BATCH-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'FD', message: 'Fatching data. Please wait...' } });
        return { msg: 1, value: 'Batch file generating' };
    }
    async getFilecolumn(body) {
        let res = await this.db.executeRef('batchfile_columns', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res?.error };
        }
    }
    async getUploadedFileCols(query) {
        const filename = query.cPath;
        const filePath = path.join(this.filepath, filename);
        let res = await this.uploadFileCols(filePath);
        try {
            return res;
        }
        catch (e) {
            return { msg: -1, value: 'Failed to fetch', error: e };
        }
    }
    async uploadfiledata(body) {
        let path = this.filepath + body.cPath;
        try {
            this.logService.info(`Fatch file upload request Request File path is ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            this.logService.info(`Read excel file from path ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
            let res = await this.readExceldata(path);
            this.logService.info(`Read excel file success`, this.logApp);
            if (res && res["data"] && res["data"].length > 0) {
                body["filedata"] = JSON.stringify(res["data"]);
                this.logService.info(`Ready to update in table`, this.logApp);
                let res2 = await this.db.executeRef('batchfile_update', body);
                try {
                    if (res2.success) {
                        this.logService.info(`Data updated to file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                        return { msg: 1, value: 'Batch file uploaded' };
                    }
                    else {
                        this.logService.info(`Data updation failed to file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid}`, this.logApp);
                        return { msg: -1, value: 'Failed to upload', error: res2.error };
                    }
                }
                catch (error) {
                    this.logService.error(`Error in database file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} \n error: ${error} `, this.logApp);
                    return { msg: -1, value: 'Failed to upload', error: res2.error };
                }
            }
            else {
                this.logService.info(`No data found in file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} `, this.logApp);
                return { msg: -1, value: 'Failed to upload', error: 'No data found' };
            }
        }
        catch (error) {
            this.logService.error(`Error in while reading file ${body.cPath} for case ${body.nCaseid} by user ${body.nMasterid} \n error: ${error} `, this.logApp);
            return { msg: -1, value: 'Failed to upload', error: error };
        }
        let res = await this.db.executeRef('batchfile_upload', body);
        try {
            if (res.success) {
                return { msg: 1, value: 'Batch file uploaded' };
            }
            else {
                return { msg: -1, value: 'Failed to upload', error: res.error };
            }
        }
        catch (e) {
            return { msg: -1, value: 'Failed to upload', error: res.error };
        }
    }
    downloadFile(query, res) {
        console.log('Download batch file req', query);
        const fileuri = query.cPath;
        const filePath = path.join(this.filepath, fileuri);
        this.logService.info(`Download file by user ${query.nMasterid}`, this.logApp);
        res.download(filePath, fileuri, (err) => {
            if (err) {
                this.logService.info(`Error while download file ${err}`, this.logApp);
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        });
    }
    async uploadFileCols(file) {
        const workbook = XLSX.readFile(file);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const headers = this.getHeaders(worksheet);
        return { msg: 1, data: headers };
    }
    getHeaders(worksheet) {
        const headers = [];
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const firstRow = range.s.r;
        for (let col = range.s.c; col <= range.e.c; ++col) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: firstRow, c: col })];
            const header = cell ? cell.v : `UNKNOWN ${col}`;
            headers.push(header);
        }
        return headers;
    }
    async readExceldata(path) {
        try {
            const workbook = XLSX.readFile(path);
            const firstWorksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstWorksheetName];
            let jsonData = XLSX.utils.sheet_to_json(worksheet);
            const uuidShape = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
            jsonData = jsonData.filter(e => {
                const id = e['ID'];
                if (id == null || id === '')
                    return false;
                return uuidShape.test(String(id).trim());
            });
            for (let x of jsonData.filter(e => e["Date"] && e["Date"] != '')) {
                x["Date"] = this.parseDate(x["Date"]);
            }
            return { data: jsonData };
        }
        catch (error) {
            console.error('readExceldata', error);
            this.logService.error(`Error while read excel file ${path} : ${error}`, this.logApp);
            return { data: null };
        }
    }
    parseDate(input) {
        if (input instanceof Date && !isNaN(input.getTime())) {
            return this.formatNaturalLanguage(input);
        }
        if (typeof input === 'number') {
            const jsDate = new Date(Math.round((input - (25567 + 2)) * 86400 * 1000));
            return this.formatNaturalLanguage(jsDate);
        }
        if (typeof input === 'string') {
            const trimmed = input.trim();
            if (!trimmed)
                return '';
            const formats = [
                'D MMMM YYYY',
                'D MMM YYYY',
                'MMMM D, YYYY',
                'MMM D, YYYY',
                'YYYY.MM.DD', 'YYYY.M.D',
                'YYYY-MM-DD', 'YYYY-M-D',
                'DD.MM.YYYY', 'D.M.YYYY',
                'DD/MM/YYYY', 'D/M/YYYY',
                'DD-MM-YYYY', 'D-M-YYYY',
            ];
            const m = moment(trimmed, formats, true);
            if (m.isValid())
                return m.format('D MMMM YYYY');
            return trimmed;
        }
        return input;
    }
    formatNaturalLanguage(d) {
        return moment(d).format('D MMMM YYYY');
    }
    async getBatchlog(body) {
        let res = await this.db.executeRef('batchfile_log_summery', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBatchlogDetail(body) {
        body["ref"] = 3;
        let res = await this.db.executeRef('batchfile_log_detail', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.BatchService = BatchService;
exports.BatchService = BatchService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_1.InjectQueue)('batchfile-download')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _d : Object, typeof (_e = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _e : Object, typeof (_f = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _f : Object])
], BatchService);


/***/ }),
/* 68 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(2);
const batch_service_1 = __webpack_require__(67);
const batch_interface_1 = __webpack_require__(69);
let BatchController = class BatchController {
    constructor(batchService) {
        this.batchService = batchService;
    }
    async getFilecolumn(query) {
        return await this.batchService.getFilecolumn(query);
    }
    async downloadFile(query, res) {
        return await this.batchService.downloadFile(query, res);
    }
    async getUploadedFileCols(query) {
        console.log('\n\n\n\n uploadedfilecols', query);
        return await this.batchService.getUploadedFileCols(query);
    }
    async generateBatchfile(body) {
        return await this.batchService.getfiledata(body);
    }
    async uploadBatchfile(body) {
        return await this.batchService.uploadfiledata(body);
    }
    async getBatchlog(query) {
        return await this.batchService.getBatchlog(query);
    }
    async getBatchlogDetail(query) {
        return await this.batchService.getBatchlogDetail(query);
    }
};
exports.BatchController = BatchController;
__decorate([
    (0, common_1.Get)('filecolumns'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof batch_interface_1.batchColumnReq !== "undefined" && batch_interface_1.batchColumnReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], BatchController.prototype, "getFilecolumn", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof batch_interface_1.batchDwdpathReq !== "undefined" && batch_interface_1.batchDwdpathReq) === "function" ? _d : Object, typeof (_e = typeof Response !== "undefined" && Response) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], BatchController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)('uploadedfilecols'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof batch_interface_1.batchDwdpathReq !== "undefined" && batch_interface_1.batchDwdpathReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], BatchController.prototype, "getUploadedFileCols", null);
__decorate([
    (0, common_1.Post)('getbatchfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof batch_interface_1.batchdownloadReq !== "undefined" && batch_interface_1.batchdownloadReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], BatchController.prototype, "generateBatchfile", null);
__decorate([
    (0, common_1.Post)('uploadbatchfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof batch_interface_1.batchUploadReq !== "undefined" && batch_interface_1.batchUploadReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], BatchController.prototype, "uploadBatchfile", null);
__decorate([
    (0, common_1.Get)('getbatchlog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof batch_interface_1.batchLogReq !== "undefined" && batch_interface_1.batchLogReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], BatchController.prototype, "getBatchlog", null);
__decorate([
    (0, common_1.Get)('getbatchlogdetail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof batch_interface_1.batchLogDetailReq !== "undefined" && batch_interface_1.batchLogDetailReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], BatchController.prototype, "getBatchlogDetail", null);
exports.BatchController = BatchController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('batchfile'),
    (0, common_1.Controller)('batch'),
    __metadata("design:paramtypes", [typeof (_a = typeof batch_service_1.BatchService !== "undefined" && batch_service_1.BatchService) === "function" ? _a : Object])
], BatchController);


/***/ }),
/* 69 */
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
exports.batchLogRes = exports.batchLogDetailReq = exports.batchLogReq = exports.batchdownloadRes = exports.batchUploadReq = exports.batchDwdpathReq = exports.batchColumnReq = exports.batchdownloadReq = void 0;
const swagger_1 = __webpack_require__(2);
const class_validator_1 = __webpack_require__(32);
const is_uuid_nullable_decorator_1 = __webpack_require__(33);
class batchdownloadReq {
}
exports.batchdownloadReq = batchdownloadReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{550e8400-e29b-41d4-a716-446655440000, aaae8400-e29b-41d4-a716-446655440000}', description: 'is apply to all', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "cBundleids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example.xlsx', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["Tab","cTab"],["Name","cFilename"],["Date","dIntrestDt"],["Description","cDescription"],["Page","cRefpage"],["Exhibit","cExhibitno"]', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "column", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchdownloadReq.prototype, "nMasterid", void 0);
class batchColumnReq {
}
exports.batchColumnReq = batchColumnReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchColumnReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchColumnReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchColumnReq.prototype, "nMasterid", void 0);
class batchDwdpathReq {
}
exports.batchDwdpathReq = batchDwdpathReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchDwdpathReq.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchDwdpathReq.prototype, "nMasterid", void 0);
class batchUploadReq {
}
exports.batchUploadReq = batchUploadReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchUploadReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchUploadReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchUploadReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["Tab","cTab"],["Name","cFilename"],["Date","dIntrestDt"],["Description","cDescription"],["Page","cRefpage"],["Exhibit","cExhibitno"]', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], batchUploadReq.prototype, "column", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchUploadReq.prototype, "nMasterid", void 0);
class batchdownloadRes {
}
exports.batchdownloadRes = batchdownloadRes;
class batchLogReq {
}
exports.batchLogReq = batchLogReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchLogReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchLogReq.prototype, "nMasterid", void 0);
class batchLogDetailReq {
}
exports.batchLogDetailReq = batchLogDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'is apply to all', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchLogDetailReq.prototype, "nBlogid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], batchLogDetailReq.prototype, "nMasterid", void 0);
class batchLogRes {
}
exports.batchLogRes = batchLogRes;


/***/ }),
/* 70 */
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
const nest_winston_1 = __webpack_require__(41);
const winston = __webpack_require__(40);
const fs = __webpack_require__(42);
const path = __webpack_require__(43);
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
const swagger_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(4);
const compression = __webpack_require__(5);
const cookieParser = __webpack_require__(6);
const dotenv = __webpack_require__(7);
const kafka_config_1 = __webpack_require__(8);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(10);
const indexapi_module_1 = __webpack_require__(11);
async function bootstrap() {
    const app = await core_1.NestFactory.create(indexapi_module_1.IndexModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('indexapi-group'));
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
        .setTitle('Etabella Indexing API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/indexapi' : '')
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
    try {
        process.on('uncaughtException', (error) => {
            console.log(`Uncaught Exception: ${error.message}`, error.stack, 'Bootstrap');
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.log(`Unhandled Rejection: ${reason}`, `Promise: ${promise}`, 'Bootstrap');
        });
        process.on('SIGTERM', () => {
            console.log('SIGTERM received. Cleaning up...');
            process.exit(0);
        });
        process.on('SIGINT', () => {
            console.log('SIGINT received. Shutting down gracefully...');
            process.exit(0);
        });
    }
    catch (error) {
        console.log(error);
    }
    await app.listen(configService.get('PORT_INDEXINGAPI'));
}
bootstrap();

})();

/******/ })()
;