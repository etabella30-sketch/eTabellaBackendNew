import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
import { Injectable } from '@nestjs/common';
import { roleModuleReq, roleModuleRes, roleModuleResetReq, roleModuleUpdateReq, roleModuleUpdateRes, rolePermissionReq, roleStatusReq, roleStatusRes, userModuleReq, userPermissionListReq, userPermissionReq, userQuotaReq, userQuotaRes, userStatusReq, userStatusRes } from 'apps/coreapi/src/interfaces/permissions.interface';

@Injectable()
export class PermissionService {

    constructor(private db: DbService, public rds: RedisDbService) {

    }

    async getrolepermissionlist(query: rolePermissionReq): Promise<any> {
        query.ref = 2;
        let res = await this.db.executeRef('pm_rolepermission', query);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async updateStatus(body: roleStatusReq): Promise<roleStatusRes> {
        let res = await this.db.executeRef('pm_role_statusmanage', body);
        if (res.success) {
            try {
                // if (body.cStatus != 'A' && res.data[0][0]["users"] && res.data[0][0]["users"].length) {
                //     const keys = res.data[0][0]["users"].map(id => `user/${id}`);
                //     this.rds.deleteValue(...keys);
                // }
            } catch (error) {

            }
            return { msg: 1, value: "Updated" };
        } else {
            return { msg: -1, value: 'updation failed', error: res.error }
        }
    }

    async getRoleModules(query: roleModuleReq): Promise<roleModuleRes> {
        let res = await this.db.executeRef('pm_role_modules', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getUserModules(query: userModuleReq): Promise<roleModuleRes> {
        let res = await this.db.executeRef('pm_user_modules', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async updateModule(body: roleModuleUpdateReq): Promise<roleModuleUpdateRes> {
        let res = await this.db.executeRef('pm_update_modules', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'updation failed', error: res.error }
        }
    }


    async getUserPermission(query: userPermissionReq): Promise<any> {
        query.ref = 2;
        let res = await this.db.executeRef('pm_userpermission', query);
        if (res.success) {
            return res.data;
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async updateUserStatus(body: userStatusReq): Promise<userStatusRes> {
        let res = await this.db.executeRef('pm_user_statusmanage', body);
        if (res.success) {
            try {
                // if (body.cStatus != 'A') {
                //     this.rds.deleteValue(`user/${body.nUserid}`);
                // }
            } catch (error) {
            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'updation failed', error: res.error }
        }
    }

    async updateUserQuota(body: userQuotaReq): Promise<userQuotaRes> {
        let res = await this.db.executeRef('pm_update_quota', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'updation failed', error: res.error }
        }
    }


    async getUserpermissionList(query: userPermissionListReq): Promise<any> {
        let res = await this.db.executeRef('pm_get_user_permission', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }
    
    async resetPermission(body: roleModuleResetReq): Promise<roleModuleUpdateRes> {
        let res = await this.db.executeRef('pm_reset_permission', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'updation failed', error: res.error }
        }
    }

    

    async getUserCasepermission(query: userPermissionListReq): Promise<any> {
        let res = await this.db.executeRef('pm_get_case_permission', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }
	
}
