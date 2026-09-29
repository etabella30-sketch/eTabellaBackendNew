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
exports.DownloadapiModule = void 0;
const common_1 = __webpack_require__(3);
const downloadapi_controller_1 = __webpack_require__(4);
const downloadapi_service_1 = __webpack_require__(5);
const kafka_module_1 = __webpack_require__(46);
const winston_module_1 = __webpack_require__(47);
const global_1 = __webpack_require__(48);
const kafka_shared_service_1 = __webpack_require__(12);
const log_service_1 = __webpack_require__(17);
const redis_db_service_1 = __webpack_require__(54);
const query_builder_service_1 = __webpack_require__(8);
const db_service_1 = __webpack_require__(6);
const ioredis_1 = __webpack_require__(55);
const config_1 = __webpack_require__(9);
const process_status_service_1 = __webpack_require__(10);
const bull_1 = __webpack_require__(26);
const download_processor_1 = __webpack_require__(56);
const queue_listener_service_1 = __webpack_require__(82);
const download_process_service_1 = __webpack_require__(57);
const process_data_service_1 = __webpack_require__(27);
const redis_service_1 = __webpack_require__(14);
const default_service_1 = __webpack_require__(31);
const date_time_service_1 = __webpack_require__(23);
const update_file_size_service_1 = __webpack_require__(58);
const file_size_service_1 = __webpack_require__(59);
const file_batch_service_1 = __webpack_require__(62);
const file_part_service_1 = __webpack_require__(61);
const batch_split_service_1 = __webpack_require__(63);
const smallbatch_service_1 = __webpack_require__(69);
const largebatch_service_1 = __webpack_require__(64);
const redis_queue_service_1 = __webpack_require__(65);
const part_upload_service_1 = __webpack_require__(66);
const small_part_upload_service_1 = __webpack_require__(70);
const s3_module_1 = __webpack_require__(83);
const upload_s3_service_1 = __webpack_require__(67);
const header_service_1 = __webpack_require__(68);
const transform_name_service_1 = __webpack_require__(44);
const stream_s3_service_1 = __webpack_require__(71);
const config_key_service_1 = __webpack_require__(24);
const finalize_archiver_service_1 = __webpack_require__(72);
const delete_processor_1 = __webpack_require__(84);
const jwt_middleware_1 = __webpack_require__(85);
const kafka_service_1 = __webpack_require__(11);
const generate_presigned_url_service_1 = __webpack_require__(73);
const s3_file_service_1 = __webpack_require__(37);
const s3_file_processor_1 = __webpack_require__(87);
const schedule_1 = __webpack_require__(90);
const output_expiry_service_1 = __webpack_require__(91);
const package_reports_service_1 = __webpack_require__(74);
const annotate_evidence_service_1 = __webpack_require__(81);
const renderers_service_1 = __webpack_require__(76);
let DownloadapiModule = class DownloadapiModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes(downloadapi_controller_1.DownloadapiController);
    }
};
exports.DownloadapiModule = DownloadapiModule;
exports.DownloadapiModule = DownloadapiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            kafka_module_1.KafkaModule.register('etabella-download-v2', 'download-group-v2'),
            global_1.GlobalModule,
            winston_module_1.WinstonConfigModule.forRoot('download'),
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
                settings: {
                    lockDuration: 1000 * 60 * 5,
                    stalledInterval: 30_000,
                    maxStalledCount: 3,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5_000,
                    },
                    removeOnComplete: true,
                    removeOnFail: {
                        count: 100,
                    },
                },
                limiter: {
                    max: 1_000,
                    duration: 60_000,
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'delete-tar-queue',
                settings: {
                    lockDuration: 1000 * 60 * 15,
                    stalledInterval: 30_000,
                    maxStalledCount: 3,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5_000,
                    },
                    removeOnComplete: true,
                    removeOnFail: {
                        count: 100,
                    },
                },
                limiter: {
                    max: 10_000,
                    duration: 60_000,
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 's3-file-processing',
                defaultJobOptions: {
                    removeOnComplete: 10,
                    removeOnFail: 5,
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 2000,
                    },
                },
            }),
            s3_module_1.S3Module,
            schedule_1.ScheduleModule.forRoot(),
        ],
        controllers: [downloadapi_controller_1.DownloadapiController],
        providers: [downloadapi_service_1.DownloadapiService,
            kafka_shared_service_1.KafkaGlobalService,
            log_service_1.LogService,
            db_service_1.DbService, query_builder_service_1.QueryBuilderService, redis_db_service_1.RedisDbService, process_status_service_1.ProcessStatusService, download_processor_1.DownloadProcessor,
            queue_listener_service_1.QueueListenerService, download_process_service_1.DownloadProcessService, process_data_service_1.ProcessDataService,
            update_file_size_service_1.UpdateFileSizeService, redis_service_1.RedisService, file_size_service_1.FileSizeService, file_batch_service_1.FileBatchService, file_part_service_1.FilePartService,
            default_service_1.DefaultService, batch_split_service_1.BatchSplitService, date_time_service_1.DateTimeService, smallbatch_service_1.SmallbatchService, largebatch_service_1.LargebatchService, redis_queue_service_1.RedisQueueService, part_upload_service_1.PartUploadService,
            small_part_upload_service_1.SmallPartUploadService, upload_s3_service_1.UploadS3Service, delete_processor_1.DeleteTarProcessor, header_service_1.HeaderService, transform_name_service_1.TransformNameService,
            stream_s3_service_1.StreamS3Service, config_key_service_1.ConfigKeyService, finalize_archiver_service_1.FinalizeArchiverService, kafka_service_1.KafkaService, generate_presigned_url_service_1.GeneratePresignedUrlService, s3_file_service_1.S3FileService, s3_file_processor_1.S3FileProcessor,
            output_expiry_service_1.OutputExpiryService,
            package_reports_service_1.PackageReportsService, renderers_service_1.DataExportRenderer, annotate_evidence_service_1.AnnotateEvidenceService
        ],
    })
], DownloadapiModule);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadapiController = void 0;
const common_1 = __webpack_require__(3);
const downloadapi_service_1 = __webpack_require__(5);
const download_dto_1 = __webpack_require__(32);
const swagger_1 = __webpack_require__(36);
const s3_file_service_1 = __webpack_require__(37);
let DownloadapiController = class DownloadapiController {
    constructor(downloadapiService, s3FileService) {
        this.downloadapiService = downloadapiService;
        this.s3FileService = s3FileService;
    }
    getHello() {
        return [];
    }
    async startDownload(body) {
        return body?.isHyperlink && this.s3FileService.isRewriteConfigured()
            ? await this.s3FileService.insertDownloadJob(body)
            : await this.downloadapiService.insertDownloadJob(body);
    }
    async startDownloadJob(body) {
        return await this.downloadapiService.startDownloadJob(body);
    }
    async deleteDownloadJob(body) {
        return await this.downloadapiService.stopAndRemoveJob(body);
    }
    async retryJob(body) {
        return await this.downloadapiService.retryFailedJob(body);
    }
    async deleteJob(body) {
        return await this.downloadapiService.deleteJob(body);
    }
    async getDownload(query) {
        return await this.downloadapiService.getDownloadJobs(query);
    }
    async getUrl(query) {
        return await this.downloadapiService.getDownloadUrl(query);
    }
    async starthyperlinkDownload(body) {
        return await this.s3FileService.insertDownloadJob(body);
    }
};
exports.DownloadapiController = DownloadapiController;
__decorate([
    (0, common_1.Get)('report'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Array)
], DownloadapiController.prototype, "getHello", null);
__decorate([
    (0, common_1.Post)('startdownload'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof download_dto_1.downloadReq !== "undefined" && download_dto_1.downloadReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], DownloadapiController.prototype, "startDownload", null);
__decorate([
    (0, common_1.Post)('startjob'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof download_dto_1.downloadJobReq !== "undefined" && download_dto_1.downloadJobReq) === "function" ? _e : Object]),
    __metadata("design:returntype", typeof (_f = typeof Promise !== "undefined" && Promise) === "function" ? _f : Object)
], DownloadapiController.prototype, "startDownloadJob", null);
__decorate([
    (0, common_1.Post)('deletejob'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_g = typeof download_dto_1.StopJobReq !== "undefined" && download_dto_1.StopJobReq) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], DownloadapiController.prototype, "deleteDownloadJob", null);
__decorate([
    (0, common_1.Post)('retryjob'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof download_dto_1.retryJobReq !== "undefined" && download_dto_1.retryJobReq) === "function" ? _j : Object]),
    __metadata("design:returntype", typeof (_k = typeof Promise !== "undefined" && Promise) === "function" ? _k : Object)
], DownloadapiController.prototype, "retryJob", null);
__decorate([
    (0, common_1.Post)('delete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof download_dto_1.deleteJobReq !== "undefined" && download_dto_1.deleteJobReq) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], DownloadapiController.prototype, "deleteJob", null);
__decorate([
    (0, common_1.Get)('getdownload'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_o = typeof download_dto_1.downloadJobsListReq !== "undefined" && download_dto_1.downloadJobsListReq) === "function" ? _o : Object]),
    __metadata("design:returntype", typeof (_p = typeof Promise !== "undefined" && Promise) === "function" ? _p : Object)
], DownloadapiController.prototype, "getDownload", null);
__decorate([
    (0, common_1.Get)('get/url'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_q = typeof download_dto_1.getUrlReq !== "undefined" && download_dto_1.getUrlReq) === "function" ? _q : Object]),
    __metadata("design:returntype", typeof (_r = typeof Promise !== "undefined" && Promise) === "function" ? _r : Object)
], DownloadapiController.prototype, "getUrl", null);
__decorate([
    (0, common_1.Post)('startdownloadhyperlink'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_s = typeof download_dto_1.downloadReq !== "undefined" && download_dto_1.downloadReq) === "function" ? _s : Object]),
    __metadata("design:returntype", typeof (_t = typeof Promise !== "undefined" && Promise) === "function" ? _t : Object)
], DownloadapiController.prototype, "starthyperlinkDownload", null);
exports.DownloadapiController = DownloadapiController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof downloadapi_service_1.DownloadapiService !== "undefined" && downloadapi_service_1.DownloadapiService) === "function" ? _a : Object, typeof (_b = typeof s3_file_service_1.S3FileService !== "undefined" && s3_file_service_1.S3FileService) === "function" ? _b : Object])
], DownloadapiController);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadapiService = void 0;
const db_service_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const process_status_service_1 = __webpack_require__(10);
const bull_1 = __webpack_require__(25);
const bull_2 = __webpack_require__(26);
const process_data_service_1 = __webpack_require__(27);
const redis_service_1 = __webpack_require__(14);
const log_service_1 = __webpack_require__(17);
const s3_service_1 = __webpack_require__(28);
let DownloadapiService = class DownloadapiService {
    constructor(db, processStatus, downloadQueue, processData, redis, logService, s3Service, deleteTarQueue) {
        this.db = db;
        this.processStatus = processStatus;
        this.downloadQueue = downloadQueue;
        this.processData = processData;
        this.redis = redis;
        this.logService = logService;
        this.s3Service = s3Service;
        this.deleteTarQueue = deleteTarQueue;
        this.schema = 'download';
        this.logger = new common_1.Logger('downlaod-service');
    }
    async startDownloadJob(body) {
        this.logger.log('Start download job', body);
        await this.pushToQueue(body.jobId, body.nMasterid);
        return { msg: 1, value: 'Download job started successfully' };
    }
    async insertDownloadJob(body) {
        this.logger.log('Inserting download job', body);
        const res = await this.db.executeRef('insert_download_process', body, this.schema);
        if (res.success) {
            try {
                if (res.data[0][0]["msg"] == 1) {
                    const isExistingJob = res.data[0][0]["isExistingJob"];
                    if (!isExistingJob) {
                        await this.applyPackageName(res.data[0][0]["nDPid"], body.cZipname);
                        const { totalFiles } = await this.setUpBatch(res.data[0][0]["nDPid"], body);
                        if (totalFiles <= 0) {
                            this.logger.error('No files found for the download job', body);
                            await this.processStatus.updateStatus(res.data[0][0]["nDPid"], 'F');
                            throw new common_1.InternalServerErrorException('No files found for the download job');
                        }
                        await this.redis.processSetup(res.data[0][0]["nDPid"], totalFiles);
                        await this.pushToQueue(res.data[0][0]["nDPid"], body.nMasterid);
                    }
                    try {
                        await this.redis.addSubscriber(res.data[0][0]["nDPid"], body.nMasterid);
                    }
                    catch (error) {
                    }
                    return res.data[0][0];
                }
                else {
                    this.logger.error('Failed to insert download job', res.data[0]);
                    throw new common_1.InternalServerErrorException(res.data[0][0]["value"]);
                }
            }
            catch (error) {
                this.logger.error('Error processing insert download job response', error);
                throw new common_1.InternalServerErrorException(error.message, error.message);
            }
        }
        else {
            this.logger.error('Database error while inserting download job', res.error);
            throw new common_1.InternalServerErrorException(res?.error);
        }
    }
    async applyPackageName(nDPid, cZipname) {
        const name = String(cZipname ?? '').replace(/[^\w \-().]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
        if (!nDPid || !name)
            return;
        try {
            await this.db.rowQuery('update download."ProcessMaster" set "cZipname" = $2 where "nDPid" = $1 and coalesce("cZipname", \'\') = \'\'', [nDPid, name]);
        }
        catch (error) {
            this.logger.error(`Failed to set package name for ${nDPid}`, error);
        }
    }
    async pushToQueue(nDPid, nMasterid) {
        try {
            this.logger.log(`Pushing download job ${nDPid} to queue`);
            const payload = { nDPid, nMasterid };
            await this.downloadQueue.add(payload, { jobId: String(nDPid), removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: { type: 'fixed', delay: 1000 * 3 } });
            this.logger.log(`Download job ${nDPid}  pushed to queue successfully`);
        }
        catch (error) {
            this.logger.error(`Error pushing download job ${nDPid}  to queue`, error);
            this.processStatus.updateStatus(nDPid, 'F');
        }
    }
    async setUpBatch(nDPid, body) {
        const function_name = body.isHyperlink ? 'insert_download_process_files_hyperlink' : 'insert_download_process_files';
        const res = await this.db.executeRef(function_name, { ...body, nDPid }, this.schema);
        if (res.success) {
            this.logger.log(`Batch setup for download job ${nDPid} completed successfully`);
            return { totalFiles: res.data[0][0].totalFiles };
        }
        else {
            this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
            throw new common_1.InternalServerErrorException('Failed to set up batch for download job', res.error);
        }
    }
    async onApplicationBootstrap() {
        try {
            let stuck = await this.downloadQueue.getJobs(['active']);
            if (!stuck.length) {
                this.logger.log('No active jobs to recover');
                return;
            }
            stuck = stuck.sort((a, b) => a.timestamp - b.timestamp);
            this.logger.log(`Recovering ${stuck.length} stuck job(s) in order…`);
            for (const job of stuck) {
                this.logger.log(` ↪ re-queuing job ${job.id} (created @ ${new Date(job.timestamp).toISOString()})`);
                await job.moveToFailed({ message: 'Recover on restart' }, true);
            }
        }
        catch (error) {
            this.logger.error('Error during application bootstrap', error);
        }
    }
    async onApplicationShutdown(signal) {
        console.log('🔔 Shutting down, closing download-queue …');
        await this.downloadQueue.close();
    }
    async getDownloadJobs(query) {
        this.logger.log('Fetching download jobs', query);
        try {
            const res = await this.db.executeRef('get_download_jobs', query, this.schema);
            if (res.success) {
                const jobs = res.data[0];
                for (const job of jobs) {
                    try {
                        if (job.cStatus != 'C') {
                            const jobSummary = await this.redis.getQueueSummary(job.nDPid);
                            job.totalFiles = jobSummary?.total || 0;
                            job.lastUpdated = jobSummary?.lastUpdated;
                            job.queueStatus = jobSummary?.queueStatus;
                            job.totalParts = Number(jobSummary?.totalParts || 0);
                            job.completedParts = Number(jobSummary?.completedParts || 0);
                            job.actionStatus = jobSummary?.actionStatus;
                            job.MergeCompletedParts = Number(jobSummary?.MergeCompletedParts || 0);
                            job.MergeTotalParts = Number(jobSummary?.MergeTotalParts || 0);
                            if (!job.dStartDt && jobSummary?.dStartDt) {
                                job.dStartDt = jobSummary?.dStartDt || null;
                            }
                            if (!job.totalSize && jobSummary?.totalSize) {
                                job.totalSize = jobSummary?.totalSize || 0;
                            }
                        }
                    }
                    catch (error) {
                        this.logger.error(`Error fetching queue summary for job ${job.nDPid}`, error);
                    }
                }
                return res.data[0];
            }
            else {
                this.logger.error('Failed to fetch download jobs', res.error);
                throw new common_1.InternalServerErrorException(res.error);
            }
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error?.message);
        }
    }
    async getDownloadUrl(query) {
        this.logger.log('Fetching download job presigned url', query);
        try {
            const res = await this.db.executeRef('get_download_presigned_url', query, this.schema);
            if (!res.success) {
                this.logger.error('Failed to fetch download job', res.error);
                throw new common_1.InternalServerErrorException(res.error);
            }
            if (!res.data?.[0]?.[0]?.["cUrl"]) {
                this.logger.error('No download available for the given nDPid', query.nDPid);
                throw new common_1.InternalServerErrorException('No presigned URL found for the given nDPid');
            }
            const key = await this.s3Service.resolveArchiveKey(query.nDPid);
            if (!key) {
                this.logger.warn(`Archive for nDPid=${query.nDPid} is no longer available (expired/deleted).`);
                throw new common_1.InternalServerErrorException('This download has expired. Please regenerate it.');
            }
            const cUrl = await this.s3Service.getPresignedUrl(key);
            return { cUrl };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException(error?.message);
        }
    }
    async retryFailedJob(body) {
        try {
            const dbRes = await this.db.executeRef('process_retry', body, this.schema);
            if (!dbRes.success) {
                this.logger.error(`DB setup failed for nDPid=${body.nDPid}`, dbRes.error);
                return { msg: -1, error: dbRes.error };
            }
            const value = dbRes.data?.[0]?.[0]?.value ?? '';
            const job = await this.downloadQueue.getJob(body.nDPid);
            if (!job) {
                this.logger.warn(`No job found for nDPid=${body.nDPid}`);
                return { msg: -1, error: 'Job not found' };
            }
            const state = await job.getState();
            this.logger.log(`Job id=${job.id} is in state="${state}", moving to failed…`);
            await job.moveToFailed(new Error('Recover on restart'), false);
            this.logger.log(`Job id=${job.id} marked failed; will retry per backoff rules`);
            return { msg: 1, value };
        }
        catch (err) {
            try {
                await this.stopAndRemoveJob({ nDPid: body.nDPid });
            }
            catch (error) {
                this.logger.error(`Error stopping job for nDPid=${body.nDPid} during retryFailedJob
          `, error.stack || error);
            }
            try {
                await this.pushToQueue(body.nDPid, body.nMasterid);
                this.logger.log(`Re-queued job for nDPid=${body.nDPid}`);
            }
            catch (error) {
                this.logger.error(`Error re-queuing job for nDPid=${body.nDPid} during retryFailedJob`, error.stack || error);
            }
            this.logger.error(`Error in failAndRecoverJob for nDPid=${body.nDPid}`, err.stack || err);
            return { msg: -1, error: err.message || err };
        }
    }
    async stopAndRemoveJob(body) {
        try {
            const job = await this.downloadQueue.getJob(body.nDPid);
            if (!job) {
                this.logger.warn(`Job not found for nDPid=${body.nDPid}`);
                return { msg: -1, error: 'Job not found' };
            }
            const state = await job.getState();
            this.logger.log(`Job id=${job.id} is in state="${state}"`);
            if (state === 'active') {
                await job.moveToFailed(new Error('Stopped by user request'), false);
                this.logger.log(`Marked job id=${job.id} as failed`);
            }
            await this.downloadQueue.removeJobs(body.nDPid);
            this.logger.log(`Completely removed job id=${body.nDPid} from queue`);
            return { msg: 1 };
        }
        catch (err) {
            this.logger.error(`Error stopping/removing job for nDPid=${body.nDPid}`, err.stack || err);
            return { msg: -1, error: err.message || err };
        }
    }
    async deleteJob(body) {
        const res = await this.db.executeRef('delete', body, this.schema);
        if (res.success) {
            try {
                await this.deleteTarQueue.add({ isJobDelete: true, nDPid: body.nDPid }, {
                    jobId: body.nDPid, removeOnComplete: true, removeOnFail: false, timeout: 1000 * 60 * 60 * 24, attempts: 3, backoff: { type: 'fixed', delay: 1000 * 2 }
                });
                return { msg: 1, value: res.data[0][0]["value"] };
            }
            catch (error) {
                this.logger.error(`Error adding job to deleteTarQueue for nDPid ${body.nDPid}`, error);
                return { msg: -1, value: 'Failed to delete job', error: error.message || 'Failed to delete job' };
            }
        }
        else {
            return new common_1.InternalServerErrorException(res.error);
        }
    }
};
exports.DownloadapiService = DownloadapiService;
exports.DownloadapiService = DownloadapiService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_2.InjectQueue)('download-queue')),
    __param(7, (0, bull_2.InjectQueue)('delete-tar-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof process_status_service_1.ProcessStatusService !== "undefined" && process_status_service_1.ProcessStatusService) === "function" ? _b : Object, typeof (_c = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _c : Object, typeof (_d = typeof process_data_service_1.ProcessDataService !== "undefined" && process_data_service_1.ProcessDataService) === "function" ? _d : Object, typeof (_e = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _e : Object, typeof (_f = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _f : Object, typeof (_g = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _g : Object, typeof (_h = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _h : Object])
], DownloadapiService);


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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(7);
const query_builder_service_1 = __webpack_require__(8);
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
/* 7 */
/***/ ((module) => {

module.exports = require("pg");

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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProcessStatusService = void 0;
const db_service_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const kafka_service_1 = __webpack_require__(11);
let ProcessStatusService = class ProcessStatusService {
    constructor(db, kafkaService) {
        this.db = db;
        this.kafkaService = kafkaService;
        this.schema = 'download';
        this.logger = new common_1.Logger('process-status');
    }
    async updateStatus(nDPid, cStatus) {
        this.logger.log(`updating job ${nDPid} status ${cStatus}`);
        const res = await this.db.executeRef('update_process_status', { nDPid, cStatus }, this.schema);
        if (res.success) {
            try {
                if (res.data[0][0]["msg"] == 1) {
                    this.logger.log(`updated job ${nDPid} status ${cStatus}`);
                    const obj = {
                        nDPid,
                        cStatus,
                        nMasterid: res.data[0][0]["nMasterid"]
                    };
                    if (cStatus == 'A') {
                        obj["dStartDt"] = res.data[0][0]["dStartDt"];
                    }
                    if (res.data[0][0]["cZipname"]) {
                        obj["cZipname"] = res.data[0][0]["cZipname"];
                    }
                    this.kafkaService.emit({ event: 'DOWNLOAD-STATUS', data: obj });
                }
                else {
                    this.logger.error('Failed to insert download job', res.data[0]);
                }
            }
            catch (error) {
                this.logger.error('Error processing insert download job response', error);
            }
        }
        else {
            this.logger.error('Database error while inserting download job', res.error);
        }
    }
    async progressReport(event, nDPid, data) {
        this.kafkaService.emit({ event, data: { nDPid, ...data } });
    }
};
exports.ProcessStatusService = ProcessStatusService;
exports.ProcessStatusService = ProcessStatusService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof kafka_service_1.KafkaService !== "undefined" && kafka_service_1.KafkaService) === "function" ? _b : Object])
], ProcessStatusService);


