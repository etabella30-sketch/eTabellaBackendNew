/**
 * The live executor of the issue and claim routes the box relays, the one implementation realtime-server now serves
 * (plan Phase 9): the same SPs, schemas and parameter shapes IssueService built (2026-10-06), with the actor from the
 * verified Caller (R4): `nUserid` where the SP reads the actor there, `nMasterid` where it reads it there, never a
 * value from the request. The list applies the team rule as defence in depth behind the SP's own team filter (D3,
 * the 2026-10-06 claim-list migrations): an issue whose creator is outside the caller's teams on the case never
 * leaves; the Unassigned seed issue (no creator) and the claims cursor (no creator column) pass as the SP answers
 * them. A failed team lookup is the list's failure row, never an unfiltered list. Not bound on the box.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, isDomainError, ROW_QUERY, RowQuery, SP_EXECUTOR, SpExecutor, SpOutcome } from '@app/api-kernel';
import { keepSameTeamUsers, outsideCallerTeams, TEAM_SCOPE_LOOKUP_FAILED } from '@app/permissions';

import type {
  ClaimUpdateFields,
  IssueCategoryFields,
  IssueDeleteFields,
  IssueFields,
  IssueListFields,
  QFactClaimSequenceFields,
  QFactSequenceFields,
} from './dto/issues.dto';
import type { IssuesOperations } from './issues.operations';

export const ISSUES_SP = Object.freeze({
  list: 'realtime_issuelist_group',
  issue: 'realtime_handle_issue_master',
  remove: 'realtime_handle_issue_delete',
  category: 'realtime_handle_issue_category',
  qfactSequence: 'realtime_handle_qfact_secquence',
  qfactClaimSequence: 'realtime_handle_qfact_claim_secquence',
  updateClaim: 'realtime_handle_update_claim',
});

export const ISSUES_FAILED = Object.freeze({
  list: 'Failed to fetch issue list',
  issue: 'Failed to handle issue',
  remove: 'Failed to handle issue',
  removeMany: 'Failed to delete issue',
  category: 'Failed to handle issue category',
  qfactSequence: 'Failed to update qfact sequence',
  qfactClaimSequence: 'Failed to update qfact claim sequence',
  updateClaim: 'Failed to update issue category',
});

/**
 * The request's fields with the caller as the actor under BOTH identity keys (R4): each SP reads one of them (nUserid
 * for the issue master, the category and the sequences; nMasterid for the deletes), and a client value under the
 * other must never reach it either.
 */
export function withActor(caller: Caller, body: object): Record<string, unknown> {
  return { ...body, nUserid: caller.userId, nMasterid: caller.userId };
}

/** The hosts' failure row. */
export const issuesFailure = (value: string, error: unknown): { msg: -1; value: string; error: unknown } => ({ msg: -1, value, error });

/** An issue row of the list's second cursor, as far as the team rule reads it. */
interface IssueRow {
  readonly nUserid?: string | null;
}

@Injectable()
export class IssuesService implements IssuesOperations {
  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Inject(ROW_QUERY) private readonly rows: RowQuery,
  ) {}

  async list(caller: Caller, query: IssueListFields): Promise<unknown> {
    const outcome = await this.sp.call(ISSUES_SP.list, { ...query, nUserid: caller.userId, nMasterid: caller.userId, ref: 2 });
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) return issuesFailure(ISSUES_FAILED.list, outcome.error);
    const cursors = outcome.cursors;
    const issues = (cursors[1] ?? []) as readonly IssueRow[];
    const creators = issues.map((row) => row?.nUserid).filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (!creators.length) return cursors;
    try {
      const outside = await outsideCallerTeams(this.rows, typeof query.nCaseid === 'string' ? query.nCaseid : null, caller.userId, creators);
      if (!outside.size) return cursors;
      // keepSameTeamUsers drops a row without an id; the seed issue has none and stays, so it is filtered apart.
      const kept = issues.filter((row) => !row?.nUserid || keepSameTeamUsers([row], outside, caller.userId).length > 0);
      return [cursors[0] ?? [], kept, ...cursors.slice(2)];
    } catch (error) {
      if (!isDomainError(error)) throw error;
      return issuesFailure(ISSUES_FAILED.list, TEAM_SCOPE_LOOKUP_FAILED);
    }
  }

  insert(caller: Caller, body: IssueFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.issue, { ...withActor(caller, body), cPermission: 'I' }, ISSUES_FAILED.issue);
  }

  update(caller: Caller, body: IssueFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.issue, { ...withActor(caller, body), cPermission: 'U' }, ISSUES_FAILED.issue);
  }

  remove(caller: Caller, body: IssueDeleteFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.remove, { ...withActor(caller, body), cPermission: 'SD' }, ISSUES_FAILED.remove, 'realtime');
  }

  removeMany(caller: Caller, body: IssueDeleteFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.remove, { ...withActor(caller, body), cPermission: 'MD' }, ISSUES_FAILED.removeMany, 'realtime');
  }

  insertCategory(caller: Caller, body: IssueCategoryFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.category, { ...withActor(caller, body), cICtype: 'I' }, ISSUES_FAILED.category);
  }

  qfactSequence(caller: Caller, body: QFactSequenceFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.qfactSequence, withActor(caller, body), ISSUES_FAILED.qfactSequence, 'realtime');
  }

  qfactClaimSequence(caller: Caller, body: QFactClaimSequenceFields): Promise<unknown> {
    return this.firstCursor(ISSUES_SP.qfactClaimSequence, withActor(caller, body), ISSUES_FAILED.qfactClaimSequence, 'realtime');
  }

  async updateClaim(caller: Caller, body: ClaimUpdateFields): Promise<unknown> {
    const outcome = await this.sp.call(ISSUES_SP.updateClaim, withActor(caller, body), 'realtime');
    return outcome.ok === false ? issuesFailure(ISSUES_FAILED.updateClaim, outcome.error) : outcome.cursors[0]?.[0];
  }

  /** The SP's first cursor (the host answered `res.data[0]`), or the failure row. */
  private async firstCursor(sp: string, params: Record<string, unknown>, failed: string, schema?: 'realtime'): Promise<unknown> {
    const outcome: SpOutcome<unknown> = schema ? await this.sp.call(sp, params, schema) : await this.sp.call(sp, params);
    return outcome.ok === false ? issuesFailure(failed, outcome.error) : outcome.cursors[0];
  }
}
