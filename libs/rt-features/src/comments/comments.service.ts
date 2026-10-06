/**
 * The live executor of the fact comments, the one implementation coreapi `comments/*` and realtime-server
 * `comments/grid` + `comments/add` (the two the venue box relays) now share (plan Phase 10, D12), body for body the
 * coreapi CommentsService of 2026-10-06:
 *  - reads (`grid`, `users`): the caller must be able to view the fact (the bCanView rule of @app/permissions
 *    fact-visibility); anyone else, and a fact that does not exist, gets the normal EMPTY list rather than a 403, so
 *    neither frontend's interceptor navigates away; a failed permission lookup is 'unavailable' (500);
 *  - add ('N'): view access to the fact, else 'forbidden' (a missing fact too, as before); edit / delete ('E', 'D'):
 *    the comment must be the caller's own and on the fact named (realtime.et_manage_comments checks nothing about
 *    the caller; the legacy fact-discuss panel only offers editing on your own comment);
 *  - after a write the SP reported done (`msg` 1), the saved row (et_comments_grid for its nCid) is broadcast on the
 *    `factsheet-comments` Kafka topic with the fact's viewers as `recipients` (@app/permissions fact-audience), the
 *    message UtilityService.emit sent, through EVENT_DELIVERY; a failed detail or viewer lookup never fails the
 *    request (the fact's room still hears it, or nothing is sent, as before).
 * The actor is the verified Caller under both identity keys (R4), never a value from the request.
 *
 * Not bound on the box (no database there): the box binds a relay adapter to the same operations port.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Caller,
  DomainError,
  EVENT_DELIVERY,
  EventDelivery,
  isDomainError,
  isUuidText,
  ROW_QUERY,
  RowQuery,
  SP_EXECUTOR,
  SpExecutor,
} from '@app/api-kernel';
import { FACT_NOT_VIEWABLE, factViewers, readFactPermission } from '@app/permissions';

import type { CommentListFields, CommentManageFields, CommentUsersFields } from './dto/comments.dto';
import type { CommentPermission, CommentsOperations } from './comments.operations';

export const COMMENTS_SCHEMA = 'realtime' as const;

export const COMMENTS_SP = Object.freeze({
  grid: 'comments_grid',
  users: 'comments_users',
  manage: 'manage_comments',
});

/** The `value` of the hosts' failure bodies. */
export const COMMENTS_FAILED = Object.freeze({
  grid: 'Failed to get comments grid',
  users: 'Failed to get comments users',
  manage: 'Failed to manage comment',
});

export const COMMENT_NOT_YOURS = 'You can only change your own comments';

/** The Kafka topic socket-app fans a comment out on (the fact's room + each recipient's own room). */
export const COMMENTS_TOPIC = 'factsheet-comments';
export const COMMENT_MESSAGE_TYPE = 'FACT-MESSAGE';

/** The request's fields with the caller as the actor under BOTH identity keys (R4). */
export function withActor(caller: Caller, fields: object): Record<string, unknown> {
  return { ...fields, nUserid: caller.userId, nMasterid: caller.userId };
}

export const sameId = (a: unknown, b: unknown): boolean => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

type Row = Record<string, unknown>;

