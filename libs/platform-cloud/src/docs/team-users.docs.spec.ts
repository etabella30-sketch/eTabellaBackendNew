import 'reflect-metadata';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { TeamUsersCoreQuery, TeamUsersRealtimeQuery } from '@app/rt-features/team-users';
import { applyTeamUsersDocs, TEAM_USERS_CORE_QUERY_DOCS, TEAM_USERS_REALTIME_QUERY_DOCS } from './team-users.docs';

const meta = (proto: object, field: string): Record<string, unknown> | undefined =>
  Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, proto, field);

describe('applyTeamUsersDocs (each host Swagger page reads as before Phase 5)', () => {
  beforeAll(() => applyTeamUsersDocs());

  it('documents TeamUsersCoreQuery.nCaseid as coreapi UserlistReq did', () => {
    expect(meta(TeamUsersCoreQuery.prototype, 'nCaseid')).toEqual(expect.objectContaining({ ...TEAM_USERS_CORE_QUERY_DOCS.nCaseid, type: String }));
  });

  it('documents TeamUsersRealtimeQuery.nCaseid as realtime-server FactTeamUsersReq did', () => {
    expect(meta(TeamUsersRealtimeQuery.prototype, 'nCaseid')).toEqual(expect.objectContaining({ ...TEAM_USERS_REALTIME_QUERY_DOCS.nCaseid, type: String }));
  });

  it('never documents the ignored actor fields (R4: the actor is the verified Caller)', () => {
    for (const proto of [TeamUsersCoreQuery.prototype, TeamUsersRealtimeQuery.prototype]) {
      expect(meta(proto, 'nMasterid')).toBeUndefined();
      expect(meta(proto, 'nUserid')).toBeUndefined();
    }
  });
});
