import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import { FactService } from '../fact/fact.service';
import { assertCanDeleteQuickMark } from '../session/quick-mark-gate';
import { SessionListReq } from '../../interfaces/session.interface';
import {
  CheckNavigatedata,
  DeleteIssueCategoryParam,
  DeleteIssueDetailParam,
  GetAllFactList,
  GetIssueDetailsGroupedParam,
  GetIssueDetailsParam,
  GetQfactList,
  GetQmarkList,
  HighlightListParam,
  InsertHighlightsRequestBody,
  InsertIssueDetailRequestBody,
  IssueCategoryRequestBody,
  IssueListParam,
  IssueRequestBody,
  UpdateIssueDetailRequestBody,
  annotationsReq,
  catListParam,
  defaultSetupReq,
  deleteHighlightsRequestBody,
  deleteIssueRequestBody,
  dynamicComboReq,
  getAnnotHighlightEEP,
  getIssueAnnotationListBody,
  getLastIssueMDL,
  isseDetailByIdBody,
  issuedetaillist_by_issueidBody,
  removeMultipleHighlightsReq,
  updateDetailIssueNote,
  updateHighlightIssueIdsReq,
  IssueByidParam,
  issueSequenceParam,
  claimSequenceParam,
  qfactSequenceParam,
  qfactClaimSequenceParam,
  deleteClaimRequestBody,
  UpdateClaimRequestBody,
} from '../../interfaces/issue.interface';
import { ExportService } from '../export/export.service';
import { schemaType } from '@app/global/interfaces/db.interface';
import { assertCallerCanSeeSessions } from '../session/session-access-gate';
import { assertCanAddQuickMark } from '../session/quick-mark-gate';
import type { RealtimeUser } from '../../middleware/realtime-auth.middleware';
// import { IssueFgaService } from '../issue-fga/issue-fga.service';

/**
 * The issue / claim / highlight write SPs check ownership against the acting user, so the id they
 * read must be the JWT user (RealtimeAuthMiddleware sets req.user; the controller passes it here as
 * `caller`). RealtimeAuthMiddleware only overwrites keys the client sent, and several DTOs carry no
 * user id at all, so each write below sets the caller key itself, spread LAST so a client-sent
 * nUserid / nMasterid can never win. The key goes into the SP parameter, never into the validated
 * DTO, so forbidNonWhitelisted is not involved. Without a caller nothing reaches the DB.
 */
function missingCaller() {
  return { msg: -1, value: 'A token is required for authentication', error: 'Missing user' };
}

