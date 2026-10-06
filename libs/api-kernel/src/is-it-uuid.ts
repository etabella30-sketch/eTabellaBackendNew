/**
 * The nullable-UUID field decorator the DTOs of every app use (moved from libs/global so box-safe DTOs can share it;
 * libs/global re-exports it, so its importers are untouched). Clients send '', 'null', 'undefined' and '0' for "no
 * id": those become null before validation and are not validated, anything else must be a UUID. absentId() in
 * actor-fields.ts is the same rule for raw request values, checked before any DTO exists.
 */
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsUUID, ValidateIf } from 'class-validator';

export function IsItUUID() {
  return applyDecorators(
    Transform(({ value }) => {
      return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }),
    ValidateIf((obj, value) => !!value), // skip validation if falsy (null, undefined, '')
    IsUUID()
  );
}
