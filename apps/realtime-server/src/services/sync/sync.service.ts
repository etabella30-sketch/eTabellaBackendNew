import { Injectable } from '@nestjs/common';
import { pushDeleteData, pushHighlightData, pushIssueData, pushIssueDetailData, pushLogData, sessionDetailSql, sessionsUsers } from '../../interfaces/sync.interface';
import { DbService } from '@app/global/db/pg/db.service';
import { getIssueAnnotationListBody } from '../../interfaces/issue.interface';
import { IssueService } from '../issue/issue.service';

@Injectable()
export class SyncService {
  server: any;
  constructor(private db: DbService, private issueService: IssueService) {

  }

  async updateIssues(body: pushIssueData): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_issueupdate', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }

  async updateIssuesDetail(body: pushIssueDetailData): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_issuedetail_update', body);
    if (res.success) {
      try {
        this.scyncDataForAnnotations(res.data[0][0], 'ID')
      } catch (error) {
      }
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }

  async updateHighlights(body: pushHighlightData): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_highlight_update', body);
    if (res.success) {
      try {
        if (res.data[0][0]["jPages"]?.length) {
          this.scyncDataForAnnotations(res.data[0][0], 'HI')
        }
      } catch (error) {

      }
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }




  async DeleteData(body: pushDeleteData): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_delete', body);
    if (res.success) {
      try {
        console.log('DELETE DATA', res.data);
        if (res.data[0][0]["jIssues"]?.length) {
          this.scyncDataForAnnotations(res.data[0][0], 'ID-DELETE')
        }

        if (res.data[0][0]["jPages"]?.length) {
          this.scyncDataForAnnotations(res.data[0][0], 'HI')
        }
      } catch (error) {

      }
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }





  async PushLogData(body: pushLogData): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_logs', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }

  async sessionusers(body: sessionsUsers): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_session_users', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }


  async codemastersdata(body: sessionsUsers): Promise<any> {
    let res = await this.db.executeRef('realtime_coremaster_data', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }




  async sessionDetail(body: sessionDetailSql): Promise<any> {
    let res = await this.db.executeRef('realtime_sync_sessiondetail', body);
    if (res.success) {
      try {
        console.log('TOTAL EFFECTED', res.data[0][0]["jDetail"]?.length)
        if (res.data[0][0]["jDetail"]?.length) {
          this.scyncDataForAnnotations(res.data[0][0], 'SD');
        }
      } catch (error) {
        console.log(error);
      }
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to update', error: res.error }
    }
  }







  async scyncDataForAnnotations(mdl, type) {
    // console.log('SYNDED ISSUE DETAIL IDS', mdl);
    try {

      if (type == 'ID') {
        const ids = [...mdl.jNIssue, ...mdl.jUpdated];
        const users = [...new Set(ids.map(a => a.nUserid))];

        users.forEach(async (user) => {
          const jIssueIds = [...new Set(ids.filter(a => a.nUserid == user).map(a => a.nIDid))];
          if (this.server) {
            this.server.to(`U${user}`).emit('realtime-events', { jIssueIds, type: 'ID' });
          }
        })
      } else if (type == 'ID-DELETE') {
        const ids = mdl.jIssues;

        const users = [...new Set(ids.map(a => a.nUserid))];

        users.forEach(async (user) => {
          const jIssueIds = [...new Set(ids.filter(a => a.nUserid == user).map(a => a.nIDid))];
          if (this.server) {
            this.server.to(`U${user}`).emit('realtime-events', { jIssueIds, type: 'ID-DELETE' });
          }
        })

      } else if (type == 'HI') {

        const ids = mdl.jPages;
        const users = [...new Set(ids.map(a => a.nUserid))];

        users.forEach(async (user) => {
          const jPages = [...new Set(ids.filter(a => a.nUserid == user).filter(a => a.cPageno).map(a => a.cPageno))];
          if (this.server) {
            this.server.to(`U${user}`).emit('realtime-events', { jPages, type: 'HI' });
          }
        })

      } else if (type == 'SD') {
        const ids = mdl.jDetail || [];

        const users = [...new Set(ids.map(a => a.nUserid))];
        users.forEach(async (user) => {
          console.log('Sending to ', user)
          if (this.server) {
            this.server.to(`U${user}`).emit('realtime-events', { type: 'SD' });
          }
        })
      }


    } catch (error) {
      console.log(error);
    }
    //
  }

}