import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { InsertFact, InsertFactV2, InsertQuickFact, InsertQuickFactV2 } from './fact.interface';

const U1 = '10000000-0000-4000-8000-0000000000a1';
const U2 = '10000000-0000-4000-8000-0000000000a2';
const many = Array.from({ length: 51 }, (_, i) => `10000000-0000-4000-8000-${String(i).padStart(12, '0')}`);

describe.each([InsertFact, InsertFactV2, InsertQuickFact, InsertQuickFactV2])('%p jPrivateGroupids', cls => {
  const bad = (value: unknown) =>
    validateSync(plainToInstance(cls as any, { jPrivateGroupids: value }) as object).filter(e => e.property === 'jPrivateGroupids');
  it.each([[[]], [[U1, U2]]])('accepts %j', value => {
    expect(bad(value)).toEqual([]);
  });
  it('accepts the key absent', () => {
    expect(validateSync(plainToInstance(cls as any, {}) as object).filter(e => e.property === 'jPrivateGroupids')).toEqual([]);
  });
  it.each([['x'], [[1]], [['x']], [many]])('refuses %j', value => {
    expect(bad(value).length).toBe(1);
  });
});
