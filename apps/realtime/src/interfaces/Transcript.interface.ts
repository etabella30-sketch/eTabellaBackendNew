import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { is } from "cheerio/lib/api/traversing";
import { Transform } from "class-transformer";
import { IsArray, isBoolean, IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import exp from "constants";

export class TranscriptBuilder {
  @ApiProperty({ example: null, description: '', required: true })
  @IsOptional()
  @IsItUUID()
  cTransid: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cThemeid: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cCasetype: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  @IsOptional()
  cCCaseno: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cCAlign: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cClaiment: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cRespondent: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cClaimentH: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cRespondentH: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cArbitrator: string;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsString()
  cCDay: number;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  dCDate: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cBClaimentH: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cBRespondentH: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cBClaiment: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cBRespondent: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cCasename: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  @IsOptional()
  cTCaseno: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  dTDate: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  tTTime: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cReporter: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cTitle: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cTVolume: number;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  dTranscribedDate: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cCompany: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cCompanyinfo: string;


  @ApiProperty({ example: 1, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nStartpg: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nSecondpg: number;

  @ApiProperty({ example: 25, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nLines: number;

  @ApiProperty({ example: 25, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nPages: number;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  cPath: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  @IsOptional()
  cArbitratorH: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  @IsOptional()
  cBehalfAlign: string;

  @ApiProperty({ example: 1, description: '', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  @IsOptional()
  nCSpacing: number;

  @ApiProperty({ example: 'N', description: '' })
  @IsString()
  permission: string;

  @IsItUUID()
  nMasterid: string;

}

export class fileJSONRequest {


  @ApiProperty({ example: '', description: '' })
  @IsString()
  cPath: string;

  @IsItUUID()
  nMasterid: string;

}


export class fileHTMLRequest {

  @ApiProperty({ example: '', description: '' })
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty({ example: '', description: '' })
  @IsItUUID()
  @IsOptional()
  cTransid: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  cPath: string;

  @IsItUUID()
  nMasterid: string;

}

export class TranscriptDetailRequest {
  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  cTransid: string;

  @IsItUUID()
  nMasterid: string;

}

export class ThemeRequest {

  @IsItUUID()
  nMasterid: string;

}

export class TranscriptRequest {

  @IsItUUID()
  nMasterid: string;

}

export class ThemeDetailRequest {

  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  cThemeid: string;

  @IsItUUID()
  nMasterid: string;

}


export class CaseComboRequest {

  @IsItUUID()
  nMasterid: string;

}


export class SessionComboRequest {

  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid: string;

}

export class ThemeResonce {
  cName?: string;
  cThemeid?: string;
  msg: number;
  value: string;
  error?: any
}



export class TranscriptCreationResonce {
  msg: number;
  value: string;
  nTransid?: number
  error?: any
}

export class ThemeBuilder {

  @ApiProperty({ example: null, description: '', required: true })
  @IsItUUID()
  @IsOptional()
  cThemeid: string;


  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cName: string;


  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nCFontid: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nCFontsize: number;

  @ApiProperty({ example: false, description: '', required: true })
  @IsBoolean()
  bCIsCaps: boolean;


  @ApiProperty({ example: '["C","P","B","A"]', description: '', required: true })
  @IsArray()
  @IsString({ each: true })
  jCBold: Array<string>;


  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nBFont: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nBFontsize: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  @IsOptional()
  nBLetterspacing: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  @IsOptional()
  nBLinespacing: number;

  @ApiProperty({ example: '["Q","S"]', description: '', required: true })
  @IsArray()
  @IsString({ each: true })
  jBBold: string;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nPNFont: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nPNFontsize: number;

  @ApiProperty({ example: false, description: '', required: true })
  @IsBoolean()
  bPInclude: boolean;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsString()
  cPNPosition: string;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nPNStart: number;

  @ApiProperty({ example: false, description: '', required: true })
  @IsBoolean()
  bPNSwap: boolean;



  @ApiProperty({ example: true, description: '', required: true })
  @IsBoolean()
  bLNShow: boolean;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nLFont: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nLFontsize: number;


  @ApiProperty({ example: true, description: '', required: true })
  @IsBoolean()
  bTShow: boolean;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nTFont: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nTFontsize: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsNumber()
  nHFont: number;

  @ApiProperty({ example: 12, description: '', required: true })
  @IsNumber()
  nHFontsize: number;

  @ApiProperty({ example: false, description: '', required: true })
  @IsBoolean()
  bHCover: boolean;

  @ApiProperty({ example: true, description: '', required: true })
  @IsBoolean()
  bHShow: boolean;


  @ApiProperty({ example: 'TL', description: '', required: true })
  @IsString()
  cPCaseName: string;

  @ApiProperty({ example: 'TR', description: '', required: true })
  @IsString()
  cPVolumeDate: string;

  @ApiProperty({ example: 'BL', description: '', required: true })
  @IsString()
  cPCompany: string;

  @ApiProperty({ example: 'BR', description: '', required: true })
  @IsString()
  cPCompanyInfo: string;

  @ApiProperty({ example: 'Top', description: '', required: true })
  @IsString()
  cPNAlignTB: string;

  @ApiProperty({ example: 'Right', description: '', required: true })
  @IsString()
  cPNAlignRL: string;


  @ApiProperty({ example: true, description: '', required: true })
  @IsBoolean()
  bIsdefault: boolean;

  @ApiProperty({ example: false, description: '', required: true })
  @IsBoolean()
  bLMbrand: boolean;

  // @ApiProperty({ example: 12, description: '', required: true })
  // @IsNumber()
  // nLHeight: number;

  // @ApiProperty({ example: 12, description: '', required: true })
  // @IsNumber()
  // nBTHeight: number;

  // @ApiProperty({ example: 12, description: '', required: true })
  // @IsNumber()
  // nBFHeight: number;

  // @ApiProperty({ example: 12, description: '', required: true })
  // @IsNumber()
  // nAHeight: number;

  @ApiProperty({ example: 'N', description: '' })
  @IsString()
  permission: string;

  @IsItUUID()
  nMasterid: string;
}



export class ThemeCreationResonce {
  msg: number;
  value: string;
  nThemeid?: number
  error?: any
}

export class GenerateIndexDto {

  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  cTransid: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cPath: string; // or use uploaded file

  @IsItUUID()
  nMasterid: string;
}


export class TranscriptFormDataDto {
  cTransid?: string;
  cCasetype?: string;
  cCCaseno?: string;
  cClaimentH?: string;
  cClaiment?: string;
  cRespondentH?: string;
  cRespondent?: string;
  cArbitrator?: string;
  nCDay?: number;
  cCDay?: string;
  dCDate?: Date;
  cBClaimentH?: string;
  cBClaiment?: string;
  cBRespondentH?: string;
  cBRespondent?: string;
  cCasename?: string;
  nTDay?: number;
  dTDate?: Date;
  cTVolume?: string;
  cCompany?: string;
  cCompanyinfo?: string;
  companyName?: string;
  companyInfo?: string;
  cArbitratorH?: string;
  cBehalfAlign?: string;
  cPath?: string;
  cThemeid?: string;
  cCAlign?: string;
}

export class TranscriptLineDto {
  lineno: number;
  pageno: number;
  timestamp: string;
  linetext: string;
  isIndex?: boolean;
  unicid?: string;
}

export class GenerateTranscriptDto {
  formData: TranscriptFormDataDto;
  type: '4UP' | 'FST';
  lines: TranscriptLineDto[];
  isFullSize?: boolean;
}

// interfaces/theme.interface.ts
export interface FontOption {
  nValue: number;
  cKey: string;
  jOther: { font: string };
}

export interface ThemeConfig {
  cThemeid?: string;
  cCAlign?: string;
  cCFont?: string;
  nCFontsize?: number;
  nBFont?: number;
  nBFontsize?: number;
  nBLetterspacing?: number;
  nBLinespacing?: number;
  nPNFont?: number;
  nPNFontsize?: number;
  cPNAlignTB?: string;
  cPNAlignRL?: string;
  cPNPosition?: string;
  bPNSwap?: boolean;
  nLFont?: number;
  nLFontsize?: number;
  bLNShow?: boolean;
  nTFont?: number;
  nTFontsize?: number;
  bTShow?: boolean;
  nHFont?: number;
  nHFontsize?: number;
  bHShow?: boolean;
  bHCover?: boolean;
  cPCaseName?: string;
  cPVolumeDate?: string;
  cPCompany?: string;
  cPCompanyInfo?: string;
  jCBold?: string;
  jBBold?: string;
  bCIsCaps?: boolean;
  cBehalfAlign?: string;
  nCFontid?: number;
  nPHeight?: number;
  nBFHeight?: number;
  nBTHeight?: number;
  nAHeight?: number;
  nTHeight?: number;
  bLMbrand?: boolean;
  nCSpacing?: number;
}


export interface HFDetails {
  TL: { value1: string; value2: string };
  TR: { value1: string; value2: string };
  BL: { value1: string; value2: string };
  BR: { value1: string; value2: string };
}


export class TranscriptPublishReq {
  @ApiProperty({ example: null, description: '', required: true })
  @IsItUUID()
  cTransid: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsString()
  cPath: string;


  @ApiProperty({ example: '', description: '', required: true })
  @IsBoolean()
  @IsOptional()
  isIgnoreErr: boolean;


  @ApiProperty({ example: '', description: '', required: true })
  @IsNumber()
  @IsOptional()
  errorCount: number;

  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '', description: '', required: true })
  @IsItUUID()
  nSesid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class DwdpathReq {

  @ApiProperty({ example: '', description: 'is apply to all', required: true })
  @IsString()
  cPath?: string;

  @IsItUUID()
  nMasterid?: string;
}




export class TranscriptFieldRequest {

  @ApiProperty({ example: 'Search string', description: '', required: true })
  @IsString()
  searchstr: string;

  @ApiProperty({ example: 'Column name', description: '', required: true })
  @IsString()
  column_nm: string;

  @IsItUUID()
  nMasterid: string;

}


export class DeleteTranscript {
  @ApiProperty({ example: null, description: '', required: true })
  @IsItUUID()
  cTransid: string;

  @IsItUUID()
  nMasterid: string;

}



export interface FileValidateResponse {
  isValidate: boolean,
  totalpages: number,
  totalsizeoffile: number,
  pagerotation: number,
  isLinerised: boolean
}




export class getAnnotHighlightEEP {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true })
  @IsItUUID()
  nSessionid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: '', description: 'Case name', required: true })
  @IsString()
  cCasename: string;

  @ApiProperty({ example: '', description: 'User name', required: true })
  @IsString()
  cUsername: string;


  @ApiProperty({ example: '', description: 'Transcript ', required: true })
  @IsString()
  cTranscript: string;


  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Issue IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  jIssues: string[];


  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Highlight Issues IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  jHIssues: string[];

  @ApiProperty({ example: [], description: 'Page', required: false })
  @IsArray()
  @IsNumber({}, { each: true })
  jPages: number[];


  @ApiProperty({ example: false, description: 'Advanced', required: false })
  @IsBoolean()
  @IsOptional()
  bAdvanced: boolean;

  @ApiProperty({ example: false, description: 'Cover page ', required: false })
  @IsBoolean()
  @IsOptional()
  bCoverpg: boolean;


  @ApiProperty({ example: false, description: 'Fit page ', required: false })
  @IsBoolean()
  @IsOptional()
  bFitpg: boolean;

  @ApiProperty({ example: false, description: 'Pagination page ', required: false })
  @IsBoolean()
  @IsOptional()
  bPagination: boolean;

  @ApiProperty({ example: false, description: 'Q Fact', required: false })
  @IsBoolean()
  @IsOptional()
  bQfact: boolean;

  @ApiProperty({ example: false, description: 'Quick Mark', required: false })
  @IsBoolean()
  @IsOptional()
  bQmark: boolean;

  @ApiProperty({ example: false, description: 'Timestamp', required: false })
  @IsBoolean()
  @IsOptional()
  bTimestamp: boolean;

  @ApiProperty({ example: 'A', description: 'Orientation', required: false })
  @IsString()
  cOrientation: string;

  @ApiProperty({ example: 'S', description: 'Quick Mark size ', required: true })
  @IsString()
  cQMsize: string;

  @ApiProperty({ example: 'S', description: 'Q Fact size ', required: true })
  @IsString()
  cQFsize: string;

  @ApiProperty({ example: 'A4', description: 'Page size ', required: true })
  @IsString()
  cPgsize: string;


  @ApiProperty({ example: 'N', description: 'Demo ', required: true })
  @IsOptional()
  @IsString()
  cIsDemo: string;


  @IsItUUID()
  nMasterid: string;

}


export interface FeedDataTranscript {
  msg: number;
  page: number;
  data: FeedDataLine[];
}

export interface FeedDataLine {
  time: number;
  lineIndex: number;
  lines: string[];
}