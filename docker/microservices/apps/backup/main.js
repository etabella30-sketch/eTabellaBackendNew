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
exports.BackupModule = void 0;
const common_1 = __webpack_require__(3);
const backup_controller_1 = __webpack_require__(4);
const backup_service_1 = __webpack_require__(5);
const pgbackup_controller_1 = __webpack_require__(6);
const pgbackup_service_1 = __webpack_require__(10);
const config_1 = __webpack_require__(11);
const log_service_1 = __webpack_require__(15);
const winston_module_1 = __webpack_require__(22);
const s3_service_1 = __webpack_require__(23);
let BackupModule = class BackupModule {
};
exports.BackupModule = BackupModule;
exports.BackupModule = BackupModule = __decorate([
    (0, common_1.Module)({
        imports: [
            winston_module_1.WinstonConfigModule.forRoot('backup')
        ],
        controllers: [backup_controller_1.BackupController, pgbackup_controller_1.PgbackupController],
        providers: [backup_service_1.BackupService, pgbackup_service_1.PgbackupService, config_1.ConfigService, log_service_1.LogService, s3_service_1.S3Service],
    })
], BackupModule);


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
exports.BackupController = void 0;
const common_1 = __webpack_require__(3);
const backup_service_1 = __webpack_require__(5);
let BackupController = class BackupController {
    constructor(backupService) {
        this.backupService = backupService;
    }
    getHello() {
        return this.backupService.getHello();
    }
};
exports.BackupController = BackupController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], BackupController.prototype, "getHello", null);
exports.BackupController = BackupController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof backup_service_1.BackupService !== "undefined" && backup_service_1.BackupService) === "function" ? _a : Object])
], BackupController);


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
exports.BackupService = void 0;
const common_1 = __webpack_require__(3);
let BackupService = class BackupService {
    getHello() {
        return 'Hello World!';
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = __decorate([
    (0, common_1.Injectable)()
], BackupService);


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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PgbackupController = void 0;
const common_1 = __webpack_require__(3);
const backup_interface_1 = __webpack_require__(7);
const backup_service_1 = __webpack_require__(5);
const pgbackup_service_1 = __webpack_require__(10);
let PgbackupController = class PgbackupController {
    constructor(pgBackup, backup) {
        this.pgBackup = pgBackup;
        this.backup = backup;
    }
    async setBackup(body) {
        this.pgBackup.startProcess(body);
        return { msg: 1, "status": "success", value: 'backup process started' };
    }
    async getBackup() {
        return await this.pgBackup.getBackupInfo();
    }
};
exports.PgbackupController = PgbackupController;
__decorate([
    (0, common_1.Post)('backup'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof backup_interface_1.backupReq !== "undefined" && backup_interface_1.backupReq) === "function" ? _c : Object]),
    __metadata("design:returntype", typeof (_d = typeof Promise !== "undefined" && Promise) === "function" ? _d : Object)
], PgbackupController.prototype, "setBackup", null);
__decorate([
    (0, common_1.Get)('backup'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], PgbackupController.prototype, "getBackup", null);
exports.PgbackupController = PgbackupController = __decorate([
    (0, common_1.Controller)('pgbackup'),
    __metadata("design:paramtypes", [typeof (_a = typeof pgbackup_service_1.PgbackupService !== "undefined" && pgbackup_service_1.PgbackupService) === "function" ? _a : Object, typeof (_b = typeof backup_service_1.BackupService !== "undefined" && backup_service_1.BackupService) === "function" ? _b : Object])
], PgbackupController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.backupReq = void 0;
const swagger_1 = __webpack_require__(8);
const class_validator_1 = __webpack_require__(9);
class backupReq {
}
exports.backupReq = backupReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 0, description: 'User id' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", String)
], backupReq.prototype, "nUserid", void 0);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("class-validator");

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
exports.PgTechbackupService = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(11);
const child_process_1 = __webpack_require__(12);
const util_1 = __webpack_require__(13);
const events_1 = __webpack_require__(14);
const log_service_1 = __webpack_require__(15);
const async_1 = __webpack_require__(21);
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let PgTechbackupService = class PgTechbackupService {
    constructor(configService, logService) {
        this.configService = configService;
        this.logService = logService;
        this.backupEmitter = new events_1.EventEmitter();
        this.APP_NAME = 'backup';
        this.queueConcurrency = 1;
        this.backupState = {
            isCompleted: false,
            isInProgress: false
        };
        this.logger = new common_1.Logger('backup-tech');
        this.queue = async_1.default.queue(async (task, callback) => {
            try {
                await task();
            }
            catch (error) {
                this.logger.error('Queue task error:', error);
                this.logService.error(`Queue task error: ${error.message}`, this.APP_NAME);
            }
            if (callback)
                callback();
        }, this.queueConcurrency);
        this.queue.drain(() => {
            this.logger.log('All backup tasks completed');
            this.logService.info('All backup tasks completed', this.APP_NAME);
        });
        this.queue.error((error) => {
            this.logger.error('Queue error:', error);
            this.logService.error(`Queue error: ${error.message}`, this.APP_NAME);
        });
    }
    async startProcess(body) {
        this.logger.log('Backup requested');
        this.logService.info('Backup requested', this.APP_NAME);
        this.queue.push(async () => {
            try {
                await this.executeBackup();
            }
            catch (error) {
                this.logger.error('Queue task error:', error);
            }
        });
    }
    async executeBackup() {
        if (this.backupState.isInProgress) {
            this.logger.log('Backup already in progress');
            return;
        }
        try {
            this.updateBackupState({ isInProgress: true, isCompleted: false, error: null });
            const backupScript = this.configService.get('BACKUP_TECH_SCRIPT_PATH');
            this.logger.log(`Executing backup script: ${backupScript}`);
            this.logService.info(`Executing backup script: ${backupScript}`, this.APP_NAME);
            const { stdout, stderr } = await execAsync(`sh ${backupScript}`);
            if (stderr) {
                this.logger.error('Backup script stderr:', stderr);
                this.logService.warn(`Backup script warning: ${stderr}`, this.APP_NAME);
            }
            this.logger.log('Backup script stdout:', stdout);
            this.logService.info(`Backup script output: ${stdout}`, this.APP_NAME);
            this.updateBackupState({ isCompleted: true, isInProgress: false });
        }
        catch (error) {
            this.logger.error('Backup failed:', error);
            this.logService.error(`Backup failed: ${error.message}`, this.APP_NAME);
            this.updateBackupState({
                isCompleted: true,
                isInProgress: false,
                error: error.message
            });
        }
    }
    updateBackupState(update) {
        this.backupState = {
            ...this.backupState,
            ...update
        };
    }
    async getBackupInfo() {
        return { msg: this.backupState.isInProgress ? "STEP-P" : this.backupState.isCompleted ? "STEP-C" : "STEP-P" };
    }
};
exports.PgTechbackupService = PgTechbackupService;
exports.PgTechbackupService = PgTechbackupService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], PgTechbackupService);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("child_process");

