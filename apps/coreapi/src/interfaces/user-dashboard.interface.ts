import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsISO8601, IsInt, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from "class-validator";

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

/** GET user-dashboard/activity — the dashboard's Activity feed across the caller's cases. */
export class activityFeedReq {

  /** Overwritten with the token's user by JwtMiddleware. */
  @IsItUUID()
  nMasterid?: string;

  @ApiProperty({ required: false, example: 30, description: 'Rows per page (1-50, default 30)' })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiProperty({ required: false, description: 'Cursor: the previous page\'s last occurredAt (ISO 8601)' })
  @IsOptional()
  @IsISO8601()
  before?: string;

  @ApiProperty({ required: false, description: 'Cursor: the previous page\'s last id' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z]+:[0-9A-Za-z:-]+$/)
  beforeId?: string;
}

export class dashInfoReq {

  @IsOptional()
  @IsNumber()
  ref?: Number;

  @IsItUUID()
  nMasterid?: string;
}