@Injectable()
export class CommentsService implements CommentsOperations {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @Inject(SP_EXECUTOR) private readonly sp: SpExecutor,
    @Inject(ROW_QUERY) private readonly rows: RowQuery,
    @Inject(EVENT_DELIVERY) private readonly events: EventDelivery,
  ) {}

  async grid(caller: Caller, query: CommentListFields): Promise<readonly unknown[]> {
    if (!(await this.mayView(caller, query.nFSid, COMMENTS_FAILED.grid))) return [];
    return this.list(COMMENTS_SP.grid, withActor(caller, { nFSid: query.nFSid, nCid: query.nCid }), COMMENTS_FAILED.grid);
  }

  async users(caller: Caller, query: CommentUsersFields): Promise<readonly unknown[]> {
    if (!(await this.mayView(caller, query.nFSid, COMMENTS_FAILED.users))) return [];
    return this.list(COMMENTS_SP.users, withActor(caller, { nFSid: query.nFSid }), COMMENTS_FAILED.users);
  }

  async manage(caller: Caller, body: CommentManageFields, permission: CommentPermission): Promise<unknown> {
    // Outside the write, so a refusal reaches the client as 403 rather than a 500.
    if (permission === 'N') await this.assertMayView(caller, body.nFSid);
    else await this.assertOwnComment(caller, body);
    const outcome = await this.sp.call<Row>(COMMENTS_SP.manage, { ...withActor(caller, body), cPermission: permission }, COMMENTS_SCHEMA);
    // Equality on the discriminant: the repo compiles without strictNullChecks, where `!outcome.ok` does not narrow.
    if (outcome.ok === false) throw new DomainError('upstream', COMMENTS_FAILED.manage, { error: outcome.error });
    const row = outcome.cursors[0]?.[0];
    if (row && Number(row.msg) === 1) await this.broadcast(caller, body.nFSid, row.nCid, permission);
    return row;
  }

  /** The read gate: may the caller view the fact? A fact that does not exist, or no fact id, is a quiet no. */
  private async mayView(caller: Caller, nFSid: string | null | undefined, failed: string): Promise<boolean> {
    if (!isUuidText(nFSid)) return false;
    try {
      return (await readFactPermission(this.sp, caller.userId, nFSid)).bCanView === true;
    } catch (error) {
      if (isDomainError(error) && error.code === 'not_found') return false;
      if (isDomainError(error) && error.code === 'unavailable') throw new DomainError('unavailable', failed, error.detail);
      throw error;
    }
  }

  /** The add gate: view access to the fact, else forbidden (a missing fact too); a failed lookup stays 'unavailable'. */
  private async assertMayView(caller: Caller, nFSid: string | null | undefined): Promise<void> {
    if (!isUuidText(nFSid)) throw new DomainError('forbidden', FACT_NOT_VIEWABLE, { nFSid });
    let canView: boolean;
    try {
      canView = (await readFactPermission(this.sp, caller.userId, nFSid)).bCanView === true;
    } catch (error) {
      if (isDomainError(error) && error.code === 'not_found') throw new DomainError('forbidden', FACT_NOT_VIEWABLE, { nFSid });
      throw error;
    }
    if (!canView) throw new DomainError('forbidden', FACT_NOT_VIEWABLE, { nFSid });
  }

  /** The edit / delete gate: the comment named exists on the fact named and is the caller's own. */
  private async assertOwnComment(caller: Caller, body: CommentManageFields): Promise<void> {
    if (!isUuidText(body.nCid) || !isUuidText(body.nFSid)) throw new DomainError('forbidden', COMMENT_NOT_YOURS);
    const outcome = await this.sp.call<Row>(COMMENTS_SP.grid, withActor(caller, { nFSid: body.nFSid, nCid: body.nCid }), COMMENTS_SCHEMA);
    if (outcome.ok === false) {
      this.logger.error(`comment owner lookup failed for ${body.nCid}: ${outcome.error}`);
      throw new DomainError('unavailable', COMMENTS_FAILED.manage, { error: outcome.error });
    }
    const comment = (outcome.cursors[0] ?? []).find((row) => sameId(row?.nCid, body.nCid));
    if (!comment || !sameId(comment.nUserid, caller.userId)) throw new DomainError('forbidden', COMMENT_NOT_YOURS);
  }

  /** The SP's first cursor (the host answered `res.data[0]`), or 'upstream' with what the SP said. */
  private async list(sp: string, params: Record<string, unknown>, failed: string): Promise<readonly unknown[]> {
    const outcome = await this.sp.call(sp, params, COMMENTS_SCHEMA);
    if (outcome.ok === false) throw new DomainError('upstream', failed, { error: outcome.error });
    return outcome.cursors[0] ?? [];
  }

  /** The saved comment (et_comments_grid for its id) to the fact's room and its viewers. Never fails the request. */
  private async broadcast(caller: Caller, nFSid: string | null | undefined, nCid: unknown, permission: CommentPermission): Promise<void> {
    try {
      const detail = await this.sp.call<Row>(COMMENTS_SP.grid, withActor(caller, { nFSid, nCid }), COMMENTS_SCHEMA);
      const rows = detail.ok === false ? [] : detail.cursors[0] ?? [];
      if (!rows.length) {
        this.logger.error(`No Msg Detail Found for nCid: ${String(nCid)}`);
        return;
      }
      const { msg: _msg, value: _value, ...saved } = rows[0];
      const recipients = await this.recipients(nFSid);
      this.events.publish({ kind: 'message', topic: COMMENTS_TOPIC, data: { type: COMMENT_MESSAGE_TYPE, nFSid, ...saved, recipients, permission } });
    } catch (error) {
      this.logger.error(`comment broadcast failed: ${(error as Error)?.message ?? error}`);
    }
  }

  /** The fact's viewers, or nobody when the lookup fails (the fact's room still hears the comment). */
  private async recipients(nFSid: string | null | undefined): Promise<string[]> {
    try {
      return await factViewers(this.rows, nFSid);
    } catch (error) {
      this.logger.error(`fact viewers lookup failed for ${String(nFSid)}: ${(error as Error)?.message ?? error}`);
      return [];
    }
  }
}
