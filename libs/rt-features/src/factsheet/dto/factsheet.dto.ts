/**
 * The requests of the Full Fact editor, as realtime-server's fact.interface.ts declared them (fectsheetDetailReq,
 * saveFactSheet, unshareDTO) before the routes moved here (plan Phase 7a): the same class-validator rules, so the
 * 400s are the same, with ActorFields in place of the hand-written nMasterid (nMasterid and nUserid are accepted and
 * ignored, R4: the actor is the verified Caller). `nFSid` keeps IsItUUID without IsOptional: an absent id passes
 * validation as it always did and the permission lookup then answers "Fact not found". No @nestjs/swagger (D9).
 */
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

/** What the operations port reads of a fact request: the fact, and the actor fields it ignores. */
export interface FactsheetQueryFields {
  readonly nFSid?: string | null;
  readonly nMasterid?: string;
  readonly nUserid?: string;
}

/** `GET factsheet/<read>?nFSid=` and `POST factsheet/unshare|delete { nFSid }`. */
export class FactsheetQuery extends ActorFields implements FactsheetQueryFields {
  @IsItUUID()
  nFSid: string;
}

/** The body of `POST factsheet/save`: the fact's fields and, with bIsUserUpdated, its full replacement share list. */
export interface FactsheetSaveFields extends FactsheetQueryFields {
  readonly nSesid?: string | null;
  readonly nBundledetailid?: string | null;
  readonly jT: string;
  readonly nFt: number;
  readonly nSt: number;
  readonly jFl: string;
  readonly nColorid: string | null;
  readonly jIssues: string;
  readonly jContacts: string;
  readonly jTasks: string;
  readonly jUsers?: string;
  readonly jDate: string;
  readonly bIsUserUpdated?: boolean;
  readonly nRv?: number;
}

export class FactsheetSaveBody extends ActorFields implements FactsheetSaveFields {
  @IsItUUID()
  nFSid: string;

  @IsItUUID()
  @IsOptional()
  nSesid: string;

  @IsItUUID()
  @IsOptional()
  nBundledetailid: string;

  @IsString()
  jT: string;

  @IsNumber()
  nFt: number;

  @IsNumber()
  nSt: number;

  @IsString()
  jFl: string;

  @IsItUUID()
  nColorid: string;

  @IsString()
  jIssues: string;

  @IsString()
  jContacts: string;

  @IsString()
  jTasks: string;

  /** The share recipients (`[{nUserid, bCanEdit, ...}]` JSON); the manifest names it as the row's target field. */
  @IsOptional()
  @IsString()
  jUsers: string;

  @IsString()
  jDate: string;

  @IsOptional()
  @IsBoolean()
  bIsUserUpdated: boolean;

  /** Review status (Codemaster cat 27: Open / In Review / Finalized); 0 = default Open. */
  @IsOptional()
  @IsNumber()
  nRv?: number;
}
