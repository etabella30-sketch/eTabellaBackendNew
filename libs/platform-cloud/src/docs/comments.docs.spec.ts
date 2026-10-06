import 'reflect-metadata';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { CommentListQuery, CommentManageBody, CommentUsersQuery } from '@app/rt-features/comments';
import { applyCommentsDocs, COMMENT_LIST_QUERY_DOCS, COMMENT_MANAGE_BODY_DOCS, COMMENT_USERS_QUERY_DOCS } from './comments.docs';

const meta = (proto: object, field: string): Record<string, unknown> | undefined =>
  Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, proto, field);

describe('applyCommentsDocs (the coreapi Swagger page reads as before Phase 10)', () => {
  beforeAll(() => applyCommentsDocs());

  it("documents CommentManageBody as coreapi's CommentManageReq did", () => {
    for (const [field, options] of Object.entries(COMMENT_MANAGE_BODY_DOCS)) {
      expect([field, meta(CommentManageBody.prototype, field)]).toEqual([field, expect.objectContaining({ ...options, type: String })]);
    }
  });

  it("documents CommentListQuery and CommentUsersQuery as coreapi's CommentListReq / CommentUsersReq did", () => {
    for (const [field, options] of Object.entries(COMMENT_LIST_QUERY_DOCS)) {
      expect([field, meta(CommentListQuery.prototype, field)]).toEqual([field, expect.objectContaining({ ...options, type: String })]);
    }
    expect(meta(CommentUsersQuery.prototype, 'nFSid')).toEqual(expect.objectContaining({ ...COMMENT_USERS_QUERY_DOCS.nFSid, type: String }));
  });

  it('never documents the ignored actor fields (R4: the actor is the verified Caller)', () => {
    for (const proto of [CommentManageBody.prototype, CommentListQuery.prototype, CommentUsersQuery.prototype]) {
      expect(meta(proto, 'nMasterid')).toBeUndefined();
      expect(meta(proto, 'nUserid')).toBeUndefined();
    }
  });
});
