import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { IsItUUID } from "@app/global/decorator/is-uuid-nullable.decorator";

export class SignInReq {

  @ApiProperty({ example: 'example@gmail.com', description: '' })
  @IsEmail()
  cEmail: string;

  @ApiProperty({ example: 'your password', description: '' })
  @IsString()
  password: string;


  @ApiProperty({ example: '', description: '' })
  @IsString()
  cBroweserid: string;

  @IsOptional()
  @IsString()
  cToken?: string;

  @IsOptional()
  @IsBoolean()
  bKeepMeLogin?: boolean;
}


export interface SignInResponceUpdate {

  nMasterid: string;
  cToken?: string;
  cJwt: string;
  bResponce: boolean;
}


export interface userDetail {

  nUserid?: string;
  cEmail?: string;
  cFname?: string;
  cLname?: string;
  cProfile?: string;
  isAdmin?: boolean;
}

export interface SignInResponce {
  msg: number;
  value: string;
  error?: any;
  userDetail?: userDetail;
  token?: string;
  expir_limit?: number;
}

export class SignOutReq {
  @ApiProperty({ example: '', description: '' })
  @IsString()
  @IsOptional()
  cBroweserid: string;

  @IsItUUID()
  @IsOptional()
  nMasterid?: string;
}

export class UserInfoReq {
  @IsItUUID()
  @IsOptional()
  nMasterid?: string;

}

export interface SignOutResponce {
  msg: number;
  value: string;
}