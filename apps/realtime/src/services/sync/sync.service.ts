import { Injectable } from '@nestjs/common';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { ConnectivityService } from '../connectivity/connectivity.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import async from 'async';

@Injectable()
export class SyncService {
  private readonly queue;
  constructor(private readonly sqllitedbService: SqllitedbService, private dbLite: SqllitedbService, private readonly connectivity: ConnectivityService, private readonly config: ConfigService, private httpService: HttpService) {
    this.queue = async.queue(async (task, callback) => {
      await task();
      callback();
    }, 1);

    this.queue.drain(() => {
      // console.warn("\n All tasks have been processed", new Date());
    });

  }


  async pushData(): Promise<any> {
    if (!this.connectivity.online) return;

    this.queue.push(async () => {
      await this.InitDataTransfer();
    });

  }
  async InitDataTransfer(): Promise<any> {
    try {
      if (!this.connectivity.online) return;
      await this.issue();
      await this.deleteLog();
      await this.issueDetail();
      await this.highlights();
      await this.sessionDetail();
      await this.syncRTLog();
    } catch (error) {
      console.error('Error processing task:', error);
    }
    return true;
  }

  async issue(): Promise<boolean> {
    try {
      const issueCategory = await this.sqllitedbService.get('IssueCategory', 'isSynced = 0');

      const issues = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefICid" from RIssueMaster r left join IssueCategory i on i."nICid" = r."nICid" where r.isSynced = ?`, [0]);



      if (!issueCategory?.length && !issues?.length) return true;


      const data = {
        jCat: JSON.stringify(issueCategory || []),
        jIssue: JSON.stringify(issues || [])
      }
      const response = await this.makePostRequest('pushissue', data);
      if (response?.length) {
        const newcats = response[0]["jNCat"] || [];
        const newissues = response[0]["jNIssue"] || [];

        console.log('Responce length', newissues?.length, newcats?.length);

        if (newcats?.length) {
          const ids = newcats.map(x => x.nOICid);
          const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
          const updateQuery = `UPDATE IssueCategory SET nRefICid = CASE nICid ${queries} END, isSynced = 1 WHERE nICid IN (${ids.join(',')})`;

          const params = newcats.reduce((acc, x) => [...acc, x.nOICid, x.nICid], []);
          await this.sqllitedbService.getCustomQuery(updateQuery, params);
        }

        /* if (newcats?.length) {
           for (const x of newcats) {
             await this.sqllitedbService.update('IssueCategory', { nRefICid: x.nICid, isSynced: 1 }, 'nICid = ?', [x.nOICid]);
           }
         }*/
        if (newissues?.length) {
          const ids = newissues.map(x => x.nOIid);
          const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
          const updateQuery = `UPDATE RIssueMaster SET nRefIid = CASE nIid ${queries} END, isSynced = 1 WHERE nIid IN (${ids.join(',')})`;

          const params = newissues.reduce((acc, x) => [...acc, x.nOIid, x.nIid], []);
          await this.sqllitedbService.getCustomQuery(updateQuery, params);
        }


        if (response[0]["msg"] == 1) {
          const updatedSyncedCat = `UPDATE IssueCategory SET isSynced = 1 WHERE isSynced = 0 and nRefICid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSyncedCat, []);


          const updatedSynced = `UPDATE RIssueMaster SET isSynced = 1 WHERE isSynced = 0 and nRefIid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSynced, []);
        }


        /*if (newissues?.length) {
          for (const x of newissues) {
            await this.sqllitedbService.update('RIssueMaster', { nRefIid: x.nIid, isSynced: 1 }, 'nIid = ?', [x.nOIid]);
          }
        }*/
      }
    } catch (error) {
      console.error('Failed to sync issue:', error);
    }

