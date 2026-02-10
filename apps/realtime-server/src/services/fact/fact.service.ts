import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { UtilityService } from '../utility/utility.service';
import {
  FactDetailReq,
  factDetailSingle,
  InsertFact,
  InsertQuickFact,
  quickfactUpdate,
  UpdatePermissionsRequestBody,
} from '../../interfaces/fact.interface';
import { schemaType } from '@app/global/interfaces/db.interface';
import {
  deleteHighlightsRequestBody,
  InsertHighlightsRequestBody,
} from '../../interfaces/issue.interface';
// import { OpenFgaService } from '../open-fga/open-fga.service';
// import { FactFgaService } from '../fact-fga/fact-fga.service';
// import { IssueFgaService } from '../issue-fga/issue-fga.service';

@Injectable()
export class FactService {
  realTimeSchema: schemaType = 'realtime';
  constructor(
    private db: DbService,
    private utility: UtilityService,
    // private openFga: OpenFgaService,
    // private factFga: FactFgaService,
    // private issueFga: IssueFgaService,
  ) { }
  async getFactDetailById(query: FactDetailReq): Promise<any> {
    query['ref'] = 3;
    let res = await this.db.executeRef(
      'fact_get_detail_single',
      query,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data;
    } else {
      return { msg: -1, value: 'Failed ', error: res.error };
    }
  }

