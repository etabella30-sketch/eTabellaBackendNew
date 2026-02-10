import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUUID, ValidateIf } from "class-validator";


export class SectionReq {

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}




export class SectionRes {
  nSectionid?: string;
  cFolder?: Number;
  cFoldertype?: Number;
  msg?: Number;
  value?: string;
  error?: any;
}




export class BundleReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundleid Number', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nBundleid?: string | null;

  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;

  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @IsOptional()
  @IsString()
  jElasticBundles: string;

  @IsItUUID()
  nMasterid?: string;

}

export class BundleRes {
  nBundleid?: string;
  nParentBundleid?: string;
  cBundlename?: string;
  cBundletag?: string;
  msg?: Number;
  value?: string;
  error?: any;
}





export class BundleDetailReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'Page Number', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;


  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cSearch: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cFiletype: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  searchName: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cSortby: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cSorttype: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  contentType: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nStarttabid: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nEndtabid: string;



  @ApiProperty({ example: 1, description: '', required: false })
  @IsOptional()
  @IsString()
  jFTypes: string;

  @ApiProperty({ example: 1, description: '', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @IsItUUID()
  nMasterid?: string;

}




export class BundleDetailRes {
  nBundledetailid?: string;
  nBundleid?: string;
  cName?: string;
  cTab?: string;
  cExhibitno?: string;
  cPage?: string;
  cRefpage?: string;
  cFilesize?: string;
  cFiletype?: string;
  cDescription?: string;
  msg?: Number;
  value?: string;
  error?: any;
}


export class BundleLinksRes {
  nBundledetailid?: string;
  f?: boolean;
  d?: boolean;
  w?: boolean;
  fl?: boolean;
  msg?: Number;
  value?: string;
  error?: any;
}






export class TeamUsersReq {

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}



export class TeamUsersRes {
  nTeamid?: string;
  cTeamname?: string;
  cFlag?: string;
  cClr?: string;
  users?: any;
  msg?: Number;
  value?: string;
  error?: any;
}





export class BundlesPermissionReq {

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @IsItUUID()
  nMasterid?: string;

}




export class BundlesPermissionRes {
  nUserid?: string;
  msg?: Number;
  value?: string;
  error?: any;
}








export class bundleTypesReq {

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsItUUID()
  nSectionid?: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid?: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cSearch: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  searchName: string;


  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cFiletype: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  contentType: string;


  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nStarttabid: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nEndtabid: string;

  @ApiProperty({ example: 1, description: '', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @IsItUUID()
  nMasterid?: string;

}




export class bundleTypesRes {
  nUserid?: string;
  msg?: Number;
  value?: string;
  nTotal?: Number;
  cFiletype?: string;
  error?: any;
}








export class pagginationReq {

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsItUUID()
  nBundledetailid?: string;

  @IsItUUID()
  nMasterid?: string;

}




export class pagginationRes {
  nUserid?: string;
  msg?: Number;
  value?: string;
  cPage?: Number;
  cRefpage?: Number;
  jPagination?: any;
  error?: any;
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

  @ApiProperty({ example: 'M', description: 'cType', required: false })
  @IsOptional()
  @IsString()
  cType?: string;

  @ApiProperty({ example: 0, description: 'nCaseid', required: false })
  @IsOptional()
  @IsItUUID()
  nCaseid?: string;

  @IsItUUID()
  nMasterid?: string;

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



export class recentFileReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid?: string;


  @ApiProperty({ example: 'M', description: 'cType', required: false })
  @IsOptional()
  @IsString()
  cType?: string;


  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsOptional()
  @IsItUUID()
  nSectionid?: string;

  @IsItUUID()
  nMasterid?: string;

}






export class recentFileRes {
  nBundledetailid?: string;
  cName?: string;
  cTab?: string;
  cPage?: string;
  cRefpage?: string;
  cFiletype?: string;
  msg?: Number;
  value?: string;
  error?: any;
}




export class deleteRecentReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid?: string;


  @ApiProperty({ example: 'M', description: 'cType', required: false })
  @IsOptional()
  @IsString()
  cType?: string;

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsOptional()
  @IsItUUID()
  nSectionid?: string;

  @IsItUUID()
  nMasterid?: string;
}


export class deleteRecentRes {
  msg?: Number;
  value?: string;
  error?: any;
}



export class BundletagReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsOptional()
  @IsItUUID()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;

}

export class BundletagRes {
  nBundleid?: string;
  cBundletag?: string;
  msg?: Number;
  value?: string;
  error?: any;
}


export class BundletabReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundleid id', required: true })
  @IsItUUID()
  nBundleid: string;


  @IsItUUID()
  nMasterid?: string;

}

