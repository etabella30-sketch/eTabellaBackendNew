import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, IsString, isBoolean } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";



export class rolePermissionReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;


  @IsOptional()
  @IsNumber()
  ref?: Number;

}



export class roleStatusReq {
  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsItUUID()
  nRoleid: string;

  @ApiProperty({ example: 'A', description: 'Status', required: false })
  @IsString()
  cStatus: string;

  @IsItUUID()
  nMasterid?: string;
}

export class roleStatusRes {
  msg: number;
  value?: string;
  error?: any;
}





export class roleModuleReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsOptional()
  @IsItUUID()
  nRoleid: string;

  @IsItUUID()
  nMasterid?: string;

}




export class roleModuleRes {
  msg?: Number;
  error?: any;
  value?: string;
  nPMid?: number;
  cModule?: string;
  bValue?: boolean;
}

export class userModuleReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'User id', required: false })
  @IsOptional()
  @IsItUUID()
  nUserid: string;

  @IsItUUID()
  nMasterid?: string;

}

export class userModuleRes {
  msg?: Number;
  error?: any;
  value?: string;
  nPMid?: number;
  cModule?: string;
  bValue?: boolean;
}



export class roleModuleUpdateReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsOptional()
  @IsItUUID()
  nRoleid?: string;

  @ApiProperty({ example: 0, description: 'Userid id', required: false })
  @IsOptional()
  @IsItUUID()
  nUserid?: string;

  @ApiProperty({ example: 0, description: 'Permissin module id', required: false })
  @IsNumber()
  nPMid: number;


  @ApiProperty({ example: false, description: 'Value', required: false })
  @IsBoolean()
  bValue: Number;

  @IsItUUID()
  nMasterid?: string;

}


export class roleModuleUpdateRes {
  msg?: Number;
  error?: any;
  value?: string;
}




export class userPermissionReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;


  @IsItUUID()
  nMasterid?: string;

  @IsOptional()
  @IsNumber()
  ref?: Number;
}





export class userStatusReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'User id', required: false })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 'A', description: 'Status', required: false })
  @IsString()
  cStatus: string;

  @IsItUUID()
  nMasterid?: string;

}




export class userStatusRes {
  msg?: Number;
  error?: any;
  value?: string;
}







export class userQuotaReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'User id', required: false })
  @IsItUUID()
  nUserid: string;

  @ApiProperty({ example: 0, description: 'Quota', required: false })
  @IsNumber()
  nQuota?: Number;

  @IsItUUID()
  nMasterid?: string;

}

export class userQuotaRes {
  msg?: Number;
  error?: any;
  value?: string;
}

export class userPermissionListReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @IsItUUID()
  nMasterid?: string;

}

export class roleModuleResetReq {

  @ApiProperty({ example: 0, description: 'Case id', required: false })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsOptional()
  @IsItUUID()
  nRoleid?: string;

  @ApiProperty({ example: 0, description: 'Userid id', required: false })
  @IsOptional()
  @IsItUUID()
  nUserid?: string;

  @IsItUUID()
  nMasterid?: string;

}