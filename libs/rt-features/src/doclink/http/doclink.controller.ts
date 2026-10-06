/**
 * The DocLink routes the venue box serves too (the three ROUTE_MANIFEST rows with boxOwner `controller` since Phase
 * 8): insertdoc, docdelete, docdetail. realtime-server and coreapi mount it over DocLinkService (reads) and their own
 * DOCLINK_WRITES (writes), the box over its relay adapter. Each handler carries its manifest id as @RouteId, and the
 * two writes carry the kernel's @MarkWrite, which realtime-server's live mark sync reads (the box binds no hook).
 * The insert answer is wrapped here exactly as both hosts' controllers wrapped their service's answer.
 */
import { Body, Controller, Get, Inject, Post, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, MarkWrite, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { DocLinkDetailQuery, DocLinkIdBody, DocLinkInsertBody } from '../dto/doclink.dto';
import { DOCLINK_OPS, DocLinkInsertAnswer, DocLinkOperations } from '../doclink.operations';

/** The manifest ids of the rows this controller serves (box and cloud). */
export const DOCLINK_BOX_ROUTE_IDS = Object.freeze(['doclink.insert', 'doclink.delete', 'doclink.detail']);

export const DOCLINK_INSERTED = 'Doclink inserted successfully';
export const DOCLINK_NOT_INSERTED = 'Doclink not inserted successfully. Docid not found.';

/** Both hosts' wrap of the insert service answer: msg 1 with the new id, else msg -1 carrying what the service said. */
export function wrapInsertAnswer(res: unknown): DocLinkInsertAnswer {
  const nDocid = (res as { nDocid?: unknown } | null)?.nDocid;
  if (typeof nDocid === 'string' && nDocid) return { msg: 1, value: DOCLINK_INSERTED, nDocid };
  return { msg: -1, value: DOCLINK_NOT_INSERTED, error: res };
}

@Controller('doclink')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class DocLinkController {
  constructor(@Inject(DOCLINK_OPS) private readonly operations: DocLinkOperations) {}

  // Live mark sync (user decision 2026-10-05): the DocLink's author and share recipients are told that the marks of
  // its session changed.
  @Post('insertdoc')
  @RouteId('doclink.insert')
  @MarkWrite({ kind: 'D', op: 'insert', idFrom: 'reply.nDocid' })
  async insert(@Caller() caller: Caller, @Body() body: DocLinkInsertBody): Promise<DocLinkInsertAnswer> {
    // The create gate's refusal (403 / 500) propagates through the filter; everything else is wrapped as before.
    return wrapInsertAnswer(await this.operations.insert(caller, body));
  }

  @Post('docdelete')
  @RouteId('doclink.delete')
  @MarkWrite({ kind: 'D', op: 'delete', idFrom: 'body.nDocid' })
  remove(@Caller() caller: Caller, @Body() body: DocLinkIdBody): Promise<unknown> {
    return this.operations.remove(caller, body);
  }

  @Get('docdetail')
  @RouteId('doclink.detail')
  detail(@Caller() caller: Caller, @Query() query: DocLinkDetailQuery): Promise<unknown> {
    return this.operations.detail(caller, query);
  }
}