export class BundletabRes {
  nBundledetailid?: string;
  cTab?: string;
  cPage?: string;
  msg?: Number;
  value?: string;
  error?: any;
}

export class checkIssuetagReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsOptional()
  @IsItUUID()
  nSectionid: string;
  
  @ApiProperty({ example: 0, description: 'Bundle id', required: true })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;

  @IsItUUID()
  nMasterid?: string;

}


export class displayReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid?: string;

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;
  
  @ApiProperty({ example: 0, description: 'Bundle id', required: true })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;

  @IsItUUID()
  nMasterid?: string;

}


export class displayFilesReq {

  @ApiProperty({ example: 0, description: 'Contact id', required: false })
  @IsItUUID()
  @IsOptional()
  nContactid?: string;

  @ApiProperty({ example: 0, description: 'Issue id', required: false })
  @IsItUUID()
  @IsOptional()
  nIssueid?: string;

  @ApiProperty({ example: 0, description: 'Tag id', required: false })
  @IsItUUID()
  @IsOptional()
  nTagid?: string;

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'jFilters', required: true })
  @IsOptional()
  @IsString()
  jFilter: string;

  @IsItUUID()
  nMasterid?: string;

}





export class BundleLinksReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional() // <- this controls whether null is allowed
  @IsItUUID()
  nBundleid?: string;

  @IsItUUID()
  nMasterid?: string;

}



export class FileLinkReq {

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: true })
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: 'FL', description: 'FL', required: true })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cFlag: string;

  @IsItUUID()
  nMasterid?: string;

}



export class BundleUploadReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'UPid id', required: false })
  @IsItUUID()
  nUPid?: string;

  @IsItUUID()
  nMasterid?: string;

}


export class shareSectionbundleReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundledetailid: string;

  @ApiProperty({ example: false, description: 'Is annotation', required: false })
  @IsBoolean()
  bIsannotation: boolean;

  @ApiProperty({ example: false, description: 'Is Notification', required: false })
  @IsBoolean()
  bIsalert: boolean;

  @ApiProperty({ example: [], description: 'Share user ids', required: false })
  @IsString({ each: true })
  @IsArray()
  jUsers: string[];


  @ApiProperty({ example: [], description: 'Share ids', required: false })
  @IsArray()
  @IsOptional()
  jShareids: any[];

  @IsItUUID()
  nMasterid?: string;

}



export class getbundleSharedReq {


  @ApiProperty({ example: 1, description: 'nSectionid' })
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: 1, description: 'nSectionid' })
  @IsItUUID()
  @IsOptional()
  nUserid?: string;



  @IsItUUID()
  nMasterid?: string;

}


export class shareUserbundleReq {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundledetailid: string;

  @IsItUUID()
  nMasterid?: string;
}




export class getFileids {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;


  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsString()
  @IsOptional()
  cFiletype: string;


  @IsItUUID()
  nMasterid?: string;
}

export class getFiletypes {

  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: '', description: 'Bundle ids', required: false })
  @IsString()
  @IsOptional()
  jBids: string;


  @ApiProperty({ example: '', description: 'Bundle detail ids', required: false })
  @IsString()
  @IsOptional()
  jBDids: string;


  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsString()
  @IsOptional()
  cFiletype: string;


  @IsItUUID()
  nMasterid?: string;
}



export class insertRecentReq {

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsItUUID()
  nBDid: string;

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;


  @ApiProperty({ example: 'M', description: 'cType', required: false })
  @IsString()
  cType: string;

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsOptional()
  @IsItUUID()
  nSectionid?: string;

  @IsItUUID()
  nMasterid?: string;
}



export class insertRecentRes {
  msg?: Number;
  value?: string;
  error?: any;
}
