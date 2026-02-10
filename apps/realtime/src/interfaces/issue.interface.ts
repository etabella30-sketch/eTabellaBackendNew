
import { IsItUUID } from '@app/global/decorator/is-uuid-nullable.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsString, IsNumber, IsOptional, IsBoolean, IsArray, isArray, IsUUID } from 'class-validator';

class BaseSessionDetail {

  @ApiProperty({ example: 22, description: 'Case ID', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 57, description: 'Session ID', required: true })
  @IsOptional()
  @IsItUUID()
  nSessionid: string;

  @ApiProperty({ example: 3, description: 'User ID', required: true })
  @IsOptional()
  @IsItUUID()
  nUserid: string;
}



export class catListParam {
  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 0, description: 'User id', required: true })
  @IsItUUID()
  nUserid: string;


}





/**
 export class GetIssueDetailsParam {


  @ApiProperty({ example: 0, description: 'Issue Detail ID', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'Case id must be a number conforming to the specified constraints' })
  nIDid: Number;
}
 */

export class IssueRequestBody {
  @ApiProperty({ example: 1, description: 'Issue ID', required: false })
  @IsOptional()
  @IsItUUID()
  nIid?: string;

  @ApiProperty({ example: 'Issue Name', description: 'Issue Name', required: true })
  @IsString()
  cIName: string;

  @ApiProperty({ example: '000000', description: 'Color Code', required: true })
  @IsString()
  cColor: string;

  @ApiProperty({ example: 1, description: 'Issue Category ID', required: true })
  @IsItUUID()
  nICid: String;

  @ApiProperty({ example: 1, description: ' Case ID', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false })
  @IsOptional()
  dCreatedt?: string;

  @ApiProperty({ example: 1, description: 'User ID', required: true })
  @IsItUUID()
  @IsOptional()
  nUserid?: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Update Date', required: false })
  @IsOptional()
  dUpdatedt?: string;
}

export class deleteIssueRequestBody {
  @ApiProperty({ example: 1, description: 'Issue ID', required: false })
  @IsOptional()
  @IsItUUID()
  nIid?: string;


}



















export class IssueListParam extends BaseSessionDetail {
  @ApiProperty({ example: 1, description: 'Issue detail id only in edit mode' })
  @IsOptional()
  @IsItUUID()
  nIDid: string;
}


export class IssueCategoryRequestBody {
  @ApiProperty({ example: 1, description: 'Category ID', required: false })
  @IsOptional()
  @IsItUUID()
  nICid?: string;

  @ApiProperty({ example: 1, description: 'Case ID', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'Category Name', description: 'Category Name', required: true })
  @IsString()
  cCategory: string;

  @ApiProperty({ example: 1, description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false })
  @IsOptional()
  dCreateDt?: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Update Date', required: false })
  @IsOptional()
  dUpdateDt?: string;
}

export class DeleteIssueCategoryParam {
  @ApiProperty({ example: 1, description: 'Category ID', required: true })
  @IsItUUID()
  nICid: string;
}




///////////////////////////////////////////   Issue Detail   ////////////////////////////////////////////////////

class cordinates {
  x: number;
  y: number

}
class issueIds {
  nIid: string;
  serialno?: number;



}
class issueMapping {
  nIid: string;
  nRelid: number;
  nImpactid: number;
  serialno?: number;

}
class BaseIssueDetailRequestBody extends BaseSessionDetail {
  @ApiProperty({ example: 'Original Note text', description: 'Note', required: true })
  @IsString()
  cONote: string;

  @ApiProperty({ example: 'Note text', description: 'Note', required: true })
  @IsString()
  cNote: string;

  @ApiProperty({ example: 'User Note text', description: 'User Note', required: false })
  @IsOptional()
  @IsString()
  cUNote: string;

  @ApiProperty({ example: [{ nIid: 1, nRelid: 2, nImpactid: 3 }], description: 'Issue IDs', required: true })
  @IsArray()
  cIidStr: issueMapping[];

  @ApiProperty({ example: 1, description: 'Last Issue id', required: true })
  @IsItUUID()
  nLID: string;

  @ApiProperty({ example: '1', description: 'Page Number', required: true })
  @IsString()
  cPageno: string;

  @ApiProperty({ type: [cordinates], example: [{ x: 100, y: 200 }], description: 'Coordinates', required: true })
  @IsArray()
  jCordinates: cordinates[];

  @ApiProperty({ example: '1', description: 'Transcript', required: false })
  @IsOptional()
  @IsString()
  cTranscript?: string;

}

export class InsertIssueDetailRequestBody extends BaseIssueDetailRequestBody {
  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false })
  @IsOptional()
  dCreatedt?: string;
}


export class UpdateIssueDetailRequestBody extends BaseIssueDetailRequestBody {
  @ApiProperty({ example: 1, description: 'Issue Detail ID', required: false })
  @IsOptional()
  @IsItUUID()
  nIDid?: string;


}

export class DeleteIssueDetailParam {
  @ApiProperty({ example: 1, description: 'Issue Detail ID', required: true })
  @IsItUUID()
  nIDid: string;


}

export class deleteHighlightsRequestBody {
  @ApiProperty({ example: 1, description: 'Highlighted id', required: true })
  @IsItUUID()
  nHid: string;

}

export class HighlightListParam extends BaseSessionDetail {
  // @ApiProperty({ example: 1, description: 'Case ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber({}, { message: 'Case ID must be a number' })
  // nCaseid: number;

  // @ApiProperty({ example: 1, description: 'User ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber({}, { message: 'User ID must be a number' })
  // nUserid: number;

