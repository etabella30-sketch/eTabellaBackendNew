
import { Injectable, Logger } from '@nestjs/common';
import { DeleteIssueCategoryParam, DeleteIssueDetailParam, HighlightListParam, InsertHighlightsRequestBody, InsertIssueDetailRequestBody, IssueCategoryRequestBody, IssueListParam, IssueRequestBody, UpdateIssueDetailRequestBody, annotationsReq, catListParam, deleteHighlightsRequestBody, deleteIssueRequestBody, dynamicComboReq, getAnnotHighlightEEP, getIssueAnnotationListBody, getLastIssueMDL, isseDetailByIdBody, issuedetaillist_by_issueidBody, logJoinReq, removeMultipleHighlightsReq, updateDetailIssueNote, updateHighlightIssueIdsReq } from '../../interfaces/issue.interface';
import { SqllitedbService } from '../sqllitedb/sqllitedb.service';
import { QueryService } from '../query/query.services';
import { SyncService } from '../sync/sync.service';
import { ConnectivityService } from '../connectivity/connectivity.service';

import * as moment from 'moment';
import { UuidService } from '../uuid/uuid.service';
// import { ExportService } from '../export/export.service';

@Injectable()
export class IssueService {
  private logger = new Logger('issue-service');
  constructor(private readonly dbLite: SqllitedbService, private readonly queryService: QueryService, private syncService: SyncService, private readonly connectivity: ConnectivityService, private uuid: UuidService
    // private exportService: ExportService
  ) {

  }


