import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class caseDetailMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}


export class sectionDetailMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;

}




export class bundleDetailMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @IsItUUID()
  nMasterid?: string;


}






export class checkDuplicacyMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;


  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nUPid: string;

  @ApiProperty({ example: [[1, 2, 'dsf', true]], description: '' })
  @IsString()
  d: string;

  @IsItUUID()
  nMasterid?: string;


}


export class uploadLogMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nSectionid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nBundleid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsNumber()
  nTotal: number;

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nUPid: string;

  @ApiProperty({ example: [[1, 2, 'dsf', true]], description: '' })
  @IsString()
  d: string;

  @IsItUUID()
  nMasterid?: string;


}



export class uploadSummaryMDL {
  @ApiProperty({ example: 0, description: '', required: false })
  @IsOptional()
  @IsItUUID()
  nUPid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 'C', description: '', required: false })
  @IsOptional()
  @IsString()
  cStatus: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  cSearch: string;


  @ApiProperty({ example: '', description: '', required: false })
  @IsOptional()
  @IsString()
  dDate: string;


  @ApiProperty({ example: 'PDF', description: '', required: false })
  @IsOptional()
  @IsString()
  cFiletype: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  @IsOptional()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;

}




export class uploadDetailMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nUPid: string;


  @ApiProperty({ example: 'C', description: '' })
  @IsOptional()
  @IsString()
  cStatus: string;



  @ApiProperty({ example: '', description: '' })
  @IsOptional()
  @IsString()
  dDate: string;


  @ApiProperty({ example: 'PDF', description: '' })
  @IsOptional()
  @IsString()
  cFiletype: string;



  @IsItUUID()
  nMasterid?: string;

}







export class replaceMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nUDid: string;


  @ApiProperty({ example: '', description: '' })
  @IsString()
  cName: string;


  @ApiProperty({ example: '', description: '' })
  @IsString()
  cSize: string;

  @ApiProperty({ example: '', description: '' })
  @IsString()
  cType: string;

  @ApiProperty({ example: '', description: '', required: false })
  @IsString()
  @IsOptional()
  cStatus: string;


  @IsItUUID()
  nMasterid?: string;


}


export class convertRes {
  cStatus: 'C' | 'F';
  nBundledetailid: string;
}





export class clearCompleteMDL {


  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  @IsOptional()
  nSectionid: string;

  @IsItUUID()
  nMasterid?: string;


}


export class ocrdataMDL {

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nUDid: string;

  @IsItUUID()
  nMasterid?: string;


}