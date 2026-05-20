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
exports.SocketAppModule = void 0;
const common_1 = __webpack_require__(3);
const socket_app_controller_1 = __webpack_require__(4);
const socket_app_service_1 = __webpack_require__(5);
const events_gateway_1 = __webpack_require__(7);
const ioredis_1 = __webpack_require__(14);
const db_service_1 = __webpack_require__(28);
const query_builder_service_1 = __webpack_require__(30);
const redis_db_service_1 = __webpack_require__(12);
const config_1 = __webpack_require__(15);
const ws_guard_1 = __webpack_require__(10);
const log_service_1 = __webpack_require__(16);
const winston_module_1 = __webpack_require__(37);
const global_1 = __webpack_require__(38);
const upload_service_1 = __webpack_require__(23);
const websocket_module_1 = __webpack_require__(44);
const users_service_1 = __webpack_require__(22);
const socket_controller_1 = __webpack_require__(45);
const index_service_1 = __webpack_require__(24);
const pagination_service_1 = __webpack_require__(25);
const batchfile_service_1 = __webpack_require__(26);
const export_service_1 = __webpack_require__(27);
const notification_controller_1 = __webpack_require__(47);
const notification_service_1 = __webpack_require__(32);
const kafka_module_1 = __webpack_require__(48);
const present_controller_1 = __webpack_require__(50);
const present_service_1 = __webpack_require__(31);
const realtime_service_1 = __webpack_require__(36);
let SocketAppModule = class SocketAppModule {
};
exports.SocketAppModule = SocketAppModule;
exports.SocketAppModule = SocketAppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kafka_module_1.KafkaModule.register('etabella-socket', 'socket-group'),
            websocket_module_1.WebSocketModule, global_1.GlobalModule,
            ioredis_1.RedisModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    type: 'single',
                    url: config.get('REDIS_URL'),
                }),
            }),
            winston_module_1.WinstonConfigModule.forRoot('upload')
        ],
        controllers: [socket_app_controller_1.SocketAppController, socket_controller_1.SocketController, notification_controller_1.NotificationController, present_controller_1.PresentController
        ],
        providers: [socket_app_service_1.SocketAppService, ws_guard_1.WsJwtGuard, events_gateway_1.EventsGateway, db_service_1.DbService, query_builder_service_1.QueryBuilderService, config_1.ConfigService, redis_db_service_1.RedisDbService, log_service_1.LogService, upload_service_1.UploadService,
            users_service_1.UsersService, index_service_1.IndexService, pagination_service_1.PaginationService, batchfile_service_1.BatchfileService, export_service_1.ExportService, notification_service_1.NotificationService, present_service_1.PresentService, realtime_service_1.RealtimeService],
    })
], SocketAppModule);


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
exports.SocketAppController = void 0;
const common_1 = __webpack_require__(3);
const socket_app_service_1 = __webpack_require__(5);
const event_emitter_1 = __webpack_require__(6);
let SocketAppController = class SocketAppController {
    constructor(socketAppService) {
        this.socketAppService = socketAppService;
    }
    getHello() {
        return this.socketAppService.getHello();
    }
    handleMessage(data) {
        console.log('Handling received message in controller:', data);
    }
    handleSomeEvent(payload) {
        console.log('Event received:', payload);
    }
};
exports.SocketAppController = SocketAppController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], SocketAppController.prototype, "getHello", null);
__decorate([
    (0, event_emitter_1.OnEvent)('message.received'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocketAppController.prototype, "handleMessage", null);
__decorate([
    (0, event_emitter_1.OnEvent)('my-topic'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SocketAppController.prototype, "handleSomeEvent", null);
exports.SocketAppController = SocketAppController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof socket_app_service_1.SocketAppService !== "undefined" && socket_app_service_1.SocketAppService) === "function" ? _a : Object])
], SocketAppController);


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
exports.SocketAppService = void 0;
const common_1 = __webpack_require__(3);
let SocketAppService = class SocketAppService {
    async onModuleInit() {
    }
    async handleMessage(topic, message) {
        console.log(`Received message on ${topic}:`, message);
    }
    getHello() {
        return 'Hello World!';
    }
};
exports.SocketAppService = SocketAppService;
exports.SocketAppService = SocketAppService = __decorate([
    (0, common_1.Injectable)()
], SocketAppService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/event-emitter");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.EventsGateway = void 0;
const websockets_1 = __webpack_require__(8);
const socket_io_1 = __webpack_require__(9);
const common_1 = __webpack_require__(3);
const ws_guard_1 = __webpack_require__(10);
const log_service_1 = __webpack_require__(16);
const users_service_1 = __webpack_require__(22);
const upload_service_1 = __webpack_require__(23);
const index_service_1 = __webpack_require__(24);
const pagination_service_1 = __webpack_require__(25);
const batchfile_service_1 = __webpack_require__(26);
const export_service_1 = __webpack_require__(27);
const db_service_1 = __webpack_require__(28);
const redis_db_service_1 = __webpack_require__(12);
const present_service_1 = __webpack_require__(31);
const notification_service_1 = __webpack_require__(32);
const realtime_service_1 = __webpack_require__(36);
let EventsGateway = class EventsGateway {
    constructor(log, user, upload, index, pagination, batchfile, fileexport, db, redis, present, notification, realtime) {
        this.log = log;
        this.user = user;
        this.upload = upload;
        this.index = index;
        this.pagination = pagination;
        this.batchfile = batchfile;
        this.fileexport = fileexport;
        this.db = db;
        this.redis = redis;
        this.present = present;
        this.notification = notification;
        this.realtime = realtime;
        this.logApplication = 'socket';
    }
    afterInit(server) {
        this.upload.setServer(server);
        this.index.setServer(server);
        this.user.setServer(server);
        this.pagination.setServer(server);
        this.batchfile.setServer(server);
        this.fileexport.setServer(server);
        this.present.setServer(server);
        this.notification.setServer(server);
        this.realtime.setServer(server);
    }
    async handleConnection(client, ...args) {
        const nUserid = client.handshake.query.nUserid;
        this.log.info(`User connected : ${nUserid}`, this.logApplication);
        this.user.setUser(nUserid, { socketId: client.id, rooms: new Set() });
        let urs = await this.user.getUserSocket(nUserid);
        this.db.executeRef('user_sync_update', { nMasterid: nUserid });
    }
    async handleDisconnect(client) {
        try {
            console.log('DISCONNECTED', client.id);
            let entries = await this.user.getEntries();
            const entry = Array.from(entries).find(([key, value]) => value.socketId === client.id);
            if (entry) {
                const [nUserid, userConnection] = entry;
                this.log.info(`User disconnected : ${nUserid}`, this.logApplication);
                console.log('Disconnected', nUserid);
                userConnection.rooms.forEach(room => client.leave(room));
                this.user.removeUser(nUserid);
                this.redis.removeUser(nUserid);
            }
        }
        catch (error) {
            this.log.error(`disconnect  : ${JSON.stringify(error)}`, this.logApplication);
        }
        try {
            const socketid = client.id;
            const presentations = this.user.findPresentationsAndUsersBySocketId(socketid);
            presentations.forEach(e => {
                this.server.to(`P${e.nPresentid}`).emit('presentation', { event: 'USER-LEFT', data: { nUserid: e.userid } });
            });
        }
        catch (error) {
        }
    }
    handleMessage(data, client, callback) {
        this.log.info(`Message received : ${JSON.stringify(data)}`, this.logApplication);
        client.emit('message', data, () => {
            callback('Message processed');
        });
    }
    async handlePresentPositionMessage(data, client) {
        this.present.savePosition(data);
    }
    async handlePresentCompareMessage(data, client) {
        this.present.saveCompare(data);
    }
    async handlePresentCompareDataMessage(data, client) {
        this.present.saveCompareData(data);
    }
    async handlePresentDocChangeMessage(data, client) {
        this.present.saveCurrentTab(data);
    }
    async handleJoinRoom(data, client) {
        const nUserid = client.handshake.query.nUserid;
        const userConnection = await this.user.getUser(nUserid);
        if (userConnection) {
            client.join(data.room);
            userConnection.rooms.add(data.room);
            console.log('ROOM Join', data.room);
            this.server.emit('webrtc', { event: 'join-viewer', data: { nUserid: nUserid } });
            this.log.info(`Client ${nUserid} joined room ${data.room}`, this.logApplication);
        }
    }
    async handlePauseUser(data, client) {
        try {
            const socketid = this.user.findSocketIdByUserIdAndPresentation(data.nPresentid, data.nUserid);
            if (socketid) {
                this.server.sockets.sockets.get(socketid)?.leave(`P${data.nPresentid}`);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async handlePresentJoinRoom(data, client) {
        try {
            const nUserid = client.handshake.query.nUserid;
            const nPresentid = data.nPresentid;
            const isHost = client.handshake.query.isHost == 'true';
            await this.redis.addUser(data.room, nUserid, client.id);
            this.server.to(data.room).emit('presentation', { event: 'USER-JOINED', data: { nUserid: nUserid } });
            client.join(data.room);
            console.log('PRESENT ROOM Join', data.room, data);
            this.user.addUserToPresentation(nPresentid, nUserid, client.id);
            this.log.info(`Client ${nUserid} joined room ${data.room}`, this.logApplication);
        }
        catch (error) {
            console.log(error);
        }
    }
    async handleLeaveRoom(room, client) {
        const nUserid = client.handshake.query.nUserid;
        const userConnection = await this.user.getUser(nUserid);
        if (userConnection) {
            client.leave(room);
            userConnection.rooms.delete(room);
            try {
                const nPresentid = client.handshake.query.nPresentid;
                if (nPresentid) {
                    this.redis.removeUser(nUserid);
                    this.user.deleteUserFromPresentation(nPresentid, nUserid);
                }
            }
            catch (error) {
            }
            this.log.info(`Client ${nUserid} left room ${room}`, this.logApplication);
        }
    }
    async handleWebRTCevents(body, client) {
        console.log('web-rtc', body);
        try {
            if (['SCREEN-SHARE-STOP', 'SCREEN-SHARE-START'].includes(body.event)) {
                this.present.setupScreenSharing(body);
            }
        }
        catch (error) {
        }
        this.server.to(`U${body?.nToUserId}`).emit('webrtc', body);
    }
    async handleFactSheetComment(data, client) {
        try {
            const nUserid = client.handshake.query.room;
            client.join(data.room);
            console.log(`Client ${nUserid} joined factcomment room ${data.room}`);
            this.log.info(`Client ${nUserid} joined factcomment room ${data.room}`, this.logApplication);
        }
        catch (error) {
            console.log(error);
        }
    }
    async handleFactSheetCommentleave(room, client) {
        const nUserid = client.handshake.query.nUserid;
        client.leave(room);
        console.log(`Client ${nUserid} left factcomment room ${room}`);
        this.log.info(`Client ${nUserid} left factcomment room ${room}`, this.logApplication);
    }
};
exports.EventsGateway = EventsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_o = typeof socket_io_1.Server !== "undefined" && socket_io_1.Server) === "function" ? _o : Object)
], EventsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_p = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _p : Object, typeof (_q = typeof Function !== "undefined" && Function) === "function" ? _q : Object]),
    __metadata("design:returntype", void 0)
], EventsGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('present-position'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_r = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _r : Object]),
    __metadata("design:returntype", typeof (_s = typeof Promise !== "undefined" && Promise) === "function" ? _s : Object)
], EventsGateway.prototype, "handlePresentPositionMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('present-compare'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_t = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _t : Object]),
    __metadata("design:returntype", typeof (_u = typeof Promise !== "undefined" && Promise) === "function" ? _u : Object)
], EventsGateway.prototype, "handlePresentCompareMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('present-compare-data'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_v = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _v : Object]),
    __metadata("design:returntype", typeof (_w = typeof Promise !== "undefined" && Promise) === "function" ? _w : Object)
], EventsGateway.prototype, "handlePresentCompareDataMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('present-change-tab'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_x = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _x : Object]),
    __metadata("design:returntype", typeof (_y = typeof Promise !== "undefined" && Promise) === "function" ? _y : Object)
], EventsGateway.prototype, "handlePresentDocChangeMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_z = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _z : Object]),
    __metadata("design:returntype", typeof (_0 = typeof Promise !== "undefined" && Promise) === "function" ? _0 : Object)
], EventsGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('present-pause-user'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_1 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _1 : Object]),
    __metadata("design:returntype", typeof (_2 = typeof Promise !== "undefined" && Promise) === "function" ? _2 : Object)
], EventsGateway.prototype, "handlePauseUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-present-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_3 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _3 : Object]),
    __metadata("design:returntype", typeof (_4 = typeof Promise !== "undefined" && Promise) === "function" ? _4 : Object)
], EventsGateway.prototype, "handlePresentJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_5 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _5 : Object]),
    __metadata("design:returntype", typeof (_6 = typeof Promise !== "undefined" && Promise) === "function" ? _6 : Object)
], EventsGateway.prototype, "handleLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('web-rtc'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_7 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _7 : Object]),
    __metadata("design:returntype", typeof (_8 = typeof Promise !== "undefined" && Promise) === "function" ? _8 : Object)
], EventsGateway.prototype, "handleWebRTCevents", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-factcomment-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_9 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _9 : Object]),
    __metadata("design:returntype", typeof (_10 = typeof Promise !== "undefined" && Promise) === "function" ? _10 : Object)
], EventsGateway.prototype, "handleFactSheetComment", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-factcomment-room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, typeof (_11 = typeof socket_io_1.Socket !== "undefined" && socket_io_1.Socket) === "function" ? _11 : Object]),
    __metadata("design:returntype", typeof (_12 = typeof Promise !== "undefined" && Promise) === "function" ? _12 : Object)
], EventsGateway.prototype, "handleFactSheetCommentleave", null);
exports.EventsGateway = EventsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        path: '/socketservice/socket.io'
    }),
    (0, common_1.UseGuards)(ws_guard_1.WsJwtGuard),
    __metadata("design:paramtypes", [typeof (_a = typeof log_service_1.LogService !== "undefined" && log_service_1.LogService) === "function" ? _a : Object, typeof (_b = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _b : Object, typeof (_c = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _c : Object, typeof (_d = typeof index_service_1.IndexService !== "undefined" && index_service_1.IndexService) === "function" ? _d : Object, typeof (_e = typeof pagination_service_1.PaginationService !== "undefined" && pagination_service_1.PaginationService) === "function" ? _e : Object, typeof (_f = typeof batchfile_service_1.BatchfileService !== "undefined" && batchfile_service_1.BatchfileService) === "function" ? _f : Object, typeof (_g = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _g : Object, typeof (_h = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _h : Object, typeof (_j = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _j : Object, typeof (_k = typeof present_service_1.PresentService !== "undefined" && present_service_1.PresentService) === "function" ? _k : Object, typeof (_l = typeof notification_service_1.NotificationService !== "undefined" && notification_service_1.NotificationService) === "function" ? _l : Object, typeof (_m = typeof realtime_service_1.RealtimeService !== "undefined" && realtime_service_1.RealtimeService) === "function" ? _m : Object])
], EventsGateway);


/***/ }),
/* 8 */
/***/ ((module) => {

module.exports = require("@nestjs/websockets");

/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("socket.io");

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
exports.WsJwtGuard = void 0;
const common_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(8);
const jwt = __webpack_require__(11);
const redis_db_service_1 = __webpack_require__(12);
const config_1 = __webpack_require__(15);
let WsJwtGuard = class WsJwtGuard {
    constructor(redisDbService, config) {
        this.redisDbService = redisDbService;
        this.config = config;
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        let token = client.handshake.query.token;
        if (!token) {
            const authHeader = client.handshake.headers.authorization;
            if (Array.isArray(authHeader)) {
                token = authHeader[0];
            }
            else {
                token = authHeader;
            }
            if (token && token.startsWith('Bearer ')) {
                token = token.split(' ')[1];
            }
        }
        if (!token) {
            throw new websockets_1.WsException('A token is required for authentication');
        }
        let decoded;
        try {
            decoded = jwt.verify(token, this.config.get('JWT_SECRET'));
        }
        catch (err) {
            throw new websockets_1.WsException('Invalid Token');
        }
        try {
            const dataUSR = await this.redisDbService.getValue(`user/${decoded.userId}`);
            const user = JSON.parse(dataUSR);
            if (user.id !== decoded.broweserId) {
                throw new websockets_1.WsException('Old Token');
            }
            client.data = { userId: decoded.userId, isAdmin: user.a || false };
        }
        catch (error) {
            throw new websockets_1.WsException('Old Token');
        }
        return true;
    }
};
exports.WsJwtGuard = WsJwtGuard;
exports.WsJwtGuard = WsJwtGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], WsJwtGuard);


/***/ }),
/* 11 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(13);
const ioredis_2 = __webpack_require__(14);
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
/* 13 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

/***/ }),
/* 15 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.LogService = void 0;
const common_1 = __webpack_require__(3);
const winston_1 = __webpack_require__(17);
const nest_winston_1 = __webpack_require__(18);
const winston = __webpack_require__(17);
const fs = __webpack_require__(19);
const path = __webpack_require__(20);
const moment = __webpack_require__(21);
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
/* 17 */
/***/ ((module) => {

module.exports = require("winston");

/***/ }),
/* 18 */
/***/ ((module) => {

module.exports = require("nest-winston");

/***/ }),
/* 19 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 20 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 21 */
/***/ ((module) => {

module.exports = require("moment-timezone");

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
        this.presentationMap = new Map();
    }
    setServer(server) {
        this.server = server;
    }
    async setUser(nUserid, obj) {
        this.userConnections.set(nUserid.toString(), obj);
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
    async emitMsg(value) {
        this.server.to(`U${value.data.nMasterid}`).emit("LOGIN-VERIFY", {
            data: {
                cBroweserid: value.data.cBroweserid,
            },
        });
    }
    addUserToPresentation(nPresentid, userid, socketid) {
        if (!this.presentationMap.has(nPresentid)) {
            this.presentationMap.set(nPresentid, new Map());
        }
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            userMap.set(userid, { socketid });
        }
    }
    findPresentationsAndUsersBySocketId(socketid) {
        const result = [];
        for (const [nPresentid, userMap] of this.presentationMap.entries()) {
            for (const [userid, data] of userMap.entries()) {
                if (data.socketid === socketid) {
                    result.push({ nPresentid, userid });
                }
            }
        }
        return result;
    }
    deleteUserFromPresentation(nPresentid, userid) {
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            userMap.delete(userid);
            if (userMap.size === 0) {
                this.presentationMap.delete(nPresentid);
            }
        }
    }
    findSocketIdByUserIdAndPresentation(nPresentid, userid) {
        const userMap = this.presentationMap.get(nPresentid);
        if (userMap) {
            const data = userMap.get(userid);
            if (data) {
                return data.socketid;
            }
        }
        return null;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)()
], UsersService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UploadService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let UploadService = class UploadService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value, topic) {
        const users = value?.data?.users || [];
        if (users?.length) {
            users.forEach(userId => {
                this.server.to(`U${userId}`).emit(topic ? topic : "upload-messages", value);
            });
        }
        else {
            this.server.to(`U${value.data.nMasterid}`).emit(topic ? topic : "upload-messages", value);
        }
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], UploadService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IndexService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let IndexService = class IndexService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value) {
        debugger;
        this.server.to(`U${value.data.nMasterid}`).emit("index-messages", value);
    }
};
exports.IndexService = IndexService;
exports.IndexService = IndexService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], IndexService);


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
exports.PaginationService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let PaginationService = class PaginationService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value) {
        this.server.to(`U${value.data.nMasterid}`).emit("pagination-messages", value);
    }
};
exports.PaginationService = PaginationService;
exports.PaginationService = PaginationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], PaginationService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BatchfileService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let BatchfileService = class BatchfileService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value) {
        this.server.to(`U${value.data.nMasterid}`).emit("batchfile-messages", value);
    }
};
exports.BatchfileService = BatchfileService;
exports.BatchfileService = BatchfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], BatchfileService);


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
exports.ExportService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let ExportService = class ExportService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value) {
        this.server.to(`U${value.data.nMasterid}`).emit("export-messages", value);
    }
};
exports.ExportService = ExportService;
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(29);
const query_builder_service_1 = __webpack_require__(30);
const config_1 = __webpack_require__(15);
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
/* 29 */
/***/ ((module) => {

module.exports = require("pg");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentService = void 0;
const common_1 = __webpack_require__(3);
const redis_db_service_1 = __webpack_require__(12);
const db_service_1 = __webpack_require__(28);
let PresentService = class PresentService {
    setServer(server) {
        this.server = server;
    }
    constructor(redis, db) {
        this.redis = redis;
        this.db = db;
    }
    async emitPresent(value) {
        this.server.to(`P${value.data.nPresentid}`).emit("presentation-tools", value);
    }
    async emitPresentTools(value) {
        this.server.to(`U${value.data.nUserid}`).emit("presentation-tools", value);
    }
    async emitHighlight(value) {
        this.server.to(`P${value.data.nPresentid}`).emit("presentation-highlights", value);
    }
    async savePosition(value) {
        this.redis.setValue(`PRESENT:${value.nPresentid}:POSITION:${value.nBundledetailid}`, JSON.stringify(value), 24 * 3600);
        const cPresentStatus = await this.presentStatus(value.nPresentid);
        if (cPresentStatus == 'L') {
            this.server.to(`P${value.nPresentid}`).emit("presentation-position", value);
        }
    }
    async saveCompare(value) {
        if (!value.compareMode) {
            this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE`);
            this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`);
        }
        else {
            this.redis.setValue(`PRESENT:${value.nPresentid}:COMPARE`, JSON.stringify(value), 24 * 3600);
        }
        const cPresentStatus = await this.presentStatus(value.nPresentid);
        if (cPresentStatus == 'L') {
            this.server.to(`P${value.nPresentid}`).emit("presentation-compare", value);
        }
    }
    async saveCompareData(value) {
        if (!value.compareMode) {
            this.redis.deleteValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`);
        }
        else {
            this.redis.setValue(`PRESENT:${value.nPresentid}:COMPARE:DATA`, JSON.stringify(value), 24 * 3600);
        }
        const cPresentStatus = await this.presentStatus(value.nPresentid);
        if (cPresentStatus == 'L') {
            this.server.to(`P${value.nPresentid}`).emit("presentation-compare-data", value);
        }
    }
    async saveCurrentTab(value) {
        this.redis.setValue(`PRESENT:${value.nPresentid}:TAB`, JSON.stringify({ nBundledetailid: value.nBundledetailid }), 24 * 3600);
        const cPresentStatus = await this.presentStatus(value.nPresentid);
        if (cPresentStatus == 'L') {
            this.server.to(`P${value.nPresentid}`).emit("presentation-tab", value);
        }
    }
    async presentStatus(nPresentid) {
        try {
            const status = await this.redis.getValue(`PRESENT:${nPresentid}:STATUS`);
            if (!status) {
                const res = await this.db.executeRef('present_status', { nPresentid }, 'present');
                if (res.success) {
                    const status = res.data[0][0]["cStatus"];
                    this.redis.setValue(`PRESENT:${nPresentid}:STATUS`, status, 24 * 3600);
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
    async setupScreenSharing(data) {
        try {
        }
        catch (error) {
        }
    }
};
exports.PresentService = PresentService;
exports.PresentService = PresentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _a : Object, typeof (_b = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _b : Object])
], PresentService);


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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationService = void 0;
const db_service_1 = __webpack_require__(28);
const common_1 = __webpack_require__(3);
const admin = __webpack_require__(33);
const async_1 = __webpack_require__(34);
const serviceAccount = __webpack_require__(35);
let NotificationService = class NotificationService {
    setServer(server) {
        this.server = server;
    }
    constructor(db) {
        this.db = db;
        try {
            console.log('\n\r\n\rFIrebase Service Initiated', serviceAccount);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://etabella-fcm.firebaseio.com"
            });
        }
        catch (error) {
        }
        this.queue = async_1.default.queue(async (task, callback) => {
            await task();
            callback();
        }, 1);
        this.queue.drain(() => {
        });
    }
    emit(x) {
        debugger;
        this.queue.push(async () => {
            await this.sendNotification(x);
        });
    }
    async sendNotification(x) {
        try {
            try {
                this.server.to(`U${x.nUserid}`).emit("user-notification", { ...x });
            }
            catch (error) {
            }
            const res = await this.notification(x.cTitle, x.cMsg, x.cToken, x.nCaseid, x.action, x.nPresentid, x.cType);
            x.cStatus = res.msg == 1 ? 'C' : 'F';
            await this.insertNotifacation(x);
        }
        catch (error) {
        }
        return true;
    }
    async insertNotifacation(x) {
        try {
            let res = await this.db.executeRef('notification_insert', { nUserid: x.nUserid, cTitle: x.cTitle, cMsg: x.cMsg, cStatus: x.cStatus, nFSid: x.nFSid, nDocid: x.nDocid, nWebid: x.nWebid, nBundledetailid: x.nBundledetailid, cType: x.cType, nCaseid: x.nCaseid, nUPid: x.nUPid, nRefuserid: x.nRefuserid, nPresentid: x.nPresentid });
            if (res.success) {
                return res.data[0][0];
            }
            else {
                return { msg: -1, value: 'Failed to fetch', error: res.error };
            }
        }
        catch (error) {
            return { msg: -1, value: 'Failed to fetch' };
        }
    }
    async notification(title, message, tokenkey, nCaseid, action, nPresentid, cType) {
        console.log('Notification to ', title, message, tokenkey, action, nCaseid);
        if (!tokenkey) {
            return { msg: -1, res: 'Token not found' };
        }
        const strMap = (o) => Object.fromEntries(Object.entries(o)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => [k, typeof v === 'string' ? v : String(v)]));
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
            data: strMap({
                link: action ?? 'https://etabella.tech',
                nCaseid,
                nPresentid,
                cType,
            })
        };
        try {
            console.log('\n\r\n\rNOTIFICATION SEND', message, tokenkey);
            const response = await admin.messaging().send(messagePayload);
            console.log("Successfully sent message:", response);
            return { msg: 1, res: response };
        }
        catch (error) {
            console.error("Error sending message:", error);
            return { msg: -1, res: error };
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object])
], NotificationService);


/***/ }),
/* 33 */
/***/ ((module) => {

module.exports = require("firebase-admin");

/***/ }),
/* 34 */
/***/ ((module) => {

module.exports = require("async");

/***/ }),
/* 35 */
/***/ ((module) => {

module.exports = /*#__PURE__*/JSON.parse('{"type":"service_account","project_id":"etabellav2","private_key_id":"b9ff3d2f1c66e17174e92a51222794cbecfa705e","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCSBEn9bSjn2o00\\nR7MrNytrduxEQM+WknEBrOZRvZehj2SfQdRDdt3E9QAzbwz4jbXctPxeAVpMIX7o\\nZ3DQ27FT/szANS5bcbchxqLZ11Ks1D9RLB9TyTn+mGdVl9IkLuLzirLN4YgOqKCF\\ny6vBB3uj1LB0R+SSvmP9d2mYXMHkMHVeRhZjRQZhUKMx1Yb7EXWti5FSJSUit2e6\\n3goSu60SNY8KO+PW3cE/buJIXCtCoU21i4xC/cxCjF0RVAotmhtSOXizeuRV3EBd\\ni+CR5Ldqe3bOBOqgjGwtr0jzlJ9zS21HBGl3iNloriaJD1c7J9bwFKPkeqhDPYb1\\n/7t7/J+hAgMBAAECggEAF/ScLve5vlAc2nbo7i4e8YKRQKFhbVKZN60mHEL+nYLo\\n/zfNm0PlHmsTnVyaxCx7qboHrWSLa/IS4A4YdCuW7DDhZqdS8620XdY44YRyC+jG\\neorCmPxqh1p5mZFO6KDImywmKaDWsZD4xPqlMwYHQtmiGXGyDmEuBmeQ625MYSNS\\nrFUcSnvhYFo5IoSZves4/VnbdIFLIZNHtvlGJFI+Pe1DtHM2Kh/BGsgWoJHOCGRK\\nKPSW0b2INWMt7mOM4hC1YHXw46bAwnr9yGF0h3aSSFvg0B5ljUcQN0SWvxmWcitX\\nhRI2fx0wzZJ7dGaM3TcBihxs8GNxA+CfJMfW2mzgAQKBgQDDxNXVelSHX6jFnTtS\\nzFZE7ScVD4RbYzaEPdKsoCgWECzWpBV4RZGoofsIBJXRw+Y+Am2XWJu20CoyB52o\\nTu8bGiZ1zPn85QajKOJmbEvNT4YBnGC5LM/mmAw4PH31wU2YJGOhyyEZQWCGNAda\\nw6lyRalHlpnhsDFOVBUjv/EgXQKBgQC+8N9JTO9zqudCOsBjXFPJsLSoG9ktfUFt\\n6TYZsf71GWEP+i0GTDQ1spEnAs/oHAI9GT32SeYJkVm1SUvUBZUcAC+M9S3AXSBG\\nRK4fRJI0zCU9SgqIyw4a9SRBY6bpalR1gaJoyOOP5bOBsSyHCzYKu/3b/8YTWj8y\\naJt1ZRlYFQKBgGCFU8iFH9f+2f9UnkMcbAxfwL0pgWBtchuRP6XM8Pav0uugytUZ\\nt88kzdgOKq/ZnlNEbzQHg/6Gc8dm6dxpzonWQtAh179QTA11wuosytLXOoLgzu99\\noKNYo+22JYRdYhx5FIZY2GDTUvvX+yhM/+ZPYj7hic00SZsM6b9Oi1whAoGAG3ck\\ndzPE4dt8hm9TCzfVqZZsdh4DYGK7DadVK98JsJHk/1paLaS6gdrcvELQSy/0Nnuy\\nCQJaP5gT0lrnuGjRKQTx0hHWcewzX0gzz7WaXlPbK3TCDSlALyqB+5HtCXhNC9YI\\n2Y/EBAfjiU1F/WrkbCjcfE/PWytJGeQoMHvJaH0CgYAacl+t1NUVv3bdg4hs4yd6\\nSrZODO5Kp5iahvi1KbQGvQ9QbfrB/4vZifJqMQ4d69dQv7xRJWHNhpZWQ2Vag0RN\\nKVR3JuV0tTqAaazIAMOJrK8Kd1gp8e7+Bii4l1cgrpJ3EUHtpbxg3nkYgC5EaaKm\\noW7w+59/hOx046oxfRW8wg==\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-azhbe@etabellav2.iam.gserviceaccount.com","client_id":"108856209193053976076","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-azhbe%40etabellav2.iam.gserviceaccount.com","universe_domain":"googleapis.com"}');

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
exports.RealtimeService = void 0;
const common_1 = __webpack_require__(3);
const users_service_1 = __webpack_require__(22);
let RealtimeService = class RealtimeService {
    setServer(server) {
        this.server = server;
    }
    constructor(user) {
        this.user = user;
    }
    async emitMsg(value, topic) {
        const event = value?.event;
        const status = value?.data?.data?.status;
        if (event === 'PUBLISH-TRANSCRIPT' && status === 'S') {
            this.server.emit(topic ? topic : "realtime-transcript-messages", value);
            return;
        }
        this.server.to(`U${value.data.nMasterid}`).emit(topic ? topic : "realtime-transcript-messages", value);
    }
    async emitCommentMsg(value, topic) {
        try {
            this.server.to(`FACT_${value.nFSid}`).emit(topic ? topic : "factsheet-comments", value);
        }
        catch (error) {
            console.error(error);
        }
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _a : Object])
], RealtimeService);


/***/ }),
/* 37 */
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
const nest_winston_1 = __webpack_require__(18);
const winston = __webpack_require__(17);
const fs = __webpack_require__(19);
const path = __webpack_require__(20);
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
/* 38 */
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
__exportStar(__webpack_require__(39), exports);
__exportStar(__webpack_require__(40), exports);


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
exports.GlobalModule = void 0;
const common_1 = __webpack_require__(3);
const global_service_1 = __webpack_require__(40);
const config_1 = __webpack_require__(15);
const scheduler_service_1 = __webpack_require__(41);
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
/* 40 */
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
/* 41 */
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
const moment = __webpack_require__(42);
const schedule = __webpack_require__(43);
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
/* 42 */
/***/ ((module) => {

module.exports = require("moment");

/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("node-schedule");

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
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.WebSocketModule = exports.AppGateway = void 0;
const common_1 = __webpack_require__(3);
const websockets_1 = __webpack_require__(8);
const socket_io_1 = __webpack_require__(9);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.SocketController = void 0;
const common_1 = __webpack_require__(3);
const upload_service_1 = __webpack_require__(23);
const microservices_1 = __webpack_require__(46);
const index_service_1 = __webpack_require__(24);
const users_service_1 = __webpack_require__(22);
const pagination_service_1 = __webpack_require__(25);
const batchfile_service_1 = __webpack_require__(26);
const export_service_1 = __webpack_require__(27);
const realtime_service_1 = __webpack_require__(36);
let SocketController = class SocketController {
    constructor(upload, index, user, pagination, batchfile, fileexport, realtime) {
        this.upload = upload;
        this.index = index;
        this.user = user;
        this.pagination = pagination;
        this.batchfile = batchfile;
        this.fileexport = fileexport;
        this.realtime = realtime;
    }
    handeAuth2(message, context) {
        console.log(`Received message for upload-response: `, message);
        this.upload.emitMsg(message);
    }
    handleExportExcel(message, context) {
        console.log(`Received message for EXPORT-EXCEL-RESPONCE: `, message);
        this.upload.emitMsg(message, 'EXPORT-EXCEL-RESPONCE');
    }
    handeAuth3(message, context) {
        console.log(`Received message for index-response: `, message);
        this.index.emitMsg(message);
    }
    onUserVerify(message, context) {
        console.log(`Received message for index-response: `, message);
        this.user.emitMsg(message);
    }
    handeAuth4(message, context) {
        console.log(`Received message for pagination-response: `, message);
        this.pagination.emitMsg(message);
    }
    handeAuth5(message, context) {
        console.log(`Received message for batchfile-response: `, message);
        this.batchfile.emitMsg(message);
    }
    handeAuth6(message, context) {
        console.log(`Received message for export-response: `, message);
        this.fileexport.emitMsg(message);
    }
    handleHyperlink(message, context) {
        console.log(`Received message for hyperlink-response: `, message);
        this.upload.emitMsg(message, 'hyperlink-response');
    }
    realtimelink(message, context) {
        console.log(`Received message for realtime-response: `, message);
        this.realtime.emitMsg(message);
    }
    downloadMessages(message, context) {
        console.log(`Received message for upload-response: `, message);
        this.upload.emitMsg(message, 'download-message');
    }
    factCommentMsg(message, context) {
        console.log(`Received message for factsheet-comments: `, message);
        this.realtime.emitCommentMsg(message);
    }
};
exports.SocketController = SocketController;
__decorate([
    (0, microservices_1.MessagePattern)('upload-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_h = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _h : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handeAuth2", null);
__decorate([
    (0, microservices_1.MessagePattern)('EXPORT-EXCEL-RESPONCE'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_j = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _j : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handleExportExcel", null);
__decorate([
    (0, microservices_1.MessagePattern)('index-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_k = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _k : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handeAuth3", null);
__decorate([
    (0, microservices_1.MessagePattern)('LOGIN-VERIFY'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_l = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _l : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "onUserVerify", null);
__decorate([
    (0, microservices_1.MessagePattern)('pagination-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_m = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _m : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handeAuth4", null);
__decorate([
    (0, microservices_1.MessagePattern)('batchfile-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_o = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _o : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handeAuth5", null);
__decorate([
    (0, microservices_1.MessagePattern)('export-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_p = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _p : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handeAuth6", null);
__decorate([
    (0, microservices_1.MessagePattern)('hyperlink-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_q = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _q : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "handleHyperlink", null);
__decorate([
    (0, microservices_1.MessagePattern)('realtime-response'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_r = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _r : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "realtimelink", null);
__decorate([
    (0, microservices_1.MessagePattern)('download-message'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_s = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _s : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "downloadMessages", null);
__decorate([
    (0, microservices_1.MessagePattern)('factsheet-comments'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_t = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _t : Object]),
    __metadata("design:returntype", void 0)
], SocketController.prototype, "factCommentMsg", null);
exports.SocketController = SocketController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof upload_service_1.UploadService !== "undefined" && upload_service_1.UploadService) === "function" ? _a : Object, typeof (_b = typeof index_service_1.IndexService !== "undefined" && index_service_1.IndexService) === "function" ? _b : Object, typeof (_c = typeof users_service_1.UsersService !== "undefined" && users_service_1.UsersService) === "function" ? _c : Object, typeof (_d = typeof pagination_service_1.PaginationService !== "undefined" && pagination_service_1.PaginationService) === "function" ? _d : Object, typeof (_e = typeof batchfile_service_1.BatchfileService !== "undefined" && batchfile_service_1.BatchfileService) === "function" ? _e : Object, typeof (_f = typeof export_service_1.ExportService !== "undefined" && export_service_1.ExportService) === "function" ? _f : Object, typeof (_g = typeof realtime_service_1.RealtimeService !== "undefined" && realtime_service_1.RealtimeService) === "function" ? _g : Object])
], SocketController);


/***/ }),
/* 46 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.NotificationController = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(46);
const notification_service_1 = __webpack_require__(32);
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    handeAuth2(message, context) {
        console.log(`Received message for notification: `, message);
        this.notificationService.emit(message);
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, microservices_1.MessagePattern)('notification'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], NotificationController.prototype, "handeAuth2", null);
exports.NotificationController = NotificationController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof notification_service_1.NotificationService !== "undefined" && notification_service_1.NotificationService) === "function" ? _a : Object])
], NotificationController);


/***/ }),
/* 48 */
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
const microservices_1 = __webpack_require__(46);
const kafka_shared_service_1 = __webpack_require__(49);
const config_1 = __webpack_require__(15);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(46);
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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.PresentController = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(46);
const present_service_1 = __webpack_require__(31);
let PresentController = class PresentController {
    constructor(present) {
        this.present = present;
    }
    handlePresentations(message, context) {
        console.log(`Received message for presentation: `, message);
        this.present.emitPresent(message);
    }
    handlePresentationTools(message, context) {
        console.log(`Received message for presentation-tools: `, message);
        this.present.emitPresentTools(message);
    }
    handlePresentationHighlights(message, context) {
        console.log(`Received message for present-highlights: `, message);
        this.present.emitHighlight(message);
    }
};
exports.PresentController = PresentController;
__decorate([
    (0, microservices_1.MessagePattern)('presentation'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], PresentController.prototype, "handlePresentations", null);
__decorate([
    (0, microservices_1.MessagePattern)('presentation-tools'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], PresentController.prototype, "handlePresentationTools", null);
__decorate([
    (0, microservices_1.MessagePattern)('present-highlights'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_d = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _d : Object]),
    __metadata("design:returntype", void 0)
], PresentController.prototype, "handlePresentationHighlights", null);
exports.PresentController = PresentController = __decorate([
    (0, common_1.Controller)('present'),
    __metadata("design:paramtypes", [typeof (_a = typeof present_service_1.PresentService !== "undefined" && present_service_1.PresentService) === "function" ? _a : Object])
], PresentController);


/***/ }),
/* 51 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(46);
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
/* 52 */
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 53 */
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
const socket_app_module_1 = __webpack_require__(2);
const common_1 = __webpack_require__(3);
const kafka_config_1 = __webpack_require__(51);
const cookieParser = __webpack_require__(52);
const dotenv = __webpack_require__(53);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(15);
async function bootstrap() {
    const app = await core_1.NestFactory.create(socket_app_module_1.SocketAppModule);
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('socket-group'));
    await app.startAllMicroservices();
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const configService = app.get(config_1.ConfigService);
    await app.listen(configService.get('PORT_SOCKETAPI'));
}
bootstrap();

})();

/******/ })()
;