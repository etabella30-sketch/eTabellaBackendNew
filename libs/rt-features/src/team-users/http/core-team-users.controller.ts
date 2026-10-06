/**
 * `GET common/myteamusers` as coreapi serves it (and the box under its /coreapi prefix): the shared controller of the
 * team-users feature for the coreapi URL family. Controller-scoped plumbing (plan §3.3 "Request plumbing"): the
 * caller and case-scope guards, the shared validation pipe (on live it stacks on the identical global one) and the
 * DomainError filter, whose envelope each host binds. Identity and nothing else: the actor is `@Caller()`.
 */
import { Controller, Get, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, Inject, RouteId, SHARED_VALIDATION } from './plumbing';

import { TeamUsersCoreQuery } from '../dto/team-users.query';
import { TEAM_USERS_OPS, TeamUserRow, TeamUsersOperations } from '../team-users.operations';

export const CORE_TEAM_USERS_ROUTE_ID = 'core.myteamusers';

@Controller('common')
@RouteId(CORE_TEAM_USERS_ROUTE_ID)
@CaseScoped('nCaseid')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CoreTeamUsersController {
  constructor(@Inject(TEAM_USERS_OPS) private readonly operations: TeamUsersOperations) {}

  @Get('myteamusers')
  listMyTeamUsers(@Caller() caller: Caller, @Query() query: TeamUsersCoreQuery): Promise<readonly TeamUserRow[]> {
    return this.operations.listMyTeamUsers(caller, query);
  }
}
