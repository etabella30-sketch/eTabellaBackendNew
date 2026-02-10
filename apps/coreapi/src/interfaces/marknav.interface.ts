
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class AllListReq {
  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
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

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;
  
  @IsItUUID()
  nMasterid: string;

}

export class FactListReq {
  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
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

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  
  @IsItUUID()
  nMasterid: string;


}


export class CompanyParams {

  @ApiProperty({ example: 1, description: 'nBundledetailid identifier for the database entry' })
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;
  
  @IsItUUID()
  nMasterid: string;
}

export class FactCompParams {

  @ApiProperty({ example: 1, description: 'nBundledetailid identifier for the database entry' })
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

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;
  
  @IsItUUID()
  nMasterid: string;
}

export class quickMarkParams {

  @ApiProperty({ example: 1, description: 'nBundledetailid identifier for the database entry' })
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


  @ApiProperty({ example: false, description: 'bIsTranscipt', required: true })
  @Transform(({ value }) => value === 'true' || value === true, { toClassOnly: true })
  @IsBoolean()
  bIsTranscipt: boolean;

  @IsItUUID()
  nMasterid: string;
}

export class DocListReq {
  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
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

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  @IsItUUID()
  nMasterid: string;
}


export class FactLinkListReq {
  @ApiProperty({ example: 1, description: 'Bundle detail id identifier for the database entry' })
  @IsItUUID()
  nBundledetailid: string;

  // @ApiProperty({ example: 'ASC', description: 'Sort type identifier for the database entry' })
  // @Transform(({ value }) => value, { toClassOnly: true })
  // @IsString()
  // cSorttype: string;


  // @ApiProperty({ example: 'QF', description: 'Fact type' })
  // @IsOptional()
  // @IsString()
  // cFType?: string;

  @ApiProperty({ example: 'Category', description: 'Sort by identifier for the database entry' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cSortby: string;

  // @ApiProperty({ example: 1, description: 'Page number identifier for the database entry' })
  // @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  // @IsNumber()
  // nPageNumber: number;

  @ApiProperty({ example: 1, description: 'Filter', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000", description: 'User ID', required: true })
  @IsItUUID()
  nUserid: string;

  
  @IsItUUID()
  nMasterid: string;


}
