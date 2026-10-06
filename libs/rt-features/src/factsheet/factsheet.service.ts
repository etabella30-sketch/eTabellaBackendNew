/**
 * The live executor of the Full Fact editor, realtime-server's FactsheetService moved here (plan Phase 7a) with the
 * actor taken from the verified Caller (R4) and storage reached through SP_EXECUTOR. Behaviour is the old service's,
 * body for body:
 *  - every read runs the fact visibility rule of @app/permissions first, OUTSIDE its try/catch, so a failed lookup
 *    is the host's 500 and an unknown fact its 404; a caller who may not view the fact gets the reader's normal
 *    EMPTY result (detail: the `msg -1` refusal row) and no reader SP runs, never a 403 (the legacy app redirects
 *    403s to its dashboard);
 *  - a failed reader SP answers `{ msg: -1, value: 'Fetch failed', error }` with 200, never `[]`: the Full Fact
 *    editor took "no participants / tasks / links" for the truth once, and its save (the SP replaces the whole list)
 *    deleted them (reader code review 2026-09-30);
 *  - save checks bCanEdit through the swallowing lookup (a lookup fault answers "not authorized", as before), runs
 *    et_factsheet_submit, and with bIsUserUpdated and bCanReshare replaces the share list (awaited: the fact save
 *    already succeeded, so a failed replacement is logged, never hidden behind "Fact updated"); the share
 *    notifications go out through EVENT_DELIVERY, which the cloud turns into the same Kafka `notification` messages
 *    UtilityService.sendNotification emitted;
 *  - unshare and delete check no permission (their SPs decide) and answer the SP row.
 * The team rule (D3 of the plan, approved 2026-10-06; product rule: nothing crosses teams on a case), as defence in
 * depth behind the SPs:
 *  - `factsheet/shared` keeps only the rows of people on one of the caller's teams on the fact's case (plus the
 *    caller), so a share list never shows another team even if et_factsheet_shared ever did;
 *  - a save that replaces the share list refuses, BEFORE anything is written, a `jUsers` list naming anyone outside
 *    the caller's teams: the refusal row `{ msg: -1, value, error }` (201, like every refusal of the route) so the
 *    editor keeps the selection and shows why; et_fact_insert_team itself checks nothing.
 * Not bound on the box (no database there): the box binds a relay adapter to the same operations port.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Caller, EVENT_DELIVERY, EventDelivery, isDomainError, ROW_QUERY, RowQuery, SP_EXECUTOR, SpExecutor, SpOutcome } from '@app/api-kernel';
import {
  assertSameTeamRecipients,
  callerCanViewFact,
  FACT_NOT_VIEWABLE,
  FACT_PERMISSIONS_SP,
  factCaseOf,
  FactPermissionRow,
  keepSameTeamUsers,
  outsideCallerTeams,
  TEAM_SCOPE_LOOKUP_FAILED,
} from '@app/permissions';

import type { FactsheetQueryFields, FactsheetSaveFields } from './dto/factsheet.dto';
import type { FactsheetFailure, FactsheetOperations } from './factsheet.operations';

/** factsheet/detail's answer to a caller who may not view the fact: the service's normal failure shape, no fact data. */
export const FACTSHEET_NOT_VIEWABLE: FactsheetFailure = Object.freeze({ msg: -1, value: FACT_NOT_VIEWABLE });
export const FACTSHEET_NOT_EDITABLE = 'You are not authorized to edit this fact';
export const FETCH_FAILED = 'Fetch failed';
export const SAVE_FAILED = 'Failed to save';
/** The save refusal for a share list that names someone outside the caller's teams (D3); shown by the editor as is. */
export const CROSS_TEAM_SHARE = 'Share recipients must be on your team';
export const CROSS_TEAM_SHARE_REFUSAL: FactsheetFailure = Object.freeze({ msg: -1, value: CROSS_TEAM_SHARE, error: CROSS_TEAM_SHARE });

/** The SPs, by route, all in the realtime schema. */
export const FACTSHEET_SP = Object.freeze({
  detail: 'factsheet_detail',
  shared: 'factsheet_shared',
  issues: 'factsheet_issues',
  contacts: 'factsheet_contacts',
  tasks: 'factsheet_tasks',
  links: 'factsheet_links',
  annotation: 'getfact_annotation',
  save: 'factsheet_submit',
  share: 'fact_insert_team',
  unshare: 'factsheet_unshare_withme',
  remove: 'factsheet_delete',
});

/** One recipient of a share, as et_fact_insert_team lists them in its `jNotify`. */
interface ShareNotice {
  nUserid?: unknown;
  cType?: unknown;
  [key: string]: unknown;
}

const fetchFailed = (error: unknown): FactsheetFailure => ({ msg: -1, value: FETCH_FAILED, error });
const saveFailed = (error: unknown): FactsheetFailure => ({ msg: -1, value: SAVE_FAILED, error });

