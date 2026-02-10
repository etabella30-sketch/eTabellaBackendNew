import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class workspacefactmdl {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nContactid: string;


  @ApiProperty({ example: 1, description: '' })
  @IsOptional()
  @IsItUUID()
  nIssueid: string;


  
  @ApiProperty({ example: 1, description: '' ,required:false})
  @IsOptional()
  @IsString()
  jFilter: string;


  @ApiProperty({ example: 'ALL/F/QF', description: '' })
  @IsString()
  cFacttype: string;


  @IsItUUID()
  nMasterid?: string;
}



export class workspaceIssueContact {
  @ApiProperty({ example: 1, description: '' })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ example: 1, description: '' ,required:false})
  @IsOptional()
  @IsString()
  jFilter: string;


  @IsItUUID()
  nMasterid?: string;
}