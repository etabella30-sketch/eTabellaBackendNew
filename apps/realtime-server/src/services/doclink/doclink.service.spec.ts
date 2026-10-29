import { ForbiddenException } from '@nestjs/common';
import { DoclinkService } from './doclink.service';
import { resetMarkDedupe } from '../fact/mark-dedupe';

jest.mock('./doclink-create-gate', () => ({ assertCanCreateDocLink: jest.fn(async () => undefined) }));

// Each test is its own gesture: the 10 s duplicate window must not carry over.
afterEach(() => resetMarkDedupe());

describe('DoclinkService deletion', () => {
  const user = '11111111-1111-4111-8111-111111111111';
  const doc = '22222222-2222-4222-8222-222222222222';
  const db = { rowQuery: jest.fn(), executeRef: jest.fn() };
  const service = new DoclinkService(db as never, {} as never);
  const body = { nDocid: doc, nMasterid: user } as never;

  beforeEach(() => jest.resetAllMocks());

  it('refuses deletion without ownership and never calls the write procedure', async () => {
    db.rowQuery.mockResolvedValue({ success: true, data: [{ bAllowed: false }] });
    await expect(service.docDelete(body)).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('returns the database failure to an authorized owner', async () => {
    db.rowQuery.mockResolvedValue({ success: true, data: [{ bAllowed: true }] });
    db.executeRef.mockResolvedValue({ success: false, error: 'database unavailable' });
    await expect(service.docDelete(body)).resolves.toEqual({ msg: -1, value: 'Delete failed', error: 'database unavailable' });
    expect(db.executeRef).toHaveBeenCalledWith('doc_delete', body, 'realtime');
  });
});

describe('DoclinkService insertDoc share notices (R3-003)', () => {
  const ME = '11111111-1111-4111-8111-111111111111';
  const FRIEND = '33333333-3333-4333-8333-333333333333';
  const DOC = '22222222-2222-4222-8222-222222222222';
  const db = { rowQuery: jest.fn(async () => ({ success: true, data: [] })), executeRef: jest.fn() };
  const utility = { sendNotification: jest.fn() };
  const service = new DoclinkService(db as never, utility as never);
  const user = { userId: ME, isAdmin: false } as never;
  const inserted = (jNotify: unknown) => ({ success: true, data: [[{ msg: 1, nDocid: DOC, jNotify }]] });

  beforeEach(() => { db.executeRef.mockReset(); utility.sendNotification.mockReset(); });

  it('a private DocLink (jNotify []) sends nothing; a missing jNotify is the same', async () => {
    db.executeRef.mockResolvedValueOnce(inserted([]));
    await expect(service.insertDoc({ nMasterid: ME, jUsers: '[]' } as never, user)).resolves.toEqual({ msg: 1, value: 'Doc inserted successfully', nDocid: DOC });
    db.executeRef.mockResolvedValueOnce({ success: true, data: [[{ msg: 1, nDocid: DOC }]] });
    await service.insertDoc({ nMasterid: ME, jUsers: '[]' } as never, user);
    expect(utility.sendNotification).not.toHaveBeenCalled();
  });

  it('the creator is never told about his own DocLink, even when the SP listed him; the other recipients are', async () => {
    const mine = { nUserid: ME.toUpperCase(), cType: 'DS', nDocid: DOC, cTitle: 'DocLink shared with you' };
    const theirs = { nUserid: FRIEND, cType: 'DS', nDocid: DOC, cTitle: 'DocLink shared with you' };
    db.executeRef.mockResolvedValueOnce(inserted([mine, theirs]));
    await service.insertDoc({ nMasterid: ME, jUsers: JSON.stringify([{ nUserid: ME }, { nUserid: FRIEND }]) } as never, user);
    expect(utility.sendNotification).toHaveBeenCalledTimes(1);
    expect(utility.sendNotification).toHaveBeenCalledWith([theirs], ME);
    db.executeRef.mockResolvedValueOnce(inserted([mine]));
    await service.insertDoc({ nMasterid: ME, jUsers: JSON.stringify([{ nUserid: ME }]) } as never, user);
    expect(utility.sendNotification).toHaveBeenCalledTimes(1);
  });
});
