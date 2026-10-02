import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsDate, IsIn, IsNumber, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf, isNumber } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { AckWarningsFlag } from "../services/transcript-completeness/ack-warnings";





export class SessionListReq {


  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;

  @IsOptional()
  @IsString()
  dDate: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}

export interface UserConnection {
  socketId: string;
  rooms: Set<string>;
}



export class CaseListReq {


  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}


export class TranscriptFileReq {
  @ApiProperty({ example: '', description: 'nCaseid', required: true })
  @IsString()
  nCaseid?: string;
}


export class SessionDataReq {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}
export class SessionDataV2Req {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;



}
export class SessionByCaseIdReq {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: '', description: 'cType', required: true })
  @IsOptional()
  @IsString()
  cType?: string;


}

export class sessionDertailReq {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;


}




export class SessionBuilderReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
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
  nDays: Number;

  @ApiProperty({ example: 0, description: 'No of lines', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nLines must be a number conforming to the specified constraints' })
  nLines: Number;

  @ApiProperty({ example: 0, description: 'Page no', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPageno must be a number conforming to the specified constraints' })
  nPageno: Number;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  permission: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

  @ApiProperty({ example: 'C', description: 'Feed protocol (C Case view / B Bridge)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^[BC]$/, { message: 'cProtocol must be B or C' })
  cProtocol?: string;

  // IANA zone of the hearing venue (e.g. Europe/London) — Case view sessions.
  // Line timestamps and the start scheduler follow it; absent = server zone.
  @ApiProperty({ example: 'Europe/London', description: 'Hearing timezone (IANA)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_+\-\/]+$/, { message: 'cTimezone must be an IANA zone name' })
  cTimezone?: string;

}




export class SessionDeleteReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  // The frontend sessionend call sends nCaseid alongside nSesid; the global
  // forbidNonWhitelisted pipe would 400 the request without this field.
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: false })
  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  @ApiProperty({ example: 'D', description: 'Delete', required: true })
  @IsOptional()
  @IsString()
  permission: string;
}

/**
 * One-time credentials used to route an Eclipse 12 Bridge feed to a case.
 * Mirrors the frontend `CreateEclipseSessionRequest` contract exactly — the
 * global forbidNonWhitelisted pipe rejects any undeclared field.
 */
export class EclipseSessionCreateReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: false })
  @IsOptional()
  @IsItUUID()
  nSesid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 'CASE 1', description: 'Case number', required: true })
  @IsString()
  cCaseno: string;

  @ApiProperty({ example: 'Hearing day 1', description: 'Session name', required: true })
  @IsString()
  cName: string;

  @ApiProperty({ example: '2023-04-26T14:20:00Z', description: 'Start Date', required: true })
  @IsString()
  dStartDt: string;

  @ApiProperty({ example: 1, description: 'No of days', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nDays must be a number conforming to the specified constraints' })
  nDays: number;

  @ApiProperty({ example: 25, description: 'No of lines', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nLines must be a number conforming to the specified constraints' })
  nLines: number;

  @ApiProperty({ example: 1, description: 'Page no', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPageno must be a number conforming to the specified constraints' })
  nPageno: number;

  @ApiProperty({ example: 'I', description: 'Permission', required: true })
  @IsString()
  permission: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

  @ApiProperty({ example: 'B', description: 'cProtocol', required: false })
  @IsOptional()
  @IsString()
  cProtocol?: string;

  @ApiProperty({ example: true, description: 'bRefresh', required: false })
  @Transform(({ value }) => (value ? true : false), { toClassOnly: true })
  @IsOptional()
  @IsBoolean()
  bRefresh?: any;

  // IANA zone of the hearing venue (e.g. Europe/London). Line timestamps and
  // the session's wall-clock all derive from this; absent = server timezone.
  @ApiProperty({ example: 'Europe/London', description: 'Hearing timezone (IANA)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_+\-\/]+$/, { message: 'cTimezone must be an IANA zone name' })
  cTimezone?: string;

  @ApiProperty({ example: 'courtroom-1', description: 'Eclipse Socket Connection username', required: true })
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9._-]+$/)
  cEclipseUsername: string;

  // Required as before for a direct-to-cloud session. A venue-box session (cFeedSource 'E') may leave it out
  // and get a generated one (S-D17); a typed one is then at least 12 characters (checked by the service).
  @ApiProperty({ description: 'Eclipse Socket Connection password (optional for a venue-box session: generated)', required: true, writeOnly: true })
  @ValidateIf((o) => o?.cFeedSource !== 'E' || (o?.cEclipsePassword !== undefined && o?.cEclipsePassword !== null))
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @Matches(/^[^\r\n]+$/, { message: 'cEclipsePassword must not contain a line break' })
  cEclipsePassword: string;

  /**
   * Feed path (spec §4.2 step 2): 'E' = through the venue box `nEdgeid`. Absent (or 'D') = direct to cloud,
   * today's request exactly.
   */
  @ApiProperty({ example: 'E', description: "Feed path: 'E' venue box (with nEdgeid), 'D' or absent direct to cloud", required: false })
  @IsOptional()
  @IsIn(['D', 'E'])
  cFeedSource?: 'D' | 'E';

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Venue box (RtEdgeNode) for cFeedSource E', required: false })
  @IsOptional()
  @IsItUUID()
  nEdgeid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Hearing operator (a case admin) of a venue-box session', required: false })
  @IsOptional()
  @IsItUUID()
  nHearingOpid?: string;
}


export class SessionEndReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  // The frontend sessionend call sends nCaseid alongside nSesid; the global
  // forbidNonWhitelisted pipe would 400 the request without this field.
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: false })
  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  @ApiProperty({ example: 'C', description: 'Delete', required: true })
  @IsOptional()
  @IsString()
  permission: string;
}


export class SessionStartReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;
}


export class setServerReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'server id', required: true })
  @IsItUUID()
  nRTSid: string;
}





