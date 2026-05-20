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
exports.CoreapiModule = void 0;
const common_1 = __webpack_require__(3);
const coreapi_controller_1 = __webpack_require__(4);
const coreapi_service_1 = __webpack_require__(5);
const case_module_1 = __webpack_require__(7);
const global_1 = __webpack_require__(36);
const team_setup_module_1 = __webpack_require__(42);
const bundle_creation_module_1 = __webpack_require__(51);
const permission_module_1 = __webpack_require__(77);
const admin_dashboard_module_1 = __webpack_require__(81);
const user_dashboard_module_1 = __webpack_require__(86);
const ticket_module_1 = __webpack_require__(90);
const upload_module_1 = __webpack_require__(94);
const individual_module_1 = __webpack_require__(101);
const common_module_1 = __webpack_require__(123);
const contact_module_1 = __webpack_require__(144);
const navigation_module_1 = __webpack_require__(148);
const workspace_module_1 = __webpack_require__(153);
const caseactivity_module_1 = __webpack_require__(160);
const helpcenter_module_1 = __webpack_require__(168);
const marknev_module_1 = __webpack_require__(172);
const comments_module_1 = __webpack_require__(176);
let CoreapiModule = class CoreapiModule {
};
exports.CoreapiModule = CoreapiModule;
exports.CoreapiModule = CoreapiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_dashboard_module_1.UserDashboardModule, admin_dashboard_module_1.AdminDashboardModule, global_1.GlobalModule, case_module_1.CaseModule, team_setup_module_1.TeamSetupModule, bundle_creation_module_1.BundleCreationModule, permission_module_1.PermissionModule, ticket_module_1.TicketModule, upload_module_1.UploadModule,
            individual_module_1.IndividualModule, common_module_1.CommonModule, contact_module_1.ContactModule, navigation_module_1.NavigationModule, workspace_module_1.WorkspaceModule, caseactivity_module_1.CaseactivityModule, helpcenter_module_1.HelpcenterModule, marknev_module_1.MarknevModule, comments_module_1.CommentsModule
        ],
        controllers: [coreapi_controller_1.CoreapiController],
        providers: [coreapi_service_1.CoreapiService],
    })
], CoreapiModule);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CoreapiController = void 0;
const common_1 = __webpack_require__(3);
const coreapi_service_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(6);
let CoreapiController = class CoreapiController {
    constructor(coreapiService) {
        this.coreapiService = coreapiService;
    }
    getHello() {
        return this.coreapiService.getHello();
    }
    async sendMessage(data) {
        return await this.coreapiService.sendMessage(data);
    }
};
exports.CoreapiController = CoreapiController;
__decorate([
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], CoreapiController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('/send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoreapiController.prototype, "sendMessage", null);
exports.CoreapiController = CoreapiController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof coreapi_service_1.CoreapiService !== "undefined" && coreapi_service_1.CoreapiService) === "function" ? _a : Object])
], CoreapiController);


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
exports.CoreapiService = void 0;
const common_1 = __webpack_require__(3);
let CoreapiService = class CoreapiService {
    async sendMessage(data) {
    }
    getHello() {
        return 'Hello World! 1';
    }
};
exports.CoreapiService = CoreapiService;
exports.CoreapiService = CoreapiService = __decorate([
    (0, common_1.Injectable)()
], CoreapiService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

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
exports.CaseModule = void 0;
const common_1 = __webpack_require__(3);
const case_controller_1 = __webpack_require__(8);
const case_service_1 = __webpack_require__(9);
const shared_module_1 = __webpack_require__(25);
const jwt_middleware_1 = __webpack_require__(33);
const filesystem_service_1 = __webpack_require__(14);
const case_admin_middleware_1 = __webpack_require__(35);
let CaseModule = class CaseModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(case_controller_1.CaseController),
            consumer
                .apply(case_admin_middleware_1.CaseAdminMiddleware)
                .forRoutes({ path: 'case/casedetail', method: common_1.RequestMethod.ALL }, { path: 'case/casedelete', method: common_1.RequestMethod.ALL });
    }
};
exports.CaseModule = CaseModule;
exports.CaseModule = CaseModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [case_controller_1.CaseController],
        providers: [case_service_1.CaseService, filesystem_service_1.FilesystemService],
    })
], CaseModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CaseController = void 0;
const common_1 = __webpack_require__(3);
const case_service_1 = __webpack_require__(9);
const case_interface_1 = __webpack_require__(17);
const swagger_1 = __webpack_require__(6);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let CaseController = class CaseController {
    constructor(caseService) {
        this.caseService = caseService;
    }
    async casebuilder(body) {
        return await this.caseService.casebuilder(body);
    }
    async getCaseDetail(query) {
        return await this.caseService.getCaseDetail(query);
    }
    async getCaseinfo(query) {
        return await this.caseService.getCaseDetail(query);
    }
    async deleteCase(body) {
        return await this.caseService.deleteCase(body);
    }
    async getNotificationList(query) {
        return await this.caseService.getNotification(query);
    }
    async syncNotificationList(query) {
        return await this.caseService.syncNotification(query);
    }
    async clearAllNotitfiactions(body) {
        return await this.caseService.clearAllNotitfiactions(body);
    }
};
exports.CaseController = CaseController;
__decorate([
    (0, common_1.Post)('casebuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof case_interface_1.CaseModal !== "undefined" && case_interface_1.CaseModal) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CaseController.prototype, "casebuilder", null);
__decorate([
    (0, common_1.Get)('casedetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(9),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof case_interface_1.CaseDetailReq !== "undefined" && case_interface_1.CaseDetailReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CaseController.prototype, "getCaseDetail", null);
__decorate([
    (0, common_1.Get)('caseinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof case_interface_1.CaseDetailReq !== "undefined" && case_interface_1.CaseDetailReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CaseController.prototype, "getCaseinfo", null);
__decorate([
    (0, common_1.Post)('casedelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof case_interface_1.CaseDeleteReq !== "undefined" && case_interface_1.CaseDeleteReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], CaseController.prototype, "deleteCase", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof case_interface_1.NotificationReq !== "undefined" && case_interface_1.NotificationReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], CaseController.prototype, "getNotificationList", null);
__decorate([
    (0, common_1.Get)('syncnotifications'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof case_interface_1.NotificationReq !== "undefined" && case_interface_1.NotificationReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], CaseController.prototype, "syncNotificationList", null);
__decorate([
    (0, common_1.Post)('notification/delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof case_interface_1.NotificationDelete !== "undefined" && case_interface_1.NotificationDelete) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], CaseController.prototype, "clearAllNotitfiactions", null);
exports.CaseController = CaseController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('Case'),
    (0, common_1.Controller)('case'),
    __metadata("design:paramtypes", [typeof (_a = typeof case_service_1.CaseService !== "undefined" && case_service_1.CaseService) === "function" ? _a : Object])
], CaseController);


/***/ }),
/* 9 */
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
exports.CaseService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const filesystem_service_1 = __webpack_require__(14);
let CaseService = class CaseService {
    constructor(db, fs) {
        this.db = db;
        this.fs = fs;
    }
    async casebuilder(body) {
        let res = await this.db.executeRef('admin_insertupdate_case', body);
        if (res.success) {
            if (body.permission == 'N') {
                const nCaseid = res.data[0][0]["nCaseid"];
                await this.fs.createDirectoryHierarchy('doc/case' + nCaseid);
                try {
                    await this.db.executeRef('realtime_ensure_unassigned_issue', { nCaseid });
                }
                catch (err) {
                    console.error('ensure_unassigned_issue failed for case', nCaseid, err);
                }
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getCaseDetail(body) {
        let res = await this.db.executeRef('admin_case_getdetail', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getCaseinfo(body) {
        let res = await this.db.executeRef('admin_case_getinfo', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async deleteCase(body) {
        let res = await this.db.executeRef('admin_case_delete', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getNotification(body) {
        let res = await this.db.executeRef('notification_list', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async syncNotification(body) {
        let res = await this.db.executeRef('notification_sync', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async clearAllNotitfiactions(body) {
        let res = await this.db.executeRef('notification_delete', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.CaseService = CaseService;
exports.CaseService = CaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof filesystem_service_1.FilesystemService !== "undefined" && filesystem_service_1.FilesystemService) === "function" ? _b : Object])
], CaseService);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(11);
const query_builder_service_1 = __webpack_require__(12);
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
/* 11 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 12 */
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilesystemService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(13);
const fs = __webpack_require__(15);
const path = __webpack_require__(16);
let FilesystemService = class FilesystemService {
    constructor(config) {
        this.config = config;
    }
    createDirectoryHierarchy(dirPath) {
        return new Promise((resolve, reject) => {
            const fullPath = path.join(this.config.get('ASSETS'), dirPath);
            try {
                if (!fs.existsSync(fullPath)) {
                    fs.mkdir(fullPath, { recursive: true }, (error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            }
            catch (error) {
            }
        });
    }
};
exports.FilesystemService = FilesystemService;
exports.FilesystemService = FilesystemService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], FilesystemService);


/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 17 */
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
exports.NotificationDelete = exports.NotificationReq = exports.CaseDeleteRes = exports.CaseDeleteReq = exports.CaseDetailResponce = exports.CaseDetailReq = exports.CaseCreationResonce = exports.CaseModal = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
class CaseModal {
}
exports.CaseModal = CaseModal;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseModal.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cCasename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cCaseno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cIndexheader", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cClaimant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cRespondent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cTClaimant", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "cTRespondent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseModal.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseModal.prototype, "nMasterid", void 0);
class CaseCreationResonce {
}
exports.CaseCreationResonce = CaseCreationResonce;
class CaseDetailReq {
}
exports.CaseDetailReq = CaseDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseDetailReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseDetailReq.prototype, "nMasterid", void 0);
class CaseDetailResponce {
}
exports.CaseDetailResponce = CaseDetailResponce;
class CaseDeleteReq {
}
exports.CaseDeleteReq = CaseDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseDeleteReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseDeleteReq.prototype, "nMasterid", void 0);
class CaseDeleteRes {
}
exports.CaseDeleteRes = CaseDeleteRes;
class NotificationReq {
}
exports.NotificationReq = NotificationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], NotificationReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], NotificationReq.prototype, "nMasterid", void 0);
class NotificationDelete {
}
exports.NotificationDelete = NotificationDelete;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], NotificationDelete.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], NotificationDelete.prototype, "nNTid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], NotificationDelete.prototype, "nMasterid", void 0);


/***/ }),
/* 18 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("class-validator");

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
exports.LogInterceptor = void 0;
const common_1 = __webpack_require__(3);
const core_1 = __webpack_require__(1);
const operators_1 = __webpack_require__(22);
const event_log_service_1 = __webpack_require__(23);
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
/* 22 */
/***/ ((module) => {

module.exports = require("rxjs/operators");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventLogService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(13);
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
/* 24 */
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
/* 25 */
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
const db_service_1 = __webpack_require__(10);
const query_builder_service_1 = __webpack_require__(12);
const redis_db_service_1 = __webpack_require__(26);
const ioredis_1 = __webpack_require__(28);
const config_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(29);
const event_log_service_1 = __webpack_require__(23);
const kafka_module_1 = __webpack_require__(32);
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(27);
const ioredis_2 = __webpack_require__(28);
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
/* 27 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(30);
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
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(31);
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
/* 31 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 32 */
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
const microservices_1 = __webpack_require__(31);
const kafka_shared_service_1 = __webpack_require__(30);
const config_1 = __webpack_require__(13);
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
const redis_db_service_1 = __webpack_require__(26);
const config_1 = __webpack_require__(13);
const db_service_1 = __webpack_require__(10);
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CaseAdminMiddleware = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(10);
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
/* 36 */
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
__exportStar(__webpack_require__(37), exports);
__exportStar(__webpack_require__(38), exports);


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
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(38);
const config_1 = __webpack_require__(13);
const scheduler_service_1 = __webpack_require__(39);
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
/* 38 */
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
/* 39 */
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
const moment = __webpack_require__(40);
const schedule = __webpack_require__(41);
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
/* 40 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 42 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamSetupModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const team_setup_controller_1 = __webpack_require__(43);
const team_setup_service_1 = __webpack_require__(44);
const jwt_middleware_1 = __webpack_require__(33);
const team_data_controller_1 = __webpack_require__(48);
const team_data_service_1 = __webpack_require__(50);
const password_hash_service_1 = __webpack_require__(45);
const case_admin_middleware_1 = __webpack_require__(35);
let TeamSetupModule = class TeamSetupModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(team_setup_controller_1.TeamSetupController, team_data_controller_1.TeamDataController),
            consumer
                .apply(case_admin_middleware_1.CaseAdminMiddleware)
                .forRoutes({ path: 'team-setup/teambuilder', method: common_1.RequestMethod.ALL }, { path: 'team-setup/teamdelete', method: common_1.RequestMethod.ALL }, { path: 'team-setup/assignteam', method: common_1.RequestMethod.ALL }, { path: 'team-data/teamlist', method: common_1.RequestMethod.ALL });
    }
};
exports.TeamSetupModule = TeamSetupModule;
exports.TeamSetupModule = TeamSetupModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [team_data_controller_1.TeamDataController, team_setup_controller_1.TeamSetupController],
        providers: [team_setup_service_1.TeamSetupService, team_data_service_1.TeamDataService, password_hash_service_1.PasswordHashService],
    })
], TeamSetupModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamSetupController = void 0;
const common_1 = __webpack_require__(3);
const team_setup_service_1 = __webpack_require__(44);
const swagger_1 = __webpack_require__(6);
const team_setup_interface_1 = __webpack_require__(47);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let TeamSetupController = class TeamSetupController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async caseBuilder(body) {
        return await this.teamService.caseBuilder(body);
    }
    async teamdelete(body) {
        return await this.teamService.deleteTeam(body);
    }
    async buildUser(body) {
        return await this.teamService.userBuilder(body);
    }
    async assignTeam(body) {
        return await this.teamService.teamAssignment(body);
    }
    async deleteUser(body) {
        return await this.teamService.deleteUser(body);
    }
};
exports.TeamSetupController = TeamSetupController;
__decorate([
    (0, common_1.Post)('teambuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof team_setup_interface_1.TeamBuilderReq !== "undefined" && team_setup_interface_1.TeamBuilderReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], TeamSetupController.prototype, "caseBuilder", null);
__decorate([
    (0, common_1.Post)('teamdelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof team_setup_interface_1.TeamDeleteReq !== "undefined" && team_setup_interface_1.TeamDeleteReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], TeamSetupController.prototype, "teamdelete", null);
__decorate([
    (0, common_1.Post)('userbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof team_setup_interface_1.UserBuilderReq !== "undefined" && team_setup_interface_1.UserBuilderReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TeamSetupController.prototype, "buildUser", null);
__decorate([
    (0, common_1.Post)('assignteam'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(12),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof team_setup_interface_1.teamSetup !== "undefined" && team_setup_interface_1.teamSetup) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TeamSetupController.prototype, "assignTeam", null);
__decorate([
    (0, common_1.Post)('userdelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof team_setup_interface_1.UserDeleteReq !== "undefined" && team_setup_interface_1.UserDeleteReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TeamSetupController.prototype, "deleteUser", null);
exports.TeamSetupController = TeamSetupController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('team-setup'),
    (0, common_1.Controller)('team-setup'),
    __metadata("design:paramtypes", [typeof (_a = typeof team_setup_service_1.TeamSetupService !== "undefined" && team_setup_service_1.TeamSetupService) === "function" ? _a : Object])
], TeamSetupController);


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
var TeamSetupService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamSetupService = void 0;
const db_service_1 = __webpack_require__(10);
const redis_db_service_1 = __webpack_require__(26);
const password_hash_service_1 = __webpack_require__(45);
const common_1 = __webpack_require__(3);
let TeamSetupService = TeamSetupService_1 = class TeamSetupService {
    constructor(db, passHash, rds) {
        this.db = db;
        this.passHash = passHash;
        this.rds = rds;
        this.logger = new common_1.Logger(TeamSetupService_1.name);
    }
    async caseBuilder(body) {
        let res = await this.db.executeRef('teambuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async deleteTeam(body) {
        body.permission = 'D';
        let res = await this.db.executeRef('teambuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Deletion failed', error: res.error };
        }
    }
    async userBuilder(body) {
        try {
            if (body.cPassword) {
                body.cPassword = await this.passHash.hashPassword(body.cPassword);
            }
            let res = await this.db.executeRef('userbuilder', body);
            if (res.success) {
                if (body.nTeamid) {
                    let teamObj = Object.assign(body, { nUserid: res.data[0][0]["nUserid"] });
                    await this.db.executeRef('user_team_management', teamObj);
                }
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Creation failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Creation failed', error: error };
        }
    }
    async teamAssignment(body) {
        try {
            let res = await this.db.executeRef('admin_case_teamsetup', body);
            if (res.success) {
                this.createCaseTuples(body);
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Update failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Update failed', error: error };
        }
    }
    async deleteUser(body) {
        let res = await this.db.executeRef('userbuilder', body);
        if (res.success) {
            try {
                this.rds.deleteValue(`user/${body.nUserid}`);
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async createCaseTuples(body) {
        try {
        }
        catch (error) {
            this.logger.error('createCaseTuples failed', error);
            return { msg: -1, value: 'Update failed', error };
        }
    }
};
exports.TeamSetupService = TeamSetupService;
exports.TeamSetupService = TeamSetupService = TeamSetupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof password_hash_service_1.PasswordHashService !== "undefined" && password_hash_service_1.PasswordHashService) === "function" ? _b : Object, typeof (_c = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _c : Object])
], TeamSetupService);


/***/ }),
/* 45 */
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
const bcrypt = __webpack_require__(46);
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
/* 46 */
/***/ ((module) => {

module.exports = require("bcrypt");

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
exports.TeamcolorRes = exports.UserDeleteRes = exports.UserDeleteReq = exports.teamSetupRes = exports.teamSetup = exports.UserBuilderRes = exports.UserBuilderReq = exports.TeamDeleteRes = exports.TeamDeleteReq = exports.TeamBuilderRes = exports.TeamBuilderReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class TeamBuilderReq {
}
exports.TeamBuilderReq = TeamBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "nTeamid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Team Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "cTeamname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Team Color', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "cClr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamBuilderReq.prototype, "nMasterid", void 0);
class TeamBuilderRes {
}
exports.TeamBuilderRes = TeamBuilderRes;
class TeamDeleteReq {
}
exports.TeamDeleteReq = TeamDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamDeleteReq.prototype, "nTeamid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TeamDeleteReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamDeleteReq.prototype, "nMasterid", void 0);
class TeamDeleteRes {
}
exports.TeamDeleteRes = TeamDeleteRes;
class UserBuilderReq {
}
exports.UserBuilderReq = UserBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'First Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "cFname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Last Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "cLname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Email', required: true }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], UserBuilderReq.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Password', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "cPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Profile', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "cProfile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Timezone', required: true }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], UserBuilderReq.prototype, "nTZid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Role id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "nTeamid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserBuilderReq.prototype, "nMasterid", void 0);
class UserBuilderRes {
}
exports.UserBuilderRes = UserBuilderRes;
class UserDetail {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserDetail.prototype, "u", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserDetail.prototype, "t", void 0);
class teamSetup {
}
exports.teamSetup = teamSetup;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], teamSetup.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [UserDetail], description: 'User Details', required: true }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UserDetail),
    __metadata("design:type", Array)
], teamSetup.prototype, "jUsers", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], teamSetup.prototype, "nMasterid", void 0);
class teamSetupRes {
}
exports.teamSetupRes = teamSetupRes;
class UserDeleteReq {
}
exports.UserDeleteReq = UserDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserDeleteReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserDeleteReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserDeleteReq.prototype, "permission", void 0);
class UserDeleteRes {
}
exports.UserDeleteRes = UserDeleteRes;
class TeamcolorRes {
}
exports.TeamcolorRes = TeamcolorRes;


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamDataController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const team_interface_1 = __webpack_require__(49);
const team_data_service_1 = __webpack_require__(50);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let TeamDataController = class TeamDataController {
    constructor(teamService) {
        this.teamService = teamService;
    }
    async getTeams(query) {
        return await this.teamService.getCaseTeams(query);
    }
    async getUsers(query) {
        return await this.teamService.getAllusers(query);
    }
    async getAssigned(query) {
        return await this.teamService.getAssignees(query);
    }
    async getRoles() {
        return await this.teamService.getRoles();
    }
    async getCaseCombo(query) {
        return await this.teamService.getCaseCombo(query);
    }
    async getTimeZone() {
        return await this.teamService.getTimeZone();
    }
    async getUserDetail(query) {
        return await this.teamService.getUserDetail(query);
    }
    async getTeamcolor(query) {
        return await this.teamService.getTeamcolor(query);
    }
    async getCheckEmail(query) {
        return await this.teamService.getCheckEmail(query);
    }
};
exports.TeamDataController = TeamDataController;
__decorate([
    (0, common_1.Get)('teamlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(47),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof team_interface_1.CaseTeamReq !== "undefined" && team_interface_1.CaseTeamReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], TeamDataController.prototype, "getTeams", null);
__decorate([
    (0, common_1.Get)('userlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof team_interface_1.CaseUserReq !== "undefined" && team_interface_1.CaseUserReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], TeamDataController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('assignedusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof team_interface_1.assignedUsersReq !== "undefined" && team_interface_1.assignedUsersReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TeamDataController.prototype, "getAssigned", null);
__decorate([
    (0, common_1.Get)('rolelist'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], TeamDataController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Get)('teamcombo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof team_interface_1.CaseTeamReq !== "undefined" && team_interface_1.CaseTeamReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], TeamDataController.prototype, "getCaseCombo", null);
__decorate([
    (0, common_1.Get)('timezone'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TeamDataController.prototype, "getTimeZone", null);
__decorate([
    (0, common_1.Get)('getuserdetail'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(52),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof team_interface_1.CaseUserInfoReq !== "undefined" && team_interface_1.CaseUserInfoReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TeamDataController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Get)('teamcolor'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof team_interface_1.TeamColorReq !== "undefined" && team_interface_1.TeamColorReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], TeamDataController.prototype, "getTeamcolor", null);
__decorate([
    (0, common_1.Get)('checkemail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof team_interface_1.checkEmailReq !== "undefined" && team_interface_1.checkEmailReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], TeamDataController.prototype, "getCheckEmail", null);
exports.TeamDataController = TeamDataController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('team-data'),
    (0, common_1.Controller)('team-data'),
    __metadata("design:paramtypes", [typeof (_a = typeof team_data_service_1.TeamDataService !== "undefined" && team_data_service_1.TeamDataService) === "function" ? _a : Object])
], TeamDataController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamColorReq = exports.assignedUsersRes = exports.checkEmailReq = exports.assignedUsersReq = exports.UserListRes = exports.RoleListRes = exports.TeamComboRes = exports.TimeZoneRes = exports.CaseUserInfoRes = exports.CaseUserInfoReq = exports.teamListResonce = exports.CaseUserReq = exports.CaseTeamReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class CaseTeamReq {
}
exports.CaseTeamReq = CaseTeamReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseTeamReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseTeamReq.prototype, "nMasterid", void 0);
class CaseUserReq {
}
exports.CaseUserReq = CaseUserReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseUserReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page No' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], CaseUserReq.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseUserReq.prototype, "nTeamid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Last name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseUserReq.prototype, "cLname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Search', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseUserReq.prototype, "searchText", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseUserReq.prototype, "nMasterid", void 0);
class teamListResonce {
}
exports.teamListResonce = teamListResonce;
class CaseUserInfoReq {
}
exports.CaseUserInfoReq = CaseUserInfoReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CaseUserInfoReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Userid ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseUserInfoReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseUserInfoReq.prototype, "nMasterid", void 0);
class CaseUserInfoRes {
}
exports.CaseUserInfoRes = CaseUserInfoRes;
class TimeZoneRes {
}
exports.TimeZoneRes = TimeZoneRes;
class TeamComboRes {
}
exports.TeamComboRes = TeamComboRes;
class RoleListRes {
}
exports.RoleListRes = RoleListRes;
class UserListRes {
}
exports.UserListRes = UserListRes;
class assignedUsersReq {
}
exports.assignedUsersReq = assignedUsersReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignedUsersReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignedUsersReq.prototype, "nMasterid", void 0);
class checkEmailReq {
}
exports.checkEmailReq = checkEmailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'cEmail' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkEmailReq.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkEmailReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkEmailReq.prototype, "nMasterid", void 0);
class assignedUsersRes {
}
exports.assignedUsersRes = assignedUsersRes;
class TeamColorReq {
}
exports.TeamColorReq = TeamColorReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamColorReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamColorReq.prototype, "nMasterid", void 0);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TeamDataService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let TeamDataService = class TeamDataService {
    constructor(db) {
        this.db = db;
    }
    async getCaseTeams(query) {
        let res = await this.db.executeRef('teams', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getAllusers(query) {
        let res = await this.db.executeRef('allusers', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getAssignees(query) {
        let res = await this.db.executeRef('admin_case_assignedusers', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getRoles() {
        let res = await this.db.executeRef('rolelist', {});
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getCaseCombo(query) {
        let res = await this.db.executeRef('combo_teams', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getTimeZone() {
        let res = await this.db.executeRef('timezonelist', {});
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUserDetail(query) {
        let res = await this.db.executeRef('case_user_info', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getTeamcolor(query) {
        let res = await this.db.executeRef('teamcolors', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getCheckEmail(query) {
        let res = await this.db.executeRef('checkemail', query);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.TeamDataService = TeamDataService;
exports.TeamDataService = TeamDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], TeamDataService);


/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BundleCreationModule = void 0;
const common_1 = __webpack_require__(3);
const bundle_creation_controller_1 = __webpack_require__(52);
const bundle_creation_service_1 = __webpack_require__(53);
const shared_module_1 = __webpack_require__(25);
const jwt_middleware_1 = __webpack_require__(33);
const bundles_controller_1 = __webpack_require__(63);
const assign_controller_1 = __webpack_require__(65);
const assign_service_1 = __webpack_require__(66);
const export_controller_1 = __webpack_require__(68);
const export_service_1 = __webpack_require__(70);
const bull_1 = __webpack_require__(55);
const config_1 = __webpack_require__(13);
const delete_file_processor_1 = __webpack_require__(71);
const log_service_1 = __webpack_require__(56);
const winston_module_1 = __webpack_require__(75);
const redis_cache_service_1 = __webpack_require__(62);
const copy_file_processor_1 = __webpack_require__(76);
let BundleCreationModule = class BundleCreationModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(bundles_controller_1.BundlesController, bundle_creation_controller_1.BundleCreationController, assign_controller_1.AssignController, export_controller_1.ExportController);
    }
};
exports.BundleCreationModule = BundleCreationModule;
exports.BundleCreationModule = BundleCreationModule = __decorate([
    (0, common_1.Module)({
        imports: [
            shared_module_1.SharedModule,
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    redis: {
                        port: Number(config.get('REDIS_PORT')),
                        host: config.get('REDIS_IP'),
                        password: config.get('REDIS_PASSWORD'),
                        dir: config.get('REDIS_DB_DIR'),
                        dbfilename: config.get('REDIS_DB_FILE'),
                        appendonly: 'yes',
                        appendfilename: 'custom-appendonly.aof',
                        appendfsync: 'everysec',
                    },
                }),
            }),
            bull_1.BullModule.registerQueue({
                name: 'delete-files',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }), bull_1.BullModule.registerQueue({
                name: 'copy-files',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: false,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }),
            winston_module_1.WinstonConfigModule.forRoot('coreapi')
        ],
        controllers: [bundles_controller_1.BundlesController, bundle_creation_controller_1.BundleCreationController, assign_controller_1.AssignController, export_controller_1.ExportController],
        providers: [bundle_creation_service_1.BundleCreationService, assign_service_1.AssignService, export_service_1.ExportService, delete_file_processor_1.deleteFilesProcessor, copy_file_processor_1.copyFilesProcessor, log_service_1.LogService, redis_cache_service_1.RedisCacheService]
    })
], BundleCreationModule);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BundleCreationController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const bundle_creation_service_1 = __webpack_require__(53);
const bundle_management_1 = __webpack_require__(60);
const bundle_interface_1 = __webpack_require__(61);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
const redis_cache_service_1 = __webpack_require__(62);
let BundleCreationController = class BundleCreationController {
    constructor(bundleService, RCService) {
        this.bundleService = bundleService;
        this.RCService = RCService;
    }
    async sectionBuilder(body) {
        return await this.bundleService.sectionBuilder(body);
    }
    async bundleBuilder(body) {
        const res = await this.bundleService.bundleBuilder(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async renameFile(body) {
        const res = await this.bundleService.fileRename(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async setPermission(body) {
        const res = await this.bundleService.setPermission(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async deleteBundles(body) {
        const res = await this.bundleService.deleteBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async copyBundles(body) {
        const res = await this.bundleService.copyBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async cutBundles(body) {
        const res = await this.bundleService.cutBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async undoBundles(body) {
        const res = await this.bundleService.undoBundles(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async updateBundleDetail(body) {
        const data = await this.bundleService.updateBundleDetail(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return data;
    }
    async updateBundleTag(body) {
        const res = this.bundleService.updateBundleTag(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async updateFileTab(body) {
        const res = this.bundleService.updateFileTab(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async clearRecent(body) {
        return await this.bundleService.clearRecent(body);
    }
    async usersectionBuilder(body) {
        return await this.bundleService.userSectionBuilder(body);
    }
    async share_sectionbundle(body) {
        const res = await this.bundleService.share_sectionbundle(body);
        this.RCService.updateCache(body, ['bundledetail']);
        return res;
    }
    async insertRecent(body) {
        return await this.bundleService.insertRecent(body);
    }
};
exports.BundleCreationController = BundleCreationController;
__decorate([
    (0, common_1.Post)('sectionbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bundle_management_1.SectionBuildReq !== "undefined" && bundle_management_1.SectionBuildReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], BundleCreationController.prototype, "sectionBuilder", null);
__decorate([
    (0, common_1.Post)('bundlebuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof bundle_management_1.BundleBuildReq !== "undefined" && bundle_management_1.BundleBuildReq) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], BundleCreationController.prototype, "bundleBuilder", null);
__decorate([
    (0, common_1.Post)('renamefile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof bundle_management_1.FileRenameReq !== "undefined" && bundle_management_1.FileRenameReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], BundleCreationController.prototype, "renameFile", null);
__decorate([
    (0, common_1.Post)('setpermission'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(18),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof bundle_management_1.PermissionReq !== "undefined" && bundle_management_1.PermissionReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], BundleCreationController.prototype, "setPermission", null);
__decorate([
    (0, common_1.Post)('deletebundles'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof bundle_management_1.DeleteBundlesReq !== "undefined" && bundle_management_1.DeleteBundlesReq) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], BundleCreationController.prototype, "deleteBundles", null);
__decorate([
    (0, common_1.Post)('copybundles'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(31),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof bundle_management_1.PasteBundlesReq !== "undefined" && bundle_management_1.PasteBundlesReq) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], BundleCreationController.prototype, "copyBundles", null);
__decorate([
    (0, common_1.Post)('cutbundles'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(32),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof bundle_management_1.PasteBundlesReq !== "undefined" && bundle_management_1.PasteBundlesReq) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], BundleCreationController.prototype, "cutBundles", null);
__decorate([
    (0, common_1.Post)('undobundles'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(32),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof bundle_management_1.UndoBundlesReq !== "undefined" && bundle_management_1.UndoBundlesReq) === "function" ? _s : Object]),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], BundleCreationController.prototype, "undoBundles", null);
__decorate([
    (0, common_1.Post)('updatebundledetail'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_u = typeof bundle_management_1.updateBundleDetailReq !== "undefined" && bundle_management_1.updateBundleDetailReq) === "function" ? _u : Object]),
    __metadata("design:returntype", typeof (_v = typeof Promise !== "undefined" && Promise) === "function" ? _v : Object)
], BundleCreationController.prototype, "updateBundleDetail", null);
__decorate([
    (0, common_1.Post)('updatetag'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_w = typeof bundle_management_1.updateBundleReq !== "undefined" && bundle_management_1.updateBundleReq) === "function" ? _w : Object]),
    __metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], BundleCreationController.prototype, "updateBundleTag", null);
__decorate([
    (0, common_1.Post)('updatetab'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_y = typeof bundle_management_1.updateTabReq !== "undefined" && bundle_management_1.updateTabReq) === "function" ? _y : Object]),
    __metadata("design:returntype", typeof (_z = typeof Promise !== "undefined" && Promise) === "function" ? _z : Object)
], BundleCreationController.prototype, "updateFileTab", null);
__decorate([
    (0, common_1.Post)('clearrecent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_0 = typeof bundle_interface_1.deleteRecentReq !== "undefined" && bundle_interface_1.deleteRecentReq) === "function" ? _0 : Object]),
    __metadata("design:returntype", typeof (_1 = typeof Promise !== "undefined" && Promise) === "function" ? _1 : Object)
], BundleCreationController.prototype, "clearRecent", null);
__decorate([
    (0, common_1.Post)('usersectionbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_2 = typeof bundle_management_1.UserSectionBuildReq !== "undefined" && bundle_management_1.UserSectionBuildReq) === "function" ? _2 : Object]),
    __metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], BundleCreationController.prototype, "usersectionBuilder", null);
__decorate([
    (0, common_1.Post)('sharesectionbundle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_4 = typeof bundle_interface_1.shareSectionbundleReq !== "undefined" && bundle_interface_1.shareSectionbundleReq) === "function" ? _4 : Object]),
    __metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], BundleCreationController.prototype, "share_sectionbundle", null);
__decorate([
    (0, common_1.Post)('insert/recent'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_6 = typeof bundle_interface_1.insertRecentReq !== "undefined" && bundle_interface_1.insertRecentReq) === "function" ? _6 : Object]),
    __metadata("design:returntype", typeof (_7 = typeof Promise !== "undefined" && Promise) === "function" ? _7 : Object)
], BundleCreationController.prototype, "insertRecent", null);
exports.BundleCreationController = BundleCreationController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('bundles-creations'),
    (0, common_1.Controller)('bundles-creations'),
    __metadata("design:paramtypes", [typeof (_a = typeof bundle_creation_service_1.BundleCreationService !== "undefined" && bundle_creation_service_1.BundleCreationService) === "function" ? _a : Object, typeof (_b = typeof redis_cache_service_1.RedisCacheService !== "undefined" && redis_cache_service_1.RedisCacheService) === "function" ? _b : Object])
], BundleCreationController);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BundleCreationService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(54);
const bull_2 = __webpack_require__(55);
const log_service_1 = __webpack_require__(56);
const utility_service_1 = __webpack_require__(29);
let BundleCreationService = class BundleCreationService {
    constructor(db, deleteFileQueue, copyFileQueue, logService, utility) {
        this.db = db;
        this.deleteFileQueue = deleteFileQueue;
        this.copyFileQueue = copyFileQueue;
        this.logService = logService;
        this.utility = utility;
    }
    async getSections(body) {
        let res = await this.db.executeRef('admin_sections', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundle(body) {
        let res;
        if (body.jElasticBundles) {
            res = await this.db.executeRef('bundles', body, 'elastic');
        }
        else {
            res = await this.db.executeRef('bundles', body);
        }
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundledetail(body) {
        let res = await this.db.executeRef('bundledetail', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundleLinks(body) {
        let res = await this.db.executeRef('bundle_links', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSearchedBundles(body) {
        let res = await this.db.executeRef('admin_searched_bundles', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundledetailSearched(body) {
        let res = await this.db.executeRef('bundledetail_search', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getTeamsUsers(body) {
        let res = await this.db.executeRef('teams_users', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBunlesPermissions(body) {
        let res = await this.db.executeRef('bundles_permissions', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundleTypes(body) {
        let res = await this.db.executeRef('admin_bundles_filetypes', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getPaggination(body) {
        let res = await this.db.executeRef('admin_bundles_pagination_data', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sectionBuilder(body) {
        let res = await this.db.executeRef('sectionbuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async bundleBuilder(body) {
        let res = await this.db.executeRef('bundlebuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async fileRename(body) {
        let res = await this.db.executeRef('rename_bundledetail', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async setPermission(body) {
        let res = await this.db.executeRef('update_bundles_permisssoins', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async deleteBundles(body) {
        debugger;
        let res = await this.db.executeRef('delete_bundles', body);
        if (res.success) {
            const files = res.data[0][0]["jDelfiles"] || [];
            this.sendNotification(body.nMasterid, body.nCaseid, true, 0);
            if (files.length) {
                await this.deleteFileQueue.add({ jFiles: files }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async copyBundles(body) {
        let res = await this.db.executeRef('copy_bundles', body);
        if (res.success) {
            console.log('Background task completed successfully');
            try {
                const files = res.data[0][0]["jCopyFiles"] || [];
                if (files.length) {
                    this.copyFileQueue.add({ jFiles: files }, { removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 }).then(e => {
                        console.log('copy added successfully');
                    }).catch((e) => {
                        console.error('error copy file', e);
                    });
                }
                else {
                    console.log('No files to copy');
                }
            }
            catch (error) {
                console.error('error copy file 2 ', error);
            }
            return { msg: 1, value: 'File paste is processing', data: res.data[0][0] };
        }
        else {
            console.error('Background task failed', res.error);
            return { msg: -1, value: 'File paste is failed' };
        }
        ;
    }
    async cutBundles(body) {
        let res = await this.db.executeRef('cut_bundles', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to paste', error: res.error };
        }
    }
    async undoBundles(body) {
        let res = await this.db.executeRef('undo_bundles', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to paste', error: res.error };
        }
    }
    async updateBundleDetail(body) {
        let res = await this.db.executeRef('admin_update_bundledetail', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async updateBundleTag(body) {
        let res = await this.db.executeRef('admin_update_bundle_tag', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async updateFileTab(body) {
        let res = await this.db.executeRef('admin_update_bundle_tab', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
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
    async getRecentFile(body) {
        let res = await this.db.executeRef('recent_files', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async clearRecent(body) {
        let res = await this.db.executeRef('clearrecent', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getBundletag(body) {
        let res = await this.db.executeRef('navigate_bundletags', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundletab(body) {
        let res = await this.db.executeRef('navigate_bundletabs', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUserSections(body) {
        body["ref"] = 2;
        let res = await this.db.executeRef('user_sections', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUploadSections(body) {
        body["ref"] = 2;
        let res = await this.db.executeRef('upload_sections', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async userSectionBuilder(body) {
        let res = await this.db.executeRef('user_sectionbuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async checkissuetag(body) {
        let res = await this.db.executeRef('bundle_is_issuetag', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getdisplaycontact(body) {
        let res = await this.db.executeRef('displaycontact', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getdisplaytags(body) {
        let res = await this.db.executeRef('displaytag', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getdisplayissue(body) {
        let res = await this.db.executeRef('displayissue', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getdisplayfiles(body) {
        let res = await this.db.executeRef('displayfiles', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getfilelinks(body) {
        body["ref"] = 2;
        let res = await this.db.executeRef('get_bundle_links', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getBundleparentIds(body) {
        let res = await this.db.executeRef('bundle_parentids', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async sendNotification(nMasterid, nCaseid, status, nBundledetailid) {
        if (!nCaseid)
            return;
        this.logService.info(`Notification send for ${nCaseid}`, `coreapi/notification`);
        try {
            const users = await this.getUploadUser(nCaseid);
            if (users?.length) {
                users.forEach(a => {
                    a.cTitle = `File/folder deleted ${status ? 'successful' : 'failed'} `;
                    a.cMsg = `File/folder deleted ${status ? 'successful' : 'failed'} | Case no. ${a.cCaseno}`;
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
    async getSharesUsers(body) {
        let res = await this.db.executeRef('location_shared_user_from', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async share_sectionbundle(body) {
        let res = await this.db.executeRef('share_sectionbundle', body);
        if (res.success) {
            try {
                let users = res.data[0];
                if (users?.length) {
                    users.forEach(a => {
                        let data = {
                            nUserid: res.data[0][0]['nUserid'], nCaseid: res.data[0][0]['nCaseid'], cTitle: res.data[0][0]['cTitle'], cToken: res.data[0][0]['cToken'], cMsg: res.data[0][0]['cMsg'],
                            nRefuserid: body.nMasterid, cType: 'CS'
                        };
                        this.utility.emit(data, `notification`);
                    });
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
    async getBundleSharesUsers(body) {
        let res = await this.db.executeRef('share_get_bundleusers', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async getSharesUsers_by_bundle(body) {
        let res = await this.db.executeRef('share_users_by_bid', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async getBundleShares(body) {
        let res = await this.db.executeRef('share_get_bundles', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async get_fileids(body) {
        let res = await this.db.executeRef('get_fileids', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async get_filetypes(body) {
        let res = await this.db.executeRef('get_filetypes', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async downloadS_files(body) {
        let res = await this.db.executeRef('download_selected_files', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async downloadChangeSerial(body) {
        let res = await this.db.executeRef('download_update_serial', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1 };
        }
    }
    async insertRecent(body) {
        let res = await this.db.executeRef('insert_recent_file', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
};
exports.BundleCreationService = BundleCreationService;
exports.BundleCreationService = BundleCreationService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_2.InjectQueue)('delete-files')),
    __param(2, (0, bull_2.InjectQueue)('copy-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _b : Object, typeof (_c = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _e : Object])
], BundleCreationService);


/***/ }),
/* 54 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 55 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

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
const fs = __webpack_require__(15);
const path = __webpack_require__(16);
const moment = __webpack_require__(59);
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

module.exports = require("moment-timezone");

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.downloadSFileRes = exports.downloadChangeSerialReq = exports.downloadSFileReq = exports.UserSectionBuildReq = exports.updateBundleRes = exports.updateTabReq = exports.updateBundleReq = exports.updateBundleDetailRes = exports.updateBundleDetailReq = exports.UndoBundlesRes = exports.PasteBundlesRes = exports.DeleteBundlesRes = exports.UndoBundlesReq = exports.PasteBundlesReq = exports.DeleteBundlesReq = exports.PermissionRes = exports.PermissionReq = exports.FileRenameRes = exports.FileRenameReq = exports.BundleBuildRes = exports.BundleBuildReq = exports.SectionBuildRes = exports.SectionBuildReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
class SectionBuildReq {
}
exports.SectionBuildReq = SectionBuildReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Folder Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "cFolder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Folder type', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "cFoldertype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SectionBuildReq.prototype, "nMasterid", void 0);
class SectionBuildRes {
}
exports.SectionBuildRes = SectionBuildRes;
class BundleBuildReq {
}
exports.BundleBuildReq = BundleBuildReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "cBundlename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Pparent Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "nParentBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleBuildReq.prototype, "nMasterid", void 0);
class BundleBuildRes {
}
exports.BundleBuildRes = BundleBuildRes;
class FileRenameReq {
}
exports.FileRenameReq = FileRenameReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'File Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileRenameReq.prototype, "nMasterid", void 0);
class FileRenameRes {
}
exports.FileRenameRes = FileRenameRes;
class PermissionReq {
}
exports.PermissionReq = PermissionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle Detail id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Team id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nTeamid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Bundle id', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PermissionReq.prototype, "bPermit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PermissionReq.prototype, "nMasterid", void 0);
class PermissionRes {
}
exports.PermissionRes = PermissionRes;
class DeleteBundlesReq {
}
exports.DeleteBundlesReq = DeleteBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteBundlesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteBundlesReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeleteBundlesReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DeleteBundlesReq.prototype, "nMasterid", void 0);
class PasteBundlesReq {
}
exports.PasteBundlesReq = PasteBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cut/Copy', description: 'type Cut/Copy must be a number string conforming to the specified constraints', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], PasteBundlesReq.prototype, "nMasterid", void 0);
class UndoBundlesReq {
}
exports.UndoBundlesReq = UndoBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}/[[1,2],[2,3]]', description: 'Bundle ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UndoBundlesReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}/[[1,2],[2,3]]', description: 'Bundle detail ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], UndoBundlesReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Cut/Copy', description: 'type Cut/Copy must be a number string conforming to the specified constraints', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UndoBundlesReq.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UndoBundlesReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UndoBundlesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UndoBundlesReq.prototype, "nMasterid", void 0);
class DeleteBundlesRes {
}
exports.DeleteBundlesRes = DeleteBundlesRes;
class PasteBundlesRes {
}
exports.PasteBundlesRes = PasteBundlesRes;
class UndoBundlesRes {
}
exports.UndoBundlesRes = UndoBundlesRes;
class updateBundleDetailReq {
}
exports.updateBundleDetailReq = updateBundleDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Exhibit no', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "cExhibitno", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'File name', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Description', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "cDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Interest date', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "dIntrestDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Tab date', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "cTab", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Author', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "cAuthor", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleDetailReq.prototype, "nMasterid", void 0);
class updateBundleDetailRes {
}
exports.updateBundleDetailRes = updateBundleDetailRes;
class updateBundleReq {
}
exports.updateBundleReq = updateBundleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle tag', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], updateBundleReq.prototype, "cBundletag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Bundle tag', required: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], updateBundleReq.prototype, "bisAutoassign", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleReq.prototype, "nMasterid", void 0);
class updateTabReq {
}
exports.updateTabReq = updateTabReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "cTab", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Bundle tag', required: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], updateTabReq.prototype, "bisAutoassign", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'bundles', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "bundle", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateTabReq.prototype, "nMasterid", void 0);
class updateBundleRes {
}
exports.updateBundleRes = updateBundleRes;
class UserSectionBuildReq {
}
exports.UserSectionBuildReq = UserSectionBuildReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Folder Name', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "cFolder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Folder Type', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "cFoldertype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserSectionBuildReq.prototype, "nMasterid", void 0);
class downloadSFileReq {
}
exports.downloadSFileReq = downloadSFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nDTaskid must be a string conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "nDTaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadSFileReq.prototype, "nMasterid", void 0);
class downloadChangeSerialReq {
}
exports.downloadChangeSerialReq = downloadChangeSerialReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadChangeSerialReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadChangeSerialReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], downloadChangeSerialReq.prototype, "nNIndex", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nDTaskid must be a number conforming to the specified constraints', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], downloadChangeSerialReq.prototype, "nDTaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadChangeSerialReq.prototype, "nMasterid", void 0);
class downloadSFileRes {
}
exports.downloadSFileRes = downloadSFileRes;


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.insertRecentRes = exports.insertRecentReq = exports.getFiletypes = exports.getFileids = exports.shareUserbundleReq = exports.getbundleSharedReq = exports.shareSectionbundleReq = exports.BundleUploadReq = exports.FileLinkReq = exports.BundleLinksReq = exports.displayFilesReq = exports.displayReq = exports.checkIssuetagReq = exports.BundletabRes = exports.BundletabReq = exports.BundletagRes = exports.BundletagReq = exports.deleteRecentRes = exports.deleteRecentReq = exports.recentFileRes = exports.recentFileReq = exports.filedataRes = exports.filedataReq = exports.pagginationRes = exports.pagginationReq = exports.bundleTypesRes = exports.bundleTypesReq = exports.BundlesPermissionRes = exports.BundlesPermissionReq = exports.TeamUsersRes = exports.TeamUsersReq = exports.BundleLinksRes = exports.BundleDetailRes = exports.BundleDetailReq = exports.BundleRes = exports.BundleReq = exports.SectionRes = exports.SectionReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
class SectionReq {
}
exports.SectionReq = SectionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SectionReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SectionReq.prototype, "nMasterid", void 0);
class SectionRes {
}
exports.SectionRes = SectionRes;
class BundleReq {
}
exports.BundleReq = BundleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundleid Number', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], BundleReq.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleReq.prototype, "jElasticBundles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleReq.prototype, "nMasterid", void 0);
class BundleRes {
}
exports.BundleRes = BundleRes;
class BundleDetailReq {
}
exports.BundleDetailReq = BundleDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], BundleDetailReq.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "cFiletype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "searchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "nStarttabid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "nEndtabid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "jFTypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleDetailReq.prototype, "nMasterid", void 0);
class BundleDetailRes {
}
exports.BundleDetailRes = BundleDetailRes;
class BundleLinksRes {
}
exports.BundleLinksRes = BundleLinksRes;
class TeamUsersReq {
}
exports.TeamUsersReq = TeamUsersReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamUsersReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TeamUsersReq.prototype, "nMasterid", void 0);
class TeamUsersRes {
}
exports.TeamUsersRes = TeamUsersRes;
class BundlesPermissionReq {
}
exports.BundlesPermissionReq = BundlesPermissionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundlesPermissionReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundlesPermissionReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundlesPermissionReq.prototype, "nMasterid", void 0);
class BundlesPermissionRes {
}
exports.BundlesPermissionRes = BundlesPermissionRes;
class bundleTypesReq {
}
exports.bundleTypesReq = bundleTypesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "searchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "cFiletype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nStarttabid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nEndtabid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleTypesReq.prototype, "nMasterid", void 0);
class bundleTypesRes {
}
exports.bundleTypesRes = bundleTypesRes;
class pagginationReq {
}
exports.pagginationReq = pagginationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], pagginationReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], pagginationReq.prototype, "nMasterid", void 0);
class pagginationRes {
}
exports.pagginationRes = pagginationRes;
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
    (0, swagger_1.ApiProperty)({ example: 'M', description: 'cType', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], filedataReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nCaseid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filedataReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filedataReq.prototype, "nMasterid", void 0);
class filedataRes {
}
exports.filedataRes = filedataRes;
class recentFileReq {
}
exports.recentFileReq = recentFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFileReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'M', description: 'cType', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], recentFileReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFileReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], recentFileReq.prototype, "nMasterid", void 0);
class recentFileRes {
}
exports.recentFileRes = recentFileRes;
class deleteRecentReq {
}
exports.deleteRecentReq = deleteRecentReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteRecentReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'M', description: 'cType', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], deleteRecentReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteRecentReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteRecentReq.prototype, "nMasterid", void 0);
class deleteRecentRes {
}
exports.deleteRecentRes = deleteRecentRes;
class BundletagReq {
}
exports.BundletagReq = BundletagReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundletagReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundletagReq.prototype, "nMasterid", void 0);
class BundletagRes {
}
exports.BundletagRes = BundletagRes;
class BundletabReq {
}
exports.BundletabReq = BundletabReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundletabReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundleid id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundletabReq.prototype, "nBundleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundletabReq.prototype, "nMasterid", void 0);
class BundletabRes {
}
exports.BundletabRes = BundletabRes;
class checkIssuetagReq {
}
exports.checkIssuetagReq = checkIssuetagReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkIssuetagReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], checkIssuetagReq.prototype, "nBundleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkIssuetagReq.prototype, "nMasterid", void 0);
class displayReq {
}
exports.displayReq = displayReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], displayReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], displayReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], displayReq.prototype, "nBundleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], displayReq.prototype, "nMasterid", void 0);
class displayFilesReq {
}
exports.displayFilesReq = displayFilesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Contact id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Issue id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "nIssueid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Tag id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "nTagid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'jFilters', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], displayFilesReq.prototype, "nMasterid", void 0);
class BundleLinksReq {
}
exports.BundleLinksReq = BundleLinksReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleLinksReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleLinksReq.prototype, "nBundleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleLinksReq.prototype, "nMasterid", void 0);
class FileLinkReq {
}
exports.FileLinkReq = FileLinkReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileLinkReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'FL', description: 'FL', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FileLinkReq.prototype, "cFlag", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileLinkReq.prototype, "nMasterid", void 0);
class BundleUploadReq {
}
exports.BundleUploadReq = BundleUploadReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleUploadReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleUploadReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'UPid id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleUploadReq.prototype, "nUPid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], BundleUploadReq.prototype, "nMasterid", void 0);
class shareSectionbundleReq {
}
exports.shareSectionbundleReq = shareSectionbundleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareSectionbundleReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], shareSectionbundleReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], shareSectionbundleReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Is annotation', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], shareSectionbundleReq.prototype, "bIsannotation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Is Notification', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], shareSectionbundleReq.prototype, "bIsalert", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Share user ids', required: false }),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], shareSectionbundleReq.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Share ids', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], shareSectionbundleReq.prototype, "jShareids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareSectionbundleReq.prototype, "nMasterid", void 0);
class getbundleSharedReq {
}
exports.getbundleSharedReq = getbundleSharedReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSectionid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getbundleSharedReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSectionid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getbundleSharedReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getbundleSharedReq.prototype, "nMasterid", void 0);
class shareUserbundleReq {
}
exports.shareUserbundleReq = shareUserbundleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareUserbundleReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], shareUserbundleReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], shareUserbundleReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareUserbundleReq.prototype, "nMasterid", void 0);
class getFileids {
}
exports.getFileids = getFileids;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getFileids.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getFileids.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getFileids.prototype, "cFiletype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getFileids.prototype, "nMasterid", void 0);
class getFiletypes {
}
exports.getFiletypes = getFiletypes;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getFiletypes.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getFiletypes.prototype, "jBids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getFiletypes.prototype, "jBDids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], getFiletypes.prototype, "cFiletype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getFiletypes.prototype, "nMasterid", void 0);
class insertRecentReq {
}
exports.insertRecentReq = insertRecentReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle detail id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertRecentReq.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertRecentReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'M', description: 'cType', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], insertRecentReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertRecentReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], insertRecentReq.prototype, "nMasterid", void 0);
class insertRecentRes {
}
exports.insertRecentRes = insertRecentRes;


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisCacheService = void 0;
const redis_db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(10);
let RedisCacheService = class RedisCacheService {
    constructor(rds, db) {
        this.rds = rds;
        this.db = db;
        this.CACHE_DURATION = 3600;
    }
    generateBDKey(request, fun) {
        return `caseuser:${request.nMasterid}:section:${request.nSectionid}:request:${JSON.stringify({ fun: fun, request: request })}`;
    }
    generateUserSetKey(nMasterid) {
        return `caseuser:${nMasterid}:request`;
    }
    async setCache(fun, request, data, genKeyfn) {
        const bundleKey = this[genKeyfn](request, fun);
        const userSetKey = this.generateUserSetKey(request.nMasterid);
        try {
            await this.rds.setValueMulti(userSetKey, bundleKey, JSON.stringify(data));
        }
        catch (error) {
            console.error('Redis set error:', error);
            throw error;
        }
    }
    async getCache(fun, request, genKeyfn) {
        try {
            const key = this[genKeyfn](request, fun);
            const data = await this.rds.getValue(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error('Redis get error:', error);
            return null;
        }
    }
    parseKeyToParams(key) {
        const jsonString = key.substring(key.indexOf('{'));
        console.log('Extracted JSON:', jsonString);
        const parsedData = JSON.parse(jsonString);
        const params = {
            fun: parsedData.fun,
            params: parsedData.request,
        };
        return Promise.resolve(params);
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async updateCache(request, funs) {
        try {
            const pattern = `caseuser:*:*`;
            const keys = await this.rds.getKeys(pattern);
            const validKeys = funs.length ? keys.filter(e => funs.some(fun => e.includes(fun))) : keys;
            const userSetKeys = [...new Set(validKeys.map(key => {
                    const parts = key.split(':');
                    return this.generateUserSetKey(parseInt(parts[1]));
                }))];
            if (validKeys.length > 0) {
                await this.rds.deleteValueMulti(userSetKeys, keys);
                return;
                await this.rds.setValueMulti(validKeys, userSetKeys, []);
                await Promise.all(validKeys.map(async (key, index) => {
                    try {
                        await this.delay(index * 100);
                        const query = await this.parseKeyToParams(key);
                        let res = await this.db.executeRef(query.fun, query.params);
                        if (res.success) {
                            res = res.data[0];
                        }
                        else {
                            return { msg: -1, value: 'Failed to fetch', error: res.error };
                        }
                        const userSetKey = this.generateUserSetKey(query.params.nMasterid);
                        await this.rds.setValueMulti(userSetKey, key, JSON.stringify(res));
                    }
                    catch (error) {
                        console.error(`Error refreshing key ${key}:`, error);
                    }
                }));
            }
        }
        catch (error) {
            console.error('Redis update bundle cache error:', error);
        }
    }
};
exports.RedisCacheService = RedisCacheService;
exports.RedisCacheService = RedisCacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object])
], RedisCacheService);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BundlesController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const bundle_creation_service_1 = __webpack_require__(53);
const bundle_interface_1 = __webpack_require__(61);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
const individual_interface_1 = __webpack_require__(64);
const redis_cache_service_1 = __webpack_require__(62);
const bundle_management_1 = __webpack_require__(60);
let BundlesController = class BundlesController {
    constructor(bundleService, RCService) {
        this.bundleService = bundleService;
        this.RCService = RCService;
    }
    async getSections(query) {
        return await this.bundleService.getSections(query);
    }
    async getBundle(body) {
        return await this.bundleService.getBundle(body);
    }
    async getBundledetail(query) {
        const data = await this.bundleService.getBundledetail(query);
        return data;
    }
    async searchBundles(query) {
        return await this.bundleService.getSearchedBundles(query);
    }
    async getBundledetailSearched(query) {
        return await this.bundleService.getBundledetailSearched(query);
    }
    async getTeamUsers(query) {
        return await this.bundleService.getTeamsUsers(query);
    }
    async getBunlesPermissions(query) {
        return await this.bundleService.getBunlesPermissions(query);
    }
    async getBundleTypes(query) {
        return await this.bundleService.getBundleTypes(query);
    }
    async getPaggination(query) {
        return await this.bundleService.getPaggination(query);
    }
    async getFiledata(query) {
        return await this.bundleService.getFiledata(query);
    }
    async getrecentFile(query) {
        return await this.bundleService.getRecentFile(query);
    }
    async getBundletag(query) {
        return await this.bundleService.getBundletag(query);
    }
    async getBundletab(query) {
        return await this.bundleService.getBundletab(query);
    }
    async getUserSections(query) {
        return await this.bundleService.getUserSections(query);
    }
    async getUploadSections(query) {
        return await this.bundleService.getUploadSections(query);
    }
    async checkissuetag(query) {
        return await this.bundleService.checkissuetag(query);
    }
    async getdisplaycontact(query) {
        return await this.bundleService.getdisplaycontact(query);
    }
    async getdisplaytag(query) {
        return await this.bundleService.getdisplaytags(query);
    }
    async getdisplayissue(query) {
        return await this.bundleService.getdisplayissue(query);
    }
    async getdisplayfiles(query) {
        return await this.bundleService.getdisplayfiles(query);
    }
    async getBundlelinks(query) {
        return await this.bundleService.getBundleLinks(query);
    }
    async getfilelinks(query) {
        return await this.bundleService.getfilelinks(query);
    }
    async getBundleparentids(query) {
        return await this.bundleService.getBundleparentIds(query);
    }
    async getSharesUsers(query) {
        return await this.bundleService.getSharesUsers(query);
    }
    async getBundleSharesUsers(query) {
        return await this.bundleService.getBundleSharesUsers(query);
    }
    async getBundleShares(query) {
        return await this.bundleService.getBundleShares(query);
    }
    async getSharesUsers_by_bundle(query) {
        return await this.bundleService.getSharesUsers_by_bundle(query);
    }
    async get_fileids(query) {
        return await this.bundleService.get_fileids(query);
    }
    async get_filetypes(query) {
        return await this.bundleService.get_filetypes(query);
    }
    async downloadS_files(query) {
        return await this.bundleService.downloadS_files(query);
    }
    async downloadChangeSerial(query) {
        return await this.bundleService.downloadChangeSerial(query);
    }
};
exports.BundlesController = BundlesController;
__decorate([
    (0, common_1.Get)('sections'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(37),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bundle_interface_1.SectionReq !== "undefined" && bundle_interface_1.SectionReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], BundlesController.prototype, "getSections", null);
__decorate([
    (0, common_1.Post)('bundle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof bundle_interface_1.BundleReq !== "undefined" && bundle_interface_1.BundleReq) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], BundlesController.prototype, "getBundle", null);
__decorate([
    (0, common_1.Get)('bundledetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof bundle_interface_1.BundleDetailReq !== "undefined" && bundle_interface_1.BundleDetailReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], BundlesController.prototype, "getBundledetail", null);
__decorate([
    (0, common_1.Get)('searched-bundles'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof bundle_interface_1.bundleTypesReq !== "undefined" && bundle_interface_1.bundleTypesReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], BundlesController.prototype, "searchBundles", null);
__decorate([
    (0, common_1.Get)('bundledetail-search'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(38),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof bundle_interface_1.BundleDetailReq !== "undefined" && bundle_interface_1.BundleDetailReq) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], BundlesController.prototype, "getBundledetailSearched", null);
__decorate([
    (0, common_1.Get)('teamsusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(47),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof bundle_interface_1.TeamUsersReq !== "undefined" && bundle_interface_1.TeamUsersReq) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], BundlesController.prototype, "getTeamUsers", null);
__decorate([
    (0, common_1.Get)('bundlepermissions'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof bundle_interface_1.BundlesPermissionReq !== "undefined" && bundle_interface_1.BundlesPermissionReq) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], BundlesController.prototype, "getBunlesPermissions", null);
__decorate([
    (0, common_1.Get)('bundletypes'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof bundle_interface_1.bundleTypesReq !== "undefined" && bundle_interface_1.bundleTypesReq) === "function" ? _s : Object]),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], BundlesController.prototype, "getBundleTypes", null);
__decorate([
    (0, common_1.Get)('paginationdata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_u = typeof bundle_interface_1.pagginationReq !== "undefined" && bundle_interface_1.pagginationReq) === "function" ? _u : Object]),
    __metadata("design:returntype", typeof (_v = typeof Promise !== "undefined" && Promise) === "function" ? _v : Object)
], BundlesController.prototype, "getPaggination", null);
__decorate([
    (0, common_1.Get)('filedata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(21),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_w = typeof bundle_interface_1.filedataReq !== "undefined" && bundle_interface_1.filedataReq) === "function" ? _w : Object]),
    __metadata("design:returntype", typeof (_x = typeof Promise !== "undefined" && Promise) === "function" ? _x : Object)
], BundlesController.prototype, "getFiledata", null);
__decorate([
    (0, common_1.Get)('recentFile'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_y = typeof bundle_interface_1.recentFileReq !== "undefined" && bundle_interface_1.recentFileReq) === "function" ? _y : Object]),
    __metadata("design:returntype", typeof (_z = typeof Promise !== "undefined" && Promise) === "function" ? _z : Object)
], BundlesController.prototype, "getrecentFile", null);
__decorate([
    (0, common_1.Get)('bundletag'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_0 = typeof bundle_interface_1.BundletagReq !== "undefined" && bundle_interface_1.BundletagReq) === "function" ? _0 : Object]),
    __metadata("design:returntype", typeof (_1 = typeof Promise !== "undefined" && Promise) === "function" ? _1 : Object)
], BundlesController.prototype, "getBundletag", null);
__decorate([
    (0, common_1.Get)('bundletab'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_2 = typeof bundle_interface_1.BundletabReq !== "undefined" && bundle_interface_1.BundletabReq) === "function" ? _2 : Object]),
    __metadata("design:returntype", typeof (_3 = typeof Promise !== "undefined" && Promise) === "function" ? _3 : Object)
], BundlesController.prototype, "getBundletab", null);
__decorate([
    (0, common_1.Get)('usersections'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(37),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_4 = typeof bundle_interface_1.SectionReq !== "undefined" && bundle_interface_1.SectionReq) === "function" ? _4 : Object]),
    __metadata("design:returntype", typeof (_5 = typeof Promise !== "undefined" && Promise) === "function" ? _5 : Object)
], BundlesController.prototype, "getUserSections", null);
__decorate([
    (0, common_1.Get)('uploadsections'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(37),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_6 = typeof bundle_interface_1.SectionReq !== "undefined" && bundle_interface_1.SectionReq) === "function" ? _6 : Object]),
    __metadata("design:returntype", typeof (_7 = typeof Promise !== "undefined" && Promise) === "function" ? _7 : Object)
], BundlesController.prototype, "getUploadSections", null);
__decorate([
    (0, common_1.Get)('checkissuetag'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_8 = typeof bundle_interface_1.checkIssuetagReq !== "undefined" && bundle_interface_1.checkIssuetagReq) === "function" ? _8 : Object]),
    __metadata("design:returntype", typeof (_9 = typeof Promise !== "undefined" && Promise) === "function" ? _9 : Object)
], BundlesController.prototype, "checkissuetag", null);
__decorate([
    (0, common_1.Get)('getdisplaycontact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_10 = typeof bundle_interface_1.displayReq !== "undefined" && bundle_interface_1.displayReq) === "function" ? _10 : Object]),
    __metadata("design:returntype", typeof (_11 = typeof Promise !== "undefined" && Promise) === "function" ? _11 : Object)
], BundlesController.prototype, "getdisplaycontact", null);
__decorate([
    (0, common_1.Get)('getdisplaytag'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_12 = typeof bundle_interface_1.displayReq !== "undefined" && bundle_interface_1.displayReq) === "function" ? _12 : Object]),
    __metadata("design:returntype", typeof (_13 = typeof Promise !== "undefined" && Promise) === "function" ? _13 : Object)
], BundlesController.prototype, "getdisplaytag", null);
__decorate([
    (0, common_1.Get)('getdisplayissue'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_14 = typeof bundle_interface_1.displayReq !== "undefined" && bundle_interface_1.displayReq) === "function" ? _14 : Object]),
    __metadata("design:returntype", typeof (_15 = typeof Promise !== "undefined" && Promise) === "function" ? _15 : Object)
], BundlesController.prototype, "getdisplayissue", null);
__decorate([
    (0, common_1.Get)('getdisplayfiles'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_16 = typeof bundle_interface_1.displayFilesReq !== "undefined" && bundle_interface_1.displayFilesReq) === "function" ? _16 : Object]),
    __metadata("design:returntype", typeof (_17 = typeof Promise !== "undefined" && Promise) === "function" ? _17 : Object)
], BundlesController.prototype, "getdisplayfiles", null);
__decorate([
    (0, common_1.Get)('bundle_links'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_18 = typeof bundle_interface_1.BundleLinksReq !== "undefined" && bundle_interface_1.BundleLinksReq) === "function" ? _18 : Object]),
    __metadata("design:returntype", typeof (_19 = typeof Promise !== "undefined" && Promise) === "function" ? _19 : Object)
], BundlesController.prototype, "getBundlelinks", null);
__decorate([
    (0, common_1.Get)('file_links'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_20 = typeof bundle_interface_1.FileLinkReq !== "undefined" && bundle_interface_1.FileLinkReq) === "function" ? _20 : Object]),
    __metadata("design:returntype", typeof (_21 = typeof Promise !== "undefined" && Promise) === "function" ? _21 : Object)
], BundlesController.prototype, "getfilelinks", null);
__decorate([
    (0, common_1.Get)('getBundleparentids'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_22 = typeof bundle_interface_1.BundleUploadReq !== "undefined" && bundle_interface_1.BundleUploadReq) === "function" ? _22 : Object]),
    __metadata("design:returntype", typeof (_23 = typeof Promise !== "undefined" && Promise) === "function" ? _23 : Object)
], BundlesController.prototype, "getBundleparentids", null);
__decorate([
    (0, common_1.Get)('locationshare/users'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_24 = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _24 : Object]),
    __metadata("design:returntype", typeof (_25 = typeof Promise !== "undefined" && Promise) === "function" ? _25 : Object)
], BundlesController.prototype, "getSharesUsers", null);
__decorate([
    (0, common_1.Get)('getbundlesharedusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_26 = typeof bundle_interface_1.getbundleSharedReq !== "undefined" && bundle_interface_1.getbundleSharedReq) === "function" ? _26 : Object]),
    __metadata("design:returntype", typeof (_27 = typeof Promise !== "undefined" && Promise) === "function" ? _27 : Object)
], BundlesController.prototype, "getBundleSharesUsers", null);
__decorate([
    (0, common_1.Get)('getbundleshared'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_28 = typeof bundle_interface_1.getbundleSharedReq !== "undefined" && bundle_interface_1.getbundleSharedReq) === "function" ? _28 : Object]),
    __metadata("design:returntype", typeof (_29 = typeof Promise !== "undefined" && Promise) === "function" ? _29 : Object)
], BundlesController.prototype, "getBundleShares", null);
__decorate([
    (0, common_1.Get)('getshareduserby_bundleid'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_30 = typeof bundle_interface_1.shareUserbundleReq !== "undefined" && bundle_interface_1.shareUserbundleReq) === "function" ? _30 : Object]),
    __metadata("design:returntype", typeof (_31 = typeof Promise !== "undefined" && Promise) === "function" ? _31 : Object)
], BundlesController.prototype, "getSharesUsers_by_bundle", null);
__decorate([
    (0, common_1.Get)('get_fileids'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_32 = typeof bundle_interface_1.getFileids !== "undefined" && bundle_interface_1.getFileids) === "function" ? _32 : Object]),
    __metadata("design:returntype", typeof (_33 = typeof Promise !== "undefined" && Promise) === "function" ? _33 : Object)
], BundlesController.prototype, "get_fileids", null);
__decorate([
    (0, common_1.Get)('get_filetypes'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_34 = typeof bundle_interface_1.getFiletypes !== "undefined" && bundle_interface_1.getFiletypes) === "function" ? _34 : Object]),
    __metadata("design:returntype", typeof (_35 = typeof Promise !== "undefined" && Promise) === "function" ? _35 : Object)
], BundlesController.prototype, "get_filetypes", null);
__decorate([
    (0, common_1.Get)('download_selected_files'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_36 = typeof bundle_management_1.downloadSFileReq !== "undefined" && bundle_management_1.downloadSFileReq) === "function" ? _36 : Object]),
    __metadata("design:returntype", typeof (_37 = typeof Promise !== "undefined" && Promise) === "function" ? _37 : Object)
], BundlesController.prototype, "downloadS_files", null);
__decorate([
    (0, common_1.Get)('download_update_serial'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_38 = typeof bundle_management_1.downloadChangeSerialReq !== "undefined" && bundle_management_1.downloadChangeSerialReq) === "function" ? _38 : Object]),
    __metadata("design:returntype", typeof (_39 = typeof Promise !== "undefined" && Promise) === "function" ? _39 : Object)
], BundlesController.prototype, "downloadChangeSerial", null);
exports.BundlesController = BundlesController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('bundles'),
    (0, common_1.Controller)('bundles'),
    __metadata("design:paramtypes", [typeof (_a = typeof bundle_creation_service_1.BundleCreationService !== "undefined" && bundle_creation_service_1.BundleCreationService) === "function" ? _a : Object, typeof (_b = typeof redis_cache_service_1.RedisCacheService !== "undefined" && redis_cache_service_1.RedisCacheService) === "function" ? _b : Object])
], BundlesController);


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
exports.toolbarDataReq = exports.hyperlinkFileReq = exports.locationShareToUsers = exports.updateShareLink = exports.linkexplorerReq = exports.updateBundleDetailRotation = exports.DocinfoRes = exports.DocinfoReq = exports.getTabReq = exports.fetchTabDataReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class fetchTabDataReq {
}
exports.fetchTabDataReq = fetchTabDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[123, 142]', description: 'jFiles', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Array)
], fetchTabDataReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fetchTabDataReq.prototype, "nMasterid", void 0);
class getTabReq {
}
exports.getTabReq = getTabReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getTabReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'cFlag like P/N' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getTabReq.prototype, "cFlag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'cFlag like P/N' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], getTabReq.prototype, "jAvoid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], getTabReq.prototype, "nMasterid", void 0);
class DocinfoReq {
}
exports.DocinfoReq = DocinfoReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocinfoReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocinfoReq.prototype, "nMasterid", void 0);
class DocinfoRes {
}
exports.DocinfoRes = DocinfoRes;
class updateBundleDetailRotation {
}
exports.updateBundleDetailRotation = updateBundleDetailRotation;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleDetailRotation.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nRotate' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], updateBundleDetailRotation.prototype, "nRotate", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateBundleDetailRotation.prototype, "nMasterid", void 0);
class linkexplorerReq {
}
exports.linkexplorerReq = linkexplorerReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], linkexplorerReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], linkexplorerReq.prototype, "nMasterid", void 0);
class updateShareLink {
}
exports.updateShareLink = updateShareLink;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nId' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], updateShareLink.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nId' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateShareLink.prototype, "nId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'jUsers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateShareLink.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F/W/D', description: 'cType' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], updateShareLink.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], updateShareLink.prototype, "nMasterid", void 0);
class locationShareToUsers {
}
exports.locationShareToUsers = locationShareToUsers;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], locationShareToUsers.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'jUsers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], locationShareToUsers.prototype, "jUsers", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], locationShareToUsers.prototype, "nMasterid", void 0);
class hyperlinkFileReq {
}
exports.hyperlinkFileReq = hyperlinkFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkFileReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nDocid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkFileReq.prototype, "nDocid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], hyperlinkFileReq.prototype, "nMasterid", void 0);
class toolbarDataReq {
}
exports.toolbarDataReq = toolbarDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundledetailid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], toolbarDataReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], toolbarDataReq.prototype, "nMasterid", void 0);


/***/ }),
/* 65 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AssignController = void 0;
const common_1 = __webpack_require__(3);
const assign_service_1 = __webpack_require__(66);
const assign_interface_1 = __webpack_require__(67);
const swagger_1 = __webpack_require__(6);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let AssignController = class AssignController {
    constructor(assignService) {
        this.assignService = assignService;
    }
    async bundlesAssignment(body) {
        console.log("alok", body);
        return await this.assignService.bundlesAssignment(body);
    }
    async custombundlesAssignment(body) {
        return await this.assignService.custombundlesAssignment(body);
    }
    async bundlesUnAssignment(body) {
        return await this.assignService.bundlesUnAssignment(body);
    }
    async assignContact(body) {
        return await this.assignService.assignContact(body);
    }
    async assigntask(body) {
        return await this.assignService.assignTask(body);
    }
    async assigtag(body) {
        return await this.assignService.assignTag(body);
    }
    async unassigtag(body) {
        return await this.assignService.unassignTag(body);
    }
    async unassigtask(body) {
        return await this.assignService.unassignTask(body);
    }
    async unassigcontact(body) {
        return await this.assignService.unassignContact(body);
    }
    async viewCustombundle(query) {
        return await this.assignService.viewCustombundle(query);
    }
    async viewcontact(query) {
        return await this.assignService.viewcontact(query);
    }
    async viewTask(query) {
        return await this.assignService.viewtask(query);
    }
    async viewtag(query) {
        return await this.assignService.viewTag(query);
    }
    async checkCustomBundle(query) {
        return await this.assignService.checkCustomBundle(query);
    }
    async file_metadata(query) {
        return await this.assignService.file_metadata(query);
    }
};
exports.AssignController = AssignController;
__decorate([
    (0, common_1.Post)('bundlesassignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof assign_interface_1.AssignBundlesReq !== "undefined" && assign_interface_1.AssignBundlesReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AssignController.prototype, "bundlesAssignment", null);
__decorate([
    (0, common_1.Post)('custombundlesassignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof assign_interface_1.AssignCustomBundlesReq !== "undefined" && assign_interface_1.AssignCustomBundlesReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AssignController.prototype, "custombundlesAssignment", null);
__decorate([
    (0, common_1.Post)('bundlesunassignment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof assign_interface_1.AssignBundlesReq !== "undefined" && assign_interface_1.AssignBundlesReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], AssignController.prototype, "bundlesUnAssignment", null);
__decorate([
    (0, common_1.Post)('assignContact'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(59),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof assign_interface_1.assigncontactReq !== "undefined" && assign_interface_1.assigncontactReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], AssignController.prototype, "assignContact", null);
__decorate([
    (0, common_1.Post)('assigntask'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(84),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof assign_interface_1.assignTaskReq !== "undefined" && assign_interface_1.assignTaskReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], AssignController.prototype, "assigntask", null);
__decorate([
    (0, common_1.Post)('assigntag'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(64),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof assign_interface_1.assignTagReq !== "undefined" && assign_interface_1.assignTagReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], AssignController.prototype, "assigtag", null);
__decorate([
    (0, common_1.Post)('unassigntag'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(83),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof assign_interface_1.unassignTagReq !== "undefined" && assign_interface_1.unassignTagReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], AssignController.prototype, "unassigtag", null);
__decorate([
    (0, common_1.Post)('unassigntask'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(68),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof assign_interface_1.unassignTaskReq !== "undefined" && assign_interface_1.unassignTaskReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], AssignController.prototype, "unassigtask", null);
__decorate([
    (0, common_1.Post)('unassigncontact'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(82),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof assign_interface_1.unassignContactReq !== "undefined" && assign_interface_1.unassignContactReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], AssignController.prototype, "unassigcontact", null);
__decorate([
    (0, common_1.Get)('viewcustombundle'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof assign_interface_1.ViewBundlesReq !== "undefined" && assign_interface_1.ViewBundlesReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], AssignController.prototype, "viewCustombundle", null);
__decorate([
    (0, common_1.Get)('viewcontact'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof assign_interface_1.ViewContactReq !== "undefined" && assign_interface_1.ViewContactReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], AssignController.prototype, "viewcontact", null);
__decorate([
    (0, common_1.Get)('viewTask'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof assign_interface_1.ViewTaskReq !== "undefined" && assign_interface_1.ViewTaskReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], AssignController.prototype, "viewTask", null);
__decorate([
    (0, common_1.Get)('viewtag'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof assign_interface_1.ViewContactReq !== "undefined" && assign_interface_1.ViewContactReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], AssignController.prototype, "viewtag", null);
__decorate([
    (0, common_1.Get)('checkassignbundleexists'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof assign_interface_1.checkAssignBundleExistsReq !== "undefined" && assign_interface_1.checkAssignBundleExistsReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], AssignController.prototype, "checkCustomBundle", null);
__decorate([
    (0, common_1.Get)('file_metadata'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof assign_interface_1.FileMetadataReq !== "undefined" && assign_interface_1.FileMetadataReq) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], AssignController.prototype, "file_metadata", null);
exports.AssignController = AssignController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('assign'),
    (0, common_1.Controller)('assign'),
    __metadata("design:paramtypes", [typeof (_a = typeof assign_service_1.AssignService !== "undefined" && assign_service_1.AssignService) === "function" ? _a : Object])
], AssignController);


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
exports.AssignService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let AssignService = class AssignService {
    constructor(db) {
        this.db = db;
    }
    async bundlesAssignment(body) {
        let res = await this.db.executeRef('assign_bundles', body);
        if (res.success) {
            return { msg: 1, value: 'Assigned', data: res.data[0] };
        }
        else {
            return { msg: -1, value: 'File assign is failed' };
        }
        ;
    }
    async custombundlesAssignment(body) {
        let res = await this.db.executeRef('assign_custombundles', body);
        if (res.success) {
            return { msg: 1, value: 'Assigned', data: res.data[0] };
        }
        else {
            return { msg: -1, value: 'File assign is failed' };
        }
        ;
    }
    async bundlesUnAssignment(body) {
        let res = await this.db.executeRef('unassign_bundles', body);
        if (res.success) {
            return { msg: 1, value: 'Unassigned', data: res.data[0] };
        }
        else {
            return { msg: -1, value: 'File assign is failed' };
        }
        ;
    }
    async viewCustombundle(query) {
        let res = await this.db.executeRef('assign_custom_list', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Fatch failed' };
        }
        ;
    }
    async assignContact(body) {
        let res = await this.db.executeRef('assign_contact', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Assign failed' };
        }
        ;
    }
    async assignTask(body) {
        let res = await this.db.executeRef('assign_task', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Assign failed' };
        }
        ;
    }
    async unassignTag(body) {
        let res = await this.db.executeRef('unassign_tag', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Unassign failed' };
        }
        ;
    }
    async unassignTask(body) {
        let res = await this.db.executeRef('unassign_task', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Unassign failed' };
        }
        ;
    }
    async unassignContact(body) {
        let res = await this.db.executeRef('unassign_contact', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Unassign failed' };
        }
        ;
    }
    async assignTag(body) {
        let res = await this.db.executeRef('assign_tag', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Assign failed' };
        }
        ;
    }
    async viewcontact(query) {
        let res = await this.db.executeRef('assign_contact_list', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Fatch failed' };
        }
        ;
    }
    async viewtask(query) {
        let res = await this.db.executeRef('assign_task_list', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Fatch failed' };
        }
        ;
    }
    async viewTag(query) {
        let res = await this.db.executeRef('assign_tag_list', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Fatch failed' };
        }
        ;
    }
    async checkCustomBundle(body) {
        let res = await this.db.executeRef('assign_checkbundle_exists', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Unassign failed' };
        }
        ;
    }
    async file_metadata(query) {
        let res = await this.db.executeRef('get_file_metadata', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Fatch failed' };
        }
        ;
    }
};
exports.AssignService = AssignService;
exports.AssignService = AssignService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], AssignService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileMetadataReq = exports.checkAssignBundleExistsReq = exports.unassignContactReq = exports.unassignTaskReq = exports.unassignTagReq = exports.assignTagReq = exports.ViewTaskReq = exports.assignTaskReq = exports.ViewContactReq = exports.assigncontactReq = exports.viewBundlesRes = exports.ViewBundlesReq = exports.AssignBundlesRes = exports.AssignCustomBundlesReq = exports.AssignBundlesReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class AssignBundlesReq {
}
exports.AssignBundlesReq = AssignBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignBundlesReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignBundlesReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignBundlesReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignBundlesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignBundlesReq.prototype, "nMasterid", void 0);
class AssignCustomBundlesReq {
}
exports.AssignCustomBundlesReq = AssignCustomBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1,`1-2`],[2,`1-2`],[3,`1-2`]]', description: '', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignCustomBundlesReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignCustomBundlesReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignCustomBundlesReq.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AssignCustomBundlesReq.prototype, "nMasterid", void 0);
class AssignBundlesRes {
}
exports.AssignBundlesRes = AssignBundlesRes;
class ViewBundlesReq {
}
exports.ViewBundlesReq = ViewBundlesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ViewBundlesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViewBundlesReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ViewBundlesReq.prototype, "nMasterid", void 0);
class viewBundlesRes {
}
exports.viewBundlesRes = viewBundlesRes;
class assigncontactReq {
}
exports.assigncontactReq = assigncontactReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Contact id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assigncontactReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Files id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], assigncontactReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assigncontactReq.prototype, "nMasterid", void 0);
class ViewContactReq {
}
exports.ViewContactReq = ViewContactReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Bundle id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViewContactReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ViewContactReq.prototype, "nMasterid", void 0);
class assignTaskReq {
}
exports.assignTaskReq = assignTaskReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Task id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignTaskReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Files id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], assignTaskReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignTaskReq.prototype, "nMasterid", void 0);
class ViewTaskReq {
}
exports.ViewTaskReq = ViewTaskReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'Task type', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViewTaskReq.prototype, "cTasktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Bundle id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViewTaskReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ViewTaskReq.prototype, "nMasterid", void 0);
class assignTagReq {
}
exports.assignTagReq = assignTagReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Tag id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignTagReq.prototype, "nTagid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Files id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], assignTagReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], assignTagReq.prototype, "nMasterid", void 0);
class unassignTagReq {
}
exports.unassignTagReq = unassignTagReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Tag id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignTagReq.prototype, "nTagid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], unassignTagReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignTagReq.prototype, "nMasterid", void 0);
class unassignTaskReq {
}
exports.unassignTaskReq = unassignTaskReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Task id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignTaskReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], unassignTaskReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignTaskReq.prototype, "nMasterid", void 0);
class unassignContactReq {
}
exports.unassignContactReq = unassignContactReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Contact id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignContactReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], unassignContactReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], unassignContactReq.prototype, "nMasterid", void 0);
class checkAssignBundleExistsReq {
}
exports.checkAssignBundleExistsReq = checkAssignBundleExistsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Section id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkAssignBundleExistsReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Bundle id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkAssignBundleExistsReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkAssignBundleExistsReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkAssignBundleExistsReq.prototype, "nMasterid", void 0);
class FileMetadataReq {
}
exports.FileMetadataReq = FileMetadataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Bundle id', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FileMetadataReq.prototype, "jBDids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileMetadataReq.prototype, "nMasterid", void 0);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const export_interface_1 = __webpack_require__(69);
const export_service_1 = __webpack_require__(70);
let ExportController = class ExportController {
    constructor(exportFileService) {
        this.exportFileService = exportFileService;
    }
    async getFiledata(query) {
        return await this.exportFileService.getFiledata(query);
    }
    async getExportdata(query) {
        return await this.exportFileService.getExportdata(query);
    }
    async getclearAll(body) {
        return await this.exportFileService.getclearAll(body);
    }
    async delete(body) {
        return await this.exportFileService.delete(body);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('getfiledata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof export_interface_1.FileDataReq !== "undefined" && export_interface_1.FileDataReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ExportController.prototype, "getFiledata", null);
__decorate([
    (0, common_1.Get)('getexportdata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof export_interface_1.ExportDataReq !== "undefined" && export_interface_1.ExportDataReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ExportController.prototype, "getExportdata", null);
__decorate([
    (0, common_1.Post)('clearall'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof export_interface_1.ExportDataReq !== "undefined" && export_interface_1.ExportDataReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], ExportController.prototype, "getclearAll", null);
__decorate([
    (0, common_1.Post)('deleteexport'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof export_interface_1.ExportDeleteReq !== "undefined" && export_interface_1.ExportDeleteReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], ExportController.prototype, "delete", null);
exports.ExportController = ExportController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('export'),
    (0, common_1.Controller)('export'),
    __metadata("design:paramtypes", [typeof (_a = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _a : Object])
], ExportController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportDeleteReq = exports.ExportFilewithAnnot = exports.ExportResponse = exports.FileListResponce = exports.ExportDataReq = exports.ExportProcess = exports.FileDataReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class FileDataReq {
}
exports.FileDataReq = FileDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'Folder ids' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FileDataReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File ids' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], FileDataReq.prototype, "jFiles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FileDataReq.prototype, "nMasterid", void 0);
class ExportProcess {
}
exports.ExportProcess = ExportProcess;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportProcess.prototype, "nExportid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportProcess.prototype, "nMasterid", void 0);
class ExportDataReq {
}
exports.ExportDataReq = ExportDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportDataReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export detail id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportDataReq.prototype, "nEDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportDataReq.prototype, "nExportid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Sort by' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", typeof (_a = typeof String !== "undefined" && String) === "function" ? _a : Object)
], ExportDataReq.prototype, "cSortby", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportDataReq.prototype, "nMasterid", void 0);
class FileListResponce {
}
exports.FileListResponce = FileListResponce;
class ExportResponse {
}
exports.ExportResponse = ExportResponse;
class ExportFilewithAnnot {
}
exports.ExportFilewithAnnot = ExportFilewithAnnot;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'File type Single/Multiple' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cPdftype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is Pagination' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bPagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'is Doc link' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bDoc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is Fact Link' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bFact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is Quick fact' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bQfact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is Cover page' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bCoverpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is fit to page' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bFitpg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Doc link size Small/Normal/Large' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cDsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Fact link size Small/Normal/Large' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cFsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Quick Fact link size Small/Normal/Large' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cQFsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Orientation Auto/All portrait' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cOrientation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Page Size A4/A3/A2' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cPgsize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Transcript' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "cTranscript", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Fact Contact id`s' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jFContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Fact issue id`s' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jFIssue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Bundle detail id`s' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Pages' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Quick Fact Contact id`s' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jQFContact", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Quick Fact issue id`s' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], ExportFilewithAnnot.prototype, "jQFIssue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case Id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "nMasterid", void 0);
class ExportDeleteReq {
}
exports.ExportDeleteReq = ExportDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportDeleteReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export detail id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportDeleteReq.prototype, "nEDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ExportDeleteReq.prototype, "nExportid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Type' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Number)
], ExportDeleteReq.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportDeleteReq.prototype, "nMasterid", void 0);


/***/ }),
/* 70 */
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
exports.ExportService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let ExportService = class ExportService {
    constructor(db) {
        this.db = db;
    }
    async getFiledata(body) {
        try {
            const res = await this.db.executeRef('export_files', body);
            if (res.success) {
                return res.data[0];
            }
            throw new Error('Failed to fetch file data');
        }
        catch (error) {
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }
    async getExportdata(body) {
        try {
            const res = await this.db.executeRef('export_grid', body);
            if (res.success) {
                return res.data[0];
            }
            throw new Error('Failed to fetch export data');
        }
        catch (error) {
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }
    async getclearAll(body) {
        try {
            const res = await this.db.executeRef('export_clear_all_exports', body);
            if (res.success) {
                return res.data[0][0];
            }
            throw new Error('Failed to clear export data');
        }
        catch (error) {
            return [{ msg: -1, value: 'Failed to clear export data', error: error.message }];
        }
    }
    async delete(body) {
        try {
            const res = await this.db.executeRef('export_delete_file', body);
            if (res.success) {
                return res.data[0][0];
            }
            throw new Error('Failed to delete export data');
        }
        catch (error) {
            return [{ msg: -1, value: 'Failed to delete export data', error: error.message }];
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], ExportService);


/***/ }),
/* 71 */
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
exports.deleteFilesProcessor = void 0;
const bull_1 = __webpack_require__(55);
const config_1 = __webpack_require__(13);
const bull_2 = __webpack_require__(54);
const fs = __webpack_require__(72);
const log_service_1 = __webpack_require__(56);
const child_process_1 = __webpack_require__(73);
const util_1 = __webpack_require__(74);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let deleteFilesProcessor = class deleteFilesProcessor {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.assets = this.config.get('ASSETS');
        this.S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.config.get('S3_EXC_PATH');
        this.logApp = 'delete';
    }
    async handleDeleteFiles(job) {
        const { jFiles } = job.data;
        this.logger.info(`deleting files total : ${jFiles.length}`, this.logApp);
        for (const filePath of jFiles) {
            try {
                await fs.unlink(this.assets + filePath);
                this.logger.info(`Successfully deleted file: ${filePath}`, this.logApp);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.logger.info(`File not found, skipping deletion: ${filePath}`, this.logApp);
                }
                else {
                    this.logger.error(`Error deleting file: ${filePath}`, this.logApp);
                }
            }
            const s3FilePath = `${this.S3_BUCKET_PATH}${filePath}`;
            const command = `${this.S3_EXC_PATH} del ${s3FilePath}`;
            try {
                const { stdout, stderr } = await execAsync(command);
                if (stdout) {
                    this.logger.info(`S3 deletion stdout: ${stdout}`, this.logApp);
                }
                if (stderr) {
                    this.logger.warn(`S3 deletion stderr: ${stderr}`, this.logApp);
                }
                this.logger.info(`Successfully deleted S3 file: ${s3FilePath}`, this.logApp);
            }
            catch (error) {
                console.log(`Error deleting S3 file: ${command} - ${error?.message}`);
                this.logger.error(`Error deleting S3 file: ${filePath} - ${error?.message}`, this.logApp);
            }
        }
    }
};
exports.deleteFilesProcessor = deleteFilesProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], deleteFilesProcessor.prototype, "handleDeleteFiles", null);
exports.deleteFilesProcessor = deleteFilesProcessor = __decorate([
    (0, bull_1.Processor)('delete-files'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], deleteFilesProcessor);


/***/ }),
/* 72 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 73 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 74 */
/***/ ((module) => {

module.exports = require("util");

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
const nest_winston_1 = __webpack_require__(58);
const winston = __webpack_require__(57);
const fs = __webpack_require__(15);
const path = __webpack_require__(16);
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.copyFilesProcessor = void 0;
const bull_1 = __webpack_require__(55);
const config_1 = __webpack_require__(13);
const bull_2 = __webpack_require__(54);
const log_service_1 = __webpack_require__(56);
const child_process_1 = __webpack_require__(73);
const util_1 = __webpack_require__(74);
const db_service_1 = __webpack_require__(10);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let copyFilesProcessor = class copyFilesProcessor {
    constructor(config, logger, db) {
        this.config = config;
        this.logger = logger;
        this.db = db;
        this.assets = this.config.get('ASSETS');
        this.S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.config.get('S3_EXC_PATH');
        this.s3_SPACES_ENDPOINT = this.config.get('DO_SPACES_ENDPOINT');
        this.DO_SPACES_BUCKET_NAME = this.config.get('DO_SPACES_BUCKET_NAME');
        this.logApp = 'copyfile';
    }
    async handleCopyFiles(job) {
        const { jFiles } = job.data;
        this.logger.info(`Coping files total : ${jFiles.length}`, this.logApp);
        for (const item of jFiles) {
            const s3FilePath = `${this.S3_BUCKET_PATH}${item.cPath} ${this.S3_BUCKET_PATH}${item.cToPath}`;
            const command = `${this.S3_EXC_PATH} cp ${s3FilePath} `;
            try {
                const { stdout, stderr } = await execAsync(command);
                if (stdout) {
                    this.logger.info(`S3 copy stdout: ${stdout}`, this.logApp);
                }
                if (stderr) {
                    this.logger.warn(`S3 copy stderr: ${stderr}`, this.logApp);
                }
                this.updateFileVersion(item.nBundledetailid, item.cToPath);
                this.logger.info(`Successfully copy S3 file: ${s3FilePath}`, this.logApp);
            }
            catch (error) {
                console.log(`Error Coping S3 file: ${command} - ${error?.message}`);
                this.logger.error(`Error copy S3 file: ${item.cToPath} - ${error?.message}`, this.logApp);
            }
        }
    }
    async updateFileVersion(nBundledetailid, s3Path) {
        try {
            console.log('Fetching veriosn', s3Path, nBundledetailid);
            if (!nBundledetailid) {
                this.logger.error('nBundledetailid not found for update version', this.logApp);
                return;
            }
            const version = await this.getFirstVersion(s3Path);
            if (!version) {
                this.logger.error('nBundledetailid version not found', this.logApp);
                return;
            }
            let res = await this.db.executeRef('upload_update_fver', { cFVer: version, nBundledetailid });
            if (res.success) {
            }
            else {
                this.logger.error(res.error, this.logApp);
            }
        }
        catch (error) {
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
                this.logger.info(`First File Version ID: ${firstVersion.VersionId}`, this.logApp);
                return firstVersion.VersionId;
            }
            else {
                console.log("❌ No versions found.");
                this.logger.info(`No versions found for file: ${fileKey}`, this.logApp);
                return null;
            }
        }
        catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logger.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
        }
        return null;
    }
};
exports.copyFilesProcessor = copyFilesProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], copyFilesProcessor.prototype, "handleCopyFiles", null);
exports.copyFilesProcessor = copyFilesProcessor = __decorate([
    (0, bull_1.Processor)('copy-files'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _c : Object])
], copyFilesProcessor);


/***/ }),
/* 77 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const permission_controller_1 = __webpack_require__(78);
const permission_service_1 = __webpack_require__(79);
const jwt_middleware_1 = __webpack_require__(33);
let PermissionModule = class PermissionModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(permission_controller_1.PermissionController);
    }
};
exports.PermissionModule = PermissionModule;
exports.PermissionModule = PermissionModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [permission_controller_1.PermissionController],
        providers: [permission_service_1.PermissionService],
    })
], PermissionModule);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PermissionController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const permission_service_1 = __webpack_require__(79);
const permissions_interface_1 = __webpack_require__(80);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let PermissionController = class PermissionController {
    constructor(permissionService) {
        this.permissionService = permissionService;
    }
    async getRoles(query) {
        return await this.permissionService.getrolepermissionlist(query);
    }
    async deleteCase(body) {
        return await this.permissionService.updateStatus(body);
    }
    async getRolemoduels(query) {
        return await this.permissionService.getRoleModules(query);
    }
    async getUsermoduels(query) {
        return await this.permissionService.getUserModules(query);
    }
    async updateModule(body) {
        return await this.permissionService.updateModule(body);
    }
    async getUserpermission(query) {
        return await this.permissionService.getUserPermission(query);
    }
    async userStatusManage(body) {
        return await this.permissionService.updateUserStatus(body);
    }
    async updateUserQuota(body) {
        return await this.permissionService.updateUserQuota(body);
    }
    async getUserpermissionList(query) {
        return await this.permissionService.getUserpermissionList(query);
    }
    async resetPermission(body) {
        return await this.permissionService.resetPermission(body);
    }
    async getUserCasepermission(query) {
        return await this.permissionService.getUserCasepermission(query);
    }
};
exports.PermissionController = PermissionController;
__decorate([
    (0, common_1.Get)('rolepermission'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof permissions_interface_1.rolePermissionReq !== "undefined" && permissions_interface_1.rolePermissionReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], PermissionController.prototype, "getRoles", null);
__decorate([
    (0, common_1.Post)('rolestatus'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(56),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof permissions_interface_1.roleStatusReq !== "undefined" && permissions_interface_1.roleStatusReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], PermissionController.prototype, "deleteCase", null);
__decorate([
    (0, common_1.Get)('rolemodules'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof permissions_interface_1.roleModuleReq !== "undefined" && permissions_interface_1.roleModuleReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], PermissionController.prototype, "getRolemoduels", null);
__decorate([
    (0, common_1.Get)('usermodules'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof permissions_interface_1.userModuleReq !== "undefined" && permissions_interface_1.userModuleReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], PermissionController.prototype, "getUsermoduels", null);
__decorate([
    (0, common_1.Post)('updatemodule'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(55),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof permissions_interface_1.roleModuleUpdateReq !== "undefined" && permissions_interface_1.roleModuleUpdateReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], PermissionController.prototype, "updateModule", null);
__decorate([
    (0, common_1.Get)('userpermission'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof permissions_interface_1.userPermissionReq !== "undefined" && permissions_interface_1.userPermissionReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], PermissionController.prototype, "getUserpermission", null);
__decorate([
    (0, common_1.Post)('usermanage'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(41),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof permissions_interface_1.userStatusReq !== "undefined" && permissions_interface_1.userStatusReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], PermissionController.prototype, "userStatusManage", null);
__decorate([
    (0, common_1.Post)('updatequota'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof permissions_interface_1.userQuotaReq !== "undefined" && permissions_interface_1.userQuotaReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], PermissionController.prototype, "updateUserQuota", null);
__decorate([
    (0, common_1.Get)('permissionlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof permissions_interface_1.userPermissionListReq !== "undefined" && permissions_interface_1.userPermissionListReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], PermissionController.prototype, "getUserpermissionList", null);
__decorate([
    (0, common_1.Post)('resetpermission'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof permissions_interface_1.roleModuleResetReq !== "undefined" && permissions_interface_1.roleModuleResetReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], PermissionController.prototype, "resetPermission", null);
__decorate([
    (0, common_1.Get)('casepermission'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof permissions_interface_1.userPermissionListReq !== "undefined" && permissions_interface_1.userPermissionListReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], PermissionController.prototype, "getUserCasepermission", null);
exports.PermissionController = PermissionController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('permission'),
    (0, common_1.Controller)('permission'),
    __metadata("design:paramtypes", [typeof (_a = typeof permission_service_1.PermissionService !== "undefined" && permission_service_1.PermissionService) === "function" ? _a : Object])
], PermissionController);


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
exports.PermissionService = void 0;
const db_service_1 = __webpack_require__(10);
const redis_db_service_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
let PermissionService = class PermissionService {
    constructor(db, rds) {
        this.db = db;
        this.rds = rds;
    }
    async getrolepermissionlist(query) {
        query.ref = 2;
        let res = await this.db.executeRef('pm_rolepermission', query);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async updateStatus(body) {
        let res = await this.db.executeRef('pm_role_statusmanage', body);
        if (res.success) {
            try {
            }
            catch (error) {
            }
            return { msg: 1, value: "Updated" };
        }
        else {
            return { msg: -1, value: 'updation failed', error: res.error };
        }
    }
    async getRoleModules(query) {
        let res = await this.db.executeRef('pm_role_modules', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUserModules(query) {
        let res = await this.db.executeRef('pm_user_modules', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async updateModule(body) {
        let res = await this.db.executeRef('pm_update_modules', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'updation failed', error: res.error };
        }
    }
    async getUserPermission(query) {
        query.ref = 2;
        let res = await this.db.executeRef('pm_userpermission', query);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async updateUserStatus(body) {
        let res = await this.db.executeRef('pm_user_statusmanage', body);
        if (res.success) {
            try {
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'updation failed', error: res.error };
        }
    }
    async updateUserQuota(body) {
        let res = await this.db.executeRef('pm_update_quota', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'updation failed', error: res.error };
        }
    }
    async getUserpermissionList(query) {
        let res = await this.db.executeRef('pm_get_user_permission', query);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async resetPermission(body) {
        let res = await this.db.executeRef('pm_reset_permission', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'updation failed', error: res.error };
        }
    }
    async getUserCasepermission(query) {
        let res = await this.db.executeRef('pm_get_case_permission', query);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.PermissionService = PermissionService;
exports.PermissionService = PermissionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object])
], PermissionService);


/***/ }),
/* 80 */
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
exports.roleModuleResetReq = exports.userPermissionListReq = exports.userQuotaRes = exports.userQuotaReq = exports.userStatusRes = exports.userStatusReq = exports.userPermissionReq = exports.roleModuleUpdateRes = exports.roleModuleUpdateReq = exports.userModuleRes = exports.userModuleReq = exports.roleModuleRes = exports.roleModuleReq = exports.roleStatusRes = exports.roleStatusReq = exports.rolePermissionReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class rolePermissionReq {
}
exports.rolePermissionReq = rolePermissionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], rolePermissionReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], rolePermissionReq.prototype, "nMasterid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], rolePermissionReq.prototype, "ref", void 0);
class roleStatusReq {
}
exports.roleStatusReq = roleStatusReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleStatusReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Role id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleStatusReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Status', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], roleStatusReq.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleStatusReq.prototype, "nMasterid", void 0);
class roleStatusRes {
}
exports.roleStatusRes = roleStatusRes;
class roleModuleReq {
}
exports.roleModuleReq = roleModuleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Role id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleReq.prototype, "nRoleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleReq.prototype, "nMasterid", void 0);
class roleModuleRes {
}
exports.roleModuleRes = roleModuleRes;
class userModuleReq {
}
exports.userModuleReq = userModuleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userModuleReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userModuleReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userModuleReq.prototype, "nMasterid", void 0);
class userModuleRes {
}
exports.userModuleRes = userModuleRes;
class roleModuleUpdateReq {
}
exports.roleModuleUpdateReq = roleModuleUpdateReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleUpdateReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Role id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleUpdateReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Userid id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleUpdateReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Permissin module id', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], roleModuleUpdateReq.prototype, "nPMid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Value', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], roleModuleUpdateReq.prototype, "bValue", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleUpdateReq.prototype, "nMasterid", void 0);
class roleModuleUpdateRes {
}
exports.roleModuleUpdateRes = roleModuleUpdateRes;
class userPermissionReq {
}
exports.userPermissionReq = userPermissionReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userPermissionReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userPermissionReq.prototype, "nMasterid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_c = typeof Number !== "undefined" && Number) === "function" ? _c : Object)
], userPermissionReq.prototype, "ref", void 0);
class userStatusReq {
}
exports.userStatusReq = userStatusReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userStatusReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userStatusReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'Status', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], userStatusReq.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userStatusReq.prototype, "nMasterid", void 0);
class userStatusRes {
}
exports.userStatusRes = userStatusRes;
class userQuotaReq {
}
exports.userQuotaReq = userQuotaReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userQuotaReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userQuotaReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Quota', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_d = typeof Number !== "undefined" && Number) === "function" ? _d : Object)
], userQuotaReq.prototype, "nQuota", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userQuotaReq.prototype, "nMasterid", void 0);
class userQuotaRes {
}
exports.userQuotaRes = userQuotaRes;
class userPermissionListReq {
}
exports.userPermissionListReq = userPermissionListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userPermissionListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userPermissionListReq.prototype, "nMasterid", void 0);
class roleModuleResetReq {
}
exports.roleModuleResetReq = roleModuleResetReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Case id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleResetReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Role id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleResetReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Userid id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleResetReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], roleModuleResetReq.prototype, "nMasterid", void 0);


/***/ }),
/* 81 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminDashboardModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const admin_dashboard_controller_1 = __webpack_require__(82);
const admin_dashboard_service_1 = __webpack_require__(83);
const jwt_middleware_1 = __webpack_require__(33);
const admin_middleware_1 = __webpack_require__(85);
let AdminDashboardModule = class AdminDashboardModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(admin_dashboard_controller_1.AdminDashboardController);
        consumer
            .apply(admin_middleware_1.AdminMiddleware)
            .forRoutes(admin_dashboard_controller_1.AdminDashboardController);
    }
};
exports.AdminDashboardModule = AdminDashboardModule;
exports.AdminDashboardModule = AdminDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [admin_dashboard_controller_1.AdminDashboardController],
        providers: [admin_dashboard_service_1.AdminDashboardService]
    })
], AdminDashboardModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminDashboardController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const admin_dashboard_service_1 = __webpack_require__(83);
const admin_dashboard_interface_1 = __webpack_require__(84);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let AdminDashboardController = class AdminDashboardController {
    constructor(admindashboardService) {
        this.admindashboardService = admindashboardService;
        console.log('\n\r\n\r\n\r\n\r\n\rAdminDashboardController initialized.');
    }
    async getCaseList(query) {
        return await this.admindashboardService.getCaseList(query);
    }
    async getArchiveCase(query) {
        return await this.admindashboardService.getarchiveCase(query);
    }
    async archiveCase(body) {
        return await this.admindashboardService.archiveCase(body);
    }
};
exports.AdminDashboardController = AdminDashboardController;
__decorate([
    (0, common_1.Get)('caselist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(43),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof admin_dashboard_interface_1.CaseListReq !== "undefined" && admin_dashboard_interface_1.CaseListReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], AdminDashboardController.prototype, "getCaseList", null);
__decorate([
    (0, common_1.Get)('archiveCase'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof admin_dashboard_interface_1.CaseListReq !== "undefined" && admin_dashboard_interface_1.CaseListReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AdminDashboardController.prototype, "getArchiveCase", null);
__decorate([
    (0, common_1.Post)('updatearchiveCase'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof admin_dashboard_interface_1.archiveCaseReq !== "undefined" && admin_dashboard_interface_1.archiveCaseReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], AdminDashboardController.prototype, "archiveCase", null);
exports.AdminDashboardController = AdminDashboardController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('admin-dashboard'),
    (0, common_1.Controller)('admin-dashboard'),
    __metadata("design:paramtypes", [typeof (_a = typeof admin_dashboard_service_1.AdminDashboardService !== "undefined" && admin_dashboard_service_1.AdminDashboardService) === "function" ? _a : Object])
], AdminDashboardController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminDashboardService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let AdminDashboardService = class AdminDashboardService {
    constructor(db) {
        this.db = db;
    }
    async getCaseList(body) {
        body.ref = 3;
        let res = await this.db.executeRef('admindashboard', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getarchiveCase(body) {
        body.ref = 3;
        let res = await this.db.executeRef('admin_archivecase', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async archiveCase(body) {
        let res = await this.db.executeRef('archivecase', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.AdminDashboardService = AdminDashboardService;
exports.AdminDashboardService = AdminDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], AdminDashboardService);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.archiveCaseRes = exports.archiveCaseReq = exports.CaseListResponce = exports.CaseListReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
class CaseListReq {
}
exports.CaseListReq = CaseListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], CaseListReq.prototype, "pageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseListReq.prototype, "cSearch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], CaseListReq.prototype, "ref", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", typeof (_c = typeof Number !== "undefined" && Number) === "function" ? _c : Object)
], CaseListReq.prototype, "nMasterid", void 0);
class CaseListResponce {
}
exports.CaseListResponce = CaseListResponce;
class archiveCaseReq {
}
exports.archiveCaseReq = archiveCaseReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], archiveCaseReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'is Archived', required: false }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", typeof (_d = typeof Boolean !== "undefined" && Boolean) === "function" ? _d : Object)
], archiveCaseReq.prototype, "bIsarchived", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", typeof (_e = typeof Number !== "undefined" && Number) === "function" ? _e : Object)
], archiveCaseReq.prototype, "nMasterid", void 0);
class archiveCaseRes {
}
exports.archiveCaseRes = archiveCaseRes;


/***/ }),
/* 85 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AdminMiddleware = void 0;
const common_1 = __webpack_require__(3);
let AdminMiddleware = class AdminMiddleware {
    use(req, res, next) {
        const isAdmin = req['isAdmin'];
        if (!isAdmin) {
            return res.status(403).json({ message: 'Admin rights required' });
        }
        next();
    }
};
exports.AdminMiddleware = AdminMiddleware;
exports.AdminMiddleware = AdminMiddleware = __decorate([
    (0, common_1.Injectable)()
], AdminMiddleware);


/***/ }),
/* 86 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserDashboardModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const user_dashboard_controller_1 = __webpack_require__(87);
const user_dashboard_service_1 = __webpack_require__(88);
const jwt_middleware_1 = __webpack_require__(33);
let UserDashboardModule = class UserDashboardModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(user_dashboard_controller_1.UserDashboardController);
    }
};
exports.UserDashboardModule = UserDashboardModule;
exports.UserDashboardModule = UserDashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [user_dashboard_controller_1.UserDashboardController],
        providers: [user_dashboard_service_1.UserDashboardService]
    })
], UserDashboardModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserDashboardController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const user_dashboard_service_1 = __webpack_require__(88);
const user_dashboard_interface_1 = __webpack_require__(89);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let UserDashboardController = class UserDashboardController {
    constructor(userdashboardService) {
        this.userdashboardService = userdashboardService;
    }
    async getCaseList(query) {
        return await this.userdashboardService.getCaseList(query);
    }
    async getDashInfo(query) {
        return await this.userdashboardService.getDashInfo(query);
    }
};
exports.UserDashboardController = UserDashboardController;
__decorate([
    (0, common_1.Get)('caselist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(44),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof user_dashboard_interface_1.userCaseListReq !== "undefined" && user_dashboard_interface_1.userCaseListReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], UserDashboardController.prototype, "getCaseList", null);
__decorate([
    (0, common_1.Get)('dashinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof user_dashboard_interface_1.dashInfoReq !== "undefined" && user_dashboard_interface_1.dashInfoReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], UserDashboardController.prototype, "getDashInfo", null);
exports.UserDashboardController = UserDashboardController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('user-dashboard'),
    (0, common_1.Controller)('user-dashboard'),
    __metadata("design:paramtypes", [typeof (_a = typeof user_dashboard_service_1.UserDashboardService !== "undefined" && user_dashboard_service_1.UserDashboardService) === "function" ? _a : Object])
], UserDashboardController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserDashboardService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let UserDashboardService = class UserDashboardService {
    constructor(db) {
        this.db = db;
    }
    async getCaseList(body) {
        body.ref = 3;
        let res = await this.db.executeRef('dashboard', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getDashInfo(query) {
        query.ref = 3;
        let res = await this.db.executeRef('dashboard_info', query);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
};
exports.UserDashboardService = UserDashboardService;
exports.UserDashboardService = UserDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], UserDashboardService);


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
exports.dashInfoReq = exports.userCaseListResponce = exports.userCaseListReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
class userCaseListReq {
}
exports.userCaseListReq = userCaseListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], userCaseListReq.prototype, "pageNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], userCaseListReq.prototype, "ref", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], userCaseListReq.prototype, "nMasterid", void 0);
class userCaseListResponce {
}
exports.userCaseListResponce = userCaseListResponce;
class dashInfoReq {
}
exports.dashInfoReq = dashInfoReq;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_c = typeof Number !== "undefined" && Number) === "function" ? _c : Object)
], dashInfoReq.prototype, "ref", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], dashInfoReq.prototype, "nMasterid", void 0);


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
exports.TicketModule = void 0;
const jwt_middleware_1 = __webpack_require__(33);
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const ticket_controller_1 = __webpack_require__(91);
const ticket_service_1 = __webpack_require__(92);
const admin_middleware_1 = __webpack_require__(85);
let TicketModule = class TicketModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(ticket_controller_1.TicketController);
        consumer
            .apply(admin_middleware_1.AdminMiddleware)
            .forRoutes({ path: 'ticket/casetickets', method: common_1.RequestMethod.ALL }, { path: 'ticket/resolved', method: common_1.RequestMethod.ALL }, { path: 'ticket/adminclearticket', method: common_1.RequestMethod.ALL });
    }
};
exports.TicketModule = TicketModule;
exports.TicketModule = TicketModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [ticket_controller_1.TicketController],
        providers: [ticket_service_1.TicketService]
    })
], TicketModule);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TicketController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const ticket_service_1 = __webpack_require__(92);
const ticket_interface_1 = __webpack_require__(93);
let TicketController = class TicketController {
    constructor(ticketService) {
        this.ticketService = ticketService;
    }
    async getCaseTicket(query) {
        return await this.ticketService.getCaseTicket(query);
    }
    async getCaseAllTicket(query) {
        return await this.ticketService.getCaseAllTicket(query);
    }
    async cleartickets(body) {
        return await this.ticketService.clearTickets(body);
    }
    async ticketResolved(body) {
        return await this.ticketService.ticketResolved(body);
    }
    async admincleartickets(body) {
        return await this.ticketService.clearAdminTickets(body);
    }
    async getCaselist(query) {
        return await this.ticketService.getCaseList(query);
    }
    async ticketbuilder(body) {
        return await this.ticketService.ticketbuilder(body);
    }
};
exports.TicketController = TicketController;
__decorate([
    (0, common_1.Get)('tickets'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof ticket_interface_1.caseTicketReq !== "undefined" && ticket_interface_1.caseTicketReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], TicketController.prototype, "getCaseTicket", null);
__decorate([
    (0, common_1.Get)('casetickets'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof ticket_interface_1.caseTicketReq !== "undefined" && ticket_interface_1.caseTicketReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], TicketController.prototype, "getCaseAllTicket", null);
__decorate([
    (0, common_1.Post)('clearticket'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof ticket_interface_1.clearTicketReq !== "undefined" && ticket_interface_1.clearTicketReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TicketController.prototype, "cleartickets", null);
__decorate([
    (0, common_1.Post)('resolved'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof ticket_interface_1.ticketResolveReq !== "undefined" && ticket_interface_1.ticketResolveReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TicketController.prototype, "ticketResolved", null);
__decorate([
    (0, common_1.Post)('adminclearticket'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof ticket_interface_1.ticketResolveClearReq !== "undefined" && ticket_interface_1.ticketResolveClearReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TicketController.prototype, "admincleartickets", null);
__decorate([
    (0, common_1.Get)('caselist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof ticket_interface_1.caseListReq !== "undefined" && ticket_interface_1.caseListReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TicketController.prototype, "getCaselist", null);
__decorate([
    (0, common_1.Post)('ticketbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof ticket_interface_1.ticketBuilderReq !== "undefined" && ticket_interface_1.ticketBuilderReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], TicketController.prototype, "ticketbuilder", null);
exports.TicketController = TicketController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('tickets'),
    (0, common_1.Controller)('ticket'),
    __metadata("design:paramtypes", [typeof (_a = typeof ticket_service_1.TicketService !== "undefined" && ticket_service_1.TicketService) === "function" ? _a : Object])
], TicketController);


/***/ }),
/* 92 */
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
exports.TicketService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let TicketService = class TicketService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
    }
    async getCaseTicket(query) {
        let res = await this.db.executeRef('user_tickets', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getCaseAllTicket(query) {
        let res = await this.db.executeRef('admin_case_tickets', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async clearTickets(body) {
        let res = await this.db.executeRef('user_tickets_clear', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to clear', error: res.error };
        }
    }
    async ticketResolved(body) {
        let res = await this.db.executeRef('admin_case_ticket_resolved', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) {
            }
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to resolve', error: res.error };
        }
    }
    async clearAdminTickets(body) {
        let res = await this.db.executeRef('admin_clear_resolvedtickets', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to clear', error: res.error };
        }
    }
    async getCaseList(query) {
        let res = await this.db.executeRef('ticket_caselist', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async ticketbuilder(body) {
        let res = await this.db.executeRef('ticket_builder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to clear', error: res.error };
        }
    }
};
exports.TicketService = TicketService;
exports.TicketService = TicketService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], TicketService);


/***/ }),
/* 93 */
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
exports.ticketBuilderReq = exports.CaseListRes = exports.caseListReq = exports.ticketResolveClearRes = exports.ticketResolveClearReq = exports.ticketResolveRes = exports.ticketResolveReq = exports.clearTicketRes = exports.clearTicketReq = exports.caseTicketRes = exports.caseTicketReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class caseTicketReq {
}
exports.caseTicketReq = caseTicketReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseTicketReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseTicketReq.prototype, "nMasterid", void 0);
class caseTicketRes {
}
exports.caseTicketRes = caseTicketRes;
class clearTicketReq {
}
exports.clearTicketReq = clearTicketReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], clearTicketReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], clearTicketReq.prototype, "nMasterid", void 0);
class clearTicketRes {
}
exports.clearTicketRes = clearTicketRes;
class ticketResolveReq {
}
exports.ticketResolveReq = ticketResolveReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketResolveReq.prototype, "nTicketid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketResolveReq.prototype, "nMasterid", void 0);
class ticketResolveRes {
}
exports.ticketResolveRes = ticketResolveRes;
class ticketResolveClearReq {
}
exports.ticketResolveClearReq = ticketResolveClearReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketResolveClearReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketResolveClearReq.prototype, "nMasterid", void 0);
class ticketResolveClearRes {
}
exports.ticketResolveClearRes = ticketResolveClearRes;
class caseListReq {
}
exports.caseListReq = caseListReq;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseListReq.prototype, "nMasterid", void 0);
class CaseListRes {
}
exports.CaseListRes = CaseListRes;
class ticketBuilderReq {
}
exports.ticketBuilderReq = ticketBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Session' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "cSession", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "cDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Image' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "cImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Image name' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "cImagename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ticketBuilderReq.prototype, "nMasterid", void 0);


/***/ }),
/* 94 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const upload_controller_1 = __webpack_require__(95);
const jwt_middleware_1 = __webpack_require__(33);
const upload_service_1 = __webpack_require__(96);
const ocrqueue_controller_1 = __webpack_require__(98);
const ocrqueue_service_1 = __webpack_require__(99);
let UploadModule = class UploadModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(upload_controller_1.UploadController, ocrqueue_controller_1.OcrqueueController);
    }
};
exports.UploadModule = UploadModule;
exports.UploadModule = UploadModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [upload_controller_1.UploadController, ocrqueue_controller_1.OcrqueueController],
        providers: [upload_service_1.UploadService, ocrqueue_service_1.OcrqueueService],
    })
], UploadModule);


/***/ }),
/* 95 */
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
exports.UploadController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const upload_service_1 = __webpack_require__(96);
const upload_interface_1 = __webpack_require__(97);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async getCaseDetail(query) {
        return await this.uploadService.caseDetail(query);
    }
    async getSectionDetail(query) {
        return await this.uploadService.sectionDetail(query);
    }
    async getCaseList(query) {
        return await this.uploadService.bundleDetail(query);
    }
    async uploadlog(body) {
        return { msg: 1 };
    }
    async teamdelete(body) {
        return await this.uploadService.checkForDuplicate(body);
    }
    async fetchUploadsummary(query) {
        return await this.uploadService.getUploadSummary(query);
    }
    async getUploadDetail(query) {
        return await this.uploadService.getUploadetail(query);
    }
    async checkUploadedChunks(query) {
        return await this.uploadService.getUploadFiltered(query);
    }
    async replaceFIleDetail(body) {
        return await this.uploadService.replaceFIleDetail(body);
    }
    async clearcomplete(body) {
        return await this.uploadService.clearCompleted(body);
    }
    async ocrdata(body) {
        return await this.uploadService.ocrdata(body);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Get)('casedetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof upload_interface_1.caseDetailMDL !== "undefined" && upload_interface_1.caseDetailMDL) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], UploadController.prototype, "getCaseDetail", null);
__decorate([
    (0, common_1.Get)('sectiondetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof upload_interface_1.sectionDetailMDL !== "undefined" && upload_interface_1.sectionDetailMDL) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], UploadController.prototype, "getSectionDetail", null);
__decorate([
    (0, common_1.Get)('bundle'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof upload_interface_1.bundleDetailMDL !== "undefined" && upload_interface_1.bundleDetailMDL) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], UploadController.prototype, "getCaseList", null);
__decorate([
    (0, common_1.Post)('uploadlog'),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(51),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof upload_interface_1.uploadLogMDL !== "undefined" && upload_interface_1.uploadLogMDL) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], UploadController.prototype, "uploadlog", null);
__decorate([
    (0, common_1.Post)('checkduplicacy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof upload_interface_1.checkDuplicacyMDL !== "undefined" && upload_interface_1.checkDuplicacyMDL) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], UploadController.prototype, "teamdelete", null);
__decorate([
    (0, common_1.Get)('uploadsummary'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof upload_interface_1.uploadSummaryMDL !== "undefined" && upload_interface_1.uploadSummaryMDL) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], UploadController.prototype, "fetchUploadsummary", null);
__decorate([
    (0, common_1.Get)('uploaddetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof upload_interface_1.uploadDetailMDL !== "undefined" && upload_interface_1.uploadDetailMDL) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], UploadController.prototype, "getUploadDetail", null);
__decorate([
    (0, common_1.Get)('uploadfilter'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof upload_interface_1.uploadSummaryMDL !== "undefined" && upload_interface_1.uploadSummaryMDL) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], UploadController.prototype, "checkUploadedChunks", null);
__decorate([
    (0, common_1.Post)('replacefile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof upload_interface_1.replaceMDL !== "undefined" && upload_interface_1.replaceMDL) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], UploadController.prototype, "replaceFIleDetail", null);
__decorate([
    (0, common_1.Post)('clear-completed'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof upload_interface_1.clearCompleteMDL !== "undefined" && upload_interface_1.clearCompleteMDL) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], UploadController.prototype, "clearcomplete", null);
__decorate([
    (0, common_1.Get)('ocrdata'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof upload_interface_1.ocrdataMDL !== "undefined" && upload_interface_1.ocrdataMDL) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], UploadController.prototype, "ocrdata", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('upload'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object])
], UploadController);


/***/ }),
/* 96 */
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
exports.UploadService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let UploadService = class UploadService {
    constructor(db) {
        this.db = db;
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
    async getUploadSummary(query) {
        let res = await this.db.executeRef('upload_report_summary', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getUploadFiltered(query) {
        let res = await this.db.executeRef('upload_report_filter', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getUploadetail(query) {
        let res = await this.db.executeRef('upload_report_detail', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async replaceFIleDetail(body) {
        let res = await this.db.executeRef('upload_replacefile', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async clearCompleted(body) {
        let res = await this.db.executeRef('upload_clearcompletes', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async ocrdata(body) {
        body["ref"] = 2;
        let res = await this.db.executeRef('ocr_data', body);
        if (res.success) {
            return res.data;
        }
        else {
            return [];
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], UploadService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ocrdataMDL = exports.clearCompleteMDL = exports.convertRes = exports.replaceMDL = exports.uploadDetailMDL = exports.uploadSummaryMDL = exports.uploadLogMDL = exports.checkDuplicacyMDL = exports.bundleDetailMDL = exports.sectionDetailMDL = exports.caseDetailMDL = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class caseDetailMDL {
}
exports.caseDetailMDL = caseDetailMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseDetailMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], caseDetailMDL.prototype, "nMasterid", void 0);
class sectionDetailMDL {
}
exports.sectionDetailMDL = sectionDetailMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sectionDetailMDL.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sectionDetailMDL.prototype, "nMasterid", void 0);
class bundleDetailMDL {
}
exports.bundleDetailMDL = bundleDetailMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleDetailMDL.prototype, "nBundleid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], bundleDetailMDL.prototype, "nMasterid", void 0);
class checkDuplicacyMDL {
}
exports.checkDuplicacyMDL = checkDuplicacyMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [[1, 2, 'dsf', true]], description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "d", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], checkDuplicacyMDL.prototype, "nMasterid", void 0);
class uploadLogMDL {
}
exports.uploadLogMDL = uploadLogMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], uploadLogMDL.prototype, "nTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [[1, 2, 'dsf', true]], description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "d", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadLogMDL.prototype, "nMasterid", void 0);
class uploadSummaryMDL {
}
exports.uploadSummaryMDL = uploadSummaryMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "dDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PDF', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "cFiletype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadSummaryMDL.prototype, "nMasterid", void 0);
class uploadDetailMDL {
}
exports.uploadDetailMDL = uploadDetailMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadDetailMDL.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadDetailMDL.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadDetailMDL.prototype, "dDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'PDF', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], uploadDetailMDL.prototype, "cFiletype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadDetailMDL.prototype, "nMasterid", void 0);
class replaceMDL {
}
exports.replaceMDL = replaceMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "nUDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "cName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "cSize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], replaceMDL.prototype, "nMasterid", void 0);
class convertRes {
}
exports.convertRes = convertRes;
class clearCompleteMDL {
}
exports.clearCompleteMDL = clearCompleteMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], clearCompleteMDL.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], clearCompleteMDL.prototype, "nSectionid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], clearCompleteMDL.prototype, "nMasterid", void 0);
class ocrdataMDL {
}
exports.ocrdataMDL = ocrdataMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ocrdataMDL.prototype, "nUDid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ocrdataMDL.prototype, "nMasterid", void 0);


/***/ }),
/* 98 */
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
exports.OcrqueueController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const ocrqueue_service_1 = __webpack_require__(99);
const ocrqueue_interface_1 = __webpack_require__(100);
let OcrqueueController = class OcrqueueController {
    constructor(ocrqueueS) {
        this.ocrqueueS = ocrqueueS;
    }
    async getOcrdata(query) {
        return await this.ocrqueueS.getOcrdata(query);
    }
    async getOcrFiledata(query) {
        return await this.ocrqueueS.getOcrFiledata(query);
    }
};
exports.OcrqueueController = OcrqueueController;
__decorate([
    (0, common_1.Get)('get_ocrlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof ocrqueue_interface_1.OCRFilelistQueue !== "undefined" && ocrqueue_interface_1.OCRFilelistQueue) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], OcrqueueController.prototype, "getOcrdata", null);
__decorate([
    (0, common_1.Get)('get_ocrfilelist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof ocrqueue_interface_1.OCRFilelistQueue !== "undefined" && ocrqueue_interface_1.OCRFilelistQueue) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], OcrqueueController.prototype, "getOcrFiledata", null);
exports.OcrqueueController = OcrqueueController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('ocr'),
    (0, common_1.Controller)('ocrqueue'),
    __metadata("design:paramtypes", [typeof (_a = typeof ocrqueue_service_1.OcrqueueService !== "undefined" && ocrqueue_service_1.OcrqueueService) === "function" ? _a : Object])
], OcrqueueController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OcrqueueService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let OcrqueueService = class OcrqueueService {
    constructor(db) {
        this.db = db;
    }
    async getOcrdata(query) {
        query["ref"] = 2;
        let res = await this.db.executeRef('ocr_list', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [];
        }
    }
    async getOcrFiledata(query) {
        let res = await this.db.executeRef('ocr_filelist', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
};
exports.OcrqueueService = OcrqueueService;
exports.OcrqueueService = OcrqueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], OcrqueueService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resDeleteWeb = exports.OCRFilelistQueue = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class OCRFilelistQueue {
}
exports.OCRFilelistQueue = OCRFilelistQueue;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Caseid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OCRFilelistQueue.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Userid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], OCRFilelistQueue.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], OCRFilelistQueue.prototype, "nMasterid", void 0);
class resDeleteWeb {
}
exports.resDeleteWeb = resDeleteWeb;


/***/ }),
/* 101 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndividualModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const individual_controller_1 = __webpack_require__(102);
const individual_service_1 = __webpack_require__(103);
const jwt_middleware_1 = __webpack_require__(33);
const fact_controller_1 = __webpack_require__(104);
const fact_service_1 = __webpack_require__(105);
const doclink_controller_1 = __webpack_require__(107);
const weblink_controller_1 = __webpack_require__(110);
const doclink_service_1 = __webpack_require__(108);
const weblink_service_1 = __webpack_require__(111);
const axios_1 = __webpack_require__(112);
const task_controller_1 = __webpack_require__(117);
const task_service_1 = __webpack_require__(118);
const tag_controller_1 = __webpack_require__(120);
const tag_service_1 = __webpack_require__(121);
let IndividualModule = class IndividualModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(individual_controller_1.IndividualController, fact_controller_1.FactController, doclink_controller_1.DoclinkController, weblink_controller_1.WeblinkController, task_controller_1.TaskController, tag_controller_1.TagController);
    }
};
exports.IndividualModule = IndividualModule;
exports.IndividualModule = IndividualModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule, axios_1.HttpModule],
        controllers: [individual_controller_1.IndividualController, fact_controller_1.FactController, doclink_controller_1.DoclinkController, weblink_controller_1.WeblinkController, task_controller_1.TaskController, tag_controller_1.TagController],
        providers: [individual_service_1.IndividualService, fact_service_1.FactService, doclink_service_1.DoclinkService, weblink_service_1.WeblinkService, task_service_1.TaskService, tag_service_1.TagService
        ],
    })
], IndividualModule);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndividualController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const individual_service_1 = __webpack_require__(103);
const individual_interface_1 = __webpack_require__(64);
let IndividualController = class IndividualController {
    constructor(individualService) {
        this.individualService = individualService;
    }
    async getCaseDetail(query) {
        return await this.individualService.getTabData(query);
    }
    async getfetchtab(query) {
        return await this.individualService.getTab(query);
    }
    async getDocinfo(query) {
        return await this.individualService.getDocinfo(query);
    }
    async getglobalannotas(query) {
        return await this.individualService.getglobalannotas(query);
    }
    async updateRotation(body) {
        return await this.individualService.updateRotation(body);
    }
    async getIncommingFactLinks(query) {
        return await this.individualService.getLinks(query, 'linkexplorer_incomming_factlinks');
    }
    async getIncommingDocLink(query) {
        return await this.individualService.getLinks(query, 'linkexplorer_incomming_doclinks');
    }
    async getOutgoingFactLinks(query) {
        return await this.individualService.getLinks(query, 'linkexplorer_outgoing_factlinks');
    }
    async getOutgoingDocLink(query) {
        return await this.individualService.getLinks(query, 'linkexplorer_outgoing_doclinks');
    }
    async updateShareLink(body) {
        return await this.individualService.updateShareLink(body);
    }
    async locationshareSharetousers(body) {
        return await this.individualService.locationshareSharetousers(body);
    }
    async getSharesUsers(query) {
        return await this.individualService.getSharesUsers(query);
    }
    async gethyperlinkfile(query) {
        return await this.individualService.getHyperLinkFiles(query);
    }
    async getToolbarData(query) {
        return await this.individualService.getToolbarData(query);
    }
};
exports.IndividualController = IndividualController;
__decorate([
    (0, common_1.Get)('tabinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof individual_interface_1.fetchTabDataReq !== "undefined" && individual_interface_1.fetchTabDataReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], IndividualController.prototype, "getCaseDetail", null);
__decorate([
    (0, common_1.Get)('gettab'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof individual_interface_1.getTabReq !== "undefined" && individual_interface_1.getTabReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], IndividualController.prototype, "getfetchtab", null);
__decorate([
    (0, common_1.Get)('getDocinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof individual_interface_1.DocinfoReq !== "undefined" && individual_interface_1.DocinfoReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], IndividualController.prototype, "getDocinfo", null);
__decorate([
    (0, common_1.Get)('globannots'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof individual_interface_1.DocinfoReq !== "undefined" && individual_interface_1.DocinfoReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], IndividualController.prototype, "getglobalannotas", null);
__decorate([
    (0, common_1.Post)('updaterotation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof individual_interface_1.updateBundleDetailRotation !== "undefined" && individual_interface_1.updateBundleDetailRotation) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], IndividualController.prototype, "updateRotation", null);
__decorate([
    (0, common_1.Get)('incomming/factlinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], IndividualController.prototype, "getIncommingFactLinks", null);
__decorate([
    (0, common_1.Get)('incomming/doclinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], IndividualController.prototype, "getIncommingDocLink", null);
__decorate([
    (0, common_1.Get)('outgoing/factlinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], IndividualController.prototype, "getOutgoingFactLinks", null);
__decorate([
    (0, common_1.Get)('outgoing/doclinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], IndividualController.prototype, "getOutgoingDocLink", null);
__decorate([
    (0, common_1.Post)('updatesharelink'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof individual_interface_1.updateShareLink !== "undefined" && individual_interface_1.updateShareLink) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], IndividualController.prototype, "updateShareLink", null);
__decorate([
    (0, common_1.Post)('locationshare/sharetousers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof individual_interface_1.locationShareToUsers !== "undefined" && individual_interface_1.locationShareToUsers) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], IndividualController.prototype, "locationshareSharetousers", null);
__decorate([
    (0, common_1.Get)('locationshare/sharedusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof individual_interface_1.linkexplorerReq !== "undefined" && individual_interface_1.linkexplorerReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], IndividualController.prototype, "getSharesUsers", null);
__decorate([
    (0, common_1.Get)('gethyperlinkfile'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof individual_interface_1.hyperlinkFileReq !== "undefined" && individual_interface_1.hyperlinkFileReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], IndividualController.prototype, "gethyperlinkfile", null);
__decorate([
    (0, common_1.Get)('toolbar/data'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof individual_interface_1.toolbarDataReq !== "undefined" && individual_interface_1.toolbarDataReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], IndividualController.prototype, "getToolbarData", null);
exports.IndividualController = IndividualController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('individual'),
    (0, common_1.Controller)('individual'),
    __metadata("design:paramtypes", [typeof (_a = typeof individual_service_1.IndividualService !== "undefined" && individual_service_1.IndividualService) === "function" ? _a : Object])
], IndividualController);


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
exports.IndividualService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let IndividualService = class IndividualService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
    }
    async getTabData(query) {
        let res = await this.db.executeRef('individual_tabs', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getTab(query) {
        let res = await this.db.executeRef('individual_prenext_id', query);
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
    async getglobalannotas(query) {
        let res = await this.db.executeRef('individual_annotations_global', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async updateRotation(body) {
        let res = await this.db.executeRef('individual_update_rotation', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getLinks(query, fn) {
        let res = await this.db.executeRef(fn, query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async updateShareLink(body) {
        let res = await this.db.executeRef('share_links', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) {
            }
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async locationshareSharetousers(body) {
        let res = await this.db.executeRef('location_share', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) {
            }
            try {
                return { msg: 1, value: '   Doc inserted successfully', nDocid: res.data[0][0].nDocid };
            }
            catch (error) {
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getSharesUsers(query) {
        let res = await this.db.executeRef('location_shared_users', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getHyperLinkFiles(query) {
        let res = await this.db.executeRef('hyperlink_getdocument', query);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getToolbarData(query) {
        let res = await this.db.executeRef('toolbar_doc_info', query);
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
};
exports.IndividualService = IndividualService;
exports.IndividualService = IndividualService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], IndividualService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const fact_service_1 = __webpack_require__(105);
const fact_interface_1 = __webpack_require__(106);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let FactController = class FactController {
    constructor(factservice) {
        this.factservice = factservice;
    }
    async insertfact(body) {
        try {
            const res = await this.factservice.insertFact(body);
            if (res && res.nFSid) {
                body["nFSid"] = res.nFSid;
                await this.factservice.insertFactDetail(body);
                await this.factservice.insertFactlink(body);
                await this.factservice.insertFactissues(body);
                await this.factservice.insertFactcontact(body);
                await this.factservice.insertFacttask(body);
                await this.factservice.insertFactteam(body);
                return {
                    msg: 1,
                    value: 'Fact inserted successfully',
                    nFSid: res["nFSid"],
                    color: res["color"]
                };
            }
            else {
                return { msg: -1, value: 'Fact not inserted successfully', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact not inserted successfully', error: error };
        }
    }
    async factdelete(body) {
        try {
            const res = await this.factservice.FactDelete(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async factupdate(body) {
        try {
            const res = await this.factservice.factUpdate(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async quickfactupdate(body) {
        try {
            const res = await this.factservice.quickfactUpdate(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async getFactdetail(query) {
        try {
            const res = await this.factservice.getFactdetail(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async getFactIssuelinks(query) {
        try {
            const res = await this.factservice.getFactIssuelinks(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async getFactContact(query) {
        try {
            const res = await this.factservice.getFactcontact(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
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
    async getFactlinks(query) {
        try {
            const res = await this.factservice.getFactlinks(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async getFactshared(query) {
        try {
            const res = await this.factservice.getFactshared(query);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async insertQuickfact(body) {
        try {
            const res = await this.factservice.insertQuickFact(body);
            if (res && res.nFSid) {
                body["nFSid"] = res.nFSid;
                await this.factservice.insertFactDetail(body);
                await this.factservice.insertFactissues(body);
                await this.factservice.insertFactcontact(body);
                return {
                    msg: 1,
                    value: 'Quick fact inserted successfully',
                    nFSid: res["nFSid"],
                    color: res["color"]
                };
            }
            else {
                return { msg: -1, value: 'Quick fact not inserted successfully', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Quick fact not inserted successfully', error: error };
        }
    }
    async deleteHighlight(body) {
        try {
            const res = await this.factservice.deletehighlight(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async addhighlight(body) {
        try {
            const res = await this.factservice.addhighlight(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async convertfact(body) {
        try {
            const res = await this.factservice.convertFact(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async updateFactNote(body) {
        try {
            const res = await this.factservice.updateFactNote(body);
            return res;
        }
        catch (error) {
            return { msg: -1, value: error.message, error: error };
        }
    }
    async insertQuickfactV2(body) {
        try {
            const res = await this.factservice.insertQuickFactV2(body);
            if (res && res.nFSid) {
                body["nFSid"] = res.nFSid;
                await this.factservice.insertFactDetailV2(body);
                await this.factservice.insertFactissuesV2(body);
                await this.factservice.insertFactcontactV2(body);
                return {
                    msg: 1,
                    value: 'Quick fact inserted successfully',
                    nFSid: res["nFSid"],
                    color: res["color"]
                };
            }
            else {
                return { msg: -1, value: 'Quick fact not inserted successfully', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Quick fact not inserted successfully', error: error };
        }
    }
    async insertfactV2(body) {
        try {
            const res = await this.factservice.insertFactV2(body);
            if (res && res.nFSid) {
                body["nFSid"] = res.nFSid;
                await this.factservice.insertFactDetailV2(body);
                await this.factservice.insertFactlinkV2(body);
                await this.factservice.insertFactissuesV2(body);
                await this.factservice.insertFactcontactV2(body);
                await this.factservice.insertFacttaskV2(body);
                await this.factservice.insertFactteamV2(body);
                return {
                    msg: 1,
                    value: 'Fact inserted successfully',
                    nFSid: res["nFSid"],
                    color: res["color"]
                };
            }
            else {
                return { msg: -1, value: 'Fact not inserted successfully', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact not inserted successfully', error: error };
        }
    }
};
exports.FactController = FactController;
__decorate([
    (0, common_1.Post)('insertfact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof fact_interface_1.InsertFact !== "undefined" && fact_interface_1.InsertFact) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], FactController.prototype, "insertfact", null);
__decorate([
    (0, common_1.Post)('factdelete'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], FactController.prototype, "factdelete", null);
__decorate([
    (0, common_1.Post)('factupdate'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof fact_interface_1.factUpdate !== "undefined" && fact_interface_1.factUpdate) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], FactController.prototype, "factupdate", null);
__decorate([
    (0, common_1.Post)('quickfactupdate'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof fact_interface_1.quickfactUpdate !== "undefined" && fact_interface_1.quickfactUpdate) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], FactController.prototype, "quickfactupdate", null);
__decorate([
    (0, common_1.Get)('factdetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(72),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof fact_interface_1.factDetail !== "undefined" && fact_interface_1.factDetail) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], FactController.prototype, "getFactdetail", null);
__decorate([
    (0, common_1.Get)('factissuelinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof fact_interface_1.factDetail !== "undefined" && fact_interface_1.factDetail) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], FactController.prototype, "getFactIssuelinks", null);
__decorate([
    (0, common_1.Get)('factcontact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], FactController.prototype, "getFactContact", null);
__decorate([
    (0, common_1.Get)('facttask'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], FactController.prototype, "getFacttask", null);
__decorate([
    (0, common_1.Get)('factlinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], FactController.prototype, "getFactlinks", null);
__decorate([
    (0, common_1.Get)('factshared'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof fact_interface_1.factDetailSingle !== "undefined" && fact_interface_1.factDetailSingle) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], FactController.prototype, "getFactshared", null);
__decorate([
    (0, common_1.Post)('insertquickfact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof fact_interface_1.InsertQuickFact !== "undefined" && fact_interface_1.InsertQuickFact) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], FactController.prototype, "insertQuickfact", null);
__decorate([
    (0, common_1.Post)('deletehighlight'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof fact_interface_1.highlightDelete !== "undefined" && fact_interface_1.highlightDelete) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], FactController.prototype, "deleteHighlight", null);
__decorate([
    (0, common_1.Post)('addhighlight'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof fact_interface_1.addhighlight !== "undefined" && fact_interface_1.addhighlight) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], FactController.prototype, "addhighlight", null);
__decorate([
    (0, common_1.Post)('convertfact'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof fact_interface_1.factConvertMDL !== "undefined" && fact_interface_1.factConvertMDL) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], FactController.prototype, "convertfact", null);
__decorate([
    (0, common_1.Post)('update/factnote'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof fact_interface_1.factNoteUpdateReq !== "undefined" && fact_interface_1.factNoteUpdateReq) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], FactController.prototype, "updateFactNote", null);
__decorate([
    (0, common_1.Post)('insertquickfact/v2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof fact_interface_1.InsertQuickFactV2 !== "undefined" && fact_interface_1.InsertQuickFactV2) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], FactController.prototype, "insertQuickfactV2", null);
__decorate([
    (0, common_1.Post)('insertfact/v2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof fact_interface_1.InsertFactV2 !== "undefined" && fact_interface_1.InsertFactV2) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], FactController.prototype, "insertfactV2", null);
exports.FactController = FactController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('fact'),
    (0, common_1.Controller)('fact'),
    __metadata("design:paramtypes", [typeof (_a = typeof fact_service_1.FactService !== "undefined" && fact_service_1.FactService) === "function" ? _a : Object])
], FactController);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FactService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let FactService = class FactService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
    }
    async insertFact(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body);
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async insertFactDetail(body) {
        try {
            const res = await this.db.executeRef('fact_insert_detail', body);
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Fact detail insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact detail insert failed ', error: error };
        }
    }
    async insertFactlink(body) {
        try {
            const res = await this.db.executeRef('fact_insert_links', body);
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
    async insertFactissues(body) {
        try {
            const res = await this.db.executeRef('fact_insert_issues', body);
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact issues insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact issues insert failed ', error: error };
        }
    }
    async insertFactcontact(body) {
        try {
            const res = await this.db.executeRef('fact_insert_contact', body);
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact contact insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact contact insert failed ', error: error };
        }
    }
    async insertFacttask(body) {
        try {
            const res = await this.db.executeRef('fact_insert_task', body);
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
            const res = await this.db.executeRef('fact_insert_team', body);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) {
                }
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
    async getFactdetail(query) {
        try {
            const res = await this.db.executeRef('fact_get_detail', query);
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
    async getFactIssue(query) {
        try {
            const res = await this.db.executeRef('fact_get_issue', query);
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
    async getFactlinks(query) {
        try {
            const res = await this.db.executeRef('fact_get_links', query);
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
    async getFactcontact(query) {
        try {
            const res = await this.db.executeRef('fact_get_contact', query);
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
            const res = await this.db.executeRef('fact_get_shared', query);
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
    async getFacttask(query) {
        try {
            query["ref"] = 3;
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
    async getFactIssuelinks(query) {
        try {
            query["ref"] = 2;
            const res = await this.db.executeRef('fact_get_issue_links', query);
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
    async FactDelete(body) {
        try {
            const res = await this.db.executeRef('fact_delete', body);
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
    async factUpdate(body) {
        try {
            const res = await this.db.executeRef('fact_update', body);
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) { }
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
    async quickfactUpdate(body) {
        try {
            const res = await this.db.executeRef('fact_quick_update', body, 'realtime');
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
    async insertQuickFact(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body);
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
    async deletehighlight(body) {
        try {
            const res = await this.db.executeRef('fact_highlight_delete_by_uuid', body, 'realtime');
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'highlight delet failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'highlight delet failed', error: error };
        }
    }
    async addhighlight(body) {
        try {
            const res = await this.db.executeRef('fact_highlight_add', body, 'realtime');
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'highlight add failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'highlight add failed', error: error };
        }
    }
    async convertFact(body) {
        try {
            const res = await this.db.executeRef('fact_convert', body, 'realtime');
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'fact convert failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'fact convert failed', error: error };
        }
    }
    async updateFactNote(body) {
        try {
            const res = await this.db.executeRef('individual_update_facts_note', body, 'realtime');
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'fact note update failed', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'fact note update failed', error: error };
        }
    }
    async insertQuickFactV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
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
    async insertFactDetailV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_detail', body, 'realtime');
            if (res.success) {
                return res.data[0];
            }
            else {
                return { msg: -1, value: 'Fact detail insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact detail insert failed ', error: error };
        }
    }
    async insertFactissuesV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_issues', body, 'realtime');
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact issues insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact issues insert failed ', error: error };
        }
    }
    async insertFactcontactV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_contact', body, 'realtime');
            if (res.success) {
                return true;
            }
            else {
                return { msg: -1, value: 'Fact contact insert failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Fact contact insert failed ', error: error };
        }
    }
    async insertFactV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert', body, 'realtime');
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed ', error: error };
        }
    }
    async insertFactlinkV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_links', body, 'realtime');
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
    async insertFacttaskV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_task', body, 'realtime');
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
    async insertFactteamV2(body) {
        try {
            const res = await this.db.executeRef('fact_insert_team', body, 'realtime');
            if (res.success) {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) {
                }
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
};
exports.FactService = FactService;
exports.FactService = FactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], FactService);


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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.InsertFactV2 = exports.InsertQuickFactV2 = exports.factNoteUpdateReq = exports.quickfactUpdate = exports.factConvertMDL = exports.addhighlight = exports.highlightDelete = exports.factUpdate = exports.InsertQuickFact = exports.factDetail = exports.factDetailSingle = exports.resInsertData = exports.jRects = exports.jCoordinateItem = exports.resInsertFact = exports.InsertFact = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const class_transformer_1 = __webpack_require__(19);
class InsertFact {
}
exports.InsertFact = InsertFact;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nQFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Bundle Detail id ' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jFl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Timezone identifier', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFact.prototype, "nTZid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}]', description: 'Array of date objects', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of task IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of team IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFact.prototype, "jLinktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsHighlighted', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", typeof (_a = typeof Boolean !== "undefined" && Boolean) === "function" ? _a : Object)
], InsertFact.prototype, "bIsHighlighted", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFact.prototype, "nMasterid", void 0);
class resInsertFact {
}
exports.resInsertFact = resInsertFact;
class jCoordinateItem {
}
exports.jCoordinateItem = jCoordinateItem;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'uuid as a  strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCoordinateItem.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Type as a string', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], jCoordinateItem.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'line number identifier' }),
    (0, class_validator_1.IsNumber)({}, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], jCoordinateItem.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number or page identifier' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], jCoordinateItem.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Width of the annotation' }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], jCoordinateItem.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jRects),
    __metadata("design:type", Array)
], jCoordinateItem.prototype, "rects", void 0);
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
class resInsertData {
}
exports.resInsertData = resInsertData;
class factDetailSingle {
}
exports.factDetailSingle = factDetailSingle;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nFSid must be a number' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factDetailSingle.prototype, "nFSid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factDetailSingle.prototype, "nMasterid", void 0);
class factDetail {
}
exports.factDetail = factDetail;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "[1, 2, 3]", description: 'Array of team IDs' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factDetail.prototype, "jFSids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factDetail.prototype, "nMasterid", void 0);
class InsertQuickFact {
}
exports.InsertQuickFact = InsertQuickFact;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "jLinktype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFact.prototype, "nMasterid", void 0);
class factUpdate {
}
exports.factUpdate = factUpdate;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nFSid must be a UUID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factUpdate.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nFiletype must be a number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], factUpdate.prototype, "nFiletype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nStatus must be a number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], factUpdate.prototype, "nStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'nTZid must be a number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], factUpdate.prototype, "nTZid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Colorid must be a UUID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factUpdate.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jU", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["",""]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jTexts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[],[]]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jL", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[],[]]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jIssue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1,2]', description: 'Users' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factUpdate.prototype, "jC", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsHighlighted', required: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", typeof (_b = typeof Boolean !== "undefined" && Boolean) === "function" ? _b : Object)
], factUpdate.prototype, "bIsHighlighted", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: {}, description: 'Users' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], factUpdate.prototype, "jDate", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factUpdate.prototype, "nMasterid", void 0);
class highlightDelete {
}
exports.highlightDelete = highlightDelete;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nFSid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], highlightDelete.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Array of objects' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], highlightDelete.prototype, "uuid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], highlightDelete.prototype, "nMasterid", void 0);
class addhighlight {
}
exports.addhighlight = addhighlight;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nFSid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], addhighlight.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "cText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "uuid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "rects", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "lines", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_c = typeof Number !== "undefined" && Number) === "function" ? _c : Object)
], addhighlight.prototype, "width", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", typeof (_d = typeof Number !== "undefined" && Number) === "function" ? _d : Object)
], addhighlight.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], addhighlight.prototype, "jLinktype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], addhighlight.prototype, "nMasterid", void 0);
class factConvertMDL {
}
exports.factConvertMDL = factConvertMDL;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nFSid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factConvertMDL.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], factConvertMDL.prototype, "jLinktype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factConvertMDL.prototype, "nMasterid", void 0);
class quickfactUpdate {
}
exports.quickfactUpdate = quickfactUpdate;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nFSid must be a UUID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Colorid must be a UUID', required: false }),
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
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
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
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickfactUpdate.prototype, "nMasterid", void 0);
class factNoteUpdateReq {
}
exports.factNoteUpdateReq = factNoteUpdateReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nFSid for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factNoteUpdateReq.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Note here' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    __metadata("design:type", Array)
], factNoteUpdateReq.prototype, "jTexts", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], factNoteUpdateReq.prototype, "nMasterid", void 0);
class InsertQuickFactV2 {
}
exports.InsertQuickFactV2 = InsertQuickFactV2;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [jCoordinateItem], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCoordinateItem),
    __metadata("design:type", Array)
], InsertQuickFactV2.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Is not edited' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "cIsNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'fact from, only I or RT are allowed' }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "cFFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nPage', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertQuickFactV2.prototype, "nPage", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertQuickFactV2.prototype, "nMasterid", void 0);
class InsertFactV2 {
}
exports.InsertFactV2 = InsertFactV2;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Unique identifier for the database entry', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nBDid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [jCoordinateItem], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => jCoordinateItem),
    __metadata("design:type", Array)
], InsertFactV2.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'File type', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactV2.prototype, "nFt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'State number', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactV2.prototype, "nSt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[22, {}, [{}]]]', description: 'Array of arrays containing mixed types', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jFl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'Color id', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "nColorid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[[1, 2, 3], [1, 4, 3]]', description: 'Array of arrays of numbers' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jIssues", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of contact IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jContacts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of task IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jTasks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of team IDs', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'File type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "cFtype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'fact from, only I or RT are allowed' }),
    (0, class_validator_1.IsIn)(['I', 'RT']),
    __metadata("design:type", String)
], InsertFactV2.prototype, "cFFrom", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}]', description: 'Array of date objects', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["example1", "example2"]', description: 'Array of strings', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "jOT", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactV2.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertFactV2.prototype, "nLine", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFactV2.prototype, "nMasterid", void 0);


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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DoclinkController = void 0;
const common_1 = __webpack_require__(3);
const doclink_service_1 = __webpack_require__(108);
const swagger_1 = __webpack_require__(6);
const doc_interface_1 = __webpack_require__(109);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
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
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(73),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof doc_interface_1.docIDmulti !== "undefined" && doc_interface_1.docIDmulti) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], DoclinkController.prototype, "docDetail", null);
exports.DoclinkController = DoclinkController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('doclink'),
    (0, common_1.Controller)('doclink'),
    __metadata("design:paramtypes", [typeof (_a = typeof doclink_service_1.DoclinkService !== "undefined" && doclink_service_1.DoclinkService) === "function" ? _a : Object])
], DoclinkController);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DoclinkService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let DoclinkService = class DoclinkService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
    }
    async insertDoc(body) {
        let res = await this.db.executeRef('doc_insert', body, 'realtime');
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) {
            }
            try {
                return { msg: 1, value: '   Doc inserted successfully', nDocid: res.data[0][0].nDocid };
            }
            catch (error) {
            }
        }
        else {
            return { msg: -1, value: 'Doc insert failed', error: res.error };
        }
    }
    async docDelete(body) {
        try {
            const res = await this.db.executeRef('doc_delete', body);
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
            query["ref"] = 3;
            const res = await this.db.executeRef('doc_detail', query);
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
};
exports.DoclinkService = DoclinkService;
exports.DoclinkService = DoclinkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], DoclinkService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.docIDmulti = exports.docID = exports.resInsertDoc = exports.InsertDoc = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const fact_interface_1 = __webpack_require__(106);
const class_transformer_1 = __webpack_require__(19);
class InsertDoc {
}
exports.InsertDoc = InsertDoc;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertDoc.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [fact_interface_1.jCoordinateItem], description: 'Array of annotation objects' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => fact_interface_1.jCoordinateItem),
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
    __metadata("design:type", Number)
], InsertDoc.prototype, "nPage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Line number' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], InsertDoc.prototype, "nLine", void 0);
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
    (0, swagger_1.ApiProperty)({ example: "uuid-string", description: 'nDMLids for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], docID.prototype, "nDMLids", void 0);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WeblinkController = void 0;
const common_1 = __webpack_require__(3);
const weblink_service_1 = __webpack_require__(111);
const swagger_1 = __webpack_require__(6);
const web_interface_1 = __webpack_require__(116);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let WeblinkController = class WeblinkController {
    constructor(weblinkserivce) {
        this.weblinkserivce = weblinkserivce;
    }
    async insertWeb(body) {
        let res = await this.weblinkserivce.insertWeb(body);
        if (res && res.nWebid) {
            return {
                msg: 1,
                value: 'Weblink inserted successfully',
                nWebid: res["nWebid"]
            };
        }
        else {
            return {
                msg: -1,
                value: 'Weblink not inserted successfully. Webid not found.',
                error: res
            };
        }
    }
    async getWebData(url, nCaseid) {
        console.log('TEST LOCAL');
        return await this.weblinkserivce.getURLData(url, nCaseid);
    }
    async getWebLinkList(query) {
        try {
            query['ref'] = 2;
            let res = await this.weblinkserivce.getWebLinkList(query);
            return res;
        }
        catch (error) {
            return [{ msg: -1, value: 'Error in fetching weblink list', error: error }];
        }
    }
    async deleteWeb(body) {
        let res = await this.weblinkserivce.deleteWeb(body);
        return res[0];
    }
};
exports.WeblinkController = WeblinkController;
__decorate([
    (0, common_1.Post)('insertweb'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof web_interface_1.InsertWeb !== "undefined" && web_interface_1.InsertWeb) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], WeblinkController.prototype, "insertWeb", null);
__decorate([
    (0, common_1.Get)('getwebData'),
    __param(0, (0, common_1.Query)('url')),
    __param(1, (0, common_1.Query)('nCaseid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], WeblinkController.prototype, "getWebData", null);
__decorate([
    (0, common_1.Get)('getweblinklist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(77),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof web_interface_1.webListbyids !== "undefined" && web_interface_1.webListbyids) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], WeblinkController.prototype, "getWebLinkList", null);
__decorate([
    (0, common_1.Post)('deleteweb'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof web_interface_1.webDelete !== "undefined" && web_interface_1.webDelete) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], WeblinkController.prototype, "deleteWeb", null);
exports.WeblinkController = WeblinkController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('weblink'),
    (0, common_1.Controller)('weblink'),
    __metadata("design:paramtypes", [typeof (_a = typeof weblink_service_1.WeblinkService !== "undefined" && weblink_service_1.WeblinkService) === "function" ? _a : Object])
], WeblinkController);


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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WeblinkService = void 0;
const axios_1 = __webpack_require__(112);
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const rxjs_1 = __webpack_require__(113);
const cheerio = __webpack_require__(114);
const puppeteer = __webpack_require__(115);
const fs = __webpack_require__(15);
const path = __webpack_require__(16);
const config_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(29);
let WeblinkService = class WeblinkService {
    constructor(db, httpService, config, utility) {
        this.db = db;
        this.httpService = httpService;
        this.config = config;
        this.utility = utility;
    }
    async insertWeb(body) {
        let res = await this.db.executeRef('web_insert', body);
        if (res.success) {
            try {
                const notificationlist = res.data[0][0]["jNotify"] || [];
                if (notificationlist.length) {
                    this.utility.sendNotification(notificationlist, body.nMasterid);
                }
            }
            catch (error) {
            }
            try {
                return { msg: 1, value: 'Web inserted successfully', nWebid: res.data[0][0].nWebid };
            }
            catch (error) {
            }
        }
        else {
            return { msg: -1, value: 'Web insert failed', error: res.error };
        }
    }
    async deleteWeb(body) {
        let res = await this.db.executeRef('web_delete', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Web delete failed', error: res.error };
        }
    }
    async getURLData(url, nCaseid) {
        console.log('GENERATING META DATA OF URL', url);
        let matadata, favicon, screenshot;
        try {
            matadata = await this.getMetadata(url);
        }
        catch (error) {
            matadata = null;
        }
        try {
            favicon = await this.getFavicon(url);
        }
        catch (error) {
            favicon = null;
        }
        try {
            screenshot = await this.getScreenshot(url, nCaseid);
        }
        catch (error) {
            screenshot = null;
            console.log(error);
        }
        return { matadata, favicon, screenshot, testres: 1 };
    }
    async getMetadata(url) {
        try {
            const response$ = this.httpService.get(url, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }).pipe((0, rxjs_1.map)(response => response.data));
            const data = await (0, rxjs_1.firstValueFrom)(response$);
            const $ = cheerio.load(data);
            const metadata = {
                title: $('title').text(),
                description: $('meta[name="description"]').attr('content'),
                keywords: $('meta[name="keywords"]').attr('content'),
            };
            return metadata;
        }
        catch (error) {
            return null;
        }
    }
    async getFavicon(url) {
        try {
            debugger;
            const response$ = this.httpService.get(url, {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            }).pipe((0, rxjs_1.map)(response => response.data));
            const data = await (0, rxjs_1.firstValueFrom)(response$);
            const $ = cheerio.load(data);
            let favicon = $('link[rel="icon"]').attr('href') ||
                $('link[rel="shortcut icon"]').attr('href') ||
                $('link[rel="apple-touch-icon"]').attr('href') ||
                $('link[rel="mask-icon"]').attr('href');
            if (!favicon) {
                const defaultFavicon = new URL('/favicon.ico', url).href;
                const faviconExists = await this.checkUrlExists(defaultFavicon);
                if (faviconExists) {
                    return defaultFavicon;
                }
                return null;
            }
            if (!favicon.startsWith('http')) {
                favicon = new URL(favicon, url).href;
            }
            return favicon;
        }
        catch (error) {
            return null;
        }
    }
    async checkUrlExists(url) {
        try {
            const response = await this.httpService.head(url).toPromise();
            return response.status === 200;
        }
        catch (error) {
            return false;
        }
    }
    async getScreenshot(url, nCaseid) {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });
            const shpath = `screenshot/case${nCaseid}`;
            const screenshotDir = path.resolve(this.config.get('ASSETS'), shpath);
            if (!fs.existsSync(screenshotDir)) {
                await fs.mkdirSync(screenshotDir, { recursive: true });
            }
            const fileName = `web_${new Date().getTime()}.png`;
            const screenshotPath = path.resolve(screenshotDir, fileName);
            await page.screenshot({ path: screenshotPath });
            return `${shpath}/${fileName}`;
        }
        catch (error) {
            console.log(error);
            return null;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async getWebLinkList(query) {
        let res = await this.db.executeRef('web_link_list', query);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Fetch failed', error: res.error };
        }
    }
};
exports.WeblinkService = WeblinkService;
exports.WeblinkService = WeblinkService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof axios_1.HttpService !== "undefined" && axios_1.HttpService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object])
], WeblinkService);


/***/ }),
/* 112 */
/***/ ((module) => {

module.exports = require("@nestjs/axios");

/***/ }),
/* 113 */
/***/ ((module) => {

module.exports = require("rxjs");

/***/ }),
/* 114 */
/***/ ((module) => {

module.exports = require("cheerio");

/***/ }),
/* 115 */
/***/ ((module) => {

module.exports = require("puppeteer");

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.resDeleteWeb = exports.webDelete = exports.webListbyids = exports.getWebdata = exports.resInsertFact = exports.InsertWeb = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class InsertWeb {
}
exports.InsertWeb = InsertWeb;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "nBDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://fb.com/', description: 'Array of strings' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], InsertWeb.prototype, "cUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cTitle of strings' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", String)
], InsertWeb.prototype, "cTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cNote of strings' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "cNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "cFavicon", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[{}, {}]', description: 'Array of objects' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "jAn", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[1, 2, 3]', description: 'Array of team IDs' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'Type as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cImg as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "cImg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{}', description: 'cImg as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "jLinktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'cImg as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "jOT", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertWeb.prototype, "nMasterid", void 0);
class resInsertFact {
}
exports.resInsertFact = resInsertFact;
class getWebdata {
}
exports.getWebdata = getWebdata;
class webListbyids {
}
exports.webListbyids = webListbyids;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Unique identifier for the database entry' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], webListbyids.prototype, "jWebids", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], webListbyids.prototype, "nMasterid", void 0);
class webDelete {
}
exports.webDelete = webDelete;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Unique identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], webDelete.prototype, "nWebid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], webDelete.prototype, "nMasterid", void 0);
class resDeleteWeb {
}
exports.resDeleteWeb = resDeleteWeb;


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const task_service_1 = __webpack_require__(118);
const task_interface_1 = __webpack_require__(119);
let TaskController = class TaskController {
    constructor(taskService) {
        this.taskService = taskService;
    }
    async getCreate(body) {
        const res = await this.taskService.taskCreate(body);
        body.nTaskid = res.nTaskid;
        try {
            await this.taskService.createTaskDetail(body);
        }
        catch (error) { }
        try {
            await this.taskService.createTaskReminder(body);
        }
        catch (error) { }
        try {
            await this.taskService.createTaskAssign(body);
        }
        catch (error) { }
        return res;
    }
    async createTaskDetail(body) {
        return await this.taskService.createTaskDetail(body);
    }
    async taskDelete(body) {
        return await this.taskService.taskDelete(body);
    }
    async getTasklist(query) {
        return await this.taskService.getTasklist(query);
    }
    async getTaskDetail(query) {
        return await this.taskService.getTaskDetail(query);
    }
    async facttaskdelete(body) {
        return await this.taskService.facttaskdelete(body);
    }
    async updateTaskStatus(body) {
        return await this.taskService.updateTaskProgress(body);
    }
    async taskBuilder(body) {
        const res = await this.taskService.taskCreateV2(body);
        body.nTaskid = res.nTaskid;
        try {
            await this.taskService.createTaskDetailV2(body);
        }
        catch (error) { }
        try {
            await this.taskService.createTaskReminderV2(body);
        }
        catch (error) { }
        try {
            await this.taskService.createTaskAssignV2(body);
        }
        catch (error) { }
        return res;
    }
    async taskUpdateStatus(body) {
        return await this.taskService.updateTaskStatus(body);
        ;
    }
    async getTaskDetailV2(query) {
        return await this.taskService.getTaskDetailV2(query);
    }
};
exports.TaskController = TaskController;
__decorate([
    (0, common_1.Post)('taskBuilder'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof task_interface_1.TaskCreateReq !== "undefined" && task_interface_1.TaskCreateReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], TaskController.prototype, "getCreate", null);
__decorate([
    (0, common_1.Post)('updateTask'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof task_interface_1.TaskCreateReq !== "undefined" && task_interface_1.TaskCreateReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], TaskController.prototype, "createTaskDetail", null);
__decorate([
    (0, common_1.Post)('taskdelete'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof task_interface_1.TaskDetailReq !== "undefined" && task_interface_1.TaskDetailReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], TaskController.prototype, "taskDelete", null);
__decorate([
    (0, common_1.Get)('gettask'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof task_interface_1.TasklistReq !== "undefined" && task_interface_1.TasklistReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], TaskController.prototype, "getTasklist", null);
__decorate([
    (0, common_1.Get)('gettaskdetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof task_interface_1.TaskDetailReq !== "undefined" && task_interface_1.TaskDetailReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], TaskController.prototype, "getTaskDetail", null);
__decorate([
    (0, common_1.Post)('facttaskdelete'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof task_interface_1.TaskFactDetailReq !== "undefined" && task_interface_1.TaskFactDetailReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], TaskController.prototype, "facttaskdelete", null);
__decorate([
    (0, common_1.Post)('updateTaskProgress'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof task_interface_1.TaskUpdateProgressReq !== "undefined" && task_interface_1.TaskUpdateProgressReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], TaskController.prototype, "updateTaskStatus", null);
__decorate([
    (0, common_1.Post)('taskBuilder/v2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof task_interface_1.TaskCreateReqV2 !== "undefined" && task_interface_1.TaskCreateReqV2) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], TaskController.prototype, "taskBuilder", null);
__decorate([
    (0, common_1.Post)('taskBuilder/updatestatus'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof task_interface_1.taskUpdateStatusReq !== "undefined" && task_interface_1.taskUpdateStatusReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], TaskController.prototype, "taskUpdateStatus", null);
__decorate([
    (0, common_1.Get)('gettaskdetail/v2'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof task_interface_1.TaskDetailReq !== "undefined" && task_interface_1.TaskDetailReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], TaskController.prototype, "getTaskDetailV2", null);
exports.TaskController = TaskController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('task'),
    (0, common_1.Controller)('task'),
    __metadata("design:paramtypes", [typeof (_a = typeof task_service_1.TaskService !== "undefined" && task_service_1.TaskService) === "function" ? _a : Object])
], TaskController);


/***/ }),
/* 118 */
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
var TaskService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TaskService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let TaskService = TaskService_1 = class TaskService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.logger = new common_1.Logger(TaskService_1.name);
    }
    async taskCreate(body) {
        let res = await this.db.executeRef('task_insert', body);
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
    async createTaskDetail(body) {
        let res = await this.db.executeRef('task_insert_detail', body);
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
    async createTaskReminder(body) {
        let res = await this.db.executeRef('task_insert_reminder', body);
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
    async createTaskAssign(body) {
        let res = await this.db.executeRef('task_insert_assign', body);
        if (res.success) {
            try {
                try {
                    const notificationlist = res.data[0][0]['jNotify'] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) { }
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
    async taskDelete(body) {
        let res = await this.db.executeRef('task_delete', body);
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
    async getTasklist(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('task_list', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async getTaskDetail(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('task_detail', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async facttaskdelete(body) {
        let res = await this.db.executeRef('fact_task_delete', body);
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
    async updateTaskProgress(body) {
        let res = await this.db.executeRef('task_insert_detail', body);
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
    async taskCreateV2(body) {
        let res = await this.db.executeRef('task_insert', body);
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
    async createTaskDetailV2(body) {
        let res = await this.db.executeRef('task_insert_detail_v2', body);
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
    async createTaskReminderV2(body) {
        let res = await this.db.executeRef('task_insert_reminder_v2', body);
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
    async createTaskAssignV2(body) {
        let res = await this.db.executeRef('task_insert_assign_V2', body);
        if (res.success) {
            try {
                try {
                    const notificationlist = res.data[0][0]["jNotify"] || [];
                    if (notificationlist.length) {
                        this.utility.sendNotification(notificationlist, body.nMasterid);
                    }
                }
                catch (error) { }
                return res.data[0];
            }
            catch (error) {
            }
        }
        else {
        }
    }
    async getTaskDetailV2(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('task_detail_v2', query);
        if (res.success) {
            const taskDetail = res.data[0][0];
            let taskShared = res.data[1];
            try {
            }
            catch (error) {
            }
            return [[taskDetail], taskShared, res.data[2]];
        }
        else {
            return [{ msg: -1, value: 'Failed to fetch', error: res.error }];
        }
    }
    async updateTaskStatus(body) {
        let res = await this.db.executeRef('task_update_status', body);
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
exports.TaskService = TaskService;
exports.TaskService = TaskService = TaskService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], TaskService);


/***/ }),
/* 119 */
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
exports.taskUpdateStatusReq = exports.TaskCreateReqV2 = exports.TaskUpdateProgressReq = exports.TaskFactDetailReq = exports.TasklistRes = exports.TaskDetailReq = exports.TasklistReq = exports.TaskRes = exports.TaskCreateRes = exports.TaskCreateReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class TaskCreateReq {
}
exports.TaskCreateReq = TaskCreateReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Subject' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "cSubject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "cDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{"cAssign": true, "cRemind": false, "cStatus": false}', description: 'Email Notifications' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "jEmailnotify", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Priority' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskCreateReq.prototype, "nPriority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskCreateReq.prototype, "nProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{"dEnd": "2023-04-30T18:29:59.999Z","dStart": "2023-04-21T12:24:55.063Z","show_tm": "Apr 21 - 30","time_prges": 0}', description: 'Timeline', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "jTimeline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'Task Type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "cTasktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Reminder', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "jReminder", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Users', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Email Notification', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaskCreateReq.prototype, "bemail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'In-App Notification', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], TaskCreateReq.prototype, "binapp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReq.prototype, "nMasterid", void 0);
class TaskCreateRes {
}
exports.TaskCreateRes = TaskCreateRes;
class TaskRes {
}
exports.TaskRes = TaskRes;
class TasklistReq {
}
exports.TasklistReq = TasklistReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'Task Type' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TasklistReq.prototype, "cTasktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TasklistReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TasklistReq.prototype, "nMasterid", void 0);
class TaskDetailReq {
}
exports.TaskDetailReq = TaskDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskDetailReq.prototype, "nTaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskDetailReq.prototype, "nMasterid", void 0);
class TasklistRes {
}
exports.TasklistRes = TasklistRes;
class TaskFactDetailReq {
}
exports.TaskFactDetailReq = TaskFactDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskFactDetailReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskFactDetailReq.prototype, "nFSid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskFactDetailReq.prototype, "nMasterid", void 0);
class TaskUpdateProgressReq {
}
exports.TaskUpdateProgressReq = TaskUpdateProgressReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskUpdateProgressReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskUpdateProgressReq.prototype, "nProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskUpdateProgressReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskUpdateProgressReq.prototype, "nMasterid", void 0);
class TaskCreateReqV2 {
}
exports.TaskCreateReqV2 = TaskCreateReqV2;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Subject' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "cSubject", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example', description: 'Description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "cDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{"cAssign": true, "cRemind": false, "cStatus": false}', description: 'Email Notifications' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "jEmailnotify", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Priority' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskCreateReqV2.prototype, "nPriority", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskCreateReqV2.prototype, "nProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TaskCreateReqV2.prototype, "nStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{"dEnd": "2023-04-30T18:29:59.999Z","dStart": "2023-04-21T12:24:55.063Z","show_tm": "Apr 21 - 30","time_prges": 0}', description: 'Timeline', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "jTimeline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'F', description: 'Task Type' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "cTasktype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '[]', description: 'Users', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "jUsers", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2025-08-12 04:28 PM', description: 'dReminderDt' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "dReminderDt", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TaskCreateReqV2.prototype, "nMasterid", void 0);
class taskUpdateStatusReq {
}
exports.taskUpdateStatusReq = taskUpdateStatusReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskUpdateStatusReq.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], taskUpdateStatusReq.prototype, "nProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Progress' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], taskUpdateStatusReq.prototype, "nStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskUpdateStatusReq.prototype, "nMasterid", void 0);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TagController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const tag_service_1 = __webpack_require__(121);
const tag_interface_1 = __webpack_require__(122);
let TagController = class TagController {
    constructor(tagService) {
        this.tagService = tagService;
    }
    async tagBuilder(body) {
        const res = await this.tagService.tagBuilder(body);
        return res;
    }
    async taglist(query) {
        return await this.tagService.taglist(query);
    }
};
exports.TagController = TagController;
__decorate([
    (0, common_1.Post)('tagBuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof tag_interface_1.TagCreateReq !== "undefined" && tag_interface_1.TagCreateReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], TagController.prototype, "tagBuilder", null);
__decorate([
    (0, common_1.Get)('taglist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof tag_interface_1.TagReq !== "undefined" && tag_interface_1.TagReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], TagController.prototype, "taglist", null);
exports.TagController = TagController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('tag'),
    (0, common_1.Controller)('tag'),
    __metadata("design:paramtypes", [typeof (_a = typeof tag_service_1.TagService !== "undefined" && tag_service_1.TagService) === "function" ? _a : Object])
], TagController);


/***/ }),
/* 121 */
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
exports.TagService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let TagService = class TagService {
    constructor(db) {
        this.db = db;
    }
    async tagBuilder(body) {
        let res = await this.db.executeRef('tag_builder', body);
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
    async taglist(query) {
        query['ref'] = 2;
        let res = await this.db.executeRef('tag_list', query);
        if (res.success) {
            try {
                return res.data;
            }
            catch (error) {
                return { msg: -1, value: 'Failed ', error: res.error };
            }
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
};
exports.TagService = TagService;
exports.TagService = TagService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], TagService);


/***/ }),
/* 122 */
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
exports.TagReq = exports.TagCreateRes = exports.TagCreateReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class TagCreateReq {
}
exports.TagCreateReq = TagCreateReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Task ID', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "nTagid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Tag', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "cTag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Subtag', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "cSubtag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Color', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "cClr", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Color', required: false }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "cDesc", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Parenttag ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "nParenttagid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TagCreateReq.prototype, "nMasterid", void 0);
class TagCreateRes {
}
exports.TagCreateRes = TagCreateRes;
class TagReq {
}
exports.TagReq = TagReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TagReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], TagReq.prototype, "nMasterid", void 0);


/***/ }),
/* 123 */
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
const shared_module_1 = __webpack_require__(25);
const common_controller_1 = __webpack_require__(124);
const common_service_1 = __webpack_require__(125);
const jwt_middleware_1 = __webpack_require__(33);
const email_service_1 = __webpack_require__(127);
const email_controller_1 = __webpack_require__(143);
const config_1 = __webpack_require__(13);
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const common_service_1 = __webpack_require__(125);
const common_2 = __webpack_require__(126);
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonService = void 0;
const db_service_1 = __webpack_require__(10);
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
/* 126 */
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
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
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
/* 127 */
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
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const MsgReader_1 = __webpack_require__(128);
const decompressrtf_1 = __webpack_require__(140);
const iconvLite = __webpack_require__(132);
const rtf_stream_parser_1 = __webpack_require__(141);
const config_1 = __webpack_require__(13);
const cheerio = __webpack_require__(114);
const client_s3_1 = __webpack_require__(142);
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
/* 128 */
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
var const_1 = __importDefault(__webpack_require__(129));
var DataStream_1 = __importDefault(__webpack_require__(131));
var Reader_1 = __webpack_require__(133);
var Burner_1 = __webpack_require__(134);
var utils_1 = __webpack_require__(130);
var EntryStreamParser_1 = __webpack_require__(135);
var VerbStreamParser_1 = __webpack_require__(136);
var TZDEFINITIONParser_1 = __webpack_require__(137);
var TZREGParser_1 = __webpack_require__(138);
var AppointmentRecurParser_1 = __webpack_require__(139);
var AppointmentRecurParser_2 = __webpack_require__(139);
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
/* 129 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(130);
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
/* 130 */
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
/* 131 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var iconv = __webpack_require__(132);
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
/* 132 */
/***/ ((module) => {

module.exports = require("iconv-lite");

/***/ }),
/* 133 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reader = exports.TypeEnum = void 0;
var DataStream_1 = __importDefault(__webpack_require__(131));
var utils_1 = __webpack_require__(130);
var const_1 = __importDefault(__webpack_require__(129));
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
/* 134 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.burn = void 0;
var Reader_1 = __webpack_require__(133);
var DataStream_1 = __importDefault(__webpack_require__(131));
var const_1 = __importDefault(__webpack_require__(129));
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
/* 135 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var DataStream_1 = __importDefault(__webpack_require__(131));
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
/* 136 */
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
/* 137 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(130);
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
/* 138 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(130);
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
/* 139 */
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
/* 140 */
/***/ ((module) => {

module.exports = require("@kenjiuno/decompressrtf");

/***/ }),
/* 141 */
/***/ ((module) => {

module.exports = require("rtf-stream-parser");

/***/ }),
/* 142 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 143 */
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
const swagger_1 = __webpack_require__(6);
const common_2 = __webpack_require__(126);
const email_service_1 = __webpack_require__(127);
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
/* 144 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContactModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const contact_controller_1 = __webpack_require__(145);
const contact_service_1 = __webpack_require__(146);
const jwt_middleware_1 = __webpack_require__(33);
let ContactModule = class ContactModule {
    configure(consumer) {
        consumer.apply(jwt_middleware_1.JwtMiddleware).forRoutes(contact_controller_1.ContactController);
    }
};
exports.ContactModule = ContactModule;
exports.ContactModule = ContactModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [contact_controller_1.ContactController],
        providers: [contact_service_1.ContactService
        ],
    })
], ContactModule);


/***/ }),
/* 145 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContactController = void 0;
const common_1 = __webpack_require__(3);
const contact_service_1 = __webpack_require__(146);
const contact_interface_1 = __webpack_require__(147);
const swagger_1 = __webpack_require__(6);
const log_interceptor_1 = __webpack_require__(21);
const apiid_1 = __webpack_require__(24);
let ContactController = class ContactController {
    constructor(contactService) {
        this.contactService = contactService;
    }
    async getContactlist(query) {
        return await this.contactService.getContactlist(query);
    }
    async getContactDetail(query) {
        return await this.contactService.getContactDetail(query);
    }
    async contactFiles(query) {
        return await this.contactService.contactFiles(query);
    }
    async contactBuilder(body) {
        return await this.contactService.contactBuilder(body);
    }
    async contactDelete(body) {
        return await this.contactService.contactDelete(body);
    }
    async getCompanylist(query) {
        return await this.contactService.getCompanylist(query);
    }
    async companyBuilder(body) {
        return await this.contactService.companyBuilder(body);
    }
    async getContactrolelist(query) {
        return await this.contactService.getContactrolelist(query);
    }
    async contactroleBuilder(body) {
        return await this.contactService.contactroleBuilder(body);
    }
    async getContactCaserolelist(query) {
        return await this.contactService.getContactCaserolelist(query);
    }
    async caseContactroleBuilder(body) {
        return await this.contactService.caseContactroleBuilder(body);
    }
    async caseContactBuilder(body) {
        return await this.contactService.caseContactBuilder(body);
    }
    async getContactCompanylist(query) {
        return await this.contactService.getContactCompanylist(query);
    }
    async checkMentionExists(query) {
        return await this.contactService.checkMentionExists(query);
    }
};
exports.ContactController = ContactController;
__decorate([
    (0, common_1.Get)('getcontactlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof contact_interface_1.ContactlsReq !== "undefined" && contact_interface_1.ContactlsReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ContactController.prototype, "getContactlist", null);
__decorate([
    (0, common_1.Get)('getcontactdetail'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    (0, common_1.UseInterceptors)(log_interceptor_1.LogInterceptor),
    (0, apiid_1.ApiId)(81),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof contact_interface_1.ContactReq !== "undefined" && contact_interface_1.ContactReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ContactController.prototype, "getContactDetail", null);
__decorate([
    (0, common_1.Get)('contactfiles'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof contact_interface_1.ContactFileReq !== "undefined" && contact_interface_1.ContactFileReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], ContactController.prototype, "contactFiles", null);
__decorate([
    (0, common_1.Post)('contactbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof contact_interface_1.ContactBuilderReq !== "undefined" && contact_interface_1.ContactBuilderReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], ContactController.prototype, "contactBuilder", null);
__decorate([
    (0, common_1.Post)('contactdelete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof contact_interface_1.ContactDeleteReq !== "undefined" && contact_interface_1.ContactDeleteReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], ContactController.prototype, "contactDelete", null);
__decorate([
    (0, common_1.Get)('getcompanylist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof contact_interface_1.CompanyReq !== "undefined" && contact_interface_1.CompanyReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], ContactController.prototype, "getCompanylist", null);
__decorate([
    (0, common_1.Post)('companybuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof contact_interface_1.CompanyBuilderReq !== "undefined" && contact_interface_1.CompanyBuilderReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], ContactController.prototype, "companyBuilder", null);
__decorate([
    (0, common_1.Get)('getcontactrole'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof contact_interface_1.ContactroleReq !== "undefined" && contact_interface_1.ContactroleReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], ContactController.prototype, "getContactrolelist", null);
__decorate([
    (0, common_1.Post)('contactrolebuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof contact_interface_1.CRBuilderReq !== "undefined" && contact_interface_1.CRBuilderReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], ContactController.prototype, "contactroleBuilder", null);
__decorate([
    (0, common_1.Get)('getcontact/caseroles'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof contact_interface_1.ContactroleReq !== "undefined" && contact_interface_1.ContactroleReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], ContactController.prototype, "getContactCaserolelist", null);
__decorate([
    (0, common_1.Post)('casecontact/rolebuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof contact_interface_1.CRBuilderReq !== "undefined" && contact_interface_1.CRBuilderReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], ContactController.prototype, "caseContactroleBuilder", null);
__decorate([
    (0, common_1.Post)('case/contactbuilder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof contact_interface_1.CaseContactBuilderReq !== "undefined" && contact_interface_1.CaseContactBuilderReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], ContactController.prototype, "caseContactBuilder", null);
__decorate([
    (0, common_1.Get)('getcontact/companylist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof contact_interface_1.CompanyReq !== "undefined" && contact_interface_1.CompanyReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], ContactController.prototype, "getContactCompanylist", null);
__decorate([
    (0, common_1.Get)('mentiontag/exists'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof contact_interface_1.CheckMentionExistsReq !== "undefined" && contact_interface_1.CheckMentionExistsReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], ContactController.prototype, "checkMentionExists", null);
exports.ContactController = ContactController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('contact'),
    (0, common_1.Controller)('contact'),
    __metadata("design:paramtypes", [typeof (_a = typeof contact_service_1.ContactService !== "undefined" && contact_service_1.ContactService) === "function" ? _a : Object])
], ContactController);


/***/ }),
/* 146 */
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
exports.ContactService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let ContactService = class ContactService {
    constructor(db) {
        this.db = db;
    }
    async getContactlist(query) {
        let res = await this.db.executeRef('contact_list', query);
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
    async getContactDetail(query) {
        let res = await this.db.executeRef('contact_detail', query);
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
    async contactFiles(query) {
        let res = await this.db.executeRef('contact_files', query);
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
    async contactBuilder(body) {
        let res = await this.db.executeRef('contactbuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async contactDelete(body) {
        let res = await this.db.executeRef('contactbuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Deletion failed', error: res.error };
        }
    }
    async getCompanylist(query) {
        let res = await this.db.executeRef('company_list', query);
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
    async companyBuilder(body) {
        let res = await this.db.executeRef('companybuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getContactrolelist(query) {
        let res = await this.db.executeRef('contact_rolelist', query);
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
    async contactroleBuilder(body) {
        let res = await this.db.executeRef('contact_rolebuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getContactCaserolelist(query) {
        let res = await this.db.executeRef('contact_case_rolelist', query);
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
    async caseContactroleBuilder(body) {
        let res = await this.db.executeRef('contact_case_rolebuilder', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async caseContactBuilder(body) {
        let res = await this.db.executeRef('case_contactbuilder', body);
        if (res.success) {
            const contact = res.data[0][0];
            return contact;
        }
        else {
            return { msg: -1, value: 'Creation failed', error: res.error };
        }
    }
    async getContactCompanylist(query) {
        let res = await this.db.executeRef('contact_company_list', query);
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
    async checkMentionExists(query) {
        let res = await this.db.executeRef('contact_mentiontag_exists', query);
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
};
exports.ContactService = ContactService;
exports.ContactService = ContactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], ContactService);


/***/ }),
/* 147 */
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
exports.CheckMentionExistsReq = exports.CaseContactBuilderReq = exports.ContactroleRes = exports.ContactroleReq = exports.CRBuilderRes = exports.CRBuilderReq = exports.CompanyRes = exports.CompanyReq = exports.CompanyBuilderRes = exports.CompanyBuilderReq = exports.ContactFileRes = exports.ContactFileReq = exports.ContactRes = exports.ContactReq = exports.ContactlsRes = exports.ContactlsReq = exports.ContactBuilderRes = exports.ContactDeleteReq = exports.ContactBuilderReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class ContactBuilderReq {
}
exports.ContactBuilderReq = ContactBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nContactid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cProfile', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cProfile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cFname' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cFname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cLname' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cLname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cAlias', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cAlias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cLinkedin', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cLinkedin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cEmail' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cCountrycode' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cCountrycode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cMobile' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cMobile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nTZid', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? 0 : Number(value)),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ContactBuilderReq.prototype, "nTZid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nRoleid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCompanyid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "nCompanyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cNote', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cIso', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cIso", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'permission' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'cType' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactBuilderReq.prototype, "nMasterid", void 0);
class ContactDeleteReq {
}
exports.ContactDeleteReq = ContactDeleteReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nContactid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactDeleteReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'D', description: 'permission' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactDeleteReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactDeleteReq.prototype, "nMasterid", void 0);
class ContactBuilderRes {
}
exports.ContactBuilderRes = ContactBuilderRes;
class ContactlsReq {
}
exports.ContactlsReq = ContactlsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactlsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'cType' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactlsReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'nBundledetailid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactlsReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'nSesid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactlsReq.prototype, "nSesid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactlsReq.prototype, "nMasterid", void 0);
class ContactlsRes {
}
exports.ContactlsRes = ContactlsRes;
class ContactReq {
}
exports.ContactReq = ContactReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nContactid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactReq.prototype, "nContactid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactReq.prototype, "nMasterid", void 0);
class ContactRes {
}
exports.ContactRes = ContactRes;
class ContactFileReq {
}
exports.ContactFileReq = ContactFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSectionid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ContactFileReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nContactid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactFileReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'search', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ContactFileReq.prototype, "cSearch", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactFileReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactFileReq.prototype, "nMasterid", void 0);
class ContactFileRes {
}
exports.ContactFileRes = ContactFileRes;
class CompanyBuilderReq {
}
exports.CompanyBuilderReq = CompanyBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCompanyid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyBuilderReq.prototype, "nCompanyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cCompany' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompanyBuilderReq.prototype, "cCompany", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'permission' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompanyBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyBuilderReq.prototype, "nMasterid", void 0);
class CompanyBuilderRes {
}
exports.CompanyBuilderRes = CompanyBuilderRes;
class CompanyReq {
}
exports.CompanyReq = CompanyReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyReq.prototype, "nMasterid", void 0);
class CompanyRes {
}
exports.CompanyRes = CompanyRes;
class CRBuilderReq {
}
exports.CRBuilderReq = CRBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CRBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCRoleid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CRBuilderReq.prototype, "nCRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cRole' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CRBuilderReq.prototype, "cRole", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'permission' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CRBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CRBuilderReq.prototype, "nMasterid", void 0);
class CRBuilderRes {
}
exports.CRBuilderRes = CRBuilderRes;
class ContactroleReq {
}
exports.ContactroleReq = ContactroleReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactroleReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ContactroleReq.prototype, "nMasterid", void 0);
class ContactroleRes {
}
exports.ContactroleRes = ContactroleRes;
class CaseContactBuilderReq {
}
exports.CaseContactBuilderReq = CaseContactBuilderReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nContactid' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cProfile', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cProfile", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cFname' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cFname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cLname' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cLname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cEmail', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cOccupation', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cOccupation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nRoleid', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nRoleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCompanyid', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nCompanyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nPartyid', required: false }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nPartyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cNote', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cNote", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'permission' }),
    (0, class_transformer_1.Transform)(({ value }) => (value === null || value === undefined) ? '' : String(value)),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "permission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: 'cType' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseContactBuilderReq.prototype, "nMasterid", void 0);
class CheckMentionExistsReq {
}
exports.CheckMentionExistsReq = CheckMentionExistsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nCaseid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CheckMentionExistsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user_001', description: 'cMentiontag' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckMentionExistsReq.prototype, "cMentiontag", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'cPermission' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CheckMentionExistsReq.prototype, "cPermission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CheckMentionExistsReq.prototype, "nMasterid", void 0);


/***/ }),
/* 148 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NavigationModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const navigation_controller_1 = __webpack_require__(149);
const navigation_service_1 = __webpack_require__(151);
const jwt_middleware_1 = __webpack_require__(33);
const filter_service_1 = __webpack_require__(152);
let NavigationModule = class NavigationModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(navigation_controller_1.NavigationController);
    }
};
exports.NavigationModule = NavigationModule;
exports.NavigationModule = NavigationModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [navigation_controller_1.NavigationController],
        providers: [navigation_service_1.NavigationService, filter_service_1.FilterService],
    })
], NavigationModule);


/***/ }),
/* 149 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NavigationController = void 0;
const common_1 = __webpack_require__(3);
const navigation_interface_1 = __webpack_require__(150);
const navigation_service_1 = __webpack_require__(151);
const swagger_1 = __webpack_require__(6);
let NavigationController = class NavigationController {
    constructor(navigationService) {
        this.navigationService = navigationService;
    }
    async checkNavigationData(query) {
        return await this.navigationService.checkNavigationData(query);
    }
    async getFactlist(query) {
        return await this.navigationService.getFactlist(query);
    }
    async getCompanylist(query) {
        return await this.navigationService.getCompanylist(query);
    }
    async getFactByCompany(query) {
        return await this.navigationService.getFactByCompany(query);
    }
    async getFactlinks(query) {
        return await this.navigationService.getFactlinks(query);
    }
    async getDocLinks(query) {
        return await this.navigationService.getDoclinks(query);
    }
    async getWebLinks(query) {
        return await this.navigationService.getWebLinks(query);
    }
    async getFacttasks(query) {
        return await this.navigationService.getFacttasks(query);
    }
    async getFiletasks(query) {
        return await this.navigationService.getFiletasks(query);
    }
    async getIncommingDocs(query) {
        return await this.navigationService.getIncommingLinks(query);
    }
    async getoutgoingDocs(query) {
        return await this.navigationService.getOutgoingLinks(query);
    }
    async getdestinationDocs(query) {
        return await this.navigationService.getdestinationDocs(query);
    }
    async getdocinfoDocs(query) {
        return await this.navigationService.getdocinfoDocs(query);
    }
    async getwebInfoDocs(query) {
        return await this.navigationService.getwebInfoDocs(query);
    }
    async sharedusers(query) {
        return await this.navigationService.getShareds(query);
    }
    async getAll(query) {
        return await this.navigationService.getAll(query);
    }
    async getAllLinks(query) {
        return await this.navigationService.getAllLinks(query);
    }
};
exports.NavigationController = NavigationController;
__decorate([
    (0, common_1.Get)('checknavigationdata'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof navigation_interface_1.CheckNavigationReq !== "undefined" && navigation_interface_1.CheckNavigationReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], NavigationController.prototype, "checkNavigationData", null);
__decorate([
    (0, common_1.Get)('factlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], NavigationController.prototype, "getFactlist", null);
__decorate([
    (0, common_1.Get)('factcompanylist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof navigation_interface_1.CompanyParams !== "undefined" && navigation_interface_1.CompanyParams) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], NavigationController.prototype, "getCompanylist", null);
__decorate([
    (0, common_1.Get)('factbycompany'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof navigation_interface_1.FactCompParams !== "undefined" && navigation_interface_1.FactCompParams) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], NavigationController.prototype, "getFactByCompany", null);
__decorate([
    (0, common_1.Get)('factlinklist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], NavigationController.prototype, "getFactlinks", null);
__decorate([
    (0, common_1.Get)('doclinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], NavigationController.prototype, "getDocLinks", null);
__decorate([
    (0, common_1.Get)('weblinks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], NavigationController.prototype, "getWebLinks", null);
__decorate([
    (0, common_1.Get)('facttasks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], NavigationController.prototype, "getFacttasks", null);
__decorate([
    (0, common_1.Get)('filetasks'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof navigation_interface_1.FactListReq !== "undefined" && navigation_interface_1.FactListReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], NavigationController.prototype, "getFiletasks", null);
__decorate([
    (0, common_1.Get)('filter/incomming'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof navigation_interface_1.filterReq !== "undefined" && navigation_interface_1.filterReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], NavigationController.prototype, "getIncommingDocs", null);
__decorate([
    (0, common_1.Get)('filter/outgoing'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof navigation_interface_1.filterReq !== "undefined" && navigation_interface_1.filterReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], NavigationController.prototype, "getoutgoingDocs", null);
__decorate([
    (0, common_1.Get)('filter/destination'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_z = typeof navigation_interface_1.filterReq !== "undefined" && navigation_interface_1.filterReq) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], NavigationController.prototype, "getdestinationDocs", null);
__decorate([
    (0, common_1.Get)('filter/docinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_1 = typeof navigation_interface_1.filterReq !== "undefined" && navigation_interface_1.filterReq) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], NavigationController.prototype, "getdocinfoDocs", null);
__decorate([
    (0, common_1.Get)('filter/webinfo'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_3 = typeof navigation_interface_1.filterReq !== "undefined" && navigation_interface_1.filterReq) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], NavigationController.prototype, "getwebInfoDocs", null);
__decorate([
    (0, common_1.Get)('sharedusers'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_5 = typeof navigation_interface_1.shareusers !== "undefined" && navigation_interface_1.shareusers) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], NavigationController.prototype, "sharedusers", null);
__decorate([
    (0, common_1.Get)('all'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_7 = typeof navigation_interface_1.AllListReq !== "undefined" && navigation_interface_1.AllListReq) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], NavigationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Get)('alllinks/list'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_9 = typeof navigation_interface_1.AllLinkListReq !== "undefined" && navigation_interface_1.AllLinkListReq) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], NavigationController.prototype, "getAllLinks", null);
exports.NavigationController = NavigationController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('navigation'),
    (0, common_1.Controller)('navigation'),
    __metadata("design:paramtypes", [typeof (_a = typeof navigation_service_1.NavigationService !== "undefined" && navigation_service_1.NavigationService) === "function" ? _a : Object])
], NavigationController);


/***/ }),
/* 150 */
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
exports.AllLinkListReq = exports.AllListReq = exports.shareusers = exports.filterReq = exports.filterList = exports.FactLinkDetail = exports.FactlinkListRes = exports.FactCompParams = exports.CompanyParams = exports.FactCompanyRes = exports.LinkDetail = exports.IssueDetail = exports.FactDetail = exports.FactListRes = exports.FactListReq = exports.CheckNavigationRes = exports.CheckNavigationReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class CheckNavigationReq {
}
exports.CheckNavigationReq = CheckNavigationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CheckNavigationReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CheckNavigationReq.prototype, "nMasterid", void 0);
class CheckNavigationRes {
}
exports.CheckNavigationRes = CheckNavigationRes;
class FactListReq {
}
exports.FactListReq = FactListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactListReq.prototype, "bIsTranscipt", void 0);
class FactListRes {
}
exports.FactListRes = FactListRes;
class FactDetail {
}
exports.FactDetail = FactDetail;
class IssueDetail {
}
exports.IssueDetail = IssueDetail;
class LinkDetail {
}
exports.LinkDetail = LinkDetail;
class FactCompanyRes {
}
exports.FactCompanyRes = FactCompanyRes;
class CompanyParams {
}
exports.CompanyParams = CompanyParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CompanyParams.prototype, "bIsTranscipt", void 0);
class FactCompParams {
}
exports.FactCompParams = FactCompParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactCompParams.prototype, "bIsTranscipt", void 0);
class FactlinkListRes {
}
exports.FactlinkListRes = FactlinkListRes;
class FactLinkDetail {
}
exports.FactLinkDetail = FactLinkDetail;
class filterList {
}
exports.filterList = filterList;
class filterReq {
}
exports.filterReq = filterReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filterReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], filterReq.prototype, "nMasterid", void 0);
class shareusers {
}
exports.shareusers = shareusers;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nDocid id identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareusers.prototype, "nId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cType', description: 'cType for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], shareusers.prototype, "cType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], shareusers.prototype, "nMasterid", void 0);
class AllListReq {
}
exports.AllListReq = AllListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AllListReq.prototype, "bIsTranscipt", void 0);
class AllLinkListReq {
}
exports.AllLinkListReq = AllLinkListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllLinkListReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ASC', description: 'Sort type identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllLinkListReq.prototype, "cSorttype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Category', description: 'Sort by identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => value, { toClassOnly: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllLinkListReq.prototype, "cSortby", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number identifier for the database entry' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AllLinkListReq.prototype, "nPageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Filter', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AllLinkListReq.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllLinkListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AllLinkListReq.prototype, "bIsTranscipt", void 0);


/***/ }),
/* 151 */
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
exports.NavigationService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const filter_service_1 = __webpack_require__(152);
let NavigationService = class NavigationService {
    constructor(db, navigation) {
        this.db = db;
        this.navigation = navigation;
    }
    async checkNavigationData(query) {
        let res = await this.db.executeRef('navigate_checkdata', query);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async getFactlist(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlist', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getCompanylist(query) {
        let res = await this.db.executeRef('navigate_fact_companies', query);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFactByCompany(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_facts_bycompany', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFactlinks(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlinks', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getDoclinks(query) {
        let res = await this.db.executeRef('navigate_doclist', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getWebLinks(query) {
        let res = await this.db.executeRef('navigate_weblinks', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFacttasks(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_task_facts', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getFiletasks(query) {
        query['ref'] = 2;
        let res = await this.db.executeRef('navigate_task_files', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getIncommingLinks(query) {
        let res = await this.db.executeRef('filter_incomming_docs', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getOutgoingLinks(query) {
        let res = await this.db.executeRef('filter_outgoing_docs', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getdestinationDocs(query) {
        let res = await this.db.executeRef('filter_destinations_docs', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getdocinfoDocs(query) {
        let res = await this.db.executeRef('filter_docinfo', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getwebInfoDocs(query) {
        let res = await this.db.executeRef('filter_weblink', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getShareds(query) {
        let res = await this.db.executeRef('navigate_shared_users', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getAll(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
    async getAllLinks(query) {
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_get_all_links', query);
        if (res.success) {
            return res.data;
        }
        else {
            return [{ msg: -1, value: 'Failed ', error: res.error }];
        }
    }
};
exports.NavigationService = NavigationService;
exports.NavigationService = NavigationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof filter_service_1.FilterService !== "undefined" && filter_service_1.FilterService) === "function" ? _b : Object])
], NavigationService);


/***/ }),
/* 152 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilterService = void 0;
const common_1 = __webpack_require__(3);
let FilterService = class FilterService {
    getFilter(jFilter, mdl) {
        try {
            const list = JSON.parse(jFilter);
            let whereClause = '';
            list.forEach((item) => {
                if (item.type == 'CLAIM') {
                    whereClause += ` @> to_jsonb() '${item.value}'`;
                }
            });
        }
        catch (error) {
        }
    }
};
exports.FilterService = FilterService;
exports.FilterService = FilterService = __decorate([
    (0, common_1.Injectable)()
], FilterService);


/***/ }),
/* 153 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkspaceModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const jwt_middleware_1 = __webpack_require__(33);
const workspace_controller_1 = __webpack_require__(154);
const workspace_service_1 = __webpack_require__(155);
const sidenav_controller_1 = __webpack_require__(157);
const sidenav_service_1 = __webpack_require__(159);
let WorkspaceModule = class WorkspaceModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(workspace_controller_1.WorkspaceController, sidenav_controller_1.SidenavController);
    }
};
exports.WorkspaceModule = WorkspaceModule;
exports.WorkspaceModule = WorkspaceModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [workspace_controller_1.WorkspaceController, sidenav_controller_1.SidenavController],
        providers: [workspace_service_1.WorkspaceService, sidenav_service_1.SidenavService,
        ]
    })
], WorkspaceModule);


/***/ }),
/* 154 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WorkspaceController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const workspace_service_1 = __webpack_require__(155);
const workspace_interface_1 = __webpack_require__(156);
let WorkspaceController = class WorkspaceController {
    constructor(workspaceservice) {
        this.workspaceservice = workspaceservice;
    }
    async getFactList(query) {
        return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_list');
    }
    async getFactIssue(query) {
        return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_issues');
    }
    async getFactFiles(query) {
        return await this.workspaceservice.getDataByFunction(query, 'workspace_fact_files');
    }
    async getIssueList(query) {
        return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_issues_list');
    }
    async getContactList(query) {
        return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_contacts_list');
    }
    async getOrganize(query) {
        return await this.workspaceservice.getIssueContactByFunction(query, 'workspace_organize');
    }
};
exports.WorkspaceController = WorkspaceController;
__decorate([
    (0, common_1.Get)('facts/list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof workspace_interface_1.workspacefactmdl !== "undefined" && workspace_interface_1.workspacefactmdl) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], WorkspaceController.prototype, "getFactList", null);
__decorate([
    (0, common_1.Get)('facts/issues'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof workspace_interface_1.workspacefactmdl !== "undefined" && workspace_interface_1.workspacefactmdl) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], WorkspaceController.prototype, "getFactIssue", null);
__decorate([
    (0, common_1.Get)('facts/files'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof workspace_interface_1.workspacefactmdl !== "undefined" && workspace_interface_1.workspacefactmdl) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], WorkspaceController.prototype, "getFactFiles", null);
__decorate([
    (0, common_1.Get)('issues'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof workspace_interface_1.workspaceIssueContact !== "undefined" && workspace_interface_1.workspaceIssueContact) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], WorkspaceController.prototype, "getIssueList", null);
__decorate([
    (0, common_1.Get)('contacts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof workspace_interface_1.workspaceIssueContact !== "undefined" && workspace_interface_1.workspaceIssueContact) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], WorkspaceController.prototype, "getContactList", null);
__decorate([
    (0, common_1.Get)('organize'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof workspace_interface_1.workspaceIssueContact !== "undefined" && workspace_interface_1.workspaceIssueContact) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], WorkspaceController.prototype, "getOrganize", null);
exports.WorkspaceController = WorkspaceController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('workspace'),
    (0, common_1.Controller)('workspace'),
    __metadata("design:paramtypes", [typeof (_a = typeof workspace_service_1.WorkspaceService !== "undefined" && workspace_service_1.WorkspaceService) === "function" ? _a : Object])
], WorkspaceController);


/***/ }),
/* 155 */
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
exports.WorkspaceService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let WorkspaceService = class WorkspaceService {
    constructor(db) {
        this.db = db;
    }
    async getDataByFunction(query, fn_name) {
        let res = await this.db.executeRef(fn_name, query);
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
    async getIssueContactByFunction(query, fn_name) {
        let res = await this.db.executeRef(fn_name, query);
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
};
exports.WorkspaceService = WorkspaceService;
exports.WorkspaceService = WorkspaceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], WorkspaceService);


/***/ }),
/* 156 */
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
exports.workspaceIssueContact = exports.workspacefactmdl = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class workspacefactmdl {
}
exports.workspacefactmdl = workspacefactmdl;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "nContactid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "nIssueid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'ALL/F/QF', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "cFacttype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspacefactmdl.prototype, "nMasterid", void 0);
class workspaceIssueContact {
}
exports.workspaceIssueContact = workspaceIssueContact;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspaceIssueContact.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], workspaceIssueContact.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], workspaceIssueContact.prototype, "nMasterid", void 0);


/***/ }),
/* 157 */
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SidenavController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const sidenav_interface_1 = __webpack_require__(158);
const sidenav_service_1 = __webpack_require__(159);
let SidenavController = class SidenavController {
    constructor(sidenavservice) {
        this.sidenavservice = sidenavservice;
    }
    async getFactIssueList(query) {
        return await this.sidenavservice.getDataByFunction(query, 'sidenave_tasks_facttaskissues');
    }
    async getFactTasks(query) {
        return await this.sidenavservice.getDataByFunction(query, 'sidenave_tasks_filetasks');
    }
    async getTaskByIssue(query) {
        return await this.sidenavservice.getTaskByIssue(query);
    }
    async getfileContactList(query) {
        return await this.sidenavservice.getFileContactByFunction(query, 'sidenav_filecontacts_list');
    }
    async getTaskFiles(query) {
        return await this.sidenavservice.getTaskFiles(query);
    }
    async updateTaskStatus(body) {
        return await this.sidenavservice.updateTaskStatus(body);
    }
};
exports.SidenavController = SidenavController;
__decorate([
    (0, common_1.Get)('facts/issues'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof sidenav_interface_1.sidenaveData !== "undefined" && sidenav_interface_1.sidenaveData) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], SidenavController.prototype, "getFactIssueList", null);
__decorate([
    (0, common_1.Get)('file/tasks'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof sidenav_interface_1.sidenaveData !== "undefined" && sidenav_interface_1.sidenaveData) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], SidenavController.prototype, "getFactTasks", null);
__decorate([
    (0, common_1.Get)('tasksbyissue'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof sidenav_interface_1.tasksbyissues !== "undefined" && sidenav_interface_1.tasksbyissues) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], SidenavController.prototype, "getTaskByIssue", null);
__decorate([
    (0, common_1.Get)('contact/filecontacts'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof sidenav_interface_1.fileContact !== "undefined" && sidenav_interface_1.fileContact) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], SidenavController.prototype, "getfileContactList", null);
__decorate([
    (0, common_1.Get)('filetask/files'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof sidenav_interface_1.taskFileReq !== "undefined" && sidenav_interface_1.taskFileReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], SidenavController.prototype, "getTaskFiles", null);
__decorate([
    (0, common_1.Post)('task/status/update'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof sidenav_interface_1.taskStatusUpdate !== "undefined" && sidenav_interface_1.taskStatusUpdate) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], SidenavController.prototype, "updateTaskStatus", null);
exports.SidenavController = SidenavController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('sidenav'),
    (0, common_1.Controller)('sidenav'),
    __metadata("design:paramtypes", [typeof (_a = typeof sidenav_service_1.SidenavService !== "undefined" && sidenav_service_1.SidenavService) === "function" ? _a : Object])
], SidenavController);


/***/ }),
/* 158 */
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
exports.taskStatusUpdate = exports.taskFileReq = exports.sidenaveData = exports.tasksbyissues = exports.fileContact = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class fileContact {
}
exports.fileContact = fileContact;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileContact.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileContact.prototype, "jFilter", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'search', description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileContact.prototype, "cSearch", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileContact.prototype, "nMasterid", void 0);
class tasksbyissues {
}
exports.tasksbyissues = tasksbyissues;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], tasksbyissues.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], tasksbyissues.prototype, "nIssueid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], tasksbyissues.prototype, "nMasterid", void 0);
class sidenaveData {
}
exports.sidenaveData = sidenaveData;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sidenaveData.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], sidenaveData.prototype, "jFilter", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], sidenaveData.prototype, "nMasterid", void 0);
class taskFileReq {
}
exports.taskFileReq = taskFileReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskFileReq.prototype, "nTaskid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskFileReq.prototype, "nMasterid", void 0);
class taskStatusUpdate {
}
exports.taskStatusUpdate = taskStatusUpdate;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskStatusUpdate.prototype, "nTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'C', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], taskStatusUpdate.prototype, "cStatus", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], taskStatusUpdate.prototype, "nMasterid", void 0);


/***/ }),
/* 159 */
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
exports.SidenavService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let SidenavService = class SidenavService {
    constructor(db) {
        this.db = db;
    }
    async getTaskByIssue(query) {
        query["ref"] = 3;
        let res = await this.db.executeRef('sidenave_tasks_facttasks', query);
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
    async getDataByFunction(query, fn_name) {
        if (fn_name == 'sidenave_tasks_filetasks') {
            query["ref"] = 3;
        }
        if (fn_name == 'sidenave_tasks_facttaskissues') {
        }
        let res = await this.db.executeRef(fn_name, query);
        if (res.success) {
            try {
                return fn_name == 'sidenave_tasks_filetasks' ? res.data : res.data[0];
            }
            catch (error) {
                return [];
            }
        }
        else {
            return [];
        }
    }
    async getFileContactByFunction(query, fn_name) {
        let res = await this.db.executeRef(fn_name, query);
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
    async updateTaskStatus(body) {
        let res = await this.db.executeRef('sidenav_task_update_status', body);
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
    async getTaskFiles(body) {
        let res = await this.db.executeRef('sidenave_tasks_filetasks_files', body);
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
};
exports.SidenavService = SidenavService;
exports.SidenavService = SidenavService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], SidenavService);


/***/ }),
/* 160 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CaseactivityModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const caseactivity_controller_1 = __webpack_require__(161);
const caseactivity_service_1 = __webpack_require__(162);
const jwt_middleware_1 = __webpack_require__(33);
const downloadexcel_service_1 = __webpack_require__(163);
let CaseactivityModule = class CaseactivityModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(caseactivity_controller_1.CaseactivityController);
    }
};
exports.CaseactivityModule = CaseactivityModule;
exports.CaseactivityModule = CaseactivityModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [caseactivity_controller_1.CaseactivityController],
        providers: [caseactivity_service_1.CaseactivityService, downloadexcel_service_1.DownloadexcelService]
    })
], CaseactivityModule);


/***/ }),
/* 161 */
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
exports.CaseactivityController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const caseactivity_service_1 = __webpack_require__(162);
const caseactivity_interface_1 = __webpack_require__(167);
let CaseactivityController = class CaseactivityController {
    constructor(caseactivityService) {
        this.caseactivityService = caseactivityService;
    }
    async getCasels(Query) {
        return this.caseactivityService.getCasels(Query);
    }
    async getUserls(Query) {
        return this.caseactivityService.getUserls(Query);
    }
    async getUserlog(Query) {
        return this.caseactivityService.getUserLog(Query);
    }
    async getSessionls(Query) {
        return this.caseactivityService.getSessionls(Query);
    }
    async getConnections(Query) {
        return this.caseactivityService.getConnections(Query);
    }
    async getBundledata(Query) {
        return this.caseactivityService.getBundledata(Query);
    }
    async getScandata(Query) {
        return this.caseactivityService.getScandata(Query);
    }
    async getStorageSize(Query) {
        return this.caseactivityService.getStorageSize(Query);
    }
    async getScan_paginate(query) {
        return await this.caseactivityService.getScan_paginate(query);
    }
    async downlaodscan_paginate(query) {
        return await this.caseactivityService.downlaodscan_paginate(query);
    }
    async downloadFile(query, res) {
        return await this.caseactivityService.downloadFile(query, res);
    }
};
exports.CaseactivityController = CaseactivityController;
__decorate([
    (0, common_1.Get)('getcasels'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof caseactivity_interface_1.CaseLSReq !== "undefined" && caseactivity_interface_1.CaseLSReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CaseactivityController.prototype, "getCasels", null);
__decorate([
    (0, common_1.Get)('getuserls'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof caseactivity_interface_1.UserLSReq !== "undefined" && caseactivity_interface_1.UserLSReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CaseactivityController.prototype, "getUserls", null);
__decorate([
    (0, common_1.Get)('getuserlog'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof caseactivity_interface_1.UserLlogReq !== "undefined" && caseactivity_interface_1.UserLlogReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CaseactivityController.prototype, "getUserlog", null);
__decorate([
    (0, common_1.Get)('getsessionls'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof caseactivity_interface_1.UserLSReq !== "undefined" && caseactivity_interface_1.UserLSReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], CaseactivityController.prototype, "getSessionls", null);
__decorate([
    (0, common_1.Get)('getConnections'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof caseactivity_interface_1.ConnectionsReq !== "undefined" && caseactivity_interface_1.ConnectionsReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], CaseactivityController.prototype, "getConnections", null);
__decorate([
    (0, common_1.Get)('getBundledata'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof caseactivity_interface_1.UserLSReq !== "undefined" && caseactivity_interface_1.UserLSReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], CaseactivityController.prototype, "getBundledata", null);
__decorate([
    (0, common_1.Get)('getScandata'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof caseactivity_interface_1.UserLSReq !== "undefined" && caseactivity_interface_1.UserLSReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], CaseactivityController.prototype, "getScandata", null);
__decorate([
    (0, common_1.Get)('getStoragedata'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof caseactivity_interface_1.UserLSReq !== "undefined" && caseactivity_interface_1.UserLSReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], CaseactivityController.prototype, "getStorageSize", null);
__decorate([
    (0, common_1.Get)('scan_paginate'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof caseactivity_interface_1.ScanPaginationReq !== "undefined" && caseactivity_interface_1.ScanPaginationReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], CaseactivityController.prototype, "getScan_paginate", null);
__decorate([
    (0, common_1.Get)('downlaodscan_paginate'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof caseactivity_interface_1.ScanPaginationReq !== "undefined" && caseactivity_interface_1.ScanPaginationReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], CaseactivityController.prototype, "downlaodscan_paginate", null);
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof caseactivity_interface_1.dwdpathReq !== "undefined" && caseactivity_interface_1.dwdpathReq) === "function" ? _x : Object, typeof (_y = typeof Response !== "undefined" && Response) === "function" ? _y : Object]),
    __metadata("design:returntype", Promise)
], CaseactivityController.prototype, "downloadFile", null);
exports.CaseactivityController = CaseactivityController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('caseactivity'),
    (0, common_1.Controller)('caseactivity'),
    __metadata("design:paramtypes", [typeof (_a = typeof caseactivity_service_1.CaseactivityService !== "undefined" && caseactivity_service_1.CaseactivityService) === "function" ? _a : Object])
], CaseactivityController);


/***/ }),
/* 162 */
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
exports.CaseactivityService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(10);
const downloadexcel_service_1 = __webpack_require__(163);
const client_s3_1 = __webpack_require__(142);
const https_1 = __webpack_require__(165);
const node_http_handler_1 = __webpack_require__(166);
const config_1 = __webpack_require__(13);
const path = __webpack_require__(16);
let CaseactivityService = class CaseactivityService {
    constructor(db, dwexcel, config) {
        this.db = db;
        this.dwexcel = dwexcel;
        this.config = config;
        this.bucketName = this.config.get('DO_SPACES_BUCKET_NAME');
        this.filepath = this.config.get('ASSETS');
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
    async getCasels(body) {
        let res = await this.db.executeRef('activity_casels', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUserls(body) {
        let res = await this.db.executeRef('activity_userls', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getUserLog(body) {
        let res = await this.db.executeRef('activity_userLog', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getSessionls(body) {
        let res = await this.db.executeRef('activity_session', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getConnections(body) {
        body['ref'] = 2;
        let res = await this.db.executeRef('activity_connections', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getBundledata(body) {
        body['ref'] = 2;
        let res = await this.db.executeRef('activity_bundledata', body);
        if (res.success) {
            return res.data;
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getScandata(body) {
        let res = await this.db.executeRef('activity_scandata', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async getScan_paginate(body) {
        let res = await this.db.executeRef('activity_paginate_scan', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    async downlaodscan_paginate(body) {
        let res = await this.db.executeRef('activity_paginate_scandata', body);
        if (res.success) {
            const cPath = await this.generateExcel(body.nCaseid, res.data[0]);
            return { msg: 1, value: 'Success', cPath: cPath };
        }
        else {
            return { msg: -1, value: 'Failed to fetch', error: res.error };
        }
    }
    generateExcel(nCaseid, data) {
        return this.dwexcel.generateExcel(nCaseid, data);
    }
    async getStorageSize(body) {
        const folderpath = `doc/case${body.nCaseid}/`;
        console.log('folderpath', folderpath);
        const res = await this.getFolderSize(folderpath);
        return res;
    }
    async getFolderSize(folderPath) {
        try {
            let continuationToken = undefined;
            let totalSize = 0;
            do {
                const response = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({
                    Bucket: this.bucketName,
                    Prefix: folderPath,
                    ContinuationToken: continuationToken,
                    Delimiter: "/",
                }));
                console.log(response.Contents.length);
                response.Contents?.forEach((object) => {
                    totalSize += object.Size || 0;
                });
                continuationToken = response.NextContinuationToken;
            } while (continuationToken);
            console.log('totalSize', totalSize);
            return { msg: 1, totalSize: totalSize };
        }
        catch (error) {
            console.error('Error fetching folder size from S3:', error);
            return { msg: -1 };
        }
    }
    downloadFile(query, res) {
        console.log('Download batch file req', query);
        const fileuri = query.cPath;
        const filePath = path.join(this.filepath, fileuri);
        res.download(filePath, fileuri, (err) => {
            if (err) {
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        });
    }
};
exports.CaseactivityService = CaseactivityService;
exports.CaseactivityService = CaseactivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof downloadexcel_service_1.DownloadexcelService !== "undefined" && downloadexcel_service_1.DownloadexcelService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], CaseactivityService);


/***/ }),
/* 163 */
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
exports.DownloadexcelService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(13);
const ExcelJS = __webpack_require__(164);
const fs = __webpack_require__(15);
let DownloadexcelService = class DownloadexcelService {
    constructor(config) {
        this.config = config;
        this.filepath = this.config.get('ASSETS');
    }
    async generateExcel(nCaseid, data) {
        const column = [
            { header: "Bundle", key: "cBundletag" },
            { header: "Tab", key: "cTab" },
            { header: "Name", key: "cFilename" },
            { header: "Date", key: "dIntrestDt" },
            { header: "Description", key: "cDesc" },
            { header: "Page", key: "cRefpage" },
            { header: "Exhibit", key: "cExhibitno" },
            { header: "Status", key: "cPaginated" }
        ];
        const dirPath = `${this.config.get('ASSETS')}doc/case${nCaseid}/`;
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`Directory created: ${dirPath}`);
        }
        else {
            console.log(`Directory already exists: ${dirPath}`);
        }
        const cPath = `doc/case${nCaseid}/Pagination_${new Date().getTime()}.xlsx`;
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sheet1');
        worksheet.columns = column;
        worksheet.addRows(data);
        return new Promise((resolve, reject) => {
            workbook.xlsx.writeFile(`${this.filepath}${cPath}`)
                .then(() => {
                resolve(cPath);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
};
exports.DownloadexcelService = DownloadexcelService;
exports.DownloadexcelService = DownloadexcelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], DownloadexcelService);


/***/ }),
/* 164 */
/***/ ((module) => {

module.exports = require("exceljs");

/***/ }),
/* 165 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 166 */
/***/ ((module) => {

module.exports = require("@aws-sdk/node-http-handler");

/***/ }),
/* 167 */
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
exports.dwdpathReq = exports.ScanPaginationReq = exports.ConnectionsReq = exports.UserLlogReq = exports.UserLSReq = exports.CaseLSReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
class CaseLSReq {
}
exports.CaseLSReq = CaseLSReq;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CaseLSReq.prototype, "nMasterid", void 0);
class UserLSReq {
}
exports.UserLSReq = UserLSReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserLSReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserLSReq.prototype, "nMasterid", void 0);
class UserLlogReq {
}
exports.UserLlogReq = UserLlogReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserLlogReq.prototype, "nUserid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserLlogReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", typeof (_a = typeof Number !== "undefined" && Number) === "function" ? _a : Object)
], UserLlogReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserLlogReq.prototype, "startDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UserLlogReq.prototype, "endDt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Page Number', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'pageNumber must be a number conforming to the specified constraints' }),
    __metadata("design:type", typeof (_b = typeof Number !== "undefined" && Number) === "function" ? _b : Object)
], UserLlogReq.prototype, "pageNumber", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UserLlogReq.prototype, "nMasterid", void 0);
class ConnectionsReq {
}
exports.ConnectionsReq = ConnectionsReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ConnectionsReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ConnectionsReq.prototype, "nSesid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ConnectionsReq.prototype, "nMasterid", void 0);
class ScanPaginationReq {
}
exports.ScanPaginationReq = ScanPaginationReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ScanPaginationReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ScanPaginationReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ScanPaginationReq.prototype, "jBundles", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ScanPaginationReq.prototype, "nMasterid", void 0);
class dwdpathReq {
}
exports.dwdpathReq = dwdpathReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], dwdpathReq.prototype, "cPath", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], dwdpathReq.prototype, "nMasterid", void 0);


/***/ }),
/* 168 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HelpcenterModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const helpcenter_controller_1 = __webpack_require__(169);
const jwt_middleware_1 = __webpack_require__(33);
const helpcenter_service_1 = __webpack_require__(170);
let HelpcenterModule = class HelpcenterModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(helpcenter_controller_1.HelpcenterController);
    }
};
exports.HelpcenterModule = HelpcenterModule;
exports.HelpcenterModule = HelpcenterModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [helpcenter_controller_1.HelpcenterController],
        providers: [helpcenter_service_1.HelpcenterService]
    })
], HelpcenterModule);


/***/ }),
/* 169 */
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
exports.HelpcenterController = void 0;
const common_1 = __webpack_require__(3);
const helpcenter_service_1 = __webpack_require__(170);
const swagger_1 = __webpack_require__(6);
const helpcenter_interface_1 = __webpack_require__(171);
let HelpcenterController = class HelpcenterController {
    constructor(helpCenterService) {
        this.helpCenterService = helpCenterService;
    }
    async getkeywords(query) {
        return await this.helpCenterService.getkeywords(query);
    }
    async commonTopics(query) {
        return await this.helpCenterService.commonTopics(query);
    }
    async moduleList(query) {
        return await this.helpCenterService.moduleList(query);
    }
    async subModuleList(query) {
        return await this.helpCenterService.subModuleList(query);
    }
    async faqlist(query) {
        return await this.helpCenterService.faqlist(query);
    }
    async insertfeedback(body) {
        return await this.helpCenterService.insertfeedback(body);
    }
    async moduleIU(body) {
        return await this.helpCenterService.moduleIU(body);
    }
    async subModuleIU(body) {
        return await this.helpCenterService.subModuleIU(body);
    }
    async moduleDetail(query) {
        return await this.helpCenterService.moduleDetail(query);
    }
    async subModuleDetail(query) {
        return await this.helpCenterService.subModuleDetail(query);
    }
    async searchKey(body) {
        return await this.helpCenterService.searchKey(body);
    }
};
exports.HelpcenterController = HelpcenterController;
__decorate([
    (0, common_1.Get)('getkeywords'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof helpcenter_interface_1.GetKeyWordReq !== "undefined" && helpcenter_interface_1.GetKeyWordReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], HelpcenterController.prototype, "getkeywords", null);
__decorate([
    (0, common_1.Get)('getcommontopics'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof helpcenter_interface_1.GetCommonTopicsReq !== "undefined" && helpcenter_interface_1.GetCommonTopicsReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], HelpcenterController.prototype, "commonTopics", null);
__decorate([
    (0, common_1.Get)('getmodulelist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof helpcenter_interface_1.GetModuleListReq !== "undefined" && helpcenter_interface_1.GetModuleListReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], HelpcenterController.prototype, "moduleList", null);
__decorate([
    (0, common_1.Get)('getsubmodulelist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof helpcenter_interface_1.GetSubModuleListReq !== "undefined" && helpcenter_interface_1.GetSubModuleListReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], HelpcenterController.prototype, "subModuleList", null);
__decorate([
    (0, common_1.Get)('getfaqlist'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof helpcenter_interface_1.GetFaqListReq !== "undefined" && helpcenter_interface_1.GetFaqListReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], HelpcenterController.prototype, "faqlist", null);
__decorate([
    (0, common_1.Post)('insertfeedback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_m = typeof helpcenter_interface_1.InsertFeedbackReq !== "undefined" && helpcenter_interface_1.InsertFeedbackReq) === "function" ? _m : Object]),
    __metadata("design:returntype", typeof (_o = typeof Promise !== "undefined" && Promise) === "function" ? _o : Object)
], HelpcenterController.prototype, "insertfeedback", null);
__decorate([
    (0, common_1.Post)('module_iu'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_p = typeof helpcenter_interface_1.ModuleIUReq !== "undefined" && helpcenter_interface_1.ModuleIUReq) === "function" ? _p : Object]),
    __metadata("design:returntype", typeof (_q = typeof Promise !== "undefined" && Promise) === "function" ? _q : Object)
], HelpcenterController.prototype, "moduleIU", null);
__decorate([
    (0, common_1.Post)('sub_module_iu'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof helpcenter_interface_1.SubModuleIUReq !== "undefined" && helpcenter_interface_1.SubModuleIUReq) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], HelpcenterController.prototype, "subModuleIU", null);
__decorate([
    (0, common_1.Get)('module_detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_t = typeof helpcenter_interface_1.ModuleDetailReq !== "undefined" && helpcenter_interface_1.ModuleDetailReq) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], HelpcenterController.prototype, "moduleDetail", null);
__decorate([
    (0, common_1.Get)('sub_module_detail'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_v = typeof helpcenter_interface_1.SubModuleDetailReq !== "undefined" && helpcenter_interface_1.SubModuleDetailReq) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], HelpcenterController.prototype, "subModuleDetail", null);
__decorate([
    (0, common_1.Post)('search_key'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_x = typeof helpcenter_interface_1.SearchKeyReq !== "undefined" && helpcenter_interface_1.SearchKeyReq) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], HelpcenterController.prototype, "searchKey", null);
exports.HelpcenterController = HelpcenterController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('helpcenter'),
    (0, common_1.Controller)('helpcenter'),
    __metadata("design:paramtypes", [typeof (_a = typeof helpcenter_service_1.HelpcenterService !== "undefined" && helpcenter_service_1.HelpcenterService) === "function" ? _a : Object])
], HelpcenterController);


/***/ }),
/* 170 */
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
exports.HelpcenterService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
let HelpcenterService = class HelpcenterService {
    constructor(db) {
        this.db = db;
        this.schema = 'helpcenter';
    }
    async getkeywords(query) {
        let res = await this.db.executeRef('help_get_keywords', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async commonTopics(query) {
        let res = await this.db.executeRef('help_get_common_topic', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async moduleList(query) {
        let res = await this.db.executeRef('help_module_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async subModuleList(query) {
        let res = await this.db.executeRef('help_sub_module_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async faqlist(query) {
        let res = await this.db.executeRef('help_get_faq_list', query, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return [];
        }
    }
    async insertfeedback(body) {
        let res = await this.db.executeRef('help_insert_feedback', body, this.schema);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async moduleIU(body) {
        let res = await this.db.executeRef('help_module_iu', body, this.schema);
        if (res.success && res.data[0]?.length > 0) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async subModuleIU(body) {
        let res = await this.db.executeRef('help_sub_module_iu', body, this.schema);
        if (res.success && res.data[0]?.length > 0) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async moduleDetail(query) {
        let res = await this.db.executeRef('help_module_detail', query, this.schema);
        if (res.success && res.data[0]?.length > 0) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async subModuleDetail(query) {
        let res = await this.db.executeRef('help_sub_module_detail', query, this.schema);
        if (res.success && res.data[0]?.length > 0) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed ', error: res.error };
        }
    }
    async searchKey(body) {
        let res = await this.db.executeRef('help_search_key', body, this.schema);
        if (res.success && res.data[0]?.length > 0) {
            return true;
        }
        else {
            return false;
        }
    }
};
exports.HelpcenterService = HelpcenterService;
exports.HelpcenterService = HelpcenterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], HelpcenterService);


/***/ }),
/* 171 */
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
exports.SearchKeyReq = exports.SubModuleDetailReq = exports.ModuleDetailReq = exports.SubModuleIUReq = exports.ModuleIUReq = exports.InsertFeedbackReq = exports.GetFaqListReq = exports.GetSubModuleListReq = exports.GetModuleListReq = exports.GetCommonTopicsReq = exports.GetKeyWordReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class GetKeyWordReq {
}
exports.GetKeyWordReq = GetKeyWordReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'S', description: 'cKey as a string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetKeyWordReq.prototype, "cKey", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetKeyWordReq.prototype, "nMasterid", void 0);
class GetCommonTopicsReq {
}
exports.GetCommonTopicsReq = GetCommonTopicsReq;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetCommonTopicsReq.prototype, "nMasterid", void 0);
class GetModuleListReq {
}
exports.GetModuleListReq = GetModuleListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nKeyid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetModuleListReq.prototype, "nKeyid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetModuleListReq.prototype, "nMasterid", void 0);
class GetSubModuleListReq {
}
exports.GetSubModuleListReq = GetSubModuleListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nKeyid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetSubModuleListReq.prototype, "nKeyid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nMainid', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetSubModuleListReq.prototype, "nMainid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetSubModuleListReq.prototype, "nMasterid", void 0);
class GetFaqListReq {
}
exports.GetFaqListReq = GetFaqListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'A', description: 'cQType' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetFaqListReq.prototype, "cQType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], GetFaqListReq.prototype, "nMasterid", void 0);
class InsertFeedbackReq {
}
exports.InsertFeedbackReq = InsertFeedbackReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nFaqid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFeedbackReq.prototype, "nFaqid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsHelpful' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], InsertFeedbackReq.prototype, "bIsHelpful", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], InsertFeedbackReq.prototype, "nMasterid", void 0);
class ModuleIUReq {
}
exports.ModuleIUReq = ModuleIUReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cTitle', description: 'cTitle' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ModuleIUReq.prototype, "cTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'cPermission' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ModuleIUReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cImage', description: 'cImage' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ModuleIUReq.prototype, "cImage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nMainid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ModuleIUReq.prototype, "nMainid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ModuleIUReq.prototype, "nMasterid", void 0);
class SubModuleIUReq {
}
exports.SubModuleIUReq = SubModuleIUReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 2, description: 'nMainid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "nMainid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'nSMid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "nSMid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cTitle', description: 'cTitle' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "cTitle", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cLink', description: 'cLink' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "cLink", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'I', description: 'cPermission' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "cPermission", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'cDescription', description: 'cDescription' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "cDescription", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '["tag1", "tag2"]', description: 'jTags' }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubModuleIUReq.prototype, "jTags", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SubModuleIUReq.prototype, "nMasterid", void 0);
class ModuleDetailReq {
}
exports.ModuleDetailReq = ModuleDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nMainid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ModuleDetailReq.prototype, "nMainid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ModuleDetailReq.prototype, "nMasterid", void 0);
class SubModuleDetailReq {
}
exports.SubModuleDetailReq = SubModuleDetailReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nSMid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SubModuleDetailReq.prototype, "nSMid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SubModuleDetailReq.prototype, "nMasterid", void 0);
class SearchKeyReq {
}
exports.SearchKeyReq = SearchKeyReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5, description: 'nSMid' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SearchKeyReq.prototype, "nSMid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], SearchKeyReq.prototype, "nMasterid", void 0);


/***/ }),
/* 172 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MarknevModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const marknav_controller_1 = __webpack_require__(173);
const marknav_service_1 = __webpack_require__(174);
const jwt_middleware_1 = __webpack_require__(33);
let MarknevModule = class MarknevModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(marknav_controller_1.MarknavController);
    }
};
exports.MarknevModule = MarknevModule;
exports.MarknevModule = MarknevModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [marknav_controller_1.MarknavController],
        providers: [marknav_service_1.MarknavService],
    })
], MarknevModule);


/***/ }),
/* 173 */
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
exports.MarknavController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const marknav_service_1 = __webpack_require__(174);
const marknav_interface_1 = __webpack_require__(175);
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
        return await this.markNavService.getDoclinks(query);
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
exports.MarknavController = MarknavController = __decorate([
    (0, swagger_1.ApiTags)('Marknav'),
    (0, common_1.Controller)('marknav'),
    __metadata("design:paramtypes", [typeof (_a = typeof marknav_service_1.MarknavService !== "undefined" && marknav_service_1.MarknavService) === "function" ? _a : Object])
], MarknavController);


/***/ }),
/* 174 */
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
const db_service_1 = __webpack_require__(10);
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
        query['ref'] = 3;
        let res = await this.db.executeRef('navigate_factlinks', query, this.realTimeSchema);
        if (res.success) {
            return res.data;
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
};
exports.MarknavService = MarknavService;
exports.MarknavService = MarknavService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], MarknavService);


/***/ }),
/* 175 */
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
exports.FactLinkListReq = exports.DocListReq = exports.quickMarkParams = exports.FactCompParams = exports.CompanyParams = exports.FactListReq = exports.AllListReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_transformer_1 = __webpack_require__(19);
const class_validator_1 = __webpack_require__(20);
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
class AllListReq {
}
exports.AllListReq = AllListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], AllListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], AllListReq.prototype, "bIsTranscipt", void 0);
class FactListReq {
}
exports.FactListReq = FactListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactListReq.prototype, "bIsTranscipt", void 0);
class CompanyParams {
}
exports.CompanyParams = CompanyParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid identifier for the database entry' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CompanyParams.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CompanyParams.prototype, "bIsTranscipt", void 0);
class FactCompParams {
}
exports.FactCompParams = FactCompParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactCompParams.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactCompParams.prototype, "bIsTranscipt", void 0);
class quickMarkParams {
}
exports.quickMarkParams = quickMarkParams;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'nBundledetailid identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: true }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], quickMarkParams.prototype, "bIsTranscipt", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], quickMarkParams.prototype, "nMasterid", void 0);
class DocListReq {
}
exports.DocListReq = DocListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocListReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DocListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], DocListReq.prototype, "bIsTranscipt", void 0);
class FactLinkListReq {
}
exports.FactLinkListReq = FactLinkListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Bundle detail id identifier for the database entry' }),
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
    (0, swagger_1.ApiProperty)({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "nUserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], FactLinkListReq.prototype, "nMasterid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'bIsTranscipt', required: false }),
    (0, class_transformer_1.Transform)(({ value }) => value === 'true' || value === true, { toClassOnly: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], FactLinkListReq.prototype, "bIsTranscipt", void 0);


/***/ }),
/* 176 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommentsModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(25);
const comments_controller_1 = __webpack_require__(177);
const jwt_middleware_1 = __webpack_require__(33);
const comments_service_1 = __webpack_require__(178);
let CommentsModule = class CommentsModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(comments_controller_1.CommentsController);
    }
};
exports.CommentsModule = CommentsModule;
exports.CommentsModule = CommentsModule = __decorate([
    (0, common_1.Module)({
        imports: [shared_module_1.SharedModule],
        controllers: [comments_controller_1.CommentsController],
        providers: [comments_service_1.CommentsService],
    })
], CommentsModule);


/***/ }),
/* 177 */
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
exports.CommentsController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const comments_service_1 = __webpack_require__(178);
const comment_interface_1 = __webpack_require__(179);
let CommentsController = class CommentsController {
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    async getCommentsGrid(query) {
        return this.commentsService.getCommentsGrid(query);
    }
    async getCommentsUsers(query) {
        return this.commentsService.getCommentsUsers(query);
    }
    async addComment(body) {
        body.cPermission = 'N';
        return this.commentsService.manageComment(body);
    }
    async editComment(body) {
        body.cPermission = 'E';
        return this.commentsService.manageComment(body);
    }
    async deleteComment(body) {
        body.cPermission = 'D';
        return this.commentsService.manageComment(body);
    }
};
exports.CommentsController = CommentsController;
__decorate([
    (0, common_1.Get)('grid'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof comment_interface_1.CommentListReq !== "undefined" && comment_interface_1.CommentListReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], CommentsController.prototype, "getCommentsGrid", null);
__decorate([
    (0, common_1.Get)('users'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof comment_interface_1.CommentUsersReq !== "undefined" && comment_interface_1.CommentUsersReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], CommentsController.prototype, "getCommentsUsers", null);
__decorate([
    (0, common_1.Post)('add'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof comment_interface_1.CommentManageReq !== "undefined" && comment_interface_1.CommentManageReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], CommentsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Put)('edit'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof comment_interface_1.CommentManageReq !== "undefined" && comment_interface_1.CommentManageReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], CommentsController.prototype, "editComment", null);
__decorate([
    (0, common_1.Delete)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof comment_interface_1.CommentManageReq !== "undefined" && comment_interface_1.CommentManageReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], CommentsController.prototype, "deleteComment", null);
exports.CommentsController = CommentsController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('Comments'),
    (0, common_1.Controller)('comments'),
    __metadata("design:paramtypes", [typeof (_a = typeof comments_service_1.CommentsService !== "undefined" && comments_service_1.CommentsService) === "function" ? _a : Object])
], CommentsController);


/***/ }),
/* 178 */
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
var CommentsService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommentsService = void 0;
const db_service_1 = __webpack_require__(10);
const common_1 = __webpack_require__(3);
const utility_service_1 = __webpack_require__(29);
let CommentsService = CommentsService_1 = class CommentsService {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.realTimeSchema = 'realtime';
        this.logger = new common_1.Logger(CommentsService_1.name);
    }
    async manageComment(body) {
        try {
            const res = await this.db.executeRef('manage_comments', body, this.realTimeSchema);
            if (res.success) {
                try {
                    if (res.data[0][0]["msg"] == 1) {
                        const msgDetail = await this.getCommentsGrid({ nMasterid: body.nMasterid, nFSid: body.nFSid, nCid: res.data[0][0].nCid });
                        if (msgDetail?.length) {
                            this.emitMsg(msgDetail[0], body.cPermission);
                        }
                        else {
                            this.logger.error('No Msg Detail Found for nCid:', res.data[0][0].nCid);
                        }
                    }
                }
                catch (error) {
                    this.logger.error(error);
                }
                return res.data[0][0];
            }
            else {
                throw new common_1.BadRequestException({
                    msg: -1,
                    value: 'Failed to manage comment',
                    error: res.error
                });
            }
        }
        catch (error) {
            this.logger.error(error);
            throw new common_1.InternalServerErrorException({
                msg: -1,
                value: 'Failed to manage comment',
                error: error.message
            });
        }
    }
    async getCommentsGrid(query) {
        try {
            const res = await this.db.executeRef('comments_grid', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                throw new common_1.BadRequestException({
                    msg: -1,
                    value: 'Failed to get comments grid',
                    error: res.error
                });
            }
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                msg: -1,
                value: 'Failed to get comments grid',
                error: error.message
            });
        }
    }
    async getCommentsUsers(query) {
        try {
            const res = await this.db.executeRef('comments_users', query, this.realTimeSchema);
            if (res.success) {
                return res.data[0];
            }
            else {
                throw new common_1.BadRequestException({
                    msg: -1,
                    value: 'Failed to get comments users',
                    error: res.error
                });
            }
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                msg: -1,
                value: 'Failed to get comments users',
                error: error.message
            });
        }
    }
    emitMsg(msgData, permission) {
        try {
            delete msgData.msg;
            delete msgData.value;
        }
        catch (error) {
        }
        const data = {
            type: 'FACT-MESSAGE',
            ...msgData,
            permission: permission
        };
        this.utility.emit(data, `factsheet-comments`);
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = CommentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], CommentsService);


/***/ }),
/* 179 */
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
exports.CommentUsersReq = exports.CommentListReq = exports.CommentCreationRes = exports.CommentManageReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(18);
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(20);
class CommentManageReq {
}
exports.CommentManageReq = CommentManageReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'This is a comment message', description: 'Comment message text' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "cMsg", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '17017e35-cb39-4af6-b9bf-110bfdf7a95a', description: 'Comment ID (required for Edit/Delete)' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "nCid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000000', description: 'Bundle detail id identifier for the database entry' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '00000000-0000-0000-0000-000000000000', description: 'Session ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "nSesid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Permission' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "cPermission", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentManageReq.prototype, "nMasterid", void 0);
class CommentCreationRes {
}
exports.CommentCreationRes = CommentCreationRes;
class CommentListReq {
}
exports.CommentListReq = CommentListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentListReq.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentListReq.prototype, "nCid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11111111-1111-1111-1111-111111111111', description: 'Master User ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentListReq.prototype, "nMasterid", void 0);
class CommentUsersReq {
}
exports.CommentUsersReq = CommentUsersReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentUsersReq.prototype, "nFSid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '11111111-1111-1111-1111-111111111111', description: 'Master User ID' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], CommentUsersReq.prototype, "nMasterid", void 0);


/***/ }),
/* 180 */
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
/* 181 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 182 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 183 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 184 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(31);
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
/* 185 */
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
const coreapi_module_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const exception_1 = __webpack_require__(180);
const compression = __webpack_require__(181);
const cookieParser = __webpack_require__(182);
const dotenv = __webpack_require__(183);
const kafka_config_1 = __webpack_require__(184);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(13);
const bodyParser = __webpack_require__(185);
async function bootstrap() {
    const app = await core_1.NestFactory.create(coreapi_module_1.CoreapiModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('coreapi-group'));
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
        .addServer(process.env.NODE_ENV === 'production' ? '/coreapi' : '')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    if (process.env.NODE_ENV === 'production') {
        console.log('PRODUCTION MODE');
    }
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new exception_1.HttpErrorFilter());
    const configService = app.get(config_1.ConfigService);
    await app.listen(configService.get('PORT_COREAPI'));
}
bootstrap();

})();

/******/ })()
;