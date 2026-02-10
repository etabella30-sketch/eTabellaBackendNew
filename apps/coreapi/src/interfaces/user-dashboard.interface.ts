import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsUUID } from "class-validator";

export class userCaseListReq {
  
  @ApiProperty({ example: 1, description: '' })
  @Transform(({ value }) => parseInt(value), { toClassOnly: true })
  @IsNumber({}, { message: 'pageNumber must be a number conforming to the specified constraints' })
  pageNumber: Number;

  @IsOptional()
  @IsNumber()
  ref?: Number;

  @IsItUUID()
  nMasterid?: string;
}


export class userCaseListResponce {
  msg: number;
  value?: string;
  error?: any;
  nCaseid?: string;
  cCasename?: string;
  cCaseno?: string;
  dUpdateDt?: string;
}

export class dashInfoReq {

  @IsOptional()
  @IsNumber()
  ref?: Number;

  @IsItUUID()
  nMasterid?: string;
}


