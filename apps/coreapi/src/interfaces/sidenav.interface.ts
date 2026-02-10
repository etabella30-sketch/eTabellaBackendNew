import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";





export class fileContact {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @ApiProperty({ example: 'search', description: '', required: false })
  @IsOptional()
  @IsString()
  cSearch: string;

  @IsItUUID()
  nMasterid?: string;
}

export class tasksbyissues {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nIssueid: string;

  @IsItUUID()
  nMasterid?: string;
}



export class sidenaveData {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '', required: false })
  @IsOptional()
  @IsString()
  jFilter: string;

  @IsItUUID()
  nMasterid?: string;
}




export class taskFileReq {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nTaskid: string;


  @IsItUUID()
  nMasterid?: string;
}


export class taskStatusUpdate {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nTaskid: string;

  @ApiProperty({ example: 'C', description: '' })
  @IsString()
  cStatus: string;


  @IsItUUID()
  nMasterid?: string;
}