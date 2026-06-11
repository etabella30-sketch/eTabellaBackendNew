import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

/** GET /bundles/saved-search?nCaseid=… — list the current user's saved searches for a case. */
export class SavedSearchListReq {
  @ApiProperty({ description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  // Injected by JwtMiddleware (req.query.nMasterid) — never sent by the client.
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

/** POST /bundles/saved-search — create or update (upsert) a saved search. */
export class SavedSearchSaveReq {
  @ApiProperty({ description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ description: 'Display name', required: true })
  @IsString()
  cName: string;

  /** Arbitrary search-criteria blob (query, file types, dates, scope, …) → jsonb. */
  @ApiProperty({ description: 'Criteria JSON', required: false })
  @IsOptional()
  jCriteria?: unknown;

  /** Present → update that row; absent → insert (or update an existing same-name search). */
  @ApiProperty({ description: 'Existing search id (for update)', required: false })
  @IsOptional()
  nSearchid?: string | null;

  // Injected by JwtMiddleware (req.body.nMasterid).
  @IsOptional()
  nMasterid?: string;
}

/** DELETE /bundles/saved-search — soft-delete a saved search the user owns. */
export class SavedSearchDeleteReq {
  @ApiProperty({ description: 'Saved search id', required: true })
  @IsItUUID()
  nSearchid: string;

  // Injected by JwtMiddleware (req.body.nMasterid for DELETE).
  @IsOptional()
  nMasterid?: string;
}

/** One saved-search row returned to the client. */
export class SavedSearchRes {
  nSearchid?: string;
  nCaseid?: string;
  cName?: string;
  jCriteria?: unknown;
  dCreated?: string;
  dModified?: string;
  deleted?: boolean;
  msg?: number;
  value?: string;
  error?: unknown;
}
