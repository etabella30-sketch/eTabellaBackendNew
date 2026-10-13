import { savePrivateGroup } from './private-group-save';
const USER = '10000000-0000-4000-8000-000000000001';
const FACT = '20000000-0000-4000-8000-000000000001';
const GROUP = '30000000-0000-4000-8000-000000000001';
describe('Private Group complete-save stage', () => {
 it('uses verified caller identity rather than client nMasterid', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nMasterid: GROUP, nPrivateGroupid: GROUP }, { msg: 1, nFSid: FACT });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, nPrivateGroupid: GROUP });
 });
 it.each([{ success: false }, { success: true, data: [[]] }, { success: true, data: [[{ msg: -1, value: 'Refused' }]] }])('refuses partial saves and lets the transaction roll back: %j', async result => {
  await expect(savePrivateGroup({ executeRef: jest.fn().mockResolvedValue(result) } as any, USER, { nPrivateGroupid: GROUP }, { nFSid: FACT })).rejects.toThrow();
 });
 it('clears the association only when null was explicitly sent', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nPrivateGroupid: null, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef.mock.calls[0][1].nPrivateGroupid).toBeNull();
 });
 it.each([undefined, '', 'other-user'])('requires a verified UUID actor: %j', async actor => {
  const db: any = { executeRef: jest.fn() };
  await expect(savePrivateGroup(db, actor, { nPrivateGroupid: GROUP, nFSid: FACT }, {})).rejects.toThrow();
  expect(db.executeRef).not.toHaveBeenCalled();
 });
});
