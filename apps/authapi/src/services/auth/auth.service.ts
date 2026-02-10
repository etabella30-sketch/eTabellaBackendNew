import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInReq, SignInResponce, SignInResponceUpdate, SignOutReq, SignOutResponce, UserInfoReq } from '../../interfaces/auth.interface';

import { DbService } from '@app/global/db/pg/db.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { UtilityService } from '../../utility/utility.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    expiry_token_limit_days = 15;
    constructor(private db: DbService, public passHash: PasswordHashService, private jwtService: JwtService,
        private readonly utility: UtilityService, private rds: RedisDbService, private config: ConfigService
    ) { }

    async signIn(body: SignInReq): Promise<SignInResponce> {
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
                    const redisres: any = await this.rds.getValue(`user/${res.data[0][0].nUserid}`);
                    if (redisres && redisres != '' && JSON.parse(redisres)["id"] != body.cBroweserid) {
                        this.insertLog(res.data[0][0].nUserid, 5, `Browser id: ${JSON.parse(redisres)["id"]} To ${body.cBroweserid}`, 'O', jOther)
                    }
                } catch (error) {

                }

                let token = await this.createToken(res.data[0][0].nUserid, body.cBroweserid);
                this.rds.setValue(`user/${res.data[0][0].nUserid}`, JSON.stringify({ id: body.cBroweserid, a: res.data[0][0].isAdmin || false }));
                console.warn('res', res.data[0])
                const responce_update: SignInResponceUpdate = {
                    nMasterid: res.data[0][0].nUserid || null,
                    cToken: body.cToken,
                    cJwt: token,
                    bResponce: true
                }
                let fetched_res = await this.db.executeRef('signin_responce', responce_update);
                if (fetched_res.success) {
                    jOther['jwt'] = token
                    jOther['limit'] = this.expiry_token_limit_days
                    this.insertLog(responce_update.nMasterid, 1, `Browserid ${body.cBroweserid}`, 'L', jOther)

                    this.utility.emit({ event: 'LOGIN-VERIFY', data: { cBroweserid: body.cBroweserid, nMasterid: res.data[0][0].nUserid } });
                    console.log('Return success')
                    return { msg: 1, value: 'login successfully', userDetail: fetched_res.data[0][0], token: token, expir_limit: this.expiry_token_limit_days };// userDetail;
                } else {
                    return { msg: -1, value: 'Failed to fetch user information' };
                }
            } else {

                this.insertLog(res.data[0][0].nUserid, 6, `${res.data[0][0].cPassword}`, 'L', jOther)
                return { msg: -1, value: 'Invalid password' };
            }

        } else {
            return { msg: -1, value: res.error };
        }
    }


    async signOut(body: SignOutReq): Promise<SignOutResponce> {
        await this.db.executeRef('signout', body);

        this.insertLog(body.nMasterid, 2, `Browser id: ${body.cBroweserid}`, 'O')

        try {
            this.rds.deleteValue(`user/${body.nMasterid}`);
        } catch (error) {

        }
        return { msg: 1, value: 'User signout!' };
    }


    async fetchUserInfo(body: UserInfoReq): Promise<SignInResponce> {
        let fetched_res = await this.db.executeRef('userdetail', body);
        if (fetched_res.success) {
            const userDetail: SignInResponce = fetched_res.data[0][0];
            return userDetail;
        } else {
            return { msg: -1, value: 'Failed to fetch user information' };
        }

    }


    async createToken(userId: string, broweserId: string) {
        const payload = { userId, broweserId };
        return this.jwtService.sign(payload, {
            expiresIn: this.expiry_token_limit_days + 'd', // Token expires in 2 days
            // expiresIn: '30s', // Token expires in 30 seconds
        });
    }

    async insertLog(nMasterid: string, cLCatid: number, cRemark: string, cType: string, jOther?: any) {
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
            }
            await this.db.executeRef('log_insert', log_data);
        } catch (error) {

        }
    }

}