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
exports.ExportModule = void 0;
const common_1 = __webpack_require__(3);
const export_controller_1 = __webpack_require__(4);
const export_service_1 = __webpack_require__(5);
const export_file_controller_1 = __webpack_require__(13);
const export_file_service_1 = __webpack_require__(14);
const common_module_1 = __webpack_require__(32);
const global_1 = __webpack_require__(63);
const shared_module_1 = __webpack_require__(69);
const jwt_middleware_1 = __webpack_require__(43);
const utility_service_1 = __webpack_require__(19);
const kafka_shared_service_1 = __webpack_require__(20);
const scaleannots_service_1 = __webpack_require__(25);
const scalecontent_service_1 = __webpack_require__(26);
const log_service_1 = __webpack_require__(27);
const winston_module_1 = __webpack_require__(70);
const kafka_module_1 = __webpack_require__(39);
const pagination_processor_1 = __webpack_require__(71);
const bull_1 = __webpack_require__(72);
const config_1 = __webpack_require__(18);
const s3_module_1 = __webpack_require__(74);
const data_export_controller_1 = __webpack_require__(77);
const data_export_service_1 = __webpack_require__(78);
const data_export_processor_1 = __webpack_require__(81);
const renderers_service_1 = __webpack_require__(82);
let ExportModule = class ExportModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(export_file_controller_1.ExportFileController, data_export_controller_1.DataExportController);
    }
};
exports.ExportModule = ExportModule;
exports.ExportModule = ExportModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kafka_module_1.KafkaModule.register('etabella-export', 'export-group'),
            shared_module_1.SharedModule, common_module_1.CommonModule, global_1.GlobalModule,
            winston_module_1.WinstonConfigModule.forRoot('fileexport'),
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
                name: 'export-queue',
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
                name: 'data-export',
                defaultJobOptions: { removeOnComplete: true, removeOnFail: 50, attempts: 2 },
                limiter: { max: 200, duration: 60000 },
            }),
            s3_module_1.ExportS3Module,
        ],
        controllers: [export_controller_1.ExportController, export_file_controller_1.ExportFileController, data_export_controller_1.DataExportController],
        providers: [export_service_1.ExportService, export_file_service_1.ExportFileService, kafka_shared_service_1.KafkaGlobalService, utility_service_1.UtilityService, scaleannots_service_1.ScaleannotsService, scalecontent_service_1.ScalecontentService,
            log_service_1.LogService, pagination_processor_1.exportProcessor,
            data_export_service_1.DataExportService, data_export_processor_1.DataExportProcessor, renderers_service_1.DataExportRenderer
        ],
    })
], ExportModule);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportController = void 0;
const common_1 = __webpack_require__(3);
const export_service_1 = __webpack_require__(5);
const export_interface_1 = __webpack_require__(8);
let ExportController = class ExportController {
    constructor(exportService) {
        this.exportService = exportService;
    }
    async downloadFile(query, res) {
        console.log('downloadFile', query);
        return await this.exportService.downloadFile(query, res);
    }
};
exports.ExportController = ExportController;
__decorate([
    (0, common_1.Get)('download'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof export_interface_1.DownloadpathReq !== "undefined" && export_interface_1.DownloadpathReq) === "function" ? _b : Object, typeof (_c = typeof Response !== "undefined" && Response) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ExportController.prototype, "downloadFile", null);
exports.ExportController = ExportController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _a : Object])
], ExportController);


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
exports.ExportService = void 0;
const common_1 = __webpack_require__(3);
const path = __webpack_require__(6);
const fs = __webpack_require__(7);
const FILEPATH = './assets';
let ExportService = class ExportService {
    constructor() { }
    async onModuleInit() {
    }
    getHello() {
        return 'Hello World!';
    }
    async downloadFile(query, res) {
        try {
            const fileuri = query.cPath;
            const filename = query.cFilename ? query.cFilename : query.cPath;
            console.log('fileuri', fileuri);
            const filePath = path.join(FILEPATH, fileuri);
            if (!fs.existsSync(filePath)) {
                return res.status(404).send({
                    message: 'File not found.',
                });
            }
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filename)}`);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
            fileStream.on('error', (err) => {
                if (!res.headersSent) {
                    res.status(500).send({
                        message: 'Could not download the file. ' + err,
                    });
                }
            });
        }
        catch (err) {
            if (!res.headersSent) {
                res.status(500).send({
                    message: 'Could not download the file. ' + err,
                });
            }
        }
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ExportService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("fs");

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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RetryExport = exports.removeProcess = exports.ExportFilewithAnnot = exports.DownloadpathReq = exports.ExportResponse = exports.FileListResponce = exports.ExportDataReq = exports.ExportProcess = exports.FileDataReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(9);
const swagger_1 = __webpack_require__(12);
const class_transformer_1 = __webpack_require__(10);
const class_validator_1 = __webpack_require__(11);
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
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nMasterid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], FileDataReq.prototype, "nMasterid", void 0);
class ExportProcess {
}
exports.ExportProcess = ExportProcess;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nExportid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], ExportProcess.prototype, "nExportid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Is bIsRetry', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportProcess.prototype, "bIsRetry", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportProcess.prototype, "nMasterid", void 0);
class ExportDataReq {
}
exports.ExportDataReq = ExportDataReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Case id' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nCaseid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], ExportDataReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export detail id' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nEDid must be a number conforming to the specified constraints' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ExportDataReq.prototype, "nEDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nExportid must be a number conforming to the specified constraints' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], ExportDataReq.prototype, "nExportid", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nMasterid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], ExportDataReq.prototype, "nMasterid", void 0);
class FileListResponce {
}
exports.FileListResponce = FileListResponce;
class ExportResponse {
}
exports.ExportResponse = ExportResponse;
class DownloadpathReq {
}
exports.DownloadpathReq = DownloadpathReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: true }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DownloadpathReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'is apply to all', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DownloadpathReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DownloadpathReq.prototype, "v", void 0);
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
    (0, swagger_1.ApiProperty)({
        example: ['96614464-c24f-4ab5-871e-bcab5724bf15'],
        description: 'Bundle detail id\'s',
        required: false,
    }),
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
    (0, swagger_1.ApiProperty)({ example: '', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Include team members\' annotations (default: only the caller\'s own)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ExportFilewithAnnot.prototype, "bTeamMarks", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ExportFilewithAnnot.prototype, "nMasterid", void 0);
class removeProcess {
}
exports.removeProcess = removeProcess;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Export id' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nExportid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], removeProcess.prototype, "nExportid", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)({}, { message: 'nMasterid must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], removeProcess.prototype, "nMasterid", void 0);
class RetryExport {
}
exports.RetryExport = RetryExport;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '1', description: 'Export id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", Number)
], RetryExport.prototype, "nExportid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], RetryExport.prototype, "nMasterid", void 0);


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(10);
const class_validator_1 = __webpack_require__(11);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 13 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
exports.ExportFileController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(12);
const export_file_service_1 = __webpack_require__(14);
const export_interface_1 = __webpack_require__(8);
let ExportFileController = class ExportFileController {
    constructor(exportFileService) {
        this.exportFileService = exportFileService;
    }
    async startExportfile(query) {
        return await this.exportFileService.startExportProcess(query);
    }
    async exportWithannot(body) {
        let res = await this.exportFileService.exportWithannot(body);
        try {
            this.exportFileService.startExportProcess({ nExportid: res.nExportid, nMasterid: body.nMasterid });
        }
        catch (e) {
            console.log(e);
        }
        return { msg: 1, value: 'Export in Process', nExportid: res.nExportid };
    }
    async retryExport(body) {
        try {
            this.exportFileService.startExportProcess({ bIsRetry: true, nExportid: body.nExportid, nMasterid: body.nMasterid });
        }
        catch (e) {
            console.log(e);
            return { msg: -1, value: e.message, nExportid: body.nExportid };
        }
        return { msg: 1, value: 'Export in Process', nExportid: body.nExportid };
    }
};
exports.ExportFileController = ExportFileController;
__decorate([
    (0, common_1.Get)('startexportfile'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof export_interface_1.ExportProcess !== "undefined" && export_interface_1.ExportProcess) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ExportFileController.prototype, "startExportfile", null);
__decorate([
    (0, common_1.Post)('exportwithannot'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof export_interface_1.ExportFilewithAnnot !== "undefined" && export_interface_1.ExportFilewithAnnot) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ExportFileController.prototype, "exportWithannot", null);
__decorate([
    (0, common_1.Post)('retryexport'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof export_interface_1.RetryExport !== "undefined" && export_interface_1.RetryExport) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], ExportFileController.prototype, "retryExport", null);
exports.ExportFileController = ExportFileController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('export'),
    (0, common_1.Controller)('export-file'),
    __metadata("design:paramtypes", [typeof (_a = typeof export_file_service_1.ExportFileService !== "undefined" && export_file_service_1.ExportFileService) === "function" ? _a : Object])
], ExportFileController);


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
var ExportFileService_1;
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportFileService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(15);
const utility_service_1 = __webpack_require__(19);
const fs = __webpack_require__(7);
const pdfMake = __webpack_require__(22);
const pdf_lib_1 = __webpack_require__(23);
const { exec, spawn } = __webpack_require__(24);
const fs_1 = __webpack_require__(7);
const path = __webpack_require__(6);
const scaleannots_service_1 = __webpack_require__(25);
const scalecontent_service_1 = __webpack_require__(26);
const config_1 = __webpack_require__(18);
const log_service_1 = __webpack_require__(27);
let ExportFileService = ExportFileService_1 = class ExportFileService {
    constructor(db, utility, scaleannotsService, ScalecontentService, configService, logService, config) {
        this.db = db;
        this.utility = utility;
        this.scaleannotsService = scaleannotsService;
        this.ScalecontentService = ScalecontentService;
        this.configService = configService;
        this.logService = logService;
        this.config = config;
        this.logger = new common_1.Logger(ExportFileService_1.name);
        this.extraWidth = 0;
        this.exportProcess = [];
        this.pgfilepath = this.configService.get('PY_EXPPAGINATION');
        this.EDIT_FILE_PATH = this.configService.get('PY_EXPEDIT');
        this.pythonV = this.configService.get('pythonV');
        this.gsV = this.configService.get('gsV');
        this.logApp = 'export';
        this.FILEPATH = `${this.configService.get('ASSETS')}`;
        this.IDX = {
            navy: '#002f64', ink: '#12233f', ink2: '#2a3a55', mute: '#5b6b85', mute2: '#8b99b2',
            line: '#e1eaf6', line2: '#eef3fb', paper: '#f6f9ff', thead: '#eef2f8',
            accent: '#0066ff', link: '#c2570f', rowAlt: '#fbfcfe',
        };
        const A = this.configService.get('ASSETS');
        const fonts = {
            Roboto: {
                normal: `${A}fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${A}fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${A}fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${A}fonts/Roboto/Roboto-MediumItalic.ttf`
            },
            Inter: {
                normal: `${A}fonts/Inter/Inter-Regular.ttf`,
                bold: `${A}fonts/Inter/Inter-SemiBold.ttf`,
                italics: `${A}fonts/Inter/Inter-Regular.ttf`,
                bolditalics: `${A}fonts/Inter/Inter-SemiBold.ttf`
            },
            Lora: {
                normal: `${A}fonts/Lora/Lora-Regular.ttf`,
                bold: `${A}fonts/Lora/Lora-SemiBold.ttf`,
                italics: `${A}fonts/Lora/Lora-Regular.ttf`,
                bolditalics: `${A}fonts/Lora/Lora-SemiBold.ttf`
            },
            JetBrainsMono: {
                normal: `${A}fonts/JetBrainsMono/JetBrainsMono-Regular.ttf`,
                bold: `${A}fonts/JetBrainsMono/JetBrainsMono-SemiBold.ttf`,
                italics: `${A}fonts/JetBrainsMono/JetBrainsMono-Regular.ttf`,
                bolditalics: `${A}fonts/JetBrainsMono/JetBrainsMono-SemiBold.ttf`
            },
        };
        this.printer = new pdfMake(fonts);
    }
    async exportWithannot(body) {
        try {
            this.logService.info(`Export Request ${JSON.stringify(body)} by user ${body.nMasterid}`, this.logApp);
            this.logService.info(`Insert exoprting log in database for user ${body.nMasterid}`, this.logApp);
            const res = await this.db.executeRef('export_insert_data_1', body);
            if (res.success) {
                this.logService.info(`Insert exoprting log success`, this.logApp);
                return res.data[0][0];
            }
            else {
                this.logService.error(`Insert export data failed with error ${JSON.stringify(res?.error)}`, this.logApp);
                return { msg: -1, value: 'Insert export data failed', error: res?.error };
            }
        }
        catch (error) {
            this.logService.error(`Error in exportWithannot ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, value: 'Failed to fetch', error: error.message };
        }
    }
    async startExportProcess(body) {
        try {
            this.logService.info(`get exoprting data form database for user ${body.nMasterid}`, this.logApp);
            this.logger.verbose(`get exoprting data form database for user ${body.nMasterid}`);
            const res = await this.db.executeRef('export_get_data_1', body);
            if (res.success) {
                this.logService.info(`Get export data success`, this.logApp);
                if (!res.data || !res.data.length || !res.data[0] || !res.data[0].length) {
                    this.logService.error(`No date found`, this.logApp);
                    this.logger.error(`No date found`);
                    return { msg: -1, value: 'No date found' };
                }
                this.logService.info(`Start export data`, this.logApp);
                this.logger.verbose(`Start export data`);
                await this.processExportData(res, body);
                return { msg: 1, value: 'Export in Process' };
            }
            else {
                this.logService.error(`Exporting failed with database error ${JSON.stringify(res?.error)}`, this.logApp);
                this.logger.error(`Exporting failed with database error ${JSON.stringify(res?.error)}`);
                return { msg: -1, value: 'Exporting failed' };
            }
        }
        catch (error) {
            this.logService.error(`Error in startExportProcess ${JSON.stringify(error)} `, this.logApp);
            return [{ msg: -1, value: 'Failed to fetch', error: error.message }];
        }
    }
    async processJsonData(jsonData, nExportid, nMasterid) {
        for (const [index, element] of jsonData.entries()) {
            this.logService.info(`Annotation process start for file ${JSON.stringify(element)}`, this.logApp);
            await this.editFile(jsonData, index, nExportid, nMasterid, element);
            if (this.exportProcess.find(e => e.nExportid === nExportid && !e.isProcess)) {
                break;
            }
        }
    }
    async getProcessQueue() {
        try {
            return this.exportProcess.map(a => ({ nCaseid: a.nCaseid, nUserid: a.nUserid, isProcessing: a.isProcessing, jsonData: a.jsonData?.length }));
        }
        catch (error) {
            return { msg: -1, value: 'Failed to fetch process queue', error: error.message };
        }
    }
    async removeProcess(body) {
        try {
            this.exportProcess = this.exportProcess.filter(entry => entry.nExportid !== body.nExportid);
            this.logService.info(`Removed export process for ID ${body.nExportid}`, this.logApp);
            return { msg: 1, value: 'Process removed successfully' };
        }
        catch (error) {
            this.logService.error(`Error in removeProcess ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, value: 'Failed to remove process', error: error.message };
        }
    }
    async processExportData(res, body) {
        const { nCaseid, nExportid, nUserid } = res.data[0][0];
        let entry = this.exportProcess.find(e => e.nCaseid === nCaseid);
        if (!entry) {
            entry = { nCaseid, nUserid, isProcessing: false, jsonData: [], filesData: [], nExportid };
            this.exportProcess.push(entry);
        }
        const incoming = res.data[0].map(item => ({ ...item, nExportid }));
        entry.jsonData.push(...incoming);
        entry.filesData.push(...incoming);
        this.logService.info(`File added in queue (${incoming.length} items)`, this.logApp);
        this.logger.verbose(`File added in queue (${incoming.length} items)`);
        if (!entry.isProcessing) {
            entry.isProcessing = true;
            try {
                await this.drainQueue(entry, body.nMasterid);
            }
            catch (err) {
                this.logService.error(`Error draining export queue for case ${nCaseid}: ${err}`, this.logApp);
                this.logger.error(`Error draining export queue for id ${nExportid}: ${err}`);
            }
            finally {
                this.logger.verbose(`Removing export queue entry for id ${nExportid} and userid ${nUserid}.`);
                this.exportProcess = this.exportProcess.filter(e => e !== entry);
            }
        }
    }
    async drainQueue(entry, nMasterid) {
        let idx = 0;
        while (entry.jsonData.length) {
            const element = entry.jsonData.shift();
            this.logService.info(`Annotation process start for file #${idx} → ${JSON.stringify(element)}`, this.logApp);
            await this.editFile(entry.filesData, idx, element.nExportid, nMasterid, element);
            idx++;
        }
    }
    async completeFile(jsonData, mdl, nMasterid, jResponce) {
        this.logService.info(`Complete File ${jsonData.length} ${JSON.stringify(jsonData)}`, 'checkfile');
        mdl.isComplete = true;
        try {
            if (jsonData.length > 0) {
                let i = jsonData.findIndex(a => !a.isComplete);
                this.logService.info(`i ${i}`, 'checkfile');
                this.logService.info(`mdl ${JSON.stringify(mdl)}`, 'checkfile');
                await this.updateProgress(mdl.nExportid, mdl.nUserid, mdl, mdl.cStatus);
                if (i == -1 || mdl.cType == 'M' || mdl.cType == 'S') {
                    if (mdl.cType == 'S') {
                        const exportGroups = jsonData.reduce((acc, item) => {
                            if (!acc[item.nExportid]) {
                                acc[item.nExportid] = [];
                            }
                            acc[item.nExportid].push(item);
                            return acc;
                        }, {});
                        this.logService.info(`exportGroups ${JSON.stringify(exportGroups)}`, 'checkfile');
                        for (const [exportId, items] of Object.entries(exportGroups)) {
                            if (items.every(a => a.isMerged)) {
                                this.logService.info(`Already merged exportId ${exportId}, skipping`, 'checkfile');
                                continue;
                            }
                            const allDone = items.every(a => ['C', 'F'].includes(a.cStatus));
                            if (allDone) {
                                const completedFiles = items.filter(a => ['C', 'F'].includes(a.cStatus));
                                if (completedFiles.length > 0) {
                                    this.logService.info(`MERGING exportId ${exportId}`, 'checkfile');
                                    this.mergePdf(completedFiles, nMasterid);
                                    items.forEach(a => a.isMerged = true);
                                }
                                else {
                                    this.logService.warn(`No completed files to merge for exportId ${exportId}`, 'checkfile');
                                }
                            }
                        }
                        return;
                    }
                    else {
                        if (mdl.bPagination) {
                            let newPath = mdl.finalPath.replace('.pdf', '_1.pdf');
                            let res = await this.paginationReq(mdl.finalPath, newPath);
                            if (res.status == 'ok') {
                                mdl.finalPath = newPath;
                            }
                        }
                        const body = { nEDid: mdl.nEDid, nExportid: mdl.nExportid, nUserid: mdl.nUserid, cPath: mdl.finalPath };
                        let data = await this.db.executeRef('export_file_complete', body);
                        this.emitMessage(mdl, data.data[0][0], mdl.finalPath, nMasterid, 100, 100);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error in completeFile', error);
        }
    }
    async paginationReq(filePath, newPath) {
        let jsondata = { cPath: filePath, cNewpath: newPath, cRefpage: '1-1', jPagination: { "bc": "#fff", "cb": "#ffffff00", "fc": "#000", "fs": "16", "ft": "arial", "isHide": false, "position": "BR" } };
        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonV, [this.pgfilepath, JSON.stringify(jsondata)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    ASSETS: this.config.get('ASSETS'),
                    ROOT_PATH: this.config.get('ROOT_PATH'),
                    DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
                    DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
                    DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
                    DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),
                    DO_TOKEN: this.config.get('DO_TOKEN'),
                    DO_CDN_ID: this.config.get('DO_CDN_ID')
                },
            });
            pythonProcess.stdout.on('data', (data) => {
                this.logger.log(`Python stdout: ${data}`);
            });
            pythonProcess.stderr.on('data', (data) => {
                this.logger.error(`Python stderr: ${data}`);
            });
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    this.logger.log(`Python script exited with code ${code}`);
                    resolve({ status: 'ok' });
                }
                else {
                    this.logger.error(`Python script exited with code ${code}`);
                    resolve({ status: '' });
                }
            });
        });
    }
    async mergePdf(exportlist, nMasterid) {
        try {
            if (exportlist.length > 1) {
                var svPth = this.FILEPATH + 'export/ex' + exportlist[0].nExportid;
                let gsCommand = `${this.gsV} -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sOutputFile=${svPth}/final.pdf -dIncludeAnnotations=true -dIncludeDocRights=false`;
                if (!fs.existsSync(svPth)) {
                    fs.mkdirSync(svPth);
                }
                else {
                }
                for (let x of exportlist) {
                    if (x.cStatus == 'C') {
                        await new Promise((resolve, reject) => {
                            var path = this.FILEPATH + x.finalPath;
                            fs.access(path, fs.constants.F_OK, (err) => {
                                if (err) {
                                    console.log('File does not exist');
                                }
                                else {
                                    console.log('File exists');
                                    gsCommand = gsCommand + ' ' + path;
                                }
                                resolve({ status: 'ok' });
                            });
                        });
                    }
                }
                exec(gsCommand, async (error, stdout, stderr) => {
                    if (error) {
                        console.error(`stderr: ${error}`);
                        return;
                    }
                    let path = 'export/ex' + exportlist[0].nExportid + '/final.pdf';
                    if (exportlist[0].bPagination) {
                        let newPath = 'export/ex' + exportlist[0].nExportid + '/final_1.pdf';
                        let res = await this.paginationReq(path, newPath);
                        if (res.status == 'ok') {
                            path = newPath;
                        }
                    }
                    const body = { nExportid: exportlist[0].nExportid, cPath: path };
                    let data = await this.db.executeRef('export_update_single_pdf', body);
                    this.emitMessage(exportlist[0], data.data[0][0], path, nMasterid, 100, 100);
                    console.log('\n\r\n\rCOMPLERE MERGED');
                });
            }
            else {
                if (exportlist[0].bPagination) {
                    let newPath = exportlist[0].finalPath.replace('.pdf', '_1.pdf');
                    let res = await this.paginationReq(exportlist[0].finalPath, newPath);
                    if (res.status == 'ok') {
                        exportlist[0].finalPath = newPath;
                    }
                }
                const body = { nExportid: exportlist[0].nExportid, cPath: exportlist[0]["finalPath"] };
                let data = await this.db.executeRef('export_update_single_pdf', body);
                this.emitMessage(exportlist[0], data.data[0][0], exportlist[0]["finalPath"], nMasterid, 100, 100);
            }
        }
        catch (error) {
            console.log('Error in mergePdf', error);
        }
    }
    emitMessage(mdl, data, path, nMasterid, comp_progres, total_prog) {
        try {
            const obj = {
                nExportid: mdl.nExportid,
                nEDid: mdl.nEDid,
                total_prog: total_prog,
                comp_progres: comp_progres,
                finalPath: path ? path : '',
                cType: mdl.cType,
                cStatus: data.cStatus,
                nCaseid: data.nCaseid,
            };
            this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
        }
        catch (error) {
        }
    }
    async editFile(list, index, nExportid, nMasterid, jsonData) {
        this.logService.info(`Use python file for annotaion `, this.logApp);
        this.logger.verbose(`Use python file for annotaion`);
        await this.updateProgress(nExportid, nMasterid, jsonData, 'S');
        return await new Promise((resolve, reject) => {
            let finished = false;
            const failOnce = async (error) => {
                if (finished)
                    return;
                finished = true;
                const message = error instanceof Error ? error.message : String(error);
                this.logService.error(`Python annotation process failed to start or run: ${message}`, this.logApp);
                this.logger.error(`Python annotation process failed: ${message}`);
                jsonData.cStatus = 'F';
                await this.updateProgress(nExportid, nMasterid, jsonData, 'F');
                resolve();
            };
            let pythonProcess;
            try {
                pythonProcess = spawn(this.pythonV, [this.EDIT_FILE_PATH, '-'], {
                    env: {
                        ...process.env,
                        PYTHONIOENCODING: "UTF-8",
                        ASSETS: this.config.get('ASSETS'),
                        ROOT_PATH: this.config.get('ROOT_PATH'),
                        DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
                        DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
                        DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
                        DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),
                        DO_TOKEN: this.config.get('DO_TOKEN'),
                        DO_CDN_ID: this.config.get('DO_CDN_ID')
                    }
                });
            }
            catch (error) {
                void failOnce(error);
                return;
            }
            pythonProcess.once('error', (error) => {
                void failOnce(error);
            });
            pythonProcess.stdout.on('data', (data) => {
                this.logService.log(`Python stdout: ${data.toString().trim()}`, this.logApp);
            });
            pythonProcess.stderr.on('data', (data) => {
                this.logService.error(`Python stderr: ${data.toString().trim()}`, this.logApp);
            });
            pythonProcess.on('close', async (code) => {
                if (finished)
                    return;
                try {
                    if (code === 0) {
                        finished = true;
                        this.logService.log(`Python script exited with code ${code}`, this.logApp);
                        console.log(`Python script exited with code ${code}`);
                        jsonData['folder'] = 'ed' + jsonData.nEDid;
                        await this.startIndexing(index, nExportid, nMasterid, jsonData);
                        console.log('Indexing completed');
                        await this.completeFile(list, jsonData, nMasterid, {});
                        console.log('File completed');
                        console.log('Progress updated');
                    }
                    else {
                        await failOnce(new Error(`Python script exited with code ${code}`));
                        return;
                    }
                }
                catch (error) {
                    finished = false;
                    await failOnce(error);
                    return;
                }
                resolve();
            });
            try {
                pythonProcess.stdin.end(JSON.stringify(jsonData), 'utf8');
            }
            catch (error) {
                void failOnce(error);
            }
        });
    }
    async updateProgress(nExportid, nMasterid, mdl, flag) {
        try {
            const res = await this.db.executeRef('export_update_progress_1', {
                nMasterid,
                nExportid,
                nEDid: mdl.nEDid,
                cPath: mdl.cPath,
                cStatus: flag,
                isComplete: false
            });
            if (res.data && res.data.length) {
                const data = res.data[0][0];
                const obj = {
                    nID: mdl.nID,
                    nExportid,
                    comp_progres: data?.comp_progres,
                    total_prog: data.total_prog,
                    cType: data.cType,
                    nEDid: mdl.nEDid,
                    cStatus: data.cStatus,
                    nCaseid: data.nCaseid,
                };
                this.utility.emit({ event: 'EXPORT-PROGRESS', data: { identifier: '', nMasterid, data: obj } });
            }
        }
        catch (error) {
            this.logger.error('Error in updateProgress', error);
            this.logService.error(`Error in updateProgress ${JSON.stringify(error)} `, this.logApp);
        }
    }
    async startIndexing(indexs, nExportid, nMasterid, mdl) {
        try {
            this.logService.log(`Start indexing for file `, this.logApp);
            mdl.factsheets_array = [];
            const isCover = this.determineIsCover(mdl, indexs);
            await this.processFactsheets(mdl);
            await this.createIndexPages(mdl, isCover, `${this.FILEPATH}export/${mdl.folder}/indx.pdf`);
            await this.createFactsheetPdfs(mdl);
            this.logger.log('PDF created successfully.');
            await this.updateProgress(nExportid, nMasterid, mdl, 'I');
            await this.mergeIndexPages(mdl, nExportid, nMasterid);
        }
        catch (err) {
            this.logger.error('Error in startIndexing', err);
            this.logService.error(`Error in startIndexing ${JSON.stringify(err)} `, this.logApp);
            throw err;
        }
        Promise.resolve();
    }
    determineIsCover(mdl, indexs) {
        try {
            if (mdl.cType === 'S') {
                return (mdl.bCoverpg && indexs === 0) ? 'Y' : 'N';
            }
            this.logService.log(`Check Cover page ${mdl.bCoverpg}`, this.logApp);
            return mdl.bCoverpg ? 'Y' : 'N';
        }
        catch (error) {
            this.logger.error('Error in determineIsCover', error);
        }
    }
    async processFactsheets(mdl) {
        try {
            this.logService.log(`Get fact sheet data `, this.logApp);
            if (mdl.allfacts?.length && mdl.isFactsheet) {
                mdl.factsheets_array = mdl.allfacts.map(x => ({
                    isTask: mdl.isTask ? 'Y' : 'N',
                    nFSid: x
                }));
            }
        }
        catch (error) {
            this.logService.error(`Error while geting factsheet data`, this.logApp);
        }
    }
    async createFactsheetPdfs(mdl) {
        const createPdfPromises = mdl.factsheets_array.map(async (item) => {
            const tempPath = `${this.FILEPATH}export/${mdl.folder}/factsheet${item.nFSid}.pdf`;
            await this.createFactsheetPdf(mdl, item, tempPath);
        });
        await Promise.all(createPdfPromises);
    }
    async mergeIndexPages(mdl, nExportid, nMasterid) {
        try {
            this.logger.log('Starting index pages merge');
            const firstPDF = await this.loadPDF(this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf');
            const secondPDF = await this.loadPDF(this.FILEPATH + 'export/' + mdl.folder + '/new_pdf.pdf');
            if (firstPDF.msg == 1) {
                mdl.indexpagescount = firstPDF.pdf.getPageCount();
            }
            else {
                mdl.indexpagescount = 0;
            }
            const mergedPDF = await pdf_lib_1.PDFDocument.create();
            if (firstPDF.msg == 1) {
                console.log('Step 0');
                await this.copyPagesToMergedPDF(mergedPDF, firstPDF.pdf);
            }
            console.log('Step 0.2');
            await this.copySelectedPagesToMergedPDF(mergedPDF, secondPDF.pdf, mdl);
            console.log('Step 0.4');
            let pages = mergedPDF.getPageCount();
            console.log('Step 0.4.0', pages);
            await this.addFactsheetPages(mergedPDF, mdl, pages);
            console.log('Step 0.5');
            await this.scalePagesAndAnnotations(mergedPDF, mdl);
            console.log('Step 0.6');
            const mergedPDFData = await mergedPDF.save();
            await this.saveMergedPDF(mergedPDFData, mdl);
            console.log('Step 0.7');
            await this.updateProgress(nExportid, nMasterid, mdl, 'M');
            this.logger.log('Reading content');
            await this.readContent(mergedPDF, mdl, mdl.indexpagescount, nExportid, nMasterid);
            this.logger.log('Reading content success');
            Promise.resolve();
        }
        catch (error) {
            this.logger.error('Error in mergeIndexPages', error);
            throw error;
        }
    }
    async loadPDF(path) {
        if (!fs.existsSync(path)) {
            this.logger.error(`File not found: ${path}`);
            return { msg: -1, pdf: null };
        }
        ;
        const pdfData = await (0, fs_1.readFileSync)(path);
        const pdf = await pdf_lib_1.PDFDocument.load(pdfData, { ignoreEncryption: true });
        return { msg: 1, pdf };
    }
    async copyPagesToMergedPDF(mergedPDF, sourcePDF) {
        console.log('Step 0.1');
        const pages = await mergedPDF.copyPages(sourcePDF, sourcePDF.getPageIndices());
        pages.forEach(page => mergedPDF.addPage(page));
        return Promise.resolve();
    }
    async copySelectedPagesToMergedPDF(mergedPDF, sourcePDF, mdl) {
        console.log('Step 0.3');
        const pages = await mergedPDF.copyPages(sourcePDF, sourcePDF.getPageIndices());
        const selectedPages = mdl.isAllpage ? pages : this.getSelectedPages(pages, mdl.jPages);
        selectedPages.forEach(page => mergedPDF.addPage(page));
        return Promise.resolve();
    }
    getSelectedPages(pages, jPages) {
        return pages.filter((_, index) => jPages.includes(index + 1));
    }
    async addFactsheetPages(mergedPDF, mdl, startPage) {
        try {
            if (!mdl.factsheets_array?.length)
                return;
            for (const item of mdl.factsheets_array) {
                const factsheetPDF = await this.loadPDF(this.FILEPATH + `export/${mdl.folder}/factsheet${item.nFSid}.pdf`);
                const factsheetPages = await mergedPDF.copyPages(factsheetPDF.pdf, factsheetPDF.pdf.getPageIndices());
                item.startpg = startPage;
                factsheetPages.forEach(page => {
                    mergedPDF.addPage(page);
                    startPage++;
                });
            }
            Promise.resolve();
        }
        catch (error) {
            console.log('Error in addFactsheetPages', error);
        }
    }
    async scalePagesAndAnnotations(mergedPDF, mdl) {
        try {
            const [fnl_width, fnl_height] = pdf_lib_1.PageSizes[mdl.cPgsize || 'A4'];
            const pages = mergedPDF.getPages();
            pages.forEach(page => {
                const { width: pageWidth, height: pageHeight } = page.getSize();
            });
        }
        catch (error) {
        }
        Promise.resolve();
    }
    calculateScaleFactors(pageWidth, pageHeight, fnl_width, fnl_height) {
        if (pageWidth > pageHeight) {
            return {
                scaleX: (pageWidth - this.extraWidth) / fnl_width,
                scaleY: (pageHeight + this.extraWidth) / fnl_height
            };
        }
        else {
            return {
                scaleX: fnl_width / pageWidth,
                scaleY: fnl_height / pageHeight
            };
        }
    }
    async saveMergedPDF(mergedPDFData, mdl) {
        const directoryPath = this.FILEPATH + 'export';
        await fs.mkdirSync(directoryPath, { recursive: true });
        await fs.writeFileSync(directoryPath + '/' + mdl.folder + '/modified_linked.pdf', mergedPDFData);
        Promise.resolve();
    }
    generateHighlightTables(mdl, data, isCover) {
        let fact = [];
        let doc = [];
        let web = [];
        let Qfact = [];
        try {
            if (mdl.bQfact) {
                Qfact = this.generateHighlight(data?.factlinks?.filter(link => link.cFType === 'QF') || [], 'QF', isCover == 'Y');
            }
            if (mdl.bFact) {
                fact = this.generateHighlight(data?.factlinks?.filter(link => link.cFType === 'F') || [], 'F', isCover == 'Y' || (mdl.bQfact && data?.factlinks?.filter(link => link?.cFType === 'QF')?.length));
            }
            if (mdl.bDoc) {
                doc = this.generateHighlight(data.doclinks, 'D', isCover == 'Y' || ((mdl.bFact || mdl.bQfact) && data?.factlinks?.length));
            }
        }
        catch (error) {
            this.logger.error('Error in generateHighlightTables', error);
        }
        return [...Qfact, ...fact, ...doc, ...web];
    }
    getAnnotationCounts(mdl, idxRoot) {
        const databaseCounts = {
            qfact: (idxRoot?.factlinks || []).filter((link) => link.cFType === 'QF').length,
            fact: (idxRoot?.factlinks || []).filter((link) => link.cFType === 'F').length,
            link: (idxRoot?.doclinks || []).length,
        };
        if (!Array.isArray(mdl?.highlights))
            return databaseCounts;
        const unique = {
            qfact: new Set(),
            fact: new Set(),
            link: new Set(),
        };
        const countKeyByType = {
            QF: 'qfact',
            F: 'fact',
            D: 'link',
        };
        mdl.highlights.forEach((annotation, index) => {
            const linkType = String(annotation?.linktype || '').toUpperCase();
            const countKey = countKeyByType[linkType];
            if (!countKey)
                return;
            const annotationId = annotation?.id
                ?? annotation?.nFSid
                ?? annotation?.nDocid
                ?? annotation?.nWebid
                ?? annotation?.nAId
                ?? annotation?.uuid
                ?? `${linkType}:${annotation?.type || 'unknown'}:${annotation?.page || 0}:${index}`;
            unique[countKey].add(String(annotationId));
        });
        return {
            qfact: unique.qfact.size,
            fact: unique.fact.size,
            link: unique.link.size,
        };
    }
    getAnnotationIds(mdl) {
        const factIds = new Set();
        const docIds = new Set();
        (Array.isArray(mdl?.highlights) ? mdl.highlights : []).forEach((annotation) => {
            const linkType = String(annotation?.linktype || '').toUpperCase();
            if (linkType === 'F' || linkType === 'QF') {
                const id = annotation?.nFSid ?? annotation?.id;
                if (id)
                    factIds.add(String(id));
            }
            else if (linkType === 'D') {
                const id = annotation?.nDocid ?? annotation?.id;
                if (id)
                    docIds.add(String(id));
            }
        });
        return { factIds: [...factIds], docIds: [...docIds] };
    }
    async createIndexPages(mdl, isCover, path) {
        try {
            this.logger.verbose(`Creating index page`);
            this.logService.log(`Creating index page `, this.logApp);
            const data = await this.db.executeRef('preview_document_list_1', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid, nExportid: mdl.nExportid });
            const { cUsername: username, factlinks: highlightlist, casedetail: [casedetail], factsheet: factslist } = data.data[0][0];
            let docDefinition = {};
            let idxRoot = data.data[0][0];
            const annotationIds = this.getAnnotationIds(mdl);
            if (annotationIds.factIds.length || annotationIds.docIds.length) {
                const indexRows = await this.db.executeRef('annotation_index_rows', {
                    jFactIds: annotationIds.factIds,
                    jDocIds: annotationIds.docIds,
                });
                const exactRows = indexRows?.data?.[0]?.[0];
                if (exactRows) {
                    idxRoot = {
                        ...idxRoot,
                        factlinks: exactRows.factlinks || [],
                        doclinks: exactRows.doclinks || [],
                    };
                }
            }
            const counts = this.getAnnotationCounts(mdl, idxRoot);
            const enabled = { qfact: !!mdl.bQfact, fact: !!mdl.bFact, link: !!mdl.bDoc };
            const highlights = this.generateHighlightTables(mdl, idxRoot, isCover);
            if (highlights.length && highlights[0]?.pageBreak === 'after')
                highlights.shift();
            if (highlights.length && isCover === 'Y') {
                docDefinition = {
                    pageSize: mdl.cPgsize || 'A4',
                    pageMargins: [43, 66, 43, 48],
                    defaultStyle: { font: 'Inter', fontSize: 10, color: '#12233f', lineHeight: 1.2 },
                    header: (_cp, _pc, ps) => this.idxRunningHeader(casedetail, ps),
                    footer: () => this.idxRunningFooter(casedetail),
                    content: [
                        this.idxTitleBlock(casedetail, username, counts, enabled),
                        ...highlights,
                    ],
                    styles: this.getDocumentStyles(),
                };
                return new Promise((resolve, reject) => {
                    const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
                    pdfDoc.pipe((0, fs_1.createWriteStream)(path))
                        .on('finish', () => {
                        this.logService.log(`Creating index page successfully`, this.logApp);
                        resolve({ msg: 1 });
                    })
                        .on('error', error => {
                        this.logService.log(`Rejcet Error in createIndexPages ${JSON.stringify(error)} `, this.logApp);
                        reject({ msg: -1, error });
                    });
                    pdfDoc.end();
                });
            }
            else {
                return { msg: 1 };
            }
        }
        catch (error) {
            this.logger.error('Error in createIndexPages', error);
            this.logService.error(`Error in createIndexPages ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, error };
        }
    }
    generateCoverPage(casedetail, username, isCover) {
        if (isCover !== 'Y')
            return [];
        try {
            var content = [{
                    "columns": [
                        {
                            "width": 120,
                            "stack": [
                                {
                                    "canvas": [
                                        {
                                            "type": "rect",
                                            "x": 0,
                                            "y": 0,
                                            "w": 90,
                                            "h": 350,
                                            "color": "#ff3d00"
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "width": 420,
                            "stack": [
                                { "text": "", "style": "topHeader" },
                                {
                                    "text": casedetail?.cCasename,
                                    "style": "header"
                                },
                                {
                                    "text": casedetail?.cDesc,
                                    "margin": [0, 5, 0, 0],
                                    "color": "#4f4f4f",
                                    "fontSize": 12
                                },
                                {
                                    "text": casedetail?.cCaseno,
                                    "margin": [0, 10, 0, 10],
                                    "color": "#6f6f6f",
                                    "fontWeight": 200,
                                },
                                {
                                    "text": "Exported on: " + casedetail?.dExportdt,
                                    "style": "boldText",
                                    "margin": [0, 5, 0, 0],
                                    "color": "#4f4f4f"
                                },
                                {
                                    "text": "By " + username,
                                    "style": "boldText",
                                    "margin": [0, 5, 0, 0],
                                    "color": "#4f4f4f"
                                }
                            ]
                        }
                    ]
                }, {
                    "stack": [{
                            "image": `${this.configService.get('ASSETS')}icon/logo.png`,
                            "width": 90,
                            "margin": [12, 0, 0, 15],
                        }],
                    "absolutePosition": { "x": 440.28, "y": 680.89 },
                }];
            return content;
        }
        catch (error) {
            this.logService.error(`Error in generateCoverPage ${JSON.stringify(error)} `, this.logApp);
        }
    }
    generateHighlight(data, type, isPBreak = true) {
        try {
            if (!data.length)
                return [];
            const section = [
                this.idxSectionHead(type, data.length),
                ...(type === 'D' ? [this.idxGroupBand()] : []),
                this.idxTableHead(type),
                this.idxRowsTable(data, type),
            ];
            return isPBreak ? [{ text: '', pageBreak: 'after' }, ...section] : section;
        }
        catch (error) {
            this.logService.error(`Error in generateHighlight ${JSON.stringify(error)} `, this.logApp);
        }
    }
    idxTypeTone(type) {
        return type === 'QF' ? '#6b4fd8' : type === 'F' ? '#1c7a4b' : type === 'D' ? '#0066ff' : '#8090a8';
    }
    idxSectionName(type) {
        return type === 'F' ? 'Facts' : type === 'QF' ? 'qFact' : type === 'D' ? 'DocLinks' : 'Web Links';
    }
    idxSectionDesc(type) {
        return type === 'QF' ? 'Quick captures from the source document'
            : type === 'F' ? 'Pleaded facts with issue tags'
                : type === 'D' ? 'Passages linked to destination documents'
                    : 'External web references';
    }
    idxColWidths(type) {
        if (type === 'D')
            return [44, 30, '*', 96, 118];
        if (type === 'W')
            return [48, 34, '*', 150];
        return [48, 34, '*'];
    }
    idxRowTone(item, type) {
        const cands = [
            item?.issuelist?.[0]?.cClr, item?.issuelist?.[0]?.cColor,
            item?.cClr, item?.cColor, item?.color, item?.jLinktype?.color, item?.jLinktype?.clr,
        ];
        for (const c of cands) {
            if (typeof c !== 'string')
                continue;
            const hex = c.replace('#', '');
            if (/^[0-9a-fA-F]{6}/.test(hex))
                return '#' + hex.substring(0, 6);
        }
        return this.idxTypeTone(type);
    }
    idxPageStart(item) {
        const jl = item?.jLinktype;
        if (jl?.pages?.length)
            return String(jl.pages[0]);
        if (jl && jl.start != null && String(jl.start) !== '')
            return String(jl.start);
        if (item?.nPage != null && String(item.nPage) !== '')
            return String(item.nPage);
        if (item?.cPage != null && String(item.cPage) !== '')
            return String(item.cPage);
        return '';
    }
    idxPageText(item) {
        const jl = item?.jLinktype;
        if (jl?.pages?.length)
            return jl.pages.join(', ');
        return this.idxPageStart(item) || '—';
    }
    idxTint(hex, amt = 0.88) {
        try {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
            const mix = (x) => Math.round(x + (255 - x) * amt);
            const to2 = (x) => x.toString(16).padStart(2, '0');
            return `#${to2(mix(r))}${to2(mix(g))}${to2(mix(b))}`;
        }
        catch {
            return '#eef2f8';
        }
    }
    idxLogoSvg() {
        return `<svg width="31" height="31" viewBox="0 0 31 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_2316_303)">
<path d="M24.169 1H7.027C3.69838 1 1 3.69838 1 7.027V24.169C1 27.4976 3.69838 30.196 7.027 30.196H24.169C27.4976 30.196 30.196 27.4976 30.196 24.169V7.027C30.196 3.69838 27.4976 1 24.169 1Z" fill="url(#paint0_linear_2316_303)" stroke="#FF3D00" stroke-width="0.804"/>
<path d="M7 24.2133C7 23.9162 7.23843 23.6772 7.53466 23.6772C7.83089 23.6772 8.06933 23.9162 8.06933 24.2133C8.06933 24.5104 7.83089 24.7495 7.53466 24.7495C7.23843 24.7495 7 24.5104 7 24.2133Z" fill="white"/>
<path d="M12.314 24.2133C12.314 23.9162 12.5524 23.6772 12.8486 23.6772C13.1449 23.6772 13.3833 23.9162 13.3833 24.2133C13.3833 24.5104 13.1449 24.7495 12.8486 24.7495C12.5524 24.7495 12.314 24.5104 12.314 24.2133Z" fill="white"/>
<path d="M17.6282 24.2133C17.6282 23.9162 17.8666 23.6772 18.1628 23.6772C18.4591 23.6772 18.6975 23.9162 18.6975 24.2133C18.6975 24.5104 18.4591 24.7495 18.1628 24.7495C17.8666 24.7495 17.6282 24.5104 17.6282 24.2133Z" fill="white"/>
<path d="M22.939 24.2133C22.939 23.9162 23.1774 23.6772 23.4736 23.6772C23.7699 23.6772 24.0083 23.9162 24.0083 24.2133C24.0083 24.5104 23.7699 24.7495 23.4736 24.7495C23.1774 24.7495 22.939 24.5104 22.939 24.2133Z" fill="white"/>
<path d="M22.0428 13.954C22.1222 13.7837 22.162 13.6098 22.162 13.4323C22.162 13.0664 22.0355 12.773 21.7827 12.552C21.5298 12.331 21.1902 12.2224 20.7639 12.2224C20.3376 12.2224 19.9836 12.3455 19.7307 12.5955C19.4778 12.8454 19.3514 13.186 19.3514 13.6171V13.6424H20.2654V13.5953C20.2654 13.3961 20.3087 13.2476 20.3954 13.1425C20.4821 13.0374 20.6086 12.9867 20.7711 12.9867C20.9084 12.9867 21.0168 13.0302 21.1035 13.1135C21.1866 13.1968 21.2299 13.3055 21.2299 13.4396C21.2299 13.5265 21.2046 13.6207 21.1541 13.7185C21.1035 13.8163 21.0276 13.9286 20.9229 14.0518L19.2141 16.0805H22.1222V15.269H20.959L21.6454 14.5119C21.8296 14.309 21.9597 14.1242 22.0392 13.954H22.0428Z" fill="white"/>
<path d="M22.8012 15.2799C22.7 15.3813 22.6531 15.5045 22.6531 15.653C22.6531 15.8015 22.7037 15.9247 22.8048 16.0297C22.906 16.1348 23.0288 16.1819 23.1733 16.1819C23.3178 16.1819 23.4478 16.1312 23.549 16.0297C23.6501 15.9283 23.7007 15.8015 23.7007 15.653C23.7007 15.5045 23.6501 15.3813 23.549 15.2799C23.4478 15.1784 23.3214 15.1277 23.1733 15.1277C23.0252 15.1277 22.9023 15.1784 22.8012 15.2799Z" fill="white"/>
<path d="M26.3705 12.7513C26.1176 12.3999 25.7636 12.2224 25.312 12.2224C24.8604 12.2224 24.5136 12.3962 24.2535 12.7476C23.997 13.099 23.8669 13.5808 23.8669 14.1967C23.8669 14.8125 23.997 15.298 24.2535 15.6494C24.51 16.0008 24.864 16.1783 25.312 16.1783C25.7599 16.1783 26.1104 16.0044 26.3669 15.6602C26.6233 15.3161 26.7498 14.8379 26.7498 14.2329C26.7498 13.5953 26.6233 13.099 26.3705 12.7476V12.7513ZM25.6732 15.1132C25.5974 15.3052 25.4745 15.403 25.312 15.403C25.1494 15.403 25.0194 15.3052 24.9435 15.1132C24.8676 14.9212 24.8279 14.6169 24.8279 14.2003C24.8279 13.7837 24.8676 13.4758 24.9435 13.2838C25.0194 13.0918 25.1422 12.9976 25.312 12.9976C25.4818 12.9976 25.5974 13.0954 25.6732 13.291C25.7491 13.4867 25.7888 13.791 25.7888 14.2003C25.7888 14.6097 25.7491 14.9212 25.6732 15.1132Z" fill="white"/>
<path d="M22.3643 17.928C22.3643 17.928 18.8962 17.6527 16.7106 19.2974V10.8494C16.7106 10.8494 17.7619 9.36411 22.3643 9.24818V11.2696H24.0081V7.13618C24.0081 7.13618 18.7554 6.70509 15.504 9.13951C12.2527 6.70509 7 7.13618 7 7.13618V19.9857C12.3286 19.6307 15.504 22.1086 15.504 22.1086C15.504 22.1086 18.6795 19.6343 24.0081 19.9857V17.2071H22.3643V17.9244V17.928ZM14.2938 19.2938C12.1118 17.6527 8.64011 17.9244 8.64011 17.9244V9.24818C13.2389 9.36411 14.2938 10.8494 14.2938 10.8494V19.2938Z" fill="white"/>
</g>
<defs>
<linearGradient id="paint0_linear_2316_303" x1="0.598" y1="0.598" x2="30.598" y2="30.598" gradientUnits="userSpaceOnUse">
<stop stop-color="#FF3D00"/>
<stop offset="0.786" stop-color="#FF7A00"/>
<stop offset="0.984" stop-color="#FF7A00"/>
</linearGradient>
<clipPath id="clip0_2316_303">
<rect width="31" height="31" fill="white"/>
</clipPath>
</defs>
</svg>`;
    }
    idxTypeIconPath(type) {
        return type === 'QF'
            ? `<path d="M13.5 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21H12"/><path d="M8 8h4.5M8 11.5h3"/><path d="m12 15 2 2-2 2"/><path d="M18.4 12.6l.75 2 2 .75-2 .75-.75 2-.75-2-2-.75 2-.75z"/>`
            : type === 'F'
                ? `<circle cx="6" cy="7" r="3.1"/><path d="M6 5.5v3M4.5 7h3"/><path d="M12.5 5.5h7.5M12.5 9.5h7.5M12.5 13.5h5"/>`
                : type === 'D'
                    ? `<rect x="4" y="3.6" width="15.5" height="5.6" rx="1.3"/><rect x="4" y="14.8" width="15.5" height="5.6" rx="1.3"/><path d="M5.6 12h2.2M10 12h2.2M14.4 12h2.2"/>`
                    : `<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>`;
    }
    idxSectionIconSvg(type) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><rect width="26" height="26" rx="7" fill="#ffffff" fill-opacity="0.16"/><g transform="translate(5 5) scale(0.667)" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${this.idxTypeIconPath(type)}</g></svg>`;
    }
    idxLevelChipSvg(tone, type) {
        const tint = this.idxTint(tone, 0.84);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11.5" fill="${tint}"/><g transform="translate(4 4) scale(0.667)" fill="none" stroke="${this.IDX.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${this.idxTypeIconPath(type)}</g></svg>`;
    }
    idxDotSvg(tone) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9"><circle cx="4.5" cy="4.5" r="4.5" fill="${tone}"/></svg>`;
    }
    idxPdfBadgeSvg() {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="18"><rect width="15" height="18" rx="2" fill="#e8453a"/><text x="7.5" y="14.5" fill="#ffffff" font-size="5.5" font-weight="800" text-anchor="middle" font-family="Arial">PDF</text></svg>`;
    }
    idxRunningHeader(casedetail, pageSize) {
        const lineW = Math.max(0, (pageSize?.width || 595.28) - 86);
        return {
            margin: [43, 22, 43, 0],
            stack: [
                {
                    columns: [
                        { svg: this.idxLogoSvg(), width: 21 },
                        { text: 'eTabella', bold: true, fontSize: 12, color: this.IDX.navy, width: 'auto', margin: [7, 5, 0, 0] },
                        { text: 'LEGAL', bold: true, fontSize: 7.5, color: this.IDX.mute2, characterSpacing: 1.2, width: 'auto', margin: [6, 8, 0, 0] },
                        { text: [{ text: 'Case ', color: this.IDX.mute }, { text: `${casedetail?.cCaseno || ''}`, bold: true, color: this.IDX.navy }], fontSize: 8.5, alignment: 'right', margin: [0, 8, 0, 0] },
                    ],
                    columnGap: 6,
                },
                { canvas: [{ type: 'line', x1: 0, y1: 8, x2: lineW, y2: 8, lineWidth: 1.5, lineColor: this.IDX.navy }] },
            ],
        };
    }
    idxRunningFooter(casedetail) {
        return {
            margin: [43, 8, 43, 0],
            table: {
                widths: ['*', 'auto'],
                body: [[
                        { text: [{ text: `${casedetail?.cCasename || ''}`, bold: true, color: this.IDX.mute }, { text: '  ·  Annotation Index', color: this.IDX.mute2 }], fontSize: 8, border: [false, false, false, false] },
                        { text: `Generated ${casedetail?.dExportdt || ''}  ·  Confidential — Legal Work Product`, fontSize: 8, color: this.IDX.mute2, alignment: 'right', border: [false, false, false, false] },
                    ]],
            },
            layout: {
                hLineWidth: (i) => i === 0 ? 1 : 0,
                vLineWidth: () => 0,
                hLineColor: () => this.IDX.line,
                paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 7, paddingBottom: () => 0,
            },
        };
    }
    idxMetaItem(label, value) {
        return {
            width: '*',
            stack: [
                { text: (label || '').toUpperCase(), color: this.IDX.mute2, bold: true, fontSize: 7.5, characterSpacing: 0.6 },
                { text: value || '—', color: this.IDX.ink2, bold: true, fontSize: 10.5, margin: [0, 2, 0, 0] },
            ],
        };
    }
    idxSummaryPill(label, count, _tone) {
        const lw = Math.ceil(label.length * 5.7);
        const cw = Math.ceil(String(count).length * 6.5);
        const W = 12 + lw + 8 + cw + 12;
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="26"><rect x="0.6" y="0.6" width="${(W - 1.2).toFixed(1)}" height="24.8" rx="12.4" fill="${this.IDX.paper}" stroke="#c7d5ea" stroke-width="1"/><text x="12" y="16.6" font-size="10.5" font-weight="bold" fill="${this.IDX.ink2}">${label}</text><text x="${12 + lw + 8}" y="16.6" font-size="10.5" font-weight="bold" fill="${this.IDX.navy}">${String(count)}</text></svg>`;
        return { svg, width: W };
    }
    idxTitleBlock(casedetail, username, counts, enabled) {
        const pills = [];
        if (enabled?.qfact)
            pills.push(this.idxSummaryPill('qFact', counts.qfact, this.idxTypeTone('QF')));
        if (enabled?.fact)
            pills.push(this.idxSummaryPill('Facts', counts.fact, this.idxTypeTone('F')));
        if (enabled?.link)
            pills.push(this.idxSummaryPill('DocLinks', counts.link, this.idxTypeTone('D')));
        const clip = (s, n) => { const t = (s || '').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
        const caseName = clip(casedetail?.cCasename || '', 46);
        const meta = [
            this.idxMetaItem('Case', `${casedetail?.cCaseno || ''}${caseName ? ' · ' + caseName : ''}`),
            this.idxMetaItem('Matter', clip(casedetail?.cDesc || casedetail?.cCasename || '', 52)),
            this.idxMetaItem('Exported by', `${username || ''}${casedetail?.dExportdt ? ' · ' + casedetail.dExportdt : ''}`),
        ];
        return {
            stack: [
                { text: 'EXPORTED WITH ANNOTATIONS', color: this.IDX.accent, bold: true, fontSize: 8, characterSpacing: 1.3, margin: [0, 4, 0, 8] },
                { text: 'Annotation Index', font: 'Lora', bold: true, fontSize: 28, color: this.IDX.navy, margin: [0, 0, 0, 12] },
                { columns: meta, columnGap: 18, margin: [0, 0, 0, 16] },
                ...(pills.length ? [{ columns: [...pills, { text: '', width: '*' }], columnGap: 8, margin: [0, 0, 0, 6] }] : []),
            ],
            margin: [0, 0, 0, 18],
        };
    }
    idxSectionHead(type, count) {
        const navy = this.IDX.navy;
        return {
            table: {
                widths: ['auto', 'auto', '*'],
                body: [[
                        {
                            columns: [
                                { svg: this.idxSectionIconSvg(type), width: 26 },
                                { text: this.idxSectionName(type), bold: true, fontSize: 13.5, color: '#ffffff', margin: [9, 7, 0, 0] },
                            ],
                            fillColor: navy, border: [false, false, false, false], margin: [4, 5, 0, 5],
                        },
                        { text: String(count), font: 'JetBrainsMono', bold: true, fontSize: 9.5, color: '#ffffff', alignment: 'center', fillColor: navy, border: [false, false, false, false], margin: [8, 9, 8, 3] },
                        { text: this.idxSectionDesc(type), color: '#cfe0fb', fontSize: 9, alignment: 'right', fillColor: navy, border: [false, false, false, false], margin: [0, 10, 8, 3] },
                    ]],
            },
            layout: { defaultBorder: false, paddingLeft: () => 8, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            margin: [0, 0, 0, 0],
        };
    }
    idxGroupBand() {
        return {
            table: {
                widths: [44 + 30 + 1, '*'],
                body: [[
                        { text: 'SOURCE DOC', color: this.IDX.mute2, bold: true, fontSize: 7.5, characterSpacing: 1, fillColor: '#ffffff', border: [true, false, false, false], borderColor: [this.IDX.line, '', '', ''], margin: [12, 6, 0, 3] },
                        { text: 'DESTINATION DOC', color: this.IDX.accent, bold: true, fontSize: 7.5, characterSpacing: 1, fillColor: '#ffffff', border: [true, false, true, false], borderColor: [this.IDX.line, '', this.IDX.line, ''], margin: [12, 6, 0, 3] },
                    ]],
            },
            layout: { hLineWidth: () => 0, vLineWidth: () => 0, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
        };
    }
    idxTableHead(type) {
        const cells = [
            { text: 'Page', style: 'idxTh' },
            { text: 'Level', style: 'idxTh', alignment: 'center' },
            { text: 'Source Text', style: 'idxTh' },
        ];
        if (type === 'D') {
            cells.push({ text: '[ Bundle | Tab | Page ]', style: 'idxTh' });
            cells.push({ text: 'Doc title', style: 'idxTh' });
        }
        else if (type === 'W') {
            cells.push({ text: 'Link URL', style: 'idxTh' });
        }
        return {
            table: { widths: this.idxColWidths(type), body: [cells.map(c => ({ ...c, fillColor: this.IDX.thead, border: [false, false, false, false] }))] },
            layout: {
                hLineWidth: (i) => i === 0 ? 1 : 0, hLineColor: () => this.IDX.line, vLineWidth: () => 0,
                paddingLeft: () => 12, paddingRight: () => 12, paddingTop: () => 6, paddingBottom: () => 6,
            },
        };
    }
    idxSourceCell(item, type, tone) {
        const raw0 = item.text
            ? item.text
            : (Array.isArray(item.jTexts) ? item.jTexts.filter(Boolean).join(' ') : (item.jTexts || '-'));
        const raw = String(raw0).replace(/\s+/g, ' ').trim() || '-';
        const inner = [{ text: raw, color: this.IDX.ink, fontSize: 9, lineHeight: 1.3 }];
        const iss = item?.issuelist?.[0];
        if (iss?.cIssue) {
            inner.push({
                columns: [
                    { svg: this.idxDotSvg(tone), width: 7, margin: [0, 2, 0, 0] },
                    { text: iss.cIssue, color: this.IDX.mute, fontSize: 8, margin: [4, 0, 0, 0] },
                ], margin: [0, 5, 0, 0],
            });
        }
        return {
            table: { widths: ['*'], body: [[{ stack: inner, fillColor: this.idxTint(tone, 0.80), border: [false, false, false, false], margin: [11, 4, 9, 4] }]] },
            layout: {
                hLineWidth: () => 0, vLineWidth: (i) => i === 0 ? 3 : 0, vLineColor: () => tone,
                paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0,
            },
        };
    }
    idxRowsTable(data, type) {
        try {
            if (!data || !data.length)
                return { text: '' };
            const body = data.map(item => {
                const tone = this.idxRowTone(item, type);
                const row = [
                    { stack: [{ text: this.idxPageText(item), linkToPage: this.getPageno(this.idxPageStart(item)), color: this.IDX.link, decoration: 'underline', destination: { fit: true } }], font: 'JetBrainsMono', fontSize: 9, alignment: 'left', border: [false, false, false, false], margin: [0, 1, 0, 0] },
                    { svg: this.idxLevelChipSvg(tone, type), width: 24, alignment: 'center', border: [false, false, false, false], margin: [0, 0, 0, 0] },
                    { ...this.idxSourceCell(item, type, tone), border: [false, false, false, false] },
                ];
                if (type === 'D') {
                    row.push({ stack: this.getlinkdocs(item.jFiles), font: 'JetBrainsMono', fontSize: 8.5, color: this.IDX.navy, border: [true, false, false, false], borderColor: [this.IDX.line, '', '', ''], margin: [8, 1, 0, 0] });
                    row.push({ columns: [{ svg: this.idxPdfBadgeSvg(), width: 15 }, { stack: this.getFilenames(item.jFiles), fontSize: 9, color: this.IDX.ink2, margin: [6, 0, 0, 0] }], border: [false, false, false, false], margin: [4, 1, 0, 0] });
                }
                else if (type === 'W') {
                    row.push({ text: item.cUrl, link: item.cUrl, color: this.IDX.accent, decoration: 'underline', fontSize: 8.5, border: [false, false, false, false], margin: [4, 2, 0, 0] });
                }
                return row;
            });
            return {
                table: { widths: this.idxColWidths(type), body, dontBreakRows: true },
                layout: {
                    fillColor: (rowIndex) => rowIndex % 2 === 1 ? this.IDX.rowAlt : '#ffffff',
                    hLineWidth: (i, node) => (i === 0 || i === node.table.body.length) ? 1 : 1,
                    hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? this.IDX.line : this.IDX.line2,
                    vLineWidth: (i, node) => (i === 0 || i === node.table.widths.length) ? 1 : 0,
                    vLineColor: () => this.IDX.line,
                    paddingLeft: () => 12, paddingRight: () => 12, paddingTop: () => 9, paddingBottom: () => 9,
                },
                margin: [0, 0, 0, 6],
            };
        }
        catch (error) {
            this.logService.error(`Error in idxRowsTable ${JSON.stringify(error)} `, this.logApp);
            return { text: '' };
        }
    }
    generateAppendix(data) {
        try {
            if (!data.length)
                return [];
            return [
                { text: '', pageBreak: 'after' },
                this.createIndexHeader('Appendix'),
                this.createAppendixTable(data)
            ];
        }
        catch (error) {
            this.logService.error(`Error in generateAppendix ${JSON.stringify(error)} `, this.logApp);
        }
    }
    createIndexHeader(title) {
        try {
            return {
                table: {
                    widths: ['*'],
                    body: [
                        [{ text: 'Index', style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }],
                        [{ text: title, style: ['annotHead'], border: [false, false, false, false] }]
                    ],
                }
            };
        }
        catch (error) {
            this.logService.error(`Error in createIndexHeader ${JSON.stringify(error)} `, this.logApp);
        }
    }
    createTableHeader(type) {
        try {
            return {
                "layout": 'noBorders',
                margin: [10, 0, 10, 10],
                "table": {
                    "widths": ['50%', '50%'],
                    "body": [
                        [
                            { "text": "Source Doc", fontSize: 10, color: '#4f4f4f' },
                            { "text": `${type == 'W' ? '' : 'Destination Doc'}`, fontSize: 10, color: '#4f4f4f' }
                        ]
                    ]
                },
            };
        }
        catch (error) {
            this.logService.error(`Error in createTableHeader ${JSON.stringify(error)} `, this.logApp);
        }
    }
    createAnnotationsTable(data, type) {
        try {
            let content = [];
            if (data.length) {
                content.push({
                    "layout": 'noBorders',
                    "table": {
                        "widths": ['10%', '10%', '30%', `${type == 'W' ? '50%' : '20%'}`, `${type == 'W' ? '0%' : '30%'}`],
                        "body": [
                            [
                                { "text": "Page", "style": "tableHeader2", "alignment": "start", fillColor: '#c2c2c2', color: '#4f4f4f', margin: [3, 6, 6, 3] },
                                { "text": "Level", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Source Text", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": `${type == 'W' ? 'Link URL' : '[ Bundle | Tab | Page ]'}`, "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": `${type == 'W' ? '' : 'Doc title'}`, "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' }
                            ],
                        ]
                    }, "margin": [10, 0, 10, 0]
                });
                if (type == 'W') {
                    const table1 = this.annotationsWebTable(data);
                    if (table1)
                        content.push(table1);
                }
                else {
                    const table1 = this.annotationsTable(data);
                    if (table1)
                        content.push(table1);
                }
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in createAnnotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    }
    annotationsTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length)
                return null;
            return {
                table: {
                    "widths": ['10%', '10%', '30%', '20%', '30%'],
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: this.genlinkpage(item),
                                style: 'tableRowEven',
                                alignment: 'start',
                                margin: [0, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": item?.jLinktype?.type == 'F' ? `${this.configService.get('ASSETS')}icon/file.png` : item?.jLinktype?.type == 'P' ? `${this.configService.get('ASSETS')}icon/pagefile.png` : `${this.configService.get('ASSETS')}icon/highlight.png`,
                                        "width": 10,
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        table: {
                                            widths: ['*'],
                                            body: [[
                                                    {
                                                        text: item.text
                                                            ? item.text
                                                            : (item.jTexts?.length ? this.getFacttext(item.jTexts) : '-'),
                                                        fillColor: '#ffffff',
                                                        fontSize: 5,
                                                        margin: [0, 0, 0, 0],
                                                        border: [false, false, false, false]
                                                    }
                                                ]]
                                        },
                                        layout: {
                                            defaultBorder: false,
                                            paddingLeft: () => 5,
                                            paddingRight: () => 5,
                                            paddingTop: () => 5,
                                            paddingBottom: () => 5
                                        }
                                    },
                                    {
                                        columns: item.nFSid > 0 ? [
                                            {
                                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                                                    <rect width="80" height="30"  fill="white" stroke="#c2c2c2" stroke-width="1" rx="8" ry="8"/>
                                                    <image href="${this.configService.get('ASSETS')}icon/linksicon/fact.png" x="10" y="9" height="10" width="10" />
                                                    <text x="5" y="19" fill="#ffffff" fill-opacity="0.1" style="font-size:10px">FACT_BUTTON${item.nFSid}</text>
                                                    <text x="25" y="18" fill="#4f4f4f" style="font-size:10px">Fact Sheet</text>
                                                </svg>`,
                                                style: 'tableRowEven', "margin": [0, 0, 0, 0],
                                            }
                                        ] : [],
                                        padding: [5, 5, 0, 0],
                                        "margin": [5, 10, 0, 0], border: [true, true, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'],
                                        "link": `FACT_BUTTON${item.nFSid}`,
                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getlinkdocs(item.jFiles), style: 'tableRowEven', alignment: 'left',
                                margin: [0, 3, 0, 0],
                                border: [false, false, false, false],
                                borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getFilenames(item.jFiles),
                                margin: [0, 0, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#f1f1f1', alignment: 'left'
                            }
                        ])
                    ],
                    dontBreakRows: true
                },
                margin: [10, 10, 10, 10],
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
            this.logger.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
            this.logService.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    }
    ;
    annotationsWebTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length)
                return null;
            return {
                table: {
                    "widths": ['10%', '10%', '30%', '20%', '30%'],
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: this.genlinkpage(item),
                                style: 'tableRowEven',
                                alignment: 'start',
                                margin: [0, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": item.jLinktype?.type == 'F' ? `${this.configService.get('ASSETS')}icon/file.png` : item.jLinktype?.type == 'P' ? `${this.configService.get('ASSETS')}icon/pagefile.png` : `${this.configService.get('ASSETS')}icon/highlight.png`,
                                        "width": 10,
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        table: {
                                            widths: ['*'],
                                            body: [[
                                                    {
                                                        text: item.text
                                                            ? item.text
                                                            : (item.jTexts?.length ? this.getFacttext(item.jTexts) : '-'),
                                                        fillColor: '#ffffff',
                                                        fontSize: 5,
                                                        margin: [0, 0, 0, 0],
                                                        border: [false, false, false, false]
                                                    }
                                                ]]
                                        },
                                        layout: {
                                            defaultBorder: false,
                                            paddingLeft: () => 5,
                                            paddingRight: () => 5,
                                            paddingTop: () => 5,
                                            paddingBottom: () => 5
                                        }
                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                text: item.cUrl,
                                link: item.cUrl,
                                color: 'blue',
                                decoration: 'underline',
                                fontSize: 8,
                                "margin": [5, 10, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#f1f1f1', alignment: 'left'
                            }
                        ])
                    ],
                    dontBreakRows: true
                },
                margin: [10, 10, 10, 10],
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
            this.logger.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
            this.logService.error(`Error in annotationsTable ${JSON.stringify(error)} `, this.logApp);
        }
    }
    ;
    getFilenames(data) {
        try {
            if (!data || !data.length)
                return [];
            var content = [];
            for (let item of data) {
                content.push({ text: item.cFilename, style: 'tableRowEven', border: [false, false, false, false], alignment: 'left', margin: [0, 3, 0, 3] });
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in getFilenames ${JSON.stringify(error)} `, this.logApp);
        }
    }
    createAppendixTableHeader() {
    }
    createAppendixTable(data) {
        try {
            let content = [];
            if (data.length) {
                content.push({
                    "layout": 'noBorders',
                    "table": {
                        "widths": ['10%', '5%', '55%', '15%', '15%'],
                        "body": [
                            [
                                { "text": "Page", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', margin: [5, 6, 6, 5], color: '#4f4f4f' },
                                { "text": "Level", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Fact Text", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Issues", "style": "tableHeader2", "alignment": "left", fillColor: '#c2c2c2', color: '#4f4f4f' },
                                { "text": "Authors", "style": "tableHeader2", "alignment": "center", fillColor: '#c2c2c2', color: '#4f4f4f' }
                            ],
                        ]
                    }, "margin": [10, 0, 10, 0]
                });
                const table1 = this.appendixTable(data);
                if (table1)
                    content.push(table1);
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in createAppendixTable ${JSON.stringify(error)} `, this.logApp);
        }
    }
    appendixTable(tablelist) {
        try {
            if (!tablelist || !tablelist.length)
                return null;
            return {
                table: {
                    "widths": ['10%', '5%', '55%', '15%', '15%'],
                    body: [
                        ...tablelist.map(item => [
                            {
                                stack: [
                                    {
                                        text: item.cPage,
                                        linkToPage: this.getPageno(item.cPage),
                                        style: 'tableRowEven',
                                        color: '#ff3d00', "decoration": "underline"
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'left',
                                margin: [5, 3, 0, 3],
                                border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        "image": `${this.configService.get('ASSETS')}icon/file.png`,
                                        "width": 10,
                                        "margin": [5, 5, 0, 0],
                                    }
                                ],
                                style: 'tableRowEven',
                                alignment: 'center',
                                margin: [0, 3, 0, 3], border: [false, false, false, false]
                            },
                            {
                                stack: [
                                    {
                                        text: item.cType == 'M' ? item.cFact : this.getFacttext(item.jTexts),
                                        style: 'tableRowEven', margin: [0, 10, 0, 0]
                                    },
                                    {
                                        columns: item.nFSid > 0 ? [
                                            {
                                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="30">
                                                    <rect width="80" height="30"  fill="white" stroke="#c2c2c2" stroke-width="1" rx="8" ry="8"/>
                                                    <image href="${this.configService.get('ASSETS')}icon/linksicon/fact.png" x="10" y="9" height="10" width="10" />
                                                    <text x="5" y="19" fill="#ffffff" fill-opacity="0.1" style="font-size:10px">FACT_BUTTON${item.nFSid}</text>
                                                    <text x="25" y="18" fill="#4f4f4f" style="font-size:10px">Fact Sheet</text>
                                                </svg>`,
                                            }
                                        ] : [],
                                        padding: [5, 5, 0, 0],
                                        "margin": [5, 10, 0, 0], border: [true, true, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'],
                                        "link": `FACT_BUTTON ${item.nFSid}`,
                                    }
                                ], style: 'tableRowEven', margin: [5, 5, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: [
                                    this.getIssues(item.issuelist)
                                ], style: 'tableRowEven', alignment: 'left', margin: [0, 0, 0, 0], border: [false, false, false, false], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff']
                            },
                            {
                                stack: this.getContacts(item.jContact),
                                margin: [0, 0, 0, 0], border: [false, false, true, true], borderColor: ['#6f6f6f', '#6f6f6f', '#6f6f6f', '#ffffff'], fillColor: '#fafafa'
                            }
                        ])
                    ],
                    dontBreakRows: true, "margin": [10, 0, 10, 0]
                },
                margin: [10, 0, 10, 0],
                layout: 'noBorders'
            };
        }
        catch (error) {
            this.logService.error(`Error in appendixTable ${JSON.stringify(error)} `, this.logApp);
        }
    }
    ;
    getIssues(data) {
        try {
            if (!data || !data.length)
                return [];
            var content = [];
            for (let item of data) {
                content.push({
                    columns: [
                        {
                            "svg": `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="12">
                        <line x1='5' y1='0' x2='5' y2='10' style='stroke:${item.cClr.substring(0, 7)}; stroke-width:2' />
                        <text x="10" y="8" fill="#4f4f4f" style="font-size:10px">${item.cIssue}</text>
                    </svg>`,
                            margin: [0, 10, 0, 0]
                        },
                    ]
                });
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in getIssues ${JSON.stringify(error)} `, this.logApp);
        }
    }
    getContacts(data) {
        try {
            if (!data || !data.length)
                return [];
            var content = [];
            for (let item of data) {
                content.push({
                    columns: [this.imageSection(item),
                    ]
                });
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in getContacts ${JSON.stringify(error)} `, this.logApp);
        }
    }
    imageSection(item) {
        try {
            var dynamicImageLink = item.cProfile;
            var result = dynamicImageLink && dynamicImageLink != '' ?
                [{
                        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                        <defs>
                            <clipPath id="circleView">
                                <circle cx="15" cy="15" r="15" fill="#ffffff"/>
                            </clipPath>
                        </defs>
                        <circle cx="15" cy="15" r="15" fill="white" clip-path="url(#circleView)"/>
                        <image href="./public/img/${dynamicImageLink}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                    </svg>`,
                        "width": 30,
                        margin: [0, 6, 0, 6]
                    }]
                :
                    [{
                            svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                        <circle cx="15" cy="15" r="15" fill="#b0c4de"/>
                        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10" font-family="Arial, sans-serif" >${this.getUserinit(item)}</text>
                    </svg>`,
                            "width": 30,
                            margin: [0, 6, 0, 6]
                        }];
            return result;
        }
        catch (error) {
            this.logService.error(`Error in imageSection ${JSON.stringify(error)} `, this.logApp);
        }
    }
    getFacttext(data) {
        try {
            if (!data || !data.length)
                return [];
            var content = [];
            for (let item of data) {
                content.push({ text: item, border: [false, false, false, false], alignment: 'left', margin: [5, 5, 5, 5], fillColor: '#ffffff', fontSize: 10, color: '#4f4f4f' });
            }
            return content;
        }
        catch (error) {
            this.logService.error(`Error in imageSection ${JSON.stringify(error)} `, this.logApp);
        }
    }
    getDocumentStyles() {
        try {
            return {
                header: { fontSize: 24, color: "#ff3d00", fontWeight: 400, lineHeight: 1.2, letterSpacing: 0.2 },
                subheader: { bold: true },
                boldText: { bold: true },
                topHeader: { fontSize: 14, bold: true, margin: [0, 190, 0, 20], alignment: "center" },
                linkStyle: { fontSize: 10, color: "#ff3d00" },
                header2: { fontSize: 18, color: "#ffffff", lineHeight: 1.2, letterSpacing: 0.2 },
                hTable: { bold: true, fontSize: 16, padding: [5, 0, 5, 0], margin: [20, 10, 0, 10] },
                annotHead: { bold: true, fontSize: 14, padding: [5, 0, 5, 0], margin: [20, 10, 0, 5], color: '#4f4f4f' },
                tableHeader: { fontSize: 12, color: '#4f4f4f', margin: [25, 0, 0, 10] },
                contentBackground: { fillColor: '#4f4f4f', color: '#ffffff' },
                tableRowEven: { fontSize: 9, color: '#2a3a55' },
                tableHeader2: { fontSize: 8, margin: [0, 5, 0, 5], fillColor: '#6f6f6f' },
                tableContent: { fontSize: 10, margin: [0, 5, 0, 5] },
                idxTh: { bold: true, fontSize: 8.5, color: '#5b6b85', characterSpacing: 0.3 },
            };
        }
        catch (error) {
            this.logService.error(`Error in getDocumentStyles ${JSON.stringify(error)} `, this.logApp);
        }
    }
    async createFactsheetPdf(mdl, item, path) {
        let res = await this.db.executeRef('factsheet_detail', { nBundledetailid: mdl.nBundledetailid, nMasterid: mdl.nUserid, nFSid: item.nFSid, bIsTranscipt: mdl?.bIsTranscipt ?? false });
        try {
            var bundle_detail = res[0]["bundle_detail"][0];
            var curretfact = res[0]["fact_detail"][0];
            var issue_ls = res[0]["issue_ls"] ? res[0]["issue_ls"] : [];
            var task_ls = res[0]["task_ls"] ? res[0]["task_ls"] : [];
            var contact_ls = res[0]["contact_ls"] ? res[0]["contact_ls"] : [];
            var filelist = res[0]["filelist"] ? res[0]["filelist"] : [];
            var user_list = res[0]["user_list"] ? res[0]["user_list"] : [];
            const generateCurretfact = (curretfact) => {
                if (!curretfact.jTexts || !curretfact.jTexts.length) {
                    return [];
                }
                var content = [];
                if (curretfact.jTexts && curretfact.jTexts.length) {
                    var detail = {
                        style: 'tableExample',
                        table: {
                            widths: ['*'],
                            body: [...curretfact.jTexts.map(item => [
                                    {
                                        text: item,
                                        alignment: 'left',
                                        color: '#4f4f4f',
                                        fillColor: '#fafafa',
                                        margin: [10, 5, 5, 10]
                                    },
                                ])
                            ]
                        },
                        layout: 'noBorders'
                    };
                    content.push(detail);
                    return content;
                }
                else
                    return [];
            };
            const fetDatetype = (curretfact) => {
                if (curretfact["jDate"] && curretfact["jDate"]["tpy"] && curretfact["jDate"]["tpy"] != 'Between' && curretfact["jDate"]["tpy"] != 'From to') {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["tpy"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    });
                }
                else if (curretfact["jDate"] && curretfact["jDate"]["tpy"] && (curretfact["jDate"]["tpy"] == 'Between' || curretfact["jDate"]["tpy"] == 'From to')) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["tpy"]} to `,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    });
                }
                if (curretfact["jDate"] && curretfact["jDate"]["dt1"]) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["dt1"]} ${curretfact["jDate"]["tm1"]} ${curretfact["jDate"]["gear1"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    });
                }
                if (curretfact["jDate"] && curretfact["jDate"]["dt2"]) {
                    return ({
                        text: `Date Type: ${curretfact["jDate"]["dt2"]} ${curretfact["jDate"]["tm2"]} ${curretfact["jDate"]["gear2"]}`,
                        style: 'contentText',
                        fontSize: 10,
                        margin: [0, 3, 0, 3]
                    });
                }
            };
            function toLowercaseAndRemoveSpaces(str) {
                return str.toLowerCase().replace(/\s+/g, '');
            }
            const getIssueSubls = (subitem) => {
                var content = [];
                var isuclr = subitem.cClr.substr(0, 7);
                var impactimage = subitem.cImpact ? './public/img/impact/' + toLowercaseAndRemoveSpaces(subitem.cImpact) + '.png' : '';
                content.push({
                    stack: [
                        {
                            svg: `<svg width="3px" height="10px" xmlns="http://www.w3.org/2000/svg">
                                     <rect x="0" y="0" width="3" height="10" rx="1" ry="1" fill="${isuclr}" />
                                  </svg>`,
                            fit: [3, 10],
                        },
                        {
                            text: subitem.cIssue,
                            alignment: 'left',
                            color: '#4f4f4f',
                            margin: [10, -12, 0, 0]
                        }
                    ],
                    alignment: 'start',
                    color: '#4f4f4f',
                    margin: [0, 10, 0, 10],
                }),
                    content.push({
                        text: subitem.cRelevance ? subitem.cRelevance : '-',
                        alignment: 'start',
                        fontSize: 10,
                        margin: [0, 10, 0, 10],
                    }),
                    content.push({
                        columns: [
                            {
                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15">
                    <image href="${impactimage}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                </svg>`,
                                "width": impactimage ? 15 : 0,
                                alignment: 'center',
                                margin: [0, 0, 0, 0]
                            },
                            {
                                text: subitem.cImpact ? subitem.cImpact : '-',
                                alignment: 'left',
                                color: '#4f4f4f',
                                width: 'auto',
                                fontSize: 10,
                                margin: [-15, 2, 0, 0]
                            }
                        ],
                        margin: [0, 10, 0, 10],
                    });
                return content;
            };
            const getFactIssues = (issue) => {
                if (!issue || !issue.length) {
                    return [];
                }
                ;
                var content = [];
                content.push({
                    text: 'Issues',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10]
                });
                var detail = {
                    style: 'tableExample',
                    table: {
                        widths: ['*', 100, 100],
                        body: [[{
                                    text: `Claim: ${issue[0].cCategory}`,
                                    alignment: 'left',
                                    color: '#4f4f4f',
                                },
                                {
                                    text: 'Relevance',
                                    alignment: 'left',
                                    color: '#4f4f4f',
                                },
                                {
                                    text: 'Impact',
                                    alignment: 'left',
                                    color: '#4f4f4f',
                                }],
                            ...issue.filter(item => item.sublist && item.sublist.length).map(item => {
                                for (let subitem of item.sublist) {
                                    var ls = getIssueSubls(subitem);
                                    return ls;
                                }
                            })
                        ]
                    },
                    layout: 'noBorders'
                };
                content.push(detail);
                return content;
            };
            let generatefactBox = () => {
                var content = [];
                content.push({
                    text: 'Fact Box',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10],
                });
                if (curretfact?.cType == 'M') {
                    content.push({
                        style: 'tableExample',
                        table: {
                            widths: ['*'],
                            body: [
                                {
                                    text: curretfact.cFact ? curretfact.cFact : '',
                                    alignment: 'left',
                                    color: '#4f4f4f',
                                    fillColor: '#fafafa',
                                    margin: [5, 5, 5, 5]
                                }
                            ]
                        },
                        layout: 'noBorders'
                    });
                }
                else {
                    if (curretfact.jTexts && curretfact.jTexts.length) {
                        var detail = {
                            style: 'tableExample',
                            table: {
                                widths: ['*'],
                                body: [...curretfact.jTexts.map(item => [
                                        {
                                            text: item.txt,
                                            alignment: 'left',
                                            color: '#4f4f4f',
                                            fillColor: '#fafafa',
                                            margin: [10, 5, 5, 10]
                                        },
                                    ])
                                ]
                            },
                            layout: 'noBorders'
                        };
                        content.push(detail);
                    }
                }
                return content;
            };
            let generateContact = () => {
                if (!contact_ls || !contact_ls.length) {
                    return [];
                }
                ;
                var content = [];
                content.push({
                    text: 'Contacts',
                    style: 'subHeader',
                    margin: [0, 10, 0, 10],
                });
                content.push({
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 5,
                            x2: 530,
                            y2: 5,
                            lineWidth: 1,
                            lineColor: '#c2c2c2',
                        }
                    ],
                    margin: [0, 5, 0, 15]
                });
                let imageSection = (item) => {
                    var dynamicImageLink = item.cProfile;
                    var result = dynamicImageLink && dynamicImageLink != '' ?
                        [{
                                svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                            <defs>
                                <clipPath id="circleView">
                                    <circle cx="15" cy="15" r="15" fill="#ffffff"/>
                                </clipPath>
                            </defs>
                            <circle cx="15" cy="15" r="15" fill="white" clip-path="url(#circleView)"/>
                            <image href="./public/img/${dynamicImageLink}" width="100%" height="100%"  clip-path="url(#circleView)" preserveAspectRatio="xMidYMid slice"/>
                        </svg>`,
                                "width": 30,
                                margin: [0, 6, 0, 6]
                            }]
                        :
                            [{
                                    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
                            <circle cx="15" cy="15" r="15" fill="#b0c4de"/>
                            <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="10" font-family="Arial, sans-serif" >${this.getUserinit(item)}</text>
                        </svg>`,
                                    "width": 30,
                                    margin: [0, 6, 0, 6]
                                }];
                    return result;
                };
                content.push({
                    style: 'tableExample',
                    table: {
                        widths: [40, '*'],
                        body: [...contact_ls.map(item => [
                                imageSection(item),
                                {
                                    table: {
                                        widths: ['*'],
                                        body: [
                                            [
                                                { text: `${item.cFname} ${item.cLname}`, style: 'subHeader' },
                                            ],
                                            [
                                                { text: `${item.cEmail}`, style: 'smallText' }
                                            ]
                                        ],
                                    },
                                    layout: 'noBorders'
                                }
                            ])
                        ]
                    },
                    layout: 'noBorders'
                });
                return content;
            };
            let generateTasks = () => {
                if (!task_ls.length) {
                    return [];
                }
                ;
                var content = [];
                content.push({
                    text: 'Tasks',
                    style: 'subHeader'
                });
                content.push({
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 5,
                            x2: 530,
                            y2: 5,
                            lineWidth: 1,
                            lineColor: '#c2c2c2',
                        }
                    ],
                    margin: [0, 5, 0, 15]
                });
                content.push(...task_ls.map(item => ([{
                        style: '',
                        table: {
                            widths: ['*'],
                            body: [
                                [
                                    {
                                        text: item.cSubject,
                                        style: 'smallText',
                                        fillColor: '#f1f1f1',
                                        color: '#202020',
                                        margin: [10, 10, 10, 10],
                                        bold: true
                                    }
                                ],
                            ],
                        },
                        layout: 'noBorders'
                    },
                    {
                        text: '',
                        margin: [0, 5]
                    },
                ])));
                return content;
            };
            const docDefinition = {
                pageSize: mdl.cPgsize || 'A4',
                background: function (currentPage, pageSize) {
                    if (currentPage === 1) {
                        return null;
                    }
                    return [
                        { text: 'Appendix', style: ['hTable', 'contentBackground'], border: [false, false, false, true], borderColor: ['#ffffff', '#ffffff', '#ffffff', '#ffffff'] }
                    ];
                },
                content: [
                    {
                        text: 'Fact Sheet',
                        style: 'header'
                    },
                    {
                        style: 'box',
                        table: {
                            widths: ['*'],
                            body: [
                                [{
                                        stack: [
                                            {
                                                style: '',
                                                table: {
                                                    widths: ['*'],
                                                    body: [
                                                        [
                                                            {
                                                                text: 'Source File',
                                                                style: 'smallText',
                                                                fillColor: '#fafafa',
                                                                margin: [10, 5, 10, 0],
                                                                bold: true
                                                            }
                                                        ],
                                                    ],
                                                },
                                                layout: 'noBorders'
                                            },
                                            {
                                                style: 'tableExample',
                                                table: {
                                                    widths: [50, '*'],
                                                    body: [
                                                        [
                                                            {
                                                                svg: `<svg width="23" height="24" viewBox="0 0 23 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                     <path d="M9.47929 0.000112119C9.8952 0.00682026 10.2655 0.268438 10.409 0.660194L15.2134 13.7625L13.6531 15.351L13.0252 13.6405H5.50404L3.76261 18.1389C3.66618 18.388 3.47476 18.5886 3.23045 18.6965C2.98614 18.8045 2.70896 18.8109 2.45989 18.7145C2.21081 18.6181 2.01024 18.4266 1.90231 18.1823C1.79437 17.938 1.7879 17.6608 1.88433 17.4118L3.87531 12.2693L3.87933 12.2586L8.53076 0.630678C8.60664 0.442046 8.73789 0.280829 8.90722 0.168266C9.07654 0.0557037 9.27599 -0.0029224 9.47929 0.000112119ZM9.42428 3.81839L6.29963 11.6267H12.2873L9.42428 3.81839Z" fill="#4F4F4F"/>
                                                     <path d="M22.0168 12.8213L21.8437 12.6791L21.8397 12.6764C21.2555 12.2408 20.5341 12.0298 19.8072 12.082C19.0803 12.1342 18.3965 12.4462 17.8805 12.9608L12.7783 18.1529C12.4617 18.4736 12.2309 18.8627 12.1035 19.2866L11.3159 21.9055C10.6027 22.0172 9.87619 22.014 9.16396 21.8961C9.15654 21.8949 9.14951 21.892 9.14337 21.8876C9.13724 21.8833 9.13217 21.8776 9.12855 21.871C9.12494 21.8644 9.12286 21.8571 9.12249 21.8496C9.12211 21.8421 9.12345 21.8346 9.1264 21.8277L9.17603 21.7203C9.26458 21.5365 9.41753 21.2092 9.46851 20.8724C9.49534 20.6846 9.50473 20.4243 9.40277 20.1479C9.29753 19.8613 9.09786 19.6191 8.8366 19.461C8.40192 19.1927 7.86124 19.1726 7.39704 19.1994C6.93223 19.2335 6.47016 19.298 6.01382 19.3926C5.39398 19.5134 4.80501 19.7911 4.21738 20.0674C3.4446 20.4324 2.6745 20.7946 1.84135 20.7946C1.54217 20.7946 1.25506 20.7463 0.985391 20.6551C0.82037 20.6001 0.63925 20.7342 0.680841 20.9033C0.757313 21.2092 0.898185 21.6237 1.20676 21.943C1.39393 22.1386 1.63215 22.2779 1.89441 22.345C2.15668 22.4121 2.43249 22.4044 2.6906 22.3227C4.64133 21.7512 5.93734 21.4399 6.77989 21.2991C6.95698 21.2695 7.08846 21.4466 7.0348 21.6184C6.95027 21.8867 6.82953 22.3938 7.08041 22.9063C7.35142 23.4645 7.88539 23.6979 8.34691 23.7918C9.88039 24.1084 11.2046 24.0668 12.8226 23.6415C12.894 23.6298 12.9644 23.6128 13.0332 23.5906L13.1902 23.5409C13.4196 23.4738 13.6557 23.4001 13.8999 23.3182C13.9364 23.3064 13.9723 23.2925 14.0072 23.2766L15.8681 22.6742C16.3216 22.5267 16.7307 22.2771 17.0581 21.943L22.1496 16.7644C23.2041 15.6897 23.2001 14.0341 22.1737 12.9729L22.0168 12.8213Z" fill="#4F4F4F"/>

                                                 </svg>`,
                                                                width: 20,
                                                                style: 'tableImage',
                                                                fillColor: '#fafafa',
                                                                margin: [0, 10, 0, 10],
                                                            },
                                                            {
                                                                stack: [
                                                                    { text: bundle_detail.cFilename, style: 'smallText', bold: true },
                                                                    {
                                                                        text: [`[ ${(bundle_detail.cTab ? bundle_detail.cTab : '-')} | ${bundle_detail.cBundletag ? bundle_detail.cBundletag :
                                                                                '–'} | `, {
                                                                                text: `${(curretfact && curretfact.jLinktype && curretfact.jLinktype.typ ==
                                                                                    'P') ? curretfact && curretfact.jLinktype && curretfact.jLinktype.val && curretfact.jLinktype.val.frm + '–' + curretfact.jLinktype.val.to :
                                                                                    curretfact?.cPage}`,
                                                                                "linkToPage": this.getPageno((curretfact && curretfact.jLinktype && curretfact.jLinktype.typ ==
                                                                                    'P') ? curretfact && curretfact.jLinktype && curretfact.jLinktype.val && curretfact.jLinktype.val.frm + '–' + curretfact.jLinktype.val.to :
                                                                                    curretfact?.cPage),
                                                                                style: 'tableRowEven',
                                                                                color: '#ff3d00', "decoration": "underline"
                                                                            }, ` ]`],
                                                                        style: 'smallText',
                                                                        margin: [0, 3, 0, 3]
                                                                    },
                                                                    { text: `Exhibit No – ${bundle_detail && bundle_detail.cExhibitno ? bundle_detail.cExhibitno : '–'}`, style: 'smallText' }
                                                                ],
                                                                margin: [0, 10, 0, 10],
                                                                fillColor: '#fafafa'
                                                            }
                                                        ]
                                                    ],
                                                },
                                                layout: 'noBorders'
                                            },
                                            {
                                                text: 'Source Text',
                                                style: 'subHeader',
                                                margin: [0, 10, 0, 10]
                                            },
                                            generateCurretfact(curretfact),
                                            {
                                                text: `Time Zone ${curretfact.cTimezone ? curretfact.cTimezone : ''}`,
                                                style: 'contentText',
                                                margin: [0, 3, 5, 3],
                                                fontSize: 10
                                            },
                                            fetDatetype(curretfact),
                                            getFactIssues(issue_ls),
                                            {
                                                canvas: [
                                                    {
                                                        type: 'line',
                                                        x1: 0,
                                                        y1: 5,
                                                        x2: 530,
                                                        y2: 5,
                                                        lineWidth: 1,
                                                        lineColor: '#c2c2c2',
                                                    }
                                                ],
                                                margin: [0, 10, 0, 10]
                                            },
                                            generatefactBox(),
                                            generateContact(),
                                            generateTasks()
                                        ],
                                        margin: [20, 20, 20, 20],
                                    }]
                            ]
                        },
                        layout: 'noBorders'
                    }
                ],
                styles: {
                    header: {
                        fontSize: 16,
                        bold: true,
                        margin: [10, 10, 10, 10],
                        color: '#202020'
                    },
                    subHeader: {
                        fontSize: 12,
                        bold: true,
                        color: '#202020'
                    },
                    contentText: {
                        fontSize: 12,
                        color: '#4f4f4f'
                    },
                    smallText: {
                        fontSize: 10,
                        color: '#4f4f4f'
                    },
                    tableExample: {
                        margin: [0, 0, 0, 15]
                    },
                    tableImage: {
                        alignment: 'center'
                    },
                    box: {
                        margin: [10, 10, 10, 10]
                    }
                },
                defaultStyle: {
                    columnGap: 20
                },
                pageMargins: [0, 0, 0, 0]
            };
            const pdfDoc = this.printer.createPdfKitDocument(docDefinition);
            pdfDoc.pipe((0, fs_1.createWriteStream)(path));
            pdfDoc.pipe((0, fs_1.createWriteStream)(path)).on('finish', () => {
                return { msg: 1 };
            }, error => {
                return { msg: -1, error: error };
            });
            pdfDoc.end();
        }
        catch (error) {
            this.logService.error(`Error in createFactsheetPdf ${JSON.stringify(error)} `, this.logApp);
            return { msg: -1, error: error };
        }
    }
    async readContent(pdfDoc, mdl, numPages, nExportid, nMasterid) {
        try {
            const pdfPath = this.FILEPATH + 'export/' + mdl.folder + '/modified_linked.pdf';
            const indexFpath = this.FILEPATH + 'export/' + mdl.folder + '/indx.pdf';
            let pageCount = 0;
            if (fs.existsSync(indexFpath)) {
                const firstPDFDATA = await fs.readFileSync(indexFpath);
                const firstPDF = await pdf_lib_1.PDFDocument.load(firstPDFDATA, { ignoreEncryption: true });
                pageCount = firstPDF.getPageCount();
            }
            const annotations = [];
            const pdfjsLib = await Promise.resolve().then(() => __webpack_require__(31));
            const loadingTask = pdfjsLib.getDocument(pdfPath);
            await loadingTask.promise
                .then((doc) => {
                let lastPromise = doc.getMetadata().then(() => { });
                const loadPage = async (pageNum) => {
                    const page = await doc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const textContent = await page.getTextContent();
                    await this.processTextContent(textContent, mdl, pageNum, page);
                    const annotation = await page.getAnnotations();
                    const links = annotation.filter((ann) => ann.subtype === 'Link');
                    links.filter((ann) => !ann.url && ann.dest).forEach((item) => {
                        if (Array.isArray(item.dest)) {
                            item.dest[0] = parseInt(item.dest[0]) + pageCount;
                        }
                    });
                    annotations.push({ page: pageNum, annotation: links });
                    return { textContent, annotation };
                };
                for (let i = 1; i <= numPages; i++) {
                    console.log('Step 2.' + i);
                    lastPromise = lastPromise.then(loadPage.bind(null, i));
                }
                return lastPromise;
            })
                .then(async () => {
                console.log('Step 3');
                console.log('# End of Document');
                await this.finalizeDocument(pdfDoc, annotations, mdl, nExportid, nMasterid);
                Promise.resolve();
            }, (err) => {
                console.error('Error: ' + err);
                Promise.resolve();
            });
        }
        catch (error) {
            this.logService.error(`Error in readContent ${JSON.stringify(error)} `, this.logApp);
        }
    }
    async finalizeDocument(pdfDoc, annotations, mdl, nExportid, nMasterid) {
        await new Promise(async (resolve) => {
            await this.updateProgress(nExportid, nMasterid, mdl, 'R');
            this.applyInternalLink(pdfDoc, annotations, mdl, async (rs) => {
                await this.updateProgress(nExportid, nMasterid, mdl, 'U');
                resolve({ msg: 1 });
            });
        });
        const pdfBytes = await pdfDoc.save();
        mdl.finalPath = 'export/' + mdl.folder + '/modified.pdf';
        mdl.cStatus = 'C';
        const directoryPath = path.join(this.FILEPATH, mdl.finalPath);
        await fs.writeFileSync(directoryPath, pdfBytes);
        console.log('File saved');
        await this.cleanupFiles(mdl.folder);
    }
    processTextContent(content, mdl, pageNum, page) {
        try {
            console.log('Step 2.2');
            const arrayFiltered = content.items.filter((item) => item.str.includes('FACT_BUTTON'));
            arrayFiltered.forEach((k) => {
                const strings = k;
                if (strings) {
                    console.log('Step 2.3');
                    const transformArray = strings['transform'];
                    const x = transformArray[4];
                    const y = transformArray[5];
                    const nFSid = parseInt(strings.str.replace('FACT_BUTTON', ''));
                    if (mdl.factsheets_array && mdl.factsheets_array.length) {
                        const ojs = mdl.factsheets_array.find((a) => a.nFSid === nFSid);
                        if (ojs) {
                            if (!ojs.positions) {
                                ojs.positions = [];
                            }
                            ojs.positions.push({
                                x: x,
                                y: y,
                                topage: pageNum,
                                viewport: page.getViewport({ scale: 1 }),
                                height: k.height,
                                width: k.width,
                            });
                        }
                    }
                }
            });
        }
        catch (error) {
            console.error('Error on getTextContent', error);
        }
        try {
            const indexArrayFiltered = content.items.filter((item) => item.str.includes('PG$-'));
            if (!mdl.indexpagesls) {
                mdl.indexpagesls = [];
            }
            if (indexArrayFiltered) {
                indexArrayFiltered.forEach((k) => {
                    const strings = k;
                    if (strings) {
                        const transformArray = strings['transform'];
                        const x = transformArray[4];
                        const y = transformArray[5];
                        const pgs = parseInt(strings.str.replace('PG$-', ''));
                        mdl.indexpagesls.push({
                            x: x,
                            y: y,
                            topage: pageNum,
                            viewport: page.getViewport({ scale: 1 }),
                            height: k.height,
                            width: k.width,
                            startpg: parseInt(pgs ? pgs : 0),
                        });
                    }
                });
            }
        }
        catch (error) {
            console.error('Error on getTextContent index', error);
        }
        page.cleanup();
        return Promise.resolve();
    }
    async applyInternalLink(pdfDoc, annotations, mdl, cb) {
        const pagelist = pdfDoc.getPages();
        const appendAnnotationsToPage = (page, newAnnotations) => {
            const existingAnnotations = page.node.get(pdf_lib_1.PDFName.of('Annots'));
            if (existingAnnotations instanceof pdf_lib_1.PDFArray) {
                newAnnotations.forEach(annotation => {
                    if (annotation)
                        existingAnnotations.push(annotation);
                });
            }
            else {
                page.node.set(pdf_lib_1.PDFName.of('Annots'), pdfDoc.context.obj(newAnnotations.filter(Boolean)));
            }
        };
        const removeExistingInternalLinks = (page) => {
            const existingAnnotations = page.node.get(pdf_lib_1.PDFName.of('Annots'));
            if (!(existingAnnotations instanceof pdf_lib_1.PDFArray))
                return;
            for (let index = existingAnnotations.size() - 1; index >= 0; index--) {
                const annotation = existingAnnotations.lookupMaybe(index, pdf_lib_1.PDFDict);
                if (annotation?.has(pdf_lib_1.PDFName.of('Dest')))
                    existingAnnotations.remove(index);
            }
        };
        const normalizeInternalDestination = (destination) => {
            if (!Array.isArray(destination) || destination.length < 2)
                return null;
            const targetPage = Number(destination[0]);
            if (!Number.isFinite(targetPage))
                return null;
            const rawType = typeof destination[1] === 'string'
                ? destination[1]
                : destination[1]?.name;
            const type = String(rawType || 'XYZ').replace(/^\//, '');
            const supportedTypes = new Set(['XYZ', 'Fit', 'FitH', 'FitV', 'FitR', 'FitB', 'FitBH', 'FitBV']);
            const destinationType = supportedTypes.has(type) ? type : 'XYZ';
            if (destinationType === 'XYZ') {
                return [targetPage, destinationType, null, null, null];
            }
            return [targetPage, destinationType, ...destination.slice(2)];
        };
        const updatePageExistingAnnotation = (objs) => {
            objs['Type'] = 'Annot';
            const borderColor = new Uint8ClampedArray(objs.borderColor);
            const color = new Uint8ClampedArray(objs.borderColor);
            if (objs.dest) {
                const destination = normalizeInternalDestination(objs.dest);
                if (!destination)
                    return null;
                return pdfDoc.context.register(pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: objs.rect,
                    Border: Array.from(borderColor),
                    C: Array.from(color),
                    Dest: destination,
                }));
            }
            else if (objs.url) {
                return pdfDoc.context.register(pdfDoc.context.obj({
                    Type: 'Annot',
                    Subtype: 'Link',
                    Rect: objs.rect,
                    Border: Array.from(borderColor),
                    C: Array.from(color),
                    Url: objs.url,
                }));
            }
        };
        const createPageLinkAnnotation = (pageRef, viewport, x, y, mn) => pdfDoc.context.register(pdfDoc.context.obj({
            Type: 'Annot',
            Subtype: 'Link',
            Rect: [x, y - mn.height, x + mn.width, y - mn.height + mn.height * 2],
            Border: [0, 0, 2],
            C: [0, 0, 1],
            Dest: [pageRef, 'XYZ', null, null, null],
        }));
        mdl.internallinks = [];
        if (annotations && annotations.length) {
            for (const mn of annotations) {
                const internalLinks = mn.annotation.filter((item) => Array.isArray(item?.dest));
                if (!internalLinks.length)
                    continue;
                const page = pagelist[mn.page - 1];
                removeExistingInternalLinks(page);
                const linkarray = internalLinks
                    .map(updatePageExistingAnnotation)
                    .filter(Boolean);
                appendAnnotationsToPage(page, linkarray);
            }
        }
        if (mdl.factsheets_array && mdl.factsheets_array.length) {
            for (const ls of mdl.factsheets_array) {
                if (ls.startpg && pagelist.length >= ls.startpg) {
                    if (ls.positions && ls.positions.length) {
                        for (const mn of ls.positions) {
                            if (mn.x) {
                                const link = createPageLinkAnnotation(pagelist[ls.startpg - 1].ref, mn.viewport, mn.x, mn.y, mn);
                                const linkarray = [link];
                                appendAnnotationsToPage(pagelist[mn.topage - 1], linkarray);
                            }
                        }
                    }
                }
            }
        }
        cb(true);
    }
    async cleanupFiles(folder) {
        try {
            const folderPath = path.join(this.FILEPATH, 'export', folder);
            const files = await fs.readdirSync(folderPath);
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                if (file !== 'modified.pdf') {
                    await fs.unlinkSync(filePath);
                }
            }
        }
        catch (error) {
            this.logService.error(`Error in readContent ${JSON.stringify(error)} `, this.logApp);
        }
    }
    getPages(val) {
        var ary = [];
        var fnl = [];
        if (val) {
            try {
                var subar = val.split(',');
                for (let x of subar) {
                    if (x.includes('-')) {
                        var sbArray = Array.from({ length: parseInt(x.split('-')[1]) - parseInt(x.split('-')[0]) + 1 }, (v, k) => k + parseInt(x.split('-')[0]));
                        ary = ary.concat(sbArray);
                    }
                    else {
                        ary.push(parseInt(x));
                    }
                }
                for (let y of ary) {
                    if (fnl.findIndex(a => a == y) == -1) {
                        fnl.push(y);
                    }
                }
            }
            catch (error) {
            }
        }
        return fnl;
    }
    getPageno(pg) {
        try {
            if (pg) {
                if (pg.includes('-')) {
                    return pg.split('-')[0];
                }
                else if (pg.split(',')) {
                    return pg.split(',')[0];
                }
                else {
                    return pg;
                }
            }
        }
        catch (error) {
        }
        return 0;
    }
    getUserinit(x) {
        try {
            var f1 = '';
            var f2 = '';
            if (x.cFname && x.cFname != '') {
                f1 = x.cFname.substring(0, 1).toUpperCase();
            }
            if (x.cLname && x.cLname != '') {
                f2 = x.cLname.substring(0, 1).toUpperCase();
            }
            return f1 + f2;
        }
        catch (error) {
            return '';
        }
    }
    genlinkpage(item) {
        let pages = [];
        if (item.jLinktype) {
            if (item.jLinktype?.type == 'H' || item.jLinktype?.mode == 'H') {
                item.jLinktype.pages.forEach(page => {
                    pages.push({
                        text: page,
                        linkToPage: page,
                        style: 'tableRowEven',
                        color: '#ff3d00', "decoration": "underline",
                        destination: { fit: true }
                    });
                    if (item.jLinktype.pages.length > 1 && item.jLinktype.pages.indexOf(page) < item.jLinktype.pages.length - 1) {
                        pages.push({
                            text: ',',
                        });
                    }
                });
            }
            else {
                pages.push({
                    text: item.jLinktype.start + '–' + item.jLinktype.end,
                    linkToPage: item.jLinktype.start,
                    style: 'tableRowEven',
                    color: '#ff3d00', "decoration": "underline",
                    destination: { fit: true }
                });
            }
        }
        else {
            pages.push({
                text: item.cPage,
                linkToPage: this.getPageno(item.cPage),
                style: 'tableRowEven',
                color: '#ff3d00', "decoration": "underline",
                destination: { fit: true }
            });
        }
        return pages;
    }
    getlinkdocs(files) {
        let content = [];
        if (files.length) {
            files.forEach(item => {
                content.push({
                    text: [`[ ${(item.cTab ? item.cTab : '-')} | ${item.cBundletag ? item.cBundletag :
                            '–'} | `, {
                            text: this.genlinkpage(item),
                            style: 'tableRowEven',
                            color: '#ff3d00', "decoration": "underline"
                        }, ` ]`],
                    style: 'tableRowEven',
                    fontSize: 9,
                    alignment: 'left',
                    margin: [0, 3, 0, 3]
                });
                content.push({
                    text: `Exhibit No. ${item.cExhibitno ? item.cExhibitno : ''}`,
                    fontSize: 9,
                    style: 'tableRowEven',
                });
            });
        }
        return content;
    }
};
exports.ExportFileService = ExportFileService;
exports.ExportFileService = ExportFileService = ExportFileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof scaleannots_service_1.ScaleannotsService !== "undefined" && scaleannots_service_1.ScaleannotsService) === "function" ? _c : Object, typeof (_d = typeof scalecontent_service_1.ScalecontentService !== "undefined" && scalecontent_service_1.ScalecontentService) === "function" ? _d : Object, typeof (_e = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _e : Object, typeof (_f = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _f : Object, typeof (_g = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _g : Object])
], ExportFileService);


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
const config_1 = __webpack_require__(18);
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
                    model[key] = value ? ((typeof value) == 'string' ? value : JSON.stringify(value)) : null;
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
/***/ ((module) => {

module.exports = require("@nestjs/config");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(20);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'export-response'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(21);
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
/* 21 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("pdfmake");

/***/ }),
/* 23 */
/***/ ((module) => {

module.exports = require("pdf-lib");

/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("child_process");

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
exports.ScaleannotsService = void 0;
const common_1 = __webpack_require__(3);
const pdf_lib_1 = __webpack_require__(23);
let ScaleannotsService = class ScaleannotsService {
    scaleAnnots(page, x, y) {
        const annots = page.node.Annots();
        if (!annots)
            return;
        for (let i = 0; i < annots.size(); i++) {
            const annotRef = annots.get(i);
            const annot = annotRef.clone();
            if (annot instanceof pdf_lib_1.PDFDict) {
                this.scaleAnnotation(annot, x, y);
            }
        }
    }
    scaleAnnotation(annot, x, y) {
        this.scaleRD(annot, x, y);
        this.scaleCL(annot, x, y);
        this.scaleInkList(annot, x, y);
        this.scaleVertices(annot, x, y);
        this.scaleQuadPoints(annot, x, y);
        this.scaleL(annot, x, y);
        this.scaleRect(annot, x, y);
        this.scaleFontSize(annot, x);
        this.scaleLineHeight(annot, x);
    }
    scaleRD(annot, x, y) {
        const pdfNameRD = annot.get(pdf_lib_1.PDFName.of("RD"));
        if (pdfNameRD instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArray(pdfNameRD, [x, y, x, y]);
        }
    }
    scaleCL(annot, x, y) {
        const pdfNameCL = annot.get(pdf_lib_1.PDFName.of("CL"));
        if (pdfNameCL instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArray(pdfNameCL, [x, y, x, y, x, y]);
        }
    }
    scaleInkList(annot, x, y) {
        const pdfNameInkList = annot.get(pdf_lib_1.PDFName.of("InkList"));
        if (pdfNameInkList instanceof pdf_lib_1.PDFArray && pdfNameInkList.size() > 0) {
            const internalArray = pdfNameInkList.get(0);
            if (internalArray instanceof pdf_lib_1.PDFArray) {
                this.scaleNumberArrayAlternating(internalArray, x, y);
            }
        }
    }
    scaleVertices(annot, x, y) {
        const pdfNameVertices = annot.get(pdf_lib_1.PDFName.of("Vertices"));
        if (pdfNameVertices instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArrayAlternating(pdfNameVertices, x, y);
        }
    }
    scaleQuadPoints(annot, x, y) {
        const pdfNameQuadPoints = annot.get(pdf_lib_1.PDFName.of("QuadPoints"));
        if (pdfNameQuadPoints instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArrayAlternating(pdfNameQuadPoints, x, y);
        }
    }
    scaleL(annot, x, y) {
        const pdfNameL = annot.get(pdf_lib_1.PDFName.of("L"));
        if (pdfNameL instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArray(pdfNameL, [x, y, x, y]);
        }
    }
    scaleRect(annot, x, y) {
        const pdfNameRect = annot.get(pdf_lib_1.PDFName.of("Rect"));
        if (pdfNameRect instanceof pdf_lib_1.PDFArray) {
            this.scaleNumberArray(pdfNameRect, [x, y, x, y]);
        }
    }
    scaleFontSize(annot, scale) {
        this.scaleRCProperty(annot, 'font-size', scale);
    }
    scaleLineHeight(annot, scale) {
        this.scaleRCProperty(annot, 'line-height', scale);
    }
    scaleRCProperty(annot, property, scale) {
        const pdfNameRC = annot.get(pdf_lib_1.PDFName.of("RC"));
        if (pdfNameRC instanceof pdf_lib_1.PDFString) {
            const value = pdfNameRC.asString();
            const regex = new RegExp(`${property}:[0-9]*?.?[0-9]*?pt`, 'g');
            const parts = encodeURI(value).split(regex);
            const matches = value.match(regex);
            if (matches?.length) {
                const scaledValues = matches.map(match => {
                    const [prefix, value, suffix] = match.split(/([0-9]*\.?[0-9]*)pt/);
                    const scaledValue = (parseFloat(value) * scale).toFixed(1);
                    return `${prefix}${scaledValue}pt`;
                });
                const newValue = parts.reduce((acc, part, i) => acc + decodeURI(part) + (scaledValues[i] || ''), '');
                annot.set(pdf_lib_1.PDFName.of("RC"), pdf_lib_1.PDFString.of(newValue));
            }
        }
    }
    scaleNumberArray(array, scales) {
        for (let i = 0; i < scales.length && i < array.size(); i++) {
            const value = array.get(i);
            if (value instanceof pdf_lib_1.PDFNumber) {
                array.set(i, pdf_lib_1.PDFNumber.of(value.asNumber() * scales[i]));
            }
        }
    }
    scaleNumberArrayAlternating(array, x, y) {
        for (let i = 0; i < array.size(); i++) {
            const value = array.get(i);
            if (value instanceof pdf_lib_1.PDFNumber) {
                const scale = i % 2 === 0 ? x : y;
                array.set(i, pdf_lib_1.PDFNumber.of(value.asNumber() * scale));
            }
        }
    }
};
exports.ScaleannotsService = ScaleannotsService;
exports.ScaleannotsService = ScaleannotsService = __decorate([
    (0, common_1.Injectable)()
], ScaleannotsService);


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
exports.ScalecontentService = void 0;
const common_1 = __webpack_require__(3);
const pdf_lib_1 = __webpack_require__(23);
let ScalecontentService = class ScalecontentService {
    async scaleContent(page, x, y) {
        const { context } = page.doc;
        const start = context.stream((0, pdf_lib_1.pushGraphicsState)(), (0, pdf_lib_1.scale)(x, y));
        const startRef = context.register(start);
        const end = context.stream((0, pdf_lib_1.popGraphicsState)());
        const endRef = context.register(end);
        page.wrapContentStreams(startRef, endRef);
    }
};
exports.ScalecontentService = ScalecontentService;
exports.ScalecontentService = ScalecontentService = __decorate([
    (0, common_1.Injectable)()
], ScalecontentService);


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
const fs = __webpack_require__(7);
const path = __webpack_require__(6);
const moment = __webpack_require__(30);
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

module.exports = require("moment-timezone");

/***/ }),
/* 31 */
/***/ ((module) => {

module.exports = require("pdfjs-dist");

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
exports.CommonModule = void 0;
const common_1 = __webpack_require__(3);
const shared_module_1 = __webpack_require__(33);
const common_controller_1 = __webpack_require__(40);
const common_service_1 = __webpack_require__(41);
const jwt_middleware_1 = __webpack_require__(43);
const email_service_1 = __webpack_require__(45);
const email_controller_1 = __webpack_require__(62);
const config_1 = __webpack_require__(18);
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
/* 33 */
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
const redis_db_service_1 = __webpack_require__(34);
const ioredis_1 = __webpack_require__(36);
const config_1 = __webpack_require__(18);
const utility_service_1 = __webpack_require__(37);
const event_log_service_1 = __webpack_require__(38);
const kafka_module_1 = __webpack_require__(39);
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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(35);
const ioredis_2 = __webpack_require__(36);
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
/* 35 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 36 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(20);
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventLogService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(18);
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
/* 39 */
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
const microservices_1 = __webpack_require__(21);
const kafka_shared_service_1 = __webpack_require__(20);
const config_1 = __webpack_require__(18);
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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CommonController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(12);
const common_service_1 = __webpack_require__(41);
const common_2 = __webpack_require__(42);
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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getcoloridMDL = exports.annotRes = exports.annotReq = exports.UserlistRes = exports.UserlistReq = exports.IssuelistRes = exports.IssuelistReq = exports.ComboCodeRes = exports.EmailAttachment = exports.EmailparseReq = exports.ComboCodeReq = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(9);
const swagger_1 = __webpack_require__(12);
const class_transformer_1 = __webpack_require__(10);
const class_validator_1 = __webpack_require__(11);
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(44);
const redis_db_service_1 = __webpack_require__(34);
const config_1 = __webpack_require__(18);
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
/* 44 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
exports.EmailService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const MsgReader_1 = __webpack_require__(46);
const decompressrtf_1 = __webpack_require__(58);
const iconvLite = __webpack_require__(50);
const rtf_stream_parser_1 = __webpack_require__(59);
const config_1 = __webpack_require__(18);
const cheerio = __webpack_require__(60);
const client_s3_1 = __webpack_require__(61);
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
/* 46 */
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
var const_1 = __importDefault(__webpack_require__(47));
var DataStream_1 = __importDefault(__webpack_require__(49));
var Reader_1 = __webpack_require__(51);
var Burner_1 = __webpack_require__(52);
var utils_1 = __webpack_require__(48);
var EntryStreamParser_1 = __webpack_require__(53);
var VerbStreamParser_1 = __webpack_require__(54);
var TZDEFINITIONParser_1 = __webpack_require__(55);
var TZREGParser_1 = __webpack_require__(56);
var AppointmentRecurParser_1 = __webpack_require__(57);
var AppointmentRecurParser_2 = __webpack_require__(57);
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
/* 47 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(48);
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
/* 48 */
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
/* 49 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var iconv = __webpack_require__(50);
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
/* 50 */
/***/ ((module) => {

module.exports = require("iconv-lite");

/***/ }),
/* 51 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reader = exports.TypeEnum = void 0;
var DataStream_1 = __importDefault(__webpack_require__(49));
var utils_1 = __webpack_require__(48);
var const_1 = __importDefault(__webpack_require__(47));
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
/* 52 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.burn = void 0;
var Reader_1 = __webpack_require__(51);
var DataStream_1 = __importDefault(__webpack_require__(49));
var const_1 = __importDefault(__webpack_require__(47));
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
/* 53 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var DataStream_1 = __importDefault(__webpack_require__(49));
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
/* 54 */
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
/* 55 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(48);
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
/* 56 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(48);
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
/* 57 */
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
/* 58 */
/***/ ((module) => {

module.exports = require("@kenjiuno/decompressrtf");

/***/ }),
/* 59 */
/***/ ((module) => {

module.exports = require("rtf-stream-parser");

/***/ }),
/* 60 */
/***/ ((module) => {

module.exports = require("cheerio");

/***/ }),
/* 61 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(12);
const common_2 = __webpack_require__(42);
const email_service_1 = __webpack_require__(45);
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
/* 63 */
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
__exportStar(__webpack_require__(64), exports);
__exportStar(__webpack_require__(65), exports);


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
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(65);
const config_1 = __webpack_require__(18);
const scheduler_service_1 = __webpack_require__(66);
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
/* 65 */
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
/* 66 */
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
const moment = __webpack_require__(67);
const schedule = __webpack_require__(68);
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
/* 67 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 68 */
/***/ ((module) => {

module.exports = require("node-schedule");

/***/ }),
/* 69 */
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
const ioredis_1 = __webpack_require__(36);
const redis_db_service_1 = __webpack_require__(34);
const config_1 = __webpack_require__(18);
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
const nest_winston_1 = __webpack_require__(29);
const winston = __webpack_require__(28);
const fs = __webpack_require__(7);
const path = __webpack_require__(6);
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.exportProcessor = void 0;
const bull_1 = __webpack_require__(72);
const bull_2 = __webpack_require__(73);
const config_1 = __webpack_require__(18);
let exportProcessor = class exportProcessor {
    constructor(config) {
        this.config = config;
    }
    async handlePagination(job) {
        try {
        }
        catch (error) {
        }
    }
};
exports.exportProcessor = exportProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], exportProcessor.prototype, "handlePagination", null);
exports.exportProcessor = exportProcessor = __decorate([
    (0, bull_1.Processor)('export-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], exportProcessor);


/***/ }),
/* 72 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

/***/ }),
/* 73 */
/***/ ((module) => {

module.exports = require("bull");

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
exports.ExportS3Module = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(18);
const client_s3_1 = __webpack_require__(61);
const s3_service_1 = __webpack_require__(75);
let ExportS3Module = class ExportS3Module {
};
exports.ExportS3Module = ExportS3Module;
exports.ExportS3Module = ExportS3Module = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: client_s3_1.S3Client,
                useFactory: (config) => new client_s3_1.S3Client({
                    region: 'sgp1',
                    endpoint: config.get('DO_SPACES_ENDPOINT'),
                    forcePathStyle: config.get('DO_S3') === 'MINIO',
                    credentials: {
                        accessKeyId: config.get('DO_SPACES_KEY'),
                        secretAccessKey: config.get('DO_SPACES_SECRET'),
                    },
                }),
                inject: [config_1.ConfigService],
            },
            s3_service_1.ExportS3Service,
        ],
        exports: [s3_service_1.ExportS3Service],
    })
], ExportS3Module);


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
var ExportS3Service_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportS3Service = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(18);
const client_s3_1 = __webpack_require__(61);
const s3_request_presigner_1 = __webpack_require__(76);
let ExportS3Service = ExportS3Service_1 = class ExportS3Service {
    constructor(s3, config) {
        this.s3 = s3;
        this.config = config;
        this.logger = new common_1.Logger(ExportS3Service_1.name);
        this.PRESIGNED_TTL = 15 * 60;
        this.bucket = this.config.get('DO_SPACES_DOWNLOAD_BUCKET_NAME');
        if (!this.bucket) {
            throw new Error('Missing required config: DO_SPACES_DOWNLOAD_BUCKET_NAME');
        }
    }
    async putObject(key, body, contentType) {
        await this.s3.send(new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
        this.logger.log(`Uploaded export object ${key} (${body.length} bytes)`);
    }
    async getPresignedUrl(key) {
        return (0, s3_request_presigner_1.getSignedUrl)(this.s3, new client_s3_1.GetObjectCommand({ Bucket: this.bucket, Key: key }), {
            expiresIn: this.PRESIGNED_TTL,
        });
    }
    async resolveKey(key) {
        try {
            const resp = await this.s3.send(new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, Prefix: key }));
            return (resp.Contents || []).some((o) => o.Key === key) ? key : null;
        }
        catch (error) {
            this.logger.error(`Error resolving export key ${key}: ${error.message}`);
            return null;
        }
    }
    async deleteObject(key) {
        try {
            await this.s3.send(new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
        }
        catch (error) {
            this.logger.error(`Error deleting export object ${key}: ${error.message}`);
        }
    }
};
exports.ExportS3Service = ExportS3Service;
exports.ExportS3Service = ExportS3Service = ExportS3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof client_s3_1.S3Client !== "undefined" && client_s3_1.S3Client) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], ExportS3Service);


