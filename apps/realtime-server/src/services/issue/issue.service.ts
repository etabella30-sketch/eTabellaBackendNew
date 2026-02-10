import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
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
  deleteClaimRequestBody,
  UpdateClaimRequestBody,
} from '../../interfaces/issue.interface';
import { ExportService } from '../export/export.service';
import { schemaType } from '@app/global/interfaces/db.interface';
// import { IssueFgaService } from '../issue-fga/issue-fga.service';

@Injectable()
export class IssueService {
  realTimeSchema: schemaType = 'realtime';

  constructor(
    private db: DbService,
    private exportService: ExportService,
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

  
  async getIssueListGroup(body: IssueListParam): Promise<any> {
    body['ref'] = 2;
    // 1. get permissions
    // let jIssuePerms = await this.issueFga.getIssuePermissionsJson(body.nUserid, 'fully-consistent');
    // console.log('jIssuePerms', jIssuePerms);

    // // 2. send only IDs to DB
    // body['jIssueIds'] = jIssuePerms.map((p) => p.issueId);

    const res = await this.db.executeRef('realtime_issuelist_group', body);

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

      return res.data;
    } else {
      return { msg: -1, value: 'Failed to fetch issue list', error: res.error };
    }
  }

  

  async handleIssue(
    body: IssueRequestBody,
    permission: 'I' | 'U' | 'D',
  ): Promise<any> {
    // try {

    //   let jIssuePerms = await this.issueFga.getIssuePermissionsJson(body.nUserid);

    //   // 2. send only IDs to DB
    //   body['jIssueIds'] = jIssuePerms.map((p) => p.issueId);


    // } catch (error) {
    //   console.error(error)
    // }
    const parameter = {
      ...body,
      cPermission: permission,
    };


    const res = await this.db.executeRef(
      'realtime_handle_issue_master',
      parameter,
    );

    if (res.success) {
      const issue = res.data[0];
      // console.log('issue', issue);
      // console.log('body', body);
      // console.log('issue', issue);

      // Handle tuple management based on operation type
      /*try {
        if (permission === 'I' && issue[0]?.msg == 1 && issue[0]?.nIid) {
          // CREATE: Set up initial permissions for new issue
          await this.issueFga.createIssuePermissions(
            issue[0].nIid,
            body.nUserid,
            body.nCaseid,
            issue[0].nTeamId,
          );
          console.log(`Created permissions for new issue: ${issue[0].nIid}`);
        } else if (permission === 'D' && issue[0]?.msg == 1 && body.nIid) {
          // DELETE: Remove all permissions for deleted issue
          await this.issueFga.deleteAllIssuePermissions(body.nIid);
          console.log(`Deleted all permissions for issue: ${body.nIid}`);
        }
        // UPDATE operations don't need permission management - they only edit content
      } catch (permissionError) {
        // Log permission errors but don't fail the main operation
        console.error(
          `Permission management error for ${permission} operation on issue ${body.nIid || 'new'}:`,
          permissionError,
        );
        // You might want to add this to a retry queue or alert system
      }*/

      return issue;
    } else {
      return { msg: -1, value: 'Failed to handle issue', error: res.error };
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
  ): Promise<any> {
    const parameter = { ...body, cICtype: permission };
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

  async deleteIssueCategory(param: DeleteIssueCategoryParam): Promise<any> {
    const parameter = { ...param, cICtype: 'D' };
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
  ): Promise<any> {
    const parameter =
      permission === 'D'
        ? {
          nIDid: (body as DeleteIssueDetailParam).nIDid,
          cPermission: permission,
        }
        : { ...body, cPermission: permission };
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

  async insertHighlights(
    body: InsertHighlightsRequestBody,
    permission: 'I' | 'D',
  ): Promise<any> {
    const parameter = { ...body, permission: permission };
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

  async removemultihighlights(body: removeMultipleHighlightsReq): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_delete_multiple_rhighlights',
      body,
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

  async deleteHighlights(body: any, permission: 'I' | 'D'): Promise<any> {
    const parameter = { ...body, permission: permission };
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
  ): Promise<any> {
    const res = await this.db.executeRef(
      'realtime_update_default_h_issue',
      body,
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

  async getAnnotHighlightExport(query: getAnnotHighlightEEP): Promise<any> {
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

  async updateIssueDetailNote(param: updateDetailIssueNote): Promise<any> {
    const res = await this.db.executeRef('realtime_issue_detail_note', param);

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

  async deleteIssue(body: deleteIssueRequestBody): Promise<any> {
    const parameter = {
      ...body,
      cPermission: 'SD',
    };
    const res = await this.db.executeRef(
      'realtime_handle_issue_delete',
      parameter,
      this.realTimeSchema,
    );

    if (res.success) {
      // Clean up permissions for the deleted issue
     /* if (body.nIid) {
        try {
          await this.issueFga.deleteAllIssuePermissions(body.nIid);
          console.log(`Cleaned up permissions for deleted issue: ${body.nIid}`);
        } catch (permissionError) {
          console.error(
            `Permission cleanup error for deleted issue ${body.nIid}:`,
            permissionError,
          );
        }
      }*/
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to handle issue', error: res.error };
    }
  }

  async deleteMultiIssue(body: deleteIssueRequestBody): Promise<any> {
    const parameter = {
      ...body,
      cPermission: 'MD',
    };
    const res = await this.db.executeRef(
      'realtime_handle_issue_delete',
      parameter,
      this.realTimeSchema,
    );

    if (res.success) {
     /* // Clean up permissions for all deleted issues
      if (body.jIids && body.jIids.length > 0) {
        try {
          // Delete permissions for each issue in parallel
          const permissionCleanupPromises = body.jIids.map((issueId) =>
            this.issueFga.deleteAllIssuePermissions(issueId),
          );
          await Promise.allSettled(permissionCleanupPromises);
          console.log(
            `Cleaned up permissions for ${body.jIids.length} deleted issues`,
          );
        } catch (permissionError) {
          console.error(
            `Permission cleanup error for multiple deleted issues:`,
            permissionError,
          );
        }
      }*/
      return res.data[0];
    } else {
      return { msg: -1, value: 'Failed to delete issue', error: res.error };
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



  
  async updateClaimDetail(param: UpdateClaimRequestBody): Promise<any> {
    const res = await this.db.executeRef('realtime_handle_update_claim', param,
      this.realTimeSchema);

    if (res.success) {
      return res.data[0][0];
    } else {
      return {
        msg: -1,
        value: 'Failed to update issue category',
        error: res.error,
      };
    }
  }

  async deleteClaim(body: deleteClaimRequestBody): Promise<any> {
    const parameter = {
      ...body,
      cPermission: 'SD',
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
