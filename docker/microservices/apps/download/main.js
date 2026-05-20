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
exports.DownloadModule = void 0;
const common_1 = __webpack_require__(3);
const download_controller_1 = __webpack_require__(4);
const download_service_1 = __webpack_require__(5);
const global_1 = __webpack_require__(6);
const common_module_1 = __webpack_require__(13);
const kafka_shared_service_1 = __webpack_require__(22);
const downloadfile_controller_1 = __webpack_require__(53);
const downloadfile_service_1 = __webpack_require__(55);
const shared_module_1 = __webpack_require__(80);
const log_service_1 = __webpack_require__(56);
const winston_module_1 = __webpack_require__(81);
const event_log_service_1 = __webpack_require__(24);
const kafka_module_1 = __webpack_require__(25);
const taskprocess_module_1 = __webpack_require__(82);
const queue_module_1 = __webpack_require__(83);
const queue_service_1 = __webpack_require__(90);
const queue_registration_service_1 = __webpack_require__(92);
const present_report_service_1 = __webpack_require__(75);
const present_index_service_1 = __webpack_require__(77);
const utility_service_1 = __webpack_require__(79);
let DownloadModule = class DownloadModule {
};
exports.DownloadModule = DownloadModule;
exports.DownloadModule = DownloadModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule, queue_module_1.QueueModule, taskprocess_module_1.TaskProcessorModule,
            kafka_module_1.KafkaModule.register('etabella-download', 'download-group'),
            common_module_1.CommonModule, global_1.GlobalModule,
            winston_module_1.WinstonConfigModule.forRoot('download')],
        controllers: [download_controller_1.DownloadController, downloadfile_controller_1.DownloadfileController],
        providers: [kafka_shared_service_1.KafkaGlobalService, download_service_1.DownloadService, downloadfile_service_1.DownloadfileService, log_service_1.LogService, event_log_service_1.EventLogService, queue_service_1.QueueService, queue_registration_service_1.QueueRegistrationService,
            present_report_service_1.PresentReportService, present_index_service_1.PresentIndexService, utility_service_1.UtilityService
        ],
    })
], DownloadModule);


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
exports.DownloadController = void 0;
const common_1 = __webpack_require__(3);
const download_service_1 = __webpack_require__(5);
let DownloadController = class DownloadController {
    constructor(downloadService) {
        this.downloadService = downloadService;
    }
};
exports.DownloadController = DownloadController;
exports.DownloadController = DownloadController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof download_service_1.DownloadService !== "undefined" && download_service_1.DownloadService) === "function" ? _a : Object])
], DownloadController);


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
exports.DownloadService = void 0;
const common_1 = __webpack_require__(3);
let DownloadService = class DownloadService {
    getHello() {
        return 'Hello World!';
    }
};
exports.DownloadService = DownloadService;
exports.DownloadService = DownloadService = __decorate([
    (0, common_1.Injectable)()
], DownloadService);


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
exports.CommonModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(14);
const common_controller_1 = __webpack_require__(26);
const common_service_1 = __webpack_require__(28);
const jwt_middleware_1 = __webpack_require__(33);
const email_service_1 = __webpack_require__(35);
const email_controller_1 = __webpack_require__(52);
const config_1 = __webpack_require__(9);
let CommonModule = class CommonModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(common_controller_1.CommonController, email_controller_1.EmailController);
    }
};
exports.CommonModule = CommonModule;
exports.CommonModule = CommonModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [common_controller_1.CommonController, email_controller_1.EmailController],
        providers: [common_service_1.CommonService, email_service_1.EmailService, config_1.ConfigService]
    })
], CommonModule);


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
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(15);
const query_builder_service_1 = __webpack_require__(17);
const redis_db_service_1 = __webpack_require__(18);
const ioredis_1 = __webpack_require__(20);
const config_1 = __webpack_require__(9);
const utility_service_1 = __webpack_require__(21);
const event_log_service_1 = __webpack_require__(24);
const kafka_module_1 = __webpack_require__(25);
let SharedModule = class SharedModule {
};
exports.SharedModule = SharedModule;
exports.SharedModule = SharedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kafka_module_1.KafkaModule.register('etabella-coreapi', 'coreapi-group'),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            })
        ],
        controllers: [],
        providers: [db_service_1.DbService, query_builder_service_1.QueryBuilderService, redis_db_service_1.RedisDbService, utility_service_1.UtilityService, event_log_service_1.EventLogService
        ],
        exports: [db_service_1.DbService, redis_db_service_1.RedisDbService, utility_service_1.UtilityService, event_log_service_1.EventLogService
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(22);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'hyperlink-response'), data);
    }
    sendNotification(notificationlist, nMasterid) {
        try {
            notificationlist.forEach((jobData) => {
                const mdl = {
                    nUserid: jobData.nUserid,
                    cTitle: jobData.cTitle,
                    cMsg: jobData.cMsg,
                    cStatus: jobData.cStatus || 'P',
                    cType: jobData.cType,
                    nCaseid: jobData.nCaseid,
                    cToken: jobData.cToken,
                    nFSid: jobData.nFSid || null,
                    nDocid: jobData.nDocid || null,
                    nWebid: jobData.nWebid || null,
                    nBundledetailid: jobData.nBundledetailid || null,
                    nRefuserid: nMasterid || null
                };
                this.emit(mdl, 'notification');
            });
        }
        catch (error) {
            console.log('Error in sending notification', error);
        }
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(23);
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
/* 23 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventLogService = void 0;
const db_service_1 = __webpack_require__(15);
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
/* 25 */
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
const microservices_1 = __webpack_require__(23);
const kafka_shared_service_1 = __webpack_require__(22);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const common_service_1 = __webpack_require__(28);
const common_2 = __webpack_require__(29);
let CommonController = class CommonController {
    constructor(commonService) {
        this.commonService = commonService;
    }
    async getCode(query) {
        return await this.commonService.getcCodeMaster(query);
    }
    async getIssuelist(query) {
        return await this.commonService.getIssuelist(query);
    }
    async getMyteamusers(query) {
        return await this.commonService.getMyteamusers(query);
    }
    async getAnnotations(query) {
        return await this.commonService.getAnnotations(query);
    }
    async getArrengedIssue(query) {
        return this.commonService.getcolorid(query);
    }
};
exports.CommonController = CommonController;
__decorate([
    (0, common_1.Get)('getcode'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof common_2.ComboCodeReq !== "undefined" && common_2.ComboCodeReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CommonController.prototype, "getCode", null);
__decorate([
    (0, common_1.Get)('getissuelist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof common_2.IssuelistReq !== "undefined" && common_2.IssuelistReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CommonController.prototype, "getIssuelist", null);
__decorate([
    (0, common_1.Get)('myteamusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof common_2.UserlistReq !== "undefined" && common_2.UserlistReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CommonController.prototype, "getMyteamusers", null);
__decorate([
    (0, common_1.Get)('getannotations'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof common_2.annotReq !== "undefined" && common_2.annotReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], CommonController.prototype, "getAnnotations", null);
__decorate([
    (0, common_1.Get)('getcolorid'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof common_2.getcoloridMDL !== "undefined" && common_2.getcoloridMDL) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], CommonController.prototype, "getArrengedIssue", null);
exports.CommonController = CommonController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('common'),
    (0, common_1.Controller)('common'),
    __metadata("design:paramtypes", [typeof (_a = typeof common_service_1.CommonService !== "undefined" && common_service_1.CommonService) === "function" ? _a : Object])
], CommonController);


/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 28 */
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
exports.CommonService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
let CommonService = class CommonService {
    constructor(db) {
        this.db = db;
    }
    async getcCodeMaster(body) {
        let res = await this.db.executeRef('combo_codemaster', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async getIssuelist(query) {
        let res = await this.db.executeRef('issue_list', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }];
            }
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getMyteamusers(query) {
        let res = await this.db.executeRef('common_my_team_user', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }];
            }
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getAnnotations(query) {
        let res = await this.db.executeRef('doc_annotations', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return [{ msg: -1, value: 'Failed ', error: res.error }];
            }
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getcolorid(body) {
        const res = await this.db.executeRef('issue_colorid', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue_colorid', error: res.error };
        }
    }
};
exports.CommonService = CommonService;
exports.CommonService = CommonService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], CommonService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getcoloridMDL = exports.annotRes = exports.annotReq = exports.UserlistRes = exports.UserlistReq = exports.IssuelistRes = exports.IssuelistReq = exports.ComboCodeRes = exports.EmailAttachment = exports.EmailparseReq = exports.ComboCodeReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
const swagger_1 = __webpack_require__(27);
const class_transformer_1 = __webpack_require__(31);
const class_validator_1 = __webpack_require__(32);
class ComboCodeReq {
}
exports.ComboCodeReq = ComboCodeReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => Number(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ComboCodeReq.prototype, "nCategoryid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ComboCodeReq.prototype, "nMasterid", void 0);
class EmailparseReq {
}
exports.EmailparseReq = EmailparseReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cPath in only string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "nId", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "nMasterid", void 0);
class EmailAttachment {
}
exports.EmailAttachment = EmailAttachment;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: '' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], EmailAttachment.prototype, "nId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailAttachment.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailAttachment.prototype, "nMasterid", void 0);
class ComboCodeRes {
}
exports.ComboCodeRes = ComboCodeRes;
class IssuelistReq {
}
exports.IssuelistReq = IssuelistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssuelistReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssuelistReq.prototype, "nMasterid", void 0);
class IssuelistRes {
}
exports.IssuelistRes = IssuelistRes;
class UserlistReq {
}
exports.UserlistReq = UserlistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserlistReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserlistReq.prototype, "nMasterid", void 0);
class UserlistRes {
}
exports.UserlistRes = UserlistRes;
class annotReq {
}
exports.annotReq = annotReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], annotReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], annotReq.prototype, "nMasterid", void 0);
class annotRes {
}
exports.annotRes = annotRes;
class getcoloridMDL {
}
exports.getcoloridMDL = getcoloridMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getcoloridMDL.prototype, "jIids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getcoloridMDL.prototype, "nMasterid", void 0);


/***/ }),
/* 30 */
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
/* 31 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 33 */
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
const jwt = __webpack_require__(34);
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
/* 34 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const MsgReader_1 = __webpack_require__(36);
const decompressrtf_1 = __webpack_require__(48);
const iconvLite = __webpack_require__(40);
const rtf_stream_parser_1 = __webpack_require__(49);
const config_1 = __webpack_require__(9);
const cheerio = __webpack_require__(50);
const client_s3_1 = __webpack_require__(51);
let EmailService = class EmailService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
        this.saveDir = this.config.get('ATTACHMENT');
        this.domainPath = this.config.get('ATTACHMENT_URL');
        this.s3Client = new client_s3_1.S3Client({
            region: 'sgp1',
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            forcePathStyle: this.config.get('DO_S3') == 'MINIO'
        });
    }
    async downloadFileFromS3(spacePath) {
        try {
            const params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: spacePath,
            };
            const command = new client_s3_1.GetObjectCommand(params);
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                throw new Error('Empty file body received from S3.');
            }
            const streamToBuffer = (stream) => {
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };
            return await streamToBuffer(response.Body);
        }
        catch (error) {
            console.error('Error downloading file from S3:', error.message);
            throw new Error(`Error downloading file from S3: ${error.message}`);
        }
    }
    async getemailparse(body) {
        let filePath = body.cPath;
        let nBid = body?.nId;
        try {
            const fileData = await this.downloadFileFromS3(filePath);
            const reader = new MsgReader_1.default(fileData);
            const msgData = reader.getFileData();
            let rtfBody = '';
            if (msgData.compressedRtf) {
                rtfBody = Buffer.from((0, decompressrtf_1.decompressRTF)(msgData.compressedRtf)).toString();
            }
            let resultText = '';
            if (rtfBody) {
                const result = (0, rtf_stream_parser_1.deEncapsulateSync)(rtfBody, { decode: iconvLite.decode });
                resultText = result?.text || '';
            }
            const dirpath = `${this.saveDir}id_${nBid}`;
            let attechments = [];
            try {
                attechments = await this.saveAttachment(msgData, reader, dirpath);
            }
            catch (error) {
                console.log(`Error saving attachments: ${error}`);
            }
            resultText = this.replaceHtmlImg(resultText, attechments, `${this.domainPath}${dirpath}`);
            const email = {
                from: { name: msgData.senderName, email: msgData.sentRepresentinmtpAddress || msgData.lastModifierName || msgData.inetAcctName },
                to: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'to').map((r) => { return { name: r.name, email: r.smtpAddress || r.email }; }) : [],
                cc: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'cc').map((r) => { return { name: r.name, email: r.smtpAddress || r.email }; }) : [],
                subject: msgData.subject || 'No Subject',
                body: resultText || 'No Body Available',
                attachments: msgData.attachments ? msgData.attachments.filter(e => e.dataType == 'attachment' && !e.attachmentHidden).map((attachment) => ({
                    filename: attachment.fileName || 'Unnamed Attachment',
                    cPath: `${dirpath}/${attachment.fileName}`,
                    data: attachment || null,
                })) : [],
                date: msgData.creationTime || 'Unknown Date',
            };
            return { msg: 1, email: email };
        }
        catch (error) {
            console.error('Error reading .msg file:', error.message);
            return { msg: -1, error: `Error reading .msg file: ${error.message}` };
        }
    }
    async saveAttachment(msgData, reader, dirpath) {
        const attachments = [];
        try {
            console.log(msgData.attachments);
            for (const attachment of msgData.attachments) {
                const attachment_file = reader.getAttachment(attachment);
                attachments.push({
                    cFilename: attachment.fileName,
                    cPath: attachment.fileName,
                    dataType: attachment.dataType,
                    data: attachment || null,
                });
                if (attachment_file.content) {
                    const s3Key = `${dirpath}/${attachment.fileName}`;
                    try {
                        const putCommand = new client_s3_1.PutObjectCommand({
                            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                            Key: s3Key,
                            Body: attachment_file.content,
                            ContentType: attachment.mimeType || 'application/octet-stream',
                            ACL: 'public-read',
                        });
                        await this.s3Client.send(putCommand);
                        console.log(`Attachment uploaded to S3: ${s3Key}`);
                    }
                    catch (uploadError) {
                        console.error(`Failed to upload attachment to S3: ${s3Key}`, uploadError);
                    }
                }
                else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            }
        }
        catch (error) {
            console.error('Error processing attachments:', error.message);
        }
        return attachments;
    }
    async downloadAttachment(body, res) {
        let filePath = body.cPath;
        let attachmentId = body.nId;
        try {
            const fileBuffer = await this.downloadFileFromS3(filePath);
            const msgReader = new MsgReader_1.default(fileBuffer);
            const msgData = msgReader.getFileData();
            if (msgData.attachments && msgData.attachments.length > attachmentId) {
                const attachment = msgReader.getAttachment(attachmentId);
                const attachmentFileName = msgData.attachments[attachmentId].fileName || `attachment_${attachmentId}`;
                res.setHeader('Content-Disposition', `attachment; filename="${attachmentFileName}"`);
                res.setHeader('Content-Type', msgData.attachments[attachmentId].mimeType || 'application/octet-stream');
                res.send(Buffer.from(attachment.content));
            }
            else {
                res.status(404).send('Attachment not found');
            }
        }
        catch (error) {
            console.error('Error downloading attachment:', error);
            res.status(500).send('Failed to download attachment');
        }
    }
    replaceHtmlImg(htmlContent, attechments, attachmentsDir) {
        try {
            console.log(attachmentsDir);
            const $ = cheerio.load(htmlContent);
            $('img').each(function () {
                const originalSrc = $(this).attr('src');
                if (originalSrc && originalSrc.startsWith('cid:')) {
                    const imageName = originalSrc.split('cid:')[1].split('@')[0];
                    const path = attechments.find(e => e.data.pidContentId == imageName || e.cFilename == imageName);
                    console.log('originalSrc', originalSrc, path.cPath);
                    const newSrc = `${attachmentsDir}/${path.cPath}`;
                    $(this).attr('src', newSrc);
                    console.log(`Replaced ${originalSrc} with ${newSrc}`);
                }
            });
            return $.html();
        }
        catch (error) {
            console.error('error', error);
            return '';
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], EmailService);


/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/* Copyright 2016 Yury Karpovich
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*
 MSG Reader
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OverrideFlags = exports.EndType = exports.CalendarType = exports.PatternType = exports.RecurFrequency = void 0;
var const_1 = __importDefault(__webpack_require__(37));
var DataStream_1 = __importDefault(__webpack_require__(39));
var Reader_1 = __webpack_require__(41);
var Burner_1 = __webpack_require__(42);
var utils_1 = __webpack_require__(38);
var EntryStreamParser_1 = __webpack_require__(43);
var VerbStreamParser_1 = __webpack_require__(44);
var TZDEFINITIONParser_1 = __webpack_require__(45);
var TZREGParser_1 = __webpack_require__(46);
var AppointmentRecurParser_1 = __webpack_require__(47);
var AppointmentRecurParser_2 = __webpack_require__(47);
Object.defineProperty(exports, "RecurFrequency", ({ enumerable: true, get: function () { return AppointmentRecurParser_2.RecurFrequency; } }));
Object.defineProperty(exports, "PatternType", ({ enumerable: true, get: function () { return AppointmentRecurParser_2.PatternType; } }));
Object.defineProperty(exports, "CalendarType", ({ enumerable: true, get: function () { return AppointmentRecurParser_2.CalendarType; } }));
Object.defineProperty(exports, "EndType", ({ enumerable: true, get: function () { return AppointmentRecurParser_2.EndType; } }));
Object.defineProperty(exports, "OverrideFlags", ({ enumerable: true, get: function () { return AppointmentRecurParser_2.OverrideFlags; } }));
/**
 * CONST.MSG.PROP.TYPE_ENUM
 */
var TypeEnum;
(function (TypeEnum) {
    TypeEnum[TypeEnum["DIRECTORY"] = 1] = "DIRECTORY";
    TypeEnum[TypeEnum["DOCUMENT"] = 2] = "DOCUMENT";
    TypeEnum[TypeEnum["ROOT"] = 5] = "ROOT";
})(TypeEnum || (TypeEnum = {}));
var KeyType;
(function (KeyType) {
    KeyType[KeyType["root"] = 0] = "root";
    KeyType[KeyType["toSub"] = 1] = "toSub";
    KeyType[KeyType["named"] = 2] = "named";
})(KeyType || (KeyType = {}));
function fileTimeToUnixEpoch(time) {
    return (time - 116444736000000000) / 10000;
}
/**
 * The core implementation of MsgReader
 */