/***/ }),
/* 11 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


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
exports.KafkaService = void 0;
const kafka_shared_service_1 = __webpack_require__(12);
const common_1 = __webpack_require__(3);
const redis_service_1 = __webpack_require__(14);
let KafkaService = class KafkaService {
    constructor(kafka, redis) {
        this.kafka = kafka;
        this.redis = redis;
        this.logger = new common_1.Logger('kafka');
    }
    async emit(data, topic) {
        try {
            if (data?.data?.nDPid) {
                const users = await this.redis.getSubscribers(data?.data?.nDPid);
                data.data.users = users;
                this.logger.fatal('Emited to kafka', data);
                this.kafka.sendMessage((topic ? topic : 'download-message'), data);
            }
        }
        catch (error) {
        }
    }
};
exports.KafkaService = KafkaService;
exports.KafkaService = KafkaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object, typeof (_b = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _b : Object])
], KafkaService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(13);
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
/* 13 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisService = void 0;
const common_1 = __webpack_require__(3);
const redis_handler_1 = __webpack_require__(15);
const log_service_1 = __webpack_require__(17);
const config_1 = __webpack_require__(9);
const date_time_service_1 = __webpack_require__(23);
const config_key_service_1 = __webpack_require__(24);
let RedisService = class RedisService extends redis_handler_1.RedisHandler {
    constructor(logService, config, date, configKeyService) {
        super(logService, config);
        this.logService = logService;
        this.config = config;
        this.date = date;
        this.configKeyService = configKeyService;
        this.processKey = 'download';
        this.logger = new common_1.Logger('redis-service');
    }
    async processSetup(nDPid, totalFiles) {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = {
                total: totalFiles,
                created: this.date.getCurrentTime(),
                completedParts: 0,
                totalParts: 0,
                MergeCompletedParts: 0,
                MergeTotalParts: 0,
                attempts: 0
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        }
        catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async retryAttempts(nDPid) {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            const newCount = await this.redis.hincrby(summaryKey, 'attempts', 1);
            this.logger.log(`MergeCompletedParts for NDP ID=${nDPid} → ${newCount}`);
            return newCount;
        }
        catch (err) {
            this.logger.error(`Error incrementing MergeCompletedParts for NDP ID=${nDPid}: ${err.message}`, err.stack);
        }
    }
    async addSubscriber(nDPid, userId) {
        const key = `${this.processKey}:${nDPid}:subscribers`;
        try {
            const isMember = await this.redis.sismember(key, userId);
            if (isMember) {
                this.logger.verbose(`User ${userId} is already subscribed to ${nDPid}`);
                return false;
            }
            await this.redis.sadd(key, userId);
            this.logger.log(`Added subscriber ${userId} for NDP ID ${nDPid}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error adding subscriber for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getSubscribers(nDPid) {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            return this.redis.smembers(key);
        }
        catch (error) {
            this.logger.error(`Error getting subscribers for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async removeSubscriber(nDPid, userId) {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            await this.redis.srem(key, userId);
        }
        catch (error) {
            this.logger.error(`Error removing subscriber ${userId} for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async clearSubscribers(nDPid) {
        try {
            const key = `${this.processKey}:${nDPid}:subscribers`;
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Error clearing subscribers for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async setupBatchSizes(nDPid, smallBatchs, largeBatches) {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = {
                smallBatchs: smallBatchs || 0,
                largeBatches: largeBatches || 0,
                lastUpdated: this.date.getCurrentTime()
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        }
        catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateActionStatus(nDPid, mainJob, actionStatus) {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = {
                actionStatus: actionStatus,
                lastUpdated: this.date.getCurrentTime()
            };
            if (actionStatus == 'FINAL-MEARGING') {
                summary.isAllPartsUploaded = true;
            }
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
            try {
                await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', actionStatus });
            }
            catch (error) {
                this.logger.error(`Error updating job progress for NDP ID ${nDPid}: ${error.message}`, error.stack);
            }
        }
        catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateQueueStatus(nDPid, queueStatus) {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = {
                queueStatus: queueStatus,
                lastUpdated: this.date.getCurrentTime()
            };
            if (queueStatus == 'active') {
                summary.dStartDt = this.date.getCurrentTime();
            }
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        }
        catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateBatchStatus(nDPid, value, key) {
        try {
            this.logger.log(`Setting up Redis for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = {
                [key]: value,
                lastUpdated: this.date.getCurrentTime()
            };
            await this.redis.pipeline()
                .hmset(summaryKey, summary)
                .exec();
        }
        catch (error) {
            this.logger.error(`Error setting up Redis for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getBatchStatus(nDPid, key) {
        try {
            this.logger.log(`Getting batch status for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const status = await this.redis.hget(summaryKey, key);
            return status === 'true';
        }
        catch (error) {
            this.logger.error(`Error getting batch status for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async addActiveBatch(nDPid, batch, batchId, uploadId) {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            await this.redis.hset(key, batchId.toString(), uploadId);
            this.logger.log(`Mapped active batch ${batchId} → uploadId ${uploadId} in ${key}`);
        }
        catch (error) {
            this.logger.error(`Error adding active batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async removeActiveBatch(nDPid, batch, batchId) {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            await this.redis.hdel(key, batchId.toString());
            this.logger.log(`Removed mapping for batch ${batchId} in ${key}`);
        }
        catch (error) {
            this.logger.error(`Error removing active batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getUploadIdForBatch(nDPid, batch, batchId) {
        try {
            const key = this.configKeyService.activeBatchesKey(nDPid, batch);
            const uploadId = await this.redis.hget(key, batchId.toString());
            if (uploadId) {
                this.logger.log(`Found uploadId ${uploadId} for batch ${batchId} in ${key}`);
                return uploadId;
            }
            this.logger.log(`No active upload for batch ${batchId} in ${key}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Error getting uploadId for batch ${batchId} for NDP ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async updateTotalPartsCount(nDPid, totalParts, totalSize) {
        try {
            this.logger.log(`Setting total parts for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            await this.redis.hset(summaryKey, {
                totalParts: totalParts.toString(),
                totalSize: totalSize?.toString(),
            });
            this.logger.log(`Total parts set to ${totalParts} for NDP ID: ${nDPid}`);
        }
        catch (error) {
            this.logger.error(`Error setting total parts for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async completeRefreshCount(nDPid) {
        try {
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const newCount = await this.redis.hincrby(summaryKey, 'completedParts', 1);
            return newCount;
        }
        catch (error) {
            this.logger.error(`Error completing refresh count for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getQueueSummary(nDPid) {
        try {
            this.logger.log(`Getting queue summary for NDP ID: ${nDPid}`);
            const summaryKey = `${this.processKey}:${nDPid}:summary`;
            const summary = await this.redis.hgetall(summaryKey);
            if (!summary) {
                this.logger.warn(`No summary found for NDP ID: ${nDPid}`);
                return null;
            }
            return {
                total: parseInt(summary?.total, 10),
                created: summary?.created,
                lastUpdated: summary?.lastUpdated || this.date.getCurrentTime(),
                completedParts: parseInt(summary?.completedParts, 10),
                totalParts: parseInt(summary?.totalParts, 10),
                actionStatus: summary?.actionStatus,
                queueStatus: summary?.queueStatus,
                smallBatchs: parseInt(summary?.smallBatchs, 10) || 0,
                largeBatches: parseInt(summary?.largeBatches, 10) || 0,
                smallBatchAdded: summary?.smallBatchAdded === 'true',
                largeBatchAdded: summary?.largeBatchAdded === 'true',
                isAllPartsUploaded: summary?.isAllPartsUploaded === 'true' || false,
                MergeCompletedParts: parseInt(summary?.MergeCompletedParts, 10) || 0,
                MergeTotalParts: parseInt(summary?.MergeTotalParts, 10) || 0,
                dStartDt: summary?.dStartDt || null,
                totalSize: parseInt(summary?.totalSize, 10) || 0
            };
        }
        catch (error) {
            this.logger.error(`Error getting queue summary for NDP ID ${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async finalMergeTotalPartsCount(nDPid, totalParts) {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            await this.redis.hset(summaryKey, {
                MergeCompletedParts: '0',
                MergeTotalParts: totalParts.toString(),
            });
            this.logger.log(`Initialized merge parts for NDP ID=${nDPid}: total=${totalParts}`);
        }
        catch (err) {
            this.logger.error(`Error initializing merge parts for NDP ID=${nDPid}: ${err.message}`, err.stack);
        }
    }
    async finalMergeCompleteRefreshCount(nDPid) {
        const summaryKey = `${this.processKey}:${nDPid}:summary`;
        try {
            const newCount = await this.redis.hincrby(summaryKey, 'MergeCompletedParts', 1);
            this.logger.log(`MergeCompletedParts for NDP ID=${nDPid} → ${newCount}`);
            return newCount;
        }
        catch (err) {
            this.logger.error(`Error incrementing MergeCompletedParts for NDP ID=${nDPid}: ${err.message}`, err.stack);
        }
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _c : Object, typeof (_d = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _d : Object])
], RedisService);


/***/ }),
/* 15 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisHandler = void 0;
const ioredis_1 = __webpack_require__(16);
class RedisHandler {
    constructor(logService, config) {
        this.logService = logService;
        this.config = config;
        this.RECONNECT_DELAY = 5000;
        this.MAX_RECONNECT_ATTEMPTS = 10;
        this.CHANNEL_HEALTH_CHECK_INTERVAL = 5000;
        this.REDIS_CONNECTION_TIMEOUT = 10000;
        this.appName = `redishandler`;
        this.init();
    }
    async init() {
        try {
            await this.setupRedis();
        }
        catch (error) {
            this.logService.error(`Failed to initialize Redis: ${error.message}`, this.appName);
        }
    }
    async setupRedis() {
        this.redis = new ioredis_1.default({
            host: this.config.get('REDIS_IP', '127.0.0.1'),
            port: Number(this.config.get('REDIS_PORT', 6379)),
            password: this.config.get('REDIS_PASSWORD', ''),
            db: this.config.get('REDIS_DB', 0),
            connectTimeout: this.REDIS_CONNECTION_TIMEOUT,
            maxRetriesPerRequest: 8,
            retryStrategy: (times) => {
                if (times > this.MAX_RECONNECT_ATTEMPTS) {
                    this.logService.error("Max reconnect attempts reached. Giving up...", this.appName);
                    return null;
                }
                const delay = Math.min(times * 1000, this.RECONNECT_DELAY);
                this.logService.warn(`Retrying Redis connection in ${delay}ms...`, this.appName);
                return delay;
            }
        });
        this.setupRedisEventListeners();
        await this.waitForRedisConnection();
    }
    setupRedisEventListeners() {
        this.redis.on('connect', () => {
            this.logService.info('Connected to Redis', this.appName);
        });
        this.redis.on('error', (error) => {
            this.logService.error(`Redis connection error: ${error?.message}`, this.appName);
        });
        this.redis.on('close', () => {
            this.logService.warn('Redis connection closed', this.appName);
        });
        this.redis.on('reconnecting', (ms) => {
            this.logService.warn(`Reconnecting to Redis in ${ms}ms...`, this.appName);
        });
    }
    async waitForRedisConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Redis connection timeout'));
            }, this.REDIS_CONNECTION_TIMEOUT);
            this.redis.once('connect', () => {
                clearTimeout(timeout);
                resolve();
            });
            this.redis.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
}
exports.RedisHandler = RedisHandler;


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("ioredis");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(18);
const nest_winston_1 = __webpack_require__(19);
const winston = __webpack_require__(18);
const fs = __webpack_require__(20);
const path = __webpack_require__(21);
const moment = __webpack_require__(22);
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
/* 18 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 22 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 23 */
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
const moment = __webpack_require__(22);
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
/* 24 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ConfigKeyService = void 0;
const common_1 = __webpack_require__(3);
let ConfigKeyService = class ConfigKeyService {
    constructor() {
        this.largeBatchQueueName = (nDPid) => {
            return `download:${nDPid}:large-batches`;
        };
        this.largePartQueueName = (nDPid, batchIndex) => {
            return `download:${nDPid}:large-parts-${batchIndex}`;
        };
        this.smallBatchQueueName = (nDPid) => {
            return `download:${nDPid}:small-batches`;
        };
        this.smallPartQueueName = (nDPid, batchIndex) => {
            return `download:${nDPid}:small-parts-${batchIndex}`;
        };
        this.activeBatchesKey = (nDPid, batch) => {
            return `download:${nDPid}:active:${batch}:batches`;
        };
        this.activePartsKey = (nDPid, batchIndex, batch) => {
            return `download:${nDPid}:active:${batch}:parts-${batchIndex}`;
        };
    }
    largeBatchName(nDPid, batchIndex) {
        return `${nDPid}/batches/batch_${batchIndex}.tar`;
    }
    smallBatchName(nDPid, batchIndex) {
        return `${nDPid}/batches/smallbatch_${batchIndex}.tar`;
    }
    finalArchiveName(nDPid, tarName) {
        return `${nDPid}/${tarName || 'final-archiver'}.tar`;
    }
};
exports.ConfigKeyService = ConfigKeyService;
exports.ConfigKeyService = ConfigKeyService = __decorate([
    (0, common_1.Injectable)()
], ConfigKeyService);


/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("bull");

/***/ }),
/* 26 */
/***/ ((module) => {

module.exports = require("@nestjs/bull");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ProcessDataService = void 0;
const db_service_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
let ProcessDataService = class ProcessDataService {
    constructor(db) {
        this.db = db;
        this.schema = 'download';
        this.logger = new common_1.Logger('data-service');
    }
    async getProcessJobDetail(nDPid) {
        this.logger.log(`Fetching job data for nDPid: ${nDPid}`);
        const res = await this.db.executeRef('process_detail', { nDPid }, this.schema);
        if (res.success) {
            try {
                return res.data[0][0];
            }
            catch (error) {
                this.logger.error('Error processing fetching download job response', error);
                throw new Error('Failed to fetch process job detail');
            }
        }
        else {
            this.logger.error('Database error while fetching download job', res.error);
            throw new Error(res?.error);
        }
    }
    async getFiles(nDPid) {
        this.logger.log(`Fetching job files for  ${nDPid}`);
        const res = await this.db.executeRef('files', { nDPid }, this.schema);
        if (res.success) {
            try {
                return res.data[0];
            }
            catch (error) {
                this.logger.error('Error processing fetching download job files response', error);
                throw new Error('Failed to fetch files');
            }
        }
        else {
            this.logger.error('Database error while fetching download files', res.error);
            throw new Error(res?.error);
        }
    }
    async updateFileSizeBatch(nDPid, files, bIsLast) {
        this.logger.log(`Updating file sizes for nDPid: ${nDPid}`);
        const res = await this.db.executeRef('update_size_batches', { nDPid, jBatch: JSON.stringify(files), bIsLast }, this.schema);
        if (res.success) {
            this.logger.log(`Successfully updated file sizes for nDPid: ${nDPid}`);
        }
        else {
            this.logger.error('Database error while updating file sizes', res.error);
            throw new Error(res?.error);
        }
    }
    async updatePresignUrl(nDPid, cUrl) {
        this.logger.log(`Updating presigned url  ${nDPid} with url: ${cUrl}`);
        const res = await this.db.executeRef('update_presign_url', { nDPid, cUrl }, this.schema);
        if (res.success) {
            try {
                return true;
            }
            catch (error) {
                this.logger.error('Error processing fetching download job files response', error);
                throw new Error('Failed to fetch files');
            }
        }
        else {
            this.logger.error('Database error while fetching download files', res.error);
            throw new Error(res?.error);
        }
    }
};
exports.ProcessDataService = ProcessDataService;
exports.ProcessDataService = ProcessDataService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], ProcessDataService);


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
var S3Service_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.S3Service = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const client_s3_1 = __webpack_require__(29);
const s3_request_presigner_1 = __webpack_require__(30);
const default_service_1 = __webpack_require__(31);
let S3Service = S3Service_1 = class S3Service extends default_service_1.DefaultService {
    constructor(s3Client, config) {
        super();
        this.s3Client = s3Client;
        this.config = config;
        this.logger = new common_1.Logger(S3Service_1.name);
        this.bucket = this.config.get('DO_SPACES_DOWNLOAD_BUCKET_NAME');
        this.sourceBucket = this.config.get('DO_SPACES_BUCKET_NAME');
    }
    async createMultipartUpload(key, contentType) {
        try {
            const cmd = new client_s3_1.CreateMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                ContentType: contentType,
            });
            const out = await this.s3Client.send(cmd);
            if (!out.UploadId) {
                throw new Error('Failed to create multipart upload');
            }
            this.logger.log(`Started multipart upload for ${key}, uploadId=${out.UploadId}`);
            return out.UploadId;
        }
        catch (error) {
            this.logger.error(`Error creating multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }
    async getObjectRange(key, rangeStart, rangeEnd) {
        try {
            const cmd = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Range: `bytes=${rangeStart}-${rangeEnd}`,
            });
            const out = await this.s3Client.send(cmd);
            const stream = out.Body;
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
        catch (error) {
            this.logger.error(`Error downloading range for ${key}: ${error.message}`);
            throw error;
        }
    }
    async putSourceObject(key, body, contentType) {
        await this.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: this.sourceBucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        }));
        this.logger.log(`Uploaded package report object ${key} (${body.length} bytes)`);
    }
    async getObject(key) {
        try {
            const cmd = new client_s3_1.GetObjectCommand({
                Bucket: this.sourceBucket,
                Key: key
            });
            const resp = await this.s3Client.send(cmd);
            return resp.Body;
        }
        catch (error) {
            this.logger.error(`Error getting object ${key}: ${error.message}`);
            throw error;
        }
    }
    async getPresignedUrl(key) {
        try {
            const expiresInSeconds = this.PRESIGNED_URL_EXPIRATION;
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, {
                expiresIn: expiresInSeconds,
            });
            this.logger.log(`Generated presigned URL for ${key}, expires in ${expiresInSeconds}s`);
            return url;
        }
        catch (error) {
            this.logger.error(`Error generating presigned URL for ${key}: ${error.message}`);
            throw error;
        }
    }
    async resolveArchiveKey(nDPid) {
        try {
            const prefix = `${nDPid}/`;
            const resp = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({ Bucket: this.bucket, Prefix: prefix }));
            const contents = resp.Contents || [];
            const finalTar = contents.find((o) => o.Key && o.Key.endsWith('.tar') && !o.Key.slice(prefix.length).includes('/'));
            const anyTar = contents.find((o) => o.Key && o.Key.endsWith('.tar'));
            return finalTar?.Key ?? anyTar?.Key ?? null;
        }
        catch (error) {
            this.logger.error(`Error resolving archive key for ${nDPid}: ${error.message}`);
            return null;
        }
    }
    async uploadPart(key, uploadId, partNumber, body) {
        try {
            const cmd = new client_s3_1.UploadPartCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: body,
            });
            const out = await this.s3Client.send(cmd);
            if (!out.ETag) {
                throw new Error(`Failed to upload part ${partNumber}`);
            }
            this.logger.log(`Uploaded part ${partNumber} (ETag=${out.ETag})`);
            return out.ETag;
        }
        catch (error) {
            this.logger.error(`Error uploading part ${partNumber} for ${key}: ${error.message}`);
            throw error;
        }
    }
    async uploadPartStream(key, uploadId, partNumber, body, totalSize) {
        try {
            const cmd = new client_s3_1.UploadPartCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                Body: body,
                ContentLength: totalSize
            });
            this.logger.log(`Uploading part ${partNumber} for ${key}, total size: ${totalSize}`);
            return this.s3Client.send(cmd);
        }
        catch (error) {
            this.logger.error(`Failed to upload part ${partNumber} for ${key}: ${error.message}`);
            throw error;
        }
    }
    async uploadPartCopy(key, uploadId, partNumber, copySource, copySourceRange) {
        try {
            const cmd = new client_s3_1.UploadPartCopyCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
                CopySource: copySource,
                CopySourceRange: copySourceRange,
            });
            const out = await this.s3Client.send(cmd);
            if (!out.CopyPartResult?.ETag) {
                throw new Error(`Failed to copy part ${partNumber}`);
            }
            this.logger.log(`Copied part ${partNumber} (ETag=${out.CopyPartResult.ETag})`);
            return out.CopyPartResult.ETag;
        }
        catch (error) {
            this.logger.error(`Failed to copy part ${partNumber} from ${copySource}: ${error.message}`);
            throw error;
        }
    }
    async completeMultipartUpload(key, uploadId, parts) {
        try {
            const cmd = new client_s3_1.CompleteMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: { Parts: parts },
            });
            await this.s3Client.send(cmd);
            this.logger.log(`Completed multipart upload for ${key}`);
        }
        catch (error) {
            this.logger.error(`Error completing multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }
    async abortMultipartUpload(key, uploadId) {
        try {
            const cmd = new client_s3_1.AbortMultipartUploadCommand({
                Bucket: this.bucket,
                Key: key,
                UploadId: uploadId,
            });
            await this.s3Client.send(cmd);
            this.logger.log(`Aborted multipart upload for ${key}, uploadId=${uploadId}`);
        }
        catch (error) {
            this.logger.error(`Error aborting multipart upload for ${key}: ${error.message}`);
            throw error;
        }
    }
    async downloadSlice(key, range) {
        try {
            const params = {
                Bucket: this.sourceBucket,
                Key: key,
            };
            if (range) {
                params.Range = `bytes=${range.offset}-${range.offset + range.length - 1}`;
            }
            this.logger.log(`Downloading from ${key}` +
                (range ? ` bytes ${params.Range}` : ` (full object)`));
            const output = await this.s3Client.send(new client_s3_1.GetObjectCommand(params));
            const bodyStream = output.Body;
            const chunks = [];
            for await (const chunk of bodyStream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const buffer = Buffer.concat(chunks);
            this.logger.log(`Downloaded ${buffer.length} bytes from ${key}`);
            return buffer;
        }
        catch (error) {
            this.logger.error(`Error downloading slice for ${key}: ${error.message}`);
            throw error;
        }
    }
    async headObjectSize(key, bucket = this.bucket) {
        try {
            const cmd = new client_s3_1.HeadObjectCommand({ Bucket: bucket, Key: key });
            const out = await this.s3Client.send(cmd);
            this.logger.log(`Fetched head for ${key}: size=${out.ContentLength}`);
            return out.ContentLength ?? 0;
        }
        catch (error) {
            this.logger.error(`Error fetching head for ${key}: ${error.message}`);
            throw error;
        }
    }
    async deleteObject(key) {
        try {
            const cmd = new client_s3_1.DeleteObjectCommand({ Bucket: this.bucket, Key: key });
            await this.s3Client.send(cmd);
            this.logger.log(`Deleted object ${key}`);
        }
        catch (error) {
            this.logger.error(`Error deleting object ${key}: ${error.message}`);
            throw error;
        }
    }
    async deleteFolder(nDPid) {
        this.logger.log(`Starting recursive delete of nDPid "${nDPid}"`);
        let continuationToken;
        let iteration = 0;
        const MAX_ITERATIONS = 1000;
        try {
            do {
                if (++iteration > MAX_ITERATIONS) {
                    this.logger.error(`Max iterations (${MAX_ITERATIONS}) reached; aborting delete of "${nDPid}"`);
                    break;
                }
                let listResp;
                try {
                    listResp = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({
                        Bucket: this.bucket,
                        Prefix: nDPid,
                        ContinuationToken: continuationToken,
                    }));
                }
                catch (err) {
                    this.logger.error(`Error listing objects for nDPid "${nDPid}": ${err.message}`);
                    break;
                }
                const keys = (listResp.Contents || [])
                    .filter((obj) => !!obj.Key)
                    .map((obj) => ({ Key: obj.Key }));
                if (keys.length) {
                    try {
                        const delResp = await this.s3Client.send(new client_s3_1.DeleteObjectsCommand({
                            Bucket: this.bucket,
                            Delete: { Objects: keys },
                        }));
                        this.logger.log(`Deleted ${delResp.Deleted?.length || 0} objects in "${nDPid}"`);
                    }
                    catch (err) {
                        this.logger.error(`Error deleting objects for nDPid "${nDPid}": ${err.message}`);
                        break;
                    }
                }
                continuationToken = listResp.IsTruncated
                    ? listResp.NextContinuationToken
                    : undefined;
            } while (continuationToken);
            this.logger.log(`Finished deleting all objects under "${nDPid}"`);
        }
        catch (err) {
            this.logger.error(`Unexpected error in deleteFolder("${nDPid}"): ${err.message}`, err.stack);
        }
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof client_s3_1.S3Client !== "undefined" && client_s3_1.S3Client) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], S3Service);