    return true;
  }

  async issueDetail(): Promise<boolean> {
    try {
      // const issuedetails = await this.sqllitedbService.get('RIssueDetail', 'isSynced = 0');
      const issuedetails = await this.sqllitedbService.getCustomQuery(`select r."nIDid",r."cNote",s."nLSesid" as  "nSessionid",r."nCaseid",r."cPageno",r."jCordinates",r."nUserid",r."dCreatedt",r."dUpdatedt",
                                                                        r."cONote",i."nRefIid" as "nLID",r."jTCordinates",r."cTPageno",r."bTrf",r."nRefIDid",r.cUNote
                                                                        from RIssueDetail r 
                                                                        join "sessions" s on s."id" = r."nSessionid"  
                                                                        left join "RIssueMaster" i on i."nIid" = r."nLID"
                                                                        where r.isSynced = ?
                                                                        `, [0])

      const mapids = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefIDid",m."nRefIid" from RIssueMapid r 
                                                                left join RIssueDetail i on i."nIDid" = r."nIDid" 
                                                                join RIssueMaster m on m."nIid" = r."nIid"
                                                                where r.isSynced = ?`, [0]);

      issuedetails.forEach(a => {
        if (a.cUNote == null)
          delete a.cUNote
      })


      if (!issuedetails?.length && !mapids?.length) return true;
      try {
        issuedetails.map(a => a.jCordinates = JSON.parse(a.jCordinates || '[]'));
      } catch (error) {

      }
      const data = {
        jIssue: JSON.stringify(issuedetails || []),
        jMap: JSON.stringify(mapids || [])
      }

      const response = await this.makePostRequest('pushdetail', data);
      if (response?.length) {
        const newcats = response[0]["jNIssue"] || [];
        const newissues = response[0]["jNMap"] || [];

        if (newcats?.length) {
          const ids = newcats.map(x => x.nOIDid);
          const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
          const updateQuery = `UPDATE RIssueDetail SET nRefIDid = CASE nIDid ${queries} END, isSynced = 1 WHERE nIDid IN (${ids.join(',')})`;

          const params = newcats.reduce((acc, x) => [...acc, x.nOIDid, x.nIDid], []);
          await this.sqllitedbService.getCustomQuery(updateQuery, params);
        }

        ///////////////////////////////////

        if (newissues?.length) {
          const ids = newissues.map(x => x.nOMapid);
          const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
          const updateQuery = `UPDATE RIssueMapid SET nRefMapid = CASE nMapid ${queries} END, isSynced = 1 WHERE nMapid IN (${ids.join(',')})`;

          const params = newissues.reduce((acc, x) => [...acc, x.nOMapid, x.nMapid], []);
          await this.sqllitedbService.getCustomQuery(updateQuery, params);
        }

        if (response[0]["msg"] == 1) {
          const updatedSynced = `UPDATE RIssueDetail SET isSynced = 1 WHERE isSynced = 0 and nRefIDid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSynced, []);

          const updatedSyncedMaped = `UPDATE RIssueMapid SET isSynced = 1 WHERE isSynced = 0 and nRefMapid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSyncedMaped, []);
        }
      }
    } catch (error) {
      console.error('Failed to sync issue detail:', error);
    }
    return true;
  }


  async highlights(): Promise<boolean> {
    try {
      // const highlights = await this.sqllitedbService.get('RHighlights', 'isSynced = 0');

      const highlights = await this.sqllitedbService.getCustomQuery(`select r.nHid,r.cNote,r.jCordinates,r.nCaseid,s.nLSesid as nSessionId,r.nUserid,r.dCreatedt,r.cPageno,r.cLineno,r.cTPageno,r.cTLineno,r.cTime,r.cTTime,i."nRefIid" as nLID,r.nRefHid
                                                                       from RHighlights r 
                                                                       join sessions s on s.id = r.nSessionId
                                                                       left join "RIssueMaster" i on i."nIid" = r."nLID"
                                                                       where r.isSynced = ?
                                                                      `, [0])


      const mapids = await this.sqllitedbService.getCustomQuery(`select r.*, i."nRefHid",m."nRefIid" 
                                                                from RHighlightMapid r 
                                                                left join RHighlights i on i."nHid" = r."nHid" 
                                                                join RIssueMaster m on m."nIid" = r."nIid"
                                                                where r.isSynced = ?`, [0]);

      if (!highlights?.length && !mapids?.length) return true;
      try {
        highlights.map(a => a.jCordinates = JSON.parse(a.jCordinates || '[]'));
      } catch (error) {

      }

      const data = {
        jHighlights: JSON.stringify(highlights || []),
        jMap: JSON.stringify(mapids || [])
      }

      const response = await this.makePostRequest('pushhighlights', data);
      if (response?.length) {
        try {
          const newcats = response[0]["jNHighlights"] || [];
          const newissues = response[0]["jNMap"] || [];
          if (newcats?.length) {
            const ids = newcats.map(x => x.nOHid);
            const queries = newcats.map(() => 'WHEN ? THEN ?').join(' ');
            const updateQuery = `UPDATE RHighlights SET nRefHid = CASE nHid ${queries} END, isSynced = 1 WHERE nHid IN (${ids.join(',')})`;

            const params = newcats.reduce((acc, x) => [...acc, x.nOHid, x.nHid], []);
            await this.sqllitedbService.getCustomQuery(updateQuery, params);
          }
          if (newissues?.length) {
            const ids = newissues.map(x => x.nOMapid);
            const queries = newissues.map(() => 'WHEN ? THEN ?').join(' ');
            const updateQuery = `UPDATE RHighlightMapid SET nRefMapid = CASE nMapid ${queries} END, isSynced = 1 WHERE nMapid IN (${ids.join(',')})`;

            const params = newissues.reduce((acc, x) => [...acc, x.nOMapid, x.nMapid], []);
            await this.sqllitedbService.getCustomQuery(updateQuery, params);
          }
        } catch (error) {

        }

        if (response[0]["msg"] == 1) {
          const updatedSynced = `UPDATE RHighlights SET isSynced = 1 WHERE isSynced = 0 and nRefHid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSynced, []);

          const updatedSyncedMaped = `UPDATE RHighlightMapid SET isSynced = 1 WHERE isSynced = 0 and nRefMapid is not null`;
          await this.sqllitedbService.getCustomQuery(updatedSyncedMaped, []);
        }
      }
    } catch (error) {
      console.error('Failed to sync issue detail:', error);

    }

    return true;
  }

  async sessionDetail(): Promise<boolean> {
    try {
      debugger;
      const list = await this.sqllitedbService.getCustomQuery(
        `select sd.nSDid,s.nLSesid as nSesid,sd.nUserid,sd.cDefIssues,
            sd.nLIid,sd.cDefHIssues,sd.nLID,sd.nRefSDid
            from RSessionDetail sd 
            join sessions s on s.id = sd.nSesid 
            where s.nLSesid is not null and ( coalesce(sd.cDefHIssues,'') != '' or coalesce(sd.cDefIssues,'') != '' or sd.nLIid is not null or sd.nLID is not null) `, []
      );
      const issues = await this.sqllitedbService.get('RIssueMaster', 'nRefIid is not null');

      const sendData = []
      list.forEach((e) => {
        const obj = { nSDid: e.nSDid, nSesid: e.nSesid, nUserid: e.nUserid, nRefSDid: e.nRefSDid, nLID: 0, nLIid: 0, cDefIssues: [], cDefHIssues: [] };
        // const cDefIssues = [], cDefHIssues = [];
        // let nLIid, nLID;
        try {
          const def_issues = e.cDefIssues ? JSON.parse(e.cDefIssues) : [];
          if (def_issues?.length) {
            def_issues.forEach(a => {
              const nIid = issues.find(m => m.nIid == a.nIid)?.nRefIid || 0;
              if (nIid) {
                obj.cDefIssues.push({
                  nIid: nIid,
                  nRelid: a.nRelid,
                  nImpactid: a.nImpactid,
                  serialno: a.serialno
                });
              }
            })
          }
        } catch (error) {
          console.log(error);
        }
        try {
          const def_issues = e.cDefHIssues ? JSON.parse(e.cDefHIssues) : [];
          if (def_issues?.length) {
            def_issues.forEach(a => {
              const nIid = issues.find(m => m.nIid == a.nIid)?.nRefIid || 0;
              if (nIid) {
                obj.cDefHIssues.push({
                  nIid: nIid,
                  serialno: a.serialno
                });
              }
            })
          }
        } catch (error) {
          console.log(error);
        }
        try {
          if (e.nLID) {
            obj.nLID = issues.find(a => a.nIid == e.nLID)?.nRefIid || 0;
          }
        } catch (error) {
          console.log(error);
        }
        try {
          if (e.nLIid) {
            obj.nLIid = issues.find(a => a.nIid == e.nLIid)?.nRefIid || 0;
          }
        } catch (error) {
          console.log(error);
        }
        sendData.push(obj);
      })
      if (sendData?.length) {


        const response = await this.makePostRequest('pushsessiondetail', { jSDetail: JSON.stringify(sendData) });

        if (response?.length) {
          if (response[0]["msg"] == 1) {
            const updated_rows = response[0]["jDetail"] || [];
            if (updated_rows?.length) {

              const ids = updated_rows.map(x => x.nOSDid);
              const queries = updated_rows.map(() => 'WHEN ? THEN ?').join(' ');
              const updateQuery = `UPDATE RSessionDetail SET nRefSDid = CASE nSDid ${queries} END, isSynced = 1 WHERE nSDid IN (${ids.join(',')})`;

              const params = updated_rows.reduce((acc, x) => [...acc, x.nOSDid, x.nSDid], []);
              await this.sqllitedbService.getCustomQuery(updateQuery, params);


            }
          }
        }

      }

    } catch (error) {
      console.log(error);
    }



    return true;
  }

  async deleteLog(): Promise<boolean> {
    const deleteLog = await this.sqllitedbService.get('delete_log', 'isSynced = 0');

    // console.log('Length of delete log', deleteLog?.length);
    if (!deleteLog?.length) return true;
    const newdata = deleteLog.map((x) => ({ id: x.id, deleted_id: x.deleted_id, table_name: x.table_name }));
    const data = {
      jDelete: JSON.stringify(newdata || [])
    }

    const response = await this.makePostRequest('pushdelete', data);

    console.log('Res of delete', response);
    if (response?.length) {
      const newcats = newdata;
      if (newcats?.length) {
        const ids = newcats.map(x => x.id);
        const updateQuery = `UPDATE delete_log SET isSynced = 1 WHERE id IN (${ids.join(',')})`;
        const params = newcats.reduce((acc, x) => [...acc, x.deleted_id], []);
        await this.sqllitedbService.getCustomQuery(updateQuery, []);
      }
    }

    return true;
  }


  async syncCaseUsers(nSesid): Promise<any> {
    debugger;
    if (!this.connectivity.online) return;
    try {
      const sessionn = await this.dbLite.get('sessions', 'id = ?', [nSesid]);
      if (!sessionn?.length) return;

      const nCaseid = sessionn[0]["nCaseid"];
      const users = await this.makePostRequest('sessionusers', { jCaseids: JSON.stringify([nCaseid]) }) || [];

      if (users?.length) {
        const userData = users.map((a) => ({ cFname: a.cFname, cLname: a.cLname, cEmail: a.cEmail, nUserid: a.nUserid, cIsvarify: 'Y' }));
        if (userData?.length)
          await this.dbLite.insertManyWithConflict('users', userData, ['cEmail']);
        const caseUsers = users.flatMap(obj =>
          obj.jCases.map(jCase => ({
            nUserid: obj.nUserid,
            nCaseid: jCase
          }))
        );
        try {
          if (caseUsers?.length)
            await this.dbLite.insertManyWithConflict('caseusers', caseUsers, ['nCaseid', 'nUserid']);
        } catch (error) {
          console.log('Failed to sync caseusers insert:', error);
        }
        const sessiondetail = users.map(a => ({ nSesid: nSesid, nUserid: a.nUserid, cUsertype: 'T', dDelDt: null, cDefHIssues: '', nLID: 0 }));
        if (sessiondetail?.length)
          await this.dbLite.insertManyWithConflict('RSessionDetail', sessiondetail, ['nSesid', 'nUserid']);

        try {
          await this.dbLite.delete('caseusers', 'nCaseid = ? and nUserid not in (' + caseUsers.filter(a => a.nCaseid == nCaseid).map(x => x.nUserid).join(',') + ')', [nCaseid]);
          await this.dbLite.delete('RSessionDetail', 'nSesid = ? and nUserid not in (' + caseUsers.filter(a => a.nCaseid == nCaseid).map(x => x.nUserid).join(',') + ')', [nSesid]);

        } catch (error) {

        }

      }
      await this.dbLite.update('sessions', { isUsersSynced: 1 }, 'id = ?', [nSesid]);
    } catch (error) {
      console.log('Failed to sync case users:', error);
    }

    return { msg: 1, value: 'Success' };
  }


  async syncRTLog(): Promise<any> {
    try {

      const list = await this.sqllitedbService.getCustomQuery(`select r.nRTLid,r.nUserid,s.nLSesid as nSesid,r.cStatus,r.dCreateDt,r.cSource ,r.dLeaveDt ,r.nRefRTLid
      from RTLogs r 
      left join sessions s on s.id = r.nSesid and  s.isSynced = 1
      where (r.isSynced = 0 and r.nSesid == 0) or (r.isSynced = 0 and r.nSesid is not null and s.id is not null )` , []);


      if (list?.length) {
        const data = {
          jLogs: JSON.stringify(list || [])
        }

        const response = await this.makePostRequest('pushrtlogs', data);

        if (response?.length) {
          if (response[0]["msg"] == 1) {
            // await this.sqllitedbService.getCustomQuery(`update RTLogs set isSynced = ? where nRTLid in (${list.map(a => a.nRTLid).join(',')})`, [1])

            const updated_rows = response[0]["jInserted"] || [];
            if (updated_rows?.length) {

              const ids = updated_rows.map(x => x.nORTLid);
              const queries = updated_rows.map(() => 'WHEN ? THEN ?').join(' ');
              const updateQuery = `UPDATE RTLogs SET nRefRTLid = CASE nRTLid ${queries} END, isSynced = 1 WHERE nRTLid IN (${ids.join(',')})`;
              const params = updated_rows.reduce((acc, x) => [...acc, x.nORTLid, x.nRTLid], []);
              await this.sqllitedbService.getCustomQuery(updateQuery, params);


            }
            try {
              await this.sqllitedbService.getCustomQuery(`update RTLogs set isSynced = ? where nRTLid in (${list.map(a => a.nRTLid).join(',')})`, [1])
            } catch (error) {

            }
          }
        }

      }
    } catch (error) {
      console.log(error);
    }

  }

  async makePostRequest(apipath: string, body: any): Promise<any> {
    try {
      const url = new URL(this.config.get('LIVE_SERVER') + '/sync/' + apipath);
      const response = await firstValueFrom(
        this.httpService.post(url.toString(), body)
      );
      return response.data ? response.data : { msg: -1, value: 'Failed' };
    } catch (error) {
      console.error('Failed to post data to:', apipath, error?.message);
      return { msg: -1, value: 'Failed' };
    }
  }

}