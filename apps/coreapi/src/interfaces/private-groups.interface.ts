import { IsIn, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class PrivateGroupsQuery {
  @IsUUID() nCaseid: string;
  // Always replaced by JwtMiddleware; never trust a client-supplied identity.
  @IsOptional() @IsUUID() nMasterid?: string;
}
export class PrivateGroupsWrite extends PrivateGroupsQuery {
  @IsIn(['create', 'rename', 'delete']) operation: 'create' | 'rename' | 'delete';
  @IsOptional() @IsUUID() nGroupid?: string;
  @IsOptional() @IsString() @Length(1, 80) cName?: string;
}
