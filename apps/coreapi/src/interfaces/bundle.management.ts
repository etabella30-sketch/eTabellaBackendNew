import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { is } from "cheerio/lib/api/traversing";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";


export class SectionBuildReq {

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsItUUID()
  @IsOptional()
  nSectionid?: string;


  @ApiProperty({ example: '', description: 'Folder Name', required: true })
  @IsString()
  @IsNotEmpty()
  cFolder: string;

  @ApiProperty({ example: '', description: 'Folder type', required: true })
  @IsString()
  @IsNotEmpty()
  cFoldertype: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'N', description: 'Permission', required: true })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}





export class SectionBuildRes {
  nSectionid?: string;
  msg?: Number;
  value?: string;
  error?: any;
}



export class BundleBuildReq {

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nBundleid?: string;


  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: '', description: 'Bundle Name', required: true })
  @IsString()
  @IsNotEmpty()
  cBundlename: string;


  @ApiProperty({ example: 0, description: 'Pparent Bundle id', required: false })
  @IsItUUID()
  @IsOptional()
  nParentBundleid?: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'N', description: 'Permission', required: true })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}




export class BundleBuildRes {
  nBundleid?: string;
  msg?: Number;
  value?: string;
  error?: any;
}





export class FileRenameReq {

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  nBundleid?: string;


  @ApiProperty({ example: 0, description: 'Section id', required: true })
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: 0, description: 'Bundle id', required: true })
  @IsItUUID()
  nBundledetailid?: string;

  @ApiProperty({ example: '', description: 'File Name', required: true })
  @IsString()
  @IsNotEmpty()
  cFilename: string;


  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}



export class FileRenameRes {
  msg?: Number;
  value?: string;
  error?: any;
}




export class PermissionReq {

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'Bundle Detail id', required: true })
  @IsOptional()
  @IsItUUID()
  nBundledetailid?: string;

  @ApiProperty({ example: 0, description: 'User id', required: true })
  @IsOptional()
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 0, description: 'Team id', required: true })
  @IsItUUID()
  nTeamid: string;

  @ApiProperty({ example: true, description: 'Bundle id', required: true })
  @IsBoolean()
  bPermit?: boolean;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}

export class PermissionRes {
  msg?: Number;
  value?: string;
  error?: any;
}






export class DeleteBundlesReq {

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true })
  @IsString()
  jFolders: string;

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true })
  @IsString()
  jFiles: string;  // Changed to an array of integers

  @IsItUUID()
  nMasterid?: string;
}



export class PasteBundlesReq {

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true })
  @IsString()
  jFolders: string;

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true })
  @IsString()
  jFiles: string;  // Changed to an array of integers


  @ApiProperty({ example: 'Cut/Copy', description: 'type Cut/Copy must be a number string conforming to the specified constraints', required: true })
  @IsString()
  type: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nSectionid: string;  // Changed to an array of integers



  @IsItUUID()
  nMasterid?: string;
}



export class UndoBundlesReq {

  @ApiProperty({ example: '{1,2,3}/[[1,2],[2,3]]', description: 'Bundle ids as PostgreSQL array string', required: true })
  @IsString()
  jFolders: any;

  @ApiProperty({ example: '{1,2,3}/[[1,2],[2,3]]', description: 'Bundle detail ids as PostgreSQL array string', required: true })
  @IsString()
  jFiles: any;  // Changed to an array of integers

  @ApiProperty({ example: 'Cut/Copy', description: 'type Cut/Copy must be a number string conforming to the specified constraints', required: true })
  @IsString()
  type: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nBundleid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nSectionid: string;  // Changed to an array of integers

  @IsItUUID()
  nMasterid?: string;
}


/*
class BundleMaster {
  @ApiProperty({ example: 0, description: 'Bundle id', required: true })
  @IsNumber()
  id: number;
}


class BundleDetail {
  @ApiProperty({ example: 0, description: 'BundleDetail id', required: true })
  @IsNumber()
  id: number;
}

export class DeleteBundlesReq {

  @ApiProperty({ type: [BundleMaster], description: 'User Details', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleMaster)
  jFolders: BundleMaster[];

  @ApiProperty({ type: [BundleDetail], description: 'User Details', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BundleDetail)
  jFiles: BundleDetail[];

  @IsNumber()
  nMasterid?: number;
}*/