/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

/***/ }),
/* 30 */
/***/ ((module) => {

module.exports = require("@aws-sdk/s3-request-presigner");

/***/ }),
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DefaultService = void 0;
const common_1 = __webpack_require__(3);
let DefaultService = class DefaultService {
    constructor() {
        this.S3_AGGENT = { keepAlive: true, maxSockets: 50, keepAliveMsecs: 60000 };
        this.S3_REQUEST_HEANDLER = { connectionTimeout: 60000, socketTimeout: 60000 };
        this.S3_SIZE_CONCURRENCY = 20;
        this.S3_MIN_PART_SIZE = 5 * 1024 * 1024;
        this.S3_MAX_PART_SIZE = 1024 * 1024 * 1024 * 4;
        this.S3_MAX_BATCH_SIZE = 1024 * 1024 * 1024 * 50;
        this.S3_MAX_PARTS = 10000;
        this.LARGE_BATCH_FILE_SIZE = 1024 * 1024 * 20;
        this.SMALL_PART_MAX_SIZE = 1024 * 1024 * 64;
        this.UPDATE_BATCH_TO_DB = 500;
        this.PRESIGNED_URL_EXPIRATION = 15 * 60;
        this.MAX_COPY_PART_SIZE_IN_FINAL_MEARGE = 5 * 1024 * 1024 * 1024;
        this.CONCURRENCY_IN_FINAL_MEARGE = 5;
    }
};
exports.DefaultService = DefaultService;
exports.DefaultService = DefaultService = __decorate([
    (0, common_1.Injectable)()
], DefaultService);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deleteJobReq = exports.StopJobReq = exports.retryJobReq = exports.getUrlReq = exports.downloadJobsListReq = exports.downloadJobReq = exports.downloadReq = exports.commonDTOs = void 0;
const is_uuid_nullable_decorator_1 = __webpack_require__(33);
const swagger_1 = __webpack_require__(36);
const class_transformer_1 = __webpack_require__(34);
const class_validator_1 = __webpack_require__(35);
class commonDTOs {
}
exports.commonDTOs = commonDTOs;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], commonDTOs.prototype, "nDPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], commonDTOs.prototype, "nMasterid", void 0);
class downloadReq {
}
exports.downloadReq = downloadReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '2304b5fc-85ee-4676-af1c-3239910432ad', description: 'Section id', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadReq.prototype, "nSectionid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Download Taskid id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadReq.prototype, "nDTaskid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: 'Folder ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadReq.prototype, "jFolders", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: null, description: 'File ids', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], downloadReq.prototype, "jFiles", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Is Hyperlink', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], downloadReq.prototype, "isHyperlink", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '{"includes":["evidence","facts"],"sections":["A","B"]}', description: 'Include-flags + A–K sections (JSON string)', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadReq.prototype, "jInclude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Contract - linked bundle', description: 'Display/archive name for the package (sanitized server-side); defaults to the case name', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadReq.prototype, "cZipname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: false, description: 'Redownload fresh: skip the dedupe and always build a new package', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], downloadReq.prototype, "bForceNew", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadReq.prototype, "nMasterid", void 0);
class downloadJobReq {
}
exports.downloadJobReq = downloadJobReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'jobId' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadJobReq.prototype, "jobId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadJobReq.prototype, "nMasterid", void 0);
class downloadJobsListReq {
}
exports.downloadJobsListReq = downloadJobsListReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id' }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadJobsListReq.prototype, "nCaseid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '007a3614-ac77-40e4-bad1-4962b6571c58', description: 'Case id', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadJobsListReq.prototype, "nDPid", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1, description: 'Page number' }),
    (0, class_transformer_1.Transform)(({ value }) => parseInt(value), { toClassOnly: true }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], downloadJobsListReq.prototype, "PageNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'N', description: 'Sort by' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], downloadJobsListReq.prototype, "cSortBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "fc2b2057-ac44-41c7-9058-64e8617ed3e5", description: '', required: true }),
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    __metadata("design:type", String)
], downloadJobsListReq.prototype, "nMasterid", void 0);
class getUrlReq extends commonDTOs {
}
exports.getUrlReq = getUrlReq;
class retryJobReq extends commonDTOs {
}
exports.retryJobReq = retryJobReq;
class StopJobReq extends commonDTOs {
}
exports.StopJobReq = StopJobReq;
class deleteJobReq extends commonDTOs {
}
exports.deleteJobReq = deleteJobReq;


/***/ }),
/* 33 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(34);
const class_validator_1 = __webpack_require__(35);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("class-transformer");

/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 36 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

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
var S3FileService_1;
var _a, _b, _c, _d, _e, _f, _g, _h;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.S3FileService = void 0;
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(26);
const bull_2 = __webpack_require__(25);
const path = __webpack_require__(21);
const os = __webpack_require__(38);
const { spawn } = __webpack_require__(39);
const client_s3_1 = __webpack_require__(29);
const stream_1 = __webpack_require__(40);
const db_service_1 = __webpack_require__(6);
const https_1 = __webpack_require__(41);
const config_1 = __webpack_require__(9);
const node_http_handler_1 = __webpack_require__(42);
const fs_1 = __webpack_require__(20);
const log_service_1 = __webpack_require__(17);
const util_1 = __webpack_require__(43);
const child_process_1 = __webpack_require__(39);
const process_status_service_1 = __webpack_require__(10);
const redis_service_1 = __webpack_require__(14);
const downloadapi_service_1 = __webpack_require__(5);
const transform_name_service_1 = __webpack_require__(44);
const execPromise = (0, util_1.promisify)(child_process_1.exec);
let S3FileService = S3FileService_1 = class S3FileService {
    constructor(db, configService, fileQueue, logService, processStatus, redis, downloadapiService, transformName) {
        this.db = db;
        this.configService = configService;
        this.fileQueue = fileQueue;
        this.logService = logService;
        this.processStatus = processStatus;
        this.redis = redis;
        this.downloadapiService = downloadapiService;
        this.transformName = transformName;
        this.logApp = 'hyperlink-download';
        this.logger = new common_1.Logger(S3FileService_1.name);
        this.schema = 'download';
        this.bucketName = 'etabella';
        this.pythonV = this.configService.get('pythonV');
        this.editfilepath = this.configService.get('PY_LOCAL_HYPERLINK');
        this.editfilepath_index = this.configService.get('PY_LOCAL_HYPERLINK_INDEX');
        this.S3_EXC_PATH = this.configService.get('S3_EXC_PATH');
        this.S3_BUCKET_PATH = this.configService.get('S3_BUCKET_PATH');
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
    isRewriteConfigured() {
        return !!(String(this.pythonV ?? '').trim() && String(this.editfilepath ?? '').trim());
    }
    async insertDownloadJob(body) {
        this.logger.log('Inserting download job', body);
        const res = await this.db.executeRef('insert_download_process', body, this.schema);
        if (res.success) {
            try {
                if (res.data[0][0]["msg"] == 1) {
                    const nDPid = res.data[0][0]["nDPid"];
                    const isExistingJob = res.data[0][0]["isExistingJob"];
                    if (!isExistingJob) {
                        await this.downloadapiService.applyPackageName(nDPid, body.cZipname);
                        const { totalFiles } = await this.setUpBatch(nDPid, body);
                        if (totalFiles <= 0) {
                            this.logger.error('No files found for the download job', body);
                            await this.processStatus.updateStatus(nDPid, 'F');
                            throw new common_1.InternalServerErrorException('No files found for the download job');
                        }
                        this.getFilesForDownload(nDPid, totalFiles, body);
                    }
                    try {
                        await this.redis.addSubscriber(nDPid, body.nMasterid);
                    }
                    catch (error) {
                    }
                    return res.data[0][0];
                }
                else {
                    this.logger.error('Failed to insert download job', res.data[0]);
                    throw new common_1.InternalServerErrorException(res.data[0][0]["value"]);
                }
            }
            catch (error) {
                this.logger.error('Error processing insert download job response', error);
                throw new common_1.InternalServerErrorException(error.message, error.message);
            }
        }
        else {
            this.logger.error('Database error while inserting download job', res.error);
            throw new common_1.InternalServerErrorException(res?.error);
        }
    }
    async setUpBatch(nDPid, body) {
        const function_name = 'insert_download_process_files_hyperlink';
        const res = await this.db.executeRef(function_name, { ...body, nDPid }, this.schema);
        if (res.success) {
            this.logger.log(`Batch setup for download job ${nDPid} completed successfully`);
            return { totalFiles: res.data[0][0].totalFiles };
        }
        else {
            this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
            throw new common_1.InternalServerErrorException('Failed to set up batch for download job', res.error);
        }
    }
    async getFilesForDownload(nDPid, totalFiles, body) {
        try {
            const function_name = 'get_hyperlink_jobs';
            const res = await this.db.executeRef(function_name, { ...body, nDPid, totalFiles }, this.schema);
            if (res.success) {
                if (res.data[0].length) {
                    const jobs = res.data[0].map((row) => ({
                        ...row,
                        nDPid,
                        totalFiles,
                        nMasterid: body.nMasterid ?? row.nMasterid,
                        metadata: this.normalizeLinkTargets(row.metadata),
                    }));
                    this.queueMultipleFiles(nDPid, totalFiles, jobs);
                }
                else {
                    this.logger.log(`No file found for hyperlink ${nDPid}`);
                    await this.redis.processSetup(nDPid, totalFiles);
                    await this.downloadapiService.pushToQueue(nDPid, body.nMasterid);
                }
            }
            else {
                this.logger.error(`Failed to set up batch for download job ${nDPid}`, res.error);
                throw new common_1.InternalServerErrorException('Failed to set up batch for download job', res.error);
            }
        }
        catch (error) {
            this.logger.error('get hyperlink file data failed', body);
            await this.processStatus.updateStatus(nDPid, 'F');
            throw new common_1.InternalServerErrorException('No files found for the download job', error);
        }
    }
    normalizeLinkTargets(metadata) {
        if (!Array.isArray(metadata))
            return metadata;
        return metadata.map((entry) => {
            const target = String(entry?.target_file_path ?? '');
            if (!target)
                return entry;
            try {
                const segments = target.split('/');
                const fileName = segments.pop() ?? '';
                const folder = segments.join('/');
                return { ...entry, target_file_path: this.transformName.sanitizeDestination(fileName, folder) };
            }
            catch {
                return entry;
            }
        });
    }
    async queueFileProcessing(jobData) {
        try {
            await this.fileQueue.add('process-file', jobData, {
                priority: 1,
                delay: 0,
            });
            this.logger.log(`Queued file processing for: ${jobData.cPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to queue file processing: ${error.message}`);
            throw error;
        }
    }
    async queueMultipleFiles(nDPid, totalFiles, jobs) {
        try {
            const queueJobs = jobs.map((jobData, index) => ({
                name: 'process-file',
                data: jobData,
                totalFiles: totalFiles,
                opts: {
                    priority: 1,
                    delay: index * 100,
                },
            }));
            await this.fileQueue.addBulk(queueJobs);
            this.logger.log(`Queued ${jobs.length} files for processing`);
        }
        catch (error) {
            throw new common_1.InternalServerErrorException('error while adding queue');
        }
    }
    async downloadFile(nDPid, nID, key, sessionFolder, fileName) {
        try {
            const logApp = this.logApp + '/' + nDPid;
            const tempFilePath = path.join(sessionFolder, fileName);
            if (!(0, fs_1.existsSync)(sessionFolder)) {
                (0, fs_1.mkdirSync)(sessionFolder, { recursive: true });
            }
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.configService.get('DO_SPACES_BUCKET_NAME'),
                Key: key,
            });
            console.log('command', command);
            const { Body } = await this.s3Client.send(command);
            if (Body instanceof stream_1.Readable) {
                console.log(`\n\rReadStream found for `);
                this.logService.info(`Donwload processing file: ${tempFilePath}`, logApp);
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
                this.logService.info(`Donwload Success file: ${tempFilePath}`, logApp);
            }
        }
        catch (error) {
            this.logger.error(`Failed to download file ${key}: ${error.message}`);
            throw error;
        }
    }
    fileExists(filePath) {
        return (0, fs_1.existsSync)(filePath);
    }
    async uploadFile(nDPid, nID, sessionFolder, fileName, outputfile) {
        const logApp = this.logApp + '/' + nDPid;
        const tempFilePath = path.join(sessionFolder, fileName);
        try {
            if (!this.fileExists(tempFilePath)) {
                this.logService.error(`Upload skipped — rewritten file missing: ${tempFilePath}`, logApp);
                return;
            }
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.configService.get('DO_SPACES_BUCKET_NAME'),
                Key: outputfile,
                Body: (0, fs_1.createReadStream)(tempFilePath),
                ContentLength: (0, fs_1.statSync)(tempFilePath).size,
                ContentType: 'application/pdf',
            }));
            await this.update_filepath(nDPid, nID, outputfile);
            (0, fs_1.rmSync)(tempFilePath, { force: true });
            this.logService.log(`Upload success: ${nID}`, logApp);
            this.logger.log(`Successfully uploaded file: ${outputfile}`);
            this.logService.info(`Successfully uploaded file: ${outputfile}`, logApp);
        }
        catch (error) {
            this.logger.error(`Failed to upload file ${outputfile}: ${error.message}`);
            this.logService.error(`Failed to upload file ${outputfile}: ${error.message}`, logApp);
            throw error;
        }
    }
    async hyperlinkprocessFile(nDPid, metadata, sessionFolder, fileName, outputfile, cIsindex) {
        return this.customProcessing(nDPid, metadata, sessionFolder, fileName, outputfile, cIsindex);
    }
    async customProcessing(nDPid, metadata, sessionFolder, fileName, outputfile, cIsindex) {
        const logApp = this.logApp + '/' + nDPid;
        console.log('process file ', fileName);
        const input = path.join(sessionFolder, fileName);
        const output = path.join(sessionFolder, outputfile);
        await this.editFile(metadata, input, output, cIsindex, logApp);
        return true;
    }
    async getQueueStats() {
        const waiting = await this.fileQueue.getWaiting();
        const active = await this.fileQueue.getActive();
        const completed = await this.fileQueue.getCompleted();
        const failed = await this.fileQueue.getFailed();
        return {
            waiting: waiting.length,
            active: active.length,
            completed: completed.length,
            failed: failed.length,
        };
    }
    async retryFailedJobs() {
        const failedJobs = await this.fileQueue.getFailed();
        for (const job of failedJobs) {
            await job.retry();
        }
        this.logger.log(`Retried ${failedJobs.length} failed jobs`);
    }
    async editFile(jsonData, input, output, cIsindex, logApp) {
        return new Promise((resolve, reject) => {
            if (Array.isArray(jsonData)) {
                console.log('Hyperlink Data Count passed to Python:', jsonData.length);
            }
            else {
                console.log('Hyperlink Data passed to Python is NOT an array:', typeof jsonData);
            }
            const tmpFile = path.join(os.tmpdir(), `meta_${crypto.randomUUID()}.json`);
            (0, fs_1.writeFileSync)(tmpFile, JSON.stringify(jsonData));
            const pythonProcess = spawn(this.pythonV, [(cIsindex ? this.editfilepath_index : this.editfilepath), input, output, tmpFile, cIsindex, logApp]);
            pythonProcess.on("error", (err) => {
                this.logService.error(`Python spawn failed (${this.pythonV}): ${err?.message}`, logApp);
                resolve(false);
            });
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
                    console.log('step 3 res', code.toString().trim());
                    resolve(false);
                }
            });
        });
    }
    async update_filepath(nDPid, nBundledetailid, cPath) {
        try {
            const function_name = 'update_batchfile_url';
            const res = await this.db.executeRef(function_name, { nDPid, nBundledetailid, cPath }, this.schema);
            if (res.success) {
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            this.logService.log(`Upload success: ${nBundledetailid}`, this.logApp);
            console.log('error while update status', error);
        }
    }
};
exports.S3FileService = S3FileService;
exports.S3FileService = S3FileService = S3FileService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bull_1.InjectQueue)('s3-file-processing')),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object, typeof (_e = typeof process_status_service_1.ProcessStatusService !== "undefined" && process_status_service_1.ProcessStatusService) === "function" ? _e : Object, typeof (_f = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _f : Object, typeof (_g = typeof downloadapi_service_1.DownloadapiService !== "undefined" && downloadapi_service_1.DownloadapiService) === "function" ? _g : Object, typeof (_h = typeof transform_name_service_1.TransformNameService !== "undefined" && transform_name_service_1.TransformNameService) === "function" ? _h : Object])
], S3FileService);


/***/ }),
/* 38 */
/***/ ((module) => {

module.exports = require("os");

/***/ }),
/* 39 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 40 */
/***/ ((module) => {

module.exports = require("stream");

/***/ }),
/* 41 */
/***/ ((module) => {

module.exports = require("https");

/***/ }),
/* 42 */
/***/ ((module) => {

module.exports = require("@aws-sdk/node-http-handler");

/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 44 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TransformNameService = void 0;
const common_1 = __webpack_require__(3);
const sanitize = __webpack_require__(45);
const path = __webpack_require__(21);
let TransformNameService = class TransformNameService {
    sanitizeDestination(filename, folder) {
        const fn = filename?.trim();
        if (!fn) {
            throw new Error('Filename must be provided');
        }
        const segments = folder
            ? folder
                .split('/')
                .map(seg => sanitize(seg.trim()))
                .filter(Boolean)
            : [];
        const safeName = sanitize(fn);
        if (!safeName) {
            throw new Error('Filename could not be sanitized');
        }
        return segments.length
            ? path.posix.join(...segments, safeName)
            : safeName;
    }
};
exports.TransformNameService = TransformNameService;
exports.TransformNameService = TransformNameService = __decorate([
    (0, common_1.Injectable)()
], TransformNameService);


/***/ }),
/* 45 */
/***/ ((module) => {

module.exports = require("sanitize-filename");

/***/ }),
/* 46 */
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
const microservices_1 = __webpack_require__(13);
const kafka_shared_service_1 = __webpack_require__(12);
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
/* 47 */
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
const nest_winston_1 = __webpack_require__(19);
const winston = __webpack_require__(18);
const fs = __webpack_require__(20);
const path = __webpack_require__(21);
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
/* 48 */
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
__exportStar(__webpack_require__(49), exports);
__exportStar(__webpack_require__(50), exports);


