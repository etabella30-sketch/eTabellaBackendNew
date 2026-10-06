/**
 * The DocLink route only the cloud serves: `GET doclink/docshared` (realtime-server; no manifest row, so the box
 * answers it `use_cloud` through its relay adapter's refusal). Same plumbing as the box controller.
 */
import { Controller, Get, Inject, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { DocLinkIdQuery } from '../dto/doclink.dto';
import { DOCLINK_OPS, DocLinkOperations } from '../doclink.operations';

export const DOCLINK_LIVE_ROUTE_IDS = Object.freeze(['doclink.shared']);

@Controller('doclink')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class DocLinkLiveController {
  constructor(@Inject(DOCLINK_OPS) private readonly operations: DocLinkOperations) {}

  @Get('docshared')
  @RouteId('doclink.shared')
  shared(@Caller() caller: Caller, @Query() query: DocLinkIdQuery): Promise<unknown> {
    return this.operations.shared(caller, query);
  }
}
