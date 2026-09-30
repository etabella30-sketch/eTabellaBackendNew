import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IssueCategoryRequestBody, IssueRequestBody, UpdateClaimRequestBody } from './issue.interface';

/** The global pipe of main.ts: a key the DTO does not declare is a 400. */
const PIPE = { whitelist: true, forbidNonWhitelisted: true };

async function rejected(dto: new () => object, body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(dto, body) as object, PIPE);
  return errors.flatMap((e) => Object.values(e.constraints ?? {}));
}
const unknownKeys = (messages: string[]) => messages.filter((m) => /should not exist/.test(m));

/**
 * The Issue and Claim forms (document reader, realtime page, workspace) always send their detail
 * fields, null included. While these DTOs did not declare them every create and edit answered 400
 * "property cPriority should not exist" (found live 2026-09-30: the keys had only ever existed in an
 * uncommitted stash).
 */
describe('issue DTOs accept the detail fields of the Issue / Claim forms', () => {
  const CASE = '66666666-6666-4666-8666-666666666666';
  const CLAIM = '77777777-7777-4777-8777-777777777777';

  it.each([
    ['set', { cPriority: 'H', cDispute: 'P', cDescription: 'scope of the issue' }],
    ['cleared', { cPriority: null, cDispute: null, cDescription: null }],
  ])('issue create / edit with details %s', async (_label, details) => {
    const body = { cIName: 'Delay', cColor: 'ff0000', nICid: CLAIM, nCaseid: CASE, ...details };
    expect(unknownKeys(await rejected(IssueRequestBody, body))).toEqual([]);
  });

  it.each([
    ['set', { cColor: '0066ff', cParty: 'Claimant', cDescription: 'scope of the claim' }],
    ['cleared', { cColor: null, cParty: null, cDescription: null }],
  ])('claim create and claim edit with details %s', async (_label, details) => {
    expect(unknownKeys(await rejected(IssueCategoryRequestBody, { cCategory: 'Delay', nCaseid: CASE, ...details }))).toEqual([]);
    expect(unknownKeys(await rejected(UpdateClaimRequestBody, { nICid: CLAIM, cCategory: 'Delay', ...details }))).toEqual([]);
  });

  it('still refuses a value outside the allowed codes and a key nobody declared', async () => {
    const messages = await rejected(IssueRequestBody, { cIName: 'Delay', cPriority: 'X', cSomethingElse: 1 });
    expect(messages.some((m) => /cPriority must be one of/.test(m))).toBe(true);
    expect(unknownKeys(messages)).toEqual(['property cSomethingElse should not exist']);
  });
});
