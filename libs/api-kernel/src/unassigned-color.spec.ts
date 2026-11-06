import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { IsOptional, IsString, validateSync } from 'class-validator';
import { isReservedUnassignedColor, NotUnassignedYellow, RESERVED_UNASSIGNED_COLOR_MESSAGE } from './unassigned-color';

class IssueLike {
  @IsString() cIName!: string;
  @IsString() @NotUnassignedYellow('cIName') cColor!: string;
}
class ClaimLike {
  @IsString() cCategory!: string;
  @IsOptional() @IsString() @NotUnassignedYellow('cCategory') cColor?: string | null;
}
const errorsOf = (cls: new () => object, body: object) =>
  validateSync(plainToInstance(cls, body)).flatMap(e => Object.values(e.constraints ?? {}));

describe('the yellow kept for Unassigned (2026-11-06)', () => {
  it('the band: FFFF00 and the pale yellows people picked are in it; amber, orange, olive, blue, grey are not', () => {
    for (const c of ['FFFF00', '#ffff00', 'fcff64', 'fdff6e', 'fff063', 'c2a012', 'ff0']) expect(isReservedUnassignedColor(c)).toBe(true);
    for (const c of ['d98c1a', 'ffd042', 'e07b39', '7a8a3a', '2a6fdb', '8a93a8', 'ffffe0', '8b5e34', '', null, 'nonsense']) {
      expect(isReservedUnassignedColor(c)).toBe(false);
    }
  });

  it('an ordinary issue or claim in the band is refused with the app\'s words', () => {
    expect(errorsOf(IssueLike, { cIName: 'Delay', cColor: 'FFFF00' })).toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
    expect(errorsOf(ClaimLike, { cCategory: 'Quantum', cColor: 'fcff64' })).toContain(RESERVED_UNASSIGNED_COLOR_MESSAGE);
  });

  it('the Unassigned issue / claim itself may be FFFF00; other colours and no colour pass', () => {
    expect(errorsOf(IssueLike, { cIName: 'Unassigned', cColor: 'FFFF00' })).toEqual([]);
    expect(errorsOf(ClaimLike, { cCategory: 'Unassigned', cColor: 'FFFF00' })).toEqual([]);
    expect(errorsOf(IssueLike, { cIName: 'Delay', cColor: '2a6fdb' })).toEqual([]);
    expect(errorsOf(ClaimLike, { cCategory: 'Quantum' })).toEqual([]);
    expect(errorsOf(ClaimLike, { cCategory: 'Quantum', cColor: null })).toEqual([]);
  });
});
