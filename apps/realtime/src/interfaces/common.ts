import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, isString, IsNotEmpty } from 'class-validator';


export class ComboCodeReq {
  @ApiProperty({ example: 4, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nCategoryid must be a number conforming to the specified constraints' })
  nCategoryid: Number;

}

export class EmailparseReq {
  @ApiProperty({ example: '', description: 'cPath in only string' })
  // @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cPath: string;


  @ApiProperty({ example: 4, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'ID must be a number conforming to the specified constraints' })
  nId: number;


}


export class EmailAttachment {
  @ApiProperty({ example: 4, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'ID must be a number conforming to the specified constraints' })
  nId: number;

  @ApiProperty({ example: '', description: '' })
  // @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cPath: string;

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


  @ApiProperty({ example: 1, description: 'nCaseid' })
  @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
  @IsNumber()
  nCaseid: number;



}



export class IssuelistRes {
  nIid?: number;
  cIName?: string;
  cColor?: string;
  nICid?: number;
  cCategory?: string;
  msg?: number;
  value?: string;
  error?: any;
}




export class UserlistReq {


  @ApiProperty({ example: 1, description: 'nCaseid' })
  @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
  @IsNumber()
  nCaseid: number;


}


export class UserlistRes {
  nUserid?: number;
  cFname?: string;
  cLname?: string;
  cProfile?: number;
  msg?: number;
  value?: string;
  error?: any;
}


export class annotReq {


  @ApiProperty({ example: 1, description: 'nBundledetailid' })
  @Transform(({ value }) => (value === null || value === undefined) ? 0 : Number(value))
  @IsNumber()
  nBundledetailid: number;



}

export class annotRes {
  nAId?: number;
  uuid?: string;
  type?: string;
  rects?: string;
  lines?: string;
  width?: string;
  cClr?: string;
  page?: string;
  nFSid?: number;
  nDocid?: number;
  nWebid?: number;
  msg?: number;
  value?: string;
  error?: any;
}




export class getcoloridMDL {


  @ApiProperty({ example: '[]', description: 'Issue IDs', required: true })
  @IsString()
  jIids: string;


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