  async handleIssueCategory(body: IssueCategoryRequestBody, permission: 'I' | 'U' | 'D'): Promise<any> {
    const currentDate = new Date().toISOString();
    let result; let message;
    try {
      if (permission === 'I') {
        const duplicateCheck = await this.dbLite.get(
          'IssueCategory',
          'cCategory = ? AND nCaseid = ?',
          [body.cCategory, body.nCaseid]
        );

        if (duplicateCheck && duplicateCheck.length > 0) {
          // If a duplicate is found, return a message
          return { msg: -1, message: 'Duplicate category found for the case.' };
        }
        // Insert new record
        const mdl = {
          nCaseid: body.nCaseid,
          cCategory: body.cCategory,
          nUserid: body.nUserid,
          dCreateDt: currentDate,
        };
        result = await this.dbLite.insert('IssueCategory', mdl);
        body.nICid = result;
        message = 'Category created successfully';
      } else if (permission === 'U') {
        const duplicateCheck = await this.dbLite.get(
          'IssueCategory',
          'cCategory = ? AND nCaseid = ? AND nICid != ?',  // Exclude the current id
          [body.cCategory, body.nCaseid, body.nICid]
        );

        if (duplicateCheck && duplicateCheck.length > 0) {
          // If a duplicate is found, return a message
          return [{ msg: -1, message: 'Duplicate category found for the case.' }];
        }

        // Update existing record
        const updateFields = {
          cCategory: body.cCategory,
          dUpdateDt: currentDate,
          isSynced: 0
        };
        const whereClause = 'nICid = ?';  // Use the primary key id
        const whereParams = [body.nICid];
        result = await this.dbLite.update('IssueCategory', updateFields, whereClause, whereParams);
        message = 'Category updated successfully';
      }

      return [{ msg: 1, value: message, nICid: body.nICid }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }
  async deleteIssueCategory(param: DeleteIssueCategoryParam): Promise<any> {
    // Delete record
    const whereClause = 'nICid = ?';
    const whereParams = [param.nICid];
    try {
      await this.dbLite.delete('IssueCategory', whereClause, whereParams);
      return [{ msg: 1, value: 'Deleted success', id: param.nICid }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }
  async getIssueCategory(body: catListParam): Promise<any> {
    const { query } = this.queryService.getIssueCategoryQuery();
    try {
      // Execute the query with the provided parameters for nCaseid and nUserid
      const result = await this.dbLite.getCustomQuery(query, [body.nCaseid, body.nCaseid, body.nUserid]);
      return result;
    } catch (error) {
      console.error('Failed to retrieve issue categories:', error);
      return [{ msg: -1, error: error }];
    }
  }

  async handleIssue(body: IssueRequestBody, cPermission: 'I' | 'U' | 'D'): Promise<any> {

    const { nIid, cIName, cColor, nICid, nUserid, nCaseid } = body;
    let inserted_id = null;
    let msg = 1;
    let msg_text = '';

    try {

      if (cPermission === 'I') {
        // Check if the issue name already exists
        const duplicateCheck = await this.dbLite.get(
          'RIssueMaster',
          'cIName = ? AND nCaseid = ? AND nUserid = ?',
          [cIName, nCaseid, nUserid]
        );

        if (duplicateCheck.length > 0) {
          msg = -1;
          msg_text = 'Issue name already exists';
        } else {
          // Insert new issue
          const mdl = {
            cIName: cIName,
            cColor: cColor,
            nICid: nICid,
            dCreatedt: new Date().toISOString(),
            nUserid: nUserid,
            nCaseid: nCaseid
          };
          inserted_id = await this.dbLite.insert('RIssueMaster', mdl);
          msg_text = 'Issue created successfully';
        }
      } else if (cPermission === 'U') {
        // Check if the issue name exists excluding the current id
        const duplicateCheck = await this.dbLite.get(
          'RIssueMaster',
          'cIName = ? AND nCaseid = ? AND nUserid = ? AND nIid != ?',
          [cIName, nCaseid, nUserid, nIid]
        );

        if (duplicateCheck.length > 0) {
          msg = -1;
          msg_text = 'Issue name already exists';
        } else {
          // Update the existing issue using nIid
          const updateFields = {
            cColor: cColor,
            nICid: nICid,
            dUpdatedt: new Date().toISOString(),
            cIName: cIName,
            nCaseid: nCaseid,
            isSynced: 0
          };
          await this.dbLite.update('RIssueMaster', updateFields, 'nIid = ?', [nIid]);
          inserted_id = nIid;
          msg_text = 'Issue updated successfully';
        }
      } else {
        msg = -1;
        msg_text = 'Invalid permission';
      }

      return [{ msg, message: msg_text, inserted_id }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }
  async getIssueList(body: IssueListParam): Promise<any> {
    try {

      // Main query to get the issue list
      const { query } = this.queryService.getIssueListQuery()

      const result = await this.dbLite.getCustomQuery(query, [body.nSessionid, body.nSessionid, body.nUserid, body.nCaseid, body.nUserid, body.nCaseid]);
      return result;
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }





  async deleteIssue(body: deleteIssueRequestBody): Promise<any> {
    let nIid = body.nIid;
    let msg = 1;
    let msg_text = '';
    try {

      const issue = await this.dbLite.get('RIssueMaster', 'nIid = ? and nUserid > 0', [nIid]);
      if (issue.length === 0) {
        msg = -1;
        msg_text = 'Issue not found for delete';
      } else {
        // Delete the issue
        await this.dbLite.delete('RIssueMaster', 'nIid = ?', [nIid]);
        msg_text = 'Issue deleted successfully';
      }


      this.removeIssueRelations(nIid)
      return [{ msg, message: msg_text }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }




  async insertIssueDetail(body: InsertIssueDetailRequestBody): Promise<any> {
    let { cNote, cONote, nSessionid, nCaseid, cPageno, jCordinates, nUserid, nLID, cIidStr, cTranscript, cUNote } = body;
    let inserted_id = null;
    let msg = 1;
    let msg_text = '';
    try {
      let cord = JSON.stringify(jCordinates);

      // Insert new record into RIssueDetail
      const mdl = {
        cNote: cNote,
        cUNote: cUNote,
        cONote: cONote,
        nSessionid: nSessionid,
        nCaseid: nCaseid,
        cPageno: cTranscript === 'N' ? cPageno : null,
        jCordinates: cTranscript === 'N' ? cord : null,
        nUserid: nUserid,
        dCreatedt: new Date().toISOString(),
        nLID: nLID,
        jTCordinates: cTranscript === 'Y' ? jCordinates : null,
        cTPageno: cTranscript === 'Y' ? cPageno : null
      };

      inserted_id = await this.dbLite.insert('RIssueDetail', mdl);

      // Insert related issue data into RIssueMapid

      for (const item of cIidStr) {
        const mapModel = {
          nIDid: inserted_id,
          nIid: item.nIid,
          nRelid: item.nRelid,
          nImpactid: item.nImpactid,
          serialno: item.serialno
        };

        await this.dbLite.insert('RIssueMapid', mapModel);
      }
      msg_text = 'Annotation created.';


      // Fetch color from RIssueMaster if needed (if nLID exists)
      let cColor = null;
      if (nLID) {
        const issueMaster = await this.dbLite.get('RIssueMaster', 'nIid = ?', [nLID]);
        if (issueMaster.length > 0) {
          cColor = issueMaster[0].cColor;
        }
      }

      // if (this.connectivity.online) {
      //   await this.syncService.InitDataTransfer();
      //   await this.sendAnnotToLive({nIDid:inserted_id}, nUserid, 'ID');
      // }



      return [{ msg, message: msg_text, nIDid: inserted_id, cColor }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }




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
  }

  async deleteIssueDetail(param: DeleteIssueDetailParam): Promise<any> {
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
  }
  async getIssueDetailby_issue_id(body: issuedetaillist_by_issueidBody): Promise<any> {
    let ref1Result, ref2Result;

    // Query 1: Fetch Issue Details (ref1 equivalent)
    try {
      // Get the query string for Issue Detail
      const { query: issueDetailQuery } = this.queryService.getIssueDetailQuery();

      // Execute the query with parameters
      ref1Result = await this.dbLite.getCustomQuery(issueDetailQuery, [body.nCaseid, body.nSessionid, body.nUserid, body.nIid]);
    } catch (error) {
      console.log(error)
      ref1Result = [];
    }

    // Query 2: Fetch Highlights and Group Information (ref2 equivalent)
    try {
      // Get the query string for Highlight Group
      const { query: highlightGroupQuery } = this.queryService.getHightlightGroupQuery();

      // Execute the query with parameters
      ref2Result = await this.dbLite.getCustomQuery(highlightGroupQuery, [body.nSessionid, body.nUserid, body.nIid]);
      ref2Result.map(a => a.highlights = JSON.parse(a.highlights || '[]'))
    } catch (error) {
      console.log(error)
      ref2Result = [];
    }

    // Return both ref1 and ref2 results
    return [ref1Result, ref2Result];
  }

  async getIssueDetailById(body: isseDetailByIdBody): Promise<any> {
    const nIDid = body.nIDid;

    const { query } = this.queryService.getIssueDetailByIdQuery()

    try {
      // Execute the query to fetch the issue details by nIDid
      const result = await this.dbLite.getCustomQuery(query, [nIDid]);
      try {
        if (result?.length > 0) {
          result.map(a => a.jCordinates = JSON.parse(a.jCordinates || '[]'))
          result.map(a => a.cIid = JSON.parse(a.cIid || '[]'))
          result.map(a => a.jOCordinates = JSON.parse(a.jOCordinates || '[]'))
          result.map(a => a.jTCordinates = JSON.parse(a.jTCordinates || '[]'))
        }
      } catch (error) {

      }
      return result;
    } catch (error) {
      console.error('Failed to fetch issue details by ID:', error);
      return [{ msg: -1, error: error }];
    }
  }

  async insertHighlights(body: InsertHighlightsRequestBody): Promise<any> {
    debugger;
    const { nCaseid, cNote, jCordinates, nSessionid, nUserid, cPageno, cLineno, cTime, cTranscript, nLID, cIidStr, oP, oL, identity } = body;
    let inserted_id = null;
    let msg = 1;
    let msg_text = '';
    let nSessionIdResult, pageData;
    let isIssueNotFound = false;
    try {
      let cord = JSON.stringify(jCordinates)
      // Insert a new highlight into RHighlights
      const mdl = {
        cNote: cNote,
        jCordinates: cord,
        nCaseid: nCaseid,
        nSessionId: nSessionid,
        nUserid: nUserid,
        dCreatedt: new Date().toISOString(),
        cPageno: cTranscript === 'N' ? cPageno : null,
        cLineno: cTranscript === 'N' ? cLineno : null,
        cTime: cTranscript === 'N' ? cTime : null,
        nLID: nLID,
        cTPageno: cTranscript === 'Y' ? cPageno : null,
        cTLineno: cTranscript === 'Y' ? cLineno : null,
        cTTime: cTranscript === 'Y' ? cTime : null,
        oP: oP || 0,
        oL: oL || 0,
        identity
      };

      let color = null;
      try {
        let issue = await this.dbLite.get('RIssueMaster', 'nIid = ?', [nLID]);
        if (!issue?.length) {
          issue = await this.dbLite.get('RIssueMaster', 'nCaseid = ? and nUserid = ?', [nCaseid, 0]);
          if (issue?.length) {
            isIssueNotFound = true;
            mdl.nLID = issue[0].nIid;
            color = issue[0].cColor;



          }




        } else {
          color = issue[0].cColor;
        }

      } catch (error) {
        this.logger.error(`Error fetching issue color: ${error}`);
      }


      if (!mdl.nLID) {
        return [{ msg: -1, message: 'Issue not found' }];
      }
      try {

        inserted_id = await this.dbLite.insert('RHighlights', mdl);

        if (!inserted_id) {
          this.logger.error(`Highlight insertion failed, no ID returned for page : ${cPageno}, Line : ${cLineno}`);
          return [{ msg: -1, message: 'Highlight insertion failed, no ID returned' }];
        }
      } catch (error) {
        return [{ msg: -1, error: error }];
      }

      // Insert related issue data into RHighlightMapid
      //const nIidData = JSON.parse(cIidStr);


      const existsIssues = await this.dbLite.getCustomQuery(`select * from RIssueMaster where nIid in (${cIidStr.map(a => `'${a.nIid}'`).join(',')})`, []);


      // console.log(cIidStr)
      const idsToSave = cIidStr.filter(a => existsIssues.find(b => b.nIid == a.nIid)) //.map(a => a.nIid);




      if (idsToSave.findIndex(a => a.nIid === nLID) === -1) {
        idsToSave.push({ nIid: mdl.nLID, serialno: mdl["serialno"] });
      }

      // console.log(idsToSave)

      if (!idsToSave?.length) {
        this.logger.error(`No valid issues found for highlight insertion, page : ${cPageno}, Line : ${cLineno}`);
        try {
          await this.dbLite.delete('RHighlights', 'nHid = ?', [inserted_id]);
        } catch (error) {

        }
        return [{ msg: -1, message: 'No valid issues found for highlight insertion' }];
      }

      try {
        if (isIssueNotFound) {
          // const updateSessionDetailQuery = `
          //   UPDATE RSessionDetail
          //   SET cDefHIssues = ?, nLID = ?
          //   WHERE nSesid = ? AND nUserid = ?
          // `;
          // await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(idsToSave), mdl.nLID, nSessionid, nUserid]);

          await this.updateSessionDetail(nSessionid, nUserid, 'H', idsToSave, mdl.nLID);

        }
      } catch (error) {

      }


      for (const item of idsToSave) {
        const mapModel = {
          nHid: inserted_id,
          nIid: item.nIid,
          serialno: item.serialno
        };

        try {

          const id = await this.dbLite.insert('RHighlightMapid', mapModel);
          if (!id) {
            this.logger.error(`Highlight mapping insertion failed, no MAP ID returned for page : ${cPageno}, Line : ${cLineno}`);
            await this.dbLite.delete('RHighlights', 'nHid = ?', [inserted_id]);
            return [{ msg: -1, message: 'Highlight mapping insertion failed, no MAP ID returned' }];
          }
        } catch (error) {

        }
      }

      msg_text = 'Quick mark created';
      const { query } = this.queryService.getPageDataQuery(cTranscript)
      pageData = await this.dbLite.getCustomQuery(query, [nSessionid, nUserid, cPageno]);

      try {
        pageData = JSON.parse(pageData[0].pageData || '[]');
      } catch (error) {

      }


      // if (this.connectivity.online) {
      //   await this.syncService.InitDataTransfer();
      //   await this.sendAnnotToLive(inserted_id, nUserid, 'H');
      // }

      return [{ msg: 1, message: msg_text, nHid: inserted_id, nhid: inserted_id, color: color, nsessionid: nSessionid, isIssueNotFound: isIssueNotFound, nLID: mdl.nLID, saveIds: idsToSave, pageData }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }




  async removemultihighlights(body: removeMultipleHighlightsReq): Promise<any> {
    debugger;
    const jHids = body.jHids; // Assuming jHids is an array of `nHid` values
    try {
      // Ensure that jHids is an array and contains values
      if (!Array.isArray(jHids) || jHids.length === 0) {
        return [{ msg: -1, message: 'No HIDs provided' }];
      }

      // Convert the array of HIDs into a string for the IN clause
      const hidsString = jHids.map(a => a = `'${a}'`).join(',');


      try {
        // Delete from RHighlights where nHid is in the provided list
        const deleteHighlightsMapQuery = `
        DELETE FROM RHighlightMapid
        WHERE nHid IN (${hidsString})
      `;
        await this.dbLite.getCustomQuery(deleteHighlightsMapQuery, []);
      } catch (error) {

      }

      // Delete from RHighlights where nHid is in the provided list
      const deleteHighlightsQuery = `
      DELETE FROM RHighlights
      WHERE nHid IN (${hidsString})
    `;
      await this.dbLite.getCustomQuery(deleteHighlightsQuery, []);

      return [{ msg: 1, message: 'Deleted' }];
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }

  async updateHighlightIssueIds(body: updateHighlightIssueIdsReq): Promise<any> {
    // console.log('updateHighlightIssueIds', body)
    const nSessionid = body.nSessionid;
    const nUserid = body.nUserid;
    const cDefHIssues = body.cDefHIssues;
    const nLID = body.nLID;
    const jHids = body.jHids; // Array of nHids

    try {
      if (jHids && jHids.length > 0) {
        // Step 1: Delete existing records in RHighlightMapid for the given nHids
        const deleteQuery = `
          DELETE FROM RHighlightMapid
          WHERE nHid IN (${jHids.map(() => '?').join(', ')})
        `;
        await this.dbLite.getCustomQuery(deleteQuery, jHids);

        // Step 2: Insert new records into RHighlightMapid
        for (const nHid of jHids) {
          for (const issue of cDefHIssues) {
            const uuid = this.uuid.generateUUID();
            const insertQuery = `
              INSERT INTO RHighlightMapid (nMapid ,nHid, nIid,serialno)
              VALUES (?, ?, ?, ?)
            `;
            await this.dbLite.getCustomQuery(insertQuery, [uuid, nHid, issue.nIid, (issue.serialno || 0)]);
          }
        }

        // Step 3: Update RHighlights with the new nLID for the given nHids
        const updateHighlightsQuery = `
          UPDATE RHighlights
          SET nLID = ? , isSynced = 0
          WHERE nHid IN (${jHids.map(() => '?').join(', ')})
        `;
        await this.dbLite.getCustomQuery(updateHighlightsQuery, [nLID, ...jHids]);

      } else {

        // console.log('Step 4: Update RSessionDetail if there are no jHids')
        // const updateSessionDetailQuery = `
        //     UPDATE RSessionDetail
        //     SET cDefHIssues = ?, nLID = ?
        //     WHERE nSesid = ? AND nUserid = ?
        //   `;
        // await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(cDefHIssues), nLID, nSessionid, nUserid]);
        await this.updateSessionDetail(nSessionid, nUserid, 'H', cDefHIssues, nLID);
      }

      // Return success message
      return [{ msg: 1, message: 'Highlight Issues Updated' }];
    } catch (error) {
      console.error('Failed to update default highlight issues:', error);
      return [{ msg: -1, error: error }];
    }
  }

  async deleteHighlights(body: any): Promise<any> {
    let nSessionIdResult, pageData;
    try {
      const highlight = await this.dbLite.get('RHighlights', 'nHid = ?', [body.nHid]);
      if (highlight.length > 0) {
        nSessionIdResult = highlight[0].nSessionId;
        // Delete the highlight from RHighlights

        try {

          const { query } = this.queryService.getPageDataQuery(body.cTranscript)
          pageData = await this.dbLite.getCustomQuery(query, [highlight[0].nSessionId, highlight[0].nUserid, highlight[0].cPageno]);
          pageData = JSON.parse(pageData[0].pageData || '[]');

        } catch (error) {

        }

        await this.dbLite.delete('RHighlights', 'nHid = ?', [body.nHid]);
        return [{ msg: 1, message: "Deleted", inserted_id: 0, nHid: body.nHid, nSessionId: nSessionIdResult, pageData: pageData || [] }];
      } else {
        let msg_text = 'Highlight not found';
        return [{ msg: -1, message: msg_text, inserted_id: 0, nSessionId: nSessionIdResult, pageData: [] }];
      }
    } catch (error) {
      return [{ msg: -1, error: error }];
    }
  }

  async GetHighlightLists(body: HighlightListParam): Promise<any> {
    try {
      // Query to fetch highlights based on the provided parameters
      const { query } = this.queryService.getHighlightListQuery();

      // Execute the query with the parameters
      const result = await this.dbLite.getCustomQuery(query, [body.nCaseid, body.nUserid, body.nSessionid]);
      return result;
    } catch (error) {
      return [{ msg: -1, error: error }];
    }

  }




  async FilterLastSelecedIssued(body: getLastIssueMDL): Promise<any> {

    const jIids = body.jIids; // Expecting jIids to be an array of objects in JSON format.
    // console.log('FilterLastSelecedIssued = ', jIids)

    try {
      // Ensure the parameter is a valid JSON array
      //if (Array.isArray(jIids)) {
      const { query } = this.queryService.geFilterLastSelecedQuery()

      // Execute the query using the SQLite connection
      const result = await this.dbLite.getCustomQuery(query, [jIids]);

      return result;
      // } else {
      //   throw new Error('Invalid input: jIids must be an array');
      // }
    } catch (error) {
      console.error('Error filtering last issue:', error);
      return [{ msg: -1, error: error }];
    }
  }

  async getIssueAnnotationList(body: getIssueAnnotationListBody): Promise<any> {
    const { query } = this.queryService.getIssueAnnotationListQuery()

    try {
      // Fetch the data based on the input parameters
      const result = await this.dbLite.getCustomQuery(query, [body.nCaseid, body.nSessionid, body.nUserid]);
      return result;
    } catch (error) {
      console.error('Failed to fetch issue annotation list:', error);
      return [{ msg: -1, error: error }];
    }

  }

  /*
    async getAnnotHighlightExport(query: getAnnotHighlightEEP): Promise<any> {
      const { nSessionid, nCaseid, nUserid, cTranscript = 'N', jIssues = [], jPages = [] } = query;
  
      const issuesJson = JSON.stringify(jIssues);
      const pagesJson = JSON.stringify(jPages);
  
      // First query: Issue summary details
      const { query: ref1Query } = this.queryService.getAnnotHighlightExport_RID_Query();
  
      const ref1Params = [
        cTranscript,
        cTranscript,
        nCaseid,
        nSessionid,
        nUserid,
        issuesJson,
        issuesJson,
        pagesJson,
        pagesJson,
      ];
  
      const ref1 = await this.dbLite.getCustomQuery(ref1Query, ref1Params);
  
      try {
        ref1.map(a => a.cordinates = (a.cordinates ? JSON.parse(a.cordinates) : []));
      } catch (error) {
  
      }
      // Second query: Highlights and issue groups
      const { query: ref2Query } = this.queryService.getAnnotHighlightExport_RH_Query();
  
      const ref2Params = [
        cTranscript,
        cTranscript,
        nSessionid,
        nUserid,
        nCaseid,
        nUserid,
        nSessionid,
        issuesJson,
        issuesJson,
        pagesJson,
        pagesJson,
      ];
  
      const ref2 = await this.dbLite.getCustomQuery(ref2Query, ref2Params);
  
      const data = await this.exportService.exportFile(query, [ref1, ref2]);
      return data;
  
      // return { ref1, ref2 };
    }*/


  async getcCodeMaster(body: dynamicComboReq): Promise<any> {
    const nCategoryid = body.nCategoryid;

    const { query } = this.queryService.getCodeMasterQuery()

    try {
      // Execute the query to fetch codemaster values by category ID
      const result = await this.dbLite.getCustomQuery(query, [nCategoryid]);
      return result;
    } catch (error) {
      console.error('Failed to fetch codemaster combo list:', error);
      return [{ msg: -1, error: error }];
    }
  }

  async deleteDemoIssueDetails(param: any): Promise<any> {
    return {}
  }


  async etRealtimeGetIssueAnnotationHighlight(parameter: getIssueAnnotationListBody): Promise<any> {
    const nSessionid = parameter.nSessionid;
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

    return { ref1, ref2 };
  }


  async getIssueDetail(body: annotationsReq): Promise<any> {
    try {

      // const nSessionid = body.nSessionid;
      // const nCaseid = body.nCaseid;
      // const nUserid = body.nUserid;
      // const cTranscript = body.cTranscript || 'N';


      // const { query: ref1Query } = this.queryService.getAnnotOfPagesIssueSummaryQuery()

      // const ref1Params = [cTranscript, cTranscript, nCaseid, nSessionid, nUserid];
      // const results = await this.dbLite.getCustomQuery(ref1Query, ref1Params);
      // results.map(a => a.cordinates = JSON.parse(a.cordinates || '[]'))
      // return results




      const nSessionid = body.nSessionid;
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

    } catch (error) {
      console.error('Failed to fetch issue details:', error);
      return []
    }
  }



  async sendAnnotToLive(data, nUserid, flag) {
    /*try {
      if (flag == 'ID') {
        const list = await this.dbLite.get('RIssueDetail', 'nIDid = ? and nRefIDid > ?', [data.nIDid, 0]);
        if (list?.length) {
          if (this.connectivity.socket?.connected) {
            this.connectivity.socket.emit('issue-annot-added', { nIDid: list[0]["nRefIDid"], nUserid });
          }
        }
      }else if(flag == 'H'){

      }
    } catch (error) {
      console.log(error);
    }*/

  }



  async removeIssueRelations(nIid) {
    try {
      // Delete from RIssueMapid where nIDid is in the provided list
      const deleteIssueMapidQuery = `
      DELETE FROM RIssueMapid
      WHERE nIid = ?
    `;
      await this.dbLite.getCustomQuery(deleteIssueMapidQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }


    try {
      const UpdateIssueDetailQuery =
        //   `UPDATE RIssueDetail
        // SET nLID = COALESCE((SELECT MAX(m.nIid) FROM RIssueMapid m WHERE m.nIDid = RIssueDetail.nIDid), 0) ,isSynced  = 0
        // WHERE nLID = ?`;
        `UPDATE RIssueDetail
                SET nLID = COALESCE(
                        (SELECT m.nIid 
                         FROM RIssueMapid m 
                         WHERE m.nIDid = RIssueDetail.nIDid 
                         ORDER BY m.serialno ASC 
                         LIMIT 1), 0),
                    isSynced = 0
                WHERE nLID = ?;`
      await this.dbLite.getCustomQuery(UpdateIssueDetailQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }


    try {
      const deleteIssueDetailQuery = `DELETE FROM RIssueDetail WHERE nLID = ?`;
      await this.dbLite.getCustomQuery(deleteIssueDetailQuery, [0]);
    } catch (error) {
      console.log(error);
    }


    try {
      // Delete from RIssueMapid where nIDid is in the provided list
      const deleteHighightMapidQuery =
        `DELETE FROM RHighlightMapid
        WHERE nIid = ?
      `;
      await this.dbLite.getCustomQuery(deleteHighightMapidQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }

    try {
      const UpdateHighlightsDetailQuery =
        // `UPDATE RHighlights
        // SET nLID = COALESCE((SELECT MAX(m.nIid) FROM RHighlightMapid m WHERE m.nHid = RHighlights.nHid), 0),isSynced  = 0 
        // WHERE nLID = ?`;
        `UPDATE RHighlights
                      SET nLID = COALESCE(
                              (SELECT m.nIid 
                               FROM RHighlightMapid m 
                               WHERE m.nHid = RHighlights.nHid 
                               ORDER BY m.serialno ASC 
                               LIMIT 1), 0),
                          isSynced = 0
                      WHERE nLID = ?;`
      await this.dbLite.getCustomQuery(UpdateHighlightsDetailQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }

    try {
      const deleteHighlightDetailQuery = `DELETE FROM RHighlights WHERE nLID = ?`;
      await this.dbLite.getCustomQuery(deleteHighlightDetailQuery, [0]);
    } catch (error) {
      console.log(error);
    }




    try {
      const deleteHighlightDetailQuery = `UPDATE RSessionDetail SET nLID = null WHERE nLID = ?`;
      await this.dbLite.getCustomQuery(deleteHighlightDetailQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }


    try {
      const deleteHighlightDetailQuery = `UPDATE RSessionDetail SET nLIid = null WHERE nLIid = ?`;
      await this.dbLite.getCustomQuery(deleteHighlightDetailQuery, [nIid]);
    } catch (error) {
      console.log(error);
    }




  }

  async updateSessionDetail(nSesid: string, nUserid: string, flag: 'I' | 'H', jDefault: any, nLID: any): Promise<any> {

    try {
      const result = await this.dbLite.get('RSessionDetail', 'nSesid = ? and nUserid = ?', [nSesid, nUserid]);
      let nSDid = 0;
      if (result.length > 0) {
        nSDid = result[0]["nSDid"];
      } else {
        nSDid = await this.dbLite.insert('RSessionDetail', { nSesid, nUserid });
      }


      if (flag == 'I') {
        const updateSessionDetailQuery = `
          UPDATE RSessionDetail
          SET cDefIssues = ?, nLIid = ?
          WHERE nSesid = ? AND nUserid = ?
        `;
        await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(jDefault), nLID, nSesid, nUserid]);
      } else if (flag == 'H') {
        const updateSessionDetailQuery = `
          UPDATE RSessionDetail
          SET cDefHIssues = ?, nLID = ?
          WHERE nSesid = ? AND nUserid = ?
        `;
        await this.dbLite.getCustomQuery(updateSessionDetailQuery, [JSON.stringify(jDefault), nLID, nSesid, nUserid]);
      }

      return { msg: 1 };
    } catch (error) {
      console.error('Failed to fetch session detail by user:', error);
      return { msg: -1, error: error };
    }

  }



  async joiningLog(body: logJoinReq): Promise<any> {
    try {
      const formattedDate = moment().format('YYYY-MM-DD HH:mm:ss');
      body["dCreateDt"] = formattedDate;
      if (body.cStatus == 'LG') {
        await this.dbLite.insert('RTLogs', body);
        return;
      }

      let nRTLid = 0;
      if (body.cStatus == 'L') {
        const r1 = await this.dbLite.getCustomQuery(`select nRTLid from RTLogs where nSesid = ? and nUserid = ? and cStatus = ? and dLeaveDt is null order by nRTLid desc limit 1`, [body.nSesid, body.nUserid, 'J'])
        if (r1?.length) {
          nRTLid = r1[0]["nRTLid"];
        }
      }

      if (body.cStatus == 'L') {
        // await this.dbLite.update('RTLogs', { dLeaveDt: new Date() }, 'nRTLid = ?', [nRTLid]);
        if (nRTLid > 0) {
          await this.dbLite.getCustomQuery(`update RTLogs set dLeaveDt = ?  where nRTLid = ?`, [formattedDate, nRTLid])
          await this.dbLite.update('RTLogs', { isSynced: 0 }, 'nRTLid = ?', [nRTLid]);
        }
      } else {


        try {
          await this.dbLite.getCustomQuery(`update RTLogs set dLeaveDt = ? where nSesid = ? and nUserid = ? and dLeaveDt is null`, [formattedDate, body.nSesid, body.nUserid]);

        } catch (error) {

        }

        const r2 = await this.dbLite.getCustomQuery(`SELECT nRTLid FROM RTLogs WHERE nSesid = ?   AND nUserid = ?   AND cStatus = ?   AND dLeaveDt IS NOT NULL   AND 6 > (strftime('%s', ?) - strftime('%s', dLeaveDt)) ORDER BY nRTLid DESC LIMIT 1`, [body.nSesid, body.nUserid, 'J', formattedDate])
        if (r2?.length) {
          nRTLid = r2[0]["nRTLid"];
        }
        if (nRTLid > 0) {
          await this.dbLite.update('RTLogs', { dLeaveDt: null, isSynced: 0 }, 'nRTLid = ?', [nRTLid]);
        } else {
          await this.dbLite.insert('RTLogs', body);
        }
      }



    } catch (error) {
      console.log(error)
    }
  }


  async isFeedExistForSession(nSesid: string): Promise<boolean> {
    try {
      const data = await this.dbLite.getCustomQuery(`select id from feed where nSesid = ? limit 1`, [nSesid]);
      return data?.length ? true : false
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  async updateIssueDetailNote(param: updateDetailIssueNote): Promise<any> {
    try {
      const res = await this.dbLite.getCustomQuery('update RIssueDetail set cNote = ? , isSynced = 0 where nIDid = ?', [param.cNote, param.nIDid]);

      return { msg: 1 };
    } catch (error) {
      return { msg: -1 }
    }

  }



  async getIssueVersions(body: isseDetailByIdBody): Promise<any> {
    const nIDid = body.nIDid;

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
    }
  }
}