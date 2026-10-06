/**
 * The operations port of the comments feature (plan §3.3 "per-feature operations port"): what the shared
 * controllers ask for, in domain terms only. The live hosts bind CommentsService (the realtime SPs over SP_EXECUTOR,
 * the fact audience over ROW_QUERY, the broadcast over EVENT_DELIVERY); the venue box binds a relay adapter over
 * CLOUD_RELAY for the two rows it serves (the list and the add). A failure is a DomainError, which the host's
 * ERROR_ENVELOPE renders (http/legacy-shapes.ts: coreapi's `{ msg: -1, value }` bodies through the HttpErrorFilter).
 */
import type { Caller } from '@app/api-kernel';

import type { CommentListFields, CommentManageFields, CommentUsersFields } from './dto/comments.dto';

export const COMMENTS_OPS = 'RT_COMMENTS_OPS';

/** realtime.et_manage_comments cPermission: N add, E edit, D delete. */
export type CommentPermission = 'N' | 'E' | 'D';

export interface CommentsOperations {
  /** The comments of one fact (one comment when nCid is given), for a caller who may view it; [] for anyone else. */
  grid(caller: Caller, query: CommentListFields): Promise<readonly unknown[]>;
  /** Who has commented on one fact; the same gate and empty answer as `grid`. */
  users(caller: Caller, query: CommentUsersFields): Promise<readonly unknown[]>;
  /** Add (view access to the fact), edit or delete (the caller's own comment, on the fact named) one comment: the SP's first row. */
  manage(caller: Caller, body: CommentManageFields, permission: CommentPermission): Promise<unknown>;
}
