/**
 * `GET factsheet/teamusers` as realtime-server serves it: the shared controller of the team-users feature for the
 * realtimeapi URL family (the venue box relays its /coreapi alias here with the caller's edge token). The same
 * operations port as the coreapi controller; only the DTO (a required UUID) and the route id differ. The failure
 * answer realtime-server always gave, HTTP 500 without the database diagnostic, is this route's legacy shape.
 */
import { Controller, Get, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScoped, CaseScopeGuard, DomainErrorFilter, Inject, RouteId, SHARED_VALIDATION } from './plumbing';

import { TeamUsersRealtimeQuery } from '../dto/team-users.query';
import { TEAM_USERS_OPS, TeamUserRow, TeamUsersOperations } from '../team-users.operations';

export const REALTIME_TEAM_USERS_ROUTE_ID = 'realtime.factsheet.teamusers';

@Controller('factsheet')
@RouteId(REALTIME_TEAM_USERS_ROUTE_ID)
@CaseScoped('nCaseid')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class RealtimeTeamUsersController {
  constructor(@Inject(TEAM_USERS_OPS) private readonly operations: TeamUsersOperations) {}

  @Get('teamusers')
  listTeamUsers(@Caller() caller: Caller, @Query() query: TeamUsersRealtimeQuery): Promise<readonly TeamUserRow[]> {
    return this.operations.listMyTeamUsers(caller, query);
  }
}
