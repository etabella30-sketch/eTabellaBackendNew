/**
 * The queries of the Mark Navigator's two box rows (plan Phase 8): `GET marknav/all` (AllListReq on both hosts) and
 * `GET marknav/quickmarklist` (quickMarkParams), with the class-validator rules realtime-server applied, over
 * ActorFields (nUserid and nMasterid are accepted, as every client sends them, and ignored: the actor is the verified
 * Caller, R4; coreapi used to read the client's nUserid here, the IDOR Phase 8a closed). Query strings arrive as text,
 * so the number and the booleans are transformed as the hosts' DTOs did. The sort, page and transcript fields are
 * optional on both rows (the hosts required cSorttype / nPageNumber; the SPs default them: newest first, page 1,
 * bIsTranscipt false), so the venue box, which forwards the raw query to the cloud, passes a minimal query through as
 * the RT table did. No @nestjs/swagger (D9).
 */
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

/** What the operations port reads of a Mark Navigator query (the actor fields it ignores included). */
export interface MarkNavigatorListFields {
  readonly nSesid?: string | null;
  readonly nBundledetailid?: string | null;
  readonly cSorttype?: string;
  readonly cSortby?: string;
  readonly nPageNumber?: number;
  readonly jFilter?: string;
  readonly historyEnabled?: boolean;
  readonly bIsTranscipt?: boolean;
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

const toBoolean = ({ value }: { value: unknown }): unknown => (value === 'true' || value === true ? true : value === 'false' || value === false ? false : value);
const toInteger = ({ value }: { value: unknown }): unknown => (value === undefined || value === null || value === '' ? value : Number.parseInt(String(value), 10));

/** `GET marknav/all` (manifest row marknav.all): the Mark Navigator's three cursors (realtime.et_navigate_get_all). */
export class MarkNavigatorAllQuery extends ActorFields implements MarkNavigatorListFields {
  @IsOptional()
  @IsItUUID()
  nSesid?: string;

  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsOptional()
  @IsString()
  cSorttype?: string;

  @IsOptional()
  @IsString()
  cSortby?: string;

  @Transform(toInteger, { toClassOnly: true })
  @IsOptional()
  @IsNumber()
  nPageNumber?: number;

  @IsOptional()
  @IsString()
  jFilter?: string;

  @Transform(toBoolean, { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  historyEnabled?: boolean;

  @Transform(toBoolean, { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  bIsTranscipt?: boolean;
}

/** `GET marknav/quickmarklist` (manifest row marknav.quickmarks): a session's quick marks (realtime.et_navigate_quick_mark). */
export class MarkNavigatorQuickMarksQuery extends ActorFields implements MarkNavigatorListFields {
  @IsOptional()
  @IsItUUID()
  nSesid?: string;

  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsOptional()
  @IsString()
  cSorttype?: string;

  @IsOptional()
  @IsString()
  cSortby?: string;

  @Transform(toInteger, { toClassOnly: true })
  @IsOptional()
  @IsNumber()
  nPageNumber?: number;

  @IsOptional()
  @IsString()
  jFilter?: string;

  @Transform(toBoolean, { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  historyEnabled?: boolean;

  @Transform(toBoolean, { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  bIsTranscipt?: boolean;
}
