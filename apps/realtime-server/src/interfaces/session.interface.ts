import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayMaxSize, IsArray, IsBoolean, IsDate, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidationArguments, isNumber, registerDecorator } from "class-validator";
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

/** Most cases one `session/getsessionsbycaseids` call takes (the RT Production page sends them in chunks). */
export const SESSIONS_BY_CASES_MAX = 200;

/**
 * POST session/getsessionsbycaseids: the session lists of many cases in one request (the RT Production lane
 * used to ask once per case). Each id must be a UUID; the caller sees only the cases getSessionsByCaseId
 * would show them.
 */
export class SessionsByCaseIdsReq {
  @ApiProperty({ type: [String], example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'nCaseids (at most 200)', required: true })
  @IsArray()
  @ArrayMaxSize(SESSIONS_BY_CASES_MAX)
  @IsUUID('all', { each: true })
  nCaseids: string[];

  @ApiProperty({ example: '', description: 'cType: any value lists only sessions with a transcript (as getSessionsByCaseId)', required: false })
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

/** The reporter machine's address: an IPv4 dotted quad, each part 0-255 with no leading zero (192.168.1.20). */
export const REPORTER_IPV4_RE = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/;

/** A reporter-connection key that carries a value: an empty form field ('' or null) counts as not sent. */
export function reporterKeyGiven(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

/** A COM port of the venue box: "COM3" … "COM999", or a device path on a box that is not Windows (/dev/ttyUSB0). */
export const REPORTER_SERIAL_RE = /^(COM[1-9]\d{0,2}|\/dev\/[A-Za-z0-9._/-]{1,64})$/i;
/** The baud rates the COM port setting offers (the box's TRANSMITTER_BAUD_RATES, the SQL CHECK of file 12). */
export const REPORTER_BAUD_RATES: readonly number[] = Object.freeze([1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200]);
/** The 400 of a request that gives both a reporter address and a COM port: the box reads one feed. */
export const REPORTER_ONE_KIND_MESSAGE = 'Give the reporter address and port, or the COM port and baud rate, not both.';

/** cReporterIp and nReporterPort go together (and cReporterSerial with nReporterBaud): a request that carries this key without `other` is a 400. */
function WithReporterKey(other: 'cReporterIp' | 'nReporterPort' | 'cReporterSerial' | 'nReporterBaud'): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'withReporterKey',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: `${String(propertyName)} and ${other} go together: send both, or neither` },
      validator: {
        validate: (_value: unknown, args: ValidationArguments) => reporterKeyGiven((args.object as Record<string, unknown>)?.[other]),
      },
    });
  };
}

/** The 400 of a venue-box request that carries a reporter address (or COM port) but pins no protocol (DTO and service). */
export const REPORTER_PROTOCOL_MESSAGE = 'Choose the protocol (Case view or Bridge) when a reporter address is given.';

/** A request may name the reporter address or the box's COM port, never both. */
function WithOneReporterKind(): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'withOneReporterKind',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: REPORTER_ONE_KIND_MESSAGE },
      validator: {
        validate: (_value: unknown, args: ValidationArguments) => !reporterKeyGiven((args.object as Record<string, unknown>)?.cReporterIp),
      },
    });
  };
}

/** cProtocol pins the protocol: exactly 'B' (Bridge) or 'C' (Case view), as it is stored and sent to the box. */
export function reporterProtocolPinned(cProtocol: unknown): boolean {
  return cProtocol === 'B' || cProtocol === 'C';
}

/**
 * A venue-box request with a reporter address pins its protocol: the box connects to the reporter only for a
 * session whose cProtocol is 'B' or 'C' and refuses the address otherwise ('protocol-unknown'). On a direct-cloud
 * request the service refuses the reporter keys themselves, so this rule passes there.
 */
function WithReporterProtocol(): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'withReporterProtocol',
      target: target.constructor,
      propertyName: String(propertyName),
      options: { message: REPORTER_PROTOCOL_MESSAGE },
      validator: {
        validate: (_value: unknown, args: ValidationArguments) => {
          const body = args.object as Record<string, unknown>;
          return body?.cFeedSource !== 'E' || reporterProtocolPinned(body?.cProtocol);
        },
      },
    });
  };
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

  /**
   * Reporter connection of a venue-box session (cFeedSource 'E'): the reporter machine's address and TCP port.
   * With both, the box connects to that address by itself (plain TCP, no login). With neither, the reporter's
   * Eclipse connects to the box and logs in, as before. One without the other is a 400; an empty form field
   * ('' or null) counts as not sent. On a direct-cloud session the service refuses them, like nEdgeid.
   * With an address the request also pins cProtocol ('B' or 'C'): the box refuses an address without one.
   */
  @ApiProperty({ example: '192.168.1.20', description: "Reporter machine's IPv4 address (venue-box session, with nReporterPort)", required: false })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value === null ? undefined : value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  @Matches(REPORTER_IPV4_RE, { message: 'cReporterIp must be an IPv4 address like 192.168.1.20' })
  @WithReporterKey('nReporterPort')
  @WithReporterProtocol()
  cReporterIp?: string;

  // A string of digits is read as the number it names, as a form-encoded body sends it; anything else is a 400.
  @ApiProperty({ example: 2500, description: "Reporter machine's TCP port, 1-65535 (venue-box session, with cReporterIp)", required: false })
  @Transform(({ value }) => (value === '' || value === null ? undefined : typeof value === 'string' && /^\d{1,5}$/.test(value.trim()) ? parseInt(value.trim(), 10) : value), { toClassOnly: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  @WithReporterKey('cReporterIp')
  nReporterPort?: number;

  /**
   * Or a COM port of the venue box and its baud rate ("Live data · COM port"): the CAT program writes its realtime
   * output to a serial cable or a virtual COM pair and the box reads that port (8N1, no login). Both or neither;
   * never with cReporterIp / nReporterPort; like them it pins cProtocol and is refused on a direct-cloud session.
   */
  @ApiProperty({ example: 'COM3', description: 'COM port of the venue box (venue-box session, with nReporterBaud; not with cReporterIp)', required: false })
  @Transform(({ value }) => (typeof value === 'string' ? (value.trim() ? (/^com\d+$/i.test(value.trim()) ? value.trim().toUpperCase() : value.trim()) : undefined) : value === null ? undefined : value), { toClassOnly: true })
  @IsOptional()
  @IsString()
  @MaxLength(72)
  @Matches(REPORTER_SERIAL_RE, { message: 'cReporterSerial must be a COM port like COM3' })
  @WithReporterKey('nReporterBaud')
  @WithReporterProtocol()
  @WithOneReporterKind()
  cReporterSerial?: string;

  @ApiProperty({ example: 9600, description: 'Baud rate of cReporterSerial: 1200, 2400, 4800, 9600, 19200, 38400, 57600 or 115200', required: false })
  @Transform(({ value }) => (value === '' || value === null ? undefined : typeof value === 'string' && /^\d{1,6}$/.test(value.trim()) ? parseInt(value.trim(), 10) : value), { toClassOnly: true })
  @IsOptional()
  @IsInt()
  @IsIn([...REPORTER_BAUD_RATES], { message: 'nReporterBaud must be one of 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200' })
  @WithReporterKey('cReporterSerial')
  nReporterBaud?: number;
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
