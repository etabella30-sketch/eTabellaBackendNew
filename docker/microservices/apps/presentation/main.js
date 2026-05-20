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
exports.PresentationModule = void 0;
const common_1 = __webpack_require__(3);
const presentation_controller_1 = __webpack_require__(4);
const presentation_service_1 = __webpack_require__(5);
const global_1 = __webpack_require__(6);
const setup_module_1 = __webpack_require__(13);
const present_module_1 = __webpack_require__(34);
let PresentationModule = class PresentationModule {
};
exports.PresentationModule = PresentationModule;
exports.PresentationModule = PresentationModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule, setup_module_1.SetupModule, present_module_1.PresentModule],
        controllers: [presentation_controller_1.PresentationController],
        providers: [presentation_service_1.PresentationService],
    })
], PresentationModule);


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
exports.PresentationController = void 0;
const common_1 = __webpack_require__(3);
const presentation_service_1 = __webpack_require__(5);
let PresentationController = class PresentationController {
    constructor(presentationService) {
        this.presentationService = presentationService;
    }
    getHello() {
        return this.presentationService.getHello();
    }
};
exports.PresentationController = PresentationController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], PresentationController.prototype, "getHello", null);
exports.PresentationController = PresentationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof presentation_service_1.PresentationService !== "undefined" && presentation_service_1.PresentationService) === "function" ? _a : Object])
], PresentationController);


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentationService = void 0;
const common_1 = __webpack_require__(3);
let PresentationService = class PresentationService {
    getHello() {
        return 'Hello World! ';
    }
};
exports.PresentationService = PresentationService;
exports.PresentationService = PresentationService = __decorate([
    (0, common_1.Injectable)()
], PresentationService);


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
exports.SetupModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(14);
const setup_controller_1 = __webpack_require__(24);
const utility_service_1 = __webpack_require__(31);
const jwt_middleware_1 = __webpack_require__(32);
const setup_service_1 = __webpack_require__(26);
let SetupModule = class SetupModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(setup_controller_1.SetupController);
    }
};
exports.SetupModule = SetupModule;
exports.SetupModule = SetupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule
        ],
        controllers: [
            setup_controller_1.SetupController
        ],
        providers: [
            utility_service_1.UtilityService, setup_service_1.SetupService
        ],
    })
], SetupModule);


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
exports.SharedModule = void 0;
const db_service_1 = __webpack_require__(15);
const query_builder_service_1 = __webpack_require__(17);
const redis_db_service_1 = __webpack_require__(18);
const ioredis_1 = __webpack_require__(20);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const kafka_module_1 = __webpack_require__(21);
const kafka_shared_service_1 = __webpack_require__(23);
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kafka_module_1.KafkaModule.register('etabella-presentation', 'presentation-group'),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
        ],
        controllers: [],
        providers: [db_service_1.DbService, query_builder_service_1.QueryBuilderService, redis_db_service_1.RedisDbService,
            kafka_shared_service_1.KafkaGlobalService
        ],
        exports: [db_service_1.DbService, redis_db_service_1.RedisDbService,
            kafka_shared_service_1.KafkaGlobalService
        ]
    })
], SharedModule);