/***/ }),
/* 76 */
/***/ ((module) => {

module.exports = require("@aws-sdk/s3-request-presigner");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(12);
const data_export_service_1 = __webpack_require__(78);
const data_export_dto_1 = __webpack_require__(79);
let DataExportController = class DataExportController {
    constructor(service) {
        this.service = service;
    }
    async export(body) {
        return this.service.createExport(body);
    }
    async regenerate(body) {
        return this.service.regenerate(body);
    }
    async url(query) {
        return this.service.getUrl(query);
    }
    async delete(body) {
        return this.service.deleteExport(body);
    }
    async list(query) {
        return this.service.list(query);
    }
};
exports.DataExportController = DataExportController;
__decorate([
    (0, common_1.Post)('export'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof data_export_dto_1.DataExportReq !== "undefined" && data_export_dto_1.DataExportReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], DataExportController.prototype, "export", null);
__decorate([
    (0, common_1.Post)('regenerate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof data_export_dto_1.DataExportUrlReq !== "undefined" && data_export_dto_1.DataExportUrlReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], DataExportController.prototype, "regenerate", null);
__decorate([
    (0, common_1.Get)('url'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof data_export_dto_1.DataExportUrlReq !== "undefined" && data_export_dto_1.DataExportUrlReq) === "function" ? _f : Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], DataExportController.prototype, "url", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_h = typeof data_export_dto_1.DataExportUrlReq !== "undefined" && data_export_dto_1.DataExportUrlReq) === "function" ? _h : Object]),
    __metadata("design:returntype", typeof (_j = typeof Promise !== "undefined" && Promise) === "function" ? _j : Object)
], DataExportController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)('list'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof data_export_dto_1.DataExportListReq !== "undefined" && data_export_dto_1.DataExportListReq) === "function" ? _k : Object]),
    __metadata("design:returntype", typeof (_l = typeof Promise !== "undefined" && Promise) === "function" ? _l : Object)
], DataExportController.prototype, "list", null);
exports.DataExportController = DataExportController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('data-export'),
    (0, common_1.Controller)('data'),
    __metadata("design:paramtypes", [typeof (_a = typeof data_export_service_1.DataExportService !== "undefined" && data_export_service_1.DataExportService) === "function" ? _a : Object])
], DataExportController);


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
var DataExportService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportService = void 0;
const db_service_1 = __webpack_require__(15);
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(72);
const bull_2 = __webpack_require__(73);
const s3_service_1 = __webpack_require__(75);
let DataExportService = DataExportService_1 = class DataExportService {
    constructor(db, queue, s3) {
        this.db = db;
        this.queue = queue;
        this.s3 = s3;
        this.logger = new common_1.Logger(DataExportService_1.name);
    }
    async createExport(body) {
        const res = await this.db.executeRef('output_data_export_insert', {
            nCaseid: body.nCaseid, nMasterid: body.nMasterid, cType: body.cType, cFormat: body.cFormat,
        });
        if (!res.success || !res.data?.[0]?.[0]?.nExportid) {
            this.logger.error('Failed to insert data-export job', res.error);
            return { msg: -1, error: res.error ?? 'insert failed' };
        }
        const nExportid = res.data[0][0].nExportid;
        const job = {
            nExportid, nCaseid: body.nCaseid, nMasterid: body.nMasterid, cType: body.cType, cFormat: body.cFormat,
        };
        await this.queue.add(job, { removeOnComplete: true, removeOnFail: true, attempts: 2, timeout: 30 * 60 * 1000 });
        return { msg: 1, nExportid };
    }
    async regenerate(query) {
        const res = await this.db.executeRef('output_data_export_get', {
            nExportid: query.nExportid, nMasterid: query.nMasterid,
        });
        const row = res.data?.[0]?.[0];
        if (!res.success || !row)
            return { msg: -1, error: 'Export not found' };
        await this.db.executeRef('output_data_export_complete', {
            nExportid: query.nExportid, cStatus: 'P', cKey: null, cName: null,
        });
        const job = {
            nExportid: query.nExportid, nCaseid: row.nCaseid, nMasterid: query.nMasterid,
            cType: row.cType, cFormat: row.cFormat,
        };
        await this.queue.add(job, { removeOnComplete: true, removeOnFail: true, attempts: 2, timeout: 30 * 60 * 1000 });
        return { msg: 1, nExportid: query.nExportid };
    }
    async getUrl(query) {
        const res = await this.db.executeRef('output_data_export_get', {
            nExportid: query.nExportid, nMasterid: query.nMasterid,
        });
        const row = res.data?.[0]?.[0];
        if (!res.success || !row)
            throw new common_1.InternalServerErrorException('Export not found');
        if (row.cStatus !== 'C' || !row.cKey)
            throw new common_1.InternalServerErrorException('Export is not ready.');
        const key = await this.s3.resolveKey(row.cKey);
        if (!key)
            throw new common_1.InternalServerErrorException('This export has expired. Please regenerate it.');
        return { cUrl: await this.s3.getPresignedUrl(key) };
    }
    async deleteExport(query) {
        const res = await this.db.executeRef('output_data_export_delete', {
            nExportid: query.nExportid, nMasterid: query.nMasterid,
        });
        const cKey = res.data?.[0]?.[0]?.cKey;
        if (cKey)
            await this.s3.deleteObject(cKey);
        return { msg: 1 };
    }
    async list(query) {
        const res = await this.db.executeRef('output_data_export_list', {
            nCaseid: query.nCaseid, nMasterid: query.nMasterid,
        });
        return res.success ? (res.data?.[0] ?? []) : [];
    }
};
exports.DataExportService = DataExportService;
exports.DataExportService = DataExportService = DataExportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('data-export')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _b : Object, typeof (_c = typeof s3_service_1.ExportS3Service !== "undefined" && s3_service_1.ExportS3Service) === "function" ? _c : Object])
], DataExportService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportListReq = exports.DataExportUrlReq = exports.DataExportReq = exports.DATA_EXPORT_FORMATS = exports.DATA_EXPORT_TYPES = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(9);
const swagger_1 = __webpack_require__(12);
const class_validator_1 = __webpack_require__(11);
const types_1 = __webpack_require__(80);
Object.defineProperty(exports, "DATA_EXPORT_TYPES", ({ enumerable: true, get: function () { return types_1.DATA_EXPORT_TYPES; } }));
Object.defineProperty(exports, "DATA_EXPORT_FORMATS", ({ enumerable: true, get: function () { return types_1.DATA_EXPORT_FORMATS; } }));
class DataExportReq {
}
exports.DataExportReq = DataExportReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'facts', enum: types_1.DATA_EXPORT_TYPES, description: 'What case data to export' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(types_1.DATA_EXPORT_TYPES),
    __metadata("design:type", Object)
], DataExportReq.prototype, "cType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'xlsx', enum: types_1.DATA_EXPORT_FORMATS, description: 'Output format' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(types_1.DATA_EXPORT_FORMATS),
    __metadata("design:type", Object)
], DataExportReq.prototype, "cFormat", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportReq.prototype, "nMasterid", void 0);
class DataExportUrlReq {
}
exports.DataExportUrlReq = DataExportUrlReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2a0df4fc-301a-4e2c-8b21-2b9f8cd6f0ca', description: 'Export id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportUrlReq.prototype, "nExportid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportUrlReq.prototype, "nMasterid", void 0);
class DataExportListReq {
}
exports.DataExportListReq = DataExportListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], DataExportListReq.prototype, "nMasterid", void 0);


