import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { IsJsonArrayString, MARK_LIMITS } from '@app/rt-features/doclink/dto/mark-limits';

export class LiveQfactContextRequest {
  @IsUUID() nCaseid: string;
  @IsUUID() nSesid: string;
  @IsOptional() @IsUUID() nMasterid?: string;
  @IsOptional() @IsUUID() nUserid?: string;
}

export class LiveQfactCaptureRequest extends LiveQfactContextRequest {
  @IsUUID() nRequestid: string;
  @IsString() @MinLength(1) @MaxLength(128) cRun: string;
  @IsString() @MinLength(1) @MaxLength(128) identity: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000000) page: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) line: number;
  @IsIn(['mark','unmark']) action: 'mark' | 'unmark';
  /** The QFACT's issues ([[nIid, 0, 0], …]), as a selection QFACT sends them. None: the case's Unassigned issue (RT QA 2026-10-29, F-19). */
  @IsOptional() @IsJsonArrayString(MARK_LIMITS.issues) jIssues?: string;
  @IsOptional() @IsUUID() nColorid?: string;
}