var MsgReader = /** @class */ (function () {
    function MsgReader(arrayBuffer) {
        this.reader = new Reader_1.Reader(arrayBuffer);
    }
    MsgReader.prototype.decodeField = function (fieldClass, fieldType, provider, ansiEncoding, insideProps) {
        var array = provider();
        var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
        var key = const_1.default.MSG.FIELD.FULL_NAME_MAPPING["".concat(fieldClass).concat(fieldType)]
            || const_1.default.MSG.FIELD.NAME_MAPPING[fieldClass];
        var keyType = KeyType.root;
        var propertySet = undefined;
        var propertyLid = undefined;
        var classValue = parseInt("0x".concat(fieldClass));
        if (classValue >= 0x8000) {
            var keyed = this.privatePidToKeyed[classValue];
            if (keyed) {
                if (keyed.useName) {
                    key = keyed.name;
                    keyType = KeyType.named;
                }
                else {
                    propertySet = keyed.propertySet;
                    propertyLid = (0, utils_1.toHex4)(keyed.propertyLid);
                    var lidDict = const_1.default.MSG.FIELD.PIDLID_MAPPING[keyed.propertySet];
                    if (lidDict !== undefined) {
                        var prop = lidDict[keyed.propertyLid];
                        if (prop !== undefined) {
                            if (prop.dispid !== undefined) {
                                key = prop.dispid; // e.g. `votingResponse`
                                keyType = KeyType.root;
                            }
                            else {
                                key = prop.id; // e.g. `PidLidVerbStream` listed in SomeParsedOxProps
                                keyType = KeyType.toSub;
                            }
                        }
                    }
                }
            }
        }
        var value = array;
        var skip = false;
        var decodeAs = const_1.default.MSG.FIELD.TYPE_MAPPING[fieldType];
        if (false) {}
        else if (decodeAs === "string") {
            value = ds.readString(array.length, ansiEncoding);
            skip = insideProps;
        }
        else if (decodeAs === "unicode") {
            value = ds.readUCS2String(array.length / 2);
            skip = insideProps;
        }
        else if (decodeAs === "binary") {
            skip = insideProps;
        }
        else if (decodeAs === "integer") {
            value = ds.readUint32();
        }
        else if (decodeAs === "boolean") {
            value = ds.readUint16() ? true : false;
        }
        else if (decodeAs === "time") {
            var lo = ds.readUint32();
            var fileTime = lo + (4294967296.0 * ds.readUint32());
            value = new Date(fileTimeToUnixEpoch(fileTime)).toUTCString();
        }
        if (skip) {
            key = undefined;
        }
        if (false) {}
        else if (key === "PidLidVerbStream") {
            key = "votingOptions";
            keyType = KeyType.root;
            value = (0, VerbStreamParser_1.parse)(ds);
        }
        else if ( false
            || key === "apptTZDefStartDisplay"
            || key === "apptTZDefEndDisplay"
            || key === "apptTZDefRecur") {
            keyType = KeyType.root;
            value = (0, TZDEFINITIONParser_1.parse)(ds);
        }
        else if (key === "timeZoneStruct") {
            value = (0, TZREGParser_1.parse)(ds);
        }
        else if (key === "apptRecur") {
            try {
                value = (0, AppointmentRecurParser_1.parse)(ds, ansiEncoding);
            }
            catch (ex) {
                console.debug(ex);
                // drop this data
                key = undefined;
            }
        }
        else if (key === "recipType") {
            var MAPI_TO = 1;
            var MAPI_CC = 2;
            var MAPI_BCC = 3;
            if (false) {}
            else if (value === MAPI_TO) {
                value = "to";
            }
            else if (value === MAPI_CC) {
                value = "cc";
            }
            else if (value === MAPI_BCC) {
                value = "bcc";
            }
        }
        else if (key === "globalAppointmentID") {
            value = (0, utils_1.bin2HexUpper)(ds);
        }
        var propertyTag = "".concat(fieldClass).concat(fieldType);
        return { key: key, keyType: keyType, value: value, notForRawProp: skip, propertyTag: propertyTag, propertySet: propertySet, propertyLid: propertyLid, };
    };
    MsgReader.prototype.fieldsDataDocument = function (parserConfig, documentProperty, fields) {
        var value = documentProperty.name.substring(12).toLowerCase();
        var fieldClass = value.substring(0, 4);
        var fieldType = value.substring(4, 8);
        parserConfig.propertyObserver && parserConfig.propertyObserver(fields, parseInt(value.substring(0, 8), 16), documentProperty.provider());
        if (fieldClass == const_1.default.MSG.FIELD.CLASS_MAPPING.ATTACHMENT_DATA) {
            // attachment specific info
            fields.dataId = documentProperty.dataId;
            fields.contentLength = documentProperty.length;
        }
        else {
            this.setDecodedFieldTo(parserConfig, fields, this.decodeField(fieldClass, fieldType, documentProperty.provider, parserConfig.ansiEncoding, false));
        }
    };
    MsgReader.prototype.setDecodedFieldTo = function (parserConfig, fields, pair) {
        var key = pair.key, keyType = pair.keyType, value = pair.value;
        if (key !== undefined) {
            if (keyType === KeyType.root) {
                fields[key] = value;
            }
        }
        if (parserConfig.includeRawProps === true) {
            fields.rawProps = fields.rawProps || [];
            if (!pair.notForRawProp) {
                fields.rawProps.push({
                    propertyTag: pair.propertyTag,
                    propertySet: pair.propertySet,
                    propertyLid: pair.propertyLid,
                    propertyName: (pair.keyType === KeyType.named) ? pair.key : undefined,
                    value: value,
                });
            }
        }
    };
    MsgReader.prototype.getFieldType = function (fieldProperty) {
        var value = fieldProperty.name.substring(12).toLowerCase();
        return value.substring(4, 8);
    };
    MsgReader.prototype.fieldsDataDirInner = function (parserConfig, dirProperty, rootFolder, fields) {
        var _this = this;
        if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.ATTACHMENT) == 0) {
            // attachment
            var attachmentField = {
                dataType: "attachment",
            };
            fields.attachments.push(attachmentField);
            this.fieldsDataDir(parserConfig, dirProperty, rootFolder, attachmentField, "attachment");
        }
        else if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.RECIPIENT) == 0) {
            // recipient
            var recipientField = {
                dataType: "recipient",
            };
            fields.recipients.push(recipientField);
            this.fieldsDataDir(parserConfig, dirProperty, rootFolder, recipientField, "recip");
        }
        else if (dirProperty.name.indexOf(const_1.default.MSG.FIELD.PREFIX.NAMEID) == 0) {
            // unknown, read
            this.fieldsNameIdDir(parserConfig, dirProperty, rootFolder, fields);
        }
        else {
            // other dir
            var childFieldType = this.getFieldType(dirProperty);
            if (childFieldType != const_1.default.MSG.FIELD.DIR_TYPE.INNER_MSG) {
                // ignore
            }
            else {
                var innerMsgContentFields = {
                    dataType: "msg",
                    attachments: [],
                    recipients: [],
                };
                this.fieldsDataDir(parserConfig, dirProperty, rootFolder, innerMsgContentFields, "sub");
                fields.innerMsgContentFields = innerMsgContentFields;
                fields.innerMsgContent = true;
                fields.folderId = dirProperty.dataId;
                this.innerMsgBurners[dirProperty.dataId] = function () { return _this.burnMsg(dirProperty, rootFolder); };
            }
        }
    };
    MsgReader.prototype.burnMsg = function (folder, rootFolder) {
        var entries = [
            {
                name: "Root Entry",
                type: TypeEnum.ROOT,
                children: [],
                length: 0,
            }
        ];
        this.registerFolder(entries, 0, folder, rootFolder, 0);
        return (0, Burner_1.burn)(entries);
    };
    MsgReader.prototype.registerFolder = function (entries, index, folder, rootFolder, depth) {
        var _loop_1 = function (set) {
            var provider = set.provider, length_1 = set.length;
            if (depth === 0 && set.name === "__properties_version1.0") {
                var src = provider();
                var dst_1 = new Uint8Array(src.length + 8);
                dst_1.set(src.subarray(0, 24), 0);
                dst_1.set(src.subarray(24), 32);
                provider = function () { return dst_1; };
                length_1 = dst_1.length;
            }
            var subIndex = entries.length;
            entries[index].children.push(subIndex);
            entries.push({
                name: set.name,
                type: TypeEnum.DOCUMENT,
                binaryProvider: provider,
                length: length_1,
            });
        };
        for (var _i = 0, _a = folder.fileNameSets(); _i < _a.length; _i++) {
            var set = _a[_i];
            _loop_1(set);
        }
        if (depth === 0) {
            // include root `__nameid_version1.0` folder.
            var sources = rootFolder.subFolders()
                .filter(function (it) { return it.name === const_1.default.MSG.FIELD.PREFIX.NAMEID; });
            for (var _b = 0, sources_1 = sources; _b < sources_1.length; _b++) {
                var source = sources_1[_b];
                var subIndex = entries.length;
                entries[index].children.push(subIndex);
                entries.push({
                    name: source.name,
                    type: TypeEnum.DIRECTORY,
                    children: [],
                    length: 0,
                });
                this.registerFolder(entries, subIndex, source, rootFolder, depth + 1);
            }
        }
        for (var _c = 0, _d = folder.subFolders(); _c < _d.length; _c++) {
            var subFolder = _d[_c];
            var subIndex = entries.length;
            entries[index].children.push(subIndex);
            entries.push({
                name: subFolder.name,
                type: TypeEnum.DIRECTORY,
                children: [],
                length: 0,
            });
            this.registerFolder(entries, subIndex, subFolder, rootFolder, depth + 1);
        }
    };
    MsgReader.prototype.fieldsRecipAndAttachmentProperties = function (parserConfig, documentProperty, fields) {
        var propertiesBinary = documentProperty.provider();
        var propertiesDs = new DataStream_1.default(propertiesBinary, 8, DataStream_1.default.LITTLE_ENDIAN);
        this.importPropertiesFromFile(parserConfig, propertiesDs, fields);
    };
    MsgReader.prototype.importPropertiesFromFile = function (parserConfig, propertiesDs, fields) {
        // See: [MS-OXMSG]: Outlook Item (.msg) File Format, 2.4 Property Stream
        // https://docs.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxmsg/20c1125f-043d-42d9-b1dc-cb9b7e5198ef
        var typeConverters = {
            0x0040: function (dataView) {
                var fileTime = dataView.getUint32(0, true) + (4294967296.0 * dataView.getUint32(4, true));
                return new Date(fileTimeToUnixEpoch(fileTime)).toUTCString();
            },
        };
        var _loop_2 = function () {
            var propertyTag = propertiesDs.readUint32();
            if (propertyTag === 0) {
                return "break";
            }
            var flags = propertiesDs.readUint32();
            var arr = propertiesDs.readUint8Array(8);
            parserConfig.propertyObserver(fields, propertyTag, arr);
            var fieldClass = (0, utils_1.toHex2)((propertyTag / 65536) & 0xFFFF);
            var fieldType = (0, utils_1.toHex2)(propertyTag & 0xFFFF);
            this_1.setDecodedFieldTo(parserConfig, fields, this_1.decodeField(fieldClass, fieldType, function () { return arr; }, parserConfig.ansiEncoding, true));
        };
        var this_1 = this;
        while (!propertiesDs.isEof()) {
            var state_1 = _loop_2();
            if (state_1 === "break")
                break;
        }
    };
    MsgReader.prototype.fieldsRootProperties = function (parserConfig, documentProperty, fields) {
        var propertiesBinary = documentProperty.provider();
        var propertiesDs = new DataStream_1.default(propertiesBinary, 32, DataStream_1.default.LITTLE_ENDIAN);
        this.importPropertiesFromFile(parserConfig, propertiesDs, fields);
    };
    MsgReader.prototype.fieldsDataDir = function (parserConfig, dirProperty, rootFolder, fields, subClass) {
        for (var _i = 0, _a = dirProperty.subFolders(); _i < _a.length; _i++) {
            var subFolder = _a[_i];
            this.fieldsDataDirInner(parserConfig, subFolder, rootFolder, fields);
        }
        for (var _b = 0, _c = dirProperty.fileNameSets(); _b < _c.length; _b++) {
            var fileSet = _c[_b];
            if (false) {}
            else if (fileSet.name.indexOf(const_1.default.MSG.FIELD.PREFIX.DOCUMENT) == 0) {
                this.fieldsDataDocument(parserConfig, fileSet, fields);
            }
            else if (fileSet.name === "__properties_version1.0") {
                if (subClass === "recip" || subClass === "attachment" || subClass === "sub") {
                    this.fieldsRecipAndAttachmentProperties(parserConfig, fileSet, fields);
                }
                else if (subClass === "root") {
                    this.fieldsRootProperties(parserConfig, fileSet, fields);
                }
            }
        }
    };
    MsgReader.prototype.fieldsNameIdDir = function (parserConfig, dirProperty, rootFolder, fields) {
        var guidTable = undefined;
        var stringTable = undefined;
        var entryTable = undefined;
        for (var _i = 0, _a = dirProperty.fileNameSets(); _i < _a.length; _i++) {
            var fileSet = _a[_i];
            if (false) {}
            else if (fileSet.name.indexOf(const_1.default.MSG.FIELD.PREFIX.DOCUMENT) == 0) {
                var value = fileSet.name.substring(12).toLowerCase();
                var fieldClass = value.substring(0, 4);
                var fieldType = value.substring(4, 8);
                if (false) {}
                else if (fieldClass === "0002" && fieldType === "0102") {
                    guidTable = fileSet.provider();
                }
                else if (fieldClass === "0003" && fieldType === "0102") {
                    entryTable = fileSet.provider();
                }
                else if (fieldClass === "0004" && fieldType === "0102") {
                    stringTable = fileSet.provider();
                }
            }
        }
        //console.log("%", guidTable, stringTable, entryTable);
        if (guidTable !== undefined && stringTable !== undefined && entryTable !== undefined) {
            var entries = (0, EntryStreamParser_1.parse)(entryTable);
            var stringReader = new DataStream_1.default(stringTable, 0, DataStream_1.default.LITTLE_ENDIAN);
            for (var _b = 0, entries_1 = entries; _b < entries_1.length; _b++) {
                var entry = entries_1[_b];
                if (entry.isStringProperty) {
                    stringReader.seek(entry.key);
                    var numTextBytes = stringReader.readUint32();
                    this.privatePidToKeyed[0x8000 | entry.propertyIndex] = {
                        useName: true,
                        name: stringReader.readUCS2String(numTextBytes / 2),
                    };
                }
                else {
                    this.privatePidToKeyed[0x8000 | entry.propertyIndex] = {
                        useName: false,
                        propertySet: (entry.guidIndex === 1) ? "00020328-00000-0000-C000-00000000046"
                            : (entry.guidIndex === 2) ? "00020329-00000-0000-C000-00000000046"
                                : (0, utils_1.msftUuidStringify)(guidTable, 16 * (entry.guidIndex - 3)),
                        propertyLid: entry.key,
                    };
                }
            }
            //console.log("@", this.privatePidToKeyed);
        }
    };
    /**
     * extract real fields
     */
    MsgReader.prototype.fieldsDataReader = function (parserConfig) {
        var fields = {
            dataType: "msg",
            attachments: [],
            recipients: []
        };
        this.fieldsDataDir(parserConfig, this.reader.rootFolder(), this.reader.rootFolder(), fields, "root");
        return fields;
    };
    /**
     * convert binary data to dictionary
     */
    MsgReader.prototype.parseMsgData = function (parserConfig) {
        this.reader.parse();
        return this.fieldsDataReader(parserConfig);
    };
    MsgReader.prototype.getFileData = function () {
        var _a, _b, _c;
        if (this.fieldsData === undefined) {
            if (!this.reader.isMSGFile()) {
                return {
                    dataType: null,
                    error: 'Unsupported file type!'
                };
            }
            this.innerMsgBurners = {};
            this.privatePidToKeyed = {};
            this.fieldsData = this.parseMsgData({
                propertyObserver: ((_a = this.parserConfig) === null || _a === void 0 ? void 0 : _a.propertyObserver) || (function () { }),
                includeRawProps: ((_b = this.parserConfig) === null || _b === void 0 ? void 0 : _b.includeRawProps) ? true : false,
                ansiEncoding: (0, utils_1.emptyToNull)((_c = this.parserConfig) === null || _c === void 0 ? void 0 : _c.ansiEncoding),
            });
        }
        return this.fieldsData;
    };
    /**
     Reads an attachment content by key/ID
     
      @return {Object} The attachment for specific attachment key
      */
    MsgReader.prototype.getAttachment = function (attach) {
        var attachData = typeof attach === 'number' ? this.fieldsData.attachments[attach] : attach;
        if (attachData.innerMsgContent === true && typeof attachData.folderId === "number") {
            // embedded msg
            return { fileName: attachData.name + ".msg", content: this.innerMsgBurners[attachData.folderId]() };
        }
        else {
            // raw attachment file
            var fieldData = this.reader.readFileOf(attachData.dataId);
            return { fileName: attachData.fileName, content: fieldData };
        }
    };
    return MsgReader;
}());
exports["default"] = MsgReader;


/***/ }),
/* 37 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(38);
exports["default"] = {
    FILE_HEADER: (0, utils_1.uInt2int)([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]),
    MSG: {
        UNUSED_BLOCK: -1,
        END_OF_CHAIN: -2,
        S_BIG_BLOCK_SIZE: 0x0200,
        S_BIG_BLOCK_MARK: 9,
        L_BIG_BLOCK_SIZE: 0x1000,
        L_BIG_BLOCK_MARK: 12,
        SMALL_BLOCK_SIZE: 0x0040,
        BIG_BLOCK_MIN_DOC_SIZE: 0x1000,
        HEADER: {
            PROPERTY_START_OFFSET: 0x30,
            BAT_START_OFFSET: 0x4c,
            BAT_COUNT_OFFSET: 0x2C,
            SBAT_START_OFFSET: 0x3C,
            SBAT_COUNT_OFFSET: 0x40,
            XBAT_START_OFFSET: 0x44,
            XBAT_COUNT_OFFSET: 0x48
        },
        PROP: {
            NO_INDEX: -1,
            PROPERTY_SIZE: 0x0080,
            NAME_SIZE_OFFSET: 0x40,
            MAX_NAME_LENGTH: ( /*NAME_SIZE_OFFSET*/0x40 / 2) - 1,
            TYPE_OFFSET: 0x42,
            PREVIOUS_PROPERTY_OFFSET: 0x44,
            NEXT_PROPERTY_OFFSET: 0x48,
            CHILD_PROPERTY_OFFSET: 0x4C,
            START_BLOCK_OFFSET: 0x74,
            SIZE_OFFSET: 0x78,
            TYPE_ENUM: {
                DIRECTORY: 1,
                DOCUMENT: 2,
                ROOT: 5
            }
        },
        FIELD: {
            PREFIX: {
                ATTACHMENT: '__attach_version1.0',
                RECIPIENT: '__recip_version1.0',
                DOCUMENT: '__substg1.',
                NAMEID: '__nameid_version1.0'
            },
            // example (use fields as needed)
            NAME_MAPPING: {
                // email specific
                '001a': 'messageClass',
                '0037': 'subject',
                '0c1a': 'senderName',
                '0c1e': 'senderAddressType',
                '0c1f': 'senderEmail',
                '5d01': 'senderSmtpAddress',
                '5d02': 'sentRepresentingSmtpAddress',
                '5d0a': 'creatorSMTPAddress',
                '5d0b': 'lastModifierSMTPAddress',
                '1000': 'body',
                '007d': 'headers',
                '1009': 'compressedRtf',
                '3ffa': 'lastModifierName',
                '0039': 'clientSubmitTime',
                '0e06': 'messageDeliveryTime',
                '3fde': 'internetCodepage',
                '3ffd': 'messageCodepage',
                '3ff1': 'messageLocaleId',
                '0e07': 'messageFlags',
                '1035': 'messageId',
                // attachment specific
                '3007': 'creationTime',
                '3008': 'lastModificationTime',
                '3703': 'extension',
                '3704': 'fileNameShort',
                '3707': 'fileName',
                '3712': 'pidContentId',
                '7ffe': 'attachmentHidden',
                '370e': 'attachMimeTag',
                // recipient specific
                '0c15': 'recipType',
                '3001': 'name',
                '3002': 'addressType',
                '3003': 'email',
                '39fe': 'smtpAddress',
                // contact specific
                '3a18': 'departmentName',
                '3a44': 'middleName',
                '3a05': 'generation',
                '3a11': 'surname',
                '3a27': 'addressCity',
                '3a16': 'companyName',
                '3a24': 'businessFaxNumber',
                '3a29': 'streetAddress',
                '3a51': 'businessHomePage',
                '3a06': 'givenName',
                '3a09': 'homeTelephoneNumber',
                '3a15': 'postalAddress',
                '3a17': 'title',
                '3a1c': 'mobileTelephoneNumber',
                '3a26': 'country',
                '3a28': 'stateOrProvince',
                '3a2a': 'postalCode',
                '3a45': 'displayNamePrefix',
                '0070': 'conversationTopic',
                '0e1d': 'normalizedSubject',
                '3a08': 'businessTelephoneNumber',
                '3a0d': 'location',
            },
            FULL_NAME_MAPPING: {
                '1013001f': 'bodyHtml',
                '10130102': 'html',
            },
            PIDLID_MAPPING: {
                // PSETID_Common
                "00062008-0000-0000-c000-000000000046": {
                    0x00008520: { id: "PidLidVerbStream", },
                    0x00008524: { id: "PidLidVerbResponse", dispid: "votingResponse", },
                    0x00008580: { id: "PidLidInternetAccountName", dispid: "inetAcctName", },
                },
                // PSETID_Appointment
                "00062002-0000-0000-c000-000000000046": {
                    0x0000820D: { id: "PidLidAppointmentStartWhole", dispid: "apptStartWhole", },
                    0x0000820E: { id: "PidLidAppointmentEndWhole", dispid: "apptEndWhole", },
                    0x00008235: { id: "PidLidClipStart", dispid: "clipStart", },
                    0x00008236: { id: "PidLidClipEnd", dispid: "clipEnd", },
                    0x00008233: { id: "PidLidTimeZoneStruct", dispid: "timeZoneStruct" },
                    0x00008234: { id: "PidLidTimeZoneDescription", dispid: "timeZoneDesc" },
                    0x0000825E: { id: "PidLidAppointmentTimeZoneDefinitionStartDisplay", dispid: "apptTZDefStartDisplay" },
                    0x0000825F: { id: "PidLidAppointmentTimeZoneDefinitionEndDisplay", dispid: "apptTZDefEndDisplay" },
                    0x00008260: { id: "PidLidAppointmentTimeZoneDefinitionRecur", dispid: "apptTZDefRecur" },
                    0x00008216: { id: "PidLidAppointmentRecur", dispid: "apptRecur" },
                    0x00008208: { id: "PidLidLocation", dispid: "apptLocation", },
                },
                // PSETID_Address
                "00062004-0000-0000-c000-000000000046": {
                    0x0000802c: { id: "dispidYomiFirstName", dispid: "yomiFirstName", },
                    0x00008083: { id: "dispidEmail1EmailAddress", dispid: "email1EmailAddress", },
                    0x0000802e: { id: "dispidYomiCompanyName", dispid: "yomiCompanyName", },
                    0x000080d2: { id: "PidLidFax3AddressType", dispid: "fax3AddrType", },
                    0x00008080: { id: "PidLidEmail1DisplayName", dispid: "email1DisplayName", },
                    0x00008084: { id: "PidLidEmail1OriginalDisplayName", dispid: "email1OriginalDisplayName", },
                    0x00008005: { id: "PidLidFileUnder", dispid: "fileUnder", },
                    0x0000802d: { id: "PidLidYomiLastName", dispid: "yomiLastName", },
                    0x000080b2: { id: "PidLidFax1AddressType", dispid: "fax1AddrType", },
                    0x000080c3: { id: "PidLidFax2EmailAddress", dispid: "fax2EmailAddress", },
                    0x00008046: { id: "PidLidWorkAddressCity", dispid: "workAddressCity", },
                    0x000080dd: { id: "PidLidAddressCountryCode", dispid: "addressCountryCode", },
                    0x000080c2: { id: "PidLidFax2AddressType", dispid: "fax2AddrType", },
                    0x000080c4: { id: "PidLidFax2OriginalDisplayName", dispid: "fax2OriginalDisplayName", },
                    0x00008048: { id: "PidLidWorkAddressPostalCode", dispid: "workAddressPostalCode", },
                    0x00008045: { id: "PidLidWorkAddressStreet", dispid: "workAddressStreet", },
                    0x00008047: { id: "PidLidWorkAddressState", dispid: "workAddressState", },
                    0x000080db: { id: "PidLidWorkAddressCountryCode", dispid: "workAddressCountryCode", },
                    0x00008049: { id: "PidLidWorkAddressCountry", dispid: "workAddressCountry", },
                    0x0000802b: { id: "PidLidHtml", dispid: "contactHtml", },
                    0x0000801b: { id: "PidLidWorkAddress", dispid: "workAddress", },
                    0x000080b4: { id: "PidLidFax1OriginalDisplayName", dispid: "fax1OriginalDisplayName", },
                    0x00008062: { id: "PidLidInstantMessagingAddress", dispid: "instMsg", },
                    0x00008010: { id: "PidLidDepartment", dispid: "department", },
                    0x000080b3: { id: "PidLidFax1EmailAddress", dispid: "fax1EmailAddress", },
                    0x000080d4: { id: "PidLidFax3OriginalDisplayName", dispid: "fax3OriginalDisplayName", },
                    0x000080d3: { id: "PidLidFax3EmailAddress", dispid: "fax3EmailAddress", },
                },
                // PSETID_Meeting
                "6ed8da90-450b-101b-98da-00aa003f1305": {
                    0x00000003: { id: "PidLidGlobalObjectId", dispid: "globalAppointmentID", },
                    0x00000028: { id: "PidLidOldLocation", dispid: "apptOldLocation", },
                },
            },
            CLASS_MAPPING: {
                ATTACHMENT_DATA: '3701'
            },
            TYPE_MAPPING: {
                '001e': 'string',
                '001f': 'unicode',
                '0040': 'time',
                '0102': 'binary',
                '0003': 'integer',
                '000b': 'boolean',
            },
            DIR_TYPE: {
                INNER_MSG: '000d'
            }
        }
    }
};


/***/ }),
/* 38 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.bin2HexUpper = exports.readTransitionSystemTime = exports.readSystemTime = exports.emptyToNull = exports.msftUuidStringify = exports.toHex4 = exports.toHex2 = exports.toHex1 = exports.toHexStr = exports.uInt2int = exports.arraysEqual = void 0;
/**
 * @internal
 */
function arraysEqual(a, b) {
    if (a === b)
        return true;
    if (a == null || b == null)
        return false;
    if (a.length != b.length)
        return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            return false;
    }
    return true;
}
exports.arraysEqual = arraysEqual;
/**
 * @internal
 */
function uInt2int(data) {
    var result = new Array(data.length);
    for (var i = 0; i < data.length; i++) {
        result[i] = data[i] << 24 >> 24;
    }
    return result;
}
exports.uInt2int = uInt2int;
/**
 * @internal
 */
function toHexStr(value, padding) {
    var text = "";
    while (value != 0) {
        text = "0123456789abcdef"[value & 15] + text;
        value >>= 4;
        text = "0123456789abcdef"[value & 15] + text;
        value >>= 4;
    }
    while (text.length < padding) {
        text = "0" + text;
    }
    return text;
}
exports.toHexStr = toHexStr;
var hex = "0123456789abcdef";
/**
 * byte to lower case hex string
 *
 * @internal
 */
function toHex1(value) {
    return hex[(value >> 4) & 15]
        + hex[(value) & 15];
}
exports.toHex1 = toHex1;
/**
 * little uint16 to lower case hex string
 *
 * @internal
 */
function toHex2(value) {
    return hex[(value >> 12) & 15]
        + hex[(value >> 8) & 15]
        + hex[(value >> 4) & 15]
        + hex[(value) & 15];
}
exports.toHex2 = toHex2;
/**
 * little uint32 to lower case hex string
 *
 * @internal
 */
function toHex4(value) {
    return hex[(value >> 28) & 15]
        + hex[(value >> 24) & 15]
        + hex[(value >> 20) & 15]
        + hex[(value >> 16) & 15]
        + hex[(value >> 12) & 15]
        + hex[(value >> 8) & 15]
        + hex[(value >> 4) & 15]
        + hex[(value) & 15];
}
exports.toHex4 = toHex4;
/**
 * Variant 2 UUIDs, historically used in Microsoft's COM/OLE libraries,
 * use a mixed-endian format, whereby the first three components of the UUID are little-endian,
 * and the last two are big-endian.
 * For example, `00112233-4455-6677-8899-aabbccddeeff` is encoded as the bytes
 * `33 22 11 00 55 44 77 66 88 99 aa bb cc dd ee ff`.
 *
 * @see https://en.wikipedia.org/wiki/Universally_unique_identifier
 * @internal
 */
function msftUuidStringify(array, offset) {
    return ""
        + toHex1(array[offset + 3])
        + toHex1(array[offset + 2])
        + toHex1(array[offset + 1])
        + toHex1(array[offset + 0])
        + "-"
        + toHex1(array[offset + 5])
        + toHex1(array[offset + 4])
        + "-"
        + toHex1(array[offset + 7])
        + toHex1(array[offset + 6])
        + "-"
        + toHex1(array[offset + 8])
        + toHex1(array[offset + 9])
        + "-"
        + toHex1(array[offset + 10])
        + toHex1(array[offset + 11])
        + toHex1(array[offset + 12])
        + toHex1(array[offset + 13])
        + toHex1(array[offset + 14])
        + toHex1(array[offset + 15]);
}
exports.msftUuidStringify = msftUuidStringify;
/**
 * @internal
 */
function emptyToNull(text) {
    return (text === "") ? null : text;
}
exports.emptyToNull = emptyToNull;
/**
 * @internal
 */
function padNumber(value, maxLen) {
    return ("" + value).padStart(maxLen, '0');
}
/**
 * @internal
 */
function readSystemTime(ds) {
    // SYSTEMTIME structure (minwinbase.h)
    // https://learn.microsoft.com/en-us/windows/win32/api/minwinbase/ns-minwinbase-systemtime
    var wYear = ds.readUint16();
    var wMonth = ds.readUint16();
    var wDayOfWeek = ds.readUint16();
    var wDay = ds.readUint16();
    var wHour = ds.readUint16();
    var wMinute = ds.readUint16();
    var wSecond = ds.readUint16();
    var wMilliseconds = ds.readUint16();
    var text = "".concat(padNumber(wYear, 4), "-").concat(padNumber(wMonth, 2), "-").concat(padNumber(wDay, 2), "T").concat(padNumber(wHour, 2), ":").concat(padNumber(wMinute, 2), ":").concat(padNumber(wSecond, 2), "Z");
    if (text === '0000-00-00T00:00:00Z') {
        return null;
    }
    else {
        return new Date(text);
    }
}
exports.readSystemTime = readSystemTime;
/**
 * @internal
 */
function readTransitionSystemTime(ds) {
    // SYSTEMTIME structure (minwinbase.h)
    // https://learn.microsoft.com/en-us/windows/win32/api/minwinbase/ns-minwinbase-systemtime
    var wYear = ds.readUint16();
    var wMonth = ds.readUint16();
    var wDayOfWeek = ds.readUint16();
    var wDay = ds.readUint16();
    var wHour = ds.readUint16();
    var wMinute = ds.readUint16();
    var wSecond = ds.readUint16();
    var wMilliseconds = ds.readUint16();
    return {
        year: wYear,
        month: wMonth,
        dayOfWeek: wDayOfWeek,
        day: wDay,
        hour: wHour,
        minute: wMinute,
    };
}
exports.readTransitionSystemTime = readTransitionSystemTime;
/**
 * @internal
 */
function bin2HexUpper(ds) {
    var text = "";
    while (!ds.isEof()) {
        text += toHex1(ds.readUint8());
    }
    return text.toUpperCase();
}
exports.bin2HexUpper = bin2HexUpper;


/***/ }),
/* 39 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var iconv = __webpack_require__(40);
/**
 * This DataStream is for internal use.
 */
