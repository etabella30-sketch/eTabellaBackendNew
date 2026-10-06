/**
 * Swagger docs of the team-users shared DTOs (plan Phase 5, decision D9a): the @ApiProperty options coreapi's
 * UserlistReq (now TeamUsersCoreQuery) and realtime-server's FactTeamUsersReq (now TeamUsersRealtimeQuery) carried
 * before the route moved to @app/rt-features/team-users, recorded here word for word so each host's Swagger page
 * reads as it did. Called from apps/coreapi/src/main.ts and apps/realtime-server/src/main.ts.
 */
import { TeamUsersCoreQuery, TeamUsersRealtimeQuery } from '@app/rt-features/team-users';
import { applyDtoDocs, DtoDocs } from '../dto-docs';

export const TEAM_USERS_CORE_QUERY_DOCS: DtoDocs<TeamUsersCoreQuery> = {
  nCaseid: { example: 'uuid-string', description: 'nCaseid' },
};

export const TEAM_USERS_REALTIME_QUERY_DOCS: DtoDocs<TeamUsersRealtimeQuery> = {
  nCaseid: { example: '550e8400-e29b-41d4-a716-446655440000', description: 'Case ID' },
};

/** Documents both team-users queries; a host that mounts one of them documents a class no route of its own uses, harmlessly. */
export function applyTeamUsersDocs(): void {
  applyDtoDocs(TeamUsersCoreQuery, TEAM_USERS_CORE_QUERY_DOCS);
  applyDtoDocs(TeamUsersRealtimeQuery, TEAM_USERS_REALTIME_QUERY_DOCS);
}
