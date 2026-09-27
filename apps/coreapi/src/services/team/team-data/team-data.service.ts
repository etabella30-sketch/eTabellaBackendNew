import { DbService } from '@app/global/db/pg/db.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { isCaseAdmin } from '@app/global/middleware/case.admin.middleware';
import { Request } from 'express';
import { caseMemberRow, sameId } from '../team-access';
import { TeamcolorRes } from 'apps/coreapi/src/interfaces/team-setup.interface';
import { CaseTeamReq, CaseUserInfoReq, CaseUserInfoRes, CaseUserReq, RoleListRes, TeamColorReq, TeamComboRes, TimeZoneRes, UserListRes, assignedUsersReq, assignedUsersRes, checkEmailReq, teamListResonce } from 'apps/coreapi/src/interfaces/team.interface';

@Injectable()
export class TeamDataService {

    constructor(private db: DbService) {

    }


    async getCaseTeams(query: CaseTeamReq): Promise<any> {
        // query.ref = 2;
        let res = await this.db.executeRef('teams', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getAllusers(query: CaseUserReq): Promise<UserListRes> {
        let res = await this.db.executeRef('allusers', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getAssignees(query: assignedUsersReq): Promise<assignedUsersRes> {
        let res = await this.db.executeRef('admin_case_assignedusers', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getRoles(): Promise<RoleListRes> {
        let res = await this.db.executeRef('rolelist', {});
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getCaseCombo(query: CaseTeamReq): Promise<TeamComboRes> {
        let res = await this.db.executeRef('combo_teams', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }

    async getTimeZone(): Promise<TimeZoneRes> {
        let res = await this.db.executeRef('timezonelist', {});
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getUserDetail(query: CaseUserInfoReq, req: Request): Promise<CaseUserInfoRes> {
        // Another user's details only for a global admin, or when both people are in nCaseid.
        if (!req?.['isAdmin'] && !sameId(query.nUserid, query.nMasterid)) {
            const shared = !!(await caseMemberRow(this.db, query.nCaseid, query.nMasterid))
                && !!(await caseMemberRow(this.db, query.nCaseid, query.nUserid));
            if (!shared) {
                throw new ForbiddenException({ msg: -1, value: 'Not allowed to view this user' });
            }
        }
        let res = await this.db.executeRef('case_user_info', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }



    async getTeamcolor(query: TeamColorReq): Promise<TeamcolorRes> {
        let res = await this.db.executeRef('teamcolors', query);
        if (res.success) {
            return res.data[0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async getCheckEmail(query: checkEmailReq, req: Request): Promise<UserListRes> {
        // Email -> user lookup is for building a case team: global admin or case admin of nCaseid.
        if (!req?.['isAdmin'] && !(await isCaseAdmin(this.db, query.nCaseid, query.nMasterid))) {
            throw new ForbiddenException({ msg: -1, value: 'Case Admin rights required' });
        }
        let res = await this.db.executeRef('checkemail', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


}
