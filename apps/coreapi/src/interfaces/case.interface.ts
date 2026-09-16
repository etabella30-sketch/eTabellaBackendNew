import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, isNumber } from "class-validator";

export class CaseModal {

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  @IsNotEmpty()
  cCasename: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  @IsNotEmpty()
  cCaseno: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  @IsNotEmpty()
  cDesc: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  cIndexheader: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  cClaimant: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  cRespondent: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  cTClaimant: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  cTRespondent: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  permission: string;

  // Hearing schedule (migration 2026-09-14_case_hearing_schedule). All three
  // optional; the new admin sends them every time ('' / null clears), the
  // legacy admin app never does and the SP then leaves the stored values alone.
  @ApiProperty({ example: '2026-10-12T10:00:00', description: 'Hearing start as the venue wall clock (no timezone)', required: false })
  @IsOptional()
  @IsString()
  dHearingDt?: string | null;

  @ApiProperty({ example: 'Asia/Dubai', description: 'IANA timezone of the hearing venue', required: false })
  @IsOptional()
  @IsString()
  cHearingTimezone?: string | null;

  @ApiProperty({ example: 5, description: 'Scheduled hearing length in days', required: false })
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? null : parseInt(value, 10)), { toClassOnly: true })
  @IsNumber({}, { message: 'nHearingDays must be a number' })
  nHearingDays?: number | null;

  @IsItUUID()
  nMasterid: string;

}


export class CaseCreationResonce {
  msg: Number;
  value: string;
  nCaseid?: string
  error?: any
}



export class CaseDetailReq {

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}

export class CaseDetailResponce {
  msg: number;
  value?: string;
  error?: any;
  nCaseid?: string;
  cCasename?: string;
  cCaseno?: string;
  cClaimant?: string;
  cRespondent?: string;
  cIndexheader?: string;
  cDesc?: string;
  cTranscriptMode?: 'HTML' | 'PDF';
  // When true, the file-explorer evidence/bundle table for this case hides
  // the "Bundle" column AND removes it from the column-picker dropdown. Set
  // per-case in CaseMaster.bHideBundleColumn (migration
  // 2026-05-14_case_hide_bundle_column.sql); defaults to false for every
  // case so existing behaviour is unchanged.
  bHideBundleColumn?: boolean;
  // Hearing schedule (migration 2026-09-14_case_hearing_schedule); all NULL
  // when nothing is scheduled. dHearingDt is the venue's wall clock, to be
  // read in cHearingTimezone.
  dHearingDt?: string | null;
  cHearingTimezone?: string | null;
  nHearingDays?: number | null;
}


export class CaseDeleteReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class CaseDeleteRes {
  msg: Number;
  value: string;
  error?: any;
}



export class NotificationReq {

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;


  @IsItUUID()
  nMasterid?: string;
}




export class NotificationDelete {

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: '' })
  @IsOptional()
  @IsItUUID()
  nNTid: string;

  @IsItUUID()
  nMasterid?: string;
}