import { IsIn, IsOptional, IsString, IsUUID, Length, Matches, registerDecorator, ValidationOptions } from 'class-validator';
import { isReservedUnassignedColor, IsItUUID, RESERVED_UNASSIGNED_COLOR_MESSAGE } from '@app/api-kernel';

/** Refuses a colour in the yellow kept for Unassigned; a private group has no "Unassigned" exemption. */
function NotReservedYellowColour(options?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'notReservedYellowColour',
      target: object.constructor,
      propertyName: String(propertyName),
      options: { message: RESERVED_UNASSIGNED_COLOR_MESSAGE, ...options },
      validator: { validate: (value: unknown): boolean => !isReservedUnassignedColor(value) },
    });
  };
}

export class PrivateGroupsQuery {
  @IsUUID() nCaseid: string;
  // Always replaced by JwtMiddleware; never trust a client-supplied identity.
  @IsOptional() @IsUUID() nMasterid?: string;
}
export class PrivateGroupsWrite extends PrivateGroupsQuery {
  @IsIn(['create', 'rename', 'delete']) operation: 'create' | 'rename' | 'delete';
  @IsOptional() @IsUUID() nGroupid?: string;
  /** The Claim the group belongs to. Absent = leave alone; null or '' = clear. */
  @IsOptional() @IsItUUID() nICid?: string | null;
  @IsOptional() @IsString() @Length(1, 80) cName?: string;
  /** RRGGBB or #RRGGBB; null or '' clears the colour on rename. Absent on rename = keep the stored colour. */
  @IsOptional() @IsString() @Matches(/^(#?[0-9a-fA-F]{6})?$/) @NotReservedYellowColour() cColor?: string;
}
