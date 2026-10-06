/**
 * Swagger docs of the comments shared DTOs (plan Phase 10, decision D9a): the @ApiProperty options coreapi's
 * CommentManageReq, CommentListReq and CommentUsersReq carried before the routes moved to @app/rt-features/comments,
 * recorded here word for word so the host's Swagger page reads as it did. Called from apps/coreapi/src/main.ts and
 * apps/realtime-server/src/main.ts (which now mounts the two rows the venue box relays).
 */
import { CommentListQuery, CommentManageBody, CommentUsersQuery } from '@app/rt-features/comments';
import { applyDtoDocs, DtoDocs } from '../dto-docs';

export const COMMENT_MANAGE_BODY_DOCS: DtoDocs<CommentManageBody> = {
  cMsg: { example: 'This is a comment message', description: 'Comment message text' },
  nCid: { example: '17017e35-cb39-4af6-b9bf-110bfdf7a95a', description: 'Comment ID (required for Edit/Delete)' },
  nFSid: { example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' },
  nBundledetailid: { example: '00000000-0000-0000-0000-000000000000', description: 'Bundle detail id identifier for the database entry' },
  nSesid: { example: '00000000-0000-0000-0000-000000000000', description: 'Session ID' },
  cPermission: { example: 'N', description: 'Permission' },
};

export const COMMENT_LIST_QUERY_DOCS: DtoDocs<CommentListQuery> = {
  nFSid: { example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' },
  nCid: { example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' },
};

export const COMMENT_USERS_QUERY_DOCS: DtoDocs<CommentUsersQuery> = {
  nFSid: { example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' },
};

/** Documents the three comment requests. */
export function applyCommentsDocs(): void {
  applyDtoDocs(CommentManageBody, COMMENT_MANAGE_BODY_DOCS);
  applyDtoDocs(CommentListQuery, COMMENT_LIST_QUERY_DOCS);
  applyDtoDocs(CommentUsersQuery, COMMENT_USERS_QUERY_DOCS);
}
