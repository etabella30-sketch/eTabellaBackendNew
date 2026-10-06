/**
 * The requests of the fact comments (plan Phase 10): the comment list and the commenters of one fact, and the one
 * write body of add / edit / delete, as coreapi's CommentListReq / CommentUsersReq / CommentManageReq validated them
 * (apps/coreapi/src/interfaces/comment.interface.ts, 2026-10-06): the fact id is a nullable UUID (IsItUUID turns the
 * legacy "no id" sentinels into null; the service then answers the empty list, or refuses the write), the comment id
 * optional, the text required. All extend ActorFields: `nMasterid` / `nUserid` are accepted (coreapi's JwtMiddleware
 * injects nMasterid, old clients send it) and ignored (R4: the actor is the verified Caller). No @nestjs/swagger here
 * (D9): the docs live in @app/platform-cloud/docs/comments.docs.ts.
 */
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

/** What the operations port reads of a list request: the fact, one comment of it, and the actor fields it ignores. */
export interface CommentListFields {
  readonly nFSid?: string | null;
  readonly nCid?: string | null;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

export interface CommentUsersFields {
  readonly nFSid?: string | null;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** What the operations port reads of a write: the text, the ids, and the actor fields it ignores. */
export interface CommentManageFields {
  readonly cMsg: string;
  readonly nCid?: string | null;
  readonly nFSid?: string | null;
  readonly nBundledetailid?: string | null;
  readonly nSesid?: string | null;
  /** Sent by old clients; the route decides (N add, E edit, D delete), never the body. */
  readonly cPermission?: string;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** `GET comments/grid?nFSid=…[&nCid=…]`. */
export class CommentListQuery extends ActorFields implements CommentListFields {
  @IsItUUID()
  nFSid?: string;

  @IsOptional()
  @IsItUUID()
  nCid?: string;
}

/** `GET comments/users?nFSid=…`. */
export class CommentUsersQuery extends ActorFields implements CommentUsersFields {
  @IsItUUID()
  nFSid?: string;
}

/** `POST comments/add`, `PUT comments/edit`, `DELETE comments/delete`: the same body, the route names the operation. */
export class CommentManageBody extends ActorFields implements CommentManageFields {
  @IsString()
  @IsNotEmpty()
  cMsg: string;

  @IsOptional()
  @IsItUUID()
  nCid?: string;

  @IsItUUID()
  nFSid?: string;

  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsOptional()
  @IsItUUID()
  nSesid?: string;

  @IsString()
  @IsOptional()
  cPermission?: string;
}