/**
 * The SP parameters: the request's own fields with the verified caller as nMasterid, the key the SPs read, and the
 * actor fields a client may have sent dropped. Keys are kept exactly as the request carried them (an absent nFSid
 * stays absent), as the old service passed its DTO through.
 */
export function withActor(caller: Caller, fields: FactsheetQueryFields): Record<string, unknown> {
  const { nMasterid: _ignoredMaster, nUserid: _ignoredUser, ...rest } = fields as Record<string, unknown>;
  return { ...rest, nMasterid: caller.userId };
}

@Injectable()
export class FactsheetService implements FactsheetOperations {
  private readonly logger = new Logger(FactsheetService.name);

  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Inject(ROW_QUERY) private readonly rows: RowQuery,
    @Inject(EVENT_DELIVERY) private readonly events: EventDelivery,
  ) {}

  private canView(caller: Caller, query: FactsheetQueryFields): Promise<boolean> {
    return callerCanViewFact(this.sp, caller.userId, query.nFSid);
  }

  async detail(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return { ...FACTSHEET_NOT_VIEWABLE };
    const outcome = await this.sp.call(FACTSHEET_SP.detail, withActor(caller, query), 'realtime');
    return outcome.ok === false ? fetchFailed(outcome.error) : outcome.cursors[0]?.[0];
  }

  /**
   * The et_fact_permissions row goes only to a caller who may view the fact (it names the owner); anyone else gets
   * factsheet/detail's refusal shape. A failed lookup keeps its own `{ msg: -1, error }` answer, and an unknown fact
   * its empty one; neither names an owner.
   */
  async permissions(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    const row = await this.fetchPermission(caller, query.nFSid);
    if (!row || row.msg === -1 || row.bCanView === true) return row;
    return { ...FACTSHEET_NOT_VIEWABLE };
  }

  /** The swallowing lookup save and permissions use: a fault is a `{ msg: -1, error }` row, never a throw. */
  private async fetchPermission(caller: Caller, nFSid: string | null | undefined): Promise<FactPermissionRow | undefined> {
    const outcome = await this.sp.call<FactPermissionRow>(FACT_PERMISSIONS_SP, { nUserid: caller.userId, nFSid });
    if (outcome.ok === false) return { msg: -1, error: outcome.error };
    return outcome.cursors[0]?.[0];
  }

  async shared(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return [];
    const outcome = await this.sp.call<{ nUserid?: string | null }>(FACTSHEET_SP.shared, withActor(caller, query), 'realtime');
    if (outcome.ok === false) return fetchFailed(outcome.error);
    const rows = outcome.cursors[0];
    if (!Array.isArray(rows)) return rows;
    // The team rule (D3): nobody from another team on the case is listed, whatever the SP answered.
    try {
      const nCaseid = await factCaseOf(this.rows, query.nFSid);
      const outside = await outsideCallerTeams(this.rows, nCaseid, caller.userId, rows.map((row) => row?.nUserid).filter((id): id is string => typeof id === 'string'));
      return keepSameTeamUsers(rows, outside, caller.userId);
    } catch (error) {
      if (!isDomainError(error)) throw error;
      return this.readFailed(FACTSHEET_SP.shared, TEAM_SCOPE_LOOKUP_FAILED);
    }
  }

  async issues(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return [];
    return this.firstCursor(FACTSHEET_SP.issues, withActor(caller, query));
  }

  async contacts(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return [];
    return this.firstCursor(FACTSHEET_SP.contacts, withActor(caller, query));
  }

  async tasks(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    // Empty result = the three empty cursors of et_factsheet_tasks.
    if (!(await this.canView(caller, query))) return [[], [], []];
    const outcome = await this.sp.call(FACTSHEET_SP.tasks, { ...withActor(caller, query), ref: 3 }, 'realtime');
    return outcome.ok === false ? this.readFailed(FACTSHEET_SP.tasks, outcome.error) : outcome.cursors;
  }

  async links(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return [];
    return this.firstCursor(FACTSHEET_SP.links, withActor(caller, query));
  }

  async annotation(caller: Caller, query: FactsheetQueryFields): Promise<unknown> {
    if (!(await this.canView(caller, query))) return [];
    const outcome = await this.sp.call(FACTSHEET_SP.annotation, withActor(caller, query), 'realtime');
    return outcome.ok === false ? fetchFailed(outcome.error) : outcome.cursors[0];
  }

  /** The association reads: the first cursor, or the logged failure shape. */
  private async firstCursor(sp: string, params: Record<string, unknown>): Promise<unknown> {
    const outcome = await this.sp.call(sp, params, 'realtime');
    return outcome.ok === false ? this.readFailed(sp, outcome.error) : outcome.cursors[0];
  }

  private readFailed(sp: string, error: string): FactsheetFailure {
    this.logger.error(`${sp} failed: ${error}`);
    return fetchFailed(error);
  }

  async save(caller: Caller, body: FactsheetSaveFields): Promise<unknown> {
    const permission = await this.fetchPermission(caller, body.nFSid);
    if (!permission?.bCanEdit) return { msg: -1, value: FACTSHEET_NOT_EDITABLE };
    const params = withActor(caller, body);
    const replacingShares = !!body.bIsUserUpdated && !!permission.bCanReshare;
    if (replacingShares) {
      // The team rule (D3), before the fact is written: a refused save changes nothing.
      const refusal = await this.refuseCrossTeamRecipients(caller, body);
      if (refusal) return refusal;
    }
    const outcome = await this.sp.call(FACTSHEET_SP.save, params, 'realtime');
    if (outcome.ok === false) return saveFailed(outcome.error);
    if (replacingShares) await this.replaceShares(caller, params);
    return outcome.cursors[0]?.[0];
  }

  /** The recipient ids a save's jUsers names, other than the caller (the list is JSON text of `[{ nUserid, ... }]`). */
  static shareRecipientsOf(body: Pick<FactsheetSaveFields, 'jUsers'>, callerId: string): string[] {
    let parsed: unknown;
    try {
      parsed = typeof body.jUsers === 'string' ? JSON.parse(body.jUsers) : body.jUsers;
    } catch {
      return [];
    }
    if (!Array.isArray(parsed)) return [];
    const me = callerId.toLowerCase();
    return parsed
      .map((row) => (row && typeof row === 'object' ? (row as { nUserid?: unknown }).nUserid : undefined))
      .filter((id): id is string => typeof id === 'string' && id.toLowerCase() !== me);
  }

  /** The refusal row when the share list names someone outside the caller's teams; the failure row on a lookup fault; null to proceed. */
  private async refuseCrossTeamRecipients(caller: Caller, body: FactsheetSaveFields): Promise<FactsheetFailure | null> {
    const recipients = FactsheetService.shareRecipientsOf(body, caller.userId);
    if (!recipients.length) return null;
    try {
      const nCaseid = await factCaseOf(this.rows, body.nFSid);
      if (!nCaseid) return saveFailed(TEAM_SCOPE_LOOKUP_FAILED);
      await assertSameTeamRecipients(this.rows, nCaseid, caller.userId, recipients);
      return null;
    } catch (error) {
      if (!isDomainError(error)) throw error;
      if (error.code === 'forbidden') {
        this.logger.warn(`[factsheet] share of ${body.nFSid} refused: ${(error.detail as { count?: number } | undefined)?.count ?? '?'} recipient(s) outside the caller's teams`);
        return { ...CROSS_TEAM_SHARE_REFUSAL };
      }
      return saveFailed(TEAM_SCOPE_LOOKUP_FAILED);
    }
  }

  /** The full share replacement (et_fact_insert_team) and its notifications; never throws into the save. */
  private async replaceShares(caller: Caller, params: Record<string, unknown>): Promise<void> {
    let outcome: SpOutcome<{ jNotify?: unknown }>;
    try {
      outcome = await this.sp.call<{ jNotify?: unknown }>(FACTSHEET_SP.share, params, 'realtime');
    } catch (error) {
      this.logger.error(`[factsheet] share replacement crashed for ${params.nFSid}: ${(error as Error)?.message ?? error}`);
      return;
    }
    if (outcome.ok === false) {
      // A failed share replacement must not vanish silently: the fact save already succeeded, so this is the only
      // trace of the miss.
      this.logger.error(`[factsheet] fact_insert_team failed for ${params.nFSid}: ${outcome.error}`);
      return;
    }
    const notices = outcome.cursors[0]?.[0]?.jNotify;
    if (!Array.isArray(notices)) return;
    for (const notice of notices as ShareNotice[]) {
      if (!notice || typeof notice !== 'object') continue;
      try {
        this.events.publish({
          kind: 'notification',
          toUserIds: [String(notice.nUserid)],
          template: String(notice.cType),
          data: { ...notice, nRefuserid: caller.userId },
        });
      } catch (error) {
        this.logger.warn(`[factsheet] share notification not published: ${(error as Error)?.message ?? error}`);
      }
    }
  }

  async unshare(caller: Caller, body: FactsheetQueryFields): Promise<unknown> {
    return this.writeRow(FACTSHEET_SP.unshare, withActor(caller, body));
  }

  async remove(caller: Caller, body: FactsheetQueryFields): Promise<unknown> {
    return this.writeRow(FACTSHEET_SP.remove, withActor(caller, body));
  }

  private async writeRow(sp: string, params: Record<string, unknown>): Promise<unknown> {
    const outcome = await this.sp.call(sp, params, 'realtime');
    return outcome.ok === false ? saveFailed(outcome.error) : outcome.cursors[0]?.[0];
  }
}
