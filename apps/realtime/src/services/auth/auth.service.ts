import { Injectable } from '@nestjs/common';
import { login } from '../../interfaces/session.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { UnicIdentityService } from '../../utility/unic-identity/unic-identity.service';
@Injectable()
export class AuthService {

    private readonly schema: schemaType = 'realtime'; // schemaType.realtime;
    constructor(private db: DbService, public passHash: PasswordHashService, private unicIdentity: UnicIdentityService) {

    }


    async login(body: login) {
        let res = await this.db.executeRef('signin', body, this.schema);

        if (res.success) {
            if (!res.data[0] || !res.data[0].length) {
                return { msg: -1, value: 'Invalid User' };
            }
            
            try {
                await this.db.executeRef('signin_responce', { nUserid: res.data[0][0]["nUserid"], cSessionUnicId: this.unicIdentity.getSessionUnicId() }, this.schema);
            } catch (error) {
            }

            let isVarify = await this.passHash.verifyPassword(body.password, res.data[0][0].cPassword);
            if (isVarify) {
                return { msg: 1, value: 'login successfully', userDetail: res.data[0][0] };

            } else {
                return { msg: -1, value: 'Invalid password' };
            }

        } else {
            return { msg: -1, value: res.error };
        }
    }




}
