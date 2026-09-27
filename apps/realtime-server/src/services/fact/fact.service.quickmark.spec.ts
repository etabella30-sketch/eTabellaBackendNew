import { ForbiddenException } from '@nestjs/common';
import { FactService } from './fact.service';

const ME = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';
const HID = '66666666-6666-4666-8666-666666666666';
const CASE = '33333333-3333-4333-8333-333333333333';
const SES = '44444444-4444-4444-8444-444444444444';

function build(owner: any = { success: true, data: [{ nUserid: ME }] }) {
  const db = {
    executeRef: jest.fn().mockResolvedValue({ success: true, data: [{ msg: 1 }] }),
    rowQuery: jest.fn().mockResolvedValue(owner),
  };
  return { svc: new FactService(db as any, {} as any), db };
}

describe('FactService quick marks', () => {
  it('insert owns the mark by the token user, ignoring a client nUserid', async () => {
    const { svc, db } = build();
    await svc.insertHighlights({ nUserid: OTHER, nMasterid: ME, nCaseid: CASE, nSessionid: SES, cNote: 'n', cPageno: '1', cLineno: '2', cTime: '00:00' } as any, 'I', { userId: ME, isAdmin: false });
    expect(db.executeRef).toHaveBeenCalledWith('qmark_handler', expect.objectContaining({ nUserid: ME, permission: 'I' }), 'realtime');
  });

  it('insert refuses without an authenticated user', async () => {
    const { svc, db } = build();
    const res = await svc.insertHighlights({ nUserid: OTHER, cNote: 'n' } as any, 'I', undefined);
    expect(res.msg).toBe(-1);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('insert is 403, and nothing is written, when the caller cannot see the session', async () => {
    const { svc, db } = build({ success: true, data: [] });
    await expect(svc.insertHighlights({ nMasterid: ME, nCaseid: CASE, nSessionid: SES, cNote: 'n' } as any, 'I', { userId: ME, isAdmin: false }))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('delete of someone else\'s mark is 403 and nothing is deleted', async () => {
    const { svc, db } = build({ success: true, data: [{ nUserid: OTHER }] });
    await expect(svc.deleteHighlights({ nHid: HID, nMasterid: ME }, 'D')).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.rowQuery).toHaveBeenCalledWith(expect.stringContaining('"RHighlights"'), [HID]);
    expect(db.executeRef).not.toHaveBeenCalled();
  });

  it('delete of my own mark goes through', async () => {
    const { svc, db } = build({ success: true, data: [{ nUserid: ME.toUpperCase() }] });
    await svc.deleteHighlights({ nHid: HID, nMasterid: ME }, 'D');
    expect(db.executeRef).toHaveBeenCalledWith('qmark_handler', expect.objectContaining({ nHid: HID, permission: 'D' }), 'realtime');
  });

  it('a global admin may delete any mark', async () => {
    const { svc, db } = build({ success: true, data: [{ nUserid: OTHER }] });
    await svc.deleteHighlights({ nHid: HID, nMasterid: ME }, 'D', true);
    expect(db.executeRef).toHaveBeenCalled();
  });

  it('a failed owner lookup does not delete', async () => {
    const { svc, db } = build({ success: false, error: 'x' });
    const res = await svc.deleteHighlights({ nHid: HID, nMasterid: ME }, 'D');
    expect(res.msg).toBe(-1);
    expect(db.executeRef).not.toHaveBeenCalled();
  });
});
