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
exports.BatchfileModule = void 0;
const common_1 = __webpack_require__(3);
const batchfile_controller_1 = __webpack_require__(4);
const batchfile_service_1 = __webpack_require__(5);
const global_1 = __webpack_require__(6);
const bull_1 = __webpack_require__(13);
const config_1 = __webpack_require__(9);
const batch_module_1 = __webpack_require__(14);
const winston_module_1 = __webpack_require__(43);
const kafka_module_1 = __webpack_require__(42);
let BatchfileModule = class BatchfileModule {
};
exports.BatchfileModule = BatchfileModule;
exports.BatchfileModule = BatchfileModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule,
            kafka_module_1.KafkaModule.register('etabella-batch', 'batch-group'),
            batch_module_1.BatchModule,
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
            }),
            winston_module_1.WinstonConfigModule.forRoot('indexing')],
        controllers: [batchfile_controller_1.BatchfileController],
        providers: [batchfile_service_1.BatchfileService],
    })
], BatchfileModule);


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
exports.BatchfileController = void 0;
const common_1 = __webpack_require__(3);
const batchfile_service_1 = __webpack_require__(5);
let BatchfileController = class BatchfileController {
    constructor(batchfileService) {
        this.batchfileService = batchfileService;
    }
    getHello() {
        return this.batchfileService.getHello();
    }
};
exports.BatchfileController = BatchfileController;
exports.BatchfileController = BatchfileController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof batchfile_service_1.BatchfileService !== "undefined" && batchfile_service_1.BatchfileService) === "function" ? _a : Object])
], BatchfileController);


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
exports.BatchfileService = void 0;
const common_1 = __webpack_require__(3);
let BatchfileService = class BatchfileService {
    constructor() { }
    async onModuleInit() {
    }
    getHello() {
        return 'Hello World!';
    }
};
exports.BatchfileService = BatchfileService;
exports.BatchfileService = BatchfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BatchfileService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(15);
const utility_service_1 = __webpack_require__(22);
const jwt_middleware_1 = __webpack_require__(25);
const bull_1 = __webpack_require__(13);
const config_1 = __webpack_require__(9);
const batch_service_1 = __webpack_require__(27);
const batch_controller_1 = __webpack_require__(36);
const log_service_1 = __webpack_require__(30);
const kafka_module_1 = __webpack_require__(42);
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
/* 15 */
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
const db_service_1 = __webpack_require__(16);
const query_builder_service_1 = __webpack_require__(18);
const ioredis_1 = __webpack_require__(19);
const redis_db_service_1 = __webpack_require__(20);
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(17);
const query_builder_service_1 = __webpack_require__(18);
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
/* 17 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 18 */
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
/* 19 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 20 */
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
const ioredis_1 = __webpack_require__(21);
const ioredis_2 = __webpack_require__(19);
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
/* 21 */
/***/ ((module) => {

module.exports = require("ioredis");

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
        this.kafka.sendMessage((topic ? topic : 'batchfile-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
const microservices_1 = __webpack_require__(24);
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
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(26);
const redis_db_service_1 = __webpack_require__(20);
const config_1 = __webpack_require__(9);
const db_service_1 = __webpack_require__(16);
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
/* 26 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchService = void 0;
const db_service_1 = __webpack_require__(16);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(22);
const bull_1 = __webpack_require__(13);
const bull_2 = __webpack_require__(28);
const path = __webpack_require__(29);
const moment = __webpack_require__(11);
const log_service_1 = __webpack_require__(30);
const config_1 = __webpack_require__(9);
const redis_db_service_1 = __webpack_require__(20);
const XLSX = __webpack_require__(35);
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
/* 28 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("path");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(31);
const nest_winston_1 = __webpack_require__(32);
const winston = __webpack_require__(31);
const fs = __webpack_require__(33);
const path = __webpack_require__(29);
const moment = __webpack_require__(34);
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
/* 31 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("xlsx");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(37);
const batch_service_1 = __webpack_require__(27);
const batch_interface_1 = __webpack_require__(38);
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
/* 37 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 38 */
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
const swagger_1 = __webpack_require__(37);
const class_validator_1 = __webpack_require__(39);
const is_uuid_nullable_decorator_1 = __webpack_require__(40);
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
/* 39 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 40 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(41);
const class_validator_1 = __webpack_require__(39);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 42 */
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
const microservices_1 = __webpack_require__(24);
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
/* 43 */
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
const nest_winston_1 = __webpack_require__(32);
const winston = __webpack_require__(31);
const fs = __webpack_require__(33);
const path = __webpack_require__(29);
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
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(24);
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
/* 45 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 46 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 47 */
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
/* 48 */
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
const batchfile_module_1 = __webpack_require__(2);
const kafka_config_1 = __webpack_require__(44);
const compression = __webpack_require__(45);
const cookieParser = __webpack_require__(46);
const swagger_1 = __webpack_require__(37);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(47);
const config_1 = __webpack_require__(9);
const dotenv = __webpack_require__(48);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(batchfile_module_1.BatchfileModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('batch-group'));
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
        .setTitle('Etabella Batch file API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/batchfile' : '')
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
    await app.listen(configService.get('PORT_BATCHAPI'));
}
bootstrap();

})();

/******/ })()
;