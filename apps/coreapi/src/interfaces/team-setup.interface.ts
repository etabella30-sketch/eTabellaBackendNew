import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEmail, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested, isString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";


export class TeamBuilderReq {

  @ApiProperty({ example: 0, description: 'Team id', required: true })
  @IsOptional()
  @IsItUUID()
  nTeamid: string;


  @ApiProperty({ example: '', description: 'Team Name', required: true })
  @IsString()
  @IsNotEmpty()
  cTeamname: string;

  @ApiProperty({ example: '', description: 'Team Color', required: true })
  @IsString()
  @IsNotEmpty()
  cClr: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  @IsNotEmpty()
  nCaseid: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  @IsNotEmpty()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}



export class TeamBuilderRes {
  msg: Number;
  value: string;
  nTeamid?: string
  error?: any
}





export class TeamDeleteReq {

  @ApiProperty({ example: 0, description: 'Team id', required: true })
  @IsItUUID()
  nTeamid: string;

  @ApiProperty({ example: '', description: 'Permission', required: true })
  @IsString()
  @IsOptional()
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}



export class TeamDeleteRes {
  msg: Number;
  value: string;
  nTeamid?: string
  error?: any
}

export class UserBuilderReq {

  @ApiProperty({ example: 0, description: 'User id', required: true })
  @IsOptional()
  @IsItUUID()
  nUserid: string;


  @ApiProperty({ example: '', description: 'First Name', required: true })
  @IsString()
  @IsNotEmpty()
  cFname: string;

  @ApiProperty({ example: '', description: 'Last Name', required: true })
  @IsString()
  @IsNotEmpty()
  cLname: string;

  @ApiProperty({ example: '', description: 'Email', required: true })
  @IsEmail()
  cEmail: Number;

  @ApiProperty({ example: '', description: 'Password', required: false })
  @IsOptional()
  @IsString()
  cPassword: string;

  @ApiProperty({ example: '', description: 'Profile', required: true })
  @IsString()
  @IsOptional()
  cProfile: string;

  @ApiProperty({ example: 0, description: 'Timezone', required: true })
  @IsNumber()
  @IsNotEmpty()
  nTZid: Number;

  @ApiProperty({ example: 0, description: 'Role id', required: false })
  @IsItUUID()
  @IsOptional()
  nRoleid: string;

  @ApiProperty({ example: 0, description: 'Case id', required: true })
  @IsItUUID()
  @IsOptional()
  nCaseid: string;


  @ApiProperty({ example: 0, description: 'Team id', required: false })
  @IsItUUID()
  @IsOptional()
  nTeamid: string;

  @ApiProperty({ example: 'E', description: "'N' create / 'E' edit (delete is team-setup/userdelete)", required: true })
  @IsString()
  @IsIn(['N', 'E'])
  permission: string;

  @IsItUUID()
  nMasterid?: string;

}

export class UserBuilderRes {
  msg: Number;
  value: string;
  nUserid?: string;
  nTeamid?: string;
  error?: any;
}


class UserDetail {
  @ApiProperty({ example: 0, description: 'User ID', required: true })
  @IsItUUID()
  u: string;

  @ApiProperty({ example: 0, description: 'Team ID', required: true })
  @IsItUUID()
  t: string;
}

export class teamSetup {
  @ApiProperty({ example: 0, description: 'Case ID', required: true })
  @IsItUUID()
  nCaseid: string;

  @ApiProperty({ type: [UserDetail], description: 'User Details', required: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserDetail)
  jUsers: UserDetail[];

  @IsItUUID()
  nMasterid?: string;
}

export class teamSetupRes {
  msg: Number;
  value: string;
  error?: any;
}


export class UserDeleteReq {
  @ApiProperty({ example: 0, description: '' })
  @IsItUUID()
  nUserid: string;

  @IsItUUID()
  nMasterid?: string;

  @ApiProperty({ example: 'D', description: '' })
  @IsString()
  @IsIn(['D'])
  permission: string;
}


export class UserDeleteRes {
  msg: Number;
  value: string;
  error?: any;
}


export class TeamcolorRes {
  cClr?: string;
  msg?: Number;
  value?: string;
  error?: any;
}



/** POST team-setup/uimode — the caller switches their own UI mode. */
export class UiModeReq {

  @ApiProperty({ example: 'E', description: "UI mode: 'E' Essential / 'A' Advanced", required: true })
  @IsString()
  @IsIn(['E', 'A'])
  cUIMode: 'E' | 'A';

  /** Injected from the JWT by the middleware — never trusted from the client. */
  @IsOptional()
  @IsItUUID()
  nMasterid?: string;
}

export class UiModeRes {
  msg: number;
  value: string;
  cUIMode?: 'E' | 'A' | null;
  error?: any;
}