var DataStream = /** @class */ (function () {
    /**
      DataStream reads scalars, arrays and structs of data from an ArrayBuffer.
      It's like a file-like DataView on steroids.
    
      @param arrayBuffer ArrayBuffer to read from.
      @param byteOffset Offset from arrayBuffer beginning for the DataStream.
      @param endianness {@link DataStream.BIG_ENDIAN} or {@link DataStream.LITTLE_ENDIAN} (the default).
      */
    function DataStream(arrayBuffer, byteOffset, endianness) {
        /**
          @internal
          */
        this._dynamicSize = true;
        /**
          Virtual byte length of the DataStream backing buffer.
          Updated to be max of original buffer size and last written size.
          If dynamicSize is false is set to buffer size.
      
          @internal
          */
        this._byteLength = 0;
        /**
          Seek position where {@link readStruct} ran into a problem.
          Useful for debugging struct parsing.
        
         */
        this.failurePosition = 0;
        this._byteOffset = byteOffset || 0;
        if (arrayBuffer instanceof ArrayBuffer) {
            this.buffer = arrayBuffer;
        }
        else if (arrayBuffer instanceof DataView) {
            this.dataView = arrayBuffer;
        }
        else if (arrayBuffer && arrayBuffer.buffer instanceof ArrayBuffer) {
            this._byteOffset += arrayBuffer.byteOffset;
            this._buffer = arrayBuffer.buffer;
            this._dataView = new DataView(this._buffer, this._byteOffset);
            this._byteLength = this._dataView.byteLength + this._byteOffset;
        }
        else {
            throw new Error("Unknown arrayBuffer");
        }
        this.position = 0;
        this.endianness = endianness == null ? DataStream.LITTLE_ENDIAN : endianness;
    }
    ;
    /**
      Saves the DataStream contents to the given filename.
      Uses Chrome's anchor download property to initiate download.
    
      @param filename Filename to save as.
      */
    DataStream.prototype.save = function (filename) {
        var blob = new Blob([this.buffer]);
        var URL = (window["webkitURL"] || window.URL);
        if (URL && URL.createObjectURL) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', filename);
            a.click();
            URL.revokeObjectURL(url);
        }
        else {
            throw ("DataStream.save: Can't create object URL.");
        }
    };
    ;
    Object.defineProperty(DataStream.prototype, "dynamicSize", {
        /**
         * Whether to extend DataStream buffer when trying to write beyond its size.
         * If set, the buffer is reallocated to twice its current size until the
         * requested write fits the buffer.
         */
        get: function () {
            return this._dynamicSize;
        },
        set: function (v) {
            if (!v) {
                this._trimAlloc();
            }
            this._dynamicSize = v;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataStream.prototype, "byteLength", {
        /**
          Returns the byte length of the DataStream object.
          */
        get: function () {
            return this._byteLength - this._byteOffset;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataStream.prototype, "buffer", {
        /**
          Set/get the backing ArrayBuffer of the DataStream object.
          The setter updates the DataView to point to the new buffer.
          */
        get: function () {
            this._trimAlloc();
            return this._buffer;
        },
        set: function (v) {
            this._buffer = v;
            this._dataView = new DataView(this._buffer, this._byteOffset);
            this._byteLength = this._buffer.byteLength;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataStream.prototype, "byteOffset", {
        /**
          Set/get the byteOffset of the DataStream object.
          The setter updates the DataView to point to the new byteOffset.
          */
        get: function () {
            return this._byteOffset;
        },
        set: function (v) {
            this._byteOffset = v;
            this._dataView = new DataView(this._buffer, this._byteOffset);
            this._byteLength = this._buffer.byteLength;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DataStream.prototype, "dataView", {
        /**
          Set/get the backing DataView of the DataStream object.
          The setter updates the buffer and byteOffset to point to the DataView values.
          */
        get: function () {
            return this._dataView;
        },
        set: function (v) {
            this._byteOffset = v.byteOffset;
            this._buffer = v.buffer;
            this._dataView = new DataView(this._buffer, this._byteOffset);
            this._byteLength = this._byteOffset + v.byteLength;
        },
        enumerable: false,
        configurable: true
    });
    /**
      Internal function to resize the DataStream buffer when required.
      @param extra Number of bytes to add to the buffer allocation.
      */
    DataStream.prototype._realloc = function (extra) {
        if (!this._dynamicSize) {
            return;
        }
        var req = this._byteOffset + this.position + extra;
        var blen = this._buffer.byteLength;
        if (req <= blen) {
            if (req > this._byteLength) {
                this._byteLength = req;
            }
            return;
        }
        if (blen < 1) {
            blen = 1;
        }
        while (req > blen) {
            blen *= 2;
        }
        var buf = new ArrayBuffer(blen);
        var src = new Uint8Array(this._buffer);
        var dst = new Uint8Array(buf, 0, src.length);
        dst.set(src);
        this.buffer = buf;
        this._byteLength = req;
    };
    ;
    /**
      Internal function to trim the DataStream buffer when required.
      Used for stripping out the extra bytes from the backing buffer when
      the virtual byteLength is smaller than the buffer byteLength (happens after
      growing the buffer with writes and not filling the extra space completely).
    
      */
    DataStream.prototype._trimAlloc = function () {
        if (this._byteLength == this._buffer.byteLength) {
            return;
        }
        var buf = new ArrayBuffer(this._byteLength);
        var dst = new Uint8Array(buf);
        var src = new Uint8Array(this._buffer, 0, dst.length);
        dst.set(src);
        this.buffer = buf;
    };
    ;
    /**
      Sets the DataStream read/write position to given position.
      Clamps between 0 and DataStream length.
    
      @param pos Position to seek to.
      */
    DataStream.prototype.seek = function (pos) {
        var npos = Math.max(0, Math.min(this.byteLength, pos));
        this.position = (isNaN(npos) || !isFinite(npos)) ? 0 : npos;
    };
    ;
    /**
      Returns true if the DataStream seek pointer is at the end of buffer and
      there's no more data to read.
    
      @return True if the seek pointer is at the end of the buffer.
      */
    DataStream.prototype.isEof = function () {
        return (this.position >= this.byteLength);
    };
    ;
    /**
      Maps an Int32Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Int32Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapInt32Array = function (length, e) {
        this._realloc(length * 4);
        var arr = new Int32Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 4;
        return arr;
    };
    ;
    /**
      Maps an Int16Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Int16Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapInt16Array = function (length, e) {
        this._realloc(length * 2);
        var arr = new Int16Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 2;
        return arr;
    };
    ;
    /**
      Maps an Int8Array into the DataStream buffer.
    
      Nice for quickly reading in data.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Int8Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapInt8Array = function (length) {
        this._realloc(length * 1);
        var arr = new Int8Array(this._buffer, this.byteOffset + this.position, length);
        this.position += length * 1;
        return arr;
    };
    ;
    /**
      Maps a Uint32Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Uint32Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapUint32Array = function (length, e) {
        this._realloc(length * 4);
        var arr = new Uint32Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 4;
        return arr;
    };
    ;
    /**
      Maps a Uint16Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Uint16Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapUint16Array = function (length, e) {
        this._realloc(length * 2);
        var arr = new Uint16Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 2;
        return arr;
    };
    ;
    /**
      Maps a Uint8Array into the DataStream buffer.
    
      Nice for quickly reading in data.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Uint8Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapUint8Array = function (length) {
        this._realloc(length * 1);
        var arr = new Uint8Array(this._buffer, this.byteOffset + this.position, length);
        this.position += length * 1;
        return arr;
    };
    ;
    /**
      Maps a Float64Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Float64Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapFloat64Array = function (length, e) {
        this._realloc(length * 8);
        var arr = new Float64Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 8;
        return arr;
    };
    ;
    /**
      Maps a Float32Array into the DataStream buffer, swizzling it to native
      endianness in-place. The current offset from the start of the buffer needs to
      be a multiple of element size, just like with typed array views.
    
      Nice for quickly reading in data. Warning: potentially modifies the buffer
      contents.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return Float32Array to the DataStream backing buffer.
      */
    DataStream.prototype.mapFloat32Array = function (length, e) {
        this._realloc(length * 4);
        var arr = new Float32Array(this._buffer, this.byteOffset + this.position, length);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += length * 4;
        return arr;
    };
    ;
    /**
      Reads an Int32Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Int32Array.
     */
    DataStream.prototype.readInt32Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 4 : length;
        var arr = new Int32Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads an Int16Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Int16Array.
     */
    DataStream.prototype.readInt16Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 2 : length;
        var arr = new Int16Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads an Int8Array of desired length from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Int8Array.
     */
    DataStream.prototype.readInt8Array = function (length) {
        length = length == null ? (this.byteLength - this.position) : length;
        var arr = new Int8Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads a Uint32Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Uint32Array.
     */
    DataStream.prototype.readUint32Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 4 : length;
        var arr = new Uint32Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads a Uint16Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Uint16Array.
     */
    DataStream.prototype.readUint16Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 2 : length;
        var arr = new Uint16Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads a Uint8Array of desired length from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Uint8Array.
     */
    DataStream.prototype.readUint8Array = function (length) {
        length = length == null ? (this.byteLength - this.position) : length;
        var arr = new Uint8Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
     * @internal
     */
    DataStream.prototype.readToUint8Array = function (length, arr, dstOffset) {
        length = length == null ? (this.byteLength - this.position) : length;
        DataStream.memcpy(arr.buffer, dstOffset, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        this.position += arr.byteLength;
    };
    ;
    /**
      Reads a Float64Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Float64Array.
     */
    DataStream.prototype.readFloat64Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 8 : length;
        var arr = new Float64Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Reads a Float32Array of desired length and endianness from the DataStream.
    
      @param length Number of elements to map.
      @param e Endianness of the data to read.
      @return The read Float32Array.
     */
    DataStream.prototype.readFloat32Array = function (length, e) {
        length = length == null ? (this.byteLength - this.position) / 4 : length;
        var arr = new Float32Array(length);
        DataStream.memcpy(arr.buffer, 0, this.buffer, this.byteOffset + this.position, length * arr.BYTES_PER_ELEMENT);
        DataStream.arrayToNative(arr, e == null ? this.endianness : e);
        this.position += arr.byteLength;
        return arr;
    };
    ;
    /**
      Writes an Int32Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeInt32Array = function (arr, e) {
        this._realloc(arr.length * 4);
        if (arr instanceof Int32Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapInt32Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeInt32(arr[i], e);
            }
        }
    };
    ;
    /**
      Writes an Int16Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeInt16Array = function (arr, e) {
        this._realloc(arr.length * 2);
        if (arr instanceof Int16Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapInt16Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeInt16(arr[i], e);
            }
        }
    };
    ;
    /**
      Writes an Int8Array to the DataStream.
    
      @param arr The array to write.
     */
    DataStream.prototype.writeInt8Array = function (arr) {
        this._realloc(arr.length * 1);
        if (arr instanceof Int8Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapInt8Array(arr.length);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeInt8(arr[i]);
            }
        }
    };
    ;
    /**
      Writes a Uint32Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeUint32Array = function (arr, e) {
        this._realloc(arr.length * 4);
        if (arr instanceof Uint32Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapUint32Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeUint32(arr[i], e);
            }
        }
    };
    ;
    /**
      Writes a Uint16Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeUint16Array = function (arr, e) {
        this._realloc(arr.length * 2);
        if (arr instanceof Uint16Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapUint16Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeUint16(arr[i], e);
            }
        }
    };
    ;
    /**
      Writes a Uint8Array to the DataStream.
    
      @param arr The array to write.
     */
    DataStream.prototype.writeUint8Array = function (arr) {
        this._realloc(arr.length * 1);
        if (arr instanceof Uint8Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapUint8Array(arr.length);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeUint8(arr[i]);
            }
        }
    };
    ;
    /**
      Writes a Float64Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeFloat64Array = function (arr, e) {
        this._realloc(arr.length * 8);
        if (arr instanceof Float64Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapFloat64Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeFloat64(arr[i], e);
            }
        }
    };
    ;
    /**
      Writes a Float32Array of specified endianness to the DataStream.
    
      @param arr The array to write.
      @param e Endianness of the data to write.
     */
    DataStream.prototype.writeFloat32Array = function (arr, e) {
        this._realloc(arr.length * 4);
        if (arr instanceof Float32Array &&
            this.byteOffset + this.position % arr.BYTES_PER_ELEMENT == 0) {
            DataStream.memcpy(this._buffer, this.byteOffset + this.position, arr.buffer, 0, arr.byteLength);
            this.mapFloat32Array(arr.length, e);
        }
        else {
            for (var i = 0; i < arr.length; i++) {
                this.writeFloat32(arr[i], e);
            }
        }
    };
    ;
    /**
      Reads a 32-bit int from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readInt32 = function (e) {
        var v = this._dataView.getInt32(this.position, e == null ? this.endianness : e);
        this.position += 4;
        return v;
    };
    ;
    /**
     Reads a 32-bit int from the DataStream with the offset.
    
     @param offset The offset.
     @return The read number.
     */
    DataStream.prototype.readInt = function (offset) {
        this.seek(offset);
        return this.readInt32();
    };
    ;
    /**
      Reads a 16-bit int from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readInt16 = function (e) {
        var v = this._dataView.getInt16(this.position, e == null ? this.endianness : e);
        this.position += 2;
        return v;
    };
    ;
    /**
     Reads a 16-bit int from the DataStream with the offset
    
     @param offset The offset.
     @return The read number.
     */
    DataStream.prototype.readShort = function (offset) {
        this.seek(offset);
        return this.readInt16();
    };
    ;
    /**
      Reads an 8-bit int from the DataStream.
    
      @return The read number.
     */
    DataStream.prototype.readInt8 = function () {
        var v = this._dataView.getInt8(this.position);
        this.position += 1;
        return v;
    };
    ;
    /**
     Reads an 8-bit int from the DataStream with the offset.
    
     @param offset The offset.
     @return The read number.
     */
    DataStream.prototype.readByte = function (offset) {
        this.seek(offset);
        return this.readInt8();
    };
    ;
    /**
      Reads a 32-bit unsigned int from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readUint32 = function (e) {
        var v = this._dataView.getUint32(this.position, e == null ? this.endianness : e);
        this.position += 4;
        return v;
    };
    ;
    /**
      Reads a 16-bit unsigned int from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readUint16 = function (e) {
        var v = this._dataView.getUint16(this.position, e == null ? this.endianness : e);
        this.position += 2;
        return v;
    };
    ;
    /**
      Reads an 8-bit unsigned int from the DataStream.
    
      @return The read number.
     */
    DataStream.prototype.readUint8 = function () {
        var v = this._dataView.getUint8(this.position);
        this.position += 1;
        return v;
    };
    ;
    /**
      Reads a 32-bit float from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readFloat32 = function (e) {
        var v = this._dataView.getFloat32(this.position, e == null ? this.endianness : e);
        this.position += 4;
        return v;
    };
    ;
    /**
      Reads a 64-bit float from the DataStream with the desired endianness.
    
      @param e Endianness of the number.
      @return The read number.
     */
    DataStream.prototype.readFloat64 = function (e) {
        var v = this._dataView.getFloat64(this.position, e == null ? this.endianness : e);
        this.position += 8;
        return v;
    };
    ;
    /**
      Writes a 32-bit int to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeInt32 = function (v, e) {
        this._realloc(4);
        this._dataView.setInt32(this.position, v, e == null ? this.endianness : e);
        this.position += 4;
    };
    ;
    /**
      Writes a 16-bit int to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeInt16 = function (v, e) {
        this._realloc(2);
        this._dataView.setInt16(this.position, v, e == null ? this.endianness : e);
        this.position += 2;
    };
    ;
    /**
      Writes an 8-bit int to the DataStream.
    
      @param v Number to write.
     */
    DataStream.prototype.writeInt8 = function (v) {
        this._realloc(1);
        this._dataView.setInt8(this.position, v);
        this.position += 1;
    };
    ;
    /**
      Writes a 32-bit unsigned int to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeUint32 = function (v, e) {
        this._realloc(4);
        this._dataView.setUint32(this.position, v, e == null ? this.endianness : e);
        this.position += 4;
    };
    ;
    /**
      Writes a 16-bit unsigned int to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeUint16 = function (v, e) {
        this._realloc(2);
        this._dataView.setUint16(this.position, v, e == null ? this.endianness : e);
        this.position += 2;
    };
    ;
    /**
      Writes an 8-bit unsigned  int to the DataStream.
    
      @param v Number to write.
     */
    DataStream.prototype.writeUint8 = function (v) {
        this._realloc(1);
        this._dataView.setUint8(this.position, v);
        this.position += 1;
    };
    ;
    /**
      Writes a 32-bit float to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeFloat32 = function (v, e) {
        this._realloc(4);
        this._dataView.setFloat32(this.position, v, e == null ? this.endianness : e);
        this.position += 4;
    };
    ;
    /**
      Writes a 64-bit float to the DataStream with the desired endianness.
    
      @param v Number to write.
      @param e Endianness of the number.
     */
    DataStream.prototype.writeFloat64 = function (v, e) {
        this._realloc(8);
        this._dataView.setFloat64(this.position, v, e == null ? this.endianness : e);
        this.position += 8;
    };
    ;
    /**
      Copies byteLength bytes from the src buffer at srcOffset to the
      dst buffer at dstOffset.
    
      @param dst Destination ArrayBuffer to write to.
      @param dstOffset Offset to the destination ArrayBuffer.
      @param src Source ArrayBuffer to read from.
      @param srcOffset Offset to the source ArrayBuffer.
      @param byteLength Number of bytes to copy.
     */
    DataStream.memcpy = function (dst, dstOffset, src, srcOffset, byteLength) {
        var dstU8 = new Uint8Array(dst, dstOffset, byteLength);
        var srcU8 = new Uint8Array(src, srcOffset, byteLength);
        dstU8.set(srcU8);
    };
    ;
    /**
      Converts array to native endianness in-place.
    
      @param array Typed array to convert.
      @param arrayIsLittleEndian True if the data in the array is
                                           little-endian. Set false for big-endian.
      @return The converted typed array.
     */
    DataStream.arrayToNative = function (array, arrayIsLittleEndian) {
        if (arrayIsLittleEndian == this.endianness) {
            return array;
        }
        else {
            return this.flipArrayEndianness(array);
        }
    };
    ;
    /**
      Converts native endianness array to desired endianness in-place.
    
      @param array Typed array to convert.
      @param littleEndian True if the converted array should be
                                    little-endian. Set false for big-endian.
      @return The converted typed array.
     */
    DataStream.nativeToEndian = function (array, littleEndian) {
        if (this.endianness == littleEndian) {
            return array;
        }
        else {
            return this.flipArrayEndianness(array);
        }
    };
    ;
    /**
      Flips typed array endianness in-place.
    
      @param array Typed array to flip.
      @return The converted typed array.
     */
    DataStream.flipArrayEndianness = function (array) {
        var u8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
        for (var i = 0; i < array.byteLength; i += array.BYTES_PER_ELEMENT) {
            for (var j = i + array.BYTES_PER_ELEMENT - 1, k = i; j > k; j--, k++) {
                var tmp = u8[k];
                u8[k] = u8[j];
                u8[j] = tmp;
            }
        }
        return array;
    };
    ;
    /**
      Creates an array from an array of character codes.
      Uses String.fromCharCode on the character codes and concats the results into a string.
    
      @param array Array of character codes.
      @return String created from the character codes.
    **/
    DataStream.createStringFromArray = function (array) {
        var str = "";
        for (var i = 0; i < array.length; i++) {
            str += String.fromCharCode(array[i]);
        }
        return str;
    };
    ;
    /**
      Reads a struct of data from the DataStream. The struct is defined as
      a flat array of [name, type]-pairs. See the example below:
    
      ds.readStruct([
        'headerTag', 'uint32', // Uint32 in DataStream endianness.
        'headerTag2', 'uint32be', // Big-endian Uint32.
        'headerTag3', 'uint32le', // Little-endian Uint32.
        'array', ['[]', 'uint32', 16], // Uint32Array of length 16.
        'array2Length', 'uint32',
        'array2', ['[]', 'uint32', 'array2Length'] // Uint32Array of length array2Length
      ]);
    
      The possible values for the type are as follows:
    
      // Number types
    
      // Unsuffixed number types use DataStream endianness.
      // To explicitly specify endianness, suffix the type with
      // 'le' for little-endian or 'be' for big-endian,
      // e.g. 'int32be' for big-endian int32.
    
      'uint8' -- 8-bit unsigned int
      'uint16' -- 16-bit unsigned int
      'uint32' -- 32-bit unsigned int
      'int8' -- 8-bit int
      'int16' -- 16-bit int
      'int32' -- 32-bit int
      'float32' -- 32-bit float
      'float64' -- 64-bit float
    
      // String types
      'cstring' -- ASCII string terminated by a zero byte.
      'string:N' -- ASCII string of length N, where N is a literal integer.
      'string:variableName' -- ASCII string of length $variableName,
        where 'variableName' is a previously parsed number in the current struct.
      'string,CHARSET:N' -- String of byteLength N encoded with given CHARSET.
      'u16string:N' -- UCS-2 string of length N in DataStream endianness.
      'u16stringle:N' -- UCS-2 string of length N in little-endian.
      'u16stringbe:N' -- UCS-2 string of length N in big-endian.
    
      // Complex types
      [name, type, name_2, type_2, ..., name_N, type_N] -- Struct
      function(dataStream, struct) {} -- Callback function to read and return data.
      {get: function(dataStream, struct) {},
       set: function(dataStream, struct) {}}
      -- Getter/setter functions to read and return data, handy for using the same
         struct definition for reading and writing structs.
      ['[]', type, length] -- Array of given type and length. The length can be either
                            a number, a string that references a previously-read
                            field, or a callback function(struct, dataStream, type){}.
                            If length is '*', reads in as many elements as it can.
    
      @param structDefinition Struct definition object.
      @return The read struct. Null if failed to read struct.
     */
    DataStream.prototype.readStruct = function (structDefinition) {
        var struct = {}, t, v, n;
        var p = this.position;
        for (var i = 0; i < structDefinition.length; i += 2) {
            t = structDefinition[i + 1];
            v = this.readType(t, struct);
            if (v == null) {
                if (this.failurePosition == 0) {
                    this.failurePosition = this.position;
                }
                this.position = p;
                return null;
            }
            struct[structDefinition[i]] = v;
        }
        return struct;
    };
    ;
    /**
      Read UCS-2 string of desired length and endianness from the DataStream.
    
      @param length The length of the string to read.
      @param endianness The endianness of the string data in the DataStream.
      @return The read string.
     */
    DataStream.prototype.readUCS2String = function (length, endianness) {
        return DataStream.createStringFromArray(this.readUint16Array(length, endianness));
    };
    ;
    /**
     Read UCS-2 string of desired length and offset from the DataStream.
    
     @param offset The offset.
     @param length The length of the string to read.
     @return The read string.
     */
    DataStream.prototype.readStringAt = function (offset, length) {
        this.seek(offset);
        return this.readUCS2String(length);
    };
    ;
    /**
      Write a UCS-2 string of desired endianness to the DataStream. The
      lengthOverride argument lets you define the number of characters to write.
      If the string is shorter than lengthOverride, the extra space is padded with
      zeroes.
    
      @param str The string to write.
      @param endianness The endianness to use for the written string data.
      @param lengthOverride The number of characters to write.
     */
    DataStream.prototype.writeUCS2String = function (str, endianness, lengthOverride) {
        if (lengthOverride == null) {
            lengthOverride = str.length;
        }
        for (var i = 0; i < str.length && i < lengthOverride; i++) {
            this.writeUint16(str.charCodeAt(i), endianness);
        }
        for (; i < lengthOverride; i++) {
            this.writeUint16(0, endianness);
        }
    };
    ;
    /**
      Read a string of desired length and encoding from the DataStream.
    
      @param length The length of the string to read in bytes.
      @param encoding The encoding of the string data in the DataStream.
                                Defaults to ASCII.
      @return The read string.
     */
    DataStream.prototype.readString = function (length, encoding) {
        if (encoding == null || encoding == "ASCII") {
            return DataStream.createStringFromArray(this.mapUint8Array(length == null ? this.byteLength - this.position : length));
        }
        else {
            return iconv.decode(this.mapUint8Array(length), encoding);
        }
    };
    ;
    /**
      Writes a string of desired length and encoding to the DataStream.
    
      @param s The string to write.
      @param encoding The encoding for the written string data.
                                Defaults to ASCII.
      @param length The number of characters to write.
     */
    DataStream.prototype.writeString = function (s, encoding, length) {
        if (encoding == null || encoding == "ASCII") {
            if (length != null) {
                var i = 0;
                var len = Math.min(s.length, length);
                for (i = 0; i < len; i++) {
                    this.writeUint8(s.charCodeAt(i));
                }
                for (; i < length; i++) {
                    this.writeUint8(0);
                }
            }
            else {
                for (var i = 0; i < s.length; i++) {
                    this.writeUint8(s.charCodeAt(i));
                }
            }
        }
        else {
            this.writeUint8Array(iconv.encode(s.substring(0, length), encoding));
        }
    };
    ;
    /**
      Read null-terminated string of desired length from the DataStream. Truncates
      the returned string so that the null byte is not a part of it.
    
      @param length The length of the string to read.
      @return The read string.
     */
    DataStream.prototype.readCString = function (length) {
        var blen = this.byteLength - this.position;
        var u8 = new Uint8Array(this._buffer, this._byteOffset + this.position);
        var len = blen;
        if (length != null) {
            len = Math.min(length, blen);
        }
        for (var i = 0; i < len && u8[i] != 0; i++)
            ; // find first zero byte
        var s = DataStream.createStringFromArray(this.mapUint8Array(i));
        if (length != null) {
            this.position += len - i;
        }
        else if (i != blen) {
            this.position += 1; // trailing zero if not at end of buffer
        }
        return s;
    };
    ;
    /**
      Writes a null-terminated string to DataStream and zero-pads it to length
      bytes. If length is not given, writes the string followed by a zero.
      If string is longer than length, the written part of the string does not have
      a trailing zero.
    
      @param s The string to write.
      @param length The number of characters to write.
     */
    DataStream.prototype.writeCString = function (s, length) {
        if (length != null) {
            var i = 0;
            var len = Math.min(s.length, length);
            for (i = 0; i < len; i++) {
                this.writeUint8(s.charCodeAt(i));
            }
            for (; i < length; i++) {
                this.writeUint8(0);
            }
        }
        else {
            for (var i = 0; i < s.length; i++) {
                this.writeUint8(s.charCodeAt(i));
            }
            this.writeUint8(0);
        }
    };
    ;
    /**
      Reads an object of type t from the DataStream, passing struct as the thus-far
      read struct to possible callbacks that refer to it. Used by readStruct for
      reading in the values, so the type is one of the readStruct types.
    
      @param t Type of the object to read.
      @param struct Struct to refer to when resolving length references
                              and for calling callbacks.
      @return Returns the object on successful read, null on unsuccessful.
     */
    DataStream.prototype.readType = function (t, struct) {
        if (typeof t == "function") {
            return t(this, struct);
        }
        else if (typeof t == "object" && !(t instanceof Array)) {
            return t.get(this, struct);
        }
        else if (t instanceof Array && t.length != 3) {
            return this.readStruct(t);
        }
        var v = null;
        var lengthOverride = null;
        var charset = "ASCII";
        var pos = this.position;
        var len;
        if (typeof t == 'string' && /:/.test(t)) {
            var tp = t.split(":");
            t = tp[0];
            len = tp[1];
            // allow length to be previously parsed variable
            // e.g. 'string:fieldLength', if `fieldLength` has
            // been parsed previously.
            if (struct[len] != null) {
                lengthOverride = parseInt(struct[len]);
            }
            else {
                // assume literal integer e.g., 'string:4'
                lengthOverride = parseInt(tp[1]);
            }
        }
        if (typeof t == 'string' && /,/.test(t)) {
            var tp = t.split(",");
            t = tp[0];
            charset = parseInt(tp[1]).toString();
        }
        switch (t) {
            case 'uint8':
                v = this.readUint8();
                break;
            case 'int8':
                v = this.readInt8();
                break;
            case 'uint16':
                v = this.readUint16(this.endianness);
                break;
            case 'int16':
                v = this.readInt16(this.endianness);
                break;
            case 'uint32':
                v = this.readUint32(this.endianness);
                break;
            case 'int32':
                v = this.readInt32(this.endianness);
                break;
            case 'float32':
                v = this.readFloat32(this.endianness);
                break;
            case 'float64':
                v = this.readFloat64(this.endianness);
                break;
            case 'uint16be':
                v = this.readUint16(DataStream.BIG_ENDIAN);
                break;
            case 'int16be':
                v = this.readInt16(DataStream.BIG_ENDIAN);
                break;
            case 'uint32be':
                v = this.readUint32(DataStream.BIG_ENDIAN);
                break;
            case 'int32be':
                v = this.readInt32(DataStream.BIG_ENDIAN);
                break;
            case 'float32be':
                v = this.readFloat32(DataStream.BIG_ENDIAN);
                break;
            case 'float64be':
                v = this.readFloat64(DataStream.BIG_ENDIAN);
                break;
            case 'uint16le':
                v = this.readUint16(DataStream.LITTLE_ENDIAN);
                break;
            case 'int16le':
                v = this.readInt16(DataStream.LITTLE_ENDIAN);
                break;
            case 'uint32le':
                v = this.readUint32(DataStream.LITTLE_ENDIAN);
                break;
            case 'int32le':
                v = this.readInt32(DataStream.LITTLE_ENDIAN);
                break;
            case 'float32le':
                v = this.readFloat32(DataStream.LITTLE_ENDIAN);
                break;
            case 'float64le':
                v = this.readFloat64(DataStream.LITTLE_ENDIAN);
                break;
            case 'cstring':
                v = this.readCString(lengthOverride);
                break;
            case 'string':
                v = this.readString(lengthOverride, charset);
                break;
            case 'u16string':
                v = this.readUCS2String(lengthOverride, this.endianness);
                break;
            case 'u16stringle':
                v = this.readUCS2String(lengthOverride, DataStream.LITTLE_ENDIAN);
                break;
            case 'u16stringbe':
                v = this.readUCS2String(lengthOverride, DataStream.BIG_ENDIAN);
                break;
            default:
                if (t.length == 3) {
                    var ta = t[1];
                    var len = t[2];
                    var length = 0;
                    if (typeof len == 'function') {
                        length = len(struct, this, t);
                    }
                    else if (typeof len == 'string' && struct[len] != null) {
                        length = parseInt(struct[len]);
                    }
                    else {
                        length = parseInt(len);
                    }
                    if (typeof ta == "string") {
                        var tap = ta.replace(/(le|be)$/, '');
                        var endianness = null;
                        if (/le$/.test(ta)) {
                            endianness = DataStream.LITTLE_ENDIAN;
                        }
                        else if (/be$/.test(ta)) {
                            endianness = DataStream.BIG_ENDIAN;
                        }
                        if (len == '*') {
                            length = null;
                        }
                        switch (tap) {
                            case 'uint8':
                                v = this.readUint8Array(length);
                                break;
                            case 'uint16':
                                v = this.readUint16Array(length, endianness);
                                break;
                            case 'uint32':
                                v = this.readUint32Array(length, endianness);
                                break;
                            case 'int8':
                                v = this.readInt8Array(length);
                                break;
                            case 'int16':
                                v = this.readInt16Array(length, endianness);
                                break;
                            case 'int32':
                                v = this.readInt32Array(length, endianness);
                                break;
                            case 'float32':
                                v = this.readFloat32Array(length, endianness);
                                break;
                            case 'float64':
                                v = this.readFloat64Array(length, endianness);
                                break;
                            case 'cstring':
                            case 'utf16string':
                            case 'string':
                                if (length == null) {
                                    v = [];
                                    while (!this.isEof()) {
                                        var u = this.readType(ta, struct);
                                        if (u == null)
                                            break;
                                        v.push(u);
                                    }
                                }
                                else {
                                    v = new Array(length);
                                    for (var i = 0; i < length; i++) {
                                        v[i] = this.readType(ta, struct);
                                    }
                                }
                                break;
                        }
                    }
                    else {
                        if (len == '*') {
                            v = [];
                            this.buffer;
                            while (true) {
                                var p = this.position;
                                try {
                                    var o = this.readType(ta, struct);
                                    if (o == null) {
                                        this.position = p;
                                        break;
                                    }
                                    v.push(o);
                                }
                                catch (e) {
                                    this.position = p;
                                    break;
                                }
                            }
                        }
                        else {
                            v = new Array(length);
                            for (var i = 0; i < length; i++) {
                                var u = this.readType(ta, struct);
                                if (u == null)
                                    return null;
                                v[i] = u;
                            }
                        }
                    }
                    break;
                }
        }
        if (lengthOverride != null) {
            this.position = pos + lengthOverride;
        }
        return v;
    };
    ;
    /**
      Writes a struct to the DataStream. Takes a structDefinition that gives the
      types and a struct object that gives the values. Refer to readStruct for the
      structure of structDefinition.
    
      @param structDefinition Type definition of the struct.
      @param struct The struct data object.
      */
    DataStream.prototype.writeStruct = function (structDefinition, struct) {
        for (var i = 0; i < structDefinition.length; i += 2) {
            var t = structDefinition[i + 1];
            this.writeType(t, struct[structDefinition[i]], struct);
        }
    };
    ;
    /**
      Writes object v of type t to the DataStream.
    
      @param t Type of data to write.
      @param v Value of data to write.
      @param struct Struct to pass to write callback functions.
      */
    DataStream.prototype.writeType = function (t, v, struct) {
        if (typeof t == "function") {
            return t(this, v);
        }
        else if (typeof t == "object" && !(t instanceof Array)) {
            return t.set(this, v, struct);
        }
        var lengthOverride = null;
        var charset = "ASCII";
        var pos = this.position;
        if (typeof (t) == 'string' && /:/.test(t)) {
            var tp = t.split(":");
            t = tp[0];
            lengthOverride = parseInt(tp[1]);
        }
        if (typeof t == 'string' && /,/.test(t)) {
            var tp = t.split(",");
            t = tp[0];
            charset = parseInt(tp[1]).toString();
        }
        switch (t) {
            case 'uint8':
                this.writeUint8(v);
                break;
            case 'int8':
                this.writeInt8(v);
                break;
            case 'uint16':
                this.writeUint16(v, this.endianness);
                break;
            case 'int16':
                this.writeInt16(v, this.endianness);
                break;
            case 'uint32':
                this.writeUint32(v, this.endianness);
                break;
            case 'int32':
                this.writeInt32(v, this.endianness);
                break;
            case 'float32':
                this.writeFloat32(v, this.endianness);
                break;
            case 'float64':
                this.writeFloat64(v, this.endianness);
                break;
            case 'uint16be':
                this.writeUint16(v, DataStream.BIG_ENDIAN);
                break;
            case 'int16be':
                this.writeInt16(v, DataStream.BIG_ENDIAN);
                break;
            case 'uint32be':
                this.writeUint32(v, DataStream.BIG_ENDIAN);
                break;
            case 'int32be':
                this.writeInt32(v, DataStream.BIG_ENDIAN);
                break;
            case 'float32be':
                this.writeFloat32(v, DataStream.BIG_ENDIAN);
                break;
            case 'float64be':
                this.writeFloat64(v, DataStream.BIG_ENDIAN);
                break;
            case 'uint16le':
                this.writeUint16(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'int16le':
                this.writeInt16(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'uint32le':
                this.writeUint32(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'int32le':
                this.writeInt32(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'float32le':
                this.writeFloat32(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'float64le':
                this.writeFloat64(v, DataStream.LITTLE_ENDIAN);
                break;
            case 'cstring':
                this.writeCString(v, lengthOverride);
                break;
            case 'string':
                this.writeString(v, charset, lengthOverride);
                break;
            case 'u16string':
                this.writeUCS2String(v, this.endianness, lengthOverride);
                break;
            case 'u16stringle':
                this.writeUCS2String(v, DataStream.LITTLE_ENDIAN, lengthOverride);
                break;
            case 'u16stringbe':
                this.writeUCS2String(v, DataStream.BIG_ENDIAN, lengthOverride);
                break;
            default:
                if (t.length == 3) {
                    var ta = t[1];
                    for (var i = 0; i < v.length; i++) {
                        this.writeType(ta, v[i], t[2]);
                    }
                    break;
                }
                else {
                    this.writeStruct(t, v);
                    break;
                }
        }
        if (lengthOverride != null) {
            this.position = pos;
            this._realloc(lengthOverride);
            this.position = pos + lengthOverride;
        }
    };
    ;
    /**
      Big-endian const to use as default endianness.
      */
    DataStream.BIG_ENDIAN = false;
    /**
      Little-endian const to use as default endianness.
      */
    DataStream.LITTLE_ENDIAN = true;
    /**
      Native endianness. Either DataStream.BIG_ENDIAN or DataStream.LITTLE_ENDIAN
      depending on the platform endianness.
    
     */
    DataStream.endianness = new Int8Array(new Int16Array([1]).buffer)[0] > 0;
    return DataStream;
}());
exports["default"] = DataStream;
/* Fix for Opera 12 not defining BYTES_PER_ELEMENT in typed array prototypes. */
if (Uint8Array.prototype.BYTES_PER_ELEMENT === undefined) {
    Object.defineProperties(Uint8Array.prototype, { BYTES_PER_ELEMENT: { value: Uint8Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Int8Array.prototype, { BYTES_PER_ELEMENT: { value: Int8Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Uint8ClampedArray.prototype, { BYTES_PER_ELEMENT: { value: Uint8ClampedArray.BYTES_PER_ELEMENT } });
    Object.defineProperties(Uint16Array.prototype, { BYTES_PER_ELEMENT: { value: Uint16Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Int16Array.prototype, { BYTES_PER_ELEMENT: { value: Int16Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Uint32Array.prototype, { BYTES_PER_ELEMENT: { value: Uint32Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Int32Array.prototype, { BYTES_PER_ELEMENT: { value: Int32Array.BYTES_PER_ELEMENT } });
    Object.defineProperties(Float64Array.prototype, { BYTES_PER_ELEMENT: { value: Float64Array.BYTES_PER_ELEMENT } });
}


/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("iconv-lite");

/***/ }),
/* 41 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reader = exports.TypeEnum = void 0;
var DataStream_1 = __importDefault(__webpack_require__(39));
var utils_1 = __webpack_require__(38);
var const_1 = __importDefault(__webpack_require__(37));
/**
 * `Object Type` in `2.6.1 Compound File Directory Entry`
 *
 * See also: [[MS-CFB]: Compound File Directory Entry | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/60fe8611-66c3-496b-b70d-a504c94c9ace)
 */
var TypeEnum;
(function (TypeEnum) {
    /**
     * `Storage Object`
     *
     * storage object: An object in a compound file that is analogous to a file system directory. The parent object of a storage object must be another storage object or the root storage object.
     *
     * See also:
     *
     * - [[MS-CFB]: Other Directory Entries | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/b37413bb-f3ef-4adc-b18e-29bddd62c26e)
     * - [[MS-CFB]: Glossary | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/59ccb2ef-1ce5-41e3-bc30-075dea759d0a#gt_c3ddf892-3f55-4561-8804-20325dbc8fba)
     */
    TypeEnum[TypeEnum["DIRECTORY"] = 1] = "DIRECTORY";
    /**
     * `Stream Object`
     *
     * - stream object: An object in a compound file that is analogous to a file system file. The parent object of a stream object must be a storage object or the root storage object.
     *
     * See also:
     * - [[MS-CFB]: Compound File User-Defined Data Sectors | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/b089deda-be20-4b4a-aad5-fbe68bb19672)
     * - [[MS-CFB]: Glossary | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/59ccb2ef-1ce5-41e3-bc30-075dea759d0a#gt_9f598e1c-0d65-4845-8f06-8d50f7a32fd5)
     */
    TypeEnum[TypeEnum["DOCUMENT"] = 2] = "DOCUMENT";
    /**
     * `Root Storage Object`
     *
     * - root storage object: A storage object in a compound file that must be accessed before any other storage objects and stream objects are referenced. It is the uppermost parent object in the storage object and stream object hierarchy.
     *
     * See also:
     * - [[MS-CFB]: Root Directory Entry | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/026fde6e-143d-41bf-a7da-c08b2130d50e)
     * - [[MS-CFB]: Glossary | Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/59ccb2ef-1ce5-41e3-bc30-075dea759d0a#gt_d49237e3-04dd-4823-a0a5-5e23f750a5f4)
     */
    TypeEnum[TypeEnum["ROOT"] = 5] = "ROOT";
})(TypeEnum = exports.TypeEnum || (exports.TypeEnum = {}));
/**
 * Original msg file (CFBF) reader which was implemented in MsgReader.
 */
var Reader = /** @class */ (function () {
    function Reader(arrayBuffer) {
        this.ds = new DataStream_1.default(arrayBuffer, 0, DataStream_1.default.LITTLE_ENDIAN);
    }
    Reader.prototype.isMSGFile = function () {
        this.ds.seek(0);
        return (0, utils_1.arraysEqual)(const_1.default.FILE_HEADER, this.ds.readInt8Array(const_1.default.FILE_HEADER.length));
    };
    Reader.prototype.headerData = function () {
        this.bigBlockSize = this.ds.readByte(30) == const_1.default.MSG.L_BIG_BLOCK_MARK ? const_1.default.MSG.L_BIG_BLOCK_SIZE : const_1.default.MSG.S_BIG_BLOCK_SIZE;
        this.bigBlockLength = this.bigBlockSize / 4;
        // system data
        this.xBlockLength = this.bigBlockLength - 1;
        // header data
        this.batCount = this.ds.readInt(const_1.default.MSG.HEADER.BAT_COUNT_OFFSET);
        this.propertyStart = this.ds.readInt(const_1.default.MSG.HEADER.PROPERTY_START_OFFSET);
        this.sbatStart = this.ds.readInt(const_1.default.MSG.HEADER.SBAT_START_OFFSET);
        this.sbatCount = this.ds.readInt(const_1.default.MSG.HEADER.SBAT_COUNT_OFFSET);
        this.xbatStart = this.ds.readInt(const_1.default.MSG.HEADER.XBAT_START_OFFSET);
        this.xbatCount = this.ds.readInt(const_1.default.MSG.HEADER.XBAT_COUNT_OFFSET);
    };
    Reader.prototype.convertName = function (offset) {
        var nameLength = this.ds.readShort(offset + const_1.default.MSG.PROP.NAME_SIZE_OFFSET);
        if (nameLength < 1) {
            return '';
        }
        else {
            return this.ds.readStringAt(offset, nameLength / 2).split('\0')[0];
        }
    };
    Reader.prototype.convertProperty = function (offset) {
        return {
            type: this.ds.readByte(offset + const_1.default.MSG.PROP.TYPE_OFFSET),
            name: this.convertName(offset),
            // hierarchy
            previousProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.PREVIOUS_PROPERTY_OFFSET),
            nextProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.NEXT_PROPERTY_OFFSET),
            childProperty: this.ds.readInt(offset + const_1.default.MSG.PROP.CHILD_PROPERTY_OFFSET),
            // data offset
            startBlock: this.ds.readInt(offset + const_1.default.MSG.PROP.START_BLOCK_OFFSET),
            sizeBlock: this.ds.readInt(offset + const_1.default.MSG.PROP.SIZE_OFFSET),
        };
    };
    Reader.prototype.convertBlockToProperties = function (propertyBlockOffset, props) {
        var propertyCount = this.bigBlockSize / const_1.default.MSG.PROP.PROPERTY_SIZE;
        var propertyOffset = this.getBlockOffsetAt(propertyBlockOffset);
        for (var i = 0; i < propertyCount; i++) {
            if (this.ds.byteLength < propertyOffset + const_1.default.MSG.PROP.TYPE_OFFSET) {
                break;
            }
            var propertyType = this.ds.readByte(propertyOffset + const_1.default.MSG.PROP.TYPE_OFFSET);
            switch (propertyType) {
                case const_1.default.MSG.PROP.TYPE_ENUM.ROOT:
                case const_1.default.MSG.PROP.TYPE_ENUM.DIRECTORY:
                case const_1.default.MSG.PROP.TYPE_ENUM.DOCUMENT:
                    props.push(this.convertProperty(propertyOffset));
                    break;
            }
            propertyOffset += const_1.default.MSG.PROP.PROPERTY_SIZE;
        }
    };
    Reader.prototype.createPropertyHierarchy = function (props, nodeProperty) {
        if (!nodeProperty || nodeProperty.childProperty == const_1.default.MSG.PROP.NO_INDEX) {
            return;
        }
        nodeProperty.children = [];
        var children = [nodeProperty.childProperty];
        while (children.length != 0) {
            var currentIndex = children.shift();
            var current = props[currentIndex];
            if (current == null) {
                continue;
            }
            nodeProperty.children.push(currentIndex);
            if (current.type == const_1.default.MSG.PROP.TYPE_ENUM.DIRECTORY) {
                this.createPropertyHierarchy(props, current);
            }
            if (current.previousProperty != const_1.default.MSG.PROP.NO_INDEX) {
                children.push(current.previousProperty);
            }
            if (current.nextProperty != const_1.default.MSG.PROP.NO_INDEX) {
                children.push(current.nextProperty);
            }
        }
    };
    Reader.prototype.propertyDataReader = function (propertyStart) {
        var props = [];
        var currentOffset = propertyStart;
        while (currentOffset != const_1.default.MSG.END_OF_CHAIN) {
            this.convertBlockToProperties(currentOffset, props);
            currentOffset = this.getNextBlock(currentOffset);
        }
        this.createPropertyHierarchy(props, props[0]);
        return props;
    };
    /**
     * Parse msg file.
     */
    Reader.prototype.parse = function () {
        this.headerData();
        this.batData = this.batDataReader();
        if (this.xbatCount > 0) {
            this.xbatDataReader();
        }
        this.sbatData = this.sbatDataReader();
        this.propertyData = this.propertyDataReader(this.propertyStart);
        this.bigBlockTable = this.readBigBlockTable();
    };
    Reader.prototype.batCountInHeader = function () {
        var maxBatsInHeader = (const_1.default.MSG.S_BIG_BLOCK_SIZE - const_1.default.MSG.HEADER.BAT_START_OFFSET) / 4;
        return Math.min(this.batCount, maxBatsInHeader);
    };
    Reader.prototype.batDataReader = function () {
        var result = new Array(this.batCountInHeader());
        this.ds.seek(const_1.default.MSG.HEADER.BAT_START_OFFSET);
        for (var i = 0; i < result.length; i++) {
            result[i] = this.ds.readInt32();
        }
        return result;
    };
    Reader.prototype.getBlockOffsetAt = function (offset) {
        return (offset + 1) * this.bigBlockSize;
    };
    Reader.prototype.getBlockAt = function (offset) {
        var startOffset = this.getBlockOffsetAt(offset);
        this.ds.seek(startOffset);
        return this.ds.readInt32Array(this.bigBlockLength);
    };
    Reader.prototype.getBlockValueAt = function (offset, index) {
        var startOffset = this.getBlockOffsetAt(offset);
        this.ds.seek(startOffset + 4 * index);
        return this.ds.readInt32();
    };
    Reader.prototype.getNextBlockInner = function (offset, blockOffsetData) {
        var currentBlock = Math.floor(offset / this.bigBlockLength);
        var currentBlockIndex = offset % this.bigBlockLength;
        var startBlockOffset = blockOffsetData[currentBlock];
        if (typeof startBlockOffset === "undefined") {
            return const_1.default.MSG.END_OF_CHAIN;
        }
        return this.getBlockValueAt(startBlockOffset, currentBlockIndex);
    };
    Reader.prototype.getNextBlock = function (offset) {
        return this.getNextBlockInner(offset, this.batData);
    };
    Reader.prototype.sbatDataReader = function () {
        var result = [];
        var startIndex = this.sbatStart;
        for (var i = 0; i < this.sbatCount && startIndex && startIndex != const_1.default.MSG.END_OF_CHAIN; i++) {
            result.push(startIndex);
            startIndex = this.getNextBlock(startIndex);
        }
        return result;
    };
    Reader.prototype.xbatDataReader = function () {
        var batCount = this.batCountInHeader();
        var batCountTotal = this.batCount;
        var remainingBlocks = batCountTotal - batCount;
        var nextBlockAt = this.xbatStart;
        for (var i = 0; i < this.xbatCount; i++) {
            var xBatBlock = this.getBlockAt(nextBlockAt);
            var blocksToProcess = Math.min(remainingBlocks, this.xBlockLength);
            for (var j = 0; j < blocksToProcess; j++) {
                var blockStartAt = xBatBlock[j];
                if (blockStartAt == const_1.default.MSG.UNUSED_BLOCK || blockStartAt == const_1.default.MSG.END_OF_CHAIN) {
                    break;
                }
                this.batData.push(blockStartAt);
            }
            remainingBlocks -= blocksToProcess;
            nextBlockAt = xBatBlock[this.xBlockLength];
            if (nextBlockAt == const_1.default.MSG.UNUSED_BLOCK || nextBlockAt == const_1.default.MSG.END_OF_CHAIN) {
                break;
            }
        }
    };
    Reader.prototype.getNextBlockSmall = function (offset) {
        return this.getNextBlockInner(offset, this.sbatData);
    };
    Reader.prototype.getChainByBlockSmall = function (fieldProperty) {
        var blockChain = [];
        var nextBlockSmall = fieldProperty.startBlock;
        while (nextBlockSmall != const_1.default.MSG.END_OF_CHAIN) {
            blockChain.push(nextBlockSmall);
            nextBlockSmall = this.getNextBlockSmall(nextBlockSmall);
        }
        return blockChain;
    };
    Reader.prototype.readBigBlockTable = function () {
        var rootProp = this.propertyData[0];
        var table = [];
        var nextBlock = rootProp.startBlock;
        for (var i = 0; nextBlock != const_1.default.MSG.END_OF_CHAIN; i++) {
            table.push(nextBlock);
            nextBlock = this.getNextBlock(nextBlock);
        }
        return table;
    };
    Reader.prototype.readDataByBlockSmall = function (startBlock, blockSize, arr, dstOffset) {
        var byteOffset = startBlock * const_1.default.MSG.SMALL_BLOCK_SIZE;
        var bigBlockNumber = Math.floor(byteOffset / this.bigBlockSize);
        var bigBlockOffset = byteOffset % this.bigBlockSize;
        var nextBlock = this.bigBlockTable[bigBlockNumber];
        var blockStartOffset = this.getBlockOffsetAt(nextBlock);
        this.ds.seek(blockStartOffset + bigBlockOffset);
        return this.ds.readToUint8Array(blockSize, arr, dstOffset);
    };
    Reader.prototype.readChainDataByBlockSmall = function (fieldProperty, chain) {
        var resultData = new Uint8Array(fieldProperty.sizeBlock);
        for (var i = 0, idx = 0; i < chain.length; i++) {
            var readLen = (resultData.length < idx + const_1.default.MSG.SMALL_BLOCK_SIZE)
                ? resultData.length - idx
                : const_1.default.MSG.SMALL_BLOCK_SIZE;
            this.readDataByBlockSmall(chain[i], readLen, resultData, idx);
            idx += readLen;
        }
        return resultData;
    };
    Reader.prototype.readProperty = function (fieldProperty) {
        if (!fieldProperty.sizeBlock) {
            return new Uint8Array(0);
        }
        else if (fieldProperty.sizeBlock < const_1.default.MSG.BIG_BLOCK_MIN_DOC_SIZE) {
            var chain = this.getChainByBlockSmall(fieldProperty);
            if (chain.length == 1) {
                var resultData = new Uint8Array(fieldProperty.sizeBlock);
                this.readDataByBlockSmall(fieldProperty.startBlock, fieldProperty.sizeBlock, resultData, 0);
                return resultData;
            }
            else if (chain.length > 1) {
                return this.readChainDataByBlockSmall(fieldProperty, chain);
            }
            return new Uint8Array(0);
        }
        else {
            var nextBlock = fieldProperty.startBlock;
            var remaining = fieldProperty.sizeBlock;
            var position = 0;
            var resultData = new Uint8Array(fieldProperty.sizeBlock);
            while (1 <= remaining) {
                var blockStartOffset = this.getBlockOffsetAt(nextBlock);
                this.ds.seek(blockStartOffset);
                var partSize = Math.min(remaining, this.bigBlockSize);
                var part = this.ds.readUint8Array(partSize);
                resultData.set(part, position);
                position += partSize;
                remaining -= partSize;
                nextBlock = this.getNextBlock(nextBlock);
            }
            return resultData;
        }
    };
    /**
     * Get binary from document in CFBF.
     *
     * @param index entry index
     * @returns binary
     * @internal
     */
    Reader.prototype.readFileOf = function (index) {
        return this.readProperty(this.propertyData[index]);
    };
    Reader.prototype.folderOf = function (index) {
        var _this = this;
        var propertyData = this.propertyData;
        if (!propertyData) {
            return null;
        }
        var folder = propertyData[index];
        return {
            dataId: index,
            name: folder.name,
            fileNames: function () {
                var children = folder.children;
                if (children) {
                    return children
                        .map(function (subIndex) { return propertyData[subIndex]; })
                        .filter(function (it) { return it.type === TypeEnum.DOCUMENT; })
                        .map(function (it) { return it.name; });
                }
                return [];
            },
            fileNameSets: function () {
                var children = folder.children;
                if (children) {
                    return children
                        .map(function (subIndex) { return ({
                        subIndex: subIndex,
                        entry: propertyData[subIndex]
                    }); })
                        .filter(function (it) { return it.entry.type === TypeEnum.DOCUMENT; })
                        .map(function (it) { return ({
                        name: it.entry.name,
                        length: it.entry.sizeBlock,
                        dataId: it.subIndex,
                        provider: function () { return _this.readProperty(it.entry); },
                    }); });
                }
                return [];
            },
            subFolders: function () {
                var children = folder.children;
                if (children) {
                    return children
                        .filter(function (subIndex) { return propertyData[subIndex].type == TypeEnum.DIRECTORY; })
                        .map(function (subIndex) { return _this.folderOf(subIndex); });
                }
                return [];
            },
            readFile: function (fileName) {
                var children = folder.children;
                if (children) {
                    for (var _i = 0, children_1 = children; _i < children_1.length; _i++) {
                        var subIndex = children_1[_i];
                        var file = propertyData[subIndex];
                        if (file && file.type === TypeEnum.DOCUMENT && file.name === fileName) {
                            return _this.readProperty(file);
                        }
                    }
                }
                return null;
            },
        };
    };
    /**
     * Get reader access to CFBF (valid after successful call of {@link parse}).
     *
     * @returns root folder
     */
    Reader.prototype.rootFolder = function () {
        return this.folderOf(0);
    };
    return Reader;
}());
exports.Reader = Reader;


/***/ }),
/* 42 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.burn = void 0;
var Reader_1 = __webpack_require__(41);
var DataStream_1 = __importDefault(__webpack_require__(39));
var const_1 = __importDefault(__webpack_require__(37));
function RoundUpto4096(num) {
    return (num + 4095) & (~4095);
}
function RoundUpto512(bytes) {
    return (bytes + 511) & (~511);
}
function RoundUpto64(bytes) {
    return (bytes + 63) & (~63);
}
function repeatValue(value, count) {
    var array = [];
    for (var x = 0; x < count; x++) {
        array.push(value);
    }
    return array;
}
var LiteFat = /** @class */ (function () {
    function LiteFat(source) {
        this.sectors = source;
    }
    LiteFat.prototype.allocate = function (count) {
        var first = this.sectors.length;
        for (var x = 0; x < count; x++) {
            var next = (x + 1 === count) ? -2 : first + x + 1;
            this.sectors.push(next);
        }
        return first;
    };
    LiteFat.prototype.allocateAs = function (count, value) {
        var first = this.sectors.length;
        for (var x = 0; x < count; x++) {
            this.sectors.push(value);
        }
        return first;
    };
    LiteFat.prototype.finalize = function (boundary, value) {
        var num = (boundary - (this.sectors.length % boundary)) % boundary;
        for (; num >= 1; num -= 1) {
            this.sectors.push(value);
        }
        return this;
    };
    LiteFat.prototype.count = function () {
        return this.sectors.length;
    };
    return LiteFat;
}());
var LiteBurner = /** @class */ (function () {
    function LiteBurner(entries) {
        this.fat = new LiteFat([]);
        this.miniFat = new LiteFat([]);
        this.liteEnts = entries
            .map(function (it) { return ({
            entry: it,
            left: -1,
            right: -1,
            child: -1,
            firstSector: 0,
            isMini: it.length < 4096,
        }); });
        this.buildTree(0);
        var entriesFirstSector = this.fat.allocate(RoundUpto512(128 * this.liteEnts.length) / 512);
        for (var _i = 0, _a = this.liteEnts
            .filter(function (it) { return  true
            && it.entry.type == Reader_1.TypeEnum.DOCUMENT
            && it.isMini === false; }); _i < _a.length; _i++) {
            var liteEnt = _a[_i];
            liteEnt.firstSector = (liteEnt.entry.length === 0)
                ? -2
                : this.fat.allocate(RoundUpto512(liteEnt.entry.length) / 512);
        }
        for (var _b = 0, _c = this.liteEnts
            .filter(function (it) { return  true
            && it.entry.type == Reader_1.TypeEnum.DOCUMENT
            && it.isMini === true; }); _b < _c.length; _b++) {
            var liteEnt = _c[_b];
            liteEnt.firstSector = (liteEnt.entry.length === 0)
                ? -2
                : this.miniFat.allocate(RoundUpto64(liteEnt.entry.length) / 64);
        }
        var numMiniFatSectors = RoundUpto512(4 * this.miniFat.count()) / 512;
        var firstMiniFatSector = (numMiniFatSectors !== 0)
            ? this.fat.allocate(numMiniFatSectors)
            : -2;
        var bytesMiniFat = 64 * this.miniFat.count();
        var firstMiniDataSector = this.fat.allocate(RoundUpto512(bytesMiniFat) / 512);
        this.liteEnts[0].firstSector = firstMiniDataSector;
        var firstFatSector = this.fat.allocateAs(RoundUpto512(4 * (this.fat.count() + this.fat.count() / 128 + this.fat.count() / (128 * 109))) / 512, -3);
        var numFatSectors = this.fat.count() - firstFatSector;
        var numDifatSectors = (numFatSectors > 109)
            ? RoundUpto512(4 * Math.floor((numFatSectors - 109) / 127 * 128)) / 512
            : 0;
        var firstDifatSector = (numDifatSectors !== 0)
            ? this.fat.allocateAs(numDifatSectors, -4)
            : -2;
        var array = new ArrayBuffer(512 * (1 + this.fat.count()));
        var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
        ds.dynamicSize = false;
        this.miniFat.finalize(512 / 4, -1);
        var difat1 = [];
        var difat2 = [];
        {
            var x = 0;
            for (; x < 109 && x < numFatSectors; x++) {
                difat1.push(firstFatSector + x);
            }
            var nextDifatSector = firstDifatSector + 1;
            for (; x < numFatSectors; x++) {
                difat2.push(firstFatSector + x);
                var remain = (difat2.length & 127);
                if (remain === 127) {
                    difat2.push(nextDifatSector);
                    nextDifatSector++;
                }
            }
            while (true) {
                var remain = (difat2.length & 127);
                if (remain === 0) {
                    break;
                }
                difat2.push((remain === 127) ? -2 : -1);
            }
        }
        // header
        {
            ds.seek(0);
            ds.writeUint8Array(const_1.default.FILE_HEADER);
            ds.seek(0x18);
            ds.writeUint16(0x3E); //ushort MinorVersion
            ds.writeUint16(0x03); //ushort MajorVersion
            ds.writeUint16(0xFFFE); //ushort ByteOrder
            ds.writeUint16(9); //ushort SectorShift
            ds.writeUint16(6); //ushort MiniSectorShift
            ds.seek(0x2C);
            ds.writeInt32(numFatSectors); //int32 NumberOfFATSectors
            ds.writeInt32(entriesFirstSector); //int32 FirstDirectorySectorLocation
            ds.seek(0x38);
            ds.writeInt32(4096); //int32 MiniStreamCutoffSize
            ds.writeInt32(firstMiniFatSector); //int32 FirstMiniFATSectorLocation
            ds.writeInt32(numMiniFatSectors); //int32 NumberOfMiniFATSectors
            ds.writeInt32(firstDifatSector); //int32 FirstDIFATSectorLocation
            ds.writeInt32(numDifatSectors); //int32 NumberOfDIFATSectors
            var x = 0;
            for (; x < difat1.length; x++) {
                ds.writeInt32(difat1[x]); //int32 DIFAT[x]
            }
            for (; x < 109; x++) {
                ds.writeInt32(-1); //int32 DIFAT[x]
            }
        }
        // entries
        for (var x = 0; x < this.liteEnts.length; x++) {
            var liteEnt = this.liteEnts[x];
            var pos = 512 * (1 + entriesFirstSector) + 128 * x;
            ds.seek(pos);
            ds.writeUCS2String(liteEnt.entry.name, null, null);
            var numBytesName = ds.position - pos;
            ds.seek(pos + 0x40);
            ds.writeUint16(Math.min(64, numBytesName + 2));
            ds.writeUint8(liteEnt.entry.type);
            ds.writeUint8((x === 0) ? 0 : 1);
            ds.writeInt32(liteEnt.left);
            ds.writeInt32(liteEnt.right);
            ds.writeInt32(liteEnt.child);
            if (x === 0) {
                ds.seek(pos + 0x50);
                ds.writeUint8Array([0x0B, 0x0D, 0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0xC0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x46]);
            }
            var length_1 = (x === 0)
                ? bytesMiniFat
                : liteEnt.entry.length;
            var firstSector = (length_1 !== 0)
                ? liteEnt.firstSector
                : (liteEnt.entry.type === Reader_1.TypeEnum.DIRECTORY ? 0 : -2);
            ds.seek(pos + 0x74);
            ds.writeInt32(firstSector);
            ds.writeInt32(length_1);
        }
        for (var _d = 0, _e = this.liteEnts
            .filter(function (it) { return  true
            && it.entry.type == Reader_1.TypeEnum.DOCUMENT
            && it.isMini === false; }); _d < _e.length; _d++) {
            var liteEnt = _e[_d];
            var bytes = liteEnt.entry.binaryProvider();
            ds.seek(512 * (1 + liteEnt.firstSector));
            ds.writeUint8Array(bytes);
        }
        for (var _f = 0, _g = this.liteEnts
            .filter(function (it) { return  true
            && it.entry.type == Reader_1.TypeEnum.DOCUMENT
            && it.isMini === true; }); _f < _g.length; _f++) {
            var liteEnt = _g[_f];
            var bytes = liteEnt.entry.binaryProvider();
            ds.seek(512 * (1 + firstMiniDataSector) + 64 * liteEnt.firstSector);
            ds.writeUint8Array(bytes);
        }
        // minifat
        ds.seek(512 * (1 + firstMiniFatSector));
        ds.writeInt32Array(this.miniFat.sectors);
        // fat
        this.fat.finalize(512 / 4, -1);
        ds.seek(512 * (1 + firstFatSector));
        ds.writeInt32Array(this.fat.sectors);
        // difat
        if (numDifatSectors >= 1) {
            ds.seek(512 * (1 + firstDifatSector));
            ds.writeInt32Array(difat2);
        }
        this.array = array;
    }
    /**
     * CFBF dedicated name comparer
     *
     * - At first compare UTF-16 length.
     * - Then compare upper cased UTF-16 string.
     */
    LiteBurner.prototype.compareName = function (a, b) {
        var t = a.length - b.length;
        if (t === 0) {
            var x = a.toUpperCase();
            var y = b.toUpperCase();
            if (x > y) {
                t = 1;
            }
            else if (x < y) {
                t = -1;
            }
        }
        return t;
    };
    LiteBurner.prototype.buildTree = function (dirIndex) {
        var _this = this;
        var liteEnts = this.liteEnts;
        var liteEntry = liteEnts[dirIndex];
        if (liteEntry.entry.type === Reader_1.TypeEnum.DOCUMENT) {
            throw new Error("It must be a storage!");
        }
        var children = liteEntry.entry.children.concat();
        if (children.length >= 1) {
            children.sort(function (a, b) {
                return _this.compareName(liteEnts[a].entry.name, liteEnts[b].entry.name);
            });
            liteEntry.child = children[0];
            for (var x = 0; x < children.length - 1; x++) {
                liteEnts[children[x]].right = children[x + 1];
            }
            for (var _i = 0, _a = children
                .filter(function (it) { return liteEnts[it].entry.type === Reader_1.TypeEnum.DIRECTORY; }); _i < _a.length; _i++) {
                var subIndex = _a[_i];
                this.buildTree(subIndex);
            }
        }
    };
    return LiteBurner;
}());
/**
 * Burn CFBF file on the fly.
 *
 * CFBF = Compound File Binary Format
 *
 * @param entries The flattened (not tree) entries starting with `Root Entry`.
 * @returns The binary.
 */
function burn(entries) {
    return new Uint8Array(new LiteBurner(entries).array);
}
exports.burn = burn;


/***/ }),
/* 43 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var DataStream_1 = __importDefault(__webpack_require__(39));
/**
 * @internal
 */
function parse(array) {
    var ds = new DataStream_1.default(array, 0, DataStream_1.default.LITTLE_ENDIAN);
    var ret = [];
    while (!ds.isEof()) {
        var key = ds.readUint32();
        var low = ds.readUint16();
        var hi = ds.readUint16();
        ret.push({
            key: key,
            isStringProperty: (low & 1) != 0,
            guidIndex: (low >> 1) & 32767,
            propertyIndex: hi,
        });
    }
    return ret;
}
exports.parse = parse;


/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
/**
 * @internal
 */
function parse(ds) {
    // 2.2.1.74.1 VoteOption Structure
    // https://docs.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxomsg/87488eff-3eec-4502-bc94-2368c04e3109
    var items = [];
    var count = 0;
    while (!ds.isEof()) {
        var version = ds.readUint16();
        if (version === 258) {
            count = ds.readUint16();
            var dummy1 = ds.readUint16();
            for (var index = 0; index < count; index += 1) {
                var VerbType = ds.readInt32();
                var DisplayNameCount = ds.readUint8();
                var DisplayName = ds.readString(DisplayNameCount);
                var MsgClsNameCount = ds.readUint8();
                var MsgClsName = ds.readString(MsgClsNameCount);
                var Internal1StringCount = ds.readUint8();
                var Internal1String = ds.readString(Internal1StringCount);
                var DisplayNameCountRepeat = ds.readUint8();
                var DisplayNameRepeat = ds.readString(DisplayNameCountRepeat);
                var Internal2 = ds.readInt32();
                var Internal3 = ds.readUint8();
                var fUseUSHeaders = ds.readInt32();
                var Internal4 = ds.readInt32();
                var SendBehavior = ds.readInt32();
                var Internal5 = ds.readInt32();
                var ID = ds.readInt32();
                var Internal6 = ds.readInt32();
                items.push({ VerbType: VerbType, DisplayName: DisplayName });
            }
        }
        else if (version === 260) {
            for (var index = 0; index < count; index += 1) {
                var DisplayNameCount = ds.readUint8();
                var DisplayName = ds.readUCS2String(DisplayNameCount);
                var DisplayNameCountRepeat = ds.readUint8();
                var DisplayNameRepeat = ds.readUCS2String(DisplayNameCountRepeat);
                items[index].DisplayName = DisplayName;
            }
        }
    }
    return items
        .filter(function (it) { return it.VerbType === 4; })
        .map(function (it) { return it.DisplayName; })
        .join(";");
}
exports.parse = parse;


/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(38);
var TZDEFINITION_FLAG_VALID_GUID = 1;
var TZDEFINITION_FLAG_VALID_KEYNAME = 2;
var TZRULE_FLAG_EFFECTIVE_TZREG = 2;
var TZRULE_FLAG_RECUR_CURRENT_TZREG = 1;
/**
 * @internal
 */
function parse(ds) {
    // About persisting TZDEFINITION to a stream to commit to a binary property
    // https://learn.microsoft.com/en-us/office/client-developer/outlook/auxiliary/about-persisting-tzdefinition-to-a-stream-to-commit-to-a-binary-property?redirectedfrom=MSDN
    var tz = { rules: [] };
    if (!ds.isEof()) {
        var bMajorVersion = ds.readUint8();
        if (bMajorVersion !== 2) {
            throw new Error("TZDEFINITION major version not supported");
        }
        var bMinorVersion = ds.readUint8();
        if (bMajorVersion < 1) {
            throw new Error("TZDEFINITION minor version not supported");
        }
        var cbHeader = ds.readUint16();
        var wFlags = ds.readUint16();
        if (wFlags & TZDEFINITION_FLAG_VALID_GUID) {
            ds.readInt32();
            ds.readInt32();
            ds.readInt32();
            ds.readInt32();
        }
        if (wFlags & TZDEFINITION_FLAG_VALID_KEYNAME) {
            var cchKeyName = ds.readUint16();
            tz.keyName = ds.readUCS2String(cchKeyName);
        }
        var cRules = ds.readUint16();
        ds.seek(4 + cbHeader);
        for (var x = 0; x < cRules; x++) {
            var bMajorVersion_1 = ds.readUint8();
            if (bMajorVersion_1 !== 2) {
                break;
            }
            var bMinorVersion_1 = ds.readUint8();
            if (bMajorVersion_1 < 1) {
                break;
            }
            var cbRule = ds.readUint16();
            var basePos = ds.position;
            var wFlags_1 = ds.readUint16();
            var stStart = (0, utils_1.readSystemTime)(ds);
            var lBias = ds.readInt32();
            var lStandardBias = ds.readInt32();
            var lDaylightBias = ds.readInt32();
            var stStandardDate = (0, utils_1.readTransitionSystemTime)(ds);
            var stDaylightDate = (0, utils_1.readTransitionSystemTime)(ds);
            var rule = Object.assign({}, {
                flags: wFlags_1,
                start: (stStart === null || stStart === void 0 ? void 0 : stStart.toUTCString()) || null,
                bias: lBias,
                standardBias: lStandardBias,
                daylightBias: lDaylightBias,
                standardDate: stStandardDate,
                daylightDate: stDaylightDate,
            });
            tz.rules.push(rule);
            ds.seek(basePos + cbRule);
        }
    }
    return tz;
}
exports.parse = parse;


/***/ }),
/* 46 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(38);
/**
 * @internal
 */
function parse(ds) {
    // PidLidTimeZoneStruct Canonical Property
    // https://learn.microsoft.com/en-us/office/client-developer/outlook/mapi/pidlidtimezonestruct-canonical-property
    if (!ds.isEof()) {
        var lBias = ds.readInt32();
        var lStandardBias = ds.readInt32();
        var lDaylightBias = ds.readInt32();
        var wStandardYear = ds.readUint16();
        var stStandardDate = (0, utils_1.readTransitionSystemTime)(ds);
        var wDaylightYear = ds.readUint16();
        var stDaylightDate = (0, utils_1.readTransitionSystemTime)(ds);
        return Object.assign({}, {
            bias: lBias,
            standardBias: lStandardBias,
            daylightBias: lDaylightBias,
            standardYear: wStandardYear,
            standardDate: stStandardDate,
            daylightYear: wDaylightYear,
            daylightDate: stDaylightDate,
        });
    }
    return null;
}
exports.parse = parse;


/***/ }),
/* 47 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = exports.OverrideFlags = exports.EndType = exports.CalendarType = exports.PatternType = exports.RecurFrequency = void 0;
/**
 * RecurFrequency
 *
 * @see [[MS-OXOCAL]: RecurrencePattern Structure | Microsoft Learn](https://learn.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxocal/cf7153b4-f8b5-4cb6-bf14-e78d21f94814)
 */
var RecurFrequency;
(function (RecurFrequency) {
    RecurFrequency[RecurFrequency["Daily"] = 8202] = "Daily";
    RecurFrequency[RecurFrequency["Weekly"] = 8203] = "Weekly";
    RecurFrequency[RecurFrequency["Monthly"] = 8204] = "Monthly";
    RecurFrequency[RecurFrequency["Yearly"] = 8205] = "Yearly";
})(RecurFrequency = exports.RecurFrequency || (exports.RecurFrequency = {}));
/**
 * PatternType
 *
 * @see [[MS-OXOCAL]: RecurrencePattern Structure | Microsoft Learn](https://learn.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxocal/cf7153b4-f8b5-4cb6-bf14-e78d21f94814)
 */
var PatternType;
(function (PatternType) {
    /**
     * The event has a daily recurrence.
     */
    PatternType[PatternType["Day"] = 0] = "Day";
    /**
     * The event has a weekly recurrence.
     */
    PatternType[PatternType["Week"] = 1] = "Week";
    /**
     * The event has a monthly recurrence.
     */
    PatternType[PatternType["Month"] = 2] = "Month";
    /**
     * The event has a month-end recurrence.
     */
    PatternType[PatternType["MonthEnd"] = 4] = "MonthEnd";
    /**
     * The event has an every nth month pattern.
     */
    PatternType[PatternType["MonthNth"] = 3] = "MonthNth";
    /**
     * The event has a monthly recurrence in the Hijri calendar.
     * For this value in the PatternType field, the value of the CalendarType field SHOULD be set to 0x0000.
     */
    PatternType[PatternType["HjMonth"] = 10] = "HjMonth";
    /**
     * The event has an every nth month pattern in the Hijri calendar.
     * For this value in the PatternType field, the value of the CalendarType field MUST be set to 0x0000.
     */
    PatternType[PatternType["HjMonthNth"] = 11] = "HjMonthNth";
    /**
     * The event has a month end recurrence in the Hijri calendar.
     * For this value in the PatternType field, the value of the CalendarType field MUST be set to 0x0000.
     */
    PatternType[PatternType["HjMonthEnd"] = 12] = "HjMonthEnd";
})(PatternType = exports.PatternType || (exports.PatternType = {}));
var CalendarType;
(function (CalendarType) {
    /**
     * The default value for the calendar type is Gregorian.
     */
    CalendarType[CalendarType["Default"] = 0] = "Default";
    /**
     * Gregorian (localized) calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN"] = 1] = "CAL_GREGORIAN";
    /**
     * Gregorian (U.S.) calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN_US"] = 2] = "CAL_GREGORIAN_US";
    /**
     * Japanese Emperor era calendar
     */
    CalendarType[CalendarType["CAL_JAPAN"] = 3] = "CAL_JAPAN";
    /**
     * Taiwan calendar
     */
    CalendarType[CalendarType["CAL_TAIWAN"] = 4] = "CAL_TAIWAN";
    /**
     * Korean Tangun era calendar
     */
    CalendarType[CalendarType["CAL_KOREA"] = 5] = "CAL_KOREA";
    /**
     * Hijri (Arabic Lunar) calendar
     */
    CalendarType[CalendarType["CAL_HIJRI"] = 6] = "CAL_HIJRI";
    /**
     * Thai calendar
     */
    CalendarType[CalendarType["CAL_THAI"] = 7] = "CAL_THAI";
    /**
     * Hebrew lunar calendar
     */
    CalendarType[CalendarType["CAL_HEBREW"] = 8] = "CAL_HEBREW";
    /**
     * Gregorian Middle East French calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN_ME_FRENCH"] = 9] = "CAL_GREGORIAN_ME_FRENCH";
    /**
     * Gregorian Arabic calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN_ARABIC"] = 10] = "CAL_GREGORIAN_ARABIC";
    /**
     * Gregorian transliterated English calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN_XLIT_ENGLISH"] = 11] = "CAL_GREGORIAN_XLIT_ENGLISH";
    /**
     * Gregorian transliterated French calendar
     */
    CalendarType[CalendarType["CAL_GREGORIAN_XLIT_FRENCH"] = 12] = "CAL_GREGORIAN_XLIT_FRENCH";
    /**
     * Japanese lunar calendar
     */
    CalendarType[CalendarType["CAL_LUNAR_JAPANESE"] = 14] = "CAL_LUNAR_JAPANESE";
    /**
     * Chinese lunar calendar
     */
    CalendarType[CalendarType["CAL_CHINESE_LUNAR"] = 15] = "CAL_CHINESE_LUNAR";
    /**
     * Saka era calendar
     */
    CalendarType[CalendarType["CAL_SAKA"] = 16] = "CAL_SAKA";
    /**
     * Lunar ETO Chinese calendar
     */
    CalendarType[CalendarType["CAL_LUNAR_ETO_CHN"] = 17] = "CAL_LUNAR_ETO_CHN";
    /**
     * Lunar ETO Korean calendar
     */
    CalendarType[CalendarType["CAL_LUNAR_ETO_KOR"] = 18] = "CAL_LUNAR_ETO_KOR";
    /**
     * Lunar Rokuyou calendar
     */
    CalendarType[CalendarType["CAL_LUNAR_ROKUYOU"] = 19] = "CAL_LUNAR_ROKUYOU";
    /**
     * Korean lunar calendar
     */
    CalendarType[CalendarType["CAL_LUNAR_KOREAN"] = 20] = "CAL_LUNAR_KOREAN";
    /**
     * Um Al Qura calendar
     */
    CalendarType[CalendarType["CAL_UMALQURA"] = 23] = "CAL_UMALQURA";
})(CalendarType = exports.CalendarType || (exports.CalendarType = {}));
var EndType;
(function (EndType) {
    EndType[EndType["EndAfterDate"] = 8225] = "EndAfterDate";
    EndType[EndType["EndAfterNOccurrences"] = 8226] = "EndAfterNOccurrences";
    EndType[EndType["NeverEnd"] = 8227] = "NeverEnd";
    EndType[EndType["NeverEnd2"] = 4294967295] = "NeverEnd2";
})(EndType = exports.EndType || (exports.EndType = {}));
/**
 * OverrideFlags
 *
 * @see [[MS-OXOCAL]: ExceptionInfo Structure | Microsoft Learn](https://learn.microsoft.com/en-us/openspecs/exchange_server_protocols/ms-oxocal/0980d033-3bf1-43e9-a1e6-af51c564e24a)
 */
var OverrideFlags;
(function (OverrideFlags) {
    /**
     * Indicates that the Subject, SubjectLength, and SubjectLength2 fields are present.
     */
    OverrideFlags[OverrideFlags["ARO_SUBJECT"] = 1] = "ARO_SUBJECT";
    /**
     * Indicates that the MeetingType field is present.
     */
    OverrideFlags[OverrideFlags["ARO_MEETINGTYPE"] = 2] = "ARO_MEETINGTYPE";
    /**
     * Indicates that the ReminderDelta field is present.
     */
    OverrideFlags[OverrideFlags["ARO_REMINDERDELTA"] = 4] = "ARO_REMINDERDELTA";
    /**
     * Indicates that the ReminderSet field is present.
     */
    OverrideFlags[OverrideFlags["ARO_REMINDER"] = 8] = "ARO_REMINDER";
    /**
     * Indicates that the Location, LocationLength, and LocationLength2 fields are present.
     */
    OverrideFlags[OverrideFlags["ARO_LOCATION"] = 16] = "ARO_LOCATION";
    /**
     * Indicates that the BusyStatus field is present.
     */
    OverrideFlags[OverrideFlags["ARO_BUSYSTATUS"] = 32] = "ARO_BUSYSTATUS";
    /**
     * Indicates that the attachment field is present.
     */
    OverrideFlags[OverrideFlags["ARO_ATTACHMENT"] = 64] = "ARO_ATTACHMENT";
    /**
     * Indicates that the SubType field is present.
     */
    OverrideFlags[OverrideFlags["ARO_SUBTYPE"] = 128] = "ARO_SUBTYPE";
    /**
     * Indicates that the AppointmentColor field is present.
     */
    OverrideFlags[OverrideFlags["ARO_APPTCOLOR"] = 256] = "ARO_APPTCOLOR";
    /**
     * Indicates that the Exception Embedded Message object has the PidTagRtfCompressed property
     * ([MS-OXCMSG] section 2.2.1.56.4) set on it.
     */
    OverrideFlags[OverrideFlags["ARO_EXCEPTIONAL_BODY"] = 512] = "ARO_EXCEPTIONAL_BODY";
})(OverrideFlags = exports.OverrideFlags || (exports.OverrideFlags = {}));
;
function parseRecurrencePattern(ds) {
    var ReaderVersion = ds.readUint16();
    if (ReaderVersion !== 0x3004) {
        throw new Error("ReaderVersion not supported");
    }
    var WriterVersion = ds.readUint16();
    if (WriterVersion !== 0x3004) {
        throw new Error("WriterVersion not supported");
    }
    var recurFrequency = ds.readUint16();
    var patternType = ds.readUint16();
    var calendarType = ds.readUint16();
    var firstDateTime = ds.readUint32();
    var period = ds.readUint32();
    var slidingFlag = ds.readUint32();
    var patternTypeWeek = undefined;
    var patternTypeMonth = undefined;
    var patternTypeMonthNth = undefined;
    if (false) {}
    else if ( false
        || patternType === PatternType.Week) {
        patternTypeWeek = {
            dayOfWeekBits: ds.readUint32(),
        };
    }
    else if ( false
        || patternType === PatternType.Month
        || patternType === PatternType.MonthEnd
        || patternType === PatternType.HjMonth
        || patternType === PatternType.HjMonthEnd) {
        patternTypeMonth = {
            day: ds.readUint32(),
        };
    }
    else if ( false
        || patternType === PatternType.MonthNth
        || patternType === PatternType.HjMonthNth) {
        patternTypeMonthNth = {
            dayOfWeekBits: ds.readUint32(),
            n: ds.readUint32(),
        };
    }
    var endType = ds.readUint32();
    var occurrenceCount = ds.readUint32();
    var firstDOW = ds.readUint32();
    var deletedInstanceCount = ds.readUint32();
    var deletedInstanceDates = Array.from(ds.readUint32Array(deletedInstanceCount));
    var modifiedInstanceCount = ds.readUint32();
    var modifiedInstanceDates = Array.from(ds.readUint32Array(modifiedInstanceCount));
    var startDate = ds.readUint32();
    var endDate = ds.readUint32();
    return Object.assign({
        recurFrequency: recurFrequency,
        patternType: patternType,
        calendarType: calendarType,
        firstDateTime: firstDateTime,
        period: period,
        slidingFlag: slidingFlag,
        endType: endType,
        occurrenceCount: occurrenceCount,
        firstDOW: firstDOW,
        deletedInstanceDates: deletedInstanceDates,
        modifiedInstanceDates: modifiedInstanceDates,
        startDate: startDate,
        endDate: endDate,
    }, patternTypeWeek ? { patternTypeWeek: patternTypeWeek } : {}, patternTypeMonth ? { patternTypeMonth: patternTypeMonth } : {}, patternTypeMonthNth ? { patternTypeMonthNth: patternTypeMonthNth } : {});
}
/**
 * @internal
 */
function parse(ds, ansiEncoding) {
    var recurrencePattern = parseRecurrencePattern(ds);
    var readerVersion2 = ds.readUint32();
    if (readerVersion2 !== 0x3006) {
        throw new Error("ReaderVersion2 not supported");
    }
    var writerVersion2 = ds.readUint32();
    if (writerVersion2 < 0x3006) {
        throw new Error("WriterVersion2 not supported");
    }
    var startTimeOffset = ds.readUint32();
    var endTimeOffset = ds.readUint32();
    var exceptionCount = ds.readUint16();
    var exceptionInfo = [];
    for (var x = 0; x < exceptionCount; x++) {
        var startDateTime = ds.readUint32();
        var endDateTime = ds.readUint32();
        var originalStartTime = ds.readUint32();
        var overrideFlags = ds.readUint16();
        var subject = undefined;
        if (overrideFlags & OverrideFlags.ARO_SUBJECT) {
            var subjectLength = ds.readUint16();
            var subjectLength2 = ds.readUint16();
            if (subjectLength - 1 !== subjectLength2) {
                throw new Error("subjectLength ".concat(subjectLength, " and subjectLength2 ").concat(subjectLength2, " are not close!"));
            }
            subject = ds.readString(subjectLength2, ansiEncoding);
        }
        var meetingType = undefined;
        if (overrideFlags & OverrideFlags.ARO_MEETINGTYPE) {
            meetingType = ds.readUint32();
        }
        var reminderDelta = undefined;
        if (overrideFlags & OverrideFlags.ARO_REMINDERDELTA) {
            reminderDelta = ds.readUint32();
        }
        var reminderSet = undefined;
        if (overrideFlags & OverrideFlags.ARO_REMINDER) {
            reminderSet = ds.readUint32();
        }
        var location_1 = undefined;
        if (overrideFlags & OverrideFlags.ARO_LOCATION) {
            var locationLength = ds.readUint16();
            var locationLength2 = ds.readUint16();
            if (locationLength - 1 !== locationLength2) {
                throw new Error("locationLength ".concat(locationLength, " and locationLength2 ").concat(locationLength2, " are not close!"));
            }
            location_1 = ds.readString(locationLength2, ansiEncoding);
        }
        var busyStatus = undefined;
        if (overrideFlags & OverrideFlags.ARO_BUSYSTATUS) {
            busyStatus = ds.readUint32();
        }
        var attachment = undefined;
        if (overrideFlags & OverrideFlags.ARO_ATTACHMENT) {
            attachment = ds.readUint32();
        }
        var subType = undefined;
        if (overrideFlags & OverrideFlags.ARO_SUBTYPE) {
            subType = ds.readUint32();
        }
        var appointmentColor = undefined;
        if (overrideFlags & OverrideFlags.ARO_APPTCOLOR) {
            appointmentColor = ds.readUint32();
        }
        exceptionInfo.push(Object.assign({
            startDateTime: startDateTime,
            endDateTime: endDateTime,
            originalStartTime: originalStartTime,
            overrideFlags: overrideFlags,
        }, subject ? { subject: subject } : {}, meetingType ? { meetingType: meetingType } : {}, reminderDelta ? { reminderDelta: reminderDelta } : {}, reminderSet ? { reminderSet: reminderSet } : {}, location_1 ? { location: location_1 } : {}, busyStatus ? { busyStatus: busyStatus } : {}, attachment ? { attachment: attachment } : {}, subType ? { subType: subType } : {}, appointmentColor ? { appointmentColor: appointmentColor } : {}));
    }
    var reservedBlock1Size = ds.readUint32();
    if (reservedBlock1Size !== 0) {
        throw new Error("reservedBlock1Size ".concat(reservedBlock1Size, " is not zero, AppointmentRecur is broken"));
    }
    for (var x = 0; x < exceptionCount; x++) {
        var one = exceptionInfo[x];
        if (0x00003009 <= writerVersion2) {
            var changeHighlightSize = ds.readUint32();
            one.changeHighlight = ds.readUint32();
            ds.position += changeHighlightSize - 4;
        }
        var reservedBlockEE1Size = ds.readUint32();
        if (reservedBlockEE1Size !== 0) {
            throw new Error("reservedBlockEE1Size ".concat(reservedBlockEE1Size, " is not zero, AppointmentRecur is broken"));
        }
        if (one.overrideFlags & (OverrideFlags.ARO_SUBJECT | OverrideFlags.ARO_LOCATION)) {
            var startDateTime = ds.readUint32();
            var endDateTime = ds.readUint32();
            var originalStartDate = ds.readUint32();
            if (one.overrideFlags & (OverrideFlags.ARO_SUBJECT)) {
                var wideCharSubjectLength = ds.readUint16();
                one.subject = ds.readUCS2String(wideCharSubjectLength);
            }
            if (one.overrideFlags & (OverrideFlags.ARO_LOCATION)) {
                var wideCharLocationLength = ds.readUint16();
                one.location = ds.readUCS2String(wideCharLocationLength);
            }
            var reservedBlockEE2Size = ds.readUint32();
            if (reservedBlockEE2Size !== 0) {
                throw new Error("reservedBlockEE2Size ".concat(reservedBlockEE2Size, " is not zero, AppointmentRecur is broken"));
            }
        }
    }
    var reservedBlock2Size = ds.readUint32();
    if (reservedBlock2Size !== 0) {
        throw new Error("reservedBlock2Size ".concat(reservedBlock2Size, " is not zero, AppointmentRecur is broken"));
    }
    return {
        recurrencePattern: recurrencePattern,
        startTimeOffset: startTimeOffset,
        endTimeOffset: endTimeOffset,
        exceptionInfo: exceptionInfo,
    };
}
exports.parse = parse;


/***/ }),
/* 48 */
/***/ ((module) => {

module.exports = require("@kenjiuno/decompressrtf");

/***/ }),
/* 49 */
/***/ ((module) => {

module.exports = require("rtf-stream-parser");

/***/ }),
/* 50 */
/***/ ((module) => {

module.exports = require("cheerio");

/***/ }),
/* 51 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const common_2 = __webpack_require__(29);
const email_service_1 = __webpack_require__(35);
let EmailController = class EmailController {
    constructor(emailService) {
        this.emailService = emailService;
    }
    async getemailparse(query) {
        return await this.emailService.getemailparse(query);
    }
    async getattechment(query, res) {
        return await this.emailService.downloadAttachment(query, res);
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Get)('getemailparse'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof common_2.EmailparseReq !== "undefined" && common_2.EmailparseReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], EmailController.prototype, "getemailparse", null);
__decorate([
    (0, common_1.Get)('getattechment'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof common_2.EmailAttachment !== "undefined" && common_2.EmailAttachment) === "function" ? _d : Object, typeof (_e = typeof Response !== "undefined" && Response) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], EmailController.prototype, "getattechment", null);
exports.EmailController = EmailController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('email'),
    (0, common_1.Controller)('email'),
    __metadata("design:paramtypes", [typeof (_a = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _a : Object])
], EmailController);


/***/ }),
/* 53 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadfileController = void 0;
const common_1 = __webpack_require__(3);
const download_interface_1 = __webpack_require__(54);
const downloadfile_service_1 = __webpack_require__(55);
const swagger_1 = __webpack_require__(27);
const log_interceptor_1 = __webpack_require__(72);
const apiid_1 = __webpack_require__(74);
const present_report_service_1 = __webpack_require__(75);
let DownloadfileController = class DownloadfileController {
    constructor(downloadfileService, prService) {
        this.downloadfileService = downloadfileService;
        this.prService = prService;
    }
    async startExportfile(query, res) {
        return await this.downloadfileService.downloadfiles(query, res);
    }
    async downloadfile(query, res) {
        let detail = { cPath: query.cPath, cFilename: query.cFilename };
        return await this.downloadfileService.downloadSingleFileFromS3(detail, res);
    }
    async startHyperLinkfile(query, res) {
        return await this.downloadfileService.downloadfilesWithHyperLink(query, res);
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
    async startPresentfile(query, res) {
        return await this.prService.downloadPresentfiles(query, res);
    }
    async checkForDownload(query) {
        return await this.downloadfileService.getApproximateSize(query);
    }
};
exports.DownloadfileController = DownloadfileController;
__decorate([
    (0, common_1.Get)('downloadfile'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(27),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof download_interface_1.DownloadProcess !== "undefined" && download_interface_1.DownloadProcess) === "function" ? _c : Object, typeof (_d = typeof Response !== "undefined" && Response) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], DownloadfileController.prototype, "startExportfile", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(27),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof download_interface_1.DownloadFile !== "undefined" && download_interface_1.DownloadFile) === "function" ? _f : Object, typeof (_g = typeof Response !== "undefined" && Response) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], DownloadfileController.prototype, "downloadfile", null);
__decorate([
    (0, common_1.Get)('hyperlink/downloadfile'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(27),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof download_interface_1.DownloadProcess !== "undefined" && download_interface_1.DownloadProcess) === "function" ? _j : Object, typeof (_k = typeof Response !== "undefined" && Response) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], DownloadfileController.prototype, "startHyperLinkfile", null);
__decorate([
    (0, common_1.Get)('downloadPresentReport'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(27),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof download_interface_1.PresentReportReq !== "undefined" && download_interface_1.PresentReportReq) === "function" ? _m : Object, typeof (_o = typeof Response !== "undefined" && Response) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], DownloadfileController.prototype, "startPresentfile", null);
__decorate([
    (0, common_1.Get)('approximate/size'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof download_interface_1.DownloadProcess !== "undefined" && download_interface_1.DownloadProcess) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], DownloadfileController.prototype, "checkForDownload", null);
exports.DownloadfileController = DownloadfileController = __decorate([
    (0, swagger_1.ApiTags)('download'),
    (0, common_1.Controller)('download'),
    __metadata("design:paramtypes", [typeof (_a = typeof downloadfile_service_1.DownloadfileService !== "undefined" && downloadfile_service_1.DownloadfileService) === "function" ? _a : Object, typeof (_b = typeof present_report_service_1.PresentReportService !== "undefined" && present_report_service_1.PresentReportService) === "function" ? _b : Object])
], DownloadfileController);


/***/ }),
/* 54 */
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
exports.PresentReportParams = exports.PresentReportReq = exports.DownloadFile = exports.DownloadProcess = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
const swagger_1 = __webpack_require__(27);
const class_transformer_1 = __webpack_require__(31);
const class_validator_1 = __webpack_require__(32);
class DownloadProcess {
}
exports.DownloadProcess = DownloadProcess;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Section id' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Download Taskid id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "nDTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'Folder ids', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File ids', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Is Hyperlink', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (value === 'true' || value === true)
            return true;
        if (value === 'false' || value === false)
            return false;
        return undefined;
    }),
    __metadata("design:type", Boolean)
], DownloadProcess.prototype, "bIshyperlink", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DownloadProcess.prototype, "nMasterid", void 0);
class DownloadFile {
}
exports.DownloadFile = DownloadFile;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cFilename id' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DownloadFile.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cPath id' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DownloadFile.prototype, "cPath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DownloadFile.prototype, "nMasterid", void 0);
class PresentReportReq {
}
exports.PresentReportReq = PresentReportReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File ids', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresentReportReq.prototype, "params", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PresentReportReq.prototype, "nMasterid", void 0);
class PresentReportParams {
}
exports.PresentReportParams = PresentReportParams;


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadfileService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const log_service_1 = __webpack_require__(56);
const path = __webpack_require__(60);
const archiver = __webpack_require__(62);
const async = __webpack_require__(63);
const fs = __webpack_require__(59);
const client_s3_1 = __webpack_require__(51);
const node_http_handler_1 = __webpack_require__(64);
const stream_1 = __webpack_require__(65);
const https_1 = __webpack_require__(66);
const axios_1 = __webpack_require__(67);
const bull_1 = __webpack_require__(68);
const bull_2 = __webpack_require__(69);
const crypto = __webpack_require__(70);
let DownloadfileService = class DownloadfileService {
    constructor(db, config, logService, downloadQueue, indexGenerationQueue) {
        this.db = db;
        this.config = config;
        this.logService = logService;
        this.downloadQueue = downloadQueue;
        this.indexGenerationQueue = indexGenerationQueue;
        this.filePath = this.config.get('ASSETS');
        this.logApp = 'download';
        this.logger = new common_1.Logger('download');
        this.pythonApiUrl = 'http://localhost:5020/download';
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
    async downloadfiles(query, res) {
        try {
            console.log('Download request:', query);
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`;
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_getdata', query);
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${data}`, logApp);
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }
            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length);
            if (detail.length > 0) {
                if (detail.length === 1 && detail[0].cFilename) {
                    this.logService.info(`Download single file from S3 ${JSON.stringify(detail[0])}`, logApp);
                    return this.downloadSingleFileFromS3(detail[0], res, logApp);
                }
                else {
                    console.log('Step 1');
                    this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                    return this.externalfiles(detail, res, logApp, query);
                }
            }
            else {
                console.log('GET RES FAILED');
                this.logService.error(`No data found for download`, logApp);
                return { msg: -1, value: 'No data found for download' };
            }
        }
        catch (error) {
            console.error('Download error:', error.message);
            this.logService.error(`Error while Downloading,${error.message}`, this.logApp);
            res.status(500).json({ msg: -1, value: 'Failed to fetch', error: error.message });
        }
    }
    async downloadSingleFileFromS3(fileDetail, res, logApp) {
        if (!logApp) {
            logApp = this.logApp;
        }
        const params = {
            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
            Key: fileDetail.cPath
        };
        try {
            this.logService.info(`Download Streaming start ${fileDetail.cPath}`, logApp);
            const command = new client_s3_1.GetObjectCommand(params);
            const { Body } = await this.s3Client.send(command);
            if (Body instanceof stream_1.Readable) {
                const sanitizedFilename = fileDetail.cFilename.replace(/[^\w\-.\p{L}\p{N}]/gu, '_');
                const fileExtension = fileDetail.cPath.split('.').pop();
                const hasExtension = sanitizedFilename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`);
                const fullFilename = hasExtension ? sanitizedFilename : `${sanitizedFilename}.${fileExtension}`;
                this.logService.info(`Streaming file: ${fullFilename}`, logApp);
                res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
                res.setHeader('Content-Type', 'application/octet-stream');
                Body.pipe(res);
            }
            else {
                throw new Error('File stream is not readable');
            }
        }
        catch (error) {
            console.error('Error downloading file from S3:', error.message);
            this.logService.error(`Error downloading file from S3: ${error.message}`, logApp);
            res.status(500).json({
                msg: -1,
                value: 'Failed to download file from S3',
                error: error.message
            });
        }
    }
    async externalfiles(detail, res, logApp, query) {
        this.createZip(detail, res, logApp, query);
    }
    async downloadFileWithAxios(url, destPath, logger, retryCount = 3) {
        for (let attempt = 1; attempt <= retryCount; attempt++) {
            try {
                fs.mkdirSync(path.dirname(destPath), { recursive: true });
                const response = await axios_1.default.get(url, {
                    responseType: 'stream',
                    timeout: 60000,
                });
                await new Promise((resolve, reject) => {
                    const writer = fs.createWriteStream(destPath);
                    response.data.pipe(writer);
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });
                return;
            }
            catch (err) {
                logger?.warn?.(`Download attempt ${attempt} failed: ${err.message}`);
                if (attempt === retryCount)
                    throw err;
            }
        }
    }
    async createZip(detail, res, logApp, query) {
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }
        let indexpath = '';
        let indexFileGenerating = false;
        let indexFileGenerated = false;
        let indexFilePromise = null;
        try {
            const fids = (query.jFiles).replace('{', '').replace('}', '');
            const folderids = (query.jFolders).replace('{', '').replace('}', '');
            if ((query.nDTaskid || query.nDTaskid == 0) && (query.jFiles.replace(/[{}]/g, '').length && !query.jFolders.replace(/[{}]/g, '').length)) {
                const indexfileapth = path.join(sessionFolder, 'index.pdf');
                indexFileGenerating = true;
                this.logService.log(`INDEX GENERATION QUEUED folders ${query.jFiles.replace(/[{}]/g, '')} - files ${query.jFolders.replace(/[{}]/g, '')} `, logApp);
                const jobId = `index_${crypto.randomBytes(6).toString('hex')}`;
                const job = await this.indexGenerationQueue.add('generate', {
                    query,
                    outputPath: indexfileapth,
                    logApp,
                    jobId
                }, {
                    jobId,
                    removeOnComplete: true,
                    removeOnFail: true,
                    timeout: 60000 * 5
                });
                indexFilePromise = job.finished()
                    .then((result) => {
                    if (result && result.success) {
                        indexpath = indexfileapth;
                        indexFileGenerated = true;
                        indexFileGenerating = false;
                        this.logService.log(`INDEX GENERATION COMPLETED`, logApp);
                        return true;
                    }
                    return false;
                })
                    .catch((error) => {
                    indexFileGenerating = false;
                    indexFileGenerated = false;
                    this.logService.error(`INDEX GENERATING FAILED - ${error}`, logApp);
                    return false;
                });
            }
        }
        catch (error) {
            indexFileGenerating = false;
            this.logService.error(`Error queuing index file generation: ${error?.message}`, logApp);
        }
        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        let isCancelled = false;
        const controller = new AbortController();
        const sessionId = `session_${crypto.randomBytes(6).toString('hex')}`;
        const activeReadStreams = new Set();
        const activeWriteStreams = new Set();
        const streamQueue = async.queue(async (job, done) => {
            const { nBundledetailid } = job;
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }
                this.logService.log(`STREAM START: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                console.log('STREAMING FILE');
                const { tempFilePath, originalFileName, folderPath } = job;
                const fileStream = fs.createReadStream(tempFilePath);
                activeReadStreams.add(fileStream);
                fileStream.on('end', async () => {
                    this.logger.warn(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`);
                    this.logService.log(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                    try {
                        activeReadStreams.delete(fileStream);
                    }
                    catch (error) {
                    }
                    try {
                        if (nBundledetailid) {
                            const obj = detail.find(a => a.nBundledetailid == nBundledetailid);
                            if (obj) {
                                obj.isStreamed = true;
                            }
                        }
                        const remainingFiles = detail.filter(a => !a.isStreamed).length;
                        this.logService.log(`REMAIN: ${remainingFiles}`, logApp);
                        console.log('REMAIN', remainingFiles);
                        if (remainingFiles === 0) {
                            if (indexFileGenerating && indexFilePromise) {
                                this.logService.log(`WAITING FOR INDEX FILE TO COMPLETE`, logApp);
                                console.log('WAITING FOR INDEX FILE TO COMPLETE');
                                const timeoutPromise = new Promise((resolve) => {
                                    setTimeout(() => resolve(false), 60000);
                                });
                                const indexResult = await Promise.race([indexFilePromise, timeoutPromise]);
                                if (indexResult === false && indexFileGenerating) {
                                    this.logService.log(`INDEX GENERATION TIMED OUT, PROCEEDING WITHOUT INDEX`, logApp);
                                    console.log('INDEX GENERATION TIMED OUT, PROCEEDING WITHOUT INDEX');
                                    try {
                                        archive.finalize();
                                    }
                                    catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                }
                                else if (indexFileGenerated && indexpath) {
                                    this.logService.log(`INDEX FILE COMPLETED, NOW STREAMING`, logApp);
                                    console.log('INDEX FILE COMPLETED, NOW STREAMING');
                                    const indexFileStream = fs.createReadStream(indexpath);
                                    archive.append(indexFileStream, { name: 'Index.pdf' });
                                    indexFileStream.on('end', () => {
                                        this.logService.log(`INDEX FILE STREAMED`, logApp);
                                        console.log('INDEX FILE STREAMED');
                                        try {
                                            archive.finalize();
                                        }
                                        catch (error) {
                                            this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                        }
                                    });
                                    indexFileStream.on('error', (error) => {
                                        this.logService.error(`INDEX FILE STREAM FAILED: ${error?.message}`, logApp);
                                        try {
                                            archive.finalize();
                                        }
                                        catch (finalizationError) {
                                            this.logService.error(`Error finalizing archive: ${finalizationError?.message}`, logApp);
                                        }
                                    });
                                }
                                else {
                                    console.log('FINALIZING WITHOUT INDEX');
                                    this.logService.log(`FINALIZING WITHOUT INDEX`, logApp);
                                    try {
                                        archive.finalize();
                                    }
                                    catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                }
                            }
                            else if (indexFileGenerated && indexpath) {
                                this.logService.log(`STREAMING INDEX FILE`, logApp);
                                console.log('STREAMING INDEX FILE');
                                const indexFileStream = fs.createReadStream(indexpath);
                                archive.append(indexFileStream, { name: 'Index.pdf' });
                                indexFileStream.on('end', () => {
                                    this.logService.log(`INDEX FILE STREAMED`, logApp);
                                    console.log('INDEX FILE STREAMED');
                                    try {
                                        archive.finalize();
                                    }
                                    catch (error) {
                                        this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                    }
                                });
                                indexFileStream.on('error', (error) => {
                                    this.logService.error(`INDEX FILE STREAM FAILED: ${error?.message}`, logApp);
                                    try {
                                        archive.finalize();
                                    }
                                    catch (finalizationError) {
                                        this.logService.error(`Error finalizing archive: ${finalizationError?.message}`, logApp);
                                    }
                                });
                            }
                            else {
                                console.log('ALL FILES STREAMED WITHOUT INDEX');
                                this.logService.log(`ALL FILES STREAMED WITHOUT INDEX`, logApp);
                                try {
                                    archive.finalize();
                                }
                                catch (error) {
                                    this.logService.error(`Error finalizing archive: ${error?.message}`, logApp);
                                }
                            }
                            archive.on('end', () => {
                                fs.rm(sessionFolder, { recursive: true }, (err) => {
                                    if (err) {
                                        console.error(`Error removing session folder: ${sessionFolder}`);
                                    }
                                    else {
                                        console.log(`Session folder removed: ${sessionFolder}`);
                                    }
                                });
                            });
                        }
                    }
                    catch (error) {
                        this.logService.error(`STREAM END FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                        console.error(error);
                    }
                    await this.downloadQueue.add('FILEDELETE', { tempFilePath, nBundledetailid, logApp });
                });
                fileStream.on('error', (error) => {
                    try {
                        activeReadStreams.delete(fileStream);
                    }
                    catch (error) {
                    }
                    this.logger.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`);
                    this.logService.error(`STREAM FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                });
                archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });
            }
            catch (error) {
                this.logService.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`, logApp);
            }
        }, 5);
        streamQueue.drain(() => {
        });
        const downloadQueue = async.queue(async (job, done) => {
            try {
                if (isCancelled) {
                    this.logger.warn(`Skipping stream processing due to cancellation`);
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }
                console.log(`DOWNLOAD START:`);
                const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid } = job;
                try {
                    this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp);
                    const { Body } = await this.s3Client.send(new client_s3_1.GetObjectCommand(s3Params), { abortSignal: controller.signal });
                    if (Body instanceof stream_1.Readable) {
                        const writeStream = fs.createWriteStream(tempFilePath);
                        activeWriteStreams.add(writeStream);
                        writeStream.once('finish', () => activeWriteStreams.delete(writeStream));
                        writeStream.once('error', () => activeWriteStreams.delete(writeStream));
                        await new Promise((resolve, reject) => {
                            Body.pipe(writeStream)
                                .once('finish', resolve)
                                .once('error', reject);
                        });
                        console.log(`File downloaded: ${tempFilePath}`);
                        this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp);
                        this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid} `, logApp);
                        streamQueue.push(job);
                    }
                }
                catch (error) {
                    this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp);
                    console.error(`Error downloading file ${originalFileName}: ${error.message}`);
                    fs.writeFileSync(tempFilePath, Buffer.alloc(0));
                    streamQueue.push(job);
                }
            }
            catch (error) {
                this.logService.error(`Error downloading file  ${job?.nBundledetailid}  ${job?.originalFileName}: ${error.message}`, logApp);
                console.log(error);
            }
        }, 5);
        res.on('close', () => {
            try {
                this.logger.warn('Client disconnected');
                isCancelled = true;
                if (indexFileGenerating && query.nDTaskid) {
                    this.indexGenerationQueue.getJob(`index_${query.nDTaskid}`)
                        .then(job => job?.remove())
                        .catch(err => this.logger.error(`Error removing index job: ${err.message}`));
                }
                this.logger.warn('Removing all listeners');
                try {
                    archive.removeAllListeners();
                }
                catch (error) {
                    this.logger.error(`Error removing archive listeners: ${error.message}`);
                }
                try {
                    res.removeAllListeners();
                }
                catch (error) {
                    this.logger.error(`Error removing response listeners: ${error.message}`);
                }
                try {
                    this.logger.warn('aborting axios request from controller');
                    controller.abort();
                }
                catch (error) {
                }
                this.logger.warn('Aborting archive');
                archive.abort();
                try {
                    this.logger.warn('Destroying all active write streams');
                    for (const ws of activeWriteStreams) {
                        ws.destroy();
                    }
                    activeWriteStreams.clear();
                }
                catch (error) {
                    this.logger.error(`Error destroying write streams: ${error.message}`);
                }
                try {
                    this.logger.warn('Destroying all active read streams');
                    for (const rs of activeReadStreams) {
                        rs.destroy();
                    }
                    activeReadStreams.clear();
                }
                catch (error) {
                    this.logger.error(`Error destroying read streams: ${error.message}`);
                }
                try {
                    downloadQueue.kill();
                }
                catch (error) {
                    this.logger.error(`Error killing download queue: ${error.message}`);
                }
                try {
                    streamQueue.kill();
                }
                catch (error) {
                    this.logger.error(`Error killing stream queue: ${error.message}`);
                }
                fs.rm(sessionFolder, { recursive: true }, (err) => {
                    if (err)
                        console.error(`Error removing session folder: ${sessionFolder}`);
                    else
                        console.log(`Session folder removed: ${sessionFolder}`);
                });
            }
            catch (error) {
                this.logger.error(`Error during client disconnection: ${error.message}`);
            }
        });
        archive.pipe(res);
        this.logService.info(`\n\r\n\rSTARTED: ${sessionId} `, logApp);
        this.logService.info(`\n\r\n\r TOTOAL FILES: ${detail.length} `, logApp);
        for (const files of detail) {
            const fileName = files.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, files.nBundledetailid + '-' + fileName);
            const folderPath = files.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: files.cPath,
            };
            files.isStreamed = false;
            this.logService.info(`PUSH TO QUEUE: ${sessionFolder} ${zipFilename}, ${files.nBundledetailid}`, logApp);
            downloadQueue.push({ sessionId, tempFilePath, fileName, originalFileName, sessionFolder, folderPath, s3Params, nBundledetailid: files.nBundledetailid, logApp });
        }
    }
    async externalfiles_V2(detail, res) {
        const retryLimit = 3;
        const zipFilename = (detail[0]["filename"] ? detail[0]["filename"] : new Date().toISOString()) + '.zip';
        const zipFilePath = path.join(__dirname, zipFilename);
        this.logService.info(`Download Zip ${zipFilename}`, this.logApp);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        try {
            for (const file of detail) {
                const folderPath = file.foldername || '/';
                const fileName = file.cFilename;
                const archivePath = path.join(folderPath, fileName).replace(/\\/g, '/');
                const s3Params = {
                    Bucket: process.env.DO_SPACES_BUCKET_NAME,
                    Key: file.cPath,
                };
                console.log(`Start processing file: ${fileName}`);
                for (let attempt = 1; attempt <= retryLimit; attempt++) {
                    try {
                        const headCommand = new client_s3_1.HeadObjectCommand(s3Params);
                        const { ContentLength } = await this.s3Client.send(headCommand);
                        console.log(`File size: ${ContentLength} bytes for ${fileName}`);
                        const getCommand = new client_s3_1.GetObjectCommand(s3Params);
                        const { Body } = await this.s3Client.send(getCommand);
                        if (Body) {
                            const stream = Body;
                            stream.on('error', (err) => {
                                console.error(`Stream error: ${err.message}`);
                            });
                            archive.append(stream, { name: archivePath });
                            console.log(`Added file to archive: ${fileName}`);
                            break;
                        }
                        else {
                            console.warn(`Empty body for file: ${fileName}`);
                        }
                    }
                    catch (error) {
                        if (attempt < retryLimit) {
                            const backoff = Math.pow(2, attempt) * 1000;
                            console.warn(`Retrying file: ${fileName} (Attempt ${attempt}) after ${backoff / 1000} seconds...`);
                            await new Promise((resolve) => setTimeout(resolve, backoff));
                            continue;
                        }
                        console.error(`Failed to process file: ${fileName} - ${error.message}`);
                    }
                }
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
            await archive.finalize();
        }
        catch (err) {
            console.error('Error creating ZIP archive:', err.message);
            res.status(500).send('Error creating ZIP file');
        }
    }
    async externalfiles_python(detail, res, logApp) {
        try {
            const fetch = (await Promise.resolve().then(() => __webpack_require__(71))).default;
            const response = await fetch(this.pythonApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: detail }),
            });
            if (!response.ok) {
                throw new Error(`Python API returned status: ${response.status}`);
            }
            const nodeStream = stream_1.Readable.from(response.body);
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=files.zip');
            nodeStream.pipe(res);
        }
        catch (error) {
            console.error('Error calling Python API:', error.message);
            res.status(500).send('Error creating ZIP file');
        }
    }
    async externalfiles_v1(detail, res) {
        const folders = [];
        const zipFilename = (detail[0]["filename"] ? detail[0]["filename"] : new Date().toISOString()) + '.zip';
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        const retryLimit = 3;
        try {
            for (const file of detail) {
                const folderPath = file.foldername || '/';
                const fileName = file.cFilename;
                const archivePath = path.join(folderPath, fileName).replace(/\\/g, '/');
                const s3Params = {
                    Bucket: process.env.DO_SPACES_BUCKET_NAME,
                    Key: file.cPath,
                };
                const fileURL = new URL(`https://etabella.sgp1.digitaloceanspaces.com/${file.cPath}`);
                console.log(`Start processing file: ${fileName}`);
                console.log(`S3 URL: ${fileURL.toString()}`);
                const startTime = new Date();
                for (let attempt = 1; attempt <= retryLimit; attempt++) {
                    try {
                        const headCommand = new client_s3_1.HeadObjectCommand(s3Params);
                        await this.s3Client.send(headCommand);
                        const getCommand = new client_s3_1.GetObjectCommand(s3Params);
                        const { Body } = await this.s3Client.send(getCommand);
                        if (Body) {
                            const stream = Body;
                            stream.on('error', (err) => {
                                console.error(`Stream error for file: ${fileName} - (URL: ${fileURL}): ${file.cPath} - ${err.message}`, err);
                                archive.emit('warning', err);
                            });
                            archive.append(stream, { name: archivePath });
                            await new Promise((resolve) => setTimeout(resolve, 500));
                        }
                        else {
                            console.warn(`Empty body for file: ${fileName} (URL: ${fileURL}): ${file.cPath}`);
                        }
                        break;
                    }
                    catch (error) {
                        if (error.code === 'ECONNRESET' && attempt < retryLimit) {
                            console.warn(`Retrying file: ${fileName} (URL: ${fileURL}): (Attempt ${attempt})`);
                            continue;
                        }
                        console.error(`Error processing file ${fileName} (URL: ${fileURL}): ${error.message}`);
                        break;
                    }
                }
                const endTime = new Date();
                console.log(`File: ${fileName} - Start Time: ${startTime.toISOString()}, End Time: ${endTime.toISOString()}`);
            }
            archive.finalize();
        }
        catch (err) {
            console.error('Error creating ZIP archive:', err.message);
            res.status(500).send('Error creating ZIP file');
        }
    }
    async pushToQueue(detail, sessionFolder) {
        for (const files of detail) {
            const fileName = files.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, fileName);
            const folderPath = files.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: files.cPath,
            };
        }
    }
    async downloadfilesWithHyperLink(query, res) {
        try {
            console.log('Download request:', query);
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`;
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_with_linkfiles', query);
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${data}`, logApp);
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }
            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length);
            if (detail.length > 0) {
                if (detail.length === 1 && detail[0].cFilename) {
                    this.logService.info(`Download single file from S3 ${JSON.stringify(detail[0])}`, logApp);
                    return this.downloadSingleFileFromS3(detail[0], res, logApp);
                }
                else {
                    console.log('Step 1');
                    this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                    return this.externalfiles(detail, res, logApp);
                }
            }
            else {
                console.log('GET RES FAILED');
                this.logService.error(`No data found for download`, logApp);
                return { msg: -1, value: 'No data found for download' };
            }
        }
        catch (error) {
            console.error('Download error:', error.message);
            this.logService.error(`Error while Downloading,${error.message}`, this.logApp);
            res.status(500).json({ msg: -1, value: 'Failed to fetch', error: error.message });
        }
    }
    async getApproximateSize(query) {
        const res = await this.db.executeRef('get_approximate_size', query, 'download');
        if (!res.success || !res.data || res.data.length === 0) {
            return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
        }
        return { msg: 1, size: res.data[0][0]["cFinalSize"], isValidForStream: res.data[0][0]["isValidForStream"] };
    }
};
exports.DownloadfileService = DownloadfileService;
exports.DownloadfileService = DownloadfileService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_2.InjectQueue)('download-queue')),
    __param(4, (0, bull_2.InjectQueue)('index-generation')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object])
], DownloadfileService);


