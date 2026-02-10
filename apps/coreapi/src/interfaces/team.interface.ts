import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, isNumber, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class CaseTeamReq {

  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

  ref?: Number;
}


export class CaseUserReq {

  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 0, description: 'Page No' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: number;


  @ApiProperty({ example: 0, description: 'Team id', required: false })
  @IsOptional()
  @IsItUUID()
  nTeamid?: string;


  @ApiProperty({ example: 0, description: 'Last name', required: false })
  @IsOptional()
  @IsString()
  cLname?: string;



  @ApiProperty({ example: '', description: 'Search', required: false })
  @IsOptional()
  @IsString()
  searchText?: string;



  @IsItUUID()
  nMasterid?: string;

  ref?: Number;
}



export class teamListResonce {
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


export class CaseUserInfoReq {
  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  @IsOptional()
  nCaseid?: string;


  @ApiProperty({ example: 0, description: 'Userid ID' })
  @IsItUUID()
  nUserid: string;

  @IsItUUID()
  nMasterid?: string
}



export class CaseUserInfoRes {
  msg: number;
  value?: string;
  error?: any;
  nUserid?: string;
  cFname?: string;
  cLname?: string;
  cEmail?: string;
  nRoleid?: string;
  cProfile?: string;
  nTZid?: string;
  nTeamid?: string;
}

export class TimeZoneRes {
  msg: number;
  value?: string;
  error?: any;

  nValue?: Number;
  cKey?: string;
  jOther?: any;
}

export class TeamComboRes {
  msg: number;
  value?: string;
  error?: any;

  nTeamid?: string;
  cTeamname?: string;
  cFlag?: string;
}



export class RoleListRes {
  msg: number;
  value?: string;
  error?: any;

  nRoleid?: string;
  cRole?: string;
  cRStatus?: string;
}




export class UserListRes {
  msg: number;
  value?: string;
  error?: any;

  nUserid?: string;
  cFname?: string;
  cLname?: string;
  cProfile?: string;
  nTeamid?: string;
  nRoleid?: string;
}





export class assignedUsersReq {

  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

  ref?: Number;
}



export class checkEmailReq {

  @ApiProperty({ example: 0, description: 'cEmail' })
  @IsString()
  cEmail: string;

  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}





export class assignedUsersRes {
  msg: number;
  value?: string;
  error?: any;

  u?: Number;
  t?: Number;
}


export class  TeamColorReq {
  @ApiProperty({ example: 0, description: 'Case ID' })
  @IsItUUID()
  nCaseid: string;


  @IsItUUID()
  nMasterid?: string
}