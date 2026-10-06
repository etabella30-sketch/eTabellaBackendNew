/**
 * The Full Fact editor's routes the venue box serves too (the eight ROUTE_MANIFEST rows with boxOwner `controller`
 * since Phase 7a): the six association reads and the two writes. realtime-server mounts it over FactsheetService,
 * the box over its relay adapter. Each handler carries its manifest id as @RouteId, so the host's envelope renders a
 * failure as that route always did (legacy-shapes.ts), and the two writes carry the kernel's @MarkWrite, which
 * realtime-server's live mark sync reads (the box binds no hook: the cloud sends c.marks back over the uplink).
 */
import { Body, Controller, Get, Inject, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, MarkWrite, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { FactsheetQuery, FactsheetSaveBody } from '../dto/factsheet.dto';
import { FACTSHEET_OPS, FactsheetOperations } from '../factsheet.operations';

/** The manifest ids of the rows this controller serves (box and cloud). */
export const FACTSHEET_BOX_ROUTE_IDS = Object.freeze([
  'factsheet.detail',
  'factsheet.shared',
  'factsheet.issues',
  'factsheet.contacts',
  'factsheet.tasks',
  'factsheet.links',
  'factsheet.save',
  'factsheet.delete',
]);

@Controller('factsheet')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class FactsheetController {
  constructor(@Inject(FACTSHEET_OPS) private readonly operations: FactsheetOperations) {}

  @Get('detail')
  @RouteId('factsheet.detail')
  detail(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.detail(caller, query);
  }

  @Get('shared')
  @RouteId('factsheet.shared')
  shared(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.shared(caller, query);
  }

  @Get('issues')
  @RouteId('factsheet.issues')
  issues(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.issues(caller, query);
  }

  @Get('contacts')
  @RouteId('factsheet.contacts')
  contacts(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.contacts(caller, query);
  }

  @Get('tasks')
  @RouteId('factsheet.tasks')
  tasks(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.tasks(caller, query);
  }

  @Get('links')
  @RouteId('factsheet.links')
  links(@Caller() caller: Caller, @Query() query: FactsheetQuery): Promise<unknown> {
    return this.operations.links(caller, query);
  }

  // Live mark sync (user decision 2026-10-05): the fact's audience before and after the write is told that the
  // marks of its session changed; a share change reaches the people added AND the people removed.
  @Post('save')
  @RouteId('factsheet.save')
  @MarkWrite({ kind: 'F', op: 'update', idFrom: 'body.nFSid' })
  save(@Caller() caller: Caller, @Body() body: FactsheetSaveBody): Promise<unknown> {
    return this.operations.save(caller, body);
  }

  @Post('delete')
  @RouteId('factsheet.delete')
  @MarkWrite({ kind: 'F', op: 'delete', idFrom: 'body.nFSid' })
  remove(@Caller() caller: Caller, @Body() body: FactsheetQuery): Promise<unknown> {
    return this.operations.remove(caller, body);
  }
}