/***/ }),
/* 15 */
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
const pg_1 = __webpack_require__(16);
const query_builder_service_1 = __webpack_require__(17);
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
/* 16 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 17 */
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(19);
const ioredis_2 = __webpack_require__(20);
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
/* 19 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 21 */
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
const microservices_1 = __webpack_require__(22);
const kafka_shared_service_1 = __webpack_require__(23);
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
/* 22 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(22);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SetupController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(25);
const setup_service_1 = __webpack_require__(26);
const setup_interface_1 = __webpack_require__(27);
let SetupController = class SetupController {
    constructor(setupservice) {
        this.setupservice = setupservice;
    }
    async getsetup(query) {
        return await this.setupservice.getsetup(query);
    }
    async setsetup(body) {
        return await this.setupservice.setsetup(body);
    }
    async getType(query) {
        return await this.setupservice.getType(query);
    }
    async getsubType(query) {
        return await this.setupservice.getsubType(query);
    }
    async presentTeamUsers(query) {
        return await this.setupservice.getTeam(query);
    }
    async presentationList(query) {
        return await this.setupservice.presentationList(query);
    }
    async caseDetail(query) {
        return await this.setupservice.caseDetail(query);
    }
    async contactList(query) {
        return await this.setupservice.contactList(query);
    }
    async scheduleList(query) {
        return await this.setupservice.scheduleList(query);
    }
    async scheduleDelete(body) {
        return await this.setupservice.scheduleDelete(body);
    }
    async ongoing(query) {
        return await this.setupservice.ongoing(query);
    }
    async insert(body) {
        return await this.setupservice.insert(body);
    }
    async getPresentFiles(query) {
        return await this.setupservice.getPresents(query);
    }
    async getPresentSetUpDetail(query) {
        return await this.setupservice.getPresentsSetUpDetail(query);
    }
    async clearSchedule(body) {
        return await this.setupservice.clearSchedule(body);
    }
    async homeDetail(query) {
        return await this.setupservice.homeDetail(query);
    }
    async recentFiles(query) {
        return await this.setupservice.recentFiles(query);
    }
    async files_serial_update(body) {
        return await this.setupservice.files_serial_update(body);
    }
    async update_status(body) {
        return await this.setupservice.update_status(body);
    }
    async recentFilesIds(query) {
        return await this.setupservice.recentFilesIds(query);
    }
};
exports.SetupController = SetupController;
__decorate([
    (0, common_1.Get)('getsetup'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof setup_interface_1.getValueReq !== "undefined" && setup_interface_1.getValueReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], SetupController.prototype, "getsetup", null);
__decorate([
    (0, common_1.Post)('setsetup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof setup_interface_1.setValueReq !== "undefined" && setup_interface_1.setValueReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], SetupController.prototype, "setsetup", null);
__decorate([
    (0, common_1.Get)('getType'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof setup_interface_1.TypesReq !== "undefined" && setup_interface_1.TypesReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], SetupController.prototype, "getType", null);
__decorate([
    (0, common_1.Get)('getsubType'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof setup_interface_1.subTypesReq !== "undefined" && setup_interface_1.subTypesReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], SetupController.prototype, "getsubType", null);
__decorate([
    (0, common_1.Get)('teams/users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof setup_interface_1.TeamReq !== "undefined" && setup_interface_1.TeamReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], SetupController.prototype, "presentTeamUsers", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof setup_interface_1.PresentationReq !== "undefined" && setup_interface_1.PresentationReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], SetupController.prototype, "presentationList", null);
__decorate([
    (0, common_1.Get)('caseDetails'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof setup_interface_1.caseDetailsReq !== "undefined" && setup_interface_1.caseDetailsReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], SetupController.prototype, "caseDetail", null);
__decorate([
    (0, common_1.Get)('contactList'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof setup_interface_1.contactListReq !== "undefined" && setup_interface_1.contactListReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], SetupController.prototype, "contactList", null);
__decorate([
    (0, common_1.Get)('scheduleList'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof setup_interface_1.scheduleListReq !== "undefined" && setup_interface_1.scheduleListReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], SetupController.prototype, "scheduleList", null);
__decorate([
    (0, common_1.Delete)('scheduleDelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof setup_interface_1.scheduleDeleteReq !== "undefined" && setup_interface_1.scheduleDeleteReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], SetupController.prototype, "scheduleDelete", null);
__decorate([
    (0, common_1.Get)('ongoinglist'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof setup_interface_1.ongoinglistReq !== "undefined" && setup_interface_1.ongoinglistReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], SetupController.prototype, "ongoing", null);
__decorate([
    (0, common_1.Post)('insert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof setup_interface_1.insertReq !== "undefined" && setup_interface_1.insertReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], SetupController.prototype, "insert", null);
__decorate([
    (0, common_1.Get)('files'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof setup_interface_1.PresentationSetUpFilesReq !== "undefined" && setup_interface_1.PresentationSetUpFilesReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], SetupController.prototype, "getPresentFiles", null);
__decorate([
    (0, common_1.Get)('detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof setup_interface_1.PresentationSetUpDetailReq !== "undefined" && setup_interface_1.PresentationSetUpDetailReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], SetupController.prototype, "getPresentSetUpDetail", null);
__decorate([
    (0, common_1.Delete)('clearSchedule'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof setup_interface_1.PresentationSetUpClearScheduleReq !== "undefined" && setup_interface_1.PresentationSetUpClearScheduleReq) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], SetupController.prototype, "clearSchedule", null);
__decorate([
    (0, common_1.Get)('homedetail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof setup_interface_1.runningPresentationReq !== "undefined" && setup_interface_1.runningPresentationReq) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], SetupController.prototype, "homeDetail", null);
__decorate([
    (0, common_1.Get)('recentFiles'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof setup_interface_1.recentFilesReq !== "undefined" && setup_interface_1.recentFilesReq) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], SetupController.prototype, "recentFiles", null);
__decorate([
    (0, common_1.Post)('files_serial_update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_11 = typeof setup_interface_1.fileUpdateReq !== "undefined" && setup_interface_1.fileUpdateReq) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], SetupController.prototype, "files_serial_update", null);
__decorate([
    (0, common_1.Post)('update_status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_13 = typeof setup_interface_1.StatusUpdateReq !== "undefined" && setup_interface_1.StatusUpdateReq) === "function" ? _13 : Object]),
    __metadata("design:returntype", typeof (_14 = typeof Promise !== "undefined" && Promise) === "function" ? _14 : Object)
], SetupController.prototype, "update_status", null);
__decorate([
    (0, common_1.Get)('recentFilesIds'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_15 = typeof setup_interface_1.recentFilesidsReq !== "undefined" && setup_interface_1.recentFilesidsReq) === "function" ? _15 : Object]),
    __metadata("design:returntype", typeof (_16 = typeof Promise !== "undefined" && Promise) === "function" ? _16 : Object)
], SetupController.prototype, "recentFilesIds", null);
exports.SetupController = SetupController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('Setup'),
    (0, common_1.Controller)('present/setup'),
    __metadata("design:paramtypes", [typeof (_a = typeof setup_service_1.SetupService !== "undefined" && setup_service_1.SetupService) === "function" ? _a : Object])
], SetupController);


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

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
exports.SetupService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(15);
const redis_db_service_1 = __webpack_require__(18);
let SetupService = class SetupService {
    constructor(db, rds) {
        this.db = db;
        this.rds = rds;
        this.schema = 'present';
    }
    async getsetup(query) {
        try {
            let data = await this.rds.getValue(`present:${query.nMasterid}:${query.nCaseid}`);
            let res = data ? JSON.parse(data) : {};
            return res;
        }
        catch (error) {
        }
        return {};
    }
    async setsetup(body) {
        try {
            const previousData = await this.getsetup({ nCaseid: body.nCaseid, nMasterid: body.nMasterid });
            const obj = Object.assign(previousData, body);
            await this.rds.setValue(`present:${body.nMasterid}:${body.nCaseid}`, JSON.stringify(obj), 24 * 3600);
            return { msg: 1 };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                console.error('Validation Error:', error.getResponse());
            }
            else {
                console.error('Unhandled Error:', error.message);
            }
        }
    }
    async getType(query) {
        let res = await this.db.executeRef('present_types', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getsubType(query) {
        let res = await this.db.executeRef('present_subtypes', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getTeam(query) {
        query.ref = 2;
        let res = await this.db.executeRef('present_teamusers', query, this.schema);
        if (res.success) {
            return res.data;
        }
        else {
            return [];
        }
    }
    async presentationList(query) {
        let res = await this.db.executeRef('present_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async caseDetail(query) {
        let res = await this.db.executeRef('present_case_getinfo', query, this.schema);
        if (res.success) {
            let caseData = res.data?.[0]?.[0];
            if (!caseData) {
                return { msg: -1, value: 'No case data found' };
            }
            let res2 = await this.db.executeRef('user_permission', {
                nMasterid: query.nMasterid,
                nCaseid: query.nCaseid, cType: 'PT'
            });
            if (res2.success && res2.data?.[0]?.[0]) {
                try {
                    caseData = { ...caseData, ...res2.data[0][0] };
                }
                catch (error) {
                    console.log('error', error);
                }
            }
            return caseData;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async contactList(query) {
        let res = await this.db.executeRef('contact_list', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async scheduleList(query) {
        let res = await this.db.executeRef('present_schedule_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async scheduleDelete(body) {
        let res = await this.db.executeRef('present_schedule_delete', body, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: res.error };
        }
    }
    async ongoing(query) {
        let res = await this.db.executeRef('present_ongoing', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async insert(body) {
        try {
            let nBundledetailid = null;
            if (!body.nPresentid) {
                body.nPresentid = await this.insertPresentation(body);
            }
            if (!body.nPresentid) {
                return { msg: -1, value: 'Presentation id not found' };
            }
            if (body.nPCid) {
                await this.db.executeRef('present_update_witness', {
                    nMasterid: body.nMasterid,
                    nContactid: body.nContactid,
                    nPCid: body.nPCid,
                }, this.schema);
            }
            if (body?.jFiles?.length) {
                let bdata = await this.db.executeRef('present_insert_files', { jFiles: body.jFiles, nPresentid: body.nPresentid, nMasterid: body.nMasterid }, this.schema);
                nBundledetailid = bdata.data[0][0].nBundledetailid;
                if (body.cStatus == 'I') {
                    try {
                        await this.rds.deleteValue(`present:${body.nMasterid}:${body.nCaseid}`);
                    }
                    catch (error) {
                    }
                }
            }
            console.log('respnce', { msg: 1, nPresentid: body.nPresentid, nBundledetailid });
            return { msg: 1, nPresentid: body.nPresentid, nBundledetailid };
        }
        catch (error) {
            return { msg: -1, value: error.message };
        }
    }
    async insertPresentation(body) {
        try {
            const res = await this.db.executeRef('present_insert', {
                nMasterid: body.nMasterid,
                cName: body.cName,
                nCaseid: body.nCaseid,
                nContactid: body.nContactid || null,
                nTypeid: body.nTypeid,
                nSTypeid: body.nSTypeid || 0,
                jUsers: body.jUsers || [],
                cStatus: body.cStatus || 'I'
            }, this.schema);
            if (res.success) {
                if (res.data[0][0]["msg"] == 1) {
                    return res.data[0][0]["nPresentid"];
                }
            }
        }
        catch (error) {
            return Promise.reject({
                msg: -1,
                value: error.message
            });
        }
        return Promise.reject({
            msg: -1,
            value: 'Failed to insert'
        });
    }
    async getPresents(query) {
        let res = await this.db.executeRef('present_setup_files', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getPresentsSetUpDetail(query) {
        let res = await this.db.executeRef('present_get_setup_details', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async clearSchedule(body) {
        let res = await this.db.executeRef('present_clear_schedule', body, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: res.error };
        }
    }
    async homeDetail(query) {
        let res = await this.db.executeRef('present_home_detail', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: res.error };
        }
    }
    async recentFiles(query) {
        let res = await this.db.executeRef('present_recent_files', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async files_serial_update(body) {
        try {
            let res = await this.db.executeRef('present_setup_files_serial_update', body, this.schema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: error.message };
        }
    }
    async update_status(body) {
        try {
            let res = await this.db.executeRef('present_update_status', body, this.schema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: error.message };
        }
    }
    async recentFilesIds(query) {
        let res = await this.db.executeRef('present_recent_files_ids', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return [];
        }
    }
};
exports.SetupService = SetupService;
exports.SetupService = SetupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object])
], SetupService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.recentFilesidsReq = exports.StatusUpdateReq = exports.fileUpdateReq = exports.recentFilesReq = exports.runningPresentationReq = exports.ongoinglistReq = exports.scheduleListReq = exports.contactListReq = exports.caseDetailsReq = exports.PresentationSetUpClearScheduleReq = exports.PresentationSetUpDetailReq = exports.PresentationSetUpFilesReq = exports.insertReq = exports.scheduleDeleteReq = exports.PresentationReq = exports.TeamReq = exports.subTypesReq = exports.TypesReq = exports.getValueReq = exports.setValueReq = void 0;
const swagger_1 = __webpack_require__(25);
const class_transformer_1 = __webpack_require__(28);
const class_validator_1 = __webpack_require__(29);
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
class setValueReq {
}
exports.setValueReq = setValueReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unic id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], setValueReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], setValueReq.prototype, "nTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'G/P', description: 'Public/Private type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], setValueReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Sub Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], setValueReq.prototype, "nSTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F/W/C', description: 'File/Witness/Core type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], setValueReq.prototype, "cSType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], setValueReq.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Presentation name', description: 'Presentation name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], setValueReq.prototype, "cName", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], setValueReq.prototype, "nMasterid", void 0);
class getValueReq {
}
exports.getValueReq = getValueReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Caseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getValueReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getValueReq.prototype, "nMasterid", void 0);
class TypesReq {
}
exports.TypesReq = TypesReq;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TypesReq.prototype, "nMasterid", void 0);
class subTypesReq {
}
exports.subTypesReq = subTypesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Caseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], subTypesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], subTypesReq.prototype, "nMasterid", void 0);
class TeamReq {
}
exports.TeamReq = TeamReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'G/P', description: 'Public/Private type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TeamReq.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamReq.prototype, "nMasterid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], TeamReq.prototype, "ref", void 0);
class PresentationReq {
}
exports.PresentationReq = PresentationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nTypeid' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nTypeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], PresentationReq.prototype, "nTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSubtypeid' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], PresentationReq.prototype, "nSubtypeid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationReq.prototype, "nMasterid", void 0);
class scheduleDeleteReq {
}
exports.scheduleDeleteReq = scheduleDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPCid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], scheduleDeleteReq.prototype, "nPCid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], scheduleDeleteReq.prototype, "nMasterid", void 0);
class FileDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle detail ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileDetail.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileDetail.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'Type of the file' }),
    (0, class_validator_1.IsString)({ message: 'type must be a string' }),
    __metadata("design:type", String)
], FileDetail.prototype, "type", void 0);
class insertReq {
}
exports.insertReq = insertReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unic id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], insertReq.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Presentation name', description: 'Presentation name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], insertReq.prototype, "cName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Contact id' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPCid id' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertReq.prototype, "nPCid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], insertReq.prototype, "nTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Sub Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], insertReq.prototype, "nSTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], insertReq.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            { nBundledetailid: 1, nBundleid: 2, cType: 'D' },
            { nBundledetailid: 1, nBundleid: 2, cType: 'D' },
        ],
        description: 'Array of file details',
        type: [FileDetail],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FileDetail),
    __metadata("design:type", Array)
], insertReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertReq.prototype, "nMasterid", void 0);
class PresentationSetUpFilesReq {
}
exports.PresentationSetUpFilesReq = PresentationSetUpFilesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpFilesReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Tab', description: 'Sort by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresentationSetUpFilesReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASC', description: 'Sort type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresentationSetUpFilesReq.prototype, "cSorttype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpFilesReq.prototype, "nMasterid", void 0);
class PresentationSetUpDetailReq {
}
exports.PresentationSetUpDetailReq = PresentationSetUpDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpDetailReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpDetailReq.prototype, "nMasterid", void 0);
class PresentationSetUpClearScheduleReq {
}
exports.PresentationSetUpClearScheduleReq = PresentationSetUpClearScheduleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPresentid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpClearScheduleReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentationSetUpClearScheduleReq.prototype, "nMasterid", void 0);
class caseDetailsReq {
}
exports.caseDetailsReq = caseDetailsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseDetailsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseDetailsReq.prototype, "nMasterid", void 0);
class contactListReq {
}
exports.contactListReq = contactListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], contactListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'W', description: 'cType' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], contactListReq.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], contactListReq.prototype, "nMasterid", void 0);
class scheduleListReq {
}
exports.scheduleListReq = scheduleListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], scheduleListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], scheduleListReq.prototype, "nMasterid", void 0);
class ongoinglistReq {
}
exports.ongoinglistReq = ongoinglistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ongoinglistReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ongoinglistReq.prototype, "nMasterid", void 0);
class runningPresentationReq {
}
exports.runningPresentationReq = runningPresentationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], runningPresentationReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], runningPresentationReq.prototype, "nMasterid", void 0);
class recentFilesReq {
}
exports.recentFilesReq = recentFilesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesReq.prototype, "nTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesReq.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nLimit must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesReq.prototype, "nLimit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesReq.prototype, "nSubtypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-23', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "dStartDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-25', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "dEndDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "searchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "cPname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "cSortby", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFilesReq.prototype, "nMasterid", void 0);
class UpdateSerialDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nPDid ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UpdateSerialDetail.prototype, "nPDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSerial', required: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nSerial must be a number' }),
    __metadata("design:type", Number)
], UpdateSerialDetail.prototype, "nSerial", void 0);
class fileUpdateReq {
}
exports.fileUpdateReq = fileUpdateReq;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            { nPDid: 10, nSerial: 1 },
            { nPDid: 11, nSerial: 2 },
        ],
        description: 'Array of file list',
        type: [UpdateSerialDetail],
    }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateSerialDetail),
    __metadata("design:type", Array)
], fileUpdateReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileUpdateReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileUpdateReq.prototype, "nMasterid", void 0);
class StatusUpdateReq {
}
exports.StatusUpdateReq = StatusUpdateReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'status' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StatusUpdateReq.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], StatusUpdateReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], StatusUpdateReq.prototype, "nMasterid", void 0);
class recentFilesidsReq {
}
exports.recentFilesidsReq = recentFilesidsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1093, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'Typeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesidsReq.prototype, "nTypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nSubtypeid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], recentFilesidsReq.prototype, "nSubtypeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-23', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "dStartDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2024-12-25', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "dEndDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "searchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "cPname", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFilesidsReq.prototype, "nMasterid", void 0);


/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 30 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(28);
const class_validator_1 = __webpack_require__(29);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(23);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        console.log(data, topic);
        this.kafka.sendMessage((topic ? topic : 'presentation'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(33);
const redis_db_service_1 = __webpack_require__(18);
const config_1 = __webpack_require__(9);
const db_service_1 = __webpack_require__(15);
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
/* 33 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 34 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(14);
const present_controller_1 = __webpack_require__(35);
const jwt_middleware_1 = __webpack_require__(32);
const present_service_1 = __webpack_require__(37);
const utility_service_1 = __webpack_require__(31);
let PresentModule = class PresentModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(present_controller_1.PresentController);
    }
};
exports.PresentModule = PresentModule;
exports.PresentModule = PresentModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [present_controller_1.PresentController],
        providers: [present_service_1.PresentService, utility_service_1.UtilityService],
    })
], PresentModule);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(25);
const present_interface_1 = __webpack_require__(36);
const present_service_1 = __webpack_require__(37);
let PresentController = class PresentController {
    constructor(presentService) {
        this.presentService = presentService;
        this.allowedDomains = ['etabella.com', 'etabella.legal', 'localhost:4200'];
        this.defaultDomain = 'etabella.com';
    }
    async getPresentDetail(query) {
        return await this.presentService.getPresentDetail(query);
    }
    async requestToJoin(body) {
        return await this.presentService.requestToJoin(body);
    }
    async userJoined(body) {
        return await this.presentService.userJoined(body);
    }
    async getPresentToolDetail(query) {
        return await this.presentService.getPresentToolDetail(query);
    }
    async getPresentUsers(query) {
        return await this.presentService.getPresentUsers(query);
    }
    async manageUser(body, req) {
        const domain = this.getDomain(req);
        return await this.presentService.managePresentUser(body, domain);
    }
    async manageStatus(body, req) {
        const domain = this.getDomain(req);
        return await this.presentService.managePresentStatus(body, domain);
    }
    async manageUserReq(body) {
        return await this.presentService.manageUserRequest(body);
    }
    async endPresentation(body) {
        return await this.presentService.endPresentation(body);
    }
    async getTabs(query) {
        return await this.presentService.getTabs(query);
    }
    async highlights(query) {
        return await this.presentService.getPresentHighlights(query);
    }
    async highlightSave(body) {
        return await this.presentService.saveHighlight(body);
    }
    async highlightDelete(body) {
        return await this.presentService.deleteHighlight(body);
    }
    async highlightColorChange(body) {
        return await this.presentService.updateHighlightColor(body);
    }
    async unsavePresentHighlights(body) {
        return await this.presentService.unsaveHighlights(body);
    }
    async getPresentDocPosition(query) {
        return await this.presentService.getPresentDocPosition(query);
    }
    async presentManageDocs(body) {
        return await this.presentService.manageDocs(body);
    }
    async getOnlineUsers(query) {
        return await this.presentService.getOnlineUsers(query);
    }
    async shareLinks(body) {
        return await this.presentService.shareLinks(body);
    }
    async getSharedLinksList(query) {
        return await this.presentService.getSharedLinksList(query);
    }
    async getShareByPresenterLinks(query) {
        return await this.presentService.getShareByPresenterLinks(query);
    }
    async getRemarkList(query) {
        return await this.presentService.getRemarkList(query);
    }
    async insertRemarks(body) {
        return await this.presentService.insertRemark(body);
    }
    async getRunningScreeShare(query) {
        return await this.presentService.getRunningScreeShare(query);
    }
    async getPresentationDetail(query) {
        return await this.presentService.getPresentDetailOnRefresh(query);
    }
    async getTurnConfig() {
        return await this.presentService.getTurnConfig();
    }
    getDomain(req) {
        try {
            const host = req.headers['host'];
            const origin = req.headers['origin'];
            let domain = '';
            if (host) {
                domain = host.split(':')[0];
            }
            else if (origin) {
                domain = origin.replace(/^https?:\/\//, '').split('/')[0];
            }
            if (this.allowedDomains.includes(domain)) {
                return domain;
            }
            return this.defaultDomain;
        }
        catch (error) {
            console.error('Error determining domain:', error.message);
            return this.defaultDomain;
        }
    }
    getHello() {
        return { msg: 1 };
    }
};
exports.PresentController = PresentController;
__decorate([
    (0, common_1.Get)('individual/detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof present_interface_1.presetnTabsReq !== "undefined" && present_interface_1.presetnTabsReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], PresentController.prototype, "getPresentDetail", null);
__decorate([
    (0, common_1.Post)('individual/request/join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof present_interface_1.joinRequestReq !== "undefined" && present_interface_1.joinRequestReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], PresentController.prototype, "requestToJoin", null);
__decorate([
    (0, common_1.Post)('individual/joined'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof present_interface_1.joinRequestReq !== "undefined" && present_interface_1.joinRequestReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], PresentController.prototype, "userJoined", null);
__decorate([
    (0, common_1.Get)('tool/detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof present_interface_1.presentToolReq !== "undefined" && present_interface_1.presentToolReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], PresentController.prototype, "getPresentToolDetail", null);
__decorate([
    (0, common_1.Get)('tool/users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof present_interface_1.presentToolReq !== "undefined" && present_interface_1.presentToolReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], PresentController.prototype, "getPresentUsers", null);
__decorate([
    (0, common_1.Post)('tool/manage/user'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof present_interface_1.managePresentUserReq !== "undefined" && present_interface_1.managePresentUserReq) === "function" ? _m : Object, typeof (_o = typeof Request !== "undefined" && Request) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], PresentController.prototype, "manageUser", null);
__decorate([
    (0, common_1.Post)('tool/manage/status'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof present_interface_1.managePresentStatusReq !== "undefined" && present_interface_1.managePresentStatusReq) === "function" ? _q : Object, typeof (_r = typeof Request !== "undefined" && Request) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], PresentController.prototype, "manageStatus", null);
__decorate([
    (0, common_1.Post)('tool/manage/request'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof present_interface_1.manageUserReq !== "undefined" && present_interface_1.manageUserReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], PresentController.prototype, "manageUserReq", null);
__decorate([
    (0, common_1.Post)('end'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof present_interface_1.managePresentStatusReq !== "undefined" && present_interface_1.managePresentStatusReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], PresentController.prototype, "endPresentation", null);
__decorate([
    (0, common_1.Get)('nav/tabs'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof present_interface_1.presetnTabsReq !== "undefined" && present_interface_1.presetnTabsReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], PresentController.prototype, "getTabs", null);
__decorate([
    (0, common_1.Get)('highlight/list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof present_interface_1.persentHighlightsReq !== "undefined" && present_interface_1.persentHighlightsReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], PresentController.prototype, "highlights", null);
__decorate([
    (0, common_1.Post)('highlight/save'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof present_interface_1.SaveHighlightReq !== "undefined" && present_interface_1.SaveHighlightReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], PresentController.prototype, "highlightSave", null);
__decorate([
    (0, common_1.Post)('highlight/delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof present_interface_1.deleteHighlightReq !== "undefined" && present_interface_1.deleteHighlightReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], PresentController.prototype, "highlightDelete", null);
__decorate([
    (0, common_1.Post)('highlight/color/change'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof present_interface_1.colorChangeHighlightReq !== "undefined" && present_interface_1.colorChangeHighlightReq) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], PresentController.prototype, "highlightColorChange", null);
__decorate([
    (0, common_1.Post)('highlight/unsave'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof present_interface_1.unsaveHighlightsReq !== "undefined" && present_interface_1.unsaveHighlightsReq) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], PresentController.prototype, "unsavePresentHighlights", null);
__decorate([
    (0, common_1.Get)('doc/position'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof present_interface_1.presentDocPositionReq !== "undefined" && present_interface_1.presentDocPositionReq) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], PresentController.prototype, "getPresentDocPosition", null);
__decorate([
    (0, common_1.Post)('manage/docs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_11 = typeof present_interface_1.persentManageDocReq !== "undefined" && present_interface_1.persentManageDocReq) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], PresentController.prototype, "presentManageDocs", null);
__decorate([
    (0, common_1.Get)('online/users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_13 = typeof present_interface_1.onlineUserReq !== "undefined" && present_interface_1.onlineUserReq) === "function" ? _13 : Object]),
    __metadata("design:returntype", typeof (_14 = typeof Promise !== "undefined" && Promise) === "function" ? _14 : Object)
], PresentController.prototype, "getOnlineUsers", null);
__decorate([
    (0, common_1.Post)('share/links'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_15 = typeof present_interface_1.shareLinkReq !== "undefined" && present_interface_1.shareLinkReq) === "function" ? _15 : Object]),
    __metadata("design:returntype", typeof (_16 = typeof Promise !== "undefined" && Promise) === "function" ? _16 : Object)
], PresentController.prototype, "shareLinks", null);
__decorate([
    (0, common_1.Get)('share/links/list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_17 = typeof present_interface_1.getShareLinkListReq !== "undefined" && present_interface_1.getShareLinkListReq) === "function" ? _17 : Object]),
    __metadata("design:returntype", typeof (_18 = typeof Promise !== "undefined" && Promise) === "function" ? _18 : Object)
], PresentController.prototype, "getSharedLinksList", null);
__decorate([
    (0, common_1.Get)('share/links/sharedbypresenter'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_19 = typeof present_interface_1.getShareLinkListByPresenterReq !== "undefined" && present_interface_1.getShareLinkListByPresenterReq) === "function" ? _19 : Object]),
    __metadata("design:returntype", typeof (_20 = typeof Promise !== "undefined" && Promise) === "function" ? _20 : Object)
], PresentController.prototype, "getShareByPresenterLinks", null);
__decorate([
    (0, common_1.Get)('remark/list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_21 = typeof Promise !== "undefined" && Promise) === "function" ? _21 : Object)
], PresentController.prototype, "getRemarkList", null);
__decorate([
    (0, common_1.Post)('remark/insert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_22 = typeof present_interface_1.remarksInsertReq !== "undefined" && present_interface_1.remarksInsertReq) === "function" ? _22 : Object]),
    __metadata("design:returntype", typeof (_23 = typeof Promise !== "undefined" && Promise) === "function" ? _23 : Object)
], PresentController.prototype, "insertRemarks", null);
__decorate([
    (0, common_1.Get)('running/screenshare'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_24 = typeof present_interface_1.getRunningScreenShareReq !== "undefined" && present_interface_1.getRunningScreenShareReq) === "function" ? _24 : Object]),
    __metadata("design:returntype", typeof (_25 = typeof Promise !== "undefined" && Promise) === "function" ? _25 : Object)
], PresentController.prototype, "getRunningScreeShare", null);
__decorate([
    (0, common_1.Get)('detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_26 = typeof present_interface_1.getPresentDetailReq !== "undefined" && present_interface_1.getPresentDetailReq) === "function" ? _26 : Object]),
    __metadata("design:returntype", typeof (_27 = typeof Promise !== "undefined" && Promise) === "function" ? _27 : Object)
], PresentController.prototype, "getPresentationDetail", null);
__decorate([
    (0, common_1.Get)('turn/config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_28 = typeof Promise !== "undefined" && Promise) === "function" ? _28 : Object)
], PresentController.prototype, "getTurnConfig", null);
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], PresentController.prototype, "getHello", null);
exports.PresentController = PresentController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('present'),
    (0, common_1.Controller)('present'),
    __metadata("design:paramtypes", [typeof (_a = typeof present_service_1.PresentService !== "undefined" && present_service_1.PresentService) === "function" ? _a : Object])
], PresentController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.unsaveHighlightsReq = exports.getPresentDetailReq = exports.getRunningScreenShareReq = exports.remarksInsertReq = exports.getShareLinkListByPresenterReq = exports.getShareLinkListReq = exports.shareLinkReq = exports.onlineUserReq = exports.persentManageDocReq = exports.persentHighlightsReq = exports.colorChangeHighlightReq = exports.deleteHighlightReq = exports.presentDocPositionReq = exports.joinRequestReq = exports.manageUserReq = exports.managePresentStatusReq = exports.managePresentUserReq = exports.presentToolReq = exports.SaveHighlightReq = exports.presetnTabsReq = exports.presentEvents = void 0;
const swagger_1 = __webpack_require__(25);
const class_validator_1 = __webpack_require__(29);
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
class presentEvents {
}
exports.presentEvents = presentEvents;
class presetnTabsReq {
}
exports.presetnTabsReq = presetnTabsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presetnTabsReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presetnTabsReq.prototype, "nMasterid", void 0);
class Rects {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'The x-coordinate of the rectangle' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Rects.prototype, "x", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'The y-coordinate of the rectangle' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Rects.prototype, "y", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'The width of the rectangle' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Rects.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'The height of the rectangle' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], Rects.prototype, "height", void 0);
class SaveHighlightReq {
}
exports.SaveHighlightReq = SaveHighlightReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Unique identifier' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'highlight', description: 'Highlight type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'The width of the rectangle' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveHighlightReq.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            { x: 107.94, y: 632.95, width: 415.41, height: 12.4 },
            { x: 107.94, y: 680.55, width: 192.8, height: 27.2 }
        ],
        description: 'Array of rectangle objects',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "rects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            ["76.61", "106.64"],
            ["77.85", "106.64"]
        ],
        description: 'Array of line coordinates',
        required: false
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number of the highlight' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], SaveHighlightReq.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SaveHighlightReq.prototype, "nMasterid", void 0);
class presentToolReq {
}
exports.presentToolReq = presentToolReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presentToolReq.prototype, "nPresentid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], presentToolReq.prototype, "ref", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presentToolReq.prototype, "nMasterid", void 0);
class managePresentUserReq {
}
exports.managePresentUserReq = managePresentUserReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], managePresentUserReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], managePresentUserReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N/E/D', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], managePresentUserReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], managePresentUserReq.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], managePresentUserReq.prototype, "nMasterid", void 0);
class managePresentStatusReq {
}
exports.managePresentStatusReq = managePresentStatusReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], managePresentStatusReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], managePresentStatusReq.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], managePresentStatusReq.prototype, "nMasterid", void 0);
class manageUserReq {
}
exports.manageUserReq = manageUserReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], manageUserReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], manageUserReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], manageUserReq.prototype, "cStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], manageUserReq.prototype, "nMasterid", void 0);
class joinRequestReq {
}
exports.joinRequestReq = joinRequestReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], joinRequestReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], joinRequestReq.prototype, "nMasterid", void 0);
class presentDocPositionReq {
}
exports.presentDocPositionReq = presentDocPositionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presentDocPositionReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presentDocPositionReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], presentDocPositionReq.prototype, "nMasterid", void 0);
class deleteHighlightReq {
}
exports.deleteHighlightReq = deleteHighlightReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteHighlightReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], deleteHighlightReq.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'page of the present item' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], deleteHighlightReq.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteHighlightReq.prototype, "nMasterid", void 0);
class colorChangeHighlightReq {
}
exports.colorChangeHighlightReq = colorChangeHighlightReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], colorChangeHighlightReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'add1c8de-1303-43b3-a26f-ba2f9dad0b97', description: 'Unique identifier' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], colorChangeHighlightReq.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Color of the present item' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], colorChangeHighlightReq.prototype, "cColor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], colorChangeHighlightReq.prototype, "nMasterid", void 0);
class persentHighlightsReq {
}
exports.persentHighlightsReq = persentHighlightsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], persentHighlightsReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], persentHighlightsReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], persentHighlightsReq.prototype, "nMasterid", void 0);
class persentManageDocReq {
}
exports.persentManageDocReq = persentManageDocReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], persentManageDocReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Share bundledetail ids', required: false }),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], persentManageDocReq.prototype, "jBd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N/E/D', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], persentManageDocReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], persentManageDocReq.prototype, "nMasterid", void 0);
class onlineUserReq {
}
exports.onlineUserReq = onlineUserReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], onlineUserReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], onlineUserReq.prototype, "nMasterid", void 0);
class shareLinkReq {
}
exports.shareLinkReq = shareLinkReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareLinkReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareLinkReq.prototype, "nAId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareLinkReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Number)
], shareLinkReq.prototype, "bIsWithLink", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N/E/D', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], shareLinkReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareLinkReq.prototype, "nMasterid", void 0);
class getShareLinkListReq {
}
exports.getShareLinkListReq = getShareLinkListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListReq.prototype, "nMasterid", void 0);
class getShareLinkListByPresenterReq {
}
exports.getShareLinkListByPresenterReq = getShareLinkListByPresenterReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListByPresenterReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListByPresenterReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getShareLinkListByPresenterReq.prototype, "nMasterid", void 0);
class remarksInsertReq {
}
exports.remarksInsertReq = remarksInsertReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], remarksInsertReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], remarksInsertReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], remarksInsertReq.prototype, "nAId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], remarksInsertReq.prototype, "nRemarkid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], remarksInsertReq.prototype, "nMasterid", void 0);
class getRunningScreenShareReq {
}
exports.getRunningScreenShareReq = getRunningScreenShareReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getRunningScreenShareReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getRunningScreenShareReq.prototype, "nMasterid", void 0);
class getPresentDetailReq {
}
exports.getPresentDetailReq = getPresentDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getPresentDetailReq.prototype, "nPresentid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getPresentDetailReq.prototype, "nMasterid", void 0);
class unsaveHighlightsReq {
}
exports.unsaveHighlightsReq = unsaveHighlightsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the present item' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unsaveHighlightsReq.prototype, "nPresentid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'ID of the master item', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unsaveHighlightsReq.prototype, "nMasterid", void 0);


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
exports.PresentService = void 0;
const common_1 = __webpack_require__(3);
const redis_db_service_1 = __webpack_require__(18);
const db_service_1 = __webpack_require__(15);
const utility_service_1 = __webpack_require__(31);
let PresentService = class PresentService {
    constructor(db, rds, utility) {
        this.db = db;
        this.rds = rds;
        this.utility = utility;
        this.presentation = 'presentation';
        this.presentationTools = 'presentation-tools';
        this.presentHighlights = 'present-highlights';
        this.schema = 'present';
    }
    async getPresentDetail(query) {
        let res = await this.db.executeRef('present_individual_detail', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getPresentToolDetail(query) {
        let res = await this.db.executeRef('present_toolbar_detail', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getPresentUsers(query) {
        query.ref = 2;
        let res = await this.db.executeRef('present_toolbar_users', query, this.schema);
        if (res.success) {
            try {
                const users = await this.rds.getAllUserIds(query.nPresentid);
                res.data[1].map(a => a.isLive = users.includes(a.nUserid));
            }
            catch (error) {
                console.error(error);
            }
            return res.data;
        }
        else {
            return [];
        }
    }
    async managePresentUser(query, domain) {
        let res = await this.db.executeRef('present_insertupdate_users', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (!['I', 'B'].includes(cPresentStatus)) {
                    try {
                        this.utility.emit({
                            event: 'USER-MANAGE',
                            data: {
                                nPresentid: query.nPresentid,
                                cStatus: query.cStatus,
                                nUserid: query.nUserid,
                                cPermission: query.cPermission
                            }
                        }, this.presentationTools);
                        this.utility.emit({
                            event: 'USER-COUNT-UPDATED',
                            data: {
                                nPresentid: query.nPresentid,
                                nTotal: res.data[0][0]["nTotal"]
                            }
                        }, this.presentation);
                    }
                    catch (error) {
                    }
                    try {
                        if (query.cStatus == 'A' && query.cPermission == 'N') {
                            const presentmsg = await this.db.executeRef('present_user_list', { nPresentid: query.nPresentid, nMasterid: query.nMasterid, nUserid: query.nUserid }, this.schema);
                            if (presentmsg.success) {
                                for (let x of presentmsg.data[0]) {
                                    this.utility.emit({
                                        ...x,
                                        cType: 'PRESENT-USER-ADDED',
                                        action: `https://${domain}/individual/doc/${encodeURIComponent(`[[],${x.nCaseid},${x.nPresentid}]`)}`,
                                        cTitle: 'You’ve Been Added to a Presentation',
                                        cMsg: `You have been added to the presentation${x.cName ? ` '${x.cName}'` : ''} for the case '${x.cCasename}' (Case No: ${x.cCaseno}) by ${x.cCreator}.`
                                    }, 'notification');
                                }
                            }
                        }
                    }
                    catch (error) {
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async managePresentStatus(query, domain) {
        debugger;
        let res = await this.db.executeRef('present_manage_status', query, this.schema);
        if (res.success) {
            if (res.data[0][0]["msg"] == 1) {
                try {
                    this.utility.emit({
                        event: query.cStatus == 'P' ? 'PAUSED' : query.cStatus == 'E' ? 'END' : 'LIVE',
                        data: {
                            nPresentid: query.nPresentid,
                            cStatus: query.cStatus
                        }
                    }, this.presentation);
                    this.rds.setValue(`PRESENT:${query.nPresentid}:STATUS`, query.cStatus, 24 * 3600);
                }
                catch (error) {
                    console.error(error);
                }
                try {
                    if (res.data[0][0]["isStarted"]) {
                        this.updatePresentList({ nPresentid: query.nPresentid, nMasterid: query.nMasterid, event: 'LIVE' }, domain);
                    }
                }
                catch (error) {
                    console.error(error);
                }
            }
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async updatePresentList({ nPresentid, nMasterid, event }, domain) {
        try {
            const res = await this.db.executeRef('present_user_list', { nPresentid, nMasterid }, this.schema);
            if (res.success) {
                for (let x of res.data[0]) {
                    try {
                        this.utility.emit({
                            event,
                            data: {
                                nPresentid,
                                nUserid: x.nUserid,
                            }
                        }, this.presentationTools);
                    }
                    catch (error) {
                    }
                    try {
                        if (event == 'LIVE') {
                            this.utility.emit({
                                ...x,
                                cType: 'PRESENT-START',
                                action: `https://${domain}/individual/doc/${encodeURIComponent(`[[],${x.nCaseid},${x.nPresentid}]`)}`,
                                cTitle: 'PRESENTATION STARTED',
                                cMsg: `A new presentation${x.cName ? ` '${x.cName}'` : ''} has started for the case '${x.cCasename}' (Case No: ${x.cCaseno}), initiated by ${x.cCreator}.`
                            }, 'notification');
                        }
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }
        }
        catch (error) {
        }
    }
    async endPresentation(query) {
        let res = await this.db.executeRef('present_manage_status', query, this.schema);
        if (res.success) {
            try {
                this.utility.emit({
                    event: 'END',
                    data: {
                        nPresentid: query.nPresentid,
                        cStatus: 'E'
                    }
                }, this.presentation);
                this.rds.setValue(`PRESENT:${query.nPresentid}:STATUS`, query.cStatus, 24 * 3600);
            }
            catch (error) {
                console.error(error);
            }
            try {
                this.updatePresentList({ nPresentid: query.nPresentid, nMasterid: query.nMasterid, event: 'END' });
            }
            catch (error) {
                console.error(error);
            }
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getTabs(query) {
        debugger;
        let res = await this.db.executeRef('present_individual_tabs', query, this.schema);
        if (res.success) {
            let files = [...res.data[0]];
            try {
                const presentDetail = await this.db.executeRef('present_individual_detail', { nPresentid: query.nPresentid, nMasterid: query.nMasterid }, this.schema);
                const isHost = presentDetail.data[0][0]["isHost"];
                const redisData = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:TAB`));
                if (redisData) {
                    if (!isHost) {
                        files = files.filter(a => a.nBundledetailid == redisData.nBundledetailid);
                        if (!files?.length) {
                            files = [res.data[0][0]];
                        }
                    }
                    else {
                        files.map(a => a.isActivate = (a.nBundledetailid == redisData.nBundledetailid));
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
            return files;
        }
        else {
            return [];
        }
    }
    async getPresentHighlights(query) {
        let res = await this.db.executeRef('present_highlights', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async saveHighlight(query) {
        let res = await this.db.executeRef('present_highlights_insert', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (cPresentStatus == 'L') {
                    this.utility.emit({
                        event: 'PRESENT-HIGHLIGHT-ADDED',
                        data: {
                            nPresentid: query.nPresentid,
                            uuid: query.uuid,
                            type: query.type,
                            width: query.width,
                            rects: JSON.parse(query.rects || '[]'),
                            lines: JSON.parse(query.lines || '[]'),
                            page: query.page,
                            nAId: res.data[0][0]["nAId"],
                            linktype: 'P'
                        }
                    }, this.presentHighlights);
                }
            }
            catch (error) {
                console.error(error);
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async deleteHighlight(query) {
        let res = await this.db.executeRef('present_highlights_delete', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (cPresentStatus == 'L') {
                    this.utility.emit({
                        event: 'PRESENT-HIGHLIGHT-DELETED',
                        data: {
                            nPresentid: query.nPresentid,
                            uuid: query.uuid,
                            page: query.page,
                            nAId: res.data[0][0]["nAId"]
                        }
                    }, this.presentHighlights);
                }
            }
            catch (error) {
                console.error(error);
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async manageUserRequest(query) {
        let res = await this.db.executeRef('present_toolbar_user_accept_reject', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (!['I', 'B'].includes(cPresentStatus)) {
                    this.utility.emit({
                        event: 'REQ-MANAGE',
                        data: {
                            nPresentid: query.nPresentid,
                            cStatus: query.cStatus,
                            nUserid: query.nUserid,
                            isHaveHighlight: res.data[0][0]["isHaveHighlight"]
                        }
                    }, this.presentationTools);
                }
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async requestToJoin(query) {
        let res = await this.db.executeRef('present_toolbar_user_ask_for_join', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (cPresentStatus == 'L') {
                    this.utility.emit({
                        event: 'ASK-REQ',
                        data: {
                            nPresentid: query.nPresentid,
                            nAskby: query.nMasterid,
                            nUserid: res.data[0][0].nUserid
                        }
                    }, this.presentationTools);
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async userJoined(query) {
        try {
            let res = await this.db.executeRef('present_toolbar_user_joined', query, this.schema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1 };
            }
        }
        catch (error) {
            return { msg: -1, error };
        }
    }
    async getPresentDocPosition(query) {
        try {
            const res = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:POSITION:${query.nBundledetailid}`));
            if (res.nBundledetailid)
                return res;
        }
        catch (error) {
        }
        return {};
    }
    async manageDocs(query) {
        let res = await this.db.executeRef('present_manage_documents', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async updateHighlightColor(query) {
        let res = await this.db.executeRef('present_highlights_update_color', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (cPresentStatus == 'L') {
                    this.utility.emit({
                        event: 'PRESENT-HIGHLIGHT-COLOR-CHANGE',
                        data: {
                            nPresentid: query.nPresentid,
                            uuid: query.uuid,
                            cColor: query.cColor,
                            nAId: res.data[0][0]["nAId"]
                        }
                    }, this.presentHighlights);
                }
            }
            catch (error) {
                console.error(error);
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async presentStatus(nPresentid) {
        try {
            const status = await this.rds.getValue(`PRESENT:${nPresentid}:STATUS`);
            if (!status) {
                const res = await this.db.executeRef('present_status', { nPresentid }, this.schema);
                if (res.success) {
                    const status = res.data[0][0]["cStatus"];
                    this.rds.setValue(`PRESENT:${nPresentid}:STATUS`, status, 24 * 3600);
                    return status;
                }
            }
            return status;
        }
        catch (error) {
            console.error(error);
        }
        return null;
    }
    async getOnlineUsers(query) {
        try {
            const users = await this.rds.getAllUserIds(query.nPresentid) || [];
            return { msg: 1, users: users.filter(a => a != query.nMasterid) };
        }
        catch (error) {
            console.error(error);
        }
        return { msg: -1 };
    }
    async shareLinks(query) {
        let res = await this.db.executeRef('present_link_share', query, this.schema);
        if (res.success) {
            try {
                const cPresentStatus = await this.presentStatus(query.nPresentid);
                if (cPresentStatus == 'L') {
                    this.utility.emit({
                        event: 'PRESENT-LINK-SHARED',
                        data: {
                            nPresentid: query.nPresentid,
                            cPermission: query.cPermission,
                            nBundledetailid: query.nBundledetailid,
                            nAId: query.nAId,
                            annot: res.data[0][0] || {}
                        }
                    }, this.presentHighlights);
                }
            }
            catch (error) {
                console.error(error);
            }
            return { msg: 1 };
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async getSharedLinksList(query) {
        let res = await this.db.executeRef('present_highlights_shared', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async getShareByPresenterLinks(query) {
        query["ref"] = 2;
        let res = await this.db.executeRef('present_shared_link', query, this.schema);
        if (res.success) {
            return res.data;
        }
        else {
            return [];
        }
    }
    async getRemarkList(query) {
        let res = await this.db.executeRef('present_remark_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async insertRemark(query) {
        let res = await this.db.executeRef('present_remark_insert', query, this.schema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, error: res?.error };
        }
    }
    async getRunningScreeShare(query) {
        try {
            const value = JSON.parse(await this.rds.getValue(`PRESENT:${query.nPresentid}:SCREEN:SHARE`));
            if (value?.nPresentid) {
                return { msg: 1 };
            }
            return { msg: -1 };
        }
        catch (error) {
            return { msg: -1, error };
        }
    }
    async getPresentDetailOnRefresh(query) {
        debugger;
        try {
            const rows = await this.db.rowQuery(`select * from ${this.schema}."PresentationMaster" where "nPresentid" = '${query.nPresentid}' and "nCreateid" = '${query.nMasterid}'`, []);
            try {
                if (rows?.data?.length) {
                    await this.rds.deleteValue(`PRESENT:${query.nPresentid}:COMPARE`);
                    await this.rds.deleteValue(`PRESENT:${query.nPresentid}:COMPARE:DATA`);
                }
            }
            catch (error) {
            }
            const file = await this.rds.getValue(`PRESENT:${query.nPresentid}:TAB`);
            const compareState = await this.rds.getValue(`PRESENT:${query.nPresentid}:COMPARE`);
            const compareData = await this.rds.getValue(`PRESENT:${query.nPresentid}:COMPARE:DATA`);
            const status = await this.rds.getValue(`PRESENT:${query.nPresentid}:STATUS`);
            return {
                msg: 1,
                file: file ? JSON.parse(file) : null,
                compareState: compareState ? JSON.parse(compareState) : null,
                compareData: compareData ? JSON.parse(compareData) : null,
                status: status ? status : null
            };
        }
        catch (error) {
            console.log(error);
            return { msg: -1, error };
        }
    }
    async unsaveHighlights(query) {
        try {
            let res = await this.db.executeRef('present_unsave_highlights', query, this.schema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1 };
            }
        }
        catch (error) {
            return { msg: -1 };
        }
    }
    async getTurnConfig() {
        try {
            console.log('Getting config');
            let res = await this.db.rowQuery('select 1 as msg,"jOther" as "config"	From "Codemaster" c where "nCategoryid" = 21');
            console.log('result', res);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1 };
            }
        }
        catch (error) {
            return { msg: -1 };
        }
    }
};
exports.PresentService = PresentService;
exports.PresentService = PresentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object])
], PresentService);


/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("cookie-parser");

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
/* 41 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(22);
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
/* 42 */
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
const presentation_module_1 = __webpack_require__(2);
const config_1 = __webpack_require__(9);
const compression = __webpack_require__(38);
const cookieParser = __webpack_require__(39);
const exception_1 = __webpack_require__(40);
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(25);
const kafka_config_1 = __webpack_require__(41);
const dotenv = __webpack_require__(42);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(presentation_module_1.PresentationModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('presentation-group'));
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
        .setTitle('Etabella Presentation API')
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
    console.log('\n\r\n\r\n\r PORT_PRESENTATION: ', configService.get('PORT_PRESENTATION'), '\n\r\n\r\n\r');
    await app.listen(configService.get('PORT_PRESENTATION'));
}
bootstrap();

})();

/******/ })()
;