/***/ }),
/* 56 */
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
const winston_1 = __webpack_require__(57);
const nest_winston_1 = __webpack_require__(58);
const winston = __webpack_require__(57);
const fs = __webpack_require__(59);
const path = __webpack_require__(60);
const moment = __webpack_require__(61);
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
/* 57 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 58 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 59 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 60 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 61 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("archiver");

/***/ }),
/* 63 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 64 */
/***/ ((module) => {

module.exports = require("@aws-sdk/node-http-handler");

/***/ }),
/* 65 */
/***/ ((module) => {

module.exports = require("stream");

/***/ }),
/* 66 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 67 */
/***/ ((module) => {

module.exports = require("axios");

/***/ }),
/* 68 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 69 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

/***/ }),
/* 70 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 71 */
/***/ ((module) => {

module.exports = require("node-fetch");

/***/ }),
/* 72 */
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
const operators_1 = __webpack_require__(73);
const event_log_service_1 = __webpack_require__(24);
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
/* 73 */
/***/ ((module) => {

module.exports = require("rxjs/operators");

/***/ }),
/* 74 */
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
/* 75 */
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
exports.PresentReportService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const log_service_1 = __webpack_require__(56);
const console_1 = __webpack_require__(76);
const path = __webpack_require__(60);
const archiver = __webpack_require__(62);
const async = __webpack_require__(63);
const fs = __webpack_require__(59);
const client_s3_1 = __webpack_require__(51);
const node_http_handler_1 = __webpack_require__(64);
const stream_1 = __webpack_require__(65);
const https_1 = __webpack_require__(66);
const bull_1 = __webpack_require__(68);
const bull_2 = __webpack_require__(69);
const present_index_service_1 = __webpack_require__(77);
const crypto = __webpack_require__(70);
let PresentReportService = class PresentReportService {
    constructor(db, config, logService, PIService, downloadQueue) {
        this.db = db;
        this.config = config;
        this.logService = logService;
        this.PIService = PIService;
        this.downloadQueue = downloadQueue;
        this.filePath = this.config.get('ASSETS');
        this.logApp = 'download';
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
    async downloadPresentfiles(params, res) {
        try {
            console.log('Download Present Report', params);
            if (!params || !params.params) {
                console.log('Invalid parameters:', params);
                return { msg: -1, value: 'Invalid parameters', error: 'Invalid parameters' };
            }
            let query = JSON.parse(atob(params.params));
            query["nMasterid"] = params.nMasterid;
            let logApp = `${this.logApp}/${query.nMasterid}/${query.nCaseid}_${new Date().getTime()}`;
            this.logService.info(`Download Request ${JSON.stringify(query)} by user ${query.nMasterid}`, logApp);
            this.logService.info(`Request for get Data by user ${query.nMasterid}`, logApp);
            const data = await this.db.executeRef('download_presentreport', query, 'present');
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.info(`Error while get Data ${console_1.error}`, logApp);
                return { msg: -1, value: 'No data found for download.', error: 'No data found for download.' };
            }
            this.logService.info(`GetData reponce success`, logApp);
            let detail = data.data[0];
            console.log('Step 1.1', detail.length);
            if (detail.length > 0) {
                this.logService.info(`Downloading prepare for multiple files from S3 ${JSON.stringify(detail)}`, logApp);
                this.createZip(detail, res, logApp, query);
            }
            else {
                console.log('GET RES FAILED');
                this.logService.error(`No data found for download`, logApp);
                return { msg: -1, value: 'No data found for download' };
            }
        }
        catch (error) {
            console.error('Download error:', error.message);
            this.logService.error(`Error while Downloading,${error.message}`, this.logApp);
            res.status(500).json({ msg: -1, value: 'Failed to fetch', error: error.message });
        }
    }
    async downloadSingleFileFromS3(fileDetail, res, logApp) {
        if (!logApp) {
            logApp = this.logApp;
        }
        const params = {
            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
            Key: fileDetail.cPath
        };
        try {
            this.logService.info(`Download Streaming start ${fileDetail.cPath}`, logApp);
            const command = new client_s3_1.GetObjectCommand(params);
            const { Body } = await this.s3Client.send(command);
            if (Body instanceof stream_1.Readable) {
                const sanitizedFilename = fileDetail.cFilename.replace(/[^\w\-.\p{L}\p{N}]/gu, '_');
                const fileExtension = fileDetail.cPath.split('.').pop();
                const hasExtension = sanitizedFilename.toLowerCase().endsWith(`.${fileExtension.toLowerCase()}`);
                const fullFilename = hasExtension ? sanitizedFilename : `${sanitizedFilename}.${fileExtension}`;
                this.logService.info(`Streaming file: ${fullFilename}`, logApp);
                res.setHeader('Content-Disposition', `attachment; filename="${fullFilename}"`);
                res.setHeader('Content-Type', 'application/octet-stream');
                Body.pipe(res);
            }
            else {
                throw new Error('File stream is not readable');
            }
        }
        catch (error) {
            console.error('Error downloading file from S3:', error.message);
            this.logService.error(`Error downloading file from S3: ${error.message}`, logApp);
            res.status(500).json({
                msg: -1,
                value: 'Failed to download file from S3',
                error: error.message
            });
        }
    }
    async createZip(detail, res, logApp, query) {
        const folders = [];
        const assetsFolder = path.join(__dirname, 'assets');
        const sessionFolder = path.join(assetsFolder, `session_${crypto.randomBytes(6).toString('hex')}`);
        if (!fs.existsSync(sessionFolder)) {
            fs.mkdirSync(sessionFolder, { recursive: true });
        }
        let indexpath = '';
        try {
            const indexfileapth = path.join(sessionFolder, 'index.pdf');
            const result = await this.PIService.createIndexFile(query, indexfileapth, logApp);
            if (result) {
                indexpath = indexfileapth;
            }
        }
        catch (error) {
        }
        const zipFilename = (detail[0]?.filename || new Date().toISOString()) + '.zip';
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        let isCancelled = false;
        res.on('close', () => {
            try {
                console.log('Client disconnected');
                isCancelled = true;
                downloadQueue.kill();
                streamQueue.kill();
                archive.abort();
                fs.rm(sessionFolder, { recursive: true }, (err) => {
                    if (err)
                        console.error(`Error removing session folder: ${sessionFolder}`);
                    else
                        console.log(`Session folder removed: ${sessionFolder}`);
                });
            }
            catch (error) {
            }
        });
        const sessionId = `session_${crypto.randomBytes(6).toString('hex')}`;
        const streamQueue = async.queue(async (job, done) => {
            const { nBundledetailid } = job;
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }
                this.logService.log(`STREAM START: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                console.log('STREAMING FILE');
                const { tempFilePath, originalFileName, folderPath } = job;
                const fileStream = fs.createReadStream(tempFilePath);
                archive.append(fileStream, { name: path.join(folderPath, originalFileName).replace(/\\/g, '/') });
                fileStream.on('end', async () => {
                    this.logService.log(`STREAM END: ${nBundledetailid} REMAIN ASYNC QUEUE: ${streamQueue?.length()}`, logApp);
                    try {
                        if (nBundledetailid) {
                            const obj = detail.find(a => a.nBundledetailid == nBundledetailid);
                            if (obj) {
                                obj.isStreamed = true;
                            }
                        }
                        this.logService.log(`REMAIN: ${detail.filter(a => !a.isStreamed).length}`, logApp);
                        console.log('REMAIN', detail.filter(a => !a.isStreamed).length);
                        if (!detail.filter(a => !a.isStreamed).length) {
                            console.log('ALL FILE STREAMED');
                            this.logService.log(`ALL FILE STREAMED`, logApp);
                            try {
                                archive.finalize();
                            }
                            catch (error) {
                            }
                            fs.rm(sessionFolder, { recursive: true }, (err) => {
                                if (err) {
                                    console.error(`Error removing session folder: ${sessionFolder}`);
                                }
                            });
                        }
                    }
                    catch (error) {
                        this.logService.error(`STREAM END FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                        console.error(error);
                    }
                    await this.downloadQueue.add('FILEDELETE', { tempFilePath, nBundledetailid, logApp });
                });
                fileStream.on('error', (error) => {
                    this.logService.error(`STREAM FAILED: ${nBundledetailid} ${error?.message}`, logApp);
                });
            }
            catch (error) {
                this.logService.error(`STREAM ERROR: ${nBundledetailid} ${error?.message}`, logApp);
            }
        }, 5);
        streamQueue.drain(() => {
        });
        const downloadQueue = async.queue(async (job, done) => {
            try {
                if (isCancelled) {
                    console.log('Skipping stream processing due to cancellation');
                    return;
                }
                console.log(`DOWNLOAD START:`);
                const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid } = job;
                try {
                    this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp);
                    const getCommand = new client_s3_1.GetObjectCommand(s3Params);
                    const { Body } = await this.s3Client.send(getCommand);
                    if (Body instanceof stream_1.Readable) {
                        const writeStream = fs.createWriteStream(tempFilePath);
                        Body.pipe(writeStream);
                        await new Promise((resolve, reject) => {
                            writeStream.on('finish', resolve);
                            writeStream.on('error', reject);
                        });
                        console.log(`File downloaded: ${tempFilePath}`);
                        this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp);
                        this.logService.log(`ON COMPLETE PUSH TO STREAM: ${nBundledetailid} `, logApp);
                        streamQueue.push(job);
                    }
                }
                catch (error) {
                    this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp);
                    console.error(`Error downloading file ${originalFileName}: ${error.message}`);
                }
            }
            catch (error) {
                this.logService.error(`Error downloading file  ${job?.nBundledetailid}  ${job?.originalFileName}: ${error.message}`, logApp);
                console.log(error);
            }
        }, 5);
        this.logService.info(`\n\r\n\rSTARTED: ${sessionId} `, logApp);
        this.logService.info(`\n\r\n\r TOTOAL FILES: ${detail.length} `, logApp);
        if (indexpath) {
            streamQueue.push({ sessionId, tempFilePath: indexpath, fileName: 'Index.pdf', originalFileName: 'Index.pdf', sessionFolder, folderPath: '/', nBundledetailid: 0, logApp });
        }
        for (const files of detail) {
            const fileName = files.cFilename.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const tempFilePath = path.join(sessionFolder, files.nBundledetailid + '-' + fileName);
            const folderPath = files.foldername || '/';
            const s3Params = {
                Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                Key: files.cPath,
            };
            files.isStreamed = false;
            this.logService.info(`PUSH TO QUEUE: ${sessionFolder} ${zipFilename}, ${files.nBundledetailid}`, logApp);
            downloadQueue.push({ sessionId, tempFilePath, fileName, originalFileName, sessionFolder, folderPath, s3Params, nBundledetailid: files.nBundledetailid, logApp });
        }
    }
};
exports.PresentReportService = PresentReportService;
exports.PresentReportService = PresentReportService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_2.InjectQueue)('download-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof present_index_service_1.PresentIndexService !== "undefined" && present_index_service_1.PresentIndexService) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object])
], PresentReportService);


