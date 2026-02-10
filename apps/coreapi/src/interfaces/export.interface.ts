import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, isNumber, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class FileDataReq {
  @ApiProperty({ example: '{}', description: 'Folder ids' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  @IsOptional()
  jFolders: number;

  @ApiProperty({ example: '{}', description: 'File ids' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  @IsOptional()
  jFiles: number;

  @IsItUUID()
  nMasterid?: string;
}


export class ExportProcess {

  @ApiProperty({ example: 1, description: 'Export id' })
  @IsItUUID()
  nExportid: string;

  @IsItUUID()
  nMasterid?: string;
}



export class ExportDataReq {

  @ApiProperty({ example: 1, description: 'Case id' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: 'Export detail id' })
  @IsItUUID()
  @IsOptional()
  nEDid: string;


  @ApiProperty({ example: 1, description: 'Export id' })
  @IsItUUID()
  @IsOptional()
  nExportid: string;


  @ApiProperty({ example: 1, description: 'Sort by' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  @IsOptional()
  cSortby: String;

  @IsItUUID()
  nMasterid?: string;
}

export class FileListResponce {
  nBundledetailid?: string;
  cFilename?: string;
  cTab?: string;
  cPage?: string;
  cExhibitno?: string;
  msg?: number;
  value?: string;
  error?: any;
}


export class ExportResponse {
  nExportid?: string;
  msg?: number;
  value?: string;
  error?: any;
}


export class ExportFilewithAnnot {

  @ApiProperty({ example: 'S', description: 'File type Single/Multiple' })
  @IsString()
  cPdftype?: string;

  @ApiProperty({ example: true, description: 'Is Pagination' })
  @IsBoolean()
  bPagination?: boolean;

  @ApiProperty({ example: true, description: 'is Doc link' })
  @IsBoolean()
  bDoc?: boolean;

  @ApiProperty({ example: true, description: 'Is Fact Link' })
  @IsBoolean()
  bFact?: boolean;

  @ApiProperty({ example: true, description: 'Is Quick fact' })
  @IsBoolean()
  bQfact?: boolean;

  @ApiProperty({ example: true, description: 'Is Cover page' })
  @IsBoolean()
  bCoverpg: boolean;

  @ApiProperty({ example: true, description: 'Is fit to page' })
  @IsBoolean()
  bFitpg?: boolean;



  @ApiProperty({ example: 'S', description: 'Doc link size Small/Normal/Large' })
  @IsString()
  cDsize?: string;

  @ApiProperty({ example: 'S', description: 'Fact link size Small/Normal/Large' })
  @IsString()
  cFsize?: string;

  @ApiProperty({ example: 'S', description: 'Quick Fact link size Small/Normal/Large' })
  @IsString()
  cQFsize?: string;

  @ApiProperty({ example: 'A', description: 'Orientation Auto/All portrait' })
  @IsString()
  cOrientation?: string;


  @ApiProperty({ example: 'A', description: 'Page Size A4/A3/A2' })
  @IsString()
  cPgsize?: string;


  @ApiProperty({ example: 'A', description: 'Transcript' })
  @IsString()
  cTranscript: string;


  @ApiProperty({ example: [], description: 'Fact Contact id`s' })
  @IsArray()
  @IsString({each: true})
  jFContact: string[];


  @ApiProperty({ example: [], description: 'Fact issue id`s' })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  jFIssue: string[];


  @ApiProperty({ example: [], description: 'Bundle detail id`s' })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  jFiles?: string[];

  @ApiProperty({ example: [], description: 'Pages' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  jPages?: number[];

  @ApiProperty({ example: [], description: 'Quick Fact Contact id`s' })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  jQFContact?: string[];

  @ApiProperty({ example: [], description: 'Quick Fact issue id`s' })
  @IsOptional()
  @IsArray()
  @IsString({each: true})
  jQFIssue?: string[];

  @ApiProperty({ example: 1, description: 'Case Id' })
  @IsItUUID()
  nCaseid?: string;

  @IsItUUID()
  nMasterid?: string;
}



export class ExportDeleteReq {

  @ApiProperty({ example: 1, description: 'Case id' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: 'Export detail id' })
  @IsItUUID()
  @IsOptional()
  nEDid: string;


  @ApiProperty({ example: 1, description: 'Export id' })
  @IsItUUID()
  @IsOptional()
  nExportid: string;


  @ApiProperty({ example: 'S', description: 'Type' })
  @Transform(({ value }) => value, { toClassOnly: true })
  @IsString()
  cType: number;

  @IsItUUID()
  nMasterid?: string;
}