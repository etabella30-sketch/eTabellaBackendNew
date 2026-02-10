
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class AllListReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSorttype: string;

  @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSortby: string;

  @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nPageNumber: number;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;


  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}

export class FactListReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSorttype: string;


  @ApiProperty({ example: 'QF', description: 'Fact type' })
  @IsOptional()
  @IsString()
  cFType?: string;

  @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSortby: string;

  @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nPageNumber: number;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;


  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}


export class CompanyParams {

  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;
}

export class FactCompParams {

  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 1, description: 'Company id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nCompanyid: string;

  @ApiProperty({ example: 'cSortby', description: 'Sort by identifier for the database entry' })
  @IsOptional()
  @IsString()
  cSortby: string;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;

  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;
}

export class quickMarkParams {

  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSorttype: string;

  @ApiProperty({ example: 'cSortby', description: 'Sort by identifier for the database entry' })
  @IsOptional()
  @IsString()
  cSortby: string;


  @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber()
  nPageNumber: number;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;


  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;

}

export class DocListReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSortby: string;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;


  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;

  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}



export class FactLinkListReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSortby: string;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'true', description: 'History enabled', required: false })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  @IsOptional()
  historyEnabled: boolean;


}


export class HistoryInsertReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'File system ID', required: false })
  @IsOptional()
  @IsItUUID()
  nFSid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'Document ID', required: false })
  @IsOptional()
  @IsItUUID()
  nDocid?: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'History ID', required: false })
  @IsOptional()
  @IsItUUID()
  nHid?: string;

  @ApiProperty({ example: 'read', description: 'Permission level', required: false })
  @IsOptional()
  @IsString()
  cPermission?: string;

  @ApiProperty({ example: 'document', description: 'Type of history entry', required: false })
  @IsString()
  cType: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}

export class HistoryDeleteReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'read', description: 'Permission level', required: false })
  @IsOptional()
  @IsString()
  cPermission?: string;

  @ApiProperty({ example: 'document', description: 'Type of history entry', required: false })
  @IsString()
  cType: string;

  @ApiProperty({ example: '1 W', description: 'Time frame', required: false })
  @IsString()
  cTimeFrame: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}


export class HistoryExistReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'ALL', description: 'Type of history entry', required: false })
  @IsString()
  cType: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}

export class MarknavUserlistReq {
  @ApiProperty({ example: 1, description: 'nSesid identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 'F', description: 'Issue IDs', required: true })
  @IsString()
  cType: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

}


export class MarknavUserlistRes {
  nUserid?: number;
  cFname?: string;
  cLname?: string;
  cProfile?: number;
  msg?: number;
  value?: string;
  error?: any;
}