export class ServerBuilderReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nRTSid', required: true })
  @IsItUUID()
  nRTSid: string;

  @ApiProperty({ example: '', description: 'Url', required: true })
  @IsString()
  cUrl: string;

  @ApiProperty({ example: 0, description: 'Port', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPort must be a number conforming to the specified constraints' })
  nPort: Number;


  @ApiProperty({ example: '', description: 'Name', required: true })
  @IsString()
  cName: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  permission: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}





export class checkRunningSessionReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

  @ApiProperty({ example: 0, description: 'date', required: true })
  @IsString()
  dDate: string;
}


export class createUserInterfaceReq {

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}



export class userListReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;


}



export class SearchedUserListReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: '', description: 'Search', required: true })
  @IsString()
  cSearch: string;


}


export class getConnectivityLogReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 0, description: 'nPage', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nPage must be a number conforming to the specified constraints' })
  nPage: Number;

  @ApiProperty({ example: 0, description: 'message', required: true })
  @IsOptional()
  @IsString()
  dDate: string;

  @ApiProperty({ example: 0, description: 'search', required: true })
  @IsOptional()
  @IsString()
  cSearch: string;

}
export class conectivityLog {
  // let log = { type: types[type], date: new Date().toISOString(), message: message };
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nId', required: true })
  @IsItUUID()
  nId: string;

  @ApiProperty({ example: 0, description: 'date', required: true })
  @IsString()
  date: string;

  @ApiProperty({ example: 0, description: 'message', required: true })
  @IsString()
  message: string;

  @ApiProperty({ example: 'D', description: 'cPermission', required: true })
  @IsString()
  cPermission: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nLogid' })
  @IsItUUID()
  nLogid: string;
}

export class deleteConectivityLog {
  // let log = { type: types[type], date: new Date().toISOString(), message: message };


  @ApiProperty({ example: 'D', description: 'cPermission', required: true })
  @IsString()
  cPermission: string;



  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nLogid' })
  @IsItUUID()
  nLogid: string;
}

