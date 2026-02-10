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

export class CaseListResponce {
  msg: number;
  value?: string;
  error?: any;
  nCaseid?: string;
  cCasename?: string;
  cCaseno?: string;
  dUpdateDt?: string;
}

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
