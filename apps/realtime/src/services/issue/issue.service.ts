
import { Injectable, Logger } from '@nestjs/common';
import { DeleteIssueCategoryParam, DeleteIssueDetailParam, HighlightListParam, InsertHighlightsRequestBody, InsertIssueDetailRequestBody, IssueCategoryRequestBody, IssueListParam, IssueRequestBody, UpdateIssueDetailRequestBody, annotationsReq, catListParam, defaultSetupReq, deleteHighlightsRequestBody, deleteIssueRequestBody, dynamicComboReq, getAnnotHighlightEEP, getIssueAnnotationListBody, getLastIssueMDL, isseDetailByIdBody, issuedetaillist_by_issueidBody, logJoinReq, removeMultipleHighlightsReq, updateDetailIssueNote, updateHighlightIssueIdsReq } from '../../interfaces/issue.interface';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { QueryService } from '../query/query.services';
import { SyncService } from '../sync/sync.service';
import { ConnectivityService } from '../connectivity/connectivity.service';

import * as moment from 'moment';
import { UuidService } from '../uuid/uuid.service';
import { DbService } from '@app/global/db/pg/db.service';
// import { ExportService } from '../export/export.service';

@Injectable()
export class IssueService {
  private logger = new Logger('issue-service');
  constructor(private readonly dbLite: SqllitedbService, private db: DbService, private readonly queryService: QueryService, private uuid: UuidService
  ) {

  }


  async handleIssueCategory(body: IssueCategoryRequestBody, permission: 'I' | 'U'): Promise<any> {
    const parameter = { ...body, cICtype: permission };
    const res = await this.db.executeRef('realtime_handle_issue_category', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue category', error: res.error };
    }
  }

  async deleteIssueCategory(param: DeleteIssueCategoryParam): Promise<any> {
    const parameter = { ...param, cICtype: 'D' };
    console.log('deleteIssueCategory', parameter)
    const res = await this.db.executeRef('realtime_handle_issue_category', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to delete issue category', error: res.error };
    }
  }


