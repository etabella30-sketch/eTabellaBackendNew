import { requestedPrivateGroups, savePrivateGroup } from './private-group-save';
const USER = '10000000-0000-4000-8000-000000000001';
const FACT = '20000000-0000-4000-8000-000000000001';
const GROUP = '30000000-0000-4000-8000-000000000001';
describe('Private Group complete-save stage', () => {
 it('uses verified caller identity rather than client nMasterid', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nMasterid: GROUP, nPrivateGroupid: GROUP }, { msg: 1, nFSid: FACT });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, jPrivateGroupids: [GROUP] });
 });
 it.each([{ success: false }, { success: true, data: [[]] }, { success: true, data: [[{ msg: -1, value: 'Refused' }]] }])('refuses partial saves and lets the transaction roll back: %j', async result => {
  await expect(savePrivateGroup({ executeRef: jest.fn().mockResolvedValue(result) } as any, USER, { nPrivateGroupid: GROUP }, { nFSid: FACT })).rejects.toThrow();
 });
 it('says "mark", not "Fact", when the id cannot be identified', async () => {
  const db: any = { executeRef: jest.fn() };
  await expect(savePrivateGroup(db, USER, { nPrivateGroupid: GROUP }, { msg: 1 })).rejects.toThrow('The mark could not be identified');
  expect(db.executeRef).not.toHaveBeenCalled();
 });
 it('clears the association only when null was explicitly sent', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nPrivateGroupid: null, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef.mock.calls[0][1].jPrivateGroupids).toEqual([]);
 });
 it.each([undefined, '', 'other-user'])('requires a verified UUID actor: %j', async actor => {
  const db: any = { executeRef: jest.fn() };
  await expect(savePrivateGroup(db, actor, { nPrivateGroupid: GROUP, nFSid: FACT }, {})).rejects.toThrow();
  expect(db.executeRef).not.toHaveBeenCalled();
 });
});

describe('requestedPrivateGroups', () => {
 const A = '30000000-0000-4000-8000-00000000000a';
 const B = '30000000-0000-4000-8000-00000000000b';
 const C = '30000000-0000-4000-8000-00000000000c';
 it('is undefined when neither key is present', () => { expect(requestedPrivateGroups({})).toBeUndefined(); });
 it('reads the legacy single id: null / empty clears, a uuid is one group', () => {
  expect(requestedPrivateGroups({ nPrivateGroupid: null })).toEqual([]);
  expect(requestedPrivateGroups({ nPrivateGroupid: '' })).toEqual([]);
  expect(requestedPrivateGroups({ nPrivateGroupid: A })).toEqual([A]);
 });
 it('lets the array win over the legacy key', () => {
  expect(requestedPrivateGroups({ jPrivateGroupids: [A, B], nPrivateGroupid: C })).toEqual([A, B]);
  expect(requestedPrivateGroups({ jPrivateGroupids: [] , nPrivateGroupid: C })).toEqual([]);
 });
 it('lower-cases, de-duplicates and keeps first-appearance order', () => {
  expect(requestedPrivateGroups({ jPrivateGroupids: [B.toUpperCase(), A, B, A.toUpperCase()] })).toEqual([B, A]);
 });
 it.each(['x', 5, null, {}, [1], ['x'], [A, 'nope']])('refuses %j', value => {
  expect(() => requestedPrivateGroups({ jPrivateGroupids: value })).toThrow('Choose a valid Private Group');
 });
 it('refuses a bad legacy id', () => {
  expect(() => requestedPrivateGroups({ nPrivateGroupid: 'x' })).toThrow('Choose a valid Private Group');
 });
 it('savePrivateGroup sends the array to the function', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { jPrivateGroupids: [A, B], nFSid: FACT }, { msg: 1 });
  expect(db.executeRef).toHaveBeenCalledWith('private_group_assign', { nMasterid: USER, nFSid: FACT, jPrivateGroupids: [A, B] });
 });
 it('savePrivateGroup turns a legacy null into an empty list', async () => {
  const db: any = { executeRef: jest.fn().mockResolvedValue({ success: true, data: [[{ msg: 1 }]] }) };
  await savePrivateGroup(db, USER, { nPrivateGroupid: null, nFSid: FACT }, { msg: 1 });
  expect(db.executeRef.mock.calls[0][1].jPrivateGroupids).toEqual([]);
 });
});
