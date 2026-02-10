import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class pushIssueData {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jCat: string;

  @ApiProperty({ example: '{}', description: 'Delete', required: true })
  @IsString()
  jIssue: string;
}


export class pushIssueDetailData {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jIssue: string;

  @ApiProperty({ example: '{}', description: 'Delete', required: true })
  @IsString()
  jMap: string;
}



export class pushHighlightData {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jHighlights: string;

  @ApiProperty({ example: '{}', description: 'Delete', required: true })
  @IsString()
  jMap: string;
}



export class pushDeleteData {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jDelete: string;

}


export class pushLogData {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jLogs: string;

}


export class sessionsUsers {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jCaseids: string;

}





export class sessionDetailSql {
  @ApiProperty({ example: 0, description: '', required: true })
  @IsString()
  jSDetail: string;

}