/***/ }),
/* 80 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DATA_EXPORT_FORMATS = exports.DATA_EXPORT_TYPES = void 0;
exports.DATA_EXPORT_TYPES = [
    'facts', 'qfacts', 'doclinks', 'tags', 'tasks',
    'evidence_index', 'transcript_index', 'full_workspace',
];
exports.DATA_EXPORT_FORMATS = ['pdf', 'docx', 'xlsx', 'csv'];


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
var DataExportProcessor_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportProcessor = void 0;
const bull_1 = __webpack_require__(72);
const common_1 = __webpack_require__(3);
const bull_2 = __webpack_require__(73);
const db_service_1 = __webpack_require__(15);
const s3_service_1 = __webpack_require__(75);
const renderers_service_1 = __webpack_require__(82);
const type_source_1 = __webpack_require__(86);
const utility_service_1 = __webpack_require__(19);
const TYPE_LABEL = {
    facts: 'Case_Facts', qfacts: 'QFacts', doclinks: 'DocLinks', tags: 'Tags', tasks: 'Tasks',
    evidence_index: 'Master_Index', transcript_index: 'Transcript_Index', full_workspace: 'Workspace_Export',
};
let DataExportProcessor = DataExportProcessor_1 = class DataExportProcessor {
    constructor(db, s3, renderer, utility) {
        this.db = db;
        this.s3 = s3;
        this.renderer = renderer;
        this.utility = utility;
        this.logger = new common_1.Logger(DataExportProcessor_1.name);
    }
    async handle(job) {
        const { nExportid, nCaseid, nMasterid, cType, cFormat } = job.data;
        const label = TYPE_LABEL[cType] ?? 'Export';
        try {
            const datasets = await (0, type_source_1.fetchDatasets)(this.db, cType, nCaseid, nMasterid);
            const title = label.replace(/_/g, ' ');
            const { buffer, contentType, ext } = cType === 'evidence_index'
                ? await this.renderEvidenceIndex(datasets[0]?.rows ?? [], cFormat, title, nCaseid, nMasterid)
                : await this.renderer.render(datasets, cFormat, title);
            const cName = `${label}.${ext}`;
            const cKey = `outputs/exports/${nExportid}/${cName}`;
            await this.s3.putObject(cKey, buffer, contentType);
            await this.db.executeRef('output_data_export_complete', { nExportid, cStatus: 'C', cKey, cName, nSize: buffer.length });
            this.emit('DATA-EXPORT-COMPLETE', { nExportid, nCaseid, nMasterid, cType, cStatus: 'C', finalPath: cName });
            this.logger.log(`Data-export ${nExportid} (${cType}/${cFormat}) complete: ${cKey}`);
        }
        catch (err) {
            this.logger.error(`Data-export ${nExportid} failed: ${err?.message}`, err?.stack);
            await this.db.executeRef('output_data_export_complete', { nExportid, cStatus: 'F', cKey: null, cName: null });
            this.emit('DATA-EXPORT-FAILED', { nExportid, nCaseid, nMasterid, cType, cStatus: 'F', finalPath: null });
        }
    }
    async renderEvidenceIndex(rows, cFormat, title, nCaseid, nMasterid) {
        if (cFormat !== 'pdf' && cFormat !== 'xlsx' && cFormat !== 'docx') {
            return this.renderer.renderIndex(rows, cFormat, title);
        }
        let meta;
        try {
            const res = await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid });
            const det = (res?.success && Array.isArray(res.data?.[0]) ? res.data[0][0] : undefined) ?? {};
            meta = { caseName: det.cCasename ?? det.cCaseName, caseNo: det.cCaseno ?? det.cCaseNo };
        }
        catch { }
        return this.renderer.renderMasterIndex(rows, cFormat, 'Index of Hearing Bundle Documents', meta);
    }
    emit(event, p) {
        this.utility.emit({
            event,
            nExportid: p.nExportid, cStatus: p.cStatus, cType: p.cType, nCaseid: p.nCaseid, finalPath: p.finalPath,
            data: { identifier: '', nMasterid: p.nMasterid, data: { nExportid: p.nExportid, cStatus: p.cStatus, cType: p.cType, nCaseid: p.nCaseid, finalPath: p.finalPath } },
        });
    }
};
exports.DataExportProcessor = DataExportProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 3 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], DataExportProcessor.prototype, "handle", null);
exports.DataExportProcessor = DataExportProcessor = DataExportProcessor_1 = __decorate([
    (0, bull_1.Processor)('data-export'),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof s3_service_1.ExportS3Service !== "undefined" && s3_service_1.ExportS3Service) === "function" ? _b : Object, typeof (_c = typeof renderers_service_1.DataExportRenderer !== "undefined" && renderers_service_1.DataExportRenderer) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object])
], DataExportProcessor);


/***/ }),
/* 82 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportRenderer = void 0;
var renderers_service_1 = __webpack_require__(83);
Object.defineProperty(exports, "DataExportRenderer", ({ enumerable: true, get: function () { return renderers_service_1.DataExportRenderer; } }));


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
exports.DataExportRenderer = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(18);
const ExcelJS = __webpack_require__(84);
const pdfMake = __webpack_require__(22);
const docx_1 = __webpack_require__(85);
const MIME = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};
const DOCX_TABLE_WIDTH = 16_080;
const DOCX_BODY_SIZE = 14;
let DataExportRenderer = class DataExportRenderer {
    constructor(config) {
        this.config = config;
        this.INDEX_COLS = [
            { header: 'Tab', keys: ['cTab'] },
            { header: 'Exhibit', keys: ['cExhibitno', 'cExhibitNo', 'cExhibit'] },
            { header: 'Document & Description', keys: ['cFilename', 'cFileName', 'cName', 'cDescription', 'cDesc'] },
            { header: 'Kind', keys: ['cFiletype', 'cFileType', 'cKind'] },
            { header: 'Date', keys: ['dIntrestDt', 'cDate', 'dDate', 'jDate', 'dDocdate', 'dCreateDt'] },
            { header: 'Pages', keys: ['cPage', 'cPages', 'nPages'] },
            { header: 'Relevance', keys: ['cRelevance', 'nRelevance', 'cRel'] },
        ];
        const assets = this.config.get('ASSETS');
        const fonts = {
            Roboto: {
                normal: `${assets}fonts/Roboto/Roboto-Regular.ttf`,
                bold: `${assets}fonts/Roboto/Roboto-Medium.ttf`,
                italics: `${assets}fonts/Roboto/Roboto-Italic.ttf`,
                bolditalics: `${assets}fonts/Roboto/Roboto-MediumItalic.ttf`,
            },
        };
        this.printer = new pdfMake(fonts);
    }
    async render(datasets, format, title) {
        const buffer = format === 'xlsx' ? await this.xlsx(datasets)
            : format === 'csv' ? this.csv(datasets)
                : format === 'docx' ? await this.docx(datasets, title)
                    : await this.pdf(datasets, title);
        return { buffer, contentType: MIME[format], ext: format };
    }
    async renderIndex(rows, format, title) {
        const groups = this.groupBySection(rows);
        const buffer = format === 'xlsx' ? await this.indexXlsx(groups)
            : format === 'csv' ? this.indexCsv(groups)
                : format === 'docx' ? await this.indexDocx(groups, title)
                    : await this.indexPdf(groups, title);
        return { buffer, contentType: MIME[format], ext: format };
    }
    columns(rows) {
        const seen = [];
        for (const row of rows)
            for (const k of Object.keys(row))
                if (!seen.includes(k))
                    seen.push(k);
        return seen;
    }
    humanize(key) {
        let k = key.replace(/^[cnjdb](?=[A-Z])/, '');
        k = k.replace(/[_-]+/g, ' ').replace(/([a-z0-9])([A-Z])/g, '$1 $2');
        return k.charAt(0).toUpperCase() + k.slice(1);
    }
    cell(v) {
        if (v === null || v === undefined)
            return '';
        if (typeof v === 'object') {
            try {
                return JSON.stringify(v);
            }
            catch {
                return String(v);
            }
        }
        return String(v);
    }
    async xlsx(datasets) {
        const wb = new ExcelJS.Workbook();
        for (const ds of datasets.length ? datasets : [{ name: 'Sheet1', rows: [] }]) {
            const ws = wb.addWorksheet((ds.name || 'Sheet').slice(0, 31));
            const cols = this.columns(ds.rows);
            if (cols.length) {
                ws.columns = cols.map((c) => ({ header: this.humanize(c), key: c, width: 24 }));
                ws.getRow(1).font = { bold: true };
                for (const row of ds.rows) {
                    const out = {};
                    for (const c of cols)
                        out[c] = this.cell(row[c]);
                    ws.addRow(out);
                }
            }
            else {
                ws.addRow(['No data']);
            }
        }
        return Buffer.from(await wb.xlsx.writeBuffer());
    }
    csv(datasets) {
        const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
        const parts = [];
        datasets.forEach((ds, i) => {
            if (datasets.length > 1)
                parts.push(`# ${ds.name}`);
            const cols = this.columns(ds.rows);
            if (!cols.length) {
                parts.push('No data');
            }
            else {
                parts.push(cols.map((c) => esc(this.humanize(c))).join(','));
                for (const row of ds.rows)
                    parts.push(cols.map((c) => esc(this.cell(row[c]))).join(','));
            }
            if (datasets.length > 1 && i < datasets.length - 1)
                parts.push('');
        });
        return Buffer.from(parts.join('\n'), 'utf8');
    }
    pdf(datasets, title) {
        const content = [{ text: title, style: 'title' }];
        for (const ds of datasets) {
            content.push({ text: ds.name, style: 'section' });
            const cols = this.columns(ds.rows);
            if (!cols.length) {
                content.push({ text: 'No data', italics: true, margin: [0, 0, 0, 10] });
                continue;
            }
            const body = [cols.map((c) => ({ text: this.humanize(c), bold: true }))];
            for (const row of ds.rows)
                body.push(cols.map((c) => ({ text: this.cell(row[c]) })));
            content.push({
                table: { headerRows: 1, widths: cols.map(() => 'auto'), body },
                layout: 'lightHorizontalLines', fontSize: 7, margin: [0, 0, 0, 12],
            });
        }
        const docDef = {
            pageOrientation: 'landscape',
            pageSize: 'A4',
            content,
            defaultStyle: { fontSize: 7 },
            styles: {
                title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
                section: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
            },
        };
        return new Promise((resolve, reject) => {
            try {
                const doc = this.printer.createPdfKitDocument(docDef);
                const chunks = [];
                doc.on('data', (c) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    docxColumnWidths(headers, rows) {
        if (!headers.length)
            return [];
        const scores = headers.map((header, index) => {
            const lengths = rows
                .slice(0, 200)
                .map((row) => String(row[index] ?? '').replace(/\s+/g, ' ').trim().length)
                .sort((a, b) => a - b);
            const p90 = lengths.length ? lengths[Math.floor((lengths.length - 1) * 0.9)] : 0;
            const representative = Math.max(header.length, Math.min(p90, 180));
            let score = Math.sqrt(Math.max(representative, 1));
            if (/passage|note|document|description|text|subject|title|comment|contact|email/i.test(header))
                score *= 1.35;
            if (/^(tab|exhibit|bundle|status|kind|issues|tasks|links|pages|relevance)$/i.test(header))
                score *= 0.75;
            return Math.max(score, 1);
        });
        const base = Math.min(560, Math.floor((DOCX_TABLE_WIDTH / headers.length) * 0.65));
        const remainder = DOCX_TABLE_WIDTH - base * headers.length;
        const scoreTotal = scores.reduce((sum, score) => sum + score, 0);
        const widths = scores.map((score) => base + Math.floor((remainder * score) / scoreTotal));
        widths[widths.length - 1] += DOCX_TABLE_WIDTH - widths.reduce((sum, width) => sum + width, 0);
        return widths;
    }
    docxTable(headers, rows, widths = this.docxColumnWidths(headers, rows)) {
        const centered = (header) => /^(tab|exhibit|bundle|status|kind|date|created|issues|tasks|links|pages|relevance)$/i.test(header);
        const cell = (text, index, header = false) => new docx_1.TableCell({
            width: { size: widths[index], type: docx_1.WidthType.DXA },
            verticalAlign: docx_1.VerticalAlign.CENTER,
            shading: header ? { type: docx_1.ShadingType.CLEAR, fill: 'E8EEF7', color: 'auto' } : undefined,
            children: [new docx_1.Paragraph({
                    alignment: centered(headers[index]) ? docx_1.AlignmentType.CENTER : docx_1.AlignmentType.LEFT,
                    spacing: { before: 0, after: 0, line: 180 },
                    children: [new docx_1.TextRun({
                            text,
                            bold: header,
                            color: header ? '23395D' : '1A2436',
                            font: 'Arial',
                            size: DOCX_BODY_SIZE,
                        })],
                })],
        });
        const headerRow = new docx_1.TableRow({
            tableHeader: true,
            cantSplit: true,
            children: headers.map((header, index) => cell(header, index, true)),
        });
        const dataRows = rows.map((row) => new docx_1.TableRow({
            cantSplit: true,
            children: headers.map((_header, index) => cell(row[index] ?? '', index)),
        }));
        return new docx_1.Table({
            width: { size: DOCX_TABLE_WIDTH, type: docx_1.WidthType.DXA },
            columnWidths: widths,
            layout: docx_1.TableLayoutType.FIXED,
            margins: { top: 60, bottom: 60, left: 80, right: 80 },
            rows: [headerRow, ...dataRows],
        });
    }
    async docx(datasets, title) {
        const children = [new docx_1.Paragraph({ text: title, heading: docx_1.HeadingLevel.HEADING_1 })];
        for (const ds of datasets) {
            children.push(new docx_1.Paragraph({ text: ds.name, heading: docx_1.HeadingLevel.HEADING_2 }));
            const cols = this.columns(ds.rows);
            if (!cols.length) {
                children.push(new docx_1.Paragraph({ text: 'No data' }));
                continue;
            }
            const headers = cols.map((column) => this.humanize(column));
            const rows = ds.rows.map((row) => cols.map((column) => this.cell(row[column])));
            children.push(this.docxTable(headers, rows));
            children.push(new docx_1.Paragraph({ text: '' }));
        }
        const doc = new docx_1.Document({
            sections: [{
                    properties: {
                        page: {
                            size: { orientation: docx_1.PageOrientation.LANDSCAPE },
                            margin: { top: 540, bottom: 540, left: 360, right: 360 },
                        },
                    },
                    children,
                }],
        });
        return Buffer.from(await docx_1.Packer.toBuffer(doc));
    }
    valOf(row, keys) {
        for (const k of keys) {
            const v = row[k];
            if (v !== null && v !== undefined && v !== '')
                return this.cell(v);
        }
        return '';
    }
    sectionLabel(row) {
        const tag = this.valOf(row, ['cFolderTag', 'cFoldertag', 'cSection', 'cVolumeTag']);
        const name = this.valOf(row, ['cFolder', 'cFoldername', 'cVolume', 'cSectionName']);
        const prefixed = tag && name.toLowerCase().startsWith(tag.toLowerCase())
            && /^[\s.)\-–]/.test(name.slice(tag.length));
        if (tag && name && !prefixed)
            return `${tag}. ${name}`;
        return name || tag || 'Documents';
    }
    groupBySection(rows) {
        const map = new Map();
        for (const row of rows) {
            const label = this.sectionLabel(row);
            if (!map.has(label))
                map.set(label, []);
            map.get(label).push(row);
        }
        return [...map.entries()].map(([label, rs]) => ({ label, rows: rs }));
    }
    indexRow(row) {
        return this.INDEX_COLS.map((c) => this.valOf(row, c.keys) || '—');
    }
    async indexXlsx(groups) {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Evidence Index');
        const n = this.INDEX_COLS.length;
        ws.columns = this.INDEX_COLS.map((c, i) => ({ header: c.header, key: 'c' + i, width: i === 2 ? 60 : 16 }));
        ws.getRow(1).font = { bold: true };
        for (const g of groups) {
            const titleRow = ws.addRow([g.label]);
            ws.mergeCells(titleRow.number, 1, titleRow.number, n);
            titleRow.font = { bold: true };
            titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF3FB' } };
            for (const row of g.rows)
                ws.addRow(this.indexRow(row));
        }
        return Buffer.from(await wb.xlsx.writeBuffer());
    }
    indexCsv(groups) {
        const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
        const parts = [this.INDEX_COLS.map((c) => esc(c.header)).join(',')];
        for (const g of groups) {
            parts.push('');
            parts.push(esc(g.label));
            for (const row of g.rows)
                parts.push(this.indexRow(row).map(esc).join(','));
        }
        return Buffer.from(parts.join('\n'), 'utf8');
    }
    indexPdf(groups, title) {
        const headerCells = this.INDEX_COLS.map((c) => ({ text: c.header, bold: true }));
        const content = [{ text: title, style: 'title' }];
        for (const g of groups) {
            content.push({ text: g.label, style: 'section' });
            const body = [headerCells, ...g.rows.map((r) => this.indexRow(r).map((t) => ({ text: t })))];
            content.push({
                table: { headerRows: 1, widths: ['auto', 'auto', '*', 'auto', 'auto', 'auto', 'auto'], body },
                layout: 'lightHorizontalLines', fontSize: 7, margin: [0, 0, 0, 12],
            });
        }
        const docDef = {
            pageOrientation: 'landscape', pageSize: 'A4', content, defaultStyle: { fontSize: 7 },
            styles: { title: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] }, section: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] } },
        };
        return new Promise((resolve, reject) => {
            try {
                const doc = this.printer.createPdfKitDocument(docDef);
                const chunks = [];
                doc.on('data', (c) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
    async indexDocx(groups, title) {
        const children = [new docx_1.Paragraph({ text: title, heading: docx_1.HeadingLevel.HEADING_1 })];
        const headers = this.INDEX_COLS.map((column) => column.header);
        for (const g of groups) {
            children.push(new docx_1.Paragraph({ text: g.label, heading: docx_1.HeadingLevel.HEADING_2 }));
            const rows = g.rows.map((row) => this.indexRow(row));
            children.push(this.docxTable(headers, rows));
            children.push(new docx_1.Paragraph({ text: '' }));
        }
        const doc = new docx_1.Document({
            sections: [{
                    properties: {
                        page: {
                            size: { orientation: docx_1.PageOrientation.LANDSCAPE },
                            margin: { top: 540, bottom: 540, left: 360, right: 360 },
                        },
                    },
                    children,
                }],
        });
        return Buffer.from(await docx_1.Packer.toBuffer(doc));
    }
    async renderMasterIndex(rows, format, title, meta) {
        const roots = this.groupByRoot(rows);
        const hdr = this.indexHeader(rows, roots, title, meta);
        if (format === 'html') {
            return {
                buffer: this.masterIndexHtml(roots, hdr),
                contentType: 'text/html; charset=utf-8',
                ext: 'html',
            };
        }
        const buffer = format === 'xlsx'
            ? await this.masterIndexXlsx(roots, hdr)
            : format === 'docx'
                ? await this.masterIndexDocx(roots, hdr)
                : await this.masterIndexPdf(roots, hdr);
        return { buffer, contentType: MIME[format], ext: format };
    }
    idxTab(r) { return this.valOf(r, ['cTab', 'cTabno']); }
    idxExhibit(r) { return this.valOf(r, ['cExhibitno', 'cExhibitNo', 'cExhibit']); }
    idxTitle(r) { return this.valOf(r, ['cName', 'cFilename', 'cFileName', 'cTitle']); }
    idxDesc(r) { return this.valOf(r, ['cDesc', 'cDescription', 'cRemark', 'cNote', 'cSubtitle']); }
    idxPages(r) {
        const p = this.valOf(r, ['cPage', 'cPages', 'nPages']);
        return p.replace(/(\d)\s*-\s*(\d)/, '$1–$2');
    }
    idxDate(r) {
        const raw = this.valOf(r, ['dIntrestDt', 'cDate', 'dDate', 'jDate', 'dDocdate', 'dDocDate']);
        return this.fmtDMY(raw);
    }
    fmtDMY(raw) {
        const s = String(raw ?? '').trim();
        if (!s || s === '—' || s === '-')
            return '';
        const d = new Date(s);
        if (isNaN(d.getTime()))
            return s;
        const p = (n) => String(n).padStart(2, '0');
        return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
    }
    deriveVolumes(roots) {
        const letters = roots
            .map((r) => (String(r.label).match(/^\s*([A-Za-z0-9]+)/)?.[1] ?? '').toUpperCase())
            .filter(Boolean);
        const uniq = [...new Set(letters)];
        if (!uniq.length)
            return '';
        return uniq.length > 1 ? `${uniq[0]}–${uniq[uniq.length - 1]}` : uniq[0];
    }
    splitSection(label) {
        const m = String(label).match(/^\s*([A-Za-z0-9]+)\s*[.\-–)]+\s*(.*)$/);
        if (m && m[2])
            return { letter: m[1], name: m[2].trim() };
        return { letter: '', name: String(label).trim() };
    }
    indexHeader(rows, roots, title, meta) {
        const first = rows[0] ?? {};
        const caseName = (meta?.caseName || this.valOf(first, ['cCasename', 'cCaseName']) || '').trim();
        const caseNo = (meta?.caseNo || this.valOf(first, ['cCaseno', 'cCaseNo']) || '').trim();
        const heading = (meta?.title || title || 'Index of Hearing Bundle Documents').trim();
        const volumes = meta?.volumes !== undefined ? meta.volumes : this.deriveVolumes(roots);
        const subtitle = meta?.subtitle !== undefined
            ? meta.subtitle
            : ['Hearing Bundle', volumes ? `Volumes ${volumes}` : '', caseNo ? `Case ${caseNo}` : '']
                .filter(Boolean).join('  ·  ');
        return { eyebrow: caseName, heading, subtitle, volumes, issued: this.fmtDMY(new Date().toISOString()) };
    }
    groupByRoot(rows) {
        const map = new Map();
        for (const row of rows) {
            const label = String(row['rootLabel'] ?? '').trim() || this.sectionLabel(row);
            if (!map.has(label))
                map.set(label, []);
            map.get(label).push(row);
        }
        return [...map.entries()].map(([label, rs]) => ({ label, sections: this.groupBySectionMaster(rs) }));
    }
    groupBySectionMaster(rows) {
        const map = new Map();
        for (const row of rows) {
            const tag = this.valOf(row, ['cFolderTag', 'cFoldertag', 'cSection', 'cVolumeTag']);
            const name = this.valOf(row, ['cFolder', 'cFoldername', 'cVolume', 'cSectionName']);
            const prefixed = tag && name.toLowerCase().startsWith(tag.toLowerCase())
                && /^[\s.)\-–]/.test(name.slice(tag.length));
            const label = tag && name && !prefixed ? `${tag}. ${name}` : (name || tag || '');
            if (!map.has(label))
                map.set(label, []);
            map.get(label).push(row);
        }
        return [...map.entries()].map(([label, rs]) => ({ label, rows: rs }));
    }
    sameSectionLabel(a, b) {
        const norm = (s) => String(s)
            .replace(/^\s*[A-Za-z0-9]{1,6}\s*[.)\-–]\s*/, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
        return norm(a) === norm(b);
    }
    relLink(row) {
        const rel = String(row['relPath'] ?? '').trim();
        if (!rel)
            return '';
        return rel.split('/').map(encodeURIComponent).join('/');
    }
    relRaw(row) {
        return String(row['relPath'] ?? '').trim();
    }
    async masterIndexXlsx(roots, hdr) {
        const NAVY = 'FF12305F', BLUE = 'FF2F6BFF', GREY = 'FF6B7688', INK = 'FF1A2436', DOT = 'FFDDE4EF';
        const SERIF = 'Georgia', SANS = 'Arial', MONO = 'Consolas';
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Master Index', { views: [{ showGridLines: false }] });
        ws.columns = [{ width: 10 }, { width: 12 }, { width: 68 }, { width: 15 }, { width: 10 }];
        let ri = 1;
        const mergeRow = (value, font, height, align) => {
            ws.mergeCells(ri, 1, ri, 5);
            const c = ws.getCell(ri, 1);
            c.value = value;
            c.font = font;
            c.alignment = { vertical: 'middle', ...(align || {}) };
            if (height)
                ws.getRow(ri).height = height;
            ri++;
        };
        if (hdr.eyebrow)
            mergeRow(hdr.eyebrow.toUpperCase(), { name: SANS, size: 9, bold: true, color: { argb: GREY } });
        mergeRow(hdr.heading, { name: SERIF, size: 20, bold: true, color: { argb: NAVY } }, 28);
        if (hdr.subtitle)
            mergeRow(hdr.subtitle, { name: SANS, size: 10, color: { argb: GREY } });
        if (hdr.volumes || hdr.issued) {
            const bits = [hdr.volumes ? `Volumes ${hdr.volumes}` : '', hdr.issued ? `issued ${hdr.issued}` : ''].filter(Boolean);
            mergeRow(bits.join('  ·  '), { name: MONO, size: 9, color: { argb: GREY } });
        }
        ri++;
        const heads = ['TAB', 'EXHIBIT', 'DOCUMENT & DESCRIPTION', 'DATE', 'PAGES'];
        const hrow = ws.getRow(ri);
        heads.forEach((h, i) => {
            const c = hrow.getCell(i + 1);
            c.value = h;
            c.font = { name: SANS, size: 9, bold: true, color: { argb: GREY } };
            c.alignment = { vertical: 'middle', horizontal: i === 4 ? 'right' : 'left' };
            c.border = { bottom: { style: 'medium', color: { argb: NAVY } } };
        });
        hrow.height = 20;
        ri++;
        const sectionRow = (label, big) => {
            const { letter, name } = this.splitSection(label);
            ws.mergeCells(ri, 1, ri, 5);
            const c = ws.getCell(ri, 1);
            c.value = {
                richText: [
                    ...(letter ? [{ font: { name: SANS, bold: true, size: big ? 11 : 10, color: { argb: BLUE } }, text: `${letter}    ` }] : []),
                    { font: { name: SERIF, bold: true, size: big ? 13 : 11, color: { argb: NAVY } }, text: name },
                ],
            };
            c.alignment = { vertical: 'middle' };
            ws.getRow(ri).height = big ? 24 : 20;
            for (let k = 1; k <= 5; k++)
                ws.getCell(ri, k).border = { bottom: { style: big ? 'medium' : 'thin', color: { argb: NAVY } } };
            ri++;
        };
        const list = roots.length ? roots : [{ label: 'Master Index', sections: [] }];
        for (const root of list) {
            sectionRow(root.label, true);
            for (const sec of root.sections) {
                if (sec.label && !this.sameSectionLabel(sec.label, root.label))
                    sectionRow(sec.label, false);
                for (const r of sec.rows) {
                    const link = this.relRaw(r);
                    const desc = this.idxDesc(r);
                    const row = ws.getRow(ri);
                    const tab = row.getCell(1);
                    tab.value = link ? { text: this.idxTab(r) || '—', hyperlink: link } : (this.idxTab(r) || '—');
                    tab.font = { name: MONO, size: 11, bold: true, color: { argb: BLUE } };
                    tab.alignment = { vertical: 'top' };
                    const ex = row.getCell(2);
                    ex.value = this.idxExhibit(r) || '—';
                    ex.font = { name: MONO, size: 10, color: { argb: GREY } };
                    ex.alignment = { vertical: 'top' };
                    const doc = row.getCell(3);
                    doc.value = {
                        richText: [
                            { font: { name: SERIF, size: 11, color: { argb: INK } }, text: this.idxTitle(r) || '—' },
                            ...(desc ? [{ font: { name: SANS, size: 9, color: { argb: GREY } }, text: `\n${desc}` }] : []),
                        ],
                    };
                    doc.alignment = { vertical: 'top', wrapText: true };
                    const dt = row.getCell(4);
                    dt.value = this.idxDate(r) || '—';
                    dt.font = { name: MONO, size: 10, color: { argb: GREY } };
                    dt.alignment = { vertical: 'top' };
                    const pg = row.getCell(5);
                    pg.value = link ? { text: this.idxPages(r) || '—', hyperlink: link } : (this.idxPages(r) || '—');
                    pg.font = { name: MONO, size: 10, color: { argb: BLUE } };
                    pg.alignment = { vertical: 'top', horizontal: 'right' };
                    for (let k = 1; k <= 5; k++)
                        row.getCell(k).border = { bottom: { style: 'hair', color: { argb: DOT } } };
                    if (desc)
                        row.height = 30;
                    ri++;
                }
            }
        }
        return Buffer.from(await wb.xlsx.writeBuffer());
    }
    masterIndexHtml(roots, hdr) {
        const esc = (s) => String(s ?? '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        const anyLink = roots.some((rt) => rt.sections.some((s) => s.rows.some((r) => this.relLink(r))));
        const bodyRows = [];
        for (const root of roots) {
            const { letter, name } = this.splitSection(root.label);
            bodyRows.push(`<tr class="sec"><td colspan="5">` +
                (letter ? `<span class="sec-l">${esc(letter)}</span>` : '') +
                `<span class="sec-n">${esc(name)}</span></td></tr>`);
            for (const sec of root.sections) {
                if (sec.label && !this.sameSectionLabel(sec.label, root.label)) {
                    const s = this.splitSection(sec.label);
                    bodyRows.push(`<tr class="sub"><td colspan="5">` +
                        (s.letter ? `<span class="sub-l">${esc(s.letter)}</span>` : '') +
                        `<span class="sub-n">${esc(s.name)}</span></td></tr>`);
                }
                for (const r of sec.rows) {
                    const link = this.relLink(r);
                    const tab = esc(this.idxTab(r)) || '—';
                    const ex = esc(this.idxExhibit(r)) || '—';
                    const title = esc(this.idxTitle(r)) || '—';
                    const desc = esc(this.idxDesc(r));
                    const date = esc(this.idxDate(r)) || '—';
                    const pages = esc(this.idxPages(r)) || '—';
                    const tabCell = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${tab}</a>` : tab;
                    const titleLink = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${title}</a>` : title;
                    const pagesCell = link ? `<a href="${esc(link)}" target="_blank" rel="noopener">${pages}</a>` : pages;
                    bodyRows.push(`<tr>` +
                        `<td class="tab">${tabCell}</td>` +
                        `<td class="ex">${ex}</td>` +
                        `<td class="doc"><div class="doc-t">${titleLink}</div>${desc ? `<div class="doc-d">${desc}</div>` : ''}</td>` +
                        `<td class="date">${date}</td>` +
                        `<td class="pages">${pagesCell}</td>` +
                        `</tr>`);
                }
            }
        }
        const volBlock = hdr.volumes
            ? `<div class="vol"><div class="vol-l">Volumes</div><div class="vol-r">${esc(hdr.volumes)}</div>` +
                (hdr.issued ? `<div class="vol-d">issued ${esc(hdr.issued)}</div>` : '') + `</div>`
            : '';
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(hdr.heading)}</title>
<style>
  :root { --navy:#12305f; --blue:#2f6bff; --ink:#1a2436; --grey:#6b7688; --line:#c9d3e2; --dot:#dde4ef; }
  * { box-sizing: border-box; }
  body { font: 15px/1.55 Georgia, 'Times New Roman', serif; color: var(--ink); margin: 0; background:#fff; }
  .page { max-width: 920px; margin: 0 auto; padding: 48px 40px 64px; }
  .head { display:flex; justify-content:space-between; align-items:flex-start; gap:24px; }
  .eyebrow { font-family: Arial, 'Segoe UI', sans-serif; font-size:11px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--grey); }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-size:31px; line-height:1.15; color:var(--navy); font-weight:700; margin:10px 0 6px; }
  .sub { font-family: Arial, 'Segoe UI', sans-serif; font-size:12.5px; color:var(--grey); }
  .vol { text-align:right; white-space:nowrap; flex-shrink:0; }
  .vol-l { font-family:Arial,sans-serif; font-size:10px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:var(--grey); }
  .vol-r { font-family:Georgia,serif; font-size:36px; line-height:1; color:var(--navy); font-weight:700; margin:2px 0 4px; }
  .vol-d { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:11px; color:var(--grey); }
  .rule { border:0; border-top:2px solid var(--navy); margin:18px 0 0; }
  table { border-collapse:collapse; width:100%; margin-top:2px; table-layout:fixed; }
  col.c-tab{width:64px;} col.c-ex{width:78px;} col.c-date{width:104px;} col.c-pg{width:70px;}
  thead th { font-family:Arial,'Segoe UI',sans-serif; font-size:10px; font-weight:700; letter-spacing:.11em; text-transform:uppercase; color:var(--grey); text-align:left; padding:14px 10px 9px; border-bottom:2px solid var(--navy); }
  th.r, td.pages { text-align:right; }
  tbody td { padding:13px 10px; border-bottom:1px dotted var(--dot); vertical-align:top; word-wrap:break-word; }
  tr.sec td { padding:26px 10px 9px; border-bottom:1.5px solid var(--navy); }
  .sec-l { font-family:Arial,sans-serif; font-weight:700; font-size:13px; color:var(--blue); margin-right:12px; }
  .sec-n { font-family:Georgia,serif; font-weight:700; font-size:18px; color:var(--navy); }
  tr.sub td { padding:16px 10px 7px; border-bottom:1px solid var(--line); }
  .sub-l { font-family:Arial,sans-serif; font-weight:700; font-size:11px; color:var(--blue); margin-right:10px; }
  .sub-n { font-family:Georgia,serif; font-weight:700; font-size:14px; color:var(--ink); }
  td.tab a, td.tab { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-weight:700; font-size:13px; color:var(--blue); text-decoration:none; }
  td.ex { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--grey); }
  .doc-t { font-size:14.5px; color:var(--ink); }
  .doc-t a { color:var(--blue); text-decoration:none; }
  .doc-t a:hover { text-decoration:underline; }
  .doc-d { font-family:Arial,'Segoe UI',sans-serif; font-size:12px; color:var(--grey); margin-top:3px; }
  td.date { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--grey); }
  td.pages a, td.pages { font-family:'SFMono-Regular','Consolas','Courier New',monospace; font-size:12px; color:var(--blue); text-decoration:none; }
  .foot { margin-top:26px; font-family:Arial,'Segoe UI',sans-serif; font-size:11px; color:var(--grey); }
