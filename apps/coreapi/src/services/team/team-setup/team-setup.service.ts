import { DbService } from '@app/global/db/pg/db.service';
import { RedisDbService } from '@app/global/db/redis-db/redis-db.service';
// import { OpenFgaService } from '@app/global/open-fga/open-fga.service';
import { PasswordHashService } from '@app/global/utility/cryptography/password-hash.service';
import { Injectable, Logger } from '@nestjs/common';
import { TeamBuilderReq, TeamBuilderRes, UserBuilderReq, UserBuilderRes, teamSetup, teamSetupRes, UserDeleteReq, UserDeleteRes, TeamDeleteReq, TeamDeleteRes } from 'apps/coreapi/src/interfaces/team-setup.interface';

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

    async userBuilder(body: UserBuilderReq): Promise<UserBuilderRes> {
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


    async deleteUser(body: UserDeleteReq): Promise<UserDeleteRes> {
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