export class DeleteBundlesRes {
  msg: Number;
  value: string;
  error?: any;
}


export class PasteBundlesRes {
  msg: Number;
  value: string;
  error?: any;
  data?: any;
}


export class UndoBundlesRes {
  msg: Number;
  value: string;
  error?: any;
}






export class updateBundleDetailReq {

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsItUUID()
  nBundledetailid?: string;

  @ApiProperty({ example: '', description: 'Exhibit no', required: true })
  @IsString()
  cExhibitno: string;

  @ApiProperty({ example: '', description: 'File name', required: true })
  @IsString()
  cFilename: string;

  @ApiProperty({ example: '', description: 'Description', required: true })
  @IsString()
  cDescription: string;

  @ApiProperty({ example: '', description: 'Interest date', required: true })
  @IsString()
  dIntrestDt: string;

  @ApiProperty({ example: '', description: 'Tab date', required: true })
  @IsString()
  cTab: string;

  @ApiProperty({ example: '', description: 'Author', required: true })
  @IsString()
  @IsOptional()
  cAuthor: string;


  @IsItUUID()
  nMasterid?: string;

}


export class updateBundleDetailRes {
  msg: Number;
  value: string;
  error?: any;
}







export class updateBundleReq {

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: '', description: 'Bundle tag', required: true })
  @IsString()
  @IsNotEmpty()
  cBundletag: string;

  @ApiProperty({ example: false, description: 'Bundle tag', required: true })
  @IsBoolean()
  @IsOptional()
  bisAutoassign: boolean;

  @IsItUUID()
  nMasterid?: string;

}



export class updateTabReq {

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: false })
  @IsItUUID()
  nBundledetailid?: string;

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: true })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: true })
  @IsItUUID()
  nSectionid?: string;

  @ApiProperty({ example: 0, description: 'Bundle detail id', required: true })
  @IsString()
  cTab?: string;

  @ApiProperty({ example: false, description: 'Bundle tag', required: true })
  @IsBoolean()
  @IsOptional()
  bisAutoassign: boolean;

  @ApiProperty({ example: '', description: 'bundles', required: false })
  @IsString()
  @IsNotEmpty()
  bundle: string;

  @IsItUUID()
  nMasterid?: string;

}


export class updateBundleRes {
  msg: Number;
  value: string;
  error?: any;
  data?: any;
}




export class UserSectionBuildReq {

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsItUUID()
  nSectionid?: string;


  @ApiProperty({ example: '', description: 'Folder Name', required: true })
  @IsString()
  @IsNotEmpty()
  cFolder: string;


  @ApiProperty({ example: '', description: 'Folder Type', required: true })
  @IsString()
  @IsNotEmpty()
  cFoldertype: string;


  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'N', description: 'Permission', required: true })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}




export class downloadSFileReq {

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true })
  @IsString()
  jFolders: string;

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true })
  @IsString()
  jFiles: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  @IsOptional()
  nSectionid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nCaseid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nDTaskid must be a string conforming to the specified constraints', required: true })
  @IsItUUID()
  @IsOptional()
  nDTaskid: string;  // Changed to an array of integers

  @IsItUUID()
  nMasterid?: string;
}

export class downloadChangeSerialReq {
  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  @IsOptional()
  nBundleid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nBundledetailid: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nNIndex: number;  // Changed to an array of integers


  @ApiProperty({ example: '', description: 'nDTaskid must be a number conforming to the specified constraints', required: true })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nDTaskid: number;  // Changed to an array of integers

  @IsItUUID()
  nMasterid?: string;
}




export class downloadSFileRes {
  nBundleid: string;
  nParentBundleid: string;
  nBundledetailid: string;
  cName: string;
  cTab: string;
  cExhibitno: string;
}
