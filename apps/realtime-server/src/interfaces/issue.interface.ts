
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsString, IsNumber, IsOptional, IsBoolean, IsArray, isArray, ValidateNested } from 'class-validator';
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

class BaseSessionDetail {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true })
  @IsOptional()
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true })
  @IsOptional()
  @IsItUUID()
  nSessionid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsOptional()
  @IsItUUID()
  nUserid: string;
}



export class catListParam {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User id', required: true })
  @IsItUUID()
  nUserid: string;


}


export class GetIssueDetailsParam {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: false })
  @IsItUUID()
  @IsOptional()
  nIDid?: string;
}

export class GetIssueDetailsGroupedParam extends BaseSessionDetail {
  // @ApiProperty({ example: 1, description: 'Case ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber()
  // nCaseid: number;

  // @ApiProperty({ example: 8, description: 'Session ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber()
  // nSessionid: number;

  // @ApiProperty({ example: 9, description: 'User ID', required: true })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber()
  // nUserid: number;
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
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID', required: false })
  @IsItUUID()
  @IsOptional()
  nIid?: string;

  @ApiProperty({ example: 'Issue Name', description: 'Issue Name', required: true })
  @IsString()
  cIName: string;

  @ApiProperty({ example: '000000', description: 'Color Code', required: true })
  @IsString()
  cColor: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Category ID', required: true })
  @IsItUUID()
  nICid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: ' Case ID', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Create Date', required: false })
  @IsOptional()
  dCreatedt?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  @IsOptional()
  nUserid?: string;

  @ApiProperty({ example: '2023-05-10T12:00:00Z', description: 'Update Date', required: false })
  @IsOptional()
  dUpdatedt?: string;
}

export class deleteIssueRequestBody {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID', required: false })
  @IsItUUID()
  @IsOptional()
  nIid?: string;


  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000"], description: 'Issue ID' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jIids?: string[];


}




export class IssueListParam extends BaseSessionDetail {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue detail id only in edit mode' })
  @IsItUUID()
  @IsOptional()
  nIDid: string;
}


export class IssueCategoryRequestBody {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Category ID', required: false })
  @IsItUUID()
  @IsOptional()
  nICid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'Category Name', description: 'Category Name', required: true })
  @IsString()
  cCategory: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
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
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Category ID', required: true })
  @IsItUUID()
  nICid: string;
}




///////////////////////////////////////////   Issue Detail   ////////////////////////////////////////////////////

class cordinates {
  x: number;
  y: number

}
class issueIds {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsItUUID()
  nIid: string;

  @IsOptional()
  @Transform(({ value }) => String(value), { toClassOnly: true })
  @IsString()
  serialno: string;
}

class issueMapping {
  nIid: string;
  nRelid: number;
  nImpactid: number;

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



  @ApiProperty({ example: '', description: 'Issue IDs', required: true })
  @IsArray()
  cIidStr: issueMapping[];



  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Last Issue id', required: true })
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
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: false })
  @IsItUUID()
  @IsOptional()
  nIDid?: string;


}

export class DeleteIssueDetailParam {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail ID', required: true })
  @IsItUUID()
  nIDid: string;


}

export class deleteHighlightsRequestBody {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Highlighted id', required: true })
  @IsItUUID()
  nHid: string;


  @ApiProperty({ example: '', description: 'masterid', required: false })
  @IsOptional()
  @IsString()
  nMasterid: string;

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


  // @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Case ID', required: true })
  // @IsItUUID()
  // nCaseid: string;

  @ApiProperty({ example: 'Highlight text', description: 'Highlight text', required: true })
  @IsString()
  cNote: string;

  // @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Session ID', required: true })
  // @IsItUUID()
  // nSessionid: string;

  // @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  // @IsItUUID()
  // nUserid: string;

  /*
    @ApiProperty({ example: ['550e8400-e29b-41d4-a716-446655440000'], description: 'Coordinates', required: true })
    @IsArray()
    jCordinates: cordinates[];
  
    @ApiProperty({
      type: [issueIds],
      description: 'Issue IDs',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => issueIds)
    cIidStr: issueIds[];
  
    // @ApiProperty({ example: '[{"nIid":"550e8400-e29b-41d4-a716-446655440000"}]', description: 'Issue IDs', required: true })
    // @IsArray()
    // cIidStr: issueIds[];
  
    @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Last Issue id', required: true })
    @IsItUUID()
    nLID: string;*/

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
  oP?: number;

  @ApiProperty({ example: 1, description: '', required: true })
  @IsOptional()
  @IsNumber()
  oL?: number;

