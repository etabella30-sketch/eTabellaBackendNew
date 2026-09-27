import { DbService } from '@app/global/db/pg/db.service';
import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  workspacefactmdl,
  workspaceIssueContact,
  workspaceTaskFactlinkMdl,
  workspaceViewDeleteMdl,
  workspaceViewListMdl,
  workspaceViewSaveMdl,
} from '../../interfaces/workspace.interface';
import { factPermission, LOOKUP_FAILED, MAX_FACT_IDS } from '../fact/fact-access';
import { taskVisibility } from '../task/task-access';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// import { ContactFgaService } from '../contact-fga/contact-fga.service';

@Injectable()
export class WorkspaceService {


  constructor(private db: DbService
    // , private contactFgaService: ContactFgaService,
  ) {

  }




  async getDataByFunction(query: workspacefactmdl, fn_name: string): Promise<any[]> {
    let res = await this.db.executeRef(fn_name, query);
    if (['workspace_task_list', 'workspace_fact_list', 'workspace_fact_issues', 'workspace_participant_list', 'workspace_participant_factlinks'].includes(fn_name)
      && (!res.success || !Array.isArray(res.data?.[0]))) {
      throw new InternalServerErrorException('Unable to load workspace data');
    }
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

  /**
   * `POST workspace/tasks/factlink`: et_workspace_task_factlink appends FMTasks rows for any task and
   * fact ids it is given. The caller must see the task (created it or is assigned to it, the
   * et_workspace_task_list rule) and be able to edit every fact (et_fact_permissions bCanEdit, the
   * authority et_fact_update has over a fact's task links). All or nothing: 400 for a malformed
   * jFactids, 403 when the task or any fact is refused (a missing fact included, so the New-task
   * dialog does not read it as an old server), 500 when a lookup failed. Nothing is linked unless
   * every check passes.
   */
  async linkTaskFacts(body: workspaceTaskFactlinkMdl): Promise<any[]> {
    const factIds = this.factIdList(body.jFactids);
    if (factIds === null) {
      throw new BadRequestException({ msg: -1, value: 'jFactids must be a JSON array of fact ids' });
    }
    if (factIds.length > MAX_FACT_IDS) {
      throw new BadRequestException({ msg: -1, value: `At most ${MAX_FACT_IDS} facts can be linked at once` });
    }
    const failed = () => new InternalServerErrorException({ msg: -1, value: 'Could not check access to this task' });

    const task = await taskVisibility(this.db, body.nMasterid, body.nTaskid);
    if (task === 'failed') throw failed();
    if (task !== 'visible') {
      throw new ForbiddenException({ msg: -1, value: 'You are not permitted to link facts to this task' });
    }

    const rows = await Promise.all(factIds.map((nFSid) => factPermission(this.db, body.nMasterid, nFSid)));
    if (rows.includes(LOOKUP_FAILED)) throw failed();
    if (rows.some((row) => !row || row === LOOKUP_FAILED || !row.bCanEdit)) {
      throw new ForbiddenException({ msg: -1, value: 'You are not permitted to link this task to one or more of these facts' });
    }

    return this.getDataByFunction({ ...body, jFactids: JSON.stringify(factIds) } as unknown as workspacefactmdl, 'workspace_task_factlink');
  }

  /** Distinct fact ids from a JSON array string, or null when it is not an array of UUIDs. */
  private factIdList(jFactids: string): string[] | null {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jFactids);
    } catch {
      return null;
    }
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'string' || !UUID_RE.test(id))) return null;
    const seen = new Set<string>();
    return (parsed as string[]).filter((id) => {
      const key = id.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
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
