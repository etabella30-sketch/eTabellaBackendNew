import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

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
}
