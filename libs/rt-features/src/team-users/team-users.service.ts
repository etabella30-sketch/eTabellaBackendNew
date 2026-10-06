/**
 * The live executor of the team-users lookup, the one implementation coreapi and realtime-server now share (plan
 * Phase 5, the first "fix once" feature): `public.et_common_my_team_user(nCaseid, nMasterid)` through SP_EXECUTOR
 * with the verified caller as nMasterid, never a value from the request (R4), then the team rule of
 * @app/permissions as defence in depth (R5): rows outside the caller's teams on the case never leave, even if the
 * SP ever returned one. A row-less or failed call is a DomainError `upstream` carrying what the SP said, which each
 * host's legacy shape renders as it did before the move (http/legacy-shapes.ts).
 *
 * Not bound on the box (no database there): the box binds a relay adapter to the same operations port.
 */
import { Inject, Injectable } from '@nestjs/common';
import { Caller, DomainError, ROW_QUERY, RowQuery, SP_EXECUTOR, SpExecutor } from '@app/api-kernel';
import { callerTeamsOf, keepSameTeamRows } from '@app/permissions';

import type { TeamUsersQueryFields } from './dto/team-users.query';
import type { TeamUserRow, TeamUsersOperations } from './team-users.operations';

export const TEAM_USERS_SP = 'common_my_team_user';
export const TEAM_USERS_FAILED = 'Failed to fetch team members';

/** The SP's own "failed" row (`{ msg: -1, ... }`), which coreapi used to pass through and realtime-server refused. */
export function isFailureRow(row: unknown): row is { msg: number; error?: unknown } {
  const msg = (row as { msg?: unknown } | null)?.msg;
  return typeof msg === 'number' ? msg < 0 : typeof msg === 'string' && msg.trim() !== '' && Number(msg) < 0;
}

@Injectable()
export class TeamUsersService implements TeamUsersOperations {
  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Inject(ROW_QUERY) private readonly rows: RowQuery,
  ) {}

  async listMyTeamUsers(caller: Caller, query: TeamUsersQueryFields): Promise<readonly TeamUserRow[]> {
    // The key is sent as the host's DTO delivered it (null for the coreapi sentinels), and omitted when absent.
    const params: Record<string, unknown> = { nMasterid: caller.userId };
    if (query.nCaseid !== undefined) params.nCaseid = query.nCaseid;
    const outcome = await this.sp.call<TeamUserRow>(TEAM_USERS_SP, params, 'public');
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) throw new DomainError('upstream', TEAM_USERS_FAILED, { error: outcome.error });
    const rows = outcome.cursors[0];
    if (!Array.isArray(rows)) throw new DomainError('upstream', TEAM_USERS_FAILED, { error: 'no_cursor' });
    const failure = (rows as readonly unknown[]).find(isFailureRow);
    if (failure) throw new DomainError('upstream', TEAM_USERS_FAILED, { error: String(failure.error ?? 'failed'), row: failure });
    const teams = await callerTeamsOf(this.rows, typeof query.nCaseid === 'string' ? query.nCaseid : '', caller.userId);
    return keepSameTeamRows(teams, rows, caller.userId);
  }
}