export class assignMentReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nRTSid', required: true })
  @IsItUUID()
  nRTSid: string;

  @ApiProperty({ example: '', description: 'jUserid', required: true })
  @IsString()
  jUserid: any


  @ApiProperty({ example: '', description: 'cNotifytype', required: true })
  @IsString()
  cNotifytype: string;

  @ApiProperty({ example: '', description: 'cUnicuserid', required: true })
  @IsString()
  cUnicuserid?: string;

}


export class CaseListRes {
  nCaseid: string;
  cCasename: string;
  nSectionid: string;
  dUploadDt;
}




export class caseDetailSEC {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nCaseid: string;

}


export class sectionDetailSEC {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nSectionid: string;
}




export class bundleDetailSEC {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nBundleid: string;


}






export class checkDuplicacySEC {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nBundleid: string;


  @ApiProperty({ example: [[1, 2, 'dsf', true]], description: '' })
  @IsString()
  d: string;

}

export class publishSEC {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: 1, description: '' })
  @IsString()
  cStatus: string;

}





export class userSesionData {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;


}






export class updateTransStatusMDL {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'C', description: 'Delete', required: true })
  @IsOptional()
  @IsString()
  cFlag: string;

  @ApiProperty({ example: 'C', description: 'Protocol', required: true })
  @IsOptional()
  @IsString()
  cProtocol: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true })
  @IsItUUID()
  nUserid: string;

  /** D16: acknowledge a 'W' venue session's incidents (services/transcript-completeness/ack-warnings.ts). */
  @AckWarningsFlag()
  bAckWarnings?: boolean;
}



export class DocInfoReq {
  @ApiProperty({ example: '', description: 'Tab', required: true })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cTab: string;

  @ApiProperty({ example: '', description: 'Case id', required: true })
  @IsString()
  nCaseid?: string;

}


export class DocInfoRes {
  nBundledetailid?: string;
  cName?: string;
  cPath?: string;
  cPage?: string;
  msg?: number
  value?: string;
  error?: any;
}



export class synsSessionsMDL {

  @ApiProperty({ example: '', description: 'jSessions', required: true })
  @IsString()
  jSessions: string;

  @ApiProperty({ example: '', description: 'jUsers', required: true })
  @IsString()
  jUsers: string;

  @ApiProperty({ example: '', description: 'jServers', required: true })
  @IsString()
  jServers: string;

  @ApiProperty({ example: '', description: 'jDeleted', required: true })
  @IsString()
  jDeleted: string;

}


export class logJoinReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true })
  @IsItUUID()
  nUserid?: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid?: string;


  @ApiProperty({ example: 'J', description: 'Status', required: true })
  @IsString()
  cStatus?: string;


  @ApiProperty({ example: 'J', description: 'Status', required: true })
  @IsString()
  cSource?: string;

}





export class RTLogsReq {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true })
  @IsItUUID()
  nCaseid?: string;


  @ApiProperty({ example: '', description: 'dStartDt', required: true })
  @IsString()
  dStartDt: string;


  @ApiProperty({ example: '', description: 'dEndDt', required: true })
  @IsString()
  dEndDt: string;

}





export class RTLogsSessionUserReq {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid id', required: true })
  @IsItUUID()
  nSesid?: string;

}


export class RTLogsUserLGReq {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid id', required: true })
  @IsItUUID()
  nSesid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid id', required: true })
  @IsItUUID()
  nUserid?: string;


}



export class filedataReq {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundle detail id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;


  @ApiProperty({ example: '', description: 'cTab', required: false })
  @IsOptional()
  @IsString()
  cTab?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: false })
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


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


}


export class ActiveSessionReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nCaseid', required: true })
  @IsItUUID()
  nCaseid: string;
}



export class ActiveSessionDetailReq {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nSesid' })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nUserid' })
  @IsItUUID()
  nUserid: string;
}

/** GET session/eclipse/credential — super admin reads a live session's Eclipse login. */
export class EclipseCredentialReq {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session id', required: true })
  @IsItUUID()
  nSesid: string;
}
