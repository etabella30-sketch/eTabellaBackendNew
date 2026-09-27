import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CaseListReq {
  @ApiProperty({ example: 1, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;



  @ApiProperty({ example: '', description: '', required: false })
  @IsString()
  cSearch: string;

  @IsOptional()
  @IsNumber()
  ref?: Number;

  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  @IsItUUID()
  nMasterid?: Number;
}

export interface AdminDashboardCaseRow {
  nCaseid: string;
  cCasename: string;
  cCaseno: string;
  dUpdateDt?: string | null;
  nTotaltickets?: number | string | null;
}

export interface AdminDashboardTeamRow {
  nTeamid: string;
  cTeamname: string;
  nCaseid: string;
}

export interface AdminDashboardUserRow {
  teams: string[] | string | null;
  nUserid: string;
  cFname: string;
  cLname: string;
  cProfile?: string | null;
  nRoleid?: string | null;
}

export type AdminDashboardCaseList = [
  AdminDashboardCaseRow[],
  AdminDashboardTeamRow[],
  AdminDashboardUserRow[],
];

export interface AdminDashboardErrorResponse {
  msg: number;
  value?: string;
  error?: any;
}

/** Kept under the legacy name so existing controller/service imports stay stable. */
export type CaseListResponce =
  | AdminDashboardCaseList
  | AdminDashboardErrorResponse;

export class CaseCountReq {
  @ApiProperty({ example: '', description: 'Search over cCasename||cCaseno', required: false })
  @IsString()
  cSearch: string;

  @ApiProperty({ example: false, description: 'Count archived instead of active cases', required: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true', { toClassOnly: true })
  @IsBoolean()
  bIsarchived?: boolean;

  @IsOptional()
  @IsNumber()
  ref?: Number;

  @IsItUUID()
  nMasterid?: Number;
}

export interface CaseCountRow {
  nTotalCount: number;
}

export type CaseCountResponce = CaseCountRow | AdminDashboardErrorResponse;

export class archiveCaseReq {
  @ApiProperty({ example: '', description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: false, description: 'is Archived', required: false })
  @IsBoolean()
  bIsarchived: Boolean;

  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  @IsItUUID()
  nMasterid?: Number;
}


export class archiveCaseRes {
  msg: number;
  value?: string;
  error?: any;
}

/** GET admin-dashboard/rtsimsource - only the token user (injected by JwtMiddleware). */
export class RtSimSourceReq {
  @IsItUUID()
  nMasterid?: string;
}

/** POST admin-dashboard/rtsimsource - turn one case on (it replaces any other) or off. */
export class RtSimSourceSetReq {
  @ApiProperty({ example: '', description: 'Case id', required: true })
  @IsUUID()
  nCaseid: string;

  @ApiProperty({ example: true, description: 'true = this case becomes the RT Simulation source; false = stop using it', required: true })
  @IsBoolean()
  bEnabled: boolean;

  @IsItUUID()
  nMasterid?: string;
}

/** The RT Simulation document source (nCaseid null = none chosen). */
export interface RtSimSourceRes {
  msg: number;
  value?: string;
  nCaseid?: string | null;
  nPrevCaseid?: string | null;
  cCasename?: string | null;
  cCaseno?: string | null;
  isArchived?: boolean;
  dUpdateDt?: string | null;
  nUpdateId?: string | null;
  error?: any;
}
