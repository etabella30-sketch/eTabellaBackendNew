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
exports.RealtimeModule = void 0;
const common_1 = __webpack_require__(3);
const realtime_controller_1 = __webpack_require__(4);
const realtime_service_1 = __webpack_require__(5);
const serve_static_1 = __webpack_require__(74);
const path_1 = __webpack_require__(14);
const parse_data_service_1 = __webpack_require__(52);
const socket_service_1 = __webpack_require__(54);
const utility_service_1 = __webpack_require__(12);
const tcp_controller_1 = __webpack_require__(75);
const tcp_service_1 = __webpack_require__(50);
const events_gateway_1 = __webpack_require__(79);
const session_service_1 = __webpack_require__(29);
const axios_1 = __webpack_require__(24);
const date_time_service_1 = __webpack_require__(30);
const scheduler_service_1 = __webpack_require__(32);
const websocket_module_1 = __webpack_require__(81);
const savedata_service_1 = __webpack_require__(57);
const stream_data_service_1 = __webpack_require__(56);
const global_1 = __webpack_require__(82);
const log_service_1 = __webpack_require__(39);
const winston_module_1 = __webpack_require__(85);
const typeorm_1 = __webpack_require__(8);
const sqllitedb_service_1 = __webpack_require__(7);
const session_controller_1 = __webpack_require__(86);
const sessionbuilder_service_1 = __webpack_require__(6);
const connectivity_service_1 = __webpack_require__(27);
const bridge_parse_service_1 = __webpack_require__(58);
const parse_command_service_1 = __webpack_require__(67);
const downloadfile_service_1 = __webpack_require__(89);
const issue_controller_1 = __webpack_require__(109);
const issue_service_1 = __webpack_require__(34);
const sqlite_table_creation_service_1 = __webpack_require__(20);
const query_services_1 = __webpack_require__(35);
const sync_service_1 = __webpack_require__(45);
const backup_service_1 = __webpack_require__(122);
const bridge_service_1 = __webpack_require__(68);
const fs = __webpack_require__(11);
const conversion_js_service_1 = __webpack_require__(114);
const config_1 = __webpack_require__(22);
const session_backup_service_1 = __webpack_require__(46);
const export_service_1 = __webpack_require__(111);
const db_service_1 = __webpack_require__(36);
const query_builder_service_1 = __webpack_require__(38);
const cli_service_1 = __webpack_require__(73);
const feed_start_service_1 = __webpack_require__(72);
const session_store_service_1 = __webpack_require__(47);
const ioredis_1 = __webpack_require__(49);
const redis_db_service_1 = __webpack_require__(123);
const verify_tabs_service_1 = __webpack_require__(44);
const email_service_1 = __webpack_require__(91);
const uuid_service_1 = __webpack_require__(25);
const auth_controller_1 = __webpack_require__(124);
const auth_service_1 = __webpack_require__(125);
const password_hash_service_1 = __webpack_require__(126);
const unic_identity_service_1 = __webpack_require__(42);
const transcript_publish_service_1 = __webpack_require__(116);
const transcript_html_service_1 = __webpack_require__(117);
const theme_css_service_1 = __webpack_require__(118);
const transcript_service_1 = __webpack_require__(120);
const transfer_highlights_service_1 = __webpack_require__(59);
const rhighlights_service_1 = __webpack_require__(60);
const fuzzy_search_service_1 = __webpack_require__(61);
const annot_data_service_1 = __webpack_require__(128);
const rapidfuzz_service_1 = __webpack_require__(63);
const json_log_service_1 = __webpack_require__(129);
const transfer_health_service_1 = __webpack_require__(76);
const schedule_1 = __webpack_require__(78);
const identity_fix_service_1 = __webpack_require__(66);
const feed_controller_1 = __webpack_require__(130);
const feed_service_1 = __webpack_require__(132);
const feed_data_service_1 = __webpack_require__(133);
const event_emitter_1 = __webpack_require__(18);
const sqliteDir = (0, path_1.join)(__dirname, 'sqlite');
if (!fs.existsSync(sqliteDir)) {
    fs.mkdirSync(sqliteDir, { recursive: true });
}
let RealtimeModule = class RealtimeModule {
};
exports.RealtimeModule = RealtimeModule;
exports.RealtimeModule = RealtimeModule = __decorate([
    (0, common_1.Module)({
        imports: [global_1.GlobalModule,
            schedule_1.ScheduleModule.forRoot(),
            event_emitter_1.EventEmitterModule.forRoot(),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'sqlite',
                database: (0, path_1.join)('sqlite', 'offline-data.sqlite'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: true,
                extra: {
                    journal_mode: 'WAL',
                    busyTimeout: 15000,
                },
            }),
            serve_static_1.ServeStaticModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => {
                    const publicDir = configService.get('PUBLIC_DIR') || 'public';
                    console.log('\n\r\n\r\n\r TRE', publicDir);
                    return [
                        {
                            rootPath: (0, path_1.join)(__dirname, publicDir),
                            exclude: ['/api*'],
                        },
                    ];
                },
                inject: [config_1.ConfigService],
            }),
            axios_1.HttpModule, websocket_module_1.WebSocketModule,
            winston_module_1.WinstonConfigModule.forRoot('realtime')],
        controllers: [auth_controller_1.AuthController, realtime_controller_1.RealtimeController, tcp_controller_1.TcpController, session_controller_1.SessionController, issue_controller_1.IssueController, feed_controller_1.FeedController],
        providers: [realtime_service_1.RealtimeService, tcp_service_1.TcpService, utility_service_1.UtilityService, parse_data_service_1.ParseDataService, socket_service_1.SocketService, session_backup_service_1.SessionBackupService, export_service_1.ExportService,
            events_gateway_1.EventsGateway, session_service_1.SessionService, date_time_service_1.DateTimeService, scheduler_service_1.SchedulerService, savedata_service_1.SavedataService, stream_data_service_1.StreamDataService, log_service_1.LogService, query_services_1.QueryService, sqllitedb_service_1.SqllitedbService, sqlite_table_creation_service_1.SqliteTableCreationService,
            sessionbuilder_service_1.SessionbuilderService, connectivity_service_1.ConnectivityService, downloadfile_service_1.DownloadfileService, issue_service_1.IssueService, sync_service_1.SyncService, bridge_parse_service_1.BridgeParseService, parse_command_service_1.ParseCommandService, backup_service_1.BackupService, bridge_service_1.BridgeService,
            conversion_js_service_1.ConversionJsService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, cli_service_1.CliService, feed_start_service_1.FeedStartService, session_store_service_1.SessionStoreService, redis_db_service_1.RedisDbService,
            verify_tabs_service_1.VerifyTabsService, email_service_1.EmailService, uuid_service_1.UuidService, auth_service_1.AuthService, password_hash_service_1.PasswordHashService, unic_identity_service_1.UnicIdentityService,
            transcript_publish_service_1.TranscriptpublishService, transcript_html_service_1.TranscriptHtmlService, theme_css_service_1.ThemeCssService, transcript_service_1.TranscriptService, transfer_highlights_service_1.TransferHighlightsService, rhighlights_service_1.RhighlightsService,
            fuzzy_search_service_1.FuzzySearchService, annot_data_service_1.AnnotDataService, rapidfuzz_service_1.RapidfuzzService, json_log_service_1.JsonLogService, transfer_health_service_1.TransferHealthService, identity_fix_service_1.IdentityFixService,
            feed_service_1.FeedService, feed_data_service_1.FeedDataService],
    })
], RealtimeModule);


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
var RealtimeController_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RealtimeController = exports.FuzzySearchDto = void 0;
const common_1 = __webpack_require__(3);
const realtime_service_1 = __webpack_require__(5);
const sync_service_1 = __webpack_require__(45);
const tcp_service_1 = __webpack_require__(50);
const class_validator_1 = __webpack_require__(69);
const class_transformer_1 = __webpack_require__(70);
const swagger_1 = __webpack_require__(71);
const feed_start_service_1 = __webpack_require__(72);
const cli_service_1 = __webpack_require__(73);
const fuzzy_search_service_1 = __webpack_require__(61);
class sendfeed {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 22, description: 'Case ID', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], sendfeed.prototype, "nLength", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], sendfeed.prototype, "nDelay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cmd.json', description: 'Case ID', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], sendfeed.prototype, "cCmd", void 0);
class startfeed {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: '20241118 Mar v Off.law', description: 'Files from assets', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], startfeed.prototype, "file", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], startfeed.prototype, "nDelay", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 40, description: '', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], startfeed.prototype, "batch", void 0);
class FuzzySearchDto {
}
exports.FuzzySearchDto = FuzzySearchDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            "particular field. You got to find out different",
            "elements from analogy from different fields all around",
        ],
        description: 'Array of transcript lines',
        required: true,
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FuzzySearchDto.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: [
            "You got to find ",
            " out different",
        ],
        description: 'Array of transcript terms to search for',
        required: true,
        type: [String],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], FuzzySearchDto.prototype, "query", void 0);
let RealtimeController = RealtimeController_1 = class RealtimeController {
    constructor(realtimeService, syncService, tcp, feedStart, cli, search) {
        this.realtimeService = realtimeService;
        this.syncService = syncService;
        this.tcp = tcp;
        this.feedStart = feedStart;
        this.cli = cli;
        this.search = search;
        this.logger = new common_1.Logger(RealtimeController_1.name);
    }
    getHello() {
        return this.realtimeService.getHello();
    }
    async syncdata(body) {
        await this.syncService.pushData();
    }
    async sendfeed(body) {
        return await this.tcp.readJsonAndSendData(body);
    }
    async startfeed(body) {
        return await this.feedStart.startFeed(body);
    }
    async fetchData(body) {
        return await this.cli.getData(body);
    }
    async testfuzzy(body) {
        let res;
        try {
            res = await this.search.generateNewCordinates(body);
        }
        catch (error) {
            this.logger.error('Error at search', error?.message);
            res = [];
        }
        return res;
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Redirect)('/index.html', 302),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], RealtimeController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('syncdata'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], RealtimeController.prototype, "syncdata", null);
__decorate([
    (0, common_1.Post)('sendfeed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sendfeed]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], RealtimeController.prototype, "sendfeed", null);
__decorate([
    (0, common_1.Post)('startfeed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [startfeed]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], RealtimeController.prototype, "startfeed", null);
__decorate([
    (0, common_1.Post)('fetchdata'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], RealtimeController.prototype, "fetchData", null);
__decorate([
    (0, common_1.Post)('search'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], RealtimeController.prototype, "testfuzzy", null);
exports.RealtimeController = RealtimeController = RealtimeController_1 = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof realtime_service_1.RealtimeService !== "undefined" && realtime_service_1.RealtimeService) === "function" ? _a : Object, typeof (_b = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _b : Object, typeof (_c = typeof tcp_service_1.TcpService !== "undefined" && tcp_service_1.TcpService) === "function" ? _c : Object, typeof (_d = typeof feed_start_service_1.FeedStartService !== "undefined" && feed_start_service_1.FeedStartService) === "function" ? _d : Object, typeof (_e = typeof cli_service_1.CliService !== "undefined" && cli_service_1.CliService) === "function" ? _e : Object, typeof (_f = typeof fuzzy_search_service_1.FuzzySearchService !== "undefined" && fuzzy_search_service_1.FuzzySearchService) === "function" ? _f : Object])
], RealtimeController);


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
exports.RealtimeService = void 0;
const common_1 = __webpack_require__(3);
const sessionbuilder_service_1 = __webpack_require__(6);
const sqllitedb_service_1 = __webpack_require__(7);
let RealtimeService = class RealtimeService {
    constructor(sessionBuilderService, dbLite) {
        this.sessionBuilderService = sessionBuilderService;
        this.dbLite = dbLite;
    }
    getHello() {
        return 'Hello World!';
    }
    async onModuleInit() {
        this.sessionBuilderService.syncUsers();
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof sessionbuilder_service_1.SessionbuilderService !== "undefined" && sessionbuilder_service_1.SessionbuilderService) === "function" ? _a : Object, typeof (_b = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _b : Object])
], RealtimeService);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionbuilderService = void 0;
const common_1 = __webpack_require__(3);
const sqllitedb_service_1 = __webpack_require__(7);
const utility_service_1 = __webpack_require__(12);
const axios_1 = __webpack_require__(24);
const config_1 = __webpack_require__(22);
const rxjs_1 = __webpack_require__(23);
const connectivity_service_1 = __webpack_require__(27);
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
const session_service_1 = __webpack_require__(29);
const sync_service_1 = __webpack_require__(45);
const scheduler_service_1 = __webpack_require__(32);
const moment = __webpack_require__(17);
const issue_service_1 = __webpack_require__(34);
const session_backup_service_1 = __webpack_require__(46);
const log_service_1 = __webpack_require__(39);
const session_store_service_1 = __webpack_require__(47);
const verify_tabs_service_1 = __webpack_require__(44);
const db_service_1 = __webpack_require__(36);
const unic_identity_service_1 = __webpack_require__(42);
let SessionbuilderService = class SessionbuilderService {
    constructor(dbLite, session, connectivity, utility, httpService, config, syncService, schedulerService, issue, sb, log, sessionStore, verifyTab, db, unicIdentity) {
        this.dbLite = dbLite;
        this.session = session;
        this.connectivity = connectivity;
        this.utility = utility;
        this.httpService = httpService;
        this.config = config;
        this.syncService = syncService;
        this.schedulerService = schedulerService;
        this.issue = issue;
        this.sb = sb;
        this.log = log;
        this.sessionStore = sessionStore;
        this.verifyTab = verifyTab;
        this.db = db;
        this.unicIdentity = unicIdentity;
        this.userInfoFile = 'authuser.json';
        this.logApplication = 'realtime/session';
        this.logger = new common_1.Logger('sync-service');
        this.schema = 'realtime';
        try {
            clearInterval(this.sessionInterval);
        }
        catch (error) {
        }
        this.sessionInterval = setInterval(async () => {
            this.log.info(`Sync `, `realtime/sync`);
            await this.syncService.pushData();
        }, 1000 * 10);
    }
    async onModuleInit() {
    }
    async getlivesessionbycaseid(body) {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('live_sessions', { cSessionUnicId }, this.schema);
        if (res.success) {
            try {
                return { msg: 1, ...res.data[0][0] };
            }
            catch (error) {
                this.logger.error(`Session end failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session end failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async getSessionById(body) {
        const res = await this.db.executeRef('sessiondata', body, this.schema);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                this.logger.error(`Session end failed :${res.error} `);
                return [];
            }
        }
        else {
            this.logger.error(`Session end failed :${res.error} `);
            return [];
        }
    }
    async getFilesCount(nSesid, cProtocol, nLines) {
        try {
            const folderPath = `localdata/dt_${nSesid}`;
            try {
                await fs_1.promises.access(folderPath);
            }
            catch (error) {
                if (this.session.currentSessionid == nSesid) {
                    if (this.session.CurrentJob?.lineBuffer?.length) {
                        const total = this.session.CurrentJob?.lineBuffer?.length;
                        const pages = Math.ceil(total / nLines);
                        return { pageRes: null, maxNumber: pages };
                    }
                }
            }
            const files = await fs_1.promises.readdir(folderPath);
            const maxNumber = files.reduce((max, file) => {
                const num = parseInt(file.replace(/\D+/g, ''), 10);
                return num > max ? num : max;
            }, 0);
            const filePath = path.join(folderPath, `page_${maxNumber}.json`);
            const pageRes = await this.processFile(filePath);
            return { maxNumber, pageRes };
        }
        catch (error) {
        }
        return { pageRes: null, maxNumber: 0 };
    }
    async processFile(filePath) {
        const data = await fs_1.promises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }
    async sessionEnd(body) {
        debugger;
        await this.sessionStore.saveSession(body.nCaseid, body.nSesid);
        const res = await this.db.executeRef('sessions_manage_status', { nSesid: body.nSesid, cStatus: 'C' }, this.schema);
        if (res.success) {
            try {
                await this.makePostRequest('sessionend', { nSesid: body.nSesid, permission: 'C' });
                this.session.loadActiveSessionDetail(res.data[0][0]["nCaseid"]);
                return res.data[0][0];
            }
            catch (error) {
                this.logger.error(`Session end failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session end failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async sessionCreation(body) {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const dt = body.dStartDt.replace('T', ' ');
        const timezone = moment.tz.guess();
        const parsedDateString = moment.tz(dt, 'YYYY-MM-DD hh:mm:ss A', timezone).format('YYYY-MM-DD HH:mm:ss');
        const res = await this.db.executeRef('sessions_builder', { ...body, cSessionUnicId, cTimezone: timezone }, this.schema);
        if (res.success) {
            try {
                const obj = res.data[0][0] || {};
                if (obj.msg == 1) {
                    await this.setupScheduler(obj.nCaseid, obj.nSesid, parsedDateString);
                }
                this.session.loadActiveSessionDetail(res.data[0][0]["nCaseid"]);
                if (obj?.nSesid) {
                    try {
                        await this.makePostRequest('sessionstart', { nSesid: obj.nSesid, nCaseid: obj.nCaseid });
                    }
                    catch (error) {
                        this.logger.warn(`sessionstart notify-live failed: ${error?.message}`);
                    }
                }
                return obj;
            }
            catch (error) {
                this.logger.error(`Session Builder failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session Builder failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async setupScheduler(nCaseid, nSesid, parsedDateString) {
        this.logger.verbose(`Seting up schedular: ${nSesid},${parsedDateString}`);
        try {
            await this.schedulerService.cancelJob(nSesid);
        }
        catch (error) {
        }
        try {
            await this.schedulerService.removeJob(nSesid);
        }
        catch (error) {
        }
        this.schedulerService.scheduleTask(nSesid, parsedDateString, async () => {
            this.logger.verbose(`Session Start session: ${nSesid} and Case:${nCaseid}`);
            const mdl = {
                cStatus: 'R', nSesid
            };
            await this.db.executeRef('sessions_manage_status', mdl, this.schema);
            await this.session.loadActiveSessionDetail(nCaseid, nSesid);
        });
    }
    async serverBuilder(body) {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('server_builder', { ...body, cSessionUnicId }, this.schema);
        if (res.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                this.logger.error(`Server Builder failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Server Builder failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async sessionList(body) {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('sessions', { cSessionUnicId, nUserid: body.nUserid, nCaseid: body.nCaseid }, this.schema);
        if (res.success) {
            if (res.data[0]?.length) {
                this.session.loadActiveSessionDetail(body.nCaseid);
            }
            return res.data[0] || [];
        }
        else {
            this.logger.error(`Session List failed :${res.error} `);
            return [];
        }
    }
    async sessionServers(body) {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('servers', { cSessionUnicId, nUserid: body.nUserid }, this.schema);
        if (res.success) {
            return res.data[0] || [];
        }
        else {
            this.logger.error(`Server List failed :${res.error} `);
            return [];
        }
    }
    async sessionAssign(body) {
        const res = await this.db.executeRef('assign_servers', body, this.schema);
        if (res.success) {
            try {
                return res.data[0][0] || [];
            }
            catch (error) {
                this.logger.error(`Session List failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session List failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async deleteSession(body) {
        const nSesid = body.nSesid;
        const res = await this.db.executeRef('sessions_builder', { nSesid, permission: 'D' }, this.schema);
        if (res.success) {
            try {
                try {
                    await this.schedulerService.cancelJob(nSesid);
                }
                catch (error) {
                }
                try {
                    await this.schedulerService.removeJob(nSesid);
                }
                catch (error) {
                }
                return res.data[0][0] || [];
            }
            catch (error) {
                this.logger.error(`Session List failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session List failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
    async makePostRequest(apipath, body) {
        try {
            this.logger.warn(`Making post request to ${apipath} `);
            const url = new URL(this.config.get('LIVE_SERVER') + '/session/' + apipath);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), body));
            return response.data ? response.data : { msg: -1, value: 'Failed' };
        }
        catch (error) {
            this.logger.error(`Error in makePostRequest for ${apipath} : `, error?.message);
            this.logger.verbose(` body : `, body);
            return { msg: -1, value: 'Failed' };
        }
    }
    async syncUsers() {
        try {
        }
        catch (error) {
        }
    }
    async syncUserData() {
        return { msg: -1, value: 'Failed' };
    }
    async getSessionByCaseId(query) {
        return await this.sessionList(query);
    }
    async updateTrascriptStatus(body, status) {
        await this.db.executeRef('update_transcript_status', { isTranscript: status == 1 ? true : false, nSesid: body.nSesid }, this.schema);
    }
    async getRefReshType() {
    }
    async setRefreshtype(param) {
    }
    async settimezone(param) {
        if (param.cTimezone)
            this.schedulerService.setTimezone(param.cTimezone);
    }
};
exports.SessionbuilderService = SessionbuilderService;
exports.SessionbuilderService = SessionbuilderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof connectivity_service_1.ConnectivityService !== "undefined" && connectivity_service_1.ConnectivityService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object, typeof (_e = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _e : Object, typeof (_f = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _f : Object, typeof (_g = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _g : Object, typeof (_h = typeof scheduler_service_1.SchedulerService !== "undefined" && scheduler_service_1.SchedulerService) === "function" ? _h : Object, typeof (_j = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _j : Object, typeof (_k = typeof session_backup_service_1.SessionBackupService !== "undefined" && session_backup_service_1.SessionBackupService) === "function" ? _k : Object, typeof (_l = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _l : Object, typeof (_m = typeof session_store_service_1.SessionStoreService !== "undefined" && session_store_service_1.SessionStoreService) === "function" ? _m : Object, typeof (_o = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _o : Object, typeof (_p = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _p : Object, typeof (_q = typeof unic_identity_service_1.UnicIdentityService !== "undefined" && unic_identity_service_1.UnicIdentityService) === "function" ? _q : Object])
], SessionbuilderService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SqllitedbService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(8);
const typeorm_2 = __webpack_require__(9);
const async_1 = __webpack_require__(10);
const fs = __webpack_require__(11);
const utility_service_1 = __webpack_require__(12);
const sqlite_table_creation_service_1 = __webpack_require__(20);
const config_1 = __webpack_require__(22);
const rxjs_1 = __webpack_require__(23);
const axios_1 = __webpack_require__(24);
const path = __webpack_require__(14);
const util_1 = __webpack_require__(15);
const uuid_service_1 = __webpack_require__(25);
let SqllitedbService = class SqllitedbService {
    constructor(connection, utilityService, tableCreationService, config, httpService, uuid) {
        this.connection = connection;
        this.utilityService = utilityService;
        this.tableCreationService = tableCreationService;
        this.config = config;
        this.httpService = httpService;
        this.uuid = uuid;
        this.commandCounter = 0;
        this.logger = new common_1.Logger('SqllitedbService');
        this.queue = async_1.default.queue(async (task, callback) => {
            await task();
            callback();
        }, 1);
        this.queue.drain(() => {
        });
    }
    async getPrimaryValue(tabel) {
        try {
            const query = ` PRAGMA table_info('${tabel}') `;
            const data = await this.connection.query(query);
            const obj = data.find(a => a.pk == 1 && a.type == 'TEXT');
            if (obj) {
                return { key: obj.name, value: this.uuid.generateUUID() };
            }
        }
        catch (error) {
            this.logger.error(`Failed to get UUID from ${tabel}:`, error);
        }
        return null;
    }
    async insert(table, columns) {
        const primaryValue = await this.getPrimaryValue(table);
        let primaryKey = null;
        if (primaryValue) {
            columns[primaryValue.key] = primaryValue.value;
            primaryKey = primaryValue.value;
        }
        const keys = Object.keys(columns).join(', ');
        const values = Object.values(columns);
        const placeholders = values.map(() => '?').join(', ');
        const query = `INSERT INTO ${table} (${keys}) VALUES (${placeholders})`;
        try {
            await this.connection.query(query, values);
            if (primaryKey) {
                return primaryKey;
            }
            else {
                const result = await this.connection.query('SELECT last_insert_rowid() AS id');
                return result[0].id;
            }
        }
        catch (error) {
            console.error(`Failed to insert data into ${table}:`, error);
            return null;
        }
    }
    async insertMany(table, rows) {
        if (rows.length === 0)
            return [];
        const primaryValue = await this.getPrimaryValue(table);
        if (primaryValue) {
            for (const row of rows) {
                if (!row.hasOwnProperty(primaryValue.key)) {
                    row[primaryValue.key] = this.uuid.generateUUID();
                }
            }
        }
        const keys = Object.keys(rows[0]);
        const columns = keys.join(', ');
        const placeholders = `(${keys.map(() => '?').join(', ')})`;
        const query = `INSERT INTO ${table} (${columns}) VALUES ${rows.map(() => placeholders).join(', ')}`;
        const values = rows.flatMap(row => keys.map(key => row[key]));
        try {
            await this.connection.query(query, values);
            if (primaryValue) {
                return rows.map(row => row[primaryValue.key]);
            }
            const result = await this.connection.query(`SELECT last_insert_rowid() AS id`);
            return result.map(row => row.id);
        }
        catch (error) {
            console.error(`Failed to insert multiple rows into ${table}:`, error);
            return null;
        }
    }
    async insertManyWithConflict(table, rows, conflictColumns) {
        if (rows.length === 0)
            return [];
        const primaryValue = await this.getPrimaryValue(table);
        if (primaryValue) {
            for (const row of rows) {
                if (!row.hasOwnProperty(primaryValue.key)) {
                    row[primaryValue.key] = this.uuid.generateUUID();
                }
            }
        }
        const keys = Object.keys(rows[0]);
        const columns = keys.join(', ');
        const placeholders = `(${keys.map(() => '?').join(', ')})`;
        const query = `
    INSERT INTO ${table} (${columns}) 
    VALUES ${rows.map(() => placeholders).join(', ')}
    ON CONFLICT(${conflictColumns.join(', ')}) DO NOTHING
  `;
        const flatValues = rows.flatMap(row => keys.map(k => row[k]));
        try {
            await this.connection.query(query, flatValues);
            if (primaryValue) {
                return rows.map(row => row[primaryValue.key]);
            }
            return [];
        }
        catch (error) {
            console.error(`Failed to insert with conflict handling into ${table}:`, error);
            return null;
        }
    }
    async get(table, whereClause = '1=1', whereParams = []) {
        const query = `SELECT * FROM ${table} WHERE ${whereClause}`;
        try {
            return await this.connection.query(query, whereParams);
        }
        catch (error) {
            console.error(`Failed to get data from ${table}:`, error);
            return null;
        }
    }
    async getCustomQuery(query, params) {
        try {
            return await this.connection.query(query, params);
        }
        catch (error) {
            console.error('Error executing custom query:', error);
            return [];
        }
    }
    async update(table, columns, whereClause, whereParams) {
        const setClause = Object.keys(columns).map(key => `${key} = ?`).join(', ');
        const values = Object.values(columns);
        const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        try {
            await this.connection.query(query, [...values, ...whereParams]);
        }
        catch (error) {
            console.error(`Failed to update data in ${table}:`, error);
            return null;
        }
    }
    async delete(table, whereClause, whereParams) {
        const query = `DELETE FROM ${table} WHERE ${whereClause}`;
        try {
            await this.connection.query(query, whereParams);
        }
        catch (error) {
            console.error(`Failed to delete data from ${table}:`, error);
        }
    }
    async truncate(table) {
        const query = `DELETE FROM ${table}`;
        try {
            await this.connection.query(query);
            await this.connection.query(`DELETE FROM sqlite_sequence WHERE name = ?`, [table]);
            await this.connection.query(`VACUUM`);
        }
        catch (error) {
            console.error(`Failed to truncate table ${table}:`, error);
        }
    }
    async fetchFeed(whereClause = '1=1', whereParams = []) {
        const query = `SELECT * FROM feed WHERE ${whereClause} order by CAST(SUBSTR(timestamp, 1, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 4, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 7, 2) AS INTEGER),
  CAST(SUBSTR(timestamp, 10) AS INTEGER), line_index asc`;
        try {
            const data = await this.connection.query(query, whereParams);
            const finalData = (data || []).map((a) => ([a.timestamp, JSON.parse(a.data), a.line_index, a.formate, a.page_number, a.line_number]));
            return finalData;
        }
        catch (error) {
            console.error(`Failed to get data from feed:`, error);
            return null;
        }
    }
    async deleteData(nSesid, startInd, endInd, currentJob) {
        this.commandCounter++;
        this.queue.push(async () => {
            await this.deleteDataInFeed(nSesid, startInd, endInd, this.commandCounter);
        });
    }
    async deleteDataInFeed(nSesid, startInd, endInd, commandCounter) {
        await new Promise(async (resolve, reject) => {
            try {
                const query1 = `delete from feed where nSesid = ? and line_index between  ? and  ?`;
                this.printQuerylog(`${commandCounter} : ${query1} \n ${JSON.stringify([nSesid, startInd, endInd])}`);
                const data = await this.connection.query(query1, [nSesid, startInd, endInd]);
            }
            catch (error) {
                this.printQuerylog(`${commandCounter} : Failed to delete data from feed: `);
            }
            resolve(true);
        });
    }
    async rearrangeLines(nSesid, startInd, commandCounter) {
        await new Promise(async (resolve, reject) => {
            try {
                const query2 = `update feed set line_index = line_index - 1,line_number = line_number - 1 where nSesid = ? and line_index > ?`;
                this.printQuerylog(`${commandCounter} : ${JSON.stringify([nSesid, startInd])}`);
                this.printQuerylog(`${commandCounter} : ${query2}`);
                const data = await this.connection.query(query2, [nSesid, startInd]);
            }
            catch (error) {
                this.printQuerylog(`${commandCounter} : Failed to rearrage Lines data in feed: ${JSON.stringify(error)}`);
            }
            resolve(true);
        });
    }
    async feedUpdate(nSesid, line_index, timestamp, line_number, page_number, formate, data) {
        if (!nSesid) {
            console.log(`Failed to update data in feed: nSesid is required`);
            return null;
        }
        this.commandCounter++;
        this.queue.push(async () => {
            await this.updateFeedDataToSql(nSesid, line_index, timestamp, line_number, page_number, formate, data, this.commandCounter);
        });
        return true;
    }
    async updateFeedDataToSql(nSesid, line_index, timestamp, line_number, page_number, formate, data, commandCounter) {
        await new Promise(async (resolve, reject) => {
            try {
                this.printQuerylog(`${commandCounter} :  ${JSON.stringify([nSesid, line_index || 0, timestamp || '', line_number || 0, page_number || 0, formate || '', JSON.stringify(data || []) || '[]', new Date().toISOString(), null])}`);
                const validateQuery = `select * from feed where nSesid = ? and line_index = ?`;
                this.printQuerylog(`${commandCounter} : ${validateQuery}`);
                const list = await this.connection.query(validateQuery, [nSesid, line_index]) || [];
                if (list?.length > 0) {
                    const updateQuery = `update feed set line_index = ?, timestamp = ?, line_number = ?, page_number = ?, formate = ?, data = ? ,updated_at = ? where nSesid = ? and line_index = ?`;
                    this.printQuerylog(`${commandCounter} : ${updateQuery}`);
                    await this.connection.query(updateQuery, [line_index || 0, timestamp || '', line_number || 0, page_number || 0, formate || '', JSON.stringify(data || []) || '[]', new Date().toISOString(), nSesid, line_index]);
                }
                else {
                    const insertQuery = ` INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number, formate, data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                    this.printQuerylog(`${commandCounter} : ${insertQuery}`);
                    await this.connection.query(insertQuery, [
                        nSesid,
                        line_index || 0,
                        timestamp || '',
                        line_number || 0,
                        page_number || 0,
                        formate || '',
                        JSON.stringify(data || []) || '[]',
                        new Date().toISOString(), null
                    ]);
                }
            }
            catch (error) {
                console.error(`Failed to update data in feed:`, error);
                this.printQuerylog(`${commandCounter} : Failed to update data in feed:`);
            }
            resolve(true);
        });
    }
    async onModuleInit() {
    }
    async insertRefreshType() {
        const refreshType = await this.get('refreshtype', '1=1', []);
        if (refreshType?.length === 0) {
            this.insert('refreshtype', { cType: 'all' });
        }
    }
    printQuerylog(logdata) {
        try {
            const log_msg = `${logdata}\n\r\n\r\n\r\n`;
            fs.appendFile('query_log.txt', log_msg + '\n', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                }
            });
        }
        catch (error) {
            console.log('ERROR', error);
        }
    }
    async insertOrUpdateFeedById(id, nSesid, line_index, timestamp, line_number, page_number, formate, data) {
        if (!nSesid) {
            console.error(`Failed to insert/update data in feed: nSesid is required`);
            return null;
        }
        try {
            let insertedOrUpdatedId = null;
            if (id) {
                const existingRecord = await this.connection.query(`SELECT id FROM feed WHERE id = ?`, [id]);
                if (existingRecord.length > 0) {
                    const updateQuery = `
            UPDATE feed SET
              nSesid = ?,
              line_index = ?,
              timestamp = ?,
              line_number = ?,
              page_number = ?,
              formate = ?,
              data = ?,
              updated_at = ?
            WHERE id = ?
          `;
                    await this.connection.query(updateQuery, [
                        nSesid,
                        line_index || 0,
                        timestamp || '',
                        line_number || 0,
                        page_number || 0,
                        formate || '',
                        JSON.stringify(data) || '[]',
                        new Date().toISOString(),
                        id,
                    ]);
                    insertedOrUpdatedId = id;
                }
                else {
                    id = null;
                }
            }
            if (!id) {
                const insertQuery = `
          INSERT INTO feed (nSesid, line_index, timestamp, line_number, page_number, formate, data, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
        `;
                await this.connection.query(insertQuery, [
                    nSesid,
                    line_index || 0,
                    timestamp || '',
                    line_number || 0,
                    page_number || 0,
                    formate || '',
                    JSON.stringify(data) || '[]',
                    new Date().toISOString(),
                ]);
                const result = await this.connection.query('SELECT last_insert_rowid() AS id');
                insertedOrUpdatedId = result[0]?.id;
            }
            return insertedOrUpdatedId;
        }
        catch (error) {
            console.error(`Failed to insert/update data in feed:`, error);
            return null;
        }
    }
    async deleteFeedLine(id) {
        if (!id) {
            console.error(`Failed to delete data from feed: nSesid is required`);
            return false;
        }
        try {
            const query = `DELETE FROM feed WHERE id = ?`;
            this.utilityService.fileLog('deletequery_log', '\n' + query + ' ' + id, "deletequery_log");
            await this.connection.query(query, [id]);
            return true;
        }
        catch (error) {
            console.error(`Failed to delete data from feed:`, error);
            return false;
        }
    }
    async insertCodeMaster() {
        try {
            const codemasterData = await this.get('Codemaster', '1=1', []);
            if (codemasterData?.length === 0) {
                const response = await this.makePostRequest('codemastersdata', {});
                if (!response?.length)
                    return;
                this.insertMany('Codemaster', response);
                console.log('Codemaster data inserted');
            }
            else {
                console.log('Codemaster data already exists, skipping insertion');
            }
        }
        catch (error) {
            console.log('insert codemaster error', error);
        }
    }
    async insertServer() {
        try {
            const serverlist = await this.get('servers');
            if (serverlist.length === 0) {
                this.insert('servers', {
                    nUserid: 0,
                    cName: 'Live',
                    cUrl: `${this.config.get('LIVE_IP')}`,
                    nPort: this.config.get('LIVE_PORT')
                });
            }
        }
        catch (error) {
            console.log('Failed to create');
        }
    }
    async insertUser() {
        try {
            const users = await this.get('users');
            if (!users?.length)
                this.insert('users', {
                    cFname: 'etabella',
                    cLname: '',
                    nUserid: this.config.get('DEFAULT_USER_ID'),
                    cEmail: `${this.config.get('DEFAULT_EMAIL')}`,
                    cIsvarify: 'Y',
                    isAdmin: 1
                });
        }
        catch (error) {
        }
    }
    async makePostRequest(apipath, body) {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/sync/' + apipath);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), body));
            return response.data ? response.data : { msg: -1, value: 'Failed' };
        }
        catch (error) {
            console.error('Failed to post data to:', apipath, error?.message);
            return { msg: -1, value: 'Failed' };
        }
    }
    async backupTableToCSV(tableName, filePath) {
        const query = `SELECT * FROM ${tableName}`;
        try {
            this.ensureDirectoryExists(filePath);
            const rows = await this.connection.query(query);
            if (!rows || rows.length === 0) {
                console.log(`No data found in table: ${tableName}`);
                return;
            }
            const csvContent = this.convertRowsToCSV(rows);
            await (0, util_1.promisify)(fs.writeFile)(filePath, csvContent, 'utf-8');
            console.log(`Backup successful: Data from ${tableName} saved to ${filePath}`);
        }
        catch (error) {
            console.error(`Failed to back up table ${tableName} to CSV:`, error);
        }
    }
    convertRowsToCSV(rows) {
        if (rows.length === 0)
            return '';
        const headers = Object.keys(rows[0]).join(',');
        const csvRows = rows.map(row => Object.values(row).map(value => (value !== null ? `"${value}"` : '')).join(','));
        return [headers, ...csvRows].join('\n');
    }
    ensureDirectoryExists(filePath) {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Directory created: ${dir}`);
        }
    }
    async sysnLogSession() {
        try {
            const rows = await this.getCustomQuery(`select * from logsession`, []);
            if (!rows?.length) {
                this.insert('logsession', {
                    cSession: this.generateRandomId(12)
                });
            }
        }
        catch (error) {
        }
    }
    generateRandomId(length = 8) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let randomId = '';
        for (let i = 0; i < length; i++) {
            randomId += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return randomId;
    }
};
exports.SqllitedbService = SqllitedbService;
exports.SqllitedbService = SqllitedbService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectConnection)()),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_2.Connection !== "undefined" && typeorm_2.Connection) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof sqlite_table_creation_service_1.SqliteTableCreationService !== "undefined" && sqlite_table_creation_service_1.SqliteTableCreationService) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _e : Object, typeof (_f = typeof uuid_service_1.UuidService !== "undefined" && uuid_service_1.UuidService) === "function" ? _f : Object])
], SqllitedbService);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/typeorm");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("typeorm");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("fs");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const fsp = __webpack_require__(13);
const path = __webpack_require__(14);
const util_1 = __webpack_require__(15);
const levenshtein = __webpack_require__(16);
const moment = __webpack_require__(17);
const event_emitter_1 = __webpack_require__(18);
const Fuse = __webpack_require__(19);
let UtilityService = class UtilityService {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        this.failedSessionPages = [];
        this.logger = new common_1.Logger('utility-service');
        this.pattern = /\x0F.*?\x0C[^\s]*/;
        this.customPattern = /y([0-9A-Fa-f]+)z/g;
        this.writeFileAsync = (0, util_1.promisify)(fs.writeFile);
        this.readFileAsync = (0, util_1.promisify)(fs.readFile);
    }
    getFaildSession() {
        return this.failedSessionPages;
    }
    setFaildSession(sessionData, currentSession) {
        this.failedSessionPages = sessionData;
        this.saveFailedPage(this.failedSessionPages, currentSession);
    }
    async onApplicationBootstrap() {
        this.failedSessionPages = [];
        try {
            const data = await this.readJsonFromFile('faileddata/data.json');
            if (data && data.length) {
                this.failedSessionPages = data;
            }
        }
        catch (error) {
            this.logger.error('Error reading failed data:', error);
        }
    }
    getRT() {
        return `\x0F${new Date().getFullYear()}${("0" + (new Date().getMonth() + 1)).slice(-2)}${("0" + new Date().getDate()).slice(-2)}\x0C`;
    }
    pageNoReplace(str) {
        return str.replace(this.pattern, "");
    }
    matchPattern(str) {
        return this.pattern.test(str);
    }
    getIndianTM() {
        return new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }
    getDate() {
        const date = new Date();
        const utc = date.getTime() + date.getTimezoneOffset() * 60000;
        const result = new Date(utc + 3600000 * +5.5);
        return `${result.getFullYear()}-${("0" + (result.getMonth() + 1)).slice(-2)}-${("0" + result.getDate()).slice(-2)}`;
    }
    async fileLog(nm, val, lgName) {
        try {
            val = val.replace(/\n/g, `\n${this.getIndianTM()}  -  `);
            const dt1 = this.getDate();
            const name = `file${nm}_${lgName}`;
            const dir = './logs';
            if (!fs.existsSync(dir)) {
                await fsp.mkdir(dir, { recursive: true });
            }
            await fsp.appendFile(`${dir}/${dt1}_${name}.txt`, val);
        }
        catch (error) {
            this.logger.error('Error log:', error);
        }
    }
    async writeJSONToFile(obj, filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const dirPath = path.dirname(fullPath);
            await fsp.mkdir(dirPath, { recursive: true });
            const jsonData = JSON.stringify(obj, null, 2);
            await fsp.writeFile(fullPath, jsonData);
        }
        catch (err) {
            this.logger.error('Error writing file:', err);
        }
    }
    replaceCustomPattern(input) {
        return input.replace(this.customPattern, "\n");
    }
    async saveData(data, currentSession, filename) {
        await this.writeJSONToFile({ d: data }, `data/sessions${currentSession}/${filename}.json`);
    }
    async markFailedPage(data, currentSession) {
        try {
            if (!currentSession)
                return;
            let obj = this.failedSessionPages.find((session) => session.nSesid == currentSession);
            if (obj) {
                if (!obj.d.includes(data.p)) {
                    obj.d.push(data.p);
                }
            }
            else {
                this.failedSessionPages.push({ nSesid: currentSession, d: [data.p] });
            }
        }
        catch (error) {
            this.logger.error('Error marking failed page:', error);
        }
        this.saveFailedPage(this.failedSessionPages, currentSession);
    }
    async saveFailedPage(datas, currentSession) {
        await this.writeJSONToFile(datas, `faileddata/data.json`);
    }
    async saveJsonToFile(data, filePath) {
        try {
            const jsonData = JSON.stringify(data, null, 2);
            await this.writeFileAsync(filePath, jsonData, 'utf8');
            return { msg: 1, value: 'Data saved successfully.' };
        }
        catch (error) {
            this.logger.error('Error writing JSON to file:', error);
            return { msg: -1, value: 'Data saved failed.' + JSON.stringify(error) };
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
    findCurrentSessionId(sessions) {
        const now = moment();
        let latestSession = null;
        let latestTime = null;
        for (const session of sessions) {
            if (session.cStatus == 'R') {
                latestSession = session.nSesid;
                break;
            }
            ;
        }
        return latestSession;
    }
    convertToProperDateFormat(dateString) {
        const regex = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})\s*(AM|PM)$/i;
        const match = dateString.match(regex);
        if (!match) {
            return '';
        }
        let [_, datePart, hours, minutes, meridian] = match;
        hours = parseInt(hours, 10);
        minutes = parseInt(minutes, 10);
        if (meridian.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
        }
        else if (meridian.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
        }
        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        return `${datePart}T${formattedHours}:${formattedMinutes}:00`;
    }
    getCurrentTimezone() {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
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
        const normQuotes = (s) => s.replace(/[\u2018\u2019]/g, "'");
        const destOriginal = normQuotes(destinationText);
        const search = normQuotes(searchText).trim().replace(/'{2,}/g, "'");
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const whitespaceFlexible = escaped.replace(/\s+/g, "\\s+");
        const re = new RegExp(whitespaceFlexible, "i");
        const m = re.exec(destOriginal);
        if (m) {
            return { startIndex: m.index, endIndex: m.index + m[0].length };
        }
        const dest = destOriginal.toLowerCase();
        const query = search.toLowerCase();
        let bestStart = -1, bestEnd = -1, minDistance = Infinity;
        const L = query.length;
        const slack = Math.max(2, Math.floor(L * 0.3));
        const minW = Math.max(1, L - slack);
        const maxW = Math.min(dest.length, L + slack);
        for (let w = minW; w <= maxW; w++) {
            for (let i = 0; i + w <= dest.length; i++) {
                const sub = dest.substring(i, i + w);
                const d = levenshtein.get(query, sub);
                if (d < minDistance) {
                    minDistance = d;
                    bestStart = i;
                    bestEnd = i + w;
                }
            }
        }
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
    parseTimeFormate(formate) {
        if (formate) {
            const date = new Date();
            const frmArry = formate.split(':').map(Number);
            date.setHours(frmArry[0] || 0, frmArry[1] || 0, frmArry[2] || 0, frmArry[3] || 0);
            return date.getTime();
        }
        else {
            return null;
        }
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
        try {
            array.map((line, index) => line[2] = index);
        }
        catch (error) {
        }
    }
    emitEvent(topic, data) {
        this.eventEmitter.emit(topic, data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof event_emitter_1.EventEmitter2 !== "undefined" && event_emitter_1.EventEmitter2) === "function" ? _a : Object])
], UtilityService);


/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("fast-levenshtein");

/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("@nestjs/event-emitter");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("fuse.js");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SqliteTableCreationService = void 0;
const common_1 = __webpack_require__(3);
const typeorm_1 = __webpack_require__(9);
const table_queries_1 = __webpack_require__(21);
let SqliteTableCreationService = class SqliteTableCreationService {
    constructor(connection) {
        this.connection = connection;
    }
    async createTablesAndViews() {
        console.log('Creating tables and views...');
        for (const [tableName, query] of Object.entries(table_queries_1.tableQueries)) {
            try {
                console.log(`Creating table or view: ${tableName}`);
                await this.connection.query(query);
            }
            catch (error) {
                console.error(`Error creating table ${tableName}:`, error);
            }
        }
        console.log('Tables and views created successfully');
    }
};
exports.SqliteTableCreationService = SqliteTableCreationService;
exports.SqliteTableCreationService = SqliteTableCreationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof typeorm_1.Connection !== "undefined" && typeorm_1.Connection) === "function" ? _a : Object])
], SqliteTableCreationService);


/***/ }),
/* 21 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.tableQueries = void 0;
exports.tableQueries = {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        cFname TEXT NOT NULL,
        cLname TEXT NOT NULL,
        nUserid TEXT NOT NULL,
        cEmail TEXT NOT NULL,
        cIsvarify TEXT NOT NULL,
        isAdmin BOOLEAN NOT NULL DEFAULT 0,
        UNIQUE (cEmail) -- Add a unique constraint on the combination
      )
    `,
    sessions: `
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        nUserid TEXT NOT NULL,
        nSesid INTEGER,
        nRTSid TEXT,
        cName TEXT NOT NULL,
        cUnicuserid TEXT,
        cCaseno TEXT NOT NULL,
        dStartDt TEXT NOT NULL,
        nDays INTEGER NOT NULL,
        nLines INTEGER NOT NULL,
        nPageno INTEGER NOT NULL,
        nLSesid TEXT,
        cTimezone TEXT NOT NULL,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        isFeedSynced BOOLEAN NOT NULL DEFAULT 0,
        cStatus TEXT NOT NULL,
        isTranscript BOOLEAN NOT NULL DEFAULT 0,
        nCaseid TEXT,
        isUsersSynced BOOLEAN NOT NULL DEFAULT 0,
        cProtocol TEXT NOT NULL,
        bRefresh BOOLEAN DEFAULT 0
      )
    `,
    sessiondetail: `CREATE TABLE IF NOT EXISTS RSessionDetail
  (
      nSDid TEXT PRIMARY KEY,
      nSesid TEXT,
      nUserid TEXT,
      cUsertype varchar(2),
      dDelDt timestamp,
      cDefHIssues TEXT,
      nLID TEXT,
      cDefIssues TEXT,
      nLIid TEXT,
      isSynced BOOLEAN NOT NULL DEFAULT 0,
      nRefSDid integer,
      UNIQUE (nSesid,nUserid) -- Add a unique constraint on the combination
  )
  `,
    servers: `
      CREATE TABLE IF NOT EXISTS servers (
        id TEXT PRIMARY KEY,
        nUserid TEXT NOT NULL,
        cName TEXT NOT NULL,
        cUrl TEXT NOT NULL,
        nPort INTEGER NOT NULL
      )
    `,
    logsession: `
    CREATE TABLE IF NOT EXISTS logsession (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cSession TEXT NOT NULL
    )
  `,
    refreshtype: `
    CREATE TABLE IF NOT EXISTS refreshtype (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cType TEXT NOT NULL
    )
  `,
    assignment: `
      CREATE TABLE IF NOT EXISTS assignment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        cUsers TEXT NOT NULL
      )
    `,
    casedetail: `
      CREATE TABLE IF NOT EXISTS CaseDetail (
        nCaseid TEXT PRIMARY KEY,
        cCasename TEXT NOT NULL,
        cCaseno TEXT NOT NULL,
        cClaimant TEXT NOT NULL,
        cRespondent TEXT NOT NULL,
        cIndexheader TEXT NOT NULL,
        cDesc TEXT NOT NULL,
        cTClaimant TEXT NOT NULL,
        cTRespondent TEXT NOT NULL
      )`,
    feed: `
      CREATE TABLE IF NOT EXISTS feed (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        line_index INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        line_number INTEGER NOT NULL,
        page_number INTEGER NOT NULL,
        formate TEXT NOT NULL,
        created_at TEXT NOT NULL,
        data TEXT NOT NULL,
        updated_at TEXT
      )`,
    deletesessions: `
      CREATE TABLE IF NOT EXISTS deletesessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nSesid TEXT NOT NULL,
        nLSesid INTEGER NOT NULL
      )
    `,
    issueCategory: `
      CREATE TABLE IF NOT EXISTS IssueCategory (
        nICid TEXT PRIMARY KEY,
        nRefICid INTEGER,
        nCaseid TEXT,
        cCategory VARCHAR(200),
        nUserid TEXT,
        dCreateDt TIMESTAMP,
        dUpdateDt TIMESTAMP,
        cICtype VARCHAR(1),
        nOICid INTEGER,
        isSynced BOOLEAN NOT NULL DEFAULT 0
      )
    `,
    rIssueMaster: `
      CREATE TABLE IF NOT EXISTS RIssueMaster (
        nIid TEXT PRIMARY KEY,
        cIName VARCHAR(500),
        cColor VARCHAR(6),
        nICid TEXT,
        dCreatedt TIMESTAMP,
        nUserid TEXT,
        dUpdatedt TIMESTAMP,
        nCaseid TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefIid INTEGER
      )
    `,
    rIssueDetail: `
      CREATE TABLE IF NOT EXISTS RIssueDetail (
        nIDid TEXT PRIMARY KEY,
        cNote TEXT,
        cUNote TEXT,
        nSessionid INTEGER,
        nCaseid TEXT,
        cPageno VARCHAR(50),
        jCordinates JSON,
        jOCordinates JSON,
        nUserid TEXT,
        dCreatedt TIMESTAMP,
        dUpdatedt TIMESTAMP,
        cONote TEXT,
        nLID TEXT,
        jTCordinates JSON,
        cTPageno VARCHAR(50),
        bTrf BOOLEAN DEFAULT 0,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefIDid INTEGER
      )
    `,
    rIssueDetailLog: `
      CREATE TABLE IF NOT EXISTS RIssueDetailLog (
        nId INTEGER PRIMARY KEY AUTOINCREMENT,
        nIDid TEXT,
        cONote TEXT,
        jCordinates JSON,
        jDCordinates JSON,
        nRefresh INTEGER,
        dCreatedt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    rIssueMapid: `
      CREATE TABLE IF NOT EXISTS RIssueMapid (
        nMapid TEXT PRIMARY KEY,
        nIDid TEXT,
        nIid TEXT,
        nRelid SMALLINT,
        nImpactid SMALLINT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefMapid INTEGER,
        serialno INTEGER
      )
    `,
    rHighlights: `
      CREATE TABLE IF NOT EXISTS RHighlights (
        nHid TEXT PRIMARY KEY,
        cNote TEXT,
        jCordinates JSON,
        nCaseid TEXT,
        nSessionId INTEGER,
        nUserid TEXT,
        dCreatedt TEXT,
        cPageno VARCHAR(10),
        cLineno VARCHAR(5),
        cOPageno VARCHAR(10),
        cOLineno VARCHAR(5),
        cTPageno VARCHAR(10),
        cTLineno VARCHAR(10),
        cTime VARCHAR(10),
        cTTime VARCHAR(30),
        nLID TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefHid INTEGER,
        oP INTEGER,
        oL INTEGER,
        identity TEXT
      )
    `,
    rHighlightsLog: `
        CREATE TABLE IF NOT EXISTS RHighlightsLog (
          nHLogid INTEGER PRIMARY KEY AUTOINCREMENT,
          nHid TEXT,
          cPageno VARCHAR(10),
          cLineno VARCHAR(5),
          cTime VARCHAR(10),
          nRefresh INTEGER,
          dCreateDt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `,
    rHighlightMapid: `
      CREATE TABLE IF NOT EXISTS RHighlightMapid (
        nMapid TEXT PRIMARY KEY,
        nHid TEXT,
        nIid TEXT,
        isSynced BOOLEAN NOT NULL DEFAULT 0,
        nRefMapid INTEGER,
        serialno INTEGER
      )
    `,
    rtlogs: `
        CREATE TABLE IF NOT EXISTS RTLogs (
          nRTLid INTEGER PRIMARY KEY AUTOINCREMENT,
          nUserid TEXT,
          nSesid TEXT,
          cStatus VARCHAR(2),
          dCreateDt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          cSource VARCHAR(1),
          isSynced BOOLEAN NOT NULL DEFAULT 0,
          dLeaveDt TIMESTAMP,
          nRefRTLid INTEGER
        )
      `,
    codemaster: `
      CREATE TABLE IF NOT EXISTS Codemaster (
        nCodeid INTEGER,
        nCategoryid INTEGER,
        cCodename VARCHAR(100),
        nSerialno SMALLINT,
        nParentcodeid INTEGER,
        nUserid TEXT,
        jOther TEXT,
        jParents TEXT
      )
    `,
    caseusers: `
        CREATE TABLE IF NOT EXISTS caseusers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nCaseid TEXT,
          nUserid TEXT,
          UNIQUE (nCaseid, nUserid) -- Add a unique constraint on the combination
        )
      `,
    rIssueSummaryView: `
      CREATE VIEW IF NOT EXISTS RIssuesummary AS
      SELECT 
        rd.nIDid,
        rd.cNote,
        rd.nSessionid,
        rd.nCaseid,
        rd.cPageno,
        rd.jCordinates,
        rd.nUserid,
        rd.dCreatedt,
        rd.dUpdatedt,
        rd.cONote,
        COUNT(*) AS nICount,
        json_group_array(json_object('nIid', rm.nIid, 'nRelid', rm.nRelid, 'nImpactid', rm.nImpactid , 'serialno' , coalesce(rm.serialno,0) )) AS cIid,
        im.cColor,
        rd.jTCordinates,
        rd.cTPageno,
        rd.bTrf,
        rd.cUNote,
        rd.jOCordinates
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      LEFT JOIN RIssueMaster im ON im.nIid = rd.nLID
      GROUP BY 
        rd.nIDid, 
        rd.cNote, 
        rd.nSessionid, 
        rd.nCaseid, 
        rd.cPageno, 
        rd.jCordinates, 
        rd.nUserid, 
        rd.dCreatedt, 
        rd.dUpdatedt, 
        rd.cONote, 
        im.cColor, 
        rd.jTCordinates, 
        rd.cTPageno,
        rd.cUNote,
        rd.jOCordinates;
    `,
    issueDetailCountView: `
      CREATE VIEW IF NOT EXISTS issue_detail_count AS
      SELECT 
        rm.nIid,
        group_concat(rm.nIDid, ',') AS string_agg,
        count(DISTINCT rm.nIDid) AS nTotalID,
        rd.nCaseid,
        rd.nUserid,
        rd.nSessionid
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      GROUP BY rm.nIid, rd.nCaseid, rd.nUserid, rd.nSessionid;
    `, sync_log: `
      CREATE TABLE IF NOT EXISTS sync_log (
        table_name text, row_id int, operation text, last_modified timestamp default current_timestamp
      )`,
    delete_log: `
      CREATE TABLE IF NOT EXISTS delete_log (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          table_name TEXT NOT NULL,
          deleted_id INTEGER NOT NULL,
          isSynced BOOLEAN NOT NULL DEFAULT 0,
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      `,
    log_issuecategory_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_issuecategory_deletion
      AFTER DELETE ON IssueCategory
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'IssueCategory', OLD.nRefICid
        WHERE OLD.nRefICid > 0;
      END;
    `,
    log_rissuemaster_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuemaster_deletion
      AFTER DELETE ON RIssueMaster
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueMaster', OLD.nRefIid
        WHERE OLD.nRefIid > 0;
      END;
    `,
    log_rissuedetail_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuedetail_deletion
      AFTER DELETE ON RIssueDetail
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueDetail', OLD.nRefIDid
        WHERE OLD.nRefIDid > 0;
      END;
    `,
    log_rissuemapid_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rissuemapid_deletion
      AFTER DELETE ON RIssueMapid
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RIssueMapid', OLD.nRefMapid
        WHERE OLD.nRefMapid > 0;
      END;
    `,
    log_rhighlights_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rhighlights_deletion
      AFTER DELETE ON RHighlights
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RHighlights', OLD.nRefHid
        WHERE OLD.nRefHid > 0;
      END;
    `,
    log_rhighlightmapid_deletion: `
      CREATE TRIGGER IF NOT EXISTS log_rhighlightmapid_deletion
      AFTER DELETE ON RHighlightMapid
      FOR EACH ROW
      BEGIN
        INSERT INTO delete_log (table_name, deleted_id) 
        SELECT 'RHighlightMapid', OLD.nRefMapid
        WHERE OLD.nRefMapid > 0;
      END;
    `
};


/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("@nestjs/axios");

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
exports.UuidService = void 0;
const common_1 = __webpack_require__(3);
const { v4: uuidv4 } = __webpack_require__(26);
let UuidService = class UuidService {
    generateUUID() {
        return uuidv4();
    }
};
exports.UuidService = UuidService;
exports.UuidService = UuidService = __decorate([
    (0, common_1.Injectable)()
], UuidService);


/***/ }),
/* 26 */
/***/ ((module) => {

module.exports = require("uuid");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConnectivityService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(22);
const socket_io_1 = __webpack_require__(28);
let ConnectivityService = class ConnectivityService {
    constructor(ios, config) {
        this.ios = ios;
        this.config = config;
        this.serverUrl = `${this.config.get('LIVE_SERVER')}`;
        this.online = false;
        this.connect();
    }
    connect() {
    }
};
exports.ConnectivityService = ConnectivityService;
exports.ConnectivityService = ConnectivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], ConnectivityService);


/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("socket.io");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionService = void 0;
const axios_1 = __webpack_require__(24);
const common_1 = __webpack_require__(3);
const rxjs_1 = __webpack_require__(23);
const date_time_service_1 = __webpack_require__(30);
const utility_service_1 = __webpack_require__(12);
const scheduler_service_1 = __webpack_require__(32);
const socket_io_1 = __webpack_require__(28);
const fs_1 = __webpack_require__(11);
const fso = __webpack_require__(11);
const util_1 = __webpack_require__(15);
const path = __webpack_require__(14);
const config_1 = __webpack_require__(22);
const sqllitedb_service_1 = __webpack_require__(7);
const issue_service_1 = __webpack_require__(34);
const log_service_1 = __webpack_require__(39);
const db_service_1 = __webpack_require__(36);
const unic_identity_service_1 = __webpack_require__(42);
const verify_tabs_service_1 = __webpack_require__(44);
let SessionService = class SessionService {
    setServer(server) {
        this.server = server;
    }
    constructor(httpService, ios, dt, utility, schedulerService, config, dblite, issueService, log, db, unicIdentity, verifytab) {
        this.httpService = httpService;
        this.ios = ios;
        this.dt = dt;
        this.utility = utility;
        this.schedulerService = schedulerService;
        this.config = config;
        this.dblite = dblite;
        this.issueService = issueService;
        this.log = log;
        this.db = db;
        this.unicIdentity = unicIdentity;
        this.verifytab = verifytab;
        this.sessionsList = [];
        this.currentSessionid = null;
        this.currentSessionDetail = {};
        this.currentSessionLines = 0;
        this.currentSessionHaveRefresh = true;
        this.nUserid = null;
        this.CurrentJob = this.reInitVariables();
        this.readFileAsync = (0, util_1.promisify)(fso.readFile);
        this.protocol = 'C';
        this.caseTabs = [];
        this.current_refresh = 0;
        this.refreshType = 'all';
        this.schema = 'realtime';
        this.logger = new common_1.Logger('sync-service');
    }
    async onApplicationBootstrap() {
    }
    async reInitSessions(flgs) {
        return false;
    }
    reInitVariables() {
        console.log('Clearing session');
        return {
            id: null,
            ind: 0,
            globalBuffer: [],
            lineBuffer: [],
            crLine: [],
            lineCount: 0,
            timestamps: [],
            currentPage: 1,
            LastKey: null,
            relaceLines: [],
            currentLineNumber: 1
        };
    }
    async allCurrentSessionData(id) {
    }
    async getLastPageData(sesid) {
        try {
            const lastPageFile = `allsession.json`;
            const data = await fs_1.promises.readFile(path.join(`data/sessions${sesid}`, lastPageFile), 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    async readGlobalFile(sesid) {
        try {
            const lastPageFile = `globalbuffer.json`;
            const data = await fs_1.promises.readFile(path.join(`data/sessions${sesid}`, lastPageFile), 'utf8');
            return JSON.parse(data);
        }
        catch (error) {
            return {};
        }
    }
    async getUserid() {
        return this.nUserid;
    }
    setRunningId() {
    }
    getCurrentSession() {
        return this.currentSessionid;
    }
    getCurrentSessionProtocol(id) {
        let ojs = this.sessionsList.find(a => a.nSesid == id);
        if (ojs) {
            return ojs?.cProtocol;
        }
        return '';
    }
    async getTodaySessions(params) {
        try {
            const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
            const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);
            if (res?.success) {
                const list = res.data[0];
                if (list && list.length) {
                    for (const session of list) {
                        if (session.dStartDt.toString().includes('AM') || session.dStartDt.toString().includes('PM')) {
                            session.dStartDt = this.utility.convertToProperDateFormat(session.dStartDt);
                        }
                        ;
                    }
                    return list;
                }
                return [];
            }
            else {
                this.logger.error('Failed to fetch sessions:', res.error);
                return [];
            }
        }
        catch (error) {
            console.error('Failed to fetch data:');
            return [];
        }
    }
    async getSessionsServers(nCaseid) {
        try {
            const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
            const res = await this.db.executeRef('session_servers', { cSessionUnicId, nCaseid }, this.schema);
            if (res.success) {
                try {
                    return res.data[0];
                }
                catch (error) {
                    this.logger.error(`Session end failed :${res.error} `);
                    return [];
                }
            }
            else {
                this.logger.error(`Session end failed :${res.error} `);
                return [];
            }
        }
        catch (error) {
            console.error('Failed to fetch data for : /session/todayservers');
            return [];
        }
    }
    async postCreateUsers(cUnicuserid) {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/session/CreateUser');
            const requestBody = { cUnicuserid };
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), requestBody));
            return response.data;
        }
        catch (error) {
            console.error('Failed to post data to: /session/createUser', error?.message);
            return [];
        }
    }
    async insertConnectivityLog(param) {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/session/insertConnetivityLog');
            const requestBody = param;
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), requestBody));
            return response.data;
        }
        catch (error) {
            console.error('Failed to post data to: /session/insertConnetivityLog');
            return [];
        }
    }
    async checkForSessionChange(id) {
        try {
            this.CurrentJob = this.reInitVariables();
            return [];
        }
        catch (error) {
            console.error('Failed to post data to: /session/insertConnetivityLog');
            return [];
        }
    }
    async makeGetRequest(url, params) {
        try {
            const dynamicUrl = new URL(url);
            Object.keys(params).forEach(key => dynamicUrl.searchParams.append(key, params[key]));
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(dynamicUrl.toString()));
            return response.data;
        }
        catch (error) {
            console.error('Failed to get data from:', url, error);
            return { error: 'Failed to fetch data', details: error.message };
        }
    }
    async makePostRequest(url, body) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), body, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': '*/*'
                }
            }));
            return response.data;
        }
        catch (error) {
            console.error('Failed to post data to:', url, error?.message);
            return { error: 'Failed to post data', details: error.message };
        }
    }
    getLiveId(sessionId) {
        const obj = this.sessionsList.find(a => a.id == sessionId);
        if (obj) {
            return obj.nLSesid;
        }
        return 0;
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
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);
        if (!res?.success) {
            return { msg: -1, value: 'Failed to fetch sessions', error: res.error };
        }
        const sessionls = res.data[0] || [];
        if (!sessionls?.length) {
            return { msg: -1, value: "Session Not Synced" };
        }
        const nSesid = sessionls[0]["nSesid"];
        const path = `${this.config.get('TRANS_LOCAL_PATH')}s_${nSesid}.json`;
        try {
            if (!fso.existsSync(path)) {
                return { msg: -1 };
            }
            const data = await this.readJsonFromFile(path);
            return { msg: 1, data };
        }
        catch (error) {
        }
        return { msg: -1 };
    }
    async getFiledata(body) {
        try {
            let res = await this.db.executeRef('get_filedata', body);
            if (res?.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed to fetch', error: error?.message };
        }
    }
    async getDocinfo(query) {
        let res = await this.db.executeRef('individual_doc_info', query);
        if (res?.success) {
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
    async loadActiveSessionDetail(nCaseid, nSesid = null) {
        debugger;
        if (!nCaseid) {
            this.logger.error('nCaseid not found ');
            this.logger.verbose(`\n\n\ ACTIVE SESSION DETAIL id:${this.currentSessionid}, lines:${this.currentSessionLines}, protocol: ${this.protocol} \n\r`);
            return;
        }
        try {
            const detail = await this.getSessionDetail(nCaseid);
            this.utility.emitEvent('socket.server.connect', { nCaseid: nCaseid });
            if (detail) {
                if (detail.nSesid != this.currentSessionid) {
                    this.currentSessionDetail = detail;
                    this.logger.verbose(`Changing session oldSession :${this.currentSessionid}`);
                    this.protocol = this.getCurrentSessionProtocol(detail.nSesid);
                    this.logger.fatal('Session Detail', this.currentSessionDetail);
                    this.CurrentJob = this.reInitVariables();
                    this.checkForSessionChange(detail.nSesid);
                    this.utility.emitEvent('command.parser.value', { data: [] });
                    this.utility.emitEvent('bridge.data.cmd.event', { data: [] });
                    this.current_refresh = 0;
                    this.currentSessionid = detail.nSesid;
                    this.logger.verbose(`Current SessionId is ${this.currentSessionid}`);
                    this.currentSessionid = detail.nSesid;
                    this.currentSessionLines = detail.nLines || 25;
                    this.protocol = detail.cProtocol || 'C';
                    this.currentSessionHaveRefresh = true;
                    this.server.emit('session-change', { msg: 1 });
                    if (this.protocol == 'B' && this.currentSessionid) {
                        try {
                            this.verifytab.clearTabs();
                            await this.verifytab.getAllCaseTabs(this.currentSessionid);
                        }
                        catch (error) {
                        }
                        await this.fetchSessionFeedToLocal(this.currentSessionid);
                    }
                }
            }
            else {
                this.logger.error('No running session found');
                this.currentSessionid = null;
            }
        }
        catch (error) {
            this.logger.error('Failed to load current session', error);
        }
        this.logger.verbose(`\n\n\ ACTIVE SESSION DETAIL id:${this.currentSessionid}, lines:${this.currentSessionLines}, protocol: ${this.protocol} \n\r`);
    }
    async getSessionDetail(nCaseid, nSesid = null) {
        let res = await this.db.executeRef('current_active_session', { nCaseid, nSesid }, 'realtime');
        if (res?.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                return null;
            }
        }
        else {
            return null;
        }
    }
    async fetchSessionFeedToLocal(nSesid) {
        try {
            this.utility.emitEvent('session.store.fetchmetadata', { nSesid });
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _a : Object, typeof (_b = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _b : Object, typeof (_c = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object, typeof (_e = typeof scheduler_service_1.SchedulerService !== "undefined" && scheduler_service_1.SchedulerService) === "function" ? _e : Object, typeof (_f = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _f : Object, typeof (_g = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _g : Object, typeof (_h = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _h : Object, typeof (_j = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _j : Object, typeof (_k = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _k : Object, typeof (_l = typeof unic_identity_service_1.UnicIdentityService !== "undefined" && unic_identity_service_1.UnicIdentityService) === "function" ? _l : Object, typeof (_m = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _m : Object])
], SessionService);


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
exports.DateTimeService = void 0;
const common_1 = __webpack_require__(3);
const moment = __webpack_require__(31);
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
/* 31 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 32 */
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
const moment = __webpack_require__(17);
const schedule = __webpack_require__(33);
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
/* 33 */
/***/ ((module) => {

module.exports = require("node-schedule");

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueService = void 0;
const common_1 = __webpack_require__(3);
const sqllitedb_service_1 = __webpack_require__(7);
const query_services_1 = __webpack_require__(35);
const uuid_service_1 = __webpack_require__(25);
const db_service_1 = __webpack_require__(36);
let IssueService = class IssueService {
    constructor(dbLite, db, queryService, uuid) {
        this.dbLite = dbLite;
        this.db = db;
        this.queryService = queryService;
        this.uuid = uuid;
        this.logger = new common_1.Logger('issue-service');
    }
    async handleIssueCategory(body, permission) {
        const parameter = { ...body, cICtype: permission };
        const res = await this.db.executeRef('realtime_handle_issue_category', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue category', error: res.error };
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
            return { msg: -1, value: 'Failed to delete issue category', error: res.error };
        }
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
    async handleIssue(body, permission) {
        const parameter = {
            ...body,
            cPermission: permission,
        };
        const res = await this.db.executeRef('realtime_handle_issue_master', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue', error: res.error };
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
    async deleteIssue(body) {
        const parameter = {
            ...body,
            cPermission: 'D',
        };
        const res = await this.db.executeRef('realtime_handle_issue_master', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue', error: res.error };
        }
    }
    async executeIssueDetailOperation(body, permission) {
        const parameter = permission === 'D' ? { nIDid: body.nIDid, cPermission: permission } : { ...body, cPermission: permission };
        const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue detail', error: res.error };
        }
    }
    async getIssueDetailby_issue_id(body) {
        const params = { ...body, ref: 2 };
        const res = await this.db.executeRef('realtime_issuedetail_by_issueid', params);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
        }
    }
    async getIssueDetailById(body) {
        const res = await this.db.executeRef('realtime_get_issuedetail_by_id', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch realtime_get_issuedetail_by_id', error: res.error };
        }
    }
    async insertHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
        }
    }
    async removemultihighlights(body) {
        const res = await this.db.executeRef('realtime_delete_multiple_rhighlights', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
        }
    }
    async updateHighlightIssueIds(body) {
        const res = await this.db.executeRef('realtime_update_default_h_issue', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle realtime_update_default_h_issue', error: res.error };
        }
    }
    async deleteHighlights(body, permission) {
        const parameter = { ...body, permission: permission };
        const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
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
    async FilterLastSelecedIssued(body) {
        const res = await this.db.executeRef('realtime_filter_last_issue', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to handle realtime_filter_last_issue', error: res.error };
        }
    }
    async getIssueAnnotationList(body) {
        const res = await this.db.executeRef('realtime_get_issue_annotation_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch realtime_get_issue_annotation_list', error: res.error };
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
    async deleteDemoIssueDetails(param) {
        return {};
    }
    async updateIssueDetailNote(param) {
        const res = await this.db.executeRef('realtime_issue_detail_note', param);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to delete issue category', error: res.error };
        }
    }
    async etRealtimeGetIssueAnnotationHighlight(parameter) {
        const params = { ...parameter, ref: 2 };
        const res = await this.db.executeRef('realtime_issuedetail_by_issueid', params);
        if (res.success) {
            return { ref1: res.data[0], ref2: res.data[1] };
            ;
        }
        else {
            return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
        }
    }
    async getIssueDetail(body) {
        try {
            const params = { ...body, ref: 2 };
            const res = await this.db.executeRef('annotations', params, 'realtime');
            if (res.success) {
                return { ref1: res.data[0], ref2: res.data[1] };
                ;
            }
            else {
                return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
            }
        }
        catch (error) {
            console.error('Failed to fetch issue details:', error);
            return { msg: -1, error: error.message };
        }
    }
    async updateIssueDetail(param) {
        const res = await this.db.executeRef('realtime_defaultvalueupdate', param);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to delete issue category', error: res.error };
        }
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
    async getIssueVersions(body) {
        let res = await this.db.executeRef('annot_versions', body, 'realtime');
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
};
exports.IssueService = IssueService;
exports.IssueService = IssueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof query_services_1.QueryService !== "undefined" && query_services_1.QueryService) === "function" ? _c : Object, typeof (_d = typeof uuid_service_1.UuidService !== "undefined" && uuid_service_1.UuidService) === "function" ? _d : Object])
], IssueService);


/***/ }),
/* 35 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueryService = void 0;
const common_1 = __webpack_require__(3);
let QueryService = class QueryService {
    getIssueCategoryQuery() {
        const query = `
      SELECT * FROM (
        SELECT c.nICid, c.cCategory FROM IssueCategory c
        WHERE c.nCaseid = ? AND c.cICtype = 'U'
        UNION ALL
        SELECT ic.nICid, ic.cCategory FROM IssueCategory ic
        WHERE ic.nCaseid = ? AND ic.nUserid = ? AND COALESCE(ic.cICtype, '') != 'U'
      ) dt
      ORDER BY dt.cCategory
    `;
        const params = [];
        return { query };
    }
    getIssueListQuery() {
        const query = `
      SELECT im.nIid, im.cIName, im.cColor, ic.nICid, ic.cCategory, 
             COALESCE(id.nTotalID, 0) AS nTotalID, 
             0 AS nRelid, 0 AS nImpactid, im.nUserid, 
             COUNT(rh.nIid) AS nTotalHID
      FROM RIssueMaster im 
      JOIN IssueCategory ic ON ic.nICid = im.nICid
      LEFT JOIN issue_detail_count id ON id.nIid = im.nIid 
        AND im.nCaseid = id.nCaseid 
        AND im.nUserid = id.nUserid
        AND id.nSessionid = ?
      LEFT JOIN (
        SELECT m.nIid
        FROM RHighlights rh
        JOIN RHighlightMapid m ON m.nHid = rh.nHid
        WHERE rh.nSessionId = ? AND rh.nUserid = ?
      ) rh ON rh.nIid = im.nIid
      WHERE coalesce(ic.nCaseid,'') = coalesce(?,'')
        AND (im.nUserid = ? OR (im.nUserid = 0 AND coalesce(im.nCaseid,'') = coalesce(?,'') ))
      GROUP BY im.nIid, im.cIName, im.cColor, ic.nICid, ic.cCategory, id.nTotalID, im.nUserid
      ORDER BY im.cIName;
    `;
        return { query };
    }
    getPageDataQuery(cTranscript) {
        let pageColumn = cTranscript === 'N' ? '"cPageno"' : '"cTPageno"';
        let lineColumn = cTranscript === 'N' ? '"cLineno"' : '"cTLineno"';
        const query = `
    SELECT json_group_array(
      json_object(
        'nHid', nHid,
        'nGroupid', nGroupid,
        '${lineColumn}', ${lineColumn},
        'issueids', issueids
      )
    ) AS pageData
    FROM (
      SELECT dt.nHid, dt.unique_no AS nGroupid, dt.${lineColumn}, dt.i AS issueids 
      FROM (
        SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, ${pageColumn}, grp) AS unique_no 
        FROM (
          SELECT CAST(${lineColumn} AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(${pageColumn} AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) ORDER BY CAST(${lineColumn} AS INTEGER)) AS grp,  
            ${pageColumn}, ${lineColumn}, m.nHid, group_concat(CAST(m.nIid AS TEXT), ',') AS i
          FROM RHighlights h 
          JOIN RHighlightMapid m ON h.nHid = m.nHid
          WHERE h.nSessionId = ? 
            AND h.nUserid = ? 
            AND h.${pageColumn} = ?
          GROUP BY ${pageColumn}, ${lineColumn}, m.nHid
          ORDER BY m.nHid
        ) dt 
        ORDER BY ${pageColumn}, ${lineColumn}, nHid, i
      ) dt  
      ORDER BY unique_no
    );
  `;
        return { query };
    }
    getHighlightPageDataQueryForLiveFeed() {
        return `  SELECT rh.nHid, 
             cPageno,
            cLineno,
             cTime, cColor, rg.nGroupid, rg.issueids
      FROM RHighlights rh
      LEFT JOIN (
        WITH tbl AS (
          SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
          FROM (
            SELECT CAST(cLineno AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(cPageno AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) 
            ORDER BY CAST(cLineno AS INTEGER)) AS grp, 
            CAST(cPageno AS INTEGER) AS cPageno, CAST(cLineno AS INTEGER) AS cLineno, 
            m.nHid, GROUP_CONCAT(m.nIid, ',') AS i
            FROM RHighlights h
            JOIN (
            select rhm."nIid",rhm."nHid" from RHighlightMapid rhm order by rhm."serialno") m ON h.nHid = m.nHid
            WHERE h.nSessionId = ? AND h.nUserid = ?  AND h.cPageno = ?
            GROUP BY CAST(cPageno AS INTEGER), CAST(cLineno AS INTEGER), m.nHid
            ORDER BY m.nHid
          ) dt
          ORDER BY cPageno, cLineno, nHid, i
        )
        SELECT nHid, unique_no AS nGroupid, i AS issueids
        FROM tbl
        ORDER BY unique_no
      ) rg ON rg.nHid = rh.nHid
      LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
      WHERE  rh.nUserid = ? AND rh.nSessionId = ?`;
    }
    getIssueDetailQuery() {
        const query = `SELECT rd.nIDid, rd.cNote, rd.cPageno, rd.cONote, rl.cCodename AS cRelevance,
             imp.cCodename AS cImpact, rm.nRelid, rm.nImpactid
      FROM RIssueDetail rd
      JOIN RIssueMapid rm ON rm.nIDid = rd.nIDid
      LEFT JOIN Codemaster rl ON rl.nCodeid = rm.nRelid
      LEFT JOIN Codemaster imp ON imp.nCodeid = rm.nImpactid
      WHERE       
      coalesce(rd.nCaseid,'') = coalesce(?,'')
      AND rd.nSessionid = ? AND rd.nUserid = ? AND rm.nIid = ?;`;
        return { query };
    }
    getHightlightGroupQuery() {
        const query = ` WITH tbl AS (
        SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no 
        FROM (
          SELECT cLineno - ROW_NUMBER() OVER (PARTITION BY cPageno ORDER BY cLineno) AS grp, 
                 cPageno, cLineno, m.nHid, GROUP_CONCAT(m.nIid) AS i
          FROM RHighlights h 
          JOIN RHighlightMapid m ON h.nHid = m.nHid
          WHERE h.nSessionId = ? AND h.nUserid = ? AND m.nIid = ?
          GROUP BY cPageno, cLineno, m.nHid
          ORDER BY m.nHid
        ) dt 
        ORDER BY cPageno, cLineno, nHid, i
      )
      SELECT t.unique_no AS nGroupid, t.i AS issueids, json_group_array(json_object('nHid', rh.nHid, 'cNote', rh.cNote, 'cPageno', rh.cPageno, 'cLineno', rh.cLineno)) AS highlights
      FROM tbl t
      JOIN (
        SELECT nHid, cNote, cPageno, cLineno 
        FROM RHighlights
      ) rh ON rh.nHid = t.nHid
      GROUP BY t.unique_no, t.i
      ORDER BY t.unique_no;`;
        return { query };
    }
    getIssueAnnotationListQuery() {
        const query = ` SELECT 
        nIDid,
        cPageno AS pageIndex,
        jCordinates AS cordinates,
        cColor AS color,
        nICount
      FROM RIssuesummary
      WHERE
      coalesce(nCaseid,'') = coalesce(?,'')
      AND nSessionid = ? AND nUserid = ?`;
        return { query };
    }
    getIssueDetailByIdQuery() {
        const query = ` SELECT 
      *
      FROM RIssuesummary
      WHERE nIDid = ?`;
        return { query };
    }
    getCodeMasterQuery() {
        const query = `SELECT 
        nCodeid AS nValue,
        cCodename AS cKey,
        jOther,
        nSerialno
      FROM Codemaster
      WHERE nCategoryid = ?
      ORDER BY nSerialno, cCodename`;
        return { query };
    }
    getHighlightListQuery() {
        const query = `
      SELECT nHid, cPageno, cLineno 
      FROM RHighlights
      WHERE 
        coalesce(nCaseid,'') = coalesce(?,'')
      AND nUserid = ? AND nSessionId = ?`;
        return { query };
    }
    geFilterLastSelecedQuery() {
        const query = `SELECT 
    t.nIid,
    ROW_NUMBER() OVER (ORDER BY COALESCE(r.nSerialno, 999) ASC, COALESCE(i.nSerialno, 999) ASC, datetime(t.serialno) ASC) AS serialno
FROM (
    SELECT
        json_extract(value, '$.nIid') AS nIid,
        json_extract(value, '$.nRelid') AS nRelid,
        json_extract(value, '$.nImpactid') AS nImpactid,
        json_extract(value, '$.serialno') AS serialno,
        json_extract(value, '$.dt') AS dt
    FROM json_each(?)
) t
LEFT JOIN Codemaster r ON r.nCodeid = t.nRelid
LEFT JOIN Codemaster i ON i.nCodeid = t.nImpactid
ORDER BY COALESCE(r.nSerialno, 999) ASC, COALESCE(i.nSerialno, 999) ASC, datetime(t.serialno) ASC;
`;
        return { query };
    }
    getAnnotHighlightExport_RID_Query() {
        const query = `
      WITH tbl AS (
        SELECT id.nIDid,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN id.cPageno ELSE id.cTPageno END AS pageIndex,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN id.jCordinates ELSE id.jTCordinates END AS cordinates,
               id.cColor as color,
               id.nICount,
               id.cONote
        FROM RIssuesummary id
        WHERE 
        coalesce(id.nCaseid,'') = coalesce(?,'')
          AND id.nSessionid = ?
          AND id.nUserid = ?
      )
      SELECT t.*
      FROM tbl t
      LEFT JOIN RIssueMapid rs ON rs.nIDid = t.nIDid
      WHERE (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = rs.nIid))
        AND (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = t.pageIndex))
      GROUP BY t.nIDid, t.pageIndex, t.cordinates, t.color, t.nICount, t.cONote;
   `;
        return { query };
    }
    getAnnotHighlightExport_RH_Query() {
        const query = `
      WITH tbl AS (
        SELECT rh.nHid,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN rh.cPageno ELSE rh.cTPageno END AS cPageno,
               CASE WHEN COALESCE(?, 'N') = 'N' THEN rh.cLineno ELSE rh.cTLineno END AS cLineno,
               rh.cTime,
               cColor,
               rg.nGroupid,
               rg.issueids
        FROM RHighlights rh
        LEFT JOIN (
          WITH tbl AS (
            SELECT *,
                   grp,
                   DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
            FROM (
              SELECT cLineno - ROW_NUMBER() OVER (PARTITION BY cPageno ORDER BY cLineno) AS grp,
                     cPageno,
                     cLineno,
                     m.nHid,
                     group_concat(m.nIid) AS i
              FROM RHighlights h
              JOIN RHighlightMapid m ON h.nHid = m.nHid
              WHERE h.nSessionId = ?
                AND h.nUserid = ?
              GROUP BY cPageno, cLineno, m.nHid
            ) dt
            ORDER BY cPageno, cLineno, nHid, i
          )
          SELECT nHid, unique_no AS nGroupid, i AS issueids
          FROM tbl
          ORDER BY unique_no
        ) rg ON rg.nHid = rh.nHid
        LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
        WHERE 
          coalesce(rh.nCaseid,'') = coalesce(?,'')
          AND rh.nUserid = ?
          AND rh.nSessionId = ?
      )
      SELECT t.*
      FROM tbl t
      LEFT JOIN RHighlightMapid rm ON rm.nHid = t.nHid
      WHERE (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = rm.nIid))
        AND (json_array_length(?) = 0 OR EXISTS (SELECT 1 FROM json_each(?) AS j WHERE j.value = t.cPageno))
      GROUP BY t.nHid, t.cPageno, t.cLineno, t.cTime, t.cColor, t.nGroupid, t.issueids;
    `;
        return { query };
    }
    getAnnotOfPagesIssueSummaryQuery() {
        const query = `SELECT nIDid, 
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cPageno ELSE cTPageno END AS pageIndex,
             CASE WHEN COALESCE(?, 'N') = 'N' THEN jCordinates ELSE jTCordinates END AS cordinates,
             cColor AS color, nICount, bTrf
      FROM RIssuesummary
      WHERE coalesce(nCaseid,'') = coalesce(?,'') AND nSessionid = ? AND nUserid = ?`;
        return { query };
    }
    getAnnotOfPagesHighlightsQuery() {
        const query = `
      SELECT rh.nHid, 
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cPageno ELSE cTPageno END AS cPageno,
             CASE WHEN COALESCE(?, 'N') = 'N' THEN cLineno ELSE cTLineno END AS cLineno,
             cTime, cColor ,rh.identity,rh.oL , rg.nGroupid, rg.issueids
      FROM RHighlights rh
      LEFT JOIN (
        WITH tbl AS (
          SELECT *, grp, DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no
          FROM (
            SELECT CAST(cLineno AS INTEGER) - ROW_NUMBER() OVER (PARTITION BY CAST(cPageno AS INTEGER), json_group_array(m.nIid ORDER BY m.nIid) 
            ORDER BY CAST(cLineno AS INTEGER)) AS grp, 
            CAST(cPageno AS INTEGER) AS cPageno, CAST(cLineno AS INTEGER) AS cLineno, 
            m.nHid, GROUP_CONCAT(m.nIid, ',') AS i
            FROM RHighlights h
            JOIN (
            select rhm."nIid",rhm."nHid" from RHighlightMapid rhm order by rhm."serialno") m ON h.nHid = m.nHid
            WHERE h.nSessionId = ? AND h.nUserid = ?
            GROUP BY CAST(cPageno AS INTEGER), CAST(cLineno AS INTEGER), m.nHid
            ORDER BY m.nHid
          ) dt
          ORDER BY cPageno, cLineno, nHid, i
        )
        SELECT nHid, unique_no AS nGroupid, i AS issueids
        FROM tbl
        ORDER BY unique_no
      ) rg ON rg.nHid = rh.nHid
      LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
      WHERE coalesce(rh.nCaseid,'') = coalesce(?,'') AND rh.nUserid = ? AND rh.nSessionId = ?`;
        return { query };
    }
    getAnnotIssueSummaryQuery() {
        const query = `
      WITH tbl AS (
        SELECT 
          id.nIDid,
          CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN id.cPageno 
            ELSE id.cTPageno 
          END AS pageIndex,
          id.cColor,
          id.nICount,
          id.cONote,
          id.cNote
        FROM RIssuesummary id
        WHERE 
        coalesce(id.nCaseid,'') = coalesce(?,'')
          AND id.nSessionid = ?
          AND id.nUserid = ?
      ),
      dtl AS (
        SELECT 
          r.nIDid,
          isu.cIName,
          isu.cColor,
          rel.cCodename AS cRel,
          imp.cCodename AS cImp,
          ri.nRelid,
          ri.nImpactid
        FROM tbl r 
        JOIN RIssueMapid ri ON ri.nIDid = r.nIDid
        JOIN RIssueMaster isu ON isu.nIid = ri.nIid
        LEFT JOIN Codemaster rel ON rel.nCodeid = ri.nRelid
        LEFT JOIN Codemaster imp ON imp.nCodeid = ri.nImpactid
      )
      SELECT 
        r.nIDid,
        r.pageIndex,
        r.cColor,
        r.cONote,
        r.cNote,
        json_group_array(
          json_object(
            'nIDid', t.nIDid,
            'cIName', t.cIName,
            'cColor', t.cColor,
            'cRel', t.cRel,
            'cImp', t.cImp,
            'nRelid', t.nRelid,
            'nImpactid', t.nImpactid
          )
        ) AS issues
      FROM tbl r
      JOIN dtl t ON t.nIDid = r.nIDid
      GROUP BY 
        r.nIDid,
        r.pageIndex,
        r.cColor,
        r.cONote,
        r.cNote;
    `;
        return query;
    }
    getHighlightGroupQuery() {
        const query = `
     WITH tbl AS (
    SELECT 
        rh.nHid,
        CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN rh.cPageno 
            ELSE rh.cTPageno 
        END AS cPageno,
        CASE 
            WHEN COALESCE(?, 'N') = 'N' THEN rh.cLineno 
            ELSE rh.cTLineno 
        END AS cLineno,
        rh.cTime,
        im.cColor,
        rg.nGroupid,
        rg.issueids,
        rh.cNote
    FROM RHighlights rh 
    LEFT JOIN (
        WITH tbl_inner AS (
            SELECT 
                *,
                grp,
                DENSE_RANK() OVER (ORDER BY i, cPageno, grp) AS unique_no 
            FROM (
                SELECT  
                    CAST(h_inner.cLineno AS INTEGER) - ROW_NUMBER() OVER (
                        PARTITION BY CAST(h_inner.cPageno AS INTEGER), group_concat(m.nIid, ',') 
                        ORDER BY CAST(h_inner.cLineno AS INTEGER)
                    ) AS grp,  
                    h_inner.cPageno, 
                    h_inner.cLineno,
                    m.nHid,
                    group_concat(m.nIid, ',') AS i
                FROM RHighlights h_inner 
                JOIN RHighlightMapid m ON h_inner.nHid = m.nHid
                WHERE  
                    h_inner.nSessionId = ? 
                    AND h_inner.nUserid = ? 
                GROUP BY h_inner.cPageno, h_inner.cLineno, m.nHid
                ORDER BY m.nHid
            ) dt 
            ORDER BY cPageno, cLineno, nHid, i
        ) 
        SELECT 
            tbl_inner.nHid, 
            tbl_inner.unique_no AS nGroupid, 
            tbl_inner.i AS issueids 
        FROM tbl_inner 
        ORDER BY unique_no
    ) rg ON rg.nHid = rh.nHid
    LEFT JOIN RIssueMaster im ON im.nIid = rh.nLID
    WHERE 
        rh.nUserid = ? 
        AND rh.nSessionId = ? 
),
dtl AS (
    SELECT 
        t.nHid, 
        r.cIName, 
        r.cColor
    FROM tbl t 
    JOIN RHighlightMapid rm ON rm.nHid = t.nHid
    JOIN RIssueMaster r ON r.nIid = rm.nIid
)
SELECT 
    t.*, 
    json_group_array(
        json_object(
            'nHid', d.nHid,
            'cIName', d.cIName,
            'cColor', d.cColor
        )
    ) AS issues
FROM tbl t
LEFT JOIN dtl d ON d.nHid = t.nHid 
GROUP BY  
    t.nHid,
    t.cPageno,
    t.cLineno,
    t.cTime,
    t.cColor,
    t.nGroupid,
    t.issueids,
    t.cNote;
    `;
        return query;
    }
    getCaseDetail() {
        const query = `
      SELECT 
          COALESCE(r.id, 1) AS nSesid,
          COALESCE(r.cName, 'Demo session') AS cName,
          r.dStartDt,
          r.cStatus,
          r.cProtocol,
          c.*
      FROM CaseDetail c
      LEFT JOIN sessions r  
          ON c.nCaseid = r.nCaseid 
          AND r.id = ?
      WHERE coalesce(c.nCaseid,'') = coalesce(?,'')
      ;
   `;
        return query;
    }
    getIssueVersion() {
        const query = ` SELECT * FROM RIssueDetailLog WHERE nIDid = ?`;
        return { query };
    }
};
exports.QueryService = QueryService;
exports.QueryService = QueryService = __decorate([
    (0, common_1.Injectable)()
], QueryService);


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
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(37);
const query_builder_service_1 = __webpack_require__(38);
const config_1 = __webpack_require__(22);
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
/* 37 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 38 */
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
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
const moment = __webpack_require__(31);
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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UnicIdentityService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnicIdentityService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
const crypto_1 = __webpack_require__(43);
let UnicIdentityService = UnicIdentityService_1 = class UnicIdentityService {
    constructor() {
        this.logger = new common_1.Logger(UnicIdentityService_1.name);
        this.sessionFilePath = path.resolve(process.cwd(), 'local-session.json');
    }
    async onModuleInit() {
        try {
            const content = await fs_1.promises.readFile(this.sessionFilePath, 'utf-8');
            const parsed = JSON.parse(content);
            if (parsed?.nUnicuserid && typeof parsed.nUnicuserid === 'string') {
                this.cSessionUnicId = parsed.nUnicuserid;
                this.logger.log(`Loaded existing nUnicuserid: ${this.cSessionUnicId}`);
                return;
            }
            throw new Error('Invalid file format');
        }
        catch {
            this.cSessionUnicId = this.generateRandomId(12);
            const payload = { nUnicuserid: this.cSessionUnicId };
            await fs_1.promises.writeFile(this.sessionFilePath, JSON.stringify(payload, null, 2), 'utf-8');
            this.logger.log(`Created new session file with nUnicuserid: ${this.cSessionUnicId}`);
        }
    }
    getSessionUnicId() {
        return this.cSessionUnicId;
    }
    generateRandomId(length) {
        return (0, crypto_1.randomBytes)(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    }
};
exports.UnicIdentityService = UnicIdentityService;
exports.UnicIdentityService = UnicIdentityService = UnicIdentityService_1 = __decorate([
    (0, common_1.Injectable)()
], UnicIdentityService);


/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),
/* 44 */
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
exports.VerifyTabsService = void 0;
const db_service_1 = __webpack_require__(36);
const common_1 = __webpack_require__(3);
const sqllitedb_service_1 = __webpack_require__(7);
const unic_identity_service_1 = __webpack_require__(42);
let VerifyTabsService = class VerifyTabsService {
    constructor(db, sqlLite, unicIdentity) {
        this.db = db;
        this.sqlLite = sqlLite;
        this.unicIdentity = unicIdentity;
        this.caseTabs = [];
        this.isTabsfetched = false;
        this.schema = 'realtime';
        this.logger = new common_1.Logger('verif-tabs');
    }
    async verify(charcodes) {
        try {
            const data = String.fromCharCode(...charcodes);
            const matches = [];
            const regex = /\{(.*?)\}/g;
            let match;
            while ((match = regex.exec(data)) !== null) {
                const value = match[1];
                console.log('Tab in line', value);
                const key = value.split(/[\s-]/)[0];
                if (this.caseTabs.includes(key)) {
                    matches.push(`{${value}}`);
                }
                else {
                    console.log(`Tab {${key}} Found But not exists in caseTabs total ${this.caseTabs.length}`);
                }
            }
            return matches;
        }
        catch (error) {
            console.error("Error in verify method:", error);
            return [];
        }
    }
    clearTabs() {
        console.log('Clearing tabls');
        this.isTabsfetched = false;
        this.caseTabs = [];
    }
    async getSession() {
        const cSessionUnicId = await this.unicIdentity.getSessionUnicId();
        const res = await this.db.executeRef('sessions', { cSessionUnicId }, this.schema);
        if (res.success) {
            return res.data[0] || [];
        }
        else {
            this.logger.error(`Session List failed :${res.error} `);
            return [];
        }
    }
    async getAllCaseTabs(nSesid) {
        debugger;
        console.log('Getting tabs', nSesid);
        try {
            if (this.isTabsfetched) {
                console.log('Tab already fetched', this.caseTabs?.length);
                return;
            }
            ;
            if (!nSesid) {
                console.log('No session Id Found');
                return [];
            }
            ;
            const data = await this.getSession();
            if (!data?.length) {
                console.log('No sessions');
            }
            ;
            let cCaseno;
            try {
                if (data?.length) {
                    cCaseno = data[0]["cCaseno"] || '';
                    if (!cCaseno) {
                        console.log('Case No is null');
                    }
                }
            }
            catch (error) {
            }
            try {
                const res = await this.db.executeRef('realtime_case_all_tabs', { cCaseno: cCaseno || null, nSesid });
                if (res?.data?.length) {
                    this.caseTabs = res?.data[0].map((a) => a.cTab) || [];
                    this.isTabsfetched = true;
                }
            }
            catch (error) {
                console.log(error);
                this.caseTabs = [];
                this.isTabsfetched = false;
            }
        }
        catch (error) {
            console.log(error);
        }
        console.log('TABS LENGTH', this.caseTabs?.length);
        return this.caseTabs;
    }
};
exports.VerifyTabsService = VerifyTabsService;
exports.VerifyTabsService = VerifyTabsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _b : Object, typeof (_c = typeof unic_identity_service_1.UnicIdentityService !== "undefined" && unic_identity_service_1.UnicIdentityService) === "function" ? _c : Object])
], VerifyTabsService);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SyncService = void 0;
const common_1 = __webpack_require__(3);
const sqllitedb_service_1 = __webpack_require__(7);
const connectivity_service_1 = __webpack_require__(27);
const config_1 = __webpack_require__(22);
const axios_1 = __webpack_require__(24);
const rxjs_1 = __webpack_require__(23);
const async_1 = __webpack_require__(10);
let SyncService = class SyncService {
    constructor(sqllitedbService, dbLite, connectivity, config, httpService) {
        this.sqllitedbService = sqllitedbService;
        this.dbLite = dbLite;
        this.connectivity = connectivity;
        this.config = config;
        this.httpService = httpService;
        this.queue = async_1.default.queue(async (task, callback) => {
            await task();
            callback();
        }, 1);
        this.queue.drain(() => {
        });
    }
    async pushData() {
        if (!this.connectivity.online)
            return;
        this.queue.push(async () => {
            await this.InitDataTransfer();
        });
    }
    async InitDataTransfer() {
        try {
            if (!this.connectivity.online)
                return;
            await this.issue();
            await this.deleteLog();
            await this.issueDetail();
            await this.highlights();
            await this.sessionDetail();
            await this.syncRTLog();
        }
        catch (error) {
            console.error('Error processing task:', error);
        }
        return true;
    }
    async issue() {
        try {
            const issueCategory = await this.sqllitedbService.get('IssueCategory', 'isSynced = 0');
            const issues = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefICid" from RIssueMaster r left join IssueCategory i on i."nICid" = r."nICid" where r.isSynced = ?`, [0]);
            if (!issueCategory?.length && !issues?.length)
                return true;
            const data = {
                jCat: JSON.stringify(issueCategory || []),
                jIssue: JSON.stringify(issues || [])
            };
            const response = await this.makePostRequest('pushissue', data);
            if (response?.length) {
                const newcats = response[0]["jNCat"] || [];
                const newissues = response[0]["jNIssue"] || [];
                console.log('Responce length', newissues?.length, newcats?.length);
                if (newcats?.length) {
                    const ids = newcats.map(x => x.nOICid);
                    const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
                    const updateQuery = `UPDATE IssueCategory SET nRefICid = CASE nICid ${queries} END, isSynced = 1 WHERE nICid IN (${ids.join(',')})`;
                    const params = newcats.reduce((acc, x) => [...acc, x.nOICid, x.nICid], []);
                    await this.sqllitedbService.getCustomQuery(updateQuery, params);
                }
                if (newissues?.length) {
                    const ids = newissues.map(x => x.nOIid);
                    const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
                    const updateQuery = `UPDATE RIssueMaster SET nRefIid = CASE nIid ${queries} END, isSynced = 1 WHERE nIid IN (${ids.join(',')})`;
                    const params = newissues.reduce((acc, x) => [...acc, x.nOIid, x.nIid], []);
                    await this.sqllitedbService.getCustomQuery(updateQuery, params);
                }
                if (response[0]["msg"] == 1) {
                    const updatedSyncedCat = `UPDATE IssueCategory SET isSynced = 1 WHERE isSynced = 0 and nRefICid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSyncedCat, []);
                    const updatedSynced = `UPDATE RIssueMaster SET isSynced = 1 WHERE isSynced = 0 and nRefIid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSynced, []);
                }
            }
        }
        catch (error) {
            console.error('Failed to sync issue:', error);
        }
        return true;
    }
    async issueDetail() {
        try {
            const issuedetails = await this.sqllitedbService.getCustomQuery(`select r."nIDid",r."cNote",s."nLSesid" as  "nSessionid",r."nCaseid",r."cPageno",r."jCordinates",r."nUserid",r."dCreatedt",r."dUpdatedt",
                                                                        r."cONote",i."nRefIid" as "nLID",r."jTCordinates",r."cTPageno",r."bTrf",r."nRefIDid",r.cUNote
                                                                        from RIssueDetail r 
                                                                        join "sessions" s on s."id" = r."nSessionid"  
                                                                        left join "RIssueMaster" i on i."nIid" = r."nLID"
                                                                        where r.isSynced = ?
                                                                        `, [0]);
            const mapids = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefIDid",m."nRefIid" from RIssueMapid r 
                                                                left join RIssueDetail i on i."nIDid" = r."nIDid" 
                                                                join RIssueMaster m on m."nIid" = r."nIid"
                                                                where r.isSynced = ?`, [0]);
            issuedetails.forEach(a => {
                if (a.cUNote == null)
                    delete a.cUNote;
            });
            if (!issuedetails?.length && !mapids?.length)
                return true;
            try {
                issuedetails.map(a => a.jCordinates = JSON.parse(a.jCordinates || '[]'));
            }
            catch (error) {
            }
            const data = {
                jIssue: JSON.stringify(issuedetails || []),
                jMap: JSON.stringify(mapids || [])
            };
            const response = await this.makePostRequest('pushdetail', data);
            if (response?.length) {
                const newcats = response[0]["jNIssue"] || [];
                const newissues = response[0]["jNMap"] || [];
                if (newcats?.length) {
                    const ids = newcats.map(x => x.nOIDid);
                    const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
                    const updateQuery = `UPDATE RIssueDetail SET nRefIDid = CASE nIDid ${queries} END, isSynced = 1 WHERE nIDid IN (${ids.join(',')})`;
                    const params = newcats.reduce((acc, x) => [...acc, x.nOIDid, x.nIDid], []);
                    await this.sqllitedbService.getCustomQuery(updateQuery, params);
                }
                if (newissues?.length) {
                    const ids = newissues.map(x => x.nOMapid);
                    const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
                    const updateQuery = `UPDATE RIssueMapid SET nRefMapid = CASE nMapid ${queries} END, isSynced = 1 WHERE nMapid IN (${ids.join(',')})`;
                    const params = newissues.reduce((acc, x) => [...acc, x.nOMapid, x.nMapid], []);
                    await this.sqllitedbService.getCustomQuery(updateQuery, params);
                }
                if (response[0]["msg"] == 1) {
                    const updatedSynced = `UPDATE RIssueDetail SET isSynced = 1 WHERE isSynced = 0 and nRefIDid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSynced, []);
                    const updatedSyncedMaped = `UPDATE RIssueMapid SET isSynced = 1 WHERE isSynced = 0 and nRefMapid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSyncedMaped, []);
                }
            }
        }
        catch (error) {
            console.error('Failed to sync issue detail:', error);
        }
        return true;
    }
    async highlights() {
        try {
            const highlights = await this.sqllitedbService.getCustomQuery(`select r.nHid,r.cNote,r.jCordinates,r.nCaseid,s.nLSesid as nSessionId,r.nUserid,r.dCreatedt,r.cPageno,r.cLineno,r.cTPageno,r.cTLineno,r.cTime,r.cTTime,i."nRefIid" as nLID,r.nRefHid
                                                                       from RHighlights r 
                                                                       join sessions s on s.id = r.nSessionId
                                                                       left join "RIssueMaster" i on i."nIid" = r."nLID"
                                                                       where r.isSynced = ?
                                                                      `, [0]);
            const mapids = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefHid",m."nRefIid" 
                                                                from RHighlightMapid r 
                                                                left join RHighlights i on i."nHid" = r."nHid" 
                                                                join RIssueMaster m on m."nIid" = r."nIid"
                                                                where r.isSynced = ?`, [0]);
            if (!highlights?.length && !mapids?.length)
                return true;
            try {
                highlights.map(a => a.jCordinates = JSON.parse(a.jCordinates || '[]'));
            }
            catch (error) {
            }
            const data = {
                jHighlights: JSON.stringify(highlights || []),
                jMap: JSON.stringify(mapids || [])
            };
            const response = await this.makePostRequest('pushhighlights', data);
            if (response?.length) {
                try {
                    const newcats = response[0]["jNHighlights"] || [];
                    const newissues = response[0]["jNMap"] || [];
                    if (newcats?.length) {
                        const ids = newcats.map(x => x.nOHid);
                        const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
                        const updateQuery = `UPDATE RHighlights SET nRefHid = CASE nHid ${queries} END, isSynced = 1 WHERE nHid IN (${ids.join(',')})`;
                        const params = newcats.reduce((acc, x) => [...acc, x.nOHid, x.nHid], []);
                        await this.sqllitedbService.getCustomQuery(updateQuery, params);
                    }
                    if (newissues?.length) {
                        const ids = newissues.map(x => x.nOMapid);
                        const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
                        const updateQuery = `UPDATE RHighlightMapid SET nRefMapid = CASE nMapid ${queries} END, isSynced = 1 WHERE nMapid IN (${ids.join(',')})`;
                        const params = newissues.reduce((acc, x) => [...acc, x.nOMapid, x.nMapid], []);
                        await this.sqllitedbService.getCustomQuery(updateQuery, params);
                    }
                }
                catch (error) {
                }
                if (response[0]["msg"] == 1) {
                    const updatedSynced = `UPDATE RHighlights SET isSynced = 1 WHERE isSynced = 0 and nRefHid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSynced, []);
                    const updatedSyncedMaped = `UPDATE RHighlightMapid SET isSynced = 1 WHERE isSynced = 0 and nRefMapid is not null`;
                    await this.sqllitedbService.getCustomQuery(updatedSyncedMaped, []);
                }
            }
        }
        catch (error) {
            console.error('Failed to sync issue detail:', error);
        }
        return true;
    }
    async sessionDetail() {
        try {
            debugger;
            const list = await this.sqllitedbService.getCustomQuery(`select sd.nSDid,s.nLSesid as nSesid,sd.nUserid,sd.cDefIssues,
            sd.nLIid,sd.cDefHIssues,sd.nLID,sd.nRefSDid
            from RSessionDetail sd 
            join sessions s on s.id = sd.nSesid 
            where s.nLSesid is not null and ( coalesce(sd.cDefHIssues,'') != '' or coalesce(sd.cDefIssues,'') != '' or sd.nLIid is not null or sd.nLID is not null) `, []);
            const issues = await this.sqllitedbService.get('RIssueMaster', 'nRefIid is not null');
            const sendData = [];
            list.forEach((e) => {
                const obj = { nSDid: e.nSDid, nSesid: e.nSesid, nUserid: e.nUserid, nRefSDid: e.nRefSDid, nLID: 0, nLIid: 0, cDefIssues: [], cDefHIssues: [] };
                try {
                    const def_issues = e.cDefIssues ? JSON.parse(e.cDefIssues) : [];
                    if (def_issues?.length) {
                        def_issues.forEach(a => {
                            const nIid = issues.find(m => m.nIid == a.nIid)?.nRefIid || 0;
                            if (nIid) {
                                obj.cDefIssues.push({
                                    nIid: nIid,
                                    nRelid: a.nRelid,
                                    nImpactid: a.nImpactid,
                                    serialno: a.serialno
                                });
                            }
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
                try {
                    const def_issues = e.cDefHIssues ? JSON.parse(e.cDefHIssues) : [];
                    if (def_issues?.length) {
                        def_issues.forEach(a => {
                            const nIid = issues.find(m => m.nIid == a.nIid)?.nRefIid || 0;
                            if (nIid) {
                                obj.cDefHIssues.push({
                                    nIid: nIid,
                                    serialno: a.serialno
                                });
                            }
                        });
                    }
                }
                catch (error) {
                    console.log(error);
                }
                try {
                    if (e.nLID) {
                        obj.nLID = issues.find(a => a.nIid == e.nLID)?.nRefIid || 0;
                    }
                }
                catch (error) {
                    console.log(error);
                }
                try {
                    if (e.nLIid) {
                        obj.nLIid = issues.find(a => a.nIid == e.nLIid)?.nRefIid || 0;
                    }
                }
                catch (error) {
                    console.log(error);
                }
                sendData.push(obj);
            });
            if (sendData?.length) {
                const response = await this.makePostRequest('pushsessiondetail', { jSDetail: JSON.stringify(sendData) });
                if (response?.length) {
                    if (response[0]["msg"] == 1) {
                        const updated_rows = response[0]["jDetail"] || [];
                        if (updated_rows?.length) {
                            const ids = updated_rows.map(x => x.nOSDid);
                            const queries = updated_rows.map(() => 'WHEN ? THEN ?').join(' ');
                            const updateQuery = `UPDATE RSessionDetail SET nRefSDid = CASE nSDid ${queries} END, isSynced = 1 WHERE nSDid IN (${ids.join(',')})`;
                            const params = updated_rows.reduce((acc, x) => [...acc, x.nOSDid, x.nSDid], []);
                            await this.sqllitedbService.getCustomQuery(updateQuery, params);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async deleteLog() {
        const deleteLog = await this.sqllitedbService.get('delete_log', 'isSynced = 0');
        if (!deleteLog?.length)
            return true;
        const newdata = deleteLog.map((x) => ({ id: x.id, deleted_id: x.deleted_id, table_name: x.table_name }));
        const data = {
            jDelete: JSON.stringify(newdata || [])
        };
        const response = await this.makePostRequest('pushdelete', data);
        console.log('Res of delete', response);
        if (response?.length) {
            const newcats = newdata;
            if (newcats?.length) {
                const ids = newcats.map(x => x.id);
                const updateQuery = `UPDATE delete_log SET isSynced = 1 WHERE id IN (${ids.join(',')})`;
                const params = newcats.reduce((acc, x) => [...acc, x.deleted_id], []);
                await this.sqllitedbService.getCustomQuery(updateQuery, []);
            }
        }
        return true;
    }
    async syncCaseUsers(nSesid) {
        debugger;
        if (!this.connectivity.online)
            return;
        try {
            const sessionn = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
            if (!sessionn?.length)
                return;
            const nCaseid = sessionn[0]["nCaseid"];
            const users = await this.makePostRequest('sessionusers', { jCaseids: JSON.stringify([nCaseid]) }) || [];
            if (users?.length) {
                const userData = users.map((a) => ({ cFname: a.cFname, cLname: a.cLname, cEmail: a.cEmail, nUserid: a.nUserid, cIsvarify: 'Y' }));
                if (userData?.length)
                    await this.dbLite.insertManyWithConflict('users', userData, ['cEmail']);
                const caseUsers = users.flatMap(obj => obj.jCases.map(jCase => ({
                    nUserid: obj.nUserid,
                    nCaseid: jCase
                })));
                try {
                    if (caseUsers?.length)
                        await this.dbLite.insertManyWithConflict('caseusers', caseUsers, ['nCaseid', 'nUserid']);
                }
                catch (error) {
                    console.log('Failed to sync caseusers insert:', error);
                }
                const sessiondetail = users.map(a => ({ nSesid: nSesid, nUserid: a.nUserid, cUsertype: 'T', dDelDt: null, cDefHIssues: '', nLID: 0 }));
                if (sessiondetail?.length)
                    await this.dbLite.insertManyWithConflict('RSessionDetail', sessiondetail, ['nSesid', 'nUserid']);
                try {
                    await this.dbLite.delete('caseusers', 'nCaseid = ? and nUserid not in (' + caseUsers.filter(a => a.nCaseid == nCaseid).map(x => x.nUserid).join(',') + ')', [nCaseid]);
                    await this.dbLite.delete('RSessionDetail', 'nSesid = ? and nUserid not in (' + caseUsers.filter(a => a.nCaseid == nCaseid).map(x => x.nUserid).join(',') + ')', [nSesid]);
                }
                catch (error) {
                }
            }
            await this.dbLite.update('sessions', { isUsersSynced: 1 }, 'id = ?', [nSesid]);
        }
        catch (error) {
            console.log('Failed to sync case users:', error);
        }
        return { msg: 1, value: 'Success' };
    }
    async syncRTLog() {
        try {
            const list = await this.sqllitedbService.getCustomQuery(`select r.nRTLid,r.nUserid,s.nLSesid as nSesid,r.cStatus,r.dCreateDt,r.cSource ,r.dLeaveDt ,r.nRefRTLid
      from RTLogs r 
      left join sessions s on s.id = r.nSesid and  s.isSynced = 1
      where (r.isSynced = 0 and r.nSesid == 0) or (r.isSynced = 0 and r.nSesid is not null and s.id is not null )`, []);
            if (list?.length) {
                const data = {
                    jLogs: JSON.stringify(list || [])
                };
                const response = await this.makePostRequest('pushrtlogs', data);
                if (response?.length) {
                    if (response[0]["msg"] == 1) {
                        const updated_rows = response[0]["jInserted"] || [];
                        if (updated_rows?.length) {
                            const ids = updated_rows.map(x => x.nORTLid);
                            const queries = updated_rows.map(() => 'WHEN ? THEN ?').join(' ');
                            const updateQuery = `UPDATE RTLogs SET nRefRTLid = CASE nRTLid ${queries} END, isSynced = 1 WHERE nRTLid IN (${ids.join(',')})`;
                            const params = updated_rows.reduce((acc, x) => [...acc, x.nORTLid, x.nRTLid], []);
                            await this.sqllitedbService.getCustomQuery(updateQuery, params);
                        }
                        try {
                            await this.sqllitedbService.getCustomQuery(`update RTLogs set isSynced = ? where nRTLid in (${list.map(a => a.nRTLid).join(',')})`, [1]);
                        }
                        catch (error) {
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async makePostRequest(apipath, body) {
        try {
            const url = new URL(this.config.get('LIVE_SERVER') + '/sync/' + apipath);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(url.toString(), body));
            return response.data ? response.data : { msg: -1, value: 'Failed' };
        }
        catch (error) {
            console.error('Failed to post data to:', apipath, error?.message);
            return { msg: -1, value: 'Failed' };
        }
    }
};
exports.SyncService = SyncService;
exports.SyncService = SyncService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _a : Object, typeof (_b = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _b : Object, typeof (_c = typeof connectivity_service_1.ConnectivityService !== "undefined" && connectivity_service_1.ConnectivityService) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _e : Object])
], SyncService);


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
exports.SessionBackupService = void 0;
const common_1 = __webpack_require__(3);
const session_service_1 = __webpack_require__(29);
const sqllitedb_service_1 = __webpack_require__(7);
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
let SessionBackupService = class SessionBackupService {
    constructor(session, dblite) {
        this.session = session;
        this.dblite = dblite;
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
    async syncFeedToOffline(nSesid) {
        try {
            const sessionDetail = [];
            if (!sessionDetail)
                return false;
            if (sessionDetail.cProtocol == 'C')
                return true;
            const savePath = `localdata/dt_${nSesid}`;
            const feeddata = await this.dblite.fetchFeed('nSesid = ?', [nSesid]);
            const pageDataLength = sessionDetail.nLines || 25;
            if (feeddata && feeddata.length) {
                const totalpages = Math.ceil(feeddata.length / pageDataLength);
                for (let i = totalpages; i >= 1; i--) {
                    const pageData = this.getPageData(feeddata, i, pageDataLength);
                    await this.writeJSONToFile(pageData, `${savePath}/page_${i}.json`);
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
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
        return true;
    }
};
exports.SessionBackupService = SessionBackupService;
exports.SessionBackupService = SessionBackupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _a : Object, typeof (_b = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _b : Object])
], SessionBackupService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SessionStoreService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionStoreService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(11);
const session_service_1 = __webpack_require__(29);
const utility_service_1 = __webpack_require__(12);
const ioredis_1 = __webpack_require__(48);
const ioredis_2 = __webpack_require__(49);
let SessionStoreService = SessionStoreService_1 = class SessionStoreService {
    constructor(session, utilityService, redis) {
        this.session = session;
        this.utilityService = utilityService;
        this.redis = redis;
        this.logger = new common_1.Logger(SessionStoreService_1.name);
        this.intervalTime = 5 * 60 * 1000;
        this.sessionData = new Map();
    }
    onModuleInit() {
    }
    onModuleDestroy() {
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
    async saveSession(nCaseid, nSesid) {
        debugger;
        const savePromises = [];
        const currentJob = this.session.CurrentJob;
        this.sortArray(currentJob.lineBuffer);
        const sessionDetail = await this.session.getSessionDetail(nCaseid, nSesid);
        if (!sessionDetail)
            return false;
        if (sessionDetail.cProtocol == 'C')
            return true;
        const savePath = `localdata/dt_${nSesid}`;
        try {
            await fs_1.promises.mkdir(savePath, { recursive: true });
        }
        catch (error) {
        }
        try {
            const feeddata = currentJob.lineBuffer;
            const pageDataLength = sessionDetail.nLines || 25;
            if (feeddata && feeddata.length) {
                const totalpages = Math.ceil(feeddata.length / pageDataLength);
                for (let i = totalpages; i >= 1; i--) {
                    const pageData = this.getPageData(feeddata, i, pageDataLength);
                    const savePromise = fs_1.promises
                        .writeFile(`${savePath}/page_${i}.json`, JSON.stringify(pageData, null, 2))
                        .then(() => {
                        this.logger.log(`Session ${nSesid} saved to page ${i}`);
                    })
                        .catch((error) => {
                        this.logger.error(`Error saving session ${nSesid}:`, error);
                    });
                    savePromises.push(savePromise);
                }
            }
            await Promise.all(savePromises);
        }
        catch (error) {
        }
        try {
            await this.deleteAllLinesForFeed(nSesid);
        }
        catch (error) {
        }
        try {
            await this.redis.del(`session:job:${nSesid}`);
        }
        catch (error) {
        }
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
    async saveMetaData(nSesid, currentJob) {
        try {
            if (!nSesid)
                return;
            const obj = {
                lineCount: currentJob.lineCount,
                currentLineNumber: currentJob.currentLineNumber,
                currentTimestamp: currentJob.currentTimestamp,
                currentFormat: currentJob.currentFormat,
                currentPage: currentJob.currentPage,
                oldLineData: currentJob.oldLineData,
                relaceLines: currentJob.relaceLines,
                isRefresh: currentJob.isRefresh,
                refreshTimeStamp: currentJob.refreshTimeStamp
            };
            const key = `session:job:${nSesid}`;
            const value = JSON.stringify(obj);
            await this.redis.set(key, value);
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async fetchSessionMetaData(nSesid) {
        try {
            if (!nSesid)
                return {};
            const values = await this.redis.get(`session:job:${nSesid}`);
            return values ? JSON.parse(values) : {};
        }
        catch (error) {
        }
        return {};
    }
    async saveLine(nSesid, unicid, lineData) {
        try {
            if (!unicid) {
                unicid = Number(process.hrtime.bigint().toString());
                if (!lineData[6])
                    lineData[6] = unicid;
            }
            const key = `feed:${nSesid}:${unicid}`;
            const value = JSON.stringify(lineData);
            await this.redis.set(key, value);
            return unicid;
        }
        catch (error) {
            console.error('Error saving line to Redis:', error);
            return unicid;
        }
    }
    async deleteLine(nSesid, unicid) {
        try {
            const key = `feed:${nSesid}:${unicid}`;
            const deletedCount = await this.redis.del(key);
            return deletedCount > 0;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async deleteAllLinesForFeed(nSesid) {
        try {
            const keys = await this.redis.keys(`feed:${nSesid}:*`);
            if (keys.length > 0) {
                const deletedCount = await this.redis.del(...keys);
                return deletedCount;
            }
            return 0;
        }
        catch (error) {
            console.log(error);
            return 0;
        }
    }
    async getLine(nSesid, unicid) {
        const key = `feed:${nSesid}:${unicid}`;
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
    }
    async getAllLinesForSession(nSesid) {
        try {
            if (!nSesid)
                return [];
            const keys = await this.redis.keys(`feed:${nSesid}:*`);
            if (keys.length === 0) {
                return [];
            }
            const values = await this.redis.mget(...keys);
            const parsedValues = values.map((value) => JSON.parse(value || '[]'));
            return parsedValues;
        }
        catch (error) {
            console.log(error);
            return [];
        }
    }
    async removeLinesFromRedis(nSesid, removedData) {
        try {
            if (removedData.length === 0) {
                console.log('No keys to remove from Redis.');
                return;
            }
            const keysToDelete = removedData.map((a) => `feed:${nSesid}:${a}`);
            const deletedCount = await this.redis.del(...keysToDelete);
        }
        catch (error) {
            console.error('Error while removing lines from Redis:', error);
        }
    }
};
exports.SessionStoreService = SessionStoreService;
exports.SessionStoreService = SessionStoreService = SessionStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, ioredis_2.InjectRedis)()),
    __metadata("design:paramtypes", [typeof (_a = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof ioredis_1.default !== "undefined" && ioredis_1.default) === "function" ? _c : Object])
], SessionStoreService);


/***/ }),
/* 48 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 49 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 50 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TcpService = void 0;
const common_1 = __webpack_require__(3);
const net = __webpack_require__(51);
const utility_service_1 = __webpack_require__(12);
const parse_data_service_1 = __webpack_require__(52);
const session_service_1 = __webpack_require__(29);
const socket_service_1 = __webpack_require__(54);
const savedata_service_1 = __webpack_require__(57);
const date_time_service_1 = __webpack_require__(30);
const config_1 = __webpack_require__(22);
const log_service_1 = __webpack_require__(39);
const connectivity_service_1 = __webpack_require__(27);
const sessionbuilder_service_1 = __webpack_require__(6);
const bridge_parse_service_1 = __webpack_require__(58);
const parse_command_service_1 = __webpack_require__(67);
const fs_1 = __webpack_require__(11);
const path_1 = __webpack_require__(14);
const bridge_service_1 = __webpack_require__(68);
const verify_tabs_service_1 = __webpack_require__(44);
let TcpService = class TcpService {
    setServer(server) {
        this.server = server;
    }
    constructor(parserService, utilityService, sessionService, socketService, savedataService, utility, dateTimeService, config, log, connectivityService, sessionBuilder, BridgeParseService, CommandParserService, bridge, verifyTab) {
        this.parserService = parserService;
        this.utilityService = utilityService;
        this.sessionService = sessionService;
        this.socketService = socketService;
        this.savedataService = savedataService;
        this.utility = utility;
        this.dateTimeService = dateTimeService;
        this.config = config;
        this.log = log;
        this.connectivityService = connectivityService;
        this.sessionBuilder = sessionBuilder;
        this.BridgeParseService = BridgeParseService;
        this.CommandParserService = CommandParserService;
        this.bridge = bridge;
        this.verifyTab = verifyTab;
        this.connectivity_LOG = [];
        this.timeReconnect = 3000;
        this.feed_received = false;
        this.portNo = parseInt(this.config.get('TCP_PORT') || "0", 10);
        this.tcpServer = this.config.get('TCP_SERVER');
        this.localFileName = 'localserver.json';
        this.sessions = new Map();
        this.current_status = false;
        this.logApplication = 'realtime';
        this.logger = new common_1.Logger('tcp');
        this.connectToServer = async () => {
            this.emitConnectionStatus(false);
            this.logger.fatal(`TCP Conneting to server`);
            this.log.report(`TCP Conneting to server`, `${this.logApplication}/tcp`);
            try {
                clearTimeout(this.intervalOfconnect);
                this.intervalOfconnect = null;
                this.feed_received = false;
            }
            catch (error) {
            }
            try {
                let Localdata = await this.utilityService.readJsonFromFile(this.localFileName);
                if (Localdata) {
                    this.portNo = parseInt(Localdata.port || "0", 10);
                    this.tcpServer = Localdata.ip;
                }
                else {
                    return;
                }
                this.set_log(0, 'Attempting to connect to server ' + this.tcpServer + ':' + this.portNo);
                this.log.report('Attempting to connect to server ' + this.tcpServer + ':' + this.portNo, `${this.logApplication}/tcp`);
                try {
                    if (this.client) {
                        this.client.destroy();
                        return;
                    }
                }
                catch (error) {
                }
                this.client = new net.Socket();
                this.client.connect(this.portNo, this.tcpServer, () => {
                    this.logger.warn(`TCP CONNECTED ${this.tcpServer + ':' + this.portNo}`);
                    this.emitConnectionStatus(true);
                    this.log.report(`TCP CONNECTED ${this.tcpServer + ':' + this.portNo}`, `${this.logApplication}/tcp`);
                    this.set_log(1, 'Connected to server');
                });
                this.client.on('data', (data) => {
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    }
                    catch (error) {
                    }
                    this.set_log(4, 'Feed received from server');
                    let sesid = this.sessionService.getCurrentSession();
                    if (sesid != this.sessionService.currentSessionid) {
                    }
                    if (this.sessionService.protocol == 'C') {
                        this.parserService.parseData(data, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
                        try {
                            if (false) {}
                        }
                        catch (error) {
                        }
                    }
                    else if (this.sessionService.protocol == 'B') {
                        this.CommandParserService.splitCommands(data, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
                        return;
                    }
                });
                this.client.on('end', (data) => {
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP ENDS `, `${this.logApplication}/tcp`);
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    }
                    catch (error) {
                    }
                });
                this.client.on('close', () => {
                    this.logger.error(`TCP Close`);
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP CLOSED `, `${this.logApplication}/tcp`);
                    this.set_log(2, 'Connection closed');
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    }
                    catch (error) {
                    }
                    this.client = null;
                    this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);
                });
                this.client.on('error', (error) => {
                    this.logger.error(`TCP Error `, error?.message);
                    this.emitConnectionStatus(false);
                    this.log.report(`TCP ERROR ${error?.message}`, `${this.logApplication}/tcp`, 'E');
                    this.set_log(3, `Connection failed ${error}`);
                    try {
                        clearTimeout(this.intervalOfconnect);
                        this.intervalOfconnect = null;
                    }
                    catch (error) {
                    }
                    this.client = null;
                    this.intervalOfconnect = setTimeout(this.connectToServer, this.timeReconnect);
                });
            }
            catch (error) {
                this.set_log(3, `Connection failed ${error}`);
            }
        };
        this.connectToServer();
    }
    reconnectFn() {
        this.log.report(`TCP reconnect`, `${this.logApplication}/tcp`);
        this.connectToServer();
    }
    destroyPrevious() {
        return new Promise((resolve, reject) => {
            if (this.client.destroyed) {
                resolve(1);
                return;
            }
            this.client.on('close', () => {
                resolve(2);
            });
            this.client.on('end', () => {
                resolve(3);
            });
            this.client.on('error', () => {
                resolve(4);
            });
            this.client.destroy();
        });
    }
    async reconnectServer() {
        this.log.report(`TCP reconnectServer()`, `${this.logApplication}/tcp`);
        this.connectToServer();
    }
    async emit_to_local_users() {
        if (this.sessionService.CurrentJob.lineBuffer.length) {
            let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];
            try {
                for (let x of array) {
                    let tabs = await this.verifyTab.verify(x[1]);
                    x[7] = tabs;
                }
            }
            catch (error) {
            }
            if (array.length) {
                this.server.emit("message", {
                    i: this.sessionService.CurrentJob.lineCount,
                    d: array,
                    date: this.sessionService.currentSessionid
                });
            }
        }
    }
    insert_log(log) {
    }
    async set_log(type, message) {
        let types = ['Attempt', 'Connected', 'Disconnected', 'Error', 'Feed', 'Success'];
        if (type == 4 && !this.feed_received)
            this.feed_received = true;
        else if (type == 4 && this.feed_received)
            return;
        else if ([0, 1, 2, 3, 5].includes(type) && this.feed_received)
            this.feed_received = false;
        let userid = await this.sessionService.getUserid();
        let log = { nId: type, date: this.dateTimeService.getCurrentTime(), message: message, nUserid: userid, nLogid: 0, cPermission: "I" };
        this.insert_log(log);
        if (!this.connectivityService.online) {
            log.nLogid = Math.random() * 10;
            log.dDt = log.date;
            log.cMsg = log.message;
            this.server.emit("log-data", log);
            return;
        }
        try {
        }
        catch (error) {
        }
        log.dDt = log.date;
        log.cMsg = log.message;
        this.server.emit("log-data", log);
    }
    emitConnectionStatus(status) {
        this.current_status = status;
        if (this.server) {
            this.server.emit("tcp-connection-status", { status: status });
        }
    }
    async readJsonAndSendData(body) {
        const data = await this.getJsonData(body.cCmd);
        const list = body.nLength ? data.splice(0, body.nLength) : data;
        let sesid = this.sessionService.getCurrentSession();
        this.sessionService.protocol = this.sessionService.getCurrentSessionProtocol(sesid);
        this.sessionService.CurrentJob = this.sessionService.reInitVariables();
        this.sessionService.checkForSessionChange(sesid);
        for (let x of list) {
            await this.delayFn(body.nDelay);
            let hex;
            if (x.cmdType) {
                hex = Buffer.from(x.hexCmd, 'hex');
            }
            else {
                hex = Buffer.from(x.data);
                x["hexCmd"] = hex;
            }
            this.BridgeParseService.SendToParseData(hex, x, this.sessionService.currentSessionid, this.sessionService.CurrentJob, this.sessions);
        }
        return { msg: 1, body, data: data.splice(0, body.nLength) };
    }
    async getJsonData(file) {
        const filePath = (0, path_1.join)(this.config.get('ASSETS'), (file || 'cmd.json'));
        const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
        return JSON.parse(fileContent);
    }
    async delayFn(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
exports.TcpService = TcpService;
exports.TcpService = TcpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof parse_data_service_1.ParseDataService !== "undefined" && parse_data_service_1.ParseDataService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof socket_service_1.SocketService !== "undefined" && socket_service_1.SocketService) === "function" ? _d : Object, typeof (_e = typeof savedata_service_1.SavedataService !== "undefined" && savedata_service_1.SavedataService) === "function" ? _e : Object, typeof (_f = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _f : Object, typeof (_g = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _g : Object, typeof (_h = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _h : Object, typeof (_j = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _j : Object, typeof (_k = typeof connectivity_service_1.ConnectivityService !== "undefined" && connectivity_service_1.ConnectivityService) === "function" ? _k : Object, typeof (_l = typeof sessionbuilder_service_1.SessionbuilderService !== "undefined" && sessionbuilder_service_1.SessionbuilderService) === "function" ? _l : Object, typeof (_m = typeof bridge_parse_service_1.BridgeParseService !== "undefined" && bridge_parse_service_1.BridgeParseService) === "function" ? _m : Object, typeof (_o = typeof parse_command_service_1.ParseCommandService !== "undefined" && parse_command_service_1.ParseCommandService) === "function" ? _o : Object, typeof (_p = typeof bridge_service_1.BridgeService !== "undefined" && bridge_service_1.BridgeService) === "function" ? _p : Object, typeof (_q = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _q : Object])
], TcpService);


/***/ }),
/* 51 */
/***/ ((module) => {

module.exports = require("net");

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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParseDataService = void 0;
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(12);
const session_service_1 = __webpack_require__(29);
const fs_1 = __webpack_require__(11);
const fs = __webpack_require__(11);
const squential_task_1 = __webpack_require__(53);
const verify_tabs_service_1 = __webpack_require__(44);
const socket_service_1 = __webpack_require__(54);
const savedata_service_1 = __webpack_require__(57);
let ParseDataService = class ParseDataService {
    setServer(server) {
        this.server = server;
    }
    constructor(utilityService, sessionService, verifyTab, socketService, savedataService) {
        this.utilityService = utilityService;
        this.sessionService = sessionService;
        this.verifyTab = verifyTab;
        this.socketService = socketService;
        this.savedataService = savedataService;
        this.logger = new common_1.Logger('caseview-parser');
        this.taskQueue = new squential_task_1.SequentialTaskQueue();
    }
    async parseData(incomingBuffer, currentSession, currentJob, sessions) {
        this.taskQueue.addTask(async () => {
            try {
                await this.parseDataQueue(incomingBuffer, currentSession, currentJob, sessions);
            }
            catch (error) {
                this.logger.error('Error parsing data:', error);
            }
        });
    }
    async parseDataQueue(incomingBuffer, currentSession, currentJob, sessions) {
        await this.addToLocalFile(incomingBuffer);
        try {
            const strBuffer = incomingBuffer.toString('ascii');
            this.utilityService.fileLog(currentSession, '\n' + Array.from(incomingBuffer).toString() + ' - ' + strBuffer, "all");
            let str = this.utilityService.replaceCustomPattern(strBuffer);
            if (this.utilityService.matchPattern(str)) {
                str = this.utilityService.pageNoReplace(str);
            }
            const modifiedBuffer = Buffer.from(str, 'ascii');
            for (let byte of modifiedBuffer) {
                if (byte !== 0x08 && byte !== 10) {
                    currentJob.crLine.push(byte);
                }
                if (!currentJob.lineBuffer[currentJob.lineCount]) {
                    currentJob.lineBuffer[currentJob.lineCount] = [];
                }
                let crTm = this.utilityService.getIndianTM();
                if (currentJob.lineBuffer[currentJob.lineCount] && currentJob.lineBuffer[currentJob.lineCount].length && currentJob.lineBuffer[currentJob.lineCount][0]) {
                    crTm = currentJob.lineBuffer[currentJob.lineCount][0];
                }
                currentJob.lineBuffer[currentJob.lineCount] = [crTm, currentJob.crLine, currentJob.lineCount];
                this.removeExtraLines(currentJob);
                if (byte === 0x08) {
                    try {
                        if (currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1] != currentJob.lineCount) {
                            currentJob.lineCount = currentJob.globalBuffer[currentJob.globalBuffer.length - 1][1];
                            currentJob.crLine = currentJob.lineBuffer[currentJob.lineCount][1];
                        }
                        this.removeExtraLines(currentJob);
                    }
                    catch (error) {
                        this.logger.error('Error handling backspace:', error);
                    }
                    currentJob.crLine.pop();
                    try {
                        currentJob.globalBuffer.pop();
                    }
                    catch (error) {
                        this.logger.error('Error ', error);
                    }
                }
                else {
                    try {
                        currentJob.globalBuffer.push([byte, currentJob.lineCount]);
                    }
                    catch (error) {
                        this.logger.error('Error ', error);
                    }
                }
                if (byte == 10) {
                    currentJob.crLine = [];
                    currentJob.lineCount++;
                }
            }
            this.utilityService.saveData(currentJob.lineBuffer, currentSession, 'linebuffer');
            this.utilityService.saveData(currentJob.globalBuffer, currentSession, 'globalbuffer');
            let objs = {
                lineBuffer: currentJob.lineBuffer,
                lineCount: currentJob.lineCount,
                crLine: currentJob.crLine
            };
            this.utilityService.saveData(objs, currentSession, 'allsession');
        }
        catch (error) {
            this.logger.error('Error in parseDataQueue:', error);
        }
        await this.sendToUsers(currentJob, sessions);
    }
    removeExtraLines(currentJob) {
        try {
            if ((currentJob.lineBuffer.length - 1) > currentJob.lineCount) {
                currentJob.lineBuffer.splice(currentJob.lineCount + 1);
            }
        }
        catch (error) {
            this.logger.error('Error removing extra lines:', error);
        }
    }
    async addToLocalFile(incomingBuffer) {
        try {
            const log_msg = (incomingBuffer.toString('hex'));
            const logPath = `logs/s_${this.sessionService.currentSessionid}`;
            try {
                await fs_1.promises.mkdir(logPath, { recursive: true });
            }
            catch (error) {
            }
            fs.appendFile(`${logPath}/cmds.txt`, log_msg + '\n', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                }
            });
        }
        catch (error) {
            this.logger.error('Error adding to local file:', error);
        }
    }
    async sendToUsers(CurrentJob, sessions) {
        try {
            if (CurrentJob?.lineBuffer?.length) {
                let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];
                try {
                    for (let x of array) {
                        let tabs = await this.verifyTab.verify(x[1]);
                        x[7] = tabs;
                    }
                }
                catch (error) {
                }
                if (array?.length) {
                    this.server.emit("message", {
                        i: this.sessionService.CurrentJob.lineCount,
                        d: array,
                        date: this.sessionService.currentSessionid
                    });
                }
            }
        }
        catch (error) {
            this.logger.error('Error sending to local users:', error);
        }
        try {
            const sessionLiveId = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;
            if (this.sessionService.CurrentJob.lineBuffer.length) {
                let array = this.sessionService.CurrentJob.lineBuffer.slice(this.sessionService.CurrentJob.lineBuffer.length - 2, this.sessionService.CurrentJob.lineBuffer.length) || [];
                if (array.length) {
                    try {
                        for (let x of array) {
                            let tabs = await this.verifyTab.verify(x[1]);
                            x[7] = tabs;
                        }
                    }
                    catch (error) {
                    }
                    try {
                        let calculatedPage = Math.floor(array[array.length - 1][2] / (this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25)) + 1;
                        let datas = {
                            i: this.sessionService.CurrentJob.lineCount,
                            d: array,
                            date: sessionLiveId,
                            l: this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25,
                            p: calculatedPage
                        };
                        let localdatas = {
                            i: this.sessionService.CurrentJob.lineCount,
                            d: array,
                            date: this.sessionService.currentSessionid,
                            l: this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25,
                            p: calculatedPage
                        };
                        if (this.socketService.sockets && this.socketService.sockets) {
                            const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
                            if (liveServer) {
                                try {
                                    liveServer.emit("TCP-DATA", datas);
                                }
                                catch (error) {
                                }
                            }
                            else {
                                this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`);
                            }
                        }
                        await this.savedataService.saveDataFinal(localdatas, sessions, 'localdata', calculatedPage, this.sessionService.currentSessionLines);
                    }
                    catch (error) {
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Error in sendToUsers:', error);
        }
    }
    getCurrentServerSocket(nSesid) {
        const serverUrl = `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`;
        const socket = this.socketService.sockets.get(serverUrl);
        return socket;
    }
};
exports.ParseDataService = ParseDataService;
exports.ParseDataService = ParseDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _c : Object, typeof (_d = typeof socket_service_1.SocketService !== "undefined" && socket_service_1.SocketService) === "function" ? _d : Object, typeof (_e = typeof savedata_service_1.SavedataService !== "undefined" && savedata_service_1.SavedataService) === "function" ? _e : Object])
], ParseDataService);


/***/ }),
/* 53 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SequentialTaskQueue = void 0;
class SequentialTaskQueue {
    constructor() {
        this.taskQueue = [];
        this.isProcessing = false;
    }
    async addTask(task) {
        this.taskQueue.push(task);
        this.ensureProcessing();
    }
    async addDataTasks(dataArray, taskHandler) {
        const tasks = dataArray.map((data) => () => taskHandler(data));
        this.taskQueue.push(...tasks);
        this.ensureProcessing();
    }
    ensureProcessing() {
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    async processQueue() {
        if (this.isProcessing) {
            return;
        }
        this.isProcessing = true;
        while (this.taskQueue.length > 0) {
            const currentTask = this.taskQueue.shift();
            if (!currentTask) {
                continue;
            }
            try {
                await currentTask();
            }
            catch (error) {
                this.handleTaskError(error);
            }
        }
        this.isProcessing = false;
        if (this.taskQueue.length > 0) {
            this.processQueue();
        }
    }
    handleTaskError(error) {
        console.error('Task execution failed:', error);
    }
}
exports.SequentialTaskQueue = SequentialTaskQueue;


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SocketService = void 0;
const common_1 = __webpack_require__(3);
const socket_io_1 = __webpack_require__(28);
const socket_io_client_1 = __webpack_require__(55);
const session_service_1 = __webpack_require__(29);
const utility_service_1 = __webpack_require__(12);
const stream_data_service_1 = __webpack_require__(56);
const log_service_1 = __webpack_require__(39);
const event_emitter_1 = __webpack_require__(18);
let SocketService = class SocketService {
    handleUserCreatedEvent(payload) {
        console.log('User created event received:', payload);
        this.fetchAllServerDetail(payload.nCaseid);
    }
    constructor(ios, sessionServers, utility, streamService, log) {
        this.ios = ios;
        this.sessionServers = sessionServers;
        this.utility = utility;
        this.streamService = streamService;
        this.log = log;
        this.sockets = new Map();
        this.reconnectionDelays = new Map();
        this.connectedUrls = new Set();
        this.allservers = new Set();
        this.reconnectingServer = [];
        this.logApplication = 'realtime';
    }
    onApplicationBootstrap() {
    }
    async fetchAllServerDetail(nCaseid) {
        if (!nCaseid) {
            console.error('Case Id not found for fetchAllServerDetail');
            return;
        }
        let data = await this.sessionServers.getSessionsServers(nCaseid);
        if (data && data.length > 0) {
            for (let x of data) {
                if (x.cUrl && x.nPort)
                    this.connectToWebSocket(`http://${x.cUrl}:${x.nPort}`);
            }
        }
    }
    isSocketalreadyConnected(serverUrl) {
        return this.allservers.has(serverUrl);
    }
    connectToWebSocket(serverUrl, options, attemptReconnect = true) {
        try {
            this.log.info(`Socket Connecting to ${serverUrl}`, `${this.logApplication}/socket`);
            if (this.isSocketalreadyConnected(serverUrl)) {
                try {
                    let connectedSockt = this.sockets.get(serverUrl);
                    if (connectedSockt.connected) {
                        this.log.info(`socket url ${serverUrl} already connected`, `${this.logApplication}/socket`);
                        return;
                    }
                }
                catch (error) {
                }
            }
            this.allservers.add(serverUrl);
            const socket = (0, socket_io_client_1.io)(serverUrl, {
                reconnection: false,
                ...options
            });
            socket.on('connect', () => {
                this.log.info(`Connected to WebSocket server at ${serverUrl}`, `${this.logApplication}/socket`);
                console.log(`Connected to WebSocket server at ${serverUrl}`);
                this.streamFailedData(socket);
                this.connectedUrls.add(serverUrl);
                this.reconnectionDelays.set(serverUrl, 3000);
                this.sendConnectToServer();
            });
            socket.on('disconnect', () => {
                console.log(`Disconnected from WebSocket server at ${serverUrl}`);
                this.log.info(`Disconnected from WebSocket server at ${serverUrl}`, `${this.logApplication}/socket`);
                this.allservers.delete(serverUrl);
                this.connectedUrls.delete(serverUrl);
                this.handleReconnect(serverUrl, options);
            });
            socket.on('connect_error', (error) => {
                this.log.error(`connect_error at ${error?.message}`, `${this.logApplication}/socket`);
                this.allservers.delete(serverUrl);
                this.handleReconnect(serverUrl, options);
            });
            this.sockets.set(serverUrl, socket);
            this.curremtSocket = socket;
        }
        catch (error) {
        }
    }
    handleReconnect(serverUrl, options) {
        let delay = 3000;
        try {
            let idd = this.reconnectingServer.findIndex(x => x.url == serverUrl);
            if (idd > -1) {
                clearTimeout(this.reconnectingServer[idd].timer);
                this.reconnectingServer.splice(idd, 1);
            }
        }
        catch (error) {
        }
        let timer = setTimeout(() => {
            this.log.info(`Attempting to reconnect to ${serverUrl}`, `${this.logApplication}/socket`);
            this.connectToWebSocket(serverUrl, options);
        }, delay);
        this.reconnectingServer.push({ url: serverUrl, timer: timer });
        delay = Math.min(delay * 2, 30000);
        this.reconnectionDelays.set(serverUrl, delay);
    }
    sendMessage(serverUrl, event, message) {
        const socket = this.sockets.get(serverUrl);
        if (socket && socket.connected) {
            socket.emit(event, message);
        }
        else {
            console.log(`No connection to ${serverUrl} or socket is disconnected.`);
        }
    }
    onApplicationShutdown(signal) {
        this.sockets.forEach((socket, url) => {
            socket.close();
        });
    }
    sendConnectToServer() {
        let data = Array.from(this.connectedUrls);
        this.ios["server"].emit('live-servers', { msg: 1, urls: data });
    }
    getConnectedServers() {
        let data = Array.from(this.connectedUrls);
        return { msg: 1, urls: data };
    }
    async streamFailedData(socket) {
        try {
            if (this.sessionServers.currentSessionid) {
                let failedSessions = this.utility.getFaildSession();
                if (failedSessions.length) {
                    let obj = failedSessions.find(x => x.nSesid == this.sessionServers.currentSessionid);
                    if (obj && obj.d.length) {
                        let res = await this.streamService.sendFailedSessions(socket, obj.d, this.sessionServers.currentSessionid);
                        if (res) {
                            try {
                                failedSessions = failedSessions.filter(x => x.nSesid != this.sessionServers.currentSessionid);
                                this.utility.setFaildSession(failedSessions, this.sessionServers.currentSessionid);
                            }
                            catch (error) {
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
        }
    }
};
exports.SocketService = SocketService;
__decorate([
    (0, event_emitter_1.OnEvent)('socket.server.connect'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocketService.prototype, "handleUserCreatedEvent", null);
exports.SocketService = SocketService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('WEB_SOCKET_SERVER')),
    __metadata("design:paramtypes", [typeof (_a = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object, typeof (_d = typeof stream_data_service_1.StreamDataService !== "undefined" && stream_data_service_1.StreamDataService) === "function" ? _d : Object, typeof (_e = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _e : Object])
], SocketService);


/***/ }),
/* 55 */
/***/ ((module) => {

module.exports = require("socket.io-client");

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
var StreamDataService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamDataService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
const socket_io_1 = __webpack_require__(28);
const common_2 = __webpack_require__(3);
const config_1 = __webpack_require__(22);
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
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BridgeParseService = void 0;
const common_1 = __webpack_require__(3);
const session_service_1 = __webpack_require__(29);
const utility_service_1 = __webpack_require__(12);
const savedata_service_1 = __webpack_require__(57);
const socket_service_1 = __webpack_require__(54);
const fs = __webpack_require__(11);
const fs_1 = __webpack_require__(11);
const squential_task_1 = __webpack_require__(53);
const session_store_service_1 = __webpack_require__(47);
const verify_tabs_service_1 = __webpack_require__(44);
const query_services_1 = __webpack_require__(35);
const db_service_1 = __webpack_require__(36);
const transfer_highlights_service_1 = __webpack_require__(59);
const fuzzy_search_service_1 = __webpack_require__(61);
const p_limit_1 = __webpack_require__(65);
const date_time_service_1 = __webpack_require__(30);
const identity_fix_service_1 = __webpack_require__(66);
const event_emitter_1 = __webpack_require__(18);
let BridgeParseService = class BridgeParseService {
    setServer(server) {
        this.server = server;
    }
    handleUserCreatedEvent(payload) {
        debugger;
        console.log(' event received:', payload);
        this.fetchSessionFeedToLocal(payload.nSesid);
    }
    handleC(payload) {
        console.log('bridge.data.cmd.event event received:', payload);
        this.cmds = payload?.data || [];
    }
    constructor(utilityService, sessionService, savedataService, socketService, sessionStore, verifyTab, queryService, db, transferHighlightsService, fuzzySearch, dateTime, identityFixService) {
        this.utilityService = utilityService;
        this.sessionService = sessionService;
        this.savedataService = savedataService;
        this.socketService = socketService;
        this.sessionStore = sessionStore;
        this.verifyTab = verifyTab;
        this.queryService = queryService;
        this.db = db;
        this.transferHighlightsService = transferHighlightsService;
        this.fuzzySearch = fuzzySearch;
        this.dateTime = dateTime;
        this.identityFixService = identityFixService;
        this.logger = new common_1.Logger('bridge-viewer');
        this.formates = [{ key: `0x00`, value: 'FL' },
            { key: 0x01, value: 'QES' },
            { key: 0x02, value: 'ANS' },
            { key: 0x03, value: 'SPKR' },
            { key: 0x04, value: 'QES-CONTINUE' },
            { key: 0x05, value: 'ANS-CONTINUE' },
            { key: 0x06, value: 'SPKR-CONTINUE' },
            { key: 0x07, value: 'PRNTH' },
            { key: 0x08, value: 'CNTRD' },
            { key: 0x09, value: 'RHT-FLS' },
            { key: 0x0A, value: 'BY-LINE' },
            { key: 0x0B, value: 'BY-LINE-CONTINUE' },
            { key: 0x0C, value: 'USR-DEFIND' }];
        this.isChecked = false;
        this.isContinue = 0;
        this.isComplete = false;
        this.cmds = 0;
        this.taskQueue = new squential_task_1.SequentialTaskQueue();
    }
    async onApplicationBootstrap() {
    }
    async fetchSessionFeedToLocal(nSesid) {
        try {
            debugger;
            const sessionData = await this.sessionStore.fetchSessionMetaData(nSesid);
            if (Object.keys(sessionData)?.length) {
                this.sessionService.CurrentJob = Object.assign(this.sessionService.CurrentJob, sessionData);
                const sessions = await this.sessionStore.getAllLinesForSession(nSesid);
                this.sortArray(sessions);
                this.sessionService.CurrentJob.lineBuffer = sessions;
            }
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    SendToParseData(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions) {
        this.taskQueue.addTask(async () => {
            try {
                const startOn = new Date();
                await this.startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
                this.cmds++;
            }
            catch (error) {
            }
        });
    }
    async startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions) {
        try {
            await this.getParseCMDS(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
            return true;
        }
        catch (error) {
            console.error('Error processing buffer:', error);
            return false;
        }
    }
    async getParseCMDS(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions) {
        try {
            try {
                const buffer = Buffer.from(CMD_DATA["hexCmd"], 'hex');
                const CMDdata = CMD_DATA;
                await this.parseDataBridge(buffer, CMDdata, currentSession, currentJob, sessions);
            }
            catch (error) {
                console.log('ERROR', error);
            }
        }
        catch (error) {
            console.log('ERROR', error);
        }
        return true;
    }
    async parseDataBridge(incomingBuffer, CMDdata, currentSession, currentJob, sessions) {
        if (CMDdata.cmdType) {
            await this.handleCommand(CMDdata.cmdType, CMDdata, incomingBuffer, currentJob, currentSession, sessions);
        }
        else {
            for (let i = 0; incomingBuffer.length > i; i++) {
                await this.handleText(incomingBuffer[i], currentJob);
            }
        }
        try {
            currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
        }
        catch (error) {
        }
        return true;
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
        try {
            array.map((line, index) => line[2] = index);
        }
        catch (error) {
        }
    }
    async handleCommand(command, CMDdata, data, currentJob, currentSession, sessions) {
        const LINES_PER_PAGE = 25;
        try {
            switch (command) {
                case 'P':
                    await this.finalizeLine(currentJob);
                    if (data.length >= 2) {
                        currentJob.currentPage = data.readUInt16LE(2);
                        this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                    }
                    break;
                case 'N':
                    await this.finalizeLine(currentJob);
                    if (data.length >= 1) {
                        const receivedLineNumber = data.readUInt8(2);
                        currentJob.currentLineNumber = receivedLineNumber;
                        if (!currentJob.lineCount) {
                            currentJob.lineCount = 0;
                        }
                        if (currentJob.isRefresh) {
                            return;
                        }
                        currentJob.lineCount++;
                        currentJob.lineBuffer[currentJob.lineCount] = ['', [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null];
                        currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
                        this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                    }
                    break;
                case 'F':
                    if (data.length >= 1) {
                        const formatCode = data.readUInt8(2);
                        const format = this.formates.find(f => parseInt(f.key, 16) === formatCode);
                        if (format) {
                            currentJob.currentFormat = format.value;
                            currentJob.crLine = [];
                            this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                        }
                    }
                    break;
                case 'T':
                    await this.finalizeLine(currentJob);
                    if (data.length >= 4) {
                        const hours = this.sliceDate(data.readUInt8(2));
                        const minutes = this.sliceDate(data.readUInt8(3));
                        const seconds = this.sliceDate(data.readUInt8(4));
                        const frames = this.sliceDate(data.readUInt8(5));
                        currentJob.currentTimestamp = `${hours}:${minutes}:${seconds}:${frames}`;
                        this.refreshReplaceData(currentJob);
                        if (!currentJob.isRefresh) {
                            try {
                                currentJob.lineBuffer[currentJob.lineCount][0] = currentJob.currentTimestamp;
                            }
                            catch (error) {
                            }
                        }
                        await this.updateLineBuffer(currentJob);
                        this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                    }
                    break;
                case 'G':
                    if (CMDdata.searchString) {
                        await this.replaceGlobal(currentJob, CMDdata.searchString, CMDdata.replaceString, sessions);
                    }
                    break;
                case 'R':
                    this.sessionService.current_refresh++;
                    this.isContinue++;
                    this.printCommands(`Replace : ${this.isContinue} \n ${data.toString('hex')}`);
                    currentJob.relaceLines = [];
                    currentJob.isRefresh = true;
                    if (this.sessionService.currentSessionHaveRefresh) {
                        currentJob.oldLineData = [currentJob.lineCount, currentJob.currentLineNumber, currentJob.currentTimestamp, currentJob.currentFormat, currentJob.currentPage, currentJob.crLine];
                        try {
                            currentJob.refreshTimeStamp = [`${this.sliceDate(data.readUInt8(2))}:${this.sliceDate(data.readUInt8(3))}:${this.sliceDate(data.readUInt8(4))}:${this.sliceDate(data.readUInt8(5))}`, `${this.sliceDate(data.readUInt8(6))}:${this.sliceDate(data.readUInt8(7))}:${this.sliceDate(data.readUInt8(8))}:${this.sliceDate(data.readUInt8(9))}`];
                            this.printCommands(`Time : ${JSON.stringify(currentJob.refreshTimeStamp)}`);
                            await this.RefreshLog(currentJob, `_${this.sessionService.current_refresh}`, `BEFORE-- (refresh on ${new Date().toISOString()}) \n ${currentJob.refreshTimeStamp}`);
                        }
                        catch (error) {
                        }
                    }
                    this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                    break;
                case 'E':
                    if (this.sessionService.currentSessionHaveRefresh) {
                        await this.refreshLogsLines(currentJob, `_${this.sessionService.current_refresh}`);
                        await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Refreshing end executing onRefreshEnd-- \n ${currentJob.refreshTimeStamp}`, []);
                        if (currentJob.relaceLines?.length) {
                            this.printCommands(`refresh ${this.sessionService.current_refresh} End  \n ${JSON.stringify(currentJob.relaceLines)}`);
                            const pagesToRefresh = [];
                            const lg_dt3 = new Date();
                            await this.onRefreshEnd(currentJob);
                            this.logger.debug(`Refresh End ${this.sessionService.current_refresh}`);
                        }
                        try {
                            if (currentJob.oldLineData.length) {
                                const lastData = currentJob.lineBuffer[currentJob.lineBuffer.length - 1];
                                currentJob.lineCount = currentJob.lineBuffer.length - 1;
                                currentJob.currentLineNumber = lastData[5];
                                currentJob.currentTimestamp = lastData[0];
                                currentJob.currentFormat = lastData[3];
                                currentJob.currentPage = lastData[4];
                                currentJob.crLine = lastData[1];
                            }
                        }
                        catch (error) {
                        }
                    }
                    currentJob.oldLineData = [];
                    currentJob.relaceLines = [];
                    currentJob.isRefresh = false;
                    this.sessionStore.saveMetaData(this.sessionService.currentSessionid, currentJob);
                    let timedeff = '';
                    try {
                        timedeff = `${currentJob.refreshTimeStamp} ${currentJob.refreshTimeStamp?.length ? currentJob.refreshTimeStamp?.map(this.convertToFrame) : null}`;
                    }
                    catch (error) {
                    }
                    await this.RefreshLog(currentJob, `_${this.sessionService.current_refresh}`, `After--(On ${new Date().toISOString()}) \n ${timedeff}`);
                    break;
                case 'D':
                    try {
                        if (!currentJob.crLine.length) {
                            currentJob.lineCount = Math.abs(currentJob.lineCount - 1);
                            currentJob.crLine = currentJob.lineBuffer[currentJob.lineCount][1];
                        }
                        else {
                            currentJob.crLine.pop();
                        }
                    }
                    catch (error) {
                    }
                    this.refreshReplaceData(currentJob);
                    await this.updateLineBuffer(currentJob);
                    break;
                default:
                    console.warn(`\n\r\n\rUnknown command: ${command}`);
            }
        }
        catch (err) {
            console.error('Error handling command:', err.message);
        }
        return true;
    }
    sliceDate(date) {
        try {
            return ('0000' + date.toString()).slice(-2);
        }
        catch (error) {
            return date;
        }
    }
    async handleText(byte, currentJob) {
        try {
            if (byte !== 0x08) {
                if (!currentJob.crLine) {
                    currentJob.crLine = [];
                }
                currentJob.crLine.push(byte);
            }
            this.refreshReplaceData(currentJob);
            await this.updateLineBuffer(currentJob);
            if (byte === 0x0A) {
                await this.finalizeLine(currentJob);
            }
        }
        catch (error) {
            console.log('ERROR', error);
        }
        return true;
    }
    async finalizeLine(currentJob) {
        if (currentJob.crLine.length > 0) {
            await this.updateLineBuffer(currentJob);
            currentJob.crLine = [];
        }
        return true;
    }
    async updateLineBuffer(currentJob) {
        if (currentJob.isRefresh)
            return;
        const crTm = currentJob.currentTimestamp || "0:0:0:0";
        if (!currentJob.currentTimestamp) {
        }
        currentJob.customTimestamp = this.utilityService.getIndianTM();
        if (!currentJob.lineBuffer[currentJob.lineCount]) {
            currentJob.lineBuffer[currentJob.lineCount] = [crTm, [], currentJob.lineCount, currentJob.currentFormat || 'FL', currentJob.currentPage || 1, currentJob.currentLineNumber || 1, null, null, null, null];
        }
        currentJob.lineBuffer[currentJob.lineCount][1] = currentJob.crLine.slice();
        if (currentJob.crLine?.length > 0) {
            if (!currentJob.globalBuffer) {
                currentJob.globalBuffer = [];
            }
            currentJob.globalBuffer.push([currentJob.crLine[currentJob.crLine.length - 1], currentJob.lineCount]);
        }
        currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
        let nId;
        try {
            nId = currentJob.lineBuffer[currentJob.lineCount][6] || null;
        }
        catch (error) {
            nId = null;
        }
        try {
            const tabs = await this.verifyTab.verify(currentJob.lineBuffer[currentJob.lineCount][1]);
            if (tabs?.length) {
                currentJob.lineBuffer[currentJob.lineCount][7] = tabs;
            }
            if (currentJob.lineBuffer[currentJob.lineCount][0])
                currentJob.lineBuffer[currentJob.lineCount][8] = this.convertToFrame(currentJob.lineBuffer[currentJob.lineCount][0]);
        }
        catch (error) {
        }
        const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, nId, currentJob.lineBuffer[currentJob.lineCount]);
        try {
            if (currentJob.lineBuffer && currentJob.lineBuffer[currentJob.lineCount]?.length) {
                currentJob.lineBuffer[currentJob.lineCount][6] = id;
            }
        }
        catch (error) {
        }
        await this.addToLocalFile(currentJob);
        this.emitToLocalUser(currentJob);
        return true;
    }
    async removeExtraLines(currentJob) {
        try {
            if ((currentJob.lineBuffer.length - 1) > currentJob.lineCount) {
                const extraLines = currentJob.lineBuffer.filter((a, index) => index > currentJob.lineCount);
                if (extraLines?.length) {
                    for (let i = 0; extraLines.length > i; i++) {
                        try {
                            await this.sessionStore.deleteLine(this.sessionService.currentSessionid, extraLines[i][6]);
                        }
                        catch (error) {
                        }
                    }
                }
            }
        }
        catch (error) {
            console.log('ERROR', error);
        }
        return true;
    }
    async replaceGlobal(currentJob, searchString, replaceString, sessions) {
        try {
            const lg_dt2 = new Date();
            for (let index = 0; currentJob.lineBuffer.length > index; index++) {
                const line = currentJob.lineBuffer[index];
                if (line && line.length) {
                    if (line[1].length > 0) {
                        const lineStr = line[1].map(char => String.fromCharCode(char)).join('');
                        const newLineStr = lineStr.replace(new RegExp(searchString, 'g'), replaceString);
                        if (lineStr !== newLineStr) {
                            const newLine = newLineStr.split('').map(char => char.charCodeAt(0));
                            currentJob.lineBuffer[index][1] = newLine;
                            const pageNo = Math.floor(index / (this.sessionService.currentSessionLines || 25)) + 1;
                            const relativeLineIndex = index % (this.sessionService.currentSessionLines || 25);
                            await this.sendGlobalReplace(currentJob, currentJob.lineBuffer[index], pageNo, relativeLineIndex, index, this.sessionService.currentSessionid);
                        }
                    }
                }
            }
            console.log('    Global replace', new Date().getTime() - lg_dt2.getTime());
        }
        catch (error) {
        }
        return true;
    }
    async sendGlobalReplace(currentjob, lineData, pageNo, lineno, globalIndex, sessionId) {
        const sendData = {
            line: lineData,
            nSesid: sessionId,
            page: pageNo,
            lineno: lineno
        };
        try {
            const tabs = await this.verifyTab.verify(lineData[1]);
            if (tabs?.length) {
                lineData[7] = tabs;
            }
            if (lineData[0])
                lineData[8] = this.convertToFrame(lineData[0]);
        }
        catch (error) {
        }
        try {
            const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, (currentjob.lineBuffer[globalIndex][6] || null), lineData);
            if (!currentjob.lineBuffer[globalIndex][6]) {
                currentjob.lineBuffer[globalIndex][6] = id;
            }
        }
        catch (error) {
        }
        try {
            this.server.emit("line-replace", sendData);
            const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
            if (liveServer) {
                try {
                    liveServer.emit("line-replace", sendData);
                }
                catch (error) {
                }
            }
            else {
                this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`);
            }
        }
        catch (error) {
        }
        return true;
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
    refreshReplaceData(currentJob) {
        if (currentJob.isRefresh) {
            if (!currentJob.relaceLines) {
                currentJob.relaceLines = [];
            }
            const ind = currentJob.relaceLines.findIndex(a => a[5] == currentJob.currentLineNumber && a[0] == currentJob.currentTimestamp);
            if (ind > -1) {
                currentJob.relaceLines[ind] = [currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null];
            }
            else {
                currentJob.relaceLines.push([currentJob.currentTimestamp, currentJob.crLine, 0, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber, null]);
            }
        }
    }
    async fetchPreviousData(clientId, data, annotations, highlights) {
        const feeddata = this.sessionService.CurrentJob?.lineBuffer || [];
        const pageDataLength = data.totalLines || 25;
        if (feeddata && feeddata.length) {
            const totalpages = Math.ceil(feeddata.length / pageDataLength);
            for (let i = totalpages; i >= 1; i--) {
                const pageData = this.getPageData(feeddata, i, pageDataLength);
                const aDATA = [], hDATA = [];
                try {
                    if (annotations) {
                        aDATA.push(...annotations.filter(a => Number(a.pageIndex) == i));
                    }
                    if (highlights) {
                        hDATA.push(...highlights.filter(a => Number(a.cPageno) == i));
                    }
                }
                catch (error) {
                }
                await this.delayFn(10);
                this.server.to(clientId).emit('previous-data', { msg: 1, page: i, data: JSON.stringify(pageData), totalPages: totalpages, nSesid: data.nSesid, a: aDATA, h: hDATA, tab: data.tab, tabSessionId: data.tabSessionId });
            }
        }
    }
    async delayFn(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    removeTimestampsInRange(timestamps, range) {
        const [startRange, endRange] = range.map(this.convertToFrame);
        let startIndex = -1;
        let endIndex = -1;
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
                    if (timestamps[index][6])
                        removedData.push(timestamps[index]);
                }
                catch (error) {
                    console.log(error);
                }
                if (startIndex === -1)
                    startIndex = index;
                endIndex = index;
            }
            return !isInRange;
        });
        return {
            newData,
            removedData,
            startIndex,
            endIndex,
        };
    }
    convertToFrame(timestamp) {
        if (!timestamp)
            return '';
        const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
        return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
    }
    convertToFrameWithoutNanoSec(timestamp) {
        if (!timestamp)
            return '';
        const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
        return ((hours * 3600 + minutes * 60 + seconds) * 30);
    }
    async onRefreshEnd(currentJob) {
        try {
            if (this.sessionService.current_refresh == 90) {
                debugger;
            }
            this.sortArray(currentJob.lineBuffer);
            if (currentJob.refreshTimeStamp?.length) {
                const start = currentJob.refreshTimeStamp[0];
                const end = currentJob.refreshTimeStamp[1];
                const OldLineBuffer = [...currentJob.lineBuffer];
                const { newData, startIndex, endIndex, removedData } = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);
                try {
                    if (removedData?.length) {
                        await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Removed lines -- \n ${currentJob.refreshTimeStamp}`, removedData);
                        const removedDataString = removedData.map(line => line[6]);
                        await this.sessionStore.removeLinesFromRedis(this.sessionService.currentSessionid, removedDataString);
                    }
                }
                catch (error) {
                    console.log(error);
                }
                this.printFeedInTxt(`total = ${currentJob.lineBuffer?.length}, new = ${currentJob.relaceLines?.length} , replaced count = ${currentJob.lineBuffer?.length - newData?.length}`);
                currentJob.lineBuffer = newData;
                const oldLength = currentJob.lineBuffer?.length;
                currentJob.relaceLines.map((line, index) => line[2] = currentJob.lineBuffer.length + index);
                let mainStartId;
                try {
                    mainStartId = currentJob.lineBuffer[startIndex - 1][6];
                }
                catch (error) {
                    mainStartId = 0;
                    try {
                        await this.refreshLogs(`_Transfer`, 'annot', `\n "refresh":"${this.sessionService.current_refresh}", "error": ${error?.message} `);
                    }
                    catch (error) {
                    }
                }
                try {
                    if (!mainStartId && currentJob.relaceLines?.length) {
                        const firstTime = currentJob.relaceLines[0][0];
                        const startLine = currentJob.lineBuffer.findLast(a => this.convertToFrame(firstTime) >= this.convertToFrame(a[0]));
                        if (startLine)
                            mainStartId = startLine[6];
                    }
                }
                catch (error) {
                    try {
                        await this.refreshLogs(`_Transfer`, 'annot', `\n "refresh":"${this.sessionService.current_refresh}", "Condition":2,"error": ${error?.message} `);
                    }
                    catch (error) {
                    }
                    mainStartId = 0;
                }
                const newValues = [];
                const finalNewLines = [];
                if (currentJob.relaceLines) {
                    const rmLines = [...removedData];
                    for (let [index, a] of currentJob.relaceLines.entries()) {
                        const randomNo = Math.floor(Math.random() * (1000 - 200 + 1)) + 200;
                        try {
                            const tabs = await this.verifyTab.verify(a[1]);
                            if (tabs?.length) {
                                a[7] = tabs;
                            }
                            if (a[0])
                                a[8] = this.convertToFrame(a[0]);
                        }
                        catch (error) {
                        }
                        try {
                            a[9] = index;
                        }
                        catch (error) {
                        }
                        let nId = null;
                        const previousId = rmLines.findLastIndex(z => this.convertToFrame(z[0]) == this.convertToFrame(a[0]));
                        if (previousId > -1) {
                            nId = rmLines[previousId][6] || (mainStartId + randomNo);
                            newValues.push([nId, true]);
                            rmLines.splice(previousId, 1);
                        }
                        else {
                            nId = (mainStartId + randomNo);
                            newValues.push([nId]);
                        }
                        mainStartId = nId;
                        const id = await this.sessionStore.saveLine(this.sessionService.currentSessionid, nId, a);
                        a[6] = id;
                        finalNewLines.push(a);
                    }
                }
                try {
                    await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `New lines -- \n ${currentJob.refreshTimeStamp}`, currentJob.relaceLines);
                }
                catch (error) {
                }
                try {
                    if (newValues?.length) {
                        const check = this.identityFixService.validateValues(newValues);
                        if (!check.ok) {
                            try {
                                await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Duplicate identity found in new lines -- \n ${currentJob.refreshTimeStamp}`, check?.errors || []);
                            }
                            catch (error) {
                            }
                            const fixed = this.identityFixService.attemptFix(newValues);
                            if (fixed?.values?.length) {
                                const newArray = fixed?.values || [];
                                if (finalNewLines.length == newArray?.length) {
                                    try {
                                        await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Fixing Duplicate Lines  -- \n ${currentJob.refreshTimeStamp}`, newArray);
                                    }
                                    catch (error) {
                                    }
                                    for (let [index, x] of finalNewLines.entries()) {
                                        if (newArray[index]) {
                                            if (newArray[index][0]) {
                                                x[6] = newArray[index][0];
                                            }
                                        }
                                    }
                                    try {
                                        await this.removedLog(currentJob, `_${this.sessionService.current_refresh}`, `Final FIxing -- \n ${currentJob.refreshTimeStamp}`, finalNewLines);
                                    }
                                    catch (error) {
                                    }
                                }
                                else {
                                    try {
                                        await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Duplicate Fixing lenght not match with new (New = ${finalNewLines?.length}) (Fixed = ${newArray?.lenght}) -- \n ${currentJob.refreshTimeStamp}`, fixed?.error || []);
                                    }
                                    catch (error) {
                                    }
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    try {
                        await this.logForFixing(currentJob, `_${this.sessionService.current_refresh}`, `Fixing Failed -- \n ${error?.message}`, []);
                    }
                    catch (error) {
                    }
                }
                if (finalNewLines?.length) {
                    currentJob.lineBuffer.push(...finalNewLines);
                }
                this.sortArray(currentJob.lineBuffer);
                const startPage = Math.ceil((startIndex + 1) / (this.sessionService.currentSessionLines || 25));
                const relaceLines = [...(currentJob?.relaceLines || [])];
                await this.SendRefreshDataToUser(currentJob, startIndex, endIndex, currentJob.relaceLines, start, end, startPage);
                await this.handleAnnotTransfer(currentJob.lineBuffer, relaceLines, startPage, start, end, removedData, OldLineBuffer);
            }
        }
        catch (error) {
            console.log(error);
        }
        try {
            currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
        }
        catch (error) {
        }
        await this.addToLocalFile(currentJob);
        return true;
    }
    async performQuery(nSesid, pageno, cType, jIdentities) {
        const res = await this.db.executeRef('annottransfer_getdetail_v2', { nSesid, pageno, cType, jIdentities: JSON.stringify(jIdentities.map(String)) }, 'realtime');
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                this.logger.error(`Session end failed :${res.error} `);
                return [];
            }
        }
        else {
            this.logger.error(`Session end failed :${res.error} `);
            return [];
        }
    }
    async anotTransferUpdate(fun, data) {
        const res = await this.db.executeRef(fun, data, 'realtime');
        if (res.success) {
            try {
                return { msg: 1, ...res.data[0][0] };
            }
            catch (error) {
                this.logger.error(`Session transfer update failed :${res.error} `);
                return { msg: -1, value: res.error };
            }
        }
        else {
            this.logger.error(`Session transfer update failed :${res.error} `);
            return { msg: -1, value: res.error };
        }
    }
    async anotTransferInsertQuickMark(fun, data) {
        const res = await this.db.executeRef(fun, data, 'realtime');
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                this.logger.error(`Session end failed :${res.error} `);
                return [];
            }
        }
        else {
            this.logger.error(`Session end failed :${res.error} `);
            return [];
        }
    }
    async handleAnnotTransfer(lineBuffer, relaceLines, startPage, start, end, removedData, OldLineBuffer) {
        const total_lines = (this.sessionService?.currentSessionLines || 25);
        const transferStart = this.dateTime.getCurrentTime();
        const transferStartTm = new Date();
        try {
            debugger;
            const newlines = relaceLines;
            try {
                await this.transferReport(`_Transfer`, 'annot', `\n{\n "refreshCount":${this.sessionService.current_refresh},\n "start": "${transferStart}", `);
            }
            catch (error) {
            }
            try {
                await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` On - ${new Date().toISOString()} \n\n Annot transfer for startpage  ${startPage}\n ${start} : ${end} \n lineBuffer length : ${lineBuffer?.length} \n`);
            }
            catch (error) {
            }
            const startPageData = (parseInt(startPage) - 3) > 0 ? (parseInt(startPage) - 3) : 1;
            const data = await this.performQuery(this.sessionService.currentSessionid, startPageData, 'I', []);
            try {
                await this.transferReport(`_Transfer`, 'annot', `\n "totalAnnots":${data?.length},`);
            }
            catch (error) {
            }
            if (data?.length) {
                this.logger.debug(`Annotation data for transfer on refresh ${this.sessionService.current_refresh} totalAnnots:  ${data?.length}`);
                const affectedAnnots = [];
                const finalDbUpdate = [];
                const limit = (0, p_limit_1.default)(5);
                const startTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: start }, 'START', 2);
                const endTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: end }, 'END', 2);
                try {
                    data.map(a => a.cONote = (a.cONote?.lenght) ? a.cONote.join(' ') : a.cONote);
                }
                catch (error) {
                }
                const changedAnnots = data.filter(a => {
                    const cordinates = a.jOCordinates || a.jCordinates || [];
                    const isInRefresh = cordinates.findIndex(m => this.convertToFrame(m.t) >= this.convertToFrame(startTimeStamp) && this.convertToFrame(m.t) <= this.convertToFrame(endTimeStamp)) > -1;
                    return isInRefresh;
                });
                try {
                    await this.transferReport(`_Transfer`, 'annot', `\n "TransferingAnnots":${changedAnnots?.length},`);
                }
                catch (error) {
                }
                try {
                    await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` Total Annots : ${data?.length}, Trasnfring Annoted ${changedAnnots?.length} \n\n `);
                }
                catch (error) {
                }
                const tasks = changedAnnots.map((x) => limit(async () => {
                    const transferStartDetail = this.dateTime.getCurrentTime();
                    const transferStartTmDetail = new Date();
                    x.transferStartTmDetail = transferStartTmDetail;
                    try {
                        await this.transferAnnotReport(`_Transfer`, 'annot', `"refreshCount":${this.sessionService.current_refresh},"nId": "${x.nId}","cType": "${x.cType}","start": "${transferStartDetail}" \n `);
                    }
                    catch (error) {
                    }
                    const { updateDetail, dbObject, isNotInRefresh } = await this.performForAnnots(x, lineBuffer, total_lines, start);
                    if (!isNotInRefresh && !updateDetail) {
                        affectedAnnots.push({ nId: x.nId, cType: x.cType, isInActivated: true, nUserid: x.nUserid });
                        finalDbUpdate.push({ nId: x.nId, cType: x.cType, isInActivated: true, nUserid: x.nUserid });
                    }
                    else {
                        if (updateDetail) {
                            updateDetail["isInActivated"] = false;
                        }
                    }
                    const transferEndDetail = this.dateTime.getCurrentTime();
                    const transferEndTmDetail = new Date();
                    x.transferEndTmDetail = transferEndTmDetail;
                    try {
                        await this.transferAnnotReport(`_Transfer`, 'annot', `{"refreshCount":${this.sessionService.current_refresh}, "nId": "${x.nId}", "cType": "${x.cType}", "end": "${transferEndDetail}", "duration": ${x.transferEndTmDetail - x.transferStartTmDetail} },\n `);
                    }
                    catch (error) {
                    }
                    if (updateDetail) {
                        affectedAnnots.push(updateDetail);
                    }
                    if (dbObject) {
                        finalDbUpdate.push(dbObject);
                    }
                }));
                await Promise.all(tasks);
                if (affectedAnnots?.length) {
                    if (finalDbUpdate?.length) {
                        await this.updateAnnotToDb(finalDbUpdate);
                    }
                    this.logger.verbose(`Affected Annots updated for ${affectedAnnots?.length} `);
                    try {
                        await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` Affected annots \n ${affectedAnnots.map(a => a.nId).join(',')}`);
                    }
                    catch (error) {
                    }
                    this.annotRefrshTransfer(affectedAnnots, 'A');
                }
                else {
                    try {
                        await this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` No annot affected \n`);
                    }
                    catch (error) {
                    }
                }
            }
            else {
                try {
                    this.transferLog(`_${this.sessionService.current_refresh}`, 'annot', ` NO DATA TO TRANSFER \n`);
                }
                catch (error) {
                }
            }
        }
        catch (error) {
            this.logger.error(`Error for quick facts in handleAnnotTransfer:`, error);
        }
        try {
            const transferEndTm = new Date();
            await this.transferReport(`_Transfer`, 'annot', `\n "annotTransfered":"${this.dateTime.getCurrentTime()}",\n "annotDuration": ${transferEndTm - transferStartTm}, `);
        }
        catch (error) {
        }
        try {
            try {
                await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` On - ${new Date().toISOString()} \n\n highlight transfer for ${start} : ${end} \n lineBuffer length : ${lineBuffer?.length} \n`);
            }
            catch (error) {
            }
            const identities = removedData.map(a => a[6]).filter(a => a);
            const startPageData = (parseInt(startPage) - 3) > 0 ? (parseInt(startPage) - 3) : 1;
            const data = await this.performQuery(this.sessionService.currentSessionid, startPageData, 'H', identities || []);
            if (data?.length) {
                this.logger.debug(`Quick marks for transfer on refresh ${this.sessionService.current_refresh} totalAnnots:  ${data?.length}`);
                const changed_highlights = [];
                const finalDbUpdate = [];
                const limit = (0, p_limit_1.default)(5);
                const startTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: start }, 'START', 2);
                const endTimeStamp = await this.closestTimestampWithMargin(lineBuffer, { t: end }, 'END', 2);
                const changedHighlight = data.filter(a => {
                    const cordinates = a.jOCordinates || [{ t: a.cOTime || a.cTime, text: a.cONote || a.cNote, isMain: true }] || 0;
                    const isInRefresh = cordinates.findIndex(m => this.convertToFrame(m.t) >= this.convertToFrame(startTimeStamp) && this.convertToFrame(m.t) <= this.convertToFrame(endTimeStamp)) > -1;
                    return isInRefresh;
                });
                try {
                    await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` Total Marks : ${data?.length}, Trasnfring Marks ${changedHighlight?.length} \n\n `);
                }
                catch (error) {
                }
                const tasks = changedHighlight.map((x) => limit(async () => {
                    const { updateDetail, dbObject } = await this.performForHighlight(x, lineBuffer, total_lines);
                    if (updateDetail) {
                        changed_highlights.push(updateDetail);
                    }
                    if (dbObject) {
                        finalDbUpdate.push(dbObject);
                    }
                }));
                await Promise.all(tasks);
                if (changed_highlights?.length) {
                    if (finalDbUpdate?.length) {
                        await this.anotTransferUpdate('annottransfer_updatecordinates_quickmark_multi', { jList: JSON.stringify(finalDbUpdate) });
                    }
                    try {
                        const maxValue = Math.max(...data.map(item => item.nHid));
                        await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` Affected Quick marks updated for ${changed_highlights?.length} \n Max nHid = ${maxValue} \n affected quick marks ${changed_highlights.map(a => a.nHid).join(', ')} \n`);
                    }
                    catch (error) {
                    }
                    this.logger.verbose(`Affected Quick marks updated for ${changed_highlights?.length} `);
                    this.annotRefrshTransfer(changed_highlights, 'H');
                }
                else {
                    try {
                        await this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` No quick marks affected \n`);
                    }
                    catch (error) {
                    }
                }
            }
            else {
                try {
                    this.transferLog(`_${this.sessionService.current_refresh}`, 'highlight', ` NO DATA TO TRANSFER \n`);
                }
                catch (error) {
                }
            }
        }
        catch (error) {
            this.logger.error(`Error for Quick marks in handleAnnotTransfer: `, error);
        }
        try {
            const transferEndTm = new Date();
            await this.transferReport(`_Transfer`, 'annot', `\n "end":"${this.dateTime.getCurrentTime()}", "duration": ${transferEndTm - transferStartTm} \n},`);
        }
        catch (error) {
        }
    }
    async updateAnnotToDb(finalDbUpdate) {
        const batchSize = 200;
        const concurrency = 3;
        const limit = (0, p_limit_1.default)(concurrency);
        const batches = [];
        for (let i = 0; i < finalDbUpdate.length; i += batchSize) {
            batches.push(finalDbUpdate.slice(i, i + batchSize));
        }
        const tasks = batches.map(batch => limit(async () => {
            await this.anotTransferUpdate('annottransfer_updatecordinates_multi_v2', {
                jList: JSON.stringify(batch),
            });
        }));
        await Promise.all(tasks);
    }
    async performForAnnots(x, lineBuffer, total_lines, start) {
        const cordinates = x.jOCordinates || x.jCordinates || [];
        try {
            const firstCordinate = cordinates[0];
            const lastCordinate = cordinates[cordinates.length - 1];
            const margin = 6;
            const startCordinateIndex = await this.closestTimestamp(lineBuffer, firstCordinate);
            const endCordinateIndex = await this.closestTimestamp(lineBuffer, lastCordinate);
            const firstMarginIndex = await this.marginLineIndex(lineBuffer, startCordinateIndex, 'START', margin);
            const LastMarginIndex = await this.marginLineIndex(lineBuffer, endCordinateIndex, 'END', margin);
            const marginBuffer = this.getMarginBuffer(lineBuffer, firstMarginIndex, LastMarginIndex);
            const bufferTexts = marginBuffer.map(a => ({ timestamp: a[0], index: a[2], text: (a[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '') }));
            const terms = cordinates.map(a => ({ text: (a.text || '').trim(), timestamp: a.t }));
            const body = {
                content: bufferTexts,
                terms: terms,
                refreshCount: this.sessionService.current_refresh,
                nSesid: this.sessionService.currentSessionid,
                type: x.cType || 'A',
                nId: x.nId
            };
            try {
                const finalOutput = await this.fuzzySearch.generateNewCordinates(body);
                if (!finalOutput)
                    throw new Error('Nothing founds');
                if (finalOutput?.length) {
                    let firstLine = null;
                    let firstPage = null;
                    const newCordinates = [];
                    finalOutput.forEach((c) => {
                        const bufferValue = lineBuffer[c.index];
                        const calculatedPage = (Math.floor(bufferValue[2] / total_lines) + 1);
                        const pageNumber = (bufferValue[2] % (this.sessionService.currentSessionLines || 25)) + 1;
                        if (!firstPage)
                            firstPage = calculatedPage;
                        if (!firstLine)
                            firstLine = pageNumber;
                        const obj = {
                            t: c.timestamp,
                            debug_t: bufferValue[0],
                            l: pageNumber,
                            p: calculatedPage,
                            text: c.text,
                            oP: bufferValue[4],
                            oL: bufferValue[5],
                            identity: bufferValue[6],
                            refreshCount: this.sessionService.current_refresh
                        };
                        newCordinates.push({ ...({ x: 0, y: 0, height: 20, weight: 0 }), ...obj });
                    });
                    const dbObject = {
                        nId: x.nId,
                        cType: x.cType,
                        jCordinates: (!x.jOCordinates || !x.jOCordinates?.length) ? x.jCordinates : [],
                        cONote: x.cONote,
                        newCordinates: newCordinates,
                        nRefresh: this.sessionService.current_refresh,
                        firstPage,
                        firstLine,
                        isInActivated: !newCordinates?.length
                    };
                    x.jCordinates = newCordinates;
                    try {
                        x.cordinates = newCordinates;
                    }
                    catch (error) {
                    }
                    return { updateDetail: x, dbObject };
                }
                else {
                    throw new Error('No Result found on searchrequest');
                }
            }
            catch (error) {
                try {
                    await this.transferPyLog(`_Transfer`, 'annot', `{\n "refreshCount":${this.sessionService.current_refresh}, \n  "nId":"${x.nId}", \n "failed": "${error?.message || ''}", \n "content":${JSON.stringify(body.content)} , \n "terms": ${JSON.stringify(terms)} \n},\n`);
                }
                catch (error) {
                }
            }
        }
        catch (error) {
            this.logger.error(`Error in annot transfer for ${x.nId}`, error);
        }
        return { updateDetail: null, dbObject: null };
    }
    async performForHighlight(x, lineBuffer, total_lines) {
        try {
            const cordinates = x.jOCordinates || [{ t: x.cOTime || x.cTime, text: x.cONote || x.cNote, isMain: true }] || 0;
            const firstCordinate = cordinates[0];
            const lastCordinate = cordinates[cordinates.length - 1];
            const margin = 3;
            const startCordinateIndex = await this.closestTimestamp(lineBuffer, firstCordinate);
            const endCordinateIndex = await this.closestTimestamp(lineBuffer, lastCordinate);
            const firstMarginIndex = await this.marginLineIndex(lineBuffer, startCordinateIndex, 'START', margin);
            const LastMarginIndex = await this.marginLineIndex(lineBuffer, endCordinateIndex, 'END', margin);
            const marginBuffer = this.getMarginBuffer(lineBuffer, firstMarginIndex, LastMarginIndex);
            const bufferTexts = marginBuffer.map(a => ({ timestamp: a[0], index: a[2], text: (a[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '') }));
            const terms = cordinates.map(a => ({ text: (a.text || '').trim(), timestamp: a.t }));
            const body = {
                content: bufferTexts,
                terms: terms,
                refreshCount: this.sessionService.current_refresh,
                nSesid: this.sessionService.currentSessionid,
                type: 'H',
                nId: x.nHid
            };
            const finalOutput = await this.fuzzySearch.generateNewCordinates(body);
            if (!finalOutput || !finalOutput?.length)
                throw new Error('Nothing founds');
            const newCordinates = [];
            const dbObject = {
                nHid: x.nHid,
                nRefresh: this.sessionService.current_refresh,
                cOLDPageno: x.cPageno,
                cOLDLineno: x.cLineno,
                cOLDTime: x.cOTime || x.cTime,
                cOLDNote: x.cONote || x.cNote,
                oldidentity: x.identity
            };
            dbObject['jOCordinates'] = cordinates;
            let wordCount = -1;
            finalOutput.forEach((c) => {
                const bufferValue = lineBuffer[c.index];
                const calculatedPage = (Math.floor(bufferValue[2] / total_lines) + 1);
                let otext = '';
                try {
                    otext = (bufferValue[1].map(b => String.fromCharCode(b))?.join('')?.trim() || '');
                }
                catch (error) {
                }
                const obj = {
                    t: c.timestamp,
                    text: c.text,
                    otext: otext,
                    isMain: false,
                    identity: bufferValue[6],
                    refreshCount: this.sessionService.current_refresh
                };
                const newCount = c.text?.trim()?.split('')?.length || 0;
                if (newCount >= wordCount) {
                    wordCount = newCount;
                    newCordinates.map(a => a.isMain = false);
                    obj["isMain"] = true;
                    dbObject['cPageno'] = calculatedPage;
                    dbObject['cLineno'] = (bufferValue[2] % (this.sessionService.currentSessionLines || 25)) + 1;
                    dbObject['cTime'] = c.timestamp;
                    dbObject['cNote'] = otext;
                    dbObject['identity'] = bufferValue[6];
                }
                newCordinates.push(obj);
            });
            dbObject["jCordinates"] = newCordinates;
            x.cPageno = dbObject['cPageno'];
            x.cLineno = dbObject['cLineno'];
            x.cTime = dbObject['cTime'];
            x.cNote = dbObject['cNote'];
            x.identity = dbObject['identity'];
            return { updateDetail: x, dbObject };
        }
        catch (error) {
            this.logger.error(`Error in highlight transfer for ${x.nHid}`, error);
        }
        return { updateDetail: null, dbObject: null };
    }
    getMarginBuffer(lineBuffer, startIndex, endIndex) {
        try {
            if (startIndex < 0 || endIndex < 0 || startIndex >= lineBuffer.length || endIndex >= lineBuffer.length) {
                return [];
            }
            return [...lineBuffer].slice(startIndex, endIndex + 1);
        }
        catch (error) {
            this.logger.error(`Error in getMarginBuffer: ${error?.message}`);
            return [];
        }
    }
    async marginLineIndex(lineBuffer, index, type, margin = 4) {
        try {
            if (type == 'START') {
                if ((index - margin) >= 0) {
                    return index - margin;
                }
                else {
                    return 0;
                }
            }
            else {
                if ((index + margin) < lineBuffer.length) {
                    return index + margin;
                }
                else {
                    return lineBuffer.length - 1;
                }
            }
        }
        catch (error) {
            return null;
        }
    }
    async closestTimestamp(lineBuffer, cordinate) {
        const targetFrames = this.convertToFrame(cordinate.t);
        let closestIdx = 0;
        let smallestDiff = Infinity;
        for (let i = 0; i < lineBuffer.length; i++) {
            try {
                const tsString = lineBuffer[i][0];
                const frames = this.convertToFrame(tsString);
                const diff = Math.abs(frames - targetFrames);
                if (diff < smallestDiff) {
                    smallestDiff = diff;
                    closestIdx = i;
                }
            }
            catch (error) {
            }
        }
        return closestIdx;
    }
    async closestTimestampWithMargin(lineBuffer, coordinate, mode, margin) {
        const targetFrames = this.convertToFrame(coordinate.t);
        let closestIdx;
        if (mode === 'START') {
            const revIdx = [...lineBuffer]
                .reverse()
                .findIndex(entry => this.convertToFrame(entry[0]) <= targetFrames);
            closestIdx = revIdx === -1 ? -1 : lineBuffer.length - 1 - revIdx;
        }
        else {
            closestIdx = lineBuffer.findIndex(entry => this.convertToFrame(entry[0]) >= targetFrames);
        }
        if (closestIdx === -1) {
            closestIdx = mode === 'START' ? 0 : lineBuffer.length - 1;
        }
        const marginIdx = mode === 'START'
            ? Math.max(0, closestIdx - margin)
            : Math.min(lineBuffer.length - 1, closestIdx + margin);
        return lineBuffer[marginIdx][0];
    }
    async transferOnTimeMargin(x, removedMarked, relaceLines, total_lines, changed_highlights) {
        if (this.findHighlightExistsInNew(x, removedMarked, relaceLines)) {
            let rows = relaceLines.filter(a => this.convertToFrameWithoutNanoSec(a[0]) == this.convertToFrameWithoutNanoSec(x.cTime));
            let timeDiffernce = false;
            if (!rows?.length) {
                rows = relaceLines.filter(a => this.diffInSeconds(a[0], x.cTime) == 1);
                timeDiffernce = true;
            }
            const newQuickMarks = [];
            for (let [index, r] of rows.entries()) {
                const markedIndex = removedMarked.findIndex(b => this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(r[0]));
                const globalIndex = r[2];
                const line = (globalIndex % (total_lines)) + 1;
                const calculatedPage = Math.floor(((globalIndex || 0)) / total_lines) + 1;
                newQuickMarks.push({
                    cNote: r[1]?.map(a => String.fromCharCode(a)).join(''),
                    cPageno: calculatedPage,
                    cLineno: line,
                    cTime: r[0],
                    oP: r[4],
                    oL: r[5],
                    identity: r[6],
                    timeDiffernce: timeDiffernce,
                    previousIdentity: markedIndex > -1 ? removedMarked[markedIndex][6] : null
                });
                if (markedIndex > -1) {
                    removedMarked.splice(markedIndex, 1);
                }
            }
            await this.saveNewHighlightsd(x, changed_highlights, newQuickMarks);
        }
    }
    async saveNewHighlightsd(x, changed_highlights, newQuickMarks) {
        try {
            if (newQuickMarks.length) {
                const res = await this.anotTransferInsertQuickMark('annottransfer_insert_ref_quickmark', {
                    nSessionId: this.sessionService.currentSessionid,
                    nHid: x.nHid,
                    jNewData: JSON.stringify(newQuickMarks),
                });
                try {
                    if (res?.length) {
                        newQuickMarks.forEach(a => {
                            const nObj = res.find(m => m.identity == a.identity);
                            if (nObj)
                                changed_highlights.push({ ...a, ...nObj });
                        });
                    }
                }
                catch (error) {
                    this.logger.error(`Error while updating nHid in new quick marks ${error?.message}`);
                }
            }
        }
        catch (error) {
            this.logger.error(`Error while saving new highlights: ${error?.message}`);
        }
    }
    async findHighlightExistsInNew(x, removedMarked, relaceLines) {
        try {
            const markedIndex = removedMarked.findIndex(b => this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(x.cTime));
            const relaceIndex = relaceLines.findIndex(b => this.convertToFrameWithoutNanoSec(b[0]) == this.convertToFrameWithoutNanoSec(x.cTime) ||
                this.diffInSeconds(b[0], x.cTime) == 1);
            if (markedIndex > -1 && relaceIndex > -1) {
                return true;
            }
        }
        catch (error) {
        }
        return false;
    }
    async getHighlightInPrevious(x, OldLineBuffer) {
        let from = null, to = null, isHavePrevious = false;
        try {
            const ind = OldLineBuffer.findIndex(a => this.convertToFrameWithoutNanoSec(a[0]) == this.convertToFrameWithoutNanoSec(x.cTime) && (a[6] == x.identity));
            if (ind > -1) {
                from = OldLineBuffer[ind][0];
                if (OldLineBuffer[ind - 1]) {
                    isHavePrevious = true;
                    from = OldLineBuffer[ind - 1][0];
                }
                if (OldLineBuffer[ind + 1])
                    to = OldLineBuffer[ind + 1][0];
            }
        }
        catch (error) {
        }
        return { from, to, isHavePrevious };
    }
    async annotRefrshTransfer(affectedAnnots, cType) {
        try {
            let data = [];
            if (['A', 'QF', 'F', 'D'].includes(cType)) {
                data = affectedAnnots.map(x => ({
                    nId: x.nId,
                    cType: x.cType,
                    nHid: x.nHid,
                    cONote: x.cONote,
                    jCordinates: x.jCordinates,
                    cPageno: x.cPageno,
                    cLineno: x.cLineno,
                    nUserid: x.nUserid,
                    isInActivated: x.isInActivated
                }));
            }
            else {
                data = affectedAnnots;
            }
            const sendData = {
                nSesid: this.sessionService.currentSessionid,
                cType: cType,
                data: data || []
            };
            this.server.emit("annot-refresh-transfer", sendData);
            const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
            if (liveServer) {
                try {
                    liveServer.emit("annot-refresh-transfer", sendData);
                }
                catch (error) {
                }
            }
            else {
                this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`);
            }
        }
        catch (error) {
            console.log('ERROR IN TRANSFER', error);
        }
    }
    async SendRefreshDataToUser(currentJob, startInd, endInd, newLines, start, end, startPage) {
        const sendData = {
            nSesid: this.sessionService.currentSessionid,
            startInd: startInd,
            refreshType: this.sessionService?.refreshType,
            endInd: endInd,
            newLines: newLines || [],
            start: start,
            end: end,
            startPage,
            current_refresh: this.sessionService.current_refresh || 0
        };
        try {
            this.printRefSendCmd(`Refresh ${this.sessionService.current_refresh} send to user \n ${JSON.stringify(sendData)}`);
            await this.server.emit("feed-refresh-data", sendData);
            sendData.nSesid = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;
            const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
            if (liveServer) {
                try {
                    liveServer.emit("feed-refresh-data", sendData);
                }
                catch (error) {
                }
            }
            else {
                this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`);
            }
        }
        catch (error) {
            this.printRefSendCmd(`Refresh ${this.sessionService.current_refresh} Failed to send`);
        }
    }
    async addToLocalFile(currentJob) {
    }
    async transferLog(key, type, log) {
        try {
            const log_msg = `\n${log}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/transfer`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
        }
        catch (error) {
            console.log(error);
        }
    }
    async transferPyLog(key, type, log) {
        try {
            const log_msg = `${log}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/python`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
        }
        catch (error) {
            console.log(error);
        }
    }
    async transferReport(key, type, log) {
        try {
            const log_msg = `${log}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/report`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
        }
        catch (error) {
            console.log(error);
        }
    }
    async refreshLogs(key, type, log) {
        try {
            const log_msg = `${log}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh-log`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
        }
        catch (error) {
            console.log(error);
        }
    }
    async transferAnnotReport(key, type, log) {
        try {
            const log_msg = `${log}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/report-annot`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/${type}_${key}.txt`, log_msg);
        }
        catch (error) {
            console.log(error);
        }
    }
    async RefreshLog(currentJob, key, val) {
        try {
            this.sortArray(currentJob.lineBuffer);
            const allDts = currentJob.lineBuffer.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]}) :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`);
            const log_msg = `${val}  \n ${allDts} \n\n\n replacing with condition ${this.sessionService?.refreshType}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.lineBuffer?.length + '\n\n\n');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async logForFixing(currentJob, key, val, arrayELement) {
        try {
            const allDts = arrayELement.map((a, index) => (a && a.length ? `  identity = (${a[0]})  : IsPrevious = ${a[1] ? 'True' : 'False'}` + `\n` : ''));
            const log_msg = `${val}  \n ${allDts}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
            await fs_1.promises.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n ');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async removedLog(currentJob, key, val, removedLines) {
        try {
            this.sortArray(currentJob.lineBuffer);
            const allDts = removedLines.map((a, index) => (a && a.length ? `  page = ${Math.floor(index / 25) + 1} (${a[4]})  : line = ${(index % 25) + 1}  (${a[5]}) : ${a[0]} (${a[8]}) (${a[6]})  :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ` : 'BLANK LINE') + `\n`);
            const log_msg = `${val}  \n ${allDts}`;
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}/refresh`;
            try {
                await fs_1.promises.mkdir(sessionDir, { recursive: true });
            }
            catch (error) {
            }
            await fs_1.promises.appendFile(`${sessionDir}/refreshlog_${key}.txt`, log_msg + '\n ');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async refreshLogsLines(currentJob, key) {
        try {
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    printFeedInTxt(log) {
        try {
        }
        catch (error) {
            console.log('ERROR', error);
        }
    }
    parseTimeFormate(formate) {
        if (formate) {
            const date = new Date();
            const frmArry = formate.split(':');
            date.setHours(frmArry[0], frmArry[1], frmArry[2], frmArry[3]);
            return date;
        }
        else {
            return null;
        }
    }
    async printRefSendCmd(data) {
        try {
            const sessionDir = `logs/s_${this.sessionService.currentSessionid}`;
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
            });
        }
        catch (error) {
        }
    }
    printCommands(logdata) {
        try {
            const log_msg = `${logdata}\n\r\n\r\n\r\n`;
            fs.appendFile('commands_replace.txt', log_msg + '\n', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                    throw err;
                }
            });
        }
        catch (error) {
        }
    }
    emitToLocalUser(currentJob) {
        try {
            const total_lines = (this.sessionService.currentSessionLines ? this.sessionService.currentSessionLines : 25);
            if (currentJob.lineBuffer?.length) {
                const array = currentJob.lineBuffer.slice(currentJob.lineBuffer.length - 2, currentJob.lineBuffer.length) || [];
                try {
                    array.map((a, index) => a[2] = (index == 0 ? currentJob.lineBuffer.length - 2 : currentJob.lineBuffer.length - 1));
                }
                catch (error) {
                    console.log('\n\r\n\r\n\rERROR', error);
                }
                const calculatedPage = Math.floor((currentJob.lineBuffer?.length ? (currentJob.lineBuffer?.length - 1) : 0) / total_lines) + 1;
                if (array.length) {
                    const sendData = {
                        i: currentJob.lineCount,
                        d: array,
                        date: this.sessionService.currentSessionid,
                        l: total_lines,
                        p: calculatedPage
                    };
                    if (this.server) {
                        this.server.emit("message", sendData);
                    }
                    if (this.socketService.sockets) {
                        const sessionLiveId = this.sessionService.getLiveId(this.sessionService.currentSessionid) || this.sessionService.currentSessionid;
                        sendData.date = sessionLiveId;
                        const liveServer = this.getCurrentServerSocket(this.sessionService.currentSessionid);
                        if (liveServer) {
                            try {
                                liveServer.emit("TCP-DATA", sendData);
                            }
                            catch (error) {
                            }
                        }
                        else {
                            this.logger.error(`Server not found  `, `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`);
                        }
                    }
                }
            }
        }
        catch (error) {
        }
    }
    async emitRefReshPages(currentJob, startPg) {
    }
    toSeconds(timeStr) {
        const [hours, minutes, seconds] = timeStr.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }
    diffInSeconds(t1, t2) {
        const s1 = this.toSeconds(t1);
        const s2 = this.toSeconds(t2);
        return Math.abs(s2 - s1);
    }
    getCurrentServerSocket(nSesid) {
        if (!this.sessionService.currentSessionDetail?.cUrl) {
            this.logger.error('No Server found on session', this.sessionService.currentSessionDetail);
        }
        const serverUrl = `http://${this.sessionService.currentSessionDetail?.cUrl}:${this.sessionService.currentSessionDetail?.nPort}`;
        const socket = this.socketService.sockets.get(serverUrl);
        return socket;
    }
};
exports.BridgeParseService = BridgeParseService;
__decorate([
    (0, event_emitter_1.OnEvent)('session.store.fetchmetadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BridgeParseService.prototype, "handleUserCreatedEvent", null);
__decorate([
    (0, event_emitter_1.OnEvent)('bridge.data.cmd.event'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BridgeParseService.prototype, "handleC", null);
exports.BridgeParseService = BridgeParseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof savedata_service_1.SavedataService !== "undefined" && savedata_service_1.SavedataService) === "function" ? _c : Object, typeof (_d = typeof socket_service_1.SocketService !== "undefined" && socket_service_1.SocketService) === "function" ? _d : Object, typeof (_e = typeof session_store_service_1.SessionStoreService !== "undefined" && session_store_service_1.SessionStoreService) === "function" ? _e : Object, typeof (_f = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _f : Object, typeof (_g = typeof query_services_1.QueryService !== "undefined" && query_services_1.QueryService) === "function" ? _g : Object, typeof (_h = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _h : Object, typeof (_j = typeof transfer_highlights_service_1.TransferHighlightsService !== "undefined" && transfer_highlights_service_1.TransferHighlightsService) === "function" ? _j : Object, typeof (_k = typeof fuzzy_search_service_1.FuzzySearchService !== "undefined" && fuzzy_search_service_1.FuzzySearchService) === "function" ? _k : Object, typeof (_l = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _l : Object, typeof (_m = typeof identity_fix_service_1.IdentityFixService !== "undefined" && identity_fix_service_1.IdentityFixService) === "function" ? _m : Object])
], BridgeParseService);


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
var TransferHighlightsService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransferHighlightsService = void 0;
const common_1 = __webpack_require__(3);
const rhighlights_service_1 = __webpack_require__(60);
let TransferHighlightsService = TransferHighlightsService_1 = class TransferHighlightsService {
    constructor(rhighlightsService) {
        this.rhighlightsService = rhighlightsService;
        this.logger = new common_1.Logger(TransferHighlightsService_1.name);
    }
    async transferHighlights(lineBuffer, removedLine, newLines, finalData) {
        try {
            await this.rhighlightsService.transfer(lineBuffer, removedLine, newLines, finalData);
        }
        catch (error) {
            this.logger.error(`Error in transferHighlights: ${error.message}`, error.stack);
        }
    }
};
exports.TransferHighlightsService = TransferHighlightsService;
exports.TransferHighlightsService = TransferHighlightsService = TransferHighlightsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof rhighlights_service_1.RhighlightsService !== "undefined" && rhighlights_service_1.RhighlightsService) === "function" ? _a : Object])
], TransferHighlightsService);


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
exports.RhighlightsService = void 0;
const common_1 = __webpack_require__(3);
const session_service_1 = __webpack_require__(29);
let RhighlightsService = class RhighlightsService {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    transfer(lineBuffer, removedLine, newLines, finalData) {
    }
};
exports.RhighlightsService = RhighlightsService;
exports.RhighlightsService = RhighlightsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _a : Object])
], RhighlightsService);


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
var FuzzySearchService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FuzzySearchService = void 0;
const common_1 = __webpack_require__(3);
const difflib_1 = __webpack_require__(62);
const rapidfuzz_service_1 = __webpack_require__(63);
const axios_1 = __webpack_require__(24);
const rxjs_1 = __webpack_require__(23);
const config_1 = __webpack_require__(22);
let FuzzySearchService = FuzzySearchService_1 = class FuzzySearchService {
    constructor(rapidfuzzService, httpService, config) {
        this.rapidfuzzService = rapidfuzzService;
        this.httpService = httpService;
        this.config = config;
        this.logger = new common_1.Logger(FuzzySearchService_1.name);
    }
    findBestMatchIndexDiffLib(lines, query, threshold = 0.6) {
        if (!Array.isArray(lines)) {
            throw new Error('Invalid input: lines must be an array');
        }
        try {
            let bestIdx = -1;
            let bestScore = threshold;
            for (let idx = 0; idx < lines.length; idx++) {
                const matcher = new difflib_1.SequenceMatcher(null, query, lines[idx]);
                const score = matcher.ratio();
                if (score >= threshold && score > bestScore) {
                    bestScore = score;
                    bestIdx = idx;
                }
            }
            if (bestIdx >= 0) {
                this.logger.log(`difflib BEST match @${bestIdx} (score=${bestScore.toFixed(3)})`);
            }
            else {
                this.logger.log(`No difflib match above threshold=${threshold}`);
            }
            return bestIdx;
        }
        catch (error) {
            this.logger.error(`Error in findBestMatchIndexDiffLib (threshold=${threshold}): ${error.message}`, error.stack);
            throw new Error('Failed to perform fuzzy search (difflib)');
        }
    }
    findMatcheIndexDiffLib(lines, query, type, margin, matchedFirstIndex = null, threshold = 0.6) {
        if (!Array.isArray(lines)) {
            throw new Error('Invalid input: lines must be an array');
        }
        try {
            const len = lines.length;
            const startIdx = Math.min(Math.max(Math.floor(margin), 0), len - 1);
            if (type === 'START') {
                for (let idx = startIdx; idx >= 0; idx--) {
                    const matcher = new difflib_1.SequenceMatcher(null, query, lines[idx]);
                    const score = matcher.ratio();
                    if (score >= threshold) {
                        const wordIndex = this.getMatchWordIndex(matcher, lines[idx], 'START');
                        this.logger.log(`difflib START match @${idx} (score=${score.toFixed(3)}, wordIndex=${wordIndex})`);
                        return { lineIndex: idx, wordIndex };
                    }
                }
            }
            else {
                for (let idx = matchedFirstIndex; idx < len; idx++) {
                    const matcher = new difflib_1.SequenceMatcher(null, query, lines[idx]);
                    const score = matcher.ratio();
                    if (score >= threshold) {
                        const wordIndex = this.getMatchWordIndex(matcher, lines[idx], 'END');
                        this.logger.log(`difflib END match @${idx} (score=${score.toFixed(3)}, wordIndex=${wordIndex})`);
                        return { lineIndex: idx, wordIndex };
                    }
                }
            }
            this.logger.log(`No difflib match (${type}) under threshold=${threshold}`);
            return { lineIndex: -1, wordIndex: -1 };
        }
        catch (error) {
            this.logger.error(`Error in findMatcheIndexDiffLib (type=${type}, margin=${margin}, threshold=${threshold}): ${error.message}`, error.stack);
            throw new Error('Failed to perform fuzzy search (difflib)');
        }
    }
    getMatchWordIndex(matcher, line, type) {
        const matchingBlocks = matcher.getMatchingBlocks();
        if (matchingBlocks.length === 0) {
            return 0;
        }
        let bestBlock = matchingBlocks[0];
        for (const block of matchingBlocks) {
            if (block.size > bestBlock.size) {
                bestBlock = block;
            }
        }
        const charPosition = type === 'START' ? bestBlock.b : bestBlock.b + bestBlock.size - 1;
        return this.charPositionToWordIndex(line, charPosition, type);
    }
    charPositionToWordIndex(text, charPosition, type) {
        const words = text.split(/\s+/);
        let currentPos = 0;
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const wordStart = currentPos;
            const wordEnd = currentPos + word.length - 1;
            if (charPosition >= wordStart && charPosition <= wordEnd) {
                return type === 'START' ? i : i;
            }
            if (charPosition < wordStart + word.length + 1) {
                return type === 'START' ? i : i;
            }
            currentPos += word.length + 1;
        }
        return type === 'START' ? 0 : words.length - 1;
    }
    cleanText(input) {
        try {
            return input;
        }
        catch (error) {
            return input;
            this.logger.error(`Error cleaning text: ${error.message}`, error.stack);
        }
    }
    findFuzzySearch(bufferLines, queryString, isRecalculateLine) {
        debugger;
        const lines = bufferLines.map(line => line.trim());
        const query = this.cleanText(queryString.trim());
        let bestScore = 0;
        let bestChunk = '';
        let bestLineStart = -1;
        let bestLineEnd = -1;
        let bestStartWordIdx = -1;
        let bestEndWordIdx = -1;
        for (let i = 0; i < lines.length; i++) {
            const candidates = [
                { text: lines[i], startLine: i, endLine: i }
            ];
            if (i < lines.length - 1) {
                candidates.push({
                    text: lines[i].trim() + ' ' + lines[i + 1].trim(),
                    startLine: i,
                    endLine: i + 1
                });
            }
            for (const cand of candidates) {
                const words = cand.text.split(/\s+/);
                for (let start = 0; start < words.length; start++) {
                    for (let end = start + 1; end <= words.length; end++) {
                        const chunk = words.slice(start, end).join(' ');
                        const score = new difflib_1.SequenceMatcher(null, query, chunk).ratio();
                        if (score > bestScore) {
                            bestScore = score;
                            bestChunk = chunk;
                            bestLineStart = cand.startLine;
                            bestLineEnd = cand.endLine;
                            bestStartWordIdx = start;
                            bestEndWordIdx = end - 1;
                        }
                    }
                }
            }
        }
        if (bestLineStart !== -1 && bestLineEnd !== -1 && bestLineStart !== bestLineEnd) {
            const wordsLineStart = lines[bestLineStart].trim().split(/\s+/);
            const offset = wordsLineStart.length;
            if (bestStartWordIdx >= offset) {
                bestStartWordIdx -= offset;
                bestEndWordIdx -= offset;
                bestLineStart = bestLineEnd;
            }
            else {
                bestEndWordIdx -= offset;
            }
        }
        this.logger.fatal('Lines', lines);
        this.logger.fatal('Query', query);
        const extracted = this.extractFuzzyText(lines, bestLineStart, bestLineEnd, bestStartWordIdx, bestEndWordIdx, isRecalculateLine);
        this.logger.fatal('Final Result', {
            chunk: bestChunk,
            score: bestScore,
            fromStartLine: extracted.fromStartLine,
            fromEndLine: extracted.fromEndLine,
            startLine: bestLineStart + 1,
            endLine: bestLineEnd + 1,
            startWordIndex: bestStartWordIdx,
            endWordIndex: bestEndWordIdx
        });
        return {
            fromStartLine: extracted.fromStartLine,
            fromEndLine: extracted.fromEndLine,
            startLine: bestLineStart,
            endLine: bestLineEnd,
            startWordIndex: bestStartWordIdx,
            endWordIndex: bestEndWordIdx
        };
    }
    extractFuzzyText(lines, startLine, endLine, startWordIndex, endWordIndex, isRecalculateLine) {
        debugger;
        const result = {
            fromStartLine: '',
            fromEndLine: ''
        };
        if (startLine === endLine && !isRecalculateLine) {
            const words = lines[startLine].trim().split(/\s+/);
            if (startWordIndex <= endWordIndex) {
                const matchWords = words.slice(startWordIndex, endWordIndex + 1);
                result.fromStartLine = matchWords.join(' ');
                result.fromEndLine = result.fromStartLine;
            }
            return result;
        }
        const startWords = lines[startLine].trim().split(/\s+/);
        if (startWordIndex < startWords.length) {
            result.fromStartLine = startWords.slice(startWordIndex).join(' ');
        }
        const endWords = lines[endLine].trim().split(/\s+/);
        if (endWordIndex >= 0 && endWordIndex < endWords.length) {
            result.fromEndLine = endWords.slice(0, endWordIndex + 1).join(' ');
        }
        return result;
    }
    findBestFuzzyMatchInText(data, query) {
        const words = data.trim().split(/\s+/);
        console.log([...words].map((a, index) => `${index}: ${a}`));
        const qWords = query.trim().split(/\s+/);
        const qLen = qWords.length;
        if (!qLen || !words.length) {
            return { start: -1, end: -1, score: 0, chunk: '' };
        }
        const windowSizes = [qLen - 1, qLen, qLen + 1].filter(n => n > 0);
        let bestScore = 0, bestStart = 0, bestEnd = qLen - 1;
        for (const w of windowSizes) {
            for (let i = 0; i + w <= words.length; i++) {
                const chunk = this.chunkFromWords(words, i, i + w - 1);
                const score = this.fuzzyRatio(query, chunk);
                if (score > bestScore) {
                    bestScore = score;
                    bestStart = i;
                    bestEnd = i + w - 1;
                }
            }
        }
        const trimmed = this.trimBoundaries(words, query, bestStart, bestEnd, bestScore);
        return {
            start: trimmed.start,
            end: trimmed.end,
            score: trimmed.score,
            chunk: this.chunkFromWords(words, trimmed.start, trimmed.end)
        };
    }
    trimBoundaries(words, query, start, end, currentScore) {
        let improved = true;
        while (improved && start < end) {
            improved = false;
            const dropFirstChunk = this.chunkFromWords(words, start + 1, end);
            const scoreDropFirst = this.fuzzyRatio(query, dropFirstChunk);
            if (scoreDropFirst > currentScore) {
                start++;
                currentScore = scoreDropFirst;
                improved = true;
                continue;
            }
            const dropLastChunk = this.chunkFromWords(words, start, end - 1);
            const scoreDropLast = this.fuzzyRatio(query, dropLastChunk);
            if (scoreDropLast > currentScore) {
                end--;
                currentScore = scoreDropLast;
                improved = true;
            }
        }
        return { start, end, score: currentScore };
    }
    chunkFromWords(words, start, end) {
        return words.slice(start, end + 1).join(' ');
    }
    fuzzyRatio(a, b) {
        return new difflib_1.SequenceMatcher(null, a.trim(), b.trim()).ratio();
    }
    async textSearch(lines, queryLines) {
        debugger;
        const targetText = lines.map(a => a.trim()).join(' ');
        const query = queryLines.map(a => a.trim()).join(' ');
        let wordCounter = 0;
        const wordsWithMeta = lines.flatMap((text, lineIdx) => {
            return text
                .split(/\s+/)
                .map(word => ({
                wordIndex: wordCounter++,
                line: lineIdx,
                word
            }));
        });
        this.logger.fatal('Target Text', targetText);
        this.logger.fatal('Lines Detail', wordsWithMeta);
        const result = this.findBestFuzzyMatchInText(targetText, query);
        this.logger.fatal(`🔍 Query:     "${query.trim()}"`);
        this.logger.fatal(`🔍 Best span: words ${result.start}–${result.end}`);
        this.logger.fatal(`🎯 Score:     ${result.score.toFixed(3)}`);
        this.logger.fatal(`📦 Chunk:     "${result.chunk}"`);
        const cordinates = [];
        if (result.start >= 0 && result.end >= 0) {
            for (let i = result.start; i <= result.end; i++) {
                const wordMeta = wordsWithMeta[i];
                if (wordMeta) {
                    const lineObj = cordinates.find(a => a.line == wordMeta.line);
                    if (lineObj) {
                        lineObj.word += ` ${wordMeta.word}`;
                    }
                    else {
                        cordinates.push({
                            line: wordMeta.line,
                            word: wordMeta.word
                        });
                    }
                }
            }
        }
        else {
            this.logger.fatal('No matches found');
        }
        return cordinates;
    }
    async textSearchPython(lines, queryLines) {
        try {
            const rapidResult = await this.postSearchData(lines, queryLines);
            if (!rapidResult) {
                this.logger.warn('No results returned from Python search');
                return null;
            }
            return rapidResult;
        }
        catch (error) {
            this.logger.error('Error during text search with Python:', error);
            throw new Error(error?.message);
        }
    }
    extractMatches(lines, span) {
        const { start_line, start_word, end_line, end_word } = span;
        const results = [];
        for (let ln = start_line; ln <= end_line; ln++) {
            const text = lines[ln - 1] || '';
            const tokens = text.split(/\s+/).filter(t => t.length > 0);
            const from = ln === start_line ? start_word - 1 : 0;
            const to = ln === end_line ? end_word : tokens.length;
            const startIdx = Math.max(0, Math.min(from, tokens.length));
            const endIdx = Math.max(0, Math.min(to, tokens.length));
            const slice = tokens.slice(startIdx, endIdx);
            if (slice.length) {
                results.push({
                    line: ln - 1,
                    word: slice.join(' ')
                });
            }
        }
        return results;
    }
    async postSearchData(lines, queryLines) {
        try {
            const payload = {
                contentText: lines,
                searchText: queryLines
            };
            const url = this.config.get('SEARCH_API_URL') || 'http://127.0.0.1:5001/match';
            this.logger.verbose('URL', url);
            const response$ = this.httpService.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 1000 * 60,
            });
            const response = await (0, rxjs_1.lastValueFrom)(response$);
            if (response.status !== 200) {
                this.logger.error(`Python API responded with status ${response.status}`);
                throw new Error(`Python API responded with status ${response.status}`);
            }
            return response.data?.match || null;
        }
        catch (error) {
            this.logger.error('PY ERROR', error?.message);
            throw new Error(`PY ERROR ${error?.message}`);
        }
    }
    async generateNewCordinates(body) {
        try {
            const payload = body;
            const url = this.config.get('SEARCH_API_URL') || 'http://127.0.0.1:5001/search';
            const response$ = this.httpService.post(url, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 1000 * 60,
                maxRedirects: 2
            });
            const response = await (0, rxjs_1.lastValueFrom)(response$);
            if (response.status !== 200) {
                this.logger.error(`Python API responded with status ${response.status}`);
                throw new Error(`Python API responded with status ${response.status}`);
            }
            if (response.data?.msg == 1) {
                return response.data?.match;
            }
            else {
                throw new Error(`No response found :${response.data?.error || ''}`);
            }
        }
        catch (error) {
            this.logger.error('PY ERROR', error?.message);
            throw new Error(`PY ERROR ${error?.message}`);
        }
    }
};
exports.FuzzySearchService = FuzzySearchService;
exports.FuzzySearchService = FuzzySearchService = FuzzySearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof rapidfuzz_service_1.RapidfuzzService !== "undefined" && rapidfuzz_service_1.RapidfuzzService) === "function" ? _a : Object, typeof (_b = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], FuzzySearchService);


/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("difflib");

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
var RapidfuzzService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RapidfuzzService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(64);
const config_1 = __webpack_require__(22);
let RapidfuzzService = RapidfuzzService_1 = class RapidfuzzService {
    constructor(config) {
        this.config = config;
        this.filePath = `${this.config.get('ASSETS')}search.py`;
        this.logger = new common_1.Logger(RapidfuzzService_1.name);
    }
    runCommand(contxct, term) {
        const args = [
            this.filePath,
            JSON.stringify(contxct),
            JSON.stringify(term),
        ];
        return new Promise((resolve, reject) => {
            try {
                const child = (0, child_process_1.spawn)('py', args, { shell: false });
                let stdout = '';
                let stderr = '';
                child.stdout.on('data', (data) => {
                    const chunk = data.toString();
                    stdout += chunk;
                    this.logger.debug(`stdout: ${chunk}`);
                });
                child.stderr.on('data', (data) => {
                    const chunk = data.toString();
                    stderr += chunk;
                    this.logger.error(`stderr: ${chunk}`);
                });
                child.on('close', (code) => {
                    this.logger.log(`Process exited with code ${code}`);
                    if (code === 0) {
                        resolve(JSON.parse(stdout));
                    }
                    else {
                        const error = new Error(`Exit code ${code}: ${stderr}`);
                        reject(error);
                    }
                });
                child.on('error', (err) => {
                    this.logger.error(`Spawn error: ${err.message}`);
                    reject(err);
                });
            }
            catch (error) {
                this.logger.error(`Unexpected error: ${error.message}`);
                reject(error);
            }
        });
    }
};
exports.RapidfuzzService = RapidfuzzService;
exports.RapidfuzzService = RapidfuzzService = RapidfuzzService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RapidfuzzService);


/***/ }),
/* 64 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 65 */
/***/ ((module) => {

module.exports = require("p-limit");

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
exports.IdentityFixService = void 0;
const common_1 = __webpack_require__(3);
let IdentityFixService = class IdentityFixService {
    validateValues(values) {
        const errors = [];
        const seen = new Set();
        for (let i = 0; i < values.length; i++) {
            const entry = values[i];
            if (!Array.isArray(entry) || entry.length === 0) {
                errors.push(`Index ${i}: entry must be [identity, optionalBoolean]`);
                continue;
            }
            const [id] = entry;
            if (typeof id !== "number" || !Number.isFinite(id)) {
                errors.push(`Index ${i}: identity must be a finite number`);
                continue;
            }
            if (!Number.isSafeInteger(id)) {
                errors.push(`Index ${i}: identity ${id} is not a safe integer`);
            }
            if (seen.has(id)) {
                errors.push(`Index ${i}: duplicate identity ${id}`);
            }
            seen.add(id);
            if (i > 0) {
                const [prevId] = values[i - 1];
                if (!(id > prevId)) {
                    errors.push(`Index ${i}: identity ${id} is not greater than previous ${prevId}`);
                }
            }
        }
        return { ok: errors.length === 0, errors };
    }
    attemptFix(values) {
        const out = values.map(v => [v[0], v[1] === true]);
        const n = out.length;
        const nextFixedId = new Array(n).fill(Infinity);
        let next = Infinity;
        for (let i = n - 1; i >= 0; i--) {
            const [id, fixed] = out[i];
            if (fixed)
                next = id;
            nextFixedId[i] = next;
        }
        for (let i = 0; i < n; i++) {
            const [id, fixed] = out[i];
            const prevId = i === 0 ? -Infinity : out[i - 1][0];
            if (fixed) {
                if (!(id > prevId)) {
                    return {
                        ok: false,
                        error: `Fixed id at index ${i} (${id}) is not greater than previous (${prevId}). Cannot change a fixed id.`,
                        values: out
                    };
                }
                continue;
            }
            let newId = Math.max(id, (Number.isFinite(prevId) ? prevId : -Infinity) + 1);
            if (!(newId < nextFixedId[i])) {
                return {
                    ok: false,
                    error: `Cannot assign a valid id at index ${i} without reaching or exceeding next fixed id ${nextFixedId[i]}.`,
                    values: out
                };
            }
            if (!Number.isSafeInteger(newId)) {
                return {
                    ok: false,
                    error: `Computed id ${newId} at index ${i} is not a safe integer.`,
                    values: out
                };
            }
            out[i][0] = newId;
        }
        const { ok, errors } = this.validateValues(out);
        if (!ok) {
            return { ok: false, error: errors.join("; "), values: out };
        }
        return { ok: true, values: out };
    }
};
exports.IdentityFixService = IdentityFixService;
exports.IdentityFixService = IdentityFixService = __decorate([
    (0, common_1.Injectable)()
], IdentityFixService);


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
var ParseCommandService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ParseCommandService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const bridge_parse_service_1 = __webpack_require__(58);
const session_service_1 = __webpack_require__(29);
const bridge_service_1 = __webpack_require__(68);
const fs_1 = __webpack_require__(11);
const squential_task_1 = __webpack_require__(53);
const event_emitter_1 = __webpack_require__(18);
let ParseCommandService = ParseCommandService_1 = class ParseCommandService {
    handleCommandParseEvents(payload) {
        console.log('command.parser.value event received:', payload);
        this.commands = payload?.data || [];
    }
    constructor(bridgeParseService, sessionService, bridge) {
        this.bridgeParseService = bridgeParseService;
        this.sessionService = sessionService;
        this.bridge = bridge;
        this.logger = new common_1.Logger(ParseCommandService_1.name);
        this.isComplete = 0;
        this.commands = [];
        this.mdl = {
            cmdType: null,
            data: [],
            hexCmd: '',
            startlength: 0,
            endlength: 0,
            searchString: '',
            replaceString: '',
            rStart: [],
            rEnd: [],
            isRefresh: 0
        };
        this.isCmdEnded = false;
        this.cmdLength = 0;
        this.isData = false;
        this.previousCmd = null;
        this.isRefresh = 0;
        this.CMD_TYPES = {
            0x46: { t: 'F', l: 1 },
            0x50: { t: 'P', l: 2 },
            0x4E: { t: 'N', l: 1 },
            0x54: { t: 'T', l: 4 },
            0x44: { t: 'D', l: 0 },
            0x48: { t: 'K', l: 0 },
            0x47: { t: 'G', l: null },
            0x45: { t: 'E', l: 0 },
            0x52: { t: 'R', l: 8 },
        };
        this.taskQueue = new squential_task_1.SequentialTaskQueue();
    }
    splitCommands(incomingBuffer, currentSession, currentJob, sessions) {
        if (this.isComplete > 0)
            return;
        this.taskQueue.addTask(async () => {
            await this.parseCMD(incomingBuffer, currentSession, currentJob, sessions);
        });
    }
    async parseCMD(data, currentSession, currentJob, sessions) {
        try {
            await this.addToLocalFile(data.toString('hex'));
        }
        catch (error) {
        }
        try {
            this.parseCommand(data, currentSession, currentJob, sessions);
        }
        catch (error) {
        }
    }
    async parseCommand(data, currentSession, currentJob, sessions) {
        try {
            data.forEach((element) => {
                if (element === 0x02 && !this.mdl.cmdType && !this.mdl.data.length) {
                    this.setStartCMD(element);
                    this.previousCmd = element;
                    return;
                }
                if (this.mdl.cmdType === 'G') {
                    this.parseGlobalReplace(element, currentSession, currentJob, sessions);
                    return;
                }
                if (this.mdl.cmdType === 'R') {
                    this.refreshCmd(element, currentSession, currentJob, sessions);
                    return;
                }
                if (this.mdl.cmdType === 'E') {
                    this.handleEndRefresh(element, currentSession, currentJob, sessions);
                    return;
                }
                if (!this.mdl.cmdType && this.previousCmd === 0x02) {
                    this.previousCmd = null;
                    const typeSet = this.setCmdType(element);
                    if (typeSet)
                        return;
                }
                if (element === 0x03 && this.cmdLength === this.mdl.data.length) {
                    this.manageEndCmd(element);
                }
                else {
                    this.pushData(element);
                }
                this.commandsControl(currentSession, currentJob, sessions);
            });
            this.commands.map(a => a.data1 = (!a.cmdType ? String.fromCharCode(...a.data) : a.data));
            const logPath = `logs/s_${this.sessionService.currentSessionid}`;
            try {
                await fs_1.promises.mkdir(logPath, { recursive: true });
            }
            catch (error) {
            }
            this.writeToJson(`${logPath}/commands.json`, this.commands);
        }
        catch (error) {
            this.logger.error('Error during parsing:', error);
        }
    }
    parseGlobalReplace(element, currentSession, currentJob, sessions) {
        try {
            this.mdl.hexCmd += this.decimalToHexString(element);
            if (this.mdl.startlength &&
                this.mdl.searchString.length === this.mdl.startlength &&
                this.mdl.endlength &&
                this.mdl.replaceString.length === this.mdl.endlength) {
                this.commands.push({
                    cmdType: 'G',
                    data: [],
                    hexCmd: this.mdl.hexCmd,
                    searchString: this.mdl.searchString,
                    replaceString: this.mdl.replaceString,
                    isRefresh: this.isRefresh,
                });
                this.sendForParsing({
                    cmdType: 'G',
                    data: [],
                    hexCmd: this.mdl.hexCmd,
                    searchString: this.mdl.searchString,
                    replaceString: this.mdl.replaceString,
                    isRefresh: this.isRefresh,
                }, currentSession, currentJob, sessions);
                this.clearMdl();
                this.isCmdEnded = true;
                return;
            }
            if (this.mdl.startlength === 0) {
                this.mdl.startlength = element;
            }
            else if (this.mdl.startlength && !this.mdl.endlength && this.mdl.searchString.length !== this.mdl.startlength) {
                this.mdl.searchString += String.fromCharCode(element);
            }
            else if (this.mdl.startlength && this.mdl.searchString.length === this.mdl.startlength && !this.mdl.endlength) {
                this.mdl.endlength = element;
            }
            else if (this.mdl.startlength && this.mdl.searchString.length === this.mdl.startlength && this.mdl.endlength) {
                this.mdl.replaceString += String.fromCharCode(element);
            }
        }
        catch (error) {
            this.logger.error('Error in global replace parsing:', error);
        }
    }
    refreshCmd(element, currentSession, currentJob, sessions) {
        this.mdl.hexCmd += this.decimalToHexString(element);
        if (this.mdl.rStart.length < 4) {
            this.mdl.rStart.push(...[element]);
        }
        else if (this.mdl.rStart.length === 4 && this.mdl.rEnd.length < 4) {
            this.mdl.rEnd.push(...[element]);
        }
        else if (this.mdl.rStart.length === 4 && this.mdl.rEnd.length === 4) {
            this.isRefresh = 1;
            this.mdl.rStart = [...this.mdl.rStart];
            this.mdl.rEnd = [...this.mdl.rEnd];
            this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);
            this.commands.push({ ...this.mdl });
            this.isCmdEnded = true;
            this.clearMdl();
        }
    }
    handleEndRefresh(element, currentSession, currentJob, sessions) {
        this.mdl.hexCmd += this.decimalToHexString(element);
        this.mdl.rStart = [...this.mdl.rStart];
        this.mdl.rEnd = [...this.mdl.rEnd];
        this.commands.push({ ...this.mdl });
        this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);
        this.isCmdEnded = true;
        this.clearMdl();
    }
    setStartCMD(element) {
        if (this.isData) {
            this.clearMdl();
        }
        this.isData = false;
        this.isCmdEnded = false;
        this.mdl.hexCmd = this.decimalToHexString(element);
    }
    setCmdType(element) {
        let isType = true;
        if (this.CMD_TYPES[element]) {
            this.mdl.cmdType = this.CMD_TYPES[element].t;
            this.cmdLength = this.CMD_TYPES[element].l;
            this.mdl.hexCmd += this.decimalToHexString(element);
            if (this.mdl.cmdType == 'R') {
                this.isRefresh = 1;
                this.mdl.isRefresh = 1;
            }
            else if (this.mdl.cmdType == 'E') {
                this.isRefresh = 0;
            }
            if (this.mdl.cmdType == 'N') {
            }
        }
        else {
            isType = false;
        }
        return isType || ['R', 'E'].includes(this.mdl.cmdType);
    }
    manageEndCmd(element) {
        this.mdl.hexCmd += this.decimalToHexString(element);
        this.isCmdEnded = true;
        this.isData = false;
    }
    pushData(element) {
        if (!this.mdl.cmdType) {
            this.isData = true;
        }
        this.mdl.hexCmd += this.decimalToHexString(element);
        this.mdl.data.push(element);
    }
    commandsControl(currentSession, currentJob, sessions) {
        if (this.isCmdEnded && !this.isData) {
            this.mdl.isRefresh = this.isRefresh;
            this.mdl.rStart = [...this.mdl.rStart];
            this.mdl.rEnd = [...this.mdl.rEnd];
            this.commands.push({ ...this.mdl });
            this.sendForParsing({ ...this.mdl }, currentSession, currentJob, sessions);
            this.mdl.data = [];
            this.mdl.cmdType = null;
            this.mdl.hexCmd = '';
        }
        else if (this.isData) {
            this.mdl.isRefresh = this.isRefresh;
            this.isData = false;
            try {
                if (this.commands[this.commands.length - 1].cmdType) {
                    this.commands.push({
                        cmdType: null,
                        data: [],
                        hexCmd: ''
                    });
                }
                const ForCmdnewObj = {
                    data: [...(this.commands[this.commands.length - 1]["data"]), ...this.mdl.data],
                    hexCmd: this.mdl.hexCmd,
                    isRefresh: this.mdl.isRefresh
                };
                this.commands[this.commands.length - 1] = { ...ForCmdnewObj };
            }
            catch (error) {
            }
            const newObj = {
                data: [...this.mdl.data],
                hexCmd: this.mdl.hexCmd,
                isRefresh: this.mdl.isRefresh
            };
            this.sendForParsing({ ...newObj }, currentSession, currentJob, sessions);
            this.mdl.data = [];
            this.mdl.cmdType = null;
            this.mdl.hexCmd = '';
        }
    }
    decimalToHexString(number) {
        const hexString = number.toString(16).toUpperCase();
        return hexString.length === 1 ? '0' + hexString : hexString;
    }
    clearMdl() {
        this.mdl = {
            cmdType: null,
            data: [],
            hexCmd: '',
            startlength: 0,
            endlength: 0,
            searchString: '',
            replaceString: '',
            rStart: [],
            rEnd: [],
            isRefresh: 0
        };
    }
    writeToJson(path, arrayObject) {
        fs.writeFile(path, JSON.stringify(arrayObject, null, 2), 'utf8', (err) => {
            if (err) {
                this.logger.error('An error occurred while writing JSON Object to File.', err);
            }
            else {
            }
        });
    }
    async addToLocalFile(data) {
        try {
            const log_msg = (data);
            const logPath = `logs/s_${this.sessionService.currentSessionid}`;
            try {
                await fs_1.promises.mkdir(logPath, { recursive: true });
            }
            catch (error) {
            }
            fs.appendFile(`${logPath}/cmds.txt`, log_msg + '\n', (err) => {
                if (err) {
                    console.error('Error appending to file:', err);
                }
            });
        }
        catch (error) {
            console.log('ERROR', error);
        }
    }
    sendForParsing(data, currentSession, currentJob, sessions) {
        const hex = Buffer.from(data["hexCmd"], 'hex');
        this.bridgeParseService.SendToParseData(hex, data, currentSession, currentJob, sessions);
    }
};
exports.ParseCommandService = ParseCommandService;
__decorate([
    (0, event_emitter_1.OnEvent)('command.parser.value'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ParseCommandService.prototype, "handleCommandParseEvents", null);
exports.ParseCommandService = ParseCommandService = ParseCommandService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof bridge_parse_service_1.BridgeParseService !== "undefined" && bridge_parse_service_1.BridgeParseService) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof bridge_service_1.BridgeService !== "undefined" && bridge_service_1.BridgeService) === "function" ? _c : Object])
], ParseCommandService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BridgeService = void 0;
const common_1 = __webpack_require__(3);
const async_1 = __webpack_require__(10);
const fs_1 = __webpack_require__(11);
let BridgeService = class BridgeService {
    constructor() {
        this.formates = [{ key: `0x00`, value: 'FL' },
            { key: 0x01, value: 'QES' },
            { key: 0x02, value: 'ANS' },
            { key: 0x03, value: 'SPKR' },
            { key: 0x04, value: 'QES-CONTINUE' },
            { key: 0x05, value: 'ANS-CONTINUE' },
            { key: 0x06, value: 'SPKR-CONTINUE' },
            { key: 0x07, value: 'PRNTH' },
            { key: 0x08, value: 'CNTRD' },
            { key: 0x09, value: 'RHT-FLS' },
            { key: 0x0A, value: 'BY-LINE' },
            { key: 0x0B, value: 'BY-LINE-CONTINUE' },
            { key: 0x0C, value: 'USR-DEFIND' }];
        this.isPageGotPageNumber = false;
        this.resetLine = (currentJob) => {
            currentJob.crLine = [];
        };
        this.sliceDate = (date) => {
            try {
                return ('0000' + date.toString()).slice(-2);
            }
            catch (error) {
                return date;
            }
        };
        this.onBackSpace = (currentJob) => {
            try {
                let ind = currentJob.lineBuffer.findIndex((a) => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
                if (ind > -1 && currentJob.lineBuffer[ind][1]?.length) {
                    currentJob.lineBuffer[ind][1].pop();
                    return;
                }
                if (currentJob.currentLineNumber == 1 && currentJob.currentPage > 1) {
                    currentJob.currentPage--;
                    currentJob.currentLineNumber = 25;
                }
                else if (currentJob.currentLineNumber > 1) {
                    currentJob.currentLineNumber--;
                }
                else {
                    return;
                }
                ind = currentJob.lineBuffer.findIndex((a) => a[4] === currentJob.currentLineNumber && a[3] === currentJob.currentPage);
                if (ind > -1 && currentJob.lineBuffer[ind][1]?.length) {
                    currentJob.lineBuffer[ind][1].pop();
                }
            }
            catch (error) {
                console.log(error);
            }
        };
        this.convertToFrame = (timestamp) => {
            if (!timestamp)
                return '';
            const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
            return ((hours * 3600 + minutes * 60 + seconds) * 30) + frames;
        };
        this.backupCurrentState = (currentJob) => {
            this.current_refresh++;
            this.isRefresh = true;
            this.isPageGotPageNumber = false;
            currentJob.oldLineData = [currentJob.currentTimestamp, currentJob.currentFormat, currentJob.currentPage, currentJob.currentLineNumber];
            currentJob.relaceLines = [];
        };
        this.restoreCurrentState = (currentJob) => {
            this.isRefresh = false;
            this.isPageGotPageNumber = false;
            try {
                const x = currentJob.oldLineData;
                if (currentJob.oldLineData?.length) {
                    currentJob.currentTimestamp = x[0];
                    currentJob.currentFormat = x[1];
                    currentJob.currentPage = x[2];
                    currentJob.currentLineNumber = x[3];
                }
            }
            catch (error) {
                console.log(error);
            }
            currentJob.relaceLines = [];
        };
        this.emitData = (currentJob, type) => {
        };
        this.cmds = 0;
        this.current_refresh = 0;
        this.isRefresh = false;
        this.queue = async_1.default.queue(async (task, callback) => {
            await task();
            callback();
        }, 1);
        this.queue.drain(() => {
        });
    }
    SendToParseData(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions) {
        this.queue.push(async () => {
            await this.startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions);
        });
    }
    async startProcess(incomingBuffer, CMD_DATA, currentSession, currentJob, sessions) {
        this.cmds++;
        console.log(this.cmds);
        try {
            const buffer = Buffer.from(CMD_DATA["hexCmd"], 'hex');
            const CMDdata = CMD_DATA;
            if (CMDdata.cmdType) {
                await this.handleCommand(CMDdata.cmdType, CMDdata, incomingBuffer, currentJob, currentSession, sessions);
            }
            else {
                for (let i = 0; incomingBuffer.length > i; i++) {
                    await this.handleText(incomingBuffer[i], currentJob);
                }
            }
            try {
                currentJob.lineBuffer = Array.from(currentJob.lineBuffer, item => item === undefined ? [] : item);
            }
            catch (error) {
            }
        }
        catch (error) {
            console.log(error);
        }
        await this.saveData(currentJob);
        return true;
    }
    async handleCommand(command, CMDdata, data, currentJob, currentSession, sessions) {
        try {
            console.log(command);
            switch (command) {
                case 'P':
                    if (data.length >= 2) {
                        currentJob.currentPage = data.readUInt16LE(2);
                        if (this.isRefresh)
                            this.isPageGotPageNumber = true;
                    }
                    break;
                case 'N':
                    if (data.length >= 1) {
                        const receivedLineNumber = data.readUInt8(2);
                        currentJob.currentLineNumber = receivedLineNumber;
                    }
                    break;
                case 'F':
                    if (data.length >= 1) {
                        const formatCode = data.readUInt8(2);
                        const format = this.formates.find(f => parseInt(f.key, 16) === formatCode);
                        if (format) {
                            currentJob.currentFormat = format.value;
                        }
                    }
                    break;
                case 'T':
                    if (data.length >= 4) {
                        const hours = this.sliceDate(data.readUInt8(2));
                        const minutes = this.sliceDate(data.readUInt8(3));
                        const seconds = this.sliceDate(data.readUInt8(4));
                        const frames = this.sliceDate(data.readUInt8(5));
                        currentJob.currentTimestamp = `${hours}:${minutes}:${seconds}:${frames}`;
                    }
                    break;
                case 'G':
                    break;
                case 'R':
                    this.backupCurrentState(currentJob);
                    currentJob.refreshTimeStamp = [`${this.sliceDate(data.readUInt8(2))}:${this.sliceDate(data.readUInt8(3))}:${this.sliceDate(data.readUInt8(4))}:${this.sliceDate(data.readUInt8(5))}`, `${this.sliceDate(data.readUInt8(6))}:${this.sliceDate(data.readUInt8(7))}:${this.sliceDate(data.readUInt8(8))}:${this.sliceDate(data.readUInt8(9))}`];
                    await this.RefreshLog(currentJob, `_${this.current_refresh}`, `BEFOUR-- \n ${currentJob.refreshTimeStamp}`);
                    await this.refreshLines(currentJob, data);
                    break;
                case 'E':
                    await this.checkForReplace(currentJob);
                    await this.refreshLogsLines(currentJob, `_${this.current_refresh}`);
                    await this.RefreshLog(currentJob, `_${this.current_refresh}`, 'AFTER-- ');
                    this.restoreCurrentState(currentJob);
                    break;
                case 'D':
                    this.onBackSpace(currentJob);
                    break;
                default:
            }
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async handleText(byte, currentJob) {
        try {
            if (byte !== 0x08) {
                let ind = currentJob.lineBuffer.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
                if (ind == -1) {
                    currentJob.lineBuffer.push(['', [], 'FL', currentJob.currentPage, currentJob.currentLineNumber, []]);
                    ind = currentJob.lineBuffer?.length - 1;
                }
                let obj = currentJob.lineBuffer[ind];
                if (!obj) {
                    obj = ['', [], 'FL', 0, 0, [], false];
                }
                obj[0] = currentJob.currentTimestamp || '00:00:00:00';
                obj[1] = [...obj[1], byte];
                obj[2] = currentJob.currentFormat || 'FL';
                if (this.isRefresh)
                    obj[5] = [...new Set([...obj[5], this.current_refresh])];
                currentJob.lineBuffer[ind] = obj;
                this.bindRefreshData(currentJob, obj);
            }
            ;
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    bindRefreshData(currentJob, obj) {
        try {
            let ind = currentJob.relaceLines.findIndex(a => a[4] == currentJob.currentLineNumber && a[3] == currentJob.currentPage);
            if (ind == -1) {
                currentJob.relaceLines.push(obj);
            }
            else {
                currentJob.relaceLines[ind] = obj;
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    async refreshLines(currentJob, data) {
        try {
            await this.printRefreshTime(currentJob);
            const start = currentJob.refreshTimeStamp[0];
            const end = currentJob.refreshTimeStamp[1];
            const [startRange, endRange] = [start, end].map((time) => this.convertToFrame(time));
            let isChange = false;
            currentJob.lineBuffer = currentJob.lineBuffer.map((a) => {
                const currentFrame = this.convertToFrame(a[0]);
                if (startRange <= currentFrame && endRange >= currentFrame) {
                    if (!isChange) {
                        isChange = true;
                        currentJob.currentPage = a[3];
                    }
                    return [a[0], [], 'FL', a[3], a[4], [...a[5], this.current_refresh], true];
                }
                return a;
            });
            return true;
        }
        catch (error) {
            console.log(error);
            return false;
        }
    }
    async saveData(currentJob) {
        try {
            currentJob.lineBuffer.sort((a, b) => {
                if (a[3] !== b[3]) {
                    return a[3] - b[3];
                }
                return a[4] - b[4];
            });
            const allDts = currentJob.lineBuffer.map(a => (a && a.length ? ` ${a[5]?.length ? JSON.stringify(a[5]) : ''}  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}` : 'BLANK LINE') + `\n`);
            const log_msg = `\n ${allDts}`;
            await fs_1.promises.writeFile('finaldata.txt', log_msg + '\n length = ' + currentJob.lineBuffer?.length);
            const allDts2 = currentJob.lineBuffer.map(a => (a && a.length ? `page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}` : 'BLANK LINE') + `\n`);
            const log_msg2 = `\n ${allDts2}`;
            await fs_1.promises.writeFile('finaldata_plan.txt', log_msg2 + '\n length = ' + currentJob.lineBuffer?.length);
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async RefreshLog(currentJob, key, val) {
        try {
            currentJob.lineBuffer.sort((a, b) => {
                if (a[3] !== b[3]) {
                    return a[3] - b[3];
                }
                return a[4] - b[4];
            });
            const allDts = currentJob.lineBuffer.map(a => (a && a.length ? `  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ${a[5]?.length ? JSON.stringify(a[5]) : ''} ` : 'BLANK LINE') + `\n`);
            const log_msg = `${val}  \n ${allDts}`;
            await fs_1.promises.appendFile(`logs/refresh/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.lineBuffer?.length + '\n\n\n');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    async refreshLogsLines(currentJob, key) {
        try {
            currentJob.relaceLines.sort((a, b) => {
                if (a[3] !== b[3]) {
                    return a[3] - b[3];
                }
                return a[4] - b[4];
            });
            const allDts = currentJob.relaceLines.map(a => (a && a.length ? `  page = ${a[3]}  : line = ${a[4]} : ${a[0]} :  ${a[1] ? String.fromCharCode(...a[1]) : '....'}  ${a[5]?.length ? JSON.stringify(a[5]) : ''}  ` : 'BLANK LINE') + `\n`);
            const log_msg = ` \n\n\n ${this.isPageGotPageNumber ? 'Page number found in refresh ' : 'Page Number not found in refresh'} ${currentJob.currentPage} \n\n\n LINES ---- \n ${allDts}`;
            await fs_1.promises.appendFile(`logs/refresh/refreshlog_${key}.txt`, log_msg + '\n length = ' + currentJob.relaceLines?.length + '\n\n\n');
        }
        catch (error) {
            console.log(error);
        }
        return true;
    }
    removeTimestampsInRange(timestamps, range) {
        const [startRange, endRange] = range.map(this.convertToFrame);
        return timestamps.filter(([timestamp]) => {
            const currentFrame = this.convertToFrame(timestamp);
            return !(currentFrame >= startRange && endRange >= currentFrame);
        });
    }
    async checkForReplace(currentJob) {
        if (this.current_refresh == 4) {
            debugger;
        }
        const start = currentJob.refreshTimeStamp[0];
        const end = currentJob.refreshTimeStamp[1];
        const newData = this.removeTimestampsInRange(currentJob.lineBuffer, [start, end]);
        await this.printFeedInTxt(`total = ${currentJob.lineBuffer?.length}, new = ${currentJob.relaceLines?.length} , replaces = ${currentJob.lineBuffer?.length - newData?.length} , isMore=${currentJob.relaceLines?.length > (currentJob.lineBuffer?.length - newData?.length)}`);
        return true;
    }
    async printFeedInTxt(log) {
        try {
            const log_msg = `\n\r\n\r\n\r\n\r\n\r\n\r\nRefresh Count  ${this.current_refresh}\n ${log}`;
            await fs_1.promises.appendFile('feed_refresh.txt', log_msg + '\n');
        }
        catch (error) {
            console.log('ERROR', error);
        }
        return true;
    }
    async printRefreshTime(currentJob) {
        try {
            const start = currentJob.refreshTimeStamp[0];
            const end = currentJob.refreshTimeStamp[1];
            const log_msg = `["${start}","${end}"],`;
            await fs_1.promises.appendFile('feed_refresh_times.txt', log_msg + '\n');
        }
        catch (error) {
            console.log('ERROR', error);
        }
        return true;
    }
};
exports.BridgeService = BridgeService;
exports.BridgeService = BridgeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], BridgeService);


/***/ }),
/* 69 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 70 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 71 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeedStartService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(22);
const fs = __webpack_require__(11);
const session_service_1 = __webpack_require__(29);
const parse_command_service_1 = __webpack_require__(67);
const tcp_service_1 = __webpack_require__(50);
let FeedStartService = class FeedStartService {
    constructor(config, tcp, session, CommandParserService) {
        this.config = config;
        this.tcp = tcp;
        this.session = session;
        this.CommandParserService = CommandParserService;
        this.totalChunks = 0;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async startFeed(body) {
        try {
            const { file, batch } = body;
            const chunks = await this.readLawFile(file, batch);
            let sesid = this.session.getCurrentSession();
            this.session.protocol = this.session.getCurrentSessionProtocol(sesid);
            this.session.CurrentJob = this.session.reInitVariables();
            this.session.checkForSessionChange(sesid);
            if (chunks.length) {
                console.log('Emiting');
                for (let x of chunks) {
                    await this.delay(body.nDelay);
                    const chunk = Buffer.from(x, 'hex');
                    this.CommandParserService.splitCommands(chunk, this.session.currentSessionid, this.session.CurrentJob, this.tcp.sessions);
                }
            }
        }
        catch (error) {
        }
        return { msg: 1 };
    }
    async readLawFile(file, batch) {
        return new Promise((resolve) => {
            const array = [];
            try {
                const lawFilePath = `${this.config.get('ASSETS')}law/${file}`;
                fs.readFile(lawFilePath, async (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        return [];
                    }
                    this.totalChunks = data.length;
                    console.log('data length:', data.length);
                    let currentGroup = '';
                    for (let i = 0; i < data.length; i++) {
                        const byte = data[i].toString(16).padStart(2, '0');
                        currentGroup += byte;
                        if (currentGroup.length === batch) {
                            array.push(currentGroup);
                            currentGroup = '';
                        }
                    }
                    if (currentGroup.length > 0) {
                        array.push(currentGroup);
                    }
                    console.log('Bytes', array.length);
                    resolve(array);
                });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
};
exports.FeedStartService = FeedStartService;
exports.FeedStartService = FeedStartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof tcp_service_1.TcpService !== "undefined" && tcp_service_1.TcpService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof parse_command_service_1.ParseCommandService !== "undefined" && parse_command_service_1.ParseCommandService) === "function" ? _d : Object])
], FeedStartService);


/***/ }),
/* 73 */
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
exports.CliService = void 0;
const common_1 = __webpack_require__(3);
const bridge_parse_service_1 = __webpack_require__(58);
const session_service_1 = __webpack_require__(29);
const feed_start_service_1 = __webpack_require__(72);
let CliService = class CliService {
    constructor(bridgeParser, session, feed) {
        this.bridgeParser = bridgeParser;
        this.session = session;
        this.feed = feed;
    }
    onModuleInit() {
    }
    prompt() {
        this.rl.prompt();
        this.rl.on('line', (line) => {
            const input = line.trim();
            try {
                const x = input.toUpperCase();
                if (x == 'S') {
                    console.log(`session : ${this.session.currentSessionid}, IsHaveRefrehs:${this.session.currentSessionHaveRefresh}`);
                }
                else if (x == 'L') {
                    console.log(`Current Task ${this.bridgeParser.cmds} / ${this.feed.totalChunks ? this.feed.totalChunks : 'Unknow'}`);
                }
                else if (x == 'C') {
                    console.clear();
                }
            }
            catch (error) {
                console.log(error);
            }
            this.rl.prompt();
        });
        this.rl.on('close', () => {
            console.log('CLI closed.');
            process.exit(0);
        });
    }
    async getData(body) {
        const obj = { session: this.session.currentSessionid, IsHaveRefrehs: this.session.currentSessionHaveRefresh, Current_task: this.bridgeParser.cmds, total: (this.feed.totalChunks ? this.feed.totalChunks : 'Unknow') };
        return obj;
    }
};
exports.CliService = CliService;
exports.CliService = CliService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof bridge_parse_service_1.BridgeParseService !== "undefined" && bridge_parse_service_1.BridgeParseService) === "function" ? _a : Object, typeof (_b = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _b : Object, typeof (_c = typeof feed_start_service_1.FeedStartService !== "undefined" && feed_start_service_1.FeedStartService) === "function" ? _c : Object])
], CliService);


/***/ }),
/* 74 */
/***/ ((module) => {

module.exports = require("@nestjs/serve-static");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TcpController = void 0;
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(12);
const tcp_service_1 = __webpack_require__(50);
const session_service_1 = __webpack_require__(29);
const log_service_1 = __webpack_require__(39);
const config_1 = __webpack_require__(22);
const transfer_health_service_1 = __webpack_require__(76);
let TcpController = class TcpController {
    constructor(utility, tcpService, sessionService, log, config, transferHealthService) {
        this.utility = utility;
        this.tcpService = tcpService;
        this.sessionService = sessionService;
        this.log = log;
        this.config = config;
        this.transferHealthService = transferHealthService;
        this.localFileName = 'localserver.json';
        this.logApplication = 'realtime';
    }
    async getList(query) {
        const filePath = this.localFileName;
        return await this.utility.readJsonFromFile(filePath);
    }
    async sessionBuilder(body) {
        let rs = await this.utility.saveJsonToFile(body, this.localFileName);
        this.log.info(`Setup new TCP connection ${JSON.stringify(body)}`, `${this.logApplication}/tcp`);
        this.tcpService.reconnectServer();
        return rs;
    }
    async setUser(body) {
        let data = await this.utility.readJsonFromFile('userid.json');
        if (data) {
            return data;
        }
        return { msg: -1 };
    }
    async reinitsession(body) {
        this.sessionService.reInitSessions(2);
        return { msg: 1 };
    }
    async getUrl(query) {
        const url = this.config.get('LIVE_IP') || '45.76.154.127';
        const port = this.config.get('LIVE_PORT') || '2086';
        const pdfloadurl = this.config.get('PDF_LOAD_PATH') || 'https://etabella.sgp1.cdn.digitaloceanspaces.com/';
        const version = this.config.get('VRSN') || '1.0.0';
        return { url, port, pdfloadurl, version, transferServiceStatus: this.transferHealthService.transferServiceStatus };
    }
};
exports.TcpController = TcpController;
__decorate([
    (0, common_1.Get)('getserver'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TcpController.prototype, "getList", null);
__decorate([
    (0, common_1.Post)('setserver'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], TcpController.prototype, "sessionBuilder", null);
__decorate([
    (0, common_1.Post)('setuserid'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TcpController.prototype, "setUser", null);
__decorate([
    (0, common_1.Post)('reinitsession'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], TcpController.prototype, "reinitsession", null);
__decorate([
    (0, common_1.Get)('url'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TcpController.prototype, "getUrl", null);
exports.TcpController = TcpController = __decorate([
    (0, common_1.Controller)('tcp'),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof tcp_service_1.TcpService !== "undefined" && tcp_service_1.TcpService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _e : Object, typeof (_f = typeof transfer_health_service_1.TransferHealthService !== "undefined" && transfer_health_service_1.TransferHealthService) === "function" ? _f : Object])
], TcpController);


/***/ }),
/* 76 */
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
var TransferHealthService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransferHealthService = void 0;
const common_1 = __webpack_require__(3);
const pm2 = __webpack_require__(77);
const schedule_1 = __webpack_require__(78);
let TransferHealthService = TransferHealthService_1 = class TransferHealthService {
    constructor() {
        this.transferServiceStatus = 'offline';
        this.logger = new common_1.Logger(TransferHealthService_1.name);
    }
    setServer(server) {
        this.server = server;
    }
    onModuleInit() {
        pm2.connect(err => {
            if (err) {
                this.logger.error(`PM2 connect error: ${err.message}`);
            }
            else {
                this.logger.log('Connected to PM2');
            }
        });
    }
    async handleCron() {
        const ts = new Date().toISOString();
        let line;
        try {
            const list = await new Promise((res, rej) => pm2.list((err, procs) => (err ? rej(err) : res(procs))));
            const proc = list.find(p => p.name === 'search-api');
            if (proc && proc.pm2_env.status === 'online') {
                if (this.transferServiceStatus != 'online') {
                    this.transferServiceStatus = 'online';
                    if (this.server) {
                        this.server.emit("transfer-service-status", { status: this.transferServiceStatus });
                    }
                }
            }
            else {
                if (this.transferServiceStatus != 'offline') {
                    this.transferServiceStatus = 'offline';
                    if (this.server) {
                        this.server.emit("transfer-service-status", { status: this.transferServiceStatus });
                    }
                }
            }
        }
        catch (err) {
            line = `${ts} — Error retrieving PM2 list: ${err.message}`;
        }
        try {
        }
        catch (writeErr) {
            this.logger.error(`Failed writing to log file: ${writeErr.message}`);
        }
    }
};
exports.TransferHealthService = TransferHealthService;
__decorate([
    (0, schedule_1.Cron)('*/3 * * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransferHealthService.prototype, "handleCron", null);
exports.TransferHealthService = TransferHealthService = TransferHealthService_1 = __decorate([
    (0, common_1.Injectable)()
], TransferHealthService);


/***/ }),
/* 77 */
/***/ ((module) => {

module.exports = require("pm2");

/***/ }),
/* 78 */
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsGateway = void 0;
const websockets_1 = __webpack_require__(80);
const socket_io_1 = __webpack_require__(28);
const tcp_service_1 = __webpack_require__(50);
const socket_service_1 = __webpack_require__(54);
const stream_data_service_1 = __webpack_require__(56);
const session_service_1 = __webpack_require__(29);
const config_1 = __webpack_require__(22);
const bridge_parse_service_1 = __webpack_require__(58);
const issue_service_1 = __webpack_require__(34);
const verify_tabs_service_1 = __webpack_require__(44);
const parse_data_service_1 = __webpack_require__(52);
const transfer_health_service_1 = __webpack_require__(76);
let EventsGateway = class EventsGateway {
    constructor(config, tcpService, bridgeParseService, issue, socketService, sessionService, streamDataService, verifytab, parseCaseViewData, trasnferHealthService) {
        this.config = config;
        this.tcpService = tcpService;
        this.bridgeParseService = bridgeParseService;
        this.issue = issue;
        this.socketService = socketService;
        this.sessionService = sessionService;
        this.streamDataService = streamDataService;
        this.verifytab = verifytab;
        this.parseCaseViewData = parseCaseViewData;
        this.trasnferHealthService = trasnferHealthService;
    }
    afterInit(server) {
        this.tcpService.setServer(server);
        this.bridgeParseService.setServer(server);
        this.sessionService.setServer(server);
        this.trasnferHealthService.setServer(server);
        this.parseCaseViewData.setServer(server);
    }
    handleConnection(client, ...args) {
        console.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
        try {
            if (client?.userroom && client?.userroom?.nSesid) {
                this.issue.joiningLog({ nSesid: client?.userroom?.nSesid, nUserid: (client?.userroom?.nUserid), cStatus: 'L', cSource: 'O' });
            }
        }
        catch (error) {
        }
    }
    handleMessage(data) {
        this.server.emit('message', data);
    }
    handleSocketReinilize(data) {
        this.socketService.fetchAllServerDetail(data?.nCaseid);
    }
    handleLiveMessagea(data) {
        this.socketService.sendConnectToServer();
    }
    async fetchData(client, data) {
        debugger;
        try {
            const res = await this.issue.etRealtimeGetIssueAnnotationHighlight({ nSessionid: data.nSesid, nUserid: data.nUserid, nCaseid: data.nCaseid, cTranscript: 'N' });
            try {
                if (res?.ref1?.length) {
                    res?.ref1.map(a => a.cordinates = JSON.parse(a.cordinates));
                }
                if (res?.ref2?.length) {
                    res?.ref2.map(a => a.cordinates = JSON.parse(a.cordinates));
                }
            }
            catch (error) {
            }
            if (data.cProtocol == 'B' && this.sessionService.currentSessionid == data.nSesid && this.sessionService.CurrentJob?.lineBuffer?.length) {
                this.bridgeParseService.fetchPreviousData(client.id, data, res?.ref1, res?.ref2);
            }
            else {
                this.streamDataService.streamData('localdata', client.id, data, response => {
                }, res?.ref1, res?.ref2);
            }
            try {
            }
            catch (error) {
            }
        }
        catch (error) {
        }
    }
    refreshData(client, data) {
        console.log('Message from client on refresh-data:', data);
        this.sessionService.loadActiveSessionDetail(data.nCaseid);
    }
    refreshTcpConnectionStatus(client, data) {
        this.tcpService.emitConnectionStatus(this.tcpService.current_status);
    }
    async handleJoinRoom(data, client) {
        console.log('Joining Room:', data);
        const nUserid = client.handshake.query.nUserid;
        const rooms = Array.from(client.rooms);
        try {
            if (data.room.includes('S')) {
                const nSesid = data?.nSesid;
                if (nSesid) {
                    client["userroom"] = { nSesid, nUserid: (data.nUserid) };
                    this.issue.joiningLog({ nSesid: nSesid, nUserid: (data.nUserid), cStatus: 'J', cSource: 'O' });
                }
            }
        }
        catch (error) {
        }
        if (!rooms.includes(data.room)) {
            client.join(data.room);
            console.log('ROOM Join', data.room);
        }
        else {
            console.log('User already in the room', data.room);
        }
    }
    async handleLeaveRoom(room, client) {
        const nUserid = client.handshake.query.nUserid;
        try {
            if (room.room.includes('S')) {
                const nSesid = room?.nSesid;
                if (nSesid) {
                    this.issue.joiningLog({ nSesid: nSesid, nUserid: (room.nUserid), cStatus: 'L', cSource: 'O' });
                }
            }
        }
        catch (error) {
        }
        client.leave(room);
        console.log('ROOM Leave', room);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_l = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _l : Object)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('reinilize-sockets'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleSocketReinilize", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get-live-servers'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleLiveMessagea", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('fetch-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _m : Object, Object]),
    __metadata("design:returntype", Promise)
], EventsGateway.prototype, "fetchData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('refresh-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _o : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "refreshData", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('refresh-status-tcp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _p : Object, Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "refreshTcpConnectionStatus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_q = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_s = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _s : Object]),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], EventsGateway.prototype, "handleLeaveRoom", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        path: '/realtimelocalsocket/',
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof tcp_service_1.TcpService !== "undefined" && tcp_service_1.TcpService) === "function" ? _b : Object, typeof (_c = typeof bridge_parse_service_1.BridgeParseService !== "undefined" && bridge_parse_service_1.BridgeParseService) === "function" ? _c : Object, typeof (_d = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _d : Object, typeof (_e = typeof socket_service_1.SocketService !== "undefined" && socket_service_1.SocketService) === "function" ? _e : Object, typeof (_f = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _f : Object, typeof (_g = typeof stream_data_service_1.StreamDataService !== "undefined" && stream_data_service_1.StreamDataService) === "function" ? _g : Object, typeof (_h = typeof verify_tabs_service_1.VerifyTabsService !== "undefined" && verify_tabs_service_1.VerifyTabsService) === "function" ? _h : Object, typeof (_j = typeof parse_data_service_1.ParseDataService !== "undefined" && parse_data_service_1.ParseDataService) === "function" ? _j : Object, typeof (_k = typeof transfer_health_service_1.TransferHealthService !== "undefined" && transfer_health_service_1.TransferHealthService) === "function" ? _k : Object])
], EventsGateway);


/***/ }),
/* 80 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),
/* 81 */
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
const websockets_1 = __webpack_require__(80);
const socket_io_1 = __webpack_require__(28);
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
/* 82 */
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
__exportStar(__webpack_require__(83), exports);
__exportStar(__webpack_require__(84), exports);


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
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(84);
const config_1 = __webpack_require__(22);
const scheduler_service_1 = __webpack_require__(32);
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
/* 84 */
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
/* 85 */
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
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SessionController = void 0;
const common_1 = __webpack_require__(3);
const sessionbuilder_service_1 = __webpack_require__(6);
const session_interface_1 = __webpack_require__(87);
const swagger_1 = __webpack_require__(71);
const moment = __webpack_require__(31);
const downloadfile_service_1 = __webpack_require__(89);
const session_service_1 = __webpack_require__(29);
const sync_service_1 = __webpack_require__(45);
const email_service_1 = __webpack_require__(91);
const common_2 = __webpack_require__(108);
const socket_service_1 = __webpack_require__(54);
let SessionController = class SessionController {
    constructor(sb, dwn, session, syncService, emailService, socketService) {
        this.sb = sb;
        this.dwn = dwn;
        this.session = session;
        this.syncService = syncService;
        this.emailService = emailService;
        this.socketService = socketService;
    }
    async gettimezone() {
        const timezone = moment.tz.guess();
        return { msg: 1, timezone };
    }
    async getlivesessionbycaseid(query) {
        return await this.sb.getlivesessionbycaseid(query);
    }
    async sessionBuilder(body) {
        const res = await this.sb.sessionCreation(body);
        return res;
    }
    async endSession(body) {
        const res = await this.sb.sessionEnd(body);
        return res;
    }
    async sessionDataV2(body) {
        const res = await this.sb.getSessionById(body);
        return res;
    }
    async serverBuilder(body) {
        const res = await this.sb.serverBuilder(body);
        return res;
    }
    async sessionList(body) {
        const res = await this.sb.sessionList(body);
        return res;
    }
    async sessionServers(body) {
        const res = await this.sb.sessionServers(body);
        return res;
    }
    async getActiveSession(body) {
        const res = await this.socketService.getConnectedServers();
        return res;
    }
    async sessionAssign(body) {
        const res = await this.sb.sessionAssign(body);
        return res;
    }
    async deleteSession(body) {
        const res = await this.sb.deleteSession(body);
        return res;
    }
    async syncUserData(body) {
        const res = await this.sb.syncUserData();
        return res;
    }
    async getSessionByCaseId(query) {
        return await this.sb.getSessionByCaseId(query);
    }
    async sysncTranscript(body) {
        try {
            const result = await this.dwn.DownloadFileToLocal(body);
            console.log('Download result', result);
            await this.sb.updateTrascriptStatus(body, result.msg);
            return { message: result };
        }
        catch (error) {
            return { error: error.message };
        }
    }
    async getRealtimeSessionData(query) {
        return await this.session.getRealtimeSessionData(query);
    }
    async getFiledata(query) {
        return await this.session.getFiledata(query);
    }
    async getDocinfo(query) {
        return await this.session.getDocinfo(query);
    }
    async getemailparse(query) {
        return await this.emailService.getemailparse(query);
    }
    async getrefreshtype(query) {
        return await this.sb.getRefReshType();
    }
    async setRefreshtype(body) {
        return this.sb.setRefreshtype(body);
    }
    async settimezone(body) {
        return this.sb.settimezone(body);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Get)('timezone'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], SessionController.prototype, "gettimezone", null);
__decorate([
    (0, common_1.Get)('getlivesessionbycaseid'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof session_interface_1.SessionByCaseIdReq !== "undefined" && session_interface_1.SessionByCaseIdReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], SessionController.prototype, "getlivesessionbycaseid", null);
__decorate([
    (0, common_1.Post)('session/sessionbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof session_interface_1.SessionBuilderReq !== "undefined" && session_interface_1.SessionBuilderReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], SessionController.prototype, "sessionBuilder", null);
__decorate([
    (0, common_1.Post)('session/sessionend'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof session_interface_1.sessionEnd !== "undefined" && session_interface_1.sessionEnd) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], SessionController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('session/sessiondatav2'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof session_interface_1.SessionDataV2Req !== "undefined" && session_interface_1.SessionDataV2Req) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], SessionController.prototype, "sessionDataV2", null);
__decorate([
    (0, common_1.Post)('session/serverbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof session_interface_1.ServerBuilderReq !== "undefined" && session_interface_1.ServerBuilderReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], SessionController.prototype, "serverBuilder", null);
__decorate([
    (0, common_1.Get)('session/list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], SessionController.prototype, "sessionList", null);
__decorate([
    (0, common_1.Get)('session/servers'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], SessionController.prototype, "sessionServers", null);
__decorate([
    (0, common_1.Get)('session/servers/connected'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_v = typeof Promise !== "undefined" && Promise) === "function" ? _v : Object)
], SessionController.prototype, "getActiveSession", null);
__decorate([
    (0, common_1.Post)('session/assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_w = typeof session_interface_1.assignMentReq !== "undefined" && session_interface_1.assignMentReq) === "function" ? _w : Object]),
    __metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], SessionController.prototype, "sessionAssign", null);
__decorate([
    (0, common_1.Post)('session/sessiondelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_y = typeof session_interface_1.sessionDelete !== "undefined" && session_interface_1.sessionDelete) === "function" ? _y : Object]),
    __metadata("design:returntype", typeof (_z = typeof Promise !== "undefined" && Promise) === "function" ? _z : Object)
], SessionController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Post)('syncuserdata'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], SessionController.prototype, "syncUserData", null);
__decorate([
    (0, common_1.Get)('session/getSessionsByCaseId'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof session_interface_1.SessionByCaseIdReq !== "undefined" && session_interface_1.SessionByCaseIdReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], SessionController.prototype, "getSessionByCaseId", null);
__decorate([
    (0, common_1.Post)('session/transcriptsync'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], SessionController.prototype, "sysncTranscript", null);
__decorate([
    (0, common_1.Get)('session/realtimedatabysesid'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_4 = typeof session_interface_1.userSesionData !== "undefined" && session_interface_1.userSesionData) === "function" ? _4 : Object]),
    __metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], SessionController.prototype, "getRealtimeSessionData", null);
__decorate([
    (0, common_1.Get)('session/filedata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_6 = typeof session_interface_1.filedataReq !== "undefined" && session_interface_1.filedataReq) === "function" ? _6 : Object]),
    __metadata("design:returntype", typeof (_7 = typeof Promise !== "undefined" && Promise) === "function" ? _7 : Object)
], SessionController.prototype, "getFiledata", null);
__decorate([
    (0, common_1.Get)('session/getDocinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_8 = typeof session_interface_1.DocinfoReq !== "undefined" && session_interface_1.DocinfoReq) === "function" ? _8 : Object]),
    __metadata("design:returntype", typeof (_9 = typeof Promise !== "undefined" && Promise) === "function" ? _9 : Object)
], SessionController.prototype, "getDocinfo", null);
__decorate([
    (0, common_1.Get)('session/getemailparse'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_10 = typeof common_2.EmailparseReq !== "undefined" && common_2.EmailparseReq) === "function" ? _10 : Object]),
    __metadata("design:returntype", typeof (_11 = typeof Promise !== "undefined" && Promise) === "function" ? _11 : Object)
], SessionController.prototype, "getemailparse", null);
__decorate([
    (0, common_1.Get)('session/getrefreshtype'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], SessionController.prototype, "getrefreshtype", null);
__decorate([
    (0, common_1.Post)('session/setrefreshtype'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_13 = typeof Promise !== "undefined" && Promise) === "function" ? _13 : Object)
], SessionController.prototype, "setRefreshtype", null);
__decorate([
    (0, common_1.Post)('session/settimezone'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_14 = typeof Promise !== "undefined" && Promise) === "function" ? _14 : Object)
], SessionController.prototype, "settimezone", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('session'),
    (0, common_1.Controller)(''),
    __metadata("design:paramtypes", [typeof (_a = typeof sessionbuilder_service_1.SessionbuilderService !== "undefined" && sessionbuilder_service_1.SessionbuilderService) === "function" ? _a : Object, typeof (_b = typeof downloadfile_service_1.DownloadfileService !== "undefined" && downloadfile_service_1.DownloadfileService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof sync_service_1.SyncService !== "undefined" && sync_service_1.SyncService) === "function" ? _d : Object, typeof (_e = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _e : Object, typeof (_f = typeof socket_service_1.SocketService !== "undefined" && socket_service_1.SocketService) === "function" ? _f : Object])
], SessionController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DocinfoReq = exports.filedataRes = exports.filedataReq = exports.userSesionData = exports.SessionByCaseIdReq = exports.SessionDataV2Req = exports.assignMentReq = exports.ServerBuilderReq = exports.SessionBuilderReq = exports.sessionEnd = exports.sessionDelete = exports.login = exports.logSessionReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(88);
const swagger_1 = __webpack_require__(71);
const class_transformer_1 = __webpack_require__(70);
const class_validator_1 = __webpack_require__(69);
class logSessionReq {
}
exports.logSessionReq = logSessionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'unicid', description: 'Session', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], logSessionReq.prototype, "cSession", void 0);
class login {
}
exports.login = login;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cEmail', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], login.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'your password', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], login.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cEmail', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], login.prototype, "cRTKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cUnicuserid', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], login.prototype, "cUnicuserid", void 0);
class sessionDelete {
}
exports.sessionDelete = sessionDelete;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sessionDelete.prototype, "nSesid", void 0);
class sessionEnd {
}
exports.sessionEnd = sessionEnd;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sessionEnd.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Session id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sessionEnd.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'Delete', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], sessionEnd.prototype, "permission", void 0);
class SessionBuilderReq {
}
exports.SessionBuilderReq = SessionBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Session id', required: true }),
    (0, class_validator_1.IsOptional)(),
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
    __metadata("design:type", Number)
], SessionBuilderReq.prototype, "nDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'No of lines', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nLines must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], SessionBuilderReq.prototype, "nLines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page no', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nPageno must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
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
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cProtocol', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "cProtocol", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'bRefresh', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => (value ? true : false), { toClassOnly: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Object)
], SessionBuilderReq.prototype, "bRefresh", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionBuilderReq.prototype, "nUserid", void 0);
class ServerBuilderReq {
}
exports.ServerBuilderReq = ServerBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nRTSid', required: true }),
    (0, class_validator_1.IsOptional)(),
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
    __metadata("design:type", Number)
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
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ServerBuilderReq.prototype, "nUserid", void 0);
class assignMentReq {
}
exports.assignMentReq = assignMentReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignMentReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nRTSid', required: true }),
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
class SessionDataV2Req {
}
exports.SessionDataV2Req = SessionDataV2Req;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nSesid', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionDataV2Req.prototype, "nUserid", void 0);
class SessionByCaseIdReq {
}
exports.SessionByCaseIdReq = SessionByCaseIdReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionByCaseIdReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nUserid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SessionByCaseIdReq.prototype, "nUserid", void 0);
class userSesionData {
}
exports.userSesionData = userSesionData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nSesid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nUserid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userSesionData.prototype, "nCaseid", void 0);
class filedataReq {
}
exports.filedataReq = filedataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocinfoReq.prototype, "nBundledetailid", void 0);


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(70);
const class_validator_1 = __webpack_require__(69);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadfileService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
const config_1 = __webpack_require__(22);
const http_1 = __webpack_require__(90);
let DownloadfileService = class DownloadfileService {
    constructor(config) {
        this.config = config;
        this.livePath = this.config.get('LIVE_SERVER');
    }
    async DownloadFileToLocal(body) {
        console.log('DownloadFileToLocal', body);
        const filename = `s_${body.nSesid}.json`;
        const downloadsDir = path.join('assets', 'transcripts');
        const localFilePath = path.join(downloadsDir, filename);
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        const url = `${this.livePath}/session/synctranscriptfile?query[nSesid]=${body.nSesid}&query[nCaseid]=${body.nCaseid}`;
        console.log('URL:', url);
        return new Promise((resolve, reject) => {
            (0, http_1.get)(url, (res) => {
                const statusCode = res.statusCode;
                if (statusCode !== 200) {
                    reject({ msg: -1 });
                    res.resume();
                    return;
                }
                const fileStream = fs.createWriteStream(localFilePath);
                res.pipe(fileStream);
                fileStream.on('finish', () => {
                    fileStream.close();
                    resolve({ msg: 1 });
                });
                fileStream.on('error', (err) => {
                    fs.unlink(localFilePath, () => reject(err));
                });
            }).on('error', (err) => {
                console.error('Error:', err.message);
                reject({ msg: -1 });
            });
        });
    }
};
exports.DownloadfileService = DownloadfileService;
exports.DownloadfileService = DownloadfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], DownloadfileService);


/***/ }),
/* 90 */
/***/ ((module) => {

module.exports = require("http");

/***/ }),
/* 91 */
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
const db_service_1 = __webpack_require__(36);
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const MsgReader_js_1 = __webpack_require__(92);
const decompressrtf_1 = __webpack_require__(104);
const iconvLite = __webpack_require__(96);
const rtf_stream_parser_1 = __webpack_require__(105);
const AWS = __webpack_require__(106);
const config_1 = __webpack_require__(22);
const cheerio = __webpack_require__(107);
const path = __webpack_require__(14);
let EmailService = class EmailService {
    constructor(db, config) {
        this.db = db;
        this.config = config;
        this.spacesEndpoint = new AWS.Endpoint(this.config.get('DO_SPACES_ENDPOINT'));
        this.s3 = new AWS.S3({
            endpoint: this.spacesEndpoint,
            accessKeyId: this.config.get('DO_SPACES_KEY'),
            secretAccessKey: this.config.get('DO_SPACES_SECRET'),
        });
        this.saveDir = this.config.get('ATTACHMENT');
        this.domainPath = this.config.get('ATTACHMENT_URL');
    }
    async downloadFileFromS3(spacePath) {
        const params = {
            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
            Key: spacePath
        };
        try {
            const data = await this.s3.getObject(params).promise();
            return data.Body;
        }
        catch (error) {
            console.error('Error downloading file from S3:', error.message);
            throw new Error(`Error downloading file from S3: ${error.message}`);
        }
    }
    async readFileAsArrayBuffer(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
            });
        });
    }
    async getemailparse(body) {
        debugger;
        const isLive = this.config.get('PDF_LOAD_PATH')?.includes('https://');
        let filePath = body.cPath;
        let nBid = body?.nId | 0;
        try {
            let fileData;
            if (isLive) {
                fileData = await this.downloadFileFromS3(filePath);
            }
            else {
                fileData = await this.readFileAsArrayBuffer(`${this.config.get('SAVE_ATTECH')}/${body.cPath}`);
            }
            const reader = new MsgReader_js_1.default(fileData);
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
                if (isLive) {
                    attechments = await this.saveAttachment(msgData, reader, dirpath);
                }
                else {
                    attechments = await this.saveAttachmentLocal(msgData, reader, `${ true ? this.config.get('SAVE_ATTECH') + '/' : 0}${dirpath}`);
                }
            }
            catch (error) {
                console.log(`Error saving attachments: ${error}`);
            }
            resultText = this.replaceHtmlImg(resultText, attechments, `${!isLive ? 'http://localhost:5000/' : this.domainPath}${dirpath}`);
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
    saveAttachment(msgData, reader, dirpath) {
        let attechments = [];
        try {
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = reader.getAttachment(attachment);
                attechments.push({ cFilename: attachment.fileName, cPath: attachment.fileName, dataType: attachment.dataType, data: attachment || null, });
                if (attachment_file.content) {
                    let s3Key = `${dirpath}/${attachment.fileName}`;
                    try {
                        await this.s3.putObject({
                            Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                            Key: s3Key,
                            Body: attachment_file.content,
                            ContentType: attachment.mimeType || 'application/octet-stream',
                            ACL: 'public-read'
                        }).promise();
                        console.log(`Attachment uploaded to S3: ${s3Key}`);
                    }
                    catch (uploadError) {
                        console.error(`Failed to upload attachment to S3: ${s3Key}`, uploadError);
                    }
                }
                else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            });
        }
        catch (error) {
        }
        return attechments;
    }
    saveAttachmentLocal(msgData, reader, dirpath) {
        let attachments = [];
        try {
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = reader.getAttachment(attachment);
                attachments.push({
                    cFilename: attachment.fileName,
                    cPath: attachment.fileName,
                    dataType: attachment.dataType,
                    data: attachment || null,
                });
                if (attachment_file.content) {
                    const filePath = path.join(dirpath, attachment.fileName);
                    try {
                        if (!fs.existsSync(dirpath)) {
                            fs.mkdirSync(dirpath, { recursive: true });
                        }
                        fs.writeFileSync(filePath, attachment_file.content);
                        console.log(`Attachment saved locally: ${filePath}`);
                    }
                    catch (writeError) {
                        console.error(`Failed to save attachment locally: ${filePath}`, writeError);
                    }
                }
                else {
                    console.log(`Attachment content is missing for: ${attachment.fileName}`);
                }
            });
        }
        catch (error) {
            console.error('Error while saving attachments:', error);
        }
        return Promise.resolve(attachments);
    }
    async downloadAttachment(body, res) {
        let filePath = body.cPath;
        let attachmentId = body.nId;
        try {
            const fileBuffer = await this.downloadFileFromS3(filePath);
            const msgReader = new MsgReader_js_1.default(fileBuffer);
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
/* 92 */
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
var const_1 = __importDefault(__webpack_require__(93));
var DataStream_1 = __importDefault(__webpack_require__(95));
var Reader_1 = __webpack_require__(97);
var Burner_1 = __webpack_require__(98);
var utils_1 = __webpack_require__(94);
var EntryStreamParser_1 = __webpack_require__(99);
var VerbStreamParser_1 = __webpack_require__(100);
var TZDEFINITIONParser_1 = __webpack_require__(101);
var TZREGParser_1 = __webpack_require__(102);
var AppointmentRecurParser_1 = __webpack_require__(103);
var AppointmentRecurParser_2 = __webpack_require__(103);
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
/* 93 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(94);
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
/* 94 */
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
/* 95 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var iconv = __webpack_require__(96);
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
/* 96 */
/***/ ((module) => {

module.exports = require("iconv-lite");

/***/ }),
/* 97 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reader = exports.TypeEnum = void 0;
var DataStream_1 = __importDefault(__webpack_require__(95));
var utils_1 = __webpack_require__(94);
var const_1 = __importDefault(__webpack_require__(93));
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
/* 98 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.burn = void 0;
var Reader_1 = __webpack_require__(97);
var DataStream_1 = __importDefault(__webpack_require__(95));
var const_1 = __importDefault(__webpack_require__(93));
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
/* 99 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var DataStream_1 = __importDefault(__webpack_require__(95));
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
/* 100 */
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
/* 101 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(94);
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
/* 102 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(94);
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
/* 103 */
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
/* 104 */
/***/ ((module) => {

module.exports = require("@kenjiuno/decompressrtf");

/***/ }),
/* 105 */
/***/ ((module) => {

module.exports = require("rtf-stream-parser");

/***/ }),
/* 106 */
/***/ ((module) => {

module.exports = require("aws-sdk");

/***/ }),
/* 107 */
/***/ ((module) => {

module.exports = require("cheerio");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getcoloridMDL = exports.annotRes = exports.annotReq = exports.UserlistRes = exports.UserlistReq = exports.IssuelistRes = exports.IssuelistReq = exports.ComboCodeRes = exports.EmailAttachment = exports.EmailparseReq = exports.ComboCodeReq = void 0;
const swagger_1 = __webpack_require__(71);
const class_transformer_1 = __webpack_require__(70);
const class_validator_1 = __webpack_require__(69);
class ComboCodeReq {
}
exports.ComboCodeReq = ComboCodeReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nCategoryid must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], ComboCodeReq.prototype, "nCategoryid", void 0);
class EmailparseReq {
}
exports.EmailparseReq = EmailparseReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cPath in only string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'ID must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], EmailparseReq.prototype, "nId", void 0);
class EmailAttachment {
}
exports.EmailAttachment = EmailAttachment;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'ID must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], EmailAttachment.prototype, "nId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailAttachment.prototype, "cPath", void 0);
class ComboCodeRes {
}
exports.ComboCodeRes = ComboCodeRes;
class IssuelistReq {
}
exports.IssuelistReq = IssuelistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? 0 : Number(value)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], IssuelistReq.prototype, "nCaseid", void 0);
class IssuelistRes {
}
exports.IssuelistRes = IssuelistRes;
class UserlistReq {
}
exports.UserlistReq = UserlistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? 0 : Number(value)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UserlistReq.prototype, "nCaseid", void 0);
class UserlistRes {
}
exports.UserlistRes = UserlistRes;
class annotReq {
}
exports.annotReq = annotReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? 0 : Number(value)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], annotReq.prototype, "nBundledetailid", void 0);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IssueController = void 0;
const common_1 = __webpack_require__(3);
const issue_interface_1 = __webpack_require__(110);
const issue_service_1 = __webpack_require__(34);
const swagger_1 = __webpack_require__(71);
const export_service_1 = __webpack_require__(111);
const transcript_publish_service_1 = __webpack_require__(116);
const express_1 = __webpack_require__(121);
let IssueController = class IssueController {
    constructor(issu, exportService, transcriptP) {
        this.issu = issu;
        this.exportService = exportService;
        this.transcriptP = transcriptP;
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
    async getList(query) {
        return await this.issu.getIssueCategory(query);
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
    async insertIssueDetail(body) {
        return this.issu.executeIssueDetailOperation(body, 'I');
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
    async getIssueDetailById(query) {
        return this.issu.getIssueDetailById(query);
    }
    async insertHighlights(body) {
        return this.issu.insertHighlights(body, 'I');
    }
    async removemultihighlights(body) {
        return this.issu.removemultihighlights(body);
    }
    async updateHighlightIssueIds(body) {
        console.log('insertIssueDetail', body);
        return this.issu.updateHighlightIssueIds(body);
    }
    async deleteHighlights(body) {
        console.log('deleteHighlights', body);
        return this.issu.deleteHighlights(body, 'D');
    }
    async GetHighlightList(query) {
        return this.issu.GetHighlightLists(query);
    }
    async getArrengedIssue(query) {
        return this.issu.FilterLastSelecedIssued(query);
    }
    async getIssueAnnotationList(query) {
        return this.issu.getIssueAnnotationList(query);
    }
    async getAnnotHighlightExport(body, req) {
        const host = req.get('host');
        const isLocal = host?.includes('localhost') || host?.startsWith('192.');
        const origin = isLocal ? `${process.cwd()}` : `${req.protocol}://${host}`;
        return this.transcriptP.getAnnotHighlightExport(body, origin);
    }
    async dynamiccombo(query) {
        return await this.issu.getcCodeMaster(query);
    }
    async deletedemoissuedetail(body) {
        console.log('deleteCategory');
        return this.issu.deleteDemoIssueDetails(body);
    }
    async getAnnotationOfPages(body) {
        return this.issu.etRealtimeGetIssueAnnotationHighlight(body);
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
    async getIssueVersions(query) {
        return this.issu.getIssueVersions(query);
    }
    async getIssueAnnots(query) {
        return this.issu.getIssueDetail(query);
    }
};
exports.IssueController = IssueController;
__decorate([
    (0, common_1.Post)('insertCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof issue_interface_1.IssueCategoryRequestBody !== "undefined" && issue_interface_1.IssueCategoryRequestBody) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], IssueController.prototype, "insertIssueCategory", null);
__decorate([
    (0, common_1.Put)('updateCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof issue_interface_1.IssueCategoryRequestBody !== "undefined" && issue_interface_1.IssueCategoryRequestBody) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], IssueController.prototype, "updateIssueCategory", null);
__decorate([
    (0, common_1.Delete)('deleteCategory'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof issue_interface_1.DeleteIssueCategoryParam !== "undefined" && issue_interface_1.DeleteIssueCategoryParam) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], IssueController.prototype, "deleteIssueCategory", null);
__decorate([
    (0, common_1.Get)('getIssueCategorylist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof issue_interface_1.catListParam !== "undefined" && issue_interface_1.catListParam) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], IssueController.prototype, "getList", null);
__decorate([
    (0, common_1.Post)('insertIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof issue_interface_1.IssueRequestBody !== "undefined" && issue_interface_1.IssueRequestBody) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], IssueController.prototype, "insertIssue", null);
__decorate([
    (0, common_1.Put)('updateIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof issue_interface_1.IssueRequestBody !== "undefined" && issue_interface_1.IssueRequestBody) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], IssueController.prototype, "updateIssue", null);
__decorate([
    (0, common_1.Delete)('deleteIssue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof issue_interface_1.deleteIssueRequestBody !== "undefined" && issue_interface_1.deleteIssueRequestBody) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], IssueController.prototype, "deleteIssue", null);
__decorate([
    (0, common_1.Get)('issuelist'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof issue_interface_1.IssueListParam !== "undefined" && issue_interface_1.IssueListParam) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], IssueController.prototype, "getIssueList", null);
__decorate([
    (0, common_1.Post)('insertIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof issue_interface_1.InsertIssueDetailRequestBody !== "undefined" && issue_interface_1.InsertIssueDetailRequestBody) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], IssueController.prototype, "insertIssueDetail", null);
__decorate([
    (0, common_1.Put)('updateIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof issue_interface_1.UpdateIssueDetailRequestBody !== "undefined" && issue_interface_1.UpdateIssueDetailRequestBody) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], IssueController.prototype, "updateIssueDetail", null);
__decorate([
    (0, common_1.Delete)('deleteIssueDetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof issue_interface_1.DeleteIssueDetailParam !== "undefined" && issue_interface_1.DeleteIssueDetailParam) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], IssueController.prototype, "deleteIssueDetail", null);
__decorate([
    (0, common_1.Get)('getIssueDetailByIssueId'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof issue_interface_1.issuedetaillist_by_issueidBody !== "undefined" && issue_interface_1.issuedetaillist_by_issueidBody) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], IssueController.prototype, "getIssueDetailbyIsuseid", null);
__decorate([
    (0, common_1.Get)('getIssueDetailById'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof issue_interface_1.isseDetailByIdBody !== "undefined" && issue_interface_1.isseDetailByIdBody) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], IssueController.prototype, "getIssueDetailById", null);
__decorate([
    (0, common_1.Post)('insertHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof issue_interface_1.InsertHighlightsRequestBody !== "undefined" && issue_interface_1.InsertHighlightsRequestBody) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], IssueController.prototype, "insertHighlights", null);
__decorate([
    (0, common_1.Post)('removemultihighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof issue_interface_1.removeMultipleHighlightsReq !== "undefined" && issue_interface_1.removeMultipleHighlightsReq) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], IssueController.prototype, "removemultihighlights", null);
__decorate([
    (0, common_1.Post)('updateHighlightIssueIds'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof issue_interface_1.updateHighlightIssueIdsReq !== "undefined" && issue_interface_1.updateHighlightIssueIdsReq) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], IssueController.prototype, "updateHighlightIssueIds", null);
__decorate([
    (0, common_1.Delete)('deleteHighlights'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_11 = typeof issue_interface_1.deleteHighlightsParam !== "undefined" && issue_interface_1.deleteHighlightsParam) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], IssueController.prototype, "deleteHighlights", null);
__decorate([
    (0, common_1.Get)('GetHighlightList'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_13 = typeof issue_interface_1.HighlightListParam !== "undefined" && issue_interface_1.HighlightListParam) === "function" ? _13 : Object]),
    __metadata("design:returntype", typeof (_14 = typeof Promise !== "undefined" && Promise) === "function" ? _14 : Object)
], IssueController.prototype, "GetHighlightList", null);
__decorate([
    (0, common_1.Get)('getLastIssue'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_15 = typeof issue_interface_1.getLastIssueMDL !== "undefined" && issue_interface_1.getLastIssueMDL) === "function" ? _15 : Object]),
    __metadata("design:returntype", typeof (_16 = typeof Promise !== "undefined" && Promise) === "function" ? _16 : Object)
], IssueController.prototype, "getArrengedIssue", null);
__decorate([
    (0, common_1.Get)('getIssueAnnotationList'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_17 = typeof issue_interface_1.getIssueAnnotationListBody !== "undefined" && issue_interface_1.getIssueAnnotationListBody) === "function" ? _17 : Object]),
    __metadata("design:returntype", typeof (_18 = typeof Promise !== "undefined" && Promise) === "function" ? _18 : Object)
], IssueController.prototype, "getIssueAnnotationList", null);
__decorate([
    (0, common_1.Post)('annothighlightexport'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_19 = typeof issue_interface_1.getAnnotHighlightEEP !== "undefined" && issue_interface_1.getAnnotHighlightEEP) === "function" ? _19 : Object, typeof (_20 = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _20 : Object]),
    __metadata("design:returntype", typeof (_21 = typeof Promise !== "undefined" && Promise) === "function" ? _21 : Object)
], IssueController.prototype, "getAnnotHighlightExport", null);
__decorate([
    (0, common_1.Get)('dynamiccombo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_22 = typeof issue_interface_1.dynamicComboReq !== "undefined" && issue_interface_1.dynamicComboReq) === "function" ? _22 : Object]),
    __metadata("design:returntype", typeof (_23 = typeof Promise !== "undefined" && Promise) === "function" ? _23 : Object)
], IssueController.prototype, "dynamiccombo", null);
__decorate([
    (0, common_1.Post)('deletedemoissuedetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_24 = typeof Promise !== "undefined" && Promise) === "function" ? _24 : Object)
], IssueController.prototype, "deletedemoissuedetail", null);
__decorate([
    (0, common_1.Post)('getannotationofpages'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_25 = typeof issue_interface_1.getIssueAnnotationListBody !== "undefined" && issue_interface_1.getIssueAnnotationListBody) === "function" ? _25 : Object]),
    __metadata("design:returntype", typeof (_26 = typeof Promise !== "undefined" && Promise) === "function" ? _26 : Object)
], IssueController.prototype, "getAnnotationOfPages", null);
__decorate([
    (0, common_1.Post)('setdefault'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_27 = typeof issue_interface_1.defaultSetupReq !== "undefined" && issue_interface_1.defaultSetupReq) === "function" ? _27 : Object]),
    __metadata("design:returntype", typeof (_28 = typeof Promise !== "undefined" && Promise) === "function" ? _28 : Object)
], IssueController.prototype, "serverBuilder", null);
__decorate([
    (0, common_1.Post)('update/issuedetail/note'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_29 = typeof issue_interface_1.updateDetailIssueNote !== "undefined" && issue_interface_1.updateDetailIssueNote) === "function" ? _29 : Object]),
    __metadata("design:returntype", typeof (_30 = typeof Promise !== "undefined" && Promise) === "function" ? _30 : Object)
], IssueController.prototype, "updateIssueNote", null);
__decorate([
    (0, common_1.Get)('versions'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_31 = typeof issue_interface_1.isseDetailByIdBody !== "undefined" && issue_interface_1.isseDetailByIdBody) === "function" ? _31 : Object]),
    __metadata("design:returntype", typeof (_32 = typeof Promise !== "undefined" && Promise) === "function" ? _32 : Object)
], IssueController.prototype, "getIssueVersions", null);
__decorate([
    (0, common_1.Get)('issuedetail/annotations'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_33 = typeof issue_interface_1.annotationsReq !== "undefined" && issue_interface_1.annotationsReq) === "function" ? _33 : Object]),
    __metadata("design:returntype", typeof (_34 = typeof Promise !== "undefined" && Promise) === "function" ? _34 : Object)
], IssueController.prototype, "getIssueAnnots", null);
exports.IssueController = IssueController = __decorate([
    (0, swagger_1.ApiTags)('Issue'),
    (0, common_1.Controller)('issue'),
    __metadata("design:paramtypes", [typeof (_a = typeof issue_service_1.IssueService !== "undefined" && issue_service_1.IssueService) === "function" ? _a : Object, typeof (_b = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _b : Object, typeof (_c = typeof transcript_publish_service_1.TranscriptpublishService !== "undefined" && transcript_publish_service_1.TranscriptpublishService) === "function" ? _c : Object])
], IssueController);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.annotationsReq = exports.updateDetailIssueNote = exports.logJoinReq = exports.defaultSetupReq = exports.getAnnotHighlightEEP = exports.getLastIssueMDL = exports.updateHighlightIssueIdsReq = exports.dynamicComboReq = exports.deleteHighlightsParam = exports.isseDetailByIdBody = exports.issuedetaillist_by_issueidBody = exports.getIssueAnnotationListBody = exports.removeMultipleHighlightsReq = exports.InsertHighlightsRequestBody = exports.HighlightListParam = exports.deleteHighlightsRequestBody = exports.DeleteIssueDetailParam = exports.UpdateIssueDetailRequestBody = exports.InsertIssueDetailRequestBody = exports.DeleteIssueCategoryParam = exports.IssueCategoryRequestBody = exports.IssueListParam = exports.deleteIssueRequestBody = exports.IssueRequestBody = exports.catListParam = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(88);
const swagger_1 = __webpack_require__(71);
const class_transformer_1 = __webpack_require__(70);
const class_validator_1 = __webpack_require__(69);
class BaseSessionDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 22, description: 'Case ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 57, description: 'Session ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 3, description: 'User ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BaseSessionDetail.prototype, "nUserid", void 0);
class catListParam {
}
exports.catListParam = catListParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], catListParam.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], catListParam.prototype, "nUserid", void 0);
class IssueRequestBody {
}
exports.IssueRequestBody = IssueRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue Category ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", typeof (_a = typeof String !== "undefined" && String) === "function" ? _a : Object)
], IssueRequestBody.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: ' Case ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], IssueRequestBody.prototype, "dCreatedt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'User ID', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteIssueRequestBody.prototype, "nIid", void 0);
class IssueListParam extends BaseSessionDetail {
}
exports.IssueListParam = IssueListParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue detail id only in edit mode' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueListParam.prototype, "nIDid", void 0);
class IssueCategoryRequestBody {
}
exports.IssueCategoryRequestBody = IssueCategoryRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Category ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "nICid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category Name', description: 'Category Name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], IssueCategoryRequestBody.prototype, "cCategory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'User ID', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Category ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteIssueCategoryParam.prototype, "nICid", void 0);
class cordinates {
}
class issueIds {
}
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
    (0, swagger_1.ApiProperty)({ example: [{ nIid: 1, nRelid: 2, nImpactid: 3 }], description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], BaseIssueDetailRequestBody.prototype, "cIidStr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Last Issue id', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue Detail ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UpdateIssueDetailRequestBody.prototype, "nIDid", void 0);
class DeleteIssueDetailParam {
}
exports.DeleteIssueDetailParam = DeleteIssueDetailParam;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Issue Detail ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteIssueDetailParam.prototype, "nIDid", void 0);
class deleteHighlightsRequestBody {
}
exports.deleteHighlightsRequestBody = deleteHighlightsRequestBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Highlighted id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteHighlightsRequestBody.prototype, "nHid", void 0);
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
    (0, swagger_1.ApiProperty)({ type: [cordinates], example: [{ x: 100, y: 200 }], description: 'Coordinates', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], InsertHighlightsRequestBody.prototype, "jCordinates", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{"nIid":0}]', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], InsertHighlightsRequestBody.prototype, "cIidStr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Last Issue id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertHighlightsRequestBody.prototype, "nLID", void 0);
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
class removeMultipleHighlightsReq {
}
exports.removeMultipleHighlightsReq = removeMultipleHighlightsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: [1, 2], description: 'Highlight IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], removeMultipleHighlightsReq.prototype, "jHids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], removeMultipleHighlightsReq.prototype, "nUserid", void 0);
class getIssueAnnotationListBody extends BaseSessionDetail {
}
exports.getIssueAnnotationListBody = getIssueAnnotationListBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Transcript' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getIssueAnnotationListBody.prototype, "cTranscript", void 0);
class issuedetaillist_by_issueidBody extends BaseSessionDetail {
}
exports.issuedetaillist_by_issueidBody = issuedetaillist_by_issueidBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 107, description: 'RIssue Master id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], issuedetaillist_by_issueidBody.prototype, "nIid", void 0);
class isseDetailByIdBody {
}
exports.isseDetailByIdBody = isseDetailByIdBody;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 107, description: 'Issue Detail id', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: 107, description: 'Highlight  id', required: true }),
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
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], dynamicComboReq.prototype, "nCategoryid", void 0);
class HissueIds {
}
class updateHighlightIssueIdsReq extends BaseSessionDetail {
}
exports.updateHighlightIssueIdsReq = updateHighlightIssueIdsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{"nIid":1}]', description: 'Issue IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], updateHighlightIssueIdsReq.prototype, "cDefHIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [1, 2], description: 'Highlight IDs', required: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], updateHighlightIssueIdsReq.prototype, "jHids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Last Issue id', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Session ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getAnnotHighlightEEP.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'User ID', required: true }),
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
    (0, swagger_1.ApiProperty)({ example: [], description: 'Issue IDs', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], getAnnotHighlightEEP.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Highlight Issues IDs', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], defaultSetupReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
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
class logJoinReq {
}
exports.logJoinReq = logJoinReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], logJoinReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Session id', required: true }),
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
class updateDetailIssueNote {
}
exports.updateDetailIssueNote = updateDetailIssueNote;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
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
    __metadata("design:type", String)
], annotationsReq.prototype, "nSessionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], annotationsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], annotationsReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'Transcript', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], annotationsReq.prototype, "cTranscript", void 0);


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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
const puppeteer = __webpack_require__(112);
const config_1 = __webpack_require__(22);
const fss = __webpack_require__(113);
const child_process_1 = __webpack_require__(64);
const wkhtmltopdfPath = path.resolve('assets/libs/wkhtmltox/bin', 'wkhtmltopdf.exe');
const util_1 = __webpack_require__(15);
const conversion_js_service_1 = __webpack_require__(114);
const utility_service_1 = __webpack_require__(12);
const query_services_1 = __webpack_require__(35);
const sqllitedb_service_1 = __webpack_require__(7);
const date_fns_1 = __webpack_require__(115);
const log_service_1 = __webpack_require__(39);
const session_service_1 = __webpack_require__(29);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let ExportService = class ExportService {
    constructor(utilityService, config, session, conversion, dbLite, queryService, log) {
        this.utilityService = utilityService;
        this.config = config;
        this.session = session;
        this.conversion = conversion;
        this.dbLite = dbLite;
        this.queryService = queryService;
        this.log = log;
        this.exportPath = `${this.config.get('REALTIME_PATH')}exports/`;
        this.logApplication = 'realtime/export';
        this.intitData();
    }
    async intitData() {
        try {
            await fss.ensureDir(this.exportPath);
        }
        catch (error) {
        }
    }
    async getAnnotHighlightExport(query) {
        const { nSessionid, nCaseid, nUserid, cTranscript = 'N', jIssues = [], jPages = [] } = query;
        const issuesJson = JSON.stringify(jIssues);
        const pagesJson = JSON.stringify(jPages);
        const { query: ref1Query } = this.queryService.getAnnotHighlightExport_RID_Query();
        const ref1Params = [
            cTranscript,
            cTranscript,
            nCaseid,
            nSessionid,
            nUserid,
            issuesJson,
            issuesJson,
            pagesJson,
            pagesJson,
        ];
        const ref1 = await this.dbLite.getCustomQuery(ref1Query, ref1Params);
        try {
            ref1.map(a => a.cordinates = (a.cordinates ? JSON.parse(a.cordinates) : []));
        }
        catch (error) {
        }
        const { query: ref2Query } = this.queryService.getAnnotHighlightExport_RH_Query();
        const ref2Params = [
            cTranscript,
            cTranscript,
            nSessionid,
            nUserid,
            nCaseid,
            nUserid,
            nSessionid,
            issuesJson,
            issuesJson,
            pagesJson,
            pagesJson,
        ];
        const ref2 = await this.dbLite.getCustomQuery(ref2Query, ref2Params);
        const data = await this.exportFile(query, [ref1, ref2]);
        return data;
    }
    async getCaseDetail(nCaseid, nSesid) {
        const query = this.queryService.getCaseDetail();
        let ls = await this.dbLite.getCustomQuery(query, [nSesid, nCaseid]);
        try {
            ls = ls.map(record => {
                const dStartDtStr = record.dStartDt;
                const parsedDate = (0, date_fns_1.parse)(dStartDtStr, "yyyy-MM-dd'T'hh:mm a", new Date());
                if (!(0, date_fns_1.isValid)(parsedDate)) {
                    record.dDay = null;
                    record.dSessionDt = null;
                }
                else {
                    record.dDay = (0, date_fns_1.format)(parsedDate, 'EEEE');
                    record.dSessionDt = (0, date_fns_1.format)(parsedDate, 'dd MMM yyyy');
                }
                return record;
            });
        }
        catch (error) {
        }
        if (ls.length) {
            return ls[0];
        }
        else {
            return {};
        }
    }
    async exportFile(query, res) {
        debugger;
        console.log('Data retrieved successfully:', res);
        this.log.report(`Export start ${JSON.stringify(query)}`, this.logApplication);
        try {
            const caseData = await this.getCaseDetail(query.nCaseid, query.nSessionid);
            const otherCaseData = caseData;
            let rawData;
            let data = [];
            if (query.cTranscript == 'Y' || query.cIsDemo == 'Y') {
                rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${query.cIsDemo == 'Y' ? 'demo-stream' : 's_' + query.nSessionid}.json`), 'utf8');
                data = JSON.parse(rawData);
            }
            else {
                if (caseData.cStatus == 'R' && caseData.cProtocol == 'B') {
                    const output = await this.syncFeedToOffline(caseData.nSesid);
                    data = output;
                }
                else {
                    const inputDir = path.join('localdata', `dt_${query.nSessionid}`);
                    console.log('PROCESS DIRE', inputDir);
                    const output = this.conversion.processDirectory(inputDir);
                    data = output;
                }
            }
            try {
                if (res.length) {
                    const updatedCordinats = this.updateCordinates(data, (res.length > 0 ? res[0] : []), query.cTranscript);
                    res[0] = updatedCordinats;
                }
            }
            catch (error) {
                this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            }
            const summaryOfAnnots = [];
            const summaryOfHihglights = [];
            try {
                const queryforSummaryH = this.queryService.getAnnotIssueSummaryQuery();
                const ref1 = query.bQfact ? await this.dbLite.getCustomQuery(queryforSummaryH, [query.cTranscript || 'N', query.nCaseid, query.nSessionid, query.nUserid]) : [];
                const queryforSummaryM = this.queryService.getHighlightGroupQuery();
                const ref2 = query.bQmark ? await this.dbLite.getCustomQuery(queryforSummaryM, [query.cTranscript || 'N', query.cTranscript || 'N', query.nSessionid, query.nUserid, query.nUserid, query.nSessionid]) : [];
                const dt_ant = { data: [ref1, ref2] };
                if (dt_ant?.data?.length) {
                    if (dt_ant.data[0].length) {
                        summaryOfAnnots.push({ title: 'Q fact', data: dt_ant.data[0] });
                    }
                    if (dt_ant.data[1].length) {
                        const groupData = [];
                        dt_ant.data[1].forEach((item) => {
                            const idx = groupData.findIndex(a => a.nGroupid == item.nGroupid);
                            if (idx > -1) {
                                groupData[idx].data.push(item);
                            }
                            else {
                                groupData.push({ nGroupid: item.nGroupid, data: [item] });
                            }
                        });
                        summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
                    }
                }
            }
            catch (error) {
                this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            }
            const htmlContent = await this.generateHtmlContent(query, data, res, query.bTimestamp, (query.bCoverpg ? { CaseName: query.cCasename, ExportBy: query.cUsername, cTranscript: query.cTranscript } : null), otherCaseData, summaryOfAnnots, summaryOfHihglights);
            fs.writeFileSync(path.join(this.exportPath, `output${query.nSessionid}.html`), htmlContent);
            this.log.report(`html generate successfully!`, this.logApplication);
            console.log('HTML generated successfully!');
            const Filepath = await this.generatePdfWithWkhtml(query);
            this.log.report(`Export complete`, this.logApplication);
            return { msg: 1, path: Filepath, name: 'export.pdf' };
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            console.log('\n\r ERROR', error);
            return { msg: -1 };
        }
    }
    checkForPages(page, query) {
        try {
            return !query.jPages.length || (query.jPages.length && query.jPages.includes(page));
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            return true;
        }
    }
    generateHtmlContent(query, data, res, showTimeStamps, coverParam, x, summaryOfAnnots, summaryOfHihglights) {
        try {
            const date = new Date();
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            const formattedDate = date.toLocaleDateString('en-US', options);
            const htmlTemplatePath = path.join(this.exportPath, 'htmlTemplate.html');
            const issueAnnots = (res && res.length && query.bQfact) ? res[0] : [];
            const highlights = (res && res.length && query.bQmark) ? res[1] : [];
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
                            mainContent += `     <tr style="background:${currentLinedata ? `#${currentLinedata.cColor}` : 'white'}">
                                   <td class="line-no" style="background:${currentLinedata ? `#${currentLinedata.cColor}` : '#eeeeee'}">
                                     <span>${index + 1}</span>
                                    ${showTimeStamps ? `<span>${item.time}</span>` : ''} 
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
                       </table>
                      `;
                    mainContent += `</div>`;
                }
            });
            htmlContent = htmlContent.replace('<div id="main-content-placeholder"></div>', mainContent + '</body></html>');
            return htmlContent;
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
        }
        return '';
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
                        const sortedArray = group?.data.sort((a, b) => parseInt(a.cLineno || "0") - parseInt(b.cLineno || "0"));
                        const page = [...new Set(sortedArray.map(a => a.cPageno))][0];
                        const text = sortedArray.map(a => a.cNote || '').join('<br /> ');
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
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            console.log('Error in bindHighlightsIndex:', error);
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
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
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
        console.log('\n\r\n\rfilePath:', fileUrl);
        await page.goto(fileUrl, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        const pdfname = `s_${query.nSessionid}.pdf`;
        const PDFpath = `${this.exportPath}${pdfname}`;
        console.log('PDFpath:', PDFpath, 'SAVING PDF');
        const opts = {
            path: PDFpath, format: (query.cPgsize ? query.cPgsize : 'A4'), printBackground: true
        };
        let res = await page.pdf(opts);
        console.log('PDF saved successfully!');
        await browser.close();
        console.log('PDF generated successfully!');
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
            const pdfFilePath = `./public/s_${query.nSessionid}.pdf`;
            const htmlContent = await fs.readFileSync(htmlFilePath, 'utf8');
            const data = await this.generatePDF(htmlContent, pdfFilePath);
            const PDFpath = `s_${query.nSessionid}.pdf`;
            console.log('PDFpath:', PDFpath, 'SAVING PDF', data);
            this.log.report(`PDF Saved `, this.logApplication);
            return PDFpath;
        }
        catch (error) {
            this.log.report(`Export error ${error?.message}`, this.logApplication, 'E');
            console.error('Error during PDF conversion:', error);
            return '';
        }
    }
    async generatePDF(htmlContent, outputPath) {
        return new Promise((resolve, reject) => {
            const options = [
                '--page-size', 'A4',
                '--margin-top', '0',
                '--margin-bottom', '0',
                '--margin-left', '0',
                '--margin-right', '0',
                '--print-media-type',
                '-',
                outputPath
            ];
            const child = (0, child_process_1.execFile)(wkhtmltopdfPath, options, (error, stdout, stderr) => {
                if (error) {
                    this.log.report(`Error in generatePDF ${error?.message}`, this.logApplication, 'E');
                    reject(`Error: ${error.message}`);
                }
                else {
                    resolve(`PDF created at: ${outputPath}`);
                }
            });
            child.stdin.write(htmlContent);
            child.stdin.end();
        });
    }
    updateCordinates(data, res, cTranscript) {
        let Adata = [];
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
                            if (index == 4) {
                            }
                            searchLine = c.text || this.getLineText(e.cONote, index) || '';
                            if (true) {
                            }
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
                    catch (error) {
                        this.log.report(`Error in updateCordinates ${error?.message}`, this.logApplication, 'E');
                        console.log('Error in updateCordinates:', error);
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
            debugger;
            const list = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
            list.map(a => a.nSesid = a.id);
            if (!list.length)
                return feedData;
            const sessionDetail = list[0];
            if (!sessionDetail)
                return false;
            if (sessionDetail.cProtocol == 'C')
                return true;
            const feeddata = this.session.CurrentJob?.lineBuffer || [];
            const pageDataLength = sessionDetail.nLines || 25;
            if (feeddata && feeddata.length) {
                const totalpages = Math.ceil(feeddata.length / pageDataLength);
                for (let i = totalpages; i >= 1; i--) {
                    const pageData = this.getPageData(feeddata, i, pageDataLength);
                    try {
                        const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])] }));
                        feedData.push({ msg: i, page: i, data: frmtData });
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }
            return feedData.sort((a, b) => a.page - b.page);
        }
        catch (error) {
            this.log.report(`Error in syncFeedToOffline ${error?.message}`, this.logApplication, 'E');
            console.log(error);
            return feedData;
        }
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _c : Object, typeof (_d = typeof conversion_js_service_1.ConversionJsService !== "undefined" && conversion_js_service_1.ConversionJsService) === "function" ? _d : Object, typeof (_e = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _e : Object, typeof (_f = typeof query_services_1.QueryService !== "undefined" && query_services_1.QueryService) === "function" ? _f : Object, typeof (_g = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _g : Object])
], ExportService);


/***/ }),
/* 112 */
/***/ ((module) => {

module.exports = require("puppeteer");

/***/ }),
/* 113 */
/***/ ((module) => {

module.exports = require("fs-extra");

/***/ }),
/* 114 */
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
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
let ConversionJsService = class ConversionJsService {
    charCodesToString(charCodes) {
        return String.fromCharCode(...charCodes).trim();
    }
    processFile(filePath, pageIndex) {
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            return data.map((item, index) => ({
                time: (item?.length ? item[0] : null),
                lineIndex: index + 1,
                lines: [this.charCodesToString(item?.length ? item[1] : [])],
                unicid: item[6]
            }));
        }
        catch (error) {
            return [];
        }
    }
    processDirectory(dirPath) {
        const output = [];
        try {
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
        }
        catch (error) {
        }
        return output;
    }
};
exports.ConversionJsService = ConversionJsService;
exports.ConversionJsService = ConversionJsService = __decorate([
    (0, common_1.Injectable)()
], ConversionJsService);


/***/ }),
/* 115 */
/***/ ((module) => {

module.exports = require("date-fns");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptpublishService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(22);
const db_service_1 = __webpack_require__(36);
const log_service_1 = __webpack_require__(39);
const transcript_html_service_1 = __webpack_require__(117);
const transcript_service_1 = __webpack_require__(120);
const fs = __webpack_require__(11);
const path_1 = __webpack_require__(14);
const path = __webpack_require__(14);
const puppeteer = __webpack_require__(112);
const utility_service_1 = __webpack_require__(12);
const conversion_js_service_1 = __webpack_require__(114);
const sqllitedb_service_1 = __webpack_require__(7);
const session_service_1 = __webpack_require__(29);
const query_services_1 = __webpack_require__(35);
const fs_1 = __webpack_require__(11);
let TranscriptpublishService = class TranscriptpublishService {
    constructor(config, db, log, htmlService, transService, utilityService, conversion, dbLite, session, queryService) {
        this.config = config;
        this.db = db;
        this.log = log;
        this.htmlService = htmlService;
        this.transService = transService;
        this.utilityService = utilityService;
        this.conversion = conversion;
        this.dbLite = dbLite;
        this.session = session;
        this.queryService = queryService;
        this.logTag = 'realtime/transcript';
        this.browser = null;
    }
    async generateTranscriptDetail(body, formData, lines, theme, nUserid, index, origin, output, isSubmit = true, jPages) {
        debugger;
        console.log(`Generating transcript detail for user ${nUserid} with index ${index}`);
        const isPageRange = jPages?.length > 0;
        const summaryOfAnnots = [];
        const summaryOfHihglights = [];
        try {
            const dt_ant = await this.db.executeRef('realtime_export_annotations_summary', { nCaseid: body.nCaseid, ref: 2, nUserid: nUserid, nSesid: body.nSesid || body.nSessionid, cTranscript: body.cTranscript || 'Y', isAnnotations: body.bQfact, isHighlight: body.bQmark, jHIssues: body.jHIssues || [], jIssues: body.jIssues || [] });
            if (dt_ant?.data?.length) {
                if (dt_ant.data[0].length && body.bQfact) {
                    try {
                        dt_ant.data[0].forEach(a => {
                            if (a.jCordinates?.length) {
                                a.cONote = a.jCordinates.map(a => a.text).join(' \n');
                            }
                        });
                    }
                    catch (error) {
                    }
                    summaryOfAnnots.push({ title: 'Q fact', data: dt_ant.data[0]?.filter(e => e.pageIndex || e.cPageno) || [] });
                }
                if (dt_ant.data[1].length && body.bQmark) {
                    const groupData = [];
                    dt_ant.data[1].filter(e => e.cPageno || e.pageIndex).forEach((item) => {
                        const idx = groupData.findIndex(a => a.nGroupid == item.nGroupid);
                        if (idx > -1) {
                            groupData[idx].data.push(item);
                        }
                        else {
                            groupData.push({ nGroupid: item.nGroupid, data: [item] });
                        }
                    });
                    summaryOfHihglights.push({ title: 'Quick Mark', data: groupData });
                }
            }
        }
        catch (error) {
        }
        let query = {
            nUserid: nUserid,
            nCaseid: body.nCaseid,
            cPath: body.cPath,
            nSessionid: body.nSesid || body.nSessionid,
            bQfact: true,
            bQmark: true,
            jHIssues: body.jHIssues || [],
            jIssues: body.jIssues || [],
            cTranscript: body.cTranscript || 'Y',
        };
        query['ref'] = 2;
        const res = await this.db.executeRef('realtime_get_issue_annotation_highlight_export', query);
        if (res.success) {
            lines = this.convertDraft(lines);
            const filterd_highlights = [];
            const qMarks = [];
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
                                        let index = 0;
                                        let lnInd = 0;
                                        for (let rect of cordinates) {
                                            const [hh, mm, ss] = rect.t.split(':');
                                            const timestamp = [
                                                hh.padStart(2, '0'),
                                                mm.padStart(2, '0'),
                                                ss.padStart(2, '0')
                                            ].join(':');
                                            lnInd = lines.findIndex(a => a.timestamp == timestamp && a?.unicid == rect?.identity);
                                            if (lnInd == -1) {
                                                lnInd = lines.findIndex(a => a.timestamp == timestamp && (a?.unicid ? (a?.unicid == rect?.identity) : true));
                                            }
                                            if (lnInd > -1) {
                                                try {
                                                    if (index == 0) {
                                                        rect.l = lines[lnInd].lineno;
                                                    }
                                                    else {
                                                        if (cordinates[index - 1]?.l == lines[lnInd].lineno) {
                                                            rect.l = lines[lnInd].lineno + 1;
                                                        }
                                                        else {
                                                            rect.l = lines[lnInd].lineno;
                                                        }
                                                    }
                                                }
                                                catch (error) {
                                                    console.error('Error updating line - ', error);
                                                    rect.l = lines[lnInd].lineno;
                                                }
                                                rect.p = lines[lnInd].pageno;
                                            }
                                            index++;
                                        }
                                    }
                                    catch (error) {
                                        console.error('update line error - ', error);
                                    }
                                }
                                const pages = [...new Set(cordinates.map(a => a.p) || [])];
                                if (jPages?.length && !jPages.includes(Number(pages[0])))
                                    continue;
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
                    }
                    const updatedCordinats = this.updateCordinates(lines, (finalIssueDetail), body);
                    res.data[0] = updatedCordinats;
                    let annothighlight = [];
                    try {
                        debugger;
                        if (res.data[1].length) {
                            for (let rect of res.data[1]) {
                                if ((body.cProtocol || 'C') == 'B') {
                                    const [hh, mm, ss] = rect.cTime.split(':');
                                    const timestamp = [
                                        hh.padStart(2, '0'),
                                        mm.padStart(2, '0'),
                                        ss.padStart(2, '0')
                                    ].join(':');
                                    const lnInd = lines.findIndex(a => a.timestamp == timestamp && ((a?.unicid == rect?.identity)));
                                    if (lnInd > -1) {
                                        rect.cLineno = lines[lnInd].lineno.toString();
                                        rect.cPageno = lines[lnInd].pageno.toString();
                                        if (jPages?.length && !jPages.includes(Number(rect.cPageno)))
                                            continue;
                                        filterd_highlights.push(rect);
                                    }
                                    else {
                                        rect.cLineno = -1;
                                    }
                                }
                                if (jPages?.length && !jPages.includes(Number(rect.cPageno)))
                                    continue;
                                qMarks.push(rect);
                            }
                        }
                    }
                    catch (error) {
                        console.error('\n\r\n\r\n\r\n\r ERROR ', error);
                    }
                }
            }
            catch (error) {
            }
            const html = this.htmlService.generateHtml(formData, lines, theme, 'FST', origin, true, body, [res.data[0], filterd_highlights], summaryOfAnnots, summaryOfHihglights, isSubmit, jPages);
            const htmlFile = `t_${formData.cTransid}_${index}.html`;
            const pdfFile = `t_${formData.cTransid}_${index}.pdf`;
            await this.transService.savehtmlToFile(html, htmlFile);
            console.log(`HTML file saved as ${htmlFile}`);
            const outputDir = './public';
            if (!fs.existsSync(outputDir))
                fs.mkdirSync(outputDir, { recursive: true });
            const outputPath = (0, path_1.resolve)(outputDir, pdfFile);
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
            console.log('File generated successfully');
            return { msg: 1, value: `Transcript detail generated for user ${nUserid}`, path: `${pdfFile}`, name: 'export.pdf' };
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
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox'],
        });
        const page = await browser.newPage();
        await page.goto(fileUrl, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outputPdfPath,
            format: cPgsize || 'A4',
            printBackground: true,
        });
        await page.close();
        await browser.close();
        return true;
    }
    logError(message, transid, error) {
        this.log.error(`${message}${error ? ` | ${error}` : ''}`, `${this.logTag}/${transid || 'unknown'}`);
        return { msg: -1, value: message, error: error || message };
    }
    convertToFrameWithoutNanoSec(timestamp) {
        if (!timestamp)
            return '';
        const [hours, minutes, seconds, frames] = timestamp.split(':').map(Number);
        return ((hours * 3600 + minutes * 60 + seconds) * 30);
    }
    startCorditionIndex(firstCprdinate, pgData) {
        const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
        const fTime = t2f(firstCprdinate.t);
        const fUid = Number(firstCprdinate?.identity);
        let ind = pgData.findIndex(a => t2f(a.timestamp) == fTime && (!a.unicid || Number(a.unicid) == fUid));
        if (ind == -1) {
            ind = pgData.findIndex(a => t2f(a.timestamp) >= fTime && (!a.unicid || Number(a.unicid) >= fUid));
        }
        return ind;
    }
    endCorditionIndex(endCordinate, pgData) {
        const t2f = (t) => this.convertToFrameWithoutNanoSec(t);
        const eTime = t2f(endCordinate.t);
        const eUid = endCordinate?.identity;
        let ind = pgData.findIndex(a => eTime == t2f(a.timestamp) && (!a.unicid || eUid == Number(a.unicid)));
        if (ind == -1) {
            ind = pgData.findIndex(a => eTime >= t2f(a.timestamp) && (!a.unicid || eUid >= Number(a.unicid)));
        }
        return ind;
    }
    updateCordinates(data, res, body) {
        try {
            const heighlightData = res;
            heighlightData.forEach(e => {
                const pgData = data;
                if (!e.cordinates || !e.cordinates.length)
                    return;
                const crd = e.cordinates;
                const firstC = crd[0];
                const lastC = crd[crd.length - 1];
                const isSingleLine = crd?.length == 1;
                const expanded = [];
                const firstCordinateIndex = this.startCorditionIndex(firstC, pgData);
                const endCordinateIndex = this.endCorditionIndex(lastC, pgData);
                if (firstCordinateIndex == -1 || endCordinateIndex == -1)
                    return;
                for (let i = 0; i < pgData.length; i++) {
                    const line = pgData[i];
                    if (i >= firstCordinateIndex && endCordinateIndex >= i) {
                        const fullText = line.linetext || '';
                        let annotText = fullText;
                        let startIndex = 0;
                        let endIndex = 0;
                        let indexUpdate = false;
                        if (firstCordinateIndex == i) {
                            annotText = firstC.text ?? fullText;
                            const lineText = line.linetext || '';
                            const searchResult = this.utilityService.findIndices(annotText, lineText);
                            startIndex = searchResult.startIndex;
                            endIndex = isSingleLine ? searchResult.endIndex : (lineText).length;
                            indexUpdate = true;
                        }
                        if (endCordinateIndex == i) {
                            annotText = lastC.text ?? fullText;
                            const lineText = line.linetext || '';
                            const searchResult = this.utilityService.findIndices(annotText, lineText);
                            startIndex = isSingleLine ? searchResult.startIndex : 0;
                            endIndex = searchResult.endIndex;
                            indexUpdate = true;
                        }
                        if (!indexUpdate) {
                            startIndex = 0;
                            endIndex = (annotText ?? fullText).length;
                        }
                        expanded.push({
                            t: line.timestamp,
                            identity: line.unicid,
                            x: 0,
                            y: 0,
                            width: 20,
                            height: 22,
                            l: line.lineno,
                            p: line.pageno,
                            text: annotText,
                            startIndex,
                            endIndex
                        });
                    }
                }
                if (expanded.length) {
                    e.cordinates = expanded;
                }
                if (e.nIDid == '24a4aec9-2ba9-47f1-bcb9-62cf12be0649')
                    console.log('\n\r\n\r\n\r\n\rANNOT ORG\n', e.cordinates, '\nEXPANDED \n', expanded);
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
                console.log('Error ', error);
                return { msg: -1, value: 'Failed to export', error: error };
            }
        }
        else {
            return { msg: -1, value: 'Failed to export', error: res.error };
        }
    }
    async getExportDataTranscript(body, origin) {
        const { nSesid, cTransid, nUserid, nCaseid, jPages } = body;
        const caseData = await this.db.executeRef('realtime_export_othercasedetail', { nCaseid: body.nCaseid, nSesid: body.nSessionid });
        const formResult = await this.db.executeRef('get_transcript_detail', body, 'transcript');
        const formData = formResult.data[0][0];
        let lines;
        let rawData;
        let data;
        const otherCaseData = caseData.data[0][0];
        if (body.cTranscript == 'Y') {
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');
            data = JSON.parse(rawData);
            lines = this.convertTranscript(data);
        }
        else if (body.cIsDemo == 'Y') {
            rawData = fs.readFileSync(path.join(this.config.get('REALTIME_PATH'), `${body.cIsDemo == 'Y' ? 'demo-stream' : 's_' + body.nSessionid}.json`), 'utf8');
            data = JSON.parse(rawData);
            lines = this.convertTranscript(data);
        }
        else {
            body['otherCaseData'] = otherCaseData;
            if (otherCaseData.cStatus == 'R' || otherCaseData.cStatus == 'P') {
                lines = await this.syncFeed(otherCaseData.nSesid);
            }
            else {
                const inputDir = path.join('localdata', `dt_${body.nSessionid}`);
                lines = this.conversion.processDirectory(inputDir);
            }
        }
        const theme = formData.cThemeid ? await this.transService.getThemeDetail({ cThemeid: formData.cThemeid, nMasterid: nUserid }) : {};
        try {
            const output = `realtime-transcripts/exports/`;
            const detailRes = await this.generateTranscriptDetail(body, formData, lines, theme, nUserid, nUserid, origin, output, false, jPages);
            if (detailRes.msg === -1) {
                console.log('Export failed', detailRes);
                return { msg: -1, value: 'Export failed', };
            }
            else {
                return detailRes;
            }
        }
        catch (error) {
            return { msg: -1, value: `Error generating user transcripts: ${error.message}` };
        }
    }
    convertTranscript(pages) {
        return pages.flatMap(pageObj => {
            const pageNum = pageObj.page;
            return pageObj.data.map((lineObj, idx) => {
                let timestamp = '';
                if (lineObj.time) {
                    const tsParts = lineObj.time.split(':');
                    timestamp = tsParts.slice(0, 3).map(s => s.padStart(2, '0')).join(':');
                }
                const linetext = lineObj.lines.join(' ');
                return {
                    lineno: idx + 1,
                    timestamp,
                    linetext,
                    pageno: pageNum,
                    tab_references: [],
                    isIndex: false,
                    unicid: lineObj?.unicid,
                };
            });
        });
    }
    convertDraft(pages) {
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
    async syncFeed(nSesid) {
        let feedData = [];
        try {
            feedData = await this.getFeedData(nSesid);
            return feedData;
        }
        catch (error) {
            this.log.report(`Error in syncFeedToOffline ${error?.message}`, this.logTag, 'E');
            console.log(error);
            return feedData;
        }
    }
    async getFeedData(nSesid) {
        const feeds = await this.readFeed(nSesid);
        if (feeds?.length)
            return feeds;
        const pageDataLength = 25;
        const feeddata = this.session.CurrentJob?.lineBuffer || [];
        try {
            if (feeddata && feeddata.length) {
                const totalpages = Math.ceil(feeddata.length / pageDataLength);
                for (let i = totalpages; i >= 1; i--) {
                    const pageData = [...this.getPageData(feeddata, i, pageDataLength)];
                    try {
                        const frmtData = pageData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }));
                        feeds.push({ msg: i, page: i, data: frmtData });
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }
        }
        catch (error) {
            console.log('Error in getFeedData', error);
        }
        return feeds;
    }
    async readFeed(nSesid) {
        const feeds = [];
        try {
            const folderPath = `localdata/dt_${nSesid}`;
            if (!fs.existsSync(folderPath))
                return feeds;
            const files = await fs_1.promises.readdir(folderPath);
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
                    if (typeof recData === 'string') {
                        recData = JSON.parse(recData);
                    }
                    try {
                        const frmtData = recData.map((a, index) => ({ time: a[0], lineIndex: index + 1, lines: [String.fromCharCode(...a[1] || [])], unicid: a[6] }));
                        feeds.push({ msg: pgNo, page: pgNo, data: frmtData });
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
                catch (error) {
                }
            }
        }
        catch {
        }
        return feeds;
    }
    async processFile(filePath) {
        const data = await fs_1.promises.readFile(filePath, { encoding: 'utf8' });
        return data;
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
};
exports.TranscriptpublishService = TranscriptpublishService;
exports.TranscriptpublishService = TranscriptpublishService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof transcript_html_service_1.TranscriptHtmlService !== "undefined" && transcript_html_service_1.TranscriptHtmlService) === "function" ? _d : Object, typeof (_e = typeof transcript_service_1.TranscriptService !== "undefined" && transcript_service_1.TranscriptService) === "function" ? _e : Object, typeof (_f = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _f : Object, typeof (_g = typeof conversion_js_service_1.ConversionJsService !== "undefined" && conversion_js_service_1.ConversionJsService) === "function" ? _g : Object, typeof (_h = typeof sqllitedb_service_1.SqllitedbService !== "undefined" && sqllitedb_service_1.SqllitedbService) === "function" ? _h : Object, typeof (_j = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _j : Object, typeof (_k = typeof query_services_1.QueryService !== "undefined" && query_services_1.QueryService) === "function" ? _k : Object])
], TranscriptpublishService);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TranscriptHtmlService = void 0;
const common_1 = __webpack_require__(3);
const theme_css_service_1 = __webpack_require__(118);
const utility_service_1 = __webpack_require__(12);
const canvas_1 = __webpack_require__(119);
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
        this.measurementCache = new Map();
        this.canvasContext = null;
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
                    timestamp: '',
                    unicid: ''
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
        const lineHeight = 1.3;
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
<img src="assets/bglayer.png"  class="bg-layer" style="${IsShowBrand ? '' : 'display: none;'}">

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
    generateAnnotationPages(formData, theme, hostorigin) {
        return '';
    }
    generateHtml(formData, lines, theme, type = 'FST', hostorigin = '', isAnnotation = false, query = null, annotres = null, summaryOfAnnots = [], summaryOfHihglights = [], isSubmit = true, jPages = []) {
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
        let titlePageHtml = null;
        if (query.cTranscript == 'Y') {
            titlePageHtml = this.generateTitlePages(formData, theme, hostorigin);
        }
        else {
            titlePageHtml = this.generateTitlePages_2(query, theme, hostorigin);
        }
        let summaryOfAnnotContent = '';
        let summaryOfHihglightsContent = '';
        const issueAnnots = (annotres && annotres.length) && query.bQfact ? annotres[0] : [];
        if (isAnnotation) {
            summaryOfAnnotContent = this.bindIssuesIndex(summaryOfAnnots, jPages);
            summaryOfHihglightsContent = this.bindHighlightsIndex(summaryOfHihglights, theme, jPages);
        }
        const highlights = (annotres && annotres.length) && query.bQmark ? annotres[1] : [];
        const firstPageNo = lines[0].pageno;
        const maxLineno = lines
            .filter(entry => entry.pageno === firstPageNo)
            .reduce((max, curr) => Math.max(max, curr.lineno), 0);
        const pages = this.generatePages(lines, type);
        const contentPagesHtml = pages.map((page, pageIndex) => {
            try {
            }
            catch (error) {
                console.log('skiping page failed', error);
            }
            const curPageData = isAnnotation ? issueAnnots.filter(i => i.pageIndex == (pageIndex + 1)) : [];
            this.coverPglength = isAnnotation ? 0 : this.coverPglength;
            this.indexpagecount = isAnnotation ? 0 : this.indexpagecount;
            const pageNumberDisplay = this.generatePageNumber(theme, (pageIndex + this.coverPglength + this.indexpagecount));
            const swapClass = theme?.bPNSwap ? `swape-page-${theme?.cPNAlignRL}` : '';
            const fourUpClass = type == '4UP' ? 'fourUp-page' : '';
            let quesContinue = false;
            let pageContent = '';
            try {
                pageContent = page.page.map((pageNum) => {
                    if (jPages?.length && !jPages.includes(pageNum)) {
                        return '';
                    }
                    const pageLines = this.getLines(lines, pageNum, maxLineno);
                    const justifyBetween = theme?.nBLinespacing === 0 ? 'justify-between' : '';
                    return `
            <div style="vertical-align: top;" class="lines-wrapper ${justifyBetween}">
            <a name="page-${pageIndex + 1}" class="page-anchor"></a>
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
                        let isBold = false;
                        [questionText, quesContinue, isBold] = this.transformQuestionOrSpicker(line.linetext, theme.jBBold, quesContinue);
                        let startIndex = 0, endIndex = 0;
                        debugger;
                        const currentLinedata = highlights.find(a => {
                            try {
                                const [hh, mm, ss] = a.cTime.split(':');
                                const timestamp = [
                                    hh.padStart(2, '0'),
                                    mm.padStart(2, '0'),
                                    ss.padStart(2, '0')
                                ].join(':');
                                if (line.timestamp == timestamp && line?.unicid == a?.identity) {
                                    return a;
                                }
                                if (line.timestamp == timestamp && (line?.unicid ? (line?.unicid == a?.identity) : line.lineno == a.cLineno)) {
                                    return a;
                                }
                            }
                            catch (error) {
                                console.log('Error finding current line data:', error);
                                a.cLineno && (a && a.cPageno == (pageIndex + 1) && a.cLineno == (index + 1));
                            }
                        });
                        const color2 = currentLinedata ? `#${currentLinedata?.cColor || '00ffff'}` : '';
                        let color = null;
                        if (isAnnotation && curPageData.length > 0) {
                            let matchingLines = this.utilityService.findAllMatchingLines(curPageData, index + 1);
                            matchingLines.forEach((match, matchIndex) => {
                            });
                            const fontFamily = theme?.nBFont
                                ? this.themeCssService['fontOptions'].find(f => f.nValue == theme?.nBFont)?.jOther.font || 'courier'
                                : 'courier';
                            const fontSize = theme?.nBFontsize || 17;
                            const allHighlightCoordinates = matchingLines.flatMap(match => {
                                try {
                                    if (!match.startIndex && !match.endIndex) {
                                        return [];
                                    }
                                    const containerWidth = query.bTimestamp ? 490 : 540;
                                    if (matchingLines.length > 0) {
                                    }
                                    return this.generateMultiLineHighlightCoordinates(line.linetext, match, `${fontSize}pt ${fontFamily}`, containerWidth, query, theme, isBold);
                                }
                                catch (error) {
                                    return [];
                                }
                            });
                            if (allHighlightCoordinates.length > 0) {
                                const svgLayer = `<svg class="annotation-layer overflow-visible" width="100%" height="100%" style="position: absolute; top: 0; left: 0; z-index: 1;mix-blend-mode: multiply;">
                  <g>
                    ${allHighlightCoordinates.map(rect => `
                      <rect class="opacity-80" x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" 
                        fill="${rect.color}" opacity="0.8">
                      </rect>
                    `).join('')}
                  </g>
                </svg>`;
                                questionText = `${svgLayer}${questionText}`;
                            }
                        }
                        return `
              <a name="page-${pageIndex + 1}-${line.lineno}" class="page-anchor"></a>
                  <div class="line-table ${lineBreakClass}" style="height: ${lineHeight}pt;position:relative" >
                  ${color2 ? `<svg class="annotation-layer overflow-visible" width="100%" height="100%" style="position: absolute; top: 0; left: 0; z-index: 0;">
                    <g>
                      <rect class="opacity-80" x="0" y="-2" width="100%" height="${lineHeight + 6}" 
                        fill="${color2}" opacity="0.8">
                      </rect>
                    </g>
                  </svg>` : ''}
                    <div style="display: flex; align-items: baseline;position: relative;">
                      <span class="line-no customfont"> <a class="line-no customfont" id="line-${pageIndex + 1}-${line.lineno}" href="#line-${pageIndex + 1}-${line.lineno}"> ${!line.lineno || line.lineno > 9 ? '' : '0'}${line.lineno ? line.lineno : ''}</a></span>
                      <span class="timestamp customfont">${line.timestamp ? line.timestamp : ''}</span>
                      <div class="line-text">
                      <pre class="customfont" style="height: ${lineHeight}pt; position:relative;z-index: 10;">${questionText}</pre>
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
            if (!isSubmit && query.jPages && query.jPages.length) {
                if (!query.jPages.includes(pageIndex + 1)) {
                    console.log('skiping page', pageIndex);
                    return ``;
                }
            }
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
                    <span style="text-align: end;display: flex;" class="text-end customfont whitespace-nowrap customfont">
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
          <title>Transcript Preview</title>
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
            return ['', continueFlag, false];
        let isBold = false;
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
            isBold = true;
            formatted = `<strong>${formatted}</strong>`;
        }
        return [formatted, continueFlag, isBold];
    }
    bindIssuesIndex(summaryOfAnnots, jPages = []) {
        let mainContent = '';
        const maxItemsPerPage = 15;
        let itemCount = 0;
        let pageCount = 0;
        if (summaryOfAnnots?.length) {
            summaryOfAnnots.forEach((item) => {
                mainContent += `  <div class="page page-break indexpage p-0">
                              <div class="anothead mb-3">Index</div>
                              <div class="heading">${item?.title}</div>
                                  <div class="p-3">
                                  <div class="tabhead">
                                    <div class="pageno">Page</div>
                                    <div class="source">Source Text</div>
                                    <div class="note">Note</div>
                                    <div class="issue">Issues</div>
                                    </div>
                                    `;
                pageCount++;
                if (item.data?.length) {
                    item.data.forEach((annot) => {
                        if (jPages?.length && !jPages.includes(Number(annot.pageIndex))) {
                            return;
                        }
                        const weight = Array.isArray(annot.issues) ? annot.issues.length : 0;
                        const itemWeight = Math.max(1, weight);
                        if (itemCount + itemWeight > maxItemsPerPage) {
                            mainContent += `</div></div>`;
                            mainContent += `  <div class="page page-break indexpage p-0">
                              <div class="anothead mb-3">Index</div>
                              <div class="heading">${item?.title}</div>
                                  <div class="p-3">
                                  <div class="tabhead">
                                    <div class="pageno">Page</div>
                                    <div class="source">Source Text</div>
                                    <div class="note">Note</div>
                                    <div class="issue">Issues</div>
                                    </div>
                                    `;
                            pageCount++;
                            itemCount = 0;
                        }
                        mainContent += `
     <div class="tabbody">
        <div class="pageno"><a href="#page-${annot.pageIndex}-${annot.cLineno}">${annot.pageIndex}</a></div>
        <div class="source">${annot.cONote || '-'}</div>
        <div class="note">${annot.cNote || '-'}</div>`;
                        mainContent += this.bindAllIssues(annot);
                        mainContent += `</div>`;
                        itemCount += itemWeight;
                    });
                }
                mainContent += `</div></div>`;
                itemCount = 0;
            });
            this.indexpagecount = this.indexpagecount + pageCount;
        }
        return mainContent;
    }
    bindHighlightsIndex(summaryOfHihglights, theme, jPages) {
        debugger;
        let mainContent = '';
        const maxItemsPerPage = 15;
        let itemCount = 0;
        let pageCount = 0;
        try {
            if (summaryOfHihglights?.length) {
                summaryOfHihglights.forEach((item) => {
                    mainContent += `
            <div class="page page-break indexpage p-0">
              <div class="anothead mb-3">Index</div>
              <div class="heading">${item?.title}</div>
              <div class="p-3">
                <div class="tabhead">
                  <div class="pageno">Page</div>
                  <div class="source">Source Text</div>
                  <div class="note">Note</div>
                  <div class="issue">Issues</div>
                </div>`;
                    pageCount++;
                    item.data.forEach((group) => {
                        const baseIssues = (group.data[0]?.issues?.length) || 0;
                        const weight = Math.max(1, baseIssues);
                        const text = group.data.map(a => a.cNote || '').join('<br /> ');
                        const sortedArray = group.data
                            .sort((a, b) => parseInt(a.cLineno || "0") - parseInt(b.cLineno || "0"));
                        const page = [...new Set(sortedArray.map(a => a.cPageno))][0];
                        if (jPages?.length && !jPages.includes(Number(page))) {
                            return;
                        }
                        if (itemCount + weight > maxItemsPerPage) {
                            mainContent += `</div></div>`;
                            mainContent += `
                <div class="page page-break indexpage p-0">
                  <div class="anothead mb-3">Index</div>
                  <div class="heading">${item?.title}</div>
                  <div class="p-3">
                    <div class="tabhead">
                      <div class="pageno">Page</div>
                      <div class="source">Source Text</div>
                      <div class="note">Note</div>
                      <div class="issue">Issues</div>
                    </div>`;
                            pageCount++;
                            itemCount = 0;
                        }
                        mainContent += `<div class="tabbody">`;
                        const line = [...new Set(sortedArray.map(a => a.cLineno))][0];
                        const issues = sortedArray[0] || {};
                        mainContent += `
              <div class="pageno">
                <a href="#page-${page}-${line}">${page || ''}</a>
              </div>`;
                        mainContent +=
                            `<div class="source">
${text || ''}
                               </div>`;
                        mainContent += `<div class="note"></div>`;
                        mainContent += this.bindAllIssues(issues);
                        mainContent += `</div>`;
                        itemCount += weight;
                    });
                    mainContent += `</div></div>`;
                    itemCount = 0;
                });
                this.indexpagecount = this.indexpagecount + pageCount;
            }
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
                      <div class="impact"><img width="20px" src="https://etabella.tech/docs/impacts/${issue.nImpactid}.png">  </div>
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
        debugger;
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
    generateMultiLineHighlightCoordinates(lineText, match, font, containerWidth, query, theme, isBold) {
        debugger;
        const coordinates = [];
        const fontSize = theme?.nBFontsize || 17;
        const lineHeight = (fontSize * 1.2) + 8;
        const padding = query.cTranscript === 'Y' ? 3 : 0;
        const totalWidth = this.getTextWidth(lineText, font, theme?.nBLetterspacing + 'px', isBold);
        if (totalWidth + padding <= containerWidth) {
            const textBefore = lineText.slice(0, match.startIndex);
            const textHighlight = lineText.slice(match.startIndex, match.endIndex);
            const x = this.getTextWidth(textBefore, font, theme?.nBLetterspacing + 'px', isBold);
            const width = this.getTextWidth(textHighlight, font, theme?.nBLetterspacing + 'px', isBold);
            coordinates.push({
                x: x,
                y: -2,
                width: width,
                height: lineHeight,
                color: match.color || '#7DBAFF'
            });
        }
        else {
            const wrappedLines = this.calculateWrappedLines(lineText, font, containerWidth, query);
            wrappedLines.forEach((line, lineIndex) => {
                const lineContainsHighlight = !(match.endIndex <= line.startIndex ||
                    match.startIndex >= line.endIndex);
                if (lineContainsHighlight) {
                    const overlapStart = Math.max(match.startIndex, line.startIndex);
                    const overlapEnd = Math.min(match.endIndex, line.endIndex);
                    const relativeOverlapStart = overlapStart - line.startIndex;
                    const relativeOverlapEnd = overlapEnd - line.startIndex;
                    const textBeforeInLine = line.text.slice(0, relativeOverlapStart);
                    const highlightedTextInLine = line.text.slice(relativeOverlapStart, relativeOverlapEnd);
                    const x = this.getTextWidth(textBeforeInLine, font, theme?.nBLetterspacing + 'px', isBold);
                    const width = this.getTextWidth(highlightedTextInLine, font, theme?.nBLetterspacing + 'px', isBold);
                    const y = (lineIndex * (fontSize * 1.2) + (lineIndex > 0 ? 5 : 0));
                    if (lineContainsHighlight) {
                        console.log(`=== POSITIONING DEBUG Line ${lineIndex} ===`);
                        console.log('Full line text:', `"${line.text}"`);
                        console.log('relativeOverlapStart:', relativeOverlapStart);
                        console.log('relativeOverlapEnd:', relativeOverlapEnd);
                        console.log('textBeforeInLine:', `"${textBeforeInLine}"`);
                        console.log('highlightedTextInLine:', `"${highlightedTextInLine}"`);
                        console.log('Measured textBefore width:', this.getTextWidth(textBeforeInLine, font, theme?.nBLetterspacing + 'px', isBold));
                        console.log('Expected highlight start text:', `"${line.text.substring(0, relativeOverlapStart)}"`);
                    }
                    console.log('Character at relativeOverlapStart:', `"${line.text.charAt(relativeOverlapStart)}"`);
                    console.log('First char of highlight:', `"${highlightedTextInLine.charAt(0)}"`);
                    coordinates.push({
                        x: x,
                        y: y,
                        width: width,
                        height: lineHeight,
                        color: match.color || '#7DBAFF'
                    });
                }
            });
        }
        return coordinates;
    }
    calculateWrappedLines(text, font, containerWidth, query) {
        if (!text.trim())
            return [];
        const lines = [];
        const padding = query.cTranscript === 'Y' ? 3 : 0;
        let availableWidth = containerWidth - padding;
        const tokens = text.split(/(\s+)/);
        let currentLine = '';
        let currentStartIndex = 0;
        for (const token of tokens) {
            const testLine = currentLine + token;
            const testWidth = this.getTextWidth(testLine, font);
            if (testWidth <= availableWidth || currentLine === '') {
                currentLine = testLine;
            }
            else {
                if (currentLine.trim()) {
                    lines.push({
                        text: currentLine,
                        startIndex: currentStartIndex,
                        endIndex: currentStartIndex + currentLine.length
                    });
                }
                currentStartIndex = currentStartIndex + currentLine.length;
                currentLine = token;
                availableWidth = containerWidth;
            }
        }
        if (currentLine.trim()) {
            lines.push({
                text: currentLine,
                startIndex: currentStartIndex,
                endIndex: currentStartIndex + currentLine.length
            });
        }
        return lines;
    }
    getCanvasContext() {
        if (!this.canvasContext) {
            const canvas = (0, canvas_1.createCanvas)(500, 50);
            this.canvasContext = canvas.getContext('2d');
        }
        return this.canvasContext;
    }
    getTextWidth(text, font = '14px Arial', letterSpacing = '0px', bold = false) {
        if (!text)
            return 0;
        const cacheKey = `${text}|${font}|${letterSpacing}|${bold}`;
        if (this.measurementCache.has(cacheKey)) {
            return this.measurementCache.get(cacheKey);
        }
        const ctx = this.getCanvasContext();
        ctx.font = bold ? `bold ${font}` : font;
        if ('letterSpacing' in ctx) {
            ctx.letterSpacing = letterSpacing;
            const width = ctx.measureText(text).width;
            if (this.measurementCache.size >= 1000) {
                const firstKey = this.measurementCache.keys().next().value;
                this.measurementCache.delete(firstKey);
            }
            this.measurementCache.set(cacheKey, width);
            return width;
        }
        const baseWidth = ctx.measureText(text).width;
        const letterSpacingValue = parseFloat(letterSpacing.replace('px', ''));
        const characterGaps = Math.max(0, text.length - 1);
        const totalLetterSpacing = characterGaps * letterSpacingValue;
        const spaceCount = (text.match(/ /g) || []).length;
        const totalSpaceLetterSpacing = spaceCount * letterSpacingValue;
        const finalWidth = baseWidth + totalLetterSpacing;
        if (this.measurementCache.size >= 1000) {
            const firstKey = this.measurementCache.keys().next().value;
            this.measurementCache.delete(firstKey);
        }
        this.measurementCache.set(cacheKey, finalWidth);
        return finalWidth;
    }
};
exports.TranscriptHtmlService = TranscriptHtmlService;
exports.TranscriptHtmlService = TranscriptHtmlService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof theme_css_service_1.ThemeCssService !== "undefined" && theme_css_service_1.ThemeCssService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], TranscriptHtmlService);


/***/ }),
/* 118 */
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
                jOther: { font: 'Open Sans' }
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
        setCssVariable('--body-font-size', `${theme?.nBFontsize || 10}pt`);
        setCssVariable('--body-letter-spacing', theme?.nBLetterspacing == null ? '0.5px' : `${theme?.nBLetterspacing}px`);
        setCssVariable('--body-line-spacing', theme?.nBLinespacing == 0 ? '2px' : `${theme?.nBLinespacing}px`);
        const pageNumberFont = theme?.nPNFont ?
            this.fontOptions.find(f => f.nValue == theme?.nPNFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--page-number-font-family', pageNumberFont);
        const pageNumberFontSize = theme?.nPNFontsize == null ? '10pt' : `${theme?.nPNFontsize}pt`;
        setCssVariable('--page-number-font-size', pageNumberFontSize);
        setCssVariable('--page-number-vertical-align', theme?.cPNAlignTB ? theme?.cPNAlignTB.toLowerCase() : 'bottom');
        setCssVariable('--page-number-horizontal-align', theme?.cPNAlignRL ? theme?.cPNAlignRL?.toLowerCase() : 'right');
        const lineNumberFont = theme?.nLFont ?
            this.fontOptions.find(f => f.nValue == theme?.nLFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--line-number-font-family', lineNumberFont);
        const lineNumberFontSize = theme?.nLFontsize == null ? '10pt' : `${theme?.nLFontsize}pt`;
        setCssVariable('--line-number-font-size', lineNumberFontSize);
        setCssVariable('--line-number-display', theme?.bLNShow == null ? 'inline' : (theme?.bLNShow ? 'inline' : 'none'));
        const timestampFont = theme?.nTFont ?
            this.fontOptions.find(f => f.nValue == theme?.nTFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--timestamp-font-family', timestampFont);
        const timestampFontSize = theme?.nTFontsize == null ? '10pt' : `${theme?.nTFontsize}pt`;
        setCssVariable('--timestamp-font-size', timestampFontSize);
        setCssVariable('--timestamp-display', theme?.bTShow == null ? 'inline' : (theme?.bTShow ? 'inline' : 'none'));
        const headerFooterFont = theme?.nHFont ?
            this.fontOptions.find(f => f.nValue == theme?.nHFont)?.jOther.font || 'courier' :
            'courier';
        setCssVariable('--header-footer-font-family', headerFooterFont);
        const headerFooterFontSize = theme?.nHFontsize == null ? '10pt' : `${theme?.nHFontsize}pt`;
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


      .page:not(.page.titlepage):not(.page.indexpage) {
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
         line-height: 1.2;
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
  margin-bottom: 20px;
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



    `;
    }
};
exports.ThemeCssService = ThemeCssService;
exports.ThemeCssService = ThemeCssService = __decorate([
    (0, common_1.Injectable)()
], ThemeCssService);


/***/ }),
/* 119 */
/***/ ((module) => {

module.exports = require("canvas");

/***/ }),
/* 120 */
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
exports.TranscriptService = void 0;
const db_service_1 = __webpack_require__(36);
const log_service_1 = __webpack_require__(39);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(22);
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
const transcript_html_service_1 = __webpack_require__(117);
let TranscriptService = class TranscriptService {
    constructor(config, db, logService, transcriptHtmlService) {
        this.config = config;
        this.db = db;
        this.logService = logService;
        this.transcriptHtmlService = transcriptHtmlService;
        this.logApplication = 'realtime/transcript';
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
};
exports.TranscriptService = TranscriptService;
exports.TranscriptService = TranscriptService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof transcript_html_service_1.TranscriptHtmlService !== "undefined" && transcript_html_service_1.TranscriptHtmlService) === "function" ? _d : Object])
], TranscriptService);


/***/ }),
/* 121 */
/***/ ((module) => {

module.exports = require("express");

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
exports.BackupService = void 0;
const common_1 = __webpack_require__(3);
let BackupService = class BackupService {
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = __decorate([
    (0, common_1.Injectable)()
], BackupService);


/***/ }),
/* 123 */
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
const ioredis_1 = __webpack_require__(48);
const ioredis_2 = __webpack_require__(49);
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
/* 124 */
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
exports.AuthController = void 0;
const common_1 = __webpack_require__(3);
const session_interface_1 = __webpack_require__(87);
const auth_service_1 = __webpack_require__(125);
const swagger_1 = __webpack_require__(71);
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    async login(body) {
        const res = await this.auth.login(body);
        return res;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signinrt'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof session_interface_1.login !== "undefined" && session_interface_1.login) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object])
], AuthController);


/***/ }),
/* 125 */
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
exports.AuthService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(36);
const password_hash_service_1 = __webpack_require__(126);
const unic_identity_service_1 = __webpack_require__(42);
let AuthService = class AuthService {
    constructor(db, passHash, unicIdentity) {
        this.db = db;
        this.passHash = passHash;
        this.unicIdentity = unicIdentity;
        this.schema = 'realtime';
    }
    async login(body) {
        let res = await this.db.executeRef('signin', body, this.schema);
        if (res.success) {
            if (!res.data[0] || !res.data[0].length) {
                return { msg: -1, value: 'Invalid User' };
            }
            try {
                await this.db.executeRef('signin_responce', { nUserid: res.data[0][0]["nUserid"], cSessionUnicId: this.unicIdentity.getSessionUnicId() }, this.schema);
            }
            catch (error) {
            }
            let isVarify = await this.passHash.verifyPassword(body.password, res.data[0][0].cPassword);
            if (isVarify) {
                return { msg: 1, value: 'login successfully', userDetail: res.data[0][0] };
            }
            else {
                return { msg: -1, value: 'Invalid password' };
            }
        }
        else {
            return { msg: -1, value: res.error };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof password_hash_service_1.PasswordHashService !== "undefined" && password_hash_service_1.PasswordHashService) === "function" ? _b : Object, typeof (_c = typeof unic_identity_service_1.UnicIdentityService !== "undefined" && unic_identity_service_1.UnicIdentityService) === "function" ? _c : Object])
], AuthService);


/***/ }),
/* 126 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PasswordHashService = void 0;
const common_1 = __webpack_require__(3);
const bcrypt = __webpack_require__(127);
let PasswordHashService = class PasswordHashService {
    async hashPassword(password) {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    }
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
};
exports.PasswordHashService = PasswordHashService;
exports.PasswordHashService = PasswordHashService = __decorate([
    (0, common_1.Injectable)()
], PasswordHashService);


/***/ }),
/* 127 */
/***/ ((module) => {

module.exports = require("bcrypt");

/***/ }),
/* 128 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnnotDataService = void 0;
const common_1 = __webpack_require__(3);
let AnnotDataService = class AnnotDataService {
};
exports.AnnotDataService = AnnotDataService;
exports.AnnotDataService = AnnotDataService = __decorate([
    (0, common_1.Injectable)()
], AnnotDataService);


/***/ }),
/* 129 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JsonLogService = void 0;
const common_1 = __webpack_require__(3);
const fs_1 = __webpack_require__(11);
const path = __webpack_require__(14);
let JsonLogService = class JsonLogService {
    async saveLog(filepathId, jsonObject, sessionId = 'default') {
        const folderPath = path.join('logs', sessionId, 'python');
        const filePath = path.join(folderPath, `${filepathId}.json`);
        try {
            await fs_1.promises.mkdir(folderPath, { recursive: true });
            let logs = [];
            try {
                const fileContent = await fs_1.promises.readFile(filePath, 'utf8');
                logs = JSON.parse(fileContent);
                if (!Array.isArray(logs)) {
                    throw new Error('Log file is not a valid array.');
                }
            }
            catch (err) {
                logs = [];
            }
            logs.push(...jsonObject);
            await fs_1.promises.writeFile(filePath, JSON.stringify(logs, null, 2), 'utf8');
            console.log(`✅ Log saved to ${filePath}`);
        }
        catch (err) {
            console.error(`❌ Failed to save log to ${filePath}:`, err);
            throw err;
        }
    }
};
exports.JsonLogService = JsonLogService;
exports.JsonLogService = JsonLogService = __decorate([
    (0, common_1.Injectable)()
], JsonLogService);


/***/ }),
/* 130 */
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
exports.FeedController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(71);
const feed_interface_1 = __webpack_require__(131);
const feed_service_1 = __webpack_require__(132);
let FeedController = class FeedController {
    constructor(feed) {
        this.feed = feed;
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
    (0, common_1.Get)('pages/total'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof feed_interface_1.feedTotalPage !== "undefined" && feed_interface_1.feedTotalPage) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], FeedController.prototype, "getTotalPages", null);
__decorate([
    (0, common_1.Get)('pages/data'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof feed_interface_1.FeedPageReq !== "undefined" && feed_interface_1.FeedPageReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], FeedController.prototype, "getList", null);
exports.FeedController = FeedController = __decorate([
    (0, swagger_1.ApiTags)('feed'),
    (0, common_1.Controller)('feed'),
    __metadata("design:paramtypes", [typeof (_a = typeof feed_service_1.FeedService !== "undefined" && feed_service_1.FeedService) === "function" ? _a : Object])
], FeedController);


/***/ }),
/* 131 */
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
const swagger_1 = __webpack_require__(71);
const class_transformer_1 = __webpack_require__(70);
const class_validator_1 = __webpack_require__(69);
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
/* 132 */
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
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
const feed_data_service_1 = __webpack_require__(133);
const fs_1 = __webpack_require__(11);
const config_1 = __webpack_require__(22);
const fsp = __webpack_require__(13);
let FeedService = class FeedService {
    constructor(feedData, config) {
        this.feedData = feedData;
        this.config = config;
        this.logger = new common_1.Logger('feed');
    }
    async getFeedData(query) {
        debugger;
        const { nSesid, pages, bTranscript } = query;
        try {
            if (bTranscript) {
                this.logger.warn(`Transcript fetching ${nSesid}`);
                const transfeed = await this.readTranscript(nSesid);
                return { total: (await transfeed)?.length, feed: transfeed };
            }
            const folderPath = path.join('localdata', `dt_${nSesid}`);
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
        const folderPath = path.join('localdata', `dt_${nSesid}`);
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
            debugger;
            const { nSesid } = query;
            const folderPath = path.join('localdata', `dt_${nSesid}`);
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
/* 133 */
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
var FeedDataService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FeedDataService = void 0;
const common_1 = __webpack_require__(3);
const session_service_1 = __webpack_require__(29);
let FeedDataService = FeedDataService_1 = class FeedDataService {
    constructor(sessionService) {
        this.sessionService = sessionService;
        this.logger = new common_1.Logger(FeedDataService_1.name);
    }
    checkSessionExists(nSesid) {
        return nSesid == this.sessionService.currentSessionid;
    }
    sessionTotalPages(nSesid) {
        if (this.sessionService.currentSessionid != nSesid)
            return 0;
        const feeddata = this.sessionService.CurrentJob?.lineBuffer || [];
        const pageDataLength = (this.sessionService.currentSessionLines || 25);
        return Math.ceil(feeddata.length / pageDataLength);
    }
    async getSessionPagesData(nSesid, reqPages) {
        debugger;
        try {
            const feeddata = this.sessionService.CurrentJob?.lineBuffer || [];
            const pageDataLength = (this.sessionService.currentSessionLines || 25);
            const totalpages = Math.ceil(feeddata.length / pageDataLength);
            const result = [];
            for (let x of reqPages) {
                const page = Number(x);
                const pageData = this.getPageData(feeddata, page, pageDataLength) || [];
                result.push({ page, data: pageData });
            }
            return { total: totalpages, feed: result };
        }
        catch (error) {
            this.logger.error(`Error`, error?.message);
            return { total: 0, feed: [] };
        }
    }
    getPageData(data, pageNumber, linesPerPage = 25) {
        const startIndex = (pageNumber - 1) * linesPerPage;
        const endIndex = pageNumber * linesPerPage;
        return data.slice(startIndex, endIndex);
    }
};
exports.FeedDataService = FeedDataService;
exports.FeedDataService = FeedDataService = FeedDataService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof session_service_1.SessionService !== "undefined" && session_service_1.SessionService) === "function" ? _a : Object])
], FeedDataService);


/***/ }),
/* 134 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 135 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 136 */
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
/* 137 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 138 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CrashLoggingFilter = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(11);
const path = __webpack_require__(14);
let CrashLoggingFilter = class CrashLoggingFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : { message: exception.message, stack: exception.stack };
        const logMessage = `[${new Date().toISOString()}] ${status} - ${JSON.stringify(message)}\n`;
        const logDir = path.resolve('logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        fs.appendFileSync(path.join(logDir, 'crash.log'), logMessage);
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: message.message || message,
        });
    }
};
exports.CrashLoggingFilter = CrashLoggingFilter;
exports.CrashLoggingFilter = CrashLoggingFilter = __decorate([
    (0, common_1.Catch)()
], CrashLoggingFilter);


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
const realtime_module_1 = __webpack_require__(2);
const compression = __webpack_require__(134);
const cookieParser = __webpack_require__(135);
const exception_1 = __webpack_require__(136);
const common_1 = __webpack_require__(3);
const dotenv = __webpack_require__(137);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(22);
const swagger_1 = __webpack_require__(71);
const crash_logging_filter_1 = __webpack_require__(138);
const fs = __webpack_require__(11);
async function bootstrap() {
    const app = await core_1.NestFactory.create(realtime_module_1.RealtimeModule);
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    app.use(compression());
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Etabella Realtime API')
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
    app.useGlobalFilters(new exception_1.HttpErrorFilter(), new crash_logging_filter_1.CrashLoggingFilter());
    const configService = app.get(config_1.ConfigService);
    try {
        process.on('uncaughtException', (err) => {
            console.error('Uncaught Exception E:', err);
            const logMessage = `[${new Date().toISOString()}] [Uncaught Exception] ${err.message}\nStack: ${err.stack || 'N/A'}\n\n`;
            fs.appendFileSync('app-crash.log', logMessage);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection E:', reason);
            const logMessage = `[${new Date().toISOString()}] [Unhandled Rejection] ${reason}\n\n`;
            fs.appendFileSync('app-crash.log', logMessage);
        });
    }
    catch (error) {
        console.log('ERROR while logging exit', error);
    }
    await app.listen(configService.get('PORT_REALTIMEAPI'));
}
bootstrap();

})();

/******/ })()
;