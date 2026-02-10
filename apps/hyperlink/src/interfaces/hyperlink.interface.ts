import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class hyperlinkReq {
  @ApiProperty({ example: '', description: 'nBundledetailid must be a UUID string', required: true })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: '', description: 'nBundleid must be a UUID string', required: false })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @ApiProperty({ example: '', description: 'nSectionid must be a UUID string', required: true })
  @IsItUUID()
  nSectionid: string;


  @ApiProperty({ example: '', description: 'nCaseid must be a UUID string', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: '', description: 'Tab or Exhibitno', required: true })
  @IsString()
  cType: string;

  @ApiProperty({ example: '', description: 'Keeptype', required: true })
  @IsString()
  cKeeptype: string;


  @ApiProperty({ example: '', description: 'Without {}', required: false })
  @IsOptional()
  @IsBoolean()
  isDeepscan: boolean;

  @IsItUUID()
  nMasterid?: string;
}


export class gethyperlinkReq {

  @ApiProperty({ example: '', description: 'nCaseid must be a UUID string', required: true })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;
}



export class hyperlinkProcess {
  queueName: string;
  nCaseid: string;
  nSectionid: string;
  nMasterid: string;
  nBundledetailid: string;
  nBundleid: string;
  cKeeptype: string;
  cType: string;
  nTotal: number;
  nCompleted: number;
  nFailed: number;
  cStatus: 'P' | 'C' | 'F';
  isDeepscan: boolean;
}




export class hyperlinkFiles {
  nBundledetailid: string;
  cFilename: string;
  cPath: string;
}

export class searchedResult {
  page: number;
  cTerm: string;
  height: number;
  width: number;
  x: number;
  y: number;
  prefix: string;
  redirectpage: number;
}