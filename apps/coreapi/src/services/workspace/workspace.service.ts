import { DbService } from '@app/global/db/pg/db.service';
import { Injectable } from '@nestjs/common';
import {
  workspacefactmdl,
  workspaceIssueContact,
  workspaceViewDeleteMdl,
  workspaceViewListMdl,
  workspaceViewSaveMdl,
} from '../../interfaces/workspace.interface';
// import { ContactFgaService } from '../contact-fga/contact-fga.service';

@Injectable()
export class WorkspaceService {


  constructor(private db: DbService
    // , private contactFgaService: ContactFgaService,
  ) {

  }




  async getDataByFunction(query: workspacefactmdl, fn_name: string): Promise<any[]> {
    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return []
      }
    } else {
      return []
    }
  }

  async getIssueContactByFunction(query: workspaceIssueContact, fn_name: string): Promise<any[]> {
    //    const contactPermissions =
    //   await this.contactFgaService.getContactPermissionsJson(query.nMasterid);

    // // 2. Extract contact IDs that user can view
    // query['jContactIds'] = contactPermissions
    //   .filter((p) => p.view)
    //   .map((p) => p.contactId);

    let res = await this.db.executeRef(fn_name, query);
    if (res.success) {
      try {
        return res.data[0];
      } catch (error) {
        return [];
      }
    } else {
      return [];
    }
  }


  /* ----------------------------- saved views ----------------------------- */

  /** The caller's saved views for a case, plus any shared by the case team. */
  async listViews(query: workspaceViewListMdl): Promise<any[]> {
    const res = await this.db.executeRef('workspace_view_list', { ...query });
    return res.success ? (res.data?.[0] ?? []) : [];
  }

  /**
   * Create or update a saved view. The SP decides: no `nWVid`, or one the
   * caller doesn't own, becomes a new row — so a reader saving over a shared
   * view gets their own copy instead of overwriting the author's.
   */
  async saveView(body: workspaceViewSaveMdl): Promise<any> {
    const res = await this.db.executeRef('workspace_view_save', { ...body });
    // The driver's message names functions, columns and can echo the request
    // payload back — log it, never ship it to the browser.
    if (!res.success) {
      console.error('[workspace] saveView failed', res.error);
      return { msg: -1, value: 'Save failed' };
    }
    return res.data?.[0]?.[0] ?? { msg: -1, value: 'Save failed' };
  }

  /** Soft delete; the SP answers `msg: -1` when the caller isn't the owner. */
  async deleteView(body: workspaceViewDeleteMdl): Promise<any> {
    const res = await this.db.executeRef('workspace_view_delete', { ...body });
    if (!res.success) {
      console.error('[workspace] deleteView failed', res.error);
      return { msg: -1, value: 'Delete failed' };
    }
    return res.data?.[0]?.[0] ?? { msg: -1, value: 'Delete failed' };
  }

}
