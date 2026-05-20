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
exports.UploadModule = void 0;
const common_1 = __webpack_require__(3);
const upload_controller_1 = __webpack_require__(4);
const upload_service_1 = __webpack_require__(5);
const chunks_upload_service_1 = __webpack_require__(7);
const utility_service_1 = __webpack_require__(19);
const chunk_management_controller_1 = __webpack_require__(26);
const winston_module_1 = __webpack_require__(33);
const ioredis_1 = __webpack_require__(10);
const redis_db_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(6);
const query_builder_service_1 = __webpack_require__(22);
const db_service_1 = __webpack_require__(20);
const platform_express_1 = __webpack_require__(32);
const multer = __webpack_require__(34);
const path = __webpack_require__(13);
const fs = __webpack_require__(14);
const bull_1 = __webpack_require__(12);
const merge_processor_1 = __webpack_require__(35);
const jwt_middleware_1 = __webpack_require__(40);
const jwt_strategy_1 = __webpack_require__(42);
const global_1 = __webpack_require__(45);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const filesystem_service_1 = __webpack_require__(39);
const unzip_processor_1 = __webpack_require__(51);
const realtime_upload_controller_1 = __webpack_require__(86);
const exports_controller_1 = __webpack_require__(87);
const exports_service_1 = __webpack_require__(89);
const export_excel_processor_1 = __webpack_require__(90);
const filecopy_service_1 = __webpack_require__(57);
const copy_file_processor_1 = __webpack_require__(92);
const log_service_1 = __webpack_require__(15);
const convert_processor_1 = __webpack_require__(93);
const fileconvert_controller_1 = __webpack_require__(94);
const nativefileconvert_service_1 = __webpack_require__(96);
const ocrread_processor_1 = __webpack_require__(97);
const ocr_service_1 = __webpack_require__(83);
const convert_service_1 = __webpack_require__(56);
const ocr_controller_1 = __webpack_require__(98);
const snap_processor_1 = __webpack_require__(99);
const snap_service_1 = __webpack_require__(101);
const kafka_module_1 = __webpack_require__(102);
const sequential_merge_processor_1 = __webpack_require__(103);
const file_specify_merge_processor_1 = __webpack_require__(104);
const moveto_s3_service_1 = __webpack_require__(85);
const convert_email_processor_1 = __webpack_require__(105);
const email_service_1 = __webpack_require__(79);
const profile_controller_1 = __webpack_require__(106);
const profile_service_1 = __webpack_require__(107);
const helpcenter_service_1 = __webpack_require__(109);
const file_version_service_1 = __webpack_require__(61);
const delete_file_processor_1 = __webpack_require__(110);
const helpcenter_controller_1 = __webpack_require__(111);
const queue_manage_service_1 = __webpack_require__(25);
let UploadModule = class UploadModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes({ path: 'upload/set-upload-status', method: common_1.RequestMethod.POST }, { path: 'upload/complete-upload', method: common_1.RequestMethod.POST }, { path: 'upload/upload-job', method: common_1.RequestMethod.POST }, { path: 'upload/status', method: common_1.RequestMethod.GET }, { path: 'exports/upload-report', method: common_1.RequestMethod.POST }, { path: 'exports/delete-files', method: common_1.RequestMethod.DELETE }, { path: 'fileconvert/convertfile', method: common_1.RequestMethod.POST }, { path: 'fileconvert/email_parse', method: common_1.RequestMethod.POST }, { path: 'fileconvert/convertfile_multi', method: common_1.RequestMethod.POST }, { path: 'fileconvert/convertlength', method: common_1.RequestMethod.GET }, { path: 'ocr/ocrfile', method: common_1.RequestMethod.POST }, { path: 'profile/upload-image', method: common_1.RequestMethod.POST });
    }
};
exports.UploadModule = UploadModule;
exports.UploadModule = UploadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            global_1.GlobalModule,
            kafka_module_1.KafkaModule.register('etabella-upload', 'upload-group'),
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            platform_express_1.MulterModule.register({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        const identifier = req.body.identifier;
                        const destPath = path.join('./assets/upload-chunks', identifier);
                        fs.promises.mkdir(destPath, { recursive: true })
                            .then(() => cb(null, destPath))
                            .catch(err => cb(err, destPath));
                    },
                    filename: (req, file, cb) => {
                        const chunkNumber = req.body.chunkNumber;
                        cb(null, `${chunkNumber}`);
                    }
                })
            }),
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
                name: 'file-merge',
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
                name: 'sequence-file-merge',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }, {
                name: 'file-specific-merge',
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
                name: 'unzip-process',
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
                name: 'export-excel',
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
                name: 'filecopy-process',
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
                name: 'convert',
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
                name: 'convert-email',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }), bull_1.BullModule.registerQueue({
                name: 'fileocr-process',
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
                name: 'snap-process',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }), bull_1.BullModule.registerQueue({
                name: 'delete-files',
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
                name: 'elastic-index-process',
                defaultJobOptions: {
                    removeOnComplete: true,
                    removeOnFail: true,
                },
                limiter: {
                    max: 1000,
                    duration: 60000,
                },
            }),
            winston_module_1.WinstonConfigModule.forRoot('upload')
        ],
        controllers: [upload_controller_1.UploadController, chunk_management_controller_1.ChunkManagementController, realtime_upload_controller_1.RealtimeUploadController, exports_controller_1.ExportsController, fileconvert_controller_1.FileconvertController, ocr_controller_1.OcrController, profile_controller_1.ProfileController, helpcenter_controller_1.HelpcenterController],
        providers: [upload_service_1.UploadService, db_service_1.DbService, query_builder_service_1.QueryBuilderService, config_1.ConfigService, redis_db_service_1.RedisDbService,
            chunks_upload_service_1.ChunksUploadService, utility_service_1.UtilityService, merge_processor_1.MergeProcessor, unzip_processor_1.UnzipProcessor, jwt_strategy_1.JwtStrategy, verifypdf_service_1.VerifypdfService, updatefileinfo_service_1.UpdatefileinfoService, filesystem_service_1.FilesystemService, exports_service_1.ExportsService, export_excel_processor_1.ExportExcelProcessor,
            copy_file_processor_1.FileCopyProcessor, filecopy_service_1.filecopyService, log_service_1.LogService,
            convert_processor_1.ConvertProcessor, nativefileconvert_service_1.NativefileconvertService, ocrread_processor_1.OcrProcessor, ocr_service_1.OcrService, convert_service_1.ConvertService, snap_processor_1.SnapProcessor,
            snap_service_1.SnapService, sequential_merge_processor_1.SequenceMergeProcessor, file_specify_merge_processor_1.FileMergeProcessor, moveto_s3_service_1.MovetoS3Service, convert_email_processor_1.ConvertEmailProcessor, email_service_1.EmailService, profile_service_1.ProfileService,
            file_version_service_1.FileVersionService, delete_file_processor_1.deleteFilesProcessor, helpcenter_service_1.HelpcenterService, queue_manage_service_1.QueueManageService
        ],
    })
], UploadModule);


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
exports.UploadController = void 0;
const common_1 = __webpack_require__(3);
const upload_service_1 = __webpack_require__(5);
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    getHello() {
        return this.uploadService.getHello();
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], UploadController.prototype, "getHello", null);
exports.UploadController = UploadController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object])
], UploadController);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
let UploadService = class UploadService {
    getHello() {
        return 'Hello World!';
    }
    constructor(config) {
        this.config = config;
        this.tempChunkPath = './assets/upload-chunks';
        this.docPath = 'doc';
        this.backupDocPath = this.config.get('COPY_PATH');
        this.redisKey = 'chunk/';
    }
    async onModuleInit() {
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], UploadService);


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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChunksUploadService = void 0;
const common_1 = __webpack_require__(3);
const upload_service_1 = __webpack_require__(5);
const redis_db_service_1 = __webpack_require__(8);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
const path_1 = __webpack_require__(13);
const config_1 = __webpack_require__(6);
const fs_1 = __webpack_require__(14);
const log_service_1 = __webpack_require__(15);
const utility_service_1 = __webpack_require__(19);
const queue_manage_service_1 = __webpack_require__(25);
let ChunksUploadService = class ChunksUploadService {
    constructor(upld, redisDbService, logService, fileMergeQueue, sequenceMergeQueue, fileocrQueue, convertQueue, config, utility, queueManage) {
        this.upld = upld;
        this.redisDbService = redisDbService;
        this.logService = logService;
        this.fileMergeQueue = fileMergeQueue;
        this.sequenceMergeQueue = sequenceMergeQueue;
        this.fileocrQueue = fileocrQueue;
        this.convertQueue = convertQueue;
        this.config = config;
        this.utility = utility;
        this.queueManage = queueManage;
        this.chunkSet = {};
        this.groupSize = 10;
        this.tempUploadPath = this.upld.tempChunkPath;
        this.fileMergeQueue.on('error', (error) => {
        });
        this.fileMergeQueue.on('completed', (job, result) => {
            this.onDecreaseJob(job);
        });
        this.fileMergeQueue.on('failed', (job, err) => {
            this.onDecreaseJob(job);
        });
        this.fileMergeQueue.on('active', (job) => {
        });
        this.fileMergeQueue.on('waiting', (jobId) => {
            console.log(`MERGE Job ${jobId} is waiting`);
        });
        this.fileMergeQueue.on('stalled', (job) => {
            console.log(`MERGE Job ${job.id} has stalled`);
        });
        this.fileMergeQueue.on('progress', (job, progress) => {
            console.log(`MERGE Job ${job.id} progress: ${progress}%`);
        });
        console.log('\n\r\n\r\n\r\n\rChunk upload service initialized.');
    }
    async onModuleInit() {
        await this.clearQueue();
    }
    async onInit() {
    }
    async checkExistingChunks(identifier, nUPid, nCaseid, cPath, cTotal) {
        let MaxChunks = -1;
        try {
            MaxChunks = await this.redisDbService.getMaxFromList(this.upld.redisKey + identifier);
            MaxChunks = isNaN(MaxChunks) ? -1 : MaxChunks;
            MaxChunks = (MaxChunks - 10) > 0 ? (MaxChunks - 10) : 0;
        }
        catch (error) {
            console.error('Error fetching max chunks:', error);
        }
        const finalPath = (0, path_1.resolve)(this.config.get('ASSETS'), 'doc', `case${nCaseid}`);
        try {
            await fs_1.promises.mkdir(finalPath, { recursive: true });
        }
        catch (error) {
            console.error("Error creating directory:", error);
        }
        try {
            this.chunkSet[`obj_${identifier}`] = await this.redisDbService.getChunkObject(identifier, this.chunkSet[`obj_${identifier}`], this.groupSize);
            this.chunkSet[`obj_${identifier}`].path = cPath;
        }
        catch (error) {
            this.logService.error(`Failed to get chunk obj ${error} `, `upload/${nUPid}/${identifier}`);
        }
        this.logService.info(`chunk OBJECT ${JSON.stringify(this.chunkSet[`obj_${identifier}`])}`, `upload/${nUPid}/${identifier}`);
        try {
            this.chunkSet[identifier] = await this.redisDbService.getChunkArray(identifier);
        }
        catch (error) {
            this.logService.error(`Failed to get chunk array ${error} `, `upload/${nUPid}/${identifier}`);
        }
        await this.redisDbService.setChunkObject(identifier, this.chunkSet[`obj_${identifier}`]);
        this.logService.info(`File Upload Started  \n totalChunks=${parseInt(cTotal)}, path=${cPath}`, `upload/${nUPid}/${identifier}`);
        return { max: MaxChunks, msg: 1 };
    }
    async saveChunk(file, body) {
        debugger;
        if (!file || !body.identifier || !body.chunkNumber) {
            return { m: -1, i: body.chunkNumber };
        }
        this.logService.info(`chunk receive ${body.chunkNumber}`, `upload/${body.nUPid}/${body.identifier}`);
        this.redisDbService.pushAndTrimList(this.upld.redisKey + body.identifier, parseInt(body.chunkNumber), 48 * 3600);
        const chunkNumber = parseInt(body.chunkNumber);
        const fileId = body.identifier;
        if (!this.chunkSet[fileId]) {
            this.chunkSet[fileId] = await this.redisDbService.getChunkArray(fileId);
        }
        if (!this.chunkSet[fileId].includes(chunkNumber))
            this.chunkSet[fileId].push(chunkNumber);
        this.manageArrayForMerge(fileId, body);
        return { m: 1, i: body.chunkNumber };
    }
    async manageArrayForMerge(fileId, body) {
        this.chunkSet[fileId].sort((a, b) => a - b);
        this.chunkSet[`obj_${fileId}`] = await this.redisDbService.getChunkObject(fileId, this.chunkSet[`obj_${fileId}`], this.groupSize);
        const obj = this.chunkSet[`obj_${fileId}`];
        const filterd = (this.chunkSet[fileId].filter(a => obj.maxChunk > a));
        this.redisDbService.setChunkArray(fileId, this.chunkSet[fileId]);
        if (filterd.length >= this.groupSize) {
            this.logService.info(`Filtered ,GROUP:${obj.maxChunk} ${JSON.stringify(filterd)}`, `upload/${body.nUPid}/${body.identifier}`);
            this.chunkSet[fileId] = this.chunkSet[fileId].filter(a => a >= obj.maxChunk);
            this.logService.info(`REMAIN ,GROUP:${obj.maxChunk} ${JSON.stringify(this.chunkSet[fileId])}`, `upload/${body.nUPid}/${body.identifier}`);
            this.chunkSet[`obj_${fileId}`].maxChunk = obj.maxChunk + this.groupSize;
            this.redisDbService.setChunkObject(fileId, this.chunkSet[`obj_${fileId}`]);
            this.redisDbService.setChunkArray(fileId, this.chunkSet[fileId]);
            const start = this.getMinChunk(filterd);
            const end = this.getMaxChunk(filterd);
            await this.sequenceMergeQueue.add({ body: null, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid, path: this.chunkSet[`obj_${fileId}`].path }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        }
    }
    getMinChunk(arr) {
        return Math.min(...arr);
    }
    getMaxChunk(arr) {
        if (!arr.length)
            return null;
        arr.sort((a, b) => a - b);
        let maxSeq = arr[0];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] === arr[i - 1] + 1) {
                maxSeq = arr[i];
            }
            else {
                break;
            }
        }
        return maxSeq;
    }
    removeFirstSequence(arr) {
        const sortedArr = [...arr].sort((a, b) => a - b);
        const sequence = [sortedArr[0]];
        for (let i = 1; i < sortedArr.length; i++) {
            if (sortedArr[i] === sortedArr[i - 1] + 1) {
                sequence.push(sortedArr[i]);
            }
            else {
                break;
            }
        }
        const result = arr.filter(num => !sequence.includes(num));
        return result;
    }
    async completeUpload(body) {
        console.log('UPLOAD COMPLETE');
        const fileId = body.identifier;
        if (!this.chunkSet[fileId])
            this.chunkSet[fileId] = await this.redisDbService.getChunkArray(fileId);
        this.chunkSet[fileId].sort((a, b) => a - b);
        const start = this.getMinChunk(this.chunkSet[fileId]);
        const end = this.getMaxChunk(this.chunkSet[fileId]);
        try {
            await this.sequenceMergeQueue.add({ body: body, nUPid: body.nUPid, startChunk: start, endChunk: end, fileId: fileId, nMasterid: body.nMasterid, path: this.chunkSet[`obj_${fileId}`].path }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        }
        catch (error) {
        }
        try {
            const total = await this.redisDbService.countInc(`task:${body.nUPid}:count`);
            this.logService.info(`INC ${body.nUPid} COUNT ${total}`, `upload/notification`);
        }
        catch (error) {
        }
        try {
            this.redisDbService.deleteChunks(fileId);
        }
        catch (error) {
        }
        try {
            delete this.chunkSet[`obj_${fileId}`];
            delete this.chunkSet[fileId];
        }
        catch (error) {
        }
        return { msg: 1, value: 'Merge started...' };
    }
    async clearQueue() {
        await this.fileMergeQueue.clean(0, 'completed');
        await this.fileMergeQueue.clean(0, 'wait');
        await this.fileMergeQueue.clean(0, 'active');
        await this.fileMergeQueue.clean(0, 'delayed');
        await this.fileMergeQueue.clean(0, 'failed');
        await this.fileocrQueue.clean(0, 'completed');
        await this.fileocrQueue.clean(0, 'wait');
        await this.fileocrQueue.clean(0, 'active');
        await this.fileocrQueue.clean(0, 'delayed');
        await this.fileocrQueue.clean(0, 'failed');
        await this.convertQueue.clean(0, 'completed');
        await this.convertQueue.clean(0, 'wait');
        await this.convertQueue.clean(0, 'active');
        await this.convertQueue.clean(0, 'delayed');
        await this.convertQueue.clean(0, 'failed');
        console.log('All jobs cleared.');
    }
    async setUploadStatus(body) {
        try {
            if (body.nTotal && body.nUPid) {
                this.redisDbService.setValue(`file:status:${body.nUPid}`, JSON.stringify(body), 24 * 3600);
            }
        }
        catch (error) {
        }
        return { msg: 1 };
    }
    async uploadJob(body) {
        try {
            const list = body.jUPids;
            list.forEach(async (e) => {
                if (e.nTotal && e.nUPid) {
                    this.redisDbService.deleteValue(`file:status:${e.nUPid}`);
                    const count = await this.redisDbService.count(`task:${e.nUPid}:count`);
                    this.logService.info(`UPLOAD JOB ${e.nUPid} COUNT ${count}`, `upload/notification`);
                    if (count == 0) {
                        this.sendNotificationForUpload(e.nUPid, body.nMasterid);
                    }
                }
            });
        }
        catch (error) {
        }
        return { msg: 1 };
    }
    async onDecreaseJob(job) {
        try {
            const nUPid = job.data.nUPid;
            if (nUPid) {
                const remainingJobs = await this.redisDbService.countDec(`task:${nUPid}:count`);
                this.logService.info(`DEC ${nUPid}  COUNT ${remainingJobs}`, `upload/notification`);
                if (remainingJobs === 0) {
                    const status = await this.redisDbService.getValue(`file:status:${nUPid}`);
                    if (!status) {
                        this.sendNotificationForUpload(nUPid, job.data.nMasterid);
                    }
                }
            }
        }
        catch (error) {
        }
    }
    async sendNotificationForUpload(nUPid, nMasterid) {
        if (!nUPid)
            return;
        this.logService.report(`Notification send for ${nUPid}`, `upload/notification/${nUPid}`);
        try {
            await this.redisDbService.deleteChunks(`task:${nUPid}:count`);
        }
        catch (error) {
        }
        try {
            const users = await this.utility.getUploadUser(nUPid);
            this.logService.report(`Users for notification ${(users?.length)}`, `upload/notification/${nUPid}`);
            if (users?.length) {
                users.forEach(a => {
                    this.logService.report(`Notify to ${(a.nUserid)}`, `upload/notification/${nUPid}`);
                    a["nRefuserid"] = nMasterid;
                    this.utility.emit(a, `notification`);
                });
            }
            await this.redisDbService.deleteValue(`task:${nUPid}:count`);
        }
        catch (error) {
            this.logService.report(`FAILED  ${(error.message)}`, `upload/notification/${nUPid}`, 'E');
            console.log(error);
        }
    }
};
exports.ChunksUploadService = ChunksUploadService;
exports.ChunksUploadService = ChunksUploadService = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_2.InjectQueue)('file-merge')),
    __param(4, (0, bull_2.InjectQueue)('sequence-file-merge')),
    __param(5, (0, bull_2.InjectQueue)('fileocr-process')),
    __param(6, (0, bull_2.InjectQueue)('convert')),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object, typeof (_f = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _f : Object, typeof (_g = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _g : Object, typeof (_h = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _h : Object, typeof (_j = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _j : Object, typeof (_k = typeof queue_manage_service_1.QueueManageService !== "undefined" && queue_manage_service_1.QueueManageService) === "function" ? _k : Object])
], ChunksUploadService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(9);
const ioredis_2 = __webpack_require__(10);
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
/* 9 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 10 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("fs");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(16);
const nest_winston_1 = __webpack_require__(17);
const winston = __webpack_require__(16);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
const moment = __webpack_require__(18);
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
/* 16 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 17 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("moment-timezone");

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
exports.UtilityService = void 0;
const db_service_1 = __webpack_require__(20);
const kafka_shared_service_1 = __webpack_require__(23);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka, db) {
        this.kafka = kafka;
        this.db = db;
    }
    emit(data, topic) {
        this.kafka.sendMessage((topic ? topic : 'upload-response'), data);
    }
    async getUploadUser(nUPid) {
        try {
            let res = await this.db.executeRef('upload_job_notifications', { nUPid: nUPid });
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
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object])
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(21);
const query_builder_service_1 = __webpack_require__(22);
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
/* 21 */
/***/ ((module) => {

module.exports = require("pg");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueManageService = void 0;
const db_service_1 = __webpack_require__(20);
const common_1 = __webpack_require__(3);
let QueueManageService = class QueueManageService {
    constructor(db) {
        this.db = db;
        this.elasticOptions = {
            nTCatid: 6, MASTER_QUEUE: 'pdfextraction',
            steps: [
                { nRid: 8, name: 'DOWNLOAD', queue: 'download-document-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5 },
                { nRid: 9, name: 'EXTRACTION', queue: 'elastic-index-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5, isMain: true, onFailed: 1 },
                { nRid: 10, name: 'DELETE', queue: 'delete-document-process', concurrency: 2, maxRetries: 3, timeout: 1000 * 60 * 60 * 5 }
            ]
        };
        this.schema = 'task';
        this.logger = new common_1.Logger('file-copy-queue');
    }
    async createElasticTask(body) {
        try {
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async insertTask(nBundledetailid, nUPid, cPath) {
        try {
            const res = await this.db.executeRef('elasticsearch_upload_add_task', { nBundledetailid, nUPid }, this.schema);
            if (res.success) {
                const data = res.data[0][0];
                if (data.msg == 1) {
                    this.logger.warn(`Pushin into queue `, { ...data, nBundledetailid, nUPid, cPath });
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.QueueManageService = QueueManageService;
exports.QueueManageService = QueueManageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], QueueManageService);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ChunkManagementController = void 0;
const common_1 = __webpack_require__(3);
const chunks_upload_service_1 = __webpack_require__(7);
const swagger_1 = __webpack_require__(27);
const chunk_interface_1 = __webpack_require__(28);
const platform_express_1 = __webpack_require__(32);
let ChunkManagementController = class ChunkManagementController {
    constructor(chunkService) {
        this.chunkService = chunkService;
    }
    async setUploadProperty(body) {
        return await this.chunkService.setUploadStatus(body);
    }
    async checkUploadedChunks(query) {
        const { identifier, nUPid, nCaseid, cPath, cTotal } = query;
        return await this.chunkService.checkExistingChunks(identifier, nUPid, nCaseid, cPath, cTotal);
    }
    async uploadChunk(file, body) {
        return await this.chunkService.saveChunk(file, body);
    }
    async completeUpload(body) {
        return await this.chunkService.completeUpload(body);
    }
    async uploadJob(body) {
        return await this.chunkService.uploadJob(body);
    }
};
exports.ChunkManagementController = ChunkManagementController;
__decorate([
    (0, common_1.Post)('set-upload-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof chunk_interface_1.uploadStatusSet !== "undefined" && chunk_interface_1.uploadStatusSet) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ChunkManagementController.prototype, "setUploadProperty", null);
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof chunk_interface_1.ChunkStatusReq !== "undefined" && chunk_interface_1.ChunkStatusReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ChunkManagementController.prototype, "checkUploadedChunks", null);
__decorate([
    (0, common_1.Post)('upload-chunk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof Express !== "undefined" && (_f = Express.Multer) !== void 0 && _f.File) === "function" ? _g : Object, Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], ChunkManagementController.prototype, "uploadChunk", null);
__decorate([
    (0, common_1.Post)('complete-upload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof chunk_interface_1.MergeChunksReq !== "undefined" && chunk_interface_1.MergeChunksReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], ChunkManagementController.prototype, "completeUpload", null);
__decorate([
    (0, common_1.Post)('upload-job'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof chunk_interface_1.UploadJob !== "undefined" && chunk_interface_1.UploadJob) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], ChunkManagementController.prototype, "uploadJob", null);
exports.ChunkManagementController = ChunkManagementController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('upload'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [typeof (_a = typeof chunks_upload_service_1.ChunksUploadService !== "undefined" && chunks_upload_service_1.ChunksUploadService) === "function" ? _a : Object])
], ChunkManagementController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadJob = exports.UploadUPid = exports.uploadStatusSet = exports.MergeChunksReq = exports.UploadResponce = exports.ChunkStatusReq = exports.ChunkStatus = void 0;
const swagger_1 = __webpack_require__(27);
const class_validator_1 = __webpack_require__(29);
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
class ChunkStatus {
}
exports.ChunkStatus = ChunkStatus;
class ChunkStatusReq {
}
exports.ChunkStatusReq = ChunkStatusReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "unic", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "path", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "total", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "cTotal", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], ChunkStatusReq.prototype, "nMasterid", void 0);
class UploadResponce {
}
exports.UploadResponce = UploadResponce;
class MergeChunksReq {
}
exports.MergeChunksReq = MergeChunksReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "unic", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "identifier", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "name", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "filetype", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "", description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "cFilename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MergeChunksReq.prototype, "totalChunks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b8a4c7d1-e956-4c70-9d6b-f3e1c2a3b4d5', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nBundleid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'c9b5d8e2-f067-5d81-0e7c-g4f2d3a4b5e6', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'd0c6e9f3-g178-6e92-1f8d-h5g3e4a5b6f7', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nUDid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e1d7f0a4-h289-7f03-2g9e-i6h4f5a6b7g8', description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MergeChunksReq.prototype, "filesize", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'f2e8g1b5-i390-8g14-3h0f-j7i5g6b7h8i9', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nCaseid", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], MergeChunksReq.prototype, "bisTranscript", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], MergeChunksReq.prototype, "bIsconvert", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "converttype", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], MergeChunksReq.prototype, "bIsocr", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], MergeChunksReq.prototype, "nOcrtype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], MergeChunksReq.prototype, "nMasterid", void 0);
class uploadStatusSet {
}
exports.uploadStatusSet = uploadStatusSet;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadStatusSet.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], uploadStatusSet.prototype, "nTotal", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], uploadStatusSet.prototype, "nMasterid", void 0);
class UploadUPid {
}
exports.UploadUPid = UploadUPid;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UploadUPid.prototype, "nUPid", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadUPid.prototype, "nTotal", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadUPid.prototype, "nComplete", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], UploadUPid.prototype, "nFailed", void 0);
class UploadJob {
}
exports.UploadJob = UploadJob;
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'Array of upload job IDs' }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UploadJob.prototype, "jUPids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Master ID of the upload job', required: false }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], UploadJob.prototype, "nMasterid", void 0);


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
const class_transformer_1 = __webpack_require__(31);
const class_validator_1 = __webpack_require__(29);
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

module.exports = require("@nestjs/platform-express");

/***/ }),
/* 33 */
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
const nest_winston_1 = __webpack_require__(17);
const winston = __webpack_require__(16);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
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
/* 34 */
/***/ ((module) => {

module.exports = require("multer");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MergeProcessor = void 0;
const fs_1 = __webpack_require__(14);
const path_1 = __webpack_require__(13);
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const upload_service_1 = __webpack_require__(5);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const filesystem_service_1 = __webpack_require__(39);
const config_1 = __webpack_require__(6);
const redis_db_service_1 = __webpack_require__(8);
const utility_service_1 = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
let MergeProcessor = class MergeProcessor {
    constructor(upld, fileVerificationService, filesystemService, config, fileInfo, rds, logService, UnzipQueue, utility, fileCopyQueue, snapQueue, fileocrQueue, convertQueue, convertEmailQueue, fileDeleteQueue) {
        this.upld = upld;
        this.fileVerificationService = fileVerificationService;
        this.filesystemService = filesystemService;
        this.config = config;
        this.fileInfo = fileInfo;
        this.rds = rds;
        this.logService = logService;
        this.UnzipQueue = UnzipQueue;
        this.utility = utility;
        this.fileCopyQueue = fileCopyQueue;
        this.snapQueue = snapQueue;
        this.fileocrQueue = fileocrQueue;
        this.convertQueue = convertQueue;
        this.convertEmailQueue = convertEmailQueue;
        this.fileDeleteQueue = fileDeleteQueue;
        this.logApp = 'upload';
        this.setupQueueListeners();
    }
    setupQueueListeners() {
    }
    async handleMerge(job) {
        const nUPid = job.data.nUPid;
        this.logService.info(`Final process start`, `upload/${nUPid}/${job.data.identifier}`);
        let mergeSuccess = true;
        const { identifier, totalChunks, nCaseid, filetype, name, nUDid } = job.data;
        const chunksPath = (0, path_1.join)(this.upld.tempChunkPath, identifier);
        const dirPath = `${this.upld.docPath}/case${nCaseid}`;
        const dirFile = `${dirPath}/${name}.${filetype}`;
        const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), dirFile);
        await this.filesystemService.createDirectoryHierarchy(dirPath);
        if (!mergeSuccess) {
            await this.deleteChunks(chunksPath, identifier);
            return;
        }
        try {
            this.logService.info(`file merged  : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`);
        }
        catch (error) {
        }
        this.utility.emit({ event: 'FILE-MERGED', data: { identifier, nMasterid: job.data.nMasterid } });
        if (filetype.toUpperCase() === 'ZIP') {
            const jobObj = {
                nUDid: nUDid,
                nMasterid: job.data.nMasterid,
                cPath: dirFile,
                nCaseid: job.data.nCaseid,
                nSectionid: job.data.nSectionid,
                nBundleid: job.data.nBundleid,
                identifier: identifier,
                bIsconvert: job.data.bIsconvert,
                converttype: job.data.converttype,
                bIsocr: job.data.bIsocr,
                nOcrtype: job.data.nOcrtype
            };
            let res = await this.fileInfo.jobStart(jobObj);
            if (res.msg == 1) {
                try {
                    this.logService.info(`zip process : nUDid=${nUDid} nJobid=${res.nJobid}`, `upload/${nUPid}/${job.data.identifier}`);
                }
                catch (error) {
                }
                this.utility.emit({ event: 'ZIP-PROCESS', data: { identifier, nMasterid: job.data.nMasterid, nJobid: res.nJobid } });
                await this.UnzipQueue.add({ nJobid: res.nJobid, identifier: job.data.identifier, nUPid, nUDid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: 1000 * 60 * 5 });
            }
            else {
                try {
                    this.logService.error(`zip failed : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`);
                }
                catch (error) {
                }
                this.utility.emit({ event: 'ZIP-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
            }
            await this.deleteChunks(chunksPath, identifier);
            return;
        }
        const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
        this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.nMasterid } });
        try {
            this.logService.info(`VERIFY-CPOMPLETE : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`);
        }
        catch (error) {
        }
        const fileInfo = {
            nUDid: nUDid,
            nMasterid: job.data.nMasterid,
            cFilename: job.data.cFilename,
            nSectionid: job.data.nSectionid,
            nBundleid: job.data.nBundleid,
            nBundledetailid: job.data.nBundledetailid,
            cFiletype: filetype,
            isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
            cPath: dirFile,
            cFilesize: job.data.filesize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: (job.data.bisTranscript ? job.data.bisTranscript : false),
        };
        let res = await this.fileInfo.updateFileInfo(fileInfo);
        let isComplete = false;
        this.logService.info(`File update info ${JSON.stringify(res)}  bIsconvert:${job.data.bIsconvert} ,converttype:${job.data.converttype} ,bIsocr:${job.data.bIsocr}`, `upload/${nUPid}/${job.data.identifier}`);
        if (res.msg == 1) {
            isComplete = true;
            try {
                if (res && res['cOldpath'] && res['cOldpath'] != '') {
                    this.logService.info(`Delete Old file  : nUDid=${nUDid} - ${res['cOldpath']}`, `upload/${nUPid}/${job.data.identifier}`);
                    this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] });
                }
            }
            catch (error) {
                console.log('Error in fileDeleteQueue:', error);
            }
            try {
                if (!nUPid) {
                    this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
                    await this.deleteChunks(chunksPath, identifier);
                    return;
                }
            }
            catch (error) {
            }
            if (isComplete) {
                if (job.data.bIsconvert && job.data.converttype != 'N') {
                    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'zip'].includes(filetype.toLowerCase())) {
                        let data = { "nMasterid": job.data.nMasterid, "nBundledetailid": res.nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
                        try {
                            await this.fileInfo.convertLog(data);
                        }
                        catch (error) {
                        }
                        await this.convertQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: job.data.converttype == 'C' ? res.nBundledetailid : null }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                    }
                }
                else if (job.data.bIsocr && (/\.(pdf)$/i.test(dirFile))) {
                    await this.fileocrQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                }
                if (['msg'].includes(filetype.toLowerCase())) {
                    let data = { "nMasterid": job.data.nMasterid, "nBundledetailid": res.nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
                    try {
                        if (job.data.bIsconvert && job.data.converttype != 'N') {
                            await this.fileInfo.convertLog(data);
                        }
                    }
                    catch (error) {
                    }
                    await this.convertEmailQueue.add({ cPath: dirFile, data: job.data, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                }
                if (!(job.data.bIsocr && (/\.(pdf)$/i.test(dirFile))) && (!job.data.bIsconvert || (job.data.bIsconvert && job.data.converttype != 'C'))) {
                    this.logService.info(`Adding to queue at  `, `upload/${nUPid}/${job.data.identifier}`);
                    await this.fileCopyQueue.add({ cPath: dirFile, converttype: job.data.converttype, nBundledetailid: res.nBundledetailid, nUPid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                    await this.snapQueue.add({ cPath: dirFile, nCaseid: nCaseid, nBundledetailid: res.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                }
            }
            try {
                this.logService.info(`FILE-INSERT-COMPLETE : nUDid=${nUDid}`, `upload/${nUPid}/${job.data.identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
            if (job.data.bisTranscript) {
                this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            }
        }
        else {
            isComplete = false;
            try {
                this.logService.error(`FILE-INSERT-Failed : nUDid=${nUDid} ERROR : ${JSON.stringify(res)}`, `upload/${nUPid}/${job.data.identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.nMasterid, msg: -1 } });
            if (job.data.bisTranscript) {
                this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
            }
        }
        await this.deleteChunks(chunksPath, identifier);
    }
    async deleteChunks(chunksPath, identifier) {
        try {
            this.rds.deleteList(this.upld.redisKey + identifier);
            try {
                this.rds.deleteChunks(identifier);
            }
            catch (error) {
            }
            await fs_1.promises.rm(chunksPath, { recursive: true });
        }
        catch (error) {
            console.error('Failed to delete chunk directory:', error);
        }
    }
};
exports.MergeProcessor = MergeProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 2 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_r = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _r : Object]),
    __metadata("design:returntype", Promise)
], MergeProcessor.prototype, "handleMerge", null);
exports.MergeProcessor = MergeProcessor = __decorate([
    (0, bull_1.Processor)('file-merge'),
    __param(7, (0, bull_1.InjectQueue)('unzip-process')),
    __param(9, (0, bull_1.InjectQueue)('filecopy-process')),
    __param(10, (0, bull_1.InjectQueue)('snap-process')),
    __param(11, (0, bull_1.InjectQueue)('fileocr-process')),
    __param(12, (0, bull_1.InjectQueue)('convert')),
    __param(13, (0, bull_1.InjectQueue)('convert-email')),
    __param(14, (0, bull_1.InjectQueue)('delete-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _b : Object, typeof (_c = typeof filesystem_service_1.FilesystemService !== "undefined" && filesystem_service_1.FilesystemService) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _e : Object, typeof (_f = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _f : Object, typeof (_g = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _g : Object, typeof (_h = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _h : Object, typeof (_j = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _j : Object, typeof (_k = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _k : Object, typeof (_l = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _l : Object, typeof (_m = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _m : Object, typeof (_o = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _o : Object, typeof (_p = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _p : Object, typeof (_q = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _q : Object])
], MergeProcessor);


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
exports.VerifypdfService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(37);
const config_1 = __webpack_require__(6);
const fs = __webpack_require__(14);
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
/* 37 */
/***/ ((module) => {

module.exports = require("child_process");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdatefileinfoService = void 0;
const db_service_1 = __webpack_require__(20);
const common_1 = __webpack_require__(3);
let UpdatefileinfoService = class UpdatefileinfoService {
    constructor(db) {
        this.db = db;
    }
    async updateFileInfo(body) {
        let res = await this.db.executeRef('upload_updatefileinfo', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async jobStart(body) {
        let res = await this.db.executeRef('upload_unzip', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async getJobDetail(nJobid) {
        let res = await this.db.executeRef('upload_getjobdetail', { nJobid: nJobid });
        if (res.success) {
            if (res.data[0].length) {
                return res.data[0][0];
            }
            return { msg: -1, value: 'No job id found' };
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async saveBundle(jobDetail, result) {
        let res = await this.db.executeRef('upload_unzip_extractation', { ...jobDetail, jFolders: JSON.stringify(result) });
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async finalUpdate(detail) {
        let res = await this.db.executeRef('upload_unzip_update_bundledetail', detail);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async jobFailed(nJobid) {
        let res = await this.db.executeRef('upload_job_failed', { nJobid: nJobid, cStatus: 'F' });
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
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
    async updateConvertFileInfo(body) {
        let res = await this.db.executeRef('upload_update_convertinfo', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async get_filedata(body) {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async updateFilePathInfo(body) {
        let res = await this.db.executeRef('upload_update_filepath', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async OcrUpdate(body) {
        let res = await this.db.executeRef('ocr_update', body);
        console.log(res);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async convertLog(body) {
        let res = await this.db.executeRef('convert_log', body);
        console.log(res);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async converStatus(body) {
        let res = await this.db.executeRef('convert_status', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
    async convert_fileDataMulti(body) {
        let res = await this.db.executeRef('convert_files_byids', body);
        if (res.success) {
            return res.data[0];
        }
        else {
            return { msg: -1, value: 'Failed to update', error: res.error };
        }
    }
};
exports.UpdatefileinfoService = UpdatefileinfoService;
exports.UpdatefileinfoService = UpdatefileinfoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], UpdatefileinfoService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilesystemService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(41);
const redis_db_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(6);
const db_service_1 = __webpack_require__(20);
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
/* 41 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtStrategy = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const passport_1 = __webpack_require__(43);
const passport_jwt_1 = __webpack_require__(44);
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    constructor(config) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromExtractors([
                passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
                (req) => req?.cookies?.access_token,
            ]),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_SECRET'),
        });
        this.config = config;
    }
    async validate(payload) {
        return { userId: payload.sub, username: payload.username };
    }
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], JwtStrategy);


/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

/***/ }),
/* 44 */
/***/ ((module) => {

module.exports = require("passport-jwt");

/***/ }),
/* 45 */
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
__exportStar(__webpack_require__(46), exports);
__exportStar(__webpack_require__(47), exports);


/***/ }),
/* 46 */
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
const global_service_1 = __webpack_require__(47);
const config_1 = __webpack_require__(6);
const scheduler_service_1 = __webpack_require__(48);
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
/* 47 */
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
/* 48 */
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
const moment = __webpack_require__(49);
const schedule = __webpack_require__(50);
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
/* 49 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 50 */
/***/ ((module) => {

module.exports = require("node-schedule");

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UnzipProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const updatefileinfo_service_1 = __webpack_require__(38);
const utility_service_1 = __webpack_require__(19);
const core_1 = __webpack_require__(1);
const zip_service_1 = __webpack_require__(52);
const log_service_1 = __webpack_require__(15);
const fs = __webpack_require__(60);
const config_1 = __webpack_require__(6);
let UnzipProcessor = class UnzipProcessor {
    constructor(fileInfo, utility, moduleRef, logService, config) {
        this.fileInfo = fileInfo;
        this.utility = utility;
        this.moduleRef = moduleRef;
        this.logService = logService;
        this.config = config;
        this.start = new Date();
    }
    onApplicationShutdown(signal) {
        console.log(`Shutting down unzip processor on signal: ${signal}`);
        try {
        }
        catch (error) {
            console.log('Error closing zip file', error);
        }
    }
    async handleUnzip(job) {
        const zipService = await this.moduleRef.create(zip_service_1.ZipService);
        const { nJobid, identifier, nUPid, nUDid } = job.data;
        this.logService.info(`Unzipping job... ${nJobid}`, `upload/${nUPid}/${identifier}`);
        console.log('Unzipping job...', nJobid);
        const jobDetail = await this.fileInfo.getJobDetail(nJobid);
        jobDetail.nUPid = nUPid;
        jobDetail.nUDid = nUDid;
        try {
            this.utility.emit({ event: 'ZIP-DETAIL', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            try {
                this.logService.info(`ZIP-DETAIL identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            console.log('Open zip file', new Date());
            const ResFromOpenZip = await zipService.openZipFile(jobDetail.cPath);
            if (!ResFromOpenZip) {
                try {
                    this.sendNotification(jobDetail, false);
                    this.logService.error(`ZIP-OPEN-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
                }
                catch (error) {
                }
                this.utility.emit({ event: 'ZIP-OPEN-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
                zipService.failedTask(nJobid, jobDetail);
                console.log('Error opening zip file');
                return;
            }
            console.log('Read zip file', new Date());
            try {
                zipService.files = await zipService.readFiles();
            }
            catch (error) {
                try {
                    this.sendNotification(jobDetail, false);
                    this.logService.error(`ZIP-READ-failed : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
                }
                catch (error) {
                }
            }
            try {
                this.logService.info(`ZIP-READ-SUCCESS : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'ZIP-READ-SUCCESS', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            console.log('Read zip file', zipService.files.length);
            await zipService.formateData(zipService.files);
            try {
                this.logService.info(`ZIP-FORMATE-SUCCESS : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'ZIP-FORMATE-SUCCESS', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            console.log('Zip result length', zipService.result.length);
            if (!zipService.result.length) {
                zipService.failedTask(nJobid, jobDetail);
                try {
                    this.logService.error(`ZIP-NO-FORMATES : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
                }
                catch (error) {
                }
                this.utility.emit({ event: 'ZIP-NO-FORMATES', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
                console.log('No files found in zip result');
                return;
            }
            const responce = await this.fileInfo.saveBundle(jobDetail, zipService.result);
            if (!responce.length) {
                zipService.failedTask(nJobid, jobDetail);
                try {
                    this.logService.error(`ZIP-BUNDLE-SAVE-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
                }
                catch (error) {
                }
                this.utility.emit({ event: 'ZIP-BUNDLE-SAVE-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
                console.log('No files found in responce');
                return;
            }
            try {
                this.logService.info(`ZIP-BUNDLE-SAVE : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'ZIP-BUNDLE-SAVE', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            zipService.totalTasks = responce.length;
            zipService.sendReport(jobDetail);
            try {
                this.logService.info(`Files found in zip : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid} length : ${responce.length}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            console.log('Files found in zip:', responce.length);
            let resOfExtraction = await zipService.extrationIndividual(jobDetail, responce);
            if (!resOfExtraction) {
                try {
                    this.logService.error(`failed at extraction : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}  no extraition found`, `upload/${nUPid}/${identifier}`);
                }
                catch (error) {
                }
                zipService.failedTask(nJobid, jobDetail);
                console.log('failed at extraction');
                return;
            }
            try {
                zipService.zipFile.close();
            }
            catch (error) {
            }
            await zipService.saveFinal(nJobid, jobDetail, true);
            console.log('All files extracted successfully!', this.start, this.end = new Date(), zipService.movedFiles.length);
            try {
                this.logService.info(`All files extracted successfully : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'ZIP-COMPLETE', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            this.sendNotification(jobDetail, true);
            const zippath = `${this.config.get('ASSETS')}${jobDetail.cPath}`;
            try {
                await fs.unlink(zippath);
                this.logService.info(`Successfully deleted file: ${zippath}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.logService.info(`File not found, skipping deletion: ${zippath}`, `upload/${nUPid}/${identifier}`);
                }
                else {
                    this.logService.error(`Error deleting file: ${zippath}`, `upload/${nUPid}/${identifier}`);
                }
            }
        }
        catch (error) {
            this.sendNotification(jobDetail, false);
            try {
                this.logService.error(`ZIP-FAILED : identifier: ${jobDetail.identifier}, ${nJobid}, nMasterid: ${jobDetail.nUserid} ${error.message}`, `upload/${nUPid}/${identifier}`);
            }
            catch (error) {
            }
            this.utility.emit({ event: 'ZIP-FAILED', data: { identifier: jobDetail.identifier, nJobid, nMasterid: jobDetail.nUserid } });
            console.log('error at final ', error);
            zipService.failedTask(nJobid, jobDetail);
        }
    }
    async sendNotification(jobDetail, status) {
    }
};
exports.UnzipProcessor = UnzipProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], UnzipProcessor.prototype, "handleUnzip", null);
exports.UnzipProcessor = UnzipProcessor = __decorate([
    (0, bull_1.Processor)('unzip-process'),
    __metadata("design:paramtypes", [typeof (_a = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof core_1.ModuleRef !== "undefined" && core_1.ModuleRef) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _e : Object])
], UnzipProcessor);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZipService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const yauzl = __webpack_require__(53);
const uuid_1 = __webpack_require__(54);
const async = __webpack_require__(55);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const utility_service_1 = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
const convert_service_1 = __webpack_require__(56);
const ocr_service_1 = __webpack_require__(83);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
const filecopy_service_1 = __webpack_require__(57);
const moveto_s3_service_1 = __webpack_require__(85);
let ZipService = class ZipService {
    constructor(config, fileVerificationService, fileInfo, utility, logService, convertService, ocrService, fileService, fileCopyQueue, movetos3) {
        this.config = config;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.utility = utility;
        this.logService = logService;
        this.convertService = convertService;
        this.ocrService = ocrService;
        this.fileService = fileService;
        this.fileCopyQueue = fileCopyQueue;
        this.movetos3 = movetos3;
        this.result = [];
        this.files = [];
        this.movedFiles = [];
        this.totalTasks = 0;
        this.completedTasks = 0;
        this.failedTasks = 0;
        this.pendingTasks = 0;
        this.zipUpdateBatch = this.config.get('ZIP_STATUS_UPDATE_BATCH') || 200;
        this.queue = async.queue(this.processTask.bind(this), 5);
    }
    openZipFile(zipPath) {
        return new Promise((resolve, reject) => {
            yauzl.open(`${this.config.get('ASSETS')}${zipPath}`, { lazyEntries: true, autoClose: false }, (err, zipfl) => {
                if (err) {
                    resolve(false);
                }
                this.zipFile = zipfl;
                resolve(true);
            });
        });
    }
    async readFiles() {
        let folders = [];
        let files = [];
        return new Promise((resolve, reject) => {
            this.zipFile.readEntry();
            this.zipFile.on('entry', (entry) => {
                if (/\/$/.test(entry.fileName)) {
                }
                else {
                    files.push({ path: entry.fileName, entry: entry });
                }
                this.zipFile.readEntry();
            });
            this.zipFile.on('end', () => {
                resolve(files);
            });
        });
    }
    async formateData(res) {
        let idCounter = 1;
        let result = [];
        const itemsMap = new Map();
        try {
            res.forEach((e) => {
                let path = e.path;
                const components = path.split('/');
                let parentId = null;
                components.forEach((component, index) => {
                    const isLastComponent = index === components.length - 1;
                    const isFolder = !isLastComponent;
                    let itemKey = `${parentId}-${component}`;
                    if (!itemsMap.has(itemKey)) {
                        itemsMap.set(itemKey, idCounter);
                        let prtId = null;
                        if (parentId) {
                            let ojs = result.find((m) => m.ids == parentId);
                            if (ojs) {
                                prtId = ojs.id;
                            }
                        }
                        result.push({
                            id: (0, uuid_1.v4)(),
                            ids: idCounter,
                            isFolder: isFolder,
                            name: component,
                            parentId: prtId,
                            path: path,
                        });
                        idCounter++;
                    }
                    parentId = itemsMap.get(itemKey);
                });
            });
        }
        catch (error) {
            console.log('Error at reading formate file');
        }
        this.result = result;
        return result;
    }
    async processTask(task, callback) {
        const { jobDetail, item } = task;
        try {
            this.logService.info(`Task processed  ${item?.path}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        }
        catch (error) {
        }
        try {
            await this.performTask(jobDetail, item);
            this.completedTasks++;
        }
        catch (error) {
            this.logService.error(`Task process failed  ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.failedTasks++;
            this.responseFile(jobDetail, 'F', item, error);
        }
        finally {
            this.logService.info(`Task complete  `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            this.pendingTasks--;
        }
    }
    generateTasks(jobDetail, result) {
        const tasks = [];
        result.forEach((item) => {
            tasks.push({ jobDetail, item });
        });
        return tasks;
    }
    async extrationIndividual(jobDetail, result) {
        this.logService.info(`Extration start `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        const tasks = this.generateTasks(jobDetail, result);
        this.logService.info(`Task Generated  ${tasks?.length}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        return new Promise((resolve, reject) => {
            if (tasks.length) {
                this.totalTasks = tasks.length;
                this.queue.push(tasks);
                this.startQueueReporting(jobDetail);
                this.queue.drain(() => {
                    this.clearLogAction();
                    this.logService.info(`All Queue Complete `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    resolve(true);
                });
                this.queue.error((error, task) => {
                    this.clearLogAction();
                    console.error('Error executing task:', error, task);
                    this.logService.error(`Failed in queue ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                });
            }
            else {
                this.clearLogAction();
                resolve(false);
            }
        });
    }
    clearLogAction() {
        clearInterval(this.intervalOfqueue);
    }
    startQueueReporting(jobDetail) {
        this.clearLogAction();
        this.intervalOfqueue = setInterval(() => {
            this.sendReport(jobDetail);
        }, 5000);
    }
    sendReport(jobDetail) {
        try {
            this.logService.info(`ZIP-REPORT : identifier: ${jobDetail.identifier}, ${jobDetail.nJobid}, nMasterid: ${jobDetail.nUserid}   otalTasks: ${this.totalTasks}, completedTasks: ${this.completedTasks}, failedTasks: ${this.failedTasks}, pendingTasks: ${this.pendingTasks}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        }
        catch (error) {
        }
        this.utility.emit({ event: 'ZIP-REPORT', data: { identifier: jobDetail.identifier, nJobid: jobDetail.nJobid, nMasterid: jobDetail.nUserid, totalTasks: this.totalTasks, completedTasks: this.completedTasks, failedTasks: this.failedTasks, pendingTasks: this.pendingTasks } });
    }
    async failedTask(nJobid, jobDetail) {
        console.log('Failed task ', nJobid);
        try {
            this.logService.info(`Failed task :  ${nJobid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        }
        catch (error) {
            console.log(error);
        }
        try {
            this.zipFile.close();
        }
        catch (error) {
            console.log('Failed to close zip file', error);
        }
        await this.fileInfo.jobFailed(nJobid);
        return true;
    }
    async performTask(jobDetail, item) {
        return new Promise(async (resolve, reject) => {
            this.zipFile;
            let entry = await this.findEntry(item.path);
            try {
                this.logService.info(`Perform task :  ${this.config.get('ASSETS')} ${item.cSavepath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            }
            catch (error) {
            }
            if (!item.cSavepath) {
                try {
                    this.logService.error(`Moving failed file path not found :${item.path}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                }
                catch (error) {
                }
                resolve(false);
            }
            let Fpath = path.resolve(this.config.get('ASSETS'), item.cSavepath);
            if (entry) {
                try {
                    this.logService.info(`Moving file :  ${Fpath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                }
                catch (error) {
                }
                const success = await this.movefiles(entry, jobDetail, Fpath);
                if (success) {
                    let nativePath;
                    if (jobDetail.converttype == 'B') {
                        nativePath = item.cSavepath;
                    }
                    const c_status = await this.movetos3.MovingToS3(jobDetail, jobDetail.converttype, item, Fpath, jobDetail.converttype == 'C' ? item.cSavepath : null);
                    this.responseFile(jobDetail, jobDetail?.verificationResult?.isValidate ? 'C' : 'V', item);
                    if (jobDetail.converttype == 'B') {
                        await this.movetos3.MovingToS3(jobDetail, 'C', item, Fpath, nativePath, true);
                    }
                    resolve(true);
                }
                else {
                    this.responseFile(jobDetail, 'F', item);
                    resolve(false);
                }
            }
            else {
                try {
                    this.logService.error(`Entry not found :  ${Fpath}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                }
                catch (error) {
                }
                resolve(false);
                console.log('Entry not found');
            }
        });
    }
    async wait(tm) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, tm);
        });
    }
    async movefiles(entry, jobDetail, outputDirectory) {
        return new Promise((resolve, reject) => {
            this.zipFile.openReadStream(entry, (err, readStream) => {
                if (err) {
                    try {
                        this.logService.error(`(openReadStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    }
                    catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                    return;
                }
                const writeStream = fs.createWriteStream(outputDirectory);
                readStream.pipe(writeStream);
                writeStream.on('close', () => {
                    resolve(true);
                });
                readStream.on('error', (err) => {
                    try {
                        this.logService.error(`(readStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    }
                    catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                });
                writeStream.on('error', (err) => {
                    try {
                        this.logService.error(`(writeStream) FAILED TO MOVE ${outputDirectory} :  ${JSON.stringify(err)}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    }
                    catch (error) {
                        console.log(error);
                    }
                    console.log('FAILED TO MOVE', err);
                    resolve(false);
                });
            });
        });
    }
    async findEntry(path) {
        let res = this.files.find((a) => a.path.toLowerCase() === path.toLowerCase());
        return res ? res.entry : false;
    }
    async responseFile(jobDetail, status, item, error) {
        console.log(`File move ${status == 'C' ? 'completed' : 'failed'}`, error);
        this.movedFiles.push(Object.assign(item, { cStatus: status }));
        try {
            this.logService.info(`File move ${status == 'C' ? 'completed' : 'failed'} ${this.completedTasks}/${this.totalTasks} , ${error}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
        }
        catch (error) {
        }
        if (this.movedFiles?.length >= this.zipUpdateBatch) {
            const movedFiles = [...this.movedFiles];
            this.movedFiles = [];
            this.saveFinal(jobDetail.nJobid, jobDetail, false, movedFiles);
        }
    }
    async saveFinal(nJobid, jobDetail, bIsFinal, movedFiles) {
        try {
            const files = movedFiles || this.movedFiles;
            let listdata = files.map((e) => {
                return {
                    nBundledetailid: e.nBundledetailid,
                };
            });
            let list = files.map((e) => {
                return {
                    nBundledetailid: e.nBundledetailid,
                    status: e.status,
                    isValidate: e.isValidate,
                    totalpages: e.totalpages,
                    totalsizeoffile: e.totalsizeoffile,
                    pagerotation: e.pagerotation ? e.pagerotation : "0"
                };
            });
            return await this.fileInfo.finalUpdate({
                nJobid: nJobid,
                jFiles: JSON.stringify(list),
                cIsFinal: bIsFinal ? 'Y' : 'N'
            });
        }
        catch (error) {
            return await this.failedTask(nJobid, jobDetail);
        }
    }
};
exports.ZipService = ZipService;
exports.ZipService = ZipService = __decorate([
    (0, common_1.Injectable)(),
    __param(8, (0, bull_2.InjectQueue)('filecopy-process')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _b : Object, typeof (_c = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object, typeof (_e = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _e : Object, typeof (_f = typeof convert_service_1.ConvertService !== "undefined" && convert_service_1.ConvertService) === "function" ? _f : Object, typeof (_g = typeof ocr_service_1.OcrService !== "undefined" && ocr_service_1.OcrService) === "function" ? _g : Object, typeof (_h = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _h : Object, typeof (_j = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _j : Object, typeof (_k = typeof moveto_s3_service_1.MovetoS3Service !== "undefined" && moveto_s3_service_1.MovetoS3Service) === "function" ? _k : Object])
], ZipService);


/***/ }),
/* 53 */
/***/ ((module) => {

module.exports = require("yauzl");

/***/ }),
/* 54 */
/***/ ((module) => {

module.exports = require("uuid");

/***/ }),
/* 55 */
/***/ ((module) => {

module.exports = require("async");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConvertService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
const path_1 = __webpack_require__(13);
const fs_1 = __webpack_require__(14);
const child_process_1 = __webpack_require__(37);
const utility_service_1 = __webpack_require__(19);
const filecopy_service_1 = __webpack_require__(57);
const MsgReader_1 = __webpack_require__(63);
const decompressrtf_1 = __webpack_require__(75);
const rtf_stream_parser_1 = __webpack_require__(76);
const iconvLite = __webpack_require__(67);
const cheerio = __webpack_require__(77);
const puppeteer = __webpack_require__(78);
const path = __webpack_require__(13);
const log_service_1 = __webpack_require__(15);
const client_s3_1 = __webpack_require__(62);
const email_service_1 = __webpack_require__(79);
let ConvertService = class ConvertService {
    constructor(utility, config, fileVerificationService, fileInfo, logService, filecopyService, emailS, convertQueue, convertEmailQueue, fileDeleteQueue) {
        this.utility = utility;
        this.config = config;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.logService = logService;
        this.filecopyService = filecopyService;
        this.emailS = emailS;
        this.convertQueue = convertQueue;
        this.convertEmailQueue = convertEmailQueue;
        this.fileDeleteQueue = fileDeleteQueue;
        this.ports = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011',
            '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021',
            '2022', '2023', '2024', '2025', '2026'
        ];
        this.currentPortIndex = 0;
        this.convertFilePath = this.config.get('PY_CONVERT');
        this.pythonV = this.config.get('pythonV');
        this.saveDir = 'doc/';
        const startfrom = this.config.get('CONVERT_START_PORT');
        const lenght = this.config.get('CONVERT_PORT_LENGTH');
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
    async fileConvert(body) {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.nCaseid = body.nCaseid;
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();
        this.handleConvert(data);
        return { msg: 1 };
    }
    async handleConvert(data) {
        try {
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'P' } });
            const { filetype, name, nBundledetailid, nMasterid } = data;
            this.convertLog(nMasterid, nBundledetailid, 0, 'P');
            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
            console.log('download file', inputPath);
            let result = await this.downloadFileToDisk('etabella', input, inputPath);
            console.log('Download result', result);
            if (!result) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                this.convertLog(nMasterid, nBundledetailid, 0, 'F', 'File Download Failed');
                return;
            }
            console.log('Download result', result);
            if (!await this.fileExists(inputPath)) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                this.convertLog(nMasterid, nBundledetailid, null, 'F', 'File not found');
                console.error('File not found:', inputPath);
                return false;
            }
            console.log('Converting file:', inputPath, outputPath);
            const conversionResult = await this.convertFile(data.nBundledetailid, inputPath, outputPath, data.nBundledetailid, data.nMasterid, data.nCaseid, { nBundledetailid, nUDid: null, cPath: data.cPath, nSectionid: data.nSectionid });
            if (!conversionResult) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return false;
            }
            console.log('File has been converted successfully');
            if (!await this.fileExists(outputPath)) {
                console.log('File not Exist at', outputPath);
                return false;
            }
            try {
                await fs_1.promises.rm(inputPath, { recursive: true });
            }
            catch (e) { }
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'V' } });
            const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
            console.log('Verification complete:', verificationResult);
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'VS' } });
            const stats = await fs_1.promises.stat(outputPath);
            const fileSize = stats.size;
            let filename = data.cFilename;
            filename = filename.replace(/\.[^/.]+$/, '.pdf');
            const fileInfo = {
                nMasterid: data.nMasterid,
                cFilename: filename,
                nSectionid: null,
                nBundleid: null,
                nBundledetailid: nBundledetailid,
                cFiletype: 'PDF',
                isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                cPath: output,
                cFilesize: fileSize.toString(),
                nPagerotation: verificationResult.pagerotation,
                cPage: `1-${verificationResult.totalpages}`,
                bisTranscript: false
            };
            let res = await this.fileInfo.updateConvertFileInfo(fileInfo);
            console.log('result', res);
            if (res) {
                try {
                    if (res && res['cOldpath'] && res['cOldpath'] != '') {
                        this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] });
                    }
                }
                catch (error) {
                    console.log('Error in fileDeleteQueue:', error);
                }
                await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'S', cPath: output, cFilename: filename, cFiletype: 'PDF', cPage: `1-${verificationResult.totalpages}` } });
            }
            else {
            }
        }
        catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
    }
    async downloadFileToDisk(bucketName, fileKey, resolvedPath) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
            });
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                console.error('File body is empty');
                return false;
            }
            const streamToBuffer = (stream) => {
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };
            const buffer = await streamToBuffer(response.Body);
            const folderPath = (0, path_1.resolve)(resolvedPath, '..');
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
            }
            console.log('File write:', resolvedPath);
            (0, fs_1.writeFileSync)(resolvedPath, buffer);
            console.log('File write success:', resolvedPath);
            return true;
        }
        catch (error) {
            console.error('Error downloading file to disk:', error.message);
            return false;
        }
    }
    async filedataProcess(item1, item, nBundledetailid, outputPath, output, isValidUpdate, isConvert = true) {
        const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
        const stats = await fs_1.promises.stat(outputPath);
        const fileSize = stats.size;
        let filename = item.cFilename || item.name;
        if (isConvert) {
            filename = filename.replace(/\.[^/.]+$/, '.pdf');
        }
        const fileInfo = {
            nMasterid: item.nUserid,
            cFilename: filename,
            nSectionid: item.nSectionid,
            nBundleid: item.nParentbundleid,
            nBundledetailid: nBundledetailid,
            cFiletype: isConvert ? 'PDF' : output.split('.').pop()?.toUpperCase(),
            isValidate: isValidUpdate ? verificationResult.isValidate ? verificationResult.isValidate : false : false,
            cPath: output,
            cFilesize: fileSize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: (item.bisTranscript ? item.bisTranscript : false),
        };
        let res = await this.fileInfo.updateConvertFileInfo(fileInfo);
        let isComplete = false;
        if (res.msg == 1) {
            try {
                if (res && res['cOldpath'] && res['cOldpath'] != '') {
                    this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] });
                }
            }
            catch (error) {
            }
            item1.nNewBundledetailid = res.nBundledetailid;
            item1.cSavepath = output;
            isComplete = true;
        }
        else {
            isComplete = false;
        }
    }
    async convertFile(nBundledetailid, inputFile, outputFile, identifier, nMasterid, nCaseid, filedata) {
        if (!(/\.(msg)$/i.test(inputFile.toLowerCase()))) {
            const res = await this.convertToPdf(inputFile, outputFile, identifier, nMasterid, filedata.cFilename, filedata.nUPid, { nBundledetailid, nUDid: filedata.nUDid });
            return res;
        }
        else {
            let res = await this.convertEmail(nCaseid, nBundledetailid, inputFile, outputFile, filedata);
            return res;
        }
    }
    async convertToPdf(inputFile, outputFile, identifier, nMasterid, cFilename, nUPid, cnvdata) {
        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'S');
        try {
            const port = await this.getNextPort();
            return new Promise((resolve, reject) => {
                const pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.convertFilePath, inputFile, outputFile, port, nUPid ? nUPid : identifier]);
                pythonProcess.stdout.on('data', (data) => {
                    const message = data.toString().trim();
                    console.log('STDOUT:', message);
                    if (message.startsWith('Progress:')) {
                        this.utility.emit({ event: 'CONVERTING-PROGRESS', data: { identifier, nMasterid, nCaseid: cnvdata.nCaseid, nProgress: message.split(' ')[1], filename: cFilename } });
                    }
                });
                pythonProcess.stderr.on('data', (data) => {
                    try {
                        console.error('STDERR:', data.toString());
                    }
                    catch (error) {
                        console.error(error);
                    }
                });
                pythonProcess.on('close', (code) => {
                    this.logService.info(`Task processed - convert close ${inputFile} to ${outputFile} code ${code}`, `upload/${nUPid}/${identifier}`);
                    pythonProcess.kill('SIGKILL');
                    if (code === 0) {
                        console.log('Convert Success');
                        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'C');
                        resolve(true);
                    }
                    else {
                        this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'F');
                        console.log('Convert Failed');
                        resolve(false);
                    }
                });
                pythonProcess.on('error', (error) => {
                    this.logService.info(`Task processed - convert error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
                    this.convertLog(nMasterid, cnvdata.nBundledetailid, cnvdata.nUDid, 'F', error.toString());
                    resolve(false);
                });
            });
        }
        catch (error) {
            this.logService.info(`Task processed - convert error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
            console.log('convert error', error);
            return false;
        }
    }
    getNextPort() {
        const port = this.ports[this.currentPortIndex];
        this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
        return port;
    }
    convertLog(nMasterid, nBundledetailid, nUDid, cStatus, cMessage = '') {
        let data = { "nMasterid": nMasterid, "nBundledetailid": nBundledetailid, "nUDid": nUDid, cStatus: cStatus };
        this.fileInfo.convertLog(data);
    }
    async convertEmail(nCaseid, nId, inputFile, outputFile, filedata) {
        console.log('Step 2');
        this.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'S');
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        let dirPath = `doc/case${nCaseid}`;
        const data = { dirPath: dirPath, cPath: filedata.cPath, cOutputpath: outputFile, nId: nId, nCaseid: nCaseid, nSectionid: filedata.nSectionid, nMasterid: filedata.nMasterid };
        const result = await this.emailS.getemailparse(data, filedata.converttype);
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`, `upload/${filedata.nUPid}/${filedata.identifier}`);
        return result;
    }
    async getemailparse(body) {
        console.log('Step 3');
        let filePath = body.cPath;
        let cOutputpath = body.cOutputpath;
        let nBid = body?.nId;
        let nCaseid = body.nCaseid;
        try {
            console.log(filePath, cOutputpath);
            const fileData = (0, fs_1.readFileSync)(filePath);
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
            const dirPath = `${this.saveDir}case${nCaseid}/`;
            let attechments = [];
            try {
                attechments = await this.saveAttachment(msgData, reader, dirPath);
            }
            catch (error) {
                console.error(`Error saving attachments: ${error}`);
            }
            resultText = this.replaceHtmlImg(resultText, attechments, dirPath);
            const email = {
                from: { name: msgData.senderName, email: msgData.sentRepresentinmtpAddress || msgData.lastModifierName || msgData.inetAcctName },
                to: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'to').map((r) => { return { name: r.name, email: r.smtpAddress || r.email }; }) : [],
                cc: msgData.recipients ? msgData.recipients.filter(r => r.recipType == 'cc').map((r) => { return { name: r.name, email: r.smtpAddress || r.email }; }) : [],
                subject: msgData.subject || 'No Subject',
                body: resultText || 'No Body Available',
                attachments: msgData.attachments ? attechments : [],
                date: msgData.creationTime || 'Unknown Date',
            };
            attechments = email.attachments;
            const emailHtml = this.createEmailHtml(email, attechments);
            console.log('Step 3.2');
            let result = await this.createPdfFromHtml(emailHtml, cOutputpath);
            console.log('Step 3.3');
            if (result) {
                return { msg: 1, email: email, attechments };
            }
            else {
                return { msg: -1, error: `Error While generate pdf` };
            }
        }
        catch (error) {
            console.error('Error reading .msg file:', error.message);
            return { msg: -1, error: `Error reading .msg file: ${error.message}` };
        }
    }
    async saveAttachment(msgData, reader, dirpath) {
        console.log('\n\n\n dirpath ', dirpath, '\n\n\n\n');
        let attechments = [];
        try {
            msgData.attachments.forEach(async (attachment, index) => {
                const attachment_file = await reader.getAttachment(attachment);
                console.log('attachment', attachment);
                let cPath = `${dirpath}ac_${new Date().getTime()}.${attachment.fileName.split('.').pop().toUpperCase()}`;
                attechments.push({ cFilename: attachment.fileName, cPath: cPath, dataType: attachment.dataType, data: attachment || null, });
                if (attachment_file.content) {
                    (0, fs_1.writeFileSync)(`${this.config.get('ASSETS')}/${cPath}`, attachment_file.content);
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
    replaceHtmlImg(htmlContent, attechments, attachmentsDir) {
        try {
            let assetsPath = this.config.get('ASSETS');
            const $ = cheerio.load(htmlContent);
            $('style').remove();
            $('img').each(function () {
                const originalSrc = $(this).attr('src');
                try {
                    if (originalSrc && originalSrc.startsWith('cid:')) {
                        const imageName = originalSrc.split('cid:')[1].split('@')[0];
                        const path = attechments.find(e => e.data.pidContentId == imageName || e.cFilename == imageName);
                        if (path) {
                            const newSrc = `${assetsPath}${path.cPath}`;
                            $(this).attr('src', newSrc);
                            console.log(`Replaced ${originalSrc} with ${newSrc}`);
                        }
                    }
                }
                catch (error) {
                }
            });
            return $.html();
        }
        catch (error) {
            console.error('error', error);
            return '';
        }
    }
    createEmailHtml(email, attachments) {
        return `
      <div class="h-full overflow-auto w-full p-3 bg-[#f1f1f1]">
        <div class="email-container">
          <div type="cite">
            <div class="d-flex flex-column gap-2">
              <div>
                <b>From: </b>
                <span class="emailparent">
                  ${email?.from?.name}
                    <a href="mailto:${email?.from?.email}">${email?.from?.email}</a>    
                </span>
              </div>
              
              <div>
                <b>To: </b>
                ${email.to.map((recipient, index) => `
                  <span class="emailparent">
                    ${recipient.name}  <a href="mailto:${recipient.email}">${recipient.email}</a>
                  </span>
                  ${index !== email.to.length - 1 ? ', ' : ''}
                `).join('')}
              </div>

              <div>
                <b>CC: </b>
                ${email.cc.map((recipient, index) => `
                  <span class="emailparent">
                    ${recipient.name}                     
                      <a href="mailto:${recipient.email}">${recipient.email}</a> 
                  </span>
                  ${index !== email.cc.length - 1 ? ', ' : ''}
                `).join('')}
              </div>

              <div>
                <b>Subject: </b>
                <span class="emailparent">${email.subject}</span>
              </div>
            </div>
          </div>

          <hr class="my-4">
          <div class="email-body">${email.body}</div>
        </div>
      </div>
    `;
    }
    getFileExtension(filename) {
        return filename.split('.').pop();
    }
    async createPdfFromHtml(emailHtml, outputPath) {
        let browser;
        const htmlFilePath = `${this.config.get('TMP_PATH')}/temp_${new Date().getTime()}.html`;
        (0, fs_1.writeFileSync)(htmlFilePath, emailHtml);
        try {
            try {
                browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--allow-running-insecure-content',
                    ],
                });
            }
            catch (launchError) {
                console.error('Error launching Puppeteer:', launchError.stack || launchError.message);
                return false;
            }
            const page = await browser.newPage();
            const encodedPath = encodeURI(`file://${htmlFilePath}`);
            await page.goto(encodedPath, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            const outputDir = path.dirname(outputPath);
            await fs_1.promises.mkdir(outputDir, { recursive: true });
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '2cm',
                    right: '1.5cm',
                    bottom: '1.5cm',
                    left: '2cm',
                }
            });
            (0, fs_1.unlinkSync)(htmlFilePath);
            console.log('PDF created successfully:', outputPath);
            return true;
        }
        catch (error) {
            console.error('Error creating PDF:', error);
            return false;
        }
        finally {
            if (browser) {
                await browser.close();
                return true;
            }
        }
    }
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async convertfile_multi(body) {
        try {
            const data = await this.fileInfo.convert_fileDataMulti(body);
            if (!data || !data.length) {
                return {
                    msg: 0,
                    value: 'No files found',
                    error: 'Files not found in the system'
                };
            }
            const convertPromises = data.map(async (item) => {
                const enrichedItem = {
                    ...item,
                    nMasterid: body.nMasterid,
                    nCaseid: body.nCaseid,
                    converttype: body.cConvertType,
                    bMetadata: body.bMetadata,
                    name: item.cPath.split('/').pop().replace(`.${item.cPath.split('.').pop()}`, ''),
                    filetype: item.cPath.split('.').pop()?.toLowerCase() || ''
                };
                const logData = {
                    nMasterid: body.nMasterid,
                    nBundledetailid: item.nBundledetailid,
                    nUDid: 0,
                    cStatus: 'P'
                };
                try {
                    await this.fileInfo.convertLog(logData);
                }
                catch (error) {
                    console.error(`Failed to log conversion for bundle ${item.nBundledetailid}:`, error);
                }
                const queueOptions = {
                    removeOnComplete: true,
                    removeOnFail: true,
                    timeout: 1000 * 60 * 60,
                    attempts: 3,
                    backoff: 1000 * 60 * 5
                };
                const jobData = {
                    cPath: item.cPath,
                    nCaseid: body.nCaseid,
                    data: enrichedItem,
                    nBundledetailid: item.nBundledetailid
                };
                if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg',
                    'png', 'bmp', 'gif', 'tiff', 'zip'].includes(enrichedItem.filetype)) {
                    console.log('doc add in queue');
                    await this.convertQueue.add(jobData, queueOptions);
                }
                else if (['msg'].includes(enrichedItem.filetype.toLowerCase())) {
                    console.log('Email add in queue');
                    await this.convertEmailQueue.add(jobData, queueOptions);
                }
                else {
                    console.warn(`Unsupported file type: ${enrichedItem.filetype}`);
                }
            });
            await Promise.all(convertPromises);
            return {
                msg: 1,
                value: `${data.length} file(s) queued for conversion`,
                error: null
            };
        }
        catch (error) {
            console.error('File conversion error:', error);
            return {
                msg: 0,
                value: 'File conversion failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getQueueLength(nCaseid) {
        const jobs = await this.convertQueue.getJobs(['waiting', 'active', 'delayed']);
        let jobs2 = await this.convertEmailQueue.getJobs(['waiting', 'active', 'delayed']);
        const filteredJobs = jobs && jobs.length ? jobs.filter((job) => job.data.nCaseid === nCaseid) : [];
        const filteredJobs2 = jobs2 && jobs2.length ? jobs2.filter((job) => job.data.nCaseid === nCaseid) : [];
        return (filteredJobs.length ? filteredJobs.length : 0) + (filteredJobs2.length ? filteredJobs2.length : 0);
    }
};
exports.ConvertService = ConvertService;
exports.ConvertService = ConvertService = __decorate([
    (0, common_1.Injectable)(),
    __param(7, (0, bull_2.InjectQueue)('convert')),
    __param(8, (0, bull_2.InjectQueue)('convert-email')),
    __param(9, (0, bull_2.InjectQueue)('delete-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _c : Object, typeof (_d = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _d : Object, typeof (_e = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _e : Object, typeof (_f = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _f : Object, typeof (_g = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _g : Object, typeof (_h = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _h : Object, typeof (_j = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _j : Object, typeof (_k = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _k : Object])
], ConvertService);


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
exports.filecopyService = void 0;
const common_1 = __webpack_require__(3);
const stream_1 = __webpack_require__(58);
const upload_service_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(37);
const util_1 = __webpack_require__(59);
const log_service_1 = __webpack_require__(15);
const fsp = __webpack_require__(60);
const db_service_1 = __webpack_require__(20);
const file_version_service_1 = __webpack_require__(61);
const queue_manage_service_1 = __webpack_require__(25);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
let filecopyService = class filecopyService {
    constructor(upload, config, logService, db, fileVersion, queueManage) {
        this.upload = upload;
        this.config = config;
        this.logService = logService;
        this.db = db;
        this.fileVersion = fileVersion;
        this.queueManage = queueManage;
        this.ASSETS_PATH = this.config.get('S3_SYNC_PATH');
        this.S3_BUCKET_PATH = this.config.get('S3_BUCKET_PATH');
        this.S3_EXC_PATH = this.config.get('S3_EXC_PATH');
        this.PYTHON_V = this.config.get('pythonV');
        this.logApp = 'upload/copyfiles';
        this.logger = new common_1.Logger('file-copy');
    }
    async copyFile(oldPath, convertType, nativePath, nBundledetailid, persistFirstVersion, nTCatid, appName, nUPid, cFromPath) {
        const fromPath = cFromPath || `${this.ASSETS_PATH}${oldPath}`;
        const toPath = `${this.S3_BUCKET_PATH}${oldPath}`;
        appName = appName ? appName : this.logApp;
        try {
            const copyCommand = `${this.S3_EXC_PATH} put ${fromPath} ${toPath}`;
            await execPromise(copyCommand);
            console.log(`File copied from ${fromPath}  to ${toPath}`);
            this.logService.info(`File copied from ${fromPath}  to ${toPath}`, appName);
            await this.removeUpdateVersion(nBundledetailid, oldPath, appName, persistFirstVersion);
            try {
                if (convertType != 'B') {
                    try {
                        if (this.isPdfFile(oldPath)) {
                        }
                    }
                    catch (error) {
                        this.logService.error(` failed to move elasticfile extraction: ${this.ASSETS_PATH + oldPath}`, this.logApp);
                    }
                    await fsp.unlink(this.ASSETS_PATH + oldPath);
                    this.logService.info(`Successfully deleted file: ${this.ASSETS_PATH + oldPath}`, appName);
                }
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.logService.error(`File not found, skipping deletion: ${this.ASSETS_PATH + oldPath}`, appName);
                }
                else {
                    this.logService.error(`Error deleting file: ${this.ASSETS_PATH + oldPath}`, appName);
                }
            }
            try {
                if (convertType == 'C' && nativePath) {
                    await fsp.unlink(this.ASSETS_PATH + nativePath);
                    this.logService.info(`Successfully deleted native file: ${this.ASSETS_PATH + nativePath}`, appName);
                }
            }
            catch (error) {
            }
        }
        catch (error) {
            console.error('Error during file move:', error);
            this.logService.error(`Error during file move: ${JSON.stringify(error)}`, appName);
        }
        return true;
    }
    async removeAllOldversion(nBundledetailid, s3Path, persistFirstVersion) {
        try {
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp);
                return;
            }
            await this.fileVersion.removeOldVersion(s3Path, persistFirstVersion);
            return;
        }
        catch (error) {
        }
    }
    async updateFileVersion(nBundledetailid, s3Path, nTCatid) {
        try {
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', this.logApp);
                return;
            }
            const version = await this.fileVersion.getFirstVersion(s3Path);
            if (!version) {
                this.logService.error('nBundledetailid version not found', this.logApp);
                return { msg: -1 };
            }
            let res = await this.db.executeRef('upload_update_version', { version: version, nBundledetailid, nTCatid });
            if (res.success) {
                return res.data[0][0];
            }
            else {
                this.logService.error(res.error, this.logApp);
                return { msg: -1 };
            }
        }
        catch (error) {
            return { msg: -1 };
        }
    }
    async removeUpdateVersion(nBundledetailid, s3Path, appName, persistFirstVersion) {
        try {
            if (!nBundledetailid) {
                this.logService.error('nBundledetailid not found for update version', appName);
                return;
            }
            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, appName);
                return;
            }
            try {
                const versions = await this.fileVersion.getAllVersions(s3Path);
                this.logService.info(`Total number of version are ${versions.length}`, appName);
                this.logger.verbose('Version length', versions.length);
                if (!versions || !versions.length) {
                    this.logService.error(`${s3Path} version not found`, appName);
                    return;
                }
                const fVersion = versions[0];
                const lVersion = this.getMaxVersion(versions);
                try {
                    let res = await this.db.executeRef('upload_update_version', { cLVer: lVersion?.VersionId || null, cFVer: fVersion?.VersionId, nBundledetailid });
                    if (res.success) {
                        if (res.data[0].length) {
                            this.logger.verbose(`$File Version Updateed for ${nBundledetailid}`);
                            this.logService.info(`File Version Updateed for ${nBundledetailid}`, appName);
                        }
                    }
                    else {
                        this.logger.verbose(`$File Version Update failed for ${nBundledetailid}`);
                        this.logService.error(res.error, appName);
                    }
                }
                catch (error) {
                    this.logger.error(`${error.message}${nBundledetailid}`);
                    this.logService.error(error.message, appName);
                }
                const trash_versions = this.getTrashVersions(versions) || [];
                if (trash_versions.length == 0) {
                    this.logger.verbose(`No version Found for ${nBundledetailid}`);
                    this.logService.info(`No version that will be deleted of ${nBundledetailid}`, appName);
                    return;
                }
                const remainingVersionsIds = trash_versions.map(e => e?.VersionId) || [];
                this.logger.verbose('remainingVersionsIds', remainingVersionsIds);
                this.logService.info(`Number of versions that will be deleted of ${nBundledetailid} are ${remainingVersionsIds.length}`, appName);
                await Promise.all(remainingVersionsIds.map(async (versionId) => {
                    await this.deleteWithRetry(versionId, s3Path, appName);
                }));
                this.logService.info(`All deletions attempted for ${nBundledetailid}`, appName);
            }
            catch (error) {
                this.logService.error('Error in handleFileVersion: ' + error, appName);
            }
        }
        catch (error) {
            this.logService.error('Error in remove and Update Version: ' + error, appName);
        }
    }
    isPdfFile(path) {
        try {
            return path.split('.').pop().toLowerCase() == 'pdf';
        }
        catch (error) {
            return false;
        }
    }
    getMaxVersion(versions) {
        try {
            return versions.length > 1 ? versions[versions.length - 1] : null;
        }
        catch (error) {
            return null;
        }
    }
    getTrashVersions(versions) {
        try {
            return versions.slice(1, -1);
        }
        catch (error) {
            return [];
        }
    }
    async deleteWithRetry(versionId, s3Path, appName, retry = 0, maxRetries = 5) {
        try {
            await this.fileVersion.deleteSpecificVersion(versionId, s3Path);
            this.logService.info(`Version ${versionId} deleted successfully`, appName);
        }
        catch (error) {
            if (retry >= maxRetries) {
                this.logService.error(`Failed to delete version ${versionId} after ${maxRetries} attempts`, appName);
                return;
            }
            this.logService.info(`Retrying delete for version ${versionId} (Attempt ${retry + 1})`, appName);
            await this.deleteWithRetry(versionId, s3Path, appName, retry + 1, maxRetries);
        }
    }
};
exports.filecopyService = filecopyService;
exports.filecopyService = filecopyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _d : Object, typeof (_e = typeof file_version_service_1.FileVersionService !== "undefined" && file_version_service_1.FileVersionService) === "function" ? _e : Object, typeof (_f = typeof queue_manage_service_1.QueueManageService !== "undefined" && queue_manage_service_1.QueueManageService) === "function" ? _f : Object])
], filecopyService);


/***/ }),
/* 58 */
/***/ ((module) => {

module.exports = require("stream");

/***/ }),
/* 59 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 60 */
/***/ ((module) => {

module.exports = require("fs/promises");

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
exports.FileVersionService = void 0;
const common_1 = __webpack_require__(3);
const child_process_1 = __webpack_require__(37);
const util_1 = __webpack_require__(59);
const log_service_1 = __webpack_require__(15);
const config_1 = __webpack_require__(6);
const client_s3_1 = __webpack_require__(62);
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
    async removeOldVersion(s3Path, persistFirstVersion) {
        try {
            console.log('Fetching veriosn', s3Path);
            if (!s3Path) {
                this.logService.error(`${s3Path} not found for update version`, this.logApp);
                return;
            }
            const versions = await this.getAllVersion(s3Path, persistFirstVersion);
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
            throw new Error(error.message);
        }
    }
    async getAllVersion(fileKey, persistFirstVersion) {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey}`);
            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);
            if (response.Versions && response.Versions.length > 0) {
                const sortedVersions = response.Versions.sort((a, b) => new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime());
                if (persistFirstVersion) {
                    this.removeOldestEntry(sortedVersions);
                }
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
    removeOldestEntry(entries) {
        if (!Array.isArray(entries) || entries.length === 0)
            return entries;
        const oldestIndex = entries.reduce((oldestIdx, entry, idx, arr) => new Date(entry.LastModified) < new Date(arr[oldestIdx].LastModified) ? idx : oldestIdx, 0);
        entries.splice(oldestIndex, 1);
        return entries;
    }
    async getAllVersions(fileKey) {
        try {
            const bucketName = this.DO_SPACES_BUCKET_NAME;
            const s3Endpoint = this.s3_SPACES_ENDPOINT;
            const getVersionCommand = `aws s3api list-object-versions --bucket ${bucketName} --prefix ${fileKey} --endpoint-url=${s3Endpoint}`;
            console.log(`Fetching versions for: ${fileKey}`);
            const { stdout } = await execPromise(getVersionCommand);
            const response = JSON.parse(stdout);
            if (response.Versions && response.Versions.length > 0) {
                const sortedVersions = response.Versions.sort((a, b) => new Date(a.LastModified).getTime() - new Date(b.LastModified).getTime());
                return sortedVersions;
            }
            else {
                console.log("❌ No versions found.");
                this.logService.info(`No versions found for file: ${fileKey}`, this.logApp);
                return [];
            }
        }
        catch (error) {
            console.error("❌ Error fetching file versions:", error);
            this.logService.error(`Error fetching file versions: ${JSON.stringify(error)}`, this.logApp);
            throw new Error(error.message || error);
        }
    }
};
exports.FileVersionService = FileVersionService;
exports.FileVersionService = FileVersionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], FileVersionService);


/***/ }),
/* 62 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 63 */
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
var const_1 = __importDefault(__webpack_require__(64));
var DataStream_1 = __importDefault(__webpack_require__(66));
var Reader_1 = __webpack_require__(68);
var Burner_1 = __webpack_require__(69);
var utils_1 = __webpack_require__(65);
var EntryStreamParser_1 = __webpack_require__(70);
var VerbStreamParser_1 = __webpack_require__(71);
var TZDEFINITIONParser_1 = __webpack_require__(72);
var TZREGParser_1 = __webpack_require__(73);
var AppointmentRecurParser_1 = __webpack_require__(74);
var AppointmentRecurParser_2 = __webpack_require__(74);
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
/* 64 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var utils_1 = __webpack_require__(65);
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
/* 65 */
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
/* 66 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
var iconv = __webpack_require__(67);
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
/* 67 */
/***/ ((module) => {

module.exports = require("iconv-lite");

/***/ }),
/* 68 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Reader = exports.TypeEnum = void 0;
var DataStream_1 = __importDefault(__webpack_require__(66));
var utils_1 = __webpack_require__(65);
var const_1 = __importDefault(__webpack_require__(64));
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
/* 69 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.burn = void 0;
var Reader_1 = __webpack_require__(68);
var DataStream_1 = __importDefault(__webpack_require__(66));
var const_1 = __importDefault(__webpack_require__(64));
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
/* 70 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var DataStream_1 = __importDefault(__webpack_require__(66));
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
/* 71 */
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
/* 72 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(65);
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
/* 73 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.parse = void 0;
var utils_1 = __webpack_require__(65);
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
/* 74 */
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
/* 75 */
/***/ ((module) => {

module.exports = require("@kenjiuno/decompressrtf");

/***/ }),
/* 76 */
/***/ ((module) => {

module.exports = require("rtf-stream-parser");

/***/ }),
/* 77 */
/***/ ((module) => {

module.exports = require("cheerio");

/***/ }),
/* 78 */
/***/ ((module) => {

module.exports = require("puppeteer");

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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EmailService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const client_s3_1 = __webpack_require__(62);
const path = __webpack_require__(13);
const path_1 = __webpack_require__(13);
const fs_1 = __webpack_require__(14);
const mime = __webpack_require__(80);
const rimraf = __webpack_require__(81);
const util = __webpack_require__(59);
const rimrafPromise = util.promisify(rimraf);
const puppeteer = __webpack_require__(78);
const child_process_1 = __webpack_require__(37);
const updatefileinfo_service_1 = __webpack_require__(38);
const verifypdf_service_1 = __webpack_require__(36);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
const s3_request_presigner_1 = __webpack_require__(82);
const filecopy_service_1 = __webpack_require__(57);
let EmailService = class EmailService {
    constructor(config, fileInfo, fileVerificationService, filecopyService, fileDeleteQueue) {
        this.config = config;
        this.fileInfo = fileInfo;
        this.fileVerificationService = fileVerificationService;
        this.filecopyService = filecopyService;
        this.fileDeleteQueue = fileDeleteQueue;
        this.ASSETS_PATH = this.config.get('S3_SYNC_PATH');
        this.logApp = 'convert';
        this.emailReaderPath = 'assets/pythons/convert/msg_to_html.py';
        this.pythonV = this.config.get('pythonV');
        this.bucketName = this.config.get('DO_SPACES_BUCKET_NAME');
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
    async emailConvert(body) {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();
        const dirPath = `doc/case${body.nCaseid}`;
        const tempFile = path.basename(data.cPath);
        const input = data.cPath;
        let output = tempFile.replace(/\.MSG$/, '.pdf');
        output = output.replace(/\.MSG$/, '.pdf');
        const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
        const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
        const dataf = { dirPath: dirPath, cPath: data.cPath, cOutputpath: outputPath, nId: body.nBundledetailid, nCaseid: body.nCaseid };
        const result = await this.getemailparse(dataf, 'C');
        return { msg: 1 };
    }
    async emailParse(body) {
        let data = await this.fileInfo.get_filedata(body);
        data.nMasterid = body.nMasterid;
        data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
        data.filetype = data.cPath.split('.').pop();
        const dirPath = `doc/case${body.nCaseid}`;
        const tempFile = path.basename(data.cPath);
        const input = data.cPath;
        let output = tempFile.replace(/\.MSG$/, '.pdf');
        output = output.replace(/\.MSG$/, '.pdf');
        const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
        const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
        const dataf = { dirPath: dirPath, cPath: data.cPath, cOutputpath: outputPath, nId: body.nBundledetailid, nCaseid: body.nCaseid };
        const result = await this.getemailparse(dataf, 'N');
        return { msg: 1 };
    }
    async getemailparse(body, convertType) {
        console.log('Step 3');
        let nBid = body?.nId;
        try {
            const tempFile = path.basename(body.cPath);
            let time = new Date().getTime();
            const sessionFolder = path.join(this.config.get('TMP_PATH'), `email_${time}/${nBid}`);
            const tempFilePath = path.join(sessionFolder, tempFile);
            const tempDir = path.dirname(tempFilePath);
            console.log('dir', tempDir);
            if (!(0, fs_1.existsSync)(tempDir)) {
                (0, fs_1.mkdirSync)(tempDir, { recursive: true });
            }
            let outputPath = tempFilePath.replace(/\.MSG$/, '.html');
            outputPath = outputPath.replace(/\.msg$/, '.html');
            const destinationPath = path.join(tempDir, path.basename(body.cPath));
            let filepath = (0, path_1.resolve)(this.config.get('ASSETS'), body.cPath);
            console.log('filepath', filepath);
            if ((0, fs_1.existsSync)(filepath)) {
                console.log(`File exists locally. Copying from ${body.cPath} to ${destinationPath}`);
                (0, fs_1.copyFileSync)(filepath, destinationPath);
            }
            else {
                console.log(`File does not exist locally. Attempting to download to ${tempFilePath}`);
                await this.downloadFileToDisk('etabella', (body.cPath), tempFilePath);
            }
            try {
                const msg_result = await this.readData(tempFilePath, outputPath, nBid, body['dirPath']);
                if (msg_result) {
                    this.uploadFolderToS3(sessionFolder, 'etabella', `${body['dirPath']}/${nBid}`, convertType == 'N');
                    this.fileInfo.converStatus({ nID: body.nId, bIsconvert: convertType == 'N' ? 'V' : 'C' });
                    if (convertType != 'N') {
                        let pdfPath = body.cPath.replace(/\.MSG$/, '.pdf');
                        pdfPath = pdfPath.replace(/\.msg$/, '.pdf');
                        let filepath = (0, path_1.resolve)(this.config.get('ASSETS'), pdfPath);
                        let result = await this.createPdfFromHtml(outputPath, filepath);
                        if (convertType == 'C') {
                            this.deleteFolder('etabella', `${body['dirPath']}/${nBid}`);
                        }
                        if (result) {
                            console.log('pdf genetate result', result);
                            this.deleteFolder('etabella', `${body['dirPath']}/${nBid}`);
                            (0, fs_1.unlinkSync)(tempFilePath);
                            return result;
                        }
                    }
                    else {
                        console.log('reading .msg file:', true);
                        return true;
                    }
                    console.log('Unsync folder:', true);
                    (0, fs_1.unlinkSync)(tempFilePath);
                }
                else {
                    console.log('Error reading .msg file:', false);
                    return false;
                }
            }
            catch (error) {
                console.error('Error reading .msg file:', error.message);
                return false;
            }
        }
        catch (error) {
            console.error('Error reading .msg file:', error.message);
            return false;
        }
    }
    async getFilesFromDirectory(directoryPath) {
        try {
            const files = await fs_1.promises.readdir(directoryPath, { withFileTypes: true });
            return files
                .filter(file => file.isFile())
                .map(file => ({
                cPath: path.join(directoryPath, file.name),
                fileName: file.name,
            }));
        }
        catch (error) {
            console.error('Error reading directory:', error);
            throw error;
        }
    }
    async readData(input, output, nBid, dirPath) {
        return new Promise((resolve, reject) => {
            console.log(this.emailReaderPath, input, output, nBid);
            const pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.emailReaderPath, input, output, nBid, `${this.config.get('ATTACHMENT_URL')}${dirPath}`]);
            pythonProcess.stdout.on("data", (data) => {
                console.log('step 3 res', data.toString().trim());
            });
            pythonProcess.stderr.on("data", (data) => {
                console.log(data.toString().trim());
            });
            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    console.log('step 3 res', code.toString().trim());
                    resolve(true);
                }
                else {
                    console.log('step 3 res', code.toString().trim());
                    resolve(false);
                }
            });
        });
    }
    async createPdfFromHtml(htmlFilePath, outputPath) {
        let browser;
        try {
            if (!htmlFilePath.startsWith('http://') && !htmlFilePath.startsWith('https://')) {
                htmlFilePath = `file://${htmlFilePath}`;
            }
            try {
                new URL(htmlFilePath);
            }
            catch (error) {
                console.error('Invalid URL:', htmlFilePath);
                return false;
            }
            console.log('htmlFilePath', htmlFilePath, outputPath);
            try {
                browser = await puppeteer.launch({
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-web-security',
                        '--allow-running-insecure-content',
                    ],
                });
            }
            catch (launchError) {
                console.error('Error launching Puppeteer:', launchError.stack || launchError.message);
                return false;
            }
            const page = await browser.newPage();
            const encodedPath = `${htmlFilePath.replace(/\\/g, '/')}`;
            await page.goto(encodedPath, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            const outputDir = path.dirname(outputPath);
            await fs_1.promises.mkdir(outputDir, { recursive: true });
            await page.evaluate(() => {
                return Promise.all(Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                })));
            });
            await page.evaluate(() => {
                document.querySelectorAll('.attachments-section').forEach(el => {
                    el.remove();
                });
                const emailDividers = document.querySelectorAll('div[style*="border-top:solid #E1E1E1"]');
                emailDividers.forEach(divider => {
                    divider.classList.add('page-break');
                });
                const wordSections = document.querySelectorAll('div.WordSection1');
                wordSections.forEach((section) => {
                    section.style.setProperty('page', 'auto', 'important');
                });
                const signatureBlocks = document.querySelectorAll('p.MsoNormal[style*="margin-right:22.5pt"]');
                signatureBlocks.forEach(block => {
                    if (block.textContent.includes('Regards,')) {
                        block.closest('div').classList.add('signature-block');
                    }
                });
            });
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '2cm',
                    right: '1.5cm',
                    bottom: '1.5cm',
                    left: '2cm',
                }
            });
            console.log('PDF created successfully:', outputPath);
            return true;
        }
        catch (error) {
            console.error('Error creating PDF:', error);
            return false;
        }
        finally {
            if (browser) {
                await browser.close();
                return true;
            }
        }
    }
    async createPdfFromHtml_old(url, outputPath) {
        console.log('Step 4', url, outputPath);
        let browser;
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = `file://${url}`;
            }
            try {
                new URL(url);
            }
            catch (error) {
                console.error('Invalid URL:', url);
                return false;
            }
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-web-security',
                    '--allow-running-insecure-content',
                    '--disable-features=IsolateOrigins,site-per-process',
                ],
            });
            const page = await browser.newPage();
            await page.evaluate(() => {
                console.log('Header height:', document.querySelector('.header')?.offsetHeight);
                console.log('Body content height:', document.querySelector('.body-content')?.offsetHeight);
                const header = document.querySelector('.header');
                const bodyContent = document.querySelector('.body-content');
                let current = header?.nextElementSibling;
                while (current && current !== bodyContent) {
                    console.log('Intermediate element:', current.tagName, current.className);
                    current = current.nextElementSibling;
                }
            });
            await page.evaluateOnNewDocument(() => {
                document.addEventListener('DOMContentLoaded', () => {
                    const style = document.createElement('style');
                    style.textContent = `
                        @page {
                            margin: 0;
                            size: A4;
                        }
                        body {
                            margin: 0;
                        }
                        .header {
                            page-break-after: avoid !important;
                        }
                        .body-content {
                            page-break-before: avoid !important;
                        }
                        table {
                            page-break-inside: avoid;
                        }
                        tr {
                            page-break-inside: avoid;
                        }
                        .page-break-avoid {
                            page-break-inside: avoid !important;
                        }
                    `;
                    document.head.appendChild(style);
                });
            });
            await page.goto(url, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: 30000
            });
            await page.evaluate(() => {
                const getElementHeight = (element) => {
                    const styles = window.getComputedStyle(element);
                    const margin = parseFloat(styles['marginTop']) +
                        parseFloat(styles['marginBottom']);
                    return element.offsetHeight + margin;
                };
                const header = document.querySelector('.header');
                const bodyContent = document.querySelector('.body-content');
                if (header && bodyContent) {
                    let nextElement = header.nextElementSibling;
                    while (nextElement && nextElement !== bodyContent) {
                        const isEmpty = !nextElement.textContent.trim();
                        if (isEmpty) {
                            const temp = nextElement;
                            nextElement = nextElement.nextElementSibling;
                            temp.remove();
                        }
                        else {
                            nextElement = nextElement.nextElementSibling;
                        }
                    }
                    const headerHeight = getElementHeight(header);
                    const contentHeight = getElementHeight(bodyContent);
                    const pageHeight = 1123;
                    if (headerHeight + contentHeight < pageHeight * 0.8) {
                        header.style.pageBreakAfter = 'avoid';
                        bodyContent.style.pageBreakBefore = 'avoid';
                        const wrapper = document.createElement('div');
                        wrapper.className = 'page-break-avoid';
                        header.parentNode.insertBefore(wrapper, header);
                        wrapper.appendChild(header);
                        wrapper.appendChild(bodyContent);
                    }
                }
            });
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: {
                    top: '0mm',
                    right: '0mm',
                    bottom: '0mm',
                    left: '0mm',
                },
                preferCSSPageSize: true,
                displayHeaderFooter: false,
                scale: 1
            });
            console.log('PDF generated successfully:', outputPath);
            return true;
        }
        catch (error) {
            console.error('Error in PDF generation:', error);
            return false;
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    async removeTempDir(localFolderPath) {
        try {
            await rimrafPromise(localFolderPath);
            console.log(`Successfully deleted local folder: ${localFolderPath}`);
            return true;
        }
        catch (deleteError) {
            console.error(`Error deleting local folder ${localFolderPath}:`, deleteError);
            return false;
        }
    }
    async uploadFolderToS3(localFolderPath, bucketName, s3Prefix = '', deleteAfterUpload = true, maxConcurrent = 5, maxRetries = 3) {
        try {
            console.log(`Uploading folder: ${localFolderPath} to S3 bucket: ${bucketName}/${s3Prefix}`);
            if (!await fs_1.promises.access(localFolderPath).then(() => true).catch(() => false)) {
                console.error(`Local folder does not exist: ${localFolderPath}`);
                return false;
            }
            const files = await fs_1.promises.readdir(localFolderPath);
            let processedFiles = 0;
            let failedFiles = 0;
            for (let i = 0; i < files.length; i += maxConcurrent) {
                const batch = files.slice(i, i + maxConcurrent);
                const uploadPromises = batch.map(async (file) => {
                    const localFilePath = path.join(localFolderPath, file);
                    const stats = await fs_1.promises.stat(localFilePath);
                    if (stats.isDirectory()) {
                        const newPrefix = path.join(s3Prefix, file).replace(/\\/g, '/');
                        const success = await this.uploadFolderToS3(localFilePath, bucketName, newPrefix, deleteAfterUpload, maxConcurrent, maxRetries);
                        if (!success)
                            failedFiles++;
                        processedFiles++;
                    }
                    else {
                        let attempts = 0;
                        while (attempts < maxRetries) {
                            try {
                                const s3Key = path.join(s3Prefix, file).replace(/\\/g, '/');
                                const fileStream = (0, fs_1.createReadStream)(localFilePath);
                                const uploadParams = {
                                    Bucket: bucketName,
                                    Key: s3Key,
                                    Body: fileStream,
                                    ContentType: mime.lookup(file) || 'application/octet-stream',
                                    ACL: 'public-read',
                                };
                                const command = new client_s3_1.PutObjectCommand(uploadParams);
                                await this.s3Client.send(command);
                                console.log(`Successfully uploaded: ${s3Key}`);
                                processedFiles++;
                                break;
                            }
                            catch (error) {
                                attempts++;
                                if (attempts === maxRetries) {
                                    console.error(`Failed to upload ${file} after ${maxRetries} attempts:`, error);
                                    failedFiles++;
                                    processedFiles++;
                                }
                                else {
                                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
                                }
                            }
                        }
                    }
                });
                await Promise.all(uploadPromises);
                if (processedFiles === files.length) {
                    const allSuccess = failedFiles === 0;
                    if (allSuccess) {
                        console.log(`Successfully uploaded all files in: ${localFolderPath}`);
                        if (deleteAfterUpload) {
                            await fs_1.promises.rm(localFolderPath, { recursive: true, force: true });
                            console.log(`Deleted local folder: ${localFolderPath}`);
                        }
                        return true;
                    }
                    else if (failedFiles === files.length) {
                        console.error(`All files in ${localFolderPath} failed to upload`);
                        return false;
                    }
                }
            }
            return false;
        }
        catch (error) {
            console.error('Error in uploadFolderToS3:', error);
            return false;
        }
    }
    async uploadFolderToS3_old(localFolderPath, bucketName, s3Prefix = '', deleteAfterUpload = true) {
        try {
            console.log(`Uploading folder: ${localFolderPath} to S3 bucket: ${bucketName}/${s3Prefix}`);
            const files = await fs_1.promises.readdir(localFolderPath);
            for (const file of files) {
                const localFilePath = path.join(localFolderPath, file);
                const stats = await fs_1.promises.stat(localFilePath);
                if (stats.isDirectory()) {
                    const newPrefix = path.join(s3Prefix, file).replace(/\\/g, '/');
                    await this.uploadFolderToS3(localFilePath, bucketName, newPrefix);
                }
                else {
                    const fileContent = await fs_1.promises.readFile(localFilePath);
                    const s3Key = path.join(s3Prefix, file).replace(/\\/g, '/');
                    const uploadParams = {
                        Bucket: bucketName,
                        Key: s3Key,
                        Body: fileContent,
                        ContentType: mime.lookup(file) || 'application/octet-stream',
                        ACL: 'public-read'
                    };
                    try {
                        const command = new client_s3_1.PutObjectCommand(uploadParams);
                        await this.s3Client.send(command);
                        console.log(`Successfully uploaded: ${s3Key}`);
                    }
                    catch (uploadError) {
                        console.error(`Error uploading ${s3Key}:`, uploadError);
                    }
                }
            }
            return true;
            console.log(`Successfully uploaded folder: ${localFolderPath} to S3 bucket: ${bucketName}`);
        }
        catch (error) {
            console.error('Error uploading folder to S3:', error);
            return true;
        }
    }
    async deleteFolder(bucketName, folderPath) {
        try {
            let continuationToken = undefined;
            do {
                const listCommand = new client_s3_1.ListObjectsV2Command({
                    Bucket: bucketName,
                    Prefix: folderPath,
                    ContinuationToken: continuationToken,
                });
                const listResponse = await this.s3Client.send(listCommand);
                const objectsToDelete = listResponse.Contents?.map((item) => ({
                    Key: item.Key,
                }));
                if (objectsToDelete && objectsToDelete.length > 0) {
                    const deleteCommand = new client_s3_1.DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: {
                            Objects: objectsToDelete,
                        },
                    });
                    const deleteResponse = await this.s3Client.send(deleteCommand);
                    console.log('Deleted objects:', deleteResponse.Deleted);
                }
                continuationToken = listResponse.NextContinuationToken;
            } while (continuationToken);
            console.log(`Folder "${folderPath}" deleted successfully.`);
        }
        catch (error) {
            console.error('Error deleting folder:', error);
        }
    }
    async downloadFileToDisk(bucketName, fileKey, resolvedPath) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
            });
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                console.error('File body is empty');
                return false;
            }
            const streamToBuffer = (stream) => {
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };
            const buffer = await streamToBuffer(response.Body);
            const folderPath = (0, path_1.resolve)(resolvedPath, '..');
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
            }
            console.log('File write:', resolvedPath);
            (0, fs_1.writeFileSync)(resolvedPath, buffer);
            console.log('File write success:', resolvedPath);
            return true;
        }
        catch (error) {
            console.error('Error downloading file to disk:', error.message);
            return false;
        }
    }
    async processAttachments(directoryPath, filedata) {
        if (!directoryPath || !filedata) {
            throw new Error('Directory path and file data are required');
        }
        try {
            const files = await this.getFilesFromDirectory(directoryPath);
            if (!Array.isArray(files) || files.length === 0) {
                console.warn('No files found in directory:', directoryPath);
                return false;
            }
            const results = await Promise.allSettled(files.map(async (attachment) => {
                try {
                    const attachmentData = {
                        data: {
                            dataType: 'attachment',
                            attachmentHidden: false,
                            fileName: attachment.fileName,
                        },
                        cPath: attachment.cPath,
                    };
                    const verificationResult = await this.fileVerificationService.verifyFile(attachmentData.cPath);
                    if (!verificationResult) {
                        return false;
                    }
                    const fileExtension = path.extname(attachmentData.cPath);
                    const timestamp = new Date().getTime();
                    const newFileName = `doc_att_${timestamp}${fileExtension}`;
                    const newFilePath = `${filedata.dirPath}/${newFileName}`;
                    console.log('newFilePath', newFilePath);
                    try {
                        await fs_1.promises.mkdir(filedata.dirPath, { recursive: true });
                        await fs_1.promises.copyFile(attachmentData.cPath, `${this.ASSETS_PATH}${newFilePath}`);
                        attachmentData.cPath = newFilePath;
                        const stats = await fs_1.promises.stat(`${this.ASSETS_PATH}${newFilePath}`);
                        const fileInfoData = this.constructFileInfo(filedata, attachmentData, verificationResult, stats.size);
                        const fileres = await this.fileInfo.updateConvertFileInfo(fileInfoData);
                        if (fileres?.msg === 1) {
                            try {
                                if (fileres && fileres['cOldpath'] && fileres['cOldpath'] != '') {
                                    this.fileDeleteQueue.add({ jFiles: [fileres['cOldpath']] });
                                }
                            }
                            catch (error) {
                                console.log('Error in fileDeleteQueue:', error);
                            }
                            await this.queueFileForProcessing(attachmentData.cPath, fileres.nBundledetailid);
                            return true;
                        }
                    }
                    catch (error) {
                        console.error('Error moving file:', error);
                        return false;
                    }
                    console.error('Failed to update file info for attachment:', attachmentData.data.fileName);
                    return false;
                }
                catch (error) {
                    console.error(`Error processing individual attachment: ${attachment.fileName}`, error);
                    return false;
                }
            }));
            const successCount = results.filter(result => result.status === 'fulfilled' && result.value === true).length;
            return successCount === files.length;
        }
        catch (error) {
            console.error('Error in processAttachments:', error);
            throw error;
        }
    }
    constructFileInfo(filedata, attachmentData, verificationResult, fileSize) {
        return {
            nUDid: null,
            nMasterid: filedata.nMasterid,
            cFilename: `${attachmentData.data.fileName}`,
            nSectionid: filedata?.nSectionid,
            nBundleid: filedata.nBundleid,
            nBundledetailid: null,
            cFiletype: attachmentData.cPath.split('.').pop()?.toUpperCase() || '',
            isValidate: verificationResult.isValidate || false,
            cPath: attachmentData.cPath,
            cFilesize: fileSize.toString(),
            nPagerotation: verificationResult.pagerotation,
            cPage: `1-${verificationResult.totalpages}`,
            bisTranscript: false,
        };
    }
    async queueFileForProcessing(cPath, nBundledetailid) {
        await this.filecopyService.copyFile(cPath, '', '', nBundledetailid);
    }
    async processAttachments_old(directoryPath, filedata) {
        try {
            const files = await this.getFilesFromDirectory(directoryPath);
            await Promise.all(files.map(async (attachment) => {
                const attachmentData = {
                    data: {
                        dataType: 'attachment',
                        attachmentHidden: false,
                        fileName: attachment.fileName,
                    },
                    cPath: attachment.cPath,
                };
                if (attachmentData.data.dataType === 'attachment' && !attachmentData.data.attachmentHidden) {
                    const verificationResult = await this.fileVerificationService.verifyFile(attachmentData.cPath);
                    const stats = await fs_1.promises.stat(attachmentData.cPath);
                    const fileSize = stats.size;
                    const fileInfoData = {
                        nUDid: null,
                        nMasterid: filedata.nMasterid,
                        cFilename: `${filedata.cFilename || filedata.name}_${attachmentData.data.fileName}`,
                        nSectionid: filedata?.nSectionid,
                        nBundleid: filedata.nBundleid,
                        nBundledetailid: null,
                        cFiletype: attachmentData.cPath.split('.').pop().toUpperCase(),
                        isValidate: verificationResult.isValidate || false,
                        cPath: attachmentData.cPath,
                        cFilesize: fileSize.toString(),
                        nPagerotation: verificationResult.pagerotation,
                        cPage: `1-${verificationResult.totalpages}`,
                        bisTranscript: false,
                    };
                    const fileres = await this.fileInfo.updateConvertFileInfo(fileInfoData);
                    if (fileres.msg && fileres.msg === 1) {
                        try {
                            if (fileres && fileres['cOldpath'] && fileres['cOldpath'] != '') {
                                this.fileDeleteQueue.add({ jFiles: [fileres['cOldpath']] });
                            }
                        }
                        catch (error) {
                            console.log('Error in fileDeleteQueue:', error);
                        }
                        await this.filecopyService.copyFile(attachmentData.cPath, '', '', fileres.nBundledetailid);
                    }
                    else {
                        console.error('Failed to update file info for attachment:', attachmentData.data.fileName);
                    }
                }
            }));
        }
        catch (error) {
            console.error('Error processing attachments:', error);
        }
    }
    async getSignedUrl(key) {
        try {
            console.log(`Generating signed URL for key: ${key}`);
            console.log(`Using bucket: ${this.bucketName}`);
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            try {
                await this.s3Client.send(command);
            }
            catch (error) {
                if (error.name === 'NotFound' || error.Code === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
                    console.log(`File not found: ${key}`);
                }
                return error;
            }
            const getCommand = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, getCommand, {
                expiresIn: 3600,
            });
            console.log(`Generated signed URL successfully`, signedUrl, this.config.get('DO_SPACES_ENDPOINT'));
            return signedUrl.substring(signedUrl.indexOf("doc/case"));
        }
        catch (error) {
            console.error(`Error generating signed URL: ${error.message}`, error.stack);
            return '';
        }
    }
    async deleteSessionFolder(sessionFolder) {
        try {
            if (!(0, fs_1.existsSync)(sessionFolder)) {
                console.log('Session folder does not exist:', sessionFolder);
                return true;
            }
            const stats = (0, fs_1.statSync)(sessionFolder);
            if (!stats.isDirectory()) {
                console.error('Path exists but is not a directory:', sessionFolder);
                return false;
            }
            const deleteFolderRecursive = (folderPath) => {
                if ((0, fs_1.existsSync)(folderPath)) {
                    (0, fs_1.readdirSync)(folderPath).forEach((file) => {
                        const curPath = path.join(folderPath, file);
                        if ((0, fs_1.lstatSync)(curPath).isDirectory()) {
                            deleteFolderRecursive(curPath);
                        }
                        else {
                            (0, fs_1.unlinkSync)(curPath);
                        }
                    });
                    (0, fs_1.rmdirSync)(folderPath);
                }
            };
            deleteFolderRecursive(sessionFolder);
            console.log('Successfully deleted session folder:', sessionFolder);
            return true;
        }
        catch (error) {
            console.error('Error deleting session folder:', sessionFolder);
            console.error('Error details:', error);
            return false;
        }
    }
    ;
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_2.InjectQueue)('delete-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _b : Object, typeof (_c = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _c : Object, typeof (_d = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object])
], EmailService);


/***/ }),
/* 80 */
/***/ ((module) => {

module.exports = require("mime-types");

/***/ }),
/* 81 */
/***/ ((module) => {

module.exports = require("rimraf");

/***/ }),
/* 82 */
/***/ ((module) => {

module.exports = require("@aws-sdk/s3-request-presigner");

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
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OcrService = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const fs_1 = __webpack_require__(14);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(37);
const path_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const rxjs_1 = __webpack_require__(84);
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(20);
const log_service_1 = __webpack_require__(15);
const client_s3_1 = __webpack_require__(62);
let OcrService = class OcrService {
    constructor(db, utility, config, fileVerificationService, fileInfo, logService, fileCopyQueue, fileocrQueue) {
        this.db = db;
        this.utility = utility;
        this.config = config;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.logService = logService;
        this.fileCopyQueue = fileCopyQueue;
        this.fileocrQueue = fileocrQueue;
        this.ocrFilePath = this.config.get('PY_OCR');
        this.ocrQueuePath = this.config.get('PY_OCR_QUEUE');
        this.pythonV = this.config.get('pythonV');
        this.phrases = ['Scanning contents', 'Linearizing', 'PDF/A conversion', 'Deflating JPEGs', 'OCR', 'Recompressing JPEGs'];
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
    async OCRFile(item, jobDetail) {
        try {
            if (jobDetail && jobDetail.bIsocr) {
                let data = Object.assign(item, jobDetail);
                let res = await this.fileOcr(data);
                if (res.msg == 1) {
                    return true;
                }
                else {
                    false;
                }
            }
        }
        catch (error) {
            console.error('Error ocr file:', error);
            return false;
        }
    }
    async ocrQueue(data) {
        await this.fileocrQueue.add({ cPath: data.cPath, data: data, nBundledetailid: data.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
    }
    async downloadFileToDisk(bucketName, fileKey, resolvedPath) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: bucketName,
                Key: fileKey,
            });
            const response = await this.s3Client.send(command);
            if (!response.Body) {
                console.error('File body is empty');
                return false;
            }
            const streamToBuffer = (stream) => {
                return new Promise((resolve, reject) => {
                    const chunks = [];
                    stream.on('data', (chunk) => chunks.push(chunk));
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                    stream.on('error', reject);
                });
            };
            const buffer = await streamToBuffer(response.Body);
            const folderPath = (0, path_1.resolve)(resolvedPath, '..');
            if (!(0, fs_1.existsSync)(folderPath)) {
                (0, fs_1.mkdirSync)(folderPath, { recursive: true });
            }
            console.log('File write:', resolvedPath);
            (0, fs_1.writeFileSync)(resolvedPath, buffer);
            console.log('File write success:', resolvedPath);
            return true;
        }
        catch (error) {
            console.error('Error downloading file to disk:', error.message);
            return false;
        }
    }
    async fileOcr(body) {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            let data = res.data[0][0];
            data.nMasterid = body.nMasterid;
            data.identifier = body.nBundledetailid;
            data.nOcrtype = body.nOcrtype;
            await this.fileocrQueue.add({ cPath: data.cPath, data: data, nBundledetailid: data.nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            return;
            data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
            data.filetype = data.cPath.split('.').pop();
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), data.cPath);
            let result = await this.downloadFileToDisk('etabella', data.cPath, outputPath);
            console.log('Download result', result);
            if (!result) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return;
            }
            let success = await this.FileOCR({ data: data });
            if (success) {
                this.utility.emit({ event: 'VERIFY-START', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid } });
                const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
                console.log('Verification complete:', verificationResult);
                this.utility.emit({ event: 'VERIFY-SUCCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'VS' } });
                const stats = await fs_1.promises.stat(outputPath);
                const fileSize = stats.size;
                let filename = data.cFilename;
                filename = filename.replace(/\.[^/.]+$/, '.pdf');
                const fileInfo = {
                    nMasterid: data.nMasterid,
                    cFilename: filename,
                    nSectionid: null,
                    nBundleid: null,
                    nBundledetailid: data.nBundledetailid,
                    cFiletype: 'PDF',
                    isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                    cPath: data.cPath,
                    cFilesize: fileSize.toString(),
                    nPagerotation: verificationResult.pagerotation,
                    cPage: `1-${verificationResult.totalpages}`,
                    bisTranscript: false
                };
                let res = await this.db.executeRef('upload_update_convertinfo', fileInfo);
                if (res.success) {
                    await this.fileCopyQueue.add({ cPath: data.cPath }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                }
                return {
                    msg: 1
                };
            }
            return { msg: 1 };
        }
        else {
            return { msg: -1, value: 'Failed to convert', error: res.error };
        }
    }
    async FileOCR(job) {
        try {
            const { identifier, nMasterid, filetype, name, cFilename } = job.data;
            console.log('Step 2:', job.data);
            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
            if (!await this.fileExists(inputPath)) {
                console.error('File not found:', inputPath);
                return false;
            }
            (0, rxjs_1.delay)(1000);
            this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
            const ocrResult = await this.ocrToPdf(inputPath, outputPath, job.data.nOcrtype, identifier, nMasterid, cFilename, 'file_' + identifier);
            if (!ocrResult) {
                return false;
            }
            this.utility.emit({ event: 'OCR-SUCCESS', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
            console.log('File has been ocr successfully');
            return true;
        }
        catch (error) {
            console.error('Error processing ocr job:', error);
            return false;
        }
    }
    async ocrToPDFFailed(nUDid, identifier, job) {
        console.log('OCR failed');
        let mdl = { nUDid: nUDid, cStatus: 'OF', nMasterid: job.data.nMasterid, cName: job.data.name, cSize: job.data.size, cType: job.data.filetype };
        await this.fileInfo.replaceFIleDetail(mdl);
        this.utility.emit({ event: 'OCR-FAILED', data: { identifier, nMasterid: job.data.nMasterid } });
    }
    handleData(resulttype, data, identifier, nMasterid, utility, cFilename) {
        try {
            const dataString = data.toString().trim();
            if (this.phrases.some(phrase => dataString.trim().includes(phrase))) {
                resulttype = this.phrases.find(phrase => dataString.includes(phrase));
            }
            const trimmedData = dataString.trim();
            if (resulttype && trimmedData.match(/\d+%/)) {
                let text = trimmedData.replace(/ {2}/g, ' ').replace(/[---━]+/g, ' ');
                if (!text.includes(resulttype)) {
                    text = resulttype + ' ' + text;
                }
                text = text.split(`\r`)[0];
                const splitStrings = text.split('\t');
                const lastString = splitStrings[splitStrings.length - 1];
                utility.emit({ event: 'OCR-PROGRESS', data: { identifier, nMasterid, message: lastString, filename: cFilename } });
            }
            return resulttype;
        }
        catch (error) {
        }
    }
    ocrToPdf(inputFile, outputFile, sharp_image, identifier, nMasterid, cFilename, nUPid) {
        this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: nMasterid, filename: cFilename } });
        console.log('Input parms', inputFile, outputFile, sharp_image, identifier, nMasterid, cFilename, nUPid);
        return new Promise((resolve, reject) => {
            let resulttype;
            const pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.ocrFilePath, inputFile, outputFile, sharp_image, `upload/${nUPid}/${identifier}`], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    TMP_PATH: this.config.get('TMP_PATH')
                }
            });
            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log('STDOUT:', message);
                resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility, cFilename);
            });
            pythonProcess.stderr.on('data', async (data) => {
                console.error('STDERR:', data.toString());
                resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility, cFilename);
            });
            pythonProcess.on('close', (code) => {
                this.logService.info(`Task processed - ocr close ${inputFile} to ${outputFile} code ${code}`, `upload/${nUPid}/${identifier}`);
                if (code === 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
            pythonProcess.on('error', (error) => {
                this.logService.info(`Task processed - ocr error ${inputFile} to ${outputFile} error ${error}`, `upload/${nUPid}/${identifier}`);
                resolve(false);
            });
        });
    }
    async OCRPDFFile(jsonData) {
        return new Promise((resolve, reject) => {
            let resulttype;
            let identifier = jsonData[0][4];
            let nMasterid = jsonData[0][5];
            this.utility.emit({ event: 'OCR-START', data: { identifier: identifier, nMasterid: nMasterid, filename: jsonData[0][6] } });
            let pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.ocrQueuePath, JSON.stringify(jsonData)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    TMP_PATH: this.config.get('TMP_PATH')
                }
            });
            pythonProcess.stdout.on("data", (data) => {
                if (data.toString().trim().match(/\d+%/)) {
                    data = data.toString().trim();
                    let id = data.split(' ')[0];
                    if (jsonData.find(x => x[3] == id)) {
                        if (data.toString().trim().includes(id)) {
                            let ind = jsonData.findIndex(x => x[3] == id);
                            let res = data.toString().trim().split(id)[1];
                            resulttype = this.handleData(resulttype, res, identifier, nMasterid, this.utility, jsonData[ind][6]);
                        }
                    }
                }
            });
            pythonProcess.stderr.on("data", (data) => {
            });
            pythonProcess.on("close", (code) => {
                if (code === 0) {
                    console.log('End file', new Date().toISOString());
                    resolve(true);
                }
                else {
                    console.log('Python script failed with code', code);
                    resolve(false);
                }
            });
        });
    }
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, bull_1.InjectQueue)('filecopy-process')),
    __param(7, (0, bull_1.InjectQueue)('fileocr-process')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _d : Object, typeof (_e = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _e : Object, typeof (_f = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _f : Object, typeof (_g = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _g : Object, typeof (_h = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _h : Object])
], OcrService);


/***/ }),
/* 84 */
/***/ ((module) => {

module.exports = require("rxjs");

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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.MovetoS3Service = void 0;
const common_1 = __webpack_require__(3);
const filecopy_service_1 = __webpack_require__(57);
const log_service_1 = __webpack_require__(15);
const verifypdf_service_1 = __webpack_require__(36);
const convert_service_1 = __webpack_require__(56);
const ocr_service_1 = __webpack_require__(83);
const config_1 = __webpack_require__(6);
const email_service_1 = __webpack_require__(79);
let MovetoS3Service = class MovetoS3Service {
    constructor(fileService, fileVerificationService, logService, convertService, ocrService, emailS, config) {
        this.fileService = fileService;
        this.fileVerificationService = fileVerificationService;
        this.logService = logService;
        this.convertService = convertService;
        this.ocrService = ocrService;
        this.emailS = emailS;
        this.config = config;
        this.fTypes = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'bmp', 'gif', 'tiff', 'zip', 'msg'];
    }
    async MovingToS3(jobDetail, converttype, item, Fpath, nativePath, isNewFile) {
        converttype = converttype == 'N' ? null : converttype;
        try {
            let c_status = false;
            if (converttype == 'C' && !this.isPdfFile(item.cSavepath)) {
                console.log('Call convert', item.cSavepath);
                c_status = await this.convert(jobDetail, item);
                if (!c_status) {
                    jobDetail.cStatus = 'CF';
                }
                else {
                    Fpath = `${this.config.get('ASSETS')}${item.cSavepath}`;
                }
            }
            const verificationResult = await this.fileVerificationService.verifyFile(Fpath, true);
            console.log('Verification complete:', verificationResult);
            jobDetail.verificationResult = verificationResult;
            try {
                this.logService.info(`Verification : ${JSON.stringify(verificationResult)} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
            }
            catch (error) {
            }
            item = Object.assign(item, verificationResult);
            if (jobDetail.bIsocr && converttype != 'B') {
                let ocritem = Object.assign({ ...item });
                console.log(ocritem);
                ocritem.nBundledetailid = item.nNewBundledetailid ? item.nNewBundledetailid : ocritem.nBundledetailid;
                const status = await this.ocr(jobDetail, ocritem);
                if (!status) {
                    jobDetail.cStatus = 'OF';
                }
                else {
                    Fpath = `${this.config.get('ASSETS')}${item.cSavepath}`;
                }
            }
            await this.fileService.copyFile(item.cSavepath, converttype, nativePath, item.nBundledetailid, null, null, null, jobDetail.nUPid);
        }
        catch (error) {
        }
        return true;
    }
    async convert(jobDetail, item) {
        try {
            let filetype = item.cSavepath.split('.').pop()?.toLowerCase();
            this.convertService.convertLog(jobDetail.nUserid, jobDetail.converttype == 'B' ? null : item.nBundledetailid, jobDetail.nUDid, 'P');
            if (filetype && this.fTypes.includes(filetype)) {
                const newPath = item.cSavepath?.toLowerCase().replace(`.${filetype}`, '.pdf');
                this.logService.info(`Task processed - Convert start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                const status = await this.convertService.convertToPdf(`${this.config.get('ASSETS')}${item.cSavepath}`, `${this.config.get('ASSETS')}${newPath}`, jobDetail.identifier, jobDetail.nUserid, item.name || item.filename, jobDetail.nUPid, { nBundledetailid: item.nBundledetailid, nUDid: jobDetail.nUDid });
                this.logService.info(`Task processed - Convert end ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} status - ${status}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                if (status) {
                    item.cSavepath = newPath;
                    let data = Object.assign(item, jobDetail);
                    let isValidUpdate = true;
                    item.nNewBundledetailid = null;
                    this.logService.info(`Task processed - confert update to db  new path ${this.config.get('ASSETS')}${newPath} for ${jobDetail.converttype == 'B' ? null : item.nBundledetailid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    let res = await this.convertService.filedataProcess(item, data, jobDetail.converttype == 'B' ? null : item.nBundledetailid, `${this.config.get('ASSETS')}${newPath}`, newPath, isValidUpdate);
                    return true;
                }
                else {
                    return false;
                }
            }
            if ((/\.(msg)$/i.test(item.cSavepath))) {
                const newPath = item.cSavepath?.toLowerCase().replace(`.${filetype}`, '.pdf');
                let data = Object.assign(item, jobDetail);
                this.logService.info(`Task processed - Convert start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} `, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                const dirPath = `/doc/case${jobDetail.nCaseid}`;
                const dataf = { dirPath: dirPath, cPath: `${this.config.get('ASSETS')}${item.cSavepath}`, cOutputpath: `${this.config.get('ASSETS')}${newPath}`, nId: item.nBundledetailid, nCaseid: jobDetail.nCaseid };
                const statusE = await this.emailS.getemailparse(dataf, data.converttype);
                this.logService.info(`Task processed - Convert end ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} status - ${statusE}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                if (statusE) {
                    item.cSavepath = newPath;
                    let data = Object.assign(item, jobDetail);
                    let isValidUpdate = true;
                    item.nNewBundledetailid = null;
                    this.logService.info(`Task processed - confert update to db  new path ${this.config.get('ASSETS')}${newPath} for ${jobDetail.converttype == 'B' ? null : item.nBundledetailid}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                    let res = await this.convertService.filedataProcess(item, data, jobDetail.converttype == 'B' ? null : item.nBundledetailid, `${this.config.get('ASSETS')}${newPath}`, newPath, isValidUpdate);
                    return true;
                }
                else {
                    return false;
                }
            }
            else {
                return false;
            }
        }
        catch (error) {
            return false;
        }
    }
    async ocr(jobDetail, item) {
        try {
            console.log('\n\n\n\Call ocr', item.cSavepath);
            if ((/\.(pdf)$/i.test(item.cSavepath))) {
                let path = item.cSavepath.split('/');
                let newPath = item.cSavepath.replace(path[path.length - 1], 'ocr_' + path[path.length - 1]);
                this.logService.info(`Task processed - ocr start ${this.config.get('ASSETS')}${item.cSavepath} to ${this.config.get('ASSETS')}${newPath} type ${jobDetail.nOcrtype}`, `upload/${jobDetail.nUPid}/${jobDetail.identifier}`);
                let ocrdata = { identifier: jobDetail.identifier, nMasterid: jobDetail.nUserid, nBundledetailid: item.nBundledetailid, nOcrtype: jobDetail.nOcrtype, cPath: item.cSavepath, nUDid: jobDetail.nUDid };
                this.ocrService.ocrQueue(ocrdata);
                return true;
            }
        }
        catch (error) {
        }
        return;
    }
    isPdfFile(path) {
        try {
            return path.split('.').pop().toLowerCase() == 'pdf';
        }
        catch (error) {
            return false;
        }
    }
};
exports.MovetoS3Service = MovetoS3Service;
exports.MovetoS3Service = MovetoS3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _a : Object, typeof (_b = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof convert_service_1.ConvertService !== "undefined" && convert_service_1.ConvertService) === "function" ? _d : Object, typeof (_e = typeof ocr_service_1.OcrService !== "undefined" && ocr_service_1.OcrService) === "function" ? _e : Object, typeof (_f = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _f : Object, typeof (_g = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _g : Object])
], MovetoS3Service);


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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RealtimeUploadController = void 0;
const common_1 = __webpack_require__(3);
const chunks_upload_service_1 = __webpack_require__(7);
const platform_express_1 = __webpack_require__(32);
let RealtimeUploadController = class RealtimeUploadController {
    constructor(chunkService) {
        this.chunkService = chunkService;
    }
    async checkUploadedChunks(query) {
        const { identifier, nUPid, nCaseid, cPath, cTotal } = query;
        return await this.chunkService.checkExistingChunks(identifier, nUPid, nCaseid, cPath, cTotal);
    }
    async uploadChunk(file, body) {
        return await this.chunkService.saveChunk(file, body);
    }
    async completeUpload(body) {
        console.log('Query:', body);
        body.bisTranscript = true;
        return await this.chunkService.completeUpload(body);
    }
};
exports.RealtimeUploadController = RealtimeUploadController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_b = typeof Promise !== "undefined" && Promise) === "function" ? _b : Object)
], RealtimeUploadController.prototype, "checkUploadedChunks", null);
__decorate([
    (0, common_1.Post)('upload-chunk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof Express !== "undefined" && (_c = Express.Multer) !== void 0 && _c.File) === "function" ? _d : Object, Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], RealtimeUploadController.prototype, "uploadChunk", null);
__decorate([
    (0, common_1.Post)('complete-upload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], RealtimeUploadController.prototype, "completeUpload", null);
exports.RealtimeUploadController = RealtimeUploadController = __decorate([
    (0, common_1.Controller)('realtime-upload'),
    __metadata("design:paramtypes", [typeof (_a = typeof chunks_upload_service_1.ChunksUploadService !== "undefined" && chunks_upload_service_1.ChunksUploadService) === "function" ? _a : Object])
], RealtimeUploadController);


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
exports.ExportsController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const export_interface_1 = __webpack_require__(88);
const exports_service_1 = __webpack_require__(89);
let ExportsController = class ExportsController {
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    async postExportfile(body) {
        return await this.exportsService.generateExport(body);
    }
    async postDeleteFiles(body) {
        return await this.exportsService.deleteFiles(body);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Post)('upload-report'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof export_interface_1.excelReport !== "undefined" && export_interface_1.excelReport) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], ExportsController.prototype, "postExportfile", null);
__decorate([
    (0, common_1.Delete)('delete-files'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof export_interface_1.deleteFilesReq !== "undefined" && export_interface_1.deleteFilesReq) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], ExportsController.prototype, "postDeleteFiles", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('exports'),
    (0, common_1.Controller)('exports'),
    __metadata("design:paramtypes", [typeof (_a = typeof exports_service_1.ExportsService !== "undefined" && exports_service_1.ExportsService) === "function" ? _a : Object])
], ExportsController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deleteFilesReq = exports.exportSummary = exports.excelReport = void 0;
const swagger_1 = __webpack_require__(27);
const class_validator_1 = __webpack_require__(29);
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
class excelReport {
}
exports.excelReport = excelReport;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], excelReport.prototype, "nUPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], excelReport.prototype, "cStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], excelReport.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "", description: '' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], excelReport.prototype, "cFiletype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], excelReport.prototype, "nMasterid", void 0);
class exportSummary {
}
exports.exportSummary = exportSummary;
class deleteFilesReq {
}
exports.deleteFilesReq = deleteFilesReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: ["uuid1", "uuid2"], description: 'Array of file IDs' }),
    (0, class_validator_1.IsString)({ each: true, message: 'Each value in jFiles must be a string' }),
    __metadata("design:type", Array)
], deleteFilesReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteFilesReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], deleteFilesReq.prototype, "nMasterid", void 0);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportsService = void 0;
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
const db_service_1 = __webpack_require__(20);
let ExportsService = class ExportsService {
    constructor(exportExcelQueue, db) {
        this.exportExcelQueue = exportExcelQueue;
        this.db = db;
    }
    async generateExport(body) {
        let queueRes = await this.exportExcelQueue.add(body, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        console.log('Export Job added to the queue:');
        console.log('Export  Job ID:', queueRes.id);
        return { msg: 1, value: 'Generating excel report.' };
    }
    async deleteFiles(body) {
        let res = await this.db.executeRef('upload_deletefiles', body);
        if (res.success) {
            return res.data[0][0];
        }
        else {
            return { msg: -1, value: 'Failed to delete', error: res.error };
        }
    }
};
exports.ExportsService = ExportsService;
exports.ExportsService = ExportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_2.InjectQueue)('export-excel')),
    __metadata("design:paramtypes", [typeof (_a = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object])
], ExportsService);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExportExcelProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const db_service_1 = __webpack_require__(20);
const ExcelJS = __webpack_require__(91);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
let ExportExcelProcessor = class ExportExcelProcessor {
    constructor(db, utility) {
        this.db = db;
        this.utility = utility;
        this.tempFilePath = './assets/export-excel';
        this.setupQueueListeners();
    }
    setupQueueListeners() {
    }
    async handleExport(job) {
        try {
            debugger;
            console.log('ExportExcelProcessor', job.data);
            let sendParams = job.data;
            sendParams.ref = 2;
            let res = await this.db.executeRef('upload_report_detail_export', sendParams);
            if (res.success) {
                const exportSummary = res.data[0][0];
                const exportData = res.data[1];
                console.log('exportData', exportData.length);
                if (exportData.length) {
                    const workbook = new ExcelJS.Workbook();
                    const worksheet = workbook.addWorksheet('Data');
                    let Columns = [];
                    Object.keys(exportData[0]).forEach((key, index) => {
                        Columns.push({ header: key, key: key, width: key == 'File name' ? 40 : 20 });
                    });
                    worksheet.columns = Columns;
                    worksheet.addRows(exportData);
                    const filePath = path.resolve(this.tempFilePath, `case${job.data.nCaseid}/${exportSummary.cUnicid}.xlsx`);
                    if (!fs.existsSync(path.dirname(filePath))) {
                        fs.mkdirSync(path.dirname(filePath), { recursive: true });
                    }
                    await workbook.xlsx.writeFile(filePath);
                    console.log('Export successfully', filePath);
                    this.utility.emit({ event: 'EXPORT-SUCCESS', data: { nUPid: job.data.nUPid, cPath: `export-excel/case${job.data.nCaseid}/${exportSummary.cUnicid}.xlsx`, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
                }
                else {
                    this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
                }
            }
            else {
                this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
            }
        }
        catch (error) {
            this.utility.emit({ event: 'EXPORT-FAILED', data: { nUPid: job.data.nUPid, nMasterid: job.data.nMasterid } }, 'EXPORT-EXCEL-RESPONCE');
        }
    }
};
exports.ExportExcelProcessor = ExportExcelProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], ExportExcelProcessor.prototype, "handleExport", null);
exports.ExportExcelProcessor = ExportExcelProcessor = __decorate([
    (0, bull_1.Processor)('export-excel'),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object])
], ExportExcelProcessor);