/***/ }),
/* 76 */
/***/ ((module) => {

module.exports = require("console");

/***/ }),
/* 77 */
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentIndexService = void 0;
const db_service_1 = __webpack_require__(15);
const log_service_1 = __webpack_require__(56);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
var fs = __webpack_require__(59);
const pdfMake = __webpack_require__(78);
const utility_service_1 = __webpack_require__(79);
let PresentIndexService = class PresentIndexService {
    constructor(db, logService, config, utility) {
        this.db = db;
        this.logService = logService;
        this.config = config;
        this.utility = utility;
        this.column = '["Tab","cTab",70],["Name","cFilename","*"],["Date","dIntrestDt",70],["Description","cDescription",80],["Page","cRefpage",40],["Exhibit","cExhibitno",75]';
        this.filepath = this.config.get('ASSETS');
        this.fonts = {
            Roboto: {
                normal: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Regular.ttf`,
                bold: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Medium.ttf`,
                italics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Italic.ttf`,
                bolditalics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-MediumItalic.ttf`,
            },
        };
    }
    async createIndexFile(query, indexfileapth, logApp) {
        try {
            query["ref"] = 2;
            this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: query.nMasterid, type: 'P', message: 'Fatching data.' } });
            const data = await this.db.executeRef('present_index_data', query, 'present');
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.error(`Error while get INDEX Data ${data}`, logApp);
                return false;
            }
            this.logService.info(`Get Index Data reponce success`, logApp);
            const [casedetail, bundlelist] = data.data;
            let obj = { casedetail: casedetail[0], bundlelist: bundlelist };
            if (bundlelist.length > 0) {
                return await this.generateIndexfile(obj, query, indexfileapth, logApp);
            }
            else {
                return false;
            }
        }
        catch (error) {
            this.logService.info(`Error while generate index file ${error} ${query}`, logApp);
            return false;
        }
    }
    async generateIndexfile(data, body, path, logApp) {
        const { nCaseid, nMasterid } = body;
        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'P', message: 'Data analysis in process.' } });
        return await new Promise(async (resolve, reject) => {
            this.indexing(data, body, path, logApp, async (file_res) => {
                if (file_res.msg == 1) {
                    try {
                        this.logService.info(`Indexing Created successfully for ${nCaseid} by userId ${nMasterid}`, logApp);
                        resolve(true);
                    }
                    catch (error) {
                        console.log(error);
                        this.logService.error(`Indexing Failed with error ${error}`, logApp);
                        resolve(false);
                    }
                }
                else {
                    resolve(false);
                }
                data = null;
            });
        });
    }
    async indexing(data, body, filepath, logApp, cb) {
        const printer = new pdfMake(this.fonts);
        this.logService.info(`Indexing start create HTML using pdfMake for caseId ${body.nCaseid} by userId ${body.nMasterid}`, logApp);
        let [casedetail, jsonData, path] = [data.casedetail, data.bundlelist, filepath];
        console.log('step 2', casedetail);
        let docDefinition = {};
        const isCoverpg = true;
        let content;
        try {
            const columnsArray = JSON.parse(`[${this.column}]`);
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
            content = this.generateContent(columnWidths, columnsArray, jsonData);
            console.log('step 2.3');
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, tableBody, currentPage, pageSize, isCoverpg),
                content: content,
                styles: this.getStyles(),
            };
            console.log('step 2.4');
        }
        catch (error) {
            console.log('3 ', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);
            cb({ msg: -1, error: error });
        }
        try {
            console.log('step 2.5');
            const directory = path.substring(0, path.lastIndexOf('/'));
            console.log('step 2.6');
            this.logService.info(`Generate HTML Start ${docDefinition}`, logApp);
            const result = await this.generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition, path, body.nMasterid, logApp);
            if (result) {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'C', message: 'Generating PDF.' } });
            }
            else {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'PDF Generating Failed.' } });
            }
            docDefinition = null;
            casedetail = null;
            jsonData = null;
            content = null;
            this.logService.info(`Generate HTML ${result ? 'success' : 'failed'}`, logApp);
            console.log('step 2.7');
            console.log('step 2.8', result);
            if (printer?.cache)
                printer.cache.clear();
            await fs.promises.open(path, 'r').then(fd => fd.close());
            cb(result);
        }
        catch (error) {
            console.log('3 me', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);
            if (printer?.cache)
                printer.cache.clear();
            cb({ msg: -1, error: error });
        }
    }
    generateContent(columnWidths, columnsArray, data) {
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
            return content;
        }
        catch (error) {
            console.log(error);
        }
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
        }
    }
    ;
    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key));
    }
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
        catch (error) {
            console.log(error);
        }
    }
    getHeader(isCoverpg, currentPage, casedetail, pageCount) {
        try {
            if (currentPage === 1 && isCoverpg) {
                return null;
            }
            if (currentPage === 2) {
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
        }
    }
    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg) {
        try {
            if (isCoverpg && currentPage === 1) {
                return null;
            }
            if (currentPage === 2) {
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
    getHeaderContent(casedetail) {
        try {
            return [
                { text: `Case No. ${casedetail.cCaseno}`, alignment: 'right', margin: [0, 0, 40, 0], fontSize: 12, bold: true },
                { text: casedetail.cPname, alignment: 'left', margin: [40, 50, 60, 0], fontSize: 12, bold: true },
                { text: 'BETWEEN:', margin: [40, 50, 0, 0], fontSize: 12, bold: true },
                { text: casedetail.dStartDt, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'Start', alignment: 'right', margin: [0, 30, 40, 20], fontSize: 12, bold: true, decoration: 'underline' },
                { text: '-and-', alignment: 'center', margin: [0, 10, 0, 10], fontSize: 12, bold: true },
                { text: casedetail.dEndDt, alignment: 'center', margin: [70, 50, 70, 0], fontSize: 12, bold: true },
                { text: 'End', alignment: 'right', margin: [0, 10, 40, 50], fontSize: 12, bold: true, decoration: 'underline' },
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
        }
    }
    async generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition, path, nMasterid, logApp) {
        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'P', message: 'Generating PDF.' } });
        return new Promise((resolve, reject) => {
            const headerContent = [];
            try {
                console.log('START GENERATION');
                const directory = path.substring(0, path.lastIndexOf('/'));
                let tempPdfDoc = printer.createPdfKitDocument(docDefinition);
                let pdfDoc;
                let writeStream;
                let chunks = [];
                tempPdfDoc.on('data', (chunk) => {
                    chunks.push(chunk);
                });
                tempPdfDoc.on('end', async () => {
                    console.log('PDF generation completed successfully.');
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
                    if (isCoverpg) {
                        finalContent = [
                            ...headerContent,
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
                    this.logService.info(`Generate HTML success`, logApp);
                    this.logService.info(`Creating PDF `, logApp);
                    console.log('Creating PDF ', path);
                    writeStream = fs.createWriteStream(path);
                    writeStream.on('finish', () => {
                        console.log('PDF generated successfully.');
                        this.logService.info(`PDF generated successfully.`, logApp);
                        resolve({ msg: 1, pNo: casedetail.totalPages });
                    });
                    writeStream.on('error', (error) => {
                        this.cleanup(pdfDoc, writeStream);
                        console.log('Error generating PDF', error);
                        this.logService.error(`Error generating PDF ${JSON.stringify(error)}`, logApp);
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
                });
                tempPdfDoc.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream, tempPdfDoc);
                    console.error('PDF generation error:', error);
                });
                tempPdfDoc.end();
                try {
                    this.cleanupMemory(chunks);
                    chunks = [];
                    pdfDoc = null;
                    writeStream = null;
                    tempPdfDoc = null;
                }
                catch (error) {
                    console.log(error);
                }
            }
            catch (error) {
                console.log(error);
                this.logService.error(`Generate HTML error ${JSON.stringify(error)}`, logApp);
                reject({ msg: -1, value: 'Indexing successful' });
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
};
exports.PresentIndexService = PresentIndexService;
exports.PresentIndexService = PresentIndexService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object])
], PresentIndexService);


