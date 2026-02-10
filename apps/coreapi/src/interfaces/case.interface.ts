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