  // @ApiProperty({ example: 1, description: 'Case ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber({}, { message: 'Session ID must be a number' })
  // nSessionid: number;
}

export class InsertHighlightsRequestBody extends BaseSessionDetail {


  // @ApiProperty({ example: 1, description: 'Case ID', required: true })
  // @IsNumber()
  // nCaseid: number;

  @ApiProperty({ example: 'Highlight text', description: 'Highlight text', required: true })
  @IsString()
  cNote: string;

  // @ApiProperty({ example: 1, description: 'Session ID', required: true })
  // @IsNumber()
  // nSessionid: number;

  // @ApiProperty({ example: 1, description: 'User ID', required: true })
  // @IsNumber()
  // nUserid: number;


  @ApiProperty({ type: [cordinates], example: [{ x: 100, y: 200 }], description: 'Coordinates', required: true })
  @IsArray()
  jCordinates: cordinates[];


  @ApiProperty({ example: '[{"nIid":0}]', description: 'Issue IDs', required: true })
  @IsOptional()
  @IsArray()
  cIidStr: issueIds[];

  @ApiProperty({ example: 1, description: 'Last Issue id', required: true })
  @IsOptional()
  @IsItUUID()
  nLID: string;

  @ApiProperty({ example: '1', description: 'Page Number', required: true })
  @IsString()
  cPageno: string;

  @ApiProperty({ example: '10', description: 'Line Number', required: true })
  @IsString()
  cLineno: string;

  @ApiProperty({ example: '00:00', description: 'Timestamp', required: true })
  @IsString()
  cTime: string;

  @ApiProperty({ example: 'N', description: 'cTranscript', required: true })
  @IsOptional()
  @IsString()
  cTranscript: string;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsOptional()
  @IsNumber()
  oP: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsOptional()
  @IsNumber()
  oL: number;

  @ApiProperty({ example: '', description: 'line uniq identity', required: true })
  @IsOptional()
  @IsString()
  identity: string;

}


export class removeMultipleHighlightsReq {


  @ApiProperty({ example: [1, 2], description: 'Highlight IDs', required: true })
  @IsArray()
  jHids: string[];


  @ApiProperty({ example: 1, description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}


export class getIssueAnnotationListBody extends BaseSessionDetail {



  @ApiProperty({ example: 'A', description: 'Transcript' })
  @IsString()
  cTranscript: string;

}

export class issuedetaillist_by_issueidBody extends BaseSessionDetail {


  @ApiProperty({ example: 107, description: 'RIssue Master id', required: true })
  @IsItUUID()
  nIid: string;
}

export class isseDetailByIdBody {


  @ApiProperty({ example: 107, description: 'Issue Detail id', required: true })
  @IsItUUID()
  nIDid: string;
}
export class deleteHighlightsParam {


  @ApiProperty({ example: '', description: 'Transcript ', required: true })
  @IsString()
  cTranscript: string;


  @ApiProperty({ example: 107, description: 'Highlight  id', required: true })
  @IsItUUID()
  nHid: string;
}

export class dynamicComboReq {


  @ApiProperty({ example: 4, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nCategoryid must be a number conforming to the specified constraints' })
  nCategoryid?: Number;
}


class HissueIds {
  nIid: string;
  serialno?: number;


}

export class updateHighlightIssueIdsReq extends BaseSessionDetail {

  @ApiProperty({ example: '[{"nIid":1}]', description: 'Issue IDs', required: true })
  @IsArray()
  cDefHIssues: HissueIds[];

  @ApiProperty({ example: [1, 2], description: 'Highlight IDs', required: true })
  @IsArray()
  jHids: string[];


  @ApiProperty({ example: 1, description: 'Last Issue id', required: true })
  @IsItUUID()
  nLID: string;
}


export class getLastIssueMDL {


  @ApiProperty({ example: '[]', description: 'Issue IDs', required: true })
  @IsString()
  jIids: string;

}



export class getAnnotHighlightEEP {

  @ApiProperty({ example: 1, description: 'Session ID', required: true })
  @IsItUUID()
  nSessionid: string;

  @ApiProperty({ example: 1, description: 'Case ID', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: 'User ID', required: true })
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


  @ApiProperty({ example: [], description: 'Issue IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  jIssues: string[];


  @ApiProperty({ example: '[]', description: 'Highlight Issues IDs', required: false })
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

}







export class defaultSetupReq {


  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nUserid: string;


  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nLID: string;

  @ApiProperty({ example: '[]', description: '' })
  @IsString()
  jDefault: string;


  @ApiProperty({ example: 'H', description: '' })
  @IsString()
  cFlag: 'I' | 'H';

}




export class logJoinReq {

  @ApiProperty({ example: 0, description: 'User id', required: true })
  @IsItUUID()
  nUserid?: string;


  @ApiProperty({ example: 0, description: 'Session id', required: true })
  @IsItUUID()
  nSesid?: string;


  @ApiProperty({ example: 'J', description: 'Status', required: true })
  @IsString()
  cStatus?: string;


  @ApiProperty({ example: 'J', description: 'Status', required: true })
  @IsString()
  cSource?: string;

}






export class updateDetailIssueNote {


  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nIDid: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  cNote: string;

}



export class annotationsReq {


  @ApiProperty({ example: 1, description: 'nSessionid id', required: true })
  @IsOptional()
  @IsItUUID()
  nSessionid: string;



  @ApiProperty({ example: 1, description: 'nCaseid id', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: 'nCaseid id', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 'D', description: 'Transcript', required: false })
  @IsOptional()
  @IsString()
  cTranscript?: string;

}