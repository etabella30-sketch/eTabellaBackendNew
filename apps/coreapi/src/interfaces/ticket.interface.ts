import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class caseTicketReq {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}




export class caseTicketRes {
  msg: number;
  value?: string;
  error?: any;
  nTicketid?: string;
  nCaseid?: string;
  cFname?: string;
  cLname?: string;
  cSession?: string;
  cDesc?: string;
  cImgname?: string;
  cImgpath?: string;
  cStatus?: string;
  dCreateDt?: string;
}


export class clearTicketReq {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class clearTicketRes {
  msg: number;
  value?: string;
  error?: any;
}



export class ticketResolveReq {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nTicketid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class ticketResolveRes {
  msg: number;
  value?: string;
  error?: any;
}




export class ticketResolveClearReq {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class ticketResolveClearRes {
  msg: number;
  value?: string;
  error?: any;
}

export class caseListReq {
  @IsItUUID()
  nMasterid?: string;
}


export class CaseListRes {
  nCaseid?: string;
  cCaseno?: string;
  cCasename?: string;
  msg?: number;
  value?: string;
  error?: any;
}


export class ticketBuilderReq {

  @ApiProperty({ example: 'example', description: 'Session' })
  @IsString()
  cSession: string;

  @ApiProperty({ example: 'example', description: 'Description' })
  @IsString()
  cDesc: string;


  @ApiProperty({ example: 'example', description: 'Image' })
  @IsString()
  @IsOptional()
  cImage: string;

  @ApiProperty({ example: 'example', description: 'Image name' })
  @IsString()
  @IsOptional()
  cImagename: string;


  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}