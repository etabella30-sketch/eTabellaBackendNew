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
exports.RealtimeServerModule = void 0;
const common_1 = __webpack_require__(3);
const realtime_server_controller_1 = __webpack_require__(4);
const realtime_server_service_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const query_builder_service_1 = __webpack_require__(7);
const db_service_1 = __webpack_require__(8);
const session_controller_1 = __webpack_require__(10);
const session_service_1 = __webpack_require__(12);
const date_time_service_1 = __webpack_require__(13);
const scheduler_service_1 = __webpack_require__(15);
const socket_service_1 = __webpack_require__(54);
const events_gateway_1 = __webpack_require__(55);
const websocket_module_1 = __webpack_require__(60);
const savedata_service_1 = __webpack_require__(57);
const stream_data_service_1 = __webpack_require__(58);
const firebase_service_1 = __webpack_require__(18);
const issue_controller_1 = __webpack_require__(61);
const issue_service_1 = __webpack_require__(26);
const users_service_1 = __webpack_require__(22);
const annot_transfer_service_1 = __webpack_require__(46);
const export_service_1 = __webpack_require__(27);
const utility_service_1 = __webpack_require__(28);
const conversion_js_service_1 = __webpack_require__(36);
const fileprovider_service_1 = __webpack_require__(53);
const sync_controller_1 = __webpack_require__(63);
const sync_service_1 = __webpack_require__(59);
const kafka_shared_module_1 = __webpack_require__(65);
const upload_controller_1 = __webpack_require__(67);
const serve_static_1 = __webpack_require__(71);
const path_1 = __webpack_require__(24);
const feed_data_service_1 = __webpack_require__(37);
const ioredis_1 = __webpack_require__(40);
const redis_db_service_1 = __webpack_require__(38);
const global_1 = __webpack_require__(72);
const log_service_1 = __webpack_require__(41);
const winston_module_1 = __webpack_require__(75);
const transcript_module_1 = __webpack_require__(76);
const feed_controller_1 = __webpack_require__(107);
const feed_service_1 = __webpack_require__(109);
const marknav_controller_1 = __webpack_require__(111);
const marknav_service_1 = __webpack_require__(112);
const marks_service_1 = __webpack_require__(110);
const factsheet_controller_1 = __webpack_require__(105);
const factsheet_service_1 = __webpack_require__(106);
const fact_controller_1 = __webpack_require__(99);
const fact_service_1 = __webpack_require__(100);
const case_tuple_controller_1 = __webpack_require__(114);
const case_tuple_service_1 = __webpack_require__(116);
const session_job_service_1 = __webpack_require__(117);
const schedule_1 = __webpack_require__(118);
let RealtimeServerModule = class RealtimeServerModule {
};
exports.RealtimeServerModule = RealtimeServerModule;
exports.RealtimeServerModule = RealtimeServerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            global_1.GlobalModule,
            schedule_1.ScheduleModule.forRoot(),
            kafka_shared_module_1.KafkaSharedModule,
            websocket_module_1.WebSocketModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'assets'),
                serveStaticOptions: { index: false },
            }),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            winston_module_1.WinstonConfigModule.forRoot('upload'), transcript_module_1.TranscriptModule
        ],
        controllers: [feed_controller_1.FeedController, realtime_server_controller_1.RealtimeServerController, session_controller_1.SessionController, issue_controller_1.IssueController, sync_controller_1.SyncController, upload_controller_1.UploadController, marknav_controller_1.MarknavController, factsheet_controller_1.FactsheetController, fact_controller_1.FactController, case_tuple_controller_1.CaseTupleController],
        providers: [realtime_server_service_1.RealtimeServerService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, config_1.ConfigService, events_gateway_1.EventsGateway,
            session_service_1.SessionService, date_time_service_1.DateTimeService, scheduler_service_1.SchedulerService, socket_service_1.SocketService, stream_data_service_1.StreamDataService, savedata_service_1.SavedataService, firebase_service_1.FirebaseService,
            issue_service_1.IssueService,
            fact_service_1.FactService,
            users_service_1.UsersService, annot_transfer_service_1.AnnotTransferService, export_service_1.ExportService, utility_service_1.UtilityService, conversion_js_service_1.ConversionJsService, fileprovider_service_1.FileproviderService, sync_service_1.SyncService, feed_data_service_1.FeedDataService,
            redis_db_service_1.RedisDbService, log_service_1.LogService, transcript_module_1.TranscriptModule, feed_service_1.FeedService, marknav_service_1.MarknavService, marks_service_1.MarksService, factsheet_service_1.FactsheetService, case_tuple_service_1.CaseTupleService, session_job_service_1.SessionJobService
        ],
        exports: []
    })
], RealtimeServerModule);


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
exports.RealtimeServerController = void 0;
const common_1 = __webpack_require__(3);
const realtime_server_service_1 = __webpack_require__(5);
let RealtimeServerController = class RealtimeServerController {
    constructor(realtimeServerService) {
        this.realtimeServerService = realtimeServerService;
    }
    getHello() {
        return this.realtimeServerService.getHello();
    }
};
exports.RealtimeServerController = RealtimeServerController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], RealtimeServerController.prototype, "getHello", null);
exports.RealtimeServerController = RealtimeServerController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof realtime_server_service_1.RealtimeServerService !== "undefined" && realtime_server_service_1.RealtimeServerService) === "function" ? _a : Object])
], RealtimeServerController);


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
exports.RealtimeServerService = void 0;
const common_1 = __webpack_require__(3);
let RealtimeServerService = class RealtimeServerService {
    async onModuleInit() {
    }
    async handleMessage(topic, message) {
        console.log(`Received message on ${topic}:`, message);
    }
    getHello() {
        return 'Hello World!';
    }
};
exports.RealtimeServerService = RealtimeServerService;
exports.RealtimeServerService = RealtimeServerService = __decorate([
    (0, common_1.Injectable)()
], RealtimeServerService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(9);
const query_builder_service_1 = __webpack_require__(7);
const config_1 = __webpack_require__(6);
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
/* 9 */
/***/ ((module) => {

module.exports = require("pg");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const session_service_1 = __webpack_require__(12);
const session_interface_1 = __webpack_require__(48);
const microservices_1 = __webpack_require__(30);
const express_1 = __webpack_require__(52);
const fileprovider_service_1 = __webpack_require__(53);
let SessionController = class SessionController {
    constructor(sessionService, fileProviderService) {
        this.sessionService = sessionService;
        this.fileProviderService = fileProviderService;
    }
    handeAuth2(message, context) {
        console.log(`Received message for REALTIME-FILE-UPLOAD: `, message);
        this.sessionService.emitMsg(message);
    }
    async getList(query) {
        return await this.sessionService.getSessions(query);
    }
    async getSessiondata(query) {
        return await this.sessionService.getSessiondata(query);
    }
    async getSessionV2(query) {
        return await this.sessionService.getSessiondataV2(query);
    }
    async getSessionByCaseId(query) {
        return await this.sessionService.getSessionByCaseId(query);
    }
    async getlivesessionbycaseid(query) {
        return await this.sessionService.getlivesessionbycaseid(query);
    }
    async getAssigned(query) {
        return await this.sessionService.getAssignedusers(query);
    }
    async sessionBuilder(body) {
        console.log("sessionbuilder", body);
        return await this.sessionService.sessionBuilder(body);
    }
    async sessiondelete(body) {
        return await this.sessionService.sessionDelete(body);
    }
    async sessionend(body) {
        return await this.sessionService.sessionEnd(body);
    }
    async sessionstart(body) {
        return await this.sessionService.sessionStart(body);
    }
    async setServer(body) {
        return await this.sessionService.setServer(body);
    }
    async toSessions(query) {
        return await this.sessionService.getTodaySessions(query);
    }
    async toServers(query) {
        return await this.sessionService.getTodayServers(query);
    }
    async getServers(query) {
        return await this.sessionService.getServers(query);
    }
    async serverBuilder(body) {
        return await this.sessionService.serverBuilder(body);
    }
    async CreateUser(body) {
        return await this.sessionService.postCreateUsers(body);
    }
    async getTeamusers(query) {
        return await this.sessionService.getTeamusers(query);
    }
    async getSearchUsers(query) {
        return await this.sessionService.getSearchUsers(query);
    }
    async assignMent(body) {
        return await this.sessionService.assignMent(body);
    }
    async insertConnectivityLog(body) {
        return await this.sessionService.insertConnectivityLog(body);
    }
    async getConnectivityLog(query) {
        return await this.sessionService.getConnectivityLog(query);
    }
    async checrunningsession(body) {
        return await this.sessionService.checkrunningSessions(body);
    }
    async deleteConnectivityLog(body) {
        return await this.sessionService.insertConnectivityLog(body);
    }
    async getCaseList(query) {
        return await this.sessionService.getCaseList(query);
    }
    async getTranscriptfiles(query) {
        return await this.sessionService.getTranscriptfiles(query);
    }
    async getCaseDetail(query) {
        return await this.sessionService.caseDetail(query);
    }
    async getSectionDetail(query) {
        return await this.sessionService.sectionDetail(query);
    }
    async getBundleList(query) {
        return await this.sessionService.bundleDetail(query);
    }
    async teamdelete(body) {
        return await this.sessionService.checkForDuplicate(body);
    }
    async publishFile(body) {
        return await this.sessionService.publishFile(body);
    }
    async getRealtimeSessionData(query) {
        return await this.sessionService.getRealtimeSessionData(query);
    }
    async updateTranscriptStatus(body) {
        return await this.sessionService.updateTranscriptStatus(body);
    }
    async getDocInfobyTab(query) {
        return await this.sessionService.getDocInfobyTab(query);
    }
    async syncSessions(body) {
        return await this.sessionService.syncSessionData(body);
    }
    async syncfeeddata(body) {
        return await this.sessionService.syncFeedData(body);
    }
    async getallusers(body) {
        return await this.sessionService.getallusers(body);
    }
    getFile(query, res) {
        console.log('DownloadFileToLocal Reqested', query);
        this.fileProviderService.provideFile(query, res);
    }
    async joiningLog(body) {
        return await this.sessionService.joiningLog(body);
    }
    async getRTSessions(query) {
        return await this.sessionService.getRtsessions(query);
    }
    async getSessionUsers(query) {
        return await this.sessionService.getRTSessionUsers(query);
    }
    async getRtLogs(query) {
        return await this.sessionService.getRTlogs(query);
    }
    async export(body) {
        return await this.sessionService.exportLogExcel(body);
    }
    async getFiledata(query) {
        return await this.sessionService.getFiledata(query);
    }
    async getDocinfo(query) {
        return await this.sessionService.getDocinfo(query);
    }
    async getActiveSession(query) {
        return await this.sessionService.getActiveSession(query);
    }
    async getActiveSessionDetail(query) {
        return await this.sessionService.getActiveSessionDetail(query);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, microservices_1.MessagePattern)('REALTIME-FILE-UPLOAD'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "handeAuth2", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof session_interface_1.SessionListReq !== "undefined" && session_interface_1.SessionListReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], SessionController.prototype, "getList", null);
__decorate([
    (0, common_1.Get)('sessiondata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof session_interface_1.SessionDataReq !== "undefined" && session_interface_1.SessionDataReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], SessionController.prototype, "getSessiondata", null);
__decorate([
    (0, common_1.Get)('SessionDataV2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof session_interface_1.SessionDataV2Req !== "undefined" && session_interface_1.SessionDataV2Req) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], SessionController.prototype, "getSessionV2", null);
__decorate([
    (0, common_1.Get)('getSessionsByCaseId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof session_interface_1.SessionByCaseIdReq !== "undefined" && session_interface_1.SessionByCaseIdReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], SessionController.prototype, "getSessionByCaseId", null);
__decorate([
    (0, common_1.Get)('getlivesessionbycaseid'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof session_interface_1.SessionByCaseIdReq !== "undefined" && session_interface_1.SessionByCaseIdReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], SessionController.prototype, "getlivesessionbycaseid", null);
__decorate([
    (0, common_1.Get)('getassigned'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof session_interface_1.sessionDertailReq !== "undefined" && session_interface_1.sessionDertailReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], SessionController.prototype, "getAssigned", null);
__decorate([
    (0, common_1.Post)('sessionbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof session_interface_1.SessionBuilderReq !== "undefined" && session_interface_1.SessionBuilderReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], SessionController.prototype, "sessionBuilder", null);
__decorate([
    (0, common_1.Post)('sessiondelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof session_interface_1.SessionDeleteReq !== "undefined" && session_interface_1.SessionDeleteReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], SessionController.prototype, "sessiondelete", null);
__decorate([
    (0, common_1.Post)('sessionend'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof session_interface_1.SessionEndReq !== "undefined" && session_interface_1.SessionEndReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], SessionController.prototype, "sessionend", null);
__decorate([
    (0, common_1.Post)('sessionstart'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof session_interface_1.SessionStartReq !== "undefined" && session_interface_1.SessionStartReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], SessionController.prototype, "sessionstart", null);
__decorate([
    (0, common_1.Post)('setserver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof session_interface_1.setServerReq !== "undefined" && session_interface_1.setServerReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], SessionController.prototype, "setServer", null);
__decorate([
    (0, common_1.Get)('todaysessions'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_1 = typeof Promise !== "undefined" && Promise) === "function" ? _1 : Object)
], SessionController.prototype, "toSessions", null);
__decorate([
    (0, common_1.Get)('todayservers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], SessionController.prototype, "toServers", null);
__decorate([
    (0, common_1.Get)('servers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], SessionController.prototype, "getServers", null);
__decorate([
    (0, common_1.Post)('serverbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_4 = typeof session_interface_1.ServerBuilderReq !== "undefined" && session_interface_1.ServerBuilderReq) === "function" ? _4 : Object]),
    __metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], SessionController.prototype, "serverBuilder", null);
__decorate([
    (0, common_1.Post)('CreateUser'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_6 = typeof session_interface_1.createUserInterfaceReq !== "undefined" && session_interface_1.createUserInterfaceReq) === "function" ? _6 : Object]),
    __metadata("design:returntype", typeof (_7 = typeof Promise !== "undefined" && Promise) === "function" ? _7 : Object)
], SessionController.prototype, "CreateUser", null);
__decorate([
    (0, common_1.Get)('teamsusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_8 = typeof session_interface_1.userListReq !== "undefined" && session_interface_1.userListReq) === "function" ? _8 : Object]),
    __metadata("design:returntype", typeof (_9 = typeof Promise !== "undefined" && Promise) === "function" ? _9 : Object)
], SessionController.prototype, "getTeamusers", null);
__decorate([
    (0, common_1.Get)('searchusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_10 = typeof session_interface_1.SearchedUserListReq !== "undefined" && session_interface_1.SearchedUserListReq) === "function" ? _10 : Object]),
    __metadata("design:returntype", typeof (_11 = typeof Promise !== "undefined" && Promise) === "function" ? _11 : Object)
], SessionController.prototype, "getSearchUsers", null);
__decorate([
    (0, common_1.Post)('assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_12 = typeof session_interface_1.assignMentReq !== "undefined" && session_interface_1.assignMentReq) === "function" ? _12 : Object]),
    __metadata("design:returntype", typeof (_13 = typeof Promise !== "undefined" && Promise) === "function" ? _13 : Object)
], SessionController.prototype, "assignMent", null);
__decorate([
    (0, common_1.Post)('insertConnetivityLog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_14 = typeof session_interface_1.conectivityLog !== "undefined" && session_interface_1.conectivityLog) === "function" ? _14 : Object]),
    __metadata("design:returntype", typeof (_15 = typeof Promise !== "undefined" && Promise) === "function" ? _15 : Object)
], SessionController.prototype, "insertConnectivityLog", null);
__decorate([
    (0, common_1.Get)('getConnectivityLog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_16 = typeof session_interface_1.getConnectivityLogReq !== "undefined" && session_interface_1.getConnectivityLogReq) === "function" ? _16 : Object]),
    __metadata("design:returntype", typeof (_17 = typeof Promise !== "undefined" && Promise) === "function" ? _17 : Object)
], SessionController.prototype, "getConnectivityLog", null);
__decorate([
    (0, common_1.Post)('checkforrunningsession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_18 = typeof session_interface_1.checkRunningSessionReq !== "undefined" && session_interface_1.checkRunningSessionReq) === "function" ? _18 : Object]),
    __metadata("design:returntype", typeof (_19 = typeof Promise !== "undefined" && Promise) === "function" ? _19 : Object)
], SessionController.prototype, "checrunningsession", null);
__decorate([
    (0, common_1.Post)('deleteConnetivityLog'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_20 = typeof session_interface_1.deleteConectivityLog !== "undefined" && session_interface_1.deleteConectivityLog) === "function" ? _20 : Object]),
    __metadata("design:returntype", typeof (_21 = typeof Promise !== "undefined" && Promise) === "function" ? _21 : Object)
], SessionController.prototype, "deleteConnectivityLog", null);
__decorate([
    (0, common_1.Get)('caselist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_22 = typeof session_interface_1.CaseListReq !== "undefined" && session_interface_1.CaseListReq) === "function" ? _22 : Object]),
    __metadata("design:returntype", typeof (_23 = typeof Promise !== "undefined" && Promise) === "function" ? _23 : Object)
], SessionController.prototype, "getCaseList", null);
__decorate([
    (0, common_1.Get)('transcriptfiles'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_24 = typeof session_interface_1.TranscriptFileReq !== "undefined" && session_interface_1.TranscriptFileReq) === "function" ? _24 : Object]),
    __metadata("design:returntype", typeof (_25 = typeof Promise !== "undefined" && Promise) === "function" ? _25 : Object)
], SessionController.prototype, "getTranscriptfiles", null);
__decorate([
    (0, common_1.Get)('casedetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_26 = typeof session_interface_1.caseDetailSEC !== "undefined" && session_interface_1.caseDetailSEC) === "function" ? _26 : Object]),
    __metadata("design:returntype", typeof (_27 = typeof Promise !== "undefined" && Promise) === "function" ? _27 : Object)
], SessionController.prototype, "getCaseDetail", null);
__decorate([
    (0, common_1.Get)('sectiondetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_28 = typeof session_interface_1.sectionDetailSEC !== "undefined" && session_interface_1.sectionDetailSEC) === "function" ? _28 : Object]),
    __metadata("design:returntype", typeof (_29 = typeof Promise !== "undefined" && Promise) === "function" ? _29 : Object)
], SessionController.prototype, "getSectionDetail", null);
__decorate([
    (0, common_1.Get)('bundle'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_30 = typeof session_interface_1.bundleDetailSEC !== "undefined" && session_interface_1.bundleDetailSEC) === "function" ? _30 : Object]),
    __metadata("design:returntype", typeof (_31 = typeof Promise !== "undefined" && Promise) === "function" ? _31 : Object)
], SessionController.prototype, "getBundleList", null);
__decorate([
    (0, common_1.Post)('checkduplicacy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_32 = typeof session_interface_1.checkDuplicacySEC !== "undefined" && session_interface_1.checkDuplicacySEC) === "function" ? _32 : Object]),
    __metadata("design:returntype", typeof (_33 = typeof Promise !== "undefined" && Promise) === "function" ? _33 : Object)
], SessionController.prototype, "teamdelete", null);
__decorate([
    (0, common_1.Post)('publishfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_34 = typeof session_interface_1.publishSEC !== "undefined" && session_interface_1.publishSEC) === "function" ? _34 : Object]),
    __metadata("design:returntype", typeof (_35 = typeof Promise !== "undefined" && Promise) === "function" ? _35 : Object)
], SessionController.prototype, "publishFile", null);
__decorate([
    (0, common_1.Get)('realtimedatabysesid'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_36 = typeof session_interface_1.userSesionData !== "undefined" && session_interface_1.userSesionData) === "function" ? _36 : Object]),
    __metadata("design:returntype", typeof (_37 = typeof Promise !== "undefined" && Promise) === "function" ? _37 : Object)
], SessionController.prototype, "getRealtimeSessionData", null);
__decorate([
    (0, common_1.Post)('updatetranscriptstatus'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_38 = typeof session_interface_1.updateTransStatusMDL !== "undefined" && session_interface_1.updateTransStatusMDL) === "function" ? _38 : Object]),
    __metadata("design:returntype", typeof (_39 = typeof Promise !== "undefined" && Promise) === "function" ? _39 : Object)
], SessionController.prototype, "updateTranscriptStatus", null);
__decorate([
    (0, common_1.Get)('docinfobytab'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_40 = typeof session_interface_1.DocInfoReq !== "undefined" && session_interface_1.DocInfoReq) === "function" ? _40 : Object]),
    __metadata("design:returntype", typeof (_41 = typeof Promise !== "undefined" && Promise) === "function" ? _41 : Object)
], SessionController.prototype, "getDocInfobyTab", null);
__decorate([
    (0, common_1.Post)('synssessions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_42 = typeof session_interface_1.synsSessionsMDL !== "undefined" && session_interface_1.synsSessionsMDL) === "function" ? _42 : Object]),
    __metadata("design:returntype", typeof (_43 = typeof Promise !== "undefined" && Promise) === "function" ? _43 : Object)
], SessionController.prototype, "syncSessions", null);
__decorate([
    (0, common_1.Post)('syncfeeddata'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_44 = typeof Promise !== "undefined" && Promise) === "function" ? _44 : Object)
], SessionController.prototype, "syncfeeddata", null);
__decorate([
    (0, common_1.Post)('getallusers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_45 = typeof Promise !== "undefined" && Promise) === "function" ? _45 : Object)
], SessionController.prototype, "getallusers", null);
__decorate([
    (0, common_1.Get)('synctranscriptfile'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_46 = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _46 : Object]),
    __metadata("design:returntype", void 0)
], SessionController.prototype, "getFile", null);
__decorate([
    (0, common_1.Post)('log/join'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_47 = typeof session_interface_1.logJoinReq !== "undefined" && session_interface_1.logJoinReq) === "function" ? _47 : Object]),
    __metadata("design:returntype", typeof (_48 = typeof Promise !== "undefined" && Promise) === "function" ? _48 : Object)
], SessionController.prototype, "joiningLog", null);
__decorate([
    (0, common_1.Get)('rt/logs/session'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_49 = typeof session_interface_1.RTLogsReq !== "undefined" && session_interface_1.RTLogsReq) === "function" ? _49 : Object]),
    __metadata("design:returntype", typeof (_50 = typeof Promise !== "undefined" && Promise) === "function" ? _50 : Object)
], SessionController.prototype, "getRTSessions", null);
__decorate([
    (0, common_1.Get)('rt/logs/session/users'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_51 = typeof session_interface_1.RTLogsSessionUserReq !== "undefined" && session_interface_1.RTLogsSessionUserReq) === "function" ? _51 : Object]),
    __metadata("design:returntype", typeof (_52 = typeof Promise !== "undefined" && Promise) === "function" ? _52 : Object)
], SessionController.prototype, "getSessionUsers", null);
__decorate([
    (0, common_1.Get)('rt/logs'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_53 = typeof session_interface_1.RTLogsUserLGReq !== "undefined" && session_interface_1.RTLogsUserLGReq) === "function" ? _53 : Object]),
    __metadata("design:returntype", typeof (_54 = typeof Promise !== "undefined" && Promise) === "function" ? _54 : Object)
], SessionController.prototype, "getRtLogs", null);
__decorate([
    (0, common_1.Post)('rt/logs/export'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_55 = typeof session_interface_1.RTLogsReq !== "undefined" && session_interface_1.RTLogsReq) === "function" ? _55 : Object]),
    __metadata("design:returntype", typeof (_56 = typeof Promise !== "undefined" && Promise) === "function" ? _56 : Object)
], SessionController.prototype, "export", null);
__decorate([
    (0, common_1.Get)('filedata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_57 = typeof session_interface_1.filedataReq !== "undefined" && session_interface_1.filedataReq) === "function" ? _57 : Object]),
    __metadata("design:returntype", typeof (_58 = typeof Promise !== "undefined" && Promise) === "function" ? _58 : Object)
], SessionController.prototype, "getFiledata", null);
__decorate([
    (0, common_1.Get)('getDocinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_59 = typeof session_interface_1.DocinfoReq !== "undefined" && session_interface_1.DocinfoReq) === "function" ? _59 : Object]),
    __metadata("design:returntype", typeof (_60 = typeof Promise !== "undefined" && Promise) === "function" ? _60 : Object)
], SessionController.prototype, "getDocinfo", null);
__decorate([
    (0, common_1.Get)('activesession'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_61 = typeof session_interface_1.ActiveSessionReq !== "undefined" && session_interface_1.ActiveSessionReq) === "function" ? _61 : Object]),
    __metadata("design:returntype", typeof (_62 = typeof Promise !== "undefined" && Promise) === "function" ? _62 : Object)
], SessionController.prototype, "getActiveSession", null);
__decorate([
    (0, common_1.Get)('activesession/detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_63 = typeof session_interface_1.ActiveSessionDetailReq !== "undefined" && session_interface_1.ActiveSessionDetailReq) === "function" ? _63 : Object]),
    __metadata("design:returntype", typeof (_64 = typeof Promise !== "undefined" && Promise) === "function" ? _64 : Object)
], SessionController.prototype, "getActiveSessionDetail", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('session'),
    (0, common_1.Controller)('session'),
    __metadata("design:paramtypes", [typeof (_a = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _a : Object, typeof (_b = typeof fileprovider_service_1.FileproviderService !== "undefined" && fileprovider_service_1.FileproviderService) === "function" ? _b : Object])
], SessionController);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 12 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
const date_time_service_1 = __webpack_require__(13);
const scheduler_service_1 = __webpack_require__(15);
const firebase_service_1 = __webpack_require__(18);
const socket_io_1 = __webpack_require__(20);
const users_service_1 = __webpack_require__(22);
const fs_1 = __webpack_require__(23);
const path = __webpack_require__(24);
const fs = __webpack_require__(23);
const fs_2 = __webpack_require__(23);
const util_1 = __webpack_require__(25);
const config_1 = __webpack_require__(6);
const issue_service_1 = __webpack_require__(26);
const annot_transfer_service_1 = __webpack_require__(46);
const ExcelJS = __webpack_require__(47);
const feed_data_service_1 = __webpack_require__(37);
let SessionService = class SessionService {
    constructor(db, dateTimeService, annotTransfer, ios, schedulerService, firebaseService, user, config, issueService, feedData) {
        this.db = db;
        this.dateTimeService = dateTimeService;
        this.annotTransfer = annotTransfer;
        this.ios = ios;
        this.schedulerService = schedulerService;
        this.firebaseService = firebaseService;
        this.user = user;
        this.config = config;
        this.issueService = issueService;
        this.feedData = feedData;
        this.tempFilePath = './assets/export-excel';
        this.readFileAsync = (0, util_1.promisify)(fs.readFile);
        this.realtimeSchema = 'realtime';
    }
    async onApplicationBootstrap() {
        let res = await this.db.executeRef('realtime_upcomming_sessions', {});
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSessions(body) {
        let res = await this.db.executeRef('realtime_sessionlist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSessiondata(body) {
        let res = await this.db.executeRef('realtime_sessiondata', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSessiondataV2(body) {
        debugger;
        let res = await this.db.executeRef('realtime_sessiondata', body);
        if (res.success) {
            try {
                if (res.data[0].length) {
                    const obj = await this.getFilesCount(body.nSesid, res.data[0][0]?.isTrans);
                    res.data[0][0] = { ...res.data[0][0], maxNumber: obj.maxNumber, pageRes: obj.pageRes };
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getFilesCount(nSesid, isTrans) {
        try {
            if (!nSesid) {
                return { pageRes: null, maxNumber: 0 };
            }
            if (isTrans === true) {
                try {
                    const transcriptPath = path.join(this.config.get('REALTIME_PATH') || '', `s_${nSesid}.json`);
                    const raw = await fs_1.promises.readFile(transcriptPath, 'utf8');
                    const pages = JSON.parse(raw);
                    if (Array.isArray(pages) && pages.length > 0) {
                        const maxNumber = pages.length;
                        const lastPage = pages[maxNumber - 1];
                        console.log(`Published transcript page count: ${maxNumber} for session ${nSesid}`);
                        return { maxNumber, pageRes: lastPage };
                    }
                }
                catch (err) {
                    console.warn(`Published transcript not found for ${nSesid}, falling back to draft folder`);
                }
            }
            const folderPath = `data/dt_${nSesid}`;
            const files = await fs_1.promises.readdir(folderPath);
            const maxNumber = files.reduce((max, file) => {
                const num = parseInt(file.replace(/\D+/g, ''), 10);
                return num > max ? num : max;
            }, 0);
            const filePath = path.join(folderPath, `page_${maxNumber}.json`);
            const pageRes = await this.processFile(filePath);
            console.log(`The maximum folder number is: ${maxNumber}`);
            return { maxNumber, pageRes };
        }
        catch (error) {
            console.error(`Error reading directory: ${error.message}`);
        }
        return { pageRes: null, maxNumber: 0 };
    }
    async processFile(filePath) {
        const data = await fs_1.promises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }
    async getSessionByCaseId(body) {
        let res = await this.db.executeRef('realtime_combo_sessionlist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch realtime_combo_sessionlist', error: res.error };
        }
    }
    async getlivesessionbycaseid(body) {
        let res = await this.db.executeRef('realtime_livesession_bycaseid', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch realtime_combo_sessionlist', error: res.error };
        }
    }
    async getAssignedusers(body) {
        let res = await this.db.executeRef('realtime_assignedusers', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sessionBuilder(body) {
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {
            try {
                if (res.data[0][0]["dDate"]) {
                    this.sessionSchedular(res.data[0][0]);
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sessionDelete(body) {
        body.permission = 'D';
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {
            try {
                this.schedulerService.cancelJob(res.data[0][0].nSesid);
                this.schedulerService.cancelJob(`END_${res.data[0][0].nSesid}`);
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sessionEnd(body) {
        body.permission = 'C';
        let res = await this.db.executeRef('realtime_insertupdate_session', body);
        if (res.success) {
            try {
                this.schedulerService.cancelJob(res.data[0][0].nSesid);
                this.schedulerService.cancelJob(`END_${res.data[0][0].nSesid}`);
            }
            catch (error) {
            }
            this.feedData.sessionEnd(body.nSesid);
            try {
                this.ios["server"].emit('on-notification', { msg: 1, nSesid: res.data[0][0]["nSesid"], nCaseid: res.data[0][0]["nCaseid"], cStatus: 'E' });
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sessionStart(body) {
        try {
            this.ios["server"].emit('on-notification', { msg: 1, nSesid: body.nSesid, nCaseid: body.nCaseid, cStatus: 'R' });
        }
        catch (error) {
        }
        return { msg: 1, value: 'Notified' };
    }
    async setServer(body) {
        let res = await this.db.executeRef('realtime_setserver', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async setSchedular(mdl) {
    }
    async getServers(body) {
        let res = await this.db.executeRef('realtime_serverslist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async serverBuilder(body) {
        let res = await this.db.executeRef('realtime_insertupdate_servers', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async postCreateUsers(body) {
        let res = await this.db.executeRef('insert_rtusers', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch insert_rtusers', error: res.error };
        }
    }
    async getTeamusers(body) {
        let res = await this.db.executeRef('realtime_userlist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSearchUsers(body) {
        let res = await this.db.executeRef('realtime_users_search', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async assignMent(body) {
        let res = await this.db.executeRef('realtime_assignment', body);
        if (res.success) {
            console.log('ASSIGNED', res);
            this.sessionSchedular(res.data[0][0]);
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    sessionSchedular(mdl) {
        try {
            if (mdl.nSesid) {
                this.schedulerService.cancelJob(mdl.nSesid);
                this.schedulerService.cancelJob(`END_${mdl.nSesid}`);
                const jobId = this.schedulerService.scheduleTask(mdl.nSesid, mdl.dDate, async () => {
                    try {
                        console.log('Checking running session');
                        this.checkrunningSessions({ nSesid: mdl.nSesid });
                    }
                    catch (error) {
                    }
                });
                const job2Id = this.schedulerService.scheduleTask(`END_${mdl.nSesid}`, mdl.dEnddt, async () => {
                    try {
                        console.log('Ending session');
                        this.sessionEnd({ nSesid: mdl.nSesid, permission: 'C' });
                    }
                    catch (error) {
                    }
                });
            }
        }
        catch (error) {
        }
    }
    async getTodaySessions(body) {
        console.log('\n\n\n\n getTodaySessions realtime_todays_sessions', body);
        let res = await this.db.executeRef('realtime_todays_sessions', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getTodayServers(body) {
        let res = await this.db.executeRef('realtime_connection_servers', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async insertConnectivityLog(body) {
        let res = await this.db.executeRef('realtime_insertupdate_rtconnectivitylogs', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async deleteConnectivityLog(body) {
        let res = await this.db.executeRef('realtime_insertupdate_rtconnectivitylogs', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async checkrunningSessions(body) {
        let res = await this.db.executeRef('realtime_update_running_session', body);
        if (res.success) {
            try {
                this.ios["server"].emit('on-notification', { msg: 1, nSesid: res.data[0][0]["nSesid"] });
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getConnectivityLog(body) {
        let res = await this.db.executeRef('realtime_get_connectivityLogs', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async setNotifcation(data) {
        try {
            let res = await this.db.executeRef('realtime_notification_users', { nSesid: data[0].nSesid });
            if (res.data[0].length > 0) {
                for (let x of res.data[0]) {
                    x.isRealtime = true;
                    this.firebaseService.emit(x);
                }
            }
        }
        catch (error) {
        }
    }
    async getCaseList(body) {
        let res = await this.db.executeRef('realtime_caselist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getTranscriptfiles(body) {
        let res = await this.db.executeRef('realtime_transcriptfiles', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async caseDetail(query) {
        let res = await this.db.executeRef('upload_getcasedetail', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async sectionDetail(query) {
        let res = await this.db.executeRef('upload_getsectiondetail', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async bundleDetail(query) {
        let res = await this.db.executeRef('upload_getbundledetail', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async checkForDuplicate(body) {
        let res = await this.db.executeRef('upload_checkduplicacy', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async publishFile(body) {
        let res = await this.db.executeRef('upload_filestatus', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async emitMsg(value) {
        let User = await this.user.getUserSocket(value.data.nMasterid);
        if (User) {
            console.log('Sending message to user', User, value);
            this.ios["server"].to(User).emit("upload-messages", value);
        }
        else {
            console.log('Enable to send user not found', value);
        }
    }
    async readJsonFromFile(filePath) {
        try {
            const fileContent = await this.readFileAsync(filePath, 'utf8');
            return JSON.parse(fileContent);
        }
        catch (error) {
            return null;
        }
    }
    async getRealtimeSessionData(mdl) {
        debugger;
        const path = `${this.config.get('REALTIME_PATH')}s_${mdl.nSesid}.json`;
        try {
            if (!fs.existsSync(path)) {
                return { msg: -1 };
            }
            const data = await this.readJsonFromFile(path);
            if (data.length) {
                const annotations = await this.issueService.getAnnotationOfPages({ nSessionid: mdl.nSesid, nUserid: mdl.nUserid, nCaseid: mdl.nCaseid, cTranscript: 'A' });
                debugger;
                try {
                    const issuedetails = annotations[0] || [];
                    const hyperlinks = annotations[1] || [];
                    const finalIssueDetail = [];
                    try {
                        for (let x of issuedetails) {
                            if (x.cordinates && x.cordinates.length) {
                                const obj = { ...x };
                                const pages = [...new Set(x.cordinates.map(a => a.p) || [])];
                                for (let p of pages) {
                                    const cordinates = x.cordinates.filter(a => a.p == p);
                                    obj.pageIndex = p;
                                    obj.cordinates = cordinates;
                                    finalIssueDetail.push({ ...obj });
                                }
                            }
                        }
                    }
                    catch (error) {
                    }
                    if (finalIssueDetail?.length || hyperlinks?.length) {
                        for (let x of data) {
                            x.hyperlinks = [];
                            x.annotations = [];
                            if (finalIssueDetail.length) {
                                x.annotations.push(...finalIssueDetail.filter(a => a.pageIndex == x.page));
                            }
                            if (hyperlinks.length) {
                                x.hyperlinks.push(...hyperlinks.filter(a => a.cPageno == x.page));
                            }
                        }
                    }
                }
                catch (error) {
                }
            }
            return { msg: 1, data };
        }
        catch (error) {
        }
        return { msg: -1 };
    }
    async updateTranscriptStatus(body) {
        if (body.cFlag == 'P') {
            console.log('Starting transfer', body);
            try {
                const filePath = `${this.config.get('ASSETS')}doc/case${body.nCaseid}/s_${body.nSesid}.TXT`;
                if (!fs.existsSync(filePath)) {
                    return { msg: -1, value: 'File Not found', filePath: filePath };
                }
                const resolvedPath = path.resolve(this.config.get('ANNOT_TRANSFER_DIR'));
                if (!fs.existsSync(resolvedPath)) {
                    fs.mkdirSync(resolvedPath, { recursive: true });
                }
                const resolvedPath2 = path.resolve(this.config.get('REALTIME_PATH'));
                if (!fs.existsSync(resolvedPath2)) {
                    fs.mkdirSync(resolvedPath2, { recursive: true });
                }
                await this.annotTransfer.startTransfer(body.nSesid, filePath, body.cProtocol);
            }
            catch (error) {
                console.log('Error-', error);
                return { msg: -1, value: 'File Not found', error: error };
            }
        }
        let res = await this.db.executeRef('realtime_transcript_upload_status', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getDocInfobyTab(query) {
        let res = await this.db.executeRef('realtime_docinfo_by_tab', query);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async syncSessionData(query) {
        let res = await this.db.executeRef('realtime_sync_sessions', query);
        if (res.success) {
            try {
                const listOfSessions = res.data[0][0]["jUpdatedSessions"] || [];
                if (listOfSessions && listOfSessions.length) {
                    for (let x of listOfSessions) {
                        if (x.cRStatus == 'C') {
                            console.log('SESSION COMPLETE ');
                            this.feedData.sessionEnd(x.nSesid);
                            try {
                                this.schedulerService.cancelJob(x.nSesid);
                                this.schedulerService.cancelJob(`END_${x.nSesid}`);
                            }
                            catch (error) {
                            }
                            try {
                                this.ios["server"].emit('on-notification', { msg: 1, nSesid: x.nSesid, cStatus: 'E' });
                            }
                            catch (error) {
                            }
                        }
                        else {
                            this.sessionSchedular(x);
                        }
                    }
                }
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getallusers(query) {
        let res = await this.db.executeRef('realtime_sync_allusers', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async syncFeedData(body) {
        try {
            if (body.nSesid) {
                const folderPath = `data/dt_${body.nSesid}`;
                await fs_2.promises.mkdir(folderPath, { recursive: true });
                const data = body.jData || [];
                for (const [fileName, fileData] of data) {
                    if (fileName.endsWith('.json')) {
                        const filePath = path.join(folderPath, fileName);
                        const fileContent = JSON.stringify(fileData, null, 2);
                        await fs_2.promises.writeFile(filePath, fileContent, 'utf-8');
                    }
                }
                console.log('Files written successfully');
            }
        }
        catch (error) {
            console.log('Error', error);
        }
        return { msg: 1, value: 'Success' };
    }
    async joiningLog(body) {
        let res = await this.db.executeRef('realtime_insertlog', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch insert_rtusers', error: res.error };
        }
    }
    async getRtsessions(body) {
        let res = await this.db.executeRef('realtime_sessions_bycaseid', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error };
        }
    }
    async getRTSessionUsers(body) {
        let res = await this.db.executeRef('realtime_sessions_users_bycaseid', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error };
        }
    }
    async getRTlogs(body) {
        let res = await this.db.executeRef('realtime_logs_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch ', error: res.error };
        }
    }
    async exportLogExcel(body) {
        let res = await this.db.executeRef('realtime_export_logs', body);
        if (res.success) {
            const ExportData = res.data[0] || [];
            if (ExportData?.length) {
                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet('Data');
                let Columns = [];
                Object.keys(ExportData[0]).forEach((key, index) => {
                    Columns.push({ header: key, key: key, width: key == 'File name' ? 40 : 20 });
                });
                worksheet.columns = Columns;
                worksheet.addRows(ExportData);
                const filePath = path.resolve(this.tempFilePath, `case${body.nCaseid}/logs-report.xlsx`);
                const exportFilePath = `export-excel/case${body.nCaseid}/logs-report.xlsx`;
                if (!fs.existsSync(path.dirname(filePath))) {
                    fs.mkdirSync(path.dirname(filePath), { recursive: true });
                }
                await workbook.xlsx.writeFile(filePath);
                return { msg: 1, value: 'Exported', path: exportFilePath };
            }
            return { msg: -1, value: 'Log not found for export' };
        }
        else {
            return { msg: -1, value: 'Failed to export ', error: res.error };
        }
    }
    async getFiledata(body) {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getDocinfo(query) {
        let res = await this.db.executeRef('individual_doc_info', query);
        if (res.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getActiveSession(query) {
        let res = await this.db.executeRef('realtime_get_active_session', query, this.realtimeSchema);
        if (res.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getActiveSessionDetail(query) {
        const res = await this.db.executeRef('realtime_sessiondata', query, this.realtimeSchema);
        if (res.success) {
            try {
                if (res.data[0].length) {
                    const obj = await this.getFilesCount(res.data[0][0].nSesid, res.data[0][0]?.isTrans);
                    res.data[0][0] = { ...res.data[0][0], maxNumber: obj.maxNumber, pageRes: obj.pageRes };
                }
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _b : Object, typeof (_c = typeof annot_transfer_service_1.AnnotTransferService !== "undefined" && annot_transfer_service_1.AnnotTransferService) === "function" ? _c : Object, typeof (_d = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _d : Object, typeof (_e = typeof scheduler_service_1.SchedulerService !== "undefined" && scheduler_service_1.SchedulerService) === "function" ? _e : Object, typeof (_f = typeof firebase_service_1.FirebaseService !== "undefined" && firebase_service_1.FirebaseService) === "function" ? _f : Object, typeof (_g = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _g : Object, typeof (_h = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _h : Object, typeof (_j = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _j : Object, typeof (_k = typeof feed_data_service_1.FeedDataService !== "undefined" && feed_data_service_1.FeedDataService) === "function" ? _k : Object])
], SessionService);


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
exports.DateTimeService = void 0;
const common_1 = __webpack_require__(3);
const moment = __webpack_require__(14);
let DateTimeService = class DateTimeService {
    getCurrentTime() {
        return moment().format();
    }
    getTimeInTimezone(timezone) {
        return moment().tz(timezone).format();
    }
    formatTimeInTimezone(time, timezone, format = 'YYYY-MM-DD HH:mm:ss Z') {
        return moment(time).tz(timezone).format(format);
    }
    getCurrentTimeForBrowser(defaultTimezone = 'UTC') {
        const guessedTimezone = moment.tz.guess(true) || defaultTimezone;
        return this.getTimeInTimezone(guessedTimezone);
    }
};
exports.DateTimeService = DateTimeService;
exports.DateTimeService = DateTimeService = __decorate([
    (0, common_1.Injectable)()
], DateTimeService);


/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("moment-timezone");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FirebaseService = void 0;
const db_service_1 = __webpack_require__(8);
const scheduler_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const admin = __webpack_require__(19);
const socket_io_1 = __webpack_require__(20);
class notificationRes {
}
const serviceAccount = __webpack_require__(21);
let FirebaseService = class FirebaseService {
    constructor(db, ios, schedulerService) {
        this.db = db;
        this.ios = ios;
        this.schedulerService = schedulerService;
        this.notificationList = [];
        this.firebaseEnabled = false;
        console.log('\n\r\n\rFIrebase Service Initiated');
        try {
            if (serviceAccount &&
                typeof serviceAccount.private_key === 'string' &&
                serviceAccount.private_key.includes('-----BEGIN PRIVATE KEY-----')) {
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    databaseURL: "https://etabella-fcm.firebaseio.com",
                });
                this.firebaseEnabled = true;
                console.log('Firebase initialized.');
            }
            else {
                this.firebaseEnabled = false;
                console.warn('Firebase not initialized: missing or invalid `private_key` in etabella-firebase.json.');
            }
        }
        catch (err) {
            this.firebaseEnabled = false;
            console.error('Firebase initialization failed:', err && err.message ? err.message : err);
        }
    }
    async onApplicationBootstrap() {
        try {
            let res = await this.db.executeRef('realtime_notification_pending', {});
            if (res.data[0].length) {
                for (let x of res.data[0]) {
                    this.emit(x);
                }
            }
        }
        catch (error) {
        }
    }
    async emit(x) {
        if (x.isScheduled) {
            this.setSchedular(x);
        }
        else {
            this.fireNotification(x);
        }
    }
    async setSchedular(mdl) {
        const jobId = this.schedulerService.scheduleTask(mdl.nNTid, mdl.dDate, async () => {
            if (mdl.isRealtime) {
            }
            this.fireNotification(mdl);
        });
    }
    async fireNotification(x) {
        let res = await this.sendNotification(x.nNTid, x.title, x.message, x.cToken, x.cAction);
        this.updateNotificationToServer(res);
    }
    async updateNotificationToServer(x) {
        if (x)
            await this.db.executeRef('realtime_notification_status_update', { nNTid: x.nNTid, nMsg: x.msg });
    }
    async sendNotification(nNTid, title, message, tokenkey, action) {
        console.log('Notification to ', title, message, tokenkey, action);
        if (!tokenkey) {
            return { msg: -1, res: 'Token not found', nNTid: nNTid };
        }
        if (!this.firebaseEnabled) {
            console.warn('Skipping sendNotification because Firebase is not initialized.');
            return { msg: -1, res: 'Firebase not initialized', nNTid: nNTid };
        }
        const messagePayload = {
            notification: {
                title: title,
                body: message,
            },
            token: tokenkey,
            android: {
                priority: "high",
                ttl: 60 * 60 * 24 * 1000,
            },
            apns: {
                headers: {
                    'apns-priority': '10',
                },
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
            data: {
                link: action || 'https://etabella.legal',
            },
        };
        try {
            console.log('\n\r\n\rNOTIFICATION SEND', message, tokenkey);
            const response = await admin.messaging().send(messagePayload);
            console.log("Successfully sent message:", response);
            return { msg: 1, res: response, nNTid: nNTid };
        }
        catch (error) {
            console.error("Error sending message:", error);
            return { msg: -1, res: error, nNTid: nNTid };
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _b : Object, typeof (_c = typeof scheduler_service_1.SchedulerService !== "undefined" && scheduler_service_1.SchedulerService) === "function" ? _c : Object])
], FirebaseService);


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("firebase-admin");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("socket.io");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"type":"service_account","project_id":"etabellav2","private_key_id":"b9ff3d2f1c66e17174e92a51222794cbecfa705e","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCSBEn9bSjn2o00\\nR7MrNytrduxEQM+WknEBrOZRvZehj2SfQdRDdt3E9QAzbwz4jbXctPxeAVpMIX7o\\nZ3DQ27FT/szANS5bcbchxqLZ11Ks1D9RLB9TyTn+mGdVl9IkLuLzirLN4YgOqKCF\\ny6vBB3uj1LB0R+SSvmP9d2mYXMHkMHVeRhZjRQZhUKMx1Yb7EXWti5FSJSUit2e6\\n3goSu60SNY8KO+PW3cE/buJIXCtCoU21i4xC/cxCjF0RVAotmhtSOXizeuRV3EBd\\ni+CR5Ldqe3bOBOqgjGwtr0jzlJ9zS21HBGl3iNloriaJD1c7J9bwFKPkeqhDPYb1\\n/7t7/J+hAgMBAAECggEAF/ScLve5vlAc2nbo7i4e8YKRQKFhbVKZN60mHEL+nYLo\\n/zfNm0PlHmsTnVyaxCx7qboHrWSLa/IS4A4YdCuW7DDhZqdS8620XdY44YRyC+jG\\neorCmPxqh1p5mZFO6KDImywmKaDWsZD4xPqlMwYHQtmiGXGyDmEuBmeQ625MYSNS\\nrFUcSnvhYFo5IoSZves4/VnbdIFLIZNHtvlGJFI+Pe1DtHM2Kh/BGsgWoJHOCGRK\\nKPSW0b2INWMt7mOM4hC1YHXw46bAwnr9yGF0h3aSSFvg0B5ljUcQN0SWvxmWcitX\\nhRI2fx0wzZJ7dGaM3TcBihxs8GNxA+CfJMfW2mzgAQKBgQDDxNXVelSHX6jFnTtS\\nzFZE7ScVD4RbYzaEPdKsoCgWECzWpBV4RZGoofsIBJXRw+Y+Am2XWJu20CoyB52o\\nTu8bGiZ1zPn85QajKOJmbEvNT4YBnGC5LM/mmAw4PH31wU2YJGOhyyEZQWCGNAda\\nw6lyRalHlpnhsDFOVBUjv/EgXQKBgQC+8N9JTO9zqudCOsBjXFPJsLSoG9ktfUFt\\n6TYZsf71GWEP+i0GTDQ1spEnAs/oHAI9GT32SeYJkVm1SUvUBZUcAC+M9S3AXSBG\\nRK4fRJI0zCU9SgqIyw4a9SRBY6bpalR1gaJoyOOP5bOBsSyHCzYKu/3b/8YTWj8y\\naJt1ZRlYFQKBgGCFU8iFH9f+2f9UnkMcbAxfwL0pgWBtchuRP6XM8Pav0uugytUZ\\nt88kzdgOKq/ZnlNEbzQHg/6Gc8dm6dxpzonWQtAh179QTA11wuosytLXOoLgzu99\\noKNYo+22JYRdYhx5FIZY2GDTUvvX+yhM/+ZPYj7hic00SZsM6b9Oi1whAoGAG3ck\\ndzPE4dt8hm9TCzfVqZZsdh4DYGK7DadVK98JsJHk/1paLaS6gdrcvELQSy/0Nnuy\\nCQJaP5gT0lrnuGjRKQTx0hHWcewzX0gzz7WaXlPbK3TCDSlALyqB+5HtCXhNC9YI\\n2Y/EBAfjiU1F/WrkbCjcfE/PWytJGeQoMHvJaH0CgYAacl+t1NUVv3bdg4hs4yd6\\nSrZODO5Kp5iahvi1KbQGvQ9QbfrB/4vZifJqMQ4d69dQv7xRJWHNhpZWQ2Vag0RN\\nKVR3JuV0tTqAaazIAMOJrK8Kd1gp8e7+Bii4l1cgrpJ3EUHtpbxg3nkYgC5EaaKm\\noW7w+59/hOx046oxfRW8wg==\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-azhbe@etabellav2.iam.gserviceaccount.com","client_id":"108856209193053976076","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-azhbe%40etabellav2.iam.gserviceaccount.com","universe_domain":"googleapis.com"}');

/***/ }),
/* 22 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UsersService = void 0;
const common_1 = __webpack_require__(3);
let UsersService = class UsersService {
    constructor() {
        this.userConnections = new Map();
    }
    async setUser(nUserid, obj) {
        if (nUserid) {
            this.userConnections.set(nUserid.toString(), obj);
        }
    }
    async getUser(nUserid) {
        if (nUserid) {
            return this.userConnections.get(nUserid.toString());
        }
        else {
            console.log('User not found');
            return null;
        }
    }
    async getUserSocket(nUserid) {
        if (nUserid) {
            let urs = this.userConnections.get(nUserid.toString());
            return urs ? urs.socketId : null;
        }
        else {
            console.log('User not found');
            return null;
        }
    }
    async removeUser(nUserid) {
        this.userConnections.delete(nUserid.toString());
    }
    async getEntries() {
        return this.userConnections.entries();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);


/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("util");

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
exports.IssueService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
const export_service_1 = __webpack_require__(27);
let IssueService = class IssueService {
    constructor(db, exportService) {
        this.db = db;
        this.exportService = exportService;
        this.realTimeSchema = 'realtime';
    }
    async getIssueCategory(body) {
        let res = await this.db.executeRef('realtime_issuecategory', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getIssueList(body) {
        const res = await this.db.executeRef('realtime_issuelist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
        }
    }
    async getIssueListGroup(body) {
        body['ref'] = 2;
        const res = await this.db.executeRef('realtime_issuelist_group', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
        }
    }
    async handleIssue(body, permission) {
        const parameter = {
            ...body,
            cPermission: permission,
        };
        const res = await this.db.executeRef('realtime_handle_issue_master', parameter);
        if (res.success) {
            const issue = res.data[0];
            return issue;
        }
        else {
            return { msg: -1, value: 'Failed to handle issue', error: res.error };
        }
    }
    async handleIssueCategory(body, permission) {
        const parameter = { ...body, cICtype: permission };
        const res = await this.db.executeRef('realtime_handle_issue_category', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue category',
                error: res.error,
            };
        }
    }
    async deleteIssueCategory(param) {
        const parameter = { ...param, cICtype: 'D' };
        console.log('deleteIssueCategory', parameter);
        const res = await this.db.executeRef('realtime_handle_issue_category', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to delete issue category',
                error: res.error,
            };
        }
    }
    async executeIssueDetailOperation(body, permission) {
        const parameter = permission === 'D'
            ? {
                nIDid: body.nIDid,
                cPermission: permission,
            }
            : { ...body, cPermission: permission };
        const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue detail',
                error: res.error,
            };
        }
    }
    async insertHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue highlights',
                error: res.error,
            };
        }
    }
    async removemultihighlights(body) {
        const res = await this.db.executeRef('realtime_delete_multiple_rhighlights', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue highlights',
                error: res.error,
            };
        }
    }
    async deleteHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue highlights',
                error: res.error,
            };
        }
    }
    async GetHighlightLists(body) {
        const res = await this.db.executeRef('realtime_get_highlightlist', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
        }
    }
    async getIssueDetails(param) {
        const res = await this.db.executeRef('realtime_get_issue_details', param);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch issue details',
                error: res.error,
            };
        }
    }
    async getIssueDetailsAnnot(param) {
        const res = await this.db.executeRef(`realtime_get_issue_annot`, param);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch grouped issue details',
                error: res.error,
            };
        }
    }
    async getIssueDetailby_issue_id(body) {
        const params = { ...body, ref: 2 };
        const res = await this.db.executeRef('realtime_issuedetail_by_issueid', params);
        if (res.success) {
            return res.data;
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch getIssueDetailby_issue_id',
                error: res.error,
            };
        }
    }
    async getIssueAnnotationList(body) {
        const res = await this.db.executeRef('realtime_get_issue_annotation_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch realtime_get_issue_annotation_list',
                error: res.error,
            };
        }
    }
    async getIssueDetailById(body) {
        const res = await this.db.executeRef('realtime_get_issuedetail_by_id', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch realtime_get_issuedetail_by_id',
                error: res.error,
            };
        }
    }
    async getAnnotationOfPages(body) {
        body['ref'] = 2;
        console.log('\n\n\n\n\n\n', 'realtime_get_issue_annotation_highlight', '\n', body, '\n\n\n\n\n\n');
        const res = await this.db.executeRef('realtime_get_issue_annotation_highlight', body);
        if (res.success) {
            return res.data;
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch realtime_get_issue_annotation_highlight',
                error: res.error,
            };
        }
    }
    async getcCodeMaster(body) {
        let res = await this.db.executeRef('combo_codemaster', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async updateHighlightIssueIds(body) {
        const res = await this.db.executeRef('realtime_update_default_h_issue', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle realtime_update_default_h_issue',
                error: res.error,
            };
        }
    }
    async FilterLastSelecedIssued(body) {
        const res = await this.db.executeRef('realtime_filter_last_issue', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle realtime_filter_last_issue',
                error: res.error,
            };
        }
    }
    async getAnnotHighlightExport(query) {
        query['ref'] = 2;
        const res = await this.db.executeRef('realtime_get_issue_annotation_highlight_export', query);
        if (res.success) {
            const data = await this.exportService.exportFile(query, res.data);
            return data;
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle realtime_filter_last_issue',
                error: res.error,
            };
        }
    }
    async deleteDemoIssueDetails(param) {
        const res = await this.db.executeRef('realtime_demo_issues_delete', param);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to delete issue category',
                error: res.error,
            };
        }
    }
    async updateIssueDetail(param) {
        const res = await this.db.executeRef('realtime_defaultvalueupdate', param);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to delete issue category',
                error: res.error,
            };
        }
    }
    async updateIssueDetailNote(param) {
        const res = await this.db.executeRef('realtime_issue_detail_note', param);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to delete issue category',
                error: res.error,
            };
        }
    }
    async getIssueDetail(body) {
        try {
            const params = { ...body, ref: 2 };
            const res = await this.db.executeRef('annotations', params, 'realtime');
            if (res.success) {
                return { ref1: res.data[0], ref2: res.data[1] };
            }
            else {
                return {
                    msg: -1,
                    value: 'Failed to fetch getIssueDetailby_issue_id',
                    error: res.error,
                };
            }
        }
        catch (error) {
            console.error('Failed to fetch issue details:', error);
            return { msg: -1, error: error.message };
        }
    }
    async getQfactList(body) {
        const res = await this.db.executeRef('realtime_navigate_get_qfact_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getQmarkList(body) {
        const res = await this.db.executeRef('realtime_navigate_get_qmarks_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getAllFactList(body) {
        const res = await this.db.executeRef('realtime_navigate_get_all_fact_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async checkNavigatedata(body) {
        const res = await this.db.executeRef('realtime_navigate_checkdata', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getIssuebyid(body) {
        const res = await this.db.executeRef('realtime_issue_by_id', body, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to fetch issue by id',
                error: res.error,
            };
        }
    }
    async deleteIssue(body) {
        const parameter = {
            ...body,
            cPermission: 'SD',
        };
        const res = await this.db.executeRef('realtime_handle_issue_delete', parameter, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue', error: res.error };
        }
    }
    async deleteMultiIssue(body) {
        const parameter = {
            ...body,
            cPermission: 'MD',
        };
        const res = await this.db.executeRef('realtime_handle_issue_delete', parameter, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to delete issue', error: res.error };
        }
    }
    async issueSequence(body) {
        let res = await this.db.executeRef('realtime_handle_issue_secquence', body, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async claimSequence(body) {
        let res = await this.db.executeRef('realtime_handle_claim_secquence', body, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async qfactSequence(body) {
        let res = await this.db.executeRef('realtime_handle_qfact_secquence', body, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update qfact sequence', error: res.error };
        }
    }
    async qfactClaimSequence(body) {
        let res = await this.db.executeRef('realtime_handle_qfact_claim_secquence', body, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update qfact claim sequence', error: res.error };
        }
    }
    async updateClaimDetail(param) {
        const res = await this.db.executeRef('realtime_handle_update_claim', param, this.realTimeSchema);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to update issue category',
                error: res.error,
            };
        }
    }
    async deleteClaim(body) {
        const parameter = {
            ...body,
            cPermission: 'SD',
        };
        const res = await this.db.executeRef('realtime_handle_claim_delete', parameter, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle claim', error: res.error };
        }
    }
};
exports.IssueService = IssueService;
exports.IssueService = IssueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _b : Object])
], IssueService);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const utility_service_1 = __webpack_require__(28);
const puppeteer = __webpack_require__(33);
const config_1 = __webpack_require__(6);
const fss = __webpack_require__(34);
const child_process_1 = __webpack_require__(35);
const conversion_js_service_1 = __webpack_require__(36);
const db_service_1 = __webpack_require__(8);
const util_1 = __webpack_require__(25);
const feed_data_service_1 = __webpack_require__(37);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ExportService = class ExportService {
    constructor(utilityService, config, conversion, db, feedData) {
        this.utilityService = utilityService;
        this.config = config;
        this.conversion = conversion;
        this.db = db;
        this.feedData = feedData;
        this.exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
        this.intitData();
    }
    async intitData() {
        try {
            await fss.ensureDir(this.exportPath);
        }
        catch (error) {
        }
    }
    async exportFile(query, res) {
        try {
            const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: query.nCaseid, nSesid: query.nSessionid });
            if (!caseData.success) {
                return { msg: -1, value: 'No case data found!' };
            }
            const otherCaseData = caseData.data[0][0];
            let rawData;
            let data;
            if (query.cTranscript == 'Y' || query.cIsDemo == 'Y') {
                rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${query.cIsDemo == 'Y' ? 'demo-stream' : 's_' + query.nSessionid}.json`), 'utf8');
                data = JSON.parse(rawData);
            }
            else {
                if (otherCaseData.cStatus == 'R') {
                    data = await this.syncFeedToOffline(otherCaseData.nSesid);
                }
                else {
                    const inputDir = path.join('data', `dt_${query.nSessionid}`);
                    data = this.conversion.processDirectory(inputDir);
                }
            }
            try {
                if (res.length) {
                    const updatedCordinats = this.updateCordinates(data, (res.length > 0 ? res[0] : []), query.cTranscript);
                    res[0] = updatedCordinats;
                }
            }
            catch (error) {
            }
            const summaryOfAnnots = [];
            const summaryOfHihglights = [];
            try {
                const dt_ant = await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: query.nCaseid, ref: 2, nUserid: query.nUserid, nSesid: query.nSessionid, cTranscript: query.cTranscript || 'N', isAnnotations: query.bQfact || false, isHighlight: query.bQmark || false });
                if (dt_ant?.data?.length) {
                    const allAnnotations = dt_ant.data[0] || [];
                    const issueRows = dt_ant.data[1] || [];
                    const issuesMap = new Map();
                    for (const issue of issueRows) {
                        for (const fsid of (issue.jFSids || [])) {
                            if (!issuesMap.has(fsid))
                                issuesMap.set(fsid, []);
                            issuesMap.get(fsid).push({
                                cIName: issue.cIName || '',
                                cColor: issue.cColor || '',
                                nImpactid: issue.nImpactid || null,
                                cRel: issue.cRelevance || '',
                                cImp: issue.cImpact || '',
                            });
                        }
                    }
                    const strip = (t) => (t || '').replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
                    const normalize = (e) => {
                        const sourceText = (e.jCordinates || []).map((c) => strip(c.text || '')).filter((t) => t).join(' ');
                        return {
                            pageIndex: e.nPage,
                            cLineno: e.nLine || '',
                            cONote: sourceText || strip((e.jOT || [])[0] || ''),
                            cNote: strip((e.jTexts || [])[0] || ''),
                            issues: issuesMap.get(e.nFSid || e.id) || [],
                        };
                    };
                    const qfactItems = allAnnotations.filter(a => a.cSource === 'QF').map(normalize);
                    const factItems = allAnnotations.filter(a => a.cSource === 'F').map(normalize);
                    const qmarkAnnots = allAnnotations.filter(a => a.cSource === 'QM');
                    if (qfactItems.length)
                        summaryOfAnnots.push({ title: 'QFact', data: qfactItems });
                    if (factItems.length)
                        summaryOfAnnots.push({ title: 'Full Fact', data: factItems });
                    if (qmarkAnnots.length) {
                        const groupData = [];
                        qmarkAnnots.forEach((item) => {
                            const nGroupid = item.nGroupid || item.id;
                            const idx = groupData.findIndex(a => a.nGroupid == nGroupid);
                            if (idx > -1) {
                                groupData[idx].data.push(item);
                            }
                            else {
                                groupData.push({ nGroupid, data: [item] });
                            }
                        });
                        summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
                    }
                }
            }
            catch (error) {
            }
            const htmlContent = await this.generateHtmlContent(query, data, res, query.bTimestamp, (query.bCoverpg ? { CaseName: query.cCasename, ExportBy: query.cUsername, cTranscript: query.cTranscript } : null), otherCaseData, summaryOfAnnots, summaryOfHihglights);
            fs.writeFileSync(path.join(this.exportPath, `output${query.nSessionid}.html`), htmlContent);
            const Filepath = await this.generatePdfWithWkhtml(query);
            return { msg: 1, path: Filepath, name: 'export.pdf' };
        }
        catch (error) {
            console.error('exportFile error:', error);
            return { msg: -1 };
        }
    }
    checkForPages(page, query) {
        try {
            return !query.jPages.length || (query.jPages.length && query.jPages.includes(page));
        }
        catch (error) {
            return true;
        }
    }
    generateHtmlContent(query, data, res, showTimeStamps, coverParam, x, summaryOfAnnots, summaryOfHihglights) {
        const date = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        const htmlTemplatePath = path.join(this.exportPath, 'htmlTemplate.html');
        const issueAnnots = (res && res.length) ? res[0] : [];
        const highlights = (res && res.length) ? res[1] : [];
        let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf-8');
        let coverContent = `<td class="main-content">
              <h1 class="case-name">${coverParam.CaseName}</h1>
              <p class="document-type">${x.cCasename}</p>
              <p class="document-info">
                <span style="font-size: 12px; line-height: 6px"></span>
              </p>
              <div class="spacer"></div>
              <p class="export-info">
                Exported on: ${formattedDate} <br /> By ${coverParam.ExportBy} <br>
              </p>
            </td>`;
        let mainContent = '';
        htmlContent = htmlContent.replace('<td class="main-content replacable-content"></td>', coverContent);
        let currentPage = data[0].page;
        let pgIndexs = 0;
        mainContent += `<div class="titlepage page page-break">
    <div class="maindivider"></div>
    <pre class="text-1">${x?.cIndexheader || ''}
    </pre>
    <div class="divider"></div>
    <div class="sidespace">


      <p class="text-start betweeen uppercase">Between:</p>
      <p>
        <span>${x?.cClaimant || ''}</span>
      </p>
      <p class="text-end">Claimant</p>
      <p>-&nbsp;&nbsp;and&nbsp;&nbsp;-</p>
      <pre>${x?.cRespondent || ''}</pre>
      <p class="text-end">Respondent</p>
      <div class="spacer"></div>
      <div class="divider"></div>
      <p>-&nbsp;&nbsp;before&nbsp;&nbsp;- </p>
      <pre>${x?.cName || ''}
      </pre>
      <p>${x?.dDay}, ${x?.dSessionDt}
      </p>

      <div class="divider"></div>

     
    </div>
    <p class="text-center transriptby">
      Transcript produced by lloydmichaux.com<br />
    </p>
    <div class="maindivider"></div>
  </div>
`;
        mainContent += this.bindIssuesIndex(summaryOfAnnots);
        mainContent += this.bindHighlightsIndex(summaryOfHihglights);
        data.forEach(ls => {
            if (this.checkForPages(ls.page, query)) {
                pgIndexs++;
                currentPage = ls.page;
                const curPageData = issueAnnots.filter(i => i.pageIndex == currentPage);
                mainContent += `
        <div class="page page-break">

        <table class="page-header" name="page-${currentPage}" id="page-${currentPage}">
          <tr>
            <td class="head-left">
              <p>${x?.cCasename}</p>
            </td>
            <td class="head-right">
             <p class="text-end">${x?.cName}</p>
             <p class="text-end">${x?.dSessionDt}</p>
            </td>
          </tr>
        </table>
        <header class="data-header">Page No. ${currentPage}</header>`;
                if (query.bPagination) {
                    mainContent += `<span class="pagination">${coverParam.CaseName}-${pgIndexs}</span>`;
                }
                mainContent += `    <table class="line-table">`;
                if (ls && ls.data) {
                    ls.data.forEach((item, index) => {
                        let linetext = item.lines.join('');
                        let startIndex = 0, endIndex = 0;
                        if (curPageData.length > 0) {
                            let matchingLine = this.utilityService.findFirstMatchingLine(curPageData, index + 1);
                            if (matchingLine && linetext && matchingLine.text) {
                                startIndex = matchingLine.startIndex;
                                endIndex = matchingLine.endIndex;
                                const color = matchingLine.color;
                                linetext = linetext.slice(0, startIndex) +
                                    `<span style="background:${color}">` +
                                    linetext.slice(startIndex, endIndex) +
                                    '</span>' +
                                    linetext.slice(endIndex);
                            }
                        }
                        item.linetext = linetext;
                        const currentLinedata = highlights.find(a => (a && a.cPageno == currentPage && a.cLineno == (index + 1)));
                        mainContent += `     <tr style="background:${currentLinedata ? `#${currentLinedata.cColor}` : 'white'}" class="line-${item.formate}">
                                   <td class="line-no" style="background:${currentLinedata ? `#${currentLinedata.cColor}` : '#eeeeee'}">
                                     <span>${index + 1}</span>
                                    ${showTimeStamps ? `<span>${item.time}</span>` : ''} 
                                   </td>
                                   <td class="line-text"><span> ${item.linetext}<span></td>
                                 </tr>`;
                    });
                }
                mainContent += `</table>`;
                mainContent += `
                       <table class="page-header data-footer ">
                         <tr>
                           <td colspan="2">
                             <div class="maindivider"></div>
                           </td>
                         </tr>
                         <tr>
                           <td class="head-left">
                             <p>Lloyd Michaux (ask@lloydmichaux.com)</p>
                             <p>Asia-Pacific | Middle East | India</p>
                           </td>
                           <td class="head-right">
                             <p class="text-end">Daily Transcript Service</p>
                           </td>
                         </tr>
                       </table>
                      `;
                mainContent += `</div>`;
            }
        });
        htmlContent = htmlContent.replace('<div id="main-content-placeholder"></div>', mainContent + '</body></html>');
        return htmlContent;
    }
    bindIssuesIndex(summaryOfAnnots) {
        let mainContent = '';
        if (summaryOfAnnots?.length) {
            summaryOfAnnots.forEach((item) => {
                mainContent += `  <div class="page page-break p-0">
                            <div class="anothead mb-3">Index</div>
                            <div class="heading">${item?.title}</div>
                                <div class="p-3">
                                <div class="tabhead">
                                  <div class="pageno">Page</div>
                                  <div class="source">Source text</div>
                                  <div class="note">Note</div>
                                  <div class="issue">Issues</div>
                                </div>
                                `;
                if (item.data?.length) {
                    item.data.forEach((annot) => {
                        mainContent += `
                                                  <div class="tabbody">
                                                     <div class="pageno" ><a href="#page-${annot.pageIndex}">${annot.pageIndex}</a></div>
                                                     <div class="source">${annot.cONote || ''}</div>
                                                     <div class="note">${annot.cNote || ''}</div>`;
                        mainContent += this.bindAllIssues(annot);
                        mainContent += `</div>`;
                    });
                }
                mainContent += `</div>`;
            });
        }
        return mainContent;
    }
    bindHighlightsIndex(summaryOfHihglights) {
        let mainContent = '';
        try {
            if (summaryOfHihglights?.length) {
                summaryOfHihglights.forEach((item) => {
                    mainContent += ` <div class="page page-break p-0">
                            <div class="anothead mb-3">Index</div>
                            <div class="heading">${item?.title}</div>
                                <div class="p-3">
                                <div class="tabhead">
                                  <div class="pageno">Page</div>
                                  <div class="source">Source text</div>
                                  <div class="note">Note</div>
                                  <div class="issue">Issues</div>
                                </div>`;
                    item.data.forEach((group) => {
                        mainContent += ` <div class="tabbody">`;
                        const sortedArray = group?.data?.filter(a => a).sort((a, b) => parseInt(a.cLineno || "0") - parseInt(b.cLineno || "0"));
                        if (!sortedArray || sortedArray.length === 0) {
                            return;
                        }
                        const page = [...new Set(sortedArray.map(a => a?.cPageno).filter(p => p !== undefined))][0];
                        const text = sortedArray.map(a => a?.cNote || '').join('<br /> ');
                        const issues = sortedArray[0] || {};
                        mainContent +=
                            ` <div class="pageno" >
                                       <a  href="#page-${page}">${page || ''}</a>
                                   </div>`;
                        mainContent +=
                            `<div class="source">
                                   ${text || ''}
                                 </div>`;
                        mainContent += `<div class="note"></div>`;
                        mainContent += this.bindAllIssues(issues);
                        mainContent += `</div>`;
                    });
                    mainContent += `</div>`;
                });
            }
        }
        catch (error) {
        }
        return mainContent;
    }
    bindAllIssues(annot) {
        let mainContent = '';
        mainContent += `<div class="issue">`;
        try {
            if (annot?.issues?.length) {
                annot.issues.forEach((issue) => {
                    mainContent +=
                        ` <div class="issuewrap">
                  <div class="name"> <span class="issuebar" style="background:#${issue.cColor} !important"></span> <span class="text">${issue.cIName}</span> </div>`;
                    if (issue?.cRel) {
                        mainContent += `<div class="rel"> <span class="relspn">${issue.cRel}</span> </div>`;
                    }
                    if (issue?.cImp) {
                        mainContent += `
                      <div class="impact"><img width="20px" src="https://etabella.tech/docs/impacts/${issue.nImpactid}.png"> </div>
                     `;
                    }
                    mainContent += `</div>`;
                });
            }
        }
        catch (error) {
        }
        mainContent += `</div>`;
        return mainContent;
    }
    async generatePdf(query) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            timeout: 60000,
        });
        const page = await browser.newPage();
        let filePath;
        if (process.env.NODE_ENV == 'production') {
            filePath = path.join(this.exportPath, `output${query.nSessionid}.html`);
        }
        else {
            filePath = path.join(__dirname, '../../../', this.exportPath, `output${query.nSessionid}.html`);
        }
        const fileUrl = `file://${filePath}`;
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pdfname = `s_${query.nSessionid}.pdf`;
        const PDFpath = `${this.exportPath}${pdfname}`;
        return pdfname;
    }
    async generatePdfWithWkhtml(query) {
        try {
            const exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
            let htmlFilePath;
            if (process.env.NODE_ENV === 'production') {
                htmlFilePath = path.join(exportPath, `output${query.nSessionid}.html`);
            }
            else {
                htmlFilePath = path.join(__dirname, '../../../', exportPath, `output${query.nSessionid}.html`);
            }
            const pdfFilePath = `${exportPath}s_${query.nSessionid}.pdf`;
            const command = `wkhtmltopdf --enable-local-file-access --page-size A4 --margin-top 0 --margin-bottom 0 --margin-left 0 --margin-right 0 --print-media-type ${htmlFilePath} ${pdfFilePath}`;
            await execAsync(command);
            const PDFpath = `s_${query.nSessionid}.pdf`;
            return PDFpath;
        }
        catch (error) {
            console.error('Error during PDF conversion:', error);
            return '';
        }
    }
    updateCordinates(data, res, cTranscript) {
        const heighlightData = res;
        heighlightData.forEach(e => {
            const pg = e.pageIndex;
            const pgData = data.find(a => a.page == pg)?.data;
            if (e.cordinates) {
                let searchLine;
                const length = e.cordinates.length;
                e.cordinates.forEach((c, index) => {
                    try {
                        const line = pgData[c.l - 1].lines.join(' ');
                        let startIndex = 0, endIndex = 0;
                        if (index > 0 && (length - 1) > index) {
                            startIndex = 0;
                            endIndex = line.length;
                        }
                        else {
                            searchLine = c.text || this.getLineText(e.cONote, index) || '';
                            ({ startIndex, endIndex } = this.utilityService.findIndices(searchLine, line));
                        }
                        if (index == 0 && length > 1)
                            endIndex = line.length;
                        if ((length - 1) == index && length > 1)
                            startIndex = 0;
                        c.startIndex = startIndex;
                        c.endIndex = endIndex;
                        if (!c.text)
                            c.text = searchLine;
                    }
                    catch (error) {
                    }
                });
            }
        });
        return res;
    }
    getLineText(note, index) {
        try {
            note = note || '';
            note = this.replaceDoubleNewlines(note);
            return note.split('\n')[index];
        }
        catch (error) {
            return '';
        }
    }
    replaceDoubleNewlines(input) {
        return input.replace(/\n\n/g, '\n');
    }
    async syncFeedToOffline(nSesid) {
        const feedData = [];
        try {
            const sessionId = nSesid;
            try {
                const sessionData = await this.feedData.readSessionData(sessionId);
                const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b));
                if (!pages?.length)
                    return;
                for (let x of pages) {
                    const pg = Number(x[0]);
                    const pageData = x[1] || [];
                    const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])] }));
                    feedData.push({ msg: pg, page: pg, data: frmtData });
                }
            }
            catch (error) {
            }
            return feedData.sort((a, b) => a.page - b.page);
        }
        catch (error) {
            return feedData;
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof conversion_js_service_1.ConversionJsService !== "undefined" && conversion_js_service_1.ConversionJsService) === "function" ? _c : Object, typeof (_d = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _d : Object, typeof (_e = typeof feed_data_service_1.FeedDataService !== "undefined" && feed_data_service_1.FeedDataService) === "function" ? _e : Object])
], ExportService);


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
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(29);
const common_1 = __webpack_require__(3);
const levenshtein = __webpack_require__(31);
const Fuse = __webpack_require__(32);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    hexToRgb(hex) {
        hex = hex.replace(/^#/, '');
        let bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;
        console.log(`\n\r\n\r rgb(${r}, ${g}, ${b},0.5)`);
        return `rgb(${r}, ${g}, ${b},0.5)`;
    }
    findFirstMatchingLine(curPageData, lineno) {
        let idx = 0, txt_idx = 0;
        for (const i of curPageData) {
            idx++;
            for (const j of i.cordinates) {
                txt_idx++;
                if (lineno == j.l) {
                    j.txt_idx = txt_idx;
                    j.idx = idx;
                    j.color = '#' + (i.color || 'e1dd0e');
                    return j;
                }
            }
        }
        return null;
    }
    fuzzySearchLevenshtein(search, destination) {
        const substrings = [];
        for (let i = 0; i <= destination.length - search.length; i++) {
            for (let j = i + 2; j <= destination.length; j++) {
                substrings.push(destination.substring(i, j));
            }
        }
        const fuse = new Fuse(substrings, {
            includeScore: true,
            minMatchCharLength: 2,
            threshold: 0.6,
            keys: [],
        });
        const fuseResults = fuse.search(search);
        let potentialMatches = fuseResults.map(result => result.item);
        let closestMatch = null;
        let minDistance = Infinity;
        let startIndex = -1;
        let endIndex = -1;
        potentialMatches.forEach(substring => {
            const distance = levenshtein.get(search, substring);
            if (distance < minDistance) {
                minDistance = distance;
                closestMatch = substring;
                startIndex = destination.indexOf(substring);
                endIndex = startIndex + substring.length - 1;
            }
        });
        return { startIndex, endIndex };
    }
    findIndices(searchText, destinationText) {
        searchText = searchText.trim().toLowerCase()?.replace(/'{2,}/g, "'");
        ;
        destinationText = destinationText.toLowerCase();
        let exactIndex = destinationText.indexOf(searchText);
        if (exactIndex !== -1) {
            return { startIndex: exactIndex, endIndex: exactIndex + searchText.length };
        }
        let minDistance = Infinity;
        let bestStart = -1;
        let bestEnd = -1;
        for (let i = 0; i <= destinationText.length - searchText.length; i++) {
            const sub = destinationText.substring(i, i + searchText.length);
            const distance = levenshtein.get(searchText, sub);
            if (distance < minDistance) {
                minDistance = distance;
                bestStart = i;
                bestEnd = i + searchText.length;
            }
        }
        console.log('bestStart - ', bestStart, bestEnd);
        return { startIndex: bestStart, endIndex: bestEnd };
    }
    findIndices_old(searchText, destinationText) {
        searchText = searchText.toLowerCase();
        destinationText = destinationText.toLowerCase();
        let searchWords = searchText.split(' ');
        const destinationWords = destinationText.split(' ');
        if (destinationWords.length == 1) {
            searchWords = searchText.trim().toLowerCase().replace(/\s+/g, '');
        }
        let matchedIndices = [];
        let searchIndices = [];
        let lastMatchedIndex = -1;
        const attemptMatch = (searchWords, destinationWords) => {
            for (let i = 0; i < searchWords.length; i++) {
                let searchWord = searchWords[i].toLowerCase();
                if (searchWord.length == 0) {
                    continue;
                }
                for (let j = lastMatchedIndex + 1; j < destinationWords.length; j++) {
                    let destinationWord = destinationWords[j].toLowerCase();
                    if ((searchWord === destinationWord) || searchWord.replace(/[^a-zA-Z0-9\s]/g, '') === destinationWord.replace(/[^a-zA-Z0-9\s]/g, '')) {
                        searchIndices.push(i);
                        matchedIndices.push(j);
                        lastMatchedIndex = j;
                        break;
                    }
                }
            }
        };
        attemptMatch(searchWords, destinationWords);
        if (matchedIndices.length === 0) {
            searchText = searchText.trim().toLowerCase().replace(/\s+/g, '');
            destinationText = destinationText.trim().toLowerCase();
            searchWords = searchText.split(' ');
            const destinationWords = destinationText.split(' ');
            lastMatchedIndex = -1;
            searchIndices = [];
            matchedIndices = [];
            attemptMatch(searchWords, destinationWords);
        }
        let destination_prefix = [];
        let search_prefix = [];
        let search_suffix = [];
        let destination_suffix = [];
        if (searchIndices.length > 0 && searchIndices[0] !== 0) {
            destination_prefix = destinationWords.slice(0, matchedIndices[0]);
            search_prefix = searchWords.slice(0, searchIndices[0]);
        }
        if (searchIndices.length > 0 && searchIndices[searchIndices.length - 1] !== searchWords.length - 1) {
            destination_suffix = destinationWords.slice(matchedIndices[matchedIndices.length - 1] + 1, destinationWords.length);
            search_suffix = searchWords.slice(searchIndices[searchIndices.length - 1] + 1, searchWords.length);
        }
        let startIndex = -1;
        let endIndex = -1;
        let smallestDistance = Infinity;
        if (matchedIndices.length > 0) {
            if (search_prefix.length > 0 && destination_prefix.length > 0) {
                const prefixText = search_prefix.join(' ');
                const prefixDEST = destination_prefix.join(' ');
                const prefixIndex = prefixDEST.lastIndexOf(prefixText);
                const distance = levenshtein.get(prefixText, prefixDEST);
                if (distance < smallestDistance) {
                    startIndex = distance;
                }
            }
            if (startIndex === -1) {
                let txt = "";
                for (let i = 0; i < matchedIndices[0]; i++) {
                    txt += destinationWords[i] + " ";
                }
                startIndex = txt.length;
                if (startIndex > 0 && destinationText[startIndex - 1] === ' ') {
                    startIndex -= 1;
                }
                if (startIndex === -1) {
                    startIndex = destinationText.indexOf(destinationWords[matchedIndices[0]]);
                }
                console.log('\n\n\n', startIndex, matchedIndices[0], destinationWords[matchedIndices[0]], txt, '\n\n\n');
            }
            if (endIndex === -1) {
                endIndex = startIndex;
                for (let i = 0; i < matchedIndices.length; i++) {
                    const word = destinationWords[matchedIndices[i]];
                    endIndex = destinationText.indexOf(word, endIndex) + word.length;
                }
            }
            if (search_suffix.length > 0 && destination_suffix.length > 0) {
                const suffixText = search_suffix.join(' ');
                const suffixDEST = destination_suffix.join(' ');
                const suffixIndex = suffixDEST.indexOf(suffixText, startIndex);
                const res = this.fuzzySearchLevenshtein(suffixText, suffixDEST);
                if (res.endIndex !== -1) {
                    endIndex = endIndex + 1;
                    endIndex = endIndex + res.endIndex + 1;
                }
            }
        }
        else {
            let distance = levenshtein.get(searchText.toLowerCase(), destinationText.toLowerCase());
            startIndex = destinationText.toLowerCase().lastIndexOf(searchText.toLowerCase());
            if (startIndex !== -1) {
                endIndex = startIndex + searchText.length;
            }
            else {
                ({ startIndex, endIndex } = this.fuzzySearchLevenshtein(searchText, destinationText));
            }
        }
        return { startIndex, endIndex };
    }
    convertSortTimestamp(timestamp) {
        if (!timestamp)
            return '';
        const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
        return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
    }
    sortArray(array) {
        array.sort((a, b) => {
            const frameA = this.convertSortTimestamp(a?.[0] ?? 0);
            const frameB = this.convertSortTimestamp(b?.[0] ?? 0);
            if (frameA !== frameB)
                return frameA - frameB;
            const valA2 = a?.[6] ?? 0;
            const valB2 = b?.[6] ?? 0;
            if (valA2 !== valB2)
                return valA2 - valB2;
        });
    }
    convertToFrame(timestamp) {
        try {
            if (!timestamp)
                return '';
            const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
            return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
        }
        catch (error) {
            return '';
        }
    }
    removeTimestampsInRange(timestamps, range, refreshType) {
        const [startRange, endRange] = range.map(this.convertToFrame);
        const removedData = [];
        const sInd = timestamps.findIndex(([timestamp], index) => {
            const currentFrame = this.convertToFrame(timestamp);
            return currentFrame >= startRange && currentFrame <= endRange;
        });
        const lInd = timestamps.findLastIndex(([timestamp], index) => {
            const currentFrame = this.convertToFrame(timestamp);
            return currentFrame >= startRange && currentFrame <= endRange;
        });
        const newData = timestamps.filter(([timestamp], index) => {
            const currentFrame = this.convertToFrame(timestamp);
            let isInRange = currentFrame >= startRange && currentFrame <= endRange;
            if (lInd != sInd && lInd == index && currentFrame == endRange) {
                isInRange = false;
            }
            if (((lInd - sInd) + 1) > 2 && sInd == index && currentFrame == startRange) {
                try {
                    const nextData = timestamps[index + 1];
                    if (nextData) {
                        const nextTimeRange = this.convertToFrame(nextData[0]);
                        if (nextTimeRange == startRange) {
                            isInRange = false;
                        }
                    }
                }
                catch (error) {
                }
            }
            if (isInRange) {
                try {
                    removedData.push(timestamps[index]);
                }
                catch (error) {
                }
            }
            return !isInRange;
        });
        return { newData, removedData };
    }
    async delay(ms) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(1);
            }, ms);
        });
    }
    emit(data, topic) {
        console.log('UtilityService emit', data, topic);
        this.kafka.sendMessage((topic ? topic : 'upload-messages'), data);
    }
    findAllMatchingLines(curPageData, lineno) {
        const matches = [];
        let idx = 0, txt_idx = 0;
        for (const i of curPageData) {
            idx++;
            for (const j of i.cordinates) {
                txt_idx++;
                if (lineno == j.l) {
                    j.txt_idx = txt_idx;
                    j.idx = idx;
                    j.color = '#' + (i.color || 'e1dd0e');
                    matches.push({
                        ...j,
                        startIndex: j.startIndex,
                        endIndex: j.endIndex
                    });
                }
            }
        }
        return matches.sort((a, b) => a.startIndex - b.startIndex);
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
        }
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(30);
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
/* 30 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("fast-levenshtein");

/***/ }),
/* 32 */
/***/ ((module) => {

module.exports = require("fuse.js");

/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("puppeteer");

/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("fs-extra");

/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 36 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConversionJsService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
let ConversionJsService = class ConversionJsService {
    charCodesToString(charCodes) {
        return String.fromCharCode(...charCodes).trim();
    }
    processFile(filePath, pageIndex) {
        debugger;
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return data.map((item, index) => ({
            time: (item?.length ? item[0] : null),
            lineIndex: index + 1,
            lines: [this.charCodesToString(item?.length ? item[1] : [])],
            formate: item[3],
            unicid: item[6]
        }));
    }
    processDirectory(dirPath) {
        const output = [];
        const files = fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.json'))
            .sort((a, b) => {
            const aPageNum = parseInt(a.match(/page_(\d+)\.json/)[1], 10);
            const bPageNum = parseInt(b.match(/page_(\d+)\.json/)[1], 10);
            return aPageNum - bPageNum;
        });
        files.forEach((file, pageIndex) => {
            const filePath = path.join(dirPath, file);
            const processedData = this.processFile(filePath, pageIndex + 1);
            output.push({
                msg: pageIndex + 1,
                page: pageIndex + 1,
                data: processedData
            });
        });
        return output;
    }
};
exports.ConversionJsService = ConversionJsService;
exports.ConversionJsService = ConversionJsService = __decorate([
    (0, common_1.Injectable)()
], ConversionJsService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FeedDataService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeedDataService = void 0;
const redis_db_service_1 = __webpack_require__(38);
const log_service_1 = __webpack_require__(41);
const common_1 = __webpack_require__(3);
const async_1 = __webpack_require__(44);
const utility_service_1 = __webpack_require__(28);
const sessionData_1 = __webpack_require__(45);
const socket_io_1 = __webpack_require__(20);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const fs_1 = __webpack_require__(23);
let FeedDataService = FeedDataService_1 = class FeedDataService {
    constructor(io, db, log, util) {
        this.io = io;
        this.db = db;
        this.log = log;
        this.util = util;
        this.manager = new sessionData_1.SessionManager();
        this.delayofSession = 10;
        this.logger = new common_1.Logger(FeedDataService_1.name);
        this.queue = async_1.default.queue(async (task, callback) => {
            try {
                await task();
            }
            catch (error) {
            }
            callback();
        }, 1);
        this.queue.drain(() => {
        });
        this.queue.push(async () => {
            await this.onInitService();
        });
    }
    checkSessionExists(sessionId) {
        return this.manager.hasSession(sessionId);
    }
    sessionTotalPages(sessionId) {
        return this.manager.getTotalPages(sessionId);
    }
    async onInitService() {
        try {
            console.log('Initializing service and loading data from Redis...');
            const sessionKeys = await this.db.scanKeys('session:*');
            const sessionMap = {};
            for (const key of sessionKeys) {
                const [_, sessionId, page] = key.split(':');
                const pageData = await this.db.getValue(key);
                if (pageData) {
                    const parsedData = JSON.parse(pageData);
                    sessionMap[sessionId] = sessionMap[sessionId] || {};
                    sessionMap[sessionId][Number(page)] = parsedData;
                }
            }
            for (const sessionId in sessionMap) {
                for (const pageNumber in sessionMap[sessionId]) {
                    this.manager.setPageData(sessionId, Number(pageNumber), sessionMap[sessionId][pageNumber]);
                }
            }
            console.log('Session data successfully loaded into memory.');
        }
        catch (error) {
            console.error('Error during initialization:', error);
            this.log.error(`Error during initialization: ${error.message}`, `feed/global`);
            return false;
        }
        return true;
    }
    async getPage(sessionId, pageNumber) {
        try {
            if (this.manager.hasPage(sessionId, Number(pageNumber))) {
                return this.manager.getPageData(sessionId, Number(pageNumber)) || [];
            }
            const pageData = JSON.parse(await this.db.getValue(`session:${sessionId}:${pageNumber}`) || '[]') || [];
            if (pageData?.length) {
                this.manager.setPageData(sessionId, Number(pageNumber), pageData);
            }
            return pageData;
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
            return [];
        }
    }
    async setPage(sessionId, pageNumber, Data) {
        try {
            this.manager.setPageData(sessionId, Number(pageNumber), Data);
            await this.db.setValue(`session:${sessionId}:${pageNumber}`, JSON.stringify([...Data]), 48 * 3600);
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
        return true;
    }
    feedReceive(msg) {
        try {
            const nSesid = msg?.date;
            if (!nSesid) {
                this.log.error(`Session id not found`, `feed/${0}`);
                return;
            }
            ;
        }
        catch (error) {
        }
        this.queue.push(async () => {
            await this.addLiveFeedData(msg);
        });
    }
    refreshReceive(msg) {
        try {
            const nSesid = msg?.nSesid;
            if (!nSesid) {
                this.log.error(`Session id not found`, `feed/${0}`);
                return;
            }
            ;
        }
        catch (error) {
        }
        try {
            this.printRecRefresh(msg, `Refresh data receive ${JSON.stringify(msg)} `);
        }
        catch (error) {
        }
        this.queue.push(async () => {
            await this.saveRefreshData(msg);
        });
    }
    async printRecRefresh(msg, data) {
        try {
            const sessionDir = `logs/s_${msg.nSesid}`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            const log_msg = `${data}n\r\n\r\n`;
            fs.appendFile(`${sessionDir}/refreshcmd.txt`, log_msg + '\n', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                    throw err;
                }
                console.log('File updated successfully!');
            });
        }
        catch (error) {
        }
    }
    async addLiveFeedData(res) {
        try {
            const parsedData = res.d || [];
            const formattedData = parsedData
                .map(item => [
                item[0] || "00:00:00:00",
                item[1] || [],
                item[2],
                item[3],
                item[4],
                item[5],
                item[6],
                item[7] || [],
                item[8] || 0
            ])
                .filter(item => item[2] > -1);
            await this.updateFeedData(formattedData, res);
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
        }
        return true;
    }
    async updateFeedData(formattedData, res) {
        try {
            const lineNo = 25;
            for (const item of formattedData) {
                const pageIndex = Math.floor(item[2] / lineNo);
                const lineIndex = item[2] % lineNo;
                let page = (await this.getPage(res.date, pageIndex + 1)) || [];
                page[lineIndex] = item;
                page = page.map((entry, index) => entry ?? ['00:00:00:00', [], index]);
                await this.setPage(res.date, pageIndex + 1, page);
            }
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${res.date}`);
        }
        return;
    }
    async saveRefreshData(msg) {
        msg.current_refresh = msg?.current_refresh || 0;
        debugger;
        try {
            const sessiondata = await this.getSessionAllData(msg.nSesid);
            this.util.sortArray(sessiondata);
            await this.logOfData(msg.nSesid, `Refresh timestamp ${[msg.start, msg.end].join(' ')}`, [], msg.current_refresh);
            await this.logOfData(msg.nSesid, `Befour ${msg.current_refresh}`, sessiondata, msg.current_refresh);
            let { newData, removedData } = this.util.removeTimestampsInRange(sessiondata, [msg.start, msg.end], msg?.refreshType);
            await this.logOfData(msg.nSesid, `Removed lines \n `, removedData, msg.current_refresh);
            if (msg.newLines?.length)
                newData.push(...msg.newLines);
            await this.logOfData(msg.nSesid, `\n\n New lines \n `, msg.newLines || [], msg.current_refresh);
            this.util.sortArray(newData);
            const pageSize = 25;
            const totalPages = Math.ceil(newData.length / pageSize);
            for (let i = 0; i < totalPages; i++) {
                const pageData = newData.slice(i * pageSize, (i + 1) * pageSize);
                const pageNumber = i + 1;
                await this.setPage(msg.nSesid, pageNumber, pageData);
            }
            await this.logOfData(msg.nSesid, `After ${msg.current_refresh}`, newData, msg.current_refresh);
            await this.deleteExtraPages(msg.nSesid, totalPages);
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${msg.nSesid}`);
        }
        return true;
    }
    async logOfData(nSesid, val, feedlist, current_refresh) {
        try {
            this.util.sortArray(feedlist);
            const allDts = feedlist.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`);
            const log_msg = `${val}  \n ${allDts}`;
            const sessionDir = `logs/s_${nSesid}/refresh`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/refreshlog_${current_refresh}.txt`, log_msg + '\n ');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async deleteExtraPages(sessionId, maxPage) {
        try {
            const pages = Object.keys(await this.readSessionData(sessionId));
            for (let x of pages) {
                if (Number(x) > maxPage) {
                    await this.manager.deletePageData(sessionId, Number(x));
                }
            }
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
        try {
            await this.db.deleteSessionPages(sessionId, maxPage);
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
        return true;
    }
    async getSessionAllData(sessionId) {
        try {
            const sessionData = await this.readSessionData(sessionId);
            if (sessionData) {
                return Object.values(sessionData).flat();
            }
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
        return [];
    }
    async readSessionData(sessionId) {
        try {
            let sessionData = {};
            if (this.manager.hasSession(sessionId)) {
                sessionData = await this.manager.getSessionData(sessionId);
            }
            if (!sessionData || Object.keys(sessionData).length === 0) {
                const redisData = await this.db.getAllValues(`session:${sessionId}:*`);
                if (redisData) {
                    sessionData = redisData;
                }
            }
            return sessionData;
        }
        catch (error) {
            console.log(error);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
            return {};
        }
    }
    async streamSessionData(socketId, body, qFacts, qMarks) {
        const sessionId = body?.nSesid;
        try {
            const sessionData = await this.readSessionData(sessionId);
            const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b));
            this.logger.verbose(`(LOCAL-SESSION) There are ${pages?.length} files in the directory.`);
            if (!pages?.length)
                return;
            for (let x of pages) {
                const pg = Number(x[0]);
                const pageData = x[1] || [];
                const aDATA = [], hDATA = [];
                try {
                    if (qFacts) {
                        aDATA.push(...qFacts.filter(a => Number(a.pageIndex) == pg));
                    }
                    if (qMarks) {
                        hDATA.push(...qMarks.filter(a => Number(a.cPageno) == pg));
                    }
                }
                catch (error) {
                    console.log(error);
                    this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
                }
                this.io["server"].to(socketId).emit('previous-data', { msg: 1, page: pg, data: JSON.stringify(pageData || []), totalPages: pages.length, nSesid: sessionId, a: aDATA, h: hDATA, tab: body?.tab });
                await this.util.delay(this.delayofSession);
            }
        }
        catch (error) {
            console.log(error);
            this.logger.error(`Error`, error?.message);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
        }
    }
    async getSessionPagesData(nSesid, reqPages) {
        const sessionId = nSesid;
        try {
            const sessionData = await this.readSessionData(sessionId);
            const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b));
            if (!pages?.length)
                return { total: 0, feed: [] };
            const finalPages = pages.filter(a => reqPages.includes(Number(a[0])));
            const result = [];
            for (let x of finalPages) {
                const page = Number(x[0]);
                const data = x[1] || [];
                result.push({ page, data });
            }
            return { total: pages?.length, feed: result };
        }
        catch (error) {
            this.logger.error(`Error`, error?.message);
            this.log.error(`Error : ${error.message}`, `feed/${sessionId}`);
            return { total: 0, feed: [] };
        }
    }
    async sessionEnd(sessionId) {
        try {
            const sessionData = await this.readSessionData(sessionId);
            if (!sessionData || Object.keys(sessionData).length === 0) {
                console.log(`No data found for session ${sessionId}`);
                this.log.error(`No data found for session ${sessionId}`, `feed/${sessionId}`);
                return;
            }
            const baseDir = path.resolve(`data/dt_${sessionId}`);
            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
            }
            for (const page in sessionData) {
                const filePath = path.join(baseDir, `page_${page}.json`);
                const pageData = sessionData[page];
                await fs.promises.writeFile(filePath, JSON.stringify(pageData, null, 2), 'utf-8');
                console.log(`Saved page ${page} of session ${sessionId} to ${filePath}`);
            }
            this.manager.deletePageData(sessionId, -1);
            console.log(`Session ${sessionId} data cleared from memory.`);
            await this.db.deleteSessionPages(sessionId, 0);
            console.log(`Session ${sessionId} data cleared from Redis.`);
        }
        catch (error) {
            console.error(`Error handling session end for session ${sessionId}:`, error);
            this.log.error(`Error handling session end: ${error.message}`, `feed/${sessionId}`);
        }
    }
};
exports.FeedDataService = FeedDataService;
exports.FeedDataService = FeedDataService = FeedDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object])
], FeedDataService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(39);
const ioredis_2 = __webpack_require__(40);
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
/* 39 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 41 */
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
const winston_1 = __webpack_require__(42);
const nest_winston_1 = __webpack_require__(43);
const winston = __webpack_require__(42);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const moment = __webpack_require__(14);
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
/* 42 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 45 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionManager = void 0;
class SessionManager {
    constructor() {
        this.sessionData = {};
        this.hasPage = (session, page) => {
            try {
                return !!(this.sessionData[session] && this.sessionData[session][page]);
            }
            catch (error) {
                console.error("Error in hasPage:", error);
                return false;
            }
        };
        this.hasSession = (session) => {
            try {
                return !!(this.sessionData[session]);
            }
            catch (error) {
                return false;
            }
        };
        this.getPageData = (session, page) => {
            try {
                return this.sessionData[session]?.[page] || [];
            }
            catch (error) {
                console.error("Error in getPageData:", error);
                return null;
            }
        };
        this.getTotalPages = (session) => {
            try {
                if (!this.sessionData[session]) {
                    return 0;
                }
                return Object.keys(this.sessionData[session]).length;
            }
            catch (error) {
                console.error("Error in getTotalPages:", error);
                return 0;
            }
        };
        this.setPageData = (session, page, data) => {
            try {
                this.sessionData[session] = this.sessionData[session] || {};
                this.sessionData[session][page] = data;
            }
            catch (error) {
                console.error("Error in setPageData:", error);
            }
        };
        this.getSessionData = (session) => {
            try {
                return this.sessionData[session] || [];
            }
            catch (error) {
                console.error("Error in getSessionData:", error);
                return null;
            }
        };
        this.deletePageData = (session, page) => {
            try {
                if (page === -1) {
                    delete this.sessionData[session];
                    return true;
                }
                if (this.sessionData[session]?.[page]) {
                    delete this.sessionData[session][page];
                    if (Object.keys(this.sessionData[session]).length === 0) {
                        delete this.sessionData[session];
                    }
                    return true;
                }
                return false;
            }
            catch (error) {
                console.error("Error in deletePageData:", error);
                return false;
            }
        };
    }
}
exports.SessionManager = SessionManager;


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnnotTransferService = void 0;
const log_service_1 = __webpack_require__(41);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(35);
let AnnotTransferService = class AnnotTransferService {
    constructor(config, logService) {
        this.config = config;
        this.logService = logService;
        this.logApplication = 'realtime/annot-transfer';
    }
    async startTransfer(nSesid, filePath, cProtocol) {
        console.log('VERIFYING FILE...');
        try {
            const res = await this.transferAnnotations(nSesid, filePath, cProtocol);
            if (res) {
                console.log('TRANSFER SUCCESSFUL');
                this.notifyTransferComplete(nSesid);
                return { msg: 1, status: 'success' };
            }
            else {
                throw new Error('Transfer failed');
            }
        }
        catch (error) {
            console.log('ERROR:', error);
            throw new Error(error.message);
        }
    }
    notifyTransferComplete(nSesid) {
        try {
            if (!this.server) {
                console.warn('[annot-transfer] Socket server not wired yet; skipping push. Transferred coords will still be picked up on next fetch.');
                return;
            }
            this.server.to(`S${nSesid}`).emit('realtime-events', { type: 'SD', nSesid });
            this.logService.info(`Emitted SD to room S${nSesid} after successful transfer`, `${this.logApplication}/${nSesid}`);
        }
        catch (err) {
            console.log('[annot-transfer] notifyTransferComplete error:', err);
            this.logService.error(`notifyTransferComplete failed: ${err?.message || err}`, `${this.logApplication}/${nSesid}`);
        }
    }
    async transferAnnotations(nSesid, filePath, cProtocol) {
        console.log('\n\r\n\rANNOT TRANSFER STARTED...', this.config.get('PY_ANNOT_TRANSFER'), nSesid, filePath, this.config.get('REALTIME_PATH'));
        try {
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), [
                this.config.get('PY_ANNOT_TRANSFER'),
                nSesid,
                filePath,
                this.config.get('REALTIME_PATH'),
                this.config.get('DB_DATABASE'),
                this.config.get('DB_USERNAME'),
                this.config.get('DB_PASSWORD'),
                this.config.get('DB_HOST'),
                this.config.get('DB_PORT'),
                cProtocol
            ]);
            let dataBuffer = '';
            pythonProcess.stdout.on('data', (data) => {
                dataBuffer += data.toString();
                console.log('DATA:', data.toString());
                this.logService.info(`DATA: ${data.toString()}`, `${this.logApplication}/${nSesid}`);
            });
            pythonProcess.stderr.on('data', (data) => {
                console.log('ERROR:', data.toString());
                this.logService.info(`DATA: ${data.toString()}`, `${this.logApplication}/${nSesid}`);
            });
            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.log('ERROR:', err);
                    this.logService.error(`ERROR: ${err}`, `${this.logApplication}/${nSesid}`);
                    reject(err);
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`Python process exited with code ${code}`);
                        this.logService.error(`Python process exited with code ${code}`, `${this.logApplication}/${nSesid}`);
                        resolve(false);
                        return;
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
exports.AnnotTransferService = AnnotTransferService;
exports.AnnotTransferService = AnnotTransferService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], AnnotTransferService);


/***/ }),
/* 47 */
/***/ ((module) => {

module.exports = require("exceljs");

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ActiveSessionDetailReq = exports.ActiveSessionReq = exports.DocinfoReq = exports.filedataRes = exports.filedataReq = exports.RTLogsUserLGReq = exports.RTLogsSessionUserReq = exports.RTLogsReq = exports.logJoinReq = exports.synsSessionsMDL = exports.DocInfoRes = exports.DocInfoReq = exports.updateTransStatusMDL = exports.userSesionData = exports.publishSEC = exports.checkDuplicacySEC = exports.bundleDetailSEC = exports.sectionDetailSEC = exports.caseDetailSEC = exports.CaseListRes = exports.assignMentReq = exports.deleteConectivityLog = exports.conectivityLog = exports.getConnectivityLogReq = exports.SearchedUserListReq = exports.userListReq = exports.createUserInterfaceReq = exports.checkRunningSessionReq = exports.ServerBuilderReq = exports.setServerReq = exports.SessionStartReq = exports.SessionEndReq = exports.SessionDeleteReq = exports.SessionBuilderReq = exports.sessionDertailReq = exports.SessionByCaseIdReq = exports.SessionDataV2Req = exports.SessionDataReq = exports.TranscriptFileReq = exports.CaseListReq = exports.SessionListReq = void 0;
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
class SessionListReq {
}
exports.SessionListReq = SessionListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], SessionListReq.prototype, "pageNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionListReq.prototype, "dDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionListReq.prototype, "cUnicuserid", void 0);
class CaseListReq {
}
exports.CaseListReq = CaseListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseListReq.prototype, "cUnicuserid", void 0);
class TranscriptFileReq {
}
exports.TranscriptFileReq = TranscriptFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nCaseid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptFileReq.prototype, "nCaseid", void 0);
class SessionDataReq {
}
exports.SessionDataReq = SessionDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionDataReq.prototype, "cUnicuserid", void 0);
class SessionDataV2Req {
}
exports.SessionDataV2Req = SessionDataV2Req;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nUserid", void 0);
class SessionByCaseIdReq {
}
exports.SessionByCaseIdReq = SessionByCaseIdReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionByCaseIdReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionByCaseIdReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cType', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionByCaseIdReq.prototype, "cType", void 0);
class sessionDertailReq {
}
exports.sessionDertailReq = sessionDertailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sessionDertailReq.prototype, "nSesid", void 0);
class SessionBuilderReq {
}
exports.SessionBuilderReq = SessionBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "cCaseno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "cName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-04-26T14:20:00Z', description: 'Start Date', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "dStartDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'No of days', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nDays must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], SessionBuilderReq.prototype, "nDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'No of lines', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nLines must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_c = typeof Number !== "undefined" && Number) === "function" ? _c : Object)
], SessionBuilderReq.prototype, "nLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page no', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nPageno must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_d = typeof Number !== "undefined" && Number) === "function" ? _d : Object)
], SessionBuilderReq.prototype, "nPageno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "cUnicuserid", void 0);
class SessionDeleteReq {
}
exports.SessionDeleteReq = SessionDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDeleteReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'Delete', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionDeleteReq.prototype, "permission", void 0);
class SessionEndReq {
}
exports.SessionEndReq = SessionEndReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionEndReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'Delete', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionEndReq.prototype, "permission", void 0);
class SessionStartReq {
}
exports.SessionStartReq = SessionStartReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionStartReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionStartReq.prototype, "nCaseid", void 0);
class setServerReq {
}
exports.setServerReq = setServerReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], setServerReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'server id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], setServerReq.prototype, "nRTSid", void 0);
class ServerBuilderReq {
}
exports.ServerBuilderReq = ServerBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nRTSid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "nRTSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Url', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "cUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Port', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nPort must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_e = typeof Number !== "undefined" && Number) === "function" ? _e : Object)
], ServerBuilderReq.prototype, "nPort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "cName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "cUnicuserid", void 0);
class checkRunningSessionReq {
}
exports.checkRunningSessionReq = checkRunningSessionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkRunningSessionReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkRunningSessionReq.prototype, "cUnicuserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'date', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkRunningSessionReq.prototype, "dDate", void 0);
class createUserInterfaceReq {
}
exports.createUserInterfaceReq = createUserInterfaceReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], createUserInterfaceReq.prototype, "cUnicuserid", void 0);
class userListReq {
}
exports.userListReq = userListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userListReq.prototype, "nCaseid", void 0);
class SearchedUserListReq {
}
exports.SearchedUserListReq = SearchedUserListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SearchedUserListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Search', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchedUserListReq.prototype, "cSearch", void 0);
class getConnectivityLogReq {
}
exports.getConnectivityLogReq = getConnectivityLogReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getConnectivityLogReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nPage', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nPage must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_f = typeof Number !== "undefined" && Number) === "function" ? _f : Object)
], getConnectivityLogReq.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'message', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getConnectivityLogReq.prototype, "dDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'search', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getConnectivityLogReq.prototype, "cSearch", void 0);
class conectivityLog {
}
exports.conectivityLog = conectivityLog;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nId', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "nId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'date', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'message', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'cPermission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nLogid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], conectivityLog.prototype, "nLogid", void 0);
class deleteConectivityLog {
}
exports.deleteConectivityLog = deleteConectivityLog;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'cPermission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], deleteConectivityLog.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nLogid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteConectivityLog.prototype, "nLogid", void 0);
class assignMentReq {
}
exports.assignMentReq = assignMentReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nRTSid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "nRTSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'jUserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], assignMentReq.prototype, "jUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cNotifytype', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "cNotifytype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "cUnicuserid", void 0);
class CaseListRes {
}
exports.CaseListRes = CaseListRes;
class caseDetailSEC {
}
exports.caseDetailSEC = caseDetailSEC;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseDetailSEC.prototype, "nCaseid", void 0);
class sectionDetailSEC {
}
exports.sectionDetailSEC = sectionDetailSEC;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sectionDetailSEC.prototype, "nSectionid", void 0);
class bundleDetailSEC {
}
exports.bundleDetailSEC = bundleDetailSEC;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleDetailSEC.prototype, "nBundleid", void 0);
class checkDuplicacySEC {
}
exports.checkDuplicacySEC = checkDuplicacySEC;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacySEC.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacySEC.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacySEC.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [[1, 2, 'dsf', true]], description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkDuplicacySEC.prototype, "d", void 0);
class publishSEC {
}
exports.publishSEC = publishSEC;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], publishSEC.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], publishSEC.prototype, "cStatus", void 0);
class userSesionData {
}
exports.userSesionData = userSesionData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nCaseid", void 0);
class updateTransStatusMDL {
}
exports.updateTransStatusMDL = updateTransStatusMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTransStatusMDL.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTransStatusMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'Delete', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateTransStatusMDL.prototype, "cFlag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'Protocol', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateTransStatusMDL.prototype, "cProtocol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTransStatusMDL.prototype, "nUserid", void 0);
class DocInfoReq {
}
exports.DocInfoReq = DocInfoReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Tab', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocInfoReq.prototype, "cTab", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Case id', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocInfoReq.prototype, "nCaseid", void 0);
class DocInfoRes {
}
exports.DocInfoRes = DocInfoRes;
class synsSessionsMDL {
}
exports.synsSessionsMDL = synsSessionsMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'jSessions', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], synsSessionsMDL.prototype, "jSessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'jUsers', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], synsSessionsMDL.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'jServers', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], synsSessionsMDL.prototype, "jServers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'jDeleted', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], synsSessionsMDL.prototype, "jDeleted", void 0);
class logJoinReq {
}
exports.logJoinReq = logJoinReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], logJoinReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], logJoinReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'J', description: 'Status', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], logJoinReq.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'J', description: 'Status', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], logJoinReq.prototype, "cSource", void 0);
class RTLogsReq {
}
exports.RTLogsReq = RTLogsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], RTLogsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'dStartDt', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RTLogsReq.prototype, "dStartDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'dEndDt', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RTLogsReq.prototype, "dEndDt", void 0);
class RTLogsSessionUserReq {
}
exports.RTLogsSessionUserReq = RTLogsSessionUserReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], RTLogsSessionUserReq.prototype, "nSesid", void 0);
class RTLogsUserLGReq {
}
exports.RTLogsUserLGReq = RTLogsUserLGReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], RTLogsUserLGReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], RTLogsUserLGReq.prototype, "nUserid", void 0);
class filedataReq {
}
exports.filedataReq = filedataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle detail id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filedataReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cTab', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], filedataReq.prototype, "cTab", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filedataReq.prototype, "nCaseid", void 0);
class filedataRes {
}
exports.filedataRes = filedataRes;
class DocinfoReq {
}
exports.DocinfoReq = DocinfoReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocinfoReq.prototype, "nBundledetailid", void 0);
class ActiveSessionReq {
}
exports.ActiveSessionReq = ActiveSessionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ActiveSessionReq.prototype, "nCaseid", void 0);
class ActiveSessionDetailReq {
}
exports.ActiveSessionDetailReq = ActiveSessionDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ActiveSessionDetailReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ActiveSessionDetailReq.prototype, "nUserid", void 0);


/***/ }),
/* 49 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 50 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 52 */
/***/ ((module) => {

module.exports = require("express");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileproviderService = void 0;
const common_1 = __webpack_require__(3);
const path_1 = __webpack_require__(24);
const fs_1 = __webpack_require__(23);
const config_1 = __webpack_require__(6);
let FileproviderService = class FileproviderService {
    constructor(config) {
        this.config = config;
        this.pathToTranscript = this.config.get('ASSETS');
    }
    provideFile(query, res) {
        console.log('\n\rDownloadFileToLocal', query);
        const filename = `s_${query.nSesid}.json`;
        const filePath = (0, path_1.join)(this.pathToTranscript, 'realtime-transcripts', filename);
        console.log('\n\r\n\r\n\r\n\r\n\rFile path:', filePath);
        if (!(0, fs_1.existsSync)(filePath)) {
            return res.status(404).json({ msg: -1, value: 'File not found', filePath });
        }
        const fileStream = (0, fs_1.createReadStream)(filePath);
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
        });
        fileStream.pipe(res);
    }
};
exports.FileproviderService = FileproviderService;
exports.FileproviderService = FileproviderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], FileproviderService);


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
exports.SocketService = void 0;
const common_1 = __webpack_require__(3);
let SocketService = class SocketService {
};
exports.SocketService = SocketService;
exports.SocketService = SocketService = __decorate([
    (0, common_1.Injectable)()
], SocketService);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsGateway = void 0;
const common_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(56);
const socket_io_1 = __webpack_require__(20);
const savedata_service_1 = __webpack_require__(57);
const stream_data_service_1 = __webpack_require__(58);
const session_service_1 = __webpack_require__(12);
const issue_service_1 = __webpack_require__(26);
const users_service_1 = __webpack_require__(22);
const sync_service_1 = __webpack_require__(59);
const feed_data_service_1 = __webpack_require__(37);
const annot_transfer_service_1 = __webpack_require__(46);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
let EventsGateway = class EventsGateway {
    constructor(streamDataService, savedataService, sessionService, user, issueService, syncService, feedData, annotTransferService) {
        this.streamDataService = streamDataService;
        this.savedataService = savedataService;
        this.sessionService = sessionService;
        this.user = user;
        this.issueService = issueService;
        this.syncService = syncService;
        this.feedData = feedData;
        this.annotTransferService = annotTransferService;
        this.sessions = new Map();
        this.logger = new common_1.Logger('socket');
    }
    afterInit(server) {
        this.syncService.server = this.server;
        this.annotTransferService.server = this.server;
        console.log('WebSocket server initialized');
    }
    async handleConnection(client, ...args) {
        const nUserid = client.handshake.query.nUserid;
        this.user.setUser(nUserid, { socketId: client.id, rooms: new Set() });
        console.log(`User connected : ${nUserid}`);
        if (nUserid) {
            try {
                client.join(`U${nUserid}`);
            }
            catch (err) {
                console.error(`handleConnection: failed to auto-join U${nUserid}:`, err);
            }
        }
        let urs = await this.user.getUserSocket(nUserid);
        this.server.to(urs).emit('upload-messages', 'Welcome to the chat of socket');
    }
    async handleDisconnect(client) {
        try {
            console.log('DISCONNECT', client.handshake.query, client.userroom);
            let entries = await this.user.getEntries();
            try {
                this.streamDataService.stopDemoStream(client.id);
            }
            catch (error) {
            }
            try {
                if (client?.userroom && client?.userroom?.nSesid) {
                    this.sessionService.joiningLog({ nSesid: client?.userroom?.nSesid, nUserid: client?.userroom?.nUserid, cStatus: 'L', cSource: 'L' });
                }
            }
            catch (error) {
            }
            const entry = Array.from(entries).find(([key, value]) => value.socketId === client.id);
            if (entry) {
                const [nUserid, userConnection] = entry;
                console.log(`User disconnected : ${nUserid}`);
                userConnection.rooms.forEach(room => client.leave(room));
                this.user.removeUser(nUserid);
            }
        }
        catch (error) {
            console.log(`disconnect  : ${JSON.stringify(error)}`);
        }
    }
    async getRoomCount(room) {
        const socketIds = await this.server.in(room).allSockets();
        return socketIds.size;
    }
    async handleTcpData(msg) {
        this.logger.log(`TCP Data for session ${msg.date} : ${msg.p}`);
        this.feedData.feedReceive(msg);
        this.server.to(`S${msg.date}`).emit('message', msg);
    }
    async handleAnnotTransferData(msg) {
        this.logger.log(`TCP Data for session ${msg.date} : ${msg.p}`);
        this.server.to(`S${msg.nSesid}`).emit('annot-refresh-transfer', msg);
    }
    async feedRefreshData(msg) {
        console.log('TCP Refresh Data:');
        this.feedData.refreshReceive(msg);
        this.server.to(`S${msg.nSesid}`).emit('feed-refresh-data', msg);
    }
    async fetchData(client, data) {
        console.log('\n\n\n\n\n\n Message from client 2:', data);
        const res = await this.issueService.getAnnotationOfPages({ nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
        this.logger.fatal('\n\n\nASKING FOR PREVIOUS PAGES', data);
        const folderPath = path.join('data', `dt_${data.nSesid}`);
        const folderExists = fs.existsSync(folderPath);
        if (folderExists) {
            this.logger.warn('FOLDER EXISTS: FETCHING FROM /data');
            await this.streamDataService.streamData('data', client.id, data, response => {
            }, res[0], res[1]);
        }
        else {
            if (this.feedData.checkSessionExists(data.nSesid)) {
                this.logger.warn('SESSION EXISTS');
                this.feedData.streamSessionData(client.id, data, res[0], res[1]);
            }
            else {
                this.logger.error(`No Session data Found`);
            }
        }
    }
    async fetchMissingPage(client, data) {
        console.log('\n\n\n\n\n\n Message from client 2:', data);
        const res = await this.issueService.getAnnotationOfPages({ nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
        this.streamDataService.streamDataByPage('data', client.id, data, response => {
        }, res[0], res[1], data.pages);
        let dt = await this.sessionService.getSessiondata({ nSesid: data.nSesid, cUnicuserid: '' });
        console.log('EMIT SESSION DETAIOL');
        this.server.to(client.id).emit('session-detail', dt);
    }
    async streamDemoData(client, data) {
        console.log('\n\n\n\n\n\n Message from client:', data);
        this.streamDataService.streamDemoData(client.id, data);
    }
    async stopDemoData(client, data) {
        this.streamDataService.stopDemoStream(client.id);
    }
    async handleJoinRoom(data, client) {
        console.log('Joining Room:', data);
        const nUserid = client.handshake.query.nUserid;
        const rooms = Array.from(client.rooms);
        try {
            if (data.nSesid) {
                const nSesid = data.nSesid;
                if (nSesid) {
                    client["userroom"] = { nSesid, nUserid: data.nUserid };
                    this.sessionService.joiningLog({ nSesid: nSesid, nUserid: data.nUserid, cStatus: 'J', cSource: 'L' });
                }
            }
        }
        catch (error) {
        }
        if (!rooms.includes(data.room)) {
            client.join(data.room);
            this.logger.warn(`ROOM Join ${data.room}`);
        }
        else {
            this.logger.warn(`User already in the room ${data.room}`);
        }
    }
    async handleLeaveRoom(room, client) {
        console.log('LEAVE');
        const nUserid = client.handshake.query.nUserid;
        try {
            if (room.nSesid) {
                const nSesid = room.nSesid;
                if (nSesid) {
                    this.sessionService.joiningLog({ nSesid: nSesid, nUserid: room.nUserid, cStatus: 'L', cSource: 'L' });
                }
            }
        }
        catch (error) {
        }
        client.leave(room);
        this.logger.fatal(`ROOM Leave ${room}`);
    }
    async fetchLostData(msg) {
        try {
            console.log('RECEIVE LOST DATA:', msg.page, new Date());
            await this.savedataService.saveLostData(msg.data, msg.page, msg.nSesid);
            let newData = { ...msg };
            newData.data = JSON.stringify(newData.data);
            console.log('Sending lost data to room:', `S${msg.nSesid}`);
            this.server.to(`S${msg.nSesid}`).emit('previous-data', newData);
        }
        catch (error) {
            console.log('Error fetching lost data', error);
        }
    }
    async issueDetailAdded(msg) {
        console.log('ISSUE Data:', msg, new Date());
        try {
            if (msg.nIDid) {
                const mdl = { nIDid: msg.nIDid, nCaseid: msg.nCaseid, nUserid: msg.nUserid, nSessionid: msg.nSessionid };
                const list = await this.issueService.getAnnotationOfPages(mdl);
                if (list?.length) {
                    if (list[0]?.length) {
                        console.log('Sending issue data to room:', `U${msg.nUserid}`, list[0][0]);
                        this.server.to(`U${msg.nUserid}`).emit('realtime-events', { type: 'issue-annot-added', data: list[0][0] });
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_j = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _j : Object)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('TCP-DATA'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleTcpData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('annot-refresh-transfer'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "handleAnnotTransferData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('feed-refresh-data'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "feedRefreshData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('fetch-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _k : Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "fetchData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('fetch-missing-page'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _l : Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "fetchMissingPage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('fetch-demo-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _m : Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "streamDemoData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop-demo-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _o : Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "stopDemoData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_p = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_r = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], EventsGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('lost-data'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "fetchLostData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('issue-annot-added'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "issueDetailAdded", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        }
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof stream_data_service_1.StreamDataService !== "undefined" && stream_data_service_1.StreamDataService) === "function" ? _a : Object, typeof (_b = typeof savedata_service_1.SavedataService !== "undefined" && savedata_service_1.SavedataService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _d : Object, typeof (_e = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _e : Object, typeof (_f = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _f : Object, typeof (_g = typeof feed_data_service_1.FeedDataService !== "undefined" && feed_data_service_1.FeedDataService) === "function" ? _g : Object, typeof (_h = typeof annot_transfer_service_1.AnnotTransferService !== "undefined" && annot_transfer_service_1.AnnotTransferService) === "function" ? _h : Object])
], EventsGateway);


/***/ }),
/* 56 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

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
exports.SavedataService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(23);
const path = __webpack_require__(24);
let SavedataService = class SavedataService {
    getSessionState(nSisid, sessions) {
        if (!sessions.has(nSisid)) {
            sessions.set(nSisid, {
                sessionDate: '',
                currentPageData: [],
                pageNumber: 1,
            });
        }
        return sessions.get(nSisid);
    }
    async saveData(msg, sessions, folerName, calculatedPage, currentSessionLines) {
        if (!currentSessionLines) {
            currentSessionLines = 25;
        }
        if (!msg || !msg.d || !msg.d.length)
            return;
        try {
            let sessionState = this.getSessionState(msg.date, sessions);
            if (calculatedPage !== sessionState.pageNumber) {
                this.writeJSONToFile(sessionState.currentPageData, `./${folerName}/dt_${msg.date}/page_${sessionState.pageNumber}.json`);
                sessionState.currentPageData = [];
                console.log('\n\r\n\rCLEARING OLS DATA for page');
                sessionState.pageNumber = calculatedPage;
            }
            this.pushDataToArray(msg, sessionState, folerName, currentSessionLines);
        }
        catch (error) {
            console.log('error at saveData', error);
        }
    }
    async saveLostData(data, pageNumber, sessionId) {
        try {
            if (sessionId && data && pageNumber) {
                this.writeJSONToFile(data, `./data/dt_${sessionId}/page_${pageNumber}.json`);
            }
        }
        catch (error) {
            console.log('error at saveLostData', error);
        }
    }
    pushDataToArray(msg, sessionState, folerName, currentSessionLines) {
        let crLine;
        for (let y of msg.d) {
            if (y.length && y[2] !== undefined) {
                let vl = (y[2] / currentSessionLines) + 1;
                let tmpPg = parseInt(vl);
                if (tmpPg == sessionState.pageNumber) {
                    let vl2 = ((y[2] % currentSessionLines));
                    crLine = parseInt(vl2);
                    sessionState.currentPageData[crLine] = y;
                }
            }
        }
        this.writeJSONToFile(sessionState.currentPageData, `./${folerName}/dt_${msg.date}/page_${sessionState.pageNumber}.json`);
    }
    async writeJSONToFile(obj, filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const dirPath = path.dirname(fullPath);
            await fs_1.promises.mkdir(dirPath, { recursive: true });
            const jsonData = JSON.stringify(obj, null, 2);
            await fs_1.promises.writeFile(fullPath, jsonData);
        }
        catch (err) {
            console.error("Error writing file:", err);
        }
    }
    async saveDataFinal(data, sessions, folderName, pageNumber, currentSessionLines) {
        try {
            if (data && folderName && pageNumber) {
                const sessionId = data.date;
                const filePath = `./${folderName}/dt_${sessionId}/page_${pageNumber}.json`;
                await this.writeJSONToFile(data, filePath);
            }
        }
        catch (error) {
            console.log('error at saveDataFinal', error);
        }
    }
};
exports.SavedataService = SavedataService;
exports.SavedataService = SavedataService = __decorate([
    (0, common_1.Injectable)()
], SavedataService);


/***/ }),
/* 58 */
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
var StreamDataService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDataService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(23);
const path = __webpack_require__(24);
const socket_io_1 = __webpack_require__(20);
const common_2 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
let StreamDataService = StreamDataService_1 = class StreamDataService {
    constructor(io, config) {
        this.io = io;
        this.config = config;
        this.stringToAscii = (str) => {
            let asciiArray = [];
            for (let i = 0; i < str.length; i++) {
                asciiArray.push(str.charCodeAt(i));
            }
            return asciiArray;
        };
        this.streamDataUsers = [];
        this.logger = new common_1.Logger(StreamDataService_1.name);
    }
    async streamData(folder, userId, data, callback, annotations, highlights) {
        debugger;
        const folderPath = `${folder}/dt_${data.nSesid}`;
        try {
            const files = await fs_1.promises.readdir(folderPath);
            this.logger.verbose(`There are ${files.length} files in the directory.`);
            try {
                files.sort((a, b) => parseInt(a.replace(/\D+/g, '')) - parseInt(b.replace(/\D+/g, '')));
            }
            catch (error) {
            }
            for (const file of files.reverse()) {
                const pgNo = parseInt(file.replace(/\D+/g, ''));
                const filePath = path.join(folderPath, file);
                try {
                    let recData = await this.processFile(filePath);
                    if (recData) {
                        const aDATA = [], hDATA = [];
                        if (annotations) {
                            aDATA.push(...annotations.filter(a => Number(a.pageIndex) == pgNo));
                        }
                        if (highlights) {
                            hDATA.push(...highlights.filter(a => Number(a.cPageno) == pgNo));
                        }
                        this.io["server"].to(userId).emit('previous-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab });
                    }
                }
                catch (error) {
                    this.logger.error(`Error in fetch`, error?.message);
                }
            }
            callback({ msg: 1 });
        }
        catch (err) {
            callback({ msg: -1 });
        }
    }
    async streamDataByPage(folder, userId, data, callback, annotations, highlights, pages) {
        pages = pages || 0;
        pages = Number(pages);
        const folderPath = `${folder}/dt_${data.nSesid}`;
        try {
            const files = await fs_1.promises.readdir(folderPath);
            try {
                files.sort((a, b) => parseInt(a.replace(/\D+/g, '')) - parseInt(b.replace(/\D+/g, '')));
            }
            catch (error) {
            }
            for (const file of files) {
                const pgNo = parseInt(file.replace(/\D+/g, ''));
                if (pgNo >= pages) {
                    const filePath = path.join(folderPath, file);
                    try {
                        let recData = await this.processFile(filePath);
                        if (recData) {
                            const aDATA = [], hDATA = [];
                            if (annotations) {
                                aDATA.push(...annotations.filter(a => Number(a.pageIndex) == pgNo));
                            }
                            if (highlights) {
                                hDATA.push(...highlights.filter(a => Number(a.cPageno) == pgNo));
                            }
                            this.io["server"].to(userId).emit('missing-data', { msg: 1, page: pgNo, data: recData, totalPages: files.length, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab, last: pgNo == pages });
                        }
                    }
                    catch (error) {
                    }
                    await this.delayFN(100);
                }
            }
            callback({ msg: 1 });
        }
        catch (err) {
            callback({ msg: -1 });
        }
    }
    stopDemoStream(userId) {
        const ind = this.streamDataUsers.findIndex(a => a == userId);
        if (ind > -1) {
            this.streamDataUsers.splice(ind, 1);
        }
    }
    getUserStatus(userId) {
        try {
            return this.streamDataUsers.includes(userId);
        }
        catch (error) {
            return false;
        }
    }
    async streamDemoData(userId, data) {
        try {
            this.stopDemoStream(userId);
        }
        catch (error) {
        }
        this.streamDataUsers.push(userId);
        const FilePath = `${this.config.get('REALTIME_PATH')}/demo-stream.json`;
        try {
            let recData = await this.processFile(FilePath);
            if (recData) {
                const allData = JSON.parse(recData);
                if (!allData.length)
                    return;
                let globalLineNo = 0;
                const processPage = async (ind) => {
                    try {
                        if (!this.getUserStatus(userId))
                            return;
                        const page = allData[ind];
                        if (page && page.data && page.data.length) {
                            for (let x of page.data) {
                                if (!this.getUserStatus(userId))
                                    break;
                                const lineAchii = this.stringToAscii(x.lines[0]);
                                if (lineAchii.length) {
                                    for (let index = 0; index < lineAchii.length; index++) {
                                        if (!this.getUserStatus(userId))
                                            break;
                                        const newText = lineAchii.slice(0, index + 1);
                                        const SendArray = [x.time, newText, globalLineNo];
                                        let datas = {
                                            i: globalLineNo,
                                            d: [SendArray],
                                            date: data.nSesid,
                                            l: 25,
                                            p: page.page
                                        };
                                        await this.delayFN(40);
                                        this.io["server"].to(userId).emit('demo-message', datas);
                                    }
                                }
                                globalLineNo++;
                            }
                        }
                    }
                    catch (error) {
                    }
                    if ((ind + 1) < allData.length) {
                        processPage(ind + 1);
                    }
                };
                processPage(0);
            }
        }
        catch (error) {
        }
    }
    async streamDemoData1(userId, data) {
        try {
            this.stopDemoStream(userId);
        }
        catch (error) {
        }
        this.streamDataUsers.push(userId);
        const FilePath = `${this.config.get('REALTIME_PATH')}demo-stream.json`;
        try {
            let recData = await this.processFile(FilePath);
            if (recData) {
                const allData = JSON.parse(recData);
                if (!allData.length)
                    return;
                var process = async (ind) => {
                    try {
                        if (!this.getUserStatus(userId))
                            return;
                        const page = allData[ind];
                        if (page && page.data && page.data.length) {
                            for (let x of page.data) {
                                if (!this.getUserStatus(userId))
                                    break;
                                if (x) {
                                    const lineAchii = this.stringToAscii(x.lines[0]);
                                    if (lineAchii.length) {
                                        for (let [index, y] of lineAchii.entries()) {
                                            if (!this.getUserStatus(userId))
                                                break;
                                            const newText = [...lineAchii];
                                            const SendArray = [x.time, newText.splice(0, index), x.lineIndex];
                                            let datas = {
                                                i: x.lineIndex,
                                                d: [SendArray],
                                                date: data.nSesid,
                                                l: 25,
                                                p: page.page,
                                            };
                                            await this.delayFN(20);
                                            this.io["server"].to(userId).emit('demo-message', datas);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    catch (error) {
                    }
                    if ((ind + 1) < allData.length) {
                        process(ind + 1);
                    }
                };
                process(0);
            }
        }
        catch (error) {
        }
    }
    async sendFailedSessions(socket, pages, nSesid) {
        return new Promise(async (resolve, reject) => {
            const folderPath = `localdata/dt_${nSesid}`;
            try {
                if (pages.length) {
                    try {
                        pages.unshift(pages[0] - 2, pages[0] - 1);
                    }
                    catch (error) {
                    }
                    for (const pageNo of pages) {
                        try {
                            if (pageNo > 0) {
                                const filePath = path.join(folderPath, `page_${pageNo}.json`);
                                let recData = await this.processFile(filePath);
                                if (recData) {
                                    recData = JSON.parse(recData);
                                    if (recData && recData.length) {
                                        socket.emit('lost-data', { msg: 1, page: pageNo, data: recData, totalPages: pages.length, nSesid: nSesid, a: [], h: [] });
                                    }
                                }
                            }
                        }
                        catch (error) {
                        }
                    }
                }
            }
            catch (error) {
            }
            resolve(true);
        });
    }
    async processFile(filePath) {
        const data = await fs_1.promises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }
    delayFN(val) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, val);
        });
    }
    getDate() {
        const date = new Date();
        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    }
};
exports.StreamDataService = StreamDataService;
exports.StreamDataService = StreamDataService = StreamDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_2.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], StreamDataService);


/***/ }),
/* 59 */
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
exports.SyncService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(8);
const issue_service_1 = __webpack_require__(26);
let SyncService = class SyncService {
    constructor(db, issueService) {
        this.db = db;
        this.issueService = issueService;
    }
    async updateIssues(body) {
        let res = await this.db.executeRef('realtime_sync_issueupdate', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async updateIssuesDetail(body) {
        let res = await this.db.executeRef('realtime_sync_issuedetail_update', body);
        if (res.success) {
            try {
                this.scyncDataForAnnotations(res.data[0][0], 'ID');
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async updateHighlights(body) {
        let res = await this.db.executeRef('realtime_sync_highlight_update', body);
        if (res.success) {
            try {
                if (res.data[0][0]["jPages"]?.length) {
                    this.scyncDataForAnnotations(res.data[0][0], 'HI');
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async DeleteData(body) {
        let res = await this.db.executeRef('realtime_sync_delete', body);
        if (res.success) {
            try {
                console.log('DELETE DATA', res.data);
                if (res.data[0][0]["jIssues"]?.length) {
                    this.scyncDataForAnnotations(res.data[0][0], 'ID-DELETE');
                }
                if (res.data[0][0]["jPages"]?.length) {
                    this.scyncDataForAnnotations(res.data[0][0], 'HI');
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async PushLogData(body) {
        let res = await this.db.executeRef('realtime_sync_logs', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async sessionusers(body) {
        let res = await this.db.executeRef('realtime_sync_session_users', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async codemastersdata(body) {
        let res = await this.db.executeRef('realtime_coremaster_data', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async sessionDetail(body) {
        let res = await this.db.executeRef('realtime_sync_sessiondetail', body);
        if (res.success) {
            try {
                console.log('TOTAL EFFECTED', res.data[0][0]["jDetail"]?.length);
                if (res.data[0][0]["jDetail"]?.length) {
                    this.scyncDataForAnnotations(res.data[0][0], 'SD');
                }
            }
            catch (error) {
                console.log(error);
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async scyncDataForAnnotations(mdl, type) {
        try {
            if (type == 'ID') {
                const ids = [...mdl.jNIssue, ...mdl.jUpdated];
                const users = [...new Set(ids.map(a => a.nUserid))];
                users.forEach(async (user) => {
                    const jIssueIds = [...new Set(ids.filter(a => a.nUserid == user).map(a => a.nIDid))];
                    if (this.server) {
                        this.server.to(`U${user}`).emit('realtime-events', { jIssueIds, type: 'ID' });
                    }
                });
            }
            else if (type == 'ID-DELETE') {
                const ids = mdl.jIssues;
                const users = [...new Set(ids.map(a => a.nUserid))];
                users.forEach(async (user) => {
                    const jIssueIds = [...new Set(ids.filter(a => a.nUserid == user).map(a => a.nIDid))];
                    if (this.server) {
                        this.server.to(`U${user}`).emit('realtime-events', { jIssueIds, type: 'ID-DELETE' });
                    }
                });
            }
            else if (type == 'HI') {
                const ids = mdl.jPages;
                const users = [...new Set(ids.map(a => a.nUserid))];
                users.forEach(async (user) => {
                    const jPages = [...new Set(ids.filter(a => a.nUserid == user).filter(a => a.cPageno).map(a => a.cPageno))];
                    if (this.server) {
                        this.server.to(`U${user}`).emit('realtime-events', { jPages, type: 'HI' });
                    }
                });
            }
            else if (type == 'SD') {
                const ids = mdl.jDetail || [];
                const users = [...new Set(ids.map(a => a.nUserid))];
                users.forEach(async (user) => {
                    console.log('Sending to ', user);
                    if (this.server) {
                        this.server.to(`U${user}`).emit('realtime-events', { type: 'SD' });
                    }
                });
            }
        }
        catch (error) {
            console.log(error);
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _b : Object])
], SyncService);


/***/ }),
/* 60 */
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
exports.WebSocketModule = exports.AppGateway = void 0;
const common_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(56);
const socket_io_1 = __webpack_require__(20);
let AppGateway = class AppGateway {
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object)
], AppGateway.prototype, "server", void 0);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)()
], AppGateway);
let WebSocketModule = class WebSocketModule {
};
exports.WebSocketModule = WebSocketModule;
exports.WebSocketModule = WebSocketModule = __decorate([
    (0, common_1.Module)({
        providers: [
            AppGateway,
            {
                provide: 'WEB_SOCKET_SERVER',
                useExisting: AppGateway
            }
        ],
        exports: ['WEB_SOCKET_SERVER', AppGateway]
    })
], WebSocketModule);


/***/ }),
/* 61 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueController = void 0;
const common_1 = __webpack_require__(3);
const issue_interface_1 = __webpack_require__(62);
const issue_service_1 = __webpack_require__(26);
const swagger_1 = __webpack_require__(11);
let IssueController = class IssueController {
    constructor(issu) {
        this.issu = issu;
    }
    async getList(query) {
        return await this.issu.getIssueCategory(query);
    }
    async getIssueDetails(query) {
        return this.issu.getIssueDetails(query);
    }
    async getIssueDetailsAnnot(body) {
        return this.issu.getIssueDetailsAnnot(body);
    }
    async insertIssue(body) {
        return this.issu.handleIssue(body, 'I');
    }
    async updateIssue(body) {
        return this.issu.handleIssue(body, 'U');
    }
    async deleteIssue(body) {
        return this.issu.deleteIssue(body);
    }
    async getIssueList(query) {
        return this.issu.getIssueList(query);
    }
    async insertIssueCategory(body) {
        return this.issu.handleIssueCategory(body, 'I');
    }
    async updateIssueCategory(body) {
        return this.issu.handleIssueCategory(body, 'U');
    }
    async deleteIssueCategory(body) {
        console.log('deleteCategory');
        return this.issu.deleteIssueCategory(body);
    }
    async insertIssueDetail(body) {
        console.log('insertIssueDetail', body);
        return this.issu.executeIssueDetailOperation(body, 'I');
    }
    async insertHighlights(body) {
        console.log('insertIssueDetail', body);
        return this.issu.insertHighlights(body, 'I');
    }
    async removemultihighlights(body) {
        console.log('insertIssueDetail', body);
        return this.issu.removemultihighlights(body);
    }
    async deleteHighlights(body) {
        console.log('deleteHighlights', body);
        return this.issu.deleteHighlights(body, 'D');
    }
    async GetHighlightList(query) {
        return this.issu.GetHighlightLists(query);
    }
    async updateIssueDetail(body) {
        return this.issu.executeIssueDetailOperation(body, 'U');
    }
    async deleteIssueDetail(body) {
        return this.issu.executeIssueDetailOperation(body, 'D');
    }
    async getIssueDetailbyIsuseid(query) {
        return this.issu.getIssueDetailby_issue_id(query);
    }
    async getIssueAnnotationList(query) {
        return this.issu.getIssueAnnotationList(query);
    }
    async getIssueDetailById(query) {
        return this.issu.getIssueDetailById(query);
    }
    async dynamiccombo(query) {
        return await this.issu.getcCodeMaster(query);
    }
    async updateHighlightIssueIds(body) {
        console.log('insertIssueDetail', body);
        return this.issu.updateHighlightIssueIds(body);
    }
    async getArrengedIssue(query) {
        return this.issu.FilterLastSelecedIssued(query);
    }
    async getAnnotHighlightExport(body) {
        return this.issu.getAnnotHighlightExport(body);
    }
    async getAnnotationOfPages(body) {
        return this.issu.getAnnotationOfPages(body);
    }
    async deletedemoissuedetail(body) {
        console.log('deleteCategory');
        return this.issu.deleteDemoIssueDetails(body);
    }
    async serverBuilder(body) {
        try {
            return await this.issu.updateIssueDetail(body);
            ;
        }
        catch (error) {
            return { msg: -1, error: error.message };
        }
    }
    async updateIssueNote(body) {
        try {
            return await this.issu.updateIssueDetailNote(body);
            ;
        }
        catch (error) {
            return { msg: -1, error: error.message };
        }
    }
    async getIssueAnnots(query) {
        return this.issu.getIssueDetail(query);
    }
    async getQfactList(query) {
        return await this.issu.getQfactList(query);
    }
    async getQmarkList(query) {
        return await this.issu.getQmarkList(query);
    }
    async getAllFactList(query) {
        return await this.issu.getAllFactList(query);
    }
    async checkNavigatedata(query) {
        return this.issu.checkNavigatedata(query);
    }
    async getIssuebyid(query) {
        return this.issu.getIssuebyid(query);
    }
    async deleteMultiIssue(body) {
        return this.issu.deleteMultiIssue(body);
    }
    async issueSecquence(body) {
        return this.issu.issueSequence(body);
    }
    async claimSecquence(body) {
        return this.issu.claimSequence(body);
    }
    async qfactSecquence(body) {
        return this.issu.qfactSequence(body);
    }
    async qfactClaimSecquence(body) {
        return this.issu.qfactClaimSequence(body);
    }
    async getIssueListGroup(query) {
        return this.issu.getIssueListGroup(query);
    }
    async updateClaimDetail(body) {
        return this.issu.updateClaimDetail(body);
    }
    async deleteClaimDetail(body) {
        return this.issu.deleteClaim(body);
    }
};
exports.IssueController = IssueController;
__decorate([
    (0, common_1.Get)('getIssueCategorylist'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof issue_interface_1.catListParam !== "undefined" && issue_interface_1.catListParam) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], IssueController.prototype, "getList", null);
__decorate([
    (0, common_1.Get)('getissuedetails'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof issue_interface_1.GetIssueDetailsParam !== "undefined" && issue_interface_1.GetIssueDetailsParam) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], IssueController.prototype, "getIssueDetails", null);
__decorate([
    (0, common_1.Post)('getIssueAnnot'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof issue_interface_1.GetIssueDetailsGroupedParam !== "undefined" && issue_interface_1.GetIssueDetailsGroupedParam) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], IssueController.prototype, "getIssueDetailsAnnot", null);
__decorate([
    (0, common_1.Post)('insertIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof issue_interface_1.IssueRequestBody !== "undefined" && issue_interface_1.IssueRequestBody) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], IssueController.prototype, "insertIssue", null);
__decorate([
    (0, common_1.Put)('updateIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof issue_interface_1.IssueRequestBody !== "undefined" && issue_interface_1.IssueRequestBody) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], IssueController.prototype, "updateIssue", null);
__decorate([
    (0, common_1.Delete)('deleteIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof issue_interface_1.deleteIssueRequestBody !== "undefined" && issue_interface_1.deleteIssueRequestBody) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], IssueController.prototype, "deleteIssue", null);
__decorate([
    (0, common_1.Get)('issuelist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof issue_interface_1.IssueListParam !== "undefined" && issue_interface_1.IssueListParam) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], IssueController.prototype, "getIssueList", null);
__decorate([
    (0, common_1.Post)('insertCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof issue_interface_1.IssueCategoryRequestBody !== "undefined" && issue_interface_1.IssueCategoryRequestBody) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], IssueController.prototype, "insertIssueCategory", null);
__decorate([
    (0, common_1.Put)('updateCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof issue_interface_1.IssueCategoryRequestBody !== "undefined" && issue_interface_1.IssueCategoryRequestBody) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], IssueController.prototype, "updateIssueCategory", null);
__decorate([
    (0, common_1.Delete)('deleteCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof issue_interface_1.DeleteIssueCategoryParam !== "undefined" && issue_interface_1.DeleteIssueCategoryParam) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], IssueController.prototype, "deleteIssueCategory", null);
__decorate([
    (0, common_1.Post)('insertIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof issue_interface_1.InsertIssueDetailRequestBody !== "undefined" && issue_interface_1.InsertIssueDetailRequestBody) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], IssueController.prototype, "insertIssueDetail", null);
__decorate([
    (0, common_1.Post)('insertHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof issue_interface_1.InsertHighlightsRequestBody !== "undefined" && issue_interface_1.InsertHighlightsRequestBody) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], IssueController.prototype, "insertHighlights", null);
__decorate([
    (0, common_1.Post)('removemultihighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof issue_interface_1.removeMultipleHighlightsReq !== "undefined" && issue_interface_1.removeMultipleHighlightsReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], IssueController.prototype, "removemultihighlights", null);
__decorate([
    (0, common_1.Delete)('deleteHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof issue_interface_1.deleteHighlightsParam !== "undefined" && issue_interface_1.deleteHighlightsParam) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], IssueController.prototype, "deleteHighlights", null);
__decorate([
    (0, common_1.Get)('GetHighlightList'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof issue_interface_1.HighlightListParam !== "undefined" && issue_interface_1.HighlightListParam) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], IssueController.prototype, "GetHighlightList", null);
__decorate([
    (0, common_1.Put)('updateIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof issue_interface_1.UpdateIssueDetailRequestBody !== "undefined" && issue_interface_1.UpdateIssueDetailRequestBody) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], IssueController.prototype, "updateIssueDetail", null);
__decorate([
    (0, common_1.Delete)('deleteIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof issue_interface_1.DeleteIssueDetailParam !== "undefined" && issue_interface_1.DeleteIssueDetailParam) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], IssueController.prototype, "deleteIssueDetail", null);
__decorate([
    (0, common_1.Get)('getIssueDetailByIssueId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_11 = typeof issue_interface_1.issuedetaillist_by_issueidBody !== "undefined" && issue_interface_1.issuedetaillist_by_issueidBody) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], IssueController.prototype, "getIssueDetailbyIsuseid", null);
__decorate([
    (0, common_1.Get)('getIssueAnnotationList'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_13 = typeof issue_interface_1.getIssueAnnotationListBody !== "undefined" && issue_interface_1.getIssueAnnotationListBody) === "function" ? _13 : Object]),
    __metadata("design:returntype", typeof (_14 = typeof Promise !== "undefined" && Promise) === "function" ? _14 : Object)
], IssueController.prototype, "getIssueAnnotationList", null);
__decorate([
    (0, common_1.Get)('getIssueDetailById'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_15 = typeof issue_interface_1.isseDetailByIdBody !== "undefined" && issue_interface_1.isseDetailByIdBody) === "function" ? _15 : Object]),
    __metadata("design:returntype", typeof (_16 = typeof Promise !== "undefined" && Promise) === "function" ? _16 : Object)
], IssueController.prototype, "getIssueDetailById", null);
__decorate([
    (0, common_1.Get)('dynamiccombo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_17 = typeof issue_interface_1.dynamicComboReq !== "undefined" && issue_interface_1.dynamicComboReq) === "function" ? _17 : Object]),
    __metadata("design:returntype", typeof (_18 = typeof Promise !== "undefined" && Promise) === "function" ? _18 : Object)
], IssueController.prototype, "dynamiccombo", null);
__decorate([
    (0, common_1.Post)('updateHighlightIssueIds'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_19 = typeof issue_interface_1.updateHighlightIssueIdsReq !== "undefined" && issue_interface_1.updateHighlightIssueIdsReq) === "function" ? _19 : Object]),
    __metadata("design:returntype", typeof (_20 = typeof Promise !== "undefined" && Promise) === "function" ? _20 : Object)
], IssueController.prototype, "updateHighlightIssueIds", null);
__decorate([
    (0, common_1.Get)('getLastIssue'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_21 = typeof issue_interface_1.getLastIssueMDL !== "undefined" && issue_interface_1.getLastIssueMDL) === "function" ? _21 : Object]),
    __metadata("design:returntype", typeof (_22 = typeof Promise !== "undefined" && Promise) === "function" ? _22 : Object)
], IssueController.prototype, "getArrengedIssue", null);
__decorate([
    (0, common_1.Post)('annothighlightexport'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_23 = typeof issue_interface_1.getAnnotHighlightEEP !== "undefined" && issue_interface_1.getAnnotHighlightEEP) === "function" ? _23 : Object]),
    __metadata("design:returntype", typeof (_24 = typeof Promise !== "undefined" && Promise) === "function" ? _24 : Object)
], IssueController.prototype, "getAnnotHighlightExport", null);
__decorate([
    (0, common_1.Post)('getannotationofpages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_25 = typeof issue_interface_1.getIssueAnnotationListBody !== "undefined" && issue_interface_1.getIssueAnnotationListBody) === "function" ? _25 : Object]),
    __metadata("design:returntype", typeof (_26 = typeof Promise !== "undefined" && Promise) === "function" ? _26 : Object)
], IssueController.prototype, "getAnnotationOfPages", null);
__decorate([
    (0, common_1.Post)('deletedemoissuedetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_27 = typeof Promise !== "undefined" && Promise) === "function" ? _27 : Object)
], IssueController.prototype, "deletedemoissuedetail", null);
__decorate([
    (0, common_1.Post)('setdefault'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_28 = typeof issue_interface_1.defaultSetupReq !== "undefined" && issue_interface_1.defaultSetupReq) === "function" ? _28 : Object]),
    __metadata("design:returntype", typeof (_29 = typeof Promise !== "undefined" && Promise) === "function" ? _29 : Object)
], IssueController.prototype, "serverBuilder", null);
__decorate([
    (0, common_1.Post)('update/issuedetail/note'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_30 = typeof issue_interface_1.updateDetailIssueNote !== "undefined" && issue_interface_1.updateDetailIssueNote) === "function" ? _30 : Object]),
    __metadata("design:returntype", typeof (_31 = typeof Promise !== "undefined" && Promise) === "function" ? _31 : Object)
], IssueController.prototype, "updateIssueNote", null);
__decorate([
    (0, common_1.Get)('issuedetail/annotations'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_32 = typeof issue_interface_1.annotationsReq !== "undefined" && issue_interface_1.annotationsReq) === "function" ? _32 : Object]),
    __metadata("design:returntype", typeof (_33 = typeof Promise !== "undefined" && Promise) === "function" ? _33 : Object)
], IssueController.prototype, "getIssueAnnots", null);
__decorate([
    (0, common_1.Get)('qfacts/list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_34 = typeof issue_interface_1.GetQfactList !== "undefined" && issue_interface_1.GetQfactList) === "function" ? _34 : Object]),
    __metadata("design:returntype", typeof (_35 = typeof Promise !== "undefined" && Promise) === "function" ? _35 : Object)
], IssueController.prototype, "getQfactList", null);
__decorate([
    (0, common_1.Get)('qmarks/list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_36 = typeof issue_interface_1.GetQmarkList !== "undefined" && issue_interface_1.GetQmarkList) === "function" ? _36 : Object]),
    __metadata("design:returntype", typeof (_37 = typeof Promise !== "undefined" && Promise) === "function" ? _37 : Object)
], IssueController.prototype, "getQmarkList", null);
__decorate([
    (0, common_1.Get)('all/facts/list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_38 = typeof issue_interface_1.GetAllFactList !== "undefined" && issue_interface_1.GetAllFactList) === "function" ? _38 : Object]),
    __metadata("design:returntype", typeof (_39 = typeof Promise !== "undefined" && Promise) === "function" ? _39 : Object)
], IssueController.prototype, "getAllFactList", null);
__decorate([
    (0, common_1.Get)('navigate/checkdata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_40 = typeof issue_interface_1.CheckNavigatedata !== "undefined" && issue_interface_1.CheckNavigatedata) === "function" ? _40 : Object]),
    __metadata("design:returntype", typeof (_41 = typeof Promise !== "undefined" && Promise) === "function" ? _41 : Object)
], IssueController.prototype, "checkNavigatedata", null);
__decorate([
    (0, common_1.Get)('detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_42 = typeof issue_interface_1.IssueByidParam !== "undefined" && issue_interface_1.IssueByidParam) === "function" ? _42 : Object]),
    __metadata("design:returntype", typeof (_43 = typeof Promise !== "undefined" && Promise) === "function" ? _43 : Object)
], IssueController.prototype, "getIssuebyid", null);
__decorate([
    (0, common_1.Delete)('delete/multi/issue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_44 = typeof issue_interface_1.deleteIssueRequestBody !== "undefined" && issue_interface_1.deleteIssueRequestBody) === "function" ? _44 : Object]),
    __metadata("design:returntype", typeof (_45 = typeof Promise !== "undefined" && Promise) === "function" ? _45 : Object)
], IssueController.prototype, "deleteMultiIssue", null);
__decorate([
    (0, common_1.Post)('sequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_46 = typeof issue_interface_1.issueSequenceParam !== "undefined" && issue_interface_1.issueSequenceParam) === "function" ? _46 : Object]),
    __metadata("design:returntype", typeof (_47 = typeof Promise !== "undefined" && Promise) === "function" ? _47 : Object)
], IssueController.prototype, "issueSecquence", null);
__decorate([
    (0, common_1.Post)('claim/sequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_48 = typeof issue_interface_1.claimSequenceParam !== "undefined" && issue_interface_1.claimSequenceParam) === "function" ? _48 : Object]),
    __metadata("design:returntype", typeof (_49 = typeof Promise !== "undefined" && Promise) === "function" ? _49 : Object)
], IssueController.prototype, "claimSecquence", null);
__decorate([
    (0, common_1.Post)('qfact/sequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_50 = typeof issue_interface_1.qfactSequenceParam !== "undefined" && issue_interface_1.qfactSequenceParam) === "function" ? _50 : Object]),
    __metadata("design:returntype", typeof (_51 = typeof Promise !== "undefined" && Promise) === "function" ? _51 : Object)
], IssueController.prototype, "qfactSecquence", null);
__decorate([
    (0, common_1.Post)('qfact/claim/sequence'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_52 = typeof issue_interface_1.qfactClaimSequenceParam !== "undefined" && issue_interface_1.qfactClaimSequenceParam) === "function" ? _52 : Object]),
    __metadata("design:returntype", typeof (_53 = typeof Promise !== "undefined" && Promise) === "function" ? _53 : Object)
], IssueController.prototype, "qfactClaimSecquence", null);
__decorate([
    (0, common_1.Get)('issuelist_V2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_54 = typeof issue_interface_1.IssueListParam !== "undefined" && issue_interface_1.IssueListParam) === "function" ? _54 : Object]),
    __metadata("design:returntype", typeof (_55 = typeof Promise !== "undefined" && Promise) === "function" ? _55 : Object)
], IssueController.prototype, "getIssueListGroup", null);
__decorate([
    (0, common_1.Put)('updateClaimDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_56 = typeof issue_interface_1.UpdateClaimRequestBody !== "undefined" && issue_interface_1.UpdateClaimRequestBody) === "function" ? _56 : Object]),
    __metadata("design:returntype", typeof (_57 = typeof Promise !== "undefined" && Promise) === "function" ? _57 : Object)
], IssueController.prototype, "updateClaimDetail", null);
__decorate([
    (0, common_1.Delete)('deleteClaim'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_58 = typeof issue_interface_1.deleteClaimRequestBody !== "undefined" && issue_interface_1.deleteClaimRequestBody) === "function" ? _58 : Object]),
    __metadata("design:returntype", typeof (_59 = typeof Promise !== "undefined" && Promise) === "function" ? _59 : Object)
], IssueController.prototype, "deleteClaimDetail", null);
exports.IssueController = IssueController = __decorate([
    (0, swagger_1.ApiTags)('Issue'),
    (0, common_1.Controller)('issue'),
    __metadata("design:paramtypes", [typeof (_a = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _a : Object])
], IssueController);


/***/ }),
/* 62 */
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
exports.qfactClaimSequenceParam = exports.qfactSequenceParam = exports.deleteClaimRequestBody = exports.UpdateClaimRequestBody = exports.claimSequenceParam = exports.issueSequenceParam = exports.IssueByidParam = exports.CheckNavigatedata = exports.GetAllFactList = exports.GetQmarkList = exports.GetQfactList = exports.annotationsReq = exports.updateDetailIssueNote = exports.defaultSetupReq = exports.getAnnotHighlightEEP = exports.getLastIssueMDL = exports.updateHighlightIssueIdsReq = exports.dynamicComboReq = exports.deleteHighlightsParam = exports.isseDetailByIdBody = exports.issuedetaillist_by_issueidBody = exports.getIssueAnnotationListBody = exports.removeMultipleHighlightsReq = exports.InsertHighlightsRequestBody = exports.HighlightListParam = exports.deleteHighlightsRequestBody = exports.DeleteIssueDetailParam = exports.UpdateIssueDetailRequestBody = exports.InsertIssueDetailRequestBody = exports.DeleteIssueCategoryParam = exports.IssueCategoryRequestBody = exports.IssueListParam = exports.deleteIssueRequestBody = exports.IssueRequestBody = exports.GetIssueDetailsGroupedParam = exports.GetIssueDetailsParam = exports.catListParam = void 0;
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
class BaseSessionDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nUserid", void 0);
class catListParam {
}
exports.catListParam = catListParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], catListParam.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], catListParam.prototype, "nUserid", void 0);
class GetIssueDetailsParam {
}
exports.GetIssueDetailsParam = GetIssueDetailsParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetIssueDetailsParam.prototype, "nIDid", void 0);
class GetIssueDetailsGroupedParam extends BaseSessionDetail {
}
exports.GetIssueDetailsGroupedParam = GetIssueDetailsGroupedParam;
class IssueRequestBody {
}
exports.IssueRequestBody = IssueRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "nIid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Issue Name', description: 'Issue Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "cIName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '000000', description: 'Color Code', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "cColor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Category ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: ' Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "dCreatedt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Update Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "dUpdatedt", void 0);
class deleteIssueRequestBody {
}
exports.deleteIssueRequestBody = deleteIssueRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], deleteIssueRequestBody.prototype, "nIid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Issue ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], deleteIssueRequestBody.prototype, "jIids", void 0);
class IssueListParam extends BaseSessionDetail {
}
exports.IssueListParam = IssueListParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue detail id only in edit mode' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueListParam.prototype, "nIDid", void 0);
class IssueCategoryRequestBody {
}
exports.IssueCategoryRequestBody = IssueCategoryRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Category ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category Name', description: 'Category Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "cCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "dCreateDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Update Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "dUpdateDt", void 0);
class DeleteIssueCategoryParam {
}
exports.DeleteIssueCategoryParam = DeleteIssueCategoryParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Category ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteIssueCategoryParam.prototype, "nICid", void 0);
class cordinates {
}
class issueIds {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], issueIds.prototype, "nIid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => String(value), { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], issueIds.prototype, "serialno", void 0);
class issueMapping {
}
class BaseIssueDetailRequestBody extends BaseSessionDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Original Note text', description: 'Note', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "cONote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Note text', description: 'Note', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "cNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'User Note text', description: 'User Note', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "cUNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BaseIssueDetailRequestBody.prototype, "cIidStr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Last Issue id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "nLID", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1', description: 'Page Number', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "cPageno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [cordinates], example: [{ x: 100, y: 200 }], description: 'Coordinates', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BaseIssueDetailRequestBody.prototype, "jCordinates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1', description: 'Transcript', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BaseIssueDetailRequestBody.prototype, "cTranscript", void 0);
class InsertIssueDetailRequestBody extends BaseIssueDetailRequestBody {
}
exports.InsertIssueDetailRequestBody = InsertIssueDetailRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertIssueDetailRequestBody.prototype, "dCreatedt", void 0);
class UpdateIssueDetailRequestBody extends BaseIssueDetailRequestBody {
}
exports.UpdateIssueDetailRequestBody = UpdateIssueDetailRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateIssueDetailRequestBody.prototype, "nIDid", void 0);
class DeleteIssueDetailParam {
}
exports.DeleteIssueDetailParam = DeleteIssueDetailParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteIssueDetailParam.prototype, "nIDid", void 0);
class deleteHighlightsRequestBody {
}
exports.deleteHighlightsRequestBody = deleteHighlightsRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Highlighted id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteHighlightsRequestBody.prototype, "nHid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'masterid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], deleteHighlightsRequestBody.prototype, "nMasterid", void 0);
class HighlightListParam extends BaseSessionDetail {
}
exports.HighlightListParam = HighlightListParam;
class InsertHighlightsRequestBody extends BaseSessionDetail {
}
exports.InsertHighlightsRequestBody = InsertHighlightsRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Highlight text', description: 'Highlight text', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "cNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1', description: 'Page Number', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "cPageno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '10', description: 'Line Number', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "cLineno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00:00', description: 'Timestamp', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "cTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'cTranscript', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "cTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertHighlightsRequestBody.prototype, "oP", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertHighlightsRequestBody.prototype, "oL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'line uniq identity', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "identity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'masterid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "nMasterid", void 0);
class removeMultipleHighlightsReq {
}
exports.removeMultipleHighlightsReq = removeMultipleHighlightsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"], description: 'Highlight IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], removeMultipleHighlightsReq.prototype, "jHids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], removeMultipleHighlightsReq.prototype, "nUserid", void 0);
class getIssueAnnotationListBody extends BaseSessionDetail {
}
exports.getIssueAnnotationListBody = getIssueAnnotationListBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nIDid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getIssueAnnotationListBody.prototype, "nIDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'jIssues', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getIssueAnnotationListBody.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'jPages', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getIssueAnnotationListBody.prototype, "jPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Transcript' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getIssueAnnotationListBody.prototype, "cTranscript", void 0);
class issuedetaillist_by_issueidBody extends BaseSessionDetail {
}
exports.issuedetaillist_by_issueidBody = issuedetaillist_by_issueidBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'RIssue Master id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], issuedetaillist_by_issueidBody.prototype, "nIid", void 0);
class isseDetailByIdBody {
}
exports.isseDetailByIdBody = isseDetailByIdBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], isseDetailByIdBody.prototype, "nIDid", void 0);
class deleteHighlightsParam {
}
exports.deleteHighlightsParam = deleteHighlightsParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Transcript ', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], deleteHighlightsParam.prototype, "cTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Highlight  id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteHighlightsParam.prototype, "nHid", void 0);
class dynamicComboReq {
}
exports.dynamicComboReq = dynamicComboReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nCategoryid must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], dynamicComboReq.prototype, "nCategoryid", void 0);
class HissueIds {
}
class updateHighlightIssueIdsReq extends BaseSessionDetail {
}
exports.updateHighlightIssueIdsReq = updateHighlightIssueIdsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{"nIid":"550e8400-e29b-41d4-a716-446655440000","cLast":0}]', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], updateHighlightIssueIdsReq.prototype, "cDefHIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"], description: 'Highlight IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], updateHighlightIssueIdsReq.prototype, "jHids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Last Issue id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateHighlightIssueIdsReq.prototype, "nLID", void 0);
class getLastIssueMDL {
}
exports.getLastIssueMDL = getLastIssueMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getLastIssueMDL.prototype, "jIids", void 0);
class getAnnotHighlightEEP {
}
exports.getAnnotHighlightEEP = getAnnotHighlightEEP;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Case name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cCasename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'User name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Transcript ', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Issue IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Highlight Issues IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jHIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Page', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Advanced', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bAdvanced", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Cover page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bCoverpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Fit page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bFitpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Pagination page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bPagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Q Fact', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bQfact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Quick Mark', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bQmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Timestamp', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Orientation', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cOrientation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Quick Mark size ', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cQMsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Q Fact size ', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cQFsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A4', description: 'Page size ', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cPgsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Demo ', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cIsDemo", void 0);
class defaultSetupReq {
}
exports.defaultSetupReq = defaultSetupReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "nLID", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "jDefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'H', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "cFlag", void 0);
class updateDetailIssueNote {
}
exports.updateDetailIssueNote = updateDetailIssueNote;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateDetailIssueNote.prototype, "nIDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateDetailIssueNote.prototype, "cNote", void 0);
class annotationsReq {
}
exports.annotationsReq = annotationsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSessionid id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", Number)
], annotationsReq.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", Number)
], annotationsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", Number)
], annotationsReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'Transcript', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], annotationsReq.prototype, "cTranscript", void 0);
class GetQfactList extends BaseSessionDetail {
}
exports.GetQfactList = GetQfactList;
class GetQmarkList extends BaseSessionDetail {
}
exports.GetQmarkList = GetQmarkList;
class GetAllFactList extends BaseSessionDetail {
}
exports.GetAllFactList = GetAllFactList;
class CheckNavigatedata extends BaseSessionDetail {
}
exports.CheckNavigatedata = CheckNavigatedata;
class IssueByidParam extends BaseSessionDetail {
}
exports.IssueByidParam = IssueByidParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue detail id only in edit mode' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueByidParam.prototype, "nIid", void 0);
class issueSequence {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], issueSequence.prototype, "nIid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Sequence' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], issueSequence.prototype, "nSequence", void 0);
class issueSequenceParam {
}
exports.issueSequenceParam = issueSequenceParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], issueSequenceParam.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [issueSequence], description: 'Issue Sequence', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => issueSequence),
    __metadata("design:type", Array)
], issueSequenceParam.prototype, "jIssues", void 0);
class claimSequence {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], claimSequence.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Sequence' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], claimSequence.prototype, "nSequence", void 0);
class claimSequenceParam {
}
exports.claimSequenceParam = claimSequenceParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], claimSequenceParam.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [claimSequence], description: 'claim Sequence', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => claimSequence),
    __metadata("design:type", Array)
], claimSequenceParam.prototype, "jClaims", void 0);
class UpdateClaimRequestBody {
}
exports.UpdateClaimRequestBody = UpdateClaimRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClaimRequestBody.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category Name', description: 'Category Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateClaimRequestBody.prototype, "cCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateClaimRequestBody.prototype, "nUserid", void 0);
class deleteClaimRequestBody {
}
exports.deleteClaimRequestBody = deleteClaimRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], deleteClaimRequestBody.prototype, "nICid", void 0);
class qfactSequenceItem {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], qfactSequenceItem.prototype, "nIid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'QFact-specific sequence (per-user)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], qfactSequenceItem.prototype, "nQFactSequence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Whether this issue is visible in the LEFT QFact panel for this user' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], qfactSequenceItem.prototype, "bVisible", void 0);
class qfactSequenceParam {
}
exports.qfactSequenceParam = qfactSequenceParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], qfactSequenceParam.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], qfactSequenceParam.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [qfactSequenceItem], description: 'QFact issue prefs to upsert', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => qfactSequenceItem),
    __metadata("design:type", Array)
], qfactSequenceParam.prototype, "jIssues", void 0);
class qfactClaimSequenceItem {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim (Issue Category) ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], qfactClaimSequenceItem.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'QFact-specific claim sequence (per-user)' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], qfactClaimSequenceItem.prototype, "nQFactSequence", void 0);
class qfactClaimSequenceParam {
}
exports.qfactClaimSequenceParam = qfactClaimSequenceParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], qfactClaimSequenceParam.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], qfactClaimSequenceParam.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [qfactClaimSequenceItem], description: 'QFact claim prefs to upsert', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => qfactClaimSequenceItem),
    __metadata("design:type", Array)
], qfactClaimSequenceParam.prototype, "jClaims", void 0);


/***/ }),
/* 63 */
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
exports.SyncController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const sync_service_1 = __webpack_require__(59);
const sync_interface_1 = __webpack_require__(64);
let SyncController = class SyncController {
    constructor(syncService) {
        this.syncService = syncService;
    }
    async pushIssue(body) {
        return await this.syncService.updateIssues(body);
    }
    async pushdetail(body) {
        return await this.syncService.updateIssuesDetail(body);
    }
    async pushhighlights(body) {
        return await this.syncService.updateHighlights(body);
    }
    async pushdelete(body) {
        return await this.syncService.DeleteData(body);
    }
    async pushrtlogs(body) {
        return await this.syncService.PushLogData(body);
    }
    async sessionusers(body) {
        return await this.syncService.sessionusers(body);
    }
    async codemastersdata(body) {
        return await this.syncService.codemastersdata(body);
    }
    async sessionDetail(body) {
        return await this.syncService.sessionDetail(body);
    }
};
exports.SyncController = SyncController;
__decorate([
    (0, common_1.Post)('pushissue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof sync_interface_1.pushIssueData !== "undefined" && sync_interface_1.pushIssueData) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], SyncController.prototype, "pushIssue", null);
__decorate([
    (0, common_1.Post)('pushdetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof sync_interface_1.pushIssueDetailData !== "undefined" && sync_interface_1.pushIssueDetailData) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], SyncController.prototype, "pushdetail", null);
__decorate([
    (0, common_1.Post)('pushhighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof sync_interface_1.pushHighlightData !== "undefined" && sync_interface_1.pushHighlightData) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], SyncController.prototype, "pushhighlights", null);
__decorate([
    (0, common_1.Post)('pushdelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof sync_interface_1.pushDeleteData !== "undefined" && sync_interface_1.pushDeleteData) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], SyncController.prototype, "pushdelete", null);
__decorate([
    (0, common_1.Post)('pushrtlogs'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof sync_interface_1.pushLogData !== "undefined" && sync_interface_1.pushLogData) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], SyncController.prototype, "pushrtlogs", null);
__decorate([
    (0, common_1.Post)('sessionusers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof sync_interface_1.sessionsUsers !== "undefined" && sync_interface_1.sessionsUsers) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], SyncController.prototype, "sessionusers", null);
__decorate([
    (0, common_1.Post)('codemastersdata'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], SyncController.prototype, "codemastersdata", null);
__decorate([
    (0, common_1.Post)('pushsessiondetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof sync_interface_1.sessionDetailSql !== "undefined" && sync_interface_1.sessionDetailSql) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], SyncController.prototype, "sessionDetail", null);
exports.SyncController = SyncController = __decorate([
    (0, swagger_1.ApiTags)('sync'),
    (0, common_1.Controller)('sync'),
    __metadata("design:paramtypes", [typeof (_a = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _a : Object])
], SyncController);


/***/ }),
/* 64 */
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
exports.sessionDetailSql = exports.sessionsUsers = exports.pushLogData = exports.pushDeleteData = exports.pushHighlightData = exports.pushIssueDetailData = exports.pushIssueData = void 0;
const swagger_1 = __webpack_require__(11);
const class_validator_1 = __webpack_require__(50);
class pushIssueData {
}
exports.pushIssueData = pushIssueData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushIssueData.prototype, "jCat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'Delete', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushIssueData.prototype, "jIssue", void 0);
class pushIssueDetailData {
}
exports.pushIssueDetailData = pushIssueDetailData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushIssueDetailData.prototype, "jIssue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'Delete', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushIssueDetailData.prototype, "jMap", void 0);
class pushHighlightData {
}
exports.pushHighlightData = pushHighlightData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushHighlightData.prototype, "jHighlights", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'Delete', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushHighlightData.prototype, "jMap", void 0);
class pushDeleteData {
}
exports.pushDeleteData = pushDeleteData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushDeleteData.prototype, "jDelete", void 0);
class pushLogData {
}
exports.pushLogData = pushLogData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], pushLogData.prototype, "jLogs", void 0);
class sessionsUsers {
}
exports.sessionsUsers = sessionsUsers;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], sessionsUsers.prototype, "jCaseids", void 0);
class sessionDetailSql {
}
exports.sessionDetailSql = sessionDetailSql;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], sessionDetailSql.prototype, "jSDetail", void 0);


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
exports.KafkaSharedModule = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(30);
const kafka_shared_service_1 = __webpack_require__(29);
const bull_admin_module_1 = __webpack_require__(66);
const config_1 = __webpack_require__(6);
let KafkaSharedModule = class KafkaSharedModule {
};
exports.KafkaSharedModule = KafkaSharedModule;
exports.KafkaSharedModule = KafkaSharedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: 'KAFKA_SERVICE',
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.KAFKA,
                        options: {
                            client: {
                                brokers: [configService.get('KAFKA_HOST') || 'localhost:9092'],
                            },
                        },
                    }),
                },
            ]),
            bull_admin_module_1.BullAdminModule,
        ],
        providers: [kafka_shared_service_1.KafkaGlobalService],
        exports: [microservices_1.ClientsModule, kafka_shared_service_1.KafkaGlobalService]
    })
], KafkaSharedModule);


/***/ }),
/* 66 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BullAdminModule = void 0;
const common_1 = __webpack_require__(3);
let BullAdminModule = class BullAdminModule {
};
exports.BullAdminModule = BullAdminModule;
exports.BullAdminModule = BullAdminModule = __decorate([
    (0, common_1.Module)({})
], BullAdminModule);


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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadController = void 0;
const common_1 = __webpack_require__(3);
const platform_express_1 = __webpack_require__(68);
const multer_1 = __webpack_require__(69);
const path_1 = __webpack_require__(24);
const mkdirp = __webpack_require__(70);
let UploadController = class UploadController {
    uploadFile(file, caseId, filename) {
        return {
            originalname: file.originalname,
            filename: file.filename,
            path: `assets/doc/case${caseId}/${file.filename}`,
        };
    }
    uploadTranscriptFile(file, filename) {
        console.log('file', file, filename);
        return {
            originalname: file.originalname,
            filename: filename,
            path: `${file.filename}`,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, callback) => {
                const caseId = req.body.caseid;
                const uploadPath = `./assets/doc/case${caseId}`;
                mkdirp.sync(uploadPath);
                callback(null, uploadPath);
            },
            filename: (req, file, callback) => {
                const customName = req.body.filename || file.originalname;
                const fileExtension = (0, path_1.extname)(file.originalname);
                callback(null, `${customName}${fileExtension?.toUpperCase()}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (file.mimetype === 'text/plain') {
                callback(null, true);
            }
            else {
                callback(new Error('Unsupported file type. Only .txt files are allowed.'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('caseid')),
    __param(2, (0, common_1.Body)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof Express !== "undefined" && (_a = Express.Multer) !== void 0 && _a.File) === "function" ? _b : Object, String, String]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('transcript-file'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, callback) => {
                const uploadPath = `./assets/realtime-transcripts`;
                mkdirp.sync(uploadPath);
                callback(null, uploadPath);
            },
            filename: (req, file, callback) => {
                console.log('file', req.body, file);
                const customName = req.body.filename || file.originalname;
                const fileExtension = (0, path_1.extname)(file.originalname);
                callback(null, `${customName}${fileExtension?.toUpperCase()}`);
            },
        }),
        fileFilter: (req, file, callback) => {
            if (file.mimetype === 'text/plain') {
                callback(null, true);
            }
            else {
                callback(new Error('Unsupported file type. Only .txt files are allowed.'), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('filename')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof Express !== "undefined" && (_c = Express.Multer) !== void 0 && _c.File) === "function" ? _d : Object, String]),
    __metadata("design:returntype", void 0)
], UploadController.prototype, "uploadTranscriptFile", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)('upload')
], UploadController);


/***/ }),
/* 68 */
/***/ ((module) => {

module.exports = require("@nestjs/platform-express");

/***/ }),
/* 69 */
/***/ ((module) => {

module.exports = require("multer");

/***/ }),
/* 70 */
/***/ ((module) => {

module.exports = require("mkdirp");

/***/ }),
/* 71 */
/***/ ((module) => {

module.exports = require("@nestjs/serve-static");

/***/ }),
/* 72 */
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
__exportStar(__webpack_require__(73), exports);
__exportStar(__webpack_require__(74), exports);


/***/ }),
/* 73 */
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
const global_service_1 = __webpack_require__(74);
const config_1 = __webpack_require__(6);
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
/* 74 */
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
/* 75 */
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
const nest_winston_1 = __webpack_require__(43);
const winston = __webpack_require__(42);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
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
/* 76 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptModule = void 0;
const global_1 = __webpack_require__(72);
const kafka_shared_module_1 = __webpack_require__(65);
const common_1 = __webpack_require__(3);
const transcript_controller_1 = __webpack_require__(77);
const db_service_1 = __webpack_require__(8);
const query_builder_service_1 = __webpack_require__(7);
const log_service_1 = __webpack_require__(41);
const transcript_service_1 = __webpack_require__(78);
const date_time_service_1 = __webpack_require__(13);
const exporttranscript_service_1 = __webpack_require__(83);
const utility_service_1 = __webpack_require__(28);
const transcript_html_service_1 = __webpack_require__(79);
const theme_css_service_1 = __webpack_require__(80);
const jwt_middleware_1 = __webpack_require__(97);
const ioredis_1 = __webpack_require__(40);
const config_1 = __webpack_require__(6);
const redis_db_service_1 = __webpack_require__(38);
const users_service_1 = __webpack_require__(22);
const websocket_module_1 = __webpack_require__(60);
const generate_word_index_service_1 = __webpack_require__(84);
const transcript_publish_service_1 = __webpack_require__(85);
const verifypdf_service_1 = __webpack_require__(86);
const file_version_service_1 = __webpack_require__(90);
const filecopy_service_1 = __webpack_require__(87);
const conversion_js_service_1 = __webpack_require__(36);
const feed_data_service_1 = __webpack_require__(37);
const annot_transfer_service_1 = __webpack_require__(46);
const fact_controller_1 = __webpack_require__(99);
const fact_service_1 = __webpack_require__(100);
const doclink_controller_1 = __webpack_require__(102);
const doclink_service_1 = __webpack_require__(103);
const factsheet_controller_1 = __webpack_require__(105);
let TranscriptModule = class TranscriptModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(transcript_controller_1.TranscriptController, fact_controller_1.FactController, doclink_controller_1.DoclinkController, factsheet_controller_1.FactsheetController);
    }
};
exports.TranscriptModule = TranscriptModule;
exports.TranscriptModule = TranscriptModule = __decorate([
    (0, common_1.Module)({
        imports: [
            global_1.GlobalModule,
            kafka_shared_module_1.KafkaSharedModule, websocket_module_1.WebSocketModule,
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
        ],
        controllers: [transcript_controller_1.TranscriptController, fact_controller_1.FactController, doclink_controller_1.DoclinkController],
        providers: [db_service_1.DbService, query_builder_service_1.QueryBuilderService, config_1.ConfigService, log_service_1.LogService, transcript_service_1.TranscriptService, date_time_service_1.DateTimeService,
            exporttranscript_service_1.ExporttranscriptService, utility_service_1.UtilityService, transcript_html_service_1.TranscriptHtmlService, theme_css_service_1.ThemeCssService, redis_db_service_1.RedisDbService, users_service_1.UsersService,
            generate_word_index_service_1.GenerateWordIndexService, transcript_publish_service_1.TranscriptpublishService, verifypdf_service_1.VerifypdfService, filecopy_service_1.filecopyService, file_version_service_1.FileVersionService, conversion_js_service_1.ConversionJsService, feed_data_service_1.FeedDataService, annot_transfer_service_1.AnnotTransferService,
            fact_service_1.FactService,
            doclink_service_1.DoclinkService,
        ],
        exports: [transcript_service_1.TranscriptService, utility_service_1.UtilityService, config_1.ConfigService,
        ]
    })
], TranscriptModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptController = void 0;
const common_1 = __webpack_require__(3);
const transcript_service_1 = __webpack_require__(78);
const Transcript_interface_1 = __webpack_require__(82);
const swagger_1 = __webpack_require__(11);
const exporttranscript_service_1 = __webpack_require__(83);
const express_1 = __webpack_require__(52);
const generate_word_index_service_1 = __webpack_require__(84);
const express_2 = __webpack_require__(52);
const config_1 = __webpack_require__(6);
const transcript_publish_service_1 = __webpack_require__(85);
let TranscriptController = class TranscriptController {
    constructor(trascriptService, exportS, wordIndexS, config, trascriptpublishService) {
        this.trascriptService = trascriptService;
        this.exportS = exportS;
        this.wordIndexS = wordIndexS;
        this.config = config;
        this.trascriptpublishService = trascriptpublishService;
    }
    async transcriptBuilder(body) {
        const res = await this.trascriptService.transcriptbuilder(body);
        const inserted_id = res.inserted_id;
        const cMasterid = null;
        await this.generateTranscriptHtml(inserted_id, cMasterid);
        return res;
    }
    async themeBuilder(body) {
        return await this.trascriptService.themebuilder(body);
    }
    async ConvertTextToJosn(query) {
        return await this.trascriptService.ConvertTextToJosn(query);
    }
    async gettranscripts(query) {
        return await this.trascriptService.getTranscripts(query);
    }
    async gettranscriptDetail(query) {
        return await this.trascriptService.gettranscriptDetail(query);
    }
    async getTheme(query) {
        return await this.trascriptService.getTheme(query);
    }
    async sessionCombo(query) {
        return await this.trascriptService.sessionCombo(query);
    }
    async caseCombo(query) {
        return await this.trascriptService.case_combo(query);
    }
    async getThemeDetail(query) {
        return await this.trascriptService.getThemeDetail(query);
    }
    async getTranscriptSummary(query) {
        console.log('query', query);
        return await this.trascriptService.getTranscriptSummary(query);
    }
    async getTranscriptFiledata(query) {
        console.log('query', query);
        return await this.trascriptService.getTranscriptFiledata(query);
    }
    async transcriptPublish(body, req) {
        const host = req.get('host');
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        const res = await this.trascriptpublishService.transcriptPublish(body, origin);
        return res;
    }
    async convertAndStreamDoc(filePath, nMasterid, cTransid, req) {
        const host = req.get('host');
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${__dirname}` : `${req.protocol}://${host}`;
        console.log('filePath', filePath, 'nMasterid', nMasterid);
        return await this.exportS.htmlFileToDocStream(nMasterid, filePath, cTransid, origin);
    }
    async generate(dto, res) {
        const pdfBuffer = await this.wordIndexS.generateIndex(dto.cPath, dto.cTransid);
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="index.pdf"',
        });
        res.send(pdfBuffer);
    }
    async generateTranscriptHtml(cTransid, nMasterid) {
        const formData = await this.trascriptService.gettranscriptDetail({ cTransid: cTransid, nMasterid: nMasterid });
        const TranscriptLineDto = await this.trascriptService.getTranscriptFiledata({ cPath: formData.cPath, nMasterid: nMasterid });
        const GenerateTranscriptDto = {
            formData: formData,
            lines: TranscriptLineDto,
            isFullSize: true
        };
        await this.trascriptService.generateTranscript(GenerateTranscriptDto);
    }
    async getTranscriptHtmlFile(formData, req) {
        const host = req.get('host');
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? '' : `${req.protocol}://${host}`;
        const res = await this.trascriptService.getHTMLfile(formData, origin);
        return res;
    }
    async getTranscriptHtml(formData) {
        const res = await this.trascriptService.getHtmlToData(formData);
        return res;
    }
    async downloadFile(query, res) {
        console.log('cPath:', query.cPath);
        return await this.exportS.downloadFile(query.cPath, res);
    }
    async get_field_data(query) {
        return await this.trascriptService.get_field_data(query);
    }
    async deleteTranscript(body) {
        return await this.trascriptService.deleteTranscript(body);
    }
    async getAnnotHighlightExport(body, req) {
        const host = req.get('host');
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        return this.trascriptpublishService.getAnnotHighlightExport(body, origin);
    }
};
exports.TranscriptController = TranscriptController;
__decorate([
    (0, common_1.Post)('transcript_builder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof Transcript_interface_1.TranscriptBuilder !== "undefined" && Transcript_interface_1.TranscriptBuilder) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TranscriptController.prototype, "transcriptBuilder", null);
__decorate([
    (0, common_1.Post)('theme_builder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof Transcript_interface_1.ThemeBuilder !== "undefined" && Transcript_interface_1.ThemeBuilder) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TranscriptController.prototype, "themeBuilder", null);
__decorate([
    (0, common_1.Post)('convert_txtfile_to_json'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof Transcript_interface_1.fileJSONRequest !== "undefined" && Transcript_interface_1.fileJSONRequest) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TranscriptController.prototype, "ConvertTextToJosn", null);
__decorate([
    (0, common_1.Get)('get_transcripts'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof Transcript_interface_1.TranscriptRequest !== "undefined" && Transcript_interface_1.TranscriptRequest) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TranscriptController.prototype, "gettranscripts", null);
__decorate([
    (0, common_1.Get)('get_transcript_detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof Transcript_interface_1.TranscriptDetailRequest !== "undefined" && Transcript_interface_1.TranscriptDetailRequest) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], TranscriptController.prototype, "gettranscriptDetail", null);
__decorate([
    (0, common_1.Get)('get_theme'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof Transcript_interface_1.ThemeRequest !== "undefined" && Transcript_interface_1.ThemeRequest) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], TranscriptController.prototype, "getTheme", null);
__decorate([
    (0, common_1.Get)('session_combo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof Transcript_interface_1.SessionComboRequest !== "undefined" && Transcript_interface_1.SessionComboRequest) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], TranscriptController.prototype, "sessionCombo", null);
__decorate([
    (0, common_1.Get)('case_combo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof Transcript_interface_1.CaseComboRequest !== "undefined" && Transcript_interface_1.CaseComboRequest) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], TranscriptController.prototype, "caseCombo", null);
__decorate([
    (0, common_1.Get)('get_theme_detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof Transcript_interface_1.ThemeDetailRequest !== "undefined" && Transcript_interface_1.ThemeDetailRequest) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], TranscriptController.prototype, "getThemeDetail", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof Transcript_interface_1.fileJSONRequest !== "undefined" && Transcript_interface_1.fileJSONRequest) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], TranscriptController.prototype, "getTranscriptSummary", null);
__decorate([
    (0, common_1.Get)('filedata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof Transcript_interface_1.fileJSONRequest !== "undefined" && Transcript_interface_1.fileJSONRequest) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], TranscriptController.prototype, "getTranscriptFiledata", null);
__decorate([
    (0, common_1.Post)('publish'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof Transcript_interface_1.TranscriptPublishReq !== "undefined" && Transcript_interface_1.TranscriptPublishReq) === "function" ? _3 : Object, typeof (_4 = typeof express_2.Request !== "undefined" && express_2.Request) === "function" ? _4 : Object]),
    __metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], TranscriptController.prototype, "transcriptPublish", null);
__decorate([
    (0, common_1.Post)('html-file-to-doc-stream'),
    __param(0, (0, common_1.Body)('filePath')),
    __param(1, (0, common_1.Body)('nMasterid')),
    __param(2, (0, common_1.Body)('cTransid')),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, typeof (_6 = typeof express_2.Request !== "undefined" && express_2.Request) === "function" ? _6 : Object]),
    __metadata("design:returntype", Promise)
], TranscriptController.prototype, "convertAndStreamDoc", null);
__decorate([
    (0, common_1.Post)('generate-file-index'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof Transcript_interface_1.GenerateIndexDto !== "undefined" && Transcript_interface_1.GenerateIndexDto) === "function" ? _7 : Object, typeof (_8 = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _8 : Object]),
    __metadata("design:returntype", Promise)
], TranscriptController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('html-file'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof Transcript_interface_1.fileHTMLRequest !== "undefined" && Transcript_interface_1.fileHTMLRequest) === "function" ? _9 : Object, typeof (_10 = typeof express_2.Request !== "undefined" && express_2.Request) === "function" ? _10 : Object]),
    __metadata("design:returntype", typeof (_11 = typeof Promise !== "undefined" && Promise) === "function" ? _11 : Object)
], TranscriptController.prototype, "getTranscriptHtmlFile", null);
__decorate([
    (0, common_1.Get)('html'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_12 = typeof Transcript_interface_1.TranscriptBuilder !== "undefined" && Transcript_interface_1.TranscriptBuilder) === "function" ? _12 : Object]),
    __metadata("design:returntype", typeof (_13 = typeof Promise !== "undefined" && Promise) === "function" ? _13 : Object)
], TranscriptController.prototype, "getTranscriptHtml", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_14 = typeof Transcript_interface_1.DwdpathReq !== "undefined" && Transcript_interface_1.DwdpathReq) === "function" ? _14 : Object, typeof (_15 = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _15 : Object]),
    __metadata("design:returntype", Promise)
], TranscriptController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)('get_field_data'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_16 = typeof Transcript_interface_1.TranscriptFieldRequest !== "undefined" && Transcript_interface_1.TranscriptFieldRequest) === "function" ? _16 : Object]),
    __metadata("design:returntype", typeof (_17 = typeof Promise !== "undefined" && Promise) === "function" ? _17 : Object)
], TranscriptController.prototype, "get_field_data", null);
__decorate([
    (0, common_1.Delete)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_18 = typeof Transcript_interface_1.DeleteTranscript !== "undefined" && Transcript_interface_1.DeleteTranscript) === "function" ? _18 : Object]),
    __metadata("design:returntype", Promise)
], TranscriptController.prototype, "deleteTranscript", null);
__decorate([
    (0, common_1.Post)('annothighlightexport'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_19 = typeof Transcript_interface_1.getAnnotHighlightEEP !== "undefined" && Transcript_interface_1.getAnnotHighlightEEP) === "function" ? _19 : Object, typeof (_20 = typeof express_2.Request !== "undefined" && express_2.Request) === "function" ? _20 : Object]),
    __metadata("design:returntype", typeof (_21 = typeof Promise !== "undefined" && Promise) === "function" ? _21 : Object)
], TranscriptController.prototype, "getAnnotHighlightExport", null);
exports.TranscriptController = TranscriptController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('transcript'),
    (0, common_1.Controller)('transcript'),
    __metadata("design:paramtypes", [typeof (_a = typeof transcript_service_1.TranscriptService !== "undefined" && transcript_service_1.TranscriptService) === "function" ? _a : Object, typeof (_b = typeof exporttranscript_service_1.ExporttranscriptService !== "undefined" && exporttranscript_service_1.ExporttranscriptService) === "function" ? _b : Object, typeof (_c = typeof generate_word_index_service_1.GenerateWordIndexService !== "undefined" && generate_word_index_service_1.GenerateWordIndexService) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof transcript_publish_service_1.TranscriptpublishService !== "undefined" && transcript_publish_service_1.TranscriptpublishService) === "function" ? _e : Object])
], TranscriptController);


/***/ }),
/* 78 */
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
exports.TranscriptService = void 0;
const db_service_1 = __webpack_require__(8);
const log_service_1 = __webpack_require__(41);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const child_process_1 = __webpack_require__(35);
const transcript_html_service_1 = __webpack_require__(79);
let TranscriptService = class TranscriptService {
    constructor(config, db, logService, transcriptHtmlService) {
        this.config = config;
        this.db = db;
        this.logService = logService;
        this.transcriptHtmlService = transcriptHtmlService;
        this.logApplication = 'realtime/transcript';
    }
    async transcriptbuilder(body) {
        try {
            this.logService.info(`Creating transcript: ${body.cTransid || 'new'}`, this.logApplication);
            let res = await this.db.executeRef('transcripts_builder', body, 'transcript');
            if (res.success) {
                this.logService.info(`Transcript creation successful: ${res.data[0][0]?.nTransid || ''}`, this.logApplication);
                return res.data[0][0];
            }
            else {
                this.logService.error(`Transcript creation failed: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Creation failed', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in transcriptbuilder: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error creating transcript', error: error.message };
        }
    }
    async themebuilder(body) {
        try {
            this.logService.info(`Creating theme: ${body.cName}`, this.logApplication);
            let res = await this.db.executeRef('theme_builder', body, 'transcript');
            if (res.success) {
                this.logService.info(`Theme creation successful: ${body.cName}`, this.logApplication);
                return res.data[0][0];
            }
            else {
                this.logService.error(`Theme creation failed: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Creation failed', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in themebuilder: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error creating theme', error: error.message };
        }
    }
    async getTranscripts(body) {
        try {
            this.logService.info(`Fetching transcript list for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('list_transcripts', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved transcript list`, this.logApplication);
                return res.data[0];
            }
            else {
                this.logService.error(`Failed to fetch transcript list: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in getTranscripts: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching transcripts', error: error.message };
        }
    }
    async gettranscriptDetail(body) {
        try {
            this.logService.info(`Fetching transcript details for ID: ${body.cTransid}`, this.logApplication);
            let res = await this.db.executeRef('get_transcript_detail', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved transcript details`, this.logApplication);
                return res.data[0][0];
            }
            else {
                this.logService.error(`Failed to fetch transcript details: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in gettranscriptDetail: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching transcript details', error: error.message };
        }
    }
    async getTheme(body) {
        try {
            this.logService.info(`Fetching theme list for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('get_theme_list', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved theme list`, this.logApplication);
                return res.data[0];
            }
            else {
                this.logService.error(`Failed to fetch theme list: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in getTheme: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching themes', error: error.message };
        }
    }
    async getThemeDetail(body) {
        try {
            this.logService.info(`Fetching theme details for ID: ${body.cThemeid}`, this.logApplication);
            let res = await this.db.executeRef('get_theme_detail', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved theme details`, this.logApplication);
                return res.data[0][0];
            }
            else {
                this.logService.error(`Failed to fetch theme details: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in getThemeDetail: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching theme details', error: error.message };
        }
    }
    async case_combo(body) {
        try {
            this.logService.info(`Fetching case combination data for master: ${body.nMasterid}`, this.logApplication);
            let res = await this.db.executeRef('get_case_combo', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved case combination data`, this.logApplication);
                return res.data[0];
            }
            else {
                this.logService.error(`Failed to fetch case combination: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in case_combo: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching case combinations', error: error.message };
        }
    }
    async sessionCombo(body) {
        try {
            this.logService.info(`Fetching session data for case: ${body.nCaseid}`, this.logApplication);
            let res = await this.db.executeRef('get_session', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved session data`, this.logApplication);
                return res.data[0];
            }
            else {
                this.logService.error(`Failed to fetch session data: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in sessionCombo: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error fetching session data', error: error.message };
        }
    }
    async ConvertTextToJosn(body) {
        const JSONfilePath = body.cPath.replace(/\.[^/.]+$/, '.json');
        const res = await this.exportJsonFile((this.config.get('REALTIME_PATH') + body.cPath), (this.config.get('REALTIME_PATH') + JSONfilePath));
        if (res.msg === 1) {
            this.logService.info(`Transfer completed successfully for file: ${body.cPath}`, this.logApplication);
            return { msg: 1, status: 'success', path: JSONfilePath };
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async exportJsonFile(filePath, JSONfilePath) {
        this.logService.info(`exportJsonFile transcript process started: ${this.config.get('PY_TRANSCRIPT_TRANSFER')} ${filePath}`, this.logApplication);
        try {
            const body = [
                this.config.get('PY_TRANSCRIPT_TRANSFER'),
                filePath,
                JSONfilePath
            ];
            console.log(`${this.config.get('PY_TRANSCRIPT_TRANSFER')} ${body.join(' ')}`);
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), body);
            let dataBuffer = '';
            pythonProcess.stdout.on('data', (data) => {
                dataBuffer += data.toString();
                this.logService.debug(`Python process output: ${data.toString()}`, this.logApplication);
            });
            pythonProcess.stderr.on('data', (data) => {
                this.logService.error(`Python process error: ${data.toString()}`, this.logApplication);
            });
            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    this.logService.error(`Python process execution error: ${err}`, this.logApplication);
                    resolve({ msg: -1, value: 'Failed to fetch', error: err });
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        this.logService.error(`Python process exited with code ${code}`, this.logApplication);
                        resolve({ msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` });
                        return;
                    }
                    this.logService.info('Python process completed successfully', this.logApplication);
                    resolve({ msg: 1 });
                });
            });
        }
        catch (error) {
            this.logService.error(`Exception in exportJsonFile: ${error}`, this.logApplication);
            return { msg: -1, value: 'Failed to fetch', error: error };
        }
    }
    getTranscriptSummary(query) {
        try {
            this.logService.info(`Getting transcript summary for: ${query.cPath}`, this.logApplication);
            const filePath = this.config.get('REALTIME_PATH') + query.cPath;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (!Array.isArray(data) || data.length === 0) {
                this.logService.error(`Invalid file format for transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` };
            }
            const firstPageNo = data[0].pageno;
            const maxLineno = data
                .filter(entry => entry.pageno === firstPageNo)
                .reduce((max, curr) => Math.max(max, curr.lineno), 0);
            if (!maxLineno || maxLineno.length === 0) {
                this.logService.error(`Invalid line number data for transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` };
            }
            const totalPages = [...new Set(data.map(entry => entry.pageno))].length;
            this.logService.debug(`Transcript summary calculated: pages=${totalPages}, start page=${firstPageNo}, max lines=${maxLineno}`, this.logApplication);
            return {
                msg: 1,
                firstPageNo,
                maxLineno,
                totalPages,
            };
        }
        catch (error) {
            this.logService.error(`Exception in getTranscriptSummary: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error processing transcript file', error: error.message };
        }
    }
    getTranscriptFiledata(query) {
        try {
            this.logService.debug(`Reading transcript file data: ${query.cPath}`, this.logApplication);
            const filePath = this.config.get('REALTIME_PATH') + query.cPath;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (!Array.isArray(data) || data.length === 0) {
                this.logService.error(`Invalid or empty data in transcript: ${query.cPath}`, this.logApplication);
                return { msg: -1, message: 'Invalid or empty transcript data' };
            }
            this.logService.debug(`Successfully read transcript data with ${data.length} entries`, this.logApplication);
            return data;
        }
        catch (error) {
            this.logService.error(`Exception in getTranscriptFiledata: ${error}`, this.logApplication);
            return { msg: -1, message: `Error reading transcript file: ${error.message}` };
        }
    }
    async getHTMLfile(query, origin) {
        try {
            this.logService.info(`Generating HTML file for transcript: ${query.cTransid || 'unknown'}`, this.logApplication);
            let res = await this.db.executeRef('get_transcript_detail', query, 'transcript');
            let formData = res.data[0][0];
            const filePath = this.config.get('REALTIME_PATH') + formData.cPath;
            if (!fs.existsSync(filePath)) {
                console.log('File does not exist at path', filePath);
                throw new Error('File does not exist at server');
            }
            const defaultTheme = {};
            const TranscriptLineDto = await this.getTranscriptFiledata({
                cPath: formData.cPath,
            });
            const nPreviewPages = Number(query.nPreviewPages) || 0;
            const renderLines = nPreviewPages > 0
                ? TranscriptLineDto.filter((l) => l.pageno <= nPreviewPages)
                : TranscriptLineDto;
            let theme;
            if (formData.cThemeid) {
                theme = await this.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: query?.nMasterid });
                if (theme)
                    Object.assign(defaultTheme, theme);
            }
            const html = this.transcriptHtmlService.generateHtml(formData, renderLines, defaultTheme, query.type || 'FST', origin);
            if (nPreviewPages <= 0) {
                await this.savehtmlToFile(html, `transcript_${formData.cTransid}_${query.type || 'FST'}.html`);
            }
            const buffer = Buffer.from(html, 'utf-8');
            const base64 = buffer.toString('base64');
            this.logService.info(`HTML generated successfully for transcript: ${formData.cTransid || 'unknown'} (preview pages: ${nPreviewPages || 'all'})`, this.logApplication);
            return { msg: 1, base64, html };
        }
        catch (error) {
            this.logService.error(`Exception in getHTMLfile: ${error}`, this.logApplication);
            return { msg: -1, value: 'Failed to generate HTML', error: error.message };
        }
    }
    async savehtmlToFile(html, outputpath) {
        try {
            let cPath = this.config.get('REALTIME_PATH') + 'exports/' + outputpath;
            const outputDir = path.dirname(cPath);
            await fs.promises.mkdir(outputDir, { recursive: true });
            const filePath = outputDir;
            this.logService.info(`Saving HTML to file: ${filePath}`, this.logApplication);
            await fs.promises.writeFile(cPath, html, 'utf8');
            this.logService.info(`HTML file saved successfully: ${cPath}`, this.logApplication);
            return { msg: 1, status: 'success', path: cPath };
        }
        catch (err) {
            this.logService.error(`Error saving HTML to file: ${err}`, this.logApplication);
            return { msg: -1, value: 'Failed to save HTML file', error: err };
        }
    }
    async UpdateFilepath(cTransid, cPath, cPath4pg) {
        this.logService.info(`Updating file path for transcript: ${cTransid}, Path: ${cPath}, 4UP Path: ${cPath4pg}`, this.logApplication);
        let res = await this.db.executeRef('update_htmlpath', { cTransid, cPath, cPath4pg }, 'transcript');
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async generateTranscript(generateDto) {
        try {
            const defaultTheme = {};
            if (generateDto.formData.cThemeid) {
                const theme = await this.getThemeDetail({ cThemeid: generateDto.formData.cThemeid, nMasterid: generateDto.formData.nMasterid });
                if (theme && theme) {
                    Object.assign(defaultTheme, theme);
                }
            }
            const html = this.transcriptHtmlService.generateHtml(generateDto.formData, generateDto.lines, defaultTheme, 'FST');
            const cPath = `s_${generateDto.formData.cTransid}_${'FST'}.html`;
            const cPath2 = `s_${generateDto.formData.cTransid}_${'4UP'}.html`;
            const r1 = await this.savehtmlToFile(html, cPath);
            if (r1.msg === -1) {
                this.logService.error(`Error saving HTML file: ${r1.value}`, this.logApplication);
                return;
            }
            const html2 = this.transcriptHtmlService.generateHtml(generateDto.formData, generateDto.lines, defaultTheme, '4UP');
            const r2 = await this.savehtmlToFile(html2, cPath2);
            if (r2.msg === -1) {
                this.logService.error(`Error saving HTML file: ${r2.value}`, this.logApplication);
                return;
            }
            await this.UpdateFilepath(generateDto.formData.cTransid, cPath, cPath2);
        }
        catch (error) {
            this.logService.error(`Exception in generateTranscript: ${error}`, this.logApplication);
        }
    }
    async getHtmlToData(formData) {
        try {
            this.logService.info(`Converting HTML to base64 data for transcript path: ${formData.cPath}`, this.logApplication);
            const defaultTheme = {};
            const filePath = this.config.get('REALTIME_PATH') + formData.cPath;
            if (!fs.existsSync(filePath)) {
                console.log('File does not exist at path', filePath);
                throw new Error('File does not exist at server');
            }
            const TranscriptLineDto = await this.getTranscriptFiledata({
                cPath: formData.cPath,
            });
            const nPreviewPages = Number(formData.nPreviewPages) || 0;
            const renderLines = nPreviewPages > 0
                ? TranscriptLineDto.filter((l) => l.pageno <= nPreviewPages)
                : TranscriptLineDto;
            let theme;
            if (formData.cThemeid) {
                this.logService.debug(`Applying theme ${formData.cThemeid} to transcript`, this.logApplication);
                theme = await this.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: formData.nMasterid });
                if (theme)
                    Object.assign(defaultTheme, theme);
            }
            const html = this.transcriptHtmlService.generateHtml(formData, renderLines, defaultTheme, 'FST');
            const buffer = Buffer.from(html, 'utf-8');
            const base64 = buffer.toString('base64');
            this.logService.info(`Successfully converted HTML to base64 for transcript`, this.logApplication);
            return { base64 };
        }
        catch (error) {
            this.logService.error(`Exception in getHtmlToData: ${error}`, this.logApplication);
            throw error;
        }
    }
    async get_field_data(body) {
        try {
            this.logService.info(`Fetching field data with search: ${body.searchstr} in column: ${body.column_nm}`, this.logApplication);
            let res = await this.db.executeRef('get_field_data', body, 'transcript');
            if (res.success) {
                this.logService.debug(`Successfully retrieved field data`, this.logApplication);
                return res.data[0];
            }
            else {
                this.logService.error(`Failed to fetch field data: ${res.error}`, this.logApplication);
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            this.logService.error(`Exception in get_field_data: ${error}`, this.logApplication);
            return { msg: -1, value: 'Error processing request', error: error.message };
        }
    }
    async deleteTranscript(body) {
        try {
            this.logService.info(`Deleting transcript: ${body.cTransid}`, `${this.logApplication}/${body.cTransid}`);
            const res = await this.db.executeRef('delete_transcript', body, 'transcript');
            if (!res.success) {
                const errorMsg = res.error || 'Error deleting transcript';
                this.logService.error(`Database error: ${errorMsg}`, `${this.logApplication}/${body.cTransid}`);
                return { msg: -1, value: errorMsg };
            }
            const resData = res.data[0][0];
            if (resData['msg'] != 1) {
                const errorMsg = resData['message'] || 'Error deleting transcript';
                this.logService.error(`Operation failed: ${errorMsg}`, `${this.logApplication}/${body.cTransid}`);
                return { msg: -1, value: errorMsg };
            }
            this.logService.info(`Transcript ${body.cTransid} deleted successfully`, this.logApplication);
            return resData;
        }
        catch (error) {
            this.logService.error(`Exception in deleteTranscript: ${error.message}`, this.logApplication);
            return { msg: -1, error: error.message };
        }
    }
};
exports.TranscriptService = TranscriptService;
__decorate([
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TranscriptService.prototype, "generateTranscript", null);
exports.TranscriptService = TranscriptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof transcript_html_service_1.TranscriptHtmlService !== "undefined" && transcript_html_service_1.TranscriptHtmlService) === "function" ? _d : Object])
], TranscriptService);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptHtmlService = void 0;
const common_1 = __webpack_require__(3);
const theme_css_service_1 = __webpack_require__(80);
const utility_service_1 = __webpack_require__(28);
const canvas_1 = __webpack_require__(81);
let TranscriptHtmlService = class TranscriptHtmlService {
    constructor(themeCssService, utilityService) {
        this.themeCssService = themeCssService;
        this.utilityService = utilityService;
        this.A4_HEIGHT_PX = 1123;
        this.PAGE_PADDING = 80;
        this.DIVIDER_HEIGHT = 21;
        this.DIVIDER_COUNT = 3;
        this.coverPglength = 1;
        this.indexpagecount = 0;
    }
    generatePages(lines, type) {
        if (!lines.length)
            return [];
        const noOfPages = lines.reduce((max, curr) => Math.max(max, curr.pageno), 0);
        const pages = Array.from({ length: noOfPages }, (_, i) => i + 1);
        const indexPages = new Set(lines.filter(line => line.isIndex).map(line => line.pageno));
        if (type === '4UP') {
            return pages.reduce((acc, curr, i) => {
                if (i % 4 === 0) {
                    const groupTemplate = [curr, curr + 2, curr + 1, curr + 3];
                    const finalGroup = groupTemplate.map(p => (p <= pages.length ? p : null));
                    acc.push({ page: finalGroup });
                }
                return acc;
            }, []);
        }
        else {
            return pages.map(page => ({ page: [page] }));
        }
    }
    getLines(lines, page, maxLineno) {
        let res = lines.filter(line => line.pageno === page);
        if (res.length === maxLineno) {
            return res;
        }
        else if (res.length < maxLineno) {
            const missingLines = maxLineno - res.length;
            const lastLine = res[res.length - 1];
            for (let i = 0; i < missingLines; i++) {
                res.push({
                    pageno: page,
                    lineno: null,
                    linetext: '',
                    timestamp: ''
                });
            }
        }
        return res;
    }
    formatDate(date, format) {
        if (!date)
            return '';
        const d = new Date(date);
        switch (format) {
            case 'EEEE, d MMMM, yyyy':
                return d.toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            case 'dd MMM yyyy':
                return d.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                });
            default:
                return d.toLocaleDateString();
        }
    }
    detectPosition(formData, theme) {
        const HFDetails = {
            TL: { value1: '', value2: '' },
            TR: { value1: '', value2: '' },
            BL: { value1: '', value2: '' },
            BR: { value1: '', value2: '' }
        };
        const positions = {
            [theme?.cPCaseName || '']: {
                value1: formData?.cTitle || ''
            },
            [theme?.cPVolumeDate || '']: {
                value1: `${formData?.cTVolume || '#'}`,
                value2: this.formatDate(formData?.dTranscribedDate, 'dd MMM yyyy')
            },
            [theme?.cPCompany || '']: {
                value1: formData?.cCompany || ''
            },
            [theme?.cPCompanyInfo || '']: {
                value1: formData?.cCompanyinfo || ''
            }
        };
        ['TL', 'TR', 'BL', 'BR'].forEach(position => {
            if (positions[position]) {
                HFDetails[position].value1 = positions[position].value1 || '';
                HFDetails[position].value2 = positions[position].value2 || '';
            }
        });
        return HFDetails;
    }
    generatePageNumber(theme, pageIndex) {
        if (theme?.cPNPosition === 'B') {
            return `[Page ${pageIndex + 1}]`;
        }
        else if (theme?.cPNPosition === 'P') {
            return `Page ${pageIndex + 1}`;
        }
        else {
            return `Page | ${pageIndex + 1}`;
        }
    }
    calculatePreHeight(text, theme, width) {
        const fontFamily = theme?.nBFont ?
            this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier' :
            'courier';
        const fontSize = theme?.nBFontsize || 17;
        const letterSpacing = theme?.nBLetterspacing || 0.5;
        const lineHeight = 1.2;
        const containerWidth = width || 554;
        const padding = 0;
        const availableWidth = containerWidth - padding;
        let charWidth = fontSize * 0.6;
        if (fontFamily.includes('Courier')) {
            charWidth = fontSize * 0.6;
        }
        else if (fontFamily.includes('Times')) {
            charWidth = fontSize * 0.5;
        }
        else {
            charWidth = fontSize * 0.55;
        }
        const effectiveCharWidth = charWidth + letterSpacing;
        const charsPerLine = Math.floor(availableWidth / effectiveCharWidth);
        if (!text || text.length === 0) {
            return fontSize * lineHeight;
        }
        const lines = text.split('\n');
        let totalLines = 0;
        lines.forEach(line => {
            if (line.length === 0) {
                totalLines += 1;
                return;
            }
            const lineLength = line.length;
            if (lineLength <= charsPerLine) {
                totalLines += 1;
            }
            else {
                const wrappedLines = this.wrapLinePreservingSpaces(line, charsPerLine);
                totalLines += wrappedLines;
            }
        });
        const lineHeightPx = fontSize * lineHeight;
        return totalLines * lineHeightPx;
    }
    wrapLinePreservingSpaces(line, charsPerLine) {
        if (line.length === 0)
            return 1;
        if (charsPerLine <= 0)
            return Math.ceil(line.length);
        let lineCount = 0;
        let currentPos = 0;
        while (currentPos < line.length) {
            let endPos = currentPos + charsPerLine;
            if (endPos < line.length) {
                const breakPos = this.findBetterBreakPoint(line, currentPos, endPos);
                endPos = breakPos;
            }
            else {
                endPos = line.length;
            }
            if (endPos <= currentPos) {
                endPos = currentPos + 1;
            }
            lineCount++;
            currentPos = endPos;
        }
        return lineCount || 1;
    }
    findBetterBreakPoint(line, start, maxEnd) {
        const minSearch = Math.max(start, maxEnd - Math.floor((maxEnd - start) * 0.3));
        for (let i = maxEnd - 1; i >= minSearch; i--) {
            const char = line[i];
            if (char === ' ') {
                return i + 1;
            }
            if ([',', '.', ';', ':', '!', '?', ')', ']', '}', '-'].includes(char)) {
                return i + 1;
            }
        }
        return maxEnd;
    }
    calculateDynamicGap(contentHeight, totalLines, availableHeight) {
        const totalGaps = totalLines > 1 ? totalLines - 1 : 0;
        const dividerSpace = this.DIVIDER_COUNT * this.DIVIDER_HEIGHT;
        const contentSpace = contentHeight - dividerSpace;
        const remainingSpace = availableHeight - contentSpace - dividerSpace;
        let dynamicGap = totalGaps > 0 ? Math.floor(remainingSpace / totalGaps) : 3;
        if (dynamicGap < 3) {
            return 3;
        }
        else if (dynamicGap > 10) {
            return 10;
        }
        return dynamicGap;
    }
    detectLineBreak(linetext, theme) {
        const height = this.calculatePreHeight(linetext, theme);
        const singleLineHeight = (theme?.nBFontsize || 17) * 1.2;
        return height > singleLineHeight;
    }
    splitContent(contentLines, maxLines) {
        maxLines = Math.min(maxLines, contentLines.length);
        return [contentLines.slice(0, maxLines), contentLines.slice(maxLines)];
    }
    generateAppearancesHtml(contentLines) {
        let hasSeenClaimantHeader = false;
        let hasSeenRespondentHeader = false;
        return contentLines.map(line => {
            if (line.includes('On Behalf of Claimant')) {
                hasSeenClaimantHeader = true;
                return `<pre id="cBClaimentH" style="font-style:italic;">${line}</pre>`;
            }
            if (line.includes('On Behalf of Respondent')) {
                hasSeenRespondentHeader = true;
                return `<pre id="cBRespondentH" style="font-style:italic;">${line}</pre>`;
            }
            let className = 'customfont';
            if (!hasSeenClaimantHeader) {
                className = 'cBClaiment';
            }
            else if (hasSeenClaimantHeader && !hasSeenRespondentHeader) {
                className = 'cBRespondent';
            }
            return `<pre class="${className}">${line}</pre>`;
        }).join('');
    }
    generateTitlePages(formData, theme, hostorigin) {
        const fontSize = theme?.nCFontsize || 12;
        const coverlinespacing = formData?.nCSpacing || 1.2;
        const lineHeight = fontSize * coverlinespacing;
        const IsShowBrand = theme.bLMbrand ? true : false;
        this.PAGE_PADDING = IsShowBrand ? 40 : 80;
        const titleLines = formData?.cCasetype?.split('\n') || [' '];
        const arbitratorLines = formData?.cArbitrator?.split('\n') || [' '];
        const claimantLines = formData?.cClaiment?.split('\n') || [' '];
        const respondentLines = formData?.cRespondent?.split('\n') || [' '];
        const arbitratorHtml = arbitratorLines.map(line => `<pre class="cArbitrator">${line}</pre>`).join('') || '';
        const claimantHtml = claimantLines.map(line => `<pre class="cClaiment">${line}</pre>`).join('') || '';
        const respondentHtml = respondentLines.map(line => `<pre class="cRespondent">${line}</pre>`).join('') || '';
        if (!formData?.cBClaiment || formData.cBClaiment == '') {
            formData.cBClaiment = ' \r ';
        }
        if (!formData?.cBRespondent || formData?.cBRespondent == '') {
            formData.cBRespondent = ' \r ';
        }
        const appearanceLines = [
            ...(formData?.cBClaiment?.split('\n') || [' ']),
            formData?.cBClaimentH ? `<pre id="cBClaimentH">${formData.cBClaimentH}</pre>` : '',
            ...(formData?.cBRespondent?.split('\n') || [' ']),
            formData?.cBRespondentH ? `<pre id="cBRespondentH">${formData.cBRespondentH}</pre>` : ''
        ];
        const headerLineCount = titleLines.length + 1;
        const partiesLineCount = 1 + 1 + claimantLines.length + 1 + respondentLines.length;
        const arbitratorLineCount = 1 + arbitratorLines.length + 2;
        const headerGap = 10;
        const betweenGap = 10;
        const beforeGap = 10;
        const appearanceGap = 10;
        const dividerSpace = this.DIVIDER_COUNT * this.DIVIDER_HEIGHT;
        const headerSpace = (headerLineCount * lineHeight) + ((headerLineCount - 1) * headerGap);
        const partiesSpace = (partiesLineCount * lineHeight) + ((partiesLineCount - 1) * betweenGap);
        const arbitratorSpace = (arbitratorLineCount * lineHeight) + ((arbitratorLineCount - 1) * beforeGap);
        const availableHeight = this.A4_HEIGHT_PX - this.PAGE_PADDING;
        const fixedContentSpace = headerSpace + partiesSpace + arbitratorSpace + dividerSpace;
        const remainingSpace = availableHeight - fixedContentSpace;
        const appearanceLineHeight = lineHeight;
        const maxAppearanceLines = Math.floor(remainingSpace / appearanceLineHeight);
        const [firstPageAppearances, remainingAppearances] = this.splitContent(appearanceLines, maxAppearanceLines);
        const firstPageAppearancesHtml = this.generateAppearancesHtml(firstPageAppearances);
        const firstPageHtml = `
      <div class="titlepage page page-break mb-3 bg-white ${IsShowBrand ? 'showBrand' : ''} ">
        <div class="flex flex-col cover-inner" >
          <div class="titlepage-header">
            <pre id="cCasetype" class="text-1 customfont">${formData?.cCasetype || ''}</pre>
            <pre id="cCCaseno" class="text-1 customfont">${formData?.cCCaseno || ''}</pre>
          </div>
          <div class="divider"></div>
          <div class="parties">
            <p class="text-center betweeen" style="${IsShowBrand ? 'color:#F26522' : ''}">Between:</p>
            <div> 
          ${claimantHtml}
          </div>
            <p id="cClaimentH" class="customfont " style="font-weight:400 !important; font-style:italic; ${IsShowBrand ? 'color:#F26522' : ''}">[${formData?.cClaimentH || 'Example Claimant ABC'}]</p>  
            <div> 
            ${respondentHtml}
             </div>
            <p id="cRespondentH" class="customfont" style="font-weight:400 !important; font-style:italic;${IsShowBrand ? 'color:#F26522' : ''}">[${formData?.cRespondentH || 'Example Respondent XYZ'}]</p>

          </div>
          <div class="divider"></div>
          <div class="before">
            <p>&nbsp;&nbsp;Before&nbsp;&nbsp;</p>
           <div> 
            ${arbitratorHtml}
             </div>
            <pre class="customfont" id="cCDay">${formData?.cCDay || '#'}</pre>
            <p class="customfont" id="dCDate">${this.formatDate(formData?.dCDate, 'EEEE, d MMMM, yyyy')}</p>
          </div>
          <div class="divider"></div>
          <div class="appear">
            ${firstPageAppearancesHtml}
          </div>
        </div>
          <img src="${hostorigin}/assets/bglayer.png"  class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">


        <div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
            <div class="bar"></div>
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z" fill="#F26522"/>
</svg>

        </div>
        </div>
      </div>
    `;
        const continuationPages = [];
        let currentPageAppearances = remainingAppearances;
        while (currentPageAppearances.length > 0) {
            const continuationMaxLines = Math.floor((availableHeight - 40) / appearanceLineHeight);
            const [pageContent, nextPageContent] = this.splitContent(currentPageAppearances, continuationMaxLines);
            const pageAppearancesHtml = this.generateAppearancesHtml(pageContent);
            continuationPages.push(`
        <div class="titlepage page page-break mb-3 bg-white ${IsShowBrand ? 'showBrand' : ''}" >
          <div class="flex flex-col cover-inner" >
            <div class="appear">
              ${pageAppearancesHtml}
            </div>
          </div>
<img src="${hostorigin}/assets/bglayer.png"  class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">

        <div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
            <div class="bar"></div>
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z" fill="#F26522"/>
</svg>
        </div>
        </div>
        </div>
      `);
            currentPageAppearances = nextPageContent;
        }
        this.coverPglength = continuationPages.length + 1;
        return firstPageHtml + continuationPages.join('');
    }
    generateTitlePages_2(query, theme, hostorigin) {
        const IsShowBrand = theme.bLMbrand ? true : false;
        this.PAGE_PADDING = IsShowBrand ? 40 : 80;
        const date = new Date();
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = date.toLocaleDateString('en-US', options);
        const firstPageHtml = `
     <div class="titlepage page page-break mb-3 bg-white showBrand">
  <div class="flex flex-col cover-inner" style="justify-content:center;">
    <div class="parties">
      <p id="cClaimentH" class="customfont " style="font-weight:400 !important; font-style:italic;color:#F26522">
        [Session Name]</p>
      <div>
        <p style="font-size:20px">${query.cCasename}</p>
      </div>
      <p id="cClaimentH" class="customfont" style="font-weight:400 !important; font-style:italic;color:#F26522">[Case Name]</p>
      <div>
        <p style="font-size:20px">${query.otherCaseData.cCasename}</p>
      </div>
    </div>
    <div class="divider"></div>

    <p style="font-size:16px"> Exported By ${query.cUsername}</p>
    <pre class="customfont" id="cCDay" style="margin:10px 0px 10px 0px">On</pre>
    <p style="font-size:16px" class="customfont" id="dCDate">${formattedDate}</p>
  </div>


<img src="${hostorigin}/assets/bglayer.png" class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">


<div class="brand" style="width:40px;height:100%;${IsShowBrand ? '' : 'display: none;'}">
  <div class="bar"></div>
  <div class="brand-logo">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M0 0V40H40V0H0ZM8.72772 31.4772C7.80168 31.4772 7.04774 30.7232 7.04774 29.7972C7.04774 28.8711 7.80168 28.1254 8.72772 28.1254C9.65376 28.1254 10.4077 28.8711 10.4077 29.7972C10.4077 30.7232 9.65376 31.4772 8.72772 31.4772ZM16.6114 31.4772C15.6853 31.4772 14.9232 30.7232 14.9232 29.7972C14.9232 28.8711 15.6771 28.1254 16.6114 28.1254C17.5456 28.1254 18.2831 28.8711 18.2831 29.7972C18.2831 30.7232 17.5374 31.4772 16.6114 31.4772ZM24.4868 31.4772C23.5607 31.4772 22.8068 30.7232 22.8068 29.7972C22.8068 28.8711 23.5607 28.1254 24.4868 28.1254C25.4128 28.1254 26.1668 28.8711 26.1668 29.7972C26.1668 30.7232 25.4128 31.4772 24.4868 31.4772ZM31.5755 31.4772C30.6413 31.4772 29.8955 30.7232 29.8955 29.7972C29.8955 28.8711 30.6413 28.1254 31.5755 28.1254C32.5097 28.1254 33.2555 28.8711 33.2555 29.7972C33.2555 30.7232 32.5015 31.4772 31.5755 31.4772Z"
        fill="#F26522" />
    </svg>
  </div>
</div>
</div>
    `;
        const continuationPages = [];
        this.coverPglength = continuationPages.length + 1;
        return firstPageHtml + continuationPages.join('');
    }
    generateHtml(formData, lines, theme, type = 'FST', hostorigin = '', isAnnotation = false, query = null, annotres = null, summaryOfAnnots = [], summaryOfHihglights = [], isSubmit = true) {
        theme.cCAlign = formData.cCAlign || 'C';
        theme.cBehalfAlign = formData?.cBehalfAlign || 'C';
        theme.nCSpacing = formData?.nCSpacing || 2;
        let isPagination = true;
        if (!isSubmit) {
            isPagination = query.bPagination;
            theme.bTShow = query.bTimestamp;
        }
        const cssVariables = this.themeCssService.generateCssVariables(theme);
        const cssVariablesString = this.themeCssService.generateCssVariablesString(cssVariables);
        const HFDetails = this.detectPosition(formData, theme);
        const showCoverPage = query?.bCoverpg !== false;
        let titlePageHtml = '';
        if (showCoverPage) {
            if (!query?.cTranscript || query?.cTranscript == 'Y') {
                titlePageHtml = this.generateTitlePages(formData, theme, hostorigin);
            }
            else {
                titlePageHtml = this.generateTitlePages_2(query, theme, hostorigin);
            }
        }
        else {
            this.coverPglength = 0;
        }
        const pageTitle = query?.cExportName || 'Transcript Preview';
        let summaryOfAnnotContent = '';
        let summaryOfHihglightsContent = '';
        const issueAnnots = (annotres && annotres.length) && query.bQfact ? annotres[0] : [];
        if (isAnnotation) {
            summaryOfAnnotContent = this.bindAnnotationSummary(summaryOfAnnots, summaryOfHihglights);
            summaryOfHihglightsContent = '';
        }
        const highlights = (annotres && annotres.length) && query.bQmark ? annotres[1] : [];
        (highlights || []).forEach((h, i) => {
        });
        const annotTypeFilter = query?.cAnnotationType;
        const docLinksEnabled = isAnnotation
            && (query?.bAnnotations !== false)
            && (annotTypeFilter === 'ALL' || annotTypeFilter === 'LINK' || !annotTypeFilter);
        const docLinks = docLinksEnabled && (annotres && annotres.length > 2) ? (annotres[2] || []) : [];
        const firstPageNo = lines[0].pageno;
        const maxLineno = lines
            .filter(entry => entry.pageno === firstPageNo)
            .reduce((max, curr) => Math.max(max, curr.lineno), 0);
        const pages = this.generatePages(lines, type);
        const contentPagesHtml = pages.map((page, pageIndex) => {
            try {
                if (!isSubmit && query.jPages && query.jPages.length) {
                    if (!query.jPages.includes(pageIndex + 1)) {
                        return ``;
                    }
                }
            }
            catch (error) {
            }
            const curPageData = isAnnotation ? issueAnnots.filter(i => i.pageIndex == (pageIndex + 1)) : [];
            const curDocData = docLinks.filter((d) => d.pageIndex == (pageIndex + 1));
            this.coverPglength = isAnnotation ? 0 : this.coverPglength;
            this.indexpagecount = isAnnotation ? 0 : this.indexpagecount;
            const pageNumberDisplay = this.generatePageNumber(theme, (pageIndex + this.coverPglength + this.indexpagecount));
            const swapClass = theme?.bPNSwap ? `swape-page-${theme?.cPNAlignRL}` : '';
            const fourUpClass = type == '4UP' ? 'fourUp-page' : '';
            let quesContinue = false;
            let pageContent = '';
            try {
                pageContent = page.page.map((pageNum) => {
                    const pageLines = this.getLines(lines, pageNum, maxLineno);
                    const justifyBetween = theme?.nBLinespacing === 0 ? 'justify-between' : '';
                    return `
            <div id="page-${pageIndex + 1}" style="vertical-align: top;" class="lines-wrapper ${justifyBetween}">
              ${page.page.length > 1 ? `
                <div style="padding-right: 10px;">
                   <h6 class="text-end secondarypageno customfont"> ${pageNum ? 'Page ' + (pageNum + this.coverPglength + this.indexpagecount) : ''}</h6>
                </div>
              ` : ''}
              
              ${pageLines.map((line, index) => {
                        let matchingLine = null;
                        const hasLineBreak = this.detectLineBreak(line.linetext, theme);
                        const lineHeight = this.calculatePreHeight(line.linetext, theme);
                        const lineBreakClass = hasLineBreak ? 'brakline' : 'nobreak';
                        let questionText = line.linetext;
                        [questionText, quesContinue] = this.transformQuestionOrSpicker(line.linetext, theme.jBBold, quesContinue);
                        let startIndex = 0, endIndex = 0;
                        const currentLinedata = highlights.find(a => a.cLineno && (a && a.cPageno == (pageIndex + 1) && a.cLineno == (index + 1)));
                        const color2 = currentLinedata && currentLinedata.cColor ? `#${currentLinedata.cColor};` : '';
                        let color = null;
                        if (isAnnotation && curPageData.length > 0) {
                            const matchingLines = this.utilityService.findAllMatchingLines(curPageData, index + 1);
                            const sortedMatches = [...matchingLines]
                                .filter(m => m && (m.startIndex < m.endIndex))
                                .sort((a, b) => b.startIndex - a.startIndex || b.endIndex - a.endIndex);
                            for (const match of sortedMatches) {
                                try {
                                    const openTag = `<span class="inline-highlight" style="background:${match.color};opacity:0.8;mix-blend-mode:darken;">`;
                                    const closeTag = `</span>`;
                                    questionText = this.wrapPlainRangeWithTagSkipping(questionText, match.startIndex, match.endIndex, openTag, closeTag);
                                }
                                catch (error) {
                                    console.error('highlight inline-wrap error', error);
                                }
                            }
                        }
                        if (curDocData.length > 0) {
                            const matchingDocs = this.utilityService.findAllMatchingLines(curDocData, index + 1);
                            const sortedDocs = [...matchingDocs]
                                .filter(m => m && (m.startIndex < m.endIndex))
                                .sort((a, b) => b.startIndex - a.startIndex || b.endIndex - a.endIndex);
                            for (const match of sortedDocs) {
                                try {
                                    const colorRaw = (match.color || '#7DBAFF').toString();
                                    const colorHex = colorRaw.startsWith('#') ? colorRaw : `#${colorRaw}`;
                                    const openTag = `<span class="doclink-underline" style="border-bottom:2px dashed ${colorHex};padding-bottom:1px;">`;
                                    const closeTag = `</span>`;
                                    questionText = this.wrapPlainRangeWithTagSkipping(questionText, match.startIndex, match.endIndex, openTag, closeTag);
                                }
                                catch (error) {
                                    console.error('doclink inline-wrap error', error);
                                }
                            }
                        }
                        const bgHighlightStyle = hasLineBreak
                            ? `top:0; bottom:0;`
                            : `top:-2px; height:22px;`;
                        return `
                  <div id="page-${pageIndex + 1}-${line.lineno}" class="line-table ${lineBreakClass}" style="height: ${lineHeight}px;position:relative" >
                  <div class="highlight-layer1"
                      style="
                          left:${0}px;
                          width:100%;
                          background:${color2};
                          opacity:0.8;
                          position:absolute;
                          ${bgHighlightStyle}
                              z-index: 0;
                          mix-blend-mode: darken;
                      ">
                  </div>
                    <div style="display: flex; align-items: baseline;">
                      <span class="line-no customfont"> <a class="line-no customfont" id="line-${pageIndex + 1}-${line.lineno}" href="#line-${pageIndex + 1}-${line.lineno}"> ${!line.lineno || line.lineno > 9 ? '' : '0'}${line.lineno ? line.lineno : ''}</a></span>
                      <span class="timestamp customfont">${line.timestamp ? line.timestamp : ''}</span>
                      <div class="line-text">
                      <pre class="customfont" style="height: ${lineHeight}px; position:relative;z-index: 10;">${questionText}</pre>
                      </div>
                    </div>
                  </div>
            `;
                    }).join('')}
            </div>
          `;
                }).join('');
            }
            catch (error) {
            }
            const firstpageno = page.page[0] + this.coverPglength + this.indexpagecount;
            const lastpageno = Math.max(...page.page) + this.coverPglength + this.indexpagecount;
            return `
        <div class="page page-break bg-white ${swapClass} ${fourUpClass}"  style="display: flex;flex-direction: column;" >
          <div>
            <div class="new-header">
              <div class="left">
                <div style="display: flex; flex-direction: column;">
<pre class="data-postion1-TL customfont" [data-postion1]="TL">${HFDetails.TL.value1}</pre>
<p class="customfont block data-postion2-TL customfont" [data-postion2]="TL">${HFDetails.TL.value2}</p>
                  ${(type == '4UP') || !isPagination ? '' : ((theme?.cPNAlignRL === 'Left' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `
                    <span class="page-number-left" style="display: flex;align-items: center;gap: 3px;">
                      <span class="mainpageno customfont">
                        <span class="customfont">${pageNumberDisplay}</span>
                      </span>
                    </span>
                  ` : ''}
                </div>
              </div>
              <div class="right" style="height: calc((var(--header-footer-font-size) * 1.5) * ${((theme?.cPNAlignRL === 'Right' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `3` : `2`});position: relative;">
                <span class="data-postion1-TR customfont" style="position: absolute;right: 0;" [data-postion1]="TR">${HFDetails.TR.value1}</span>
                <span class="data-postion2-TR customfont" style="position: absolute;right: 0;    top: calc(var(--header-footer-font-size) * 1.5);" [data-postion2]="TR">${HFDetails.TR.value2}</span>
                <span style="position: absolute;right: 0;top: calc((var(--header-footer-font-size) * 1.5) * 2);">
                  ${(type == '4UP') || !isPagination ? '' : ((theme?.cPNAlignRL === 'Right' || theme?.bPNSwap) && theme?.cPNAlignTB === 'Top') ? `
                    <span style="text-align: end;display: flex;" class="text-end customfont whitespace-nowrap  customfont">
                      ${pageNumberDisplay}
                    </span>
                  ` : ''}
                </span>
              </div>
            </div>
          </div>

          <div class="${page.page.length > 1 ? 'grid-container' : 'page-wrapper'}" >
            ${pageContent}
          </div>

          <div>
            <div style="vertical-align: bottom;" >
            ${page.page.length > 1 ? `
                 <span  style="display:block" class="text-end customfont">${((pageIndex + this.coverPglength + this.indexpagecount) + 1) + '(Pages ' + (firstpageno) + ' to ' + lastpageno})</span>
            ` : ''} 
            <table class="page-header page-footer" >
                <tr>
                  <td class="head-left customfont">
                    <div class="flex items-start gap-2 customfont">
                  
<pre class="data-postion1-BL customfont" [data-postion1]="BL"> ${HFDetails.BL.value1}</pre>
                    </div>
                    <div>
                      <span class="customfont block data-postion2-BL customfont" [data-postion2]="BL">${HFDetails.BL.value2}</span>
                    </div>
                      <span style="${type == '4UP' || !isPagination ? 'display: none;' : 'display: flex;align-items: center;gap: 3px;'}"> 
                    ${(theme?.cPNAlignRL === 'Left' && theme?.cPNAlignTB === 'Bottom') ? `
                        <span class="flex items-center gap-2 mainpageno customfont">
                          <span class="customfont">${pageNumberDisplay}</span>
                        </span>
                      ` : ''}
                      </span>
                  </td>
                  <td class="head-right">
                 
                    <div class="gap-2 ">
<pre class="data-postion1-BR customfont" [data-postion1]="BR">${HFDetails.BR.value1}</pre>
<span  style="${type == '4UP' || !isPagination ? 'display: none;' : 'display: flex;align-items: center;gap: 3px;justify-content: end'}"> 
                      ${(theme?.cPNAlignRL === 'Right' && theme?.cPNAlignTB === 'Bottom') ? `
                        <span class="flex items-center justify-end gap-2 mainpageno customfontall">
                          <span class="customfont">${pageNumberDisplay}</span>
                        </span>
                      ` : ''}
                    </div>
                    </span>
                    <div>
                      <span class="customfont block data-postion2-BR customfont "  [data-postion2]="BR">${HFDetails.BR.value2}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          </div>
        </div>
      `;
        }).join('');
        return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${(query?.cExportName || query?.cCasename || 'Transcript').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</title>
          <style>
            :root {
              ${cssVariablesString}
            }
            ${this.themeCssService.getBaseCss()}
          </style>
        </head>
        <body>
          <div class="page-container transcript-preview-page overflow-auto">
            ${titlePageHtml}
            ${isAnnotation ? summaryOfAnnotContent : ''}
            ${isAnnotation ? summaryOfHihglightsContent : ''}            
            ${contentPagesHtml}
          </div>
        </body>
      </html>
    `;
    }
    transformQuestionOrSpicker(value, jBBold, continueFlag) {
        if (!value)
            return ['', continueFlag];
        let formatted = value;
        const speakerRegex = /^([^:]+):/;
        if (jBBold.includes('S') && speakerRegex.test(formatted)) {
            formatted = formatted.replace(speakerRegex, '<strong>$1:</strong>');
        }
        if (formatted.includes('A.')) {
            continueFlag = false;
        }
        const questionIndex = formatted.indexOf('Q.');
        if (jBBold.includes('Q') && (questionIndex !== -1 || continueFlag)) {
            continueFlag = true;
            formatted = `<strong>${formatted}</strong>`;
        }
        return [formatted, continueFlag];
    }
    buildAnnotCard(annot, showFactLink = false) {
        const issues = annot.issues || [];
        const coords = annot.jCordinates || [];
        let pgRange = '';
        let pgHref = annot.pageIndex ? `#page-${annot.pageIndex}${annot.cLineno ? '-' + annot.cLineno : ''}` : '#';
        if (coords.length > 0) {
            const first = coords[0];
            const last = coords[coords.length - 1];
            pgRange = `P ${first.p}.${first.l} &ndash; ${last.p}.${last.l}`;
            pgHref = `#page-${first.p}-${first.l}`;
        }
        else if (annot.pageIndex) {
            pgRange = `P ${annot.pageIndex}${annot.cLineno ? '.' + annot.cLineno : ''}`;
        }
        const metaStr = [annot.cCreateby, annot.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');
        const primary = issues[0];
        const primaryColor = primary?.cColor ? `#${primary.cColor}` : '#cccccc';
        let html = `<div class="ac-card">`;
        if (primary) {
            const impactSrc = primary.cImp && primary.nImpactid
                ? (primary.impactImgSrc || `https://etabella.tech/docs/impacts/${primary.nImpactid}.png`)
                : '';
            html += `<div class="ac-title-row">
        <div class="ac-title-left">
          <span class="ac-issue-bar" style="background:${primaryColor}"></span>
          <span class="ac-issue-name">${primary.cIName || ''}</span>
        </div>
        <div class="ac-title-right">
          ${primary.cRel ? `<span class="ac-rel-pill">${primary.cRel}</span>` : ''}
          ${impactSrc ? `<img class="ac-impact-img" src="${impactSrc}">` : ''}
        </div>
      </div>`;
        }
        if (metaStr)
            html += `<div class="ac-meta">Created by ${metaStr}</div>`;
        if (pgRange) {
            html += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;
        }
        if (coords.length > 0) {
            html += `<div class="ac-lines">`;
            coords.forEach(c => {
                html += `<div class="ac-line">
          <span class="ac-ln">${c.l}</span>
          <span class="ac-ts">${c.t || ''}</span>
          <span class="ac-lt">${c.text || ''}</span>
        </div>`;
            });
            html += `</div>`;
        }
        else if (annot.cONote) {
            html += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${annot.cONote}</span></div></div>`;
        }
        const noteText = (annot.cNote || '').trim();
        const srcText = (annot.cONote || '').trim();
        if (noteText && noteText !== srcText)
            html += `<div class="ac-note">Note: ${noteText}</div>`;
        const links = annot.list || [];
        if (showFactLink && links.length > 0) {
            links.forEach(link => {
                const isOutgoing = link.jLinktype?.type === 'C';
                const btnLabel = isOutgoing ? 'Outgoing DocLink' : 'FactLink';
                html += `<div class="ac-factlink-row">
          <span class="ac-fl-btn">${btnLabel}</span>
          <span class="ac-fl-icon">&#128196;</span>
          <span class="ac-fl-filename">${link.cFilename || ''}</span>
          ${link.cExhibitno ? `<span class="ac-fl-exhibit">Exhibit No. ${link.cExhibitno}</span>` : ''}
        </div>`;
                const metaParts = [];
                if (link.cRefpage)
                    metaParts.push(`Ref: ${link.cRefpage}`);
                if (link.cBundletag)
                    metaParts.push(`Bundle: ${link.cBundletag}`);
                if (metaParts.length)
                    html += `<div class="ac-fl-meta">${metaParts.join(' &nbsp;|&nbsp; ')}</div>`;
                const linkMeta2 = [];
                const between = link.cBetween || link.jLinktype?.cBetween || '';
                const fromDate = link.dFrom || link.dStart || link.jLinktype?.dFrom || link.jLinktype?.dStart || '';
                const toDate = link.dTo || link.dEnd || link.jLinktype?.dTo || link.jLinktype?.dEnd || '';
                const docType = link.cType || link.cDoctype || link.jLinktype?.cType || link.jLinktype?.cDoctype || '';
                const statusVal = link.cStatus || link.jLinktype?.cStatus || '';
                if (between) {
                    linkMeta2.push(`Between: ${between}`);
                }
                else if (fromDate || toDate) {
                    linkMeta2.push(`Between: Start ${fromDate || '?'} – End ${toDate || '?'}`);
                }
                if (docType)
                    linkMeta2.push(`Type: ${docType}`);
                if (statusVal)
                    linkMeta2.push(`Status: ${statusVal}`);
                if (linkMeta2.length)
                    html += `<div class="ac-fl-meta">${linkMeta2.join(' &nbsp;|&nbsp; ')}</div>`;
                const linkNote = link.cNote || link.cDesc || link.cBody || '';
                if (linkNote)
                    html += `<div class="ac-fl-note">${linkNote}</div>`;
            });
        }
        html += `</div>`;
        return html;
    }
    bindAnnotationSummary(summaryOfAnnots, summaryOfHihglights) {
        const hasAnnots = summaryOfAnnots?.length > 0;
        const hasHighlights = summaryOfHihglights?.length > 0;
        if (!hasAnnots && !hasHighlights)
            return '';
        const iconQFact = '<span class="ac-icon ac-icon-qfact"><svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.6296 2C13.2542 2 12.8929 2.13458 12.6167 2.41083L8.50125 6.53333L12.5033 10.5354L16.6258 6.42C17.1712 5.8675 17.1712 4.975 16.6258 4.41542L14.6142 2.41083C14.3379 2.13458 13.9837 2 13.6296 2ZM7.82125 7.20625L3.59958 11.4279C3.04708 11.9804 3.04708 12.8729 3.61375 13.4467C2.74958 14.3179 1.87125 15.1892 1 16.0604H5.00917L5.61833 15.4513C6.17083 15.9896 7.05625 15.9825 7.60875 15.4371L11.8233 11.2154" fill="currentColor"/><circle cx="13.0234" cy="11.6875" r="4" fill="#002F64" stroke="currentColor"/><rect x="12.5234" y="9.1875" width="1" height="3.5" rx="0.5" fill="currentColor"/><circle cx="13.0234" cy="13.6875" r="0.5" fill="currentColor" stroke="currentColor" stroke-width="0.2"/></svg></span>';
        const iconFact = '<span class="ac-icon ac-icon-fact"><svg width="16" height="14" viewBox="0 0 16 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.99531 12C3.78314 12 3.57966 12.0843 3.42963 12.2343C3.2796 12.3843 3.19531 12.5878 3.19531 12.8C3.19531 13.0122 3.2796 13.2157 3.42963 13.3657C3.57966 13.5157 3.78314 13.6 3.99531 13.6H15.1953C15.4075 13.6 15.611 13.5157 15.761 13.3657C15.911 13.2157 15.9953 13.0122 15.9953 12.8C15.9953 12.5878 15.911 12.3843 15.761 12.2343C15.611 12.0843 15.4075 12 15.1953 12H3.99531Z" fill="currentColor"/><path d="M8.79688 4.8C8.79688 4.58783 8.88116 4.38434 9.03119 4.23431C9.18122 4.08429 9.3847 4 9.59687 4H15.1969C15.409 4 15.6125 4.08429 15.7626 4.23431C15.9126 4.38434 15.9969 4.58783 15.9969 4.8C15.9969 5.01217 15.9126 5.21566 15.7626 5.36569C15.6125 5.51571 15.409 5.6 15.1969 5.6H9.59687C9.3847 5.6 9.18122 5.51571 9.03119 5.36569C8.88116 5.21566 8.79688 5.01217 8.79688 4.8Z" fill="currentColor"/><path d="M3.19531 0.8C3.19531 0.587827 3.2796 0.384344 3.42963 0.234315C3.57966 0.0842854 3.78314 0 3.99531 0H15.1953C15.4075 0 15.611 0.0842854 15.761 0.234315C15.911 0.384344 15.9953 0.587827 15.9953 0.8C15.9953 1.01217 15.911 1.21566 15.761 1.36569C15.611 1.51571 15.4075 1.6 15.1953 1.6H3.99531C3.78314 1.6 3.57966 1.51571 3.42963 1.36569C3.2796 1.21566 3.19531 1.01217 3.19531 0.8Z" fill="currentColor"/><path d="M8.79688 8.8C8.79688 8.58783 8.88116 8.38434 9.03119 8.23431C9.18122 8.08429 9.3847 8 9.59687 8H15.1969C15.409 8 15.6125 8.08429 15.7626 8.23431C15.9126 8.38434 15.9969 8.58783 15.9969 8.8C15.9969 9.01217 15.9126 9.21566 15.7626 9.36569C15.6125 9.51571 15.409 9.6 15.1969 9.6H9.59687C9.3847 9.6 9.18122 9.51571 9.03119 9.36569C8.88116 9.21566 8.79688 9.01217 8.79688 8.8Z" fill="currentColor"/><path d="M7.2 6.79531C7.2 7.26807 7.10688 7.7362 6.92597 8.17297C6.74505 8.60974 6.47987 9.00661 6.14558 9.3409C5.81129 9.67519 5.41443 9.94036 4.97766 10.1213C4.54089 10.3022 4.07276 10.3953 3.6 10.3953C3.12724 10.3953 2.65911 10.3022 2.22234 10.1213C1.78557 9.94036 1.38871 9.67519 1.05442 9.3409C0.720125 9.00661 0.454951 8.60974 0.274034 8.17297C0.0931168 7.7362 0 7.26807 0 6.79531C0 5.84053 0.379285 4.92486 1.05442 4.24973C1.72955 3.5746 2.64522 3.19531 3.6 3.19531C4.55478 3.19531 5.47045 3.5746 6.14558 4.24973C6.82071 4.92486 7.2 5.84053 7.2 6.79531ZM4 5.19531C4 5.08923 3.95786 4.98748 3.88284 4.91247C3.80783 4.83745 3.70609 4.79531 3.6 4.79531C3.49391 4.79531 3.39217 4.83745 3.31716 4.91247C3.24214 4.98748 3.2 5.08923 3.2 5.19531V6.39531H2C1.89391 6.39531 1.79217 6.43745 1.71716 6.51247C1.64214 6.58748 1.6 6.68923 1.6 6.79531C1.6 6.9014 1.64214 7.00314 1.71716 7.07816C1.79217 7.15317 1.89391 7.19531 2 7.19531H3.2V8.39531C3.2 8.5014 3.24214 8.60314 3.31716 8.67816C3.39217 8.75317 3.49391 8.79531 3.6 8.79531C3.70609 8.79531 3.80783 8.75317 3.88284 8.67816C3.95786 8.60314 4 8.5014 4 8.39531V7.19531H5.2C5.30609 7.19531 5.40783 7.15317 5.48284 7.07816C5.55786 7.00314 5.6 6.9014 5.6 6.79531C5.6 6.68923 5.55786 6.58748 5.48284 6.51247C5.40783 6.43745 5.30609 6.39531 5.2 6.39531H4V5.19531Z" fill="currentColor"/></svg></span>';
        const iconDoc = '<span class="ac-icon ac-icon-doc"><svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 7.5C0 7.35082 0.0623823 7.20774 0.173424 7.10225C0.284465 6.99676 0.435069 6.9375 0.592105 6.9375H1.77632C1.93335 6.9375 2.08396 6.99676 2.195 7.10225C2.30604 7.20774 2.36842 7.35082 2.36842 7.5C2.36842 7.64918 2.30604 7.79226 2.195 7.89775C2.08396 8.00324 1.93335 8.0625 1.77632 8.0625H0.592105C0.435069 8.0625 0.284465 8.00324 0.173424 7.89775C0.0623823 7.79226 0 7.64918 0 7.5Z" fill="currentColor"/><path d="M3.15625 7.5C3.15625 7.35082 3.21863 7.20774 3.32967 7.10225C3.44071 6.99676 3.59132 6.9375 3.74836 6.9375H4.93257C5.0896 6.9375 5.24021 6.99676 5.35125 7.10225C5.46229 7.20774 5.52467 7.35082 5.52467 7.5C5.52467 7.64918 5.46229 7.79226 5.35125 7.89775C5.24021 8.00324 5.0896 8.0625 4.93257 8.0625H3.74836C3.59132 8.0625 3.44071 8.00324 3.32967 7.89775C3.21863 7.79226 3.15625 7.64918 3.15625 7.5Z" fill="currentColor"/><path d="M6.3125 7.5C6.3125 7.35082 6.37488 7.20774 6.48592 7.10225C6.59697 6.99676 6.74757 6.9375 6.90461 6.9375H8.08882C8.24585 6.9375 8.39646 6.99676 8.5075 7.10225C8.61854 7.20774 8.68092 7.35082 8.68092 7.5C8.68092 7.64918 8.61854 7.79226 8.5075 7.89775C8.39646 8.00324 8.24585 8.0625 8.08882 8.0625H6.90461C6.74757 8.0625 6.59697 8.00324 6.48592 7.89775C6.37488 7.79226 6.3125 7.64918 6.3125 7.5Z" fill="currentColor"/><path d="M9.46875 7.5C9.46875 7.35082 9.53113 7.20774 9.64217 7.10225C9.75322 6.99676 9.90382 6.9375 10.0609 6.9375H11.2451C11.4021 6.9375 11.5527 6.99676 11.6637 7.10225C11.7748 7.20774 11.8372 7.35082 11.8372 7.5C11.8372 7.64918 11.7748 7.79226 11.6637 7.89775C11.5527 8.00324 11.4021 8.0625 11.2451 8.0625H10.0609C9.90382 8.0625 9.75322 8.00324 9.64217 7.89775C9.53113 7.79226 9.46875 7.64918 9.46875 7.5Z" fill="currentColor"/><path d="M12.6328 7.5C12.6328 7.35082 12.6952 7.20774 12.8062 7.10225C12.9173 6.99676 13.0679 6.9375 13.2249 6.9375H14.4091C14.5662 6.9375 14.7168 6.99676 14.8278 7.10225C14.9389 7.20774 15.0012 7.35082 15.0012 7.5C15.0012 7.64918 14.9389 7.79226 14.8278 7.89775C14.7168 8.00324 14.5662 8.0625 14.4091 8.0625H13.2249C13.0679 8.0625 12.9173 8.00324 12.8062 7.89775C12.6952 7.79226 12.6328 7.64918 12.6328 7.5Z" fill="currentColor"/><path d="M1.96916 0C1.75978 0 1.55897 0.0790176 1.41092 0.21967C1.26286 0.360322 1.17969 0.551088 1.17969 0.75V3.75C1.17969 4.14782 1.34604 4.52936 1.64215 4.81066C1.93826 5.09196 2.33987 5.25 2.75863 5.25H12.2323C12.6511 5.25 13.0527 5.09196 13.3488 4.81066C13.6449 4.52936 13.8113 4.14782 13.8113 3.75V0.75C13.8113 0.551088 13.7281 0.360322 13.58 0.21967C13.432 0.0790176 13.2312 0 13.0218 0H1.96916Z" fill="currentColor"/><path d="M13.0218 15C13.2312 15 13.432 14.921 13.58 14.7803C13.7281 14.6397 13.8113 14.4489 13.8113 14.25V11.25C13.8113 10.8522 13.6449 10.4706 13.3488 10.1893C13.0527 9.90804 12.6511 9.75 12.2323 9.75H2.75863C2.33987 9.75 1.93826 9.90804 1.64215 10.1893C1.34604 10.4706 1.17969 10.8522 1.17969 11.25V14.25C1.17969 14.4489 1.26286 14.6397 1.41092 14.7803C1.55897 14.921 1.75978 15 1.96916 15H13.0218Z" fill="currentColor"/></svg></span>';
        const iconQM = '<span class="ac-icon ac-icon-qm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M3 5h2v2H3zm0 4h2v2H3zm0 4h2v2H3zm0 4h2v2H3zM7 5h14v2H7zm0 4h14v2H7zm0 4h14v2H7zm0 4h14v2H7z"/></svg></span>';
        const sectionMeta = {
            'QFact': { icon: iconQFact, showFactLink: false },
            'Full Fact': { icon: iconFact, showFactLink: true },
            'Quick Mark': { icon: iconQM, showFactLink: false },
            'DocLink': { icon: iconDoc, showFactLink: true },
        };
        const renderAnnotSection = (item) => {
            const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon">&#9776;</span>', showFactLink: false };
            let html = `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item.title}</span>
        </div>`;
            (item.data || []).forEach((annot) => {
                html += this.buildAnnotCard(annot, meta.showFactLink);
            });
            html += `</div>`;
            return html;
        };
        const renderQMSection = (item) => {
            const meta = sectionMeta[item.title] || { icon: '<span class="ac-icon">&#9776;</span>', showFactLink: false };
            const visibleGroups = (item.data || []).filter((group) => {
                const first = group.data?.[0] || {};
                const sortedCoords = (first.jCordinates || []);
                const cPageno = first.cPageno ?? first.pageIndex;
                return cPageno || sortedCoords.length > 0 || (first.cONote || '').trim();
            });
            if (!visibleGroups.length)
                return '';
            let html = `<div class="ac-section">
        <div class="ac-section-head">
          ${meta.icon}
          <span class="ac-type-name">${item?.title}</span>
        </div>`;
            visibleGroups.forEach((group) => {
                const first = group.data?.[0] || {};
                const sortedCoords = (first.jCordinates || []).slice().sort((a, b) => a.p - b.p || a.l - b.l);
                const cPageno = first.cPageno ?? first.pageIndex;
                const cLineno = first.cLineno;
                const pgHref = cLineno ? `#page-${cPageno}-${cLineno}` : `#page-${cPageno}`;
                const bgColor = first.cColor ? `#${first.cColor.replace('#', '')}` : '#EBCAFF';
                let pgRange = cPageno ? `P ${cPageno}${cLineno ? '.' + cLineno : ''}` : '';
                if (sortedCoords.length > 0) {
                    const f = sortedCoords[0];
                    const l = sortedCoords[sortedCoords.length - 1];
                    pgRange = `P ${f.p}.${f.l}${f.t ? '/' + f.t : ''} &ndash; ${l.p}.${l.l}${l.t ? '/' + l.t : ''}`;
                }
                const metaStr = [first.cCreateby, first.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');
                html += `<div class="ac-card" style="border-left: 4px solid ${bgColor}">`;
                if (metaStr)
                    html += `<div class="ac-meta">Created by ${metaStr}</div>`;
                if (pgRange)
                    html += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;
                if (sortedCoords.length > 0) {
                    html += `<div class="ac-lines">`;
                    sortedCoords.forEach((coord) => {
                        html += `<div class="ac-line">
              <span class="ac-ln">${coord.l}</span>
              <span class="ac-ts">${coord.t || ''}</span>
              <span class="ac-lt">${coord.text || ''}</span>
            </div>`;
                    });
                    html += `</div>`;
                }
                else if (first.cONote) {
                    html += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${first.cONote}</span></div></div>`;
                }
                html += `</div>`;
            });
            html += `</div>`;
            return html;
        };
        const annotsHtml = (summaryOfAnnots || [])
            .filter(item => item.title !== 'DocLink')
            .map(renderAnnotSection)
            .join('');
        const qmHtml = (summaryOfHihglights || [])
            .map(renderQMSection)
            .join('');
        const docHtml = (summaryOfAnnots || [])
            .filter(item => item.title === 'DocLink')
            .map(renderAnnotSection)
            .join('');
        const innerHtml = annotsHtml + qmHtml + docHtml;
        if (!innerHtml)
            return '';
        this.indexpagecount += 1;
        return `<div class="page page-break indexpage-banner p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">${innerHtml}</div>
    </div>`;
    }
    bindIssuesIndex(summaryOfAnnots) {
        if (!summaryOfAnnots?.length)
            return '';
        const sectionIcons = {
            'QFact': '&#10003;',
            'Full Fact': '&#8801;',
            'Quick Mark': '&#8801;',
            'DocLink': '&#8599;',
        };
        let mainContent = `<div class="page page-break indexpage p-0">
      <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
      <div class="ac-body">`;
        summaryOfAnnots.forEach((item) => {
            const icon = sectionIcons[item.title] || '&#8801;';
            const showFactLink = item.title === 'Full Fact' || item.title === 'DocLink';
            mainContent += `<div class="ac-section">
        <div class="ac-section-head">
          <span class="ac-type-icon">${icon}</span>
          <span class="ac-type-name">${item.title}</span>
        </div>`;
            (item.data || []).forEach((annot) => {
                mainContent += this.buildAnnotCard(annot, showFactLink);
            });
            mainContent += `</div>`;
        });
        mainContent += `</div></div>`;
        this.indexpagecount += 1;
        return mainContent;
    }
    bindHighlightsIndex(summaryOfHihglights, theme) {
        if (!summaryOfHihglights?.length)
            return '';
        let mainContent = '';
        try {
            summaryOfHihglights.forEach((item) => {
                mainContent += `<div class="page page-break indexpage p-0">
          <div class="annot-summary-banner">Transcript &#8212; Annotations Summary</div>
          <div class="ac-body">
            <div class="ac-section">
              <div class="ac-section-head">
                <span class="ac-type-icon">&#8801;</span>
                <span class="ac-type-name">${item?.title}</span>
              </div>`;
                item.data.forEach((group) => {
                    const first = group.data?.[0] || {};
                    const sortedCoords = (first.jCordinates || []).sort((a, b) => a.l - b.l);
                    const cPageno = first.cPageno ?? first.pageIndex;
                    const cLineno = first.cLineno;
                    const pgHref = cLineno ? `#page-${cPageno}-${cLineno}` : `#page-${cPageno}`;
                    let pgRange = cPageno ? `P ${cPageno}${cLineno ? '.' + cLineno : ''}` : '';
                    if (sortedCoords.length > 0) {
                        const f = sortedCoords[0];
                        const l = sortedCoords[sortedCoords.length - 1];
                        pgRange = `P ${f.p}.${f.l}${f.t ? '/' + f.t : ''} &ndash; ${l.p}.${l.l}${l.t ? '/' + l.t : ''}`;
                    }
                    const metaStr = [first.cCreateby, first.dCreateDt].filter(Boolean).join(' &nbsp;|&nbsp; ');
                    mainContent += `<div class="ac-card">`;
                    if (metaStr)
                        mainContent += `<div class="ac-meta">Created by ${metaStr}</div>`;
                    if (pgRange)
                        mainContent += `<div class="ac-pgbar"><a href="${pgHref}" style="color:#fff;text-decoration:none;">${pgRange}</a></div>`;
                    if (sortedCoords.length > 0) {
                        mainContent += `<div class="ac-lines">`;
                        sortedCoords.forEach(coord => {
                            mainContent += `<div class="ac-line">
                <span class="ac-ln">${coord.l}</span>
                <span class="ac-ts">${coord.t || ''}</span>
                <span class="ac-lt">${coord.text || ''}</span>
              </div>`;
                        });
                        mainContent += `</div>`;
                    }
                    else if (first.cONote) {
                        mainContent += `<div class="ac-lines"><div class="ac-line"><span class="ac-lt">${first.cONote}</span></div></div>`;
                    }
                    if (first.cNote)
                        mainContent += `<div class="ac-note">Note: ${first.cNote}</div>`;
                    mainContent += `</div>`;
                });
                mainContent += `</div></div></div>`;
                this.indexpagecount += 1;
            });
        }
        catch (error) {
            console.error('Error in bindHighlightsIndex:', error);
        }
        return mainContent;
    }
    bindAllIssues(annot) {
        let mainContent = '';
        mainContent += `<div class="issue">`;
        try {
            if (annot?.issues?.length) {
                annot.issues.forEach((issue) => {
                    mainContent +=
                        ` <div class="issuewrap">
                  <div class="name"> <span class="issuebar" style="background:#${issue.cColor} !important"></span> <span class="text">${issue.cIName}</span> </div>`;
                    if (issue?.cRel) {
                        mainContent += `<div class="rel"> <span class="relspn">${issue.cRel} </span> </div>`;
                    }
                    if (issue?.cImp) {
                        mainContent += `
                      <div class="impact"><img width="20px" src="${issue.impactImgSrc || `https://etabella.tech/docs/impacts/${issue.nImpactid}.png`}"> </div>
                     `;
                    }
                    mainContent += `</div>`;
                });
            }
        }
        catch (error) {
        }
        mainContent += `</div>`;
        return mainContent;
    }
    calculatePreHeightCanvas(text, theme, width) {
        const canvas = (typeof window !== 'undefined' && window.document)
            ? document.createElement('canvas')
            : {
                getContext: () => ({
                    font: '',
                    measureText: (t) => ({ width: t.length * 10 })
                })
            };
        const ctx = canvas.getContext('2d');
        const fontFamily = theme?.nBFont
            ? this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier'
            : 'courier';
        const fontSize = 12;
        const fontWeight = 500;
        const letterSpacing = 0.2;
        const lineHeight = 1.5;
        const containerWidth = width || 554;
        const padding = 0;
        const availableWidth = containerWidth - padding;
        ctx.font = `${fontSize}px ${fontFamily}`;
        let normalizedText = text || '';
        normalizedText = normalizedText.replace(/<br\s*\/?>/gi, '\n');
        const lines = normalizedText.split('\n');
        let totalLines = 0;
        lines.forEach(line => {
            line = line.replace(/^\s+/, '');
            if (line.length === 0) {
                totalLines += 1;
                return;
            }
            let currentLine = '';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const testLine = currentLine + char;
                const testWidth = ctx.measureText(testLine).width;
                if (testWidth > availableWidth) {
                    totalLines += 1;
                    currentLine = char;
                }
                else {
                    currentLine = testLine;
                }
            }
            if (currentLine.length > 0) {
                totalLines += 1;
            }
        });
        const lineHeightPx = fontSize * lineHeight;
        return totalLines * lineHeightPx;
    }
    getTextWidth(text, font = '14px Arial') {
        const canvas = (0, canvas_1.createCanvas)(488, 50);
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        return ctx.measureText(text).width;
    }
    getTextWidth_new(text, font = '14px Arial', letterSpacing = '0px') {
        const canvas = (0, canvas_1.createCanvas)(1000, 50);
        const ctx = canvas.getContext('2d');
        ctx.font = font;
        if ('letterSpacing' in ctx) {
            ctx.letterSpacing = letterSpacing;
            return ctx.measureText(text).width;
        }
        const baseWidth = ctx.measureText(text).width;
        const letterSpacingValue = parseFloat(letterSpacing.replace('px', ''));
        const characterGaps = Math.max(0, text.length - 1);
        const totalLetterSpacing = characterGaps * letterSpacingValue;
        return baseWidth + totalLetterSpacing;
    }
    wrapPlainRangeWithTagSkipping(formatted, plainStart, plainEnd, openTag, closeTag) {
        if (plainStart >= plainEnd || !formatted)
            return formatted;
        let output = '';
        let plainPos = 0;
        let inTag = false;
        let inRange = false;
        for (let i = 0; i < formatted.length; i++) {
            const c = formatted[i];
            if (inTag) {
                output += c;
                if (c === '>') {
                    inTag = false;
                    if (inRange && plainPos < plainEnd)
                        output += openTag;
                }
                continue;
            }
            if (c === '<') {
                if (inRange)
                    output += closeTag;
                output += c;
                inTag = true;
                continue;
            }
            if (plainPos === plainStart && !inRange) {
                output += openTag;
                inRange = true;
            }
            if (plainPos === plainEnd && inRange) {
                output += closeTag;
                inRange = false;
            }
            output += c;
            plainPos++;
        }
        if (inRange)
            output += closeTag;
        return output;
    }
};
exports.TranscriptHtmlService = TranscriptHtmlService;
exports.TranscriptHtmlService = TranscriptHtmlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof theme_css_service_1.ThemeCssService !== "undefined" && theme_css_service_1.ThemeCssService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], TranscriptHtmlService);


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
exports.ThemeCssService = void 0;
const common_1 = __webpack_require__(3);
let ThemeCssService = class ThemeCssService {
    constructor() {
        this.fontOptions = [
            {
                nValue: 1,
                cKey: 'Calibri',
                jOther: { font: 'calibri' }
            },
            {
                nValue: 2,
                cKey: 'Georgia',
                jOther: { font: 'georgia' }
            },
            {
                nValue: 3,
                cKey: 'courier',
                jOther: { font: 'courier' }
            },
            {
                nValue: 4,
                cKey: 'Times New Roman',
                jOther: { font: 'times' }
            },
            {
                nValue: 5,
                cKey: 'Open Sans',
                jOther: { font: 'Opensans' }
            },
            {
                nValue: 6,
                cKey: 'Arial',
                jOther: { font: 'arial' }
            },
        ];
    }
    generateCssVariables(theme) {
        const variables = {};
        const setCssVariable = (name, value) => {
            variables[name] = value;
        };
        setCssVariable('--cover-line-spacing', theme?.nCSpacing == 1 ? '1.2' : '1.8');
        setCssVariable('--before-gap', theme?.nBFHeight === 0 ? '5px' : `${theme?.nBFHeight || 5}px`);
        setCssVariable('--between-gap', theme?.nBTHeight === 0 ? '5px' : `${theme?.nBTHeight || 5}px`);
        setCssVariable('--appear-gap', theme?.nAHeight === 0 ? '5px' : `${theme?.nAHeight || 5}px`);
        setCssVariable('--titlepage-header-gap', theme?.nTHeight === 0 ? '5px' : `${theme?.nTHeight || 5}px`);
        setCssVariable('--casetype-align', theme?.cCAlign == 'C' ? 'center' : 'left');
        setCssVariable('--appearances-align', theme?.cBehalfAlign == 'C' ? 'center' : 'left');
        setCssVariable('--casetype-transform', theme?.bCIsCaps ? 'uppercase' : 'none');
        const coverFont = theme?.nCFontid ?
            this.fontOptions.find(f => f.nValue == theme?.nCFontid)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--cover-font-family', coverFont);
        setCssVariable('--cover-font-size', theme?.nCFontsize ? `${theme?.nCFontsize}pt` : '12pt');
        const bodyFont = theme?.nBFont ?
            this.fontOptions.find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--body-font-family', bodyFont);
        setCssVariable('--body-font-size', `${theme?.nBFontsize || 17}pt`);
        setCssVariable('--body-letter-spacing', theme?.nBLetterspacing == null ? '0.5px' : `${theme?.nBLetterspacing}px`);
        setCssVariable('--body-line-spacing', theme?.nBLinespacing == 0 ? '2px' : `${theme?.nBLinespacing}pt`);
        const pageNumberFont = theme?.nPNFont ?
            this.fontOptions.find(f => f.nValue == theme?.nPNFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--page-number-font-family', pageNumberFont);
        const pageNumberFontSize = theme?.nPNFontsize == null ? '14pt' : `${theme?.nPNFontsize}pt`;
        setCssVariable('--page-number-font-size', pageNumberFontSize);
        setCssVariable('--page-number-vertical-align', theme?.cPNAlignTB ? theme?.cPNAlignTB.toLowerCase() : 'bottom');
        setCssVariable('--page-number-horizontal-align', theme?.cPNAlignRL ? theme?.cPNAlignRL?.toLowerCase() : 'right');
        const lineNumberFont = theme?.nLFont ?
            this.fontOptions.find(f => f.nValue == theme?.nLFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--line-number-font-family', lineNumberFont);
        const lineNumberFontSize = theme?.nLFontsize == null ? '14pt' : `${theme?.nLFontsize}pt`;
        setCssVariable('--line-number-font-size', lineNumberFontSize);
        setCssVariable('--line-number-display', theme?.bLNShow == null ? 'inline' : (theme?.bLNShow ? 'inline' : 'none'));
        const timestampFont = theme?.nTFont ?
            this.fontOptions.find(f => f.nValue == theme?.nTFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--timestamp-font-family', timestampFont);
        const timestampFontSize = theme?.nTFontsize == null ? '14pt' : `${theme?.nTFontsize}pt`;
        setCssVariable('--timestamp-font-size', timestampFontSize);
        setCssVariable('--timestamp-display', theme?.bTShow == null ? 'inline' : (theme?.bTShow ? 'inline' : 'none'));
        const headerFooterFont = theme?.nHFont ?
            this.fontOptions.find(f => f.nValue == theme?.nHFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--header-footer-font-family', headerFooterFont);
        const headerFooterFontSize = theme?.nHFontsize == null ? '14pt' : `${theme?.nHFontsize}pt`;
        setCssVariable('--header-footer-font-size', headerFooterFontSize);
        setCssVariable('--header-footer-display', theme?.bHShow == null ? 'table' : (theme?.bHShow ? 'table' : 'none'));
        setCssVariable('--header-footer-cover-display', theme?.bHCover == null ? 'block' : (theme?.bHCover ? 'block' : 'none'));
        setCssVariable('--caseName-vertical', (theme?.cPCaseName || '').includes('B') ? 'bottom' : 'top');
        setCssVariable('--caseName-horizontal', (theme?.cPCaseName || '').includes('R') ? 'right' : 'left');
        setCssVariable('--volumeDate-vertical', (theme?.cPVolumeDate || '').includes('B') ? 'bottom' : 'top');
        setCssVariable('--volumeDate-horizontal', (theme?.cPVolumeDate || '').includes('R') ? 'right' : 'left');
        setCssVariable('--company-vertical', (theme?.cPCompany || '').includes('B') ? 'bottom' : 'top');
        setCssVariable('--company-horizontal', (theme?.cPCompany || '').includes('R') ? 'right' : 'left');
        setCssVariable('--companyInfo-vertical', (theme?.cPCompanyInfo || '').includes('B') ? 'bottom' : 'top');
        setCssVariable('--companyInfo-horizontal', (theme?.cPCompanyInfo || '').includes('R') ? 'right' : 'left');
        setCssVariable('--case-type-bold', (theme?.jCBold || '').includes('C') ? '700' : '400');
        setCssVariable('--parties-bold', (theme?.jCBold || '').includes('P') ? '700' : '400');
        setCssVariable('--before-bold', (theme?.jCBold || '').includes('B') ? '700' : '400');
        setCssVariable('--appearances-bold', (theme?.jCBold || '').includes('A') ? '700' : '400');
        setCssVariable('--question-bold', (theme?.jCBold || '').includes('Q') ? '700' : '400');
        setCssVariable('--speaker-bold', (theme?.jCBold || '').includes('S') ? '700' : '400');
        return variables;
    }
    generateCssVariablesString(variables) {
        return Object.entries(variables)
            .map(([key, value]) => `${key}: ${value};`)
            .join('\n              ');
    }
    getBaseCss() {
        return `

      @font-face {
        font-family: 'calibri';
        src: url('./assets/fonts/styles/calibri-regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'calibri';
        src: url('./assets/fonts/styles/calibri-bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'courier';
        src: url('./assets/fonts/styles/CourierPrime-Bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }

      @font-face {
        font-family: 'times';
        font-style: normal;
        font-weight: normal;
        src: local('Times New Roman'), url(./assets/fonts/styles/times.woff) format('woff')
      }


      @font-face {
        font-family: 'times';
        font-style: normal;
        font-weight: normal;
        src: local('Times New Roman'), url(./assets/fonts/styles/times.woff) format('woff')
      }

      @font-face {
        font-family: 'georgia';
        font-style: normal;
        font-weight: normal;
        src: local('Georgia Regular'), url(./assets/fonts/styles/georgia.woff) format('woff');
      }

      @font-face {
        font-family: 'arial';
        font-style: normal;
        font-weight: normal;
        src: local('Arial Regular'), url(./assets/fonts/styles/ARIAL.woff) format('woff');
      }

      @font-face {
        font-family: 'verdana';
        font-style: normal;
        font-weight: normal;
        src: local('Verdana'), url(./assets/fonts/styles/Verdana.ttf) format('ttf');
      }

      @font-face {
        font-family: 'Opensans';
        font-style: normal;
        font-weight: 700;
        font-stretch: 100%;
        font-display: swap;
        src: url(https://fonts.gstatic.com/s/opensans/v40/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1x4jaVIGxA.woff2) format('woff2');
        unicode-range: U+0370-0377, U+037A-037F, U+0384-038A, U+038C, U+038E-03A1, U+03A3-03FF;
      }


      * {
    -webkit-print-color-adjust: exact !important;   /* Chrome, Safari 6 – 15.3, Edge */
    color-adjust: exact !important;                 /* Firefox 48 – 96 */
    print-color-adjust: exact !important;           /* Firefox 97+, Safari 15.4+ */
}


      * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }


      p, span, pre {
          line-height: 1.5;
          }

      body {
        height: 100%;
        overflow: auto;
      }

      .page-break {
        page-break-before: always;
      }


@media print {
  @page {
    size: A4;
    margin: 0;
  }
  /* Named pages for the annotation-summary wrappers.
     Top margin 30px to match transcript pages (which use padding-top: 30px).
     Left/right are 0 so the banner spans the full paper width; the 80px
     horizontal gutter is applied by .ac-body padding to match transcript pages. */
  @page indexpage {
    margin: 30px 0 0 0;
  }
  @page indexpage-banner {
    margin: 30px 0 0 0;
  }
  @page indexpage-banner:first {
    margin: 0 30px 0 30px;
  }

  html, body {
    margin: 0;
    padding: 0;
  }

  .page {
    box-sizing: border-box;   /* include border in 210 × 297 mm */
    width: 210mm;
    height: 297mm;

    /* kill the 30-px padding that exists in screen CSS */
    margin: 0;

    /* optional: draw the border that hugs the paper */
    /* border: 1px solid #000;                              */
  }

  .indexpage {
    height: auto !important;
    /* min-height removed: the named @page above gives a 30px top margin, leaving only
       ~267mm of usable content area per A4 page. A 297mm min-height would no longer fit
       in one physical page, so Chromium would spill into an empty continuation page
       between sections. The next wrapper already uses page-break-before: always to start
       on a fresh page. */
    min-height: 0 !important;
    overflow: visible !important;
    page: indexpage; /* opt this wrapper into the named @page indexpage rule above */
  }
  .indexpage-banner {
    height: auto !important;
    min-height: 0 !important;
    overflow: visible !important;
    page: indexpage-banner; /* first wrapper with the banner — uses :first rule for page 1 */
  }

   .pagebreak { page-break-before: always; }
}


      .page {
        padding: 30px;
        position: relative;
        min-height: 297mm;
        height: 297mm;
        font-family: var(--cover-font-family, 'courier');
        font-size: var(--cover-font-size, '12px');
        background-color: #fff;
        width: 210mm;
        margin: 0 auto 0px;
              box-sizing: border-box;


      }

      .indexpage,
      .indexpage-banner {
        height: auto !important;
        /* Was 297mm; combined with the named-page 30px top margin this caused the wrapper
           to overflow into an empty continuation page between sections. page-break-before
           on the next wrapper already forces a fresh page, so a fixed min-height is unneeded. */
        min-height: 0 !important;
        overflow: visible !important;
        /* Override the global .page padding (30px). The horizontal gutter is handled by
           the named @page margin so children (banner, section pills, cards) all share the
           same x-origin and align cleanly. */
        padding: 0 !important;
      }

      .titlepage {
        position: relative;
      }


      
      .titlepage.showBrand .cover-inner{
      border:none !important;
      padding: 40px 20px 40px 40px;
      }

      .titlepage.showBrand {
        padding: 0px 20px 20px 0px !important;
        display: flex;
        gap: 24px;
        overflow: hidden !important;
      }


      .page:not(.page.titlepage):not(.page.indexpage):not(.page.indexpage-banner) {
        padding: 30px 80px !important;
      }


.titlepage *{
color:black;
}


      .titlepage .text-1 {
        max-width: 100%;
        height: 64px;
        text-align: center;
        white-space: pre-line;
        margin-bottom: 0px;
        min-height: fit-content;
        max-height: fit-content;
        font-family: var(--cover-font-family);
        font-size: var(--cover-font-size);
        font-weight: var(--case-type-bold);
        text-align: var(--casetype-align);
        text-transform: var(--casetype-transform);
      }

      .titlepage .text-center {
        text-align: center;
      }

      .titlepage .parties pre,
      .titlepage .appear pre,
      .titlepage .before pre{
        line-height: var(--cover-line-spacing, '1.2');
        min-height: calc(var(--cover-font-size, '14px') * var(--cover-line-spacing, '1.2'));
        }
      
      .titlepage .parties p,
      .titlepage .parties pre,
      .titlepage .parties span {
        font-weight: var(--parties-bold);
        white-space: pre-line;
      }

      .titlepage .before p,
      .titlepage .before pre,
      .titlepage .before span {
        font-weight: var(--before-bold);
      }

      .titlepage .appear p,
      .titlepage .appear pre,
      .titlepage .appear span {
        font-weight: var(--appearances-bold);
        text-align: var(--appearances-align , center);
      }

      .titlepage p,
      .titlepage span,
      .titlepage pre {
        font-size: var(--cover-font-size, '14px');
        letter-spacing: var(--body-letter-spacing, '1.2px');
        font-family: var(--cover-font-family) !important;
        text-align: center;
        white-space: pre-line;
        line-height: var(--cover-line-spacing, '1.2');
      }

      .titlepage .text-end {
        text-align: end;
      }

      .titlepage .text-start {
        text-align: start;
      }

      .titlepage .divider {
        min-height: 1px;
        height: 1px;
        width: 100%;
        border-top:1px solid #c2c2c298;
        margin: 20px auto !important;
      }

      .titlepage .transriptby {
        text-align: center;
        font-family: var(--cover-font-family);
        font-size: var(--cover-font-size);
        display: flex;
        align-items: flex-end;
        justify-content: center;
      }

      .titlepage .maindivider {
        margin: 10px auto;
      }

      .titlepage-header {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .parties {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .before {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .appear {
        min-height: fit-content;
        display: flex;
        flex-direction: column;
      }


      .maindivider {
        height: 1px;
        background-color: #c2c2c2;
        width: 100%;
        margin: 20px 0;
      }

      .no-margin {
        margin: 0px !important;
      }

      .line-table.brakline {
        height: calc((calc(calc(var(--timestamp-font-size) * 20 / 16) + var(--body-line-spacing))) + (calc(calc(var(--timestamp-font-size) * 20 / 16))));
      }

      .line-table {
        width: 100%;
        border-collapse: collapse;
        font-family: var(--body-font-family);
        font-size: var(--body-font-size);
        min-height: fit-content;
        height: calc(calc(var(--timestamp-font-size) * 20 / 16) + var(--body-line-spacing) * 1) !important;
      }

      .timestamp {
        background: transparent !important;
        color: #000000;
        padding: 0 5px;
        font-size: var(--timestamp-font-size, '16px');
        text-align: right;
        white-space: nowrap;
        width: min-content;
        font-family: var(--timestamp-font-family);
        display: var(--timestamp-display);
        line-height: 1;
      }

      .line-no {
        background: transparent !important;
        color: #000000;
        padding: 0 5px;
        font-size: var(--line-number-font-size, '16px');
        text-align: right;
        white-space: nowrap;
        width: min-content;
        font-family: var(--line-number-font-family);
        display: var(--line-number-display);
        line-height: 1;
      }

      .line-text {
        color: #000000;
        padding: 0px 10px 0px 20px;
        font-size: var(--body-font-size, '17px');
        letter-spacing: var(--body-letter-spacing, '0.8px');
        height: fit-content;
        font-weight: var(--body-font-weight, 400);
        width: 100%;
        line-height: 1;
      }

      .line-text pre {
        font-size: var(--body-font-size, '17px');
        letter-spacing: var(--body-letter-spacing, '0.8px');
        font-weight: var(--body-font-weight, 400);
        font-family: var(--body-font-family);
        width: 100%;
        white-space: pre-wrap;
         line-height: 1;
      }

      .page-header *,.new-header *, .page-footer *{
      color:black;
      }
      .page-header,.new-header {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
        display: var(--header-footer-display);
        width: 100%;
      }

      .page-header td,.new-header td {
        vertical-align: top;
        padding-bottom: 10px;
        width: 50%;
      }

      .page-footer {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
        display: var(--header-footer-display);
        width: 100%;
      }

      .page-footer p,.page-footer span{
          font-size: var(--header-footer-font-size, '16px');
          font-family: var(--header-footer-font-family);
       
        }

.page-footer pre{
    white-space: pre-line;
}


      .page-header pre,.page-header p,.page-header span{
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .page-header pre{
      white-space: pre-line;
      }


      .new-header pre,.new-header p,.new-header span{
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .new-header pre{
      white-space: pre-line;
      }

      .page-footer td {
        vertical-align: top;
        padding-top: 10px;
        width: 50%;
      }

      .mainpageno {
        font-size: var(--page-number-font-size, '16px');
        font-family: var(--page-number-font-family);
      }

      .secondarypageno {
        font-size: var(--page-number-font-size, '16px');
        font-family: var(--page-number-font-family);
      }

      .head-right p,
      .head-left p {
        font-size: var(--header-footer-font-size, '16px');
        font-family: var(--header-footer-font-family);
      }

      .head-right {
        text-align: right;
        width: 50%;
      }

      .lines-wrapper {
        --item-count: 25;
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .page-wrapper {
        gap: 10px;
        padding: 30px 0px;
        margin-top: 10px;
        margin-bottom: 20px;
        height: 100%;
        border-top: 1px solid rgba(194, 194, 194, 0.59);
        border-bottom: 1px solid rgba(194, 194, 194, 0.59);
      }

      .grid-container {
      padding: 10px 0px ;
        margin-top: 10px;
        margin-bottom: 5px;
        height: calc(100% - 80px);
        border-top: 1px solid rgba(194, 194, 194, 0.59);
        border-bottom: 1px solid rgba(194, 194, 194, 0.59);
       display: flex;
    flex-wrap: wrap;
      }

      .grid-container .lines-wrapper {
        gap: 0px !important;
        padding: 10px 0px 10px 10px;
        height: 50%;
        width: 50%;
      }

      .grid-container .lines-wrapper:nth-child(2) {
       border-bottom: 1px solid #c2c2c2;
       }

      .grid-container .lines-wrapper:nth-child(1) {
        border-right: 1px solid #c2c2c2;
        border-bottom: 1px solid #c2c2c2;
      }

      .grid-container .lines-wrapper:nth-child(3) {
        border-right: 1px solid #c2c2c2;
      }

      .grid-container .lines-wrapper:nth-child(4) {
      
      }

      .grid-container .line-text  pre, 
      .grid-container .line-text  { 
        font-size: 8px !important;
        line-height: 1;
        letter-spacing: 0px !important;
      }


      .grid-container .line-text  pre{
     height:fit-content !important;
      }

      .grid-container .line-text  {
    padding: 0px 0px 0px 15px !important;
      }
      .grid-container .line-text pre {
        font-size: 8px !important;
        line-height: 2;
          font-family: calibri, sans-serif !important;
      }

      .grid-container .line-no {
        font-size: 8px !important;
        line-height: 2;
         letter-spacing: 0px !important;
         font-family: calibri, sans-serif !important;
      }

      .grid-container .secondarypageno {
        font-size: 10px !important;
      }

      .grid-container .timestamp {
        font-size: 8px !important;
        line-height: 2;
        padding: 0 0px;
         letter-spacing: 0px !important;
           font-family: calibri, sans-serif !important;
      }

      .betweeen {
        letter-spacing: 1px !important;
        text-transform: uppercase;
      }

      p, span {
        letter-spacing: 0.5px;
        word-spacing: 2px;
      }

      .text-end {
        text-align: end;
      }

      .case-type {
        font-weight: var(--case-type-bold);
      }

      .parties {
        font-weight: var(--parties-bold);
      }

      .before-section {
        font-weight: var(--before-bold);
      }

      .appearances {
        font-weight: var(--appearances-bold);
      }

      .question {
        font-weight: var(--question-bold);
      }

      .speaker {
        font-weight: var(--speaker-bold);
      }


      .flex {
        display: flex;
      }

      .flex-col {
        flex-direction: column;
      }

      .gap-3 {
        gap: 12px;
      }

      .items-center {
        align-items: center;
      }

      .gap-2 {
        gap: 8px;
      }

      .justify-end {
        justify-content: flex-end;
      }

      .justify-start {
        justify-content: flex-start;
      }

      .justify-center {
        justify-content: center;
      }

      .justify-between {
        justify-content: space-between;
      }

      .whitespace-nowrap {
        white-space: nowrap;
      }

      .block {
        display: block;
      }

      .swape-page-Left:nth-child(even) .page-number-right {
        display: none;
      }

      .swape-page-Left:nth-child(odd) .page-number-left {
        display: none;
      }

      .swape-page-Right:nth-child(even) .page-number-left {
        display: none;
      }

      .swape-page-Right:nth-child(odd) .page-number-right {
        display: none;
      }

      .mb-3 {
        margin-bottom: 12px;
      }

      .bg-white {
        background-color: white;
      }


      .grid-container .line-table{
     height: fit-content !important;
     min-height: fit-content !important;
      }


      .appear-title{
        font-size: 18px;
        font-weight: 600;
        text-transform: uppercase;
        text-align: var(--appearances-align);
        letter-spacing: 2px;
        margin: 20px 0px;
        }
        .p-5{
        padding: 20px;
        }


.cover-inner{
  padding: 40px;
   border: 1px solid rgb(209, 209, 209); 
   height: 100%;
   width: 100%;
   z-index: 3;
}


#cBClaimentH{
margin-bottom: 10px;
}

.bg-layer{
position: absolute;
    right: calc(-339px / 2.4);
    bottom: calc(-440px / 3);
    width: 339px;
    height: 440px;
    z-index: 1;
    rotate: -32deg;
  }


.brand .brand-logo span{
}
.brand .brand-logo{
    height: 40px;
    width: 40px;
    background-color: #white;

}



.brand .bar{
  width: 100%;
  height: 100%;
  background-color: #F26522;  
}

.brand{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.new-header .right {
      width: 50%;
    }

    .new-header .left {
      width: 50%;
    }

    .new-header {
      display: flex;
    }



.container {
  width: 100%;
  padding: 0 49px 36px 0;
  /* min-height: 29.7cm;
  height: 29.7cm; */
}

.content-table {
  width: 100%;
}

.sidebar {
  background-color: #ff3d00;
  width: 109px;
  height: 447px;
}

.main-content {
  padding-top: 300px;
  padding-left: 20px;
  vertical-align: top;
  font: 600 10px Open Sans, sans-serif;
  color: #4f4f4f;
}

.case-name {
  color: #ff3d00;
  letter-spacing: -0.6px;
  font: 30px Open Sans, sans-serif;
  margin: 0;
}

.document-type {
  margin-top: 4px;
  font: 12px/133% Open Sans, sans-serif;
}

.document-info {
  font: 400 10px/12.5px Open Sans, sans-serif;
  margin-top: 4px;
}

.spacer {
  background-color: #fff;
  margin-top: 4px;
  height: 13px;
}

.export-info {
  font: 700 10px/14px Open Sans, sans-serif;
  margin-top: 4px;
}

.footer {
  padding-top: 520px;
  width: 141px;
  font: 400 12px/133% Open Sans, sans-serif;
  color: #ff3d00;
  float: right;
}

.logo {
  display: block;
  margin: 0 auto;
  width: 105px;
  max-width: 100%;
}

.powered-by {
  font-family: Open Sans, sans-serif;
  margin-top: 24px;
  text-align: center;
}


.container-inline-block {
  font-size: 0;
  /* Remove space between inline-block elements */
}

.container-inline-block .box {
  display: inline-block;
  width: 25%;
  font-size: 16px;
  /* Reset font size for content */
  vertical-align: top;
}

.anothead {
  padding: 10px 24px;
  background-color: #4f4f4f;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
}

.data-header {
  padding: 10px 24px;
  background-color: #6b6b6b;
  color: #fff;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 20px;
}

.heading {
  padding: 10px 24px;
  color: #4f4f4f;
  font-size: 24px;
  font-weight: 600;
}


.p-0 {
  padding: 0 !important;
}

.p-3 {
  padding: 20px !important;
}

.mb-1 {
  margin-bottom: 5px;
}

.mb-2 {
  margin-bottom: 10px;
}

.mb-3 {
  margin-bottom: 0;
}

.tabbody .pageno {
  text-decoration: underline;
  color: #ff3c00;
  cursor: pointer;
}

.tabhead .pageno,
.tabbody .pageno {
  width: 8%;
}



.tabbody .note{
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.tabhead .note,
.tabbody .note {
  padding-left: 10px;
  padding-right: 5px;
  width: 33.5%;
}

.tabhea .issue,
.tabbody .issue {
  width: 25%;
}

.tabbody div {
  vertical-align: top;
}


a{
    font-family: cursive;
}

.tabhead div,
.tabbody div {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  color: #4f4f4f;
  line-height: 1.5;
  letter-spacing: 0;
}

.tabbody {
  background-color: #f1f1f1;
  border-radius: 10px;
  margin-top: 10px;
  display: flex;
  align-items: center;
   min-height: 50px;
}

.tabhead {
  background-color: #c4c4c4;
  border-radius: 20px;
  display: flex;
}

.tabhead,
.tabbody {
  padding: 5px 10px 7px;
     
}

.issuewrap {
  width: 100%;
  margin-bottom: 3px;
}

.issuewrap .impact {
  width: 10%;
}

.issuewrap .rel {
  width: 25%;
}


.issuewrap .name .text {
  padding-left: 5px;
}

.issuewrap .name {
  width: 60%;
}
.tabbody .source {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
  font-size: 11px;
  line-height: 1.1;
}

.tabhead .source,
.tabbody .source {
  width: 33.5%;
 
}

.issuebar {
  padding: 2px 2px;
  border-radius: 10px;
  background: red;
}

.relspn {
  padding: 2px 5px;
  background: white;
  border-radius: 10px;
}







.highlight {
  background-color: yellow;
}

.page-header {
  font-size: 10px;
  width: 100%;
}

.page-header td {
  vertical-align: top;
  padding-bottom: 20px;
}


.maindivider {
  height: 2px;
  width: 100%;
  background-color: #000;
  margin: 10px auto;
}

.text-end {
  text-align: end;
}

.data-footer {
  position: absolute;
  bottom: -60px;
  left: 60px;
  width: 100%;
}

.pagination {
  position: absolute;
  bottom: 0;
  right: 0;
  padding: 0 65px;
}


.document-type {
  font-size: 21px !important;
}

.export-info {
  font-size: 16px !important;
  line-height: 1.5 !important;
}






.line-SPKR .line-text {
  padding-left: 20px;
}

.line-SPKR+.line-SPKR .line-text {
  padding-left: 80px;
}

.line-SPKR-CONTINUE .line-text {
  padding-left: 120px;
}

.line-ANS-CONTINUE .line-text {
  text-align: center;
}

.line-RHT-FLS .line-text {
  text-align: end;
}

.line-SPKR-CONTINUE+.line-SPKR-CONTINUE .line-text {
  padding-left: 80px;
}

.line-PRNTH .line-text {
  width: calc(100% - 68px);
}




  .line-no {
    text-decoration: none;
    color: inherit;
  }
  @media print {
    a.line-no::after {
      content: none !important;
    }
  }


.highlight-layer1 {
  position: absolute;
  top: 0;
  bottom: 0;
  opacity: 0.8;
  z-index: 0; /* behind text */
}

/* ─── Annotation Summary Card Design ─── */
.annot-summary-table {
  width: 100%;
  border-collapse: collapse;
}
.annot-summary-table > thead { display: table-header-group; }
.annot-summary-table > thead > tr > td,
.annot-summary-table > tbody > tr > td {
  padding: 0;
}
.annot-summary-banner {
  background: #4F4F4F;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  padding: 11px 22px;
  letter-spacing: 0.5px;
  font-family: sans-serif;
}
.ac-body {
  /* 80px horizontal padding matches the transcript page's padding: 30px 80px rule,
     so annotation cards align with transcript text on both left and right. */
  padding: 14px 80px;
  font-family: sans-serif;
}
.ac-section {
  margin-bottom: 24px;
}
.ac-section-head {
  display: flex;
  align-items: center;
  gap: 4px;
  page-break-after: avoid;
  padding: 4px 10px;
  background: #f0f2f5;
  border: 1px solid #dde1e7;
  border-radius: 10px;
  margin-bottom: 12px;
}
.ac-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  line-height: 1;
}
.ac-icon svg { display: block; width: 13px; height: 13px; }
.ac-icon-qfact { background: transparent; color: #1a202c; border: 0; }
.ac-icon-fact  { background: transparent; color: #1a202c; border: 0; }
.ac-icon-qm    { background: transparent; color: #1a202c; border: 0; }
.ac-icon-doc   { background: transparent; color: #1a202c; border: 0; }
.ac-type-name {
  font-size: 15px;
  font-weight: 700;
  color: #1a202c;
  letter-spacing: 0.2px;
}
.ac-card {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
  background: #fff;
  page-break-inside: avoid;
}
.ac-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 9px;
  background: #fff;
}
.ac-title-left {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.ac-title-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
/* Vertical color bar marking the issue color (replaces the round dot). */
.ac-issue-bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: #cccccc;
  display: inline-block;
  flex-shrink: 0;
}
/* Quick-mark dot kept round for the QM section. */
.ac-qm-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}
.ac-issue-name {
  font-size: 13px;
  font-weight: 700;
  color: #1a202c;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Soft grey rounded pill for the relevance label ("Critical" / "High"). */
.ac-rel-pill {
  background: #edf2f7;
  color: #1a202c;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 11px;
  border-radius: 12px;
  white-space: nowrap;
}
/* Legacy classes kept for backwards compat (older card variants). */
.ac-rel-text {
  color: #1a202c;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.ac-rel-badge {
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #bee3f8;
  white-space: nowrap;
}
.ac-impact-img {
  width: 18px;
  height: 18px;
  object-fit: contain;
  vertical-align: middle;
}
.ac-meta {
  padding: 4px 14px 6px;
  font-size: 10px;
  color: #718096;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}
.ac-pgbar {
  background: #3a3a3a;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 12px;
}
.ac-lines {
  padding: 6px 12px;
  background: #fff;
}
.ac-line {
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #2d3748;
  line-height: 1.55;
  min-height: 16px;
}
.ac-ln {
  min-width: 18px;
  color: #a0aec0;
  text-align: right;
  flex-shrink: 0;
  font-weight: 500;
}
.ac-ts {
  min-width: 38px;
  color: #cbd5e0;
  flex-shrink: 0;
}
.ac-lt {
  flex: 1;
  word-break: break-word;
}
.ac-note {
  padding: 5px 12px 6px;
  font-size: 11px;
  color: #4a5568;
  font-style: italic;
  line-height: 1.5;
}
.ac-factlink-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  font-size: 11px;
  flex-wrap: wrap;
}
.ac-fl-btn {
  background: #4a5568;
  color: #fff;
  font-size: 9px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 600;
  flex-shrink: 0;
  white-space: nowrap;
}
.ac-fl-icon {
  font-size: 12px;
  flex-shrink: 0;
}
.ac-fl-filename {
  color: #2d3748;
  font-weight: 500;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-fl-exhibit {
  color: #718096;
  flex-shrink: 0;
  font-size: 10px;
}
.ac-fl-meta {
  padding: 2px 12px 7px;
  font-size: 10px;
  color: #718096;
  background: #f7fafc;
}
.ac-fl-note {
  margin: 4px 10px 8px;
  padding: 7px 10px;
  font-size: 10.5px;
  color: #2d3748;
  background: #edf2f7;
  border-radius: 5px;
  line-height: 1.55;
  word-break: break-word;
}

    `;
    }
};
exports.ThemeCssService = ThemeCssService;
exports.ThemeCssService = ThemeCssService = __decorate([
    (0, common_1.Injectable)()
], ThemeCssService);


/***/ }),
/* 81 */
/***/ ((module) => {

module.exports = require("canvas");

/***/ }),
/* 82 */
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
exports.getAnnotHighlightEEP = exports.DeleteTranscript = exports.TranscriptFieldRequest = exports.DwdpathReq = exports.TranscriptPublishReq = exports.GenerateTranscriptDto = exports.TranscriptLineDto = exports.TranscriptFormDataDto = exports.GenerateIndexDto = exports.ThemeCreationResonce = exports.ThemeBuilder = exports.TranscriptCreationResonce = exports.ThemeResonce = exports.SessionComboRequest = exports.CaseComboRequest = exports.ThemeDetailRequest = exports.TranscriptRequest = exports.ThemeRequest = exports.TranscriptDetailRequest = exports.fileHTMLRequest = exports.fileJSONRequest = exports.TranscriptBuilder = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
class TranscriptBuilder {
}
exports.TranscriptBuilder = TranscriptBuilder;
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: '', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cTransid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cThemeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCasetype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCCaseno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCAlign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cClaiment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cRespondent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cClaimentH", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cRespondentH", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cArbitrator", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "cCDay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "dCDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cBClaimentH", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cBRespondentH", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cBClaiment", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cBRespondent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCasename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cTCaseno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "dTDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "tTTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cReporter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "cTVolume", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "dTranscribedDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCompany", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cCompanyinfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nStartpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nSecondpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cArbitratorH", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "cBehalfAlign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nCSpacing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptBuilder.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Limit HTML generation to the first N pages (preview mode). Omit/0 = render all pages.', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === undefined || value === null || value === '' ? 0 : parseInt(value)), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TranscriptBuilder.prototype, "nPreviewPages", void 0);
class fileJSONRequest {
}
exports.fileJSONRequest = fileJSONRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileJSONRequest.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileJSONRequest.prototype, "nMasterid", void 0);
class fileHTMLRequest {
}
exports.fileHTMLRequest = fileHTMLRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], fileHTMLRequest.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], fileHTMLRequest.prototype, "cTransid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileHTMLRequest.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileHTMLRequest.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'Limit HTML generation to the first N pages (preview mode). Omit/0 = render all pages. When set, the cached full-render HTML file is not overwritten.', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === undefined || value === null || value === '' ? 0 : parseInt(value)), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], fileHTMLRequest.prototype, "nPreviewPages", void 0);
class TranscriptDetailRequest {
}
exports.TranscriptDetailRequest = TranscriptDetailRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptDetailRequest.prototype, "cTransid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptDetailRequest.prototype, "nMasterid", void 0);
class ThemeRequest {
}
exports.ThemeRequest = ThemeRequest;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ThemeRequest.prototype, "nMasterid", void 0);
class TranscriptRequest {
}
exports.TranscriptRequest = TranscriptRequest;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptRequest.prototype, "nMasterid", void 0);
class ThemeDetailRequest {
}
exports.ThemeDetailRequest = ThemeDetailRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ThemeDetailRequest.prototype, "cThemeid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ThemeDetailRequest.prototype, "nMasterid", void 0);
class CaseComboRequest {
}
exports.CaseComboRequest = CaseComboRequest;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseComboRequest.prototype, "nMasterid", void 0);
class SessionComboRequest {
}
exports.SessionComboRequest = SessionComboRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionComboRequest.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionComboRequest.prototype, "nMasterid", void 0);
class ThemeResonce {
}
exports.ThemeResonce = ThemeResonce;
class TranscriptCreationResonce {
}
exports.TranscriptCreationResonce = TranscriptCreationResonce;
class ThemeBuilder {
}
exports.ThemeBuilder = ThemeBuilder;
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cThemeid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nCFontid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nCFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bCIsCaps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["C","P","B","A"]', description: '', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", typeof (_a = typeof Array !== "undefined" && Array) === "function" ? _a : Object)
], ThemeBuilder.prototype, "jCBold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nBFont", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nBFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nBLetterspacing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nBLinespacing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["Q","S"]', description: '', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "jBBold", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nPNFont", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nPNFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bPInclude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPNPosition", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nPNStart", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bPNSwap", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bLNShow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nLFont", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nLFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bTShow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nTFont", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nTFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nHFont", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 12, description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ThemeBuilder.prototype, "nHFontsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bHCover", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bHShow", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TL', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPCaseName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'TR', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPVolumeDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BL', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPCompany", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'BR', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPCompanyInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Top', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPNAlignTB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Right', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "cPNAlignRL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bIsdefault", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ThemeBuilder.prototype, "bLMbrand", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ThemeBuilder.prototype, "nMasterid", void 0);
class ThemeCreationResonce {
}
exports.ThemeCreationResonce = ThemeCreationResonce;
class GenerateIndexDto {
}
exports.GenerateIndexDto = GenerateIndexDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GenerateIndexDto.prototype, "cTransid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateIndexDto.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GenerateIndexDto.prototype, "nMasterid", void 0);
class TranscriptFormDataDto {
}
exports.TranscriptFormDataDto = TranscriptFormDataDto;
class TranscriptLineDto {
}
exports.TranscriptLineDto = TranscriptLineDto;
class GenerateTranscriptDto {
}
exports.GenerateTranscriptDto = GenerateTranscriptDto;
class TranscriptPublishReq {
}
exports.TranscriptPublishReq = TranscriptPublishReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptPublishReq.prototype, "cTransid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptPublishReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TranscriptPublishReq.prototype, "isIgnoreErr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TranscriptPublishReq.prototype, "errorCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptPublishReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptPublishReq.prototype, "nSesid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptPublishReq.prototype, "nMasterid", void 0);
class DwdpathReq {
}
exports.DwdpathReq = DwdpathReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DwdpathReq.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DwdpathReq.prototype, "nMasterid", void 0);
class TranscriptFieldRequest {
}
exports.TranscriptFieldRequest = TranscriptFieldRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Search string', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptFieldRequest.prototype, "searchstr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Column name', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TranscriptFieldRequest.prototype, "column_nm", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TranscriptFieldRequest.prototype, "nMasterid", void 0);
class DeleteTranscript {
}
exports.DeleteTranscript = DeleteTranscript;
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteTranscript.prototype, "cTransid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteTranscript.prototype, "nMasterid", void 0);
class getAnnotHighlightEEP {
}
exports.getAnnotHighlightEEP = getAnnotHighlightEEP;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Marknav/realtime session ID (nSesid) — used for navigate_factlist filtering', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Case name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cCasename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'User name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cUsername", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Transcript ', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Issue IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Highlight Issues IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jHIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Page', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Advanced', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bAdvanced", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Include annotations', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bAnnotations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Cover page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bCoverpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Fit page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bFitpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Pagination page ', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bPagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Q Fact', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bQfact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Quick Mark', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bQmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Fact', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bFact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Timestamp', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bTimestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Orientation', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cOrientation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Quick Mark size', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cQMsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Q Fact size', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cQFsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A4', description: 'Page size', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cPgsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Demo ', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cIsDemo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Fact size', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cFsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Fact Issues IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jFIssues", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'My Export', description: 'Export file name', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cExportName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Include word index', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bWordIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FULL_PAGE', description: 'Layout: FULL_PAGE | CONDENSED | ANNOTATION_SUMMARY', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cLayout", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Page mode: A=All, R=Range', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ALL', description: 'Annotations mode: ALL | NONE | CREATOR', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cAnnotations", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ALL', description: 'Annotation type filter: ALL | QM | QF | FACT | LINK', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "cAnnotationType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Include annotation summary section', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bAnnotationSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Chronological order', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], getAnnotHighlightEEP.prototype, "bChronology", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Annotation filter groups [{cFilterType, cCategory, jIssues, cRelevance, ...}]', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jAnnotationFilters", void 0);


/***/ }),
/* 83 */
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
exports.ExporttranscriptService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const log_service_1 = __webpack_require__(41);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const util_1 = __webpack_require__(25);
const child_process_1 = __webpack_require__(35);
const fsextra = __webpack_require__(34);
const puppeteer = __webpack_require__(33);
const canvas_1 = __webpack_require__(81);
const utility_service_1 = __webpack_require__(28);
const socket_io_1 = __webpack_require__(20);
const users_service_1 = __webpack_require__(22);
const kafka_shared_service_1 = __webpack_require__(29);
const db_service_1 = __webpack_require__(8);
const transcript_html_service_1 = __webpack_require__(79);
const transcript_service_1 = __webpack_require__(78);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ExporttranscriptService = class ExporttranscriptService {
    constructor(config, log, utility, ios, user, db, kafka, transcriptHtmlService, transcriptService) {
        this.config = config;
        this.log = log;
        this.utility = utility;
        this.ios = ios;
        this.user = user;
        this.db = db;
        this.kafka = kafka;
        this.transcriptHtmlService = transcriptHtmlService;
        this.transcriptService = transcriptService;
        this.exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
        this.logApplication = 'realtime/export';
        this.helpingVerbs = new Set([
            'a', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
            'do', 'does', 'did', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'can', 'could'
        ]);
        this.stopWords = new Set([
            'the', 'and', 'to', 'of', 'in', 'for', 'on', 'with', 'by', 'at', 'from',
            'an', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their'
        ]);
    }
    async initData() {
        try {
            if (!fs.existsSync(this.exportPath)) {
                fs.mkdirSync(this.exportPath, { recursive: true });
            }
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
        }
    }
    async exportTranscript(data, res, x) {
        try {
            this.initData();
            const htmlContent = this.generateHtmlContent(data, res, x);
            const htmlFileName = `${this.exportPath}${x.CaseName}.html`;
            const pdfFileName = `${this.exportPath}${x.CaseName}.pdf`;
            fs.writeFileSync(htmlFileName, htmlContent);
            await this.convertHtmlToPdf(htmlFileName, pdfFileName);
            return pdfFileName;
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
        }
    }
    async convertHtmlToPdf(htmlFilePath, outputPdfPath) {
        try {
            const wkhtmltopdfOptions = [
                '--page-size A4',
                '--margin-top 0',
                '--margin-right 0',
                '--margin-bottom 0',
                '--margin-left 0',
                '--encoding UTF-8',
                '--enable-local-file-access',
                '--print-media-type',
                '--disable-smart-shrinking',
                '--header-spacing 5',
                '--footer-spacing 5'
            ].join(' ');
            const command = `wkhtmltopdf ${wkhtmltopdfOptions} "${htmlFilePath}" "${outputPdfPath}"`;
            await execAsync(command);
            this.log.report(`PDF generated successfully: ${outputPdfPath}`, this.logApplication, 'I');
        }
        catch (error) {
            this.log.report(`wkhtmltopdf conversion error: ${error?.message}`, this.logApplication, 'E');
            throw error;
        }
    }
    generateHtmlContent(data, res, x) {
        try {
            const date = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const formattedDate = date.toLocaleDateString('en-GB', options);
            const htmlTemplatePath = path.join(this.exportPath, 'htmlTemplate.html');
            let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf-8');
            let coverContent = `<td class="main-content">
                  <h1 class="case-name">${x.CaseName}</h1>
                  <p class="document-type">${x.cCasename}</p>
                  <p class="document-info">
                    <span style="font-size: 12px; line-height: 6px"></span>
                  </p>
                  <div class="spacer"></div>
                  <p class="export-info">
                    Exported on: ${formattedDate} <br /> By ${x.ExportBy} <br>
                  </p>
                </td>`;
            let mainContent = '';
            htmlContent = htmlContent.replace('<td class="main-content replacable-content"></td>', coverContent);
            let currentPage = data[0].page;
            let pgIndexs = 0;
            mainContent += `<div class="titlepage page page-break">
        <div class="maindivider"></div>
        <p class="text-1">${x?.cIndexheader || ''}
        </p>
        <div class="divider"></div>
        <div class="sidespace">
          <p class="text-start betweeen capitalize">Between</p>
          <p>
            <span>${x?.cClaimant || ''}</span>
          </p>
          <p class="text-end">Claimant</p>
          <p>-&nbsp;&nbsp;and&nbsp;&nbsp;-</p>
          <p>${x?.cRespondent || ''}</p>
          <p class="text-end">Respondent</p>
          <div class="spacer"></div>
          <div class="divider"></div>
          <p>-&nbsp;&nbsp;before&nbsp;&nbsp;- </p>
          <p>${x?.cName || ''}
          </p>
          <p>${x?.dDay}, ${x?.dSessionDt}
          </p>
          <div class="divider"></div>
          <div class="text-start msg">
            <p>${x?.cTClaimant || ''}
            </p>
            <p>${x?.cTRespondent || ''}
            </p>
          </div>
        </div>
        <p class="text-center transriptby">
          Transcript produced by lloydmichaux.com<br />
        </p>
        <div class="maindivider"></div>
      </div>`;
            data.forEach(ls => {
                pgIndexs++;
                currentPage = ls.page;
                mainContent += `
            <div class="page page-break">
            <table class="page-header" name="page-${currentPage}" id="page-${currentPage}">
              <tr>
                <td class="head-left">
                  <p>${x?.cCasename}</p>
                </td>
                <td class="head-right">
                 <p class="text-end">${x?.cName}</p>
                 <p class="text-end">${x?.dSessionDt}</p>
                </td>
              </tr>
            </table>
            <header class="data-header">Page No. ${currentPage}</header>`;
                mainContent += `<span class="pagination">${x.CaseName}-${pgIndexs}</span>`;
                mainContent += `<table class="line-table">`;
                if (ls && ls.data) {
                    ls.data.forEach((item, index) => {
                        let linetext = item.lines.join('');
                        item.linetext = linetext;
                        mainContent += `<tr style="background: 'white'}">
                                       <td class="line-no" style="background:'#eeeeee'}">
                                         <span>${index + 1}</span>
                                        ${item.showTimeStamps ? `<span>${item.time}</span>` : ''} 
                                       </td>
                                       <td class="line-text">${item.linetext}</td>
                                     </tr>`;
                    });
                }
                mainContent += `</table>`;
                mainContent += `
                           <table class="page-header data-footer ">
                             <tr>
                               <td colspan="2">
                                 <div class="maindivider"></div>
                               </td>
                             </tr>
                             <tr>
                               <td class="head-left">
                                 <p>Lloyd Michaux (ask@lloydmichaux.com)</p>
                                 <p>Asia-Pacific | Middle East | India</p>
                               </td>
                               <td class="head-right">
                                 <p class="text-end">Daily Transcript Service</p>
                               </td>
                             </tr>
                           </table>`;
                mainContent += `</div>`;
            });
            htmlContent = htmlContent.replace('<div id="main-content-placeholder"></div>', mainContent + '</body></html>');
            return htmlContent;
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
        }
        return '';
    }
    cleanWord(word) {
        return word.toLowerCase()
            .replace(/[^\w]/g, '')
            .replace(/^\d+$/, '');
    }
    isNumeric(str) {
        return /^\d+(\.\d+)?$/.test(str);
    }
    async generateIndex(filePath, cTransid) {
        try {
            const data = JSON.parse(fs.readFileSync(`${this.config.get('REALTIME_PATH')}${filePath}`, 'utf-8'));
            const wordMap = {};
            for (const line of data) {
                const words = line.linetext.split(/\s+/).map(word => this.cleanWord(word)).filter(Boolean);
                for (const word of words) {
                    if (word.length < 2)
                        continue;
                    if (this.helpingVerbs.has(word))
                        continue;
                    if (this.stopWords.has(word))
                        continue;
                    if (this.isNumeric(word))
                        continue;
                    if (!/^[a-zA-Z]/.test(word))
                        continue;
                    if (!wordMap[word])
                        wordMap[word] = [];
                    const alreadyExists = wordMap[word].some(ref => ref.pageno === line.pageno && ref.lineno === line.lineno);
                    if (!alreadyExists) {
                        wordMap[word].push({ pageno: line.pageno, lineno: line.lineno });
                    }
                }
            }
            let res = await this.db.executeRef('get_transcript_detail', { cTransid: cTransid }, 'transcript');
            let filedata;
            console.log('res', JSON.stringify(res));
            filedata = res.data[0][0];
            console.log('filedata', filedata);
            const indexHtml = this.generateIndexHtml(wordMap, filedata);
            const htmlFilePath = `${this.exportPath}index_temp.html`;
            const pdfFilePath = `${this.exportPath}index_temp.pdf`;
            fs.writeFileSync(htmlFilePath, indexHtml);
            await this.convertHtmlToPdf(htmlFilePath, pdfFilePath);
            const pdfBuffer = fs.readFileSync(pdfFilePath);
            fs.unlinkSync(pdfFilePath);
            return pdfBuffer;
        }
        catch (error) {
            this.log.report(`Index generation error: ${error?.message}`, this.logApplication, 'E');
            throw error;
        }
    }
    distributeContentPageWise(grouped, columnsPerPage) {
        const pages = [];
        const BASE_TERM_HEIGHT = 13;
        const BASE_REF_HEIGHT = 6;
        const LETTER_HEIGHT = 16;
        const MAX_COLUMN_HEIGHT = 1250;
        const PAGE_WIDTH = 794;
        const COLUMN_WIDTH = PAGE_WIDTH / columnsPerPage;
        const COLUMN_PADDING = 20;
        const AVAILABLE_COLUMN_WIDTH = COLUMN_WIDTH - COLUMN_PADDING;
        const canvas = (0, canvas_1.createCanvas)(1, 1);
        const ctx = canvas.getContext('2d');
        ctx.font = '8pt "Times New Roman"';
        const calculateTermWidth = (word) => {
            ctx.font = 'bold 8pt "Times New Roman"';
            return ctx.measureText(word).width + 4;
        };
        const calculateRefWidth = (ref) => {
            ctx.font = '8pt "Times New Roman"';
            const refText = `${ref.pageno}:${ref.lineno}`;
            return ctx.measureText(refText).width + 3;
        };
        const calculateRefsHeight = (word, refs) => {
            if (refs.length === 0)
                return 0;
            const termWidth = calculateTermWidth(word);
            const firstLineWidth = AVAILABLE_COLUMN_WIDTH - termWidth;
            const fullLineWidth = AVAILABLE_COLUMN_WIDTH;
            let currentLineWidth = 0;
            let currentLine = 1;
            let isFirstLine = true;
            for (let i = 0; i < refs.length; i++) {
                const refWidth = calculateRefWidth(refs[i]);
                const spaceWidth = ctx.measureText(' ').width;
                if (currentLineWidth > 0) {
                    currentLineWidth += spaceWidth;
                }
                if (currentLineWidth + refWidth > (isFirstLine ? firstLineWidth : fullLineWidth)) {
                    currentLine++;
                    currentLineWidth = refWidth;
                    isFirstLine = false;
                }
                else {
                    currentLineWidth += refWidth;
                }
            }
            return BASE_TERM_HEIGHT + ((currentLine - 1) * BASE_REF_HEIGHT);
        };
        const flattenContent = () => {
            const elements = [];
            for (const letter of Object.keys(grouped).sort()) {
                elements.push({
                    type: 'letter',
                    content: `<div class="letter-heading">${letter}</div>`,
                    height: LETTER_HEIGHT,
                    letter: letter
                });
                const wordsInThisLetter = grouped[letter];
                for (let i = 0; i < wordsInThisLetter.length; i++) {
                    const [word, refs] = wordsInThisLetter[i];
                    if (refs.length === 0)
                        continue;
                    const isFirstTermInLetter = i === 0;
                    const entryHeight = calculateRefsHeight(word, refs);
                    const lineBreak = isFirstTermInLetter ? '' : '<br>';
                    const termHtml = `${lineBreak}<span class="term" style="display: inline;">${word}</span> ` +
                        `<span class="ref-item" style="display: inline;">${refs[0].pageno}:${refs[0].lineno}</span> `;
                    elements.push({
                        type: 'term',
                        content: termHtml,
                        height: BASE_TERM_HEIGHT + (isFirstTermInLetter ? 0 : 4),
                        isFirstTermInLetter,
                        word
                    });
                    for (let j = 1; j < refs.length; j++) {
                        const refHtml = `<span class="ref-item" style="display: inline;">${refs[j].pageno}:${refs[j].lineno}</span> `;
                        elements.push({
                            type: 'reference',
                            content: refHtml,
                            height: BASE_REF_HEIGHT,
                            word
                        });
                    }
                }
            }
            return elements;
        };
        const elements = flattenContent();
        let currentPageIndex = 0;
        let currentColumnIndex = 0;
        let currentColumnContent = '';
        let currentColumnHeight = 0;
        let lastLetterShown = '';
        let lastWordShown = '';
        pages[0] = new Array(columnsPerPage).fill('');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const nextElement = i < elements.length - 1 ? elements[i + 1] : null;
            const isCurrentElementRef = element.type === 'reference';
            const isNextElementTerm = nextElement && nextElement.type === 'term';
            const remainingHeight = MAX_COLUMN_HEIGHT - currentColumnHeight;
            const wouldLeaveSmallGap = remainingHeight - element.height < 20 && remainingHeight - element.height > 0;
            if (isCurrentElementRef && isNextElementTerm && wouldLeaveSmallGap) {
                pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
                currentColumnIndex++;
                if (currentColumnIndex >= columnsPerPage) {
                    currentPageIndex++;
                    currentColumnIndex = 0;
                    pages[currentPageIndex] = new Array(columnsPerPage).fill('');
                }
                currentColumnContent = '';
                currentColumnHeight = 0;
                if (currentColumnIndex === 0) {
                    lastLetterShown = '';
                }
                continue;
            }
            if (currentColumnHeight + element.height > MAX_COLUMN_HEIGHT) {
                pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
                currentColumnIndex++;
                if (currentColumnIndex >= columnsPerPage) {
                    currentPageIndex++;
                    currentColumnIndex = 0;
                    pages[currentPageIndex] = new Array(columnsPerPage).fill('');
                }
                currentColumnContent = '';
                currentColumnHeight = 0;
                if (currentColumnIndex === 0) {
                    lastLetterShown = '';
                    lastWordShown = '';
                }
                continue;
            }
            if (element.type === 'letter') {
                if (element.letter !== lastLetterShown) {
                    currentColumnContent += element.content;
                    currentColumnHeight += element.height;
                    lastLetterShown = element.letter;
                }
            }
            else if (element.type === 'term') {
                currentColumnContent += element.content;
                currentColumnHeight += element.height;
                if (element.word) {
                    lastWordShown = element.word;
                }
            }
            else {
                if (element.word && element.word !== lastWordShown && element.word) {
                    if (lastWordShown !== '') {
                        currentColumnContent += `<br><span class="term" style="display: inline;">${element.word}</span> `;
                        currentColumnHeight += 4;
                    }
                    lastWordShown = element.word;
                }
                currentColumnContent += element.content;
                currentColumnHeight += element.height;
            }
        }
        if (currentColumnContent.trim() !== '') {
            pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
        }
        return pages;
    }
    generateIndexHtml(wordMap, filedata) {
        const PAGE_WIDTH = 794;
        const PAGE_HEIGHT = 1050;
        const PAGE_PADDING = 80;
        const HEADER_HEIGHT = 50;
        const FOOTER_HEIGHT = 30;
        const availableHeight = PAGE_HEIGHT - PAGE_PADDING - HEADER_HEIGHT - FOOTER_HEIGHT;
        const sortedWords = Object.keys(wordMap).sort();
        const grouped = {};
        for (const word of sortedWords) {
            const letter = word[0].toUpperCase();
            if (!grouped[letter])
                grouped[letter] = [];
            grouped[letter].push([word, wordMap[word]]);
        }
        const columnsPerPage = 4;
        let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Transcript Word Index</title>
<style>
  @page {
    size: 794px 1123px;
    margin: 40px;
  }


  p,pre,div,span{
  font-family: "Times New Roman", Times, serif;
  }
  
  body {
    font-family: "Times New Roman", Times, serif;
    margin: 0;
    padding: 0;
    line-height: 1.2;
    font-size: 9pt;
    width: 794px;
  }
  
  .page {
    page-break-after: always;
    position: relative;
    width: 794px;
    height: 1100px;
    box-sizing: border-box;
    padding: 40px 40px;
    overflow: hidden; /* Prevent any page overflow */
  }
  
  .page:last-child {
    page-break-after: avoid;
  }
  
  .page-header {
    font-size: 8pt;
    margin-bottom: 10px;
    padding-bottom: 3px;
    position: relative;
    height: ${HEADER_HEIGHT + 5}px;
border-bottom: 1px solid #c2c2c2;
  }
  
  .header-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .header-right {
    text-align: right;
    width: 50%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .page-footer {
    font-size: 8pt;
    padding-top: 10px;
    margin-top: 10px;
    height: ${FOOTER_HEIGHT - 10}px;
    border-top: 1px solid #c2c2c2;
    display: flex;
    justify-content: space-between;
  }
  
  .footer-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .footer-right {
    width: 50%;
    display: inline-block;
    text-align: right;
    height: 100%;
    vertical-align: top;
  }
  
  .letter-heading {
    font-weight: bold;
    font-size: 11pt;
    margin: 2px 0 1px 0;
    text-decoration: underline;
    line-height: 1.1;
    display: block;
  }
  
  .term {
    font-weight: bold;
    display: inline;
    margin-right: 1mm;
  }
  
  .ref-item {
    display: inline;
    padding-right: 3px; /* Space between references */
  }
  
  .index-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    height: ${availableHeight}px;
    border: 1px solid #c2c2c2;
  }
  
  .index-table td {
    vertical-align: top;
    width: 25%;
    padding: 10px 8px;
    border-right: 1pt solid #c2c2c2;
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
    position: relative;
  }
  
  .index-table td:last-child {
    border-right: none;
  }
  
  .column-content {
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
  }

  pre{
  margin: 0;
  white-space: pre-line;
  }
</style>
</head>
<body>`;
        const pages = this.distributeContentPageWise(grouped, columnsPerPage);
        const currentDate = new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const pageContent = pages[pageIdx];
            const pageNumber = pageIdx + 1;
            const totalPages = pages.length;
            html += `
<div class="page">
<!-- Page Header -->
<div class="page-header">
  <div class="header-left"><pre> ${filedata?.cCasename}</pre></div>
  <div class="header-right">
    <div>${filedata?.cTVolume}</div>
    <div>${new Date(filedata?.dTranscribedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
     <div style="text-align: right;font-size: 8pt;">Page ${pageNumber}</div>
  </div>
</div>

<!-- Page Content -->
<table class="index-table">
  <tr>`;
            for (let colIdx = 0; colIdx < columnsPerPage; colIdx++) {
                const columnContent = pageContent[colIdx] || '';
                html += `<td><div class="column-content">${columnContent}</div></td>`;
            }
            html += `
  </tr>
</table>

<!-- Page Footer -->
<div class="page-footer">
  <div class="footer-left">${filedata?.cCompany}</div>
  <div class="footer-right">${filedata?.cCompanyinfo} </div>
 
</div>
</div>`;
        }
        html += `
</body>
</html>`;
        return html;
    }
    async htmlFileToDocStream(nMasterid, htmlFilePath, cTransid, origin) {
        try {
            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P' } } });
            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', error: 'Generating HTML' } } });
            const htmldata = await this.transcriptService.getHTMLfile({ cTransid: cTransid, nMasterid: nMasterid, type: 'FST' }, origin);
            const cPath = `s_${cTransid}_${'FST'}.html`;
            let r1 = await this.transcriptService.savehtmlToFile(htmldata.html, cPath);
            if (r1.msg === -1) {
                console.error('Error saving HTML file:', r1.value);
                this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', error: 'Error saving HTML file:' + r1.value } } });
                return;
            }
            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', error: 'HTML Generated' } } });
            this.generateDodocx(nMasterid, htmlFilePath).catch((error) => {
                this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', error: error.message } } });
            });
            return { msg: 1, value: 'generation started' };
        }
        catch (error) {
            return { msg: -1, value: 'error', error: error.message };
            console.error('Error converting HTML to DOC:', error);
        }
    }
    async generateDodocx(nMasterid, htmlFilePath) {
        const basePath = this.config.get('REALTIME_PATH') + 'exports/';
        let htmlPath = basePath + htmlFilePath;
        const timestamp = Date.now();
        const pdfPath = path.join(basePath, `${timestamp}.pdf`);
        const docFilename = `${timestamp}.docx`;
        const docPath = path.join(basePath, docFilename);
        try {
            const res = await this.generatePdf(htmlPath, pdfPath, nMasterid);
            if (res.msg == -1) {
                if (await fsextra.pathExists(pdfPath))
                    await fsextra.unlink(htmlPath);
                this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', error: res.error } } });
            }
            await this.convertPdfToDocxViaPython(pdfPath, docPath, nMasterid);
            if (await fsextra.pathExists(pdfPath))
                await fsextra.unlink(htmlPath);
            if (await fsextra.pathExists(pdfPath))
                await fsextra.unlink(pdfPath);
            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'S', path: docFilename } } });
        }
        catch (err) {
            console.error('File generation failed:', err);
            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', error: err } } });
            if (await fsextra.pathExists(pdfPath))
                await fsextra.unlink(htmlPath);
            if (await fsextra.pathExists(pdfPath))
                await fsextra.unlink(pdfPath);
        }
    }
    async generatePdf(filePath, pdfPath, nMasterid) {
        this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', message: 'Generating Pagination' } } });
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--headless=new',
            ],
            timeout: 1000,
            protocolTimeout: 120_000
        });
        const page = await browser.newPage();
        const fileUrl = `file://${filePath}`;
        console.log('\n\r\n\rfilePath:', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        const PDFpath = pdfPath;
        console.log('PDFpath:', PDFpath, 'SAVING PDF');
        const opts = {
            path: PDFpath, format: 'A4', printBackground: true
        };
        let res = await page.pdf(opts);
        this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', message: 'PDF generated successfully!' } } });
        console.log('PDF saved successfully!');
        await browser.close();
        return PDFpath;
    }
    async convertPdfToDocxViaPython(pdfPath, docxPath, nMasterid) {
        const timeoutMs = 0;
        const outputDir = path.dirname(pdfPath);
        this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', message: 'Generating PDF to .docx!' } } });
        const pythonScript = this.config.get('PY_CREATE_DOCUMENT');
        await new Promise((resolve, reject) => {
            const child = (0, child_process_1.spawn)(this.config.get('pythonV'), [pythonScript, pdfPath, docxPath], {
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let title = '';
            child.stdout.setEncoding('utf8').on('data', (chunk) => chunk.split(/\r?\n/).forEach((l) => l && console.log(`[PY] ${l}`)));
            child.stderr.setEncoding('utf8').on('data', (chunk) => chunk.split(/\r?\n/).forEach((l) => {
                l && console.error(`[PY] ${l}`);
                debugger;
                if (l != '') {
                    try {
                        const listtext = l.split(' ')[2] + ' ' + l.split(' ')[3];
                        const infoMatch = listtext?.match(/(Opening document|Analyzing document|Parsing pages|to convert|Creating pages)/);
                        if (infoMatch) {
                            title = ((listtext?.match(/(to convert)/) ? (l.split(' ')[1] + ' ') : ' ') + l.split(' ')[2] + ' ' + l.split(' ')[3]).replace(/\x1B\[[0-9;]*m/g, '');
                            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', message: title } } });
                        }
                        else {
                            let message = (title != '' ? title + ' - ' : '') + l.replace('[INFO]', '');
                            this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'P', message: message } } });
                        }
                    }
                    catch (error) {
                    }
                }
            }));
            let timer;
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    child.kill('SIGKILL');
                    this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', message: `Python conversion timed out after ${timeoutMs} ms` } } });
                    reject(new Error(`Python conversion timed out after ${timeoutMs} ms`));
                }, timeoutMs);
            }
            child.on('error', reject);
            child.on('close', (code) => {
                if (timer)
                    clearTimeout(timer);
                if (code === 0 && fs.existsSync(docxPath)) {
                    resolve(docxPath);
                }
                else {
                    this.emitMsg({ event: 'DOC-EXPORT', data: { identifier: '', nMasterid: nMasterid, data: { status: 'F', message: `PDF→DOCX failed (exit ${code})` } } });
                    reject(new Error(`PDF→DOCX failed (exit ${code})`));
                }
            });
        });
        return docxPath;
    }
    downloadFile(cPath, res) {
        console.log('cPath:', cPath);
        const fileuri = cPath;
        const filePath = path.join(this.config.get('REALTIME_PATH'), 'exports', fileuri);
        res.download(filePath, fileuri, (err) => {
            if (err) {
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        });
    }
    async emitMsg(value) {
        this.kafka.sendMessage('realtime-response', value);
    }
};
exports.ExporttranscriptService = ExporttranscriptService;
exports.ExporttranscriptService = ExporttranscriptService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object, typeof (_d = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _d : Object, typeof (_e = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _e : Object, typeof (_f = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _f : Object, typeof (_g = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _g : Object, typeof (_h = typeof transcript_html_service_1.TranscriptHtmlService !== "undefined" && transcript_html_service_1.TranscriptHtmlService) === "function" ? _h : Object, typeof (_j = typeof transcript_service_1.TranscriptService !== "undefined" && transcript_service_1.TranscriptService) === "function" ? _j : Object])
], ExporttranscriptService);


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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GenerateWordIndexService = void 0;
const log_service_1 = __webpack_require__(41);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(28);
const db_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(6);
const fs = __webpack_require__(23);
const util_1 = __webpack_require__(25);
const child_process_1 = __webpack_require__(35);
const canvas_1 = __webpack_require__(81);
const puppeteer = __webpack_require__(33);
const path = __webpack_require__(24);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let GenerateWordIndexService = class GenerateWordIndexService {
    constructor(config, log, utility, db) {
        this.config = config;
        this.log = log;
        this.utility = utility;
        this.db = db;
        this.logApplication = 'realtime/export';
        this.exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
        this.helpingVerbs = new Set([
            'a', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had',
            'do', 'does', 'did', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'can', 'could'
        ]);
        this.stopWords = new Set([
            'the', 'and', 'to', 'of', 'in', 'for', 'on', 'with', 'by', 'at', 'from',
            'an', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their'
        ]);
    }
    async generateIndexFromFile(filePath, cTransid) {
        try {
            const pdfFilePath = filePath.replace(/\.json$/, '.pdf');
            if (!fs.existsSync(this.exportPath)) {
                fs.mkdirSync(this.exportPath, { recursive: true });
            }
            let res1 = await this.db.executeRef('get_transcript_detail', { cTransid: cTransid }, 'transcript');
            let filedata;
            filedata = res1.data[0][0];
            const transData = {
                cCasename: filedata.cCasename,
                cTVolume: filedata.cTVolume,
                dTranscribedDate: filedata.dTranscribedDate,
                cCompany: filedata.cCompany,
                cCompanyinfo: filedata.cCompanyinfo
            };
            const res = await this.generateFile(filePath, pdfFilePath, transData);
            if (res.msg === -1) {
                this.log.report(`Index generation error: ${res.error}`, this.logApplication, 'E');
                throw new Error(res.value || 'Error generating index');
            }
            this.log.report(`Index generation started for ${filePath}`, this.logApplication, 'I');
            const pdfBuffer = fs.readFileSync(pdfFilePath);
            return pdfBuffer;
        }
        catch (error) {
            this.log.report(`Index generation error: ${error?.message}`, this.logApplication, 'E');
            return Buffer.from(`Error generating index: ${error?.message}`, 'utf-8');
        }
    }
    generateFile(filePath, pdfFilePath, transData) {
        try {
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), [
                this.config.get('PY_TRANSCRIPT_WINDEX'),
                filePath,
                pdfFilePath, transData.cCasename, transData.cTVolume, transData.dTranscribedDate, transData.cCompany, transData.cCompanyinfo
            ]);
            let dataBuffer = '';
            pythonProcess.stdout.on('data', (data) => {
                dataBuffer += data.toString();
                console.log('DATA:', data.toString());
            });
            pythonProcess.stderr.on('data', (data) => {
                console.log('ERROR:', data.toString());
            });
            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.log('ERROR:', err);
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.log(`Python process exited with code ${code}`);
                        resolve({ msg: -1, value: 'Invalid File format', error: `Error: The transcript does not match the expected format. Please check the draft file format.` });
                        return;
                    }
                    resolve({ msg: 1 });
                });
            });
        }
        catch (error) {
            console.log('ERROR:', error);
            return Promise.resolve({ msg: -1, value: 'Failed to fetch', error: error });
        }
    }
    async generateIndex(filePath, cTransid) {
        const htmlFilePath = `${this.exportPath}wi_${cTransid}.html`;
        const pdfFilePath = `${this.exportPath}wi_${cTransid}.pdf`;
        let browser = null;
        try {
            const res = await this.db.executeRef('get_transcript_detail', { cTransid }, 'transcript');
            const filedata = res.data[0][0];
            const json_path = `${this.config.get('REALTIME_PATH')}${filePath}`;
            const pages = JSON.parse(fs.readFileSync(json_path, 'utf-8'));
            const wordMap = {};
            for (const pageObj of pages) {
                const pageNum = pageObj.page;
                (pageObj.data || []).forEach((lineObj, idx) => {
                    const linetext = Array.isArray(lineObj.lines) ? lineObj.lines.join(' ') : String(lineObj.lines || '');
                    const lineno = lineObj.lineIndex || (idx + 1);
                    const words = linetext.split(/\s+/).map((w) => this.cleanWord(w)).filter(Boolean);
                    for (const word of words) {
                        if (word.length < 2 || this.helpingVerbs.has(word) || this.stopWords.has(word) || !/^[a-zA-Z]/.test(word))
                            continue;
                        if (!wordMap[word])
                            wordMap[word] = [];
                        if (!wordMap[word].some(r => r.pageno === pageNum && r.lineno === lineno)) {
                            wordMap[word].push({ pageno: pageNum, lineno });
                        }
                    }
                });
            }
            console.log(`[WordIndex standalone] pages: ${pages.length}, words: ${Object.keys(wordMap).length}`);
            const indexHtml = this.generateIndexHtml(wordMap, filedata);
            fs.writeFileSync(htmlFilePath, indexHtml);
            const htmlAbsPath = path.resolve(htmlFilePath);
            const fileUrl = 'file:///' + htmlAbsPath.split(path.sep).join('/');
            browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], protocolTimeout: 120000 });
            const page = await browser.newPage();
            await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            await page.pdf({ path: pdfFilePath, format: 'A4', printBackground: true });
            await page.close();
            const pdfBuffer = fs.readFileSync(pdfFilePath);
            return pdfBuffer;
        }
        catch (error) {
            this.log.report(`Index generation error: ${error?.message}`, this.logApplication, 'E');
            return Buffer.from(`Error generating index: ${error?.message}`, 'utf-8');
        }
        finally {
            if (browser)
                browser.close().catch(() => { });
            try {
                fs.unlinkSync(htmlFilePath);
            }
            catch { }
            try {
                fs.unlinkSync(pdfFilePath);
            }
            catch { }
        }
    }
    distributeContentPageWise(grouped, columnsPerPage) {
        const pages = [];
        const BASE_TERM_HEIGHT = 13;
        const BASE_REF_HEIGHT = 6;
        const LETTER_HEIGHT = 16;
        const MAX_COLUMN_HEIGHT = 1250;
        const PAGE_WIDTH = 794;
        const COLUMN_WIDTH = PAGE_WIDTH / columnsPerPage;
        const COLUMN_PADDING = 20;
        const AVAILABLE_COLUMN_WIDTH = COLUMN_WIDTH - COLUMN_PADDING;
        const canvas = (0, canvas_1.createCanvas)(1, 1);
        const ctx = canvas.getContext('2d');
        ctx.font = '8pt "Times New Roman"';
        const calculateTermWidth = (word) => {
            ctx.font = 'bold 8pt "Times New Roman"';
            return ctx.measureText(word).width + 4;
        };
        const calculateRefWidth = (ref) => {
            ctx.font = '8pt "Times New Roman"';
            const refText = `${ref.pageno}:${ref.lineno}`;
            return ctx.measureText(refText).width + 3;
        };
        const calculateRefsHeight = (word, refs) => {
            if (refs.length === 0)
                return 0;
            const termWidth = calculateTermWidth(word);
            const firstLineWidth = AVAILABLE_COLUMN_WIDTH - termWidth;
            const fullLineWidth = AVAILABLE_COLUMN_WIDTH;
            let currentLineWidth = 0;
            let currentLine = 1;
            let isFirstLine = true;
            for (let i = 0; i < refs.length; i++) {
                const refWidth = calculateRefWidth(refs[i]);
                const spaceWidth = ctx.measureText(' ').width;
                if (currentLineWidth > 0) {
                    currentLineWidth += spaceWidth;
                }
                if (currentLineWidth + refWidth > (isFirstLine ? firstLineWidth : fullLineWidth)) {
                    currentLine++;
                    currentLineWidth = refWidth;
                    isFirstLine = false;
                }
                else {
                    currentLineWidth += refWidth;
                }
            }
            return BASE_TERM_HEIGHT + ((currentLine - 1) * BASE_REF_HEIGHT);
        };
        const flattenContent = () => {
            const elements = [];
            for (const letter of Object.keys(grouped).sort()) {
                elements.push({
                    type: 'letter',
                    content: `<div class="letter-heading">${letter}</div>`,
                    height: LETTER_HEIGHT,
                    letter: letter
                });
                const wordsInThisLetter = grouped[letter];
                for (let i = 0; i < wordsInThisLetter.length; i++) {
                    const [word, refs] = wordsInThisLetter[i];
                    if (refs.length === 0)
                        continue;
                    const isFirstTermInLetter = i === 0;
                    const entryHeight = calculateRefsHeight(word, refs);
                    const lineBreak = isFirstTermInLetter ? '' : '<br>';
                    const termHtml = `${lineBreak}<span class="term" style="display: inline;">${word}</span> ` +
                        `<span class="ref-item" style="display: inline;">${refs[0].pageno}:${refs[0].lineno}</span> `;
                    elements.push({
                        type: 'term',
                        content: termHtml,
                        height: BASE_TERM_HEIGHT + (isFirstTermInLetter ? 0 : 4),
                        isFirstTermInLetter,
                        word
                    });
                    for (let j = 1; j < refs.length; j++) {
                        const refHtml = `<span class="ref-item" style="display: inline;">${refs[j].pageno}:${refs[j].lineno}</span> `;
                        elements.push({
                            type: 'reference',
                            content: refHtml,
                            height: BASE_REF_HEIGHT,
                            word
                        });
                    }
                }
            }
            return elements;
        };
        const elements = flattenContent();
        let currentPageIndex = 0;
        let currentColumnIndex = 0;
        let currentColumnContent = '';
        let currentColumnHeight = 0;
        let lastLetterShown = '';
        let lastWordShown = '';
        pages[0] = new Array(columnsPerPage).fill('');
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const nextElement = i < elements.length - 1 ? elements[i + 1] : null;
            const isCurrentElementRef = element.type === 'reference';
            const isNextElementTerm = nextElement && nextElement.type === 'term';
            const remainingHeight = MAX_COLUMN_HEIGHT - currentColumnHeight;
            const wouldLeaveSmallGap = remainingHeight - element.height < 20 && remainingHeight - element.height > 0;
            if (isCurrentElementRef && isNextElementTerm && wouldLeaveSmallGap) {
                pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
                currentColumnIndex++;
                if (currentColumnIndex >= columnsPerPage) {
                    currentPageIndex++;
                    currentColumnIndex = 0;
                    pages[currentPageIndex] = new Array(columnsPerPage).fill('');
                }
                currentColumnContent = '';
                currentColumnHeight = 0;
                if (currentColumnIndex === 0) {
                    lastLetterShown = '';
                }
                continue;
            }
            if (currentColumnHeight + element.height > MAX_COLUMN_HEIGHT) {
                pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
                currentColumnIndex++;
                if (currentColumnIndex >= columnsPerPage) {
                    currentPageIndex++;
                    currentColumnIndex = 0;
                    pages[currentPageIndex] = new Array(columnsPerPage).fill('');
                }
                currentColumnContent = '';
                currentColumnHeight = 0;
                if (currentColumnIndex === 0) {
                    lastLetterShown = '';
                    lastWordShown = '';
                }
                continue;
            }
            if (element.type === 'letter') {
                if (element.letter !== lastLetterShown) {
                    currentColumnContent += element.content;
                    currentColumnHeight += element.height;
                    lastLetterShown = element.letter;
                }
            }
            else if (element.type === 'term') {
                currentColumnContent += element.content;
                currentColumnHeight += element.height;
                if (element.word) {
                    lastWordShown = element.word;
                }
            }
            else {
                if (element.word && element.word !== lastWordShown && element.word) {
                    if (lastWordShown !== '') {
                        currentColumnContent += `<br><span class="term" style="display: inline;">${element.word}</span> `;
                        currentColumnHeight += 4;
                    }
                    lastWordShown = element.word;
                }
                currentColumnContent += element.content;
                currentColumnHeight += element.height;
            }
        }
        if (currentColumnContent.trim() !== '') {
            pages[currentPageIndex][currentColumnIndex] = currentColumnContent;
        }
        return pages;
    }
    generateIndexHtml(wordMap, filedata) {
        const PAGE_WIDTH = 794;
        const PAGE_HEIGHT = 1050;
        const PAGE_PADDING = 80;
        const HEADER_HEIGHT = 50;
        const FOOTER_HEIGHT = 30;
        const availableHeight = PAGE_HEIGHT - PAGE_PADDING - HEADER_HEIGHT - FOOTER_HEIGHT;
        const sortedWords = Object.keys(wordMap).sort();
        const grouped = {};
        for (const word of sortedWords) {
            const letter = word[0].toUpperCase();
            if (!grouped[letter])
                grouped[letter] = [];
            grouped[letter].push([word, wordMap[word]]);
        }
        const columnsPerPage = 4;
        let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Transcript Word Index</title>
<style>
  @page {
    size: 794px 1123px;
    margin: 40px;
  }


  p,pre,div,span{
  font-family: "Times New Roman", Times, serif;
  }
  
  body {
    font-family: "Times New Roman", Times, serif;
    margin: 0;
    padding: 0;
    line-height: 1.2;
    font-size: 9pt;
    width: 794px;
  }
  
  .page {
    page-break-after: always;
    position: relative;
    width: 794px;
    height: 1100px;
    box-sizing: border-box;
    padding: 40px 40px;
    overflow: hidden; /* Prevent any page overflow */
  }
  
  .page:last-child {
    page-break-after: avoid;
  }
  
  .page-header {
    font-size: 8pt;
    margin-bottom: 10px;
    padding-bottom: 3px;
    position: relative;
    height: ${HEADER_HEIGHT + 5}px;
border-bottom: 1px solid #c2c2c2;
  }
  
  .header-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .header-right {
    text-align: right;
    width: 50%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .page-footer {
    font-size: 8pt;
    padding-top: 10px;
    margin-top: 10px;
    height: ${FOOTER_HEIGHT - 10}px;
    border-top: 1px solid #c2c2c2;
    display: flex;
    justify-content: space-between;
  }
  
  .footer-left {
    text-align: left;
    width: 49%;
    display: inline-block;
    height: 100%;
    vertical-align: top;
  }
  
  .footer-right {
    width: 50%;
    display: inline-block;
    text-align: right;
    height: 100%;
    vertical-align: top;
  }
  
  .letter-heading {
    font-weight: bold;
    font-size: 11pt;
    margin: 2px 0 1px 0;
    text-decoration: underline;
    line-height: 1.1;
    display: block;
  }
  
  .term {
    font-weight: bold;
    display: inline;
    margin-right: 1mm;
  }
  
  .ref-item {
    display: inline;
    padding-right: 3px; /* Space between references */
  }
  
  .index-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    height: ${availableHeight}px;
    border: 1px solid #c2c2c2;
  }
  
  .index-table td {
    vertical-align: top;
    width: 25%;
    padding: 10px 8px;
    border-right: 1pt solid #c2c2c2;
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
    position: relative;
  }
  
  .index-table td:last-child {
    border-right: none;
  }
  
  .column-content {
    height: ${availableHeight}px;
    max-height: ${availableHeight}px;
    overflow: hidden;
    word-wrap: break-word;
  }

  pre{
  margin: 0;
  white-space: pre-line;
  }
</style>
</head>
<body>`;
        const pages = this.distributeContentPageWise(grouped, columnsPerPage);
        const currentDate = new Date().toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
            const pageContent = pages[pageIdx];
            const pageNumber = pageIdx + 1;
            const totalPages = pages.length;
            html += `
<div class="page">
<!-- Page Header -->
<div class="page-header">
  <div class="header-left"><pre> ${filedata?.cCasename}</pre></div>
  <div class="header-right">
    <div>${filedata?.cTVolume}</div>
    <div>${new Date(filedata?.dTranscribedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
     <div style="text-align: right;font-size: 8pt;">Page ${pageNumber}</div>
  </div>
</div>

<!-- Page Content -->
<table class="index-table">
  <tr>`;
            for (let colIdx = 0; colIdx < columnsPerPage; colIdx++) {
                const columnContent = pageContent[colIdx] || '';
                html += `<td><div class="column-content">${columnContent}</div></td>`;
            }
            html += `
  </tr>
</table>

<!-- Page Footer -->
<div class="page-footer">
  <div class="footer-left">${filedata?.cCompany}</div>
  <div class="footer-right">${filedata?.cCompanyinfo} </div>
 
</div>
</div>`;
        }
        html += `
</body>
</html>`;
        return html;
    }
    cleanWord(word) {
        return word.toLowerCase()
            .replace(/[^\w]/g, '')
            .replace(/^\d+$/, '');
    }
    isNumeric(str) {
        return /^\d+(\.\d+)?$/.test(str);
    }
    async convertHtmlToPdf(htmlFilePath, outputPdfPath) {
        try {
            const wkhtmltopdfOptions = [
                '--page-size A4',
                '--margin-top 0',
                '--margin-right 0',
                '--margin-bottom 0',
                '--margin-left 0',
                '--encoding UTF-8',
                '--enable-local-file-access',
                '--print-media-type',
                '--disable-smart-shrinking',
                '--header-spacing 5',
                '--footer-spacing 5'
            ].join(' ');
            const command = `wkhtmltopdf ${wkhtmltopdfOptions} "${htmlFilePath}" "${outputPdfPath}"`;
            await execAsync(command);
            this.log.report(`PDF generated successfully: ${outputPdfPath}`, this.logApplication, 'I');
        }
        catch (error) {
            this.log.report(`wkhtmltopdf conversion error: ${error?.message}`, this.logApplication, 'E');
            throw error;
        }
    }
};
exports.GenerateWordIndexService = GenerateWordIndexService;
exports.GenerateWordIndexService = GenerateWordIndexService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object, typeof (_d = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _d : Object])
], GenerateWordIndexService);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptpublishService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const db_service_1 = __webpack_require__(8);
const log_service_1 = __webpack_require__(41);
const transcript_html_service_1 = __webpack_require__(79);
const transcript_service_1 = __webpack_require__(78);
const kafka_shared_service_1 = __webpack_require__(29);
const verifypdf_service_1 = __webpack_require__(86);
const filecopy_service_1 = __webpack_require__(87);
const fs = __webpack_require__(92);
const node_path_1 = __webpack_require__(93);
const path = __webpack_require__(93);
const node_child_process_1 = __webpack_require__(94);
const puppeteer = __webpack_require__(33);
const pdf_lib_1 = __webpack_require__(95);
const generate_word_index_service_1 = __webpack_require__(84);
const node_util_1 = __webpack_require__(96);
const execAsync = (0, node_util_1.promisify)(node_child_process_1.exec);
const utility_service_1 = __webpack_require__(28);
const conversion_js_service_1 = __webpack_require__(36);
const feed_data_service_1 = __webpack_require__(37);
const annot_transfer_service_1 = __webpack_require__(46);
let TranscriptpublishService = class TranscriptpublishService {
    constructor(config, db, log, htmlService, transService, kafka, verifier, copier, utilityService, conversion, feedData, wordIndexService, annotTransferService) {
        this.config = config;
        this.db = db;
        this.log = log;
        this.htmlService = htmlService;
        this.transService = transService;
        this.kafka = kafka;
        this.verifier = verifier;
        this.copier = copier;
        this.utilityService = utilityService;
        this.conversion = conversion;
        this.feedData = feedData;
        this.wordIndexService = wordIndexService;
        this.annotTransferService = annotTransferService;
        this.logTag = 'realtime/transcript';
        this.browser = null;
    }
    async transcriptPublish(body, origin) {
        const { cPath, cTransid, nSesid } = body;
        const basePath = this.config.get('REALTIME_PATH');
        const filePath = basePath + cPath;
        const jsonPath = filePath.replace(/\.[^/.]+$/, '.json');
        const PathTEXT = filePath.replace(/\.[^/.]+$/, '.TXT');
        const sessionPathTEXT = basePath + 's_' + nSesid + '.TXT';
        if (!cPath || !cTransid)
            return this.logError('Missing cPath or cTransid', cTransid);
        if (!fs.existsSync(filePath))
            return this.logError(`Transcript file not found: ${filePath}`, cTransid);
        if (!fs.existsSync(jsonPath))
            return this.logError(`Transcript JSON not found: ${jsonPath}`, cTransid);
        if (!body?.isIgnoreErr) {
            const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            if (!Array.isArray(jsonData) || jsonData.length === 0)
                return this.logError('Transcript JSON is empty or malformed', cTransid);
            const errors = jsonData.filter(e => e.lineno && !e.timestamp && e.linetext && !e.isIndex);
            if (errors.length > 0) {
                const errLines = errors.slice(0, 10).map(e => `Page: ${e.pageno}, Line: ${e.lineno}`).join(', ');
                const message = `Missing timestamps or text in: ${errLines}${errors.length > 10 ? `... and ${errors.length - 10} more.` : ''}`;
                return this.logError(message, cTransid);
            }
        }
        try {
            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'P', message: 'Transferring annotations…' } }
            });
            fs.copyFile(PathTEXT, sessionPathTEXT, (err) => {
                if (err)
                    throw err;
            });
            const transferResult = await this.transferAnnotations(filePath, body.nSesid, cTransid, body.nMasterid);
            if (transferResult.msg !== 1) {
                this.emitMsg({
                    event: 'PUBLISH-TRANSCRIPT',
                    data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'F', message: 'Annotation transfer failed' } }
                });
                return this.logError('Annotation transfer failed', cTransid);
            }
            const publishResult = await this.db.executeRef('transcript_publish', body, 'transcript');
            if (!publishResult.success) {
                this.emitMsg({
                    event: 'PUBLISH-TRANSCRIPT',
                    data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'F', message: 'DB publish failed' } }
                });
                return this.logError('DB publish failed', cTransid, publishResult.error);
            }
            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'S', message: 'Published' } }
            });
            return publishResult.data[0][0];
        }
        catch (err) {
            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: { identifier: '', nMasterid: body.nMasterid, data: { status: 'F', message: `Publish failed: ${err?.message || String(err)}` } }
            });
            return this.logError(`Unexpected error: ${err?.message || String(err)}`, cTransid);
        }
    }
    async transferAnnotations(filePath, nSesid, cTransid, nMasterid) {
        this.log.info(`Starting annotation transfer for: ${filePath}`, this.logTag);
        const args = [
            this.config.get('PY_ANNOT_TRANSFER_BY_TRANSCRIPT'),
            nSesid,
            filePath,
            this.config.get('REALTIME_PATH'),
            this.config.get('DB_DATABASE'),
            this.config.get('DB_USERNAME'),
            this.config.get('DB_PASSWORD'),
            this.config.get('DB_HOST'),
            this.config.get('DB_PORT'),
        ];
        const startTime = Date.now();
        let phase = 'fetch';
        let issueTotal = 0;
        let issueDone = 0;
        let highlightDone = 0;
        let lastEmitAt = 0;
        let lastPercent = -1;
        const formatElapsed = () => {
            const sec = Math.floor((Date.now() - startTime) / 1000);
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return m > 0 ? `${m}m ${s}s` : `${s}s`;
        };
        const computePercent = () => {
            if (phase === 'issues' && issueTotal > 0) {
                return Math.min(100, Math.round((issueDone / issueTotal) * 100));
            }
            return undefined;
        };
        const buildMessage = () => {
            switch (phase) {
                case 'fetch': return 'Fetching annotations from database…';
                case 'parse': return 'Parsing transcript…';
                case 'highlights': return highlightDone > 0
                    ? `Transferring highlights — ${highlightDone} processed`
                    : 'Transferring highlights…';
                case 'issues':
                    if (issueTotal > 0) {
                        const pct = computePercent();
                        return `Transferring annotations — ${issueDone}/${issueTotal} (${pct}%)`;
                    }
                    return 'Transferring annotations…';
            }
        };
        const emitProgress = (force = false) => {
            const now = Date.now();
            if (!force && now - lastEmitAt < 800)
                return;
            const percent = computePercent();
            if (!force && percent !== undefined && percent === lastPercent)
                return;
            if (percent !== undefined)
                lastPercent = percent;
            lastEmitAt = now;
            this.emitMsg({
                event: 'PUBLISH-TRANSCRIPT',
                data: {
                    identifier: '',
                    nMasterid,
                    data: {
                        status: 'P',
                        message: buildMessage(),
                        percent,
                        elapsed: formatElapsed(),
                    }
                }
            });
        };
        return new Promise(resolve => {
            const proc = (0, node_child_process_1.spawn)(this.config.get('pythonV'), args);
            const heartbeat = setInterval(() => {
                if (Date.now() - lastEmitAt > 4000)
                    emitProgress(true);
            }, 2000);
            proc.stdout.on('data', (data) => {
                const text = data.toString();
                this.log.info(`DATA: ${text}`, `${this.logTag}/${cTransid}`);
                if (text.includes('Fetching issues from DB')) {
                    phase = 'fetch';
                    emitProgress(true);
                }
                if (text.includes('Parsing transcript file')) {
                    phase = 'parse';
                    emitProgress(true);
                }
                if (text.includes('Processing Issues')) {
                    phase = 'issues';
                    emitProgress(true);
                }
                const hlSuccess = text.match(/SUCCESS: Highlight /g);
                const hlFailure = text.match(/FAILURE: Highlight /g);
                const hlOrphan = text.match(/ORPHAN \(time gap\): Highlight/g);
                const hlInc = (hlSuccess?.length || 0) + (hlFailure?.length || 0) + (hlOrphan?.length || 0);
                if (hlInc > 0) {
                    if (phase === 'fetch' || phase === 'parse')
                        phase = 'highlights';
                    highlightDone += hlInc;
                    emitProgress();
                }
                const totalMatch = text.match(/Found (\d+) issues to transfer/);
                if (totalMatch) {
                    issueTotal = parseInt(totalMatch[1], 10);
                    phase = 'issues';
                    emitProgress(true);
                }
                const issueMatched = text.match(/Matched \d+ lines for annotation/g);
                const issueOrphan = text.match(/ORPHAN \(time gap\): annotation/g);
                const issueInc = (issueMatched?.length || 0) + (issueOrphan?.length || 0);
                if (issueInc > 0) {
                    phase = 'issues';
                    issueDone += issueInc;
                    emitProgress();
                }
            });
            proc.stderr.on('data', (data) => {
                this.log.error(data.toString(), `${this.logTag}/${cTransid}`);
                console.error(data.toString(), `${this.logTag}/${cTransid}`);
            });
            proc.on('close', (code) => {
                clearInterval(heartbeat);
                if (code === 0) {
                    this.log.info('Annotation transfer complete', `${this.logTag}/${cTransid}`);
                    this.annotTransferService.notifyTransferComplete(nSesid);
                    resolve({ msg: 1 });
                }
                else {
                    this.log.error(`Python exited with code ${code}`, `${this.logTag}/${cTransid}`);
                    resolve({ msg: -1 });
                }
            });
        });
    }
    async generateTranscriptDetail(body, formData, lines, theme, nUserid, index, origin, output, isSubmit = true) {
        const annotMode = body.bAnnotations === false ? 'NONE' : (body.cAnnotations || 'ALL');
        const annotType = body.cAnnotationType || 'ALL';
        if (annotMode === 'NONE') {
            body.bQmark = false;
            body.bQfact = false;
            body.bFact = false;
        }
        else {
            body.bQmark = annotType === 'ALL' || annotType === 'QM';
            body.bQfact = annotType === 'ALL' || annotType === 'QF';
            body.bFact = annotType === 'ALL' || annotType === 'FACT';
        }
        if (body.bAnnotationSummary !== false) {
            body.bQfact = true;
            body.bQmark = true;
            body.bFact = true;
        }
        const filterGroups = body.jAnnotationFilters || [];
        if (filterGroups.length > 0) {
            const allFilterIssues = filterGroups.flatMap((f) => [
                ...(f.jIssues || []),
                ...(f.jClaims || []),
                ...(f.jRels || []),
                ...(f.jImps || []),
            ]).filter(Boolean);
            if (allFilterIssues.length > 0) {
                body.jIssues = allFilterIssues;
                body.jHIssues = allFilterIssues;
            }
        }
        const summaryOfAnnots = [];
        const summaryOfHihglights = [];
        const qmHighlightRecords = [];
        try {
            const sessionId = body.nMarknavSesid || formData?.nSesid || body.nSesid || body.nSessionid;
            const strip = (t) => (t || '').replace(/[ --]/g, '').trim();
            const jFilterObj = {};
            for (const group of filterGroups) {
                for (const [key, val] of Object.entries(group)) {
                    if (['cFilterType', 'cCategory', 'cType'].includes(key))
                        continue;
                    if (val === null || val === false || val === undefined || val === '')
                        continue;
                    if (Array.isArray(val) && val.length === 0)
                        continue;
                    if (Array.isArray(val)) {
                        if (!Array.isArray(jFilterObj[key]))
                            jFilterObj[key] = [];
                        jFilterObj[key].push(...val);
                    }
                    else {
                        jFilterObj[key] = val;
                    }
                }
            }
            const cleanedFilter = {};
            for (const [key, val] of Object.entries(jFilterObj)) {
                if (val === null || val === false || val === undefined || val === '')
                    continue;
                if (Array.isArray(val) && val.length === 0)
                    continue;
                cleanedFilter[key] = val;
            }
            const jFilterStr = Object.keys(cleanedFilter).length ? JSON.stringify(cleanedFilter) : null;
            const factlistBase = {
                nSesid: sessionId,
                nUserid: nUserid,
                cSorttype: 'H',
                cSortby: 'desc',
                nPageNumber: 1,
                bIsTranscipt: false,
                jFilter: jFilterStr,
                jIssues: body.jIssues || [],
                jHIssues: body.jHIssues || [],
                jClaims: cleanedFilter.jClaims || [],
                jRels: cleanedFilter.jRels || [],
                ref: 3,
            };
            const allRes = await this.db.executeRef('navigate_get_all', factlistBase, 'realtime');
            const allAnnotations = allRes?.data?.[0] || [];
            const issueRows = allRes?.data?.[1] || [];
            const buildIssueMap = (rows) => {
                const map = new Map();
                for (const issue of (rows || [])) {
                    for (const fsid of (issue.jFSids || [])) {
                        if (!map.has(fsid))
                            map.set(fsid, []);
                        map.get(fsid).push({
                            cIName: issue.cIName || '',
                            cColor: issue.cColor || '',
                            nImpactid: issue.nImpactid || null,
                            cRel: issue.cRelevance || '',
                            cImp: issue.cImpact || '',
                        });
                    }
                }
                return map;
            };
            const issueMap = buildIssueMap(issueRows);
            const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
            const fmtCoords = (coords) => (coords || []).map((c) => ({
                l: c.l, p: c.p,
                t: (c.t || '').substring(0, 5),
                text: strip(c.text || ''),
            }));
            const toAnnot = (e) => {
                const sourceText = (e.jCordinates || []).map((c) => strip(c.text || '')).filter((t) => t).join(' ');
                return {
                    nIDid: e.nFSid || e.id,
                    pageIndex: e.nPage,
                    cLineno: e.nLine || '',
                    cONote: sourceText || strip((e.jOT || [])[0] || ''),
                    cNote: strip((e.jTexts || [])[0] || ''),
                    issues: issueMap.get(e.nFSid || e.id) || [],
                    cCreateby: e.cCreateby || '',
                    dCreateDt: fmtDate(e.dCreateDt),
                    jCordinates: fmtCoords(e.jCordinates),
                    list: e.list || [],
                    cSource: e.cSource || '',
                };
            };
            if (body.bQfact) {
                const qfactItems = allAnnotations.filter((e) => e.cSource === 'QF').map(toAnnot);
                if (qfactItems.length)
                    summaryOfAnnots.push({ title: 'QFact', data: qfactItems });
            }
            if (body.bFact) {
                const factItems = allAnnotations.filter((e) => e.cSource === 'F').map(toAnnot);
                if (factItems.length)
                    summaryOfAnnots.push({ title: 'Full Fact', data: factItems });
            }
            const docItems = allAnnotations.filter((e) => e.cSource === 'D').map(toAnnot);
            if (docItems.length)
                summaryOfAnnots.push({ title: 'DocLink', data: docItems });
            const showDocLinksInline = annotMode !== 'NONE' && (annotType === 'ALL' || annotType === 'LINK');
            body.__docLinkAnnots = showDocLinksInline ? allAnnotations.filter((e) => e.cSource === 'D') : [];
            if (body.bQmark) {
                const lineTextByKey = new Map();
                for (const ln of (lines || [])) {
                    lineTextByKey.set(`${ln.pageno}-${ln.lineno}`, strip(ln.linetext || ''));
                }
                const groupData = [];
                allAnnotations
                    .filter((e) => e.cSource === 'QM')
                    .forEach((item) => {
                    const cPageno = item.cPageno ?? item.nPage ?? null;
                    const cLineno = item.cLineno ?? item.nLine ?? item.jCordinates?.[0]?.l ?? null;
                    const lineKey = cPageno != null && cLineno != null ? `${cPageno}-${cLineno}` : '';
                    const coords = (item.jCordinates || []);
                    if (coords.length > 0) {
                        coords.forEach((c) => {
                            qmHighlightRecords.push({
                                cPageno: c.p,
                                cLineno: c.l,
                                cColor: item.cColor || 'EBCAFF',
                                cTime: c.t || item.cTime || '',
                                nHid: `${item.nHid || item.id}_${c.p}_${c.l}`,
                                identity: c.identity || item.identity,
                            });
                        });
                    }
                    else {
                        const fallbackPage = cPageno ?? null;
                        const fallbackLine = cLineno ?? null;
                        if (fallbackPage != null) {
                            qmHighlightRecords.push({
                                cPageno: fallbackPage, cLineno: fallbackLine,
                                cColor: item.cColor || 'EBCAFF',
                                cTime: item.cTime || '',
                                nHid: item.nHid || item.id,
                                identity: item.identity,
                            });
                        }
                    }
                    const sourceText = (item.jCordinates || []).map((c) => strip(c.text || '')).filter((t) => t).join(' ');
                    const mapped = {
                        nIDid: item.nHid || item.nFSid || item.id,
                        cPageno, pageIndex: cPageno,
                        cLineno: cLineno != null ? String(cLineno) : '',
                        cONote: sourceText || strip((item.jOT || [])[0] || '') || lineTextByKey.get(lineKey) || '',
                        cNote: strip((item.jTexts || [])[0] || '') || sourceText || lineTextByKey.get(lineKey) || '',
                        issues: issueMap.get(item.nHid || item.nFSid || item.id) || [],
                        cCreateby: item.cCreateby || '',
                        dCreateDt: fmtDate(item.dCreateDt),
                        jCordinates: fmtCoords(item.jCordinates),
                        cColor: item.cColor || 'EBCAFF',
                    };
                    const nGroupid = item.nGroupid || item.nHid || item.nFSid || item.id;
                    const idx = groupData.findIndex(a => a.nGroupid == nGroupid);
                    if (idx > -1)
                        groupData[idx].data.push(mapped);
                    else
                        groupData.push({ nGroupid, data: [mapped] });
                });
                if (groupData.length)
                    summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
            }
        }
        catch (error) {
            console.error('[generateTranscriptDetail] annotation fetch error:', error?.message || error);
        }
        let query = {
            nUserid: nUserid,
            nCaseid: body.nCaseid,
            cPath: body.cPath,
            nSessionid: body.nSessionid || body.nSesid,
            bQfact: body.bQfact,
            bQmark: body.bQmark,
            jHIssues: body.jHIssues || [],
            jIssues: body.jIssues || [],
            cTranscript: body.cTranscript || 'Y',
        };
        query['ref'] = 2;
        const res = await this.db.executeRef('realtime_get_issue_annotation_highlight_export', query);
        if (res.success) {
            try {
                if (res.data.length) {
                    const issuedetails = res.data.length > 0 && body.bQfact ? res.data[0] : [];
                    const finalIssueDetail = [];
                    try {
                        for (let x of issuedetails) {
                            if (x.cordinates && x.cordinates.length) {
                                const cordinates = x.cordinates;
                                if ((body.cProtocol || 'C') == 'B') {
                                    try {
                                        for (let rect of cordinates) {
                                            const [hh, mm, ss] = rect.t.split(':');
                                            const timestamp = [
                                                hh.padStart(2, '0'),
                                                mm.padStart(2, '0'),
                                                ss.padStart(2, '0')
                                            ].join(':');
                                            const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : body?.cTranscript == 'Y' ? a.lineno == rect.l : true));
                                            if (lnInd > -1) {
                                                rect.l = lines[lnInd].lineno;
                                                rect.p = lines[lnInd].pageno;
                                            }
                                        }
                                    }
                                    catch (error) {
                                        console.error('update line error - ', error);
                                    }
                                }
                                const pages = [...new Set(cordinates.map(a => a.p) || [])];
                                for (let p of pages) {
                                    const obj = { ...x };
                                    obj.pageIndex = p;
                                    obj.cordinates = cordinates.filter(a => a.p == p);
                                    finalIssueDetail.push({ ...obj });
                                }
                            }
                        }
                    }
                    catch (error) {
                        console.error('cordinate error', error);
                    }
                    let updatedCordinats = [];
                    try {
                        updatedCordinats = this.updateCordinates(lines, (finalIssueDetail), body);
                    }
                    catch (error) {
                        console.error('Error updating coordinates:', error);
                        updatedCordinats = [];
                    }
                    res.data[0] = updatedCordinats;
                    const docLinkAnnots = body.__docLinkAnnots || [];
                    const finalDocLinkDetail = [];
                    for (const d of docLinkAnnots) {
                        const cords = (d?.jCordinates || []);
                        if (!cords.length)
                            continue;
                        const pages = [...new Set(cords.map((a) => a.p) || [])];
                        for (const p of pages) {
                            finalDocLinkDetail.push({
                                nIDid: d.nFSid || d.id || d.nDocid,
                                cordinates: cords.filter((a) => a.p == p).map((c) => ({ ...c })),
                                color: d.cColor || '7DBAFF',
                                cONote: '',
                                pageIndex: p,
                                cType: 'D',
                            });
                        }
                    }
                    let updatedDocLinks = [];
                    try {
                        updatedDocLinks = this.updateCordinates(lines, finalDocLinkDetail, body);
                    }
                    catch (e) {
                        console.error('Error updating doclink cordinates:', e);
                        updatedDocLinks = [];
                    }
                    res.data[2] = updatedDocLinks;
                    try {
                        if (res.data[1].length) {
                            for (let rect of res.data[1]) {
                                try {
                                    const parts = (typeof rect.cTime === 'string' && rect.cTime.includes(':'))
                                        ? rect.cTime.split(':')
                                        : null;
                                    if (parts && parts.length === 3) {
                                        const [hh, mm, ss] = parts;
                                        const timestamp = [
                                            (hh || '').padStart(2, '0'),
                                            (mm || '').padStart(2, '0'),
                                            (ss || '').padStart(2, '0')
                                        ].join(':');
                                        const lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid && body?.cTranscript != 'Y' ? (a?.unicid == rect?.identity) : body?.cTranscript == 'Y' ? a.lineno == rect.cLineno : true));
                                        if (lnInd > -1) {
                                            rect.cLineno = lines[lnInd].lineno;
                                            rect.cPageno = lines[lnInd].pageno;
                                        }
                                    }
                                }
                                catch (e) {
                                    console.error('Error matching highlight timestamp:', e);
                                }
                                if (!rect.cPageno)
                                    rect.cPageno = rect.pageIndex || rect.nPage || rect.cPageno || '1';
                                if (!rect.cLineno)
                                    rect.cLineno = rect.nLine || rect.lineno || '';
                            }
                            if (body.bQmark && !summaryOfHihglights.some((s) => s.title === 'Quick Mark')) {
                                const lineTextByKeyFallback = new Map();
                                for (const ln of (lines || [])) {
                                    lineTextByKeyFallback.set(`${ln.pageno}-${ln.lineno}`, (ln.linetext || '').trim());
                                }
                                const groupData = (res.data[1] || []).map((item) => {
                                    const pg = item.cPageno;
                                    const ln = item.cLineno;
                                    const lineKey = pg != null && ln != null ? `${pg}-${ln}` : '';
                                    const mapped = {
                                        nIDid: item.nHid,
                                        cPageno: pg, pageIndex: pg,
                                        cLineno: ln != null ? String(ln) : '',
                                        cONote: lineTextByKeyFallback.get(lineKey) || '',
                                        cNote: '',
                                        issues: [],
                                        cCreateby: item.cCreateby || '',
                                        dCreateDt: item.dCreateDt ? new Date(item.dCreateDt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '',
                                        jCordinates: [],
                                        cColor: item.cColor || 'EBCAFF',
                                    };
                                    return { nGroupid: item.nHid, data: [mapped] };
                                });
                                if (groupData.length)
                                    summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
                            }
                        }
                    }
                    catch (error) {
                    }
                }
            }
            catch (error) {
            }
            await this.embedImpactImages(summaryOfAnnots);
            try {
                if (body.bQmark && qmHighlightRecords.length) {
                    if (!Array.isArray(res.data))
                        res.data = [];
                    if (!Array.isArray(res.data[1]))
                        res.data[1] = [];
                    const byHid = new Map();
                    for (const rec of res.data[1]) {
                        if (rec?.nHid)
                            byHid.set(rec.nHid, rec);
                    }
                    let augmented = 0, added = 0;
                    for (const rec of qmHighlightRecords) {
                        if (rec.nHid && byHid.has(rec.nHid)) {
                            const existing = byHid.get(rec.nHid);
                            if (existing.cPageno == null)
                                existing.cPageno = rec.cPageno;
                            if (existing.cLineno == null)
                                existing.cLineno = rec.cLineno;
                            if (!existing.cColor)
                                existing.cColor = rec.cColor;
                            if (!existing.cTime && rec.cTime)
                                existing.cTime = rec.cTime;
                            augmented++;
                        }
                        else {
                            res.data[1].push(rec);
                            added++;
                        }
                    }
                }
            }
            catch (e) {
                console.error('[Quick Mark] merge into res.data[1] failed:', e?.message || e);
            }
            const htmlType = body.cLayout === 'CONDENSED' ? '4UP' : 'FST';
            const isAnnotation = annotMode !== 'NONE';
            const html = this.htmlService.generateHtml(formData, lines, theme, htmlType, origin, isAnnotation, body, res.data, summaryOfAnnots, summaryOfHihglights, isSubmit);
            const htmlFile = `t_${formData.cTransid}_${index}.html`;
            const pdfFile = `t_${formData.cTransid}_${index}.pdf`;
            await this.transService.savehtmlToFile(html, htmlFile);
            const outputDir = (0, node_path_1.resolve)(this.config.get('ASSETS'), output);
            if (!fs.existsSync(outputDir))
                fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = (0, node_path_1.resolve)(outputDir, pdfFile);
            let cPgsize = 'A4';
            if (isSubmit) {
                cPgsize = (body.cPgsize ? body.cPgsize : 'A4');
            }
            const pdfGenerated = await this.generatePdf(`${this.config.get('REALTIME_PATH')}exports/${htmlFile}`, outputPath, cPgsize);
            if (!pdfGenerated) {
                fs.unlinkSync(`${this.config.get('REALTIME_PATH')}exports/${htmlFile}`);
                this.logError('PDF generation failed', formData.cTransid);
                return { msg: -1, value: 'PDF generation failed' };
            }
            if (body.bWordIndex && lines?.length && !isSubmit) {
                try {
                    const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'on', 'with', 'by', 'at', 'from', 'an', 'this', 'that', 'these', 'those', 'it', 'its', 'we', 'our', 'they', 'their']);
                    const helpingVerbs = new Set(['a', 'is', 'am', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'can', 'could']);
                    const wordMap = {};
                    for (const line of lines) {
                        if (!line.linetext)
                            continue;
                        const words = line.linetext.split(/\s+/).map((w) => w.toLowerCase().replace(/[^\w]/g, '').replace(/^\d+$/, '')).filter(Boolean);
                        for (const word of words) {
                            if (word.length < 2 || helpingVerbs.has(word) || stopWords.has(word) || !/^[a-zA-Z]/.test(word))
                                continue;
                            if (!wordMap[word])
                                wordMap[word] = [];
                            if (!wordMap[word].some(r => r.pageno === line.pageno && r.lineno === line.lineno)) {
                                wordMap[word].push({ pageno: line.pageno, lineno: line.lineno });
                            }
                        }
                    }
                    const wordMapSample = Object.entries(wordMap).slice(0, 3).map(([w, refs]) => `${w}: ${refs.slice(0, 2).map(r => `${r.pageno}:${r.lineno}`).join(', ')}`);
                    const wiHtml = this.wordIndexService.generateIndexHtml(wordMap, formData);
                    const wiHtmlFile = `t_${formData.cTransid}_${index}_wi.html`;
                    const wiPdfFile = `t_${formData.cTransid}_${index}_wi.pdf`;
                    await this.transService.savehtmlToFile(wiHtml, wiHtmlFile);
                    const wiPdfPath = (0, node_path_1.resolve)(outputDir, wiPdfFile);
                    const wiGenerated = await this.generatePdf(`${this.config.get('REALTIME_PATH')}exports/${wiHtmlFile}`, wiPdfPath, cPgsize);
                    if (wiGenerated) {
                        const mergedPdfFile = `t_${formData.cTransid}_${index}_merged.pdf`;
                        const mergedPdfPath = (0, node_path_1.resolve)(outputDir, mergedPdfFile);
                        const gs = this.config.get('gsV') || 'gs';
                        try {
                            await execAsync(`"${gs}" -dBATCH -dNOPAUSE -q -sDEVICE=pdfwrite -sOutputFile="${mergedPdfPath}" "${outputPath}" "${wiPdfPath}"`);
                            fs.copyFileSync(mergedPdfPath, outputPath);
                            fs.unlinkSync(mergedPdfPath);
                        }
                        catch (gsErr) {
                            this.log.error(`GhostScript merge error: ${gsErr?.message}`, this.logTag);
                        }
                        try {
                            fs.unlinkSync(wiPdfPath);
                        }
                        catch { }
                    }
                    try {
                        fs.unlinkSync(`${this.config.get('REALTIME_PATH')}exports/${wiHtmlFile}`);
                    }
                    catch { }
                }
                catch (wiErr) {
                    this.log.error(`Word index generation error: ${wiErr?.message}`, this.logTag);
                }
            }
            if (isSubmit) {
                const validation = await this.verifier.verifyFile(outputPath);
                const stats = await fs.promises.stat(outputPath);
                const fileMeta = {
                    nSesid: body.nSesid || body.nSessionid,
                    nCaseid: body.nCaseid,
                    nUserid,
                    cPath: `${output}/${pdfFile}`,
                    cName: `${formData.cCDay}.pdf`,
                    cPage: `1-${validation.totalpages}`,
                    cFilesize: stats.size,
                };
                const dbRes = await this.db.executeRef('transcript_insert_file', fileMeta, 'transcript');
                if (dbRes)
                    await this.copier.copyFile(fileMeta.cPath, dbRes.data[0][0].nBundledetailid);
                return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, data: dbRes };
            }
            else {
                return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, path: `${pdfFile}`, name: 'export.pdf' };
            }
        }
        else {
            return { msg: -1, value: 'Failed to handle realtime_filter_last_issue', error: res.error };
        }
    }
    async generatePdf(inputHtmlPath, outputPdfPath, cPgsize) {
        const htmlAbsolutePath = path.resolve(inputHtmlPath);
        const fileUrl = 'file:///' + htmlAbsolutePath.split(path.sep).join('/');
        if (!fs.existsSync(htmlAbsolutePath)) {
            this.log.error(`HTML file not found: ${htmlAbsolutePath}`, this.logTag);
            return false;
        }
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                protocolTimeout: 120000
            });
            const page = await browser.newPage();
            await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 60000 });
            const paperSizes = {
                A2: { w: 16.54, h: 23.39 },
                A3: { w: 11.69, h: 16.54 },
                A4: { w: 8.27, h: 11.69 },
                LETTER: { w: 8.5, h: 11 },
            };
            const pageFormat = (cPgsize || 'A4').toString().toUpperCase();
            const paper = paperSizes[pageFormat] || paperSizes.A4;
            const cdp = await page.target().createCDPSession();
            const { data } = await cdp.send('Page.printToPDF', {
                printBackground: true,
                paperWidth: paper.w,
                paperHeight: paper.h,
                marginTop: 0, marginBottom: 0, marginLeft: 0, marginRight: 0,
                generateTaggedPDF: true,
                generateDocumentOutline: true,
                preferCSSPageSize: true,
            });
            fs.writeFileSync(outputPdfPath, Buffer.from(data, 'base64'));
            await page.close();
            try {
                await this.fixPdfDestinations(outputPdfPath);
            }
            catch (e) {
                this.log.error(`fixPdfDestinations failed: ${e?.message || String(e)}`, this.logTag);
            }
            return true;
        }
        catch (err) {
            this.log.error(`PDF generation error: ${err?.message || String(err)}`, this.logTag);
            return false;
        }
        finally {
            if (browser) {
                browser.close().catch(() => { });
            }
        }
    }
    async fixPdfDestinations(pdfPath) {
        const bytes = fs.readFileSync(pdfPath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
        let fixed = 0;
        const normalizeDestArray = (arr) => {
            if (!arr || arr.size() < 2)
                return;
            const mode = arr.get(1);
            if (mode instanceof pdf_lib_1.PDFName && mode.asString() === '/XYZ') {
                while (arr.size() > 1)
                    arr.remove(1);
                arr.push(pdf_lib_1.PDFName.of('Fit'));
                fixed++;
            }
        };
        const catalog = pdfDoc.catalog;
        const dests = catalog.lookup(pdf_lib_1.PDFName.of('Dests'));
        if (dests instanceof pdf_lib_1.PDFDict) {
            for (const key of dests.keys()) {
                const val = dests.lookup(key);
                if (val instanceof pdf_lib_1.PDFArray)
                    normalizeDestArray(val);
            }
        }
        const names = catalog.lookup(pdf_lib_1.PDFName.of('Names'));
        if (names instanceof pdf_lib_1.PDFDict) {
            const destsTree = names.lookup(pdf_lib_1.PDFName.of('Dests'));
            const walkTree = (node) => {
                if (!(node instanceof pdf_lib_1.PDFDict))
                    return;
                const namesArr = node.lookup(pdf_lib_1.PDFName.of('Names'));
                if (namesArr instanceof pdf_lib_1.PDFArray) {
                    for (let i = 1; i < namesArr.size(); i += 2) {
                        const entry = namesArr.lookup(i);
                        if (entry instanceof pdf_lib_1.PDFArray) {
                            normalizeDestArray(entry);
                        }
                        else if (entry instanceof pdf_lib_1.PDFDict) {
                            const d = entry.lookup(pdf_lib_1.PDFName.of('D'));
                            if (d instanceof pdf_lib_1.PDFArray)
                                normalizeDestArray(d);
                        }
                    }
                }
                const kids = node.lookup(pdf_lib_1.PDFName.of('Kids'));
                if (kids instanceof pdf_lib_1.PDFArray) {
                    for (let i = 0; i < kids.size(); i++) {
                        walkTree(kids.lookup(i));
                    }
                }
            };
            walkTree(destsTree);
        }
        const outBytes = await pdfDoc.save();
        fs.writeFileSync(pdfPath, outBytes);
        this.log.info(`fixPdfDestinations: rewrote ${fixed} destination(s) to /Fit`, this.logTag);
    }
    emitMsg(value) {
        this.kafka.sendMessage('realtime-response', value);
    }
    logError(message, transid, error) {
        this.log.error(`${message}${error ? ` | ${error}` : ''}`, `${this.logTag}/${transid || 'unknown'}`);
        return { msg: -1, value: message, error: error || message };
    }
    updateCordinates(data, res, body) {
        try {
            const heighlightData = res;
            heighlightData.forEach(e => {
                const pgData = data;
                if (e.cordinates) {
                    let searchLine;
                    const length = e.cordinates.length;
                    let i = 0;
                    e.cordinates.forEach((c, index) => {
                        try {
                            i++;
                            const [hh, mm, ss] = c.t.split(':');
                            const timestamp = [
                                hh.padStart(2, '0'),
                                mm.padStart(2, '0'),
                                ss.padStart(2, '0')
                            ].join(':');
                            const lnInd = pgData.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == c?.identity) : body?.cTranscript == 'Y' ? a.lineno == c.l : true));
                            if (lnInd > -1) {
                                const line = pgData[lnInd].linetext || '';
                                let startIndex = 0, endIndex = 0;
                                if (index > 0 && (length - 1) > index) {
                                    startIndex = 0;
                                    endIndex = line.length;
                                }
                                else {
                                    searchLine = c.text || this.getLineText(e.cONote, index) || '';
                                    ({ startIndex, endIndex } = this.utilityService.findIndices(searchLine, line));
                                }
                                if (index == 0 && length > 1) {
                                    endIndex = line.length;
                                }
                                if ((length - 1) == index && length > 1) {
                                    startIndex = 0;
                                }
                                c.startIndex = startIndex;
                                c.endIndex = endIndex;
                                if (!c.text) {
                                    c.text = searchLine;
                                }
                            }
                            else {
                                c.startIndex = 0;
                                c.endIndex = 0;
                            }
                        }
                        catch (error) {
                            console.error('Error in updateCordinates:', error);
                        }
                    });
                }
            });
            return heighlightData;
        }
        catch (error) {
            console.error('Error in updateCordinates:', error);
            return res;
        }
    }
    getLineText(note, index) {
        try {
            note = note || '';
            note = this.replaceDoubleNewlines(note);
            return note.split('\n')[index];
        }
        catch (error) {
            return '';
        }
    }
    replaceDoubleNewlines(input) {
        return input.replace(/\n\n/g, '\n');
    }
    async embedImpactImages(summaryOfAnnots) {
        const impactIds = new Set();
        for (const group of summaryOfAnnots) {
            for (const annot of (group.data || [])) {
                for (const issue of (annot.issues || [])) {
                    if (issue.nImpactid)
                        impactIds.add(issue.nImpactid);
                }
            }
        }
        const impactImgMap = new Map();
        const angularAssetsBase = path.resolve('assets', 'icons', 'impact');
        for (const id of impactIds) {
            const localPath = path.join(angularAssetsBase, `${id}.png`);
            if (fs.existsSync(localPath)) {
                const b64 = `data:image/png;base64,${fs.readFileSync(localPath).toString('base64')}`;
                impactImgMap.set(id, b64);
            }
        }
        for (const group of summaryOfAnnots) {
            for (const annot of (group.data || [])) {
                for (const issue of (annot.issues || [])) {
                    if (issue.nImpactid && impactImgMap.has(issue.nImpactid)) {
                        issue.impactImgSrc = impactImgMap.get(issue.nImpactid);
                    }
                }
            }
        }
    }
    async getAnnotHighlightExport(query, origin) {
        const res = await this.db.executeRef('get_transcript_by_sesid', query, 'transcript');
        if (res.success) {
            try {
                if (res.data[0][0].msg == 1) {
                    query['cTransid'] = res.data[0][0].cTransid;
                    query['cProtocol'] = res.data[0][0].cProtocol || 'C';
                    const result = await this.getExportDataTranscript(query, origin);
                    return result;
                }
                else if (query.cTranscript != 'Y' || query.cIsDemo == 'Y') {
                    query['cProtocol'] = res.data[0][0].cProtocol || 'C';
                    query['cTransid'] = '39ce7608-e7ed-46e2-995c-bac91732e6fc';
                    const result = await this.getExportDataTranscript(query, origin);
                    return result;
                }
                else {
                    return res.data[0][0];
                }
            }
            catch (error) {
                return { msg: -1, value: 'Failed to export', error: error };
            }
        }
        else {
            return { msg: -1, value: 'Failed to export', error: res.error };
        }
    }
    async getExportDataTranscript(body, origin) {
        const { nSesid, cTransid, nMasterid, nCaseid } = body;
        const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: body.nCaseid, nSesid: body.nSesid });
        const formResult = await this.db.executeRef('get_transcript_detail', body, 'transcript');
        let formData = formResult.data[0][0];
        formData.cPath = formResult.data[0][0]?.nSesid ? `s_${formResult.data[0][0]?.nSesid}.json` : formData.cPath;
        let lines;
        let rawData;
        let data;
        const otherCaseData = caseData.data[0][0];
        body['nMarknavSesid'] = otherCaseData?.nSesid || body.nSesid || body.nSessionid || null;
        if (body.cTranscript == 'Y') {
            let pages = await this.transService.getTranscriptFiledata({ cPath: formData.cPath });
            lines = this.transformPagesToLines(pages);
        }
        else if (body.cIsDemo == 'Y') {
            body['otherCaseData'] = otherCaseData;
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');
            data = JSON.parse(rawData);
            lines = this.convertTranscript(data);
        }
        else {
            body['otherCaseData'] = otherCaseData;
            if (otherCaseData.cStatus == 'R') {
                const output = await this.syncFeedToOffline(otherCaseData.nSesid);
                lines = this.convertTranscript(output);
            }
            else {
                const inputDir = path.join('data', `dt_${body.nSessionid}`);
                const output = this.conversion.processDirectory(inputDir);
                lines = this.convertTranscript(output);
            }
        }
        const theme = formData.cThemeid ? await this.transService.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid }) : {};
        try {
            const output = `realtime-transcripts/exports/`;
            const detailRes = await this.generateTranscriptDetail(body, formData, lines, theme, nMasterid, nMasterid, origin, output, false);
            if (detailRes.msg === -1) {
                return { msg: -1, value: 'Export failed', };
            }
            else {
                return detailRes;
            }
        }
        catch (error) {
            return { msg: -1, value: `Error generating user transcripts: ${error?.message || String(error)}` };
        }
    }
    convertTranscript(pages) {
        if (!pages)
            return [];
        const result = [];
        pages.forEach(pageObj => {
            const pageNum = pageObj.page;
            pageObj.data.forEach(lineObj => {
                const [hh, mm, ss] = lineObj.time.split(':');
                const timestamp = [
                    hh.padStart(2, '0'),
                    mm.padStart(2, '0'),
                    ss.padStart(2, '0')
                ].join(':');
                const linetext = lineObj.lines.join(' ');
                result.push({
                    lineno: lineObj.lineIndex,
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid,
                });
            });
        });
        return result;
    }
    async syncFeedToOffline(nSesid) {
        const feedData = [];
        try {
            const sessionId = nSesid;
            try {
                const sessionData = await this.feedData.readSessionData(sessionId);
                if (!sessionData)
                    return feedData;
                const pages = Object.entries(sessionData).sort((b, a) => Number(a) - Number(b));
                if (!pages?.length)
                    return feedData;
                for (let x of pages) {
                    const pg = Number(x[0]);
                    const pageData = x[1] || [];
                    const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }));
                    feedData.push({ msg: pg, page: pg, data: frmtData });
                }
            }
            catch (error) {
                console.error('error - ', error);
            }
            return feedData.sort((a, b) => a.page - b.page);
        }
        catch (error) {
            console.error('error - ', error);
            return feedData;
        }
    }
    toTimestamp(hmsLike) {
        const parts = String(hmsLike ?? '').split(':');
        const [hh = '0', mm = '0', ss = '0'] = parts;
        const pad2 = v => String(v).padStart(2, '0');
        return [pad2(hh), pad2(mm), pad2(ss)].join(':');
    }
    joinLines(lines) {
        if (Array.isArray(lines)) {
            return lines.join(' ').replace(/\s+/g, ' ').trim();
        }
        return String(lines ?? '').replace(/\s+/g, ' ').trim();
    }
    transformPagesToLines(pages) {
        const result = [];
        (pages || []).forEach(pageObj => {
            const pageNum = pageObj.page;
            (pageObj.data || []).forEach((lineObj, index) => {
                const timestamp = this.toTimestamp(lineObj.time);
                const linetext = this.joinLines(lineObj.lines);
                result.push({
                    lineno: index + 1,
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid ?? null,
                });
            });
        });
        return result;
    }
};
exports.TranscriptpublishService = TranscriptpublishService;
exports.TranscriptpublishService = TranscriptpublishService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof transcript_html_service_1.TranscriptHtmlService !== "undefined" && transcript_html_service_1.TranscriptHtmlService) === "function" ? _d : Object, typeof (_e = typeof transcript_service_1.TranscriptService !== "undefined" && transcript_service_1.TranscriptService) === "function" ? _e : Object, typeof (_f = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _f : Object, typeof (_g = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _g : Object, typeof (_h = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _h : Object, typeof (_j = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _j : Object, typeof (_k = typeof conversion_js_service_1.ConversionJsService !== "undefined" && conversion_js_service_1.ConversionJsService) === "function" ? _k : Object, typeof (_l = typeof feed_data_service_1.FeedDataService !== "undefined" && feed_data_service_1.FeedDataService) === "function" ? _l : Object, typeof (_m = typeof generate_word_index_service_1.GenerateWordIndexService !== "undefined" && generate_word_index_service_1.GenerateWordIndexService) === "function" ? _m : Object, typeof (_o = typeof annot_transfer_service_1.AnnotTransferService !== "undefined" && annot_transfer_service_1.AnnotTransferService) === "function" ? _o : Object])
], TranscriptpublishService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.VerifypdfService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(35);
const config_1 = __webpack_require__(6);
const fs = __webpack_require__(23);
let VerifypdfService = class VerifypdfService {
    constructor(config) {
        this.config = config;
    }
    async verifyFile(filePath, isTakesize) {
        console.log('VERIFYING FILE...');
        const defaultResponse = {
            isValidate: false,
            totalpages: 0,
            totalsizeoffile: 0,
            pagerotation: 0,
            isLinerised: false,
        };
        try {
            const fileType = filePath.split('.').pop().toUpperCase();
            if (fileType !== 'PDF') {
                console.log('File is not a PDF');
                defaultResponse.totalsizeoffile = await this.getFileSize(filePath);
                return { ...defaultResponse, isValidate: true };
            }
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), [
                this.config.get('PY_VERIFY'),
                filePath,
                isTakesize ? true : false,
            ]);
            let dataBuffer = '';
            pythonProcess.stdout.on('data', (data) => {
                console.log('DATA:', data.toString());
                dataBuffer += data.toString();
            });
            pythonProcess.stderr.on('data', (data) => {
                console.log('ERROR:', data.toString());
                console.error('ERROR:', data.toString());
            });
            return new Promise((resolve, reject) => {
                pythonProcess.on('error', (err) => {
                    console.error('ERROR:', err);
                    reject(err);
                });
                pythonProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Python process exited with code ${code}`);
                        resolve(defaultResponse);
                        return;
                    }
                    const response = { ...defaultResponse };
                    if (dataBuffer.includes('The PDF is not corrupted.')) {
                        response.isValidate = true;
                        const lines = dataBuffer.split('\n');
                        for (const line of lines) {
                            if (line.includes('TotalPages:')) {
                                response.totalpages = parseInt(line.replace('TotalPages:', ''));
                            }
                            else if (line.includes('FileSize:')) {
                                response.totalsizeoffile = parseInt(line.replace('FileSize:', ''));
                            }
                            else if (line.includes('PDFRotation:')) {
                                response.pagerotation = parseInt(line.replace('PDFRotation:', ''));
                            }
                        }
                    }
                    if (dataBuffer.includes('The PDF is linearized (Fast Web View is enabled).')) {
                        response.isLinerised = true;
                    }
                    resolve(response);
                });
            });
        }
        catch (error) {
            console.error('ERROR:', error);
            return defaultResponse;
        }
    }
    getFileSize(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                return stats.size;
            }
            else {
                return null;
            }
        }
        catch (error) {
            console.error('Error getting file size:', error.message);
            return null;
        }
    }
};
exports.VerifypdfService = VerifypdfService;
exports.VerifypdfService = VerifypdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], VerifypdfService);


/***/ }),
/* 87 */
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
exports.filecopyService = void 0;
const common_1 = __webpack_require__(3);
const stream_1 = __webpack_require__(88);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(35);
const util_1 = __webpack_require__(25);
const log_service_1 = __webpack_require__(41);
const fsp = __webpack_require__(89);
const db_service_1 = __webpack_require__(8);
const file_version_service_1 = __webpack_require__(90);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
let filecopyService = class filecopyService {
    constructor(config, logService, db, fileVersion) {
        this.config = config;
        this.logService = logService;
        this.db = db;
        this.fileVersion = fileVersion;
        this.ASSETS_PATH = this.config.get('S3_SYNC_PATH');
        this.S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.config.get('S3_EXC_PATH');
        this.logApp = 'realtime/copyfiles';
    }
    async copyFile(oldPath, nBundledetailid) {
        try {
            console.log('copyFile called with oldPath:', oldPath, 'nBundledetailid:', nBundledetailid);
            const copyCommand = `${this.S3_EXC_PATH} sync ${this.ASSETS_PATH}${oldPath} ${this.S3_BUCKET_PATH}${oldPath}`;
            console.log(`Executing: ${copyCommand}`);
            await execPromise(copyCommand);
            console.log(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`);
            this.logService.info(`File copied from ${this.ASSETS_PATH}${oldPath}  to ${this.S3_BUCKET_PATH}/${oldPath}`, this.logApp);
            console.log(`update version for ${nBundledetailid}`);
            await this.removeAllOldversion(nBundledetailid, `${oldPath}`);
            await this.updateFileVersion(nBundledetailid, `${oldPath}`);
            try {
                await fsp.unlink(this.ASSETS_PATH + oldPath);
                this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.logService.info(`File not found, skipping deletion: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                }
                else {
                    this.logService.error(`Error deleting file: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                }
            }
        }
        catch (error) {
            console.error('Error during file move:', error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, this.logApp);
        }
        return true;
    }
    async removeAllOldversion(nBundledetailid, s3Path) {
        try {
            console.log('Fetching veriosn', s3Path, nBundledetailid);
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp);
                return;
            }
            await this.fileVersion.removeOldVersion(s3Path);
            return;
        }
        catch (error) {
        }
    }
    async updateFileVersion(nBundledetailid, s3Path) {
        try {
            console.log('Fetching veriosn', s3Path, nBundledetailid);
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp);
                return;
            }
            const version = await this.fileVersion.getFirstVersion(s3Path);
            if (!version) {
                this.logService.error('nBundledetailid version not found', this.logApp);
                return;
            }
            let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
            if (res.success) {
            }
            else {
                this.logService.error(res.error, this.logApp);
            }
        }
        catch (error) {
        }
    }
};
exports.filecopyService = filecopyService;
exports.filecopyService = filecopyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _c : Object, typeof (_d = typeof file_version_service_1.FileVersionService !== "undefined" && file_version_service_1.FileVersionService) === "function" ? _d : Object])
], filecopyService);


/***/ }),
/* 88 */
/***/ ((module) => {

module.exports = require("stream");

/***/ }),
/* 89 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 90 */
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
exports.FileVersionService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(35);
const util_1 = __webpack_require__(25);
const log_service_1 = __webpack_require__(41);
const config_1 = __webpack_require__(6);
const client_s3_1 = __webpack_require__(91);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
let FileVersionService = class FileVersionService {
    constructor(logService, config) {
        this.logService = logService;
        this.config = config;
        this.logApp = 'upload/versioncheck';
        this.s3_SPACES_ENDPOINT = this.config.get('DO_SPACES_ENDPOINT');
        this.DO_SPACES_BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');
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
    async removeOldVersion(s3Path) {
        try {
            console.log('Fetching veriosn', s3Path);
            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, this.logApp);
                return;
            }
            const versions = await this.getAllVersion(s3Path);
            if (!versions || !versions.length) {
                this.logService.error(`${s3Path} version not found`, this.logApp);
                return;
            }
            return await new Promise(async (resolve, reject) => {
                versions.forEach((element, index) => {
                    this.deleteSpecificVersion(element, s3Path);
                    if (versions.length == (index + 1)) {
                        resolve();
                    }
                });
            });
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
                const sortedVersions = response.Versions.sort((a, b) => new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime());
                const versions = sortedVersions.filter(e => !e.IsLatest).map(e => e.VersionId);
                console.log(`🆔 File Version ID: ${versions}`);
                this.logService.info(`File Version ID: ${versions}`, this.logApp);
                return versions;
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
exports.FileVersionService = FileVersionService;
exports.FileVersionService = FileVersionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], FileVersionService);


/***/ }),
/* 91 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 92 */
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),
/* 93 */
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),
/* 94 */
/***/ ((module) => {

module.exports = require("node:child_process");

/***/ }),
/* 95 */
/***/ ((module) => {

module.exports = require("pdf-lib");

/***/ }),
/* 96 */
/***/ ((module) => {

module.exports = require("node:util");

/***/ }),
/* 97 */
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
const jwt = __webpack_require__(98);
const redis_db_service_1 = __webpack_require__(38);
const config_1 = __webpack_require__(6);
const db_service_1 = __webpack_require__(8);
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
/* 98 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

/***/ }),
/* 99 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const fact_service_1 = __webpack_require__(100);
const fact_interface_1 = __webpack_require__(101);
const issue_interface_1 = __webpack_require__(62);
let FactController = class FactController {
    constructor(factservice) {
        this.factservice = factservice;
    }
    async getFactDetail(query) {
        return this.factservice.getFactDetailById(query);
    }
    async quickfactupdate(body) {
        return this.factservice.quickfactUpdate(body);
    }
    async getFactContact(query) {
        return this.factservice.getFactcontact(query);
    }
    async getFactshared(query) {
        return this.factservice.getFactshared(query);
    }
    async insertQuickfact(body) {
        try {
            const res = await this.factservice.insertQuickFact(body);
            if (res && res.nFSid) {
                body['nFSid'] = res.nFSid;
                await this.factservice.insertFactDetail(body);
                await this.factservice.insertFactissues(body);
                await this.factservice.insertFactcontact(body);
                await this.factservice.insertFactteam(body);
                await this.factservice.markAsTranscriptIfPublished(body.nSesid, res.nFSid);
                return {
                    msg: 1,
                    value: 'Quick fact inserted successfully',
                    nFSid: res['nFSid'],
                    color: res['color'],
                };
            }
            else {
                return {
                    msg: -1,
                    value: 'Quick fact not inserted successfully',
                    error: res.error,
                };
            }
        }
        catch (error) {
            return {
                msg: -1,
                value: 'Quick fact not inserted successfully',
                error: error,
            };
        }
    }
    async insertfact(body) {
        try {
            const res = await this.factservice.insertFact(body);
            if (res && res.nFSid) {
                body['nFSid'] = res.nFSid;
                await this.factservice.insertFactDetail(body);
                await this.factservice.insertFactlink(body);
                await this.factservice.insertFactissues(body);
                await this.factservice.insertFactcontact(body);
                await this.factservice.insertFacttask(body);
                await this.factservice.insertFactteam(body);
                await this.factservice.markAsTranscriptIfPublished(body.nSesid, res.nFSid);
                return {
                    msg: 1,
                    value: 'Fact inserted successfully',
                    nFSid: res['nFSid'],
                    color: res['color'],
                };
            }
            else {
                return {
                    msg: -1,
                    value: 'Fact not inserted successfully',
                    error: res.error,
                };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact not inserted successfully', error: error };
        }
    }
    async getFacttask(query) {
        try {
            const res = await this.factservice.getFacttask(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async insertHighlights(body) {
        return this.factservice.insertHighlights(body, 'I');
    }
    async deleteHighlights(body) {
        return this.factservice.deleteHighlights(body, 'D');
    }
};
exports.FactController = FactController;
__decorate([
    (0, common_1.Get)('detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof fact_interface_1.FactDetailReq !== "undefined" && fact_interface_1.FactDetailReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], FactController.prototype, "getFactDetail", null);
__decorate([
    (0, common_1.Post)('quickfactupdate'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof fact_interface_1.quickfactUpdate !== "undefined" && fact_interface_1.quickfactUpdate) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], FactController.prototype, "quickfactupdate", null);
__decorate([
    (0, common_1.Get)('factcontact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], FactController.prototype, "getFactContact", null);
__decorate([
    (0, common_1.Get)('factshared'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], FactController.prototype, "getFactshared", null);
__decorate([
    (0, common_1.Post)('insertquickfact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof fact_interface_1.InsertQuickFact !== "undefined" && fact_interface_1.InsertQuickFact) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], FactController.prototype, "insertQuickfact", null);
__decorate([
    (0, common_1.Post)('insertfact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof fact_interface_1.InsertFact !== "undefined" && fact_interface_1.InsertFact) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], FactController.prototype, "insertfact", null);
__decorate([
    (0, common_1.Get)('facttask'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], FactController.prototype, "getFacttask", null);
__decorate([
    (0, common_1.Post)('insertHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof issue_interface_1.InsertHighlightsRequestBody !== "undefined" && issue_interface_1.InsertHighlightsRequestBody) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], FactController.prototype, "insertHighlights", null);
__decorate([
    (0, common_1.Post)('deleteHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof issue_interface_1.deleteHighlightsRequestBody !== "undefined" && issue_interface_1.deleteHighlightsRequestBody) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], FactController.prototype, "deleteHighlights", null);
exports.FactController = FactController = __decorate([
    (0, swagger_1.ApiTags)('fact'),
    (0, common_1.Controller)('fact'),
    __metadata("design:paramtypes", [typeof (_a = typeof fact_service_1.FactService !== "undefined" && fact_service_1.FactService) === "function" ? _a : Object])
], FactController);


/***/ }),
/* 100 */
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
exports.FactService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(28);
let FactService = class FactService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.realTimeSchema = 'realtime';
    }
    async markAsTranscriptIfPublished(nSesid, nFSid) {
        if (!nSesid || !nFSid)
            return;
        try {
            await this.db.rowQuery(`UPDATE "FactDetail" fd
            SET "jTCordinates"    = fd."jCordinates",
                "nTPage"          = fd."nPage",
                "nTLine"          = fd."nLine",
                "cTransferStatus" = 'T'
          WHERE fd."nFSid" = $1
            AND fd."jTCordinates" IS NULL
            AND EXISTS (
              SELECT 1 FROM "RSessionMaster" s
               WHERE s."nSesid" = $2
                 AND (
                   s."cStatus" = 'P'
                   OR (s."isTranscript" = true AND s."isUploaded" = true)
                 )
            )`, [nFSid, nSesid]);
        }
        catch (err) {
            console.error('[fact] markAsTranscriptIfPublished error:', err);
        }
    }
    async getFactDetailById(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('fact_get_detail_single', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async quickfactUpdate(body) {
        try {
            const res = await this.db.executeRef('fact_quick_update', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Update failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Update failed', error: error };
        }
    }
    async getFactcontact(query) {
        try {
            const res = await this.db.executeRef('fact_get_contact', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
    async getFactshared(query) {
        try {
            const res = await this.db.executeRef('fact_get_shared', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
    async insertQuickFact(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Fact insert  failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact insert  failed', error: error };
        }
    }
    async insertFactDetail(body) {
        try {
            const res = await this.db.executeRef('fact_insert_detail', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return {
                    msg: -1,
                    value: 'Fact detail insert failed ',
                    error: res.error,
                };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact detail insert failed ', error: error };
        }
    }
    async insertFactissues(body) {
        try {
            const res = await this.db.executeRef('fact_insert_issues', body, this.realTimeSchema);
            if (res.success) {
                return true;
            }
            else {
                return {
                    msg: -1,
                    value: 'Fact issues insert failed ',
                    error: res.error,
                };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact issues insert failed ', error: error };
        }
    }
    async insertFactcontact(body) {
        try {
            const res = await this.db.executeRef('fact_insert_contact', body, this.realTimeSchema);
            if (res.success) {
                return true;
            }
            else {
                return {
                    msg: -1,
                    value: 'Fact contact insert failed ',
                    error: res.error,
                };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact contact insert failed ', error: error };
        }
    }
    async insertFact(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body, this.realTimeSchema);
            if (res.success) {
                const fact = res.data[0][0];
                return fact;
            }
            else {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async insertFactlink(body) {
        try {
            const res = await this.db.executeRef('fact_insert_links', body, this.realTimeSchema);
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact link insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact link insert failed ', error: error };
        }
    }
    async insertFacttask(body) {
        try {
            const res = await this.db.executeRef('fact_insert_task', body, this.realTimeSchema);
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact task insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact task insert failed ', error: error };
        }
    }
    async insertFactteam(body) {
        try {
            debugger;
            const res = await this.db.executeRef('fact_insert_team', body, this.realTimeSchema);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]['jNotify'] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) { }
                return true;
            }
            else {
                return { msg: -1, value: 'Fact team insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact team insert failed ', error: error };
        }
    }
    async getFacttask(query) {
        try {
            query['ref'] = 3;
            const res = await this.db.executeRef('fact_get_task', query);
            if (res.success) {
                return res.data;
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
    async insertHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('qmark_handler', parameter, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue highlights',
                error: res.error,
            };
        }
    }
    async deleteHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('qmark_handler', parameter, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return {
                msg: -1,
                value: 'Failed to handle issue highlights',
                error: res.error,
            };
        }
    }
};
exports.FactService = FactService;
exports.FactService = FactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], FactService);


/***/ }),
/* 101 */
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
exports.InsertFactGlobalV2 = exports.UserPermission = exports.UpdatePermissionsRequestBody = exports.unshareDTO = exports.saveFactSheet = exports.fectsheetDetailReq = exports.InsertFact = exports.InsertQuickFact = exports.factDetailSingle = exports.quickfactUpdate = exports.jRects = exports.jCoordinateItemAn = exports.FactDetailReq = void 0;
const swagger_1 = __webpack_require__(11);
const class_validator_1 = __webpack_require__(50);
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
const class_transformer_1 = __webpack_require__(49);
class jCordinateItem {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '',
        description: ' item',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '13:39:25:02',
        description: 'Timestamp in HH:MM:SS:FF format',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "t", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 7,
        description: 'Line number or line identifier',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "l", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 42,
        description: 'Page number or page identifier',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "p", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 22,
        description: 'Original page number or offset',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "oP", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Original line number or offset',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "oL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '374926425208601',
        description: 'Unique identifier for the annotation item',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value != null ? String(value) : value),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "identity", void 0);
class FactDetailReq {
}
exports.FactDetailReq = FactDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Fact ID (nFSid)',
        required: true,
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactDetailReq.prototype, "nFSid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactDetailReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactDetailReq.prototype, "bIsTranscipt", void 0);
class jCoordinateItemAn {
}
exports.jCoordinateItemAn = jCoordinateItemAn;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'uuid as a  strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCoordinateItemAn.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Type as a string', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCoordinateItemAn.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [[12, 34], [12, 36]], description: 'array of [x, y] pen point pairs' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], jCoordinateItemAn.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number or page identifier' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCoordinateItemAn.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Width of the annotation' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], jCoordinateItemAn.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jRects),
    __metadata("design:type", Array)
], jCoordinateItemAn.prototype, "rects", void 0);
class jRects {
}
exports.jRects = jRects;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 42,
        description: 'Page number or page identifier'
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jRects.prototype, "x", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 42,
        description: 'Page number or page identifier'
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jRects.prototype, "y", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 22,
        description: 'Original page number or offset'
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jRects.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Original line number or offset'
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jRects.prototype, "width", void 0);
class quickfactUpdate {
}
exports.quickfactUpdate = quickfactUpdate;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nFSid must be a UUID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-string',
        description: 'Colorid must be a UUID',
        required: false,
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["",""]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "jTexts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[],[]]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "jIssue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of contact IDs',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Is not edited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "cIsNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], quickfactUpdate.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], quickfactUpdate.prototype, "nLine", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "nMasterid", void 0);
class factDetailSingle {
}
exports.factDetailSingle = factDetailSingle;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nFSid must be a UUID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factDetailSingle.prototype, "nFSid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factDetailSingle.prototype, "nMasterid", void 0);
class InsertQuickFact {
}
exports.InsertQuickFact = InsertQuickFact;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Unique identifier for the database entry',
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Unique identifier for the database entry',
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [jCordinateItem],
        description: 'Array of annotation objects',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCordinateItem),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InsertQuickFact.prototype, "jCordinates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '["example1", "example2"]',
        description: 'Array of strings',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '["example1", "example2"]',
        description: 'Array of strings',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[[1, 2, 3], [1, 4, 3]]',
        description: 'Array of arrays of numbers',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of contact IDs',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Is not edited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "cIsNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Unique identifier for the database entry',
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'I',
        description: 'fact from, only I or RT are allowed',
    }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "cFFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertQuickFact.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertQuickFact.prototype, "nLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'fact type, only S or M are allowed' }),
    (0, class_validator_1.IsIn)(['M', 'S']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'JSON of strings' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jLinktype", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'isHighlighted' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InsertQuickFact.prototype, "bIsHighlighted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of team IDs',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jUsers", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nMasterid", void 0);
class InsertFact {
}
exports.InsertFact = InsertFact;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-string',
        description: 'Unique identifier for the database entry',
        required: false,
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nQFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nSesid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nBDid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '["example1", "example2"]',
        description: 'Array of strings',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [jCordinateItem],
        description: 'Array of annotation objects',
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCordinateItem),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InsertFact.prototype, "jCordinates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'File type', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFact.prototype, "nFt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'State number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFact.prototype, "nSt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[[22, {}, [{}]]]',
        description: 'Array of arrays containing mixed types',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jFl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-string',
        description: 'Color id',
        required: false,
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[[1, 2, 3], [1, 4, 3]]',
        description: 'Array of arrays of numbers',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of contact IDs',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of task IDs',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[1, 2, 3]',
        description: 'Array of team IDs',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Unique identifier for the database entry',
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'I',
        description: 'fact from, only I or RT are allowed',
    }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertFact.prototype, "cFFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[{}]',
        description: 'Array of date objects',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '["example1", "example2"]',
        description: 'Array of strings',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertFact.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertFact.prototype, "nLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'fact type, only S or M are allowed' }),
    (0, class_validator_1.IsIn)(['M', 'S']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFact.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'JSON of strings' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jLinktype", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'isHighlighted' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InsertFact.prototype, "bIsHighlighted", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nMasterid", void 0);
class fectsheetDetailReq {
}
exports.fectsheetDetailReq = fectsheetDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nFSid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fectsheetDetailReq.prototype, "nFSid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fectsheetDetailReq.prototype, "nMasterid", void 0);
class saveFactSheet {
}
exports.saveFactSheet = saveFactSheet;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nFSid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nSesid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Unique identifier for the database entry',
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '["example1", "example2"]',
        description: 'Array of strings',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'File type', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], saveFactSheet.prototype, "nFt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'State number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], saveFactSheet.prototype, "nSt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '',
        description: 'Array of arrays containing mixed types',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jFl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'uuid-string',
        description: 'Color id',
        required: false,
    }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '',
        description: 'Array of contact IDs',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '',
        description: 'Array of task IDs',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '',
        description: 'Array of team IDs',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '[{}]',
        description: 'Array of date objects',
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "jDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'isUpdated' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], saveFactSheet.prototype, "bIsUserUpdated", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], saveFactSheet.prototype, "nMasterid", void 0);
class unshareDTO {
}
exports.unshareDTO = unshareDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'nFSid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unshareDTO.prototype, "nFSid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unshareDTO.prototype, "nMasterid", void 0);
class UpdatePermissionsRequestBody {
}
exports.UpdatePermissionsRequestBody = UpdatePermissionsRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Fact  ID',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePermissionsRequestBody.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'grantedusers' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UserPermission),
    __metadata("design:type", Array)
], UpdatePermissionsRequestBody.prototype, "selectedUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'revokes' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UserPermission),
    __metadata("design:type", Array)
], UpdatePermissionsRequestBody.prototype, "revokes", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UpdatePermissionsRequestBody.prototype, "nMasterid", void 0);
class UserPermission {
}
exports.UserPermission = UserPermission;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'uuid-string', description: 'User ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserPermission.prototype, "nUserid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'Can edit' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UserPermission.prototype, "canEdit", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'Can reshare' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UserPermission.prototype, "canReshare", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({ example: true, description: 'Can comment' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UserPermission.prototype, "canComment", void 0);
class InsertFactGlobalV2 {
}
exports.InsertFactGlobalV2 = InsertFactGlobalV2;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nBDid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [jCoordinateItemAn], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCoordinateItemAn),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InsertFactGlobalV2.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'File type', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactGlobalV2.prototype, "nFt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'State number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactGlobalV2.prototype, "nSt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jFl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of task IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of team IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'fact from, only I or RT are allowed' }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "cFFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}]', description: 'Array of date objects', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertFactGlobalV2.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertFactGlobalV2.prototype, "nLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'fact type, only S or M are allowed' }),
    (0, class_validator_1.IsIn)(['M', 'S']),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'JSON of strings' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "jLinktype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactGlobalV2.prototype, "nMasterid", void 0);


/***/ }),
/* 102 */
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
exports.DoclinkController = void 0;
const common_1 = __webpack_require__(3);
const doclink_service_1 = __webpack_require__(103);
const swagger_1 = __webpack_require__(11);
const doc_interface_1 = __webpack_require__(104);
let DoclinkController = class DoclinkController {
    constructor(doclinkserivce) {
        this.doclinkserivce = doclinkserivce;
    }
    async insertDoc(body) {
        let res = await this.doclinkserivce.insertDoc(body);
        if (res && res.nDocid) {
            return {
                msg: 1,
                value: 'Doclink inserted successfully',
                nDocid: res["nDocid"]
            };
        }
        else {
            return {
                msg: -1,
                value: 'Doclink not inserted successfully. Docid not found.',
                error: res
            };
        }
    }
    async factdelete(body) {
        try {
            const res = await this.doclinkserivce.docDelete(body);
            return res;
        }
        catch (error) {
            return {
                msg: 1,
                value: 'Doclink Delete Failed',
                error: error
            };
        }
    }
    async docDetail(query) {
        try {
            const res = await this.doclinkserivce.docDetail(query);
            return res;
        }
        catch (error) {
            return {
                msg: 1,
                value: 'Fetch Failed',
                error: error
            };
        }
    }
    async getDocShared(query) {
        try {
            const res = await this.doclinkserivce.getDocShared(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
};
exports.DoclinkController = DoclinkController;
__decorate([
    (0, common_1.Post)('insertdoc'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof doc_interface_1.InsertDoc !== "undefined" && doc_interface_1.InsertDoc) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], DoclinkController.prototype, "insertDoc", null);
__decorate([
    (0, common_1.Post)('docdelete'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof doc_interface_1.docID !== "undefined" && doc_interface_1.docID) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], DoclinkController.prototype, "factdelete", null);
__decorate([
    (0, common_1.Get)('docdetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof doc_interface_1.docIDmulti !== "undefined" && doc_interface_1.docIDmulti) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], DoclinkController.prototype, "docDetail", null);
__decorate([
    (0, common_1.Get)('docshared'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof doc_interface_1.docID !== "undefined" && doc_interface_1.docID) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], DoclinkController.prototype, "getDocShared", null);
exports.DoclinkController = DoclinkController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('doclink'),
    (0, common_1.Controller)('doclink'),
    __metadata("design:paramtypes", [typeof (_a = typeof doclink_service_1.DoclinkService !== "undefined" && doclink_service_1.DoclinkService) === "function" ? _a : Object])
], DoclinkController);


/***/ }),
/* 103 */
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
exports.DoclinkService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(28);
let DoclinkService = class DoclinkService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.realTimeSchema = 'realtime';
    }
    async insertDoc(body) {
        let res = await this.db.executeRef('doc_insert', body, this.realTimeSchema);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]['jNotify'] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) { }
            try {
                await this.markAsTranscriptIfPublished(body.nSesid, res.data[0][0].nDocid);
                return {
                    msg: 1,
                    value: 'Doc inserted successfully',
                    nDocid: res.data[0][0].nDocid,
                };
            }
            catch (error) { }
        }
        else {
            return { msg: -1, value: 'Doc insert failed', error: res.error };
        }
    }
    async markAsTranscriptIfPublished(nSesid, nDocid) {
        if (!nSesid || !nDocid)
            return;
        try {
            await this.db.rowQuery(`UPDATE "DocDetail" dd
            SET "jTCordinates"    = dd."jCordinates",
                "nTPage"          = dd."nPage",
                "nTLine"          = dd."nLine",
                "cTransferStatus" = 'T'
          WHERE dd."nDocid" = $1
            AND dd."jTCordinates" IS NULL
            AND EXISTS (
              SELECT 1 FROM "RSessionMaster" s
              JOIN "DocMaster" m ON m."nSesid" = s."nSesid"
              WHERE m."nDocid" = $1
                AND s."nSesid" = $2
                AND (
                  s."cStatus" = 'P'
                  OR (s."isTranscript" = true AND s."isUploaded" = true)
                )
            )`, [nDocid, nSesid]);
        }
        catch (err) {
            console.error('[doclink] markAsTranscriptIfPublished error:', err);
        }
    }
    async docDelete(body) {
        try {
            const res = await this.db.executeRef('doc_delete', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Delete failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Delete failed', error: error };
        }
    }
    async docDetail(query) {
        try {
            query['ref'] = 3;
            const res = await this.db.executeRef('doc_detail', query, this.realTimeSchema);
            if (res.success) {
                return res.data;
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
    async getDocShared(query) {
        try {
            const res = await this.db.executeRef('doc_get_shared', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
};
exports.DoclinkService = DoclinkService;
exports.DoclinkService = DoclinkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], DoclinkService);


/***/ }),
/* 104 */
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
exports.docIDmulti = exports.docID = exports.resInsertDoc = exports.InsertDoc = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
const fact_interface_1 = __webpack_require__(101);
class jCordinateItem {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "", description: ' item'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "text", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "13:39:25:02", description: 'Timestamp in HH:MM:SS:FF format' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "t", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 7,
        description: 'Line number or line identifier'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "l", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 42,
        description: 'Page number or page identifier'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "p", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 22,
        description: 'Original page number or offset'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "oP", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 1,
        description: 'Original line number or offset'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCordinateItem.prototype, "oL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "374926425208601",
        description: 'Unique identifier for the annotation item'
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value != null ? String(value) : value),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCordinateItem.prototype, "identity", void 0);
class InsertDoc {
}
exports.InsertDoc = InsertDoc;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [jCordinateItem], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCordinateItem),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InsertDoc.prototype, "jCordinates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [fact_interface_1.jCoordinateItemAn], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => fact_interface_1.jCoordinateItemAn),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], InsertDoc.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "jDl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["",""]', description: 'Array of arrays containing mixed types' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of team IDs' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'Doc from, only I or RT are allowed' }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertDoc.prototype, "cDFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertDoc.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], InsertDoc.prototype, "nLine", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'JSON of strings' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "jLT", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "nMasterid", void 0);
class resInsertDoc {
}
exports.resInsertDoc = resInsertDoc;
class docID {
}
exports.docID = docID;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nDocid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], docID.prototype, "nDocid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], docID.prototype, "nMasterid", void 0);
class docIDmulti {
}
exports.docIDmulti = docIDmulti;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "[\"uuid-1\", \"uuid-2\", \"uuid-3\"]", description: 'Array of document UUIDs' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], docIDmulti.prototype, "jDocids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], docIDmulti.prototype, "nMasterid", void 0);


/***/ }),
/* 105 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactsheetController = void 0;
const common_1 = __webpack_require__(3);
const fact_interface_1 = __webpack_require__(101);
const factsheet_service_1 = __webpack_require__(106);
let FactsheetController = class FactsheetController {
    constructor(factsheetService) {
        this.factsheetService = factsheetService;
    }
    async getFactDetail(query) {
        return this.factsheetService.getFactDetail(query);
    }
    async getpermission(query) {
        return this.factsheetService.fetchPermission(query.nMasterid, query.nFSid);
    }
    async getFactShared(query) {
        return this.factsheetService.getFactShared(query);
    }
    async getFactIssues(query) {
        return this.factsheetService.getFactIssues(query);
    }
    async getFactContacts(query) {
        return this.factsheetService.getFactContacts(query);
    }
    async getFactTasks(query) {
        return this.factsheetService.getFactTasks(query);
    }
    async getFactLinks(query) {
        return this.factsheetService.getFactLinks(query);
    }
    async submit(body) {
        return this.factsheetService.submit(body);
    }
    async unshare(body) {
        return this.factsheetService.unshare(body);
    }
    async delete(body) {
        return this.factsheetService.delete(body);
    }
    async getFactAnnotation(query) {
        return this.factsheetService.getFactAnnotation(query);
    }
};
exports.FactsheetController = FactsheetController;
__decorate([
    (0, common_1.Get)('detail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], FactsheetController.prototype, "getFactDetail", null);
__decorate([
    (0, common_1.Get)('permissions'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], FactsheetController.prototype, "getpermission", null);
__decorate([
    (0, common_1.Get)('shared'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], FactsheetController.prototype, "getFactShared", null);
__decorate([
    (0, common_1.Get)('issues'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], FactsheetController.prototype, "getFactIssues", null);
__decorate([
    (0, common_1.Get)('contacts'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], FactsheetController.prototype, "getFactContacts", null);
__decorate([
    (0, common_1.Get)('tasks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], FactsheetController.prototype, "getFactTasks", null);
__decorate([
    (0, common_1.Get)('links'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], FactsheetController.prototype, "getFactLinks", null);
__decorate([
    (0, common_1.Post)('save'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof fact_interface_1.saveFactSheet !== "undefined" && fact_interface_1.saveFactSheet) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], FactsheetController.prototype, "submit", null);
__decorate([
    (0, common_1.Post)('unshare'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof fact_interface_1.unshareDTO !== "undefined" && fact_interface_1.unshareDTO) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], FactsheetController.prototype, "unshare", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof fact_interface_1.unshareDTO !== "undefined" && fact_interface_1.unshareDTO) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], FactsheetController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('factannotation'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof fact_interface_1.fectsheetDetailReq !== "undefined" && fact_interface_1.fectsheetDetailReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], FactsheetController.prototype, "getFactAnnotation", null);
exports.FactsheetController = FactsheetController = __decorate([
    (0, common_1.Controller)('factsheet'),
    __metadata("design:paramtypes", [typeof (_a = typeof factsheet_service_1.FactsheetService !== "undefined" && factsheet_service_1.FactsheetService) === "function" ? _a : Object])
], FactsheetController);


/***/ }),
/* 106 */
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
var FactsheetService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactsheetService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(8);
const utility_service_1 = __webpack_require__(28);
let FactsheetService = FactsheetService_1 = class FactsheetService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.realTimeSchema = 'realtime';
        this.logger = new common_1.Logger(FactsheetService_1.name);
    }
    async getFactDetail(query) {
        try {
            const res = await this.db.executeRef('factsheet_detail', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Fetch failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fetch failed', error: error };
        }
    }
    async fetchPermission(nMasterid, nFSid) {
        try {
            const res = await this.db.executeRef('fact_permissions', { nUserid: nMasterid, nFSid });
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, error: res.error };
            }
        }
        catch (error) {
            this.logger.error(error);
        }
        return {};
    }
    async getFactIssues(query) {
        try {
            const res = await this.db.executeRef('factsheet_issues', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [];
        }
    }
    async getFactShared(query) {
        try {
            try {
                const res = await this.db.executeRef('factsheet_shared', query, this.realTimeSchema);
                if (res.success) {
                    return res.data[0];
                }
                else {
                    return { msg: -1, value: 'Fetch failed', error: res.error };
                }
            }
            catch (error) {
                return { msg: -1, value: 'Fetch failed', error: error };
            }
        }
        catch (error) {
            return [];
        }
    }
    async getFactContacts(query) {
        try {
            const res = await this.db.executeRef('factsheet_contacts', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [];
        }
    }
    async getFactTasks(query) {
        try {
            query["ref"] = 3;
            const res = await this.db.executeRef('factsheet_tasks', query, this.realTimeSchema);
            if (res.success) {
                return res.data;
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [];
        }
    }
    async getFactLinks(query) {
        try {
            const res = await this.db.executeRef('factsheet_links', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                return [];
            }
        }
        catch (error) {
            return [];
        }
    }
    async submit(body) {
        try {
            debugger;
            const permissionsObj = await this.fetchPermission(body.nMasterid, body.nFSid);
            if (!permissionsObj?.bCanEdit)
                return { msg: -1, value: 'You are not authorized to edit this fact' };
            const res = await this.db.executeRef('factsheet_submit', body, this.realTimeSchema);
            if (res.success) {
                if (body.bIsUserUpdated && permissionsObj?.bCanReshare)
                    this.updateSharePermissions(body);
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }
    async unshare(body) {
        try {
            const res = await this.db.executeRef('factsheet_unshare_withme', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }
    async delete(body) {
        try {
            const res = await this.db.executeRef('factsheet_delete', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to save', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed to save', error: error?.message };
        }
    }
    async updateSharePermissions(body) {
        try {
            const res = await this.db.executeRef('fact_insert_team', body, this.realTimeSchema);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]['jNotify'] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) { }
            }
        }
        catch (error) {
        }
    }
    async getFactAnnotation(query) {
        try {
            try {
                const res = await this.db.executeRef('getfact_annotation', query, this.realTimeSchema);
                if (res.success) {
                    return res.data[0];
                }
                else {
                    return { msg: -1, value: 'Fetch failed', error: res.error };
                }
            }
            catch (error) {
                return { msg: -1, value: 'Fetch failed', error: error };
            }
        }
        catch (error) {
            return [];
        }
    }
};
exports.FactsheetService = FactsheetService;
exports.FactsheetService = FactsheetService = FactsheetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], FactsheetService);


/***/ }),
/* 107 */
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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeedController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const feed_interface_1 = __webpack_require__(108);
const feed_service_1 = __webpack_require__(109);
const marks_service_1 = __webpack_require__(110);
let FeedController = class FeedController {
    constructor(feed, marksService) {
        this.feed = feed;
        this.marksService = marksService;
    }
    async getAnnotations(query) {
        return await this.marksService.getMarks(query);
    }
    async getTotalPages(query) {
        return await this.feed.getTotalPages(query);
    }
    async getList(query) {
        return await this.feed.getFeedData(query);
    }
};
exports.FeedController = FeedController;
__decorate([
    (0, common_1.Get)('annotations'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof feed_interface_1.AnnotMarks !== "undefined" && feed_interface_1.AnnotMarks) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], FeedController.prototype, "getAnnotations", null);
__decorate([
    (0, common_1.Get)('pages/total'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof feed_interface_1.feedTotalPage !== "undefined" && feed_interface_1.feedTotalPage) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], FeedController.prototype, "getTotalPages", null);
__decorate([
    (0, common_1.Get)('pages/data'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof feed_interface_1.FeedPageReq !== "undefined" && feed_interface_1.FeedPageReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], FeedController.prototype, "getList", null);
exports.FeedController = FeedController = __decorate([
    (0, swagger_1.ApiTags)('feed'),
    (0, common_1.Controller)('feed'),
    __metadata("design:paramtypes", [typeof (_a = typeof feed_service_1.FeedService !== "undefined" && feed_service_1.FeedService) === "function" ? _a : Object, typeof (_b = typeof marks_service_1.MarksService !== "undefined" && marks_service_1.MarksService) === "function" ? _b : Object])
], FeedController);


/***/ }),
/* 108 */
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
exports.feedTotalPage = exports.FeedPageReq = exports.AnnotMarks = void 0;
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
class AnnotMarks {
}
exports.AnnotMarks = AnnotMarks;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AnnotMarks.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: 'Transcript',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AnnotMarks.prototype, "bTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'abc123',
        description: 'User Id',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AnnotMarks.prototype, "nUserid", void 0);
class FeedPageReq {
}
exports.FeedPageReq = FeedPageReq;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [1, 2, 3],
        description: 'Page numbers to fetch',
        required: true,
        type: [Number],
    }),
    (0, class_transformer_1.Transform)(({ value }) => {
        if (Array.isArray(value))
            return value.map(v => Number(v));
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed.map(v => Number(v)) : [];
            }
            catch {
                return [];
            }
        }
        return [];
    }, { toClassOnly: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayNotEmpty)(),
    (0, class_validator_1.IsInt)({ each: true }),
    __metadata("design:type", Array)
], FeedPageReq.prototype, "pages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: false,
        description: 'Transcript',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true'),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FeedPageReq.prototype, "bTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FeedPageReq.prototype, "nSesid", void 0);
class feedTotalPage {
}
exports.feedTotalPage = feedTotalPage;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'abc123',
        description: 'Session ID',
        required: true,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], feedTotalPage.prototype, "nSesid", void 0);


/***/ }),
/* 109 */
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
exports.FeedService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(23);
const path = __webpack_require__(24);
const feed_data_service_1 = __webpack_require__(37);
const fs_1 = __webpack_require__(23);
const config_1 = __webpack_require__(6);
const fsp = __webpack_require__(89);
let FeedService = class FeedService {
    constructor(feedData, config) {
        this.feedData = feedData;
        this.config = config;
        this.logger = new common_1.Logger('feed');
    }
    async getFeedData(query) {
        const { nSesid, pages, bTranscript } = query;
        try {
            if (bTranscript) {
                this.logger.warn(`Transcript fetching ${nSesid}`);
                const transfeed = await this.readTranscript(nSesid);
                return { total: (await transfeed)?.length, feed: transfeed };
            }
            const folderPath = path.join('data', `dt_${nSesid}`);
            this.logger.debug(`folderPath: ${folderPath}`);
            const folderExists = await this.pathExists(folderPath);
            if (folderExists) {
                this.logger.warn(`Dir. found for session ${nSesid}`);
                const finalData = this.readLocalData(nSesid, pages);
                return finalData;
            }
            else {
                if (this.feedData.checkSessionExists(nSesid)) {
                    return this.feedData.getSessionPagesData(nSesid, pages);
                }
                else {
                    this.logger.error(`No Session data Found`);
                    throw new common_1.NotFoundException('No session data found');
                }
            }
        }
        catch (error) {
            this.logger.error('Unexpected error in getFeedData', error?.stack || error?.message || String(error));
            throw new common_1.InternalServerErrorException('Failed to fetch feed data');
        }
    }
    async readLocalData(nSesid, reqPages) {
        const folderPath = path.join('data', `dt_${nSesid}`);
        const total = this.getJsonFileCount(folderPath);
        const results = await Promise.all(reqPages.map(async (page) => {
            const filePath = path.join(folderPath, `page_${page}.json`);
            const data = await this.processFile(filePath);
            return { nSesid, page, data };
        }));
        const allEmpty = results.every(r => !r.data || (Array.isArray(r.data) && r.data.length === 0));
        if (allEmpty) {
            throw new common_1.NotFoundException('No local data found for requested pages');
        }
        return { total, feed: results };
    }
    async processFile(filePath) {
        try {
            const raw = await fs_1.promises.readFile(filePath, { encoding: 'utf8' });
            return JSON.parse(raw);
        }
        catch (error) {
            this.logger.warn(`Failed to read JSON: ${filePath} — ${error?.message}`);
            return [];
        }
    }
    async readTranscript(nSesid) {
        const transcriptPath = path.join(this.config.get('REALTIME_PATH') || '', `s_${nSesid}.json`);
        try {
            const raw = await fs_1.promises.readFile(transcriptPath, 'utf8');
            return this.parseTranscriptData(JSON.parse(raw), nSesid);
        }
        catch (error) {
            this.logger.warn(`Transcript not found for ${nSesid} at ${transcriptPath}`);
            throw new common_1.NotFoundException('Transcript file not found');
        }
    }
    parseTranscriptData(feeds, nSesid) {
        try {
            if (feeds?.length) {
                const notExists = feeds.find(a => a.data.findIndex(m => m.unicid) > -1);
                if (!notExists) {
                    this.logger.warn(`identity not found creating dynamic for nSesid ${nSesid}`);
                    let id = 0;
                    for (let x of feeds) {
                        const data = x.data;
                        for (let y of data) {
                            id += 1;
                            y["unicid"] = String(id);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(error?.message);
        }
        return feeds;
    }
    async pathExists(targetPath) {
        try {
            await fs_1.promises.access(targetPath);
            return true;
        }
        catch {
            return false;
        }
    }
    getJsonFileCount(dirPath) {
        try {
            const files = fs.readdirSync(dirPath);
            const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
            return jsonFiles.length;
        }
        catch (err) {
            this.logger.error('Error reading directory:', err);
            return 0;
        }
    }
    async getTotalPages(query) {
        try {
            const { nSesid } = query;
            const folderPath = path.join('data', `dt_${nSesid}`);
            const folderExists = await this.pathExists(folderPath);
            if (folderExists) {
                const files = await fsp.readdir(folderPath);
                const jsonFiles = files.filter(file => file.endsWith('.json'));
                return { msg: 1, total: jsonFiles.length };
            }
            else {
                if (this.feedData.checkSessionExists(nSesid)) {
                    const totalPages = this.feedData.sessionTotalPages(nSesid);
                    return { msg: 1, total: totalPages };
                }
                else {
                    this.logger.error(`No Session data Found`);
                    return { msg: -1, total: 0 };
                }
            }
        }
        catch (error) {
            this.logger.error(error);
            return { msg: -1, total: 0, error: error?.message };
        }
    }
};
exports.FeedService = FeedService;
exports.FeedService = FeedService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof feed_data_service_1.FeedDataService !== "undefined" && feed_data_service_1.FeedDataService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], FeedService);


/***/ }),
/* 110 */
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
exports.MarksService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
let MarksService = class MarksService {
    constructor(db) {
        this.db = db;
        this.realTimeSchema = 'realtime';
    }
    async getMarks(body) {
        body['ref'] = 3;
        let res = await this.db.executeRef('marks', body, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            throw new common_1.NotFoundException(res.err || 'Failed to fetch marjs');
        }
    }
};
exports.MarksService = MarksService;
exports.MarksService = MarksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], MarksService);


/***/ }),
/* 111 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MarknavController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const marknav_service_1 = __webpack_require__(112);
const marknav_interface_1 = __webpack_require__(113);
let MarknavController = class MarknavController {
    constructor(markNavService) {
        this.markNavService = markNavService;
    }
    async getAll(query) {
        return this.markNavService.getAll(query);
    }
    async getFactlist(query) {
        return this.markNavService.getFactlist(query);
    }
    async getCompanylist(query) {
        return this.markNavService.getCompanylist(query);
    }
    async getFactByCompany(query) {
        return this.markNavService.getFactByCompany(query);
    }
    async getFactlinks(query) {
        return this.markNavService.getFactlinks(query);
    }
    async getQuickMarks(query) {
        return this.markNavService.getQuickMarks(query);
    }
    async getDocLinks(query) {
        return this.markNavService.getDoclinks(query);
    }
    async insertHistory(body) {
        return this.markNavService.insertHistory(body);
    }
    async deleteHistory(query) {
        return this.markNavService.deleteHistory(query);
    }
    async getHistoryExist(query) {
        return this.markNavService.getHistoryExist(query);
    }
    async getMarknavTeamUsers(query) {
        console.log("alok query", query);
        return await this.markNavService.getMarknavTeamUsers(query);
    }
};
exports.MarknavController = MarknavController;
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof marknav_interface_1.AllListReq !== "undefined" && marknav_interface_1.AllListReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], MarknavController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('factlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof marknav_interface_1.FactListReq !== "undefined" && marknav_interface_1.FactListReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], MarknavController.prototype, "getFactlist", null);
__decorate([
    (0, common_1.Get)('factcompanylist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof marknav_interface_1.CompanyParams !== "undefined" && marknav_interface_1.CompanyParams) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], MarknavController.prototype, "getCompanylist", null);
__decorate([
    (0, common_1.Get)('factbycompany'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof marknav_interface_1.FactCompParams !== "undefined" && marknav_interface_1.FactCompParams) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], MarknavController.prototype, "getFactByCompany", null);
__decorate([
    (0, common_1.Get)('factlinklist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof marknav_interface_1.FactLinkListReq !== "undefined" && marknav_interface_1.FactLinkListReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], MarknavController.prototype, "getFactlinks", null);
__decorate([
    (0, common_1.Get)('quickmarklist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof marknav_interface_1.quickMarkParams !== "undefined" && marknav_interface_1.quickMarkParams) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], MarknavController.prototype, "getQuickMarks", null);
__decorate([
    (0, common_1.Get)('doclinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof marknav_interface_1.DocListReq !== "undefined" && marknav_interface_1.DocListReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], MarknavController.prototype, "getDocLinks", null);
__decorate([
    (0, common_1.Post)('history/insert'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof marknav_interface_1.HistoryInsertReq !== "undefined" && marknav_interface_1.HistoryInsertReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], MarknavController.prototype, "insertHistory", null);
__decorate([
    (0, common_1.Delete)('history/delete'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof marknav_interface_1.HistoryDeleteReq !== "undefined" && marknav_interface_1.HistoryDeleteReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], MarknavController.prototype, "deleteHistory", null);
__decorate([
    (0, common_1.Get)('history/exist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof marknav_interface_1.HistoryExistReq !== "undefined" && marknav_interface_1.HistoryExistReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], MarknavController.prototype, "getHistoryExist", null);
__decorate([
    (0, common_1.Get)('marknavteamusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof marknav_interface_1.MarknavUserlistReq !== "undefined" && marknav_interface_1.MarknavUserlistReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], MarknavController.prototype, "getMarknavTeamUsers", null);
exports.MarknavController = MarknavController = __decorate([
    (0, swagger_1.ApiTags)('Marknav'),
    (0, common_1.Controller)('marknav'),
    __metadata("design:paramtypes", [typeof (_a = typeof marknav_service_1.MarknavService !== "undefined" && marknav_service_1.MarknavService) === "function" ? _a : Object])
], MarknavController);


/***/ }),
/* 112 */
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
exports.MarknavService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
let MarknavService = class MarknavService {
    constructor(db) {
        this.db = db;
        this.realTimeSchema = 'realtime';
    }
    async getAll(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFactlist(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlist', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getCompanylist(query) {
        let res = await this.db.executeRef('navigate_fact_companies', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFactByCompany(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_facts_bycompany', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFactlinks(query) {
        let res = await this.db.executeRef('marknav_factlinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getQuickMarks(query) {
        let res = await this.db.executeRef('navigate_quick_mark', query, this.realTimeSchema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getDoclinks(query) {
        let res = await this.db.executeRef('marknav_doclinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async insertHistory(body) {
        try {
            body.cPermission = 'N';
            const res = await this.db.executeRef('manage_history', body, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to insert history', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async deleteHistory(query) {
        try {
            query.cPermission = 'D';
            const res = await this.db.executeRef('manage_history', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to delete history', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async getHistoryExist(query) {
        try {
            const res = await this.db.executeRef('marknav_history_exist', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to check history exist', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async getMarknavTeamUsers(query) {
        let res = await this.db.executeRef('marknav_team_user', query, this.realTimeSchema);
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
};
exports.MarknavService = MarknavService;
exports.MarknavService = MarknavService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], MarknavService);


/***/ }),
/* 113 */
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
exports.MarknavUserlistRes = exports.MarknavUserlistReq = exports.HistoryExistReq = exports.HistoryDeleteReq = exports.HistoryInsertReq = exports.FactLinkListReq = exports.DocListReq = exports.quickMarkParams = exports.FactCompParams = exports.CompanyParams = exports.FactListReq = exports.AllListReq = void 0;
const swagger_1 = __webpack_require__(11);
const class_transformer_1 = __webpack_require__(49);
const class_validator_1 = __webpack_require__(50);
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
class AllListReq {
}
exports.AllListReq = AllListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASC', description: 'Sort type identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllListReq.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category', description: 'Sort by identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllListReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AllListReq.prototype, "nPageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllListReq.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AllListReq.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], AllListReq.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nUserid", void 0);
class FactListReq {
}
exports.FactListReq = FactListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASC', description: 'Sort type identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactListReq.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'QF', description: 'Fact type' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactListReq.prototype, "cFType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category', description: 'Sort by identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactListReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FactListReq.prototype, "nPageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactListReq.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactListReq.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FactListReq.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nUserid", void 0);
class CompanyParams {
}
exports.CompanyParams = CompanyParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CompanyParams.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nUserid", void 0);
class FactCompParams {
}
exports.FactCompParams = FactCompParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Company id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nCompanyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cSortby', description: 'Sort by identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactCompParams.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FactCompParams.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nUserid", void 0);
class quickMarkParams {
}
exports.quickMarkParams = quickMarkParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASC', description: 'Sort type identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cSortby', description: 'Sort by identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], quickMarkParams.prototype, "nPageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], quickMarkParams.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], quickMarkParams.prototype, "bIsTranscipt", void 0);
class DocListReq {
}
exports.DocListReq = DocListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocListReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category', description: 'Sort by identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocListReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DocListReq.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DocListReq.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DocListReq.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocListReq.prototype, "nUserid", void 0);
class FactLinkListReq {
}
exports.FactLinkListReq = FactLinkListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category', description: 'Sort by identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'true', description: 'History enabled', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactLinkListReq.prototype, "historyEnabled", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactLinkListReq.prototype, "bIsTranscipt", void 0);
class HistoryInsertReq {
}
exports.HistoryInsertReq = HistoryInsertReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'File system ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Document ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nDocid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'History ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nHid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'read', description: 'Permission level', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'document', description: 'Type of history entry', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryInsertReq.prototype, "nUserid", void 0);
class HistoryDeleteReq {
}
exports.HistoryDeleteReq = HistoryDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'read', description: 'Permission level', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'document', description: 'Type of history entry', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1 W', description: 'Time frame', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "cTimeFrame", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryDeleteReq.prototype, "nUserid", void 0);
class HistoryExistReq {
}
exports.HistoryExistReq = HistoryExistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryExistReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryExistReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ALL', description: 'Type of history entry', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], HistoryExistReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], HistoryExistReq.prototype, "nUserid", void 0);
class MarknavUserlistReq {
}
exports.MarknavUserlistReq = MarknavUserlistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSesid identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MarknavUserlistReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MarknavUserlistReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarknavUserlistReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MarknavUserlistReq.prototype, "nUserid", void 0);
class MarknavUserlistRes {
}
exports.MarknavUserlistRes = MarknavUserlistRes;


/***/ }),
/* 114 */
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
exports.CaseTupleController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(11);
const case_tuple_interface_1 = __webpack_require__(115);
const case_tuple_service_1 = __webpack_require__(116);
let CaseTupleController = class CaseTupleController {
    constructor(caseTupleService) {
        this.caseTupleService = caseTupleService;
    }
    async insertCaseTuples(body) {
        return this.caseTupleService.createCaseTuples(body);
    }
};
exports.CaseTupleController = CaseTupleController;
__decorate([
    (0, common_1.Post)('updates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof case_tuple_interface_1.updatesReq !== "undefined" && case_tuple_interface_1.updatesReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CaseTupleController.prototype, "insertCaseTuples", null);
exports.CaseTupleController = CaseTupleController = __decorate([
    (0, swagger_1.ApiTags)('case-tuple'),
    (0, common_1.Controller)('case-tuple'),
    __metadata("design:paramtypes", [typeof (_a = typeof case_tuple_service_1.CaseTupleService !== "undefined" && case_tuple_service_1.CaseTupleService) === "function" ? _a : Object])
], CaseTupleController);


/***/ }),
/* 115 */
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
exports.updatesReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(51);
const swagger_1 = __webpack_require__(11);
const class_validator_1 = __webpack_require__(50);
class updatesReq {
}
exports.updatesReq = updatesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'bc669a9e-6388-42af-9a94-f438e907ea30', description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updatesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updatesReq.prototype, "nMasterid", void 0);


/***/ }),
/* 116 */
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
var CaseTupleService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CaseTupleService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(8);
let CaseTupleService = CaseTupleService_1 = class CaseTupleService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(CaseTupleService_1.name);
    }
    async createCaseTuples(body) {
        return { msg: -1, value: 'Update failed' };
    }
};
exports.CaseTupleService = CaseTupleService;
exports.CaseTupleService = CaseTupleService = CaseTupleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], CaseTupleService);


/***/ }),
/* 117 */
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
var SessionJobService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionJobService = void 0;
const db_service_1 = __webpack_require__(8);
const common_1 = __webpack_require__(3);
const schedule_1 = __webpack_require__(118);
let SessionJobService = SessionJobService_1 = class SessionJobService {
    constructor(db) {
        this.db = db;
        this.logger = new common_1.Logger(SessionJobService_1.name);
    }
    handleHourlyTask() {
        this.logger.debug('Running hourly task...');
        this.performTask();
    }
    performTask() {
        this.logger.log('Performing the scheduled task! ✅');
    }
};
exports.SessionJobService = SessionJobService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SessionJobService.prototype, "handleHourlyTask", null);
exports.SessionJobService = SessionJobService = SessionJobService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], SessionJobService);


/***/ }),
/* 118 */
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

/***/ }),
/* 119 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 120 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 121 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 122 */
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
/* 123 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(30);
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
/* 124 */
/***/ ((module) => {

module.exports = require("body-parser");

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
const realtime_server_module_1 = __webpack_require__(2);
const compression = __webpack_require__(119);
const cookieParser = __webpack_require__(120);
const dotenv = __webpack_require__(121);
const swagger_1 = __webpack_require__(11);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(122);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(6);
const kafka_config_1 = __webpack_require__(123);
const bodyParser = __webpack_require__(124);
async function bootstrap() {
    const app = await core_1.NestFactory.create(realtime_server_module_1.RealtimeServerModule);
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('realtime-group'));
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
        .setTitle('Etabella realtime server')
        .setDescription('API description')
        .setVersion('1.0')
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
    await app.listen(configService.get('PORT_REALTIME_SERVERAPI'));
}
bootstrap();

})();

/******/ })()
;