</style>
</head>
<body>
<div class="page">
  <div class="head">
    <div>
      ${hdr.eyebrow ? `<div class="eyebrow">${esc(hdr.eyebrow)}</div>` : ''}
      <h1>${esc(hdr.heading)}</h1>
      ${hdr.subtitle ? `<div class="sub">${esc(hdr.subtitle)}</div>` : ''}
    </div>
    ${volBlock}
  </div>
  <hr class="rule">
  <table>
    <colgroup><col class="c-tab"><col class="c-ex"><col><col class="c-date"><col class="c-pg"></colgroup>
    <thead><tr>
      <th>Tab</th><th>Exhibit</th><th>Document &amp; Description</th><th>Date</th><th class="r">Pages</th>
    </tr></thead>
    <tbody>
${bodyRows.join('\n')}
    </tbody>
  </table>
${anyLink ? '  <p class="foot">Links open each document in a new tab. Keep this file inside the extracted package folder — targets are referenced relative to it.</p>' : ''}
</div>
</body>
</html>
`;
        return Buffer.from(html, 'utf8');
    }
    async masterIndexDocx(roots, hdr) {
        const NAVY = '12305F', BLUE = '2F6BFF', GREY = '6B7688', INK = '1A2436', DOT = 'DDE4EF';
        const none = { style: docx_1.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
        const noBorders = { top: none, bottom: none, left: none, right: none };
        const rule = (color, dotted = false, size = 8) => ({ style: dotted ? docx_1.BorderStyle.DOTTED : docx_1.BorderStyle.SINGLE, size, color });
        const left = [];
        if (hdr.eyebrow)
            left.push(new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: hdr.eyebrow.toUpperCase(), bold: true, color: GREY, size: 16 })] }));
        left.push(new docx_1.Paragraph({ spacing: { before: 60, after: 40 }, children: [new docx_1.TextRun({ text: hdr.heading, bold: true, color: NAVY, size: 44 })] }));
        if (hdr.subtitle)
            left.push(new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: hdr.subtitle, color: GREY, size: 19 })] }));
        const right = [];
        if (hdr.volumes) {
            right.push(new docx_1.Paragraph({ alignment: docx_1.AlignmentType.RIGHT, children: [new docx_1.TextRun({ text: 'VOLUMES', bold: true, color: GREY, size: 15 })] }));
            right.push(new docx_1.Paragraph({ alignment: docx_1.AlignmentType.RIGHT, children: [new docx_1.TextRun({ text: hdr.volumes, bold: true, color: NAVY, size: 52 })] }));
            if (hdr.issued)
                right.push(new docx_1.Paragraph({ alignment: docx_1.AlignmentType.RIGHT, children: [new docx_1.TextRun({ text: `issued ${hdr.issued}`, color: GREY, size: 16 })] }));
        }
        const headerTable = new docx_1.Table({
            width: { size: 100, type: docx_1.WidthType.PERCENTAGE },
            borders: noBorders,
            rows: [new docx_1.TableRow({
                    children: [
                        new docx_1.TableCell({ borders: noBorders, width: { size: 72, type: docx_1.WidthType.PERCENTAGE }, children: left }),
                        new docx_1.TableCell({ borders: noBorders, width: { size: 28, type: docx_1.WidthType.PERCENTAGE }, children: right.length ? right : [new docx_1.Paragraph('')] }),
                    ],
                })],
        });
        const cell = (children, opts = {}) => new docx_1.TableCell({
            children,
            columnSpan: opts.span,
            width: opts.width ? { size: opts.width, type: docx_1.WidthType.PERCENTAGE } : undefined,
            borders: { top: none, left: none, right: none, bottom: opts.bottom ?? rule(DOT, true, 4) },
            margins: { top: 90, bottom: 90, left: 60, right: 60 },
        });
        const text = (t, o = {}) => new docx_1.Paragraph({
            alignment: o.align,
            spacing: o.before ? { before: o.before } : undefined,
            children: [new docx_1.TextRun({ text: t, bold: o.bold, color: o.color ?? INK, size: o.size ?? 18 })],
        });
        const widths = [8, 11, 55, 14, 12];
        const bodyRows = [new docx_1.TableRow({
                tableHeader: true,
                children: ['TAB', 'EXHIBIT', 'DOCUMENT & DESCRIPTION', 'DATE', 'PAGES'].map((h, i) => cell([text(h, { bold: true, color: GREY, size: 15, align: i === 4 ? docx_1.AlignmentType.RIGHT : undefined })], { bottom: rule(NAVY, false, 8), width: widths[i] })),
            })];
        const sectionRow = (label, big) => {
            const { letter, name } = this.splitSection(label);
            const runs = [];
            if (letter)
                runs.push(new docx_1.TextRun({ text: `${letter}    `, bold: true, color: BLUE, size: big ? 22 : 18 }));
            runs.push(new docx_1.TextRun({ text: name, bold: true, color: NAVY, size: big ? 26 : 21 }));
            bodyRows.push(new docx_1.TableRow({
                children: [cell([new docx_1.Paragraph({ spacing: { before: big ? 200 : 100, after: big ? 80 : 40 }, children: runs })], { span: 5, bottom: rule(NAVY, false, 8) })],
            }));
        };
        for (const root of roots) {
            sectionRow(root.label, true);
            for (const sec of root.sections) {
                if (sec.label && !this.sameSectionLabel(sec.label, root.label))
                    sectionRow(sec.label, false);
                for (const r of sec.rows) {
                    const docStack = [text(this.idxTitle(r) || '—', { size: 18 })];
                    const desc = this.idxDesc(r);
                    if (desc)
                        docStack.push(text(desc, { color: GREY, size: 15 }));
                    bodyRows.push(new docx_1.TableRow({
                        children: [
                            cell([text(this.idxTab(r) || '—', { bold: true, color: GREY, size: 17 })]),
                            cell([text(this.idxExhibit(r) || '—', { color: GREY, size: 17 })]),
                            cell(docStack),
                            cell([text(this.idxDate(r) || '—', { color: GREY, size: 17 })]),
                            cell([text(this.idxPages(r) || '—', { color: GREY, size: 17, align: docx_1.AlignmentType.RIGHT })]),
                        ],
                    }));
                }
            }
        }
        const doc = new docx_1.Document({
            sections: [{
                    properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
                    children: [
                        headerTable,
                        new docx_1.Paragraph({ spacing: { after: 120 }, text: '' }),
                        new docx_1.Table({ width: { size: 100, type: docx_1.WidthType.PERCENTAGE }, borders: noBorders, rows: bodyRows }),
                    ],
                }],
        });
        return Buffer.from(await docx_1.Packer.toBuffer(doc));
    }
    masterIndexPdf(roots, hdr) {
        const NAVY = '#12305f', BLUE = '#2f6bff', GREY = '#6b7688', INK = '#1a2436', DOT = '#dde4ef';
        const linked = (text, link, extra = {}) => link ? { text, link, ...extra } : { text, ...extra };
        const anyLink = roots.some((rt) => rt.sections.some((s) => s.rows.some((r) => this.relRaw(r))));
        const left = [];
        if (hdr.eyebrow)
            left.push({ text: hdr.eyebrow.toUpperCase(), style: 'eyebrow' });
        left.push({ text: hdr.heading, style: 'h1' });
        if (hdr.subtitle)
            left.push({ text: hdr.subtitle, style: 'sub' });
        const right = [];
        if (hdr.volumes) {
            right.push({ text: 'VOLUMES', style: 'volL', alignment: 'right' });
            right.push({ text: hdr.volumes, style: 'volR', alignment: 'right' });
            if (hdr.issued)
                right.push({ text: `issued ${hdr.issued}`, style: 'volD', alignment: 'right' });
        }
        const th = (t, align = 'left') => ({ text: t.toUpperCase(), style: 'th', alignment: align });
        const body = [[th('Tab'), th('Exhibit'), th('Document & Description'), th('Date'), th('Pages', 'right')]];
        const solidLines = new Set();
        solidLines.add(1);
        const pushSection = (label, big) => {
            const { letter, name } = this.splitSection(label);
            body.push([{
                    colSpan: 5,
                    text: [
                        letter ? { text: `${letter}    `, color: BLUE, bold: true, fontSize: big ? 11 : 9 } : '',
                        { text: name, color: NAVY, bold: true, fontSize: big ? 13 : 10.5 },
                    ],
                    margin: [0, big ? 10 : 5, 0, big ? 4 : 2],
                }, {}, {}, {}, {}]);
            solidLines.add(body.length);
        };
        for (const root of roots) {
            pushSection(root.label, true);
            for (const sec of root.sections) {
                if (sec.label && !this.sameSectionLabel(sec.label, root.label))
                    pushSection(sec.label, false);
                for (const r of sec.rows) {
                    const link = this.relRaw(r);
                    const title = this.idxTitle(r) || '—';
                    const desc = this.idxDesc(r);
                    const docStack = [linked(title, link, { color: link ? BLUE : INK, fontSize: 9 })];
                    if (desc)
                        docStack.push({ text: desc, color: GREY, fontSize: 7.5, margin: [0, 1.5, 0, 0] });
                    body.push([
                        linked(this.idxTab(r) || '—', link, { color: link ? BLUE : GREY, bold: true, style: 'mono' }),
                        { text: this.idxExhibit(r) || '—', color: GREY, style: 'mono' },
                        { stack: docStack },
                        { text: this.idxDate(r) || '—', color: GREY, style: 'mono' },
                        linked(this.idxPages(r) || '—', link, { color: link ? BLUE : GREY, style: 'mono', alignment: 'right' }),
                    ]);
                }
            }
        }
        const content = [
            { columns: [{ stack: left, width: '*' }, { stack: right, width: 'auto' }], columnGap: 18 },
            { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1.5, lineColor: NAVY }], margin: [0, 12, 0, 6] },
            {
                table: { headerRows: 1, dontBreakRows: true, widths: [34, 52, '*', 66, 40], body },
                layout: {
                    hLineWidth: (i) => (i === 0 ? 0 : solidLines.has(i) ? 1 : 0.5),
                    hLineColor: (i) => (solidLines.has(i) ? NAVY : DOT),
                    hLineStyle: (i) => (solidLines.has(i) ? null : { dash: { length: 1, space: 2 } }),
                    vLineWidth: () => 0,
                    paddingLeft: () => 7, paddingRight: () => 7, paddingTop: () => 7, paddingBottom: () => 7,
                },
            },
            ...(anyLink ? [{ text: 'Links open each document in a new tab from Master_Index.html. In a browser PDF viewer, Ctrl+click (Cmd+click on Mac) to open a link in a new tab.', style: 'foot', margin: [0, 16, 0, 0] }] : []),
        ];
        const docDef = {
            pageSize: 'A4', pageMargins: [40, 44, 40, 50], content,
            defaultStyle: { fontSize: 9, color: INK, lineHeight: 1.15 },
            styles: {
                eyebrow: { fontSize: 8, bold: true, color: GREY, characterSpacing: 1.4 },
                h1: { fontSize: 22, bold: true, color: NAVY, margin: [0, 6, 0, 3] },
                sub: { fontSize: 9.5, color: GREY },
                volL: { fontSize: 7.5, bold: true, color: GREY, characterSpacing: 1.4 },
                volR: { fontSize: 26, bold: true, color: NAVY, margin: [0, 1, 0, 2] },
                volD: { fontSize: 8, color: GREY, style: 'mono' },
                th: { fontSize: 7.5, bold: true, color: GREY, characterSpacing: 0.8 },
                mono: { fontSize: 8.5 },
                foot: { fontSize: 8, italics: true, color: GREY },
            },
        };
        return new Promise((resolve, reject) => {
            try {
                const doc = this.printer.createPdfKitDocument(docDef);
                const chunks = [];
                doc.on('data', (c) => chunks.push(c));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                doc.end();
            }
            catch (err) {
                reject(err);
            }
        });
    }
};
exports.DataExportRenderer = DataExportRenderer;
exports.DataExportRenderer = DataExportRenderer = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], DataExportRenderer);


/***/ }),
/* 84 */
/***/ ((module) => {

module.exports = require("exceljs");

/***/ }),
/* 85 */
/***/ ((module) => {

module.exports = require("docx");

/***/ }),
/* 86 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fetchDatasets = void 0;
var type_source_1 = __webpack_require__(87);
Object.defineProperty(exports, "fetchDatasets", ({ enumerable: true, get: function () { return type_source_1.fetchDatasets; } }));


/***/ }),
/* 87 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.fetchDatasets = fetchDatasets;
function rowsOf(res) {
    if (!res?.success)
        return [];
    const first = res.data?.[0];
    return Array.isArray(first) ? first : [];
}
function parseMaybeJson(v) {
    try {
        return JSON.parse(v);
    }
    catch {
        return v;
    }
}
function flattenText(v) {
    if (Array.isArray(v))
        return v.filter(Boolean).map(String).join('\n').trim();
    if (typeof v !== 'string')
        return '';
    const parsed = parseMaybeJson(v);
    if (Array.isArray(parsed))
        return parsed.filter(Boolean).map(String).join('\n').trim();
    return typeof parsed === 'string' ? parsed.trim() : v.trim();
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(s) {
    const t = Date.parse(s);
    if (!Number.isFinite(t))
        return s;
    const d = new Date(t);
    return `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
