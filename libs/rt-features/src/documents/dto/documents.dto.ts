/**
 * The requests of the document reads the RT page makes (plan Phase 10c, D12): the Evidence bundle tree behind the
 * DocLink picker (sections, the user's sections, a folder's child folders, a folder's documents with and without a
 * search, the folder-name search), the section index behind a spoken tab reference, and one document's file data
 * behind the dock. Field for field coreapi's SectionReq / BundleReq / BundleDetailReq / BundleSearchReq /
 * BundleIndexReq / filedataReq (apps/coreapi/src/interfaces/bundle.interface.ts, 2026-10-07), which coreapi keeps for
 * its own surface; realtime-server and the venue box validate with these. All extend ActorFields: `nMasterid` /
 * `nUserid` are accepted (coreapi's JwtMiddleware injects nMasterid, old clients send it) and ignored (R4: the actor
 * is the verified Caller). No @nestjs/swagger here (D9).
 */
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

interface Actor {
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

export interface SectionsFields extends Actor {
  readonly nCaseid?: string | null;
}

export interface BundlesFields extends Actor {
  readonly nSectionid?: string | null;
  readonly nBundleid?: string | null;
  readonly pageNumber: number;
  readonly jElasticBundles?: string;
}

export interface BundleDetailFields extends Actor {
  readonly nSectionid?: string | null;
  readonly nBundleid?: string | null;
  readonly pageNumber: number;
  readonly cSearch?: string;
  readonly cFiletype?: string;
  readonly searchName?: string;
  readonly cSortby?: string;
  readonly cSorttype?: string;
  readonly contentType?: string;
  readonly nStarttabid?: string | null;
  readonly nEndtabid?: string | null;
  readonly jFTypes?: string;
  readonly jFilter?: string;
}

export interface FolderSearchFields extends Actor {
  readonly nCaseid?: string | null;
  readonly nSectionid?: string | null;
  readonly cSearch: string;
}

export interface BundleIndexFields extends Actor {
  readonly nSectionid?: string | null;
  readonly nCaseid?: string | null;
  readonly pageNumber?: unknown;
  readonly perPage?: unknown;
  readonly cSearch?: unknown;
  readonly bOutline?: unknown;
}

export interface FileDataFields extends Actor {
  readonly nBundledetailid?: string | null;
  readonly cTab?: string;
  readonly cType?: string;
  readonly nCaseid?: string | null;
}

/** `GET bundles/sections` and `GET bundles/usersections` (SectionReq). */
export class SectionsQuery extends ActorFields implements SectionsFields {
  @IsItUUID()
  nCaseid?: string;
}

/** `POST bundles/bundle` (BundleReq): a read the frontend sends as POST. */
export class BundlesBody extends ActorFields implements BundlesFields {
  @IsItUUID()
  nSectionid?: string;

  @IsOptional()
  @IsItUUID()
  nBundleid?: string | null;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: number;

  @IsOptional()
  @IsString()
  jElasticBundles?: string;
}

/** `GET bundles/bundledetail` and `GET bundles/bundledetail-search` (BundleDetailReq). */
export class BundleDetailQuery extends ActorFields implements BundleDetailFields {
  @IsItUUID()
  nSectionid?: string;

  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: number;

  @IsOptional()
  @IsString()
  cSearch?: string;

  @IsOptional()
  @IsString()
  cFiletype?: string;

  @IsOptional()
  @IsString()
  searchName?: string;

  @IsOptional()
  @IsString()
  cSortby?: string;

  @IsOptional()
  @IsString()
  cSorttype?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsOptional()
  @IsItUUID()
  nStarttabid?: string;

  @IsOptional()
  @IsItUUID()
  nEndtabid?: string;

  @IsOptional()
  @IsString()
  jFTypes?: string;

  @IsOptional()
  @IsString()
  jFilter?: string;
}

/** `GET bundles/folder-search` (BundleSearchReq). */
export class FolderSearchQuery extends ActorFields implements FolderSearchFields {
  @IsItUUID()
  nCaseid?: string;

  @IsOptional()
  @IsItUUID()
  nSectionid?: string;

  @IsString()
  cSearch: string;
}

/** `GET bundles/index` (BundleIndexReq): the paging and search fields were never validated beyond being optional. */
export class BundleIndexQuery extends ActorFields implements BundleIndexFields {
  @IsItUUID()
  nSectionid?: string;

  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  @IsOptional()
  pageNumber?: unknown;

  @IsOptional()
  perPage?: unknown;

  @IsOptional()
  cSearch?: unknown;

  @IsOptional()
  bOutline?: unknown;
}

/** `GET bundles/filedata` (filedataReq). */
export class FileDataQuery extends ActorFields implements FileDataFields {
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsOptional()
  @IsString()
  cTab?: string;

  @IsOptional()
  @IsString()
  cType?: string;

  @IsOptional()
  @IsItUUID()
  nCaseid?: string;
}