/***/ }),
/* 13 */
/***/ ((module) => {

module.exports = require("util");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("events");

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
const fs = __webpack_require__(18);
const path = __webpack_require__(19);
const moment = __webpack_require__(20);
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

module.exports = require("fs");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("moment-timezone");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 22 */
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
const fs = __webpack_require__(18);
const path = __webpack_require__(19);
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
exports.S3Service = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(11);
const client_s3_1 = __webpack_require__(24);
const fs = __webpack_require__(18);
const path = __webpack_require__(19);
const log_service_1 = __webpack_require__(15);
let S3Service = class S3Service {
    constructor(configService, logService) {
        this.configService = configService;
        this.logService = logService;
        this.APP_NAME = 'S3Service';
        this.s3Client = new client_s3_1.S3Client({
            region: 'sgp1',
            endpoint: this.configService.get('DO_SPACES_ENDPOINT'),
            credentials: {
                accessKeyId: this.configService.get('DO_SPACES_KEY'),
                secretAccessKey: this.configService.get('DO_SPACES_SECRET'),
            },
            forcePathStyle: this.configService.get('DO_S3') == 'MINIO'
        });
    }
    async uploadFile(filePath, destinationKey) {
        const bucketName = this.configService.get('S3_BUCKET_NAME');
        if (!fs.existsSync(filePath)) {
            const errorMessage = `File not found: ${filePath}`;
            this.logService.error(errorMessage, this.APP_NAME);
            throw new Error(errorMessage);
        }
        const fileStream = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: bucketName,
                Key: destinationKey,
                Body: fileStream,
                ContentType: this.getContentType(fileName),
            });
            await this.s3Client.send(command);
            const fileUrl = `https://${bucketName}.s3.${this.configService.get('AWS_REGION')}.amazonaws.com/${destinationKey}`;
            this.logService.info(`File uploaded successfully: ${fileUrl}`, this.APP_NAME);
            return fileUrl;
        }
        catch (error) {
            const errorMessage = `Failed to upload file to S3: ${error.message}`;
            this.logService.error(errorMessage, this.APP_NAME);
            throw new Error(errorMessage);
        }
    }
    getContentType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        switch (ext) {
            case '.txt':
                return 'text/plain';
            case '.json':
                return 'application/json';
            case '.jpg':
            case '.jpeg':
                return 'image/jpeg';
            case '.png':
                return 'image/png';
            case '.pdf':
                return 'application/pdf';
            case '.backup':
                return 'application/octet-stream';
            default:
                return 'application/octet-stream';
        }
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _a : Object, typeof (_b = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _b : Object])
], S3Service);


/***/ }),
/* 24 */
/***/ ((module) => {

module.exports = require("@aws-sdk/client-s3");

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
/* 26 */
/***/ ((module) => {

module.exports = require("body-parser");

/***/ }),
/* 27 */
/***/ ((module) => {

module.exports = require("compression");

/***/ }),
/* 28 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 29 */
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
const backup_module_1 = __webpack_require__(2);
const config_1 = __webpack_require__(11);
const exception_1 = __webpack_require__(25);
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(8);
const bodyParser = __webpack_require__(26);
const compression = __webpack_require__(27);
const cookieParser = __webpack_require__(28);
const dotenv = __webpack_require__(29);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
async function bootstrap() {
    const app = await core_1.NestFactory.create(backup_module_1.BackupModule);
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
        .addServer(process.env.NODE_ENV === 'production' ? '/backup' : '')
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
    await app.listen(configService.get('PORT_BACKUP'));
}
bootstrap();

})();

/******/ })()
;