/***/ }),
/* 78 */
/***/ ((module) => {

module.exports = require("pdfmake");

/***/ }),
/* 79 */
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
const kafka_shared_service_1 = __webpack_require__(22);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        console.log('Emited to kafka', data);
        this.kafka.sendMessage((topic ? topic : 'download-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


/***/ }),
/* 80 */
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
const db_service_1 = __webpack_require__(15);
const query_builder_service_1 = __webpack_require__(17);
const redis_db_service_1 = __webpack_require__(18);
const ioredis_1 = __webpack_require__(20);
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
/* 81 */
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
const nest_winston_1 = __webpack_require__(58);
const winston = __webpack_require__(57);
const fs = __webpack_require__(59);
const path = __webpack_require__(60);
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
/* 82 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskProcessorModule = void 0;
const common_1 = __webpack_require__(3);
const queue_module_1 = __webpack_require__(83);
const download_process_1 = __webpack_require__(84);
const filedelete_process_1 = __webpack_require__(86);
const s3_client_service_1 = __webpack_require__(85);
const log_service_1 = __webpack_require__(56);
const event_emitter_1 = __webpack_require__(87);
const indexfile_service_1 = __webpack_require__(88);
const db_service_1 = __webpack_require__(15);
const query_builder_service_1 = __webpack_require__(17);
const utility_service_1 = __webpack_require__(79);
const shared_module_1 = __webpack_require__(80);
const kafka_module_1 = __webpack_require__(25);
const indexgeneration_process_1 = __webpack_require__(89);
let TaskProcessorModule = class TaskProcessorModule {
};
exports.TaskProcessorModule = TaskProcessorModule;
exports.TaskProcessorModule = TaskProcessorModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule, queue_module_1.QueueModule, event_emitter_1.EventEmitterModule,
            kafka_module_1.KafkaModule.register('etabella-download', 'download-group'),
        ],
        providers: [download_process_1.DownloadProcessor, filedelete_process_1.DeleteProcessor, s3_client_service_1.S3ClientService, log_service_1.LogService, indexfile_service_1.IndexfileService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, utility_service_1.UtilityService,
            indexgeneration_process_1.IndexGenerationProcessor
        ],
        exports: [s3_client_service_1.S3ClientService]
    })
], TaskProcessorModule);


/***/ }),
/* 83 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueModule = void 0;
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(69);
const config_1 = __webpack_require__(9);
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
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
                name: 'download-queue',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'index-generation',
                limiter: {
                    max: 1,
                    duration: 25000
                },
                settings: {
                    maxStalledCount: 1,
                    stalledInterval: 120000,
                    backoffStrategies: {
                        memory: (attemptsMade) => {
                            return attemptsMade * 10000;
                        }
                    }
                },
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                    attempts: 1,
                    timeout: 600000,
                    backoff: {
                        type: 'exponential',
                        delay: 10000,
                    },
                },
            }),
        ],
        exports: [bull_1.BullModule],
    })
], QueueModule);


/***/ }),
/* 84 */
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
exports.DownloadProcessor = void 0;
const bull_1 = __webpack_require__(69);
const bull_2 = __webpack_require__(68);
const s3_client_service_1 = __webpack_require__(85);
const client_s3_1 = __webpack_require__(51);
const stream_1 = __webpack_require__(65);
const fs = __webpack_require__(59);
const log_service_1 = __webpack_require__(56);
let DownloadProcessor = class DownloadProcessor {
    constructor(s3, logService) {
        this.s3 = s3;
        this.logService = logService;
    }
    async handleDownload(job) {
        const { s3Params, tempFilePath, originalFileName, folderPath, logApp, nBundledetailid, query } = job.data;
        console.log(`DOWNLOAD START: ${tempFilePath}`);
        try {
            this.logService.log(`DOWNLOAD START ${nBundledetailid}  ${tempFilePath}`, logApp);
            const getCommand = new client_s3_1.GetObjectCommand(s3Params);
            const { Body } = await this.s3.s3Client.send(getCommand);
            if (Body instanceof stream_1.Readable) {
                const writeStream = fs.createWriteStream(tempFilePath);
                Body.pipe(writeStream);
                await new Promise((resolve, reject) => {
                    writeStream.on('finish', resolve);
                    writeStream.on('error', reject);
                });
                console.log(`File downloaded: ${tempFilePath}`);
                this.logService.log(`DOWNLOAD COMPLETE ${nBundledetailid} ${tempFilePath}`, logApp);
                await job.queue.add('STREAM', { tempFilePath, originalFileName, folderPath });
            }
        }
        catch (error) {
            this.logService.error(`Error downloading file  ${nBundledetailid}  ${originalFileName}: ${error.message}`, logApp);
            console.error(`Error downloading file ${originalFileName}: ${error.message}`);
        }
    }
};
exports.DownloadProcessor = DownloadProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'DOWNLOAD', concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DownloadProcessor.prototype, "handleDownload", null);
exports.DownloadProcessor = DownloadProcessor = __decorate([
    (0, bull_1.Processor)('download-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_client_service_1.S3ClientService !== "undefined" && s3_client_service_1.S3ClientService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], DownloadProcessor);


/***/ }),
/* 85 */
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
exports.S3ClientService = void 0;
const client_s3_1 = __webpack_require__(51);
const node_http_handler_1 = __webpack_require__(64);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const https_1 = __webpack_require__(66);
let S3ClientService = class S3ClientService {
    constructor(config) {
        this.config = config;
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
};
exports.S3ClientService = S3ClientService;
exports.S3ClientService = S3ClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], S3ClientService);


