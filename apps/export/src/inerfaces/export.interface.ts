import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsBoolean, isNumber, IsNumber, IsOptional, IsString } from "class-validator";

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

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  nMasterid?: number;
}


export class ExportProcess {

  @ApiProperty({ example: 1, description: 'Export id' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nExportid must be a number conforming to the specified constraints' })
  nExportid: number;


  @ApiProperty({ example: true, description: 'Is bIsRetry', required: false })
  @IsOptional()
  @IsBoolean()
  bIsRetry?: boolean;

  @IsItUUID()
  nMasterid?: string;
}



export class ExportDataReq {

  @ApiProperty({ example: 1, description: 'Case id' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nCaseid must be a number conforming to the specified constraints' })
  nCaseid: number;

  @ApiProperty({ example: 1, description: 'Export detail id' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nEDid must be a number conforming to the specified constraints' })
  @IsOptional()
  nEDid: number;


  @ApiProperty({ example: 1, description: 'Export id' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nExportid must be a number conforming to the specified constraints' })
  @IsOptional()
  nExportid: number;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  nMasterid?: number;
}

export class FileListResponce {
  nBundledetailid?: number;
  cFilename?: string;
  cTab?: string;
  cPage?: string;
  cExhibitno?: string;
  msg?: number;
  value?: string;
  error?: any;
}


export class ExportResponse {
  nExportid?: number;
  msg?: number;
  value?: string;
  error?: any;
}


export class DownloadpathReq {

  @ApiProperty({ example: '', description: 'is apply to all', required: true })
  @IsString()
  cPath?: string;

  @ApiProperty({ example: '', description: 'is apply to all', required: false })
  @IsString()
  @IsOptional()
  cFilename?: string;
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

  // @ApiProperty({ example: true, description: 'Is Web link' })
  // @IsBoolean()
  // bWeb?: boolean;

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
  @IsString({ each: true })
  jFContact: string[];


  @ApiProperty({ example: [], description: 'Fact issue id`s' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jFIssue: string[];

  @ApiProperty({
    example: ['96614464-c24f-4ab5-871e-bcab5724bf15'],
    description: 'Bundle detail id\'s',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true }) // ✅ ensures each item in the array is a string
  jFiles?: string[];

  @ApiProperty({ example: [], description: 'Pages' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  jPages?: string[];

  @ApiProperty({ example: [], description: 'Quick Fact Contact id`s' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jQFContact?: string[];

  @ApiProperty({ example: [], description: 'Quick Fact issue id`s' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  jQFIssue?: string[];

  @ApiProperty({ example: '', description: 'Case id', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}

export class removeProcess {
  @ApiProperty({ example: 1, description: 'Export id' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nExportid must be a number conforming to the specified constraints' })
  nExportid: number;

  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'nMasterid must be a number conforming to the specified constraints' })
  nMasterid?: number;
}

export class RetryExport {

  @ApiProperty({ example: '1', description: 'Export id' })
  @IsItUUID()
  nExportid: number;

  @IsItUUID()
  nMasterid?: string;

}