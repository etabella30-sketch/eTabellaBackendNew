/**
 * The fact comment routes as coreapi serves them (`comments/*`), split in two because the venue box and
 * realtime-server serve only the two rows the box relays (ROUTE_MANIFEST core.comments, core.comments.add): the
 * list and the add in CommentsController; the commenters, the edit and the delete (the legacy fact-discuss panel's
 * other calls, no manifest rows) in CommentsLiveController, which only coreapi mounts. Controller-scoped plumbing
 * (plan §3.3 "Request plumbing"): the caller and case-scope guards, the shared validation pipe (on live it stacks on
 * the identical global one) and the DomainError filter, whose envelope each host binds. The operation (N / E / D) is
 * the route's, never the body's cPermission, as coreapi's handlers always overwrote it. The actor is `@Caller()`.
 */
import { Body, Controller, Delete, Get, Inject, Post, Put, Query, UseFilters, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { Caller, CallerGuard, CaseScopeGuard, DomainErrorFilter, RouteId, SHARED_VALIDATION } from '@app/api-kernel';

import { CommentListQuery, CommentManageBody, CommentUsersQuery } from '../dto/comments.dto';
import { COMMENTS_OPS, CommentsOperations } from '../comments.operations';

/** The manifest ids of the rows the box relays (and the envelope keys of every comment route). */
export const COMMENTS_ROUTE_IDS = Object.freeze({
  grid: 'core.comments',
  add: 'core.comments.add',
  users: 'core.comments.users',
  edit: 'core.comments.edit',
  delete: 'core.comments.delete',
});

@Controller('comments')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CommentsController {
  constructor(@Inject(COMMENTS_OPS) private readonly operations: CommentsOperations) {}

  @Get('grid')
  @RouteId(COMMENTS_ROUTE_IDS.grid)
  grid(@Caller() caller: Caller, @Query() query: CommentListQuery): Promise<readonly unknown[]> {
    return this.operations.grid(caller, query);
  }

  @Post('add')
  @RouteId(COMMENTS_ROUTE_IDS.add)
  add(@Caller() caller: Caller, @Body() body: CommentManageBody): Promise<unknown> {
    return this.operations.manage(caller, body, 'N');
  }
}

@Controller('comments')
@UseGuards(CallerGuard, CaseScopeGuard)
@UsePipes(new ValidationPipe(SHARED_VALIDATION))
@UseFilters(DomainErrorFilter)
export class CommentsLiveController {
  constructor(@Inject(COMMENTS_OPS) private readonly operations: CommentsOperations) {}

  @Get('users')
  @RouteId(COMMENTS_ROUTE_IDS.users)
  users(@Caller() caller: Caller, @Query() query: CommentUsersQuery): Promise<readonly unknown[]> {
    return this.operations.users(caller, query);
  }

  @Put('edit')
  @RouteId(COMMENTS_ROUTE_IDS.edit)
  edit(@Caller() caller: Caller, @Body() body: CommentManageBody): Promise<unknown> {
    return this.operations.manage(caller, body, 'E');
  }

  @Delete('delete')
  @RouteId(COMMENTS_ROUTE_IDS.delete)
  remove(@Caller() caller: Caller, @Body() body: CommentManageBody): Promise<unknown> {
    return this.operations.manage(caller, body, 'D');
  }
}
