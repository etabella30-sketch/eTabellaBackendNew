import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";



export class AssignBundlesReq {

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle ids as PostgreSQL array string', required: true })
  @IsString()
  jFolders: string;

  @ApiProperty({ example: '{1,2,3}', description: 'Bundle detail ids as PostgreSQL array string', required: true })
  @IsString()
  jFiles: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;
}


export class AssignCustomBundlesReq {

  @ApiProperty({ example: '[[1,`1-2`],[2,`1-2`],[3,`1-2`]]', description: '', required: true })
  @IsString()
  jFiles: string;  // Changed to an array of integers

  @ApiProperty({ example: '', description: 'nBundleid must be a number conforming to the specified constraints', required: true })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @ApiProperty({ example: '', description: 'nSectionid must be a number conforming to the specified constraints', required: true })
  @IsItUUID()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;
}



export class AssignBundlesRes {
  msg: Number;
  value: string;
  error?: any;
  data?: any;
}

export class ViewBundlesReq {
  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid?: string;

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}

export class viewBundlesRes {
  msg: Number;
  value: string;
  error?: any;
  nBundleId?: string;
  cBundlename?: string;
  nSectionid?: string;
}

export class assigncontactReq {
  @ApiProperty({ example: 0, description: 'Contact id', required: false })
  @IsItUUID()
  nContactid?: string;

  @ApiProperty({ example: '[]', description: 'Files id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jFiles?: string;

  @IsItUUID()
  nMasterid?: string;
}

export class ViewContactReq {
  @ApiProperty({ example: '[]', description: 'Bundle id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}



export class assignTaskReq {
  @ApiProperty({ example: 0, description: 'Task id', required: false })
  @IsItUUID()
  nTaskid?: string;

  @ApiProperty({ example: '[]', description: 'Files id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jFiles?: string;

  @IsItUUID()
  nMasterid?: string;
}

export class ViewTaskReq {

  @ApiProperty({ example: 'F', description: 'Task type', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cTasktype?: string;

  @ApiProperty({ example: '[]', description: 'Bundle id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}

export class assignTagReq {
  @ApiProperty({ example: 0, description: 'Tag id', required: false })
  @IsItUUID()
  nTagid?: string;

  @ApiProperty({ example: '[]', description: 'Files id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jFiles?: string;

  @IsItUUID()
  nMasterid?: string;
}


export class unassignTagReq {
  @ApiProperty({ example: 0, description: 'Tag id', required: false })
  @IsItUUID()
  nTagid?: string;

  @ApiProperty({ example: [], description: 'Bundle detail ids', required: false })
  @IsArray()
  @IsString({ each: true })
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}


export class unassignTaskReq {
  @ApiProperty({ example: 0, description: 'Task id', required: false })
  @IsItUUID()
  nTaskid?: string;

  @ApiProperty({ example: [], description: 'Bundle detail ids', required: false })
  @IsArray()
  @IsString({ each: true })
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}


export class unassignContactReq {
  @ApiProperty({ example: 0, description: 'Contact id', required: false })
  @IsItUUID()
  nContactid?: string;

  @ApiProperty({ example: [], description: 'Bundle detail ids', required: false })
  @IsArray()
  @IsString({ each: true })
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}

export class checkAssignBundleExistsReq {

  @ApiProperty({ example: 0, description: 'Section id', required: false })
  @IsItUUID()
  nSectionid?: string;

  @ApiProperty({ example: 0, description: 'Bundle id', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid?: string;

  @ApiProperty({ example: '[]', description: 'Bundle detail ids', required: false })
  @IsString()
  jFiles?: string;

  @IsItUUID()
  nMasterid?: string;
}


export class FileMetadataReq {
  
  @ApiProperty({ example: '[]', description: 'Bundle id', required: false })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  jBDids?: string;

  @IsItUUID()
  nMasterid?: string;
}