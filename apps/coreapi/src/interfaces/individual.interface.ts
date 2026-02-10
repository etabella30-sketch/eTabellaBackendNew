import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class fetchTabDataReq {

  @ApiProperty({ example: '[123, 142]', description: 'jFiles', required: true })
  @IsString()
  jFiles: number[];

  // @ApiProperty({ example: [123, 142], description: 'jFiles', required: true })
  // @IsArray()
  // @IsNumber({}, { each: true })
  // @Type(() => Number) // Transform each item in the array to a number
  // jFiles: number[];

  @IsItUUID()
  nMasterid?: string;

}



export class getTabReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: 'N', description: 'cFlag like P/N' })
  @IsString()
  cFlag: string;


  @ApiProperty({ example: '[1,2]', description: 'cFlag like P/N' })
  @IsString()
  jAvoid: string;

  @IsItUUID()
  nMasterid?: string;

}
export class DocinfoReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @IsItUUID()
  nMasterid?: string;

}


export class DocinfoRes {
  nBundledetailid?: string;
  nBundleid?: string;
  cFilename?: string;
  cPath?: any;
  cBundle?: string | null;
  cPage?: string;
  cRefpage?: string;
  cFiletype?: string;
  cTab?: string;
  cExihibitno?: string;
  msg?: number;
  value?: string;
  error?: any;
}



export class updateBundleDetailRotation {

  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: 1, description: 'nRotate' })
  @IsNumber()
  nRotate: number;

  @IsItUUID()
  nMasterid?: string;

}



export class linkexplorerReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @IsItUUID()
  nMasterid?: string;

}








export class updateShareLink {

  @ApiProperty({ example: 1, description: 'nId' })
  @IsItUUID()
  @IsOptional()
  nCaseid: string;

  @ApiProperty({ example: 1, description: 'nId' })
  @IsItUUID()
  nId: string;


  @ApiProperty({ example: '[1,2]', description: 'jUsers' })
  @IsString()
  jUsers: string;


  @ApiProperty({ example: 'F/W/D', description: 'cType' })
  @IsString()
  cType: string;


  @IsItUUID()
  nMasterid?: string;

}










export class locationShareToUsers {


  @ApiProperty({ example: 1, description: 'nBundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: '[1,2]', description: 'jUsers' })
  @IsString()
  jUsers: string;


  @IsItUUID()
  nMasterid?: string;

}





export class hyperlinkFileReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;


  @ApiProperty({ example: 1, description: 'nDocid' })
  @IsOptional()
  @IsItUUID()
  nDocid: string;

  @IsItUUID()
  nMasterid?: string;

}


export class toolbarDataReq {


  @ApiProperty({ example: 1, description: 'Bundledetailid' })
  @IsItUUID()
  nBundledetailid: string;

  @IsItUUID()
  nMasterid?: string;

}