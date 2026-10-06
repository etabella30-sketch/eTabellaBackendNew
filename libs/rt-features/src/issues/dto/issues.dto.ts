/**
 * The requests of the issue and claim routes the box relays, as realtime-server's issue.interface.ts declared them
 * (IssueListParam over BaseSessionDetail, IssueRequestBody, deleteIssueRequestBody, IssueCategoryRequestBody,
 * qfactSequenceParam, qfactClaimSequenceParam, UpdateClaimRequestBody) before the routes moved here (plan Phase 9):
 * the same class-validator rules, so the 400s are the same, over ActorFields (nUserid and nMasterid are accepted and
 * ignored, R4: the actor is the verified Caller; the hosts' DTOs required nUserid on the category and sequence
 * bodies and the auth middleware overwrote it, so accepting it as optional changes nothing a client sees). The 'null'
 * and '0' sentinels the RT page sends for "none" (nSessionid=null, nIDid=null) are read as absent by IsItUUID. No
 * @nestjs/swagger (D9).
 */
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsIn, IsNumber, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { ActorFields, IsItUUID } from '@app/api-kernel';

export interface IssueListFields {
  readonly nCaseid?: string | null;
  readonly nSessionid?: string | null;
  readonly nIDid?: string | null;
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface IssueFields {
  readonly nIid?: string | null;
  readonly cIName: string;
  readonly cColor: string;
  readonly nICid: string;
  readonly nCaseid: string;
  readonly dCreatedt?: string;
  readonly dUpdatedt?: string;
  readonly cPriority?: string | null;
  readonly cDispute?: string | null;
  readonly cDescription?: string | null;
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface IssueDeleteFields {
  readonly nIid?: string | null;
  readonly jIids?: readonly string[];
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface IssueCategoryFields {
  readonly nICid?: string | null;
  readonly nCaseid: string;
  readonly cCategory: string;
  readonly dCreateDt?: string;
  readonly dUpdateDt?: string;
  readonly cColor?: string | null;
  readonly cParty?: string | null;
  readonly cDescription?: string | null;
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface QFactSequenceFields {
  readonly nCaseid: string;
  readonly jIssues: readonly { nIid: string; nQFactSequence: number; bVisible: boolean }[];
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface QFactClaimSequenceFields {
  readonly nCaseid: string;
  readonly jClaims: readonly { nICid: string; nQFactSequence: number }[];
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

export interface ClaimUpdateFields {
  readonly nICid?: string | null;
  readonly cCategory: string;
  readonly cColor?: string | null;
  readonly cParty?: string | null;
  readonly cDescription?: string | null;
  readonly nUserid?: string;
  readonly nMasterid?: string;
}

/** `GET issue/issuelist_V2` (manifest row issue.list). */
export class IssueListQuery extends ActorFields implements IssueListFields {
  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  @IsOptional()
  @IsItUUID()
  nSessionid?: string;

  @IsOptional()
  @IsItUUID()
  nIDid?: string;
}

/** `POST issue/insertIssue` and `PUT issue/updateIssue` (issue.insert, issue.update). */
export class IssueBody extends ActorFields implements IssueFields {
  @IsItUUID()
  @IsOptional()
  nIid?: string;

  @IsString()
  cIName: string;

  @IsString()
  cColor: string;

  @IsItUUID()
  nICid: string;

  @IsItUUID()
  nCaseid: string;

  @IsOptional()
  dCreatedt?: string;

  @IsOptional()
  dUpdatedt?: string;

  @IsOptional()
  @IsIn(['H', 'M', 'L'])
  cPriority?: string | null;

  @IsOptional()
  @IsIn(['U', 'P', 'D'])
  cDispute?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cDescription?: string | null;
}

/** `DELETE issue/deleteIssue { nIid }` and `DELETE issue/delete/multi/issue { jIids }` (issue.delete, issue.delete.multi). */
export class IssueDeleteBody extends ActorFields implements IssueDeleteFields {
  @IsItUUID()
  @IsOptional()
  nIid?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jIids?: string[];
}

/** `POST issue/insertCategory` (issue.category.insert): a new claim. */
export class IssueCategoryBody extends ActorFields implements IssueCategoryFields {
  @IsItUUID()
  @IsOptional()
  nICid?: string;

  @IsItUUID()
  nCaseid: string;

  @IsString()
  cCategory: string;

  @IsOptional()
  dCreateDt?: string;

  @IsOptional()
  dUpdateDt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cParty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cDescription?: string | null;
}

export class QFactSequenceItem {
  @IsString()
  nIid: string;

  @IsNumber()
  nQFactSequence: number;

  @IsBoolean()
  bVisible: boolean;
}

/** `POST issue/qfact/sequence` (issue.qfact.sequence). */
export class QFactSequenceBody extends ActorFields implements QFactSequenceFields {
  @IsItUUID()
  nCaseid: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QFactSequenceItem)
  jIssues: QFactSequenceItem[];
}

export class QFactClaimSequenceItem {
  @IsString()
  nICid: string;

  @IsNumber()
  nQFactSequence: number;
}

/** `POST issue/qfact/claim/sequence` (issue.qfact.claim.sequence). */
export class QFactClaimSequenceBody extends ActorFields implements QFactClaimSequenceFields {
  @IsItUUID()
  nCaseid: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QFactClaimSequenceItem)
  jClaims: QFactClaimSequenceItem[];
}

/** `PUT issue/updateClaimDetail` (issue.claim.update). */
export class ClaimUpdateBody extends ActorFields implements ClaimUpdateFields {
  @IsItUUID()
  @IsOptional()
  nICid?: string;

  @IsString()
  cCategory: string;

  @IsOptional()
  @IsString()
  @MaxLength(7)
  cColor?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  cParty?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  cDescription?: string | null;
}