  async getIssueCategory(body: catListParam): Promise<any> {
    let res = await this.db.executeRef('realtime_issuecategory', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error }
    }
  }


  async handleIssue(body: IssueRequestBody, permission: 'I' | 'U' | 'D'): Promise<any> {
    const parameter = {
      ...body,
      cPermission: permission,
    };
    const res = await this.db.executeRef('realtime_handle_issue_master', parameter);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue', error: res.error };
    }
  }


  async getIssueList(body: IssueListParam): Promise<any> {
    const res = await this.db.executeRef('realtime_issuelist', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
    }
  }



  async deleteIssue(body: deleteIssueRequestBody): Promise<any> {
    const parameter = {
      ...body,
      cPermission: 'D',
    };
    const res = await this.db.executeRef('realtime_handle_issue_master', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue', error: res.error };
    }
  }




  // async insertIssueDetail(body: InsertIssueDetailRequestBody): Promise<any> {
  //   let { cNote, cONote, nSessionid, nCaseid, cPageno, jCordinates, nUserid, nLID, cIidStr, cTranscript, cUNote } = body;
  //   let inserted_id = null;
  //   let msg = 1;
  //   let msg_text = '';
  //   try {
  //     let cord = JSON.stringify(jCordinates);

  //     // Insert new record into RIssueDetail
  //     const mdl = {
  //       cNote: cNote,
  //       cUNote: cUNote,
  //       cONote: cONote,
  //       nSessionid: nSessionid,
  //       nCaseid: nCaseid,
  //       cPageno: cTranscript === 'N' ? cPageno : null,
  //       jCordinates: cTranscript === 'N' ? cord : null,
  //       nUserid: nUserid,
  //       dCreatedt: new Date().toISOString(),
  //       nLID: nLID,
  //       jTCordinates: cTranscript === 'Y' ? jCordinates : null,
  //       cTPageno: cTranscript === 'Y' ? cPageno : null
  //     };

  //     inserted_id = await this.dbLite.insert('RIssueDetail', mdl);

  //     // Insert related issue data into RIssueMapid

  //     for (const item of cIidStr) {
  //       const mapModel = {
  //         nIDid: inserted_id,
  //         nIid: item.nIid,
  //         nRelid: item.nRelid,
  //         nImpactid: item.nImpactid,
  //         serialno: item.serialno
  //       };

  //       await this.dbLite.insert('RIssueMapid', mapModel);
  //     }
  //     msg_text = 'Annotation created.';


  //     // Fetch color from RIssueMaster if needed (if nLID exists)
  //     let cColor = null;
  //     if (nLID) {
  //       const issueMaster = await this.dbLite.get('RIssueMaster', 'nIid = ?', [nLID]);
  //       if (issueMaster.length > 0) {
  //         cColor = issueMaster[0].cColor;
  //       }
  //     }

  //     // if (this.connectivity.online) {
  //     //   await this.syncService.InitDataTransfer();
  //     //   await this.sendAnnotToLive({nIDid:inserted_id}, nUserid, 'ID');
  //     // }



  //     return [{ msg, message: msg_text, nIDid: inserted_id, cColor }];
  //   } catch (error) {
  //     return [{ msg: -1, error: error }];
  //   }
  // }

  async executeIssueDetailOperation<T>(body: T, permission: 'I' | 'U' | 'D'): Promise<any> {
    const parameter = permission === 'D' ? { nIDid: (body as DeleteIssueDetailParam).nIDid, cPermission: permission } : { ...body, cPermission: permission };
    const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue detail', error: res.error };
    }
  }



  /*
    async updateIssueDetail(body: UpdateIssueDetailRequestBody): Promise<any> {
      // const parameter = cPermission === 'D' ? { nIDid: (body as DeleteIssueDetailParam).nIDid, cPermission: permission } : { ...body, cPermission: permission };
      let { nIDid, cNote, cONote, nSessionid, nCaseid, cPageno, jCordinates, nUserid, nLID, cIidStr, cTranscript, cUNote } = body;
      let inserted_id = null;
      let msg = 1;
      let msg_text = '';
      try {
        let cord = JSON.stringify(jCordinates);
  
        // Update the existing record in RIssueDetail
        const updateFields = {
          cNote: cNote,
          cUNote: cUNote,
          cONote: cONote,
          nSessionid: nSessionid,
          nCaseid: nCaseid,
          cPageno: cTranscript === 'N' ? cPageno : null,
          jCordinates: cTranscript === 'N' ? cord : null,
          cTPageno: cTranscript === 'Y' ? cPageno : null,
          jTCordinates: cTranscript === 'Y' ? cord : null,
          nUserid: nUserid,
          dUpdatedt: new Date().toISOString(),
          nLID: nLID,
          isSynced: 0
        };
  
        await this.dbLite.update('RIssueDetail', updateFields, 'nIDid = ?', [nIDid]);
  
        // Delete old mappings and insert new mappings in RIssueMapid
        await this.dbLite.delete('RIssueMapid', 'nIDid = ?', [nIDid]);
  
  
        for (const item of cIidStr) {
          const mapModel = {
            nIDid: nIDid,
            nIid: item.nIid,
            nRelid: item.nRelid,
            nImpactid: item.nImpactid
          };
          await this.dbLite.insert('RIssueMapid', mapModel);
        }
  
        inserted_id = nIDid;
        msg_text = 'Annotation updated';
  
        // Fetch color from RIssueMaster if needed (if nLID exists)
        let cColor = null;
        if (nLID) {
          const issueMaster = await this.dbLite.get('RIssueMaster', 'nIid = ?', [nLID]);
          if (issueMaster.length > 0) {
            cColor = issueMaster[0].cColor;
          }
        }
  
        return [{ msg, message: msg_text, nIDid: inserted_id, cColor }];
      } catch (error) {
        return [{ msg: -1, error: error }];
      }
    }*/

  /* async deleteIssueDetail(param: DeleteIssueDetailParam): Promise<any> {
     try {
 
 
       try {
 
         await this.dbLite.delete('RIssueMapid', 'nIDid = ?', [param.nIDid]);
       } catch (error) {
 
       }
 
       await this.dbLite.delete('RIssueDetail', 'nIDid = ?', [param.nIDid]);
       return [{ msg: 1, value: 'Deleted Success' }];
     } catch (error) {
       return [{ msg: -1, error: error }];
     }
   }*/

  async getIssueDetailby_issue_id(body: issuedetaillist_by_issueidBody): Promise<any> {
    const params = { ...body, ref: 2 };
    const res = await this.db.executeRef('realtime_issuedetail_by_issueid', params);

    if (res.success) {
      return res.data;
    } else {
      return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
    }
  }




  async getIssueDetailById(body: isseDetailByIdBody): Promise<any> {
    const res = await this.db.executeRef('realtime_get_issuedetail_by_id', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch realtime_get_issuedetail_by_id', error: res.error };
    }
  }


  async insertHighlights(body: InsertHighlightsRequestBody, permission: 'I' | 'D'): Promise<any> {
    const parameter = { ...body, permission: permission };
    const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
    }
  }




  async removemultihighlights(body: removeMultipleHighlightsReq): Promise<any> {
    const res = await this.db.executeRef('realtime_delete_multiple_rhighlights', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
    }
  }


  async updateHighlightIssueIds(body: updateHighlightIssueIdsReq): Promise<any> {

    const res = await this.db.executeRef('realtime_update_default_h_issue', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle realtime_update_default_h_issue', error: res.error };
    }
  }






  async deleteHighlights(body: any, permission: 'I' | 'D'): Promise<any> {
    const parameter = { ...body, permission: permission };
    const res = await this.db.executeRef('realtime_handle_rhighlights', parameter);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue highlights', error: res.error };
    }
  }


  async GetHighlightLists(body: HighlightListParam): Promise<any> {
    const res = await this.db.executeRef('realtime_get_highlightlist', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
    }
  }





  async FilterLastSelecedIssued(body: getLastIssueMDL): Promise<any> {

    const res = await this.db.executeRef('realtime_filter_last_issue', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle realtime_filter_last_issue', error: res.error };
    }
  }



  async getIssueAnnotationList(body: getIssueAnnotationListBody): Promise<any> {
    const res = await this.db.executeRef('realtime_get_issue_annotation_list', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch realtime_get_issue_annotation_list', error: res.error };
    }
  }


  async getcCodeMaster(body: dynamicComboReq): Promise<any> {
    let res = await this.db.executeRef('combo_codemaster', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error }
    }
  }

  async deleteDemoIssueDetails(param: any): Promise<any> {
    return {}
  }



  async updateIssueDetailNote(param: updateDetailIssueNote): Promise<any> {
    const res = await this.db.executeRef('realtime_issue_detail_note', param);

    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed to delete issue category', error: res.error };
    }
  }



  ////////////////////////////


  async etRealtimeGetIssueAnnotationHighlight(parameter: getIssueAnnotationListBody): Promise<any> {

    const params = { ...parameter, ref: 2 };
    const res = await this.db.executeRef('realtime_issuedetail_by_issueid', params);

    if (res.success) {
      return { ref1: res.data[0], ref2: res.data[1] };;
    } else {
      return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
    }

    /* const nSessionid = parameter.nSessionid;
     const nCaseid = parameter.nCaseid;
     const nUserid = parameter.nUserid;
     const cTranscript = parameter.cTranscript || 'N';
 
     // Query for ref1
     const { query: ref1Query } = this.queryService.getAnnotOfPagesIssueSummaryQuery()
 
     const ref1Params = [cTranscript, cTranscript, nCaseid, nSessionid, nUserid];
     const ref1 = await this.dbLite.getCustomQuery(ref1Query, ref1Params);
 
     // Query for ref2
     const { query: ref2Query } = this.queryService.getAnnotOfPagesHighlightsQuery()
 
 
     const ref2Params = [cTranscript, cTranscript, nSessionid, nUserid, nCaseid, nUserid, nSessionid];
     const ref2 = await this.dbLite.getCustomQuery(ref2Query, ref2Params);
 
     return { ref1, ref2 };*/
  }


  async getIssueDetail(body: annotationsReq): Promise<any> {
    try {


      const params = { ...body, ref: 2 };
      const res = await this.db.executeRef('annotations', params, 'realtime');

      if (res.success) {
        return { ref1: res.data[0], ref2: res.data[1] };;
      } else {
        return { msg: -1, value: 'Failed to fetch getIssueDetailby_issue_id', error: res.error };
      }


      /* const nSessionid = body.nSessionid;
       const nCaseid = body.nCaseid;
       const nUserid = body.nUserid;
       const cTranscript = body.cTranscript || 'N';
 
       // Query for ref1
       const { query: ref1Query } = this.queryService.getAnnotOfPagesIssueSummaryQuery()
 
       const ref1Params = [cTranscript, cTranscript, nCaseid, nSessionid, nUserid];
       const ref1 = await this.dbLite.getCustomQuery(ref1Query, ref1Params);
       try {
         ref1.map(a => a.cordinates = JSON.parse(a.cordinates || '[]'))
       } catch (error) {
 
       }
       // Query for ref2
       const { query: ref2Query } = this.queryService.getAnnotOfPagesHighlightsQuery()
 
 
       const ref2Params = [cTranscript, cTranscript, nSessionid, nUserid, nCaseid, nUserid, nSessionid];
       const ref2 = await this.dbLite.getCustomQuery(ref2Query, ref2Params);
 
       return { ref1, ref2 };
 */
    } catch (error) {
      console.error('Failed to fetch issue details:', error);
      return { msg: -1, error: error.message }
    }
  }

  async updateIssueDetail(param: defaultSetupReq): Promise<any> {
    const res = await this.db.executeRef('realtime_defaultvalueupdate', param);

    if (res.success) {
      return res.data[0][0];
    } else {
      return { msg: -1, value: 'Failed to delete issue category', error: res.error };
    }
  }

  // async updateSessionDetail(nSesid: string, nUserid: string, flag: 'I' | 'H', jDefault: any, nLID: any): Promise<any> {

  //   try {
  //     const result = await this.dbLite.get('RSessionDetail', 'nSesid = ? and nUserid = ?', [nSesid, nUserid]);
  //     let nSDid = 0;
  //     if (result.length > 0) {
  //       nSDid = result[0]["nSDid"];
  //     } else {
  //       nSDid = await this.dbLite.insert('RSessionDetail', { nSesid, nUserid });
  //     }


  //     if (flag == 'I') {
  //       const updateSessionDetailQuery = `
  //         UPDATE RSessionDetail
  //         SET cDefIssues = ?, nLIid = ?
  //         WHERE nSesid = ? AND nUserid = ?
  //       `;
  //       await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(jDefault), nLID, nSesid, nUserid]);
  //     } else if (flag == 'H') {
  //       const updateSessionDetailQuery = `
  //         UPDATE RSessionDetail
  //         SET cDefHIssues = ?, nLID = ?
  //         WHERE nSesid = ? AND nUserid = ?
  //       `;
  //       await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(jDefault), nLID, nSesid, nUserid]);
  //     }

  //     return { msg: 1 };
  //   } catch (error) {
  //     console.error('Failed to fetch session detail by user:', error);
  //     return { msg: -1, error: error };
  //   }

  // }

  async joiningLog(body: logJoinReq): Promise<any> {
    let res = await this.db.executeRef('realtime_insertlog', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch insert_rtusers', error: res.error }
    }
  }
  // async joiningLog(body: logJoinReq): Promise<any> {
  //   try {
  //     const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');
  //     body["dCreateDt"] = formattedDate;
  //     if (body.cStatus == 'LG') {
  //       await this.dbLite.insert('RTLogs', body);
  //       return;
  //     }

  //     let nRTLid = 0;
  //     if (body.cStatus == 'L') {
  //       const r1 = await this.dbLite.getCustomQuery(`select nRTLid from RTLogs where nSesid = ? and nUserid = ? and cStatus = ? and dLeaveDt is null order by nRTLid desc limit 1`, [body.nSesid, body.nUserid, 'J'])
  //       if (r1?.length) {
  //         nRTLid = r1[0]["nRTLid"];
  //       }
  //     }

  //     if (body.cStatus == 'L') {
  //       // await this.dbLite.update('RTLogs', { dLeaveDt: new Date() }, 'nRTLid = ?', [nRTLid]);
  //       if (nRTLid > 0) {
  //         await this.dbLite.getCustomQuery(`update RTLogs set dLeaveDt = ?  where nRTLid = ?`, [formattedDate, nRTLid])
  //         await this.dbLite.update('RTLogs', { isSynced: 0 }, 'nRTLid = ?', [nRTLid]);
  //       }
  //     } else {


  //       try {
  //         await this.dbLite.getCustomQuery(`update RTLogs set dLeaveDt = ? where nSesid = ? and nUserid = ? and dLeaveDt is null`, [formattedDate, body.nSesid, body.nUserid]);

  //       } catch (error) {

  //       }

  //       const r2 = await this.dbLite.getCustomQuery(`SELECT nRTLid FROM RTLogs WHERE nSesid = ?   AND nUserid = ?   AND cStatus = ?   AND dLeaveDt IS NOT NULL   AND 6 > (strftime('%s', ?) - strftime('%s', dLeaveDt)) ORDER BY nRTLid DESC LIMIT 1`, [body.nSesid, body.nUserid, 'J', formattedDate])
  //       if (r2?.length) {
  //         nRTLid = r2[0]["nRTLid"];
  //       }
  //       if (nRTLid > 0) {
  //         await this.dbLite.update('RTLogs', { dLeaveDt: null, isSynced: 0 }, 'nRTLid = ?', [nRTLid]);
  //       } else {
  //         await this.dbLite.insert('RTLogs', body);
  //       }
  //     }



  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  async getIssueVersions(body: isseDetailByIdBody): Promise<any> {
    // return [];
    let res = await this.db.executeRef('annot_versions', body, 'realtime');
    if (res.success) {
      return res.data[0];
    } else {
      return []
    }
    /* const nIDid = body.nIDid;
     const { query } = this.queryService.getIssueVersion()
 
     try {
       // Execute the query to fetch the issue details by nIDid
       const result = await this.dbLite.getCustomQuery(query, [nIDid]);
       try {
         if (result?.length > 0) {
           result.map(a => a.jCordinates = JSON.parse(a.jCordinates || []))
         }
       } catch (error) {
 
       }
       return result;
     } catch (error) {
       console.error('Failed to fetch issue details by ID:', error);
       return [{ msg: -1, error: error }];
     }*/
  }
}