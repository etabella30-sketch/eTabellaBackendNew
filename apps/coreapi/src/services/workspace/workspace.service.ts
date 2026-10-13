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
import { FACT_EXPORT_ACCESS_SQL } from '@app/global/utility/data-export/type-source';
import { WORKSPACE_DOCLINKS_SQL } from './workspace-doclinks.query';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// import { ContactFgaService } from '../contact-fga/contact-fga.service';

@Injectable()
export class WorkspaceService {


  constructor(private db: DbService
    // , private contactFgaService: ContactFgaService,
  ) {

  }




  async getDocLinks(query: workspacefactmdl): Promise<any[]> {
    if (!UUID_RE.test(query.nCaseid ?? '') || !UUID_RE.test(query.nMasterid ?? '')) throw new BadRequestException('Case and caller are required');
    const result = await this.db.rowQuery(WORKSPACE_DOCLINKS_SQL, [query.nCaseid, query.nMasterid]);
    if (!result.success || !Array.isArray(result.data)) throw new InternalServerErrorException('Unable to load Workspace DocLinks');
    return result.data;
  }

  async getDataByFunction(query: workspacefactmdl, fn_name: string): Promise<any[]> {
    let res = await this.db.executeRef(fn_name, query);
    if (['workspace_task_list', 'workspace_fact_list', 'workspace_fact_issues', 'workspace_participant_list', 'workspace_participant_factlinks'].includes(fn_name)
      && (!res.success || !Array.isArray(res.data?.[0]))) {
      throw new InternalServerErrorException('Unable to load workspace data');
    }
    if (res.success) {
      try {
        if (fn_name === 'workspace_fact_issues') {
          const system = await this.db.rowQuery(`SELECT "nIid" FROM "RIssueMaster" WHERE "nUserid" IS NULL AND lower(btrim("cIName"))='unassigned'`, []);
          if (!system.success) throw new InternalServerErrorException('Unable to identify the system Issue');
          const ids = new Set(system.data.map(row => String(row.nIid).toLowerCase()));
          return res.data[0].map(row => ({ ...row, bSystem: ids.has(String(row.nIssueid).toLowerCase()) }));
        }
        if (fn_name === 'workspace_fact_list') {
          const rows = res.data[0];
          const ids = [...new Set<string>(rows.map(row => row.nFSid).filter(id => typeof id === 'string' && UUID_RE.test(id)))];
          let rights: any;
          try { rights = ids.length ? await this.db.rowQuery(FACT_EXPORT_ACCESS_SQL, [ids, query.nCaseid, query.nMasterid]) : null; } catch { /* Copy remains denied; retain the readable list. */ }
          const allowed = new Set<string>(rights?.success && Array.isArray(rights.data) ? rights.data.map(row => String(row.id).toLowerCase()) : []);
          return rows.map(row => ({ ...row, bCanCopy: typeof row.nFSid === 'string' && allowed.has(row.nFSid.toLowerCase()) }));
        }
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
    return res.success ? (res.data?.[0] ?? []).filter(row =>
      (!privateGroupView(row) && !qfactView(row)) || row.bIsOwner === true || String(row.nUserid).toLowerCase() === String(query.nMasterid).toLowerCase())
      .map(row => qfactView(row) ? { ...row, bShared: false } : row) : [];
  }

  /**
   * Create or update a saved view. The SP decides: no `nWVid`, or one the
   * caller doesn't own, becomes a new row — so a reader saving over a shared
   * view gets their own copy instead of overwriting the author's.
   */
  async saveView(body: workspaceViewSaveMdl): Promise<any> {
    if (body.bShared && qfactView(body)) {
      return { msg: -1, value: 'Views using QFACTs are private to their creator' };
    }
    if (body.bShared && privateGroupView(body)) {
      return { msg: -1, value: 'Views using Private Groups are private to their creator' };
    }
    const res = await this.db.executeRef('workspace_view_save', { ...body });
    // The driver's message names functions, columns and can echo the request
    // payload back — log it, never ship it to the browser.
    if (!res.success) {
      console.error('[workspace] saveView failed', res.error);
      return { msg: -1, value: 'Save failed' };
    }
    return res.data?.[0]?.[0] ?? { msg: -1, value: 'Save failed' };
  }

  async privateGroups(body: { nCaseid: string; nMasterid?: string; operation: string; nGroupid?: string; cName?: string }): Promise<any> {
    const result = await this.db.executeRef('workspace_private_groups', body);
    if (!result.success) throw new InternalServerErrorException('Private Groups could not be loaded or saved');
    return result.data?.[0]?.[0] ?? { msg: -1, value: 'Private Groups are unavailable' };
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

/** Stable group references, columns and grouping must never travel in shared view metadata. */
export function privateGroupView(value: unknown): boolean {
  if (typeof value === "string") {
    if (value === "privateGroup") return true;
    try { return privateGroupView(JSON.parse(value)); } catch { return false; }
  }
  if (Array.isArray(value)) return value.some(privateGroupView);
  return !!value && typeof value === "object" && Object.entries(value).some(([key, item]) => key === "privateGroup" || privateGroupView(item));
}

/** Identify explicit QFACT scope from stable metadata, never from the editable name. */
export function qfactView(value: unknown, factScope = true): boolean {
  if (typeof value === 'string') { try { return qfactView(JSON.parse(value), factScope); } catch { return false; } }
  if (Array.isArray(value)) return value.some(item => qfactView(item, factScope));
  if (!value || typeof value !== 'object') return false;
  const entity = String((value as any).cEntity ?? (value as any).entity ?? '').toLowerCase();
  if (entity) factScope = ['fact', 'facts', 'qf', 'qfact', 'qfacts'].includes(entity);
  const qf = (item: unknown) => typeof item === 'string' && ['qf', 'qfact', 'qfacts'].includes(item.toLowerCase());
  const templates = ['qfacts', 'qexpress', 'qissues', 'v-qfacts', 'v-qexpress', 'v-qissues'];
  return Object.entries(value).some(([key, item]) => {
    if (key === 'assigned' && item === false && factScope) return true;
    if (['cEntity', 'entity', 'markingType', 'cFacttype', 'cFType', 'cFtype'].includes(key) && qf(item)) return true;
    if (['base', 'template', 'from', 'id'].includes(key) && typeof item === 'string' && templates.includes(item.toLowerCase())) return true;
    if (key === 'type' && (qf(item) || (Array.isArray(item) && item.length > 0 && item.every(qf)))) return true;
    return qfactView(item, factScope);
  });
}
