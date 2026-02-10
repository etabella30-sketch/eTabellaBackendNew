import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, isString, IsNotEmpty } from 'class-validator';


export class ComboCodeReq {
  @ApiProperty({ example: "uuid-string", description: '' })
  @Transform(({ value }) => Number(value), { toClassOnly: true })
  @IsNumber()
  nCategoryid: number;

  @IsItUUID()
  nMasterid: string;

}

export class EmailparseReq {
  @ApiProperty({ example: '', description: 'cPath in only string' })
  // @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cPath: string;


  @ApiProperty({ example: "uuid-string", description: '' })
  @IsItUUID()
  nId: string;

  @IsItUUID()
  nMasterid: string;

}


export class EmailAttachment {
  @ApiProperty({ example: "uuid-string", description: '' })
  @IsNumber()
  nId: number;

  @ApiProperty({ example: '', description: '' })
  // @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cPath: string;

  @IsItUUID()
  nMasterid: string;

}




export class ComboCodeRes {
  nValue?: number;
  cKey?: string;
  jObject?: any;
  nSerialno?: number;
  msg?: number;
  value?: string;
  error?: any;
}


export interface Email {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; data: any }>;
  date: string;
}


export class IssuelistReq {


  @ApiProperty({ example: "uuid-string", description: 'nCaseid' })
  @IsItUUID()
  nCaseid: string;


  @IsItUUID()
  nMasterid?: string;

}



export class IssuelistRes {
  nIid?: string;
  cIName?: string;
  cColor?: string;
  nICid?: string;
  cCategory?: string;
  msg?: number;
  value?: string;
  error?: any;
}




export class UserlistReq {


  @ApiProperty({ example: "uuid-string", description: 'nCaseid' })
  @IsItUUID()
  nCaseid: string;


  @IsItUUID()
  nMasterid?: string;

}


export class UserlistRes {
  nUserid?: string;
  cFname?: string;
  cLname?: string;
  cProfile?: number;
  msg?: number;
  value?: string;
  error?: any;
}


export class annotReq {


  @ApiProperty({ example: 1, description: 'nBundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @IsItUUID()
  nMasterid?: string;

}

export class annotRes {
  nAId?: string;
  uuid?: string;
  type?: string;
  rects?: string;
  lines?: string;
  width?: string;
  cClr?: string;
  page?: string;
  nFSid?: string;
  nDocid?: string;
  nWebid?: string;
  msg?: number;
  value?: string;
  error?: any;
}




export class getcoloridMDL {


  @ApiProperty({ example: '[]', description: 'Issue IDs', required: true })
  @IsString()
  jIids: string;

  @IsItUUID()
  nMasterid?: string;

}


export interface EmailRes {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
  attachments?: Array<{ filename: string; data: any }>;
  date: string;
  msg?: number;
  value?: string;
  error?: any;
}