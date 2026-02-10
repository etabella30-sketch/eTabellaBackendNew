import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, isNumber, isString } from "class-validator";

export class CaseLSReq {
  @IsItUUID()
  nMasterid?: string;
}

export class UserLSReq {
  @ApiProperty({ example: '', description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class UserLlogReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 0, description: '' })
  @IsString()
  cType: Number;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  startDt: string;

  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  endDt: string;

  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;

  @IsItUUID()
  nMasterid?: string;
}

export class ConnectionsReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nSesid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class ScanPaginationReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: '' })
  @IsOptional()
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: [], description: '' })
  @IsString()
  jBundles: string

  @IsItUUID()
  nMasterid?: string;
}


export class dwdpathReq {

  @ApiProperty({ example: '', description: 'is apply to all', required: true })
  @IsString()
  cPath?: string;

  @IsItUUID()
  nMasterid?: string;
}