@Injectable()
export class IssueService {
  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    private exportService: ExportService,
    // One quick-mark write path (7b / D8): the issue/* highlight routes delegate to FactService.
    private readonly facts: FactService,
    // private issueFga: IssueFgaService,
  ) { }

  async getIssueCategory(body: catListParam): Promise<any> {
    let res = await this.db.executeRef('realtime_issuecategory', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }
  async getIssueList(body: IssueListParam): Promise<any> {
    // 1. get permissions
    // let jIssuePerms = await this.issueFga.getIssuePermissionsJson(body.nUserid, 'fully-consistent');
    // console.log('jIssuePerms', jIssuePerms);

    // // 2. send only IDs to DB
    // body['jIssueIds'] = jIssuePerms.map((p) => p.issueId);

    const res = await this.db.executeRef('realtime_issuelist', body);

    if (res.success) {
      // let allIssues = res.data[0];

      // Merge permissions with DB results using base permissions only
      // allIssues = allIssues.map((issue: any) => {
      //   const perms = jIssuePerms.find((p) => p.issueId === issue.nIid);
      //   return {
      //     ...issue,
      //     view: perms?.view ?? false,
      //     edit: perms?.edit ?? false,
      //     delete: perms?.delete ?? false,
      //   };
      // });

      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
    }
  }

  

  

  // async deleteIssue(body: deleteIssueRequestBody): Promise<any> {
  //   const parameter = {
  //     ...body,
  //     cPermission: 'D',
  //   };
  //   const res = await this.db.executeRef('realtime_handle_issue_master', parameter);

  //   if (res.success) {
  //     return res.data[0];
  //   } else {
  //     return { msg: -1, value: 'Failed to handle issue', error: res.error };
  //   }
  // }
  async handleIssueCategory(
    body: IssueCategoryRequestBody,
    permission: 'I' | 'U',
    caller: string | undefined,
  ): Promise<any> {
    if (!caller) return missingCaller();
    // The SP reads nUserid today; nMasterid carries the same caller for an acting-user check keyed on it.
    const parameter = { ...body, cICtype: permission, nUserid: caller, nMasterid: caller };
    const res = await this.db.executeRef(
      'realtime_handle_issue_category',
      parameter,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle issue category',
        error: res.error,
      };
    }
  }

  async deleteIssueCategory(param: DeleteIssueCategoryParam, caller: string | undefined): Promise<any> {
    if (!caller) return missingCaller();
    const parameter = { ...param, cICtype: 'D', nUserid: caller, nMasterid: caller };
    console.log('deleteIssueCategory', parameter);
    const res = await this.db.executeRef(
      'realtime_handle_issue_category',
      parameter,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to delete issue category',
        error: res.error,
      };
    }
  }

  async executeIssueDetailOperation<T>(
    body: T,
    permission: 'I' | 'U' | 'D',
    caller: string | undefined,
  ): Promise<any> {
    if (!caller) return missingCaller();
    const parameter =
      permission === 'D'
        ? {
          nIDid: (body as DeleteIssueDetailParam).nIDid,
          nUserid: caller,
          cPermission: permission,
        }
        : { ...body, cPermission: permission, nUserid: caller };
    const res = await this.db.executeRef(
      'realtime_handle_issue_detail',
      parameter,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle issue detail',
        error: res.error,
      };
    }
  }

  /** issue/insertHighlights = fact/insertHighlights since 7b / D8: one write path, realtime.et_qmark_handler (complete body). */
  async insertHighlights(
    body: InsertHighlightsRequestBody,
    permission: 'I' | 'D',
    user: RealtimeUser | undefined,
  ): Promise<any> {
    if (!user?.userId) return missingCaller();
    return this.facts.insertHighlights(body, permission, user);
  }

  async removemultihighlights(body: removeMultipleHighlightsReq, user: RealtimeUser | undefined): Promise<any> {
    const caller = user?.userId;
    if (!caller) return missingCaller();
    // 7b / D8: every quick mark named must be the caller's (or the caller a platform admin), as fact/deleteHighlights checks.
    for (const nHid of Array.isArray(body?.jHids) ? body.jHids : []) await assertCanDeleteQuickMark(this.db, user, nHid);
    const res = await this.db.executeRef(
      'realtime_delete_multiple_rhighlights',
      { ...body, nUserid: caller },
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

  /** issue/deleteHighlights = fact/deleteHighlights since 7b / D8: the owner rule, then realtime.et_qmark_handler. */
  async deleteHighlights(body: any, permission: 'I' | 'D', user: RealtimeUser | undefined): Promise<any> {
    if (!user?.userId) return missingCaller();
    return this.facts.deleteHighlights({ ...body, nMasterid: user.userId }, 'D', user.isAdmin === true);
  }

  /** @deprecated the public-schema write path, no route reaches it since 7b / D8. */
  private async deleteHighlightsPublic(body: any, permission: 'I' | 'D', caller: string | undefined): Promise<any> {
    if (!caller) return missingCaller();
    const parameter = { ...body, permission: permission, nUserid: caller };
    const res = await this.db.executeRef(
      'realtime_handle_rhighlights',
      parameter,
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
  async GetHighlightLists(body: HighlightListParam): Promise<any> {
    const res = await this.db.executeRef('realtime_get_highlightlist', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
    }
  }

  async getIssueDetails(param: GetIssueDetailsParam): Promise<any> {
    const res = await this.db.executeRef('realtime_get_issue_details', param);

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch issue details',
        error: res.error,
      };
    }
  }

  async getIssueDetailsAnnot(param: GetIssueDetailsGroupedParam): Promise<any> {
    const res = await this.db.executeRef(`realtime_get_issue_annot`, param);
    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch grouped issue details',
        error: res.error,
      };
    }
  }

  /*      async insertIssueDetail(body: InsertIssueDetailRequestBody): Promise<any> {
          const parameter = { ...body, cPermission: "I" };
          const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);
      
          if (res.success) {
            return res.data[0];
          } else {
            return { msg: -1, value: 'Failed to handle issue detail', error: res.error };
          }
        }
  
        async updateIssueDetail(body: UpdateIssueDetailRequestBody): Promise<any> {
          const parameter = { ...body, cPermission: "U" };
          const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);
      
          if (res.success) {
            return res.data[0];
          } else {
            return { msg: -1, value: 'Failed to handle issue detail', error: res.error };
          }
        }
      
        async deleteIssueDetail(param: DeleteIssueDetailParam): Promise<any> {
          const parameter = { nIDid: param.nIDid, cPermission: 'D' };
          const res = await this.db.executeRef('realtime_handle_issue_detail', parameter);
      
          if (res.success) {
            return res.data[0];
          } else {
            return { msg: -1, value: 'Failed to delete issue detail', error: res.error };
          }
        }*/

  async getIssueDetailby_issue_id(
    body: issuedetaillist_by_issueidBody,
  ): Promise<any> {
    const params = { ...body, ref: 2 };
    const res = await this.db.executeRef(
      'realtime_issuedetail_by_issueid',
      params,
    );

    if (res.success) {
      return res.data;
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch getIssueDetailby_issue_id',
        error: res.error,
      };
    }
  }

  async getIssueAnnotationList(body: getIssueAnnotationListBody): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_get_issue_annotation_list',
      body,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch realtime_get_issue_annotation_list',
        error: res.error,
      };
    }
  }

  async getIssueDetailById(body: isseDetailByIdBody): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_get_issuedetail_by_id',
      body,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch realtime_get_issuedetail_by_id',
        error: res.error,
      };
    }
  }

  async getAnnotationOfPages(body: getIssueAnnotationListBody): Promise<any> {
    body['ref'] = 2;
    console.log(
      '\n\n\n\n\n\n',
      'realtime_get_issue_annotation_highlight',
      '\n',
      body,
      '\n\n\n\n\n\n',
    );
    const res = await this.db.executeRef(
      'realtime_get_issue_annotation_highlight',
      body,
    );

    if (res.success) {
      return res.data;
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch realtime_get_issue_annotation_highlight',
        error: res.error,
      };
    }
  }

  async getcCodeMaster(body: dynamicComboReq): Promise<any> {
    let res = await this.db.executeRef('combo_codemaster', body);
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  async updateHighlightIssueIds(
    body: updateHighlightIssueIdsReq,
    caller: string | undefined,
  ): Promise<any> {
    if (!caller) return missingCaller();
    const res = await this.db.executeRef(
      'realtime_update_default_h_issue',
      { ...body, nUserid: caller, nMasterid: caller },
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle realtime_update_default_h_issue',
        error: res.error,
      };
    }
  }

  async FilterLastSelecedIssued(body: getLastIssueMDL): Promise<any> {
    const res = await this.db.executeRef('realtime_filter_last_issue', body);

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to handle realtime_filter_last_issue',
        error: res.error,
      };
    }
  }

  /**
   * POST issue/annothighlightexport: same export as transcript/annothighlightexport (the feed or
   * transcript of nSessionid, with nCaseid's name on the cover), so the same gate: 403 unless the
   * token user can see nSessionid (socket membership rule) and it belongs to nCaseid. Nothing is read
   * or written for anyone else.
   */
  async getAnnotHighlightExport(query: getAnnotHighlightEEP, user: RealtimeUser | undefined): Promise<any> {
    await assertCallerCanSeeSessions(this.db, user, [query?.nSessionid], query?.nCaseid);
    query['ref'] = 2;
    const res = await this.db.executeRef(
      'realtime_get_issue_annotation_highlight_export',
      query,
    );
    if (res.success) {
      const data = await this.exportService.exportFile(query, res.data);
      return data;
    } else {
      return {
        msg: -1,
        value: 'Failed to handle realtime_filter_last_issue',
        error: res.error,
      };
    }
  }

  async deleteDemoIssueDetails(param: any): Promise<any> {
    const res = await this.db.executeRef('realtime_demo_issues_delete', param);

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to delete issue category',
        error: res.error,
      };
    }
  }

  async updateIssueDetail(param: defaultSetupReq): Promise<any> {
    const res = await this.db.executeRef('realtime_defaultvalueupdate', param);

    if (res.success) {
      return res.data[0][0];
    } else {
      return {
        msg: -1,
        value: 'Failed to delete issue category',
        error: res.error,
      };
    }
  }

  async updateIssueDetailNote(param: updateDetailIssueNote, caller: string | undefined): Promise<any> {
    if (!caller) return missingCaller();
    const res = await this.db.executeRef('realtime_issue_detail_note', { ...param, nUserid: caller, nMasterid: caller });

    if (res.success) {
      return res.data[0][0];
    } else {
      return {
        msg: -1,
        value: 'Failed to delete issue category',
        error: res.error,
      };
    }
  }

  async getIssueDetail(body: annotationsReq): Promise<any> {
    try {
      const params = { ...body, ref: 2 };
      const res = await this.db.executeRef('annotations', params, 'realtime');
      if (res.success) {
        return { ref1: res.data[0], ref2: res.data[1] };
      } else {
        return {
          msg: -1,
          value: 'Failed to fetch getIssueDetailby_issue_id',
          error: res.error,
        };
      }
    } catch (error) {
      console.error('Failed to fetch issue details:', error);
      return { msg: -1, error: error.message };
    }
  }

  async getQfactList(body: GetQfactList): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_navigate_get_qfact_list',
      body,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  async getQmarkList(body: GetQmarkList): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_navigate_get_qmarks_list',
      body,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  async getAllFactList(body: GetAllFactList): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_navigate_get_all_fact_list',
      body,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  async checkNavigatedata(body: CheckNavigatedata): Promise<any> {
    const res = await this.db.executeRef('realtime_navigate_checkdata', body);

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  async getIssuebyid(body: IssueByidParam): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_issue_by_id',
      body,
      this.realTimeSchema,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return {
        msg: -1,
        value: 'Failed to fetch issue by id',
        error: res.error,
      };
    }
  }

  async issueSequence(body: issueSequenceParam): Promise<any> {
    let res = await this.db.executeRef(
      'realtime_handle_issue_secquence',
      body,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  
  async claimSequence(body: claimSequenceParam): Promise<any> {
    let res = await this.db.executeRef(
      'realtime_handle_claim_secquence',
      body,
      this.realTimeSchema,
    );
    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to fetch', error: res.error };
    }
  }

  

  async deleteClaim(body: deleteClaimRequestBody, caller: string | undefined): Promise<any> {
    if (!caller) return missingCaller();
    const parameter = {
      ...body,
      cPermission: 'SD',
      nMasterid: caller,
    };
    const res = await this.db.executeRef(
      'realtime_handle_claim_delete',
      parameter,
      this.realTimeSchema,
    );

    if (res.success) {
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle claim', error: res.error };
    }
  }
  
}