  @ApiProperty({ example: '', description: 'line uniq identity', required: true })
  @IsOptional()
  @IsString()
  identity: string;

  @ApiProperty({ example: '', description: 'masterid', required: false })
  @IsOptional()
  @IsString()
  nMasterid: string;
}


export class removeMultipleHighlightsReq {


  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"], description: 'Highlight IDs', required: true })
  @IsArray()
  jHids: string[];


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}


export class getIssueAnnotationListBody extends BaseSessionDetail {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'nIDid', required: false })
  @IsOptional()
  @IsItUUID()
  nIDid?: string;

  @ApiProperty({ example: 0, description: 'jIssues', required: false })
  @IsOptional()
  @IsString()
  jIssues?: string;

  @ApiProperty({ example: 0, description: 'jPages', required: false })
  @IsOptional()
  @IsString()
  jPages?: string;

  @ApiProperty({ example: 'A', description: 'Transcript' })
  @IsString()
  cTranscript: string;

}

export class issuedetaillist_by_issueidBody extends BaseSessionDetail {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'RIssue Master id', required: true })
  @IsItUUID()
  nIid: string;
}

export class isseDetailByIdBody {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue Detail id', required: true })
  @IsItUUID()
  nIDid: string;
}
export class deleteHighlightsParam {


  @ApiProperty({ example: '', description: 'Transcript ', required: true })
  @IsString()
  cTranscript: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Highlight  id', required: true })
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


}

export class updateHighlightIssueIdsReq extends BaseSessionDetail {

  @ApiProperty({ example: '[{"nIid":"550e8400-e29b-41d4-a716-446655440000","cLast":0}]', description: 'Issue IDs', required: true })
  @IsArray()
  cDefHIssues: HissueIds[];

  @ApiProperty({ example: ["550e8400-e29b-41d4-a716-446655440000", "550e8400-e29b-41d4-a716-446655440001"], description: 'Highlight IDs', required: true })
  @IsArray()
  jHids: string[];


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Last Issue id', required: true })
  @IsItUUID()
  nLID: string;
}


export class getLastIssueMDL {


  @ApiProperty({ example: '[]', description: 'Issue IDs', required: true })
  @IsString()
  jIids: string;

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

}





export class defaultSetupReq {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nUserid: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
  @IsItUUID()
  nLID: string;

  @ApiProperty({ example: '[]', description: '' })
  @IsString()
  jDefault: string;


  @ApiProperty({ example: 'H', description: '' })
  @IsString()
  cFlag: 'I' | 'H';

}






export class updateDetailIssueNote {


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: '' })
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
  nSessionid: number;



  @ApiProperty({ example: 1, description: 'nCaseid id', required: true })

  @IsOptional()
  @IsItUUID()
  nCaseid: number;

  @ApiProperty({ example: 1, description: 'nCaseid id', required: true })

  @IsOptional()
  @IsItUUID()
  nUserid: number;

  @ApiProperty({ example: 'D', description: 'Transcript', required: false })
  @IsOptional()
  @IsString()
  cTranscript?: string;

}


export class GetQfactList extends BaseSessionDetail { }



export class GetQmarkList extends BaseSessionDetail { }

export class GetAllFactList extends BaseSessionDetail { }

export class CheckNavigatedata extends BaseSessionDetail { }

export class IssueByidParam extends BaseSessionDetail {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue detail id only in edit mode' })
  @IsItUUID()
  @IsOptional()
  nIid: string;
}
class issueSequence {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Issue ID' })
  @IsString()
  nIid: string;

  @ApiProperty({ example: 1, description: 'Sequence' })
  @IsNumber()
  nSequence: number;
}
export class issueSequenceParam {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ type: [issueSequence], description: 'Issue Sequence', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => issueSequence)
  jIssues: issueSequence[];

}


class claimSequence {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID' })
  @IsString()
  nICid: string;

  @ApiProperty({ example: 1, description: 'Sequence' })
  @IsNumber()
  nSequence: number;
}

export class claimSequenceParam {

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ type: [claimSequence], description: 'claim Sequence', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => claimSequence)
  jClaims: claimSequence[];

}


export class UpdateClaimRequestBody {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID', required: false })
  @IsItUUID()
  @IsOptional()
  nICid?: string;

  @ApiProperty({ example: 'Category Name', description: 'Category Name', required: true })
  @IsString()
  cCategory: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  @IsOptional()
  nUserid?: string;

}



export class deleteClaimRequestBody {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Claim ID', required: false })
  @IsItUUID()
  @IsOptional()
  nICid?: string;

}