/***/ }),
/* 86 */
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
const log_service_1 = __webpack_require__(56);
const bull_1 = __webpack_require__(69);
const bull_2 = __webpack_require__(68);
const fs = __webpack_require__(59);
let DeleteProcessor = class DeleteProcessor {
    constructor(logService) {
        this.logService = logService;
    }
    async handleDelete(job) {
        const { tempFilePath, nBundledetailid, logApp } = job.data;
        try {
            fs.unlink(tempFilePath, (err) => {
                if (err) {
                    this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nBundledetailid} . ${err?.message}`, logApp);
                    console.error(`Failed to delete temp file: ${tempFilePath}`);
                }
                else {
                    this.logService.warn(`FILE DELETED ${tempFilePath}  ${nBundledetailid}`, logApp);
                }
            });
        }
        catch (error) {
            this.logService.warn(`Error deleting temp file: ${tempFilePath}  ${nBundledetailid} . ${error.message}`, logApp);
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
    (0, bull_1.Processor)('download-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object])
], DeleteProcessor);


/***/ }),
/* 87 */
/***/ ((module) => {

module.exports = require("@nestjs/event-emitter");

/***/ }),
/* 88 */
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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexfileService = void 0;
const db_service_1 = __webpack_require__(15);
const log_service_1 = __webpack_require__(56);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
var fs = __webpack_require__(59);
const pdfMake = __webpack_require__(78);
const utility_service_1 = __webpack_require__(79);
let IndexfileService = class IndexfileService {
    constructor(db, logService, config, utility) {
        this.db = db;
        this.logService = logService;
        this.config = config;
        this.utility = utility;
        this.column = '["Tab","cTab",70],["Name","cFilename","*"],["Date","dIntrestDt",70],["Description","cDescription",80],["Page","cRefpage",40],["Exhibit","cExhibitno",75]';
        this.filepath = this.config.get('ASSETS');
        this.fonts = {
            Roboto: {
                normal: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Regular.ttf`,
                bold: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Medium.ttf`,
                italics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-Italic.ttf`,
                bolditalics: `${this.config.get('FONTS_PATH')}Roboto/Roboto-MediumItalic.ttf`,
            },
        };
    }
    async createIndexFile(query, indexfileapth, logApp) {
        try {
            query["ref"] = 2;
            this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: query.nMasterid, type: 'P', message: 'Fatching data.' } });
            const data = await this.db.executeRef('download_index_data', query);
            if (!data.success || !data.data || data.data.length === 0) {
                this.logService.error(`Error while get INDEX Data ${data}`, logApp);
                return false;
            }
            this.logService.info(`Get Index Data reponce success`, logApp);
            const [casedetail, bundlelist] = data.data;
            let obj = { casedetail: casedetail[0], bundlelist: bundlelist };
            if (bundlelist.length > 0) {
                return await this.generateIndexfile(obj, query, indexfileapth, logApp);
            }
            else {
                return false;
            }
        }
        catch (error) {
            this.logService.info(`Error while generate index file ${error} ${query}`, logApp);
            return false;
        }
    }
    async generateIndexfile(data, body, path, logApp) {
        const { nCaseid, nMasterid } = body;
        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'P', message: 'Data analysis in process.' } });
        return await new Promise(async (resolve, reject) => {
            this.indexing(data, body, path, logApp, async (file_res) => {
                if (file_res.msg == 1) {
                    try {
                        this.logService.info(`Indexing Created successfully for ${nCaseid} by userId ${nMasterid}`, logApp);
                        resolve(true);
                    }
                    catch (error) {
                        console.log(error);
                        this.logService.error(`Indexing Failed with error ${error}`, logApp);
                        resolve(false);
                    }
                }
                else {
                    resolve(false);
                }
                data = null;
            });
        });
    }
    async indexing(data, body, filepath, logApp, cb) {
        const printer = new pdfMake(this.fonts);
        this.logService.info(`Indexing start create HTML using pdfMake for caseId ${body.nCaseid} by userId ${body.nMasterid}`, logApp);
        let [casedetail, jsonData, path] = [data.casedetail, data.bundlelist, filepath];
        console.log('step 2', casedetail);
        let docDefinition = {};
        const isCoverpg = true;
        let content;
        try {
            const columnsArray = JSON.parse(`[${this.column}]`);
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
            content = this.generateContent(columnWidths, columnsArray, jsonData);
            console.log('step 2.3');
            docDefinition = {
                header: (currentPage, pageCount) => this.getHeader(isCoverpg, currentPage, casedetail, pageCount),
                pageSize: 'A4',
                pageMargins: [40, 80, 40, 10],
                background: (currentPage, pageSize) => this.getBackground(columnWidths, tableBody, currentPage, pageSize, isCoverpg),
                content: content,
                styles: this.getStyles(),
            };
            console.log('step 2.4');
        }
        catch (error) {
            console.log('3 ', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);
            cb({ msg: -1, error: error });
        }
        try {
            console.log('step 2.5');
            const directory = path.substring(0, path.lastIndexOf('/'));
            console.log('step 2.6');
            this.logService.info(`Generate HTML Start ${docDefinition}`, logApp);
            const result = await this.generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition, path, body.nMasterid, logApp);
            if (result) {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'C', message: 'Generating PDF.' } });
            }
            else {
                this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: body.nMasterid, type: 'F', message: 'PDF Generating Failed.' } });
            }
            docDefinition = null;
            casedetail = null;
            jsonData = null;
            content = null;
            this.logService.info(`Generate HTML ${result ? 'success' : 'failed'}`, logApp);
            console.log('step 2.7');
            console.log('step 2.8', result);
            if (printer?.cache)
                printer.cache.clear();
            await fs.promises.open(path, 'r').then(fd => fd.close());
            cb(result);
        }
        catch (error) {
            console.log('3 me', error);
            this.logService.error(`Generate HTML failed with error ${JSON.stringify(error)}`, logApp);
            if (printer?.cache)
                printer.cache.clear();
            cb({ msg: -1, error: error });
        }
    }
    generateContent(columnWidths, columnsArray, data) {
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
            return content;
        }
        catch (error) {
            console.log(error);
        }
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
        }
    }
    ;
    gettable_row(columnsArray, item) {
        return columnsArray.map(e => e[1]).map(key => this.gettable_row_bykey(item, key));
    }
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
        catch (error) {
            console.log(error);
        }
    }
    getHeader(isCoverpg, currentPage, casedetail, pageCount) {
        try {
            if (currentPage === 1 && isCoverpg) {
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
        }
        catch (error) {
            console.log(error);
        }
    }
    getBackground(columnWidths, columnsArray, currentPage, pageSize, isCoverpg) {
        try {
            if (isCoverpg && currentPage === 1) {
                return null;
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
        }
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
        }
    }
    async generatePdf(isCoverpg, jsonData, casedetail, printer, docDefinition, path, nMasterid, logApp) {
        this.utility.emit({ event: 'DOWNLOAD-INDEXING-PROGRESS', data: { identifier: '', nMasterid: nMasterid, type: 'P', message: 'Generating PDF.' } });
        return new Promise((resolve, reject) => {
            let headerContent = [];
            try {
                console.log('START GENERATION');
                const directory = path.substring(0, path.lastIndexOf('/'));
                let pdfDoc;
                let writeStream;
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
                if (isCoverpg) {
                    docDefinition.content.unshift(...headerContent);
                    finalContent = docDefinition.content;
                }
                else {
                    finalContent = docDefinition.content;
                }
                console.log('Step 2');
                let finalDocDefinition = {
                    header: docDefinition.header,
                    pageSize: 'A4',
                    pageMargins: [40, 80, 40, 10],
                    background: docDefinition.background,
                    styles: docDefinition.styles,
                    content: finalContent,
                };
                console.log('Step 3', docDefinition.header);
                pdfDoc = printer.createPdfKitDocument(finalDocDefinition);
                finalDocDefinition = null;
                finalContent = null;
                jsonData = null;
                headerContent = null;
                console.log('Step createPdfKitDocument');
                this.logService.info(`Generate HTML success`, logApp);
                this.logService.info(`Creating PDF `, logApp);
                console.log('Creating PDF ', path);
                writeStream = fs.createWriteStream(path);
                writeStream.on('finish', () => {
                    console.log('PDF generated successfully.');
                    this.logService.info(`PDF generated successfully.`, logApp);
                    this.cleanup(pdfDoc, writeStream, null);
                    resolve({ msg: 1, pNo: casedetail.totalPages });
                });
                writeStream.on('error', (error) => {
                    this.cleanup(pdfDoc, writeStream);
                    console.log('Error generating PDF', error);
                    this.logService.error(`Error generating PDF ${JSON.stringify(error)}`, logApp);
                    this.cleanup(pdfDoc, writeStream, null);
                    resolve({ msg: -1, error });
                });
                pdfDoc.on('end', () => {
                    if (global.gc) {
                        global.gc();
                    }
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
                this.logService.error(`Generate HTML error ${JSON.stringify(error)}`, logApp);
                reject({ msg: -1, value: 'Indexing successful' });
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
};
exports.IndexfileService = IndexfileService;
exports.IndexfileService = IndexfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object])
], IndexfileService);


/***/ }),
/* 89 */
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
exports.IndexGenerationProcessor = void 0;
const log_service_1 = __webpack_require__(56);
const bull_1 = __webpack_require__(69);
const bull_2 = __webpack_require__(68);
const indexfile_service_1 = __webpack_require__(88);
let IndexGenerationProcessor = class IndexGenerationProcessor {
    constructor(indexFileService, logService) {
        this.indexFileService = indexFileService;
        this.logService = logService;
    }
    async handleGeneration(job) {
        console.log('Processing job:', job.data);
        const { logApp } = job.data;
        this.logService.warn(`Processing job ${job.id} - Index generation for task ${job.data.query.nDTaskid}`, logApp);
        try {
            const result = await this.indexFileService.createIndexFile(job.data.query, job.data.outputPath, job.data.logApp);
            this.logService.warn(`Completed job ${job.id} - Index generation successful`, logApp);
            return { success: true, result };
        }
        catch (error) {
            this.logService.warn(`Failed job ${job.id} - Index generation failed: ${error.message}`, logApp);
            throw error;
        }
    }
};
exports.IndexGenerationProcessor = IndexGenerationProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'generate', concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], IndexGenerationProcessor.prototype, "handleGeneration", null);
exports.IndexGenerationProcessor = IndexGenerationProcessor = __decorate([
    (0, bull_1.Processor)('index-generation'),
    __metadata("design:paramtypes", [typeof (_a = typeof indexfile_service_1.IndexfileService !== "undefined" && indexfile_service_1.IndexfileService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], IndexGenerationProcessor);


/***/ }),
/* 90 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueService = void 0;
const common_1 = __webpack_require__(3);
const Bull = __webpack_require__(68);
const child_process_1 = __webpack_require__(91);
let QueueService = class QueueService {
    constructor() {
        this.queues = new Map();
        this.workers = new Map();
    }
    createQueue(queueName) {
        if (this.queues.has(queueName)) {
            return this.queues.get(queueName);
        }
        const queue = new Bull(queueName, {
            redis: {
                port: Number(process.env.REDIS_PORT),
                host: process.env.REDIS_IP,
                password: process.env.REDIS_PASSWORD,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: true,
            },
        });
        this.queues.set(queueName, queue);
        this.spawnWorker(queueName);
        return queue;
    }
    spawnWorker(queueName) {
        if (this.workers.has(queueName)) {
            console.log(`Worker already exists for queue: ${queueName}`);
            return;
        }
        const workerProcess = (0, child_process_1.fork)('./download.worker.js', [queueName]);
        this.workers.set(queueName, workerProcess);
        workerProcess.on('exit', (code) => {
            console.log(`Worker for queue ${queueName} exited with code ${code}`);
            this.workers.delete(queueName);
        });
        console.log(`Worker process spawned for queue: ${queueName}`);
    }
    deleteQueue(queueName) {
        const queue = this.queues.get(queueName);
        const worker = this.workers.get(queueName);
        if (worker) {
            worker.kill();
            this.workers.delete(queueName);
        }
        if (queue) {
            queue.close();
            this.queues.delete(queueName);
        }
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)()
], QueueService);


/***/ }),
/* 91 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 92 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueRegistrationService = void 0;
const common_1 = __webpack_require__(3);
const Bull = __webpack_require__(68);
let QueueRegistrationService = class QueueRegistrationService {
    constructor() {
        this.registeredQueues = new Map();
    }
    async registerQueue(queueName) {
        if (this.registeredQueues.has(queueName)) {
            return this.registeredQueues.get(queueName);
        }
        const queue = new Bull(queueName, {
            redis: {
                host: 'localhost',
                port: 6379,
            },
        });
        this.registeredQueues.set(queueName, queue);
        return queue;
    }
    async unregisterQueue(queueName) {
        const queue = this.registeredQueues.get(queueName);
        if (queue) {
            await queue.close();
            this.registeredQueues.delete(queueName);
        }
    }
    getQueue(queueName) {
        return this.registeredQueues.get(queueName);
    }
};
exports.QueueRegistrationService = QueueRegistrationService;
exports.QueueRegistrationService = QueueRegistrationService = __decorate([
    (0, common_1.Injectable)()
], QueueRegistrationService);


/***/ }),
/* 93 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(23);
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
/* 95 */
/***/ ((module) => {

module.exports = require("body-parser");

/***/ }),
/* 96 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 97 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 98 */
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
const download_module_1 = __webpack_require__(2);
const config_1 = __webpack_require__(9);
const dotenv = __webpack_require__(93);
const kafka_config_1 = __webpack_require__(94);
const bodyParser = __webpack_require__(95);
const compression = __webpack_require__(96);
const cookieParser = __webpack_require__(97);
const swagger_1 = __webpack_require__(27);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(98);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(download_module_1.DownloadModule);
    const configService = app.get(config_1.ConfigService);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('download-group'));
    await app.startAllMicroservices();
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(compression());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Etabella Core API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/download' : '')
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
    await app.listen(configService.get('PORT_DOWNLOAD'));
}
bootstrap();

})();

/******/ })()
;