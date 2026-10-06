import 'reflect-metadata';
import { IsOptional, IsString } from 'class-validator';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { applyDtoDocs } from './dto-docs';

class SampleDto {
  @IsString()
  cName: string;

  @IsOptional()
  @IsString()
  cNote?: string;

  @IsString()
  cPlain: string;
}

const propertyMeta = (field: string): Record<string, unknown> | undefined =>
  Reflect.getMetadata(`${DECORATORS.API_MODEL_PROPERTIES}`, SampleDto.prototype, field);
const propertyList = (): string[] => Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, SampleDto.prototype) ?? [];

describe('applyDtoDocs (D9a: Swagger docs for the shared DTOs, applied at live boot)', () => {
  beforeAll(() => {
    applyDtoDocs(SampleDto, {
      cName: { example: 'Jane', description: 'Display name' },
      cNote: { example: '', description: 'Free text', required: false },
    });
  });

  it('records exactly what @ApiProperty(options) on the class would have, type inferred from design:type', () => {
    expect(propertyMeta('cName')).toEqual(expect.objectContaining({ example: 'Jane', description: 'Display name', type: String }));
    expect(propertyMeta('cNote')).toEqual(expect.objectContaining({ example: '', description: 'Free text', required: false, type: String }));
  });

  it('leaves a field without docs undocumented and lists only the documented ones', () => {
    expect(propertyMeta('cPlain')).toBeUndefined();
    expect(propertyList().sort()).toEqual([':cName', ':cNote']);
  });

  it('is idempotent: applying the same docs again neither duplicates the property list nor changes the metadata', () => {
    const before = { list: propertyList(), name: propertyMeta('cName') };
    applyDtoDocs(SampleDto, { cName: { example: 'Jane', description: 'Display name' } });
    expect(propertyList()).toEqual(before.list);
    expect(propertyMeta('cName')).toEqual(before.name);
  });
});
