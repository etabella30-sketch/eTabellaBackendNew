/**
 * The query of the team-users lookup, one class per live host because each kept its own validation when the route
 * was extracted (plan Phase 5, D7): coreapi accepts the legacy "no id" sentinels ('', 'null', 'undefined', '0') as
 * null and still calls the SP; realtime-server requires a real UUID. Both extend ActorFields: `nMasterid` and
 * `nUserid` are accepted (the live middleware injects them, old clients send them) and ignored (R4: the actor is the
 * verified Caller). No @nestjs/swagger here (D9): the box bundle has no swagger package.
 */
import { IsDefined, IsUUID } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

/** What the operations port reads: the case, and the actor fields it ignores. */
export interface TeamUsersQueryFields {
  readonly nCaseid?: string | null;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** `GET /coreapi/common/myteamusers`: nullable UUID (IsItUUID), the shape coreapi's UserlistReq had. */
export class TeamUsersCoreQuery extends ActorFields implements TeamUsersQueryFields {
  @IsItUUID()
  nCaseid?: string;
}

/** `GET /realtimeapi/factsheet/teamusers`: a real UUID is required, the shape realtime-server's FactTeamUsersReq had. */
export class TeamUsersRealtimeQuery extends ActorFields implements TeamUsersQueryFields {
  @IsDefined()
  @IsUUID()
  nCaseid: string;
}
