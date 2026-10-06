/**
 * The two paths of the code-table lookup, one controller each because a Nest controller mounts under one prefix:
 * `GET common/getcode` as coreapi serves it (and the box under its /coreapi prefix, relayed), `GET issue/dynamiccombo`
 * as realtime-server serves it (the path the box relays to). Controller-scoped plumbing (plan §3.3 "Request
 * plumbing"): the caller guard, the shared validation pipe (on live it stacks on the identical global one) and the
 * DomainError filter, whose envelope each host binds. No case-scope guard: the query names no case (the manifest row
 * is `caseless`); the cloud's edge-token branch admits it on the box's standing alone. The actor is `@Caller()`.
 */
import { Controller, Get, Inject, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { CodeTableQuery } from '../dto/code-table.query';
import { CODE_TABLE_OPS, CodeRow, CodeTableOperations } from '../code-tables.operations';

/** The manifest id of the coreapi path (the box row). */
export const CORE_CODE_TABLE_ROUTE_ID = 'core.getcode';
/** realtime-server's path has no manifest row of its own (it is the cloudPath of core.getcode): a legacy-shape key. */
export const REALTIME_CODE_TABLE_ROUTE_ID = 'realtime.issue.dynamiccombo';

@Controller('common')
@RouteId(CORE_CODE_TABLE_ROUTE_ID)
@UseGuards(CallerGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CoreCodeTableController {
  constructor(@Inject(CODE_TABLE_OPS) private readonly operations: CodeTableOperations) {}

  @Get('getcode')
  getCode(@Caller() caller: Caller, @Query() query: CodeTableQuery): Promise<readonly CodeRow[]> {
    return this.operations.list(caller, query);
  }
}

@Controller('issue')
@RouteId(REALTIME_CODE_TABLE_ROUTE_ID)
@UseGuards(CallerGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class RealtimeCodeTableController {
  constructor(@Inject(CODE_TABLE_OPS) private readonly operations: CodeTableOperations) {}

  @Get('dynamiccombo')
  dynamicCombo(@Caller() caller: Caller, @Query() query: CodeTableQuery): Promise<readonly CodeRow[]> {
    return this.operations.list(caller, query);
  }
}