function markDateStr(jDate, createdIso) {
    const fallback = createdIso ? fmtDate(createdIso) : '';
    let obj = jDate;
    if (typeof obj === 'string') {
        try {
            obj = JSON.parse(obj);
        }
        catch {
            return fallback;
        }
    }
    if (!obj || typeof obj !== 'object')
        return fallback;
    const d = obj;
    const dDate = typeof d.dDate === 'string' ? d.dDate.trim() : '';
    if (!dDate)
        return fallback;
    const qual = typeof d.cQual === 'string' ? d.cQual.trim() : '';
    return qual ? `${qual} ${fmtDate(dDate)}` : fmtDate(dDate);
}
function projectFactRows(rows) {
    return rows.map((r) => {
        const passage = flattenText(r.jOT);
        const note = flattenText(r.jTexts);
        const legacy = typeof r.cFact === 'string' ? r.cFact.trim() : '';
        return {
            Passage: passage || (note ? '' : legacy),
            Note: note,
            Date: markDateStr(r.jDate, r.dCreateDt),
            Document: r.cFilename ?? '',
            Tab: r.cTab ?? '',
            Exhibit: r.cExhibitno ?? '',
            Bundle: r.cBundletag ?? '',
            Status: r.cStatus ?? '',
            Kind: r.cFiletype ?? '',
            Issues: r.nIssues ?? 0,
            Tasks: r.nTaskcount ?? 0,
            Links: r.nLinkscount ?? 0,
            Contacts: r.cEmails ?? '',
            Author: r.cCreateby ?? '',
            Created: fmtDate(r.dCreateDt ?? ''),
        };
    });
}
function projectDoclinkRows(rows) {
    return rows.map((r) => ({
        Created: fmtDate(r.dCreateDt ?? ''),
        'Source Tab Reference': r.cSourceTab ?? '',
        'Source Document Name': r.cSourceDocument ?? '',
        'Destination Tab Reference': r.cDestinationTab ?? '',
        'Destination Document Name': r.cDestinationDocument ?? '',
        Page: r.nPage ?? '',
        Line: r.nLine ?? '',
        Notes: flattenText(r.jTexts),
        'Created By': r.cCreateby ?? '',
    }));
}
async function fetchDatasets(db, cType, nCaseid, nMasterid) {
    switch (cType) {
        case 'facts':
            return [{ name: 'Facts', rows: projectFactRows(rowsOf(await db.executeRef('workspace_fact_list', { nCaseid, nMasterid, cFacttype: 'F' }))) }];
        case 'qfacts':
            return [{ name: 'QFacts', rows: projectFactRows(rowsOf(await db.executeRef('workspace_fact_list', { nCaseid, nMasterid, cFacttype: 'QF' }))) }];
        case 'tags':
            return [{ name: 'Tags', rows: rowsOf(await db.executeRef('tag_list', { nCaseid, nMasterid, ref: 2 })) }];
        case 'tasks':
            return [{ name: 'Tasks', rows: rowsOf(await db.executeRef('task_list', { nCaseid, nMasterid, cTasktype: 'F', ref: 3 })) }];
        case 'doclinks':
            return [{ name: 'DocLinks', rows: projectDoclinkRows(rowsOf(await db.executeRef('case_doclinks', { nCaseid }))) }];
        case 'evidence_index':
            return [{ name: 'Evidence Index', rows: await fetchEvidenceIndex(db, nCaseid, nMasterid) }];
        case 'transcript_index':
            return [{ name: 'Transcript Index', rows: await fetchTranscriptIndex(db, nCaseid) }];
        case 'full_workspace':
            return fetchFullWorkspace(db, nCaseid, nMasterid);
        default:
            return [];
    }
}
async function fetchEvidenceIndex(db, nCaseid, nMasterid) {
    const sectionsRes = await db.executeRef('admin_sections', { nCaseid, nMasterid });
    const sections = rowsOf(sectionsRes);
    const section = sections.find((s) => (s.cFoldertype ?? s.cFolderType) === 'MB') ?? sections[0];
    const nSectionid = section?.nSectionid;
    if (!nSectionid)
        return [];
    const idxRes = await db.executeRef('bundle_index', {
        nSectionid, nCaseid, nMasterid, pageNumber: 1, perPage: 10000, bOutline: false,
    });
    return rowsOf(idxRes);
}
async function fetchTranscriptIndex(db, nCaseid) {
    const all = rowsOf(await db.executeRef('list_transcripts', {}, 'transcript'));
    let caseNo = '';
    try {
        const cr = await db.rowQuery('SELECT "cCaseno" FROM "CaseMaster" WHERE "nCaseid" = $1', [nCaseid]);
        caseNo = String(cr?.data?.[0]?.cCaseno ?? '').trim();
    }
    catch { }
    if (!caseNo)
        return [];
    return all.filter((t) => String(t.cCCaseno ?? '').trim() === caseNo);
}
async function fetchFullWorkspace(db, nCaseid, nMasterid) {
    const [facts, qfacts, tags, tasks, doclinks] = await Promise.all([
        db.executeRef('workspace_fact_list', { nCaseid, nMasterid, cFacttype: 'F' }),
        db.executeRef('workspace_fact_list', { nCaseid, nMasterid, cFacttype: 'QF' }),
        db.executeRef('tag_list', { nCaseid, nMasterid, ref: 2 }),
        db.executeRef('task_list', { nCaseid, nMasterid, cTasktype: 'F', ref: 3 }),
        db.executeRef('case_doclinks', { nCaseid }),
    ]);
    return [
        { name: 'Facts', rows: projectFactRows(rowsOf(facts)) },
        { name: 'QFacts', rows: projectFactRows(rowsOf(qfacts)) },
        { name: 'Tags', rows: rowsOf(tags) },
        { name: 'Tasks', rows: rowsOf(tasks) },
        { name: 'DocLinks', rows: projectDoclinkRows(rowsOf(doclinks)) },
    ];
}


/***/ }),
/* 88 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(21);
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
/* 89 */
/***/ ((module) => {

module.exports = require("body-parser");

/***/ }),
/* 90 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 91 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 92 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 93 */
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
const export_module_1 = __webpack_require__(2);
const kafka_config_1 = __webpack_require__(88);
const bodyParser = __webpack_require__(89);
const compression = __webpack_require__(90);
const cookieParser = __webpack_require__(91);
const swagger_1 = __webpack_require__(12);
const common_1 = __webpack_require__(3);
const dotenv = __webpack_require__(92);
const exception_1 = __webpack_require__(93);
const config_1 = __webpack_require__(18);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(export_module_1.ExportModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('export-group'));
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
        .addServer(process.env.NODE_ENV === 'production' ? '/export' : '')
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
    await app.listen(configService.get('PORT_EXPORTAPI'));
}
bootstrap();

})();

/******/ })()
;