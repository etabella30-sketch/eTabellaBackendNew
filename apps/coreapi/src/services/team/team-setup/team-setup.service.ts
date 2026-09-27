import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
// import { OpenFgaService } from '@app/global/open-fga/open-fga.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { isCaseAdmin } from '@app/global/middleware/case.admin.middleware';
import { Request } from 'express';
import { caseUserRow, sameId } from '../team-access';
import { TeamBuilderReq, TeamBuilderRes, UserBuilderReq, UserBuilderRes, teamSetup, teamSetupRes, UserDeleteReq, UserDeleteRes, TeamDeleteReq, TeamDeleteRes, UiModeReq, UiModeRes } from 'apps/coreapi/src/interfaces/team-setup.interface';

/** What a userbuilder caller may do; null = nothing. */
export type UserBuilderAccess = 'admin' | 'self' | 'case-admin' | null;

@Injectable()
export class TeamSetupService {

  private readonly logger = new Logger(TeamSetupService.name);
    constructor(private db: DbService, private passHash: PasswordHashService, public rds: RedisDbService
        // , private openFgaService: OpenFgaService
    ) { }


    async caseBuilder(body: TeamBuilderReq): Promise<TeamBuilderRes> {
        let res = await this.db.executeRef('teambuilder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Creation failed', error: res.error }
        }
    }


    async deleteTeam(body: TeamDeleteReq): Promise<TeamDeleteRes> {
        body.permission = 'D';
        let res = await this.db.executeRef('teambuilder', body);
        if (res.success) {
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Deletion failed', error: res.error }
        }
    }

    async userBuilder(body: UserBuilderReq, req: Request): Promise<UserBuilderRes> {
        const { access, target } = await this.resolveUserBuilderAccess(body, !!req?.['isAdmin']);
        if (!access) {
            throw new ForbiddenException({ msg: -1, value: 'Not allowed to change this user' });
        }
        if (access === 'case-admin') {
            return this.caseAdminTeamUpdate(body, target);
        }
        if (access === 'self') {
            // A user's own profile save never changes their case, team or role.
            delete body.nTeamid;
            delete body.nRoleid;
            delete body.nCaseid;
        }
        try {
            if (body.cPassword) {
                body.cPassword = await this.passHash.hashPassword(body.cPassword);
            }
            let res = await this.db.executeRef('userbuilder', body);
            if (res.success) {
                if (body.nTeamid) {
                    let teamObj = Object.assign(body, { nUserid: res.data[0][0]["nUserid"] });
                    await this.db.executeRef('user_team_management', teamObj);
                }
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Creation failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Creation failed', error: error }
        }

    }


    /**
     * Who may do what through userbuilder:
     *  - global admin: create / edit any user, team and role (unchanged);
     *  - the user themself ('E' on their own id): profile fields only;
     *  - a case admin of body.nCaseid: put an existing non-admin user (already in
     *    the case or not yet - the legacy dialog adds org users found by email) on
     *    one of that case's teams / roles; never create a user or change another
     *    user's name, email or password;
     *  - anyone else: nothing.
     */
    async userBuilderAccess(body: UserBuilderReq, isAdmin: boolean): Promise<UserBuilderAccess> {
        return (await this.resolveUserBuilderAccess(body, isAdmin)).access;
    }

    /** userBuilderAccess plus, for 'case-admin', the target's et_case_user_info row. */
    private async resolveUserBuilderAccess(body: UserBuilderReq, isAdmin: boolean): Promise<{ access: UserBuilderAccess; target?: any }> {
        const denied = { access: null };
        if (isAdmin) return { access: 'admin' };
        if (body.permission !== 'E') return denied;
        if (sameId(body.nUserid, body.nMasterid)) return { access: 'self' };
        if (!body.nCaseid || !body.nTeamid || !body.nUserid || body.cPassword) return denied;
        if (!(await isCaseAdmin(this.db, body.nCaseid, body.nMasterid))) return denied;

        const teams = await this.db.executeRef('combo_teams', { nCaseid: body.nCaseid });
        const caseTeams: any[] = teams?.success ? teams.data?.[0] ?? [] : [];
        if (!caseTeams.some((t) => sameId(t?.nTeamid, body.nTeamid))) return denied;

        // Existing user, member of the case or not (et_user_team_management inserts the
        // TeamRelation when there is none); an unknown id or a global admin is refused.
        const target = await caseUserRow(this.db, body.nCaseid, body.nUserid);
        if (!target || target.isAdmin) return denied;
        // The legacy form re-sends the user's current name/email; a changed value is a
        // profile edit, which only a global admin may make for someone else.
        const same = (a: any, b: any) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
        if (!same(target.cFname, body.cFname) || !same(target.cLname, body.cLname) || !same(target.cEmail, body.cEmail)) {
            return denied;
        }
        return { access: 'case-admin', target };
    }

    /**
     * Case-admin edit: only the user's team / role in that case changes, never UserMaster.
     * A missing nRoleid keeps the current role (the legacy dialog omits it when the role
     * control is disabled); passing it through would null the role in TeamRelation.
     */
    private async caseAdminTeamUpdate(body: UserBuilderReq, target: any): Promise<UserBuilderRes> {
        const { nUserid, nTeamid, nCaseid, nMasterid } = body;
        const nRoleid = body.nRoleid || target?.nRoleid || undefined;
        const res = await this.db.executeRef('user_team_management', { nUserid, nTeamid, nRoleid, nCaseid, nMasterid });
        if (res.success) {
            return { ...res.data[0][0], nUserid, nTeamid };
        }
        return { msg: -1, value: 'Update failed', error: res.error };
    }


    async teamAssignment(body: teamSetup): Promise<teamSetupRes> {
        try {
            let res = await this.db.executeRef('admin_case_teamsetup', body);
            if (res.success) {
                /*this.db.executeRef('admin_case_teamsetup_permissions', { nCaseid: body.nCaseid, nMasterid: body.nMasterid }).then(() => {
                    console.log('Background task completed successfully');
                }).catch((error) => {
                    console.error('Background task failed', error);
                });*/
                this.createCaseTuples(body);
                return res.data[0][0];
            } else {
                return { msg: -1, value: 'Update failed', error: res.error }
            }
        } catch (error) {
            return { msg: -1, value: 'Update failed', error: error }
        }

    }


    /** et_user_uimode_set updates only the caller's own UserMaster row
     *  (nMasterid is injected from the JWT) and echoes the stored mode. */
    async setUiMode(body: UiModeReq): Promise<UiModeRes> {
        const res = await this.db.executeRef('user_uimode_set', body);
        if (res.success) {
            return res.data[0][0];
        }
        return { msg: -1, value: 'Failed to update UI mode', error: res.error };
    }

    async deleteUser(body: UserDeleteReq, req: Request): Promise<UserDeleteRes> {
        if (!req?.['isAdmin']) {
            throw new ForbiddenException({ msg: -1, value: 'Admin rights required' });
        }
        body.permission = 'D';
        let res = await this.db.executeRef('userbuilder', body);
        if (res.success) {
            // call another service for 
            try {
                this.rds.deleteValue(`user/${body.nUserid}`);

            } catch (error) {

            }
            return res.data[0][0];
        } else {
            return { msg: -1, value: 'Failed to fetch', error: res.error }
        }
    }


    async createCaseTuples(body: any) {
        try {
            /*const res = await this.db.executeRef('case_tuples_users', body);
            if (!res.success) {
                return { msg: -1, value: 'Update failed', error: res.error };
            }

            const users = res.data[0] as Array<{ nUserid: number; nTeamid: number; nCaseid: number }>;
            if (!users?.length) {
                this.logger.warn('createCaseTuples: no rows returned from DB');
                return { msg: 0, value: 'No tuples to update' };
            }

            const caseId = users[0].nCaseid;
            const caseObj = `case:${caseId}`;

            // Build NEW desired tuples
            const userTuples = users.map((a) => ({
                user: `user:${a.nUserid}`,
                relation: 'member',
                object: `team:${a.nTeamid}`,
            }));

            const uniqueTeamIds = Array.from(new Set(users.map((u) => u.nTeamid)));
            const teamObjs = uniqueTeamIds.map((id) => `team:${id}`);

            const teamsTuples = teamObjs.map((teamKey) => ({
                user: teamKey,
                relation: 'teams',
                object: caseObj,
            }));

            const finalTuples = [...userTuples, ...teamsTuples];

            this.logger.warn(
                `Total tuples to write — users:${userTuples.length}, teams:${teamsTuples.length}, total:${finalTuples.length}`,
            );
            this.logger.verbose('All tuples (new state): ', finalTuples);

            // ----------- FULL REPLACE -----------
            // 1) Read existing tuples to delete:
            //    a) all team->case "teams" tuples for this case
            //    b) all user->team "member" tuples for each team involved
            const [existingTeamsToCase, existingUserMembersPerTeam] = await Promise.all([
                this.openFgaService.readAllTuples({ object: caseObj, relation: 'teams' }),
                Promise.all(teamObjs.map((obj) => this.openFgaService.readAllTuples({ object: obj, relation: 'member' }))),
            ]);

            const existingUserMembers = existingUserMembersPerTeam.flat();

            const toDelete = [...existingTeamsToCase, ...existingUserMembers];

            this.logger.warn(
                `Deleting old tuples — team->case:${existingTeamsToCase.length}, user->team:${existingUserMembers.length}, total deletes:${toDelete.length}`,
            );

            // 2) Delete old tuples (no-op if none)
            if (toDelete.length) {
                await this.openFgaService.deleteTuplesSafe(toDelete);
            }

            // 3) Write new tuples (skips existing inside writeTuplesSafe)
            const status: any = await this.openFgaService.writeTuplesSafe(finalTuples);

            return {
                msg: 1,
                status: { deleted: toDelete.length, wrote: Array.isArray(status?.wrote) ? status.wrote.length : finalTuples.length },
                value: 'Replaced tuples',
            };*/
        } catch (error) {
            this.logger.error('createCaseTuples failed', error);
            return { msg: -1, value: 'Update failed', error };
        }
    }



}
