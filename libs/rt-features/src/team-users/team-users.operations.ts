/**
 * The operations port of the team-users feature (plan §3.3 "per-feature operations port"): what the shared
 * controllers ask for, in domain terms only. The live hosts bind TeamUsersService (the SP over SP_EXECUTOR); the
 * venue box binds a relay adapter over CLOUD_RELAY. Transport never leaks into this interface: a failure is a
 * DomainError, which the host's ERROR_ENVELOPE renders (coreapi 200 [{msg:-1}], realtime-server 500, the box's
 * contract envelope or the relayed answer byte for byte).
 */
import type { Caller } from '@app/api-kernel';
import type { TeamUserRow } from '@app/api-contracts';

import type { TeamUsersQueryFields } from './dto/team-users.query';

export const TEAM_USERS_OPS = 'RT_TEAM_USERS_OPS';

export interface TeamUsersOperations {
  /** The caller's same-team users on the case, as `public.et_common_my_team_user` lists them (role-less members included). */
  listMyTeamUsers(caller: Caller, query: TeamUsersQueryFields): Promise<readonly TeamUserRow[]>;
}

export type { TeamUserRow };
