/**
 * The issue and claim routes the venue box serves too (the nine ROUTE_MANIFEST rows with boxOwner `controller` since
 * Phase 9): the QFact picker's list and eight writes. realtime-server mounts it over IssuesService, the box over its
 * relay adapter. Each handler carries its manifest id as @RouteId. The verbs and body/query placement are the host's
 * (IssueController, 2026-10-06): the two deletes read their body on DELETE, as the frontends send it.
 */
import { Body, Controller, Delete, Get, Inject, Post, Put, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import {
  ClaimUpdateBody,
  IssueBody,
  IssueCategoryBody,
  IssueDeleteBody,
  IssueListQuery,
  QFactClaimSequenceBody,
  QFactSequenceBody,
} from '../dto/issues.dto';
import { ISSUES_OPS, IssuesOperations } from '../issues.operations';

/** The manifest ids of the rows this controller serves (box and cloud). */
export const ISSUES_BOX_ROUTE_IDS = Object.freeze([
  'issue.list',
  'issue.insert',
  'issue.update',
  'issue.delete',
  'issue.delete.multi',
  'issue.category.insert',
  'issue.qfact.sequence',
  'issue.qfact.claim.sequence',
  'issue.claim.update',
]);

@Controller('issue')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class IssuesController {
  constructor(@Inject(ISSUES_OPS) private readonly operations: IssuesOperations) {}

  @Get('issuelist_V2')
  @RouteId('issue.list')
  list(@Caller() caller: Caller, @Query() query: IssueListQuery): Promise<unknown> {
    return this.operations.list(caller, query);
  }

  @Post('insertIssue')
  @RouteId('issue.insert')
  insert(@Caller() caller: Caller, @Body() body: IssueBody): Promise<unknown> {
    return this.operations.insert(caller, body);
  }

  @Put('updateIssue')
  @RouteId('issue.update')
  update(@Caller() caller: Caller, @Body() body: IssueBody): Promise<unknown> {
    return this.operations.update(caller, body);
  }

  @Delete('deleteIssue')
  @RouteId('issue.delete')
  remove(@Caller() caller: Caller, @Body() body: IssueDeleteBody): Promise<unknown> {
    return this.operations.remove(caller, body);
  }

  @Delete('delete/multi/issue')
  @RouteId('issue.delete.multi')
  removeMany(@Caller() caller: Caller, @Body() body: IssueDeleteBody): Promise<unknown> {
    return this.operations.removeMany(caller, body);
  }

  @Post('insertCategory')
  @RouteId('issue.category.insert')
  insertCategory(@Caller() caller: Caller, @Body() body: IssueCategoryBody): Promise<unknown> {
    return this.operations.insertCategory(caller, body);
  }

  @Post('qfact/sequence')
  @RouteId('issue.qfact.sequence')
  qfactSequence(@Caller() caller: Caller, @Body() body: QFactSequenceBody): Promise<unknown> {
    return this.operations.qfactSequence(caller, body);
  }

  @Post('qfact/claim/sequence')
  @RouteId('issue.qfact.claim.sequence')
  qfactClaimSequence(@Caller() caller: Caller, @Body() body: QFactClaimSequenceBody): Promise<unknown> {
    return this.operations.qfactClaimSequence(caller, body);
  }

  @Put('updateClaimDetail')
  @RouteId('issue.claim.update')
  updateClaim(@Caller() caller: Caller, @Body() body: ClaimUpdateBody): Promise<unknown> {
    return this.operations.updateClaim(caller, body);
  }
}
