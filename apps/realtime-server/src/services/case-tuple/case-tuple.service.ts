import { Injectable, Logger } from '@nestjs/common';
import { updatesReq } from '../../interfaces/case-tuple.interface';
import { DbService } from '@app/global/db/pg/db.service';
// import { OpenFgaService } from '../open-fga/open-fga.service';

@Injectable()
export class CaseTupleService {
  private readonly logger = new Logger(CaseTupleService.name);
  constructor(
    private db: DbService
    // private openFgaService: OpenFgaService,
  ) { }

  /*  async createCaseTuples(body: updatesReq) {
      try {
        const res = await this.db.executeRef('case_tuples_users', body);
        if (res.success) {
          const users = res.data[0];
  
          const userToupes = users.map((a) => ({
            user: `user:${a.nUserid}`,
            relation: 'member',
            object: `team:${a.nTeamid}`,
          }));
  
          const teamsTuples = [];
  
          users.forEach((a) => {
            const teamKey = `team:${a.nTeamid}`;
            if (teamsTuples.findIndex((m) => m.user == teamKey) == -1) {
              this.logger.warn('Adding team tuple for ', teamKey);
              teamsTuples.push({
                user: teamKey,
                relation: 'teams',
                object: `case:${a.nCaseid}`,
              });
            }
          });
          const finalToupers = [...userToupes, ...teamsTuples];
          this.logger.warn(
            `Total Toupes to be users:${userToupes?.length}, teams:${teamsTuples?.length}, total:${finalToupers?.length}`,
          );
          this.logger.verbose('All Tuples ', finalToupers);
  
          const status = await this.openFgaService.writeTuplesSafe(finalToupers);
          return { msg: 1, status, value: 'Updated' };
        } else {
          return { msg: -1, value: 'Update failed', error: res.error };
        }
      } catch (error) {
        return { msg: -1, value: 'Update failed', error: error };
      }
    }*/

  async createCaseTuples(body: updatesReq) {
     return { msg: -1, value: 'Update failed'};
    /*try {
      const res = await this.db.executeRef('case_tuples_users', body);
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
      };
    } catch (error) {
      this.logger.error('createCaseTuples failed', error);
      return { msg: -1, value: 'Update failed', error };
    }*/
  }

}
