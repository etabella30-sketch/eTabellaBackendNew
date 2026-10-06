import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { IsUUID } from 'class-validator';
import { absentId, ActorFields, isUuidText, UUID_TEXT_RE } from './actor-fields';
import { SHARED_VALIDATION } from './errors';

const ME = '11111111-1111-4111-8111-111111111111';
const CASE = 'ca5e0000-0000-4000-8000-0000000000c1';

/** A shared query the way a feature declares one: the actor fields plus its own. */
class TeamUsersQuery extends ActorFields {
  @IsUUID()
  nCaseid: string;
}

const pipe = new ValidationPipe(SHARED_VALIDATION);
const run = (value: unknown, metatype: new () => object = TeamUsersQuery) => pipe.transform(value, { type: 'query', metatype, data: undefined });

describe('ActorFields', () => {
  it('lets the legacy identity keys through forbidNonWhitelisted (old clients and JwtMiddleware injection send them)', async () => {
    await expect(run({ nCaseid: CASE, nMasterid: ME, nUserid: ME })).resolves.toEqual({ nCaseid: CASE, nMasterid: ME, nUserid: ME });
    await expect(run({ nCaseid: CASE })).resolves.toEqual({ nCaseid: CASE });
    await expect(run({ nMasterid: ME }, ActorFields)).resolves.toEqual({ nMasterid: ME });
  });

  it('turns "no id" identity values into null without failing', async () => {
    await expect(run({ nCaseid: CASE, nMasterid: '', nUserid: 'null' })).resolves.toEqual({ nCaseid: CASE, nMasterid: null, nUserid: null });
  });

  it('still refuses an identity value that is not an id', async () => {
    await expect(run({ nCaseid: CASE, nMasterid: 'not-an-id' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(run({ nCaseid: CASE, nUserid: 42 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('declares only the two identity keys: any other extra key is still refused', async () => {
    await expect(run({ nCaseid: CASE, nAdminid: ME })).rejects.toBeInstanceOf(BadRequestException);
    await expect(run({ nCaseid: CASE, isAdmin: true })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('is a plain class a DTO can extend while keeping its own rules', async () => {
    await expect(run({ nMasterid: ME })).rejects.toBeInstanceOf(BadRequestException); // nCaseid missing
    await expect(run({ nCaseid: 'nope', nMasterid: ME })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('absentId', () => {
  it.each([undefined, null, '', 0, '0', 'null', 'undefined', false])('%p means "no id"', (value) => {
    expect(absentId(value)).toBe(true);
  });

  it.each(['NULL', '00', ' 0', 'not-an-id', 1, true, CASE])('%p is a value (present, maybe bad)', (value) => {
    expect(absentId(value)).toBe(false);
  });
});

describe('isUuidText', () => {
  it('accepts a UUID string in any case and nothing else', () => {
    expect(isUuidText(CASE)).toBe(true);
    expect(isUuidText(CASE.toUpperCase())).toBe(true);
    expect(isUuidText(`${CASE} `)).toBe(false);
    expect(isUuidText('not-an-id')).toBe(false);
    expect(isUuidText(null)).toBe(false);
    expect(isUuidText(42)).toBe(false);
    expect(isUuidText({ toString: () => CASE })).toBe(false);
    expect(UUID_TEXT_RE.flags).toContain('i');
  });
});
