import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
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


    async getUserDetail(query: CaseUserInfoReq): Promise<CaseUserInfoRes> {
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


    async getCheckEmail(query: checkEmailReq): Promise<UserListRes> {
        let res = await this.db.executeRef('checkemail', query);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


}
