/**
 * The Full Fact editor's routes only the cloud serves: `factsheet/permissions` and `factsheet/unshare` (the legacy
 * fact table calls them; the new frontend never does, so ROUTE_MANIFEST has no row for them) and
 * `factsheet/factannotation` (a `use_cloud` row: PDF Fact geometry, and the box serves no PDFs). realtime-server
 * mounts this beside FactsheetController (FactsheetRealtimeHttpModule mount 'live'); the box never does.
 */
import { Body, Controller, Get, Inject, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, MarkWrite, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { FactsheetQuery } from '../dto/factsheet.dto';
import { FACTSHEET_OPS, FactsheetOperations } from '../factsheet.operations';

/** The route ids of this controller (envelope keys; permissions and unshare have no manifest row). */
export const FACTSHEET_LIVE_ROUTE_IDS = Object.freeze(['factsheet.permissions', 'factsheet.unshare', 'factsheet.annotation']);

@Controller('factsheet')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class FactsheetLiveController {
  constructor(@Inject(FACTSHEET_OPS) private readonly operations: FactsheetOperations) {}

  @Get('permissions')
  @RouteId('factsheet.permissions')
  permissions(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    // The row names the fact's owner: only for a caller who may view the fact.
    return this.operations.permissions(caller, query);
  }

  // "Remove from my list": passed on only when it took the caller off the fact's audience (op 'unshare'); the SP
  // answers msg 1 even when it removed nothing.
  @Post('unshare')
  @RouteId('factsheet.unshare')
  @MarkWrite({ kind: 'F', op: 'unshare', idFrom: 'body.nFSid' })
  unshare(@Caller() caller: Caller, @Body() body: FactsheetQuery): Promise<unknown> {
    return this.operations.unshare(caller, body);
  }

  @Get('factannotation')
  @RouteId('factsheet.annotation')
  annotation(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.annotation(caller, query);
  }
}