/***/ }),
/* 49 */
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
const global_service_1 = __webpack_require__(50);
const config_1 = __webpack_require__(9);
const scheduler_service_1 = __webpack_require__(51);
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
/* 50 */
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
/* 51 */
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
const moment = __webpack_require__(52);
const schedule = __webpack_require__(53);
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
/* 52 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 53 */
/***/ ((module) => {

module.exports = require("node-schedule");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(16);
const ioredis_2 = __webpack_require__(55);
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
/* 55 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadProcessor = void 0;
const bull_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const bull_2 = __webpack_require__(25);
const download_process_service_1 = __webpack_require__(57);
let DownloadProcessor = class DownloadProcessor {
    constructor(downloadProcessService) {
        this.downloadProcessService = downloadProcessService;
        this.logger = new common_1.Logger('download-processor');
    }
    async handleDownload(job, done) {
        const payload = job.data;
        this.logger.log(`Processing download job with ID: ${job.id}`);
        this.logger.log(`Job data:`, payload);
        try {
            await this.downloadProcessService.startDownload(payload, job, done);
        }
        catch (error) {
            done(error);
        }
    }
};
exports.DownloadProcessor = DownloadProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _b : Object, typeof (_c = typeof bull_2.DoneCallback !== "undefined" && bull_2.DoneCallback) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], DownloadProcessor.prototype, "handleDownload", null);
exports.DownloadProcessor = DownloadProcessor = __decorate([
    (0, bull_1.Processor)('download-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof download_process_service_1.DownloadProcessService !== "undefined" && download_process_service_1.DownloadProcessService) === "function" ? _a : Object])
], DownloadProcessor);


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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DownloadProcessService = void 0;
const common_1 = __webpack_require__(3);
const process_data_service_1 = __webpack_require__(27);
const date_time_service_1 = __webpack_require__(23);
const update_file_size_service_1 = __webpack_require__(58);
const redis_service_1 = __webpack_require__(14);
const largebatch_service_1 = __webpack_require__(64);
const smallbatch_service_1 = __webpack_require__(69);
const path_1 = __webpack_require__(21);
const fs_1 = __webpack_require__(20);
const finalize_archiver_service_1 = __webpack_require__(72);
const log_service_1 = __webpack_require__(17);
const package_reports_service_1 = __webpack_require__(74);
const annotate_evidence_service_1 = __webpack_require__(81);
let DownloadProcessService = class DownloadProcessService {
    constructor(dataService, updateFileSize, date, redisService, largeBatchService, smallBatchService, finalizeArchiverService, logService, packageReports, annotateEvidence) {
        this.dataService = dataService;
        this.updateFileSize = updateFileSize;
        this.date = date;
        this.redisService = redisService;
        this.largeBatchService = largeBatchService;
        this.smallBatchService = smallBatchService;
        this.finalizeArchiverService = finalizeArchiverService;
        this.logService = logService;
        this.packageReports = packageReports;
        this.annotateEvidence = annotateEvidence;
        this.logger = new common_1.Logger('download-process-service');
    }
    async startDownload(payload, mainJob, mainQueueCallBack) {
        const { nDPid } = payload;
        try {
            const summary = await this.redisService.getQueueSummary(nDPid);
            this.logger.log(`Starting download process`);
            this.logService.info(`Starting download process for nDPid=${nDPid}`, `queue/${nDPid}`);
            const jobDetail = await this.dataService.getProcessJobDetail(nDPid);
            let files = await this.dataService.getFiles(nDPid);
            const includes = jobDetail?.jInclude?.includes;
            if (Array.isArray(includes)) {
                if (!includes.includes('evidence'))
                    files = [];
                if ((includes.includes('facts') || includes.includes('annotate')) && includes.includes('evidence')) {
                    await this.annotateEvidence.annotateEvidence(jobDetail, files);
                }
                const reports = await this.packageReports.buildReportFiles(jobDetail);
                if (reports.length) {
                    this.logService.info(`Appending ${reports.length} generated report(s) to package`, `queue/${nDPid}`);
                    files = [...files, ...reports];
                }
                if (jobDetail?.jInclude?.indexMode === 'folder-html') {
                    const folderIdx = await this.packageReports.buildFolderIndexFiles(jobDetail, files);
                    if (folderIdx.length) {
                        this.logService.info(`Appending ${folderIdx.length} per-folder linked-doc index(es) to package`, `queue/${nDPid}`);
                        files = [...files, ...folderIdx];
                    }
                }
                else {
                    const indexFiles = await this.packageReports.buildMasterIndexFiles(jobDetail, files);
                    if (indexFiles.length) {
                        this.logService.info(`Appending Master Index (${indexFiles.length} file(s)) to package`, `queue/${nDPid}`);
                        files = [...files, ...indexFiles];
                    }
                }
            }
            if (files.length <= 0) {
                this.logService.error(`No files found for nDPid=${nDPid}`, `queue/${nDPid}`);
                this.logger.error(`No files found for nDPid=${nDPid}`);
                throw new Error(`No files found for nDPid=${nDPid}`);
            }
            this.logger.log(`Fetched ${files.length} files for nDPid=${nDPid}`);
            this.logService.info(`Fetched ${files.length} files`, `queue/${nDPid}`);
            let largeBatches = [], smallBatches = [];
            if (!jobDetail?.isBatchUpdated) {
                this.redisService.updateActionStatus(nDPid, mainJob, 'SIZE-UPDATING');
                const batchFiles = await this.updateFileSize.updateFileSize(jobDetail, files);
                largeBatches = batchFiles?.largeBatches || [];
                smallBatches = batchFiles?.smallBatches || [];
                this.redisService.setupBatchSizes(nDPid, smallBatches?.length, largeBatches?.length);
                await this.updateTotalPratsCount(nDPid, largeBatches, smallBatches, mainJob);
                this.redisService.updateActionStatus(nDPid, mainJob, 'SIZE-UPDATED');
            }
            else {
                this.logService.info(`Job detail indicates no batch update needed`, `queue/${nDPid}`);
                this.logger.warn(`Job detail for nDPid=${nDPid} indicates no batch update needed.`);
                const batchFiles = await this.updateFileSize.createDirectBatches(files);
                largeBatches = batchFiles?.largeBatches || [];
                smallBatches = batchFiles?.smallBatches || [];
            }
            this.redisService.updateActionStatus(nDPid, mainJob, 'BATCH-STARTED');
            this.logger.log(`Download process started for nDPid=${nDPid} with ${files.length} files.`);
            this.logService.info(`Download process started with ${files.length} files.`, `queue/${nDPid}`);
            if (summary?.isAllPartsUploaded) {
                this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail);
            }
            else {
                if (largeBatches?.length) {
                    await this.largeBatchService.startProcessing(nDPid, mainJob, largeBatches, (err) => {
                        if (err) {
                            mainQueueCallBack(err);
                        }
                        else {
                            this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail);
                        }
                    });
                }
                else {
                    this.logService.info(`No large batches found`, `queue/${nDPid}`);
                    this.logger.warn(`No large batches found for nDPid=${nDPid}.`);
                }
                if (smallBatches?.length) {
                    await this.smallBatchService.startProcessing(nDPid, mainJob, smallBatches, (err) => {
                        if (err) {
                            mainQueueCallBack(err);
                        }
                        else {
                            this.finalizeArchiverService.finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail);
                        }
                    });
                }
                else {
                    this.logService.info(`No small batches found`, `queue/${nDPid}`);
                    this.logger.warn(`No small batches found for nDPid=${nDPid}.`);
                }
            }
        }
        catch (error) {
            this.logService.error(`Failed to start download process: ${error.message}`, `queue/${nDPid}`);
            this.logger.error('Error in startDownload:', error);
            throw new Error(`Failed to start download process: ${error.message}`);
        }
    }
    async saveJSONFile(nCaseid, data, batchIndex, batchType) {
        try {
            const dirPath = (0, path_1.join)('assets', 'downloadbatch', String(nCaseid), batchType);
            await fs_1.promises.mkdir(dirPath, { recursive: true });
            const outPath = (0, path_1.join)(dirPath, `batches${batchIndex}.json`);
            await fs_1.promises.writeFile(outPath, JSON.stringify(data, null, 2), 'utf8');
            this.logger.log(`Saved ${data.length} batches to ${outPath}`);
        }
        catch (err) {
            this.logger.error(`Failed to write batches JSON: ${err.message}`);
        }
    }
    async updateTotalPratsCount(nDPid, largeBatches, smallBatches, mainJob) {
        try {
            const totalLargeParts = largeBatches.reduce((batchAcc, batch) => {
                if (batch.totalParts != null) {
                    return batchAcc + batch.totalParts;
                }
                return batchAcc + batch.files.reduce((fileAcc, file) => fileAcc + (file.parts?.length ?? 0), 0);
            }, 0);
            const totalSmallParts = smallBatches.reduce((acc, batch) => {
                return acc + (batch.totalParts ?? batch.parts.length);
            }, 0);
            const totalParts = totalLargeParts + totalSmallParts;
            const totalLargeSize = largeBatches.reduce((batchAcc, batch) => {
                if (batch.totalSize != null) {
                    return batchAcc + batch.totalSize;
                }
                return batchAcc + batch.files.reduce((fileAcc, file) => fileAcc + (file.size ?? 0), 0);
            }, 0);
            const totalSmallSize = smallBatches.reduce((acc, batch) => {
                if (batch.totalSize != null) {
                    return acc + batch.totalSize;
                }
                return acc + batch.parts.reduce((partAcc, part) => partAcc + (part.totalSize ?? 0), 0);
            }, 0);
            const totalSize = totalLargeSize + totalSmallSize;
            await this.redisService.updateTotalPartsCount(nDPid, totalParts, totalSize);
            await mainJob.progress({
                event: 'DOWNLOAD-PROGRESS',
                totalParts,
                totalSize,
            });
        }
        catch (error) {
            this.logService.error(`Error updating total parts/size for ${nDPid}: ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error updating total parts/size for nDPid=${nDPid}: ${error.message}`);
            throw error;
        }
    }
};
exports.DownloadProcessService = DownloadProcessService;
exports.DownloadProcessService = DownloadProcessService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof process_data_service_1.ProcessDataService !== "undefined" && process_data_service_1.ProcessDataService) === "function" ? _a : Object, typeof (_b = typeof update_file_size_service_1.UpdateFileSizeService !== "undefined" && update_file_size_service_1.UpdateFileSizeService) === "function" ? _b : Object, typeof (_c = typeof date_time_service_1.DateTimeService !== "undefined" && date_time_service_1.DateTimeService) === "function" ? _c : Object, typeof (_d = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _d : Object, typeof (_e = typeof largebatch_service_1.LargebatchService !== "undefined" && largebatch_service_1.LargebatchService) === "function" ? _e : Object, typeof (_f = typeof smallbatch_service_1.SmallbatchService !== "undefined" && smallbatch_service_1.SmallbatchService) === "function" ? _f : Object, typeof (_g = typeof finalize_archiver_service_1.FinalizeArchiverService !== "undefined" && finalize_archiver_service_1.FinalizeArchiverService) === "function" ? _g : Object, typeof (_h = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _h : Object, typeof (_j = typeof package_reports_service_1.PackageReportsService !== "undefined" && package_reports_service_1.PackageReportsService) === "function" ? _j : Object, typeof (_k = typeof annotate_evidence_service_1.AnnotateEvidenceService !== "undefined" && annotate_evidence_service_1.AnnotateEvidenceService) === "function" ? _k : Object])
], DownloadProcessService);


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
var UpdateFileSizeService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UpdateFileSizeService = void 0;
const common_1 = __webpack_require__(3);
const file_size_service_1 = __webpack_require__(59);
const file_batch_service_1 = __webpack_require__(62);
const batch_split_service_1 = __webpack_require__(63);
const default_service_1 = __webpack_require__(31);
const process_data_service_1 = __webpack_require__(27);
let UpdateFileSizeService = UpdateFileSizeService_1 = class UpdateFileSizeService extends default_service_1.DefaultService {
    constructor(fileSizeService, fileBatchService, batchSplitService, processDataService) {
        super();
        this.fileSizeService = fileSizeService;
        this.fileBatchService = fileBatchService;
        this.batchSplitService = batchSplitService;
        this.processDataService = processDataService;
        this.logger = new common_1.Logger(UpdateFileSizeService_1.name);
    }
    async updateFileSize(jobDetail, files) {
        const { nDPid, nCaseid } = jobDetail;
        this.logger.log(`Starting update for nDPid=${nDPid}`);
        const enriched = await this.fileSizeService.getFileSizes(files);
        const { smallFiles, largeFiles, invalidFiles } = this.batchSplitService.splitBatchFiles(enriched);
        this.logger.verbose(`Found ${smallFiles.length} small files, ${largeFiles.length} large files, and ${invalidFiles.length} invalid files.`);
        const largeBatches = await this.fileBatchService.createLargeBatches(largeFiles);
        const smallBatches = await this.fileBatchService.createSmallBatches(smallFiles);
        await this.createUpdateBatches(largeBatches, smallBatches, invalidFiles, nDPid);
        this.logger.log(`Completed update for nDPid=${nDPid}`);
        return { largeBatches, smallBatches };
    }
    async createDirectBatches(files) {
        this.logger.log(`Creating direct batches for ${files.length} files`);
        const largeFiles = files.filter(file => file.cBatchType == 'L');
        const smallFiles = files.filter(file => file.cBatchType == 'S');
        const largeBatches = await this.fileBatchService.createLargeBatches(largeFiles);
        const smallBatches = await this.fileBatchService.createSmallBatches(smallFiles);
        this.logger.log(`Created ${largeBatches.length} large batches and ${smallBatches.length} small batches`);
        return { largeBatches, smallBatches };
    }
    async createUpdateBatches(largeBatches, smallBatches, invalidFiles, nDPid) {
        this.logger.log(`Creating update batches for nDPid=${nDPid}`);
        const bundleList = [];
        if (largeBatches?.length) {
            this.logger.log(`Processing ${largeBatches.length} large batches`);
            for (const batch of largeBatches) {
                for (const file of batch.files) {
                    bundleList.push({
                        bd: file.nBundledetailid,
                        s: String(file.size),
                        x: file.isExists,
                        t: 'L',
                        b: batch.batchIndex
                    });
                }
            }
        }
        if (smallBatches?.length) {
            this.logger.log(`Processing ${smallBatches.length} small batches`);
            for (const batch of smallBatches) {
                for (const part of batch.parts) {
                    for (const file of part.files) {
                        bundleList.push({
                            bd: file.nBundledetailid,
                            s: String(file.size),
                            x: file.isExists,
                            t: 'S',
                            b: batch.batchIndex
                        });
                    }
                }
            }
        }
        if (invalidFiles?.length) {
            this.logger.warn(`Found ${invalidFiles.length} invalid files, adding to bundle list`);
            for (const file of invalidFiles) {
                bundleList.push({
                    bd: file.nBundledetailid,
                    s: String(file.size),
                    x: false,
                    t: 'I',
                    b: 0
                });
            }
        }
        this.logger.log(`Total bundles to updating : ${bundleList.length}`);
        if (bundleList?.length) {
            const BATCH_SIZE = this.UPDATE_BATCH_TO_DB;
            const total = bundleList.length;
            for (let i = 0; i < total; i += BATCH_SIZE) {
                const chunk = bundleList.slice(i, i + BATCH_SIZE);
                const isLast = i + BATCH_SIZE >= total;
                this.logger.log(`Updating batch ${i / BATCH_SIZE + 1} of ${Math.ceil(total / BATCH_SIZE)}; isLast=${isLast}`);
                await this.processDataService.updateFileSizeBatch(nDPid, chunk, isLast);
            }
        }
    }
};
exports.UpdateFileSizeService = UpdateFileSizeService;
exports.UpdateFileSizeService = UpdateFileSizeService = UpdateFileSizeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof file_size_service_1.FileSizeService !== "undefined" && file_size_service_1.FileSizeService) === "function" ? _a : Object, typeof (_b = typeof file_batch_service_1.FileBatchService !== "undefined" && file_batch_service_1.FileBatchService) === "function" ? _b : Object, typeof (_c = typeof batch_split_service_1.BatchSplitService !== "undefined" && batch_split_service_1.BatchSplitService) === "function" ? _c : Object, typeof (_d = typeof process_data_service_1.ProcessDataService !== "undefined" && process_data_service_1.ProcessDataService) === "function" ? _d : Object])
], UpdateFileSizeService);


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
var FileSizeService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSizeService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const client_s3_1 = __webpack_require__(29);
const node_http_handler_1 = __webpack_require__(42);
const https_1 = __webpack_require__(41);
const p_limit_1 = __webpack_require__(60);
const file_part_service_1 = __webpack_require__(61);
const default_service_1 = __webpack_require__(31);
let FileSizeService = FileSizeService_1 = class FileSizeService extends default_service_1.DefaultService {
    constructor(config, filePartService) {
        super();
        this.config = config;
        this.filePartService = filePartService;
        this.logger = new common_1.Logger(FileSizeService_1.name);
        this.concurrency = this.S3_SIZE_CONCURRENCY;
        const httpsAgent = new https_1.Agent(this.S3_AGGENT);
        this.s3 = new client_s3_1.S3Client({
            region: this.config.get('DO_SPACES_REGION'),
            endpoint: this.config.get('DO_SPACES_ENDPOINT'),
            credentials: {
                accessKeyId: this.config.get('DO_SPACES_KEY'),
                secretAccessKey: this.config.get('DO_SPACES_SECRET'),
            },
            requestHandler: new node_http_handler_1.NodeHttpHandler({ httpsAgent, ...this.S3_REQUEST_HEANDLER }),
        });
    }
    async getFileSizes(files) {
        this.logger.log(`Fetching sizes for ${files.length} files`);
        const limit = (0, p_limit_1.default)(this.concurrency);
        const enriched = await Promise.all(files.map(file => limit(async () => {
            let size = 0;
            let isExists = true;
            try {
                const head = await this.s3.send(new client_s3_1.HeadObjectCommand({
                    Bucket: this.config.get('DO_SPACES_BUCKET_NAME'),
                    Key: file.cPath,
                }));
                size = head.ContentLength ?? 0;
            }
            catch (err) {
                const code = err.name || err.$metadata?.httpStatusCode;
                if (code === 'NotFound' || code === 404) {
                    isExists = false;
                    this.logger.warn(`File not found: ${file.cPath}`);
                }
                else {
                    throw err;
                }
            }
            return { ...file, size, isExists, sizeVerified: isExists };
        })));
        this.logger.log(`Fetched sizes for ${enriched.length} files`);
        return enriched;
    }
};
exports.FileSizeService = FileSizeService;
exports.FileSizeService = FileSizeService = FileSizeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof file_part_service_1.FilePartService !== "undefined" && file_part_service_1.FilePartService) === "function" ? _b : Object])
], FileSizeService);


/***/ }),
/* 60 */
/***/ ((module) => {

module.exports = require("p-limit");

/***/ }),
/* 61 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FilePartService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FilePartService = void 0;
const common_1 = __webpack_require__(3);
const default_service_1 = __webpack_require__(31);
let FilePartService = FilePartService_1 = class FilePartService extends default_service_1.DefaultService {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(FilePartService_1.name);
    }
    async FileParts(size, startPartNo) {
        try {
            const parts = [];
            const MIN = this.S3_MIN_PART_SIZE;
            const MAX = this.S3_MAX_PART_SIZE;
            let partNo = startPartNo;
            parts.push({
                partNumber: partNo++,
                type: 'FIRST',
                dataRange: { offset: 0, length: MIN }
            });
            const lastStart = size - MIN;
            const lastPart = {
                partNumber: null,
                type: 'LAST',
                dataRange: { offset: lastStart, length: MIN }
            };
            const midStart = MIN;
            const midLen = lastStart - midStart;
            if (midLen >= MIN) {
                const minParts = Math.ceil(midLen / MAX);
                const maxParts = Math.floor(midLen / MIN);
                const numParts = minParts <= maxParts ? minParts : maxParts;
                const baseSize = Math.floor(midLen / numParts);
                const remainder = midLen % numParts;
                let offset = midStart;
                for (let i = 0; i < numParts; i++) {
                    const thisSize = baseSize + (i < remainder ? 1 : 0);
                    const end = offset + thisSize - 1;
                    parts.push({
                        partNumber: partNo++,
                        type: 'MIDDLE_COPY',
                        copyRange: `bytes=${offset}-${end}`
                    });
                    offset = end + 1;
                }
            }
            lastPart.partNumber = partNo++;
            parts.push(lastPart);
            return { parts, nextPartNo: partNo };
        }
        catch (error) {
            this.logger.error('Error in FileParts', error);
            throw error;
        }
    }
};
exports.FilePartService = FilePartService;
exports.FilePartService = FilePartService = FilePartService_1 = __decorate([
    (0, common_1.Injectable)()
], FilePartService);


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
var FileBatchService_1;
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileBatchService = void 0;
const common_1 = __webpack_require__(3);
const file_part_service_1 = __webpack_require__(61);
const default_service_1 = __webpack_require__(31);
let FileBatchService = FileBatchService_1 = class FileBatchService extends default_service_1.DefaultService {
    constructor(filePartService) {
        super();
        this.filePartService = filePartService;
        this.logger = new common_1.Logger(FileBatchService_1.name);
    }
    async createLargeBatches(files) {
        try {
            this.logger.log(`Creating large batches for ${files.length} files`);
            if (files?.length === 0) {
                this.logger.warn('No files provided for large batch creation');
                return [];
            }
            const batches = [];
            let fromPartNo = 1;
            let batchIndex = 1;
            let totalParts = 0;
            let totalSize = 0;
            batches.push({ batchIndex, files: [], totalSize: 0, totalParts: 0 });
            let isHaveJobs = false;
            for (const [index, file] of files.entries()) {
                if (file.isExists) {
                    const { parts, nextPartNo } = await this.filePartService.FileParts(Number(file?.size || 0), fromPartNo);
                    fromPartNo = nextPartNo;
                    file.parts = parts;
                    totalParts += parts.length;
                    totalSize += Number(file?.size || 0);
                    let currrentBatch = batches.find(b => b.batchIndex == batchIndex);
                    if (totalParts > this.S3_MAX_PARTS || totalSize > this.S3_MAX_BATCH_SIZE) {
                        batchIndex++;
                        batches.push({ batchIndex, files: [], totalSize: 0, totalParts: 0 });
                        currrentBatch = batches.find(b => b.batchIndex == batchIndex);
                        fromPartNo = 1;
                        totalSize = Number(file?.size || 0);
                        const { parts, nextPartNo } = await this.filePartService.FileParts(Number(file?.size || 0), fromPartNo);
                        fromPartNo = nextPartNo;
                        file.parts = parts;
                        totalParts = parts.length;
                    }
                    file.size = Number(file?.size || 0);
                    currrentBatch.files.push(file);
                    currrentBatch.totalSize = Number(totalSize);
                    currrentBatch.totalParts = totalParts;
                    isHaveJobs = true;
                }
            }
            if (!isHaveJobs) {
                this.logger.warn('No valid files found for large batch creation');
                return [];
            }
            this.logger.log(`Created ${batches.length} large batches with total parts: ${totalParts}`);
            return batches;
        }
        catch (error) {
            this.logger.error('Error creating batches', error);
            throw error;
        }
    }
    async createSmallBatches(files) {
        try {
            this.logger.log(`Creating small batches for ${files.length} files`);
            const batches = [];
            let batchIndex = 1;
            let totalSize = 0;
            let currentPartNumber = 1;
            let currentPart;
            batches.push({ batchIndex, parts: [], totalSize: 0, totalParts: 0 });
            let isHaveJobs = false;
            for (const [index, file] of files.entries()) {
                if (file.isExists) {
                    const batchCurrent = batches.find(b => b.batchIndex == batchIndex);
                    currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    if (!currentPart) {
                        batchCurrent.parts.push({
                            partNumber: currentPartNumber,
                            files: [],
                            totalSize: 0
                        });
                        currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    }
                    totalSize += Number(file?.size || 0);
                    if (totalSize > this.SMALL_PART_MAX_SIZE) {
                        currentPartNumber++;
                        batchCurrent.parts.push({
                            partNumber: currentPartNumber,
                            files: [],
                            totalSize: 0
                        });
                        totalSize = Number(file?.size || 0);
                        currentPart = batchCurrent.parts.find(p => p.partNumber == currentPartNumber);
                    }
                    currentPart.files.push(file);
                    currentPart.totalSize = totalSize;
                    batchCurrent.totalParts = batchCurrent.parts.length;
                    batchCurrent.totalSize += Number(file?.size || 0);
                    if (batchCurrent.parts.length > this.S3_MAX_PARTS) {
                        batchIndex++;
                        batches.push({ batchIndex, parts: [], totalSize: 0, totalParts: 0 });
                        currentPartNumber = 1;
                        totalSize = 0;
                    }
                    isHaveJobs = true;
                }
            }
            if (!isHaveJobs) {
                this.logger.warn('No valid files found for small batch creation');
                return [];
            }
            this.logger.log(`Created ${batches.length} small batches with total parts: ${batches.reduce((acc, b) => acc + b.parts.length, 0)}`);
            return batches;
        }
        catch (error) {
            this.logger.error('Error creating small batches', error);
            throw error;
        }
    }
};
exports.FileBatchService = FileBatchService;
exports.FileBatchService = FileBatchService = FileBatchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof file_part_service_1.FilePartService !== "undefined" && file_part_service_1.FilePartService) === "function" ? _a : Object])
], FileBatchService);


/***/ }),
/* 63 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BatchSplitService_1;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchSplitService = void 0;
const common_1 = __webpack_require__(3);
const default_service_1 = __webpack_require__(31);
let BatchSplitService = BatchSplitService_1 = class BatchSplitService extends default_service_1.DefaultService {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(BatchSplitService_1.name);
    }
    splitBatchFiles(files) {
        try {
            const smallFiles = files.filter(file => file.size && file.size < this.LARGE_BATCH_FILE_SIZE);
            const largeFiles = files.filter(file => file.size && file.size >= this.LARGE_BATCH_FILE_SIZE);
            const invalidFiles = files.filter(file => !file.size);
            return { smallFiles, largeFiles, invalidFiles };
        }
        catch (error) {
            this.logger.error(`Error splitting batch files: ${error.message}`, error.stack);
            throw new Error(`Error splitting batch files: ${error.message}`);
        }
    }
};
exports.BatchSplitService = BatchSplitService;
exports.BatchSplitService = BatchSplitService = BatchSplitService_1 = __decorate([
    (0, common_1.Injectable)()
], BatchSplitService);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LargebatchService = void 0;
const common_1 = __webpack_require__(3);
const redis_queue_service_1 = __webpack_require__(65);
const redis_service_1 = __webpack_require__(14);
const part_upload_service_1 = __webpack_require__(66);
const config_1 = __webpack_require__(9);
const config_key_service_1 = __webpack_require__(24);
const log_service_1 = __webpack_require__(17);
let LargebatchService = class LargebatchService extends redis_queue_service_1.RedisQueueService {
    constructor(redisService, partUploadService, configService, configKeyService, logService) {
        super(configService);
        this.redisService = redisService;
        this.partUploadService = partUploadService;
        this.configService = configService;
        this.configKeyService = configKeyService;
        this.logService = logService;
        this.log = new common_1.Logger('large-batch');
    }
    async startProcessing(nDPid, mainJob, batches, mainQueueCallBack) {
        try {
            this.log.fatal(`🔄 Starting processing large batches for nDPid: ${nDPid} with ${batches.length} batches`);
            this.logService.info(`🔄 Starting processing large batches with ${batches?.length} batches`, `queue/${nDPid}`);
            this.setUpConfig({
                key: this.configKeyService.largeBatchQueueName(nDPid),
                primaryKey: nDPid,
                jobOptions: {},
                concurrency: Number(this.configService.get('DOWNLOAD_PART_CONCURRENCY')) || 6
            });
            const qyeyeData = this.serializeBatchData(batches);
            const queue = await this.inilitializeQueue();
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.logService.info(`🔄 Processing job in queue ${this.QUEUE_NAME}`, `queue/${nDPid}`);
                this.log.log(`🔄 Processing job ${job.id} in queue ${this.QUEUE_NAME}`);
                this.startJobForBatch(nDPid, mainJob, job, batches, done);
            });
            queue.on('completed', (job, result) => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
            });
            queue.on('failed', (job, err) => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack, err);
                this.logService.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}`, `queue/${nDPid}`);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            });
            queue.once('drained', () => {
                this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
            });
            const isHaveJobs = await this.redisService.getBatchStatus(nDPid, 'largeBatchAdded');
            if (!isHaveJobs) {
                await this.processTasks(nDPid, qyeyeData, 'batchIndex');
                await this.redisService.updateBatchStatus(nDPid, true, 'largeBatchAdded');
            }
            else {
                const { retried, remaining } = await this.recoverExistingJobs(queue);
                this.logService.info(`No new jobs added to the large batch queue. Recovered existing jobs: retried=${retried}, remaining=${remaining}`, `queue/${nDPid}`);
                this.log.warn(`No new jobs added to the large batch queue for nDPid=${nDPid}. Recovered: retried=${retried}, remaining=${remaining}`);
                if (remaining === 0) {
                    await this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
                }
            }
        }
        catch (error) {
            this.logService.error(`❌ Error starting large batch processing  ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error starting large batch processing for nDPid=${nDPid}: ${error.message}`);
            mainQueueCallBack(error);
            return;
        }
    }
    performTask(job) {
    }
    onModuleInit() {
    }
    serializeBatchData(batch) {
        return batch.map((b, index) => {
            return {
                batchIndex: b.batchIndex,
                totalSize: b.totalSize || 0,
                totalParts: b.files.reduce((acc, file) => acc + (file.parts ? file.parts.length : 0), 0)
            };
        });
    }
    async startJobForBatch(nDPid, mainJob, job, batches, batchQueueCallBack) {
        const queueData = job.data;
        const currentBatch = batches.find(b => b.batchIndex == queueData.batchIndex);
        if (currentBatch) {
            this.logService.info(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`, `queue/${nDPid}`);
            this.log.verbose(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`);
            await this.partUploadService.startBatch(nDPid, mainJob, currentBatch, batchQueueCallBack);
        }
        else {
            this.logService.info(`Batch with index ${queueData.batchIndex} not found in serialized data`, `queue/${nDPid}`);
            this.log.error(`Batch with index ${queueData.batchIndex} not found in serialized data`);
            batchQueueCallBack(new Error(`Batch with index ${queueData.batchIndex} not found in serialized data`));
        }
    }
    async checkQueueComplete(nDPid, queue, mainQueueCallBack, err) {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        const failure = err || (counts.failed > 0
            ? new Error(`${counts.failed} large batch job(s) permanently failed in ${this.QUEUE_NAME}`)
            : undefined);
        if (remaining === 0) {
            try {
                const isBothBatchCompleted = await this.AllBatchCompleted(nDPid);
                if (isBothBatchCompleted) {
                    if (failure) {
                        this.logService.error(`Error occurred while processing batches: ${failure.message}`, `queue/${nDPid}`);
                        this.log.error(`Error occurred while processing batches for nDPid=${nDPid}`, failure);
                        mainQueueCallBack(failure);
                    }
                    else {
                        this.logService.info(`Completing Main Job`, `queue/${nDPid}`);
                        this.log.verbose(`Completing Main Job For nDPid=${nDPid} `);
                        mainQueueCallBack();
                    }
                }
                else {
                    this.logService.info(`Not all batches completed  Remaining jobs: ${remaining}`, `queue/${nDPid}`);
                    this.log.warn(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining}`);
                }
            }
            catch (error) {
                this.logService.error(`Error checking batch completion : ${error.message} `, `queue/${nDPid}`);
                this.log.error(`Error checking batch completion for nDPid=${nDPid}: ${error.message}`);
                mainQueueCallBack(error);
            }
            this.logService.info(`🎉 All jobs drained (queue=${this.QUEUE_NAME}).`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
        }
    }
};
exports.LargebatchService = LargebatchService;
exports.LargebatchService = LargebatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _a : Object, typeof (_b = typeof part_upload_service_1.PartUploadService !== "undefined" && part_upload_service_1.PartUploadService) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _d : Object, typeof (_e = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _e : Object])
], LargebatchService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.RedisQueueService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const Bull = __webpack_require__(25);
let RedisQueueService = class RedisQueueService {
    constructor(configService) {
        this.configService = configService;
        this.RETRY = 3;
        this.RETRY_DELAY = 1000;
        this.CONCURRENCY = 5;
        this.QUEUE_NAME = 'DOWNLOAD-QUEUE';
        this.JOB_OPTIONS = {};
        this.logger = new common_1.Logger('queue');
        this.redisConfig = { host: this.configService.get('REDIS_IP'), port: this.configService.get('REDIS_PORT'), password: this.configService.get('REDIS_PASSWORD') };
    }
    setUpConfig(obj) {
        this.QUEUE_NAME = obj?.key;
        this.PRIAMRY_JOB_KEY = obj?.primaryKey;
        this.JOB_OPTIONS = obj?.jobOptions || {};
        this.CONCURRENCY = obj?.concurrency || this.CONCURRENCY;
        this.RETRY = obj?.retry || this.RETRY;
        this.RETRY_DELAY = obj?.retry_delay || this.RETRY_DELAY;
        return this.QUEUE_NAME;
    }
    async inilitializeQueue() {
        this.logger.fatal('Initializing Redis download queue...');
        this.customQueue = new Bull(this.QUEUE_NAME, {
            redis: this.redisConfig,
            settings: {
                lockDuration: 120_000,
                stalledInterval: 30_000,
                maxStalledCount: 3,
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        });
        this.customQueue.on('completed', (job, result) => {
            this.checkQueueEmpty();
        });
        this.customQueue.on('failed', (job, err) => {
            this.checkQueueEmpty();
        });
        return this.customQueue;
    }
    async processTasks(nDPid, tasks, jobIdKey) {
        this.logger.fatal(`Processing tasks for nDPid=${nDPid} with ${tasks.length} tasks`);
        if (!tasks?.length) {
            return;
        }
        const jobs = tasks.map(task => ({
            data: { nDPid, ...task },
            opts: {
                jobId: String(task[jobIdKey]),
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: { type: 'exponential', delay: 1000 },
            },
        }));
        try {
            await this.customQueue.addBulk(jobs);
            console.log(`Enqueued ${jobs.length} download tasks for pid ${nDPid}`);
        }
        catch (err) {
            throw new Error(`Error pushing tasks to Redis queue: ${err.message}`);
        }
    }
    onModuleInit() {
    }
    async resetQueue(queue) {
        try {
            await queue.obliterate({ force: true });
            await queue.resume();
            this.logger.warn(`Reset queue ${queue.name}`);
        }
        catch (err) {
            throw new Error(`Error resetting queue ${queue.name}: ${err.message}`);
        }
    }
    async recoverExistingJobs(queue) {
        const failedJobs = await queue.getFailed();
        let retried = 0;
        for (const job of failedJobs) {
            try {
                await job.retry();
                retried++;
            }
            catch (err) {
                this.logger.error(`Could not retry failed job ${job.id} in ${queue.name}: ${err.message}`);
            }
        }
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        this.logger.warn(`Recovered ${queue.name}: retried=${retried} waiting=${counts.waiting} active=${counts.active} delayed=${counts.delayed} failed=${counts.failed}`);
        return { retried, remaining, failed: counts.failed };
    }
    performTask(job) {
    }
    async onModuleDestroy() {
        await this.customQueue.close();
    }
    async checkQueueEmpty() {
        const counts = await this.customQueue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        if (remaining === 0) {
            this.queuDrained(this.PRIAMRY_JOB_KEY, this.JOB_OPTIONS);
        }
    }
    queuDrained(PRIAMRY_JOB_KEY, JOB_OPTIONS = {}) {
    }
    async AllBatchCompleted(nDPid) {
        try {
            const largeQueue = new Bull(`download:${nDPid}:large-batches`, {
                redis: this.redisConfig
            });
            const smallQueue = new Bull(`download:${nDPid}:small-batches`, {
                redis: this.redisConfig
            });
            const largeCounts = await largeQueue.getJobCounts();
            const largeRemaining = largeCounts.waiting + largeCounts.active + largeCounts.delayed;
            const smallCounts = await smallQueue.getJobCounts();
            const smallRemaining = smallCounts.waiting + smallCounts.active + smallCounts.delayed;
            if (largeRemaining == 0 && smallRemaining == 0) {
                this.logger.log(`All batches completed for nDPid=${nDPid}`);
                return true;
            }
            this.logger.log(`Batches not completed for nDPid=${nDPid}: large remaining=${largeRemaining}, small remaining=${smallRemaining}`);
            return false;
        }
        catch (error) {
            this.logger.error(`Error initializing large batch queue for nDPid=${nDPid}: ${error.message}`);
            throw new Error(`Error checking if all batches are completed for nDPid=${nDPid}: ${error.message}`);
        }
    }
    async isJobsAlreadyAdded() {
        try {
            const counts = await this.customQueue.getJobCounts();
            const isHaveJobs = counts.waiting + counts.active + counts.delayed + counts.failed + counts.completed;
            return isHaveJobs > 0;
        }
        catch (error) {
            this.logger.error(`Error checking if queue has jobs: ${error.message}`);
            throw new Error(`Error checking if queue has jobs: ${error.message}`);
        }
    }
};
exports.RedisQueueService = RedisQueueService;
exports.RedisQueueService = RedisQueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object])
], RedisQueueService);


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PartUploadService = void 0;
const log_service_1 = __webpack_require__(17);
const common_1 = __webpack_require__(3);
const redis_queue_service_1 = __webpack_require__(65);
const upload_s3_service_1 = __webpack_require__(67);
const config_1 = __webpack_require__(9);
const config_key_service_1 = __webpack_require__(24);
const redis_service_1 = __webpack_require__(14);
let PartUploadService = class PartUploadService extends redis_queue_service_1.RedisQueueService {
    constructor(logService, uploadS3, configService, configKeyService, redisService) {
        super(configService);
        this.logService = logService;
        this.uploadS3 = uploadS3;
        this.configService = configService;
        this.configKeyService = configKeyService;
        this.redisService = redisService;
        this.log = new common_1.Logger('part-upload');
    }
    async startBatch(nDPid, mainJob, batche, batchQueueCallBack) {
        try {
            const tarKey = this.configKeyService.largeBatchName(nDPid, batche.batchIndex);
            const staleUploadId = await this.redisService.getUploadIdForBatch(nDPid, 'large', batche.batchIndex);
            if (staleUploadId) {
                this.logService.error(`Batch ${batche.batchIndex} has a stale upload ${staleUploadId} from a previous run — aborting and restarting the batch`, `queue/${nDPid}`);
                this.log.warn(`Stale upload ${staleUploadId} for nDPid=${nDPid}, batchIndex=${batche.batchIndex} — aborting and restarting the batch`);
                await this.uploadS3.abortUpload(nDPid, tarKey, staleUploadId);
            }
            const uploadId = await this.uploadS3.creteaUploadId(tarKey);
            const queueData = this.serializePartData(batche, uploadId, tarKey);
            this.logService.info(`🔄 Starting part upload for batch index: ${batche.batchIndex}`, `queue/${nDPid}`);
            this.log.fatal(`🔄 Starting part upload for batch with nDPid: ${nDPid} and batch index: ${batche.batchIndex}`);
            this.setUpConfig({
                key: this.configKeyService.largePartQueueName(nDPid, batche.batchIndex),
                primaryKey: nDPid,
                jobOptions: {
                    batchIndex: batche.batchIndex
                },
                concurrency: Number(this.configService.get('DOWNLOAD_PART_CONCURRENCY')) || 6
            });
            const queue = await this.inilitializeQueue();
            await this.resetQueue(queue);
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.executePartUpload(nDPid, job, batche, queueData, done);
            });
            queue.on('completed', async (job) => {
                try {
                    const total = await this.redisService.completeRefreshCount(nDPid);
                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', completedParts: total });
                }
                catch (error) {
                    this.logService.error(`❌ Error reporting progress batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error reporting progress for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
            });
            queue.on('failed', async (job, err) => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack, err);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
                this.logService.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
            });
            queue.on('drained', () => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
            });
            await this.redisService.addActiveBatch(nDPid, 'large', batche.batchIndex, uploadId);
            await this.processTasks(nDPid, queueData, 'identifier');
        }
        catch (error) {
            this.logService.error(`❌ Error in partQueue batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error in partQueue for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
            batchQueueCallBack(error);
            return;
        }
    }
    onModuleInit() {
    }
    serializePartData(batch, uploadId, tarKey) {
        this.log.log(`Serializing part data for batch index: ${batch.batchIndex}`);
        const result = [];
        for (const file of batch.files) {
            if (!file.parts?.length) {
                continue;
            }
            for (const part of file.parts) {
                result.push({
                    partNumber: part.partNumber,
                    type: part.type,
                    copyRange: part.copyRange,
                    dataRange: part.dataRange,
                    nBundledetailid: file.nBundledetailid,
                    identifier: `${batch.batchIndex}-${part.partNumber}`,
                    uploadId,
                    tarKey
                });
            }
        }
        return result;
    }
    async checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchIndex, batchQueueCallBack, err) {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        if (remaining === 0) {
            const failure = err || (counts.failed > 0
                ? new Error(`${counts.failed} part(s) permanently failed in ${this.QUEUE_NAME}`)
                : undefined);
            if (failure) {
                this.logService.error(`❌ Batch ${batchIndex} not completed: ${failure.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Batch ${batchIndex} not completed for nDPid=${nDPid}, tarKey=${tarKey}: ${failure.message}`);
                batchQueueCallBack(failure);
                return;
            }
            this.logService.info(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
            try {
                const ETag = await this.uploadS3.endOfArchive(nDPid, tarKey, uploadId, (queueData?.length + 1));
                await this.uploadS3.completeMultipartUpload(nDPid, tarKey, uploadId, queueData, { partNumnber: queueData?.length + 1, ETag });
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'large', batchIndex);
                }
                catch (error) {
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batchIndex}: ${error.message}`);
                }
            }
            catch (error) {
                this.logService.error(`❌ Error completing multipart upload tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}.`, `queue/${nDPid}`);
                this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
                batchQueueCallBack(error);
                return;
            }
            try {
                batchQueueCallBack();
            }
            catch (error) {
                this.logService.error(`❌ Error in batchQueueCallBack : ${error.message}.`, `queue/${nDPid}`);
                this.log.error(`❌ Error in batchQueueCallBack for nDPid=${nDPid}: ${error.message}`);
            }
        }
    }
    async executePartUpload(nDPid, job, batch, queueData, done) {
        const currentQueueData = job.data;
        this.logService.info(`Processing part upload job for batch ${batch.batchIndex} `, `queue/${nDPid}`);
        this.log.log(`Processing part upload job for batch ${batch.batchIndex} with Job ID: ${job.id}`);
        const fileDetail = batch.files.find(file => file.nBundledetailid == currentQueueData.nBundledetailid);
        this.logService.report(`{ part: ${currentQueueData.partNumber},nDPid: ${nDPid}, nBundledetailid: ${currentQueueData.nBundledetailid} },`, `queue/${nDPid}/batch_${batch.batchIndex}`);
        try {
            const ETag = await this.uploadS3.uploadParts(nDPid, currentQueueData, fileDetail);
            const partDetail = queueData.find(part => part.partNumber == currentQueueData.partNumber);
            partDetail.ETag = ETag;
            done();
        }
        catch (error) {
            this.logService.error(`❌ Error processing part upload batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error processing part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`);
            done(error);
        }
    }
};
exports.PartUploadService = PartUploadService;
exports.PartUploadService = PartUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object, typeof (_b = typeof upload_s3_service_1.UploadS3Service !== "undefined" && upload_s3_service_1.UploadS3Service) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _d : Object, typeof (_e = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _e : Object])
], PartUploadService);


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
var UploadS3Service_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadS3Service = void 0;
const log_service_1 = __webpack_require__(17);
const common_1 = __webpack_require__(3);
const header_service_1 = __webpack_require__(68);
const s3_service_1 = __webpack_require__(28);
const transform_name_service_1 = __webpack_require__(44);
let UploadS3Service = UploadS3Service_1 = class UploadS3Service {
    constructor(s3, headerService, transformName, logService) {
        this.s3 = s3;
        this.headerService = headerService;
        this.transformName = transformName;
        this.logService = logService;
        this.log = new common_1.Logger(UploadS3Service_1.name);
    }
    async creteaUploadId(tarKey) {
        return await this.s3.createMultipartUpload(tarKey, `application/x-tar`);
    }
    async abortUpload(nDPid, tarKey, uploadId) {
        try {
            await this.s3.abortMultipartUpload(tarKey, uploadId);
            this.logService.warn(`Aborted stale multipart upload tarKey=${tarKey}, uploadId=${uploadId}`, `queue/${nDPid}`);
        }
        catch (error) {
            this.logService.warn(`Could not abort stale upload tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
            this.log.warn(`Could not abort stale upload for nDPid=${nDPid}, tarKey=${tarKey}: ${error.message}`);
        }
    }
    async uploadParts(nDPid, part, fileDetail) {
        try {
            this.logService.info(`🔄 Uploading first part file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Uploading first part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`);
            if (part.type == 'FIRST') {
                return await this.uploadFirstPart(nDPid, part, fileDetail);
            }
            else if (part.type == 'MIDDLE_COPY') {
                return await this.uploadMiddleParts(nDPid, part, fileDetail);
            }
            else if (part.type == 'LAST') {
                return await this.uploadLastPart(nDPid, part, fileDetail);
            }
            else {
                this.logService.error(`❌ Invalid part type file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${part.type}`, `queue/${nDPid}`);
                this.log.error(`❌ Invalid part type for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${part.type}`);
            }
        }
        catch (error) {
            this.logService.error(`❌ Error uploading part file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error uploading part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            throw error;
        }
    }
    async endOfArchive(nDPid, tarKey, uploadId, lastPart) {
        try {
            const ETag = await this.s3.uploadPart(tarKey, uploadId, lastPart, Buffer.alloc(1024));
            return ETag;
        }
        catch (error) {
            this.logService.error(`❌ Error completing multipart upload  tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
            throw error;
        }
    }
    async completeMultipartUpload(nDPid, tarKey, uploadId, parts, endPart) {
        try {
            const partETags = parts.map(part => ({
                ETag: part.ETag,
                PartNumber: part.partNumber
            }));
            if (endPart) {
                partETags.push({
                    ETag: endPart.ETag,
                    PartNumber: endPart.partNumnber
                });
            }
            await this.s3.completeMultipartUpload(tarKey, uploadId, partETags);
            this.log.log(`✅ Successfully completed multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}`);
            this.logService.info(`✅ Successfully completed multipart upload for  tarKey=${tarKey}, uploadId=${uploadId}`, `queue/${nDPid}`);
        }
        catch (error) {
            this.logService.error(`❌ Error completing multipart upload for tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
            throw error;
        }
    }
    async uploadFirstPart(nDPid, part, fileDetail) {
        try {
            const source = fileDetail.cPath;
            const destination = this.transformName.sanitizeDestination(fileDetail.cFilename, fileDetail.foldername);
            const slice = await this.s3.downloadSlice(source, part.dataRange);
            const headers = this.headerService.createHeaderWithLongLink(destination, Number(fileDetail.size));
            const body = Buffer.concat([...headers, slice]);
            const ETag = await this.s3.uploadPart(part.tarKey, part.uploadId, part.partNumber, body);
            this.logService.info(`✅ Successfully uploaded first part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`, `queue/${nDPid}`);
            this.log.log(`✅ Successfully uploaded first part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`);
            return ETag;
        }
        catch (error) {
            this.logService.error(`❌ Error uploading first part file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error uploading first part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            throw error;
        }
    }
    async uploadMiddleParts(nDPid, part, fileDetail) {
        try {
            this.logService.info(`🔄 Uploading middle part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Uploading middle part for nDPid: ${nDPid}, file: ${fileDetail.nBundledetailid}, part: ${part.partNumber}`);
            const source = fileDetail.cPath;
            const ETag = await this.s3.uploadPartCopy(part.tarKey, part.uploadId, part.partNumber, `${this.s3.sourceBucket}/${source}`, part.copyRange);
            this.log.log(`✅ Successfully uploaded middle part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`);
            this.logService.info(`✅ Successfully uploaded middle part for file=${fileDetail.nBundledetailid}, part=${part.partNumber}, ETag=${ETag}`, `queue/${nDPid}`);
            return ETag;
        }
        catch (error) {
            this.log.error(`❌ Error uploading middle part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            this.logService.error(`❌ Error uploading middle part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            throw error;
        }
    }
    async uploadLastPart(nDPid, part, fileDetail) {
        try {
            const source = fileDetail.cPath;
            const slice = await this.s3.downloadSlice(source, part.dataRange);
            const pad = Buffer.alloc((512 - (Number(fileDetail.size) % 512)) % 512);
            const body = Buffer.concat([slice, pad]);
            const ETag = await this.s3.uploadPart(part.tarKey, part.uploadId, part.partNumber, body);
            return ETag;
        }
        catch (error) {
            this.log.error(`❌ Error uploading last part for nDPid=${nDPid}, file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`);
            this.logService.error(`❌ Error uploading last part  file=${fileDetail.nBundledetailid}, part=${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            throw error;
        }
    }
};
exports.UploadS3Service = UploadS3Service;
exports.UploadS3Service = UploadS3Service = UploadS3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object, typeof (_b = typeof header_service_1.HeaderService !== "undefined" && header_service_1.HeaderService) === "function" ? _b : Object, typeof (_c = typeof transform_name_service_1.TransformNameService !== "undefined" && transform_name_service_1.TransformNameService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object])
], UploadS3Service);


/***/ }),
/* 68 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.HeaderService = void 0;
const common_1 = __webpack_require__(3);
let HeaderService = class HeaderService {
    createHeader(filePath, size, typeflag = '0') {
        const buf = Buffer.alloc(512, 0);
        const nameBuf = Buffer.from(filePath, 'utf8');
        if (nameBuf.length > 100) {
            let splitIndex = filePath.length - 100;
            const lastSlash = filePath.lastIndexOf('/', splitIndex);
            if (lastSlash !== -1)
                splitIndex = lastSlash;
            const prefix = filePath.substring(0, splitIndex);
            const name = filePath.substring(splitIndex + 1);
            if (prefix.length > 155 || name.length > 100) {
                buf.write(filePath.substring(0, 100), 0, 100, 'utf8');
            }
            else {
                buf.write(name, 0, 100, 'utf8');
                buf.write(prefix, 345, 155, 'utf8');
            }
        }
        else {
            buf.write(filePath, 0, 100, 'utf8');
        }
        buf.write(this.pad(0o644, 8), 100);
        buf.write(this.pad(0, 8), 108);
        buf.write(this.pad(0, 8), 116);
        buf.write(this.pad(size, 12), 124);
        buf.write(this.pad(Math.floor(Date.now() / 1000), 12), 136);
        buf.write('        ', 148);
        buf.write(typeflag, 156);
        buf.write('ustar\0', 257);
        buf.write('00', 263);
        const sum = this.checksumBlock(buf);
        buf.write(this.pad(sum, 8), 148);
        return buf;
    }
    createPaxHeader(fields) {
        let body = '';
        for (const [key, value] of Object.entries(fields)) {
            let entry = `${key}=${value}\n`;
            let len = entry.length + ('' + entry.length).length + 1;
            while ((`${len} ${entry}`).length !== len) {
                len = (`${len} ${entry}`).length;
            }
            body += `${len} ${entry}`;
        }
        const bodyBuf = Buffer.from(body, 'utf8');
        const headerBuf = this.createHeader('././@PaxHeader', bodyBuf.length, 'x');
        const padding = Buffer.alloc((512 - (bodyBuf.length % 512)) % 512);
        return Buffer.concat([headerBuf, bodyBuf, padding]);
    }
    createHeaderWithPaxSupport(filePath, size) {
        const filePathBytes = Buffer.byteLength(filePath, 'utf8');
        if (filePathBytes > 100) {
            const paxHeader = this.createPaxHeader({ path: filePath });
            const regularHeader = this.createHeader('./file', size);
            return [paxHeader, regularHeader];
        }
        else {
            return [this.createHeader(filePath, size)];
        }
    }
    pad(value, length) {
        return value.toString(8).padStart(length - 1, '0') + '\0';
    }
    checksumBlock(block) {
        let sum = 0;
        for (let i = 0; i < block.length; i++) {
            sum += (i >= 148 && i < 156) ? 32 : block[i];
        }
        return sum;
    }
    buildUstarHeader(filename, size, typeflag = '0', prefix = '') {
        const buf = Buffer.alloc(512, 0);
        buf.write(filename, 0, 100, 'utf8');
        buf.write(this.pad(0o644, 8), 100);
        buf.write(this.pad(0, 8), 108);
        buf.write(this.pad(0, 8), 116);
        buf.write(this.pad(size, 12), 124);
        buf.write(this.pad(Math.floor(Date.now() / 1000), 12), 136);
        buf.write('        ', 148);
        buf.write(typeflag, 156);
        buf.write('ustar\0', 257);
        buf.write('00', 263);
        if (prefix)
            buf.write(prefix, 345, 155, 'utf8');
        const sum = this.checksumBlock(buf);
        buf.write(this.pad(sum, 8), 148);
        return buf;
    }
    writeLongLinkHeader(fullPath) {
        const pathBuf = Buffer.from(fullPath + '\0', 'utf8');
        const longHdr = this.buildUstarHeader('././@LongLink', pathBuf.length, 'L');
        const padding = Buffer.alloc((512 - (pathBuf.length % 512)) % 512);
        return [longHdr, Buffer.concat([pathBuf, padding])];
    }
    createHeaderWithLongLink(filePath, size) {
        const nameBuf = Buffer.from(filePath, 'utf8');
        if (nameBuf.length <= 100) {
            return [this.buildUstarHeader(filePath, size)];
        }
        let prefix = '', name = filePath;
        let idx = filePath.length;
        while (idx > 0) {
            const slash = filePath.lastIndexOf('/', idx - 1);
            if (slash === -1)
                break;
            const candidatePrefix = filePath.slice(0, slash);
            const candidateName = filePath.slice(slash + 1);
            if (Buffer.byteLength(candidatePrefix, 'utf8') <= 155 &&
                Buffer.byteLength(candidateName, 'utf8') <= 100) {
                prefix = candidatePrefix;
                name = candidateName;
                break;
            }
            idx = slash;
        }
        if (prefix) {
            return [this.buildUstarHeader(name, size, '0', prefix)];
        }
        const longlinkBuffers = this.writeLongLinkHeader(filePath);
        let placeholder = filePath.slice(-99);
        while (Buffer.byteLength(placeholder, 'utf8') > 99) {
            placeholder = placeholder.slice(1);
        }
        const placeholderHdr = this.buildUstarHeader(placeholder, size);
        return [...longlinkBuffers, placeholderHdr];
    }
};
exports.HeaderService = HeaderService;
exports.HeaderService = HeaderService = __decorate([
    (0, common_1.Injectable)()
], HeaderService);
function lengthPrefixLength(line) {
    return line.length.toString().length + 1;
}


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
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SmallbatchService = void 0;
const common_1 = __webpack_require__(3);
const redis_queue_service_1 = __webpack_require__(65);
const small_part_upload_service_1 = __webpack_require__(70);
const config_1 = __webpack_require__(9);
const config_key_service_1 = __webpack_require__(24);
const redis_service_1 = __webpack_require__(14);
const log_service_1 = __webpack_require__(17);
let SmallbatchService = class SmallbatchService extends redis_queue_service_1.RedisQueueService {
    constructor(smallPartUploadService, configService, configKeyService, redisService, logService) {
        super(configService);
        this.smallPartUploadService = smallPartUploadService;
        this.configService = configService;
        this.configKeyService = configKeyService;
        this.redisService = redisService;
        this.logService = logService;
        this.log = new common_1.Logger('small-batch');
    }
    async startProcessing(nDPid, mainJob, batches, mainQueueCallBack) {
        this.log.fatal(`🔄 Starting processing small batches for nDPid: ${nDPid} with ${batches.length} batches`);
        this.logService.info(`🔄 Starting processing small batches for with ${batches.length} batches`, `queue/${nDPid}`);
        this.setUpConfig({
            key: this.configKeyService.smallBatchQueueName(nDPid),
            primaryKey: nDPid,
            jobOptions: {},
            concurrency: Number(this.configService.get('DOWNLOAD_PART_CONCURRENCY')) || 6
        });
        const qyeyeData = this.serializeBatchData(batches);
        if (!qyeyeData?.length) {
            this.logService.error(`No valid batch data found for nDPid=${nDPid}. Skipping queue processing.`, `queue/${nDPid}`);
            this.log.error(`No valid batch data found for nDPid=${nDPid}. Skipping queue processing.`);
            mainQueueCallBack();
            return;
        }
        const queue = await this.inilitializeQueue();
        queue.process(this.CONCURRENCY, async (job, done) => {
            this.logService.info(`🔄 Processing job in queue ${this.QUEUE_NAME}`, `queue/${nDPid}`);
            this.log.log(`🔄 Processing job ${job.id} in queue ${this.QUEUE_NAME}`);
            this.startJobForBatch(nDPid, mainJob, job, batches, done);
        });
        queue.on('completed', (job, result) => {
            this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
        });
        queue.on('failed', (job, err) => {
            this.checkQueueComplete(nDPid, queue, mainQueueCallBack, err);
            this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            this.logService.error(`❌ Job failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
        });
        queue.once('drained', () => {
            this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
        });
        const isHaveJobs = await this.redisService.getBatchStatus(nDPid, 'smallBatchAdded');
        if (!isHaveJobs) {
            await this.processTasks(nDPid, qyeyeData, 'batchIndex');
            await this.redisService.updateBatchStatus(nDPid, true, 'smallBatchAdded');
        }
        else {
            const { retried, remaining } = await this.recoverExistingJobs(queue);
            this.logService.info(`No new jobs added to the small batch queue. Recovered existing jobs: retried=${retried}, remaining=${remaining}`, `queue/${nDPid}`);
            this.log.warn(`No new jobs added to the small batch queue for nDPid=${nDPid}. Recovered: retried=${retried}, remaining=${remaining}`);
            if (remaining === 0) {
                await this.checkQueueComplete(nDPid, queue, mainQueueCallBack);
            }
        }
    }
    serializeBatchData(batch) {
        return batch.map((b, index) => {
            return {
                batchIndex: b.batchIndex,
                totalSize: b.totalSize || 0,
                totalParts: b.parts?.length || 0
            };
        }).filter(b => b.totalSize > 0 && b.totalParts > 0);
    }
    onModuleInit() {
    }
    async checkQueueComplete(nDPid, queue, mainQueueCallBack, err) {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        const failure = err || (counts.failed > 0
            ? new Error(`${counts.failed} small batch job(s) permanently failed in ${this.QUEUE_NAME}`)
            : undefined);
        if (remaining === 0) {
            try {
                const isBothBatchCompleted = await this.AllBatchCompleted(nDPid);
                if (isBothBatchCompleted) {
                    if (failure) {
                        this.log.error(`Error occurred while processing batches for nDPid=${nDPid}`, failure);
                        this.logService.error(`Error occurred while processing small batches: ${failure.message}`, `queue/${nDPid}`);
                        mainQueueCallBack(failure);
                    }
                    else {
                        this.logService.info(`Completing Main Job in small`, `queue/${nDPid}`);
                        this.log.verbose(`Completing Main Job For nDPid=${nDPid} `);
                        mainQueueCallBack();
                    }
                }
                else {
                    this.logService.info(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining} `, `queue/${nDPid}`);
                    this.log.warn(`Not all batches completed for nDPid=${nDPid}. Remaining jobs: ${remaining}`);
                }
            }
            catch (error) {
                this.logService.error(`Error checking batch completion`, `queue/${nDPid}`);
                this.log.error(`Error checking batch completion for nDPid=${nDPid}: ${error.message}`);
                mainQueueCallBack(error);
            }
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
        }
    }
    async startJobForBatch(nDPid, mainJob, job, batches, batchQueueCallBack) {
        const queueData = job.data;
        const currentBatch = batches.find(b => b.batchIndex == queueData.batchIndex);
        if (currentBatch) {
            this.logService.info(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts} `, `queue/${nDPid}`);
            this.log.verbose(`Processing batch ${queueData.batchIndex} with total size ${currentBatch.totalSize} and total parts ${currentBatch.totalParts}`);
            await this.smallPartUploadService.startBatch(nDPid, mainJob, currentBatch, batchQueueCallBack);
        }
        else {
            this.logService.error(`Batch with index ${queueData.batchIndex} not found in serialized data`, `queue/${nDPid}`);
            this.log.error(`Batch with index ${queueData.batchIndex} not found in serialized data`);
            batchQueueCallBack(new Error(`Batch with index ${queueData.batchIndex} not found in serialized data`));
        }
    }
};
exports.SmallbatchService = SmallbatchService;
exports.SmallbatchService = SmallbatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof small_part_upload_service_1.SmallPartUploadService !== "undefined" && small_part_upload_service_1.SmallPartUploadService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _c : Object, typeof (_d = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _d : Object, typeof (_e = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _e : Object])
], SmallbatchService);


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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SmallPartUploadService = void 0;
const common_1 = __webpack_require__(3);
const redis_queue_service_1 = __webpack_require__(65);
const upload_s3_service_1 = __webpack_require__(67);
const stream_s3_service_1 = __webpack_require__(71);
const log_service_1 = __webpack_require__(17);
const config_1 = __webpack_require__(9);
const redis_service_1 = __webpack_require__(14);
const config_key_service_1 = __webpack_require__(24);
let SmallPartUploadService = class SmallPartUploadService extends redis_queue_service_1.RedisQueueService {
    constructor(uploadS3, streamS3, logService, configService, redisService, configKeyService) {
        super(configService);
        this.uploadS3 = uploadS3;
        this.streamS3 = streamS3;
        this.logService = logService;
        this.configService = configService;
        this.redisService = redisService;
        this.configKeyService = configKeyService;
        this.log = new common_1.Logger('small-part-upload');
    }
    async startBatch(nDPid, mainJob, batche, batchQueueCallBack) {
        try {
            this.log.fatal(`🔄 Starting part upload for batch with nDPid: ${nDPid} and batch index: ${batche.batchIndex} and size : ${batche.totalSize} `);
            this.logService.info(`🔄 Starting part upload for batch batch index: ${batche.batchIndex} and size : ${batche.totalSize} `, `queue/${nDPid}`);
            const tarKey = this.configKeyService.smallBatchName(nDPid, batche.batchIndex);
            const staleUploadId = await this.redisService.getUploadIdForBatch(nDPid, 'small', batche.batchIndex);
            if (staleUploadId) {
                this.logService.error(`Batch ${batche.batchIndex} has a stale upload ${staleUploadId} from a previous run — aborting and restarting the batch`, `queue/${nDPid}`);
                this.log.warn(`Stale upload ${staleUploadId} for nDPid=${nDPid}, batchIndex=${batche.batchIndex} — aborting and restarting the batch`);
                await this.uploadS3.abortUpload(nDPid, tarKey, staleUploadId);
            }
            const uploadId = await this.uploadS3.creteaUploadId(tarKey);
            const queueData = this.serializePartData(batche, uploadId, tarKey);
            this.setUpConfig({
                key: this.configKeyService.smallPartQueueName(nDPid, batche.batchIndex),
                primaryKey: nDPid,
                jobOptions: {
                    batchIndex: batche.batchIndex
                },
                concurrency: Number(this.configService.get('DOWNLOAD_PART_CONCURRENCY')) || 6
            });
            const queue = await this.inilitializeQueue();
            await this.resetQueue(queue);
            queue.process(this.CONCURRENCY, async (job, done) => {
                this.executePartUpload(nDPid, queueData, job, batche, done);
            });
            queue.on('completed', async (job) => {
                try {
                    const total = await this.redisService.completeRefreshCount(nDPid);
                    await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', completedParts: total });
                }
                catch (error) {
                    this.logService.error(`❌ Error reporting progress batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
                    this.log.error(`❌ Error reporting progress for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
                }
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
            });
            queue.on('failed', async (job, err) => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack, err);
                this.logService.error(`❌ Job failed in queue ${this.QUEUE_NAME}: ${err.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Job ${job.id} failed in queue ${this.QUEUE_NAME}: ${err.message}`);
            });
            queue.on('drained', () => {
                this.checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batche.batchIndex, batchQueueCallBack);
                this.log.verbose(`🔄 Queue ${this.QUEUE_NAME} has drained — no more waiting jobs`);
            });
            await this.redisService.addActiveBatch(nDPid, 'small', batche.batchIndex, uploadId);
            await this.processTasks(nDPid, queueData, 'identifier');
        }
        catch (error) {
            this.logService.error(`❌ Error in partQueue batchIndex=${batche.batchIndex}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error in partQueue for nDPid=${nDPid}, batchIndex=${batche.batchIndex}: ${error.message}`);
            batchQueueCallBack(error);
            return;
        }
    }
    serializePartData(batch, uploadId, tarKey) {
        this.log.log(`Serializing part data for batch index: ${batch.batchIndex}`);
        const result = [];
        for (const part of batch.parts) {
            result.push({
                partNumber: part.partNumber,
                identifier: `${batch.batchIndex}-${part.partNumber}`,
                uploadId,
                tarKey
            });
        }
        return result;
    }
    async checkQueueComplete(nDPid, queue, queueData, tarKey, uploadId, batchIndex, batchQueueCallBack, err) {
        const counts = await queue.getJobCounts();
        const remaining = counts.waiting + counts.active + counts.delayed;
        if (remaining === 0) {
            const failure = err || (counts.failed > 0
                ? new Error(`${counts.failed} part(s) permanently failed in ${this.QUEUE_NAME}`)
                : undefined);
            if (failure) {
                this.logService.error(`❌ Batch ${batchIndex} not completed: ${failure.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Batch ${batchIndex} not completed for nDPid=${nDPid}, tarKey=${tarKey}: ${failure.message}`);
                batchQueueCallBack(failure);
                return;
            }
            this.logService.info(`All jobs completed . Remaining jobs: ${remaining}`, `queue/${nDPid}`);
            this.log.verbose(`🔄 All jobs processed for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}. Completing multipart upload...`);
            try {
                await this.uploadS3.completeMultipartUpload(nDPid, tarKey, uploadId, queueData);
                try {
                    await this.redisService.removeActiveBatch(nDPid, 'small', batchIndex);
                }
                catch (error) {
                    this.log.error(`❌ Error removing active batch for nDPid=${nDPid}, batchIndex=${batchIndex}: ${error.message}`);
                }
            }
            catch (error) {
                this.logService.error(`❌ Error completing multipart upload  tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Error completing multipart upload for nDPid=${nDPid}, tarKey=${tarKey}, uploadId=${uploadId}: ${error.message}`);
                batchQueueCallBack(error);
                return;
            }
            try {
                batchQueueCallBack();
            }
            catch (error) {
                this.logService.error(`❌ Error in batchQueueCallBack : ${error.message}`, `queue/${nDPid}`);
                this.log.error(`❌ Error in batchQueueCallBack for nDPid=${nDPid}: ${error.message}`);
            }
            this.logService.info(`✅ Successfully completed multipart upload  tarKey=${tarKey}, uploadId=${uploadId}`, `queue/${nDPid}`);
            this.log.log(`🎉 All jobs drained for nDPid=${nDPid} (queue=${this.QUEUE_NAME}).`);
        }
    }
    async executePartUpload(nDPid, queueData, job, batch, done) {
        const currentQueueData = job.data;
        this.log.log(`Processing small part ${currentQueueData.partNumber} upload job for batch ${batch.batchIndex} with Job ID: ${job.id}`);
        this.logService.info(`{ part: ${currentQueueData.partNumber},nDPid: ${nDPid}, "isSmall":true`, `queue/${nDPid}/smallbatch_${batch.batchIndex}`);
        try {
            const part = batch.parts.find(file => file.partNumber == currentQueueData.partNumber);
            if (!part) {
                this.logService.error(`❌ Part with number ${currentQueueData.partNumber} not found in batch ${batch.batchIndex}`, `queue/${nDPid}`);
                this.log.error(`❌ Part with number ${currentQueueData.partNumber} not found in batch ${batch.batchIndex}`);
                done(new Error(`Part not found: ${currentQueueData.partNumber}`));
                return;
            }
            this.log.verbose(`🔄 Processing small part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${part.partNumber}, partSize=${part.totalSize}, partFiles=${part.files?.length}`);
            const isItLastPart = part.partNumber === batch.parts?.length;
            const ETag = await this.streamS3.streamFileToS3(nDPid, currentQueueData, part, batch, isItLastPart);
            const partDetail = queueData.find(part => part.partNumber == currentQueueData.partNumber);
            partDetail.ETag = ETag;
            this.log.log(`✅ Successfully processed small part ${part.partNumber} upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}, ETag=${ETag}`);
            done();
        }
        catch (error) {
            this.logService.error(`❌ Error processing small part upload  batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error processing small part upload for nDPid=${nDPid}, batchIndex=${batch.batchIndex}, partNumber=${currentQueueData.partNumber}: ${error.message}`);
            done(error);
        }
    }
};
exports.SmallPartUploadService = SmallPartUploadService;
exports.SmallPartUploadService = SmallPartUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_s3_service_1.UploadS3Service !== "undefined" && upload_s3_service_1.UploadS3Service) === "function" ? _a : Object, typeof (_b = typeof stream_s3_service_1.StreamS3Service !== "undefined" && stream_s3_service_1.StreamS3Service) === "function" ? _b : Object, typeof (_c = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _c : Object, typeof (_d = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _d : Object, typeof (_e = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _e : Object, typeof (_f = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _f : Object])
], SmallPartUploadService);


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
var StreamS3Service_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StreamS3Service = void 0;
const log_service_1 = __webpack_require__(17);
const common_1 = __webpack_require__(3);
const header_service_1 = __webpack_require__(68);
const s3_service_1 = __webpack_require__(28);
const transform_name_service_1 = __webpack_require__(44);
const stream_1 = __webpack_require__(40);
let StreamS3Service = StreamS3Service_1 = class StreamS3Service {
    constructor(headerService, transformName, s3, logService) {
        this.headerService = headerService;
        this.transformName = transformName;
        this.s3 = s3;
        this.logService = logService;
        this.log = new common_1.Logger(StreamS3Service_1.name);
    }
    async streamFileToS3(nDPid, queueData, part, batch, isLastPart) {
        this.log.log(`🔄 Streaming file to S3 for nDPid: ${nDPid}, part: ${part.partNumber}, isLastPart: ${isLastPart}`);
        const pass = new stream_1.PassThrough();
        pass.on('error', (err) => {
            this.log.error(`PassThrough error (nDPid=${nDPid}, part=${part.partNumber}): ${err?.message}`);
        });
        try {
            const files = part.files;
            if (!files || !files?.length) {
                this.logService.error(`❌ No files found  part: ${part.partNumber}`, `queue/${nDPid}`);
                pass.destroy(new Error(`No files found for nDPid: ${nDPid} and part: ${part.partNumber}`));
                this.log.error(`❌ No files found for nDPid: ${nDPid} and part: ${part.partNumber}`);
                throw new Error(`No files found for nDPid: ${nDPid} and part: ${part.partNumber}`);
            }
            const unverified = part.files.filter((f) => !f.sizeVerified);
            await Promise.all(unverified.map(async (file) => {
                try {
                    const realSize = await this.s3.headObjectSize(file.cPath, this.s3.sourceBucket);
                    if (Number.isFinite(realSize) && realSize > 0) {
                        file.size = realSize;
                    }
                }
                catch (e) {
                    this.log.error(`⚠️ Could not fetch real size for ${file.cPath}: ${e?.message}`);
                }
            }));
            let contentLength = 0;
            for (const file of part.files) {
                const destination = this.transformName.sanitizeDestination(file.cFilename, file.foldername);
                const headers = this.headerService.createHeaderWithLongLink(destination, Number(file.size));
                contentLength += headers.reduce((sum, header) => sum + header.length, 0);
                const dataSize = Number(file.size);
                contentLength += dataSize;
                const padSize = (512 - (dataSize % 512)) % 512;
                contentLength += padSize;
            }
            if (isLastPart) {
                contentLength += 1024;
            }
            const uploadPromise = this.s3.uploadPartStream(queueData.tarKey, queueData.uploadId, queueData.partNumber, pass, Number(contentLength));
            uploadPromise.catch(() => { });
            await this.getStreamFromFiles(nDPid, batch, files, pass, part.partNumber);
            if (isLastPart) {
                this.log.verbose(`🔄 Writing end of archive for nDPid: ${nDPid}, part: ${part.partNumber}`);
                pass.write(Buffer.alloc(1024));
            }
            pass.end();
            this.logService.info(`🔄 Waiting for upload to complete part: ${part.partNumber}`, `queue/${nDPid}`);
            this.log.log(`🔄 Waiting for upload to complete for nDPid: ${nDPid}, part: ${part.partNumber}`);
            const { ETag } = await uploadPromise;
            this.log.log(`✅ Successfully uploaded part ${part.partNumber} for nDPid: ${nDPid}, ETag: ${ETag}`);
            this.logService.info(`✅ Successfully uploaded part ${part.partNumber}  ETag: ${ETag}`, `queue/${nDPid}`);
            return ETag;
        }
        catch (error) {
            this.logService.error(`❌ Error streaming file to S3  part: ${part.partNumber}: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error streaming file to S3 for nDPid: ${nDPid}, part: ${part.partNumber}: ${error.message}`);
            pass.destroy(error);
            throw error;
        }
    }
    async getStreamFromFiles(nDPid, batch, files, pass, partNumber) {
        this.log.log(`🔄 Getting stream from files: ${files.map(file => file.cFilename).join(', ')}`);
        try {
            for (const file of files) {
                const source = file.cPath;
                const destination = this.transformName.sanitizeDestination(file.cFilename, file.foldername);
                this.logService.report(`{ part: ${partNumber}, nBundledetailid: "${file.nBundledetailid}", "file": "${file.cFilename}", "foldername": "${file.foldername}", "destination": "${destination}" },`, `queue/${nDPid}/smallbatch_${batch.batchIndex}`);
                this.log.warn(`🔄 part=${partNumber} Streaming file ${file.cFilename} from ${source} to ${destination} size: ${Number(file.size)}`);
                const headers = this.headerService.createHeaderWithLongLink(destination, Number(file.size));
                for (const header of headers) {
                    pass.write(header);
                }
                const body = await this.s3.getObject(source);
                for await (const chunk of body) {
                    pass.write(chunk);
                }
                const fileSize = Number(file.size);
                const padSize = (512 - (fileSize % 512)) % 512;
                if (padSize > 0) {
                    pass.write(Buffer.alloc(padSize));
                }
            }
        }
        catch (error) {
            this.logService.error(`❌ Error getting stream from files: ${error.message}`, `queue/${nDPid}`);
            this.log.error(`❌ Error getting stream from files: ${error.message}`);
            throw error;
        }
    }
};
exports.StreamS3Service = StreamS3Service;
exports.StreamS3Service = StreamS3Service = StreamS3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof header_service_1.HeaderService !== "undefined" && header_service_1.HeaderService) === "function" ? _a : Object, typeof (_b = typeof transform_name_service_1.TransformNameService !== "undefined" && transform_name_service_1.TransformNameService) === "function" ? _b : Object, typeof (_c = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object])
], StreamS3Service);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var FinalizeArchiverService_1;
var _a, _b, _c, _d, _e, _f, _g;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FinalizeArchiverService = void 0;
const common_1 = __webpack_require__(3);
const bull_1 = __webpack_require__(25);
const config_key_service_1 = __webpack_require__(24);
const s3_service_1 = __webpack_require__(28);
const config_1 = __webpack_require__(9);
const bull_2 = __webpack_require__(26);
const redis_service_1 = __webpack_require__(14);
const generate_presigned_url_service_1 = __webpack_require__(73);
const default_service_1 = __webpack_require__(31);
const log_service_1 = __webpack_require__(17);
let FinalizeArchiverService = FinalizeArchiverService_1 = class FinalizeArchiverService extends default_service_1.DefaultService {
    constructor(configKeyService, s3Service, configService, deleteTarQueue, redisService, generatePresignedUrlService, logService) {
        super();
        this.configKeyService = configKeyService;
        this.s3Service = s3Service;
        this.configService = configService;
        this.deleteTarQueue = deleteTarQueue;
        this.redisService = redisService;
        this.generatePresignedUrlService = generatePresignedUrlService;
        this.logService = logService;
        this.logger = new common_1.Logger(FinalizeArchiverService_1.name);
        this.MAX_COPY_PART_SIZE = this.MAX_COPY_PART_SIZE_IN_FINAL_MEARGE;
        this.CONCURRENCY = this.CONCURRENCY_IN_FINAL_MEARGE;
        this.downloadBucket = this.configService.get('DO_SPACES_DOWNLOAD_BUCKET_NAME');
    }
    async finalizeArchive(nDPid, mainJob, mainQueueCallBack, largeBatches, smallBatches, jobDetail) {
        const finalKey = this.configKeyService.finalArchiveName(nDPid, jobDetail?.cZipname);
        this.logService.log(`Finalizing archive for nDPid=${nDPid}, finalKey=${finalKey}`, `queue/${nDPid}`);
        try {
            this.redisService.updateActionStatus(nDPid, mainJob, 'FINAL-MEARGING');
        }
        catch (error) {
            this.logService.error(`Error updating action status : ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error updating action status for nDPid=${nDPid}: ${error.message}`, error.stack);
            mainQueueCallBack(error);
            return;
        }
        try {
            await this.clearExistingArchive(finalKey);
        }
        catch (error) {
            this.logService.error(`Error clearing existing archive for nDPid=${nDPid}: ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error clearing existing archive for nDPid=${nDPid}: ${error.message}`, error.stack);
        }
        const mergeItems = await this.getMergeBatchJob(nDPid, largeBatches, smallBatches);
        const keysToMerge = mergeItems.map(item => item.name);
        this.logger.verbose(`Merging [${keysToMerge.join(', ')}] → ${finalKey}`);
        this.logService.info(`Merging [${keysToMerge.join(', ')}] → ${finalKey}`, `queue/${nDPid}`);
        let uploadId;
        try {
            uploadId = await this.s3Service.createMultipartUpload(finalKey);
            const plan = await this.buildCopyPlan(keysToMerge);
            await this.redisService.finalMergeTotalPartsCount(nDPid, plan?.length || 0);
            await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', MergeTotalParts: plan?.length || 0 });
            const parts = await this.executeCopyPlan(nDPid, plan, finalKey, uploadId, mainJob);
            await this.s3Service.completeMultipartUpload(finalKey, uploadId, parts);
            await this.generatePresignedUrlService.updatePresignedUrl(nDPid, finalKey);
            await this.moveToDeleteTars(keysToMerge);
            this.logger.log(`Final archive created: ${finalKey}`);
            this.logService.info(`Final archive created: ${finalKey}`, `queue/${nDPid}`);
            mainQueueCallBack(null, { finalKey });
        }
        catch (error) {
            await this.abortArchiveCreation(nDPid, finalKey, uploadId);
            this.logger.error(`Error finalizing archive: ${error.message}`, error.stack);
            this.logService.error(`Error finalizing archive : ${error.message}`, `queue/${nDPid}`);
            mainQueueCallBack(error);
        }
    }
    async abortArchiveCreation(nDPid, finalKey, uploadId) {
        try {
            await this.s3Service.abortMultipartUpload(finalKey, uploadId);
            this.logService.info(`Multipart upload aborted for nDPid=${nDPid} with uploadId=${uploadId}`, `queue/${nDPid}`);
            this.logger.warn(`Multipart upload aborted for nDPid=${nDPid} with uploadId=${uploadId}`);
        }
        catch (error) {
            this.logService.error(`Error aborting multipart upload  ${error.message}`, `queue/${nDPid}`);
            this.logger.error(`Error aborting multipart upload for nDPid=${nDPid}: ${error.message}`, error.stack);
        }
    }
    async buildCopyPlan(keys) {
        const plan = [];
        let partNumber = 1;
        for (const key of keys) {
            const fullSize = await this.s3Service.headObjectSize(key);
            const trimmed = fullSize - 1024;
            let offset = 0;
            while (offset < trimmed) {
                const chunkSize = Math.min(trimmed - offset, this.MAX_COPY_PART_SIZE);
                const start = offset;
                const end = offset + chunkSize - 1;
                plan.push({
                    partNumber: partNumber++,
                    key,
                    copySource: `/${this.downloadBucket}/${key}`,
                    copySourceRange: `bytes=${start}-${end}`,
                });
                offset += chunkSize;
            }
        }
        return plan;
    }
    async executeCopyPlan(nDPid, plan, finalKey, uploadId, mainJob) {
        const completed = [];
        for (let i = 0; i < plan.length; i += this.CONCURRENCY) {
            const batch = plan.slice(i, i + this.CONCURRENCY);
            const results = await Promise.all(batch.map(async (part) => {
                this.logger.verbose(`Copying part ${part.partNumber}/${plan.length}`);
                const ETag = await this.s3Service.uploadPartCopy(finalKey, uploadId, part.partNumber, part.copySource, part.copySourceRange);
                const MergeCompletedParts = await this.redisService.finalMergeCompleteRefreshCount(nDPid);
                await mainJob.progress({ event: 'DOWNLOAD-PROGRESS', MergeCompletedParts });
                return { ETag, PartNumber: part.partNumber };
            }));
            completed.push(...results);
        }
        return completed.sort((a, b) => a.PartNumber - b.PartNumber);
    }
    async getMergeBatchJob(nDPid, largeBatches, smallBatches) {
        const list = [];
        for (const batch of largeBatches || []) {
            list.push({ name: this.configKeyService.largeBatchName(nDPid, batch.batchIndex), size: batch.totalSize, type: 'large', batchIndex: batch.batchIndex });
        }
        for (const batch of smallBatches || []) {
            list.push({ name: this.configKeyService.smallBatchName(nDPid, batch.batchIndex), size: batch.totalSize, type: 'small', batchIndex: batch.batchIndex });
        }
        return list;
    }
    async moveToDeleteTars(keys) {
    }
    async clearExistingArchive(finalKey) {
        try {
            await this.s3Service.headObjectSize(finalKey);
            this.logger.log(`Existing archive found, deleting before re-create: ${finalKey}`);
            await this.s3Service.deleteObject(finalKey);
            this.logger.log(`Deleted existing archive: ${finalKey}`);
        }
        catch (err) {
            if (err.$metadata?.httpStatusCode !== 404) {
                this.logger.error(`Error deleting existing archive ${finalKey}: ${err.message}`, err.stack);
                throw new Error(`Failed to delete existing archive: ${err.message}`);
            }
        }
    }
};
exports.FinalizeArchiverService = FinalizeArchiverService;
exports.FinalizeArchiverService = FinalizeArchiverService = FinalizeArchiverService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bull_2.InjectQueue)('delete-tar-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof config_key_service_1.ConfigKeyService !== "undefined" && config_key_service_1.ConfigKeyService) === "function" ? _a : Object, typeof (_b = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object, typeof (_d = typeof bull_1.Queue !== "undefined" && bull_1.Queue) === "function" ? _d : Object, typeof (_e = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _e : Object, typeof (_f = typeof generate_presigned_url_service_1.GeneratePresignedUrlService !== "undefined" && generate_presigned_url_service_1.GeneratePresignedUrlService) === "function" ? _f : Object, typeof (_g = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _g : Object])
], FinalizeArchiverService);


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
var GeneratePresignedUrlService_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GeneratePresignedUrlService = void 0;
const common_1 = __webpack_require__(3);
const s3_service_1 = __webpack_require__(28);
const process_data_service_1 = __webpack_require__(27);
let GeneratePresignedUrlService = GeneratePresignedUrlService_1 = class GeneratePresignedUrlService {
    constructor(s3Service, dataService) {
        this.s3Service = s3Service;
        this.dataService = dataService;
        this.logger = new common_1.Logger(GeneratePresignedUrlService_1.name);
    }
    async updatePresignedUrl(nDPid, finalKey) {
        try {
            const presignedUrl = await this.s3Service.getPresignedUrl(finalKey);
            this.dataService.updatePresignUrl(nDPid, presignedUrl);
        }
        catch (error) {
            this.logger.error(`Error updating presigned URL for nDPid=${nDPid}: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.GeneratePresignedUrlService = GeneratePresignedUrlService;
exports.GeneratePresignedUrlService = GeneratePresignedUrlService = GeneratePresignedUrlService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object, typeof (_b = typeof process_data_service_1.ProcessDataService !== "undefined" && process_data_service_1.ProcessDataService) === "function" ? _b : Object])
], GeneratePresignedUrlService);


/***/ }),
/* 74 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PackageReportsService_1;
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PackageReportsService = void 0;
const common_1 = __webpack_require__(3);
const crypto_1 = __webpack_require__(75);
const db_service_1 = __webpack_require__(6);
const renderers_service_1 = __webpack_require__(76);
const type_source_1 = __webpack_require__(80);
const s3_service_1 = __webpack_require__(28);
const transform_name_service_1 = __webpack_require__(44);
const REPORT_MAP = {
    facts: { cType: 'facts', format: 'pdf', name: 'Facts' },
    tags: { cType: 'tags', format: 'xlsx', name: 'Tags' },
    doclinks: { cType: 'doclinks', format: 'xlsx', name: 'DocLinks' },
};
const META_CASE_FIELDS = [
    'nCaseid', 'cCasename', 'cCaseno', 'cClaimant', 'cRespondent',
    'cTClaimant', 'cTRespondent', 'cIndexheader', 'cDesc', 'cTranscriptMode',
];
function rowsOf(res) {
    if (!res?.success)
        return [];
    const first = res.data?.[0];
    return Array.isArray(first) ? first : [];
}
let PackageReportsService = PackageReportsService_1 = class PackageReportsService {
    constructor(db, renderer, s3, transformName) {
        this.db = db;
        this.renderer = renderer;
        this.s3 = s3;
        this.transformName = transformName;
        this.logger = new common_1.Logger(PackageReportsService_1.name);
    }
    async buildMasterIndexFiles(jobDetail, files) {
        const nCaseid = jobDetail?.nCaseid;
        const nSectionid = jobDetail?.nSectionid;
        if (!nCaseid || !nSectionid || !files?.length)
            return [];
        try {
            const idxRes = await this.db.executeRef('bundle_index', {
                nSectionid, nCaseid, nMasterid: jobDetail.nCreateId ?? '', pageNumber: 1, perPage: 10000, bOutline: false,
            });
            const idxRows = rowsOf(idxRes);
            const isLinkedCopy = (f) => /hyperlink doc\/?\s*$/i.test(String(f?.foldername ?? ''));
            const relByDoc = new Map();
            const rootByDoc = new Map();
            const hasMainRow = new Set();
            const linkedOnly = new Map();
            for (const f of files) {
                if (!f?.nBundledetailid || !f?.cFilename)
                    continue;
                const id = String(f.nBundledetailid);
                const copy = isLinkedCopy(f);
                if (copy) {
                    if (!hasMainRow.has(id))
                        linkedOnly.set(id, f);
                    if (relByDoc.has(id))
                        continue;
                }
                else {
                    hasMainRow.add(id);
                    linkedOnly.delete(id);
                }
                try {
                    relByDoc.set(id, this.transformName.sanitizeDestination(f.cFilename, f.foldername));
                }
                catch { }
                const root = String(f.foldername ?? '').split('/').map(s => s.trim()).filter(Boolean)[0];
                if (root && (!copy || !rootByDoc.has(id)))
                    rootByDoc.set(id, root);
            }
            const rows = idxRows
                .filter((r) => relByDoc.has(String(r.nBundledetailid)))
                .map((r) => ({
                ...r,
                relPath: relByDoc.get(String(r.nBundledetailid)),
                rootLabel: rootByDoc.get(String(r.nBundledetailid)) ?? 'Documents',
            }));
            const listed = new Set(rows.map((r) => String(r.nBundledetailid)));
            for (const [id, f] of linkedOnly) {
                if (listed.has(id) || !relByDoc.has(id))
                    continue;
                const name = String(f.cFilename ?? '');
                const dot = name.lastIndexOf('.');
                rows.push({
                    nBundledetailid: id,
                    cName: dot > 0 ? name.slice(0, dot) : name,
                    cFiletype: dot > 0 ? name.slice(dot + 1).toUpperCase() : '',
                    relPath: relByDoc.get(id),
                    rootLabel: rootByDoc.get(id) ?? 'Linked documents',
                });
            }
            if (!rows.length)
                return [];
            let meta;
            try {
                const det = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid: jobDetail.nCreateId ?? '' }))[0] ?? {};
                meta = {
                    caseName: det.cCasename ?? det.cCaseName,
                    caseNo: det.cCaseno ?? det.cCaseNo,
                };
            }
            catch { }
            const out = [];
            for (const format of ['xlsx', 'pdf', 'html']) {
                const rendered = await this.renderer.renderMasterIndex(rows, format, 'Index of Hearing Bundle Documents', meta);
                const cFilename = `Master_Index.${rendered.ext}`;
                const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
                await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
                out.push({ nBundledetailid: (0, crypto_1.randomUUID)(), cFilename, foldername: '', cBatchType: 'S', cPath });
            }
            this.logger.log(`Prepared Master Index (xlsx+pdf+html, ${rows.length} row(s)) for nDPid=${jobDetail.nDPid}`);
            return out;
        }
        catch (err) {
            this.logger.error(`Failed to build Master Index for nDPid=${jobDetail.nDPid}: ${err?.message}`);
            return [];
        }
    }
    async buildFolderIndexFiles(jobDetail, files) {
        const nCaseid = jobDetail?.nCaseid;
        if (!nCaseid || !files?.length)
            return [];
        try {
            const idxById = new Map();
            if (jobDetail.nSectionid) {
                const idxRes = await this.db.executeRef('bundle_index', {
                    nSectionid: jobDetail.nSectionid, nCaseid, nMasterid: jobDetail.nCreateId ?? '', pageNumber: 1, perPage: 10000, bOutline: false,
                });
                for (const r of rowsOf(idxRes))
                    idxById.set(String(r.nBundledetailid), r);
            }
            const LINKED_RE = /hyperlink doc\/?\s*$/i;
            const groups = new Map();
            const groupOf = (key) => {
                if (!groups.has(key))
                    groups.set(key, { source: [], linked: [] });
                return groups.get(key);
            };
            const linkedSub = new Map();
            for (const f of files) {
                if (!f?.cFilename)
                    continue;
                const folder = String(f.foldername ?? '');
                const m = LINKED_RE.exec(folder);
                if (m) {
                    linkedSub.set(f, m[0]);
                    groupOf(folder.slice(0, m.index)).linked.push(f);
                }
                else {
                    groupOf(folder).source.push(f);
                }
            }
            let meta;
            try {
                const det = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid: jobDetail.nCreateId ?? '' }))[0] ?? {};
                const caseNo = det.cCaseno ?? det.cCaseNo;
                meta = {
                    caseName: det.cCasename ?? det.cCaseName,
                    caseNo,
                    subtitle: caseNo ? `Case ${caseNo}` : '',
                    volumes: '',
                };
            }
            catch {
                meta = { subtitle: '', volumes: '' };
            }
            const out = [];
            let seq = 0;
            for (const [folder, g] of groups) {
                if (!g.linked.length)
                    continue;
                const rows = [];
                const pushRow = (f, relFolder, rootLabel) => {
                    const id = String(f.nBundledetailid ?? '');
                    let relPath = '';
                    try {
                        relPath = this.transformName.sanitizeDestination(f.cFilename, relFolder);
                    }
                    catch { }
                    const idx = id ? idxById.get(id) : undefined;
                    if (idx) {
                        const { cFolder, cFoldername, cFolderTag, cFoldertag, cSection, cSectionName, cVolume, cVolumeTag, ...rest } = idx;
                        rows.push({ ...rest, relPath, rootLabel });
                    }
                    else {
                        const name = String(f.cFilename ?? '');
                        const dot = name.lastIndexOf('.');
                        rows.push({
                            nBundledetailid: id || (0, crypto_1.randomUUID)(),
                            cName: dot > 0 ? name.slice(0, dot) : name,
                            cFiletype: dot > 0 ? name.slice(dot + 1).toUpperCase() : '',
                            relPath, rootLabel,
                        });
                    }
                };
                for (const f of g.source)
                    pushRow(f, '', 'This document');
                const seen = new Set();
                for (const f of g.linked) {
                    const key = `${f.nBundledetailid}|${f.cFilename}`;
                    if (seen.has(key))
                        continue;
                    seen.add(key);
                    pushRow(f, linkedSub.get(f) ?? 'hyperlink doc', 'Linked documents');
                }
                if (!rows.length)
                    continue;
                const rendered = await this.renderer.renderMasterIndex(rows, 'html', 'Index of Linked Documents', meta);
                const cPath = `packages/${jobDetail.nDPid}/reports/folder-index/${++seq}.html`;
                await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
                out.push({ nBundledetailid: (0, crypto_1.randomUUID)(), cFilename: 'index.html', foldername: folder, cBatchType: 'S', cPath });
            }
            this.logger.log(`Prepared ${out.length} per-folder linked-doc index(es) for nDPid=${jobDetail.nDPid}`);
            return out;
        }
        catch (err) {
            this.logger.error(`Failed to build per-folder indexes for nDPid=${jobDetail.nDPid}: ${err?.message}`);
            return [];
        }
    }
    async buildReportFiles(jobDetail) {
        const includes = jobDetail?.jInclude?.includes ?? [];
        const nCaseid = jobDetail?.nCaseid;
        const nMasterid = jobDetail?.nCreateId ?? '';
        if (!Array.isArray(includes) || !nCaseid)
            return [];
        const out = [];
        for (const key of includes) {
            try {
                if (key === 'transcripts') {
                    out.push(...await this.buildTranscriptFiles(nCaseid));
                    continue;
                }
                if (key === 'meta') {
                    const meta = await this.buildMetadataFile(jobDetail, nMasterid);
                    if (meta)
                        out.push(meta);
                    continue;
                }
                const spec = REPORT_MAP[key];
                if (!spec)
                    continue;
                const datasets = key === 'facts'
                    ? [
                        ...await (0, type_source_1.fetchDatasets)(this.db, 'facts', nCaseid, nMasterid),
                        ...await (0, type_source_1.fetchDatasets)(this.db, 'qfacts', nCaseid, nMasterid),
                    ]
                    : await (0, type_source_1.fetchDatasets)(this.db, spec.cType, nCaseid, nMasterid);
                const rendered = await this.renderer.render(datasets, spec.format, spec.name);
                const cFilename = `${spec.name}.${rendered.ext}`;
                const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
                await this.s3.putSourceObject(cPath, rendered.buffer, rendered.contentType);
                out.push({ nBundledetailid: (0, crypto_1.randomUUID)(), cFilename, foldername: 'Reports', cBatchType: 'S', cPath });
                this.logger.log(`Prepared package report ${cFilename} for nDPid=${jobDetail.nDPid}`);
            }
            catch (err) {
                this.logger.error(`Failed to build package extra '${key}' for nDPid=${jobDetail.nDPid}: ${err?.message}`);
            }
        }
        return out;
    }
    async buildTranscriptFiles(nCaseid) {
        const rows = rowsOf(await this.db.executeRef('realtime_transcriptfiles', { nCaseid }));
        const out = [];
        const used = new Set();
        for (const r of rows) {
            const cPath = String(r.cPath ?? '').trim();
            if (!cPath)
                continue;
            let cFilename = String(r.cFilename ?? '').trim() || `${r.nBundledetailid ?? (0, crypto_1.randomUUID)()}.pdf`;
            if (used.has(cFilename.toLowerCase())) {
                const dot = cFilename.lastIndexOf('.');
                const stem = dot > 0 ? cFilename.slice(0, dot) : cFilename;
                const ext = dot > 0 ? cFilename.slice(dot) : '';
                cFilename = `${stem}_${used.size}${ext}`;
            }
            used.add(cFilename.toLowerCase());
            out.push({ nBundledetailid: (0, crypto_1.randomUUID)(), cFilename, foldername: 'Transcripts', cBatchType: 'S', cPath });
        }
        this.logger.log(`Prepared ${out.length} transcript file(s) for nCaseid=${nCaseid}`);
        return out;
    }
    async buildMetadataFile(jobDetail, nMasterid) {
        const nCaseid = jobDetail.nCaseid;
        const row = rowsOf(await this.db.executeRef('admin_case_getdetail', { nCaseid, nMasterid }))[0] ?? {};
        const caseInfo = {};
        for (const f of META_CASE_FIELDS)
            if (row[f] !== undefined)
                caseInfo[f] = row[f];
        const metadata = {
            case: caseInfo,
            package: {
                nDPid: jobDetail.nDPid,
                includes: jobDetail?.jInclude?.includes ?? [],
                folders: jobDetail?.jInclude?.folders ?? [],
            },
            generatedAt: new Date().toISOString(),
        };
        const cFilename = 'Metadata.json';
        const cPath = `packages/${jobDetail.nDPid}/reports/${cFilename}`;
        const buffer = Buffer.from(JSON.stringify(metadata, null, 2), 'utf8');
        await this.s3.putSourceObject(cPath, buffer, 'application/json');
        this.logger.log(`Prepared package metadata for nDPid=${jobDetail.nDPid}`);
        return { nBundledetailid: (0, crypto_1.randomUUID)(), cFilename, foldername: 'Reports', cBatchType: 'S', cPath };
    }
};
exports.PackageReportsService = PackageReportsService;
exports.PackageReportsService = PackageReportsService = PackageReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof renderers_service_1.DataExportRenderer !== "undefined" && renderers_service_1.DataExportRenderer) === "function" ? _b : Object, typeof (_c = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _c : Object, typeof (_d = typeof transform_name_service_1.TransformNameService !== "undefined" && transform_name_service_1.TransformNameService) === "function" ? _d : Object])
], PackageReportsService);


/***/ }),
/* 75 */
/***/ ((module) => {

module.exports = require("crypto");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DataExportRenderer = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const ExcelJS = __webpack_require__(77);
const pdfMake = __webpack_require__(78);
const docx_1 = __webpack_require__(79);
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
/* 77 */
/***/ ((module) => {

module.exports = require("exceljs");

/***/ }),
/* 78 */
/***/ ((module) => {

module.exports = require("pdfmake");

/***/ }),
/* 79 */
/***/ ((module) => {

module.exports = require("docx");

/***/ }),
/* 80 */
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
var AnnotateEvidenceService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnnotateEvidenceService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const child_process_1 = __webpack_require__(39);
const fs_1 = __webpack_require__(20);
const path_1 = __webpack_require__(21);
const db_service_1 = __webpack_require__(6);
const s3_service_1 = __webpack_require__(28);
let AnnotateEvidenceService = AnnotateEvidenceService_1 = class AnnotateEvidenceService {
    constructor(db, s3, config) {
        this.db = db;
        this.s3 = s3;
        this.config = config;
        this.logger = new common_1.Logger(AnnotateEvidenceService_1.name);
        this.pythonV = this.config.get('pythonV');
        this.editScript = this.config.get('PY_EXPEDIT');
        this.rootPath = this.config.get('ROOT_PATH') ?? './';
        this.assets = this.config.get('ASSETS') ?? './assets/';
        this.CONCURRENCY = 4;
    }
    isConfigured() {
        return !!(String(this.pythonV ?? '').trim() && String(this.editScript ?? '').trim());
    }
    async annotateEvidence(jobDetail, files) {
        const includes = jobDetail?.jInclude?.includes ?? [];
        const nCaseid = jobDetail?.nCaseid;
        const nMasterid = jobDetail?.nCreateId ?? '';
        if (!Array.isArray(includes) || !nCaseid)
            return;
        let bFact = includes.includes('facts');
        let bDoc = includes.includes('doclinks');
        if (!bFact && !bDoc) {
            bFact = true;
            bDoc = true;
        }
        if (!this.isConfigured()) {
            this.logger.warn(`Annotate on but python/PY_EXPEDIT not configured — evidence left un-annotated for nDPid=${jobDetail.nDPid}`);
            return;
        }
        if (!nMasterid) {
            this.logger.warn(`Annotate on but package has no creator id — cannot scope marks, skipping for nDPid=${jobDetail.nDPid}`);
            return;
        }
        const pdfs = files.filter(f => f.nBundledetailid && /\.pdf$/i.test(f.cFilename ?? ''));
        if (!pdfs.length)
            return;
        let rows = [];
        let nExportid;
        try {
            nExportid = await this.insertTransientExport(nCaseid, nMasterid, pdfs.map(f => f.nBundledetailid), bFact, bDoc);
            if (nExportid === undefined || nExportid === null) {
                this.logger.warn(`export_insert_data_1 returned no id for nDPid=${jobDetail.nDPid} — evidence left un-annotated`);
                return;
            }
            rows = await this.getExportRows(nExportid, nMasterid);
        }
        catch (err) {
            this.logger.error(`Failed to resolve mark geometry for nDPid=${jobDetail.nDPid}: ${err?.message}`);
            return;
        }
        finally {
            if (nExportid !== undefined && nExportid !== null) {
                try {
                    await this.deleteTransientExport(nCaseid, nExportid, nMasterid);
                }
                catch (err) {
                    this.logger.warn(`Failed to delete transient export ${nExportid}: ${err?.message}`);
                }
            }
        }
        const byId = new Map(pdfs.map(f => [f.nBundledetailid, f]));
        const jobs = rows.filter(r => r?.nBundledetailid && byId.has(String(r.nBundledetailid))
            && Array.isArray(r.highlights) && r.highlights.length);
        if (!jobs.length) {
            this.logger.log(`No marked evidence docs to annotate for nDPid=${jobDetail.nDPid}`);
            return;
        }
        this.logger.log(`Annotating ${jobs.length} evidence doc(s) for nDPid=${jobDetail.nDPid}`);
        for (let i = 0; i < jobs.length; i += this.CONCURRENCY) {
            const slice = jobs.slice(i, i + this.CONCURRENCY);
            await Promise.all(slice.map(r => this.burnAndSwap(jobDetail, r, byId.get(String(r.nBundledetailid)))));
        }
    }
    async insertTransientExport(nCaseid, nMasterid, jFiles, bFact, bDoc) {
        const res = await this.db.executeRef('export_insert_data_1', {
            nCaseid, nMasterid,
            jFiles,
            cPdftype: 'M',
            bPagination: false,
            bDoc, bFact, bQfact: bFact,
            bCoverpg: false, bFitpg: false,
            cDsize: 'N', cFsize: 'N', cQFsize: 'N',
            cOrientation: 'A', cPgsize: 'A4', cTranscript: 'N',
            jFContact: [], jFIssue: [], jQFContact: [], jQFIssue: [], jPages: [],
        });
        if (!res?.success)
            return undefined;
        return res.data?.[0]?.[0]?.nExportid;
    }
    async getExportRows(nExportid, nMasterid) {
        const res = await this.db.executeRef('export_get_data_1', { nExportid, nMasterid });
        if (!res?.success)
            return [];
        const rows = res.data?.[0];
        return Array.isArray(rows) ? rows : [];
    }
    async deleteTransientExport(nCaseid, nExportid, nMasterid) {
        await this.db.executeRef('export_delete_file', { nCaseid, nExportid, nMasterid, nEDid: '', cType: 'S' });
    }
    async burnAndSwap(jobDetail, row, file) {
        const nEDid = String(row.nEDid ?? row.nBundledetailid);
        const outDir = (0, path_1.join)(this.rootPath, 'assets', 'export', `ed${nEDid}`);
        const outFile = (0, path_1.join)(outDir, 'new_pdf.pdf');
        try {
            (0, fs_1.mkdirSync)(outDir, { recursive: true });
            const ok = await this.runBurn({
                cPath: row.cPath ?? file.cPath,
                nEDid,
                bPagination: false,
                cOrientation: row.cOrientation ?? 'A',
                highlights: row.highlights,
            });
            if (!ok || !(0, fs_1.existsSync)(outFile)) {
                this.logger.warn(`Burn produced no output for ${file.cFilename} (${row.nBundledetailid}) — keeping original`);
                return;
            }
            const key = `packages/${jobDetail.nDPid}/annotated/${row.nBundledetailid}.pdf`;
            await this.s3.putSourceObject(key, (0, fs_1.readFileSync)(outFile), 'application/pdf');
            file.cPath = key;
            this.logger.log(`Annotated ${file.cFilename} → ${key}`);
        }
        catch (err) {
            this.logger.error(`Failed to annotate ${file.cFilename} (${row.nBundledetailid}): ${err?.message} — keeping original`);
        }
        finally {
            try {
                (0, fs_1.rmSync)(outDir, { recursive: true, force: true });
            }
            catch { }
        }
    }
    runBurn(jsonData) {
        return new Promise((resolve) => {
            const proc = (0, child_process_1.spawn)(this.pythonV, [this.editScript, JSON.stringify(jsonData)], {
                env: {
                    ...process.env,
                    PYTHONIOENCODING: 'UTF-8',
                    ASSETS: this.assets,
                    ROOT_PATH: this.rootPath,
                    DO_SPACES_BUCKET_NAME: this.config.get('DO_SPACES_BUCKET_NAME'),
                    DO_SPACES_KEY: this.config.get('DO_SPACES_KEY'),
                    DO_SPACES_SECRET: this.config.get('DO_SPACES_SECRET'),
                    DO_SPACES_ENDPOINT: this.config.get('DO_SPACES_ENDPOINT'),
                    DO_TOKEN: this.config.get('DO_TOKEN'),
                    DO_CDN_ID: this.config.get('DO_CDN_ID'),
                },
            });
            proc.stdout.on('data', d => this.logger.log(`[exportfile.py] ${String(d).trim()}`));
            proc.stderr.on('data', d => this.logger.error(`[exportfile.py] ${String(d).trim()}`));
            proc.on('error', e => { this.logger.error(`Failed to spawn exportfile.py: ${e.message}`); resolve(false); });
            proc.on('close', code => resolve(code === 0));
        });
    }
};
exports.AnnotateEvidenceService = AnnotateEvidenceService;
exports.AnnotateEvidenceService = AnnotateEvidenceService = AnnotateEvidenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _b : Object, typeof (_c = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _c : Object])
], AnnotateEvidenceService);


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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.QueueListenerService = void 0;
const bull_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const bull_2 = __webpack_require__(25);
const process_status_service_1 = __webpack_require__(10);
const redis_service_1 = __webpack_require__(14);
const log_service_1 = __webpack_require__(17);
let QueueListenerService = class QueueListenerService {
    constructor(downloadQueue, processStatus, redisService, logService) {
        this.downloadQueue = downloadQueue;
        this.processStatus = processStatus;
        this.redisService = redisService;
        this.logService = logService;
        this.logger = new common_1.Logger('listener-service');
    }
    onModuleInit() {
        this.downloadQueue.on('completed', async (job) => {
            this.logger.fatal(`Job ${job.id} completed`);
            this.logService.warn(`Job ${job.id} completed`, `queue/${job.id}`);
            try {
                await this.processStatus.updateStatus(String(job.id), 'C');
                await this.redisService.updateQueueStatus(String(job.id), 'completed');
            }
            catch (error) {
                this.logger.error(`Error processing completed job ${job.id}`, error);
                this.logService.error(`Error processing completed job ${job.id}`, `queue/${job.id}`);
            }
        });
        this.downloadQueue.on('failed', async (job, err) => {
            try {
                const { attemptsMade, opts: { attempts = 0 } } = job;
                const isFinal = attemptsMade >= attempts;
                await this.redisService.retryAttempts(String(job.id));
                if (isFinal) {
                    this.logService.error(`Job ${job.id} permanently failed after ${attemptsMade} attempts: ${err.message}`, `queue/${job.id}`);
                    this.logger.error(`Job ${job.id} permanently failed after ${attemptsMade} attempts: ${err.message}`);
                    await this.processStatus.updateStatus(String(job.id), 'F');
                    await this.redisService.updateQueueStatus(String(job.id), 'failed');
                }
                else {
                    this.logger.warn(`Job ${job.id} attempt ${attemptsMade}/${attempts} failed: ${err.message}`);
                    this.logService.error(`Job ${job.id} attempt ${attemptsMade}/${attempts} failed: ${err.message}`, `queue/${job.id}`);
                }
            }
            catch (error) {
            }
        });
        this.downloadQueue.on('stalled', async (job) => {
            this.logger.warn(`Job ${job.id} stalled`);
            this.logService.warn(`Job ${job.id} stalled`, `queue/${job.id}`);
            try {
                await this.redisService.updateQueueStatus(String(job.id), 'stalled');
            }
            catch (error) {
                this.logger.error(`Error processing stalled job ${job.id}`, error);
            }
        });
        this.downloadQueue.on('global:waiting', async (jobId) => {
            try {
                this.logService.warn(`Job ${jobId} waiting`, `queue/${jobId}`);
                await this.redisService.updateQueueStatus((jobId), 'waiting');
            }
            catch (error) {
                this.logger.error(`Error processing waiting job ${jobId}`, error);
            }
        });
        this.downloadQueue.on('active', async (job) => {
            this.logger.verbose(`Job ${job.id} active`);
            try {
                this.logService.warn(`Job ${job.id} active`, `queue/${job.id}`);
                await this.processStatus.updateStatus(String(job.id), 'A');
                await this.redisService.updateQueueStatus(String(job.id), 'active');
            }
            catch (error) {
                this.logger.error(`Error processing job ${job.id} data`, error);
            }
        });
        this.downloadQueue.on('paused', () => {
            this.logger.log('Queue paused');
        });
        this.downloadQueue.on('resumed', () => {
            this.logger.log('Queue resumed');
        });
        this.downloadQueue.on('removed', async (job) => {
            this.logger.log(`Job ${job.id} removed`);
            try {
                this.logService.warn(`Job ${job.id} removed`, `queue/${job.id}`);
                await this.redisService.updateQueueStatus(String(job.id), 'removed');
            }
            catch (error) {
                this.logger.error(`Error processing removed job ${job.id}`, error);
            }
        });
        this.downloadQueue.on('delayed', async (job) => {
            this.logger.log(`Job ${job.id} delayed`);
            try {
                this.logService.warn(`Job ${job.id} delayed`, `queue/${job.id}`);
                await this.redisService.updateQueueStatus(String(job.id), 'delayed');
            }
            catch (error) {
                this.logger.error(`Error processing delayed job ${job.id}`, error);
            }
        });
        this.downloadQueue.on('drained', () => {
            this.logger.verbose('Queue drained');
        });
        this.downloadQueue.on('error', (err) => {
            this.logger.error('Queue error', err);
        });
        this.downloadQueue.on('progress', (job, progress) => {
            this.logger.verbose(`Progress Report for ${job.id}`, progress);
            try {
                if (progress.event == 'DOWNLOAD-PROGRESS') {
                    const jobData = job.data;
                    const obj = { nMasterid: jobData.nMasterid };
                    if (progress?.completedParts) {
                        obj['completedParts'] = progress.completedParts;
                    }
                    if (progress?.totalParts) {
                        obj['totalParts'] = progress.totalParts;
                    }
                    if (progress?.actionStatus) {
                        obj['actionStatus'] = progress.actionStatus;
                    }
                    if (progress?.MergeCompletedParts) {
                        obj['MergeCompletedParts'] = progress.MergeCompletedParts;
                    }
                    if (progress?.MergeTotalParts) {
                        obj['MergeTotalParts'] = progress.MergeTotalParts;
                    }
                    if (progress?.totalSize) {
                        obj['totalSize'] = progress.totalSize;
                    }
                    this.processStatus.progressReport(progress.event, String(job.id), obj);
                }
            }
            catch (error) {
                this.logger.error(`Error processing progress report for job ${job.id}`, error);
            }
        });
    }
};
exports.QueueListenerService = QueueListenerService;
exports.QueueListenerService = QueueListenerService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('download-queue')),
    __metadata("design:paramtypes", [typeof (_a = typeof bull_2.Queue !== "undefined" && bull_2.Queue) === "function" ? _a : Object, typeof (_b = typeof process_status_service_1.ProcessStatusService !== "undefined" && process_status_service_1.ProcessStatusService) === "function" ? _b : Object, typeof (_c = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _c : Object, typeof (_d = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _d : Object])
], QueueListenerService);


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
exports.S3Module = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(9);
const client_s3_1 = __webpack_require__(29);
const s3_service_1 = __webpack_require__(28);
let S3Module = class S3Module {
};
exports.S3Module = S3Module;
exports.S3Module = S3Module = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            {
                provide: client_s3_1.S3Client,
                useFactory: (config) => {
                    return new client_s3_1.S3Client({
                        region: 'sgp1',
                        endpoint: config.get('DO_SPACES_ENDPOINT'),
                        credentials: {
                            accessKeyId: config.get('DO_SPACES_KEY'),
                            secretAccessKey: config.get('DO_SPACES_SECRET'),
                        },
                    });
                },
                inject: [config_1.ConfigService],
            },
            s3_service_1.S3Service,
        ],
        exports: [s3_service_1.S3Service],
    })
], S3Module);


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
var DeleteTarProcessor_1;
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DeleteTarProcessor = void 0;
const bull_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const bull_2 = __webpack_require__(25);
const s3_service_1 = __webpack_require__(28);
let DeleteTarProcessor = DeleteTarProcessor_1 = class DeleteTarProcessor {
    constructor(s3Service) {
        this.s3Service = s3Service;
        this.logger = new common_1.Logger(DeleteTarProcessor_1.name);
    }
    async handleDeleteTarQueue(job) {
        const { tarPath, isJobDelete, nDPid } = job.data;
        try {
            if (isJobDelete)
                await this.s3Service.deleteFolder(nDPid);
            else
                await this.s3Service.deleteObject(tarPath);
            this.logger.log(`Successfully deleted tar: ${tarPath}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete tar ${tarPath}: ${error.message}`);
            throw error;
        }
        this.logger.log(`All tar files deleted for job ${job.id}`);
    }
};
exports.DeleteTarProcessor = DeleteTarProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _b : Object]),
    __metadata("design:returntype", Promise)
], DeleteTarProcessor.prototype, "handleDeleteTarQueue", null);
exports.DeleteTarProcessor = DeleteTarProcessor = DeleteTarProcessor_1 = __decorate([
    (0, bull_1.Processor)('delete-tar-queue'),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _a : Object])
], DeleteTarProcessor);


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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(86);
const redis_db_service_1 = __webpack_require__(54);
const config_1 = __webpack_require__(9);
const db_service_1 = __webpack_require__(6);
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
/* 86 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
var S3FileProcessor_1;
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.S3FileProcessor = void 0;
const bull_1 = __webpack_require__(26);
const common_1 = __webpack_require__(3);
const bull_2 = __webpack_require__(25);
const path = __webpack_require__(21);
const s3_file_service_1 = __webpack_require__(37);
const config_1 = __webpack_require__(9);
const async = __webpack_require__(88);
const promises_1 = __webpack_require__(89);
const redis_service_1 = __webpack_require__(14);
const downloadapi_service_1 = __webpack_require__(5);
let S3FileProcessor = S3FileProcessor_1 = class S3FileProcessor {
    constructor(s3FileService, configService, redis, downloadapiService) {
        this.s3FileService = s3FileService;
        this.configService = configService;
        this.redis = redis;
        this.downloadapiService = downloadapiService;
        this.logger = new common_1.Logger(S3FileProcessor_1.name);
    }
    async processFile(job) {
        const { nMasterid, cPath, nBundledetailid, outputKey, processingType, metadata, nDPid, cIsindex } = job.data;
        try {
            await job.progress(3);
            console.log();
            this.logger.log(`Starting processing for file: ${cPath}`);
            await job.progress(3);
            const assetsFolder = this.configService.get('ASSETS');
            const sessionFolder = path.join(assetsFolder, `session_${nDPid}`);
            const fileName = cPath.substring(cPath.lastIndexOf('/') + 1);
            const originalFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            await this.s3FileService.downloadFile(nDPid, nBundledetailid, cPath, sessionFolder, fileName);
            await job.progress(3);
            const outputfile = nBundledetailid + '_' + fileName;
            await this.s3FileService.hyperlinkprocessFile(nDPid, metadata, sessionFolder, fileName, outputfile, cIsindex);
            this.logger.log(`Processed file: ${cPath}`);
            await job.progress(3);
            const finalKey = `hyperlink/session_${nDPid}/${fileName}`;
            await this.s3FileService.uploadFile(nDPid, nBundledetailid, sessionFolder, outputfile, finalKey);
            await job.progress(10);
            this.logger.log(`Successfully processed and uploaded: ${finalKey}`);
            const active = await job.queue.getActiveCount();
            const waiting = await job.queue.getWaitingCount();
            console.log('active', active);
            console.log('waiting', waiting);
            if (active + waiting === 0) {
                await (0, promises_1.rm)(sessionFolder, { recursive: true, force: true });
                this.logger.log(`Cleaned up session folder: ${sessionFolder}`);
            }
            return {
                originalKey: cPath,
                processedKey: finalKey,
                originalSize: 0,
                processingType,
            };
        }
        catch (error) {
            this.logger.error(`Failed to process file ${cPath}: ${error.message}`);
            throw error;
        }
    }
    async handleJobComplete(job) {
        const { nDPid, totalFiles, nMasterid } = job.data;
        const assetsFolder = this.configService.get('ASSETS');
        const sessionFolder = path.join(assetsFolder, `session_${nDPid}`);
        const completed = await job.queue.getCompletedCount();
        const active = await job.queue.getActiveCount();
        const waiting = await job.queue.getWaitingCount();
        console.log('active', active);
        console.log('waiting', waiting);
        console.log('completed', waiting);
        if (active + waiting === 0) {
            await this.redis.processSetup(nDPid, totalFiles);
            await this.downloadapiService.pushToQueue(nDPid, nMasterid);
            await (0, promises_1.rm)(sessionFolder, { recursive: true, force: true });
            this.logger.log(`Cleaned up session folder: ${sessionFolder}`);
        }
    }
};
exports.S3FileProcessor = S3FileProcessor;
__decorate([
    (0, bull_1.Process)({ name: 'process-file', concurrency: 3 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_e = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _e : Object]),
    __metadata("design:returntype", Promise)
], S3FileProcessor.prototype, "processFile", null);
__decorate([
    (0, bull_1.OnQueueCompleted)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof bull_2.Job !== "undefined" && bull_2.Job) === "function" ? _f : Object]),
    __metadata("design:returntype", Promise)
], S3FileProcessor.prototype, "handleJobComplete", null);
exports.S3FileProcessor = S3FileProcessor = S3FileProcessor_1 = __decorate([
    (0, bull_1.Processor)('s3-file-processing'),
    __metadata("design:paramtypes", [typeof (_a = typeof s3_file_service_1.S3FileService !== "undefined" && s3_file_service_1.S3FileService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object, typeof (_c = typeof redis_service_1.RedisService !== "undefined" && redis_service_1.RedisService) === "function" ? _c : Object, typeof (_d = typeof downloadapi_service_1.DownloadapiService !== "undefined" && downloadapi_service_1.DownloadapiService) === "function" ? _d : Object])
], S3FileProcessor);


/***/ }),
/* 88 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 89 */
/***/ ((module) => {

module.exports = require("fs/promises");

/***/ }),
/* 90 */
/***/ ((module) => {

module.exports = require("@nestjs/schedule");

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
var OutputExpiryService_1;
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OutputExpiryService = void 0;
const common_1 = __webpack_require__(3);
const schedule_1 = __webpack_require__(90);
const db_service_1 = __webpack_require__(6);
const s3_service_1 = __webpack_require__(28);
let OutputExpiryService = OutputExpiryService_1 = class OutputExpiryService {
    constructor(db, s3) {
        this.db = db;
        this.s3 = s3;
        this.logger = new common_1.Logger(OutputExpiryService_1.name);
    }
    async expireOldDownloads() {
        const days = OutputExpiryService_1.RETENTION_DAYS;
        const startedAt = Date.now();
        const res = await this.db.executeRef('expire_downloads', { nRetentionDays: days }, 'download');
        if (!res?.success) {
            this.logger.error(`Download expiry failed: ${res?.error ?? 'unknown'}`);
            return;
        }
        const rows = res.data?.[0] ?? [];
        this.logger.log(`Expired ${rows.length} downloads older than ${days} days in ${Date.now() - startedAt} ms`);
        for (const row of rows) {
            const nDPid = row?.nDPid;
            if (!nDPid)
                continue;
            try {
                await this.s3.deleteFolder(nDPid);
            }
            catch (err) {
                this.logger.error(`Failed to delete archive for expired nDPid=${nDPid}: ${err?.message}`);
            }
        }
    }
};
exports.OutputExpiryService = OutputExpiryService;
OutputExpiryService.RETENTION_DAYS = 7;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_3AM),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_c = typeof Promise !== "undefined" && Promise) === "function" ? _c : Object)
], OutputExpiryService.prototype, "expireOldDownloads", null);
exports.OutputExpiryService = OutputExpiryService = OutputExpiryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof s3_service_1.S3Service !== "undefined" && s3_service_1.S3Service) === "function" ? _b : Object])
], OutputExpiryService);


/***/ }),
/* 92 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 93 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 94 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(13);
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
const downloadapi_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const compression = __webpack_require__(92);
const cookieParser = __webpack_require__(93);
const swagger_1 = __webpack_require__(36);
const kafka_config_1 = __webpack_require__(94);
const dotenv = __webpack_require__(95);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(downloadapi_module_1.DownloadapiModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('download-group-v2'));
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
        .setTitle('Etabella Download API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '' : '')
        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('swagger', app, document);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    console.log(`Download API is running on port ${process.env.PORT_DOWNLOADAPI}`);
    await app.listen(process.env.PORT_DOWNLOADAPI);
}
bootstrap();

})();

/******/ })()
;