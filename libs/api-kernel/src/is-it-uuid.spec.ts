import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsItUUID as LegacyIsItUUID } from '@app/global/decorator/is-uuid-nullable.decorator';
import { IsItUUID } from './is-it-uuid';

// The same table realtime-server's edge-token spec checks against absentId: "no id" values become null and pass,
// everything else must be a UUID.

class Dto {
  @IsItUUID()
  nCaseid?: string;
}

const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';

describe('IsItUUID', () => {
  it.each([undefined, null, '', 0, '0', 'null', 'undefined', false])('turns %p into "no id" and skips validation', async (value) => {
    const dto = plainToInstance(Dto, { nCaseid: value });
    expect(dto.nCaseid == null).toBe(true);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it.each(['NULL', '00', ' 0', 'not-an-id', 1, true, `${CASE}x`])('keeps %p and fails validation', async (value) => {
    const dto = plainToInstance(Dto, { nCaseid: value });
    expect(dto.nCaseid).toEqual(value);
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(Object.keys(errors[0].constraints)).toEqual(['isUuid']);
  });

  it.each([CASE, CASE.toUpperCase()])('keeps a UUID %s and passes', async (value) => {
    const dto = plainToInstance(Dto, { nCaseid: value });
    expect(dto.nCaseid).toBe(value);
    await expect(validate(dto)).resolves.toEqual([]);
  });

  it('transforms toClassOnly: an instance keeps its value on the way out', () => {
    const dto = plainToInstance(Dto, { nCaseid: CASE });
    expect(dto).toBeInstanceOf(Dto);
    expect(dto.nCaseid).toBe(CASE);
  });

  it('is what the libs/global path still exports, so its ~60 importers see one decorator', () => {
    expect(LegacyIsItUUID).toBe(IsItUUID);
  });
});
