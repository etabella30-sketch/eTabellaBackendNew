jest.mock('./fact-create-gate', () => ({ assertCanCreateFact: jest.fn() }));
jest.mock('./mark-write-guards', () => ({
  ...jest.requireActual('./mark-write-guards'),
  assertIssuesInCase: jest.fn(),
  assertTranscriptPosition: jest.fn(),
}));
jest.mock('@app/permissions', () => ({
  ...jest.requireActual('@app/permissions'),
  assertQfactShareWrite: jest.fn(),
  assertCaseModeWrite: jest.fn(),
  assertSameTeamRecipients: jest.fn(),
}));
jest.mock('@app/permissions/share-notifications', () => ({
  ...jest.requireActual('@app/permissions/share-notifications'),
  factShareWriteNotifications: jest.fn(async () => [{ to: 'x' }]),
}));

import { ForbiddenException } from '@nestjs/common';
import { DomainError } from '@app/api-kernel';
import { assertCaseModeWrite, assertQfactShareWrite } from '@app/permissions';
import { factShareWriteNotifications } from '@app/permissions/share-notifications';
import { assertCanCreateFact } from './fact-create-gate';
import { FactService, singleCallSave } from './fact.service';

/**
 * Mark save in one database call (user 2026-11-03: the step-by-step save was ~30 round trips, 1.06 s on live). The same
 * checks run once, in the same order; then a single executeRef of the combined function writes everything.
 */
const ME = '11111111-1111-4111-8111-111111111111';
const CASE = '66666666-6666-4666-8666-666666666666';

function setup(answer: any = { success: true, data: [[{ msg: 1, nFSid: 'F1', color: 'abc' }]] }) {
  const db = { executeRef: jest.fn(async () => answer), rowQuery: jest.fn(async () => ({ success: true, data: [] })) };
  const utility = { sendNotification: jest.fn() };
  const service = new FactService(db as never, utility as never);
  return { db, utility, service };
}
const body = (extra: Record<string, unknown> = {}) => ({ nCaseid: CASE, nMasterid: ME, cFtype: 'QF', jUsers: '[]', jIssues: '[]', ...extra }) as any;
const user = { userId: ME } as any;

beforeEach(() => jest.clearAllMocks());
afterEach(() => { delete process.env.FACT_SAVE_SINGLE_CALL; });

describe('FactService.saveFactSingleCall', () => {
  it('a QFact: checks once, then one call of et_fact_save_quick', async () => {
    const { db, service } = setup();
    await expect(service.saveFactSingleCall('quick', body(), user)).resolves.toEqual({ msg: 1, nFSid: 'F1', color: 'abc' });
    expect(assertCanCreateFact).toHaveBeenCalledTimes(1);
    expect(assertQfactShareWrite).toHaveBeenCalledWith(expect.anything(), 'fact_insert', expect.objectContaining({ nCaseid: CASE }));
    expect(assertCaseModeWrite).toHaveBeenCalledWith(expect.anything(), 'fact_insert', expect.objectContaining({ nCaseid: CASE }));
    expect(db.executeRef).toHaveBeenCalledTimes(1);
    expect(db.executeRef).toHaveBeenCalledWith('fact_save_quick', expect.objectContaining({ jUsers: '[]' }), expect.anything());
  });

  it('a Full Fact calls et_fact_save_full', async () => {
    const { db, service } = setup();
    await service.saveFactSingleCall('full', body({ cFtype: 'F' }), user);
    expect(db.executeRef).toHaveBeenCalledWith('fact_save_full', expect.anything(), expect.anything());
  });

  it('the create gate refuses first: a 403, and nothing else runs', async () => {
    const { db, service } = setup();
    (assertCanCreateFact as jest.Mock).mockRejectedValueOnce(new ForbiddenException('no'));
    await expect(service.saveFactSingleCall('quick', body(), user)).rejects.toBeInstanceOf(ForbiddenException);
    expect(assertCaseModeWrite).not.toHaveBeenCalled();
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('a write check refusal (Essential mode, a shared QFact) answers its words and writes nothing', async () => {
    const { db, service } = setup();
    (assertCaseModeWrite as jest.Mock).mockRejectedValueOnce(new DomainError('forbidden', 'Switch to Advanced'));
    await expect(service.saveFactSingleCall('full', body({ cFtype: 'F' }), user)).resolves.toEqual(
      expect.objectContaining({ msg: -1, value: 'Switch to Advanced' }));
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('the database refuses (any step): msg -1, and it saved nothing (one transaction)', async () => {
    const { service } = setup({ success: false, error: 'invalid input syntax for type uuid' });
    await expect(service.saveFactSingleCall('quick', body(), user)).resolves.toEqual(expect.objectContaining({ msg: -1 }));
  });

  it('share recipients are told, as by insertFactteam for a new fact; an empty list asks nothing', async () => {
    const { service, utility } = setup();
    await service.saveFactSingleCall('full', body({ cFtype: 'F' }), user);
    expect(factShareWriteNotifications).not.toHaveBeenCalled();
    const other = '22222222-2222-4222-8222-222222222222';
    await service.saveFactSingleCall('full', body({ cFtype: 'F', jUsers: JSON.stringify([{ nUserid: other }]) }), user);
    expect(factShareWriteNotifications).toHaveBeenCalledTimes(1);
    expect(utility.sendNotification).toHaveBeenCalledWith([{ to: 'x' }], ME);
  });
});

describe('FACT_SAVE_SINGLE_CALL', () => {
  it('is off unless set to 1', () => {
    expect(singleCallSave()).toBe(false);
    process.env.FACT_SAVE_SINGLE_CALL = 'true';
    expect(singleCallSave()).toBe(false);
    process.env.FACT_SAVE_SINGLE_CALL = '1';
    expect(singleCallSave()).toBe(true);
  });
});
