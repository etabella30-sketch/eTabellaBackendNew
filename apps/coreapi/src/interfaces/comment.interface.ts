import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CommentManageReq {


  @ApiProperty({ example: 'This is a comment message', description: 'Comment message text' })
  @IsString()
  @IsNotEmpty()
  cMsg: string;

  @ApiProperty({ example: '17017e35-cb39-4af6-b9bf-110bfdf7a95a', description: 'Comment ID (required for Edit/Delete)' })
  @IsOptional()
  @IsItUUID()
  nCid?: string;

  @ApiProperty({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' })
  @IsItUUID()
  nFSid: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'Bundle detail id identifier for the database entry' })
  @IsOptional()
  @IsItUUID()
  nBundledetailid: string;

  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000', description: 'Session ID' })
  @IsOptional()
  @IsItUUID()
  nSesid: string;

  @ApiProperty({ example: 'N', description: 'Permission' })
  @IsString()
  @IsOptional()
  cPermission: string;

  @IsItUUID()
  nMasterid: string;
}

export class CommentCreationRes {
  msg: Number;
  value: string;
  nCid?: string;
  error?: any
}

export class CommentListReq {
  @ApiProperty({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' })
  @IsItUUID()
  nFSid: string;

  @ApiProperty({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' })
  @IsOptional()
  @IsItUUID()
  nCid: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Master User ID' })
  @IsItUUID()
  nMasterid: string;
}

export class CommentUsersReq {
  @ApiProperty({ example: '79d6fa26-7d27-49a3-8204-1e128505b682', description: 'File Session ID' })
  @IsItUUID()
  nFSid: string;

  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', description: 'Master User ID' })
  @IsItUUID()
  nMasterid: string;
}
