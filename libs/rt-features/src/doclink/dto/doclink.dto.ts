/**
 * The requests of the DocLink routes, as realtime-server's doc.interface.ts declared them (InsertDoc, docID,
 * docIDmulti) before the routes moved here (plan Phase 8): the same class-validator rules, so the 400s are the same,
 * with ActorFields in place of the hand-written nMasterid (nMasterid and nUserid are accepted and ignored, R4: the
 * actor is the verified Caller). The nested coordinate and annotation classes are the hosts' jCordinateItem,
 * jCoordinateItemAn and jRects, field for field. `nDMLids` on the id body is coreapi's per-link delete key (its
 * public et_doc_delete reads it; realtime-server's variant ignores it). No @nestjs/swagger (D9).
 */
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

/** What the operations port reads of a DocLink id request. */
export interface DocLinkIdFields {
  readonly nDocid?: string | null;
  readonly nDMLids?: string | null;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** What the operations port reads of a docdetail request. */
export interface DocLinkDetailFields {
  readonly jDocids?: string;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** What the operations port reads of an insertdoc body. */
export interface DocLinkInsertFields {
  readonly nSesid?: string | null;
  readonly nBundledetailid?: string | null;
  readonly jCordinates?: readonly unknown[];
  readonly jAn?: readonly unknown[];
  readonly jDl: string;
  readonly jOT: string;
  readonly jT: string;
  readonly jUsers: string;
  readonly cType: string;
  readonly nCaseid: string;
  readonly cDFrom: string;
  readonly nPage?: number;
  readonly nLine?: number;
  readonly jLT?: string;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** One transcript coordinate of a DocLink (the hosts' jCordinateItem), canvas geometry included. */
export class DocLinkCoordinate {
  @IsOptional()
  @IsString()
  text?: string;

  @IsString()
  t: string;

  @IsOptional()
  @IsNumber()
  l?: number;

  @IsOptional()
  @IsNumber()
  p?: number;

  @IsOptional()
  @IsNumber()
  oP?: number;

  @IsOptional()
  @IsNumber()
  oL?: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? String(value) : value))
  @IsString()
  identity?: string;

  @IsOptional()
  @IsString()
  type?: 'drawing' | 'area';

  @IsOptional()
  @IsArray()
  rects?: { x: number; y: number; width: number; height: number }[];

  @IsOptional()
  @IsArray()
  lines?: number[][];

  @IsOptional()
  @IsNumber()
  strokeWidth?: number;

  @IsOptional()
  @IsNumber()
  opacity?: number;

  @IsOptional()
  @IsString()
  color?: string;
}

/** One rectangle of a page annotation (the hosts' jRects). */
export class DocLinkRect {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  height: number;

  @IsNumber()
  width: number;
}

/** One page annotation of a PDF DocLink (the hosts' jCoordinateItemAn). */
export class DocLinkAnnotation {
  @IsString()
  uuid: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsArray()
  lines?: number[][];

  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocLinkRect)
  rects: DocLinkRect[];

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  borderColor?: string;

  @IsOptional()
  @IsNumber()
  strokeWidth?: number;

  @IsOptional()
  @IsNumber()
  opacity?: number;
}

/** `POST doclink/insertdoc` (manifest row doclink.insert). */
export class DocLinkInsertBody extends ActorFields implements DocLinkInsertFields {
  @IsItUUID()
  @IsOptional()
  nSesid?: string;

  @IsItUUID()
  @IsOptional()
  nBundledetailid?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocLinkCoordinate)
  @IsOptional()
  jCordinates?: DocLinkCoordinate[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DocLinkAnnotation)
  @IsOptional()
  jAn?: DocLinkAnnotation[];

  @IsString()
  jDl: string;

  @IsString()
  jOT: string;

  @IsString()
  jT: string;

  /** The share recipients (`[{nUserid, bCanEdit, ...}]` JSON); the manifest names it as the row's target field. */
  @IsString()
  jUsers: string;

  @IsString()
  cType: string;

  @IsItUUID()
  nCaseid: string;

  @IsIn(['I', 'RT'])
  cDFrom: string;

  @IsNumber()
  @IsOptional()
  nPage?: number;

  @IsNumber()
  @IsOptional()
  nLine?: number;

  @IsOptional()
  @IsString()
  jLT?: string;
}

/** `POST doclink/docdelete { nDocid, nDMLids? }` (manifest row doclink.delete). */
export class DocLinkIdBody extends ActorFields implements DocLinkIdFields {
  @IsItUUID()
  nDocid: string;

  @IsOptional()
  @IsItUUID()
  nDMLids?: string;
}

/** `GET doclink/docshared?nDocid=` (cloud only). */
export class DocLinkIdQuery extends DocLinkIdBody {}

/** `GET doclink/docdetail?jDocids=` (manifest row doclink.detail). */
export class DocLinkDetailQuery extends ActorFields implements DocLinkDetailFields {
  @IsString()
  jDocids: string;
}
