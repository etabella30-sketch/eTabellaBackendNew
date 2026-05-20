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
exports.AuthapiModule = void 0;
const common_1 = __webpack_require__(3);
const authapi_controller_1 = __webpack_require__(4);
const authapi_service_1 = __webpack_require__(5);
const auth_module_1 = __webpack_require__(8);
const global_1 = __webpack_require__(36);
let AuthapiModule = class AuthapiModule {
};
exports.AuthapiModule = AuthapiModule;
exports.AuthapiModule = AuthapiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            global_1.GlobalModule, auth_module_1.AuthModule
        ],
        controllers: [authapi_controller_1.AuthapiController],
        providers: [authapi_service_1.AuthapiService],
    })
], AuthapiModule);


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
exports.AuthapiController = void 0;
const common_1 = __webpack_require__(3);
const authapi_service_1 = __webpack_require__(5);
const swagger_1 = __webpack_require__(6);
const microservices_1 = __webpack_require__(7);
let AuthapiController = class AuthapiController {
    constructor(authapiService) {
        this.authapiService = authapiService;
    }
    getHello() {
        return this.authapiService.getHello();
    }
    handleNotification(message, context) {
        console.log(`Received message for notification: `, message);
    }
    handeAuth2(message, context) {
        console.log(`Received message for topic2: `, message);
    }
};
exports.AuthapiController = AuthapiController;
__decorate([
    (0, swagger_1.ApiExcludeEndpoint)(),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AuthapiController.prototype, "getHello", null);
__decorate([
    (0, microservices_1.MessagePattern)('my-topic'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_b = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _b : Object]),
    __metadata("design:returntype", void 0)
], AuthapiController.prototype, "handleNotification", null);
__decorate([
    (0, microservices_1.MessagePattern)('my-topic2'),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, typeof (_c = typeof microservices_1.KafkaContext !== "undefined" && microservices_1.KafkaContext) === "function" ? _c : Object]),
    __metadata("design:returntype", void 0)
], AuthapiController.prototype, "handeAuth2", null);
exports.AuthapiController = AuthapiController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [typeof (_a = typeof authapi_service_1.AuthapiService !== "undefined" && authapi_service_1.AuthapiService) === "function" ? _a : Object])
], AuthapiController);


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
exports.AuthapiService = void 0;
const common_1 = __webpack_require__(3);
let AuthapiService = class AuthapiService {
    getHello() {
        return 'Invalid request found!';
    }
};
exports.AuthapiService = AuthapiService;
exports.AuthapiService = AuthapiService = __decorate([
    (0, common_1.Injectable)()
], AuthapiService);


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@nestjs/swagger");

/***/ }),
/* 7 */
/***/ ((module) => {

module.exports = require("@nestjs/microservices");

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
exports.AuthModule = void 0;
const common_1 = __webpack_require__(3);
const passport_1 = __webpack_require__(9);
const auth_controller_1 = __webpack_require__(10);
const auth_service_1 = __webpack_require__(15);
const shared_module_1 = __webpack_require__(30);
const token_module_1 = __webpack_require__(31);
const jwt_strategy_1 = __webpack_require__(32);
const jwt_middleware_1 = __webpack_require__(34);
const password_hash_service_1 = __webpack_require__(21);
const utility_service_1 = __webpack_require__(26);
const kafka_module_1 = __webpack_require__(35);
const kafka_shared_service_1 = __webpack_require__(27);
let AuthModule = class AuthModule {
    configure(consumer) {
        consumer
            .apply(jwt_middleware_1.JwtMiddleware)
            .forRoutes({ path: 'auth/signout', method: common_1.RequestMethod.POST }, { path: 'auth/userinfo', method: common_1.RequestMethod.GET });
    }
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kafka_module_1.KafkaModule.register('etabella-auth', 'auth-group'),
            shared_module_1.SharedModule,
            passport_1.PassportModule,
            token_module_1.TokenModule
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [auth_service_1.AuthService, password_hash_service_1.PasswordHashService, jwt_strategy_1.JwtStrategy, utility_service_1.UtilityService, kafka_shared_service_1.KafkaGlobalService],
    })
], AuthModule);