/***/ }),
/* 91 */
/***/ ((module) => {

module.exports = require("exceljs");

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
exports.FileCopyProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const filecopy_service_1 = __webpack_require__(57);
let FileCopyProcessor = class FileCopyProcessor {
    constructor(fileService) {
        this.fileService = fileService;
    }
    async handleCopyFile(job) {
        const { cPath, converttype, nBundledetailid, nUPid } = job.data;
        await this.fileService.copyFile(cPath, converttype, null, nBundledetailid, null, null, null, nUPid);
    }
};
exports.FileCopyProcessor = FileCopyProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 2 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], FileCopyProcessor.prototype, "handleCopyFile", null);
exports.FileCopyProcessor = FileCopyProcessor = __decorate([
    (0, bull_1.Processor)('filecopy-process'),
    __metadata("design:paramtypes", [typeof (_a = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _a : Object])
], FileCopyProcessor);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConvertProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const fs_1 = __webpack_require__(14);
const config_1 = __webpack_require__(6);
const path_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const convert_service_1 = __webpack_require__(56);
const filecopy_service_1 = __webpack_require__(57);
let ConvertProcessor = class ConvertProcessor {
    constructor(config, utility, logService, fileVerificationService, fileInfo, convertService, filecopyService, fileocrQueue, fileDeleteQueue) {
        this.config = config;
        this.utility = utility;
        this.logService = logService;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.convertService = convertService;
        this.filecopyService = filecopyService;
        this.fileocrQueue = fileocrQueue;
        this.fileDeleteQueue = fileDeleteQueue;
        this.ports = ['2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011',
            '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021',
            '2022', '2023', '2024', '2025', '2026'
        ];
        this.currentPortIndex = 0;
        this.logApp = 'convert';
        this.convertFilePath = this.config.get('PY_CONVERT');
        this.pythonV = this.config.get('pythonV');
        this.saveDir = 'doc/';
        this.domainPath = this.config.get('ATTACHMENT_URL');
        const msgLibPath = this.config.get('MSGLIB_PATH');
    }
    async handleConvert(job) {
        try {
            const { identifier, nCaseid, name, nUDid, nUPid } = job.data.data;
            console.log('Processing convert job:', job.data);
            try {
                let nBundledetailid = job.data.nBundledetailid;
                const nMasterid = job.data.data;
                const dirPath = `${this.saveDir}case${nCaseid}`;
                const input = job.data.cPath;
                const output = `${dirPath}/${name}.pdf`;
                const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
                const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
                console.log('path ', inputPath, outputPath);
                if (!await fs_1.promises.access(inputPath).then(() => true).catch(() => false)) {
                    console.log('File not exists');
                    let result = await this.convertService.downloadFileToDisk('etabella', input, inputPath);
                }
                try {
                    this.logService.info(`Task processed - Convert Start for single ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                    this.utility.emit({ event: 'CONVERTING-START', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                    this.convertService.convertLog(job.data.data.nMasterid, nBundledetailid, nUDid, 'P');
                    const result = await this.convertToPdf(nBundledetailid, inputPath, outputPath, identifier, job.data.data.nMasterid, nCaseid, job.data.data);
                    this.logService.info(`Task processed - Convert end for single ${inputPath} to ${outputPath} result = ${result}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                    if (!result) {
                        if (nUDid) {
                            await this.convertService.filedataProcess(job.data, job.data.data, nBundledetailid, inputPath, input, true);
                            await this.filecopyService.copyFile(input, '', '', nBundledetailid);
                            this.convertToPDFFailed(nUDid, identifier, job);
                        }
                        else {
                            this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
                        }
                        return result;
                    }
                    if (job.data.data.converttype == 'C') {
                        await fs_1.promises.rm(inputPath, { recursive: true });
                    }
                    this.utility.emit({ event: 'CONVERTING-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                    console.log('File has been converted successfully');
                    if (!await fs_1.promises.access(outputPath).then(() => true).catch(() => false)) {
                        return false;
                    }
                    const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
                    console.log('Verification complete');
                    this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                    this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath} \n ${JSON.stringify(job.data)}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                    const stats = await fs_1.promises.stat(outputPath);
                    const fileSize = stats.size;
                    let filename = job.data.data.cFilename || job.data.data.name;
                    this.logService.info(`FILENAME ${filename}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                    filename = filename.replace(/\.[^/.]+$/, '.pdf');
                    const fileInfo = {
                        nUDid: nUDid,
                        nMasterid: job.data.data.nMasterid,
                        cFilename: filename,
                        nSectionid: job.data.data.nSectionid,
                        nBundleid: job.data.data.nBundleid,
                        nBundledetailid: job.data.data.converttype == 'C' ? nBundledetailid : null,
                        cFiletype: 'PDF',
                        isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                        cPath: output,
                        cFilesize: fileSize.toString(),
                        nPagerotation: verificationResult.pagerotation,
                        cPage: `1-${verificationResult.totalpages}`,
                        bisTranscript: (job.data.data.bisTranscript ? job.data.data.bisTranscript : false),
                        bMetadata: (job.data.data?.bMetadata ? job.data.data?.bMetadata : false),
                        nBaseBDid: nBundledetailid
                    };
                    let res;
                    if (fileInfo.nUDid) {
                        res = await this.fileInfo.updateFileInfo(fileInfo);
                    }
                    else {
                        res = await this.fileInfo.updateConvertFileInfo(fileInfo);
                    }
                    let isComplete = false;
                    if (res.msg == 1) {
                        isComplete = true;
                        try {
                            if (res && res['cOldpath'] && res['cOldpath'] != '') {
                                this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] });
                            }
                        }
                        catch (error) {
                            console.log('Error in fileDeleteQueue:', error);
                        }
                        await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
                        if (job.data.data && job.data.data.bIsocr) {
                            console.log('OCR ', job.data.data, res);
                            job.data.data.filetype = 'pdf';
                            if (!nBundledetailid) {
                                nBundledetailid = res.nBundledetailid;
                                job.data.data.nBundledetailid = res.nBundledetailid;
                            }
                            await this.fileocrQueue.add({ cPath: output, data: job.data.data, nBundledetailid: nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                        }
                        this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });
                    }
                    else {
                        isComplete = false;
                        this.logService.info(`Task processed - FILE-PATH-UPDATED Failed in DB ${inputPath} to ${outputPath}`, `upload/${nUPid ? nUPid : null}/${identifier}`);
                        this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nCaseid: nCaseid, nMasterid: job.data.data.nMasterid, msg: -1 } });
                    }
                    return result;
                }
                catch (error) {
                    console.error(`Error converting file: ${error.message}`);
                    return false;
                }
            }
            catch (error) {
                console.log(error);
                return false;
            }
        }
        catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
    }
    async convertToPDFFailed(nUDid, identifier, job) {
        console.log('Conversion failed');
        let mdl = { nUDid: nUDid, cStatus: 'CF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
        await this.fileInfo.replaceFIleDetail(mdl);
        this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
    }
    async convertToPdf(nBundledetailid, inputFile, outputFile, identifier, nMasterid, nCaseid, filedata) {
        if (!(/\.(msg)$/i.test(inputFile.toLowerCase()))) {
            const res = await this.convertService.convertToPdf(inputFile, outputFile, identifier, nMasterid, filedata.cFilename, filedata.nUPid, { nBundledetailid, nUDid: filedata.nUDid });
            return res;
        }
        else {
            let res = await this.convertService.convertEmail(nCaseid, nBundledetailid, inputFile, outputFile, filedata);
            return res;
        }
    }
    getNextPort() {
        const port = this.ports[this.currentPortIndex];
        this.currentPortIndex = (this.currentPortIndex + 1) % this.ports.length;
        return port;
    }
};
exports.ConvertProcessor = ConvertProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 6 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], ConvertProcessor.prototype, "handleConvert", null);
exports.ConvertProcessor = ConvertProcessor = __decorate([
    (0, bull_1.Processor)('convert'),
    __param(7, (0, bull_1.InjectQueue)('fileocr-process')),
    __param(8, (0, bull_1.InjectQueue)('delete-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _d : Object, typeof (_e = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _e : Object, typeof (_f = typeof convert_service_1.ConvertService !== "undefined" && convert_service_1.ConvertService) === "function" ? _f : Object, typeof (_g = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _g : Object, typeof (_h = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _h : Object, typeof (_j = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _j : Object])
], ConvertProcessor);


/***/ }),
/* 94 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
exports.FileconvertController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const convert_interface_1 = __webpack_require__(95);
const convert_service_1 = __webpack_require__(56);
const email_service_1 = __webpack_require__(79);
let FileconvertController = class FileconvertController {
    constructor(ncfService, emailS) {
        this.ncfService = ncfService;
        this.emailS = emailS;
    }
    async postExportfile(body) {
        return await this.ncfService.fileConvert(body);
    }
    async emailParse(body) {
        return await this.emailS.emailParse(body);
    }
    async getfileurl(body) {
        const url = await this.emailS.getSignedUrl(body.cPath);
        return { url };
    }
    async convertfile_multi(body) {
        return await this.ncfService.convertfile_multi(body);
    }
    async getQueueLength(query) {
        const queueLength = await this.ncfService.getQueueLength(query.nCaseid);
        return { queueLength };
    }
};
exports.FileconvertController = FileconvertController;
__decorate([
    (0, common_1.Post)('convertfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof convert_interface_1.fileConvertReq !== "undefined" && convert_interface_1.fileConvertReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], FileconvertController.prototype, "postExportfile", null);
__decorate([
    (0, common_1.Post)('email_parse'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof convert_interface_1.fileConvertReq !== "undefined" && convert_interface_1.fileConvertReq) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], FileconvertController.prototype, "emailParse", null);
__decorate([
    (0, common_1.Get)('get-file-url'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof convert_interface_1.fileURLReq !== "undefined" && convert_interface_1.fileURLReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], FileconvertController.prototype, "getfileurl", null);
__decorate([
    (0, common_1.Post)('convertfile_multi'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof convert_interface_1.convertFileMulti !== "undefined" && convert_interface_1.convertFileMulti) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], FileconvertController.prototype, "convertfile_multi", null);
__decorate([
    (0, common_1.Get)('convertlength'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof convert_interface_1.convertQueue !== "undefined" && convert_interface_1.convertQueue) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], FileconvertController.prototype, "getQueueLength", null);
exports.FileconvertController = FileconvertController = __decorate([
    (0, swagger_1.ApiTags)('nativefileconvert'),
    (0, common_1.Controller)('fileconvert'),
    __metadata("design:paramtypes", [typeof (_a = typeof convert_service_1.ConvertService !== "undefined" && convert_service_1.ConvertService) === "function" ? _a : Object, typeof (_b = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _b : Object])
], FileconvertController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.convertQueue = exports.convertFileMulti = exports.FileAttachment = exports.EmailparseReq = exports.updateConvertNativeFileReq = exports.fileOcrReq = exports.fileURLReq = exports.fileConvertReq = void 0;
const swagger_1 = __webpack_require__(27);
const class_validator_1 = __webpack_require__(29);
const is_uuid_nullable_decorator_1 = __webpack_require__(30);
class fileConvertReq {
}
exports.fileConvertReq = fileConvertReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileConvertReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileConvertReq.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileConvertReq.prototype, "nMasterid", void 0);
class fileURLReq {
}
exports.fileURLReq = fileURLReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], fileURLReq.prototype, "cPath", void 0);
class fileOcrReq {
}
exports.fileOcrReq = fileOcrReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'c3d4e5f6-g7h8-9i0j-1k2l-m3n4o5p6q7r8', description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileOcrReq.prototype, "nBundledetailid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: '' }),
    (0, class_validator_1.IsNumber)({}, { message: 'nOcrtype must be a number conforming to the specified constraints' }),
    __metadata("design:type", Number)
], fileOcrReq.prototype, "nOcrtype", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], fileOcrReq.prototype, "nMasterid", void 0);
class updateConvertNativeFileReq {
}
exports.updateConvertNativeFileReq = updateConvertNativeFileReq;
class EmailparseReq {
}
exports.EmailparseReq = EmailparseReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cPath in only string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "cPath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'nCaseid is now a UUID string' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'cOutputpath in only string' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "cOutputpath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 4, description: '' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "nId", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], EmailparseReq.prototype, "nMasterid", void 0);
class FileAttachment {
}
exports.FileAttachment = FileAttachment;
class convertFileMulti {
}
exports.convertFileMulti = convertFileMulti;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'd4e5f6g7-h8i9-0j1k-2l3m-n4o5p6q7r8s9', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'e5f6g7h8-i9j0-1k2l-3m4n-o5p6q7r8s9t0', description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "jBids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: 'Bundle detail ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "jBDids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: [], description: 'File types', required: false }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], convertFileMulti.prototype, "jFtypes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: true, description: 'Metadata', required: false }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], convertFileMulti.prototype, "bMetadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'Convert Type', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "cConvertType", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], convertFileMulti.prototype, "nMasterid", void 0);
class convertQueue {
}
exports.convertQueue = convertQueue;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'f6g7h8i9-j0k1-2l3m-4n5o-p6q7r8s9t0u1', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], convertQueue.prototype, "nCaseid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], convertQueue.prototype, "nMasterid", void 0);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NativefileconvertService = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(20);
const verifypdf_service_1 = __webpack_require__(36);
const config_1 = __webpack_require__(6);
const fs_1 = __webpack_require__(14);
const child_process_1 = __webpack_require__(37);
const path_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
const bull_1 = __webpack_require__(11);
const bull_2 = __webpack_require__(12);
let NativefileconvertService = class NativefileconvertService {
    constructor(db, config, fileVerificationService, utility, fileCopyQueue) {
        this.db = db;
        this.config = config;
        this.fileVerificationService = fileVerificationService;
        this.utility = utility;
        this.fileCopyQueue = fileCopyQueue;
        this.convertFilePath = this.config.get('PY_CONVERT');
        this.pythonV = this.config.get('pythonV');
    }
    async fileConvert(body) {
        let res = await this.db.executeRef('get_filedata', body);
        if (res.success) {
            let data = res.data[0][0];
            data.nMasterid = body.nMasterid;
            data.name = data.cPath.replace(`.${data.cPath.split('.').pop()}`, '');
            data.filetype = data.cPath.split('.').pop();
            this.handleConvert(res.data[0][0]);
            return { msg: 1 };
        }
        else {
            return { msg: -1, value: 'Failed to convert', error: res.error };
        }
    }
    async handleConvert(data) {
        try {
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'P' } });
            const { filetype, name, nBundledetailid } = data;
            const input = `${name}.${filetype}`;
            const output = `${name}.pdf`;
            const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
            if (!await this.fileExists(inputPath)) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                console.error('File not found:', inputPath);
                return false;
            }
            console.log('Converting file:', inputPath, outputPath);
            const conversionResult = await this.convertToPdf(inputPath, outputPath, data);
            if (!conversionResult) {
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'F' } });
                return false;
            }
            console.log('File has been converted successfully');
            if (!await this.fileExists(outputPath)) {
                return false;
            }
            await fs_1.promises.rm(inputPath, { recursive: true });
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'V' } });
            const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
            console.log('Verification complete:', verificationResult);
            this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'VS' } });
            const stats = await fs_1.promises.stat(outputPath);
            const fileSize = stats.size;
            let filename = data.cFilename;
            filename = filename.replace(/\.[^/.]+$/, '.pdf');
            const fileInfo = {
                nMasterid: data.nMasterid,
                cFilename: filename,
                nSectionid: null,
                nBundleid: null,
                nBundledetailid: nBundledetailid,
                cFiletype: 'PDF',
                isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                cPath: output,
                cFilesize: fileSize.toString(),
                nPagerotation: verificationResult.pagerotation,
                cPage: `1-${verificationResult.totalpages}`,
                bisTranscript: false
            };
            let res = await this.db.executeRef('upload_update_convertinfo', fileInfo);
            if (res.success) {
                await this.fileCopyQueue.add({ cPath: output, nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                this.utility.emit({ event: 'CONVERTING-PROCESS', data: { nBundledetailid: data.nBundledetailid, nMasterid: data.nMasterid, cStatus: 'S', cPath: output, cFilename: filename, cFiletype: 'PDF', cPage: `1-${verificationResult.totalpages}` } });
            }
            else {
            }
        }
        catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
    }
    convertToPdf(inputFile, outputFile, filedata) {
        return new Promise((resolve, reject) => {
            const pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.convertFilePath, inputFile, outputFile]);
            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log('STDOUT:', message);
                if (message.startsWith('Progress:')) {
                    console.log('Progress:', message.split(' ')[1]);
                    this.utility.emit({ event: 'CONVERTING-PROGRESS', data: { nBundledetailid: filedata.nBundledetailid, nMasterid: filedata.nMasterid, cStatus: 'I', nProgress: message.split(' ')[1] } });
                }
            });
            pythonProcess.stderr.on('data', (data) => {
                console.error('STDERR:', data.toString());
            });
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                }
                else {
                    reject(new Error(`Python process exited with code ${code}`));
                }
            });
            pythonProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python process: ${error.message}`));
            });
        });
    }
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.NativefileconvertService = NativefileconvertService;
exports.NativefileconvertService = NativefileconvertService = __decorate([
    (0, common_1.Injectable)(),
    __param(4, (0, bull_2.InjectQueue)('filecopy-process')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object, typeof (_e = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _e : Object])
], NativefileconvertService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OcrProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const fs_1 = __webpack_require__(14);
const upload_service_1 = __webpack_require__(5);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(37);
const path_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const ocr_service_1 = __webpack_require__(83);
const redis_db_service_1 = __webpack_require__(8);
let OcrProcessor = class OcrProcessor {
    constructor(upld, config, utility, logService, fileVerificationService, fileInfo, ocrService, rds, fileCopyQueue) {
        this.upld = upld;
        this.config = config;
        this.utility = utility;
        this.logService = logService;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.ocrService = ocrService;
        this.rds = rds;
        this.fileCopyQueue = fileCopyQueue;
        this.logApp = 'upload';
        this.ocrFilePath = this.config.get('PY_OCR');
        this.pythonV = this.config.get('pythonV');
        this.phrases = ['Scanning contents', 'Linearizing', 'PDF/A conversion', 'Deflating JPEGs', 'OCR', 'Recompressing JPEGs'];
    }
    async handleOCR(job) {
        try {
            const { nBundledetailid, cPath } = job.data;
            const { identifier, nCaseid, filetype, name, nUDid, nUPid, cFilename, nMasterid } = job.data.data;
            let data = { "nMasterid": nMasterid, "nBundledetailid": nBundledetailid, "nUDid": nUDid, cStatus: 'P' };
            try {
                await this.fileInfo.OcrUpdate(data);
            }
            catch (error) {
            }
            await this.rds.rpush(`ocr`, nMasterid);
            await this.rds.rpush(`ocr:${nMasterid}`, nBundledetailid);
            await this.rds.setValue(`ocr:${nMasterid}:${nBundledetailid}`, JSON.stringify({ path: cPath, nOcrtype: job.data.data.nOcrtype, identifier: identifier, nUDid: nUDid }), 24 * 3600);
            this.utility.emit({ event: 'OCR-JOB', data: { identifier: identifier, nMasterid: nMasterid, id: `ocr:${nMasterid}:${nBundledetailid}`, "nUDid": nUDid } });
            return;
            const dirPath = `${this.upld.docPath}/case${nCaseid}`;
            const input = `${dirPath}/${name}.${filetype}`;
            const output = `${dirPath}/${name}.${filetype}`;
            const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
            console.log('Step 1');
            if (!await fs_1.promises.access(inputPath).then(() => true).catch(() => false)) {
                console.log(`Input file does not exist: ${inputPath}`);
                return false;
            }
            try {
                this.utility.emit({ event: 'OCR-START', data: { identifier, nMasterid: job.data.data.nMasterid } });
                if (nUPid)
                    this.logService.info(`Task processed - OCR Start for single ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);
                const result = await this.ocrService.ocrToPdf(inputPath, outputPath, job.data.data.nOcrtype, identifier, job.data.data.nMasterid, cFilename, nUPid);
                this.logService.info(`Task processed - OCR end for single ${inputPath} to ${outputPath} result = ${result}`, `upload/${nUPid}/${identifier}`);
                if (!result) {
                    if (nUDid) {
                        this.ocrToPDFFailed(input, nUDid, identifier, job);
                    }
                    return result;
                }
                this.utility.emit({ event: 'OCR-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid } });
                console.log('File has been ocr successfully');
                if (!await fs_1.promises.access(outputPath).then(() => true).catch(() => false)) {
                    return false;
                }
                const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
                console.log('Verification complete:', verificationResult);
                this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid } });
                if (nUPid)
                    this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);
                const stats = await fs_1.promises.stat(outputPath);
                const fileSize = stats.size;
                let filename = job.data.data.cFilename;
                filename = filename.replace(/\.[^/.]+$/, '.pdf');
                const fileInfo = {
                    nUDid: nUDid,
                    nMasterid: job.data.data.nMasterid,
                    cFilename: filename,
                    nSectionid: job.data.data.nSectionid,
                    nBundleid: job.data.data.nBundleid,
                    nBundledetailid: nBundledetailid,
                    cFiletype: 'PDF',
                    isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                    cPath: output,
                    cFilesize: fileSize.toString(),
                    nPagerotation: verificationResult.pagerotation,
                    cPage: `1-${verificationResult.totalpages}`,
                    bisTranscript: (job.data.data.bisTranscript ? job.data.data.bisTranscript : false),
                };
                console.log('\n\r\n\r Update file info', fileInfo);
                let res = await this.fileInfo.updateFileInfo(fileInfo);
                let isComplete = false;
                if (res.msg == 1) {
                    isComplete = true;
                    await this.fileCopyQueue.add({ cPath: output }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                    if (nUPid)
                        this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);
                    this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } });
                    if (job.data.bisTranscript) {
                        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
                    }
                }
                else {
                    isComplete = false;
                    this.ocrToPDFFailed(input, nUDid, identifier, job);
                    if (nUPid)
                        this.logService.info(`Task processed - FILE-OCR-Failed ${inputPath} to ${outputPath}`, `upload/${nUPid}/${identifier}`);
                    this.ocrToPDFFailed(input, nUDid, identifier, job);
                    this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, msg: -1 } });
                    if (job.data.bisTranscript) {
                        this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, msg: 1 } }, 'REALTIME-FILE-UPLOAD');
                    }
                }
                this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, msg: 1 } });
                return result;
            }
            catch (error) {
                if (nUPid)
                    this.logService.info(`Task processed - FILE-OCR-Catch Error  ${inputPath} to ${outputPath} Error ${error.message}`, `upload/${nUPid}/${identifier}`);
                console.error(`FILE-OCR-Catch Error ${error.message}`, error);
                this.ocrToPDFFailed(input, nUDid, identifier, job);
                return false;
            }
        }
        catch (error) {
            console.error('Error processing ocr job:', error);
            return false;
        }
    }
    async ocrToPDFFailed(input, nUDid, identifier, job) {
        console.log('OCR failed');
        let mdl = { nUDid: nUDid, cStatus: 'OF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
        await this.fileInfo.replaceFIleDetail(mdl);
        await this.fileCopyQueue.add({ cPath: input }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
        this.utility.emit({ event: 'OCR-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid } });
    }
    handleData(resulttype, data, identifier, nMasterid, utility) {
        try {
            const dataString = data.toString().trim();
            console.log('dataString', this.phrases.some(phrase => dataString.includes(phrase)));
            if (this.phrases.some(phrase => dataString.trim().includes(phrase))) {
                resulttype = this.phrases.find(phrase => dataString.includes(phrase));
            }
            console.log('resulttype', resulttype);
            const trimmedData = dataString.trim();
            if (resulttype && trimmedData.match(/\d+%/)) {
                console.log('OCR Progress:', trimmedData);
                let text = trimmedData.replace(/ {2}/g, ' ').replace(/[---━]+/g, ' ');
                if (!text.includes(resulttype)) {
                    text = resulttype + ' ' + text;
                }
                text = text.split(`\r`)[0];
                utility.emit({ event: 'OCR-PROGRESS', data: { identifier, nMasterid, message: text } });
            }
            return resulttype;
        }
        catch (error) {
        }
    }
    ocrToPdf(inputFile, outputFile, sharp_image, identifier, nMasterid, nUDid) {
        return new Promise((resolve, reject) => {
            let resulttype;
            console.log('OCR cmd ', this.pythonV, this.ocrFilePath, inputFile, outputFile, sharp_image);
            const pythonProcess = (0, child_process_1.spawn)(this.pythonV, [this.ocrFilePath, inputFile, outputFile, sharp_image], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: "UTF-8",
                    TMP_PATH: this.config.get('TMP_PATH')
                }
            });
            pythonProcess.stdout.on('data', (data) => {
                const message = data.toString().trim();
                console.log('STDOUT:', message);
            });
            pythonProcess.stderr.on('data', async (data) => {
                console.error('STDERR:', data.toString());
                resulttype = this.handleData(resulttype, data, identifier, nMasterid, this.utility);
            });
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
            pythonProcess.on('error', (error) => {
                resolve(false);
            });
        });
    }
};
exports.OcrProcessor = OcrProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 8 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_k = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], OcrProcessor.prototype, "handleOCR", null);
exports.OcrProcessor = OcrProcessor = __decorate([
    (0, bull_1.Processor)('fileocr-process'),
    __param(8, (0, bull_1.InjectQueue)('filecopy-process')),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _e : Object, typeof (_f = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _f : Object, typeof (_g = typeof ocr_service_1.OcrService !== "undefined" && ocr_service_1.OcrService) === "function" ? _g : Object, typeof (_h = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _h : Object, typeof (_j = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _j : Object])
], OcrProcessor);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OcrController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const ocr_service_1 = __webpack_require__(83);
const convert_interface_1 = __webpack_require__(95);
let OcrController = class OcrController {
    constructor(ncfService) {
        this.ncfService = ncfService;
    }
    async postExportfile(body) {
        return await this.ncfService.fileOcr(body);
    }
};
exports.OcrController = OcrController;
__decorate([
    (0, common_1.Post)('ocrfile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof convert_interface_1.fileOcrReq !== "undefined" && convert_interface_1.fileOcrReq) === "function" ? _b : Object]),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], OcrController.prototype, "postExportfile", null);
exports.OcrController = OcrController = __decorate([
    (0, swagger_1.ApiTags)('fileocr'),
    (0, common_1.Controller)('ocr'),
    __metadata("design:paramtypes", [typeof (_a = typeof ocr_service_1.OcrService !== "undefined" && ocr_service_1.OcrService) === "function" ? _a : Object])
], OcrController);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SnapProcessor = void 0;
const bull_1 = __webpack_require__(12);
const config_1 = __webpack_require__(6);
const bull_2 = __webpack_require__(11);
const fse = __webpack_require__(100);
const snap_service_1 = __webpack_require__(101);
let SnapProcessor = class SnapProcessor {
    constructor(config, snapService) {
        this.config = config;
        this.snapService = snapService;
        this.snap_path = this.config.get('SCREENSHOT_PATH');
        this.ASSETS_PATH = this.config.get('ASSETS');
    }
    async handleSnap(job) {
        const filepath = `${this.ASSETS_PATH}${job.data.cPath || ''}`;
        const snapPath = `${this.snap_path}case${job.data.nCaseid}/${job.data.nBundledetailid}.png`;
        console.log('filepath', filepath);
        console.log('snapPath', snapPath);
        try {
            await fse.ensureDir(`${this.snap_path}case${job.data.nCaseid}`);
            const extnstion = filepath.split('.').pop().toUpperCase();
            if (extnstion === 'PDF') {
                await this.snapService.snapPdf(filepath, snapPath);
            }
        }
        catch (error) {
        }
    }
};
exports.SnapProcessor = SnapProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 2 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], SnapProcessor.prototype, "handleSnap", null);
exports.SnapProcessor = SnapProcessor = __decorate([
    (0, bull_1.Processor)('snap-process'),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof snap_service_1.SnapService !== "undefined" && snap_service_1.SnapService) === "function" ? _b : Object])
], SnapProcessor);


/***/ }),
/* 100 */
/***/ ((module) => {

module.exports = require("fs-extra");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SnapService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(6);
const child_process_1 = __webpack_require__(37);
let SnapService = class SnapService {
    constructor(config) {
        this.config = config;
    }
    async snapPdf(filepath, snapPath) {
        try {
            const pythonProcess = (0, child_process_1.spawn)(this.config.get('pythonV'), [
                this.config.get('PY_SCREENSHOT'),
                filepath,
                snapPath,
            ]);
            pythonProcess.stdout.on('data', (data) => {
                console.log('DATA:', data.toString());
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
                        resolve(0);
                        return;
                    }
                    resolve(1);
                });
            });
        }
        catch (error) {
            console.error('ERROR:', error);
            return 0;
        }
    }
};
exports.SnapService = SnapService;
exports.SnapService = SnapService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], SnapService);


/***/ }),
/* 102 */
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
const config_1 = __webpack_require__(6);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SequenceMergeProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const upload_service_1 = __webpack_require__(5);
const log_service_1 = __webpack_require__(15);
let SequenceMergeProcessor = class SequenceMergeProcessor {
    constructor(upld, logService, fileMergeQueue) {
        this.upld = upld;
        this.logService = logService;
        this.fileMergeQueue = fileMergeQueue;
        console.log('SequenceMergeProcessor initialized');
    }
    async handleFileMerge(job) {
        try {
            const { fileId, nUPid, startChunk, endChunk, body, path } = job.data;
            this.logService.info(`Sequence Merge Started for chunks ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);
            await this.fileMergeQueue.add('merge', { body, fileId, nUPid, startChunk, endChunk, path });
        }
        catch (error) {
        }
    }
};
exports.SequenceMergeProcessor = SequenceMergeProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_d = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _d : Object]),
    __metadata("design:returntype", Promise)
], SequenceMergeProcessor.prototype, "handleFileMerge", null);
exports.SequenceMergeProcessor = SequenceMergeProcessor = __decorate([
    (0, bull_1.Processor)('sequence-file-merge'),
    __param(2, (0, bull_1.InjectQueue)('file-specific-merge')),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object, typeof (_c = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _c : Object])
], SequenceMergeProcessor);


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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileMergeProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const fs_1 = __webpack_require__(14);
const path_1 = __webpack_require__(13);
const upload_service_1 = __webpack_require__(5);
const utility_service_1 = __webpack_require__(19);
const bull_3 = __webpack_require__(11);
const bull_4 = __webpack_require__(12);
const redis_db_service_1 = __webpack_require__(8);
const config_1 = __webpack_require__(6);
const log_service_1 = __webpack_require__(15);
let FileMergeProcessor = class FileMergeProcessor {
    constructor(upld, redisDbService, utility, fileMergeQueue, config, logService) {
        this.upld = upld;
        this.redisDbService = redisDbService;
        this.utility = utility;
        this.fileMergeQueue = fileMergeQueue;
        this.config = config;
        this.logService = logService;
    }
    async handleSequentialChunkMerge(job) {
        const { fileId, nUPid, startChunk, endChunk, body, path } = job.data;
        try {
            this.logService.info(`Merging chunks   ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);
            const savePath = path;
            await this.mergeChunks(startChunk, endChunk, fileId, savePath);
            this.logService.info(`Chunk merge complete   ${startChunk} - ${endChunk} `, `upload/${nUPid}/${fileId}`);
            if (body) {
                this.logService.info(`Push To Final Merge  ${JSON.stringify(body)} `, `upload/${nUPid}/${fileId}`);
                await this.fileMergeQueue.add(body, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
            }
        }
        catch (error) {
            this.logService.error(`Merge failed  ${error.message} `, `upload/${nUPid}/${fileId}`);
            this.utility.emit({ event: 'MERGING-FAILED', data: { identifier: fileId, nMasterid: job.data.nMasterid } });
        }
    }
    async mergeChunks(start, end, fileId, savePath) {
        return new Promise(async (valid, reject) => {
            try {
                const chunksPath = (0, path_1.join)(this.upld.tempChunkPath, fileId);
                const mergeFilePath = (0, path_1.join)(this.config.get('ASSETS'), savePath);
                const writeStream = (0, fs_1.createWriteStream)(mergeFilePath, { flags: 'a' });
                const processChunk = async (chunkIndex) => {
                    if (chunkIndex > end) {
                        writeStream.end();
                        return;
                    }
                    if (isNaN(chunkIndex)) {
                        console.error(`Invalid chunk index: ${chunkIndex} for file ${fileId}`);
                        reject(new Error('Chunk index is NaN.'));
                        return;
                    }
                    const chunkFilePath = (0, path_1.join)(chunksPath, `${chunkIndex}`);
                    if ((0, fs_1.existsSync)(chunkFilePath)) {
                        return new Promise((resolveChunk, rejectChunk) => {
                            const readStream = (0, fs_1.createReadStream)(chunkFilePath);
                            readStream.pipe(writeStream, { end: false });
                            readStream.on('end', () => {
                                (0, fs_1.unlinkSync)(chunkFilePath);
                                resolveChunk();
                            });
                            readStream.on('error', (error) => {
                                rejectChunk(error);
                            });
                        })
                            .then(() => processChunk(chunkIndex + 1))
                            .catch(reject);
                    }
                    else {
                        console.warn(`Chunk ${chunkIndex} does not exist for file ${fileId}, skipping...`);
                        processChunk(chunkIndex + 1);
                    }
                };
                processChunk(start)
                    .then(() => {
                    writeStream.on('finish', () => {
                        valid();
                    });
                })
                    .catch((error) => {
                    writeStream.destroy();
                    console.error(`Error during merging process for file ${fileId}:`, error);
                    reject(error);
                });
                writeStream.on('error', (error) => {
                    console.error(`Error writing to merged file for file ${fileId}:`, error);
                    reject(error);
                });
            }
            catch (error) {
                console.error(`Error during merging process for file ${fileId}:`, error);
                reject(error);
            }
        });
    }
};
exports.FileMergeProcessor = FileMergeProcessor;
__decorate([
    (0, bull_1.Process)('merge'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _g : Object]),
    __metadata("design:returntype", Promise)
], FileMergeProcessor.prototype, "handleSequentialChunkMerge", null);
exports.FileMergeProcessor = FileMergeProcessor = __decorate([
    (0, bull_1.Processor)('file-specific-merge'),
    __param(3, (0, bull_4.InjectQueue)('file-merge')),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _b : Object, typeof (_c = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _c : Object, typeof (_d = typeof bull_3.Queue !== "undefined" && bull_3.Queue) === "function" ? _d : Object, typeof (_e = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _e : Object, typeof (_f = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _f : Object])
], FileMergeProcessor);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConvertEmailProcessor = void 0;
const bull_1 = __webpack_require__(12);
const bull_2 = __webpack_require__(11);
const config_1 = __webpack_require__(6);
const fs_1 = __webpack_require__(14);
const path_1 = __webpack_require__(13);
const utility_service_1 = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
const verifypdf_service_1 = __webpack_require__(36);
const updatefileinfo_service_1 = __webpack_require__(38);
const convert_service_1 = __webpack_require__(56);
const email_service_1 = __webpack_require__(79);
const filecopy_service_1 = __webpack_require__(57);
let ConvertEmailProcessor = class ConvertEmailProcessor {
    constructor(config, utility, logService, fileVerificationService, fileInfo, convertService, emailS, filecopyService, fileocrQueue, fileDeleteQueue) {
        this.config = config;
        this.utility = utility;
        this.logService = logService;
        this.fileVerificationService = fileVerificationService;
        this.fileInfo = fileInfo;
        this.convertService = convertService;
        this.emailS = emailS;
        this.filecopyService = filecopyService;
        this.fileocrQueue = fileocrQueue;
        this.fileDeleteQueue = fileDeleteQueue;
        this.saveDir = 'doc/';
        const msgLibPath = this.config.get('MSGLIB_PATH');
    }
    async handleConvert(job) {
        try {
            const { identifier, nCaseid, name, nUDid, nUPid, nMasterid } = job.data.data;
            const isConvert = job.data.data.converttype != 'N';
            const nBundledetailid = job.data.nBundledetailid;
            const dirPath = `${this.saveDir}case${nCaseid}`;
            const input = job.data.cPath;
            const output = `${dirPath}/${name}.pdf`;
            const inputPath = (0, path_1.resolve)(this.config.get('ASSETS'), input);
            const outputPath = (0, path_1.resolve)(this.config.get('ASSETS'), output);
            if (!await fs_1.promises.access(inputPath).then(() => true).catch(() => false)) {
                console.log('File not exists');
                let result = await this.convertService.downloadFileToDisk('etabella', input, inputPath);
            }
            try {
                this.logService.info(`Task processed - Convert for ${JSON.stringify(job.data)}`, `email/${identifier}`);
                if (isConvert) {
                    this.utility.emit({ event: 'CONVERTING-START', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                }
                if (isConvert) {
                    this.convertService.convertLog(job.data.data.nMasterid, nBundledetailid, nUDid, 'P');
                }
                const result = await this.convertEmail(dirPath, nCaseid, nBundledetailid, inputPath, outputPath, job.data.cPath, job.data.data, isConvert);
                this.logService.info(`Task processed - Convert end for single ${inputPath} to ${outputPath} result = ${result}`, `email/${identifier}`);
                if (!isConvert && result) {
                    if (nUDid) {
                        await this.convertService.filedataProcess(job.data, job.data.data, nBundledetailid, inputPath, input, true, false);
                        if (isConvert && !result) {
                            this.convertToPDFFailed(nUDid, identifier, job);
                        }
                    }
                    return result;
                }
                if (job.data.data.converttype == 'C' || job.data.data.converttype == 'C') {
                    await fs_1.promises.rm(inputPath, { recursive: true });
                }
                if (isConvert) {
                    this.utility.emit({ event: 'CONVERTING-SUCCESS', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                }
                console.log('File has been converted successfully');
                if (!isConvert) {
                    return true;
                }
                if (job.data.data && job.data.data.bIsocr) {
                    job.data.data.filetype = 'pdf';
                    await this.fileocrQueue.add({ cPath: output, data: job.data.data, nBundledetailid: nBundledetailid }, { removeOnComplete: true, removeOnFail: true, timeout: 1000 * 60 * 60 * 1, attempts: 3, backoff: 1000 * 60 * 5 });
                }
                if (!await fs_1.promises.access(outputPath).then(() => true).catch(() => false)) {
                    return false;
                }
                const verificationResult = await this.fileVerificationService.verifyFile(outputPath);
                console.log('Verification complete:', verificationResult);
                this.utility.emit({ event: 'VERIFY-CPOMPLETE', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid } });
                this.logService.info(`Task processed - VERIFY-CPOMPLETE ${inputPath} to ${outputPath}`, `email/${identifier}`);
                const stats = await fs_1.promises.stat(outputPath);
                const fileSize = stats.size;
                let filename = job.data.data.cFilename || job.data.data.name;
                console.log('\n\n\n\nfilename ', filename);
                filename = filename.replace(/\.[^/.]+$/, '.pdf');
                const fileInfo = {
                    nUDid: nUDid,
                    nMasterid: job.data.data.nMasterid,
                    cFilename: filename,
                    nSectionid: job.data.data.nSectionid,
                    nBundleid: job.data.data.nBundleid,
                    nBundledetailid: job.data.data.converttype == 'C' ? nBundledetailid : null,
                    cFiletype: 'PDF',
                    isValidate: verificationResult.isValidate ? verificationResult.isValidate : false,
                    cPath: output,
                    cFilesize: fileSize.toString(),
                    nPagerotation: verificationResult.pagerotation,
                    cPage: `1-${verificationResult.totalpages}`,
                    bisTranscript: (job.data.data.bisTranscript ? job.data.data.bisTranscript : false),
                    bMetadata: (job.data.data?.bMetadata ? job.data.data?.bMetadata : false),
                    nBaseBDid: nBundledetailid
                };
                console.log('\n\r\n\r Update file info', fileInfo);
                let res;
                if (fileInfo.nUDid) {
                    res = await this.fileInfo.updateFileInfo(fileInfo);
                }
                else {
                    res = await this.fileInfo.updateConvertFileInfo(fileInfo);
                }
                let isComplete = false;
                console.log('result 3', res);
                if (res.msg == 1) {
                    try {
                        if (res && res['cOldpath'] && res['cOldpath'] != '') {
                            this.fileDeleteQueue.add({ jFiles: [res['cOldpath']] });
                        }
                    }
                    catch (error) {
                        console.log('Error in fileDeleteQueue:', error);
                    }
                    isComplete = true;
                    console.log('ADD to copy file queue', output);
                    await this.filecopyService.copyFile(output, '', '', res.nBundledetailid);
                    this.logService.info(`Task processed - FILE-PATH-UPDATED in DB ${inputPath} to ${outputPath}`, `email/${identifier}`);
                    this.utility.emit({ event: 'FILE-INSERT-COMPLETE', data: { ...res, identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, cFiletype: 'PDF', cFilename: filename, converttype: job.data.data.converttype, msg: 1 } });
                }
                else {
                    isComplete = false;
                    this.logService.info(`Task processed - FILE-PATH-UPDATED Failed in DB ${inputPath} to ${outputPath}`, `email/${identifier}`);
                    this.utility.emit({ event: 'FILE-INSERT-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: nCaseid, msg: -1 } });
                }
                return result;
            }
            catch (error) {
                console.error(`Error converting file: ${error.message}`);
                return false;
            }
        }
        catch (error) {
            console.error('Error processing convert job:', error);
            return false;
        }
    }
    async convertToPDFFailed(nUDid, identifier, job) {
        console.log('Conversion failed');
        let mdl = { nUDid: nUDid, cStatus: 'CF', nMasterid: job.data.data.nMasterid, cName: job.data.data.name, cSize: job.data.data.size, cType: job.data.data.filetype };
        await this.fileInfo.replaceFIleDetail(mdl);
        this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier, nMasterid: job.data.data.nMasterid, nCaseid: job.data.data.nCaseid } });
    }
    async convertEmail(dirPath, nCaseid, nId, inputFile, outputFile, cPath, filedata, isConvert) {
        console.log('Step 2');
        this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'S');
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile}`, `email/${filedata.identifier}`);
        const data = { dirPath: dirPath, cPath: cPath, cOutputpath: outputFile, nId: nId, nCaseid: nCaseid, nSectionid: filedata.nSectionid, nBundleid: filedata.nBundleid, nMasterid: filedata.nMasterid };
        const result = await this.emailS.getemailparse(data, filedata.converttype);
        console.log(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`);
        this.logService.info(`Task processed - convert Email ${inputFile} to ${outputFile} status ${result}`, `email/${filedata.identifier}`);
        if (result) {
            try {
                const dirPath = ``;
                console.log('Step 4.2');
                this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'C');
            }
            catch (error) {
                console.error('convertEmail error:', error);
                this.convertService.convertLog(filedata.nMasterid, filedata.nBundledetailid, filedata.nUDid, 'F', error);
                this.logService.info(`Task processed - convert Email error ${inputFile} to ${outputFile}  ${error}`, `email/${filedata.identifier}`);
            }
        }
        else {
            console.log('Step 4.3');
            this.utility.emit({ event: 'CONVERTING-FAILED', data: { identifier: filedata.identifier, nMasterid: filedata.nUserid, nProgress: 0, filename: filedata.cFilename } });
        }
        return result;
    }
    async fileExists(filePath) {
        try {
            await fs_1.promises.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.ConvertEmailProcessor = ConvertEmailProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 4 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _l : Object]),
    __metadata("design:returntype", Promise)
], ConvertEmailProcessor.prototype, "handleConvert", null);
exports.ConvertEmailProcessor = ConvertEmailProcessor = __decorate([
    (0, bull_1.Processor)('convert-email'),
    __param(8, (0, bull_1.InjectQueue)('fileocr-process')),
    __param(9, (0, bull_1.InjectQueue)('delete-files')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof verifypdf_service_1.VerifypdfService !== "undefined" && verifypdf_service_1.VerifypdfService) === "function" ? _d : Object, typeof (_e = typeof updatefileinfo_service_1.UpdatefileinfoService !== "undefined" && updatefileinfo_service_1.UpdatefileinfoService) === "function" ? _e : Object, typeof (_f = typeof convert_service_1.ConvertService !== "undefined" && convert_service_1.ConvertService) === "function" ? _f : Object, typeof (_g = typeof email_service_1.EmailService !== "undefined" && email_service_1.EmailService) === "function" ? _g : Object, typeof (_h = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _h : Object, typeof (_j = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _j : Object, typeof (_k = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _k : Object])
], ConvertEmailProcessor);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProfileController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const profile_service_1 = __webpack_require__(107);
const platform_express_1 = __webpack_require__(32);
const multer_1 = __webpack_require__(34);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
let ProfileController = class ProfileController {
    constructor(profileService) {
        this.profileService = profileService;
    }
    async uploadImage(file, body) {
        return await this.profileService.uploadImage(file, body);
    }
};
exports.ProfileController = ProfileController;
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const destPath = process.env.ASSETS + process.env.USER_PROFILE_PATH + req.body?.rootPath;
                console.log('destPath', destPath);
                fs.promises.mkdir(destPath, { recursive: true })
                    .then(() => cb(null, destPath))
                    .catch(err => cb(err, destPath));
            },
            filename: (req, file, cb) => {
                const fileExt = path.extname(file.originalname);
                const timestamp = Date.now();
                const uniqueName = `user${timestamp}${fileExt}`;
                cb(null, uniqueName);
            }
        })
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof Express !== "undefined" && (_b = Express.Multer) !== void 0 && _b.File) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], ProfileController.prototype, "uploadImage", null);
exports.ProfileController = ProfileController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('update'),
    (0, common_1.Controller)('profile'),
    __metadata("design:paramtypes", [typeof (_a = typeof profile_service_1.ProfileService !== "undefined" && profile_service_1.ProfileService) === "function" ? _a : Object])
], ProfileController);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProfileService = void 0;
const common_1 = __webpack_require__(3);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
const sharp = __webpack_require__(108);
const stream_1 = __webpack_require__(58);
const util_1 = __webpack_require__(59);
const filecopy_service_1 = __webpack_require__(57);
const config_1 = __webpack_require__(6);
const pipelineAsync = (0, util_1.promisify)(stream_1.pipeline);
let ProfileService = class ProfileService {
    constructor(fileService, config) {
        this.fileService = fileService;
        this.config = config;
        this.profilePath = '';
        this.supportedExtensions = ['.jpg', '.jpeg', '.png'];
        this.profilePath = this.config.get('USER_PROFILE_PATH');
    }
    async uploadImage(file, body) {
        try {
            if (!file) {
                return { msg: -1, error: 'File not uploaded' };
            }
            const inputFilePath = path.join(file.destination, file.filename);
            const outputFilePath = path.join(file.destination, `${path.parse(file.filename).name}.webp`);
            console.log('Processing file:', inputFilePath);
            const fileExtension = path.extname(file.originalname).toLowerCase();
            let res;
            if (this.supportedExtensions.includes(fileExtension)) {
                res = await this.imageConversion(inputFilePath, outputFilePath);
            }
            else {
                res = { msg: 1, success: true };
            }
            if (res.msg === 1) {
                const fileName = path.parse(outputFilePath).base;
                const s3Path = `${this.profilePath}${body.rootPath}/${fileName}`;
                console.log('s3Path', s3Path);
                await this.fileService.copyFile(s3Path, 'C');
                return { msg: 1, value: fileName };
            }
            else {
                await this.deleteFile(inputFilePath);
                return { msg: -1, error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, error: error.message };
        }
    }
    async imageConversion(inputFilePath, outputFilePath) {
        try {
            if (!fs.existsSync(inputFilePath)) {
                return { msg: -1, error: 'File does not exist' };
            }
            const inputStream = fs.createReadStream(inputFilePath);
            const outputStream = fs.createWriteStream(outputFilePath);
            await pipelineAsync(inputStream, sharp().resize(500, 500).webp({ quality: 80 }), outputStream);
            console.log('Image processed successfully');
            await this.deleteFile(inputFilePath);
            return { msg: 1, sucess: true };
        }
        catch (error) {
            return { msg: -1, error: 'File Converions error' };
        }
    }
    async deleteFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    reject(err);
                }
                else {
                    console.log('File deleted successfully:', filePath);
                    resolve();
                }
            });
        });
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], ProfileService);


/***/ }),
/* 108 */
/***/ ((module) => {

module.exports = require("sharp");

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
exports.HelpcenterService = void 0;
const common_1 = __webpack_require__(3);
const filecopy_service_1 = __webpack_require__(57);
const config_1 = __webpack_require__(6);
const path = __webpack_require__(13);
let HelpcenterService = class HelpcenterService {
    constructor(fileService, config) {
        this.fileService = fileService;
        this.config = config;
        this.helpcenterPath = '';
        this.ticketPath = '';
        this.helpcenterPath = this.config.get('HELPCENTER_FILE_PATH');
        this.ticketPath = this.config.get('TICKET_FILE_PATH');
    }
    async uploadImage(file, body) {
        try {
            if (!file) {
                return { msg: -1, error: 'File not uploaded' };
            }
            const inputFilePath = path.join(file.destination, file.filename);
            const fileName = path.parse(inputFilePath).base;
            const s3Path = `${this.helpcenterPath}${body.rootPath}/${fileName}`;
            console.log('Processing file:', s3Path);
            await this.fileService.copyFile(s3Path, 'C');
            return { msg: 1, value: fileName };
        }
        catch (error) {
            return { msg: -1, error: error.message };
        }
    }
    async uploadTicketImage(file, body) {
        try {
            if (!file) {
                return { msg: -1, error: 'File not uploaded' };
            }
            const inputFilePath = path.join(file.destination, file.filename);
            const fileName = path.parse(inputFilePath).base;
            const s3Path = `${this.ticketPath}${fileName}`;
            console.log('Processing file:', s3Path);
            await this.fileService.copyFile(s3Path, 'C');
            return { msg: 1, value: fileName };
        }
        catch (error) {
            return { msg: -1, error: error.message };
        }
    }
};
exports.HelpcenterService = HelpcenterService;
exports.HelpcenterService = HelpcenterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof filecopy_service_1.filecopyService !== "undefined" && filecopy_service_1.filecopyService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], HelpcenterService);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deleteFilesProcessor = void 0;
const bull_1 = __webpack_require__(12);
const config_1 = __webpack_require__(6);
const bull_2 = __webpack_require__(11);
const fs = __webpack_require__(60);
const log_service_1 = __webpack_require__(15);
const child_process_1 = __webpack_require__(37);
const util_1 = __webpack_require__(59);
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
            try {
                const s3FilePath = `${this.S3_BUCKET_PATH}${filePath}`;
                const command = `${this.S3_EXC_PATH} del ${s3FilePath}`;
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
                this.logger.error(`Error deleting S3 file: ${filePath}`, this.logApp);
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
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HelpcenterController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(27);
const helpcenter_service_1 = __webpack_require__(109);
const platform_express_1 = __webpack_require__(32);
const multer_1 = __webpack_require__(34);
const fs = __webpack_require__(14);
const path = __webpack_require__(13);
let HelpcenterController = class HelpcenterController {
    constructor(helpCenterService) {
        this.helpCenterService = helpCenterService;
    }
    async uploadImage(file, body) {
        return await this.helpCenterService.uploadImage(file, body);
    }
    async uploadTicketImage(file, body) {
        return await this.helpCenterService.uploadTicketImage(file, body);
    }
};
exports.HelpcenterController = HelpcenterController;
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const destPath = process.env.ASSETS +
                    process.env.HELPCENTER_FILE_PATH +
                    req.body?.rootPath;
                console.log('destPath', destPath);
                fs.promises
                    .mkdir(destPath, { recursive: true })
                    .then(() => cb(null, destPath))
                    .catch((err) => cb(err, destPath));
            },
            filename: (req, file, cb) => {
                const fileExt = path.extname(file.originalname);
                const timestamp = Date.now();
                const uniqueName = `module${timestamp}${fileExt}`;
                cb(null, uniqueName);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof Express !== "undefined" && (_b = Express.Multer) !== void 0 && _b.File) === "function" ? _c : Object, Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], HelpcenterController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('upload-image-ticket'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: (req, file, cb) => {
                const destPath = process.env.ASSETS +
                    process.env.TICKET_FILE_PATH;
                console.log('destPath', destPath);
                fs.promises
                    .mkdir(destPath, { recursive: true })
                    .then(() => cb(null, destPath))
                    .catch((err) => cb(err, destPath));
            },
            filename: (req, file, cb) => {
                const fileExt = path.extname(file.originalname);
                const timestamp = Date.now();
                const uniqueName = `ticket_${timestamp}${fileExt}`;
                cb(null, uniqueName);
            },
        }),
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof Express !== "undefined" && (_e = Express.Multer) !== void 0 && _e.File) === "function" ? _f : Object, Object]),
    __metadata("design:returntype", typeof (_g = typeof Promise !== "undefined" && Promise) === "function" ? _g : Object)
], HelpcenterController.prototype, "uploadTicketImage", null);
exports.HelpcenterController = HelpcenterController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('helpcenterupdate'),
    (0, common_1.Controller)('helpcenter'),
    __metadata("design:paramtypes", [typeof (_a = typeof helpcenter_service_1.HelpcenterService !== "undefined" && helpcenter_service_1.HelpcenterService) === "function" ? _a : Object])
], HelpcenterController);


/***/ }),
/* 112 */
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
/* 113 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 114 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 115 */
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
const upload_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const kafka_config_1 = __webpack_require__(112);
const swagger_1 = __webpack_require__(27);
const compression = __webpack_require__(113);
const cookieParser = __webpack_require__(114);
const dotenv = __webpack_require__(115);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(upload_module_1.UploadModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('upload-group'));
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
        .setTitle('Etabella Core API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/uploadapi' : '')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    await app.listen(process.env.PORT_UPLOADAPI);
}
bootstrap();

})();

/******/ })()
;