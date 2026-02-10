import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";



export class logSessionReq {

  @ApiProperty({ example: 'unicid', description: 'Session', required: true })
  @IsString()
  cSession: string;
}







export class login {

  @ApiProperty({ example: '', description: 'cEmail', required: true })
  @IsString()
  cEmail: string;

  @ApiProperty({ example: 'your password', description: '', required: true })
  @IsString()
  password: string;

  @ApiProperty({ example: '', description: 'cEmail', required: true })
  @IsString()
  cRTKey: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid: string;
}



export class sessionDelete {

  @ApiProperty({ example: 0, description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

}


export class sessionEnd {

  @ApiProperty({ example: 0, description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: 'Session id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'C', description: 'Delete', required: true })
  @IsOptional()
  @IsString()
  permission: string;
}






export class SessionBuilderReq {

  @ApiProperty({ example: 0, description: 'Session id', required: true })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @IsString()
  cCaseno: string;

  @ApiProperty({ example: 0, description: 'Name', required: true })
  @IsString()
  cName: string;

  @ApiProperty({ example: '2023-04-26T14:20:00Z', description: 'Start Date', required: true })
  @IsString()
  dStartDt: string;

  @ApiProperty({ example: 0, description: 'No of days', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nDays must be a number conforming to the specified constraints' })
  nDays: number;

  @ApiProperty({ example: 0, description: 'No of lines', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nLines must be a number conforming to the specified constraints' })
  nLines: number;

  @ApiProperty({ example: 0, description: 'Page no', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPageno must be a number conforming to the specified constraints' })
  nPageno: number;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  permission: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

  @ApiProperty({ example: '', description: 'cProtocol', required: true })
  @IsString()
  cProtocol?: string;

  @ApiProperty({ example: true, description: 'bRefresh', required: true })
  @Transform(({ value }) => (value ? true : false), { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  bRefresh?: any;

  @ApiProperty({ example: 0, description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

}







export class ServerBuilderReq {

  @ApiProperty({ example: 0, description: 'nRTSid', required: true })
  @IsOptional()
  @IsItUUID()
  nRTSid: string;

  @ApiProperty({ example: '', description: 'Url', required: true })
  @IsString()
  cUrl: string;

  @ApiProperty({ example: 0, description: 'Port', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPort must be a number conforming to the specified constraints' })
  nPort: number;


  @ApiProperty({ example: '', description: 'Name', required: true })
  @IsString()
  cName: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  permission: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

  @ApiProperty({ example: 0, description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;
}




export class assignMentReq {

  @ApiProperty({ example: 0, description: 'nCaseid', required: false })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: 'nRTSid', required: true })
  @IsItUUID()
  nRTSid: string;

  @ApiProperty({ example: '', description: 'jUserid', required: true })
  @IsString()
  jUserid: any;

  @ApiProperty({ example: '', description: 'cNotifytype', required: true })
  @IsString()
  cNotifytype: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}

export class SessionDataV2Req {


  @ApiProperty({ example: 0, description: 'nSesid', required: true })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: 'nCaseid', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;


}


export interface CurrentJob {
  id: number | null;
  crLine: number[];
  lineBuffer: any;// Array<[string, number[], number]>;
  globalBuffer: Array<[number, number]>;
  lineCount: number;

  oldLineData?: any;

  oldLineCount?: number;
  // oldcurrentLineNumber?: number;
  // oldcurrentTimestamp?:any;

  currentPage?: any;
  currentLineNumber?: any;
  currentTimestamp?: any;
  customTimestamp?: any;
  currentFormat?: any;

  isRefresh?: boolean;

  relaceLines: any[]


  refreshTimeStamp?: any[];

  refreshBefour?: any[];

}
export class SessionByCaseIdReq {


  @ApiProperty({ example: 0, description: 'nCaseid' })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 0, description: 'nUserid' })
  @IsOptional()
  @IsItUUID()
  nUserid: string;



}




export class userSesionData {

  @ApiProperty({ example: 0, description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 0, description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;


}




export class filedataReq {
  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;


  @ApiProperty({ example: '', description: 'cTab', required: false })
  @IsOptional()
  @IsString()
  cTab?: string;

  @ApiProperty({ example: 0, description: 'nCaseid', required: false })
  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  // @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  // nMasterid?: Number;

}



export class filedataRes {
  nBundledetailid?: string;
  cPath?: string;
  cPage?: string;
  cRefpage?: string;
  cFiletype?: string;
  msg?: Number;
  value?: string;
  error?: any;
}

export class DocinfoReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


}

export interface currentSessionDetail {
  cName: string;
  dStartDt: string;
  nDays: number;
  nLines: number;
  cUnicuserid: string;
  cStatus: string;
  dCreatedt: string;
  cProtocol: string;
  nCaseid: string;
  nRTSid: string;
  nSesid: string;
  cUrl: string;
  nPort: number;
  bRefresh: boolean;
  isTranscript: boolean;
  isTrans: boolean;
}