/***/ }),
/* 9 */
/***/ ((module) => {

module.exports = require("@nestjs/passport");

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
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthController = void 0;
const common_1 = __webpack_require__(3);
const swagger_1 = __webpack_require__(6);
const auth_interface_1 = __webpack_require__(11);
const auth_service_1 = __webpack_require__(15);
const config_1 = __webpack_require__(20);
const express_1 = __webpack_require__(28);
const jwt = __webpack_require__(29);
let AuthController = class AuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async signIn(body, res) {
        const result = await this.authService.signIn(body);
        if (result.msg === 1 && result.token) {
            res.cookie('access_token', result.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 15 * 24 * 60 * 60 * 1000,
                path: '/',
            });
        }
        return result;
    }
    async signOut(body, res) {
        const result = await this.authService.signOut(body);
        res.clearCookie('access_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        return result;
    }
    async validate(req, res) {
        const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;
        if (!token) {
            res.status(401);
            return { msg: -1, message: 'No token provided' };
        }
        try {
            const decoded = jwt.verify(token, this.configService.get('JWT_SECRET'));
            const userDetail = await this.authService.fetchUserInfo({ nMasterid: decoded.userId });
            if (userDetail?.msg === -1) {
                res.status(401);
                return userDetail;
            }
            return { msg: 1, userDetail };
        }
        catch (err) {
            res.status(401);
            return { msg: -1, message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' };
        }
    }
    async userInfo(query) {
        return await this.authService.fetchUserInfo(query);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('signin'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_c = typeof auth_interface_1.SignInReq !== "undefined" && auth_interface_1.SignInReq) === "function" ? _c : Object, typeof (_d = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _d : Object]),
    __metadata("design:returntype", typeof (_e = typeof Promise !== "undefined" && Promise) === "function" ? _e : Object)
], AuthController.prototype, "signIn", null);
__decorate([
    (0, common_1.Post)('signout'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_f = typeof auth_interface_1.SignOutReq !== "undefined" && auth_interface_1.SignOutReq) === "function" ? _f : Object, typeof (_g = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _g : Object]),
    __metadata("design:returntype", typeof (_h = typeof Promise !== "undefined" && Promise) === "function" ? _h : Object)
], AuthController.prototype, "signOut", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_j = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _j : Object, typeof (_k = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validate", null);
__decorate([
    (0, common_1.Get)('userinfo'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_l = typeof auth_interface_1.UserInfoReq !== "undefined" && auth_interface_1.UserInfoReq) === "function" ? _l : Object]),
    __metadata("design:returntype", typeof (_m = typeof Promise !== "undefined" && Promise) === "function" ? _m : Object)
], AuthController.prototype, "userInfo", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiBearerAuth)('JWT'),
    (0, swagger_1.ApiTags)('Authantication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [typeof (_a = typeof auth_service_1.AuthService !== "undefined" && auth_service_1.AuthService) === "function" ? _a : Object, typeof (_b = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _b : Object])
], AuthController);


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
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.UserInfoReq = exports.SignOutReq = exports.SignInReq = void 0;
const swagger_1 = __webpack_require__(6);
const class_validator_1 = __webpack_require__(12);
const is_uuid_nullable_decorator_1 = __webpack_require__(13);
class SignInReq {
}
exports.SignInReq = SignInReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'example@gmail.com', description: '' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignInReq.prototype, "cEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'your password', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignInReq.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignInReq.prototype, "cBroweserid", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SignInReq.prototype, "cToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SignInReq.prototype, "bKeepMeLogin", void 0);
class SignOutReq {
}
exports.SignOutReq = SignOutReq;
__decorate([
    (0, swagger_1.ApiProperty)({ example: '', description: '' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SignOutReq.prototype, "cBroweserid", void 0);
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SignOutReq.prototype, "nMasterid", void 0);
class UserInfoReq {
}
exports.UserInfoReq = UserInfoReq;
__decorate([
    (0, is_uuid_nullable_decorator_1.IsItUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UserInfoReq.prototype, "nMasterid", void 0);


/***/ }),
/* 12 */
/***/ ((module) => {

module.exports = require("class-validator");

/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.IsItUUID = IsItUUID;
const common_1 = __webpack_require__(3);
const class_transformer_1 = __webpack_require__(14);
const class_validator_1 = __webpack_require__(12);
function IsItUUID() {
    return (0, common_1.applyDecorators)((0, class_transformer_1.Transform)(({ value }) => {
        return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }), (0, class_validator_1.ValidateIf)((obj, value) => !!value), (0, class_validator_1.IsUUID)());
}


/***/ }),
/* 14 */
/***/ ((module) => {

module.exports = require("class-transformer");

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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AuthService = void 0;
const common_1 = __webpack_require__(3);
const jwt_1 = __webpack_require__(16);
const db_service_1 = __webpack_require__(17);
const password_hash_service_1 = __webpack_require__(21);
const redis_db_service_1 = __webpack_require__(23);
const utility_service_1 = __webpack_require__(26);
const config_1 = __webpack_require__(20);
let AuthService = class AuthService {
    constructor(db, passHash, jwtService, utility, rds, config) {
        this.db = db;
        this.passHash = passHash;
        this.jwtService = jwtService;
        this.utility = utility;
        this.rds = rds;
        this.config = config;
        this.expiry_token_limit_days = 15;
    }
    async signIn(body) {
        debugger;
        let res = await this.db.executeRef('signin', body);
        if (res.success) {
            if (!res.data[0] || !res.data[0].length) {
                return { msg: -1, value: 'Invalid User' };
            }
            let isVarify = await this.passHash.verifyPassword(body.password, res.data[0][0].cPassword);
            let jOther = { 'KML': body.bKeepMeLogin };
            if (isVarify) {
                try {
                    const redisres = await this.rds.getValue(`user/${res.data[0][0].nUserid}`);
                    if (redisres && redisres != '' && JSON.parse(redisres)["id"] != body.cBroweserid) {
                        this.insertLog(res.data[0][0].nUserid, 5, `Browser id: ${JSON.parse(redisres)["id"]} To ${body.cBroweserid}`, 'O', jOther);
                    }
                }
                catch (error) {
                }
                let token = await this.createToken(res.data[0][0].nUserid, body.cBroweserid);
                this.rds.setValue(`user/${res.data[0][0].nUserid}`, JSON.stringify({ id: body.cBroweserid, a: res.data[0][0].isAdmin || false }));
                console.warn('res', res.data[0]);
                const responce_update = {
                    nMasterid: res.data[0][0].nUserid || null,
                    cToken: body.cToken,
                    cJwt: token,
                    bResponce: true
                };
                let fetched_res = await this.db.executeRef('signin_responce', responce_update);
                if (fetched_res.success) {
                    jOther['jwt'] = token;
                    jOther['limit'] = this.expiry_token_limit_days;
                    this.insertLog(responce_update.nMasterid, 1, `Browserid ${body.cBroweserid}`, 'L', jOther);
                    this.utility.emit({ event: 'LOGIN-VERIFY', data: { cBroweserid: body.cBroweserid, nMasterid: res.data[0][0].nUserid } });
                    console.log('Return success');
                    return { msg: 1, value: 'login successfully', userDetail: fetched_res.data[0][0], token: token, expir_limit: this.expiry_token_limit_days };
                }
                else {
                    return { msg: -1, value: 'Failed to fetch user information' };
                }
            }
            else {
                this.insertLog(res.data[0][0].nUserid, 6, `${res.data[0][0].cPassword}`, 'L', jOther);
                return { msg: -1, value: 'Invalid password' };
            }
        }
        else {
            return { msg: -1, value: res.error };
        }
    }
    async signOut(body) {
        await this.db.executeRef('signout', body);
        this.insertLog(body.nMasterid, 2, `Browser id: ${body.cBroweserid}`, 'O');
        this.rds.deleteValue(`user/${body.nMasterid}`);
        return { msg: 1, value: 'User signout!' };
    }
    async fetchUserInfo(body) {
        let fetched_res = await this.db.executeRef('userdetail', body);
        if (fetched_res.success) {
            const userDetail = fetched_res.data[0][0];
            return userDetail;
        }
        else {
            return { msg: -1, value: 'Failed to fetch user information' };
        }
    }
    async createToken(userId, broweserId) {
        const payload = { userId, broweserId };
        return this.jwtService.sign(payload, {
            expiresIn: this.expiry_token_limit_days + 'd',
        });
    }
    async insertLog(nMasterid, cLCatid, cRemark, cType, jOther) {
        let origin = this.config.get('ORIGIN');
        jOther = jOther ? jOther : {};
        jOther['O'] = origin;
        try {
            const log_data = {
                "nLCatid": cLCatid,
                "nMasterid": nMasterid,
                "cRemark": cRemark,
                "cType": 'L',
                "jData": jOther
            };
            await this.db.executeRef('log_insert', log_data);
        }
        catch (error) {
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof db_service_1.DbService !== "undefined" && db_service_1.DbService) === "function" ? _a : Object, typeof (_b = typeof password_hash_service_1.PasswordHashService !== "undefined" && password_hash_service_1.PasswordHashService) === "function" ? _b : Object, typeof (_c = typeof jwt_1.JwtService !== "undefined" && jwt_1.JwtService) === "function" ? _c : Object, typeof (_d = typeof utility_service_1.UtilityService !== "undefined" && utility_service_1.UtilityService) === "function" ? _d : Object, typeof (_e = typeof redis_db_service_1.RedisDbService !== "undefined" && redis_db_service_1.RedisDbService) === "function" ? _e : Object, typeof (_f = typeof config_1.ConfigService !== "undefined" && config_1.ConfigService) === "function" ? _f : Object])
], AuthService);


/***/ }),
/* 16 */
/***/ ((module) => {

module.exports = require("@nestjs/jwt");

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
var _a, _b;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DbService = void 0;
const common_1 = __webpack_require__(3);
const pg_1 = __webpack_require__(18);
const query_builder_service_1 = __webpack_require__(19);
const config_1 = __webpack_require__(20);
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
/* 18 */
/***/ ((module) => {

module.exports = require("pg");

/***/ }),
/* 19 */
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
/* 20 */
/***/ ((module) => {

module.exports = require("@nestjs/config");

/***/ }),
/* 21 */
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
const bcrypt = __webpack_require__(22);
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
/* 22 */
/***/ ((module) => {

module.exports = require("bcrypt");

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
exports.RedisDbService = void 0;
const common_1 = __webpack_require__(3);
const ioredis_1 = __webpack_require__(24);
const ioredis_2 = __webpack_require__(25);
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
/* 24 */
/***/ ((module) => {

module.exports = require("ioredis");

/***/ }),
/* 25 */
/***/ ((module) => {

module.exports = require("@nestjs-modules/ioredis");

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
exports.UtilityService = void 0;
const kafka_shared_service_1 = __webpack_require__(27);
const common_1 = __webpack_require__(3);
let UtilityService = class UtilityService {
    constructor(kafka) {
        this.kafka = kafka;
    }
    emit(data, topic) {
        console.log('Emited to kafka', data);
        this.kafka.sendMessage((topic ? topic : 'LOGIN-VERIFY'), data);
    }
};
exports.UtilityService = UtilityService;
exports.UtilityService = UtilityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof kafka_shared_service_1.KafkaGlobalService !== "undefined" && kafka_shared_service_1.KafkaGlobalService) === "function" ? _a : Object])
], UtilityService);


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
exports.KafkaGlobalService = void 0;
const common_1 = __webpack_require__(3);
const microservices_1 = __webpack_require__(7);
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
/* 28 */
/***/ ((module) => {

module.exports = require("express");

/***/ }),
/* 29 */
/***/ ((module) => {

module.exports = require("jsonwebtoken");

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
exports.SharedModule = void 0;
const common_1 = __webpack_require__(3);
const db_service_1 = __webpack_require__(17);
const query_builder_service_1 = __webpack_require__(19);
const ioredis_1 = __webpack_require__(25);
const redis_db_service_1 = __webpack_require__(23);
const config_1 = __webpack_require__(20);
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
/* 31 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.TokenModule = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(20);
const jwt_1 = __webpack_require__(16);
let TokenModule = class TokenModule {
};
exports.TokenModule = TokenModule;
exports.TokenModule = TokenModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: async (config) => ({
                    secret: config.get('JWT_SECRET'),
                    signOptions: { expiresIn: '60s' },
                }),
            }),
        ],
        controllers: [],
        providers: [],
        exports: [jwt_1.JwtModule]
    })
], TokenModule);


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
exports.JwtStrategy = void 0;
const common_1 = __webpack_require__(3);
const config_1 = __webpack_require__(20);
const passport_1 = __webpack_require__(9);
const passport_jwt_1 = __webpack_require__(33);
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
/* 33 */
/***/ ((module) => {

module.exports = require("passport-jwt");

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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.JwtMiddleware = void 0;
const common_1 = __webpack_require__(3);
const jwt = __webpack_require__(29);
const redis_db_service_1 = __webpack_require__(23);
const config_1 = __webpack_require__(20);
const db_service_1 = __webpack_require__(17);
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
/* 35 */
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
const microservices_1 = __webpack_require__(7);
const kafka_shared_service_1 = __webpack_require__(27);
const config_1 = __webpack_require__(20);
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
const config_1 = __webpack_require__(20);
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
/***/ ((module) => {

module.exports = require("cookie-parser");

/***/ }),
/* 43 */
/***/ ((module) => {

module.exports = require("dotenv");

/***/ }),
/* 44 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createKafkaOptions = createKafkaOptions;
const microservices_1 = __webpack_require__(7);
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
const authapi_module_1 = __webpack_require__(2);
const swagger_1 = __webpack_require__(6);
const common_1 = __webpack_require__(3);
const cookieParser = __webpack_require__(42);
const dotenv = __webpack_require__(43);
const kafka_config_1 = __webpack_require__(44);
dotenv.config({ path: `.env.${process.env.NODE_ENV ? process.env.NODE_ENV : 'development'}` });
const config_1 = __webpack_require__(20);
async function bootstrap() {
    const app = await core_1.NestFactory.create(authapi_module_1.AuthapiModule);
    app.use(cookieParser());
    app.connectMicroservice((0, kafka_config_1.createKafkaOptions)('auth-group'));
    await app.startAllMicroservices();
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Etabella Auth API')
        .setDescription('API description')
        .setVersion('1.0')
        .addServer(process.env.NODE_ENV === 'production' ? '/authapi' : '')
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
    const configService = app.get(config_1.ConfigService);
    await app.listen(configService.get('PORT_AUTHAPI'));
}
bootstrap();

})();

/******/ })()
;