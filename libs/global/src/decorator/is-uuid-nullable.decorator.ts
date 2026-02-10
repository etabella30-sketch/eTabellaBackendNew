import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsUUID, ValidateIf } from 'class-validator';

export function IsItUUID() {
  return applyDecorators(
    Transform(({ value }) => {
      return (!value || value === 'null' || value === 'undefined' || value == '0') ? null : value;
    }, { toClassOnly: true }),
    // ValidateIf((obj, value) => !!value), // skip validation if falsy (null, undefined, '')
    IsUUID()
  );
}