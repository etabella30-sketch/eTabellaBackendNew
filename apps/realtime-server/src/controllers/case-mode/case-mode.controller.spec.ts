import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { Caller } from '@app/api-kernel';
import { DbService } from '@app/global/db/pg/db.service';
import { CaseModeBody, CaseModeController, CaseModeQuery } from './case-mode.controller';

const USER = '10000000-0000-4000-8000-000000000001';
const CASE = '20000000-0000-4000-8000-000000000001';
const caller: Caller = { userId: USER, family: 'cloud-jwt', isPlatformAdmin: false, caseScope: 'membership' };
describe('shared User × Case mode routes', () => {
  it('takes the actor from the verified Caller on both read and write', async () => {
    const executeRef = jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1, cUIMode: 'A' }]] });
    const controller = new CaseModeController({ executeRef } as unknown as DbService);
    await controller.get(caller, { nCaseid: CASE, nMasterid: 'forged', nUserid: 'forged' });
    await controller.set(caller, { nCaseid: CASE, cUIMode: 'A', nMasterid: 'forged', nUserid: 'forged' });
    expect(executeRef.mock.calls).toEqual([
      ['user_case_uimode_get', { nCaseid: CASE, nMasterid: USER }],
      ['user_case_uimode_set', { nCaseid: CASE, cUIMode: 'A', nMasterid: USER }],
    ]);
  });
  it('rejects missing case IDs and invalid mode values', async () => {
    expect(await validate(plainToInstance(CaseModeQuery, {}))).not.toHaveLength(0);
    expect(await validate(plainToInstance(CaseModeBody, { nCaseid: CASE, cUIMode: 'X' }))).not.toHaveLength(0);
    expect(await validate(plainToInstance(CaseModeBody, { nCaseid: CASE, cUIMode: 'E' }))).toHaveLength(0);
  });
  it('does not report an unconfirmed mode when storage fails', async () => {
    const controller = new CaseModeController({ executeRef: jest.fn().mockResolvedValue({ success: false }) } as unknown as DbService);
    expect(await controller.set(caller, { nCaseid: CASE, cUIMode: 'E' })).toEqual({ msg: -1, value: 'Could not confirm the current case mode' });
  });
});