  async quickfactUpdate(body: quickfactUpdate): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_quick_update',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1, value: 'Update failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Update failed', error: error };
    }
  }

  async getFactcontact(query: factDetailSingle): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_get_contact',
        query,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1, value: 'Fetch failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fetch failed', error: error };
    }
  }

  async getFactshared(query: factDetailSingle): Promise<any> {
    try {
      // const permissions = await this.factFga.getFactUserPermissions(
      //   query.nFSid,
      // );
      // console.log('Fact SHared users', permissions)
      // query['jPermittedUsers'] = permissions;
      // console.log('jPermittedUsers', query['jPermittedUsers']);
      const res = await this.db.executeRef(
        'fact_get_shared',
        query,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return { msg: -1, value: 'Fetch failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fetch failed', error: error };
    }
  }

  async insertQuickFact(body: InsertQuickFact): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0][0];
      } else {
        return { msg: -1, value: 'Fact insert  failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact insert  failed', error: error };
    }
  }

  async insertFactDetail(body: any): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert_detail',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return res.data[0];
      } else {
        return {
          msg: -1,
          value: 'Fact detail insert failed ',
          error: res.error,
        };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact detail insert failed ', error: error };
    }
  }

  async insertFactissues(body: any): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert_issues',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        // Invalidate issue caches for issues currently linked to this fact
       /* try {
          const factId = body.nFSid || body.nFactId || body.nFSId;
          if (factId) {
            const listRes = await this.openFga.listObjects({
              user: `fact:${factId}`,
              relation: 'in_fact',
              type: 'issue',
            });
            const ISSUE_RE = /^issue:(?:"(.+)"|(.+))$/;
            const issueIds = (listRes.objects ?? []).map((o) => {
              const m = ISSUE_RE.exec(o);
              return m ? (m[1] ?? m[2]) : o.replace(/^issue:/, '');
            });
            if (issueIds.length) {
              await this.issueFga.invalidateIssuesInFactCaches(issueIds);
              await Promise.all(
                issueIds.map((id) => this.issueFga.invalidateUserCachesForIssue(id)),
              );
            } else {
              // Clear snapshot at least if we cannot resolve per-issue
              await this.issueFga.invalidateIssuesInFactCaches([]);
            }
          } else {
            // No fact id in body; clear snapshot cache as a safe fallback
            await this.issueFga.invalidateIssuesInFactCaches([]);
          }
        } catch (e) {
          console.error('Fact issues invalidation error', e);
        }*/
        return true;
      } else {
        return {
          msg: -1,
          value: 'Fact issues insert failed ',
          error: res.error,
        };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact issues insert failed ', error: error };
    }
  }

  async insertFactcontact(body: any): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert_contact',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return true;
      } else {
        return {
          msg: -1,
          value: 'Fact contact insert failed ',
          error: res.error,
        };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact contact insert failed ', error: error };
    }
  }

  async insertFact(body: InsertFact): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        const fact = res.data[0][0];
        /* console.log('fact', fact);
        const tuples = [];
        let issueIds: string[] = [];

        // 1. Owner tuple via FactFgaService (ensures cache invalidation)
        if (fact.nFSid && body.nMasterid) {
          await this.factFga.createFactPermissions(fact.nFSid, body.nMasterid);
        }

        // 2. Freeze issues for this fact so owners can't delete when linked
        if (fact.nFSid) {
          tuples.push({
            user: 'user:*',
            relation: 'freeze_issues',
            object: `fact:${fact.nFSid}`,
          });
        }

        if (fact.nFSid && body.jIssues) {
          issueIds = [];

          try {
            const parsed = JSON.parse(body.jIssues);

            if (Array.isArray(parsed)) {
              issueIds = parsed.flat().map((x: any) => String(x));
            }
          } catch (e) {
            // fallback: handle CSV string 1,2,3
            issueIds = body.jIssues.split(',').map((x) => x.trim());
          }

          issueIds.forEach((issueId) => {
            if (issueId && issueId !== '0') {
              tuples.push({
                user: `fact:${fact.nFSid}`,
                relation: 'in_fact',
                object: `issue:${issueId}`,
              });
            }
          });
          //   if (fact.nFSid) {
          //     tuples.push({
          //       user: 'user:*',
          //       relation: 'freeze_issues',
          //       object: `fact:${fact.nFSid}`,
          //     });
          //   }
        }

        // 3. Write tuples to FGA
        if (tuples.length > 0) {
          console.log('\n\n\nInserting fact tuples', tuples);
          await this.openFga.writeTuplesSafe(tuples);
          // Invalidate issue caches impacted by in_fact links
          if (issueIds.length > 0) {
            await this.issueFga.invalidateIssuesInFactCaches(issueIds);
            await Promise.all(
              issueIds.map((id) => this.issueFga.invalidateUserCachesForIssue(id))
            );
          }
        }*/
        return fact;
      } else {
        return { msg: -1, value: 'Failed ', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Failed ', error: error };
    }
  }

  async insertFactlink(body: any): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert_links',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return true;
      } else {
        return { msg: -1, value: 'Fact link insert failed ', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact link insert failed ', error: error };
    }
  }
  async insertFacttask(body: any): Promise<any> {
    try {
      const res = await this.db.executeRef(
        'fact_insert_task',
        body,
        this.realTimeSchema,
      );
      if (res.success) {
        return true;
      } else {
        return { msg: -1, value: 'Fact task insert failed ', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact task insert failed ', error: error };
    }
  }

  async insertFactteam(body: any): Promise<any> {
    try {
      debugger;
      const res = await this.db.executeRef(
        'fact_insert_team',
        body,
        this.realTimeSchema,
      );

      if (res.success) {
        try {
          const notificationlist = res.data[0][0]['jNotify'] || [];
          if (notificationlist.length) {
            this.utility.sendNotification(notificationlist, body.nMasterid);
          }
        } catch (error) { }
       /* try {
          if (body.jUsers) {
            const users = JSON.parse(body.jUsers);
            if (users?.length)
              await this.insertFGATuples(body.nFSid, users);
          }
        } catch (error) {
        }*/


        return true;
      } else {
        return { msg: -1, value: 'Fact team insert failed ', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fact team insert failed ', error: error };
    }
  }

  async getFacttask(query: factDetailSingle): Promise<any> {
    try {
      query['ref'] = 3;
      const res = await this.db.executeRef('fact_get_task', query);
      if (res.success) {
        return res.data;
      } else {
        return { msg: -1, value: 'Fetch failed', error: res.error };
      }
    } catch (error) {
      return { msg: -1, value: 'Fetch failed', error: error };
    }
  }

  async insertHighlights(
    body: InsertHighlightsRequestBody,
    permission: 'I' | 'D',
  ): Promise<any> {
    const parameter = { ...body, permission: permission };
    const res = await this.db.executeRef(
      'qmark_handler',
      parameter,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle issue highlights',
        error: res.error,
      };
    }
  }

  async deleteHighlights(
    body: deleteHighlightsRequestBody,
    permission: 'I' | 'D',
  ): Promise<any> {
    const parameter = { ...body, permission: permission };
    const res = await this.db.executeRef(
      'qmark_handler',
      parameter,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle issue highlights',
        error: res.error,
      };
    }
  }

  /*async updatePermissions(body: UpdatePermissionsRequestBody): Promise<any> {
    const { nFSid, selectedUsers } = body;

    // Build tuples based on permissions
    const tuples = [];

    for (const user of selectedUsers) {
      const userRef = `user:${user.nUserid}`;
      const factRef = `fact:${nFSid}`;

      if (user.canEdit) {
        tuples.push({
          user: userRef,
          relation: 'editor',
          object: factRef,
        });
      }

      if (user.canReshare) {
        tuples.push({
          user: userRef,
          relation: 'sharer',
          object: factRef,
        });
      }

      if (user.canComment) {
        tuples.push({
          user: userRef,
          relation: 'commentor',
          object: factRef,
        });
      }
    }

    if (tuples.length) {
      const res = await this.openFga.writeTuplesSafe(tuples);
      if (res) {
        return {
          msg: 1,
          value: 'Fact permissions updated successfully',
        };
      }
    }
  }*/

/*   async getPermissions(nFactid: string, users: { nUserid: string }[]) {
    const factRef = `fact:${nFactid}`;

    const results = [];

    for (const u of users) {
      const userRef = `user:${u.nUserid}`;

      // Check if user is editor
      const editors = await this.openFga.listObjects({
        user: userRef,
        relation: 'editor',
        type: 'fact',
      });

      const sharers = await this.openFga.listObjects({
        user: userRef,
        relation: 'sharer',
        type: 'fact',
      });

      const commentor = await this.openFga.listObjects({
        user: userRef,
        relation: 'commentor',
        type: 'fact',
      });

      results.push({
        nUserid: u.nUserid,
        bCanEdit: editors.objects.includes(factRef),
        bCanReshare: sharers.objects.includes(factRef),
        bCanComment: commentor.objects.includes(factRef),
      });
    }

    return results;
  }

 async insertFGATuples(
    nFSid: string,
    users: {
      nUserid: string;
      bCanEdit: boolean;
      bCanReshare: boolean;
      bCanComment: boolean;
      bCanCopy: boolean;
    }[],
  ) {
    debugger;
    // console.log('\n\r\n\rTotal To Share', users?.length)
    const tuples = users.map((user) => {
      const userRef = `user:${user.nUserid}`;
      const factRef = `fact:${nFSid}`;

      const userTuples = [];


      userTuples.push({
        user: userRef,
        relation: 'viewer',
        object: factRef,
      });

      if (user.bCanEdit) {
        userTuples.push({
          user: userRef,
          relation: 'editor',
          object: factRef,
        });
      }

      if (user.bCanReshare) {
        userTuples.push({
          user: userRef,
          relation: 'sharer',
          object: factRef,
        });
      }

      if (user.bCanComment) {
        userTuples.push({
          user: userRef,
          relation: 'commentor',
          object: factRef,
        });
      }

      return userTuples;
    });


    // console.log('\n\r\n\r Total Tuples to insert \n', tuples?.length, tuples)

    // Flatten the array of arrays
    const flatTuples = tuples.flat();

    if (flatTuples.length) {
      await this.openFga.writeTuplesSafe(flatTuples);
    }
  }*/

}
