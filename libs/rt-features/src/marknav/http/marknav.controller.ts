/**
 * The Mark Navigator routes the venue box serves too (the two ROUTE_MANIFEST rows with boxOwner `controller` since
 * Phase 8): `GET marknav/all` and `GET marknav/quickmarklist`. realtime-server and coreapi mount it over
 * MarkNavigatorService, the box over its relay adapter. Each handler carries its manifest id as @RouteId. The rest of
 * each host's marknav/* routes (fact lists, companies, history, team users) stay in the host's own controller.
 */
import { Controller, Get, Inject, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { MarkNavigatorAllQuery, MarkNavigatorQuickMarksQuery } from '../dto/marknav.dto';
import { MARK_NAVIGATOR_OPS, MarkNavigatorOperations } from '../marknav.operations';

/** The manifest ids of the rows this controller serves (box and cloud). */
export const MARK_NAVIGATOR_BOX_ROUTE_IDS = Object.freeze(['marknav.all', 'marknav.quickmarks']);

@Controller('marknav')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class MarkNavigatorController {
  constructor(@Inject(MARK_NAVIGATOR_OPS) private readonly operations: MarkNavigatorOperations) {}

  @Get('all')
  @RouteId('marknav.all')
  all(@Caller() caller: Caller, @Query() query: MarkNavigatorAllQuery): Promise<unknown> {
    return this.operations.all(caller, query);
  }

  @Get('quickmarklist')
  @RouteId('marknav.quickmarks')
  quickMarks(@Caller() caller: Caller, @Query() query: MarkNavigatorQuickMarksQuery): Promise<unknown> {
    return this.operations.quickMarks(caller, query);
  }
}
