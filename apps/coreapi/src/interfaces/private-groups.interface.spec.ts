import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { PrivateGroupsWrite } from './private-groups.interface';

const base = { nCaseid: '10000000-0000-4000-8000-000000000011', operation: 'create', cName: 'X' };
const errorsFor = (cColor?: unknown) =>
  validateSync(plainToInstance(PrivateGroupsWrite, cColor === undefined ? base : { ...base, cColor }));

describe('PrivateGroupsWrite.cColor', () => {
  it.each(['0066FF', '#0066ff', '#0066FF'])('accepts %s', value => {
    expect(errorsFor(value)).toEqual([]);
  });

  it('accepts a body without cColor', () => {
    expect(errorsFor()).toEqual([]);
  });

  it('accepts an empty string (clears the colour on rename)', () => {
    expect(errorsFor('')).toEqual([]);
  });

  it.each(['FFFF00', '#ffff00', '#f5e642', 'blue', '0066FF00', '#06f', 'GG66FF'])('refuses %s', value => {
    const errors = errorsFor(value);
    expect(errors.length).toBe(1);
    expect(errors[0]!.property).toBe('cColor');
  });

  it('gives the yellow refusal the Unassigned wording', () => {
    const errors = errorsFor('FFFF00');
    expect(Object.values(errors[0]!.constraints ?? {}).join(' ')).toContain('Yellow is kept for Unassigned');
  });
});
